"use client";

// 课程页里需要交互的三小块。其余（讲解正文、代码、错例、迁移表）都在服务端渲染，
// 这样 42 节课的全文不会被打进客户端包。

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useProgress } from "@/lib/progress";
import { useActiveHeading } from "@/lib/use-active-heading";
import { T } from "./t";

/**
 * 记录「最近学到哪」。顶栏那颗「继续」、首页那张卡、Learn 侧栏的 Resume 都靠它。
 *
 * titleEn / course 是给那三处渲染句子用的 —— 「继续 → 某某」在英文界面下
 * 不能嵌一个中文标题。没传就回落中文（<T> 的既有行为）。
 */
export function LessonVisit({
  examId,
  lessonId,
  title,
  titleEn,
  course,
  courseEn,
}: {
  examId: string;
  lessonId: string;
  title: string;
  titleEn?: string;
  course?: string;
  courseEn?: string;
}) {
  const { visit, ready } = useProgress();

  // 【必须等 ready】effect 是子先父后 —— 这个 effect 比 ProgressProvider 的
  // 「从 localStorage 读回数据」那个 effect 先跑。不等就写，写进去的是空进度，
  // 用户之前学过的东西全没了（这个 bug 真实存在过，实测能复现）。
  // 所以 ready 必须进依赖数组：它翻成 true 时这里要再跑一次，把访问补记上。
  useEffect(() => {
    if (!ready) return;
    visit(examId, lessonId, title, { titleEn, sub: course, subEn: courseEn });
    // visit 内部幂等（last 相同就不写），依赖只跟着 ready 和路由变
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, examId, lessonId]);

  return null;
}

/**
 * 课头那枚「学完没有」的徽章。
 *
 * ready 之前什么都不渲染 —— 服务端不知道 localStorage 里有什么，
 * 提前渲染任何一种状态都会 hydration 不一致。
 */
export function LessonStatusChip({
  examId,
  lessonId,
}: {
  examId: string;
  lessonId: string;
}) {
  const { lessonDone, ready } = useProgress();
  if (!ready) return null;

  return lessonDone(examId, lessonId) ? (
    <span className="tag" data-tone="ok">
      <T en="Finished" zh="已学完" />
    </span>
  ) : (
    <span className="tag">
      <T en="Not marked yet" zh="还没标记学完" />
    </span>
  );
}

/** 「学完这节」打勾 */
export function LessonDoneBar({
  examId,
  lessonId,
}: {
  examId: string;
  lessonId: string;
}) {
  const { lessonDone, toggleLesson, ready } = useProgress();
  const done = ready && lessonDone(examId, lessonId);

  return (
    <div className="done-bar" data-done={done}>
      <span className="done-bar-text">
        {done ? (
          <T en="Marked as finished." zh="这节标记为学完了。" />
        ) : (
          <T
            en="Read it and worked through the exercises above?"
            zh="读完并且做过上面的练习了吗？"
          />
        )}
      </span>
      {/* 【为什么不是实心按钮】一屏只有一个实心强调动作，课程页那一个是
          课尾面板里的「下一节」。打勾是记账，不是这一页的下一步 ——
          它和「下一节」同为实心时，读完一节课眼前会有两个都说得通的动作。
          做没做过的区别由 .done-bar[data-done] 那一圈边框和底色表达。 */}
      <button
        type="button"
        className="btn btn-sm"
        style={{ marginLeft: "auto" }}
        onClick={() => toggleLesson(examId, lessonId)}
      >
        {done ? <T en="Unmark" zh="取消标记" /> : <T en="Mark as finished" zh="标记这节学完了" />}
      </button>
    </div>
  );
}

/** 右栏目录 —— 带 scroll-spy 高亮 */
export function LessonToc({
  items,
}: {
  // label 只用来渲染，所以收 ReactNode —— 段标题是双语的，
  // 传进来的是 <T zh en />。用「中文 / English」斜杠格式会让每条目录长一倍。
  items: { id: string; label: ReactNode }[];
}) {
  const active = useActiveHeading(items.map((i) => i.id));

  return (
    <ul className="rail-toc">
      {items.map((it) => (
        <li key={it.id}>
          <a href={`#${it.id}`} data-active={active === it.id || undefined}>
            {it.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
