sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("po.ui.controller.UsageTrends", {
        onInit: function () {
            console.log("UsageTrends controller initialized");
            MessageToast.show("Usage Trends loaded successfully!");
        },

        onNavBack: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteMain");
        }
    });
});
