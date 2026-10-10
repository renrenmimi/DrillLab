// ⌘K 搜索的索引 —— 只在第一次打开搜索时才被 import()（见 components/search.tsx）。
//
// 【为什么单独一个文件】搜索框挂在根 layout 上，每个路由都下载它。建索引要读
// content/nav（课程、八股、coding、考场的清单，gzip 后约 31 KB）。这一段曾经写在
// search.tsx 里，nav 于是跟着搜索框进了每一页的首屏（审查 A35）。
// 拆出来以后，没打开过搜索的页面一个字节都不用为它下。
//
// 【双语】展示字段是 LocalizedString，但**匹配用 allText 拼中英两版** ——
// 搜索是找东西，不该被当前界面语言挡住。八股的英文原题尤其重要：
// 面试官念的是英文，用户会用英文搜。

import {
  ARENA,
  CODING,
  DRILLS,
  NAV,
  arenaPath,
  codingPath,
  drillPath,
  examPath,
  lessonPath,
  mockPath,
  navLessonsOf,
} from "@/content/nav";
import { stageEn } from "@/content/path";
import type { PlanHit } from "@/lib/plan-search";
import { L, type LocalizedString } from "./t";

export interface Hit {
  href: string;
  /** 类别标签。字符串 = 两种语言都用这个（考试名、track 名这类不翻） */
  kind: LocalizedString;
  title: LocalizedString;
  sub: LocalizedString;
  /** 参与匹配但不一定展示的文本。中英都要塞进来 —— 用哪种语言搜都得中 */
  haystack: string;
}

// 【两处过期信息在这一版修掉了】
//  · /path 原来写「八个阶段的完整路线」—— 全局 Stage 0–11 早就废了，
//    现在是「按考试分组 + 组内序号」，见 components/learning-path.tsx。
//  · /exams 这一条删掉了 —— 那个路由已经在 next.config.mjs 里重定向到 /path，
//    搜出来点进去等于原地跳转，纯噪音。
// 顺手把四条主线（八股 / Coding / 考场）补进来 —— 它们本来不在页面索引里。
/** 有沙箱的题数 —— 别硬写，nav 里 hasSandbox 就是真相 */
const SANDBOXED = CODING.filter((c) => c.hasSandbox).length;

const PAGES: Hit[] = [
  {
    href: "/",
    kind: L("页面", "Page"),
    title: L("首页", "Home"),
    sub: L("DrillLab 是什么、从哪开始", "What DrillLab is and where to start"),
    haystack: "首页 home 概览 overview start 目标 goal",
  },
  {
    href: "/plans",
    kind: L("引导计划", "Guided plans"),
    title: L("引导计划", "Guided plans"),
    sub: L(
      "六条按目标走的路径",
      "Six ordered routes, one per outcome",
    ),
    haystack: "计划 引导 目标 路径 plan plans guided goal roadmap 准备 prepare",
  },
  {
    href: "/path",
    kind: L("学课程", "Learn"),
    title: L("课程路线图", "Roadmap"),
    sub: L(`${NAV.length} 门课分组的完整路线`, `The full route, grouped by ${NAV.length} courses`),
    // 四个模式的名字都要能搜到 —— 一个人记住的是顶栏上那个词，
    // 不是路由名（见 lib/modes.ts）
    haystack: "学习路径 路线图 roadmap 课程 path 归档 学课程 learn 课文 lesson",
  },
  {
    href: "/drill",
    kind: L("背知识点", "Review"),
    title: L("八股题库", "Interview drills"),
    sub: L(`${DRILLS.length} 道问答，题库模式 + 抽认卡`, `${DRILLS.length} questions, bank mode and flashcards`),
    haystack: "八股 题库 抽认卡 drill flashcard 面试 interview 背知识点 review 复习",
  },
  {
    href: "/code",
    kind: L("做练习", "Practice"),
    title: L("Coding 题", "Coding problems"),
    sub: L(
      `${CODING.length} 道，${SANDBOXED} 道能在浏览器里跑`,
      `${CODING.length} problems, ${SANDBOXED} run in the browser`,
    ),
    haystack: "coding 题 沙箱 sandbox 浏览器 run 跑测试 做练习 practice",
  },
  {
    href: "/arena",
    kind: L("模拟考试", "Assess"),
    title: L("考场", "Arena"),
    sub: L(
      `${ARENA.length} 道 —— 空文件夹、计时、无提示`,
      `${ARENA.length} papers — empty folder, timed, no hints`,
    ),
    haystack: "考场 arena 从零重写 计时 timed 验收 模拟考试 assess",
  },
  {
    href: "/practice",
    kind: L("做练习", "Practice"),
    title: L("课内练习", "Lesson exercises"),
    sub: L("按课程 / 难度 / 题型筛练习", "Filter by course, level and kind"),
    haystack: "练习 练习场 填空 debug 难度 practice exercise 做练习 课内练习",
  },
  {
    href: "/mock",
    kind: L("模拟考试", "Assess"),
    title: L("模拟考", "Mock exams"),
    sub: L("换了场景、考点一致", "Different scenario, same skills tested"),
    haystack: "模拟考 mock 模拟",
  },
  {
    href: "/reference",
    kind: L("页面", "Page"),
    title: L("速查", "Reference"),
    sub: L("命令、SDL、状态码、报错对照表", "Commands, SDL, status codes, error table"),
    haystack: "速查 命令 报错 状态码 hooks sdl debug 清单 reference cheatsheet",
  },
];


