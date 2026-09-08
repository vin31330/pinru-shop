import React from "react";

type RichNode = {
  type: "root" | "tag" | "text";
  name?: string;
  arg?: string;
  text?: string;
  children?: RichNode[];
};

const COLOR_MAP: Record<string, string> = {
  紅: "#dc2626",
  橘: "#ea580c",
  黃: "#ca8a04",
  綠: "#15803d",
  藍: "#2563eb",
  紫: "#7e22ce",
  粉: "#db2777",
  灰: "#64748b",
};

const TAG_ALIASES: Record<string, string> = {
  粗: "bold",
  斜: "italic",
  底線: "underline",
  刪除: "strike",
  大: "large",
  中: "medium",
  小: "small",
  超大: "xlarge",
  置中: "center",
  靠右: "right",
  資訊: "info",
  提醒: "notice",
  成功: "success",
  警告: "warning",
  重點: "highlight",
  特色: "feature",
  技巧: "tip",
  適合: "suitable",
  標題: "title",
  連結: "link",
  按鈕: "button",
  電話: "phone",
  LINE: "line",
  YouTube: "youtube",
  顏色: "color",
  字體: "font",
  分隔線: "divider",
  粗分隔線: "dividerBold",
  空行: "spacer",
};

const SELF_CLOSING = new Set(["divider", "dividerBold", "spacer"]);

function normalizeTag(raw: string): { closing: boolean; name: string; arg?: string } | null {
  const trimmed = raw.trim();
  const closing = trimmed.startsWith("/");
  const body = closing ? trimmed.slice(1).trim() : trimmed;
  const eqIndex = body.indexOf("=");
  const rawName = (eqIndex >= 0 ? body.slice(0, eqIndex) : body).trim();
  const arg = eqIndex >= 0 ? body.slice(eqIndex + 1).trim() : undefined;
  const mapped = TAG_ALIASES[rawName] || (COLOR_MAP[rawName] ? `presetColor:${rawName}` : "");
  if (!mapped) return null;
  return { closing, name: mapped, arg };
}

function parseRichText(input: string): RichNode {
  const root: RichNode = { type: "root", children: [] };
  const stack: RichNode[] = [root];
  const tokenRegex = /\[([^\[\]]+)\]/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  const appendText = (text: string) => {
    if (!text) return;
    stack[stack.length - 1].children?.push({ type: "text", text });
  };

  while ((match = tokenRegex.exec(input)) !== null) {
    appendText(input.slice(cursor, match.index));
    cursor = tokenRegex.lastIndex;
    const parsed = normalizeTag(match[1]);
    if (!parsed) {
      appendText(match[0]);
      continue;
    }

    if (parsed.closing) {
      const index = [...stack].reverse().findIndex((node) => node.name === parsed.name);
      if (index >= 0) {
        const absoluteIndex = stack.length - 1 - index;
        stack.splice(absoluteIndex);
      } else {
        appendText(match[0]);
      }
      continue;
    }

    const node: RichNode = { type: "tag", name: parsed.name, arg: parsed.arg, children: [] };
    stack[stack.length - 1].children?.push(node);
    if (!SELF_CLOSING.has(parsed.name)) stack.push(node);
  }

  appendText(input.slice(cursor));
  return root;
}

