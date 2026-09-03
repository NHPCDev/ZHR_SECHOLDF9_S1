sap.ui.define([
    "com/nhpc/zhrsecholdf9s1/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/export/Spreadsheet",
    "sap/ui/core/Fragment",
    "sap/ui/core/ValueState",
    "com/nhpc/zhrsecholdf9s1/utils/formatter",
    "com/nhpc/zhrsecholdf9s1/utils/messenger",
    "sap/ui/core/BusyIndicator",
], (BaseController, Filter, FilterOperator, Spreadsheet, Fragment, ValueState, formatter, messenger, BusyIndicator) => {
    "use strict";

    return BaseController.extend("com.nhpc.zhrsecholdf9s1.controller.Dashboard", {
        formatter: formatter,
        onInit() {
            this.getRouter().getRoute("RouteDashboard").attachPatternMatched(this._onRoutePatternMatched, this);
        },
        _onRoutePatternMatched: function (oEvent) {
            this.getModel().refresh();
            const oTable = this.byId("idDashboardTable");
            const oBinding = oTable.getBinding("items");
            oBinding.attachEventOnce("dataReceived", () => {
                const iCount = oBinding.getLength();
                this.getModel("viewModel").setProperty("/dashboardCount", iCount);
            });
        },

        onDashboardTableUpdateFinish: function (oEvent) {
            var oResourceBundle = this.getResourceBundle(),
                iCount = oEvent.getParameter("total");
            var sTitle = oResourceBundle.getText("dashboardTableTitle") + " (" + iCount + ")";
            this.byId("dashBoardTitle").setText(sTitle);
        },
        onCreate: function () {
            this.getRouter().navTo("RouteDetail", {
                Sno: "New",
                Pernr: "New"
            });
        },
        onListItemPress: async function (oEvent) {
            // await this.resetModel();
            var oObject = oEvent.getSource()
                .getBindingContext()
                .getObject();

            this.getRouter().navTo("RouteDetail", {
                Sno: oObject.Sno,
                Pernr: oObject.Pernr
            });
        },
        onSearchBtn: function (oEvent) {
            var oTable = this.byId("idDashboardTable");
            let oFilterData = this._getTableFilters();
            oTable.getBinding("items").filter(oFilterData.aFilters);
            const oBinding = oTable.getBinding("items");
            oBinding.attachEventOnce("dataReceived", () => {
                const iCount = oBinding.getLength();
                this.getModel("viewModel").setProperty("/dashboardCount", iCount);
            });
        },

        _getTableFilters: function (oEvent) {
            var oViewModel = this.getModel("viewModel"),
                oFilterData = oViewModel.getProperty("/filterData"),
                aSearchFilter = [];
            if (oFilterData.Pernr) {
                let aFilters = [];
                aFilters.push(new Filter("Pernr", FilterOperator.EQ, oFilterData.Pernr));
                aSearchFilter.push(new Filter({
                    filters: aFilters,
                    and: false
                }));
            }
            if (oFilterData.Sno) {
                let aFilters = [];
                aFilters.push(new Filter("Sno", FilterOperator.Contains, oFilterData.Sno));
                aSearchFilter.push(new Filter({
                    filters: aFilters,
                    and: false
                }));
            }
            if (oFilterData.ConfirmedOn) {
                let aFilters = [];
                aFilters.push(new Filter("ConfirmedOn", FilterOperator.EQ, oFilterData.ConfirmedOn));
                aSearchFilter.push(new Filter({
                    filters: aFilters,
                    and: false
                }));
            }
            if (oFilterData.Status) {
                let aFilters = [];
                aFilters.push(new Filter("Status", FilterOperator.EQ, oFilterData.Status));
                aSearchFilter.push(new Filter({
                    filters: aFilters,
                    and: false
                }));
            }
            return {
                aFilters: aSearchFilter.length
                    ? [new Filter({
                        filters: aSearchFilter,
                        and: true
                    })]
                    : []
            }
        },
        onDownload: function () {
            var oTable = this.byId("idDashboardTable");
            var oBinding = oTable.getBinding("items");
            var aData = oBinding.getContexts().map(function (oContext) {
                var oData = Object.assign({}, oContext.getObject());
                oData.CreatedOn = formatter.formatDate(oData.CreatedOn);
                oData.ConfirmedOn = formatter.formatDate(oData.ConfirmedOn);
                return oData;
            });
            var aCols = this.createColumnConfig();
            var oSettings = {
                workbook: {
                    columns: aCols
                },
                dataSource: aData,
                fileType: "xlsx",
                fileName: this.getResourceBundle().getText("title")
            };
            var oSheet = new Spreadsheet(oSettings);
            oSheet.build()
                .finally(function () {
                    oSheet.destroy();
                });
        },
        createColumnConfig: function () {
            var aCols = [];
            aCols.push({
                label: this.getResourceBundle().getText("sno"),
                property: "Sno"
            });
            aCols.push({
                label: this.getResourceBundle().getText("employeeID"),
                property: "Pernr"
            });
            aCols.push({
                label: this.getResourceBundle().getText("employeeNameLabel"),
                property: "EmployeeName"
            });
            aCols.push({
                label: this.getResourceBundle().getText("createdOn"),
                property: "CreatedOn",
            });
            aCols.push({
                label: this.getResourceBundle().getText("ConfirmedOn"),
                property: "ConfirmedOn",
            });
            aCols.push({
                label: this.getResourceBundle().getText("ConfirmedBy"),
                property: "EmployeeName"
            });
            aCols.push({
                label: this.getResourceBundle().getText("status"),
                property: "Status"
            });
            return aCols;
        },
        onValueHelpRequest: async function (oEvent) {
            this._oInput = oEvent.getSource();
            if (!this._oValueHelpDialog) {
                this._oValueHelpDialog = await Fragment.load({
                    id: this.getView().getId(),
                    name: "com.nhpc.zhrsecholdf9s1.fragment.EmployeeValueHelp",
                    controller: this
                });
                this.getView().addDependent(this._oValueHelpDialog);
            }
            this._oValueHelpDialog.open();
        },
        onValueHelpSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new Filter(
                "Empid",
                FilterOperator.Contains,
                sValue
            );
            var oFilter2 = new Filter(
                "FullName",
                FilterOperator.Contains,
                sValue
            );
            var oCombinedFilter = new Filter({
                filters: [oFilter, oFilter2],
                and: false
            });
            oEvent.getSource().getBinding("items").filter([oCombinedFilter]);
        },
        onValueHelpClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                this._oInput.setValue(oSelectedItem.getTitle());
                this.getModel("viewModel").setProperty("/filterData/Pernr", oSelectedItem.getTitle());
            }
        }
    });
});