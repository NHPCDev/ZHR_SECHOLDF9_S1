sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/nhpc/zhrsecholdf9s1/model/models",
    "com/nhpc/zhrsecholdf9s1/utils/messenger",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
], (UIComponent, models, messenger, Filter, FilterOperator) => {
    "use strict";

    return UIComponent.extend("com.nhpc.zhrsecholdf9s1.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init: async function () {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");
            this.setModel(models.createViewModel(), "viewModel");
            const oViewModel = this.getModel("viewModel");
            const oToday = new Date();
            const sToday = String(oToday.getDate()).padStart(2, "0") + "." +
                String(oToday.getMonth() + 1).padStart(2, "0") + "." +
                oToday.getFullYear();
            oViewModel.setProperty("/todayDate", sToday);
            // const iYear = oToday.getFullYear();
            // const iMonth = oToday.getMonth();
            // let oFinancialYearStart;
            // if (iMonth >= 3) {
            //     // April - December
            //     oFinancialYearStart = new Date(iYear, 3, 1);
            // } else {
            //     // January - March
            //     oFinancialYearStart = new Date(iYear - 1, 3, 1);
            // }
            // oToday.setHours(0, 0, 0, 0);
            // oViewModel.setProperty("/financialYearStart", oFinancialYearStart);
            // oViewModel.setProperty("/financialYearEnd", oToday);
            const oComponentData = this.getComponentData();
            const oStartupParameters = oComponentData?.startupParameters;

            const sSelectedYear =
                oStartupParameters?.selectedYear?.[0];

            let oFinancialYearStart;
            let oFinancialYearEnd;

            if (sSelectedYear) {

                // Example: "2025 - 2026"
                const [sStartYear, sEndYear] = sSelectedYear
                    .split("-")
                    .map(sYear => parseInt(sYear.trim(), 10));

                oFinancialYearStart = new Date(sStartYear, 3, 1);
                oFinancialYearEnd = new Date(sEndYear, 2, 31);

                oViewModel.setProperty("/selectedYear", sSelectedYear);

            } else {

                // Current financial year
                const iYear = oToday.getFullYear();
                const iMonth = oToday.getMonth();

                if (iMonth >= 3) {
                    oFinancialYearStart = new Date(iYear, 3, 1);
                    oFinancialYearEnd = oToday;
                } else {
                    oFinancialYearStart = new Date(iYear - 1, 3, 1);
                    oFinancialYearEnd = oToday;
                }
            }

            oViewModel.setProperty("/financialYearStart", oFinancialYearStart);
            oViewModel.setProperty("/financialYearEnd", oFinancialYearEnd);

            await this._checkEligibility();

            // enable routing
            this.getRouter().initialize();
            messenger.init(this);
        },
        _checkEligibility: async function () {
            var oModel = this.getModel();
            var aFilters = [
                new Filter("ApprovalFlag", FilterOperator.EQ, "R")
            ];
            await oModel.read("/CheckAuthSet", {
                filters: aFilters,
                success: function (oResponse) {
                    if (oResponse.results && oResponse.results.length > 0 && oResponse.results[0].AuthResponse === "No") {
                        this.getRouter().initialize();
                        this.getRouter().navTo("RouteErrorPage");

                    }
                }.bind(this),
                error: function () {
                    this.getRouter().initialize();
                }.bind(this)
            });

        }
    });
});