/**
 * 建索引。
 *
 * deepText 是「那一节的全部可搜文本」—— 它来自 content/search-index.ts，
 * 那份数据 130 KB 出头，所以是**懒加载**的：第一次打开搜索时才 import()。
 * 还没加载完的时候 deepText 返回空串，索引照样能用，只是暂时只匹配
 * 标题和一句话简介 —— 用户敲第一个字就已经有结果，不会看到空白。
 */
export function buildIndex(
  deepText: (examId: string, lessonId: string) => string,
  planHits: PlanHit[],
): Hit[] {
  // 英文补上了就给双语，没补就退回中文字符串 —— 和 <T> 的回落行为一致。
  const loc = (zh: string, en?: string) => (en ? { zh, en } : zh);

  const out: Hit[] = [...PAGES];

  // 引导计划：整条，加上每一档。也是懒加载的（见下面 usePlanHits）。
  for (const p of planHits) {
    out.push({
      href: p.href,
      kind: { zh: p.kindZh, en: p.kindEn },
      title: { zh: p.titleZh, en: p.titleEn },
      sub: { zh: p.subZh, en: p.subEn },
      haystack: p.haystack,
    });
  }

  for (const exam of NAV) {
    out.push({
      href: examPath(exam.id),
      kind: L("考试", "Course"),
      title: loc(exam.title, exam.titleEn),
      sub: loc(exam.description, exam.descriptionEn),
      // 两种语言都进 haystack —— 否则英文界面下用英文词搜不到东西
      haystack: [
        exam.title,
        exam.titleEn,
        exam.shortTitle,
        exam.shortTitleEn,
        exam.description,
        exam.descriptionEn,
        exam.tests,
        exam.testsEn,
        ...exam.stack,
      ]
        .filter(Boolean)
        .join(" "),
    });

    for (const ref of navLessonsOf(exam)) {
      const l = ref.lesson;
      out.push({
        href: lessonPath(exam.id, l.id),
        kind: {
          zh: `${exam.shortTitle} · ${ref.module.stage ?? "课程"}`,
          en: `${exam.shortTitleEn ?? exam.shortTitle} · ${
            (ref.module.stage && stageEn(ref.module.stage)) ?? "Lesson"
          }`,
        },
        title: loc(l.title, l.titleEn),
        sub: loc(l.blurb, l.blurbEn),
        haystack: [l.title, l.titleEn, l.blurb, l.blurbEn, deepText(exam.id, l.id)]
          .filter(Boolean)
          .join(" "),
      });
    }

    for (const m of exam.mockExams) {
      out.push({
        href: mockPath(exam.id, m.id),
        kind: {
          zh: `${exam.shortTitle} · 模拟考`,
          en: `${exam.shortTitleEn ?? exam.shortTitle} · Mock exam`,
        },
        title: loc(m.title, m.titleEn),
        sub: loc(m.scenario, m.scenarioEn),
        haystack: [m.title, m.titleEn, m.scenario, m.scenarioEn, m.mirrors, m.mirrorsEn, ...m.taskTitles]
          .filter(Boolean)
          .join(" "),
      });
    }
  }

  /* ---- 刷题层：八股 / coding / 考场 ----
     中文问题和英文原题都要能搜到 —— 面试官念的是英文。
     题库编号也要能搜（用户会记 #305 这种）。 */

  for (const q of DRILLS) {
    out.push({
      href: drillPath(q.id),
      kind: L("八股题", "Drill"),
      title: q.zh,
      sub: q.en,
      haystack: [q.zh, q.en, q.track, ...q.bank.map((n) => `#${n}`), ...q.bank.map(String)].join(" "),
    });
  }

  for (const c of CODING) {
    out.push({
      href: codingPath(c.id),
      kind: L("Coding 题", "Coding"),
      // 英文标题曾经没进来：英文界面显示中文标题，用英文词也搜不到（审查 A6）
      title: loc(c.title, c.titleEn),
      // hasSandbox 才是「这一页真能跑」的真相；runnable 只表示「原理上能跑」。
      // 这里不能用 runnable —— 那会让 fetch-user 这种没沙箱的题也标成「可在浏览器跑」。
      sub: {
        zh: `${c.track} · 约 ${c.minutes} 分钟${c.hasSandbox ? " · 可在浏览器跑" : " · 需要本机跑"}`,
        en: `${c.track} · ~${c.minutes} min${c.hasSandbox ? " · runs in the browser" : " · run it locally"}`,
      },
      haystack: [
        c.title,
        c.titleEn,
        c.track,
        c.hasSandbox ? "可运行 runnable 沙箱 sandbox browser" : "本机 local",
      ]
        .filter(Boolean)
        .join(" "),
    });
  }

  for (const a of ARENA) {
    out.push({
      href: arenaPath(a.id),
      kind: L("考场", "Arena"),
      title: loc(a.title, a.titleEn),
      sub: loc(a.scenario, a.scenarioEn),
      haystack: [a.title, a.titleEn, a.scenario, a.scenarioEn, "考场 arena 从零重写 计时 timed rebuild"]
        .filter(Boolean)
        .join(" "),
    });
  }

  return out;
}

