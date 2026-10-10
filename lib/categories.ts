// 科目分类（Exam.category）的英文对照。中文那一份是 content/types.ts 里的四个值。
//
// 首页的进度盘和科目总览页都要显示它。这张表曾经只写在 home-tracks.tsx 里，
// 总览页于是在英文界面显示「基础 · Course」—— 所以搬到这里，两处共用一份。
// 纯数据，服务端和客户端组件都能 import。

export const CATEGORY_EN: Record<string, string> = {
  基础: "Foundations",
  前端: "Frontend",
  后端: "Backend",
  全栈: "Full stack",
};

/** 没收进表里的分类回落中文 —— 和 <T> 缺 en 时的行为一致 */
export const categoryEn = (zh: string): string => CATEGORY_EN[zh] ?? zh;
