// 从三个源项目里抓出课文引用到的文件原文，生成 content/source-files.ts。
//
// 【为什么要有这个】
// 课文里到处写着「react-notes-app 的 package.json 只有 dev / build / q2 三个 script」，
// 但那个文件从来没在页面上出现过 —— 读者只能选择相信。用户的原话：
// 「你是不是先得展示一下这个 package.json 原文是什么呀？我就很懵逼啊。」
// 实测全站 58 节有 sourceFiles 的课里，40 节至少有一个文件从没展示过内容。
//
// 【为什么是生成而不是手抄】
// 抄一份进课文就有两份真相，源项目一改就对不上。这里在构建时从磁盘读原文，
// 和 gen-nav 一个思路：页面上显示的永远是真实文件。
//
// 【绝对不能收进来的东西】
// 「从零重写」那类练习的 sourceFiles 写的是**要你自己建的文件**
// （package.json、src/App.tsx 这种裸相对路径）。它们在源项目磁盘上
// 恰好是**做完的版本** —— 展示了就等于把答案贴在题面上。
// 所以这里只收「第一段是三个源项目之一」的路径，裸相对路径一律跳过。
// 实测：41 个真实文件收进来，53 个从零重写的路径被排除。
//
//   npm run gen:src

import { readFileSync, writeFileSync, statSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { readdirSync } from "fs";

const HOME = homedir();
const PROJECTS = {
  "react-notes-app": join(HOME, "Downloads/react-notes-app"),
  "graphql-federation-practice": join(
    HOME,
    "Downloads/graphql-federation-practice",
  ),
  "cab-booking-context": join(HOME, "Downloads/cab-booking-context"),
};

// 超过这个行数就截断 —— package-lock.json 有 136 KB，没人要在课文里读它，
// 但「它长什么样、开头几行是什么」是有意义的。
const MAX_LINES = 120;

/**
 * 路径 → 磁盘上的真实位置。收不到就返回 null（调用方跳过）。
 *
 * 三种能收的写法：
 *   react-notes-app/package.json                  项目内的文件
 *   react-notes-app/                              项目内的目录 → 出目录树
 *   react-notes-app                   项目根（exam 总览页的 sourceProjects）→ 出目录树
 * 收不到的：裸相对路径（从零重写要你自己建的文件）—— 那是泄答案。
 */
function resolve(p) {
  // 项目根：绝对路径或 ~ 开头，末段是三个项目之一
  if (p.startsWith("/") || p.startsWith("~")) {
    const name = p.replace(/\/+$/, "").split("/").pop();
    const root = PROJECTS[name];
    return root && existsSync(root) ? root : null;
  }
  const [head, ...rest] = p.replace(/\/+$/, "").split("/");
  const root = PROJECTS[head];
  if (!root) return null; // 从零重写的裸相对路径
  const real = rest.length ? join(root, rest.join("/")) : root;
  if (!existsSync(real)) return null;
  return real;
}

// 目录树里不该出现的东西：装出来的、编出来的、编辑器的。
const IGNORE = new Set([
  "node_modules", ".git", ".DS_Store", "dist", "build", "target",
  ".next", "coverage", ".vite", ".idea", ".vscode", ".turbo",
]);

/** 画一棵 tree(1) 那样的目录树。只有文件名，没有内容 —— 不泄答案。 */
function treeOf(dir, prefix = "") {
  const entries = readdirSync(dir, { withFileTypes: true })
    .filter((e) => !IGNORE.has(e.name))
    .sort((a, b) => {
      const ad = a.isDirectory() ? 0 : 1;
      const bd = b.isDirectory() ? 0 : 1;
      return ad !== bd ? ad - bd : a.name.localeCompare(b.name);
    });
  const out = [];
  entries.forEach((e, i) => {
    const last = i === entries.length - 1;
    out.push(`${prefix}${last ? "\u2514\u2500\u2500 " : "\u251C\u2500\u2500 "}${e.name}${e.isDirectory() ? "/" : ""}`);
    if (e.isDirectory()) {
      out.push(...treeOf(join(dir, e.name), prefix + (last ? "    " : "\u2502   ")));
    }
  });
  return out;
}

/** 按扩展名给语法高亮用的语言标记 —— 和 lib/highlight.ts 的 Lang 对齐 */
function langOf(p) {
  if (p.endsWith(".json")) return "json";
  if (p.endsWith(".graphql") || p.endsWith(".graphqls")) return "graphql";
  if (p.endsWith(".java")) return "java";
  if (p.endsWith(".properties")) return "properties";
  if (p.endsWith(".tsx")) return "tsx";
  if (p.endsWith(".ts")) return "ts";
  if (p.endsWith(".jsx")) return "jsx";
  if (p.endsWith(".mjs") || p.endsWith(".cjs") || p.endsWith(".js")) return "js";
  if (p.endsWith(".css")) return "css";
  if (p.endsWith(".sh")) return "bash";
  // xml / md / html / yml 没有 tokenizer，按纯文本渲染（lib/highlight.ts 的 Lang 里没有它们）
  return "text";
}

// 扫课文里所有的 { path: "..." }
const files = readdirSync("content/exams").filter((f) => f.endsWith(".tsx"));
const paths = new Set();
for (const f of files) {
  const src = readFileSync(join("content/exams", f), "utf8");
  for (const m of src.matchAll(/\{\s*path: "([^"]+)"/g)) paths.add(m[1]);
}

const out = {};
let skipped = 0;
let truncated = 0;
let dirs = 0;
for (const p of [...paths].sort()) {
  const real = resolve(p);
  if (!real) {
    skipped += 1;
    continue;
  }
  const isDir = statSync(real).isDirectory();
  const lines = isDir
    ? [`${real.split("/").pop()}/`, ...treeOf(real)]
    : readFileSync(real, "utf8").replace(/\n$/, "").split("\n");
  const cut = lines.length > MAX_LINES;
  if (cut) truncated += 1;
  if (isDir) dirs += 1;
  out[p] = {
    lang: isDir ? "text" : langOf(p),
    lines: lines.length,
    content: (cut ? lines.slice(0, MAX_LINES) : lines).join("\n"),
    ...(cut ? { truncated: true } : {}),
    ...(isDir ? { kind: "tree" } : {}),
  };
}

const tpl = readFileSync("scripts/source-files-template.txt", "utf8");
writeFileSync(
  "content/source-files.ts",
  tpl.replace("__SOURCE_FILES__", JSON.stringify(out, null, 2)),
);

const bytes = Object.values(out).reduce((n, f) => n + f.content.length, 0);
console.log(
  `content/source-files.ts 已更新：收了 ${Object.keys(out).length} 项` +
    `（${Object.keys(out).length - dirs} 个文件 + ${dirs} 棵目录树，共 ${(bytes / 1024).toFixed(0)} KB，` +
    `其中 ${truncated} 项超 ${MAX_LINES} 行被截断）；` +
    `跳过 ${skipped} 个（从零重写要自己建的文件）`,
);
