sap.ui.define(
  [
    "de/web1/smartstock/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "de/web1/smartstock/model/mockODataService"
  ],
  function (BaseController, JSONModel, MockODataService) {
    "use strict";

    return BaseController.extend("de.web1.smartstock.controller.System", {
      onInit: function () {
        this.ensureState();
        this._setMockExample("products");
      },

      onMockExampleChange: function (event) {
        var selectedItem = event.getParameter("selectedItem");
        this._setMockExample(selectedItem ? selectedItem.getKey() : "products");
      },

      _setMockExample: function (key) {
        var example = MockODataService.getExample(key);
        this.getView().setModel(new JSONModel({
          selectedKey: key,
          title: example.title,
          request: example.request,
          description: example.description,
          resultText: JSON.stringify(example.result, null, 2)
        }), "mock");
      }
    });
  }
);
