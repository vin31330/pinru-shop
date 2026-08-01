/**
 * 世界好用 小新和品儒
 * 訂單系統 V21
 *
 * 功能：
 * 1. 訂單編號：PRYYYYMMDD0001
 * 2. LockService 防止同時送單產生重複編號
 * 3. clientRequestId 防止前端重複建立同一筆訂單
 * 4. Orders 自動寫入訂單摘要
 * 5. 訂單預設狀態固定為「新訂單」
 * 6. 保留既有 Orders／OrderItems／Order Item Selections 資料
 * 7. 若缺少新版欄位，會自動加到工作表最右側
 */

const ORDERS_SHEET_NAME = "Orders";
const ORDER_ITEMS_SHEET_NAME = "OrderItems";
const ORDER_SELECTIONS_SHEET_NAME = "Order Item Selections";

const ORDER_STATUS_NEW = "新訂單";
const ORDER_SOURCE_WEBSITE = "網站";
const ORDER_NUMBER_PREFIX = "PR";

const ORDER_HEADERS = [
  "訂單編號",
  "訂單ID",
  "建立日期時間",
  "客戶姓名",
  "電話",
  "取貨方式",
  "取貨資訊",
  "商品總金額",
  "優惠折扣",
  "訂單總金額",
  "商品總件數",
  "訂單摘要",
  "備註",
  "訂單狀態",
  "來源",
  "送單識別碼",
  "最後更新時間"
];

const ORDER_ITEM_HEADERS = [
  "訂單明細ID",
  "訂單ID",
  "項目類型",
  "商品ID",
  "活動ID",
  "方案ID",
  "商品名稱快照",
  "活動名稱快照",
  "方案名稱快照",
  "購買組數",
  "每組件數",
  "實際商品件數",
  "每組原價",
  "每組成交價",
  "折扣金額",
  "小計",
  "規格摘要",
  "商品內容摘要",
  "顯示順序"
];

const ORDER_SELECTION_HEADERS = [
  "選擇明細ID",
  "訂單明細ID",
  "訂單ID",
  "第幾組",
  "第幾件",
  "商品ID",
  "商品名稱快照",
  "規格內容",
  "規格內容JSON",
  "單件參考價",
  "單件加價",
  "活動商品ID",
  "備註"
];


/**
 * createOrder API 主程式。
 *
 * @param {Object} payload 網站送出的訂單資料
 * @return {Object}
 */
