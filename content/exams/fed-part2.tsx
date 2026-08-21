// Federation 考试 —— 模块 3：Task 1（node-subgraph 的 resolver）逐项拆解。

import { ThinkFirst } from "@/components/lesson-kit";
import type { Module } from "../types";
import { demo, real } from "../helpers";

const STARTER_RESOLVERS = `import DataLoader from 'dataloader';
import { GraphQLError } from 'graphql';

// Custom error codes
const ErrorCodes = {
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  INVALID_INPUT: 'INVALID_INPUT',
  INVENTORY_ERROR: 'INVENTORY_ERROR',
  SERVICE_ERROR: 'SERVICE_ERROR'
};

// DataLoader for batching shipping info requests
function createShippingInfoLoader(shippingDataSource) { /* 已给好，是对的 */ }

// DataLoader for batching order requests
function createOrderLoader(orderDataSource) {
  return new DataLoader(async orderIds => {
    const orders = await Promise.all(
      orderIds.map(id => orderDataSource.getOrderById(id))   // ← 埋雷 1
    );
    return orders;
  });
}

export const resolvers = {
  User: {
    __resolveReference(user, { dataSources, loaders }) {
      return { id: user.id };                                // 已给好
    },

    async orders(user, _, { dataSources, loaders, correlationId }) {
      // TODO: Implement orders resolver with proper error handling and correlation ID tracing
      return [];                                             // ← TODO 1
    }
  },

  Order: {
    async shippingInfo(parent, _, { dataSources, loaders, correlationId }) {
      // TODO: Implement shipping info resolver using DataLoader to prevent N+1 queries
      return null;                                           // ← TODO 2
    }
  },

  Query: {
    async order(_, { id }, { dataSources, loaders, correlationId }) {
      // TODO: Implement order query using DataLoader with structured error handling
      return null;                                           // ← TODO 3
    },

    async orders(_, { userId }, { dataSources, correlationId }) {
      // TODO: Implement orders query with error handling and correlation ID logging
      return [];                                             // ← TODO 4
    }
  },

  Mutation: {
    async createOrder(_, { userId, items }, { dataSources, correlationId }) {
      try {
        console.log(\`[\${correlationId}] Creating order for userId: \${userId}\`);

        if (!userId || !items || items.length === 0) {
          throw new GraphQLError('Invalid order input', {
            extensions: { code: ErrorCodes.INVALID_INPUT, correlationId }
          });
        }

        const order = await dataSources.orderAPI.createOrder({ userId, items });  // ← 埋雷 2
        console.log(\`[\${correlationId}] Order created: \${order.id}\`);

        return order;
      } catch (error) {
        console.error(\`[\${correlationId}] Error creating order:\`, error.message);
        throw new GraphQLError('Failed to create order', {                        // ← 埋雷 3
          extensions: {
            code: ErrorCodes.SERVICE_ERROR,
            correlationId,
            originalError: error.message
          }
        });
      }
    }
  }
};

export { createShippingInfoLoader, createOrderLoader };`;

const DATA_SOURCE_TABLE = `class OrderDataSource {
  getOrder(id)                      → 一条 order，找不到返回 undefined
  getOrdersByUserId(userId)         → order 数组，找不到返回 []
  createOrder(userId, items)        → 新 order（内部要用 item.price 算总价！）

  种子数据：
    order-456  userId '123'  SHIPPED    299.99
    order-457  userId '123'  DELIVERED   89.99
    order-458  userId '456'  PENDING    199.99
}

class InventoryDataSource {
  getInventoryStatus(productIds)    → 没有任何地方需要它（干扰项）
  getProductPrice(productId)        → 价格，未知商品兜底 99.99  ★ createOrder 要用
}

class ShippingDataSource {
  getShippingInfo(orderId)          → 物流信息，只有 order-456/457 有，其余 null
}`;

