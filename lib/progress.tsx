"use client";

// 学习进度 —— localStorage，一个 Context 供全站共用。
//
// 存的都是「用户真的做过什么」，不做 XP、不做连续打卡、不做徽章：
//   lessons   读完并勾了「学完这节」的课        键 `${examId}/${lessonId}`
//   exercises 做对过的练习                     键 `${examId}/${exerciseId}`
//   rebuilds  完成过的从零重写                 键 `${examId}/${exerciseId}`
//   mocks     模拟考记录                       键 `${examId}/${mockId}`
//   last      最近学习位置（首页「继续」用）
//   drills    八股题的掌握状态                 键 = 题目 id（q269…）
//   arena     考场的尝试记录                   键 = 考场题 id，值是尝试数组
//   coding    coding 题完成标记                键 = coding 题 id
//
// 【版本后缀】key 是 drilllab-progress-v1，后缀留着但没升 v2 ——
// 新增字段一律在 load() 里给兜底默认值，所以缺字段的旧数据读出来是
// 「三段都空」而不是崩掉。只有当某个字段的**含义**变了、旧值会被误读时
// 才需要升 v2；单纯加字段不用。
//
// 展示时一律给「7 / 12」这种诚实数字，不换算成百分比进度条以外的东西。

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const KEY = "drilllab-progress-v1";

export interface MockRecord {
  attempted: true;
  /** 用户自评得分（模拟考按 rubric 自评） */
  score?: number;
  outOf?: number;
  at: number;
}

/** 八股题的自评掌握状态 */
export type DrillMark = "known" | "fuzzy" | "unknown";

export interface DrillRecord {
  mark: DrillMark;
  /** 最近一次自评时间 —— 复习调度用 */
  at: number;
  /** 一共自评过几次 */
  times: number;
}

/** 考场的一次尝试 */
export interface ArenaAttempt {
  startedAt: number;
  endedAt?: number;
  outcome: "passed" | "failed" | "gave-up" | "timeout";
  /** 逐条验收命令的自评结果 */
  checks: boolean[];
}

export interface ProgressData {
  lessons: Record<string, 1>;
  exercises: Record<string, 1>;
  rebuilds: Record<string, 1>;
  mocks: Record<string, MockRecord>;
  last?: { examId: string; lessonId: string; title: string; at: number };
  /** 八股题掌握状态，键是题目 id */
  drills: Record<string, DrillRecord>;
  /** 考场尝试记录，键是考场题 id */
  arena: Record<string, ArenaAttempt[]>;
  /**
   * 进行中的考场（开考时写，记录完成或放弃时删）—— 刷新后靠它恢复。
   *
   * submittedAt 是「按下交卷」那一刻。为什么要单独存：
   * 交卷只做导航，验收命令要在 review 页逐条勾完才写记录。
   * 如果 endedAt 用「按下记录」的时间，勾选那几十秒会被算进用时；
   * 更糟的是交完卷几小时后才回来自评，那条记录的用时会被拉得离谱。
   * 存进 localStorage 而不是内存，是为了让刷新 review 页也不丢。
   */
  arenaLive?: { id: string; startedAt: number; submittedAt?: number };
  /** coding 题完成标记 */
  coding: Record<string, 1>;
}

const EMPTY: ProgressData = {
  lessons: {},
  exercises: {},
  rebuilds: {},
  mocks: {},
  drills: {},
  arena: {},
  coding: {},
};

interface Ctx {
  ready: boolean;
  data: ProgressData;
  lessonDone: (examId: string, lessonId: string) => boolean;
  toggleLesson: (examId: string, lessonId: string) => void;
  exerciseDone: (examId: string, exerciseId: string) => boolean;
  markExercise: (examId: string, exerciseId: string) => void;
  rebuildDone: (examId: string, exerciseId: string) => boolean;
  markRebuild: (examId: string, exerciseId: string) => void;
  mockRecord: (examId: string, mockId: string) => MockRecord | undefined;
  markMock: (examId: string, mockId: string, score?: number, outOf?: number) => void;
  visit: (examId: string, lessonId: string, title: string) => void;
  countLessons: (examId: string) => number;
  countExercises: (examId: string) => number;

  /* ---- 八股题库 ---- */
  drillMark: (id: string) => DrillMark | undefined;
  setDrillMark: (id: string, mark: DrillMark) => void;
  clearDrillMark: (id: string) => void;
  drillCounts: () => Record<DrillMark | "untouched", number>;

  /* ---- 考场 ---- */
  arenaAttempts: (id: string) => ArenaAttempt[];
  arenaLive: () => { id: string; startedAt: number; submittedAt?: number } | undefined;
  startArena: (id: string) => void;
  /** 按下交卷 —— 只记时刻并保留 arenaLive，等 review 页勾完 checks 再写记录 */
  submitArena: (id: string) => void;
  finishArena: (
    id: string,
    outcome: ArenaAttempt["outcome"],
    checks: boolean[],
  ) => void;
  abandonArena: (id: string) => void;

