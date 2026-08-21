// 内容文件的小工具 —— 只为了让课程数据写起来干净，不含任何 UI。
//
// real(...)  这段代码原样来自源项目 / 已在源项目里真实跑通 → 页面显示「已验证」
// demo(...)  教学示意、故意写错的反例、DrillLab 自出的题 → 页面显示「示意」
//
// 规矩：凡是标 real 的，必须能在 sourceFile 指向的真实文件里找到，
// 或者是我在审计阶段真实跑通过的代码。不许拿没跑过的东西冒充。

import type { CodeExample, CodeLang } from "./types";

interface Opts {
  filename?: string;
  /** 见 CodeExample.filenameEn —— filename 常被当代码窗标题用，不只是路径 */
  filenameEn?: string;
  sourceFile?: string;
  highlight?: number[];
  explanation?: React.ReactNode;
  explanationEn?: React.ReactNode;
  collapsible?: boolean;
  /**
   * 英文版代码。**只有注释不同，可执行行必须逐字节相同，行数必须一致** ——
   * highlight 是行号，差一行就默默指错。用 `npm run audit:code` 查。
   * 详见 content/types.ts 的 CodeExample.codeEn。
   */
  codeEn?: string;
}

/**
 * 来自源项目、或在源项目里真实跑通过的代码。
 * 有 sourceFile 的标「源项目」，没有的标「已验证」（比如我写的参考解法）。
 */
export function real(language: CodeLang, body: string, opts: Opts = {}): CodeExample {
  return {
    language,
    code: body.replace(/^\n/, "").trimEnd(),
    verified: opts.sourceFile ? "source" : "verified",
    ...opts,
  };
}

/** 不在源项目里，但我在本机真实跑通过 —— 比如模拟考的参考答案。 */
export function tested(language: CodeLang, body: string, opts: Opts = {}): CodeExample {
  return { language, code: body.replace(/^\n/, "").trimEnd(), verified: "verified", ...opts };
}

/** 教学示意 / 故意写错的反例 / 没跑过的片段。 */
export function demo(language: CodeLang, body: string, opts: Opts = {}): CodeExample {
  return { language, code: body.replace(/^\n/, "").trimEnd(), verified: "demo", ...opts };
}
