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
    default: "DrillLab · 把 Online Assessment 练到能独立完成 / Train for your online assessment",
    template: "%s · DrillLab",
  },
  description:
    "一个多考试的前端训练平台：105 道面试八股、25 道 coding 题（21 道能在浏览器里跑测试）、三个参考项目的逐题拆解、模拟考与计时考场。从 npm 讲起，练到能在空文件夹里独立写出来。 / A multi-exam front-end training app: 105 interview questions, 25 coding problems (21 runnable in the browser), three reference projects taken apart task by task, mock papers and a timed arena.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" data-theme="light" suppressHydrationWarning>
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
