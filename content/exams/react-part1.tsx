// React 考试 —— 模块 1 与 2：React 心智模型、Hooks 与数据流。
// 全部围绕 react-notes-app 的真实文件展开。
//
// 拆成 part1 / part2 / part3 三个文件只是为了单个文件不至于太长，
// 它们最后在 react.tsx 里被组装成同一个 Exam。

import { DataFlowDiagram } from "@/components/data-flow";
import type { Module } from "../types";
import { demo, real } from "../helpers";

/** React 的数据流：一次点击如何变成新界面 */
const RENDER_FLOW = (
  <DataFlowDiagram
    title="点一下 Delete，屏幕上少一行 —— 中间这五步"
    nodes={[
      { kind: "用户", title: "点击 Delete" },
      { kind: "子组件", title: "NoteItem" },
      { kind: "父组件", title: "NoteManager" },
      { kind: "React", title: "重新渲染" },
      { kind: "浏览器", title: "真实 DOM" },
    ]}
    frames={[
      {
        active: 0,
        detail: ["鼠标点在 id=2 那一行", undefined, "notes = [1, 2, 3]", undefined, "3 个 <tr>"],
        msg: "起点：用户点了第二行的 Delete。此刻 notes 里还是三条。",
      },
      {
        active: 1,
        detail: [undefined, "onClick={() => onDelete(note.id)}", "notes = [1, 2, 3]", undefined, "3 个 <tr>"],
        msg: (
          <>
            <code>NoteItem</code> 的 onClick 触发，调用从 props 拿到的{" "}
            <code>onDelete(2)</code>。注意 NoteItem 自己<strong>不改任何数据</strong>，
            它只是打了个电话上去。
          </>
        ),
      },
      {
        active: 2,
        detail: [undefined, undefined, "handleDelete(2)\nsetNotes(prev => prev.filter(...))", undefined, "3 个 <tr>"],
        msg: (
          <>
            <code>NoteManager</code> 的 <code>handleDelete</code> 执行，
            用 filter 算出新数组 <code>[1, 3]</code>，交给 <code>setNotes</code>。
            <strong>此刻屏幕还没变</strong>，notes 变量也还是旧值。
          </>
        ),
      },
      {
        active: 3,
        detail: [undefined, undefined, "notes = [1, 3]", "重新执行 NoteManager()\n拿到新 JSX", "3 个 <tr>"],
        msg: (
          <>
            React 记下新值，然后<strong>把 NoteManager 整个函数重新执行一遍</strong>。
            这一次 <code>notes</code> 是 <code>[1, 3]</code>，
            于是 <code>notes.map(...)</code> 只产出两个 NoteItem。
          </>
        ),
      },
      {
        active: 4,
        detail: [undefined, undefined, "notes = [1, 3]", "新旧 JSX 对比", "2 个 <tr> ✓"],
        msg: (
          <>
            React 对比新旧 JSX，发现少了一行，于是<strong>只删掉那一个
            <code>&lt;tr&gt;</code></strong>，别的节点原样保留。
            全程你没写一行 DOM 操作 —— 这就是 React 的价值。
          </>
        ),
      },
    ]}
  />
);

