// 面试八股 —— Node/Express、数据库、网络与安全。
//
// 题目来自作者做过的题目，答案由 DrillLab 撰写，代码块一律 demo()（「示意」）。

import type { Module } from "../types";
import { demo } from "../helpers";

export const ivBackend: Module = {
  id: "iv-backend",
  stage: "面试 · 第 6 部分",
  title: "Node、数据库与网络",
  titleEn: "Node, databases and networking",
  summary:
    "12 道题。全栈岗和前端岗都会问到这一层：Node 的事件循环、请求响应流程、REST 的 CRUD 映射、关系型 vs 文档型、以及 HTTPS / JWT / CORS / session 这四道安全常客。CORS 那道几乎人人都遇到过，但很多人说不清它到底是谁在拦。",
  summaryEn:
    "12 questions. Both full-stack and frontend roles ask about this layer: the Node event loop, the request and response flow, how CRUD maps onto REST, relational vs document databases, and the four regular security questions on HTTPS / JWT / CORS / session. Almost everyone has run into the CORS one, but many cannot say clearly which side is doing the blocking.",
  lessons: [
    /* ============================================================
       Node 与 Express（4 题）
       ============================================================ */
    {
      id: "iv-node",
      title: "Node 与 Express 四问",
      titleEn: "4 questions on Node and Express",
      blurb: "Node 的事件循环、请求响应周期、查询参数 vs 路径参数、CRUD。",
      blurbEn:
        "The Node.js event loop, the request and response cycle, query parameters vs path parameters, CRUD.",
      minutes: 18,
      objectives: [
        "说出 Node 事件循环的几个阶段以及 nextTick 的特殊位置",
        "按顺序描述一个请求从进来到响应出去经过了什么",
        "在路径参数和查询参数之间做出正确设计选择",
        "把 CRUD 映射到 HTTP 方法和状态码",
      ],
      objectivesEn: [
        "Name the phases of the Node.js event loop, and where nextTick sits apart from them",
        "Describe, in order, what happens to a request from arrival to response",
        "Choose correctly between a path parameter and a query parameter",
        "Map CRUD onto HTTP methods and status codes",
      ],
      whyForAssessment:
        "这四道直接对应 Federation 那门课里 Task 2 写的六个 Spring 端点 —— 那道题的评分点就是「方法对不对、状态码对不对、参数从哪来」。Node 事件循环那道会和浏览器的对比着问。",
      whyForAssessmentEn:
        "These four map straight onto the six Spring endpoints written in Task 2 of the Federation course, where the marks go to the right method, the right status code, and the right place to read each parameter from. The Node.js event loop question is usually asked side by side with the browser one.",
      concepts: [
        {
          id: "q313",
          heading: "Node.js 的事件循环是怎么工作的",
          headingEn: "How does the Node.js event loop work?",
          lede: "#313 How does the event loop work in Node.js",
          body: (
            <>
              <p>
                <strong>一句话：</strong>Node 是
                <strong>单线程执行 JS + 多线程做 I/O</strong>。
                主线程跑 JS，
                耗时的 I/O 交给 libuv 的线程池或操作系统，
                完成后把回调放进队列，
                事件循环再取出来执行。
              </p>
              <p>
                <strong>六个阶段（顺序要记住）：</strong>
              </p>
              <ol>
                <li>
                  <strong>timers</strong>——
                  到期的 <code>setTimeout</code> /
                  <code>setInterval</code>
                </li>
                <li>
                  <strong>pending callbacks</strong>——
                  上一轮延后的系统回调
                </li>
                <li>
                  idle / prepare —— 内部用
                </li>
                <li>
                  <strong>poll</strong>——
                  <strong>取新的 I/O 事件，
                  大部分时间待在这里</strong>
                </li>
                <li>
                  <strong>check</strong>——
                  <code>setImmediate</code> 的回调
                </li>
                <li>
                  <strong>close callbacks</strong>——
                  <code>socket.on(&quot;close&quot;)</code> 这类
                </li>
              </ol>
              <p>
                <strong>关键：每个阶段之间都会把微任务清空。</strong>
                而 Node 的微任务分两级：
                <strong><code>process.nextTick</code>
                的优先级比 Promise 更高</strong>——
                它有自己的队列，
                <strong>在所有 Promise 微任务之前执行</strong>。
              </p>
              <p>
                <strong>和浏览器的差别（这是考点）：</strong>
                浏览器只有「宏任务 / 微任务」两档，
                每次<strong>只取一个</strong>宏任务；
                Node 分了六个阶段，
                同一阶段里的<strong>队列会一次取完</strong>。
                <br />
                另外 Node 多了
                <code>setImmediate</code>
                和 <code>process.nextTick</code>
                这两个浏览器没有的东西。
              </p>
              <p>
                <strong>会追问：</strong>
                「<code>setTimeout(fn, 0)</code> 和
                <code>setImmediate</code> 谁先？」——
                <strong>不确定</strong>！
                在主模块里两者顺序取决于进程启动耗时；
                但<strong>在 I/O 回调里，
                <code>setImmediate</code> 一定更早</strong>
                （因为 check 阶段紧跟在 poll 后面，
                而 timers 要等下一轮）。
                <strong>能答出「主模块里不确定」很加分。</strong>
                <br />
                「CPU 密集任务怎么办？」——
                单线程会被卡死。
                用 <code>worker_threads</code>、
                子进程，或者干脆交给别的服务。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> Node runs{" "}
                <strong>your JavaScript on one thread and its I/O on many</strong>.
                The main thread runs JS; anything slow goes to libuv&rsquo;s thread
                pool or straight to the OS, and when it finishes the callback is
                queued for the event loop to pick up.
              </p>
              <p>
                <strong>Six phases, and the order matters:</strong>
              </p>
              <ol>
                <li>
                  <strong>timers</strong> — <code>setTimeout</code> and{" "}
                  <code>setInterval</code> callbacks that are due
                </li>
                <li>
                  <strong>pending callbacks</strong> — system callbacks deferred
                  from the previous turn
                </li>
                <li>idle / prepare — internal use</li>
                <li>
                  <strong>poll</strong> — <strong>picks up new I/O events; this is
                  where the process spends most of its time</strong>
                </li>
                <li>
                  <strong>check</strong> — <code>setImmediate</code> callbacks
                </li>
                <li>
                  <strong>close callbacks</strong> — things like{" "}
                  <code>socket.on(&quot;close&quot;)</code>
                </li>
              </ol>
              <p>
                <strong>The key point: microtasks are drained between every
                phase.</strong>{" "}
                And Node has two levels of them —{" "}
                <strong>
                  <code>process.nextTick</code> outranks Promises
                </strong>
                . It gets its own queue and{" "}
                <strong>runs before any Promise microtask</strong>.
              </p>
              <p>
                <strong>How this differs from the browser (this is the part they
                are testing):</strong>{" "}
                the browser has just two tiers, macrotask and microtask, and takes{" "}
                <strong>one</strong> macrotask per turn. Node has six phases, and
                within a phase it <strong>drains the whole queue</strong>.
                <br />
                Node also has <code>setImmediate</code> and{" "}
                <code>process.nextTick</code>, neither of which exists in a browser.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Which fires first,{" "}
                <code>setTimeout(fn, 0)</code> or <code>setImmediate</code>?&rdquo;
                — <strong>it is not guaranteed</strong>. At the top level of the
                main module the order depends on how long startup took. But{" "}
                <strong>
                  inside an I/O callback <code>setImmediate</code> always wins
                </strong>
                , because check comes right after poll while timers has to wait for
                the next turn.{" "}
                <strong>
                  Saying &ldquo;undefined in the main module&rdquo; is the answer
                  that earns you points.
                </strong>
                <br />
                &ldquo;What about CPU-bound work?&rdquo; — one thread means it
                blocks everything. Use <code>worker_threads</code>, a child
                process, or hand the job to a different service entirely.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `console.log("1 同步");

setTimeout(() => console.log("2 timers"), 0);
setImmediate(() => console.log("3 check"));
Promise.resolve().then(() => console.log("4 promise 微任务"));
process.nextTick(() => console.log("5 nextTick"));

console.log("6 同步");

// 输出：1 同步 -> 6 同步 -> 5 nextTick -> 4 promise 微任务
//       -> 2 timers 和 3 check（这两个的相对顺序在主模块里不保证）
//
// 记住：nextTick 比 Promise 更优先，这是 Node 独有的`,
              { filename: "Node 的执行顺序" },
            ),
          ],
        },
        {
          id: "q314",
          heading: "请求 - 响应周期是怎样的",
          headingEn: "What does the request and response cycle look like?",
          lede: "#314 Explain the request & response cycle",
          body: (
            <>
              <p>
                <strong>一句话：</strong>客户端发请求 →
                经过一串中间件 → 匹配到路由 →
                处理逻辑（查库等）→
                <strong>发出一个响应</strong>→ 结束。
              </p>
              <p>
                <strong>Express 里具体经过什么：</strong>
              </p>
              <ol>
                <li>
                  <strong>解析</strong>——
                  <code>express.json()</code>
                  把请求体解析成 <code>req.body</code>
                  （<strong>不加这个中间件
                  <code>req.body</code> 就是
                  <code>undefined</code></strong>，
                  这是最常见的新手问题）
                </li>
                <li>
                  <strong>通用中间件</strong>——
                  CORS、日志、
                  <strong>关联 id</strong>、限流
                </li>
                <li>
                  <strong>认证 / 鉴权</strong>——
                  验 token，把用户挂到
                  <code>req.user</code>
                </li>
                <li>
                  <strong>路由匹配</strong>——
                  按注册顺序找第一个匹配的
                  method + path
                </li>
                <li>
                  <strong>校验 → 业务逻辑 → 查库</strong>
                </li>
                <li>
                  <strong>响应</strong>——
                  <code>res.status(200).json(...)</code>
                </li>
                <li>
                  <strong>兜底</strong>——
                  404 处理 + <strong>错误处理中间件</strong>
                </li>
              </ol>
              <p>
                <strong>三个必须知道的规则：</strong>
              </p>
              <ul>
                <li>
                  <strong>中间件按注册顺序执行</strong>，
                  必须调 <code>next()</code>
                  才会往下走 ——
                  忘了调请求就<strong>永远挂着</strong>，
                  客户端一直转圈。
                </li>
                <li>
                  <strong>一个请求只能响应一次。</strong>
                  重复 <code>res.send</code>
                  会报
                  <code>Cannot set headers after they are sent</code>。
                  <strong>所以调用响应之后一定要
                  <code>return</code>。</strong>
                </li>
                <li>
                  <strong>错误处理中间件有四个参数</strong>
                  <code>(err, req, res, next)</code>——
                  <strong>少一个参数 Express 就认不出它是错误处理器</strong>，
                  这个坑很经典。
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「异步函数里抛的错误
                Express 会自动捕获吗？」——
                <strong>Express 4 里不会</strong>，
                会变成未处理的 rejection，请求挂死。
                要么自己 <code>try/catch</code>
                后 <code>next(err)</code>，
                要么包一层 asyncHandler。
                <strong>Express 5 才支持自动转发。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> the client sends a request, it walks
                through a chain of middleware, a route matches, the handler does its
                work (hits the database and so on),{" "}
                <strong>one response goes out</strong>, done.
              </p>
              <p>
                <strong>What it actually passes through in Express:</strong>
              </p>
              <ol>
                <li>
                  <strong>Parsing</strong> — <code>express.json()</code> turns the
                  body into <code>req.body</code> (
                  <strong>
                    without that middleware <code>req.body</code> is{" "}
                    <code>undefined</code>
                  </strong>
                  , which is the single most common beginner bug)
                </li>
                <li>
                  <strong>Generic middleware</strong> — CORS, logging, a{" "}
                  <strong>correlation id</strong>, rate limiting
                </li>
                <li>
                  <strong>Authentication and authorisation</strong> — verify the
                  token, hang the user off <code>req.user</code>
                </li>
                <li>
                  <strong>Route matching</strong> — the first registered
                  method + path that matches wins
                </li>
                <li>
                  <strong>Validation, then business logic, then the database</strong>
                </li>
                <li>
                  <strong>Response</strong> —{" "}
                  <code>res.status(200).json(...)</code>
                </li>
                <li>
                  <strong>Catch-alls</strong> — the 404 handler and the{" "}
                  <strong>error-handling middleware</strong>
                </li>
              </ol>
              <p>
                <strong>Three rules you have to know:</strong>
              </p>
              <ul>
                <li>
                  <strong>Middleware runs in registration order</strong> and you
                  must call <code>next()</code> for the chain to continue. Forget it
                  and the request <strong>hangs forever</strong> while the client
                  spins.
                </li>
                <li>
                  <strong>One request gets exactly one response.</strong> A second{" "}
                  <code>res.send</code> throws{" "}
                  <code>Cannot set headers after they are sent</code>.{" "}
                  <strong>
                    So always <code>return</code> after you respond.
                  </strong>
                </li>
                <li>
                  <strong>Error middleware takes four arguments</strong>,{" "}
                  <code>(err, req, res, next)</code> —{" "}
                  <strong>
                    drop one and Express no longer recognises it as an error
                    handler
                  </strong>
                  . A classic trap.
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;Does Express catch errors thrown
                inside an async function?&rdquo; —{" "}
                <strong>not in Express 4</strong>. It becomes an unhandled rejection
                and the request hangs. Either <code>try/catch</code> yourself and
                call <code>next(err)</code>, or wrap the handler in an asyncHandler.{" "}
                <strong>Express 5 forwards them for you.</strong>
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `app.use(express.json());               // 1 解析 body
app.use(cors());                      // 2 通用
app.use(correlationId);               // 关联 id，方便串联日志
app.use(auth);                        // 3 认证

app.get("/orders/:id", async (req, res, next) => {
  try {
    const order = await db.find(req.params.id);
    if (!order) return res.status(404).json({ error: "not found" });  // 记得 return
    res.json(order);
  } catch (e) {
    next(e);                          // Express 4 不会自动接异步错误
  }
});

app.use((req, res) => res.status(404).json({ error: "no route" }));

// 错误处理中间件：必须是四个参数，少一个就不生效
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "internal" });
});`,
              { filename: "一个请求经过的全部环节" },
            ),
          ],
        },
        {
          id: "q315",
          heading: "查询参数 vs 路径参数",
          headingEn: "Query parameters vs path parameters",
          lede: "#315 Query parameters vs Path parameters",
          body: (
            <>
              <p>
                <strong>一句话：</strong>
                <strong>路径参数标识「哪一个资源」</strong>
                （<code>/users/42</code>），
                <strong>查询参数描述「怎么取」</strong>
                （<code>?page=2&amp;sort=name</code>）。
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>路径参数</th>
                      <th>查询参数</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>形式</td>
                      <td><code>/users/:id</code></td>
                      <td><code>/users?role=admin</code></td>
                    </tr>
                    <tr>
                      <td>Express 里读</td>
                      <td><code>req.params.id</code></td>
                      <td><code>req.query.role</code></td>
                    </tr>
                    <tr>
                      <td>Spring 里读</td>
                      <td><code>@PathVariable</code></td>
                      <td><code>@RequestParam</code></td>
                    </tr>
                    <tr>
                      <td>必填性</td>
                      <td><strong>必填</strong>（是路径的一部分）</td>
                      <td>通常可选，有默认值</td>
                    </tr>
                    <tr>
                      <td>语义</td>
                      <td>标识资源</td>
                      <td>筛选、排序、分页、字段裁剪</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>设计判据一句话：</strong>
                <strong>「去掉它之后，还是同一个资源吗？」</strong>
                去掉 <code>42</code> 就不知道是谁了 → 路径参数；
                去掉 <code>?page=2</code>
                还是同一批用户，只是换一页 → 查询参数。
              </p>
              <p>
                <strong>会追问：</strong>
                「密码能放查询参数吗？」——
                <strong>绝对不行</strong>。
                URL 会进浏览器历史、
                服务器访问日志、
                Referer 头、CDN 日志 ——
                <strong>即使用了 HTTPS，
                URL 本身也会被大量记录</strong>。
                敏感数据放请求体或请求头。
                <br />
                「查询参数有长度限制吗？」——
                规范没有，但实践上服务器和 CDN
                通常限制 URL 在 2 KB 到 8 KB。
                复杂查询条件多的搜索接口
                有时会改用 <code>POST</code> 带 body。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong>{" "}
                <strong>a path parameter says which resource</strong> (
                <code>/users/42</code>);{" "}
                <strong>a query parameter says how you want it</strong> (
                <code>?page=2&amp;sort=name</code>).
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Path parameter</th>
                      <th>Query parameter</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Shape</td>
                      <td>
                        <code>/users/:id</code>
                      </td>
                      <td>
                        <code>/users?role=admin</code>
                      </td>
                    </tr>
                    <tr>
                      <td>Read in Express</td>
                      <td>
                        <code>req.params.id</code>
                      </td>
                      <td>
                        <code>req.query.role</code>
                      </td>
                    </tr>
                    <tr>
                      <td>Read in Spring</td>
                      <td>
                        <code>@PathVariable</code>
                      </td>
                      <td>
                        <code>@RequestParam</code>
                      </td>
                    </tr>
                    <tr>
                      <td>Required?</td>
                      <td>
                        <strong>Yes</strong> — it is part of the path
                      </td>
                      <td>Usually optional, often with a default</td>
                    </tr>
                    <tr>
                      <td>Meaning</td>
                      <td>Identifies the resource</td>
                      <td>Filtering, sorting, paging, field selection</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>One test to decide:</strong>{" "}
                <strong>&ldquo;Take it away — is it still the same resource?&rdquo;</strong>{" "}
                Drop the <code>42</code> and you no longer know who you mean → path
                parameter. Drop <code>?page=2</code> and it is still the same set of
                users, just a different page → query parameter.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Can a password go in a query
                parameter?&rdquo; — <strong>absolutely not</strong>. URLs land in
                browser history, server access logs, the Referer header and CDN
                logs.{" "}
                <strong>
                  HTTPS encrypts the connection; it does not stop the URL from being
                  written down all over the place.
                </strong>{" "}
                Sensitive values go in the body or a header.
                <br />
                &ldquo;Is there a length limit on query strings?&rdquo; — not in the
                spec, but in practice servers and CDNs cap the URL somewhere between
                2 KB and 8 KB. Search endpoints with complex filters sometimes switch
                to <code>POST</code> with a body for that reason.
              </p>
            </>
          ),
        },
        {
          id: "q316",
          heading: "什么是 CRUD",
          headingEn: "What is CRUD?",
          lede: "#316 What is CRUD",
          body: (
            <>
              <p>
                <strong>一句话：</strong>Create / Read /
                Update / Delete —— 数据操作的四种基本类型。
                REST 把它们映射到 HTTP 方法。
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>操作</th>
                      <th>方法</th>
                      <th>路径</th>
                      <th>成功状态码</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Create</td>
                      <td><code>POST</code></td>
                      <td><code>/orders</code></td>
                      <td><strong>201 Created</strong></td>
                    </tr>
                    <tr>
                      <td>Read（列表）</td>
                      <td><code>GET</code></td>
                      <td><code>/orders</code></td>
                      <td>200</td>
                    </tr>
                    <tr>
                      <td>Read（单个）</td>
                      <td><code>GET</code></td>
                      <td><code>/orders/:id</code></td>
                      <td>200，没有则 <strong>404</strong></td>
                    </tr>
                    <tr>
                      <td>Update（整体）</td>
                      <td><code>PUT</code></td>
                      <td><code>/orders/:id</code></td>
                      <td>200</td>
                    </tr>
                    <tr>
                      <td>Update（部分）</td>
                      <td><code>PATCH</code></td>
                      <td><code>/orders/:id</code></td>
                      <td>200</td>
                    </tr>
                    <tr>
                      <td>Delete</td>
                      <td><code>DELETE</code></td>
                      <td><code>/orders/:id</code></td>
                      <td><strong>204 No Content</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>两个高频追问：</strong>
              </p>
              <p>
                <strong>① PUT vs PATCH。</strong>
                <code>PUT</code> 是
                <strong>整体替换</strong>——
                没传的字段应该被清空；
                <code>PATCH</code> 是
                <strong>局部更新</strong>——
                只改传了的字段。
                <strong>实践中很多人把 PUT 当 PATCH 用，
                这是错的</strong>，但要知道现实如此。
              </p>
              <p>
                <strong>② 幂等性。</strong>
                <strong>同一个请求发多次，结果一样</strong>
                就叫幂等。
              </p>
              <ul>
                <li>
                  <code>GET</code> / <code>PUT</code> /
                  <code>DELETE</code> ——
                  <strong>幂等</strong>
                </li>
                <li>
                  <code>POST</code> ——
                  <strong>不幂等</strong>
                  （发两次会创建两条）
                </li>
                <li>
                  <code>PATCH</code> ——
                  <strong>看实现</strong>
                  （<code>{'{ n: 5 }'}</code> 幂等，
                  <code>{'{ n: { $inc: 1 } }'}</code> 不幂等）
                </li>
              </ul>
              <p>
                <strong>为什么重要：</strong>
                客户端重试、
                网关超时重发时，
                幂等的接口是安全的，
                <code>POST</code> 需要
                <strong>幂等键（idempotency key）</strong>
                来防重复下单。
              </p>
              <p>
                <strong>再一个追问：</strong>
                「删一个不存在的资源返回什么？」——
                <strong>可以是 204 也可以是 404</strong>。
                返 204 更符合幂等语义
                （「删完了」这个结果达成了）；
                返 404 信息更明确。
                <strong>关键是团队内一致，
                并且写进接口文档。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> Create / Read / Update / Delete — the
                four basic things you do to data. REST maps them onto HTTP methods.
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Operation</th>
                      <th>Method</th>
                      <th>Path</th>
                      <th>Status on success</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Create</td>
                      <td>
                        <code>POST</code>
                      </td>
                      <td>
                        <code>/orders</code>
                      </td>
                      <td>
                        <strong>201 Created</strong>
                      </td>
                    </tr>
                    <tr>
                      <td>Read (list)</td>
                      <td>
                        <code>GET</code>
                      </td>
                      <td>
                        <code>/orders</code>
                      </td>
                      <td>200</td>
                    </tr>
                    <tr>
                      <td>Read (one)</td>
                      <td>
                        <code>GET</code>
                      </td>
                      <td>
                        <code>/orders/:id</code>
                      </td>
                      <td>
                        200, or <strong>404</strong> if it is not there
                      </td>
                    </tr>
                    <tr>
                      <td>Update (whole)</td>
                      <td>
                        <code>PUT</code>
                      </td>
                      <td>
                        <code>/orders/:id</code>
                      </td>
                      <td>200</td>
                    </tr>
                    <tr>
                      <td>Update (partial)</td>
                      <td>
                        <code>PATCH</code>
                      </td>
                      <td>
                        <code>/orders/:id</code>
                      </td>
                      <td>200</td>
                    </tr>
                    <tr>
                      <td>Delete</td>
                      <td>
                        <code>DELETE</code>
                      </td>
                      <td>
                        <code>/orders/:id</code>
                      </td>
                      <td>
                        <strong>204 No Content</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>Two follow-ups they almost always ask:</strong>
              </p>
              <p>
                <strong>① PUT vs PATCH.</strong> <code>PUT</code> is a{" "}
                <strong>full replacement</strong> — fields you leave out should be
                cleared. <code>PATCH</code> is a{" "}
                <strong>partial update</strong> — only the fields you send change.{" "}
                <strong>
                  Plenty of real code uses PUT as if it were PATCH, which is wrong
                </strong>
                , but know that it happens.
              </p>
              <p>
                <strong>② Idempotency.</strong>{" "}
                <strong>Send the same request more than once, get the same
                result</strong> — that is idempotent.
              </p>
              <ul>
                <li>
                  <code>GET</code> / <code>PUT</code> / <code>DELETE</code> —{" "}
                  <strong>idempotent</strong>
                </li>
                <li>
                  <code>POST</code> — <strong>not idempotent</strong> (send it twice
                  and you get two records)
                </li>
                <li>
                  <code>PATCH</code> — <strong>depends on the payload</strong> (
                  <code>{'{ n: 5 }'}</code> is idempotent,{" "}
                  <code>{'{ n: { $inc: 1 } }'}</code> is not)
                </li>
              </ul>
              <p>
                <strong>Why it matters:</strong> when a client retries or a gateway
                resends after a timeout, an idempotent endpoint is safe.{" "}
                <code>POST</code> needs an{" "}
                <strong>idempotency key</strong> to stop the same order being placed
                twice.
              </p>
              <p>
                <strong>One more follow-up:</strong> &ldquo;What do you return when
                deleting something that does not exist?&rdquo; —{" "}
                <strong>204 or 404, both defensible</strong>. 204 fits the idempotent
                reading (the outcome you asked for is true); 404 tells the caller
                more.{" "}
                <strong>
                  What matters is that the team agrees and it is in the API docs.
                </strong>
              </p>
            </>
          ),
        },
      ],
      transfer: [
        {
          signal: "问 nextTick 和 Promise 谁先",
          signalEn: "Asked whether nextTick or a Promise runs first",
          reachFor: "nextTick 有独立队列，比所有 Promise 微任务优先",
          reachForEn: "nextTick has its own queue, which runs before every Promise microtask",
        },
        {
          signal: "「req.body 是 undefined」",
          signalEn: "req.body is undefined",
          reachFor: "漏了 express.json()",
          reachForEn: "express.json() is missing",
        },
        {
          signal: "请求一直转圈不返回",
          signalEn: "The request never comes back",
          reachFor: "中间件忘了调 next()，或响应后没 return",
          reachForEn: "A middleware forgot to call next(), or the code did not return after sending the response",
        },
        {
          signal: "错误处理中间件不生效",
          signalEn: "The error-handling middleware never runs",
          reachFor: "必须四个参数 (err, req, res, next)",
          reachForEn: "It has to take four parameters: (err, req, res, next)",
        },
        {
          signal: "设计接口纠结参数放哪",
          signalEn: "Unsure where a parameter belongs when designing an endpoint",
          reachFor: "「去掉它还是同一个资源吗」",
          reachForEn: "Ask: if you remove it, is it still the same resource?",
        },
        {
          signal: "创建资源返回什么码",
          signalEn: "Which status code to return after creating a resource",
          reachFor: "201；删除用 204",
          reachForEn: "201; use 204 for a delete",
        },
      ],
      recap: [
        "Node 六个阶段：timers → pending → idle → poll → check → close；每阶段之间清微任务，nextTick 最优先。",
        "主模块里 setTimeout(0) 和 setImmediate 顺序不保证，I/O 回调里 setImmediate 一定更早。",
        "Express 请求流程：解析 → 通用中间件 → 认证 → 路由 → 业务 → 响应 → 404/错误兜底。",
        "中间件按注册顺序、必须 next()；一个请求只能响应一次；错误中间件必须四个参数。",
        "路径参数标识资源、查询参数描述怎么取；敏感数据永远不放 URL。",
        "CRUD 映射：POST 201、GET 200/404、PUT 整体替换、PATCH 局部、DELETE 204。",
        "GET/PUT/DELETE 幂等，POST 不幂等 —— 防重复下单要用幂等键。",
      ],
      recapEn: [
        "Six phases in Node.js: timers, pending, idle, poll, check, close. Microtasks are drained between phases, and nextTick goes first of all.",
        "In the main module the order of setTimeout(0) and setImmediate is not guaranteed; inside an I/O callback setImmediate always runs first.",
        "The Express request path: parse, then general middleware, then authentication, then routing, then your handler, then the response, with a 404 and an error handler at the end.",
        "Middleware runs in the order you register it and must call next(); one request can be answered only once; an error handler must take four parameters.",
        "A path parameter identifies a resource, a query parameter says how to fetch it; never put sensitive data in a URL.",
        "CRUD mapping: POST returns 201, GET returns 200 or 404, PUT replaces the whole resource, PATCH changes part of it, DELETE returns 204.",
        "GET, PUT and DELETE are idempotent, POST is not, so use an idempotency key to stop a duplicate order.",
      ],
    },

    /* ============================================================
       数据库（2 题）
       ============================================================ */
    {
      id: "iv-sql",
      title: "数据库两问",
      titleEn: "2 questions on databases",
      blurb: "关系型 vs 非关系型、主键与外键。",
      blurbEn: "Relational vs non-relational databases, primary keys and foreign keys.",
      minutes: 12,
      objectives: [
        "在关系型和文档型之间给出选型理由，而不是背优缺点",
        "说清主键和外键各自保证什么",
        "解释外键约束在删除时的几种行为",
      ],
      objectivesEn: [
        "Give a reason for choosing relational or document storage, instead of reciting pros and cons",
        "Say exactly what a primary key guarantees and what a foreign key guarantees",
        "Explain the ways a foreign key constraint can behave on a delete",
      ],
      whyForAssessment:
        "这两道是全栈岗的入门筛选题。选型那道答「看数据形状和访问模式」比列表格好；主键外键那道会追问到索引和级联删除。",
      whyForAssessmentEn:
        "These two are screening questions for any full-stack role. For the choice of database, answering \"it depends on the shape of the data and how it is read\" beats reciting a comparison table. The keys question leads on to indexes and cascading deletes.",
      concepts: [
        {
          id: "q317",
          heading: "关系型数据库 vs 非关系型数据库",
          headingEn: "Relational databases vs non-relational databases",
          lede: "#317 Relational database vs Non-relational database",
          body: (
            <>
              <p>
                <strong>一句话：</strong>关系型
                <strong>先定好表结构、用 JOIN 关联、
                强调一致性</strong>；
                非关系型<strong>结构灵活、
                按查询模式组织数据、
                强调扩展性</strong>。
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>关系型（MySQL、PostgreSQL）</th>
                      <th>非关系型（MongoDB、Redis）</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>结构</td>
                      <td>表 + 行 + 列，<strong>schema 固定</strong></td>
                      <td>文档 / 键值 / 图，<strong>schema 灵活</strong></td>
                    </tr>
                    <tr>
                      <td>关联</td>
                      <td><strong>JOIN</strong></td>
                      <td>嵌套文档，或应用层自己拼</td>
                    </tr>
                    <tr>
                      <td>事务</td>
                      <td><strong>ACID 是强项</strong></td>
                      <td>有但较弱（MongoDB 4.0+ 支持多文档事务）</td>
                    </tr>
                    <tr>
                      <td>扩展</td>
                      <td>纵向为主（加配置），分库分表麻烦</td>
                      <td><strong>横向为主</strong>（加机器）</td>
                    </tr>
                    <tr>
                      <td>适合</td>
                      <td>
                        <strong>数据关系复杂、要强一致</strong>——
                        订单、账务、库存
                      </td>
                      <td>
                        <strong>结构多变、读多写多、
                        单次查询取一整块</strong>——
                        日志、内容、会话、缓存
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>选型的正确说法：</strong>
                <strong>「看数据形状和访问模式」</strong>——
              </p>
              <ul>
                <li>
                  <strong>一次查询要取的东西总是在一起</strong>
                  （一篇文章连着它的所有段落）→ 文档型合适。
                </li>
                <li>
                  <strong>同一份数据要从很多角度关联查</strong>
                  （用户 × 订单 × 商品 × 优惠券）→ 关系型合适，
                  <strong>因为文档型要么冗余存多份、要么在应用层做 JOIN</strong>。
                </li>
                <li>
                  <strong>需要转账那样的强一致</strong> → 关系型。
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「MongoDB 没有 schema 是优点吗？」——
                <strong>是双刃剑</strong>。
                前期迭代快，但<strong>约束跑到了应用层</strong>，
                时间长了同一个集合里会存在好几代不同形状的文档。
                所以实践中一般还是用 Mongoose 这类工具
                <strong>在应用层加回 schema</strong>。
                <br />
                「现在还有清楚的界限吗？」——
                在模糊：PostgreSQL 的
                <code>jsonb</code> 让它能存文档并建索引，
                所以<strong>「先上 Postgres，
                需要文档就用 jsonb」</strong>
                是很常见的现实选择。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> relational means{" "}
                <strong>
                  you define the schema up front, relate rows with JOINs, and lean on
                  consistency
                </strong>
                ; non-relational means{" "}
                <strong>
                  a flexible shape, data laid out for the queries you actually run,
                  and easier scale-out
                </strong>
                .
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Relational (MySQL, PostgreSQL)</th>
                      <th>Non-relational (MongoDB, Redis)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Shape</td>
                      <td>
                        Tables, rows, columns — <strong>fixed schema</strong>
                      </td>
                      <td>
                        Documents / key-value / graph — <strong>flexible schema</strong>
                      </td>
                    </tr>
                    <tr>
                      <td>Relating data</td>
                      <td>
                        <strong>JOIN</strong>
                      </td>
                      <td>Nested documents, or you stitch it in the app</td>
                    </tr>
                    <tr>
                      <td>Transactions</td>
                      <td>
                        <strong>ACID is the whole point</strong>
                      </td>
                      <td>Present but weaker (MongoDB 4.0+ has multi-document)</td>
                    </tr>
                    <tr>
                      <td>Scaling</td>
                      <td>Mostly vertical; sharding is painful</td>
                      <td>
                        <strong>Mostly horizontal</strong> — add machines
                      </td>
                    </tr>
                    <tr>
                      <td>Good for</td>
                      <td>
                        <strong>
                          Complex relationships and strong consistency
                        </strong>{" "}
                        — orders, ledgers, inventory
                      </td>
                      <td>
                        <strong>
                          Shifting shapes, heavy read and write, one query pulling a
                          whole blob
                        </strong>{" "}
                        — logs, content, sessions, caches
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>The right way to talk about choosing:</strong>{" "}
                <strong>&ldquo;Look at the shape of the data and the access
                pattern.&rdquo;</strong>
              </p>
              <ul>
                <li>
                  <strong>Everything one query needs always travels together</strong>{" "}
                  (an article and all its paragraphs) → document store fits.
                </li>
                <li>
                  <strong>
                    The same data gets related from many angles
                  </strong>{" "}
                  (users × orders × products × coupons) → relational fits,{" "}
                  <strong>
                    because a document store either duplicates it or makes you JOIN in
                    application code
                  </strong>
                  .
                </li>
                <li>
                  <strong>You need transfer-money-level consistency</strong> →
                  relational.
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;Is MongoDB being schema-less an
                advantage?&rdquo; — <strong>it cuts both ways</strong>. You move
                faster early on, but{" "}
                <strong>the constraints move into your application code</strong>, and
                given enough time one collection holds three generations of document
                shapes. Which is why teams reach for something like Mongoose to{" "}
                <strong>put a schema back on top</strong>.
                <br />
                &ldquo;Is the line still clear today?&rdquo; — it is blurring.
                PostgreSQL&rsquo;s <code>jsonb</code> stores documents and indexes
                them, so{" "}
                <strong>
                  &ldquo;start on Postgres, use jsonb where you need a
                  document&rdquo;
                </strong>{" "}
                is a very common real-world answer.
              </p>
            </>
          ),
        },
        {
          id: "q318",
          heading: "主键 vs 外键",
          headingEn: "Primary key vs foreign key",
          lede: "#318 Primary key vs Foreign key",
          body: (
            <>
              <p>
                <strong>一句话：</strong>
                <strong>主键唯一标识本表的一行</strong>；
                <strong>外键指向另一张表的主键</strong>，
                用来表达关联并保证引用有效。
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>主键（Primary Key）</th>
                      <th>外键（Foreign Key）</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>作用</td>
                      <td>唯一标识一行</td>
                      <td>指向另一表的主键</td>
                    </tr>
                    <tr>
                      <td>唯一性</td>
                      <td><strong>必须唯一</strong></td>
                      <td>可以重复（一个用户多个订单）</td>
                    </tr>
                    <tr>
                      <td>能否为 NULL</td>
                      <td><strong>不能</strong></td>
                      <td>可以（表示「暂时没关联」）</td>
                    </tr>
                    <tr>
                      <td>每表几个</td>
                      <td>一个（可以是多列组成的复合主键）</td>
                      <td>多个</td>
                    </tr>
                    <tr>
                      <td>索引</td>
                      <td><strong>自动建</strong></td>
                      <td>
                        <strong>不一定自动建</strong>——
                        MySQL 会，PostgreSQL <strong>不会</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>「外键索引」那一条是加分点</strong>：
                PostgreSQL 里外键列
                <strong>不会自动建索引</strong>，
                而 JOIN 和级联删除都要用到它 ——
                <strong>忘了手动建索引是很常见的性能问题</strong>。
              </p>
              <p>
                <strong>外键的核心价值是
                <em>引用完整性</em></strong>：
                数据库<strong>拒绝</strong>你插入一条
                指向不存在用户的订单，
                也拒绝你删掉还有订单的用户。
                <strong>这是数据库帮你兜住的一致性，
                不用在应用层写检查。</strong>
              </p>
              <p>
                <strong>会追问删除行为</strong>——
                这个一定要会：
              </p>
              <ul>
                <li>
                  <code>RESTRICT</code> /
                  <code>NO ACTION</code>——
                  <strong>有引用就不许删</strong>（默认，最安全）
                </li>
                <li>
                  <code>CASCADE</code>——
                  <strong>连着子记录一起删</strong>
                  （很方便也很危险，
                  删一个用户可能连带删掉几万条记录）
                </li>
                <li>
                  <code>SET NULL</code>——
                  把子记录的外键置空
                  （适合「作者被删了，文章保留为匿名」）
                </li>
              </ul>
              <p>
                <strong>还会追问：</strong>
                「主键用自增 id 还是 UUID？」——
                自增：短、索引局部性好、
                但<strong>暴露数据量</strong>、分库时会冲突。
                UUID：全局唯一、
                适合分布式和前端预生成，
                但<strong>更长、随机写入对 B+ 树索引不友好</strong>。
                <strong>折中是 ULID / UUIDv7（带时间前缀，有序）</strong>——
                这个答出来会显得很专业。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong>{" "}
                <strong>a primary key uniquely identifies a row in its own
                table</strong>
                ; <strong>a foreign key points at another table&rsquo;s primary
                key</strong>
                , expressing the relationship and keeping the reference valid.
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Primary key</th>
                      <th>Foreign key</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Job</td>
                      <td>Identifies one row</td>
                      <td>Points at another table&rsquo;s primary key</td>
                    </tr>
                    <tr>
                      <td>Unique?</td>
                      <td>
                        <strong>Must be</strong>
                      </td>
                      <td>Can repeat (one user, many orders)</td>
                    </tr>
                    <tr>
                      <td>Nullable?</td>
                      <td>
                        <strong>No</strong>
                      </td>
                      <td>Yes — meaning &ldquo;not linked yet&rdquo;</td>
                    </tr>
                    <tr>
                      <td>How many per table</td>
                      <td>One (possibly composite, several columns)</td>
                      <td>Many</td>
                    </tr>
                    <tr>
                      <td>Index</td>
                      <td>
                        <strong>Created for you</strong>
                      </td>
                      <td>
                        <strong>Not always</strong> — MySQL does, PostgreSQL{" "}
                        <strong>does not</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>That last row is the bonus point.</strong> In PostgreSQL a
                foreign key column <strong>gets no index automatically</strong>, and
                both JOINs and cascading deletes need one —{" "}
                <strong>
                  forgetting to add it by hand is a very common performance bug
                </strong>
                .
              </p>
              <p>
                <strong>
                  The real value of a foreign key is <em>referential
                  integrity</em>
                </strong>
                : the database <strong>refuses</strong> to insert an order pointing
                at a user who does not exist, and refuses to delete a user who still
                has orders.{" "}
                <strong>
                  That is consistency the database holds for you, so you do not write
                  the check in application code.
                </strong>
              </p>
              <p>
                <strong>They will ask about delete behaviour</strong> — know these
                three:
              </p>
              <ul>
                <li>
                  <code>RESTRICT</code> / <code>NO ACTION</code> —{" "}
                  <strong>refuse the delete while references exist</strong> (the
                  default, and the safest)
                </li>
                <li>
                  <code>CASCADE</code> —{" "}
                  <strong>delete the children along with it</strong> (convenient and
                  dangerous; deleting one user can take tens of thousands of rows with
                  it)
                </li>
                <li>
                  <code>SET NULL</code> — null out the child&rsquo;s foreign key
                  (fits &ldquo;the author is gone, keep the article as
                  anonymous&rdquo;)
                </li>
              </ul>
              <p>
                <strong>Another follow-up:</strong> &ldquo;Auto-increment id or
                UUID?&rdquo; — auto-increment is short, gives good index locality,
                but <strong>leaks how much data you have</strong> and collides when
                you shard. UUID is globally unique, good for distributed systems and
                for generating ids on the client, but{" "}
                <strong>
                  longer, and random inserts are unkind to a B+ tree index
                </strong>
                .{" "}
                <strong>
                  The middle ground is ULID or UUIDv7 — time-prefixed, so they sort
                </strong>{" "}
                — and saying that makes you sound like you have done this before.
              </p>
            </>
          ),
          code: [
            demo(
              "text",
              `CREATE TABLE users (
  id    BIGSERIAL PRIMARY KEY,          -- 主键：唯一、非空、自动建索引
  email TEXT UNIQUE NOT NULL            -- 唯一约束 ≠ 主键
);

CREATE TABLE orders (
  id      BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL
          REFERENCES users(id)
          ON DELETE RESTRICT,           -- 还有订单就不许删用户
  total   NUMERIC(10,2) NOT NULL
);

-- PostgreSQL 不会自动给外键列建索引，JOIN 会慢
CREATE INDEX idx_orders_user_id ON orders(user_id);`,
              { filename: "建表时的三个要点" },
            ),
          ],
        },
      ],
      transfer: [
        {
          signal: "问数据库选型",
          signalEn: "Asked how to choose a database",
          reachFor: "看数据形状和访问模式，别背优缺点表",
          reachForEn: "Look at the shape of the data and how it is read; do not recite a comparison table",
        },
        {
          signal: "JOIN 很慢",
          signalEn: "A JOIN is slow",
          reachFor: "外键列可能没索引（PostgreSQL 不自动建）",
          reachForEn: "The foreign key column may have no index, because PostgreSQL does not create one for you",
        },
        {
          signal: "问删除时子记录怎么办",
          signalEn: "Asked what happens to child rows on a delete",
          reachFor: "RESTRICT / CASCADE / SET NULL 三选一",
          reachForEn: "Pick one of RESTRICT, CASCADE or SET NULL",
        },
        {
          signal: "问自增 id 还是 UUID",
          signalEn: "Asked whether to use an auto-increment id or a UUID",
          reachFor: "提 ULID / UUIDv7 折中",
          reachForEn: "Mention ULID or UUIDv7 as a middle ground",
        },
      ],
      recap: [
        "关系型强在关联和事务，文档型强在灵活和横向扩展；选型看数据形状和访问模式。",
        "Postgres 的 jsonb 让界限变模糊，「先上 Postgres 需要时用 jsonb」是常见现实选择。",
        "主键唯一非空自动建索引；外键可重复可为空，且 PostgreSQL 不会自动给它建索引。",
        "外键的价值是引用完整性；删除行为 RESTRICT / CASCADE / SET NULL 要按业务选。",
      ],
      recapEn: [
        "Relational storage is strong on relationships and transactions, document storage on flexibility and scaling out; choose by the shape of the data and how it is read.",
        "jsonb in Postgres blurs the line, and \"start with Postgres and use jsonb when you need it\" is a common real-world choice.",
        "A primary key is unique, cannot be null, and is indexed for you; a foreign key can repeat and can be null, and PostgreSQL does not index it for you.",
        "What a foreign key gives you is referential integrity; choose RESTRICT, CASCADE or SET NULL on delete based on what the product needs.",
      ],
    },

    /* ============================================================
       网络与安全（6 题）
       ============================================================ */
    {
      id: "iv-web",
      title: "网络、安全与测试 · 六问",
      titleEn: "6 questions on networking, security and testing",
      blurb: "测试的种类、HTTPS vs HTTP、JWT、CORS、session vs cookie、HTTP 状态码。",
      blurbEn:
        "Kinds of tests, HTTPS vs HTTP, JWT, CORS, session vs cookie, HTTP status codes.",
      minutes: 24,
      objectives: [
        "说清 CORS 是谁在拦、预检请求什么时候发、以及为什么前端改不了",
        "对比 JWT 和 session 在存储位置与失效能力上的根本差别",
        "分清测试金字塔的三层各测什么",
        "按类别说出常用状态码及其语义",
      ],
      objectivesEn: [
        "Explain who blocks a request under CORS, when the preflight request is sent, and why the front end cannot fix it",
        "Compare JWT and session on the two points that matter: where the data is stored, and whether you can revoke it",
        "Say what each of the three levels of the testing pyramid tests",
        "Name the common status codes by group, and what each one means",
      ],
      whyForAssessment:
        "CORS 那道几乎人人遇到过，但能说清「是浏览器在拦、不是服务器拒绝、所以前端改不了」的人不多 —— 这是最有区分度的一道。JWT vs session 会追问「怎么让 JWT 提前失效」，答不出说明只是背过概念。",
      whyForAssessmentEn:
        "Almost everyone has hit a CORS error, but few can say clearly that the browser is the one blocking it, that the server did not refuse the request, and that the front end therefore cannot fix it. That makes it the question that separates people most. On JWT vs session the follow-up is how to revoke a JWT early, and not having an answer shows you only memorised the definition.",
      concepts: [
        {
          id: "q360",
          heading: "什么是 CORS，怎么解决 CORS 错误",
          headingEn: "What is CORS, and how do you fix a CORS error?",
          lede: "#360 What is CORS and how to solve the CORS error",
          body: (
            <>
              <p>
                <strong>一句话：</strong>浏览器的
                <strong>同源策略</strong>默认禁止页面读取
                跨源响应；CORS 是
                <strong>服务器通过响应头「授权」某些跨源请求</strong>
                的机制。
              </p>
              <p>
                <strong>三条最关键的认知（这才是区分度）：</strong>
              </p>
              <ul>
                <li>
                  <strong>是浏览器在拦，不是服务器拒绝。</strong>
                  <strong>请求通常已经发出去了、
                  服务器也已经处理了</strong>——
                  只是浏览器不让 JS 读响应。
                  <strong>所以看到 CORS 错误不等于接口没执行</strong>
                  （非幂等接口尤其要注意，
                  可能已经创建了数据）。
                </li>
                <li>
                  <strong>所以前端改不了。</strong>
                  必须服务端加响应头，
                  或者走代理。
                  <strong>在前端加什么请求头都没用。</strong>
                </li>
                <li>
                  <strong>同源 = 协议 + 域名 + 端口
                  三者全同。</strong>
                  <code>http</code> 和 <code>https</code> 不同源，
                  <code>3000</code> 和 <code>3001</code> 不同源。
                </li>
              </ul>
              <p>
                <strong>简单请求 vs 预检请求：</strong>
                <code>GET</code> / <code>HEAD</code> /
                <code>POST</code> 且只用安全头、
                <code>Content-Type</code> 限于三种
                （<code>form-urlencoded</code>、
                <code>multipart/form-data</code>、
                <code>text/plain</code>）→ 直接发。
                <br />
                <strong>其他情况先发一个
                <code>OPTIONS</code> 预检</strong>。
                <strong>注意 <code>application/json</code>
                就会触发预检</strong>——
                这就是为什么「明明是 POST 却多了一个 OPTIONS 请求」。
              </p>
              <p>
                <strong>四种解法：</strong>
              </p>
              <ol>
                <li>
                  <strong>服务端加头</strong>（正解）——
                  <code>Access-Control-Allow-Origin</code>，
                  Express 里 <code>app.use(cors())</code>。
                </li>
                <li>
                  <strong>开发时用 dev server 代理</strong>——
                  Vite 的 <code>server.proxy</code>，
                  让浏览器以为是同源。
                </li>
                <li>
                  <strong>生产用同源部署或网关</strong>——
                  前端和 API 挂在同一个域下的不同路径。
                </li>
                <li>
                  （历史方案）JSONP —— 只支持 GET，已淘汰。
                </li>
              </ol>
              <p>
                <strong>会追问：</strong>
                「要带 cookie 怎么办？」——
                前端 <code>credentials: &quot;include&quot;</code>，
                服务端 <code>Allow-Credentials: true</code>，
                <strong>而且此时
                <code>Allow-Origin</code>
                不能是 <code>*</code>，必须写具体域名</strong>。
                这是最常见的「配了 cors 还是不行」的原因。
                <br />
                「预检能缓存吗？」——
                <code>Access-Control-Max-Age</code>，
                避免每个请求都多一次往返。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> the browser&rsquo;s{" "}
                <strong>same-origin policy</strong> stops a page from reading a
                cross-origin response by default; CORS is the mechanism by which{" "}
                <strong>
                  the server uses response headers to authorise some of those
                  requests
                </strong>
                .
              </p>
              <p>
                <strong>Three things to understand — this is what separates
                people:</strong>
              </p>
              <ul>
                <li>
                  <strong>The browser blocks it; the server did not refuse.</strong>{" "}
                  <strong>
                    The request usually went out and the server usually handled it
                  </strong>{" "}
                  — the browser just will not let your JS read the response.{" "}
                  <strong>
                    So a CORS error does not mean the endpoint did not run.
                  </strong>{" "}
                  Watch out with non-idempotent endpoints: the record may already
                  exist.
                </li>
                <li>
                  <strong>Which is why the front end cannot fix it.</strong> The
                  server has to send the headers, or you go through a proxy.{" "}
                  <strong>No request header you add on the client will help.</strong>
                </li>
                <li>
                  <strong>
                    Same origin means scheme, host and port all match.
                  </strong>{" "}
                  <code>http</code> and <code>https</code> are different origins;{" "}
                  <code>3000</code> and <code>3001</code> are different origins.
                </li>
              </ul>
              <p>
                <strong>Simple requests vs preflighted ones:</strong>{" "}
                <code>GET</code> / <code>HEAD</code> / <code>POST</code> with only
                safe headers and a <code>Content-Type</code> limited to three values
                (<code>form-urlencoded</code>, <code>multipart/form-data</code>,{" "}
                <code>text/plain</code>) go straight out.
                <br />
                <strong>
                  Anything else sends an <code>OPTIONS</code> preflight first
                </strong>
                .{" "}
                <strong>
                  Note that <code>application/json</code> triggers a preflight
                </strong>{" "}
                — that is why &ldquo;it is a POST but I see an extra OPTIONS
                request&rdquo;.
              </p>
              <p>
                <strong>Four ways to fix it:</strong>
              </p>
              <ol>
                <li>
                  <strong>Send the headers from the server</strong> (the real fix) —{" "}
                  <code>Access-Control-Allow-Origin</code>, or{" "}
                  <code>app.use(cors())</code> in Express.
                </li>
                <li>
                  <strong>Proxy through the dev server while developing</strong> —
                  Vite&rsquo;s <code>server.proxy</code>, so the browser thinks it is
                  same-origin.
                </li>
                <li>
                  <strong>
                    In production, deploy same-origin or put a gateway in front
                  </strong>{" "}
                  — front end and API on the same domain, different paths.
                </li>
                <li>(Historical) JSONP — GET only, obsolete.</li>
              </ol>
              <p>
                <strong>Follow-up:</strong> &ldquo;What if I need to send
                cookies?&rdquo; — <code>credentials: &quot;include&quot;</code> on the
                client, <code>Allow-Credentials: true</code> on the server,{" "}
                <strong>
                  and at that point <code>Allow-Origin</code> cannot be{" "}
                  <code>*</code> — it must name the origin
                </strong>
                . This is the most common reason for &ldquo;I configured cors and it
                still does not work&rdquo;.
                <br />
                &ldquo;Can the preflight be cached?&rdquo; —{" "}
                <code>Access-Control-Max-Age</code>, so you do not pay a round trip
                per request.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `// 服务端（正解）
app.use(cors({
  origin: "https://app.example.com",   // 带 cookie 时不能用 *
  credentials: true,
  maxAge: 86400,                       // 缓存预检结果
}));

// 开发时代理（vite.config.ts）
server: {
  proxy: { "/api": { target: "http://localhost:4000", changeOrigin: true } },
}
// 浏览器看到的是同源的 /api/...，不触发 CORS`,
              { filename: "两种最常用的解法" },
            ),
          ],
        },
        {
          id: "q358",
          heading: "HTTPS vs HTTP",
          lede: "#358 HTTPS vs HTTP",
          body: (
            <>
              <p>
                <strong>一句话：</strong>HTTPS =
                HTTP + <strong>TLS 加密层</strong>。
                同一套协议，只是传输过程被加密和验证了。
              </p>
              <p>
                <strong>它提供三样东西（要说全）：</strong>
              </p>
              <ul>
                <li>
                  <strong>加密</strong>—— 中间人看不到内容
                </li>
                <li>
                  <strong>身份验证</strong>——
                  证书证明「你连的确实是这个域名的服务器」，
                  <strong>这一条常被忽略，
                  但它才是防钓鱼的关键</strong>
                </li>
                <li>
                  <strong>完整性</strong>——
                  内容被篡改会被发现
                </li>
              </ul>
              <p>
                <strong>握手大致过程：</strong>
                客户端打招呼 → 服务器发证书 →
                客户端验证书链 →
                <strong>用非对称加密协商出一个对称密钥</strong> →
                之后用对称加密传数据。
                <strong>为什么要混用两种加密？</strong>
                非对称安全但慢，
                对称快但要先安全地交换密钥 ——
                <strong>所以用非对称来交换对称密钥</strong>。
                这一句是加分点。
              </p>
              <p>
                <strong>端口：</strong>HTTP 80，
                HTTPS 443。
              </p>
              <p>
                <strong>会追问：</strong>
                「HTTPS 慢吗？」——
                握手有额外开销，
                但<strong>TLS 1.3 把握手压到一次往返</strong>，
                而且<strong>HTTP/2 和 HTTP/3 只在 HTTPS 上可用</strong>——
                多路复用带来的收益通常
                <strong>超过加密的开销</strong>。
                所以「用 HTTPS 会变慢」现在基本不成立。
                <br />
                「有了 HTTPS 就安全了吗？」——
                <strong>不</strong>。它只保护传输过程。
                XSS、SQL 注入、
                弱口令、越权
                一个都没解决。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> HTTPS is HTTP plus a{" "}
                <strong>TLS layer</strong>. Same protocol; the transport is now
                encrypted and authenticated.
              </p>
              <p>
                <strong>It gives you three things — name all three:</strong>
              </p>
              <ul>
                <li>
                  <strong>Encryption</strong> — someone in the middle cannot read the
                  contents
                </li>
                <li>
                  <strong>Authentication</strong> — the certificate proves{" "}
                  &ldquo;you really are talking to the server for this
                  domain&rdquo;.{" "}
                  <strong>
                    People forget this one, and it is the part that stops phishing
                  </strong>
                </li>
                <li>
                  <strong>Integrity</strong> — tampering is detected
                </li>
              </ul>
              <p>
                <strong>Roughly how the handshake goes:</strong> client says hello →
                server sends its certificate → client verifies the chain →{" "}
                <strong>
                  they use asymmetric crypto to agree on a symmetric key
                </strong>{" "}
                → everything after that is symmetric.{" "}
                <strong>Why mix the two?</strong> Asymmetric is secure but slow;
                symmetric is fast but needs the key exchanged safely first —{" "}
                <strong>so you use asymmetric to exchange the symmetric key</strong>.
                That sentence is the bonus point.
              </p>
              <p>
                <strong>Ports:</strong> 80 for HTTP, 443 for HTTPS.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Is HTTPS slow?&rdquo; — the
                handshake costs something, but{" "}
                <strong>TLS 1.3 gets it down to one round trip</strong>, and{" "}
                <strong>HTTP/2 and HTTP/3 are only available over HTTPS</strong> —
                the multiplexing usually{" "}
                <strong>more than pays for the encryption</strong>. So &ldquo;HTTPS
                makes it slower&rdquo; no longer really holds.
                <br />
                &ldquo;Does HTTPS make me secure?&rdquo; — <strong>no</strong>. It
                protects the transport. XSS, SQL injection, weak passwords and broken
                authorisation are all still yours to solve.
              </p>
            </>
          ),
        },
        {
          id: "q359",
          heading: "什么是 JWT",
          headingEn: "What is a JWT?",
          lede: "#359 What is JWT",
          body: (
            <>
              <p>
                <strong>一句话：</strong>JSON Web Token ——
                一个<strong>自带签名的字符串</strong>，
                服务器不用存它也能验证它没被篡改。
              </p>
              <p>
                <strong>三段结构，用点分隔：</strong>
                <code>header.payload.signature</code>
              </p>
              <ul>
                <li>
                  <strong>header</strong>—— 用什么算法签的
                </li>
                <li>
                  <strong>payload</strong>——
                  用户 id、过期时间等
                  <strong>业务数据</strong>
                </li>
                <li>
                  <strong>signature</strong>——
                  对前两段用密钥算出的签名
                </li>
              </ul>
              <p>
                <strong>最重要的一条（必答）：</strong>
                前两段只是
                <strong>Base64URL 编码，不是加密</strong>——
                <strong>任何人都能解出来看</strong>。
                所以<strong>payload 里绝不能放密码、
                身份证号这类敏感信息</strong>。
                签名保证的是
                <strong>「没被改过」，不是「看不到」</strong>。
              </p>
              <p>
                <strong>优点：</strong>
                <strong>无状态</strong>——
                服务器不用存 session，
                天然适合多实例和微服务
                （任何一台都能独立验证）。
              </p>
              <p>
                <strong>缺点（这半边是重点）：</strong>
              </p>
              <ul>
                <li>
                  <strong>没法主动失效。</strong>
                  签出去就有效到过期。
                  用户改密码、
                  管理员封号，
                  <strong>旧 token 照样能用</strong>。
                </li>
                <li>
                  <strong>体积比 session id 大</strong>，
                  每个请求都要带。
                </li>
                <li>
                  <strong>放哪都有风险</strong>——
                  <code>localStorage</code> 怕 XSS，
                  cookie 怕 CSRF。
                </li>
              </ul>
              <p>
                <strong>会追问：「怎么让 JWT 提前失效？」</strong>
                —— 这是这题的分水岭：
              </p>
              <ul>
                <li>
                  <strong>短过期 + refresh token</strong>——
                  access token 只活 15 分钟，
                  用一个可撤销的 refresh token 换新的。
                  <strong>这是标准做法。</strong>
                </li>
                <li>
                  <strong>黑名单</strong>——
                  把要作废的 token id 存 Redis。
                  <strong>但这就重新变成有状态了</strong>，
                  等于放弃了 JWT 的主要优点。
                </li>
              </ul>
              <p>
                <strong>安全上还有一个经典坑：</strong>
                验证时<strong>必须指定期望的算法</strong>，
                不能信 header 里写的 ——
                否则攻击者把 <code>alg</code>
                改成 <code>none</code> 就绕过签名了。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> a JSON Web Token is{" "}
                <strong>a string that carries its own signature</strong>, so the
                server can verify it has not been tampered with without storing it.
              </p>
              <p>
                <strong>Three parts, separated by dots:</strong>{" "}
                <code>header.payload.signature</code>
              </p>
              <ul>
                <li>
                  <strong>header</strong> — which algorithm signed it
                </li>
                <li>
                  <strong>payload</strong> — the <strong>data</strong>: user id,
                  expiry and so on
                </li>
                <li>
                  <strong>signature</strong> — the first two parts signed with your
                  secret
                </li>
              </ul>
              <p>
                <strong>The one thing you must say:</strong> the first two parts are{" "}
                <strong>Base64URL encoded, not encrypted</strong> —{" "}
                <strong>anyone can decode and read them</strong>. So{" "}
                <strong>
                  never put a password or a national id number in the payload
                </strong>
                . The signature guarantees{" "}
                <strong>&ldquo;unchanged&rdquo;, not &ldquo;unreadable&rdquo;</strong>
                .
              </p>
              <p>
                <strong>The upside:</strong> <strong>it is stateless</strong> — the
                server stores no session, which suits many instances and
                microservices, since any one of them can verify it alone.
              </p>
              <p>
                <strong>The downsides — this half is the real question:</strong>
              </p>
              <ul>
                <li>
                  <strong>You cannot revoke it.</strong> Once issued it is valid until
                  it expires. User changes their password, an admin bans the account —{" "}
                  <strong>the old token still works</strong>.
                </li>
                <li>
                  <strong>It is bigger than a session id</strong> and rides along on
                  every request.
                </li>
                <li>
                  <strong>Every place you store it has a risk</strong> —{" "}
                  <code>localStorage</code> is exposed to XSS, a cookie is exposed to
                  CSRF.
                </li>
              </ul>
              <p>
                <strong>
                  Follow-up: &ldquo;How do you expire a JWT early?&rdquo;
                </strong>{" "}
                — this is where the question separates people:
              </p>
              <ul>
                <li>
                  <strong>Short expiry plus a refresh token</strong> — the access
                  token lives 15 minutes and you trade a revocable refresh token for a
                  new one. <strong>This is the standard answer.</strong>
                </li>
                <li>
                  <strong>A blocklist</strong> — keep revoked token ids in Redis.{" "}
                  <strong>But now you are stateful again</strong>, which gives up the
                  main reason you chose JWT.
                </li>
              </ul>
              <p>
                <strong>One classic security trap:</strong> when you verify, you{" "}
                <strong>must pin the algorithm you expect</strong> rather than trust
                the one in the header — otherwise an attacker sets{" "}
                <code>alg</code> to <code>none</code> and walks past the signature
                entirely.
              </p>
            </>
          ),
        },
        {
          id: "q361",
          heading: "session vs cookie",
          lede: "#361 sessions vs cookies",
          body: (
            <>
              <p>
                <strong>先纠正一个常见混淆：</strong>
                <strong>它们不是同级的东西。</strong>
                <strong>cookie 是「浏览器存小数据的机制」</strong>，
                <strong>session 是「服务器记住用户状态的方案」</strong>——
                而 session 通常<strong>靠 cookie 来传那个 id</strong>。
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Cookie</th>
                      <th>Session</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>存在哪</td>
                      <td><strong>浏览器</strong></td>
                      <td><strong>服务器</strong>（内存 / Redis / 数据库）</td>
                    </tr>
                    <tr>
                      <td>存什么</td>
                      <td>小字符串（≤ 4 KB）</td>
                      <td>任意大小的用户数据</td>
                    </tr>
                    <tr>
                      <td>安全性</td>
                      <td>用户能看能改</td>
                      <td>用户只拿到一个 id</td>
                    </tr>
                    <tr>
                      <td>能否主动失效</td>
                      <td>要等过期或被覆盖</td>
                      <td><strong>能，删掉服务端记录就行</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>典型流程：</strong>
                登录成功 → 服务器建 session、
                生成 session id →
                通过 <code>Set-Cookie</code> 发给浏览器 →
                之后每个请求浏览器自动带上 →
                服务器用 id 查出用户。
              </p>
              <p>
                <strong>Cookie 的四个安全属性必须会：</strong>
              </p>
              <ul>
                <li>
                  <strong><code>HttpOnly</code></strong>——
                  JS 读不到，<strong>防 XSS 偷 cookie</strong>
                </li>
                <li>
                  <strong><code>Secure</code></strong>——
                  只在 HTTPS 下发送
                </li>
                <li>
                  <strong><code>SameSite</code></strong>——
                  <code>Strict</code> / <code>Lax</code> /
                  <code>None</code>，<strong>防 CSRF</strong>
                  的主要手段
                </li>
                <li>
                  <code>Max-Age</code> / <code>Domain</code> /
                  <code>Path</code>—— 作用范围
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>
                「session vs JWT 怎么选？」——
              </p>
              <ul>
                <li>
                  <strong>要能立刻踢人下线</strong>
                  （后台管理、支付类）→ <strong>session</strong>
                </li>
                <li>
                  <strong>多服务、跨域、
                  移动端 + Web 共用</strong>
                  → <strong>JWT</strong>（配 refresh token）
                </li>
              </ul>
              <p>
                <strong>还会问：</strong>
                「session 在多实例部署下怎么办？」——
                存内存会导致「刷新一下就掉登录」
                （请求打到别的实例）。
                解法是<strong>把 session 存 Redis</strong>，
                或者用粘性会话（不推荐）。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>First, clear up the usual confusion:</strong>{" "}
                <strong>these are not two options at the same level.</strong>{" "}
                <strong>A cookie is a browser mechanism for storing a small
                value</strong>
                ;{" "}
                <strong>a session is a server-side way of remembering who the user
                is</strong>{" "}
                — and a session normally{" "}
                <strong>uses a cookie to carry its id</strong>.
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Cookie</th>
                      <th>Session</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Lives where</td>
                      <td>
                        <strong>The browser</strong>
                      </td>
                      <td>
                        <strong>The server</strong> (memory / Redis / database)
                      </td>
                    </tr>
                    <tr>
                      <td>Holds what</td>
                      <td>A small string, 4 KB or less</td>
                      <td>User data of any size</td>
                    </tr>
                    <tr>
                      <td>Security</td>
                      <td>The user can read it and change it</td>
                      <td>The user only ever holds an id</td>
                    </tr>
                    <tr>
                      <td>Can you revoke it?</td>
                      <td>Only by expiry or overwrite</td>
                      <td>
                        <strong>Yes — delete the server-side record</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>The typical flow:</strong> login succeeds → the server creates
                a session and a session id → it goes out via{" "}
                <code>Set-Cookie</code> → the browser attaches it to every subsequent
                request → the server looks the user up by that id.
              </p>
              <p>
                <strong>You have to know the four cookie security attributes:</strong>
              </p>
              <ul>
                <li>
                  <strong>
                    <code>HttpOnly</code>
                  </strong>{" "}
                  — JS cannot read it, which{" "}
                  <strong>stops XSS from stealing the cookie</strong>
                </li>
                <li>
                  <strong>
                    <code>Secure</code>
                  </strong>{" "}
                  — only sent over HTTPS
                </li>
                <li>
                  <strong>
                    <code>SameSite</code>
                  </strong>{" "}
                  — <code>Strict</code> / <code>Lax</code> / <code>None</code>, the
                  main defence <strong>against CSRF</strong>
                </li>
                <li>
                  <code>Max-Age</code> / <code>Domain</code> / <code>Path</code> — its
                  scope
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;Session or JWT?&rdquo; —
              </p>
              <ul>
                <li>
                  <strong>You need to kick someone out right now</strong> (admin
                  panels, anything touching payments) → <strong>session</strong>
                </li>
                <li>
                  <strong>
                    Many services, cross-domain, one API for both mobile and web
                  </strong>{" "}
                  → <strong>JWT</strong>, with a refresh token
                </li>
              </ul>
              <p>
                <strong>They will also ask:</strong> &ldquo;What happens to sessions
                across several instances?&rdquo; — keeping them in memory means
                &ldquo;refresh the page and I am logged out&rdquo; when the request
                lands on a different instance. The fix is to{" "}
                <strong>put sessions in Redis</strong>, or sticky sessions (not
                recommended).
              </p>
            </>
          ),
        },
        {
          id: "q362",
          heading: "常见的 HTTP 状态码",
          headingEn: "What are the common HTTP status codes?",
          lede: "#362 Give some HTTP response status codes",
          body: (
            <>
              <p>
                <strong>先说五个类别，再举例 —— 这样显得有体系：</strong>
                1xx 信息、
                <strong>2xx 成功</strong>、
                <strong>3xx 重定向</strong>、
                <strong>4xx 客户端错</strong>、
                <strong>5xx 服务端错</strong>。
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>码</th>
                      <th>含义</th>
                      <th>什么时候用</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>200</strong> OK</td>
                      <td>成功</td>
                      <td>GET / PUT / PATCH 成功</td>
                    </tr>
                    <tr>
                      <td><strong>201</strong> Created</td>
                      <td>已创建</td>
                      <td>POST 成功，<strong>建议带 Location 头</strong></td>
                    </tr>
                    <tr>
                      <td><strong>204</strong> No Content</td>
                      <td>成功但没内容</td>
                      <td>DELETE 成功</td>
                    </tr>
                    <tr>
                      <td>301 / 302</td>
                      <td>永久 / 临时重定向</td>
                      <td>301 会被浏览器缓存，改错了很难收回</td>
                    </tr>
                    <tr>
                      <td>304 Not Modified</td>
                      <td>没变，用缓存</td>
                      <td>配 ETag / Last-Modified</td>
                    </tr>
                    <tr>
                      <td><strong>400</strong> Bad Request</td>
                      <td>请求有问题</td>
                      <td>参数缺失、格式错、校验失败</td>
                    </tr>
                    <tr>
                      <td><strong>401</strong> Unauthorized</td>
                      <td><strong>没登录 / token 无效</strong></td>
                      <td>「你是谁？」</td>
                    </tr>
                    <tr>
                      <td><strong>403</strong> Forbidden</td>
                      <td><strong>登录了但没权限</strong></td>
                      <td>「知道你是谁，但你不能干这个」</td>
                    </tr>
                    <tr>
                      <td><strong>404</strong> Not Found</td>
                      <td>资源不存在</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td>409 Conflict</td>
                      <td>冲突</td>
                      <td>重复注册、并发修改</td>
                    </tr>
                    <tr>
                      <td>422</td>
                      <td>语义错误</td>
                      <td>格式对但业务上不合法</td>
                    </tr>
                    <tr>
                      <td>429</td>
                      <td>请求太多</td>
                      <td>限流</td>
                    </tr>
                    <tr>
                      <td><strong>500</strong></td>
                      <td>服务端异常</td>
                      <td>未捕获的错误</td>
                    </tr>
                    <tr>
                      <td>502 / 503 / 504</td>
                      <td>网关错 / 不可用 / 超时</td>
                      <td>上游挂了、在维护、上游太慢</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>401 vs 403 是最常问的一对</strong>：
                <strong>401 是「没认证」，403 是「认证了但没授权」</strong>。
                <br />
                实践里有个细节：为了
                <strong>不泄露资源是否存在</strong>，
                有些接口会把「没权限」也返回 404。
              </p>
              <p>
                <strong>会追问：</strong>
                「业务错误该用 4xx 还是 200 带错误码？」——
                <strong>REST 风格用 4xx</strong>
                （让 HTTP 语义承载错误），
                但要注意<strong>有些老网关会吞掉 4xx 的响应体</strong>。
                <strong>GraphQL 则一律返 200</strong>，
                错误放在 <code>errors</code> 字段里 ——
                因为一个请求可能<strong>部分成功</strong>，
                没法用单个状态码表达。
                <strong>这个对比答出来很加分</strong>，
                Federation 那门课里 <code>extensions.code</code>
                就是干这个的。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>Name the five classes first, then give examples — it reads as
                organised:</strong>{" "}
                1xx informational, <strong>2xx success</strong>,{" "}
                <strong>3xx redirect</strong>, <strong>4xx client error</strong>,{" "}
                <strong>5xx server error</strong>.
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Means</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>200</strong> OK
                      </td>
                      <td>Success</td>
                      <td>A successful GET / PUT / PATCH</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>201</strong> Created
                      </td>
                      <td>Created</td>
                      <td>
                        A successful POST — <strong>send a Location header</strong>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>204</strong> No Content
                      </td>
                      <td>Success, nothing to return</td>
                      <td>A successful DELETE</td>
                    </tr>
                    <tr>
                      <td>301 / 302</td>
                      <td>Permanent / temporary redirect</td>
                      <td>Browsers cache 301, so a wrong one is hard to take back</td>
                    </tr>
                    <tr>
                      <td>304 Not Modified</td>
                      <td>Unchanged, use your cache</td>
                      <td>Paired with ETag or Last-Modified</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>400</strong> Bad Request
                      </td>
                      <td>The request is wrong</td>
                      <td>Missing parameter, bad format, failed validation</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>401</strong> Unauthorized
                      </td>
                      <td>
                        <strong>Not logged in, or the token is invalid</strong>
                      </td>
                      <td>&ldquo;Who are you?&rdquo;</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>403</strong> Forbidden
                      </td>
                      <td>
                        <strong>Logged in but not allowed</strong>
                      </td>
                      <td>&ldquo;I know who you are, and you cannot do this&rdquo;</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>404</strong> Not Found
                      </td>
                      <td>No such resource</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td>409 Conflict</td>
                      <td>Conflict</td>
                      <td>Duplicate signup, concurrent edit</td>
                    </tr>
                    <tr>
                      <td>422</td>
                      <td>Semantically wrong</td>
                      <td>Well-formed but invalid for the business rules</td>
                    </tr>
                    <tr>
                      <td>429</td>
                      <td>Too many requests</td>
                      <td>Rate limiting</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>500</strong>
                      </td>
                      <td>Server failed</td>
                      <td>An uncaught error</td>
                    </tr>
                    <tr>
                      <td>502 / 503 / 504</td>
                      <td>Bad gateway / unavailable / timeout</td>
                      <td>Upstream is down, in maintenance, or too slow</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>401 vs 403 is the pair they ask about most</strong>:{" "}
                <strong>
                  401 means not authenticated, 403 means authenticated but not
                  authorised
                </strong>
                .
                <br />
                One detail from practice: to{" "}
                <strong>avoid leaking whether a resource exists</strong>, some
                endpoints return 404 for &ldquo;not allowed&rdquo; as well.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Should a business error be a 4xx or
                a 200 with an error code?&rdquo; — <strong>REST says 4xx</strong>, so
                the HTTP semantics carry the error, but watch out:{" "}
                <strong>some older gateways swallow the body of a 4xx</strong>.{" "}
                <strong>GraphQL always returns 200</strong> and puts errors in the{" "}
                <code>errors</code> field, because one request can be{" "}
                <strong>partially successful</strong> and no single status code says
                that. <strong>Drawing that contrast earns you points</strong> — in the
                Federation course, <code>extensions.code</code> is exactly this.
              </p>
            </>
          ),
        },
        {
          id: "q357",
          heading: "测试有哪几种",
          headingEn: "What kinds of tests are there?",
          lede: "#357 What are the different kinds of tests",
          body: (
            <>
              <p>
                <strong>一句话：</strong>按范围从小到大 ——
                <strong>单元 → 集成 → 端到端</strong>，
                这就是「测试金字塔」：
                <strong>越往上越慢越脆，所以数量越少</strong>。
              </p>
              <ul>
                <li>
                  <strong>单元测试（unit）</strong>——
                  测一个函数或一个组件，
                  依赖全部 mock。
                  <strong>快、多、定位准。</strong>
                  例：一个纯函数、
                  一个 React 组件的渲染。
                </li>
                <li>
                  <strong>集成测试（integration）</strong>——
                  测几个模块<strong>协作</strong>是否正确，
                  可能真的连数据库或起一个测试服务器。
                  例：调一个 API 端点，
                  断言它真的写进了库。
                </li>
                <li>
                  <strong>端到端（E2E）</strong>——
                  <strong>用真实浏览器走完整用户流程</strong>。
                  Playwright / Cypress。
                  最接近真实，也最慢最容易随机失败。
                </li>
              </ul>
              <p>
                <strong>还会提到的几种：</strong>
                回归测试（防止改坏老功能）、
                快照测试（比对渲染输出，
                <strong>容易变成「随手更新快照」的橡皮章</strong>）、
                性能 / 压力测试、
                可访问性测试、
                冒烟测试（上线后快速验证主流程）。
              </p>
              <p>
                <strong>Testing Library 的核心理念值得说：</strong>
                <strong>「像用户一样测试」</strong>——
                按可见文本和 role 查元素，
                而不是按 class 名或组件内部结构。
                这样重构内部实现测试不会碎。
              </p>
              <p>
                <strong>会追问：</strong>
                「测试覆盖率要多少？」——
                <strong>不要给一个死数字</strong>。
                正确回答是：
                <strong>覆盖率只说明「代码被执行过」，
                不说明「断言是对的」</strong>。
                <br />
                <strong>这一点我可以给一个实测例子</strong>：
                Federation 那门课的源项目里，
                六个端点<strong>全部 <code>return null</code>
                也能通过 3 个测试</strong>，
                node-subgraph 的 4 个「通过」里
                <strong>3 个是「空实现恰好满足断言」</strong>。
                <strong>所以「测试通过 ≠ 做对了」</strong>——
                比覆盖率数字更该关心的是断言够不够强。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> smallest scope to largest —{" "}
                <strong>unit → integration → end-to-end</strong>. That is the testing
                pyramid:{" "}
                <strong>
                  higher means slower and flakier, so you write fewer of them
                </strong>
                .
              </p>
              <ul>
                <li>
                  <strong>Unit</strong> — one function or one component, everything
                  else mocked. <strong>Fast, numerous, and precise about where the
                  problem is.</strong> A pure function; a React component rendering.
                </li>
                <li>
                  <strong>Integration</strong> — do a few modules{" "}
                  <strong>work together</strong>, possibly against a real database or
                  a test server. Call an API endpoint and assert the row really
                  landed.
                </li>
                <li>
                  <strong>End-to-end</strong> —{" "}
                  <strong>a real browser walking a whole user journey</strong>.
                  Playwright or Cypress. Closest to reality, and also the slowest and
                  the most prone to random failure.
                </li>
              </ul>
              <p>
                <strong>Others worth mentioning:</strong> regression tests (so old
                behaviour does not break), snapshot tests (comparing rendered output —{" "}
                <strong>
                  which easily degrades into rubber-stamping &ldquo;update
                  snapshot&rdquo;
                </strong>
                ), performance and load tests, accessibility tests, and smoke tests
                for a quick check of the main flow after a deploy.
              </p>
              <p>
                <strong>Testing Library&rsquo;s core idea is worth stating:</strong>{" "}
                <strong>&ldquo;test it the way a user uses it&rdquo;</strong> — find
                elements by visible text and role, not by class name or internal
                component structure. Then refactoring the internals does not shatter
                the tests.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;What coverage number should you
                aim for?&rdquo; — <strong>do not give a number</strong>. The right
                answer is that{" "}
                <strong>
                  coverage tells you code was executed, not that the assertions are
                  any good
                </strong>
                .
                <br />
                <strong>Here is a measured example</strong>: in the source project
                behind the Federation course, six endpoints that{" "}
                <strong>
                  all just <code>return null</code> still passed 3 tests
                </strong>
                , and of the 4 passes in node-subgraph,{" "}
                <strong>
                  3 were an empty implementation happening to satisfy the assertion
                </strong>
                . <strong>So a green test does not mean you got it right</strong> —
                the strength of the assertions matters more than the coverage
                percentage.
              </p>
            </>
          ),
        },
      ],
      transfer: [
        {
          signal: "CORS 报错",
          signalEn: "A CORS error",
          reachFor: "浏览器在拦，前端改不了；服务端加头或走代理",
          reachForEn: "The browser is blocking it and the front end cannot fix it; add the header on the server, or go through a proxy",
        },
        {
          signal: "「配了 cors 还是不行」",
          signalEn: "CORS is configured and it still fails",
          reachFor: "带 cookie 时 Allow-Origin 不能是 *",
          reachForEn: "When the request carries a cookie, Allow-Origin cannot be *",
        },
        {
          signal: "「POST 前多了一个 OPTIONS」",
          signalEn: "An extra OPTIONS request appears before the POST",
          reachFor: "application/json 触发了预检",
          reachForEn: "application/json triggered the preflight request",
        },
        {
          signal: "问怎么让 JWT 提前失效",
          signalEn: "Asked how to revoke a JWT before it expires",
          reachFor: "短过期 + refresh token；黑名单会变回有状态",
          reachForEn: "A short expiry plus a refresh token; a blocklist makes the server stateful again",
        },
        {
          signal: "「刷新一下就掉登录」",
          signalEn: "A reload logs the user out",
          reachFor: "多实例下 session 存内存了，改存 Redis",
          reachForEn: "With several server instances the session is kept in memory; store it in Redis instead",
        },
        {
          signal: "分不清 401 和 403",
          signalEn: "Mixing up 401 and 403",
          reachFor: "401 没认证，403 认证了没授权",
          reachForEn: "401 means not signed in, 403 means signed in but not allowed",
        },
        {
          signal: "问覆盖率要多少",
          signalEn: "Asked what test coverage number to aim for",
          reachFor: "别给数字；说覆盖率不代表断言强，举「空实现也能过」的例子",
          reachForEn: "Do not give a number; say that coverage does not measure how strong the assertions are, and give the example of an empty function that still passes",
        },
      ],
      recap: [
        "CORS 是浏览器在拦，请求可能已经执行了；前端无解，靠服务端加头或代理。",
        "application/json 会触发 OPTIONS 预检；带 cookie 时 Allow-Origin 必须写具体域名。",
        "HTTPS 给三样：加密、身份验证、完整性；非对称交换密钥、对称传数据。",
        "JWT 的 payload 只是 Base64 不是加密；最大缺点是没法主动失效，标准解法是短过期 + refresh token。",
        "cookie 是浏览器存储机制，session 是服务端状态方案，后者靠前者传 id；四个安全属性要会。",
        "401 没认证、403 没授权；201 创建、204 删除；GraphQL 一律 200 把错误放 errors。",
        "测试金字塔单元→集成→E2E；覆盖率不代表断言强 ——「空实现恰好通过」是实测过的。",
      ],
      recapEn: [
        "CORS is the browser blocking the response, and the request may already have run. The front end cannot fix it; the server has to send the header, or you use a proxy.",
        "application/json triggers an OPTIONS preflight; when a cookie is sent, Allow-Origin has to name the exact origin.",
        "HTTPS gives you three things: encryption, proof of identity, and integrity. Keys are exchanged with asymmetric cryptography, then data is sent with symmetric.",
        "The payload of a JWT is only Base64, not encrypted. Its biggest weakness is that you cannot revoke it, and the standard answer is a short expiry plus a refresh token.",
        "A cookie is browser storage, a session is a server-side approach to state, and the session uses the cookie to carry its id. Know the four security attributes.",
        "401 means not signed in, 403 means signed in but not allowed; 201 for created, 204 for deleted; GraphQL always returns 200 and puts problems in errors.",
        "The testing pyramid goes unit, then integration, then end-to-end. Coverage does not measure how strong the assertions are: an empty function passing the test has really happened.",
      ],
    },
  ],
};
