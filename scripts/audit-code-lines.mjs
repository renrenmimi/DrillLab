// 校验双语代码片段的行数对齐。
//
// 【为什么必须有这个脚本】
// CodeExample.highlight 是**行号**。codeEn 一旦比 code 多占或少占一行，
// 高亮就指到别的行 —— 而且不报错、不崩、不留痕，只是默默指错。
// 这比「英文没补」难发现得多，所以用脚本守住，不靠人眼。
//
// 查三件事：
//   · 行数一致（硬约束）
//   · 代码结构一致（注释、字符串内容、JSX 字面文本会先挖空再比）
//   · 英文侧的注释里没有残留中文
//
//   npm run audit:code
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

/** 从开头反引号读到配对的结尾反引号，返回结尾下标 */
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
 * 归一化一行，用来比对「代码结构」。
 *
 * 【为什么字符串内容要挖掉】
 * 中文不只出现在注释里，也出现在字符串里，而字符串分两种：
 *   · 给读者看的标签 —— console.log("1 同步")，这个**该译**
 *   · 数据 —— new Dog("旺财")、{ name: "小明" }，这个**不该译**
 * 一开始要求「可执行行逐字节相同」，那会把第一种也判成失败。
 * 真正必须守住的是**行数**（highlight 是行号）和**代码结构**，
 * 字符串里写什么是内容问题，不是结构问题。
 */
