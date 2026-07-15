import { readSheet } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

const sheets = ["products", "product Media", "Product Options"];

export default async function DebugSheetsPage() {
  const results = await Promise.all(
    sheets.map(async (name) => {
      try {
        const rows = await readSheet(name);
        return {
          name,
          ok: true,
          count: rows.length,
          headers: rows[0] ? Object.keys(rows[0]) : [],
          firstRows: rows.slice(0, 3),
          error: "",
        };
      } catch (error) {
        return {
          name,
          ok: false,
          count: 0,
          headers: [],
          firstRows: [],
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
  );

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-black">Google Sheets 讀取檢查</h1>
        <p className="mt-2 text-sm text-slate-600">
          請把這一頁的畫面或文字貼回來。
        </p>

        <div className="mt-6 space-y-5">
          {results.map((result) => (
            <section
              key={result.name}
              className="rounded-2xl bg-white p-5 shadow-sm"
            >
              <h2 className="text-xl font-black">{result.name}</h2>

              <div className="mt-3">
                狀態：
                <strong className={result.ok ? "text-emerald-600" : "text-rose-600"}>
                  {result.ok ? "成功" : "失敗"}
                </strong>
              </div>

              <div className="mt-1">資料列數：{result.count}</div>

              {result.error && (
                <pre className="mt-3 overflow-auto rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                  {result.error}
                </pre>
              )}

              <div className="mt-4 font-bold">欄位名稱</div>
              <pre className="mt-2 overflow-auto rounded-xl bg-slate-900 p-3 text-sm text-white">
                {JSON.stringify(result.headers, null, 2)}
              </pre>

              <div className="mt-4 font-bold">前 3 筆資料</div>
              <pre className="mt-2 max-h-96 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-white">
                {JSON.stringify(result.firstRows, null, 2)}
              </pre>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
