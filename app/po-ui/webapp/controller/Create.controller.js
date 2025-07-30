sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, MessageBox, JSONModel) {
    "use strict";

    return Controller.extend("po.ui.controller.Create", {
        onInit: function () {
            // Initialize the create view
            this._initializeCreateView();
            
            // Set up routing
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteCreate").attachPatternMatched(this._onRouteMatched, this);
        },

        _initializeCreateView: function () {
            // Create a local model for the new PO
            var oNewPOModel = new JSONModel({
                Material: "",
                Supplier: "",
                Quantity: 0,
                Unit: "PC",
                UnitPrice: 0.00,
                Currency: "USD",
                DeliveryDate: null,
                Notes: "",
                Status: "Draft"
            });
            
            // Set up dropdown data
            var oDropdownModel = new JSONModel({
                Units: [
                    { key: "PC", text: "Pieces" },
                    { key: "KG", text: "Kilograms" },
                    { key: "M", text: "Meters" },
                    { key: "L", text: "Liters" }
                ],
                Currencies: [
                    { key: "USD", text: "US Dollar" },
                    { key: "EUR", text: "Euro" },
                    { key: "GBP", text: "British Pound" }
                ]
            });
            
            this.getView().setModel(oNewPOModel);
            this.getView().setModel(oDropdownModel, "dropdown");
        },

        _onRouteMatched: function () {
            // Reset the form when navigating to create view
            this._resetForm();
        },

        _resetForm: function () {
            // Reset the form to initial state
            var oModel = this.getView().getModel();
            oModel.setData({
                Material: "",
                Supplier: "",
                Quantity: 0,
                Unit: "PC",
                UnitPrice: 0.00,
                Currency: "USD",
                DeliveryDate: null,
                Notes: "",
                Status: "Draft"
            });
        },

        onNavBack: function () {
            // Navigate back to main view
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteMain");
        },

        onCancel: function () {
            // Show confirmation dialog before canceling
            MessageBox.confirm(
                this.getResourceBundle().getText("cancelConfirmation"),
                {
                    title: this.getResourceBundle().getText("confirm"),
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            this.onNavBack();
                        }
                    }.bind(this),
                    styleClass: this.getOwnerComponent().getContentDensityClass()
                }
            );
        },

        onSave: function () {
            // Validate and save the new PO
            if (this._validateForm()) {
                this._savePurchaseOrder();
            }
        },

        _validateForm: function () {
            // Validate required fields
            var oModel = this.getView().getModel();
            var oData = oModel.getData();
            
            var aErrors = [];
            
            if (!oData.Material || oData.Material.trim() === "") {
                aErrors.push(this.getResourceBundle().getText("materialRequired"));
            }
            
            if (!oData.Supplier || oData.Supplier.trim() === "") {
                aErrors.push(this.getResourceBundle().getText("supplierRequired"));
            }
            
            if (!oData.Quantity || oData.Quantity <= 0) {
                aErrors.push(this.getResourceBundle().getText("quantityRequired"));
            }
            
            if (!oData.UnitPrice || oData.UnitPrice <= 0) {
                aErrors.push(this.getResourceBundle().getText("unitPriceRequired"));
            }
            
            if (aErrors.length > 0) {
                MessageBox.error(
                    aErrors.join("\n"),
                    {
                        title: this.getResourceBundle().getText("validationError"),
                        styleClass: this.getOwnerComponent().getContentDensityClass()
                    }
                );
                return false;
            }
            
            return true;
        },

        _savePurchaseOrder: function () {
            // Get the data from the form
            var oModel = this.getView().getModel();
            var oData = oModel.getData();
            
            // Calculate total amount
            var fTotalAmount = oData.Quantity * oData.UnitPrice;
            
            // Prepare the payload for OData service
            var oPOPayload = {
                Material: oData.Material,
                Supplier: oData.Supplier,
                Quantity: parseInt(oData.Quantity),
                Unit: oData.Unit,
                UnitPrice: parseFloat(oData.UnitPrice),
                TotalAmount: fTotalAmount,
                Currency: oData.Currency,
                DeliveryDate: oData.DeliveryDate,
                Notes: oData.Notes,
                Status: "Draft",
                CreatedAt: new Date().toISOString()
            };
            
            // Get the OData model
            var oODataModel = this.getOwnerComponent().getModel();
            
            if (oODataModel) {
                // Create the new PO via OData service
                var oListBinding = oODataModel.bindList("/PurchaseOrders");
                
                oListBinding.create(oPOPayload).created().then(function () {
                    MessageToast.show(this.getResourceBundle().getText("poCreatedSuccess"));
                    this.onNavBack();
                }.bind(this)).catch(function (oError) {
                    MessageBox.error(
                        this.getResourceBundle().getText("poCreatedError") + "\n" + oError.message,
                        {
                            title: this.getResourceBundle().getText("error"),
                            styleClass: this.getOwnerComponent().getContentDensityClass()
                        }
                    );
                }.bind(this));
            } else {
                // Fallback: Show success message (for demo purposes)
                MessageBox.success(
                    this.getResourceBundle().getText("poCreatedSuccessDemo", [oPOPayload.Material, fTotalAmount, oPOPayload.Currency]),
                    {
                        title: this.getResourceBundle().getText("success"),
                        onClose: function () {
                            this.onNavBack();
                        }.bind(this),
                        styleClass: this.getOwnerComponent().getContentDensityClass()
                    }
                );
            }
        },

        calculateTotal: function (iQuantity, fUnitPrice) {
            // Calculate total amount for display
            if (iQuantity && fUnitPrice) {
                return (parseFloat(iQuantity) * parseFloat(fUnitPrice)).toFixed(2);
            }
            return "0.00";
        },

        getResourceBundle: function () {
            // Get the resource bundle for i18n
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        }
    });
});
