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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { T } from "./t";

export interface CodingSandpackProps {
  /** 全部文件（含测试），键是以 / 开头的路径。可能已经合进了这一档上次写到一半的改动 */
  files: Record<string, string>;
  /** 这一档原本的起始文件 —— 「恢复起始文件」回到它，比较「改没改过」也用它 */
  starterFiles: Record<string, string>;
  /** 改动存进 sessionStorage 时用的键（每道题、每一档各一个） */
  storageKey: string;
  /** 默认打开哪个文件 */
  activeFile: string;
  dependencies: Record<string, string>;
  theme: "light" | "dark";
  /** 期望看到的测试结果，例如 "7 passed" */
  expect: string;
  /** 空白重来档：提示语不一样 */
  blank: boolean;
}

/**
 * 把这一档的改动记进 sessionStorage（审查 A7）。
 *
 * 切「带脚手架 / 空白重来」时整个 Sandpack 会按 key 重挂，刷新页面也一样 ——
 * 不记的话写到一半的代码一点就没了。只记和起始文件不一样的那几个文件。
 */
function KeepEdits({ storageKey, starterFiles }: { storageKey: string; starterFiles: Record<string, string> }) {
  const { sandpack } = useSandpack();
  const { files } = sandpack;
  useEffect(() => {
    const t = window.setTimeout(() => {
      const changed: Record<string, string> = {};
      for (const [path, code] of Object.entries(starterFiles)) {
        const now = files[path]?.code;
        if (now !== undefined && now !== code) changed[path] = now;
      }
      try {
        if (Object.keys(changed).length > 0) {
          window.sessionStorage.setItem(storageKey, JSON.stringify(changed));
        } else {
          window.sessionStorage.removeItem(storageKey);
        }
      } catch {
        /* 隐私模式写不进去：只是刷新之后接不上 */
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [files, starterFiles, storageKey]);
  return null;
}

type RunState = "idle" | "waiting" | "running" | "done";

/** 跑测试的按钮 + 结果摘要。必须在 SandpackProvider 里面才能拿到 dispatch。 */
function RunBar({
  expect: expected,
  blank,
  storageKey,
  starterFiles,
}: {
  expect: string;
  blank: boolean;
  storageKey: string;
  starterFiles: Record<string, string>;
}) {
  const { sandpack, dispatch, listen } = useSandpack();
  const [state, setState] = useState<RunState>("idle");
  const [fileError, setFileError] = useState(false);

  /* 【为什么要等、要重发】测试运行器在 iframe 里，工作区打开后要过几秒才就绪。
     就绪之前 dispatch 的 run-all-tests 会被直接丢掉 —— 实测编辑器出现后 2.5 s 内
     点「跑测试」，20 s 都没有结果，而说明文字照样变成「全对应该是…」（审查 A29）。
     所以：点了先进「准备中」；收到 initialize_tests 就发；2 秒内没看到
     total_test_start 就再发一次（最多 5 次）。 */
  const ready = useRef(false);
  const pending = useRef(false);
  const attempts = useRef(0);
  const timer = useRef<number | undefined>(undefined);

  const send = useCallback(() => {
    window.clearTimeout(timer.current);
    attempts.current += 1;
    dispatch({ type: "run-all-tests" });
    timer.current = window.setTimeout(() => {
      if (!pending.current) return;
      if (attempts.current < 5) send();
      else {
        // 十秒都没开始：多半是打包服务还没连上（见下面 timeout 那条），交还给用户再点
        pending.current = false;
        setState("idle");
      }
    }, 2000);
  }, [dispatch]);

  useEffect(
    () =>
      listen((msg) => {
        if (msg.type !== "test") return;
        if (msg.event === "initialize_tests") {
          ready.current = true;
          if (pending.current) send();
        } else if (msg.event === "total_test_start") {
          pending.current = false;
          window.clearTimeout(timer.current);
          setFileError(false);
          setState("running");
        } else if (msg.event === "file_error") {
          setFileError(true);
        } else if (msg.event === "total_test_end") {
          setState("done");
        }
      }),
    [listen, send],
  );

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const run = () => {
    pending.current = true;
    attempts.current = 0;
    setState(ready.current ? "running" : "waiting");
    // 没就绪也先发一次：就绪信号可能在这个组件挂上之前就发过了。没开始就按上面的节奏重发
    send();
  };

  const restore = () => {
    sandpack.updateFile(starterFiles);
    try {
      window.sessionStorage.removeItem(storageKey);
    } catch {
      /* 同上 */
    }
  };

  const dirty = Object.entries(starterFiles).some(([path, code]) => {
    const now = sandpack.files[path]?.code;
    return now !== undefined && now !== code;
  });

  return (
    <>
      <div className="sbx-bar">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={run}
          aria-busy={state === "waiting" || state === "running"}
        >
          <T zh="跑测试" en="Run tests" />
        </button>
        <span className="sbx-bar-note" aria-live="polite">
          {state === "waiting" ? (
            <T zh="正在准备测试环境…" en="Preparing the test runner…" />
          ) : state === "running" ? (
            <T zh="正在跑…" en="Running…" />
          ) : state === "done" ? (
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
        {dirty && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={restore}>
            <T zh="恢复起始文件" en="Restore the starter files" />
          </button>
        )}
      </div>

      {/* 测试运行器报语法错误时，开头那句是它自己的包装，真正要看的是后面的文件名和行号（审查 A30） */}
      {fileError && (
        <p className="sbx-note">
          <T
            zh="有文件没能跑起来，多半是语法错误。下面的报错里找「/文件名: Unexpected token (行:列)」那一段；前面那句 Cannot assign to read only property 'message' 是测试运行器自己的包装，不用管它。"
            en="A file failed to run, most likely a syntax error. In the error below, look for “/file: Unexpected token (line:column)”. The leading “Cannot assign to read only property 'message'” is the test runner's own wrapper and can be ignored."
          />
        </p>
      )}

      {/* 断网或者 CodeSandbox 的服务连不上时，Sandpack 自己只给一句英文的 TIME_OUT（审查 A8） */}
      {sandpack.status === "timeout" && (
        <p className="sbx-note" role="alert">
          <T
            zh="连不上 CodeSandbox 的打包服务 —— 这块工作区需要联网。检查网络后点上面的 Try again；也可以把这几个文件拷到本机，用 vitest 跑同一套测试。"
            en="Could not reach CodeSandbox's bundler; this workspace needs a network connection. Check it and press Try again above, or copy these files to your machine and run the same tests with vitest."
          />
        </p>
      )}
    </>
  );
}

export default function CodingSandpack({
  files,
  starterFiles,
  storageKey,
  activeFile,
  dependencies,
  theme,
  expect: expected,
  blank,
}: CodingSandpackProps) {
  // 【这两个对象必须固定住】Sandpack 的 provider 在 files / customSetup / template
  // 的**引用**一变就按 props 重置全部文件。这里原来每次渲染都新建对象，于是任何一次
  // 重渲染（比如切主题）都会把写了一半的代码清掉（审查 A7）。
  const customSetup = useMemo(() => ({ dependencies }), [dependencies]);
  const options = useMemo(
    () => ({
      activeFile,
      visibleFiles: Object.keys(files),
      recompileMode: "delayed" as const,
      recompileDelay: 800,
    }),
    [activeFile, files],
  );

  return (
    <div className="sbx">
      <SandpackProvider
        customSetup={customSetup}
        files={files}
        // 展示类开关（showLineNumbers / showInlineErrors / showTabs）是
        // <SandpackCodeEditor> 的 props，写进这里报 TS2353。
        //
        // 【editorHeight 也不能写在这里】types.d.ts 里确实有
        // SandpackOptions.editorHeight，但那是给 <Sandpack /> 预设用的；
        // SandpackProvider 收的是 SandpackInternalOptions，没有这个字段
        // （试过，报 TS2353）。拆开用的时候高度走编辑器的 style。
        options={options}
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

        <KeepEdits starterFiles={starterFiles} storageKey={storageKey} />
        <RunBar blank={blank} expect={expected} starterFiles={starterFiles} storageKey={storageKey} />
        <SandpackTests showWatchButton={false} verbose watchMode={false} />
      </SandpackProvider>
    </div>
  );
}
