"use client";

// 侧栏里「下一步」的**唯一一份**。
//
// 【为什么要这么一个中转】
// 侧栏上下叠着两块东西：上面是引导计划的面板（components/plan-kit.tsx 的
// PlanPanel），下面是当前模式的上下文侧栏（components/sidebars.tsx）。
// Learn 那一档侧栏自己有一颗「接着学」的大按钮。跟着计划走的时候，
// 这两处十有八九指向**同一节课** —— 于是同一屏上出现两张一模一样的实心大卡，
// 都写着「往这儿走」。两个入口指同一个地方，那就是没有入口。
//
// 计划面板算得出「下一格是什么」，但它是懒加载的（只有真的在跟计划的人才
// 下载那一套，见 components/plan-slots.tsx）；侧栏是每个路由都渲染的，
// 不能顺着 plan-kit 把 85 KB 的计划清单拖进首屏。
// 所以反过来：**面板算完之后把结果登记在这里，侧栏只读结果。**
//
// 这个文件不许 import 任何内容模块或计划模块 —— 它就是一个 useState。

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface PlanSignal {
  /**
   * 计划那一套加载完了没有。
   *
   * 三态是必须的：`loaded: false` 时侧栏**先不画**自己的大按钮 ——
   * 否则会先画一张、面板一到再撤掉，闪一下。
   * `loaded: true` 而 `nextHref` 为空，意思是「计划已经走完」，
   * 那时侧栏的「接着学」重新变成唯一的出口，照常画。
   */
  loaded: boolean;
  nextHref?: string;
}

const IDLE: PlanSignal = { loaded: false };

const ReadCtx = createContext<PlanSignal>(IDLE);
const WriteCtx = createContext<(s: PlanSignal) => void>(() => {});

export function PlanSignalProvider({ children }: { children: ReactNode }) {
  const [signal, setSignal] = useState<PlanSignal>(IDLE);
  // setState 的引用本来就是稳定的，但包一层免得下游把它放进依赖数组时出错
  const write = useMemo(() => (s: PlanSignal) => setSignal(s), []);
  return (
    <WriteCtx.Provider value={write}>
      <ReadCtx.Provider value={signal}>{children}</ReadCtx.Provider>
    </WriteCtx.Provider>
  );
}

export const usePlanSignal = () => useContext(ReadCtx);

/** 计划面板算完之后登记结果。没在跟计划的人根本不会挂载这个 hook */
export function usePublishPlanNext(nextHref: string | undefined) {
  const write = useContext(WriteCtx);
  useEffect(() => {
    write({ loaded: true, nextHref });
  }, [write, nextHref]);
}
