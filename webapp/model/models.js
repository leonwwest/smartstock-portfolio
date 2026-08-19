sap.ui.define(["sap/ui/model/json/JSONModel"], function (JSONModel) {
  "use strict";

  return {
    createAppModel: function () {
      var model = new JSONModel({});
      model.setSizeLimit(1000);
      return model;
    }
  };
});
