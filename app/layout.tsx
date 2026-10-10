import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { ProgressProvider } from "@/lib/progress";
import { LOCALE_BOOTSTRAP, LocaleProvider } from "@/lib/locale";
import { THEME_BOOTSTRAP, ThemeProvider } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  // 【为什么标题是中英并排的】
  // <title> 和 <meta description> 是服务端渲染的，而语言是客户端状态
  // （见 lib/locale.tsx：两份文字都进 HTML，CSS 藏一份）。所以标题切不了语言。
  // 并排写比只写一种好：两种语言的用户在标签页和搜索结果里都认得出。
  title: {
    default: "DrillLab · 练到能独立写出来 / Practising until you can do it alone",
    template: "%s · DrillLab",
  },
  description:
    "一个自学用的刷题 App：四条主线，每一条给你的脚手架比上一条少 —— 105 道问答、148 个课内练习、25 道 coding 题（21 道能在浏览器里跑测试），最后是一个空文件夹加一个计时器。覆盖 React、TypeScript、GraphQL Federation 与 Spring Boot，从 npm 讲起。 / A study app with four tracks, each handing you less than the last: 105 questions, 148 in-lesson exercises, 25 coding problems (21 runnable in the browser), and finally an empty folder with a clock. Covers React, TypeScript, GraphQL Federation and Spring Boot, starting from npm.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        {/* 在 React 接管前定好主题和语言，避免首屏闪一下。
            【为什么放在 body 最前面，而不是 <head> 里】这两段是 React 要逐个对齐的普通节点。
            放在 <head> 里时，hydration 得一路走过 head 的子节点 —— 而 webpack 在 chunk 加载完时
            会把它接管的那个 <script> 从 head 里删掉。线上（网络慢一点，chunk 晚到）hydration
            走到一半 head 被改，游标落在 head 的 <meta> 上去对 div.shell，于是 #418、整页重渲染，
            冷加载约 11% 出一次（审查 A16）。放在 body 开头照样在任何内容画出来之前执行。 */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <script dangerouslySetInnerHTML={{ __html: LOCALE_BOOTSTRAP }} />
        <ThemeProvider>
          <LocaleProvider>
            <ProgressProvider>
              <AppShell>{children}</AppShell>
            </ProgressProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