export const fedTask1: Module = {
  id: "fed-task1",
  stage: "Federation · 第 3 部分",
  title: "Task 1 · subgraph resolver 逐项拆解",
  titleEn: "Task 1 · the subgraph resolvers, one at a time",
  summary:
    "四个 TODO 加三处埋雷。每个 TODO 都走同一套流程：读题 → 考什么 → 先想再写 → 分步实现 → 完整答案 → 为什么成立 → 常见错法 → 迁移。",
  summaryEn:
    "Four TODOs plus three planted bugs. Every TODO follows the same steps: read the task, see what it tests, think before writing, build it step by step, read the full answer, understand why it works, look at the common mistakes, then reuse the pattern elsewhere.",
  lessons: [
    /* ---------- 3.1 ---------- */
    {
      id: "g-read-task1",
      title: "先读题：四个 TODO、三处埋雷、十个测试",
      titleEn: "Read the task first: four TODOs, three planted bugs, ten tests",
      blurb: "在写第一行 resolver 之前，把要改什么、别人给了什么、判卷标准是什么全摸清。",
      blurbEn: "Before writing the first line of a resolver, find out what to change, what is already given, and how it will be graded.",
      minutes: 15,
      objectives: [
        "复述四个 TODO 各自的要求",
        "抄出一张「数据源方法名 + context 键名」的对照表",
        "跑出基线测试并读懂那 6 个失败",
        "认出「4 个通过里有 3 个是假通过」这件事",
      ],
      objectivesEn: [
        "Restate what each of the four TODOs asks for",
        "Copy out one reference table of data source method names and context key names",
        "Run the baseline tests and read the 6 failures",
        "See that 3 of the 4 passing tests are not real passes",
      ],
      whyForAssessment:
        "这一节本身就是考点。README 有一句「The starter code also contains related TODOs and integration issues that may need attention」—— 那三处埋雷不会有人告诉你在哪，只能靠核对。",
      whyForAssessmentEn:
        "This lesson is itself part of the exam. The README says: The starter code also contains related TODOs and integration issues that may need attention. Nobody tells you where the three planted bugs are; you find them by checking names one by one.",
      sourceFiles: [
        {
          path: "graphql-federation-practice/README.md",
          role: "任务清单与 EDIT THIS / PROVIDED 标注",
        },
        {
          path: "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js",
          role: "唯一要改的文件",
          edit: true,
        },
        {
          path: "graphql-federation-practice/node-subgraph/__tests__/resolvers.test.js",
          role: "10 个判卷测试",
        },
      ],
      concepts: [
        {
          id: "the-brief",
          heading: "题面原文",
          headingEn: "The task text, as given",
          body: (
            <>
              <p>README 里 Task 1 的部分，一个字没改：</p>
              <p>
                注意最后那句 <strong>integration issues</strong> ——
                这是在暗示「starter 代码里有本来就坏掉的地方」。
                它没说有几个、在哪。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>The Task 1 section of the README, not a word changed:</p>
              <p>
                Look at that last sentence,{" "}
                <strong>integration issues</strong> — it is hinting that parts
                of the starter code are broken to begin with. It does not say
                how many, or where.
              </p>
            </>
          ),
          code: [
            real(
              "text",
              `## Task 1: GraphQL Subgraph Resolver with Federation

Implement resolver logic in \`node-subgraph/src/resolvers/orderResolvers.js\`:

- Implement \`User.orders\` with proper error handling
- Implement \`Order.shippingInfo\` using the provided DataLoader
- Implement \`Query.orders\` to fetch orders by user ID

The starter code also contains related TODOs and integration issues
that may need attention.`,
              {
                filename: "README.md（Task 1 原文）",
                sourceFile: "graphql-federation-practice/README.md",
              },
            ),
          ],
        },
        {
          id: "four-todos",
          heading: "四个 TODO：README 只列了三个，代码里有四个",
          headingEn: "Four TODOs: the README lists three, the code has four",
          lede: "这是第一个需要自己发现的地方。",
          ledeEn: "This is the first thing you have to notice on your own.",
          body: (
            <>
              <p>
                README 列了三条（<code>User.orders</code>、
                <code>Order.shippingInfo</code>、<code>Query.orders</code>），
                但打开代码会发现<strong>还有一个</strong>：
                <code>Query.order</code>（单个订单）也是 TODO。
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>位置</th>
                      <th>TODO 原文里的关键词</th>
                      <th>README 提到了吗</th>
                      <th>有测试吗</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>User.orders</code></td>
                      <td>proper error handling + correlation ID tracing</td>
                      <td>✅</td>
                      <td>✅ 2 条</td>
                    </tr>
                    <tr>
                      <td><code>Order.shippingInfo</code></td>
                      <td><strong>using DataLoader to prevent N+1 queries</strong></td>
                      <td>✅</td>
                      <td>✅ 2 条</td>
                    </tr>
                    <tr>
                      <td><code>Query.order</code></td>
                      <td>using DataLoader with structured error handling</td>
                      <td>❌ <strong>没提</strong></td>
                      <td>❌ <strong>没有</strong></td>
                    </tr>
                    <tr>
                      <td><code>Query.orders</code></td>
                      <td>error handling + correlation ID logging</td>
                      <td>✅</td>
                      <td>✅ 2 条</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong><code>Query.order</code> 既没在 README 里被提到，
                也没有测试。</strong>但代码里的 TODO 明确要求实现它。
                <strong>不实现它不会有任何测试变红</strong> ——
                但人工 review 会看到一个没做的 TODO。
                <strong>照代码里的 TODO 做，别只照 README。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The README lists three (<code>User.orders</code>,{" "}
                <code>Order.shippingInfo</code>, <code>Query.orders</code>), but
                open the code and there is <strong>a fourth one</strong>:{" "}
                <code>Query.order</code> (a single order) is a TODO too.
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Where</th>
                      <th>Key words in the TODO itself</th>
                      <th>Named in the README?</th>
                      <th>Any tests?</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>User.orders</code></td>
                      <td>proper error handling + correlation ID tracing</td>
                      <td>✅</td>
                      <td>✅ 2 of them</td>
                    </tr>
                    <tr>
                      <td><code>Order.shippingInfo</code></td>
                      <td><strong>using DataLoader to prevent N+1 queries</strong></td>
                      <td>✅</td>
                      <td>✅ 2 of them</td>
                    </tr>
                    <tr>
                      <td><code>Query.order</code></td>
                      <td>using DataLoader with structured error handling</td>
                      <td>❌ <strong>never mentioned</strong></td>
                      <td>❌ <strong>none</strong></td>
                    </tr>
                    <tr>
                      <td><code>Query.orders</code></td>
                      <td>error handling + correlation ID logging</td>
                      <td>✅</td>
                      <td>✅ 2 of them</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong><code>Query.order</code> is neither named in the README
                nor covered by a test.</strong> But the TODO in the code asks
                for it in plain words. <strong>Skipping it turns no test
                red</strong> — a human reviewer, though, sees an unfinished
                TODO. <strong>Work from the TODOs in the code, not only from the
                README.</strong>
              </p>
            </>
          ),
          code: [
            real("js", STARTER_RESOLVERS, {
              filename: "src/resolvers/orderResolvers.js（starter 全貌，已标注）",
              sourceFile:
                "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js",
              highlight: [23, 36, 43, 51, 56, 71, 78],
              collapsible: true,
            }),
          ],
        },
        {
          id: "the-cheat-sheet",
          heading: "写代码前先抄这张表",
          headingEn: "Copy this table before you write code",
          lede: "三个埋雷里有两个就是「名字对不上」。抄一遍表，两个都能避掉。",
          ledeEn: "Two of the three planted bugs are just names that do not match. Copy the table once and you avoid both.",
          body: (
            <>
              <p>
                <strong>context 的结构</strong>（来自 <code>index.js</code>）：
              </p>
              <p>
                <strong>数据源的方法</strong>（来自
                <code>dataSources/orderDataSource.js</code>）：
              </p>
              <p>
                这张表值得在开始写之前<strong>真的抄一遍</strong>。
                审计发现 starter 代码里有两处名字是错的
                （<code>orderAPI</code>、<code>getOrderById</code>），
                而它们都是「听起来非常合理」的名字 ——
                靠直觉写就会中招，靠核对就不会。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>The shape of context</strong> (from{" "}
                <code>index.js</code>):
              </p>
              <p>
                <strong>The methods on the data sources</strong> (from{" "}
                <code>dataSources/orderDataSource.js</code>):
              </p>
              <p>
                This table is worth <strong>actually copying out</strong> before
                you write anything. The audit found two wrong names in the
                starter code (<code>orderAPI</code> and{" "}
                <code>getOrderById</code>), and both of them sound entirely
                reasonable — write on instinct and you walk right into them,
                check the names and you never do.
              </p>
            </>
          ),
          code: [
            real(
              "js",
              `{
  dataSources: { orderDataSource, inventoryDataSource, shippingDataSource },
  loaders:     { shippingInfoLoader, orderLoader },
  correlationId
}`,
              {
                filename: "context 的确切键名",
                sourceFile:
                  "graphql-federation-practice/node-subgraph/src/index.js",
              },
            ),
            real("text", DATA_SOURCE_TABLE, {
              filename: "三个数据源的方法与数据",
              sourceFile:
                "graphql-federation-practice/node-subgraph/src/dataSources/orderDataSource.js",
            }),
          ],
        },
        {
          id: "baseline",
          heading: "跑基线：6 failed / 4 passed",
          headingEn: "Run the baseline: 6 failed / 4 passed",
          lede: "改代码之前先知道起点。而且这个起点本身就在教你东西。",
          ledeEn: "Know your starting point before you change anything. The starting point already teaches you something.",
          body: (
            <>
              <p>
                <code>node-subgraph</code> 目录里<strong>原本没有
                <code>node_modules</code></strong>，所以第一步必须
                <code>npm install</code>。然后 <code>npm test</code>
                （这个项目<strong>有</strong> test script，和 React 那个不同）。
              </p>
              <p>审计实测结果：</p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The <code>node-subgraph</code> directory{" "}
                <strong>ships with no <code>node_modules</code></strong>, so
                step one has to be <code>npm install</code>. Then{" "}
                <code>npm test</code> (this project <strong>does</strong> have a
                test script, unlike the React one).
              </p>
              <p>What the audit actually measured:</p>
            </>
          ),
          code: [
            real(
              "bash",
              `$ cd node-subgraph
$ npm install
added 424 packages in 11s

$ npm test
Tests:       6 failed, 4 passed, 10 total`,
              { filename: "本机实测", sourceFile: "graphql-federation-practice/node-subgraph" },
            ),
          ],
        },
        {
          id: "fake-passes",
          heading: "4 个通过里有 3 个是假通过",
          headingEn: "3 of the 4 passing tests are not real passes",
          lede: "这是这门考试最重要的一课。",
          ledeEn: "This is the most important lesson in this exam.",
          body: (
            <>
              <p>逐条对照那 10 个测试：</p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>测试</th>
                      <th>基线</th>
                      <th>为什么</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>User.orders 返回用户订单</td>
                      <td>✕</td>
                      <td>TODO 返回 <code>[]</code></td>
                    </tr>
                    <tr>
                      <td>User.orders 无订单用户返回 []</td>
                      <td>✓</td>
                      <td><strong>假通过</strong>：TODO 恰好返回 []</td>
                    </tr>
                    <tr>
                      <td>Order.shippingInfo 返回物流</td>
                      <td>✕</td>
                      <td>TODO 返回 <code>null</code></td>
                    </tr>
                    <tr>
                      <td>Order.shippingInfo 无物流返回 null</td>
                      <td>✓</td>
                      <td><strong>假通过</strong></td>
                    </tr>
                    <tr>
                      <td>Query.orders 返回指定用户订单</td>
                      <td>✕</td>
                      <td>TODO 返回 <code>[]</code></td>
                    </tr>
                    <tr>
                      <td>Query.orders 无订单返回 []</td>
                      <td>✓</td>
                      <td><strong>假通过</strong></td>
                    </tr>
                    <tr>
                      <td>Mutation.createOrder 成功</td>
                      <td>✕</td>
                      <td>埋雷 2（<code>orderAPI</code> 不存在）</td>
                    </tr>
                    <tr>
                      <td>DataLoader 批量取 order</td>
                      <td>✕</td>
                      <td>埋雷 1（<code>getOrderById</code> 不存在）</td>
                    </tr>
                    <tr>
                      <td>DataLoader 批量取 shipping</td>
                      <td>✓</td>
                      <td>这个 loader 本来就是对的</td>
                    </tr>
                    <tr>
                      <td>校验失败返回结构化错误</td>
                      <td>✕</td>
                      <td>埋雷 3（catch 把 INVALID_INPUT 吞成 SERVICE_ERROR）</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>三个「假通过」的共同点：断言的都是「返回空」。</strong>
                而空实现正好就返回空。所以这三条测试
                <strong>对你的实现完全没有约束力</strong> ——
                它们从第一秒就是绿的，改完之后还是绿的，
                但中间你可能写出了完全错误的代码。
              </p>
              <p>
                <strong>怎么办？</strong>把注意力放在那 6 个红的上，
                以及那些「测试没覆盖」的要求（correlation id 日志、
                <code>Query.order</code>、DataLoader 的使用）。
                <strong>红转绿是及格线，测试之外的要求才是分差。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>Go through the ten tests one by one:</p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Baseline</th>
                      <th>Why</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>User.orders returns a user&rsquo;s orders</td>
                      <td>✕</td>
                      <td>the TODO returns <code>[]</code></td>
                    </tr>
                    <tr>
                      <td>User.orders returns [] for a user with none</td>
                      <td>✓</td>
                      <td>
                        <strong>fake pass</strong>: the TODO happens to return []
                      </td>
                    </tr>
                    <tr>
                      <td>Order.shippingInfo returns shipping info</td>
                      <td>✕</td>
                      <td>the TODO returns <code>null</code></td>
                    </tr>
                    <tr>
                      <td>Order.shippingInfo returns null when there is none</td>
                      <td>✓</td>
                      <td><strong>fake pass</strong></td>
                    </tr>
                    <tr>
                      <td>Query.orders returns one user&rsquo;s orders</td>
                      <td>✕</td>
                      <td>the TODO returns <code>[]</code></td>
                    </tr>
                    <tr>
                      <td>Query.orders returns [] when there are none</td>
                      <td>✓</td>
                      <td><strong>fake pass</strong></td>
                    </tr>
                    <tr>
                      <td>Mutation.createOrder succeeds</td>
                      <td>✕</td>
                      <td>planted bug 2 (<code>orderAPI</code> does not exist)</td>
                    </tr>
                    <tr>
                      <td>DataLoader batches order requests</td>
                      <td>✕</td>
                      <td>
                        planted bug 1 (<code>getOrderById</code> does not exist)
                      </td>
                    </tr>
                    <tr>
                      <td>DataLoader batches shipping requests</td>
                      <td>✓</td>
                      <td>this loader was correct all along</td>
                    </tr>
                    <tr>
                      <td>validation failure returns a structured error</td>
                      <td>✕</td>
                      <td>
                        planted bug 3 (the catch swallows INVALID_INPUT into
                        SERVICE_ERROR)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>What the three fake passes have in common: every one of
                them asserts &ldquo;returns nothing&rdquo;.</strong> And an empty
                implementation returns exactly nothing. So those three tests{" "}
                <strong>put no constraint at all on your implementation</strong>{" "}
                — green from the first second, still green when you are done, and
                in between you could have written completely wrong code.
              </p>
              <p>
                <strong>So what do you do?</strong> Put your attention on the six
                red ones, and on the requirements no test covers at all
                (correlation id logging, <code>Query.order</code>, using
                DataLoader). <strong>Turning red to green is the pass mark; the
                requirements outside the tests are where the points
                differ.</strong>
              </p>
            </>
          ),
        },
        {
          id: "what-to-touch",
          heading: "只改一个文件",
          headingEn: "Change one file only",
          body: (
            <>
              <p>
                README 的文件结构图标得很清楚。
                <code>node-subgraph</code> 下面：
              </p>
              <ul>
                <li>
                  <code>src/resolvers/orderResolvers.js</code> ——
                  <strong>EDIT THIS</strong>
                </li>
                <li><code>src/dataSources/orderDataSource.js</code> —— PROVIDED</li>
                <li><code>src/schema.graphql</code> —— PROVIDED</li>
                <li><code>src/index.js</code> —— PROVIDED</li>
                <li><code>__tests__/resolvers.test.js</code> —— PROVIDED</li>
              </ul>
              <p>
                <strong>PROVIDED 的意思是「别动」。</strong>
                判卷时这些文件很可能被替换回原版 ——
                你改了 <code>orderDataSource.js</code> 加一个
                <code>getOrderById</code> 方法，判卷时那个方法就消失了，
                你的 loader 又挂了。
              </p>
              <p>
                <strong>所以埋雷 1 的正确修法是改 loader 里的调用，
                不是给数据源加方法。</strong>
                这个判断在考场上值好几分。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The file tree in the README is explicit about this. Under{" "}
                <code>node-subgraph</code>:
              </p>
              <ul>
                <li>
                  <code>src/resolvers/orderResolvers.js</code> —{" "}
                  <strong>EDIT THIS</strong>
                </li>
                <li><code>src/dataSources/orderDataSource.js</code> — PROVIDED</li>
                <li><code>src/schema.graphql</code> — PROVIDED</li>
                <li><code>src/index.js</code> — PROVIDED</li>
                <li><code>__tests__/resolvers.test.js</code> — PROVIDED</li>
              </ul>
              <p>
                <strong>PROVIDED means hands off.</strong> When your submission
                is graded, those files are quite likely swapped back to the
                originals — add a <code>getOrderById</code> method to{" "}
                <code>orderDataSource.js</code> and the method vanishes at
                grading time, breaking your loader all over again.
              </p>
              <p>
                <strong>So the right fix for planted bug 1 is to change the call
                inside the loader, not to add a method to the data
                source.</strong> That judgement is worth several points in the
                exam.
              </p>
            </>
          ),
        },
      ],
      exercises: [
        {
          kind: "recognition",
          id: "g-fake-pass",
          title: "为什么基线里有 4 个测试是通过的",
          level: 1,
          prompt: (
            <p>
              四个 TODO 全都只写了 <code>return []</code> 或
              <code>return null</code>，为什么还有 4 个测试通过？
            </p>
          ),
          options: [
            { id: "a", label: "那 4 个测试写错了" },
            { id: "b", label: "其中 3 个断言的正好是「返回空」，空实现刚好满足；第 4 个测的是本来就正确的 shipping loader" },
            { id: "c", label: "jest 有缓存" },
            { id: "d", label: "那 4 个测试被 skip 了" },
          ],
          answer: ["b"],
          explain: (
            <>
              三个「无数据时返回空」的测试是<strong>假通过</strong> ——
              <code>return []</code> / <code>return null</code>
              恰好满足了它们的断言。
              <br />
              第四个（shipping 的 DataLoader 批量测试）是真通过，
              因为 <code>createShippingInfoLoader</code> 本身没有埋雷。
              <br />
              <strong>结论：这三条测试对你的实现零约束。
              绿色不等于做对了。</strong>
            </>
          ),
        },
        {
          kind: "recognition",
          id: "g-fix-where",
          title: "埋雷 1 该在哪个文件修",
          level: 1,
          prompt: (
            <p>
              <code>createOrderLoader</code> 调了不存在的
              <code>orderDataSource.getOrderById(id)</code>。
              正确的修法是？
            </p>
          ),
          options: [
            { id: "a", label: "在 orderDataSource.js 里加一个 getOrderById 方法" },
            { id: "b", label: "把 loader 里的调用改成 getOrder(id)" },
            { id: "c", label: "两个都行，看个人喜好" },
            { id: "d", label: "改测试，让它不测这个 loader" },
          ],
          answer: ["b"],
          explain: (
            <>
              <code>orderDataSource.js</code> 在 README 里标了
              <strong>PROVIDED</strong>，判卷时可能被替换回原版 ——
              你加的方法会消失，loader 又挂。
              <br />
              <strong>只改标了 EDIT THIS 的文件。</strong>
              这里唯一该改的是
              <code>src/resolvers/orderResolvers.js</code>。
              <br />
              D 更不行 —— 改判卷器等于作弊，而且测试也是 PROVIDED。
            </>
          ),
        },
        {
          kind: "ordering",
          id: "g-task1-order",
          title: "把 Task 1 的推进顺序排对",
          level: 1,
          prompt: <p>拿到 node-subgraph，最合理的动作顺序？</p>,
          items: [
            { id: "e", label: "逐个实现四个 TODO" },
            { id: "b", label: "读 schema.graphql，记下四个返回类型的可空性" },
            { id: "a", label: "npm install，然后 npm test 拿到 6 failed / 4 passed 的基线" },
            { id: "f", label: "npm test 转绿，再写个 verify 脚本查 _service 和 _entities" },
            { id: "c", label: "读 index.js 和 dataSources，抄下 context 键名与方法名" },
            { id: "d", label: "修三处埋雷" },
          ],
          answer: ["a", "b", "c", "d", "e", "f"],
          explain: (
            <>
              先装依赖跑基线 → 读 schema（知道要返回什么形状）→
              读 index.js 和数据源（知道能调什么）→
              <strong>先修埋雷</strong>（否则你写对了 TODO，测试还是红的，
              会误以为自己写错了）→ 再写 TODO → 最后验证。
              <br />
              <strong>「先修埋雷」这个顺序很重要</strong> ——
              埋雷 1 会让 DataLoader 测试挂，如果你先写
              <code>Query.order</code>（它用 orderLoader），
              会被埋雷的报错干扰，白花时间怀疑自己的代码。
            </>
          ),
        },
      ],
      callouts: [
        {
          tone: "note",
          title: "这个项目是重建版",
          body: (
            <p>
              这个参考项目是<strong>为练习专门搭的</strong>：结构、TODO、测试、
              埋的坑都是照着「一个真实的 Federation 服务会长什么样」设计的，
              目的是让你在尽量接近真实工程的环境里练，而不是在玩具里练。
              <br />
              这不影响学习价值 —— 考点、埋雷类型、验收方式都是真实的。
              但如果你的真题里某个细节不一样，以真题为准。
            </p>
          ),
        },
      ],
      transfer: [
        { signal: "README 说有「integration issues」", signalEn: "The README mentions integration issues", reachFor: "逐个核对方法名、键名、签名", reachForEn: "Check method names, key names and signatures one by one" },
        { signal: "看到 EDIT THIS / PROVIDED 标注", signalEn: "You see EDIT THIS / PROVIDED markers", reachFor: "只改 EDIT THIS 的文件", reachForEn: "Only change the files marked EDIT THIS" },
        { signal: "基线里有测试是绿的", signalEn: "Some tests are already green in the baseline", reachFor: "判断是真通过还是「空实现恰好满足」", reachForEn: "Decide whether it really passes, or an empty implementation happens to satisfy it" },
        { signal: "代码里的 TODO 比 README 多", signalEn: "The code has more TODOs than the README", reachFor: "以代码为准，README 可能不全", reachForEn: "Trust the code; the README may be incomplete" },
      ],
      recap: [
        "四个 TODO，README 只列了三个 —— Query.order 既没被提到也没有测试，但代码里要求实现。",
        "开始写之前抄两张表：context 的键名、三个数据源的方法名。",
        "基线是 6 failed / 4 passed，其中 3 个通过是「空实现恰好满足断言」的假通过。",
        "只改 orderResolvers.js；其余文件 PROVIDED，判卷时可能被换回原版。",
        "先修埋雷再写 TODO，否则埋雷的报错会干扰你判断自己的代码对不对。",
      ],
      recapEn: [
        "There are four TODOs but the README lists three. Query.order is neither mentioned nor tested, yet the code asks you to implement it.",
        "Before you start writing, copy two tables: the key names in context, and the method names on the three data sources.",
        "The baseline is 6 failed / 4 passed, and 3 of those passes only happen because an empty implementation satisfies the assertion.",
        "Change only orderResolvers.js. The other files are marked PROVIDED and may be replaced with the originals during grading.",
        "Fix the planted bugs before writing the TODOs, otherwise their errors make it hard to tell whether your own code is right.",
      ],
    },

    /* ---------- 3.2 ---------- */
    {
      id: "g-user-orders",
      title: "TODO 1 · User.orders",
      titleEn: "TODO 1 · User.orders",
      blurb: "Federation 链路的终点。三行代码，但每一行都有理由。",
      blurbEn: "The last step of the Federation path. Three lines of code, and every line has a reason.",
      minutes: 13,
      objectives: [
        "独立写出 User.orders",
        "解释 user.id 是从哪来的",
        "说清为什么必须 ?? [] 兜底",
        "写出符合 TODO 要求的错误处理和 correlation id 日志",
      ],
      objectivesEn: [
        "Write User.orders without help",
        "Explain where user.id comes from",
        "Explain why ?? [] is required as a fallback",
        "Write the error handling and correlation id logging the TODO asks for",
      ],
      whyForAssessment:
        "这是 Federation 那部分唯一一个要你写的 entity 字段。它的正确性直接决定「Router 能不能把用户和订单缝起来」。两个测试查它。",
      whyForAssessmentEn:
        "This is the only entity field the Federation part asks you to write. Whether it is correct decides whether the Router can join users to their orders. Two tests check it.",
      sourceFiles: [
        {
          path: "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js",
          role: "User.orders",
          edit: true,
        },
      ],
      concepts: [
        {
          id: "what-asked",
          heading: "这一问在要求什么",
          headingEn: "What this task asks for",
          body: (
            <>
              <p>
                TODO 原文：
                <em>Implement orders resolver with proper error handling and
                correlation ID tracing</em>。
              </p>
              <p>三个要求：</p>
              <ol>
                <li><strong>实现</strong> —— 返回这个用户的订单列表。</li>
                <li>
                  <strong>proper error handling</strong> ——
                  数据源出错时要抛结构化的 <code>GraphQLError</code>，
                  不能让原始异常裸奔到客户端。
                </li>
                <li>
                  <strong>correlation ID tracing</strong> ——
                  日志和错误里都要带上 <code>correlationId</code>。
                </li>
              </ol>
              <p>
                schema 那边的约束：<code>orders: [Order!]!</code>，
                <strong>双重非空</strong> —— 绝不能返回 null。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The TODO, word for word:{" "}
                <em>Implement orders resolver with proper error handling and
                correlation ID tracing</em>.
              </p>
              <p>Three requirements:</p>
              <ol>
                <li>
                  <strong>Implement it</strong> — return this user&rsquo;s list
                  of orders.
                </li>
                <li>
                  <strong>proper error handling</strong> — when the data source
                  fails, throw a structured <code>GraphQLError</code>; never let
                  a raw exception run loose to the client.
                </li>
                <li>
                  <strong>correlation ID tracing</strong> — carry{" "}
                  <code>correlationId</code> in both the logs and the errors.
                </li>
              </ol>
              <p>
                The constraint from the schema:{" "}
                <code>orders: [Order!]!</code>,{" "}
                <strong>non-null twice over</strong> — never return null.
              </p>
            </>
          ),
        },
        {
          id: "tests-what",
          heading: "这一问真正考什么",
          headingEn: "What this task actually tests",
          body: (
            <>
              <ul>
                <li>
                  <strong>你知不知道 parent 是什么。</strong>
                  <code>user.id</code> 来自
                  <code>__resolveReference</code> 的返回值，
                  而它只返回了 <code>{'{ id }'}</code>。
                </li>
                <li>
                  <strong>你会不会核对方法名。</strong>
                  是 <code>getOrdersByUserId</code>，
                  不是 <code>getOrders</code>、不是 <code>findByUser</code>。
                </li>
                <li>
                  <strong>你读没读 schema 的可空性。</strong>
                  <code>[Order!]!</code> 决定了必须 <code>?? []</code>。
                </li>
                <li>
                  <strong>你会不会区分「业务错误」和「系统错误」。</strong>
                  下面会讲为什么 catch 里要先判断
                  <code>instanceof GraphQLError</code>。
                </li>
              </ul>
            </>
          ),
          bodyEn: (
            <>
              <ul>
                <li>
                  <strong>Whether you know what parent is.</strong>{" "}
                  <code>user.id</code> comes from what{" "}
                  <code>__resolveReference</code> returned, and that was only{" "}
                  <code>{'{ id }'}</code>.
                </li>
                <li>
                  <strong>Whether you check method names.</strong> It is{" "}
                  <code>getOrdersByUserId</code>, not <code>getOrders</code> and
                  not <code>findByUser</code>.
                </li>
                <li>
                  <strong>Whether you read the nullability in the
                  schema.</strong> <code>[Order!]!</code> is what forces the{" "}
                  <code>?? []</code>.
                </li>
                <li>
                  <strong>Whether you tell a business error apart from a system
                  error.</strong> The next section explains why a catch has to
                  check <code>instanceof GraphQLError</code> first.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "think-first",
          heading: "先想再写",
          headingEn: "Think before you write",
          body: (
            <>
              <ThinkFirst questions={[
"输入是什么？—— parent（user，上面只有 id）。args 是空的。",
                  "输出是什么？—— Order 数组。schema 说双重非空，所以最少是 []。",
                  "数据从哪来？—— context.dataSources.orderDataSource。",
                  "调哪个方法？—— getOrdersByUserId(userId)，参数是字符串 id。",
                  "出错了怎么办？—— 抛 GraphQLError，extensions 里带 code 和 correlationId。",
              ]} />
            </>
          ),
          bodyEn: (
            <>
              <ThinkFirst questions={[
                "What is the input? — parent, the user, which carries nothing but id. args is empty.",
                "What is the output? — an array of Order. The schema says non-null twice over, so the floor is [].",
                "Where does the data come from? — context.dataSources.orderDataSource.",
                "Which method? — getOrdersByUserId(userId), and the argument is a string id.",
                "What if it throws? — throw a GraphQLError with code and correlationId in extensions.",
              ]} />
            </>
          ),
        },
        {
          id: "step-by-step",
          heading: "分步实现",
          headingEn: "Building it step by step",
          body: (
            <>
              <p>
                <strong>第一步：最小可用版本。</strong>
                先让那个红的测试变绿。
              </p>
              <p>
                <strong>第二步：加兜底。</strong>
                <code>getOrdersByUserId</code> 用 <code>filter</code> 实现，
                找不到会返回 <code>[]</code> 而不是 undefined，
                所以这里的 <code>?? []</code> 严格说是防御性的。
                <strong>但还是要写</strong> ——
                schema 是双重非空，你不该依赖数据源的实现细节。
                真实项目里数据源换个实现（比如换成 HTTP 调用）就可能返回 undefined。
              </p>
              <p>
                <strong>第三步：加 try/catch 和日志。</strong>
                TODO 明确要求这两样。
              </p>
              <p>
                <strong>第四步：处理「已经是 GraphQLError」的情况。</strong>
                这一步是最容易漏的，下一段专门讲。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>Step one: the smallest version that works.</strong> Get
                that red test to green.
              </p>
              <p>
                <strong>Step two: add the fallback.</strong>{" "}
                <code>getOrdersByUserId</code> is written with{" "}
                <code>filter</code>, so a miss gives you <code>[]</code> rather
                than undefined, which makes the <code>?? []</code> here strictly
                defensive. <strong>Write it anyway</strong> — the schema is
                non-null twice over and you should not lean on the data
                source&rsquo;s implementation details. In a real project, swap
                that data source for an HTTP call and undefined becomes
                possible.
              </p>
              <p>
                <strong>Step three: add try/catch and logging.</strong> The TODO
                asks for both in plain words.
              </p>
              <p>
                <strong>Step four: handle the case where the error is already a
                GraphQLError.</strong> The easiest step to miss, and the next
                section is all about it.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `// 第一步
async orders(user, _, { dataSources }) {
  return dataSources.orderDataSource.getOrdersByUserId(user.id);
}`,
              { filename: "推导 · 第一步" },
            ),
            demo(
              "js",
              `// 第二步 + 第三步
async orders(user, _, { dataSources, correlationId }) {
  try {
    console.log(\`[\${correlationId}] Resolving User.orders for userId: \${user.id}\`);
    const orders = await dataSources.orderDataSource.getOrdersByUserId(user.id);
    return orders ?? [];
  } catch (error) {
    console.error(\`[\${correlationId}] Error resolving User.orders:\`, error.message);
    throw new GraphQLError('Failed to fetch orders for user', {
      extensions: { code: ErrorCodes.SERVICE_ERROR, correlationId, originalError: error.message }
    });
  }
}`,
              { filename: "推导 · 第二、三步" },
            ),
          ],
        },
        {
          id: "rethrow-graphql-error",
          heading: "catch 里为什么要先判断 instanceof GraphQLError",
          headingEn: "Why the catch block must check instanceof GraphQLError first",
          lede: "这是本门考试贯穿三处的一个模式，值得单独理解。",
          ledeEn: "This pattern shows up in three places in this exam, so it is worth learning on its own.",
          body: (
            <>
              <p>
                <code>catch</code> 会接住 <strong>try 块里任何</strong>抛出的东西 ——
                包括<strong>你自己故意抛的那个结构化错误</strong>。
              </p>
              <p>
                想一个场景：<code>Query.orders</code> 里你先校验
                「userId 不能为空」，不合法就抛
                <code>GraphQLError(code: INVALID_INPUT)</code>。
                然后自己的 catch 接住它，重新包成
                <code>code: SERVICE_ERROR</code>。
              </p>
              <p>
                <strong>结果：客户端收到的是「服务器内部错误」，
                而实际上是「你的输入不合法」。</strong>
                这是完全错误的信号 —— 客户端会重试（以为是临时故障），
                而重试永远不会成功。
              </p>
              <p>
                所以模式是：<strong>catch 的第一行先问「这个错误已经是
                我精心构造过的了吗？」是就原样往上抛。</strong>
              </p>
              <p>
                <strong>这个模式在项目里的三处都需要</strong>：
                <code>Query.order</code>（抛 ORDER_NOT_FOUND）、
                <code>Query.orders</code>（抛 INVALID_INPUT）、
                <code>Mutation.createOrder</code>（抛 INVALID_INPUT）。
                <strong>最后那个就是埋雷 3</strong> ——
                starter 代码漏了这一行，测试直接失败。
              </p>
              <p>
                <code>User.orders</code> 里其实没有自己抛业务错误，
                所以这一行是防御性的。但<strong>统一写法</strong>比
                「哪里需要哪里写」更可靠，也更容易 review。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                A <code>catch</code> catches <strong>anything thrown inside the
                try block</strong> — including{" "}
                <strong>the structured error you threw on purpose</strong>.
              </p>
              <p>
                Picture this: inside <code>Query.orders</code> you first check
                that userId is not empty and throw{" "}
                <code>GraphQLError(code: INVALID_INPUT)</code> when it is. Then
                your own catch grabs that error and rewraps it as{" "}
                <code>code: SERVICE_ERROR</code>.
              </p>
              <p>
                <strong>Result: the client is told &ldquo;internal server
                error&rdquo; when the truth is &ldquo;your input was
                invalid&rdquo;.</strong> That is the wrong signal entirely — the
                client retries, thinking it hit a temporary glitch, and the retry
                can never succeed.
              </p>
              <p>
                So the pattern is: <strong>the first line of the catch asks
                &ldquo;is this error one I carefully built myself?&rdquo; and
                rethrows it untouched if it is.</strong>
              </p>
              <p>
                <strong>Three places in this project need the pattern</strong>:{" "}
                <code>Query.order</code> (throws ORDER_NOT_FOUND),{" "}
                <code>Query.orders</code> (throws INVALID_INPUT) and{" "}
                <code>Mutation.createOrder</code> (throws INVALID_INPUT).{" "}
                <strong>That last one is planted bug 3</strong> — the starter
                code is missing this line, and a test fails because of it.
              </p>
              <p>
                <code>User.orders</code> never throws a business error of its
                own, so the line is purely defensive there. But{" "}
                <strong>writing it the same way everywhere</strong> is more
                reliable than &ldquo;add it where it is needed&rdquo;, and easier
                to review.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `// ✗ 不判断：自己抛的 INVALID_INPUT 会被自己吞掉
try {
  if (!userId) throw new GraphQLError('userId is required', {
    extensions: { code: 'INVALID_INPUT', correlationId }
  });
  ...
} catch (error) {
  throw new GraphQLError('Failed to fetch orders', {
    extensions: { code: 'SERVICE_ERROR', correlationId }   // ← 变成 SERVICE_ERROR 了
  });
}

// ✓ 先放行已经结构化的错误
} catch (error) {
  if (error instanceof GraphQLError) throw error;
  throw new GraphQLError('Failed to fetch orders', { ... });
}`,
              { filename: "一行之差" },
            ),
          ],
        },
        {
          id: "final",
          heading: "完整答案",
          headingEn: "The full answer",
          lede: "审计时实测：这样写之后两个相关测试通过。",
          ledeEn: "Measured during the audit: with this code the two related tests pass.",
          body: (
            <>
              <p>
                注意 <code>_</code> 那个位置是 <code>args</code> ——
                <code>User.orders</code> 在 schema 里没有参数，所以用不到。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Note that the <code>_</code> slot is where{" "}
                <code>args</code> goes — <code>User.orders</code> takes no
                arguments in the schema, so nothing there is needed.
              </p>
            </>
          ),
          code: [
            real(
              "js",
              `async orders(user, _, { dataSources, loaders, correlationId }) {
  try {
    console.log(\`[\${correlationId}] Resolving User.orders for userId: \${user.id}\`);

    const orders = await dataSources.orderDataSource.getOrdersByUserId(user.id);

    // schema 说 [Order!]! -> 绝不返回 null
    return orders ?? [];
  } catch (error) {
    if (error instanceof GraphQLError) throw error;

    console.error(\`[\${correlationId}] Error resolving User.orders:\`, error.message);
    throw new GraphQLError('Failed to fetch orders for user', {
      extensions: {
        code: ErrorCodes.SERVICE_ERROR,
        correlationId,
        originalError: error.message
      }
    });
  }
}`,
              {
                filename: "User.orders（参考答案，实测通过）",
                highlight: [8, 10],
              },
            ),
          ],
        },
        {
          id: "verify",
          heading: "怎么验证",
          headingEn: "How to check it",
          body: (
            <>
              <p>
                <strong>单元测试</strong>直接调 resolver 函数：
              </p>
              <p>
                <strong>但单元测试绕过了 federation 链路。</strong>
                想验证「Router 那条路也通」，用 <code>_entities</code> 查询 ——
                审计时实测输出如下，两个订单都拿到了：
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>The unit tests</strong> call the resolver function
                directly:
              </p>
              <p>
                <strong>But a unit test bypasses the federation path.</strong> To
                check that the Router&rsquo;s route works as well, use an{" "}
                <code>_entities</code> query — here is what the audit actually
                measured, with both orders coming back:
              </p>
            </>
          ),
          code: [
            real(
              "js",
              `describe('User.orders resolver', () => {
  it('should return orders for a user', async () => {
    const user = { id: '123' };
    const orders = await resolvers.User.orders(user, {}, context);

    expect(orders).toBeDefined();
    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBeGreaterThan(0);
    expect(orders[0]).toHaveProperty('id');
    expect(orders[0]).toHaveProperty('userId', '123');
  });

  it('should return empty array for user with no orders', async () => {
    const user = { id: '999' };
    const orders = await resolvers.User.orders(user, {}, context);
    expect(orders.length).toBe(0);
  });
});`,
              {
                filename: "__tests__/resolvers.test.js（两个相关测试）",
                sourceFile:
                  "graphql-federation-practice/node-subgraph/__tests__/resolvers.test.js",
              },
            ),
            real(
              "text",
              `# 用 _entities 走一遍 federation 链路（审计实测输出）
query($r:[_Any!]!){ _entities(representations:$r){ ... on User { id orders { id status } } } }
variables: { "r": [{ "__typename": "User", "id": "123" }] }

→ {"_entities":[{"id":"123","orders":[
     {"id":"order-456","status":"SHIPPED"},
     {"id":"order-457","status":"DELIVERED"}]}]}
   errors: []`,
              { filename: "federation 链路验证" },
            ),
          ],
        },
      ],
      exercises: [
        {
          kind: "fill-blank",
          id: "g-t1-blank",
          title: "补全 User.orders",
          level: 2,
          prompt: (
            <p>
              四个空。第 2 个是数据源上的<strong>真实方法名</strong>，
              第 4 个是那行最容易漏的防御。
            </p>
          ),
          language: "js",
          filename: "src/resolvers/orderResolvers.js",
          sourceFile:
            "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js",
          template: `async orders(user, _, { dataSources, loaders, correlationId }) {
  try {
    console.log(\`[\${correlationId}] Resolving User.orders for userId: \${user.___1___}\`);

    const orders = await dataSources.orderDataSource.___2___(user.id);

    return orders ___3___ [];
  } catch (error) {
    if (error ___4___ GraphQLError) throw error;

    console.error(\`[\${correlationId}] Error:\`, error.message);
    throw new GraphQLError('Failed to fetch orders for user', {
      extensions: { code: ErrorCodes.SERVICE_ERROR, correlationId }
    });
  }
}`,
          blanks: [
            {
              n: 1,
              accept: ["id"],
              hint: "__resolveReference 返回了什么？parent 上只有那一个属性。",
              why: (
                <>
                  <code>id</code>。<code>__resolveReference</code> 返回的是
                  <code>{'{ id: user.id }'}</code>，所以 parent 上
                  <strong>只有 id</strong>。想用 <code>user.email</code>
                  会拿到 undefined。
                </>
              ),
              width: 4,
            },
            {
              n: 2,
              accept: ["getOrdersByUserId"],
              hint: "去 orderDataSource.js 核对真实方法名，别凭直觉写。",
              why: (
                <>
                  <code>getOrdersByUserId</code>。
                  <code>OrderDataSource</code> 上只有三个方法：
                  <code>getOrder</code>、<code>getOrdersByUserId</code>、
                  <code>createOrder</code>。
                  <br />
                  <code>getOrders</code>、<code>findByUserId</code>、
                  <code>getUserOrders</code> 都不存在 ——
                  这类「听起来很合理但不存在」的名字正是这个项目埋雷的手法。
                </>
              ),
              width: 20,
            },
            {
              n: 3,
              accept: ["??", "||"],
              hint: "schema 说这个字段是 [Order!]!。",
              why: (
                <>
                  <code>??</code>。<code>[Order!]!</code> 双重非空，
                  返回 null 会触发
                  <code>Cannot return null for non-nullable field</code>
                  并向上冒泡。
                  <br />
                  「没有订单」的正确表达是 <code>[]</code>。
                </>
              ),
              width: 4,
            },
            {
              n: 4,
              accept: ["instanceof"],
              hint: "怎么判断「这个错误已经是我构造过的结构化错误」？",
              why: (
                <>
                  <code>instanceof</code>。
                  <code>if (error instanceof GraphQLError) throw error;</code>
                  <br />
                  没有这一行，自己抛的
                  <code>INVALID_INPUT</code> / <code>ORDER_NOT_FOUND</code>
                  会被自己的 catch 重新包成 <code>SERVICE_ERROR</code>，
                  客户端收到完全错误的信号。
                  <br />
                  <strong>这正是项目里埋雷 3 的病因。</strong>
                </>
              ),
              width: 12,
            },
          ],
        },
        {
          kind: "code-completion",
          id: "g-t1-write",
          title: "不看答案，自己写出 User.orders",
          level: 3,
          prompt: (
            <p>
              按 TODO 的三条要求写完整实现。检查器会核对方法名、兜底、
              错误处理和 correlation id。
            </p>
          ),
          language: "js",
          filename: "src/resolvers/orderResolvers.js",
          sourceFile:
            "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js",
          starter: `// TODO: Implement orders resolver with proper error handling and correlation ID tracing
// schema: orders: [Order!]!   （双重非空）
// context: { dataSources: { orderDataSource, inventoryDataSource, shippingDataSource },
//            loaders: { shippingInfoLoader, orderLoader },
//            correlationId }
// OrderDataSource: getOrder(id) / getOrdersByUserId(userId) / createOrder(userId, items)

async orders(user, _, { dataSources, loaders, correlationId }) {

}`,
          requirements: [
            "用 user.id 去取该用户的订单",
            "调用数据源上真实存在的方法",
            "绝不返回 null 或 undefined（schema 是 [Order!]!）",
            "用 try/catch 包住，失败时抛 GraphQLError",
            "错误的 extensions 里带 code 和 correlationId",
            "已经是 GraphQLError 的错误要原样往上抛，不要重新包装",
            "日志里带上 correlationId",
          ],
          checks: [
            {
              label: "调用了 getOrdersByUserId（真实存在的方法）",
              must: "getOrdersByUserId\\s*\\(",
            },
            {
              label: "没有调用不存在的方法（getOrders / findByUser 等）",
              mustNot: "\\.(getOrders|findByUser|getUserOrders|getOrderById)\\s*\\(",
            },
            { label: "用了 user.id 作为参数", must: "user\\.id" },
            { label: "对 null/undefined 做了兜底（？？ [] 或 || []）", must: "(\\?\\?|\\|\\|)\\s*\\[\\s*\\]" },
            { label: "用 try/catch 包住", must: "try[\\s\\S]*catch" },
            { label: "抛了 GraphQLError", must: "throw new GraphQLError" },
            { label: "extensions 里带了 correlationId", must: "extensions[\\s\\S]{0,160}correlationId" },
            {
              label: "先放行已结构化的错误（instanceof GraphQLError）",
              must: "instanceof\\s+GraphQLError",
            },
            { label: "日志里用了 correlationId", must: "(console\\.(log|error))[\\s\\S]{0,60}correlationId" },
          ],
          hints: [
            "先问三个问题：这个用户的 id 从哪个参数拿？该调哪个数据源的哪个方法？schema 说这个字段能不能是 null？",
            "user.id 来自 __resolveReference 的返回值。方法名去 orderDataSource.js 核对（不是 getOrders）。schema 是 [Order!]! 所以要兜底成 []。外面套 try/catch，catch 里第一行先判断 error instanceof GraphQLError。",
            `try {
  打一条带 correlationId 的日志
  const orders = await 数据源.getOrdersByUserId(user.id)
  return orders 兜底成 []
} catch (error) {
  如果 error 已经是 GraphQLError 就原样抛出
  打错误日志
  抛一个新的 GraphQLError，extensions 里放 code 和 correlationId
}`,
            `const orders = await dataSources.orderDataSource.getOrdersByUserId(user.id);
return orders ?? [];
// catch 里：
if (error instanceof GraphQLError) throw error;
throw new GraphQLError('Failed to fetch orders for user', {
  extensions: { code: ErrorCodes.SERVICE_ERROR, correlationId, originalError: error.message }
});`,
          ],
          solution: real(
            "js",
            `async orders(user, _, { dataSources, loaders, correlationId }) {
  try {
    console.log(\`[\${correlationId}] Resolving User.orders for userId: \${user.id}\`);

    const orders = await dataSources.orderDataSource.getOrdersByUserId(user.id);

    // schema 说 [Order!]! -> 绝不返回 null
    return orders ?? [];
  } catch (error) {
    if (error instanceof GraphQLError) throw error;

    console.error(\`[\${correlationId}] Error resolving User.orders:\`, error.message);
    throw new GraphQLError('Failed to fetch orders for user', {
      extensions: {
        code: ErrorCodes.SERVICE_ERROR,
        correlationId,
        originalError: error.message
      }
    });
  }
}`,
            { filename: "参考答案（审计实测：相关测试通过）" },
          ),
        },
      ],
      mistakes: [
        {
          wrong: demo(
            "js",
            `// ✗ 用了 loader 而不是数据源
async orders(user, _, { loaders }) {
  return loaders.orderLoader.load(user.id);
}`,
          ),
          why: (
            <>
              <code>orderLoader</code> 是按 <strong>order id</strong>
              取单个订单的，不是按 user id 取列表。
              传 <code>&quot;123&quot;</code> 进去会去找
              <code>id === &quot;123&quot;</code> 的 order —— 找不到，返回 undefined。
              <br />
              <strong>loader 不是万能的</strong>，要看它 batch 函数里调的是什么。
              这里该用 <code>orderDataSource.getOrdersByUserId</code>。
            </>
          ),
          whyEn: (
            <>
              <code>orderLoader</code> fetches <strong>one order by order id</strong>. It
              does not fetch a list by user id. Passing <code>&quot;123&quot;</code> makes
              it look for the order whose <code>id === &quot;123&quot;</code> — there is
              none, so it returns undefined.
              <br />
              <strong>A loader only does what its batch function does.</strong> Here you
              need <code>orderDataSource.getOrdersByUserId</code>.
            </>
          ),
        },
        {
          wrong: demo(
            "js",
            `// ✗ 忘了兜底
async orders(user, _, { dataSources }) {
  return await dataSources.orderDataSource.getOrdersByUserId(user.id);
}`,
          ),
          why: (
            <>
              这个项目的数据源用 <code>filter</code> 实现，
              找不到返回 <code>[]</code>，所以<strong>恰好不会出问题</strong>。
              <br />
              但你不该依赖这个实现细节 —— schema 是 <code>[Order!]!</code>，
              而数据源随时可能换成 HTTP 调用（那时找不到可能返回
              <code>undefined</code> 或 <code>null</code>）。
              <strong>按 schema 的契约写，不按数据源的当前行为写。</strong>
            </>
          ),
          whyEn: (
            <>
              The data source in this project uses <code>filter</code>, so a miss returns
              <code>[]</code>. <strong>By luck, nothing breaks.</strong>
              <br />
              But you should not rely on that detail. The schema says{" "}
              <code>[Order!]!</code>, and the data source could become an HTTP call at any
              time — then a miss might return <code>undefined</code> or{" "}
              <code>null</code>.{" "}
              <strong>
                Write to the contract in the schema, not to how the data source behaves
                today.
              </strong>
            </>
          ),
        },
      ],
      transfer: [
        { signal: "entity 上的字段 resolver", signalEn: "A field resolver on an entity", reachFor: "数据来自 parent 里 @key 声明的那个字段", reachForEn: "The data comes from the field named in @key, read off parent" },
        { signal: "TODO 说 proper error handling", signalEn: "A TODO says proper error handling", reachFor: "try/catch + GraphQLError + extensions.code", reachForEn: "try/catch plus GraphQLError plus extensions.code" },
        { signal: "TODO 说 correlation ID tracing", signalEn: "A TODO says correlation ID tracing", reachFor: "日志和 error extensions 都带上它", reachForEn: "Put it in the log line and in the error extensions" },
        { signal: "字段是 [T!]!", signalEn: "The field is [T!]!", reachFor: "?? [] 兜底，按 schema 契约而非数据源行为", reachForEn: "Fall back with ?? []; follow the schema contract, not the data source behaviour" },
        { signal: "catch 里要重新包装错误", signalEn: "The catch block wraps errors into a new one", reachFor: "先 if (error instanceof GraphQLError) throw error", reachForEn: "Start with if (error instanceof GraphQLError) throw error" },
      ],
      recap: [
        "user.id 来自 __resolveReference 的返回值，parent 上只有这一个属性。",
        "方法名是 getOrdersByUserId —— 去数据源核对，别凭直觉。",
        "[Order!]! 决定必须 ?? [] 兜底，按 schema 契约写而不是按数据源当前行为。",
        "catch 第一行先放行已结构化的 GraphQLError，否则会把业务错误降级成系统错误。",
        "单元测试直接调 resolver；想验 federation 链路要用 _entities 查询。",
      ],
      recapEn: [
        "user.id comes from what __resolveReference returned; it is the only property on parent.",
        "The method name is getOrdersByUserId. Check it against the data source instead of guessing.",
        "[Order!]! means you must fall back with ?? []. Write to the schema contract, not to how the data source behaves today.",
        "The first line of catch must let an existing GraphQLError through, otherwise a business error is turned into a system error.",
        "Unit tests call the resolver directly. To check the Federation path, use the _entities query.",
      ],
    },

    /* ---------- 3.3 ---------- */
    {
      id: "g-shipping-info",
      title: "TODO 2 · Order.shippingInfo",
      titleEn: "TODO 2 · Order.shippingInfo",
      blurb: "两行代码，但选错一行就答不到 N+1 这个考点。",
      blurbEn: "Two lines of code. Pick the wrong one and you miss the N+1 point entirely.",
      minutes: 11,
      objectives: [
        "独立写出 Order.shippingInfo",
        "解释为什么必须走 loader 而不是直接调数据源",
        "说清为什么这里要 ?? null 而不是 ?? []",
        "知道测试为什么抓不到「绕过 loader」这个错",
      ],
      objectivesEn: [
        "Write Order.shippingInfo without help",
        "Explain why you must go through the loader instead of calling the data source",
        "Explain why this one needs ?? null and not ?? []",
        "Know why the tests do not catch a solution that skips the loader",
      ],
      whyForAssessment:
        "TODO 原文点名了 DataLoader。这是全项目唯一明确指定实现手段的一处 —— 说明出题人就是要看你会不会用它。",
      whyForAssessmentEn:
        "The TODO names DataLoader directly. It is the only place in the project that says how to implement something, which means the exam wants to see whether you can use it.",
      sourceFiles: [
        {
          path: "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js",
          role: "Order.shippingInfo",
          edit: true,
        },
      ],
      concepts: [
        {
          id: "what-asked",
          heading: "这一问在要求什么",
          headingEn: "What this task asks for",
          body: (
            <>
              <p>
                TODO 原文：
                <em>Implement shipping info resolver <strong>using DataLoader
                to prevent N+1 queries</strong></em>。
              </p>
              <p>
                <strong>「using DataLoader」是硬性指定。</strong>
                四个 TODO 里只有这一个规定了实现手段 ——
                别的都只说「实现 + 错误处理」。
                这说明 N+1 就是这一问的全部考点。
              </p>
              <p>
                schema 那边：<code>shippingInfo: ShippingInfo</code>，
                <strong>可空</strong>。所以「这个订单没有物流信息」
                返回 <code>null</code> 是正确行为。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The TODO, word for word:{" "}
                <em>Implement shipping info resolver <strong>using DataLoader
                to prevent N+1 queries</strong></em>.
              </p>
              <p>
                <strong>&ldquo;using DataLoader&rdquo; is a hard
                requirement.</strong> Of the four TODOs this is the only one that
                dictates how to implement it — the others just say
                &ldquo;implement it, handle errors&rdquo;. Which tells you N+1 is
                the whole point of this question.
              </p>
              <p>
                From the schema: <code>shippingInfo: ShippingInfo</code>,{" "}
                <strong>nullable</strong>. So returning <code>null</code> for
                &ldquo;this order has no shipping info&rdquo; is the correct
                behaviour.
              </p>
            </>
          ),
        },
        {
          id: "think-first",
          heading: "先想再写",
          headingEn: "Think before you write",
          body: (
            <>
              <ThinkFirst questions={[
"输入是什么？—— parent，也就是那个 order 对象。所以 parent.id 是订单 id。",
                  "输出是什么？—— ShippingInfo 或 null（schema 说可空）。",
                  "该用 context 里的哪个东西？—— loaders.shippingInfoLoader，不是 dataSources。",
                  "loader 的方法叫什么？—— .load(key)，DataLoader 的标准接口。",
                  "找不到物流信息时返回什么？—— null，而不是 [] 或 {}。",
              ]} />
            </>
          ),
          bodyEn: (
            <>
              <ThinkFirst questions={[
                "What is the input? — parent, which is the order object. So parent.id is the order id.",
                "What is the output? — a ShippingInfo, or null (the schema says nullable).",
                "Which thing in context? — loaders.shippingInfoLoader, not dataSources.",
                "What is the loader's method called? — .load(key), DataLoader's standard interface.",
                "What do you return when there is no shipping info? — null, not [] and not {}.",
              ]} />
            </>
          ),
        },
        {
          id: "loader-vs-datasource",
          heading: "两种写法都能过测试，但只有一种答对了",
          headingEn: "Both versions pass the tests, but only one answers the question",
          lede: "这是本项目最典型的「测试抓不到」的地方。",
          ledeEn: "This is the clearest case in this project of something the tests cannot catch.",
          body: (
            <>
              <p>对比这两种写法：</p>
              <p>
                <strong>测试为什么抓不到区别？</strong>
                因为测试是<strong>直接调 resolver 函数</strong>的：
              </p>
              <p>
                它一次只调一个 order，所以「有没有合并」根本体现不出来。
                两种写法都返回正确的物流信息，两条测试都过。
              </p>
              <p>
                <strong>那怎么知道自己写对了？</strong>
                看日志。走 loader 的写法会打印
                <code>[DataLoader] Batching N shipping info requests</code>，
                <strong>N 个订单只打一行</strong>。
                直接调数据源的写法一行都不打。
              </p>
              <p>
                所以验证方式是：用<strong>真实的 GraphQL 查询</strong>
                （不是单元测试）查一个有多个订单的用户，
                然后数日志行数。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>Compare the two versions:</p>
              <p>
                <strong>Why can the tests not tell them apart?</strong> Because
                the tests <strong>call the resolver function directly</strong>:
              </p>
              <p>
                They pass one order at a time, so &ldquo;did anything get
                batched&rdquo; never shows up. Both versions return the right
                shipping info, and both tests go green.
              </p>
              <p>
                <strong>So how do you know you got it right?</strong> Read the
                logs. The loader version prints{" "}
                <code>[DataLoader] Batching N shipping info requests</code>, and{" "}
                <strong>N orders produce a single line</strong>. The version that
                calls the data source directly prints nothing at all.
              </p>
              <p>
                Which makes the check: run a{" "}
                <strong>real GraphQL query</strong> (not a unit test) against a
                user who has several orders, then count the log lines.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `// ✓ 走 loader —— 答到了 N+1 考点
async shippingInfo(parent, _, { loaders }) {
  return loaders.shippingInfoLoader.load(parent.id);
}

// ✗ 直接调数据源 —— 测试也能过，但每个 order 一次请求
async shippingInfo(parent, _, { dataSources }) {
  return dataSources.shippingDataSource.getShippingInfo(parent.id);
}`,
            ),
            real(
              "js",
              `it('should return shipping info for an order', async () => {
  const order = { id: 'order-456' };                    // ← 只有一个 order
  const shippingInfo = await resolvers.Order.shippingInfo(order, {}, context);

  expect(shippingInfo).toBeDefined();
  expect(shippingInfo).toHaveProperty('status');
  expect(shippingInfo).toHaveProperty('trackingNumber');
});

it('should return null for order without shipping info', async () => {
  const order = { id: 'order-999' };
  const shippingInfo = await resolvers.Order.shippingInfo(order, {}, context);
  expect(shippingInfo).toBeNull();                      // ← 注意是 toBeNull
});`,
              {
                filename: "两个相关测试",
                sourceFile:
                  "graphql-federation-practice/node-subgraph/__tests__/resolvers.test.js",
                highlight: [2, 12],
              },
            ),
          ],
        },
        {
          id: "null-not-undefined",
          heading: "为什么必须显式 ?? null",
          headingEn: "Why you must write ?? null explicitly",
          lede: "第二个测试用的是 toBeNull()，不是 toBeUndefined()。",
          ledeEn: "The second test uses toBeNull(), not toBeUndefined().",
          body: (
            <>
              <p>
                <code>ShippingDataSource.getShippingInfo(&apos;order-999&apos;)</code>
                的实现是查一个对象字面量，找不到时
                <code>return shippingData[orderId] || null</code> ——
                它<strong>已经返回 null 了</strong>。
              </p>
              <p>
                所以严格说 <code>?? null</code> 是多余的。
                <strong>但还是要写</strong>，理由和上一节一样：
              </p>
              <ul>
                <li>
                  测试断言的是 <code>toBeNull()</code>。
                  <strong><code>undefined</code> 不等于 <code>null</code></strong>，
                  这条断言会失败。
                </li>
                <li>
                  DataLoader 的 batch 函数如果返回的数组某个位置是
                  <code>undefined</code>（比如未来数据源换实现），
                  <code>load()</code> 就会 resolve 成 undefined。
                  显式兜底能挡住这种情况。
                </li>
              </ul>
              <p>
                <strong>习惯：可空字段显式 <code>?? null</code>，
                非空列表显式 <code>?? []</code>。</strong>
                两行都写，不依赖下游实现细节。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>ShippingDataSource.getShippingInfo(&apos;order-999&apos;)</code>{" "}
                looks up an object literal and, on a miss, does{" "}
                <code>return shippingData[orderId] || null</code> — so it{" "}
                <strong>already returns null</strong>.
              </p>
              <p>
                Strictly speaking that makes <code>?? null</code> redundant.{" "}
                <strong>Write it anyway</strong>, for the same reasons as the
                last lesson:
              </p>
              <ul>
                <li>
                  The test asserts <code>toBeNull()</code>.{" "}
                  <strong><code>undefined</code> is not <code>null</code></strong>,
                  so that assertion would fail.
                </li>
                <li>
                  If a DataLoader batch function ever returns{" "}
                  <code>undefined</code> at some position (say the data source
                  changes implementation later), <code>load()</code> resolves to
                  undefined. An explicit fallback blocks that.
                </li>
              </ul>
              <p>
                <strong>Make it a habit: nullable fields get an explicit{" "}
                <code>?? null</code>, non-null lists get an explicit{" "}
                <code>?? []</code>.</strong> Write both lines and stop depending
                on what the layer below happens to do.
              </p>
            </>
          ),
        },
        {
          id: "final",
          heading: "完整答案",
          headingEn: "The full answer",
          body: (
            <>
              <p>
                加上 TODO 没明说但一致的错误处理（和另外三个 resolver 保持同样的结构）：
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                With the error handling the TODO does not spell out but
                consistency wants — the same structure as the other three
                resolvers:
              </p>
            </>
          ),
          code: [
            real(
              "js",
              `async shippingInfo(parent, _, { dataSources, loaders, correlationId }) {
  try {
    // 通过 loader 批量，是这个字段防 N+1 的关键
    const shippingInfo = await loaders.shippingInfoLoader.load(parent.id);

    // ShippingInfo 在 schema 里可空 -> null 是合法答案
    return shippingInfo ?? null;
  } catch (error) {
    if (error instanceof GraphQLError) throw error;

    console.error(\`[\${correlationId}] Error resolving Order.shippingInfo:\`, error.message);
    throw new GraphQLError('Failed to fetch shipping info', {
      extensions: {
        code: ErrorCodes.SERVICE_ERROR,
        correlationId,
        orderId: parent.id,
        originalError: error.message
      }
    });
  }
}`,
              {
                filename: "Order.shippingInfo（参考答案，实测通过）",
                highlight: [4, 7],
              },
            ),
          ],
        },
        {
          id: "verify-batching",
          heading: "验证合并真的发生了",
          headingEn: "Checking that the calls really were merged",
          body: (
            <>
              <p>
                用真实查询（不是单元测试），查一个有两个订单的用户：
              </p>
              <p>
                <strong>关键是数那行 <code>[DataLoader] Batching</code>。</strong>
                两个订单只出现<strong>一行</strong>且 <code>N=2</code>，
                说明合并生效。如果出现两行 <code>N=1</code>，
                说明两次 <code>load()</code> 不在同一个 tick 里
                （通常是因为你在 resolver 里加了不必要的 await 把它们错开了）。
                如果一行都没有，说明你根本没走 loader。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Use a real query, not a unit test, against a user who has two
                orders:
              </p>
              <p>
                <strong>The thing to count is that{" "}
                <code>[DataLoader] Batching</code> line.</strong> Two orders
                should produce <strong>one line</strong> with{" "}
                <code>N=2</code>, which means batching worked. Two lines with{" "}
                <code>N=1</code> mean the two <code>load()</code> calls did not
                land in the same tick (usually because an unnecessary await in
                your resolver pulled them apart). No line at all means you never
                went through the loader.
              </p>
            </>
          ),
          code: [
            real(
              "graphql",
              `{
  orders(userId: "123") {
    id
    status
    shippingInfo { status trackingNumber }
  }
}`,
              { filename: "验证用的查询" },
            ),
            real(
              "text",
              `# 期望的日志（一行，N=2）
[corr-...] Query.orders userId: 123
[DataLoader] Batching 2 shipping info requests

# 审计实测的返回（参考解法下）
{"orders":[
  {"id":"order-456","status":"SHIPPED",
   "shippingInfo":{"status":"IN_TRANSIT","trackingNumber":"TRACK123456"}},
  {"id":"order-457","status":"DELIVERED",
   "shippingInfo":{"status":"DELIVERED","trackingNumber":"TRACK123457"}}]}`,
              { filename: "合并生效的证据" },
            ),
          ],
        },
      ],
      exercises: [
        {
          kind: "fill-blank",
          id: "g-t2-blank",
          title: "补全 Order.shippingInfo",
          level: 2,
          prompt: (
            <p>
              三个空。第 1 个决定你答不答得到 N+1 考点，
              第 3 个决定第二条测试过不过。
            </p>
          ),
          language: "js",
          filename: "src/resolvers/orderResolvers.js",
          sourceFile:
            "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js",
          template: `async shippingInfo(parent, _, { dataSources, loaders, correlationId }) {
  try {
    const shippingInfo = await ___1___.shippingInfoLoader.load(parent.___2___);

    return shippingInfo ?? ___3___;
  } catch (error) {
    if (error instanceof GraphQLError) throw error;
    console.error(\`[\${correlationId}] Error:\`, error.message);
    throw new GraphQLError('Failed to fetch shipping info', {
      extensions: { code: ErrorCodes.SERVICE_ERROR, correlationId, orderId: parent.id }
    });
  }
}`,
          blanks: [
            {
              n: 1,
              accept: ["loaders"],
              hint: "TODO 原文点名了要用什么。context 里哪个键放着它？",
              why: (
                <>
                  <code>loaders</code>。TODO 原文写的是
                  <em>using DataLoader to prevent N+1 queries</em>。
                  <br />
                  写成 <code>dataSources.shippingDataSource.getShippingInfo(...)</code>
                  <strong>也能过两条测试</strong>（测试一次只调一个 order），
                  但那样 N+1 这个考点就没答到 —— 这一问的分主要在这里。
                </>
              ),
              width: 9,
            },
            {
              n: 2,
              accept: ["id"],
              hint: "parent 是那个 order 对象。loader 的 key 是什么？",
              why: (
                <>
                  <code>id</code>。<code>shippingInfoLoader</code> 的 batch 函数
                  调的是 <code>getShippingInfo(orderId)</code>，
                  所以 key 就是订单 id。
                  <br />
                  <code>parent</code> 是上一层返回的 order 对象，
                  它有 <code>id</code>、<code>userId</code>、
                  <code>status</code> 等属性。别传成 <code>parent.userId</code>。
                </>
              ),
              width: 4,
            },
            {
              n: 3,
              accept: ["null"],
              hint: "schema 说 ShippingInfo 可空；而测试断言的是 toBeNull()。",
              why: (
                <>
                  <code>null</code>。两个理由：
                  <br />
                  ① schema 里 <code>shippingInfo: ShippingInfo</code> 没有
                  <code>!</code>，可空。
                  <br />
                  ② 测试用的是 <code>expect(shippingInfo).toBeNull()</code> ——
                  <strong><code>undefined</code> 不等于 <code>null</code></strong>，
                  这条断言会失败。所以必须显式兜成 null。
                  <br />
                  写成 <code>[]</code> 或 <code>{"{}"}</code> 都会让测试挂。
                </>
              ),
              width: 6,
            },
          ],
        },
        {
          kind: "recognition",
          id: "g-t2-why-loader",
          title: "为什么不能直接调数据源",
          level: 1,
          prompt: (
            <p>
              <code>dataSources.shippingDataSource.getShippingInfo(parent.id)</code>{" "}
              能让两条测试都通过。为什么还是错的？
            </p>
          ),
          options: [
            { id: "a", label: "它会返回 undefined 而不是 null" },
            { id: "b", label: "TODO 原文明确要求用 DataLoader 防 N+1；查 N 个订单会产生 N 次数据源调用" },
            { id: "c", label: "shippingDataSource 不在 context 里" },
            { id: "d", label: "它是同步的，不能 await" },
          ],
          answer: ["b"],
          explain: (
            <>
              测试一次只调一个 order，所以<strong>抓不到</strong>这个区别。
              但 TODO 原文点名了 DataLoader，而查 100 个订单时
              直接调数据源会产生 100 次请求。
              <br />
              <strong>这是本项目「测试通过 ≠ 做对了」的第三个实例</strong>
              （前两个是三个假通过、以及 Java 那边全 return null 过 3/5）。
              <br />
              验证方式：数日志里 <code>[DataLoader] Batching</code> 的行数。
            </>
          ),
        },
      ],
      mistakes: [
        {
          wrong: demo(
            "js",
            `// ✗ 在 resolver 里手动 await 每一个，破坏了合并
async shippingInfo(parent, _, { loaders }) {
  await new Promise((r) => setTimeout(r, 0));       // 多余的一跳
  return loaders.shippingInfoLoader.load(parent.id);
}`,
          ),
          why: (
            <>
              DataLoader 靠「同一个 tick 里的 load 攒起来」实现合并。
              中间插一个 <code>await</code> 会把各个 order 的
              <code>load()</code> 推到<strong>不同的 tick</strong>，
              于是变成 N 次 batch，每次 N=1。
              <br />
              症状：日志出现多行 <code>Batching 1 ... requests</code>。
              <strong>合并没了，但测试还是过的。</strong>
            </>
          ),
          whyEn: (
            <>
              DataLoader merges calls by collecting every <code>load()</code> made in the
              same tick. An extra <code>await</code> in between pushes each order&apos;s{" "}
              <code>load()</code> into <strong>a different tick</strong>, so you get N
              batches of one instead of one batch of N.
              <br />
              What you see: several <code>Batching 1 ... requests</code> lines in the log.
              <strong>The merging is gone, but the tests still pass.</strong>
            </>
          ),
        },
        {
          wrong: demo(
            "js",
            `// ✗ 用错了 loader
async shippingInfo(parent, _, { loaders }) {
  return loaders.orderLoader.load(parent.id);
}`,
          ),
          why: (
            <>
              <code>orderLoader</code> 取的是 order，不是物流信息。
              这会返回那个 order 本身，
              然后 GraphQL 试图把它当 <code>ShippingInfo</code> 用 ——
              <code>status</code> 字段恰好都有（值是 SHIPPED 而不是 IN_TRANSIT），
              <code>trackingNumber</code> 是 undefined。
              <br />
              第一条测试会挂在
              <code>toHaveProperty(&apos;trackingNumber&apos;)</code> 上。
              <strong>context 里有两个 loader，看清名字。</strong>
            </>
          ),
          whyEn: (
            <>
              <code>orderLoader</code> returns an order, not shipping information. You get
              the order object back, and GraphQL then reads it as a{" "}
              <code>ShippingInfo</code>: <code>status</code> happens to exist (its value is
              SHIPPED, not IN_TRANSIT) and <code>trackingNumber</code> is undefined.
              <br />
              The first test fails on{" "}
              <code>toHaveProperty(&apos;trackingNumber&apos;)</code>.
              <strong>There are two loaders in context. Read the names carefully.</strong>
            </>
          ),
        },
      ],
      transfer: [
        { signal: "TODO 指定了实现手段", signalEn: "A TODO names the way to implement it", reachFor: "那个手段本身就是考点，别用别的方式绕过", reachForEn: "That way is the point being tested; do not work around it" },
        { signal: "列表里每项都要查关联数据", signalEn: "Every item in a list needs related data fetched", reachFor: "loader.load(parent.id)", reachForEn: "loader.load(parent.id)" },
        { signal: "可空字段", signalEn: "A nullable field", reachFor: "?? null，别让 undefined 漏出去", reachForEn: "?? null, so undefined never gets through" },
        { signal: "想确认 DataLoader 生效", signalEn: "You want to confirm DataLoader is working", reachFor: "数日志里 Batching 的行数和 N", reachForEn: "Count the Batching lines in the log against N" },
      ],
      recap: [
        "TODO 点名了 DataLoader —— 这是四个 TODO 里唯一指定实现手段的，考点就在这。",
        "走 loaders.shippingInfoLoader.load(parent.id)，不是 dataSources.shippingDataSource。",
        "两种写法都能过测试，因为测试一次只调一个 order —— 抓不到合并与否。",
        "可空字段要显式 ?? null，因为测试断言的是 toBeNull()，undefined 会挂。",
        "resolver 里别插多余的 await，会把 load() 推到不同 tick，合并失效。",
      ],
      recapEn: [
        "The TODO names DataLoader. It is the only one of the four TODOs that says how to implement it, and that is the point being tested.",
        "Use loaders.shippingInfoLoader.load(parent.id), not dataSources.shippingDataSource.",
        "Both versions pass, because each test calls only one order, so the tests cannot tell whether the calls were merged.",
        "A nullable field needs an explicit ?? null, because the test asserts toBeNull() and undefined fails it.",
        "Do not add an extra await in the resolver. It pushes load() into a different tick and the merging stops working.",
      ],
    },

    /* ---------- 3.4 ---------- */
    {
      id: "g-queries",
      title: "TODO 3 & 4 · Query.order 与 Query.orders",
      titleEn: "TODO 3 & 4 · Query.order and Query.orders",
      blurb: "一个用 loader、一个用数据源；一个可空、一个非空。放一起讲差别最清楚。",
      blurbEn: "One uses the loader, one uses the data source; one is nullable, one is not. Side by side the difference is clearest.",
      minutes: 14,
      objectives: [
        "独立写出两个 Query resolver",
        "说清为什么一个用 loader、一个用数据源",
        "写出「找不到」时的结构化错误",
        "知道 Query.order 没有测试意味着什么",
      ],
      objectivesEn: [
        "Write both Query resolvers without help",
        "Explain why one uses the loader and the other uses the data source",
        "Write a structured error for the not-found case",
        "Know what it means that Query.order has no test",
      ],
      whyForAssessment:
        "Query.orders 有两条测试。Query.order 一条测试都没有，但 TODO 明确要求实现 —— 这种「没测试但有要求」的地方最能区分认真读题的人。",
      whyForAssessmentEn:
        "Query.orders has two tests. Query.order has none, yet the TODO clearly asks for it. A required part with no test is what separates the people who read the task carefully.",
      sourceFiles: [
        {
          path: "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js",
          role: "Query.order 与 Query.orders",
          edit: true,
        },
      ],
      concepts: [
        {
          id: "two-todos",
          heading: "两个 TODO 的要求对比",
          headingEn: "The two TODOs side by side",
          body: (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th><code>Query.order</code></th>
                      <th><code>Query.orders</code></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>TODO 原文关键词</td>
                      <td>
                        <strong>using DataLoader</strong> with structured error
                        handling
                      </td>
                      <td>error handling and correlation ID logging</td>
                    </tr>
                    <tr>
                      <td>schema 返回类型</td>
                      <td>
                        <code>Order</code>（<strong>可空</strong>）
                      </td>
                      <td>
                        <code>[Order!]!</code>（<strong>双重非空</strong>）
                      </td>
                    </tr>
                    <tr>
                      <td>数据来源</td>
                      <td>
                        <code>loaders.orderLoader.load(id)</code>
                      </td>
                      <td>
                        <code>dataSources.orderDataSource.getOrdersByUserId(userId)</code>
                      </td>
                    </tr>
                    <tr>
                      <td>context 解构</td>
                      <td>
                        <code>{"{ dataSources, loaders, correlationId }"}</code>
                      </td>
                      <td>
                        <code>{"{ dataSources, correlationId }"}</code>
                        （<strong>没有 loaders</strong>）
                      </td>
                    </tr>
                    <tr>
                      <td>找不到时</td>
                      <td>抛 <code>ORDER_NOT_FOUND</code></td>
                      <td>返回 <code>[]</code></td>
                    </tr>
                    <tr>
                      <td>测试</td>
                      <td>❌ 一条都没有</td>
                      <td>✅ 2 条</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>注意 <code>Query.orders</code> 的签名里没有
                <code>loaders</code>。</strong>
                starter 代码就是这么写的 —— 这是出题人在提示
                「这个字段不用 loader」。<strong>参数签名本身就是提示。</strong>
              </p>
              <p>
                <strong>为什么 orders 不用 loader?</strong>
                因为 <code>orderLoader</code> 是按 <strong>order id</strong>
                批量取单个订单的。而这里要的是「某个 user 的所有订单」——
                key 不一样，用不上。想用 loader 就得再造一个
                <code>ordersByUserLoader</code>，而 <code>index.js</code>
                里没有它，你也不该改 <code>index.js</code>（PROVIDED）。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th><code>Query.order</code></th>
                      <th><code>Query.orders</code></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Key words in the TODO</td>
                      <td>
                        <strong>using DataLoader</strong> with structured error
                        handling
                      </td>
                      <td>error handling and correlation ID logging</td>
                    </tr>
                    <tr>
                      <td>Return type in the schema</td>
                      <td>
                        <code>Order</code> (<strong>nullable</strong>)
                      </td>
                      <td>
                        <code>[Order!]!</code>{" "}
                        (<strong>non-null twice over</strong>)
                      </td>
                    </tr>
                    <tr>
                      <td>Where the data comes from</td>
                      <td>
                        <code>loaders.orderLoader.load(id)</code>
                      </td>
                      <td>
                        <code>dataSources.orderDataSource.getOrdersByUserId(userId)</code>
                      </td>
                    </tr>
                    <tr>
                      <td>context destructuring</td>
                      <td>
                        <code>{"{ dataSources, loaders, correlationId }"}</code>
                      </td>
                      <td>
                        <code>{"{ dataSources, correlationId }"}</code>{" "}
                        (<strong>no loaders</strong>)
                      </td>
                    </tr>
                    <tr>
                      <td>When nothing is found</td>
                      <td>throws <code>ORDER_NOT_FOUND</code></td>
                      <td>returns <code>[]</code></td>
                    </tr>
                    <tr>
                      <td>Tests</td>
                      <td>❌ not a single one</td>
                      <td>✅ 2 of them</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>Notice that the signature of{" "}
                <code>Query.orders</code> has no{" "}
                <code>loaders</code> in it.</strong> That is how the starter code
                is written — the examiner hinting that this field does not use a
                loader. <strong>The parameter signature is itself a
                hint.</strong>
              </p>
              <p>
                <strong>Why does orders not use a loader?</strong> Because{" "}
                <code>orderLoader</code> batches single orders by{" "}
                <strong>order id</strong>, and what this field wants is
                &ldquo;every order belonging to one user&rdquo; — a different
                key, so it does not fit. Using a loader would mean building an{" "}
                <code>ordersByUserLoader</code>, and <code>index.js</code> has no
                such thing, and you should not be editing{" "}
                <code>index.js</code> anyway (PROVIDED).
              </p>
            </>
          ),
        },
        {
          id: "query-order",
          heading: "Query.order：用 loader + 找不到要抛错",
          headingEn: "Query.order: use the loader, and throw when nothing is found",
          body: (
            <>
              <p>
                <strong>为什么这里用 loader?</strong>
                这个字段本身只取一条，看起来不需要合并。
                但 loader 的<strong>另一个作用是同请求内缓存</strong> ——
                如果一次查询里多处引用同一个 order
                （比如 <code>{"{ a: order(id:\"1\") { ... } b: order(id:\"1\") { ... } }"}</code>），
                loader 只会真的取一次。而且 TODO 原文点名了它。
              </p>
              <p>
                <strong>找不到怎么办？</strong>
                schema 说 <code>order(id: ID!): Order</code> 是可空的，
                所以 <code>return null</code> 不违反 schema。
                但 TODO 要求 <em>structured error handling</em>，
                而 <code>ErrorCodes</code> 里恰好准备了一个
                <code>ORDER_NOT_FOUND</code> —— 这是明显的暗示。
              </p>
              <p>
                <strong>那个 <code>ErrorCodes</code> 常量表值得注意：</strong>
                四个 code 里有一个（<code>INVENTORY_ERROR</code>）
                在参考答案里没用到，
                <code>ORDER_NOT_FOUND</code> 只有这里用。
                <strong>准备好的常量就是在告诉你「这里该抛什么」。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>Why use a loader here?</strong> This field fetches a
                single row, so batching looks pointless. But a loader&rsquo;s{" "}
                <strong>other job is caching inside one request</strong> — if a
                single query references the same order in several places (say{" "}
                <code>{"{ a: order(id:\"1\") { ... } b: order(id:\"1\") { ... } }"}</code>),
                the loader only fetches once. And the TODO names it outright.
              </p>
              <p>
                <strong>What happens when nothing is found?</strong> The schema
                says <code>order(id: ID!): Order</code> is nullable, so{" "}
                <code>return null</code> breaks no rule. But the TODO asks for{" "}
                <em>structured error handling</em>, and <code>ErrorCodes</code>{" "}
                happens to have an <code>ORDER_NOT_FOUND</code> ready — a fairly
                loud hint.
              </p>
              <p>
                <strong>That <code>ErrorCodes</code> table repays a close
                read:</strong> one of its four codes
                (<code>INVENTORY_ERROR</code>) is never used in the reference
                answer, and <code>ORDER_NOT_FOUND</code> is used only here.{" "}
                <strong>A constant somebody prepared for you is telling you what
                to throw where.</strong>
              </p>
            </>
          ),
          code: [
            real(
              "js",
              `const ErrorCodes = {
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',   // ← Query.order 用
  INVALID_INPUT: 'INVALID_INPUT',       // ← Query.orders 和 createOrder 用
  INVENTORY_ERROR: 'INVENTORY_ERROR',   // ← 参考答案里没用到
  SERVICE_ERROR: 'SERVICE_ERROR'        // ← 兜底用
};`,
              {
                filename: "starter 里给好的错误码表",
                sourceFile:
                  "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js",
              },
            ),
            real(
              "js",
              `async order(_, { id }, { dataSources, loaders, correlationId }) {
  try {
    console.log(\`[\${correlationId}] Query.order id: \${id}\`);

    const order = await loaders.orderLoader.load(id);

    if (!order) {
      throw new GraphQLError(\`Order not found: \${id}\`, {
        extensions: {
          code: ErrorCodes.ORDER_NOT_FOUND,
          correlationId,
          orderId: id
        }
      });
    }

    return order;
  } catch (error) {
    if (error instanceof GraphQLError) throw error;   // ← 关键：放行上面那个

    console.error(\`[\${correlationId}] Error in Query.order:\`, error.message);
    throw new GraphQLError('Failed to fetch order', {
      extensions: {
        code: ErrorCodes.SERVICE_ERROR,
        correlationId,
        originalError: error.message
      }
    });
  }
}`,
              {
                filename: "Query.order（参考答案）",
                highlight: [5, 7, 19],
              },
            ),
          ],
        },
        {
          id: "why-rethrow-here",
          heading: "这里最能看出 instanceof 检查为什么必要",
          headingEn: "This is where the instanceof check clearly matters",
          lede: "同一个 try 块里既抛业务错误又要接系统错误 —— 不判断就必然出错。",
          ledeEn: "The same try block both throws a business error and catches system errors. Without the check it will always go wrong.",
          body: (
            <>
              <p>
                看 <code>Query.order</code> 的结构：
                <code>try</code> 块里<strong>自己抛了</strong>一个
                <code>ORDER_NOT_FOUND</code>。
                而同一个 <code>catch</code> 又要负责接住数据源可能抛的系统异常。
              </p>
              <p>
                <strong>如果 catch 里没有 instanceof 判断：</strong>
                你抛的 <code>ORDER_NOT_FOUND</code> 会被自己的 catch 接住，
                然后重新包成 <code>SERVICE_ERROR</code>。
                客户端查一个不存在的订单，收到的是「服务器内部错误」——
                它会重试，而重试永远不会成功。
              </p>
              <p>
                <strong>加上那一行之后：</strong>
                <code>ORDER_NOT_FOUND</code> 原样传出去，
                客户端知道「这个 id 不存在，别重试了」；
                而数据源真的挂了（比如网络超时）时，
                才会得到 <code>SERVICE_ERROR</code>。
                <strong>两种情况被正确区分了。</strong>
              </p>
              <p>
                审计时用 <code>order(id: &quot;order-999&quot;)</code>
                实测过，返回的 code 确实是 <code>ORDER_NOT_FOUND</code>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Look at the shape of <code>Query.order</code>: the{" "}
                <code>try</code> block <strong>throws an error itself</strong>, an{" "}
                <code>ORDER_NOT_FOUND</code>. And the same <code>catch</code> is
                also responsible for the system exceptions the data source might
                throw.
              </p>
              <p>
                <strong>Without the instanceof check in the catch:</strong> the{" "}
                <code>ORDER_NOT_FOUND</code> you threw is caught by your own
                catch and rewrapped as <code>SERVICE_ERROR</code>. A client
                asking for an order that does not exist is told
                &ldquo;internal server error&rdquo; — so it retries, and the
                retry can never succeed.
              </p>
              <p>
                <strong>With that one line added:</strong>{" "}
                <code>ORDER_NOT_FOUND</code> travels out untouched and the client
                learns &ldquo;this id does not exist, stop retrying&rdquo;; only
                when the data source genuinely fails (a network timeout, say) do
                you get a <code>SERVICE_ERROR</code>.{" "}
                <strong>The two cases are told apart correctly.</strong>
              </p>
              <p>
                The audit measured this with{" "}
                <code>order(id: &quot;order-999&quot;)</code>, and the code that
                came back really was <code>ORDER_NOT_FOUND</code>.
              </p>
            </>
          ),
        },
        {
          id: "query-orders",
          heading: "Query.orders：用数据源 + 校验参数",
          headingEn: "Query.orders: use the data source and validate the argument",
          body: (
            <>
              <p>
                和 <code>User.orders</code> 几乎一样，只有两处差别：
              </p>
              <ul>
                <li>
                  <strong>userId 来自 args 而不是 parent。</strong>
                  <code>async orders(_, {"{ userId }"}, ...)</code>——
                  第一个参数是 <code>_</code>（顶层 Query 没有有意义的 parent）。
                </li>
                <li>
                  <strong>要校验 userId。</strong>
                  schema 写的是 <code>userId: ID!</code>，
                  GraphQL 会保证它不是 null。
                  但<strong>空字符串 <code>&quot;&quot;</code> 能通过 schema 校验</strong>
                  （它是个合法的 ID 值），所以自己再挡一道更稳。
                  这也是 TODO 里 <em>error handling</em> 的一部分。
                </li>
              </ul>
              <p>
                返回类型是 <code>[Order!]!</code>，所以照样 <code>?? []</code>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Almost identical to <code>User.orders</code>, with two
                differences:
              </p>
              <ul>
                <li>
                  <strong>userId comes from args, not from parent.</strong>{" "}
                  <code>async orders(_, {"{ userId }"}, ...)</code> — the first
                  parameter is <code>_</code>, because a top-level Query has no
                  meaningful parent.
                </li>
                <li>
                  <strong>userId has to be validated.</strong> The schema says{" "}
                  <code>userId: ID!</code>, so GraphQL guarantees it is not null.
                  But <strong>an empty string <code>&quot;&quot;</code> passes
                  schema validation</strong> (it is a legal ID value), so a second
                  guard of your own is safer. This is part of the{" "}
                  <em>error handling</em> the TODO asks for.
                </li>
              </ul>
              <p>
                The return type is <code>[Order!]!</code>, so once again{" "}
                <code>?? []</code>.
              </p>
            </>
          ),
          code: [
            real(
              "js",
              `async orders(_, { userId }, { dataSources, correlationId }) {
  try {
    console.log(\`[\${correlationId}] Query.orders userId: \${userId}\`);

    if (!userId) {
      throw new GraphQLError('userId is required', {
        extensions: {
          code: ErrorCodes.INVALID_INPUT,
          correlationId
        }
      });
    }

    const orders = await dataSources.orderDataSource.getOrdersByUserId(userId);
    return orders ?? [];
  } catch (error) {
    if (error instanceof GraphQLError) throw error;

    console.error(\`[\${correlationId}] Error in Query.orders:\`, error.message);
    throw new GraphQLError('Failed to fetch orders', {
      extensions: {
        code: ErrorCodes.SERVICE_ERROR,
        correlationId,
        originalError: error.message
      }
    });
  }
}`,
              {
                filename: "Query.orders（参考答案，实测两条测试通过）",
                highlight: [1, 5, 15, 17],
              },
            ),
          ],
        },
        {
          id: "no-test-means",
          heading: "Query.order 没有测试意味着什么",
          headingEn: "What it means that Query.order has no test",
          body: (
            <>
              <p>
                十个测试里，<code>Query.order</code> 一条都没有。
                所以你完全不实现它，<code>npm test</code> 也是全绿。
              </p>
              <p>三种可能的处理方式，以及各自的后果：</p>
              <ol>
                <li>
                  <strong>不实现，留着 <code>return null</code>。</strong>
                  测试全绿。但代码里留着一个明晃晃的 TODO 注释，
                  人工 review 一眼就看到。
                </li>
                <li>
                  <strong>删掉 TODO 注释但还是 return null。</strong>
                  更糟 —— 这看起来像「我以为我做完了」，
                  比留着 TODO 更容易被判定为疏漏。
                </li>
                <li>
                  <strong>照 TODO 要求实现。</strong>
                  测试不会因此多绿一条，但 TODO 清空、
                  <code>ORDER_NOT_FOUND</code> 这个准备好的错误码被用上了。
                </li>
              </ol>
              <p>
                <strong>选 3。</strong>
                Online Assessment 通常是「自动测试 + 人工 review」双轨的。
                自动测试是及格线，人工 review 看的是
                「有没有做完、有没有理解设计意图」。
                <strong>一个没被测试覆盖但明确要求的 TODO，
                正是拉开差距的地方。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Of the ten tests, not one covers{" "}
                <code>Query.order</code>. So you can skip implementing it
                entirely and <code>npm test</code> is still all green.
              </p>
              <p>Three ways to handle that, and what each one costs:</p>
              <ol>
                <li>
                  <strong>Do not implement it, leave the{" "}
                  <code>return null</code>.</strong> All tests green. But a
                  glaring TODO comment stays in the code, and a human reviewer
                  spots it instantly.
                </li>
                <li>
                  <strong>Delete the TODO comment but still return null.</strong>{" "}
                  Worse — it reads as &ldquo;I thought I was done&rdquo;, which
                  looks more careless than leaving the TODO in place.
                </li>
                <li>
                  <strong>Implement what the TODO asks.</strong> No test turns
                  green because of it, but the TODO list is clear and that
                  prepared <code>ORDER_NOT_FOUND</code> code finally gets used.
                </li>
              </ol>
              <p>
                <strong>Pick 3.</strong> An online assessment usually runs on two
                tracks: automated tests plus a human review. The tests are the
                pass mark; the review asks whether you finished and whether you
                understood the design intent. <strong>A TODO that no test covers
                but the brief clearly requires is exactly where candidates pull
                ahead.</strong>
              </p>
            </>
          ),
        },
      ],
      exercises: [
        {
          kind: "fill-blank",
          id: "g-t34-blank",
          title: "补全两个 Query resolver",
          level: 2,
          prompt: (
            <p>
              四个空横跨两个 resolver。注意它们数据来源不同、兜底策略不同。
            </p>
          ),
          language: "js",
          filename: "src/resolvers/orderResolvers.js",
          sourceFile:
            "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js",
          template: `// schema: order(id: ID!): Order   （可空）
async order(_, { id }, { dataSources, loaders, correlationId }) {
  try {
    const order = await loaders.___1___.load(id);

    if (!order) {
      throw new GraphQLError(\`Order not found: \${id}\`, {
        extensions: { code: ErrorCodes.___2___, correlationId }
      });
    }
    return order;
  } catch (error) {
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError('Failed to fetch order', {
      extensions: { code: ErrorCodes.SERVICE_ERROR, correlationId }
    });
  }
}

// schema: orders(userId: ID!): [Order!]!   （双重非空）
async orders(_, { ___3___ }, { dataSources, correlationId }) {
  try {
    const orders = await dataSources.orderDataSource.getOrdersByUserId(userId);
    return orders ?? ___4___;
  } catch (error) {
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError('Failed to fetch orders', {
      extensions: { code: ErrorCodes.SERVICE_ERROR, correlationId }
    });
  }
}`,
          blanks: [
            {
              n: 1,
              accept: ["orderLoader"],
              hint: "TODO 说用 DataLoader。context.loaders 里有两个，选按 order id 取的那个。",
              why: (
                <>
                  <code>orderLoader</code>。它的 batch 函数调
                  <code>getOrder(id)</code>，正是按订单 id 取单条。
                  <br />
                  别选 <code>shippingInfoLoader</code> —— 那个取的是物流信息。
                </>
              ),
              width: 13,
            },
            {
              n: 2,
              accept: ["ORDER_NOT_FOUND"],
              hint: "starter 里给好的 ErrorCodes 表里，哪个是为这个场景准备的？",
              why: (
                <>
                  <code>ORDER_NOT_FOUND</code>。
                  <code>ErrorCodes</code> 表里准备好了它，而且
                  <strong>只有这一处会用到</strong>。
                  <br />
                  <strong>给好的常量就是在提示你该抛什么。</strong>
                  看到一个没用上的错误码，就该想「它是为哪个场景准备的」。
                </>
              ),
              width: 18,
            },
            {
              n: 3,
              accept: ["userId"],
              hint: "schema: orders(userId: ID!)。参数从哪个位置解构？",
              why: (
                <>
                  <code>userId</code>。它在 <strong>args</strong>（第二个参数）里，
                  因为 schema 声明的是 <code>orders(userId: ID!)</code>。
                  <br />
                  第一个参数是 <code>_</code> —— 顶层 Query 字段的 parent 没有意义。
                  <br />
                  对比 <code>User.orders</code>：那里 id 来自
                  <strong>parent</strong>，因为它是 User 上的字段。
                  <strong>同样一个「用户 id」，在两个 resolver 里来自不同参数。</strong>
                </>
              ),
              width: 8,
            },
            {
              n: 4,
              accept: ["[]"],
              hint: "schema 说 [Order!]!。「没有订单」怎么表达？",
              why: (
                <>
                  <code>[]</code>。双重非空 → 不能返回 null，
                  但空数组合法。
                  <br />
                  对比上面 <code>Query.order</code>：那个是可空的，
                  所以它可以（也确实）在找不到时走抛错的路。
                  <strong>同一个项目里两种兜底策略，依据全在 schema 的感叹号上。</strong>
                </>
              ),
              width: 5,
            },
          ],
        },
        {
          kind: "code-completion",
          id: "g-t34-write",
          title: "不看答案，自己写出两个 Query resolver",
          level: 3,
          prompt: (
            <p>
              两个函数一起写。注意它们的数据来源、兜底策略、
              context 解构都不一样。
            </p>
          ),
          language: "js",
          filename: "src/resolvers/orderResolvers.js",
          sourceFile:
            "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js",
          starter: `// schema:
//   order(id: ID!): Order              可空
//   orders(userId: ID!): [Order!]!     双重非空
// context: { dataSources: { orderDataSource, ... }, loaders: { orderLoader, shippingInfoLoader }, correlationId }
// ErrorCodes: ORDER_NOT_FOUND / INVALID_INPUT / INVENTORY_ERROR / SERVICE_ERROR

// TODO: Implement order query using DataLoader with structured error handling
async order(_, { id }, { dataSources, loaders, correlationId }) {

},

// TODO: Implement orders query with error handling and correlation ID logging
async orders(_, { userId }, { dataSources, correlationId }) {

}`,
          requirements: [
            "Query.order 用 orderLoader 取数据",
            "Query.order 找不到时抛带 ORDER_NOT_FOUND code 的 GraphQLError",
            "Query.orders 用 orderDataSource.getOrdersByUserId 取数据",
            "Query.orders 校验 userId，非法时抛 INVALID_INPUT",
            "Query.orders 绝不返回 null（schema 是 [Order!]!）",
            "两个都用 try/catch，catch 里先放行已有的 GraphQLError",
            "两个都在日志里带上 correlationId",
          ],
          checks: [
            { label: "Query.order 用了 orderLoader.load", must: "orderLoader\\s*\\.\\s*load" },
            { label: "抛了 ORDER_NOT_FOUND", must: "ORDER_NOT_FOUND" },
            { label: "Query.orders 用了 getOrdersByUserId", must: "getOrdersByUserId\\s*\\(" },
            { label: "Query.orders 校验了 userId", must: "if\\s*\\(\\s*!\\s*userId" },
            { label: "用了 INVALID_INPUT", must: "INVALID_INPUT" },
            { label: "非空列表兜底成 []", must: "(\\?\\?|\\|\\|)\\s*\\[\\s*\\]" },
            { label: "两处都放行了已结构化的错误", must: "instanceof\\s+GraphQLError[\\s\\S]*instanceof\\s+GraphQLError" },
            { label: "日志带了 correlationId", must: "console\\.(log|error)[\\s\\S]{0,60}correlationId" },
            { label: "Query.orders 没有误用 loader", mustNot: "orders\\s*\\([\\s\\S]{0,200}loaders\\.\\w+\\.load" },
          ],
          hints: [
            "先分清两个字段的差别：一个取单条（可空）、一个取列表（非空）。schema 的感叹号决定了它们「找不到时」的行为完全不同。",
            "Query.order 用 loaders.orderLoader.load(id)，找不到抛 ORDER_NOT_FOUND。Query.orders 用 dataSources.orderDataSource.getOrdersByUserId(userId)，兜底成 []。两个都要 try/catch 且 catch 第一行放行 GraphQLError。",
            `async order(_, { id }, ctx) {
  try {
    打日志
    const order = await loaders.orderLoader.load(id)
    if (没找到) throw 带 ORDER_NOT_FOUND 的 GraphQLError
    return order
  } catch (e) { 放行 GraphQLError；否则包成 SERVICE_ERROR }
}

async orders(_, { userId }, ctx) {
  try {
    打日志
    if (!userId) throw 带 INVALID_INPUT 的 GraphQLError
    return (await 数据源.getOrdersByUserId(userId)) ?? []
  } catch (e) { 同上 }
}`,
            `// Query.order
const order = await loaders.orderLoader.load(id);
if (!order) {
  throw new GraphQLError(\`Order not found: \${id}\`, {
    extensions: { code: ErrorCodes.ORDER_NOT_FOUND, correlationId, orderId: id }
  });
}
return order;

// Query.orders
if (!userId) {
  throw new GraphQLError('userId is required', {
    extensions: { code: ErrorCodes.INVALID_INPUT, correlationId }
  });
}
const orders = await dataSources.orderDataSource.getOrdersByUserId(userId);
return orders ?? [];`,
          ],
          solution: real(
            "js",
            `async order(_, { id }, { dataSources, loaders, correlationId }) {
  try {
    console.log(\`[\${correlationId}] Query.order id: \${id}\`);

    const order = await loaders.orderLoader.load(id);

    if (!order) {
      throw new GraphQLError(\`Order not found: \${id}\`, {
        extensions: {
          code: ErrorCodes.ORDER_NOT_FOUND,
          correlationId,
          orderId: id
        }
      });
    }

    return order;
  } catch (error) {
    if (error instanceof GraphQLError) throw error;

    console.error(\`[\${correlationId}] Error in Query.order:\`, error.message);
    throw new GraphQLError('Failed to fetch order', {
      extensions: {
        code: ErrorCodes.SERVICE_ERROR,
        correlationId,
        originalError: error.message
      }
    });
  }
},

async orders(_, { userId }, { dataSources, correlationId }) {
  try {
    console.log(\`[\${correlationId}] Query.orders userId: \${userId}\`);

    if (!userId) {
      throw new GraphQLError('userId is required', {
        extensions: {
          code: ErrorCodes.INVALID_INPUT,
          correlationId
        }
      });
    }

    const orders = await dataSources.orderDataSource.getOrdersByUserId(userId);
    return orders ?? [];
  } catch (error) {
    if (error instanceof GraphQLError) throw error;

    console.error(\`[\${correlationId}] Error in Query.orders:\`, error.message);
    throw new GraphQLError('Failed to fetch orders', {
      extensions: {
        code: ErrorCodes.SERVICE_ERROR,
        correlationId,
        originalError: error.message
      }
    });
  }
}`,
            {
              filename: "参考答案（审计实测：Query.orders 两条测试通过；Query.order 用 order-999 实测返回 ORDER_NOT_FOUND）",
              collapsible: true,
            },
          ),
        },
      ],
      mistakes: [
        {
          wrong: demo(
            "js",
            `// ✗ Query.orders 也去用 loader
async orders(_, { userId }, { loaders }) {
  return loaders.orderLoader.load(userId);
}`,
          ),
          why: (
            <>
              <code>orderLoader</code> 的 key 是 <strong>order id</strong>，
              不是 user id。传 <code>&quot;123&quot;</code> 进去会去找
              <code>id === &quot;123&quot;</code> 的订单 ——
              数据源里的 id 长得像 <code>order-456</code>，所以找不到，
              返回 <code>undefined</code>。
              <br />
              而且返回的是单个对象而不是数组，违反 <code>[Order!]!</code>。
              <br />
              <strong>提示其实在参数签名里</strong>：starter 给的
              <code>orders</code> 签名<strong>没有解构 loaders</strong>。
            </>
          ),
          whyEn: (
            <>
              The key of <code>orderLoader</code> is an <strong>order id</strong>, not a
              user id. Passing <code>&quot;123&quot;</code> makes it look for the order
              whose <code>id === &quot;123&quot;</code> — the ids in the data source look
              like <code>order-456</code>, so nothing matches and it returns{" "}
              <code>undefined</code>.
              <br />
              It also returns a single object instead of an array, which breaks{" "}
              <code>[Order!]!</code>.
              <br />
              <strong>The hint is in the argument list</strong>: the{" "}
              <code>orders</code> signature in the starter code{" "}
              <strong>does not destructure loaders</strong>.
            </>
          ),
        },
        {
          wrong: demo(
            "js",
            `// ✗ 找不到时返回 null（Query.order）
const order = await loaders.orderLoader.load(id);
return order ?? null;`,
          ),
          why: (
            <>
              这<strong>不违反 schema</strong>（<code>order</code> 是可空的），
              而且没有测试会挂。
              <br />
              但 TODO 要求 <em>structured error handling</em>，
              而 <code>ErrorCodes.ORDER_NOT_FOUND</code> 明摆着是为这里准备的。
              <strong>给好但没用上的常量，就是没做完的信号。</strong>
            </>
          ),
          whyEn: (
            <>
              This <strong>does not break the schema</strong> (<code>order</code> is
              nullable), and no test fails.
              <br />
              But the TODO asks for <em>structured error handling</em>, and{" "}
              <code>ErrorCodes.ORDER_NOT_FOUND</code> is clearly there for this spot.{" "}
              <strong>
                A constant that is given but never used means the work is not finished.
              </strong>
            </>
          ),
        },
      ],
      transfer: [
        { signal: "参数签名里没有解构某个东西", signalEn: "The argument list does not destructure something", reachFor: "那是提示：这个字段不需要它", reachForEn: "That is a hint: this field does not need it" },
        { signal: "starter 给了没用上的常量", signalEn: "The starter code defines a constant nothing uses", reachFor: "找它对应的场景，那里大概有个 TODO", reachForEn: "Find the case it belongs to; there is probably a TODO there" },
        { signal: "同一个 try 里既抛业务错又要接系统错", signalEn: "One try block both throws a business error and catches system errors", reachFor: "catch 第一行 instanceof 判断", reachForEn: "Put an instanceof check on the first line of catch" },
        { signal: "字段可空 vs 非空列表", signalEn: "A nullable field versus a non-null list", reachFor: "前者可以抛错/返 null，后者必须 ?? []", reachForEn: "The first may throw or return null; the second must use ?? []" },
        { signal: "某个 TODO 没有测试", signalEn: "A TODO has no test", reachFor: "照样实现 —— 人工 review 会看", reachForEn: "Implement it anyway; a person will read the code" },
      ],
      recap: [
        "Query.order 用 orderLoader（TODO 点名了），Query.orders 用数据源（signature 里没给 loaders）。",
        "Query.order 可空 → 找不到抛 ORDER_NOT_FOUND；Query.orders 双重非空 → 兜底 []。",
        "同一个 userId，在 User.orders 里来自 parent，在 Query.orders 里来自 args。",
        "catch 第一行的 instanceof 判断在 Query.order 里最关键 —— 同一个 try 里既抛业务错又接系统错。",
        "Query.order 没有测试但 TODO 明确要求 —— 实现它，这是拉开差距的地方。",
      ],
      recapEn: [
        "Query.order uses orderLoader (the TODO names it). Query.orders uses the data source (its signature does not receive loaders).",
        "Query.order is nullable, so throw ORDER_NOT_FOUND when nothing is found. Query.orders is non-null at both levels, so fall back to [].",
        "The same userId comes from parent inside User.orders and from args inside Query.orders.",
        "The instanceof check on the first line of catch matters most in Query.order, where one try block both throws a business error and catches system errors.",
        "Query.order has no test but the TODO clearly asks for it. Implement it; this is where answers differ.",
      ],
    },

    /* ---------- 3.5 ---------- */
    {
      id: "g-planted-bugs",
      title: "三处埋雷：怎么系统地找出来",
      titleEn: "The three planted bugs: how to find them systematically",
      blurb: "README 只说「有 integration issues」。这一节教你怎么把它们挖出来。",
      blurbEn: "The README only says there are integration issues. This lesson shows you how to find them.",
      minutes: 16,
      objectives: [
        "掌握一套「核对而非猜测」的排查流程",
        "独立找出并修复三处埋雷",
        "把 Mutation.createOrder 改到测试通过",
        "解释为什么这三个错误都「看起来很合理」",
      ],
      objectivesEn: [
        "Learn a debugging routine based on checking, not guessing",
        "Find and fix the three planted bugs on your own",
        "Get Mutation.createOrder to pass its tests",
        "Explain why all three bugs look reasonable at first",
      ],
      whyForAssessment:
        "三处埋雷各挂一个测试。而且它们的错法很典型 —— 名字对不上、签名对不上、错误被吞掉。这三类问题在任何后端代码里都会遇到。",
      whyForAssessmentEn:
        "Each planted bug fails one test. All three are common kinds of mistake: a name that does not match, a signature that does not match, and an error that gets swallowed. You meet these three in any backend code.",
      sourceFiles: [
        {
          path: "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js",
          role: "三处埋雷都在这里",
          edit: true,
        },
        {
          path: "graphql-federation-practice/node-subgraph/src/dataSources/orderDataSource.js",
          role: "核对方法名与签名的依据（PROVIDED，别改）",
        },
      ],
      concepts: [
        {
          id: "the-method",
          heading: "排查方法：三张对照表",
          headingEn: "The method: three reference tables",
          lede: "不要靠读代码「感觉哪里怪」。逐项核对。",
          ledeEn: "Do not read the code looking for something that feels off. Check item by item.",
          body: (
            <>
              <p>
                README 说有 integration issues，但不说在哪。
                系统的做法是<strong>核对三件事</strong>：
              </p>
              <ol>
                <li>
                  <strong>每一处 <code>context.xxx</code> 的键名</strong>，
                  对照 <code>index.js</code> 里 context 函数的 return。
                </li>
                <li>
                  <strong>每一处数据源方法调用的名字和参数</strong>，
                  对照 <code>dataSources/orderDataSource.js</code> 里的类定义。
                </li>
                <li>
                  <strong>每一处 <code>throw</code> 和 <code>catch</code> 的配对</strong>，
                  看有没有「自己抛的错被自己吞掉」。
                </li>
              </ol>
              <p>
                这三项核对能找出全部三处埋雷。
                <strong>而且这套方法在任何项目里都管用</strong> ——
                「跨模块的名字和签名」是所有集成 bug 的高发区。
              </p>
              <p>
                更快的办法：<strong>先跑测试，看报错指向哪一行。</strong>
                三处埋雷各自挂一个测试，报错信息都很直接。
                但你得能看懂报错说的是什么。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The README says there are integration issues but not where they
                are. The systematic approach is to{" "}
                <strong>cross-check three things</strong>:
              </p>
              <ol>
                <li>
                  <strong>Every key name in a{" "}
                  <code>context.xxx</code> access</strong>, against what the
                  context function in <code>index.js</code> returns.
                </li>
                <li>
                  <strong>Every data source method call, name and
                  arguments</strong>, against the class definitions in{" "}
                  <code>dataSources/orderDataSource.js</code>.
                </li>
                <li>
                  <strong>Every pairing of <code>throw</code> and{" "}
                  <code>catch</code></strong>, looking for an error you threw
                  being swallowed by your own handler.
                </li>
              </ol>
              <p>
                Those three checks find all three planted bugs.{" "}
                <strong>And the method works in any project</strong> — names and
                signatures that cross module boundaries are where integration
                bugs live.
              </p>
              <p>
                The faster route: <strong>run the tests first and see which line
                the errors point at.</strong> Each planted bug takes down one
                test, and the messages are direct. But you have to be able to
                read what they are saying.
              </p>
            </>
          ),
        },
        {
          id: "bug-1",
          heading: "埋雷 1 · getOrderById 不存在",
          headingEn: "Planted bug 1 · getOrderById does not exist",
          body: (
            <>
              <p>
                <strong>报错：</strong>
                <code>TypeError: orderDataSource.getOrderById is not a function</code>
              </p>
              <p>
                <strong>位置：</strong><code>createOrderLoader</code> 的 batch 函数。
              </p>
              <p>
                <strong>核对：</strong><code>OrderDataSource</code> 上只有
                <code>getOrder</code>、<code>getOrdersByUserId</code>、
                <code>createOrder</code>。
              </p>
              <p>
                <strong>修法：</strong>把调用改成 <code>getOrder(id)</code>。
                <strong>不是</strong>给数据源加方法 ——
                那个文件是 PROVIDED。
              </p>
              <p>
                <strong>为什么容易犯：</strong>
                <code>getOrderById</code> 是个再自然不过的名字。
                很多项目就叫这个。<strong>靠直觉写就中招。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>The error:</strong>{" "}
                <code>TypeError: orderDataSource.getOrderById is not a function</code>
              </p>
              <p>
                <strong>Where:</strong> the batch function of{" "}
                <code>createOrderLoader</code>.
              </p>
              <p>
                <strong>Cross-check:</strong> <code>OrderDataSource</code> only
                has <code>getOrder</code>, <code>getOrdersByUserId</code> and{" "}
                <code>createOrder</code>.
              </p>
              <p>
                <strong>The fix:</strong> change the call to{" "}
                <code>getOrder(id)</code>. <strong>Not</strong> adding a method
                to the data source — that file is PROVIDED.
              </p>
              <p>
                <strong>Why it is easy to fall for:</strong>{" "}
                <code>getOrderById</code> is about as natural a name as there is.
                Plenty of projects call it exactly that.{" "}
                <strong>Write on instinct and you are caught.</strong>
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `// 前
orderIds.map(id => orderDataSource.getOrderById(id))

// 后
orderIds.map(id => orderDataSource.getOrder(id))`,
              { filename: "埋雷 1 的修复" },
            ),
          ],
        },
        {
          id: "bug-2",
          heading: "埋雷 2 · orderAPI 不存在，而且签名也错了",
          headingEn: "Planted bug 2 · orderAPI does not exist, and the signature is wrong too",
          lede: "这一处其实是三个错叠在一起。",
          ledeEn: "This one is really three mistakes stacked on top of each other.",
          body: (
            <>
              <p>
                <strong>报错：</strong>
                <code>Cannot read properties of undefined (reading &apos;createOrder&apos;)</code>
              </p>
              <p>
                <strong>原始代码：</strong>
                <code>await dataSources.orderAPI.createOrder({"{ userId, items }"})</code>
              </p>
              <p>三处问题：</p>
              <ol>
                <li>
                  <strong>键名错。</strong>context 里是
                  <code>orderDataSource</code>，没有 <code>orderAPI</code>。
                  所以 <code>dataSources.orderAPI</code> 是 <code>undefined</code>，
                  在它上面取 <code>.createOrder</code> 就抛了。
                </li>
                <li>
                  <strong>签名错。</strong>
                  真实签名是 <code>createOrder(userId, items)</code> ——
                  <strong>两个位置参数</strong>，不是一个对象。
                  传对象进去，<code>userId</code> 会是那个对象，
                  <code>items</code> 会是 undefined。
                </li>
                <li>
                  <strong>缺一步。</strong>
                  <code>OrderItemInput</code> 里没有 <code>price</code>，
                  而数据源要用 <code>item.price</code> 算总价。
                  <strong>resolver 必须先去查价格。</strong>
                </li>
              </ol>
              <p>
                第 3 点是最隐蔽的 —— 前两点报错很直接，
                第 3 点即使前两点修好了，也只会表现为
                <code>totalAmount</code> 是 NaN、
                <code>items[0].price</code> 是 undefined。
                测试用
                <code>expect(order.items[0].price).toBeDefined()</code>
                和 <code>expect(order.totalAmount).toBeGreaterThan(0)</code>
                两条断言抓它。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>The error:</strong>{" "}
                <code>Cannot read properties of undefined (reading &apos;createOrder&apos;)</code>
              </p>
              <p>
                <strong>The original code:</strong>{" "}
                <code>await dataSources.orderAPI.createOrder({"{ userId, items }"})</code>
              </p>
              <p>Three problems in one line:</p>
              <ol>
                <li>
                  <strong>Wrong key name.</strong> context has{" "}
                  <code>orderDataSource</code>, there is no{" "}
                  <code>orderAPI</code>. So <code>dataSources.orderAPI</code> is{" "}
                  <code>undefined</code>, and reading <code>.createOrder</code>{" "}
                  off it throws.
                </li>
                <li>
                  <strong>Wrong signature.</strong> The real signature is{" "}
                  <code>createOrder(userId, items)</code> —{" "}
                  <strong>two positional arguments</strong>, not one object. Pass
                  an object and <code>userId</code> becomes that object while{" "}
                  <code>items</code> becomes undefined.
                </li>
                <li>
                  <strong>A missing step.</strong> <code>OrderItemInput</code> has
                  no <code>price</code>, and the data source needs{" "}
                  <code>item.price</code> to compute the total.{" "}
                  <strong>The resolver has to look the price up first.</strong>
                </li>
              </ol>
              <p>
                Number 3 is the sneaky one — the first two throw loudly, while
                the third, even after the other two are fixed, only shows up as{" "}
                <code>totalAmount</code> being NaN and{" "}
                <code>items[0].price</code> being undefined. The tests catch it
                with two assertions,{" "}
                <code>expect(order.items[0].price).toBeDefined()</code> and{" "}
                <code>expect(order.totalAmount).toBeGreaterThan(0)</code>.
              </p>
            </>
          ),
          code: [
            real(
              "js",
              `// 数据源的真实签名与内部实现
async createOrder(userId, items) {          // ← 两个位置参数
  const totalAmount = items.reduce((sum, item) => {
    return sum + item.price * item.quantity;  // ← 需要 item.price
  }, 0);
  ...
}`,
              {
                filename: "核对依据",
                sourceFile:
                  "graphql-federation-practice/node-subgraph/src/dataSources/orderDataSource.js",
              },
            ),
            real(
              "js",
              `// 修好之后：先补 price，再用正确的键名和签名
const pricedItems = await Promise.all(
  items.map(async item => ({
    productId: item.productId,
    quantity: item.quantity,
    price: await dataSources.inventoryDataSource.getProductPrice(item.productId)
  }))
);

const order = await dataSources.orderDataSource.createOrder(userId, pricedItems);`,
              {
                filename: "埋雷 2 的修复",
                explanation:
                  "map 的回调是 async，所以必须外套 Promise.all —— 这是 Foundations 那门课讲过的固定套路。",
              },
            ),
          ],
        },
        {
          id: "bug-3",
          heading: "埋雷 3 · catch 把 INVALID_INPUT 吞成了 SERVICE_ERROR",
          headingEn: "Planted bug 3 · catch turns INVALID_INPUT into SERVICE_ERROR",
          lede: "这一处不报错，只是错误码不对。",
          ledeEn: "Nothing crashes here. Only the error code is wrong.",
          body: (
            <>
              <p>
                <strong>测试报错：</strong>
              </p>
              <p>
                <strong>病因：</strong>
                <code>try</code> 块里先抛了
                <code>GraphQLError(code: INVALID_INPUT)</code>，
                紧接着自己的 <code>catch</code> 把它接住，
                重新包成 <code>code: SERVICE_ERROR</code>。
              </p>
              <p>
                <strong>修法：</strong>
                <code>catch</code> 第一行加
                <code>if (error instanceof GraphQLError) throw error;</code>
              </p>
              <p>
                <strong>为什么这是最重要的一处：</strong>
                前两处是「打错字」级别的错误，报错很直接。
                这一处是<strong>设计缺陷</strong> ——
                代码能跑、不抛异常、只是给客户端的信号是错的。
                <strong>这类 bug 在生产环境里能藏几个月</strong>：
                客户端一直在重试「输入不合法」的请求，
                监控看到的是「服务错误率高」，
                实际是校验失败被误报成了系统故障。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>What the test reports:</strong>
              </p>
              <p>
                <strong>The cause:</strong> the <code>try</code> block throws{" "}
                <code>GraphQLError(code: INVALID_INPUT)</code>, and its own{" "}
                <code>catch</code> immediately grabs it and rewraps it as{" "}
                <code>code: SERVICE_ERROR</code>.
              </p>
              <p>
                <strong>The fix:</strong> make the first line of the{" "}
                <code>catch</code>{" "}
                <code>if (error instanceof GraphQLError) throw error;</code>
              </p>
              <p>
                <strong>Why this is the most important one of the three:</strong>{" "}
                the first two are typo-grade mistakes with direct error messages.
                This one is a <strong>design flaw</strong> — the code runs, throws
                nothing, and merely sends the client the wrong signal.{" "}
                <strong>This class of bug can hide in production for
                months</strong>: clients keep retrying requests that were invalid
                input, monitoring shows a high service error rate, and the real
                story is validation failures misreported as system faults.
              </p>
            </>
          ),
          code: [
            real(
              "bash",
              `● Order Resolvers › Error handling › should return structured error for validation failures

    expect(received).toBe(expected) // Object.is equality

    Expected: "INVALID_INPUT"
    Received: "SERVICE_ERROR"

      137 |       } catch (error) {
      138 |         expect(error.extensions).toBeDefined();
    > 139 |         expect(error.extensions.code).toBe('INVALID_INPUT');`,
              { filename: "本机实测的报错" },
            ),
            demo(
              "js",
              `// 前：自己抛的错被自己吞了
} catch (error) {
  console.error(\`[\${correlationId}] Error creating order:\`, error.message);
  throw new GraphQLError('Failed to create order', {
    extensions: { code: ErrorCodes.SERVICE_ERROR, correlationId, originalError: error.message }
  });
}

// 后：先放行已经结构化的错误
} catch (error) {
  if (error instanceof GraphQLError) throw error;

  console.error(\`[\${correlationId}] Error creating order:\`, error.message);
  throw new GraphQLError('Failed to create order', {
    extensions: { code: ErrorCodes.SERVICE_ERROR, correlationId, originalError: error.message }
  });
}`,
              { filename: "埋雷 3 的修复（一行）" },
            ),
          ],
        },
        {
          id: "final-mutation",
          heading: "Mutation.createOrder 的完整修复版",
          headingEn: "The fully fixed Mutation.createOrder",
          lede: "三处埋雷有两处在这个函数里。",
          ledeEn: "Two of the three planted bugs are inside this one function.",
          body: (
            <>
              <p>
                <code>Mutation.createOrder</code> 的注释写着
                「provided for reference - candidates focus on Query resolvers」，
                <strong>但它是坏的</strong>。
                「给你参考」不等于「它是对的」——
                这也是这个项目的一个小陷阱。
              </p>
              <p>审计实测：这样改完之后 10 个测试全部通过。</p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The comment on <code>Mutation.createOrder</code> reads
                &ldquo;provided for reference - candidates focus on Query
                resolvers&rdquo;, <strong>and yet it is broken</strong>.
                &ldquo;Here for reference&rdquo; does not mean &ldquo;this is
                correct&rdquo; — another small trap in this project.
              </p>
              <p>
                Measured in the audit: with these changes all ten tests pass.
              </p>
            </>
          ),
          code: [
            real(
              "js",
              `async createOrder(_, { userId, items }, { dataSources, correlationId }) {
  try {
    console.log(\`[\${correlationId}] Creating order for userId: \${userId}\`);

    if (!userId || !items || items.length === 0) {
      throw new GraphQLError('Invalid order input', {
        extensions: {
          code: ErrorCodes.INVALID_INPUT,
          correlationId
        }
      });
    }

    // OrderItemInput 只带 productId + quantity。
    // OrderDataSource.createOrder 内部要算 item.price * item.quantity，
    // 所以必须先去库存服务把 price 查出来。
    const pricedItems = await Promise.all(
      items.map(async item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: await dataSources.inventoryDataSource.getProductPrice(item.productId)
      }))
    );

    // FIX: context 里叫 orderDataSource（不是 orderAPI），
    // 签名是 createOrder(userId, items) 两个位置参数。
    const order = await dataSources.orderDataSource.createOrder(userId, pricedItems);
    console.log(\`[\${correlationId}] Order created: \${order.id}\`);

    return order;
  } catch (error) {
    // FIX: 已经是结构化 GraphQLError 的不要重新包装，
    // 否则 INVALID_INPUT 会以 SERVICE_ERROR 的形式到客户端。
    if (error instanceof GraphQLError) throw error;

    console.error(\`[\${correlationId}] Error creating order:\`, error.message);
    throw new GraphQLError('Failed to create order', {
      extensions: {
        code: ErrorCodes.SERVICE_ERROR,
        correlationId,
        originalError: error.message
      }
    });
  }
}`,
              {
                filename: "Mutation.createOrder（修复后，实测 10/10 通过）",
                highlight: [17, 18, 19, 20, 21, 22, 23, 26, 33],
                collapsible: true,
              },
            ),
            real(
              "bash",
              `$ npm test

  Order Resolvers
    User.orders resolver
      ✓ should return orders for a user (22 ms)
      ✓ should return empty array for user with no orders (12 ms)
    Order.shippingInfo resolver
      ✓ should return shipping info for an order (13 ms)
      ✓ should return null for order without shipping info (12 ms)
    Query.orders resolver
      ✓ should return orders for a specific user (12 ms)
      ✓ should return empty array for user with no orders (12 ms)
    Mutation.createOrder resolver
      ✓ should create a new order successfully (20 ms)
    DataLoader functionality
      ✓ should batch multiple order requests (12 ms)
      ✓ should batch multiple shipping info requests (13 ms)
    Error handling
      ✓ should return structured error for validation failures (1 ms)

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total`,
              { filename: "审计时的真实输出（参考解法）" },
            ),
          ],
        },
        {
          id: "why-plausible",
          heading: "为什么这三个错都「看起来很合理」",
          headingEn: "Why all three bugs look reasonable",
          body: (
            <>
              <p>
                出题人选这三处不是随机的。它们的共同点是
                <strong>「读代码时不会觉得奇怪」</strong>：
              </p>
              <ul>
                <li>
                  <code>getOrderById</code> —— 比 <code>getOrder</code>
                  更符合常见命名习惯。
                </li>
                <li>
                  <code>orderAPI</code> —— Apollo 老版本的 DataSource
                  就常叫 <code>xxxAPI</code>。
                </li>
                <li>
                  <code>createOrder({"{ userId, items }"})</code> ——
                  「参数打包成对象」是现代 JS 的流行风格。
                </li>
                <li>
                  catch 里统一包装错误 —— 这是<strong>好实践</strong>，
                  只是漏了一个例外情况。
                </li>
              </ul>
              <p>
                <strong>所以「读一遍觉得没问题」是不够的。</strong>
                必须核对。这也是为什么本门课反复强调
                「写代码前先抄一张方法名对照表」——
                那五分钟能省下半小时的困惑。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The examiner did not pick these three spots at random. What they
                share is that{" "}
                <strong>nothing looks odd while you are reading</strong>:
              </p>
              <ul>
                <li>
                  <code>getOrderById</code> — a closer fit to common naming
                  habits than <code>getOrder</code>.
                </li>
                <li>
                  <code>orderAPI</code> — older Apollo DataSources were often
                  named <code>xxxAPI</code>.
                </li>
                <li>
                  <code>createOrder({"{ userId, items }"})</code> — packing
                  arguments into an object is a popular modern JS style.
                </li>
                <li>
                  wrapping every error in the catch — that is{" "}
                  <strong>good practice</strong>, it just misses one exception.
                </li>
              </ul>
              <p>
                <strong>So &ldquo;I read it and it seemed fine&rdquo; is not
                enough.</strong> You have to cross-check. Which is why this course
                keeps repeating &ldquo;copy out a table of method names before you
                write code&rdquo; — those five minutes save half an hour of
                confusion.
              </p>
            </>
          ),
        },
      ],
      exercises: [
        {
          kind: "debug",
          id: "g-debug-orderapi",
          title: "Debug Lab · Cannot read properties of undefined",
          level: 3,
          prompt: (
            <p>
              <code>Mutation.createOrder</code> 的测试挂了。
              报错说在读一个 undefined 的属性。自己分诊。
            </p>
          ),
          errorOutput: `● Order Resolvers › Mutation.createOrder resolver › should create a new order successfully

    GraphQLError: Failed to create order

      91 |       } catch (error) {
      92 |         console.error(\`[\${correlationId}] Error creating order:\`, error.message);
    > 93 |         throw new GraphQLError('Failed to create order', {

# 往上翻，console.error 打出的原始错误是：
  console.error
    [test-correlation-id] Error creating order: Cannot read properties of
    undefined (reading 'createOrder')`,
          broken: demo(
            "js",
            `const order = await dataSources.orderAPI.createOrder({ userId, items });

// 参考：index.js 里 context 的 return
// return {
//   dataSources: { orderDataSource, inventoryDataSource, shippingDataSource },
//   loaders: { shippingInfoLoader, orderLoader },
//   correlationId
// };`,
            { filename: "src/resolvers/orderResolvers.js", highlight: [1] },
          ),
          classify: {
            options: [
              { id: "a", label: "异步错误 —— 少了 await" },
              { id: "b", label: "context 键名错误 —— dataSources 里没有 orderAPI 这个键" },
              { id: "c", label: "schema 与 resolver 不匹配" },
              { id: "d", label: "DataLoader 用法错误" },
            ],
            answer: "b",
          },
          locate: {
            question: "改成什么才对？（注意签名也有问题）",
            options: [
              { id: "a", label: "dataSources.orderDataSource.createOrder(userId, pricedItems)" },
              { id: "b", label: "dataSources.orderDataSource.createOrder({ userId, items })" },
              { id: "c", label: "dataSources.orderAPI.createOrder(userId, items)" },
              { id: "d", label: "loaders.orderLoader.load({ userId, items })" },
            ],
            answer: "a",
          },
          fixed: real(
            "js",
            `// 先补 price（OrderItemInput 里没有它，但数据源要用）
const pricedItems = await Promise.all(
  items.map(async item => ({
    productId: item.productId,
    quantity: item.quantity,
    price: await dataSources.inventoryDataSource.getProductPrice(item.productId)
  }))
);

// 键名 orderDataSource，签名 (userId, items) 两个位置参数
const order = await dataSources.orderDataSource.createOrder(userId, pricedItems);`,
            { filename: "改对之后（审计实测通过）" },
          ),
          rootCause: (
            <>
              <p>三个问题叠在一起：</p>
              <ol>
                <li>
                  <strong>键名。</strong><code>dataSources.orderAPI</code>
                  是 <code>undefined</code>，在它上面取
                  <code>.createOrder</code> 直接抛 TypeError。
                  真实键名是 <code>orderDataSource</code>。
                </li>
                <li>
                  <strong>签名。</strong>真实签名是
                  <code>createOrder(userId, items)</code> ——
                  两个位置参数。传一个对象进去，
                  数据源里的 <code>userId</code> 会变成那个对象，
                  <code>items</code> 是 undefined，
                  接着 <code>items.reduce</code> 又抛。
                </li>
                <li>
                  <strong>缺 price。</strong>
                  <code>OrderItemInput</code> 只有 productId 和 quantity，
                  而数据源要算 <code>item.price * item.quantity</code>。
                  <strong>选项 B 修了前两个但漏了这个</strong> ——
                  测试会挂在
                  <code>expect(order.items[0].price).toBeDefined()</code> 上。
                </li>
              </ol>
              <p>
                <strong>读这个报错的技巧：</strong>
                最外层的 <code>GraphQLError: Failed to create order</code>
                是<strong>你自己包装的</strong>，它掩盖了真实原因。
                <strong>往上翻 <code>console.error</code> 打出的
                原始 message</strong> —— 那才是病灶。
                <br />
                这也说明为什么错误包装时要保留
                <code>originalError: error.message</code>：
                否则真实原因就彻底丢了。
              </p>
            </>
          ),
          verify: "npm test   # should create a new order successfully 应该通过",
        },
        {
          kind: "debug",
          id: "g-debug-swallowed",
          title: "Debug Lab · 错误码不对（不报错的那种 bug）",
          level: 3,
          prompt: (
            <p>
              代码跑得通，没有异常。但测试说错误码不对。
              这是三处埋雷里最值得理解的一处。
            </p>
          ),
          errorOutput: `● Order Resolvers › Error handling › should return structured error for validation failures

    expect(received).toBe(expected) // Object.is equality

    Expected: "INVALID_INPUT"
    Received: "SERVICE_ERROR"

# 测试代码：
#   const input = { userId: '789', items: [] };     ← 空 items，应该被校验拦下
#   try {
#     await resolvers.Mutation.createOrder({}, input, context);
#     throw new Error('Should have thrown an error');
#   } catch (error) {
#     expect(error.extensions.code).toBe('INVALID_INPUT');
#   }`,
          broken: demo(
            "js",
            `try {
  if (!userId || !items || items.length === 0) {
    throw new GraphQLError('Invalid order input', {
      extensions: { code: ErrorCodes.INVALID_INPUT, correlationId }
    });
  }
  const order = await dataSources.orderDataSource.createOrder(userId, pricedItems);
  return order;
} catch (error) {
  console.error(\`[\${correlationId}] Error creating order:\`, error.message);
  throw new GraphQLError('Failed to create order', {
    extensions: { code: ErrorCodes.SERVICE_ERROR, correlationId }
  });
}`,
            { filename: "src/resolvers/orderResolvers.js", highlight: [3, 11] },
          ),
          classify: {
            options: [
              { id: "a", label: "校验逻辑写错了 —— 空数组没被识别" },
              { id: "b", label: "错误处理设计缺陷 —— 自己抛的结构化错误被自己的 catch 重新包装了" },
              { id: "c", label: "异步错误 —— throw 在 async 函数里不生效" },
              { id: "d", label: "测试写错了" },
            ],
            answer: "b",
          },
          locate: {
            question: "该在哪里加什么？",
            options: [
              { id: "a", label: "catch 块第一行加 if (error instanceof GraphQLError) throw error;" },
              { id: "b", label: "把校验移到 try 块外面" },
              { id: "c", label: "把 SERVICE_ERROR 改成 INVALID_INPUT" },
              { id: "d", label: "去掉整个 try/catch" },
            ],
            answer: "a",
          },
          fixed: real(
            "js",
            `} catch (error) {
  // 已经是结构化 GraphQLError 的原样放行，
  // 否则 INVALID_INPUT 会被降级成 SERVICE_ERROR
  if (error instanceof GraphQLError) throw error;

  console.error(\`[\${correlationId}] Error creating order:\`, error.message);
  throw new GraphQLError('Failed to create order', {
    extensions: {
      code: ErrorCodes.SERVICE_ERROR,
      correlationId,
      originalError: error.message
    }
  });
}`,
            { filename: "改对之后（一行）", highlight: [4] },
          ),
          rootCause: (
            <>
              <p>
                <code>catch</code> 会接住 <code>try</code> 块里
                <strong>任何</strong>抛出的东西 ——
                包括你自己精心构造的那个 <code>INVALID_INPUT</code>。
                然后它被重新包成 <code>SERVICE_ERROR</code>。
              </p>
              <p>
                <strong>为什么这是三处里最重要的一处？</strong>
                因为它<strong>不报错</strong>。代码正常执行、
                客户端也收到了一个 GraphQLError ——
                只是 code 是错的。
              </p>
              <p>
                后果在生产环境里很实际：<code>INVALID_INPUT</code>
                告诉客户端「你的请求有问题，改了再来」，
                <code>SERVICE_ERROR</code> 告诉客户端「服务器临时故障，
                请重试」。客户端会按后者的语义<strong>不断重试一个
                永远不会成功的请求</strong>，同时你的监控面板显示
                「服务错误率飙升」，而真实原因是有人一直传空数组。
              </p>
              <p>
                <strong>选项 B（把校验移到 try 外面）</strong>
                也能让这个测试过，但它是个更差的设计 ——
                校验和主逻辑分开，可读性下降，
                而且以后 try 里再抛别的业务错误还是会被吞。
                <strong>正解是在 catch 里做类型判断。</strong>
              </p>
              <p>
                这个模式值得记牢：
                <strong>凡是「catch 里统一包装错误」的地方，
                第一行都该先放行已经包装好的错误。</strong>
              </p>
            </>
          ),
          verify: "npm test   # 10 个测试应该全部通过",
        },
      ],
      transfer: [
        { signal: "README 说有「integration issues」", signalEn: "The README mentions integration issues", reachFor: "核对三张表：context 键名、方法名与签名、throw/catch 配对", reachForEn: "Check three tables: context key names, method names and signatures, and how throw pairs with catch" },
        { signal: "xxx is not a function", signalEn: "xxx is not a function", reachFor: "去被调对象的定义里核对方法名", reachForEn: "Open the definition of the object you called and check the method name" },
        { signal: "Cannot read properties of undefined", signalEn: "Cannot read properties of undefined", reachFor: "上一级路径写错了，逐段核对", reachForEn: "One step earlier in the path is wrong; check each part" },
        { signal: "自己包装的错误掩盖了真实原因", signalEn: "Your own wrapper hides the real cause", reachFor: "往上翻原始 message；包装时保留 originalError", reachForEn: "Look further up for the original message; keep originalError when wrapping" },
        { signal: "catch 里统一包装错误", signalEn: "A catch block wraps every error the same way", reachFor: "第一行先 if (error instanceof XxxError) throw error", reachForEn: "First line: if (error instanceof XxxError) throw error" },
      ],
      recap: [
        "三处埋雷：getOrderById 不存在、orderAPI 不存在且签名错且缺 price、catch 吞掉 INVALID_INPUT。",
        "排查靠核对三张表，不靠「读一遍感觉哪里怪」—— 这三个错都看起来很合理。",
        "只改 EDIT THIS 的文件；给数据源加方法是错的修法。",
        "自己包装错误时保留 originalError，否则真实原因彻底丢失。",
        "catch 里统一包装错误时，第一行必须先放行已结构化的错误。",
      ],
      recapEn: [
        "The three planted bugs: getOrderById does not exist; orderAPI does not exist, its signature is wrong and price is missing; catch swallows INVALID_INPUT.",
        "Find them by checking the three tables, not by reading once and looking for something odd. All three look reasonable.",
        "Only change files marked EDIT THIS. Adding a method to the data source is the wrong fix.",
        "Keep originalError when you wrap an error, otherwise the real cause is lost for good.",
        "When a catch block wraps every error, its first line must let already structured errors through.",
      ],
    },
  ],
};
