# CLAUDE.md — DrillLab

新会话先读完这份文件再动手。产品说明见 [README.md](README.md)。

## 这是什么

一个**刷题 App**。进这个站有两条路，互补，不是替代：

```
引导计划   「告诉我下一步做什么」   /plans   六条按目标走的有序路径
资料库     「让我自己挑」          侧栏     学课程 / 背知识点 / 做练习 / 检验
```

材料分成四条主线，**导航整套在左侧栏里**（见 [lib/side-nav.ts](lib/side-nav.ts)
和 [docs/ui-v2.md](docs/ui-v2.md)）：

```
侧栏那一项           路由                     材料
学课程   Learn      /path  /exams/**         5 门课、80 节课文
背知识点 Review     /drill                   105 道问答，题库模式 + 抽认卡
做练习   Practice   /practice  /code         148 个课内练习 + 25 道 Coding（21 道浏览器里能跑）
考场     Arena      /arena                   7 道计时题；**故意不给运行环境**
模拟考   Mock       /mock                    2 套模拟考的自评
```

`lib/modes.ts` 那四个「模式」仍然存在，但它现在只用来**判断当前路由属于哪一类**
（页内的位置条、侧栏下半段渲染哪一套结构、进度里 `recent` 按模式各存一条）。
它不再是一级导航控件 —— 顶栏上一个导航链接都没有。

**侧栏每一页都有**，导航位在所有页面完全一致；只有分隔线以下那一段随页面变。

六条引导计划见 [content/plans.ts](content/plans.ts) 和
[docs/guided-plans.md](docs/guided-plans.md)：从零完整学习 / React 考试 /
GraphQL Federation 考试 / Spring Boot 控制器 / 前端面试复习 / Cab Booking。
它们**只写引用**，一个字的内容都不存 —— 标题、时长、题面全部从
`content/nav.ts` 现取；完成度全部从已有进度推导，不新开一套。

四档难度（说得出 / 认得出 / 写得对 / 空手做）没有删，它仍然是
[components/ladder.tsx](components/ladder.tsx) 那一套解释，只是不再自己充当
一级导航：它现在分布在 Review / Practice / Assess 三个模式里。

**课文一行不删。** 它是资产（`content/exams/**` 约 3.8 万行，全部本机实测过），
只是从主入口降级成归档：题目详情页里「展开讲解」通过 id 引用对应的
`ConceptSection` / `Lesson`，不复制粘贴。

题目层全部**从现有内容派生**（`content/drills.ts` / `coding.ts` / `arena.ts`），
不另存一份 —— 抄一份出来就有两份真相，改了一边忘了另一边最难查。
每张表都有断言：数量对不上、编号有缺口、来源练习找不到，**直接构建失败**。

三个参考项目是 `/code` 和 `/arena` 里大题的落地形态：
`react-notes-app`（React + hooks 的增删改查）、
`graphql-federation-practice`（Apollo Federation + Node subgraph + Spring Boot 服务）、
`cab-booking-context`（用 Context 管全局状态的一个小应用）。
三者的完整文件都快照在 `content/source-files.ts` 里，题目详情页按路径引用，
不在课文里重复粘贴。改动参考项目后跑 `npm run gen:src` 重新快照。

目标受众下限：**刚开始接触 npm、React、GraphQL 的人**。所以：

- 从「`npm install` 做了什么」讲起，不假设任何前置知识；
- 每个术语第一次出现时解释，中英双写（如「实体（entity）」）；
- 每个结论都要给「为什么」，不许只给结论；
- 一节课一次只引入一个核心概念。

最终验收不是「看懂答案」，而是**在空文件夹里、没有答案的情况下写出来**。
所以每门考试都有「从零重写」和一套换了场景的模拟考。

## 内容真实性（最重要的规矩）

1. **优先用两个源项目里的真实代码。** 引用时必须填 `sourceFile`。
2. **三档可信度**（`content/helpers.tsx`）：
   - `real()` + `sourceFile` → 页面显示「源项目」（原样来自真实文件）
   - `real()` 无 sourceFile、或 `tested()` → 「已跑通」（本机真实跑过并通过测试）
   - `demo()` → 「示意」（教学示意 / 故意写错的反例 / 没跑过的片段）
   - **不许拿没跑过的东西标前两档。**
3. **DrillLab 自出的题**（模拟考、自写测试）必须带 `generated: true`
   或在 UI 上标注「DrillLab 自出」。
4. **不要编造 assessment 要求**，不要改动原题语义。
5. **绝不修改四个源项目。** 需要验证时复制到 scratchpad 再改。
   `graphql-federation-practice/node-subgraph/package-lock.json`
   是审计时 `npm install` 生成的（原本缺失，不装就跑不了测试），
   这是唯一的例外，且不涉及任何源文件。

## 已实测的事实基准（引用这些数字时不要改）

| 对象 | 结果 |
| --- | --- |
| react-notes-app `npx vitest run` | 4 / 4 通过（磁盘上已是完成版，TODO 都填好了） |
| react-notes-app `npm test` | ❌ `Missing script: "test"` —— 这个项目没有 test script |
| react-notes-app `npx tsc --noEmit` | ❌ 10 个错误，全在 `NoteManager.test.tsx`（缺 vitest 全局类型）→ 所以 `npm run build` 原生失败 |
| react-notes-app `npm run q2` | ✅ 并发从未超 2、顺序与输入一致、task 3 为 `rejected` |
| node-subgraph 基线 | 6 failed / 4 passed（4 个通过里 **3 个是「空实现恰好满足断言」的假通过**） |
| node-subgraph 参考解法 | 10 / 10；`_service` SDL 与 `_entities` 进程内验证通过 |
| java-service 基线 | 5 run / 2 failures —— **六个端点全 `return null` 也过了 3 个** |
| java-service 参考解法 | 5 / 5，BUILD SUCCESS |
| React 模拟考 | starter 基线 **5 failed / 5 total**（RTL 报 `Unable to find an element by: [data-testid="ticket-subject"]`）；参考解法 5 / 5 |
| Federation 模拟考参考解法 | 14 / 14（starter 基线 10 failed / 4 passed） |
| 五道变式题参考解法（`react-part5`，DrillLab 自出） | 36 / 36；删掉 `clearInterval` 后 4 failed / 4 passed（`00:04` 实收 `00:10`）；删掉 Context 的 `useMemo` 后 1 failed / 7 passed（功能测试全绿） |
| 面试八股补的 7 道 coding 题（`iv-coding`） | 其中 6 道共用一个测试文件：24 / 24；第 7 道（Redux Toolkit）单独一个项目：见下一行 |
| Redux Toolkit 版 Todo | 8 / 8（要单独装 `@reduxjs/toolkit`，不能复用 react-notes-app 的 node_modules） |
| `/code` 浏览器沙箱 21 / 25 道 | 每道都验两头（起始态必须红、参考实现必须绿）：kanban 3F1P→4P、run-tasks 6F→6P、comment-tree 8F→8P、tabs 9F→9P、todo-list 8F→8P、theme-context **6F2P**→8P、star-rating 9F→9P、use-local-storage **4F3P**→7P、dropdown 7F1P→8P、timer 4F3P→7P、rtk-todo **9F1P**→10P、cab-booking-app **9F1P**→10P、notes-manager 8F→8P、手写题 8 道（debounce 3F1P→4P、throttle 2F2P→4P、deepClone 5F1P→6P、flatten 4F2P→6P、curry 3F→3P、promise-all 5F1P→6P、event-emitter 6F→6P、lru 5F→5P）——起始态是「半成品恰好满足断言」的假通过，故意留着 |
| Sandpack 沙箱跑不通的两道 | fetch-user 与 player。要 stub `fetch` / `HTMLMediaElement.prototype` 才能测，而**测试文件里的猴子补丁拦不到这两个** （`JSON.parse`、`globalThis`+`window` 上的 `setInterval`、`document.addEventListener` 能拦到；`Storage.prototype`、任何 handle 上的 `fetch`、媒体元素原型拦不到）。两道在 scratchpad 用 vitest 都跑通（9/9、7/7），是环境不行 |
| Sandpack 测试的时间行为 | 没有 fake timer；每个 `setTimeout` 多花几百毫秒（`wait(1000)` 让 1 秒的 interval 跳了两次）；**每个 test 有 5000ms 硬上限且不可调**，超时还会连带弄坏后面的 test。所以计时类断言要按真实时钟轮询，一个 test 最多等两次 |
| Sandpack 里的 `@testing-library/react` | 可用。但 `@testing-library/dom` 是它的 peerDependency，Sandpack 不自动装，必须显式写进 dependencies，否则报 `Could not find dependency` |
| Sandpack 失败输出里的代码片段 | **按 Latin-1 解码** —— 测试文件里任何非 ASCII 字节都变乱码。所以十一份测试文件的测试名与注释一律英文，中文要求写在起始文件头注释里 |
| `/arena/[id]/run` 答案隔离 | grep 参考答案特征字符串（`setNotes` / `handleSubmit` / `data-testid="note-` / `createReviewLoader` / `reviewsByBook`）**0 命中**。`__resolveReference` 有 2 处命中，但都在**需求文本**里 —— 题目本来就该告诉你要实现它 |
| cab-booking `npx vitest run`（原样） | ❌ **0 个测试跑起来** —— `CabContext.js:19:27`，`Failed to parse source for import analysis`（`.js` 里写了 JSX） |
| cab-booking 改名 `.jsx` 之后 | 4 / 4 通过。所有 import 都无扩展名，改名不用动任何 import |
| cab-booking 删掉组件实现 | 4 failed / 4 total，四条全是 `Unable to find an element by: [data-testid=...]` |
| Sandpack 里 1000ms 的 setTimeout | 实测落在 **~1900ms**（本机 vitest ~1110ms）。所以「等一次 1 秒」安全，「等四次」必定超 5000ms 预算 |
| notes-manager 的 `Date.now()` id | **同一毫秒连加两条会撞 id**，`map(note.id === ...)` 一次替换掉两行。浏览器 Sandpack 实测 `["a","b renamed","b renamed"]`（7P1F），本机 vitest 毫秒错开反而 8/8 —— **同一份代码同一份测试，两个环境两个结果**。源项目自己那 4 个测试只加一条就编辑，抓不到。不改源码，改成测试里 `tick()` 空转到时钟跳一格 |
| 考场计时 | 把 `startedAt` 倒推 5 分 07 秒，页面显示 `05:32`，真实经过 333 秒 —— 现算不累加，刷新不重置 |
| 文件树「展开看原文」 | 课程页 87 行文件树 **87 行都能展开**（41 个真实文件 + 7 棵目录树，快照共 61 KB，服务端 only）；跳过 53 个「从零重写要自己建」的裸相对路径；7 个 `/arena/*/run` 的 `ft-item` 计数全是 0 |
| 代码块横滚条（修之前） | `.codewin-body` 写着 `overflow-x: auto` 但**从来没生效**：390px 下 `scrollWidth 330 === clientWidth 330`，长行被静默切掉。加 `.cl-wrap` 后 `651 > 330`，能滚到底 |
| 390px 横向溢出回归扫描 | 20 个页面，页面级溢出 **0 处**（修前 `.opt-label` 超 116px、`<strong>` 超 58px、目录树深层路径超 256px） |
| WCAG AA 对比度扫描 | 20 页 × {1440, 390} × {浅, 深} = 80 个组合，**0 处不达标**。修之前浅色 33 类、深色 9 类，绝大多数是 `--ink-3` 用在 10–13px 的计数和编号上（3.35:1） |
| 引导计划的首屏 JS 代价 | 逐路由和 main 比原始字节：`/drill/[id]` `/code` `/practice` `/arena` `/mock/*` 全部 **+3 ~ +6 kB**；`/code/[id]` **+3**（Sandpack 仍没进首屏）；`/` **+78**（首页就是那张选择表，压不掉）；课程页 **+165** —— 这一处是 webpack 分块决定，把 lesson-body 里计划代码全删掉重新构建仍然是 631 kB |
| 计划零件必须懒加载 | 第一版直接 import 进外壳，实测 `/drill/[id]` 373 → 525、`/code/[id]` 387 → 539、课程页 470 → 625 kB。而那些零件**没跟计划时一个字都不渲染** —— 白下 160 KB。现在先用 `useProgress()` 看一眼有没有在跟计划，真跟才 `next/dynamic` 拉 plan-kit |
| 148 个练习的 id 不许进 nav.ts | 合进去 nav 从 133 KB 长到 160 KB，webpack 分块随之改变，课程页多下 145 kB。现在在 `content/nav-exercises.ts`（生成物），只有懒加载的 plan chunk 读它 |
| 高亮代码行里的注释 | `--tk-com` 对普通代码底 5.24:1，但高亮行的底叠了 `rgba(255,255,255,0.055)` 之后掉到 **4.45:1**。行号早就单独提过一档（`.cl.hl .cl-n`），注释漏了 —— 现在 `.cl.hl .tk-com` 是 5.00:1 |
| 五张分类卡的几何 | 四种档案（全新 / 有进度 / 读完一条 / 每条的下一节都是最长标题）× 七个宽度：同一排卡片高度、圆环中心、分类标签、标题、分隔线**全部相等**；底边栏没有一处画到盒子外面。80 节课文里只有两节最长的英文标题会收在第二行末尾（99 和 86 字符，360px 上） |
| 顶栏在 360px 上放不下 | 菜单 44 + 「DrillLab」76 + 〔继续〕89 + 搜索 44 + 语言 44 + 主题 44 = 341，加间隙和内边距实测 **377 > 360**。所以 ≤520px 排两行 |
| 标题层级 | 18 个路由 × {没跟计划, 跟着计划}：每页恰好一个 h1、不跳级、没有指向本页的「换一条」、控制台 0 条、每页都有 `aria-current="page"` |
| 换一条引导计划的全流程 | 36 条（1440 与 390 各 18）：取消回到 /plans、返回键回到 /plans、换完停在 /plans、换完再按返回不退回选择页、`lessons` / `exercises` / `drills` / `coding` / `arena` / `mocks` 六个 bag 换完一条不丢 |
| 引导计划的流程断言 | **113 条全过**，含「老数据没有 plan 字段时完成度直接算上已有进度」「换计划 / 不跟计划都不动任何记录」「六条计划里 765 条可见链接没有空链接」 |
| 六种练习「做错能不能重来」 | 逐个真点一遍（故意选错 → 提交 → 找重来入口 → 确认状态真的复位）。改之前 **Debug 是唯一没有出口的**，只能刷新整页；现在 6/6 都有 |
| 内容层面「问在给之前」扫描 | 50 个 recognition 题干提到「下面/这段/这行」却没有代码块的 **0 个**；26 个 debug 都有 `errorOutput` + `broken`；31 个 fill-blank 的 `hint` / `why` 全齐 |
| 全站交互可逆性 | 语言 / 主题 / 抽认卡回上一张 / 八股标记 / 提示面板收起 / coding 打勾 / 模拟考改分 / 考场三段（开考 → 交卷 → 勾验收 → 记下 → 再考一次）**全部可逆，无死路** |
| 难度 × 题型 的实际分布 | L1 = recognition + ordering，L2 = fill-blank + debug，L3 = code-completion，L4 = from-scratch。**所以难度标签不能写题型名** |
| `styles/coding.css` | 修之前是**空文件**（48 字节，只有一行注释）。`.cd-*`（9 个）和 `.sbx-*`（12 个）全无样式 —— `/code` 列表页是个裸 `<ol>`，四个标签和「未开始」连成一串 |
| 类名覆盖扫描 | 组件里用到 535 个 className，CSS 里定义 568 个，差集 **0**（修前缺 21 个） |
| 意图优先导航的首屏 JS 代价 | 和 main 逐路由对比（两边都跑 `next build`）：`/` 143→147、课程页 140→142、`/code/[id]` 120→121、`/drill` 147→148、`/path` 141→145 kB。**最大 +4 kB**，Sandpack 仍然没进首屏 |
| 六条流程 + 键盘 / 抽屉 / 老数据兼容 | playwright-core 驱动本机 Chrome，**112 条断言全过**（含「老数据没有 recent 字段时 Continue 回落到 last」和「写盘后 lessons / mocks / arena / coding 一个不丢」） |
| `.crumb-sep` 的 `opacity: 0.75` | 实测把 `--ink-3` 从 5.06:1 压到 **3.1:1**。老扫描脚本没把 opacity 算进合成，所以一直没暴露。**要更淡就换颜色变量，不要用透明度** |
| `/path` 的 `.road-body { opacity }` | 同一个坑：0.78 把 `.road-count` 压到 **3.27:1**。现在不再整块压暗，只把「读完了」那一档的说明文字换成 `--ink-3` |
| 窄屏 Ladder | 390px 下竖排四格实测 **900px**，第一道题要滑过两屏。改 2×2 后 **291px**，四格对比一个字没少 |
| Sandpack 编辑器高度 | `.sp-stack` 上有**内联** `height: 300px`，CSS 压不过。只能走 `<SandpackCodeEditor style={{height}}>` —— `SandpackProvider` 的 options 是 `SandpackInternalOptions`，**没有** `editorHeight`（types.d.ts 里那个 `SandpackOptions.editorHeight` 是给 `<Sandpack />` 预设的，写进 provider 报 TS2353） |

