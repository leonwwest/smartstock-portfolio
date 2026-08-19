sap.ui.define(["de/web1/smartstock/controller/BaseController"], function (BaseController) {
  "use strict";

  return BaseController.extend("de.web1.smartstock.controller.App", {
    onInit: function () {
      this.ensureState();
    }
  });
});
