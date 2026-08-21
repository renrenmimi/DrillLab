"use client";

// 主题（浅色 / 深色）—— 没选过就跟随系统，选过就记住。
// 首屏闪烁由 layout.tsx 里那段 beforeInteractive 脚本消掉。
//
// 【为什么不是「默认浅色」】老版本无视 prefers-color-scheme，
// 系统开着深色的人打开这个站会被一整屏米白闪一下。
// 现在：localStorage 里有值就用它（用户的明确选择优先），
// 没有就问系统。用户点过切换之后才写 localStorage，所以
// 「从没点过」和「点回了浅色」是两种状态，不会混。

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
  theme: "light",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "dark" || attr === "light") setTheme(attr);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "light" ? "dark" : "light";
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
export const THEME_BOOTSTRAP = `(function(){var t;try{t=localStorage.getItem("${KEY}");}catch(e){}if(t!=="dark"&&t!=="light"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);document.documentElement.style.colorScheme=t;})();`;
