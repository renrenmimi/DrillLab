// 面试八股 —— React 上半：是什么、组件与通信。
//
// 题目来自作者做过的题目，答案由 DrillLab 撰写，代码块一律 demo()（「示意」）。
// 很多题能直接连回「React 考试」那门课里跑过的真实代码，body 里会指出来。

import type { Module } from "../types";
import { demo } from "../helpers";

export const ivReactBasics: Module = {
  id: "iv-react-basics",
  stage: "面试 · 第 4 部分",
  title: "React · 基础与组件",
  titleEn: "React · basics and components",
  summary:
    "18 道题。虚拟 DOM 与 diff、reconciliation 这几道是「你到底懂不懂 React 在干什么」的分水岭；props vs state、受控 vs 非受控、状态提升三道直接对应 Q1 那道真题里写过的代码。",
  summaryEn:
    "18 questions. The questions on the virtual DOM, diffing and reconciliation are the dividing line for whether you understand what React is doing; props vs state, controlled vs uncontrolled, and lifting state up map directly onto the code written for the real Q1 task.",
  lessons: [
    /* ============================================================
       React 是什么（7 题）
       ============================================================ */
    {
      id: "iv-react-what",
      title: "React 是什么 · 七问",
      titleEn: "7 questions on what React is",
      blurb: "React vs Angular、优势、SPA、JSX、虚拟 DOM 与 diff、reconciliation、babel 与 webpack。",
      minutes: 22,
      objectives: [
        "说清虚拟 DOM 为什么快，以及它「不一定比手写 DOM 快」这层真相",
        "解释 diff 算法的三条启发式规则，并说明 key 为什么重要",
        "分清 SPA 的优点和它带来的三个新问题",
        "说明 JSX 编译成了什么",
      ],
      whyForAssessment:
        "这一组考的是「心智模型」。虚拟 DOM 和 diff 答得空洞（只说「快」）会掉分，答得出「批量 + 最小化真实操作，代价是内存和一次 diff 计算」才算过关。key 那条会直接连到 Q1 里列表渲染的真实代码。",
      concepts: [
        {
          id: "q321",
          heading: "什么是 SPA",
          lede: "#321 What is a SPA",
          body: (
            <>
              <p>
                <strong>一句话：</strong>单页应用 ——
                <strong>只加载一个 HTML</strong>，
                之后的页面切换由 JS 在前端换内容，
                不再向服务器请求整页。
              </p>
              <p>
                <strong>好处：</strong>
                切页面没有白屏刷新、体验接近原生 App、
                前后端彻底分离（后端只给 JSON）。
              </p>
              <p>
                <strong>代价（面试重点问这半边）：</strong>
              </p>
              <ul>
                <li>
                  <strong>首屏慢</strong>—— 要先下载并执行一大包 JS
                  才能看到内容。
                  解法是代码分割（<code>React.lazy</code>，见 #347）
                  和 SSR。
                </li>
                <li>
                  <strong>SEO 差</strong>—— 爬虫拿到的 HTML 是空的
                  <code>{'<div id="root"></div>'}</code>。
                  解法是 SSR / SSG（Next.js）。
                </li>
                <li>
                  <strong>路由要自己管</strong>——
                  前进后退、深链接、刷新后还在当前页，
                  都得靠 <code>history</code> API
                  和服务端的 fallback 配置。
                  <strong>「刷新 404」就是漏配了 fallback</strong>。
                </li>
                <li>
                  <strong>内存泄漏风险</strong>—— 页面不刷新，
                  定时器和监听器不会被自动清掉。
                  <strong>这就是 <code>useEffect</code>
                  必须写清理函数的现实原因。</strong>
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「MPA 什么时候更好？」——
                内容型站点（博客、文档、电商详情页），
                重 SEO、首屏优先、交互不复杂的。
                <strong>答得出「看场景」比一味夸 SPA 好。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> a single-page application —{" "}
                <strong>one HTML document gets loaded</strong>, and from then on JS
                swaps the content on the client instead of asking the server for a
                whole new page.
              </p>
              <p>
                <strong>Upsides:</strong> no white flash when you change pages, it
                feels close to a native app, and front end and back end are fully
                separated (the server only returns JSON).
              </p>
              <p>
                <strong>Costs — this is the half they probe:</strong>
              </p>
              <ul>
                <li>
                  <strong>Slow first paint</strong> — you have to download and run a
                  big JS bundle before anything shows up. The fixes are code splitting
                  (<code>React.lazy</code>, see #347) and SSR.
                </li>
                <li>
                  <strong>Weak SEO</strong> — a crawler receives an empty
                  <code>{'<div id="root"></div>'}</code>. The fix is SSR / SSG
                  (Next.js).
                </li>
                <li>
                  <strong>You own the routing</strong> — back and forward, deep links,
                  staying on the current page after a refresh, all of it rides on the{" "}
                  <code>history</code> API plus a fallback on the server.{" "}
                  <strong>
                    &ldquo;404 on refresh&rdquo; means the fallback is missing
                  </strong>
                  .
                </li>
                <li>
                  <strong>Memory leaks</strong> — the page never reloads, so timers and
                  listeners are never cleared for you.{" "}
                  <strong>
                    That is the practical reason <code>useEffect</code> needs a cleanup
                    function.
                  </strong>
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;When is an MPA better?&rdquo; —
                content sites (blogs, docs, product detail pages) where SEO and first
                paint matter and the interaction stays simple.{" "}
                <strong>
                  &ldquo;It depends on the case&rdquo; beats praising SPAs
                  unconditionally.
                </strong>
              </p>
            </>
          ),
        },
        {
          id: "q320",
          heading: "React 的优势是什么",
          lede: "#320 React advantage",
          body: (
            <>
              <p>
                <strong>一句话：</strong>
                <strong>声明式 + 组件化 + 单向数据流</strong>——
                你描述「界面应该长什么样」，
                React 负责把 DOM 变成那样。
              </p>
              <ul>
                <li>
                  <strong>声明式</strong>—— 你写
                  <code>{"{items.map(...)}"}</code>，
                  不写「找到 ul、创建 li、appendChild」。
                  <strong>省掉的是「怎么从状态 A 变到状态 B」这类过程代码</strong>，
                  而这正是 bug 最多的地方。
                </li>
                <li>
                  <strong>组件化</strong>—— UI 拆成可复用、
                  可独立测试的单元。
                </li>
                <li>
                  <strong>单向数据流</strong>——
                  props 往下、事件往上。
                  出问题时<strong>排查路径是确定的</strong>：
                  数据只可能从一个方向来。
                </li>
                <li>
                  <strong>生态</strong>—— Router、
                  状态库、Next.js、React Native
                  （<strong>同一套心智模型能写移动端</strong>）。
                </li>
              </ul>
              <p>
                <strong>会追问缺点</strong>（一定要准备）：
                只是个视图库，路由和状态都要自己选，
                <strong>选型成本高</strong>；
                性能优化要手动（<code>memo</code> /
                <code>useMemo</code>，React 19 之前没有自动记忆化）；
                JSX 和 hooks 规则对新手有门槛；
                <strong>版本迁移的心智负担不小</strong>
                （class → hooks → Server Components）。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong>{" "}
                <strong>declarative + component-based + one-way data flow</strong> — you
                describe what the UI should look like and React makes the DOM match.
              </p>
              <ul>
                <li>
                  <strong>Declarative</strong> — you write{" "}
                  <code>{"{items.map(...)}"}</code>, not &ldquo;find the ul, create an
                  li, appendChild&rdquo;.{" "}
                  <strong>
                    What you drop is the step-by-step code for getting from state A to
                    state B
                  </strong>
                  , and that is where most bugs live.
                </li>
                <li>
                  <strong>Components</strong> — the UI splits into reusable units you can
                  test on their own.
                </li>
                <li>
                  <strong>One-way data flow</strong> — props go down, events go up. When
                  something breaks,{" "}
                  <strong>there is exactly one path to trace</strong>: the data can only
                  have come from one direction.
                </li>
                <li>
                  <strong>Ecosystem</strong> — Router, state libraries, Next.js, React
                  Native (
                  <strong>the same mental model gets you a mobile app</strong>).
                </li>
              </ul>
              <p>
                <strong>They will ask for the downsides</strong> (have them ready): it is
                only a view library, so you pick the router and the state layer yourself
                — <strong>the cost of those decisions is real</strong>; performance work
                is manual (<code>memo</code> / <code>useMemo</code>; there was no
                automatic memoization before React 19); JSX and the hook rules are a
                hurdle for beginners; and{" "}
                <strong>version migrations carry a lot of mental load</strong> (class →
                hooks → Server Components).
              </p>
            </>
          ),
        },
        {
          id: "q319",
          heading: "React vs Angular",
          lede: "#319 React vs Angular",
          body: (
            <>
              <p>
                <strong>一句话：</strong>React 是
                <strong>库</strong>（只管视图，其他自己选）；
                Angular 是<strong>框架</strong>
                （路由、HTTP、表单、依赖注入、
                测试全都自带）。
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>React</th>
                      <th>Angular</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>定位</td>
                      <td>库</td>
                      <td>全套框架</td>
                    </tr>
                    <tr>
                      <td>语言</td>
                      <td>JS / TS，JSX</td>
                      <td><strong>TypeScript 强制</strong>，HTML 模板</td>
                    </tr>
                    <tr>
                      <td>数据流</td>
                      <td>单向</td>
                      <td>支持双向绑定（<code>ngModel</code>）</td>
                    </tr>
                    <tr>
                      <td>DOM 策略</td>
                      <td>虚拟 DOM</td>
                      <td>增量 DOM + 变更检测</td>
                    </tr>
                    <tr>
                      <td>学习曲线</td>
                      <td>入门低，但选型多</td>
                      <td>入门陡（DI、RxJS、装饰器），之后规范统一</td>
                    </tr>
                    <tr>
                      <td>适合</td>
                      <td>灵活、迭代快、团队愿意自己搭</td>
                      <td>大型企业项目、要求统一规范</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>怎么答得体面：</strong>
                别踩一捧一。说
                「React 给自由也给选型负担，
                Angular 给约定也给学习成本；
                <strong>小而快的项目和需要长期多人维护的大项目，
                答案不一样</strong>」。
              </p>
              <p>
                <strong>会追问 Vue</strong>——
                Vue 在两者之间：有官方路由和状态库
                （比 React 统一），
                但比 Angular 轻；模板语法上手快。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> React is a <strong>library</strong> (it
                handles the view, you choose the rest); Angular is a{" "}
                <strong>framework</strong> (routing, HTTP, forms, dependency injection
                and testing all come in the box).
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>React</th>
                      <th>Angular</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>What it is</td>
                      <td>A library</td>
                      <td>A full framework</td>
                    </tr>
                    <tr>
                      <td>Language</td>
                      <td>JS / TS, JSX</td>
                      <td><strong>TypeScript required</strong>, HTML templates</td>
                    </tr>
                    <tr>
                      <td>Data flow</td>
                      <td>One-way</td>
                      <td>Two-way binding available (<code>ngModel</code>)</td>
                    </tr>
                    <tr>
                      <td>DOM strategy</td>
                      <td>Virtual DOM</td>
                      <td>Incremental DOM + change detection</td>
                    </tr>
                    <tr>
                      <td>Learning curve</td>
                      <td>Easy to start, but many choices to make</td>
                      <td>Steep at first (DI, RxJS, decorators), consistent after</td>
                    </tr>
                    <tr>
                      <td>Fits</td>
                      <td>Flexible work, fast iteration, a team happy to assemble its own stack</td>
                      <td>Large enterprise projects that need one standard</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>How to answer without picking a fight:</strong> do not talk one
                down to lift the other. Say &ldquo;React gives you freedom and the burden
                of choosing; Angular gives you conventions and a learning cost.{" "}
                <strong>
                  The answer differs for a small fast project and for a big one many
                  people maintain for years
                </strong>
                .&rdquo;
              </p>
              <p>
                <strong>They will ask about Vue</strong> — Vue sits between the two: it
                has an official router and state library (more unified than React) but
                stays lighter than Angular, and the template syntax is quick to pick up.
              </p>
            </>
          ),
        },
        {
          id: "q326",
          heading: "什么是 JSX",
          lede: "#326 What is JSX",
          body: (
            <>
              <p>
                <strong>一句话：</strong>JavaScript 的语法扩展，
                让你在 JS 里写类似 HTML 的结构。
                <strong>浏览器不认识它</strong>，
                要经过 Babel 编译成普通函数调用。
              </p>
              <p>
                <strong>编译成什么</strong>（这是考点）：
                旧版编译成
                <code>React.createElement(type, props, ...children)</code>；
                <strong>React 17 之后</strong>用新的 JSX 转换，
                编译成 <code>_jsx(...)</code>，
                所以<strong>不用再手动
                <code>import React</code></strong> 了。
              </p>
              <p>
                <strong>要说清的几条规则：</strong>
              </p>
              <ul>
                <li>
                  <strong>必须有单一根节点</strong>——
                  因为函数只能返回一个值。
                  不想多套 <code>div</code> 就用
                  <code>Fragment</code>（见 #338）。
                </li>
                <li>
                  <strong>属性名用小驼峰</strong>——
                  <code>className</code>（因为
                  <code>class</code> 是 JS 关键字）、
                  <code>htmlFor</code>、<code>onClick</code>。
                </li>
                <li>
                  <code>{"{}"}</code> 里放<strong>表达式</strong>，
                  不能放语句 —— 所以条件渲染用三元或
                  <code>&amp;&amp;</code>，不能写 <code>if</code>。
                </li>
                <li>
                  <strong>JSX 默认转义</strong>，
                  所以天然防 XSS；
                  要插 HTML 得显式写
                  <code>dangerouslySetInnerHTML</code>——
                  <strong>名字故意起得难听</strong>，
                  就是让你警觉。
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「JSX 是必须的吗？」——
                不是，你可以手写
                <code>createElement</code>，
                只是没人愿意。<strong>JSX 的价值是让
                「UI 结构」在代码里长得像结构</strong>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> a syntax extension for JavaScript that lets
                you write HTML-like structure inside JS.{" "}
                <strong>The browser does not understand it</strong> — Babel compiles it
                into plain function calls.
              </p>
              <p>
                <strong>What it compiles to</strong> (this is the part being tested): old
                versions produced{" "}
                <code>React.createElement(type, props, ...children)</code>;{" "}
                <strong>since React 17</strong> the new JSX transform emits{" "}
                <code>_jsx(...)</code>, which is why{" "}
                <strong>
                  you no longer have to write <code>import React</code>
                </strong>{" "}
                by hand.
              </p>
              <p>
                <strong>The rules you should state clearly:</strong>
              </p>
              <ul>
                <li>
                  <strong>One root node is required</strong> — a function can only return
                  one value. If you do not want another <code>div</code>, use a{" "}
                  <code>Fragment</code> (see #338).
                </li>
                <li>
                  <strong>Attribute names are camelCase</strong> —{" "}
                  <code>className</code> (because <code>class</code> is a JS keyword),{" "}
                  <code>htmlFor</code>, <code>onClick</code>.
                </li>
                <li>
                  <code>{"{}"}</code> holds an <strong>expression</strong>, not a
                  statement — so conditional rendering uses a ternary or{" "}
                  <code>&amp;&amp;</code>, never <code>if</code>.
                </li>
                <li>
                  <strong>JSX escapes by default</strong>, so you get XSS protection for
                  free; injecting raw HTML takes an explicit{" "}
                  <code>dangerouslySetInnerHTML</code> —{" "}
                  <strong>the name is deliberately ugly</strong> so that you stop and
                  think.
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;Is JSX mandatory?&rdquo; — no, you can
                call <code>createElement</code> yourself, nobody wants to.{" "}
                <strong>
                  The value of JSX is that UI structure looks like structure in the code.
                </strong>
              </p>
            </>
          ),
          code: [
            demo(
              "jsx",
              `// 你写的
const el = <button className="btn" onClick={handle}>点我</button>;

// Babel 编译后（React 17 之前）
const el = React.createElement(
  "button",
  { className: "btn", onClick: handle },
  "点我",
);

// {} 里只能放表达式
{if (ok) <A />}          // ✗ 语法错误
{ok ? <A /> : null}      // ✓
{ok && <A />}            // ✓（注意 0 会被渲染出来，见 #281）`,
              { filename: "JSX 编译成什么" },
            ),
          ],
        },
        {
          id: "q330",
          heading: "虚拟 DOM 和 diff 算法",
          lede: "#330 Virtual DOM and diffing algorithm",
          body: (
            <>
              <p>
                <strong>一句话：</strong>虚拟 DOM 是
                <strong>用普通 JS 对象描述真实 DOM 的一棵轻量树</strong>。
                状态变了先在内存里生成新树，
                和旧树 diff，
                <strong>算出最小改动，再一次性打到真实 DOM 上</strong>。
              </p>
              <p>
                <strong>为什么快 —— 说准这两条：</strong>
              </p>
              <ul>
                <li>
                  <strong>批量</strong>—— 十次 state 更新
                  合并成一次 DOM 操作，
                  避免十次重排（见 #288）。
                </li>
                <li>
                  <strong>最小化</strong>——
                  只改真正变了的属性和节点，
                  不重建整棵子树。
                </li>
              </ul>
              <p>
                <strong>但要说出这层真相（加分点）：</strong>
                <strong>虚拟 DOM 不一定比手写 DOM 快</strong>——
                精心手写的原生操作永远更快，
                虚拟 DOM 还额外付出了「建树 + diff」的开销。
                <strong>它真正的价值是「在保持声明式写法的同时，
                性能仍然够好」</strong>——
                是<strong>可维护性和性能的折中</strong>，
                不是性能银弹。
              </p>
              <p>
                <strong>diff 的三条启发式规则</strong>
                （把 O(n³) 降到 O(n) 的关键）：
              </p>
              <ol>
                <li>
                  <strong>只比同层</strong>，不跨层移动节点。
                  跨层的话就是删了重建。
                </li>
                <li>
                  <strong>类型不同直接整棵重建</strong>——
                  <code>div</code> 换成 <code>span</code>，
                  子树全部丢弃重做（state 也丢）。
                </li>
                <li>
                  <strong>同层列表用 <code>key</code> 认身份</strong>。
                </li>
              </ol>
              <p>
                <strong>key 为什么不能用 index</strong>——
                这是 React 面试最实用的一条：
                在开头插入或删除一项时，
                所有元素的 index 都变了，
                React 会认为「每一项的内容都变了」，
                于是<strong>大量误更新</strong>；
                更糟的是<strong>非受控输入框的内容会串到别的行</strong>，
                因为 DOM 节点被复用了。
                <strong>Q1 那道真题里删除笔记的 bug 就是这个。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> the virtual DOM is{" "}
                <strong>
                  a lightweight tree of plain JS objects describing the real DOM
                </strong>
                . When state changes, React builds a new tree in memory, diffs it against
                the old one,{" "}
                <strong>
                  works out the smallest set of changes, and applies them to the real DOM
                  in one go
                </strong>
                .
              </p>
              <p>
                <strong>Why it is fast — get these two right:</strong>
              </p>
              <ul>
                <li>
                  <strong>Batching</strong> — ten state updates collapse into one DOM
                  write, so you avoid ten reflows (see #288).
                </li>
                <li>
                  <strong>Minimising</strong> — only the attributes and nodes that really
                  changed get touched; whole subtrees are not rebuilt.
                </li>
              </ul>
              <p>
                <strong>But say this part too — it is the bonus point:</strong>{" "}
                <strong>
                  the virtual DOM is not necessarily faster than hand-written DOM code
                </strong>{" "}
                — carefully tuned native operations always win, and the virtual DOM pays
                extra for building a tree and diffing it.{" "}
                <strong>
                  Its real value is that you keep the declarative style and performance is
                  still good enough
                </strong>{" "}
                — it is a{" "}
                <strong>trade-off between maintainability and performance</strong>, not a
                silver bullet.
              </p>
              <p>
                <strong>The three diff heuristics</strong> (what turns O(n³) into O(n)):
              </p>
              <ol>
                <li>
                  <strong>Compare the same level only</strong>; nodes never move across
                  levels. Crossing a level means delete and rebuild.
                </li>
                <li>
                  <strong>A different type rebuilds the whole subtree</strong> — swap a{" "}
                  <code>div</code> for a <code>span</code> and the subtree is thrown away
                  and redone, state included.
                </li>
                <li>
                  <strong>
                    Lists on the same level use <code>key</code> for identity
                  </strong>
                  .
                </li>
              </ol>
              <p>
                <strong>Why index must not be the key</strong> — the most useful thing you
                can say in a React interview: insert or delete at the front and every
                index shifts, so React believes the content of every row changed and does{" "}
                <strong>a pile of needless updates</strong>; worse,{" "}
                <strong>
                  text typed into an uncontrolled input ends up on the wrong row
                </strong>
                , because the DOM node got reused.{" "}
                <strong>
                  The delete-a-note bug in the real Q1 question is exactly this.
                </strong>
              </p>
            </>
          ),
          code: [
            demo(
              "jsx",
              `// 虚拟 DOM 就是普通对象
{ type: "button", props: { className: "btn", children: "点我" } }

// ✗ index 当 key：在开头插一项，所有 key 都变了
{todos.map((t, i) => <Row key={i} todo={t} />)}

// ✓ 稳定的业务 id
{todos.map((t) => <Row key={t.id} todo={t} />)}`,
              {
                filename: "key 的选择",
                explanation:
                  "只有「列表永不重排、不增删中间项」时 index 才安全。既然多数列表都会变，直接养成用 id 的习惯。",
              },
            ),
          ],
        },
        {
          id: "q353",
          heading: "什么是 reconciliation",
          lede: "#353 What is reconciliation",
          body: (
            <>
              <p>
                <strong>一句话：</strong>reconciliation（协调）是
                <strong>「比较新旧虚拟 DOM 树，
                决定要对真实 DOM 做哪些操作」的整个过程</strong>。
                diff 算法是它的一部分。
              </p>
              <p>
                <strong>diff 和 reconciliation 什么关系？</strong>
                这是本题的考点：
                <strong>diff 是「怎么比」的算法，
                reconciliation 是「比 + 决定 + 提交」的完整流程</strong>。
                说它们是一回事不算错，但分得清更好。
              </p>
              <p>
                <strong>React 16 之后的 Fiber 架构</strong>
                把这个过程拆成两个阶段 ——
                这是必答的：
              </p>
              <ul>
                <li>
                  <strong>render 阶段（可中断）</strong>——
                  构建 Fiber 树、做 diff、
                  标记要改什么。
                  <strong>这个阶段可以被打断和恢复</strong>，
                  所以高优先级的更新（比如用户输入）能插队。
                </li>
                <li>
                  <strong>commit 阶段（不可中断）</strong>——
                  把标记好的改动一次性打到真实 DOM 上，
                  然后跑 <code>useEffect</code>。
                  <strong>这一段必须同步完成</strong>，
                  否则用户会看到半渲染的界面。
                </li>
              </ul>
              <p>
                <strong>为什么要能中断？</strong>
                因为老架构（Stack Reconciler）是
                <strong>递归的、一旦开始就停不下来</strong>，
                大列表更新时会阻塞主线程十几毫秒以上，
                输入卡顿。Fiber 用链表 + 循环替代递归，
                每处理一小块就检查「有没有更急的事」。
                <strong>这就是「并发特性」的基础</strong>（见 #344）。
              </p>
              <p>
                <strong>会追问：</strong>
                「StrictMode 为什么渲染两次？」——
                因为 render 阶段可能被中断和重跑，
                所以<strong>渲染函数必须是纯的</strong>；
                两次渲染就是帮你把不纯的地方暴露出来（见 #332）。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> reconciliation is{" "}
                <strong>
                  the whole process of comparing the new and old virtual DOM trees and
                  deciding which operations to run on the real DOM
                </strong>
                . The diff algorithm is one part of it.
              </p>
              <p>
                <strong>How do diff and reconciliation relate?</strong> That is the point
                of the question:{" "}
                <strong>
                  diff is the algorithm for how to compare; reconciliation is the full
                  compare, decide and commit flow
                </strong>
                . Calling them the same thing is not wrong, but telling them apart is
                better.
              </p>
              <p>
                <strong>The Fiber architecture, from React 16 on,</strong> splits the
                process into two phases — answer this every time:
              </p>
              <ul>
                <li>
                  <strong>Render phase (interruptible)</strong> — build the Fiber tree,
                  diff, mark what has to change.{" "}
                  <strong>This phase can be paused and resumed</strong>, which is how a
                  high-priority update such as typing jumps the queue.
                </li>
                <li>
                  <strong>Commit phase (not interruptible)</strong> — apply the marked
                  changes to the real DOM in one pass, then run <code>useEffect</code>.{" "}
                  <strong>This part must finish synchronously</strong>, otherwise users
                  would see a half-rendered screen.
                </li>
              </ul>
              <p>
                <strong>Why does it need to be interruptible?</strong> Because the old
                Stack Reconciler was{" "}
                <strong>recursive and could not stop once it started</strong>, so a large
                list update blocked the main thread for tens of milliseconds and typing
                stuttered. Fiber replaces recursion with a linked list plus a loop, and
                after each small chunk it checks whether something more urgent came in.{" "}
                <strong>This is the foundation of the concurrent features</strong> (see
                #344).
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Why does StrictMode render
                twice?&rdquo; — because the render phase can be interrupted and re-run, so{" "}
                <strong>the render function has to be pure</strong>; the double render is
                there to expose the impure parts (see #332).
              </p>
            </>
          ),
        },
        {
          id: "q337",
          heading: "React 项目里 babel 和 webpack 干什么",
          lede: "#337 What do we use babel and web pack for in React applications",
          body: (
            <>
              <p>
                <strong>一句话分工：</strong>
                <strong>Babel 负责「翻译」</strong>
                （JSX 和新语法 → 浏览器能懂的 JS）；
                <strong>Webpack 负责「打包」</strong>
                （把一堆模块和资源合并成能上线的几个文件）。
              </p>
              <ul>
                <li>
                  <strong>Babel</strong>——
                  <code>@babel/preset-react</code> 转 JSX，
                  <code>@babel/preset-env</code>
                  按目标浏览器把 ES2020+ 降级。
                  <strong>它只做语法转换</strong>，
                  新 API（<code>Promise</code>、
                  <code>Array.flat</code>）要靠 polyfill 补。
                  <strong>这个区分是加分点。</strong>
                </li>
                <li>
                  <strong>Webpack</strong>——
                  解析 <code>import</code> 建依赖图、
                  让 CSS 和图片也能被 import、
                  tree shaking、代码分割、
                  开发时提供 dev server 和热更新。
                </li>
              </ul>
              <p>
                <strong>顺序：</strong>
                Webpack 遇到 <code>.jsx</code>
                时调用 <code>babel-loader</code>，
                <strong>Babel 是 Webpack 流水线上的一个环节</strong>。
              </p>
              <p>
                <strong>会追问：</strong>
                「现在还用它们吗？」——
                这题答得出现状才显得在跟进：
                新项目多用 <strong>Vite</strong>
                （开发用原生 ESM + esbuild，
                生产用 Rollup），
                <strong>Babel 常被 esbuild / SWC 取代</strong>
                （快一个量级）。
                <strong>Webpack 仍在大量存量项目和
                需要复杂定制的场景里。</strong>
                <br />
                我们这门课的 React 源项目用的就是 Vite —— 所以
                <code>node_modules</code> 里根本没有 webpack。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>The split in one line:</strong>{" "}
                <strong>Babel translates</strong> (JSX and new syntax → JS the browser
                understands); <strong>Webpack bundles</strong> (a pile of modules and
                assets become the few files you ship).
              </p>
              <ul>
                <li>
                  <strong>Babel</strong> — <code>@babel/preset-react</code> handles JSX,{" "}
                  <code>@babel/preset-env</code> down-levels ES2020+ for your target
                  browsers. <strong>It only transforms syntax</strong>; new APIs
                  (<code>Promise</code>, <code>Array.flat</code>) still need a polyfill.{" "}
                  <strong>Drawing that line scores points.</strong>
                </li>
                <li>
                  <strong>Webpack</strong> — reads your <code>import</code>s to build a
                  dependency graph, lets you import CSS and images too, does tree shaking
                  and code splitting, and gives you a dev server with hot reload while you
                  work.
                </li>
              </ul>
              <p>
                <strong>The order:</strong> when Webpack hits a <code>.jsx</code> file it
                calls <code>babel-loader</code>, so{" "}
                <strong>Babel is one stage of the Webpack pipeline</strong>.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Are they still used?&rdquo; — knowing
                the current state is what shows you keep up: new projects mostly reach for{" "}
                <strong>Vite</strong> (native ESM plus esbuild in development, Rollup for
                production), and{" "}
                <strong>Babel is often replaced by esbuild or SWC</strong> — an order of
                magnitude faster.{" "}
                <strong>
                  Webpack is still everywhere in existing codebases and wherever heavy
                  customisation is needed.
                </strong>
                <br />
                The React source project in this course uses Vite — which is why there is
                no webpack in its <code>node_modules</code> at all.
              </p>
            </>
          ),
        },
      ],
      transfer: [
        { signal: "问虚拟 DOM 为什么快", reachFor: "批量 + 最小化；并主动说「不一定比手写快」" },
        { signal: "问 key", reachFor: "同层认身份；index 会导致误更新和输入串行" },
        { signal: "问 Fiber", reachFor: "render 可中断、commit 不可中断" },
        { signal: "问 SPA 缺点", reachFor: "首屏慢、SEO 差、路由自管、监听器要自己清" },
        { signal: "「刷新页面 404」", reachFor: "服务端没配 history fallback" },
      ],
      recap: [
        "SPA 的代价是首屏慢、SEO 差、路由自己管、监听器不会自动清。",
        "React 三个卖点：声明式、组件化、单向数据流；缺点是选型成本和手动性能优化。",
        "JSX 编译成 createElement（17 后是 _jsx）；{} 里只能放表达式；默认转义所以防 XSS。",
        "虚拟 DOM 快在批量和最小化，但它是可维护性与性能的折中，不是性能银弹。",
        "diff 三规则：只比同层、类型不同整棵重建、同层用 key 认身份。",
        "reconciliation 是完整流程，Fiber 把它拆成可中断的 render 和不可中断的 commit。",
        "Babel 只转语法（新 API 靠 polyfill），Webpack 管打包；Babel 是 Webpack 流水线的一环。",
      ],
    },

    /* ============================================================
       组件与通信（11 题）
       ============================================================ */
    {
      id: "iv-react-comp",
      title: "组件与通信 · 十一问",
      titleEn: "11 questions on components and how they communicate",
      blurb: "函数 vs 类组件、生命周期、useEffect 对应关系、props vs state、组件通信、受控 vs 非受控、props drilling、PureComponent、Fragment、状态提升、HOC。",
      minutes: 28,
      objectives: [
        "把类组件的生命周期一一映射到 useEffect 的写法",
        "说清 props 和 state 的三处差别，并解释为什么 props 不能改",
        "列出组件通信的五种方式并说明各自的适用场景",
        "分清受控和非受控，并说出各自的选择理由",
      ],
      whyForAssessment:
        "这一组和 Q1 那道真题重合度最高：受控输入、状态提升、props 往下事件往上，都是那道题的直接考点。生命周期与 useEffect 的对应关系是从类组件时代过来的人必被问的一题。",
      concepts: [
        {
          id: "q322",
          heading: "函数组件 vs 类组件",
          lede: "#322 Functional components vs Class components",
          body: (
            <>
              <p>
                <strong>一句话：</strong>现在一律写函数组件。
                类组件只在维护老代码和写错误边界时才用
                （错误边界目前还只能用 class）。
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>类组件</th>
                      <th>函数组件</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>状态</td>
                      <td><code>this.state</code> / <code>setState</code></td>
                      <td><code>useState</code></td>
                    </tr>
                    <tr>
                      <td>副作用</td>
                      <td>生命周期方法</td>
                      <td><code>useEffect</code></td>
                    </tr>
                    <tr>
                      <td><code>this</code></td>
                      <td><strong>要处理绑定</strong></td>
                      <td>没有 <code>this</code>，不存在这问题</td>
                    </tr>
                    <tr>
                      <td>逻辑复用</td>
                      <td>HOC / render props（嵌套很深）</td>
                      <td><strong>自定义 hook</strong>（平铺）</td>
                    </tr>
                    <tr>
                      <td>代码量</td>
                      <td>多</td>
                      <td>少</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>为什么官方推函数组件</strong>——
                答这三条比列表格更有说服力：
              </p>
              <ul>
                <li>
                  <strong>逻辑能按关注点组织，
                  而不是按生命周期切碎</strong>。
                  类组件里「订阅」和「取消订阅」被迫分在
                  <code>componentDidMount</code> 和
                  <code>componentWillUnmount</code> 两个方法里；
                  <code>useEffect</code> 让它们
                  <strong>写在一起</strong>。
                </li>
                <li>
                  <strong>复用逻辑不用套娃。</strong>
                  HOC 叠三层就变成「wrapper 地狱」，
                  自定义 hook 是平的。
                </li>
                <li>
                  <strong><code>this</code> 的问题彻底消失。</strong>
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「函数组件里怎么拿 <code>shouldComponentUpdate</code>？」——
                <code>React.memo</code>，
                但它默认是浅比较，需要自定义就传第二个参数。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> write function components, always. Class
                components are for maintaining old code and for error boundaries, which
                still have to be classes.
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Class component</th>
                      <th>Function component</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>State</td>
                      <td><code>this.state</code> / <code>setState</code></td>
                      <td><code>useState</code></td>
                    </tr>
                    <tr>
                      <td>Side effects</td>
                      <td>Lifecycle methods</td>
                      <td><code>useEffect</code></td>
                    </tr>
                    <tr>
                      <td><code>this</code></td>
                      <td><strong>You deal with binding</strong></td>
                      <td>No <code>this</code>, so no such problem</td>
                    </tr>
                    <tr>
                      <td>Reusing logic</td>
                      <td>HOC / render props (deep nesting)</td>
                      <td><strong>Custom hooks</strong> (flat)</td>
                    </tr>
                    <tr>
                      <td>Amount of code</td>
                      <td>More</td>
                      <td>Less</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>Why the official line favours function components</strong> — these
                three points land better than the table:
              </p>
              <ul>
                <li>
                  <strong>
                    Logic groups by concern instead of being sliced up by lifecycle
                  </strong>
                  . In a class, subscribing and unsubscribing are forced apart into{" "}
                  <code>componentDidMount</code> and <code>componentWillUnmount</code>;{" "}
                  <code>useEffect</code> lets them <strong>sit together</strong>.
                </li>
                <li>
                  <strong>Reusing logic needs no nesting.</strong> Three stacked HOCs turn
                  into wrapper hell; custom hooks stay flat.
                </li>
                <li>
                  <strong>
                    The <code>this</code> problem disappears completely.
                  </strong>
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;How do you get{" "}
                <code>shouldComponentUpdate</code> in a function component?&rdquo; —{" "}
                <code>React.memo</code>, though it compares shallowly by default; pass a
                second argument when you need your own comparison.
              </p>
            </>
          ),
        },
        {
          id: "q323",
          heading: "React 的生命周期有哪些",
          lede: "#323 Explain the React component lifecycle and its methods",
          body: (
            <>
              <p>
                <strong>一句话：</strong>三个阶段 ——
                <strong>挂载、更新、卸载</strong>。
              </p>
              <ul>
                <li>
                  <strong>挂载</strong>：
                  <code>constructor</code> →
                  <code>getDerivedStateFromProps</code> →
                  <code>render</code> →
                  <strong><code>componentDidMount</code></strong>
                  （DOM 已经有了，
                  <strong>发请求、订阅、操作 DOM 都在这</strong>）
                </li>
                <li>
                  <strong>更新</strong>：
                  <code>getDerivedStateFromProps</code> →
                  <strong><code>shouldComponentUpdate</code></strong>
                  （返回 false 就跳过渲染）→
                  <code>render</code> →
                  <code>getSnapshotBeforeUpdate</code> →
                  <strong><code>componentDidUpdate</code></strong>
                  （<strong>这里改 state 必须加条件</strong>，
                  否则死循环）
                </li>
                <li>
                  <strong>卸载</strong>：
                  <strong><code>componentWillUnmount</code></strong>
                  （清定时器、解绑监听、取消请求）
                </li>
                <li>
                  <strong>出错</strong>：
                  <code>getDerivedStateFromError</code> +
                  <code>componentDidCatch</code>
                  （错误边界，见 #333）
                </li>
              </ul>
              <p>
                <strong>三个被废弃的要知道</strong>：
                <code>componentWillMount</code>、
                <code>componentWillReceiveProps</code>、
                <code>componentWillUpdate</code>。
                <strong>原因是 Fiber 的 render 阶段可能被中断和重跑</strong>，
                这几个方法可能被调用多次，
                放在里面的副作用会重复执行。
                <strong>能说出这个原因很加分。</strong>
              </p>
              <p>
                <strong>会追问：</strong>
                「请求为什么不放
                <code>componentWillMount</code>？」——
                除了上面的原因，
                它在 SSR 时也会执行，
                而且并不会更早拿到数据
                （请求是异步的，反正要等）。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> three phases —{" "}
                <strong>mounting, updating, unmounting</strong>.
              </p>
              <ul>
                <li>
                  <strong>Mounting</strong>: <code>constructor</code> →{" "}
                  <code>getDerivedStateFromProps</code> → <code>render</code> →{" "}
                  <strong><code>componentDidMount</code></strong> (the DOM exists now, so{" "}
                  <strong>
                    fetching, subscribing and DOM work all belong here
                  </strong>
                  )
                </li>
                <li>
                  <strong>Updating</strong>: <code>getDerivedStateFromProps</code> →{" "}
                  <strong><code>shouldComponentUpdate</code></strong> (return false to
                  skip the render) → <code>render</code> →{" "}
                  <code>getSnapshotBeforeUpdate</code> →{" "}
                  <strong><code>componentDidUpdate</code></strong> (
                  <strong>setting state here needs a condition</strong>, or you get an
                  infinite loop)
                </li>
                <li>
                  <strong>Unmounting</strong>:{" "}
                  <strong><code>componentWillUnmount</code></strong> (clear timers, detach
                  listeners, cancel requests)
                </li>
                <li>
                  <strong>On error</strong>: <code>getDerivedStateFromError</code> +{" "}
                  <code>componentDidCatch</code> (error boundaries, see #333)
                </li>
              </ul>
              <p>
                <strong>Know the three that were deprecated</strong>:{" "}
                <code>componentWillMount</code>, <code>componentWillReceiveProps</code>,{" "}
                <code>componentWillUpdate</code>.{" "}
                <strong>
                  The reason is that Fiber can interrupt and re-run the render phase
                </strong>
                , so these could fire more than once and any side effect inside them would
                run twice. <strong>Giving that reason earns real credit.</strong>
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Why not fetch in{" "}
                <code>componentWillMount</code>?&rdquo; — besides the reason above, it also
                runs during SSR, and it does not get the data any sooner: the request is
                async, so you wait either way.
              </p>
            </>
          ),
        },
        {
          id: "q325",
          heading: "useEffect 和生命周期怎么对应",
          lede: "#325 UseEffect vs Lifecycle Methods",
          body: (
            <>
              <p>
                <strong>一句话（这句要说准）：</strong>
                <code>useEffect</code>
                <strong>不是生命周期的替代品，
                它是「同步副作用」的另一种思路</strong>——
                你声明「这个副作用依赖哪些值」，
                值变了它就重新跑。
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>类组件</th>
                      <th>useEffect 写法</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>componentDidMount</code></td>
                      <td><code>useEffect(fn, [])</code></td>
                    </tr>
                    <tr>
                      <td><code>componentDidUpdate</code></td>
                      <td><code>useEffect(fn, [dep])</code></td>
                    </tr>
                    <tr>
                      <td><code>componentWillUnmount</code></td>
                      <td>
                        effect 里 <code>return () =&gt; {"{}"}</code>
                      </td>
                    </tr>
                    <tr>
                      <td>三个都要</td>
                      <td><code>useEffect(fn)</code>（不写依赖数组）</td>
                    </tr>
                    <tr>
                      <td><code>getSnapshotBeforeUpdate</code></td>
                      <td>
                        <code>useLayoutEffect</code>
                        （DOM 更新后、浏览器绘制前同步执行）
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>但这张表有个陷阱</strong>——
                <code>useEffect(fn, [])</code>
                不完全等于 <code>componentDidMount</code>：
                前者在<strong>浏览器绘制之后</strong>
                异步执行，后者是同步的。
                <strong>所以用 <code>useEffect</code>
                测量 DOM 再改样式会闪一下</strong>，
                这种情况要用
                <code>useLayoutEffect</code>。
              </p>
              <p>
                <strong>更重要的是别用生命周期的思维写 effect。</strong>
                正确的问法不是「我要在挂载时干什么」，
                而是<strong>「这个副作用依赖哪些值」</strong>。
                依赖列全，React 自然会在该跑的时候跑。
              </p>
              <p>
                <strong>会追问：</strong>
                「清理函数什么时候执行？」——
                <strong>依赖变化前</strong>和<strong>卸载时</strong>。
                <strong>我们那道计时器变式题就是这个考点</strong>：
                漏了 <code>clearInterval</code>，
                start/pause 四次会得到 10 秒而不是 4 秒（实测）。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line — say this precisely:</strong>{" "}
                <code>useEffect</code>{" "}
                <strong>
                  is not a replacement for lifecycle methods; it is a different way of
                  thinking about synchronising side effects
                </strong>{" "}
                — you declare which values a side effect depends on, and it re-runs when
                they change.
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Class component</th>
                      <th>useEffect form</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>componentDidMount</code></td>
                      <td><code>useEffect(fn, [])</code></td>
                    </tr>
                    <tr>
                      <td><code>componentDidUpdate</code></td>
                      <td><code>useEffect(fn, [dep])</code></td>
                    </tr>
                    <tr>
                      <td><code>componentWillUnmount</code></td>
                      <td>
                        <code>return () =&gt; {"{}"}</code> inside the effect
                      </td>
                    </tr>
                    <tr>
                      <td>All three at once</td>
                      <td><code>useEffect(fn)</code> (no dependency array)</td>
                    </tr>
                    <tr>
                      <td><code>getSnapshotBeforeUpdate</code></td>
                      <td>
                        <code>useLayoutEffect</code> (runs synchronously after the DOM
                        updates, before the browser paints)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>But the table has a trap</strong> —{" "}
                <code>useEffect(fn, [])</code> is not quite{" "}
                <code>componentDidMount</code>: the first runs asynchronously{" "}
                <strong>after the browser paints</strong>, the second is synchronous.{" "}
                <strong>
                  So measuring the DOM in a <code>useEffect</code> and then changing styles
                  will flash
                </strong>
                ; that case wants <code>useLayoutEffect</code>.
              </p>
              <p>
                <strong>
                  More important: stop writing effects with a lifecycle mindset.
                </strong>{" "}
                The right question is not &ldquo;what do I do on mount&rdquo; but{" "}
                <strong>
                  &ldquo;which values does this side effect depend on&rdquo;
                </strong>
                . List the dependencies properly and React runs it when it should.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;When does the cleanup function
                run?&rdquo; — <strong>before the dependencies change</strong> and{" "}
                <strong>on unmount</strong>.{" "}
                <strong>Our timer variant question tests exactly this</strong>: drop the{" "}
                <code>clearInterval</code> and four start/pause rounds give you 10 seconds
                instead of 4 (measured).
              </p>
            </>
          ),
        },
        {
          id: "q327",
          heading: "props vs state",
          lede: "#327 props vs state",
          body: (
            <>
              <p>
                <strong>一句话：</strong>
                <strong>props 是父组件传进来的、只读</strong>；
                <strong>state 是组件自己的、可变</strong>。
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>props</th>
                      <th>state</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>谁拥有</td>
                      <td>父组件</td>
                      <td>组件自己</td>
                    </tr>
                    <tr>
                      <td>能否修改</td>
                      <td><strong>不能</strong>（只读）</td>
                      <td>能，通过 <code>setState</code></td>
                    </tr>
                    <tr>
                      <td>变了会重渲染吗</td>
                      <td>会</td>
                      <td>会</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>为什么 props 必须只读？</strong>
                因为<strong>组件的渲染函数应该是纯的</strong>
                （见 #293）：同样的 props 渲染出同样的 UI。
                改了 props 就等于改了「输入」，
                父组件下次渲染又会把它覆盖回去 ——
                数据源变成两个，谁也说不清现在该信谁。
              </p>
              <p>
                <strong>怎么判断该用哪个（实用判据）：</strong>
              </p>
              <ul>
                <li>
                  能从 props 或别的 state <strong>算出来</strong>
                  → <strong>都别放，直接算</strong>（派生数据）
                </li>
                <li>
                  只有这个组件关心、且会变 → <strong>state</strong>
                </li>
                <li>
                  多个组件都要用 → <strong>提到共同父级</strong>（#345）
                </li>
                <li>
                  整棵树都要用且不常变 → <strong>Context</strong>
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「能把 props 存进 state 吗？」——
                <strong>能但通常是 bug</strong>：
                <code>useState(props.value)</code>
                只在首次渲染取值，
                之后 props 变了 state 不会跟着变。
                只有「需要一个可编辑的初始值」时才这么做，
                而且要想清楚 props 变化时要不要重置。
                <strong>Q1 那道题的编辑功能就是这个场景</strong>，
                它用 <code>useEffect</code> 显式同步。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong>{" "}
                <strong>props come from the parent and are read-only</strong>;{" "}
                <strong>state belongs to the component and can change</strong>.
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>props</th>
                      <th>state</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Who owns it</td>
                      <td>The parent</td>
                      <td>The component itself</td>
                    </tr>
                    <tr>
                      <td>Can you change it</td>
                      <td><strong>No</strong> (read-only)</td>
                      <td>Yes, through <code>setState</code></td>
                    </tr>
                    <tr>
                      <td>Does a change re-render</td>
                      <td>Yes</td>
                      <td>Yes</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>Why must props be read-only?</strong> Because{" "}
                <strong>a render function is supposed to be pure</strong> (see #293): the
                same props render the same UI. Changing props means changing the input, and
                the parent will overwrite it on its next render — now you have two sources
                of truth and nobody can say which one to trust.
              </p>
              <p>
                <strong>How to decide which one you need — a practical test:</strong>
              </p>
              <ul>
                <li>
                  You can <strong>compute</strong> it from props or other state →{" "}
                  <strong>store neither, just compute it</strong> (derived data)
                </li>
                <li>
                  Only this component cares, and it changes → <strong>state</strong>
                </li>
                <li>
                  Several components need it →{" "}
                  <strong>lift it to their common parent</strong> (#345)
                </li>
                <li>
                  The whole tree reads it and it rarely changes →{" "}
                  <strong>Context</strong>
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;Can you put props into state?&rdquo; —{" "}
                <strong>you can, and it is usually a bug</strong>:{" "}
                <code>useState(props.value)</code> reads the value on the first render
                only, so later prop changes never reach the state. Do it only when you need
                an editable initial value, and think through whether a prop change should
                reset it.{" "}
                <strong>
                  The edit feature in the real Q1 question is that scenario
                </strong>{" "}
                — it syncs explicitly with a <code>useEffect</code>.
              </p>
            </>
          ),
        },
        {
          id: "q328",
          heading: "组件之间怎么通信",
          lede: "#328 Communication between components",
          body: (
            <>
              <p>
                <strong>一句话：</strong>五种，按「距离」从近到远选。
              </p>
              <ul>
                <li>
                  <strong>父 → 子</strong>：props。
                </li>
                <li>
                  <strong>子 → 父</strong>：
                  父把回调函数当 props 传下去，
                  子调用它。<strong>「事件往上报」就是这个。</strong>
                </li>
                <li>
                  <strong>兄弟之间</strong>：
                  <strong>状态提升</strong>到共同父级，
                  再分别往下传（#345）。
                </li>
                <li>
                  <strong>跨很多层</strong>：
                  <strong>Context</strong>——
                  适合主题、当前用户、语言这种
                  「整棵树都要读、又不常变」的值。
                </li>
                <li>
                  <strong>全局、复杂、多处修改</strong>：
                  状态库（Redux / Zustand / Jotai）
                  或服务端状态库（TanStack Query）。
                </li>
              </ul>
              <p>
                <strong>还有两个偏门但会问的：</strong>
                <code>ref</code> +
                <code>useImperativeHandle</code>
                （父组件主动调子组件的方法，
                比如 <code>focus()</code>、
                <code>play()</code>）；
                以及 <code>props.children</code>
                （组合优于配置，也是解决
                props drilling 的一招）。
              </p>
              <p>
                <strong>会追问：</strong>
                「什么时候该上状态库？」——
                判据：<strong>同一份状态被很多不相关的组件读写</strong>、
                或者需要<strong>时间旅行调试 / 中间件</strong>。
                <strong>只是「层数深」不该上 Redux，
                Context 或组合就够</strong>——
                这个回答比「大项目就用 Redux」好得多。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> five ways, and you pick by distance —
                nearest first.
              </p>
              <ul>
                <li>
                  <strong>Parent → child</strong>: props.
                </li>
                <li>
                  <strong>Child → parent</strong>: the parent passes a callback down as a
                  prop and the child calls it.{" "}
                  <strong>
                    That is all &ldquo;events go up&rdquo; means.
                  </strong>
                </li>
                <li>
                  <strong>Between siblings</strong>:{" "}
                  <strong>lift the state</strong> to their common parent and pass it back
                  down to each one (#345).
                </li>
                <li>
                  <strong>Across many levels</strong>: <strong>Context</strong> — good for
                  theme, current user, language: values the whole tree reads and that
                  rarely change.
                </li>
                <li>
                  <strong>Global, complex, written from many places</strong>: a state
                  library (Redux / Zustand / Jotai) or a server-state library (TanStack
                  Query).
                </li>
              </ul>
              <p>
                <strong>Two less common ones they still ask about:</strong>{" "}
                <code>ref</code> plus <code>useImperativeHandle</code> (the parent calls a
                method on the child, say <code>focus()</code> or <code>play()</code>); and{" "}
                <code>props.children</code> (composition over configuration, which is also
                one answer to props drilling).
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;When should you reach for a state
                library?&rdquo; — the test:{" "}
                <strong>
                  one piece of state is read and written by many unrelated components
                </strong>
                , or you need <strong>time-travel debugging or middleware</strong>.{" "}
                <strong>
                  Depth alone is no reason for Redux — Context or composition is enough
                </strong>{" "}
                — that answer beats &ldquo;big project, use Redux&rdquo; by a mile.
              </p>
            </>
          ),
          code: [
            demo(
              "jsx",
              `// 子 -> 父：传回调下去
function Parent() {
  const [text, setText] = useState("");
  return <Child onChange={setText} />;      // 父给回调
}
function Child({ onChange }) {
  return <input onChange={(e) => onChange(e.target.value)} />;
}

// 用 children 组合，避免中间层被迫透传
<Layout sidebar={<Nav />}>
  <Article />          {/* Layout 不需要知道 Article 要什么 props */}
</Layout>`,
              { filename: "两种最常用的方式" },
            ),
          ],
        },
        {
          id: "q329",
          heading: "受控组件 vs 非受控组件",
          lede: "#329 Controlled component vs uncontrolled component",
          body: (
            <>
              <p>
                <strong>一句话：</strong>
                <strong>受控 = 值由 React state 说了算</strong>
                （<code>value</code> + <code>onChange</code>）；
                <strong>非受控 = 值由 DOM 自己保管</strong>，
                需要时用 <code>ref</code> 去读。
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>受控</th>
                      <th>非受控</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>值放哪</td>
                      <td>React state</td>
                      <td>DOM 节点</td>
                    </tr>
                    <tr>
                      <td>怎么读</td>
                      <td>直接读 state</td>
                      <td><code>ref.current.value</code></td>
                    </tr>
                    <tr>
                      <td>每次输入重渲染</td>
                      <td>会</td>
                      <td>不会</td>
                    </tr>
                    <tr>
                      <td>实时校验 / 联动</td>
                      <td><strong>容易</strong></td>
                      <td>难</td>
                    </tr>
                    <tr>
                      <td>代码量</td>
                      <td>多</td>
                      <td>少</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>默认用受控。</strong>
                因为一旦要做「输入为空就禁用提交按钮」
                「实时显示字数」「两个字段联动」，
                受控是唯一顺手的方式 ——
                <strong>Q1 那道真题的校验要求就是这样</strong>。
              </p>
              <p>
                <strong>非受控的两个真实场景：</strong>
                <code>{'<input type="file">'}</code>
                （<strong>只能非受控</strong>，出于安全
                JS 不能设它的值）；
                以及性能敏感的大表单
                （每次按键都重渲染整个表单时）。
              </p>
              <p>
                <strong>会追问（高频）：</strong>
                「<code>value</code> 传了但没传
                <code>onChange</code> 会怎样？」——
                输入框<strong>变成只读</strong>，
                打字没反应，React 还会警告。
                <br />
                「怎么给受控组件一个初始值又不锁死？」——
                <code>defaultValue</code>，但那就是非受控了。
                <br />
                「<code>value={"{undefined}"}</code> 呢？」——
                React 会把它当成非受控，
                <strong>然后在你后来传了值时报「从非受控变成受控」的警告</strong>。
                所以初始值该写 <code>&quot;&quot;</code> 而不是
                <code>undefined</code>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong>{" "}
                <strong>controlled = React state owns the value</strong> (
                <code>value</code> + <code>onChange</code>);{" "}
                <strong>uncontrolled = the DOM keeps the value</strong> and you read it
                with a <code>ref</code> when you need it.
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Controlled</th>
                      <th>Uncontrolled</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Where the value lives</td>
                      <td>React state</td>
                      <td>The DOM node</td>
                    </tr>
                    <tr>
                      <td>How you read it</td>
                      <td>Straight from state</td>
                      <td><code>ref.current.value</code></td>
                    </tr>
                    <tr>
                      <td>Re-renders on every keystroke</td>
                      <td>Yes</td>
                      <td>No</td>
                    </tr>
                    <tr>
                      <td>Live validation / linked fields</td>
                      <td><strong>Easy</strong></td>
                      <td>Hard</td>
                    </tr>
                    <tr>
                      <td>Amount of code</td>
                      <td>More</td>
                      <td>Less</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>Default to controlled.</strong> The moment you need &ldquo;disable
                submit while the field is empty&rdquo;, a live character count, or two
                fields that react to each other, controlled is the only comfortable option
                —{" "}
                <strong>
                  the validation requirement in the real Q1 question works exactly that way
                </strong>
                .
              </p>
              <p>
                <strong>Two real cases for uncontrolled:</strong>{" "}
                <code>{'<input type="file">'}</code> (
                <strong>it can only be uncontrolled</strong> — for security reasons JS
                cannot set its value); and performance-sensitive large forms, where every
                keystroke would otherwise re-render the whole form.
              </p>
              <p>
                <strong>Follow-ups — these come up a lot:</strong> &ldquo;What happens if
                you pass <code>value</code> but no <code>onChange</code>?&rdquo; — the
                input <strong>goes read-only</strong>, typing does nothing, and React warns
                you.
                <br />
                &ldquo;How do you give a controlled component an initial value without
                locking it?&rdquo; — <code>defaultValue</code>, but that makes it
                uncontrolled.
                <br />
                &ldquo;And <code>value={"{undefined}"}</code>?&rdquo; — React treats it as
                uncontrolled,{" "}
                <strong>
                  then warns you about switching from uncontrolled to controlled once you
                  do pass a value
                </strong>
                . So the initial value should be <code>&quot;&quot;</code>, not{" "}
                <code>undefined</code>.
              </p>
            </>
          ),
          code: [
            demo(
              "jsx",
              `// 受控：闭环 value -> onChange -> setState -> value
const [text, setText] = useState("");        // 注意初始值是 ""，不是 undefined
<input value={text} onChange={(e) => setText(e.target.value)} />
<button disabled={text.trim() === ""}>提交</button>   {/* 校验只有受控才顺手 */}

// 非受控：值在 DOM 里
const ref = useRef(null);
<input ref={ref} defaultValue="初始" />
<button onClick={() => console.log(ref.current.value)}>读</button>`,
              { filename: "两种写法" },
            ),
          ],
        },
        {
          id: "q345",
          heading: "什么是状态提升",
          lede: "#345 What is Lifting State Up in React",
          body: (
            <>
              <p>
                <strong>一句话：</strong>两个兄弟组件要共享同一份数据时，
                <strong>把 state 移到它们最近的共同父级</strong>，
                再通过 props 往下传、通过回调往上报。
              </p>
              <p>
                <strong>为什么必须这样？</strong>
                因为 React 是<strong>单向数据流</strong>——
                数据只能往下流，兄弟之间没有通道。
                <strong>唯一的共享点就是共同祖先。</strong>
              </p>
              <p>
                <strong>做法三步：</strong>
                ① 找到最近的共同父级；
                ② state 搬上去；
                ③ 父级把「值」和「改值的函数」
                分别传给两个孩子。
              </p>
              <p>
                <strong>代价（要主动说）：</strong>
                提得越高，<strong>中间层被迫透传的 props 越多</strong>
                （这就是 props drilling，#331），
                而且父级重渲染会带着整棵子树重渲染。
                <strong>所以原则是「提到刚好够用的那一层，别更高」。</strong>
              </p>
              <p>
                <strong>Q1 那道真题就是一个标准的状态提升</strong>：
                <code>notes</code> 放在
                <code>NoteManager</code>（父），
                表单和表格都是它的孩子；
                表单提交时调用父传下来的回调。
              </p>
              <p>
                <strong>会追问：</strong>
                「提太高怎么办？」——
                Context、组合（<code>children</code>）、
                或者状态库。
                <strong>注意 Context 解决的是「传递」，
                不是「共享」</strong>——
                state 该放哪还是得想清楚。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> when two sibling components need the same
                data,{" "}
                <strong>move the state up to their closest common parent</strong>, then
                pass it down through props and report back through callbacks.
              </p>
              <p>
                <strong>Why does it have to work this way?</strong> Because React has{" "}
                <strong>one-way data flow</strong> — data only travels down, and siblings
                have no channel between them.{" "}
                <strong>The only shared point is a common ancestor.</strong>
              </p>
              <p>
                <strong>Three steps:</strong> (1) find the closest common parent; (2) move
                the state up there; (3) have the parent hand the value and the function
                that changes it to each child.
              </p>
              <p>
                <strong>The cost — bring it up yourself:</strong> the higher you lift,{" "}
                <strong>
                  the more props the middle layers are forced to pass through
                </strong>{" "}
                (that is props drilling, #331), and a parent re-render drags the whole
                subtree with it.{" "}
                <strong>
                  So the rule is: lift to the lowest layer that works, and no higher.
                </strong>
              </p>
              <p>
                <strong>The real Q1 question is a textbook lift</strong>:{" "}
                <code>notes</code> lives in <code>NoteManager</code> (the parent), and both
                the form and the table are its children; on submit the form calls the
                callback the parent passed down.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;What if it is lifted too high?&rdquo; —
                Context, composition (<code>children</code>), or a state library.{" "}
                <strong>
                  Note that Context solves delivery, not sharing
                </strong>{" "}
                — you still have to decide where the state belongs.
              </p>
            </>
          ),
        },
        {
          id: "q331",
          heading: "什么是 props drilling",
          lede: "#331 What is props drilling",
          body: (
            <>
              <p>
                <strong>一句话：</strong>为了把数据送到深处的组件，
                <strong>中间那些根本不用它的组件被迫一层层往下传</strong>。
              </p>
              <p>
                <strong>为什么是问题：</strong>
              </p>
              <ul>
                <li>
                  <strong>中间组件被污染</strong>——
                  它的 props 签名里出现了跟它无关的字段，
                  可复用性下降。
                </li>
                <li>
                  <strong>改一处动一串</strong>——
                  加一个字段要改路径上每一个组件。
                </li>
                <li>
                  <strong>额外重渲染</strong>——
                  值变了整条路径都重渲染。
                </li>
              </ul>
              <p>
                <strong>四种解法，按代价从小到大：</strong>
              </p>
              <ol>
                <li>
                  <strong>组合 / <code>children</code></strong>——
                  <strong>最被低估的一招</strong>。
                  把元素直接当 props 传下去，
                  中间层就不用知道它需要什么数据。
                </li>
                <li>
                  <strong>Context</strong>——
                  适合主题、用户、语言这类
                  「整棵树都读、不常变」的值。
                  <strong>我们那道主题切换变式题就是这个。</strong>
                </li>
                <li>
                  <strong>状态库</strong>—— 复杂全局状态。
                </li>
                <li>
                  <strong>把组件树重新拆一下</strong>——
                  有时 drilling 只是拆分方式不合理的症状。
                </li>
              </ol>
              <p>
                <strong>会追问：</strong>
                「传两三层也要上 Context 吗？」——
                <strong>不要</strong>。
                两三层的 props 是清晰的、可追踪的；
                Context 会让「这个值从哪来」变得不明显，
                而且 context 一变<strong>所有消费者都重渲染</strong>。
                <strong>「drilling 超过三四层且中间层完全无关」才值得上。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> to get data down to a deep component,{" "}
                <strong>
                  the components in between that have no use for it are forced to pass it
                  along, level by level
                </strong>
                .
              </p>
              <p>
                <strong>Why that is a problem:</strong>
              </p>
              <ul>
                <li>
                  <strong>The middle components get polluted</strong> — fields that have
                  nothing to do with them show up in their props signature, so they get
                  less reusable.
                </li>
                <li>
                  <strong>One change touches a whole chain</strong> — adding a field means
                  editing every component on the path.
                </li>
                <li>
                  <strong>Extra re-renders</strong> — when the value changes, the entire
                  path re-renders.
                </li>
              </ul>
              <p>
                <strong>Four fixes, cheapest first:</strong>
              </p>
              <ol>
                <li>
                  <strong>Composition / <code>children</code></strong> —{" "}
                  <strong>the most underrated one</strong>. Pass elements down as props and
                  the middle layers never need to know what data they want.
                </li>
                <li>
                  <strong>Context</strong> — good for theme, user, language: values the
                  whole tree reads and that rarely change.{" "}
                  <strong>Our theme-switching variant question is this one.</strong>
                </li>
                <li>
                  <strong>A state library</strong> — for complex global state.
                </li>
                <li>
                  <strong>Re-splitting the component tree</strong> — sometimes drilling is
                  just a symptom of a bad split.
                </li>
              </ol>
              <p>
                <strong>Follow-up:</strong> &ldquo;Do two or three levels need
                Context?&rdquo; — <strong>no</strong>. Two or three levels of props are
                clear and easy to trace; Context makes &ldquo;where did this value come
                from&rdquo; invisible, and{" "}
                <strong>every consumer re-renders</strong> when the context changes.{" "}
                <strong>
                  It pays off once drilling passes three or four levels and the middle
                  layers are completely unrelated.
                </strong>
              </p>
            </>
          ),
        },
        {
          id: "q336",
          heading: "什么是 Pure Component",
          lede: "#336 What are Pure Component",
          body: (
            <>
              <p>
                <strong>一句话：</strong>
                <code>React.PureComponent</code>
                自带一个<strong>浅比较</strong>的
                <code>shouldComponentUpdate</code>——
                props 和 state 浅比较都没变就跳过渲染。
                函数组件的对应物是
                <code>React.memo</code>。
              </p>
              <p>
                <strong>「浅比较」是本题全部的考点。</strong>
                它对每个 prop 用
                <code>Object.is</code> 比一层。
                所以：
              </p>
              <ul>
                <li>
                  <strong>传对象/数组/函数字面量 → 优化完全失效</strong>，
                  因为每次渲染都是新引用。
                </li>
                <li>
                  <strong>内部深层改了对象 → 不会重渲染</strong>，
                  因为引用没变 —— 界面就不更新了。
                </li>
              </ul>
              <p>
                <strong>所以 PureComponent /
                <code>memo</code> 和「不可变更新」是一对</strong>：
                你必须每次造新对象，
                浅比较才能正确地判断出「变了」。
                <strong>反过来，如果你就地改对象，
                加了 memo 反而会制造 bug。</strong>
              </p>
              <p>
                <strong>会追问：</strong>
                「怎么让 memo 真正生效？」——
                对象和数组用 <code>useMemo</code>、
                函数用 <code>useCallback</code>
                稳住引用。<strong>三个必须配套用</strong>，
                只加 <code>memo</code> 往往一点用没有
                （见 #346）。
                <br />
                「是不是所有组件都该 memo？」——
                不是。浅比较本身也有成本，
                <strong>props 多且经常变的组件，
                加了反而更慢</strong>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> <code>React.PureComponent</code> ships with a{" "}
                <strong>shallow-comparison</strong>{" "}
                <code>shouldComponentUpdate</code> — if a shallow compare of props and
                state finds nothing changed, it skips the render. The function-component
                equivalent is <code>React.memo</code>.
              </p>
              <p>
                <strong>
                  The shallow compare is the whole point of this question.
                </strong>{" "}
                It runs <code>Object.is</code> on each prop, one level deep. So:
              </p>
              <ul>
                <li>
                  <strong>
                    Pass an object, array or function literal and the optimisation is dead
                  </strong>
                  , because every render creates a new reference.
                </li>
                <li>
                  <strong>Mutate something deep inside an object and it will not
                  re-render</strong>, because the reference never changed — and the UI just
                  stops updating.
                </li>
              </ul>
              <p>
                <strong>
                  So PureComponent / <code>memo</code> and immutable updates come as a pair
                </strong>
                : you have to build a new object every time for the shallow compare to see
                a change.{" "}
                <strong>
                  The reverse holds too — mutate in place and adding <code>memo</code>{" "}
                  manufactures bugs.
                </strong>
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;How do you make <code>memo</code>{" "}
                actually work?&rdquo; — stabilise the references: <code>useMemo</code> for
                objects and arrays, <code>useCallback</code> for functions.{" "}
                <strong>The three go together</strong>; <code>memo</code> on its own often
                does nothing at all (see #346).
                <br />
                &ldquo;Should every component be memoised?&rdquo; — no. The shallow compare
                costs something too, so{" "}
                <strong>
                  a component with many frequently changing props gets slower, not faster
                </strong>
                .
              </p>
            </>
          ),
          code: [
            demo(
              "jsx",
              `const Row = React.memo(function Row({ item, onPick }) { … });

// ✗ memo 白加：两个 prop 每次都是新引用
<Row item={{ ...raw }} onPick={() => pick(raw.id)} />

// ✓ 稳住引用，memo 才有意义
const item = useMemo(() => ({ ...raw }), [raw]);
const onPick = useCallback((id) => pick(id), [pick]);
<Row item={item} onPick={onPick} />`,
              { filename: "memo 生效的前提" },
            ),
          ],
        },
        {
          id: "q338",
          heading: "什么是 Fragment",
          lede: "#338 React Fragment",
          body: (
            <>
              <p>
                <strong>一句话：</strong>
                一个<strong>不产生真实 DOM 节点</strong>的容器，
                用来满足「JSX 必须有单一根节点」的要求，
                同时不往页面里多塞一层
                <code>div</code>。
              </p>
              <p>
                写法两种：<code>&lt;React.Fragment&gt;</code>
                和简写 <code>&lt;&gt;&lt;/&gt;</code>。
              </p>
              <p>
                <strong>为什么需要它（举得出场景才算答好）：</strong>
              </p>
              <ul>
                <li>
                  <strong>表格</strong>——
                  <code>&lt;tr&gt;</code> 里套一层
                  <code>div</code> 是<strong>非法 HTML</strong>，
                  浏览器会把它挪出去，布局直接坏。
                </li>
                <li>
                  <strong>Flex / Grid 布局</strong>——
                  多一层 <code>div</code> 会
                  <strong>打断父容器和子项的直接关系</strong>，
                  <code>flex</code> 属性全失效。
                </li>
                <li>
                  <strong>减少 DOM 层数</strong>，
                  样式选择器也更好写。
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「Fragment 上能加 key 吗？」——
                <strong>能，但必须用完整写法</strong>
                <code>&lt;React.Fragment key={"{id}"}&gt;</code>，
                简写 <code>&lt;&gt;</code> 不支持任何属性。
                <strong>在列表里渲染多个兄弟元素时就得这么写</strong>，
                这是简写唯一的限制。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> a container that{" "}
                <strong>produces no real DOM node</strong>, so you can satisfy &ldquo;JSX
                needs a single root&rdquo; without pushing another <code>div</code> into the
                page.
              </p>
              <p>
                Two forms: <code>&lt;React.Fragment&gt;</code> and the shorthand{" "}
                <code>&lt;&gt;&lt;/&gt;</code>.
              </p>
              <p>
                <strong>
                  Why you need it — you only answer this well with concrete cases:
                </strong>
              </p>
              <ul>
                <li>
                  <strong>Tables</strong> — a <code>div</code> inside a{" "}
                  <code>&lt;tr&gt;</code> is <strong>invalid HTML</strong>; the browser
                  hoists it out and the layout breaks on the spot.
                </li>
                <li>
                  <strong>Flex / Grid layouts</strong> — an extra <code>div</code>{" "}
                  <strong>
                    breaks the direct relationship between the container and its items
                  </strong>
                  , so every <code>flex</code> property stops working.
                </li>
                <li>
                  <strong>Fewer DOM levels</strong>, and easier style selectors.
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;Can a Fragment take a key?&rdquo; —{" "}
                <strong>yes, but only in the long form</strong>{" "}
                <code>&lt;React.Fragment key={"{id}"}&gt;</code>; the shorthand{" "}
                <code>&lt;&gt;</code> accepts no attributes at all.{" "}
                <strong>
                  You need this whenever a list renders several sibling elements per item
                </strong>
                , and it is the shorthand&rsquo;s only limitation.
              </p>
            </>
          ),
          code: [
            demo(
              "jsx",
              `// ✗ tr 里多一层 div：非法 HTML，布局会坏
<tr><div><td>A</td><td>B</td></div></tr>

// ✓
<tr><><td>A</td><td>B</td></></tr>

// 列表里要 key，就不能用简写
{rows.map((r) => (
  <React.Fragment key={r.id}>
    <dt>{r.term}</dt>
    <dd>{r.desc}</dd>
  </React.Fragment>
))}`,
              { filename: "Fragment 的两个真实场景" },
            ),
          ],
        },
        {
          id: "q335",
          heading: "什么是 HOC",
          lede: "#335 What is HOC",
          body: (
            <>
              <p>
                <strong>一句话：</strong>高阶组件 ——
                <strong>接收一个组件、返回一个增强后的新组件</strong>
                的函数。它是「复用组件逻辑」的老方案。
              </p>
              <p>
                <code>withRouter</code>、
                <code>connect</code>（Redux）、
                <code>withStyles</code> 都是 HOC。
                本质就是 #292 的高阶函数用在组件上。
              </p>
              <p>
                <strong>三个必须注意的点（考点在这）：</strong>
              </p>
              <ul>
                <li>
                  <strong>要透传 props</strong>——
                  <code>{"<Comp {...props} />"}</code>，
                  不然把原来的 props 吞了。
                </li>
                <li>
                  <strong>要拷贝静态方法</strong>——
                  包一层之后原组件的静态属性丢了
                  （<code>hoist-non-react-statics</code> 干这事）。
                </li>
                <li>
                  <strong>ref 传不进去</strong>——
                  要用 <code>forwardRef</code>。
                </li>
              </ul>
              <p>
                <strong>为什么现在少用了（这才是重点）：</strong>
              </p>
              <ul>
                <li>
                  <strong>wrapper 地狱</strong>——
                  叠三四层之后 DevTools 里全是嵌套，
                  难调试。
                </li>
                <li>
                  <strong>props 来源不明</strong>——
                  组件里出现一个 <code>user</code> prop，
                  你不知道是哪个 HOC 注进来的。
                </li>
                <li>
                  <strong>命名冲突</strong>——
                  两个 HOC 都注入 <code>data</code> 就打架了。
                </li>
              </ul>
              <p>
                <strong>自定义 hook 解决了全部三条</strong>：
                平铺、来源显式
                （<code>const user = useUser()</code>
                一眼看出来）、
                名字由你决定。<strong>所以现在优先写 hook。</strong>
              </p>
              <p>
                <strong>会追问：</strong>「那 HOC 还有用吗？」——
                有两个 hook 替代不了的场合：
                <strong>需要「包裹」渲染结果</strong>
                （比如给所有页面套一层错误边界或布局）、
                以及<strong>要改写 props 后再传给一个你无法修改的组件</strong>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> a higher-order component — a function that{" "}
                <strong>takes a component and returns an enhanced one</strong>. It is the
                old answer to reusing component logic.
              </p>
              <p>
                <code>withRouter</code>, <code>connect</code> (Redux) and{" "}
                <code>withStyles</code> are all HOCs. It is nothing more than the
                higher-order function from #292 applied to components.
              </p>
              <p>
                <strong>Three things you must get right — the marks are here:</strong>
              </p>
              <ul>
                <li>
                  <strong>Forward the props</strong> —{" "}
                  <code>{"<Comp {...props} />"}</code>, or you swallow the ones the
                  component already had.
                </li>
                <li>
                  <strong>Copy the statics</strong> — wrapping loses the original
                  component&rsquo;s static properties (
                  <code>hoist-non-react-statics</code> exists for this).
                </li>
                <li>
                  <strong>Refs do not pass through</strong> — you need{" "}
                  <code>forwardRef</code>.
                </li>
              </ul>
              <p>
                <strong>Why it fell out of favour — this is the real point:</strong>
              </p>
              <ul>
                <li>
                  <strong>Wrapper hell</strong> — stack three or four and DevTools is
                  nothing but nesting; debugging hurts.
                </li>
                <li>
                  <strong>Props of unknown origin</strong> — a <code>user</code> prop shows
                  up in the component and you cannot tell which HOC injected it.
                </li>
                <li>
                  <strong>Name collisions</strong> — two HOCs both injecting{" "}
                  <code>data</code> fight each other.
                </li>
              </ul>
              <p>
                <strong>Custom hooks fix all three</strong>: they stay flat, the origin is
                explicit (<code>const user = useUser()</code> says it out loud), and you
                choose the name. <strong>So hooks come first now.</strong>
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Is there still a use for HOCs?&rdquo; —
                two places hooks cannot cover:{" "}
                <strong>when you need to wrap the rendered output</strong> (putting an error
                boundary or a layout around every page), and{" "}
                <strong>
                  when you have to rewrite props before handing them to a component you
                  cannot modify
                </strong>
                .
              </p>
            </>
          ),
          code: [
            demo(
              "jsx",
              `// HOC
function withAuth(Comp) {
  return function Wrapped(props) {
    const user = useUser();
    if (!user) return <Login />;
    return <Comp {...props} user={user} />;   // 记得透传 props
  };
}

// 同一件事用 hook：平的，而且来源一眼看得出
function Page() {
  const user = useUser();          // ← 明确知道 user 从哪来
  if (!user) return <Login />;
  return <Content user={user} />;
}`,
              { filename: "HOC 与 hook 的对比" },
            ),
          ],
        },
      ],
      transfer: [
        { signal: "问生命周期怎么迁移", reachFor: "didMount→[]、didUpdate→[dep]、willUnmount→return" },
        { signal: "「测量 DOM 后改样式闪一下」", reachFor: "换 useLayoutEffect" },
        { signal: "兄弟组件要共享数据", reachFor: "状态提升到最近共同父级" },
        { signal: "中间层被迫透传 props", reachFor: "先试 children 组合，超过三四层再上 Context" },
        { signal: "「输入框打字没反应」", reachFor: "传了 value 没传 onChange" },
        { signal: "「从非受控变成受控」警告", reachFor: "初始值别用 undefined，用 \"\"" },
        { signal: "加了 memo 却没效果", reachFor: "props 里有新引用，配 useMemo/useCallback" },
        { signal: "tr 或 flex 容器里要返回多个元素", reachFor: "Fragment；要 key 就用完整写法" },
      ],
      recap: [
        "函数组件胜出的真正原因：逻辑按关注点组织、复用不用套娃、没有 this 问题。",
        "三个 willXxx 生命周期被废弃，因为 Fiber 的 render 阶段可能重跑。",
        "useEffect 不是生命周期替代品，是「声明副作用依赖什么」；[] 版在绘制后执行，不完全等于 didMount。",
        "props 只读是因为渲染函数必须纯；能算出来的都别存。",
        "通信五种：props、回调、状态提升、Context、状态库；层数深不等于该上 Redux。",
        "默认用受控；file 输入只能非受控；初始值写 \"\" 别写 undefined。",
        "PureComponent / memo 是浅比较，必须配不可变更新与稳定引用才有意义。",
        "Fragment 解决 tr 和 flex 里多一层 div 的真实问题；要 key 得用完整写法。",
        "HOC 的三个毛病（wrapper 地狱、来源不明、命名冲突）都被自定义 hook 解决了。",
      ],
    },
  ],
};
