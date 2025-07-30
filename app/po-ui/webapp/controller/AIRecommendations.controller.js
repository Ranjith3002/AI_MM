sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("po.ui.controller.AIRecommendations", {
        onInit: function () {
            console.log("AIRecommendations controller initialized");
            MessageToast.show("AI Recommendations loaded successfully!");
        },

        onNavBack: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteMain");
        }
    });
});
