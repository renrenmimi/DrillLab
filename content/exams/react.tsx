// React Capstone —— 基于 react-notes-app。
//
// 模块拆在 react-part1..4.tsx 里，这个文件负责组装 + 模拟考。

import type { Exam, MockExam } from "../types";
import { demo, tested } from "../helpers";
import { reactMentalModel } from "./react-part1";
import { reactHooks } from "./react-part2";
import { reactQ1 } from "./react-part3";
import { reactMastery, reactQ2 } from "./react-part4";
import { reactVariants } from "./react-part5";

/* ================================================================
   模拟考：换业务场景，考点一致
   ================================================================ */

const MOCK_TEST_FILE = `import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TicketBoard from "./components/TicketBoard";

test("creates a ticket", async () => {
  render(<TicketBoard />);
  await userEvent.type(screen.getByTestId("ticket-subject"), "打印机坏了");
  await userEvent.selectOptions(screen.getByTestId("ticket-priority"), "high");
  await userEvent.click(screen.getByTestId("ticket-submit"));

  expect(screen.getByTestId("ticket-list")).toHaveTextContent("打印机坏了");
});

test("submit disabled when subject empty", () => {
  render(<TicketBoard />);
  expect(screen.getByTestId("ticket-submit")).toBeDisabled();
});

test("closes a ticket by id", async () => {
  render(<TicketBoard />);
  await userEvent.type(screen.getByTestId("ticket-subject"), "网络中断");
  await userEvent.click(screen.getByTestId("ticket-submit"));
  await userEvent.click(screen.getByRole("button", { name: "Close" }));

  expect(screen.getByTestId("ticket-list")).not.toHaveTextContent("网络中断");
});

test("reassigns a ticket in place", async () => {
  render(<TicketBoard />);
  await userEvent.type(screen.getByTestId("ticket-subject"), "旧标题");
  await userEvent.click(screen.getByTestId("ticket-submit"));

  await userEvent.click(screen.getByRole("button", { name: "Reassign" }));
  expect(screen.getByTestId("ticket-submit")).toHaveTextContent("Save");

  const subject = screen.getByTestId("ticket-subject");
  await userEvent.clear(subject);
  await userEvent.type(subject, "新标题");
  await userEvent.click(screen.getByTestId("ticket-submit"));

  expect(screen.getByTestId("ticket-list")).toHaveTextContent("新标题");
  expect(screen.getByTestId("ticket-list")).not.toHaveTextContent("旧标题");
});

test("filters by priority", async () => {
  render(<TicketBoard />);
  await userEvent.type(screen.getByTestId("ticket-subject"), "低优先级问题");
  await userEvent.selectOptions(screen.getByTestId("ticket-priority"), "low");
  await userEvent.click(screen.getByTestId("ticket-submit"));

  await userEvent.type(screen.getByTestId("ticket-subject"), "高优先级问题");
  await userEvent.selectOptions(screen.getByTestId("ticket-priority"), "high");
  await userEvent.click(screen.getByTestId("ticket-submit"));

  await userEvent.selectOptions(screen.getByTestId("filter-priority"), "high");

  expect(screen.getByTestId("ticket-list")).toHaveTextContent("高优先级问题");
  expect(screen.getByTestId("ticket-list")).not.toHaveTextContent("低优先级问题");
});`;

const MOCK_STARTER = `// src/types/Ticket.ts
export type Priority = "low" | "medium" | "high";

export type Ticket = {
  id: number;
  subject: string;
  priority: Priority;
};

// ────────────────────────────────────────────────────
// src/components/TicketBoard/index.tsx
import { useState } from "react";
import type { Priority, Ticket } from "../../types/Ticket";
import TicketForm from "../TicketForm";
import TicketList from "../TicketList";

const TicketBoard: React.FC = () => {
  // TODO 1: tickets 列表
  // TODO 2: 正在改派的工单（没有时为 null）
  // TODO 3: 优先级筛选条件（"all" | Priority）

  // TODO 4: handleSubmitTicket —— 新建 或 就地更新
  // TODO 5: handleClose —— 按 id 移除
  // TODO 6: handleReassign —— 进入改派模式

  // TODO 7: visibleTickets —— 派生数据，别做成 state

  return (
    <div data-testid="ticket-board">
      {/* 筛选下拉：data-testid="filter-priority"，选项 all / low / medium / high */}
      {/* <TicketForm ... /> */}
      {/* <TicketList tickets={visibleTickets} ... /> */}
    </div>
  );
};

export default TicketBoard;

// ────────────────────────────────────────────────────
// src/components/TicketForm/index.tsx
interface TicketFormProps {
  onSubmit: (ticket: Ticket) => void;
  ticketToEdit: Ticket | null;
}

// TODO 8:  受控的 subject 输入框（data-testid="ticket-subject"）
// TODO 9:  受控的 priority 下拉（data-testid="ticket-priority"，默认 medium）
// TODO 10: 提交按钮（data-testid="ticket-submit"）
//          subject 为空（含只有空格）时 disabled
//          改派模式下文字是 "Save"，否则是 "Create"
// TODO 11: ticketToEdit 变化时回填 / 清空
// TODO 12: 提交时 id 的取舍

// ────────────────────────────────────────────────────
// src/components/TicketList/index.tsx
// TODO 13: <ul data-testid="ticket-list">，每条一个 <li>
//          显示 subject 和 priority
//          两个按钮，文字必须正好是 "Reassign" 和 "Close"`;