三处人为埋雷（`orderResolvers.js`）：
`createOrderLoader` 调不存在的 `getOrderById`（真名 `getOrder`）；
`createOrder` 用不存在的 `dataSources.orderAPI`、签名错、且漏了先查 `price`；
`catch` 把自己抛的 `INVALID_INPUT` 重新包成 `SERVICE_ERROR`。

贯穿全站的三条主线（都来自实测，不是编的）：
**① 测试通过 ≠ 做对了；② 先读清 schema/类型再写代码；③ 脚手架本身也会有问题。**

## 文案风格

- **基调：教科书 / 技术文档式的清晰陈述。通俗 ≠ 口语化。**
  面向零基础讲得明白是目标，但语气必须专业、正式、简洁。
- **禁止**：网络用语与流行梗（「说白了」「翻车」「离谱」「一把梭」「香」「没毛病」）、
  卖萌语气词、插科打诨式自问自答（「你猜怎么着」「好问题」「其实吧」）、拿读者开玩笑；
  **「值得注意的是」「综上所述」「让我们深入探讨」「赋能」这类 AI 腔同样禁止出现**。
- **保留并鼓励**：面向零基础的通俗解释与恰当类比 —— 类比本身是好东西，
  问题只出在表达轻佻。比喻要讲得平实。
- 句子可以短，但必须完整、准确。感叹号克制使用，强调靠加粗和措辞。
- **全站中文标点用全角**（`，。：；？！（）`）。
  scratchpad 里有 `fix-punct.mjs` 可以批量修；
  它已加了「跳过 HTML 实体」的守卫，但改完仍要 `grep '&lt；'` 复查一次。
  **还有两个坑，这轮真踩了：**
  ① 它会把**紧贴中文的 JS 运算符**也转掉 —— `filter（!==）` 里那个 `!`
     被转成了 `！`（因为它紧跟在 `（` 后面）。改完要 `grep '！=' `。
  ② 转换是逐字符判断「是否紧贴中文」的，所以会造出
     **一头全角一头半角的括号**（`（jsdom)`）。改完要扫
     `（[^）]*\)` 和 `\([^(]*）` 两种。
- 表情符号只在极少数地方用（✓ / ✕ / → / ★），不做 emoji 装饰。
- **JSX 会把「换行 + 缩进」那段空白整个吃掉。** 所以
  `<strong>…like.</strong>` 换行 `The business nouns` 渲染出来是
  `like.The business nouns` —— 两个英文词粘在一起。
  中文语境无所谓（中文本来不加词间空格），**英文接英文必须补 `{" "}`**。
  这轮实测扫出并修了 169 处（`</tag>` 后面 56 处、`<tag>` 前面 113 处）。
  检查脚本两个方向都要跑：
  `([A-Za-z0-9,.;:)'"’”])</(strong|code|em)>[ \t]*\n\s*([A-Za-z(])`
  和 `([A-Za-z0-9,.;:)'"’”])[ \t]*\n\s*<(strong|code|em)>([A-Za-z(])`，
  并且**跳过模板字面量**（代码块里插 `{" "}` 会把代码写坏）。

## 技术约定

- Next.js 15 App Router + React 19 + TypeScript + **纯 CSS**。
  不要引入 Tailwind、UI 库、Shiki/Prism、markdown 解析器。

  **唯一的破例：`@codesandbox/sandpack-react`。**
  只为「在 app 里真的把 coding 题跑起来」—— 正则判分没法验证一道题写对没写对，
  而这个站的验收标准是「跑通测试」。条件三条，都是硬的：
  ① **只在 coding 题详情页出现**，用 `next/dynamic` + `ssr: false`
     **并且要等用户点了「打开工作区」才加载**（实测 `/code/[id]` 首屏
     119 kB，那个 368 KB 的 sandpack chunk 是独立异步 chunk，没泄漏）。
     **模拟考页和考场页不许出现 —— 见下面那条。**
  ② 它的打包器和 npm 依赖都在 CodeSandbox 的远程服务上，
     **UI 上必须明说「需要联网」**（自托管评估见
     [docs/sandpack-evaluation.md](docs/sandpack-evaluation.md)：
     `bundlerURL` 可配，但完全离线还要再镜像一个包服务，本站不值那个成本）；
  ③ 其余禁令继续有效 —— 不许趁机引入 Tailwind、UI 库、markdown 解析器。

  两个实测踩到的坑：Sandpack v2 的 `editorHeight` / `showLineNumbers` /
  `showInlineErrors` / `showTabs` **是 `<SandpackCodeEditor>` 的 props，
  不是 `SandpackProvider` 的 options**（写错报 `TS2353`）；
  页面刷新后测试面板是 idle 的，要先点它自己的「Run sandbox」再点「跑测试」。

- `app/**/page.tsx` 是**薄壳**：只做 `params` 解析、`generateStaticParams`、
  `generateMetadata`，然后渲染 `components/` 下的组件。

### 【重要】模拟考页和考场页**不给页面内的运行环境**

这条被问过一次：「模拟考页接沙箱是不是根本就无法实现？」

