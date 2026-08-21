"use client";

// 数据流 / 请求流的逐帧图。
//
// 每一帧是一张完整快照：哪些节点已经走过、哪个节点正在发生、
// 节点上显示什么具体数据。旁白一句话说清「这一步到底发生了什么」。
// 用来讲两条主线：
//   React:  用户操作 → 事件处理 → setState → 重渲染 → 新 UI
//   GraphQL：客户端查询 → Router → subgraph A → entity reference → subgraph B → 合并响应

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useT } from "@/lib/locale";
import { T } from "./t";

export interface FlowNode {
  /** 节点类别小字，如 "组件"、"subgraph" */
  kind: string;
  title: string;
}

export interface FlowFrame {
  /** 这一帧「正在发生」的节点下标 */
  active: number;
  /** 每个节点在这一帧显示的具体数据（按下标对应，可留空） */
  detail?: (string | undefined)[];
  msg: ReactNode;
}

export function DataFlowDiagram({
  title,
  nodes,
  frames,
  direction = "row",
}: {
  title: string;
  nodes: FlowNode[];
  frames: FlowFrame[];
  direction?: "row" | "column";
}) {
  const t = useT();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setStep((s) => {
        if (s >= frames.length - 1) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 1900);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, frames.length]);

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
        <span>{title}</span>
        <span className="dimmer" style={{ marginLeft: "auto", fontWeight: 500 }}>
          <T en={`Step ${step + 1} of ${frames.length}`} zh={`第 ${step + 1} / ${frames.length} 步`} />
        </span>
      </div>

      <div className="viz-stage">
        <div className="viz-flow" data-dir={direction}>
          {nodes.map((n, i) => (
            <div key={i} style={{ display: "contents" }}>
              {i > 0 && (
                <div className="viz-arrow" data-on={i === f.active ? "true" : undefined}>
                  →
                </div>
              )}
              <div className="viz-node" data-on={nodeState(i)}>
                <div className="viz-node-kind">{n.kind}</div>
                <div className="viz-node-title">{n.title}</div>
                {f.detail?.[i] && <div className="viz-node-detail">{f.detail[i]}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="viz-msg" aria-live="polite">
        {f.msg}
      </div>

      <div className="viz-ctl">
        <button
          type="button"
          className="btn btn-sm"
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
          className="btn btn-sm btn-primary"
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
          className="btn btn-sm"
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
