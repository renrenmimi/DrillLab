"use client";

// 真正把 Sandpack 拉进来的那一块 —— 阶段 D 唯一的第三方 UI 依赖。
//
// 【为什么单独一个文件】
// @codesandbox/sandpack-react 压缩后有几百 KB。它只能出现在
// coding 题详情页和模拟考页，而且要等用户点了「打开工作区」才下载。
// 所以这个文件被 components/sandbox.tsx 用 next/dynamic({ ssr: false }) 引，
// 打包器会把它切成独立的 async chunk —— 别的页面首屏一个字节都不会多。
// **不要在任何地方静态 import 这个文件。**
//
// 【为什么要联网】
// Sandpack 的打包器跑在 codesandbox 的远程 iframe 里（默认
// https://2-19-8-sandpack.codesandbox.io），npm 依赖也从它的 CDN 取。
// 自托管评估见 docs/sandpack-evaluation.md。断网就跑不起来，
// 所以卡片上明说了「需要联网」。
//
// 【React 版本】
// react-ts 模板自带的是 "^19.0.0"，但范围号会随 CDN 上的最新版飘。
// 这里在 customSetup.dependencies 里钉死具体版本（见 content/coding.ts
// 的 SANDBOX_DEPS），保证浏览器里跑的 React 和本站内容用的是同一代。

import {
  SandpackCodeEditor,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  SandpackTests,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { useState } from "react";
import { T } from "./t";

export interface CodingSandpackProps {
  /** 全部文件（含测试），键是以 / 开头的路径 */
  files: Record<string, string>;
  /** 默认打开哪个文件 */
  activeFile: string;
  dependencies: Record<string, string>;
  theme: "light" | "dark";
  /** 期望看到的测试结果，例如 "7 passed" */
  expect: string;
  /** 空白重来档：提示语不一样 */
  blank: boolean;
}

/** 跑测试的按钮 + 结果摘要。必须在 SandpackProvider 里面才能拿到 dispatch。 */
function RunBar({ expect: expected, blank }: { expect: string; blank: boolean }) {
  const { dispatch } = useSandpack();
  const [ran, setRan] = useState(false);

  return (
    <div className="sbx-bar">
      <button
        type="button"
        className="btn btn-primary btn-sm"
        onClick={() => {
          setRan(true);
          dispatch({ type: "run-all-tests" });
        }}
      >
        <T zh="跑测试" en="Run tests" />
      </button>
      <span className="sbx-bar-note">
        {ran ? (
          <T
            zh={`全对应该是 ${expected}。下面每条都能展开看失败原因。`}
            en={`All green means ${expected}. Expand any row for the failure reason.`}
          />
        ) : blank ? (
          <T
            zh={`实现文件已清空 —— 现在跑一定是红的。写完再跑，目标 ${expected}。`}
            en={`Implementation files are empty, so it will fail. Target: ${expected}.`}
          />
        ) : (
          <T
            zh={`先自己写，再点左边这个按钮。目标 ${expected}。`}
            en={`Write it first, then hit the button. Target: ${expected}.`}
          />
        )}
      </span>
    </div>
  );
}

export default function CodingSandpack({
  files,
  activeFile,
  dependencies,
  theme,
  expect: expected,
  blank,
}: CodingSandpackProps) {
  return (
    <div className="sbx">
      <SandpackProvider
        customSetup={{ dependencies }}
        files={files}
        // 展示类开关（showLineNumbers / showInlineErrors / showTabs）是
        // <SandpackCodeEditor> 的 props，写进这里报 TS2353。
        //
        // 【editorHeight 也不能写在这里】types.d.ts 里确实有
        // SandpackOptions.editorHeight，但那是给 <Sandpack /> 预设用的；
        // SandpackProvider 收的是 SandpackInternalOptions，没有这个字段
        // （试过，报 TS2353）。拆开用的时候高度走编辑器的 style。
        options={{
          activeFile,
          visibleFiles: Object.keys(files),
          recompileMode: "delayed",
          recompileDelay: 800,
        }}
        template="react-ts"
        theme={theme}
      >
        <SandpackLayout>
          {/* Sandpack 会往 .sp-stack 上写内联 height: 300px，内联样式压过 CSS ——
              styles/coding.css 里写高度是不生效的（实测写 420 量到 300）。
              420 是「代码和预览能同屏看见」的高度。 */}
          <SandpackCodeEditor
            style={{ height: 420 }}
            showRunButton={false}
            showLineNumbers
            showInlineErrors
            showTabs
            wrapContent
          />
          <SandpackPreview showOpenInCodeSandbox={false} />
        </SandpackLayout>

        <RunBar blank={blank} expect={expected} />
        <SandpackTests showWatchButton={false} verbose watchMode={false} />
      </SandpackProvider>
    </div>
  );
}
