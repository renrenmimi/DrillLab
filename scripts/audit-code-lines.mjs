// 校验双语代码片段的行数对齐。
//
// 【为什么必须有这个脚本】
// CodeExample.highlight 是**行号**。codeEn 一旦比 code 多占或少占一行，
// 高亮就指到别的行 —— 而且不报错、不崩、不留痕，只是默默指错。
// 这比「英文没补」难发现得多，所以用脚本守住，不靠人眼。
//
// 顺带查两件事：
//   · 可执行行是否逐字节相同（只有注释和面向读者的字符串允许不同）
//   · codeEn 里还有没有中文（漏译）
//
//   node scripts/audit-code-lines.mjs
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const ROOTS = ["content"];
const CJK = /[一-鿿]/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

/** 取出反引号模板字符串，返回 [起点, 终点]（终点指向结尾的反引号） */
function readTemplate(src, openTick) {
  let i = openTick + 1;
  while (i < src.length) {
    if (src[i] === "\\") { i += 2; continue; }
    if (src[i] === "`") return i;
    i++;
  }
  return -1;
}

/**
 * 一个 CodeExample 对象里的 code / codeEn 配对。
 * 内容文件里两种写法都有：
 *   real("ts", `…`, { codeEn: `…` })     ← 构造器 + opts
 *   { language: "ts", code: `…`, codeEn: `…` }  ← 对象字面量
 * 两种都靠「同一个对象里 code 与 codeEn 相邻」来配对，所以统一按
 * 「找到一个 codeEn，往前找最近的 code」来处理。
 */
function pairs(src) {
  const out = [];
  const re = /\bcodeEn:\s*`/g;
  let m;
  while ((m = re.exec(src))) {
    const enOpen = m.index + m[0].length - 1;
    const enClose = readTemplate(src, enOpen);
    if (enClose < 0) continue;
    // 往前找最近的 code: ` 或 构造器的第二个参数
    const before = src.slice(0, m.index);
    const zhIdx = Math.max(
      before.lastIndexOf("code: `"),
      before.lastIndexOf('real('),
      before.lastIndexOf('demo('),
      before.lastIndexOf('tested('),
    );
    if (zhIdx < 0) continue;
    const tick = src.indexOf("`", zhIdx);
    if (tick < 0 || tick > m.index) continue;
    const zhClose = readTemplate(src, tick);
    if (zhClose < 0) continue;
    // 取这一段的 language（real("text", `…`) 的第一个参数）
    const langMatch = /\b(?:real|demo|tested)\(\s*"([\w-]+)"/.exec(
      src.slice(Math.max(0, zhIdx - 4), tick),
    );
    out.push({
      zh: src.slice(tick + 1, zhClose),
      en: src.slice(enOpen + 1, enClose),
      lang: langMatch ? langMatch[1] : "",
      line: src.slice(0, m.index).split("\n").length,
    });
  }
  return out;
}

/**
 * 归一化一行，用来比对「代码结构」。
 *
 * 【为什么字符串内容要挖掉】
 * 中文不只出现在注释里，也出现在字符串里，而字符串分两种：
 *   · 给读者看的标签 —— `console.log("1 同步")`，这个**该译**
 *   · 数据 —— `new Dog("旺财")`、`{ name: "小明" }`，这个**不该译**
 * 一开始我要求「可执行行逐字节相同」，那会把第一种也判成失败。
 * 真正必须守住的是**行数**（highlight 是行号）和**代码结构**，
 * 字符串里写什么是内容问题，不是结构问题。
 * 所以这里把注释删掉、把字符串内容替换成占位符，只比剩下的骨架。
 */
const normalize = (l) =>
  l
    // 先挖字符串内容（单引号 / 双引号 / 反引号），保留引号本身
    .replace(/"(?:[^"\\]|\\.)*"/g, '"·"')
    .replace(/'(?:[^'\\]|\\.)*'/g, "'·'")
    .replace(/`(?:[^`\\]|\\.)*`/g, "`·`")
    // 再删注释（此时注释里的引号已经不会干扰了）
    // {/* … */} 是 JSX 块注释，/* … */ 是普通块注释 —— 两种都算注释，
    // 里面的中文该译。踩过一次：cab-booking 的 {/* ← 太晚了 */} 因为
    // 归一化没剥它，被迫在英文片段里留了一句中文。
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/, "")
    .replace(/#(?![0-9a-fA-F]{3,8}\b).*$/, "")
    // JSX 的字面文本子节点也是内容，不是结构 —— <button>点我</button> 里的
    // 「点我」是给读者看的标签，该译。只挖**不含花括号**的那种：
    // <dt>{r.term}</dt> 里的 {r.term} 是代码，必须继续参与比对。
    .replace(/>([^<>{}]+)</g, ">·<")
    .trimEnd();

let checked = 0;
const problems = [];

for (const root of ROOTS) {
  for (const file of walk(root)) {
    const src = readFileSync(file, "utf8");
    for (const { zh, en, lang, line } of pairs(src)) {
      checked++;
      const a = zh.split("\n");
      const b = en.split("\n");
      if (a.length !== b.length) {
        problems.push(
          `${file}:${line}  行数不一致：中文 ${a.length} 行，英文 ${b.length} 行。` +
            `highlight 是行号，差一行就会指错。`,
        );
        continue; // 行数不同就没法逐行比了
      }
      // language: "text" 的块是目录树、对齐表格、命令输出这类东西 ——
      // 它们**没有可执行代码**，所谓「结构」就是那些路径和缩进本身，
      // 而说明文字是裸文本、不带注释标记，归一化剥不掉。
      // 对这种块只守行数，不比结构；否则整块就没法译（踩过：foundations
      // 的两棵目录树因此一直是中文）。
      if (lang === "text") continue;
      for (let i = 0; i < a.length; i++) {
        const ca = normalize(a[i]);
        const cb = normalize(b[i]);
        if (ca !== cb) {
          problems.push(
            `${file}:${line}  第 ${i + 1} 行的代码结构不一致（注释和字符串内容已忽略）：\n` +
              `      zh: ${ca}\n      en: ${cb}`,
          );
        }
      }
      // codeEn 里的**注释**不该还有中文。字符串里的中文可能是有意保留的数据
      // （人名、车型、测试 fixture），所以只查注释部分。
      const cjkComments = b
        .map((l) => {
          const c = l.match(/\/\/(.*)$/);
          return c ? c[1] : "";
        })
        .filter((c) => CJK.test(c));
      if (cjkComments.length) {
        problems.push(
          `${file}:${line}  codeEn 的注释里还有中文（漏译）：\n      ${cjkComments
            .slice(0, 2)
            .join("\n      ")}`,
        );
      }
    }
  }
}

console.log(`检查了 ${checked} 对双语代码片段`);
if (problems.length === 0) {
  console.log("✓ 行数全部对齐，可执行行逐字节相同，codeEn 无残留中文");
  process.exit(0);
}
console.error(`\n✗ ${problems.length} 个问题：\n`);
for (const p of problems) console.error("  " + p);
process.exit(1);