**不是做不到。** React 模拟考就是一个组件加五个 RTL 测试，形状和 `/code` 里那
11 道跑绿的沙箱一模一样，接上去一定能跑（Federation 那套是 Node 项目，
Sandpack 在浏览器 iframe 里没有 Node，那套确实跑不了）。

**不接是设计决定：接了会把最高那一档删掉。** 四档的区别是「给你多少东西」——
说得出 → 认得出 → 写得对 → 空手做。模拟考就是最右边那一档
（它本来就是考场 6 道里的 2 道）。给它配一个连好依赖和测试的编辑器，
就降成「写得对」（那一档已有 11 道）；改成页面上填空，就降成「认得出」
（那一档已有 123 个练习）。两种改法结果一样：**站里再没有东西对准真实考试。**
而这个站自己写的验收下限是「在空文件夹里、没有答案的情况下写出来」。

顺带：`ArenaChallenge.blankSandbox` 已删除 —— 它一处没用过，是这个念头的残留。

**代价是说明必须够硬**，所以 `MockExam.setup`（`MockSetup`）是**必填**：
从零起项目的命令、完整文件树、以及**起始态和做对之后各该看到什么的实测输出**。
两个页面共用 `components/local-setup.tsx`：模拟考页用完整版 `<LocalSetup>`，
考场 run 页用 `<NoRunnerNote compact>`（计时已经在跑，不该再塞设计说明）。
说明不到位，「自己搭环境」就从考点变成了劝退。

去哪跑：本机 VS Code 是首选；装不了 Node 的推荐 **StackBlitz** ——
它的 WebContainers 把 Node 编译进了浏览器，所以连 Federation 那套要
`npm test` 的服务端项目也能跑，这一点比 Sandpack 强。

### 【重要】零件契约：四个变体、八档字号、两档高度、四种圆角

审计过一次，数字在这儿：**32 条「有内边距 + 有圆角 + 能点」的规则散在九个
文件里，其中只有一条是 `.btn`**；全站写死了 **28 种字号**；圆角有两套药丸写法
（`100px` 和 `999px`）。没有哪一条是错的，加在一起就是「每一块都自己长一套」。

所以现在是一份契约，写新零件之前先对一遍：

```
按钮   .btn / .btn-primary / .btn-ghost / .btn-sm     —— styles/base.css
       .btn-primary 一屏只能有一个
高度   --h-ctl 40 / --h-ctl-sm 32（窄屏与粗指针一律 ≥44）
圆角   --r-sm 6 / --r 10 / --r-lg 14 / --r-pill
字号   --fs-hero 56 / h1 42 / h2 26 / h3 19 / body 16 / sm 14 /
       meta 12.5 / xs 11        —— 就这八档
间距   --sp-1..--sp-8（8 的倍数）
轴     --gutter / --rail-pad / --rail-inset（见下一节）
```

**不要在页面样式里写 `padding: 6px 13px` 这种数**，也不要为了「就差一点」
新开一档字号。真的需要第九档时，先想清楚它和现有八档里哪一档是同一类东西。

【填充强调色的动作，一个「区域」只许有一个】

「一屏一个」这句话不够用 —— 侧栏那颗〔继续〕永远在，那页面里就一个都不能有了。
实际的规矩是：

```
外壳    一个（侧栏那颗〔继续〕；窄屏是顶栏那颗）
页面    一个（这一页要你做的那件事）
```

其余一律描边或 ghost。实测过一次反例：课程页正文里同时有五个填充块
（Autoplay / Check the order / Check my code / Next item / Mark as finished），
`/plans` 上有七个（六张卡各一个）。**六个并列的选项都填充，等于都不突出**，
而且整屏铺满柠檬绿，直接违反「强调色只给当前位置 / 进度 / 唯一主动作 / 极小高亮」。

各页的那一个分别是：课程页 = 课尾「下一节」；`/code/[id]` = 「打开工作区」；
考场 = 「开考」/「交卷」；`/plans` = 正在跟的那条计划的「继续」；
抽认卡 = 「翻到答案」。练习的「提交」**不是** —— 一页上有好几道练习。

回归脚本 `geom.mjs`：19 个页面，逐页数「背景是柠檬绿的 a / button」，
每页应当恰好 2 个（外壳一个 + 页面一个）；同时校验四个按钮变体各自
只有一个高度和一个圆角。

### 【重要】三条轴，全站只有三条

「感觉粗糙」的实测根子不是某处写错了 padding，是**同一屏上有八条左边界**。
上一版量出来：1440px 上 h1 落在 284 / 326 / 433 / 453 四个位置（因为
`.ui-page` 居中，每页 max-width 又不一样），顶栏在 276，侧栏里三条
（16 / 24 / 51）。侧栏和顶栏都不动，正文自己漂 —— 人看到的就是「每页都错开」。

现在只有三个数，在 `styles/tokens.css`：

```
--gutter      32px   正文轴 = 侧栏宽 + 它。顶栏内边距也是它
--rail-pad    16px   侧栏里每个「块」的左边界
--rail-inset  12px   侧栏里每行「文字」的左边界 = --rail-pad + 它 = 28
```

配套的两条硬规矩：

1. **正文一律左对齐，不居中。** `.ui-page` / `.content` 上都没有
   `margin-inline: auto`。阅读宽度由每个块自己的 `max-width` 收口。
   一居中，正文轴就随视口和各页的 max-width 漂移。
2. **一个块的内边距只由一处给。** `.ctx-head-mode` / `.ctx-sec-title` 曾经
   自己也写了 `padding-left: var(--rail-inset)`，而父容器已经缩过一次 ——
   叠成 36px。回归脚本量的是「元素左边界 + paddingLeft」，就是为了抓这个。

回归检查（scratchpad 里的 axes 脚本）：13 个页面 × 3 个宽度 = 39 组，
顶栏 / 正文 / 侧栏文字三条轴必须全等于 284 / 284 / 28，不一致应为 0。

### 【重要】侧栏里只有两种东西

**能去的行**，和**那一颗主动作**。别的都不许有。

上一版同一个 252px 的列里有八种视觉语言：品牌、导航行、组标题、
一张有边框的计划卡、〔继续〕、模式眉题、全局进度条、课程行加一枚柠檬绿药丸；
下半段还有三个描边的统计格、一张描边的「下一节」卡、两个并排的描边子模式方块。
四种边框、三条轴 —— 那就是「新皮肤套旧结构」的来源。

现在：

- **行**：`.snav-item` / `.ctx-item` / `.ctx-course-top` / `.ctx-sub-btn`
  共用一套 —— 34–36px 高、文字在 28、选中时**左边一条绝对定位的 2px 竖线**
  （不能用 `border-left`，那会把文字推 2px，于是选中的行和别的行错开）。
- **唯一的填充块**：`.side-cta`。所以 `.ctx-cta`（开始一轮抽认卡、回到计时中的
  考场）也是一行，只是文字用强调色。
- **小标题**只有一档：`.snav-group-title` / `.side-plan-eyebrow` /
  `.ctx-sec-title`，等宽大写 11px。
- 计划状态**不是卡片**，统计**不是格子**，「下一节」**不是盒子**。

加任何新零件之前先问：它是一行，还是那颗按钮？两个都不是的话，多半不该加。

### 【重要】语言和主题不许收进任何菜单

这个站每一段文字都有中英两版，**换语言是随时会按的开关**，不是设置项。
曾经为了在 390px 上腾地方，把语言和主题收进了顶栏那个 ? 菜单 ——
结果是手机上根本找不到怎么换语言（用户报的）。

390px 的宽度预算是这么算平的（视口 390，左右各 16，剩 358）：

```
菜单 44 + 品牌标记 44 + 〔继续〕~90 + 搜索 44 + 语言 44 + 主题 44 = 310
五个 8px 的间隙 = 40                                          共 350
```

腾地方靠两件事，不靠藏控件：
① 窄屏只留品牌**标记**，字样收起来（`.topbar-brand-name`）；
② 「使用说明」搬进侧栏，和「速查」并排 —— 它俩都是「要用时才查」的东西，
   不该占顶栏一个 44px 的位置。顺带那个 ? 弹出菜单整个删掉了，
   少一种组件语言。

回归脚本 `lang2.mjs`：360 / 390 / 430 / 620 / 768 / 1024 / 1440 七个宽度，
每个都要满足「语言按钮**不用先点开任何东西**就可见 → 点一下真的换 →
存进 localStorage → 刷新后还在 → 顶栏不溢出 → 窄屏控件 ≥44px」。

### 【重要】「重走一遍」：记一个起点，不删任何记录

用户问过一句：「我选了一个 track 之后想换别的 / 想从头开始，能吗？」
拆开是三件事，第三件当时**根本不存在**：

```
换成另一条计划        有（侧栏「换一条」、首页「换一条计划」、/plans）
清空全部进度          有（首页最底那个折叠里）
同一条计划从头重走    没有 ← 这一节说的就是它
```

**为什么不能靠删记录实现。** 计划的完成度是从课文 / 练习 / 八股这些
**共享**记录推导的（见 lib/plan-progress.ts 顶部）。React 计划和完整路线
共用地基那九节 —— 「把 React 清零」如果去删记录，完整路线的进度会跟着掉。

所以改成记一个起点：`ProgressData.planRounds[planId] = 毫秒时间戳`。
**一条记录都不动**，只是那条计划算自己的完成度时只认这个时间点之后的记录，
别的计划照旧看全部。

配套改了一件事：`lessons` / `exercises` / `rebuilds` / `coding` 四个 bag 的值
从字面量 `1` 换成了**打勾那一刻的时间戳**（类型 `Record<string, number>`）。
不用迁移 —— `1` 小于任何真实时间戳，于是老记录自动落在「这一轮之前」，
而读的地方一直都只取真值，`1` 和 `Date.now()` 都为真。

两个坑，都踩过：

1. **判「在这一轮内」必须同时判「记录存在」。** 第一版写成
   `roundStart === undefined || stamp >= roundStart`，于是「压根没做过」
   （`stamp` 是 undefined）碰上「没重走过」（`roundStart` 是 undefined）
   返回了 true —— 整条计划直接显示全做完。回归脚本第一次跑就抓到：
   4 / 130 显示成 92 / 130。
2. **一个 0 / 130 不解释清楚就像进度丢了。** 所以确认框必须说三句：
   从零重新算、课文上的勾不取消、别的计划不受影响；重走期间页面上要有一行
   「这是重走的一轮，只统计 X 之后做的」外加一条「算上以前做过的」的退路。

回归脚本 `rounds.mjs`（13 条）：老数据（值是 `1`）照旧算 → 重走后归零 →
记录一条没删 → **完整路线仍然算得到那几节** → 课文页上的勾没被取消 →
重走后重新做的算进这一轮 → 撤销后恢复。

### 【重要】首页是一张进度盘，**不问任何问题**

用户的原话：**「如果别人今天只是想复习八股呢？」**

上一版首页第一屏是「你想为什么做好准备？」加三个选项 —— 三个答案分别是
42 / 15 / 若干小时的**长期承诺**。而一个人今天打开这个站最常见的念头是
「我有二十分钟，让我刷点八股」，那个意图在那一屏上一个入口都没有。