  /* ---- coding 题 ---- */
  codingDone: (id: string) => boolean;
  toggleCoding: (id: string) => void;

  reset: () => void;
}

const ProgressCtx = createContext<Ctx>({
  ready: false,
  data: EMPTY,
  lessonDone: () => false,
  toggleLesson: () => {},
  exerciseDone: () => false,
  markExercise: () => {},
  rebuildDone: () => false,
  markRebuild: () => {},
  mockRecord: () => undefined,
  markMock: () => {},
  visit: () => {},
  countLessons: () => 0,
  countExercises: () => 0,
  drillMark: () => undefined,
  setDrillMark: () => {},
  clearDrillMark: () => {},
  drillCounts: () => ({ known: 0, fuzzy: 0, unknown: 0, untouched: 0 }),
  arenaAttempts: () => [],
  arenaLive: () => undefined,
  startArena: () => {},
  submitArena: () => {},
  finishArena: () => {},
  abandonArena: () => {},
  codingDone: () => false,
  toggleCoding: () => {},
  reset: () => {},
});

function load(): ProgressData {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<ProgressData>;
    return {
      lessons: p.lessons ?? {},
      exercises: p.exercises ?? {},
      rebuilds: p.rebuilds ?? {},
      mocks: p.mocks ?? {},
      last: p.last,
      // 这三个是后加的，老数据里没有 —— 兜底成空对象，进度不会丢
      drills: p.drills ?? {},
      arena: p.arena ?? {},
      arenaLive: p.arenaLive,
      coding: p.coding ?? {},
    };
  } catch {
    return EMPTY;
  }
}

