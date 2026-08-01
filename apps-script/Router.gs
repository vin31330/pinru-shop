/** API 路由設定 */
const API_ROUTES = Object.freeze({
  health: "handleHealthRoute",
  settings: "handleSettingsRoute",
  createorder: "handleCreateOrder_",
  queryorders: "handleQueryOrders_",
});

function routeRequest(action, context) {
  const normalizedAction = String(action || "").trim().toLowerCase();
  if (!normalizedAction) throw new Error("缺少 API action");

  const handlerName = API_ROUTES[normalizedAction];
  if (!handlerName) throw new Error("找不到 API 路由：" + normalizedAction);

  const handler = globalThis[handlerName];
  if (typeof handler !== "function") {
    throw new Error("API 處理函式不存在：" + handlerName);
  }

  const requestContext = context || {};

  if (normalizedAction === "createorder" || normalizedAction === "queryorders") {
    if (String(requestContext.method || "").toUpperCase() !== "POST") {
      throw new Error(normalizedAction + " 僅支援 POST 請求");
    }
    return handler(requestContext.payload || {});
  }

  return handler(requestContext);
}

function testRouter() {
  const expected = {
    health: "handleHealthRoute",
    settings: "handleSettingsRoute",
    createorder: "handleCreateOrder_",
    queryorders: "handleQueryOrders_",
  };

  Object.keys(expected).forEach(function (key) {
    if (API_ROUTES[key] !== expected[key]) {
      throw new Error(key + " 路由設定錯誤");
    }
  });

  console.log("Router 測試成功");
  console.log(API_ROUTES);
}
