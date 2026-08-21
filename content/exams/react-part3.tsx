// React 考试 —— 模块 3：Q1 Notes Manager 逐题拆解。
// 这是整门课的核心，严格对应 react-notes-app README 里的 Task 1 / 2 / 3。

import { DataFlowDiagram } from "@/components/data-flow";
import { ThinkFirst } from "@/components/lesson-kit";
import type { Module } from "../types";
import { demo, real } from "../helpers";

const NOTE_MANAGER_FULL = `import { useState } from "react";
import type { Note } from "../../types/Note";
import NoteForm from "../NoteForm";
import NoteTable from "../NoteTable";

const NoteManager: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);

  const handleSubmitNote = (submittedNote: Note) => {
    if (noteToEdit) {
      setNotes((prev) =>
        prev.map((note) =>
          note.id === submittedNote.id ? submittedNote : note,
        ),
      );
      setNoteToEdit(null);
    } else {
      setNotes((prev) => [...prev, submittedNote]);
    }
  };

  const handleDelete = (id: number) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const handleEdit = (note: Note) => {
    setNoteToEdit(note);
  };

  return (
    <div
      className="layout-column align-items-center justify-content-start"
      data-testid="note-manager"
    >
      <NoteForm onSubmit={handleSubmitNote} noteToEdit={noteToEdit} />
      <NoteTable notes={notes} onDelete={handleDelete} onEdit={handleEdit} />
    </div>
  );
};

export default NoteManager;`;

const EDIT_FLOW = (
  <DataFlowDiagram
    title="Task 3 的完整数据流：点 Edit → 回填 → 提交 → 就地更新"
    direction="column"
    nodes={[
      { kind: "① 点击", title: "NoteItem 的 Edit 按钮" },
      { kind: "② 父组件", title: "NoteManager.handleEdit" },
      { kind: "③ prop 下传", title: "NoteForm 收到 noteToEdit" },
      { kind: "④ 副作用", title: "useEffect 回填两个 state" },
      { kind: "⑤ 提交", title: "handleSubmit 复用旧 id" },
      { kind: "⑥ 就地替换", title: "handleSubmitNote 的 map 分支" },
    ]}
    frames={[
      {
        active: 0,
        detail: ["onEdit(note) —— 传整条", undefined, "noteToEdit = null", 'title = ""', undefined, "notes = [A, B, C]"],
        msg: (
          <>
            用户点了 B 那一行的 Edit。<code>NoteItem</code> 调用{" "}
            <code>onEdit(note)</code>，<strong>传的是整条 note</strong>，
            不是 id —— 因为下游要用它的 title 和 content 回填。
          </>
        ),
      },
      {
        active: 1,
        detail: [undefined, "setNoteToEdit(B)", "noteToEdit = null", undefined, undefined, "notes = [A, B, C]"],
        msg: (
          <>
            <code>handleEdit</code> 只做一件事：<code>setNoteToEdit(note)</code>。
            <strong>它不碰 notes</strong> —— 编辑还没提交，列表不该变。
          </>
        ),
      },
      {
        active: 2,
        detail: [undefined, undefined, "noteToEdit = B", 'title = ""（还没变）', "按钮文字已变成 Update", "notes = [A, B, C]"],
        msg: (
          <>
            重新渲染，<code>NoteForm</code> 收到新的 <code>noteToEdit</code>。
            <strong>注意：按钮文字这一瞬间就变成 Update 了</strong>，
            因为它是渲染时直接读 prop 算的。但输入框<strong>还是空的</strong> ——
            回填是下一步的事。
          </>
        ),
      },
      {
        active: 3,
        detail: [undefined, undefined, "noteToEdit = B", 'title = "B"\ncontent = "..."', "Update", "notes = [A, B, C]"],
        msg: (
          <>
            渲染完成后 <code>useEffect(fn, [noteToEdit])</code> 触发，
            把 B 的 title 和 content 写进 <code>NoteForm</code> 自己的两个 state。
            输入框这才显示出内容。
          </>
        ),
      },
      {
        active: 4,
        detail: [undefined, undefined, "noteToEdit = B", 'title = "B2"（用户改了）', "id: noteToEdit.id ← 复用！", "notes = [A, B, C]"],
        msg: (
          <>
            用户改完点 Update。<code>handleSubmit</code> 构造新 note 时用了{" "}
            <code>id: noteToEdit ? noteToEdit.id : Date.now()</code> ——
            <strong>复用旧 id 是整道题的关键</strong>。新建 id 的话，
            下一步就会变成「插入一条新的」而不是「更新」。
          </>
        ),
      },
      {
        active: 5,
        detail: [undefined, "setNoteToEdit(null)", "noteToEdit = null → 表单清空", undefined, "按钮回到 Add", "notes = [A, B2, C] ✓ 位置没变"],
        msg: (
          <>
            <code>handleSubmitNote</code> 走 <code>noteToEdit</code> 为真的分支，
            用 <code>map</code> 就地替换 —— <strong>B2 还在第二位</strong>。
            然后 <code>setNoteToEdit(null)</code> 退出编辑模式，
            effect 的 else 分支清空表单，按钮变回 Add。一圈闭合。
          </>
        ),
      },
    ]}
  />
);