const prefixCount = (bag: Record<string, unknown>, examId: string) =>
  Object.keys(bag).filter((k) => k.startsWith(examId + "/")).length;

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ProgressData>(EMPTY);
  const [ready, setReady] = useState(false);

  /**
   * 【为什么要这两个 ref，而不是直接用 state】
   * 这里修的是两个实测出来的真 bug，根子都在「写入时读的是渲染时那份 data」。
   *
   * ① 数据丢失（严重）。effect 的执行顺序是**子先父后** —— 硬加载课程页时，
   *    LessonVisit 的 mount effect 先跑，那时 Provider 还没从 localStorage
   *    读回数据，data 仍是 EMPTY。老写法直接 setItem(EMPTY + last)，
   *    把用户全部进度冲掉。实测（dev 与 next start 都复现）：
   *    造 3 课 / 5 练习 / 1 八股 / 1 coding，硬加载任一课程页 → 全部归零。
   *    → dataReady 守卫：还没读回来之前**一个字都不许写盘**。
   *
   * ② 同一 tick 内的连续写互相覆盖。老写法每次都 persist({ ...data })，
   *    三次调用拿到的是同一份 data，最后一个赢。实测：同 tick 点三张卡的
   *    标记按钮，localStorage 里只剩 1 条。
   *    → dataRef 是真相来源，每次写都基于「上一次写完的结果」，不是渲染快照。
   *
   * 顺带一提：这两条正是本站教的「过期闭包」和「effect 依赖」在真实代码里的样子。
   */
  const dataRef = useRef<ProgressData>(EMPTY);
  const dataReady = useRef(false);

  useEffect(() => {
    const loaded = load();
    dataRef.current = loaded;
    dataReady.current = true;
    setData(loaded);
    setReady(true);
  }, []);

  /**
   * 所有写入的唯一入口。收一个 (prev) => next 的函数 ——
   * prev 永远是最新那份，所以同一 tick 里连写多次也不会互相盖掉。
   */
  const update = useCallback((fn: (prev: ProgressData) => ProgressData) => {
    const next = fn(dataRef.current);
    dataRef.current = next;
    setData(next);
    // 还没从 localStorage 读回来 —— 只更新内存，不写盘。
    // 读回来之后 dataRef 会被 loaded 覆盖，这一笔就当没发生（调用方负责等 ready）。
    if (!dataReady.current) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* 写不进去（隐私模式 / 配额满）就只留内存态 */
    }
  }, []);

  const value = useMemo<Ctx>(() => {
    const k = (examId: string, id: string) => `${examId}/${id}`;

    return {
      ready,
      data,

      lessonDone: (examId, lessonId) => !!data.lessons[k(examId, lessonId)],

      toggleLesson: (examId, lessonId) => {
        const key = k(examId, lessonId);
        update((prev) => {
          const lessons = { ...prev.lessons };
          if (lessons[key]) delete lessons[key];
          else lessons[key] = 1;
          return { ...prev, lessons };
        });
      },

      exerciseDone: (examId, exerciseId) => !!data.exercises[k(examId, exerciseId)],

      markExercise: (examId, exerciseId) => {
        const key = k(examId, exerciseId);
        update((prev) =>
          prev.exercises[key]
            ? prev
            : { ...prev, exercises: { ...prev.exercises, [key]: 1 } },
        );
      },

      rebuildDone: (examId, exerciseId) => !!data.rebuilds[k(examId, exerciseId)],

      markRebuild: (examId, exerciseId) => {
        const key = k(examId, exerciseId);
        update((prev) => {
          const rebuilds = { ...prev.rebuilds };
          if (rebuilds[key]) delete rebuilds[key];
          else rebuilds[key] = 1;
          return { ...prev, rebuilds };
        });
      },

      mockRecord: (examId, mockId) => data.mocks[k(examId, mockId)],

      markMock: (examId, mockId, score, outOf) => {
        update((prev) => ({
          ...prev,
          mocks: {
            ...prev.mocks,
            [k(examId, mockId)]: { attempted: true, score, outOf, at: Date.now() },
          },
        }));
      },

      visit: (examId, lessonId, title) => {
        // 调用方（LessonVisit）会等到 ready 才调 —— 见那边的注释。
        // 这里再挡一道：还没读回来就写，会把用户的进度冲成空。
        if (!dataReady.current) return;
        update((prev) =>
          prev.last?.examId === examId && prev.last?.lessonId === lessonId
            ? prev
            : { ...prev, last: { examId, lessonId, title, at: Date.now() } },
        );
      },

      countLessons: (examId) => prefixCount(data.lessons, examId),
      countExercises: (examId) => prefixCount(data.exercises, examId),

      /* ---- 八股题库 ---- */

      drillMark: (id) => data.drills[id]?.mark,

      setDrillMark: (id, mark) => {
        update((prev) => ({
          ...prev,
          drills: {
            ...prev.drills,
            [id]: { mark, at: Date.now(), times: (prev.drills[id]?.times ?? 0) + 1 },
          },
        }));
      },

      clearDrillMark: (id) => {
        update((prev) => {
          const drills = { ...prev.drills };
          delete drills[id];
          return { ...prev, drills };
        });
      },

      drillCounts: () => {
        const out = { known: 0, fuzzy: 0, unknown: 0, untouched: 0 };
        for (const r of Object.values(data.drills)) out[r.mark]++;
        return out;
      },

      /* ---- 考场 ---- */

      arenaAttempts: (id) => data.arena[id] ?? [],

      arenaLive: () => data.arenaLive,

      startArena: (id) => {
        // 计时基准存时间戳，不用 setInterval 累加 ——
        // 切到后台标签页时定时器会被节流，累加法会漂。
        update((prev) => ({ ...prev, arenaLive: { id, startedAt: Date.now() } }));
      },

      submitArena: (id) => {
        update((prev) => {
          const live = prev.arenaLive;
          if (!live || live.id !== id || live.submittedAt) return prev;
          return { ...prev, arenaLive: { ...live, submittedAt: Date.now() } };
        });
      },

      finishArena: (id, outcome, checks) => {
        update((prev) => {
          const live = prev.arenaLive?.id === id ? prev.arenaLive : undefined;
          const attempt: ArenaAttempt = {
            startedAt: live?.startedAt ?? Date.now(),
            // 交卷时刻优先 —— 勾选验收命令花的时间不算进用时
            endedAt: live?.submittedAt ?? Date.now(),
            outcome,
            checks,
          };
          const next = {
            ...prev,
            arena: { ...prev.arena, [id]: [...(prev.arena[id] ?? []), attempt] },
          };
          delete next.arenaLive;
          return next;
        });
      },

      abandonArena: (id) => {
        update((prev) => {
          const live = prev.arenaLive?.id === id ? prev.arenaLive : undefined;
          const attempt: ArenaAttempt = {
            startedAt: live?.startedAt ?? Date.now(),
            endedAt: Date.now(),
            outcome: "gave-up",
            checks: [],
          };
          const next = {
            ...prev,
            arena: { ...prev.arena, [id]: [...(prev.arena[id] ?? []), attempt] },
          };
          delete next.arenaLive;
          return next;
        });
      },

      /* ---- coding 题 ---- */

      codingDone: (id) => !!data.coding[id],

      toggleCoding: (id) => {
        update((prev) => {
          const coding = { ...prev.coding };
          if (coding[id]) delete coding[id];
          else coding[id] = 1;
          return { ...prev, coding };
        });
      },

      reset: () => update(() => EMPTY),
    };
  }, [data, ready, update]);

  return <ProgressCtx.Provider value={value}>{children}</ProgressCtx.Provider>;
}

export const useProgress = () => useContext(ProgressCtx);
