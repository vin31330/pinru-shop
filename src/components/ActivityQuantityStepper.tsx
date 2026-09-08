"use client";

export default function ActivityQuantityStepper({
  value,
  onDecrease,
  onIncrease,
  decreaseDisabled = false,
  increaseDisabled = false,
  compact = false,
}: {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseDisabled?: boolean;
  increaseDisabled?: boolean;
  compact?: boolean;
}) {
  const height = compact ? "h-12" : "h-14";
  const width = compact ? "w-12" : "w-14";

  return (
    <div className="inline-flex overflow-hidden rounded-2xl border-2 border-slate-300 bg-white shadow-sm" aria-label="選擇數量">
      <button
        type="button"
        disabled={decreaseDisabled}
        onClick={onDecrease}
        aria-label="減少一件"
        className={`${height} ${width} touch-manipulation text-2xl font-black text-slate-700 active:bg-slate-100 disabled:bg-slate-50 disabled:text-slate-300`}
      >
        −
      </button>
      <div className={`${height} grid min-w-14 place-items-center border-x-2 border-slate-300 px-2 text-xl font-black text-slate-900`} aria-live="polite">
        {value}
      </div>
      <button
        type="button"
        disabled={increaseDisabled}
        onClick={onIncrease}
        aria-label="增加一件"
        className={`${height} ${width} touch-manipulation bg-emerald-600 text-2xl font-black text-white active:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400`}
      >
        ＋
      </button>
    </div>
  );
}
