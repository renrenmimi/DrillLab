"use client";

// 速查。考场上真正会翻的东西：命令、字段、Hook、SDL、directive、状态码、
// 报错对照表、Debug 清单。全部来自两个真实项目，不放通用手册里抄来的东西。

import { CodeBlock, TerminalCommand } from "./code";
import { real } from "@/content/helpers";
import { useActiveHeading } from "@/lib/use-active-heading";
import { L, T } from "./t";

// 【这一页的双语范围】
// 界面壳和速查条目**都是双语的** —— 表格单元格、说明文字、代码窗注释、
// Debug 清单的每一条都有英文。
// （原来这里写着「条目只有中文，属于课程正文英文版那件事」。那件事已经做完，
//   所以这条边界取消了，别再按它办。）
//
// 仍然照抄不译的只有三类：
//   · 命令本身（npm install、npx vitest run、mvn test）
//   · 字段名 / API 名 / 状态码（dependencies、useMemo、@key、201）
//   · 报错原文 —— 报错对照表**左列**是真实报错文本，照抄；右列的根因要译
// 代码片段的英文版走 codeEn，**行数必须和中文一致**（highlight 是行号）。
// Resolver 那段里的 `批量查询` 是中文标识符，改了会破坏代码结构比对，
// 所以原样保留，只在英文侧那行加了一句注释说明。
const SECTIONS: { id: string; zh: string; en: string }[] = [
  { id: "commands", zh: "命令", en: "Commands" },
  { id: "pkg", zh: "package.json", en: "package.json" },
  { id: "hooks", zh: "React Hooks", en: "React Hooks" },
  { id: "sdl", zh: "GraphQL SDL", en: "GraphQL SDL" },
  { id: "resolver", zh: "Resolver", en: "Resolvers" },
  { id: "fed", zh: "Federation", en: "Federation" },
  { id: "http", zh: "HTTP 状态码", en: "HTTP status codes" },
  { id: "errors", zh: "报错对照表", en: "Error table" },
  { id: "debug", zh: "Debug 清单", en: "Debug checklist" },
];

const SECTION_IDS = SECTIONS.map((s) => s.id);

