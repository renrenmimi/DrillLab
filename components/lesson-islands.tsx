"use client";

// 课程页里需要交互的三小块。其余（讲解正文、代码、错例、迁移表）都在服务端渲染，
// 这样 42 节课的全文不会被打进客户端包。

import { useEffect } from "react";
import { useProgress } from "@/lib/progress";
import { useActiveHeading } from "@/lib/use-active-heading";
import { T } from "./t";

/** 记录「最近学到哪」，首页的「继续上次」靠它 */
export function LessonVisit({
  examId,
  lessonId,
  title,
}: {
  examId: string;
  lessonId: string;
  title: string;
}) {
  const { visit, ready } = useProgress();

  // 【必须等 ready】effect 是子先父后 —— 这个 effect 比 ProgressProvider 的
  // 「从 localStorage 读回数据」那个 effect 先跑。不等就写，写进去的是空进度，
  // 用户之前学过的东西全没了（这个 bug 真实存在过，实测能复现）。
  // 所以 ready 必须进依赖数组：它翻成 true 时这里要再跑一次，把访问补记上。
  useEffect(() => {
    if (!ready) return;
    visit(examId, lessonId, title);
    // visit 内部幂等（last 相同就不写），依赖只跟着 ready 和路由变
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, examId, lessonId]);

  return null;
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
      <button
        type="button"
        className={done ? "btn btn-sm" : "btn btn-sm btn-primary"}
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
  items: { id: string; label: string }[];
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
