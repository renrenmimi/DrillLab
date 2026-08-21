"use client";

// 语言（English / 中文）—— **默认英文**，选择存 localStorage。
//
// 【为什么默认英文】
// 另外七个同系列的 app 都是英文默认。这个 app 最初只有中文，所以默认是中文；
// 正文、代码注释、练习都补完英文之后，继续默认中文就等于让英文读者
// 每次进来都要先点一下开关。
//
// 【为什么不用 /en/... 这种路由前缀，也不用 cookie】
// 课程正文是在服务端渲染的（见 README 里那段 784 KB 的教训）。
// 如果语言是客户端状态，服务端就不知道该渲染哪一版；如果做成路由前缀，
// 82 个静态页要变成 164 个，而且每次切换都要走一次导航。
//
// 所以用和 data-theme 完全一样的套路：
//   · 两种语言**同时渲染**进 HTML，各自包一层 data-lang
//   · CSS 按 html[lang] 把另一边 display: none 掉
//   · 切换只改 <html lang>，零延迟、零请求、不用 JS 重渲染
//
// 代价是 HTML 里带了两份文字。文字 gzip 压得很好，而且这是 HTML 不是 JS ——
// 比把两份内容打进客户端 chunk 便宜得多。
//
// 附带的两个好处：完全没有 hydration 不一致的风险（服务端和客户端渲染的
// 是同一棵树），以及没开 JS 也能读（默认那一版）。

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "zh" | "en";

const KEY = "drilllab-locale";

/** <html lang> 的实际取值 */
export const HTML_LANG: Record<Locale, string> = { zh: "zh-CN", en: "en" };

interface Ctx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggle: () => void;
}

const Ctx = createContext<Ctx>({
  locale: "en",
  setLocale: () => {},
  toggle: () => {},
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  // 初始值必须和服务端一致（en），挂载后再从 <html lang> 读回真实值。
  // 注意：正文靠 CSS 切换，所以这里读晚一点也不会闪 —— 页面上的文字
  // 早就由 bootstrap 脚本设好的 lang 决定了。
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const attr = document.documentElement.getAttribute("lang");
    if (attr && attr.startsWith("zh")) setLocaleState("zh");
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.documentElement.setAttribute("lang", HTML_LANG[next]);
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      /* 隐私模式写不进去：只影响持久化，不影响本次会话 */
    }
  }, []);

  const toggle = useCallback(() => {
    setLocaleState((prev) => {
      const next: Locale = prev === "zh" ? "en" : "zh";
      document.documentElement.setAttribute("lang", HTML_LANG[next]);
      try {
        window.localStorage.setItem(KEY, next);
      } catch {
        /* 同上 */
      }
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ locale, setLocale, toggle }}>{children}</Ctx.Provider>;
}

export const useLocale = () => useContext(Ctx);

/**
 * 给**属性**用的双语取值：`aria-label` / `title` / `placeholder` 只能收字符串，
 * 塞不进 `<T>`（那是两份 JSX，靠 CSS 藏一份）。
 *
 * 只在客户端组件里能用。服务端组件里的属性没法按语言切 ——
 * 那种情况就把两种语言拼在一起（例如 `aria-label="复制 / Copy"`），
 * 屏幕阅读器读两遍好过读错一遍。
 */
export function useT() {
  const { locale } = useLocale();
  return (zh: string, en: string) => (locale === "en" ? en : zh);
}

/** 注入到 <head>，在 React 接管前就把 <html lang> 定下来 */
export const LOCALE_BOOTSTRAP = `(function(){try{var l=localStorage.getItem("${KEY}");document.documentElement.setAttribute("lang",l==="zh"?"zh-CN":"en");}catch(e){document.documentElement.setAttribute("lang","en");}})();`;