export const reactQ1: Module = {
  id: "react-q1",
  stage: "React · 第 3 部分",
  title: "Q1 Notes Manager · 逐题拆解",
  titleEn: "Q1 Notes Manager · one task at a time",
  summary:
    "严格对应 react-notes-app README 的三个 Task。每一题都走同一套流程：读懂题 → 考什么 → 先想再写 → 分步实现 → 完整答案 → 为什么成立 → 常见错法 → 迁移。",
  summaryEn:
    "Follows the three tasks in the react-notes-app README exactly. Every task takes the same route: read the wording → see what is being tested → think before you type → build it step by step → read the full answer → understand why it works → look at the common mistakes → apply the same shape elsewhere.",
  lessons: [
    /* ---------- 3.1 ---------- */
    {
      id: "r-read-q1",
      title: "先读题：三个任务、一条硬约束、四个测试",
      titleEn: "Read the question first: three tasks, one rule you must not break, four tests",
      blurb: "在写第一行代码之前，把题目、约束和判卷标准全部摸清。",
      blurbEn: "Before writing a single line of code, get clear on the task, the constraints, and how it is graded.",
      minutes: 13,
      objectives: [
        "用自己的话复述三个 Task 的验收标准",
        "知道「不得修改任何 data-testid」具体意味着什么不能动",
        "会跑测试，并且知道跑的是哪四条",
        "认出题目里没写但测试在查的那一条",
      ],
      objectivesEn: [
        "Restate the acceptance criteria of the three tasks in your own words",
        "Know exactly what you may not touch when the task says do not change any data-testid",
        "Run the tests, and know which four tests are running",
        "Spot the one requirement the task text leaves out but the tests still check",
      ],
      whyForAssessment:
        "这一节本身就是考点。考场上最贵的错误不是写错代码，是「没读清题就开始写」——比如把删除写成按 title 删、把更新写成删了再加。",
      whyForAssessmentEn:
        "This lesson is itself part of the exam. The most expensive mistake is not bad code, it is starting to write before you have read the task properly: deleting by title instead of by id, or updating an item by removing it and adding it again.",
      sourceFiles: [
        { path: "react-notes-app/README.md", role: "三个 Task 的原文与约束" },
        { path: "react-notes-app/src/NoteManager.test.tsx", role: "四个判卷测试" },
        { path: "react-notes-app/src/components/NoteManager/index.tsx", role: "三道题的落点", edit: true },
      ],
      concepts: [
        {
          id: "the-brief",
          heading: "题目原文",
          headingEn: "The task text as it is given",
          lede: "先看没有加工过的版本。",
          ledeEn: "Read the version that has not been reworded yet.",
          body: (
            <>
              <p>
                这是 <code>react-notes-app/README.md</code> 里 Q1 部分的原文，
                一个字没改：
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                This is the Q1 section of <code>react-notes-app/README.md</code>, word for
                word:
              </p>
            </>
          ),
          code: [
            real(
              "text",
              `## Q1: Notes Manager (CRUD)
文件： src/components/**
按代码里的 TODO 完成三个任务：
- Task 1  Add:    提交表单 -> 新 note 进入表格
- Task 2  Delete: 点 Delete -> 该行按 id 被移除
- Task 3  Edit:   点 Edit -> 内容回填进表单、按钮变 Update ->
                  提交 -> 原位置更新该 note、退出编辑模式
约束： 不得修改任何 data-testid。`,
              { filename: "README.md（Q1 原文）", sourceFile: "react-notes-app/README.md" },
            ),
          ],
        },
        {
          id: "restate",
          heading: "用初学者能看懂的话重写一遍",
          headingEn: "The same task written in plainer words",
          lede: "题目里每个词都是要求。挑出来逐条对应。",
          ledeEn: "Every word in the task is a requirement. Pull them out one at a time.",
          body: (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>题目里的词</th>
                      <th>它到底在要求什么</th>
                      <th>对应的技术动作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>「新 note 进入表格」</td>
                      <td>列表末尾多一条，原有的都还在</td>
                      <td><code>[...prev, note]</code></td>
                    </tr>
                    <tr>
                      <td>「<strong>按 id</strong> 被移除」</td>
                      <td>
                        比较的依据必须是 id，不是 title、不是下标。
                        同名笔记只删对的那条。
                      </td>
                      <td><code>filter(n =&gt; n.id !== id)</code></td>
                    </tr>
                    <tr>
                      <td>「内容回填进表单」</td>
                      <td>输入框里出现这条笔记原有的 title 和 content</td>
                      <td><code>useEffect(…, [noteToEdit])</code></td>
                    </tr>
                    <tr>
                      <td>「按钮变 Update」</td>
                      <td>按钮文字从 Add 变成 Update，字面一致</td>
                      <td><code>{"{noteToEdit ? \"Update\" : \"Add\"}"}</code></td>
                    </tr>
                    <tr>
                      <td>「<strong>原位置</strong>更新」</td>
                      <td>
                        改完这条还在原来那一行，顺序不变。
                        <strong>这排除了「先删再加」的写法。</strong>
                      </td>
                      <td><code>map(…)</code> 三元替换</td>
                    </tr>
                    <tr>
                      <td>「退出编辑模式」</td>
                      <td>提交后按钮回到 Add，表单清空，不再处于编辑态</td>
                      <td><code>setNoteToEdit(null)</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>「按 id」和「原位置」是这道题真正的分水岭。</strong>
                两个要求都指向同一件事：出题人想看你会不会用
                <code>filter</code> 和 <code>map</code> 精确操作数组，
                而不是用「删掉再塞回去」这种糊弄过去的写法。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>The words in the brief</th>
                      <th>What they actually demand</th>
                      <th>The technical move</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>&ldquo;the new note enters the table&rdquo;</td>
                      <td>One more row at the end, everything already there stays</td>
                      <td><code>[...prev, note]</code></td>
                    </tr>
                    <tr>
                      <td>&ldquo;removed <strong>by id</strong>&rdquo;</td>
                      <td>
                        The comparison has to be the id, not the title, not the index.
                        With two same-named notes, only the right one goes.
                      </td>
                      <td><code>filter(n =&gt; n.id !== id)</code></td>
                    </tr>
                    <tr>
                      <td>&ldquo;content filled back into the form&rdquo;</td>
                      <td>The inputs show this note&rsquo;s existing title and content</td>
                      <td><code>useEffect(…, [noteToEdit])</code></td>
                    </tr>
                    <tr>
                      <td>&ldquo;the button turns into Update&rdquo;</td>
                      <td>The button text goes from Add to Update, spelled exactly so</td>
                      <td><code>{"{noteToEdit ? \"Update\" : \"Add\"}"}</code></td>
                    </tr>
                    <tr>
                      <td>&ldquo;updated <strong>in place</strong>&rdquo;</td>
                      <td>
                        After the edit it is still on the same row, order unchanged.{" "}
                        <strong>This rules out delete-then-append.</strong>
                      </td>
                      <td><code>map(…)</code> with a ternary</td>
                    </tr>
                    <tr>
                      <td>&ldquo;leave edit mode&rdquo;</td>
                      <td>After submit the button is Add again, the form is empty, and you are no longer editing</td>
                      <td><code>setNoteToEdit(null)</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>&ldquo;By id&rdquo; and &ldquo;in place&rdquo; are the real
                dividing lines here.</strong>{" "}
                Both point at the same thing: the author wants to see whether you can
                work on an array precisely with <code>filter</code> and{" "}
                <code>map</code>, instead of fudging it with &ldquo;delete it and stuff
                it back in&rdquo;.
              </p>
            </>
          ),
        },
        {
          id: "testid-constraint",
          heading: "「不得修改任何 data-testid」具体是什么意思",
          headingEn: "What do not change any data-testid actually means",
          lede: "不只是「别改那串字符」，还包括「别让那个元素消失」。",
          ledeEn: "It is not only do not change that string. It also means do not let that element disappear.",
          body: (
            <>
              <p>
                项目里一共 6 个 <code>data-testid</code>，
                测试全靠它们定位元素：
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>testid</th>
                      <th>在哪个元素上</th>
                      <th>测试用它做什么</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>note-manager</code></td>
                      <td>NoteManager 最外层 div</td>
                      <td>（当前测试没直接用）</td>
                    </tr>
                    <tr>
                      <td><code>note-form</code></td>
                      <td>form 元素</td>
                      <td>（当前测试没直接用）</td>
                    </tr>
                    <tr>
                      <td><code>form-input</code></td>
                      <td>标题输入框</td>
                      <td>往里打字、clear 后重打</td>
                    </tr>
                    <tr>
                      <td><code>form-textarea</code></td>
                      <td>内容文本域</td>
                      <td>往里打字</td>
                    </tr>
                    <tr>
                      <td><code>form-submit-button</code></td>
                      <td>提交按钮</td>
                      <td>点击、断言 disabled、断言文字是 Update</td>
                    </tr>
                    <tr>
                      <td><code>notes-list</code></td>
                      <td>tbody</td>
                      <td><strong>断言它的 textContent 含 / 不含某段文字</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                延伸出三条不能碰的红线：
              </p>
              <ol>
                <li>
                  <strong>不能改字符串。</strong>
                  <code>form-input</code> 改成 <code>title-input</code>，
                  测试 <code>getByTestId(&quot;form-input&quot;)</code> 直接抛错。
                </li>
                <li>
                  <strong>不能让元素条件性消失。</strong>
                  比如给空列表加一个「暂无笔记」的分支、把 <code>tbody</code>
                  整个换掉 —— <code>getByTestId(&quot;notes-list&quot;)</code>
                  会找不到元素而抛错，而第 3 个测试恰恰要在删除后断言它。
                </li>
                <li>
                  <strong>行内按钮的文字也是隐性契约。</strong>
                  测试用 <code>getByRole(&quot;button&quot;, {"{ name: \"Delete\" }"})</code>
                  定位，所以 <code>Delete</code> / <code>Edit</code>
                  这两个词也不能改（改成 Remove 就找不到了）。
                  这一条 README <strong>没写</strong>，只能从测试里读出来。
                </li>
              </ol>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The project has 6 <code>data-testid</code> attributes in total, and the
                tests find every element through them:
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>testid</th>
                      <th>Which element it sits on</th>
                      <th>What the tests do with it</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>note-manager</code></td>
                      <td>The outermost div of NoteManager</td>
                      <td>(not used directly by the current tests)</td>
                    </tr>
                    <tr>
                      <td><code>note-form</code></td>
                      <td>The form element</td>
                      <td>(not used directly by the current tests)</td>
                    </tr>
                    <tr>
                      <td><code>form-input</code></td>
                      <td>The title input</td>
                      <td>Type into it, clear it and type again</td>
                    </tr>
                    <tr>
                      <td><code>form-textarea</code></td>
                      <td>The content textarea</td>
                      <td>Type into it</td>
                    </tr>
                    <tr>
                      <td><code>form-submit-button</code></td>
                      <td>The submit button</td>
                      <td>Click it, assert disabled, assert the text is Update</td>
                    </tr>
                    <tr>
                      <td><code>notes-list</code></td>
                      <td>The tbody</td>
                      <td><strong>Assert its textContent does / does not contain a piece of text</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                Three red lines follow from that:
              </p>
              <ol>
                <li>
                  <strong>You cannot change the string.</strong>{" "}
                  Rename <code>form-input</code> to <code>title-input</code> and{" "}
                  <code>getByTestId(&quot;form-input&quot;)</code> throws on the spot.
                </li>
                <li>
                  <strong>You cannot let the element disappear conditionally.</strong>{" "}
                  Say you add a &ldquo;no notes yet&rdquo; branch for the empty list, or
                  swap out the whole <code>tbody</code> —{" "}
                  <code>getByTestId(&quot;notes-list&quot;)</code> finds nothing and
                  throws, and the third test asserts on it right after a delete.
                </li>
                <li>
                  <strong>The inline button text is an implicit contract too.</strong>{" "}
                  The tests locate them with{" "}
                  <code>getByRole(&quot;button&quot;, {"{ name: \"Delete\" }"})</code>,
                  so the words <code>Delete</code> / <code>Edit</code> are frozen as
                  well (rename one to Remove and it is gone).
                  The README <strong>does not say this</strong>; you can only read it
                  out of the tests.
                </li>
              </ol>
            </>
          ),
        },
        {
          id: "run-the-tests",
          heading: "先跑一遍测试，拿到基线",
          headingEn: "Run the tests first, to get a baseline",
          lede: "改代码之前先知道现在是什么状态 —— 这个习惯值几十分。",
          ledeEn: "Know where you stand before you change any code. This habit is worth a lot of points.",
          body: (
            <>
              <p>
                上一门课讲过：<strong>这个项目没有 test script</strong>，
                <code>npm test</code> 会报 Missing script。要用 npx。
              </p>
              <p>
                本机实测的结果如下 —— 注意这是
                <strong>项目当前磁盘状态</strong>的结果。
                如果你拿到的是挖空版（TODO 还在），
                这里会看到 3 个失败、1 个通过（只有 disabled 那条会过）。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                An earlier module said it: <strong>this project has no test
                script</strong>, so <code>npm test</code> reports Missing script. Use
                npx.
              </p>
              <p>
                Here is what it printed on this machine — note that this is the result
                for <strong>the project as it sits on disk</strong>.
                If what you got is the hollowed-out version with the TODOs still in
                place, you would see 3 failures and 1 pass (only the disabled one gets
                through).
              </p>
            </>
          ),
          code: [
            real(
              "bash",
              `$ cd react-notes-app
$ npm install
$ npx vitest run

 RUN  v4.1.10 react-notes-app

 Test Files  1 passed (1)
      Tests  4 passed (4)
   Duration  1.19s

# 顺便确认另外两件事：
$ npm test
npm error Missing script: "test"        ← 没有这个 script，用 npx

$ npm run build
src/NoteManager.test.tsx(5,1): error TS2582: Cannot find name 'test'.
...共 10 条                              ← 项目自带的配置缺陷，与你的实现无关`,
              {
                filename: "本机实测",
                filenameEn: "Run on a real machine",
                codeEn: `$ cd react-notes-app
$ npm install
$ npx vitest run

 RUN  v4.1.10 react-notes-app

 Test Files  1 passed (1)
      Tests  4 passed (4)
   Duration  1.19s

# Two more things worth checking while you are here:
$ npm test
npm error Missing script: "test"        ← 没有这个 script，用 npx

$ npm run build
src/NoteManager.test.tsx(5,1): error TS2582: Cannot find name 'test'.
...共 10 条                              ← 项目自带的配置缺陷，与你的实现无关`,
                sourceFile: "react-notes-app",
              },
            ),
          ],
        },
        {
          id: "the-landing-spots",
          heading: "三道题的落点：一个文件，三个函数",
          headingEn: "Where the three tasks land: one file, three functions",
          lede: "先把要改的地方框出来，再动手。",
          ledeEn: "Mark the places you have to change, then start writing.",
          body: (
            <>
              <p>
                <code>NoteForm</code>、<code>NoteTable</code>、
                <code>NoteItem</code> 三个文件<strong>都不需要改</strong> ——
                它们已经完整了。所有逻辑都落在
                <code>NoteManager</code> 的三个 handler 上：
              </p>
              <ul>
                <li><code>handleSubmitNote</code> → Task 1 + Task 3 的后半</li>
                <li><code>handleDelete</code> → Task 2</li>
                <li><code>handleEdit</code> → Task 3 的前半</li>
              </ul>
              <p>
                下面是这个文件的完整最终形态（也就是参考答案）。
                <strong>先别细看</strong> —— 接下来三节会一题一题推导出来。
                现在只要看清「结构长什么样」。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>NoteForm</code>, <code>NoteTable</code> and{" "}
                <code>NoteItem</code> <strong>need no changes at all</strong> —
                they are already complete. All the logic lands on the three handlers
                inside <code>NoteManager</code>:
              </p>
              <ul>
                <li><code>handleSubmitNote</code> → Task 1 plus the back half of Task 3</li>
                <li><code>handleDelete</code> → Task 2</li>
                <li><code>handleEdit</code> → the front half of Task 3</li>
              </ul>
              <p>
                Below is the finished shape of that file — the reference answer.{" "}
                <strong>Do not study it yet</strong> — the next three lessons derive it
                one task at a time. For now just see what the structure looks like.
              </p>
            </>
          ),
          code: [
            real("tsx", NOTE_MANAGER_FULL, {
              filename: "src/components/NoteManager/index.tsx（完整参考答案）",
              sourceFile: "react-notes-app/src/components/NoteManager/index.tsx",
              highlight: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 23, 24, 26, 27, 28],
              collapsible: true,
            }),
          ],
        },
      ],
      exercises: [
        {
          kind: "recognition",
          id: "r-q1-forbidden",
          title: "哪一处改动会让测试挂掉",
          titleEn: "Which change makes a test fail",
          level: 1,
          prompt: (
            <p>
              README 只说了「不得修改任何 data-testid」。
              下面哪些改动<strong>也会</strong>让现有测试失败？（多选）
            </p>
          ),
          promptEn: (
            <p>
              The README says only that no data-testid may be changed. Which of
              the changes below <strong>also</strong> break the existing tests?
              (more than one)
            </p>
          ),
          options: [
            {
              id: "a",
              label: '把 NoteItem 里的按钮文字从 "Delete" 改成 "Remove"',
              labelEn: 'Change the button text in NoteItem from "Delete" to "Remove"',
            },
            { id: "b", label: "给 NoteTable 加一个 className", labelEn: "Add a className to NoteTable" },
            {
              id: "c",
              label: '给空列表加分支：notes.length === 0 时不渲染 <tbody data-testid="notes-list">',
              labelEn: 'Add an empty-list branch: when notes.length === 0, do not render <tbody data-testid="notes-list">',
            },
            {
              id: "d",
              label: '把按钮文字从 "Update" 改成 "Save"',
              labelEn: 'Change the button text from "Update" to "Save"',
            },
          ],
          answer: ["a", "c", "d"],
          explain: (
            <>
              A —— 第 3 个测试用{" "}
              <code>getByRole(&quot;button&quot;, {"{ name: \"Delete\" }"})</code>{" "}
              定位，改了文字就找不到。
              <br />
              C —— 第 3 个测试删除后还要断言{" "}
              <code>getByTestId(&quot;notes-list&quot;)</code>，
              元素消失会直接抛错。<strong>testid 元素的存在性也是契约。</strong>
              <br />
              D —— 第 4 个测试显式断言{" "}
              <code>toHaveTextContent(&quot;Update&quot;)</code>。
              <br />
              只有 B 是安全的：className 没有任何测试依赖它。
            </>
          ),
          explainEn: (
            <>
              A — the third test finds the button with{" "}
              <code>getByRole(&quot;button&quot;, {"{ name: \"Delete\" }"})</code>,
              so changing the text means it is no longer found.
              <br />
              C — after the delete, the third test still asserts on{" "}
              <code>getByTestId(&quot;notes-list&quot;)</code>, and a missing
              element throws right there.{" "}
              <strong>
                Whether a testid element exists is part of the contract too.
              </strong>
              <br />
              D — the fourth test asserts{" "}
              <code>toHaveTextContent(&quot;Update&quot;)</code> directly.
              <br />
              Only B is safe: no test depends on className.
            </>
          ),
        },
        {
          kind: "recognition",
          id: "r-q1-hidden-req",
          title: "题目没写但测试在查的是哪一条",
          titleEn: "The requirement the task never states but a test checks",
          level: 1,
          prompt: (
            <p>
              README 的三个 Task 里没提到某个要求，
              但四个测试里有一条专门在查它。是哪个？
            </p>
          ),
          promptEn: (
            <p>
              One requirement is never mentioned in the three Tasks of the README,
              yet one of the four tests checks exactly that. Which one is it?
            </p>
          ),
          options: [
            { id: "a", label: "笔记要按标题排序", labelEn: "The notes have to be sorted by title" },
            {
              id: "b",
              label: "输入为空时提交按钮必须 disabled",
              labelEn: "The submit button has to be disabled while the inputs are empty",
            },
            { id: "c", label: "删除前要弹确认框", labelEn: "A confirmation dialog has to appear before a delete" },
            { id: "d", label: "笔记要存进 localStorage", labelEn: "The notes have to be saved into localStorage" },
          ],
          answer: ["b"],
          explain: (
            <>
              第 2 个测试 <code>submit button disabled when inputs empty</code>{" "}
              断言初始渲染时提交按钮是 disabled 的。
              README 三个 Task 一个字都没提这件事。
              <br />
              <strong>教训：README 是要求的一部分，测试是要求的另一部分。
              两边都要读。</strong>A、C、D 都是题目和测试里都没有的 ——
              自己加这些功能不加分，还可能破坏测试。
            </>
          ),
          explainEn: (
            <>
              The second test,{" "}
              <code>submit button disabled when inputs empty</code>, asserts that
              the submit button is disabled on the first render. The three Tasks
              in the README say nothing at all about it.
              <br />
              <strong>
                The lesson: the README is one part of the requirements and the
                tests are another part. Read both.
              </strong>{" "}
              A, C and D appear in neither the task nor the tests. Adding them
              yourself earns nothing and may break a test.
            </>
          ),
        },
        {
          kind: "ordering",
          id: "r-q1-workflow",
          title: "把上手顺序排对",
          titleEn: "Put the starting steps in order",
          level: 1,
          prompt: <p>拿到这个项目，最合理的动作顺序是什么？</p>,
          promptEn: <p>You just received this project. What is the most sensible order to work in?</p>,
          items: [
            { id: "e", label: "写代码：三个 handler 逐个实现", labelEn: "Write the code: implement the three handlers one at a time" },
            { id: "a", label: "npm install，然后 npx vitest run 拿到基线", labelEn: "npm install, then npx vitest run to get a baseline" },
            {
              id: "c",
              label: "读 NoteForm / NoteTable / NoteItem，确认它们已经完整、不用改",
              labelEn: "Read NoteForm / NoteTable / NoteItem and confirm they are already complete and need no change",
            },
            {
              id: "b",
              label: "读 README + 读测试文件，抄下所有验收标准",
              labelEn: "Read the README and the test file, and write down every acceptance criterion",
            },
            {
              id: "f",
              label: "npx vitest run 验证，再 npm run dev 手动点一遍",
              labelEn: "Verify with npx vitest run, then npm run dev and click through it by hand",
            },
            {
              id: "d",
              label: "读 types/Note.ts，确认数据形状和 id 的类型",
              labelEn: "Read types/Note.ts to confirm the shape of the data and the type of id",
            },
          ],
          answer: ["a", "b", "d", "c", "e", "f"],
          explain: (
            <>
              先装依赖跑基线（知道起点）→ 读题和测试（知道终点）→
              读类型（知道数据长什么样）→ 读现有组件（知道哪些不用碰）→
              才动手写 → 最后测试 + 手动验证。
              <br />
              <strong>最后那步「手动点一遍」不能省</strong> ——
              测试只有一条数据，测不出「原位置更新」和「按 id 删除」，
              这两个恰恰是题目明确要求的。
            </>
          ),
          explainEn: (
            <>
              Install and run the baseline first, so you know the starting point.
              Then read the task and the tests, so you know the end point. Then
              read the types, so you know what the data looks like. Then read the
              existing components, so you know what not to touch. Only then write
              the code, and finish with the tests plus a manual check.
              <br />
              <strong>That last manual pass is not optional.</strong> The tests
              use a single note, so they cannot check &quot;update in place&quot;
              or &quot;delete by id&quot; — and those two are exactly what the
              task asks for.
            </>
          ),
        },
      ],
      callouts: [
        {
          tone: "warn",
          title: "这个项目磁盘上的代码已经是做完的版本",
          body: (
            <p>
              审计发现：<code>react-notes-app/src/components/</code> 里
              <strong>一个 TODO 都不剩</strong>，三个任务已经全部实现，
              4 个测试全过。README 说「按代码里的 TODO 完成」，但那些 TODO
              已经被填掉了。<br />
              所以接下来三节的做法是：<strong>把这份答案当成参考解法来推导</strong>，
              而不是让你去项目里找 TODO。想真正练手，走本模块最后的
              <strong>「从零重写」</strong>—— 那里会给你空白起点。
            </p>
          ),
        },
      ],
      transfer: [
        {
          signal: "题目里出现「按 X」",
          signalEn: "The task says by X",
          reachFor: "比较依据必须是 X，别用别的字段凑",
          reachForEn: "The comparison has to use X, not some other field that happens to work",
        },
        {
          signal: "题目里出现「原位置」「顺序不变」",
          signalEn: "The task says in place or the order stays the same",
          reachFor: "用 map 替换，不能删了再加",
          reachForEn: "Replace with map. Do not remove the item and add it again",
        },
        {
          signal: "看到 data-testid",
          signalEn: "You see a data-testid",
          reachFor: "字符串和元素存在性都不能动",
          reachForEn: "Neither the string nor the presence of the element may change",
        },
        {
          signal: "拿到新项目",
          signalEn: "You are handed a new project",
          reachFor: "先跑基线测试，再读题，再读类型",
          reachForEn: "Run the tests for a baseline, then read the task, then read the types",
        },
      ],
      recap: [
        "三个 Task 的分水岭是「按 id」和「原位置」两个词。",
        "data-testid 不能改字符串，也不能让那个元素条件性消失。",
        "行内按钮文字 Delete / Edit / Update 是测试依赖的隐性契约。",
        "第 2 个测试查的 disabled 是 README 没写的要求 —— 测试也是题面。",
        "三道题全部落在 NoteManager 的三个 handler 上，其余三个组件不用改。",
      ],
      recapEn: [
        "The two phrases that separate the three tasks are by id and in place.",
        "You may not change a data-testid string, and you may not let that element disappear under some condition.",
        "The row button labels Delete, Edit, and Update are an unwritten contract the tests depend on.",
        "The disabled check in the second test is a requirement the README never states. The tests are part of the task too.",
        "All three tasks land on three handlers in NoteManager. The other three components need no changes.",
      ],
    },

    /* ---------- 3.2 ---------- */
    {
      id: "r-task1-add",
      title: "Task 1 · Add：提交表单，新笔记进入表格",
      titleEn: "Task 1 · Add: submit the form and the new note appears in the table",
      blurb: "三道题里最简单的一道，但它建立了后两道题的全部结构。",
      blurbEn: "The easiest of the three tasks, but it sets up the whole structure the other two use.",
      minutes: 12,
      objectives: [
        "独立写出 handleSubmitNote 的新增分支",
        "说清 note 是在哪里被构造出来的、id 从哪来",
        "解释为什么这里必须造新数组",
        "知道对应的测试在断言什么",
      ],
      objectivesEn: [
        "Write the add branch of handleSubmitNote on your own",
        "Say where the note object is built and where its id comes from",
        "Explain why a new array is required here",
        "Know what the matching test asserts",
      ],
      whyForAssessment:
        "第 1 个测试直接查它。而且它确立了「子组件 onSubmit 上报 → 父组件改 notes」这条链 —— Task 3 的后半复用同一个函数。",
      whyForAssessmentEn:
        "The first test checks it directly. It also sets up the chain where the child reports through onSubmit and the parent changes notes. The second half of Task 3 reuses the same function.",
      sourceFiles: [
        { path: "react-notes-app/src/components/NoteManager/index.tsx", role: "handleSubmitNote 的 else 分支", edit: true },
        { path: "react-notes-app/src/components/NoteForm/index.tsx", role: "note 在这里被构造并上报" },
      ],
      concepts: [
        {
          id: "what-asked",
          heading: "这一问在要求什么",
          headingEn: "What this task asks for",
          body: (
            <>
              <p>
                「提交表单 → 新 note 进入表格」。拆开是三件事：
              </p>
              <ol>
                <li>用户在两个输入框里填好内容，点 Add。</li>
                <li>产生一条完整的 <code>Note</code>（含一个唯一 id）。</li>
                <li>这条 note 出现在表格里，<strong>原有的都还在</strong>。</li>
              </ol>
              <p>
                第 2 件事<strong>已经由 NoteForm 做完了</strong>（上一模块读过它）。
                所以你要写的只有第 3 件事。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                &ldquo;Submit the form → the new note enters the table&rdquo;. Split
                open, that is three things:
              </p>
              <ol>
                <li>The user fills in both inputs and clicks Add.</li>
                <li>A complete <code>Note</code> comes into being, with a unique id.</li>
                <li>That note shows up in the table, and <strong>everything already there stays</strong>.</li>
              </ol>
              <p>
                The second one <strong>is already done by NoteForm</strong> (you read it
                in the previous module). So the only thing left for you is the third.
              </p>
            </>
          ),
        },
        {
          id: "tests-what",
          heading: "这一问真正考什么",
          headingEn: "What this task is really testing",
          body: (
            <>
              <p>
                表面上是「往数组里加一条」。真正考的是三点：
              </p>
              <ul>
                <li>
                  <strong>你知不知道数据该往哪存。</strong>
                  notes 在 <code>NoteManager</code>，不在 <code>NoteForm</code>。
                </li>
                <li>
                  <strong>你会不会不可变更新。</strong>
                  <code>push</code> 能让数组变长，但界面不动。
                </li>
                <li>
                  <strong>你能不能顺着 props 找到调用链。</strong>
                  <code>NoteForm</code> 的 <code>onSubmit</code> 这个 prop
                  是从哪来的、传的是谁。
                </li>
              </ul>
            </>
          ),
          bodyEn: (
            <>
              <p>
                On the surface it is &ldquo;append one item to an array&rdquo;. What it
                really tests is three things:
              </p>
              <ul>
                <li>
                  <strong>Whether you know where the data belongs.</strong>{" "}
                  notes lives in <code>NoteManager</code>, not <code>NoteForm</code>.
                </li>
                <li>
                  <strong>Whether you can do an immutable update.</strong>
                  <code>push</code> makes the array longer, but the screen never moves.
                </li>
                <li>
                  <strong>Whether you can follow props to the call chain.</strong>{" "}
                  Where <code>NoteForm</code>&rsquo;s <code>onSubmit</code> prop comes
                  from, and what gets passed into it.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "existing-code",
          heading: "先看现有代码：note 是谁造的",
          headingEn: "Look at the existing code first: who builds the note",
          lede: "NoteForm 已经把整条 note 造好了，包括 id。",
          ledeEn: "NoteForm already builds the whole note, id included.",
          body: (
            <>
              <p>
                <code>handleSubmit</code>（在 <code>NoteForm</code> 里）
                做了这几件事，其中第 3 步就是构造 note：
              </p>
              <p>
                注意 <code>id: noteToEdit ? noteToEdit.id : Date.now()</code>：
                新增时 <code>noteToEdit</code> 是 <code>null</code>，
                所以走 <code>Date.now()</code> —— 当前毫秒时间戳，
                作为 id 足够唯一（同一毫秒内连点两次才会撞，实际上做不到）。
              </p>
              <p>
                还有 <code>.trim()</code>：前后空格被去掉了。
                所以传到 <code>NoteManager</code> 的一定是干净的数据 ——
                你不需要再校验一遍。
              </p>
              <p>
                然后 <code>onSubmit(newNote)</code> 把它交出去。
                <strong>这个 onSubmit 是从 props 来的</strong>，
                而 <code>NoteManager</code> 传给它的正是
                <code>handleSubmitNote</code>：
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>handleSubmit</code> (over in <code>NoteForm</code>) does a handful
                of things, and step 3 is where the note gets built:
              </p>
              <p>
                Look at <code>id: noteToEdit ? noteToEdit.id : Date.now()</code>:
                when adding, <code>noteToEdit</code> is <code>null</code>,
                so it takes <code>Date.now()</code> — the current millisecond timestamp,
                unique enough for an id (you would have to click twice inside one
                millisecond to collide, which you cannot).
              </p>
              <p>
                And <code>.trim()</code>: the surrounding spaces are gone.
                So what reaches <code>NoteManager</code> is always clean data —
                you do not have to validate it again.
              </p>
              <p>
                Then <code>onSubmit(newNote)</code> hands it off.{" "}
                <strong>That onSubmit comes from props</strong>, and what{" "}
                <code>NoteManager</code> passes in is exactly{" "}
                <code>handleSubmitNote</code>:
              </p>
            </>
          ),
          code: [
            real(
              "tsx",
              `// NoteForm 里：构造并上报
const newNote = {
  id: noteToEdit ? noteToEdit.id : Date.now(),
  title: title.trim(),
  content: content.trim(),
};
onSubmit(newNote);`,
              {
                filename: "src/components/NoteForm/index.tsx（节选）",
                filenameEn: "src/components/NoteForm/index.tsx (excerpt)",
                codeEn: `// Inside NoteForm: build the note and report it up
const newNote = {
  id: noteToEdit ? noteToEdit.id : Date.now(),
  title: title.trim(),
  content: content.trim(),
};
onSubmit(newNote);`,
                sourceFile: "react-notes-app/src/components/NoteForm/index.tsx",
              },
            ),
            real(
              "tsx",
              `// NoteManager 里：把 handleSubmitNote 接上去
<NoteForm onSubmit={handleSubmitNote} noteToEdit={noteToEdit} />`,
              {
                filename: "src/components/NoteManager/index.tsx（节选）",
                filenameEn: "src/components/NoteManager/index.tsx (excerpt)",
                codeEn: `// Inside NoteManager: wire handleSubmitNote up
<NoteForm onSubmit={handleSubmitNote} noteToEdit={noteToEdit} />`,
                sourceFile: "react-notes-app/src/components/NoteManager/index.tsx",
                explanation:
                  "所以 NoteForm 里那句 onSubmit(newNote)，实际执行的是 NoteManager 里的 handleSubmitNote(newNote)。这就是「props 传函数」这条链的全貌。",
                explanationEn:
                  "So the line onSubmit(newNote) inside NoteForm really runs handleSubmitNote(newNote) inside NoteManager. That is the whole chain of passing a function through props.",
              },
            ),
          ],
        },
        {
          id: "think-first",
          heading: "先想再写",
          headingEn: "Think it through before you write",
          lede: "下面五个问题都能答上来，代码自然就出来了。",
          ledeEn: "Once you can answer these five questions, the code follows.",
          body: (
            <>
              <ThinkFirst questions={[
"输入是什么？—— 一条已经构造好、已经 trim 过的 Note。",
                  "输出是什么？—— notes 这个 state 的新值。",
                  "新值和旧值什么关系？—— 旧的全部保留，末尾多一条。",
                  "谁负责改？—— 持有 notes 的组件，也就是 NoteManager。",
                  "能不能直接改旧数组？—— 不能。React 靠「是不是同一个对象」判断变化。",
              ]} />
              <p>
                第 3 个问题的答案「旧的全部保留，末尾多一条」，
                翻译成代码就是 <code>[...prev, submittedNote]</code>。
                展开语法把旧数组的每个元素铺开，后面接上新的。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <ThinkFirst questions={[
                "What is the input? A Note that is already built and already trimmed.",
                "What is the output? The new value of the notes state.",
                "How does the new value relate to the old one? Everything old stays, one more at the end.",
                "Who is allowed to change it? The component that holds notes, i.e. NoteManager.",
                "Can you edit the old array directly? No. React decides whether something changed by asking whether it is the same object.",
              ]} />
              <p>
                The answer to question 3, &ldquo;everything old stays, one more at the
                end&rdquo;, turns straight into <code>[...prev, submittedNote]</code>.
                Spread lays out every element of the old array, and the new one goes
                after them.
              </p>
            </>
          ),
        },
        {
          id: "step-by-step",
          heading: "分步实现",
          headingEn: "Build it step by step",
          body: (
            <>
              <p>
                <strong>第一步：先只考虑新增，不管编辑。</strong>
                （编辑是 Task 3 的事，现在假装没有。）
              </p>
              <p>
                <strong>第二步：改成函数式更新。</strong>
                <code>setNotes([...notes, submittedNote])</code> 也能过测试，
                但项目里统一用 <code>prev</code> 形式。理由在上一模块讲过：
                连续调用时不会拿到过期的值。
              </p>
              <p>
                <strong>第三步：给编辑留位置。</strong>
                Task 3 会在这个函数里加一个分支。
                所以最终形态是 <code>if (noteToEdit) {"{...}"} else {"{ 新增 }"}</code>。
                现在先只写 else 那半边。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>Step one: think about adding only, ignore editing.</strong>{" "}
                (Editing belongs to Task 3. Pretend it does not exist yet.)
              </p>
              <p>
                <strong>Step two: switch to the functional update.</strong>
                <code>setNotes([...notes, submittedNote])</code> passes the tests too,
                but the project uses the <code>prev</code> form throughout. The reason
                came up in the previous module: back-to-back calls never read a stale
                value.
              </p>
              <p>
                <strong>Step three: leave room for editing.</strong>{" "}
                Task 3 adds a branch inside this same function.
                So the final shape is <code>if (noteToEdit) {"{...}"} else {"{ add }"}</code>.
                For now write only the else half.
              </p>
            </>
          ),
          code: [
            demo(
              "tsx",
              `// 第一步：最直白的写法
const handleSubmitNote = (submittedNote: Note) => {
  setNotes([...notes, submittedNote]);
};`,
              {
                filename: "推导过程 · 第一步",
                filenameEn: "Working it out · step one",
                codeEn: `// Step one: the most direct version
const handleSubmitNote = (submittedNote: Note) => {
  setNotes([...notes, submittedNote]);
};`,
              },
            ),
            real(
              "tsx",
              `// 最终形态（Task 1 的那半边）
const handleSubmitNote = (submittedNote: Note) => {
  if (noteToEdit) {
    // Task 3 会填这里
  } else {
    setNotes((prev) => [...prev, submittedNote]);
  }
};`,
              {
                filename: "src/components/NoteManager/index.tsx",
                codeEn: `// The final shape (the half that belongs to Task 1)
const handleSubmitNote = (submittedNote: Note) => {
  if (noteToEdit) {
    // Task 3 fills this in
  } else {
    setNotes((prev) => [...prev, submittedNote]);
  }
};`,
                sourceFile: "react-notes-app/src/components/NoteManager/index.tsx",
                highlight: [6],
              },
            ),
          ],
        },
        {
          id: "why-works",
          heading: "为什么这样就成立了",
          headingEn: "Why this works",
          body: (
            <>
              <p>逐段看这一行 <code>setNotes((prev) =&gt; [...prev, submittedNote])</code>：</p>
              <ul>
                <li>
                  <code>setNotes(...)</code> —— 唯一合法的修改途径。
                  调用它 = 告诉 React「值变了，请重新渲染」。
                </li>
                <li>
                  <code>(prev) =&gt; ...</code> —— 函数式更新。
                  React 会把「此刻最新的 notes」作为 <code>prev</code> 传进来。
                </li>
                <li>
                  <code>[...prev, submittedNote]</code> —— 一个
                  <strong>全新的数组</strong>。旧元素逐个铺开，新的接在末尾。
                  因为是新数组，React 能看出变化。
                </li>
              </ul>
              <p>
                之后就是上一模块那张图的流程：state 更新 → <code>NoteManager</code>
                重新执行 → <code>notes</code> 多了一条 →
                <code>NoteTable</code> 收到新数组 →
                <code>notes.map(...)</code> 多产出一个 <code>NoteItem</code> →
                React 对比后往 DOM 里插一个 <code>&lt;tr&gt;</code>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>Read that one line piece by piece — <code>setNotes((prev) =&gt; [...prev, submittedNote])</code>:</p>
              <ul>
                <li>
                  <code>setNotes(...)</code> — the only legal way to change it.
                  Calling it means telling React &ldquo;the value changed, please
                  re-render&rdquo;.
                </li>
                <li>
                  <code>(prev) =&gt; ...</code> — the functional update.
                  React hands you the newest notes at this moment as <code>prev</code>.
                </li>
                <li>
                  <code>[...prev, submittedNote]</code> — a{" "}
                  <strong>brand new array</strong>. The old items are laid out one by
                  one and the new one is attached at the end.
                  Because it is a new array, React can see the change.
                </li>
              </ul>
              <p>
                After that it is the flow from the diagram in the previous module:
                state updates → <code>NoteManager</code> runs again →{" "}
                <code>notes</code> has one more item →{" "}
                <code>NoteTable</code> receives the new array →{" "}
                <code>notes.map(...)</code> produces one more <code>NoteItem</code> →
                React diffs and inserts one <code>&lt;tr&gt;</code> into the DOM.
              </p>
            </>
          ),
        },
        {
          id: "the-test",
          heading: "对应的测试",
          headingEn: "The matching test",
          body: (
            <>
              <p>
                <code>userEvent.type</code> 模拟真人打字（一个字符一个字符触发
                onChange），<code>userEvent.click</code> 模拟点击。
                最后断言 <code>notes-list</code> 这个元素的文字内容里含
                <code>My Title</code>。
              </p>
              <p>
                <strong>注意这个测试的宽松之处：</strong>
                它只检查「文字出现了」。所以就算你把新笔记加在
                <strong>开头</strong>（<code>[submittedNote, ...prev]</code>），
                这个测试照样过。但题目说的是「进入表格」，
                常规理解是追加到末尾 —— 而且真实答案就是追加。
                <strong>别因为测试宽松就随便写。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>userEvent.type</code> types like a real person (one character at a
                time, each firing onChange), and <code>userEvent.click</code> clicks.
                The last line asserts that the text content of the{" "}
                <code>notes-list</code> element contains <code>My Title</code>.
              </p>
              <p>
                <strong>Notice how loose this test is:</strong>{" "}
                it only checks that the text showed up. So even if you put the new note
                at the <strong>front</strong> (<code>[submittedNote, ...prev]</code>),
                it still passes. But the brief says &ldquo;enters the table&rdquo;,
                which normally means appending to the end — and the real answer does
                append.{" "}
                <strong>A loose test is no excuse for a sloppy answer.</strong>
              </p>
            </>
          ),
          code: [
            real(
              "tsx",
              `test("adds a note", async () => {
  render(<NoteManager />);
  await userEvent.type(screen.getByTestId("form-input"), "My Title");
  await userEvent.type(screen.getByTestId("form-textarea"), "My Content");
  await userEvent.click(screen.getByTestId("form-submit-button"));

  expect(screen.getByTestId("notes-list")).toHaveTextContent("My Title");
});`,
              {
                filename: "src/NoteManager.test.tsx（第 1 个测试）",
                sourceFile: "react-notes-app/src/NoteManager.test.tsx",
              },
            ),
          ],
        },
      ],
      exercises: [
        {
          kind: "fill-blank",
          id: "r-t1-blank",
          title: "补全新增逻辑",
          titleEn: "Fill in the add logic",
          level: 2,
          prompt: <p>两个空。想清楚「旧的要不要留」和「用哪种更新形式」。</p>,
          promptEn: (
            <p>
              Two blanks. Decide whether the old notes have to stay, and which
              form of update to use.
            </p>
          ),
          language: "tsx",
          filename: "src/components/NoteManager/index.tsx",
          sourceFile: "react-notes-app/src/components/NoteManager/index.tsx",
          template: `const handleSubmitNote = (submittedNote: Note) => {
  if (noteToEdit) {
    // Task 3
  } else {
    setNotes((___1___) => [___2___, submittedNote]);
  }
};`,
          blanks: [
            {
              n: 1,
              accept: ["prev", "prevNotes", "p"],
              hint: "函数式更新的回调参数，React 会把最新的值交给它。",
              hintEn: "The parameter of the functional-update callback. React hands the latest value to it.",
              why: (
                <>
                  <code>prev</code>（名字随你，项目里用的是 <code>prev</code>）。
                  它是 React 交给你的「此刻最新的 notes」。
                  用它而不是直接用外层的 <code>notes</code> 变量，
                  可以避免拿到过期快照。
                </>
              ),
              whyEn: (
                <>
                  <code>prev</code> (the name is up to you; the project uses{" "}
                  <code>prev</code>). It is the newest value of notes, handed to
                  you by React. Using it instead of the outer{" "}
                  <code>notes</code> variable keeps you from reading a value that
                  is already out of date.
                </>
              ),
              width: 7,
            },
            {
              n: 2,
              accept: ["...prev", "... prev"],
              hint: "旧的每一条都要留下来。用什么把数组「铺开」？",
              hintEn: "Every old note has to stay. What spreads an array out?",
              why: (
                <>
                  <code>...prev</code>。展开语法把旧数组的每个元素铺进新数组。
                  <br />
                  <strong>写成 <code>prev</code>（不带三个点）会怎样？</strong>
                  结果是 <code>[[旧数组], 新note]</code> —— 一个嵌套数组，
                  <code>map</code> 时会渲染出乱七八糟的东西，
                  TypeScript 也会报类型错。
                </>
              ),
              whyEn: (
                <>
                  <code>...prev</code>. The spread syntax lays every element of
                  the old array into the new one.
                  <br />
                  <strong>
                    What happens if you write <code>prev</code> without the three
                    dots?
                  </strong>{" "}
                  You get <code>[[the old array], the new note]</code>, a nested
                  array. <code>map</code> then renders something meaningless, and
                  TypeScript reports a type error too.
                </>
              ),
              width: 9,
            },
          ],
        },
        {
          kind: "code-completion",
          id: "r-t1-write",
          title: "不看答案，自己写出 Task 1",
          titleEn: "Write Task 1 yourself, without looking at the answer",
          level: 3,
          prompt: (
            <p>
              只给你函数签名和要求。自己写完整实现。
              写完点「检查我的代码」，它会用文本规则检查你有没有踩坑。
            </p>
          ),
          promptEn: (
            <p>
              You get the function signature and the requirements. Write the whole
              implementation yourself. When you are done, use the check button:
              it applies text rules to see whether you fell into a known trap.
            </p>
          ),
          language: "tsx",
          filename: "src/components/NoteManager/index.tsx",
          sourceFile: "react-notes-app/src/components/NoteManager/index.tsx",
          starter: `// notes 与 setNotes 已经存在：
//   const [notes, setNotes] = useState<Note[]>([]);
// noteToEdit 也已存在（Task 3 会用，这一题先只写新增分支）

const handleSubmitNote = (submittedNote: Note) => {

};`,
          starterEn: `// notes and setNotes already exist:
//   const [notes, setNotes] = useState<Note[]>([]);
// noteToEdit exists too (Task 3 uses it; here write only the add branch)

const handleSubmitNote = (submittedNote: Note) => {

};`,
          requirements: [
            "把 submittedNote 追加到 notes 的末尾",
            "原有的笔记全部保留",
            "必须用函数式更新 setNotes(prev => ...)",
            "不许用 push / splice / unshift 修改原数组",
            "留出 if (noteToEdit) 分支的位置（Task 3 会填）",
          ],
          requirementsEn: [
            "Append submittedNote to the end of notes",
            "Keep every note that was already there",
            "Use a functional update: setNotes(prev => ...)",
            "Do not change the original array with push / splice / unshift",
            "Leave room for the if (noteToEdit) branch (Task 3 fills it in)",
          ],
          checks: [
            { label: "调用了 setNotes", labelEn: "setNotes is called", must: "setNotes\\s*\\(" },
            {
              label: "用了函数式更新（回调形式）",
              labelEn: "A functional update is used (the callback form)",
              must: "setNotes\\s*\\(\\s*\\(?\\s*\\w+\\s*\\)?\\s*=>",
            },
            { label: "用了展开语法保留旧数据", labelEn: "Spread syntax keeps the old data", must: "\\.\\.\\.\\s*\\w+" },
            {
              label: "新笔记追加在末尾（展开在前）",
              labelEn: "The new note goes at the end (the spread comes first)",
              must: "\\[\\s*\\.\\.\\.\\s*\\w+\\s*,\\s*submittedNote\\s*\\]",
            },
            {
              label: "没有 push / splice / unshift",
              labelEn: "No push / splice / unshift",
              mustNot: "\\.(push|splice|unshift)\\s*\\(",
            },
            { label: "留了 noteToEdit 分支", labelEn: "The noteToEdit branch is left in place", must: "noteToEdit" },
          ],
          hints: [
            "问自己：新的 notes 数组和旧的是什么关系？「旧的全部 + 一条新的」。",
            "改 state 只能通过 setNotes。要「旧的全部」就得把旧数组铺开 —— 用展开语法。",
            "setNotes(接收最新值的回调 => [把旧的铺开， 新的那条])\n外面再包一层 if (noteToEdit) { } else { 这里 }",
            "if (noteToEdit) {\n  // Task 3\n} else {\n  setNotes((prev) => [...prev, submittedNote]);\n}",
          ],
          hintsEn: [
            "Ask yourself: how does the new notes array relate to the old one? All of the old ones, plus one new one.",
            "setNotes is the only way to change the state. To get all of the old ones you have to spread the old array out.",
            "setNotes(callback that receives the latest value => [spread the old ones out, the new one])\nthen wrap that in if (noteToEdit) { } else { here }",
            "if (noteToEdit) {\n  // Task 3\n} else {\n  setNotes((prev) => [...prev, submittedNote]);\n}",
          ],
          solution: real(
            "tsx",
            `const handleSubmitNote = (submittedNote: Note) => {
  if (noteToEdit) {
    // Task 3 的就地替换写在这里
  } else {
    setNotes((prev) => [...prev, submittedNote]);
  }
};`,
            {
              filename: "参考答案",
              filenameEn: "Reference answer",
              codeEn: `const handleSubmitNote = (submittedNote: Note) => {
  if (noteToEdit) {
    // the in-place replace of Task 3 goes here
  } else {
    setNotes((prev) => [...prev, submittedNote]);
  }
};`,
              sourceFile: "react-notes-app/src/components/NoteManager/index.tsx",
            },
          ),
        },
      ],
      mistakes: [
        {
          wrong: demo(
            "tsx",
            `// ✗ 在 NoteForm 里自己存一份列表
const NoteForm = ({ onSubmit }) => {
  const [myNotes, setMyNotes] = useState<Note[]>([]);
  const handleSubmit = (e) => {
    setMyNotes([...myNotes, newNote]);   // 存在 NoteForm 里，表格看不到
    onSubmit(newNote);
  };
};`,
          ),
          why: (
            <>
              <code>NoteTable</code> 拿不到 <code>NoteForm</code> 内部的 state ——
              它们是兄弟。这份 <code>myNotes</code> 白存了。
              <strong>数据只能放在共同祖先。</strong>
            </>
          ),
          whyEn: (
            <>
              <code>NoteTable</code> cannot reach state that lives inside
              <code>NoteForm</code> — they are siblings. This <code>myNotes</code>
              is stored for nothing. <strong>The data can only live in a shared
              parent.</strong>
            </>
          ),
        },
        {
          wrong: demo(
            "tsx",
            `// ✗ 忘了三个点
setNotes((prev) => [prev, submittedNote]);`,
          ),
          why: (
            <>
              这会造出 <code>[[...旧数组], 新note]</code> —— 一个嵌套数组。
              TypeScript 会报
              <code>Type &apos;Note[]&apos; is not assignable to type &apos;Note&apos;</code>。
              好在这个错编译期就被抓到了。
            </>
          ),
          whyEn: (
            <>
              This builds <code>[[...old array], new note]</code>, an array inside
              an array. TypeScript reports
              <code>Type &apos;Note[]&apos; is not assignable to type &apos;Note&apos;</code>.
              At least this mistake is caught at compile time.
            </>
          ),
        },
        {
          wrong: demo(
            "tsx",
            `// ✗ 又造了一个 id
const handleSubmitNote = (submittedNote: Note) => {
  setNotes((prev) => [...prev, { ...submittedNote, id: Date.now() }]);
};`,
          ),
          why: (
            <>
              <code>NoteForm</code> 已经给好 id 了，这里再造一个纯属多余。
              更糟的是<strong>它会直接毁掉 Task 3</strong> ——
              编辑提交时 <code>NoteForm</code> 特意复用了旧 id，
              而这行会把它覆盖成新 id，于是 <code>map</code> 找不到匹配项，
              更新静默失败（列表毫无变化）。
            </>
          ),
          whyEn: (
            <>
              <code>NoteForm</code> already set the id, so building another one
              here is pointless. Worse, <strong>it breaks Task 3</strong>: on an
              edit submit <code>NoteForm</code> deliberately reuses the old id, and
              this line overwrites it with a new one. Then <code>map</code> finds no
              match and the update fails silently, with no change in the list.
            </>
          ),
        },
      ],
      transfer: [
        {
          signal: "「新增一条到列表」",
          signalEn: "Add one item to a list",
          reachFor: "setX(prev => [...prev, item])",
          reachForEn: "setX(prev => [...prev, item])",
        },
        {
          signal: "「加在最前面」",
          signalEn: "Add it at the front",
          reachFor: "setX(prev => [item, ...prev])",
          reachForEn: "setX(prev => [item, ...prev])",
        },
        {
          signal: "子组件已经把数据造好了",
          signalEn: "The child already built the data",
          reachFor: "父组件别再加工，直接存",
          reachForEn: "The parent should store it as it is, not rebuild it",
        },
        {
          signal: "表单提交后要影响别处",
          signalEn: "A form submit has to change something elsewhere",
          reachFor: "onSubmit 上报到共同祖先",
          reachForEn: "Report it up to the shared parent through onSubmit",
        },
      ],
      recap: [
        "note 由 NoteForm 构造（含 id 和 trim），NoteManager 只负责存。",
        "onSubmit 这个 prop 接的就是 handleSubmitNote —— 顺着 props 能找到调用链。",
        "setNotes(prev => [...prev, note]) 是标准写法：新数组、旧的全留、新的在末尾。",
        "不要在 handleSubmitNote 里重新生成 id，那会毁掉 Task 3。",
        "第 1 个测试只查文字出现，比题目要求宽松 —— 别因此偷懒。",
      ],
      recapEn: [
        "NoteForm builds the note, including the id and the trim. NoteManager only stores it.",
        "The onSubmit prop receives handleSubmitNote. Follow the props and you find the call chain.",
        "setNotes(prev => [...prev, note]) is the standard form: a new array, every old item kept, the new one at the end.",
        "Do not generate a new id inside handleSubmitNote. That breaks Task 3.",
        "The first test only checks that the text appears, which is looser than the task requires. Do not do less because of that.",
      ],
    },

    /* ---------- 3.3 ---------- */
    {
      id: "r-task2-delete",
      title: "Task 2 · Delete：点 Delete，该行按 id 被移除",
      titleEn: "Task 2 · Delete: click Delete and that one row is removed by id",
      blurb: "一行 filter。但「按 id」这三个字是有分量的。",
      blurbEn: "One line of filter. But the words by id carry weight.",
      minutes: 11,
      objectives: [
        "独立写出 handleDelete",
        "解释为什么必须按 id 比较而不是 title 或下标",
        "说清 filter 的条件为什么是 !== 而不是 ===",
        "知道这个测试为什么测不出「按 id」这个要求",
      ],
      objectivesEn: [
        "Write handleDelete on your own",
        "Explain why the comparison must use the id and not the title or the index",
        "Say why the filter condition is !== and not ===",
        "Know why this test cannot catch the by id requirement",
      ],
      whyForAssessment:
        "第 3 个测试查它。但那个测试只有一条数据，用 title 比较也能过 —— 这是本项目「测试过了不等于做对了」的第一个实例。",
      whyForAssessmentEn:
        "The third test checks it. But that test has only one note, so comparing by title passes as well. This is the first case in this project where passing tests do not mean the code is correct.",
      sourceFiles: [
        { path: "react-notes-app/src/components/NoteManager/index.tsx", role: "handleDelete", edit: true },
        { path: "react-notes-app/src/components/NoteItem/index.tsx", role: "Delete 按钮在这里上报 id" },
      ],
      concepts: [
        {
          id: "what-asked",
          heading: "这一问在要求什么",
          headingEn: "What this task asks for",
          body: (
            <>
              <p>
                原文：「点 Delete → 该行<strong>按 id</strong> 被移除」。
              </p>
              <p>
                「按 id」是出题人加的限定。它排除了两种写法：
              </p>
              <ul>
                <li>
                  <strong>按下标删</strong>（<code>splice(index, 1)</code>）——
                  下标会随列表变化，而且 <code>splice</code> 改的是原数组。
                </li>
                <li>
                  <strong>按内容删</strong>（<code>n.title !== title</code>）——
                  两条同名笔记会被一起删掉。
                </li>
              </ul>
              <p>
                <code>NoteItem</code> 那边也配合了这个设计 ——
                它上报的<strong>就是 id</strong>：
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The original: &ldquo;click Delete → that row is removed{" "}
                <strong>by id</strong>&rdquo;.
              </p>
              <p>
                &ldquo;By id&rdquo; is a qualifier the author added. It rules out two
                approaches:
              </p>
              <ul>
                <li>
                  <strong>Delete by index</strong> (<code>splice(index, 1)</code>) —
                  indexes shift as the list changes, and <code>splice</code> mutates the
                  original array.
                </li>
                <li>
                  <strong>Delete by content</strong> (<code>n.title !== title</code>) —
                  two notes with the same name go out together.
                </li>
              </ul>
              <p>
                <code>NoteItem</code> is built for this design too — what it reports up
                is <strong>the id itself</strong>:
              </p>
            </>
          ),
          code: [
            real(
              "tsx",
              `// NoteItem：只上报 id
<button onClick={() => onDelete(note.id)} className="danger">
  Delete
</button>

// NoteTableProps / NoteItemProps 的类型也说明了这件事
onDelete: (id: number) => void;`,
              {
                sourceFile:
                  "react-notes-app/src/components/NoteItem/index.tsx 与 NoteTable/index.tsx",
                explanation:
                  "类型签名 (id: number) => void 是一条硬约束：你只会收到 id，收不到整条 note。所以「按 title 删」这条路在类型层面就被堵住了一半 —— 你拿不到 title。",
              },
            ),
          ],
        },
        {
          id: "think-first",
          heading: "先想再写",
          headingEn: "Think it through before you write",
          body: (
            <>
              <ThinkFirst questions={[
"输入是什么？—— 一个 number 类型的 id。",
                  "输出是什么？—— notes 的新值。",
                  "新值和旧值什么关系？—— 少了一条，其余顺序不变。",
                  "哪个数组方法「可能让数组变短」？—— filter。",
                  "filter 保留的是返回 true 的元素，所以条件该写「等于」还是「不等于」？",
              ]} />
              <p>
                最后一问是这道题唯一会绕人的地方。
                <code>filter</code> 的语义是<strong>「留下」</strong>，不是「删掉」。
                所以要删 id 相等的那条，条件必须写成
                <strong>「保留 id 不相等的」</strong>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <ThinkFirst questions={[
                "What is the input? One id, of type number.",
                "What is the output? The new value of notes.",
                "How does the new value relate to the old one? One item fewer, the rest in the same order.",
                "Which array method can make an array shorter? filter.",
                "filter keeps the elements whose callback returns true, so should the condition say equal or not equal?",
              ]} />
              <p>
                That last question is the only place this task twists you around.{" "}
                <code>filter</code> means <strong>keep</strong>, not remove.
                So to delete the note whose id matches, the condition has to read{" "}
                <strong>&ldquo;keep the ones whose id does not match&rdquo;</strong>.
              </p>
            </>
          ),
        },
        {
          id: "implement",
          heading: "实现",
          headingEn: "The implementation",
          body: (
            <>
              <p>一行就够：</p>
              <p>逐段读：</p>
              <ul>
                <li>
                  <code>prev.filter(...)</code> ——
                  <code>filter</code> 永远返回<strong>新数组</strong>，
                  原数组一动不动。所以不可变更新自动满足，
                  不需要额外套展开语法。
                </li>
                <li>
                  <code>(note) =&gt; note.id !== id</code> ——
                  对每一条问一句「你的 id 是不是要删的那个？
                  不是 → 留下」。
                </li>
                <li>
                  没有 <code>if</code> 判断「找不到怎么办」。
                  不需要 —— 如果没有匹配的 id，
                  <code>filter</code> 就原样返回一份全留的新数组，
                  界面无变化。这是合理行为。
                </li>
              </ul>
            </>
          ),
          bodyEn: (
            <>
              <p>One line is enough:</p>
              <p>Read it piece by piece:</p>
              <ul>
                <li>
                  <code>prev.filter(...)</code> —
                  <code>filter</code> always returns a <strong>new array</strong> and
                  leaves the original alone. So the update does not change the original
                  array, and no extra spread is needed.
                </li>
                <li>
                  <code>(note) =&gt; note.id !== id</code> —
                  ask every note: is your id the one being deleted?
                  No → you stay.
                </li>
                <li>
                  There is no <code>if</code> for &ldquo;what if nothing matches&rdquo;.
                  None is needed — with no matching id,{" "}
                  <code>filter</code> returns a new array that keeps everything,
                  and the screen does not change. That is sensible behaviour.
                </li>
              </ul>
            </>
          ),
          code: [
            real(
              "tsx",
              `const handleDelete = (id: number) => {
  setNotes((prev) => prev.filter((note) => note.id !== id));
};`,
              {
                filename: "src/components/NoteManager/index.tsx",
                sourceFile: "react-notes-app/src/components/NoteManager/index.tsx",
              },
            ),
          ],
        },
        {
          id: "test-blind-spot",
          heading: "测试的盲区：为什么它测不出「按 id」",
          headingEn: "The blind spot in the test: why it cannot catch by id",
          lede: "这是这个项目最值得记住的一课。",
          ledeEn: "This is the one lesson from this project most worth remembering.",
          body: (
            <>
              <p>看第 3 个测试：</p>
              <p>
                整个测试<strong>只有一条数据</strong>。所以下面这些写法
                <strong>全都能通过</strong>：
              </p>
              <ul>
                <li><code>prev.filter(n =&gt; n.id !== id)</code> ✓ 正确</li>
                <li>
                  <code>prev.filter(n =&gt; n.title !== &quot;ToDelete&quot;)</code>{" "}
                  —— 硬编码都能过
                </li>
                <li><code>[]</code> —— 直接清空整个列表，也能过</li>
                <li><code>prev.slice(1)</code> —— 删第一条，也能过</li>
              </ul>
              <p>
                <strong>所以：不要用「测试过了」当作「做对了」的证据。</strong>
                这道题的正确性判据是 README 里那句「按 id」，
                以及你自己在 <code>npm run dev</code> 里加三条同名笔记
                手动点一遍的结果。
              </p>
              <p>
                这个道理在 Federation 那门考试里会以更夸张的形式重现 ——
                那边有六个端点<strong>全部返回 null</strong>，
                测试照样过了三个。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>Look at the third test:</p>
              <p>
                The whole test has <strong>exactly one note in it</strong>. Which means
                every one of these <strong>passes</strong>:
              </p>
              <ul>
                <li><code>prev.filter(n =&gt; n.id !== id)</code> ✓ correct</li>
                <li>
                  <code>prev.filter(n =&gt; n.title !== &quot;ToDelete&quot;)</code>{" "}
                  — even hard-coding gets through
                </li>
                <li><code>[]</code> — wiping the whole list gets through too</li>
                <li><code>prev.slice(1)</code> — dropping the first item, also through</li>
              </ul>
              <p>
                <strong>So: never take &ldquo;the tests pass&rdquo; as evidence that you
                got it right.</strong>{" "}
                Correctness here is judged by that phrase &ldquo;by id&rdquo; in the
                README, plus what you see when you add three same-named notes under{" "}
                <code>npm run dev</code> and click through by hand.
              </p>
              <p>
                The same point comes back in a far more extreme form in the Federation
                exam — over there six endpoints <strong>all return null</strong> and
                three tests still pass.
              </p>
            </>
          ),
          code: [
            real(
              "tsx",
              `test("deletes a note", async () => {
  render(<NoteManager />);
  await userEvent.type(screen.getByTestId("form-input"), "ToDelete");
  await userEvent.type(screen.getByTestId("form-textarea"), "x");
  await userEvent.click(screen.getByTestId("form-submit-button"));
  await userEvent.click(screen.getByRole("button", { name: "Delete" }));

  expect(screen.getByTestId("notes-list")).not.toHaveTextContent("ToDelete");
});`,
              {
                filename: "src/NoteManager.test.tsx（第 3 个测试）",
                sourceFile: "react-notes-app/src/NoteManager.test.tsx",
                highlight: [6],
                explanation:
                  "第 6 行 getByRole(\"button\", { name: \"Delete\" }) —— 因为只有一条数据，页面上只有一个 Delete 按钮，所以 getByRole 不会因为「找到多个」而报错。有两条数据时这句就会挂，这也是测试只放一条数据的原因。",
              },
            ),
          ],
        },
        {
          id: "manual-verify",
          heading: "怎么自己验证「按 id」真的做对了",
          headingEn: "How to check for yourself that by id really works",
          body: (
            <>
              <p>
                测试帮不上忙，就自己造一个测试不到的场景：
              </p>
              <ol>
                <li><code>npm run dev</code>，打开浏览器。</li>
                <li>
                  加<strong>三条标题完全相同</strong>的笔记，
                  内容分别写 1、2、3。
                </li>
                <li>点<strong>中间那条</strong>的 Delete。</li>
                <li>
                  <strong>正确</strong>：只有内容为 2 的那条消失，
                  1 和 3 还在，顺序不变。<br />
                  <strong>如果按 title 删</strong>：三条全没了。<br />
                  <strong>如果按下标删</strong>：可能删错行。
                </li>
              </ol>
              <p>
                这种「手动造一个测试覆盖不到的场景」的能力，
                比会写 filter 值钱得多。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The tests cannot help here, so build the scenario they miss yourself:
              </p>
              <ol>
                <li><code>npm run dev</code>, open the browser.</li>
                <li>
                  Add <strong>three notes with exactly the same title</strong>,
                  with contents 1, 2 and 3.
                </li>
                <li>Click Delete on <strong>the middle one</strong>.</li>
                <li>
                  <strong>Correct</strong>: only the one with content 2 disappears;
                  1 and 3 stay, in the same order.<br />
                  <strong>If you deleted by title</strong>: all three vanish.<br />
                  <strong>If you deleted by index</strong>: you may hit the wrong row.
                </li>
              </ol>
              <p>
                This skill — building by hand a scenario the tests do not cover —
                is worth far more than knowing how to write filter.
              </p>
            </>
          ),
        },
      ],
      exercises: [
        {
          kind: "fill-blank",
          id: "r-t2-blank",
          title: "补全删除逻辑",
          level: 2,
          prompt: <p>三个空。第三个空是这道题唯一会绕人的地方。</p>,
          language: "tsx",
          filename: "src/components/NoteManager/index.tsx",
          sourceFile: "react-notes-app/src/components/NoteManager/index.tsx",
          template: `const handleDelete = (id: number) => {
  setNotes((prev) => prev.___1___((note) => note.___2___ ___3___ id));
};`,
          blanks: [
            {
              n: 1,
              accept: ["filter"],
              hint: "删除意味着结果可能变短。哪个方法会？",
              why: (
                <>
                  <code>filter</code>。三个常用方法里只有它会改变长度，
                  而且它返回<strong>新数组</strong>，天然满足不可变更新。
                  <br />
                  <code>map</code> 长度不变（会剩下一个 undefined 洞），
                  <code>splice</code> 会修改原数组（React 看不出变化）。
                </>
              ),
              width: 8,
            },
            {
              n: 2,
              accept: ["id"],
              hint: "题目原文：「该行按 ___ 被移除」。",
              why: (
                <>
                  <code>id</code>。题目明确写了「按 id」。
                  用 <code>title</code> 会把同名笔记一起删掉；
                  而且 <code>handleDelete</code> 的参数只有 id，
                  你根本拿不到 title。
                </>
              ),
              width: 5,
            },
            {
              n: 3,
              accept: ["!==", "!="],
              hint: "filter 保留的是回调返回 true 的元素。要删掉相等的，就要保留……",
              why: (
                <>
                  <code>!==</code>。<code>filter</code> 的语义是「留下」。
                  要删掉 id 相等的那条，就得<strong>保留不相等的</strong>。
                  <br />
                  写成 <code>===</code> 的效果是<strong>只留下要删的那一条</strong>，
                  其余全被删掉 —— 而第 3 个测试断言的正是「删完之后不含
                  ToDelete」，所以<strong>这条会红</strong>，
                  而且报错会指向断言而不是指向你的 <code>filter</code>。
                  总之：<code>filter</code> 想着「留谁」，别想着「删谁」。
                </>
              ),
              width: 5,
            },
          ],
        },
        {
          kind: "code-completion",
          id: "r-t2-write",
          title: "不看答案，自己写出 Task 2",
          level: 3,
          prompt: <p>一行代码的题。但要一次写对，不许用 push / splice。</p>,
          language: "tsx",
          filename: "src/components/NoteManager/index.tsx",
          sourceFile: "react-notes-app/src/components/NoteManager/index.tsx",
          starter: `// 要求：点某一行的 Delete 后，那条笔记按 id 从 notes 里移除
const handleDelete = (id: number) => {

};`,
          requirements: [
            "按 id 移除对应的那一条",
            "其余笔记全部保留，顺序不变",
            "必须用函数式更新",
            "不许修改原数组（不许用 splice）",
            "不许按 title 或下标比较",
          ],
          checks: [
            { label: "用了 filter", must: "\\.filter\\s*\\(" },
            { label: "用了函数式更新", must: "setNotes\\s*\\(\\s*\\(?\\s*\\w+\\s*\\)?\\s*=>" },
            { label: "按 id 比较", must: "\\.id\\s*!==?\\s*id" },
            { label: "条件用的是不等号（保留不匹配的）", must: "!==?\\s*id" },
            { label: "没有 splice / push", mustNot: "\\.(splice|push)\\s*\\(" },
            { label: "没有按 title 比较", mustNot: "\\.title\\s*[!=]==?" },
          ],
          hints: [
            "「移除一条」等价于「保留其余全部」。换个角度想问题。",
            "filter 是唯一会让数组变短的方法，而且它返回新数组。参数里只有 id，所以只能按 id 比。",
            "setNotes(接收最新值 => 最新值.filter(每一条 => 这条的 id 不等于要删的 id))",
            "setNotes((prev) => prev.filter((note) => note.id !== id));",
          ],
          solution: real(
            "tsx",
            `const handleDelete = (id: number) => {
  setNotes((prev) => prev.filter((note) => note.id !== id));
};`,
            {
              filename: "参考答案",
              sourceFile: "react-notes-app/src/components/NoteManager/index.tsx",
            },
          ),
        },
        {
          kind: "debug",
          id: "r-debug-filter-title",
          title: "Debug Lab · 删一条，同名的全没了",
          level: 2,
          prompt: (
            <p>
              测试全过，但手动测试时发现：三条标题相同的笔记，
              点其中一条的 Delete，三条一起消失。
            </p>
          ),
          errorOutput: `# 测试：4 passed (4)   ← 测试全过！
# 手动复现步骤：
#   1. 添加 "会议记录 / 内容1"
#   2. 添加 "会议记录 / 内容2"
#   3. 添加 "会议记录 / 内容3"
#   4. 点第 2 行的 Delete
# 期望：只剩「内容1」「内容3」
# 实际：表格全空`,
          broken: demo(
            "tsx",
            `const handleDelete = (id: number) => {
  const target = notes.find((n) => n.id === id);
  setNotes((prev) => prev.filter((note) => note.title !== target?.title));
};`,
            { filename: "有问题的 handleDelete", highlight: [3] },
          ),
          classify: {
            options: [
              { id: "a", label: "状态更新错误 —— 改了原数组" },
              { id: "b", label: "比较依据错误 —— 按 title 而不是按 id，同名会被一起删" },
              { id: "c", label: "异步错误 —— find 需要 await" },
              { id: "d", label: "类型错误 —— target 可能是 undefined" },
            ],
            answer: "b",
          },
          locate: {
            question: "第 3 行该怎么改？",
            options: [
              { id: "a", label: "改成 prev.filter((note) => note.id !== id)" },
              { id: "b", label: "改成 prev.filter((note) => note.title === target?.title)" },
              { id: "c", label: "在 filter 外面加一个 if (target)" },
              { id: "d", label: "把 find 改成 findIndex，再用 splice" },
            ],
            answer: "a",
          },
          fixed: real(
            "tsx",
            `const handleDelete = (id: number) => {
  setNotes((prev) => prev.filter((note) => note.id !== id));
};`,
            {
              filename: "改对之后",
              sourceFile: "react-notes-app/src/components/NoteManager/index.tsx",
            },
          ),
          rootCause: (
            <>
              <p>
                <code>title</code> 不唯一，<code>id</code> 才唯一。
                按 title 过滤会把所有同名笔记一起清掉。
                中间那两行 <code>find</code> 完全是多余的绕路 ——
                <strong>参数里已经给了 id，直接用就行。</strong>
              </p>
              <p>
                <strong>这道题最重要的一点：测试是全过的。</strong>
                因为测试里只有一条数据，同名场景根本不存在。
                能发现这个 bug 的唯一途径是
                <strong>读懂题目里「按 id」三个字</strong>，
                或者自己手动造一个同名场景。
              </p>
              <p>
                选项 D（<code>findIndex</code> + <code>splice</code>）
                也是错的：<code>splice</code> 修改原数组，
                React 看不出变化，界面不会更新。
              </p>
            </>
          ),
          verify: "npm run dev   # 手动加三条同名笔记，删中间那条，只应消失一条",
        },
      ],
      transfer: [
        {
          signal: "「删除某一条」",
          signalEn: "Delete one item",
          reachFor: "filter + 保留不匹配的（！==）",
          reachForEn: "filter, keeping the items that do not match (!==)",
        },
        {
          signal: "题目强调「按 X」",
          signalEn: "The task stresses by X",
          reachFor: "比较依据只能是 X",
          reachForEn: "X is the only thing you may compare on",
        },
        {
          signal: "回调参数只给了 id",
          signalEn: "The callback only receives an id",
          reachFor: "说明设计上就要求你按 id 操作",
          reachForEn: "That means the design expects you to work by id",
        },
        {
          signal: "测试过了但心里没底",
          signalEn: "The tests pass but you are not sure",
          reachFor: "手动造一个测试覆盖不到的场景（同名、多条、空列表）",
          reachForEn: "Build a case the tests do not cover: same title, several items, an empty list",
        },
      ],
      recap: [
        "handleDelete 就一行：setNotes(prev => prev.filter(n => n.id !== id))。",
        "filter 的语义是「留下」，所以删除要用不等号。",
        "必须按 id 比较：title 不唯一，下标会变，splice 还会改原数组。",
        "第 3 个测试只有一条数据，硬编码甚至清空列表都能过 —— 测试不是正确性证明。",
        "验证「按 id」的办法是手动加三条同名笔记，删中间那条。",
      ],
      recapEn: [
        "handleDelete is one line: setNotes(prev => prev.filter(n => n.id !== id)).",
        "filter means keep, so deleting uses the not-equal operator.",
        "Compare on the id: titles are not unique, indexes shift, and splice changes the original array.",
        "The third test has only one note, so even hard-coding or emptying the list passes. A passing test is not a proof of correctness.",
        "To check by id, add three notes with the same title by hand and delete the middle one.",
      ],
    },

    /* ---------- 3.4 ---------- */
    {
      id: "r-task3-edit",
      title: "Task 3 · Edit：回填、改文字、就地更新、退出编辑",
      titleEn: "Task 3 · Edit: refill the form, change the button text, update the row where it is, leave edit mode",
      blurb: "四个要求串成一条链。这是整道 Q1 的压轴题。",
      blurbEn: "Four requirements linked into one chain. This is the hardest part of Q1.",
      minutes: 18,
      objectives: [
        "独立写出 handleEdit 和 handleSubmitNote 的编辑分支",
        "说清 noteToEdit 这一个 state 同时控制了哪四件事",
        "解释为什么必须复用旧 id，以及不复用会发生什么",
        "解释为什么必须用 map 而不能「先删再加」",
      ],
      objectivesEn: [
        "Write handleEdit and the edit branch of handleSubmitNote on your own",
        "Say which four things the single noteToEdit state controls",
        "Explain why the old id has to be reused, and what happens if it is not",
        "Explain why map is required and why removing the item then adding it is not allowed",
      ],
      whyForAssessment:
        "第 4 个测试查它，而且是四个测试里最长的一条。它同时验证「按钮文字变 Update」和「新内容替换旧内容」。「原位置」这个要求测试查不到，但它是题面明写的。",
      whyForAssessmentEn:
        "The fourth test checks it, and it is the longest of the four. It verifies both that the button text becomes Update and that the new content replaces the old one. No test covers the in place requirement, but the task text states it clearly.",
      sourceFiles: [
        { path: "react-notes-app/src/components/NoteManager/index.tsx", role: "handleEdit + handleSubmitNote 的 if 分支", edit: true },
        { path: "react-notes-app/src/components/NoteForm/index.tsx", role: "useEffect 回填 + id 复用 + 按钮文字（已给好）" },
      ],
      concepts: [
        {
          id: "what-asked",
          heading: "这一问在要求什么",
          headingEn: "What this task asks for",
          body: (
            <>
              <p>
                原文：「点 Edit → 内容回填进表单、按钮变 Update →
                提交 → <strong>原位置</strong>更新该 note、退出编辑模式」。
              </p>
              <p>六个要求，逐个找归属：</p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>要求</th>
                      <th>由谁实现</th>
                      <th>要你写吗</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>点 Edit 进入编辑态</td>
                      <td><code>handleEdit</code> 里 <code>setNoteToEdit(note)</code></td>
                      <td><strong>要</strong></td>
                    </tr>
                    <tr>
                      <td>内容回填进表单</td>
                      <td>NoteForm 的 <code>useEffect(…, [noteToEdit])</code></td>
                      <td>已给好</td>
                    </tr>
                    <tr>
                      <td>按钮变 Update</td>
                      <td>NoteForm 的 <code>{"{noteToEdit ? \"Update\" : \"Add\"}"}</code></td>
                      <td>已给好</td>
                    </tr>
                    <tr>
                      <td>提交时复用旧 id</td>
                      <td>NoteForm 的 <code>id: noteToEdit ? noteToEdit.id : Date.now()</code></td>
                      <td>已给好</td>
                    </tr>
                    <tr>
                      <td><strong>原位置</strong>更新</td>
                      <td><code>handleSubmitNote</code> 的 <code>map</code> 分支</td>
                      <td><strong>要</strong></td>
                    </tr>
                    <tr>
                      <td>退出编辑模式</td>
                      <td><code>setNoteToEdit(null)</code></td>
                      <td><strong>要</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                所以真正要你写的只有三处，全在 <code>NoteManager</code> 里。
                但<strong>你必须读懂已给好的那三处</strong>，
                否则不知道自己写的东西为什么能生效。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The original: &ldquo;click Edit → content filled back into the form, the
                button turns into Update → submit → update that note{" "}
                <strong>in place</strong>, leave edit mode&rdquo;.
              </p>
              <p>Six requirements. Find the owner of each:</p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Requirement</th>
                      <th>Who implements it</th>
                      <th>Do you write it?</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Click Edit to enter edit mode</td>
                      <td><code>setNoteToEdit(note)</code> inside <code>handleEdit</code></td>
                      <td><strong>Yes</strong></td>
                    </tr>
                    <tr>
                      <td>Content filled back into the form</td>
                      <td>NoteForm&rsquo;s <code>useEffect(…, [noteToEdit])</code></td>
                      <td>Already given</td>
                    </tr>
                    <tr>
                      <td>The button turns into Update</td>
                      <td>NoteForm&rsquo;s <code>{"{noteToEdit ? \"Update\" : \"Add\"}"}</code></td>
                      <td>Already given</td>
                    </tr>
                    <tr>
                      <td>Reuse the old id on submit</td>
                      <td>NoteForm&rsquo;s <code>id: noteToEdit ? noteToEdit.id : Date.now()</code></td>
                      <td>Already given</td>
                    </tr>
                    <tr>
                      <td>Update <strong>in place</strong></td>
                      <td>The <code>map</code> branch of <code>handleSubmitNote</code></td>
                      <td><strong>Yes</strong></td>
                    </tr>
                    <tr>
                      <td>Leave edit mode</td>
                      <td><code>setNoteToEdit(null)</code></td>
                      <td><strong>Yes</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                So only three spots are actually yours, all inside{" "}
                <code>NoteManager</code>.
                But <strong>you have to understand the three already given</strong>,
                otherwise you will not know why what you wrote works.
              </p>
            </>
          ),
        },
        {
          id: "one-state-four-jobs",
          heading: "noteToEdit 这一个 state，同时干了四件事",
          headingEn: "One state, noteToEdit, does four jobs at the same time",
          lede: "这是这道题设计上最漂亮的地方。",
          ledeEn: "This is the neatest part of how the task is designed.",
          body: (
            <>
              <p>
                <code>noteToEdit: Note | null</code> 只是一个「当前正在编辑哪条」
                的记录。但因为它被向下传给了 <code>NoteForm</code>，
                它同时成了四件事的开关：
              </p>
              <ol>
                <li>
                  <strong>表单里显示什么</strong> ——
                  effect 依赖它，一变就回填。
                </li>
                <li>
                  <strong>按钮文字</strong> ——
                  非 null 就是 Update。<strong>这个是渲染时同步算的</strong>，
                  所以点 Edit 的那一瞬间文字就变了。
                </li>
                <li>
                  <strong>提交时的 id</strong> ——
                  非 null 就复用它的 id。
                </li>
                <li>
                  <strong>提交进哪个分支</strong> ——
                  <code>handleSubmitNote</code> 里 <code>if (noteToEdit)</code>
                  决定走 map 还是走追加。
                </li>
              </ol>
              <p>
                所以 <code>setNoteToEdit(null)</code> 这一行也同时做了四件事的收尾：
                清空表单、按钮变回 Add、下次提交生成新 id、下次提交走追加分支。
                <strong>漏了这一行，症状是「更新成功了，但表单还留着内容、
                按钮还写着 Update，再改一次又更新同一条」。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>noteToEdit: Note | null</code> is just a record of which note is
                being edited right now. But because it gets passed down to{" "}
                <code>NoteForm</code>, it doubles as the switch for four things:
              </p>
              <ol>
                <li>
                  <strong>What the form shows</strong> —
                  the effect depends on it, so it refills the moment it changes.
                </li>
                <li>
                  <strong>The button text</strong> —
                  non-null means Update. <strong>This one is computed synchronously
                  during render</strong>, so the text flips the instant you click Edit.
                </li>
                <li>
                  <strong>The id used on submit</strong> —
                  non-null means reuse its id.
                </li>
                <li>
                  <strong>Which branch the submit takes</strong> —
                  <code>if (noteToEdit)</code> inside <code>handleSubmitNote</code>{" "}
                  picks map or append.
                </li>
              </ol>
              <p>
                So the single line <code>setNoteToEdit(null)</code> also closes out all
                four: clear the form, flip the button back to Add, generate a fresh id
                next time, take the append branch next time.{" "}
                <strong>Miss that line and the symptom is &ldquo;the update worked, but
                the form still holds the text, the button still says Update, and editing
                again updates the same note&rdquo;.</strong>
              </p>
            </>
          ),
        },
        {
          id: "the-flow",
          heading: "把整条链走一遍",
          headingEn: "Walk the whole chain once",
          lede: "六步。每一步都点开看。",
          ledeEn: "Six steps. Open each one and read it.",
          body: (
            <>
              <p>
                下面这张图把从「点 Edit」到「列表就地更新」的六步拆开了。
                特别注意第 3 步和第 4 步的<strong>时间差</strong> ——
                按钮文字先变，输入框后填。
              </p>
              {EDIT_FLOW}
            </>
          ),
          bodyEn: (
            <>
              <p>
                The diagram below pulls apart the six steps from clicking Edit to the
                list updating in place. Watch the <strong>gap in time</strong> between
                step 3 and step 4 — the button text changes first, the inputs fill in
                after.
              </p>
              {EDIT_FLOW}
            </>
          ),
        },
        {
          id: "why-reuse-id",
          heading: "为什么必须复用旧 id",
          headingEn: "Why the old id has to be reused",
          lede: "这一行是整道题的枢纽。",
          ledeEn: "This one line is the center of the whole task.",
          body: (
            <>
              <p>
                <code>NoteForm</code> 里那行
                <code>id: noteToEdit ? noteToEdit.id : Date.now()</code>：
                编辑时复用旧 id，新增时生成新 id。
              </p>
              <p>
                <strong>为什么关键？</strong>
                因为 <code>handleSubmitNote</code> 的 map 分支靠 id 找那一条：
                <code>note.id === submittedNote.id ? submittedNote : note</code>。
                如果提交上来的 note 带着一个<strong>全新的 id</strong>，
                那 map 会走完整个数组、一个都匹配不上、
                原样返回一份完全一样的新数组。
              </p>
              <p>
                <strong>症状：点 Update 之后什么都没发生。</strong>
                没有报错，列表没变化。而且第 4 个测试会挂在最后两行 ——
                既没出现 &quot;New&quot;，&quot;Old&quot; 也还在。
              </p>
              <p>
                这也解释了 Task 1 那节提到的一个坑：
                如果你在 <code>handleSubmitNote</code> 里自己给 note 重新生成 id，
                Task 1 照样能过，但 Task 3 会静默失败。
                <strong>两道题共享一个函数，一处多余的改动会跨题传染。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                That line in <code>NoteForm</code>,{" "}
                <code>id: noteToEdit ? noteToEdit.id : Date.now()</code>:
                reuse the old id when editing, mint a new one when adding.
              </p>
              <p>
                <strong>Why does it matter?</strong>
                Because the map branch of <code>handleSubmitNote</code> finds the right
                note by id:{" "}
                <code>note.id === submittedNote.id ? submittedNote : note</code>.
                If the submitted note arrives with a <strong>brand new id</strong>,
                map walks the whole array, matches nothing at all,
                and returns a new array with identical contents.
              </p>
              <p>
                <strong>Symptom: clicking Update does nothing.</strong>{" "}
                No error, no change in the list. And the fourth test fails on its last
                two lines — &quot;New&quot; never appears and &quot;Old&quot; is still
                there.
              </p>
              <p>
                This also explains the trap mentioned back in the Task 1 lesson:
                if you mint a new id for the note yourself inside{" "}
                <code>handleSubmitNote</code>,
                Task 1 keeps passing but Task 3 fails silently.{" "}
                <strong>Two tasks share one function, so one redundant change infects
                both.</strong>
              </p>
            </>
          ),
        },
        {
          id: "why-map",
          heading: "为什么必须用 map，不能「先删再加」",
          headingEn: "Why map is required, and why removing the item then adding it is not",
          body: (
            <>
              <p>
                题目写的是「<strong>原位置</strong>更新」。
                对比两种写法在三条笔记上的行为：
              </p>
              <p>
                <strong>而第 4 个测试查不出这个区别</strong> ——
                它只有一条数据，谈不上顺序。
                所以这又是一处「测试过了但没做对」。
                判据只有 README 里那三个字。
              </p>
              <p>
                <code>map</code> 的三元表达式读起来就是题目本身：
                <strong>「是那一条就换成新的，不是就原样留着」</strong>。
                长度不变、顺序不变，这正是「原位置」的定义。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The brief says update <strong>in place</strong>.
                Compare how the two approaches behave on three notes:
              </p>
              <p>
                <strong>And the fourth test cannot tell them apart</strong> —
                with one note there is no order to speak of.
                So here is another &ldquo;the tests pass but it is not right&rdquo;.
                The only judge is those two words in the README.
              </p>
              <p>
                The ternary inside <code>map</code> reads like the brief itself:
                <strong>&ldquo;if it is that one, swap in the new version; if not, leave
                it alone&rdquo;</strong>. Same length, same order — which is exactly what
                &ldquo;in place&rdquo; means.
              </p>
            </>
          ),
          code: [
            demo(
              "text",
              `初始：[A, B, C]，编辑 B → B2

✓ map 替换
  prev.map(n => n.id === B.id ? B2 : n)
  结果：[A, B2, C]        ← B2 还在第二位，符合「原位置」

✗ 先删再加
  [...prev.filter(n => n.id !== B.id), B2]
  结果：[A, C, B2]        ← B2 跳到末尾，顺序变了

✗ 先删再插到头部
  [B2, ...prev.filter(...)]
  结果：[B2, A, C]        ← 也不是原位置`,
              { filename: "三种写法的实际结果" },
            ),
            real(
              "tsx",
              `setNotes((prev) =>
  prev.map((note) =>
    note.id === submittedNote.id ? submittedNote : note,
  ),
);`,
              {
                filename: "src/components/NoteManager/index.tsx（map 分支）",
                sourceFile: "react-notes-app/src/components/NoteManager/index.tsx",
              },
            ),
          ],
        },
        {
          id: "final-code",
          heading: "完整答案",
          headingEn: "The complete answer",
          body: (
            <>
              <p>
                <code>handleEdit</code> 只有一行 —— 它<strong>不碰 notes</strong>，
                因为编辑还没提交，列表不该变。这一点值得强调：
                新手容易在 <code>handleEdit</code> 里就开始改列表。
              </p>
              <p>
                <code>handleSubmitNote</code> 现在两个分支都齐了：
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>handleEdit</code> is one line — it <strong>does not touch
                notes</strong>, because the edit has not been submitted yet and the list
                should not move. Worth stressing: beginners often start changing the list
                right there in <code>handleEdit</code>.
              </p>
              <p>
                <code>handleSubmitNote</code> now has both branches:
              </p>
            </>
          ),
          code: [
            real(
              "tsx",
              `const handleSubmitNote = (submittedNote: Note) => {
  if (noteToEdit) {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === submittedNote.id ? submittedNote : note,
      ),
    );
    setNoteToEdit(null);
  } else {
    setNotes((prev) => [...prev, submittedNote]);
  }
};

const handleEdit = (note: Note) => {
  setNoteToEdit(note);
};`,
              {
                filename: "src/components/NoteManager/index.tsx（三道题的完整落点）",
                sourceFile: "react-notes-app/src/components/NoteManager/index.tsx",
                highlight: [8, 15],
              },
            ),
          ],
        },
        {
          id: "the-test",
          heading: "对应的测试，逐行读",
          headingEn: "The matching test, read line by line",
          body: (
            <>
              <p>
                这是四个测试里最长的一条，它把整条链走了一遍：
              </p>
              <ol>
                <li>3–5 行：先添加一条 <code>Old / c1</code>。</li>
                <li>
                  7 行：点 Edit。
                  <strong>注意这里用 getByRole 按文字 &quot;Edit&quot; 找按钮</strong> ——
                  所以按钮文字不能改。
                </li>
                <li>
                  8 行：断言按钮文字变成 <code>Update</code>。
                  这条直接验证「按钮变 Update」。
                </li>
                <li>
                  10–12 行：<code>clear</code> 输入框再打 <code>New</code>。
                  <strong>clear 能生效说明输入框必须是受控的</strong>，
                  而且 effect 必须已经把旧值填进去了（不然 clear 也没东西可清）。
                </li>
                <li>
                  14–15 行：断言列表里有 <code>New</code> 且没有 <code>Old</code>。
                  这验证「替换而不是新增」—— 如果你写成追加，
                  <code>Old</code> 还在，第二条断言就挂。
                </li>
              </ol>
            </>
          ),
          bodyEn: (
            <>
              <p>
                This is the longest of the four tests, and it walks the whole chain:
              </p>
              <ol>
                <li>Lines 3-5: add one note, <code>Old / c1</code>.</li>
                <li>
                  Line 7: click Edit.{" "}
                  <strong>Note that it finds the button by the text &quot;Edit&quot; with
                  getByRole</strong> — so that word cannot change.
                </li>
                <li>
                  Line 8: assert the button text became <code>Update</code>.
                  That checks &ldquo;the button turns into Update&rdquo; directly.
                </li>
                <li>
                  Lines 10-12: <code>clear</code> the input, then type <code>New</code>.{" "}
                  <strong>The fact that clear does something means the input has to be
                  controlled</strong>, and the effect must already have put the old value
                  in (otherwise there is nothing to clear).
                </li>
                <li>
                  Lines 14-15: assert the list contains <code>New</code> and not{" "}
                  <code>Old</code>.
                  That checks &ldquo;replace, not add&rdquo; — write an append and{" "}
                  <code>Old</code> is still there, so the second assertion fails.
                </li>
              </ol>
            </>
          ),
          code: [
            real(
              "tsx",
              `test("edits a note in place", async () => {
  render(<NoteManager />);
  await userEvent.type(screen.getByTestId("form-input"), "Old");
  await userEvent.type(screen.getByTestId("form-textarea"), "c1");
  await userEvent.click(screen.getByTestId("form-submit-button"));

  await userEvent.click(screen.getByRole("button", { name: "Edit" }));
  expect(screen.getByTestId("form-submit-button")).toHaveTextContent("Update");

  const input = screen.getByTestId("form-input");
  await userEvent.clear(input);
  await userEvent.type(input, "New");
  await userEvent.click(screen.getByTestId("form-submit-button"));

  expect(screen.getByTestId("notes-list")).toHaveTextContent("New");
  expect(screen.getByTestId("notes-list")).not.toHaveTextContent("Old");
});`,
              {
                filename: "src/NoteManager.test.tsx（第 4 个测试）",
                sourceFile: "react-notes-app/src/NoteManager.test.tsx",
                highlight: [7, 8, 15, 16],
              },
            ),
          ],
        },
      ],
      exercises: [
        {
          kind: "fill-blank",
          id: "r-t3-blank",
          title: "补全编辑逻辑的四个关键位置",
          level: 2,
          prompt: (
            <p>
              四个空横跨两个函数。第 4 个空是最容易漏的那一行 ——
              漏了它测试<strong>照样能过</strong>，但行为明显不对。
            </p>
          ),
          language: "tsx",
          filename: "src/components/NoteManager/index.tsx",
          sourceFile: "react-notes-app/src/components/NoteManager/index.tsx",
          template: `const handleSubmitNote = (submittedNote: Note) => {
  if (noteToEdit) {
    setNotes((prev) =>
      prev.___1___((note) =>
        note.id ___2___ submittedNote.id ? ___3___ : note,
      ),
    );
    ___4___;
  } else {
    setNotes((prev) => [...prev, submittedNote]);
  }
};

const handleEdit = (note: Note) => {
  setNoteToEdit(note);
};`,
          blanks: [
            {
              n: 1,
              accept: ["map"],
              hint: "要求「原位置」更新 —— 长度和顺序都不能变。",
              why: (
                <>
                  <code>map</code>。它长度不变、顺序不变，
                  逐个决定「这一项换不换」。这正是「原位置更新」的定义。
                  <br />
                  用 <code>filter</code> + 追加也能让测试过，
                  但被编辑的那条会跳到末尾，违反题目要求。
                </>
              ),
              width: 6,
            },
            {
              n: 2,
              accept: ["===", "=="],
              hint: "map 是「是它就换、不是就留」。这里要找的是匹配的那一条。",
              why: (
                <>
                  <code>===</code>。和 <code>filter</code> 那题正好相反 ——
                  <code>map</code> 的三元判断问的是「这条是不是我要换的那条」，
                  所以用等号。
                  <br />
                  <strong>filter 想「留谁」用 !==，map 想「换谁」用 ===。</strong>
                </>
              ),
              width: 5,
            },
            {
              n: 3,
              accept: ["submittedNote"],
              hint: "匹配上了就换成……什么？",
              why: (
                <>
                  <code>submittedNote</code> —— 提交上来的新版本。
                  它带着<strong>和旧的一样的 id</strong>
                  （NoteForm 复用了），所以替换后 map 依然能找到它。
                </>
              ),
              width: 15,
            },
            {
              n: 4,
              accept: ["setNoteToEdit(null)"],
              hint: "「退出编辑模式」。noteToEdit 该变成什么？",
              why: (
                <>
                  <code>setNoteToEdit(null)</code>。这一行同时做了四件事的收尾：
                  <br />
                  ① effect 的 else 分支触发，清空表单；
                  ② 按钮文字变回 Add；
                  ③ 下次提交会生成新 id；
                  ④ 下次提交走追加分支。
                  <br />
                  <strong>漏了它，第 4 个测试依然会通过</strong>
                  （它没检查提交后的状态），但行为明显是坏的：
                  表单还留着内容、按钮还写 Update、再改一次还是更新同一条。
                </>
              ),
              width: 22,
            },
          ],
        },
        {
          kind: "code-completion",
          id: "r-t3-write",
          title: "不看答案，自己写出完整的 Task 3",
          level: 3,
          prompt: (
            <p>
              把 <code>handleEdit</code> 和 <code>handleSubmitNote</code>
              两个函数完整写出来（含 Task 1 的分支）。
              这是 Q1 的完整答案，写对了这道题就通了。
            </p>
          ),
          language: "tsx",
          filename: "src/components/NoteManager/index.tsx",
          sourceFile: "react-notes-app/src/components/NoteManager/index.tsx",
          starter: `// 已有：
//   const [notes, setNotes] = useState<Note[]>([]);
//   const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
// NoteForm 已给好：编辑时复用旧 id、回填、按钮文字

const handleSubmitNote = (submittedNote: Note) => {

};

const handleEdit = (note: Note) => {

};`,
          requirements: [
            "handleEdit：把这条笔记设为「正在编辑」，不要改动 notes",
            "handleSubmitNote 编辑分支：按 id 就地替换，位置和顺序不变",
            "handleSubmitNote 编辑分支：替换完要退出编辑模式",
            "handleSubmitNote 新增分支：追加到末尾",
            "全部使用函数式更新，不许修改原数组",
          ],
          checks: [
            { label: "handleEdit 调用了 setNoteToEdit(note)", must: "setNoteToEdit\\s*\\(\\s*note\\s*\\)" },
            { label: "handleEdit 没有改动 notes", mustNot: "handleEdit[\\s\\S]{0,120}setNotes" },
            { label: "编辑分支用 map 就地替换", must: "\\.map\\s*\\(" },
            { label: "map 里按 id 用 === 匹配", must: "\\.id\\s*===?\\s*submittedNote\\.id" },
            { label: "替换成 submittedNote", must: "\\?\\s*submittedNote\\s*:" },
            { label: "提交后退出编辑模式", must: "setNoteToEdit\\s*\\(\\s*null\\s*\\)" },
            { label: "新增分支用展开追加", must: "\\[\\s*\\.\\.\\.\\s*\\w+\\s*,\\s*submittedNote\\s*\\]" },
            { label: "没有 push / splice", mustNot: "\\.(push|splice)\\s*\\(" },
            { label: "没有「先 filter 再追加」的写法", mustNot: "filter[\\s\\S]{0,60},\\s*submittedNote" },
          ],
          hints: [
            "handleEdit 只需要做一件事：记下「现在在编辑哪条」。它不该动列表。handleSubmitNote 需要分两种情况。",
            "分支条件用 noteToEdit 是否为 null。编辑用 map（保序），新增用展开（追加）。别忘了「退出编辑模式」也要写。",
            "if (正在编辑) {\n  setNotes(最新值 => 最新值.map(每条 => 这条 id 等于提交的 id ? 提交的 : 这条))\n  把 noteToEdit 设回 null\n} else {\n  setNotes(最新值 => [...最新值， 提交的])\n}",
            "if (noteToEdit) {\n  setNotes((prev) =>\n    prev.map((note) => (note.id === submittedNote.id ? submittedNote : note)),\n  );\n  setNoteToEdit(null);\n} else {\n  setNotes((prev) => [...prev, submittedNote]);\n}",
          ],
          solution: real(
            "tsx",
            `const handleSubmitNote = (submittedNote: Note) => {
  if (noteToEdit) {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === submittedNote.id ? submittedNote : note,
      ),
    );
    setNoteToEdit(null);
  } else {
    setNotes((prev) => [...prev, submittedNote]);
  }
};

const handleEdit = (note: Note) => {
  setNoteToEdit(note);
};`,
            {
              filename: "参考答案（与项目里的实现完全一致，4 个测试全过）",
              sourceFile: "react-notes-app/src/components/NoteManager/index.tsx",
            },
          ),
        },
        {
          kind: "debug",
          id: "r-debug-new-id",
          title: "Debug Lab · 点 Update 之后毫无反应",
          level: 3,
          prompt: (
            <p>
              点 Edit，输入框正常回填，按钮变成 Update。
              改完内容点 Update —— <strong>列表一点变化都没有</strong>，
              表单也没清空。控制台干净。
            </p>
          ),
          errorOutput: `# 没有任何报错。
# 复现：
#   1. 添加 "Old / c1"
#   2. 点 Edit → 输入框显示 Old / c1，按钮变 Update  ✓ 这两步正常
#   3. 把标题改成 "New"，点 Update
# 期望：列表里那条变成 New，表单清空，按钮回到 Add
# 实际：列表还是 Old，表单还留着 New，按钮还是 Update

# 测试结果：
#   ✓ adds a note
#   ✓ submit button disabled when inputs empty
#   ✓ deletes a note
#   ✕ edits a note in place
#       Unable to find text content "New" in element [data-testid="notes-list"]`,
          broken: demo(
            "tsx",
            `const handleSubmitNote = (submittedNote: Note) => {
  const note = { ...submittedNote, id: Date.now() };

  if (noteToEdit) {
    setNotes((prev) =>
      prev.map((n) => (n.id === note.id ? note : n)),
    );
    setNoteToEdit(null);
  } else {
    setNotes((prev) => [...prev, note]);
  }
};`,
            { filename: "有问题的 handleSubmitNote", highlight: [2, 6] },
          ),
          classify: {
            options: [
              { id: "a", label: "useEffect 依赖错误 —— 回填没生效" },
              { id: "b", label: "数据标识错误 —— 重新生成了 id，导致 map 匹配不上任何一条" },
              { id: "c", label: "状态更新错误 —— 改了原数组" },
              { id: "d", label: "事件处理器错误 —— onSubmit 没接上" },
            ],
            answer: "b",
          },
          locate: {
            question: "病灶在哪一行？",
            options: [
              { id: "a", label: "第 2 行：{ ...submittedNote, id: Date.now() } 覆盖了复用的旧 id" },
              { id: "b", label: "第 6 行：应该用 !== 而不是 ===" },
              { id: "c", label: "第 8 行：setNoteToEdit(null) 位置不对" },
              { id: "d", label: "第 10 行：新增分支应该用 unshift" },
            ],
            answer: "a",
          },
          fixed: real(
            "tsx",
            `const handleSubmitNote = (submittedNote: Note) => {
  if (noteToEdit) {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === submittedNote.id ? submittedNote : note,
      ),
    );
    setNoteToEdit(null);
  } else {
    setNotes((prev) => [...prev, submittedNote]);
  }
};`,
            {
              filename: "改对之后：删掉那行多余的 id 生成",
              sourceFile: "react-notes-app/src/components/NoteManager/index.tsx",
            },
          ),
          rootCause: (
            <>
              <p>
                <code>NoteForm</code> 在编辑时<strong>特意复用了旧 id</strong>
                （<code>id: noteToEdit ? noteToEdit.id : Date.now()</code>），
                就是为了让下游的 map 能找到目标。
                第 2 行的 <code>id: Date.now()</code> 把这份苦心覆盖掉了。
              </p>
              <p>
                于是 map 遍历整个数组，拿着一个全新的 id 去比，
                <strong>一个都匹配不上</strong>，原样返回一份内容相同的新数组。
                React 确实重新渲染了（数组是新的），但内容没变，
                所以屏幕上看不出任何动静。
              </p>
              <p>
                <strong>表单没清空又是为什么？</strong>
                <code>setNoteToEdit(null)</code> 明明调了。
                但注意报错顺序 —— 这里表单其实<strong>会</strong>清空。
                如果你观察到表单也没清，那说明你还漏了这一行。
                两个 bug 常常一起出现。
              </p>
              <p>
                <strong>最值得记的一点：这个 bug 只有 Task 3 会挂，
                Task 1 完全正常。</strong>
                因为新增时本来就要新 id。<strong>两道题共用一个函数，
                一处「看起来无害」的多余改动会跨题传染。</strong>
                改共享代码时，要把所有分支都想一遍。
              </p>
            </>
          ),
          verify: "npx vitest run   # 4 个测试应该全过",
        },
      ],
      mistakes: [
        {
          wrong: demo(
            "tsx",
            `// ✗ handleEdit 里就开始改列表
const handleEdit = (note: Note) => {
  setNoteToEdit(note);
  setNotes((prev) => prev.filter((n) => n.id !== note.id));   // 先把它删掉？
};`,
          ),
          why: (
            <>
              点 Edit 只是「进入编辑状态」，用户还没提交，
              甚至可能改完就放弃了。这里把它删掉，
              等于「点 Edit 就丢数据」。
              <strong>handleEdit 唯一的职责是 setNoteToEdit。</strong>
            </>
          ),
          whyEn: (
            <>
              Clicking Edit only enters edit mode. The user has not submitted
              anything yet, and may give up halfway. Removing the note here means
              that clicking Edit loses data.
              <strong>The only job of handleEdit is setNoteToEdit.</strong>
            </>
          ),
        },
        {
          wrong: demo(
            "tsx",
            `// ✗ 忘了退出编辑模式
if (noteToEdit) {
  setNotes((prev) => prev.map((n) => (n.id === submittedNote.id ? submittedNote : n)));
  // 少了 setNoteToEdit(null);
}`,
          ),
          why: (
            <>
              <strong>第 4 个测试照样会过</strong> ——
              它在提交后只检查了列表内容，没检查表单和按钮。
              但行为是坏的：表单还留着刚才的内容、按钮还写着 Update、
              再点一次提交还是在更新同一条。
              <br />
              题目原文有「退出编辑模式」四个字，这是明确要求。
            </>
          ),
          whyEn: (
            <>
              <strong>The fourth test still passes</strong>, because after the
              submit it only checks the list contents, not the form and not the
              button. But the behavior is wrong: the form still holds the previous
              text, the button still says Update, and submitting again updates the
              same note.
              <br />
              The task text says to leave edit mode. That is a stated requirement.
            </>
          ),
        },
        {
          wrong: demo(
            "tsx",
            `// ✗ 用「先删再加」实现更新
if (noteToEdit) {
  setNotes((prev) => [
    ...prev.filter((n) => n.id !== submittedNote.id),
    submittedNote,
  ]);
  setNoteToEdit(null);
}`,
          ),
          why: (
            <>
              测试会过（只有一条数据），但被编辑的那条会
              <strong>跳到列表末尾</strong>，违反题目明写的「原位置」。
              <br />
              验证方法：手动加三条，编辑中间那条，看它是否还在第二行。
            </>
          ),
          whyEn: (
            <>
              The test passes, because there is only one note, but the edited note
              <strong>moves to the end of the list</strong>, which breaks the in
              place requirement stated in the task.
              <br />
              How to check: add three notes by hand, edit the middle one, and see
              whether it is still on the second row.
            </>
          ),
        },
      ],
      transfer: [
        {
          signal: "「更新某一条，位置不变」",
          signalEn: "Update one item without moving it",
          reachFor: "map + 三元，用 === 匹配",
          reachForEn: "map plus a ternary, matching with ===",
        },
        {
          signal: "「进入编辑态 / 选中某一项」",
          signalEn: "Enter edit mode, or select one item",
          reachFor: "一个 selected: T | null 的 state",
          reachForEn: "One state of type selected: T | null",
        },
        {
          signal: "「点了更新但毫无反应」",
          signalEn: "Update was clicked and nothing happened",
          reachFor: "查匹配用的 id 是不是被改过",
          reachForEn: "Check whether the id used for matching was changed",
        },
        {
          signal: "「更新完要恢复初始态」",
          signalEn: "Go back to the starting state after the update",
          reachFor: "把那个 T | null 的 state 设回 null",
          reachForEn: "Set that T | null state back to null",
        },
        {
          signal: "一个函数服务两种模式",
          signalEn: "One function serves two modes",
          reachFor: "改动前把所有分支都想一遍",
          reachForEn: "Think through every branch before you change it",
        },
      ],
      recap: [
        "noteToEdit 一个 state 控制四件事：回填、按钮文字、提交时的 id、提交走哪个分支。",
        "handleEdit 只 setNoteToEdit(note)，绝不碰 notes。",
        "编辑分支用 map + === 就地替换，长度和顺序都不变。",
        "必须复用旧 id，否则 map 匹配不上，更新静默失败。",
        "setNoteToEdit(null) 不能漏 —— 测试查不到，但题目明写了「退出编辑模式」。",
      ],
      recapEn: [
        "The single noteToEdit state controls four things: filling the form, the button text, the id used on submit, and which branch the submit takes.",
        "handleEdit only calls setNoteToEdit(note). It never touches notes.",
        "The edit branch uses map and === to replace the item in place, so the length and the order stay the same.",
        "The old id has to be reused, or map finds no match and the update fails without any message.",
        "Do not forget setNoteToEdit(null). No test checks it, but the task text does say to leave edit mode.",
      ],
    },

    /* ---------- 3.5 ---------- */
    {
      id: "r-tests",
      title: "四个测试逐条读，以及它们的盲区",
      titleEn: "The four tests read line by line, and what they fail to catch",
      blurb: "判卷器长什么样，它查什么，它查不到什么。",
      blurbEn: "What the grader looks like, what it checks, and what it cannot check.",
      minutes: 12,
      objectives: [
        "读懂 Testing Library 的三件套：render / screen / userEvent",
        "说清 getByTestId 和 getByRole 各在什么时候用",
        "知道为什么每个 userEvent 前面都有 await",
        "列出这四个测试的三个盲区，以及怎么自己补上",
      ],
      objectivesEn: [
        "Read the three main pieces of Testing Library: render, screen, and userEvent",
        "Say when to use getByTestId and when to use getByRole",
        "Know why every userEvent call has await in front of it",
        "List the three blind spots of these four tests, and how to cover them yourself",
      ],
      whyForAssessment:
        "测试就是判卷器。看懂它 = 知道及格线在哪。而看懂它的盲区 = 知道题目要求里哪些是测试之外还得自己保证的。",
      whyForAssessmentEn:
        "The tests are the grader. Reading them tells you where the pass line is. Reading their blind spots tells you which requirements you still have to guarantee yourself.",
      sourceFiles: [
        { path: "react-notes-app/src/NoteManager.test.tsx", role: "四个判卷测试" },
        { path: "react-notes-app/vite.config.ts", role: "vitest 配置内联在这里" },
        { path: "react-notes-app/vitest.setup.ts", role: "引入 jest-dom 断言" },
      ],
      concepts: [
        {
          id: "the-setup",
          heading: "测试环境是怎么搭起来的",
          headingEn: "How the test setup is put together",
          lede: "三个文件，各管一段。",
          ledeEn: "Three files, each responsible for one part.",
          body: (
            <>
              <p>
                <strong><code>vite.config.ts</code></strong> ——
                vitest 的配置<strong>内联在 vite 配置里</strong>
                （不是单独的 <code>vitest.config.ts</code>）。
                两个关键项：<code>environment: &quot;jsdom&quot;</code>
                （在 Node 里模拟一个浏览器 DOM，这样 React 才有东西可渲染）、
                <code>globals: true</code>（让 <code>test</code> /
                <code>expect</code> 变成全局变量，不用 import）。
              </p>
              <p>
                <strong><code>vitest.setup.ts</code></strong> ——
                只有一行 <code>import &quot;@testing-library/jest-dom&quot;</code>。
                它给 <code>expect</code> 加了一批 DOM 专用断言：
                <code>toBeDisabled()</code>、<code>toHaveTextContent()</code>。
                <strong>没有它，那两个断言方法就不存在。</strong>
              </p>
              <p>
                顺带回答上一门课那个问题：
                <code>globals: true</code> 让 <code>test</code> 在<strong>运行时</strong>
                存在，但 TypeScript <strong>编译时</strong>并不知道 ——
                这正是 <code>npm run build</code> 报 10 个
                <code>Cannot find name &apos;test&apos;</code> 的原因。
                要修需要在 tsconfig 里加
                <code>&quot;types&quot;: [&quot;vitest/globals&quot;]</code>，
                但题目没让你改配置。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong><code>vite.config.ts</code></strong> —
                the vitest config is <strong>inlined into the vite config</strong>{" "}
                (there is no separate <code>vitest.config.ts</code>).
                Two entries matter: <code>environment: &quot;jsdom&quot;</code>{" "}
                (simulate a browser DOM inside Node, so React has something to render
                into) and <code>globals: true</code> (make <code>test</code> /{" "}
                <code>expect</code> global, no import needed).
              </p>
              <p>
                <strong><code>vitest.setup.ts</code></strong> —
                a single line, <code>import &quot;@testing-library/jest-dom&quot;</code>.
                It adds a batch of DOM-specific assertions to <code>expect</code>:{" "}
                <code>toBeDisabled()</code>, <code>toHaveTextContent()</code>.{" "}
                <strong>Without it, those two methods do not exist.</strong>
              </p>
              <p>
                While we are here, the answer to that question from the previous module:{" "}
                <code>globals: true</code> makes <code>test</code> exist{" "}
                <strong>at runtime</strong>, but TypeScript does not know it{" "}
                <strong>at compile time</strong> — which is exactly why{" "}
                <code>npm run build</code> reports 10 counts of{" "}
                <code>Cannot find name &apos;test&apos;</code>.
                Fixing it would mean adding{" "}
                <code>&quot;types&quot;: [&quot;vitest/globals&quot;]</code> to tsconfig,
                and the brief never told you to touch the config.
              </p>
            </>
          ),
          code: [
            real(
              "ts",
              `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
  },
});`,
              {
                filename: "vite.config.ts（全文）",
                sourceFile: "react-notes-app/vite.config.ts",
                highlight: [6, 7, 8, 9, 10],
              },
            ),
          ],
        },
        {
          id: "three-tools",
          heading: "Testing Library 三件套",
          headingEn: "The three main pieces of Testing Library",
          body: (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>工具</th>
                      <th>作用</th>
                      <th>这个项目里怎么用</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>render</code></td>
                      <td>把组件挂载到 jsdom 里</td>
                      <td><code>render(&lt;NoteManager /&gt;)</code> —— 每个测试都从顶层组件开始</td>
                    </tr>
                    <tr>
                      <td><code>screen</code></td>
                      <td>在渲染结果里查找元素</td>
                      <td><code>getByTestId</code> / <code>getByRole</code></td>
                    </tr>
                    <tr>
                      <td><code>userEvent</code></td>
                      <td>模拟真人操作</td>
                      <td><code>type</code> / <code>click</code> / <code>clear</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>注意每个测试都 render 的是 <code>NoteManager</code>，
                不是单独测 <code>NoteForm</code>。</strong>
                这意味着任何一环断掉都会让测试挂 ——
                受控输入没接好、props 名字对不上、handler 写错，
                全都表现为「同一个测试失败」。
                所以失败时要顺着整条链查，不能只盯一个文件。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tool</th>
                      <th>What it does</th>
                      <th>How this project uses it</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>render</code></td>
                      <td>Mounts the component into jsdom</td>
                      <td><code>render(&lt;NoteManager /&gt;)</code> — every test starts from the top-level component</td>
                    </tr>
                    <tr>
                      <td><code>screen</code></td>
                      <td>Finds elements in the rendered output</td>
                      <td><code>getByTestId</code> / <code>getByRole</code></td>
                    </tr>
                    <tr>
                      <td><code>userEvent</code></td>
                      <td>Acts like a real person</td>
                      <td><code>type</code> / <code>click</code> / <code>clear</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>Notice that every test renders <code>NoteManager</code>,
                not <code>NoteForm</code> on its own.</strong>{" "}
                Which means a break anywhere along the chain fails the test —
                a controlled input wired wrong, a mismatched prop name, a broken handler
                all show up as &ldquo;the same test failed&rdquo;.
                So when one fails, trace the whole chain instead of staring at one file.
              </p>
            </>
          ),
        },
        {
          id: "get-strategies",
          heading: "getByTestId 和 getByRole：为什么两种都用",
          headingEn: "getByTestId and getByRole: why both are used",
          body: (
            <>
              <p>
                <strong><code>getByTestId(&quot;form-input&quot;)</code></strong> ——
                按 <code>data-testid</code> 属性找。
                最稳，因为 testid 是专门为测试加的，不会因为文案改动而变。
                <strong>代价是它跟实现绑死了</strong> ——
                这也是 README 要求「不得修改任何 data-testid」的原因。
              </p>
              <p>
                <strong><code>getByRole(&quot;button&quot;, {"{ name: \"Delete\" }"})</code></strong> ——
                按「无障碍角色 + 可见名称」找，也就是
                「一个按钮，上面写着 Delete」。
                这更接近真人的找法（用户是靠看文字找按钮的）。
                <strong>代价是文案变了就找不到。</strong>
              </p>
              <p>
                这个项目里，表单元素用 testid（它们没有可见文字），
                行内的 Edit / Delete 按钮用 role + name（它们没有 testid）。
                <strong>两种方式各自绑定了不同的东西，
                所以 testid 和按钮文字都不能改。</strong>
              </p>
              <p>
                另外记一个特性：<code>getBy*</code> 系列
                <strong>找不到就抛错，找到多个也抛错</strong>。
                后半条解释了为什么测试里每次只放一条数据 ——
                两条数据就有两个 Delete 按钮，
                <code>getByRole</code> 会因为「找到多个」而失败。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong><code>getByTestId(&quot;form-input&quot;)</code></strong> —
                looks up the <code>data-testid</code> attribute.
                The steadiest option, because a testid exists purely for the tests and
                never changes when the wording does.{" "}
                <strong>The price is that it is welded to the implementation</strong> —
                which is why the README demands &ldquo;do not modify any
                data-testid&rdquo;.
              </p>
              <p>
                <strong><code>getByRole(&quot;button&quot;, {"{ name: \"Delete\" }"})</code></strong> —
                looks up an accessibility role plus a visible name, i.e.
                &ldquo;a button with Delete written on it&rdquo;.
                Closer to how a real person searches (users find buttons by reading them).{" "}
                <strong>The price is that changed wording breaks it.</strong>
              </p>
              <p>
                In this project the form elements use testids (they have no visible text),
                and the inline Edit / Delete buttons use role plus name (they have no
                testid).{" "}
                <strong>Each approach binds a different thing, which is why neither the
                testids nor the button text can change.</strong>
              </p>
              <p>
                One more trait to keep in mind: the <code>getBy*</code> family{" "}
                <strong>throws when it finds nothing, and throws when it finds
                several</strong>.
                The second half explains why the tests only ever add one note —
                two notes mean two Delete buttons, and{" "}
                <code>getByRole</code> fails with &ldquo;found multiple&rdquo;.
              </p>
            </>
          ),
        },
        {
          id: "why-await",
          heading: "为什么每个 userEvent 都要 await",
          headingEn: "Why every userEvent call needs await",
          body: (
            <>
              <p>
                <code>userEvent</code> 的每个方法都返回 Promise。
                因为它模拟的是<strong>真人操作</strong>：
                <code>type(&quot;My Title&quot;)</code> 会一个字符一个字符地触发
                <code>keydown</code> / <code>keypress</code> /
                <code>input</code> / <code>keyup</code>，
                每个字符之间还有微小的间隔。
              </p>
              <p>
                更重要的是：React 的 state 更新和重新渲染是
                <strong>异步批处理</strong>的。
                <code>await</code> 保证「等这次操作引发的所有渲染都结束了」
                再往下走。
              </p>
              <p>
                <strong>漏了 await 会怎样？</strong>
                断言会在渲染完成之前执行，看到的是旧界面，
                于是报「找不到 My Title」——
                但你的代码其实是对的。这是最容易误导人的一类测试失败。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Every <code>userEvent</code> method returns a Promise,
                because what it simulates is <strong>a real person</strong>:{" "}
                <code>type(&quot;My Title&quot;)</code> fires{" "}
                <code>keydown</code> / <code>keypress</code> /{" "}
                <code>input</code> / <code>keyup</code> one character at a time,
                with a tiny gap between characters.
              </p>
              <p>
                More importantly: React batches state updates and re-renders{" "}
                <strong>asynchronously</strong>.{" "}
                <code>await</code> guarantees that every render this action triggered is
                finished before you move on.
              </p>
              <p>
                <strong>What happens if you drop the await?</strong>
                The assertion runs before the render lands, sees the old screen,
                and reports &ldquo;cannot find My Title&rdquo; —
                even though your code is fine. This is the most misleading kind of test
                failure there is.
              </p>
            </>
          ),
          code: [
            demo(
              "tsx",
              `// ✗ 漏了 await：断言跑在渲染之前
userEvent.click(screen.getByTestId("form-submit-button"));
expect(screen.getByTestId("notes-list")).toHaveTextContent("My Title");
//  → Unable to find text content "My Title"  （代码其实没错！）

// ✓
await userEvent.click(screen.getByTestId("form-submit-button"));
expect(screen.getByTestId("notes-list")).toHaveTextContent("My Title");`,
            ),
          ],
        },
        {
          id: "blind-spots",
          heading: "三个盲区，以及怎么自己补",
          headingEn: "Three blind spots, and how to cover them yourself",
          lede: "这一段是本节的重点。",
          ledeEn: "This section is the most important part of the lesson.",
          body: (
            <>
              <p>
                四个测试合起来覆盖了「能不能跑通」，
                但漏掉了三条题目明确要求的东西：
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>题目要求</th>
                      <th>为什么测不出</th>
                      <th>自己怎么验</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Task 2「<strong>按 id</strong> 移除」</td>
                      <td>只有一条数据，按 title 甚至清空列表都能过</td>
                      <td>加三条<strong>同名</strong>笔记，删中间那条</td>
                    </tr>
                    <tr>
                      <td>Task 3「<strong>原位置</strong>更新」</td>
                      <td>只有一条数据，谈不上顺序</td>
                      <td>加三条，编辑<strong>中间</strong>那条，看它还在不在第二行</td>
                    </tr>
                    <tr>
                      <td>Task 3「<strong>退出编辑模式</strong>」</td>
                      <td>提交后没检查表单和按钮状态</td>
                      <td>更新完看按钮是否回到 Add、表单是否清空</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                所以正确的自测流程是<strong>两步</strong>：
              </p>
              <ol>
                <li><code>npx vitest run</code> —— 确认没有低级错误（及格线）。</li>
                <li>
                  <code>npm run dev</code> + 上面三个手动场景 ——
                  确认真的满足题面（真正的正确性）。
                </li>
              </ol>
              <p>
                考场上时间紧，很多人只做第 1 步。
                <strong>而这三条恰好都是 README 明确写了的</strong> ——
                出题人是故意的：他想区分「跑通了」和「读懂了」。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Together the four tests cover &ldquo;does it run&rdquo;,
                but they skip three things the brief explicitly asks for:
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>What the brief asks</th>
                      <th>Why the tests miss it</th>
                      <th>How to check it yourself</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Task 2, &ldquo;removed <strong>by id</strong>&rdquo;</td>
                      <td>One note only, so filtering by title or even wiping the list passes</td>
                      <td>Add three <strong>same-named</strong> notes, delete the middle one</td>
                    </tr>
                    <tr>
                      <td>Task 3, &ldquo;update <strong>in place</strong>&rdquo;</td>
                      <td>One note only, so there is no order to speak of</td>
                      <td>Add three, edit <strong>the middle</strong> one, see whether it is still on row two</td>
                    </tr>
                    <tr>
                      <td>Task 3, &ldquo;<strong>leave edit mode</strong>&rdquo;</td>
                      <td>Nothing checks the form or the button after the submit</td>
                      <td>After an update, see whether the button is Add again and the form is empty</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                So a proper self-check is <strong>two steps</strong>:
              </p>
              <ol>
                <li><code>npx vitest run</code> — confirm there are no basic mistakes (the pass mark).</li>
                <li>
                  <code>npm run dev</code> plus the three manual scenarios above —
                  confirm it really satisfies the brief (actual correctness).
                </li>
              </ol>
              <p>
                Time is tight in the exam, so plenty of people stop after step 1.{" "}
                <strong>And all three of these are spelled out in the README</strong> —
                the author did it on purpose: he wants to separate &ldquo;it runs&rdquo;
                from &ldquo;you read it&rdquo;.
              </p>
            </>
          ),
        },
      ],
      exercises: [
        {
          kind: "recognition",
          id: "r-test-blindspot",
          title: "哪个实现能骗过全部四个测试但其实是错的",
          level: 1,
          prompt: (
            <p>
              下面哪个 <code>handleDelete</code> 能让四个测试<strong>全部通过</strong>，
              但明显违反题目要求？
            </p>
          ),
          options: [
            { id: "a", label: "setNotes((prev) => prev.filter((n) => n.id !== id));" },
            { id: "b", label: "setNotes([]);" },
            { id: "c", label: "setNotes((prev) => prev.slice(0, -1));" },
            { id: "d", label: "B 和 C 都能骗过测试" },
          ],
          answer: ["d"],
          explain: (
            <>
              测试里只添加了一条笔记然后删掉它。所以：
              <br />
              B「清空整个列表」—— 唯一那条也没了，断言「不含 ToDelete」通过。
              <br />
              C「删掉最后一条」—— 唯一那条就是最后一条，也通过。
              <br />
              两者都完全无视了 id，但测试抓不到。
              <strong>这就是为什么必须读题、必须手动验证。</strong>
              A 才是正确实现。
            </>
          ),
        },
        {
          kind: "recognition",
          id: "r-test-await",
          title: "这个测试失败是因为什么",
          level: 1,
          prompt: (
            <p>
              你写的 <code>handleSubmitNote</code> 是{" "}
              <code>setNotes((prev) =&gt; [...prev, submittedNote])</code>，
              但自己加的测试报「找不到 My Title」。
              测试代码是{" "}
              <code>userEvent.click(btn); expect(list).toHaveTextContent(&quot;My Title&quot;)</code>。
              最可能的原因？
            </p>
          ),
          options: [
            { id: "a", label: "handleSubmitNote 写错了" },
            { id: "b", label: "userEvent.click 前面漏了 await，断言跑在重新渲染之前" },
            { id: "c", label: "data-testid 拼错了" },
            { id: "d", label: "jsdom 不支持 tbody" },
          ],
          answer: ["b"],
          explain: (
            <>
              <code>userEvent</code> 的方法都返回 Promise，
              而且 React 的渲染是异步批处理的。
              漏了 <code>await</code>，断言会在界面更新之前执行，
              看到的是旧 DOM。
              <br />
              <strong>特征是「实现看起来完全正确，但测试说找不到」</strong>——
              遇到这种情况先数 await。
              （C 也会导致失败，但报错会是
              <code>Unable to find an element by: [data-testid=...]</code>，
              指向元素而不是文字内容。）
            </>
          ),
        },
        {
          kind: "code-completion",
          id: "r-write-own-test",
          title: "自己补一个测试，覆盖「按 id 删除」这个盲区",
          level: 3,
          prompt: (
            <p>
              现有测试测不出「按 id 删除」。写一个新测试：
              添加<strong>两条同名</strong>笔记，删掉其中一条，
              断言另一条还在。
              <br />
              <span className="dimmer">
                提示：两条数据时页面上有两个 Delete 按钮，
                <code>getByRole</code> 会因为「找到多个」而抛错 ——
                得用 <code>getAllByRole</code>。
              </span>
            </p>
          ),
          generated: true,
          language: "tsx",
          filename: "src/NoteManager.test.tsx（自己加的测试）",
          starter: `test("deletes only the clicked note when titles are identical", async () => {
  render(<NoteManager />);

  // 1. 添加第一条："会议" / "内容A"

  // 2. 添加第二条："会议" / "内容B"

  // 3. 点第一个 Delete 按钮

  // 4. 断言：内容A 不在了，内容B 还在
});`,
          requirements: [
            "添加两条 title 完全相同、content 不同的笔记",
            "用 getAllByRole 拿到 Delete 按钮数组，点第一个",
            "断言 notes-list 不再含「内容A」",
            "断言 notes-list 仍然含「内容B」",
            "所有 userEvent 调用都要 await",
          ],
          checks: [
            { label: "用了 getAllByRole 处理多个 Delete 按钮", must: "getAllByRole\\s*\\(" },
            { label: "点了第一个 Delete 按钮（用了下标 [0]）", must: "\\[\\s*0\\s*\\]" },
            { label: "断言其中一条消失了（not.toHaveTextContent）", must: "not\\.toHaveTextContent" },
            { label: "断言另一条还在（toHaveTextContent）", must: "expect[\\s\\S]*[^t]\\.toHaveTextContent" },
            { label: "userEvent 都加了 await", must: "await\\s+userEvent" },
            { label: "没有用 getByRole 找 Delete（两个会抛错）", mustNot: 'getByRole\\s*\\(\\s*"button"\\s*,\\s*\\{\\s*name:\\s*"Delete"' },
          ],
          hints: [
            "两条数据 → 两个 Delete 按钮 → getBy* 会因为「找到多个」抛错。Testing Library 提供了处理多个元素的另一套查询。",
            "用 getAllByRole(\"button\", { name: \"Delete\" }) 拿到数组，再用下标点第一个。断言用 toHaveTextContent 和它的 not 形式。",
            "先 type 两次 + click 两次添加两条；\nconst buttons = getAllByRole(...);\nawait userEvent.click(buttons[0]);\nexpect(list).not.toHaveTextContent(\"内容A\");\nexpect(list).toHaveTextContent(\"内容B\");",
            'await userEvent.type(screen.getByTestId("form-input"), "会议");\nawait userEvent.type(screen.getByTestId("form-textarea"), "内容A");\nawait userEvent.click(screen.getByTestId("form-submit-button"));\n// 第二条同理，content 写 "内容B"\nconst deleteButtons = screen.getAllByRole("button", { name: "Delete" });\nawait userEvent.click(deleteButtons[0]);',
          ],
          solution: demo(
            "tsx",
            `test("deletes only the clicked note when titles are identical", async () => {
  render(<NoteManager />);

  // 第一条
  await userEvent.type(screen.getByTestId("form-input"), "会议");
  await userEvent.type(screen.getByTestId("form-textarea"), "内容A");
  await userEvent.click(screen.getByTestId("form-submit-button"));

  // 第二条：同名，内容不同
  await userEvent.type(screen.getByTestId("form-input"), "会议");
  await userEvent.type(screen.getByTestId("form-textarea"), "内容B");
  await userEvent.click(screen.getByTestId("form-submit-button"));

  // 两条数据 → 两个 Delete 按钮，必须用 getAllByRole
  const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
  await userEvent.click(deleteButtons[0]);

  const list = screen.getByTestId("notes-list");
  expect(list).not.toHaveTextContent("内容A");
  expect(list).toHaveTextContent("内容B");
});`,
            {
              filename: "参考答案（DrillLab 自己写的测试，不是源项目自带的）",
              explanation:
                "这个测试能抓住「按 title 删」和「清空列表」两种错误实现 —— 前者会把两条都删掉，后者更明显。把它加进 src/NoteManager.test.tsx 后跑 npx vitest run 就能验证。",
            },
          ),
        },
      ],
      transfer: [
        {
          signal: "测试说找不到元素/文字，但代码看着没错",
          signalEn: "The test cannot find an element or some text, but the code looks right",
          reachFor: "先数 await",
          reachForEn: "Count the await keywords first",
        },
        {
          signal: "getByRole 报「找到多个」",
          signalEn: "getByRole reports that it found more than one",
          reachFor: "换 getAllByRole + 下标",
          reachForEn: "Switch to getAllByRole and an index",
        },
        {
          signal: "toBeDisabled is not a function",
          signalEn: "toBeDisabled is not a function",
          reachFor: "缺 jest-dom 的 setupFiles",
          reachForEn: "The setupFiles entry for jest-dom is missing",
        },
        {
          signal: "测试全过但心里没底",
          signalEn: "Every test passes but you are still not sure",
          reachFor: "找测试的盲区，手动造场景补上",
          reachForEn: "Look for the blind spots and build those cases by hand",
        },
      ],
      recap: [
        "vitest 配置内联在 vite.config.ts 里；jest-dom 的断言靠 vitest.setup.ts 引入。",
        "四个测试都 render 顶层 NoteManager，所以任何一环断掉都表现为同一个失败。",
        "testid 用于无文字的表单元素，role + name 用于行内按钮 —— 两者都是契约。",
        "userEvent 都要 await，否则断言跑在重新渲染之前。",
        "三个盲区：按 id 删、原位置更新、退出编辑模式。都得手动验证。",
      ],
      recapEn: [
        "The Vitest config sits inside vite.config.ts, and the jest-dom assertions are loaded by vitest.setup.ts.",
        "All four tests render the top-level NoteManager, so a break anywhere in the chain shows up as the same failure.",
        "data-testid is for form elements with no text, and role plus name is for the row buttons. Both are a contract.",
        "Every userEvent call needs await, or the assertion runs before the re-render.",
        "Three blind spots: deleting by id, updating in place, and leaving edit mode. Check all three by hand.",
      ],
    },
  ],
};
