/** 免登入訂單查詢：姓名 + 電話 */
function handleQueryOrders_(payload) {
  const name = String(payload && payload.name || "").trim();
  const phone = normalizePhoneForQuery_(payload && payload.phone || "");

  if (!name || phone.length < 8) {
    return { ok: false, success: false, message: "請輸入姓名與正確電話。", orders: [] };
  }

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName("Orders");
  if (!sheet) {
    return { ok: false, success: false, message: "找不到 Orders 工作表。", orders: [] };
  }

  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return { ok: true, success: true, orders: [] };

  const headers = values[0].map(function (value) { return normalizeQueryHeader_(value); });
  const index = {};
  headers.forEach(function (header, position) { index[header] = position; });

  const allowedStatus = ["新訂單", "已出貨", "已完成", "已取消"];
  const orders = [];

  for (let rowIndex = values.length - 1; rowIndex >= 1; rowIndex--) {
    const row = values[rowIndex];
    const rowName = queryCell_(row, index, ["客戶姓名", "姓名", "收件人姓名", "訂購人姓名"]);
    const rowPhone = normalizePhoneForQuery_(queryCell_(row, index, ["電話", "收件人電話", "客戶電話", "手機"]));

    if (rowName !== name || rowPhone !== phone) continue;

    let status = queryCell_(row, index, ["訂單狀態", "狀態"]) || "新訂單";
    if (allowedStatus.indexOf(status) === -1) status = "新訂單";

    const orderId = queryCell_(row, index, ["訂單編號", "訂單ID"]);
    orders.push({
      orderNumber: orderId,
      createdAt: queryCell_(row, index, ["建立日期時間", "建立日期", "訂單日期", "下單時間"]),
      status: status,
      totalAmount: queryAmount_(queryCell_(row, index, ["訂單總金額", "總金額", "合計"])),
      itemCount: parseInt(queryCell_(row, index, ["商品總件數", "商品件數", "總件數"]), 10) || 0,
      summary: queryCell_(row, index, ["訂單摘要"]),
    });

    if (orders.length >= 20) break;
  }

  return { ok: true, success: true, orders: orders };
}

function normalizeQueryHeader_(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .replace(/[\u200B-\u200D\u2060]/g, "")
    .replace(/\u3000/g, " ")
    .replace(/\s+/g, "")
    .trim();
}

function queryCell_(row, index, aliases) {
  for (let i = 0; i < aliases.length; i++) {
    const position = index[normalizeQueryHeader_(aliases[i])];
    if (position !== undefined && row[position] !== "") return String(row[position]).trim();
  }
  return "";
}

function normalizePhoneForQuery_(value) {
  return String(value || "").replace(/\D/g, "");
}

function queryAmount_(value) {
  const numberValue = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numberValue) ? numberValue : 0;
}
