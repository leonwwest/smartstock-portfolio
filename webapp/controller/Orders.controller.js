sap.ui.define(
  [
    "de/web1/smartstock/controller/BaseController",
    "sap/ui/core/util/File",
    "sap/m/MessageToast"
  ],
  function (BaseController, File, MessageToast) {
    "use strict";

    return BaseController.extend("de.web1.smartstock.controller.Orders", {
      onInit: function () {
        this.ensureState();
      },

      onExportOrders: function () {
        var model = this.getOwnerComponent().getModel();
        var orders = model.getProperty("/filteredOrders") || [];
        var orderStatus = model.getProperty("/filters/orderStatus") || "offen";
        var columns = [
          "Bestellnummer",
          "Produkt",
          "Menge",
          "Bestellwert",
          "Priorität",
          "Status",
          "Lieferant",
          "Bestellt am",
          "Erwartet am",
          "Geliefert am",
          "Gelieferte Menge",
          "Storniert am"
        ];
        var rows = orders.map(function (order) {
          return [
            order.id,
            order.productName,
            order.quantity,
            order.orderValueText,
            order.priorityText,
            order.orderStatusText,
            order.supplier,
            order.createdAtText,
            order.expectedAtText,
            order.completedAtText,
            order.receivedQuantity || "",
            order.cancelledAtText
          ];
        });
        var csv = "sep=;\r\n" + [columns].concat(rows).map(function (row) {
          return row.map(function (value) {
            return "\"" + String(value || "").replace(/\r?\n/g, " ").replace(/"/g, "\"\"") + "\"";
          }).join(";");
        }).join("\r\n");

        var label = {
          all: "alle",
          offen: "offene",
          geliefert: "gelieferte",
          storniert: "stornierte"
        }[orderStatus] || orderStatus;

        File.save(csv, "smartstock-bestellungen-" + orderStatus, "csv", "text/csv;charset=utf-8", "utf-8");
        MessageToast.show("CSV-Export für " + label + " Bestellungen erstellt.");
      }
    });
  }
);