const normalize = (l) =>
  l
    // 普通字符串：挖内容，留引号
    .replace(/"(?:[^"\\]|\\.)*"/g, '"·"')
    .replace(/'(?:[^'\\]|\\.)*'/g, "'·'")
    // 模板字符串（裸的 `…` 和转义的 \`…\` 各一种）：
    // 只挖**字面文本**，把 ${…} / \${…} 原样留下 —— 那些是表达式，是代码。
    // 【为什么必须一条正则处理两种】原来分成两条：先处理转义的，再处理裸的。
    // 但转义分支留下的 \` 会被裸分支当成一对反引号的开头，把已经
    // 保留下来的 ${id} 又吞掉，于是 ${id} 改成 ${uid} 也检查不出来（踩过）。
    .replace(/(\\?)`[\s\S]*?\1`/g, (m, esc) => {
      const exprs = m.match(/\\?\$\{[^}]*}/g) || [];
      return esc + "`·" + exprs.join("·") + "·" + esc + "`";
    })
    // 注释：{/* … */} 是 JSX 块注释，/* … */ 是普通块注释 —— 两种都算注释，
    // 里面的中文该译。踩过一次：cab-booking 的 {/* ← 太晚了 */} 因为
    // 归一化没剥它，被迫在英文片段里留了一句中文。
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
    // 【跨行的 JSX 块注释】逐行比对时，{/* … 开头那行和 … */} 结尾那行都不闭合，
    // 上面那条整块匹配的正则剥不掉。这两种残片也算注释，里面的中文该译。
    .replace(/\{\s*\/\*.*$/, "{/*·")
    .replace(/^(\s*).*\*\/\s*\}\s*$/, "$1·*/}")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // 【JSDoc 的中间行】逐行归一化时，一个跨多行的 /** … */ 块只有首行带 /*、
    // 末行带 */，中间那些 ` * 说明文字` 剥不掉，于是注释被当结构比对（踩过）。
    // 整行只有 * 加内容的，就是块注释的内部行。
    .replace(/^\s*\*(?!\/).*$/, "*·")
    .replace(/\/\/.*$/, "")
    .replace(/#(?![0-9a-fA-F]{3,8}\b).*$/, "")
    // JSX 的字面文本子节点也是内容，不是结构 —— <button>点我</button> 里的
    // 「点我」是给读者看的标签，该译。只挖**不含花括号**的那种：
    // <dt>{r.term}</dt> 里的 {r.term} 是代码，必须继续参与比对。
    .replace(/>([^<>{}]+)</g, ">·<")
    .trimEnd();

/**
 * 找出一个文件里所有「中文原文 / 英文译文」的配对。
 *
 * 【为什么抽取层要这么啰嗦】
 * 内容文件里写法不止一种，而漏掉任何一种，脚本都会**静默地少检查一批**，
 * 然后照样输出「✓ 全部通过」。那比没有脚本更糟 —— 是假保证。
 * 实测漏过 79 对（占近四分之一）才被人发现，所以现在：
 *   1) 四种字段都收：codeEn / starterEn / templateEn / errorOutputEn
 *   2) 值的两种写法都收：内联反引号，和引用一个模块级常量
 *   3) **凡是解析不出配对的，计入 skipped 并在最后报出来**，不再默默丢掉
 */
function pairs(src, file) {
  const out = [];
  const skipped = [];

  // 模块级常量表：const NAME = `…`;
  const consts = new Map();
  const cre = /\bconst\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*`/g;
  let cm;
  while ((cm = cre.exec(src))) {
    const open = cm.index + cm[0].length - 1;
    const close = readTemplate(src, open);
    if (close > 0) consts.set(cm[1], src.slice(open + 1, close));
  }

  const FIELDS = [
    ["codeEn", "code"],
    ["starterEn", "starter"],
    ["templateEn", "template"],
    ["errorOutputEn", "errorOutput"],
  ];

  for (const [enField, zhField] of FIELDS) {
    const re = new RegExp(`\\b${enField}:\\s*(\`|[A-Za-z_][A-Za-z0-9_]*)`, "g");
    let m;
    while ((m = re.exec(src))) {
      const line = src.slice(0, m.index).split("\n").length;
      const loc = `${file}:${line}`;

      // 【跳过注释里提到的字段名】内容文件里有「// No codeEn: 这块是纯 ASCII 排版…」
      // 这样的说明，字面上也匹配 codeEn:，但它不是字段。看本行行首到匹配处之间
      // 有没有 // —— 有就说明整句在注释里。
      const lineStart = src.lastIndexOf("\n", m.index) + 1;
      if (src.slice(lineStart, m.index).includes("//")) continue;

      // ---- 英文值 ----
      let en;
      if (m[1] === "`") {
        const open = m.index + m[0].length - 1;
        const close = readTemplate(src, open);
        if (close < 0) { skipped.push(`${loc}  ${enField} 的模板字符串没闭合`); continue; }
        en = src.slice(open + 1, close);
      } else {
        if (!consts.has(m[1])) { skipped.push(`${loc}  ${enField} 引用的常量 ${m[1]} 找不到`); continue; }
        en = consts.get(m[1]);
      }

      // ---- 中文值 ----
      // 优先在同一个对象里找 zhField；找不到就退回构造器的第二个参数
      const before = src.slice(0, m.index);
      const tail = before.slice(-600);

      let zh = null;
      let lang = "";

      // a) 中文也是引用常量，两种写法：
      //    code: SOME_CONST,
      //    tested("tsx", SOME_CONST, { codeEn: SOME_CONST_EN })   ← 构造器第二个参数
      // 【常量引用 vs 内联反引号：取更靠近的那一个】
      // 分支 (a) 靠「往前找 code: CONST 或 ctor(lang, CONST,」判断中文走常量引用。
      // 光看「tail 里有没有反引号」不行，两个方向都会错：
      //   · 只要有反引号就不走常量分支 → real("text", TABLE, { codeEn: TABLE_EN })
      //     这种被挡住，解析失败；
      //   · 完全不看 → 中文其实是内联的时候，会抢用更前面某个片段的常量，
      //     取回一段无关的中文（实测取成 49 行 / 27 行，真实只有 4 行 / 3 行）。
      // 所以比位置：哪个更靠近 codeEn，就用哪个。
      const lastTick = tail.lastIndexOf("`");
      const constHit = new RegExp(
        `(?:\\b${zhField}:|\\b(?:real|demo|tested)\\(\\s*"[\\w-]+"\\s*,)\\s*[A-Za-z_][A-Za-z0-9_]*\\s*,`,
        "g",
      );
      let lastConstIdx = -1, chm;
      while ((chm = constHit.exec(tail))) lastConstIdx = chm.index;
      const tailHasTemplate = lastTick > lastConstIdx;
      const zhConst = tailHasTemplate
        ? null
        : new RegExp(`\\b${zhField}:\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*,`).exec(tail);
      if (zhConst && consts.has(zhConst[1])) zh = consts.get(zhConst[1]);
      if (zh === null && !tailHasTemplate) {
        // 语言也要从这里取：中文值走常量引用时，原来 lang 一直是空的，
        // 于是 language: "text" 的豁免不生效，方法名表那种「→ 中文标注」
        // 的纯文本块全被判成结构不一致（踩过 38 处）。
        const ctorConst = /\b(?:real|demo|tested)\(\s*"([\w-]+)"\s*,\s*([A-Za-z_][A-Za-z0-9_]*)\s*,/g;
        let last = null, cm2;
        while ((cm2 = ctorConst.exec(tail))) last = cm2;
        if (last && consts.has(last[2])) {
          zh = consts.get(last[2]);
          lang = last[1];
        }
      }

      // b) 内联反引号
      //
      // 【为什么要找「最后一个」反引号而不是构造器之后的第一个】
      // 构造器可以换行写：
      //     demo(
      //       "tsx",
      //       `…中文…`,
      //       { codeEn: `…英文…` },
      //     )
      // 从 demo( 往后找第一个反引号是对的；但如果 lastIndexOf("demo(") 因为
      // 换行而没命中当前这一段，它会跨到上一个片段去，取回一段完全无关的中文
      // （实测两处取成了 49 行 / 27 行，而真实片段只有 4 行 / 3 行）。
      // 所以改成：从 codeEn 往前找最近的一对完整反引号 —— 那必然是它的中文原文。
      if (zh === null) {
        const zhIdx = Math.max(
          before.lastIndexOf(`${zhField}: \``),
          before.lastIndexOf("real("),
          before.lastIndexOf("demo("),
          before.lastIndexOf("tested("),
        );
        // 先试「往前最近的一对反引号」
        const prevClose = before.lastIndexOf("`");
        if (prevClose > 0) {
          // 从这个结尾反引号往前找它的开头
          let k = prevClose - 1;
          let open = -1;
          while (k > 0) {
            if (src[k] === "`" && src[k - 1] !== "\\") { open = k; break; }
            k--;
          }
          if (open > 0 && (zhIdx < 0 || open >= zhIdx)) {
            zh = src.slice(open + 1, prevClose);
            // 【要取最靠近的那个构造器】200 字窗口里可能有好几个 real(/demo(，
            // exec 只给最前面那个，于是 real("text", …) 的语言会被前面某个
            // real("ts", …) 顶掉，text 块的豁免就不生效（探针抓到过）。
            const lre = /\b(?:real|demo|tested)\(\s*"([\w-]+)"/g;
            let lm = null, x;
            while ((x = lre.exec(src.slice(Math.max(0, open - 200), open)))) lm = x;
            lang = lm ? lm[1] : "";
          }
        }
        if (zh === null && zhIdx >= 0) {
          const tick = src.indexOf("`", zhIdx);
          if (tick >= 0 && tick < m.index) {
            const close = readTemplate(src, tick);
            if (close > 0) {
              zh = src.slice(tick + 1, close);
              const lm = /\b(?:real|demo|tested)\(\s*"([\w-]+)"/.exec(
                src.slice(Math.max(0, zhIdx - 4), tick),
              );
              lang = lm ? lm[1] : "";
            }
          }
        }
      }

      if (zh === null) { skipped.push(`${loc}  ${enField} 找不到对应的 ${zhField}`); continue; }
      out.push({ zh, en, lang, line, field: enField });
    }
  }
  return { out, skipped };
}

let checked = 0;
const problems = [];
const allSkipped = [];
const byField = {};

for (const root of ROOTS) {
  for (const file of walk(root)) {
    const src = readFileSync(file, "utf8");
    const { out, skipped } = pairs(src, file);
    allSkipped.push(...skipped);
    for (const { zh, en, lang, line, field } of out) {
      checked++;
      byField[field] = (byField[field] ?? 0) + 1;
      const a = zh.split("\n");
      const b = en.split("\n");
      if (a.length !== b.length) {
        problems.push(
          `${file}:${line}  [${field}] 行数不一致：中文 ${a.length} 行，英文 ${b.length} 行。` +
            `highlight 是行号，差一行就会指错。`,
        );
        continue;
      }
      // language: "text" 的块是目录树、对齐表格、命令输出这类东西 ——
      // 它们**没有可执行代码**，所谓「结构」就是那些路径和缩进本身，
      // 而说明文字是裸文本、不带注释标记，归一化剥不掉。
      // 对这种块只守行数，不比结构。errorOutput 同理：那是机器输出，不是代码。
      // 【哪些块不比结构】
      //   text  目录树、对齐表格 —— 「结构」就是路径和缩进本身
      //   bash  终端会话 —— 命令加输出，说明文字是裸的 ← 标注
      //   errorOutput 机器输出，同理
      // 这几种都没有可执行代码要保护，只守行数。
      const PROSE_LANGS = new Set(["text", "bash", "sh", "shell", "console"]);
      if (!PROSE_LANGS.has(lang) && field !== "errorOutputEn") {
        for (let i = 0; i < a.length; i++) {
          const ca = normalize(a[i]);
          const cb = normalize(b[i]);
          if (ca !== cb) {
            problems.push(
              `${file}:${line}  [${field}] 第 ${i + 1} 行的代码结构不一致（注释和字符串内容已忽略）：\n` +
                `      zh: ${ca}\n      en: ${cb}`,
            );
          }
        }
      }
      // 【纯文本块里的整行漏译】
      // 上面那条只查 // 注释，可是目录树、命令输出这类 text 块没有注释语法，
      // 里面的中文标注（`← 没有这个 script，用 npx`）一个都查不出来 ——
      // react-part3 有 4 行就这么漏了。
      //
      // 判断标准：英文侧这一行**和中文侧逐字节相同**且含中文，就是没动过。
      // 但「有意保留的数据」也长这样（`new Dog("旺财")`、`"会议" / "内容A"`），
      // 所以排除掉带引号的、以及看起来像代码的行 —— 剩下的是纯中文说明。
      const untouched = [];
      for (let i = 0; i < b.length; i++) {
        if (b[i] !== a[i] || !CJK.test(b[i])) continue;
        const t = b[i].trim();
        if (/["'`]/.test(t)) continue;                 // 引号 → 很可能是数据
        if (/[{}();=]|=>/.test(t)) continue;            // 代码符号 → 是代码行
        // 【测试结果行是机器输出，不能译】
        // 测试名同时出现在源码里和报错输出里，两边必须逐字一致 ——
        // 译了输出这一边，就和源码里的 test("…") 对不上了。
        // 实测这些名字各出现 4 次（中英代码各一份 + 报错块各一份）。
        if (/^[✓✕×√]|^Expected\b|^Received\b|^Unable to find\b|^AssertionError\b/.test(t)) continue;
        untouched.push(t.slice(0, 70));
      }
      if (untouched.length) {
        problems.push(
          `${file}:${line}  [${field}] 有 ${untouched.length} 行中文原样留在英文侧（漏译）：\n      ${untouched
            .slice(0, 3)
            .join("\n      ")}`,
        );
      }

      // 英文侧的**注释**不该还有中文。字符串里的中文可能是有意保留的数据
      // （人名、车型、测试 fixture），所以只查注释部分。
      // 【注释里被引号括起来的中文不算漏译】
      // 注释常引用测试 fixture 的原值：`// 1. Add the first note: "会议" / "内容A"`。
      // 那些字符串本身不该译（测试断言依赖它们），所以判断前先把引号内容挖掉，
      // 只看注释里**自然语言**的部分还有没有中文。
      const cjkComments = b
        .map((l) => { const c = l.match(/\/\/(.*)$/); return c ? c[1] : ""; })
        .map((c) =>
          c
            .replace(/"(?:[^"\\]|\\.)*"/g, '""')
            .replace(/'(?:[^'\\]|\\.)*'/g, "''")
            .replace(/「[^」]*」/g, "「」"),
        )
        .filter((c) => CJK.test(c));
      if (cjkComments.length) {
        problems.push(
          `${file}:${line}  [${field}] 英文侧注释里还有中文（漏译）：\n      ${cjkComments
            .slice(0, 2)
            .join("\n      ")}`,
        );
      }
    }
  }
}

const detail = Object.entries(byField).map(([k, v]) => `${k} ${v}`).join(" / ");
console.log(`检查了 ${checked} 对双语片段（${detail}）`);

// 【为什么跳过的也要报】
// 解析不出配对就静默丢掉，等于脚本悄悄缩小了检查范围还宣称通过。
// 这正是漏掉 79 对的原因，所以现在它必须出声。
if (allSkipped.length) {
  console.error(`\n⚠ 有 ${allSkipped.length} 处解析不出配对，未被检查：\n`);
  for (const s of allSkipped) console.error("  " + s);
}

if (problems.length === 0 && allSkipped.length === 0) {
  console.log("✓ 行数全部对齐，代码结构一致，英文侧注释无残留中文");
  process.exit(0);
}
if (problems.length) {
  console.error(`\n✗ ${problems.length} 个问题：\n`);
  for (const p of problems) console.error("  " + p);
}
process.exit(1);
