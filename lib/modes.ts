// 四种「模式」—— 全站导航的第一维。
//
// 【为什么要有这一层】
// 这个产品是二维的：一维是学什么（foundations / react / federation /
// cab-booking / 面试八股），一维是给你多少（八股 → 课内练习 → Coding → 考场）。
// 上一版把两维都塞进了同一个常驻侧栏，于是侧栏里同时挂着完整课程树、
// 平行支线、四张全量表、速查和清空进度 —— 一个人得先把这个站的内容模型
// 读懂，才能决定点哪儿。
//
// 这一版换成「先问意图」：顶栏只回答一个问题 ——
//
//     我现在想做哪一类事？
//
// 四个答案就是下面这四个模式。选定之后，侧栏才回答第二个问题 ——
//
//     在这件事里，我在哪、下一步是什么？
//
// 所以侧栏的内容随模式变，任何时候都只显示一个模式的结构。
// 四档难度（说得出 / 认得出 / 写得对 / 空手做）没有被删掉，它仍然是
// components/ladder.tsx 里那套解释；只是它现在分布在三个模式里，
// 不再自己充当一级导航。
//
// 【为什么是纯数据模块】
// 没有 "use client"、不带 JSX、不 import 任何内容文件 —— 顶栏（客户端）、
// 首页（客户端）、课程页（服务端）都要用同一份判断。
// 抄第二份就会出现「顶栏说我在 Practice、侧栏说我在 Learn」。

export type ModeId = "learn" | "review" | "practice" | "assess";

export interface Mode {
  id: ModeId;
  /** 顶栏点进去落在哪一页 */
  href: string;
  zh: string;
  en: string;
  /** 一句话：选了它你会拿到什么。首页的四张卡和顶栏的 title 共用这一句 */
  blurbZh: string;
  blurbEn: string;
  /**
   * 属于这个模式的路由前缀。
   *
   * 判断规则是「完全相等，或者以 前缀 + '/' 开头」—— 不用裸 startsWith，
   * 否则 /codex 这种以后新增的路由会被误判成 /code 的下级。
   */
  owns: string[];
}

export const MODES: Mode[] = [
  {
    id: "learn",
    href: "/path",
    zh: "学课程",
    en: "Learn",
    blurbZh: "按顺序读课文，一节一节往下走。",
    blurbEn: "Read the lessons in order, one at a time.",
    owns: ["/path", "/exams"],
  },
  {
    id: "review",
    href: "/drill",
    zh: "背知识点",
    en: "Review",
    blurbZh: "面试问答和抽认卡，不用从第一章开始。",
    blurbEn: "Interview questions and flashcards. No need to start at chapter one.",
    owns: ["/drill"],
  },
  {
    id: "practice",
    href: "/practice",
    zh: "做练习",
    en: "Practice",
    blurbZh: "课内练习，以及能真的跑测试的 coding 工作区。",
    blurbEn: "Lesson exercises, plus coding workspaces that really run the tests.",
    owns: ["/practice", "/code"],
  },
  {
    id: "assess",
    href: "/arena",
    zh: "模拟考试",
    en: "Assess",
    blurbZh: "计时、没有提示，在空文件夹里做一遍。",
    blurbEn: "Timed, no hints, done in an empty folder.",
    owns: ["/arena", "/mock"],
  },
];

/** 当前路径属于哪个模式。首页、使用说明、速查不属于任何模式 —— 它们没有侧栏。 */
export function modeOf(path: string): ModeId | undefined {
  for (const m of MODES) {
    for (const p of m.owns) {
      if (path === p || path.startsWith(p + "/")) return m.id;
    }
  }
  return undefined;
}

export function modeById(id: ModeId): Mode {
  const m = MODES.find((x) => x.id === id);
  // MODES 是本文件里的常量，ModeId 又是它的联合类型 —— 取不到只可能是有人
  // 改了一边忘了另一边，这时候宁可当场炸掉，不要静默回落到 learn。
  if (!m) throw new Error(`unknown mode: ${id}`);
  return m;
}

/** 模式名（给 aria-label、title 这类只能收字符串的地方用） */
export const modeLabel = (id: ModeId, locale: "zh" | "en") =>
  locale === "en" ? modeById(id).en : modeById(id).zh;
