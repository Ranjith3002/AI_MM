sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Text",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Label"
], function (Controller, MessageToast, MessageBox, JSONModel, Dialog, Button, Text, VBox, HBox, Label) {
    "use strict";

    return Controller.extend("po.ui.controller.SuggestedPOs", {
        onInit: function () {
            console.log("SuggestedPOs controller initialized");
            this._initializeModel();
            this._loadPOSuggestions();
            MessageToast.show("AI-Powered PO Suggestions loaded!");
        },

        _initializeModel: function () {
            var oModel = new JSONModel({
                suggestions: [],
                loading: false,
                lastUpdated: null,
                summary: {
                    totalSuggestions: 0,
                    totalValue: 0,
                    highPriority: 0,
                    mediumPriority: 0,
                    lowPriority: 0
                }
            });
            this.getView().setModel(oModel, "suggestions");
        },

        _loadPOSuggestions: function () {
            var oModel = this.getView().getModel("suggestions");
            oModel.setProperty("/loading", true);

            console.log("🤖 Loading AI-powered PO suggestions...");

            // Call the backend service
            var sServiceUrl = "/odata/v4/material/getPOSuggestions()";
            
            fetch(sServiceUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("✅ PO suggestions received:", data);
                this._processSuggestionsData(data);
            })
            .catch(error => {
                console.error("❌ Error loading PO suggestions:", error);
                MessageToast.show("Failed to load PO suggestions. Using sample data.");
                this._loadSampleData();
            })
            .finally(() => {
                oModel.setProperty("/loading", false);
            });
        },

        _processSuggestionsData: function (data) {
            var oModel = this.getView().getModel("suggestions");
            
            try {
                // Parse the response if it's a string
                var parsedData = typeof data.value === 'string' ? JSON.parse(data.value) : data;
                
                if (parsedData.success && parsedData.suggestions) {
                    var suggestions = parsedData.suggestions;
                    
                    // Calculate summary
                    var summary = this._calculateSummary(suggestions);
                    
                    oModel.setData({
                        suggestions: suggestions,
                        loading: false,
                        lastUpdated: new Date().toLocaleString(),
                        summary: summary,
                        message: parsedData.message,
                        metadata: parsedData.metadata
                    });
                    
                    MessageToast.show(`✅ Loaded ${suggestions.length} AI-powered PO suggestions`);
                } else {
                    throw new Error(parsedData.message || 'Invalid response format');
                }
            } catch (error) {
                console.error("Error processing suggestions data:", error);
                MessageToast.show("Error processing suggestions. Using sample data.");
                this._loadSampleData();
            }
        },

        _calculateSummary: function (suggestions) {
            var summary = {
                totalSuggestions: suggestions.length,
                totalValue: 0,
                highPriority: 0,
                mediumPriority: 0,
                lowPriority: 0
            };

            suggestions.forEach(function (suggestion) {
                summary.totalValue += suggestion.totalAmount || 0;
                
                switch (suggestion.urgency) {
                    case 'High':
                        summary.highPriority++;
                        break;
                    case 'Medium':
                        summary.mediumPriority++;
                        break;
                    default:
                        summary.lowPriority++;
                        break;
                }
            });

            return summary;
        },

        _loadSampleData: function () {
            var oModel = this.getView().getModel("suggestions");
            var sampleSuggestions = [
                {
                    materialID: "MAT-0001",
                    materialName: "Steel Rods 10mm",
                    category: "Raw Materials",
                    currentStock: 5,
                    reorderLevel: 50,
                    suggestedQuantity: 100,
                    unit: "PC",
                    supplierName: "MetalCorp Industries",
                    unitPrice: 12.50,
                    totalAmount: 1250.00,
                    currency: "USD",
                    deliveryDate: "2024-08-15",
                    deliveryTime: 7,
                    supplierRating: 4,
                    fulfillmentRate: 98,
                    aiReasoning: "Critical low stock situation. MetalCorp has excellent fulfillment rate and competitive pricing.",
                    riskLevel: "low",
                    urgency: "High",
                    priority: 95
                },
                {
                    materialID: "MAT-0003",
                    materialName: "Industrial Bolts",
                    category: "Hardware",
                    currentStock: 15,
                    reorderLevel: 25,
                    suggestedQuantity: 75,
                    unit: "PC",
                    supplierName: "Hardware Solutions",
                    unitPrice: 2.30,
                    totalAmount: 172.50,
                    currency: "USD",
                    deliveryDate: "2024-08-12",
                    deliveryTime: 5,
                    supplierRating: 4,
                    fulfillmentRate: 95,
                    aiReasoning: "Approaching reorder level. Hardware Solutions offers fast delivery and reliable service.",
                    riskLevel: "low",
                    urgency: "Medium",
                    priority: 70
                }
            ];

            var summary = this._calculateSummary(sampleSuggestions);
            
            oModel.setData({
                suggestions: sampleSuggestions,
                loading: false,
                lastUpdated: new Date().toLocaleString(),
                summary: summary,
                message: "Sample PO suggestions loaded"
            });
        },

        onNavBack: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteMain");
        },

        onRefreshSuggestions: function () {
            MessageToast.show("Refreshing AI suggestions...");
            this._loadPOSuggestions();
        },

        onConfirmAndGeneratePO: function (oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext("suggestions");
            var oSuggestion = oContext.getObject();

            console.log("Confirming PO for:", oSuggestion.materialName);

            this._showConfirmationDialog(oSuggestion);
        },

        _showConfirmationDialog: function (oSuggestion) {
            var that = this;
            
            var oDialog = new Dialog({
                title: "Confirm Purchase Order",
                content: new VBox({
                    items: [
                        new Text({ 
                            text: `Confirm PO for ${oSuggestion.materialName}?`,
                            class: "sapUiMediumMarginBottom"
                        }),
                        new HBox({
                            items: [
                                new Label({ text: "Quantity:", class: "sapUiTinyMarginEnd" }),
                                new Text({ text: `${oSuggestion.suggestedQuantity} ${oSuggestion.unit}` })
                            ],
                            class: "sapUiTinyMarginBottom"
                        }),
                        new HBox({
                            items: [
                                new Label({ text: "Supplier:", class: "sapUiTinyMarginEnd" }),
                                new Text({ text: oSuggestion.supplierName })
                            ],
                            class: "sapUiTinyMarginBottom"
                        }),
                        new HBox({
                            items: [
                                new Label({ text: "Total Amount:", class: "sapUiTinyMarginEnd" }),
                                new Text({ text: `${oSuggestion.currency} ${oSuggestion.totalAmount.toFixed(2)}` })
                            ],
                            class: "sapUiTinyMarginBottom"
                        }),
                        new HBox({
                            items: [
                                new Label({ text: "Delivery Date:", class: "sapUiTinyMarginEnd" }),
                                new Text({ text: oSuggestion.deliveryDate })
                            ],
                            class: "sapUiMediumMarginBottom"
                        }),
                        new Text({ 
                            text: `AI Reasoning: ${oSuggestion.aiReasoning}`,
                            class: "sapUiSmallMarginBottom"
                        })
                    ]
                }),
                beginButton: new Button({
                    text: "Confirm & Generate PO",
                    type: "Emphasized",
                    press: function () {
                        oDialog.close();
                        that._generatePOFromSuggestion(oSuggestion);
                    }
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: function () {
                        oDialog.close();
                    }
                })
            });

            oDialog.open();
        },

        _generatePOFromSuggestion: function (oSuggestion) {
            console.log("🚀 Generating PO from suggestion:", oSuggestion);
            
            MessageToast.show("Generating Purchase Order...");

            // Prepare PO data
            var oPOData = {
                materialID: oSuggestion.materialID,
                material: oSuggestion.materialName,
                supplierID: oSuggestion.supplierID,
                supplier: oSuggestion.supplierName,
                quantity: oSuggestion.suggestedQuantity,
                unit: oSuggestion.unit,
                unitPrice: oSuggestion.unitPrice,
                currency: oSuggestion.currency,
                deliveryDate: oSuggestion.deliveryDate,
                notes: `AI-Generated PO from suggestion. ${oSuggestion.aiReasoning}`,
                aiRecommendation: oSuggestion.aiReasoning,
                isConfirmed: true,
                confirmedBy: "User" // In real app, get from user context
            };

            // Call the backend service
            var sServiceUrl = "/odata/v4/material/createPurchaseOrder";
            
            fetch(sServiceUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(oPOData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("✅ PO created successfully:", data);
                MessageToast.show(`✅ Purchase Order ${data.orderNumber || 'created'} generated successfully!`);
                
                // Refresh suggestions to remove the processed item
                this._loadPOSuggestions();
                
                // Show success dialog
                this._showSuccessDialog(data);
            })
            .catch(error => {
                console.error("❌ Error creating PO:", error);
                MessageBox.error(`Failed to create Purchase Order: ${error.message}`);
            });
        },

        _showSuccessDialog: function (oPOData) {
            var oDialog = new Dialog({
                title: "Purchase Order Created",
                content: new VBox({
                    items: [
                        new Text({ 
                            text: `✅ Purchase Order ${oPOData.orderNumber} created successfully!`,
                            class: "sapUiMediumMarginBottom"
                        }),
                        new Text({ 
                            text: `Material: ${oPOData.material}`,
                            class: "sapUiTinyMarginBottom"
                        }),
                        new Text({ 
                            text: `Supplier: ${oPOData.supplier}`,
                            class: "sapUiTinyMarginBottom"
                        }),
                        new Text({ 
                            text: `Total Amount: ${oPOData.currency} ${oPOData.totalAmount}`,
                            class: "sapUiTinyMarginBottom"
                        })
                    ]
                }),
                beginButton: new Button({
                    text: "View All POs",
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
        },

        formatUrgencyState: function (sUrgency) {
            switch (sUrgency) {
                case 'High': return 'Error';
                case 'Medium': return 'Warning';
                default: return 'Success';
            }
        },

        formatRiskState: function (sRisk) {
            switch (sRisk) {
                case 'high': return 'Error';
                case 'medium': return 'Warning';
                default: return 'Success';
            }
        },

        formatCurrency: function (amount, currency) {
            return `${currency || 'USD'} ${(amount || 0).toFixed(2)}`;
        },

        _generatePOFromSuggestion: function (oSuggestion) {
            console.log("🚀 Generating PO from suggestion:", oSuggestion);

            MessageToast.show("Generating Purchase Order...");

            // Prepare PO data
            var oPOData = {
                materialID: oSuggestion.materialID,
                material: oSuggestion.materialName,
                supplierID: oSuggestion.supplierID,
                supplier: oSuggestion.supplierName,
                quantity: oSuggestion.suggestedQuantity,
                unit: oSuggestion.unit,
                unitPrice: oSuggestion.unitPrice,
                currency: oSuggestion.currency,
                deliveryDate: oSuggestion.deliveryDate,
                notes: `AI-Generated PO from suggestion. ${oSuggestion.aiReasoning}`,
                aiRecommendation: oSuggestion.aiReasoning,
                isConfirmed: true,
                confirmedBy: "User" // In real app, get from user context
            };

            // Call the backend service
            var sServiceUrl = "/odata/v4/material/createPurchaseOrder";

            fetch(sServiceUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(oPOData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("✅ PO created successfully:", data);
                MessageToast.show(`✅ Purchase Order ${data.orderNumber || 'created'} generated successfully!`);

                // Refresh suggestions to remove the processed item
                this._loadPOSuggestions();

                // Show success dialog
                this._showSuccessDialog(data);
            })
            .catch(error => {
                console.error("❌ Error creating PO:", error);
                MessageBox.error(`Failed to create Purchase Order: ${error.message}`);
            });
        },

        _showSuccessDialog: function (oPOData) {
            var oDialog = new Dialog({
                title: "Purchase Order Created",
                content: new VBox({
                    items: [
                        new Text({
                            text: `✅ Purchase Order ${oPOData.orderNumber} created successfully!`,
                            class: "sapUiMediumMarginBottom"
                        }),
                        new Text({
                            text: `Material: ${oPOData.material}`,
                            class: "sapUiTinyMarginBottom"
                        }),
                        new Text({
                            text: `Supplier: ${oPOData.supplier}`,
                            class: "sapUiTinyMarginBottom"
                        }),
                        new Text({
                            text: `Total Amount: ${oPOData.currency} ${oPOData.totalAmount}`,
                            class: "sapUiTinyMarginBottom"
                        })
                    ]
                }),
                beginButton: new Button({
                    text: "View All POs",
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
        }
    });
});
