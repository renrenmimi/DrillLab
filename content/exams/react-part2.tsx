// React 考试 —— 模块 2 后半（受控输入、列表与 key）与模块 3（Hooks 与数据流）。

import type { Module } from "../types";
import { demo, real } from "../helpers";

const NOTE_FORM_FULL = `import React, { useState, useEffect } from "react";
import type { Note } from "../../types/Note";

interface NoteFormProps {
  onSubmit: (note: Note) => void;
  noteToEdit: Note | null;
}

const NoteForm: React.FC<NoteFormProps> = ({ onSubmit, noteToEdit }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title);
      setContent(noteToEdit.content);
    } else {
      setTitle("");
      setContent("");
    }
  }, [noteToEdit]);

  const isFormInvalid = title.trim() === "" || content.trim() === "";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isFormInvalid) return;
    const newNote = {
      id: noteToEdit ? noteToEdit.id : Date.now(),
      title: title.trim(),
      content: content.trim(),
    };
    onSubmit(newNote);
    setTitle("");
    setContent("");
  };

  return (
    <div className="card w-200 pt-30 pb-8 mt-15 mb-15">
      <form onSubmit={handleSubmit} data-testid="note-form">
        <section className="layout-row align-items-center justify-content-center mt-20 mr-20 ml-20">
          <label className="form-title-label">Title:</label>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            data-testid="form-input"
            className="form-input"
          />
        </section>

        <section className="layout-row align-items-center justify-content-center mt-20 mr-20 ml-20">
          <label className="form-content-label">Content:</label>
          <textarea
            placeholder="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            data-testid="form-textarea"
            className="form-textarea"
          />
        </section>

        <section className="layout-row align-items-center justify-content-center mt-20 mr-20 ml-20">
          <button
            type="submit"
            disabled={isFormInvalid}
            data-testid="form-submit-button"
          >
            {noteToEdit ? "Update" : "Add"}
          </button>
        </section>
      </form>
    </div>
  );
};

export default NoteForm;`;

