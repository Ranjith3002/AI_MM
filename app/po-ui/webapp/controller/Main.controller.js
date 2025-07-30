sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Label",
    "sap/m/Text",
    "sap/m/ObjectNumber",
    "sap/m/ObjectStatus",
    "sap/m/Button",
    "sap/m/Panel"
], function (Controller, MessageToast, MessageBox, Dialog, VBox, HBox, Label, Text, ObjectNumber, ObjectStatus, Button, Panel) {
    "use strict";

    return Controller.extend("po.ui.controller.Main", {
        onInit: function () {
            console.log("=== CLEAN VERSION 4.0 - Main controller initialized ===");
            MessageToast.show("Clean Controller loaded successfully!");
        },

        // Navigation methods
        onNavigateToMaterialDashboard: function () {
            console.log("Navigating to Material Dashboard");
            MessageToast.show("Navigating to Material Dashboard...");
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteMaterialDashboard");
        },

        onNavigateToAIRecommendations: function () {
            console.log("Navigating to AI Recommendations");
            MessageToast.show("Navigating to AI Recommendations...");
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteAIRecommendations");
        },

        onNavigateToUsageTrends: function () {
            console.log("Navigating to Usage Trends");
            MessageToast.show("Navigating to Usage Trends...");
            var oRouter = this.getOwnerComponent().getRouter();
            // Navigate without materialID parameter for now
            oRouter.navTo("RouteUsageTrends", {
                materialID: "MAT-0001" // Default material for demo
            });
        },

        onNavigateToPOManagement: function () {
            // Stay on current page as this is the PO management view
            MessageToast.show("You are already on the PO Management view");
        },

        onCreatePO: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteCreate");
        },

        onRefresh: function () {
            var oTable = this.byId("table");
            if (oTable) {
                oTable.getBinding("items").refresh();
                MessageToast.show("Data refreshed successfully");
            }
        },

        // Export functionality
        onExportPDF: function () {
            var that = this;
            var oModel = this.getView().getModel();

            oModel.callFunction("/exportPOsPDF", {
                success: function (oResult) {
                    MessageToast.show("PDF export initiated: " + oResult.exportPOsPDF);
                },
                error: function (oError) {
                    MessageToast.show("Failed to export PDF");
                }
            });
        },

        onExportExcel: function () {
            var that = this;
            var oModel = this.getView().getModel();

            oModel.callFunction("/exportPOsExcel", {
                success: function (oResult) {
                    MessageToast.show("Excel export initiated: " + oResult.exportPOsExcel);
                },
                error: function (oError) {
                    MessageToast.show("Failed to export Excel");
                }
            });
        },

        onItemPress: function (oEvent) {
            console.log("=== ROW CLICKED - CLEAN VERSION 4.0 ===");
            alert("Row clicked! Clean version 4.0 working!");
            
            var oBindingContext = oEvent.getSource().getBindingContext();
            if (oBindingContext) {
                var oPOData = oBindingContext.getObject();
                console.log("PO Data:", oPOData);
                this._createDialog(oPOData);
            } else {
                MessageToast.show("No data found for this row");
            }
        },

        _createDialog: function (oPOData) {
            console.log("Creating dialog for:", oPOData);
            
            var oDialog = new Dialog({
                title: "Purchase Order Details - " + oPOData.orderNumber,
                contentWidth: "500px",
                contentHeight: "400px",
                resizable: true,
                draggable: true,
                content: [
                    new VBox({
                        class: "sapUiMediumMargin",
                        items: [
                            new Panel({
                                headerText: "Purchase Order Information",
                                content: [
                                    new VBox({
                                        class: "sapUiSmallMargin",
                                        items: [
                                            new HBox({
                                                items: [
                                                    new Label({ text: "PO Number:", design: "Bold" }),
                                                    new Text({ text: oPOData.orderNumber })
                                                ]
                                            }),
                                            new HBox({
                                                items: [
                                                    new Label({ text: "Material:", design: "Bold" }),
                                                    new Text({ text: oPOData.material })
                                                ]
                                            }),
                                            new HBox({
                                                items: [
                                                    new Label({ text: "Supplier:", design: "Bold" }),
                                                    new Text({ text: oPOData.supplier })
                                                ]
                                            }),
                                            new HBox({
                                                items: [
                                                    new Label({ text: "Status:", design: "Bold" }),
                                                    new ObjectStatus({ text: oPOData.status })
                                                ]
                                            }),
                                            new HBox({
                                                items: [
                                                    new Label({ text: "Total Amount:", design: "Bold" }),
                                                    new ObjectNumber({ 
                                                        number: oPOData.totalAmount,
                                                        unit: oPOData.currency_code,
                                                        emphasized: true
                                                    })
                                                ]
                                            })
                                        ]
                                    })
                                ]
                            })
                        ]
                    })
                ],
                buttons: [
                    new Button({
                        text: "Close",
                        press: function() {
                            oDialog.close();
                            oDialog.destroy();
                        }
                    })
                ]
            });
            
            this.getView().addDependent(oDialog);
            oDialog.open();
        }
    });
});