而且它是一扇**单向门**：那一屏只在 `plan === undefined` 时渲染，选中之后
`plan` 永远有值 —— 点 logo、点「今天」、手输 `/` 全都回不去。
用户原话：**「为什么我点击 DrillLab 的 logo 不能让我重新选择」**。

现在首页三段，从上到下：

```
① 一行「接着上次」（.cline）—— 跟着计划时它就是计划的下一格
② 五门课的进度盘（.trk）—— 你在每条上走到哪、点一下接着上回那一节
③ 「只想单练某一类」（.srf）—— 八股 / 练习 / Coding / 考场 / 模拟考的计数
```

那个三选一搬到了 `/plans`，**随时点得到**。

几条别拆的：

1. **首页没有任何实心强调块。** 五张卡本身是链接，不是按钮；一行「接着上次」
   是描边 + 一条强调色左边线。所以 `/`、`/plans`、`/plans/[id]` 三页都在
   `cedesContinue()` 里 —— 侧栏那颗〔继续〕在这三页让位给页面自己的动作。
2. **五个分类用圆形仪表盘，不用横条。** 五张卡并排时，横条读的是「长度」——
   五条长度不同的线要互相比较才看得出差别；环读的是「转了多少」，一眼能对比，
   而且它把「几 / 几」放进了自己中间，不再单独占一行。
   实现上三件事别改：起点转到 12 点方向（`rotate(-90deg)`，不转就从 3 点开始走）；
   进度靠 `stroke-dashoffset`，所以变化时能走 `--t-prog` 的过渡；
   走完了换 `--ok` 而不是强调色 —— 强调色说的是「现在该看这儿」。
   **环底用 `--dial-track`（3.05 / 2.98:1），不许加 `opacity`。**
   它是有意义的图形（「总量在这儿」），WCAG 1.4.11 要 3:1；
   实测 `--rule` 只有 1.29、`--rule-strong` 1.71，画出来看不出是个环，
   而加一层 0.45 的透明度会把算好的值直接打回不达标。
   圆环里的数字**同时**在 DOM 里和 `aria-label` 上 —— 中间那两个 span 是
   `aria-hidden`，因为它们的文本是「3 /9」，读出来别扭。
3. **平行支线那张卡横跨整行**（`.trk[data-wide]`）。两个理由缺一不可：
   五张卡在两列里排成 2 + 2 + 1，最后一张孤零零半行看着像没排完；
   而它确实是另一类 —— 不依赖主线，任何时候都能开始。
4. **进度盘读 `content/track-manifest.ts`，不读 `content/nav.ts`。**
   它只要课程名、一句话、按顺序排好的课文（80 节，22 KB）。拉 nav（134 KB）
   进首屏实测会把 First Load JS 从 152 顶回两百多。
   也不能复用 plan-manifest —— 那一份只覆盖 65 / 80 节。
5. **没有「读到第几节」这回事的东西，不给进度条。** 八股按掌握状态排队、
   coding 是 25 道独立题、考场是 7 场各自计时的考试 —— 给它们画一条
   「走了百分之多少」是在编一个不存在的顺序。`.srf` 只给「n / N」的计数。
6. **课程简介截两行**（`-webkit-line-clamp: 2`）。原文三到五行，那是给课程
   总览页写的；仪表盘的用处是扫一眼，五张卡各五行一屏装不下两张。

参照的是同一套壳的另外几个 app（DataData / AlgoAlgo / APIer / RedisVisual /
AgentLab）：它们的首页就是章节表，从来不问你打算学多久。

### 【重要】分类（track）和引导计划（guided plan）是两个词

全站不许混用，也不许拿 track 指第三样东西：

```
分类 track           今天那五个科目分类（地基 / React / Federation / 面试 / Cab）
引导计划 guided plan  横跨学 / 背 / 练 / 写 / 考的一条推荐顺序，六条
方向 topic           八股和 coding 列表上的筛选（HTML / CSS / JS / …）
                     —— 英文叫 Topic，**不叫 Track**
```

两者碰面的那一句写在首页「五个分类」小标题下面：
「分类整理的是科目，引导计划把几个分类里的东西排成一条推荐顺序。」
放在那儿是因为第一次进来的人在同一屏上同时看到五张卡和侧栏的「我的计划」；
等他走到 `/plans` 才解释就晚了。

### 【重要】`/plans` 一页一个 h1，「换」有自己的地址

上一版 `/plans` 同时渲染三样东西 —— 三选一、六条的全表、当前计划的仪表盘。
一页两三个 h1；已经在跟计划的人得先滚过一整套「选计划」的界面才看得到
自己的计划。侧栏那个「换一条」当时指向 `/plans`，**而你可能已经站在 `/plans` 上**。

```
/plans          没跟计划 → 三选一（PlanPicker 自带 h1）
                跟着计划 → 我的引导计划（PlanDash + 一颗描边的「换一条」）
/plans/choose   只做一件事：当前是哪条、能换成哪些、取消
```

四条硬规矩：

1. **每一页恰好一个 h1**，且不许跳级（选择页每条计划是 h3，所以中间必须有
   一个 h2「六条计划」）。回归脚本 `a11y2.mjs` 逐页扫这两条。
2. **所有「换一条」入口都指 `/plans/choose`**（侧栏 `.side-plan-change`、
   `plan-dash`、`plan-detail`、`/plans` 页内那颗）。
3. **站在选择页上时侧栏那个「换一条」不是链接**，渲染成
   `<span data-here aria-current="page">` —— 指向自己的链接是同一个毛病
   换了个地址。
4. **换计划用 `router.replace`**，不是 push：否则换完按返回又回到选择页，
   看着像没换成。取消、返回键、换完再返回，`chooser.mjs` 36 条都验。

### 【重要】卡片的底边栏定高，文案手写

首页五张卡上踩到的两件事，都会在别处复现：

1. **不许用 CSS 截断内容。** `-webkit-line-clamp` 曾把课程总览页那段
   三到五行的简介截成两行，于是五张卡上五个半截句子。文案短就自己写短的
   （`lib/track-copy.ts`，最多两句）；表里没有的分类退回原简介，
   所以「加一门新考试只做三件事」仍然成立。
2. **网格最后一行必须定高。** 那一行多高，分隔线就往上抬多少 ——
   同一排两张卡的分隔线因此差了 18px，这就是「看着没对齐」的来源。
   现在 `.trk-next` 是 `height: calc(2.9em + var(--sp-1))`（两行）。
   **而且它必须是一段行内文本流，不是 flex**：做成 flex item 的话，
   长标题会被挤到第二行，加上自己那两行一共三行，把 44px 的盒子顶破 5px
   （实测 `scrollHeight 54 > clientHeight 44`）；给 `flex: 1 1 0` 能压回两行，
   但那两行只剩「标签之外」的宽度，可用字数从 92 掉到 78，四条课文标题因此被截。
   现在标签是句首的 inline 元素，两行都用满整张卡的宽度，
   实测 80 节 × 七个宽度只有两节最长的英文标题收在第二行末尾。

圆环两条：**零进度不画弧**（零长度的 dash 配 round 端帽会渲染成一个小点，
看着像走了一点点），**读完了中间换成对勾**（「9 / 9」要读一下才知道是满的），
计数留在 `aria-label` 上，而且那句话**必须走 `useT()`** —— 上一版写死中文，
英文界面下圆环唯一的可访问名是另一种语言。

### 【重要】390px 的顶栏排两行，因为一行是真的放不下

这是一道算术题，不是审美选择。一行要放：

```
菜单 44 + 「DrillLab」76 + 〔继续〕89 + 搜索 44 + 语言 44 + 主题 44 = 341
加五个间隙和左右内边距，在 360px 上实测 377px
```

三个候选各有硬约束：语言 / 主题不许收进菜单（手机上就找不到怎么换语言）；
品牌只留标记就是「左上角一个没有说明的图形」；〔继续〕是这一屏的主动作。
所以 **≤520px 时 `.topbar` 换行**：第一行品牌加三个工具，第二行整条给〔继续〕。

- 第二行只在这一页真有〔继续〕时才占地方，所以高度挂在
  `.shell[data-cont]` 上（`--topbar-h: 106px`），**不是写死在 `:root`**；
- `.topbar-cont` 必须是 `.topbar` 的**直接子元素**，不能留在工具组里；
- 顺带那颗按钮终于能写任务名了 —— 单行时它从 480px 起就被藏掉，
  按钮上只剩一个光秃秃的「继续」，不说去哪。

配套：抽屉里每一行 ≥44（计划名 18px、「换一条」21px 曾是全站最小的两个目标），
搜索的触摸目标补到 44 宽，**打开抽屉时焦点要取第一个「看得见的」控件** ——
第一个 `a` 是品牌，而它在那个宽度是 `display: none`，对它 `focus()` 什么都不会
发生，焦点留在 body 上。

### 【重要】抽屉打开时必须锁住背后那一页

用户报的：手机上打开侧栏之后，**后面的页面照样能滚**，实测背景移了 88px；
关掉抽屉回到原处，位置对不上，看着像跳了一下。
蒙层（`.drawer-scrim`）只拦得住点击，拦不住滚动。

锁法是把 `body` 变成 `position: fixed` 并把 `top` 设成负的滚动量，
**不是 `overflow: hidden`** —— 后者在 iOS Safari 上对 body 不生效，
而那正是这个站最可能被打开的地方。

三件配套的事，缺一个就出新毛病：

1. **解锁后要 `scrollTo` 回去。** body 固定期间文档滚动量是 0，
   不还原的话一关抽屉就弹到页首。
2. **点导航走掉时不许还原。** 新页面本来就该从顶上开始。
   所以侧栏的 `onNavigate` 走 `leaveForNav()`，它先把 `restoreScroll` 标成
   false 再关抽屉；`[path]` 那个 effect 同样标 false（管浏览器返回键）。
   标 true 的地方只有一处：锁上的那一刻。
3. **补一个等宽的 `padding-right`。** 桌面浏览器拉窄到 960 以下是有滚动条的，
   body 一固定滚动条消失，内容会整体右移十几像素。

回归脚本 `lock.mjs`（4 个宽度 × 9 条）：锁上之后滚轮和 `scrollTo` 都推不动、
抽屉自己仍然能滚、Esc 关掉回到原来的位置、点导航走掉新页面从顶上开始。
**两头都验过**：撤掉修复重跑，背景从 374 被推到 1115，12 条失败。

**探针注意**：不许用 Playwright 的 `p.click(".menu-btn")` 去开抽屉 ——
它会先 `scrollIntoViewIfNeeded`，把刚滚好的位置改掉，于是锁在 0；
要用 `p.evaluate(() => el.click())`。也不许在抽屉开着时 `tap` 屏幕中间：
窄屏会点进抽屉里的导航链接，宽一点会点在蒙层上把抽屉关掉。

### 【重要】「下一步去哪」全站只能有一个答案

`useContinue()` 曾经在没有访问记录时直接回落到「地基第一节」，
于是打过勾但没有 recent 的档案（老数据、别处导入的进度）会看到：
首页那一行说「从地基开始 · 第 1 / 9 节」，**正下方那张卡同时说
「地基 4 / 9 · 接着读第 5 节」**。同一屏两个答案。

