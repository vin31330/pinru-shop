/**
 * LINE 新訂單通知
 *
 * Apps Script「專案設定 → 指令碼屬性」請設定：
 * 訂單專用 B 官方帳號：
 * ORDER_LINE_CHANNEL_ID（僅供辨識，可留白）
 * ORDER_LINE_CHANNEL_ACCESS_TOKEN（B 官方帳號的 Channel access token）
 * ORDER_LINE_ADMIN_USER_ID（接收訂單通知的 LINE User ID）
 * ORDER_ADMIN_URL（可留白）
 */
function sendNewOrderLineNotification_(payload, orderInfo) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const channelId = String(properties.getProperty("ORDER_LINE_CHANNEL_ID") || "").trim();
    const token = String(properties.getProperty("ORDER_LINE_CHANNEL_ACCESS_TOKEN") || "").trim();
    const userId = String(properties.getProperty("ORDER_LINE_ADMIN_USER_ID") || "").trim();
    const adminUrl = String(properties.getProperty("ORDER_ADMIN_URL") || "").trim();

    if (!token || !userId) {
      return { sent: false, reason: "尚未設定訂單專用 B 官方帳號的 Access Token 或 LINE User ID" };
    }

    // Channel ID 不參與 Push API 呼叫；保留在 Script Properties 方便辨識目前綁定的 B 官方帳號。
    void channelId;

    const customer = payload && payload.customer ? payload.customer : {};
    const itemCount = Math.max(0, Number(orderInfo && orderInfo.itemCount) || 0);
    const totalAmount = Math.max(0, Number(orderInfo && orderInfo.totalAmount) || 0);
    const orderNumber = String(orderInfo && orderInfo.orderNumber || "").trim();

    const lines = [
      "🔔 新訂單",
      "",
      "訂單編號",
      orderNumber,
      "",
      "姓名",
      String(customer.name || "未填寫"),
      "",
      "電話",
      String(customer.phone || "未填寫"),
      "",
      "金額",
      "NT$" + formatLineAmount_(totalAmount),
      "",
      "共" + itemCount + "件商品",
    ];

    if (adminUrl) {
      lines.push("", "👉 查看後台", adminUrl);
    }

    const response = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
      method: "post",
      contentType: "application/json",
      headers: { Authorization: "Bearer " + token },
      payload: JSON.stringify({
        to: userId,
        messages: [{ type: "text", text: lines.join("\n") }],
      }),
      muteHttpExceptions: true,
    });

    const statusCode = response.getResponseCode();
    const body = response.getContentText();
    if (statusCode < 200 || statusCode >= 300) {
      console.error("LINE 通知失敗：" + statusCode + " " + body);
      return { sent: false, reason: "LINE API 回傳 " + statusCode, detail: body };
    }

    return { sent: true };
  } catch (error) {
    console.error("LINE 通知發生錯誤：", error);
    return { sent: false, reason: error && error.message ? error.message : String(error) };
  }
}

function formatLineAmount_(value) {
  return String(Math.round(Number(value) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** 手動測試 LINE 設定，不會建立訂單。 */
function testLineNotification_() {
  const result = sendNewOrderLineNotification_(
    { customer: { name: "測試顧客", phone: "0900000000" } },
    { orderNumber: "PRTEST0001", itemCount: 3, totalAmount: 1280 }
  );
  console.log(result);
}
