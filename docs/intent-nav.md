# IA 第四轮 · 意图优先的导航

前三轮的记录在 [ia-audit-round3.md](ia-audit-round3.md)。那三轮修的是
「首页第一屏该放什么」和「四条主线怎么解释」，这一轮修的是更上一层的东西。

## 一、上一版错在哪

上一版的分工是「顶栏 = 品牌 / 首页 / 使用说明，侧栏 = 全部内容结构，常驻」。
侧栏里同时挂着：完整课程树（5 门课、27 个模块、80 节）、平行支线、
四张全量表、速查、以及清空进度。

它确实解决了上上一版「不知道该点左边还是点上边」，但换来一个更根本的毛病：

> **要先读懂这个站的内容模型，才能决定点哪儿。**

而这个产品有五种都成立的用法：

1. 跟着课程从地基往下走
2. 用抽认卡背面试知识点
3. 按题目 / 技术点找练习
4. 进计时考场或模拟考
5. 只在卡住时回来查课文

第 1 种是侧栏的形状，其余四种都得先穿过课程结构。一个刚来的人不知道从哪开始；
一个只想复习 React 的人得先在课程树里找到 React 那一门，再想办法拐到八股。

## 二、这一版的分工

导航拆成两个问题，分给两个控件：

```
顶栏  我现在想做哪一类事？            → 四个模式
侧栏  在这件事里我在哪、下一步是什么？  → 四个随模式而变的侧栏
```

四个模式（[lib/modes.ts](../lib/modes.ts)）：

| 模式 | 落地路由 | 拥有的路由 |
| --- | --- | --- |
| 学课程 Learn | `/path` | `/path`、`/exams/**` |
| 背知识点 Review | `/drill` | `/drill/**` |
| 做练习 Practice | `/practice` | `/practice`、`/code/**` |
| 模拟考试 Assess | `/arena` | `/arena/**`、`/mock/**` |

`/`、`/guide`、`/reference` 不属于任何模式，因此**没有侧栏**（`shell[data-nav="off"]`）。
首页本身就是那张仪表盘，旁边不需要再摆一份导航。

「使用说明」没有删，它退到顶栏右边那个 `?` 菜单里 —— 它是第一次来才需要的，
不该占着四个一级位置里的一个。

四档难度（说得出 / 认得出 / 写得对 / 空手做）也没有删，
它仍然是 [components/ladder.tsx](../components/ladder.tsx) 那套解释，
只是不再自己充当一级导航：它现在分布在 Review / Practice / Assess 三个模式里。
Ladder 的标题行明写了这一句，免得同一个地方又有两个名字。

## 三、四个侧栏，互不混装

| 模式 | 侧栏里有什么 | 侧栏里**不许**有什么 |
| --- | --- | --- |
| Learn | 一个 Resume + 全局 `6 / 80` + 课程路线图（当前那门展开、当前节高亮、每门 `完成/总数`、下一节还没读的那一节） | 四张全量表的入口 |
| Review | 一个「开始一轮抽认卡」+ 今天/要复习/已掌握 + 八个方向 + 三档掌握状态 | 完整课程树 |
| Practice | 两个子模式（课内练习 / Coding），**只摊开当前那一档**的筛选项 | 另一档的筛选项 |
| Assess | 一个 Resume/Start + 按科目分组的考场题（每条带准备状态）+ 模拟考 | 课程、八股、整张 Coding 表 |

## 四、几个实现上的坑

### 侧栏不能读 query string

侧栏在根 layout 里，是客户端组件。在那儿调 `useSearchParams()`，
252 个静态预渲染页面全部构建失败
（`useSearchParams() should be wrapped in a suspense boundary`）。
用 `<Suspense>` 包能过，但 hydration 时整块侧栏会被卸载重挂，
`<details>` 的展开状态和焦点都会丢。

正确做法：**列表页本来就知道自己筛了什么**（它是服务端组件，query 是它的入参），
所以由它渲染一个 `<NoteRecent>` 小岛，把完整 href 写进进度；侧栏只读进度。
见 [components/recent.tsx](../components/recent.tsx)。

顺带这条记录就是顶栏那颗「继续」的数据来源，一份数据两个用处。

### 四个模式只渲染一份 DOM

窄屏（≤900px）靠 `grid-template-areas` 把 `.topbar-nav` 整块挪到顶栏第二行，
不是另渲染一份 —— 渲染两份会在无障碍树里留下两个同名的导航地标。

