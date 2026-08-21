// 八股题库 —— 从 interview 那门课**派生**出 99 道题。
//
// 【为什么是派生而不是另存一份】
// 每道八股题在 content/exams/iv-*.tsx 里已经是题目粒度了：
// 一个 ConceptSection = 一道题，heading 是中文问题，lede 是「#编号 英文原题」。
// 缺的只是 UI 层没有「题目」这个实体。所以这里只做一次转换，
// answer 直接引用原来的 body（同一个 ReactNode 引用，不是拷贝）。
//
// 抄一份出来就会有两份真相，改了一边忘了另一边 —— 那是最难查的一类问题。
//
// 【只在服务端 import】
// 这个文件会拖进整棵内容树。客户端组件要题目清单请读 content/nav.ts。

import type { DrillQuestion, DrillTrack, Exam } from "./types";
import interview from "./exams/interview";

/** 按 lesson id 判方向。iv-basics 和 iv-backend 一个模块里混了多个方向，所以按课分 */
const TRACK_BY_LESSON: Record<string, DrillTrack> = {
  "iv-html": "html",
  "iv-css": "css",
  "iv-js-types": "js",
  "iv-js-fn": "js",
  "iv-js-this": "js",
  "iv-js-loop": "js",
  "iv-js-tooling": "js",
  "iv-react-what": "react",
  "iv-react-comp": "react",
  "iv-react-hook": "react",
  "iv-react-perf": "react",
  "iv-react-redux": "react",
  "iv-node": "node",
  "iv-sql": "db",
  "iv-web": "web",
  // TS 深度模块 —— DrillLab 自出（senior 补强），题没有题库编号
  "iv-ts-utility": "ts",
  "iv-ts-generics": "ts",
};

export const TRACK_LABEL: Record<DrillTrack, { zh: string; en: string }> = {
  html: { zh: "HTML", en: "HTML" },
  css: { zh: "CSS", en: "CSS" },
  js: { zh: "JavaScript", en: "JavaScript" },
  react: { zh: "React 与生态", en: "React & ecosystem" },
  node: { zh: "Node / Express", en: "Node / Express" },
  db: { zh: "数据库", en: "Databases" },
  web: { zh: "网络与安全", en: "Web & security" },
  ts: { zh: "TypeScript 深度", en: "TypeScript deep dive" },
};

export const TRACK_ORDER: DrillTrack[] = ["html", "css", "js", "react", "node", "db", "web", "ts"];

/**
 * 从 lede 里拆出题库编号和英文原题。
 *
 * 两种真实格式：
 *   "#313 How does the event loop work in Node.js"
 *   "#279 Type coercion vs Type conversion（题库里 #386 是同一题）"
 *
 * 所以：所有 #数字 都算编号（第二种有两个），
 * 英文原题取第一个编号之后、第一个全角括号之前的部分。
 */
