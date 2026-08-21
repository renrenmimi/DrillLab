// 面试八股 —— JavaScript 上半：引擎与类型、函数与作用域。
//
// 题目来自作者做过的题目，答案由 DrillLab 撰写，代码块一律 demo()（「示意」）。

import type { Module } from "../types";
import { demo } from "../helpers";

export const ivJsCore: Module = {
  id: "iv-js-core",
  stage: "面试 · 第 2 部分",
  title: "JavaScript · 引擎、类型与函数",
  titleEn: "JavaScript · the engine, types and functions",
  summary:
    "22 道题。这一组是 JS 面试的地基：值怎么存、类型怎么转、变量怎么提升、闭包到底是什么。闭包、hoisting、== vs === 这三道几乎每场都问。",
  summaryEn:
    "22 questions. This group is the base of every JavaScript interview: how values are stored, how types convert, how variables are hoisted, and what a closure actually is. The questions on closure, hoisting, and == vs === come up in almost every interview.",
  lessons: [
    /* ============================================================
       引擎与类型（10 题）
       ============================================================ */
    {
      id: "iv-js-types",
      title: "引擎与类型十问",
      titleEn: "10 questions on the engine and types",
      blurb: "引擎、REPL、原始值 vs 引用值、类型转换、== vs ===、短路、var/let/const、传值传引用、Set、Map。",
      blurbEn:
        "The engine, REPL, primitive vs reference values, type conversion, == vs ===, short-circuiting, var/let/const, passing values and references, Set, Map.",
      minutes: 22,
      objectives: [
        "说清原始值和引用值在内存里的差别，并解释它怎么导致「改一个另一个也变」",
        "背出隐式转换的规则，并说明为什么 == 不该用",
        "分清 var / let / const 在作用域、提升、重复声明三个维度上的差别",
        "在 Set vs Array、Map vs Object 之间给出选型理由",
      ],
      objectivesEn: [
        "Explain how primitive values and reference values differ in memory, and why changing one variable can change another",
        "State the rules for implicit conversion, and say why you should not use ==",
        "Tell var / let / const apart on three points: scope, hoisting, and redeclaring",
        "Give a reason for choosing Set over Array, and Map over Object",
      ],
      whyForAssessment:
        "类型和内存这一组是所有「诡异行为」的根源：为什么 [] == false 是 true、为什么函数里改了对象外面也变、为什么循环里的 var 拿到的都是最后一个值。答不清这些，后面闭包和异步的题也会答不稳。",
      whyForAssessmentEn:
        "Types and memory are the source of every surprising result: why [] == false is true, why changing an object inside a function also changes it outside, and why a var in a loop ends up holding the last value. If you cannot answer these clearly, the closure and async questions later will not hold up either.",
      concepts: [
        {
          id: "q276",
          heading: "什么是 JavaScript 引擎",
          headingEn: "What is a JavaScript engine?",
          lede: "#276 What is the JavaScript engine",
          body: (
            <>
              <p>
                <strong>一句话：</strong>引擎是<strong>把 JS 源码变成机器能执行的东西</strong>
                的那个程序。Chrome / Node 用 V8，Firefox 用 SpiderMonkey，
                Safari 用 JavaScriptCore。
              </p>
              <p>
                <strong>大致流程：</strong>
                源码 → 解析成 AST → 生成字节码 →
                <strong>解释器先跑起来</strong>，
                同时监控哪段代码被反复执行（热点），
                把热点交给 <strong>JIT 编译器</strong>编译成机器码。
                这套「先解释、后即时编译」的做法让 JS 既能马上启动、
                又能在热点上接近原生速度。
              </p>
              <p>
                <strong>会追问：</strong>「引擎和运行时（runtime）什么区别？」
                —— 这是真考点。引擎<strong>只管执行 JS 语言本身</strong>，
                它<strong>不认识</strong> <code>setTimeout</code>、
                <code>fetch</code>、<code>document</code>、
                <code>fs</code>—— 这些都是宿主环境（浏览器 / Node）提供的 API。
                <br />
                所以「事件循环属于引擎吗？」答案是<strong>不属于</strong>，
                它是运行时的一部分（见 #305）。这个区分答对了很加分。
              </p>
              <p>
                <strong>还会追问内存：</strong>引擎管两块 ——
                <strong>调用栈</strong>（执行上下文、原始值）和
                <strong>堆</strong>（对象、数组、函数）。
                这正好对应下一题。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> the engine is the program that{" "}
                <strong>turns JS source into something the machine can run</strong>.
                Chrome and Node use V8, Firefox uses SpiderMonkey, Safari uses
                JavaScriptCore.
              </p>
              <p>
                <strong>Roughly the pipeline:</strong> source → parse into an AST →
                emit bytecode → <strong>the interpreter starts running it</strong>{" "}
                while watching which parts run over and over (the hot paths), and hands
                those to the <strong>JIT compiler</strong> to be turned into machine
                code. Interpret first, compile later — that is what lets JS start
                instantly and still hit near-native speed where it counts.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;What is the difference between the
                engine and the runtime?&rdquo; — this is the real question. The engine{" "}
                <strong>only executes the language itself</strong>. It{" "}
                <strong>knows nothing about</strong> <code>setTimeout</code>,{" "}
                <code>fetch</code>, <code>document</code> or <code>fs</code> — those are
                APIs the host environment (browser or Node) hands you.
                <br />
                So &ldquo;is the event loop part of the engine?&rdquo; —{" "}
                <strong>no</strong>, it belongs to the runtime (see #305). Getting this
                distinction right earns real credit.
              </p>
              <p>
                <strong>Another follow-up, on memory:</strong> the engine manages two
                areas — the <strong>call stack</strong> (execution contexts, primitive
                values) and the <strong>heap</strong> (objects, arrays, functions).
                Which lines up exactly with the next question.
              </p>
            </>
          ),
        },
        {
          id: "q277",
          heading: "什么是 REPL",
          headingEn: "What is a REPL?",
          lede: "#277 What is REPL",
          body: (
            <>
              <p>
                <strong>一句话：</strong>Read-Eval-Print-Loop ——
                读一行、求值、打印结果、再等下一行。
                终端里敲 <code>node</code> 回车进去的那个交互环境，
                以及浏览器 DevTools 的 Console，都是 REPL。
              </p>
              <p>
                <strong>用来干什么：</strong>
                验证一小段语法、试一个 API 的返回值、
                快速算个东西。<strong>不适合写多行逻辑</strong>——
                改一行要重敲一遍。
              </p>
              <p>
                <strong>会追问：</strong>
                「在 REPL 里 <code>let x = 1</code> 会打印什么？」——
                <code>undefined</code>。
                因为它打印的是<strong>表达式的值</strong>，
                而变量声明语句的值就是 <code>undefined</code>。
                这个小细节能看出你是不是真用过。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> Read-Eval-Print-Loop — read a line,
                evaluate it, print the result, wait for the next one. Typing{" "}
                <code>node</code> in a terminal drops you into one, and the DevTools
                Console in a browser is one too.
              </p>
              <p>
                <strong>What you use it for:</strong> checking a bit of syntax, seeing
                what an API returns, working out a quick number.{" "}
                <strong>Not for multi-line logic</strong> — changing one line means
                retyping the lot.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;What does <code>let x = 1</code>{" "}
                print in a REPL?&rdquo; — <code>undefined</code>. It prints the{" "}
                <strong>value of the expression</strong>, and the value of a variable
                declaration is <code>undefined</code>. A small detail, but it shows
                whether you have actually used one.
              </p>
            </>
          ),
        },
        {
          id: "q278",
          heading: "原始值 vs 引用值",
          headingEn: "Primitive values vs reference values",
          lede: "#278 Primitive data types vs Reference data types",
          body: (
            <>
              <p>
                <strong>一句话：</strong>原始值<strong>存在栈上、直接存值</strong>；
                引用值<strong>存在堆上、栈上只存一个地址</strong>。
              </p>
              <p>
                <strong>七种原始类型</strong>（背下来，会让你数）：
                <code>string</code>、<code>number</code>、
                <code>boolean</code>、<code>undefined</code>、
                <code>null</code>、<code>symbol</code>、
                <code>bigint</code>。
                <br />
                <strong>其余全是引用类型</strong>：
                对象、数组、函数、<code>Date</code>、
                <code>Map</code>、<code>Set</code>、正则……
                （数组和函数本质都是对象）。
              </p>
              <p>
                <strong>三个可观察的差别：</strong>
              </p>
              <ul>
                <li>
                  <strong>不可变性</strong>—— 原始值本身改不了。
                  <code>{'s.toUpperCase()'}</code>
                  是<strong>返回新字符串</strong>，原来那个没动。
                </li>
                <li>
                  <strong>比较</strong>—— 原始值比<strong>值</strong>，
                  引用值比<strong>地址</strong>。所以
                  <code>{"{} === {}"}</code> 是 <code>false</code>，
                  <code>{"[1] === [1]"}</code> 也是 <code>false</code>。
                </li>
                <li>
                  <strong>赋值</strong>—— 原始值复制一份；
                  引用值只复制地址，<strong>两个变量指向同一个对象</strong>。
                  这就是 #284。
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「<code>typeof null</code> 是什么？」——
                <code>{'"object"'}</code>，这是个<strong>沿用了 30 年的 bug</strong>，
                因为兼容性一直没修。判断 null 要用
                <code>x === null</code>。
                <br />
                「怎么可靠地判断数组？」——
                <code>Array.isArray(x)</code>，
                别用 <code>typeof</code>（会得到 <code>{'"object"'}</code>）。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> a primitive{" "}
                <strong>sits on the stack and holds the value itself</strong>; a
                reference value{" "}
                <strong>sits on the heap, and the stack holds only an address</strong>.
              </p>
              <p>
                <strong>Seven primitive types</strong> (learn the list — they will make
                you count them): <code>string</code>, <code>number</code>,{" "}
                <code>boolean</code>, <code>undefined</code>, <code>null</code>,{" "}
                <code>symbol</code>, <code>bigint</code>.
                <br />
                <strong>Everything else is a reference type</strong>: objects, arrays,
                functions, <code>Date</code>, <code>Map</code>, <code>Set</code>,
                regexes… (arrays and functions are objects underneath).
              </p>
              <p>
                <strong>Three differences you can observe:</strong>
              </p>
              <ul>
                <li>
                  <strong>Immutability</strong> — a primitive value cannot be changed.
                  <code>{'s.toUpperCase()'}</code>{" "}
                  <strong>returns a new string</strong>; the original never moved.
                </li>
                <li>
                  <strong>Comparison</strong> — primitives compare by{" "}
                  <strong>value</strong>, references compare by{" "}
                  <strong>address</strong>. So <code>{"{} === {}"}</code> is{" "}
                  <code>false</code>, and so is <code>{"[1] === [1]"}</code>.
                </li>
                <li>
                  <strong>Assignment</strong> — a primitive gets copied; a reference
                  copies only the address, so{" "}
                  <strong>two variables point at the same object</strong>. That is #284.
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;What is <code>typeof null</code>?
                &rdquo; — <code>{'"object"'}</code>, a{" "}
                <strong>bug that has survived 30 years</strong> because fixing it would
                break too much. Test for null with <code>x === null</code>.
                <br />
                &ldquo;How do you reliably detect an array?&rdquo; —{" "}
                <code>Array.isArray(x)</code>. Never <code>typeof</code>, which just
                says <code>{'"object"'}</code>.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `// 原始值：复制值
let a = 1;
let b = a;
b = 2;
console.log(a);        // 1 —— a 没变

// 引用值：复制地址
let o1 = { n: 1 };
let o2 = o1;           // 同一个对象的第二个遥控器
o2.n = 2;
console.log(o1.n);     // 2 ← 变了！

// 比较
console.log({} === {});          // false（两个不同的地址）
console.log("a" === "a");        // true （比的是值）
console.log(typeof null);        // "object" ← 历史 bug
console.log(Array.isArray([]));  // true  ← 判断数组要用这个`,
              {
                filename: "值和地址",
                filenameEn: "Values and addresses",
                codeEn: `// Primitive value: the value is copied
let a = 1;
let b = a;
b = 2;
console.log(a);        // 1 —— a did not change

// Reference value: the address is copied
let o1 = { n: 1 };
let o2 = o1;           // a second remote control for the same object
o2.n = 2;
console.log(o1.n);     // 2 ← it changed!

// Comparing
console.log({} === {});          // false (two different addresses)
console.log("a" === "a");        // true  (the values are compared)
console.log(typeof null);        // "object" ← a historical bug
console.log(Array.isArray([]));  // true  ← use this to test for an array`,
              },
            ),
          ],
        },
        {
          id: "q279",
          heading: "隐式转换 vs 显式转换",
          headingEn: "Type coercion vs type conversion",
          lede: "#279 Type coercion vs Type conversion（题库里 #386 是同一题）",
          ledeEn: "#279 Type coercion vs Type conversion (#386 in the question bank is the same question)",
          body: (
            <>
              <p>
                <strong>一句话：</strong>
                <strong>转换（conversion / casting）是你主动写的</strong>，
                <strong>强制转换（coercion）是引擎背着你干的</strong>。
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>谁发起</th>
                      <th>例子</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>显式（conversion）</td>
                      <td>你</td>
                      <td>
                        <code>Number(&quot;42&quot;)</code>、
                        <code>String(42)</code>、
                        <code>Boolean(0)</code>、
                        <code>parseInt(&quot;42px&quot;)</code>
                      </td>
                    </tr>
                    <tr>
                      <td>隐式（coercion）</td>
                      <td>引擎</td>
                      <td>
                        <code>&quot;5&quot; * 2</code>、
                        <code>1 + &quot;1&quot;</code>、
                        <code>if (arr.length)</code>、
                        <code>[] == false</code>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>隐式转换的两条核心规则</strong>（记住这两条，
                大部分怪题就能推出来）：
              </p>
              <ul>
                <li>
                  <strong><code>+</code> 只要有一边是字符串，就变成拼接</strong>；
                  其他算术运算符（<code>-</code>、<code>*</code>、
                  <code>/</code>）一律转成数字。
                  所以 <code>1 + &quot;1&quot; === &quot;11&quot;</code>
                  而 <code>&quot;3&quot; - 1 === 2</code>。
                </li>
                <li>
                  <strong>对象参与运算时先 <code>valueOf()</code>
                  再 <code>toString()</code></strong>。
                  数组的 <code>toString()</code> 是元素 join 逗号，
                  所以 <code>[] + []</code> 得到空字符串，
                  <code>{"[] + {}"}</code> 得到
                  <code>&quot;[object Object]&quot;</code>。
                </li>
              </ul>
              <p>
                <strong>六个假值背下来</strong>（其余全是真）：
                <code>false</code>、<code>0</code>、
                <code>&quot;&quot;</code>、<code>null</code>、
                <code>undefined</code>、<code>NaN</code>。
                <br />
                <strong>注意 <code>[]</code> 和 <code>{"{}"}</code> 都是真值</strong>——
                所以判断数组空不空要看 <code>arr.length</code>。
              </p>
              <p>
                <strong>会追问：</strong>
                「<code>parseInt</code> 和 <code>Number</code> 什么区别？」——
                <code>parseInt(&quot;42px&quot;)</code> 得 <code>42</code>
                （从头读到读不动为止），
                <code>Number(&quot;42px&quot;)</code> 得 <code>NaN</code>
                （整体不合法就失败）。
                所以校验用户输入该用 <code>Number</code>，
                <code>parseInt</code> 会把脏数据悄悄放过去。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong>{" "}
                <strong>conversion (casting) is what you write on purpose</strong>;{" "}
                <strong>coercion is the engine doing it behind your back</strong>.
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Who starts it</th>
                      <th>Examples</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Explicit (conversion)</td>
                      <td>You</td>
                      <td>
                        <code>Number(&quot;42&quot;)</code>,{" "}
                        <code>String(42)</code>,{" "}
                        <code>Boolean(0)</code>,{" "}
                        <code>parseInt(&quot;42px&quot;)</code>
                      </td>
                    </tr>
                    <tr>
                      <td>Implicit (coercion)</td>
                      <td>The engine</td>
                      <td>
                        <code>&quot;5&quot; * 2</code>,{" "}
                        <code>1 + &quot;1&quot;</code>,{" "}
                        <code>if (arr.length)</code>,{" "}
                        <code>[] == false</code>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>Two rules cover almost all coercion</strong> — hold on to these
                and you can derive most of the trick questions:
              </p>
              <ul>
                <li>
                  <strong>
                    <code>+</code> becomes concatenation the moment one side is a string
                  </strong>
                  ; every other arithmetic operator (<code>-</code>, <code>*</code>,{" "}
                  <code>/</code>) converts to number. Hence{" "}
                  <code>1 + &quot;1&quot; === &quot;11&quot;</code> but{" "}
                  <code>&quot;3&quot; - 1 === 2</code>.
                </li>
                <li>
                  <strong>
                    An object in an operation goes through <code>valueOf()</code> first,
                    then <code>toString()</code>
                  </strong>
                  . An array&rsquo;s <code>toString()</code> joins its elements with
                  commas, so <code>{"[] + []"}</code> gives an empty string and{" "}
                  <code>{"[] + {}"}</code> gives{" "}
                  <code>&quot;[object Object]&quot;</code>.
                </li>
              </ul>
              <p>
                <strong>Memorise the six falsy values</strong> (everything else is
                truthy): <code>false</code>, <code>0</code>,{" "}
                <code>&quot;&quot;</code>, <code>null</code>, <code>undefined</code>,{" "}
                <code>NaN</code>.
                <br />
                <strong>
                  Watch out — <code>[]</code> and <code>{"{}"}</code> are both truthy
                </strong>
                , so check <code>arr.length</code> to tell whether an array is empty.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;What is the difference between{" "}
                <code>parseInt</code> and <code>Number</code>?&rdquo; —{" "}
                <code>parseInt(&quot;42px&quot;)</code> gives <code>42</code> (it reads
                from the front until it cannot go on), while{" "}
                <code>Number(&quot;42px&quot;)</code> gives <code>NaN</code> (the whole
                string has to be valid). So validate user input with{" "}
                <code>Number</code>; <code>parseInt</code> waves dirty data straight
                through.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `1 + "1"          // "11"    + 有字符串 -> 拼接
"3" - 1          // 2       - 一律转数字
"3" * "4"        // 12
1 + true         // 2       true -> 1
1 + null         // 1       null -> 0
1 + undefined    // NaN     undefined -> NaN

[] + []          // ""      两个空数组 toString 都是 ""
[] + {}          // "[object Object]"
[1,2] + [3]      // "1,23"  join 逗号再拼

Number("42px")   // NaN     整体不合法
parseInt("42px") // 42      读到读不动为止
Number("")       // 0   ← 注意，空字符串转数字是 0
Number(" ")      // 0   ← 空白也是 0，校验输入要小心`,
              {
                filename: "隐式转换速查",
                filenameEn: "Coercion quick reference",
                codeEn: `1 + "1"          // "11"    + with a string means concatenate
"3" - 1          // 2       - always converts to number
"3" * "4"        // 12
1 + true         // 2       true -> 1
1 + null         // 1       null -> 0
1 + undefined    // NaN     undefined -> NaN

[] + []          // ""      toString of an empty array is ""
[] + {}          // "[object Object]"
[1,2] + [3]      // "1,23"  join with commas, then concatenate

Number("42px")   // NaN     the whole string has to be valid
parseInt("42px") // 42      reads until it cannot read further
Number("")       // 0   ← note: an empty string converts to 0
Number(" ")      // 0   ← whitespace is 0 too, so validate input carefully`,
                explanation:
                  "面试不会让你背全表，但会给两三个式子让你推。掌握「+ 看字符串、其他看数字」和「六个假值」就够推。",
                explanationEn:
                  "An interview will not ask you to recite the whole table, but it will give you two or three expressions to work out. Remember that + looks for a string while every other operator converts to number, plus the six falsy values, and that is enough.",
              },
            ),
          ],
        },
        {
          id: "q280",
          heading: "== 和 === 的区别",
          headingEn: "What is the difference between == and ===?",
          lede: "#280 What is the difference between == and ===",
          body: (
            <>
              <p>
                <strong>一句话：</strong><code>===</code>
                <strong>类型不同直接 false</strong>；
                <code>==</code> 会<strong>先把两边转成同一类型再比</strong>。
              </p>
              <p>
                <code>==</code> 的转换规则很绕，但实际只要记住四条：
              </p>
              <ul>
                <li>
                  <code>null == undefined</code> 是
                  <strong><code>true</code></strong>，
                  但它们和其他任何值都不 <code>==</code>
                  （包括 <code>0</code> 和 <code>&quot;&quot;</code>）。
                </li>
                <li>
                  <strong>数字和字符串比 → 字符串转数字。</strong>
                </li>
                <li>
                  <strong>布尔参与 → 布尔先转数字</strong>
                  （<code>true</code>→1，<code>false</code>→0）。
                  这就是 <code>[] == false</code> 为 <code>true</code> 的原因：
                  <code>[]</code>→<code>&quot;&quot;</code>→<code>0</code>，
                  <code>false</code>→<code>0</code>。
                </li>
                <li>
                  <strong>对象和原始值比 → 对象先转原始值。</strong>
                </li>
              </ul>
              <p>
                <strong>结论：一律用 <code>===</code>。</strong>
                唯一被普遍接受的 <code>==</code> 用法是
                <code>x == null</code>—— 一次同时判掉
                <code>null</code> 和 <code>undefined</code>。
              </p>
              <p>
                <strong>会追问：</strong>「<code>NaN === NaN</code>？」——
                <code>false</code>，<code>NaN</code>
                <strong>和自己都不相等</strong>。
                判断要用 <code>Number.isNaN(x)</code>
                （别用全局 <code>isNaN</code>，它会先做隐式转换，
                <code>isNaN(&quot;abc&quot;)</code> 是 <code>true</code>）。
                <br />
                「有没有更严格的比较？」——
                <code>Object.is(x, y)</code>。它和 <code>===</code>
                只有两处不同：
                <code>Object.is(NaN, NaN)</code> 是 <code>true</code>，
                <code>Object.is(0, -0)</code> 是 <code>false</code>。
                <strong>React 判断 state 变没变用的就是它。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> <code>===</code>{" "}
                <strong>returns false straight away when the types differ</strong>;{" "}
                <code>==</code>{" "}
                <strong>converts both sides to one type first, then compares</strong>.
              </p>
              <p>
                The <code>==</code> conversion rules are convoluted, but four points
                cover practice:
              </p>
              <ul>
                <li>
                  <code>null == undefined</code> is{" "}
                  <strong>
                    <code>true</code>
                  </strong>
                  , and neither one is <code>==</code> to anything else (not{" "}
                  <code>0</code>, not <code>&quot;&quot;</code>).
                </li>
                <li>
                  <strong>Number against string → the string becomes a number.</strong>
                </li>
                <li>
                  <strong>A boolean involved → the boolean becomes a number</strong>{" "}
                  (<code>true</code>→1, <code>false</code>→0). That is why{" "}
                  <code>[] == false</code> is <code>true</code>: <code>[]</code>→
                  <code>&quot;&quot;</code>→<code>0</code>, and <code>false</code>→
                  <code>0</code>.
                </li>
                <li>
                  <strong>Object against primitive → the object becomes a primitive.</strong>
                </li>
              </ul>
              <p>
                <strong>
                  The conclusion: use <code>===</code> everywhere.
                </strong>{" "}
                The one <code>==</code> that everybody accepts is{" "}
                <code>x == null</code> — it rules out <code>null</code> and{" "}
                <code>undefined</code> in a single check.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;<code>NaN === NaN</code>?&rdquo; —{" "}
                <code>false</code>. <code>NaN</code>{" "}
                <strong>is not even equal to itself</strong>. Test it with{" "}
                <code>Number.isNaN(x)</code> — not the global <code>isNaN</code>, which
                coerces first, so <code>isNaN(&quot;abc&quot;)</code> is{" "}
                <code>true</code>.
                <br />
                &ldquo;Is there anything stricter?&rdquo; —{" "}
                <code>Object.is(x, y)</code>. It differs from <code>===</code> in
                exactly two places: <code>Object.is(NaN, NaN)</code> is{" "}
                <code>true</code>, and <code>Object.is(0, -0)</code> is{" "}
                <code>false</code>.{" "}
                <strong>This is what React uses to decide whether state changed.</strong>
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `0 == "0"          // true   字符串转数字
0 == ""           // true   "" -> 0
0 == false        // true   false -> 0
null == undefined // true   特例
null == 0         // false  null 只和 undefined 相等
[] == false       // true   [] -> "" -> 0
NaN == NaN        // false  和自己都不相等

0 === "0"         // false  类型不同，到此为止
Object.is(NaN, NaN) // true  ← React 用它判断 state 变没变`,
              {
                filename: "为什么别用 ==",
                filenameEn: "Why you should not use ==",
                codeEn: `0 == "0"          // true   the string converts to a number
0 == ""           // true   "" -> 0
0 == false        // true   false -> 0
null == undefined // true   a special case
null == 0         // false  null only equals undefined
[] == false       // true   [] -> "" -> 0
NaN == NaN        // false  not even equal to itself

0 === "0"         // false  different types, so it stops there
Object.is(NaN, NaN) // true  ← React uses this to decide whether state changed`,
              },
            ),
          ],
        },
        {
          id: "q281",
          heading: "什么是短路求值",
          headingEn: "What is short-circuit evaluation?",
          lede: "#281 What is short-circuit evaluation",
          body: (
            <>
              <p>
                <strong>一句话：</strong>
                <code>&amp;&amp;</code> 和 <code>||</code>
                <strong>结果一旦确定就不再算右边</strong>，
                而且它们<strong>返回的是操作数本身，不是布尔值</strong>。
              </p>
              <ul>
                <li>
                  <code>a &amp;&amp; b</code>——
                  a 为假就返回 a，否则返回 b。「都真才真」，
                  所以遇到假就可以收工。
                </li>
                <li>
                  <code>a || b</code>——
                  a 为真就返回 a，否则返回 b。
                </li>
                <li>
                  <code>a ?? b</code>（空值合并）——
                  <strong>只有 a 是 <code>null</code> 或
                  <code>undefined</code> 时</strong>才返回 b。
                </li>
              </ul>
              <p>
                <strong><code>||</code> 和 <code>??</code>
                的区别是高频追问</strong>，而且是真实 bug 来源：
                <code>count || 10</code> 在 <code>count</code> 为
                <code>0</code> 时会给出 <code>10</code>——
                因为 <code>0</code> 是假值。
                <strong>要默认值就用 <code>??</code></strong>。
              </p>
              <p>
                <strong>React 里最常见的用法</strong>是条件渲染：
                <code>{"{loading && <Spinner />}"}</code>。
                <strong>坑在这儿</strong>：如果左边是
                <code>list.length</code> 而列表为空，
                <code>0 &amp;&amp; …</code> 返回 <code>0</code>，
                而 React <strong>会把 <code>0</code> 渲染出来</strong>——
                页面上凭空多一个「0」。
                所以要写成 <code>list.length &gt; 0 &amp;&amp; …</code>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> <code>&amp;&amp;</code> and{" "}
                <code>||</code>{" "}
                <strong>stop evaluating the moment the result is decided</strong>, and{" "}
                <strong>they hand back an operand, not a boolean</strong>.
              </p>
              <ul>
                <li>
                  <code>a &amp;&amp; b</code> — returns a if a is falsy, otherwise b.
                  &ldquo;Both must be true&rdquo;, so one falsy value ends the job.
                </li>
                <li>
                  <code>a || b</code> — returns a if a is truthy, otherwise b.
                </li>
                <li>
                  <code>a ?? b</code> (nullish coalescing) — returns b{" "}
                  <strong>
                    only when a is <code>null</code> or <code>undefined</code>
                  </strong>
                  .
                </li>
              </ul>
              <p>
                <strong>
                  The difference between <code>||</code> and <code>??</code> is a
                  frequent follow-up
                </strong>{" "}
                and a real source of bugs: <code>count || 10</code> gives you{" "}
                <code>10</code> when <code>count</code> is <code>0</code>, because{" "}
                <code>0</code> is falsy.{" "}
                <strong>
                  For default values, reach for <code>??</code>
                </strong>
                .
              </p>
              <p>
                <strong>The most common React use</strong> is conditional rendering:{" "}
                <code>{"{loading && <Spinner />}"}</code>.{" "}
                <strong>Here is the trap</strong>: if the left side is{" "}
                <code>list.length</code> and the list is empty, then{" "}
                <code>0 &amp;&amp; …</code> returns <code>0</code>, and React{" "}
                <strong>
                  renders that <code>0</code>
                </strong>{" "}
                — a stray &ldquo;0&rdquo; shows up on the page out of nowhere. Write{" "}
                <code>list.length &gt; 0 &amp;&amp; …</code> instead.
              </p>
            </>
          ),
          code: [
            demo(
              "jsx",
              `// 短路返回的是操作数本身
console.log(1 && 2);        // 2
console.log(0 && 2);        // 0    ← 不是 false
console.log("" || "默认");   // "默认"

// || 和 ?? 的区别
const count = 0;
count || 10                 // 10  ✗ 0 被当成「没传」
count ?? 10                 // 0   ✓

// React 条件渲染的经典坑
{list.length && <List />}       // ✗ 空列表时页面上多一个 0
{list.length > 0 && <List />}   // ✓
{list.length ? <List /> : null} // ✓ 也可以`,
              {
                filename: "短路的三个实际用法与两个坑",
                filenameEn: "Three real uses of short-circuiting, and two traps",
                codeEn: `// Short-circuiting returns the operand itself
console.log(1 && 2);          // 2
console.log(0 && 2);          // 0    ← not false
console.log("" || "default"); // "default"

// The difference between || and ??
const count = 0;
count || 10                 // 10  ✗ 0 is treated as "nothing was passed"
count ?? 10                 // 0   ✓

// The classic React conditional-rendering trap
{list.length && <List />}       // ✗ an empty list prints a stray 0 on the page
{list.length > 0 && <List />}   // ✓
{list.length ? <List /> : null} // ✓ this works too`,
              },
            ),
          ],
        },
        {
          id: "q282",
          heading: "var、let、const 的区别",
          headingEn: "What is the difference between var, let and const?",
          lede: "#282 What is the difference between var, let and const",
          body: (
            <>
              <p>
                <strong>一句话：</strong>
                <code>var</code> 是函数作用域、会提升成
                <code>undefined</code>、能重复声明；
                <code>let</code> / <code>const</code> 是块作用域、
                有 TDZ、不能重复声明；
                <code>const</code> 还不能重新赋值。
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th><code>var</code></th>
                      <th><code>let</code></th>
                      <th><code>const</code></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>作用域</td>
                      <td>函数</td>
                      <td>块 <code>{"{}"}</code></td>
                      <td>块</td>
                    </tr>
                    <tr>
                      <td>声明前访问</td>
                      <td><code>undefined</code></td>
                      <td>报 <code>ReferenceError</code></td>
                      <td>报 <code>ReferenceError</code></td>
                    </tr>
                    <tr>
                      <td>重复声明</td>
                      <td>可以</td>
                      <td>不行</td>
                      <td>不行</td>
                    </tr>
                    <tr>
                      <td>重新赋值</td>
                      <td>可以</td>
                      <td>可以</td>
                      <td><strong>不行</strong></td>
                    </tr>
                    <tr>
                      <td>挂到 <code>window</code></td>
                      <td>顶层会挂</td>
                      <td>不挂</td>
                      <td>不挂</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>TDZ（暂时性死区）</strong>是
                <code>let</code> / <code>const</code>
                「从块开始到声明那一行」之间的区域。
                变量确实被提升了，
                <strong>但被标记为「还不能用」</strong>，
                所以访问会抛错而不是给 <code>undefined</code>。
                这是刻意设计的 —— 让错误早暴露。
              </p>
              <p>
                <strong>会追问：</strong>
                「<code>const</code> 的对象能改属性吗？」——
                <strong>能</strong>。<code>const</code> 锁的是
                <strong>绑定</strong>（这个名字不能再指向别的东西），
                不是<strong>值</strong>。
                想冻结内容用 <code>Object.freeze()</code>。
              </p>
              <p>
                <strong>还会追问循环那道经典题</strong>——
                <code>for (var i…)</code> 配
                <code>setTimeout</code> 会打出三个 3，
                <code>let</code> 会打出 0 1 2。
                因为 <code>let</code>
                <strong>每次迭代都创建一个新的绑定</strong>，
                而 <code>var</code> 全程只有一个 <code>i</code>。
                这题和闭包（#298）连着考。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> <code>var</code> is function-scoped,
                hoists to <code>undefined</code> and can be redeclared;{" "}
                <code>let</code> / <code>const</code> are block-scoped, have a TDZ and
                cannot be redeclared; <code>const</code> on top of that cannot be
                reassigned.
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th><code>var</code></th>
                      <th><code>let</code></th>
                      <th><code>const</code></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Scope</td>
                      <td>Function</td>
                      <td>Block <code>{"{}"}</code></td>
                      <td>Block</td>
                    </tr>
                    <tr>
                      <td>Read before the declaration</td>
                      <td><code>undefined</code></td>
                      <td>throws <code>ReferenceError</code></td>
                      <td>throws <code>ReferenceError</code></td>
                    </tr>
                    <tr>
                      <td>Redeclare</td>
                      <td>Allowed</td>
                      <td>No</td>
                      <td>No</td>
                    </tr>
                    <tr>
                      <td>Reassign</td>
                      <td>Allowed</td>
                      <td>Allowed</td>
                      <td><strong>No</strong></td>
                    </tr>
                    <tr>
                      <td>Lands on <code>window</code></td>
                      <td>Yes at top level</td>
                      <td>No</td>
                      <td>No</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>The TDZ (temporal dead zone)</strong> is the stretch between the
                start of the block and the <code>let</code> / <code>const</code> line
                itself. The variable really is hoisted,{" "}
                <strong>but flagged as &ldquo;not usable yet&rdquo;</strong>, so reading
                it throws instead of handing you <code>undefined</code>. That is
                deliberate — it makes mistakes surface early.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Can you change the properties of a{" "}
                <code>const</code> object?&rdquo; — <strong>yes</strong>.{" "}
                <code>const</code> locks the <strong>binding</strong> (the name cannot
                point at anything else), not the <strong>value</strong>. To freeze the
                contents, use <code>Object.freeze()</code>.
              </p>
              <p>
                <strong>Another follow-up — the classic loop question:</strong>{" "}
                <code>for (var i…)</code> with <code>setTimeout</code> prints three 3s;{" "}
                <code>let</code> prints 0 1 2. Because <code>let</code>{" "}
                <strong>creates a fresh binding on every iteration</strong>, while{" "}
                <code>var</code> has one single <code>i</code> the whole way through.
                This gets asked together with closures (#298).
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `// 经典循环题
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i));
// 3 3 3 —— 只有一个 i，回调跑的时候它已经是 3

for (let j = 0; j < 3; j++) setTimeout(() => console.log(j));
// 0 1 2 —— 每次迭代一个新的 j

// TDZ
console.log(a);   // undefined      var 提升成 undefined
var a = 1;

console.log(b);   // ReferenceError: Cannot access 'b' before initialization
let b = 1;

// const 锁绑定，不锁内容
const o = { n: 1 };
o.n = 2;          // ✓ 可以
o = { n: 3 };     // ✗ TypeError: Assignment to constant variable`,
              {
                filename: "三个必背的例子",
                filenameEn: "Three examples worth memorising",
                codeEn: `// The classic loop question
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i));
// 3 3 3 —— there is only one i, and by the time the callbacks run it is 3

for (let j = 0; j < 3; j++) setTimeout(() => console.log(j));
// 0 1 2 —— every iteration gets a new j

// TDZ
console.log(a);   // undefined      var is hoisted as undefined
var a = 1;

console.log(b);   // ReferenceError: Cannot access 'b' before initialization
let b = 1;

// const locks the binding, not the contents
const o = { n: 1 };
o.n = 2;          // ✓ allowed
o = { n: 3 };     // ✗ TypeError: Assignment to constant variable`,
              },
            ),
          ],
        },
        {
          id: "q284",
          heading: "传值 vs 传引用",
          headingEn: "Pass by value vs pass by reference",
          lede: "#284 Pass by Value vs Pass by Reference",
          body: (
            <>
              <p>
                <strong>一句话（这句要说准）：</strong>
                JavaScript <strong>永远是按值传递</strong>——
                只是当值是对象时，<strong>传的那个「值」是一个地址</strong>。
                严格说叫 <strong>pass by sharing</strong>。
              </p>
              <p>
                为什么这个说法重要？因为它一句话解释了两个看似矛盾的现象：
              </p>
              <ul>
                <li>
                  函数里 <code>obj.n = 2</code>
                  <strong>外面会变</strong>—— 因为两个变量指着同一个对象。
                </li>
                <li>
                  函数里 <code>obj = {"{ n: 2 }"}</code>
                  <strong>外面不变</strong>—— 因为你只是让
                  <strong>函数内部那个参数变量</strong>指向了新对象，
                  外面的变量还指着旧的。
                </li>
              </ul>
              <p>
                如果真是「传引用」，第二种情况外面也会变。所以是传值。
              </p>
              <p>
                <strong>会追问：</strong>「怎么避免改到外面？」——
                先复制。<code>{"{ ...obj }"}</code> /
                <code>arr.slice()</code> 是<strong>浅拷贝</strong>
                （只复制一层，嵌套对象还是共享）；
                深拷贝用 <code>structuredClone(obj)</code>
                （现代浏览器和 Node 17+ 原生支持，
                比 <code>JSON.parse(JSON.stringify())</code> 强 ——
                后者会丢掉 <code>undefined</code>、函数、
                <code>Date</code> 会变字符串、还处理不了循环引用）。
              </p>
              <p>
                <strong>这题和 React 直接相关：</strong>
                React 判断 state 变没变是比引用，
                所以「改了对象属性但界面不动」就是这个原理 ——
                必须造新对象。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line — get this sentence exactly right:</strong>{" "}
                JavaScript is <strong>always pass by value</strong>. It is just that when
                the value happens to be an object,{" "}
                <strong>the &ldquo;value&rdquo; being passed is an address</strong>. The
                precise name for this is <strong>pass by sharing</strong>.
              </p>
              <p>
                Why does the wording matter? Because it explains two things that look
                like a contradiction:
              </p>
              <ul>
                <li>
                  <code>obj.n = 2</code> inside the function{" "}
                  <strong>does show up outside</strong> — both variables point at the
                  same object.
                </li>
                <li>
                  <code>obj = {"{ n: 2 }"}</code> inside the function{" "}
                  <strong>does not show up outside</strong> — all you did was point{" "}
                  <strong>the parameter variable inside the function</strong> at a new
                  object; the outer variable still points at the old one.
                </li>
              </ul>
              <p>
                If this really were pass by reference, the second case would change the
                outside too. So it is pass by value.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;How do you avoid mutating the
                caller&rsquo;s data?&rdquo; — copy it first. <code>{"{ ...obj }"}</code>{" "}
                and <code>arr.slice()</code> are <strong>shallow copies</strong> (one
                level only; nested objects are still shared). For a deep copy use{" "}
                <code>structuredClone(obj)</code> — native in modern browsers and Node
                17+, and better than <code>JSON.parse(JSON.stringify())</code>, which
                drops <code>undefined</code> and functions, turns <code>Date</code> into
                a string, and cannot handle circular references at all.
              </p>
              <p>
                <strong>This one ties straight into React:</strong> React compares
                references to decide whether state changed, which is exactly why
                &ldquo;I changed a property and the UI did not move&rdquo; happens — you
                have to build a new object.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `function mutate(o) { o.n = 2; }      // 改属性
function reassign(o) { o = { n: 3 }; } // 换指向

const obj = { n: 1 };
mutate(obj);    console.log(obj.n);  // 2 ← 外面变了
reassign(obj);  console.log(obj.n);  // 2 ← 外面没变（不是 3）

// 浅拷贝只管一层
const a = { x: 1, inner: { y: 2 } };
const b = { ...a };
b.x = 9;          console.log(a.x);        // 1  ✓ 独立
b.inner.y = 9;    console.log(a.inner.y);  // 9  ✗ 还是共享的

const c = structuredClone(a);   // 深拷贝，嵌套也独立`,
              {
                filename: "改属性 vs 换指向",
                filenameEn: "Changing a property vs pointing somewhere else",
                codeEn: `function mutate(o) { o.n = 2; }      // change a property
function reassign(o) { o = { n: 3 }; } // point at something else

const obj = { n: 1 };
mutate(obj);    console.log(obj.n);  // 2 ← the outside changed
reassign(obj);  console.log(obj.n);  // 2 ← the outside did not change (not 3)

// A shallow copy only covers one level
const a = { x: 1, inner: { y: 2 } };
const b = { ...a };
b.x = 9;          console.log(a.x);        // 1  ✓ independent
b.inner.y = 9;    console.log(a.inner.y);  // 9  ✗ still shared

const c = structuredClone(a);   // a deep copy, so nested objects are separate too`,
              },
            ),
          ],
        },
        {
          id: "q286",
          heading: "Set vs Array",
          lede: "#286 Set vs Array",
          body: (
            <>
              <p>
                <strong>一句话：</strong><code>Set</code>
                <strong>元素唯一、查找是 O(1)、没有下标</strong>；
                数组允许重复、有顺序和下标、
                <code>includes</code> 是 O(n)。
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th><code>Array</code></th>
                      <th><code>Set</code></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>重复元素</td>
                      <td>允许</td>
                      <td>自动去重</td>
                    </tr>
                    <tr>
                      <td>查「在不在」</td>
                      <td><code>includes</code> O(n)</td>
                      <td><code>has</code> <strong>O(1)</strong></td>
                    </tr>
                    <tr>
                      <td>下标访问</td>
                      <td><code>arr[0]</code></td>
                      <td>没有</td>
                    </tr>
                    <tr>
                      <td>取长度</td>
                      <td><code>length</code></td>
                      <td><code>size</code></td>
                    </tr>
                    <tr>
                      <td><code>map</code> / <code>filter</code></td>
                      <td>有</td>
                      <td><strong>没有</strong>，要先转数组</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>什么时候用 Set：</strong>
                去重、以及<strong>在循环里反复判断「见过没有」</strong>——
                后者是性能差别最大的场景，
                数组的 <code>includes</code> 会让复杂度从 O(n) 变 O(n²)。
              </p>
              <p>
                <strong>会追问：</strong>「Set 去重能去掉重复的对象吗？」——
                <strong>不能</strong>。Set 用的是
                <code>SameValueZero</code>（≈<code>===</code>），
                两个内容一样的对象是不同的引用。
                要按内容去重得自己用
                <code>Map</code> 按某个 key 存。
                <br />
                「<code>NaN</code> 呢？」—— Set 里
                <code>NaN</code> 只会存一个，
                这是 <code>SameValueZero</code>
                和 <code>===</code> 唯一的差别。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> a <code>Set</code>{" "}
                <strong>holds unique elements, checks membership in O(1), and has no
                indices</strong>; an array allows duplicates, has order and indices, and
                its <code>includes</code> is O(n).
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th><code>Array</code></th>
                      <th><code>Set</code></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Duplicates</td>
                      <td>Allowed</td>
                      <td>Dropped automatically</td>
                    </tr>
                    <tr>
                      <td>&ldquo;Is it in there?&rdquo;</td>
                      <td><code>includes</code> O(n)</td>
                      <td><code>has</code> <strong>O(1)</strong></td>
                    </tr>
                    <tr>
                      <td>Index access</td>
                      <td><code>arr[0]</code></td>
                      <td>None</td>
                    </tr>
                    <tr>
                      <td>Length</td>
                      <td><code>length</code></td>
                      <td><code>size</code></td>
                    </tr>
                    <tr>
                      <td><code>map</code> / <code>filter</code></td>
                      <td>Yes</td>
                      <td><strong>No</strong> — convert to an array first</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>When to use a Set:</strong> deduping, and{" "}
                <strong>
                  answering &ldquo;have I seen this before?&rdquo; inside a loop
                </strong>{" "}
                — the second is where the performance gap is biggest, because an array{" "}
                <code>includes</code> turns O(n) into O(n²).
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Can a Set dedupe identical
                objects?&rdquo; — <strong>no</strong>. A Set uses{" "}
                <code>SameValueZero</code> (≈<code>===</code>), and two objects with the
                same contents are still two different references. To dedupe by content,
                key them yourself in a <code>Map</code>.
                <br />
                &ldquo;What about <code>NaN</code>?&rdquo; — a Set stores{" "}
                <code>NaN</code> only once. That is the only difference between{" "}
                <code>SameValueZero</code> and <code>===</code>.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `// 去重一行
const unique = [...new Set([1, 2, 2, 3])];   // [1, 2, 3]

// 循环里判重：O(n²) -> O(n)
const seen = new Set();
for (const x of list) {
  if (seen.has(x)) continue;   // O(1)，换成 arr.includes 就是 O(n)
  seen.add(x);
}

// 去不掉对象
new Set([{ id: 1 }, { id: 1 }]).size;   // 2 ← 引用不同

// 按内容去重要用 Map
const byId = new Map(items.map((i) => [i.id, i]));
const deduped = [...byId.values()];`,
              { filename: "Set 的两个真实用途" },
            ),
          ],
        },
        {
          id: "q287",
          heading: "Map vs Object",
          lede: "#287 Map vs Object",
          body: (
            <>
              <p>
                <strong>一句话：</strong><code>Map</code>
                的<strong>键可以是任何类型</strong>、
                <strong>保证插入顺序</strong>、有 <code>size</code>、
                能直接遍历；对象的键只能是字符串或 symbol，
                而且带着一条原型链。
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th><code>Object</code></th>
                      <th><code>Map</code></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>键的类型</td>
                      <td>字符串 / symbol（<strong>数字会被转成字符串</strong>）</td>
                      <td>任何值，包括对象和函数</td>
                    </tr>
                    <tr>
                      <td>顺序</td>
                      <td>整数键会被排序，其余按插入</td>
                      <td><strong>严格按插入顺序</strong></td>
                    </tr>
                    <tr>
                      <td>大小</td>
                      <td><code>Object.keys(o).length</code></td>
                      <td><code>map.size</code></td>
                    </tr>
                    <tr>
                      <td>遍历</td>
                      <td>要先 <code>Object.entries</code></td>
                      <td>本身可迭代，直接 <code>for…of</code></td>
                    </tr>
                    <tr>
                      <td>原型污染</td>
                      <td>
                        有风险 —— <code>o[&quot;toString&quot;]</code>
                        本来就有值
                      </td>
                      <td>没有，<code>Map</code> 是干净的</td>
                    </tr>
                    <tr>
                      <td>JSON 序列化</td>
                      <td>直接可以</td>
                      <td><strong>不行</strong>，要先转数组</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>怎么选：</strong>
              </p>
              <ul>
                <li>
                  <strong>用 Object</strong>：结构固定的记录
                  （一个用户、一份配置），要 JSON 序列化，
                  字段名写死在代码里。
                </li>
                <li>
                  <strong>用 Map</strong>：键是动态的、会频繁增删、
                  数量大、键不是字符串。
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「为什么说对象有原型污染风险？」——
                因为空对象也「有」<code>toString</code>、
                <code>constructor</code> 这些继承来的键。
                拿对象当字典时，
                <code>if (dict[key])</code> 遇到用户输入
                <code>&quot;constructor&quot;</code> 会误判成存在。
                <strong>Map 没这个问题</strong>，
                非要用对象就 <code>Object.create(null)</code>。
                <br />
                「<code>WeakMap</code> 呢？」—— 键必须是对象，
                而且<strong>不阻止垃圾回收</strong>。
                适合给对象挂额外数据又不想造成内存泄漏。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> a <code>Map</code>{" "}
                <strong>takes keys of any type</strong>,{" "}
                <strong>guarantees insertion order</strong>, has <code>size</code>, and
                is iterable on its own; an object&rsquo;s keys can only be strings or
                symbols, and it drags a prototype chain along with it.
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th><code>Object</code></th>
                      <th><code>Map</code></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Key types</td>
                      <td>String / symbol (<strong>numbers become strings</strong>)</td>
                      <td>Any value, objects and functions included</td>
                    </tr>
                    <tr>
                      <td>Order</td>
                      <td>Integer keys get sorted, the rest are insertion order</td>
                      <td><strong>Strictly insertion order</strong></td>
                    </tr>
                    <tr>
                      <td>Size</td>
                      <td><code>Object.keys(o).length</code></td>
                      <td><code>map.size</code></td>
                    </tr>
                    <tr>
                      <td>Iteration</td>
                      <td>Needs <code>Object.entries</code> first</td>
                      <td>Iterable itself — <code>for…of</code> just works</td>
                    </tr>
                    <tr>
                      <td>Prototype pollution</td>
                      <td>
                        A risk — <code>o[&quot;toString&quot;]</code> already has a
                        value
                      </td>
                      <td>None; a <code>Map</code> is clean</td>
                    </tr>
                    <tr>
                      <td>JSON serialisation</td>
                      <td>Works directly</td>
                      <td><strong>No</strong> — convert to an array first</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>How to choose:</strong>
              </p>
              <ul>
                <li>
                  <strong>Use an Object</strong> for records with a fixed shape (one
                  user, one config), for anything you serialise to JSON, and when the
                  field names are written into the code.
                </li>
                <li>
                  <strong>Use a Map</strong> when the keys are dynamic, entries come and
                  go often, there are a lot of them, or the keys are not strings.
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;Why is an object a prototype
                pollution risk?&rdquo; — because even an empty object
                &ldquo;has&rdquo; inherited keys like <code>toString</code> and{" "}
                <code>constructor</code>. Use an object as a dictionary and{" "}
                <code>if (dict[key])</code> reports a hit when the user types{" "}
                <code>&quot;constructor&quot;</code>.{" "}
                <strong>A Map does not have this problem</strong>; if you must use an
                object, build it with <code>Object.create(null)</code>.
                <br />
                &ldquo;And <code>WeakMap</code>?&rdquo; — its keys must be objects, and
                it <strong>does not hold off garbage collection</strong>. Good for
                hanging extra data on an object without leaking memory.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `// 对象的键会被转成字符串
const o = {};
o[1] = "a";
o["1"] = "b";
console.log(o);          // { "1": "b" } ← 只有一个键！

const m = new Map();
m.set(1, "a").set("1", "b");
console.log(m.size);     // 2 ← 数字 1 和字符串 "1" 是不同的键

// 原型污染
const dict = {};
console.log(dict["toString"]);   // ƒ toString() ← 凭空有值
console.log(new Map().get("toString")); // undefined ✓ 干净

// Map 不能直接 JSON
JSON.stringify(m);                    // "{}" ← 全丢了
JSON.stringify([...m]);               // '[[1,"a"],["1","b"]]' ✓`,
              { filename: "两个真实会踩的差别" },
            ),
          ],
        },
      ],
      transfer: [
        {
          signal: "「改了对象外面也变」",
          signalEn: "Changing an object inside a function also changes it outside",
          reachFor: "引用值只复制地址；先浅拷贝或 structuredClone",
          reachForEn: "A reference value copies only the address; make a shallow copy first, or use structuredClone",
        },
        {
          signal: "「界面不更新但 log 是对的」",
          signalEn: "The screen does not update, but the log shows the right value",
          reachFor: "React 比引用，必须造新对象",
          reachForEn: "React compares references, so you have to build a new object",
        },
        {
          signal: "看到 [] == false 这类怪题",
          signalEn: "A puzzle question such as [] == false",
          reachFor: "+ 看字符串、其他看数字、六个假值",
          reachForEn: "With +, one string makes it concatenation; every other operator converts to number; six values are falsy",
        },
        {
          signal: "「count 是 0 却拿到了默认值」",
          signalEn: "count is 0 but you still get the default value",
          reachFor: "把 || 换成 ??",
          reachForEn: "Replace || with ??",
        },
        {
          signal: "循环里 setTimeout 拿到最后一个值",
          signalEn: "A setTimeout inside a loop sees the last value",
          reachFor: "var 只有一个绑定，换 let",
          reachForEn: "var has only one binding; use let",
        },
        {
          signal: "循环里反复 includes",
          signalEn: "includes is called again and again inside a loop",
          reachFor: "换 Set.has，O(n²) 变 O(n)",
          reachForEn: "Use Set.has: O(n²) becomes O(n)",
        },
        {
          signal: "拿对象当字典且键来自用户输入",
          signalEn: "An object used as a dictionary, with keys that come from user input",
          reachFor: "用 Map，避免原型污染",
          reachForEn: "Use Map; it avoids prototype pollution",
        },
      ],
      recap: [
        "七种原始类型存值，其余存地址；typeof null 是 \"object\"（历史 bug），判数组用 Array.isArray。",
        "隐式转换记两条：+ 有字符串就拼接，其他转数字；六个假值 false/0/\"\"/null/undefined/NaN。",
        "一律用 ===，唯一例外是 x == null；NaN 和自己不相等，React 用 Object.is。",
        "&&、|| 返回操作数本身；要默认值用 ??，React 条件渲染写 length > 0 &&。",
        "var 函数作用域会提升成 undefined，let/const 块作用域有 TDZ；const 锁绑定不锁内容。",
        "JS 永远传值，对象传的是地址值 —— 所以改属性外面变、换指向外面不变。",
        "Set 查找 O(1) 但去不掉重复对象；Map 键可任意类型、保序、无原型污染，但不能直接 JSON。",
      ],
      recapEn: [
        "The seven primitive types hold the value itself, everything else holds an address; typeof null is \"object\", which is an old bug, so test for an array with Array.isArray.",
        "Two rules for implicit conversion: with + one string makes it concatenation, every other operator converts to number; the six falsy values are false/0/\"\"/null/undefined/NaN.",
        "Always use ===, with x == null as the only exception; NaN is not equal to itself, and React compares with Object.is.",
        "&& and || return one of the operands, not a boolean; for a default value use ??, and for conditional rendering in React write length > 0 &&.",
        "var is function scoped and is hoisted as undefined; let and const are block scoped and have a temporal dead zone; const locks the binding, not the contents.",
        "JavaScript always passes a value, and for an object that value is an address — so changing a property is visible outside, but reassigning the parameter is not.",
        "A Set looks up in O(1) but will not remove duplicate objects; a Map takes any type as a key, keeps insertion order and has no prototype pollution, but cannot go straight into JSON.",
      ],
    },

    /* ============================================================
       函数与作用域（12 题）
       ============================================================ */
    {
      id: "iv-js-fn",
      title: "函数与作用域十二问",
      titleEn: "12 questions on functions and scope",
      blurb: "定义方式、一等/一阶/高阶函数、纯函数、use strict、作用域、hoisting、作用域链、闭包、柯里化、IIFE。",
      blurbEn:
        "Ways to define a function, first class / first order / higher order functions, pure functions, use strict, scope, hoisting, the scope chain, closure, currying, IIFE.",
      minutes: 26,
      objectives: [
        "说清闭包是什么、为什么会「记住」外层变量，并举出两个真实用途",
        "画出一段代码的作用域链",
        "区分函数声明和函数表达式在提升上的差别",
        "说明纯函数的两个条件，并解释它为什么让代码好测",
      ],
      objectivesEn: [
        "Explain what a closure is, why it keeps the outer variables, and give two real uses",
        "Draw the scope chain for a piece of code",
        "Tell a function declaration from a function expression by the way each one is hoisted",
        "State the two conditions for a pure function, and explain why it makes code easy to test",
      ],
      whyForAssessment:
        "闭包是 JS 面试出现频率第一的题，而且它不是背概念就能过 —— 会让你解释循环里的 setTimeout、或者写一个计数器。hoisting 和作用域链是它的前置知识。纯函数那道会直接连到 React（为什么组件要写成纯的、为什么不能改 props）。",
      whyForAssessmentEn:
        "Closure is the most frequent question in a JavaScript interview, and reciting the definition is not enough — you will be asked to explain a setTimeout inside a loop, or to write a counter. hoisting and the scope chain come before it. The pure function question leads straight into React: why a component has to be pure, and why you must not change props.",
      concepts: [
        {
          id: "q285",
          heading: "有几种定义函数的方式",
          headingEn: "How many ways are there to define a function?",
          lede: "#285 How many ways to define a function",
          body: (
            <>
              <p>
                <strong>一句话：</strong>五种 ——
                函数声明、函数表达式、箭头函数、
                <code>Function</code> 构造器、以及对象/类里的方法简写。
              </p>
              <p>
                <strong>但面试真正想听的是它们的差别</strong>，
                尤其是前三种：
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>提升</th>
                      <th><code>this</code></th>
                      <th><code>arguments</code></th>
                      <th>能否 <code>new</code></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>函数声明</td>
                      <td><strong>整体提升，声明前可调用</strong></td>
                      <td>调用时决定</td>
                      <td>有</td>
                      <td>能</td>
                    </tr>
                    <tr>
                      <td>函数表达式</td>
                      <td>只提升变量名</td>
                      <td>调用时决定</td>
                      <td>有</td>
                      <td>能</td>
                    </tr>
                    <tr>
                      <td>箭头函数</td>
                      <td>只提升变量名</td>
                      <td><strong>定义时的外层 this</strong></td>
                      <td><strong>没有</strong></td>
                      <td><strong>不能</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>箭头函数不是「更短的 function」</strong>——
                它没有自己的 <code>this</code>、
                没有 <code>arguments</code>、
                不能当构造器、没有 <code>prototype</code>。
                所以<strong>对象方法里想用
                <code>this</code> 指向该对象，就不能用箭头函数</strong>。
              </p>
              <p>
                <strong>会追问：</strong>
                「<code>Function</code> 构造器为什么不用？」——
                它接收字符串当函数体，相当于 <code>eval</code>：
                有注入风险、拿不到闭包、
                而且引擎没法优化。
                <strong>知道它存在但说明不该用</strong>就是正确答案。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> five — function declaration, function
                expression, arrow function, the <code>Function</code> constructor, and
                method shorthand inside an object or class.
              </p>
              <p>
                <strong>But what the interview actually wants is the differences</strong>
                , especially between the first three:
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Hoisting</th>
                      <th><code>this</code></th>
                      <th><code>arguments</code></th>
                      <th>Can you <code>new</code> it</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Function declaration</td>
                      <td><strong>Hoisted whole, callable before its line</strong></td>
                      <td>Decided at call time</td>
                      <td>Yes</td>
                      <td>Yes</td>
                    </tr>
                    <tr>
                      <td>Function expression</td>
                      <td>Only the variable name is hoisted</td>
                      <td>Decided at call time</td>
                      <td>Yes</td>
                      <td>Yes</td>
                    </tr>
                    <tr>
                      <td>Arrow function</td>
                      <td>Only the variable name is hoisted</td>
                      <td><strong>The enclosing this where it was written</strong></td>
                      <td><strong>No</strong></td>
                      <td><strong>No</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>
                  An arrow function is not &ldquo;a shorter function&rdquo;
                </strong>{" "}
                — it has no <code>this</code> of its own, no <code>arguments</code>,
                cannot be a constructor, and has no <code>prototype</code>. So{" "}
                <strong>
                  if an object method needs <code>this</code> to be that object, it
                  cannot be an arrow function
                </strong>
                .
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Why does nobody use the{" "}
                <code>Function</code> constructor?&rdquo; — it takes the body as a
                string, which makes it <code>eval</code> in disguise: an injection risk,
                no access to the surrounding closure, and nothing the engine can
                optimise.{" "}
                <strong>Knowing it exists and saying it should not be used</strong> is
                the right answer.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `sayHi();                              // ✓ 能跑 —— 函数声明整体提升
function sayHi() { console.log("hi"); }

sayHey();                             // ✗ TypeError: sayHey is not a function
var sayHey = function () {};          // 只提升了变量名，此刻还是 undefined

// 箭头函数的 this 是定义时的外层 this
const obj = {
  name: "A",
  arrow: () => console.log(this.name),      // undefined ← 外层是模块/window
  normal() { console.log(this.name); },     // "A"       ← 调用时决定
};`,
              { filename: "三种写法的实际差别" },
            ),
          ],
        },
        {
          id: "q290",
          heading: "什么是一等函数",
          headingEn: "What is a first class function?",
          lede: "#290 What is a first class function",
          body: (
            <>
              <p>
                <strong>一句话：</strong>「一等」说的是
                <strong>函数和普通值地位相同</strong>——
                能赋给变量、能当参数传、能当返回值、
                能放进数组和对象。
              </p>
              <p>
                <strong>这是语言的性质，不是某个函数的性质。</strong>
                说「JavaScript 有一等函数」是对的，
                说「这是一个一等函数」就怪了。
              </p>
              <p>
                <strong>为什么重要：</strong>
                一等函数是<strong>回调、高阶函数、闭包、
                函数式编程的前提</strong>。
                <code>arr.map(fn)</code> 之所以能写，
                就是因为 <code>fn</code> 可以当参数。
              </p>
              <p>
                <strong>会追问：</strong>下面三题连着问 ——
                一等（能当值）→ 一阶（不碰函数）→
                高阶（收或返函数）。先把这三个词分清。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> &ldquo;first class&rdquo; means{" "}
                <strong>functions have the same standing as any other value</strong> —
                you can assign one to a variable, pass one as an argument, return one,
                and store them in arrays and objects.
              </p>
              <p>
                <strong>
                  This is a property of the language, not of a particular function.
                </strong>{" "}
                &ldquo;JavaScript has first class functions&rdquo; is correct;
                &ldquo;this is a first class function&rdquo; sounds wrong.
              </p>
              <p>
                <strong>Why it matters:</strong> first class functions are{" "}
                <strong>
                  the precondition for callbacks, higher order functions, closures and
                  functional programming
                </strong>
                . You can only write <code>arr.map(fn)</code> because <code>fn</code> can
                be an argument in the first place.
              </p>
              <p>
                <strong>Follow-up:</strong> the next three come as a set — first class
                (works as a value) → first order (touches no functions) → higher order
                (takes or returns a function). Get those three terms apart first.
              </p>
            </>
          ),
        },
        {
          id: "q291",
          heading: "什么是一阶函数",
          headingEn: "What is a first order function?",
          lede: "#291 What is a first order function",
          body: (
            <>
              <p>
                <strong>一句话：</strong>
                <strong>参数里没有函数、返回值也不是函数</strong>
                的普通函数。
              </p>
              <p>
                <code>{"(a, b) => a + b"}</code> 是一阶的。
                <code>arr.map(fn)</code> 不是 —— 它收了个函数。
              </p>
              <p>
                这个词单独考的时候很少，
                <strong>它存在的意义就是和「高阶」形成对照</strong>。
                答题时一句话说完，然后主动接到高阶函数上，
                显得你知道这三题是一组。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> an ordinary function that{" "}
                <strong>
                  takes no function as an argument and returns no function either
                </strong>
                .
              </p>
              <p>
                <code>{"(a, b) => a + b"}</code> is first order.{" "}
                <code>arr.map(fn)</code> is not — it takes a function.
              </p>
              <p>
                The term almost never gets asked on its own.{" "}
                <strong>
                  It exists to give &ldquo;higher order&rdquo; something to contrast
                  with
                </strong>
                . Answer it in one sentence, then move on to higher order functions
                yourself — that shows you know these three questions travel together.
              </p>
            </>
          ),
        },
        {
          id: "q292",
          heading: "什么是高阶函数",
          headingEn: "What is a higher order function?",
          lede: "#292 What is a higher order function",
          body: (
            <>
              <p>
                <strong>一句话：</strong>
                <strong>参数里接收函数，或者返回一个函数</strong>——
                满足任一条就是高阶函数。
              </p>
              <p>
                <strong>你天天在用：</strong>
                <code>map</code> / <code>filter</code> /
                <code>reduce</code> / <code>forEach</code> /
                <code>sort</code>（接收函数），
                <code>setTimeout</code> / <code>addEventListener</code>
                （接收函数），
                <code>bind</code>（返回函数）。
              </p>
              <p>
                <strong>返回函数那一类才是考点</strong>，
                因为它是柯里化、防抖节流、
                和 React HOC 的共同底子：
              </p>
              <p>
                <strong>会追问：</strong>「写一个防抖」——
                这是最常见的现场编码题，
                本质就是「返回一个函数 + 闭包记住 timer」。
                注意<strong>清理和 <code>this</code> 转发</strong>，
                很多人会漏。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong>{" "}
                <strong>it takes a function as an argument, or it returns one</strong> —
                either one on its own makes it a higher order function.
              </p>
              <p>
                <strong>You use them every day:</strong> <code>map</code> /{" "}
                <code>filter</code> / <code>reduce</code> / <code>forEach</code> /{" "}
                <code>sort</code> (they take a function), <code>setTimeout</code> /{" "}
                <code>addEventListener</code> (they take a function), and{" "}
                <code>bind</code> (it returns one).
              </p>
              <p>
                <strong>The returning kind is what gets tested</strong>, because it is
                the shared foundation under currying, debounce and throttle, and React
                HOCs:
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Write a debounce&rdquo; — the most
                common live-coding task there is, and at heart it is just &ldquo;return a
                function and let the closure remember the timer&rdquo;. Watch out for{" "}
                <strong>
                  clearing the previous timer and forwarding <code>this</code>
                </strong>
                ; plenty of people drop those.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `// 返回函数：一个能记住次数的计数器
function makeCounter() {
  let n = 0;                    // 被闭包保住
  return () => ++n;
}
const next = makeCounter();
next(); next();                 // 2

// 高频现场题：防抖
function debounce(fn, delay = 300) {
  let timer = null;                        // 闭包里的状态
  return function (...args) {
    clearTimeout(timer);                   // 每次进来先撤销上一次
    timer = setTimeout(() => fn.apply(this, args), delay);
  };                                       // 用 function 而不是箭头，才能转发 this
}

// React 的 HOC 也是高阶函数：收组件、返组件
const withLogger = (Comp) => (props) => {
  console.log("render", Comp.name);
  return <Comp {...props} />;
};`,
              { filename: "高阶函数的三种典型形态" },
            ),
          ],
        },
        {
          id: "q293",
          heading: "什么是纯函数",
          headingEn: "What is a pure function?",
          lede: "#293 What is a pure function",
          body: (
            <>
              <p>
                <strong>一句话：两个条件。</strong>
                ① <strong>同样的输入永远给同样的输出</strong>；
                ② <strong>没有副作用</strong>（不改外部变量、
                不改参数、不发请求、不写 DOM、不打日志）。
              </p>
              <p>
                <strong>不纯的常见来源：</strong>
                <code>Math.random()</code>、
                <code>new Date()</code>、
                读写全局变量、
                <code>arr.push()</code> 改了传进来的数组、
                <code>console.log</code>。
              </p>
              <p>
                <strong>为什么面试爱问：</strong>纯函数
                <strong>好测</strong>（给输入断输出，不用搭环境）、
                <strong>好缓存</strong>（输入一样就能复用结果，
                这就是 memoization）、
                <strong>好并发</strong>（没有共享状态就没有竞争）。
              </p>
              <p>
                <strong>直接连到 React：</strong>
              </p>
              <ul>
                <li>
                  <strong>组件的渲染函数必须是纯的</strong>——
                  同样的 props 和 state 要渲染出同样的 UI。
                  这是 StrictMode 故意渲染两次能发现问题的原因（见 #332）。
                </li>
                <li>
                  <strong>Redux 的 reducer 必须是纯的</strong>——
                  不然时间旅行调试和重放就不成立（见 #352）。
                </li>
                <li>
                  <strong>不可变更新</strong>之所以是铁律，
                  就是因为「改传进来的数组」会让函数不纯。
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「那副作用写哪？」—— React 里写
                <code>useEffect</code>，
                Redux 里写中间件（thunk / saga）。
                <strong>把纯逻辑和副作用分开</strong>是这套设计的核心。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line: two conditions.</strong> ①{" "}
                <strong>the same input always produces the same output</strong>; ②{" "}
                <strong>no side effects</strong> (it does not touch outer variables,
                mutate its arguments, fire requests, write to the DOM, or log).
              </p>
              <p>
                <strong>Where impurity usually creeps in:</strong>{" "}
                <code>Math.random()</code>, <code>new Date()</code>, reading or writing
                globals, an <code>arr.push()</code> on the array you were handed, and{" "}
                <code>console.log</code>.
              </p>
              <p>
                <strong>Why interviewers like this one:</strong> pure functions are{" "}
                <strong>easy to test</strong> (give input, assert output, no setup),{" "}
                <strong>easy to cache</strong> (same input, reuse the result — that is
                memoization), and <strong>easy to run concurrently</strong> (no shared
                state means no races).
              </p>
              <p>
                <strong>Straight into React:</strong>
              </p>
              <ul>
                <li>
                  <strong>A component&rsquo;s render function must be pure</strong> — the
                  same props and state have to produce the same UI. That is why
                  StrictMode renders twice on purpose and catches things (see #332).
                </li>
                <li>
                  <strong>A Redux reducer must be pure</strong> — otherwise time-travel
                  debugging and replay do not hold up (see #352).
                </li>
                <li>
                  <strong>Immutable updates</strong> are a hard rule precisely because
                  mutating the array you were given makes the function impure.
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;So where do the side effects go?
                &rdquo; — <code>useEffect</code> in React, middleware (thunk or saga) in
                Redux. <strong>Keeping pure logic and side effects apart</strong> is the
                core of that design.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `// ✗ 不纯：改了传进来的数组
function addItem(list, item) {
  list.push(item);
  return list;
}

// ✓ 纯：返回新数组
function addItem(list, item) {
  return [...list, item];
}

// ✗ 不纯：输出取决于外部
let rate = 0.1;
const tax = (n) => n * rate;

// ✓ 纯：所有依赖都从参数进来
const tax = (n, rate) => n * rate;`,
              { filename: "怎么把不纯改纯" },
            ),
          ],
        },
        {
          id: "q294",
          heading: '"use strict" 是干什么的',
          headingEn: "What does \"use strict\" do?",
          lede: '#294 What is "use strict"',
          body: (
            <>
              <p>
                <strong>一句话：</strong>开启严格模式 ——
                把一批「静默出错」的写法变成<strong>直接抛错</strong>，
                并禁掉一些历史包袱。
              </p>
              <p>
                <strong>具体管四件事（记两三条就够答）：</strong>
              </p>
              <ul>
                <li>
                  <strong>禁止隐式全局变量。</strong>
                  <code>x = 1</code> 忘了 <code>let</code>，
                  非严格下会悄悄挂到 <code>window</code>，
                  严格下抛 <code>ReferenceError</code>。
                  <strong>这是它最大的价值。</strong>
                </li>
                <li>
                  <strong>函数里的 <code>this</code> 是
                  <code>undefined</code></strong>，
                  而不是 <code>window</code>——
                  能让「忘了 bind」当场暴露。
                </li>
                <li>
                  给只读属性赋值、删不可删的属性会<strong>抛错</strong>
                  而不是静默失败。
                </li>
                <li>
                  禁 <code>with</code>、禁重复参数名、
                  <code>arguments</code> 不再和参数联动。
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「现在还要手写吗？」—— <strong>基本不用了</strong>：
                <strong>ES 模块和 class 内部自动就是严格模式</strong>。
                所以只有写老式 <code>&lt;script&gt;</code>
                或 CommonJS 时才需要手写。
                能答出这条说明你知道现状。
              </p>
              <p>
                <strong>顺带一个真实关联：</strong>
                这就是「<code>Object.freeze</code> 之后修改会抛错」的原因
                —— 非严格模式下它只是静默失败。
                我们的评论树那道题就是靠这个来验证不可变性的。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> it switches on strict mode — a batch of
                things that used to fail silently now <strong>throw</strong>, and some
                historical baggage is banned outright.
              </p>
              <p>
                <strong>
                  It covers four things; two or three of them are enough to answer:
                </strong>
              </p>
              <ul>
                <li>
                  <strong>No implicit globals.</strong> <code>x = 1</code> with a
                  forgotten <code>let</code> quietly lands on <code>window</code> in
                  sloppy mode, and throws <code>ReferenceError</code> in strict mode.{" "}
                  <strong>This is its biggest single win.</strong>
                </li>
                <li>
                  <strong>
                    <code>this</code> inside a plain function is <code>undefined</code>
                  </strong>{" "}
                  instead of <code>window</code> — so a forgotten bind throws right
                  there.
                </li>
                <li>
                  Assigning to a read-only property, or deleting one that cannot be
                  deleted, <strong>throws</strong> instead of failing silently.
                </li>
                <li>
                  <code>with</code> is banned, duplicate parameter names are banned, and{" "}
                  <code>arguments</code> no longer tracks the parameters.
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;Do you still type it by hand?&rdquo; —{" "}
                <strong>almost never</strong>:{" "}
                <strong>
                  ES modules and class bodies are strict automatically
                </strong>
                . You only write it for old-style <code>&lt;script&gt;</code> tags or
                CommonJS. Saying so shows you know where things stand today.
              </p>
              <p>
                <strong>One real connection worth adding:</strong> this is why writing to
                an object after <code>Object.freeze</code> throws — in sloppy mode it
                just fails silently. Our comment-tree exercise leans on exactly that to
                verify immutability.
              </p>
            </>
          ),
        },
        {
          id: "q295",
          heading: "作用域有哪几种",
          headingEn: "What kinds of scope are there?",
          lede: "#295 What are the different type of scopes",
          body: (
            <>
              <p>
                <strong>一句话：</strong>四种 ——
                全局、函数、块、模块。
              </p>
              <ul>
                <li>
                  <strong>全局</strong>—— 最外层。浏览器里
                  <code>var</code> 声明的会挂到 <code>window</code>。
                </li>
                <li>
                  <strong>函数</strong>—— <code>var</code>
                  和函数参数的地盘，
                  <strong>整个函数体内都可见</strong>。
                </li>
                <li>
                  <strong>块</strong>—— 任意一对 <code>{"{}"}</code>。
                  <strong>只对 <code>let</code> / <code>const</code>
                  / <code>class</code> 有效</strong>，
                  <code>var</code> 无视它。
                </li>
                <li>
                  <strong>模块</strong>—— 每个 ES 模块文件自己一个作用域，
                  顶层声明<strong>不会污染全局</strong>。
                </li>
              </ul>
              <p>
                <strong>顺带一个常被忽略的：</strong>
                <code>catch (e)</code> 的 <code>e</code>
                也有自己的作用域。
              </p>
              <p>
                <strong>会追问：</strong>
                「函数作用域和块作用域差在哪，举个例子？」——
                <code>if</code> 里 <code>var</code> 声明的变量
                <strong>出了 if 还能访问</strong>，
                <code>let</code> 就不能。
                这是把老代码从 <code>var</code>
                改成 <code>let</code> 时最常见的破坏点。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> four — global, function, block and module.
              </p>
              <ul>
                <li>
                  <strong>Global</strong> — the outermost level. In a browser, a{" "}
                  <code>var</code> declared here lands on <code>window</code>.
                </li>
                <li>
                  <strong>Function</strong> — the territory of <code>var</code> and the
                  parameters, <strong>visible anywhere in the function body</strong>.
                </li>
                <li>
                  <strong>Block</strong> — any pair of <code>{"{}"}</code>.{" "}
                  <strong>
                    It only binds <code>let</code> / <code>const</code> /{" "}
                    <code>class</code>
                  </strong>
                  ; <code>var</code> ignores it completely.
                </li>
                <li>
                  <strong>Module</strong> — every ES module file gets a scope of its own,
                  so top-level declarations{" "}
                  <strong>do not pollute the global scope</strong>.
                </li>
              </ul>
              <p>
                <strong>One that people forget:</strong> the <code>e</code> in{" "}
                <code>catch (e)</code> has its own scope too.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Give me an example of function scope
                against block scope&rdquo; — a <code>var</code> declared inside an{" "}
                <code>if</code> <strong>is still readable after the if</strong>; a{" "}
                <code>let</code> is not. That is the thing you break most often when
                converting old <code>var</code> code to <code>let</code>.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `function f() {
  if (true) {
    var a = 1;      // 函数作用域
    let b = 2;      // 块作用域
  }
  console.log(a);   // 1          ✓ var 无视 {}
  console.log(b);   // ReferenceError
}`,
              { filename: "函数作用域 vs 块作用域" },
            ),
          ],
        },
        {
          id: "q296",
          heading: "什么是变量提升",
          headingEn: "What is hoisting?",
          lede: "#296 What is hoisting",
          body: (
            <>
              <p>
                <strong>一句话：</strong>编译阶段引擎会先扫一遍，
                把<strong>声明</strong>登记到作用域里，
                所以「在声明之前引用」不一定报错 ——
                <strong>但只提升声明，不提升赋值</strong>。
              </p>
              <p>
                <strong>四种情况分清就够答：</strong>
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>声明前访问的结果</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>函数声明</strong></td>
                      <td><strong>整个函数都能用</strong>（可以直接调用）</td>
                    </tr>
                    <tr>
                      <td><code>var</code></td>
                      <td><code>undefined</code></td>
                    </tr>
                    <tr>
                      <td><code>let</code> / <code>const</code></td>
                      <td>抛 <code>ReferenceError</code>（TDZ）</td>
                    </tr>
                    <tr>
                      <td><code>class</code></td>
                      <td>抛 <code>ReferenceError</code>（也有 TDZ）</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>「<code>let</code> 不提升」是个常见错误说法。</strong>
                它<strong>确实提升了</strong>——
                否则内层的 <code>let x</code>
                不会遮蔽外层的 <code>x</code>。
                只是它被标成「未初始化」，访问就抛错。
                <strong>能纠正这个说法很加分。</strong>
              </p>
              <p>
                <strong>会追问：</strong>
                「函数声明和函数表达式呢？」——
                <code>{"function f(){}"}</code> 整体提升；
                <code>{"var f = function(){}"}</code>
                只提升 <code>f</code>（值是 <code>undefined</code>），
                提前调用会得到
                <code>TypeError: f is not a function</code>。
                <strong>注意这两个报错不一样</strong>，
                这个细节常用来分辨背没背过。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> during compilation the engine scans the
                code first and registers the <strong>declarations</strong> in the scope,
                so referring to something before its line does not always throw —{" "}
                <strong>but only the declaration is hoisted, never the assignment</strong>
                .
              </p>
              <p>
                <strong>Four cases; keeping them apart is enough:</strong>
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>What you get before the declaration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Function declaration</strong></td>
                      <td><strong>Usable throughout</strong> (you can call it)</td>
                    </tr>
                    <tr>
                      <td><code>var</code></td>
                      <td><code>undefined</code></td>
                    </tr>
                    <tr>
                      <td><code>let</code> / <code>const</code></td>
                      <td>throws <code>ReferenceError</code> (TDZ)</td>
                    </tr>
                    <tr>
                      <td><code>class</code></td>
                      <td>throws <code>ReferenceError</code> (a TDZ as well)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>
                  &ldquo;<code>let</code> is not hoisted&rdquo; is a common mistake.
                </strong>{" "}
                It <strong>is hoisted</strong> — otherwise an inner <code>let x</code>{" "}
                would not shadow an outer <code>x</code>. It is just marked
                uninitialised, so reading it throws.{" "}
                <strong>Correcting this scores well.</strong>
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;What about function declarations
                against function expressions?&rdquo; — <code>{"function f(){}"}</code> is
                hoisted whole; <code>{"var f = function(){}"}</code> hoists only{" "}
                <code>f</code> (whose value is <code>undefined</code>), so calling it
                early gives you{" "}
                <code>TypeError: f is not a function</code>.{" "}
                <strong>Note the two errors are different</strong> — that detail is how
                they tell recitation from understanding.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `console.log(fn());   // "ok"      函数声明整体提升
console.log(v);      // undefined var 提升成 undefined
console.log(l);      // ReferenceError（TDZ）

function fn() { return "ok"; }
var v = 1;
let l = 2;

// 两种「不是函数」的报错要分清
foo();                       // TypeError: foo is not a function
var foo = function () {};

bar();                       // ReferenceError: Cannot access 'bar' ...
let bar = function () {};`,
              { filename: "四种提升行为" },
            ),
          ],
        },
        {
          id: "q297",
          heading: "什么是作用域链",
          headingEn: "What is the scope chain?",
          lede: "#297 What is the scope chain?",
          body: (
            <>
              <p>
                <strong>一句话：</strong>找一个变量时，
                <strong>先在当前作用域找，找不到就往外一层，
                一直找到全局，还没有就报
                <code>ReferenceError</code></strong>。
                这条「由内到外」的路径就是作用域链。
              </p>
              <p>
                <strong>两个关键性质：</strong>
              </p>
              <ul>
                <li>
                  <strong>只能往外找，不能往里找。</strong>
                  外层看不见内层的变量。
                </li>
                <li>
                  <strong>链在函数「定义」时就定下来了，
                  和在哪里「调用」无关</strong>——
                  这叫<strong>词法作用域（静态作用域）</strong>。
                  这一句是本题的真考点，也是闭包的原理。
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「那 <code>this</code> 也是这样吗？」——
                <strong>不是</strong>，这是最容易混的地方。
                <strong>变量查找是词法的（看定义在哪），
                <code>this</code> 是动态的（看怎么调用的）</strong>。
                箭头函数的 <code>this</code>
                之所以「像变量一样」，
                正因为它<strong>不自己定义 <code>this</code></strong>，
                而是顺着作用域链去外层拿。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> to resolve a variable, JS{" "}
                <strong>
                  looks in the current scope, then one level out, and keeps going until
                  the global scope; if it is still not there you get a{" "}
                  <code>ReferenceError</code>
                </strong>
                . That inside-out path is the scope chain.
              </p>
              <p>
                <strong>Two properties that matter:</strong>
              </p>
              <ul>
                <li>
                  <strong>It only looks outward, never inward.</strong> An outer scope
                  cannot see an inner one&rsquo;s variables.
                </li>
                <li>
                  <strong>
                    The chain is fixed where the function is defined, not where it is
                    called
                  </strong>{" "}
                  — this is <strong>lexical (static) scoping</strong>. That one sentence
                  is what the question is really testing, and it is how closures work.
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;Does <code>this</code> behave the same
                way?&rdquo; — <strong>no</strong>, and this is the easiest thing to mix
                up.{" "}
                <strong>
                  Variable lookup is lexical (where it was written), <code>this</code> is
                  dynamic (how it was called)
                </strong>
                . An arrow function&rsquo;s <code>this</code> feels
                &ldquo;variable-like&rdquo; exactly because it{" "}
                <strong>
                  does not define a <code>this</code> of its own
                </strong>{" "}
                and walks the scope chain outward to find one.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `const g = "全局";

function outer() {
  const o = "外层";
  function inner() {
    const i = "内层";
    console.log(i, o, g);   // 三层都找得到：内 -> 外 -> 全局
  }
  inner();
  // console.log(i);        // ✗ 外层看不见内层
}

// 词法作用域：链看「定义在哪」，不看「在哪调用」
const x = "定义时的 x";
function show() { console.log(x); }

function run() {
  const x = "调用处的 x";
  show();                   // "定义时的 x" ← 不是调用处那个
}
run();`,
              { filename: "由内到外，且在定义时确定" },
            ),
          ],
        },
        {
          id: "q298",
          heading: "什么是闭包",
          headingEn: "What is a closure?",
          lede: "#298 What is a closure",
          body: (
            <>
              <p>
                <strong>一句话：</strong>
                <strong>函数记住了它定义时所在的作用域</strong>——
                即使外层函数已经执行完了，
                里面的变量也还活着，因为这个函数还在引用它们。
              </p>
              <p>
                <strong>为什么会这样？</strong>
                因为作用域链在定义时就绑好了（#297）。
                外层函数返回后，
                它的变量本该被回收，
                但<strong>只要还有函数引用着，
                垃圾回收就不会动它</strong>。
              </p>
              <p>
                <strong>四个真实用途</strong>（面试要的是用途，不是定义）：
              </p>
              <ul>
                <li>
                  <strong>私有状态</strong>—— 计数器、缓存。
                  外部拿不到那个变量，只能通过你暴露的方法改。
                </li>
                <li>
                  <strong>防抖 / 节流</strong>—— 用闭包存 timer。
                </li>
                <li>
                  <strong>柯里化 / 偏函数</strong>—— 记住已经传进来的参数（#299）。
                </li>
                <li>
                  <strong>React 的 Hooks 全靠它</strong>——
                  <code>useState</code> 返回的
                  <code>setState</code>、
                  <code>useEffect</code> 里的回调，
                  都是闭包捕获了那一次渲染的值。
                  <strong>「过期闭包」这个 bug 就是它的副作用。</strong>
                </li>
              </ul>
              <p>
                <strong>会追问的两道题：</strong>
              </p>
              <p>
                ① <strong>循环里的 setTimeout</strong>（见 #282）。
                <code>var</code> 全程只有一个 <code>i</code>，
                三个闭包共享它；<code>let</code>
                每次迭代新建一个绑定，所以各自记住自己那份。
              </p>
              <p>
                ② <strong>闭包会不会造成内存泄漏？</strong>
                会 —— 如果闭包一直存活（比如挂在全局或未移除的事件监听里），
                它引用的整个作用域都回收不了。
                <strong>解法是及时解绑</strong>，
                这也是 React 里 <code>useEffect</code>
                必须写清理函数的原因之一。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong>{" "}
                <strong>a function remembers the scope it was defined in</strong> — even
                after the outer function has finished, the variables inside are still
                alive, because that function is still referencing them.
              </p>
              <p>
                <strong>Why does that happen?</strong> Because the scope chain is wired
                up at definition time (#297). Once the outer function returns, its
                variables would normally be collected, but{" "}
                <strong>
                  garbage collection leaves them alone as long as some function still
                  references them
                </strong>
                .
              </p>
              <p>
                <strong>Four real uses</strong> — the interview wants uses, not the
                definition:
              </p>
              <ul>
                <li>
                  <strong>Private state</strong> — counters, caches. Nothing outside can
                  reach the variable; it can only go through the methods you expose.
                </li>
                <li>
                  <strong>Debounce and throttle</strong> — the closure holds the timer.
                </li>
                <li>
                  <strong>Currying and partial application</strong> — remembering the
                  arguments received so far (#299).
                </li>
                <li>
                  <strong>Every React Hook rests on it</strong> — the{" "}
                  <code>setState</code> returned by <code>useState</code>, and the
                  callback inside <code>useEffect</code>, are closures that captured the
                  values of one particular render.{" "}
                  <strong>
                    The &ldquo;stale closure&rdquo; bug is the flip side of that.
                  </strong>
                </li>
              </ul>
              <p>
                <strong>Two follow-ups to expect:</strong>
              </p>
              <p>
                ① <strong>setTimeout inside a loop</strong> (see #282). With{" "}
                <code>var</code> there is one <code>i</code> for the whole loop and all
                three closures share it; <code>let</code> creates a new binding per
                iteration, so each closure remembers its own.
              </p>
              <p>
                ② <strong>Can a closure leak memory?</strong> It can — if the closure
                stays alive (hanging off a global, or an event listener you never
                removed), the entire scope it references cannot be collected.{" "}
                <strong>The fix is to unsubscribe in time</strong>, which is one of the
                reasons a React <code>useEffect</code> needs its cleanup function.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `// 私有状态：外面拿不到 count，只能通过方法改
function createCounter() {
  let count = 0;                     // 外面访问不到
  return {
    inc: () => ++count,
    get: () => count,
  };
}
const c = createCounter();
c.inc(); c.inc();
c.get();          // 2
c.count;          // undefined ← 真的私有

// 经典面试题：这里会打印什么？
function f() {
  const fns = [];
  for (var i = 0; i < 3; i++) fns.push(() => i);
  return fns.map((fn) => fn());
}
f();              // [3, 3, 3]  —— 三个闭包共享同一个 i
                  // 把 var 换成 let 就是 [0, 1, 2]`,
              { filename: "闭包的两道必考题" },
            ),
          ],
        },
        {
          id: "q299",
          heading: "什么是柯里化",
          headingEn: "What is currying?",
          lede: "#299 What is currying",
          body: (
            <>
              <p>
                <strong>一句话：</strong>把「一次收 n 个参数」的函数
                改成「<strong>每次收一个、返回一个新函数</strong>」，
                收满了才真正计算。
              </p>
              <p>
                <code>{"add(1, 2, 3)"}</code> 变成
                <code>{"add(1)(2)(3)"}</code>。
                实现靠<strong>闭包记住已经收到的参数</strong>。
              </p>
              <p>
                <strong>有什么用（别只说「炫技」）：</strong>
              </p>
              <ul>
                <li>
                  <strong>参数复用</strong>——
                  <code>{'const log = level => msg => console.log(`[${level}] ${msg}`)'}</code>
                  ，然后 <code>const warn = log(&quot;WARN&quot;)</code>。
                </li>
                <li>
                  <strong>延迟执行</strong>—— 参数没收齐就不干活，
                  适合配置式 API。
                </li>
                <li>
                  <strong>函数组合</strong>——
                  组合要求每个函数只收一个参数，
                  柯里化正好把多参函数改造成这个形状。
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「柯里化和偏函数（partial application）什么区别？」——
                柯里化<strong>严格一次一个</strong>；
                偏函数是<strong>一次固定几个、剩下的以后给</strong>
                （<code>bind</code> 就是偏函数）。
                这个区分问得不少。
              </p>
              <p>
                <strong>还会让你手写一个通用 curry</strong>——
                思路是：参数够了就调，不够就返回一个继续收的函数。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> take a function that receives n arguments
                at once and reshape it into one that{" "}
                <strong>takes one at a time and returns a new function</strong>, only
                computing once they are all in.
              </p>
              <p>
                <code>{"add(1, 2, 3)"}</code> becomes <code>{"add(1)(2)(3)"}</code>. The
                implementation rests on{" "}
                <strong>a closure remembering the arguments received so far</strong>.
              </p>
              <p>
                <strong>
                  What it is good for — do not just say &ldquo;showing off&rdquo;:
                </strong>
              </p>
              <ul>
                <li>
                  <strong>Reusing arguments</strong> —{" "}
                  <code>{'const log = level => msg => console.log(`[${level}] ${msg}`)'}</code>
                  , then <code>const warn = log(&quot;WARN&quot;)</code>.
                </li>
                <li>
                  <strong>Deferred execution</strong> — nothing runs until every argument
                  has arrived, which suits configuration-style APIs.
                </li>
                <li>
                  <strong>Function composition</strong> — composition wants every
                  function to take a single argument, and currying reshapes
                  multi-argument functions into exactly that.
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;What is the difference between
                currying and partial application?&rdquo; — currying is{" "}
                <strong>strictly one argument at a time</strong>; partial application{" "}
                <strong>fixes a few now and takes the rest later</strong> (
                <code>bind</code> is partial application). This distinction comes up a
                lot.
              </p>
              <p>
                <strong>They will also ask you to write a generic curry</strong> — the
                idea is: if you have enough arguments, call the function; if not, return
                one that keeps collecting.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `// 手写通用柯里化：参数够了就算，不够就继续收
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn.apply(this, args);
    return (...rest) => curried.apply(this, [...args, ...rest]);
  };
}

const add = curry((a, b, c) => a + b + c);
add(1)(2)(3);      // 6
add(1, 2)(3);      // 6
add(1)(2, 3);      // 6

// 实际用途：参数复用
const log = (level) => (msg) => console.log(\`[\${level}] \${msg}\`);
const warn = log("WARN");
warn("磁盘快满了");     // [WARN] 磁盘快满了`,
              {
                filename: "柯里化",
                explanation:
                  "关键是 fn.length —— 函数声明时的形参个数。注意带默认值或 ...rest 的参数不计入 length，所以这个通用实现对它们不适用。",
              },
            ),
          ],
        },
        {
          id: "q300",
          heading: "什么是 IIFE",
          headingEn: "What is an IIFE?",
          lede: "#300 What is an IIFE",
          body: (
            <>
              <p>
                <strong>一句话：</strong>立即执行函数表达式
                （Immediately Invoked Function Expression）——
                定义完马上调用，用来<strong>造一个隔离的作用域</strong>。
              </p>
              <p>
                <strong>为什么要包一层括号？</strong>
                因为以 <code>function</code> 开头的语句会被解析成
                <strong>函数声明</strong>，而声明不能直接调用。
                外面套括号（或者前面加
                <code>!</code>、<code>+</code>、
                <code>void</code>）把它变成<strong>表达式</strong>。
              </p>
              <p>
                <strong>当年解决什么问题：</strong>
                ES5 没有块作用域和模块，
                所有 <code>&lt;script&gt;</code> 共享全局命名空间。
                IIFE 是<strong>唯一的隔离手段</strong>——
                jQuery 插件、UMD 打包产物全是这么写的。
              </p>
              <p>
                <strong>会追问（这才是这题的重点）：</strong>
                「现在还需要吗？」——
                <strong>基本不需要了</strong>：
                块作用域 + <code>let</code> 能隔离变量，
                ES 模块天然有自己的作用域。
                <br />
                <strong>还剩两个场合会用到</strong>：
                ① 需要在顶层 <code>await</code>
                而环境不支持时，包一个
                <code>{"(async () => { … })()"}</code>；
                ② 打包工具生成的产物里。
                <br />
                我们那道 fetch 变式题里
                <code>useEffect</code> 内部包的
                <code>{"(async () => {…})()"}</code>
                就是场合 ①—— effect 不能是 async，
                所以用 IIFE 开一个异步作用域。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> an Immediately Invoked Function Expression
                — defined and called on the spot, in order to{" "}
                <strong>create an isolated scope</strong>.
              </p>
              <p>
                <strong>Why the extra parentheses?</strong> Because a statement that
                starts with <code>function</code> is parsed as a{" "}
                <strong>function declaration</strong>, and a declaration cannot be called
                directly. Wrapping it in parentheses (or putting <code>!</code>,{" "}
                <code>+</code> or <code>void</code> in front) turns it into an{" "}
                <strong>expression</strong>.
              </p>
              <p>
                <strong>What it solved back then:</strong> ES5 had no block scope and no
                modules, and every <code>&lt;script&gt;</code> shared one global
                namespace. An IIFE was{" "}
                <strong>the only way to isolate anything</strong> — jQuery plugins and
                UMD bundles are all written that way.
              </p>
              <p>
                <strong>Follow-up, and this is the point of the question:</strong>{" "}
                &ldquo;Do you still need it?&rdquo; —{" "}
                <strong>mostly not</strong>: block scope plus <code>let</code> isolates
                variables, and an ES module has a scope of its own already.
                <br />
                <strong>Two situations are left</strong>: ① you need <code>await</code> at
                the top level and the environment does not support it, so you wrap a{" "}
                <code>{"(async () => { … })()"}</code>; ② inside output generated by a
                bundler.
                <br />
                The <code>{"(async () => {…})()"}</code> inside <code>useEffect</code> in
                our fetch variant exercise is case ① — an effect cannot be async, so an
                IIFE opens an async scope for it.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `// 经典写法
(function () {
  var private = "外面看不到";
})();

// 现在真正还会用到的场合：需要一个异步作用域
useEffect(() => {
  (async () => {
    const res = await fetch(url);
    // ...
  })();
  return () => { /* 清理 */ };
}, [url]);

// 为什么要括号
function () {}();     // ✗ SyntaxError —— 被当成函数声明
(function () {})();   // ✓ 括号让它变成表达式
!function () {}();    // ✓ 一元运算符也行
void function () {}();// ✓`,
              { filename: "IIFE 与它今天的位置" },
            ),
          ],
        },
      ],
      transfer: [
        {
          signal: "问「解释一下闭包」",
          signalEn: "Asked to explain closure",
          reachFor: "函数记住定义时的作用域 + 举私有状态和防抖两个用途",
          reachForEn: "A function keeps the scope it was defined in; give two uses, private state and debounce",
        },
        {
          signal: "循环里的回调都拿到最后一个值",
          signalEn: "Every callback in a loop sees the last value",
          reachFor: "闭包共享同一个 var 绑定，换 let",
          reachForEn: "The closures share one var binding; use let",
        },
        {
          signal: "「React 里数值卡住不动」",
          signalEn: "A value in React never changes",
          reachFor: "过期闭包 —— 闭包捕获的是那次渲染的值",
          reachForEn: "A stale closure — it captured the value from that one render",
        },
        {
          signal: "要手写防抖/节流",
          signalEn: "Asked to write debounce or throttle by hand",
          reachFor: "返回函数 + 闭包存 timer + function 转发 this",
          reachForEn: "Return a function, keep the timer in the closure, and use a function expression so this is forwarded",
        },
        {
          signal: "声明前调用报 TypeError",
          signalEn: "Calling it before the declaration gives a TypeError",
          reachFor: "函数表达式，只提升了变量名",
          reachForEn: "It is a function expression; only the variable name was hoisted",
        },
        {
          signal: "声明前调用报 ReferenceError",
          signalEn: "Using it before the declaration gives a ReferenceError",
          reachFor: "let/const/class 的 TDZ",
          reachForEn: "The temporal dead zone of let, const and class",
        },
        {
          signal: "问纯函数有什么用",
          signalEn: "Asked what a pure function is good for",
          reachFor: "好测、可缓存、可并发；接到 React 渲染和 reducer",
          reachForEn: "Easy to test, safe to cache, safe to run in parallel; connect it to React rendering and to a reducer",
        },
        {
          signal: "对象方法里 this 是 undefined",
          signalEn: "this is undefined inside an object method",
          reachFor: "别用箭头函数写方法",
          reachForEn: "Do not write a method as an arrow function",
        },
      ],
      recap: [
        "函数声明整体提升，函数表达式只提升变量名；箭头函数没有自己的 this、arguments，不能 new。",
        "一等（函数能当值）→ 一阶（不碰函数）→ 高阶（收或返函数），这三题是一组。",
        "纯函数两条件：同输入同输出 + 无副作用；React 渲染函数和 Redux reducer 都必须纯。",
        "严格模式主要价值是禁隐式全局；ES 模块和 class 内部自动严格，不用手写。",
        "四种作用域：全局/函数/块/模块；块作用域只约束 let、const、class。",
        "let 也会提升，只是处于 TDZ 访问就抛错 —— 说「let 不提升」是错的。",
        "作用域链由内到外，且在定义时确定（词法作用域）；this 相反，是调用时确定。",
        "闭包 = 函数记住定义时的作用域；用途是私有状态、防抖、柯里化，以及 React Hooks 的全部基础。",
        "IIFE 当年是唯一的隔离手段，现在只剩「需要异步作用域」这一个真实场合。",
      ],
      recapEn: [
        "A function declaration is hoisted whole; for a function expression only the variable name is hoisted; an arrow function has no this and no arguments of its own, and cannot be called with new.",
        "First class (a function can be a value) → first order (does not touch functions) → higher order (takes or returns a function): these three questions belong together.",
        "A pure function has two conditions: the same input gives the same output, and there are no side effects; a React render function and a Redux reducer both have to be pure.",
        "The main value of strict mode is that it forbids accidental globals; ES modules and class bodies are already strict, so you do not write it there.",
        "There are four scopes: global, function, block and module; block scope only applies to let, const and class.",
        "let is hoisted too, it just sits in the temporal dead zone where reading it throws — saying that let is not hoisted is wrong.",
        "The scope chain goes from inside out and is fixed where the function is written (lexical scope); this is the opposite, it is decided when the function is called.",
        "A closure is a function that keeps the scope it was defined in; it is used for private state, debounce and currying, and it is the basis of every React hook.",
        "An IIFE used to be the only way to isolate variables; today the one real use left is when you need an async scope.",
      ],
    },
  ],
};