export const reactMentalModel: Module = {
  id: "react-mental-model",
  stage: "React · 第 1 部分",
  title: "React 心智模型",
  titleEn: "The React mental model",
  summary:
    "组件、props、state、事件、渲染。每一条都用 react-notes-app 里真实的组件当例子，不用虚构的 Counter。",
  summaryEn:
    "Components, props, state, events, rendering. Every example is a real component from react-notes-app, never an invented Counter.",
  lessons: [
    /* ---------- 2.1 ---------- */
    {
      id: "r-component",
      title: "组件就是一个返回界面的函数",
      titleEn: "A component is a function that returns what you see on screen",
      blurb: "从这个项目最短的两个文件开始：App.tsx 只有 5 行。",
      blurbEn: "Start with the two shortest files in this project: App.tsx is only 5 lines.",
      minutes: 11,
      objectives: [
        "说清「组件」在 React 里到底是什么",
        "看懂 JSX 里的标签、花括号、className",
        "知道组件名必须大写开头，以及为什么",
        "能画出这个项目的组件树",
      ],
      objectivesEn: [
        "Explain what a component actually is in React",
        "Read the tags, the curly braces, and className in JSX",
        "Know that a component name must start with a capital letter, and why",
        "Draw the component tree of this project",
      ],
      whyForAssessment:
        "Q1 的四个组件是给好的骨架，你要在里面填逻辑。填之前必须先看懂「谁渲染谁、数据从哪来」，否则会把代码写在错误的组件里。",
      whyForAssessmentEn:
        "In Q1 the four components are already written for you, and you add the logic inside them. Before you add anything, you have to see which component renders which, and where the data comes from. Otherwise you put the code in the wrong component.",
      sourceFiles: [
        { path: "react-notes-app/src/App.tsx", role: "整个应用的根组件，只有 5 行" },
        { path: "react-notes-app/src/components/NoteItem/index.tsx", role: "最简单的展示型组件" },
      ],
      concepts: [
        {
          id: "what-is-component",
          heading: "一个组件 = 一个返回 JSX 的函数",
          headingEn: "A component is a function that returns JSX",
          lede: "没有别的了。它不是类、不是模板、不是配置。",
          ledeEn: "That is all it is. Not a class, not a template, not a config file.",
          body: (
            <>
              <p>
                看这个项目里最短的文件。<code>App</code> 是一个普通的 JavaScript 函数，
                它没有参数，<code>return</code> 一个看起来像 HTML 的东西：
              </p>
              <p>
                那个 <code>&lt;NoteManager /&gt;</code> 不是 HTML 标签 ——
                HTML 里没有这个元素。它是在说「把 NoteManager 这个组件渲染在这里」。
                这种「在 JavaScript 里直接写标签」的语法叫
                <strong>JSX</strong>，它会被构建工具（这个项目里是 Vite）
                翻译成普通的函数调用。
              </p>
              <p>
                <strong>为什么组件名必须大写开头？</strong>
                因为 JSX 靠首字母区分两件事：小写开头（<code>&lt;div&gt;</code>、
                <code>&lt;input&gt;</code>）当成真实 HTML 标签；
                大写开头（<code>&lt;NoteManager /&gt;</code>）当成你的组件。
                写成 <code>&lt;noteManager /&gt;</code>，React 会去找一个叫
                notemanager 的 HTML 标签，然后什么都不显示 —— 而且<strong>不报错</strong>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Look at the shortest file in this project. <code>App</code> is a
                plain JavaScript function. It takes no arguments and{" "}
                <code>return</code>s something that looks like HTML:
              </p>
              <p>
                That <code>&lt;NoteManager /&gt;</code> is not an HTML tag —
                there is no such element in HTML. It says &ldquo;render the
                NoteManager component right here&rdquo;. Writing tags directly
                inside JavaScript like this is called{" "}
                <strong>JSX</strong>, and the build tool (Vite, in this project)
                turns it into ordinary function calls.
              </p>
              <p>
                <strong>Why must a component name start with a capital?</strong>
                Because JSX tells two things apart by that first letter: lowercase
                (<code>&lt;div&gt;</code>, <code>&lt;input&gt;</code>) means a real
                HTML tag; uppercase (<code>&lt;NoteManager /&gt;</code>) means your
                component. Write <code>&lt;noteManager /&gt;</code> and React goes
                hunting for an HTML tag called notemanager, then renders nothing —
                and <strong>says nothing about it</strong>.
              </p>
            </>
          ),
          code: [
            real(
              "tsx",
              `import NoteManager from "./components/NoteManager";

function App() {
  return <NoteManager />;
}

export default App;`,
              {
                filename: "src/App.tsx（全文）",
                sourceFile: "react-notes-app/src/App.tsx",
                explanation:
                  "这个文件唯一的作用是「把根组件指向 NoteManager」。Q1 的所有逻辑都不在这里 —— 别在这个文件里改东西。",
              },
            ),
          ],
        },
        {
          id: "jsx-rules",
          heading: "JSX 的几条硬规则",
          headingEn: "The rules JSX always enforces",
          body: (
            <>
              <p>
                看 <code>NoteItem</code>，这是这个项目里最纯粹的展示型组件。
                它把这些规则都用到了：
              </p>
              <ul>
                <li>
                  <strong>只能返回一个根元素。</strong>
                  这里返回的是一个 <code>&lt;tr&gt;</code>，里面包着四个
                  <code>&lt;td&gt;</code>。想并列返回两个同级元素，
                  要用 <code>&lt;&gt;...&lt;/&gt;</code> 包起来。
                </li>
                <li>
                  <strong>花括号 <code>{"{}"}</code> 是「切回 JavaScript」的开关。</strong>
                  <code>{"{note.title}"}</code> 的意思是「这里放
                  <code>note.title</code> 这个变量的值」。
                  写成 <code>note.title</code>（不带花括号）会原样显示这十个字符。
                </li>
                <li>
                  <strong>属性名用 camelCase，<code>class</code> 要写 <code>className</code>。</strong>
                  因为 <code>class</code> 是 JavaScript 的保留字。同理
                  <code>onclick</code> 要写 <code>onClick</code>。
                </li>
                <li>
                  <strong>自闭合标签必须带斜杠。</strong>
                  HTML 里 <code>&lt;input&gt;</code> 可以不闭合，JSX 里必须写
                  <code>&lt;input /&gt;</code>。
                </li>
              </ul>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Look at <code>NoteItem</code>, the purest display component in this
                project. It uses every one of these rules:
              </p>
              <ul>
                <li>
                  <strong>One root element only.</strong>{" "}
                  This one returns a single <code>&lt;tr&gt;</code> wrapping four
                  <code>&lt;td&gt;</code>. To return two siblings side by side, wrap
                  them in <code>&lt;&gt;...&lt;/&gt;</code>.
                </li>
                <li>
                  <strong>Braces <code>{"{}"}</code> switch you back into JavaScript.</strong>
                  <code>{"{note.title}"}</code> means &ldquo;put the value of{" "}
                  <code>note.title</code> here&rdquo;. Written as{" "}
                  <code>note.title</code> without braces, that text shows up on the
                  page literally.
                </li>
                <li>
                  <strong>Attributes are camelCase, and <code>class</code> becomes <code>className</code>.</strong>{" "}
                  Because <code>class</code> is a reserved word in JavaScript. Same
                  reason <code>onclick</code> is written <code>onClick</code>.
                </li>
                <li>
                  <strong>Self-closing tags need the slash.</strong>{" "}
                  HTML lets you leave <code>&lt;input&gt;</code> open; JSX makes you
                  write <code>&lt;input /&gt;</code>.
                </li>
              </ul>
            </>
          ),
          code: [
            real(
              "tsx",
              `import React from "react";
import type { Note } from "../../types/Note";

export interface NoteItemProps {
  note: Note;
  onDelete: (id: number) => void;
  onEdit: (note: Note) => void;
}

const NoteItem: React.FC<NoteItemProps> = ({ note, onDelete, onEdit }) => {
  return (
    <tr>
      <td>{note.title}</td>
      <td>{note.content}</td>
      <td>
        <button onClick={() => onEdit(note)} className="outlined">
          Edit
        </button>
      </td>
      <td>
        <button onClick={() => onDelete(note.id)} className="danger">
          Delete
        </button>
      </td>
    </tr>
  );
};

export default NoteItem;`,
              {
                filename: "src/components/NoteItem/index.tsx（全文）",
                sourceFile: "react-notes-app/src/components/NoteItem/index.tsx",
                highlight: [13, 14, 16, 21],
              },
            ),
          ],
        },
        {
          id: "component-tree",
          heading: "这个项目的组件树",
          headingEn: "The component tree of this project",
          lede: "四个组件，一条主干。记住这张图，Q1 的三道题就都有落点了。",
          ledeEn: "Four components, one main line. Remember this picture and each of the three Q1 tasks has a place to go.",
          body: (
            <>
              <p>
                <code>NoteManager</code> 在中间，它同时是 <code>NoteForm</code> 和
                <code>NoteTable</code> 的父组件。这个位置决定了它是<strong>唯一</strong>
                能同时影响表单和表格的地方 —— 所以三道题的代码全都写在它里面。
              </p>
              <p>
                <code>NoteTable</code> 和 <code>NoteItem</code> 都是纯展示的：
                它们不持有任何数据，只负责「把拿到的东西画出来」和
                「把用户的点击原样上报给上面」。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>NoteManager</code> sits in the middle: it is the parent of both{" "}
                <code>NoteForm</code> and{" "}
                <code>NoteTable</code>. That position makes it the{" "}
                <strong>only</strong> place that can touch the form and the table at
                the same time — which is why all three tasks are written inside it.
              </p>
              <p>
                <code>NoteTable</code> and <code>NoteItem</code> are pure display:
                they hold no data at all. They draw what they are handed, and pass
                the user&rsquo;s clicks straight back up.
              </p>
            </>
          ),
          code: [
            real(
              "text",
              `App                              只渲染 NoteManager
└── NoteManager                  ★ 拥有 notes[] 和 noteToEdit 两个 state
    ├── NoteForm                 拥有 title / content 两个局部 state
    │                            向上：onSubmit(note)
    │                            向下：noteToEdit（决定回填与按钮文字）
    └── NoteTable                纯展示：把 notes 摊成表格
        └── NoteItem × N         纯展示 + 上报 onEdit / onDelete`,
              { filename: "组件树", filenameEn: "Component tree" },
            ),
          ],
        },
        {
          id: "react-fc",
          heading: "React.FC 是什么",
          headingEn: "What React.FC is",
          body: (
            <>
              <p>
                这个项目里所有组件都写成
                <code>const X: React.FC&lt;XProps&gt; = ({"{...}"}) =&gt; {"{...}"}</code>。
              </p>
              <p>
                <code>React.FC</code> 是 React 提供的一个类型，
                全称 <strong>Function Component</strong>。
                <code>React.FC&lt;NoteItemProps&gt;</code> 的意思是：
                「这是一个函数组件，它的 props 类型是 <code>NoteItemProps</code>」。
              </p>
              <p>
                它不是必须的 —— 直接写
                <code>function NoteItem(props: NoteItemProps) {"{...}"}</code>
                完全等价。但这个项目统一用了 <code>React.FC</code>，
                <strong>你写的代码应该跟着项目的风格</strong>。
                考试不会因为风格扣分，但保持一致会让人觉得你读过代码。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Every component in this project is written as{" "}
                <code>const X: React.FC&lt;XProps&gt; = ({"{...}"}) =&gt; {"{...}"}</code>.
              </p>
              <p>
                <code>React.FC</code> is a type that React ships, short for{" "}
                <strong>Function Component</strong>.{" "}
                <code>React.FC&lt;NoteItemProps&gt;</code> says: &ldquo;this is a
                function component, and its props are typed{" "}
                <code>NoteItemProps</code>&rdquo;.
              </p>
              <p>
                It is not required —
                <code>function NoteItem(props: NoteItemProps) {"{...}"}</code>
                is exactly equivalent. But this project uses <code>React.FC</code>{" "}
                everywhere, and <strong>your code should follow the project</strong>.
                Nobody loses points for style, but matching it shows you read the
                code.
              </p>
            </>
          ),
        },
      ],
      exercises: [
        {
          kind: "recognition",
          id: "r-jsx-brace",
          title: "哪一行会把变量的值显示出来",
          titleEn: "Which line prints the value of a variable",
          level: 1,
          prompt: <p>下面哪一行会在页面上显示这条笔记的标题内容？</p>,
          promptEn: <p>Which line below shows the title of this note on the page?</p>,
          options: [
            { id: "a", label: "<td>note.title</td>" },
            { id: "b", label: "<td>{note.title}</td>" },
            { id: "c", label: "<td>${note.title}</td>" },
            { id: "d", label: '<td value="note.title" />' },
          ],
          answer: ["b"],
          explain: (
            <>
              花括号是「切回 JavaScript」的开关。A 会原样显示
              <code>note.title</code> 这十个字符；C 是模板字符串的语法，
              在 JSX 里不生效，会原样显示 <code>$&#123;note.title&#125;</code>；
              D 的 <code>value</code> 不是 <code>&lt;td&gt;</code> 的有效属性。
            </>
          ),
          explainEn: (
            <>
              Curly braces are the switch back into JavaScript. A prints the ten
              characters <code>note.title</code> as text. C is template string
              syntax, which does nothing in JSX, so it prints{" "}
              <code>$&#123;note.title&#125;</code> as text. In D,{" "}
              <code>value</code> is not a valid attribute on{" "}
              <code>&lt;td&gt;</code>.
            </>
          ),
        },
        {
          kind: "recognition",
          id: "r-where-code",
          title: "三道题的代码该写在哪个文件",
          titleEn: "Which file the code for the three tasks belongs in",
          level: 1,
          prompt: (
            <p>
              Q1 的三个任务（Add / Delete / Edit）都要改动笔记列表。
              这些逻辑主要写在哪个文件里？
            </p>
          ),
          promptEn: (
            <p>
              All three tasks in Q1 (Add / Delete / Edit) change the note list.
              Which file holds most of that logic?
            </p>
          ),
          options: [
            { id: "a", label: "src/App.tsx" },
            { id: "b", label: "src/components/NoteForm/index.tsx" },
            { id: "c", label: "src/components/NoteManager/index.tsx" },
            { id: "d", label: "src/components/NoteItem/index.tsx" },
          ],
          answer: ["c"],
          explain: (
            <>
              <code>notes</code> 这个 state 住在 <code>NoteManager</code> 里，
              而三道题都是在改这个列表。<code>NoteForm</code> 只负责收集输入并
              <code>onSubmit</code> 上报；<code>NoteItem</code> 只负责把点击
              <code>onEdit</code> / <code>onDelete</code> 上报。
              它们都不碰列表本身。
            </>
          ),
          explainEn: (
            <>
              The <code>notes</code> state lives in <code>NoteManager</code>, and
              all three tasks change that list. <code>NoteForm</code> only
              collects the input and reports it up through{" "}
              <code>onSubmit</code>. <code>NoteItem</code> only reports the
              clicks up through <code>onEdit</code> / <code>onDelete</code>.
              Neither one touches the list itself.
            </>
          ),
        },
      ],
      mistakes: [
        {
          wrong: demo(
            "tsx",
            `// ✗ 组件名小写开头 —— 页面上什么都不出现，而且不报错
function noteItem() { return <tr>...</tr>; }

export default function App() {
  return <noteItem />;   // React 当成 HTML 标签处理
}`,
            {
              codeEn: `// ✗ Name starts with a lowercase letter — nothing appears, and no error
function noteItem() { return <tr>...</tr>; }

export default function App() {
  return <noteItem />;   // React reads this as an HTML tag
}`,
            },
          ),
          why: (
            <>
              JSX 用首字母大小写区分「HTML 标签」和「你的组件」。
              小写开头会被当成一个不存在的 HTML 元素，
              浏览器默默忽略它。<strong>这类 bug 没有报错，只有空白</strong> ——
              看到「组件不显示但控制台干净」时，先检查首字母。
            </>
          ),
          whyEn: (
            <>
              JSX uses the first letter to tell an HTML tag apart from a
              component of your own. A lowercase name is read as an HTML
              element that does not exist, and the browser ignores it without
              saying anything. <strong>This kind of bug produces no error, only
              an empty area</strong> — when a component does not appear and the
              console is clean, check the first letter first.
            </>
          ),
        },
        {
          wrong: demo(
            "tsx",
            `// ✗ 返回了两个同级元素
return (
  <td>{note.title}</td>
  <td>{note.content}</td>
);`,
            {
              codeEn: `// ✗ Two sibling elements returned
return (
  <td>{note.title}</td>
  <td>{note.content}</td>
);`,
            },
          ),
          why: (
            <>
              JSX 只能返回一个根元素。这段会直接编译报错
              <code>JSX expressions must have one parent element</code>。
              解法是用真正的父元素（这里是 <code>&lt;tr&gt;</code>）
              或者空标签 <code>&lt;&gt;...&lt;/&gt;</code> 包起来。
            </>
          ),
          whyEn: (
            <>
              JSX can return only one root element. This code fails to compile
              with <code>JSX expressions must have one parent element</code>.
              Fix it by wrapping the elements in a real parent (here that is
              <code>&lt;tr&gt;</code>) or in an empty tag
              <code>&lt;&gt;...&lt;/&gt;</code>.
            </>
          ),
        },
      ],
      transfer: [
        {
          signal: "组件不显示但控制台干净",
          signalEn: "Component does not appear, but the console is clean",
          reachFor: "检查组件名是否大写开头",
          reachForEn: "Check that the component name starts with a capital letter",
        },
        {
          signal: "变量名原样显示在页面上",
          signalEn: "The variable name itself is printed on the page",
          reachFor: "漏了花括号",
          reachForEn: "The curly braces are missing",
        },
        {
          signal: "不知道逻辑该写在哪个组件",
          signalEn: "Not sure which component the logic belongs in",
          reachFor: "找持有相关 state 的那个组件",
          reachForEn: "Find the component that holds the related state",
        },
        {
          signal: "JSX expressions must have one parent",
          signalEn: "JSX expressions must have one parent",
          reachFor: "用 <>…</> 包住多个同级元素",
          reachForEn: "Wrap the sibling elements in <>…</>",
        },
      ],
      recap: [
        "组件就是返回 JSX 的普通函数，名字必须大写开头。",
        "花括号是切回 JavaScript 的开关；class 要写 className。",
        "JSX 只能返回一个根元素，需要并列时用 <>…</>。",
        "这个项目的组件树：App → NoteManager →（NoteForm + NoteTable → NoteItem）。",
        "NoteManager 是唯一能同时影响表单和表格的地方，三道题都落在它里面。",
      ],
      recapEn: [
        "A component is a plain function that returns JSX, and its name must start with a capital letter.",
        "Curly braces switch back to JavaScript; write className, not class.",
        "JSX can return only one root element. Use <>…</> when you need several elements side by side.",
        "The component tree here: App → NoteManager → (NoteForm + NoteTable → NoteItem).",
        "NoteManager is the only place that can affect the form and the table at the same time, so all three tasks land inside it.",
      ],
    },

    /* ---------- 2.2 ---------- */
    {
      id: "r-props",
      title: "props：数据往下流，事件往上报",
      titleEn: "props: data flows down, events go back up",
      blurb: "为什么 NoteItem 里的 Delete 按钮，最终改的是 NoteManager 里的数据。",
      blurbEn: "Why the Delete button inside NoteItem ends up changing data that lives in NoteManager.",
      minutes: 12,
      objectives: [
        "说清 props 是什么、方向是什么",
        "看懂「把函数当 props 传下去」这个模式",
        "分清 onClick={fn} 和 onClick={fn()} 的区别",
        "知道为什么子组件不能直接改父组件的数据",
      ],
      objectivesEn: [
        "Explain what props are and which direction they travel",
        "Read the pattern of passing a function down as props",
        "Tell onClick={fn} apart from onClick={fn()}",
        "Know why a child component cannot change the parent's data directly",
      ],
      whyForAssessment:
        "Q1 的三个任务全都是「子组件报告事件 → 父组件改 state」。props 传函数这个模式如果没想通，Delete 和 Edit 两题都会卡住。",
      whyForAssessmentEn:
        "All three Q1 tasks have the same shape: the child reports an event, then the parent changes state. If passing a function through props is not clear to you, both the Delete task and the Edit task will stop you.",
      sourceFiles: [
        { path: "react-notes-app/src/components/NoteTable/index.tsx", role: "把 props 原样往下传" },
        { path: "react-notes-app/src/components/NoteItem/index.tsx", role: "调用 props 里的函数上报" },
      ],
      concepts: [
        {
          id: "props-are-args",
          heading: "props 就是函数参数",
          headingEn: "props are just function arguments",
          lede: "组件是函数，props 是传给它的那个对象。",
          ledeEn: "A component is a function, and props is the object you pass to it.",
          body: (
            <>
              <p>
                写 <code>&lt;NoteItem note={"{n}"} onDelete={"{handleDelete}"} /&gt;</code>，
                等于调用 <code>NoteItem({"{ note: n, onDelete: handleDelete }"})</code>。
                <code>props</code> 没有任何魔法，就是一个普通对象。
              </p>
              <p>
                所以组件里那个 <code>({"{ note, onDelete, onEdit }"})</code>
                是在<strong>解构这个对象</strong> —— 上一门课讲过的解构语法。
              </p>
              <p>
                <strong>props 是只读的。</strong>子组件不许改它：
                <code>note.title = &quot;新标题&quot;</code> 这种写法
                在 React 里是禁止的（TypeScript 不一定拦得住你，
                但界面不会更新，而且会引入极难查的 bug）。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Writing <code>&lt;NoteItem note={"{n}"} onDelete={"{handleDelete}"} /&gt;</code>{" "}
                is the same as calling{" "}
                <code>NoteItem({"{ note: n, onDelete: handleDelete }"})</code>.
                There is no magic in <code>props</code> — it is an ordinary object.
              </p>
              <p>
                So that <code>({"{ note, onDelete, onEdit }"})</code> in the
                component is <strong>destructuring that object</strong> — the
                destructuring syntax from the previous course.
              </p>
              <p>
                <strong>props are read-only.</strong> A child is not allowed to
                change them:{" "}
                <code>note.title = &quot;a new title&quot;</code> is off limits in
                React (TypeScript will not always stop you, but the UI will not
                update and you have just bought yourself a bug that is very hard to
                find).
              </p>
            </>
          ),
        },
        {
          id: "one-way",
          heading: "数据单向往下：NoteTable 只是个中转站",
          headingEn: "Data goes one way, downward: NoteTable only passes it along",
          body: (
            <>
              <p>
                看 <code>NoteTable</code>。它收到 <code>notes</code>、
                <code>onDelete</code>、<code>onEdit</code> 三个 props，
                然后<strong>原样</strong>传给每一个 <code>NoteItem</code>。
                它自己什么都没改。
              </p>
              <p>
                这看起来很啰嗦 —— 为什么不让 <code>NoteItem</code>
                直接找 <code>NoteManager</code> 拿数据？
                因为 React 里<strong>没有这条路</strong>。
                数据只能一层一层往下传。这个限制听起来麻烦，
                但它换来一个巨大的好处：<strong>任何时候你都能顺着 props
                往上找到数据的源头</strong>。数据出错时，只需要沿着一条链排查。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Look at <code>NoteTable</code>. It receives three props —{" "}
                <code>notes</code>,{" "}
                <code>onDelete</code>, <code>onEdit</code> — and hands them{" "}
                <strong>straight through</strong> to every <code>NoteItem</code>. It
                changes nothing of its own.
              </p>
              <p>
                This looks like busywork — why not let <code>NoteItem</code>{" "}
                reach up to <code>NoteManager</code> for the data itself? Because
                React <strong>has no such path</strong>. Data travels down, one level
                at a time. The limit sounds annoying, and it buys you something big:{" "}
                <strong>you can always follow props upward to where the data comes
                from</strong>. When a value is wrong, there is exactly one chain to
                walk.
              </p>
            </>
          ),
          code: [
            real(
              "tsx",
              `const NoteTable: React.FC<NoteTableProps> = ({ notes, onDelete, onEdit }) => {
  return (
    <div className="card w-30 pt-30 pb-8 mt-2">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Content</th>
            <th>Edit</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody data-testid="notes-list">
          {notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};`,
              {
                filename: "src/components/NoteTable/index.tsx（节选）",
                sourceFile: "react-notes-app/src/components/NoteTable/index.tsx",
                highlight: [13, 16, 18, 19],
                explanation:
                  "注意第 13 行的 data-testid=\"notes-list\" —— 判卷测试就是靠它找到表格主体的。README 明确写了「不得修改任何 data-testid」。",
              },
            ),
          ],
        },
        {
          id: "callback-props",
          heading: "事件往上报：把函数当 props 传下去",
          headingEn: "Events are reported upward: pass a function down as props",
          lede: "这是 React 里子组件影响父组件的唯一正当方式。",
          ledeEn: "This is the only correct way for a child to affect its parent in React.",
          body: (
            <>
              <p>
                <code>NoteManager</code> 里定义了 <code>handleDelete</code>，
                然后把它<strong>作为 props 传下去</strong>。
                <code>NoteItem</code> 在按钮被点时调用它。
                于是发生了一件事：
                <strong>点击发生在最底层，state 修改发生在最顶层。</strong>
              </p>
              <p>
                这个模式的命名习惯是：<strong>props 叫 <code>onXxx</code>，
                处理函数叫 <code>handleXxx</code></strong>。
                这个项目严格遵守了它：
                <code>onDelete</code> ← <code>handleDelete</code>、
                <code>onEdit</code> ← <code>handleEdit</code>、
                <code>onSubmit</code> ← <code>handleSubmitNote</code>。
              </p>
              <p>
                <strong>props 的名字是契约。</strong>父组件写
                <code>onDelete={"{...}"}</code>，子组件就必须解构
                <code>onDelete</code>。写成 <code>onRemove</code>
                就对不上了 —— 而 TypeScript 会立刻报错，这是好事。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>NoteManager</code> defines <code>handleDelete</code>, then{" "}
                <strong>passes it down as a prop</strong>.{" "}
                <code>NoteItem</code> calls it when the button is clicked. Which
                means something worth noticing happens:{" "}
                <strong>the click is at the bottom, the state change is at the top.</strong>
              </p>
              <p>
                The naming habit is: <strong>the prop is called <code>onXxx</code>,
                the handler is called <code>handleXxx</code></strong>. This project
                follows it strictly:{" "}
                <code>onDelete</code> ← <code>handleDelete</code>,{" "}
                <code>onEdit</code> ← <code>handleEdit</code>,{" "}
                <code>onSubmit</code> ← <code>handleSubmitNote</code>.
              </p>
              <p>
                <strong>A prop name is a contract.</strong> The parent writes{" "}
                <code>onDelete={"{...}"}</code>, so the child has to destructure{" "}
                <code>onDelete</code>. Call it <code>onRemove</code>{" "}
                and the two no longer meet — and TypeScript complains on the spot,
                which is a good thing.
              </p>
            </>
          ),
          code: [
            real(
              "tsx",
              `// NoteManager（父）：定义处理函数，传下去
const handleDelete = (id: number) => {
  setNotes((prev) => prev.filter((note) => note.id !== id));
};

<NoteTable notes={notes} onDelete={handleDelete} onEdit={handleEdit} />

// NoteItem（孙）：点击时调用它
<button onClick={() => onDelete(note.id)} className="danger">
  Delete
</button>`,
              {
                filename: "一条完整的事件链",
                filenameEn: "One complete event chain",
                codeEn: `// NoteManager (the parent): define the handler, pass it down
const handleDelete = (id: number) => {
  setNotes((prev) => prev.filter((note) => note.id !== id));
};

<NoteTable notes={notes} onDelete={handleDelete} onEdit={handleEdit} />

// NoteItem (the grandchild): call it when the click happens
<button onClick={() => onDelete(note.id)} className="danger">
  Delete
</button>`,
                sourceFile:
                  "react-notes-app/src/components/NoteManager/index.tsx 与 NoteItem/index.tsx",
              },
            ),
          ],
        },
        {
          id: "fn-vs-call",
          heading: "onClick={fn} 和 onClick={fn()}：差一对括号，行为天差地别",
          headingEn: "onClick={fn} and onClick={fn()}: one pair of parentheses apart, and the behavior is completely different",
          lede: "这是新手最高频的错误之一，而且症状很奇怪。",
          ledeEn: "This is one of the most common beginner mistakes, and the symptom looks strange.",
          body: (
            <>
              <p>
                <code>onClick</code> 需要的是<strong>一个函数</strong> ——
                「以后被点的时候，请调用这个」。
              </p>
              <ul>
                <li>
                  <code>onClick={"{handleClick}"}</code> ✓
                  传的是函数本身。不需要参数时用这种。
                </li>
                <li>
                  <code>onClick={"{() => onDelete(note.id)}"}</code> ✓
                  传的是一个<strong>新造的</strong>函数，它被调用时才去调
                  <code>onDelete(note.id)</code>。
                  <strong>需要传参数时只能用这种。</strong>
                </li>
                <li>
                  <code>onClick={"{onDelete(note.id)}"}</code> ✗
                  这是<strong>立刻调用</strong>，然后把它的返回值
                  （<code>undefined</code>）交给 onClick。
                  结果：<strong>组件一渲染就触发删除</strong>，
                  而且真正点击时毫无反应。
                </li>
              </ul>
              <p>
                最后那种在这个项目里会造成什么？ <code>NoteTable</code>
                渲染时，每一行都会立刻调一次 <code>onDelete</code>，
                于是所有笔记在显示出来的瞬间就被删干净了 ——
                然后 state 变了触发重渲染，再删一遍……
                很可能直接卡死。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>onClick</code> wants <strong>a function</strong> —
                &ldquo;when this gets clicked later on, please call this&rdquo;.
              </p>
              <ul>
                <li>
                  <code>onClick={"{handleClick}"}</code> ✓
                  passes the function itself. Use it when no argument is needed.
                </li>
                <li>
                  <code>onClick={"{() => onDelete(note.id)}"}</code> ✓
                  passes a <strong>brand-new</strong> function that only calls{" "}
                  <code>onDelete(note.id)</code> once it runs.{" "}
                  <strong>This is the only way to pass an argument.</strong>
                </li>
                <li>
                  <code>onClick={"{onDelete(note.id)}"}</code> ✗
                  this <strong>calls it immediately</strong> and hands the return
                  value (<code>undefined</code>) to onClick. Result:{" "}
                  <strong>the delete fires the moment the component renders</strong>,
                  and an actual click does nothing at all.
                </li>
              </ul>
              <p>
                What would the last one do in this project? While{" "}
                <code>NoteTable</code> renders, every row calls{" "}
                <code>onDelete</code> once, so every note is wiped the instant it
                appears — then the state change triggers another render, which
                deletes again... it will most likely lock up.
              </p>
            </>
          ),
          code: [
            demo(
              "tsx",
              `<button onClick={onDelete(note.id)}>Delete</button>
{/*             ↑ 渲染时就执行了。React 收到的是 undefined。*/}

<button onClick={() => onDelete(note.id)}>Delete</button>
{/*             ↑ 收到一个函数。点击时才执行。这才是对的。*/}`,
            ),
          ],
        },
      ],
      exercises: [
        {
          kind: "fill-blank",
          id: "r-props-blanks",
          title: "补全 NoteItem 的两个按钮",
          titleEn: "Fill in the two buttons of NoteItem",
          level: 2,
          prompt: (
            <p>
              这是 <code>NoteItem</code> 真实的两个按钮。
              一个要传整条笔记，一个只传 id —— 想清楚各自要传什么，
              以及怎么才能「点击时才执行」。
            </p>
          ),
          promptEn: (
            <p>
              These are the two real buttons of <code>NoteItem</code>. One passes
              the whole note, the other passes only the id. Decide what each one
              has to pass, and how to make it run only on the click.
            </p>
          ),
          language: "tsx",
          filename: "src/components/NoteItem/index.tsx",
          sourceFile: "react-notes-app/src/components/NoteItem/index.tsx",
          template: `<td>
  <button onClick={___1___ onEdit(note)} className="outlined">
    Edit
  </button>
</td>
<td>
  <button onClick={() => onDelete(___2___)} className="danger">
    Delete
  </button>
</td>`,
          blanks: [
            {
              n: 1,
              accept: ["() =>", "()=>", "() = >"],
              hint: "要「点的时候才执行」，而且要传参数。",
              hintEn: "It has to run only on the click, and it has to pass an argument.",
              why: (
                <>
                  <code>() =&gt;</code>。需要传参数时，必须包一层箭头函数，
                  否则 <code>onEdit(note)</code> 会在渲染时立刻执行。
                  这里传的是<strong>整条 note</strong>，
                  因为 <code>NoteForm</code> 要用它的 title 和 content 回填表单。
                </>
              ),
              whyEn: (
                <>
                  <code>() =&gt;</code>. When you need to pass an argument you must
                  wrap it in an arrow function, otherwise{" "}
                  <code>onEdit(note)</code> runs right away during the render.
                  What gets passed here is <strong>the whole note</strong>,
                  because <code>NoteForm</code> needs its title and content to
                  prefill the form.
                </>
              ),
              width: 8,
            },
            {
              n: 2,
              accept: ["note.id"],
              hint: "看 onDelete 的类型：(id: number) => void。",
              hintEn: "Look at the type of onDelete: (id: number) => void.",
              why: (
                <>
                  <code>note.id</code>。<code>onDelete</code> 的类型签名是
                  <code>(id: number) =&gt; void</code>，只要 id。
                  README 也明确写了删除要<strong>「按 id」</strong>——
                  传整条 note 会类型报错，按 title 删则违反题目要求。
                </>
              ),
              whyEn: (
                <>
                  <code>note.id</code>. The type signature of{" "}
                  <code>onDelete</code> is <code>(id: number) =&gt; void</code>,
                  so it wants the id and nothing else. The README also says the
                  delete has to work <strong>by id</strong>. Passing the whole
                  note is a type error, and deleting by title breaks the
                  requirement.
                </>
              ),
              width: 9,
            },
          ],
        },
        {
          kind: "debug",
          id: "r-debug-immediate-call",
          title: "Debug Lab · 页面一打开，所有笔记就消失了",
          titleEn: "Debug Lab · every note disappears the moment the page opens",
          level: 2,
          prompt: (
            <p>
              添加两条笔记后刷新页面（假设有持久化），表格瞬间变空。
              有时候浏览器还会卡住。先判断类型，再找病灶。
            </p>
          ),
          promptEn: (
            <p>
              Add two notes, then reload the page (assume the notes are saved
              somewhere). The table goes empty at once, and sometimes the browser
              stops responding. First name the kind of error, then find the line
              that causes it.
            </p>
          ),
          errorOutput: `Warning: Maximum update depth exceeded. This can happen when a component
repeatedly calls setState inside componentWillUpdate or componentDidUpdate.
React limits the number of nested updates to prevent infinite loops.

（另一种表现：没有任何报错，但表格永远是空的）`,
          broken: demo(
            "tsx",
            `const NoteItem: React.FC<NoteItemProps> = ({ note, onDelete, onEdit }) => {
  return (
    <tr>
      <td>{note.title}</td>
      <td>{note.content}</td>
      <td>
        <button onClick={onEdit(note)} className="outlined">Edit</button>
      </td>
      <td>
        <button onClick={onDelete(note.id)} className="danger">Delete</button>
      </td>
    </tr>
  );
};`,
            {
              filename: "有问题的 NoteItem",
              filenameEn: "The NoteItem with the bug",
              highlight: [7, 10],
            },
          ),
          classify: {
            options: [
              { id: "a", label: "类型错误 —— props 类型写错了", labelEn: "A type error — the props types are wrong" },
              {
                id: "b",
                label: "事件处理器错误 —— 渲染时就调用了函数，而不是把函数传下去",
                labelEn: "An event handler error — the function is called during the render instead of being passed down",
              },
              { id: "c", label: "状态更新错误 —— 改了原数组", labelEn: "A state update error — the original array was changed" },
              { id: "d", label: "异步错误 —— 少了 await", labelEn: "An async error — an await is missing" },
            ],
            answer: "b",
          },
          locate: {
            question: "第 7 行和第 10 行错在哪？",
            questionEn: "What is wrong on line 7 and line 10?",
            options: [
              {
                id: "a",
                label: "少了一层箭头函数：应该是 onClick={() => onDelete(note.id)}",
                labelEn: "An arrow function wrapper is missing: it should be onClick={() => onDelete(note.id)}",
              },
              { id: "b", label: "应该写成 onclick 而不是 onClick", labelEn: "It should be onclick, not onClick" },
              { id: "c", label: "note.id 应该改成 note", labelEn: "note.id should be note" },
              { id: "d", label: "className 的位置不对", labelEn: "className is in the wrong place" },
            ],
            answer: "a",
          },
          fixed: real(
            "tsx",
            `<button onClick={() => onEdit(note)} className="outlined">
  Edit
</button>
...
<button onClick={() => onDelete(note.id)} className="danger">
  Delete
</button>`,
            {
              filename: "改对之后",
              filenameEn: "After the fix",
              sourceFile: "react-notes-app/src/components/NoteItem/index.tsx",
            },
          ),
          rootCause: (
            <>
              <p>
                <code>onClick={"{onDelete(note.id)}"}</code> 的花括号里是一个
                <strong>函数调用表达式</strong>，它在 JSX 求值时（也就是渲染时）
                就执行了。React 拿到的是它的返回值 <code>undefined</code>，
                所以真正点击时什么都不会发生。
              </p>
              <p>
                更糟的是：渲染 → 调用 onDelete → setState → 重渲染 → 又调用 onDelete，
                形成无限循环，于是 React 抛出
                <code>Maximum update depth exceeded</code>。
              </p>
              <p>
                记住这条判别法：<strong>onClick 后面的花括号里，
                要么是一个名字，要么是一个箭头函数。
                出现「名字 + 括号」就一定是错的。</strong>
              </p>
            </>
          ),
          rootCauseEn: (
            <>
              <p>
                Inside the curly braces of{" "}
                <code>onClick={"{onDelete(note.id)}"}</code> there is a{" "}
                <strong>function call</strong>, and it runs while the JSX is
                being evaluated — that is, during the render. React receives its
                return value, <code>undefined</code>, so an actual click does
                nothing.
              </p>
              <p>
                It gets worse: render, call onDelete, setState, render again,
                call onDelete again. That is an endless loop, and React throws{" "}
                <code>Maximum update depth exceeded</code>.
              </p>
              <p>
                Remember this rule of thumb:{" "}
                <strong>
                  inside the curly braces after onClick you write either a name
                  or an arrow function. A name followed by parentheses is always
                  wrong.
                </strong>
              </p>
            </>
          ),
          verify: "npx vitest run",
        },
      ],
      transfer: [
        {
          signal: "子组件要影响父组件的数据",
          signalEn: "A child needs to change the parent's data",
          reachFor: "父组件传一个 onXxx 函数下去",
          reachForEn: "The parent passes an onXxx function down",
        },
        {
          signal: "事件处理器要传参数",
          signalEn: "An event handler needs an argument",
          reachFor: "包一层箭头函数 () => fn(arg)",
          reachForEn: "Wrap it in an arrow function: () => fn(arg)",
        },
        {
          signal: "Maximum update depth exceeded",
          signalEn: "Maximum update depth exceeded",
          reachFor: "先查有没有在渲染时调用了处理函数",
          reachForEn: "First check whether a handler is called during render",
        },
        {
          signal: "点了按钮毫无反应",
          signalEn: "Clicking the button does nothing at all",
          reachFor: "查 onClick 里是不是写成了 fn() 而不是 fn",
          reachForEn: "Check whether onClick says fn() instead of fn",
        },
      ],
      recap: [
        "props 就是传给组件函数的那个对象，只读，只能从上往下传。",
        "子组件通过调用父组件传下来的 onXxx 函数来上报事件。",
        "命名习惯：props 叫 onXxx，父组件里的实现叫 handleXxx。",
        "需要传参数就包一层箭头函数；onClick={fn()} 会在渲染时立刻执行。",
        "props 名字是契约，两边必须一致 —— 好在 TypeScript 会替你检查。",
      ],
      recapEn: [
        "props is the object passed to the component function. It is read-only, and it only travels downward.",
        "A child reports an event by calling the onXxx function its parent passed down.",
        "Naming convention: the prop is called onXxx, and the implementation in the parent is called handleXxx.",
        "Wrap the call in an arrow function when you need to pass an argument; onClick={fn()} runs the moment the component renders.",
        "The prop name is a contract and has to match on both sides. TypeScript checks that for you.",
      ],
    },

    /* ---------- 2.3 ---------- */
    {
      id: "r-state",
      title: "useState：让界面跟着数据变",
      titleEn: "useState: making the screen follow the data",
      blurb: "两个 state 撑起了整道 Q1：notes 和 noteToEdit。",
      blurbEn: "Two pieces of state carry the whole of Q1: notes and noteToEdit.",
      minutes: 14,
      objectives: [
        "说清 useState 返回的两个东西各是什么",
        "知道为什么必须用 setter 而不能直接赋值",
        "会用函数式更新 setX(prev => ...) 并说清它比 setX(newValue) 好在哪",
        "看懂一次点击是怎么最终变成新界面的",
      ],
      objectivesEn: [
        "Explain what each of the two things useState returns is",
        "Know why you have to use the setter instead of assigning a new value",
        "Use the updater form setX(prev => ...) and say what makes it safer than setX(newValue)",
        "Follow how one click turns into a new screen",
      ],
      whyForAssessment:
        "Q1 的判卷标准就是「点了按钮之后界面对不对」。state 用错，四个测试全挂。这是整门考试最核心的一节。",
      whyForAssessmentEn:
        "Q1 is graded on one thing: is the screen correct after the button is clicked. Use state wrong and all four tests fail. This is the most important lesson in the whole exam.",
      sourceFiles: [
        {
          path: "react-notes-app/src/components/NoteManager/index.tsx",
          role: "两个 state 与三个 handler 的全部真实代码",
        },
      ],
      concepts: [
        {
          id: "why-state",
          heading: "普通变量为什么不行",
          headingEn: "Why a plain variable does not work",
          lede: "组件函数每次渲染都会重新执行一遍。普通变量活不过这一遍。",
          ledeEn: "The component function runs again on every render. A plain variable does not survive that.",
          body: (
            <>
              <p>
                这是理解 React 最关键的一件事：
                <strong>组件函数会被反复调用</strong>。
                每次界面需要更新，React 就把你的组件函数再执行一次，
                拿到新的 JSX，然后对比、更新真实 DOM。
              </p>
              <p>
                所以如果你在组件里写 <code>let notes = []</code>，
                那么每次重新渲染，这行都会重新执行，
                <code>notes</code> 又变回空数组。数据存不住。
              </p>
              <p>
                <code>useState</code> 解决的正是这个问题：
                它让 React <strong>在组件外部替你记住</strong>这个值，
                每次重新渲染时把上次的值交还给你。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                This is the most important thing to understand about React:{" "}
                <strong>your component function gets called again and again</strong>.
                Every time the UI needs to change, React runs your function once
                more, takes the new JSX, compares it, and updates the real DOM.
              </p>
              <p>
                So if you write <code>let notes = []</code> inside the component,
                that line runs again on every render and <code>notes</code> is back
                to an empty array. The data cannot survive.
              </p>
              <p>
                <code>useState</code> exists for exactly this problem: it asks React
                to <strong>remember the value outside your component</strong> and
                hand you last render&rsquo;s value each time it runs.
              </p>
            </>
          ),
          code: [
            demo(
              "tsx",
              `// ✗ 普通变量：每次渲染都被重置
const NoteManager = () => {
  let notes: Note[] = [];          // 每次渲染都是空数组
  const add = (n: Note) => { notes.push(n); };   // 加进去了，但下次渲染就没了
  ...
};

// ✓ useState：React 帮你记住
const NoteManager = () => {
  const [notes, setNotes] = useState<Note[]>([]);   // 初始值只在第一次生效
  ...
};`,
              {
                codeEn: `// ✗ A plain variable: reset on every render
const NoteManager = () => {
  let notes: Note[] = [];          // an empty array on every render
  const add = (n: Note) => { notes.push(n); };   // it goes in, and the next render loses it
  ...
};

// ✓ useState: React remembers it for you
const NoteManager = () => {
  const [notes, setNotes] = useState<Note[]>([]);   // the initial value only counts the first time
  ...
};`,
              },
            ),
          ],
        },
        {
          id: "usestate-shape",
          heading: "useState 返回一个数组，里面两样东西",
          headingEn: "useState returns an array with two things in it",
          body: (
            <>
              <p>
                <code>const [notes, setNotes] = useState&lt;Note[]&gt;([])</code>
                这一行做了三件事：
              </p>
              <ol>
                <li>
                  声明一块由 React 保管的状态，初始值 <code>[]</code>。
                  <strong>这个初始值只在第一次渲染时用</strong>，
                  之后的渲染会忽略它。
                </li>
                <li>
                  <code>notes</code> 拿到<strong>当前这次渲染</strong>看到的值。
                </li>
                <li>
                  <code>setNotes</code> 是<strong>唯一</strong>合法的修改途径。
                  调用它 = 告诉 React「值变了，请重新渲染」。
                </li>
              </ol>
              <p>
                <code>useState</code> 返回的是<strong>数组</strong>，
                所以用 <code>[a, b]</code> 这种数组解构，
                名字随你起（但习惯上是 <code>x</code> / <code>setX</code>）。
              </p>
              <p>
                真实项目里的两个 state：
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>const [notes, setNotes] = useState&lt;Note[]&gt;([])</code>{" "}
                does three things in one line:
              </p>
              <ol>
                <li>
                  Declares a slot of state that React looks after, starting at{" "}
                  <code>[]</code>.{" "}
                  <strong>That initial value is only used on the first render</strong>
                  ; every render after that ignores it.
                </li>
                <li>
                  <code>notes</code> holds the value{" "}
                  <strong>this particular render</strong> sees.
                </li>
                <li>
                  <code>setNotes</code> is the <strong>only</strong> legal way to
                  change it. Calling it means &ldquo;the value changed, please render
                  again&rdquo;.
                </li>
              </ol>
              <p>
                <code>useState</code> returns an <strong>array</strong>, which is why
                you take it apart with <code>[a, b]</code>. The names are yours to
                pick (though <code>x</code> / <code>setX</code> is the convention).
              </p>
              <p>
                The two pieces of state in the real project:
              </p>
            </>
          ),
          code: [
            real(
              "tsx",
              `const NoteManager: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);`,
              {
                filename: "src/components/NoteManager/index.tsx（开头）",
                sourceFile: "react-notes-app/src/components/NoteManager/index.tsx",
                explanation:
                  "noteToEdit 用 null 表示「现在不在编辑任何东西」。这个 state 是 Task 3 的核心 —— 它同时决定了「表单里显示什么」和「按钮上写 Add 还是 Update」。",
              },
            ),
          ],
        },
        {
          id: "functional-update",
          heading: "为什么用 setNotes(prev => ...) 而不是 setNotes([...notes, n])",
          headingEn: "Why setNotes(prev => ...) and not setNotes([...notes, n])",
          lede: "两种都能用。但前者在一种情况下明显更安全。",
          ledeEn: "Both forms work. But the first one is clearly safer in one situation.",
          body: (
            <>
              <p>
                <code>notes</code> 这个变量拿到的是
                <strong>当前这次渲染时的快照</strong>。
                如果你在同一个事件里连续调用两次 setter，
                第二次看到的 <code>notes</code> 还是旧的：
              </p>
              <p>
                而<strong>函数式更新</strong> <code>setNotes(prev =&gt; ...)</code>
                里的 <code>prev</code> 是 React 交给你的
                「此刻最新的值」，连续调用也不会丢。
              </p>
              <p>
                Q1 里其实不会连续调两次，所以两种写法都能过测试。
                但真实项目里的代码统一用了函数式更新 ——
                <strong>这是更稳的默认习惯，跟着写就对了</strong>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The <code>notes</code> variable holds{" "}
                <strong>a snapshot from this render</strong>. If you call the setter
                twice inside the same event, the second call still sees the old{" "}
                <code>notes</code>:
              </p>
              <p>
                With a <strong>functional update</strong> —{" "}
                <code>setNotes(prev =&gt; ...)</code> — the <code>prev</code> React
                hands you is &ldquo;the freshest value right now&rdquo;, so
                back-to-back calls lose nothing.
              </p>
              <p>
                Q1 never actually calls the setter twice in a row, so both styles
                pass the tests. But the real project uses functional updates
                everywhere —
                <strong>it is the steadier default, so just write it that way</strong>.
              </p>
            </>
          ),
          code: [
            demo(
              "tsx",
              `// 假设想一次加两条
setNotes([...notes, a]);   // notes 是旧的 → 结果 [a]
setNotes([...notes, b]);   // notes 还是旧的 → 结果 [b]，a 丢了

// 函数式更新
setNotes((prev) => [...prev, a]);   // prev = []      → [a]
setNotes((prev) => [...prev, b]);   // prev = [a]     → [a, b] ✓`,
              {
                codeEn: `// Say you want to add two notes at once
setNotes([...notes, a]);   // notes is the old value → result [a]
setNotes([...notes, b]);   // notes is still old     → result [b], a is gone

// Functional update
setNotes((prev) => [...prev, a]);   // prev = []      → [a]
setNotes((prev) => [...prev, b]);   // prev = [a]     → [a, b] ✓`,
              },
            ),
          ],
        },
        {
          id: "render-flow",
          heading: "一次点击的完整旅程",
          headingEn: "The full path of one click",
          lede: "把这条链走通，你就真的懂 React 了。",
          ledeEn: "Once you can follow this chain end to end, you really do understand React.",
          body: (
            <>
              <p>
                下面是「点 Delete 按钮」这一下，从手指到屏幕之间发生的全部事情。
                一步一步点过去。
              </p>
              {RENDER_FLOW}
              <p>
                关键在第 4 步：<strong>React 并不知道「哪一行被删了」</strong>。
                它只知道「state 变了」，于是把 <code>NoteManager</code>
                整个重新执行一遍，拿到新的 JSX，再和上一次的对比，
                最后只把真正变化的 DOM 改掉。
              </p>
              <p>
                所以你<strong>不需要</strong>手动去删 DOM 节点、
                不需要 <code>document.querySelector</code>。
                你只管改数据，界面自己跟上。
                这就是 React 的全部承诺。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Below is everything that happens between your finger and the screen
                when you press Delete. Step through it one frame at a time.
              </p>
              {RENDER_FLOW}
              <p>
                Step 4 is the one that matters:{" "}
                <strong>React has no idea which row was deleted</strong>. All it
                knows is that state changed, so it runs <code>NoteManager</code>{" "}
                again from the top, takes the new JSX, compares it with the previous
                one, and changes only the DOM that really differs.
              </p>
              <p>
                Which means you <strong>never</strong> remove DOM nodes by hand and
                never need <code>document.querySelector</code>. You change the data,
                the UI keeps up. That is the whole promise of React.
              </p>
            </>
          ),
        },
      ],
      exercises: [
        {
          kind: "ordering",
          id: "r-render-order",
          title: "把一次点击的顺序排对",
          level: 1,
          prompt: (
            <p>
              用户点了某一行的 Delete 按钮。把下面五件事按发生顺序排好。
            </p>
          ),
          items: [
            { id: "d", label: "React 重新执行 NoteManager 函数，拿到新的 JSX" },
            { id: "a", label: "NoteItem 的 onClick 触发，调用 onDelete(note.id)" },
            { id: "e", label: "React 对比新旧 JSX，把变化的部分写进真实 DOM" },
            { id: "b", label: "NoteManager 里的 handleDelete 执行，调用 setNotes(...)" },
            { id: "c", label: "React 记下 notes 的新值，标记这个组件需要重新渲染" },
          ],
          answer: ["a", "b", "c", "d", "e"],
          explain: (
            <>
              事件从最底层的 <code>NoteItem</code> 冒上去 →
              父组件的 handler 执行 → setter 更新 state →
              React 重新执行组件函数 → 对比后更新 DOM。
              <strong>注意 setNotes 不会立刻改变 notes 变量</strong> ——
              它只是「预约一次重新渲染」，新值在下一次渲染里才看得到。
            </>
          ),
        },
        {
          kind: "code-completion",
          id: "r-write-state",
          title: "自己写出 NoteManager 的两个 state 和删除逻辑",
          level: 3,
          prompt: (
            <p>
              只给你组件外壳。按要求补出两个 state 和 <code>handleDelete</code>。
              不要看下面的答案，先自己写。
            </p>
          ),
          language: "tsx",
          filename: "src/components/NoteManager/index.tsx",
          sourceFile: "react-notes-app/src/components/NoteManager/index.tsx",
          starter: `import { useState } from "react";
import type { Note } from "../../types/Note";

const NoteManager: React.FC = () => {
  // 1. 笔记列表，初始为空
  // 2. 当前正在编辑的笔记，没有时为 null

  // 3. 按 id 删除一条笔记
  const handleDelete = (id: number) => {
  };

  return null; // 这题只看上面三处
};

export default NoteManager;`,
          requirements: [
            "用 useState 声明 notes，类型是 Note[]，初始值为空数组",
            "用 useState 声明 noteToEdit，类型是 Note | null，初始值为 null",
            "handleDelete 按 id 移除对应笔记，必须用函数式更新，不许改动原数组",
          ],
          checks: [
            {
              label: "notes 用了 useState<Note[]>([])",
              must: "useState\\s*<\\s*Note\\s*\\[\\s*\\]\\s*>\\s*\\(\\s*\\[\\s*\\]\\s*\\)",
            },
            {
              label: "noteToEdit 用了 useState<Note | null>(null)",
              must: "useState\\s*<\\s*Note\\s*\\|\\s*null\\s*>\\s*\\(\\s*null\\s*\\)",
            },
            { label: "handleDelete 里用了 filter", must: "filter" },
            { label: "用了函数式更新 setNotes(prev => ...)", must: "setNotes\\s*\\(\\s*\\(?\\s*prev" },
            { label: "按 id 比较，用的是 !==", must: "!==\\s*id" },
            { label: "没有用 push / splice 改原数组", mustNot: "\\.(push|splice)\\s*\\(" },
          ],
          hints: [
            "两个 state 的初始值都「看不出类型」（空数组、null），所以泛型参数必须显式写。",
            "删除要用 filter，它是唯一会让数组变短的方法。改动写在 setNotes 里。",
            "setNotes(prev => prev.filter(每一条 => 这条的 id 不等于要删的 id))",
            "setNotes((prev) => prev.filter((note) => note.id !== id));",
          ],
          solution: real(
            "tsx",
            `const NoteManager: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);

  const handleDelete = (id: number) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };`,
            {
              filename: "参考答案（与项目里的实现一致）",
              sourceFile: "react-notes-app/src/components/NoteManager/index.tsx",
            },
          ),
        },
      ],
      mistakes: [
        {
          wrong: demo(
            "tsx",
            `// ✗ 直接赋值 —— React 完全不知道发生了什么
notes = [...notes, newNote];`,
          ),
          why: (
            <>
              <code>notes</code> 是 <code>const</code> 声明的，
              这行连编译都过不去。就算改成 <code>let</code>，
              React 也不会知道值变了 —— 它只监听 setter 的调用。
              <strong>唯一的修改途径是 setNotes。</strong>
            </>
          ),
          whyEn: (
            <>
              <code>notes</code> is declared with <code>const</code>, so this
              line does not even compile. Even as a <code>let</code>, React
              would not know the value changed — it only watches for setter
              calls. <strong>setNotes is the only way to change it.</strong>
            </>
          ),
        },
        {
          wrong: demo(
            "tsx",
            `// ✗ 以为 setState 是同步的
setNotes((prev) => [...prev, newNote]);
console.log(notes.length);   // 还是旧的长度！`,
          ),
          why: (
            <>
              <code>setNotes</code> 只是「预约一次重新渲染」，
              它不会当场改变 <code>notes</code> 这个变量。
              新值要到<strong>下一次渲染</strong>才看得到。
              想在更新后做点什么，用 <code>useEffect</code>（下一节讲）。
            </>
          ),
          whyEn: (
            <>
              <code>setNotes</code> only asks React for one more render. It
              does not change the <code>notes</code> variable on the spot. The
              new value is visible on the <strong>next render</strong>. To do
              something after the update, use <code>useEffect</code> (the next
              lesson).
            </>
          ),
        },
      ],
      transfer: [
        {
          signal: "「界面要跟着某个数据变」",
          signalEn: "The screen has to follow some piece of data",
          reachFor: "把它做成 useState",
          reachForEn: "Put that data in useState",
        },
        {
          signal: "初始值是 [] 或 null",
          signalEn: "The initial value is [] or null",
          reachFor: "显式写泛型参数",
          reachForEn: "Write the generic type argument explicitly",
        },
        {
          signal: "「基于当前值算出新值」",
          signalEn: "The new value is computed from the current one",
          reachFor: "setX(prev => ...)",
          reachForEn: "setX(prev => ...)",
        },
        {
          signal: "setState 之后 console.log 是旧值",
          signalEn: "console.log after setState shows the old value",
          reachFor: "正常，新值在下次渲染才有",
          reachForEn: "That is expected. The new value arrives on the next render",
        },
      ],
      recap: [
        "组件函数会被反复执行，所以普通变量存不住数据 —— 这是 useState 存在的原因。",
        "useState 返回 [当前值， setter]；初始值只在第一次渲染生效。",
        "setter 是唯一合法的修改途径，调用它等于「预约一次重新渲染」。",
        "setX(prev => ...) 比 setX(新值) 稳，项目里统一用前者。",
        "你只管改数据，DOM 由 React 对比后自动更新 —— 不要自己操作 DOM。",
      ],
      recapEn: [
        "The component function runs again and again, so a plain variable cannot hold data. That is the reason useState exists.",
        "useState returns [current value, setter]. The initial value is used only on the first render.",
        "The setter is the only legal way to change the value. Calling it asks React for one more render.",
        "setX(prev => ...) is safer than setX(newValue), and this project uses the first form everywhere.",
        "You change the data, and React compares and updates the DOM for you. Do not touch the DOM yourself.",
      ],
    },
  ],
};