export const reactHooks: Module = {
  id: "react-hooks",
  stage: "React · 第 2 部分",
  title: "受控输入、列表渲染与 useEffect",
  titleEn: "Controlled inputs, rendering lists, and useEffect",
  summary:
    "把 NoteForm 从头到尾读懂 —— 它一个文件里就用到了受控输入、useEffect 同步、派生数据和表单提交四件事。",
  summaryEn:
    "Read NoteForm from top to bottom. That one file already does four things: controlled inputs, syncing with useEffect, derived data, and form submission.",
  lessons: [
    /* ---------- 2.4 ---------- */
    {
      id: "r-controlled-input",
      title: "受控输入：value + onChange 的闭环",
      titleEn: "Controlled inputs: the loop between value and onChange",
      blurb: "输入框里的字，其实存在 React 的 state 里，不在 DOM 里。",
      blurbEn: "The text you type sits in React state, not in the DOM.",
      minutes: 13,
      objectives: [
        "说清「受控」到底控的是什么",
        "写出 value + onChange 的完整闭环",
        "知道只写 value 不写 onChange 会怎样",
        "看懂表单提交里 event.preventDefault() 的必要性",
      ],
      objectivesEn: [
        "Explain what a controlled input actually controls",
        "Write the full value + onChange loop",
        "Know what happens if you write value but no onChange",
        "See why event.preventDefault() is needed when a form is submitted",
      ],
      whyForAssessment:
        "判卷测试用 userEvent.type() 往输入框里打字，然后断言表格内容。如果输入框不是受控的，打进去的字拿不到，Task 1 直接挂。",
      whyForAssessmentEn:
        "The grading tests type into the input with userEvent.type() and then assert on the table contents. If the input is not controlled, the typed text never reaches your code and Task 1 fails.",
      sourceFiles: [
        {
          path: "react-notes-app/src/components/NoteForm/index.tsx",
          role: "两个受控输入 + 表单提交的完整实现",
        },
      ],
      concepts: [
        {
          id: "what-controlled",
          heading: "「受控」的意思是：唯一真相在 state 里",
          headingEn: "Controlled means the only source of truth is the state",
          lede: "输入框自己不做主，它只显示 state 告诉它的东西。",
          ledeEn: "The input decides nothing on its own. It shows whatever the state tells it to show.",
          body: (
            <>
              <p>
                原生 HTML 里，<code>&lt;input&gt;</code> 自己记着用户输入了什么。
                你要读它得 <code>document.querySelector(...).value</code>。
                这叫<strong>非受控</strong>。
              </p>
              <p>
                React 里的常规做法是反过来：
              </p>
              <ol>
                <li>
                  <code>value={"{title}"}</code> —— 输入框显示什么，
                  由 state 决定。
                </li>
                <li>
                  <code>onChange={"{(e) => setTitle(e.target.value)}"}</code> ——
                  用户敲键盘时，把新值写进 state。
                </li>
                <li>
                  state 变了 → 重新渲染 → 输入框显示新值。
                </li>
              </ol>
              <p>
                看起来绕了一圈，但换来一个巨大好处：
                <strong>任何时候，<code>title</code> 这个变量就是输入框里的内容。</strong>
                你不需要去 DOM 里读，也不会出现「显示的和读到的不一致」。
              </p>
              <p>
                这个闭环叫 <strong>受控组件（controlled component）</strong>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                In plain HTML an <code>&lt;input&gt;</code> remembers what the user
                typed. To read it you go through{" "}
                <code>document.querySelector(...).value</code>. That is{" "}
                <strong>uncontrolled</strong>.
              </p>
              <p>
                React normally turns it around:
              </p>
              <ol>
                <li>
                  <code>value={"{title}"}</code> — what the input shows is decided
                  by state.
                </li>
                <li>
                  <code>onChange={"{(e) => setTitle(e.target.value)}"}</code> —
                  as the user types, the new value goes into state.
                </li>
                <li>
                  state changed → re-render → the input shows the new value.
                </li>
              </ol>
              <p>
                It looks like a detour, and it buys one big thing:{" "}
                <strong>at any moment, the <code>title</code> variable is exactly what is inside the input.</strong>{" "}
                You never read the DOM, so &ldquo;what is shown&rdquo; can never
                drift from &ldquo;what you read&rdquo;.
              </p>
              <p>
                This loop is called a <strong>controlled component</strong>.
              </p>
            </>
          ),
          code: [
            real(
              "tsx",
              `const [title, setTitle] = useState("");

<input
  type="text"
  placeholder="Title"
  value={title}                                  // ① 显示什么由 state 说
  onChange={(e) => setTitle(e.target.value)}     // ② 敲键盘就写回 state
  data-testid="form-input"
  className="form-input"
/>`,
              {
                filename: "src/components/NoteForm/index.tsx（节选）",
                filenameEn: "src/components/NoteForm/index.tsx (excerpt)",
                sourceFile: "react-notes-app/src/components/NoteForm/index.tsx",
                highlight: [6, 7],
                codeEn: `const [title, setTitle] = useState("");

<input
  type="text"
  placeholder="Title"
  value={title}                                  // ① state decides what is shown
  onChange={(e) => setTitle(e.target.value)}     // ② typing writes back to state
  data-testid="form-input"
  className="form-input"
/>`,
                explanation:
                  "e.target 就是那个 input 元素，e.target.value 是它此刻的内容。textarea 的写法完全一样 —— 项目里 content 就是这么做的。",
                explanationEn:
                  "e.target is that input element, and e.target.value is its content right now. A textarea is written the same way — that is how content is done in the project.",
              },
            ),
          ],
        },
        {
          id: "missing-onchange",
          heading: "只写 value 不写 onChange 会怎样",
          headingEn: "What happens if you write value but no onChange",
          lede: "输入框会变成只读的。这是个很容易踩的坑。",
          ledeEn: "The input turns read-only. This mistake is very easy to make.",
          body: (
            <>
              <p>
                想清楚这个逻辑链：<code>value={"{title}"}</code> 意味着
                「输入框显示的永远是 <code>title</code>」。
                而 <code>title</code> 只能通过 <code>setTitle</code> 改。
                如果没有 <code>onChange</code>，就没人调 <code>setTitle</code>，
                <code>title</code> 永远是初始值 <code>&quot;&quot;</code>。
              </p>
              <p>
                结果：<strong>你在输入框里敲什么都不显示。</strong>
                React 开发模式下会给一条警告：
              </p>
              <p>
                这条警告也提示了另一条路：如果你只是想给一个初始值、
                之后不管它，用 <code>defaultValue</code>（非受控）。
                但这道题必须用受控 —— 因为提交时要读到内容，
                而且 Task 3 要能<strong>从外部把值填进去</strong>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Follow the chain. <code>value={"{title}"}</code> means
                &ldquo;this input always shows <code>title</code>&rdquo;.
                And <code>title</code> can only change through{" "}
                <code>setTitle</code>. With no <code>onChange</code>, nobody ever
                calls <code>setTitle</code>, so{" "}
                <code>title</code> stays at its initial <code>&quot;&quot;</code>.
              </p>
              <p>
                Result: <strong>nothing you type shows up.</strong>{" "}
                React gives you a warning in development mode:
              </p>
              <p>
                That warning also points at the other road: if you only want to set
                an initial value and never touch it again, use{" "}
                <code>defaultValue</code> (uncontrolled). This paper needs controlled
                inputs though — submitting has to read the content, and Task 3 has to{" "}
                <strong>push a value in from outside</strong>.
              </p>
            </>
          ),
          code: [
            demo(
              "bash",
              `Warning: You provided a \`value\` prop to a form field without an
\`onChange\` handler. This will render a read-only field. If the field should
be mutable use \`defaultValue\`. Otherwise, set either \`onChange\` or \`readOnly\`.`,
              { filename: "React 的警告", filenameEn: "The warning from React" },
            ),
          ],
        },
        {
          id: "form-submit",
          heading: "表单提交：preventDefault 不是可选项",
          headingEn: "Submitting a form: preventDefault is not optional",
          body: (
            <>
              <p>
                这个项目用的是真正的 <code>&lt;form&gt;</code> +
                <code>&lt;button type=&quot;submit&quot;&gt;</code>，
                提交处理挂在 <code>form</code> 的 <code>onSubmit</code> 上。
              </p>
              <p>
                <strong>浏览器的默认行为是：提交表单 = 发一个 HTTP 请求并刷新页面。</strong>
                在单页应用里这是灾难 —— 页面一刷新，所有 state 归零，
                刚添加的笔记全没了。
              </p>
              <p>
                <code>event.preventDefault()</code> 就是在说
                「别做默认那件事，我自己处理」。<strong>忘了它，
                Task 1 的表现是「点 Add 之后页面闪一下，什么都没发生」。</strong>
              </p>
              <p>
                看真实实现里 <code>handleSubmit</code> 的五个动作，顺序很讲究：
              </p>
              <ol>
                <li><code>event.preventDefault()</code> —— 先拦住浏览器。</li>
                <li><code>if (isFormInvalid) return</code> —— 空内容就不提交。</li>
                <li>
                  构造 note。注意 id：
                  <code>noteToEdit ? noteToEdit.id : Date.now()</code> ——
                  <strong>这一行同时服务 Add 和 Update 两种情况</strong>，
                  是 Task 3 的关键之一。
                </li>
                <li><code>onSubmit(newNote)</code> —— 上报给父组件。</li>
                <li>
                  <code>setTitle(&quot;&quot;)</code> /{" "}
                  <code>setContent(&quot;&quot;)</code> —— 清空表单。
                </li>
              </ol>
            </>
          ),
          bodyEn: (
            <>
              <p>
                This project uses a real <code>&lt;form&gt;</code> plus
                <code>&lt;button type=&quot;submit&quot;&gt;</code>, with the submit
                handler sitting on the <code>form</code>&rsquo;s{" "}
                <code>onSubmit</code>.
              </p>
              <p>
                <strong>The browser&rsquo;s default behaviour is: submitting a form means firing an HTTP request and reloading the page.</strong>{" "}
                In a single-page app that is a disaster — one reload and every piece
                of state is back to zero, including the note you just added.
              </p>
              <p>
                <code>event.preventDefault()</code> is how you say
                &ldquo;skip the default, I will handle this myself&rdquo;.{" "}
                <strong>Forget it and Task 1 looks like this: you press Add, the page
                blinks, nothing happens.</strong>
              </p>
              <p>
                Here are the five things the real <code>handleSubmit</code> does, and
                the order is deliberate:
              </p>
              <ol>
                <li><code>event.preventDefault()</code> — hold the browser back first.</li>
                <li><code>if (isFormInvalid) return</code> — do not submit empty content.</li>
                <li>
                  Build the note. Watch the id:{" "}
                  <code>noteToEdit ? noteToEdit.id : Date.now()</code> —
                  <strong>that one line serves both Add and Update</strong>,
                  and it is one of the keys to Task 3.
                </li>
                <li><code>onSubmit(newNote)</code> — report it up to the parent.</li>
                <li>
                  <code>setTitle(&quot;&quot;)</code> /{" "}
                  <code>setContent(&quot;&quot;)</code> — clear the form.
                </li>
              </ol>
            </>
          ),
          code: [
            real(
              "tsx",
              `const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  if (isFormInvalid) return;
  const newNote = {
    id: noteToEdit ? noteToEdit.id : Date.now(),
    title: title.trim(),
    content: content.trim(),
  };
  onSubmit(newNote);
  setTitle("");
  setContent("");
};`,
              {
                filename: "src/components/NoteForm/index.tsx（节选）",
                filenameEn: "src/components/NoteForm/index.tsx (excerpt)",
                sourceFile: "react-notes-app/src/components/NoteForm/index.tsx",
                highlight: [2, 5],
              },
            ),
          ],
        },
        {
          id: "the-whole-file",
          heading: "把整个 NoteForm 读一遍",
          headingEn: "Read the whole of NoteForm once",
          lede: "这是这道题最密集的一个文件。上面讲的四件事都在里面。",
          ledeEn: "This is the densest file in the task. All four points above appear in it.",
          body: (
            <>
              <p>
                读的时候留意四处：
                <strong>两个 state</strong>（第 10–11 行）、
                <strong>useEffect 同步</strong>（13–21 行，下一节细讲）、
                <strong>派生数据 isFormInvalid</strong>（23 行）、
                <strong>按钮文字随 noteToEdit 变</strong>（70 行）。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Four spots to watch as you read:{" "}
                <strong>the two pieces of state</strong> (lines 10–11),{" "}
                <strong>the useEffect that syncs</strong> (lines 13–21, covered in the
                next lesson),{" "}
                <strong>the derived isFormInvalid</strong> (line 23), and{" "}
                <strong>the button text following noteToEdit</strong> (line 70).
              </p>
            </>
          ),
          code: [
            real("tsx", NOTE_FORM_FULL, {
              filename: "src/components/NoteForm/index.tsx（全文）",
              filenameEn: "src/components/NoteForm/index.tsx (whole file)",
              sourceFile: "react-notes-app/src/components/NoteForm/index.tsx",
              highlight: [10, 11, 23, 70],
              collapsible: true,
            }),
          ],
        },
      ],
      exercises: [
        {
          kind: "fill-blank",
          id: "r-controlled-blanks",
          title: "补全受控输入的闭环",
          titleEn: "Complete the loop of a controlled input",
          level: 2,
          prompt: (
            <p>
              把 <code>NoteForm</code> 里 textarea 那一段补全。
              三个空构成一个完整的闭环。
            </p>
          ),
          promptEn: (
            <p>
              Fill in the textarea part of <code>NoteForm</code>. The three blanks
              together form one complete loop.
            </p>
          ),
          language: "tsx",
          filename: "src/components/NoteForm/index.tsx",
          sourceFile: "react-notes-app/src/components/NoteForm/index.tsx",
          template: `const [content, setContent] = ___1___("");

<textarea
  placeholder="Content"
  value={___2___}
  onChange={(e) => setContent(___3___)}
  data-testid="form-textarea"
  className="form-textarea"
/>`,
          blanks: [
            {
              n: 1,
              accept: ["useState"],
              hint: "让 React 替你记住这个值的那个 Hook。",
              hintEn: "The Hook that asks React to remember this value for you.",
              why: (
                <>
                  <code>useState</code>。初始值 <code>&quot;&quot;</code>
                  已经说明了类型是 string，所以这里<strong>不需要</strong>
                  写泛型参数。
                </>
              ),
              whyEn: (
                <>
                  <code>useState</code>. The initial value{" "}
                  <code>&quot;&quot;</code> already says the type is string, so you{" "}
                  <strong>do not need</strong> a generic parameter here.
                </>
              ),
              width: 10,
            },
            {
              n: 2,
              accept: ["content"],
              hint: "显示什么，由 state 里的当前值决定。",
              hintEn: "What is shown is decided by the current value in state.",
              why: (
                <>
                  <code>content</code>。这条把「state → 界面」这半边接上了。
                  写成 <code>setContent</code> 是把函数塞进 value，
                  React 会警告并显示一堆奇怪的东西。
                </>
              ),
              whyEn: (
                <>
                  <code>content</code>. This connects the &ldquo;state →
                  screen&rdquo; half. Writing <code>setContent</code> here puts a
                  function into value; React warns and shows something strange.
                </>
              ),
              width: 9,
            },
            {
              n: 3,
              accept: ["e.target.value", "event.target.value"],
              hint: "从事件对象里取出输入框此刻的内容。",
              hintEn: "Take the input's current content out of the event object.",
              why: (
                <>
                  <code>e.target.value</code>。<code>e.target</code>
                  是触发事件的那个 DOM 元素，<code>.value</code> 是它的当前内容。
                  这条把「界面 → state」另外半边接上，闭环完成。
                  <br />
                  常见错写：<code>e.value</code>（<code>e</code> 是事件不是元素）、
                  <code>e.target.text</code>（textarea 也用 value，不是 text）。
                </>
              ),
              whyEn: (
                <>
                  <code>e.target.value</code>. <code>e.target</code> is the DOM
                  element that fired the event, and <code>.value</code> is its
                  current content. This connects the other half, &ldquo;screen →
                  state&rdquo;, and the loop is complete.
                  <br />
                  Common wrong answers: <code>e.value</code> (<code>e</code> is the
                  event, not the element) and <code>e.target.text</code> (a textarea
                  also uses value, not text).
                </>
              ),
              width: 17,
            },
          ],
        },
        {
          kind: "debug",
          id: "r-debug-preventdefault",
          title: "Debug Lab · 点 Add 之后页面闪一下，笔记没了",
          titleEn: "Debug Lab · the page blinks after Add and the note is gone",
          level: 2,
          prompt: (
            <p>
              填好标题和内容，点 Add。页面明显闪了一下，
              地址栏出现了 <code>?</code>，表格还是空的。
            </p>
          ),
          promptEn: (
            <p>
              Fill in a title and some content, then press Add. The page clearly
              blinks, a <code>?</code> appears in the address bar, and the table is
              still empty.
            </p>
          ),
          errorOutput: `# 没有 JavaScript 报错。
# 现象：点击 Add 后
#   - 页面整体刷新了一次
#   - 地址栏从 http://localhost:5173/ 变成 http://localhost:5173/?
#   - 输入框被清空，表格依然是空的
#   - React DevTools 里所有 state 都回到了初始值`,
          broken: demo(
            "tsx",
            `const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  if (isFormInvalid) return;
  const newNote = { id: Date.now(), title: title.trim(), content: content.trim() };
  onSubmit(newNote);
  setTitle("");
  setContent("");
};`,
            { filename: "有问题的 handleSubmit", filenameEn: "The broken handleSubmit" },
          ),
          classify: {
            options: [
              { id: "a", label: "状态更新错误 —— 改了原数组", labelEn: "State update error — the original array was mutated" },
              { id: "b", label: "浏览器默认行为没被拦住 —— 表单原生提交导致页面刷新", labelEn: "The browser default was not stopped — the native form submit reloads the page" },
              { id: "c", label: "类型错误 —— event 类型写错了", labelEn: "Type error — the type of event is wrong" },
              { id: "d", label: "异步错误 —— onSubmit 应该 await", labelEn: "Async error — onSubmit should be awaited" },
            ],
            answer: "b",
          },
          locate: {
            question: "缺了哪一行？",
            questionEn: "Which line is missing?",
            options: [
              { id: "a", label: "函数第一行应该是 event.preventDefault();", labelEn: "The first line of the function should be event.preventDefault();" },
              { id: "b", label: "应该在 onSubmit 之后加 return false;", labelEn: "return false; should be added after onSubmit" },
              { id: "c", label: "button 的 type 应该改成 button", labelEn: "The button's type should be changed to button" },
              { id: "d", label: "form 上应该加 method=\"post\"", labelEn: "method=\"post\" should be added to the form" },
            ],
            answer: "a",
          },
          fixed: real(
            "tsx",
            `const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  if (isFormInvalid) return;
  ...
};`,
            {
              filename: "改对之后",
              filenameEn: "After the fix",
              sourceFile: "react-notes-app/src/components/NoteForm/index.tsx",
              highlight: [2],
            },
          ),
          rootCause: (
            <>
              <p>
                <code>&lt;button type=&quot;submit&quot;&gt;</code> 被点击时，
                浏览器执行表单的<strong>默认提交行为</strong>：
                把表单数据编码进 URL、发起一次导航、重新加载页面。
                页面一重载，React 应用整个重启，所有 state 归零。
              </p>
              <p>
                地址栏出现 <code>?</code> 就是这个默认行为的证据 ——
                看到它基本可以直接确诊。
              </p>
              <p>
                注意选项 C（把 button 改成 <code>type=&quot;button&quot;</code>）
                虽然也能阻止提交，但那样 <code>form</code> 的
                <code>onSubmit</code> 就不会触发了，
                还得把处理函数改挂到 button 的 <code>onClick</code> 上 ——
                而且会破坏「回车提交」。<strong>正解是 preventDefault。</strong>
              </p>
            </>
          ),
          rootCauseEn: (
            <>
              <p>
                When <code>&lt;button type=&quot;submit&quot;&gt;</code> is clicked,
                the browser runs the form&rsquo;s{" "}
                <strong>default submit behaviour</strong>: it encodes the form data
                into the URL, starts a navigation, and reloads the page. Once the
                page reloads, the whole React app restarts and every piece of state
                is reset.
              </p>
              <p>
                The <code>?</code> in the address bar is the evidence of that
                default behaviour — seeing it is almost enough for the diagnosis.
              </p>
              <p>
                Look at option C (changing the button to{" "}
                <code>type=&quot;button&quot;</code>). It does stop the submit, but
                then the <code>form</code>&rsquo;s <code>onSubmit</code> never fires,
                so you also have to move the handler to the button&rsquo;s{" "}
                <code>onClick</code> — and submitting with the Enter key stops
                working. <strong>The correct answer is preventDefault.</strong>
              </p>
            </>
          ),
          verify: "npx vitest run   # 应该看到 4 passed",
          verifyEn: "npx vitest run   # you should see 4 passed",
        },
      ],
      mistakes: [
        {
          wrong: demo(
            "tsx",
            `// ✗ onChange 里忘了 .value
<input value={title} onChange={(e) => setTitle(e.target)} />`,
            {
              codeEn: `// ✗ .value is missing inside onChange
<input value={title} onChange={(e) => setTitle(e.target)} />`,
            },
          ),
          why: (
            <>
              <code>e.target</code> 是那个 DOM 元素对象，不是字符串。
              TypeScript 会报
              <code>Argument of type &apos;EventTarget&apos; is not assignable to
              parameter of type &apos;string&apos;</code>。
              这是好事 —— 在 JavaScript 项目里，这个错会一直藏到运行时。
            </>
          ),
          whyEn: (
            <>
              <code>e.target</code> is the DOM element object, not a string.
              TypeScript reports
              <code>Argument of type &apos;EventTarget&apos; is not assignable to
              parameter of type &apos;string&apos;</code>. That is a good thing. In a
              plain JavaScript project this mistake stays hidden until the code runs.
            </>
          ),
        },
        {
          wrong: demo(
            "tsx",
            `// ✗ 提交后忘了清空表单
onSubmit(newNote);
// 少了 setTitle("") 和 setContent("")`,
            {
              codeEn: `// ✗ the form is not cleared after submitting
onSubmit(newNote);
// setTitle("") and setContent("") are missing`,
            },
          ),
          why: (
            <>
              测试里第四个用例（编辑）会先 <code>clear</code> 再
              <code>type</code>，所以不清空<strong>不一定</strong>让测试挂。
              但用户体验上，添加完一条之后输入框还留着上一条的内容，
              明显是 bug。<strong>题目没写的细节，也是评分点。</strong>
            </>
          ),
          whyEn: (
            <>
              The fourth test (editing) calls <code>clear</code> before it calls
              <code>type</code>, so leaving the form filled does
              <strong>not always</strong> fail the tests. But for the user, an input
              that still holds the previous note after it was added is clearly a bug.
              <strong>Details the task did not spell out are graded too.</strong>
            </>
          ),
        },
      ],
      transfer: [
        {
          signal: "「输入内容变化时同步更新页面」",
          signalEn: "The page has to update as the user types",
          reachFor: "受控输入：value + onChange + state",
          reachForEn: "Controlled input: value + onChange + state",
        },
        {
          signal: "「点了提交按钮页面就刷新」",
          signalEn: "The page reloads when the submit button is clicked",
          reachFor: "event.preventDefault()",
          reachForEn: "event.preventDefault()",
        },
        {
          signal: "输入框敲不进字",
          signalEn: "You cannot type anything into the input",
          reachFor: "有 value 但漏了 onChange",
          reachForEn: "value is set but onChange is missing",
        },
        {
          signal: "「表单要能被外部填充」",
          signalEn: "Something outside the form has to fill the form in",
          reachFor: "必须受控，非受控做不到",
          reachForEn: "It has to be controlled; an uncontrolled input cannot do this",
        },
      ],
      recap: [
        "受控输入 = 显示由 state 决定（value），输入写回 state（onChange），形成闭环。",
        "e.target.value 才是内容；e.target 是元素，e 是事件。",
        "只写 value 不写 onChange，输入框会变成只读。",
        "form 提交必须 event.preventDefault()，否则页面刷新、state 归零。",
        "id: noteToEdit ? noteToEdit.id : Date.now() 一行同时服务新增和更新。",
      ],
      recapEn: [
        "A controlled input shows what the state says (value) and writes typing back into the state (onChange). That closes the loop.",
        "e.target.value is the text. e.target is the element, and e is the event.",
        "value without onChange makes the input read-only.",
        "A form submit needs event.preventDefault(), or the page reloads and all state is reset.",
        "The single line id: noteToEdit ? noteToEdit.id : Date.now() serves adding and updating at the same time.",
      ],
    },

    /* ---------- 2.5 ---------- */
    {
      id: "r-lists-keys",
      title: "列表渲染与 key",
      titleEn: "Rendering a list, and the key prop",
      blurb: "notes.map(...) 那三行，以及为什么 key 不能用数组下标。",
      blurbEn: "Those three lines of notes.map(...), and why key must not be the array index.",
      minutes: 10,
      objectives: [
        "会用 map 把数组渲染成一串组件",
        "说清 key 是给谁看的、React 用它做什么",
        "知道为什么 key={index} 在有删除的列表里是错的",
        "知道空列表要不要特殊处理",
      ],
      objectivesEn: [
        "Use map to turn an array into a list of components",
        "Explain who key is for and what React does with it",
        "Know why key={index} is wrong in a list that allows deletion",
        "Know whether an empty list needs special handling",
      ],
      whyForAssessment:
        "Q1 的表格是 map 出来的，key 用错在这道题里会造成「删了一行，剩下的行内容串位」这种诡异现象 —— 而测试可能抓不到。",
      whyForAssessmentEn:
        "The Q1 table is produced by map. A wrong key here makes rows show the wrong content after a delete, and the tests may not catch it.",
      sourceFiles: [
        { path: "react-notes-app/src/components/NoteTable/index.tsx", role: "map 渲染 + key" },
      ],
      concepts: [
        {
          id: "map-to-jsx",
          heading: "map 把「一串数据」变成「一串组件」",
          headingEn: "map turns a list of data into a list of components",
          body: (
            <>
              <p>
                <code>notes</code> 是一个数组，页面上要出现对应数量的行。
                做法就是 <code>map</code> —— 上一门课讲过它「长度不变、逐个变形」。
                这里的变形是「一条 Note → 一个 <code>&lt;NoteItem /&gt;</code>」。
              </p>
              <p>
                注意 <code>{"{notes.map(...)}"}</code> 外面那对花括号：
                这是「切回 JavaScript」。里面返回的是一个
                <strong>JSX 数组</strong>，React 会把它平铺渲染出来。
              </p>
              <p>
                <strong>箭头函数的两种写法别搞混：</strong>
                <code>(note) =&gt; (&lt;NoteItem ... /&gt;)</code> 用圆括号，
                是「直接返回」；如果写成花括号
                <code>(note) =&gt; {"{ <NoteItem /> }"}</code>，
                那就是函数体，<strong>必须显式 <code>return</code></strong>，
                否则返回 <code>undefined</code>，页面上什么都不出现。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>notes</code> is an array, and the page needs one row per entry.
                The tool is <code>map</code> — the previous course described it as
                &ldquo;same length, transform each item&rdquo;. Here the transform is
                &ldquo;one Note → one <code>&lt;NoteItem /&gt;</code>&rdquo;.
              </p>
              <p>
                Notice the braces around <code>{"{notes.map(...)}"}</code>:
                that is the switch back into JavaScript. What comes out is a{" "}
                <strong>JSX array</strong>, and React renders it flat.
              </p>
              <p>
                <strong>Do not mix up the two arrow-function forms:</strong>
                <code>(note) =&gt; (&lt;NoteItem ... /&gt;)</code> with parentheses
                returns the element directly; written with braces,{" "}
                <code>(note) =&gt; {"{ <NoteItem /> }"}</code>,
                that is a function body and you{" "}
                <strong>must <code>return</code> explicitly</strong>, or it returns{" "}
                <code>undefined</code> and nothing shows up on the page.
              </p>
            </>
          ),
          code: [
            real(
              "tsx",
              `<tbody data-testid="notes-list">
  {notes.map((note) => (
    <NoteItem
      key={note.id}
      note={note}
      onDelete={onDelete}
      onEdit={onEdit}
    />
  ))}
</tbody>`,
              {
                filename: "src/components/NoteTable/index.tsx（节选）",
                filenameEn: "src/components/NoteTable/index.tsx (excerpt)",
                sourceFile: "react-notes-app/src/components/NoteTable/index.tsx",
                highlight: [4],
              },
            ),
          ],
        },
        {
          id: "why-key",
          heading: "key 是给 React 用来「认人」的",
          headingEn: "key is how React tells one item from another",
          lede: "它不是给你看的，也不会出现在 DOM 里。",
          ledeEn: "It is not there for you to read, and it never appears in the DOM.",
          body: (
            <>
              <p>
                React 重新渲染时要做一次对比：
                <strong>「上一次的这一串，和这一次的这一串，谁是谁？」</strong>
                有了 <code>key</code>，它就能一一对应：
                key 还在的复用、key 消失的删掉、新 key 的插入。
              </p>
              <p>
                没有 <code>key</code>，React 只能<strong>按位置猜</strong>，
                并且给出警告：
              </p>
              <p>
                <code>key</code> 的要求：<strong>在这一串里唯一、
                并且跟着数据本身走</strong>。
                这个项目用 <code>note.id</code>，正合适 ——
                id 是 <code>Date.now()</code> 生成的，每条唯一，
                而且这条笔记不管排在第几位，id 都不变。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                On every re-render React has to match one list against another:
                <strong>&ldquo;of the row I had last time and the row I have now, which is which?&rdquo;</strong>{" "}
                With a <code>key</code> it can pair them up one by one:
                keys that are still there get reused, keys that vanished get removed,
                new keys get inserted.
              </p>
              <p>
                Without a <code>key</code>, React can only{" "}
                <strong>guess by position</strong>, and it tells you so:
              </p>
              <p>
                What a <code>key</code> has to be: <strong>unique inside this list,
                and tied to the data itself</strong>.
                This project uses <code>note.id</code>, which fits —
                the id comes from <code>Date.now()</code>, so every note has its own,
                and it stays the same wherever the note sits in the list.
              </p>
            </>
          ),
          code: [
            demo(
              "bash",
              `Warning: Each child in a list should have a unique "key" prop.

Check the render method of \`NoteTable\`. See https://react.dev/link/warning-keys
for more information.`,
              { filename: "缺 key 的警告", filenameEn: "The warning about a missing key" },
            ),
          ],
        },
        {
          id: "index-key-bug",
          heading: "为什么 key={index} 是个陷阱",
          headingEn: "Why key={index} goes wrong",
          lede: "在「只往后加」的列表里它没问题。一旦有删除或插入，就会串位。",
          ledeEn: "In a list that only grows at the end it is fine. As soon as you delete or insert, the rows get mismatched.",
          body: (
            <>
              <p>
                想一个具体场景。三条笔记，用下标做 key：
              </p>
              <p>
                删掉中间那条之后，剩下两条重新 map，下标变成
                <code>0</code>、<code>1</code>。于是 React 看到的是：
                「key=0 还在（内容变了？没变）、key=1 还在（内容从 B 变成 C）、
                key=2 消失了」。
              </p>
              <p>
                结果 React 会<strong>复用</strong> key=1 那个组件实例，
                只把里面的文字改掉。对纯展示组件影响不大，
                但如果组件内部有自己的 state（比如一个展开/收起的开关、
                一个未提交的输入框），<strong>那个 state 会留在原位置，
                跟错误的数据配上对</strong>。
              </p>
              <p>
                症状是「删了第二行，第三行的勾选状态跑到了第二行」这种，
                极难查。所以规矩很简单：
                <strong>有稳定 id 就用 id，永远别用 index。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Picture a concrete case. Three notes, keyed by index:
              </p>
              <p>
                Delete the middle one and the remaining two get mapped again, so the
                indexes become <code>0</code> and <code>1</code>. What React sees is:
                &ldquo;key=0 is still here (content changed? no), key=1 is still here
                (its content went from B to C), key=2 is gone&rdquo;.
              </p>
              <p>
                So React <strong>reuses</strong> the component instance behind key=1
                and only swaps the text inside it. For a pure display component that
                barely matters, but if the component holds state of its own (an
                expand/collapse toggle, an unsubmitted input),{" "}
                <strong>that state stays with the position and gets paired with the
                wrong data</strong>.
              </p>
              <p>
                The symptom reads like &ldquo;I deleted the second row and the third
                row&rsquo;s checkbox jumped up into it&rdquo; — brutal to track down.
                So the rule is short:{" "}
                <strong>if there is a stable id, use the id. Never use index.</strong>
              </p>
            </>
          ),
          code: [
            demo(
              "text",
              `用 index 当 key：
  渲染①    [A(key=0), B(key=1), C(key=2)]
  删掉 B
  渲染②    [A(key=0), C(key=1)]
                        ↑ 这个 key 上一轮属于 B
           → React 认为「key=1 这个组件还在，只是内容变了」
           → 复用了 B 的组件实例（含它的内部 state）来显示 C

用 note.id 当 key：
  渲染①    [A(key=101), B(key=102), C(key=103)]
  渲染②    [A(key=101), C(key=103)]
           → React 认为「102 消失了」→ 精确删掉 B，A 和 C 原样不动 ✓`,
              { filename: "两种 key 的差别", filenameEn: "The difference between the two keys" },
            ),
          ],
        },
        {
          id: "empty-list",
          heading: "空列表需要特殊处理吗",
          headingEn: "Does an empty list need special handling",
          body: (
            <>
              <p>
                不需要。<code>[].map(...)</code> 返回空数组，
                React 渲染空数组 = 什么都不渲染。
                所以初始状态下 <code>&lt;tbody&gt;</code> 是空的，
                表头照常显示。
              </p>
              <p>
                这一点对测试很重要：测试里有一句
                <code>expect(screen.getByTestId(&quot;notes-list&quot;)).not.toHaveTextContent(&quot;ToDelete&quot;)</code>
                —— 它要求 <code>notes-list</code> 这个元素<strong>存在</strong>
                但不包含那段文字。如果你给空列表加个
                <code>{"{notes.length === 0 ? <p>暂无</p> : <tbody>...</tbody>}"}</code>
                这种分支，把 <code>tbody</code> 整个换掉了，
                <code>getByTestId</code> 就会找不到元素而<strong>抛错</strong>。
              </p>
              <p>
                <strong>结论：不要动 <code>data-testid</code> 所在元素的存在性。</strong>
                这是 README 那条「不得修改任何 data-testid」的延伸含义。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                No. <code>[].map(...)</code> returns an empty array, and rendering an
                empty array renders nothing. So <code>&lt;tbody&gt;</code> simply
                starts out empty while the header shows as usual.
              </p>
              <p>
                That matters for the tests. One line reads{" "}
                <code>expect(screen.getByTestId(&quot;notes-list&quot;)).not.toHaveTextContent(&quot;ToDelete&quot;)</code>
                — it needs the <code>notes-list</code> element to{" "}
                <strong>exist</strong> while not containing that text. If you give the
                empty list a branch like
                <code>{"{notes.length === 0 ? <p>Nothing yet</p> : <tbody>...</tbody>}"}</code>
                and swap the whole <code>tbody</code> out,{" "}
                <code>getByTestId</code> finds nothing and <strong>throws</strong>.
              </p>
              <p>
                <strong>So: never change whether an element carrying a <code>data-testid</code> exists.</strong>{" "}
                That is the wider meaning of the README line about not modifying any
                data-testid.
              </p>
            </>
          ),
        },
      ],
      exercises: [
        {
          kind: "recognition",
          id: "r-key-choice",
          title: "这个列表该用什么当 key",
          titleEn: "What should this list use as its key",
          level: 1,
          prompt: (
            <p>
              <code>notes</code> 里每条是{" "}
              <code>{"{ id: number; title: string; content: string }"}</code>，
              用户可以删除任意一条。下面哪个是最合适的 key?
            </p>
          ),
          promptEn: (
            <p>
              Each item in <code>notes</code> is{" "}
              <code>{"{ id: number; title: string; content: string }"}</code>, and the
              user can delete any of them. Which of these is the best key?
            </p>
          ),
          options: [
            { id: "a", label: "key={index}" },
            { id: "b", label: "key={note.id}" },
            { id: "c", label: "key={note.title}" },
            { id: "d", label: "key={Math.random()}" },
          ],
          answer: ["b"],
          explain: (
            <>
              <code>note.id</code> 唯一且跟着数据走，是标准答案。
              <br />
              A 在有删除的列表里会导致组件实例串位。
              <br />
              C 不保证唯一 —— 两条笔记可以同名。
              <br />
              D 最糟：每次渲染都是新 key，React 会把整个列表
              <strong>全部销毁重建</strong>，性能差且所有内部 state 丢失。
            </>
          ),
          explainEn: (
            <>
              <code>note.id</code> is unique and travels with the data, so it is the
              answer.
              <br />
              A mismatches component instances once the list allows deletion.
              <br />
              C is not guaranteed to be unique — two notes can share a title.
              <br />
              D is the worst: every render produces new keys, so React{" "}
              <strong>destroys and rebuilds the whole list</strong>. It is slow and
              every piece of inner state is lost.
            </>
          ),
        },
        {
          kind: "recognition",
          id: "r-map-return",
          title: "哪一段什么都不会渲染",
          titleEn: "Which one renders nothing at all",
          level: 1,
          prompt: <p>下面哪一段会导致表格里一行都不出现（而且不报错）？</p>,
          promptEn: (
            <p>
              Which of these makes the table show no rows at all, without reporting an
              error?
            </p>
          ),
          options: [
            { id: "a", label: "{notes.map((note) => (<NoteItem key={note.id} note={note} ... />))}" },
            { id: "b", label: "{notes.map((note) => { <NoteItem key={note.id} note={note} ... /> })}" },
            { id: "c", label: "{notes.map((note) => { return <NoteItem key={note.id} note={note} ... />; })}" },
            { id: "d", label: "A 和 C 都能正常渲染", labelEn: "A and C both render correctly" },
          ],
          answer: ["b"],
          explain: (
            <>
              B 用了花括号函数体但<strong>没有 return</strong>，
              所以每次回调返回 <code>undefined</code>，
              map 出来是一串 undefined，React 什么都不渲染 ——
              而且<strong>不报错</strong>。
              <br />
              A 用圆括号是隐式返回，C 用花括号加显式 return，两者等价。
              <br />
              这是「箭头函数两种写法」最常见的翻车点：
              <strong>看到「列表空白但数据有值」，先去数括号。</strong>
            </>
          ),
          explainEn: (
            <>
              B uses a curly-brace function body with <strong>no return</strong>, so
              every callback returns <code>undefined</code>. The map produces a row of
              undefined values and React renders nothing —{" "}
              <strong>and reports no error</strong>.
              <br />
              A uses parentheses, which return implicitly. C uses curly braces plus an
              explicit return. The two are equivalent.
              <br />
              This is the most common slip between the two arrow-function forms:{" "}
              <strong>when the list is blank but the data is there, count the
              brackets first.</strong>
            </>
          ),
        },
      ],
      transfer: [
        {
          signal: "「把一个数组显示成列表」",
          signalEn: "Show an array as a list",
          reachFor: "map + key={稳定 id}",
          reachForEn: "map plus key={a stable id}",
        },
        {
          signal: "Each child should have a unique key",
          signalEn: "Each child should have a unique key",
          reachFor: "补 key，用数据自带的 id",
          reachForEn: "Add key, and use the id that comes with the data",
        },
        {
          signal: "删了一行，其他行状态串位",
          signalEn: "After deleting one row, the other rows show the wrong state",
          reachFor: "key 用了 index，换成 id",
          reachForEn: "key is the index; change it to the id",
        },
        {
          signal: "列表空白但数据有值",
          signalEn: "The list is blank even though the data has items",
          reachFor: "查 map 回调是不是花括号忘了 return",
          reachForEn: "Check whether the map callback uses curly braces and forgot return",
        },
      ],
      recap: [
        "map 把数据数组变成 JSX 数组，React 会平铺渲染。",
        "key 是给 React 认人用的，要求「本串唯一 + 跟着数据走」。",
        "永远别用 index 当 key，更别用 Math.random()。",
        "空数组 map 出空数组，不需要特殊处理 —— 也不要因此改动 testid 元素的结构。",
        "箭头函数用花括号就必须 return，否则渲染空白且不报错。",
      ],
      recapEn: [
        "map turns an array of data into an array of JSX, and React renders them one after another.",
        "key is how React identifies each item. It must be unique inside that list and must stay with the data.",
        "Never use the index as key, and never use Math.random().",
        "An empty array maps to an empty array, so no special handling is needed. Do not change the structure of the elements that carry a data-testid because of it.",
        "An arrow function written with curly braces needs return, or the list renders empty and no error appears.",
      ],
    },

    /* ---------- 2.6 ---------- */
    {
      id: "r-useeffect",
      title: "useEffect：把 props 的变化同步进 state",
      titleEn: "useEffect: copying a change in props into state",
      blurb: "Task 3 的「点 Edit 后内容回填到表单」，靠的就是这 9 行。",
      blurbEn: "In Task 3, clicking Edit puts the note back into the form. These 9 lines are what does it.",
      minutes: 15,
      objectives: [
        "说清 useEffect 什么时候跑",
        "看懂依赖数组的三种写法各代表什么",
        "解释 NoteForm 里那个 useEffect 为什么必须存在",
        "知道 useEffect 无限循环是怎么造成的",
      ],
      objectivesEn: [
        "Explain when useEffect runs",
        "Read the three ways of writing the dependency array and what each one means",
        "Explain why the useEffect in NoteForm has to be there",
        "Know how a useEffect infinite loop happens",
      ],
      whyForAssessment:
        "Task 3 要求「点 Edit → 内容回填进表单」。表单的 title/content 是 NoteForm 自己的 state，而触发源 noteToEdit 是外面传进来的 prop —— 把外部变化同步进内部 state，这正是 useEffect 的活。",
      whyForAssessmentEn:
        "Task 3 asks that clicking Edit fills the form with the note. The title and content of the form are NoteForm's own state, while the trigger noteToEdit is a prop from outside. Copying an outside change into inside state is exactly the job of useEffect.",
      sourceFiles: [
        {
          path: "react-notes-app/src/components/NoteForm/index.tsx",
          role: "第 17–25 行那个 useEffect",
        },
      ],
      concepts: [
        {
          id: "when-effect-runs",
          heading: "useEffect 在「渲染完成之后」跑",
          headingEn: "useEffect runs after the render is finished",
          lede: "它不是渲染的一部分，是渲染的后续动作。",
          ledeEn: "It is not part of the render. It is what happens after the render.",
          body: (
            <>
              <p>
                <code>useEffect(fn, deps)</code> 的意思是：
                <strong>「这次渲染结束、DOM 更新完之后，
                如果 deps 里有东西变了，就执行 fn」</strong>。
              </p>
              <p>依赖数组有三种写法，行为完全不同：</p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>写法</th>
                      <th>什么时候执行 fn</th>
                      <th>典型用途</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>useEffect(fn, [])</code></td>
                      <td>只在第一次渲染后执行一次</td>
                      <td>初始化、拉一次数据</td>
                    </tr>
                    <tr>
                      <td><code>useEffect(fn, [a, b])</code></td>
                      <td>第一次 + 之后每次 a 或 b 变化</td>
                      <td><strong>同步：外部变了，内部跟上</strong></td>
                    </tr>
                    <tr>
                      <td><code>useEffect(fn)</code></td>
                      <td><strong>每一次</strong>渲染后都执行</td>
                      <td>几乎总是写错了</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                第三种是无限循环的常见来源：fn 里改了 state → 触发重渲染 →
                fn 又执行 → 又改 state → …… React 最后会抛
                <code>Maximum update depth exceeded</code>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>useEffect(fn, deps)</code> means:
                <strong>&ldquo;once this render is finished and the DOM is updated, if
                anything in deps changed, run fn&rdquo;</strong>.
              </p>
              <p>There are three ways to write the dependency array, and they behave completely differently:</p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Form</th>
                      <th>When fn runs</th>
                      <th>Typical use</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>useEffect(fn, [])</code></td>
                      <td>Once, after the first render</td>
                      <td>Setup, one-off fetch</td>
                    </tr>
                    <tr>
                      <td><code>useEffect(fn, [a, b])</code></td>
                      <td>First render, then whenever a or b changes</td>
                      <td><strong>Syncing: something outside moved, catch up</strong></td>
                    </tr>
                    <tr>
                      <td><code>useEffect(fn)</code></td>
                      <td>After <strong>every</strong> render</td>
                      <td>Almost always a mistake</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                The third one is the usual source of infinite loops: fn changes state
                → re-render → fn runs again → changes state again → ... and React
                eventually throws{" "}
                <code>Maximum update depth exceeded</code>.
              </p>
            </>
          ),
        },
        {
          id: "the-real-effect",
          heading: "读懂项目里这个 useEffect",
          headingEn: "Read the useEffect in this project",
          lede: "9 行代码，把 Task 3 的一半工作做完了。",
          ledeEn: "Nine lines of code do half of Task 3.",
          body: (
            <>
              <p>
                问题是这样的：<code>NoteForm</code> 的输入框内容存在它
                <strong>自己的</strong> state（<code>title</code> /{" "}
                <code>content</code>）里。而「用户点了哪条笔记的 Edit」
                这件事发生在<strong>外面</strong>，
                通过 <code>noteToEdit</code> 这个 prop 传进来。
              </p>
              <p>
                所以需要一条规则：<strong>「每当 noteToEdit 变了，
                就把内部两个 state 改成它的值」</strong>。
                这正是 <code>useEffect(fn, [noteToEdit])</code>。
              </p>
              <p>
                <code>else</code> 分支也重要：<code>noteToEdit</code>
                变回 <code>null</code>（编辑完成、退出编辑模式）时，
                要<strong>清空</strong>表单。没有这个 else，
                提交完之后表单里还留着刚才编辑的内容。
              </p>
              <p>
                <strong>为什么不能直接写在渲染里？</strong>
                因为在组件函数体里直接调 <code>setTitle</code>
                会立刻触发新一轮渲染，而那一轮又会再调一次 ——
                死循环。<code>useEffect</code> + 依赖数组保证了
                「只在 noteToEdit 真的变了的时候才动手」。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Here is the problem. The text in <code>NoteForm</code>&rsquo;s inputs
                lives in <strong>its own</strong> state (<code>title</code> /{" "}
                <code>content</code>). But &ldquo;which note&rsquo;s Edit did the user
                press&rdquo; happens <strong>outside</strong>, and arrives through the{" "}
                <code>noteToEdit</code> prop.
              </p>
              <p>
                So you need one rule: <strong>&ldquo;whenever noteToEdit changes, set
                the two inner pieces of state to its values&rdquo;</strong>.
                That is precisely <code>useEffect(fn, [noteToEdit])</code>.
              </p>
              <p>
                The <code>else</code> branch matters too: when <code>noteToEdit</code>{" "}
                goes back to <code>null</code> (the edit is done, edit mode is over),
                the form has to be <strong>cleared</strong>. Without that else, the
                text you were just editing is still sitting there after you submit.
              </p>
              <p>
                <strong>Why not put it straight in the render?</strong>
                Because calling <code>setTitle</code> in the component body schedules
                another render immediately, and that render calls it again — a dead
                loop. <code>useEffect</code> plus a dependency array guarantees you
                only act when noteToEdit really changed.
              </p>
            </>
          ),
          code: [
            real(
              "tsx",
              `useEffect(() => {
  if (noteToEdit) {
    setTitle(noteToEdit.title);
    setContent(noteToEdit.content);
  } else {
    setTitle("");
    setContent("");
  }
}, [noteToEdit]);`,
              {
                filename: "src/components/NoteForm/index.tsx（第 17–25 行）",
                filenameEn: "src/components/NoteForm/index.tsx (lines 17–25)",
                sourceFile: "react-notes-app/src/components/NoteForm/index.tsx",
                highlight: [9],
                explanation:
                  "第 9 行那个 [noteToEdit] 是整段的开关。改成 [] 就只在首次渲染跑一次，点 Edit 永远不回填；去掉它就变成每次渲染都跑，直接死循环。",
                explanationEn:
                  "The [noteToEdit] on line 9 is the switch for the whole block. Change it to [] and the effect runs only on the first render, so Edit never prefills. Remove it and the effect runs on every render, which is an endless loop.",
              },
            ),
          ],
        },
        {
          id: "deps-mistakes",
          heading: "依赖数组写错的三种后果",
          headingEn: "Three things that go wrong when the dependency array is wrong",
          body: (
            <>
              <p>拿这段代码做实验，三种写法对应三种病：</p>
              <ol>
                <li>
                  <strong><code>[]</code></strong> ——
                  只在首次渲染跑一次。点 Edit 时 <code>noteToEdit</code>
                  变了，但 effect 不再执行。
                  <strong>症状：点 Edit 按钮文字变成了 Update，
                  但输入框是空的。</strong>
                  （因为按钮文字是渲染时直接读 prop 算的，不依赖 effect。）
                </li>
                <li>
                  <strong>什么都不写</strong> —— 每次渲染后都跑。
                  effect 里调了 setTitle → 重渲染 → 又跑 → ……
                  <strong>症状：Maximum update depth exceeded，页面卡死。</strong>
                </li>
                <li>
                  <strong><code>[noteToEdit, title, content]</code></strong> ——
                  把自己改的 state 也放进依赖。
                  setTitle 改了 title → title 变了 → effect 又跑 →
                  setTitle 又执行 → ……
                  <strong>症状：同样死循环。</strong>
                  <br />
                  这条特别值得记：<strong>effect 里改的 state，
                  不要放进它自己的依赖数组。</strong>
                </li>
              </ol>
            </>
          ),
          bodyEn: (
            <>
              <p>Take that code and try three versions of the array. Each one gets you a different illness:</p>
              <ol>
                <li>
                  <strong><code>[]</code></strong> —
                  runs once after the first render. <code>noteToEdit</code>{" "}
                  changes when you press Edit, but the effect never runs again.{" "}
                  <strong>Symptom: pressing Edit turns the button into Update, but the
                  inputs stay empty.</strong>{" "}
                  (The button text is computed from the prop during render, so it does
                  not need the effect.)
                </li>
                <li>
                  <strong>Nothing at all</strong> — runs after every render.
                  The effect calls setTitle → re-render → runs again → ...{" "}
                  <strong>Symptom: Maximum update depth exceeded, and the page freezes.</strong>
                </li>
                <li>
                  <strong><code>[noteToEdit, title, content]</code></strong> —
                  the state the effect itself writes is in its own dependencies.
                  setTitle changes title → title changed → the effect runs again →
                  setTitle again → ...{" "}
                  <strong>Symptom: the same dead loop.</strong>
                  <br />
                  This one is worth committing to memory: <strong>state that an effect
                  writes does not belong in that effect&rsquo;s dependency array.</strong>
                </li>
              </ol>
            </>
          ),
        },
      ],
      exercises: [
        {
          kind: "fill-blank",
          id: "r-effect-blanks",
          title: "补全编辑回填的 useEffect",
          titleEn: "Complete the useEffect that prefills the form for editing",
          level: 2,
          prompt: (
            <p>
              这是 <code>NoteForm</code> 里那个决定 Task 3 成败的 effect。
              两个空：一个分支条件，一个依赖数组。
            </p>
          ),
          promptEn: (
            <p>
              This is the effect in <code>NoteForm</code> that decides whether Task 3
              passes. Two blanks: one branch condition, one dependency array.
            </p>
          ),
          language: "tsx",
          filename: "src/components/NoteForm/index.tsx",
          sourceFile: "react-notes-app/src/components/NoteForm/index.tsx",
          template: `useEffect(() => {
  if (___1___) {
    setTitle(noteToEdit.title);
    setContent(noteToEdit.content);
  } else {
    setTitle("");
    setContent("");
  }
}, ___2___);`,
          blanks: [
            {
              n: 1,
              accept: ["noteToEdit"],
              hint: "noteToEdit 的类型是 Note | null。要区分「有」和「没有」。",
              hintEn: "The type of noteToEdit is Note | null. You have to tell \u201cthere is one\u201d from \u201cthere is none\u201d.",
              why: (
                <>
                  <code>noteToEdit</code>。类型是 <code>Note | null</code>，
                  直接当条件判断即可（<code>null</code> 是假值）。
                  <br />
                  这个 <code>if</code> 还有一个副作用：TypeScript 在
                  strict 模式下知道 <code>if</code> 内部
                  <code>noteToEdit</code> 一定不是 null，
                  所以 <code>noteToEdit.title</code> 才不报错。
                  这叫<strong>类型收窄</strong>。
                </>
              ),
              whyEn: (
                <>
                  <code>noteToEdit</code>. Its type is <code>Note | null</code>, so you
                  can use it as the condition directly (<code>null</code> is falsy).
                  <br />
                  That <code>if</code> does one more thing: in strict mode TypeScript
                  knows that inside the <code>if</code>, <code>noteToEdit</code> cannot
                  be null, which is why <code>noteToEdit.title</code> does not raise an
                  error. This is called <strong>type narrowing</strong>.
                </>
              ),
              width: 12,
            },
            {
              n: 2,
              accept: ["[noteToEdit]"],
              hint: "只在「外面换了要编辑的笔记」时才需要重新同步。",
              hintEn: "You only need to sync again when the note to edit is swapped from outside.",
              why: (
                <>
                  <code>[noteToEdit]</code>。
                  <br />
                  写 <code>[]</code> → 点 Edit 不回填（按钮文字倒是会变，
                  很误导）。
                  <br />
                  不写 → 每次渲染都跑，死循环。
                  <br />
                  写 <code>[noteToEdit, title, content]</code> → 也死循环，
                  因为 effect 自己改了 title 和 content。
                </>
              ),
              whyEn: (
                <>
                  <code>[noteToEdit]</code>.
                  <br />
                  Write <code>[]</code> → pressing Edit does not prefill (the button
                  text does change, which is misleading).
                  <br />
                  Write nothing → the effect runs on every render: an endless loop.
                  <br />
                  Write <code>[noteToEdit, title, content]</code> → also an endless
                  loop, because the effect itself changes title and content.
                </>
              ),
              width: 14,
            },
          ],
        },
        {
          kind: "debug",
          id: "r-debug-effect-loop",
          title: "Debug Lab · 点 Edit 之后页面卡死",
          titleEn: "Debug Lab · the page freezes after you press Edit",
          level: 3,
          prompt: (
            <p>
              点某一行的 Edit 按钮，浏览器标签页转圈，控制台刷出大量警告。
              请判断类型并定位。
            </p>
          ),
          promptEn: (
            <p>
              Press the Edit button on any row. The browser tab spins and the console
              fills up with warnings. Classify the error, then locate it.
            </p>
          ),
          errorOutput: `Warning: Maximum update depth exceeded. This can happen when a component
calls setState inside useEffect, but useEffect either doesn't have a dependency
array, or one of the dependencies changes on every render.
    at NoteForm (src/components/NoteForm/index.tsx:13:3)
    at NoteManager (src/components/NoteManager/index.tsx:6:3)

Uncaught Error: Too many re-renders. React limits the number of renders to
prevent an infinite loop.`,
          broken: demo(
            "tsx",
            `useEffect(() => {
  if (noteToEdit) {
    setTitle(noteToEdit.title);
    setContent(noteToEdit.content);
  } else {
    setTitle("");
    setContent("");
  }
}, [noteToEdit, title, content]);`,
            { filename: "有问题的依赖数组", filenameEn: "The broken dependency array", highlight: [9] },
          ),
          classify: {
            options: [
              { id: "a", label: "语法错误 —— 依赖数组写法不合法", labelEn: "Syntax error — the dependency array is not valid" },
              { id: "b", label: "useEffect 依赖错误 —— 依赖里包含了 effect 自己会修改的 state", labelEn: "useEffect dependency error — a dependency holds state the effect itself changes" },
              { id: "c", label: "props 错误 —— noteToEdit 没传下来", labelEn: "props error — noteToEdit was never passed down" },
              { id: "d", label: "受控输入错误 —— onChange 写错了", labelEn: "Controlled input error — onChange is wrong" },
            ],
            answer: "b",
          },
          locate: {
            question: "第 9 行该怎么改？",
            questionEn: "How should line 9 change?",
            options: [
              { id: "a", label: "改成 [noteToEdit]", labelEn: "Change it to [noteToEdit]" },
              { id: "b", label: "改成 []", labelEn: "Change it to []" },
              { id: "c", label: "整个依赖数组删掉", labelEn: "Delete the whole dependency array" },
              { id: "d", label: "改成 [noteToEdit, setTitle, setContent]", labelEn: "Change it to [noteToEdit, setTitle, setContent]" },
            ],
            answer: "a",
          },
          fixed: real(
            "tsx",
            `}, [noteToEdit]);`,
            {
              filename: "改对之后（只改最后一行）",
              filenameEn: "After the fix (only the last line changes)",
              sourceFile: "react-notes-app/src/components/NoteForm/index.tsx",
            },
          ),
          rootCause: (
            <>
              <p>
                循环是这样转起来的：effect 执行 → 调 <code>setTitle</code> →
                <code>title</code> 变了 → 触发重渲染 →
                React 发现依赖里的 <code>title</code> 变了 →
                effect 又执行 → 又调 <code>setTitle</code> → ……
              </p>
              <p>
                <strong>规则：effect 内部会修改的 state，
                绝对不能出现在它自己的依赖数组里。</strong>
                依赖里只应该放「触发这次同步的原因」——
                这里就是 <code>noteToEdit</code>。
              </p>
              <p>
                顺带说选项 D：<code>setTitle</code> / <code>setContent</code>
                这两个 setter 的身份是<strong>稳定的</strong>
                （React 保证每次渲染都是同一个函数），
                放进依赖数组不会造成循环，但也毫无意义。
              </p>
            </>
          ),
          rootCauseEn: (
            <>
              <p>
                This is how the loop starts turning: the effect runs → it calls{" "}
                <code>setTitle</code> → <code>title</code> changed → a re-render is
                triggered → React sees that <code>title</code> in the dependency list
                changed → the effect runs again → it calls <code>setTitle</code> again
                → and so on.
              </p>
              <p>
                <strong>The rule: state that an effect changes must never appear in
                that effect&rsquo;s own dependency array.</strong>{" "}
                A dependency array should hold only the reason this sync happens —
                here that is <code>noteToEdit</code>.
              </p>
              <p>
                About option D: the two setters <code>setTitle</code> and{" "}
                <code>setContent</code> have a <strong>stable identity</strong> (React
                guarantees the same function on every render), so putting them in the
                dependency array causes no loop. It just achieves nothing.
              </p>
            </>
          ),
          verify: "npx vitest run   # 第 4 个测试「edits a note in place」应该通过",
          verifyEn: "npx vitest run   # the fourth test, \"edits a note in place\", should pass",
        },
      ],
      mistakes: [
        {
          wrong: demo(
            "tsx",
            `// ✗ 直接在组件函数体里同步 —— 立刻死循环
const NoteForm = ({ noteToEdit }) => {
  const [title, setTitle] = useState("");
  if (noteToEdit) setTitle(noteToEdit.title);   // 渲染期间调 setState
  ...
};`,
            {
              codeEn: `// ✗ syncing straight inside the component body — an endless loop
const NoteForm = ({ noteToEdit }) => {
  const [title, setTitle] = useState("");
  if (noteToEdit) setTitle(noteToEdit.title);   // setState during render
  ...
};`,
            },
          ),
          why: (
            <>
              在渲染期间调用 setter 会立刻安排下一次渲染，
              而下一次渲染又会再调一次。
              <strong>「渲染要纯粹」</strong>是 React 的基本规则：
              组件函数只负责根据当前 props/state 算出 JSX，
              不做任何副作用。副作用放 <code>useEffect</code>。
            </>
          ),
          whyEn: (
            <>
              Calling a setter during render immediately schedules another render,
              and that render calls the setter again.
              <strong>Rendering has to be pure</strong> is a basic React rule: the
              component function only turns the current props and state into JSX, and
              does nothing else. Anything else belongs in <code>useEffect</code>.
            </>
          ),
        },
        {
          wrong: demo(
            "tsx",
            `// ✗ 依赖写成 [] —— 点 Edit 时不回填
useEffect(() => {
  if (noteToEdit) { setTitle(noteToEdit.title); ... }
}, []);`,
            {
              codeEn: `// ✗ dependencies written as [] — Edit does not prefill
useEffect(() => {
  if (noteToEdit) { setTitle(noteToEdit.title); ... }
}, []);`,
            },
          ),
          why: (
            <>
              <code>[]</code> = 只在首次渲染后跑一次。首次渲染时
              <code>noteToEdit</code> 是 <code>null</code>，
              所以什么都没发生；后面点 Edit，effect 不再执行。
              <br />
              这个 bug 特别迷惑人：<strong>按钮文字会正确变成
              &quot;Update&quot;</strong>（那是渲染时直接读 prop 算的），
              让人以为「Edit 生效了」，但输入框是空的。
            </>
          ),
          whyEn: (
            <>
              <code>[]</code> means the effect runs once, after the first render. On
              that first render <code>noteToEdit</code> is <code>null</code>, so
              nothing happens, and when you click Edit later the effect never runs
              again.
              <br />
              This bug is confusing: <strong>the button text does change to
              &quot;Update&quot;</strong>, because that is computed straight from the
              prop during render. It looks like Edit worked, but the inputs are empty.
            </>
          ),
        },
      ],
      transfer: [
        {
          signal: "「外部数据变了，内部状态要跟上」",
          signalEn: "Outside data changed and inside state has to follow",
          reachFor: "useEffect(fn, [那个外部数据])",
          reachForEn: "useEffect(fn, [that outside value])",
        },
        {
          signal: "「组件加载时做一次某事」",
          signalEn: "Do something once, when the component first appears",
          reachFor: "useEffect(fn, [])",
          reachForEn: "useEffect(fn, [])",
        },
        {
          signal: "Maximum update depth exceeded",
          signalEn: "Maximum update depth exceeded",
          reachFor: "查依赖数组：是不是漏了，或含了自己改的 state",
          reachForEn: "Check the dependency array: it is missing, or it holds the state this effect changes",
        },
        {
          signal: "「点了却没反应，但别的地方变了」",
          signalEn: "Clicking does nothing here, but something else did change",
          reachFor: "查依赖数组是不是写成了 []",
          reachForEn: "Check whether the dependency array was written as []",
        },
      ],
      recap: [
        "useEffect 在渲染完成后跑，依赖数组决定它跑不跑。",
        "[] 只跑一次；[a] 在 a 变化时跑；不写则每次渲染都跑（通常是错的）。",
        "NoteForm 那个 effect 的职责是「把外部的 noteToEdit 同步进内部两个 state」。",
        "else 分支负责在退出编辑时清空表单，不能省。",
        "effect 里改的 state 不能放进它自己的依赖数组，否则死循环。",
      ],
      recapEn: [
        "useEffect runs after the render is finished, and the dependency array decides whether it runs at all.",
        "[] runs once. [a] runs when a changes. No array at all runs after every render, which is usually wrong.",
        "The job of that effect in NoteForm is to copy the outside noteToEdit into its two inside state values.",
        "The else branch clears the form when editing ends. Do not leave it out.",
        "State that the effect itself changes must not be in that effect's dependency array, or it loops forever.",
      ],
    },

    /* ---------- 2.7 ---------- */
    {
      id: "r-derived-lifting",
      title: "派生数据与状态提升：什么不该做成 state",
      titleEn: "Values you can compute, and lifting state up: what should not be state",
      blurb: "isFormInvalid 为什么是一行普通变量，而不是第三个 useState。",
      blurbEn: "Why isFormInvalid is one plain variable and not a third useState.",
      minutes: 11,
      objectives: [
        "判断一个值该做成 state 还是当场算出来",
        "说清「多余 state」会带来什么问题",
        "解释为什么 notes 必须住在 NoteManager 而不是 NoteTable",
        "看懂按钮文字 Add/Update 是怎么来的",
      ],
      objectivesEn: [
        "Decide whether a value should be state or should be computed on the spot",
        "Explain what problems extra state causes",
        "Explain why notes has to live in NoteManager and not in NoteTable",
        "See where the button text Add or Update comes from",
      ],
      whyForAssessment:
        "第二个测试断言「输入为空时提交按钮 disabled」。它靠的是 isFormInvalid 这个派生值。把它做成 state 是新手常见的过度设计，还容易出现「和实际输入不同步」的 bug。",
      whyForAssessmentEn:
        "The second test asserts that the submit button is disabled while the input is empty. That relies on the computed value isFormInvalid. Turning it into state is a common beginner habit, and it easily produces a value that no longer matches what is in the input.",
      sourceFiles: [
        {
          path: "react-notes-app/src/components/NoteForm/index.tsx",
          role: "isFormInvalid 与按钮文字",
        },
        {
          path: "react-notes-app/src/components/NoteManager/index.tsx",
          role: "状态提升的落点",
        },
      ],
      concepts: [
        {
          id: "derived-values",
          heading: "能算出来的，就不要存",
          headingEn: "If you can compute it, do not store it",
          lede: "state 越少，能出错的地方越少。",
          ledeEn: "The less state you have, the fewer places there are for things to go wrong.",
          body: (
            <>
              <p>
                「表单是否无效」完全由 <code>title</code> 和 <code>content</code>
                决定。所以它不需要单独存 —— 每次渲染时算一遍就行：
              </p>
              <p>
                这种「从已有 state 直接算出来的值」叫
                <strong>派生数据（derived state）</strong>。
                它自动就是最新的，因为每次渲染都重算。
              </p>
              <p>
                如果做成 <code>useState</code> 会怎样？
                你得在每一处修改 title 或 content 的地方
                <strong>记得同步更新它</strong>。
                漏掉一处，就出现「输入框有内容，按钮还是灰的」这种 bug。
                这类 bug 的名字叫<strong>状态不一致</strong>，
                根源就是「同一个事实存了两份」。
              </p>
              <p>
                判断方法很简单：
                <strong>「这个值能不能只用现有的 state 和 props 算出来？」
                能 → 别做 state。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                &ldquo;Is the form invalid&rdquo; follows entirely from{" "}
                <code>title</code> and <code>content</code>.
                So it needs no storage of its own — work it out once per render:
              </p>
              <p>
                A value computed straight out of state you already have is called{" "}
                <strong>derived state</strong>.
                It is always current, because every render recomputes it.
              </p>
              <p>
                What happens if you make it a <code>useState</code>?
                Then every single place that changes title or content has to{" "}
                <strong>remember to update it too</strong>.
                Miss one and you get &ldquo;the input has text but the button is still
                grey&rdquo;. That family of bug is called{" "}
                <strong>inconsistent state</strong>, and the cause is always the same
                fact stored twice.
              </p>
              <p>
                The test is simple:
                <strong>&ldquo;can this value be worked out from the state and props I
                already have?&rdquo; Yes → do not make it state.</strong>
              </p>
            </>
          ),
          code: [
            real(
              "tsx",
              `const isFormInvalid = title.trim() === "" || content.trim() === "";

// 用在两处：
<button type="submit" disabled={isFormInvalid} data-testid="form-submit-button">
if (isFormInvalid) return;      // handleSubmit 里再挡一次`,
              {
                filename: "src/components/NoteForm/index.tsx（节选）",
                sourceFile: "react-notes-app/src/components/NoteForm/index.tsx",
                explanation:
                  "注意 .trim() —— 只输入空格也算无效。这个细节题目没写，但它是合理实现的一部分，而且测试里 disabled 那条也能覆盖到初始空值的情况。",
              },
            ),
          ],
        },
        {
          id: "add-or-update",
          heading: "按钮文字：同一个 prop 决定三件事",
          headingEn: "The button text: one prop decides three things",
          body: (
            <>
              <p>
                <code>noteToEdit</code> 这一个 prop，同时决定了：
              </p>
              <ol>
                <li>
                  <strong>输入框里显示什么</strong> ——
                  通过上一节那个 useEffect。
                </li>
                <li>
                  <strong>按钮上写 Add 还是 Update</strong> ——
                  <code>{"{noteToEdit ? \"Update\" : \"Add\"}"}</code>，
                  渲染时当场算。
                </li>
                <li>
                  <strong>提交时是新建还是更新</strong> ——
                  <code>id: noteToEdit ? noteToEdit.id : Date.now()</code>。
                </li>
              </ol>
              <p>
                第 4 个测试会显式断言按钮文字：
                <code>expect(screen.getByTestId(&quot;form-submit-button&quot;)).toHaveTextContent(&quot;Update&quot;)</code>。
                <strong>大小写和拼写必须一模一样</strong> ——
                写成 <code>&quot;update&quot;</code> 或 <code>&quot;Save&quot;</code> 都会挂。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                This single <code>noteToEdit</code> prop decides three things at once:
              </p>
              <ol>
                <li>
                  <strong>What the inputs show</strong> —
                  through the useEffect from the last lesson.
                </li>
                <li>
                  <strong>Whether the button says Add or Update</strong> —
                  <code>{"{noteToEdit ? \"Update\" : \"Add\"}"}</code>,
                  worked out during render.
                </li>
                <li>
                  <strong>Whether submitting creates or updates</strong> —
                  <code>id: noteToEdit ? noteToEdit.id : Date.now()</code>.
                </li>
              </ol>
              <p>
                The fourth test asserts the button text outright:{" "}
                <code>expect(screen.getByTestId(&quot;form-submit-button&quot;)).toHaveTextContent(&quot;Update&quot;)</code>.{" "}
                <strong>Spelling and case have to match exactly</strong> —
                <code>&quot;update&quot;</code> or <code>&quot;Save&quot;</code> both fail.
              </p>
            </>
          ),
          code: [
            real(
              "tsx",
              `<button
  type="submit"
  disabled={isFormInvalid}
  data-testid="form-submit-button"
>
  {noteToEdit ? "Update" : "Add"}
</button>`,
              {
                filename: "src/components/NoteForm/index.tsx（节选）",
                sourceFile: "react-notes-app/src/components/NoteForm/index.tsx",
                highlight: [6],
              },
            ),
          ],
        },
        {
          id: "lifting",
          heading: "状态提升：数据放在「需要它的组件的最近共同祖先」",
          headingEn: "Lifting state up: put the data in the closest shared parent of the components that need it",
          body: (
            <>
              <p>
                <code>notes</code> 为什么必须住在 <code>NoteManager</code>?
                因为有两方需要它：
              </p>
              <ul>
                <li><code>NoteTable</code> 要<strong>读</strong>它来渲染。</li>
                <li>
                  <code>NoteForm</code> 的提交要<strong>改</strong>它
                  （通过 onSubmit 间接改）。
                </li>
              </ul>
              <p>
                这两个组件是兄弟，而 React 的数据只能往下流。
                所以数据必须放在它们的<strong>最近共同祖先</strong> ——
                <code>NoteManager</code>。这个动作叫
                <strong>状态提升（lifting state up）</strong>。
              </p>
              <p>
                反过来看 <code>title</code> / <code>content</code>：
                只有 <code>NoteForm</code> 用得到，所以留在
                <code>NoteForm</code> 自己身上就好。
                <strong>不要无脑把所有 state 都提到顶层</strong> ——
                那会让顶层组件变成一个什么都管的怪物。
              </p>
              <p>
                <code>noteToEdit</code> 是个有意思的中间情况：
                它<strong>由 NoteTable 的点击产生</strong>
                （NoteItem → onEdit），
                <strong>被 NoteForm 消费</strong>。
                所以它也必须住在 <code>NoteManager</code>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Why does <code>notes</code> have to live in <code>NoteManager</code>?
                Because two parties need it:
              </p>
              <ul>
                <li><code>NoteTable</code> has to <strong>read</strong> it to render.</li>
                <li>
                  <code>NoteForm</code>&rsquo;s submit has to <strong>change</strong> it
                  (indirectly, through onSubmit).
                </li>
              </ul>
              <p>
                Those two are siblings, and React data only flows downward.
                So the data has to sit at their <strong>closest common ancestor</strong> —
                <code>NoteManager</code>. The move has a name:{" "}
                <strong>lifting state up</strong>.
              </p>
              <p>
                Now look at <code>title</code> / <code>content</code> the other way
                round: only <code>NoteForm</code> ever needs them, so they stay inside{" "}
                <code>NoteForm</code>.{" "}
                <strong>Do not hoist every piece of state to the top out of habit</strong> —
                that turns the top component into a monster that manages everything.
              </p>
              <p>
                <code>noteToEdit</code> is an interesting middle case:
                it is <strong>produced by a click in NoteTable</strong>{" "}
                (NoteItem → onEdit) and{" "}
                <strong>consumed by NoteForm</strong>.
                So it has to live in <code>NoteManager</code> too.
              </p>
            </>
          ),
          code: [
            real(
              "text",
              `谁需要它                        →  它应该住哪
─────────────────────────────────────────────────
notes        NoteTable 读 + NoteForm 间接改   NoteManager（共同祖先）
noteToEdit   NoteItem 产生 + NoteForm 消费    NoteManager（共同祖先）
title        只有 NoteForm 用                 NoteForm（自己留着）
content      只有 NoteForm 用                 NoteForm（自己留着）
isFormInvalid 由 title/content 算出           不是 state，当场算`,
              { filename: "四个值的归属" },
            ),
          ],
        },
      ],
      exercises: [
        {
          kind: "recognition",
          id: "r-derived-or-state",
          title: "哪个应该做成 state",
          level: 1,
          prompt: (
            <p>
              假设要给 Notes Manager 加一个「显示当前有几条笔记」的文字。
              这个数字应该怎么实现？
            </p>
          ),
          options: [
            { id: "a", label: "新增一个 useState<number>(0)，在增删时同步维护" },
            { id: "b", label: "直接用 notes.length，不新增 state" },
            { id: "c", label: "用 useEffect 监听 notes，把长度写进另一个 state" },
            { id: "d", label: "存到 localStorage 里" },
          ],
          answer: ["b"],
          explain: (
            <>
              <code>notes.length</code> 就是答案。它<strong>永远</strong>
              和 notes 一致，因为每次渲染重算。
              <br />
              A 和 C 都是「同一个事实存两份」，一旦有一处忘了同步就不一致。
              C 还多了一次不必要的渲染（effect 里 setState 会再触发一轮）。
              <br />
              判断口诀：<strong>能从现有 state 算出来的，就别存。</strong>
            </>
          ),
        },
        {
          kind: "recognition",
          id: "r-where-state-lives",
          title: "这个 state 该住哪",
          level: 1,
          prompt: (
            <p>
              假设要加一个搜索框（在 NoteForm 上方，属于 NoteManager 的直接子元素），
              输入关键词后表格只显示匹配的笔记。
              搜索关键词这个 state 该放在哪？
            </p>
          ),
          options: [
            { id: "a", label: "NoteTable —— 它负责显示筛选结果" },
            { id: "b", label: "NoteItem —— 每一行自己判断要不要显示" },
            { id: "c", label: "NoteManager —— 搜索框和表格的共同祖先" },
            { id: "d", label: "NoteForm —— 它已经管着输入了" },
          ],
          answer: ["c"],
          explain: (
            <>
              搜索框产生关键词，表格消费它。两者的最近共同祖先是
              <code>NoteManager</code>。
              <br />
              然后在 <code>NoteManager</code> 里算出
              <code>const visible = notes.filter(n =&gt; n.title.includes(keyword))</code>
              这个<strong>派生数据</strong>，传给 <code>NoteTable</code> ——
              注意<strong>不要</strong>再开一个 <code>filteredNotes</code> state。
              <br />
              这也是最常见的 React 面试变式题：加筛选、加排序。
              解法都是「一个 state 存条件 + 一个派生数组」。
            </>
          ),
        },
        {
          kind: "code-completion",
          id: "r-write-derived",
          title: "写出派生数据与按钮文字",
          level: 3,
          prompt: (
            <p>
              补出 <code>isFormInvalid</code> 和按钮的两处动态部分。
              注意：只输入空格也应该算无效。
            </p>
          ),
          language: "tsx",
          filename: "src/components/NoteForm/index.tsx",
          sourceFile: "react-notes-app/src/components/NoteForm/index.tsx",
          starter: `const [title, setTitle] = useState("");
const [content, setContent] = useState("");

// 1. 表单是否无效：title 或 content 为空（只有空格也算空）
const isFormInvalid =

return (
  <form onSubmit={handleSubmit} data-testid="note-form">
    {/* ...两个输入框... */}
    <button
      type="submit"
      /* 2. 无效时禁用 */
      data-testid="form-submit-button"
    >
      {/* 3. 编辑模式显示 Update，否则显示 Add */}
    </button>
  </form>
);`,
          requirements: [
            "isFormInvalid 是一个普通 const，不许用 useState",
            "只输入空格也要判定为无效（用 trim）",
            "按钮在表单无效时 disabled",
            "按钮文字：noteToEdit 存在时是 Update，否则是 Add（大小写必须一致）",
            "不许改动 data-testid",
          ],
          checks: [
            { label: "isFormInvalid 用了 trim()", must: "isFormInvalid[^\\n]*trim\\s*\\(\\s*\\)" },
            { label: "同时检查了 title 和 content", must: "isFormInvalid[^\\n]*title[^\\n]*content" },
            { label: "没有把 isFormInvalid 做成 state", mustNot: "useState[^\\n]*[Ii]nvalid" },
            { label: "按钮上有 disabled={isFormInvalid}", must: "disabled\\s*=\\s*\\{\\s*isFormInvalid\\s*\\}" },
            { label: "按钮文字用了三元判断 noteToEdit", must: "noteToEdit\\s*\\?" },
            { label: "文字是 \"Update\" 和 \"Add\"（大小写正确）", must: '"Update"[\\s\\S]*"Add"' },
            { label: "data-testid 没被改动", must: 'data-testid="form-submit-button"' },
          ],
          hints: [
            "「表单无效」= 标题空 或者 内容空。两个条件用 || 连起来。",
            "「只有空格也算空」意味着比较之前要先 trim()。按钮文字用三元表达式，写在 JSX 的花括号里。",
            "const isFormInvalid = 标题去空白后 === \"\" || 内容去空白后 === \"\";\n按钮里写 {条件 ? \"Update\" : \"Add\"}",
            'const isFormInvalid = title.trim() === "" || content.trim() === "";\n<button type="submit" disabled={isFormInvalid} data-testid="form-submit-button">',
          ],
          solution: real(
            "tsx",
            `const isFormInvalid = title.trim() === "" || content.trim() === "";

<button
  type="submit"
  disabled={isFormInvalid}
  data-testid="form-submit-button"
>
  {noteToEdit ? "Update" : "Add"}
</button>`,
            {
              filename: "参考答案（与项目里的实现一致）",
              sourceFile: "react-notes-app/src/components/NoteForm/index.tsx",
            },
          ),
        },
      ],
      transfer: [
        {
          signal: "「显示筛选/排序后的列表」",
          signalEn: "Show a filtered or sorted list",
          reachFor: "一个 state 存条件 + 一个派生数组，别存结果",
          reachForEn: "One state for the condition plus a computed array. Do not store the result",
        },
        {
          signal: "「显示总数 / 是否为空 / 是否可提交」",
          signalEn: "Show a count, or whether it is empty, or whether it can be submitted",
          reachFor: "派生数据，当场算",
          reachForEn: "Computed data. Work it out at render time",
        },
        {
          signal: "两个兄弟组件都要用同一份数据",
          signalEn: "Two sibling components need the same data",
          reachFor: "提升到最近共同祖先",
          reachForEn: "Move it up to their closest shared parent",
        },
        {
          signal: "「同一个事实存了两份」",
          signalEn: "The same fact is stored in two places",
          reachFor: "删掉一份，改成派生",
          reachForEn: "Delete one copy and compute it instead",
        },
      ],
      recap: [
        "能从现有 state / props 算出来的值，不要做成 state。",
        "多余 state 的代价是「状态不一致」，而且是最难查的一类 bug。",
        "isFormInvalid 是派生数据，每次渲染重算，永远和输入一致。",
        "state 放在「需要它的组件的最近共同祖先」，不要一律提到顶层。",
        "按钮文字 Add / Update 大小写必须一致 —— 测试会直接断言字符串。",
      ],
      recapEn: [
        "If a value can be computed from existing state or props, do not make it state.",
        "Extra state costs you consistency, and that is one of the hardest kinds of bug to find.",
        "isFormInvalid is computed. It is worked out again on every render, so it always matches the input.",
        "Put state in the closest shared parent of the components that need it. Do not push everything to the top.",
        "The button text Add and Update must match exactly, capital letters included, because the tests assert on the string.",
      ],
    },
  ],
};