`--topbar-h` 在同一条 media query 里从 56px 改成 92px。侧栏 sticky 偏移、
抽屉起点、遮罩 inset、锚点 `scroll-padding-top` 全都读这个变量，所以改一处全跟着走。
（`styles/nav.css` 必须排在 `shell.css` 之后，同优先级靠源码顺序决定胜负。）

### 「接着学」只能有一份来源

`/path` 页顶那条和 Learn 侧栏那颗按钮同屏出现。各算一份实测就打架：
一个说「Node.js、npm 和 lockfile」（地基第一节），
另一个说「两个考试项目的目录结构」（第一节没读完的）。
两处现在都用 `useLearnTarget()`（[components/continue.tsx](../components/continue.tsx)）。

### 同一个控件不在一屏里出现两遍

侧栏接过筛选之后，页面里那几排 chip 收进了 `<details>`（有筛选生效时服务端算出 `open`）。
**不能直接删** —— 窄屏侧栏在抽屉后面，删了就得先开抽屉才能筛。

右栏里真正重复的三块删掉了：`/drill` 的「抽认卡 / 按方向」、
`/code` 的「按方向」、`/practice` 的「练习类型」。
留下的都是侧栏装不下、也不该装的东西（题目来源、为什么有的跑不了、你做对过多少）。

### 不要用 opacity 压暗文字

这一轮把对比度扫描脚本改成会把元素及其祖先的 `opacity` 一起算进 alpha 合成，
立刻扫出两处一直不达标的地方：

- `.crumb-sep { opacity: .75 }` 把 `--ink-3` 从 5.06:1 压到 **3.1:1**；
- `/path` 的 `.road-body { opacity: .62 / .78 }` 把 12px 的 `.road-count` 压到 **3.27:1**。

透明度会绕过所有「按颜色变量算对比度」的检查，所以这种不达标最难发现。
两处都改成换一档颜色变量。

## 五、进度：只加一个字段，一条都不丢

`ProgressData` 新增 `recent = { mode?, byMode }`，键是 `ModeId`，值是
`{ href, title, titleEn?, sub?, subEn?, at }`。localStorage 的键仍然是
`drilllab-progress-v1`，没有升 v2 —— 只是加字段，`load()` 里给了兜底。

- 顶栏「继续」取 `mostRecent()`（跨模式按 `at` 挑最新）；
- 侧栏高亮和 Resume 取 `recentOf(mode)`；
- 老数据没有这个字段时，`mostRecent()` 回落到一直都在的 `last`。

实测：造一份不含 `recent` 的老数据（3 节课 / 2 个练习 / 1 道八股 / 1 套模拟考 /
1 次考场尝试 / 1 道 coding），打开首页五类进度一条不丢；再访问一节新课触发写盘，
`lessons` / `mocks` / `arena` / `coding` 仍然一条不丢，`recent` 和 `last` 同时更新。

## 六、验证结果

```
npm run typecheck      通过
npm run lint           0 warning / 0 error
npm run build          252 个页面预渲染成功
```

三个回归扫描（playwright-core 驱动本机 Chrome，不往项目里装依赖）：

| 扫描 | 结果 |
| --- | --- |
| 类名覆盖（组件用到的 vs CSS 定义的） | 用到 535 个，定义 568 个，差集 **0** |
| WCAG AA 对比度（24 页 × {1440, 1024, 390} × {浅, 深} × {中, 英}） | 不达标元素 **0** |
| 390px 横向溢出 | 溢出的页面 **0** |
| 控制台报错 / hydration 警告 | **0** |

六条流程 + 键盘 / 抽屉 / 老数据兼容，共 **112 条断言全过**：

1. 第一次来 → 从地基第一节开始
2. 回头客 → 继续上次那一节
3. 有基础 → 不进课程直接复习 React 八股
4. 找一道浏览器里能跑的 coding 题
5. 回到一场还在计时的考试
6. 390px：换模式 + 在抽屉里导航

首屏 JS 的代价（和 `main` 逐路由对比，两边都跑 `next build`）：

| 路由 | before | after |
| --- | --- | --- |
| `/` | 143 kB | 147 kB |
| 课程页 | 140 kB | 142 kB |
| `/code/[id]` | 120 kB | **121 kB**（Sandpack 仍然没进首屏） |
| `/drill` | 147 kB | 148 kB |
| `/path` | 141 kB | 145 kB |
| `/practice` | 172 kB | 173 kB |

最大 +4 kB。同时删掉了 868 行死 CSS（老侧栏的 `.side-*`、老首页的
`.hero-*` / `.tier-*` / `.start-*`、老课尾的 `.foot-back*` / `.foot-next*`）。

截图在 [ia-nav/](ia-nav/)，同一份进度数据下的 before / after 各 12 张。