const ticketMock: MockExam = {
  id: "support-tickets",
  title: "模拟考 A · Support Ticket Board",
  titleEn: "Mock exam A · Support Ticket Board",
  mirrors:
    "与真实 Q1 完全相同的考点：受控输入、列表渲染与 key、useState 的三种不可变更新（增 / 删 / 就地替换）、useEffect 同步外部 prop、派生数据、状态提升、双模式按钮与 id 复用。额外增加一个「筛选」考点 —— 这是这类题最常见的变式方向。",
  mirrorsEn:
    "Exactly the same points as the real Q1: controlled inputs, list rendering and key, the three ways useState updates without changing the original (add, remove, replace in place), useEffect syncing an outside prop, derived data, lifting state up, and a two-mode button reusing an id. One point is added: filtering, which is the most common way this kind of task is varied.",
  scenario:
    "IT 支持工单看板。可以新建工单（标题 + 优先级）、关闭工单、改派（编辑）工单，还能按优先级筛选。业务场景换了，数据结构多了一个枚举字段和一个筛选状态，但底层要你会的东西和 Notes Manager 一模一样。",
  scenarioEn:
    "An IT support ticket board. You can create a ticket (title plus priority), close one, reassign (edit) one, and filter by priority. The business setting is different and the data has one extra enum field and one filter state, but what you need to know underneath is the same as in Notes Manager.",
  minutes: 75,

  // 【这一段的数字全是实测的，别改】
  // 起始态：把 starter 拆成四个文件后 `npx vitest run` → 5 failed / 5 total，
  //         报的是 RTL 的 Unable to find an element by: [data-testid="ticket-subject"]。
  // 参考解法：5 passed / 5 total。
  // 两头都在 scratchpad/mock-tickets 里跑过。
  setup: {
    bootstrap: [
      {
        cmd: "npm create vite@latest ticket-board -- --template react-ts",
        note: { zh: "选 react-ts 模板。别选 JS 模板 —— 这道题的考点之一是读类型", en: "Pick the react-ts template, not the JS one — reading the types is part of what this tests." },
      },
      { cmd: "cd ticket-board && npm install", note: { zh: "装 React 本体", en: "Installs React itself." } },
      {
        cmd: "npm i -D vitest jsdom @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom",
        note: { zh: "判卷器要用的。@testing-library/dom 必须显式装 —— 它是 RTL 的 peerDependency，不会被自动带进来", en: "What the grader needs. @testing-library/dom must be listed explicitly — it is a peerDependency of RTL and does not come along on its own." },
      },
    ],
    files: [
      {
        path: "vite.config.ts",
        role: { zh: "加一段 test 配置：environment 用 jsdom、globals 开、setupFiles 指向下面那个文件", en: "Add a test block: environment jsdom, globals on, setupFiles pointing at the file below." },
      },
      { path: "vitest.setup.ts", role: {
          zh: "一行：import \"@testing-library/jest-dom\";",
          en: "One line: import \"@testing-library/jest-dom\";",
        } },
      { path: "src/types/Ticket.ts", role: {
          zh: "Priority 与 Ticket 类型（starter 里给了）",
          en: "The Priority and Ticket types (given in the starter).",
        } },
      { path: "src/components/TicketBoard/index.tsx", role: { zh: "TODO 1–7：三个 state、三个 handler、派生的 visibleTickets", en: "TODO 1–7: three pieces of state, three handlers, and a derived visibleTickets." }, edit: true },
      { path: "src/components/TicketForm/index.tsx", role: { zh: "TODO 8–12：受控输入、双模式按钮、回填", en: "TODO 8–12: controlled inputs, a dual-mode button, and refilling on edit." }, edit: true },
      { path: "src/components/TicketList/index.tsx", role: { zh: "TODO 13：列表与两个按钮", en: "TODO 13: the list and its two buttons." }, edit: true },
      { path: "src/TicketBoard.test.tsx", role: { zh: "判卷器，五个测试。原样抄下面那份，不要改它", en: "The grader, five tests. Copy it verbatim and do not edit it." }, },
    ],
    baseline: {
      zh: "Tests: 5 failed, 5 total —— 第一条报 Unable to find an element by: [data-testid=\"ticket-subject\"]",
      en: "Tests: 5 failed, 5 total — the first reports Unable to find an element by: [data-testid=\"ticket-subject\"]",
    },
    target: { zh: "Test Files 1 passed (1) / Tests 5 passed (5)", en: "Test Files 1 passed (1) / Tests 5 passed (5)" },
  },
  tasks: [
    {
      id: "t1",
      title: "Task 1 · Create",
      requirement: [
        "填写标题、选择优先级，点 Create 后新工单出现在列表末尾",
        "标题为空（含只有空格）时 Create 按钮必须 disabled",
        "优先级下拉默认选中 medium",
        "提交后清空表单（标题清空，优先级回到 medium）",
      ],
      requirementEn: [
        "Fill in a title, pick a priority, and after Create the new ticket appears at the end of the list",
        "While the title is empty (spaces only counts as empty) the Create button must be disabled",
        "The priority dropdown starts on medium",
        "The form clears after submitting: the title empties and the priority goes back to medium",
      ],
      rubric: [
        {
          points: 8,
          label: "两个表单控件都是受控的（value + onChange）",
          labelEn: "Both form controls are controlled, with value and onChange",
        },
        {
          points: 6,
          label: "用不可变更新追加到末尾，没有 push",
          labelEn: "Appends without changing the original array; no push",
        },
        {
          points: 4,
          label: "disabled 是派生数据，不是额外的 state",
          labelEn: "disabled is derived, not a second piece of state",
        },
        {
          points: 2,
          label: "提交后正确重置表单",
          labelEn: "The form resets correctly after submitting",
        },
      ],
    },
    {
      id: "t2",
      title: "Task 2 · Close",
      requirement: [
        "点某一行的 Close，该工单按 id 从列表移除",
        "两条标题相同的工单，只移除被点的那一条",
      ],
      requirementEn: [
        "Clicking Close on a row removes that ticket from the list by id",
        "With two tickets that share a title, only the one that was clicked is removed",
      ],
      rubric: [
        {
          points: 8,
          label: "用 filter 并按 id 比较",
          labelEn: "Uses filter and compares by id",
        },
        {
          points: 4,
          label: "没有修改原数组（无 splice）",
          labelEn: "The original array is untouched; no splice",
        },
        {
          points: 3,
          label: "回调只接收 id，没有多余参数",
          labelEn: "The callback takes only the id, with no extra arguments",
        },
      ],
    },
    {
      id: "t3",
      title: "Task 3 · Reassign（就地编辑）",
      titleEn: "Task 3 · Reassign (edit in place)",
      requirement: [
        "点某一行的 Reassign：标题和优先级回填进表单，按钮文字变成 Save",
        "改完提交：该工单在原位置被更新，顺序不变",
        "提交后退出改派模式：表单清空、按钮回到 Create",
        "改派时必须复用原 id",
      ],
      requirementEn: [
        "Clicking Reassign on a row puts its title and priority back into the form, and the button now reads Save",
        "Submitting the change updates that ticket in place; the order does not change",
        "Submitting leaves reassign mode: the form clears and the button goes back to Create",
        "Reassigning has to reuse the original id",
      ],
      rubric: [
        {
          points: 10,
          label: "用 map 就地替换，顺序不变（不是先删再加）",
          labelEn: "Replaces in place with map so the order holds; not a remove followed by an add",
        },
        {
          points: 6,
          label: "useEffect 依赖数组只放 ticketToEdit",
          labelEn: "The useEffect dependency array holds only ticketToEdit",
        },
        {
          points: 5,
          label: "提交时复用旧 id",
          labelEn: "The original id is reused on submit",
        },
        {
          points: 4,
          label: "提交后把 ticketToEdit 设回 null",
          labelEn: "ticketToEdit is set back to null after submitting",
        },
        {
          points: 3,
          label: "按钮文字 Save / Create 严格一致",
          labelEn: "The button text is exactly Save or Create, with nothing in between",
        },
      ],
    },
    {
      id: "t4",
      title: "Task 4 · Filter by priority（新增考点）",
      titleEn: "Task 4 · Filter by priority (a point the real Q1 does not have)",
      requirement: [
        '顶部有一个筛选下拉（data-testid="filter-priority"），选项：all / low / medium / high',
        "选中某个优先级后，列表只显示该优先级的工单",
        "筛选不能影响底层数据 —— 切回 all 应该恢复全部",
        "筛选结果必须是派生数据，不许再开一个 state 存筛选后的数组",
      ],
      requirementEn: [
        "There is a filter dropdown at the top (data-testid=\"filter-priority\") with the options all / low / medium / high",
        "Picking a priority shows only the tickets with that priority",
        "Filtering must not touch the underlying data — switching back to all brings everything back",
        "The filtered result has to be derived data; do not add a second piece of state holding the filtered array",
      ],
      rubric: [
        {
          points: 8,
          label: "只用一个 state 存筛选条件",
          labelEn: "One piece of state holds the filter",
        },
        {
          points: 8,
          label: "可见列表是派生出来的（不是第二份 state）",
          labelEn: "The visible list is derived, not a second copy in state",
        },
        {
          points: 4,
          label: "筛选状态下的删除/编辑依然按 id 正确作用于原数据",
          labelEn: "With a filter on, delete and edit still act on the right item by id",
        },
      ],
    },
    {
      id: "t5",
      title: "Task 5 · 工程质量",
      titleEn: "Task 5 · Engineering quality",
      requirement: [
        "列表用 map 渲染，key 用 ticket.id",
        "所有 data-testid 与需求一致",
        "npx tsc --noEmit 无错误",
        "五个测试全过",
      ],
      requirementEn: [
        "The list is rendered with map, using ticket.id as the key",
        "Every data-testid matches the requirements",
        "npx tsc --noEmit reports no errors",
        "All five tests pass",
      ],
      rubric: [
        {
          points: 5,
          label: "key 用了稳定 id，不是 index",
          labelEn: "The key is a stable id, not the index",
        },
        {
          points: 5,
          label: "类型检查通过，Priority 用了联合类型",
          labelEn: "Type checking passes, and Priority is a union type",
        },
        {
          points: 7,
          label: "五个测试全过",
          labelEn: "All five tests pass",
        },
      ],
    },
  ],
  starter: [
    tested("ts", MOCK_STARTER, {
      filename: "starter 代码骨架（13 个 TODO）",
      filenameEn: "The starter skeleton (13 TODOs)",
      collapsible: true,
      explanation:
        "这是 DrillLab 自出的模拟题，不是源项目内容。把它拆成对应文件后自己实现。注意 data-testid 全部被测试依赖，不能改。",
      explanationEn:
        "DrillLab wrote this mock task; it does not come from the source project. Split it into the matching files and write the implementation yourself. Every data-testid is used by a test, so do not rename them.",
    }),
  ],
  tests: [
    tested("tsx", MOCK_TEST_FILE, {
      filename: "src/TicketBoard.test.tsx（判卷器，五个测试）",
      filenameEn: "src/TicketBoard.test.tsx (the marker, five tests)",
      collapsible: true,
      explanation:
        "第五个测试是真实 Q1 没有的 —— 它查筛选。注意 userEvent.selectOptions 用来操作 <select>，这是本模拟题新引入的 API。",
      explanationEn:
        "The fifth test is not part of the real Q1. It checks filtering. Note userEvent.selectOptions, the API for driving a <select>; this mock task is where it first appears.",
    }),
  ],
  commands: [
    { cmd: "npm install", expect: "依赖装好", expectEn: "Dependencies installed" },
    { cmd: "npx vitest run", expect: "Tests 5 passed (5)" },
    {
      cmd: "npm run dev",
      expect:
        "手动验证：① 建三条同名工单，关闭中间那条，只消失一条 ② 改派中间那条，位置不变 ③ 筛选到 high 之后再切回 all，数据完整",
      expectEn:
        "Check by hand: (1) create three tickets with the same title, close the middle one, and only one disappears; (2) reassign the middle one and it stays in place; (3) filter to high, switch back to all, and nothing is lost",
    },
  ],
  walkthrough: [
    {
      id: "m-diff",
      heading: "和真实 Q1 的对应关系",
      headingEn: "How this maps to the real Q1",
      lede: "先看清哪些是原样搬过来的，哪些是新增的。",
      ledeEn: "First see which parts are copied over unchanged, and which parts are new.",
      body: (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>真实 Q1</th>
                  <th>本模拟题</th>
                  <th>考点变了吗</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Note {"{ id, title, content }"}</td>
                  <td>Ticket {"{ id, subject, priority }"}</td>
                  <td>没变。只是多了一个联合类型字段</td>
                </tr>
                <tr>
                  <td>content 是 textarea</td>
                  <td>priority 是 select</td>
                  <td>
                    <strong>受控写法略有不同</strong>：select 也是
                    value + onChange，但值域受限，需要类型断言
                  </td>
                </tr>
                <tr>
                  <td>Add / Update</td>
                  <td>Create / Save</td>
                  <td>没变。只是文案不同 —— 但测试断言的是新文案</td>
                </tr>
                <tr>
                  <td>Delete</td>
                  <td>Close</td>
                  <td>没变，还是 filter 按 id</td>
                </tr>
                <tr>
                  <td>Edit</td>
                  <td>Reassign</td>
                  <td>没变，还是 map 就地替换 + 复用 id</td>
                </tr>
                <tr>
                  <td>—</td>
                  <td>
                    <strong>按优先级筛选</strong>
                  </td>
                  <td>
                    <strong>新考点</strong>：一个条件 state + 一个派生数组
                  </td>
                </tr>
                <tr>
                  <td>表格 tbody / tr</td>
                  <td>列表 ul / li</td>
                  <td>没变，还是 map + key</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            <strong>这就是「题型迁移」的真实样子。</strong>
            换了业务名词、换了一个控件类型、加了一个功能点，
            但底下那七件事一件都没变。 如果你在真实 Q1 里靠背答案过关，这道题会很难；
            如果你理解了「谁持有数据、怎么不可变更新、什么该派生」， 这道题只是换了几个变量名。
          </p>
        </>
      ),
      bodyEn: (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Real Q1</th>
                  <th>This mock</th>
                  <th>Did the skill change?</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Note {"{ id, title, content }"}</td>
                  <td>Ticket {"{ id, subject, priority }"}</td>
                  <td>No. Just one extra union-typed field</td>
                </tr>
                <tr>
                  <td>content is a textarea</td>
                  <td>priority is a select</td>
                  <td>
                    <strong>The controlled pattern differs slightly</strong>: a
                    select also takes value + onChange, but its value range is
                    fixed, so you need a type assertion
                  </td>
                </tr>
                <tr>
                  <td>Add / Update</td>
                  <td>Create / Save</td>
                  <td>No. Only the wording — but the tests assert the new wording</td>
                </tr>
                <tr>
                  <td>Delete</td>
                  <td>Close</td>
                  <td>No, still filter by id</td>
                </tr>
                <tr>
                  <td>Edit</td>
                  <td>Reassign</td>
                  <td>No, still map for in-place replacement and reuse the id</td>
                </tr>
                <tr>
                  <td>—</td>
                  <td>
                    <strong>Filter by priority</strong>
                  </td>
                  <td>
                    <strong>New</strong>: one state for the condition, one derived
                    array
                  </td>
                </tr>
                <tr>
                  <td>Table tbody / tr</td>
                  <td>List ul / li</td>
                  <td>No, still map + key</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            <strong>This is what skill transfer actually looks like.</strong>{" "}
            The business nouns changed, one control type changed, one feature was
            added — and not one of the seven things underneath moved. If you got
            through the real Q1 by memorising the answer, this paper will hurt; if
            you understood who owns the data, how to update it immutably and what
            should be derived, it is a rename.
          </p>
        </>
      ),
    },
    {
      id: "m-select",
      heading: "唯一的新东西：受控的 select",
      headingEn: "The only new piece: a controlled select",
      body: (
        <>
          <p>
            <code>&lt;select&gt;</code> 的受控写法和 input 一样 ——
            <code>value</code> + <code>onChange</code>。两处需要注意：
          </p>
          <ul>
            <li>
              <strong>类型断言。</strong>
              <code>e.target.value</code> 的类型是 <code>string</code>，
              但 state 的类型是 <code>Priority</code>
              （<code>&quot;low&quot; | &quot;medium&quot; | &quot;high&quot;</code>）。
              strict 模式下需要 <code>as Priority</code>。 这是这道题里唯一会让人卡一下的类型问题。
            </li>
            <li>
              <strong>
                用 <code>value</code> 而不是给 option 加 <code>selected</code>。
              </strong>
              React 里控制选中项是 select 的 <code>value</code>， 不是 option 的
              <code>selected</code> 属性。
            </li>
          </ul>
        </>
      ),
      bodyEn: (
        <>
          <p>
            A controlled <code>&lt;select&gt;</code> works just like an input —
            <code>value</code> + <code>onChange</code>. Two things to watch:
          </p>
          <ul>
            <li>
              <strong>The type assertion.</strong>
              <code>e.target.value</code> is typed <code>string</code>, but the
              state is typed <code>Priority</code>{" "}
              (<code>&quot;low&quot; | &quot;medium&quot; | &quot;high&quot;</code>).
              Under strict mode you need <code>as Priority</code>. This is the one
              type puzzle in the whole paper.
            </li>
            <li>
              <strong>
                Use <code>value</code>, not <code>selected</code> on an option.
              </strong>
              In React the chosen item is controlled by the select&rsquo;s{" "}
              <code>value</code>, not by an option&rsquo;s{" "}
              <code>selected</code> attribute.
            </li>
          </ul>
        </>
      ),
      code: [
        demo(
          "tsx",
          `const [priority, setPriority] = useState<Priority>("medium");

<select
  value={priority}
  onChange={(e) => setPriority(e.target.value as Priority)}
  data-testid="ticket-priority"
>
  <option value="low">low</option>
  <option value="medium">medium</option>
  <option value="high">high</option>
</select>`,
          {
            filename: "受控的 select",
            filenameEn: "A controlled select",
            explanation:
              "as Priority 是必要的 —— e.target.value 只知道自己是 string。也可以把 state 类型放宽成 string，但那会失去联合类型的保护，不划算。",
            explanationEn:
              "The as Priority cast is needed: TypeScript only knows e.target.value is a string. You could widen the state type to string instead, but then you lose the protection the union type gives you. Not a good trade.",
          },
        ),
      ],
    },
    {
      id: "m-filter",
      heading: "筛选：一个 state + 一个派生数组",
      headingEn: "Filtering: one state plus one derived array",
      lede: "这是本题唯一的新考点，也是这类题最常见的变式。",
      ledeEn: "This is the only new topic in this question, and the most common variant of this question type.",
      body: (
        <>
          <p>
            很多人会开两个 state：<code>filter</code> 和
            <code>filteredTickets</code>，然后用 <code>useEffect</code>
            让后者跟着前者变。<strong>这是错的</strong> —— 同一个事实存了两份，
            还多了一次不必要的渲染。
          </p>
          <p>
            正解是<strong>一个 state 存条件，可见列表当场算</strong>：
          </p>
          <p>
            <strong>
              关键点：删除和编辑操作的是 <code>tickets</code>（原始数据）， 不是
              <code>visibleTickets</code>。
            </strong>
            因为 handler 收到的是 id，而 id 在原始数据里一定找得到。 如果你在筛选态下用
            <code>visibleTickets</code> 去做 <code>setTickets</code>，
            会把被筛掉的数据全丢了 —— 这是本题最容易犯的错，rubric 里专门留了 4 分给它。
          </p>
        </>
      ),
      bodyEn: (
        <>
          <p>
            Plenty of people reach for two pieces of state: <code>filter</code> and{" "}
            <code>filteredTickets</code>, then a <code>useEffect</code>{" "}
            to keep the second in step with the first. <strong>That is wrong</strong>{" "}
            — the same fact is now stored twice, and you pay for a render you did
            not need.
          </p>
          <p>
            The fix is <strong>one state for the condition, and the visible list
            computed on the spot</strong>:
          </p>
          <p>
            <strong>
              The key point: delete and edit act on <code>tickets</code> (the real
              data), not{" "}
              <code>visibleTickets</code>.
            </strong>
            The handler is given an id, and that id is always findable in the real
            data. If you feed{" "}
            <code>visibleTickets</code> into <code>setTickets</code> while a filter
            is on, everything the filter hid is gone — the easiest mistake to make
            here, and the rubric keeps 4 points for it.
          </p>
        </>
      ),
      code: [
        demo(
          "tsx",
          `const [tickets, setTickets] = useState<Ticket[]>([]);
const [filter, setFilter] = useState<"all" | Priority>("all");

// 派生数据：每次渲染重算，永远和 tickets + filter 一致
const visibleTickets =
  filter === "all" ? tickets : tickets.filter((t) => t.priority === filter);

// 注意：所有写操作都作用于 tickets，不是 visibleTickets
const handleClose = (id: number) => {
  setTickets((prev) => prev.filter((t) => t.id !== id));
};`,
          {
            filename: "筛选的正确实现",
            filenameEn: "The correct way to filter",
            codeEn: `const [tickets, setTickets] = useState<Ticket[]>([]);
const [filter, setFilter] = useState<"all" | Priority>("all");

// Derived data: recomputed on every render, always matches tickets + filter
const visibleTickets =
  filter === "all" ? tickets : tickets.filter((t) => t.priority === filter);

// Note: every write acts on tickets, never on visibleTickets
const handleClose = (id: number) => {
  setTickets((prev) => prev.filter((t) => t.id !== id));
};`,
          },
        ),
        demo(
          "tsx",
          `// ✗ 常见错法：两份数据 + useEffect 同步
const [tickets, setTickets] = useState<Ticket[]>([]);
const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
useEffect(() => {
  setFilteredTickets(filter === "all" ? tickets : tickets.filter(...));
}, [tickets, filter]);

// ✗ 更糟：写操作作用在筛选后的数组上
const handleClose = (id: number) => {
  setTickets(visibleTickets.filter((t) => t.id !== id));
  //         ↑ 被筛掉的工单全没了
};`,
          {
            filename: "两种错法",
            filenameEn: "Two wrong versions",
            codeEn: `// ✗ Common mistake: two copies of the data, kept in sync by useEffect
const [tickets, setTickets] = useState<Ticket[]>([]);
const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
useEffect(() => {
  setFilteredTickets(filter === "all" ? tickets : tickets.filter(...));
}, [tickets, filter]);

// ✗ Worse: the write acts on the filtered array
const handleClose = (id: number) => {
  setTickets(visibleTickets.filter((t) => t.id !== id));
  //         ↑ every ticket the filter hid is now gone
};`,
          },
        ),
      ],
    },
    {
      id: "m-checklist",
      heading: "交卷前自检清单",
      headingEn: "Checklist before you submit",
      body: (
        <>
          <ol>
            <li>
              <code>npx vitest run</code> → 5 passed。
            </li>
            <li>
              <code>npx tsc --noEmit</code> → 无错误。
            </li>
            <li>建三条同名工单，关闭中间那条 → 只消失一条。</li>
            <li>改派中间那条 → 它还在第二位。</li>
            <li>改派提交后 → 按钮是 Create、表单是空的。</li>
            <li>筛选到 high，关闭一条，再切回 all → 其余数据都在。</li>
            <li>
              搜一遍代码，确认没有 <code>push</code> / <code>splice</code> /{" "}
              <code>key={"{index}"}</code>。
            </li>
            <li>确认没有第二个存「筛选结果」的 state。</li>
          </ol>
          <p>第 6 条是本题独有的陷阱，也是最能区分「理解了」和「照抄了」的一条。</p>
        </>
      ),
      bodyEn: (
        <>
          <ol>
            <li>
              <code>npx vitest run</code> → 5 passed.
            </li>
            <li>
              <code>npx tsc --noEmit</code> → no errors.
            </li>
            <li>
              Create three tickets with the same subject, close the middle one →
              only one disappears.
            </li>
            <li>Reassign the middle one → it is still in second place.</li>
            <li>
              After a reassign is submitted → the button says Create and the form is
              empty.
            </li>
            <li>
              Filter to high, close one, switch back to all → everything else is
              still there.
            </li>
            <li>
              Search the code and confirm there is no <code>push</code> /{" "}
              <code>splice</code> / <code>key={"{index}"}</code>.
            </li>
            <li>Confirm there is no second state holding the filtered result.</li>
          </ol>
          <p>
            Item 6 is the trap unique to this paper, and the one that best separates
            understanding from copying.
          </p>
        </>
      ),
    },
  ],
  solution: [
    tested(
      "tsx",
      `import { useState } from "react";
import type { Priority, Ticket } from "../../types/Ticket";
import TicketForm from "../TicketForm";
import TicketList from "../TicketList";

const TicketBoard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketToEdit, setTicketToEdit] = useState<Ticket | null>(null);
  const [filter, setFilter] = useState<"all" | Priority>("all");

  // 派生数据 —— 不做成 state
  const visibleTickets =
    filter === "all" ? tickets : tickets.filter((t) => t.priority === filter);

  const handleSubmitTicket = (submitted: Ticket) => {
    if (ticketToEdit) {
      setTickets((prev) =>
        prev.map((t) => (t.id === submitted.id ? submitted : t)),
      );
      setTicketToEdit(null);
    } else {
      setTickets((prev) => [...prev, submitted]);
    }
  };

  // 作用于 tickets，不是 visibleTickets
  const handleClose = (id: number) => {
    setTickets((prev) => prev.filter((t) => t.id !== id));
  };

  const handleReassign = (ticket: Ticket) => {
    setTicketToEdit(ticket);
  };

  return (
    <div data-testid="ticket-board">
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value as "all" | Priority)}
        data-testid="filter-priority"
      >
        <option value="all">all</option>
        <option value="low">low</option>
        <option value="medium">medium</option>
        <option value="high">high</option>
      </select>

      <TicketForm onSubmit={handleSubmitTicket} ticketToEdit={ticketToEdit} />
      <TicketList
        tickets={visibleTickets}
        onClose={handleClose}
        onReassign={handleReassign}
      />
    </div>
  );
};

export default TicketBoard;`,
      {
        filename: "src/components/TicketBoard/index.tsx（参考答案）",
        filenameEn: "src/components/TicketBoard/index.tsx (reference answer)",
        collapsible: true,
        codeEn: `import { useState } from "react";
import type { Priority, Ticket } from "../../types/Ticket";
import TicketForm from "../TicketForm";
import TicketList from "../TicketList";

const TicketBoard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketToEdit, setTicketToEdit] = useState<Ticket | null>(null);
  const [filter, setFilter] = useState<"all" | Priority>("all");

  // Derived data — never store it in state
  const visibleTickets =
    filter === "all" ? tickets : tickets.filter((t) => t.priority === filter);

  const handleSubmitTicket = (submitted: Ticket) => {
    if (ticketToEdit) {
      setTickets((prev) =>
        prev.map((t) => (t.id === submitted.id ? submitted : t)),
      );
      setTicketToEdit(null);
    } else {
      setTickets((prev) => [...prev, submitted]);
    }
  };

  // Acts on tickets, not on visibleTickets
  const handleClose = (id: number) => {
    setTickets((prev) => prev.filter((t) => t.id !== id));
  };

  const handleReassign = (ticket: Ticket) => {
    setTicketToEdit(ticket);
  };

  return (
    <div data-testid="ticket-board">
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value as "all" | Priority)}
        data-testid="filter-priority"
      >
        <option value="all">all</option>
        <option value="low">low</option>
        <option value="medium">medium</option>
        <option value="high">high</option>
      </select>

      <TicketForm onSubmit={handleSubmitTicket} ticketToEdit={ticketToEdit} />
      <TicketList
        tickets={visibleTickets}
        onClose={handleClose}
        onReassign={handleReassign}
      />
    </div>
  );
};

export default TicketBoard;`,
      },
    ),
    tested(
      "tsx",
      `import React, { useState, useEffect } from "react";
import type { Priority, Ticket } from "../../types/Ticket";

interface TicketFormProps {
  onSubmit: (ticket: Ticket) => void;
  ticketToEdit: Ticket | null;
}

const TicketForm: React.FC<TicketFormProps> = ({ onSubmit, ticketToEdit }) => {
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");

  useEffect(() => {
    if (ticketToEdit) {
      setSubject(ticketToEdit.subject);
      setPriority(ticketToEdit.priority);
    } else {
      setSubject("");
      setPriority("medium");
    }
  }, [ticketToEdit]);

  const isInvalid = subject.trim() === "";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isInvalid) return;
    onSubmit({
      id: ticketToEdit ? ticketToEdit.id : Date.now(),   // 复用旧 id
      subject: subject.trim(),
      priority,
    });
    setSubject("");
    setPriority("medium");
  };

  return (
    <form onSubmit={handleSubmit} data-testid="ticket-form">
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        data-testid="ticket-subject"
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as Priority)}
        data-testid="ticket-priority"
      >
        <option value="low">low</option>
        <option value="medium">medium</option>
        <option value="high">high</option>
      </select>
      <button type="submit" disabled={isInvalid} data-testid="ticket-submit">
        {ticketToEdit ? "Save" : "Create"}
      </button>
    </form>
  );
};

export default TicketForm;`,
      {
        filename: "src/components/TicketForm/index.tsx（参考答案）",
        filenameEn: "src/components/TicketForm/index.tsx (reference answer)",
        collapsible: true,
        codeEn: `import React, { useState, useEffect } from "react";
import type { Priority, Ticket } from "../../types/Ticket";

interface TicketFormProps {
  onSubmit: (ticket: Ticket) => void;
  ticketToEdit: Ticket | null;
}

const TicketForm: React.FC<TicketFormProps> = ({ onSubmit, ticketToEdit }) => {
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");

  useEffect(() => {
    if (ticketToEdit) {
      setSubject(ticketToEdit.subject);
      setPriority(ticketToEdit.priority);
    } else {
      setSubject("");
      setPriority("medium");
    }
  }, [ticketToEdit]);

  const isInvalid = subject.trim() === "";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isInvalid) return;
    onSubmit({
      id: ticketToEdit ? ticketToEdit.id : Date.now(),   // reuse the old id
      subject: subject.trim(),
      priority,
    });
    setSubject("");
    setPriority("medium");
  };

  return (
    <form onSubmit={handleSubmit} data-testid="ticket-form">
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        data-testid="ticket-subject"
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as Priority)}
        data-testid="ticket-priority"
      >
        <option value="low">low</option>
        <option value="medium">medium</option>
        <option value="high">high</option>
      </select>
      <button type="submit" disabled={isInvalid} data-testid="ticket-submit">
        {ticketToEdit ? "Save" : "Create"}
      </button>
    </form>
  );
};

export default TicketForm;`,
      },
    ),
    tested(
      "tsx",
      `import React from "react";
import type { Ticket } from "../../types/Ticket";

interface TicketListProps {
  tickets: Ticket[];
  onClose: (id: number) => void;
  onReassign: (ticket: Ticket) => void;
}

const TicketList: React.FC<TicketListProps> = ({
  tickets,
  onClose,
  onReassign,
}) => {
  return (
    <ul data-testid="ticket-list">
      {tickets.map((ticket) => (
        <li key={ticket.id}>
          <span>{ticket.subject}</span>
          <span>{ticket.priority}</span>
          <button onClick={() => onReassign(ticket)}>Reassign</button>
          <button onClick={() => onClose(ticket.id)}>Close</button>
        </li>
      ))}
    </ul>
  );
};

export default TicketList;`,
      { filename: "src/components/TicketList/index.tsx（参考答案）", collapsible: true },
    ),
  ],
};