现在它退一步用 `useLearnTarget()`（第一节没读过的），和卡片同一份算法；
`fresh` 单独判 —— 只有「第一节没读过的恰好就是地基第一节」才说「从地基开始」。

### 【重要】/path 那条竖线：一根，画在容器上

那条「一直很丑」的竖条，量出来是两件事叠在一起：

- 当前那一段用 `margin-left: -14px` + `padding-left: 14px` 把**卡片**往左顶了
  14px（里面的文字仍然对齐，盒子不对齐）；
- 竖线画在**每个节点自己**的 `::before` 上、`left: 8px` 相对各自的盒子算 ——
  于是当前那一段的线落在 x=278，其余落在 292，**整条路线在当前这一段横跳 14px**。

现在：每个节点的左右内边距一致（当前那一段只换底色，不改盒子），
竖线**一根**，画在 `.road-nodes::before` 上，`z-index: 1` 压在当前那张卡的
底色之上（不然线从卡里穿过时会被盖掉一段，看着又像断的），圆点 `z-index: 2`。

**不许再用负 margin 把某一段顶出去** —— 那正是这个 bug 的来源。

### 【重要】移动端控件：有一个扫描专门盯它

用户报过一批：「搜索框、语言框、选择框好多没居中，文字溢出、走形、变形」。
逐条量完之后是三类真问题：

1. **全局 `:focus-visible` 里写了 `border-radius`** —— 它改的是**被聚焦元素
   自己的几何**，不只是那个环。搜索输入框一聚焦就凭空长出 6px 圆角，
   而它嵌在一个 14px 圆角、`overflow: hidden` 的面板顶部，两个圆角叠在一起。
   **那一条已经删掉，以后也不许在 `:focus-visible` 里写几何属性。**
2. **占位符太长**：原来那句带三个例子，在 360px 的输入框里被切在词中间
   （`...(try "filte`）。例子本来就由结果列表自己演示。
3. **Ladder 2×2 里四个名字长短不一**：「Lesson exercises 148」要换行（47px），
   其余一行（24px），于是四格的说明落在两条不同的基线上 —— 那就是「没对齐」。
   现在名字统一预留两行，**并且写死 `line-height`**（不写就继承 body 的 1.68，
   两行 47px，而 `min-height: 2.7em` 只有 38px，换行那格还是高 9px）。

回归脚本 `mobile.mjs`：17 个页面 × {360, 390, 414}，逐个可点控件查四件事 ——
内容切字、超出视口、声称居中但左右内边距不等、行高把盒子挤爆。应当为 0。
**它必须跳过两种情况**：关着的抽屉（整块在屏幕外是设计如此）和横滚容器里的
元素（代码窗、宽表格）。不跳过的话会得到一百多条假阳性。

### 【重要】可见 ≠ 找得到

上一轮加的「换一条」在侧栏里是 11px、`--ink-3`、细下划线 —— 整个侧栏最轻的
一个元素。回归脚本断言它「可见」，而且过了；**用户实测没找到，于是以为
这个功能不存在**。

同类的还有「清空进度」：它在首页最底部一个折叠里，而那个折叠的标题写的是
「其他：速查表、模拟考自评、内容来源、进度怎么存的」—— **标题里一个字都没提它**。

两处都改了（前者提到强调色文字档 + 600 字重，后者写进标题）。要记住的是
那条教训：**「元素在 DOM 里、有尺寸、能点」和「人扫一眼会注意到」是两件事，
脚本只能证明前者。** 把一个入口做得很轻之前，先问它是不是唯一的入口。

### 【重要】选了计划之后，「换一条」必须一直在

实测过一次反例：上一版选完计划，**首页和侧栏加起来一个换计划的入口都没有**，
只有自己想到去点侧栏的「我的计划」才找得到 —— 而那一项读起来像「看看我的计划」。

所以现在有两处常驻，都不许删：

- 侧栏计划块的眉题右边：`YOUR PLAN ——— Change`（`.side-plan-change`）
- 首页那颗〔继续〕下面：「看全程 / 换一条计划」（`.dash2-alts`）

回归脚本 `change-plan.mjs`：全新浏览器状态 → 选一条 → 首页看得到入口 →
侧栏看得到 → 真的换掉 → 进度一条不丢，1440 和 390 各跑一遍。

### 【重要】UI v2 的设计系统：token 定值、原语定形

三层，从下往上：

```
styles/tokens.css   颜色 / 间距 / 字号 / 圆角 / 控件高度 / 动效时长
styles/layout.css   布局原语（全部带 ui- 前缀）
各页面的 css        只写这一页特有的东西
```

**变量名一个都没改**（9000 行 CSS 都在用），换的是值。深色是默认主题，
浅色是它的高对比对偶。两处语义要记住：

- `--accent-ink` = **强调色当文字用**（老语义，73 处在用）
- `--on-accent` = **压在强调色填充上的字**（新加的；老代码在那些地方写死了
  `#fff`，而白字压在柠檬绿上只有 1.4:1）
- 同理 `--on-ok` / `--on-info` / `--on-warn` / `--on-danger` —— 四个语义色
  在深色主题下都是亮色，压在上面的字必须是深的

**强调色只出现在四个地方**：当前位置、进度、这一屏唯一的主 CTA、极小的高亮。
不许整卡铺柠檬绿，也不许用它当大段文字的颜色。

`styles/layout.css` 里的原语是「感觉没对齐」的解药 —— 那个毛病的根子不是
某一处写错了 padding，是**十几个页面各自手写了一套容器、标题、元信息行**。
所以：`ui-page` / `ui-head` / `ui-eyebrow` / `ui-h1` / `ui-lede` / `ui-sec` /
`ui-sec-head` / `ui-sec-title` / `ui-card` / `ui-cards` / `ui-meta` /
`ui-prog` / `ui-prog-num` / `ui-bar` / `ui-prog-label` / `ui-toolbar` /
`ui-acts` / `ui-quiet` / `ui-empty`。

老类名 `.page-head` / `.eyebrow` / `.page-title` / `.page-lede` **和 ui- 那几个
写在同一条规则上**（见 layout.css）—— 于是「等价页面的标题在同一条轴上、
同一个字号」是结构上的必然，不是十几处手写的巧合。新代码用 `ui-*`，
老代码不用一次全改完。

几条硬规矩：

- 间距只用 `--sp-1` ~ `--sp-8`（8 的倍数），不许手写别的数字；
- 同等重量的按钮同高：`--h-ctl`（40px）/ `--h-ctl-sm`（32px）；
- 卡片有页脚的用 `.ui-card[data-rows]`（`auto 1fr auto`）—— 这是
  「标签换行不许改变页脚对齐」的实现方式；
- 动效只用来解释状态变化：`--t-hover` 140ms / `--t-fold` 200ms /
  `--t-prog` 300ms / `--t-enter` 200ms，并且 `layout.css` 底部那条
  `prefers-reduced-motion` 一律生效；
- **不许用 `opacity` 压暗文字**（透明度绕过所有按颜色变量算对比度的检查）。
  唯一例外是禁用的控件 —— WCAG 1.4.3 明确豁免。

### 【重要】UI v2：侧栏是导航，顶栏是工具

第五轮 IA 改动的核心。改之前的毛病不是「找不到东西」，是
**同等重量的选择太多**：

顶栏上有品牌、计划徽标（带 4/130）、四个模式、一颗「继续」、搜索、帮助、
语言、主题 —— 九件东西，其中三件都在说「往这儿走」。
侧栏上又有计划面板（自带「下一步」卡）、「接着学」大按钮、全局课文进度、
课程树、「下一节」卡 —— 五件，其中三件还在说「往这儿走」。
于是「下一步做哪一件事」被稀释成六七个都挺重要的东西。

现在分工只有一句话：

```
侧栏  去哪儿（导航）              → lib/side-nav.ts，位置在每一页上都一样
顶栏  我在哪（区段名）+ 三个工具   → 搜索 / 语言 / 主题
```

侧栏从上到下：品牌 → 今天 / 我的计划 → **计划状态 + 那颗唯一的〔继续〕** →
资料库（学课程 / 背知识点 / 做练习）→ 检验（考场 / 模拟考）→ 使用说明 / 速查 →
分隔线 → 当前这一类事情自己的结构（`components/sidebars.tsx`）。

「继续」在计划状态**下面**、资料库**上面** —— 它是这个产品的主动作，
放进导航列表里就变成了第九个链接。

几条硬规矩，别拆：

1. **「继续」全站只有一颗**（`SideContinue`，`components/continue.tsx`）。
   首页和 `/plans/[planId]` 除外 —— 那两页的主内容本身就是这颗按钮的放大版，
   同屏两个入口等于没有入口。判断在 `CEDE_TO_PAGE`。
2. **每一屏只有一个实心动作。** 侧栏那颗〔继续〕是实心的，所以
   `.ctx-cta`（模式自己的入口）在 UI v2 里降成了描边。加新按钮之前先数一遍。
3. **侧栏只渲染一份 DOM。** 窄屏靠 CSS 把 `.sidebar` 变成抽屉，不是另渲染一份。
   渲染两份会在无障碍树里留下两个同名的导航地标。
4. **右侧目录只在 ≥1280px 出现。** 窄一些的宽度上课文自己给一个折叠的
   「这一页有什么」（`.toc-fold`，服务端渲染、不带 scroll-spy）。
   两份 DOM **任何时刻只有一份在无障碍树里** —— 另一份是 `display: none`，
   而 `display: none` 会把整棵子树移出无障碍树。
5. **`lib/side-nav.ts` 不许 import 任何内容模块。** 侧栏现在每一页都渲染，
   一旦它拖上 `content/nav`（134 KB），每个路由的首屏都要带上它。
   所以主导航是一串静态链接、**不带计数**。计数在页面里或那一页的上下文侧栏里。
6. **`styles/nav.css` 必须排在 `shell.css` 之后**（见 `app/globals.css`）——
   它重写了 `.sidebar` 内部的定义，同优先级靠源码顺序决定胜负。
7. **「接着学」只能有一份来源。** 目标一律用 `useLearnTarget()`
   （[components/continue.tsx](components/continue.tsx)）。各算一份实测就打架
   （一个说地基第一节，一个说第一节没读完的）。
8. **侧栏不许读 query string。** 它在根 layout 里，是客户端组件；在那儿调
   `useSearchParams()`，252 个静态页面全部构建失败
   （`useSearchParams() should be wrapped in a suspense boundary`）。
   用 Suspense 包能过，但 hydration 时整块侧栏会被卸载重挂，
   `<details>` 的展开状态和焦点都会丢。
   **正确做法**：列表页（服务端组件，本来就知道自己筛了什么）渲染一个
   `<NoteRecent>` 小岛把完整 href 写进进度，侧栏只读进度。
   见 [components/recent.tsx](components/recent.tsx)。
9. **同一个控件不在一屏里出现两遍。** 侧栏接过筛选之后，
   `/drill` `/practice` `/code` 页面里那几排 chip 收进了 `<details>`
   （有筛选生效时服务端算出 `open`）。**不能直接删** —— 窄屏侧栏在抽屉后面，
   删了就得先开抽屉才能筛。同理 `/drill` 右栏的「抽认卡 / 按方向」、
   `/code` 右栏的「按方向」、`/practice` 右栏的「练习类型」都删了，
   因为侧栏里已经有同一份东西。

