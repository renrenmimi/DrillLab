// 零依赖语法高亮器。
//
// 思路（沿用并扩展了 Vide/ts 的做法）：一个主正则扫全文，把源码切成
// 「注释 | 字符串 | 数字 | 标识符 | 运算符」五类 token，标识符再按
// 「关键字 / 类型名 / 函数调用 / 装饰器」二次分类；最后切成「行 × token」
// 的二维数组，交给 CodeBlock 渲染行号与行高亮。
//
// 相比参考项目新增：tsx/jsx 的 JSX 标签与属性、graphql(含 federation
// directive)、java(含注解)、properties。颜色一律低饱和，见 styles/code.css。

export type Lang =
  | "tsx"
  | "ts"
  | "js"
  | "jsx"
  | "graphql"
  | "java"
  | "json"
  | "bash"
  | "css"
  | "properties"
  | "text";

export type TokType =
  | "kw" // 关键字
  | "str" // 字符串
  | "num" // 数字
  | "com" // 注释
  | "fn" // 函数调用
  | "type" // 类型名 / 大写开头标识符
  | "op" // 运算符与标点
  | "tag" // JSX / GraphQL 标签与字段
  | "attr" // JSX 属性 / properties 的 key / GraphQL 参数名
  | "dir" // 装饰器 @Component / GraphQL directive @key / bash 旗标
  | "var" // bash 变量
  | ""; // 普通文本

export interface Tok {
  t: TokType;
  s: string;
}

export const LANG_LABEL: Record<Lang, string> = {
  tsx: "TSX",
  ts: "TypeScript",
  js: "JavaScript",
  jsx: "JSX",
  graphql: "GraphQL SDL",
  java: "Java",
  json: "JSON",
  bash: "Terminal",
  css: "CSS",
  properties: "Properties",
  text: "Text",
};

/* ---------- 关键字表 ---------- */

const JS_KW = `const let var function return if else for while do switch case break continue
new class extends super this null undefined true false import from export default
try catch finally throw typeof instanceof of in async await yield delete void
static get set as`;

const TS_EXTRA = `interface type enum namespace declare module abstract implements readonly
keyof infer is asserts satisfies public private protected override never unknown any`;

const TS_TYPES = new Set(
  "string number boolean symbol bigint object any unknown never void null undefined".split(/\s+/),
);

const JAVA_KW = `abstract assert boolean break byte case catch char class const continue default
do double else enum extends final finally float for goto if implements import instanceof
int interface long native new package private protected public return short static
strictfp super switch synchronized this throw throws transient try void volatile while
var record sealed permits yield true false null`;

const GQL_KW = `type input interface enum union scalar schema extend implements query mutation
subscription fragment on directive repeatable`;

const BASH_KW = `cd ls cat echo export curl node npm npx mvn java git jest vitest tsc set
if then else fi for do done while sudo mkdir rm cp mv grep`;

// CSS 没有真正的关键字，这里收的是最常见的「属性值」，上色只为了好读
const CSS_VAL = `auto none inherit initial unset revert flex grid block inline inline-block
contents flow-root absolute relative fixed sticky static center start end left right top bottom
space-between space-around space-evenly stretch baseline wrap nowrap wrap-reverse row column
row-reverse column-reverse solid dashed dotted double bold normal italic hidden visible scroll
clip ellipsis border-box content-box repeat no-repeat cover contain auto-fit auto-fill
min-content max-content fit-content transparent currentColor pointer default important
uppercase lowercase capitalize`;

const words = (s: string) => new Set(s.split(/\s+/).filter(Boolean));

const KEYWORDS: Partial<Record<Lang, Set<string>>> = {
  ts: words(JS_KW + " " + TS_EXTRA),
  tsx: words(JS_KW + " " + TS_EXTRA),
  js: words(JS_KW),
  jsx: words(JS_KW),
  java: words(JAVA_KW),
  graphql: words(GQL_KW),
  bash: words(BASH_KW),
  json: words("true false null"),
  css: words(CSS_VAL),
};

/* ---------- 主正则 ---------- */

