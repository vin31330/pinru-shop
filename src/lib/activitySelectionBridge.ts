export type PendingActivityProductSelection = {
  activityId: string;
  relationId: string;
  productId: string;
  selectedOptions: Record<string, string>;
  savedAt: number;
};

const KEY = "pinru.pendingActivityProductSelection";

export function savePendingActivityProductSelection(value: PendingActivityProductSelection) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(KEY, JSON.stringify(value));
}

export function takePendingActivityProductSelection(activityId: string): PendingActivityProductSelection | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingActivityProductSelection;
    if (!parsed || parsed.activityId !== activityId) return null;
    window.sessionStorage.removeItem(KEY);
    return parsed;
  } catch {
    window.sessionStorage.removeItem(KEY);
    return null;
  }
}
