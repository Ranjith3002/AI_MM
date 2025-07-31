sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Text",
    "sap/m/VBox"
], function (Controller, MessageToast, JSONModel, Dialog, Button, Text, VBox) {
    "use strict";

    return Controller.extend("po.ui.controller.MaterialDashboard", {
        onInit: function () {
            console.log("MaterialDashboard controller initialized");
            this._loadMaterialData();
            MessageToast.show("Material Dashboard loaded successfully!");
        },

        _loadMaterialData: function () {
            // Create sample material data
            var oMaterialData = {
                summary: {
                    totalMaterials: 156,
                    lowStockCount: 12,
                    inventoryValue: 245000
                },
                materials: [
                    {
                        id: "MAT-0001",
                        name: "Steel Pipes",
                        category: "Raw Materials",
                        currentStock: 45,
                        minStock: 50,
                        maxStock: 200,
                        unitPrice: 125.50,
                        supplier: "Steel Corp Ltd",
                        lastOrdered: "2024-01-15",
                        status: "Low Stock"
                    },
                    {
                        id: "MAT-0002",
                        name: "Copper Wire",
                        category: "Electrical",
                        currentStock: 120,
                        minStock: 30,
                        maxStock: 150,
                        unitPrice: 8.75,
                        supplier: "ElectroMax Inc",
                        lastOrdered: "2024-01-10",
                        status: "In Stock"
                    },
                    {
                        id: "MAT-0003",
                        name: "Industrial Bolts",
                        category: "Hardware",
                        currentStock: 15,
                        minStock: 25,
                        maxStock: 100,
                        unitPrice: 2.30,
                        supplier: "Hardware Solutions",
                        lastOrdered: "2024-01-08",
                        status: "Low Stock"
                    },
                    {
                        id: "MAT-0004",
                        name: "Safety Helmets",
                        category: "Safety Equipment",
                        currentStock: 85,
                        minStock: 20,
                        maxStock: 100,
                        unitPrice: 45.00,
                        supplier: "SafetyFirst Co",
                        lastOrdered: "2024-01-12",
                        status: "In Stock"
                    }
                ]
            };

            // Set the model
            var oModel = new JSONModel(oMaterialData);
            this.getView().setModel(oModel, "materials");
        },

        onNavBack: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteMain");
        },

        onGeneratePO: function () {
            MessageToast.show("Generating Purchase Orders for low stock items...");

            // Simulate PO generation
            setTimeout(() => {
                var oDialog = new Dialog({
                    title: "Purchase Orders Generated",
                    content: new VBox({
                        items: [
                            new Text({ text: "✅ PO-2024-001: Steel Pipes (55 units)" }),
                            new Text({ text: "✅ PO-2024-002: Industrial Bolts (35 units)" }),
                            new Text({ text: "" }),
                            new Text({ text: "Total estimated cost: $8,925.50" })
                        ]
                    }),
                    beginButton: new Button({
                        text: "View Purchase Orders",
                        press: () => {
                            oDialog.close();
                            this.getOwnerComponent().getRouter().navTo("RouteMain");
                        }
                    }),
                    endButton: new Button({
                        text: "Close",
                        press: () => oDialog.close()
                    })
                });
                oDialog.open();
            }, 1500);
        },

        onRefreshData: function () {
            MessageToast.show("Refreshing material data...");
            this._loadMaterialData();
        },

        formatStockState: function (sStatus) {
            return sStatus === "Low Stock" ? "Error" : "Success";
        },

        formatStatusState: function (sStatus) {
            return sStatus === "Low Stock" ? "Error" : "Success";
        }
    });
});
