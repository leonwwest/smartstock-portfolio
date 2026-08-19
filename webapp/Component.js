sap.ui.define(["sap/ui/core/UIComponent", "de/web1/smartstock/model/models"], function (UIComponent, models) {
  "use strict";

  return UIComponent.extend("de.web1.smartstock.Component", {
    metadata: {
      manifest: "json"
    },

    init: function () {
      UIComponent.prototype.init.apply(this, arguments);
      this.setModel(models.createAppModel());
      this.getRouter().initialize();
    }
  });
});
