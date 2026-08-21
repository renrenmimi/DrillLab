"use client";

// 右侧目录的 scroll-spy：观察一组锚点元素，返回「当前在看哪一段」的 id。
//
// 做法：IntersectionObserver 只负责记录每个段落的可见状态，
// 真正的判断是「视口上方最近的那个段落」—— 这比「第一个可见的元素」更符合直觉，
// 因为长段落滚过一半时，用户心里还在那一段。

import { useEffect, useMemo, useState } from "react";

export function useActiveHeading(ids: string[]): string | undefined {
  const [active, setActive] = useState<string | undefined>(ids[0]);
  // 调用方每次渲染都会传一个新数组，用内容当依赖，避免 effect 反复重建
  const key = ids.join("|");
  const stable = useMemo(() => key.split("|").filter(Boolean), [key]);

  useEffect(() => {
    const ids = stable;
    if (ids.length === 0) return;

    const pick = () => {
      // 顶栏高度 + 一点余量，作为「已经看过」的判定线
      const line = 120;
      let current: string | undefined;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) current = id;
      }
      // 还没滚过第一段时，高亮第一段
      setActive(current ?? ids[0]);
    };

    pick();

    // 不要用 requestAnimationFrame 做节流：标签页在后台或渲染被暂停时
    // rAF 回调不会执行，节流标志就永远解不开，滚动高亮会整个卡死。
    // pick() 本身只读几个 getBoundingClientRect，浏览器自己会合并滚动事件。
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick);
    return () => {
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
    };
  }, [stable]);

  return active;
}