function handleCreateOrder_(payload) {
  validateOrderPayload_(payload);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const spreadsheet =
      SpreadsheetApp.getActiveSpreadsheet();

    const ordersSheet =
      getOrCreateSheetWithHeaders_(
        spreadsheet,
        ORDERS_SHEET_NAME,
        ORDER_HEADERS
      );

    const itemsSheet =
      getOrCreateSheetWithHeaders_(
        spreadsheet,
        ORDER_ITEMS_SHEET_NAME,
        ORDER_ITEM_HEADERS
      );

    const selectionsSheet =
      getOrCreateSheetWithHeaders_(
        spreadsheet,
        ORDER_SELECTIONS_SHEET_NAME,
        ORDER_SELECTION_HEADERS
      );

    /*
     * 前端每次準備送單時會產生一個 clientRequestId。
     * 同一個識別碼再次送到 API 時，不會建立第二筆訂單。
     */
    const clientRequestId = safeText_(
      payload.clientRequestId
    );

    if (clientRequestId) {
      const existingOrder =
        findExistingOrderByRequestId_(
          ordersSheet,
          clientRequestId
        );

      if (existingOrder) {
        return {
          ok: true,
          success: true,
          duplicate: true,
          orderId: existingOrder.orderId,
          orderNumber:
            existingOrder.orderId,
          orderSummary:
            existingOrder.orderSummary,
          message:
            "此訂單已經建立，未重複寫入。"
        };
      }
    }

    const now = new Date();

    /*
     * 因為整段程式已被 ScriptLock 包住，
     * 同一時間只會有一個程序取得下一個流水號。
     */
    const orderId =
      createOrderId_(
        ordersSheet,
        now
      );

    const customer =
      payload.customer || {};

    const items =
      Array.isArray(payload.items)
        ? payload.items
        : [];

    const itemRows = [];
    const selectionRows = [];

    let goodsSubtotal = 0;
    let totalPieceCount = 0;
    let totalDiscount = 0;
    let calculatedDealTotal = 0;

    items.forEach(
      function (item, itemIndex) {
        const itemId =
          orderId +
          "-I" +
          String(itemIndex + 1)
            .padStart(3, "0");

        const selectedOptions =
          item.selectedOptions || {};

        const groupCount =
          Math.max(
            1,
            safeInteger_(
              item.quantity,
              1
            )
          );

        const perGroupCount =
          resolvePerGroupCount_(
            item,
            selectedOptions
          );

        const actualPieceCount =
          groupCount *
          perGroupCount;

        const dealPricePerGroup =
          safeNumber_(
            item.unitPrice
          );

        const originalPricePerGroup =
          resolveOriginalGroupPrice_(
            item,
            dealPricePerGroup
          );

        const itemSubtotal =
          dealPricePerGroup *
          groupCount;

        const itemDiscount =
          Math.max(
            0,
            originalPricePerGroup -
              dealPricePerGroup
          ) * groupCount;

        const itemType =
          safeText_(
            item.itemType ||
              "product"
          );

        const activityId =
          safeText_(
            item.activityId ||
              selectedOptions["活動ID"]
          );

        const activityName =
          safeText_(
            selectedOptions["活動名稱"] ||
              (
                itemType === "activity"
                  ? item.name
                  : ""
              )
          );

        const planId =
          safeText_(
            item.planId ||
              selectedOptions["方案ID"]
          );

        const planName =
          safeText_(
            selectedOptions["購買方案"] ||
              selectedOptions["活動方案"]
          );

        const optionSummary =
          buildOptionSummary_(
            selectedOptions
          );

        const contentSummary =
          buildContentSummary_(
            item
          );

        goodsSubtotal +=
          originalPricePerGroup *
          groupCount;

        totalDiscount +=
          itemDiscount;

        totalPieceCount +=
          actualPieceCount;

        calculatedDealTotal +=
          itemSubtotal;

        itemRows.push([
          itemId,
          orderId,
          itemType,
          itemType === "activity"
            ? ""
            : safeText_(
                item.productId
              ),
          activityId,
          planId,
          safeText_(item.name),
          activityName,
          planName,
          groupCount,
          perGroupCount,
          actualPieceCount,
          originalPricePerGroup,
          dealPricePerGroup,
          itemDiscount,
          itemSubtotal,
          optionSummary,
          contentSummary,
          itemIndex + 1
        ]);

        appendItemSelectionRows_(
          selectionRows,
          {
            orderId: orderId,
            itemId: itemId,
            item: item,
            groupCount: groupCount,
            perGroupCount:
              perGroupCount,
            dealPricePerGroup:
              dealPricePerGroup
          }
        );
      }
    );

    /*
     * 訂單總額以網站當下結帳金額為主。
     * 若 payload 沒有正確帶入，才使用明細計算值。
     */
    let orderTotal =
      safeNumber_(
        payload.totalAmount
      );

    if (
      orderTotal <= 0 &&
      calculatedDealTotal > 0
    ) {
      orderTotal =
        calculatedDealTotal;
    }

    if (goodsSubtotal === 0) {
      goodsSubtotal =
        orderTotal +
        totalDiscount;
    }

    if (totalDiscount === 0) {
      totalDiscount =
        Math.max(
          0,
          goodsSubtotal -
            orderTotal
        );
    }

    const orderSummary =
      buildOrderSummary_(
        items,
        totalPieceCount,
        orderTotal
      );

    const pickupInfo =
      buildPickupInfo_(
        customer
      );

    const orderData = {
      "訂單編號": orderId,
      "訂單ID": orderId,
      "建立日期時間": now,
      "客戶姓名":
        safeText_(customer.name),
      "電話":
        safeText_(customer.phone),
      "取貨方式":
        safeText_(customer.shipping),
      "取貨資訊": pickupInfo,
      "商品總金額":
        goodsSubtotal,
      "優惠折扣":
        totalDiscount,
      "訂單總金額":
        orderTotal,
      "商品總件數":
        totalPieceCount,
      "訂單摘要":
        orderSummary,
      "備註":
        safeText_(customer.note),
      "訂單狀態":
        ORDER_STATUS_NEW,
      "來源":
        ORDER_SOURCE_WEBSITE,
      "送單識別碼":
        clientRequestId,
      "最後更新時間":
        now
    };

    appendObjectRow_(
      ordersSheet,
      orderData
    );

    if (itemRows.length) {
      itemsSheet
        .getRange(
          itemsSheet.getLastRow() + 1,
          1,
          itemRows.length,
          ORDER_ITEM_HEADERS.length
        )
        .setValues(itemRows);
    }

    if (selectionRows.length) {
      selectionsSheet
        .getRange(
          selectionsSheet.getLastRow() + 1,
          1,
          selectionRows.length,
          ORDER_SELECTION_HEADERS.length
        )
        .setValues(selectionRows);
    }

    SpreadsheetApp.flush();

    /*
     * 訂單已成功寫入後再發送通知。
     * 通知失敗不會撤銷訂單，也不會讓客人重複送單。
     */
    const notificationInfo = {
      orderNumber: orderId,
      totalAmount: orderTotal,
      itemCount: totalPieceCount
    };

    const lineNotification =
      typeof sendNewOrderLineNotification_ === "function"
        ? sendNewOrderLineNotification_(payload, notificationInfo)
        : { sent: false, reason: "找不到 LineNotification.gs" };

    const emailNotification =
      typeof sendNewOrderEmail_ === "function"
        ? sendNewOrderEmail_(payload, notificationInfo)
        : { sent: false, reason: "找不到 EmailNotification.gs" };

    return {
      ok: true,
      success: true,
      duplicate: false,
      orderId: orderId,
      orderNumber: orderId,
      orderSummary:
        orderSummary,
      status:
        ORDER_STATUS_NEW,
      notifications: {
        line: lineNotification,
        email: emailNotification
      },
      message:
        "訂單已成功建立。"
    };

  } finally {
    lock.releaseLock();
  }
}


