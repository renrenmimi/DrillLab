// 中文文案里的「换行空格」检查。
//
// JSX 会把一段文字逐行去掉首尾空白，再用一个空格把各行连起来，所以中文句子
// 在源码里换行，渲染出来就多一个空格（「单独拿出来， 再配上」）；全角标点后面
// 手写的空格也一样。本站的约定是：中文与英文字母、数字之间留空格
// （「写 alert」「第 3 课」），「——」两侧留空格，除此之外中文里不出现空格。
// 这个脚本扫描 app、components、content、lib 下的全部 TSX 文件，报告其余情况，
// 有一处就以 1 退出（CI 里跑）。修法：把那一行接到上一行末尾，不要换行。
//
//   npm run audit:zh
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

const HAN = /[\u3400-\u9fff\uf900-\ufaff]/u;
const FW = /[\u3000-\u303f\uff00-\uffef]/u; // 全角标点与全角字符
const ZH = /[\u3400-\u9fff\uf900-\ufaff\u3000-\u303f\uff00-\uffef]/u;
const PUNCT = /[\u3001-\u3003\u3008-\u3011\u3014-\u301f\uff01-\uff0f\uff1a-\uff1f\uff3b-\uff40\uff5b-\uff65]/u;
const K = ts.SyntaxKind;

/** 收尾中文的省略号（而不是夹在一串带空格的符号中间的那种） */
function closesChinese(raw, i) {
  let j = i;
  while (j > 0 && raw[j - 1] === "…") j--;
  return j > 0 && ZH.test(raw[j - 1]);
}

/** raw[i] 与下一段文字之间的换行是否不该渲染成空格 */
function breakIsStray(raw, i, a, b) {
  if (FW.test(a) && b !== "—") return true;
  if (a === "…" && closesChinese(raw, i) && b !== "—") return true;
  if (FW.test(b) && a !== "—") return true;
  if (HAN.test(a) && (HAN.test(b) || b === "(" || b === "“")) return true;
  if (/[,:;?!]/.test(a) && HAN.test(b)) return true;
  if (a === ")" && HAN.test(b)) {
    const open = raw.lastIndexOf("(", i);
    return open > 0 && ZH.test(raw[open - 1]);
  }
  return false;
}

/** JSX 对一个文本节点实际渲染出的文字 */
function rendered(raw) {
  if (!raw.includes("\n")) return raw;
  return raw
    .split("\n")
    .map((l, i, all) => (i === 0 ? l.trimEnd() : i === all.length - 1 ? l.trimStart() : l.trim()))
    .filter((l) => l.length)
    .join(" ");
}

function edge(node, sf, last) {
  if (node.kind === K.JsxText) {
    const t = rendered(node.getFullText(sf));
    return t.length ? t[last ? t.length - 1 : 0] : null;
  }
  if (ts.isJsxExpression(node)) {
    const e = node.expression;
    if (e && (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)))
      return e.text.length ? e.text[last ? e.text.length - 1 : 0] : null;
    return undefined;
  }
  if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
    const kids = node.children.filter((c) => !(c.kind === K.JsxText && rendered(c.getFullText(sf)) === ""));
    return kids.length ? edge(last ? kids[kids.length - 1] : kids[0], sf, last) : null;
  }
  return undefined;
}

export function strays(file, text = readFileSync(file, "utf8")) {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found = [];
  const at = (pos, kind, what, len) =>
    found.push({ file, pos, len, kind, line: sf.getLineAndCharacterOfPosition(pos).line + 1, what });

  const scanText = (start, raw) => {
    for (const m of raw.matchAll(/(\S)([ \t]*\n[ \t\n]*)(\S)/g)) {
      if (breakIsStray(raw, m.index, m[1], m[3]))
        at(start + m.index + 1, "break", `${m[1]}⏎${m[3]}`, m[2].length);
    }
    for (const m of raw.matchAll(/(\S)( +)(\S)/g)) {
      const a = m[1], b = m[3];
      const stray = (PUNCT.test(a) || (a === "…" && closesChinese(raw, m.index))) && ZH.test(b) && b !== "—";
      if (stray) at(start + m.index + 1, "space", `${a}␠${b}`, m[2].length);
    }
  };

  const visit = (node) => {
    if (node.kind === K.JsxText) scanText(node.pos, node.getFullText(sf));
    else if (ts.isStringLiteral(node) && node.parent?.kind === K.JsxAttribute)
      scanText(node.getStart(sf), node.getText(sf));
    if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
      const kids = node.children.filter((c) => !(c.kind === K.JsxText && rendered(c.getFullText(sf)) === ""));
      kids.forEach((c, i) => {
        const prev = kids[i - 1];
        const next = kids[i + 1];
        if (!prev) return;
        const a = edge(prev, sf, true);
        if (!a || !PUNCT.test(a)) return;
        if (ts.isJsxExpression(c) && c.expression && ts.isStringLiteral(c.expression) && /^ +$/.test(c.expression.text) && next) {
          const b = edge(next, sf, false);
          if (b && ZH.test(b)) at(c.getStart(sf), "manual", `{" "} after ${a}`, 0);
        }
        if (ts.isJsxElement(c) && c.children[0]?.kind === K.JsxText) {
          const m = /^( +)(\S)/.exec(c.children[0].getFullText(sf));
          if (m && ZH.test(m[2])) at(c.children[0].pos, "manual", `space opening <${c.openingElement.tagName.getText(sf)}> after ${a}`, 0);
        }
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

export function tsxFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? tsxFiles(join(dir, e.name)) : e.name.endsWith(".tsx") ? [join(dir, e.name)] : [],
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = ["app", "components", "content", "lib"].flatMap(tsxFiles);
  const all = files.flatMap((f) => strays(f));
  for (const s of all.slice(0, 60)) console.log(`${s.file}:${s.line} ${s.kind} ${s.what}`);
  const by = {};
  for (const s of all) by[s.kind] = (by[s.kind] ?? 0) + 1;
  console.log(`\nscanned ${files.length} TSX files; findings: ${all.length}`, by);
  process.exit(all.length ? 1 : 0);
}
