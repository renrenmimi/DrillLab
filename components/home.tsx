"use client";

// 首页 —— **一张仪表盘，不问任何问题。**
//
// 【为什么删掉了那个「你想为什么做好准备？」】
// 那一屏问的是一个长期承诺（三个答案分别是 42 / 15 / 若干小时），
// 而一个人今天打开这个站最常见的念头是「我有二十分钟，让我刷点八股」——
// 那个意图在那一屏上一个入口都没有。
//
// 而且它是一扇**单向门**：选中之后 `plan` 永远有值，那一屏再也回不来，
// 点 logo、点「今天」、手输 `/` 全都回不去。那个三选一现在搬到了 `/plans`，
// 随时点得到。
//
// 现在首页三段，从上到下：
//   ① 一行「接着上次」（跟着计划时它就是计划的下一格）
//   ② 五门课的进度盘 —— 你在每条上走到哪、点一下接着上回那一节
//   ③ 「只想单练某一类」：八股 / 练习 / Coding / 考场 / 模拟考的计数
// 再往下是 HomeLibrary（按技术点进去、你的进度、其他），懒加载。
//
// 参照的是同一套壳的另外几个 app（DataData / AlgoAlgo / APIer / RedisVisual /
// AgentLab）：它们的首页就是章节表，从来不问你打算学多久。

import dynamic from "next/dynamic";
import { ContinueStripLine } from "./continue";
import { HomeTracks } from "./home-tracks";
import { T } from "./t";

/* 第一屏以下的内容。它要读 content/nav（92 KB 原始字节）才能写出
   「5 门课 · 80 节」这类计数，而上面三段一个字节都用不上 ——
   所以走 next/dynamic，进一个异步 chunk。 */
const HomeLibrary = dynamic(() => import("./home-library").then((m) => m.HomeLibrary), {
  ssr: false,
});

export function Home() {
  return (
    <main className="main" data-rail="off">
      <div className="content ui-page dash">
        <div className="ui-head home-head">
          <div className="ui-eyebrow">
            <T zh="今天" en="Today" />
          </div>
          <h1 className="ui-h1">
            <T zh="接着上次那一节" en="Pick up where you left off" />
          </h1>
        </div>

        {/* 一行，不是一张大卡。跟着计划时它就是计划的下一格。 */}
        <ContinueStripLine />

        <HomeTracks />

        {/* 第一屏以下的全部内容。懒加载 —— 见上面那段注释。 */}
        <HomeLibrary />
      </div>
    </main>
  );
}