/**
 * 依送單識別碼尋找已存在的訂單。
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {string} clientRequestId
 * @return {{orderId:string, orderSummary:string}|null}
 */
function findExistingOrderByRequestId_(
  sheet,
  clientRequestId
) {
  if (
    !clientRequestId ||
    sheet.getLastRow() < 2
  ) {
    return null;
  }

  const headers =
    getSheetHeaders_(sheet);

  const requestIdIndex =
    headers.indexOf(
      "送單識別碼"
    );

  if (requestIdIndex === -1) {
    return null;
  }

  const orderNumberIndex =
    headers.indexOf(
      "訂單編號"
    );

  const orderIdIndex =
    headers.indexOf(
      "訂單ID"
    );

  const summaryIndex =
    headers.indexOf(
      "訂單摘要"
    );

  const values =
    sheet
      .getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        sheet.getLastColumn()
      )
      .getDisplayValues();

  for (
    let rowIndex =
      values.length - 1;
    rowIndex >= 0;
    rowIndex--
  ) {
    const row =
      values[rowIndex];

    if (
      safeText_(
        row[requestIdIndex]
      ) !== clientRequestId
    ) {
      continue;
    }

    const orderId =
      safeText_(
        orderNumberIndex >= 0
          ? row[orderNumberIndex]
          : ""
      ) ||
      safeText_(
        orderIdIndex >= 0
          ? row[orderIdIndex]
          : ""
      );

    return {
      orderId: orderId,
      orderSummary:
        safeText_(
          summaryIndex >= 0
            ? row[summaryIndex]
            : ""
        )
    };
  }

  return null;
}


/**
 * 建立 PRYYYYMMDD0001 格式訂單編號。
 *
 * 每天從 0001 重新開始。
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} ordersSheet
 * @param {Date} date
 * @return {string}
 */