export function Reference() {
  const active = useActiveHeading(SECTION_IDS);

  return (
    <main className="main">
      <div className="content">
        <div className="page-head">
          <div className="eyebrow">
            <T en="Reference" zh="速查" />
          </div>
          <h1 className="page-title display">
            <T en="The pages you actually flip to" zh="考场上会翻的那几页" />
          </h1>
          <p className="page-lede">
            <T
              en="Only what the two real projects actually use. Every command runs in one of them; every error message really came up during the audit."
              zh="只收两个真实项目里实际用到的东西。命令都是这两个项目能跑的，报错都是审计时真实出现过的。"
            />
          </p>
        </div>

        {/* ---------- 命令 ---------- */}
        <section className="sec" id="commands">
          <div className="sec-head">
            <span className="sec-n">§01</span>
            <h2 className="sec-title">
              <T en="Commands" zh="命令" />
            </h2>
          </div>
          <p className="sec-lede">
            <T
              zh={
                <>
                  注意两个项目的差别：react-notes-app <strong>没有</strong> test script，
                  node-subgraph <strong>有</strong>。
                </>
              }
              en={
                <>
                  Note the difference between the two projects: react-notes-app
                  has <strong>no</strong> test script; node-subgraph{" "}
                  <strong>has</strong> one.
                </>
              }
            />
          </p>

          <div className="minihead">react-notes-app</div>
          <TerminalCommand
            cwd="react-notes-app"
            steps={[
              { cmd: "npm install", out: L("装依赖", "Install dependencies") },
              {
                cmd: "npm run dev",
                out: L(
                  "起 Vite 开发服务器，浏览器打开提示的地址",
                  "Starts the Vite dev server. Open the address it prints.",
                ),
              },
              {
                cmd: "npx vitest run",
                out: L(
                  "跑 4 个测试。注意：这个项目没有 test script，npm test 会报 Missing script",
                  "Runs 4 tests. This project has no test script, so npm test reports Missing script.",
                ),
              },
              {
                cmd: "npx vitest",
                out: L(
                  "watch 模式，改代码自动重跑",
                  "Watch mode. Re-runs on every code change.",
                ),
              },
              {
                cmd: "npm run q2",
                out: L(
                  "跑 Q2 的验证台（tsx q2/demo.ts）",
                  "Runs the Q2 check harness (tsx q2/demo.ts).",
                ),
              },
              {
                cmd: "npx tsc --noEmit",
                out: L(
                  "只做类型检查。这个项目会报 10 个测试文件的 TS2582/TS2304 —— 是脚手架缺陷，不是你的问题",
                  "Type check only. This project reports TS2582/TS2304 in 10 test files. That is a defect in the starter code, not your bug.",
                ),
              },
              {
                cmd: "npm run build",
                out: L(
                  "tsc && vite build。因为上面那个原因，在原项目里是失败的",
                  "Runs tsc && vite build. It fails in the original project, for the reason above.",
                ),
              },
            ]}
          />

          <div className="minihead">node-subgraph</div>
          <TerminalCommand
            cwd="graphql-federation-practice/node-subgraph"
            steps={[
              {
                cmd: "npm install",
                out: L(
                  "装依赖（原本没有 node_modules，必须先装）",
                  "Install dependencies. There is no node_modules at first, so run this before anything else.",
                ),
              },
              {
                cmd: "npm start",
                out: L(
                  "起服务器，Subgraph ready at http://0.0.0.0:4000/",
                  "Starts the server. It prints: Subgraph ready at http://0.0.0.0:4000/",
                ),
              },
              {
                cmd: "npm test",
                out: L(
                  "跑 10 个测试（有 test script）",
                  "Runs 10 tests. This project does have a test script.",
                ),
              },
              { cmd: "npm run test:watch", out: L("watch 模式", "Watch mode.") },
              {
                cmd: `curl -X POST localhost:4000/ -H 'Content-Type: application/json' -d '{"query":"{ _service { sdl } }"}'`,
                out: L(
                  "拿 federation SDL —— Router 启动时问的就是这个",
                  "Fetches the federation SDL. This is exactly what the Router asks for at startup.",
                ),
              },
              {
                cmd: "node verify-schema.mjs",
                out: L(
                  "进程内验证（自己写的脚本，不占端口）",
                  "In-process check. A hand-written script; it does not bind a port.",
                ),
              },
            ]}
          />

          <div className="minihead">java-service</div>
          <TerminalCommand
            cwd="graphql-federation-practice/java-service"
            steps={[
              { cmd: "mvn test", out: L("跑 5 个测试", "Runs 5 tests.") },
              {
                cmd: "mvn spring-boot:run",
                out: L("起服务在 8080", "Starts the service on port 8080."),
              },
              {
                cmd: "mvn -o test",
                out: L(
                  "离线跑（依赖已在 ~/.m2 里之后可用）",
                  "Runs offline. Works once the dependencies are in ~/.m2.",
                ),
              },
              {
                cmd: "mvn clean package -DskipTests",
                out: L("打包但跳过测试", "Packages the app, skipping tests."),
              },
            ]}
          />

          <div className="minihead">
            <T zh="通用小抄" en="General cheatsheet" />
          </div>
          <TerminalCommand
            steps={[
              {
                cmd: "npm run",
                out: L(
                  "不带名字 → 列出这个项目所有可用 script",
                  "With no script name, lists every script this project defines.",
                ),
              },
              {
                cmd: L("npm ls <包名>", "npm ls <package>"),
                out: L(
                  "看某个包实际装了哪个版本",
                  "Shows which version of a package is actually installed.",
                ),
              },
              {
                cmd: "node -v && npm -v",
                out: L(
                  "确认版本（本机 Node 22.21.1）",
                  "Check versions. This machine runs Node 22.21.1.",
                ),
              },
              {
                cmd: L("npx <工具>", "npx <tool>"),
                out: L(
                  "执行 node_modules/.bin 里的工具，不需要有 script",
                  "Runs a tool from node_modules/.bin. No script entry needed.",
                ),
              },
            ]}
          />

          <div className="callout" data-tone="warn">
            <strong className="callout-title">
              <T zh="只有四个名字能省掉 run" en="Only four names can skip run" />
            </strong>
            <p>
              <T
                zh={
                  <>
                    <code>test</code>、<code>start</code>、<code>stop</code>、
                    <code>restart</code>。其余都必须写 <code>npm run xxx</code>{" "}
                    ——<code>npm build</code> 不会跑你的 build script。
                  </>
                }
                en={
                  <>
                    <code>test</code>, <code>start</code>, <code>stop</code>,{" "}
                    <code>restart</code>. Everything else needs{" "}
                    <code>npm run xxx</code>. <code>npm build</code> does not
                    run your build script.
                  </>
                }
              />
            </p>
          </div>
        </section>

        {/* ---------- package.json ---------- */}
        <section className="sec" id="pkg">
          <div className="sec-head">
            <span className="sec-n">§02</span>
            <h2 className="sec-title">
              <T en="package.json fields" zh="package.json 字段" />
            </h2>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <T en="Field" zh="字段" />
                  </th>
                  <th>
                    <T en="What it controls" zh="管什么" />
                  </th>
                  <th>
                    <T en="Values in the two projects" zh="两个项目里的值" />
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>name</code></td>
                  <td>
                    <T zh="包名" en="Package name" />
                  </td>
                  <td>react-notes-app / order-subgraph</td>
                </tr>
                <tr>
                  <td><code>private</code></td>
                  <td>
                    <T zh="禁止发布到 npm" en="Blocks publishing to npm" />
                  </td>
                  <td>
                    <T
                      zh="react-notes-app 有；subgraph 没有"
                      en="react-notes-app has it; subgraph does not"
                    />
                  </td>
                </tr>
                <tr>
                  <td><code>version</code></td>
                  <td>
                    <T zh="自身版本号" en="This package's own version number" />
                  </td>
                  <td>
                    <T zh="都是 1.0.0" en="1.0.0 in both" />
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>type</code>
                  </td>
                  <td>
                    <T
                      zh={
                        <>
                          <strong>module</strong> = 用 ESM（import/export）；
                          不写 = CommonJS（require）
                        </>
                      }
                      en={
                        <>
                          <strong>module</strong> = ESM (import/export). Leave
                          it out = CommonJS (require)
                        </>
                      }
                    />
                  </td>
                  <td>
                    <T zh="两个都是 module" en="module in both" />
                  </td>
                </tr>
                <tr>
                  <td><code>main</code></td>
                  <td>
                    <T zh="包的入口文件" en="The package's entry file" />
                  </td>
                  <td>
                    <T
                      zh="subgraph 是 src/index.js"
                      en="src/index.js in the subgraph"
                    />
                  </td>
                </tr>
                <tr>
                  <td><code>scripts</code></td>
                  <td>
                    <T
                      zh={
                        <>
                          <code>npm run &lt;名字&gt;</code> 能跑的命令
                        </>
                      }
                      en={
                        <>
                          Commands that <code>npm run &lt;name&gt;</code> can
                          run
                        </>
                      }
                    />
                  </td>
                  {/* 这一格只有一个全角分号是中文的，留在英文侧会像错字 */}
                  <td>
                    <T
                      zh="react: dev/build/q2；subgraph: start/test/test:watch"
                      en="react: dev/build/q2; subgraph: start/test/test:watch"
                    />
                  </td>
                </tr>
                <tr>
                  <td><code>dependencies</code></td>
                  <td>
                    <T
                      zh="产品运行时需要"
                      en="Needed while the product runs"
                    />
                  </td>
                  <td>react+react-dom / apollo+graphql+dataloader</td>
                </tr>
                <tr>
                  <td><code>devDependencies</code></td>
                  <td>
                    <T
                      zh="只在开发/构建/测试时需要"
                      en="Needed only for development, build and tests"
                    />
                  </td>
                  <td>vite/vitest/typescript / jest</td>
                </tr>
                <tr>
                  <td>
                    <T
                      zh={
                        <>
                          <code>jest</code> 等工具名
                        </>
                      }
                      en={
                        <>
                          <code>jest</code> and other tool names
                        </>
                      }
                    />
                  </td>
                  <td>
                    <T
                      zh={
                        <>
                          <strong>内嵌配置</strong> —— 找不到 jest.config.js
                          时看这里
                        </>
                      }
                      en={
                        <>
                          <strong>Inline config</strong> — look here when there
                          is no jest.config.js
                        </>
                      }
                    />
                  </td>
                  <td>
                    <T
                      zh="subgraph 的 jest 配置就在这里"
                      en="The subgraph keeps its jest config here"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="callout" data-tone="transfer">
            <strong className="callout-title">
              <T
                zh="依赖清单会泄题"
                en="The dependency list gives the question away"
              />
            </strong>
            <p>
              <T
                zh={
                  <>
                    subgraph 的 dependencies 里有 <code>dataloader</code>，
                    而 TODO 里正好要求「用 DataLoader 防 N+1」。
                    <strong>拿到新项目先读 dependencies，特殊的包就是考点。</strong>
                  </>
                }
                en={
                  <>
                    The subgraph lists <code>dataloader</code> in dependencies,
                    and one TODO asks you to stop N+1 queries with DataLoader.{" "}
                    <strong>
                      On a new project, read dependencies first. An unusual
                      package is the thing being tested.
                    </strong>
                  </>
                }
              />
            </p>
          </div>
        </section>

        {/* ---------- Hooks ---------- */}
        <section className="sec" id="hooks">
          <div className="sec-head">
            <span className="sec-n">§03</span>
            <h2 className="sec-title">
              <T en="React Hooks (the ones this exam uses)" zh="React Hooks（这道题用到的）" />
            </h2>
          </div>
          <CodeBlock
            ex={real(
              "tsx",
              `// useState —— 初始值看不出类型时必须显式写泛型
const [notes, setNotes] = useState<Note[]>([]);              // [] 看不出装什么
const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
const [title, setTitle] = useState("");                      // "" 已经说明是 string

// 三种不可变更新
setNotes((prev) => [...prev, item]);                                  // 增
setNotes((prev) => prev.filter((n) => n.id !== id));                  // 删
setNotes((prev) => prev.map((n) => (n.id === next.id ? next : n)));   // 改（保序）

// useEffect —— 依赖数组的三种写法
useEffect(fn, []);            // 只在首次渲染后跑一次
useEffect(fn, [noteToEdit]);  // 首次 + noteToEdit 变化时
useEffect(fn);                // 每次渲染后都跑 —— 几乎总是写错了

// 受控输入
<input value={title} onChange={(e) => setTitle(e.target.value)} />

// 表单提交
const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();     // 少了它页面会刷新，state 归零
  ...
};

// 列表渲染
{notes.map((note) => <NoteItem key={note.id} note={note} />)}
//                            ↑ 用稳定 id，永远不要用 index

// 事件处理器要传参数 -> 包一层箭头函数
<button onClick={() => onDelete(note.id)}>Delete</button>
<button onClick={onDelete(note.id)}>     {/* ✗ 渲染时就执行了 */}`,
              {
                filename: "React 速查",
                filenameEn: "React reference",
                sourceFile: "react-notes-app/src/",
                codeEn: `// useState — write the generic when the initial value does not show the type
const [notes, setNotes] = useState<Note[]>([]);              // [] does not say what goes in
const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
const [title, setTitle] = useState("");                      // "" already says string

// Three immutable updates
setNotes((prev) => [...prev, item]);                                  // add
setNotes((prev) => prev.filter((n) => n.id !== id));                  // remove
setNotes((prev) => prev.map((n) => (n.id === next.id ? next : n)));   // edit, order kept

// useEffect — three ways to write the dependency array
useEffect(fn, []);            // runs once, after the first render
useEffect(fn, [noteToEdit]);  // first render, then every noteToEdit change
useEffect(fn);                // after every render — almost always a mistake

// Controlled input
<input value={title} onChange={(e) => setTitle(e.target.value)} />

// Form submit
const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();     // without it the page reloads and state resets
  ...
};

// Rendering a list
{notes.map((note) => <NoteItem key={note.id} note={note} />)}
//                            ↑ use a stable id, never the index

// To pass an argument to a handler -> wrap it in an arrow function
<button onClick={() => onDelete(note.id)}>Delete</button>
<button onClick={onDelete(note.id)}>     {/* ✗ already ran during render */}`,
              },
            )}
          />
          <div className="callout" data-tone="trap">
            <strong className="callout-title">
              <T zh="三条铁律" en="Three hard rules" />
            </strong>
            <p>
              <T
                zh={
                  <>
                    ① 改 state 只能通过 setter，且必须造新对象（
                    <code>push</code> / <code>splice</code> /{" "}
                    <code>arr[i]=</code> 都会让界面不更新且不报错）。
                    <br />② effect 里修改的 state 不能出现在它自己的依赖数组里。
                    <br />③ 能从现有 state 算出来的值不要做成 state。
                  </>
                }
                en={
                  <>
                    ① Change state only through its setter, and always build a
                    new object (<code>push</code> / <code>splice</code> /{" "}
                    <code>arr[i]=</code> leave the interface stale, and raise no
                    error).
                    <br />② A state value that an effect writes must not appear
                    in that effect&apos;s own dependency array.
                    <br />③ If a value can be computed from state you already
                    have, do not make it state.
                  </>
                }
              />
            </p>
          </div>
        </section>

        {/* ---------- SDL ---------- */}
        <section className="sec" id="sdl">
          <div className="sec-head">
            <span className="sec-n">§04</span>
            <h2 className="sec-title">GraphQL SDL</h2>
          </div>
          <CodeBlock
            ex={real(
              "graphql",
              `# 可空性 —— 决定 resolver 的兜底策略
field: String        # 可空
field: String!       # 不可空
field: [T]           # 列表可空，元素可空
field: [T!]          # 列表可空，元素不可空
field: [T]!          # 列表不可空，元素可空
field: [T!]!         # 双重不可空 -> resolver 必须 ?? []，空列表是合法的

# 内置标量：ID String Int Float Boolean
# ID 序列化成字符串，别当数字用

enum OrderStatus { PENDING PROCESSING SHIPPED DELIVERED CANCELLED }
# 返回不在列表里的值会报错，大小写敏感

type Query {                      # 读入口，多个字段并行执行
  order(id: ID!): Order
  orders(userId: ID!): [Order!]!
}

type Mutation {                   # 写入口，多个字段串行执行
  createOrder(userId: ID!, items: [OrderItemInput!]!): Order!
}

input OrderItemInput {            # 只能当参数，不能有 resolver
  productId: ID!
  quantity: Int!
}`,
              {
                filename: "SDL 速查",
                filenameEn: "SDL reference",
                sourceFile:
                  "graphql-federation-practice/node-subgraph/src/schema.graphql",
                codeEn: `# Nullability — decides what the resolver has to fall back to
field: String        # nullable
field: String!       # non-null
field: [T]           # list nullable, items nullable
field: [T!]          # list nullable, items non-null
field: [T]!          # list non-null, items nullable
field: [T!]!         # both non-null -> resolver needs ?? [], an empty list is valid

# Built-in scalars: ID String Int Float Boolean
# ID serializes to a string. Do not treat it as a number.

enum OrderStatus { PENDING PROCESSING SHIPPED DELIVERED CANCELLED }
# Returning a value that is not in the list is an error. Case sensitive.

type Query {                      # read entry point, fields run in parallel
  order(id: ID!): Order
  orders(userId: ID!): [Order!]!
}

type Mutation {                   # write entry point, fields run one at a time
  createOrder(userId: ID!, items: [OrderItemInput!]!): Order!
}

input OrderItemInput {            # arguments only, cannot have resolvers
  productId: ID!
  quantity: Int!
}`,
              },
            )}
          />
        </section>

        {/* ---------- Resolver ---------- */}
        <section className="sec" id="resolver">
          <div className="sec-head">
            <span className="sec-n">§05</span>
            <h2 className="sec-title">
              <T en="Resolvers" zh="Resolver" />
            </h2>
          </div>
          <CodeBlock
            ex={real(
              "js",
              `// 四个参数
async fieldName(parent, args, context, info) { }
//              ↑上一层  ↑查询   ↑每请求   ↑元信息（本项目没用）
//               返回值   参数     的袋子

// 顶层 Query/Mutation 的 parent 无意义 -> 写成 _
async orders(_, { userId }, { dataSources, correlationId }) { }

// 字段 resolver 的 parent 至关重要
async shippingInfo(parent, _, { loaders }) {
  return loaders.shippingInfoLoader.load(parent.id);
}

// 这个项目 context 的确切结构
{
  dataSources: { orderDataSource, inventoryDataSource, shippingDataSource },
  loaders:     { shippingInfoLoader, orderLoader },
  correlationId
}

// 结构化错误 + 放行已包装的错误（贯穿全项目的模式）
try {
  if (!userId) {
    throw new GraphQLError('userId is required', {
      extensions: { code: 'INVALID_INPUT', correlationId }
    });
  }
  ...
} catch (error) {
  if (error instanceof GraphQLError) throw error;   // ← 这一行不能少
  throw new GraphQLError('Failed to ...', {
    extensions: { code: 'SERVICE_ERROR', correlationId, originalError: error.message }
  });
}

// DataLoader —— 两条硬契约
new DataLoader(async keys => {
  const rows = await 批量查询(keys);
  return keys.map(k => byKey.get(k) ?? null);   // 长度 === keys.length，顺序一一对应
});
// 永远不要 filter / sort / slice；「没有」用 null 占位
// 必须每请求新建，否则缓存跨请求泄漏`,
              {
                filename: "Resolver 速查",
                filenameEn: "Resolver reference",
                codeEn: `// The four arguments
async fieldName(parent, args, context, info) { }
//              ↑value   ↑query  ↑per-request ↑metadata (unused here)
//               above    args    bag

// On top-level Query/Mutation the parent means nothing -> write _
async orders(_, { userId }, { dataSources, correlationId }) { }

// On a field resolver the parent is what matters
async shippingInfo(parent, _, { loaders }) {
  return loaders.shippingInfoLoader.load(parent.id);
}

// The exact shape of context in this project
{
  dataSources: { orderDataSource, inventoryDataSource, shippingDataSource },
  loaders:     { shippingInfoLoader, orderLoader },
  correlationId
}

// Structured errors + re-throw the already-wrapped ones (pattern used project-wide)
try {
  if (!userId) {
    throw new GraphQLError('userId is required', {
      extensions: { code: 'INVALID_INPUT', correlationId }
    });
  }
  ...
} catch (error) {
  if (error instanceof GraphQLError) throw error;   // ← this line is required
  throw new GraphQLError('Failed to ...', {
    extensions: { code: 'SERVICE_ERROR', correlationId, originalError: error.message }
  });
}

// DataLoader — two hard contracts
new DataLoader(async keys => {
  const rows = await 批量查询(keys);              // your own batch query
  return keys.map(k => byKey.get(k) ?? null);   // length === keys.length, same order
});
// Never filter / sort / slice. Use null as the placeholder for "not found"
// Build a new one per request, or the cache leaks across requests`,
              },
            )}
          />
        </section>

        {/* ---------- Federation ---------- */}
        <section className="sec" id="fed">
          <div className="sec-head">
            <span className="sec-n">§06</span>
            <h2 className="sec-title">
              <T en="Federation directives and entities" zh="Federation directive 与 entity" />
            </h2>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <T en="Thing" zh="东西" />
                  </th>
                  <th>
                    <T en="Meaning" zh="含义" />
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>@key(fields: &quot;id&quot;)</code></td>
                  <td>
                    <T
                      zh={
                        <>
                          「别的 subgraph 给出 id 就能定位同一个我」。
                          可以复合（<code>&quot;isbn edition&quot;</code>），可以有多个
                        </>
                      }
                      en={
                        <>
                          Given an id from another subgraph, this one can find
                          the same object. A key can be composite (
                          <code>&quot;isbn edition&quot;</code>), and a type can
                          have several
                        </>
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td><code>@external</code></td>
                  <td>
                    <T
                      zh="这个字段由别的 subgraph 定义，我只借来做身份识别"
                      en="Another subgraph defines this field; this one only borrows it to identify the object"
                    />
                  </td>
                </tr>
                <tr>
                  <td><code>@shareable</code></td>
                  <td>
                    <T
                      zh="允许多个 subgraph 定义同一个字段。 本项目 import 了但没用到"
                      en="Lets several subgraphs define the same field. This project imports it but never uses it"
                    />
                  </td>
                </tr>
                <tr>
                  <td><code>__resolveReference</code></td>
                  <td>
                    <T
                      zh={
                        <>
                          把 representation 变成本地对象。
                          <strong>它的返回值就是下游字段 resolver 的 parent</strong>
                        </>
                      }
                      en={
                        <>
                          Turns a representation into a local object.{" "}
                          <strong>
                            What it returns becomes the parent for the field
                            resolvers under it
                          </strong>
                        </>
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td><code>_service</code></td>
                  <td>
                    <T
                      zh="自动生成的字段，返回 federation SDL。 Router 启动时查它"
                      en="A generated field that returns the federation SDL. The Router queries it at startup"
                    />
                  </td>
                </tr>
                <tr>
                  <td><code>_entities</code></td>
                  <td>
                    <T
                      zh="自动生成的字段，Router 运行时靠它做实体解析"
                      en="A generated field. At runtime the Router uses it to resolve entities"
                    />
                  </td>
                </tr>
                <tr>
                  <td><code>buildSubgraphSchema</code></td>
                  <td>
                    <T
                      zh={
                        <>
                          来自 <code>@apollo/subgraph</code>。
                          认识 federation directive，并自动加上面两个字段
                        </>
                      }
                      en={
                        <>
                          From <code>@apollo/subgraph</code>. It understands the
                          federation directives and adds the two fields above
                        </>
                      }
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <CodeBlock
            ex={real(
              "graphql",
              `# Router 会向你的 subgraph 发这两种请求 —— 本地验证就用它们

# ① 启动时：拿 SDL
{ _service { sdl } }

# ② 运行时：解析实体（这是你的 User.orders 真正被调用的路径）
query($r: [_Any!]!) {
  _entities(representations: $r) {
    ... on User { id orders { id status } }
  }
}
# variables: { "r": [{ "__typename": "User", "id": "123" }] }

# 复合 key 的 representation 要带全部 key 字段：
# { "__typename": "Book", "isbn": "978-1", "edition": 2 }`,
              {
                filename: "本地验证 Federation",
                filenameEn: "Verifying federation locally",
                codeEn: `# The Router sends your subgraph these two requests — use them to verify locally

# ① At startup: fetch the SDL
{ _service { sdl } }

# ② At runtime: resolve entities (this is the path your User.orders is really called on)
query($r: [_Any!]!) {
  _entities(representations: $r) {
    ... on User { id orders { id status } }
  }
}
# variables: { "r": [{ "__typename": "User", "id": "123" }] }

# A representation for a composite key must carry every key field:
# { "__typename": "Book", "isbn": "978-1", "edition": 2 }`,
              },
            )}
          />
        </section>

        {/* ---------- HTTP ---------- */}
        <section className="sec" id="http">
          <div className="sec-head">
            <span className="sec-n">§07</span>
            <h2 className="sec-title">
              <T en="HTTP status codes and how Spring writes them" zh="HTTP 状态码与 Spring 写法" />
            </h2>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <T en="Code" zh="码" />
                  </th>
                  <th>
                    <T en="When" zh="什么时候" />
                  </th>
                  <th>
                    <T en="How Spring writes it" zh="Spring 写法" />
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>200</strong></td>
                  <td>
                    <T zh="成功，有内容返回" en="Success, with a body" />
                  </td>
                  <td><code>ResponseEntity.ok(body)</code></td>
                </tr>
                <tr>
                  <td><strong>201</strong></td>
                  <td>
                    <T zh="创建成功（POST）" en="Created (POST)" />
                  </td>
                  <td>
                    <code>ResponseEntity.status(HttpStatus.CREATED).body(x)</code>
                  </td>
                </tr>
                <tr>
                  <td><strong>204</strong></td>
                  <td>
                    <T
                      zh="成功但没有内容（DELETE）"
                      en="Success with no body (DELETE)"
                    />
                  </td>
                  <td><code>ResponseEntity.noContent().build()</code></td>
                </tr>
                <tr>
                  <td><strong>400</strong></td>
                  <td>
                    <T
                      zh="请求本身不合法"
                      en="The request itself is not valid"
                    />
                  </td>
                  <td>
                    <T
                      zh={
                        <>
                          <code>@Valid</code> 自动，或{" "}
                          <code>throw new ResponseStatusException(HttpStatus.BAD_REQUEST, msg)</code>
                        </>
                      }
                      en={
                        <>
                          <code>@Valid</code> does it, or{" "}
                          <code>throw new ResponseStatusException(HttpStatus.BAD_REQUEST, msg)</code>
                        </>
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td><strong>404</strong></td>
                  <td>
                    <T zh="目标不存在" en="The target does not exist" />
                  </td>
                  <td>
                    <T
                      zh={
                        <>
                          <strong>不写</strong> —— 让 service 的{" "}
                          <code>EntityNotFoundException</code> 冒到{" "}
                          <code>@RestControllerAdvice</code>
                        </>
                      }
                      en={
                        <>
                          <strong>Do not write it</strong> — let the service&apos;s{" "}
                          <code>EntityNotFoundException</code> travel up to{" "}
                          <code>@RestControllerAdvice</code>
                        </>
                      }
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <CodeBlock
            ex={real(
              "java",
              `// 参数注解从哪取值
@PathVariable Long id                            // /api/orders/{id}
@RequestParam(required = false) String userId     // ?userId=123
@RequestBody Map<String, String> body             // 请求体 JSON
@Valid @RequestBody CreateOrderRequest request    // 请求体 + Bean Validation

// 字符串转 enum 的安全写法（valueOf 大小写敏感且会抛异常）
String raw = statusUpdate.get("status");
if (raw == null || raw.isBlank()) {
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is required");
}
final OrderStatus status;
try {
    status = OrderStatus.valueOf(raw.trim().toUpperCase());
} catch (IllegalArgumentException ex) {
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown status: " + raw);
}

// correlation id（CorrelationIdFilter 放进 MDC，任何地方都能取）
MDC.get("correlationId")`,
              {
                filename: "Spring 速查",
                filenameEn: "Spring reference",
                codeEn: `// Where each parameter annotation reads from
@PathVariable Long id                            // /api/orders/{id}
@RequestParam(required = false) String userId     // ?userId=123
@RequestBody Map<String, String> body             // the JSON request body
@Valid @RequestBody CreateOrderRequest request    // request body + Bean Validation

// Safe way to turn a string into an enum (valueOf is case sensitive and throws)
String raw = statusUpdate.get("status");
if (raw == null || raw.isBlank()) {
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is required");
}
final OrderStatus status;
try {
    status = OrderStatus.valueOf(raw.trim().toUpperCase());
} catch (IllegalArgumentException ex) {
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown status: " + raw);
}

// correlation id (CorrelationIdFilter puts it in MDC, so any code can read it)
MDC.get("correlationId")`,
              },
            )}
          />
        </section>

        {/* ---------- 报错对照表 ---------- */}
        <section className="sec" id="errors">
          <div className="sec-head">
            <span className="sec-n">§08</span>
            <h2 className="sec-title">
              <T en="Error table" zh="报错对照表" />
            </h2>
          </div>
          <p className="sec-lede">
            <T
              zh={
                <>
                  都是审计和课程里真实出现过的。<strong>先看这张表再改代码。</strong>
                </>
              }
              en={
                <>
                  Every one of these really came up during the audit or in a
                  lesson. <strong>Read this table before you edit code.</strong>
                </>
              }
            />
          </p>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <T en="Error / symptom" zh="报错 / 症状" />
                  </th>
                  <th>
                    <T en="Root cause" zh="根因" />
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>npm error Missing script: &quot;test&quot;</code></td>
                  <td>
                    <T
                      zh={
                        <>
                          项目没有 test script → 用 <code>npx vitest run</code>
                        </>
                      }
                      en={
                        <>
                          This project has no test script. Use{" "}
                          <code>npx vitest run</code>
                        </>
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td><code>TS2582: Cannot find name &apos;test&apos;</code></td>
                  <td>
                    <T
                      zh={
                        <>
                          tsconfig 没配测试框架全局类型。
                          <strong>react-notes-app 原生就有这个问题，不是你的错</strong>
                        </>
                      }
                      en={
                        <>
                          tsconfig does not declare the test framework globals.{" "}
                          <strong>
                            react-notes-app ships with this problem; it is not
                            your fault
                          </strong>
                        </>
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td><code>ERR_MODULE_NOT_FOUND</code></td>
                  <td>
                    <T
                      zh={
                        <>
                          原生 ESM 里相对路径漏了 <code>.js</code> 扩展名
                        </>
                      }
                      en={
                        <>
                          A relative import in native ESM is missing the{" "}
                          <code>.js</code> extension
                        </>
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td><code>Cannot use import statement outside a module</code></td>
                  <td>
                    <T
                      zh={
                        <>
                          缺 <code>&quot;type&quot;: &quot;module&quot;</code>，
                          或 jest 缺 <code>--experimental-vm-modules</code>
                        </>
                      }
                      en={
                        <>
                          <code>&quot;type&quot;: &quot;module&quot;</code> is
                          missing, or jest is missing{" "}
                          <code>--experimental-vm-modules</code>
                        </>
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td><code>Maximum update depth exceeded</code></td>
                  <td>
                    <T
                      zh={
                        <>
                          useEffect 依赖里含自己修改的 state；
                          或 <code>onClick={"{fn()}"}</code> 在渲染时就执行了
                        </>
                      }
                      en={
                        <>
                          A useEffect dependency holds state that the same
                          effect writes; or <code>onClick={"{fn()}"}</code>{" "}
                          already ran during render
                        </>
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <T
                      zh={
                        <>
                          <strong>没报错</strong>，数据对但界面不动
                        </>
                      }
                      en={
                        <>
                          <strong>No error</strong>, the data is right but the
                          interface does not change
                        </>
                      }
                    />
                  </td>
                  <td>
                    <T
                      zh={
                        <>
                          改了原对象（<code>push</code> / <code>splice</code> /{" "}
                          <code>arr[i]=</code> / <code>obj.x=</code>）
                        </>
                      }
                      en={
                        <>
                          You changed the original object (<code>push</code> /{" "}
                          <code>splice</code> / <code>arr[i]=</code> /{" "}
                          <code>obj.x=</code>)
                        </>
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <T
                      zh={
                        <>
                          <strong>没报错</strong>，组件完全不显示
                        </>
                      }
                      en={
                        <>
                          <strong>No error</strong>, the component does not show
                          at all
                        </>
                      }
                    />
                  </td>
                  <td>
                    <T
                      zh="组件名小写开头，被当成 HTML 标签"
                      en="The component name starts with a lower-case letter, so it is read as an HTML tag"
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <T
                      zh={
                        <>
                          <strong>没报错</strong>，列表空白但数据有值
                        </>
                      }
                      en={
                        <>
                          <strong>No error</strong>, the list is blank but the
                          data is there
                        </>
                      }
                    />
                  </td>
                  <td>
                    <T
                      zh="map 回调用了花括号却忘了 return"
                      en="The map callback uses braces but never returns"
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>Unable to find an element by: [data-testid=...]</code>
                  </td>
                  <td>
                    <T
                      zh={
                        <>
                          testid 被改了，或那个元素被条件性移除了。
                          <strong>报错里会打印整个 DOM，在里面搜相似 testid</strong>
                        </>
                      }
                      en={
                        <>
                          The testid changed, or a condition removed that
                          element.{" "}
                          <strong>
                            The error prints the whole DOM — search it for a
                            similar testid
                          </strong>
                        </>
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <T
                      zh="测试说找不到文字，但代码看着没错"
                      en="The test cannot find the text, but the code looks right"
                    />
                  </td>
                  <td>
                    <T
                      zh={
                        <>
                          <code>userEvent</code> 前面漏了 <code>await</code>
                        </>
                      }
                      en={
                        <>
                          A missing <code>await</code> before{" "}
                          <code>userEvent</code>
                        </>
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td><code>Cannot return null for non-nullable field</code></td>
                  <td>
                    <T
                      zh={
                        <>
                          resolver 忘了 <code>?? []</code>。会向上冒泡，
                          可能让整个 <code>data</code> 变 null
                        </>
                      }
                      en={
                        <>
                          The resolver forgot <code>?? []</code>. It travels
                          upward and can turn the whole <code>data</code> into
                          null
                        </>
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td><code>xxx is not a function</code></td>
                  <td>
                    <T
                      zh={
                        <>
                          调了对象上不存在的方法。
                          <strong>去定义处核对方法名</strong>
                        </>
                      }
                      en={
                        <>
                          You called a method the object does not have.{" "}
                          <strong>
                            Check the name where the object is defined
                          </strong>
                        </>
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>Cannot read properties of undefined (reading &apos;y&apos;)</code>
                  </td>
                  <td>
                    <T
                      zh={
                        <>
                          上一级路径写错了（如 <code>dataSources.orderAPI</code> 不存在）
                        </>
                      }
                      en={
                        <>
                          The path one level up is wrong (for example{" "}
                          <code>dataSources.orderAPI</code> does not exist)
                        </>
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <T
                      zh={
                        <>
                          <strong>没报错</strong>，某个 GraphQL 字段一直是 null
                        </>
                      }
                      en={
                        <>
                          <strong>No error</strong>, one GraphQL field is always
                          null
                        </>
                      }
                    />
                  </td>
                  <td>
                    <T
                      zh={
                        <>
                          resolver 键名和 schema 字段名不一致，或挂在了错误的类型下。
                          <strong>在 resolver 第一行 log 确认它有没有被调用</strong>
                        </>
                      }
                      en={
                        <>
                          The resolver key does not match the schema field name,
                          or it sits under the wrong type.{" "}
                          <strong>
                            Log on the resolver&apos;s first line to see whether
                            it runs at all
                          </strong>
                        </>
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <T
                      zh={
                        <>
                          <strong>没报错</strong>，DataLoader 的数据串了
                        </>
                      }
                      en={
                        <>
                          <strong>No error</strong>, DataLoader hands back the
                          wrong row for a key
                        </>
                      }
                    />
                  </td>
                  <td>
                    <T
                      zh="batch 函数里用了 filter，破坏了长度/顺序契约"
                      en="The batch function used filter, which breaks the length and order contract"
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <T
                      zh="错误码不对（收到 SERVICE_ERROR 而不是 INVALID_INPUT）"
                      en="Wrong error code (SERVICE_ERROR arrives instead of INVALID_INPUT)"
                    />
                  </td>
                  <td>
                    <T
                      zh={
                        <>
                          catch 把自己抛的结构化错误重新包装了。
                          补 <code>if (error instanceof GraphQLError) throw error</code>
                        </>
                      }
                      en={
                        <>
                          The catch re-wrapped a structured error you threw
                          yourself. Add{" "}
                          <code>if (error instanceof GraphQLError) throw error</code>
                        </>
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <T
                      zh={
                        <>
                          Spring：<code>Status expected:&lt;201&gt; but was:&lt;200&gt;</code>
                        </>
                      }
                      en={
                        <>
                          Spring:{" "}
                          <code>Status expected:&lt;201&gt; but was:&lt;200&gt;</code>
                        </>
                      }
                    />
                  </td>
                  <td>
                    <T
                      zh={
                        <>
                          POST 用了 <code>ok()</code>；或者端点还是{" "}
                          <code>return null</code>
                        </>
                      }
                      en={
                        <>
                          The POST used <code>ok()</code>; or the endpoint still
                          says <code>return null</code>
                        </>
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <T
                      zh="Spring：客户端输入错误返回了 500"
                      en="Spring: a bad client input comes back as 500"
                    />
                  </td>
                  <td>
                    <T
                      zh={
                        <>
                          <code>Enum.valueOf</code> 抛的{" "}
                          <code>IllegalArgumentException</code> 没被转成 400
                        </>
                      }
                      en={
                        <>
                          The <code>IllegalArgumentException</code> thrown by{" "}
                          <code>Enum.valueOf</code> was never turned into a 400
                        </>
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <T
                      zh="Spring：查不存在的 id 返回 200 空 body"
                      en="Spring: asking for an id that does not exist returns 200 with an empty body"
                    />
                  </td>
                  <td>
                    <T
                      zh={
                        <>
                          自己 catch 了 <code>EntityNotFoundException</code>，
                          全局处理器收不到
                        </>
                      }
                      en={
                        <>
                          The code caught <code>EntityNotFoundException</code>{" "}
                          itself, so the global handler never sees it
                        </>
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td><code>Unknown directive &quot;@xxx&quot;</code></td>
                  <td>
                    <T
                      zh={
                        <>
                          <code>@link</code> 的 import 列表里漏了它，
                          或没用 <code>buildSubgraphSchema</code>
                        </>
                      }
                      en={
                        <>
                          It is missing from the <code>@link</code> import list,
                          or you did not use <code>buildSubgraphSchema</code>
                        </>
                      }
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ---------- Debug 清单 ---------- */}
        <section className="sec" id="debug">
          <div className="sec-head">
            <span className="sec-n">§09</span>
            <h2 className="sec-title">
              <T en="Debug checklist" zh="Debug 清单" />
            </h2>
          </div>
          <p className="sec-lede">
            <T
              zh="卡住的时候按顺序走一遍。大部分问题在第 3 步之前就解决了。"
              en="When you are stuck, walk through this in order. Most problems are solved before step 3."
            />
          </p>
          <div className="prose">
            <ol>
              <li>
                <T
                  zh={
                    <>
                      <strong>分层。</strong>这个报错来自 npm（命令/目录不对）、
                      工具（依赖没装）、还是我的代码？
                      <strong>别一看红字就改业务代码。</strong>
                    </>
                  }
                  en={
                    <>
                      <strong>Find the layer.</strong> Did this error come from
                      npm (wrong command or wrong directory), from a tool
                      (dependencies not installed), or from my own code?{" "}
                      <strong>
                        Red text is not a reason to start editing business code.
                      </strong>
                    </>
                  }
                />
              </li>
              <li>
                <T
                  zh={
                    <>
                      <strong>只看第一条报错。</strong>
                      类型错误和 GraphQL 错误都会连锁，修掉第一条后面可能自己消失。
                    </>
                  }
                  en={
                    <>
                      <strong>Read only the first error.</strong> Type errors
                      and GraphQL errors come in chains. Fix the first one and
                      the rest may go away by themselves.
                    </>
                  }
                />
              </li>
              <li>
                <T
                  zh={
                    <>
                      <strong>如果没有报错，按症状查表</strong>（见上一节）：
                      数据对但界面不动 / 组件不显示 / 列表空白 / 字段一直 null /
                      数据串了 —— 这五种各有固定病因。
                    </>
                  }
                  en={
                    <>
                      <strong>
                        If there is no error, look the symptom up in the table
                      </strong>{" "}
                      (previous section): data right but interface still /
                      component not showing / blank list / field always null /
                      rows mixed up. Each of these five has one fixed cause.
                    </>
                  }
                />
              </li>
              <li>
                <T
                  zh={
                    <>
                      <strong>确认代码有没有被执行。</strong>
                      在最可疑的函数第一行放一个 log。
                      <strong>「日志没打印」和「日志打印了但结果不对」
                      指向完全不同的方向。</strong>
                    </>
                  }
                  en={
                    <>
                      <strong>Check whether the code runs at all.</strong> Put a
                      log on the first line of the most suspicious function.{" "}
                      <strong>
                        &quot;No log printed&quot; and &quot;log printed but the
                        result is wrong&quot; point in completely different
                        directions.
                      </strong>
                    </>
                  }
                />
              </li>
              <li>
                <T
                  zh={
                    <>
                      <strong>核对跨模块的名字和签名。</strong>
                      方法名、context 键名、props 名、参数个数、位置参数 vs 对象参数。
                      这一步能抓住绝大多数「集成问题」。
                    </>
                  }
                  en={
                    <>
                      <strong>Check names and signatures across modules.</strong>{" "}
                      Method names, context keys, prop names, how many
                      arguments, positional arguments versus one object
                      argument. This step catches most integration problems.
                    </>
                  }
                />
              </li>
              <li>
                <T
                  zh={
                    <>
                      <strong>回去读契约。</strong>
                      schema 的可空性、类型定义、README 里的约束、
                      测试断言的确切字符串。
                    </>
                  }
                  en={
                    <>
                      <strong>Go back and read the contract.</strong> Schema
                      nullability, type definitions, the constraints in the
                      README, the exact strings the test assertions use.
                    </>
                  }
                />
              </li>
              <li>
                <T
                  zh={
                    <>
                      <strong>改完必须验证，而且要验到题面那一层。</strong>
                      测试过 ≠ 做对了 —— 手动造一个测试覆盖不到的场景
                      （同名数据、多条数据、非法输入、不存在的 id）。
                    </>
                  }
                  en={
                    <>
                      <strong>
                        After a fix, verify — and verify at the level the task
                        asks about.
                      </strong>{" "}
                      Passing tests is not the same as being correct. Build a
                      case by hand that the tests do not cover: records with the
                      same name, several records, invalid input, an id that does
                      not exist.
                    </>
                  }
                />
              </li>
            </ol>
          </div>
          <div className="callout" data-tone="trap">
            <strong className="callout-title">
              <T
                zh="这个项目里三处「测试骗人」的地方"
                en="Three places where the tests lie in this project"
              />
            </strong>
            <p>
              <T
                zh={
                  <>
                    ① Java 六个端点全 <code>return null</code>，5 个测试过 3 个。
                    <br />② subgraph 四个 TODO 全空，10 个测试过 4 个
                    （其中 3 个是「返回空」的假通过）。
                    <br />③ React 的删除/编辑测试只有一条数据，
                    按 title 删、先删再加都能过。
                  </>
                }
                en={
                  <>
                    ① All six Java endpoints <code>return null</code>, and 3 of
                    5 tests still pass.
                    <br />② All four subgraph TODOs are empty, and 4 of 10 tests
                    pass (3 of those pass only because returning nothing counts
                    as a pass).
                    <br />③ The React delete and edit tests use a single record,
                    so deleting by title, or deleting then adding, both pass.
                  </>
                }
              />
            </p>
            <p style={{ marginBottom: 0 }}>
              <T
                zh={<strong>所以：绿色是及格线，不是正确性证明。</strong>}
                en={
                  <strong>
                    So: green is the pass mark, not proof of correctness.
                  </strong>
                }
              />
            </p>
          </div>
        </section>
      </div>

      <aside className="rail">
        <div className="rail-block">
          <div className="rail-head">
            <T en="On this page" zh="本页目录" />
          </div>
          <ul className="rail-toc">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} data-active={active === s.id || undefined}>
                  <T en={s.en} zh={s.zh} />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="rail-block">
          <div className="rail-head">
            <T en="About this page" zh="说明" />
          </div>
          <p className="dimmer" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
            <T
              en="Only what the two real projects actually use. Every error here really came up during the audit or in a lesson — none of it is copied from a manual. Commands, field names and the raw error text are left exactly as they appear in a terminal."
              zh="这一页只收两个真实项目里实际用到的东西。报错都是审计或课程里真实出现过的，不是从手册里抄的。"
            />
          </p>
        </div>
      </aside>
    </main>
  );
}