/* ================================================================
   Exam
   ================================================================ */

const reactExam: Exam = {
  id: "react",
  title: "React Capstone",
  titleEn: "React Capstone",
  shortTitle: "React 考试",
  shortTitleEn: "React exam",
  description:
    "对应 react-notes-app 这个真实项目：Q1 是一个 Notes Manager 的增删改（CRUD），Q2 是一个带并发上限的异步任务调度器。从「组件是什么」讲到能在空文件夹里重建整个项目。",
  descriptionEn:
    "Built on the real react-notes-app project: Q1 is a Notes Manager that adds, deletes and edits notes (CRUD), and Q2 is an async task runner that limits how many tasks run at the same time. It starts at what a component is and ends with rebuilding the whole project in an empty folder.",
  category: "前端",
  tests:
    "Q1 考的是 React 的数据流基本功：state 放在哪、怎么不可变更新、受控输入、useEffect 同步、列表 key、派生数据。Q2 完全不涉及 React，考的是 Promise 语义和并发控制。两道题共同的隐性考点是「能不能读清题」—— 「按 id」和「原位置」这两个词决定了一半的分数。",
  testsEn:
    "Q1 tests the basics of how data moves through React: where state lives, how to update it without changing the original, controlled inputs, syncing with useEffect, list keys, and derived data. Q2 has no React in it at all; it tests what a Promise actually does and how to limit how many things run at the same time. Both questions quietly test one more skill: reading the wording closely. Two phrases in the brief decide half the score — by id, and in the original position.",
  sourceProjects: [
    {
      path: "react-notes-app",
      role: "参考项目。Vite + React 18 + TS strict + Vitest。本机实测 4 个测试全过（仓库里是完成版）",
      roleEn: "Reference project. Vite + React 18 + TS strict + Vitest. All four tests pass as measured; the repo holds the finished version",
    },
  ],
  prerequisites: ["foundations"],
  stack: ["React 18", "TypeScript strict", "Vite 5", "Vitest + Testing Library", "tsx"],
  status: "ready",
  checklist: [
    {
      task: "Q1 Task 1 · Add（提交表单，新笔记进入表格）",
      covered: "完整讲解 + 填空 + L3 自写 + 从零重写",
      tested: true,
    },
    {
      task: "Q1 Task 2 · Delete（按 id 移除）",
      covered: "完整讲解 + 填空 + L3 自写 + Debug Lab",
      tested: true,
    },
    {
      task: "Q1 Task 3 · Edit（回填 / 变 Update / 原位置更新 / 退出编辑）",
      covered: "完整讲解 + 数据流图 + 填空 + L3 自写 + Debug Lab",
      tested: true,
    },
    {
      task: "Q1 表单校验（空输入时按钮 disabled）",
      covered: "派生数据那节 + L3 自写",
      tested: true,
    },
    {
      task: "Q1 约束 · 不得修改 data-testid",
      covered: "读题那节逐条列出 6 个 testid 及其用途 + Debug Lab",
      tested: true,
    },
    {
      task: "Q2 · runTasks 并发上限调度器",
      covered: "读题 + worker pool 完整推导 + 填空 + L3 自写 + 从零重写",
      tested: false,
    },
    {
      task: "测试怎么跑（项目没有 test script）",
      covered: "Foundations 的 npm scripts 那节 + 本门读题那节",
      tested: true,
    },
    {
      task: "npm run build 原生失败（10 个 tsc 错误）",
      covered: "Foundations 读 tsc 报错那节，判定为脚手架缺陷",
      tested: true,
    },
    {
      task: "useEffect 的清理函数（源项目没考，同类考试常考）",
      covered: "变式题「计时器」完整讲解 + 填空 + L3 自写 + Debug Lab（DrillLab 自出）",
      tested: true,
    },
    {
      task: "异步取数的 loading / error / 竞态（原始需求提到但源项目没有）",
      covered: "变式题「fetch 取数」完整讲解 + 填空 + L3 自写 + Debug Lab（DrillLab 自出）",
      tested: true,
    },
    {
      task: "递归组件与树形数据的不可变更新",
      covered: "变式题「递归评论树」完整讲解 + 填空 + L3 自写 + Debug Lab（DrillLab 自出）",
      tested: true,
    },
    {
      task: "Context：createContext / Provider / useContext 与 value 记忆化",
      covered: "变式题「主题切换」完整讲解 + 填空 + L3 自写 + Debug Lab（DrillLab 自出）",
      tested: true,
    },
  ],
  modules: [reactMentalModel, reactHooks, reactQ1, reactQ2, reactVariants, reactMastery],
  mockExams: [ticketMock],
};

export default reactExam;
