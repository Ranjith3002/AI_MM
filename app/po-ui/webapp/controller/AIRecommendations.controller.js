sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Text",
    "sap/m/VBox",
    "sap/m/Input"
], function (Controller, MessageToast, JSONModel, Dialog, Button, Text, VBox, Input) {
    "use strict";

    return Controller.extend("po.ui.controller.AIRecommendations", {
        onInit: function () {
            console.log("AIRecommendations controller initialized");
            this._loadAIRecommendations();
            MessageToast.show("AI Recommendations loaded successfully!");
        },

        _loadAIRecommendations: function () {
            var oAIData = {
                recommendations: [
                    {
                        type: "Cost Optimization",
                        title: "Switch Steel Pipe Supplier",
                        description: "AI analysis suggests switching to MetalWorks Inc could save 15% on steel pipes",
                        currentSupplier: "Steel Corp Ltd",
                        recommendedSupplier: "MetalWorks Inc",
                        currentPrice: 125.50,
                        recommendedPrice: 106.68,
                        potentialSavings: 18.82,
                        confidence: 92,
                        icon: "sap-icon://money-bills"
                    },
                    {
                        type: "Stock Optimization",
                        title: "Increase Safety Helmet Orders",
                        description: "Usage pattern analysis suggests increasing safety helmet stock by 25%",
                        currentStock: 85,
                        recommendedStock: 106,
                        reason: "Seasonal demand increase expected",
                        confidence: 87,
                        icon: "sap-icon://inventory"
                    },
                    {
                        type: "Supplier Risk",
                        title: "Diversify Electrical Suppliers",
                        description: "Risk analysis recommends adding backup supplier for electrical components",
                        currentSupplier: "ElectroMax Inc",
                        riskLevel: "Medium",
                        recommendation: "Add TechElectro Solutions as secondary supplier",
                        confidence: 78,
                        icon: "sap-icon://warning"
                    },
                    {
                        type: "Usage Analysis",
                        title: "Industrial Bolts Usage Pattern",
                        description: "Historical usage shows consistent growth - consider adjusting order quantities",
                        currentOrder: 35,
                        recommendedOrder: 42,
                        reason: "Based on 6-month usage trend analysis",
                        confidence: 82,
                        icon: "sap-icon://bar-chart"
                    }
                ],
                chatHistory: []
            };

            var oModel = new JSONModel(oAIData);
            this.getView().setModel(oModel, "ai");
        },

        onNavBack: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteMain");
        },

        onAskAI: function () {
            var oInput = this.byId("aiQuestionInput");
            var sQuestion = oInput.getValue();

            if (!sQuestion.trim()) {
                MessageToast.show("Please enter a question");
                return;
            }

            MessageToast.show("AI is analyzing your question...");

            // Simulate AI response
            setTimeout(() => {
                var oModel = this.getView().getModel("ai");
                var aChatHistory = oModel.getProperty("/chatHistory");

                // Add user question
                aChatHistory.push({
                    type: "user",
                    message: sQuestion,
                    timestamp: new Date().toLocaleTimeString()
                });

                // Generate AI response based on question
                var sAIResponse = this._generateAIResponse(sQuestion);
                aChatHistory.push({
                    type: "ai",
                    message: sAIResponse,
                    timestamp: new Date().toLocaleTimeString()
                });

                oModel.setProperty("/chatHistory", aChatHistory);
                oInput.setValue("");

                MessageToast.show("AI response generated!");
            }, 2000);
        },

        _generateAIResponse: function (sQuestion) {
            var sLowerQuestion = sQuestion.toLowerCase();

            if (sLowerQuestion.includes("cost") || sLowerQuestion.includes("save") || sLowerQuestion.includes("price")) {
                return "Based on my analysis of your procurement data, I've identified several cost-saving opportunities: 1) Switching steel pipe suppliers could save 15% annually, 2) Bulk ordering industrial bolts could reduce unit costs by 8%, 3) Negotiating longer-term contracts with current suppliers could yield 5-12% discounts.";
            } else if (sLowerQuestion.includes("stock") || sLowerQuestion.includes("inventory")) {
                return "Your current inventory analysis shows: 12 items are below minimum stock levels. I recommend immediate reordering for Steel Pipes and Industrial Bolts. Safety equipment shows seasonal patterns - consider increasing stock by 25% before Q2. Copper wire inventory is optimal.";
            } else if (sLowerQuestion.includes("supplier") || sLowerQuestion.includes("vendor")) {
                return "Supplier performance analysis: Steel Corp Ltd has 95% on-time delivery but higher costs. ElectroMax Inc offers competitive pricing but consider adding a backup supplier for risk mitigation. I recommend evaluating MetalWorks Inc and TechElectro Solutions as alternatives.";
            } else if (sLowerQuestion.includes("trend") || sLowerQuestion.includes("usage")) {
                return "Usage trends indicate: Steel products showing consistent demand patterns. Electrical component usage remains stable. Safety equipment shows seasonal spikes in Q2 and Q4. Consider adjusting inventory levels based on historical usage patterns.";
            } else {
                return "I've analyzed your procurement data and can help with cost optimization, inventory management, supplier evaluation, and usage analysis. What specific aspect would you like me to focus on? I can provide detailed insights on pricing trends, stock optimization, or supplier performance.";
            }
        },

        onApplyRecommendation: function (oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext("ai");
            var oRecommendation = oContext.getObject();

            MessageToast.show("Applying recommendation: " + oRecommendation.title);

            // Simulate applying recommendation
            setTimeout(() => {
                var oDialog = new Dialog({
                    title: "Recommendation Applied",
                    content: new VBox({
                        items: [
                            new Text({ text: "✅ " + oRecommendation.title }),
                            new Text({ text: "Status: Implementation started" }),
                            new Text({ text: "Expected completion: 2-3 business days" }),
                            new Text({ text: "" }),
                            new Text({ text: "You will receive updates on the progress." })
                        ]
                    }),
                    beginButton: new Button({
                        text: "OK",
                        press: () => oDialog.close()
                    })
                });
                oDialog.open();
            }, 1000);
        }
    });
});
