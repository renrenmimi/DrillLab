"use client";

// 沙箱的外壳：一道门 + 两档 + 「跑不了就别装能跑」的降级卡片。
//
// 门在这里的理由和答案门一样 —— 一进页面就把编辑器摊开，人会直接开始改代码，
// 跳过「先读题、先想」。所以默认只有一个按钮。
// 顺带一个实打实的好处：Sandpack 那几百 KB 只在点开之后才下载。

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { SandboxSpec } from "@/content/types";
import { useTheme } from "@/lib/theme";
import { TerminalCommand } from "./code";
import { Loc, T, type LocalizedString } from "./t";

/**
 * 这一行是整个懒加载的关键：
 *   · ssr: false  —— Sandpack 会摸 window，服务端渲染不了
 *   · 动态 import —— 打包成独立 chunk，只有下面 open === true 时才发请求
 * 别改成静态 import，那会把它塞进 /code/[id] 的首屏。
 */
const CodingSandpack = dynamic(() => import("./coding-sandpack"), {
  ssr: false,
  loading: () => (
    <div className="sbx-loading">
      <T zh="正在拉起工作区…" en="Booting the workspace…" />
    </div>
  ),
});

/* ============================================================
   可运行：真沙箱
   ============================================================ */

// 编辑器里的文字没法按语言切 —— 它是一个字符串，进了 Sandpack 就由那边渲染，
// CSS 的 data-lang 开关管不到。所以照 lib/locale.tsx 里那条约定：两种语言拼在
// 同一行（和 aria-label="复制 / Copy" 一个路子）。
// 【行数必须保持不变】沙箱代码的行数会影响编辑器显示，翻译只准往行尾加。
const BLANK_NOTE =
  "// 空白重来：这个文件是空的，全部由你写。 / Blank slate: this file is empty — you write all of it.\n// 测试文件就是判卷器 —— 不要改测试。 / The test file is the grader; do not edit the tests.\n";

const BLANK_APP = `// 空白重来：预览先空着。 / Blank slate: the preview starts out empty.
// 组件写完之后，改这里把它挂上来。 / Once your component is written, mount it here.
export default function App() {
  return <p>空白重来档 —— 先把实现文件写出来。 / Blank slate — write the implementation files first.</p>;
}
`;

const TEST_PATH = "/App.test.tsx";

/** 把一份 SandboxSpec 摊成 Sandpack 要的文件表 */
function buildFiles(spec: SandboxSpec, blank: boolean): Record<string, string> {
  const keep = new Set(spec.blankKeep ?? []);
  const out: Record<string, string> = {};

  for (const [path, code] of Object.entries(spec.files)) {
    if (!blank || keep.has(path)) {
      out[path] = code;
      continue;
    }
    out[path] = path.endsWith("/App.tsx") ? BLANK_APP : BLANK_NOTE;
  }

  // 测试永远原样保留 —— 两档都是它判卷
  out[TEST_PATH] = spec.tests;
  return out;
}

export function SandboxPanel({
  spec,
  blank,
  onBlank,
}: {
  spec: SandboxSpec;
  blank: boolean;
  onBlank: (next: boolean) => void;
}) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const files = useMemo(() => buildFiles(spec, blank), [spec, blank]);
  const fileCount = Object.keys(spec.files).length;

  if (!open) {
    return (
      <div className="sbx-gate">
        <p>
          <T
            zh="工作区是一个真的浏览器沙箱：左边写代码，右边实时预览，下面一个「跑测试」按钮。测试和本机那套是同一批断言，转写成了浏览器里能跑的写法。"
            en="The workspace is a real in-browser sandbox: edit on the left, live preview on the right, one Run button below. The assertions are the same ones that pass on a real machine, rewritten for the browser runner."
          />
        </p>
        <p className="sbx-gate-warn">
          <strong>
            <T zh="需要联网。" en="Requires an internet connection." />
          </strong>{" "}
          <T
            zh="打包器和 npm 依赖都在 CodeSandbox 的远程服务上（评估过程见 docs/sandpack-evaluation.md），断网这块就起不来 —— 那就照下面的命令在本机跑。"
            en="The bundler and the npm packages come from CodeSandbox's remote service, so this panel needs network access."
          />
        </p>
        <div className="sbx-gate-actions">
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            <T zh="打开工作区" en="Open the workspace" />
          </button>
          <span className="dimmer">
            <T
              zh={`${fileCount} 个起始文件 · 目标 ${spec.expect}`}
              en={`${fileCount} starter files · target ${spec.expect}`}
            />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="sbx-wrap">
      <div className="sbx-modes" role="group" aria-label="沙箱档位 / Sandbox mode">
        <button
          type="button"
          className="sbx-mode"
          data-on={!blank}
          onClick={() => onBlank(false)}
        >
          <T zh="带脚手架" en="With scaffold" />
        </button>
        <button
          type="button"
          className="sbx-mode"
          data-on={blank}
          onClick={() => onBlank(true)}
        >
          <T zh="空白重来" en="Blank slate" />
        </button>
        <span className="sbx-modes-note">
          {blank ? (
            <T
              zh="实现文件全清了，只留测试。讲解和答案也一并收起 —— 这一档是验收，不是学习。"
              en="Implementation files are wiped; only the tests remain. The walkthrough and the solution are hidden — this mode is the check, not the lesson."
            />
          ) : (
            <T
              zh="起始文件都在，边看边填。第二遍再点「空白重来」。"
              en="Starter files are in place. Come back and hit Blank slate on your second pass."
            />
          )}
        </span>
      </div>

      <CodingSandpack
        activeFile={
          blank
            ? TEST_PATH
            : (spec.activeFile ?? spec.blankKeep?.[0] ?? Object.keys(spec.files)[0])
        }
        blank={blank}
        dependencies={spec.dependencies ?? {}}
        expect={spec.expect}
        files={files}
        key={blank ? "blank" : "scaffold"}
        theme={theme}
      />
    </div>
  );
}

/* ============================================================
   跑不了的题：本机跑卡片
   ============================================================ */

export function LocalRunCard({
  commands,
  why,
}: {
  commands: { cmd: string; expect: string }[];
  /** 为什么这道题在浏览器里跑不了。逐题不同，所以是双语字符串而不是固定文案 */
  why: LocalizedString;
}) {
  return (
    <div className="sbx-local">
      <div className="minihead">
        <T zh="这道题在本机跑" en="Run this one on your own machine" />
      </div>
      <p className="sbx-local-why">
        <Loc v={why} />
      </p>
      <TerminalCommand steps={commands.map((c) => ({ cmd: c.cmd, out: c.expect }))} />
      <p className="sbx-local-note">
        <T
          zh="跑完自己对一遍期望输出，然后在下面打勾。这里不给假编辑器 —— 装个能跑的样子只会让你以为练过了。"
          en="Compare the output yourself, then tick it off below. No fake editor here."
        />
      </p>
    </div>
  );
}
