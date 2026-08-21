// 面试八股 —— HTML / CSS。
//
// 题目来自作者做过的题目（编号沿用原编号 #269 等），答案由 DrillLab 撰写。
// 这一门和另外三门不一样：它不对应任何源项目，所以代码块一律 demo()（「示意」）。
//
// 每道题的固定格式：
//   heading  中文问题
//   lede     英文原题 + 题库编号（面试官会照这个念）
//   body     一句话 → 展开 → 会追问什么

import type { Module } from "../types";
import { demo } from "../helpers";

export const ivBasics: Module = {
  id: "iv-basics",
  stage: "面试 · 第 1 部分",
  title: "HTML 与 CSS",
  titleEn: "HTML and CSS",
  summary:
    "13 道题。这两块最容易被轻视 —— 前端面试第一轮几乎必问，而且问的都是「你平时到底有没有想过为什么」。盒模型、Flex 与 Grid 的分工、事件冒泡与捕获、语义化标签、无障碍。",
  summaryEn:
    "13 questions. These two areas are the easiest to underestimate. The first round of a frontend interview almost always covers them, and the questions all check whether you have ever asked why. The box model, the division of work between Flex and Grid, event bubbling and capturing, semantic tags, and accessibility.",
  lessons: [
    /* ============================================================
       HTML
       ============================================================ */
    {
      id: "iv-html",
      title: "HTML 五问",
      titleEn: "5 questions on HTML",
      blurb: "块级与行内、事件冒泡与捕获、meta、语义化、无障碍。",
      blurbEn:
        "Block and inline elements, event bubbling and capturing, meta tags, semantic elements, accessibility.",
      minutes: 14,
      objectives: [
        "说清块级和行内元素的三处实际差别",
        "画出事件从 window 到目标再回到 window 的完整路径",
        "说明语义化标签除了「好看」之外的两个真实收益",
        "举出无障碍（a11y）的具体做法，而不是空谈概念",
      ],
      objectivesEn: [
        "Explain three real differences between block and inline elements",
        "Draw the full path of an event, from window down to the target and back up to window",
        "Name two real benefits of semantic elements beyond tidier markup",
        "Give concrete accessibility (a11y) practices instead of talking about the idea",
      ],
      whyForAssessment:
        "HTML 题是筛人题：答不上来直接出局，答得好也拿不到加分。所以目标不是讲深，而是每道都能在 30 秒内说清楚，并且举得出一个例子。事件冒泡/捕获那道除外 —— 它常被追问到事件委托和 React 的合成事件，值得往深里准备。",
      whyForAssessmentEn:
        "HTML questions are filters: missing one takes you out, and answering one well earns no extra credit. So the goal is not depth. The goal is to answer each one clearly in 30 seconds and give one example. Bubbling and capturing is the exception — it often leads on to event delegation and React synthetic events, so prepare that one in depth.",
      concepts: [
        {
          id: "q269",
          heading: "块级元素 vs 行内元素",
          headingEn: "Block elements vs inline elements",
          lede: "#269 Block element vs Inline element",
          body: (
            <>
              <p>
                <strong>一句话：</strong>块级元素独占一行、宽高可控；
                行内元素跟着文字流走、宽高由内容决定。
              </p>
              <p>
                具体差别就三处，记住这三条就够答：
              </p>
              <ul>
                <li>
                  <strong>换行</strong>—— 块级前后自动断行（<code>div</code>、
                  <code>p</code>、<code>h1</code>、<code>ul</code>）；
                  行内不断行（<code>span</code>、<code>a</code>、
                  <code>strong</code>、<code>img</code>）。
                </li>
                <li>
                  <strong>宽高</strong>—— 块级可以设 <code>width</code> /
                  <code>height</code>；行内设了<strong>不生效</strong>。
                </li>
                <li>
                  <strong>内外边距</strong>—— 块级四个方向都生效；
                  行内的<strong>上下 margin 不生效</strong>，
                  上下 padding 视觉上会溢出但不撑开行高。
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>「那 <code>inline-block</code> 呢？」
                —— 它是折中：不换行（像行内），但宽高和上下 margin 都生效（像块级）。
                导航按钮常用它。
              </p>
              <p>
                <strong>还会追问：</strong>「<code>img</code> 是行内元素，
                为什么能设宽高？」—— 因为它是
                <strong>替换元素（replaced element）</strong>，
                内容由外部资源决定，浏览器对它网开一面。
                <code>input</code>、<code>video</code> 同理。
                这个点答出来会加分。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> a block element takes the whole line and
                you can set its width and height; an inline element flows with the
                text and is sized by its content.
              </p>
              <p>There are exactly three differences worth remembering:</p>
              <ul>
                <li>
                  <strong>Line breaks</strong> — block elements break before and after
                  (<code>div</code>, <code>p</code>, <code>h1</code>, <code>ul</code>);
                  inline ones do not (<code>span</code>, <code>a</code>,{" "}
                  <code>strong</code>, <code>img</code>).
                </li>
                <li>
                  <strong>Width and height</strong> — settable on block elements,{" "}
                  <strong>ignored</strong> on inline ones.
                </li>
                <li>
                  <strong>Margin and padding</strong> — all four sides work on block
                  elements; on inline elements <strong>vertical margin does
                  nothing</strong>, and vertical padding overflows visually without
                  pushing the line apart.
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;What about{" "}
                <code>inline-block</code>?&rdquo; — it is the compromise: no line break
                (like inline) but width, height and vertical margin all work (like
                block). Nav buttons use it constantly.
              </p>
              <p>
                <strong>Also asked:</strong> &ldquo;<code>img</code> is inline, so why
                can you set its size?&rdquo; — because it is a{" "}
                <strong>replaced element</strong>: its content comes from an external
                resource, so the browser makes an exception. Same for{" "}
                <code>input</code> and <code>video</code>. Getting this one right
                scores points.
              </p>
            </>
          ),
        },
        {
          id: "q380",
          heading: "事件冒泡 vs 事件捕获",
          headingEn: "Event bubbling vs event capturing",
          lede: "#380 Event bubbling vs Event capturing",
          body: (
            <>
              <p>
                <strong>一句话：</strong>一次点击在 DOM 里走三段
                —— 先从 <code>window</code> 往下到目标（捕获），
                在目标上触发（目标阶段），再从目标往上回到
                <code>window</code>（冒泡）。
                <strong>捕获从外到内，冒泡从内到外。</strong>
              </p>
              <p>
                <code>addEventListener</code> 第三个参数决定你在哪一段听：
                默认 <code>false</code> 听冒泡，
                <code>true</code>（或 <code>{"{ capture: true }"}</code>）听捕获。
              </p>
              <p>
                <strong>为什么默认是冒泡？</strong>因为绝大多数时候你想知道的是
                「用户点了什么」，从内往外传最自然 ——
                而且这才让<strong>事件委托</strong>成为可能（见 #289）。
              </p>
              <p>
                <strong>会追问：</strong>「怎么阻止？」
              </p>
              <ul>
                <li>
                  <code>e.stopPropagation()</code>—— 别再往上（或往下）传了。
                </li>
                <li>
                  <code>e.stopImmediatePropagation()</code>—— 连
                  <strong>同一个元素上的其他监听器</strong>都别跑了。
                </li>
                <li>
                  <code>e.preventDefault()</code>—— 阻止的是
                  <strong>默认行为</strong>（链接跳转、表单提交），
                  和传播完全无关。这两个最容易混，别答错。
                </li>
              </ul>
              <p>
                <strong>还会追问：</strong>
                「有哪些事件不冒泡？」——<code>focus</code>、<code>blur</code>、
                <code>load</code>、<code>mouseenter</code>、
                <code>mouseleave</code>。
                需要委托时用它们的冒泡版：<code>focusin</code> /
                <code>focusout</code> / <code>mouseover</code> /
                <code>mouseout</code>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> a click travels the DOM in three phases —
                down from <code>window</code> to the target (capture), fires on the
                target, then back up to <code>window</code> (bubble).{" "}
                <strong>Capture goes outside-in, bubbling goes inside-out.</strong>
              </p>
              <p>
                The third argument to <code>addEventListener</code> picks the phase you
                listen in: <code>false</code> (the default) is bubbling,{" "}
                <code>true</code> (or <code>{"{ capture: true }"}</code>) is capture.
              </p>
              <p>
                <strong>Why is bubbling the default?</strong> Because what you almost
                always want to know is &ldquo;what did the user click&rdquo;, and
                inside-out is the natural direction for that — it is also what makes{" "}
                <strong>event delegation</strong> possible (see #289).
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;How do you stop it?&rdquo;
              </p>
              <ul>
                <li>
                  <code>e.stopPropagation()</code> — stop travelling further up (or
                  down).
                </li>
                <li>
                  <code>e.stopImmediatePropagation()</code> — also skip{" "}
                  <strong>other listeners on the same element</strong>.
                </li>
                <li>
                  <code>e.preventDefault()</code> — cancels the{" "}
                  <strong>default behaviour</strong> (link navigation, form submit) and
                  has nothing to do with propagation. These two get mixed up most
                  often; do not confuse them.
                </li>
              </ul>
              <p>
                <strong>Also asked:</strong> &ldquo;Which events do not bubble?&rdquo; —
                <code>focus</code>, <code>blur</code>, <code>load</code>,{" "}
                <code>mouseenter</code>, <code>mouseleave</code>. When you need to
                delegate, use their bubbling counterparts:{" "}
                <code>focusin</code> / <code>focusout</code> /{" "}
                <code>mouseover</code> / <code>mouseout</code>.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `// <div id="outer"><div id="inner"><button id="btn">点我</button></div></div>

outer.addEventListener("click", () => console.log("outer 捕获"), true);
inner.addEventListener("click", () => console.log("inner 捕获"), true);
btn  .addEventListener("click", () => console.log("btn 目标"));
inner.addEventListener("click", () => console.log("inner 冒泡"));
outer.addEventListener("click", () => console.log("outer 冒泡"));

// 点击 btn 的输出顺序：
// outer 捕获 -> inner 捕获 -> btn 目标 -> inner 冒泡 -> outer 冒泡`,
              {
    codeEn: `// <div id="outer"><div id="inner"><button id="btn">Click me</button></div></div>

outer.addEventListener("click", () => console.log("outer capture"), true);
inner.addEventListener("click", () => console.log("inner capture"), true);
btn  .addEventListener("click", () => console.log("btn target"));
inner.addEventListener("click", () => console.log("inner bubble"));
outer.addEventListener("click", () => console.log("outer bubble"));

// Output order when btn is clicked:
// outer capture -> inner capture -> btn target -> inner bubble -> outer bubble`,
                filename: "三个阶段的完整顺序",
                explanation:
                  "面试里画得出这个顺序，基本就过了。注意目标元素上的监听器不分捕获/冒泡，按注册顺序执行。",
              },
            ),
          ],
        },
        {
          id: "q381",
          heading: "meta 标签有什么用",
          headingEn: "What is the meta tag for?",
          lede: "#381 What is the importance of the meta tag?",
          body: (
            <>
              <p>
                <strong>一句话：</strong><code>meta</code> 放的是
                「关于这个页面的信息」——
                浏览器、搜索引擎、社交平台读它，用户看不到它。
              </p>
              <p>
                真正天天用到的就四个，答这四个就够：
              </p>
              <ul>
                <li>
                  <code>{'<meta charset="UTF-8">'}</code>——
                  <strong>必须放在 head 最前面</strong>。
                  没有它中文会乱码，因为浏览器得先知道用什么编码去解析后面的字节。
                </li>
                <li>
                  <code>viewport</code>——
                  <strong>移动端适配的前提</strong>。
                  不写这一行，手机浏览器会假装自己有 980px 宽然后整页缩小，
                  你写的所有响应式 CSS 全白费（见 #274）。
                </li>
                <li>
                  <code>description</code>—— 搜索结果里那段摘要。
                  它<strong>不影响排名</strong>，但影响点击率。
                </li>
                <li>
                  <strong>Open Graph</strong>（<code>og:title</code>、
                  <code>og:image</code>）—— 链接分享到微信 / Slack /
                  Twitter 时显示的卡片。
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>「<code>keywords</code> 还有用吗？」
                —— 没用了，Google 早就不看，因为被滥用成了堆关键词。
                这个点能答出来说明你不是背的旧教程。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> <code>meta</code> carries information{" "}
                <em>about</em> the page — browsers, search engines and social platforms
                read it; users never see it.
              </p>
              <p>Only four of them actually matter day to day:</p>
              <ul>
                <li>
                  <code>{'<meta charset="UTF-8">'}</code> —{" "}
                  <strong>must be first in the head</strong>. Without it non-ASCII text
                  turns to mojibake, because the browser has to know the encoding before
                  it can parse the bytes that follow.
                </li>
                <li>
                  <code>viewport</code> —{" "}
                  <strong>the precondition for mobile</strong>. Without this line a
                  phone browser pretends it is 980px wide and scales the whole page
                  down, which throws away every responsive rule you wrote (see #274).
                </li>
                <li>
                  <code>description</code> — the snippet in search results. It{" "}
                  <strong>does not affect ranking</strong>, but it affects click-through.
                </li>
                <li>
                  <strong>Open Graph</strong> (<code>og:title</code>,{" "}
                  <code>og:image</code>) — the card shown when the link is shared into
                  Slack, Twitter or a chat app.
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;Does <code>keywords</code> still do
                anything?&rdquo; — no. Google stopped reading it long ago because it was
                abused into keyword stuffing. Knowing this shows you are not reciting an
                old tutorial.
              </p>
            </>
          ),
          code: [
            demo(
              "text",
              `<head>
  <meta charset="UTF-8">                                  <!-- 必须最先 -->
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="一句话说明这个页面是干什么的">
  <meta property="og:title" content="分享出去显示的标题">
  <meta property="og:image" content="https://…/cover.png">
  <title>页面标题</title>
</head>`,
              {
    codeEn: `<head>
  <meta charset="UTF-8">                                  <!-- must come first -->
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="one sentence on what this page is for">
  <meta property="og:title" content="the title shown when shared">
  <meta property="og:image" content="https://…/cover.png">
  <title>Page title</title>
</head>`, filename: "实际会写的那几行" },
            ),
          ],
        },
        {
          id: "q382",
          heading: "什么是语义化标签",
          headingEn: "What are semantic elements?",
          lede: "#382 What are Semantic Elements?",
          body: (
            <>
              <p>
                <strong>一句话：</strong>标签名本身说明了内容的角色 ——
                <code>header</code> / <code>nav</code> / <code>main</code> /
                <code>article</code> / <code>section</code> /
                <code>aside</code> / <code>footer</code>，
                而 <code>div</code> 和 <code>span</code> 什么都没说。
              </p>
              <p>
                <strong>关键是别答成「代码更好看」。</strong>
                语义化有两个可以量化的真实收益：
              </p>
              <ul>
                <li>
                  <strong>屏幕阅读器能导航。</strong>
                  视障用户可以按「跳到主内容」「列出所有标题」来浏览 ——
                  这些功能<strong>依赖标签语义</strong>。
                  一整页 <code>div</code>，读屏软件只能从头念到尾。
                </li>
                <li>
                  <strong>搜索引擎知道哪块是正文。</strong>
                  <code>main</code> 里的内容权重高于 <code>aside</code>。
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「<code>section</code> 和 <code>div</code> 到底怎么选？」——
                判断标准是<strong>「这块内容有没有自己的标题」</strong>。
                有（能配一个 <code>h2</code>）就用 <code>section</code>；
                纯粹为了布局套一层就用 <code>div</code>。
                <strong>为了样式而套的容器就该是 <code>div</code></strong>，
                硬换成 <code>section</code> 反而污染了大纲。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> the tag name itself states the role of the
                content — <code>header</code> / <code>nav</code> / <code>main</code> /
                <code>article</code> / <code>section</code> / <code>aside</code> /
                <code>footer</code> — whereas <code>div</code> and <code>span</code> say
                nothing at all.
              </p>
              <p>
                <strong>Do not answer &ldquo;the code looks nicer&rdquo;.</strong>{" "}
                Semantics buys you two things you can actually measure:
              </p>
              <ul>
                <li>
                  <strong>Screen readers can navigate.</strong> A blind user can jump to
                  the main content or list every heading — and those features{" "}
                  <strong>depend on tag semantics</strong>. On a page of nothing but{" "}
                  <code>div</code>s, a screen reader can only read from the top.
                </li>
                <li>
                  <strong>Search engines know which part is the article.</strong>{" "}
                  Content in <code>main</code> weighs more than content in{" "}
                  <code>aside</code>.
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;So how do you choose between{" "}
                <code>section</code> and <code>div</code>?&rdquo; — the test is{" "}
                <strong>&ldquo;does this block have its own heading?&rdquo;</strong> If
                it does (you could give it an <code>h2</code>), use{" "}
                <code>section</code>. If it is a wrapper you added purely for layout,
                use <code>div</code>. <strong>A container that exists for styling should
                be a <code>div</code></strong> — forcing it to be a{" "}
                <code>section</code> just pollutes the document outline.
              </p>
            </>
          ),
        },
        {
          id: "q385",
          heading: "无障碍、可用性、包容性",
          headingEn: "Accessibility, usability and inclusion",
          lede: "#385 Could you explain accessibility, usability, and inclusion? Give some examples of each one in terms of web design.",
          body: (
            <>
              <p>
                <strong>一句话区分：</strong>
              </p>
              <ul>
                <li>
                  <strong>无障碍（accessibility, a11y）</strong>——
                  <strong>有障碍的人能不能用</strong>。视障、听障、
                  运动障碍、认知障碍。
                </li>
                <li>
                  <strong>可用性（usability）</strong>——
                  <strong>能用的人用得顺不顺</strong>。找得到、看得懂、不容易点错。
                </li>
                <li>
                  <strong>包容性（inclusion）</strong>——
                  <strong>范围够不够宽</strong>。老年人、网速慢的、
                  用小屏手机的、非母语用户、临时单手抱着孩子操作的。
                </li>
              </ul>
              <p>
                三者是<strong>包含关系</strong>：无障碍是包容性的一部分，
                可用性差的东西对所有人都差。
              </p>
              <p>
                <strong>每个给一个例子（面试要的就是例子）：</strong>
              </p>
              <ul>
                <li>
                  <strong>a11y</strong>：给 <code>img</code> 写
                  <code>alt</code>；表单 <code>label</code> 用
                  <code>htmlFor</code> 关联到 <code>input</code>；
                  <strong>保证键盘能 Tab 到所有交互元素</strong>，
                  并且焦点环别用 <code>outline: none</code> 删掉。
                </li>
                <li>
                  <strong>usability</strong>：按钮文字写「保存草稿」
                  而不是「提交」；表单报错指向出错的那个字段，
                  而不是页面顶部一句「表单有误」。
                </li>
                <li>
                  <strong>inclusion</strong>：正文对比度至少 4.5:1；
                  不用颜色作为唯一的信息载体
                  （红绿色盲看不出「红色是错的」，
                  <strong>要同时给图标或文字</strong>）；
                  首屏在 3G 下也能出内容。
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>「怎么测？」——
                键盘走一遍（不碰鼠标能不能完成主流程）、
                Chrome DevTools 的 Lighthouse 跑一次 a11y 评分、
                <code>axe</code> 插件扫一遍。说得出工具名比说概念更可信。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>The distinction in one line each:</strong>
              </p>
              <ul>
                <li>
                  <strong>Accessibility (a11y)</strong> —{" "}
                  <strong>can people with disabilities use it</strong>: vision, hearing,
                  motor, cognitive.
                </li>
                <li>
                  <strong>Usability</strong> —{" "}
                  <strong>how smoothly can people who can use it, use it</strong>: can
                  they find things, understand them, avoid mis-taps.
                </li>
                <li>
                  <strong>Inclusion</strong> —{" "}
                  <strong>how wide is the net</strong>: older users, slow connections,
                  small screens, non-native speakers, someone operating one-handed while
                  holding a child.
                </li>
              </ul>
              <p>
                The three <strong>nest</strong>: accessibility is part of inclusion, and
                anything with poor usability is worse for everyone.
              </p>
              <p>
                <strong>One example each — examples are what the interviewer wants:</strong>
              </p>
              <ul>
                <li>
                  <strong>a11y</strong>: write <code>alt</code> on images; tie a{" "}
                  <code>label</code> to its <code>input</code> with{" "}
                  <code>htmlFor</code>;{" "}
                  <strong>make sure Tab reaches every interactive element</strong> and
                  do not delete the focus ring with <code>outline: none</code>.
                </li>
                <li>
                  <strong>usability</strong>: label the button &ldquo;Save draft&rdquo;
                  rather than &ldquo;Submit&rdquo;; put the validation error on the field
                  that failed, not a generic banner at the top of the page.
                </li>
                <li>
                  <strong>inclusion</strong>: at least 4.5:1 contrast for body text;
                  never use colour as the only carrier of meaning (someone with red-green
                  colour blindness cannot see that &ldquo;red means wrong&rdquo;, so{" "}
                  <strong>add an icon or a word</strong>); make the first screen usable
                  on 3G.
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;How do you test it?&rdquo; — walk the
                main flow with the keyboard only; run Lighthouse&rsquo;s a11y audit in
                Chrome DevTools; scan with the <code>axe</code> extension. Naming the
                tools is more convincing than naming the concepts.
              </p>
            </>
          ),
        },
      ],
      transfer: [
        {
          signal: "问「为什么行内元素设不了高」",
          signalEn: "Asked why you cannot set the height of an inline element",
          reachFor: "行内跟文字流走；替换元素例外",
          reachForEn: "Inline elements follow the text flow; replaced elements are the exception",
        },
        {
          signal: "问事件顺序",
          signalEn: "Asked about the order events fire in",
          reachFor: "捕获从外到内 → 目标 → 冒泡从内到外",
          reachForEn: "Capture goes outside in, then the target, then bubbling goes inside out",
        },
        {
          signal: "混淆 stopPropagation / preventDefault",
          signalEn: "stopPropagation and preventDefault get mixed up",
          reachFor: "一个管传播，一个管默认行为",
          reachForEn: "One stops the event from travelling, the other stops the default action",
        },
        {
          signal: "问语义化的好处",
          signalEn: "Asked what semantic elements are good for",
          reachFor: "读屏能导航 + 搜索引擎分得清正文，别答「好看」",
          reachForEn: "Screen readers can navigate and search engines can tell where the main text is; do not answer that it looks tidier",
        },
        {
          signal: "问无障碍",
          signalEn: "Asked about accessibility",
          reachFor: "举具体例子：alt、label、键盘焦点、对比度",
          reachForEn: "Give concrete examples: alt text, label, keyboard focus, contrast",
        },
      ],
      recap: [
        "块级 vs 行内看三处：换行、宽高、上下 margin；img/input 是替换元素所以能设宽高。",
        "事件三阶段：捕获（外→内）→ 目标 → 冒泡（内→外）；默认监听冒泡。",
        "stopPropagation 管传播，preventDefault 管默认行为，两回事。",
        "meta 里真正重要的是 charset（防乱码）和 viewport（移动端前提）。",
        "语义化的收益是读屏导航和搜索权重，不是「代码好看」。",
        "无障碍 ⊂ 包容性；答题一定要给具体例子和测试工具。",
      ],
      recapEn: [
        "Block and inline differ in three places: starting a new line, width and height, and top and bottom margin; img and input are replaced elements, so they do take a width and height.",
        "An event has three phases: capture (outside in), target, then bubbling (inside out); a listener runs in the bubbling phase by default.",
        "stopPropagation stops the event from travelling, preventDefault stops the default action; they are two different things.",
        "The two meta tags that matter are charset, which keeps text from rendering as garbled characters, and viewport, without which mobile layout does not work.",
        "Semantic elements pay off in screen reader navigation and search ranking, not in tidier code.",
        "Accessibility is one part of inclusion; always answer with concrete examples and the tools you test with.",
      ],
    },

    /* ============================================================
       CSS
       ============================================================ */
    {
      id: "iv-css",
      title: "CSS 八问",
      titleEn: "8 questions on CSS",
      blurb: "盒模型、margin vs padding、Flex vs Grid、选择器、预处理器、响应式。",
      blurbEn: "The box model, margin vs padding, Flex vs Grid, selectors, preprocessors, responsive design.",
      minutes: 18,
      objectives: [
        "说清标准盒模型和 border-box 的差别，并解释为什么大家都改成后者",
        "在「一维排列」和「二维布局」之间正确地选 Flex 或 Grid",
        "背出选择器优先级的计算规则",
        "说明预处理器解决了什么、以及今天它的哪些功能已经被原生 CSS 取代",
      ],
      objectivesEn: [
        "Explain the difference between the standard box model and border-box, and why almost everyone switches to border-box",
        "Choose between Flex and Grid correctly: one direction, or rows and columns at the same time",
        "State the rule for computing selector specificity",
        "Say what a preprocessor solved, and which of its features plain CSS now covers",
      ],
      whyForAssessment:
        "CSS 题里只有两道有区分度：盒模型（考你有没有真的调过布局）和 Flex vs Grid（考你选型的判断）。其余几道是背诵题，但答错了很掉分。响应式那道常被追问到 rem / vw / 媒体查询断点怎么定。",
      whyForAssessmentEn:
        "Only two CSS questions really separate candidates: the box model, which shows whether you have ever had to fix a layout, and Flex vs Grid, which shows your judgement about which tool to pick. The rest are recall questions, but getting one wrong costs a lot. The responsive design question often leads on to rem, vw, and how you choose media query breakpoints.",
      concepts: [
        {
          id: "q271",
          heading: "什么是盒模型",
          headingEn: "What is the box model?",
          lede: "#271 What is the Box Model",
          body: (
            <>
              <p>
                <strong>一句话：</strong>每个元素都是一个盒子，
                由内到外四层：
                <strong>content → padding → border → margin</strong>。
              </p>
              <p>
                真正的考点是<strong>「width 到底量的是哪一段」</strong>：
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th><code>box-sizing</code></th>
                      <th><code>width: 200px</code> 指的是</th>
                      <th>加上 <code>padding: 20px</code> 后实际占</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>content-box</code>（默认）</td>
                      <td>只有 content</td>
                      <td><strong>240px</strong>（200 + 20 × 2）</td>
                    </tr>
                    <tr>
                      <td><code>border-box</code></td>
                      <td>content + padding + border</td>
                      <td><strong>200px</strong>，content 被挤到 160px</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>为什么现在几乎所有项目都全局改成
                <code>border-box</code>？</strong>
                因为「我说 200 宽就是 200 宽」符合直觉。
                默认那套会让你在做「三列各 33.3%」时，
                一加 padding 就换行 —— 这是新手最常撞的墙。
              </p>
              <p>
                <strong>会追问：</strong>「margin 属于盒子吗？」——
                <code>border-box</code> 也<strong>不包含 margin</strong>。
                margin 永远在盒子外面，是「盒子之间的距离」。
              </p>
              <p>
                <strong>还会追问 margin 折叠（margin collapse）：</strong>
                上下相邻的两个块级元素，上面的 <code>margin-bottom: 20px</code>
                和下面的 <code>margin-top: 30px</code>
                <strong>不会得到 50px，而是 30px</strong>（取较大值）。
                这也是很多人「怎么调都差一点」的原因。
                Flex 和 Grid 容器的子项<strong>不发生折叠</strong>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> every element is a box with four layers
                from the inside out: <strong>content → padding → border → margin</strong>.
              </p>
              <p>
                What is actually being tested is{" "}
                <strong>&ldquo;what exactly does width measure?&rdquo;</strong>
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th><code>box-sizing</code></th>
                      <th><code>width: 200px</code> means</th>
                      <th>with <code>padding: 20px</code> it occupies</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>content-box</code> (default)</td>
                      <td>content only</td>
                      <td><strong>240px</strong> (200 + 20 × 2)</td>
                    </tr>
                    <tr>
                      <td><code>border-box</code></td>
                      <td>content + padding + border</td>
                      <td><strong>200px</strong>; content is squeezed to 160px</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>Why does nearly every project switch to{" "}
                <code>border-box</code> globally?</strong> Because &ldquo;when I say 200
                wide I mean 200 wide&rdquo; matches intuition. The default makes three
                columns at 33.3% wrap the moment you add padding — the wall every
                beginner hits.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Is margin part of the box?&rdquo; —
                even <code>border-box</code> <strong>excludes margin</strong>. Margin is
                always outside; it is the distance <em>between</em> boxes.
              </p>
              <p>
                <strong>They will also ask about margin collapse:</strong> two adjacent
                block elements with <code>margin-bottom: 20px</code> and{" "}
                <code>margin-top: 30px</code>{" "}
                <strong>give you 30px, not 50px</strong> (the larger wins). This is why
                spacing so often ends up &ldquo;slightly off&rdquo;. Flex and grid
                children <strong>do not collapse</strong>.
              </p>
            </>
          ),
          code: [
            demo(
              "css",
              `/* 几乎每个项目开头都有这三行 */
*,
*::before,
*::after {
  box-sizing: border-box;
}`,
              {
    codeEn: `/* Almost every project starts with these three lines */
*,
*::before,
*::after {
  box-sizing: border-box;
}`, filename: "全局重置" },
            ),
          ],
        },
        {
          id: "q272",
          heading: "margin vs padding",
          lede: "#272 Margin vs Padding",
          body: (
            <>
              <p>
                <strong>一句话：</strong>padding 在边框<strong>里面</strong>，
                是「内容和边框的距离」；margin 在边框
                <strong>外面</strong>，是「这个盒子和别人的距离」。
              </p>
              <p>
                实际选哪个，看三条：
              </p>
              <ul>
                <li>
                  <strong>要不要背景色 / 点击区。</strong>
                  padding 属于元素本身，会被背景色覆盖、点它算点到元素；
                  margin 是空白，点不到。
                  <strong>按钮想加大点击区一定用 padding。</strong>
                </li>
                <li>
                  <strong>会不会折叠。</strong>
                  margin 会上下折叠，padding 永远不会。
                  想要「稳定的 20px 间距」用 padding 更可控。
                </li>
                <li>
                  <strong>负值。</strong>
                  margin 可以是负数（常用来做重叠、抵消父级 padding），
                  padding 不行。
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「<code>margin: 0 auto</code> 为什么能居中，
                <code>padding: auto</code> 为什么不行？」——
                margin 的 <code>auto</code> 会吃掉剩余空间并平分，
                padding 根本不支持 <code>auto</code>。
                而且这招只对<strong>设了宽度的块级元素</strong>有效。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> padding is <strong>inside</strong> the
                border — the gap between content and border; margin is{" "}
                <strong>outside</strong> — the gap between this box and everything else.
              </p>
              <p>Three things decide which one you reach for:</p>
              <ul>
                <li>
                  <strong>Background and hit area.</strong> Padding belongs to the
                  element, so the background paints over it and clicks on it count as
                  clicks on the element; margin is empty space you cannot click.{" "}
                  <strong>Always use padding to enlarge a button&rsquo;s hit area.</strong>
                </li>
                <li>
                  <strong>Collapsing.</strong> Vertical margins collapse; padding never
                  does. For a dependable 20px gap, padding is more predictable.
                </li>
                <li>
                  <strong>Negative values.</strong> Margin can be negative (used for
                  overlaps, or to cancel a parent&rsquo;s padding); padding cannot.
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;Why does{" "}
                <code>margin: 0 auto</code> centre something when{" "}
                <code>padding: auto</code> does nothing?&rdquo; —
                <code>auto</code> margins absorb the leftover space and split it evenly;
                padding does not support <code>auto</code> at all. And the trick only
                works on a <strong>block element with a set width</strong>.
              </p>
            </>
          ),
        },
        {
          id: "q273",
          heading: "Flexbox vs Grid",
          lede: "#273 Flexbox vs Grid",
          body: (
            <>
              <p>
                <strong>一句话：</strong>Flex 是<strong>一维</strong>的
                （一行或一列，内容驱动）；
                Grid 是<strong>二维</strong>的（同时管行和列，布局驱动）。
              </p>
              <p>
                <strong>怎么选，一个判断句就够：</strong>
                「我需要同时控制行和列的对齐吗？」
                要 → Grid；不要 → Flex。
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Flex</th>
                      <th>Grid</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>维度</td>
                      <td>一维</td>
                      <td>二维</td>
                    </tr>
                    <tr>
                      <td>谁决定尺寸</td>
                      <td><strong>内容</strong>（子项说我要多大）</td>
                      <td><strong>容器</strong>（我先划好格子，你往里放）</td>
                    </tr>
                    <tr>
                      <td>典型场景</td>
                      <td>
                        导航栏、按钮组、卡片内部的图文排列、
                        「左边文字右边按钮」
                      </td>
                      <td>
                        整页骨架（头/侧栏/主体/脚）、
                        商品瀑布流、日历、表单的标签列 + 输入列
                      </td>
                    </tr>
                    <tr>
                      <td>缺口</td>
                      <td>
                        <code>flex-wrap</code> 换行后
                        <strong>各行互不知道对方</strong>，对不齐
                      </td>
                      <td>要先想清楚格子，改结构比 Flex 麻烦</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>会追问：</strong>「能一起用吗？」——
                <strong>正常做法就是一起用</strong>：
                Grid 搭页面骨架，每个格子内部用 Flex 排内容。
                答「二选一」反而显得没实战过。
              </p>
              <p>
                <strong>还会追问 <code>flex: 1</code> 是什么：</strong>
                它是三个属性的简写 ——
                <code>flex-grow: 1; flex-shrink: 1; flex-basis: 0%</code>。
                意思是「剩余空间我来占，需要时也可以被压缩，
                初始尺寸按 0 算」。
                这就是「一个固定宽侧栏 + 一个自适应主体」最短的写法。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> Flex is <strong>one-dimensional</strong>{" "}
                (a row or a column, content-driven); Grid is{" "}
                <strong>two-dimensional</strong> (rows and columns together,
                layout-driven).
              </p>
              <p>
                <strong>One sentence decides it:</strong> &ldquo;Do I need to control
                alignment across rows <em>and</em> columns at once?&rdquo; Yes → Grid.
                No → Flex.
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Flex</th>
                      <th>Grid</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Dimensions</td>
                      <td>One</td>
                      <td>Two</td>
                    </tr>
                    <tr>
                      <td>Who decides size</td>
                      <td><strong>The content</strong> (items say how big they are)</td>
                      <td><strong>The container</strong> (cells first, content after)</td>
                    </tr>
                    <tr>
                      <td>Typical use</td>
                      <td>
                        Nav bars, button groups, image-plus-text inside a card,
                        &ldquo;text left, button right&rdquo;
                      </td>
                      <td>
                        Page skeleton (header / sidebar / main / footer), product grids,
                        calendars, label-column plus input-column forms
                      </td>
                    </tr>
                    <tr>
                      <td>Weakness</td>
                      <td>
                        After <code>flex-wrap</code>,{" "}
                        <strong>rows know nothing about each other</strong>, so nothing
                        lines up
                      </td>
                      <td>You must plan the cells; restructuring is more work</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>Follow-up:</strong> &ldquo;Can you use both?&rdquo; —{" "}
                <strong>using both is the normal answer</strong>: Grid for the page
                skeleton, Flex for the contents of each cell. Saying
                &ldquo;pick one&rdquo; suggests you have not shipped much.
              </p>
              <p>
                <strong>They will also ask what <code>flex: 1</code> means:</strong> it
                is shorthand for{" "}
                <code>flex-grow: 1; flex-shrink: 1; flex-basis: 0%</code> — &ldquo;I
                take the leftover space, I may be compressed, and my starting size counts
                as zero&rdquo;. That is the shortest way to write &ldquo;fixed sidebar
                plus fluid main area&rdquo;.
              </p>
            </>
          ),
          code: [
            demo(
              "css",
              `/* Grid 搭骨架 */
.layout {
  display: grid;
  grid-template-columns: 240px 1fr;      /* 侧栏固定，主体吃剩下的 */
  grid-template-rows: 56px 1fr;
  min-height: 100vh;
}

/* 格子内部用 Flex 排内容 */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* 「固定宽 + 自适应」的经典两行 */
.sidebar { flex: 0 0 240px; }   /* 不长不缩，就 240 */
.content { flex: 1; }           /* 剩下全归我 */`,
              {
    codeEn: `/* Grid for the skeleton */
.layout {
  display: grid;
  grid-template-columns: 240px 1fr;      /* sidebar fixed, main takes the rest */
  grid-template-rows: 56px 1fr;
  min-height: 100vh;
}

/* Flex for the content inside a cell */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* The classic two lines for "fixed width plus fill the rest" */
.sidebar { flex: 0 0 240px; }   /* never grows, never shrinks, stays 240 */
.content { flex: 1; }           /* takes everything that is left */`, filename: "实际项目里的分工" },
            ),
          ],
        },
        {
          id: "q383",
          heading: "CSS 选择器有哪些类型",
          headingEn: "What types of CSS selectors are there?",
          lede: "#383 What are the different types of CSS selectors?",
          body: (
            <>
              <p>
                <strong>一句话：</strong>按「选中什么」分五类 ——
                基础、组合、属性、伪类、伪元素。
              </p>
              <ul>
                <li>
                  <strong>基础</strong>：标签 <code>div</code>、
                  类 <code>.card</code>、id <code>#app</code>、
                  通用 <code>*</code>
                </li>
                <li>
                  <strong>组合</strong>：后代 <code>a b</code>（空格）、
                  直接子元素 <code>a &gt; b</code>、
                  紧邻兄弟 <code>a + b</code>、
                  后面所有兄弟 <code>a ~ b</code>
                </li>
                <li>
                  <strong>属性</strong>：<code>[type="text"]</code>、
                  <code>[href^="https"]</code>（开头）、
                  <code>[class*="btn"]</code>（包含）
                </li>
                <li>
                  <strong>伪类</strong>（状态）：<code>:hover</code>、
                  <code>:focus</code>、<code>:nth-child(2n)</code>、
                  <code>:not(.on)</code>、<code>:disabled</code>
                </li>
                <li>
                  <strong>伪元素</strong>（造出不存在的元素）：
                  <code>::before</code>、<code>::after</code>、
                  <code>::placeholder</code>、<code>::selection</code>
                </li>
              </ul>
              <p>
                <strong>会追问优先级怎么算</strong>——
                这才是真考点。按三位数比大小
                <strong>（id, class, 标签）</strong>，从左往右比，
                <strong>高位一个也顶不过低位一万个</strong>：
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>选择器</th>
                      <th>(id, class, 标签)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>div p</code></td>
                      <td>0, 0, 2</td>
                    </tr>
                    <tr>
                      <td><code>.card p</code></td>
                      <td>0, 1, 1</td>
                    </tr>
                    <tr>
                      <td><code>.card.on</code></td>
                      <td>0, 2, 0</td>
                    </tr>
                    <tr>
                      <td><code>#app p</code></td>
                      <td>1, 0, 1 ← 赢过上面所有</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                伪类算一个 class，伪元素算一个标签，
                <code>:not()</code> 本身不算分但<strong>括号里的算</strong>。
                行内 <code>style</code> 比任何选择器都高，
                <code>!important</code> 再高一层 ——
                <strong>但别把 <code>!important</code> 当解法</strong>，
                它通常说明选择器设计已经失控了。
              </p>
              <p>
                <strong>同分怎么办？</strong>后写的赢。
                这就是为什么覆盖第三方样式时，
                把自己的 CSS 放在后面加载往往就够了。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> five families, grouped by what they select
                — basic, combinator, attribute, pseudo-class, pseudo-element.
              </p>
              <ul>
                <li>
                  <strong>Basic</strong>: type <code>div</code>, class{" "}
                  <code>.card</code>, id <code>#app</code>, universal <code>*</code>
                </li>
                <li>
                  <strong>Combinators</strong>: descendant <code>a b</code> (space),
                  direct child <code>a &gt; b</code>, adjacent sibling{" "}
                  <code>a + b</code>, all following siblings <code>a ~ b</code>
                </li>
                <li>
                  <strong>Attribute</strong>: <code>[type=&quot;text&quot;]</code>,
                  <code>[href^=&quot;https&quot;]</code> (starts with),
                  <code>[class*=&quot;btn&quot;]</code> (contains)
                </li>
                <li>
                  <strong>Pseudo-classes</strong> (state): <code>:hover</code>,
                  <code>:focus</code>, <code>:nth-child(2n)</code>,
                  <code>:not(.on)</code>, <code>:disabled</code>
                </li>
                <li>
                  <strong>Pseudo-elements</strong> (invent an element):
                  <code>::before</code>, <code>::after</code>,
                  <code>::placeholder</code>, <code>::selection</code>
                </li>
              </ul>
              <p>
                <strong>The real question is specificity.</strong> Compare three numbers
                — <strong>(id, class, type)</strong> — left to right, and{" "}
                <strong>one high digit beats ten thousand low ones</strong>:
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Selector</th>
                      <th>(id, class, type)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td><code>div p</code></td><td>0, 0, 2</td></tr>
                    <tr><td><code>.card p</code></td><td>0, 1, 1</td></tr>
                    <tr><td><code>.card.on</code></td><td>0, 2, 0</td></tr>
                    <tr><td><code>#app p</code></td><td>1, 0, 1 ← beats all of the above</td></tr>
                  </tbody>
                </table>
              </div>
              <p>
                A pseudo-class counts as a class, a pseudo-element as a type, and{" "}
                <code>:not()</code> itself scores nothing but{" "}
                <strong>its argument does</strong>. Inline <code>style</code> outranks
                any selector, and <code>!important</code> outranks that — but{" "}
                <strong>do not treat <code>!important</code> as a solution</strong>; it
                usually means your selector design has already gone out of control.
              </p>
              <p>
                <strong>What if they tie?</strong> The one written later wins. That is
                why loading your own CSS after a third-party stylesheet is often all you
                need.
              </p>
            </>
          ),
        },
        {
          id: "q270",
          heading: "有几种方式引入 CSS",
          headingEn: "How many ways are there to include CSS in a project?",
          lede: "#270 How many ways to import CSS in your project",
          body: (
            <>
              <p>
                <strong>一句话：</strong>传统上三种 ——
                行内 <code>style</code> 属性、页内
                <code>&lt;style&gt;</code> 标签、外部
                <code>&lt;link&gt;</code> 文件（外加 CSS 里的
                <code>@import</code>）。
              </p>
              <p>
                <strong>但面试问这题，其实想听你说现代工程里的做法：</strong>
              </p>
              <ul>
                <li>
                  <strong>普通 import</strong>——
                  <code>{'import "./styles.css"'}</code>，
                  打包工具接管，全局生效。
                </li>
                <li>
                  <strong>CSS Modules</strong>——
                  <code>{'import s from "./x.module.css"'}</code>，
                  类名自动加哈希，<strong>天然不冲突</strong>。
                </li>
                <li>
                  <strong>CSS-in-JS</strong>（styled-components、emotion）——
                  样式写在 JS 里，能用 props 做条件样式。
                  代价是运行时开销。
                </li>
                <li>
                  <strong>原子化</strong>（Tailwind）——
                  不写 CSS，直接堆预设类名。
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「为什么不推荐 <code>@import</code>？」——
                因为它是<strong>串行</strong>的：
                浏览器要先下载并解析外层 CSS，
                才发现里面还有个 <code>@import</code>，再去下载。
                这形成了一条请求链，直接拖慢首屏。
                构建工具里的 <code>@import</code> 是编译期合并的，
                不算这个问题 —— 说清这个区别是加分项。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> traditionally three — an inline{" "}
                <code>style</code> attribute, an in-page <code>&lt;style&gt;</code> tag,
                an external file via <code>&lt;link&gt;</code> (plus
                <code>@import</code> from within CSS).
              </p>
              <p>
                <strong>But what the interviewer wants is how it is done in a modern
                build:</strong>
              </p>
              <ul>
                <li>
                  <strong>Plain import</strong> —{" "}
                  <code>{'import "./styles.css"'}</code>; the bundler takes over, styles
                  are global.
                </li>
                <li>
                  <strong>CSS Modules</strong> —{" "}
                  <code>{'import s from "./x.module.css"'}</code>; class names are
                  hashed, so <strong>collisions are impossible by construction</strong>.
                </li>
                <li>
                  <strong>CSS-in-JS</strong> (styled-components, emotion) — styles live
                  in JS, so props can drive them. The cost is runtime work.
                </li>
                <li>
                  <strong>Atomic</strong> (Tailwind) — you do not write CSS, you compose
                  preset class names.
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;Why is <code>@import</code>{" "}
                discouraged?&rdquo; — because it is <strong>serial</strong>: the browser
                must download and parse the outer stylesheet before it even discovers the
                <code>@import</code>, then fetch again. That request chain delays first
                paint. <code>@import</code> handled by a build tool is merged at compile
                time and does not have this problem — pointing out that distinction is
                what earns the marks.
              </p>
            </>
          ),
        },
        {
          id: "q275",
          heading: "什么是 SCSS",
          headingEn: "What is SCSS?",
          lede: "#275 What is SCSS",
          body: (
            <>
              <p>
                <strong>一句话：</strong>SCSS 是 Sass 的一种语法，
                <strong>CSS 的超集</strong>—— 合法的 CSS 就是合法的 SCSS，
                但它多了变量、嵌套、mixin、函数这些编程能力，
                最后编译成普通 CSS。
              </p>
              <p>
                <strong>Sass 和 SCSS 什么关系？</strong>
                同一个工具的两种写法：
                <code>.sass</code> 靠缩进、没有大括号和分号；
                <code>.scss</code> 长得像 CSS。
                <strong>现在基本都用 <code>.scss</code></strong>，
                因为可以直接把老 CSS 粘进来。
              </p>
              <p>
                <strong>核心能力四个：</strong>
                变量（<code>$brand: #2b6</code>）、
                嵌套（层级关系一眼看出来）、
                <code>@mixin</code> / <code>@include</code>（复用一组声明，可传参）、
                <code>@use</code> 拆文件。
              </p>
              <p>
                <strong>会追问（这题真正想考的）：</strong>
                「现在还需要它吗？」—— 老实说，需求少了很多：
                变量被<strong>原生 CSS 自定义属性</strong>
                （<code>--brand</code>）取代，而且原生的能在运行时改、
                能被 JS 读写、能跟着主题切换，
                <strong>比 SCSS 变量更强</strong>（本站的深色模式就是这么做的）。
                嵌套也已经进了 CSS 标准。
                <br />
                <strong>剩下真正还有价值的是 mixin 和循环生成</strong>。
                能这么答说明你知道边界在哪。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> SCSS is one of Sass&rsquo;s two syntaxes and
                a <strong>superset of CSS</strong> — valid CSS is valid SCSS — but it
                adds variables, nesting, mixins and functions, and compiles down to plain
                CSS.
              </p>
              <p>
                <strong>Sass vs SCSS?</strong> Two syntaxes for the same tool:
                <code>.sass</code> is indentation-based with no braces or semicolons;
                <code>.scss</code> looks like CSS.{" "}
                <strong><code>.scss</code> is what everyone uses now</strong>, because
                you can paste existing CSS straight in.
              </p>
              <p>
                <strong>Four core abilities:</strong> variables
                (<code>$brand: #2b6</code>), nesting (hierarchy visible at a glance),
                <code>@mixin</code> / <code>@include</code> (reuse a group of
                declarations, with arguments), and <code>@use</code> for splitting files.
              </p>
              <p>
                <strong>The follow-up this question really exists for:</strong> &ldquo;Do
                you still need it?&rdquo; — honestly, much less. Variables have been
                superseded by <strong>native CSS custom properties</strong>{" "}
                (<code>--brand</code>), and the native ones are{" "}
                <strong>strictly more capable</strong>: they live at runtime, JS can read
                and write them, and they follow theme switches (this site&rsquo;s dark
                mode works exactly that way). Nesting has landed in the CSS standard too.
                <br />
                <strong>What genuinely remains valuable is mixins and generated
                loops.</strong> Answering this way shows you know where the boundary is.
              </p>
            </>
          ),
          code: [
            demo(
              "css",
              `/* SCSS 变量：编译期就被替换掉，运行时改不了 */
$brand: #2b6cb0;
.btn { background: $brand; }

/* 原生自定义属性：运行时活着，JS 能改，能被主题覆盖 */
:root       { --brand: #2b6cb0; }
[data-theme="dark"] { --brand: #90cdf4; }   /* 换主题只改这一行 */
.btn        { background: var(--brand); }`,
              {
    codeEn: `/* An SCSS variable is replaced at compile time and cannot change at runtime */
$brand: #2b6cb0;
.btn { background: $brand; }

/* A native custom property is alive at runtime: JS can change it, a theme can override it */
:root       { --brand: #2b6cb0; }
[data-theme="dark"] { --brand: #90cdf4; }   /* switching theme changes only this line */
.btn        { background: var(--brand); }`, filename: "为什么原生变量更强" },
            ),
          ],
        },
        {
          id: "q384",
          heading: "CSS 预处理器的优缺点",
          headingEn: "What are the advantages and disadvantages of a CSS preprocessor?",
          lede: "#384 What is a CSS preprocessor? What are the advantages and disadvantages, if any, to using them over plain CSS?",
          body: (
            <>
              <p>
                <strong>一句话：</strong>预处理器是「用一种更强的语言写样式，
                再编译成 CSS」。Sass / Less / Stylus 都是。
              </p>
              <p>
                <strong>好处：</strong>变量集中管理、嵌套让结构清晰、
                mixin 复用、能循环生成（比如 <code>.mt-1</code> 到
                <code>.mt-10</code>）、能拆成很多小文件再合并。
              </p>
              <p>
                <strong>代价（面试重点问这半边）：</strong>
              </p>
              <ul>
                <li>
                  <strong>多一步构建</strong>。多一个依赖、多一份配置、
                  多一处可能出错的地方。
                </li>
                <li>
                  <strong>嵌套太容易写深。</strong>
                  一不注意就写出 <code>.a .b .c .d span</code>，
                  优先级越滚越高，最后只能靠
                  <code>!important</code> 收场。
                  <strong>这是预处理器最真实的坑</strong>——
                  实践里一般限制自己不超过三层。
                </li>
                <li>
                  <strong>调试要靠 source map。</strong>
                  DevTools 里看到的是编译产物，行号对不上。
                </li>
                <li>
                  <strong>门槛。</strong>新人得先学一套额外语法。
                </li>
              </ul>
              <p>
                <strong>结论怎么说：</strong>
                「大项目、有设计系统、需要批量生成样式时值得；
                小项目用原生 CSS 加自定义属性就够，
                <strong>因为它当年解决的两个主要问题（变量、嵌套）
                原生已经支持了</strong>。」
                —— 有取舍的回答比一味夸好。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> a preprocessor lets you write styles in a
                more capable language and compiles them to CSS. Sass, Less and Stylus all
                qualify.
              </p>
              <p>
                <strong>Upsides:</strong> variables in one place, nesting that makes
                structure obvious, mixins for reuse, loops that generate families of
                rules (<code>.mt-1</code> through <code>.mt-10</code>), and splitting
                into many small files that get merged.
              </p>
              <p>
                <strong>Costs — this is the half they probe:</strong>
              </p>
              <ul>
                <li>
                  <strong>An extra build step.</strong> One more dependency, one more
                  config, one more place things break.
                </li>
                <li>
                  <strong>Nesting is far too easy to over-use.</strong> Before you notice
                  you have written <code>.a .b .c .d span</code>, specificity keeps
                  climbing, and the only way out is <code>!important</code>.{" "}
                  <strong>This is the preprocessor&rsquo;s most real trap</strong> — in
                  practice teams cap themselves at about three levels.
                </li>
                <li>
                  <strong>Debugging needs source maps.</strong> DevTools shows you the
                  compiled output and the line numbers do not match.
                </li>
                <li>
                  <strong>Onboarding cost.</strong> Newcomers must learn extra syntax.
                </li>
              </ul>
              <p>
                <strong>How to land the conclusion:</strong> &ldquo;Worth it on large
                projects with a design system and lots of generated styles; for small
                projects plain CSS plus custom properties is enough,{" "}
                <strong>because the two problems it originally solved — variables and
                nesting — are now native.</strong>&rdquo; A weighed answer beats
                unconditional praise.
              </p>
            </>
          ),
        },
        {
          id: "q274",
          heading: "什么是响应式设计，怎么做",
          headingEn: "What is responsive web design, and how do you build it?",
          lede: "#274 What is responsive web design and how to achieve this",
          body: (
            <>
              <p>
                <strong>一句话：</strong>一套代码在不同屏幕尺寸下
                都给出合适的排版，而不是给手机单独做一个站。
              </p>
              <p>
                <strong>四个手段，按重要性排：</strong>
              </p>
              <ul>
                <li>
                  <strong>viewport meta</strong>——
                  <strong>前提，没有它后面全白干</strong>（见 #381）。
                </li>
                <li>
                  <strong>弹性单位</strong>——
                  宽度用 <code>%</code> / <code>fr</code> /
                  <code>min()</code> / <code>clamp()</code>，
                  字号用 <code>rem</code>，别到处写死 <code>px</code>。
                  <code>clamp(16px, 4vw, 24px)</code>
                  一行就能做出「有上下限的流式字号」。
                </li>
                <li>
                  <strong>媒体查询</strong>——
                  <code>@media (max-width: 768px)</code> 改布局。
                </li>
                <li>
                  <strong>弹性布局</strong>——
                  <code>flex-wrap</code> 和
                  <code>grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))</code>
                  ，很多时候<strong>一行都不用写媒体查询</strong>就自适应了。
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>「断点怎么定？」——
                正确答案是<strong>「按内容定，不是按设备定」</strong>：
                把浏览器慢慢拉窄，哪里开始难看就在哪里加断点。
                追着 iPhone 型号列表定断点是过时做法，
                因为设备尺寸年年变。
              </p>
              <p>
                <strong>还会追问 mobile-first：</strong>
                默认样式写窄屏，用 <code>min-width</code> 往上加。
                好处是移动端加载的 CSS 最少，
                而且「加东西」比「删东西」好写 ——
                用 <code>max-width</code> 往下覆盖经常要反复清理属性。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> one codebase that lays out sensibly at any
                screen size — rather than building a separate mobile site.
              </p>
              <p><strong>Four techniques, most important first:</strong></p>
              <ul>
                <li>
                  <strong>The viewport meta tag</strong> —{" "}
                  <strong>the precondition; without it nothing else matters</strong>{" "}
                  (see #381).
                </li>
                <li>
                  <strong>Flexible units</strong> — widths in <code>%</code> /
                  <code>fr</code> / <code>min()</code> / <code>clamp()</code>, font sizes
                  in <code>rem</code>; stop hard-coding <code>px</code> everywhere.{" "}
                  <code>clamp(16px, 4vw, 24px)</code> gives you a fluid font size with
                  hard limits in a single line.
                </li>
                <li>
                  <strong>Media queries</strong> —{" "}
                  <code>@media (max-width: 768px)</code> to change layout.
                </li>
                <li>
                  <strong>Flexible layout</strong> — <code>flex-wrap</code> and{" "}
                  <code>grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))</code>{" "}
                  often adapt <strong>without a single media query</strong>.
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;How do you choose breakpoints?&rdquo; —
                the right answer is{" "}
                <strong>&ldquo;from the content, not from device sizes&rdquo;</strong>:
                drag the window narrower and add a breakpoint wherever it starts looking
                wrong. Chasing a list of iPhone dimensions is outdated, because device
                sizes change every year.
              </p>
              <p>
                <strong>They will also ask about mobile-first:</strong> write the narrow
                layout as the default and add to it with <code>min-width</code>. Mobile
                then downloads the least CSS, and &ldquo;adding&rdquo; is easier to
                reason about than &ldquo;undoing&rdquo; — overriding downwards with{" "}
                <code>max-width</code> usually means repeatedly resetting properties.
              </p>
            </>
          ),
          code: [
            demo(
              "css",
              `/* 不写一行媒体查询的自适应网格 */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

/* 有上下限的流式字号 */
h1 { font-size: clamp(24px, 5vw, 44px); }

/* mobile-first：默认窄屏，往上加 */
.layout { display: block; }
@media (min-width: 768px) {
  .layout { display: grid; grid-template-columns: 240px 1fr; }
}`,
              {
    codeEn: `/* A responsive grid without a single media query */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

/* A fluid font size with an upper and lower bound */
h1 { font-size: clamp(24px, 5vw, 44px); }

/* mobile-first: narrow by default, add from there upwards */
.layout { display: block; }
@media (min-width: 768px) {
  .layout { display: grid; grid-template-columns: 240px 1fr; }
}`, filename: "现在真正会写的响应式" },
            ),
          ],
        },
      ],
      transfer: [
        {
          signal: "「三列 33.3% 一加 padding 就换行」",
          signalEn: "Three columns at 33.3% wrap onto a new line as soon as you add padding",
          reachFor: "box-sizing: border-box",
          reachForEn: "box-sizing: border-box",
        },
        {
          signal: "「间距怎么调都差一点」",
          signalEn: "The spacing stays slightly off no matter what you set",
          reachFor: "margin 折叠，改用 padding 或 gap",
          reachForEn: "Margins are collapsing; use padding or gap instead",
        },
        {
          signal: "要同时对齐行和列",
          signalEn: "You need to align rows and columns at the same time",
          reachFor: "Grid；只排一行/一列用 Flex",
          reachForEn: "Grid; use Flex when there is only one row or one column",
        },
        {
          signal: "「固定侧栏 + 自适应主体」",
          signalEn: "A fixed-width sidebar next to a main area that fills the rest",
          reachFor: "flex: 0 0 240px 配 flex: 1",
          reachForEn: "flex: 0 0 240px on one side, flex: 1 on the other",
        },
        {
          signal: "样式覆盖不掉",
          signalEn: "A style will not override another one",
          reachFor: "先算 (id, class, 标签) 优先级，别直接上 !important",
          reachForEn: "Count specificity as (id, class, tag) first; do not reach for !important",
        },
        {
          signal: "问要不要用 SCSS",
          signalEn: "Asked whether to use SCSS",
          reachFor: "变量和嵌套原生已有，剩 mixin 和循环生成还值钱",
          reachForEn: "Plain CSS already has variables and nesting; mixins and generating rules in a loop are what is still worth it",
        },
        {
          signal: "问断点怎么定",
          signalEn: "Asked how to choose breakpoints",
          reachFor: "按内容定，不按设备型号定",
          reachForEn: "Choose them by where the content breaks, not by device model",
        },
      ],
      recap: [
        "盒模型四层 content/padding/border/margin；border-box 让 width 包含 padding 和 border，margin 永远在外面。",
        "margin 会上下折叠、可以为负、点不到；padding 不折叠、不能为负、属于点击区。",
        "Flex 一维内容驱动，Grid 二维布局驱动；实战是 Grid 搭骨架 + Flex 排内容。",
        "优先级按 (id, class, 标签) 三位比大小，高位压倒低位；同分后写的赢。",
        "@import 会串行请求拖慢首屏，用 link 或构建工具合并。",
        "SCSS 的变量和嵌套已被原生 CSS 取代，mixin 和循环生成还有价值。",
        "响应式四件套：viewport meta、弹性单位、媒体查询、弹性布局；断点按内容定。",
      ],
      recapEn: [
        "The box model has four layers: content, padding, border, margin. With border-box, width includes padding and border; margin is always outside the width.",
        "Margin collapses vertically, can be negative, and is not clickable; padding never collapses, cannot be negative, and is part of the clickable area.",
        "Flex works in one direction and follows the content; Grid works in two and follows the layout. In practice: Grid for the page frame, Flex for the content inside it.",
        "Specificity compares three numbers, (id, class, tag), from left to right; a higher number wins outright, and on a tie the rule written later wins.",
        "@import makes requests one after another and slows the first paint; use link, or let the build tool merge the files.",
        "Plain CSS has taken over SCSS variables and nesting; mixins and generating rules in a loop are still worth having.",
        "Responsive design has four parts: the viewport meta tag, relative units, media queries, and a flexible layout; choose breakpoints by where the content breaks.",
      ],
    },
  ],
};