export function parseLede(lede: string): { bank: number[]; en: string } {
  const bank = [...lede.matchAll(/#(\d+)/g)].map((m) => Number(m[1]));
  const afterFirst = lede.replace(/^#\d+\s*/, "");
  // 去掉「（题库里 #386 是同一题）」这类中文注记
  const en = afterFirst.split("（")[0].trim();
  return { bank, en };
}

function build(): DrillQuestion[] {
  const exam: Exam = interview;
  const out: DrillQuestion[] = [];

  for (const mod of exam.modules) {
    for (const lesson of mod.lessons) {
      const track = TRACK_BY_LESSON[lesson.id];
      // iv-coding 那 5 节是 coding 题讲解，不是问答题 —— 没有 track，跳过
      if (!track) continue;

      for (const c of lesson.concepts) {
        // q269… 来自真实题库；ts1… 是 DrillLab 自出的 TS 深度题（没有编号）
        const fromBank = /^q\d+$/.test(c.id);
        const isGenerated = /^ts\d+$/.test(c.id);
        if (!fromBank && !isGenerated) continue;
        const { bank, en } = isGenerated
          ? { bank: [], en: (c.lede ?? "").trim() }
          : parseLede(c.lede ?? "");
        out.push({
          id: c.id,
          bank,
          generated: isGenerated || undefined,
          zh: c.heading,
          en,
          track,
          answer: c.body,
          answerEn: c.bodyEn,
          code: c.code,
          lessonId: lesson.id,
          examId: exam.id,
        });
      }
    }
  }
  return out;
}

const DRILLS = build();

/* ---------- 断言：数量和编号覆盖必须对得上 ----------
   规格里写死了 99 道、编号覆盖 #269–#387。
   对不上就直接抛错，不许静默吞掉 —— 内容被误删或 lede 格式被改动时，
   这里是唯一能立刻发现的地方。 */

// 99 道来自真实题库（#269–#387）+ 6 道 DrillLab 自出的 TS 深度题（ts1–ts6）
const EXPECTED_TOTAL = 105;

/**
 * #269–#387 这个区间里，**不该出现在问答题库**的编号。分三类：
 *
 *   ① 题库本身就没有这个号：#341、#351、#379
 *   ② 和别的题合并了：#386 与 #279 是同一题（lede 里已注明）
 *   ③ 是 coding 题不是问答题：#363–#378
 *      它们在 content/exams/iv-coding.tsx 里，登记进 content/coding.ts，
 *      按规格「别混进题库」。
 *
 * 这份名单是白名单而不是「反正对不上就跳过」—— 以后内容被误删时，
 * 缺口会立刻变成构建失败，而不是静默少几道题。
 */
const CODING_BANK = Array.from({ length: 378 - 363 + 1 }, (_, i) => 363 + i);
const KNOWN_MISSING = new Set([341, 351, 379, 386, ...CODING_BANK]);

function assertIntegrity(list: DrillQuestion[]) {
  if (list.length !== EXPECTED_TOTAL) {
    throw new Error(
      `[drills] 题目数量不对：期望 ${EXPECTED_TOTAL} 道，实际 ${list.length} 道。` +
        `八股正文可能被误删，或 TRACK_BY_LESSON 少登记了一节课。`,
    );
  }

  const seen = new Set<number>();
  for (const q of list) {
    if (q.bank.length === 0 && !q.generated) {
      throw new Error(`[drills] ${q.id} 解析不出题库编号，检查它的 lede 是不是「#编号 英文原题」格式。`);
    }
    if (!q.en) {
      throw new Error(`[drills] ${q.id} 解析不出英文原题（lede 为空或只有编号）。`);
    }
    for (const n of q.bank) seen.add(n);
  }

  const missing: number[] = [];
  for (let n = 269; n <= 387; n++) {
    if (!seen.has(n) && !KNOWN_MISSING.has(n)) missing.push(n);
  }
  if (missing.length > 0) {
    throw new Error(`[drills] 题库编号有缺口：#${missing.join("、#")}`);
  }

  const dup = list.map((q) => q.id).filter((id, i, a) => a.indexOf(id) !== i);
  if (dup.length > 0) {
    throw new Error(`[drills] 题目 id 重复：${dup.join("、")}`);
  }
}

assertIntegrity(DRILLS);

/* ---------- 查询 ---------- */

export function allDrills(): DrillQuestion[] {
  return DRILLS;
}

export function drillById(id: string): DrillQuestion | undefined {
  return DRILLS.find((q) => q.id === id);
}

export function drillsByTrack(track: DrillTrack): DrillQuestion[] {
  return DRILLS.filter((q) => q.track === track);
}

/** 每个方向多少道 —— 列表页和抽认卡的范围选择用 */
export function drillTrackCounts(): { track: DrillTrack; count: number }[] {
  return TRACK_ORDER.map((track) => ({ track, count: drillsByTrack(track).length }));
}

/** 前后两题，单题页的翻页用 */
export function drillNeighbours(id: string): {
  prev?: DrillQuestion;
  next?: DrillQuestion;
  index: number;
  total: number;
} {
  const i = DRILLS.findIndex((q) => q.id === id);
  return {
    prev: i > 0 ? DRILLS[i - 1] : undefined,
    next: i >= 0 && i < DRILLS.length - 1 ? DRILLS[i + 1] : undefined,
    index: i + 1,
    total: DRILLS.length,
  };
}
