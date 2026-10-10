"use client";

// 数据流 / 请求流的逐帧图。
//
// 每一帧是一张完整快照：哪些节点已经走过、哪个节点正在发生、
// 节点上显示什么具体数据。旁白一句话说清「这一步到底发生了什么」。
// 用来讲两条主线：
//   React:  用户操作 → 事件处理 → setState → 重渲染 → 新 UI
//   GraphQL：客户端查询 → Router → subgraph A → entity reference → subgraph B → 合并响应

import { useEffect, useState, type ReactNode } from "react";
import { useT } from "@/lib/locale";
import { Loc, T, type LocalizedString } from "./t";

// 【双语】标题、节点和每帧的数据收 LocalizedString：写 L("中文", "English")
// 就是双语，只写字符串就两种语言都显示它（代码、专有名词这类不用翻的）。
// 旁白是 ReactNode，双语时直接传 <T zh={…} en={…} />。
// 同一个图会同时插在中文正文和英文正文里，所以这几个字段必须自带两种语言。

export interface FlowNode {
  /** 节点类别小字，如 L("组件", "Component")、"subgraph" */
  kind: LocalizedString;
  title: LocalizedString;
}

export interface FlowFrame {
  /** 这一帧「正在发生」的节点下标 */
  active: number;
  /** 每个节点在这一帧显示的具体数据（按下标对应，可留空） */
  detail?: (LocalizedString | undefined)[];
  msg: ReactNode;
}

export function DataFlowDiagram({
  title,
  nodes,
  frames,
  direction = "row",
}: {
  title: LocalizedString;
  nodes: FlowNode[];
  frames: FlowFrame[];
  direction?: "row" | "column";
}) {
  const t = useT();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  // 自动播放：每 1.9 秒前进一步；走到最后一帧后再过一拍，关掉播放（与原来的节奏一致）。
  // 「前进」和「停下」都在定时器回调里决定，不放进 setStep 的 updater ——
  // updater 必须是纯函数（StrictMode 下会被调两次），不能在里面再调 setPlaying。
  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => {
      if (step >= frames.length - 1) setPlaying(false);
      else setStep(step + 1);
    }, 1900);
    return () => clearTimeout(id);
  }, [playing, step, frames.length]);

  const f = frames[step];
  const last = frames.length - 1;

  const nodeState = (i: number) => {
    if (i === f.active) return "true";
    if (i < f.active) return "past";
    return undefined;
  };

  return (
    <div className="viz">
      <div className="viz-bar">
        <span>
          <Loc v={title} />
        </span>
        <span className="dimmer viz-count">
          <T en={`Step ${step + 1} of ${frames.length}`} zh={`第 ${step + 1} / ${frames.length} 步`} />
        </span>
      </div>

      <div className="viz-stage">
        <div className="viz-flow" data-dir={direction}>
          {nodes.map((n, i) => {
            const d = f.detail?.[i];
            return (
              <div key={i} className="viz-pair">
                {i > 0 && (
                  <div className="viz-arrow" data-on={i === f.active ? "true" : undefined}>
                    →
                  </div>
                )}
                <div className="viz-node" data-on={nodeState(i)}>
                  <div className="viz-node-kind">
                    <Loc v={n.kind} />
                  </div>
                  <div className="viz-node-title">
                    <Loc v={n.title} />
                  </div>
                  {d && (
                    <div className="viz-node-detail">
                      <Loc v={d} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="viz-msg" aria-live="polite">
        {f.msg}
      </div>

      {/* 【这三颗按钮里没有实心的】
          这张图是课文里的一个演示件，不是这一页要你做的事 ——
          一节课上还摆着好几道练习，每个零件都给自己配一颗实心强调色按钮，
          整页就被柠檬绿铺满了。所以：上一步 / 下一步是无边框的 .btn-ghost，
          播放是描边的 .btn，实心那一档全站只留给侧栏那颗〔继续〕。 */}
      <div className="viz-ctl">
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          disabled={step === 0}
          onClick={() => {
            setPlaying(false);
            setStep(Math.max(0, step - 1));
          }}
        >
          ← <T en="Back" zh="上一步" />
        </button>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            if (step >= last) setStep(0);
            setPlaying(!playing);
          }}
        >
          {playing ? (
            <T en="Pause" zh="暂停" />
          ) : step >= last ? (
            <T en="Replay" zh="重播" />
          ) : (
            <T en="Autoplay" zh="自动播放" />
          )}
        </button>
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          disabled={step >= last}
          onClick={() => {
            setPlaying(false);
            setStep(Math.min(last, step + 1));
          }}
        >
          <T en="Next" zh="下一步" /> →
        </button>
        <span className="viz-steps">
          {frames.map((_, i) => (
            <button
              key={i}
              type="button"
              className="viz-dot"
              data-on={i === step ? "true" : undefined}
              aria-label={t(`跳到第 ${i + 1} 步`, `Jump to step ${i + 1}`)}
              onClick={() => {
                setPlaying(false);
                setStep(i);
              }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
