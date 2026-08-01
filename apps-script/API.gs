/**
 * 網站 API 入口
 *
 * GET：
 * /exec?action=health
 * /exec?action=settings
 *
 * POST：
 * /exec?action=createOrder
 * /exec?action=queryOrders
 */
function doGet(e) {
  try {
    const action = String(e && e.parameter && e.parameter.action ? e.parameter.action : "health").trim();
    const result = routeRequest(action, {
      method: "GET",
      parameter: e ? e.parameter : {},
      event: e,
    });
    return createJsonResponse_(result);
  } catch (error) {
    console.error(error);
    return createJsonResponse_({
      success: false,
      ok: false,
      message: error && error.message ? error.message : String(error),
    });
  }
}

function doPost(e) {
  try {
    const action = String(e && e.parameter && e.parameter.action ? e.parameter.action : "").trim();
    if (!action) throw new Error("缺少 API action");

    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseError) {
        throw new Error("POST JSON 格式錯誤：" + parseError.message);
      }
    }

    const result = routeRequest(action, {
      method: "POST",
      parameter: e ? e.parameter : {},
      payload: payload,
      event: e,
    });
    return createJsonResponse_(result);
  } catch (error) {
    console.error(error);
    return createJsonResponse_({
      success: false,
      ok: false,
      message: error && error.message ? error.message : String(error),
    });
  }
}

function createJsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getPublicSettings_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName("Settings");
  if (!sheet) throw new Error("找不到 Settings 工作表");

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow < 2) return {};

  const values = sheet.getRange(1, 1, lastRow, lastColumn).getDisplayValues();
  const headers = values[0].map(function (value) { return String(value || "").trim(); });
  const keyIndex = headers.indexOf("設定鍵");
  const valueIndex = headers.indexOf("設定值");
  const typeIndex = headers.indexOf("資料類型");
  const enabledIndex = headers.indexOf("顯示狀態");

  if (keyIndex === -1) throw new Error("Settings 找不到「設定鍵」欄位");
  if (valueIndex === -1) throw new Error("Settings 找不到「設定值」欄位");

  const settings = {};
  for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {
    const row = values[rowIndex];
    const key = String(row[keyIndex] || "").trim();
    const rawValue = String(row[valueIndex] || "").trim();
    const dataType = typeIndex >= 0 ? String(row[typeIndex] || "String").trim() : "String";
    const isEnabled = enabledIndex === -1 || parseBooleanSetting_(row[enabledIndex]);
    if (!key || !isEnabled) continue;
    settings[key] = convertSettingValue_(rawValue, dataType);
  }
  return settings;
}

function convertSettingValue_(value, dataType) {
  const normalizedType = String(dataType || "").trim().toLowerCase();
  switch (normalizedType) {
    case "boolean":
      return parseBooleanSetting_(value);
    case "number": {
      const numberValue = Number(value);
      return Number.isNaN(numberValue) ? 0 : numberValue;
    }
    default:
      return String(value || "");
  }
}

function parseBooleanSetting_(value) {
  const normalizedValue = String(value || "").trim().toLowerCase();
  return ["true", "1", "yes", "y", "是", "顯示", "啟用"].includes(normalizedValue);
}

function handleHealthRoute() {
  return {
    success: true,
    ok: true,
    message: "世界好用網站 API 運作正常",
    timestamp: new Date().toISOString(),
  };
}

function handleSettingsRoute() {
  return { success: true, ok: true, data: getPublicSettings_() };
}
