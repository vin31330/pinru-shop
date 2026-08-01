const RETURN_POSITION_KEY = "pinru-shop-return-position";

type ReturnPosition = {
  fromUrl: string;
  detailPath: string;
  scrollY: number;
};

export function rememberReturnPosition(detailHref: string) {
  if (typeof window === "undefined") return;

  try {
    const target = new URL(detailHref, window.location.href);
    const entry: ReturnPosition = {
      fromUrl: `${window.location.pathname}${window.location.search}`,
      detailPath: target.pathname,
      scrollY: window.scrollY,
    };
    sessionStorage.setItem(RETURN_POSITION_KEY, JSON.stringify(entry));
  } catch {
    // 瀏覽器禁止 sessionStorage 時，仍可使用原生上一頁。
  }
}

export function restoreReturnPositionAfterBack() {
  if (typeof window === "undefined") return;

  try {
    const raw = sessionStorage.getItem(RETURN_POSITION_KEY);
    if (!raw) return;
    const entry = JSON.parse(raw) as Partial<ReturnPosition>;
    if (
      entry.detailPath !== window.location.pathname ||
      typeof entry.fromUrl !== "string" ||
      typeof entry.scrollY !== "number"
    ) {
      return;
    }

    const restore = () => {
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (currentUrl === entry.fromUrl) {
        window.scrollTo(0, entry.scrollY ?? 0);
      }
    };

    window.setTimeout(restore, 80);
    window.setTimeout(restore, 260);
    window.setTimeout(() => {
      restore();
      sessionStorage.removeItem(RETURN_POSITION_KEY);
    }, 650);
  } catch {
    // 儲存內容無效時，交由瀏覽器原生捲動還原處理。
  }
}