function createOrderId_(
  ordersSheet,
  date
) {
  const timeZone =
    Session.getScriptTimeZone() ||
    "Asia/Taipei";

  const dateText =
    Utilities.formatDate(
      date,
      timeZone,
      "yyyyMMdd"
    );

  const dailyPrefix =
    ORDER_NUMBER_PREFIX +
    dateText;

  let maxSequence = 0;

  if (
    ordersSheet.getLastRow() >= 2
  ) {
    const headers =
      getSheetHeaders_(
        ordersSheet
      );

    let orderColumnIndex =
      headers.indexOf(
        "訂單編號"
      );

    if (orderColumnIndex === -1) {
      orderColumnIndex =
        headers.indexOf(
          "訂單ID"
        );
    }

    if (orderColumnIndex >= 0) {
      const orderNumbers =
        ordersSheet
          .getRange(
            2,
            orderColumnIndex + 1,
            ordersSheet.getLastRow() - 1,
            1
          )
          .getDisplayValues();

      const pattern =
        new RegExp(
          "^" +
          dailyPrefix +
          "(\\d{4,})$"
        );

      orderNumbers.forEach(
        function (row) {
          const value =
            safeText_(row[0]);

          const match =
            value.match(pattern);

          if (!match) {
            return;
          }

          const sequence =
            Number(match[1]);

          if (
            Number.isFinite(sequence)
          ) {
            maxSequence =
              Math.max(
                maxSequence,
                sequence
              );
          }
        }
      );
    }
  }

  return (
    dailyPrefix +
    String(maxSequence + 1)
      .padStart(4, "0")
  );
}


/**
 * 產生 AppSheet 列表直接顯示的訂單摘要。
 *
 * 範例：
 * 玻璃保鮮盒×2、保溫瓶×1｜共3件｜NT$1,280
 */
function buildOrderSummary_(
  items,
  totalPieceCount,
  orderTotal
) {
  const productParts =
    (items || [])
      .map(function (item) {
        const name =
          safeText_(item.name) ||
          "未命名商品";

        const quantity =
          Math.max(
            1,
            safeInteger_(
              item.quantity,
              1
            )
          );

        const unitLabel =
          safeText_(
            item.itemType
          ) === "activity"
            ? "組"
            : "件";

        return (
          name +
          "×" +
          quantity +
          unitLabel
        );
      });

  const detailText =
    productParts.join("、");

  const pieceText =
    "共" +
    safeInteger_(
      totalPieceCount,
      1
    ) +
    "件";

  const totalText =
    "NT$" +
    formatInteger_(
      orderTotal
    );

  return [
    detailText,
    pieceText,
    totalText
  ]
    .filter(Boolean)
    .join("｜");
}


/**
 * 加入一筆規格選擇明細。
 */
function appendItemSelectionRows_(
  rows,
  config
) {
  const item =
    config.item || {};

  const selectedOptions =
    item.selectedOptions || {};

  const activitySelections =
    Array.isArray(
      item.activitySelections
    )
      ? item.activitySelections
      : [];

  const referencePrice =
    config.perGroupCount > 0
      ? config.dealPricePerGroup /
        config.perGroupCount
      : config.dealPricePerGroup;

  for (
    let groupIndex = 1;
    groupIndex <=
      config.groupCount;
    groupIndex++
  ) {
    if (
      activitySelections.length
    ) {
      activitySelections.forEach(
        function (
          selection,
          pieceIndex
        ) {
          pushSelectionRow_(
            rows,
            {
              orderId:
                config.orderId,
              itemId:
                config.itemId,
              groupIndex:
                groupIndex,
              pieceIndex:
                pieceIndex + 1,
              productId:
                selection.productId,
              productName:
                selection.productName,
              options:
                selection.selectedOptions ||
                {},
              referencePrice:
                referencePrice,
              surcharge:
                safeNumber_(
                  selection.surcharge
                ),
              activityProductId:
                selection.activityProductId,
              note: ""
            }
          );
        }
      );

      continue;
    }

    for (
      let pieceIndex = 1;
      pieceIndex <=
        config.perGroupCount;
      pieceIndex++
    ) {
      const pieceOptions =
        extractPieceOptions_(
          selectedOptions,
          pieceIndex
        );

      pushSelectionRow_(
        rows,
        {
          orderId:
            config.orderId,
          itemId:
            config.itemId,
          groupIndex:
            groupIndex,
          pieceIndex:
            pieceIndex,
          productId:
            item.productId,
          productName:
            item.name,
          options:
            pieceOptions,
          referencePrice:
            referencePrice,
          surcharge: 0,
          activityProductId:
            selectedOptions[
              "活動商品ID"
            ],
          note:
            selectedOptions[
              "活動角色"
            ] || ""
        }
      );
    }
  }
}


