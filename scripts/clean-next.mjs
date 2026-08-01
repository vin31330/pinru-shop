import { rm } from "node:fs/promises";

try {
  await rm(".next", { recursive: true, force: true });
  console.log("已清除舊版網站快取，準備啟動最新版本。");
} catch (error) {
  console.error("無法清除舊版網站快取：", error);
  process.exitCode = 1;
}
