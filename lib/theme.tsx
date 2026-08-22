"use client";

// 主题（深色 / 浅色）—— 没选过就是深色，选过就记住。
// 首屏闪烁由 layout.tsx 里那段 beforeInteractive 脚本消掉。
//
// 【UI v2 为什么默认深色，而不是跟随系统】
// 这一版的界面方向就是深色高对比（见 docs/ui-v2.md）：柠檬绿强调色、
// 四层深表面、代码块比页面底再深一档。浅色主题是它的高对比对偶，
// 两套都过 WCAG AA，但**深色才是这个产品长的样子**。
//
// 跟随系统听起来更周到，实际后果是：一半的人第一次看到的不是设计好的那一版。
// 而这个站的主要场景是长时间读代码和做题，深色本来就是更常见的选择。
// 用户点过切换之后写 localStorage，那一份永远优先。

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

const KEY = "drilllab-theme";

const Ctx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "dark" || attr === "light") setTheme(attr);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      // 原生控件（滚动条、输入框、date picker）跟着走 —— 只写 CSS 变量它们不认
      document.documentElement.style.colorScheme = next;
      try {
        window.localStorage.setItem(KEY, next);
      } catch {
        /* 隐私模式写入失败：只影响持久化，不影响本次会话 */
      }
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);

/** 注入到 <head>，在 React 接管前就把 data-theme 定下来 */
export const THEME_BOOTSTRAP = `(function(){var t;try{t=localStorage.getItem("${KEY}");}catch(e){}if(t!=="dark"&&t!=="light"){t="dark";}document.documentElement.setAttribute("data-theme",t);document.documentElement.style.colorScheme=t;})();`;
