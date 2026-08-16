import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["true", "yes", "y", "1", "是", "顯示", "啟用", "開啟"].includes(normalized)) return true;
  if (["false", "no", "n", "0", "否", "不顯示", "停用", "關閉"].includes(normalized)) return false;
  return fallback;
}

function normalizeSpeed(value: unknown): number {
  const parsed = Number(String(value ?? "").replace(/[,\s]/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0) return 28;
  return Math.max(10, Math.min(120, Math.round(parsed)));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export async function GET() {
  const gasUrl = process.env.GOOGLE_APPS_SCRIPT_URL?.trim();

  if (!gasUrl) {
    return NextResponse.json(
      {
        ok: false,
        announcementTickerEnabled: false,
        announcementTickerText: "",
        announcementTickerSpeed: 28,
        error: "尚未設定 GOOGLE_APPS_SCRIPT_URL。",
        diagnostics: { source: "apps-script", gasUrlConfigured: false },
      },
      {
        status: 500,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
      },
    );
  }

  try {
    const endpoint = new URL(gasUrl);
    endpoint.searchParams.set("action", "settings");
    endpoint.searchParams.set("_", String(Date.now()));

    const response = await fetch(endpoint.toString(), {
      cache: "no-store",
      redirect: "follow",
      headers: {
        Accept: "application/json,text/plain,*/*",
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      throw new Error(`Apps Script Settings HTTP ${response.status}`);
    }

    const rawText = await response.text();
    let payload: unknown;
    try {
      payload = JSON.parse(rawText);
    } catch {
      throw new Error("Apps Script Settings 回傳的不是 JSON。");
    }

    const root = asRecord(payload);
    if (!root) throw new Error("Apps Script Settings 回傳格式不正確。");

    if (root.ok === false || root.success === false) {
      throw new Error(String(root.message ?? "Apps Script Settings 讀取失敗。"));
    }

    const settings = asRecord(root.data);
    if (!settings) throw new Error("Apps Script Settings 缺少 data。請確認 API.gs 的 settings 路由已部署。 ");

    const enabledRaw = settings.AnnouncementTickerEnabled;
    const textRaw = settings.AnnouncementTickerText;
    const speedRaw = settings.AnnouncementTickerSpeed;

    const text = String(textRaw ?? "").trim();

    return NextResponse.json(
      {
        ok: true,
        announcementTickerEnabled: normalizeBoolean(enabledRaw, false),
        announcementTickerText: text,
        announcementTickerSpeed: normalizeSpeed(speedRaw),
        diagnostics: {
          source: "apps-script",
          gasUrlConfigured: true,
          settingsKeys: Object.keys(settings),
          tickerEnabledRaw: enabledRaw ?? null,
          tickerTextFound: text.length > 0,
          tickerSpeedRaw: speedRaw ?? null,
        },
      },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
      },
    );
  } catch (error) {
    console.error("Failed to read ticker settings through Apps Script", error);
    return NextResponse.json(
      {
        ok: false,
        announcementTickerEnabled: false,
        announcementTickerText: "",
        announcementTickerSpeed: 28,
        error: error instanceof Error ? error.message : "Unknown settings error",
        diagnostics: { source: "apps-script", gasUrlConfigured: true },
      },
      {
        status: 500,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
      },
    );
  }
}
