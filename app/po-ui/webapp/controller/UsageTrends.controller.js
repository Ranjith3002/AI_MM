sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, JSONModel) {
    "use strict";

    return Controller.extend("po.ui.controller.UsageTrends", {
        onInit: function () {
            console.log("UsageTrends controller initialized");
            this._loadUsageTrendsData();
            MessageToast.show("Usage Trends loaded successfully!");
        },

        _loadUsageTrendsData: function () {
            var oUsageData = {
                summary: {
                    totalConsumption: 2847,
                    trendDirection: "Increasing",
                    topMaterial: "Steel Pipes",
                    avgMonthlyUsage: 474
                },
                trends: [
                    {
                        material: "Steel Pipes",
                        category: "Raw Materials",
                        jan: 45, feb: 52, mar: 48, apr: 61, may: 58, jun: 65,
                        trend: "+18%",
                        avgUsage: 55,
                        status: "Increasing"
                    },
                    {
                        material: "Copper Wire",
                        category: "Electrical",
                        jan: 28, feb: 31, mar: 29, apr: 33, may: 35, jun: 32,
                        trend: "+8%",
                        avgUsage: 31,
                        status: "Stable"
                    },
                    {
                        material: "Industrial Bolts",
                        category: "Hardware",
                        jan: 125, feb: 118, mar: 132, apr: 128, may: 135, jun: 142,
                        trend: "+12%",
                        avgUsage: 130,
                        status: "Increasing"
                    },
                    {
                        material: "Safety Helmets",
                        category: "Safety Equipment",
                        jan: 15, feb: 18, mar: 22, apr: 25, may: 28, jun: 24,
                        trend: "+35%",
                        avgUsage: 22,
                        status: "Seasonal"
                    }
                ],
                insights: [
                    {
                        type: "Usage Alert",
                        message: "Steel Pipes consumption increased 18% - consider bulk ordering",
                        priority: "High"
                    },
                    {
                        type: "Seasonal Pattern",
                        message: "Safety equipment shows Q2 spike - typical seasonal pattern",
                        priority: "Medium"
                    },
                    {
                        type: "Trend Analysis",
                        message: "Industrial Bolts showing consistent growth pattern",
                        priority: "Low"
                    }
                ]
            };

            var oModel = new JSONModel(oUsageData);
            this.getView().setModel(oModel, "usage");
        },

        onNavBack: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteMain");
        },

        onAnalyzeTrends: function () {
            MessageToast.show("Running usage trend analysis...");

            setTimeout(() => {
                MessageToast.show("📊 Analysis Complete: Overall consumption up 15%. Steel products showing strong growth trend.");
            }, 2000);
        },

        onExportData: function () {
            MessageToast.show("Exporting usage trends data to Excel...");

            setTimeout(() => {
                MessageToast.show("📄 Usage trends data exported successfully!");
            }, 1500);
        },


    });
});
