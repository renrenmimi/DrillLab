// 从真实内容重新生成 content/nav.ts。
// 做法：临时起一个 next dev，打一个只在生成时存在的 route，取 JSON，再写文件。
// 这样 nav.ts 永远是内容的派生物，不会和内容脱节。
//
//   npm run gen:nav
import { spawn } from "child_process";
import { writeFileSync, readFileSync, mkdirSync, rmSync } from "fs";

const PORT = 3492;
const ROUTE_DIR = "app/nav-dump";

const routeSrc = readFileSync("scripts/nav-dump-route.txt", "utf8");
mkdirSync(ROUTE_DIR, { recursive: true });
writeFileSync(`${ROUTE_DIR}/route.ts`, routeSrc);

const dev = spawn("npx", ["next", "dev", "-p", String(PORT)], { stdio: "ignore" });

const cleanup = () => {
  try { rmSync(ROUTE_DIR, { recursive: true, force: true }); } catch {}
  dev.kill();
};
process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(1); });

let json = null;
let lastError = null;
for (let i = 0; i < 60; i++) {
  await new Promise((r) => setTimeout(r, 1000));
  try {
    const res = await fetch(`http://localhost:${PORT}/nav-dump`);
    if (!res.ok) {
      // 500 通常是内容里的断言抛错了 —— 把正文打出来，别让人对着「没起来」瞎猜
      lastError = (await res.text()).slice(0, 1200);
      continue;
    }
    const body = await res.json();
    // payload 是 { exams, drills, coding, arena } 这个对象，不再是数组
    if (body && Array.isArray(body.exams)) {
      json = body;
      break;
    }
  } catch (e) {
    lastError = String(e);
  }
}
if (!json) {
  console.error("取不到 nav 数据。最后一次的错误：\n" + (lastError ?? "（dev server 没起来）"));
  process.exit(1);
}

// 两份重数据单独出文件 —— 见各自模板顶部的注释。
//   searchIndex 130 KB 出头，只有 ⌘K 搜索用，进 nav.ts 每页白下 80 kB（gzip 后）
//   exercises   148 条，只有引导计划用，而计划那一套是懒加载的
const { searchIndex, exercises, planManifest, trackManifest, ...navJson } = json;

const tpl = readFileSync("scripts/nav-template.txt", "utf8");
writeFileSync(
  "content/nav.ts",
  tpl.replace("__NAV_DATA__", JSON.stringify(navJson, null, 2)),
);

const exTpl = readFileSync("scripts/nav-exercises-template.txt", "utf8");
writeFileSync(
  "content/nav-exercises.ts",
  exTpl.replace("__EXERCISE_DATA__", JSON.stringify(exercises, null, 2)),
);

const trackTpl = readFileSync("scripts/track-manifest-template.txt", "utf8");
writeFileSync(
  "content/track-manifest.ts",
  trackTpl
    .replace("__TRACK_DATA__", JSON.stringify(trackManifest.tracks, null, 2))
    .replace("__SURFACE_DATA__", JSON.stringify(trackManifest.surfaces, null, 2)),
);

const planTpl = readFileSync("scripts/plan-manifest-template.txt", "utf8");
writeFileSync(
  "content/plan-manifest.ts",
  planTpl
    // 条目一行一条 —— 逐列换行会让这个文件长到读不动，而它是给人核对的
    .replace("__ITEM_DATA__", "[\n" + planManifest.items.map((r) => "  " + JSON.stringify(r)).join(",\n") + "\n]")
    .replace("__PLAN_DATA__", JSON.stringify(planManifest.plans, null, 2)),
);

const searchTpl = readFileSync("scripts/search-index-template.txt", "utf8");
writeFileSync(
  "content/search-index.ts",
  searchTpl.replace("__SEARCH_DATA__", JSON.stringify(searchIndex, null, 2)),
);

console.log(
  `content/nav.ts + content/search-index.ts 已更新：${json.exams.length} 门考试 / ` +
    `${json.exams.reduce((n, e) => n + e.lessonCount, 0)} 节课 / ` +
    `${exercises.length} 个练习 / ` +
    `${json.drills.length} 道八股 / ` +
    `${json.coding.length} 道 coding / ` +
    `${json.arena.length} 道考场题 / ` +
    `搜索索引 ${searchIndex.length} 条 / ` +
    `计划清单 ${planManifest.items.length} 条去重条目`,
);

// dev server 是 detached 的子进程，不显式退出的话这个脚本会一直挂着
cleanup();
process.exit(0);
