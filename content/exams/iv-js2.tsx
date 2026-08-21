// 面试八股 —— JavaScript 下半：this 与 OOP、异步与事件循环、DOM 与工具链。
//
// 题目来自作者做过的题目，答案由 DrillLab 撰写，代码块一律 demo()（「示意」）。

import type { Module } from "../types";
import { demo } from "../helpers";

export const ivJsAsync: Module = {
  id: "iv-js-async",
  stage: "面试 · 第 3 部分",
  title: "JavaScript · this、异步与工具链",
  titleEn: "JavaScript · this, async and tooling",
  summary:
    "16 道题。事件循环那道是 JS 面试最能分层次的题 —— 说得出宏任务微任务的执行顺序就上一个档。this 与 call/apply/bind 是老题但仍必问，DOM 事件委托会连到 React 的合成事件。",
  summaryEn:
    "16 questions. The event loop question separates candidates more than any other JavaScript question: if you can state the order in which macrotasks and microtasks run, you move up a level. this with call/apply/bind is an old question that is still always asked, and DOM event delegation connects to React synthetic events.",
  lessons: [
    /* ============================================================
       this 与 OOP（3 题）
       ============================================================ */
    {
      id: "iv-js-this",
      title: "this 与面向对象三问",
      titleEn: "3 questions on this and object-oriented programming",
      blurb: "OOP、this 指向的四条规则、call/apply/bind。",
      blurbEn: "OOP, the four rules for what this points to, call/apply/bind.",
      minutes: 16,
      objectives: [
        "按优先级说出 this 指向的四条判定规则",
        "分清 call、apply、bind 三者的差别并手写一个 bind",
        "说明 JS 的原型继承和 class 的关系",
      ],
      objectivesEn: [
        "State the four rules that decide what this points to, in priority order",
        "Tell call, apply and bind apart, and write your own bind",
        "Explain how prototype inheritance in JavaScript relates to class",
      ],
      whyForAssessment:
        "this 是「给你一段代码问输出什么」的常客，而且答错就说明基本功不牢。手写 bind、手写 new、手写继承是现场编码题的高频三件套。这一组也是理解 React 类组件为什么要 bind 的前提。",
      whyForAssessmentEn:
        "this shows up whenever you are handed code and asked what it prints, and a wrong answer says the basics are not solid. Writing bind, writing new, and writing inheritance by hand are three frequent live coding tasks. This group is also what you need before you can explain why a React class component calls bind.",
      concepts: [
        {
          id: "q302",
          heading: "什么是面向对象编程",
          headingEn: "What is object-oriented programming?",
          lede: "#302 What is Object-Oriented Programming (OOP)",
          body: (
            <>
              <p>
                <strong>一句话：</strong>把数据和操作数据的方法
                <strong>打包在一起</strong>，用对象来组织程序。
              </p>
              <p>
                <strong>四个特征（背下来）：</strong>
              </p>
              <ul>
                <li>
                  <strong>封装</strong>—— 内部细节藏起来，
                  只暴露必要的接口。JS 里用闭包或
                  <code>#private</code> 字段实现。
                </li>
                <li>
                  <strong>继承</strong>—— 子类复用父类的能力。
                </li>
                <li>
                  <strong>多态</strong>—— 同一个方法名，
                  不同对象有不同行为。
                </li>
                <li>
                  <strong>抽象</strong>—— 只关心「能做什么」，
                  不关心「怎么做的」。
                </li>
              </ul>
              <p>
                <strong>JS 的特别之处（这才是考点）：</strong>
                它是<strong>基于原型（prototype）的</strong>，
                不是基于类的。
                <code>class</code> 是 ES6 加的
                <strong>语法糖</strong>，
                底下还是原型链 ——
                <code>class A extends B</code> 编译后就是设置
                <code>A.prototype.__proto__ = B.prototype</code>。
              </p>
              <p>
                <strong>原型链一句话：</strong>
                访问一个属性时，对象自己没有就去
                <code>__proto__</code> 上找，
                一层层往上直到 <code>null</code>。
                <strong>和作用域链是一个套路，
                只是一个查变量、一个查属性。</strong>
              </p>
              <p>
                <strong>会追问：</strong>
                「React 为什么从 class 转向函数组件？」——
                因为 UI 更适合用「输入 → 输出」来描述，
                而不是「一个有生命周期的对象」；
                而且 class 里 <code>this</code>
                的绑定问题、逻辑按生命周期而不是按关注点拆分，
                都是实际痛点（见 #322）。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> bundle data together with the methods
                that act on it, and organise the program around objects.
              </p>
              <p>
                <strong>Four pillars — memorise these:</strong>
              </p>
              <ul>
                <li>
                  <strong>Encapsulation</strong> — hide the internals, expose only the
                  interface callers need. In JS you get it from closures or{" "}
                  <code>#private</code> fields.
                </li>
                <li>
                  <strong>Inheritance</strong> — a subclass reuses what the parent can
                  already do.
                </li>
                <li>
                  <strong>Polymorphism</strong> — same method name, different behaviour
                  per object.
                </li>
                <li>
                  <strong>Abstraction</strong> — you care what it can do, not how it
                  does it.
                </li>
              </ul>
              <p>
                <strong>What makes JS different, and this is the real question:</strong>{" "}
                it is <strong>prototype-based</strong>, not class-based.{" "}
                <code>class</code> is <strong>syntax sugar</strong> added in ES6; the
                prototype chain is still underneath —{" "}
                <code>class A extends B</code> compiles down to setting{" "}
                <code>A.prototype.__proto__ = B.prototype</code>.
              </p>
              <p>
                <strong>The prototype chain in one line:</strong> read a property, and
                if the object does not have it the lookup walks up{" "}
                <code>__proto__</code> one level at a time until <code>null</code>.{" "}
                <strong>
                  Same idea as the scope chain — one looks up variables, the other looks
                  up properties.
                </strong>
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Why did React move from classes to
                function components?&rdquo; — because UI is easier to describe as
                &ldquo;input → output&rdquo; than as an object with a lifecycle. On top
                of that, <code>this</code> binding and code split by lifecycle instead
                of by concern were real, daily pain (see #322).
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `class Animal {
  #secret = "私有字段，外部访问不到";     // 封装
  constructor(name) { this.name = name; }
  speak() { return \`\${this.name} 发出声音\`; }
}

class Dog extends Animal {
  speak() { return \`\${this.name} 汪汪\`; }   // 多态：覆盖父类方法
}

new Dog("旺财").speak();          // "旺财 汪汪"

// class 只是语法糖，底下是原型链
Object.getPrototypeOf(Dog.prototype) === Animal.prototype;   // true
new Dog("x") instanceof Animal;                              // true`,
              {
                filename: "四个特征与原型链",
                filenameEn: "The four traits and the prototype chain",
                codeEn: `class Animal {
  #secret = "a private field, unreachable from outside";   // encapsulation
  constructor(name) { this.name = name; }
  speak() { return \`\${this.name} 发出声音\`; }   // "<name> makes a sound"
}

class Dog extends Animal {
  speak() { return \`\${this.name} 汪汪\`; }   // polymorphism: overrides the parent, and barks
}

new Dog("旺财").speak();          // the dog's name, then its bark

// class is only syntax sugar; a prototype chain sits underneath
Object.getPrototypeOf(Dog.prototype) === Animal.prototype;   // true
new Dog("x") instanceof Animal;                              // true`,
              },
            ),
          ],
        },
        {
          id: "q303",
          heading: "this 指向什么",
          headingEn: "What does this refer to?",
          lede: "#303 What does 'this' refer to",
          body: (
            <>
              <p>
                <strong>一句话：</strong>
                <code>this</code> 是<strong>调用时决定的</strong>，
                不是定义时。看<strong>「谁调用的」</strong>。
              </p>
              <p>
                <strong>四条规则，按优先级从高到低</strong>——
                这个顺序是标准答案：
              </p>
              <ol>
                <li>
                  <strong><code>new</code> 绑定</strong>——
                  <code>new Foo()</code>，
                  <code>this</code> 是新创建的对象。
                </li>
                <li>
                  <strong>显式绑定</strong>——
                  <code>call</code> / <code>apply</code> /
                  <code>bind</code> 指定的那个。
                </li>
                <li>
                  <strong>隐式绑定</strong>——
                  <code>obj.fn()</code>，
                  <code>this</code> 是 <code>obj</code>
                  （<strong>看点号左边</strong>）。
                </li>
                <li>
                  <strong>默认绑定</strong>—— 都不满足时，
                  严格模式下是 <code>undefined</code>，
                  否则是 <code>window</code> / <code>global</code>。
                </li>
              </ol>
              <p>
                <strong>箭头函数是例外，它不参与这四条</strong>——
                它<strong>没有自己的 <code>this</code></strong>，
                用的是定义时外层作用域的 <code>this</code>，
                而且 <code>call</code> / <code>bind</code>
                <strong>改不了它</strong>。
              </p>
              <p>
                <strong>最经典的坑：隐式丢失。</strong>
                <code>const fn = obj.method</code> 之后单独调
                <code>fn()</code>，点号没了，
                <code>this</code> 就丢了。
                把方法当回调传出去（
                <code>setTimeout(obj.method)</code>、
                <code>onClick={"{this.handle}"}</code>）
                都是这个问题 ——
                <strong>这就是 React 类组件必须在构造器里
                <code>bind</code> 的原因</strong>。
              </p>
              <p>
                <strong>会追问：</strong>
                「DOM 事件回调里 <code>this</code> 是什么？」——
                普通函数是<strong>绑定事件的那个元素</strong>
                （等于 <code>e.currentTarget</code>），
                箭头函数则是外层的 <code>this</code>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> <code>this</code> is decided{" "}
                <strong>when the function is called</strong>, not where it was written.
                Look at <strong>who called it</strong>.
              </p>
              <p>
                <strong>Four rules, highest priority first</strong> — this order is the
                model answer:
              </p>
              <ol>
                <li>
                  <strong>
                    <code>new</code> binding
                  </strong>{" "}
                  — with <code>new Foo()</code>, <code>this</code> is the object that
                  was just created.
                </li>
                <li>
                  <strong>Explicit binding</strong> — whatever you handed to{" "}
                  <code>call</code> / <code>apply</code> / <code>bind</code>.
                </li>
                <li>
                  <strong>Implicit binding</strong> — <code>obj.fn()</code> makes{" "}
                  <code>this</code> the <code>obj</code> (
                  <strong>look left of the dot</strong>).
                </li>
                <li>
                  <strong>Default binding</strong> — when none of the above applies:{" "}
                  <code>undefined</code> in strict mode, otherwise <code>window</code> /{" "}
                  <code>global</code>.
                </li>
              </ol>
              <p>
                <strong>
                  Arrow functions are the exception; they do not play by those four
                  rules
                </strong>{" "}
                — an arrow{" "}
                <strong>
                  has no <code>this</code> of its own
                </strong>
                , it uses the <code>this</code> of the scope it was defined in, and{" "}
                <code>call</code> / <code>bind</code>{" "}
                <strong>cannot change that</strong>.
              </p>
              <p>
                <strong>The classic trap: the implicit binding gets lost.</strong> Do{" "}
                <code>const fn = obj.method</code> and then call <code>fn()</code> on
                its own — the dot is gone, so <code>this</code> is gone. Handing a
                method off as a callback (<code>setTimeout(obj.method)</code>,{" "}
                <code>onClick={"{this.handle}"}</code>) is the same bug —{" "}
                <strong>
                  and it is exactly why React class components had to <code>bind</code>{" "}
                  in the constructor
                </strong>
                .
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;What is <code>this</code> inside a
                DOM event handler?&rdquo; — in a normal function it is{" "}
                <strong>the element the listener is attached to</strong> (the same as{" "}
                <code>e.currentTarget</code>); in an arrow function it is the outer{" "}
                <code>this</code>.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `const obj = {
  name: "obj",
  show() { console.log(this.name); },
};

obj.show();                    // "obj"      隐式绑定，看点号左边
const f = obj.show;
f();                           // undefined  隐式丢失
f.call({ name: "call" });      // "call"     显式绑定
setTimeout(obj.show, 0);       // undefined  传出去就丢了
setTimeout(() => obj.show(), 0); // "obj"    包一层就保住了

// 箭头函数不参与规则，call 也改不了
const arrow = () => console.log(this);
arrow.call({ a: 1 });          // 还是外层的 this

// React 类组件为什么要 bind
class Btn extends React.Component {
  constructor(p) {
    super(p);
    this.handle = this.handle.bind(this);   // 不 bind，onClick 里 this 就是 undefined
  }
  handle() { console.log(this.props); }
}`,
              {
                filename: "四条规则与隐式丢失",
                filenameEn: "The four rules, and losing the implicit binding",
                codeEn: `const obj = {
  name: "obj",
  show() { console.log(this.name); },
};

obj.show();                    // "obj"      implicit binding: look left of the dot
const f = obj.show;
f();                           // undefined  the implicit binding is lost
f.call({ name: "call" });      // "call"     explicit binding
setTimeout(obj.show, 0);       // undefined  pass it out and the binding is gone
setTimeout(() => obj.show(), 0); // "obj"    one wrapper keeps it

// An arrow function ignores these rules, and call cannot change it either
const arrow = () => console.log(this);
arrow.call({ a: 1 });          // still the outer this

// Why a React class component needs bind
class Btn extends React.Component {
  constructor(p) {
    super(p);
    this.handle = this.handle.bind(this);   // without bind, this is undefined in onClick
  }
  handle() { console.log(this.props); }
}`,
              },
            ),
          ],
        },
        {
          id: "q304",
          heading: "call、apply、bind 的区别",
          headingEn: "What is the difference between call, apply and bind?",
          lede: "#304 What are the differences between call, apply & bind",
          body: (
            <>
              <p>
                <strong>一句话：</strong>三个都是改
                <code>this</code>。
                <strong><code>call</code> 和 <code>apply</code>
                立即执行，<code>bind</code> 返回一个新函数</strong>；
                <code>call</code> 参数一个个传，
                <code>apply</code> 传数组。
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>是否立即执行</th>
                      <th>参数形式</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>fn.call(ctx, a, b)</code></td>
                      <td>立即</td>
                      <td>逐个（<strong>C</strong>omma）</td>
                    </tr>
                    <tr>
                      <td><code>fn.apply(ctx, [a, b])</code></td>
                      <td>立即</td>
                      <td>数组（<strong>A</strong>rray）</td>
                    </tr>
                    <tr>
                      <td><code>fn.bind(ctx, a)</code></td>
                      <td><strong>不执行</strong>，返回新函数</td>
                      <td>逐个，且<strong>可以只绑一部分</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>记法：</strong>
                <strong>A</strong>pply 收 <strong>A</strong>rray，
                <strong>C</strong>all 用 <strong>C</strong>omma。
              </p>
              <p>
                <strong>bind 的两个额外性质（追问点）：</strong>
              </p>
              <ul>
                <li>
                  <strong>能预置参数</strong>—— 所以它就是偏函数
                  （见 #299）。
                </li>
                <li>
                  <strong>绑过一次就锁死了</strong>——
                  再 <code>bind</code> 或 <code>call</code>
                  都改不回来。
                  <strong>但 <code>new</code> 能突破它</strong>，
                  因为 <code>new</code> 优先级最高。
                </li>
              </ul>
              <p>
                <strong>还会追问：</strong>
                「<code>apply</code> 现在还有用吗？」——
                展开语法出来后大部分被
                <code>fn(...args)</code> 取代了。
                <strong>但转发不定参数时还常用</strong>：
                <code>fn.apply(this, args)</code>
                （防抖里就是这么写的，因为要同时转发
                <code>this</code> 和 <code>args</code>）。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> all three change <code>this</code>.{" "}
                <strong>
                  <code>call</code> and <code>apply</code> run the function right away,{" "}
                  <code>bind</code> hands you back a new one
                </strong>
                ; <code>call</code> takes its arguments one by one, <code>apply</code>{" "}
                takes an array.
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Runs immediately?</th>
                      <th>Argument form</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>fn.call(ctx, a, b)</code></td>
                      <td>Yes</td>
                      <td>One by one (<strong>C</strong>omma)</td>
                    </tr>
                    <tr>
                      <td><code>fn.apply(ctx, [a, b])</code></td>
                      <td>Yes</td>
                      <td>An array (<strong>A</strong>rray)</td>
                    </tr>
                    <tr>
                      <td><code>fn.bind(ctx, a)</code></td>
                      <td><strong>No</strong> — you get a new function</td>
                      <td>
                        One by one, and <strong>you may bind only some of them</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>How to remember it:</strong> <strong>A</strong>pply takes an{" "}
                <strong>A</strong>rray, <strong>C</strong>all takes{" "}
                <strong>C</strong>ommas.
              </p>
              <p>
                <strong>Two extra properties of bind they will probe:</strong>
              </p>
              <ul>
                <li>
                  <strong>It can preset arguments</strong> — which makes it partial
                  application (see #299).
                </li>
                <li>
                  <strong>Bind once and it is locked</strong> — another{" "}
                  <code>bind</code> or a <code>call</code> cannot change it back.{" "}
                  <strong>
                    But <code>new</code> breaks through
                  </strong>
                  , because <code>new</code> has the highest priority.
                </li>
              </ul>
              <p>
                <strong>Another follow-up:</strong> &ldquo;Is <code>apply</code> still
                useful?&rdquo; — spread syntax replaced most of it with{" "}
                <code>fn(...args)</code>.{" "}
                <strong>
                  It is still the normal way to forward an unknown argument list
                </strong>
                : <code>fn.apply(this, args)</code> — that is how debounce is written,
                because you have to forward <code>this</code> and <code>args</code> at
                the same time.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `function greet(greeting, mark) {
  return \`\${greeting}, \${this.name}\${mark}\`;
}
const who = { name: "小明" };

greet.call(who, "你好", "！");       // "你好, 小明！"
greet.apply(who, ["你好", "！"]);    // 同上，参数是数组
const hi = greet.bind(who, "你好"); // 返回新函数，还预置了第一个参数
hi("？");                            // "你好, 小明？"

// 手写一个 bind（高频现场题）
Function.prototype.myBind = function (ctx, ...preset) {
  const fn = this;
  return function bound(...args) {
    // new 调用时 this 是新对象，此时不该用 ctx —— 这是 bind 的规范行为
    const isNew = this instanceof bound;
    return fn.apply(isNew ? this : ctx, [...preset, ...args]);
  };
};`,
              {
                filename: "三者对比与手写 bind",
                filenameEn: "The three compared, and bind written by hand",
                codeEn: `function greet(greeting, mark) {
  return \`\${greeting}, \${this.name}\${mark}\`;
}
const who = { name: "小明" };

greet.call(who, "你好", "！");       // the greeting, then the name, then the mark
greet.apply(who, ["你好", "！"]);    // the same, but the arguments arrive as an array
const hi = greet.bind(who, "你好"); // returns a new function with the first argument preset
hi("？");                            // the same string, ending in a question mark

// Write bind by hand (a very common live-coding question)
Function.prototype.myBind = function (ctx, ...preset) {
  const fn = this;
  return function bound(...args) {
    // With new, this is the new object and ctx must be ignored —— the spec requires it
    const isNew = this instanceof bound;
    return fn.apply(isNew ? this : ctx, [...preset, ...args]);
  };
};`,
                explanation:
                  "手写 bind 的加分项就是那个 isNew 判断：规范规定 new 一个 bound 函数时，绑定的 this 应该被忽略。多数人会漏。",
                explanationEn:
                  "What earns extra credit when you write bind by hand is that isNew check: the spec says that when a bound function is called with new, the bound this must be ignored. Most people leave it out.",
              },
            ),
          ],
        },
      ],
      transfer: [
        {
          signal: "「this 是 undefined」",
          signalEn: "this is undefined",
          reachFor: "隐式丢失 —— 点号没了；用 bind 或箭头包一层",
          reachForEn: "The implicit binding was lost — the dot is gone; use bind, or wrap it in an arrow function",
        },
        {
          signal: "给你代码问 this 是什么",
          signalEn: "Handed code and asked what this is",
          reachFor: "按 new > 显式 > 隐式 > 默认 四条走；箭头看外层",
          reachForEn: "Work through the four rules in order: new > explicit > implicit > default; for an arrow function look at the enclosing scope",
        },
        {
          signal: "要转发不定参数和 this",
          signalEn: "You need to forward this and an unknown number of arguments",
          reachFor: "fn.apply(this, args)",
          reachForEn: "fn.apply(this, args)",
        },
        {
          signal: "问 class 和原型的关系",
          signalEn: "Asked how class relates to prototypes",
          reachFor: "class 是语法糖，底下是原型链",
          reachForEn: "class is syntax sugar; what it builds is a prototype chain",
        },
      ],
      recap: [
        "OOP 四特征：封装、继承、多态、抽象；JS 是原型继承，class 只是语法糖。",
        "this 四条规则按优先级：new > call/apply/bind > obj.fn() > 默认；箭头函数不参与。",
        "隐式丢失是最常见的坑，也是 React 类组件要 bind 的原因。",
        "Apply 收 Array、Call 用 Comma；bind 返回新函数、能预置参数、绑一次锁死但 new 能突破。",
      ],
      recapEn: [
        "OOP has four traits: encapsulation, inheritance, polymorphism and abstraction; JavaScript inherits through prototypes, and class is only syntax sugar.",
        "The four rules for this, in priority order: new > call/apply/bind > obj.fn() > default; an arrow function follows none of them.",
        "Losing the implicit binding is the most common mistake, and it is why a React class component has to call bind.",
        "Apply takes an Array, Call takes Commas; bind returns a new function, can preset arguments, and binds once for good — only new can override it.",
      ],
    },

    /* ============================================================
       异步与事件循环（6 题）
       ============================================================ */
    {
      id: "iv-js-loop",
      title: "异步与事件循环六问",
      titleEn: "6 questions on async and the event loop",
      blurb: "事件循环、async/await vs Promise、回调地狱、finally、错误处理、异步方案总览。",
      blurbEn:
        "The event loop, async/await vs Promise, callback hell, finally, error handling, and an overview of the async options.",
      minutes: 24,
      objectives: [
        "说出宏任务和微任务的执行顺序，并推出一段代码的输出",
        "说清 async/await 只是 Promise 的语法糖以及它带来的实际差别",
        "在四种并发场景下选对 Promise.all / allSettled / race / any",
        "说明为什么 try/catch 抓不到异步错误",
      ],
      objectivesEn: [
        "State the order in which macrotasks and microtasks run, and work out what a piece of code prints",
        "Explain that async/await is only syntax sugar over Promise, and what it changes in practice",
        "Pick the right one of Promise.all / allSettled / race / any in four concurrency cases",
        "Explain why try/catch does not catch an async error",
      ],
      whyForAssessment:
        "事件循环是最能分出层次的一道题：只会说「JS 是单线程、异步靠回调」是及格，能背出「同步 → 微任务 → 渲染 → 宏任务」并解释 await 之后的代码是微任务，才是好答案。Promise 的四个静态方法几乎必被追问。",
      whyForAssessmentEn:
        "The event loop question separates candidates more than any other. Saying that JavaScript is single threaded and does async work through callbacks is a pass. A good answer names the order — synchronous code, then microtasks, then paint, then one macrotask — and explains that the code after await runs as a microtask. The four static methods on Promise are almost always the follow-up.",
      concepts: [
        {
          id: "q305",
          heading: "事件循环是怎么工作的",
          headingEn: "How does the event loop work?",
          lede: "#305 What does the event loop",
          body: (
            <>
              <p>
                <strong>一句话：</strong>JS
                <strong>只有一个主线程</strong>，
                事件循环负责在「调用栈空了」的时候，
                从任务队列里取下一个任务放上去执行。
              </p>
              <p>
                <strong>完整的一轮（这段是标准答案）：</strong>
              </p>
              <ol>
                <li>执行完当前的同步代码（调用栈清空）。</li>
                <li>
                  <strong>把微任务队列全部清空</strong>——
                  注意是「全部」，而且清微任务时新产生的微任务
                  <strong>也在这一轮里执行完</strong>。
                </li>
                <li>（浏览器）需要的话渲染一帧。</li>
                <li>取<strong>一个</strong>宏任务执行，回到第 2 步。</li>
              </ol>
              <p>
                <strong>谁是微任务：</strong>
                <code>Promise.then/catch/finally</code>、
                <code>await</code> 之后的代码、
                <code>queueMicrotask</code>、
                <code>MutationObserver</code>。
                <br />
                <strong>谁是宏任务：</strong>
                <code>setTimeout</code> / <code>setInterval</code>、
                DOM 事件回调、网络回调、
                <code>requestAnimationFrame</code>
                （严格说它在渲染前，单独一档）。
              </p>
              <p>
                <strong>一句话记住优先级：
                <code>Promise</code> 一定比
                <code>setTimeout</code> 先跑</strong>，
                即使 <code>setTimeout(…, 0)</code>。
              </p>
              <p>
                <strong>会追问：</strong>
                「异步是谁做的？」—— 不是引擎，
                是<strong>宿主环境</strong>（浏览器的 Web API /
                Node 的 libuv）。引擎只管执行 JS。
                这条和 #276 是一组。
                <br />
                「<code>setTimeout(fn, 0)</code>
                真的 0 毫秒吗？」——
                不是，浏览器最小约 4ms，
                而且要等主线程空闲。
                <strong>所以它只是「尽快，但不是现在」。</strong>
              </p>
              <p>
                <strong>Node 的差别</strong>（问到就是加分）：
                Node 的宏任务分了六个阶段
                （timers / pending / poll / check / close…），
                <code>setImmediate</code> 在 check 阶段，
                <code>process.nextTick</code>
                <strong>比所有微任务都优先</strong>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> JS has{" "}
                <strong>one main thread</strong>, and the event loop&rsquo;s job is to
                pull the next task off a queue and put it on the stack whenever the call
                stack goes empty.
              </p>
              <p>
                <strong>One full turn — this part is the model answer:</strong>
              </p>
              <ol>
                <li>Run the synchronous code to the end (the call stack empties).</li>
                <li>
                  <strong>Drain the microtask queue completely</strong> — note
                  &ldquo;completely&rdquo;: microtasks queued while draining{" "}
                  <strong>also run inside this same turn</strong>.
                </li>
                <li>(In a browser) paint a frame if one is needed.</li>
                <li>
                  Take <strong>one</strong> macrotask, run it, go back to step 2.
                </li>
              </ol>
              <p>
                <strong>Microtasks:</strong> <code>Promise.then/catch/finally</code>, the
                code after an <code>await</code>, <code>queueMicrotask</code>,{" "}
                <code>MutationObserver</code>.
                <br />
                <strong>Macrotasks:</strong> <code>setTimeout</code> /{" "}
                <code>setInterval</code>, DOM event handlers, network callbacks,{" "}
                <code>requestAnimationFrame</code> (strictly it runs just before paint,
                in a class of its own).
              </p>
              <p>
                <strong>
                  The priority in one line: a <code>Promise</code> always runs before a{" "}
                  <code>setTimeout</code>
                </strong>
                , even <code>setTimeout(…, 0)</code>.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Who actually does the async
                work?&rdquo; — not the engine, the{" "}
                <strong>host environment</strong> (the browser&rsquo;s Web APIs, libuv
                in Node). The engine only runs JS. This one pairs with #276.
                <br />
                &ldquo;Is <code>setTimeout(fn, 0)</code> really zero
                milliseconds?&rdquo; — no. Browsers clamp it to roughly 4ms, and it still
                waits for a free main thread.{" "}
                <strong>
                  So it means &ldquo;as soon as possible, but not now&rdquo;.
                </strong>
              </p>
              <p>
                <strong>How Node differs</strong> (a bonus point if it comes up): Node
                splits macrotasks into six phases (timers / pending / poll / check /
                close…), <code>setImmediate</code> lands in the check phase, and{" "}
                <code>process.nextTick</code>{" "}
                <strong>jumps ahead of every microtask</strong>.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `console.log("1 同步");

setTimeout(() => console.log("2 宏任务"), 0);

Promise.resolve().then(() => console.log("3 微任务"));

(async () => {
  console.log("4 同步（await 之前是同步的）");
  await null;
  console.log("5 微任务（await 之后）");
})();

console.log("6 同步");

// 输出：1 同步 -> 4 同步 -> 6 同步 -> 3 微任务 -> 5 微任务 -> 2 宏任务
//
// 关键两点：
//   · async 函数体在遇到第一个 await 之前是同步执行的
//   · await 之后的代码等价于 .then 里的代码，是微任务`,
              {
                filename: "必须能推出来的那道题",
                filenameEn: "The question you have to be able to work out",
                codeEn: `console.log("1 sync");

setTimeout(() => console.log("2 macrotask"), 0);

Promise.resolve().then(() => console.log("3 microtask"));

(async () => {
  console.log("4 sync (everything before await is sync)");
  await null;
  console.log("5 microtask (after await)");
})();

console.log("6 sync");

// Output: 1 sync -> 4 sync -> 6 sync -> 3 microtask -> 5 microtask -> 2 macrotask
//
// The two key points:
//   · the body of an async function runs synchronously until the first await
//   · the code after await is the same as code inside .then, so it is a microtask`,
                explanation:
                  "面试给的题基本是这个变体。抓住两条：同步先跑完；微任务在宏任务前，且一次清空。",
                explanationEn:
                  "The question you get in an interview is almost always a variant of this one. Hold on to two rules: all synchronous code runs first; microtasks run before macrotasks, and the whole microtask queue is drained at once.",
              },
            ),
          ],
        },
        {
          id: "q306",
          heading: "async/await vs Promise",
          lede: "#306 Async/await vs Promise",
          body: (
            <>
              <p>
                <strong>一句话：</strong><code>async/await</code>
                是 Promise 的<strong>语法糖</strong>——
                同一套机制，但把「链式回调」写成了
                「像同步一样往下读」。
                <strong><code>async</code> 函数
                永远返回一个 Promise。</strong>
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th><code>.then()</code> 链</th>
                      <th><code>async/await</code></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>可读性</td>
                      <td>嵌套一深就难读</td>
                      <td><strong>线性，好读</strong></td>
                    </tr>
                    <tr>
                      <td>错误处理</td>
                      <td><code>.catch()</code></td>
                      <td>
                        普通 <code>try/catch</code>——
                        <strong>和同步代码统一了</strong>
                      </td>
                    </tr>
                    <tr>
                      <td>调试</td>
                      <td>断点难打，栈信息乱</td>
                      <td>能逐行断点，栈清楚</td>
                    </tr>
                    <tr>
                      <td>中间变量</td>
                      <td>要靠嵌套或额外传参才能共享</td>
                      <td>就是普通局部变量</td>
                    </tr>
                    <tr>
                      <td>并发</td>
                      <td>天然并行（先建好再 all）</td>
                      <td>
                        <strong>容易写成串行</strong>——
                        这是最常见的性能错误
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>那个「容易写成串行」的坑值得单独说</strong>：
                两个互不依赖的请求，
                写成两行 <code>await</code>
                就变成了「等第一个回来再发第二个」，
                总耗时是两者之和。
                <strong>正确做法是先都发出去，再一起
                <code>await Promise.all</code></strong>。
              </p>
              <p>
                <strong>会追问：</strong>
                「什么时候还是用 <code>.then</code> 更好？」——
                只需要一步、不需要中间变量时；
                或者<strong>要故意不等</strong>（fire and forget）。
                另外 <code>.then</code>
                在需要把 Promise 存起来传递时更自然。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> <code>async/await</code> is{" "}
                <strong>syntax sugar</strong> over Promises — the same machinery, but a
                chain of callbacks now reads straight down like synchronous code.{" "}
                <strong>
                  An <code>async</code> function always returns a Promise.
                </strong>
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>
                        A <code>.then()</code> chain
                      </th>
                      <th><code>async/await</code></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Readability</td>
                      <td>Hard to follow the moment it nests</td>
                      <td><strong>Linear, easy to read</strong></td>
                    </tr>
                    <tr>
                      <td>Error handling</td>
                      <td><code>.catch()</code></td>
                      <td>
                        Plain <code>try/catch</code> —{" "}
                        <strong>the same as synchronous code</strong>
                      </td>
                    </tr>
                    <tr>
                      <td>Debugging</td>
                      <td>Breakpoints are awkward, stacks are a mess</td>
                      <td>Step line by line, clean stacks</td>
                    </tr>
                    <tr>
                      <td>Intermediate values</td>
                      <td>Shared only by nesting or passing them along</td>
                      <td>Just ordinary local variables</td>
                    </tr>
                    <tr>
                      <td>Concurrency</td>
                      <td>Parallel by nature (build them, then all)</td>
                      <td>
                        <strong>Easy to make serial by accident</strong> — the most
                        common performance mistake there is
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>
                  That &ldquo;serial by accident&rdquo; trap is worth its own sentence
                </strong>
                : two requests that do not depend on each other, written as two{" "}
                <code>await</code> lines, turn into &ldquo;wait for the first, then send
                the second&rdquo;, so the total is the sum of both.{" "}
                <strong>
                  Fire them both off first, then <code>await Promise.all</code>
                </strong>
                .
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;When is <code>.then</code> still the
                better choice?&rdquo; — for a single step with no intermediate values,
                or when you <strong>deliberately do not want to wait</strong> (fire and
                forget). <code>.then</code> also reads better when you are storing a
                Promise and passing it around.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `// ✗ 串行：总耗时 = a + b
const user = await fetchUser();      // 等 200ms
const posts = await fetchPosts();    // 再等 200ms  -> 共 400ms

// ✓ 并行：总耗时 = max(a, b)
const [user, posts] = await Promise.all([fetchUser(), fetchPosts()]);
//                                       ↑ 两个请求同时发出去   -> 共 200ms

// 有依赖时串行才是对的
const user = await fetchUser();
const posts = await fetchPosts(user.id);   // 必须先有 user.id`,
              { filename: "async/await 最常见的性能错误" },
            ),
          ],
        },
        {
          id: "q307",
          heading: "什么是回调地狱",
          headingEn: "What is callback hell?",
          lede: "#307 What is callback hell",
          body: (
            <>
              <p>
                <strong>一句话：</strong>异步一步依赖上一步时，
                回调套回调，缩进越来越深，
                形成一个横着的三角形 ——
                也叫「厄运金字塔」。
              </p>
              <p>
                <strong>它真正的问题不只是难看，有三条：</strong>
              </p>
              <ul>
                <li>
                  <strong>错误处理要写 n 遍。</strong>
                  每一层都得判 <code>if (err)</code>，
                  漏一个就静默失败。
                </li>
                <li>
                  <strong>没法组合。</strong>
                  想改成「这两步并行」几乎要重写。
                </li>
                <li>
                  <strong>控制流全靠缩进表达</strong>，
                  加一步要改一堆括号。
                </li>
              </ul>
              <p>
                <strong>怎么解，按历史顺序：</strong>
                命名函数拆平 → Promise 链
                （把嵌套变成链式，错误集中到一个
                <code>.catch</code>）→
                <code>async/await</code>（彻底变线性）。
              </p>
              <p>
                <strong>会追问：</strong>
                「Promise 解决了回调地狱的哪个问题？」——
                <strong>主要是「错误处理」和「组合」</strong>，
                缩进只是顺带。
                能这么答说明你理解本质，
                而不是「Promise 让代码变平了」这种表面回答。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> when each async step depends on the last,
                callbacks nest inside callbacks, the indentation keeps growing, and you
                end up with a sideways triangle — also called the pyramid of doom.
              </p>
              <p>
                <strong>
                  The real damage is not that it looks bad. There are three problems:
                </strong>
              </p>
              <ul>
                <li>
                  <strong>Error handling gets written n times.</strong> Every level needs
                  its own <code>if (err)</code>, and one missed check is a silent
                  failure.
                </li>
                <li>
                  <strong>Nothing composes.</strong> Making two of those steps run in
                  parallel means rewriting nearly all of it.
                </li>
                <li>
                  <strong>Control flow is expressed only by indentation</strong>, so
                  inserting a step means shuffling a pile of braces.
                </li>
              </ul>
              <p>
                <strong>The fixes, in historical order:</strong> pull the callbacks out
                into named functions → a Promise chain (nesting becomes chaining, errors
                collapse into one <code>.catch</code>) → <code>async/await</code>, which
                makes it fully linear.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Which part of callback hell did
                Promises actually solve?&rdquo; —{" "}
                <strong>mostly error handling and composition</strong>; the indentation
                came along for the ride. Answering that way shows you understand the
                substance, not just &ldquo;Promises flatten the code&rdquo;.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `// 回调地狱
getUser(id, (err, user) => {
  if (err) return handle(err);
  getPosts(user.id, (err, posts) => {
    if (err) return handle(err);            // 又来一遍
    getComments(posts[0].id, (err, comments) => {
      if (err) return handle(err);          // 再来一遍
      render(comments);
    });
  });
});

// async/await
try {
  const user = await getUser(id);
  const posts = await getPosts(user.id);
  const comments = await getComments(posts[0].id);
  render(comments);
} catch (err) {
  handle(err);              // 一处兜住全部
}`,
              { filename: "同一段逻辑的两种写法" },
            ),
          ],
        },
        {
          id: "q309",
          heading: "Promise 链里的 finally() 有什么用",
          headingEn: "What is finally() for in a Promise chain?",
          lede: "#309 What is the purpose of the finally() method in a Promise chain",
          body: (
            <>
              <p>
                <strong>一句话：</strong>
                <strong>无论成功还是失败都会执行</strong>，
                用来做收尾 —— 关 loading、
                释放资源、上报耗时。
              </p>
              <p>
                <strong>三个性质要说清：</strong>
              </p>
              <ul>
                <li>
                  <strong>拿不到值也拿不到错误</strong>——
                  回调不接参数。它的定位就是「不关心结果的清理」。
                </li>
                <li>
                  <strong>透传</strong>—— 它把原来的值或错误
                  <strong>原样往下传</strong>，
                  不影响链的状态。
                  所以 <code>finally</code> 里 <code>return</code>
                  一个值<strong>不会改变结果</strong>。
                </li>
                <li>
                  <strong>但它里面抛错会覆盖原来的结果</strong>——
                  这是唯一能改变链状态的方式。
                </li>
              </ul>
              <p>
                <strong>为什么这题值得问：</strong>因为它对应一个
                真实 bug —— 只在成功路径里
                <code>setLoading(false)</code>，
                出错时界面就永远卡在 Loading。
                <strong>我们那道 fetch 变式题的常见错误里就有这一条。</strong>
              </p>
              <p>
                <strong>会追问：</strong>
                「和 <code>try/catch/finally</code> 的
                <code>finally</code> 一样吗？」——
                语义一样，都是「一定执行」。
                <code>async/await</code> 里直接用
                <code>try/finally</code> 就行，不用
                <code>.finally()</code>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong>{" "}
                <strong>it runs whether the promise succeeded or failed</strong>, so it
                is where the cleanup goes — turn off loading, release resources, report
                how long it took.
              </p>
              <p>
                <strong>Three properties to state clearly:</strong>
              </p>
              <ul>
                <li>
                  <strong>It sees neither the value nor the error</strong> — the callback
                  takes no arguments. Its whole job is cleanup that does not care about
                  the result.
                </li>
                <li>
                  <strong>It passes through</strong> — the original value or error{" "}
                  <strong>continues down the chain unchanged</strong>, so the state of
                  the chain is untouched. A <code>return</code> inside{" "}
                  <code>finally</code> <strong>changes nothing</strong>.
                </li>
                <li>
                  <strong>But throwing inside it does override the result</strong> — that
                  is the only way it can change the chain.
                </li>
              </ul>
              <p>
                <strong>Why this question earns its place:</strong> it maps onto a real
                bug — call <code>setLoading(false)</code> only on the success path and
                the UI sits on Loading forever when the request fails.{" "}
                <strong>
                  That exact mistake is on the common-errors list for our fetch variant
                  question.
                </strong>
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Is it the same as the{" "}
                <code>finally</code> in <code>try/catch/finally</code>?&rdquo; — same
                meaning: it always runs. With <code>async/await</code> just use{" "}
                <code>try/finally</code>; you do not need <code>.finally()</code>.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `fetch(url)
  .then((r) => r.json())
  .then(setData)
  .catch(setError)
  .finally(() => setLoading(false));   // 成功失败都要关 loading

// 等价的 async 写法
try {
  const r = await fetch(url);
  setData(await r.json());
} catch (e) {
  setError(e.message);
} finally {
  setLoading(false);         // ← 放这里，别只放在 try 末尾
}

// finally 透传，return 不生效
Promise.resolve(1).finally(() => 99).then(console.log);   // 1，不是 99
// 但抛错会覆盖
Promise.resolve(1).finally(() => { throw new Error("x"); }).catch(e => console.log(e.message)); // "x"`,
              { filename: "finally 的三个性质" },
            ),
          ],
        },
        {
          id: "q310",
          heading: "错误处理怎么做",
          headingEn: "How do you handle errors?",
          lede: "#310 Error Handling",
          body: (
            <>
              <p>
                <strong>一句话：</strong>同步用
                <code>try/catch</code>，
                Promise 用 <code>.catch()</code>，
                <code>async/await</code> 用
                <code>try/catch</code>；
                <strong>最上层要有兜底</strong>。
              </p>
              <p>
                <strong>最重要的一条：
                <code>try/catch</code>
                抓不到「回调里」的异步错误。</strong>
                因为 <code>setTimeout</code>
                的回调是在<strong>另一轮事件循环</strong>里执行的，
                那时 <code>try</code> 块早就出栈了。
              </p>
              <p>
                <strong>四个层次的实践：</strong>
              </p>
              <ul>
                <li>
                  <strong>该抛就抛</strong>——
                  别把错误吞掉换成
                  <code>return null</code>，
                  调用方无法区分「没有」和「出错了」。
                </li>
                <li>
                  <strong>抛 <code>Error</code> 对象</strong>，
                  别抛字符串 —— 否则没有堆栈。
                  需要区分类型就
                  <code>class NotFoundError extends Error</code>。
                </li>
                <li>
                  <strong>只在能处理的地方 catch</strong>。
                  catch 了却什么都不做（
                  <code>{"catch (e) {}"}</code>）
                  是最坏的写法。
                </li>
                <li>
                  <strong>兜底</strong>——
                  浏览器 <code>window.onerror</code> +
                  <code>unhandledrejection</code>；
                  Node <code>process.on(&quot;uncaughtException&quot;)</code>；
                  React 用<strong>错误边界</strong>（见 #333）；
                  Express 用<strong>错误中间件</strong>。
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「fetch 的错误怎么处理？」——
                <strong>陷阱题</strong>。
                <code>fetch</code> 只在网络层失败时 reject，
                <strong>404 / 500 是 resolve 的</strong>，
                必须自己检查 <code>res.ok</code>。
                这也是 React 那门课里 fetch 变式题的第一个考点。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> <code>try/catch</code> for synchronous
                code, <code>.catch()</code> for Promises, <code>try/catch</code> again
                for <code>async/await</code>; and{" "}
                <strong>always keep a backstop at the very top</strong>.
              </p>
              <p>
                <strong>
                  The most important point: <code>try/catch</code> cannot catch an async
                  error thrown inside a callback.
                </strong>{" "}
                A <code>setTimeout</code> callback runs in{" "}
                <strong>a later turn of the event loop</strong>, and by then the{" "}
                <code>try</code> block is long off the stack.
              </p>
              <p>
                <strong>Four levels of practice:</strong>
              </p>
              <ul>
                <li>
                  <strong>Throw when you should throw</strong> — do not swallow the error
                  and hand back <code>return null</code>; the caller then cannot tell
                  &ldquo;not there&rdquo; from &ldquo;it broke&rdquo;.
                </li>
                <li>
                  <strong>
                    Throw an <code>Error</code> object
                  </strong>
                  , never a string — a string carries no stack. When callers need to tell
                  cases apart, write <code>class NotFoundError extends Error</code>.
                </li>
                <li>
                  <strong>Only catch where you can actually handle it.</strong> Catching
                  and then doing nothing (<code>{"catch (e) {}"}</code>) is the worst
                  thing you can write.
                </li>
                <li>
                  <strong>Keep a backstop</strong> — in the browser{" "}
                  <code>window.onerror</code> plus <code>unhandledrejection</code>; in
                  Node <code>process.on(&quot;uncaughtException&quot;)</code>; in React
                  an <strong>error boundary</strong> (see #333); in Express{" "}
                  <strong>error-handling middleware</strong>.
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;How do you handle errors from
                fetch?&rdquo; — <strong>this is a trick question</strong>.{" "}
                <code>fetch</code> only rejects when the network layer fails;{" "}
                <strong>404 and 500 both resolve</strong>, so you have to check{" "}
                <code>res.ok</code> yourself. That is also the first thing the fetch
                variant question in the React course tests.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `// ✗ 抓不到 —— 回调在下一轮事件循环里跑
try {
  setTimeout(() => { throw new Error("炸了"); }, 0);
} catch (e) {
  console.log("抓不到这里");
}

// ✓ 异步错误要在异步链里抓
try {
  await somethingAsync();
} catch (e) { /* ✓ */ }

// ✗ 吞掉错误，调用方分不清「没有」还是「出错」
async function getUser(id) {
  try { return await api.get(id); }
  catch { return null; }
}

// ✓ 让它抛，或者抛一个带类型的错误
class NotFoundError extends Error {}
if (!row) throw new NotFoundError(\`user \${id} 不存在\`);

// 兜底
window.addEventListener("unhandledrejection", (e) => report(e.reason));`,
              { filename: "四条实践" },
            ),
          ],
        },
        {
          id: "q311",
          heading: "怎么处理异步操作",
          headingEn: "How do you handle asynchronous operations?",
          lede: "#311 Handle asynchronous operations",
          body: (
            <>
              <p>
                <strong>一句话（按历史讲最清楚）：</strong>
                回调 → Promise → async/await，
                外加事件和 <code>for await…of</code>
                处理流式数据。
              </p>
              <p>
                <strong>但这题真正的考点是
                Promise 的四个静态方法怎么选</strong>，
                一定会追问：
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>方法</th>
                      <th>什么时候 resolve</th>
                      <th>用在哪</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>all</code></td>
                      <td>
                        <strong>全部成功</strong>才成功，
                        <strong>一个失败立刻失败</strong>
                      </td>
                      <td>几个都必须成功（页面必需的多个接口）</td>
                    </tr>
                    <tr>
                      <td><code>allSettled</code></td>
                      <td>
                        <strong>全部结束</strong>就成功，
                        不管成败
                      </td>
                      <td>
                        批量操作，要知道每一个的结果
                        （批量上传，报告哪几个失败了）
                      </td>
                    </tr>
                    <tr>
                      <td><code>race</code></td>
                      <td>
                        <strong>第一个结束的</strong>说话，
                        成功失败都算
                      </td>
                      <td>超时控制</td>
                    </tr>
                    <tr>
                      <td><code>any</code></td>
                      <td>
                        <strong>第一个成功的</strong>，
                        全失败才失败
                      </td>
                      <td>多个镜像源取最快能用的那个</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong><code>all</code> 的坑</strong>：
                它是 fail-fast 的 ——
                一个失败，其他已经在飞的请求
                <strong>不会被取消</strong>，
                而且你拿不到其他的结果。
                「批量操作要逐个报告」的场景该用
                <code>allSettled</code>。
              </p>
              <p>
                <strong>会追问：</strong>
                「怎么给一个请求加超时？」——
                <code>Promise.race</code>
                配一个定时 reject 的 Promise；
                更好的是用 <code>AbortController</code>，
                因为它能<strong>真的把请求掐掉</strong>，
                <code>race</code> 只是不等了。
                这两个的区别在我们那道 fetch 变式题里也讲过。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line, and history tells it best:</strong> callbacks →
                Promises → async/await, plus events and <code>for await…of</code> for
                streaming data.
              </p>
              <p>
                <strong>
                  But what this question is really after is how you pick among the four
                  static Promise methods
                </strong>
                , and they will ask:
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Method</th>
                      <th>When it resolves</th>
                      <th>Where you use it</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>all</code></td>
                      <td>
                        Succeeds only if <strong>all of them succeed</strong>, and{" "}
                        <strong>fails the instant one fails</strong>
                      </td>
                      <td>Everything must succeed (several calls the page needs)</td>
                    </tr>
                    <tr>
                      <td><code>allSettled</code></td>
                      <td>
                        Succeeds once <strong>everything has finished</strong>, win or
                        lose
                      </td>
                      <td>
                        Bulk work where you need each result (a batch upload, reporting
                        which ones failed)
                      </td>
                    </tr>
                    <tr>
                      <td><code>race</code></td>
                      <td>
                        <strong>Whoever finishes first</strong> speaks, success or failure
                      </td>
                      <td>Timeouts</td>
                    </tr>
                    <tr>
                      <td><code>any</code></td>
                      <td>
                        <strong>The first success</strong>; it fails only if all fail
                      </td>
                      <td>Several mirrors, take the fastest one that works</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>
                  The trap in <code>all</code>
                </strong>
                : it is fail-fast — one rejection and the other requests already in
                flight <strong>are not cancelled</strong>, and you never see their
                results. When bulk work has to report item by item, reach for{" "}
                <code>allSettled</code>.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;How do you put a timeout on a
                request?&rdquo; — <code>Promise.race</code> against a Promise that rejects
                on a timer. Better is <code>AbortController</code>, because it{" "}
                <strong>actually kills the request</strong>, whereas <code>race</code>{" "}
                merely stops waiting. We walk through that difference in the fetch variant
                question too.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `// 都必须成功
const [user, posts] = await Promise.all([getUser(), getPosts()]);

// 要逐个知道结果
const results = await Promise.allSettled(files.map(upload));
const failed = results.filter((r) => r.status === "rejected");

// 超时：race 只是「不等了」，请求还在飞
const withTimeout = (p, ms) =>
  Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error("超时")), ms)),
  ]);

// 更好：AbortController 真的掐掉请求
const c = new AbortController();
setTimeout(() => c.abort(), 5000);
await fetch(url, { signal: c.signal });`,
              { filename: "四个方法与超时" },
            ),
          ],
        },
      ],
      transfer: [
        {
          signal: "给代码问输出顺序",
          signalEn: "Handed code and asked in what order it prints",
          reachFor: "同步 → 微任务全清 → 一个宏任务；Promise 先于 setTimeout",
          reachForEn: "Synchronous code, then every microtask, then one macrotask; a Promise runs before setTimeout",
        },
        {
          signal: "两个 await 连着写",
          signalEn: "Two awaits written one after the other",
          reachFor: "检查是否该改成 Promise.all 并行",
          reachForEn: "Check whether they should run at the same time with Promise.all",
        },
        {
          signal: "「出错后卡在 Loading」",
          signalEn: "After an error the screen is stuck on Loading",
          reachFor: "setLoading(false) 放 finally",
          reachForEn: "Put setLoading(false) in finally",
        },
        {
          signal: "try/catch 抓不到错误",
          signalEn: "try/catch does not catch the error",
          reachFor: "错误在回调里，已经是下一轮事件循环",
          reachForEn: "The error is inside a callback, which already runs on a later turn of the event loop",
        },
        {
          signal: "批量操作要报告每一个",
          signalEn: "A batch job has to report on every item",
          reachFor: "allSettled，不是 all",
          reachForEn: "allSettled, not all",
        },
        {
          signal: "要超时",
          signalEn: "You need a timeout",
          reachFor: "race 是不等了，AbortController 才是真取消",
          reachForEn: "race only stops waiting; AbortController is what actually cancels",
        },
        {
          signal: "fetch 拿到 404 却当成功",
          signalEn: "fetch gets a 404 and treats it as success",
          reachFor: "自己检查 res.ok",
          reachForEn: "Check res.ok yourself",
        },
      ],
      recap: [
        "事件循环一轮：同步跑完 → 微任务一次全清 → 渲染 → 取一个宏任务；异步能力来自宿主环境不是引擎。",
        "async 函数体在第一个 await 前是同步的；await 之后等价于 .then，属微任务。",
        "async/await 是 Promise 语法糖，最大好处是错误处理和同步代码统一；最大坑是把并行写成串行。",
        "回调地狱真正的问题是错误处理要写 n 遍和无法组合，不只是缩进深。",
        "finally 拿不到值、原样透传、但里面抛错会覆盖结果；关 loading 就该放这儿。",
        "try/catch 抓不到回调里的异步错误；抛 Error 对象不抛字符串；最外层要有兜底。",
        "all 全成功、allSettled 全结束、race 第一个结束、any 第一个成功。",
      ],
      recapEn: [
        "One turn of the event loop: run all synchronous code, drain every microtask, paint, then take one macrotask; the async ability comes from the host environment, not from the engine.",
        "The body of an async function runs synchronously up to the first await; what comes after await is the same as .then, so it is a microtask.",
        "async/await is syntax sugar over Promise; the main gain is that errors are handled the same way as in synchronous code, and the main mistake is writing work in sequence when it could run at the same time.",
        "The real problem with callback hell is that error handling is repeated in every callback and the steps cannot be composed, not just that the indentation grows.",
        "finally receives no value and passes the result through unchanged, but an error thrown inside it replaces that result; turning loading off belongs here.",
        "try/catch does not catch an async error raised inside a callback; throw an Error object, not a string; and keep one handler at the outermost level.",
        "all needs every one to succeed, allSettled waits for every one to finish, race takes the first one to finish, any takes the first one to succeed.",
      ],
    },

    /* ============================================================
       DOM、模块与工具链（7 题）
       ============================================================ */
    {
      id: "iv-js-tooling",
      title: "DOM、模块与工具链七问",
      titleEn: "7 questions on the DOM, modules and tooling",
      blurb: "DOM 与 DOM 事件、事件委托、ES6 新特性、ES6 模块、npm、Webpack、fetch vs axios。",
      blurbEn:
        "The DOM and DOM events, event delegation, new ES6 features, ES6 modules, npm, Webpack, fetch vs axios.",
      minutes: 20,
      objectives: [
        "说清 DOM 是什么、以及为什么频繁操作 DOM 慢",
        "写出事件委托并说明它解决了哪两个问题",
        "分清 CommonJS 和 ES 模块在时机与语法上的差别",
        "说出 Webpack 的四个核心概念和构建流程",
      ],
      objectivesEn: [
        "Explain what the DOM is, and why touching it many times is slow",
        "Write event delegation, and say which two problems it solves",
        "Tell CommonJS and ES modules apart, in timing and in syntax",
        "Name Webpack's four core concepts and describe the build steps",
      ],
      whyForAssessment:
        "事件委托是唯一有区分度的一道 —— 它连着 React 的事件机制。模块和 Webpack 属于工程题，答得出「为什么需要打包」比背配置项更重要。fetch vs axios 是很实用的一道，我们那道 fetch 变式题的第一个坑就在这里。",
      whyForAssessmentEn:
        "Event delegation is the only question here that separates candidates, because it connects to the way React handles events. Modules and Webpack are engineering questions; answering why bundling is needed matters more than reciting config options. fetch vs axios is a practical one — the first trap in our fetch variant exercise comes from it.",
      concepts: [
        {
          id: "q288",
          heading: "什么是 DOM，什么是 DOM 事件",
          headingEn: "What is the DOM, and what is a DOM event?",
          lede: "#288 What is the DOM and what is DOM event",
          body: (
            <>
              <p>
                <strong>一句话：</strong>DOM 是浏览器把 HTML
                解析成的<strong>一棵对象树</strong>，
                每个标签是一个节点；
                DOM 事件是这棵树上发生的事情
                （点击、输入、加载完成），
                你可以注册函数去响应。
              </p>
              <p>
                <strong>关键概念要点清：</strong>
                DOM <strong>不是 HTML 本身</strong>，
                也<strong>不属于 JavaScript 语言</strong>——
                它是浏览器提供的 API（Web API）。
                所以 Node 里没有 <code>document</code>。
                这条和 #276 是一组。
              </p>
              <p>
                <strong>为什么「操作 DOM 慢」：</strong>
                不是读写属性本身慢，而是它可能触发
                <strong>重排（reflow）和重绘（repaint）</strong>——
                浏览器要重新计算布局、重新画。
                在循环里反复读 <code>offsetHeight</code>
                再改样式，会造成
                <strong>强制同步布局（layout thrashing）</strong>，
                这才是真正的性能杀手。
              </p>
              <p>
                <strong>这直接解释了虚拟 DOM 的价值</strong>（见 #330）：
                它把多次操作合并成一次，
                并且尽量只改变化的部分。
              </p>
              <p>
                <strong>会追问：</strong>
                「事件对象上 <code>target</code> 和
                <code>currentTarget</code> 什么区别？」——
                <code>target</code> 是
                <strong>真正被点的那个元素</strong>，
                <code>currentTarget</code> 是
                <strong>当前监听器挂在哪个元素上</strong>。
                <strong>事件委托全靠这个区别</strong>，
                下一题就是。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> the DOM is{" "}
                <strong>the tree of objects</strong> the browser builds when it parses
                your HTML — one node per tag. A DOM event is something that happens on
                that tree (a click, some typing, a load finishing), and you register
                functions to respond to it.
              </p>
              <p>
                <strong>Be precise about the key point:</strong> the DOM{" "}
                <strong>is not the HTML itself</strong>, and it{" "}
                <strong>is not part of the JavaScript language</strong> — it is an API
                the browser hands you (a Web API). That is why Node has no{" "}
                <code>document</code>. This one pairs with #276.
              </p>
              <p>
                <strong>Why &ldquo;touching the DOM is slow&rdquo;:</strong> reading and
                writing a property is not the slow part. The cost is that it can trigger{" "}
                <strong>reflow and repaint</strong> — the browser has to recompute layout
                and paint again. Reading <code>offsetHeight</code> and then changing a
                style, over and over inside a loop, causes{" "}
                <strong>layout thrashing</strong>, and that is the real performance
                killer.
              </p>
              <p>
                <strong>This is exactly what makes the virtual DOM worth something</strong>{" "}
                (see #330): it batches many operations into one and tries to touch only
                what changed.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;What is the difference between{" "}
                <code>target</code> and <code>currentTarget</code> on the event
                object?&rdquo; — <code>target</code> is{" "}
                <strong>the element that was actually clicked</strong>,{" "}
                <code>currentTarget</code> is{" "}
                <strong>the element this listener is attached to</strong>.{" "}
                <strong>Event delegation rides entirely on that difference</strong>, which
                is the next question.
              </p>
            </>
          ),
        },
        {
          id: "q289",
          heading: "事件传播 vs 事件委托",
          headingEn: "Event propagation vs event delegation",
          lede: "#289 Event propagation vs Event delegation",
          body: (
            <>
              <p>
                <strong>一句话：</strong>
                <strong>传播是浏览器的机制</strong>
                （捕获 → 目标 → 冒泡，见 #380）；
                <strong>委托是我们利用这个机制的技巧</strong>——
                把监听器挂在父元素上，
                通过 <code>e.target</code> 判断实际点了哪个子元素。
              </p>
              <p>
                <strong>委托解决两个问题：</strong>
              </p>
              <ul>
                <li>
                  <strong>监听器数量</strong>——
                  1000 行的表格挂 1000 个监听器，
                  内存和绑定开销都很可观；委托只要 1 个。
                </li>
                <li>
                  <strong>动态元素</strong>——
                  后来才插进来的子元素
                  <strong>自动就有了行为</strong>，
                  不用重新绑定。这一条往往更实用。
                </li>
              </ul>
              <p>
                <strong>写法的关键是 <code>e.target.closest()</code></strong>——
                因为用户可能点在按钮里的
                <code>&lt;span&gt;</code> 上，
                直接比 <code>e.target.matches()</code> 会漏。
              </p>
              <p>
                <strong>会追问（重点）：</strong>
                「React 的事件是委托的吗？」——
                <strong>是</strong>，而且这是它的核心设计：
                React 把事件统一挂在
                <strong>根容器</strong>上
                （React 17 之前挂在 <code>document</code>，
                17 之后挂到 root 节点，
                <strong>这是为了支持一个页面里多个 React 版本共存</strong>），
                然后用<strong>合成事件（SyntheticEvent）</strong>
                模拟一套跨浏览器一致的事件系统。
                <br />
                <strong>推论</strong>：所以在 React 里
                <code>e.stopPropagation()</code>
                拦得住 React 组件之间的传播，
                但<strong>拦不住原生监听器</strong>——
                因为原生的已经先跑完了。
                这个点答出来会很加分。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong>{" "}
                <strong>propagation is the browser&rsquo;s mechanism</strong> (capture →
                target → bubble, see #380);{" "}
                <strong>delegation is the trick we play with it</strong> — put the
                listener on the parent and use <code>e.target</code> to work out which
                child was really clicked.
              </p>
              <p>
                <strong>Delegation solves two problems:</strong>
              </p>
              <ul>
                <li>
                  <strong>The number of listeners</strong> — a 1000-row table with 1000
                  listeners costs real memory and real binding time; delegation needs one.
                </li>
                <li>
                  <strong>Dynamic elements</strong> — children inserted later{" "}
                  <strong>already have the behaviour</strong>, with nothing to rebind. In
                  practice this is often the bigger win.
                </li>
              </ul>
              <p>
                <strong>
                  The key to writing it is <code>e.target.closest()</code>
                </strong>{" "}
                — the user may have clicked a <code>&lt;span&gt;</code> inside the button,
                so a bare <code>e.target.matches()</code> misses it.
              </p>
              <p>
                <strong>Follow-up, and this is the one that matters:</strong> &ldquo;Are
                React events delegated?&rdquo; — <strong>yes</strong>, and it is central
                to the design: React attaches events to the{" "}
                <strong>root container</strong> (to <code>document</code> before React 17,
                to the root node from 17 onwards,{" "}
                <strong>
                  so that several React versions can coexist on one page
                </strong>
                ), then wraps them in a <strong>SyntheticEvent</strong> to present one
                event system that behaves the same across browsers.
                <br />
                <strong>The consequence</strong>: inside React,{" "}
                <code>e.stopPropagation()</code> does stop propagation between React
                components, but it <strong>cannot stop a native listener</strong> — the
                native one already ran. Landing this point scores well.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `// ✗ 每一行一个监听器，而且新增的行没有行为
document.querySelectorAll("tr .del").forEach((btn) =>
  btn.addEventListener("click", onDelete),
);

// ✓ 委托：一个监听器，新增的行自动有行为
table.addEventListener("click", (e) => {
  // closest 而不是 matches —— 用户可能点在按钮里的图标上
  const btn = e.target.closest(".del");
  if (!btn) return;                       // 点到空白处，直接退出
  onDelete(btn.dataset.id);
});

// target vs currentTarget
// e.target        = 真正被点的元素（可能是按钮里的 span）
// e.currentTarget = 监听器挂在哪（这里永远是 table）`,
              { filename: "事件委托的标准写法" },
            ),
          ],
        },
        {
          id: "q301",
          heading: "ES6 有哪些新特性",
          headingEn: "What features did ES6 add?",
          lede: "#301 Name the new ES6 features",
          body: (
            <>
              <p>
                <strong>一句话：</strong>2015 年那一版改动最大，
                十来个东西<strong>今天天天在用</strong>。
              </p>
              <p>
                <strong>按重要性排（面试挑五六个说清就够，
                别背清单）：</strong>
              </p>
              <ul>
                <li>
                  <code>let</code> / <code>const</code>——
                  块作用域（#282）
                </li>
                <li>
                  <strong>箭头函数</strong>—— 简写 +
                  词法 <code>this</code>（#285）
                </li>
                <li>
                  <strong>模板字符串</strong>——
                  <code>{"`${x}`"}</code>，支持多行
                </li>
                <li>
                  <strong>解构</strong>——
                  <code>{"const { a, b } = obj"}</code>，
                  <strong>React 里到处在用</strong>
                </li>
                <li>
                  <strong>展开 / 剩余</strong>——
                  <code>...</code>，
                  <strong>不可变更新的基础</strong>
                </li>
                <li>
                  <strong>默认参数</strong>
                </li>
                <li>
                  <strong>Promise</strong>—— 异步的转折点（#306）
                </li>
                <li>
                  <code>class</code>—— 原型的语法糖（#302）
                </li>
                <li>
                  <strong>ES 模块</strong>——
                  <code>import</code> / <code>export</code>（#308）
                </li>
                <li>
                  <code>Map</code> / <code>Set</code>（#286、#287）、
                  <code>Symbol</code>、
                  <code>for…of</code> 与迭代器、生成器
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「ES6 之后还有什么好用的？」——
                这题答得出来会显得你在跟进：
                <code>async/await</code>（ES2017）、
                可选链 <code>?.</code> 和空值合并
                <code>??</code>（ES2020）、
                <code>Object.entries</code>（ES2017）、
                <code>Array.flat</code>（ES2019）、
                <code>at(-1)</code>（ES2022）、
                <code>structuredClone</code>。
                <br />
                <strong>可选链和 <code>??</code>
                这两个尤其值得提</strong>，
                因为它们直接减少了大量防御式代码。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> the 2015 edition changed the most, and a
                dozen or so of its additions are{" "}
                <strong>things you use every single day</strong>.
              </p>
              <p>
                <strong>
                  Ordered by weight — pick five or six and explain them properly, do not
                  recite the list:
                </strong>
              </p>
              <ul>
                <li>
                  <code>let</code> / <code>const</code> — block scope (#282)
                </li>
                <li>
                  <strong>Arrow functions</strong> — shorter, plus a lexical{" "}
                  <code>this</code> (#285)
                </li>
                <li>
                  <strong>Template literals</strong> — <code>{"`${x}`"}</code>, and they
                  span lines
                </li>
                <li>
                  <strong>Destructuring</strong> —{" "}
                  <code>{"const { a, b } = obj"}</code>,{" "}
                  <strong>used everywhere in React</strong>
                </li>
                <li>
                  <strong>Spread and rest</strong> — <code>...</code>,{" "}
                  <strong>the basis of immutable updates</strong>
                </li>
                <li>
                  <strong>Default parameters</strong>
                </li>
                <li>
                  <strong>Promise</strong> — the turning point for async (#306)
                </li>
                <li>
                  <code>class</code> — sugar over prototypes (#302)
                </li>
                <li>
                  <strong>ES modules</strong> — <code>import</code> / <code>export</code>{" "}
                  (#308)
                </li>
                <li>
                  <code>Map</code> / <code>Set</code> (#286, #287), <code>Symbol</code>,{" "}
                  <code>for…of</code> with iterators, generators
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;What came after ES6 that you
                like?&rdquo; — answering this makes you look like you keep up:{" "}
                <code>async/await</code> (ES2017), optional chaining <code>?.</code> and
                nullish coalescing <code>??</code> (ES2020),{" "}
                <code>Object.entries</code> (ES2017), <code>Array.flat</code> (ES2019),{" "}
                <code>at(-1)</code> (ES2022), <code>structuredClone</code>.
                <br />
                <strong>
                  Optional chaining and <code>??</code> are the two most worth naming
                </strong>
                , because they cut out a mountain of defensive code.
              </p>
            </>
          ),
        },
        {
          id: "q308",
          heading: "什么是 ES6 模块",
          headingEn: "What are ES6 modules?",
          lede: "#308 What are ES6 modules",
          body: (
            <>
              <p>
                <strong>一句话：</strong>语言内置的模块系统 ——
                <code>export</code> 导出、
                <code>import</code> 导入，
                每个文件一个作用域，
                <strong>在编译期就能确定依赖关系</strong>。
              </p>
              <p>
                <strong>和 CommonJS（Node 的老方案）的差别</strong>——
                这才是考点：
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>CommonJS</th>
                      <th>ES Module</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>语法</td>
                      <td><code>require</code> / <code>module.exports</code></td>
                      <td><code>import</code> / <code>export</code></td>
                    </tr>
                    <tr>
                      <td>时机</td>
                      <td><strong>运行时</strong>加载</td>
                      <td><strong>编译期</strong>确定依赖</td>
                    </tr>
                    <tr>
                      <td>能否动态路径</td>
                      <td>能（<code>require(x)</code>）</td>
                      <td>
                        静态 import 不能；要动态用
                        <code>import()</code>（返回 Promise）
                      </td>
                    </tr>
                    <tr>
                      <td>导出的是</td>
                      <td><strong>值的拷贝</strong></td>
                      <td><strong>活的绑定</strong>（原值变了这边也变）</td>
                    </tr>
                    <tr>
                      <td>Tree shaking</td>
                      <td>不行</td>
                      <td><strong>可以</strong>（因为静态可分析）</td>
                    </tr>
                    <tr>
                      <td>顶层 await</td>
                      <td>不支持</td>
                      <td>支持</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>「编译期确定依赖」为什么重要？</strong>
                因为打包工具能在不运行代码的情况下
                知道谁用了什么，
                于是能<strong>删掉没用到的导出</strong>
                （tree shaking）、
                能做代码分割。
                <strong>这是 ESM 最大的实际价值</strong>，
                不是语法更好看。
              </p>
              <p>
                <strong>会追问：</strong>
                「具名导出和默认导出怎么选？」——
                默认导出对重命名没有约束
                （import 时可以叫任何名字），
                不利于搜索和自动补全；
                <strong>具名导出更利于 tree shaking 和重构</strong>。
                实践上「一个文件一个主体」用 default，
                工具函数集合用具名。
                <br />
                「Node 里怎么用 ESM？」——
                <code>package.json</code> 里
                <code>{'"type": "module"'}</code>，
                或者文件名用 <code>.mjs</code>。
                这就是 Federation 那门课里
                Jest 需要
                <code>--experimental-vm-modules</code> 的原因。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> the module system built into the language —{" "}
                <code>export</code> to expose, <code>import</code> to pull in, one scope
                per file, and{" "}
                <strong>dependencies are known at compile time</strong>.
              </p>
              <p>
                <strong>
                  How it differs from CommonJS, Node&rsquo;s older scheme
                </strong>{" "}
                — this is the part being tested:
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>CommonJS</th>
                      <th>ES Module</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Syntax</td>
                      <td><code>require</code> / <code>module.exports</code></td>
                      <td><code>import</code> / <code>export</code></td>
                    </tr>
                    <tr>
                      <td>Timing</td>
                      <td>
                        Loaded <strong>at runtime</strong>
                      </td>
                      <td>
                        Dependencies resolved <strong>at compile time</strong>
                      </td>
                    </tr>
                    <tr>
                      <td>Dynamic paths</td>
                      <td>
                        Yes (<code>require(x)</code>)
                      </td>
                      <td>
                        Not with a static import; for that use <code>import()</code>,
                        which returns a Promise
                      </td>
                    </tr>
                    <tr>
                      <td>What gets exported</td>
                      <td>
                        <strong>A copy of the value</strong>
                      </td>
                      <td>
                        <strong>A live binding</strong> (the original changes, so does
                        this one)
                      </td>
                    </tr>
                    <tr>
                      <td>Tree shaking</td>
                      <td>No</td>
                      <td>
                        <strong>Yes</strong>, because it is statically analysable
                      </td>
                    </tr>
                    <tr>
                      <td>Top-level await</td>
                      <td>Not supported</td>
                      <td>Supported</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>Why does &ldquo;resolved at compile time&rdquo; matter?</strong>{" "}
                Because a bundler can see who uses what without running the code, so it
                can <strong>drop exports nobody imported</strong> (tree shaking) and split
                code. <strong>That is ESM&rsquo;s real practical value</strong>, not
                prettier syntax.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Named exports or a default
                export?&rdquo; — a default export puts no constraint on the name, since an
                importer can call it anything, which hurts search and autocomplete;{" "}
                <strong>
                  named exports are friendlier to tree shaking and refactoring
                </strong>
                . In practice: default for &ldquo;one file, one main thing&rdquo;, named
                for a bag of utilities.
                <br />
                &ldquo;How do you use ESM in Node?&rdquo; —{" "}
                <code>{'"type": "module"'}</code> in <code>package.json</code>, or name the
                file <code>.mjs</code>. That is why Jest needs{" "}
                <code>--experimental-vm-modules</code> in the Federation course.
              </p>
            </>
          ),
        },
        {
          id: "q312",
          heading: "什么是 npm",
          headingEn: "What is npm?",
          lede: "#312 What is npm",
          body: (
            <>
              <p>
                <strong>一句话：</strong>Node 的
                <strong>包管理器 + 全球最大的包仓库</strong>。
                它负责装依赖、锁版本、跑脚本。
              </p>
              <p>
                <strong>三件核心事：</strong>
              </p>
              <ul>
                <li>
                  <strong>装依赖</strong>——
                  读 <code>package.json</code> 的
                  <code>dependencies</code>，
                  递归下载到 <code>node_modules</code>。
                </li>
                <li>
                  <strong>锁版本</strong>——
                  <code>package-lock.json</code>
                  记下<strong>每一个包的确切版本和哈希</strong>，
                  保证队友和 CI 装出来的一模一样。
                  <strong>它必须提交到版本库。</strong>
                </li>
                <li>
                  <strong>跑脚本</strong>——
                  <code>npm run dev</code>，
                  而且会把
                  <code>node_modules/.bin</code>
                  加到 PATH，所以能直接写
                  <code>vitest</code> 而不用写全路径。
                </li>
              </ul>
              <p>
                <strong>必答的两个区分：</strong>
              </p>
              <ul>
                <li>
                  <strong><code>dependencies</code> vs{" "}
                  <code>devDependencies</code></strong>——
                  前者是<strong>运行时需要</strong>的
                  （React），后者只在<strong>开发和构建时</strong>需要
                  （TypeScript、测试框架、打包工具）。
                  生产安装可以用
                  <code>npm ci --omit=dev</code> 跳过后者。
                </li>
                <li>
                  <strong><code>npm install</code> vs{" "}
                  <code>npm ci</code></strong>——
                  <code>install</code> 会在需要时
                  <strong>更新 lock 文件</strong>；
                  <code>ci</code> <strong>严格按 lock 装</strong>，
                  对不上就直接报错。
                  <strong>CI 里应该用 <code>ci</code></strong>。
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「<code>^1.2.3</code> 和
                <code>~1.2.3</code> 什么区别？」——
                <code>^</code> 允许小版本和补丁升级
                （<code>&lt;2.0.0</code>），
                <code>~</code> 只允许补丁
                （<code>&lt;1.3.0</code>）。
                <strong>正是因为 <code>^</code> 的存在，
                lock 文件才必不可少</strong>——
                否则不同时间装出来的版本会不同。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> Node&rsquo;s{" "}
                <strong>
                  package manager, plus the largest package registry in the world
                </strong>
                . It installs dependencies, pins versions and runs scripts.
              </p>
              <p>
                <strong>Three core jobs:</strong>
              </p>
              <ul>
                <li>
                  <strong>Install dependencies</strong> — read{" "}
                  <code>dependencies</code> out of <code>package.json</code> and download
                  the whole tree into <code>node_modules</code>.
                </li>
                <li>
                  <strong>Pin versions</strong> — <code>package-lock.json</code> records{" "}
                  <strong>the exact version and hash of every package</strong>, so a
                  teammate and CI install precisely what you did.{" "}
                  <strong>It has to be committed.</strong>
                </li>
                <li>
                  <strong>Run scripts</strong> — <code>npm run dev</code>. It also puts{" "}
                  <code>node_modules/.bin</code> on the PATH, which is why you can write{" "}
                  <code>vitest</code> instead of a full path.
                </li>
              </ul>
              <p>
                <strong>Two distinctions you must be able to make:</strong>
              </p>
              <ul>
                <li>
                  <strong>
                    <code>dependencies</code> vs <code>devDependencies</code>
                  </strong>{" "}
                  — the first is what you need <strong>at runtime</strong> (React), the
                  second only <strong>while developing and building</strong> (TypeScript,
                  the test runner, the bundler). A production install can skip the second
                  with <code>npm ci --omit=dev</code>.
                </li>
                <li>
                  <strong>
                    <code>npm install</code> vs <code>npm ci</code>
                  </strong>{" "}
                  — <code>install</code> will{" "}
                  <strong>update the lock file</strong> when it has to;{" "}
                  <code>ci</code> <strong>installs strictly from the lock</strong> and
                  errors out if the two disagree.{" "}
                  <strong>
                    CI should use <code>ci</code>
                  </strong>
                  .
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;What is the difference between{" "}
                <code>^1.2.3</code> and <code>~1.2.3</code>?&rdquo; — <code>^</code>{" "}
                allows minor and patch upgrades (<code>&lt;2.0.0</code>), <code>~</code>{" "}
                allows patches only (<code>&lt;1.3.0</code>).{" "}
                <strong>
                  It is precisely because <code>^</code> exists that the lock file is
                  indispensable
                </strong>{" "}
                — otherwise installing on two different days gives you two different trees.
              </p>
            </>
          ),
        },
        {
          id: "q283",
          heading: "Webpack 是怎么工作的",
          headingEn: "How does Webpack work?",
          lede: "#283 How does Webpack work",
          body: (
            <>
              <p>
                <strong>一句话：</strong>从入口出发
                <strong>递归分析所有 import，
                建出一张依赖图</strong>，
                路上用 loader 把各种文件转成 JS，
                最后按规则打成若干个 bundle。
              </p>
              <p>
                <strong>四个核心概念（必答）：</strong>
              </p>
              <ul>
                <li>
                  <strong>entry</strong>—— 从哪开始找依赖。
                </li>
                <li>
                  <strong>output</strong>—— 打到哪里、叫什么名
                  （带 <code>[contenthash]</code> 做缓存）。
                </li>
                <li>
                  <strong>loader</strong>——
                  <strong>把非 JS 转成 JS</strong>。
                  <code>babel-loader</code> 转 JSX 和新语法、
                  <code>css-loader</code> 让 CSS 能被
                  <code>import</code>。
                  <strong>loader 是从右到左（从下到上）执行的</strong>，
                  这个细节常问。
                </li>
                <li>
                  <strong>plugin</strong>——
                  在构建生命周期的各个钩子上干活，
                  能力比 loader 大得多
                  （生成 HTML、抽 CSS、压缩、分析体积）。
                </li>
              </ul>
              <p>
                <strong>为什么需要打包（这才是问题的本质）：</strong>
                浏览器早期不支持模块、
                不认识 JSX 和 TS、
                请求数多会慢；
                打包解决的是<strong>模块化、转译、
                合并压缩、以及 tree shaking</strong>。
              </p>
              <p>
                <strong>会追问：</strong>
                「Vite 为什么快？」——
                这题现在很常问。
                开发时 Vite <strong>不打包</strong>，
                直接用浏览器原生 ESM 按需提供模块，
                所以启动是<strong>常数时间</strong>，
                不随项目变大而变慢；
                依赖预构建用 esbuild（Go 写的，快一个量级）；
                生产才用 Rollup 打包。
                <br />
                <strong>Webpack 是「先全量打包再服务」，
                Vite 是「先服务再按需转换」</strong>——
                这一句就说到了根本区别。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> start at the entry,{" "}
                <strong>
                  walk every import recursively and build a dependency graph
                </strong>
                , push files through loaders to turn them into JS along the way, and emit
                a handful of bundles according to your rules.
              </p>
              <p>
                <strong>Four core concepts you have to name:</strong>
              </p>
              <ul>
                <li>
                  <strong>entry</strong> — where the dependency walk starts.
                </li>
                <li>
                  <strong>output</strong> — where the bundles land and what they are
                  called (with <code>[contenthash]</code> for caching).
                </li>
                <li>
                  <strong>loader</strong> — <strong>turns non-JS into JS</strong>.{" "}
                  <code>babel-loader</code> handles JSX and new syntax,{" "}
                  <code>css-loader</code> makes CSS importable.{" "}
                  <strong>Loaders run right to left (bottom to top)</strong> — that detail
                  gets asked a lot.
                </li>
                <li>
                  <strong>plugin</strong> — hooks into the build lifecycle and can do far
                  more than a loader (generate HTML, extract CSS, minify, analyse bundle
                  size).
                </li>
              </ul>
              <p>
                <strong>Why bundling exists at all — that is the real question:</strong>{" "}
                early browsers had no modules, they do not understand JSX or TS, and a lot
                of requests is slow. Bundling buys you{" "}
                <strong>
                  modularity, transpilation, merging and minifying, and tree shaking
                </strong>
                .
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Why is Vite fast?&rdquo; — asked
                constantly now. In development Vite <strong>does not bundle</strong>; it
                serves modules on demand over the browser&rsquo;s native ESM, so startup
                is <strong>constant time</strong> and does not degrade as the project
                grows. Dependency pre-bundling runs on esbuild (written in Go, an order of
                magnitude faster), and only production goes through Rollup.
                <br />
                <strong>
                  Webpack bundles everything and then serves it; Vite serves first and
                  transforms on demand
                </strong>{" "}
                — that single sentence gets at the fundamental difference.
              </p>
            </>
          ),
        },
        {
          id: "q387",
          heading: "fetch 和 axios 的区别",
          headingEn: "What is the difference between fetch and axios?",
          lede: "#387 What is the difference between making server requests via fetch and axios?",
          body: (
            <>
              <p>
                <strong>一句话：</strong>
                <code>fetch</code> 是<strong>浏览器内置</strong>的，
                很基础；<code>axios</code> 是第三方库，
                把常用的事都替你做了。
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th><code>fetch</code></th>
                      <th><code>axios</code></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>依赖</td>
                      <td><strong>无</strong>，浏览器/Node 18+ 内置</td>
                      <td>要装（约 13 KB）</td>
                    </tr>
                    <tr>
                      <td>4xx / 5xx</td>
                      <td>
                        <strong>不 reject</strong>，
                        要自己查 <code>res.ok</code>
                      </td>
                      <td><strong>自动抛错</strong></td>
                    </tr>
                    <tr>
                      <td>JSON</td>
                      <td>要手动 <code>await res.json()</code></td>
                      <td>自动解析到 <code>data</code></td>
                    </tr>
                    <tr>
                      <td>超时</td>
                      <td>要自己配 <code>AbortController</code></td>
                      <td><code>timeout</code> 一个选项</td>
                    </tr>
                    <tr>
                      <td>拦截器</td>
                      <td>没有，要自己包一层</td>
                      <td><strong>内置</strong>（统一加 token、统一处理 401）</td>
                    </tr>
                    <tr>
                      <td>上传进度</td>
                      <td>很麻烦</td>
                      <td>支持</td>
                    </tr>
                    <tr>
                      <td>Node 里可用</td>
                      <td>18+ 才有</td>
                      <td>一直可以</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>「404 不 reject」是这题的核心考点</strong>，
                也是真实 bug 的来源：不查
                <code>res.ok</code> 就会把错误页当数据渲染。
                <strong>从 axios 转过来的人最容易漏这一条</strong>，
                因为 axios 会自己抛。
              </p>
              <p>
                <strong>怎么选：</strong>
                简单项目、在意包体积、
                或者只发几个请求 → <code>fetch</code>
                包一个自己的小 wrapper；
                需要拦截器 / 统一错误处理 /
                上传进度，或者要兼容老 Node → <code>axios</code>。
                <br />
                <strong>更常见的现实答案</strong>：用
                <strong>TanStack Query / SWR</strong>
                管缓存和请求状态，
                底下用哪个都行 —— 因为
                <code>fetch</code> 和 <code>axios</code>
                都不管缓存、去重、重试。
                能这么答说明你想过分层。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> <code>fetch</code> is{" "}
                <strong>built into the browser</strong> and very bare-bones;{" "}
                <code>axios</code> is a third-party library that does the routine work for
                you.
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th><code>fetch</code></th>
                      <th><code>axios</code></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Dependency</td>
                      <td>
                        <strong>None</strong>, built into browsers and Node 18+
                      </td>
                      <td>Must be installed (about 13 KB)</td>
                    </tr>
                    <tr>
                      <td>4xx / 5xx</td>
                      <td>
                        <strong>Does not reject</strong>; you check{" "}
                        <code>res.ok</code> yourself
                      </td>
                      <td>
                        <strong>Throws for you</strong>
                      </td>
                    </tr>
                    <tr>
                      <td>JSON</td>
                      <td>
                        You call <code>await res.json()</code> by hand
                      </td>
                      <td>
                        Parsed into <code>data</code> already
                      </td>
                    </tr>
                    <tr>
                      <td>Timeout</td>
                      <td>
                        Wire up an <code>AbortController</code> yourself
                      </td>
                      <td>
                        One <code>timeout</code> option
                      </td>
                    </tr>
                    <tr>
                      <td>Interceptors</td>
                      <td>None; wrap it yourself</td>
                      <td>
                        <strong>Built in</strong> (attach a token everywhere, handle 401 in
                        one place)
                      </td>
                    </tr>
                    <tr>
                      <td>Upload progress</td>
                      <td>Painful</td>
                      <td>Supported</td>
                    </tr>
                    <tr>
                      <td>Available in Node</td>
                      <td>Only from 18</td>
                      <td>Always has been</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>
                  &ldquo;404 does not reject&rdquo; is the heart of this question
                </strong>
                , and a real source of bugs: skip the <code>res.ok</code> check and you
                render an error page as if it were data.{" "}
                <strong>People coming over from axios miss this one most often</strong>,
                because axios throws on their behalf.
              </p>
              <p>
                <strong>How to choose:</strong> a small project, a tight bundle budget, or
                only a handful of requests → <code>fetch</code> with your own small
                wrapper. Interceptors, one place for error handling, upload progress, or an
                old Node to support → <code>axios</code>.
                <br />
                <strong>The more realistic answer</strong>: reach for{" "}
                <strong>TanStack Query or SWR</strong> to manage caching and request state,
                and whichever one sits underneath hardly matters — because neither{" "}
                <code>fetch</code> nor <code>axios</code> handles caching, deduplication or
                retries. Answering that way shows you have thought about the layers.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `// fetch：404 也是「成功」，必须自己判
const res = await fetch(url);
if (!res.ok) throw new Error(\`HTTP \${res.status}\`);   // ← 漏了这行就会出 bug
const data = await res.json();

// axios：非 2xx 自己抛，data 已经解析好
const { data } = await axios.get(url);

// 自己给 fetch 包一层，就能补上大部分差距
async function request(url, opts = {}) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), opts.timeout ?? 10000);
  try {
    const res = await fetch(url, { ...opts, signal: c.signal });
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}`,
              { filename: "两者的核心差别与自制 wrapper" },
            ),
          ],
        },
      ],
      transfer: [
        {
          signal: "列表每一项都绑监听器",
          signalEn: "Every item in a list gets its own listener",
          reachFor: "事件委托，挂父元素 + e.target.closest()",
          reachForEn: "Event delegation: one listener on the parent, plus e.target.closest()",
        },
        {
          signal: "「动态插入的元素没有行为」",
          signalEn: "An element inserted later does nothing when clicked",
          reachFor: "委托，天然覆盖后来的元素",
          reachForEn: "Delegation; it covers elements added later with no extra work",
        },
        {
          signal: "问 React 事件机制",
          signalEn: "Asked how React handles events",
          reachFor: "委托到 root + 合成事件；拦不住原生监听器",
          reachForEn: "React delegates to the root and uses synthetic events; it cannot stop a native listener",
        },
        {
          signal: "问为什么要打包",
          signalEn: "Asked why bundling is needed",
          reachFor: "模块化、转译、合并压缩、tree shaking",
          reachForEn: "Modules, transpiling, merging and minifying, tree shaking",
        },
        {
          signal: "问 Vite 为什么快",
          signalEn: "Asked why Vite is fast",
          reachFor: "开发不打包用原生 ESM，依赖预构建用 esbuild",
          reachForEn: "In development it does not bundle, it serves native ESM, and it pre-builds dependencies with esbuild",
        },
        {
          signal: "CI 里装依赖",
          signalEn: "Installing dependencies in CI",
          reachFor: "npm ci，严格按 lock",
          reachForEn: "npm ci, which follows the lockfile exactly",
        },
        {
          signal: "从 axios 转到 fetch",
          signalEn: "Moving from axios to fetch",
          reachFor: "记得补 res.ok 检查和超时",
          reachForEn: "Remember to add the res.ok check and a timeout",
        },
      ],
      recap: [
        "DOM 是浏览器提供的对象树 API，不属于 JS 语言；慢是因为重排重绘，不是读写属性本身。",
        "target 是被点的元素，currentTarget 是监听器挂在哪；事件委托全靠这个区别。",
        "委托解决监听器数量和动态元素两个问题；React 把事件委托到 root 并用合成事件。",
        "ESM 编译期确定依赖 → 能 tree shaking；CommonJS 运行时加载、导出是值拷贝。",
        "package-lock.json 必须提交；CI 用 npm ci 而不是 npm install。",
        "Webpack 四概念 entry/output/loader/plugin，loader 从右到左执行。",
        "fetch 不因 4xx reject，必须查 res.ok —— 这是从 axios 转过来最容易漏的一条。",
      ],
      recapEn: [
        "The DOM is a tree of objects the browser provides; it is not part of the JavaScript language. It is slow because of reflow and repaint, not because reading or writing a property is slow.",
        "target is the element that was clicked, currentTarget is where the listener is attached; event delegation depends on that difference.",
        "Delegation solves two problems, the number of listeners and elements added later; React delegates events to the root and uses synthetic events.",
        "ESM resolves its imports at compile time, which makes tree shaking possible; CommonJS loads at runtime and its exports are copies of the values.",
        "package-lock.json has to be committed; in CI use npm ci instead of npm install.",
        "Webpack has four concepts, entry/output/loader/plugin, and loaders run from right to left.",
        "fetch does not reject on a 4xx, so you have to check res.ok — the step most often forgotten when moving over from axios.",
      ],
    },
  ],
};
