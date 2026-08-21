// 面试八股 —— React 下半：Hooks、性能与新特性、Redux 与 TypeScript。
//
// 题目来自作者做过的题目，答案由 DrillLab 撰写，代码块一律 demo()（「示意」）。

import type { Module } from "../types";
import { demo } from "../helpers";

export const ivReactHooks: Module = {
  id: "iv-react-hooks",
  stage: "面试 · 第 5 部分",
  title: "React · Hooks、性能与生态",
  titleEn: "React · Hooks, performance and the ecosystem",
  summary:
    "18 道题。useMemo / useCallback / React.memo 三兄弟的区别几乎每场必问，而且要答得出「什么时候不该用」；Redux 那四道是问 Redux 项目经验的固定套路。",
  summaryEn:
    "18 questions. The difference between useMemo, useCallback and React.memo is asked in almost every interview, and a full answer has to include when not to use them; the four Redux questions are the standard set asked of anyone who lists Redux experience.",
  lessons: [
    /* ============================================================
       Hooks（4 题）
       ============================================================ */
    {
      id: "iv-react-hook",
      title: "Hooks 四问",
      titleEn: "4 questions on Hooks",
      blurb: "hooks 是什么与为什么、useMemo vs useCallback、React.memo vs useMemo、自定义 hook。",
      blurbEn:
        "What hooks are and why they exist, useMemo vs useCallback, React.memo vs useMemo, custom hooks.",
      minutes: 20,
      objectives: [
        "说出 hooks 解决的三个类组件痛点",
        "分清 useMemo、useCallback、React.memo 各自缓存什么",
        "说出 hooks 的两条规则以及「为什么」不能写在条件里",
        "写出一个自定义 hook 并说明命名约定",
      ],
      objectivesEn: [
        "Name three problems with class components that hooks solve",
        "Say what each of useMemo, useCallback and React.memo actually caches",
        "State the two rules of hooks, and explain why you cannot put one inside a condition",
        "Write a custom hook and explain the naming rule",
      ],
      whyForAssessment:
        "「useMemo 和 useCallback 有什么区别」是出现频率最高的 React 题之一，而且大部分人答不全 —— 能补上「什么时候不该用」和「三个必须配套」才是好答案。hooks 规则那道会追问底层原因（链表 + 调用顺序），答得出来就上一个档。",
      whyForAssessmentEn:
        "\"What is the difference between useMemo and useCallback\" is one of the most common React questions, and most people give only half an answer. A good answer also covers when not to use them, and the fact that the three of them only help when used together. For the rules of hooks the interviewer will ask why, and the reason is that React stores them in a list by call order. Getting that right moves you up a level.",
      concepts: [
        {
          id: "q324",
          heading: "什么是 hooks，为什么要用",
          headingEn: "What are hooks, and why use them?",
          lede: "#324 What are hooks in React and Why do we use them",
          body: (
            <>
              <p>
                <strong>一句话：</strong>hooks 是一组
                <code>use</code> 开头的函数，
                让<strong>函数组件也能有状态和副作用</strong>。
              </p>
              <p>
                <strong>解决三个真实痛点（这三条是标准答案）：</strong>
              </p>
              <ul>
                <li>
                  <strong>逻辑复用难。</strong>
                  以前只有 HOC 和 render props，
                  两者都会造成 wrapper 嵌套（见 #335）。
                  自定义 hook 是平的。
                </li>
                <li>
                  <strong>逻辑被生命周期切碎。</strong>
                  一个「订阅 + 取消订阅」的完整逻辑
                  被迫拆到两个生命周期方法里；
                  <code>useEffect</code> 让它们写在一起。
                </li>
                <li>
                  <strong><code>this</code> 太容易出错。</strong>
                  函数组件没有 <code>this</code>。
                </li>
              </ul>
              <p>
                <strong>常用的：</strong>
                <code>useState</code>、
                <code>useEffect</code>、
                <code>useContext</code>、
                <code>useRef</code>、
                <code>useMemo</code>、
                <code>useCallback</code>、
                <code>useReducer</code>；
                React 18 加了
                <code>useId</code>、
                <code>useTransition</code>、
                <code>useDeferredValue</code>、
                <code>useSyncExternalStore</code>。
              </p>
              <p>
                <strong>两条规则（必答）：</strong>
              </p>
              <ol>
                <li>
                  <strong>只在最顶层调用</strong>——
                  不能放在 <code>if</code>、循环、
                  嵌套函数里。
                </li>
                <li>
                  <strong>只在函数组件或自定义 hook 里调用。</strong>
                </li>
              </ol>
              <p>
                <strong>为什么有第一条 —— 这是追问点。</strong>
                React <strong>不知道你的 hook 叫什么名字</strong>，
                它是按<strong>调用顺序</strong>把每个 hook 的状态
                存在一条链表上的。
                如果 hook 写在 <code>if</code> 里，
                某次渲染少调了一个，
                后面所有 hook 的<strong>下标就全错位了</strong>——
                <code>useState</code> 会拿到别人的值。
                <br />
                <strong>能答出「靠调用顺序而不是名字」就说明真理解了。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> hooks are functions that start with{" "}
                <code>use</code> and give{" "}
                <strong>function components state and side effects</strong>.
              </p>
              <p>
                <strong>They fix three real pain points — these three are the
                standard answer:</strong>
              </p>
              <ul>
                <li>
                  <strong>Reusing logic was hard.</strong> All you had were HOCs and
                  render props, and both leave you with wrapper nesting (see #335).
                  A custom hook is flat.
                </li>
                <li>
                  <strong>Logic got chopped up by the lifecycle.</strong> One
                  coherent &ldquo;subscribe and unsubscribe&rdquo; had to be split
                  across two lifecycle methods; <code>useEffect</code> keeps them
                  side by side.
                </li>
                <li>
                  <strong><code>this</code> was too easy to get wrong.</strong>{" "}
                  Function components have no <code>this</code>.
                </li>
              </ul>
              <p>
                <strong>The common ones:</strong> <code>useState</code>,{" "}
                <code>useEffect</code>, <code>useContext</code>, <code>useRef</code>,{" "}
                <code>useMemo</code>, <code>useCallback</code>,{" "}
                <code>useReducer</code>; React 18 added <code>useId</code>,{" "}
                <code>useTransition</code>, <code>useDeferredValue</code> and{" "}
                <code>useSyncExternalStore</code>.
              </p>
              <p>
                <strong>Two rules — always say them:</strong>
              </p>
              <ol>
                <li>
                  <strong>Call them at the top level only</strong> — never inside an{" "}
                  <code>if</code>, a loop, or a nested function.
                </li>
                <li>
                  <strong>Call them only from a function component or a custom
                  hook.</strong>
                </li>
              </ol>
              <p>
                <strong>Why the first rule exists — that is the follow-up.</strong>{" "}
                React <strong>does not know what your hook is called</strong>. It
                keeps each hook&rsquo;s state in a linked list, indexed by{" "}
                <strong>call order</strong>. Put a hook inside an <code>if</code>,
                skip it on one render, and{" "}
                <strong>every index after it shifts</strong> —{" "}
                <code>useState</code> hands you somebody else&rsquo;s value.
                <br />
                <strong>Say &ldquo;by call order, not by name&rdquo; and they know
                you really understand it.</strong>
              </p>
            </>
          ),
          code: [
            demo(
              "jsx",
              `// ✗ 顺序会变，后面所有 hook 错位
function Bad({ show }) {
  if (show) {
    const [a] = useState(1);     // 有时调有时不调
  }
  const [b] = useState(2);       // b 可能拿到 a 的槽位
}

// ✓ hook 在顶层，条件放里面
function Good({ show }) {
  const [a] = useState(1);
  const [b] = useState(2);
  useEffect(() => {
    if (!show) return;           // 条件判断放 effect 内部
    // ...
  }, [show]);
}`,
              {
    codeEn: `// ✗ the order changes, and every hook after it shifts
function Bad({ show }) {
  if (show) {
    const [a] = useState(1);     // called sometimes, skipped other times
  }
  const [b] = useState(2);       // b may end up in a's slot
}

// ✓ hooks at the top level, the condition inside
function Good({ show }) {
  const [a] = useState(1);
  const [b] = useState(2);
  useEffect(() => {
    if (!show) return;           // put the condition inside the effect
    // ...
  }, [show]);
}`, filename: "为什么不能写在条件里" },
            ),
          ],
        },
        {
          id: "q339",
          heading: "useMemo vs useCallback",
          lede: "#339 useMemo vs useCallback",
          body: (
            <>
              <p>
                <strong>一句话：</strong>
                <strong><code>useMemo</code> 缓存
                「函数的返回值」，
                <code>useCallback</code> 缓存
                「函数本身」。</strong>
                两者都靠依赖数组决定要不要重算。
              </p>
              <p>
                实际上 <code>useCallback(fn, deps)</code>
                完全等价于
                <code>useMemo(() =&gt; fn, deps)</code>——
                <strong>后者是前者的语法糖</strong>。
                这句能答出来会加分。
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>缓存什么</th>
                      <th>什么时候用</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>useMemo</code></td>
                      <td>计算结果（值 / 对象 / 数组）</td>
                      <td>
                        ① 计算真的贵（大列表排序过滤）
                        ② 结果要当 props 传给 memo 组件
                        ③ 结果要当别的 hook 的依赖
                      </td>
                    </tr>
                    <tr>
                      <td><code>useCallback</code></td>
                      <td>函数引用</td>
                      <td>
                        ① 函数要传给 memo 组件
                        ② 函数是 <code>useEffect</code> 的依赖
                        ③ 自定义 hook 对外暴露的函数
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>什么时候不该用（这半边很多人答不出）：</strong>
                两者本身<strong>都有成本</strong>——
                要存旧值、要比较依赖。
                给一个 <code>a + b</code> 包
                <code>useMemo</code> 是纯亏。
                <strong>「先测量，再优化」</strong>；
                默认不加，profiler 显示有问题再加。
              </p>
              <p>
                <strong>最常见的误用：</strong>
                包了 <code>useCallback</code>
                但依赖数组里放了每次都变的东西 ——
                等于没包，还多付了比较成本。
              </p>
              <p>
                <strong>会追问：</strong>
                「React 19 的编译器会怎样？」——
                React Compiler 能自动插入记忆化，
                <strong>大部分手写的
                <code>useMemo</code> /
                <code>useCallback</code> 将不再必要</strong>。
                知道这个趋势会显得你在跟进。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong>{" "}
                <strong><code>useMemo</code> caches{" "}
                &ldquo;what a function returns&rdquo;, <code>useCallback</code> caches{" "}
                &ldquo;the function itself&rdquo;.</strong> Both use the dependency
                array to decide whether to recompute.
              </p>
              <p>
                In fact <code>useCallback(fn, deps)</code> is exactly the same thing
                as <code>useMemo(() =&gt; fn, deps)</code> —{" "}
                <strong>the former is sugar for the latter</strong>. Saying this
                scores points.
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>What it caches</th>
                      <th>When to use it</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>useMemo</code></td>
                      <td>A computed result (value / object / array)</td>
                      <td>
                        ① the work is genuinely expensive (sorting or filtering a
                        big list)
                        ② the result goes to a memo component as a prop
                        ③ the result is a dependency of another hook
                      </td>
                    </tr>
                    <tr>
                      <td><code>useCallback</code></td>
                      <td>A function reference</td>
                      <td>
                        ① the function goes to a memo component
                        ② the function is a dependency of <code>useEffect</code>
                        ③ the function is part of a custom hook&rsquo;s public API
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>When not to use them — most people miss this half:</strong>{" "}
                both <strong>cost something</strong> — the old value is kept and the
                dependencies get compared. Wrapping <code>a + b</code> in{" "}
                <code>useMemo</code> is a pure loss.{" "}
                <strong>&ldquo;Measure first, then optimise&rdquo;</strong>: leave
                them out by default and add them when the profiler says so.
              </p>
              <p>
                <strong>The most common misuse:</strong> wrapping something in{" "}
                <code>useCallback</code> but putting a value that changes every
                render in the dependency array — the cache never hits, and you paid
                for the comparison on top.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;What changes with the React 19
                compiler?&rdquo; — React Compiler can insert memoisation for you, so{" "}
                <strong>most hand-written <code>useMemo</code> and{" "}
                <code>useCallback</code> will stop being necessary</strong>. Knowing
                the direction shows you are keeping up.
              </p>
            </>
          ),
          code: [
            demo(
              "jsx",
              `// useMemo：缓存值
const sorted = useMemo(() => items.sort(cmp), [items]);

// useCallback：缓存函数
const onPick = useCallback((id) => setPicked(id), []);

// 两者的关系
useCallback(fn, deps) === useMemo(() => fn, deps)

// ✗ 常见误用：依赖每次都变，等于没缓存
const onSave = useCallback(() => save(config), [{ ...config }]);
//                                              ↑ 每次都是新对象`,
              {
    codeEn: `// useMemo caches a value
const sorted = useMemo(() => items.sort(cmp), [items]);

// useCallback caches a function
const onPick = useCallback((id) => setPicked(id), []);

// How the two relate
useCallback(fn, deps) === useMemo(() => fn, deps)

// ✗ a common mistake: the dependency changes every time, so nothing is cached
const onSave = useCallback(() => save(config), [{ ...config }]);
//                                              ↑ a new object every render`, filename: "两者的区别与等价关系" },
            ),
          ],
        },
        {
          id: "q346",
          heading: "React.memo vs useMemo",
          lede: "#346 React.memo vs useMemo",
          body: (
            <>
              <p>
                <strong>一句话：</strong>
                <strong><code>React.memo</code> 是
                「组件」级的 —— 决定要不要重新渲染整个组件</strong>；
                <strong><code>useMemo</code> 是
                「值」级的 —— 决定要不要重新计算一个值</strong>。
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th><code>React.memo</code></th>
                      <th><code>useMemo</code></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>是什么</td>
                      <td>高阶组件</td>
                      <td>hook</td>
                    </tr>
                    <tr>
                      <td>用在哪</td>
                      <td>包在组件外面</td>
                      <td>写在组件里面</td>
                    </tr>
                    <tr>
                      <td>比较什么</td>
                      <td>props（浅比较）</td>
                      <td>依赖数组</td>
                    </tr>
                    <tr>
                      <td>省掉什么</td>
                      <td><strong>一次组件渲染</strong></td>
                      <td><strong>一次计算</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>关键：三个必须配套用。</strong>
                只在子组件上加 <code>React.memo</code>
                通常<strong>一点效果都没有</strong>——
                因为父组件每次渲染都会给出新的对象和函数字面量，
                浅比较必然判定「变了」。
                <strong>必须同时用
                <code>useMemo</code> 稳住对象、
                <code>useCallback</code> 稳住函数。</strong>
              </p>
              <p>
                <strong>会追问：</strong>
                「<code>memo</code> 能拦住 context 变化吗？」——
                <strong>拦不住</strong>。
                <code>memo</code> 只比 props，
                context 走另一条通道。
                <strong>所以 context value 必须
                <code>useMemo</code></strong>——
                这正是我们那道主题切换变式题的核心考点，
                删掉 <code>useMemo</code> 后实测「功能测试全绿、
                只有引用稳定性那条红」。
                <br />
                「<code>children</code> 会破坏 memo 吗？」——
                会，<code>children</code> 也是 prop，
                而 JSX 每次都产生新元素对象。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong>{" "}
                <strong><code>React.memo</code> works at the{" "}
                &ldquo;component&rdquo; level — it decides whether to re-render a
                whole component</strong>;{" "}
                <strong><code>useMemo</code> works at the &ldquo;value&rdquo;
                level — it decides whether to recompute one value</strong>.
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th><code>React.memo</code></th>
                      <th><code>useMemo</code></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>What it is</td>
                      <td>A higher-order component</td>
                      <td>A hook</td>
                    </tr>
                    <tr>
                      <td>Where it goes</td>
                      <td>Wrapped around the component</td>
                      <td>Inside the component</td>
                    </tr>
                    <tr>
                      <td>What it compares</td>
                      <td>props (shallow)</td>
                      <td>the dependency array</td>
                    </tr>
                    <tr>
                      <td>What it saves</td>
                      <td><strong>one component render</strong></td>
                      <td><strong>one computation</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>The key point: all three go together.</strong> Dropping{" "}
                <code>React.memo</code> on a child usually{" "}
                <strong>does nothing at all</strong> — the parent hands down fresh
                object and function literals on every render, so the shallow compare
                is bound to say &ldquo;changed&rdquo;.{" "}
                <strong>You must also stabilise objects with <code>useMemo</code>{" "}
                and functions with <code>useCallback</code>.</strong>
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Can <code>memo</code> stop a
                context change?&rdquo; — <strong>no it cannot</strong>.{" "}
                <code>memo</code> only compares props; context travels a separate
                channel. <strong>That is why a context value has to be wrapped in{" "}
                <code>useMemo</code></strong> — exactly the point of our theme
                switching variant, where deleting the <code>useMemo</code> left
                every behaviour test green and only the reference-stability test red.
                <br />
                &ldquo;Does <code>children</code> break memo?&rdquo; — yes.{" "}
                <code>children</code> is a prop too, and JSX produces a new element
                object every time.
              </p>
            </>
          ),
        },
        {
          id: "q340",
          heading: "自定义 hook 是干什么的，命名有什么约定",
          headingEn: "What is a custom hook for, and what is the naming rule?",
          lede: "#340 What are custom hooks for and what is the naming convention for them",
          body: (
            <>
              <p>
                <strong>一句话：</strong>把
                <strong>「带状态的逻辑」抽出来复用</strong>。
                命名<strong>必须以 <code>use</code> 开头</strong>。
              </p>
              <p>
                <strong>为什么必须 <code>use</code> 开头</strong>——
                这是考点，不是风格问题：
              </p>
              <ul>
                <li>
                  <strong>ESLint 靠这个前缀识别它是 hook</strong>，
                  才能检查 hooks 规则
                  （<code>react-hooks/rules-of-hooks</code>）。
                  不加前缀，你在里面违规调用 hook 也不会有人警告你。
                </li>
                <li>
                  它同时也是给读代码的人的信号：
                  <strong>这个函数里可能有状态，
                  所以它有调用位置的限制</strong>。
                </li>
              </ul>
              <p>
                <strong>关键概念：复用的是逻辑，不是状态。</strong>
                两个组件各自调 <code>useCounter()</code>，
                得到的是<strong>两份完全独立的状态</strong>。
                想共享状态得用 Context 或状态库。
                <strong>这一条是高频追问，很多人答错。</strong>
              </p>
              <p>
                <strong>什么时候该抽：</strong>
                同一组
                <code>useState</code> +
                <code>useEffect</code> 的组合在两处以上出现；
                或者一个组件里的 effect 逻辑长到
                让主体读不懂了。
              </p>
              <p>
                <strong>会追问：</strong>
                「自定义 hook 能返回什么？」——
                随意。
                <strong>约定是「像 <code>useState</code> 一样返数组」
                （调用方好重命名）、
                「三个以上返对象」（不用记顺序）。</strong>
                <br />
                「里面能调别的 hook 吗？」——
                能，这正是它的意义；但同样要遵守两条规则。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> pull{" "}
                <strong>&ldquo;logic that carries state&rdquo; out so it can be
                reused</strong>. The name <strong>must start with{" "}
                <code>use</code></strong>.
              </p>
              <p>
                <strong>Why the <code>use</code> prefix is mandatory</strong> — this
                is the point being tested, and it is not about style:
              </p>
              <ul>
                <li>
                  <strong>ESLint uses the prefix to recognise it as a hook</strong>{" "}
                  so it can enforce the rules of hooks
                  (<code>react-hooks/rules-of-hooks</code>). Without the prefix, you
                  can break those rules inside it and nobody warns you.
                </li>
                <li>
                  It is also a signal to whoever reads the code:{" "}
                  <strong>this function may hold state, so there are limits on where
                  you may call it</strong>.
                </li>
              </ul>
              <p>
                <strong>The key idea: you reuse the logic, not the state.</strong>{" "}
                Two components that each call <code>useCounter()</code> get{" "}
                <strong>two completely independent pieces of state</strong>. To share
                state you need Context or a state library.{" "}
                <strong>This is a frequent follow-up and a lot of people get it
                wrong.</strong>
              </p>
              <p>
                <strong>When to extract one:</strong> the same combination of{" "}
                <code>useState</code> and <code>useEffect</code> shows up in two or
                more places; or the effect logic in one component has grown long
                enough that you can no longer read the component itself.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;What can a custom hook
                return?&rdquo; — anything.{" "}
                <strong>The convention is &ldquo;return an array like{" "}
                <code>useState</code> does&rdquo; (so the caller can rename freely)
                and &ldquo;return an object once there are three or more
                values&rdquo; (so nobody has to remember the order).</strong>
                <br />
                &ldquo;Can it call other hooks?&rdquo; — yes, that is the whole
                point; the same two rules still apply.
              </p>
            </>
          ),
          code: [
            demo(
              "jsx",
              `// 一个真实好用的：把「值 + 存 localStorage」打包
function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;              // 隐私模式读不了就用默认值
    }
  });

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);

  return [value, setValue];        // 像 useState 一样返数组
}

// 用起来
const [theme, setTheme] = useLocalStorage("theme", "light");

// 注意：两个组件各调一次，得到的是两份独立状态，不是共享的`,
              {
    codeEn: `// One that is genuinely useful: a value together with storing it in localStorage
function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;              // private mode cannot read, so use the default
    }
  });

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);

  return [value, setValue];        // returns an array, the same shape as useState
}

// Using it
const [theme, setTheme] = useLocalStorage("theme", "light");

// Note: two components each calling it get two separate states, not a shared one`, filename: "自定义 hook 的形状" },
            ),
          ],
        },
      ],
      transfer: [
        {
          signal: "hook 写在 if 里",
          signalEn: "A hook written inside an if",
          reachFor: "React 按调用顺序存链表，会错位；条件放 effect 内部",
          reachForEn: "React stores hooks in a list by call order, so they shift out of line; put the condition inside the effect instead",
        },
        {
          signal: "问 useMemo vs useCallback",
          signalEn: "Asked about useMemo vs useCallback",
          reachFor: "一个缓存值一个缓存函数；后者是前者的语法糖",
          reachForEn: "One caches a value, the other caches a function; useCallback is a shorter way to write useMemo",
        },
        {
          signal: "加了 memo 没效果",
          signalEn: "You added memo and nothing got faster",
          reachFor: "三个必须配套；context 变化 memo 拦不住",
          reachForEn: "All three have to be used together, and memo cannot stop a re-render caused by a Context change",
        },
        {
          signal: "同一组 state+effect 出现两次",
          signalEn: "The same pair of state and effect appears in two places",
          reachFor: "抽自定义 hook，use 开头",
          reachForEn: "Pull it out into a custom hook whose name starts with use",
        },
        {
          signal: "以为自定义 hook 能共享状态",
          signalEn: "Expecting a custom hook to share state between components",
          reachFor: "复用的是逻辑，状态各自独立",
          reachForEn: "The logic is reused; each caller gets its own separate state",
        },
      ],
      recap: [
        "hooks 解决三件事：逻辑复用难、逻辑被生命周期切碎、this 易错。",
        "hooks 规则的底层原因是「按调用顺序存链表」，不是按名字。",
        "useMemo 缓存值、useCallback 缓存函数；useCallback 就是 useMemo(() => fn, deps)。",
        "React.memo 省一次渲染、useMemo 省一次计算；三个必须配套用才有意义。",
        "memo 拦不住 context 变化 —— 所以 context value 必须 useMemo。",
        "自定义 hook 必须 use 开头（ESLint 靠它识别）；复用逻辑不复用状态。",
      ],
      recapEn: [
        "hooks solve three things: reusing logic was hard, logic was cut apart across lifecycle methods, and this was easy to get wrong.",
        "The reason for the rules of hooks is that React stores them in a list by call order, not by name.",
        "useMemo caches a value, useCallback caches a function; useCallback is exactly useMemo(() => fn, deps).",
        "React.memo saves a render, useMemo saves a computation; the three of them only help when used together.",
        "memo cannot stop a Context change, which is why a Context value must go through useMemo.",
        "A custom hook has to start with use, because that is how ESLint recognises it; you reuse the logic, not the state.",
      ],
    },

    /* ============================================================
       性能与新特性（8 题）
       ============================================================ */
    {
      id: "iv-react-perf",
      title: "性能与新特性 · 八问",
      titleEn: "8 questions on performance and new features",
      blurb: "性能优化、写样式的几种方式、React 18 新变化、lazy、最佳实践、StrictMode、错误边界、Router。",
      blurbEn:
        "Performance work, the ways to write styles, what is new in React 18, lazy, best practices, StrictMode, error boundaries, Router.",
      minutes: 26,
      objectives: [
        "按「先测量再优化」的顺序列出 React 性能优化手段",
        "说清 React 18 的自动批处理和并发特性带来的实际差别",
        "解释 StrictMode 为什么故意渲染两次",
        "说明错误边界能抓什么、不能抓什么",
      ],
      objectivesEn: [
        "List the ways to make React faster, in the right order: measure first, then optimise",
        "Explain the real difference made by automatic batching and the concurrent features in React 18",
        "Explain why StrictMode renders twice on purpose",
        "Say what an error boundary catches and what it does not catch",
      ],
      whyForAssessment:
        "性能优化那道是开放题，最能看出你有没有真调过 —— 先说「用 Profiler 找出问题」比直接列 API 高一个档。React 18 和 StrictMode 那两道会问到「为什么」，答得出并发和纯函数就说明理解了设计动机。",
      whyForAssessmentEn:
        "The performance question is open-ended, and it shows better than any other whether you have really tuned an app. Saying \"first I use the Profiler to find the problem\" ranks a level above listing APIs. For React 18 and StrictMode the interviewer asks why, and answering with concurrent rendering and pure functions shows you understand what the design is for.",
      concepts: [
        {
          id: "q343",
          heading: "怎么优化 React 性能",
          headingEn: "How do you make a React app faster?",
          lede: "#343 How could you improve performance in React",
          body: (
            <>
              <p>
                <strong>先说这一句，再列手段：</strong>
                <strong>「先用 React DevTools Profiler
                找出到底哪个组件渲染慢、渲染了多少次，
                再决定动哪。」</strong>
                上来就背 <code>useMemo</code>
                会显得像背题。
              </p>
              <p>
                <strong>手段分三类：</strong>
              </p>
              <p><strong>① 少渲染</strong></p>
              <ul>
                <li>
                  <code>React.memo</code> +
                  <code>useMemo</code> +
                  <code>useCallback</code>
                  <strong>三件套配套用</strong>（#346）
                </li>
                <li>
                  <strong>state 下移</strong>——
                  把频繁变的 state 放到
                  <strong>真正需要它的那个小组件里</strong>，
                  别提到顶层带着整棵树重渲染。
                  <strong>这招常常比加 memo 有效得多。</strong>
                </li>
                <li>
                  <strong>用 <code>children</code> 组合</strong>——
                  父组件重渲染时，
                  作为 prop 传进来的 children
                  <strong>不会重建</strong>。
                </li>
                <li>
                  拆分 Context —— 一个 context 里放太多东西，
                  改任何一项所有消费者都重渲染。
                </li>
              </ul>
              <p><strong>② 少下载</strong></p>
              <ul>
                <li>
                  <strong>代码分割</strong>——
                  <code>React.lazy</code> +
                  <code>Suspense</code>，按路由切（#347）
                </li>
                <li>
                  按需引入第三方库，别
                  <code>import _ from &quot;lodash&quot;</code>
                </li>
                <li>用 bundle analyzer 看谁占体积</li>
              </ul>
              <p><strong>③ 少算 / 少画</strong></p>
              <ul>
                <li>
                  <strong>长列表虚拟化</strong>——
                  只渲染视口内的几十行。
                  <strong>一万行的列表，这一条比其他所有优化加起来都有用。</strong>
                </li>
                <li>
                  <strong>列表 key 用稳定 id</strong>（#330）
                </li>
                <li>
                  输入防抖、搜索节流
                </li>
                <li>
                  React 18 的 <code>useTransition</code> /
                  <code>useDeferredValue</code>——
                  让重活不挡住输入
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「怎么知道有没有多余渲染？」——
                Profiler 的「Highlight updates」
                或者 <code>{'<Profiler onRender>'}</code>；
                以及注意 <strong>StrictMode 下开发模式会渲染两次</strong>，
                别把它当成 bug。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>Open with this sentence, then list the techniques:</strong>{" "}
                <strong>&ldquo;First I use the React DevTools Profiler to find which
                component is slow and how many times it renders, then I decide what
                to touch.&rdquo;</strong> Reciting <code>useMemo</code> straight away
                sounds like you memorised an answer sheet.
              </p>
              <p>
                <strong>Three families of technique:</strong>
              </p>
              <p><strong>① Render less</strong></p>
              <ul>
                <li>
                  <code>React.memo</code> + <code>useMemo</code> +{" "}
                  <code>useCallback</code>{" "}
                  <strong>used as a set</strong> (#346)
                </li>
                <li>
                  <strong>Push state down</strong> — put frequently changing state{" "}
                  <strong>in the small component that actually needs it</strong>{" "}
                  instead of lifting it to the top and re-rendering the whole tree.{" "}
                  <strong>This often helps far more than adding memo.</strong>
                </li>
                <li>
                  <strong>Compose with <code>children</code></strong> — when the
                  parent re-renders, children passed in as a prop{" "}
                  <strong>are not rebuilt</strong>.
                </li>
                <li>
                  Split your contexts — put too much in one context and changing any
                  field re-renders every consumer.
                </li>
              </ul>
              <p><strong>② Download less</strong></p>
              <ul>
                <li>
                  <strong>Code splitting</strong> — <code>React.lazy</code> +{" "}
                  <code>Suspense</code>, split per route (#347)
                </li>
                <li>
                  Import third-party libraries piecemeal, not{" "}
                  <code>import _ from &quot;lodash&quot;</code>
                </li>
                <li>Run a bundle analyzer to see who is taking up the space</li>
              </ul>
              <p><strong>③ Compute less, paint less</strong></p>
              <ul>
                <li>
                  <strong>Virtualise long lists</strong> — render only the few dozen
                  rows in the viewport.{" "}
                  <strong>On a ten-thousand-row list this beats every other
                  optimisation put together.</strong>
                </li>
                <li>
                  <strong>Use stable ids as list keys</strong> (#330)
                </li>
                <li>
                  Debounce input, throttle search
                </li>
                <li>
                  React 18&rsquo;s <code>useTransition</code> /{" "}
                  <code>useDeferredValue</code> — keep the heavy work from blocking
                  typing
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;How do you know there are wasted
                renders?&rdquo; — the Profiler&rsquo;s &ldquo;Highlight
                updates&rdquo;, or <code>{'<Profiler onRender>'}</code>; and remember{" "}
                <strong>StrictMode renders twice in development</strong>, so do not
                mistake that for a bug.
              </p>
            </>
          ),
        },
        {
          id: "q342",
          heading: "React 里怎么写样式",
          headingEn: "How do you write styles in React?",
          lede: "#342 How to use styles in React",
          body: (
            <>
              <p>
                <strong>一句话：</strong>五种，
                各有明确的取舍。
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>方式</th>
                      <th>好处</th>
                      <th>代价</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>普通 CSS / SCSS 文件</td>
                      <td>零成本、能用全部 CSS 特性</td>
                      <td><strong>类名全局，会冲突</strong></td>
                    </tr>
                    <tr>
                      <td>CSS Modules</td>
                      <td>类名自动加哈希，<strong>天然隔离</strong></td>
                      <td>动态样式要配 CSS 变量</td>
                    </tr>
                    <tr>
                      <td>行内 <code>style</code></td>
                      <td>动态值最直接</td>
                      <td>
                        <strong>没有伪类、媒体查询、动画</strong>；
                        每次渲染新对象
                      </td>
                    </tr>
                    <tr>
                      <td>CSS-in-JS（styled-components）</td>
                      <td>能用 props 决定样式，作用域天然隔离</td>
                      <td><strong>运行时开销</strong>，SSR 要额外配置</td>
                    </tr>
                    <tr>
                      <td>原子化（Tailwind）</td>
                      <td>不用起类名，产物体积可控</td>
                      <td>JSX 里类名很长，团队要统一约定</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>「动态样式」的推荐做法</strong>——
                这是加分点：
                <strong>用 CSS 变量而不是行内 style</strong>。
                把变量写在行内，
                真正的样式规则还在 CSS 文件里 ——
                这样既能动态，又保留伪类和媒体查询。
                <strong>本站的深色模式就是这么做的</strong>
                （切 <code>data-theme</code> 属性，
                CSS 变量整套换）。
              </p>
              <p>
                <strong>会追问：</strong>
                「行内 style 为什么影响性能？」——
                每次渲染都创建新对象，
                会破坏子组件的 <code>memo</code>；
                而且它不能被浏览器按规则缓存。
                <strong>要用就 <code>useMemo</code> 稳住。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> five ways, each with a clear trade-off.
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Approach</th>
                      <th>Upside</th>
                      <th>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Plain CSS / SCSS files</td>
                      <td>Free, and every CSS feature is available</td>
                      <td><strong>Class names are global, so they collide</strong></td>
                    </tr>
                    <tr>
                      <td>CSS Modules</td>
                      <td>Hashed class names, <strong>isolated by default</strong></td>
                      <td>Dynamic styles need CSS variables</td>
                    </tr>
                    <tr>
                      <td>Inline <code>style</code></td>
                      <td>The most direct way to use a dynamic value</td>
                      <td>
                        <strong>No pseudo-classes, media queries or
                        animations</strong>; a new object every render
                      </td>
                    </tr>
                    <tr>
                      <td>CSS-in-JS (styled-components)</td>
                      <td>props can drive the styles, and scoping needs no extra work</td>
                      <td><strong>Runtime cost</strong>, and SSR needs extra setup</td>
                    </tr>
                    <tr>
                      <td>Atomic (Tailwind)</td>
                      <td>No naming, and the output size stays under control</td>
                      <td>Very long class strings in JSX, and the team needs conventions</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>The recommended way to do dynamic styles</strong> — this is
                the bonus point:{" "}
                <strong>use a CSS variable, not an inline style</strong>. Put only the
                variable inline and leave the actual rule in the CSS file — you get
                the dynamic value and keep pseudo-classes and media queries.{" "}
                <strong>That is how this site&rsquo;s dark mode works</strong> (flip
                the <code>data-theme</code> attribute and the whole set of CSS
                variables swaps).
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Why do inline styles hurt
                performance?&rdquo; — every render creates a new object, which breaks{" "}
                <code>memo</code> on the child, and the browser cannot cache it as a
                rule. <strong>If you must use one, stabilise it with{" "}
                <code>useMemo</code>.</strong>
              </p>
            </>
          ),
          code: [
            demo(
              "jsx",
              `// 推荐：行内只放变量，规则留在 CSS 里
<div className="bar" style={{ "--pct": \`\${percent}%\` }} />

/* CSS 里 */
.bar::after { width: var(--pct); }        /* 伪类照样能用 */
@media (max-width: 480px) { .bar { height: 4px; } }

// ✗ 行内写全套：没法写伪类和媒体查询，还每次新对象
<div style={{ width: \`\${percent}%\`, background: "#2b6" }} />`,
              {
    codeEn: `// Recommended: only the variable goes inline, the rules stay in CSS
<div className="bar" style={{ "--pct": \`\${percent}%\` }} />

/* In the CSS */
.bar::after { width: var(--pct); }        /* pseudo-classes still work */
@media (max-width: 480px) { .bar { height: 4px; } }

// ✗ everything inline: no pseudo-classes, no media queries, and a new object each time
<div style={{ width: \`\${percent}%\`, background: "#2b6" }} />`, filename: "动态样式的正确做法" },
            ),
          ],
        },
        {
          id: "q344",
          heading: "React 18 有哪些新变化",
          headingEn: "What is new in React 18?",
          lede: "#344 What are the new changes in react 18",
          body: (
            <>
              <p>
                <strong>一句话：</strong>核心是
                <strong>并发渲染（concurrent rendering）</strong>——
                React 可以中断、暂停、恢复一次渲染，
                好让高优先级的更新先跑。
              </p>
              <p>
                <strong>五个具体变化（挑三四个说清就够）：</strong>
              </p>
              <ul>
                <li>
                  <strong>自动批处理（automatic batching）</strong>——
                  React 17 只在 React 事件回调里批处理，
                  <code>setTimeout</code>、
                  Promise、原生事件里的多次
                  <code>setState</code> 会各触发一次渲染。
                  <strong>18 里全都批处理了。</strong>
                  这是最容易被观察到的变化。
                </li>
                <li>
                  <strong><code>useTransition</code></strong>——
                  把一个更新标记为「不着急」。
                  典型场景：输入框旁边有个很重的搜索结果列表，
                  <strong>输入保持流畅，列表慢慢跟上</strong>。
                </li>
                <li>
                  <strong><code>useDeferredValue</code></strong>——
                  同一个目的，
                  但是从「值」的角度：给我一个滞后版本的值。
                </li>
                <li>
                  <strong>新的 root API</strong>——
                  <code>createRoot</code> 取代
                  <code>ReactDOM.render</code>，
                  <strong>不换它就用不上任何并发特性</strong>。
                </li>
                <li>
                  <strong>Suspense 支持 SSR</strong>——
                  流式渲染、选择性 hydration。
                  <br />
                  另外 <code>useId</code>（服务端客户端一致的 id）、
                  <code>useSyncExternalStore</code>
                  （给状态库用的）。
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「StrictMode 在 18 里有什么变化？」——
                <strong>会额外「挂载 → 卸载 → 再挂载」一次</strong>，
                所以 effect 的清理函数会被执行。
                <strong>这是为了提前暴露「没写清理函数」的组件</strong>
                （见 #332），为将来的 Offscreen 特性做准备。
                <br />
                「升级要注意什么？」——
                换 <code>createRoot</code>；
                自动批处理可能让依赖「每次 setState 都立刻渲染」
                的老代码行为改变
                （必要时用 <code>flushSync</code> 逃出批处理）。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> the core is{" "}
                <strong>concurrent rendering</strong> — React can interrupt, pause and
                resume a render so a higher-priority update goes first.
              </p>
              <p>
                <strong>Five concrete changes — covering three or four properly is
                enough:</strong>
              </p>
              <ul>
                <li>
                  <strong>Automatic batching</strong> — React 17 only batched inside
                  React event handlers, so several <code>setState</code> calls in a{" "}
                  <code>setTimeout</code>, a Promise or a native event each triggered
                  their own render. <strong>18 batches all of them.</strong> This is
                  the change you notice most easily.
                </li>
                <li>
                  <strong><code>useTransition</code></strong> — mark an update as
                  &ldquo;not urgent&rdquo;. The classic case is an input next to a
                  heavy list of search results:{" "}
                  <strong>typing stays smooth and the list catches up</strong>.
                </li>
                <li>
                  <strong><code>useDeferredValue</code></strong> — same goal, from the
                  value side: give me a version of this value that lags behind.
                </li>
                <li>
                  <strong>The new root API</strong> — <code>createRoot</code> replaces{" "}
                  <code>ReactDOM.render</code>, and{" "}
                  <strong>until you switch you get none of the concurrent
                  features</strong>.
                </li>
                <li>
                  <strong>Suspense works on the server</strong> — streaming and
                  selective hydration.
                  <br />
                  Plus <code>useId</code> (ids that match between server and client)
                  and <code>useSyncExternalStore</code> (for state libraries).
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;What changed for StrictMode in
                18?&rdquo; —{" "}
                <strong>it now does an extra mount, unmount, mount</strong>, so effect
                cleanup functions actually run.{" "}
                <strong>The point is to expose components that forgot to write
                cleanup</strong> (see #332) and to prepare for the future Offscreen
                feature.
                <br />
                &ldquo;What do you watch out for when upgrading?&rdquo; — switch to{" "}
                <code>createRoot</code>; automatic batching can change the behaviour
                of old code that assumed &ldquo;every setState renders right
                away&rdquo; (use <code>flushSync</code> to escape a batch when you
                truly need to).
              </p>
            </>
          ),
          code: [
            demo(
              "jsx",
              `// React 17：这里会渲染两次
setTimeout(() => {
  setA(1);
  setB(2);
}, 0);
// React 18：只渲染一次（自动批处理）

// useTransition：输入不卡，列表慢慢跟
const [isPending, startTransition] = useTransition();

function onChange(e) {
  setQuery(e.target.value);                 // 紧急：输入框马上响应
  startTransition(() => setList(filter(e.target.value)));  // 不急
}
{isPending && <span>更新中…</span>}`,
              {
    codeEn: `// React 17: this renders twice
setTimeout(() => {
  setA(1);
  setB(2);
}, 0);
// React 18: renders once (automatic batching)

// useTransition: the input stays responsive and the list catches up
const [isPending, startTransition] = useTransition();

function onChange(e) {
  setQuery(e.target.value);                 // urgent: the input responds at once
  startTransition(() => setList(filter(e.target.value)));  // not urgent
}
{isPending && <span>Updating…</span>}`, filename: "两个最能感知的变化" },
            ),
          ],
        },
        {
          id: "q347",
          heading: "React.lazy 是干什么的",
          headingEn: "What does React.lazy do?",
          lede: "#347 What is React lazy function",
          body: (
            <>
              <p>
                <strong>一句话：</strong>让组件
                <strong>按需加载</strong>——
                打包时被切成单独的 chunk，
                真正渲染到它的时候才下载。
                必须配 <code>Suspense</code> 给个占位。
              </p>
              <p>
                <strong>为什么需要：</strong>
                SPA 默认把全站打成一个包，
                首屏要下载所有页面的代码
                （见 #321）。<strong>按路由切分</strong>
                是收益最大的一刀 ——
                用户打开首页不该下载「设置页」的代码。
              </p>
              <p>
                <strong>四个注意点：</strong>
              </p>
              <ul>
                <li>
                  <code>lazy</code> 的参数必须返回一个
                  <strong>带 <code>default</code> 导出</strong>
                  的 Promise ——
                  所以配的是 <code>default export</code>；
                  具名导出要自己包一层。
                </li>
                <li>
                  <strong>动态 <code>import()</code>
                  的路径不能是完全动态的变量</strong>，
                  打包工具需要在编译期能分析出来。
                </li>
                <li>
                  <strong>加载失败要有兜底</strong>——
                  网络断了 chunk 拉不下来，
                  要用错误边界包住（见 #333）。
                  <strong>这一点很多人不提，是加分项。</strong>
                </li>
                <li>
                  别切太碎 —— 每个 chunk 都是一次请求。
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「怎么避免切换页面时闪一下 loading？」——
                <strong>预加载</strong>：鼠标悬停在链接上时
                就调一次那个 <code>import()</code>
                （模块会被缓存）。
                或者用 React 18 的
                <code>useTransition</code>
                让旧页面留在屏幕上直到新页面就绪。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> it makes a component{" "}
                <strong>load on demand</strong> — the bundler cuts it into its own
                chunk, and the chunk is fetched only when you actually render it. It
                needs a <code>Suspense</code> around it to supply a placeholder.
              </p>
              <p>
                <strong>Why you need it:</strong> by default an SPA is one bundle, so
                the first screen downloads the code for every page (see #321).{" "}
                <strong>Splitting per route</strong> is the highest-value cut — opening
                the home page should not download the settings page.
              </p>
              <p>
                <strong>Four things to watch:</strong>
              </p>
              <ul>
                <li>
                  What you pass to <code>lazy</code> must return a Promise{" "}
                  <strong>with a <code>default</code> export</strong> — so it pairs
                  with <code>default export</code>; a named export needs a small
                  wrapper.
                </li>
                <li>
                  <strong>The path in a dynamic <code>import()</code> cannot be a
                  fully dynamic variable</strong> — the bundler has to be able to
                  analyse it at build time.
                </li>
                <li>
                  <strong>Handle the failure case</strong> — if the network drops the
                  chunk never arrives, so wrap it in an error boundary (see #333).{" "}
                  <strong>Most people leave this out, so it is a bonus point.</strong>
                </li>
                <li>
                  Do not split too finely — every chunk is another request.
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;How do you avoid a loading flash
                when switching pages?&rdquo; — <strong>preload</strong>: call that{" "}
                <code>import()</code> once when the mouse hovers the link (the module
                gets cached). Or use React 18&rsquo;s <code>useTransition</code> to
                keep the old page on screen until the new one is ready.
              </p>
            </>
          ),
          code: [
            demo(
              "jsx",
              `const Settings = lazy(() => import("./pages/Settings"));

<ErrorBoundary fallback={<p>加载失败，请刷新</p>}>
  <Suspense fallback={<Spinner />}>
    <Settings />
  </Suspense>
</ErrorBoundary>

// 预加载：悬停时就开始下载
const preload = () => import("./pages/Settings");
<Link to="/settings" onMouseEnter={preload}>设置</Link>`,
              {
    codeEn: `const Settings = lazy(() => import("./pages/Settings"));

<ErrorBoundary fallback={<p>Loading failed, please refresh</p>}>
  <Suspense fallback={<Spinner />}>
    <Settings />
  </Suspense>
</ErrorBoundary>

// Preloading: start downloading on hover
const preload = () => import("./pages/Settings");
<Link to="/settings" onMouseEnter={preload}>Settings</Link>`, filename: "lazy 的完整用法（含失败兜底）" },
            ),
          ],
        },
        {
          id: "q332",
          heading: "什么是 StrictMode",
          headingEn: "What is StrictMode?",
          lede: "#332 What is React strict mode",
          body: (
            <>
              <p>
                <strong>一句话：</strong>一个
                <strong>只在开发模式生效</strong>的检查工具组件，
                通过<strong>故意多做一次</strong>
                来暴露不安全的写法。
                <strong>生产构建里它什么都不做。</strong>
              </p>
              <p>
                <strong>它做三件事：</strong>
              </p>
              <ul>
                <li>
                  <strong>渲染函数调用两次</strong>——
                  暴露渲染过程中的副作用
                  （改了外部变量、直接 mutate props）。
                  <strong>因为 render 阶段可能被中断重跑
                  （见 #353），所以它必须是纯的。</strong>
                </li>
                <li>
                  <strong>React 18 起：effect 会
                  「挂载 → 卸载 → 再挂载」</strong>——
                  <strong>专门暴露「没写清理函数」的 effect</strong>。
                  如果你的组件挂两次就出问题
                  （重复订阅、定时器翻倍），
                  那就是真 bug。
                </li>
                <li>
                  警告废弃 API 和过时的 ref 写法。
                </li>
              </ul>
              <p>
                <strong>最重要的一句：
                「双重渲染导致的问题」不是 StrictMode 的问题，
                是你的代码的问题。</strong>
                很多人第一反应是「关掉它」——
                正确反应是修好副作用。
              </p>
              <p>
                <strong>会追问：</strong>
                「日志被打印两次正常吗？」——
                开发模式下正常，
                <strong>因为渲染函数被调了两次</strong>；
                生产不会。
                <br />
                「请求被发两次呢？」——
                <strong>这个要认真看</strong>：
                说明你的 effect 没有正确处理清理 ——
                虽然对幂等的 GET 无害，
                但它同时提示你「竞态防护写了没有」。
                <strong>我们那道 fetch 变式题里
                <code>ignore</code> 标志 +
                <code>abort</code> 的写法，
                正好让它在 StrictMode 下也表现正确。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> a checking component that{" "}
                <strong>only does anything in development</strong>, and it exposes
                unsafe code by <strong>deliberately doing things twice</strong>.{" "}
                <strong>In a production build it does nothing.</strong>
              </p>
              <p>
                <strong>It does three things:</strong>
              </p>
              <ul>
                <li>
                  <strong>Calls your render function twice</strong> — which surfaces
                  side effects during render (mutating an outer variable, mutating
                  props directly).{" "}
                  <strong>Because the render phase can be interrupted and re-run (see
                  #353), it has to be pure.</strong>
                </li>
                <li>
                  <strong>Since React 18: effects run mount, unmount,
                  mount</strong> — <strong>specifically to expose effects with no
                  cleanup function</strong>. If mounting twice breaks your component
                  (a duplicated subscription, a doubled timer), that is a real bug.
                </li>
                <li>
                  Warns about deprecated APIs and legacy ref patterns.
                </li>
              </ul>
              <p>
                <strong>The most important sentence: a problem caused by double
                rendering is not StrictMode&rsquo;s problem, it is your
                code&rsquo;s.</strong> Most people&rsquo;s first instinct is to turn
                it off — the right instinct is to fix the side effect.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Is it normal for my log to print
                twice?&rdquo; — yes in development,{" "}
                <strong>because the render function ran twice</strong>; it will not in
                production.
                <br />
                &ldquo;What about my request firing twice?&rdquo; —{" "}
                <strong>take that one seriously</strong>: it means your effect is not
                cleaning up properly. Harmless for an idempotent GET, but it is also
                telling you to ask whether you guarded against races.{" "}
                <strong>The <code>ignore</code> flag plus <code>abort</code> pattern
                from our fetch variant is exactly what makes it behave correctly under
                StrictMode too.</strong>
              </p>
            </>
          ),
        },
        {
          id: "q333",
          heading: "什么是错误边界，有什么用",
          headingEn: "What is an error boundary, and what is it for?",
          lede: "#333 What are error boundaries and How are they useful",
          body: (
            <>
              <p>
                <strong>一句话：</strong>一个
                <strong>能捕获子树渲染错误</strong>的类组件，
                出错时渲染兜底 UI，
                <strong>而不是让整个应用白屏</strong>。
              </p>
              <p>
                <strong>怎么写：</strong>
                实现 <code>getDerivedStateFromError</code>
                （用来切换到兜底 UI）和
                <code>componentDidCatch</code>
                （用来上报日志）。
                <strong>目前必须是 class 组件</strong>——
                没有对应的 hook。
              </p>
              <p>
                <strong>抓不到什么（这才是考点）：</strong>
              </p>
              <ul>
                <li>
                  <strong>事件处理函数里的错误</strong>——
                  因为那不在渲染过程中。
                  要自己 <code>try/catch</code>。
                </li>
                <li>
                  <strong>异步代码里的错误</strong>——
                  <code>setTimeout</code>、
                  Promise 回调（和 #310 同一个道理）。
                </li>
                <li>
                  <strong>服务端渲染</strong>。
                </li>
                <li>
                  <strong>错误边界自己抛的错。</strong>
                </li>
              </ul>
              <p>
                <strong>放哪：</strong>
                <strong>粒度要合适。</strong>
                只在根节点放一个，
                一个小组件挂了整页还是没了；
                <strong>推荐按「独立区块」放</strong>——
                每个路由页面、
                每个可独立失败的挂件
                （侧栏、图表、评论区）。
                这样一块坏了其他还能用。
              </p>
              <p>
                <strong>会追问：</strong>
                「怎么让用户能恢复？」——
                兜底 UI 里给一个「重试」按钮，
                把边界的 state 重置
                （或者换一个 <code>key</code>
                强制重建子树）。
                <code>react-error-boundary</code>
                这个库提供了 <code>resetErrorBoundary</code>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> a class component that{" "}
                <strong>catches render errors in its subtree</strong> and renders a
                fallback UI instead of{" "}
                <strong>letting the whole app go blank</strong>.
              </p>
              <p>
                <strong>How you write one:</strong> implement{" "}
                <code>getDerivedStateFromError</code> (to switch to the fallback) and{" "}
                <code>componentDidCatch</code> (to report the error).{" "}
                <strong>It still has to be a class component</strong> — there is no
                hook equivalent.
              </p>
              <p>
                <strong>What it does not catch — this is the real question:</strong>
              </p>
              <ul>
                <li>
                  <strong>Errors inside event handlers</strong> — those do not happen
                  during render. Use your own <code>try/catch</code>.
                </li>
                <li>
                  <strong>Errors in async code</strong> — <code>setTimeout</code>,
                  Promise callbacks (the same reason as #310).
                </li>
                <li>
                  <strong>Server-side rendering.</strong>
                </li>
                <li>
                  <strong>Errors thrown by the boundary itself.</strong>
                </li>
              </ul>
              <p>
                <strong>Where to put them:</strong>{" "}
                <strong>get the granularity right.</strong> One at the root only means
                a single broken widget still wipes out the page;{" "}
                <strong>put one around each independent block</strong> — each route,
                and each widget that can fail on its own (sidebar, chart, comments).
                Then one broken block leaves the rest usable.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;How does the user recover?&rdquo; —
                give the fallback a &ldquo;Retry&rdquo; button that resets the
                boundary&rsquo;s state (or changes a <code>key</code> to force the
                subtree to rebuild). The <code>react-error-boundary</code> library
                gives you <code>resetErrorBoundary</code> for this.
              </p>
            </>
          ),
          code: [
            demo(
              "jsx",
              `class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };                  // 切到兜底 UI
  }

  componentDidCatch(error, info) {
    report(error, info.componentStack); // 上报
  }

  render() {
    if (this.state.error) {
      return (
        <div>
          <p>这块出错了</p>
          <button onClick={() => this.setState({ error: null })}>重试</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// 按区块放，而不是只在根节点放一个
<ErrorBoundary><Sidebar /></ErrorBoundary>
<ErrorBoundary><Chart /></ErrorBoundary>`,
              {
    codeEn: `class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };                  // switch to the fallback UI
  }

  componentDidCatch(error, info) {
    report(error, info.componentStack); // report it
  }

  render() {
    if (this.state.error) {
      return (
        <div>
          <p>Something went wrong in this part</p>
          <button onClick={() => this.setState({ error: null })}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Put one per region rather than a single one at the root
<ErrorBoundary><Sidebar /></ErrorBoundary>
<ErrorBoundary><Chart /></ErrorBoundary>`, filename: "错误边界" },
            ),
          ],
        },
        {
          id: "q334",
          heading: "React Router 的意义是什么",
          headingEn: "What is the point of React Router?",
          lede: "#334 React router, What is the point of it",
          body: (
            <>
              <p>
                <strong>一句话：</strong>让 SPA
                <strong>有「URL」这个概念</strong>——
                把地址栏和当前渲染哪个组件对应起来，
                不刷新页面就能切换。
              </p>
              <p>
                <strong>它解决四件事：</strong>
              </p>
              <ul>
                <li>
                  <strong>URL ↔ 组件的映射</strong>
                </li>
                <li>
                  <strong>前进后退能用</strong>——
                  接管 <code>history</code> API
                </li>
                <li>
                  <strong>深链接可分享</strong>——
                  发给别人能直接打开那个页面
                </li>
                <li>
                  <strong>嵌套路由</strong>——
                  布局层和内容层分开
                  （<code>Outlet</code>）
                </li>
              </ul>
              <p>
                <strong>核心 API：</strong>
                <code>BrowserRouter</code>、
                <code>Routes</code> / <code>Route</code>、
                <code>Link</code> /
                <code>NavLink</code>、
                <code>useNavigate</code>、
                <code>useParams</code>、
                <code>useSearchParams</code>、
                <code>Outlet</code>。
              </p>
              <p>
                <strong>三个实践要点：</strong>
              </p>
              <ul>
                <li>
                  <strong>用 <code>Link</code> 不要用
                  <code>&lt;a&gt;</code></strong>——
                  后者会真的刷新整页，
                  SPA 的意义就没了。
                </li>
                <li>
                  <strong><code>BrowserRouter</code> 需要服务端
                  把所有路径都回退到
                  <code>index.html</code></strong>，
                  否则<strong>刷新子路由会 404</strong>。
                  没法配服务器就用
                  <code>HashRouter</code>。
                  <strong>这题很常问。</strong>
                </li>
                <li>
                  配 <code>React.lazy</code>
                  <strong>按路由切代码</strong>（#347）。
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「路由守卫怎么做？」——
                React Router 没有内置守卫，
                自己写一个包装组件：
                没登录就 <code>&lt;Navigate to=&quot;/login&quot; /&gt;</code>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> it gives an SPA{" "}
                <strong>the concept of a URL</strong> — it maps the address bar to
                whichever component is rendered, and switches between them without a
                page reload.
              </p>
              <p>
                <strong>It solves four things:</strong>
              </p>
              <ul>
                <li>
                  <strong>Mapping URLs to components</strong>
                </li>
                <li>
                  <strong>Back and forward work</strong> — it takes over the{" "}
                  <code>history</code> API
                </li>
                <li>
                  <strong>Deep links are shareable</strong> — send one to someone and
                  it opens that page directly
                </li>
                <li>
                  <strong>Nested routes</strong> — the layout layer and the content
                  layer stay separate (<code>Outlet</code>)
                </li>
              </ul>
              <p>
                <strong>The core API:</strong> <code>BrowserRouter</code>,{" "}
                <code>Routes</code> / <code>Route</code>, <code>Link</code> /{" "}
                <code>NavLink</code>, <code>useNavigate</code>,{" "}
                <code>useParams</code>, <code>useSearchParams</code>,{" "}
                <code>Outlet</code>.
              </p>
              <p>
                <strong>Three practical points:</strong>
              </p>
              <ul>
                <li>
                  <strong>Use <code>Link</code>, not{" "}
                  <code>&lt;a&gt;</code></strong> — an anchor really does reload the
                  whole page, which throws away the point of an SPA.
                </li>
                <li>
                  <strong><code>BrowserRouter</code> needs the server to fall back to{" "}
                  <code>index.html</code> for every path</strong>, otherwise{" "}
                  <strong>refreshing a nested route 404s</strong>. If you cannot
                  configure the server, use <code>HashRouter</code>.{" "}
                  <strong>This one comes up a lot.</strong>
                </li>
                <li>
                  Pair it with <code>React.lazy</code> to{" "}
                  <strong>split code per route</strong> (#347).
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;How do you do route guards?&rdquo; —
                React Router has none built in; you write a wrapper component
                yourself: if the user is not signed in, render{" "}
                <code>&lt;Navigate to=&quot;/login&quot; /&gt;</code>.
              </p>
            </>
          ),
        },
        {
          id: "q348",
          heading: "写 React 时你会注意哪些最佳实践",
          headingEn: "Which best practices do you follow when writing React?",
          lede: "#348 When coding React, what are some best practices that you keep in mind",
          body: (
            <>
              <p>
                <strong>这是开放题，答「有取舍的清单」比列一堆规则好。</strong>
                按重要性给六条：
              </p>
              <ul>
                <li>
                  <strong>不可变更新。</strong>
                  永远造新对象/新数组，
                  不就地改 —— 否则 React
                  比引用发现不了变化，界面不更新。
                  <strong>这是 React 里最常见的 bug 来源。</strong>
                </li>
                <li>
                  <strong>能算出来的别放 state。</strong>
                  派生数据当场算，
                  不要用 <code>useEffect</code> 同步两份数据 ——
                  同一个事实存两份必然会不一致。
                </li>
                <li>
                  <strong>state 放在「刚好够用」的那一层。</strong>
                  提太高造成 drilling 和多余渲染，
                  提太低兄弟拿不到。
                </li>
                <li>
                  <strong>effect 里建立的东西一定要清理。</strong>
                  定时器、监听器、订阅、在途请求。
                  <strong>判别法：effect 里出现
                  <code>setInterval</code> /
                  <code>addEventListener</code> /
                  <code>subscribe</code> /
                  <code>fetch</code>，就一定要
                  <code>return</code>。</strong>
                </li>
                <li>
                  <strong>列表 key 用稳定业务 id，不用 index。</strong>
                </li>
                <li>
                  <strong>先测量再优化。</strong>
                  别默认给所有东西套
                  <code>useMemo</code>。
                </li>
              </ul>
              <p>
                <strong>再补两条工程上的：</strong>
                组件保持小而专一
                （一个组件干一件事）；
                <strong>用 TypeScript</strong>——
                props 的形状是组件的契约，
                写下来比靠记忆可靠。
              </p>
              <p>
                <strong>如果面试官想听更具体的</strong>，
                可以说：
                「我会开着 <code>eslint-plugin-react-hooks</code>，
                <strong>不用注释关掉
                <code>exhaustive-deps</code> 警告</strong>——
                它几乎每次都是对的，
                想绕过它通常说明该重构了。」
                这条很能体现实战经验。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>This is an open question, and a list with trade-offs beats a
                pile of rules.</strong> Six, most important first:
              </p>
              <ul>
                <li>
                  <strong>Update immutably.</strong> Always build a new object or
                  array, never edit in place — otherwise React compares references,
                  sees nothing changed, and the UI does not update.{" "}
                  <strong>This is the single most common source of bugs in
                  React.</strong>
                </li>
                <li>
                  <strong>If you can compute it, do not store it in state.</strong>{" "}
                  Derive it on the spot; do not use <code>useEffect</code> to keep two
                  copies in sync — one fact stored twice will drift.
                </li>
                <li>
                  <strong>Keep state at the lowest level that works.</strong> Too high
                  and you get prop drilling and wasted renders; too low and siblings
                  cannot reach it.
                </li>
                <li>
                  <strong>Anything an effect sets up has to be torn down.</strong>{" "}
                  Timers, listeners, subscriptions, in-flight requests.{" "}
                  <strong>The test: if the effect contains{" "}
                  <code>setInterval</code>, <code>addEventListener</code>,{" "}
                  <code>subscribe</code> or <code>fetch</code>, it must{" "}
                  <code>return</code> something.</strong>
                </li>
                <li>
                  <strong>Use stable business ids as list keys, not the index.</strong>
                </li>
                <li>
                  <strong>Measure before optimising.</strong> Do not wrap everything in{" "}
                  <code>useMemo</code> by default.
                </li>
              </ul>
              <p>
                <strong>Two more on the engineering side:</strong> keep components
                small and single-purpose (one component, one job); and{" "}
                <strong>use TypeScript</strong> — the shape of the props is the
                component&rsquo;s contract, and writing it down beats remembering it.
              </p>
              <p>
                <strong>If the interviewer wants something more specific</strong>, you
                can say: &ldquo;I keep <code>eslint-plugin-react-hooks</code> on and{" "}
                <strong>I do not silence the <code>exhaustive-deps</code> warning with
                a comment</strong> — it is right almost every time, and wanting to get
                around it usually means the code needs restructuring.&rdquo; That one
                really shows hands-on experience.
              </p>
            </>
          ),
        },
      ],
      transfer: [
        {
          signal: "问性能优化",
          signalEn: "Asked about performance work",
          reachFor: "先说用 Profiler 测量，再分「少渲染/少下载/少算」三类",
          reachForEn: "Start with measuring in the Profiler, then split the answer three ways: render less, download less, compute less",
        },
        {
          signal: "长列表卡",
          signalEn: "A long list feels slow",
          reachFor: "虚拟化，收益远大于 memo",
          reachForEn: "Render only the visible rows; this helps far more than memo",
        },
        {
          signal: "频繁变的 state 拖累整棵树",
          signalEn: "State that changes often slows down the whole tree",
          reachFor: "state 下移，别提到顶层",
          reachForEn: "Move that state down to the component that needs it instead of keeping it at the top",
        },
        {
          signal: "要动态样式",
          signalEn: "You need styles that change at runtime",
          reachFor: "行内只放 CSS 变量，规则留在 CSS 文件",
          reachForEn: "Put only CSS variables inline and keep the rules in the CSS file",
        },
        {
          signal: "「setState 两次只渲染一次了」",
          signalEn: "Two setState calls now cause only one render",
          reachFor: "React 18 自动批处理；要立即渲染用 flushSync",
          reachForEn: "React 18 batches them automatically; use flushSync if you need the render right away",
        },
        {
          signal: "「effect 跑了两次 / 日志打两遍」",
          signalEn: "The effect runs twice, or a log appears twice",
          reachFor: "StrictMode 故意的，检查清理函数写了没",
          reachForEn: "StrictMode does that on purpose; check that you wrote the cleanup function",
        },
        {
          signal: "「一个小组件报错整页白屏」",
          signalEn: "One small component throws and the whole page goes blank",
          reachFor: "按区块放错误边界",
          reachForEn: "Put an error boundary around each section of the page",
        },
        {
          signal: "「刷新子路由 404」",
          signalEn: "Reloading a nested route gives a 404",
          reachFor: "服务端配 history fallback，或用 HashRouter",
          reachForEn: "Configure a history fallback on the server, or use HashRouter",
        },
      ],
      recap: [
        "性能优化先用 Profiler 测量；三类手段是少渲染、少下载、少算，长列表虚拟化收益最大。",
        "动态样式用 CSS 变量而不是行内 style —— 保留伪类和媒体查询。",
        "React 18 核心是并发渲染；最易感知的是自动批处理，用不上并发特性通常是没换 createRoot。",
        "React.lazy 要配 Suspense，还要配错误边界兜住 chunk 加载失败。",
        "StrictMode 只在开发生效，故意双渲染和双挂载来暴露不纯的渲染和缺失的清理函数。",
        "错误边界抓不到事件回调、异步代码、SSR 的错误；要按区块放而不是只放根节点。",
        "Router 用 Link 不用 a；BrowserRouter 需要服务端 history fallback。",
        "最佳实践六条：不可变更新、别存派生数据、state 放刚好够用的层、清理副作用、稳定 key、先测量再优化。",
      ],
      recapEn: [
        "Measure in the Profiler before you optimise. The three kinds of fix are render less, download less, compute less, and rendering only the visible rows of a long list pays off most.",
        "For styles that change at runtime use a CSS variable rather than an inline style, so you keep pseudo-classes and media queries.",
        "The core of React 18 is concurrent rendering. The change you notice first is automatic batching, and if the concurrent features do nothing for you it is usually because you did not switch to createRoot.",
        "React.lazy needs Suspense around it, and also an error boundary in case the chunk fails to load.",
        "StrictMode runs in development only. It renders and mounts twice on purpose, to expose a render that is not pure and a missing cleanup function.",
        "An error boundary does not catch errors in event handlers, in async code, or during SSR. Place one per section of the page rather than only at the root.",
        "With Router use Link, not a. BrowserRouter needs a history fallback on the server.",
        "Six best practices: update without changing the original, do not store what you can compute, keep state at the lowest level that works, clean up side effects, use stable keys, measure before you optimise.",
      ],
    },

    /* ============================================================
       Redux 与 TypeScript（6 题）
       ============================================================ */
    {
      id: "iv-react-redux",
      title: "Redux 与 TypeScript · 六问",
      titleEn: "6 questions on Redux and TypeScript",
      blurb: "Redux vs Context、结构与工作流、三大原则、中间件、JS vs TS、静态类型检查。",
      blurbEn:
        "Redux vs Context, the parts and the data flow, the three principles, middleware, JS vs TS, static type checking.",
      minutes: 22,
      objectives: [
        "说清 Redux 和 Context 解决的不是同一个问题",
        "画出 action → middleware → reducer → store → view 的完整流转",
        "背出三大原则并解释每一条为什么必要",
        "说明静态类型检查在什么阶段发现什么问题",
      ],
      objectivesEn: [
        "Explain that Redux and Context do not solve the same problem",
        "Draw the full path: action to middleware to reducer to store to view",
        "State the three principles, and explain why each one is needed",
        "Say at which stage static type checking finds a problem, and which kind of problem",
      ],
      whyForAssessment:
        "只要简历上写了 Redux，这四道基本会连着问。「Redux vs Context」是最容易答错的一道 —— 说「Context 能替代 Redux」或者反过来都不对。TS 那两道是现在的标配题。",
      whyForAssessmentEn:
        "If Redux is on your resume, these four questions usually come one after another. \"Redux vs Context\" is the one people get wrong most often: saying Context can replace Redux is wrong, and so is the opposite. The two TypeScript questions are now standard.",
      concepts: [
        {
          id: "q349",
          heading: "Redux vs Context API",
          lede: "#349 Redux vs Context API",
          body: (
            <>
              <p>
                <strong>一句话（这句最关键）：</strong>
                <strong>它们解决的不是同一个问题。</strong>
                Context 是<strong>「传递」</strong>方案
                （怎么把值送到深处），
                Redux 是<strong>「状态管理」</strong>方案
                （状态怎么组织、怎么改、怎么调试）。
              </p>
              <p>
                <strong>「Context 能不能替代 Redux」——
                严格说，Context + <code>useReducer</code>
                可以覆盖 Redux 的基本功能，
                但缺三样东西：</strong>
              </p>
              <ul>
                <li>
                  <strong>没有精细的订阅。</strong>
                  context 一变，<strong>所有</strong>消费者都重渲染，
                  哪怕它只用了其中一个字段。
                  Redux 的 <code>useSelector</code>
                  只在<strong>你选的那部分</strong>变化时重渲染。
                  <strong>这是最大的实际差别。</strong>
                </li>
                <li>
                  <strong>没有中间件。</strong>
                  统一处理异步、日志、
                  持久化都要自己造。
                </li>
                <li>
                  <strong>没有 DevTools。</strong>
                  时间旅行、action 记录、
                  状态 diff 都没有。
                </li>
              </ul>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Context</th>
                      <th>Redux</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>适合</td>
                      <td>主题、当前用户、语言 ——<strong>不常变</strong></td>
                      <td>频繁变、多处读写、需要调试追溯</td>
                    </tr>
                    <tr>
                      <td>订阅粒度</td>
                      <td>整个 value</td>
                      <td>按 selector</td>
                    </tr>
                    <tr>
                      <td>额外依赖</td>
                      <td>无</td>
                      <td>有</td>
                    </tr>
                    <tr>
                      <td>样板代码</td>
                      <td>少</td>
                      <td>有（Redux Toolkit 后少很多）</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>会追问：</strong>
                「现在还用 Redux 吗？」——
                答得诚实一点：
                <strong>纯客户端状态很多项目改用 Zustand / Jotai</strong>
                （更轻）；
                <strong>服务端数据用 TanStack Query / SWR</strong>
                （缓存、去重、重试是它们的本职，
                Redux 做这个是硬凑）。
                <strong>Redux 现在的强项是「复杂的、
                有大量交互逻辑的客户端状态 + 要可追溯调试」</strong>，
                而且一定要用 Redux Toolkit 而不是手写。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line — and this is the key sentence:</strong>{" "}
                <strong>they do not solve the same problem.</strong> Context is a{" "}
                <strong>delivery</strong> mechanism (how a value reaches something deep
                in the tree); Redux is a <strong>state management</strong> solution
                (how state is organised, changed and debugged).
              </p>
              <p>
                <strong>&ldquo;Can Context replace Redux?&rdquo; — strictly speaking,
                Context plus <code>useReducer</code> covers Redux&rsquo;s basic
                features, but three things are missing:</strong>
              </p>
              <ul>
                <li>
                  <strong>No fine-grained subscription.</strong> When the context
                  changes, <strong>every</strong> consumer re-renders, even one that
                  only reads a single field. Redux&rsquo;s <code>useSelector</code>{" "}
                  re-renders only when <strong>the slice you selected</strong> changes.{" "}
                  <strong>That is the biggest practical difference.</strong>
                </li>
                <li>
                  <strong>No middleware.</strong> Handling async, logging and
                  persistence in one place is all yours to build.
                </li>
                <li>
                  <strong>No DevTools.</strong> No time travel, no action log, no state
                  diff.
                </li>
              </ul>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Context</th>
                      <th>Redux</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Good for</td>
                      <td>Theme, current user, locale — <strong>rarely changes</strong></td>
                      <td>Changes often, read and written in many places, needs a debuggable trail</td>
                    </tr>
                    <tr>
                      <td>Subscription granularity</td>
                      <td>The whole value</td>
                      <td>Per selector</td>
                    </tr>
                    <tr>
                      <td>Extra dependency</td>
                      <td>None</td>
                      <td>Yes</td>
                    </tr>
                    <tr>
                      <td>Boilerplate</td>
                      <td>Little</td>
                      <td>Some (far less since Redux Toolkit)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>Follow-up:</strong> &ldquo;Do people still use Redux?&rdquo; —
                answer honestly:{" "}
                <strong>plenty of projects moved pure client state to Zustand or
                Jotai</strong> (lighter);{" "}
                <strong>server data goes to TanStack Query or SWR</strong> (caching,
                deduping and retries are their day job, and Redux doing it is a
                stretch).{" "}
                <strong>Redux&rsquo;s remaining strength is complex client state with a
                lot of interaction logic that you need to be able to trace</strong>,
                and you should always use Redux Toolkit rather than write it by hand.
              </p>
            </>
          ),
        },
        {
          id: "q350",
          heading: "Redux 的结构和工作流",
          headingEn: "What are the parts of Redux and how does data flow through them?",
          lede: "#350 Redux structure and workflow",
          body: (
            <>
              <p>
                <strong>一句话：</strong>
                <strong>单向环</strong>——
                view 派发 action → 中间件处理 →
                reducer 算出新 state →
                store 更新 → 订阅的组件重渲染。
              </p>
              <p>
                <strong>五个角色：</strong>
              </p>
              <ul>
                <li>
                  <strong>store</strong>——
                  <strong>唯一</strong>的状态容器，
                  提供 <code>getState</code> /
                  <code>dispatch</code> /
                  <code>subscribe</code>。
                </li>
                <li>
                  <strong>action</strong>——
                  <strong>描述「发生了什么」</strong>
                  的普通对象，必须有 <code>type</code>。
                  <strong>它只描述，不做事。</strong>
                </li>
                <li>
                  <strong>reducer</strong>——
                  <code>(state, action) =&gt; newState</code>，
                  <strong>必须是纯函数</strong>。
                </li>
                <li>
                  <strong>middleware</strong>——
                  在 action 到 reducer 之前拦一道（#354）。
                </li>
                <li>
                  <strong>selector</strong>——
                  从 store 里挑出组件需要的那部分。
                </li>
              </ul>
              <p>
                <strong>Redux Toolkit（RTK）改变了什么</strong>——
                必答，因为现在没人手写 Redux 了：
              </p>
              <ul>
                <li>
                  <code>createSlice</code>
                  <strong>一次生成 reducer + action creators +
                  action types</strong>，
                  样板代码少一大半。
                </li>
                <li>
                  内置 <strong>Immer</strong>，
                  所以你可以<strong>写起来像在改
                  <code>state.list.push(x)</code>，
                  实际产出的是新对象</strong>——
                  但要注意这只在
                  <code>createSlice</code> 里成立。
                </li>
                <li>
                  默认装好 thunk 和 DevTools。
                </li>
                <li>
                  <code>createAsyncThunk</code>
                  管异步的三个状态
                  （pending / fulfilled / rejected）。
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「为什么必须单向？」——
                因为<strong>状态变化的路径唯一，
                所以出 bug 时可以从 action 记录里
                倒推每一步</strong>。
                双向绑定的框架里
                「这个值到底是谁改的」经常查不清。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> <strong>a one-way loop</strong> — the view
                dispatches an action, middleware handles it, a reducer computes the new
                state, the store updates, and the subscribed components re-render.
              </p>
              <p>
                <strong>Five roles:</strong>
              </p>
              <ul>
                <li>
                  <strong>store</strong> — the <strong>single</strong> container for
                  state, exposing <code>getState</code>, <code>dispatch</code> and{" "}
                  <code>subscribe</code>.
                </li>
                <li>
                  <strong>action</strong> — a plain object that{" "}
                  <strong>describes what happened</strong> and must have a{" "}
                  <code>type</code>. <strong>It only describes; it does nothing.</strong>
                </li>
                <li>
                  <strong>reducer</strong> —{" "}
                  <code>(state, action) =&gt; newState</code>, and it{" "}
                  <strong>has to be pure</strong>.
                </li>
                <li>
                  <strong>middleware</strong> — intercepts the action on its way to the
                  reducer (#354).
                </li>
                <li>
                  <strong>selector</strong> — picks the part of the store a component
                  needs.
                </li>
              </ul>
              <p>
                <strong>What Redux Toolkit (RTK) changed</strong> — you have to cover
                this, because nobody hand-writes Redux any more:
              </p>
              <ul>
                <li>
                  <code>createSlice</code>{" "}
                  <strong>generates the reducer, the action creators and the action
                  types at once</strong>, cutting more than half the boilerplate.
                </li>
                <li>
                  <strong>Immer</strong> is built in, so you can{" "}
                  <strong>write what looks like a mutation —{" "}
                  <code>state.list.push(x)</code> — and still get a new object
                  out</strong>. Just remember this only holds inside{" "}
                  <code>createSlice</code>.
                </li>
                <li>
                  thunk and DevTools are wired up by default.
                </li>
                <li>
                  <code>createAsyncThunk</code> handles the three async states (pending
                  / fulfilled / rejected).
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;Why does it have to be
                one-way?&rdquo; — because{" "}
                <strong>there is exactly one path a change can take, so when something
                breaks you can walk back through the action log step by
                step</strong>. In a two-way binding framework, &ldquo;who actually
                changed this value&rdquo; is often unanswerable.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `// RTK 的 slice：reducer + actions 一次生成
const todos = createSlice({
  name: "todos",
  initialState: [],
  reducers: {
    add(state, action) {
      state.push(action.payload);   // 看着是 mutate，Immer 会产出新 state
    },
    toggle(state, action) {
      const t = state.find((x) => x.id === action.payload);
      if (t) t.done = !t.done;
    },
  },
});

export const { add, toggle } = todos.actions;

// 组件里
const list = useSelector((s) => s.todos);        // 只订阅这一部分
const dispatch = useDispatch();
dispatch(add({ id: Date.now(), text, done: false }));`,
              {
    codeEn: `// An RTK slice generates the reducer and the actions together
const todos = createSlice({
  name: "todos",
  initialState: [],
  reducers: {
    add(state, action) {
      state.push(action.payload);   // it looks like a mutation; Immer produces a new state
    },
    toggle(state, action) {
      const t = state.find((x) => x.id === action.payload);
      if (t) t.done = !t.done;
    },
  },
});

export const { add, toggle } = todos.actions;

// In the component
const list = useSelector((s) => s.todos);        // subscribes to this part only
const dispatch = useDispatch();
dispatch(add({ id: Date.now(), text, done: false }));`, filename: "现在真正会写的 Redux" },
            ),
          ],
        },
        {
          id: "q352",
          heading: "Redux 的三大原则",
          headingEn: "What are the three principles of Redux?",
          lede: "#352 Redux 3 main principles",
          body: (
            <>
              <p>
                <strong>三条，每条都要说出「为什么」：</strong>
              </p>
              <ol>
                <li>
                  <strong>单一数据源（single source of truth）</strong>——
                  整个应用一个 store。
                  <br />
                  <strong>为什么：</strong>
                  状态只有一份就不会不一致，
                  而且<strong>整个应用的状态可以被序列化</strong>——
                  这才有了「保存/恢复现场」和 SSR 脱水注水。
                </li>
                <li>
                  <strong>state 只读</strong>——
                  只能通过派发 action 改。
                  <br />
                  <strong>为什么：</strong>
                  <strong>把「谁能改状态」收窄到一个入口</strong>，
                  于是所有变化都可以被记录、
                  可以被拦截、可以被回放。
                </li>
                <li>
                  <strong>用纯函数（reducer）做修改</strong>——
                  <code>(state, action) =&gt; newState</code>。
                  <br />
                  <strong>为什么：</strong>
                  纯函数<strong>给定同样的 state 和 action
                  永远得到同样结果</strong>，
                  所以能重放、能测试、
                  <strong>时间旅行调试才成立</strong>。
                </li>
              </ol>
              <p>
                <strong>这三条是一个整体</strong>：
                单一数据源让状态可序列化，
                只读让变化可记录，
                纯 reducer 让变化可重放 ——
                <strong>三者合起来才有 DevTools 的时间旅行。</strong>
                能把它们串起来讲比一条条背强得多。
              </p>
              <p>
                <strong>会追问：</strong>
                「reducer 里能做什么不能做什么？」——
                <strong>不能</strong>：改传进来的 state、
                发请求、读
                <code>Date.now()</code> /
                <code>Math.random()</code>、
                派发别的 action。
                <strong>这些都放中间件或 action creator 里。</strong>
                <br />
                「RTK 里 <code>state.push()</code>
                违反第 2 条吗？」——
                不违反。Immer 给的是一个
                <strong>草稿代理（draft proxy）</strong>，
                你的修改被记录下来，
                最终产出的是新对象，原 state 没动。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>Three of them, and each one needs a &ldquo;why&rdquo;:</strong>
              </p>
              <ol>
                <li>
                  <strong>Single source of truth</strong> — one store for the whole app.
                  <br />
                  <strong>Why:</strong> one copy of the state cannot disagree with
                  itself, and{" "}
                  <strong>the entire app state can be serialised</strong> — which is
                  what makes &ldquo;save and restore the session&rdquo; and SSR
                  dehydration possible.
                </li>
                <li>
                  <strong>State is read-only</strong> — you change it only by
                  dispatching an action.
                  <br />
                  <strong>Why:</strong>{" "}
                  <strong>it narrows &ldquo;who can change state&rdquo; down to one
                  entrance</strong>, so every change can be logged, intercepted and
                  replayed.
                </li>
                <li>
                  <strong>Changes are made by pure functions (reducers)</strong> —{" "}
                  <code>(state, action) =&gt; newState</code>.
                  <br />
                  <strong>Why:</strong> a pure function{" "}
                  <strong>always gives the same result for the same state and
                  action</strong>, so it can be replayed and tested, and{" "}
                  <strong>that is what makes time-travel debugging work</strong>.
                </li>
              </ol>
              <p>
                <strong>The three are one package</strong>: a single source of truth
                makes state serialisable, read-only makes changes loggable, and pure
                reducers make changes replayable —{" "}
                <strong>together they add up to time travel in DevTools.</strong>{" "}
                Tying them together like this is much stronger than reciting them one
                by one.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;What can and cannot a reducer
                do?&rdquo; — <strong>it cannot</strong> mutate the state it was given,
                make requests, read <code>Date.now()</code> or{" "}
                <code>Math.random()</code>, or dispatch other actions.{" "}
                <strong>All of that belongs in middleware or an action
                creator.</strong>
                <br />
                &ldquo;Does <code>state.push()</code> in RTK break rule 2?&rdquo; — no.
                Immer hands you a <strong>draft proxy</strong>, records your edits, and
                produces a new object; the original state is untouched.
              </p>
            </>
          ),
        },
        {
          id: "q354",
          heading: "解释一下 Redux 中间件",
          headingEn: "Explain Redux middleware",
          lede: "#354 explain Redux Middleware",
          body: (
            <>
              <p>
                <strong>一句话：</strong>中间件是
                <strong>夹在「派发 action」和
                「reducer 收到 action」之间的一层</strong>，
                能拦截、改写、延迟、
                甚至吞掉一个 action。
              </p>
              <p>
                <strong>签名是三层柯里化</strong>——
                这个形状本身常被问到：
                <code>store =&gt; next =&gt; action =&gt; {"{}"}</code>。
                多个中间件靠 <code>next</code>
                串成一条链，<strong>和 Express 的中间件是同一个模式</strong>。
              </p>
              <p>
                <strong>为什么需要它：</strong>
                因为<strong>reducer 必须是纯的</strong>，
                所以异步和副作用无处安放。
                中间件就是<strong>专门给副作用留的位置</strong>。
              </p>
              <p>
                <strong>常见的几个：</strong>
              </p>
              <ul>
                <li>
                  <strong><code>redux-thunk</code></strong>——
                  让你能 dispatch 一个
                  <strong>函数</strong>而不只是对象，
                  在里面做异步。最简单，RTK 默认装。
                </li>
                <li>
                  <strong><code>redux-saga</code></strong>——
                  用 generator 描述复杂异步流程
                  （可取消、可重试、能编排多个请求）。
                  能力强但学习成本高。
                </li>
                <li>
                  <strong><code>redux-logger</code></strong>——
                  打印每个 action 前后的 state。
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「thunk 和 saga 怎么选？」——
                大部分项目 thunk 够了；
                <strong>只有在需要「取消、去抖、
                复杂的流程编排」时 saga 才值那份复杂度</strong>。
                <br />
                「能自己写一个吗？」——
                能，而且面试常让手写一个 logger。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> middleware is{" "}
                <strong>a layer between &ldquo;an action is dispatched&rdquo; and
                &ldquo;the reducer receives it&rdquo;</strong>. It can intercept,
                rewrite, delay or even swallow an action.
              </p>
              <p>
                <strong>The signature is curried three levels deep</strong> — the shape
                itself gets asked about:{" "}
                <code>store =&gt; next =&gt; action =&gt; {"{}"}</code>. Several
                middlewares chain together through <code>next</code>, and{" "}
                <strong>it is the same pattern as Express middleware</strong>.
              </p>
              <p>
                <strong>Why you need it:</strong> because{" "}
                <strong>the reducer has to be pure</strong>, async work and side effects
                have nowhere to live. Middleware is{" "}
                <strong>the place reserved for side effects</strong>.
              </p>
              <p>
                <strong>The common ones:</strong>
              </p>
              <ul>
                <li>
                  <strong><code>redux-thunk</code></strong> — lets you dispatch a{" "}
                  <strong>function</strong> instead of only an object, and do your async
                  work inside it. Simplest option, and RTK installs it by default.
                </li>
                <li>
                  <strong><code>redux-saga</code></strong> — describes complex async
                  flows with generators (cancellable, retryable, able to orchestrate
                  several requests). Powerful, but a steep learning curve.
                </li>
                <li>
                  <strong><code>redux-logger</code></strong> — prints the state before
                  and after each action.
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;thunk or saga?&rdquo; — thunk is
                enough for most projects;{" "}
                <strong>saga only earns its complexity when you need cancellation,
                debouncing or real flow orchestration</strong>.
                <br />
                &ldquo;Could you write one?&rdquo; — yes, and interviewers often ask you
                to write a logger on the spot.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `// 手写一个 logger 中间件：注意那三层箭头
const logger = (store) => (next) => (action) => {
  console.log("派发:", action.type, action.payload);
  const result = next(action);          // 交给下一个中间件 / reducer
  console.log("新状态:", store.getState());
  return result;
};

// thunk 让 dispatch 能收函数
const fetchUser = (id) => async (dispatch) => {
  dispatch({ type: "user/loading" });
  try {
    const res = await fetch(\`/api/users/\${id}\`);
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);   // 别忘了这一句
    dispatch({ type: "user/loaded", payload: await res.json() });
  } catch (e) {
    dispatch({ type: "user/failed", payload: e.message });
  }
};`,
              {
    codeEn: `// Writing a logger middleware yourself: note the three levels of arrows
const logger = (store) => (next) => (action) => {
  console.log("dispatching:", action.type, action.payload);
  const result = next(action);          // hand it to the next middleware or the reducer
  console.log("new state:", store.getState());
  return result;
};

// thunk lets dispatch accept a function
const fetchUser = (id) => async (dispatch) => {
  dispatch({ type: "user/loading" });
  try {
    const res = await fetch(\`/api/users/\${id}\`);
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);   // do not forget this line
    dispatch({ type: "user/loaded", payload: await res.json() });
  } catch (e) {
    dispatch({ type: "user/failed", payload: e.message });
  }
};`, filename: "中间件的形状与 thunk" },
            ),
          ],
        },
        {
          id: "q355",
          heading: "JavaScript vs TypeScript",
          lede: "#355 Javascript vs TypeScript",
          body: (
            <>
              <p>
                <strong>一句话：</strong>TS 是 JS 的
                <strong>超集</strong>——
                加了静态类型，
                <strong>编译后就是普通 JS，
                运行时没有任何 TS 的东西</strong>。
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>JavaScript</th>
                      <th>TypeScript</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>类型检查</td>
                      <td>运行时才炸</td>
                      <td><strong>编译期就报</strong></td>
                    </tr>
                    <tr>
                      <td>需要构建</td>
                      <td>不需要</td>
                      <td>需要（<code>tsc</code> / esbuild / SWC）</td>
                    </tr>
                    <tr>
                      <td>IDE 支持</td>
                      <td>靠猜</td>
                      <td>精确补全、跳转、重命名</td>
                    </tr>
                    <tr>
                      <td>重构</td>
                      <td>靠搜字符串</td>
                      <td><strong>改一处，所有不兼容的地方都报出来</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>「运行时没有 TS」这句要强调</strong>，
                因为它推出两个重要结论：
              </p>
              <ul>
                <li>
                  <strong>类型不能用来做运行时校验。</strong>
                  接口返回的数据是不是真的符合你写的
                  <code>interface</code>，
                  TS <strong>管不了</strong>——
                  要校验得用 zod 这类库。
                  <strong>这是新手最大的误解。</strong>
                </li>
                <li>
                  <code>as</code> 断言只是
                  <strong>「我保证」</strong>，
                  不做任何检查。滥用 <code>as</code>
                  和 <code>any</code> 等于关掉了 TS。
                </li>
              </ul>
              <p>
                <strong>代价（要主动说）：</strong>
                多一步构建、
                有学习成本（泛型、
                条件类型、
                <code>unknown</code> vs{" "}
                <code>any</code>）、
                第三方库缺类型时要自己写声明、
                复杂类型报错很难读。
              </p>
              <p>
                <strong>会追问：</strong>
                「<code>interface</code> 和
                <code>type</code> 选哪个？」——
                <code>interface</code>
                能被<strong>重复声明合并</strong>、
                更适合描述对象和 class 契约；
                <code>type</code> 能写联合、
                交叉、映射、条件类型，能力更全。
                实践上「对象形状用 interface，
                其他用 type」，
                <strong>但团队统一比选哪个更重要</strong>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> TS is a <strong>superset</strong> of JS —
                it adds static types, and{" "}
                <strong>after compilation it is ordinary JS with nothing of TS left at
                runtime</strong>.
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>JavaScript</th>
                      <th>TypeScript</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Type checking</td>
                      <td>Fails at runtime</td>
                      <td><strong>Reported at compile time</strong></td>
                    </tr>
                    <tr>
                      <td>Build step</td>
                      <td>Not needed</td>
                      <td>Needed (<code>tsc</code> / esbuild / SWC)</td>
                    </tr>
                    <tr>
                      <td>IDE support</td>
                      <td>Guesswork</td>
                      <td>Precise completion, go-to-definition, rename</td>
                    </tr>
                    <tr>
                      <td>Refactoring</td>
                      <td>Search for strings</td>
                      <td><strong>Change one place and every incompatible use lights up</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>Stress the &ldquo;nothing of TS at runtime&rdquo; line</strong>,
                because two important conclusions follow from it:
              </p>
              <ul>
                <li>
                  <strong>Types cannot validate anything at runtime.</strong> Whether
                  the data an API returns really matches the <code>interface</code> you
                  wrote is <strong>beyond TS</strong> — for that you need something like
                  zod. <strong>This is the biggest beginner misconception.</strong>
                </li>
                <li>
                  An <code>as</code> assertion is just{" "}
                  <strong>&ldquo;trust me&rdquo;</strong> and checks nothing. Overusing{" "}
                  <code>as</code> and <code>any</code> is the same as turning TS off.
                </li>
              </ul>
              <p>
                <strong>The costs — bring them up yourself:</strong> an extra build
                step, a learning curve (generics, conditional types,{" "}
                <code>unknown</code> vs <code>any</code>), writing your own
                declarations when a library ships none, and error messages for complex
                types that are hard to read.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;<code>interface</code> or{" "}
                <code>type</code>?&rdquo; — <code>interface</code> can be{" "}
                <strong>declared again and merged</strong> and suits object and class
                contracts; <code>type</code> can do unions, intersections, mapped and
                conditional types, so it is more capable. In practice:
                &ldquo;interface for object shapes, type for everything else&rdquo; —{" "}
                <strong>but a consistent team choice matters more than which one you
                pick</strong>.
              </p>
            </>
          ),
        },
        {
          id: "q356",
          heading: "什么是静态类型检查，有什么好处",
          headingEn: "What is static type checking, and what does it give you?",
          lede: "#356 What is static type checking and how can developers benefit from it",
          body: (
            <>
              <p>
                <strong>一句话：</strong>
                <strong>不运行代码，只靠分析源码</strong>
                就找出类型不匹配的地方。
                「静态」的意思就是「在编译期，而非运行期」。
              </p>
              <p>
                <strong>四个具体收益（要给例子，别空谈）：</strong>
              </p>
              <ul>
                <li>
                  <strong>错误提前</strong>——
                  <code>user.nmae</code> 拼错、
                  忘了处理 <code>null</code>、
                  给函数传少了参数，
                  <strong>在编辑器里就红了，
                  而不是上线后用户报给你</strong>。
                </li>
                <li>
                  <strong>类型即文档</strong>——
                  函数签名说明了它要什么、给什么。
                  <strong>而且这份文档不会过期</strong>，
                  因为改了代码不改类型就编译不过。
                </li>
                <li>
                  <strong>重构有底气</strong>——
                  改一个字段名，
                  所有受影响的地方都会报错。
                  <strong>这是 TS 最被低估的价值</strong>，
                  在大项目里比「防 bug」更实用。
                </li>
                <li>
                  <strong>IDE 能力</strong>——
                  精确补全、跳定义、
                  安全重命名。
                </li>
              </ul>
              <p>
                <strong>局限（说出来才显得懂）：</strong>
                <strong>它只保证「类型对」，不保证「逻辑对」</strong>——
                类型全过的代码照样能算错工资。
                而且<strong>它管不到运行时的外部数据</strong>
                （见 #355），
                <strong>所以类型检查不能替代测试</strong>。
              </p>
              <p>
                <strong>会追问：</strong>
                「<code>strict</code> 模式开不开？」——
                <strong>新项目一定开</strong>。
                最有价值的是
                <code>strictNullChecks</code>——
                它把「忘了判空」这一整类
                运行时错误变成编译错误。
                <br />
                <strong>顺带一个真实例子：</strong>
                React 那门课的源项目
                <code>npm run build</code> 就是因为
                <code>tsc</code> 报了 10 个错误而失败的
                （测试文件缺 vitest 全局类型）——
                这说明<strong>类型检查是构建的一部分，
                不是可选的 lint</strong>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong>{" "}
                <strong>without running the code, purely by analysing the source</strong>,
                it finds places where the types do not line up. &ldquo;Static&rdquo;
                just means &ldquo;at compile time, not at run time&rdquo;.
              </p>
              <p>
                <strong>Four concrete benefits — give examples, do not speak in the
                abstract:</strong>
              </p>
              <ul>
                <li>
                  <strong>Errors surface earlier</strong> — a typo like{" "}
                  <code>user.nmae</code>, a forgotten <code>null</code> case, a missing
                  argument:{" "}
                  <strong>they go red in the editor instead of arriving as a user
                  report after release</strong>.
                </li>
                <li>
                  <strong>Types are documentation</strong> — a signature says what it
                  wants and what it gives back.{" "}
                  <strong>And this documentation cannot go stale</strong>, because
                  changing the code without changing the types fails the build.
                </li>
                <li>
                  <strong>Refactoring with confidence</strong> — rename one field and
                  every affected place errors.{" "}
                  <strong>This is TS&rsquo;s most underrated value</strong>, and on a
                  large codebase it is more useful than bug prevention.
                </li>
                <li>
                  <strong>Editor power</strong> — accurate completion, jump to
                  definition, safe rename.
                </li>
              </ul>
              <p>
                <strong>The limits — saying them is what shows you get it:</strong>{" "}
                <strong>it only guarantees the types are right, not that the logic
                is</strong> — fully typed code can still calculate the wrong salary. And{" "}
                <strong>it has no reach over external data at runtime</strong> (see
                #355), <strong>so type checking is not a substitute for tests</strong>.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Do you turn on{" "}
                <code>strict</code>?&rdquo; —{" "}
                <strong>always on a new project</strong>. The most valuable piece is{" "}
                <code>strictNullChecks</code> — it turns an entire class of
                &ldquo;forgot the null check&rdquo; runtime errors into compile errors.
                <br />
                <strong>A real example to go with it:</strong>{" "}
                <code>npm run build</code> on the source project for the React course
                fails precisely because <code>tsc</code> reports 10 errors (the test
                file is missing the vitest globals) — which shows{" "}
                <strong>type checking is part of the build, not an optional
                lint</strong>.
              </p>
            </>
          ),
        },
      ],
      transfer: [
        {
          signal: "问 Redux vs Context",
          signalEn: "Asked about Redux vs Context",
          reachFor: "一个是传递方案一个是状态管理；Context 缺精细订阅、中间件、DevTools",
          reachForEn: "One is a way to pass data down, the other is state management; Context has no per-field subscriptions, no middleware and no DevTools",
        },
        {
          signal: "「context 一变全都重渲染」",
          signalEn: "One Context change re-renders everything",
          reachFor: "拆 Context，或换 selector 型状态库",
          reachForEn: "Split the Context into smaller ones, or move to a state library where each component selects the fields it reads",
        },
        {
          signal: "reducer 里想发请求",
          signalEn: "You want to send a request from inside a reducer",
          reachFor: "挪到中间件或 thunk，reducer 必须纯",
          reachForEn: "Move it into middleware or a thunk; a reducer has to be pure",
        },
        {
          signal: "问三大原则",
          signalEn: "Asked for the three principles",
          reachFor: "串起来讲：可序列化 → 可记录 → 可重放 = 时间旅行",
          reachForEn: "Tell them as one chain: state can be serialised, so changes can be recorded, so they can be replayed, which is time travel",
        },
        {
          signal: "问服务端数据怎么管",
          signalEn: "Asked how to manage data from the server",
          reachFor: "TanStack Query / SWR，别用 Redux 硬凑缓存",
          reachForEn: "TanStack Query or SWR; do not build a cache out of Redux",
        },
        {
          signal: "以为 TS 类型能校验接口数据",
          signalEn: "Expecting a TypeScript type to validate data from an API",
          reachFor: "运行时没有 TS，要用 zod",
          reachForEn: "No TypeScript is left at runtime, so validate with something like zod",
        },
      ],
      recap: [
        "Context 管传递，Redux 管状态管理；Context 缺精细订阅、中间件、DevTools 三样。",
        "Redux 单向环：dispatch → middleware → reducer → store → view；现在一律用 RTK 的 createSlice。",
        "三大原则串起来才是重点：单一数据源→可序列化，只读→可记录，纯 reducer→可重放。",
        "中间件签名 store => next => action，是专门给副作用留的位置；thunk 够用，saga 只在需要编排时值。",
        "TS 编译后运行时什么都不剩 —— 所以类型不能校验外部数据，as 只是「我保证」。",
        "静态检查最被低估的价值是重构有底气；但它只保证类型对不保证逻辑对，不能替代测试。",
      ],
      recapEn: [
        "Context passes data down, Redux manages state. Context is missing three things: per-field subscriptions, middleware, and DevTools.",
        "The one-way loop in Redux: dispatch, then middleware, then reducer, then store, then view. Today always write it with createSlice from RTK.",
        "The three principles matter as a chain: one source of truth means the state can be serialised, read-only state means changes can be recorded, pure reducers mean they can be replayed.",
        "Middleware has the signature store => next => action, and it is the place set aside for side effects. thunk is enough for most cases; saga is only worth it when you have to coordinate several steps.",
        "Nothing of TypeScript is left after compiling, so a type cannot validate data from outside, and as only means \"trust me\".",
        "The most underrated value of static checking is the confidence to refactor. But it only guarantees the types are right, not the logic, so it does not replace tests.",
      ],
    },
  ],
};