/**
 * 建立一筆規格選擇列。
 */
function pushSelectionRow_(
  rows,
  config
) {
  const selectionId =
    config.itemId +
    "-S" +
    String(rows.length + 1)
      .padStart(3, "0");

  const options =
    config.options || {};

  const optionText =
    Object.keys(options)
      .map(function (key) {
        return (
          key +
          "：" +
          safeText_(
            options[key]
          )
        );
      })
      .join("、");

  rows.push([
    selectionId,
    config.itemId,
    config.orderId,
    config.groupIndex,
    config.pieceIndex,
    safeText_(
      config.productId
    ),
    safeText_(
      config.productName
    ),
    optionText,
    JSON.stringify(options),
    safeNumber_(
      config.referencePrice
    ),
    safeNumber_(
      config.surcharge
    ),
    safeText_(
      config.activityProductId
    ),
    safeText_(
      config.note
    )
  ]);
}


/**
 * 取得逐件規格。
 */
function extractPieceOptions_(
  selectedOptions,
  pieceIndex
) {
  const result = {};

  const prefix =
    "第" +
    pieceIndex +
    "件-";

  Object.keys(
    selectedOptions || {}
  ).forEach(
    function (key) {
      if (
        key.indexOf(prefix) === 0
      ) {
        result[
          key.slice(
            prefix.length
          )
        ] =
          selectedOptions[key];
      }
    }
  );

  if (
    Object.keys(result).length
  ) {
    return result;
  }

  Object.keys(
    selectedOptions || {}
  ).forEach(
    function (key) {
      if (
        isMetadataOption_(key) ||
        /^第\d+件-/.test(key)
      ) {
        return;
      }

      result[key] =
        selectedOptions[key];
    }
  );

  return result;
}


/**
 * 建立規格摘要。
 */
function buildOptionSummary_(
  selectedOptions
) {
  return Object.keys(
    selectedOptions || {}
  )
    .filter(function (key) {
      return !isHiddenOption_(key);
    })
    .map(function (key) {
      return (
        key +
        "：" +
        safeText_(
          selectedOptions[key]
        )
      );
    })
    .join("、");
}


/**
 * 建立商品內容摘要。
 */
function buildContentSummary_(
  item
) {
  if (
    Array.isArray(
      item.activitySelections
    ) &&
    item.activitySelections.length
  ) {
    return item.activitySelections
      .map(
        function (
          selection,
          index
        ) {
          const options =
            Object.keys(
              selection.selectedOptions ||
              {}
            )
              .map(function (key) {
                return (
                  key +
                  "：" +
                  safeText_(
                    selection
                      .selectedOptions[
                        key
                      ]
                  )
                );
              })
              .join("、");

          return (
            "第" +
            (index + 1) +
            "件：" +
            safeText_(
              selection.productName
            ) +
            (
              options
                ? "（" +
                  options +
                  "）"
                : ""
            )
          );
        }
      )
      .join("；");
  }

  return safeText_(
    item.name
  );
}


/**
 * 每組商品件數。
 */
function resolvePerGroupCount_(
  item,
  selectedOptions
) {
  if (
    Array.isArray(
      item.activitySelections
    ) &&
    item.activitySelections.length
  ) {
    return item
      .activitySelections
      .length;
  }

  return Math.max(
    1,
    safeInteger_(
      selectedOptions[
        "每組件數"
      ] ||
      selectedOptions[
        "活動每組件數"
      ],
      1
    )
  );
}


/**
 * 每組原價。
 */
function resolveOriginalGroupPrice_(
  item,
  dealPrice
) {
  const candidates = [
    item.originalUnitPrice,
    item.priceChangedFrom,
    item.basePrice
  ];

  for (
    let index = 0;
    index <
      candidates.length;
    index++
  ) {
    const value =
      safeNumber_(
        candidates[index]
      );

    if (value > 0) {
      return Math.max(
        value,
        dealPrice
      );
    }
  }

  return dealPrice;
}


/**
 * 組合取貨資訊。
 */