### 【重要】引导计划：只写引用，完成度一律推导

`content/plans.ts` 里六条计划，每一档不是内容拷贝，是一个**查询**：
`{ from: "lessons", examId: "react" }`、`{ from: "drills", tracks: ["react"] }`、
`{ from: "coding", ids: [...] }`。标题、估时、题面全部从 `content/nav.ts` 现取。

计划**唯一自己拥有的文字**是每一档的「为什么在这儿」（`whyZh` / `whyEn`）——
那句话在 content/exams 里不存在，因为它说的是「在这条路径上这一步的作用」，
而课文只说自己讲什么。

**完成度全部推导**（`lib/plan-progress.ts`），不新开一套：

| 计划里的一格 | 读的是 |
| --- | --- |
| 课文 | `lessons[examId/lessonId]` |
| 练习 | `exercises[...]`；从零重写那一类读 `rebuilds[...]` |
| 八股 | `drills[id]` 有记录 = 过过一遍；`mark === "known"` = 会了 |
| coding | `coding[id]` |
| 考场 | `arena[id]` 里有 `outcome === "passed"` 的那一次 |
| 模拟考 | `mocks[examId/mockId]` |

一个人可能先自己刷了三十道八股，几天后才选计划。计划自己记一套完成度的话
那三十道就白刷了。反过来，跟着计划做完一节课，Learn 模式那一节也必须打过勾。
**一份数据，两个视图。**

几条硬规矩：

1. **「下一格」只有一个算法**（`PlanStatus.next`）：第一个没完成的档 → 那一档里
   第一个没完成的格（八股按 没见过 → 不会 → 模糊 → 会 排）。侧栏那颗〔继续〕、
   首页那张「下一件事」的卡、计划页头、路线图高亮、课尾那一步，五处读同一条。
2. **八股自评一次就算过了那一档** —— 不逼人把每道都标「会」。「会了」的条数单独显示。
3. **考场通过才算那一档完成**，但从来不锁 —— 未来的档全都点得开。
4. **断言在 `content/plans-assert.ts`**，由两个计划页面 import，所以 `next build`
   会跑到它。引用写错、某一档解析出 0 条、同一条计划里条目重复 —— 构建失败。
   **别把它搬回 plans.ts 的模块作用域**：侧栏那块计划状态每一页都有，
   那样每个页面都会在客户端展开一千多个条目。
5. **摊开方式按内容类型选，不只看条数**（`autoLayout()`）：只有练习和八股
   超过 14 条才用格子。课文 21 节也是一行一个 —— 那是一条课程路线。

### 【重要】计划零件一律懒加载，而且**外壳里的东西不许碰计划**

算完成度要展开计划。**全站挂载的零件一律读 `content/plan-manifest.ts`**
（构建期压好的轻量清单，见 `lib/plan-lite.ts` 顶部）—— 它不 import 任何内容模块。
读 `content/plans.ts` 的只有 `/plans/[planId]`，那一页要估时、每一档的
「为什么在这儿」和覆盖方向，而它是单独一个路由。

第一版把计划零件直接 import 进 `app-shell`（在根 layout 里），
于是**每一个路由**都开始下载 nav：`/drill/[id]` 373 → 525、课程页 470 → 625 kB。

而这些零件有一个共同点：**没跟计划的人身上它们一个字都不渲染**
（每个都以 `if (!ready || !status) return null` 开头），`ready` 又只有
hydration 之后才为真 —— 那 160 KB 是白下的。

所以：

- `components/plan-slots.tsx` 不 import 任何内容模块，先用 `useProgress()` 看一眼
  「有没有在跟计划」，真跟才 `next/dynamic` 拉 `plan-kit`；
- `components/continue.tsx` **不许 import plan-kit**（它在外壳里，每个路由都下载）。
  跟着计划时侧栏那颗按钮换成懒加载的 `PlanSideContinue`，侧栏那块计划状态
  换成懒加载的 `PlanSideBlock`；
- 课尾那一步拆成轻壳（`lesson-plan.tsx`，默认那句是首屏内容，必须服务端渲染）
  加懒加载真身（`LessonPlanStepLive`，**住在 plan-kit 里**）。
  放在单独文件会让 webpack 把 plan-kit 提成课程页的初始 chunk（实测过）。
- 练习 id 在 `content/nav-exercises.ts`（生成物），不在 nav.ts。

### 【重要】进度里新增的 `recent`：按模式各存一条

`ProgressData.recent = { mode?, byMode }`，键是 `ModeId`，值是
`{ href, title, titleEn?, sub?, subEn?, at }`。

- **那颗「继续」**取 `mostRecent()`（跨模式按 `at` 挑最新）；
- **侧栏的高亮和 Resume** 取 `recentOf(mode)`；
- **老数据没有这个字段**，`load()` 兜底成 `{ byMode: {} }`，
  而 `mostRecent()` 会回落到一直都在的 `last` —— 老用户第一次打开就能接上。
  实测：造一份不含 `recent` 的老数据，课程 / 练习 / 八股 / coding / 考场
  五类进度一条不丢，写盘之后也还在。
- `noteRecent()` 是**幂等**的（同 mode 同 href 直接返回 `prev` 本身，
  React 因此跳过重渲染），所以放进 effect 依赖数组也不会循环。
- 引导计划另外加了三个字段：`plan { id, startedAt, at }`、`planSeen`、`planOptOut`。
  **只有一个 id 和两个时间戳** —— 完成度不在这里。老数据缺这三个就是「没跟计划」，
  首页照旧显示「接着上次那件事」。
- 和 `visit()` 一样受 `dataReady` 守卫 —— 没从 localStorage 读回来之前
  一个字都不许写盘。

### 【重要】栅格居中：`margin-inline: auto` 必须配 `width: 100%`

`.content` 是 grid item。**单独写 `margin-inline: auto` 会让它从「拉伸填满栅格列」
变成「按内容宽度」** —— 窄屏下 `max-width: 84ch` 比视口还宽，整页横向溢出。
实测在 375px 视口上溢出 395px。

正确写法：`width: 100%` 占满列 → `max-width` 收口 → `auto` 边距居中。
两处都要（`.main[data-rail="off"] > .content` 和 ≤1180px 那条 media query）。

顺带记住布局的两种情况：
- **有右栏**：两栏作为整体居中（`.main:not([data-rail="off"])` 上写
  `justify-content: center` + `minmax(0, var(--measure-wide)) var(--rail-w)`）。
- **无右栏**：栅格塌成一列，内容自己居中。
  15 个 `data-rail="off"` 的组件走这一条 —— 改之前 1280px 下首页右侧空 454px。

### 【重要】进度写入：必须等 ready，且只走 update(prev => …)

`lib/progress.tsx` 里有两条铁律，是修过两个真 bug 之后立的：

1. **没从 localStorage 读回来之前，一个字都不许写盘。**
   effect 的执行顺序是**子先父后** —— 课程页里 `LessonVisit` 的 mount effect
   比 `ProgressProvider` 的「读回数据」effect 先跑。老代码在那时用 `EMPTY`
   调了 `setItem`，**把用户全部进度冲掉**。实测（dev 与 `next start` 都复现）：
   造 3 课 / 5 练习 / 1 八股 / 1 coding，硬加载任一课程页 → 全部归零。
   现在 `update()` 里有 `dataReady` 守卫，`LessonVisit` 也把 `ready` 放进了依赖数组。
   **任何在 effect 里写进度的新代码，都必须先 `if (!ready) return`。**

2. **写入一律 `update((prev) => next)`，不许 `persist({ ...data })`。**
   老写法读的是渲染快照，同一 tick 内连写多次会互相覆盖。
   A/B 实测（scratchpad/ab.mjs 把两版逻辑原样搬出来跑）：
   同 tick 调三次 `setDrillMark`，旧版最后只剩 1 条，新版 3 条都在。
   `update` 的 `prev` 来自 ref，永远是「上一次写完的结果」。

### 【重要】只给搜索用的字段不许进 content/nav.ts

`nav.ts` 是**每个客户端页面都要下载**的。曾经它上面挂着八个只有
`search.tsx` 用的重字段（objectives / whyForAssessment / conceptHeadings /
conceptLedes / exerciseTitles / sourcePaths / recap / transfer，共 130 KB 出头），
于是 11 个路由白下 **59 kB**（gzip 后，约占那些页面首屏 JS 的 30%）——
而搜索要按 ⌘K 才打开。

现在它们在 `content/search-index.ts`（也是生成物，模板 `scripts/search-index-template.txt`），
`search.tsx` 用 `await import()` 在第一次打开搜索时才拉（实测 60 kB，
只在真的点开搜索时出现在 Network 里）。索引没加载完时搜索照常可用，
只是暂时只匹配标题和一句话简介。

实测收益：`/drill` 首屏 199 kB → **141 kB**；11 个路由平均每页省 59 kB。

**所以加字段之前先问一句「客户端首屏真的需要它吗」。** 只给搜索用的，
加到 `search-index` 那边去 —— 那边随便加，它是懒加载的。

### 【重要】课文断言必须能当场核对，但不能顺手泄答案

课文里到处写着「react-notes-app 的 package.json 只有 dev / build / q2 三个 script」。
用户的原话：**「你是不是先得展示一下这个 package.json 原文是什么呀？我就很懵逼啊。」**
实测当时 50 节声明了 `sourceFiles` 的课里，文件树 87 行**一行都展不开**。

现在 `FileExplorer` 的每一行都是 `<details>`，展开就是那个文件的原文
（`content/source-files.ts`，`npm run gen:src` 从磁盘读，不是手抄）。
路径以 `/` 结尾或是项目根绝对路径的，收成一棵 tree(1) 风格的目录树
（`kind: "tree"`，只有文件名，`node_modules` / `dist` / `target` 不进树）。
87 行现在 87 行都能展开。

**两道闸，都不许拆：**

1. **生成器只收「第一段是三个源项目之一」的路径。** 从零重写练习的
   `sourceFiles` 写的是裸相对路径（`src/App.tsx`、`package.json`），
   那是**要你自己建的文件** —— 而它们在源项目磁盘上恰好是做完的版本。
   收进来就是把答案贴在题面上。实测跳过 53 个。
2. **`FileExplorer` 的 `showContent` 默认 `false`。** 考场 run 页和模拟考页
   共用这个组件展示「文件清单」，那一份永远不给展开
   （实测 7 个 `/arena/*/run` 的 `ft-item` 计数全是 0）。
   只有 `lesson-body` 和 `exam-overview` 传了 `showContent`。

`edit: true` 的行（react-notes-app / cab-booking 那些「要你改的文件」）展开前
会先印一句「源项目在磁盘上是做完的版本，下面就是答案，想自己写就现在关上」——
默认收起 + 展开前说清楚，比偷偷展示或者干脆不给看都好。

### 【重要】代码块的横滚条曾经是**摆设**（`.cl-wrap`）