// 1 注释 | 2 字符串（含模板） | 3 数字 | 4 标识符（可带 @ $ 前缀） | 5 运算符标点
const C_LIKE =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`(?:[^`\\]|\\.)*`|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(\b0[xX][\da-fA-F_]+\b|\b\d[\d_]*(?:\.[\d_]+)?(?:[eE][+-]?\d+)?[dDfFlL]?\b)|([@$]?[A-Za-z_$][\w$]*)|([{}()[\];:,.<>=!+\-*/%&|^~?]+)/g;

const GQL_RE =
  /(#[^\n]*)|("""[\s\S]*?"""|"(?:[^"\\\n]|\\.)*")|(\b\d[\d_]*(?:\.\d+)?\b)|(@?[A-Za-z_][\w]*)|([{}()[\]:,!|=&]+|\.\.\.)/g;

const JSON_RE =
  /()("(?:[^"\\\n]|\\.)*")|(-?\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|([A-Za-z_][\w]*)|([{}[\]:,])/g;

const BASH_RE =
  /(#[^\n]*)|("(?:[^"\\]|\\.)*"|'[^']*')|(\b\d[\d.]*\b)|(--?[A-Za-z][\w-]*|\$[A-Za-z_{][\w}]*|[A-Za-z_][\w./:@-]*)|([|><&\\;=()]+)/g;

// CSS：1 注释 | 2 字符串 | 3 十六进制色与带单位的数字 | 4 at-rule/自定义属性/伪类/选择器/标识符 | 5 标点
// 注意十六进制色放在数字组里且排在标识符组之前，所以 #fff 会被当颜色而不是 id 选择器。
const CSS_RE =
  /(\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(#[0-9a-fA-F]{3,8}\b|-?\b\d[\d.]*(?:px|rem|em|ex|ch|%|vh|vw|vmin|vmax|fr|deg|turn|ms|s|pt)?\b)|(@[A-Za-z-]+|--[A-Za-z][\w-]*|::?[A-Za-z-]+|[.#]?-?[A-Za-z_][\w-]*)|([{}()[\];:,>~+*=|^$!/]+)/g;

const RE: Partial<Record<Lang, RegExp>> = {
  ts: C_LIKE,
  tsx: C_LIKE,
  js: C_LIKE,
  jsx: C_LIKE,
  java: C_LIKE,
  graphql: GQL_RE,
  json: JSON_RE,
  bash: BASH_RE,
  css: CSS_RE,
};

/* ---------- 辅助判断 ---------- */

/** 标识符后紧跟 "("(允许空格)→ 当成函数调用 */
function isCall(src: string, end: number): boolean {
  let i = end;
  while (i < src.length && src[i] === " ") i++;
  return src[i] === "(";
}

/** 标识符前面是 "<" 或 "</"(允许空格)→ 当成 JSX 标签 */
function isJsxTag(src: string, start: number): boolean {
  let i = start - 1;
  while (i >= 0 && src[i] === " ") i--;
  if (i < 0) return false;
  if (src[i] === "/") i--;
  return src[i] === "<";
}

/** 标识符后紧跟 "=" 且不在 "==" 里，且我们在 JSX 语言下 → 属性名 */
function isAttr(src: string, end: number): boolean {
  let i = end;
  while (i < src.length && src[i] === " ") i++;
  return src[i] === "=" && src[i + 1] !== "=";
}

/**
 * CSS：标识符后紧跟 ":" 且冒号后面是空白 → 声明的属性名（color: red）。
 * 要求冒号后有空白，才能把 a:hover 这种选择器区分开来 —— 伪类本身已被
 * 主正则连着冒号一起吃掉，这里挡的是「元素名 + 冒号」被误判成属性。
 */
function isCssProp(src: string, end: number): boolean {
  let i = end;
  while (i < src.length && src[i] === " ") i++;
  if (src[i] !== ":") return false;
  const next = src[i + 1];
  return next === " " || next === "\n" || next === undefined;
}

/** GraphQL：标识符后紧跟 ":" → 字段名或参数名 */
function isGqlField(src: string, end: number): boolean {
  let i = end;
  while (i < src.length && src[i] === " ") i++;
  return src[i] === ":" || src[i] === "(";
}

function classify(lang: Lang, ident: string, src: string, start: number, end: number): Tok {
  if (lang === "bash") {
    if (ident.startsWith("-")) return { t: "dir", s: ident };
    if (ident.startsWith("$")) return { t: "var", s: ident };
    if (KEYWORDS.bash?.has(ident)) return { t: "kw", s: ident };
    return { t: "", s: ident };
  }

  if (lang === "css") {
    if (ident.startsWith("@")) return { t: "dir", s: ident };          // @media / @mixin
    if (ident.startsWith("--")) return { t: "var", s: ident };         // 自定义属性
    if (ident.startsWith(":")) return { t: "kw", s: ident };           // :hover / ::before
    if (ident.startsWith(".") || ident.startsWith("#")) return { t: "type", s: ident };
    if (isCall(src, end)) return { t: "fn", s: ident };                // var() / clamp()
    if (isCssProp(src, end)) return { t: "attr", s: ident };
    if (KEYWORDS.css?.has(ident)) return { t: "kw", s: ident };
    return { t: "", s: ident };
  }

  if (lang === "graphql") {
    if (ident.startsWith("@")) return { t: "dir", s: ident };
    if (KEYWORDS.graphql?.has(ident)) return { t: "kw", s: ident };
    if (isGqlField(src, end)) return { t: "attr", s: ident };
    if (/^[A-Z]/.test(ident)) return { t: "type", s: ident };
    return { t: "tag", s: ident };
  }

  if (ident.startsWith("@")) return { t: "dir", s: ident }; // Java 注解 / TS 装饰器

  if (KEYWORDS[lang]?.has(ident)) {
    // JSX/TS 里 string/number 这类既是关键字位置也是类型位置，按类型上色更好读
    if ((lang === "ts" || lang === "tsx") && TS_TYPES.has(ident) &&
        ident !== "null" && ident !== "undefined") {
      return { t: "type", s: ident };
    }
    return { t: "kw", s: ident };
  }

  if ((lang === "ts" || lang === "tsx") && TS_TYPES.has(ident)) {
    return { t: "type", s: ident };
  }

  if (lang === "tsx" || lang === "jsx") {
    if (isJsxTag(src, start)) {
      return { t: /^[a-z]/.test(ident) ? "tag" : "type", s: ident };
    }
    if (isAttr(src, end)) return { t: "attr", s: ident };
  }

  if (/^[A-Z]/.test(ident)) return { t: "type", s: ident };
  if (isCall(src, end)) return { t: "fn", s: ident };
  return { t: "", s: ident };
}

/* ---------- properties：按行解析 key=value ---------- */

function highlightProperties(code: string): Tok[][] {
  return code.split("\n").map((line): Tok[] => {
    if (/^\s*[#!]/.test(line)) return [{ t: "com", s: line }];
    const m = line.match(/^(\s*)([^=:]+)([=:])(.*)$/);
    if (!m) return [{ t: "", s: line }];
    const toks: Tok[] = [];
    if (m[1]) toks.push({ t: "", s: m[1] });
    toks.push({ t: "attr", s: m[2] });
    toks.push({ t: "op", s: m[3] });
    // ${DB_HOST} 这种占位符单独上色
    const rest = m[4];
    const re = /\$\{[^}]*\}/g;
    let last = 0;
    let mm: RegExpExecArray | null;
    while ((mm = re.exec(rest))) {
      if (mm.index > last) toks.push({ t: "str", s: rest.slice(last, mm.index) });
      toks.push({ t: "var", s: mm[0] });
      last = mm.index + mm[0].length;
    }
    if (last < rest.length) toks.push({ t: "str", s: rest.slice(last) });
    return toks;
  });
}

/* ---------- 通用扫描 ---------- */

function scan(code: string, lang: Lang): Tok[][] {
  const re = RE[lang];
  if (!re) return code.split("\n").map((l) => [{ t: "" as TokType, s: l }]);

  const rx = new RegExp(re.source, "g");
  const toks: Tok[] = [];
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = rx.exec(code))) {
    if (m.index > last) toks.push({ t: "", s: code.slice(last, m.index) });
    const [full, com, str, num, ident, op] = m;
    if (com) toks.push({ t: "com", s: com });
    else if (str) toks.push({ t: "str", s: str });
    else if (num) toks.push({ t: "num", s: num });
    else if (ident)
      toks.push(classify(lang, ident, code, m.index, m.index + ident.length));
    else if (op) toks.push({ t: "op", s: op });
    else toks.push({ t: "", s: full });
    last = m.index + full.length;
  }
  if (last < code.length) toks.push({ t: "", s: code.slice(last) });

  // token 内部可能含换行（多行注释/模板字符串），统一按行切开
  const lines: Tok[][] = [[]];
  for (const tok of toks) {
    const parts = tok.s.split("\n");
    parts.forEach((p, i) => {
      if (i > 0) lines.push([]);
      if (p) lines[lines.length - 1].push({ t: tok.t, s: p });
    });
  }
  return lines;
}

/** 把整段代码高亮成「行 × token」二维数组 */
export function highlight(code: string, lang: Lang): Tok[][] {
  if (lang === "properties") return highlightProperties(code);
  if (lang === "text") return code.split("\n").map((l) => [{ t: "" as TokType, s: l }]);
  return scan(code, lang);
}