function buildPickupInfo_(
  customer
) {
  const shipping =
    safeText_(customer.shipping);

  if (
    shipping === "7-11貨到付款" ||
    shipping === "全家貨到付款"
  ) {
    return (
      "門市：" +
      safeText_(
        customer.store
      )
    );
  }

  if (shipping === "郵局貨到付款") {
    return (
      "地址：" +
      safeText_(
        customer.address
      )
    );
  }

  if (shipping === "市場取貨") {
    return (
      "市場：" +
      safeText_(
        customer.market
      )
    );
  }

  return "";
}


/**
 * 不顯示於規格摘要的欄位。
 */
function isHiddenOption_(key) {
  return (
    key ===
      "活動選擇識別" ||
    key ===
      "方案ID"
  );
}


/**
 * 系統用規格欄位。
 */
function isMetadataOption_(key) {
  return [
    "購買方案",
    "每組件數",
    "活動方案",
    "活動內容",
    "活動ID",
    "活動名稱",
    "活動類型",
    "活動角色",
    "活動選擇識別",
    "活動件序",
    "活動每組件數",
    "活動折扣方式",
    "活動優惠值",
    "方案ID",
    "活動商品ID"
  ].indexOf(key) >= 0;
}


/**
 * 驗證網站送出的訂單資料。
 */
function validateOrderPayload_(
  payload
) {
  if (
    !payload ||
    typeof payload !== "object"
  ) {
    throw new Error(
      "缺少訂單資料。"
    );
  }

  if (
    !Array.isArray(
      payload.items
    ) ||
    payload.items.length === 0
  ) {
    throw new Error(
      "訂單內沒有商品。"
    );
  }

  const customer =
    payload.customer || {};

  const shipping =
    safeText_(customer.shipping);

  const allowedShipping = [
    "7-11貨到付款",
    "全家貨到付款",
    "郵局貨到付款",
    "市場取貨"
  ];

  if (
    allowedShipping.indexOf(
      shipping
    ) === -1
  ) {
    throw new Error(
      "請選擇有效的取貨方式。"
    );
  }

}


/**
 * 取得或建立工作表，並補齊新版缺少的欄位。
 *
 * 不會刪除、改名或移動既有欄位。
 */
function getOrCreateSheetWithHeaders_(
  spreadsheet,
  sheetName,
  requiredHeaders
) {
  let sheet =
    spreadsheet.getSheetByName(
      sheetName
    );

  if (!sheet) {
    sheet =
      spreadsheet.insertSheet(
        sheetName
      );
  }

  if (
    sheet.getLastRow() === 0
  ) {
    sheet
      .getRange(
        1,
        1,
        1,
        requiredHeaders.length
      )
      .setValues([
        requiredHeaders
      ]);

    sheet.setFrozenRows(1);

    return sheet;
  }

  let headers =
    getSheetHeaders_(sheet);

  const missingHeaders =
    requiredHeaders.filter(
      function (header) {
        return (
          headers.indexOf(header) ===
          -1
        );
      }
    );

  if (missingHeaders.length) {
    const startColumn =
      sheet.getLastColumn() + 1;

    sheet
      .getRange(
        1,
        startColumn,
        1,
        missingHeaders.length
      )
      .setValues([
        missingHeaders
      ]);

    headers =
      headers.concat(
        missingHeaders
      );
  }

  sheet.setFrozenRows(1);

  return sheet;
}


/**
 * 依目前工作表標題順序寫入物件資料。
 *
 * 因此即使 Orders 既有欄位順序不同，
 * 仍能寫到正確欄位。
 */
function appendObjectRow_(
  sheet,
  data
) {
  const headers =
    getSheetHeaders_(sheet);

  const normalizedData = {};

  Object.keys(data || {}).forEach(
    function (key) {
      normalizedData[
        normalizeHeader_(key)
      ] = data[key];
    }
  );

  const row =
    headers.map(
      function (header) {
        return Object.prototype
          .hasOwnProperty.call(
            normalizedData,
            header
          )
          ? normalizedData[header]
          : "";
      }
    );

  sheet
    .getRange(
      sheet.getLastRow() + 1,
      1,
      1,
      row.length
    )
    .setValues([row]);
}


/**
 * 統一欄位名稱，避免隱藏空白、全形空白或 BOM
 * 導致資料寫入錯誤欄位。
 */