`.codewin-body` 写着 `overflow-x: auto`，但一直没生效：`.cl` 是块级 flex 容器，
宽度被压成外框宽；`.cl-c` 是 `white-space: pre` 的 flex item，超出部分只是
「可见地溢出」，**并不撑大 `.cl`**，于是 `.codewin-body` 的 `scrollWidth` 永远
等于 `clientWidth` —— 滚动条不出现，长代码行被 `.codewin { overflow: hidden }`
直接切掉，而且没有任何提示。实测 390px 下 `scrollWidth 330 === clientWidth 330`，
`"test": "NODE_OPTIONS=--experimental-vm-modules …"` 那一行直接消失。

修法是加一层 `.cl-wrap`（`width: max-content; min-width: 100%`），
每行的 `min-width: 100%` 相对它算，所以 `.cl.hl` 的高亮背景也能铺到最长那行末尾。
修完 `scrollWidth 651 > 330`，能滚到底。
**另外 macOS 默认隐藏滚动条**，所以 `.codewin-body` 上补了
`scrollbar-width: thin` + `::-webkit-scrollbar`（`--code-scroll`）让它常驻。

同一类坑还有两处，都是「长东西没处放」：
- `.ft-path` 曾是 `white-space: pre` + `overflow-x: auto` —— 同样因为 macOS
  隐藏滚动条，长路径看着就是被切掉且没有可拖的提示。改成
  `white-space: normal; overflow-wrap: anywhere`（**文件路径是要读全的东西，让它换行**）。
- `.opt-label` 在 `display: flex` 的 `.opt` 里，flex item 的 `min-width` 默认 `auto`，
  一条长路径压不下去，实测 390px 撑出去 116px。补 `min-width: 0` + `overflow-wrap: anywhere`。
- `.prose` 补了 `overflow-wrap: break-word`（`InventoryDataSource.getInventoryStatus()`
  这种不带空格的长标识符会把整页顶出去）。

**回归检查**：20 个页面 × 390px 视口扫「右边界超出 clientWidth 且祖先没有横滚容器」
的元素，现在页面级溢出 **0 处**。

### 【重要】颜色三档必须过 WCAG AA，`--ink-3` 尤其

`--ink-3` 用在**最小的字上**（10–13px 的计数、编号、眉题、面包屑）——
而老配色恰好反着来：它对 `--paper` 只有 3.35:1、对 `--sunken` 3.14:1。
字越小越需要对比度。实测 11 个页面上 33 类文字不达标，绝大多数是它。

现在三档是：`--ink` 13.9:1 / `--ink-2` 6.90:1 / `--ink-3` 5.06:1（最差一档 4.74:1）。
另外四处也栽在同一类问题上，都改了：

- `--accent`（`#5c7f6c` → `#547563`）：它是**主按钮 / CTA / 当前页 chip 的底色**，
  上面压白字，老值对白字 4.46:1。三处失败全是它。
- `--warn` 在 `--warn-wash` 上 4.42 → 4.84。
- `--code-line-n`、`--tk-com`、`.codewin-lang`：代码窗里的行号、注释、语言标签
  也是要读的字，不是装饰。**高亮行的行号单独再提一档**（`.cl.hl .cl-n`）——
  高亮行的底被提亮，行号反而掉到 3.90。
- `.crumb-sep` 曾用 `--rule-strong`（画线的颜色）当文字，浅色下 **1.49:1**。

**加颜色或改颜色之前先算一遍。** 扫描脚本要沿祖先链做 **alpha 合成**：
`.cl.hl` 的底是 `rgba(255,255,255,0.055)`，直接当纯白算会把整行代码判成不达标（假阳性）。

**还有一条：不要用 `opacity` 压暗文字。** 透明度会绕过所有「按颜色变量算对比度」
的检查，所以这种不达标最难发现。这一轮把扫描脚本改成会把元素及其祖先的
`opacity` 一起算进合成之后，立刻扫出两处一直不达标的地方：

- `.crumb-sep { opacity: 0.75 }` —— 把 `--ink-3` 从 5.06:1 压到 **3.1:1**（面包屑里的 `/`）；
- `/path` 的 `.road-body { opacity: .62 / .78 }` —— 把 12px 的 `.road-count` 压到 **3.27:1**。

两处都改成「换一档颜色变量」而不是压透明度。要更淡就用 `--ink-3`，
不够就说明那个字本来就不该那么小。

顺带两类是 WCAG 1.4.3 明确豁免的，扫描脚本要跳过，别去「修」它们：
**禁用的控件**（排序题那两个上下移按钮禁用时是 `opacity: .4`）和
**纯装饰**（`aria-hidden`）。

### 【重要】主题跟随系统，`color-scheme` 要一起写

`THEME_BOOTSTRAP` 曾经在没有 localStorage 值时**硬写 `"light"`**，
系统开着深色的人打开会被一整屏米白闪一下。现在：有存过就用存的，
没存过就问 `matchMedia("(prefers-color-scheme: dark)")`。

切换时除了 `data-theme` 还要写 `documentElement.style.colorScheme` ——
滚动条、输入框、date picker 这些原生控件只认它，不认 CSS 变量。

### 【重要】样式文件可能是空的 —— 加类名之后要扫一遍

`styles/coding.css` 曾经只有一行注释（48 字节），而 `coding-list.tsx` /
`coding-detail.tsx` / `coding-sandpack.tsx` / `sandbox.tsx` 一共用了 **21 个类名**：
`.cd-list` / `.cd-row` / `.cd-badge` / `.cd-fold` / `.cd-hidden` 和整族 `.sbx-*`。
结果 `/code`（四条主线之一的入口页）的题目列表就是个裸 `<ol>`：
标题、四个标签、「8 条验收标准」、「未开始」全挤成一行。
它在首屏以下，所以一直没人看见。

**回归脚本**（每次加类名之后跑一次）：把 `styles/*.css` 里所有 `.foo` 收成集合，
再扫 `components/**` 和 `app/**` 里所有 `className="..."`，求差集。
现在组件里用到 535 个类名，CSS 里定义 568 个，**0 个没有定义**。
反方向（定义了但没人用）也扫一遍：这一轮据此删掉了 868 行死 CSS
（老侧栏的 `.side-*`、老首页的 `.hero-*` / `.tier-*` / `.start-*`、
老课尾的 `.foot-back*` / `.foot-next*`）。
注意跳过模板字面量里的 `${}`（`tk-${tok.t}` 会被当成 `.tk-`）。

### 【重要】Debug Lab：判类型之前必须先给代码；选错必须能重来

用户的原话：**「Step 2 这道题状态更新错误，你告诉我代码是哪啊？是什么样？
你只告诉我 length 没变化，我他妈哪知道什么问题？」**

老实现里 `ex.broken` **只在第 3 步渲染**，而第 2 步就要你判断「这是什么类型的
错误」。对于「没有报错，只有症状」那一类（`push` 完 `setState`，界面不动），
`errorOutput` 里根本没有代码 —— 等于让人凭空猜。

现在第 1 步就是**现场**：症状 + 出错的代码，一起给。第 3 步不再原样贴第二遍，
放一份 `collapsible: true` 的（第 1 步的代码可能已经滚出屏幕，要对照时点一下就有）。

**第二条：选错了必须能重来。** 老实现里 `step` 一往前推就把选项 `disabled`，
再也回不去 —— 只能刷新整页，而刷新会把这一页**所有**练习的作答一起清掉。
用户原话：「我只能刷新整个页面把所有的题重新做一遍」。

现在每一步答错都给「这一步重做」，看完答案还有「整题重做」。
`redoFrom(n)` 把那一步及之后的选择清空 —— 清空之后 `data-state` 只剩
`"picked"`，**刚才泄露的正确答案高亮也跟着消失**，重做才是真的重做。
`markExercise` 的判定点在「提交第 3 步」那一刻，所以重做之后再对上也能记上。

**六种练习类型的重试，改之前只有 Debug 缺**（Recognition「再来一次」、
Ordering「继续调整」、FillBlank / CodeCompletion「重置」都有）。
加交互之前先问一句：**做错了怎么回来？**

第 3 步那份对照用的代码**只在 `broken` 超过 14 行时才给**：短代码第 1 步就在
正上方，重复贴一遍是噪音；而且 `collapsible` 只是 `max-height: 300px`，
内容不到那么高就会出现一个「展开全部 4 行」却什么也没折叠的按钮，看着像坏了。
26 道里 6 道会给，19 道不给。

### 【重要】难度是难度，题型是题型，标签别混

题头的难度徽章曾经写成 `L2 · 填空 / Fill the blanks`。但 **L2 里既有填空
也有 Debug Lab**（L1 里既有 recognition 也有 ordering）—— 于是一道 Debug Lab
的题头上明晃晃写着「填空」，标题自己和自己打架。

现在左边只说刻度（`L2`，`title` 上挂一句含义），右边单独一个题型徽章
（`Debug Lab`）。两套标签在 **`lib/exercise-labels.ts`，全站唯一一份** ——
`practice-page.tsx` 的筛选器原来抄了第二份，改一边忘一边就会出现
「筛选器叫「写整块」、题头叫别的」。那个文件是纯数据没有 JSX，
服务端和客户端组件都能 import。

### 【重要】谁能 import 内容

课程内容里带 JSX。**只有服务端组件可以 import `content/registry` 或
`content/exams/*`。** 客户端组件（`"use client"`）一律读 `content/nav.ts`。

为什么：客户端组件 import 内容会把全部课程的正文打进同一个 chunk。
这个坑踩过一次 —— 实测单 chunk 784 KB、每页都下载、课程页首屏 338 kB。
拆开之后课程页 117 kB。

- 服务端渲染正文：`lesson-body` / `mock-detail` / `practice-page` / `lesson-kit`
  （`lesson-kit` 里一个 hook 都没有，**别给它加 "use client"**）
- 客户端小岛：`lesson-islands`（记录位置 / 打勾 / 完成徽章 / 目录 spy）、`mock-score`、
  `practice-progress`、`exercise`、`code`、`data-flow`、`search`，
  以及导航那一组 —— `app-shell`、`sidebars`、`continue`、`recent`
- **标签和 URL 拼接这类纯数据模块放 `lib/`**，服务端和客户端都能 import：
  `lib/modes.ts`（四个模式）、`lib/exercise-labels.ts`（难度 / 题型）、
  `lib/coding-labels.ts`（Coding 方向 / 难度，从 `content/coding.ts` 搬出来的，
  那边改成 re-export）、`lib/list-query.ts`（`/practice` 与 `/code` 的筛选链接）、
  `components/drill-query.tsx`（`/drill` 的筛选链接）。
  抄第二份的后果是「侧栏点出来的链接和页面上的筛选按钮走向不同的 URL」
- **加了新内容字段又要在侧栏/首页/搜索里用 → 先加到 nav 的 dump 里，
  再 `npm run gen:nav`**，不要为了省事把 registry 拉进客户端组件。

`content/nav.ts` 是生成物，不要手改。生成器是 `scripts/gen-nav.mjs`
（临时起 dev server 打一个 route 取 JSON，所以它是内容的派生物而非第二份真相）。

### 其他

- 语法高亮在 `lib/highlight.ts`，零依赖。加语言就在 `Lang` 联合类型、
  `KEYWORDS`、`RE` 三处补，并在 `styles/code.css` 里确认 token 颜色。
