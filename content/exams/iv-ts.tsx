// 面试八股 —— TypeScript 深度：utility types 与泛型。
//
// 【这个模块的题不在原题库里】
// 前面几个模块的题目来自用户提供的题库（#269 ~ #387）；这 6 道（ts1 ~ ts6）
// 是 DrillLab 自出的 senior 级补充，所以 lede 里没有题库编号。
// 规矩不变：答案是 DrillLab 写的，代码块一律 demo()（「示意」），
// 练习一律 generated: true。
// 全部代码片段在 scratchpad 里用本项目的 tsc（strict）逐个编译验证过，
// 引用的报错文本（TS2536 / TS18046 / TS2353 等）也都是实际编译得到的原文；
// 但它们不来自任何源项目，所以按规矩不标「已跑通」。

import type { Module } from "../types";
import { demo } from "../helpers";

export const ivTs: Module = {
  id: "iv-ts",
  stage: "面试 · 第 9 部分",
  title: "TypeScript 深度",
  titleEn: "TypeScript in depth",
  summary:
    "6 道题。senior 面试的 TS 深水区：utility types 不止会用还要会手写，再加泛型约束、判别联合与 unknown / any / never。这 6 道全部是 DrillLab 自出，不在原题库里。",
  summaryEn:
    "6 questions. The harder TypeScript topics that senior interviews go into: you have to write utility types yourself, not only use them, plus generic constraints, discriminated unions, and unknown / any / never. All 6 were written by DrillLab and are not in the original question bank.",
  lessons: [
    /* ============================================================
       Utility Types（3 题）
       ============================================================ */
    {
      id: "iv-ts-utility",
      title: "Utility Types：会用，还要会手写",
      titleEn: "Utility types: use them, and write them yourself",
      blurb:
        "Partial / Pick / Omit / Record 怎么选，mapped type 手写 MyPick 与 MyPartial，conditional type 配 infer 手写 MyReturnType。",
      blurbEn:
        "How to choose between Partial / Pick / Omit / Record, how to write MyPick and MyPartial as mapped types, and how to write MyReturnType with a conditional type and infer.",
      minutes: 28,
      objectives: [
        "在 patch 参数、props 裁剪、字典三个场景里说出该用哪个 utility type，以及为什么不用索引签名",
        "手写 MyPartial 与 MyPick，并逐符号解释 { [K in keyof T]?: T[K] }",
        "用 Pick 加 Exclude 组合出 Omit，并说出官方 Omit 的约束宽在哪里",
        "解释条件类型的分配律，并用 infer 手写 MyReturnType",
      ],
      objectivesEn: [
        "Say which utility type fits each of three cases: a patch argument, trimming props, and a dictionary — and why an index signature is not the answer",
        "Write MyPartial and MyPick by hand, and explain every symbol in { [K in keyof T]?: T[K] }",
        "Build Omit out of Pick and Exclude, and say where the built-in Omit has a looser constraint",
        "Explain how a conditional type distributes over a union, and write MyReturnType with infer",
      ],
      whyForAssessment:
        "senior 面试几乎不问「Partial 是什么」，问的是「Partial 怎么实现」。会不会 mapped type 和 conditional type，是「用过 TS」和「懂 TS」的分界线 —— 这三道题就压在这条线上。",
      whyForAssessmentEn:
        "Senior interviews rarely ask what Partial is. They ask how Partial is implemented. Whether you can write a mapped type and a conditional type is the line between having used TypeScript and understanding it. These three questions sit on that line.",
      concepts: [
        {
          id: "ts1",
          heading: "Partial、Required、Pick、Omit、Record 分别解决什么问题",
          headingEn: "What problem does each of Partial, Required, Pick, Omit and Record solve?",
          lede: "What problems do Partial, Required, Pick, Omit and Record each solve",
          body: (
            <>
              <p>
                <strong>一句话：</strong>五个都是「按规则从已有类型造新类型」的
                工具类型（utility types）：<code>Partial</code> 全变可选、
                <code>Required</code> 全变必填、<code>Pick</code> 只留白名单、
                <code>Omit</code> 去掉黑名单、<code>Record</code> 按键集合造字典。
                考点不是背 API，是看到场景知道伸手拿哪个。
              </p>
              <p>
                <strong>三个高频场景：</strong>
              </p>
              <ul>
                <li>
                  <strong>
                    更新函数的 patch 参数 → <code>{"Partial<User>"}</code>。
                  </strong>
                  调用方只传要改的字段，但传了的字段类型必须对，
                  拼错字段名照样编译报错
                  （<code>{"Object literal may only specify known properties"}</code>）。
                  这是它比 <code>{"Record<string, unknown>"}</code> 强的地方：
                  可选，但没有放弃字段级检查。
                </li>
                <li>
                  <strong>
                    从大类型裁 props → <code>{'Pick<User, "name" | "role">'}</code>。
                  </strong>
                  组件只声明真正用到的字段，<code>User</code> 以后加字段不会波及它。
                  反方向的「去掉不该外泄的字段」用
                  <code>{'Omit<User, "email">'}</code>。
                </li>
                <li>
                  <strong>
                    键集合已知的字典 → <code>{"Record<Theme, string>"}</code>，
                    别用索引签名。
                  </strong>
                  键是字面量联合（literal union）时，Record 的键集合是封闭的：
                  少一个键、多一个键都是编译错误。
                  索引签名对任何 string 键都放行，还谎称读出来的值一定存在。
                </li>
              </ul>
              <p>
                <strong>Pick 和 Omit 怎么选：</strong>白名单还是黑名单。
                类型以后会加字段时，<code>Omit</code> 会把新字段自动带进来 ——
                透传配置时这是优点，做脱敏时这是漏洞。
                所以对外暴露的公开类型建议用 <code>Pick</code>：
                新加的敏感字段默认不外泄。
              </p>
              <p>
                <strong>会追问：</strong>「Partial 是深的还是浅的？」—— 浅的，
                只动第一层，嵌套对象内部照样必填；要深的得自己写递归的 mapped type。
                「<code>{"Record<string, T>"}</code> 和索引签名什么区别？」——
                几乎等价，但 Record 的键能用字面量联合，索引签名不行。
                答完这两问，多半会接一句「那 Partial 自己怎么实现？」——
                那就是下一题。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> all five are utility types — they build a
                new type from an existing one by a rule: <code>Partial</code> makes
                everything optional, <code>Required</code> makes everything required,{" "}
                <code>Pick</code> keeps a whitelist, <code>Omit</code> drops a
                blacklist, <code>Record</code> builds a dictionary from a key set. The
                real question is not the API — it is knowing which one a scenario calls
                for.
              </p>
              <p>
                <strong>Three scenarios that keep coming up:</strong>
              </p>
              <ul>
                <li>
                  <strong>
                    The patch parameter of an update function →{" "}
                    <code>{"Partial<User>"}</code>.
                  </strong>{" "}
                  Callers pass only the fields they change, but every field they do
                  pass is still checked — a typo still fails to compile
                  (<code>{"Object literal may only specify known properties"}</code>).
                  That is what makes it stronger than{" "}
                  <code>{"Record<string, unknown>"}</code>: optional, without giving up
                  per-field checking.
                </li>
                <li>
                  <strong>
                    Trimming props from a big type →{" "}
                    <code>{'Pick<User, "name" | "role">'}</code>.
                  </strong>{" "}
                  The component declares only the fields it actually uses, so adding
                  fields to <code>User</code> later cannot ripple into it. The opposite
                  direction — dropping fields that must not leak — is{" "}
                  <code>{'Omit<User, "email">'}</code>.
                </li>
                <li>
                  <strong>
                    A dictionary with a known key set →{" "}
                    <code>{"Record<Theme, string>"}</code>, not an index signature.
                  </strong>{" "}
                  With a literal union as the key, Record is a closed key set: one key
                  missing or one key extra is a compile error. An index signature waves
                  any string through, then claims the value definitely exists.
                </li>
              </ul>
              <p>
                <strong>Choosing between Pick and Omit:</strong> whitelist or
                blacklist. When the type will grow, <code>Omit</code> silently carries
                every new field along — a feature when forwarding config, a hole when
                redacting. So for public-facing types, prefer <code>Pick</code>: a
                newly added sensitive field stays private by default.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Is Partial deep or shallow?&rdquo; —
                shallow. It only touches the first level; properties inside nested
                objects stay required. A deep version means writing a recursive mapped
                type yourself. &ldquo;What is the difference between{" "}
                <code>{"Record<string, T>"}</code> and an index signature?&rdquo; —
                almost none, except Record keys can be literal unions and index
                signatures cannot. Answer both, and the next question is usually
                &ldquo;so how is Partial itself implemented?&rdquo; — which is exactly
                the next card.
              </p>
            </>
          ),
          code: [
            demo(
              "ts",
              `interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "member";
}

// Partial<T>：patch 的每个字段都可以不传，但传了就必须对
function updateUser(user: User, patch: Partial<User>): User {
  return { ...user, ...patch };
}

declare const user: User;
updateUser(user, { name: "Ada" });     // ✓ 只传要改的字段
// updateUser(user, { nmae: "Ada" });  // ✗ 拼错字段名，编译报错

// Pick<T, K>：从大类型裁出组件真正用到的字段
type UserCardProps = Pick<User, "name" | "role">;

// Omit<T, K>：去掉不该外泄的字段
type PublicUser = Omit<User, "email">;`,
              { filename: "三个场景各拿哪个" },
            ),
            demo(
              "ts",
              `type Theme = "light" | "dark";

// Record + 字面量联合：键集合是封闭的
const themeColor: Record<Theme, string> = {
  light: "#ffffff",
  dark: "#1a1a1a",
};
// 少写 dark、多写 blue，都是编译错误

// 索引签名：任何 string 键都「合法」
const loose: { [key: string]: string } = { light: "#ffffff" };
loose["drak"];   // 编译器放行，类型还谎称是 string —— 运行时是 undefined`,
              { filename: "Record vs 索引签名" },
            ),
          ],
        },
        {
          id: "ts2",
          heading: "手写 MyPick 和 MyPartial",
          headingEn: "How do you write MyPick and MyPartial by hand?",
          lede: "Implement Pick and Partial by hand",
          body: (
            <>
              <p>
                <strong>一句话：</strong>映射类型（mapped type）是
                「对属性名的联合做一次循环」。
                <code>{"{ [K in keyof T]?: T[K] }"}</code> 这一行就是
                Partial 的完整实现：逐个取出 T 的属性名，抄下原类型，
                加上可选修饰符。
              </p>
              <p>
                <strong>逐段拆这一行：</strong>
              </p>
              <ul>
                <li>
                  <code>keyof T</code> —— 属性名的联合。<code>User</code> 的就是
                  <code>{'"id" | "name" | "email"'}</code>。
                </li>
                <li>
                  <code>{"[K in keyof T]"}</code> —— 映射本体：
                  对联合里的每个成员各生成一个属性，<code>K</code> 是循环变量。
                </li>
                <li>
                  <code>?:</code> —— 给生成的属性加可选修饰符。
                  同一个位置还能写 <code>readonly</code>；写成
                  <code>-?</code> 是反向操作 —— 去掉可选，这正是
                  <code>Required</code> 的实现。
                </li>
                <li>
                  <code>{"T[K]"}</code> —— 索引访问类型（indexed access type）：
                  原属性是什么类型，就抄什么类型。
                </li>
              </ul>
              <p>
                <strong>MyPick 多一个泛型约束（generic constraint）：</strong>
                <code>K extends keyof T</code>。没有它，调用方可以给 K 传任何东西，
                <code>{"T[P]"}</code> 也就没法算。有了它，
                <code>{'MyPick<User, "age">'}</code> 在调用处直接报
                <code>{"Type '\"age\"' does not satisfy the constraint"}</code>，
                而不是悄悄得出一个错的类型。
              </p>
              <p>
                <strong>会追问：</strong>「Omit 怎么用 Pick 组合出来？」——
                <code>{"Pick<T, Exclude<keyof T, K>>"}</code>：
                先用 Exclude 从全部键里去掉 K，剩下的交给 Pick。
                能再补一句「官方 <code>Omit</code> 的约束是 <code>keyof any</code>，
                比 <code>keyof T</code> 宽，所以官方版允许去掉一个不存在的键」，
                说明你真读过 lib.es5.d.ts ——
                背 API 的人和读过实现的人，在这一问上分开。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> a mapped type is one loop over a union of
                property names. The single line{" "}
                <code>{"{ [K in keyof T]?: T[K] }"}</code> is the whole implementation
                of Partial: take each property name of T, copy its original type, add
                the optional modifier.
              </p>
              <p>
                <strong>Reading it piece by piece:</strong>
              </p>
              <ul>
                <li>
                  <code>keyof T</code> — the union of property names. For{" "}
                  <code>User</code> that is <code>{'"id" | "name" | "email"'}</code>.
                </li>
                <li>
                  <code>{"[K in keyof T]"}</code> — the mapping itself: generate one
                  property per member of the union, with <code>K</code> as the loop
                  variable.
                </li>
                <li>
                  <code>?:</code> — add the optional modifier to the generated
                  property. The same slot also takes <code>readonly</code>; and{" "}
                  <code>-?</code> goes the other way — it removes optionality, which is
                  exactly how <code>Required</code> is implemented.
                </li>
                <li>
                  <code>{"T[K]"}</code> — an indexed access type: whatever type the
                  original property had, copy it.
                </li>
              </ul>
              <p>
                <strong>MyPick needs one extra generic constraint:</strong>{" "}
                <code>K extends keyof T</code>. Without it, callers may pass anything
                as K, and <code>{"T[P]"}</code> cannot be computed. With it,{" "}
                <code>{'MyPick<User, "age">'}</code> fails right at the call site with{" "}
                <code>{"Type '\"age\"' does not satisfy the constraint"}</code>,
                instead of quietly producing a wrong type.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;How do you build Omit out of
                Pick?&rdquo; — <code>{"Pick<T, Exclude<keyof T, K>>"}</code>: Exclude
                removes K from the full key set, Pick keeps the rest. Add that the
                official <code>Omit</code> constrains K to <code>keyof any</code> —
                looser than <code>keyof T</code>, so the official one lets you omit a
                key that does not exist — and it shows you have actually read
                lib.es5.d.ts. People who memorized the API and people who read the
                implementation part ways on this one question.
              </p>
            </>
          ),
          code: [
            demo(
              "ts",
              `interface User {
  id: number;
  name: string;
  email: string;
}

// MyPartial：把每个属性抄一遍，顺手加上 ?
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};

// 逐段读：
//   keyof T        属性名的联合："id" | "name" | "email"
//   [K in ...]     映射：对联合里的每个成员各生成一个属性，K 是循环变量
//   ?:             给生成的属性加可选修饰符
//   T[K]           索引访问：原属性是什么类型，就抄什么类型

// MyPick：只保留 K 里列出的属性
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};

type Draft = MyPartial<User>;
// { id?: number; name?: string; email?: string }

type Card = MyPick<User, "id" | "name">;
// { id: number; name: string }

// MyPick<User, "age"> 在这一行就报错，而不是悄悄得到一个错的类型`,
              { filename: "MyPartial 与 MyPick" },
            ),
            demo(
              "ts",
              `// 追问的标准答案：Omit = 先算键的补集，再 Pick
type MyOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

interface User {
  id: number;
  name: string;
  email: string;
}

type NoEmail = MyOmit<User, "email">;
// { id: number; name: string }

// 官方 Omit 的约束更宽：K extends keyof any（即 string | number | symbol）。
// 所以 Omit<User, "notAKey"> 合法，MyOmit<User, "notAKey"> 报错。`,
              { filename: "追问：Omit 怎么组合出来" },
            ),
          ],
        },
        {
          id: "ts3",
          heading: "Exclude、Extract、ReturnType 是怎么实现的",
          headingEn: "How are Exclude, Extract and ReturnType implemented?",
          lede: "How are Exclude, Extract and ReturnType implemented",
          body: (
            <>
              <p>
                <strong>一句话：</strong>三个都是条件类型（conditional type）——
                类型层面的三元表达式 <code>T extends U ? X : Y</code>。
                Exclude 和 Extract 靠它的分配律（distributive）过滤联合；
                ReturnType 再加上 <code>infer</code>，从函数类型里拆出返回值。
              </p>
              <p>
                <strong>分配律：</strong>当 <code>T</code> 是裸类型参数、
                实参又是联合时，条件类型不把联合当整体判断，
                而是逐个成员代入、再把结果并起来。
                <code>{'Exclude<"a" | "b" | "c", "a">'}</code> 因此展开成三次判断：
                命中的变成 <code>never</code>，而 never 是空联合，
                并进结果就消失了。「过滤」的本质，是「把不要的变成 never」。
              </p>
              <p>
                <strong>infer：</strong>在 <code>extends</code> 右边的模式里挖一个洞，
                匹配成功时编译器负责把洞填上。
                <code>{"T extends (...args: any[]) => infer R ? R : never"}</code>
                里的 <code>R</code> 就是那个洞 —— T 匹配到函数类型时，
                R 被填成它的返回类型。同一招能拆数组元素、Promise 的值、
                函数参数（<code>Parameters</code> 就是把洞挖在参数位置）。
              </p>
              <p>
                <strong>会追问：</strong>「怎么关掉分配律？」—— 两边包一层元组：
                <code>{"[T] extends [U]"}</code>，T 不再是裸的，联合就被当成整体。
                「<code>{"Exclude<T, T>"}</code> 是什么？」——
                <code>never</code>，每个成员都被自己命中。
                「never 传进去呢？」—— 还是 never：空联合循环零次。
                三问全是分配律的推论，吃透一条规则就全能答。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> all three are conditional types — a
                ternary at the type level, <code>T extends U ? X : Y</code>. Exclude
                and Extract filter unions through its distributive behavior; ReturnType
                adds <code>infer</code> to pull the return type out of a function type.
              </p>
              <p>
                <strong>Distributivity:</strong> when <code>T</code> is a bare type
                parameter and the argument is a union, the conditional does not judge
                the union as a whole — it substitutes each member separately and unions
                the results. <code>{'Exclude<"a" | "b" | "c", "a">'}</code> therefore
                expands into three checks: matching members become <code>never</code>,
                and never is the empty union, so it vanishes when merged back in.
                Filtering really means turning the unwanted members into never.
              </p>
              <p>
                <strong>infer:</strong> it digs a hole in the pattern to the right of{" "}
                <code>extends</code>, and the compiler fills the hole when the match
                succeeds. In{" "}
                <code>{"T extends (...args: any[]) => infer R ? R : never"}</code>,{" "}
                <code>R</code> is that hole — when T matches a function type, R gets
                its return type. The same trick unpacks array elements, the value
                inside a Promise, or function parameters
                (<code>Parameters</code> is the same hole dug at the parameter
                position).
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;How do you switch distributivity
                off?&rdquo; — wrap both sides in a tuple:{" "}
                <code>{"[T] extends [U]"}</code>, T is no longer bare, so the union is
                judged as one piece. &ldquo;What is <code>{"Exclude<T, T>"}</code>
                ?&rdquo; — <code>never</code>: every member is matched by itself.
                &ldquo;And feeding never in?&rdquo; — still never: the empty union
                loops zero times. All three are corollaries of one rule — master
                distributivity and the whole set falls out.
              </p>
            </>
          ),
          code: [
            demo(
              "ts",
              `// 条件类型：类型层面的三元表达式
type IsString<T> = T extends string ? true : false;
type A = IsString<"hi">;   // true
type B = IsString<42>;     // false

// 分配律：裸类型参数遇到联合，逐个成员代入，再把结果并起来
type NoA = Exclude<"a" | "b" | "c", "a">;
// = ("a" extends "a" ? never : "a")
// | ("b" extends "a" ? never : "b")
// | ("c" extends "a" ? never : "c")
// = never | "b" | "c"
// = "b" | "c"            ← never 是空联合，并进去就消失

// 手写版各一行
type MyExclude<T, U> = T extends U ? never : T;
type MyExtract<T, U> = T extends U ? T : never;`,
              { filename: "分配律：过滤联合" },
            ),
            demo(
              "ts",
              `// infer R：在匹配的模式里挖一个洞，编译器匹配成功时负责填上
// （lib.es5.d.ts 里的 ReturnType 就是这么写的）
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function getUser() {
  return { id: 1, name: "Ada" };
}

type U = MyReturnType<typeof getUser>;
// { id: number; name: string }

// 同一招能拆任何复合类型
type ElementOf<T> = T extends (infer E)[] ? E : never;
type Unwrap<T> = T extends Promise<infer V> ? V : T;

type N = ElementOf<number[]>;        // number
type S = Unwrap<Promise<string>>;    // string`,
              { filename: "infer：把返回类型拆出来" },
            ),
          ],
        },
      ],
      exercises: [
        {
          kind: "recognition",
          id: "iv-ts-utility-recog",
          title: "认出这个 mapped type 在干什么",
          level: 1,
          generated: true,
          prompt: (
            <p>
              面试官给出下面这个类型，问它对 <code>T</code> 做了什么。
            </p>
          ),
          code: demo(
            "ts",
            `type Mystery<T> = {
  [K in keyof T]-?: T[K];
};`,
            { filename: "Mystery.ts" },
          ),
          options: [
            { id: "a", label: "把所有属性变成可选" },
            { id: "b", label: "把所有属性变成必填（去掉可选修饰符）" },
            { id: "c", label: "把所有属性变成只读" },
            { id: "d", label: "只保留 T 里原本就可选的属性" },
          ],
          answer: ["b"],
          explain: (
            <>
              <p>
                <strong>B。</strong><code>-?</code> 是「去掉可选修饰符」：
                映射每个属性时，把原来的 <code>?</code> 摘掉。
                这正是官方 <code>Required</code> 的实现。
              </p>
              <p>
                A 是 <code>?</code>（Partial 的做法）；C 是
                <code>readonly</code>（Readonly 的做法）；
                D 那种「按条件挑属性」要靠键重映射（key remapping，
                <code>as</code> 子句）配合条件类型，这一行里并没有出现。
              </p>
            </>
          ),
        },
      ],
      transfer: [
        {
          signal: "更新函数要接「只改几个字段」的参数",
          signalEn: "An update function takes an argument that changes only a few fields",
          reachFor: "Partial<T> 当 patch 类型：可选，但保留字段级检查",
          reachForEn: "Partial<T> as the patch type: every field optional, but each field still checked",
        },
        {
          signal: "组件只用到大类型的几个字段",
          signalEn: "A component uses only a few fields of a large type",
          reachFor: "Pick 白名单；对外脱敏优先 Pick 而不是 Omit",
          reachForEn: "Pick as an allow list; when hiding fields from the outside, prefer Pick over Omit",
        },
        {
          signal: "键是有限集合的字典",
          signalEn: "A dictionary whose keys are a fixed set",
          reachFor: "Record<字面量联合, V>，少键多键都在编译期报错",
          reachForEn: "Record<union of literals, V>; a missing key and an extra key are both compile errors",
        },
        {
          signal: "被问「XX 工具类型怎么实现」",
          signalEn: "Asked how some utility type is implemented",
          reachFor: "mapped type 循环属性；conditional type 配 infer 拆结构",
          reachForEn: "A mapped type loops over properties; a conditional type with infer pulls a type apart",
        },
      ],
      recap: [
        "五个 utility type 对应五种属性集合操作：变可选、变必填、留白名单、去黑名单、按键集合造字典。",
        "Partial 是浅的：只动第一层，嵌套对象内部照样必填。",
        "mapped type 一行四件事：keyof T 取键、in 循环、?/readonly/-? 改修饰符、T[K] 抄类型。",
        "MyPick 的 K extends keyof T 是泛型约束，把传错键的错误挡在调用处。",
        "Omit = Pick<T, Exclude<keyof T, K>>；官方 Omit 的 K 约束是 keyof any，比 keyof T 宽。",
        "分配律：裸类型参数遇到联合就逐成员求值再并；never 是空联合，并进去就消失。",
      ],
      recapEn: [
        "The five utility types are five operations on a set of properties: make optional, make required, keep an allow list, drop a deny list, and build a dictionary from a key set.",
        "Partial is shallow: it only changes the top level, so fields inside a nested object stay required.",
        "A mapped type does four things in one line: keyof T lists the keys, in loops over them, ?/readonly/-? change the modifiers, and T[K] copies the type.",
        "In MyPick, K extends keyof T is a generic constraint; it reports a wrong key at the call site.",
        "Omit = Pick<T, Exclude<keyof T, K>>; the built-in Omit constrains K to keyof any, which is looser than keyof T.",
        "Distribution: when a bare type parameter meets a union, each member is evaluated separately and the results are joined; never is the empty union, so it disappears from the join.",
      ],
    },

    /* ============================================================
       泛型与收窄（3 题）
       ============================================================ */
    {
      id: "iv-ts-generics",
      title: "泛型与收窄：把 any 赶出代码",
      titleEn: "Generics and narrowing: getting any out of the code",
      blurb:
        "getProp 为什么必须约束 K extends keyof T，判别联合加 never 兜底做穷尽检查，unknown / any / never 的三种语义。",
      blurbEn:
        "Why getProp must constrain K extends keyof T, exhaustiveness checking with a discriminated union and a never fallback, and what unknown / any / never each mean.",
      minutes: 26,
      objectives: [
        "写出 getProp<T, K extends keyof T>(obj: T, key: K): T[K]，并解释约束和返回类型各解决什么",
        "用判别联合、switch 收窄和 never 兜底写出编译期的穷尽检查",
        "说清 as 断言为什么是逃生舱：它让编译器闭嘴，不产生任何运行时检查",
        "分清 unknown / any / never，并写出 catch (e) 的标准处理",
      ],
      objectivesEn: [
        "Write getProp<T, K extends keyof T>(obj: T, key: K): T[K], and explain what the constraint and the return type each fix",
        "Use a discriminated union, a switch that narrows, and a never fallback to get an exhaustiveness check at compile time",
        "Explain why an as assertion is only an escape hatch: it silences the compiler and adds no runtime check",
        "Tell unknown / any / never apart, and write the standard handling for catch (e)",
      ],
      whyForAssessment:
        "senior 面试的泛型题多半长成 getProp 的样子：先让你写，再追问「不写约束行不行」「返回 any 行不行」。收窄和 unknown 两道验的是同一件事 —— 不靠 any 也能过编译。代码里 any 的密度，面试官是真的会看。",
      whyForAssessmentEn:
        "Generic questions in senior interviews usually look like getProp: first write it, then answer what happens without the constraint, and what happens if it returns any. The narrowing question and the unknown question test the same thing — your code compiles without any. Interviewers really do look at how much any is in your code.",
      concepts: [
        {
          id: "ts4",
          heading: "为什么 getProp 必须写 K extends keyof T",
          headingEn: "Why does getProp need K extends keyof T?",
          lede: "Why does getProp need the constraint K extends keyof T",
          body: (
            <>
              <p>
                <strong>一句话：</strong>这个约束向编译器证明
                「K 一定是 T 的属性名之一」。有了它，<code>{"obj[key]"}</code>
                才编译得过，返回类型才能精确写成 <code>{"T[K]"}</code> ——
                一个约束同时解决合法性和精确性两件事。
              </p>
              <p>
                <strong>不写约束报什么错：</strong>
                <code>{"Type 'K' cannot be used to index type 'T'."}</code>
                不加约束时 K 和 T 之间没有任何关系，
                编译器无法证明 obj 上存在这个键，索引表达式直接被拒。
                这是泛型题里最常见的报错，认出它就知道缺的是约束。
              </p>
              <p>
                <strong>为什么返回 <code>{"T[K]"}</code> 而不是 any：</strong>
                T[K] 是索引访问类型，在每个调用点按实参单独求值 ——
                <code>{'getProp(user, "name")'}</code> 得 string，
                <code>{'getProp(user, "active")'}</code> 得 boolean。
                精确性的来源是 K 被推断成<strong>字面量类型（literal type）</strong>
                （<code>{'"name"'}</code>，而不是 string）。
                返回 any 的版本编译也过，但类型信息在函数出口全部蒸发，
                调用方从此拿着一个不受检查的值。
              </p>
              <p>
                <strong>会追问：</strong>「那写
                <code>{"(obj: object, key: string): any"}</code> 有什么问题？」——
                能跑，但传错对象、拼错键、用错返回值，全都要等运行时才炸；
                junior 版和 senior 版的差距就在这。
                「约束能带默认值吗？」—— 能：
                <code>{"<T extends object = Record<string, unknown>>"}</code>。
                「为什么要两个类型参数？」—— 因为 K 的合法取值依赖 T。
                「一个参数的取值范围由另一个参数决定」，
                正是泛型约束的典型使用场景。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> the constraint proves to the compiler
                that K is one of T&rsquo;s property names. Only then does{" "}
                <code>{"obj[key]"}</code> compile, and only then can the return type be
                written precisely as <code>{"T[K]"}</code> — one constraint buys both
                legality and precision.
              </p>
              <p>
                <strong>What fails without it:</strong>{" "}
                <code>{"Type 'K' cannot be used to index type 'T'."}</code> With no
                constraint there is no relationship between K and T, so the compiler
                cannot prove the key exists on obj, and it rejects the index expression
                outright. It is the single most common error in generics questions —
                recognize it and you know a constraint is missing.
              </p>
              <p>
                <strong>Why return <code>{"T[K]"}</code> rather than any:</strong> T[K]
                is an indexed access type, evaluated per call site against the actual
                argument — <code>{'getProp(user, "name")'}</code> gives string,{" "}
                <code>{'getProp(user, "active")'}</code> gives boolean. The precision
                comes from K being inferred as a <strong>literal type</strong>{" "}
                (<code>{'"name"'}</code>, not string). The any version compiles too,
                but every bit of type information evaporates at the function exit, and
                callers are left holding an unchecked value.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;So what is wrong with{" "}
                <code>{"(obj: object, key: string): any"}</code>?&rdquo; — it runs, but
                a wrong object, a misspelled key or a misused return value all wait
                until runtime to blow up; that gap is the junior version versus the
                senior one. &ldquo;Can a constraint have a default?&rdquo; — yes:{" "}
                <code>{"<T extends object = Record<string, unknown>>"}</code>.
                &ldquo;Why two type parameters?&rdquo; — because the legal values of K
                depend on T. One parameter whose range is decided by another is exactly
                what generic constraints are for.
              </p>
            </>
          ),
          code: [
            demo(
              "ts",
              `// 不加约束：K 和 T 之间没有任何关系，编译器不能证明 obj 上有这个键
function getPropBad<T, K>(obj: T, key: K) {
  // return obj[key];
  // ✗ Type 'K' cannot be used to index type 'T'.
}

// 加约束：K 被限制在 T 的属性名里，返回类型精确到 T[K]
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { id: 1, name: "Ada", active: true };

const n = getProp(user, "name");     // n 的类型是 string
const a = getProp(user, "active");   // a 的类型是 boolean
// getProp(user, "email");           // ✗ 编译期就挡住，不用等运行时的 undefined`,
              { filename: "约束前 vs 约束后" },
            ),
          ],
        },
        {
          id: "ts5",
          heading: "判别联合怎么配合 switch 做穷尽检查",
          headingEn: "How does a discriminated union work with switch to check every case?",
          lede: "How do discriminated unions enable exhaustiveness checking",
          body: (
            <>
              <p>
                <strong>一句话：</strong>判别联合（discriminated union，
                也译可辨识联合）指每个成员都带同一个字段、
                且字段类型是互不相同的字面量。<code>switch</code> 这个字段，
                每个 <code>case</code> 里编译器自动收窄；<code>default</code>
                里把值赋给 <code>never</code>，将来加了成员忘了处理，
                编译直接失败 —— 这就是穷尽检查（exhaustiveness check）。
              </p>
              <p>
                <strong>穷尽检查的机制：</strong>控制流走到 default 时，
                编译器算出「还没被 case 排除的成员」。三个成员都处理过，
                剩下的是 never，<code>{"const exhausted: never = s"}</code> 成立；
                第四个成员加进来却没写 case，剩下的就不是 never，
                这一行立刻报错。错误出现在「忘了改的那处代码」，
                而不是上线之后。
              </p>
              <p>
                <strong>对比 as 断言：</strong>收窄的每一步都对应一个
                真实的运行时检查，是「证明」；<code>as</code>
                不产生任何运行时代码，是「让编译器闭嘴」。
                <code>{"JSON.parse(...) as Shape"}</code> 能过编译，
                但值长什么样由运行时说了算，
                错误被推迟到离出错点很远的地方爆发。
                as 有正当用途（类型守卫内部、测试代码、DOM 查询的细化），
                但拿它替代收窄，等于手动关掉编译期的保障。
              </p>
              <p>
                <strong>会追问：</strong>「typeof 收窄为什么不够用？」——
                typeof 对一切对象都返回 <code>{'"object"'}</code>，
                分不开对象联合的成员；判别联合就是给对象联合准备的收窄手段。
                本站 foundations 的 TS 课里 <code>SettledResult</code> 按
                <code>status</code> 收窄就是同一招，这一题只是往深处多走一层。
                「判别字段为什么必须是字面量类型？」——
                两个成员的字段如果都是 string，编译器无从区分。
                还会问 assertNever：把 default 里那两行抽成
                <code>{"function assertNever(x: never): never"}</code>，
                每个 switch 复用。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> a discriminated union is one where every
                member carries the same field, each typed as a different literal.{" "}
                <code>switch</code> on that field and the compiler narrows
                automatically in every <code>case</code>; in <code>default</code>,
                assign the value to <code>never</code>, and if a member is added later
                without a case, compilation fails on the spot — that is exhaustiveness
                checking.
              </p>
              <p>
                <strong>How the check works:</strong> when control flow reaches
                default, the compiler computes which members the cases have not
                eliminated. With all three handled, what remains is never, so{" "}
                <code>{"const exhausted: never = s"}</code> holds; add a fourth member
                without a case and what remains is no longer never, so that line errors
                immediately. The failure shows up at the code you forgot to change —
                not in production.
              </p>
              <p>
                <strong>Contrast with as:</strong> every narrowing step corresponds to
                a real runtime check — it is proof. <code>as</code> emits no runtime
                code at all — it just silences the compiler.{" "}
                <code>{"JSON.parse(...) as Shape"}</code> compiles, but the runtime
                decides what the value actually looks like, and the error detonates far
                from where it was planted. as has legitimate uses (inside type guards,
                in test code, refining DOM queries), but using it in place of narrowing
                means switching off the compile-time guarantee by hand.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Why is typeof narrowing not
                enough?&rdquo; — typeof answers <code>{'"object"'}</code> for every
                object, so it cannot tell union members apart; discriminated unions are
                the narrowing tool built for object unions. The foundations TS lesson
                on this site narrows <code>SettledResult</code> by{" "}
                <code>status</code> with the same move — this question just goes one
                level deeper. &ldquo;Why must the discriminant be a literal
                type?&rdquo; — if both members type the field as string, the compiler
                has nothing to tell them apart by. Expect assertNever too: extract
                those two default lines into{" "}
                <code>{"function assertNever(x: never): never"}</code> and reuse it in
                every switch.
              </p>
            </>
          ),
          code: [
            demo(
              "ts",
              `type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number }
  | { kind: "rect"; width: number; height: number };

function area(s: Shape): number {
  switch (s.kind) {
    case "circle":
      return Math.PI * s.radius ** 2;   // 这个分支里 s 已收窄为 circle
    case "square":
      return s.side ** 2;
    case "rect":
      return s.width * s.height;
    default: {
      // 穷尽检查：三个成员都处理过，s 在这里只能是 never。
      // 将来加了第四种 kind 却忘了写 case，这一行立刻编译报错。
      const exhausted: never = s;
      return exhausted;
    }
  }
}`,
              { filename: "判别联合与穷尽检查" },
            ),
            demo(
              "ts",
              `// as 是「让编译器闭嘴」，不是「向编译器证明」
const draft = JSON.parse(localStorage.getItem("draft") ?? "{}") as Shape;
// 编译器信了。但运行时这里可能是任何东西，错误被推迟到别处爆发

// 类型守卫是「证明」：每一步收窄都有真实的运行时检查兜着
function isShape(x: unknown): x is Shape {
  if (typeof x !== "object" || x === null) return false;
  if (!("kind" in x)) return false;
  return x.kind === "circle" || x.kind === "square" || x.kind === "rect";
}

const raw: unknown = JSON.parse(localStorage.getItem("draft") ?? "{}");
if (isShape(raw)) {
  area(raw);   // ✓ 这一行的安全是运行时检查换来的，不是宣称出来的
}`,
              { filename: "as 是闭嘴，收窄是证明" },
            ),
          ],
        },
        {
          id: "ts6",
          heading: "unknown、any、never 各自是什么语义",
          headingEn: "What do unknown, any and never each mean?",
          lede: "What do unknown, any and never each mean",
          body: (
            <>
              <p>
                <strong>一句话：</strong><code>unknown</code> 是
                「还不知道是什么，用之前必须先证明」；<code>any</code> 是
                「放弃检查，双向放行」；<code>never</code> 是「不可能有值」。
                三个词各占类型系统的一个极端。
              </p>
              <p>
                <strong>放进类型层级看：</strong>
              </p>
              <ul>
                <li>
                  <code>unknown</code> 是顶类型（top type）：任何值都能赋给它；
                  但不先收窄，它什么都做不了 —— 连
                  <code>u.toUpperCase()</code> 都编译不过。
                </li>
                <li>
                  <code>never</code> 是底类型（bottom type）：它能赋给任何类型，
                  但没有类型能赋给它 —— 因为它根本没有值。
                </li>
                <li>
                  <code>any</code> 不在层级里，它是关掉检查的开关：
                  双向都能赋，而且会传染 —— 碰过 any 的表达式结果还是 any，
                  一处 any 能顺着数据流污染一整个模块。
                </li>
              </ul>
              <p>
                <strong><code>catch (e)</code> 怎么处理：</strong>strict 模式下
                （TS 4.4 起的 <code>useUnknownInCatchVariables</code>）
                e 是 unknown，因为 JS 允许 throw 任何值。直接读
                <code>e.message</code> 编译不过；标准写法是
                <code>e instanceof Error</code> 收窄后读 message，
                else 分支 <code>String(e)</code> 兜底。推而广之：
                JSON.parse 的结果、API 响应、一切外部输入，
                入口处都该标 unknown，收窄之后再进业务代码 ——
                unknown 是边界上的类型。
              </p>
              <p>
                <strong>会追问：</strong>「void 和 never 什么区别？」——
                void 是正常返回、只是不带值；never 是根本不会正常返回
                （throw 或死循环）。「never 还有什么用？」——
                上一题的穷尽检查，加上在 <code>Exclude</code> 里当删除用：
                never 是空联合，并进联合就消失。
                「为什么宁用 unknown 不用 any？」——
                unknown 把「先检查再用」变成编译器强制的动作；
                any 把它变成自觉，而自觉在赶工期的时候最先消失。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> <code>unknown</code> means &ldquo;not
                known yet — prove it before you use it&rdquo;; <code>any</code> means
                &ldquo;checking abandoned, both directions waved through&rdquo;;{" "}
                <code>never</code> means &ldquo;no value can exist here&rdquo;. Three
                words, three extremes of the type system.
              </p>
              <p>
                <strong>Placed in the type hierarchy:</strong>
              </p>
              <ul>
                <li>
                  <code>unknown</code> is the top type: every value is assignable to
                  it; but until you narrow it, it can do nothing — even{" "}
                  <code>u.toUpperCase()</code> refuses to compile.
                </li>
                <li>
                  <code>never</code> is the bottom type: it is assignable to
                  everything, yet nothing is assignable to it — because it has no
                  values at all.
                </li>
                <li>
                  <code>any</code> sits outside the hierarchy; it is the switch that
                  turns checking off: assignable both ways, and contagious — an
                  expression that touches any becomes any, and one any can pollute a
                  whole module along the data flow.
                </li>
              </ul>
              <p>
                <strong>Handling <code>catch (e)</code>:</strong> under strict mode
                (<code>useUnknownInCatchVariables</code>, since TS 4.4) e is unknown,
                because JS lets you throw anything. Reading{" "}
                <code>e.message</code> directly does not compile; the standard shape is
                narrowing with <code>e instanceof Error</code> before touching message,
                with <code>String(e)</code> as the else fallback. Generalize it: the
                result of JSON.parse, API responses, all external input should enter as
                unknown and get narrowed before reaching business code — unknown is the
                type for boundaries.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;void versus never?&rdquo; — void
                returns normally, just without a value; never does not return normally
                at all (it throws, or loops forever). &ldquo;What else is never
                for?&rdquo; — the exhaustiveness check from the previous card, plus
                playing deletion inside <code>Exclude</code>: never is the empty union,
                so merging it in makes members disappear. &ldquo;Why unknown over
                any?&rdquo; — unknown turns check-before-use into something the
                compiler enforces; any turns it into self-discipline, and
                self-discipline is the first thing to go when a deadline lands.
              </p>
            </>
          ),
          code: [
            demo(
              "ts",
              `// any：双向放行 —— 什么都能赋给它，它也能赋给任何类型
const a: any = JSON.parse('"hi"');
const n1: number = a;      // 编译器不吭声，n1 实际是个字符串
a.toFixed();               // 编译通过，运行时 TypeError

// unknown：进来随便，出去必须先收窄
const u: unknown = JSON.parse('"hi"');
// const n2: number = u;   // ✗ Type 'unknown' is not assignable to type 'number'
// u.toUpperCase();        // ✗ 'u' is of type 'unknown'
if (typeof u === "string") {
  u.toUpperCase();         // ✓ 证明它是 string 之后才能用
}

// never：不可能有值 —— 要么抛错，要么根本走不到
function fail(msg: string): never {
  throw new Error(msg);
}`,
              { filename: "三个极端" },
            ),
            demo(
              "ts",
              `try {
  JSON.parse("{oops");
} catch (e) {
  // strict 下（useUnknownInCatchVariables）e 是 unknown：
  // console.error(e.message);   // ✗ 'e' is of type 'unknown'
  if (e instanceof Error) {
    console.error(e.message);    // ✓ 收窄成 Error 之后才能读 message
  } else {
    console.error(String(e));    // 兜底：JS 允许 throw 任何值，包括字符串
  }
}`,
              { filename: "catch (e) 的标准处理" },
            ),
          ],
        },
      ],
      exercises: [
        {
          kind: "recognition",
          id: "iv-ts-generics-recog",
          title: "unknown 参数该怎么用起来",
          level: 1,
          generated: true,
          prompt: (
            <p>
              这个函数编译不过：
              <code>{"'e' is of type 'unknown'."}</code>
              下面哪种改法是对的？
            </p>
          ),
          code: demo(
            "ts",
            `function report(e: unknown) {
  console.log(e.message);
  //            ^ ✗ 'e' is of type 'unknown'.
}`,
            { filename: "report.ts" },
          ),
          options: [
            { id: "a", label: "把参数类型改成 any，报错消失" },
            {
              id: "b",
              label:
                "先 e instanceof Error 收窄再读 message，else 里用 String(e) 兜底",
            },
            { id: "c", label: "改成 (e as Error).message，一行解决" },
            { id: "d", label: "unknown 不能当参数类型，把它改成 Error" },
          ],
          answer: ["b"],
          explain: (
            <>
              <p>
                <strong>B。</strong>只有它用真实的运行时检查换来了类型安全。
              </p>
              <p>
                A 能编译，但等于把检查整个关掉 ——
                unknown 存在的意义就是逼你写检查。
                C 也能编译，但 <code>as</code> 不产生运行时检查：
                throw 出来的可以是字符串，运行时照样 undefined。
                D 把「调用方可能传任何东西」这个事实改没了 ——
                类型应该描述事实，不是描述愿望。
              </p>
            </>
          ),
        },
      ],
      transfer: [
        {
          signal: "报错 Type 'K' cannot be used to index type 'T'",
          signalEn: "The error Type 'K' cannot be used to index type 'T'",
          reachFor: "给 K 加约束：K extends keyof T",
          reachForEn: "Constrain K: K extends keyof T",
        },
        {
          signal: "对象联合要按成员分别处理",
          signalEn: "A union of object types has to be handled member by member",
          reachFor: "判别字段 + switch 收窄，default 里赋给 never",
          reachForEn:
            "A discriminant field plus a switch that narrows; assign to never in the default branch",
        },
        {
          signal: "想写 as 让报错消失",
          signalEn: "You want to write as so an error goes away",
          reachFor: "先问有没有运行时检查；没有就写类型守卫，不是断言",
          reachForEn:
            "First ask whether there is a runtime check; if there is none, write a type guard, not an assertion",
        },
        {
          signal: "JSON.parse、catch、API 响应这类外部输入",
          signalEn: "Input from outside: JSON.parse, catch, an API response",
          reachFor: "入口标 unknown，收窄之后再进业务代码",
          reachForEn: "Type the entry point as unknown, narrow it, then let it into your own code",
        },
      ],
      recap: [
        "泛型约束一举两得：obj[key] 合法化，返回类型精确到 T[K]。",
        "T[K] 的精确来自 K 被推断成字面量类型，而不是 string。",
        "判别联合 = 同名字段、不同字面量；switch 收窄，default 赋给 never 做穷尽检查。",
        "as 是闭嘴不是证明：不产生运行时检查，错误被推迟到别处爆发。",
        "unknown 是顶、never 是底、any 在层级外还会传染；边界一律 unknown。",
        "catch (e) 的 e 是 unknown：instanceof Error 收窄，String(e) 兜底。",
      ],
      recapEn: [
        "The generic constraint does two things at once: obj[key] becomes legal, and the return type is exactly T[K].",
        "T[K] is exact because K is inferred as a literal type, not as string.",
        "A discriminated union has one field with the same name in every member, holding a different literal; switch narrows on it, and assigning to never in the default branch checks that no case is left out.",
        "as silences the compiler, it does not prove anything: there is no runtime check, so the error surfaces later somewhere else.",
        "unknown is the top type, never is the bottom type, and any sits outside the hierarchy and spreads; use unknown at every boundary.",
        "In catch (e), e is unknown: narrow it with instanceof Error, and fall back to String(e).",
      ],
    },
  ],
};
