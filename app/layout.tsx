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
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        {/* 在 React 接管前定好主题和语言，避免首屏闪一下 */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <script dangerouslySetInnerHTML={{ __html: LOCALE_BOOTSTRAP }} />
      </head>
      <body>
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