- 代码块可信度三档，用 `content/helpers.tsx` 里的三个函数：
  `real()`（有 sourceFile → 显示「源项目」，没有 → 「已跑通」）、
  `tested()`（本机跑通但不在源项目里，如模拟考答案）、`demo()`（示意/反例）。
  **不许把没跑过的东西标成前两档。**
- 别用 `requestAnimationFrame` 做节流：标签页在后台时 rAF 不触发，
  节流标志永远解不开。`lib/use-active-heading.ts` 就是因为这个卡死过。
- 进度键：`drilllab-progress-v1`；主题键：`drilllab-theme`。
  改结构要考虑向后兼容（`load()` 里已有字段兜底）。

## 「面试八股」这一门的特殊规矩

`content/exams/interview.tsx` + `iv-*.tsx` 是第四门课，**它不对应任何源项目**：
题目来自作者做过的题目（编号 `#269` ~ `#387`），答案是 DrillLab 写的。所以

- 讲解里的代码块**一律 `demo()`**（「示意」），不许出现「源项目」标记；
- 每道题的格式固定：`heading` 中文问题 / `lede` 英文原题 + 题库编号 /
  `body` 一句话 → 展开 → 会追问什么。**`lede` 会进搜索索引**
  （`conceptLedes`），面试官念的是英文，所以这个必须能搜到；
- `iv-coding.tsx` 里补进来的 7 道 coding 题**参考解法都在 scratchpad 跑过测试**，
  才标 `tested()`。
- **senior 补强（2026-08 加）**：`iv-hand.tsx` 是 8 道手写题（debounce /
  Promise.all / EventEmitter 这类，concept id 用 `hd-` 前缀，不进八股题库），
  全部带沙箱且两头实测；`iv-ts.tsx` 是 6 道 TS 深度八股（concept id `ts1`–`ts6`，
  **DrillLab 自出、没有题库编号**，`drills.ts` 按 `ts\d+` 识别、bank 为空、
  UI 上显示「DrillLab 自出」徽标）。八股断言现在是 **105 = 99 + 6**。
  改 `DRILL_TRACK_LABEL` 这类 track 相关的东西要改**三处**：
  `drills.ts`、`scripts/nav-template.txt`、以及已生成的 `content/nav.ts`
  （或者停掉 dev server 重跑 gen:nav）—— 这轮只改了服务端那份，
  客户端 crash 在 `track.zh`。其中 Redux Toolkit 那道要单独建项目装依赖 ——
  **不能往 react-notes-app 的 node_modules 里装东西**。

## 加一门新考试

只做三件事：

1. `content/exams/<id>.tsx`，`export default` 一个 `Exam`。
2. 在 `content/registry.ts` 的 `EXAMS` 数组里 import。
3. `npm run gen:nav`。

**不要为新考试改页面、导航或组件。** 如果发现必须改，说明数据模型缺了字段 ——
优先扩展 `content/types.ts`，而不是在页面里做特例。

`module.stage` 是**分组标签 + 组内序号**，格式固定为「<考试名> · 第 N 部分」。

**不要再用全局线性的 "Stage 0"–"Stage 11"。** 那一版实测 12 个 Stage 里有
7 个挂着多个模块（Stage 4 挂了三个），既不是顺序也不是分组 ——
根子上的原因是「面试八股」本来就是并行轨道，不是「走完 8 个阶段之后」。
`components/learning-path.tsx` 现在按 `exam.id` 分组、用 `NAV` 的数组顺序排，
不再解析数字（那会让四门课的「第 1 部分」全挤在一起）。
原来的 `STAGE_NOTE` 已删除 —— `module.summary` 本来就说清了每个模块干什么。

## 每节课的结构（`Lesson` 类型）

```text
title / blurb / minutes
objectives[]           学完这节你会
whyForAssessment       这在考试里考什么  ← 没有考点的课不该存在
sourceFiles[]          涉及的真实文件（edit: true 会高亮成「要你改的」）
concepts[]             编号讲解段：id / heading / lede / body / code[]
callouts[]             note | why | warn | trap | transfer
exercises[]            六种练习
mistakes[]             常见错误：wrong 代码 + why
transfer[]             「看到这种信号 → 伸手拿这个解法」
recap[]                要点回顾
```

课头和课尾的形状由 `components/lesson-kit.tsx` 统一给（写内容不用管）：

- **课头**：面包屑（课程 → 课 → 模块）、`LESSON 04 / 21`、估时、
  「学完没有」徽章（客户端小岛）、一行上一节 / 下一节。
  这六样必须不滚动就能看见 —— 那是另外七个 app 「点左边一步一步做就不会
  错过任何信息」的全部秘密。
- **课尾**：一块 `LessonNextPanel`，一份有序清单
  （① 做这一节的练习 ② 接着看下一节 ③ 可选：这一节的八股 / 对应的 Coding 题），
  **整块里只有一个实心按钮**（第 ②）。打勾和「上一节」在它的页脚，权重明显更低。
  编号用 CSS counter，所以没有练习的课第 ② 步会自动变成 ①。

写新课时，`concepts` 里建议保留这个节奏：
**这一问在要求什么 → 真正考什么 → 先想再写 → 分步实现 → 完整答案 →
为什么成立 → 对应的测试 / 怎么验证**。

## 练习设计规矩

- **填空只挖真正的知识点**，不挖标点。每个空必须有 `hint` 和 `why`。
- `accept` 数组的第一个是展示用的标准答案，其余是等价写法。
- L3 的 `checks` 用正则匹配**去掉注释后**的代码（`stripNoise`），
  所以「把答案写在注释里」不算通过。既要有 `must` 也要有 `mustNot`
  （挡住 `push` / `splice` / `filter` 之类的错法）。
- Debug Lab 必须给**真实报错文本**（或真实的「没有报错 + 症状描述」），
  五步走完：读报错 → 判类型 → 定位 → 看修复 → 跑验证命令，最后给根因。
- 从零重写的 `hints` 是**四级递进**：方向 → 该动哪里/用什么 → 伪代码 → 局部代码。
  **不要在提示里直接给完整答案**，那是 `solution` 的事，而且在门后面。

## 验证清单（改完必须全过）

```bash
npm run typecheck
npm run lint
npm run build          # 应预渲染 260 个页面（252 + /plans + /plans/choose + 6 条计划）
                       # 【引导计划的完整性断言在这一步跑】
                       # content/plans-assert.ts 由两个计划页面 import：
                       # 引用了不存在的课文 / coding / 考场 / 模拟考，
                       # 或者某一档解析出 0 条 —— 构建直接失败
                       # 首屏 JS 的基准（UI v2 之后实测）：
                       #   /              153 kB     课程页        144 kB
                       #   /plans         145 kB     /plans/[id]   176 kB
                       #   /plans/choose  141 kB
                       #   /code/[id]     122 kB     /drill/[id]   117 kB
                       #   /drill         150 kB     /practice     175 kB
                       # —— 若 /code/[id] 涨到 300 kB+，说明 Sandpack 泄漏进首屏了
```

改完内容记得 `npm run gen:nav`，否则侧栏/搜索里的计数会和实际不符。
**动过任何 `sourceFiles` 还要 `npm run gen:src`** —— 那是文件树里「展开看原文」
用的快照（`content/source-files.ts`，生成物）。

**别在 `next dev` 运行时动 `.next`。** 三种都会把正在跑的 dev server 弄坏：
`npm run build`（清掉 `.next`）、`rm -rf .next`、以及
**`npm run gen:nav`**（它会在同一个项目目录再起一个 dev server）。
症状是页面变成没有样式的裸 HTML（CSS 404），或者直接 500。
遇到就重启 dev server，别去查内容有没有写错 —— 这三个坑都踩过。

浏览器侧：首页 / 八股题库 / 抽认卡 / Coding 详情 / 考场三段 / 模拟考 / 一节课
各看一遍，
切一次深色，缩到 390px 宽确认没有横向溢出，控制台无报错与 hydration 警告。

**改过样式要跑这一组扫描**（scratchpad 里有 playwright-core 驱动的脚本，
用本机已下载的 `chrome-headless-shell`，不往项目里装依赖。
`all.sh` 一次跑完全部）：

1. **类名覆盖** —— `styles/*.css` 定义的类 vs 组件里用的 `className`，差集应为 0。
   反方向（定义了没人用）也要扫，那是删死代码的依据。
2. **WCAG AA 对比度**（`scan.mjs`）—— 21 页 × {1440, 390} × {浅, 深} = 84 组，
   不达标元素应为 0。`bgOf()` 必须沿祖先链做 alpha 合成**并把 opacity 算进去**，
   否则半透明底会造出假阳性，而用 opacity 压暗的文字会漏检。
3. **横向溢出**（同一个脚本）—— 21 页 × {390, 768, 1024, 1280, 1440} = 105 组，
   溢出页面应为 0。
4. **对齐轴**（`axes2.mjs`）—— 13 页 × 3 个宽度 = 39 组，
   顶栏 / 正文 / 侧栏文字必须是 284 / 284 / 28，不一致应为 0。
5. **按钮几何 + 强调色预算**（`geom.mjs`）—— 19 个页面：
   四个按钮变体各自只能有一个高度和一个圆角；每页「宽度 ≥ 60px 且背景是
   柠檬绿」的 a / button 应 ≤ 2（外壳一个 + 页面一个），首页和计划详情页 ≤ 1。
   顺带打印全站实际渲染出的字号种类 —— 应当只有那八档（外加内联 `code`
   由 `0.875em` 派生出的两个值）。
6. **垂直节奏**（`rhythm.mjs`）—— 12 个页面「第一块距 .main 顶部」应当只有一个值。
7. **流程**（`flow2.mjs` 68 条 / `change-plan.mjs` 12 条 / `lang2.mjs` 49 条）——
   引导计划全流程、干净档案下换计划、七个宽度下切语言。

8. **焦点可见**（`focus2.mjs`）—— 12 个页面，用**真的 Tab** 走一遍
   （565 个可聚焦控件），每一个都必须有 outline、box-shadow 或 ≥2px 的底边。
   **不能用 `el.focus()` 去测**：Chromium 里 `:focus-visible` 只在
   「焦点来自键盘」时匹配，用 JS 聚焦会把全站只靠全局规则的控件全判成不合格。

**焦点环**：`:focus-visible` 的全局规则在 `styles/base.css`。
个别控件可以用别的方式表达焦点（输入框贴着面板边缘，外描边会被裁掉），
但**写 `outline: 0` 就必须当场给替代物，而且要用 `--accent` 那一档亮色** ——
踩过两次：搜索输入框删了焦点环什么都没补，沙箱编辑器补的是 `--accent-line`
（很暗的橄榄），压在代码窗的深底上等于没有。

注意 Browser pane 的两个坑：**它不派发 scroll 事件**（`scrollY` 会变但监听器收不到），
所以验证 scroll-spy 要手动 `window.dispatchEvent(new Event("scroll"))`；
JS 滚动之后截图也常常和实际位置不同步，深层内容用 DOM 断言验证而不是截图。

如果动了参考答案，**必须在 scratchpad 复制一份源项目跑一遍测试**，
不要凭记忆改数字。
