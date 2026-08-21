/**
 * 選配：新訂單 Email 通知。
 * Apps Script「專案設定 → 指令碼屬性」設定：
 * ORDER_NOTIFICATION_EMAIL
 */
function sendNewOrderEmail_(payload, orderInfo) {
  try {
    const email = String(PropertiesService.getScriptProperties()
      .getProperty("ORDER_NOTIFICATION_EMAIL") || "").trim();

    if (!email) return { sent: false, reason: "ORDER_NOTIFICATION_EMAIL 尚未設定" };

    const customer = payload && payload.customer ? payload.customer : {};
    const items = payload && Array.isArray(payload.items) ? payload.items : [];
    const orderNumber = String(orderInfo && orderInfo.orderNumber || "").trim();
    const totalAmount = Number(orderInfo && orderInfo.totalAmount) || 0;

    const detail = items.map(function (item, index) {
      const options = item && item.selectedOptions ? Object.keys(item.selectedOptions)
        .filter(function (key) { return key !== "活動選擇識別"; })
        .map(function (key) { return key + "：" + item.selectedOptions[key]; })
        .join("、") : "";

      const activitySelections = item && Array.isArray(item.activitySelections)
        ? item.activitySelections.map(function (selection, selectionIndex) {
            const selectionOptions = selection && selection.selectedOptions ? Object.keys(selection.selectedOptions)
              .map(function (key) { return key + "：" + selection.selectedOptions[key]; })
              .join("、") : "";
            return "   第" + (selectionIndex + 1) + "件：" + (selection.productName || "商品") + (selectionOptions ? "（" + selectionOptions + "）" : "");
          }).join("\n")
        : "";

      return [
        (index + 1) + ". " + (item.name || "商品") + " × " + (Number(item.quantity) || 1),
        options ? "   規格：" + options : "",
        activitySelections,
        "   小計：NT$" + formatEmailAmount_((Number(item.unitPrice) || 0) * (Number(item.quantity) || 1)),
      ].filter(String).join("\n");
    }).join("\n\n");

    const subject = "【新訂單】" + orderNumber;
    const body = [
      "收到新訂單",
      "",
      "訂單編號：" + orderNumber,
      "姓名：" + (customer.name || "未填寫"),
      "電話：" + (customer.phone || "未填寫"),
      "取貨方式：" + (customer.shipping || "未填寫"),
      "",
      "商品：",
      detail,
      "",
      "總金額：NT$" + formatEmailAmount_(totalAmount),
      customer.note ? "備註：" + customer.note : "",
      payload && payload.couponCode ? "優惠碼：" + payload.couponCode : "",
    ].filter(String).join("\n");

    MailApp.sendEmail(email, subject, body);
    return { sent: true };
  } catch (error) {
    console.error("Email 通知發生錯誤：", error);
    return { sent: false, reason: error && error.message ? error.message : String(error) };
  }
}

function formatEmailAmount_(value) {
  return String(Math.round(Number(value) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