function safeHttpUrl(value?: string): string | null {
  const raw = (value || "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function safePhone(value?: string): string | null {
  const raw = (value || "").trim();
  if (!raw || !/^[+\d\-()\s]{6,30}$/.test(raw)) return null;
  return `tel:${raw.replace(/\s+/g, "")}`;
}

function safeColor(value?: string): string | null {
  const raw = (value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(raw) || /^#[0-9a-fA-F]{3}$/.test(raw) ? raw : null;
}

function safeFontSize(value?: string): number | null {
  const parsed = Number((value || "").replace(/px$/i, "").trim());
  if (!Number.isFinite(parsed)) return null;
  return Math.max(10, Math.min(48, Math.round(parsed)));
}

function renderNodes(nodes: RichNode[] = [], keyPrefix = "n"): React.ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    if (node.type === "text") return <React.Fragment key={key}>{node.text}</React.Fragment>;
    if (node.type !== "tag") return <React.Fragment key={key}>{renderNodes(node.children, key)}</React.Fragment>;

    const children = renderNodes(node.children, key);
    switch (node.name) {
      case "bold": return <strong key={key} className="font-black">{children}</strong>;
      case "italic": return <em key={key}>{children}</em>;
      case "underline": return <span key={key} className="underline decoration-2 underline-offset-2">{children}</span>;
      case "strike": return <span key={key} className="line-through decoration-2">{children}</span>;
      case "xlarge": return <span key={key} className="text-3xl font-black leading-tight md:text-4xl">{children}</span>;
      case "large": return <span key={key} className="text-2xl font-black leading-snug">{children}</span>;
      case "medium": return <span key={key} className="text-lg font-bold">{children}</span>;
      case "small": return <span key={key} className="text-sm">{children}</span>;
      case "center": return <div key={key} className="my-2 text-center">{children}</div>;
      case "right": return <div key={key} className="my-2 text-right">{children}</div>;
      case "title": return <div key={key} className="my-3 rounded-xl border-l-4 border-emerald-600 bg-emerald-50 px-4 py-3 text-xl font-black text-slate-900">{children}</div>;
      case "info": return <div key={key} className="my-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 font-bold text-sky-950">{children}</div>;
      case "notice": return <div key={key} className="my-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 font-bold text-amber-950">{children}</div>;
      case "success": return <div key={key} className="my-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-bold text-emerald-950">{children}</div>;
      case "warning": return <div key={key} className="my-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 font-bold text-rose-950">{children}</div>;
      case "highlight": return <div key={key} className="my-3 rounded-xl border-2 border-pink-200 bg-pink-50 px-4 py-3 font-bold text-pink-950 shadow-sm">{children}</div>;
      case "feature": return <div key={key} className="my-3 rounded-xl border-l-4 border-violet-500 bg-violet-50 px-4 py-3 font-bold text-violet-950">{children}</div>;
      case "tip": return <div key={key} className="my-3 rounded-2xl border border-dashed border-teal-400 bg-teal-50 px-4 py-3 font-bold text-teal-950">{children}</div>;
      case "suitable": return <div key={key} className="my-3 rounded-xl border border-stone-300 bg-amber-50/70 px-4 py-3 font-bold text-stone-900">{children}</div>;
      case "divider": return <hr key={key} className="my-5 border-0 border-t border-slate-300" />;
      case "dividerBold": return <hr key={key} className="my-6 border-0 border-t-4 border-slate-700" />;
      case "spacer": return <div key={key} className="h-5" aria-hidden="true" />;
      case "color": {
        const color = safeColor(node.arg);
        return <span key={key} style={color ? { color } : undefined}>{children}</span>;
      }
      case "font": {
        const fontSize = safeFontSize(node.arg);
        return <span key={key} style={fontSize ? { fontSize: `${fontSize}px`, lineHeight: 1.55 } : undefined}>{children}</span>;
      }
      case "link":
      case "line":
      case "youtube": {
        const href = safeHttpUrl(node.arg);
        return href ? <a key={key} href={href} target="_blank" rel="noreferrer" className="font-black text-blue-700 underline decoration-2 underline-offset-2 hover:text-blue-900">{children}</a> : <span key={key}>{children}</span>;
      }
      case "button": {
        const href = safeHttpUrl(node.arg);
        return href ? <a key={key} href={href} target="_blank" rel="noreferrer" className="my-3 inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-center font-black text-white shadow-sm transition hover:bg-emerald-700 active:bg-emerald-800">{children}</a> : <span key={key}>{children}</span>;
      }
      case "phone": {
        const href = safePhone(node.arg);
        return href ? <a key={key} href={href} className="font-black text-emerald-700 underline decoration-2 underline-offset-2">{children}</a> : <span key={key}>{children}</span>;
      }
      default: {
        if (node.name?.startsWith("presetColor:")) {
          const label = node.name.split(":")[1];
          return <span key={key} style={{ color: COLOR_MAP[label] }}>{children}</span>;
        }
        return <React.Fragment key={key}>{children}</React.Fragment>;
      }
    }
  });
}

export default function RichProductDescription({ description }: { description?: string }) {
  const content = description?.trim() || "商品詳細內容請洽 LINE 官方帳號。";
  const tree = parseRichText(content);
  return (
    <div className="mt-4 whitespace-pre-wrap break-words leading-7 text-slate-600 [overflow-wrap:anywhere]">
      {renderNodes(tree.children)}
    </div>
  );
}
