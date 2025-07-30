sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("po.ui.controller.MaterialDashboard", {
        onInit: function () {
            console.log("MaterialDashboard controller initialized");
            MessageToast.show("Material Dashboard loaded successfully!");
        },

        onNavBack: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteMain");
        }
    });
});
