sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/Label",
    "sap/m/VBox",
    "sap/m/Select",
    "sap/ui/core/Item",
    "de/web1/smartstock/model/mockODataService"
  ],
  function (Controller, MessageToast, Dialog, Button, Input, Label, VBox, Select, Item, MockODataService) {
    "use strict";

    var currency = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
    var dateFormatter = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

    function clone(value) {
      return JSON.parse(JSON.stringify(value));
    }

    function getStatus(product) {
      if (product.stock === 0) {
        return { key: "critical", text: "Kritisch", state: "Error" };
      }
      if (product.stock < product.minStock) {
        return { key: "reorder", text: "Nachbestellen", state: "Warning" };
      }
      return { key: "ok", text: "OK", state: "Success" };
    }

    function getRiskDecision(product, hasOpenOrder, highRevenueThreshold) {
      var score = 0;
      var reasons = [];
      var isHighRevenue = product.revenue >= highRevenueThreshold && product.revenue > 0;

      if (product.stock === 0) {
        score += 100;
        reasons.push("Bestand ist 0");
      } else if (product.stock < product.minStock) {
        score += 60;
        reasons.push("unter Mindestbestand");
      }
      if (product.daysUntilStockout <= 3) {
        score += 40;
        reasons.push("Reichweite max. 3 Tage");
      } else if (product.daysUntilStockout <= 7) {
        score += 20;
        reasons.push("Reichweite max. 7 Tage");
      }
      if (isHighRevenue) {
        score += 20;
        reasons.push("umsatzrelevant");
      }
      if (hasOpenOrder) {
        score -= 25;
        reasons.push("offene Bestellung vorhanden");
      }

      if (product.stock === 0) {
        return { score: score, text: "Kritisch", state: "Error", reasonText: reasons.join(", "), action: hasOpenOrder ? "Liefertermin aktiv verfolgen und Alternative vorbereiten." : "Sofort bestellen und Liefertermin priorisieren." };
      }
      if (product.stock < product.minStock) {
        return { score: score, text: "Nachbestellen", state: "Warning", reasonText: reasons.join(", "), action: hasOpenOrder ? "Offene Bestellung ueberwachen." : "Nachbestellung im regulaeren Beschaffungsprozess anlegen." };
      }
      if (product.daysUntilStockout <= 7) {
        return { score: score, text: "Bald leer", state: "Warning", reasonText: reasons.join(", "), action: hasOpenOrder ? "Lieferung beobachten, Bestand eng pruefen." : "Bestand beobachten und Bestellung vorbereiten." };
      }
      if (isHighRevenue) {
        return { score: score, text: "Beobachten", state: "None", reasonText: reasons.join(", "), action: "Umsatzstarkes Produkt regelmaessig pruefen." };
      }
      return { score: score, text: "OK", state: "Success", reasonText: reasons.length ? reasons.join(", ") : "keine akute Abweichung", action: "Bestand weiter beobachten, keine Sofortmassnahme erforderlich." };
    }

    function normalizeText(value) {
      return String(value || "")
        .replace(new RegExp("Zubehoer|Zubeh\u00c3\u00b6r|Zubeh\u00c3\u0192\u00c2\u00b6r", "g"), "Zubehör")
        .replace(new RegExp("Getraenke|Getr\u00c3\u00a4nke|Getr\u00c3\u0192\u00c2\u00a4nke", "g"), "Getränke")
        .replace(new RegExp("M\u00c3\u00bc", "g"), "Mü")
        .replace(new RegExp("K\u00c3\u00bc", "g"), "Kü")
        .replace(new RegExp("R\u00c3\u00bc", "g"), "Rü")
        .replace(new RegExp("B\u00c3\u00a4", "g"), "Bä")
        .replace(new RegExp("\u00c3\u00bc", "g"), "ü")
        .replace(new RegExp("\u00c3\u00a4", "g"), "ä")
        .replace(new RegExp("\u00c3\u00b6", "g"), "ö")
        .replace(new RegExp("\u00c3\u0178", "g"), "ß");
    }

    function normalizeFilters(filters) {
      return Object.assign({
        query: "",
        status: "all",
        category: "all",
        orderStatus: "offen"
      }, filters || {});
    }

    function calculateViewState(data) {
      data.filters = normalizeFilters(data.filters);

      var revenueValues = data.products.map(function (product) {
        return (Number(product.price) || 0) * (Number(product.sold) || 0);
      }).sort(function (a, b) {
        return b - a;
      });
      var highRevenueThreshold = revenueValues[Math.min(4, revenueValues.length - 1)] || 0;

      var products = data.products.map(function (product) {
        var status = getStatus(product);
        var openOrder = data.orders.some(function (order) {
          return order.productId === product.id && order.status === "offen";
        });
        var dailyDemand = product.sold > 0 ? product.sold / 30 : 0;
        var daysUntilStockout = dailyDemand > 0 ? Math.floor(product.stock / dailyDemand) : 999;
        var stockoutState = product.stock === 0 || daysUntilStockout < 3 ? "Error" : daysUntilStockout < 7 ? "Warning" : "Success";
        var stockoutText = product.stock === 0 ? "0 Tage" : dailyDemand > 0 ? daysUntilStockout + " Tage" : "stabil";
        var revenue = product.price * product.sold;
        var risk = getRiskDecision(Object.assign({}, product, {
          revenue: revenue,
          daysUntilStockout: daysUntilStockout
        }), openOrder, highRevenueThreshold);

        return Object.assign({}, product, {
          category: normalizeText(product.category),
          name: normalizeText(product.name),
          statusKey: status.key,
          statusText: status.text,
          statusState: status.state,
          priceText: currency.format(product.price),
          revenue: revenue,
          revenueText: currency.format(revenue),
          stockValue: product.price * product.stock,
          stockValueText: currency.format(product.price * product.stock),
          recommendedOrderQuantity: Math.max(product.minStock * 2 - product.stock, product.minStock),
          stockRatio: product.minStock > 0 ? Math.min(100, Math.round((product.stock / product.minStock) * 100)) : 100,
          dailyDemand: dailyDemand,
          dailyDemandText: dailyDemand.toLocaleString("de-DE", { maximumFractionDigits: 1 }) + " / Tag",
          daysUntilStockout: daysUntilStockout,
          stockoutText: stockoutText,
          stockoutState: stockoutState,
          riskScore: Math.max(0, risk.score),
          riskPriorityText: risk.text,
          riskPriorityState: risk.state,
          riskReasonText: risk.reasonText,
          statusReason: status.key === "critical"
            ? "Der Bestand ist 0. Das Produkt kann aktuell nicht verkauft werden."
            : status.key === "reorder"
              ? "Der Bestand liegt unter dem Mindestbestand. Eine Nachbestellung ist wirtschaftlich sinnvoll."
              : "Der Bestand liegt ueber dem Mindestbestand. Risiko wird ueber Reichweite, Umsatz und offene Bestellung bewertet.",
          managementAction: risk.action,
          canOrder: !openOrder
        });
      });

      var categories = Array.from(new Set(products.map(function (product) {
        return product.category;
      }))).sort();

      var filteredProducts = products.filter(function (product) {
        var query = data.filters.query.toLowerCase();
        var matchesQuery = (product.name + " " + product.category + " " + product.id).toLowerCase().indexOf(query) !== -1;
        var matchesStatus = data.filters.status === "all" || product.statusKey === data.filters.status;
        var matchesCategory = data.filters.category === "all" || product.category === data.filters.category;
        return matchesQuery && matchesStatus && matchesCategory;
      });

      var orders = data.orders.map(function (order) {
        var product = products.find(function (entry) {
          return entry.id === order.productId;
        });
        var status = product ? getStatus(product) : { key: "reorder", text: "Nachbestellen", state: "Warning" };
        var createdAt = order.createdAt || "2026-05-18T00:00:00";
        var expectedAt = order.expectedAt || addDays(createdAt, status.key === "critical" ? 1 : 3);
        var orderValue = product ? product.price * order.quantity : 0;

        return Object.assign({}, order, {
          productName: normalizeText(order.productName || (product && product.name) || ""),
          supplier: normalizeText(order.supplier || "SmartStock Lieferant"),
          createdAt: createdAt,
          expectedAt: expectedAt,
          createdAtText: formatDate(createdAt),
          expectedAtText: formatDate(expectedAt),
          completedAtText: order.completedAt ? formatDate(order.completedAt) : "",
          cancelledAtText: order.cancelledAt ? formatDate(order.cancelledAt) : "",
          receivedQuantityText: order.receivedQuantity ? order.receivedQuantity + " Stück geliefert" : "",
          priorityText: status.key === "critical" ? "Hoch" : status.key === "reorder" ? "Normal" : "Niedrig",
          priorityState: status.key === "critical" ? "Error" : status.key === "reorder" ? "Warning" : "Success",
          orderStatusText: order.status === "geliefert" ? "Geliefert" : order.status === "storniert" ? "Storniert" : "Offen",
          orderStatusState: order.status === "geliefert" ? "Success" : order.status === "storniert" ? "None" : "Warning",
          canComplete: order.status === "offen",
          canCancel: order.status === "offen",
          orderValue: orderValue,
          orderValueText: currency.format(orderValue),
          detailText: order.id + " · " + order.quantity + " Stück · " + currency.format(orderValue)
        });
      }).sort(function (a, b) {
        var statusOrder = { offen: 0, geliefert: 1, storniert: 2 };
        var priorityOrder = { Hoch: 0, Normal: 1, Niedrig: 2 };
        return statusOrder[a.status] - statusOrder[b.status] || priorityOrder[a.priorityText] - priorityOrder[b.priorityText] || a.expectedAt.localeCompare(b.expectedAt);
      });

      var filteredOrders = orders.filter(function (order) {
        return data.filters.orderStatus === "all" || order.status === data.filters.orderStatus;
      });

      var revenue = products.reduce(function (sum, product) {
        return sum + product.revenue;
      }, 0);
      var stockValue = products.reduce(function (sum, product) {
        return sum + product.stock * product.price;
      }, 0);
      var riskStockValue = products.filter(function (product) {
        return product.statusKey !== "ok";
      }).reduce(function (sum, product) {
        return sum + product.stockValue;
      }, 0);
      var recommendedOrderValue = products.filter(function (product) {
        return product.statusKey !== "ok" && product.canOrder;
      }).reduce(function (sum, product) {
        return sum + product.recommendedOrderQuantity * product.price;
      }, 0);
      var critical = products.filter(function (product) {
        return product.statusKey === "critical";
      }).length;
      var reorder = products.filter(function (product) {
        return product.statusKey === "reorder";
      }).length;
      var shortRange = products.filter(function (product) {
        return product.stockoutState === "Error";
      }).length;
      var topProduct = products.slice().sort(function (a, b) {
        return b.sold - a.sold;
      })[0];
      var topProducts = products.slice().sort(function (a, b) {
        return b.sold - a.sold;
      }).slice(0, 5);
      var topRevenueProducts = products.slice().sort(function (a, b) {
        return b.revenue - a.revenue;
      }).slice(0, 5);
      var maxRevenueProduct = Math.max.apply(null, topRevenueProducts.map(function (product) {
        return product.revenue;
      }).concat([1]));
      topRevenueProducts = topRevenueProducts.map(function (product) {
        return {
          id: product.id,
          name: product.name,
          revenueText: product.revenueText,
          percentage: Math.round((product.revenue / maxRevenueProduct) * 100)
        };
      });
      var maxSold = Math.max.apply(null, topProducts.map(function (product) {
        return product.sold;
      }).concat([1]));
      topProducts = topProducts.map(function (product) {
        return {
          name: product.name,
          sold: product.sold,
          soldPercentage: Math.round((product.sold / maxSold) * 100)
        };
      });
      var priority = critical > 0 ? "Error" : reorder > 0 ? "Warning" : "Success";
      var procurementQueue = products.filter(function (product) {
        return product.riskPriorityText !== "OK";
      }).sort(function (a, b) {
        if (a.riskScore === b.riskScore) {
          return a.stockRatio - b.stockRatio;
        }
        return b.riskScore - a.riskScore;
      }).slice(0, 4).map(function (product, index) {
        var hasOpenOrder = data.orders.some(function (order) {
          return order.productId === product.id && order.status === "offen";
        });

        return Object.assign({}, product, {
          rank: index + 1,
          orderHint: hasOpenOrder ? "Bestellung läuft" : product.recommendedOrderQuantity + " Stück vorschlagen",
          orderState: hasOpenOrder ? "None" : product.riskPriorityState
        });
      });

      var categoryRevenue = categories.map(function (category) {
        var value = products.filter(function (product) {
          return product.category === category;
        }).reduce(function (sum, product) {
          return sum + product.revenue;
        }, 0);
        return { category: category, value: value, valueText: currency.format(value) };
      });
      var maxCategoryRevenue = Math.max.apply(null, categoryRevenue.map(function (entry) {
        return entry.value;
      }).concat([1]));
      var categoryRisk = categories.map(function (category) {
        var categoryProducts = products.filter(function (product) {
          return product.category === category;
        });
        var stockValueInCategory = categoryProducts.reduce(function (sum, product) {
          return sum + product.stockValue;
        }, 0);
        var riskProducts = categoryProducts.filter(function (product) {
          return product.statusKey !== "ok";
        });
        var missingQuantity = riskProducts.reduce(function (sum, product) {
          return sum + Math.max(product.minStock - product.stock, 0);
        }, 0);
        var orderValue = riskProducts.filter(function (product) {
          return product.canOrder;
        }).reduce(function (sum, product) {
          return sum + product.recommendedOrderQuantity * product.price;
        }, 0);
        var riskScore = categoryProducts.length > 0 ? Math.round((riskProducts.length / categoryProducts.length) * 100) : 0;
        var riskState = riskProducts.some(function (product) {
          return product.statusKey === "critical";
        }) ? "Error" : riskProducts.length > 0 ? "Warning" : "Success";

        return {
          category: category,
          productCount: categoryProducts.length,
          riskCount: riskProducts.length,
          missingQuantity: missingQuantity,
          riskScore: riskScore,
          riskState: riskState,
          orderValueText: currency.format(orderValue),
          stockValueText: currency.format(stockValueInCategory),
          summary: riskProducts.length + " von " + categoryProducts.length + " Produkt(en) mit Beschaffungsbedarf"
        };
      }).sort(function (a, b) {
        return b.riskScore - a.riskScore || b.missingQuantity - a.missingQuantity;
      });

      return {
        products: products,
        filteredProducts: filteredProducts,
        orders: orders,
        filteredOrders: filteredOrders,
        filters: data.filters,
        categories: [{ key: "all", text: "Alle" }].concat(categories.map(function (category) {
          return { key: category, text: category };
        })),
        metrics: {
          revenueText: currency.format(revenue),
          stockValueText: currency.format(stockValue),
          riskStockValueText: currency.format(riskStockValue),
          recommendedOrderValueText: currency.format(recommendedOrderValue),
          productCount: products.length,
          critical: critical,
          reorder: reorder,
          shortRange: shortRange,
          openOrders: data.orders.filter(function (order) {
            return order.status === "offen";
          }).length,
          topProduct: topProduct ? topProduct.name : "-",
          topProductId: topProduct ? topProduct.id : ""
        },
        decision: {
          state: priority,
          title: priority === "Error" ? "Sofortige Nachbestellung empfohlen" : priority === "Warning" ? "Beschaffung einplanen" : "Bestand stabil",
          text: priority === "Error"
            ? critical + " Produkt(e) sind kritisch. Der Lagerprozess braucht Priorität."
            : priority === "Warning"
              ? reorder + " Produkt(e) liegen unter Mindestbestand. Bestellung vorbereiten."
              : "Alle relevanten Bestände sind ausreichend."
        },
        procurementQueue: procurementQueue,
        hasProcurementQueue: procurementQueue.length > 0,
        categoryRevenue: categoryRevenue.map(function (entry) {
          return Object.assign({}, entry, {
            percentage: Math.round((entry.value / maxCategoryRevenue) * 100)
          });
        }),
        categoryRevenueChart: categoryRevenue.map(function (entry) {
          return { category: entry.category, value: Math.round(entry.value * 100) / 100 };
        }),
        categoryRisk: categoryRisk,
        categoryRiskChart: categoryRisk.map(function (entry) {
          return { category: entry.category, riskScore: entry.riskScore, missingQuantity: entry.missingQuantity };
        }),
        topProducts: topProducts,
        topRevenueProducts: topRevenueProducts,
        forecastProducts: products.slice().sort(function (a, b) {
          return a.daysUntilStockout - b.daysUntilStockout || b.riskScore - a.riskScore;
        }).slice(0, 8),
        analyticsDecision: {
          state: priority,
          title: priority === "Error" ? "Liquidität und Lieferfähigkeit priorisieren" : priority === "Warning" ? "Beschaffungsbudget einplanen" : "Bestand weiter beobachten",
          text: priority === "Error"
            ? "Die Analyse zeigt kritische Lagerpositionen. Management sollte Liefertermine, Ersatzlieferanten und kurzfristiges Budget prüfen."
            : priority === "Warning"
              ? "Mehrere Kategorien haben Beschaffungsbedarf. Die empfohlenen Bestellwerte helfen bei Budgetfreigabe und Einkaufsplanung."
              : "Die Analyse stützt eine Beobachtungsentscheidung ohne sofortige Beschaffung."
        },
        selectedProduct: null,
        selectedProductOrders: []
      };
    }

    return Controller.extend("de.web1.smartstock.controller.BaseController", {
      ensureState: function () {
        var model = this.getOwnerComponent().getModel();
        if (!model.getProperty("/products")) {
          model.setData(calculateViewState(MockODataService.read()));
        }
      },

      navTo: function (routeName) {
        this.getOwnerComponent().getRouter().navTo(routeName);
      },

      onNavDashboard: function () {
        this.navTo("dashboard");
      },

      onNavInventory: function () {
        this.navTo("inventory");
      },

      onNavOrders: function () {
        this.navTo("orders");
      },

      onNavAnalytics: function () {
        this.navTo("analytics");
      },

      onNavSystem: function () {
        this.navTo("system");
      },

      onResetDemoData: function () {
        this._setState(MockODataService.reset(), true);
      },

      onDashboardTilePress: function (event) {
        var target = event.getSource().data("target");
        var status = event.getSource().data("status");
        var productId = this.getOwnerComponent().getModel().getProperty("/metrics/topProductId");

        if (target === "product" && productId) {
          this.getOwnerComponent().getRouter().navTo("product", { productId: productId });
          return;
        }
        if (target === "orders") {
          this._updateState(function (data) {
            data.filters.orderStatus = "offen";
          });
          this.navTo("orders");
          return;
        }
        if (target === "analytics") {
          this.navTo("analytics");
          return;
        }

        this._updateState(function (data) {
          data.filters.status = status || "all";
          data.filters.category = "all";
          data.filters.query = "";
        });
        this.navTo("inventory");
      },

      onSearch: function (event) {
        var value = event.getParameter("value");
        this._updateState(function (data) {
          data.filters.query = value;
        });
      },

      onStatusChange: function (event) {
        var selectedItem = event.getParameter("selectedItem");
        this._updateState(function (data) {
          data.filters.status = selectedItem.getKey();
        });
      },

      onCategoryChange: function (event) {
        var selectedItem = event.getParameter("selectedItem");
        if (!selectedItem) {
          return;
        }
        this._updateState(function (data) {
          data.filters.category = selectedItem.getKey();
        });
      },

      onOrderStatusFilterChange: function (event) {
        var selectedItem = event.getParameter("selectedItem");
        if (!selectedItem) {
          return;
        }
        this._updateState(function (data) {
          data.filters.orderStatus = selectedItem.getKey();
        });
      },

      onOpenProductEdit: function (event) {
        var product = event.getSource().getBindingContext()
          ? event.getSource().getBindingContext().getObject()
          : this.getOwnerComponent().getModel().getProperty("/selectedProduct");
        if (product) {
          this._showProductDialog(product);
        }
      },

      onDecreaseStock: function (event) {
        this._adjustStock(event.getSource().getBindingContext().getObject(), -1);
      },

      onIncreaseStock: function (event) {
        this._adjustStock(event.getSource().getBindingContext().getObject(), 1);
      },

      onCreateReorder: function (event) {
        var product = event.getSource().getBindingContext().getObject();
        this._createReorder(product);
      },

      onCompleteOrder: function (event) {
        var order = event.getSource().getBindingContext().getObject();
        this._showGoodsReceiptDialog(order);
      },

      _completeOrder: function (order, receiptQuantity) {
        this._updateState(function (data) {
          var targetOrder = data.orders.find(function (entry) {
            return entry.id === order.id;
          });
          if (!targetOrder || targetOrder.status !== "offen") {
            return;
          }
          var targetProduct = data.products.find(function (entry) {
            return entry.id === targetOrder.productId;
          });
          if (targetProduct) {
            targetProduct.stock += receiptQuantity;
          }
          targetOrder.receivedQuantity = receiptQuantity;
          targetOrder.status = "geliefert";
          targetOrder.completedAt = new Date().toISOString();
        });
        MessageToast.show("Wareneingang mit " + receiptQuantity + " Stück gebucht.");
      },

      onCancelOrder: function (event) {
        var order = event.getSource().getBindingContext().getObject();
        this._updateState(function (data) {
          var targetOrder = data.orders.find(function (entry) {
            return entry.id === order.id;
          });
          if (!targetOrder || targetOrder.status !== "offen") {
            return;
          }
          targetOrder.status = "storniert";
          targetOrder.cancelledAt = new Date().toISOString();
        });
        MessageToast.show("Bestellung storniert.");
      },

      onProductPress: function (event) {
        var product = event.getSource().getBindingContext().getObject();
        this.getOwnerComponent().getRouter().navTo("product", {
          productId: product.id
        });
      },

      _createReorder: function (product) {
        this._showReorderDialog(product);
      },

      _saveReorder: function (product, quantity, supplier, expectedDays) {
        this._updateState(function (data) {
          var exists = data.orders.some(function (order) {
            return order.productId === product.id && order.status === "offen";
          });
          if (exists) {
            return;
          }
          data.orders.unshift({
            id: "B-" + Date.now().toString().slice(-6),
            productId: product.id,
            productName: product.name,
            quantity: quantity,
            status: "offen",
            supplier: supplier,
            createdAt: new Date().toISOString(),
            expectedAt: addDays(new Date().toISOString(), expectedDays)
          });
          data.filters.orderStatus = "offen";
        });
        MessageToast.show("Nachbestellung für " + product.name + " erstellt.");
      },

      _adjustStock: function (product, amount) {
        this._updateState(function (data) {
          var target = data.products.find(function (entry) {
            return entry.id === product.id;
          });
          if (target) {
            target.stock = Math.max(0, target.stock + amount);
          }
        });
      },

      _updateState: function (mutator) {
        var current = this.getOwnerComponent().getModel().getData();
        var base = {
          products: clone(current.products),
          orders: clone(current.orders),
          filters: normalizeFilters(clone(current.filters))
        };
        mutator(base);
        this._setState(base, false);
      },

      _setState: function (baseState, showToast) {
        var viewState = calculateViewState(baseState);
        var currentSelectedProduct = this.getOwnerComponent().getModel().getProperty("/selectedProduct");
        if (currentSelectedProduct) {
          this.applySelectedProduct(viewState, currentSelectedProduct.id);
        }
        this.getOwnerComponent().getModel().setData(viewState);
        MockODataService.save({
          products: viewState.products,
          orders: viewState.orders,
          filters: viewState.filters
        });
        if (showToast) {
          MessageToast.show("Demo-Daten wurden zurückgesetzt.");
        }
      },

      applySelectedProduct: function (viewState, productId) {
        var product = viewState.products.find(function (entry) {
          return entry.id === productId;
        });

        viewState.selectedProduct = product || null;
        viewState.selectedProductOrders = product
          ? viewState.orders.filter(function (order) {
            return order.productId === product.id;
          })
          : [];
        return product;
      },

      _showProductDialog: function (product) {
        var that = this;
        var inputs = {
          name: new Input({ value: product.name }),
          category: new Input({ value: product.category }),
          stock: new Input({ value: String(product.stock), type: "Number" }),
          minStock: new Input({ value: String(product.minStock), type: "Number" }),
          price: new Input({ value: String(product.price), type: "Number" }),
          sold: new Input({ value: String(product.sold), type: "Number" })
        };

        function field(label, input) {
          return new VBox({
            items: [
              new Label({ text: label }),
              input
            ]
          }).addStyleClass("editField");
        }

        function setFieldState(input, state, message) {
          input.setValueState(state);
          input.setValueStateText(message || "");
        }

        function validateProductInput(next) {
          var isValid = true;

          Object.keys(inputs).forEach(function (key) {
            setFieldState(inputs[key], "None", "");
          });

          if (!next.name) {
            setFieldState(inputs.name, "Error", "Produktname ist ein Pflichtfeld.");
            isValid = false;
          }
          if (!next.category) {
            setFieldState(inputs.category, "Error", "Kategorie ist ein Pflichtfeld.");
            isValid = false;
          }
          [
            { key: "stock", label: "Bestand", min: 0, integer: true },
            { key: "minStock", label: "Mindestbestand", min: 1, integer: true },
            { key: "price", label: "Preis", min: 0.01, integer: false },
            { key: "sold", label: "Verkauft", min: 0, integer: true }
          ].forEach(function (rule) {
            var value = next[rule.key];
            if (Number.isNaN(value) || value < rule.min || (rule.integer && Math.round(value) !== value)) {
              setFieldState(inputs[rule.key], "Error", rule.label + " muss " + (rule.integer ? "eine ganze Zahl" : "eine Zahl") + " ab " + rule.min + " sein.");
              isValid = false;
            }
          });

          return isValid;
        }

        if (this._productDialog) {
          this._productDialog.destroy();
        }

        this._productDialog = new Dialog({
          title: "Produkt bearbeiten",
          contentWidth: "28rem",
          content: [
            new VBox({
              items: [
                field("Produktname", inputs.name),
                field("Kategorie", inputs.category),
                field("Bestand", inputs.stock),
                field("Mindestbestand", inputs.minStock),
                field("Preis", inputs.price),
                field("Verkauft", inputs.sold)
              ]
            }).addStyleClass("editDialogContent")
          ],
          beginButton: new Button({
            text: "Speichern",
            type: "Emphasized",
            press: function () {
              var next = {
                name: inputs.name.getValue().trim(),
                category: inputs.category.getValue().trim(),
                stock: Number(inputs.stock.getValue()),
                minStock: Number(inputs.minStock.getValue()),
                price: Number(inputs.price.getValue()),
                sold: Number(inputs.sold.getValue())
              };

              if (!validateProductInput(next)) {
                MessageToast.show("Bitte die markierten Produktdaten korrigieren.");
                return;
              }

              that._updateState(function (data) {
                var target = data.products.find(function (entry) {
                  return entry.id === product.id;
                });
                if (!target) {
                  return;
                }
                target.name = next.name;
                target.category = next.category;
                target.stock = Math.round(next.stock);
                target.minStock = Math.round(next.minStock);
                target.price = Math.round(next.price * 100) / 100;
                target.sold = Math.round(next.sold);
                data.orders.forEach(function (order) {
                  if (order.productId === target.id) {
                    order.productName = target.name;
                  }
                });
              });
              that._productDialog.close();
              MessageToast.show("Produktdaten gespeichert.");
            }
          }),
          endButton: new Button({
            text: "Abbrechen",
            press: function () {
              that._productDialog.close();
            }
          })
        });

        this.getView().addDependent(this._productDialog);
        this._productDialog.open();
      },

      _showReorderDialog: function (product) {
        var that = this;
        var recommendedQuantity = Math.max(product.minStock * 2 - product.stock, product.minStock);
        var quantityInput = new Input({ value: String(recommendedQuantity), type: "Number" });
        var supplierInput = new Input({ value: suggestedSupplier(product.category) });
        var leadTimeSelect = new Select({
          selectedKey: product.statusKey === "critical" ? "1" : "3",
          items: [
            new Item({ key: "1", text: "1 Tag" }),
            new Item({ key: "3", text: "3 Tage" }),
            new Item({ key: "5", text: "5 Tage" })
          ]
        });

        function setState(input, state, text) {
          input.setValueState(state);
          input.setValueStateText(text || "");
        }

        if (this._reorderDialog) {
          this._reorderDialog.destroy();
        }

        this._reorderDialog = new Dialog({
          title: "Nachbestellung anlegen",
          contentWidth: "28rem",
          content: [
            new VBox({
              items: [
                new Label({ text: product.name + " · Bestand " + product.stock + " / Mindestbestand " + product.minStock }),
                new Label({ text: "Bestellmenge" }),
                quantityInput,
                new Label({ text: "Lieferant" }),
                supplierInput,
                new Label({ text: "Erwartete Lieferzeit" }),
                leadTimeSelect
              ]
            }).addStyleClass("editDialogContent")
          ],
          beginButton: new Button({
            text: "Bestellung erstellen",
            type: "Emphasized",
            press: function () {
              var quantity = Number(quantityInput.getValue());
              var supplier = supplierInput.getValue().trim();
              setState(quantityInput, "None", "");
              setState(supplierInput, "None", "");

              if (Number.isNaN(quantity) || Math.round(quantity) !== quantity || quantity < 1) {
                setState(quantityInput, "Error", "Die Bestellmenge muss eine ganze Zahl ab 1 sein.");
                MessageToast.show("Bitte die Bestellmenge korrigieren.");
                return;
              }
              if (!supplier) {
                setState(supplierInput, "Error", "Lieferant ist ein Pflichtfeld.");
                MessageToast.show("Bitte einen Lieferanten eintragen.");
                return;
              }

              that._saveReorder(product, quantity, supplier, Number(leadTimeSelect.getSelectedKey()));
              that._reorderDialog.close();
            }
          }),
          endButton: new Button({
            text: "Abbrechen",
            press: function () {
              that._reorderDialog.close();
            }
          })
        });

        this.getView().addDependent(this._reorderDialog);
        this._reorderDialog.open();
      },

      _showGoodsReceiptDialog: function (order) {
        var that = this;
        var quantityInput = new Input({ value: String(order.quantity), type: "Number" });

        if (this._goodsReceiptDialog) {
          this._goodsReceiptDialog.destroy();
        }

        this._goodsReceiptDialog = new Dialog({
          title: "Wareneingang buchen",
          contentWidth: "28rem",
          content: [
            new VBox({
              items: [
                new Label({ text: order.productName + " · bestellt " + order.quantity + " Stück" }),
                new Label({ text: "Tatsaechlich gelieferte Menge" }),
                quantityInput
              ]
            }).addStyleClass("editDialogContent")
          ],
          beginButton: new Button({
            text: "Buchen",
            type: "Accept",
            press: function () {
              var receiptQuantity = Number(quantityInput.getValue());
              quantityInput.setValueState("None");

              if (Number.isNaN(receiptQuantity) || Math.round(receiptQuantity) !== receiptQuantity || receiptQuantity < 1) {
                quantityInput.setValueState("Error");
                quantityInput.setValueStateText("Die Liefermenge muss eine ganze Zahl ab 1 sein.");
                MessageToast.show("Bitte die Liefermenge korrigieren.");
                return;
              }

              that._completeOrder(order, receiptQuantity);
              that._goodsReceiptDialog.close();
            }
          }),
          endButton: new Button({
            text: "Abbrechen",
            press: function () {
              that._goodsReceiptDialog.close();
            }
          })
        });

        this.getView().addDependent(this._goodsReceiptDialog);
        this._goodsReceiptDialog.open();
      }
    });

    function formatDate(value) {
      var date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return "-";
      }
      return dateFormatter.format(date);
    }

    function addDays(value, days) {
      var date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        date = new Date();
      }
      date.setDate(date.getDate() + days);
      return date.toISOString();
    }

    function suggestedSupplier(category) {
      var suppliers = {
        "Lebensmittel": "Campus Food Service",
        "Backwaren": "Bäckerei Campus",
        "Getränke": "BioKontor Mitte",
        "Snacks": "Snackwerk GmbH",
        "Zubehör": "Gastrobedarf Weber",
        "Verpackung": "Pack & Go GmbH",
        "Reinigungsbedarf": "Hygiene Nord"
      };
      return suppliers[category] || "SmartStock Lieferant";
    }
  }
);
