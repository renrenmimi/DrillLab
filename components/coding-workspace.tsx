"use client";

// 工作区 + 讲解 + 答案的开合器。
//
// 【为什么这个壳是客户端组件，里面的正文却是服务端渲染的】
// 「切到空白重来 → 讲解和答案一并收起」这条规则要一个 state，所以壳必须在客户端。
// 但讲解那一节的正文带 JSX、体积很大，绝不能让客户端 import 内容。
// 办法是把服务端渲染好的节点当 props 传进来（explain / solution）——
// React 会在服务端把它们渲染成 RSC payload，客户端只负责决定挂不挂。

import { useState, type ReactNode } from "react";
import type { SandboxSpec } from "@/content/types";
import { CodingDoneToggle } from "./coding-progress";
import { LocalRunCard, SandboxPanel } from "./sandbox";
import { T } from "./t";
import type { LocalizedString } from "./t";

export function CodingWorkspace({
  id,
  title,
  spec,
  commands,
  localWhy,
  explain,
  solution,
}: {
  id: string;
  title: string;
  spec?: SandboxSpec;
  commands?: { cmd: string; expect: string }[];
  localWhy: LocalizedString;
  explain?: ReactNode;
  solution: ReactNode;
}) {
  const [blank, setBlank] = useState(false);

  return (
    <>
      <section className="sec" id="workspace">
        <div className="sec-head">
          <span className="sec-n">§02</span>
          <h2 className="sec-title">
            <T zh="工作区" en="Workspace" />
          </h2>
        </div>

        {spec ? (
          <SandboxPanel blank={blank} onBlank={setBlank} spec={spec} />
        ) : (
          <LocalRunCard commands={commands ?? []} why={localWhy} />
        )}

        <CodingDoneToggle id={id} title={title} />
      </section>

      {blank ? (
        <p className="cd-hidden">
          <T
            zh="空白重来档下，讲解和参考答案都收起来了。写不下去就切回「带脚手架」—— 但那就等于这一遍不算验收。"
            en="In blank-slate mode the walkthrough and the solution are put away. Switch back to the scaffold if you must, but then this pass does not count as a check."
          />
        </p>
      ) : (
        <>
          {explain}
          {solution}
        </>
      )}
    </>
  );
}
