sap.ui.define(["de/web1/smartstock/controller/BaseController"], function (BaseController) {
  "use strict";

  return BaseController.extend("de.web1.smartstock.controller.ProductDetail", {
    onInit: function () {
      this.ensureState();
      this.getOwnerComponent().getRouter().getRoute("product").attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function (event) {
      var productId = event.getParameter("arguments").productId;
      var model = this.getOwnerComponent().getModel();
      var data = model.getData();
      var product = this.applySelectedProduct(data, productId);

      if (!product) {
        this.navTo("inventory");
        return;
      }

      model.refresh(true);
    },

    onBackToInventory: function () {
      this.navTo("inventory");
    },

    onCreateReorderForSelectedProduct: function () {
      var product = this.getOwnerComponent().getModel().getProperty("/selectedProduct");
      if (!product) {
        return;
      }

      this._createReorder(product);
    }
  });
});