function normalizeHeader_(value) {
  return safeText_(value)
    .replace(/^\uFEFF/, "")
    .replace(/[\u200B-\u200D\u2060]/g, "")
    .replace(/\u3000/g, " ")
    .replace(/\s+/g, "");
}


/**
 * 取得工作表標題。
 */
function getSheetHeaders_(
  sheet
) {
  const lastColumn =
    sheet.getLastColumn();

  if (lastColumn < 1) {
    return [];
  }

  return sheet
    .getRange(
      1,
      1,
      1,
      lastColumn
    )
    .getDisplayValues()[0]
    .map(function (value) {
      return normalizeHeader_(value);
    });
}


/**
 * 金額千分位。
 */
function formatInteger_(
  value
) {
  const number =
    Math.round(
      safeNumber_(value)
    );

  return String(number)
    .replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ","
    );
}


/**
 * 文字安全轉換。
 */
function safeText_(value) {
  return (
    value === undefined ||
    value === null
  )
    ? ""
    : String(value).trim();
}


/**
 * 數字安全轉換。
 */
function safeNumber_(value) {
  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}


/**
 * 正整數安全轉換。
 */
function safeInteger_(
  value,
  fallback
) {
  const parsed =
    Math.floor(
      Number(value)
    );

  return (
    Number.isFinite(parsed) &&
    parsed > 0
  )
    ? parsed
    : fallback;
}


/**
 * 修正 Orders 第一列欄位名稱。
 *
 * 只會整理欄位文字，不會移動或刪除既有資料。
 * 覆蓋程式後可手動執行一次。
 */
function repairOrdersHeaders_() {
  const spreadsheet =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheet =
    spreadsheet.getSheetByName(
      ORDERS_SHEET_NAME
    );

  if (!sheet) {
    throw new Error(
      "找不到 Orders 工作表。"
    );
  }

  const lastColumn =
    Math.max(
      sheet.getLastColumn(),
      ORDER_HEADERS.length
    );

  const currentHeaders =
    sheet
      .getRange(
        1,
        1,
        1,
        lastColumn
      )
      .getDisplayValues()[0];

  const normalizedCurrent =
    currentHeaders.map(
      normalizeHeader_
    );

  ORDER_HEADERS.forEach(
    function (requiredHeader) {
      const normalizedRequired =
        normalizeHeader_(
          requiredHeader
        );

      const foundIndex =
        normalizedCurrent.indexOf(
          normalizedRequired
        );

      if (foundIndex >= 0) {
        sheet
          .getRange(
            1,
            foundIndex + 1
          )
          .setValue(
            requiredHeader
          );
        return;
      }

      const newColumn =
        sheet.getLastColumn() + 1;

      sheet
        .getRange(
          1,
          newColumn
        )
        .setValue(
          requiredHeader
        );

      normalizedCurrent.push(
        normalizedRequired
      );
    }
  );

  sheet.setFrozenRows(1);
  SpreadsheetApp.flush();

  return {
    ok: true,
    headers:
      getSheetHeaders_(sheet)
  };
}


/**
 * 手動測試 V21 訂單編號。
 *
 * 注意：
 * 執行這個函式會真的建立一筆測試訂單。
 */
function testCreateOrderV1_() {
  const result =
    handleCreateOrder_({
      clientRequestId:
        "TEST-" +
        new Date().getTime(),

      customer: {
        name: "測試顧客",
        phone:
          "0900000000",
        shipping:
          "市場取貨",
        store: "",
        address: "",
        market:
          "測試市場",
        note:
          "V21 測試訂單"
      },

      items: [
        {
          itemType:
            "product",
          productId:
            "TEST-001",
          activityId: "",
          planId: "",
          name:
            "測試商品",
          unitPrice: 100,
          quantity: 1,
          imageUrl: "",
          selectedOptions: {
            顏色: "紅色"
          }
        }
      ],

      totalAmount: 100,
      submittedAt:
        new Date()
          .toISOString()
    });

  console.log(result);

  if (
    !result ||
    result.ok !== true ||
    !/^PR\d{8}\d{4}$/.test(
      result.orderId
    )
  ) {
    throw new Error(
      "V21 訂單測試失敗"
    );
  }

  console.log(
    "V21 訂單測試成功"
  );
}
