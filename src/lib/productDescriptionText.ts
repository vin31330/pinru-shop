const PAIRED_TAG_NAMES = [
  "粗",
  "斜",
  "底線",
  "刪除",
  "大",
  "中",
  "小",
  "超大",
  "紅",
  "橘",
  "黃",
  "綠",
  "藍",
  "紫",
  "粉",
  "灰",
  "置中",
  "靠右",
  "資訊",
  "提醒",
  "成功",
  "警告",
  "重點",
  "特色",
  "技巧",
  "適合",
  "標題",
] as const;

const ARGUMENT_TAG_NAMES = ["顏色", "字體", "連結", "按鈕", "電話", "LINE", "YouTube"] as const;

const SELF_CLOSING_TAG_NAMES = ["分隔線", "粗分隔線", "空行"] as const;

const pairedTagPattern = PAIRED_TAG_NAMES.join("|");
const argumentTagPattern = ARGUMENT_TAG_NAMES.join("|");
const selfClosingTagPattern = SELF_CLOSING_TAG_NAMES.join("|");

const SUPPORTED_FORMAT_TAG = new RegExp(
  `\\[\\s*(?:\\/\\s*(?:${pairedTagPattern}|${argumentTagPattern})|(?:${pairedTagPattern})|(?:${argumentTagPattern})\\s*=\\s*[^\\[\\]]+|(?:${selfClosingTagPattern}))\\s*\\]`,
  "g",
);

/**
 * Converts a rich product description into a short plain-text card preview.
 * Only syntax supported by RichProductDescription is removed; ordinary bracketed
 * product text such as "[附提袋]" is intentionally preserved.
 */
export function productDescriptionText(description?: string): string {
  if (!description) return "";

  return description
    .replace(SUPPORTED_FORMAT_TAG, " ")
    .replace(/\s+/g, " ")
    .trim();
}
