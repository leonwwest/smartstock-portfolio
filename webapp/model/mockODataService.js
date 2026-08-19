sap.ui.define([], function () {
  "use strict";

  var storageKey = "smartstock-openui5-state";

  var productSet = [
    { ProductID: "P-1001", Name: "Kaffee Bohnen", Category: "Lebensmittel", Stock: 12, MinStock: 20, Price: 8.99, Currency: "EUR", Sold: 185, Status: "Nachbestellen" },
    { ProductID: "P-1002", Name: "Milch", Category: "Lebensmittel", Stock: 0, MinStock: 24, Price: 1.29, Currency: "EUR", Sold: 320, Status: "Kritisch" },
    { ProductID: "P-1003", Name: "Pappbecher", Category: "Zubehör", Stock: 150, MinStock: 80, Price: 0.1, Currency: "EUR", Sold: 900, Status: "OK" },
    { ProductID: "P-1004", Name: "Zucker", Category: "Lebensmittel", Stock: 8, MinStock: 18, Price: 1.49, Currency: "EUR", Sold: 145, Status: "Nachbestellen" },
    { ProductID: "P-1005", Name: "Croissants", Category: "Backwaren", Stock: 18, MinStock: 30, Price: 1.9, Currency: "EUR", Sold: 260, Status: "Nachbestellen" },
    { ProductID: "P-1006", Name: "Tee Bio-Mix", Category: "Getränke", Stock: 32, MinStock: 18, Price: 3.4, Currency: "EUR", Sold: 90, Status: "OK" },
    { ProductID: "P-1007", Name: "Servietten", Category: "Zubehör", Stock: 44, MinStock: 100, Price: 0.04, Currency: "EUR", Sold: 1100, Status: "Nachbestellen" },
    { ProductID: "P-1008", Name: "Schokoriegel", Category: "Snacks", Stock: 67, MinStock: 30, Price: 1.2, Currency: "EUR", Sold: 230, Status: "OK" },
    { ProductID: "P-1009", Name: "Haferdrink", Category: "Getränke", Stock: 6, MinStock: 20, Price: 2.19, Currency: "EUR", Sold: 150, Status: "Nachbestellen" },
    { ProductID: "P-1010", Name: "Espresso Pads", Category: "Lebensmittel", Stock: 4, MinStock: 18, Price: 4.49, Currency: "EUR", Sold: 130, Status: "Nachbestellen" },
    { ProductID: "P-1011", Name: "Muffins Blaubeere", Category: "Backwaren", Stock: 0, MinStock: 24, Price: 2.4, Currency: "EUR", Sold: 210, Status: "Kritisch" },
    { ProductID: "P-1012", Name: "Bagels Sesam", Category: "Backwaren", Stock: 36, MinStock: 28, Price: 1.6, Currency: "EUR", Sold: 170, Status: "OK" },
    { ProductID: "P-1013", Name: "Wasser still", Category: "Getränke", Stock: 96, MinStock: 60, Price: 0.8, Currency: "EUR", Sold: 410, Status: "OK" },
    { ProductID: "P-1014", Name: "Limonade Zitrone", Category: "Getränke", Stock: 22, MinStock: 35, Price: 1.1, Currency: "EUR", Sold: 260, Status: "Nachbestellen" },
    { ProductID: "P-1015", Name: "Müsliriegel", Category: "Snacks", Stock: 14, MinStock: 40, Price: 1.35, Currency: "EUR", Sold: 310, Status: "Nachbestellen" },
    { ProductID: "P-1016", Name: "Nussmix", Category: "Snacks", Stock: 52, MinStock: 25, Price: 2.1, Currency: "EUR", Sold: 160, Status: "OK" },
    { ProductID: "P-1017", Name: "Rührstäbchen Holz", Category: "Zubehör", Stock: 0, MinStock: 120, Price: 0.03, Currency: "EUR", Sold: 1300, Status: "Kritisch" },
    { ProductID: "P-1018", Name: "To-Go Deckel", Category: "Verpackung", Stock: 280, MinStock: 180, Price: 0.08, Currency: "EUR", Sold: 980, Status: "OK" },
    { ProductID: "P-1019", Name: "Papiertüten", Category: "Verpackung", Stock: 40, MinStock: 90, Price: 0.12, Currency: "EUR", Sold: 420, Status: "Nachbestellen" },
    { ProductID: "P-1020", Name: "Kassenrollen", Category: "Zubehör", Stock: 9, MinStock: 15, Price: 0.75, Currency: "EUR", Sold: 55, Status: "Nachbestellen" },
    { ProductID: "P-1021", Name: "Reiniger Küche", Category: "Reinigungsbedarf", Stock: 3, MinStock: 8, Price: 3.9, Currency: "EUR", Sold: 35, Status: "Nachbestellen" },
    { ProductID: "P-1022", Name: "Einmalhandschuhe", Category: "Reinigungsbedarf", Stock: 0, MinStock: 12, Price: 5.5, Currency: "EUR", Sold: 75, Status: "Kritisch" },
    { ProductID: "P-1023", Name: "Desinfektion", Category: "Reinigungsbedarf", Stock: 11, MinStock: 10, Price: 4.25, Currency: "EUR", Sold: 62, Status: "OK" },
    { ProductID: "P-1024", Name: "Kakao Pulver", Category: "Lebensmittel", Stock: 19, MinStock: 14, Price: 3.2, Currency: "EUR", Sold: 95, Status: "OK" }
  ];

  var orderSet = [
    { OrderID: "B-9001", ProductID: "P-1002", ProductName: "Milch", Quantity: 48, Status: "offen", CreatedAt: "2026-05-17T00:00:00", ExpectedAt: "2026-05-18T00:00:00", Supplier: "Molkerei Campus GmbH" },
    { OrderID: "B-9002", ProductID: "P-1007", ProductName: "Servietten", Quantity: 160, Status: "offen", CreatedAt: "2026-05-17T00:00:00", ExpectedAt: "2026-05-21T00:00:00", Supplier: "Gastrobedarf Weber" },
    { OrderID: "B-9003", ProductID: "P-1011", ProductName: "Muffins Blaubeere", Quantity: 48, Status: "offen", CreatedAt: "2026-05-18T00:00:00", ExpectedAt: "2026-05-19T00:00:00", Supplier: "Bäckerei Campus" },
    { OrderID: "B-9004", ProductID: "P-1017", ProductName: "Rührstäbchen Holz", Quantity: 240, Status: "offen", CreatedAt: "2026-05-18T00:00:00", ExpectedAt: "2026-05-19T00:00:00", Supplier: "Gastrobedarf Weber" },
    { OrderID: "B-9005", ProductID: "P-1019", ProductName: "Papiertüten", Quantity: 180, Status: "offen", CreatedAt: "2026-05-18T00:00:00", ExpectedAt: "2026-05-22T00:00:00", Supplier: "Pack & Go GmbH" },
    { OrderID: "B-9006", ProductID: "P-1022", ProductName: "Einmalhandschuhe", Quantity: 24, Status: "offen", CreatedAt: "2026-05-18T00:00:00", ExpectedAt: "2026-05-19T00:00:00", Supplier: "Hygiene Nord" },
    { OrderID: "B-9007", ProductID: "P-1009", ProductName: "Haferdrink", Quantity: 40, Status: "offen", CreatedAt: "2026-05-18T00:00:00", ExpectedAt: "2026-05-21T00:00:00", Supplier: "BioKontor Mitte" },
    { OrderID: "B-9008", ProductID: "P-1015", ProductName: "Müsliriegel", Quantity: 80, Status: "offen", CreatedAt: "2026-05-18T00:00:00", ExpectedAt: "2026-05-22T00:00:00", Supplier: "Snackwerk GmbH" }
  ];

  var seedState = {
    products: productSet.map(toAppProduct),
    orders: orderSet.map(toAppOrder),
    filters: { query: "", status: "all", category: "all", orderStatus: "offen" }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
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
    return Object.assign({ query: "", status: "all", category: "all", orderStatus: "offen" }, filters || {});
  }

  function toAppProduct(product) {
    return {
      id: product.ProductID,
      name: normalizeText(product.Name),
      category: normalizeText(product.Category),
      stock: product.Stock,
      minStock: product.MinStock,
      price: product.Price,
      sold: product.Sold
    };
  }

  function toAppOrder(order) {
    return {
      id: order.OrderID,
      productId: order.ProductID,
      productName: normalizeText(order.ProductName),
      quantity: order.Quantity,
      status: order.Status,
      supplier: normalizeText(order.Supplier || "SmartStock Lieferant"),
      createdAt: order.CreatedAt || "2026-05-18T00:00:00",
      expectedAt: order.ExpectedAt || addDays(order.CreatedAt || "2026-05-18T00:00:00", 3),
      completedAt: order.CompletedAt || null,
      cancelledAt: order.CancelledAt || null,
      receivedQuantity: order.ReceivedQuantity || null
    };
  }

  function toODataProduct(product) {
    return {
      ProductID: product.id,
      Name: product.name,
      Category: product.category,
      Stock: product.stock,
      MinStock: product.minStock,
      Price: product.price,
      Currency: "EUR",
      Sold: product.sold,
      Status: product.stock === 0 ? "Kritisch" : product.stock < product.minStock ? "Nachbestellen" : "OK"
    };
  }

  function toODataOrder(order) {
    return {
      OrderID: order.id,
      ProductID: order.productId,
      ProductName: order.productName,
      Quantity: order.quantity,
      Status: order.status,
      CreatedAt: order.createdAt || "2026-05-18T00:00:00",
      ExpectedAt: order.expectedAt || addDays(order.createdAt || "2026-05-18T00:00:00", 3),
      CompletedAt: order.completedAt || null,
      CancelledAt: order.cancelledAt || null,
      ReceivedQuantity: order.receivedQuantity || null,
      Supplier: order.supplier || "SmartStock Mock Supplier"
    };
  }

  function normalize(state) {
    return {
      products: (state.products || []).map(function (product) {
        return {
          id: product.id,
          name: normalizeText(product.name),
          category: normalizeText(product.category),
          stock: Number(product.stock) || 0,
          minStock: Number(product.minStock) || 0,
          price: Number(product.price) || 0,
          sold: Number(product.sold) || 0
        };
      }),
      orders: (state.orders || []).map(function (order) {
        return {
          id: order.id,
          productId: order.productId,
          productName: normalizeText(order.productName),
          quantity: Number(order.quantity) || 0,
          status: order.status || "offen",
          supplier: normalizeText(order.supplier || "SmartStock Lieferant"),
          createdAt: order.createdAt || "2026-05-18T00:00:00",
          expectedAt: order.expectedAt || addDays(order.createdAt || "2026-05-18T00:00:00", 3),
          completedAt: order.completedAt || null,
          cancelledAt: order.cancelledAt || null,
          receivedQuantity: order.receivedQuantity || null
        };
      }),
      filters: normalizeFilters(state.filters)
    };
  }

  function addDays(value, days) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      date = new Date("2026-05-18T00:00:00");
    }
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10) + "T00:00:00";
  }

  function read() {
    var raw = localStorage.getItem(storageKey);
    if (!raw) {
      return clone(seedState);
    }

    try {
      return normalize(JSON.parse(raw));
    } catch (error) {
      return clone(seedState);
    }
  }

  function save(state) {
    localStorage.setItem(storageKey, JSON.stringify(normalize(state)));
  }

  function reset() {
    var state = clone(seedState);
    save(state);
    return state;
  }

  function count(entitySet) {
    return query(entitySet).length;
  }

  function select(entitySet, properties) {
    var entries = query(entitySet);
    return entries.map(function (entry) {
      return properties.reduce(function (selected, property) {
        selected[property] = entry[property];
        return selected;
      }, {});
    });
  }

  function query(entitySet) {
    var state = read();
    if (entitySet === "ProductSet") {
      return state.products.map(toODataProduct);
    }
    if (entitySet === "OrderSet") {
      return state.orders.map(toODataOrder);
    }
    return [];
  }

  function expandProductsWithOrders() {
    var state = read();
    return state.products.map(function (product) {
      return Object.assign({}, toODataProduct(product), {
        ToOrders: state.orders.filter(function (order) {
          return order.productId === product.id;
        }).map(function (order) {
          return toODataOrder(order);
        })
      });
    });
  }

  function getExample(name) {
    var examples = {
      products: {
        title: "ProductSet",
        request: "GET /ProductSet",
        description: "Alle Produkte als OData-nahe Entity-Set-Ausgabe.",
        result: query("ProductSet").slice(0, 5)
      },
      orders: {
        title: "OrderSet",
        request: "GET /OrderSet",
        description: "Alle Bestellvorgaenge mit Status, Lieferant und Termin.",
        result: query("OrderSet").slice(0, 5)
      },
      count: {
        title: "$count",
        request: "GET /ProductSet/$count",
        description: "Zaehlt die Produkte im ProductSet.",
        result: { count: count("ProductSet") }
      },
      select: {
        title: "$select",
        request: "GET /ProductSet?$select=ProductID,Name,Stock,Status",
        description: "Reduzierte Produktliste fuer schlanke UI- oder Tabellenabfragen.",
        result: select("ProductSet", ["ProductID", "Name", "Stock", "Status"]).slice(0, 8)
      },
      expand: {
        title: "$expand",
        request: "GET /ProductSet?$expand=ToOrders",
        description: "Produkte inklusive zugehoeriger Bestellungen als Navigation Property.",
        result: expandProductsWithOrders().filter(function (product) {
          return product.ToOrders.length > 0;
        }).slice(0, 4)
      }
    };

    return examples[name] || examples.products;
  }

  return {
    read: read,
    save: save,
    reset: reset,
    query: query,
    count: count,
    select: select,
    expandProductsWithOrders: expandProductsWithOrders,
    getExample: getExample
  };
});
