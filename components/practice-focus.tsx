"use client";

// 「有进度的人别看全站平铺」—— 练习页的一个极小客户端小岛。
//
// 【为什么需要它，为什么它只能是客户端】
// /practice 是服务端组件（要遍历 123 个练习的正文，不能进客户端 chunk），
// 而「这个人正在学哪一门」只有 localStorage 知道。所以服务端渲染时
// 只能给出「全部 123 个平铺」，这对刚有一点进度的人是压力不是信息。
//
// 这个岛不接收任何内容，只做一件事：**首次进入没带 ?exam= 时，
// 如果有进度，就把 URL 换成你正在学的那门课。** 换 URL 之后服务端重新
// 渲染，筛选就对齐了 —— 内容仍然全在服务端。
//
// 【为什么用 replace 而不是 push】
// 不能让「后退」退回到未筛选的同一页 —— 那会变成一个退不出去的循环。
//
// 【为什么不静默隐藏】
// 自动筛掉东西如果没说，就是「我的练习不见了」。所以换完之后会显示一行
// 说明，并且「全部」那个筛选 chip 一直都在 —— 一键看全站。

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV } from "@/content/nav";
import { useProgress } from "@/lib/progress";
import { T } from "./t";

export function PracticeFocus({ activeExam }: { activeExam: string }) {
  const { data, ready } = useProgress();
  const router = useRouter();
  const didRedirect = useRef(false);
  const [applied, setApplied] = useState<string | undefined>();

  useEffect(() => {
    if (!ready || didRedirect.current) return;
    // 已经手动筛过了就不插手
    if (activeExam !== "all") return;
    const examId = data.last?.examId;
    if (!examId) return; // 全新用户：保持全站平铺，这时候平铺是对的
    if (!NAV.some((e) => e.id === examId)) return;

    didRedirect.current = true;
    setApplied(examId);
    router.replace(`/practice?exam=${examId}`);
  }, [ready, activeExam, data.last?.examId, router]);

  if (!applied && activeExam === "all") return null;

  const exam = NAV.find((e) => e.id === (applied ?? activeExam));
  if (!exam) return null;

  return (
    <p className="practice-focus">
      <T
        en={`Filtered to ${exam.shortTitle} — the course you are on. Use “All” above to see everything.`}
        zh={`已筛到你正在学的《${exam.shortTitle}》。想看全部就点上面的「全部」。`}
      />
    </p>
  );
}
