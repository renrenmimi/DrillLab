// Federation 考试 —— 模块 1（GraphQL 基础）与模块 2（Federation 心智模型）。
// 全部围绕 graphql-federation-practice/node-subgraph 的真实文件展开。

import { DataFlowDiagram } from "@/components/data-flow";
import type { Module } from "../types";
import { demo, real } from "../helpers";

const SCHEMA_FULL = `extend schema
  @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable", "@external"])

type User @key(fields: "id") {
  id: ID! @external
  orders: [Order!]!
}

type Order {
  id: ID!
  userId: ID!
  status: OrderStatus!
  totalAmount: Float!
  items: [OrderItem!]!
  createdAt: String!
  shippingInfo: ShippingInfo
}

type OrderItem {
  productId: ID!
  quantity: Int!
  price: Float!
}

type ShippingInfo {
  status: String!
  estimatedDelivery: String
  trackingNumber: String
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

type Query {
  order(id: ID!): Order
  orders(userId: ID!): [Order!]!
}

type Mutation {
  createOrder(userId: ID!, items: [OrderItemInput!]!): Order!
}

input OrderItemInput {
  productId: ID!
  quantity: Int!
}`;

const INDEX_JS = `import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import gql from 'graphql-tag';
import { resolvers, createShippingInfoLoader, createOrderLoader } from './resolvers/orderResolvers.js';
import { OrderDataSource, InventoryDataSource, ShippingDataSource } from './dataSources/orderDataSource.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const typeDefs = gql(readFileSync(join(__dirname, 'schema.graphql'), { encoding: 'utf-8' }));
const schema = buildSubgraphSchema([{ typeDefs, resolvers }]);

const server = new ApolloServer({
  schema,
  formatError: formattedError => {
    console.error('GraphQL Error:', {
      message: formattedError.message,
      code: formattedError.extensions?.code,
      path: formattedError.path,
      correlationId: formattedError.extensions?.correlationId
    });
    return formattedError;
  }
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000, host: '0.0.0.0' },
  context: async ({ req }) => {
    const correlationId = req.headers['x-correlation-id'] ||
      \`corr-\${Date.now()}-\${Math.random().toString(36).substring(2, 9)}\`;

    const orderDataSource = new OrderDataSource();
    const inventoryDataSource = new InventoryDataSource();
    const shippingDataSource = new ShippingDataSource();

    const shippingInfoLoader = createShippingInfoLoader(shippingDataSource);
    const orderLoader = createOrderLoader(orderDataSource);

    return {
      dataSources: { orderDataSource, inventoryDataSource, shippingDataSource },
      loaders: { shippingInfoLoader, orderLoader },
      correlationId
    };
  }
});

console.log(\`Subgraph ready at \${url}\`);
console.log(\`Federation SDL available at \${url}?query={_service{sdl}}\`);`;

const QUERY_FLOW = (
  <DataFlowDiagram
    title="一次 GraphQL 查询的执行流程"
    nodes={[
      { kind: "客户端", title: "发出 query" },
      { kind: "服务器", title: "按 schema 校验" },
      { kind: "执行器", title: "逐字段调 resolver" },
      { kind: "数据源", title: "DataSource" },
      { kind: "响应", title: "按查询形状组装" },
    ]}
    frames={[
      {
        active: 0,
        detail: ['{ orders(userId:"123") {\n  id status\n  shippingInfo { status }\n} }', undefined, undefined, undefined, undefined],
        msg: (
          <>
            客户端只发一个字符串。<strong>注意它自己决定了要哪些字段</strong> ——
            这就是 GraphQL 和 REST 最大的区别：形状由调用方说。
          </>
        ),
      },
      {
        active: 1,
        detail: [undefined, "Query.orders 存在吗？\nuserId 是 ID! 吗？\nOrder 上有 shippingInfo 吗？", undefined, undefined, undefined],
        msg: (
          <>
            服务器<strong>先拿 schema 校验</strong>：字段存不存在、参数类型对不对。
            这一步不碰任何数据。查询里写了一个 schema 里没有的字段，
            会在这里就被拒掉，报 <code>Cannot query field ... on type ...</code>。
          </>
        ),
      },
      {
        active: 2,
        detail: [undefined, "校验通过", "① Query.orders(_, {userId:\"123\"}, ctx)", undefined, undefined],
        msg: (
          <>
            <strong>从最外层字段开始</strong>，调 <code>Query.orders</code> 的
            resolver。它拿到四个参数，其中 <code>args</code> 里有
            <code>userId</code>，<code>context</code> 里有数据源。
          </>
        ),
      },
      {
        active: 3,
        detail: [undefined, undefined, "等 resolver 返回", "orderDataSource\n  .getOrdersByUserId(\"123\")\n→ [order-456, order-457]", undefined],
        msg: (
          <>
            resolver 去数据源取数。这一步可能是查数据库、
            也可能是发 HTTP 给别的微服务 —— 这个项目里是 mock 数据 + 10ms 假延迟。
          </>
        ),
      },
      {
        active: 2,
        detail: [undefined, undefined, "② Order.shippingInfo(order-456, …)\n③ Order.shippingInfo(order-457, …)", undefined, undefined],
        msg: (
          <>
            <strong>关键一步：</strong>拿到 2 个 order 之后，执行器
            <strong>对每一个 order 分别</strong>调 <code>Order.shippingInfo</code>。
            上一层的返回值成了这一层的 <code>parent</code> 参数。
            <br />
            <strong>N 个 order 就是 N 次调用 —— 这就是 N+1 问题的来源。</strong>
          </>
        ),
      },
      {
        active: 3,
        detail: [undefined, undefined, undefined, "shippingInfoLoader.load(id)\n→ DataLoader 把两次 load\n  合并成一次批量请求", undefined],
        msg: (
          <>
            所以这个字段用了 <strong>DataLoader</strong>：两次
            <code>load()</code> 被攒到同一个事件循环里，
            合并成<strong>一次</strong>批量调用。日志里会看到
            <code>[DataLoader] Batching 2 shipping info requests</code>。
          </>
        ),
      },
      {
        active: 4,
        detail: [undefined, undefined, undefined, undefined, '{"data":{"orders":[\n {"id":"order-456","status":"SHIPPED",\n  "shippingInfo":{"status":"IN_TRANSIT"}},\n ...\n]}}'],
        msg: (
          <>
            所有 resolver 都返回后，执行器<strong>按查询的形状</strong>
            把结果拼成 JSON。客户端要什么就得到什么，
            不多不少 —— 这是审计时进程内实测出来的真实输出。
          </>
        ),
      },
    ]}
  />
);

const ENTITY_FLOW = (
  <DataFlowDiagram
    title="Router 怎么把两个 subgraph 的数据缝在一起"
    direction="column"
    nodes={[
      { kind: "客户端", title: "查 user + 他的 orders" },
      { kind: "Router", title: "拆查询计划" },
      { kind: "subgraph A", title: "Accounts（不在本仓库）" },
      { kind: "Router", title: "拿到 User 的引用" },
      { kind: "subgraph B", title: "Orders（就是本项目）" },
      { kind: "Router", title: "合并成一个响应" },
    ]}
    frames={[
      {
        active: 0,
        detail: ['{ user(id:"123") {\n  name\n  orders { id status }\n} }'],
        msg: (
          <>
            客户端眼里只有<strong>一张图</strong>：
            <code>user</code> 上就是有 <code>orders</code> 字段。
            它完全不知道背后有两个服务。
          </>
        ),
      },
      {
        active: 1,
        detail: [undefined, "name → Accounts 拥有\norders → Orders 拥有"],
        msg: (
          <>
            Router 启动时收集过所有 subgraph 的 SDL，
            所以它知道<strong>哪个字段属于谁</strong>。
            于是它把这一个查询拆成一个「查询计划」：先问 Accounts，再问 Orders。
          </>
        ),
      },
      {
        active: 2,
        detail: [undefined, undefined, '{ user(id:"123") {\n  __typename id name\n} }'],
        msg: (
          <>
            第一步问 Accounts。注意它<strong>额外要了 <code>__typename</code> 和
            <code>id</code></strong> —— 因为 <code>User</code> 的
            <code>@key(fields: &quot;id&quot;)</code> 声明了「靠 id 认人」，
            Router 需要这两个东西才能去别处接着查。
          </>
        ),
      },
      {
        active: 3,
        detail: [undefined, '{ __typename: "User", id: "123" }'],
        msg: (
          <>
            Accounts 返回了 name，同时 Router 手上有了一个
            <strong>entity representation（实体引用）</strong>：
            <code>{'{ __typename: "User", id: "123" }'}</code>。
            这就是「同一个 User 在不同服务间的身份证」。
          </>
        ),
      },
      {
        active: 4,
        detail: [undefined, undefined, undefined, undefined, 'query($r:[_Any!]!){\n  _entities(representations:$r){\n    ... on User { orders { id status } }\n  }\n}'],
        msg: (
          <>
            <strong>Router 拿这个引用去问本项目的 subgraph。</strong>
            它调的是一个叫 <code>_entities</code> 的特殊字段
            （由 <code>buildSubgraphSchema</code> 自动生成，你不用写）。
            <br />
            本地流程是：<code>User.__resolveReference</code> 把引用变成本地对象 →
            <code>User.orders</code> 用它的 id 去查订单。
          </>
        ),
      },
      {
        active: 5,
        detail: [undefined, undefined, undefined, undefined, '{"_entities":[{"id":"123",\n "orders":[{"id":"order-456",...},\n           {"id":"order-457",...}]}]}', '{"data":{"user":{\n "name":"…",\n "orders":[…]}}}'],
        msg: (
          <>
            Router 把两段结果按 id 缝起来，返回给客户端一个完整的 user。
            <br />
            <strong>上面那段 <code>_entities</code> 的输出是审计时进程内真实跑出来的</strong>
            —— 也就是说，你写的 <code>User.orders</code>
            最终是在这条链路上被调用的。
          </>
        ),
      },
    ]}
  />
);

export const gqlBasics: Module = {
  id: "gql-basics",
  stage: "Federation · 第 1 部分",
  title: "GraphQL 基础",
  titleEn: "GraphQL basics",
  summary:
    "schema、type、field、query、resolver、非空与列表。全部用 node-subgraph 的真实 schema.graphql 当例子 —— 这份 schema 的每个细节后面都会变成考点。",
  summaryEn:
    "schema, type, field, query, resolver, non-null and lists. Every example is the real schema.graphql from node-subgraph, and every detail in that schema turns into an exam point later.",
  lessons: [
    /* ---------- 1.1 ---------- */
    {
      id: "g-what-is",
      title: "GraphQL 是什么：一份 schema 加一堆 resolver",
      titleEn: "What GraphQL is: one schema plus a set of resolvers",
      blurb: "读真实的 schema.graphql，把 type / field / Query / Mutation 一次讲清。",
      blurbEn: "Read the real schema.graphql and cover type / field / Query / Mutation in one pass.",
      minutes: 15,
      objectives: [
        "说清 schema 在 GraphQL 里的地位",
        "读懂 type / field / 标量 / enum / input 各是什么",
        "分清 Query 和 Mutation",
        "知道「客户端决定返回形状」意味着什么",
      ],
      objectivesEn: [
        "Explain what role the schema plays in GraphQL",
        "Read a schema and say what type / field / scalar / enum / input each mean",
        "Tell Query and Mutation apart",
        "Know what it means that the client decides the shape of the response",
      ],
      whyForAssessment:
        "这份 schema 决定了你的 resolver 必须返回什么形状。审计发现有两处细节（双重非空、input 里没有 price）直接决定实现对错 —— 不读 schema 就写 resolver，必错。",
      whyForAssessmentEn:
        "The schema decides what shape each resolver must return. Two details in it (a doubly non-null type, and an input with no price field) decide whether your code is right or wrong. If you write resolvers without reading the schema, you will get them wrong.",
      sourceFiles: [
        {
          path: "graphql-federation-practice/node-subgraph/src/schema.graphql",
          role: "整个 subgraph 的契约",
        },
      ],
      concepts: [
        {
          id: "two-halves",
          heading: "GraphQL 服务只有两半",
          headingEn: "A GraphQL service has only two halves",
          lede: "一半是「有什么」，一半是「怎么拿到」。",
          ledeEn: "One half says what exists. The other half says how to fetch it.",
          body: (
            <>
              <p>
                <strong>schema</strong> 声明「这个服务提供哪些类型、
                每个类型有哪些字段、字段是什么类型、能不能为空」。
                它是一份<strong>契约</strong>，用一种叫
                <strong>SDL（Schema Definition Language）</strong>的语法写。
              </p>
              <p>
                <strong>resolver</strong> 是一堆函数，负责「某个字段的值实际怎么算出来」。
                schema 说 <code>Order</code> 有个 <code>shippingInfo</code> 字段，
                resolver 负责真的去物流服务把它取回来。
              </p>
              <p>
                两半必须对得上。<strong>schema 里有的字段没有 resolver
                → 返回 null；resolver 的名字和 schema 里的字段名不一致 →
                这个 resolver 永远不会被调用，而且不报错。</strong>
                后者是 GraphQL 最难查的一类 bug，后面 Debug Lab 会专门练。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The <strong>schema</strong> declares what types this service
                offers, what fields each type has, what type each field is, and
                whether it can be null. It is a <strong>contract</strong>,
                written in a syntax called{" "}
                <strong>SDL (Schema Definition Language)</strong>.
              </p>
              <p>
                The <strong>resolvers</strong> are a pile of functions that say
                how each field&rsquo;s value actually gets produced. The schema
                says <code>Order</code> has a <code>shippingInfo</code> field; a
                resolver is what really goes to the shipping service and fetches
                it.
              </p>
              <p>
                The two halves have to line up. <strong>A field that exists in
                the schema with no resolver returns null; a resolver whose name
                does not match the schema field name is never called at all —
                and nothing complains.</strong> The second one is the hardest
                class of GraphQL bug to track down, and a later Debug Lab drills
                it.
              </p>
            </>
          ),
        },
        {
          id: "read-schema",
          heading: "读真实的 schema.graphql",
          headingEn: "Reading the real schema.graphql",
          lede: "先整体看一遍，再逐块拆。",
          ledeEn: "Read it once as a whole, then take it apart block by block.",
          body: (
            <>
              <p>
                这是 <code>node-subgraph/src/schema.graphql</code> 的全文，
                一个字没改。第 1–2 行的 <code>extend schema @link</code>
                是 Federation 专用的，下一个模块再讲，先跳过：
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                This is the whole of{" "}
                <code>node-subgraph/src/schema.graphql</code>, not one character
                changed. Lines 1&ndash;2, the{" "}
                <code>extend schema @link</code> part, are Federation-only — the
                next module covers them, so skip them for now:
              </p>
            </>
          ),
          code: [
            real("graphql", SCHEMA_FULL, {
              filename: "src/schema.graphql（全文）",
              filenameEn: "src/schema.graphql (full file)",
              sourceFile:
                "graphql-federation-practice/node-subgraph/src/schema.graphql",
              collapsible: true,
            }),
          ],
        },
        {
          id: "types-and-fields",
          heading: "type 和 field",
          headingEn: "type and field",
          body: (
            <>
              <p>
                <code>type Order {"{ ... }"}</code> 声明了一个
                <strong>对象类型</strong>，花括号里每一行是一个
                <strong>字段（field）</strong>，格式是
                <code>字段名： 类型</code>。
              </p>
              <p>字段的类型分三种：</p>
              <ul>
                <li>
                  <strong>标量（scalar）</strong> —— 内置的叶子类型，
                  不能再往下展开。GraphQL 内置 5 个：
                  <code>ID</code>、<code>String</code>、<code>Int</code>、
                  <code>Float</code>、<code>Boolean</code>。
                  这份 schema 里 <code>totalAmount: Float!</code>、
                  <code>quantity: Int!</code> 都是。
                  <br />
                  <strong>注意 <code>createdAt: String!</code></strong> ——
                  时间被存成了字符串，不是什么 DateTime 类型。
                  GraphQL 没有内置日期标量。
                </li>
                <li>
                  <strong>对象类型</strong> —— 可以继续往下查。
                  <code>items: [OrderItem!]!</code>、
                  <code>shippingInfo: ShippingInfo</code> 都是。
                </li>
                <li>
                  <strong>枚举（enum）</strong> ——
                  <code>status: OrderStatus!</code>，值只能是
                  <code>PENDING</code> / <code>PROCESSING</code> /
                  <code>SHIPPED</code> / <code>DELIVERED</code> /
                  <code>CANCELLED</code> 五个之一。
                  <strong>返回一个不在列表里的字符串会报错。</strong>
                </li>
              </ul>
              <p>
                <code>ID</code> 值得单说：它序列化成字符串，
                但语义是「这是个标识符，不要拿它做算术」。
                所以 <code>getOrdersByUserId(&quot;123&quot;)</code> 里那个 userId
                是字符串 <code>&quot;123&quot;</code> 而不是数字 123 ——
                这一点和 React 那门考试里 <code>Note.id</code> 是
                <code>number</code> 正好相反，别混。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>type Order {"{ ... }"}</code> declares an{" "}
                <strong>object type</strong>. Every line inside the braces is a{" "}
                <strong>field</strong>, written as <code>fieldName: Type</code>.
              </p>
              <p>Field types come in three kinds:</p>
              <ul>
                <li>
                  <strong>Scalars</strong> — the built-in leaf types, nothing to
                  expand further. GraphQL ships five: <code>ID</code>,{" "}
                  <code>String</code>, <code>Int</code>, <code>Float</code>,{" "}
                  <code>Boolean</code>. In this schema{" "}
                  <code>totalAmount: Float!</code> and{" "}
                  <code>quantity: Int!</code> are both scalars.
                  <br />
                  <strong>Look at <code>createdAt: String!</code></strong> — the
                  timestamp is stored as a string, not as some DateTime type.
                  GraphQL has no built-in date scalar.
                </li>
                <li>
                  <strong>Object types</strong> — you can keep querying
                  downward. <code>items: [OrderItem!]!</code> and{" "}
                  <code>shippingInfo: ShippingInfo</code> are both object types.
                </li>
                <li>
                  <strong>Enums</strong> — <code>status: OrderStatus!</code>,
                  where the value can only be one of <code>PENDING</code> /{" "}
                  <code>PROCESSING</code> / <code>SHIPPED</code> /{" "}
                  <code>DELIVERED</code> / <code>CANCELLED</code>.{" "}
                  <strong>Return a string that is not on that list and you get
                  an error.</strong>
                </li>
              </ul>
              <p>
                <code>ID</code> deserves its own note: it serialises to a
                string, but what it means is &ldquo;this is an identifier, do
                not do arithmetic on it&rdquo;. So the userId in{" "}
                <code>getOrdersByUserId(&quot;123&quot;)</code> is the string{" "}
                <code>&quot;123&quot;</code>, not the number 123 — the exact
                opposite of the React exam, where <code>Note.id</code> is a{" "}
                <code>number</code>. Do not mix the two up.
              </p>
            </>
          ),
        },
        {
          id: "query-mutation",
          heading: "Query 和 Mutation：两个特殊的入口类型",
          headingEn: "Query and Mutation: the two special entry types",
          body: (
            <>
              <p>
                <code>Query</code> 和 <code>Mutation</code> 是两个
                <strong>约定的入口类型</strong>。客户端只能从它们的字段开始查。
              </p>
              <ul>
                <li>
                  <strong><code>Query</code> = 读。</strong>
                  这份 schema 提供两个入口：
                  <code>order(id: ID!): Order</code>（按 id 取一条，
                  <strong>可空</strong> —— 找不到就返回 null）和
                  <code>orders(userId: ID!): [Order!]!</code>
                  （按用户取列表，<strong>不可空</strong>）。
                </li>
                <li>
                  <strong><code>Mutation</code> = 写。</strong>
                  这里只有 <code>createOrder</code>。
                  <strong>GraphQL 不强制你把写操作放 Mutation</strong>，
                  但这是所有人都遵守的约定 —— 而且 Mutation 的多个字段
                  是<strong>串行</strong>执行的，Query 的字段是并行的。
                </li>
              </ul>
              <p>
                圆括号里的是<strong>参数（argument）</strong>：
                <code>order(id: ID!)</code> 意思是「调这个字段必须给一个非空的 ID」。
                参数在 resolver 里通过第二个参数 <code>args</code> 拿到。
              </p>
              <p>
                <code>input OrderItemInput</code> 是<strong>输入类型</strong>。
                它和 <code>type</code> 的区别是：input 只能当参数用，
                字段只能是标量、enum 或别的 input，不能有 resolver。
                <strong>这个 input 后面会成为一个大坑</strong>，
                下一节专门讲。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>Query</code> and <code>Mutation</code> are two{" "}
                <strong>entry types fixed by convention</strong>. A client can
                only start from their fields.
              </p>
              <ul>
                <li>
                  <strong><code>Query</code> = read.</strong> This schema offers
                  two entries: <code>order(id: ID!): Order</code> (one order by
                  id, <strong>nullable</strong> — not found means null) and{" "}
                  <code>orders(userId: ID!): [Order!]!</code> (a list for one
                  user, <strong>not nullable</strong>).
                </li>
                <li>
                  <strong><code>Mutation</code> = write.</strong> There is only{" "}
                  <code>createOrder</code> here. <strong>GraphQL does not force
                  you to put writes under Mutation</strong>, but everybody
                  follows the convention — and the fields of one Mutation run{" "}
                  <strong>one after another</strong>, while Query fields run in
                  parallel.
                </li>
              </ul>
              <p>
                What sits inside the parentheses is an{" "}
                <strong>argument</strong>: <code>order(id: ID!)</code> means
                &ldquo;calling this field requires a non-null ID&rdquo;. A
                resolver reads arguments from its second parameter,{" "}
                <code>args</code>.
              </p>
              <p>
                <code>input OrderItemInput</code> is an{" "}
                <strong>input type</strong>. The difference from{" "}
                <code>type</code>: an input can only be used as an argument, its
                fields can only be scalars, enums or other inputs, and it has no
                resolvers. <strong>This one input becomes a big trap
                later</strong> — the next lesson is all about it.
              </p>
            </>
          ),
        },
        {
          id: "client-decides",
          heading: "客户端决定返回形状",
          headingEn: "The client decides the shape of the response",
          lede: "这是 GraphQL 和 REST 最本质的区别。",
          ledeEn: "This is the deepest difference between GraphQL and REST.",
          body: (
            <>
              <p>
                REST 里 <code>GET /api/orders/456</code> 返回什么字段，
                是服务端定的。GraphQL 里客户端自己写：
              </p>
              <p>
                这带来两个后果，都跟考试有关：
              </p>
              <ol>
                <li>
                  <strong>你的 resolver 可能根本不被调用。</strong>
                  客户端没查 <code>shippingInfo</code>，那个 resolver 就不执行 ——
                  GraphQL 是<strong>按需</strong>调用 resolver 的。
                </li>
                <li>
                  <strong>N+1 问题的根源。</strong>
                  客户端查了 100 个 order 的 shippingInfo，
                  执行器就会调 100 次 <code>Order.shippingInfo</code>。
                  客户端一句话，后端 100 次请求。
                  这就是为什么这个项目里要用 DataLoader。
                </li>
              </ol>
            </>
          ),
          bodyEn: (
            <>
              <p>
                In REST, the server decides which fields{" "}
                <code>GET /api/orders/456</code> returns. In GraphQL the client
                writes that itself:
              </p>
              <p>Two consequences, and both of them show up in the exam:</p>
              <ol>
                <li>
                  <strong>Your resolver may never run.</strong> The client did
                  not ask for <code>shippingInfo</code>, so that resolver is
                  never executed — GraphQL calls resolvers{" "}
                  <strong>on demand</strong>.
                </li>
                <li>
                  <strong>This is where N+1 comes from.</strong> Ask for the
                  shippingInfo of 100 orders and the executor calls{" "}
                  <code>Order.shippingInfo</code> 100 times. One sentence from
                  the client, 100 requests on the backend. That is why this
                  project needs DataLoader.
                </li>
              </ol>
            </>
          ),
          code: [
            real(
              "graphql",
              `# 只要 id 和 status —— 服务端不会去查物流
{
  orders(userId: "123") {
    id
    status
  }
}

# 要物流信息 —— 这时 Order.shippingInfo 的 resolver 才会被调用
{
  orders(userId: "123") {
    id
    status
    totalAmount
    shippingInfo {
      status
      trackingNumber
    }
  }
}`,
              {
                filename: "同一个入口，两种形状",
                filenameEn: "One entry point, two shapes",
                codeEn: `# Only id and status — the server never looks up shipping
{
  orders(userId: "123") {
    id
    status
  }
}

# Ask for shipping — only now does the Order.shippingInfo resolver run
{
  orders(userId: "123") {
    id
    status
    totalAmount
    shippingInfo {
      status
      trackingNumber
    }
  }
}`,
                explanation:
                  "第二个查询是审计时进程内真实执行过的，返回了 order-456（IN_TRANSIT / TRACK123456）和 order-457（DELIVERED / TRACK123457）。",
                explanationEn:
                  "The second query really ran in-process during the audit. It returned order-456 (IN_TRANSIT / TRACK123456) and order-457 (DELIVERED / TRACK123457).",
              },
            ),
          ],
        },
        {
          id: "execution-flow",
          heading: "一次查询的完整执行流程",
          headingEn: "The full execution flow of one query",
          body: (
            <>
              <p>
                把上面的知识串起来。下面这张图是第二个查询（带 shippingInfo 的那个）
                在服务端的完整旅程，七步：
              </p>
              {QUERY_FLOW}
            </>
          ),
          bodyEn: (
            <>
              <p>
                Now string all of it together. The diagram below is the full
                server-side journey of that second query (the one that asks for
                shippingInfo), in seven steps:
              </p>
              {QUERY_FLOW}
            </>
          ),
        },
      ],
      exercises: [
        {
          kind: "recognition",
          id: "g-which-is-scalar",
          title: "哪些字段是标量",
          titleEn: "Which fields are scalars",
          level: 1,
          prompt: (
            <p>
              看真实 schema 里的 <code>type Order</code>。
              下面哪些字段的类型是<strong>标量</strong>（不能再往下展开）？（多选）
            </p>
          ),
          promptEn: (
            <p>
              Look at <code>type Order</code> in the real schema. Which of
              these fields have a <strong>scalar</strong> type — one that
              cannot be expanded any further? (Select all that apply.)
            </p>
          ),
          code: real(
            "graphql",
            `type Order {
  id: ID!
  userId: ID!
  status: OrderStatus!
  totalAmount: Float!
  items: [OrderItem!]!
  createdAt: String!
  shippingInfo: ShippingInfo
}`,
            {
              sourceFile:
                "graphql-federation-practice/node-subgraph/src/schema.graphql",
            },
          ),
          options: [
            { id: "a", label: "id: ID!" },
            { id: "b", label: "status: OrderStatus!" },
            { id: "c", label: "totalAmount: Float!" },
            { id: "d", label: "items: [OrderItem!]!" },
            { id: "e", label: "createdAt: String!" },
          ],
          answer: ["a", "c", "e"],
          explain: (
            <>
              标量是 <code>ID</code>、<code>String</code>、<code>Int</code>、
              <code>Float</code>、<code>Boolean</code> 这五个内置叶子类型。
              <br />
              <code>status</code> 是 <strong>enum</strong> —— 它也是叶子
              （不能往下展开），但不是标量。
              <br />
              <code>items</code> 是<strong>对象类型的列表</strong>，
              可以继续查 <code>{"{ productId quantity price }"}</code>。
              <br />
              <code>createdAt</code> 虽然语义上是时间，
              但类型确实是 <code>String</code> —— GraphQL 没有内置日期标量。
            </>
          ),
          explainEn: (
            <>
              The scalars are the five built-in leaf types: <code>ID</code>,{" "}
              <code>String</code>, <code>Int</code>, <code>Float</code> and{" "}
              <code>Boolean</code>.
              <br />
              <code>status</code> is an <strong>enum</strong>. It is also a
              leaf — you cannot expand it — but it is not a scalar.
              <br />
              <code>items</code> is a <strong>list of an object type</strong>,
              so you can keep querying{" "}
              <code>{"{ productId quantity price }"}</code> inside it.
              <br />
              <code>createdAt</code> means a point in time, but its type
              really is <code>String</code> — GraphQL has no built-in date
              scalar.
            </>
          ),
        },
        {
          kind: "recognition",
          id: "g-query-vs-mutation",
          title: "这个操作该放哪",
          titleEn: "Where does this operation belong",
          level: 1,
          prompt: (
            <p>
              真实 schema 里 <code>createOrder</code> 放在
              <code>type Mutation</code> 下。如果把它挪到
              <code>type Query</code> 下会怎样？
            </p>
          ),
          promptEn: (
            <p>
              In the real schema, <code>createOrder</code> sits under{" "}
              <code>type Mutation</code>. What happens if you move it under{" "}
              <code>type Query</code>?
            </p>
          ),
          options: [
            { id: "a", label: "语法错误，GraphQL 不允许", labelEn: "A syntax error. GraphQL does not allow it." },
            { id: "b", label: "技术上能跑，但违反约定；而且 Query 的字段是并行执行的，写操作会有并发风险", labelEn: "It runs, but it breaks the convention. And because Query fields run in parallel, two writes can race each other." },
            { id: "c", label: "完全一样，没有任何区别", labelEn: "Exactly the same. There is no difference at all." },
            { id: "d", label: "resolver 会收不到 args", labelEn: "The resolver will not receive args." },
          ],
          answer: ["b"],
          explain: (
            <>
              GraphQL <strong>不在语法层面</strong>阻止你把写操作放 Query。
              但两点很重要：
              <br />
              ① <strong>约定</strong>：所有工具、缓存、客户端库都假设「Query 是安全的、
              可缓存的、可重试的」。放了写操作会破坏这个假设。
              <br />
              ② <strong>执行语义不同</strong>：Query 的多个顶层字段
              <strong>并行</strong>执行，Mutation 的<strong>串行</strong>执行。
              写操作放 Query 里，同一个请求里的多个写会并发跑，可能互相踩。
            </>
          ),
          explainEn: (
            <>
              GraphQL does <strong>not</strong> stop you at the syntax level
              from putting a write under Query. But two things matter:
              <br />① <strong>Convention</strong>: every tool, cache and
              client library assumes that a Query is safe, cacheable and safe
              to retry. Putting a write there breaks that assumption.
              <br />② <strong>The execution semantics differ</strong>: the
              top-level fields of a Query run <strong>in parallel</strong>,
              the fields of a Mutation run <strong>one after another</strong>.
              Put writes under Query and several writes in the same request
              run at the same time, so they can overwrite each other.
            </>
          ),
        },
        {
          kind: "fill-blank",
          id: "g-schema-blanks",
          title: "补全 schema 的关键声明",
          titleEn: "Fill in the key declarations of the schema",
          level: 2,
          prompt: (
            <p>
              照真实 <code>schema.graphql</code> 补全。
              三个空分别关系到「入口类型」「枚举」「输入类型」。
            </p>
          ),
          promptEn: (
            <p>
              Fill this in from the real <code>schema.graphql</code>. The three
              blanks are the entry type, the enum and the input type.
            </p>
          ),
          language: "graphql",
          filename: "src/schema.graphql",
          sourceFile:
            "graphql-federation-practice/node-subgraph/src/schema.graphql",
          template: `___1___ OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

type ___2___ {
  order(id: ID!): Order
  orders(userId: ID!): [Order!]!
}

___3___ OrderItemInput {
  productId: ID!
  quantity: Int!
}`,
          blanks: [
            {
              n: 1,
              accept: ["enum"],
              hint: "值只能是列出来的那几个之一。",
              hintEn: "The value can only be one of the ones listed.",
              why: (
                <>
                  <code>enum</code>。它限定了 <code>status</code> 字段的取值范围。
                  resolver 返回一个不在这五个里的字符串（比如小写的
                  <code>&quot;shipped&quot;</code>）会被执行器拒绝并报错。
                </>
              ),
              whyEn: (
                <>
                  <code>enum</code>. It limits which values the{" "}
                  <code>status</code> field may hold. If a resolver returns a
                  string that is not one of these five — lowercase{" "}
                  <code>&quot;shipped&quot;</code>, for example — the executor
                  rejects it and reports an error.
                </>
              ),
              width: 6,
            },
            {
              n: 2,
              accept: ["Query"],
              hint: "客户端读数据的入口类型，名字是约定好的。",
              hintEn:
                "The entry type the client reads data through. Its name is fixed by convention.",
              why: (
                <>
                  <code>Query</code>。它是<strong>约定的读入口</strong>，
                  名字不能自己改（虽然理论上能在 schema 定义里重命名，
                  但没人这么做）。resolver 里对应的就是
                  <code>resolvers.Query.orders</code>。
                </>
              ),
              whyEn: (
                <>
                  <code>Query</code>. It is the{" "}
                  <strong>agreed read entry point</strong>, and you do not
                  rename it. (In theory you can rename it in the schema
                  definition, but nobody does.) In the resolvers it maps to{" "}
                  <code>resolvers.Query.orders</code>.
                </>
              ),
              width: 7,
            },
            {
              n: 3,
              accept: ["input"],
              hint: "这个类型只用来当参数，不会被查询返回。",
              hintEn:
                "This type is only used as an argument. A query never returns it.",
              why: (
                <>
                  <code>input</code>。它和 <code>type</code> 的区别：
                  只能当参数用、字段只能是标量/enum/别的 input、不能有 resolver。
                  <br />
                  <strong>顺便记住这个 input 只有两个字段 ——
                  没有 <code>price</code>。</strong>
                  这个细节后面会坑死很多人。
                </>
              ),
              whyEn: (
                <>
                  <code>input</code>. How it differs from <code>type</code>:
                  it can only be used as an argument, its fields can only be
                  scalars, enums or other inputs, and it cannot have resolvers.
                  <br />
                  <strong>
                    Also remember this input has only two fields — there is no{" "}
                    <code>price</code>.
                  </strong>{" "}
                  That detail costs a lot of people a lot of time later.
                </>
              ),
              width: 7,
            },
          ],
        },
      ],
      transfer: [
        { signal: "拿到一个 GraphQL 项目", signalEn: "You are handed a GraphQL project", reachFor: "先读 schema，它是唯一的契约", reachForEn: "Read the schema first; it is the only contract" },
        { signal: "「这个字段能为空吗」", signalEn: "Asking whether a field can be null", reachFor: "看有没有 !，这决定 resolver 能不能返回 null", reachForEn: "Look for !; it decides whether the resolver may return null" },
        { signal: "resolver 写了但返回 null", signalEn: "A resolver is written but the field comes back null", reachFor: "查名字和 schema 字段名是否一字不差", reachForEn: "Check that the resolver name matches the schema field name exactly" },
        { signal: "看到 enum", signalEn: "You see an enum", reachFor: "返回值必须是列出来的那几个之一，大小写敏感", reachForEn: "The value must be one of the listed ones; case sensitive" },
      ],
      recap: [
        "GraphQL = schema（有什么）+ resolver（怎么拿到），两半必须对得上。",
        "字段类型分标量 / 对象 / enum；ID 序列化成字符串，别当数字用。",
        "Query 是读入口（字段并行），Mutation 是写入口（字段串行）。",
        "input 只能当参数，不能有 resolver —— 而这个项目的 OrderItemInput 里没有 price。",
        "客户端决定返回形状，所以 resolver 是按需调用的，也因此产生 N+1 问题。",
      ],
      recapEn: [
        "GraphQL = schema (what exists) + resolver (how to fetch it). The two halves must match.",
        "Field types are scalar, object or enum. ID is serialized as a string, so do not treat it as a number.",
        "Query is the read entry point (its fields run in parallel). Mutation is the write entry point (its fields run one after another).",
        "An input can only be used as an argument and cannot have resolvers. In this project OrderItemInput has no price.",
        "The client decides the shape of the response, so resolvers are called only when needed. That is also where the N+1 problem comes from.",
      ],
    },

    /* ---------- 1.2 ---------- */
    {
      id: "g-resolver",
      title: "resolver 的四个参数",
      titleEn: "The four arguments of a resolver",
      blurb: "(parent, args, context, info) —— 这四个东西是整门考试的操作台。",
      blurbEn: "(parent, args, context, info) — you use these four in every task of this exam.",
      minutes: 14,
      objectives: [
        "说清四个参数各是什么，什么时候用哪个",
        "解释 parent 是从哪来的",
        "从真实 index.js 里读出 context 的确切结构",
        "知道字段没有 resolver 时会发生什么",
      ],
      objectivesEn: [
        "Explain what each of the four arguments is and when to use which",
        "Explain where parent comes from",
        "Read the exact shape of context out of the real index.js",
        "Know what happens when a field has no resolver",
      ],
      whyForAssessment:
        "你要写的四个 TODO，全部是「从 context 里取数据源、用 parent 或 args 里的 id 去取数」。context 的键名写错（orderAPI vs orderDataSource）是这个项目里真实存在的埋雷之一。",
      whyForAssessmentEn:
        "All four TODOs you have to write do the same thing: take a data source from context, then fetch data using an id from parent or args. Getting a key name in context wrong (orderAPI instead of orderDataSource) is one of the bugs actually planted in this project.",
      sourceFiles: [
        {
          path: "graphql-federation-practice/node-subgraph/src/index.js",
          role: "context 在这里被构造，键名以它为准",
        },
        {
          path: "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js",
          role: "四个 TODO 的位置",
          edit: true,
        },
      ],
      concepts: [
        {
          id: "four-args",
          heading: "四个参数",
          headingEn: "The four arguments",
          body: (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>位置</th>
                      <th>惯用名</th>
                      <th>是什么</th>
                      <th>这个项目里的用法</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1</td>
                      <td><code>parent</code></td>
                      <td>上一层字段的返回值</td>
                      <td>
                        <code>Order.shippingInfo</code> 里的
                        <code>parent</code> 就是那个 order 对象，
                        所以能用 <code>parent.id</code>
                      </td>
                    </tr>
                    <tr>
                      <td>2</td>
                      <td><code>args</code></td>
                      <td>查询里传的参数</td>
                      <td>
                        <code>Query.orders(_, {"{ userId }"}, ...)</code> ——
                        解构出 userId
                      </td>
                    </tr>
                    <tr>
                      <td>3</td>
                      <td><code>context</code></td>
                      <td>
                        <strong>每个请求</strong>共享的一个袋子
                      </td>
                      <td>
                        数据源、DataLoader、correlationId 全在这里
                      </td>
                    </tr>
                    <tr>
                      <td>4</td>
                      <td><code>info</code></td>
                      <td>本次查询的 AST 等元信息</td>
                      <td><strong>这个项目里完全没用到</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>用不到的参数写成 <code>_</code></strong> ——
                这是约定，不是语法。真实代码里
                <code>async orders(_, {"{ userId }"}, {"{ dataSources }"})</code>
                那个下划线就是「我不需要 parent」。
              </p>
              <p>
                注意 <strong>顶层的 <code>Query</code> / <code>Mutation</code>
                字段没有有意义的 parent</strong>（是 undefined 或根值），
                所以它们的第一个参数总是 <code>_</code>。
                而 <code>Order.shippingInfo</code> 这种<strong>字段 resolver</strong>
                的 parent 非常重要 —— 它就是「哪个 order」。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Position</th>
                      <th>Usual name</th>
                      <th>What it is</th>
                      <th>How this project uses it</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1</td>
                      <td><code>parent</code></td>
                      <td>what the field above returned</td>
                      <td>
                        inside <code>Order.shippingInfo</code> the{" "}
                        <code>parent</code> is that order object, so{" "}
                        <code>parent.id</code> works
                      </td>
                    </tr>
                    <tr>
                      <td>2</td>
                      <td><code>args</code></td>
                      <td>the arguments the query passed in</td>
                      <td>
                        <code>Query.orders(_, {"{ userId }"}, ...)</code> —
                        destructure userId out of it
                      </td>
                    </tr>
                    <tr>
                      <td>3</td>
                      <td><code>context</code></td>
                      <td>
                        one bag shared by <strong>a single request</strong>
                      </td>
                      <td>
                        data sources, DataLoaders and correlationId all live
                        here
                      </td>
                    </tr>
                    <tr>
                      <td>4</td>
                      <td><code>info</code></td>
                      <td>the query AST and other metadata</td>
                      <td><strong>never touched in this project</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>Write <code>_</code> for parameters you do not
                use</strong> — that is a convention, not syntax. In the real
                code,{" "}
                <code>async orders(_, {"{ userId }"}, {"{ dataSources }"})</code>{" "}
                uses that underscore to say &ldquo;I do not need parent&rdquo;.
              </p>
              <p>
                Note that{" "}
                <strong>
                  top-level <code>Query</code> and <code>Mutation</code> fields
                  have no meaningful parent
                </strong>{" "}
                (it is undefined or the root value), so their first parameter is
                always <code>_</code>. For a <strong>field resolver</strong>{" "}
                like <code>Order.shippingInfo</code>, parent matters a lot — it
                is &ldquo;which order&rdquo;.
              </p>
            </>
          ),
        },
        {
          id: "parent-chain",
          heading: "parent 是怎么来的",
          headingEn: "Where parent comes from",
          lede: "上一层返回什么，下一层的 parent 就是什么。",
          ledeEn: "Whatever the level above returns becomes the parent of the level below.",
          body: (
            <>
              <p>
                执行器是<strong>一层一层往下</strong>走的：
              </p>
              <ol>
                <li>
                  调 <code>Query.orders</code>，它返回
                  <code>[order456, order457]</code>。
                </li>
                <li>
                  客户端还查了 <code>shippingInfo</code>，
                  于是执行器<strong>对数组里每个元素</strong>调
                  <code>Order.shippingInfo</code>，
                  把那个元素作为 <code>parent</code> 传进去。
                </li>
                <li>
                  所以 <code>parent.id</code> 就是 <code>&quot;order-456&quot;</code>
                  或 <code>&quot;order-457&quot;</code>。
                </li>
              </ol>
              <p>
                <strong>字段没有 resolver 时会怎样？</strong>
                执行器会用<strong>默认 resolver</strong>：
                直接取 <code>parent[字段名]</code>。
              </p>
              <p>
                这解释了一件重要的事：<code>Order</code> 有 7 个字段，
                但 <code>resolvers.Order</code> 里<strong>只写了
                <code>shippingInfo</code> 一个</strong>。
                其余 6 个（id、userId、status……）不需要写 ——
                因为数据源返回的对象上正好有这些同名属性，默认 resolver 直接取就行。
              </p>
              <p>
                <strong>而 <code>shippingInfo</code> 必须自己写</strong>，
                因为数据源返回的 order 对象上<strong>没有</strong>这个属性
                （物流信息在另一个服务里）。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The executor walks <strong>one layer at a time</strong>:
              </p>
              <ol>
                <li>
                  It calls <code>Query.orders</code>, which returns{" "}
                  <code>[order456, order457]</code>.
                </li>
                <li>
                  The client also asked for <code>shippingInfo</code>, so the
                  executor calls <code>Order.shippingInfo</code>{" "}
                  <strong>once per element of that array</strong>, passing the
                  element in as <code>parent</code>.
                </li>
                <li>
                  So <code>parent.id</code> is either{" "}
                  <code>&quot;order-456&quot;</code> or{" "}
                  <code>&quot;order-457&quot;</code>.
                </li>
              </ol>
              <p>
                <strong>What happens to a field with no resolver?</strong> The
                executor falls back to the <strong>default resolver</strong>: it
                reads <code>parent[fieldName]</code> and returns that.
              </p>
              <p>
                That explains something important. <code>Order</code> has seven
                fields, but <code>resolvers.Order</code>{" "}
                <strong>defines only <code>shippingInfo</code></strong>. The
                other six (id, userId, status and so on) need no resolver — the
                object the data source returns already has properties with
                exactly those names, so the default resolver picks them up.
              </p>
              <p>
                <strong>And <code>shippingInfo</code> has to be written by
                hand</strong>, because the order object from the data source{" "}
                <strong>does not have</strong> that property (shipping lives in
                another service).
              </p>
            </>
          ),
          code: [
            real(
              "js",
              `// OrderDataSource 的种子数据 —— 注意它没有 shippingInfo 字段
{
  id: 'order-456',
  userId: '123',
  status: 'SHIPPED',
  totalAmount: 299.99,
  items: [{ productId: 'prod-789', quantity: 2, price: 149.99 }],
  createdAt: '2026-01-01T10:30:00Z'
}
// ↑ id / userId / status / totalAmount / items / createdAt 六个字段
//   靠默认 resolver 自动取值，不用写
// ↑ shippingInfo 不在这里 → 必须自己写 resolver 去 ShippingDataSource 取`,
              {
                filename: "为什么只有 shippingInfo 需要 resolver",
                filenameEn: "Why only shippingInfo needs a resolver",
                codeEn: `// The seed data of OrderDataSource — note there is no shippingInfo field
{
  id: 'order-456',
  userId: '123',
  status: 'SHIPPED',
  totalAmount: 299.99,
  items: [{ productId: 'prod-789', quantity: 2, price: 149.99 }],
  createdAt: '2026-01-01T10:30:00Z'
}
// ↑ six fields: id / userId / status / totalAmount / items / createdAt.
//   The default resolver reads them for you, so you write nothing
// ↑ shippingInfo is not here → write a resolver that asks ShippingDataSource`,
                sourceFile:
                  "graphql-federation-practice/node-subgraph/src/dataSources/orderDataSource.js",
              },
            ),
          ],
        },
        {
          id: "the-context",
          heading: "context：读 index.js 拿到确切的键名",
          headingEn: "context: read index.js to get the exact key names",
          lede: "这一段是全门考试最该抄在纸上的东西。",
          ledeEn: "This is the part of the exam most worth copying onto paper.",
          body: (
            <>
              <p>
                <code>context</code> 是在 <code>index.js</code> 里
                <strong>每个请求</strong>现场构造的。看清它的三个键：
              </p>
              <p>
                所以在 resolver 里你能直接从第三个参数里解构出这三个键 ——
                下面的代码块和那张表就是它的确切形状。
              </p>
              <p>
                <strong>三个数据源的确切名字：</strong>
                <code>orderDataSource</code>、
                <code>inventoryDataSource</code>、
                <code>shippingDataSource</code>。
                <strong>不是 <code>orderAPI</code>，
                不是 <code>orderService</code>。</strong>
                （项目里的 starter 代码就写错成了 <code>orderAPI</code> ——
                这是三个埋雷之一。）
              </p>
              <p>
                <strong>两个 loader 的确切名字：</strong>
                <code>shippingInfoLoader</code>、<code>orderLoader</code>。
              </p>
              <p>
                <strong>为什么 loader 要每请求新建？</strong>
                DataLoader 自带缓存。如果建在模块顶层，
                第一个请求缓存的数据会被第二个请求看到 ——
                跨请求数据泄漏，而且数据永远不刷新。
                所以正确做法就是像这里一样，在 <code>context</code>
                函数里 <code>new</code>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>context</code> is built fresh inside{" "}
                <code>index.js</code> <strong>for every request</strong>. Look
                closely at its three keys:
              </p>
              <p>
                Which is why a resolver can destructure those three keys straight out of
                its third argument &mdash; the code block and the table below are its
                exact shape.
              </p>
              <p>
                <strong>The exact names of the three data sources:</strong>{" "}
                <code>orderDataSource</code>, <code>inventoryDataSource</code>,{" "}
                <code>shippingDataSource</code>.{" "}
                <strong>
                  Not <code>orderAPI</code>, not <code>orderService</code>.
                </strong>{" "}
                (The starter code in the project gets this wrong and writes{" "}
                <code>orderAPI</code> — one of the three planted bugs.)
              </p>
              <p>
                <strong>The exact names of the two loaders:</strong>{" "}
                <code>shippingInfoLoader</code> and <code>orderLoader</code>.
              </p>
              <p>
                <strong>Why do the loaders have to be new for every
                request?</strong> DataLoader caches by design. Build one at
                module top level and whatever the first request cached is
                visible to the second — data leaking across requests, and data
                that never refreshes. So the right move is exactly what happens
                here: <code>new</code> them inside the <code>context</code>{" "}
                function.
              </p>
            </>
          ),
          code: [
            real("js", INDEX_JS, {
              filename: "src/index.js（全文）",
              filenameEn: "src/index.js (full file)",
              sourceFile:
                "graphql-federation-practice/node-subgraph/src/index.js",
              highlight: [33, 40, 41, 42, 44, 45, 47, 48, 49, 50, 51],
              collapsible: true,
            }),
            real(
              "js",
              `// context 的确切结构（从 index.js 第 47–51 行读出来的）
{
  dataSources: {
    orderDataSource,       // getOrder(id) / getOrdersByUserId(userId) / createOrder(userId, items)
    inventoryDataSource,   // getInventoryStatus(ids) / getProductPrice(productId)
    shippingDataSource     // getShippingInfo(orderId)
  },
  loaders: {
    shippingInfoLoader,    // .load(orderId)
    orderLoader            // .load(orderId)
  },
  correlationId            // 字符串，用于把一次请求的所有日志串起来
}`,
              {
                filename: "抄在纸上的那张表",
                filenameEn: "The table to copy onto paper",
                codeEn: `// The exact shape of context (read off lines 47–51 of index.js)
{
  dataSources: {
    orderDataSource,       // getOrder(id) / getOrdersByUserId(userId) / createOrder(userId, items)
    inventoryDataSource,   // getInventoryStatus(ids) / getProductPrice(productId)
    shippingDataSource     // getShippingInfo(orderId)
  },
  loaders: {
    shippingInfoLoader,    // .load(orderId)
    orderLoader            // .load(orderId)
  },
  correlationId            // a string that ties together all logs of one request
}`,
                explanation:
                  "写 resolver 之前把这张表抄下来。三个埋雷里有两个就是「名字对不上」—— starter 代码里写了 dataSources.orderAPI（不存在）和 orderDataSource.getOrderById（不存在）。",
                explanationEn:
                  "Copy this table down before you write any resolver. Two of the three planted bugs are just names that do not match: the starter code writes dataSources.orderAPI (does not exist) and orderDataSource.getOrderById (does not exist).",
              },
            ),
          ],
        },
        {
          id: "correlation-id",
          heading: "correlationId：为什么每个 TODO 都提到它",
          headingEn: "correlationId: why every TODO mentions it",
          body: (
            <>
              <p>
                四个 TODO 里有两个明确写了
                <em>correlation ID tracing</em> / <em>correlation ID logging</em>。
                这不是装饰。
              </p>
              <p>
                在微服务系统里，一个用户请求会经过 Router → subgraph A →
                subgraph B → 数据库，每一跳都在打日志。
                出问题时你需要把<strong>同一次请求</strong>的所有日志找出来 ——
                <strong>correlation id 就是那根线</strong>。
              </p>
              <p>
                <code>index.js</code> 里的逻辑是：优先用客户端传来的
                <code>x-correlation-id</code> 请求头，没有就自己生成一个。
                这样调用方（比如 Router）传下来的 id 会被沿用，
                整条链路的日志能串起来。
              </p>
              <p>
                你要做的很简单：<strong>在 resolver 的日志和错误里带上它</strong>。
                <code>{"console.log(`[${correlationId}] ...`)"}</code>，
                以及 <code>{"extensions: { code, correlationId }"}</code>。
                Java 那道题里也有同一套思路（用 SLF4J 的 MDC 实现）。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Two of the four TODOs spell it out:{" "}
                <em>correlation ID tracing</em> /{" "}
                <em>correlation ID logging</em>. That is not decoration.
              </p>
              <p>
                In a microservice system one user request travels Router →
                subgraph A → subgraph B → database, and every hop writes logs.
                When something breaks you need every log line that belongs to{" "}
                <strong>that one request</strong> —{" "}
                <strong>the correlation id is that thread</strong>.
              </p>
              <p>
                The logic in <code>index.js</code>: use the{" "}
                <code>x-correlation-id</code> header from the client if it is
                there, otherwise generate one. That way an id handed down by the
                caller (the Router, say) gets reused and the logs of the whole
                chain line up.
              </p>
              <p>
                Your part is simple: <strong>carry it in the logs and errors of
                your resolvers</strong>.{" "}
                <code>{"console.log(`[${correlationId}] ...`)"}</code>, plus{" "}
                <code>{"extensions: { code, correlationId }"}</code>. The Java
                question uses the same idea, implemented with SLF4J&rsquo;s MDC.
              </p>
            </>
          ),
          code: [
            real(
              "js",
              `const correlationId = req.headers['x-correlation-id'] ||
  \`corr-\${Date.now()}-\${Math.random().toString(36).substring(2, 9)}\`;`,
              {
                filename: "correlationId 的来源",
                filenameEn: "Where correlationId comes from",
                sourceFile:
                  "graphql-federation-practice/node-subgraph/src/index.js",
                explanation:
                  "「有就用调用方的，没有就自己造」是这类可观测性字段的标准做法 —— 保证整条链路共用一个 id。",
                explanationEn:
                  "Use the caller's value if there is one, otherwise make your own. That is the standard pattern for this kind of observability field: it keeps one id across the whole chain of calls.",
              },
            ),
          ],
        },
      ],
      exercises: [
        {
          kind: "recognition",
          id: "g-context-key",
          title: "从 context 里取订单数据源，正确写法是",
          titleEn: "The right way to read the order data source out of context",
          level: 1,
          prompt: (
            <p>
              照 <code>index.js</code> 里 context 的真实结构，
              哪个写法能拿到订单数据源？
            </p>
          ),
          promptEn: (
            <p>
              Going by the real shape of context in <code>index.js</code>,
              which of these reads the order data source?
            </p>
          ),
          options: [
            { id: "a", label: "context.dataSources.orderAPI" },
            { id: "b", label: "context.dataSources.orderDataSource" },
            { id: "c", label: "context.orderDataSource" },
            { id: "d", label: "context.sources.order" },
          ],
          answer: ["b"],
          explain: (
            <>
              <code>index.js</code> 里 return 的是
              <code>{"{ dataSources: { orderDataSource, ... }, loaders: {...}, correlationId }"}</code>。
              所以路径是 <code>context.dataSources.orderDataSource</code>。
              <br />
              <strong>A 是项目里真实存在的埋雷</strong> ——
              starter 的 <code>Mutation.createOrder</code> 里写的就是
              <code>dataSources.orderAPI</code>，运行时报
              <code>Cannot read properties of undefined (reading &apos;createOrder&apos;)</code>。
            </>
          ),
          explainEn: (
            <>
              What <code>index.js</code> returns is{" "}
              <code>{"{ dataSources: { orderDataSource, ... }, loaders: {...}, correlationId }"}</code>
              , so the path is{" "}
              <code>context.dataSources.orderDataSource</code>.
              <br />
              <strong>Option A is a bug that really is in the project</strong>:
              the starter&apos;s <code>Mutation.createOrder</code> writes{" "}
              <code>dataSources.orderAPI</code>, and at run time it reports{" "}
              <code>Cannot read properties of undefined (reading &apos;createOrder&apos;)</code>.
            </>
          ),
        },
        {
          kind: "recognition",
          id: "g-which-param",
          title: "这个 resolver 该用哪个参数",
          titleEn: "Which argument should this resolver use",
          level: 1,
          prompt: (
            <p>
              <code>Order.shippingInfo</code> 需要知道「是哪个 order 的物流」。
              这个 order 的 id 从哪个参数拿？
            </p>
          ),
          promptEn: (
            <p>
              <code>Order.shippingInfo</code> has to know which order the
              shipping belongs to. Which argument holds that order&apos;s id?
            </p>
          ),
          options: [
            { id: "a", label: "args.id" },
            { id: "b", label: "parent.id" },
            { id: "c", label: "context.orderId" },
            { id: "d", label: "info.fieldName" },
          ],
          answer: ["b"],
          explain: (
            <>
              <code>parent.id</code>。<code>shippingInfo</code> 是
              <code>Order</code> 上的字段，执行器调它的时候会
              <strong>把那个 order 对象作为第一个参数传进来</strong>。
              <br />
              <code>args</code> 是空的 —— schema 里
              <code>shippingInfo: ShippingInfo</code> 没有声明任何参数。
              <br />
              这就是为什么真实答案是{" "}
              <code>loaders.shippingInfoLoader.load(parent.id)</code>。
            </>
          ),
          explainEn: (
            <>
              <code>parent.id</code>. <code>shippingInfo</code> is a field on{" "}
              <code>Order</code>, so when the executor calls it, it{" "}
              <strong>passes that order object in as the first argument</strong>.
              <br />
              <code>args</code> is empty — in the schema,{" "}
              <code>shippingInfo: ShippingInfo</code> declares no arguments at
              all.
              <br />
              That is why the real answer is{" "}
              <code>loaders.shippingInfoLoader.load(parent.id)</code>.
            </>
          ),
        },
        {
          kind: "ordering",
          id: "g-resolver-order",
          title: "把 resolver 的调用顺序排对",
          titleEn: "Put the resolver calls in the right order",
          level: 1,
          prompt: (
            <p>
              客户端发{" "}
              <code>{'{ orders(userId:"123") { id shippingInfo { status } } }'}</code>，
              数据源里 user 123 有两个订单。把服务端的动作排序。
            </p>
          ),
          promptEn: (
            <p>
              The client sends{" "}
              <code>{'{ orders(userId:"123") { id shippingInfo { status } } }'}</code>
              , and in the data source user 123 has two orders. Put the
              server&apos;s steps in order.
            </p>
          ),
          items: [
            { id: "c", label: "对每个 order 分别调 Order.shippingInfo（共 2 次）", labelEn: "Call Order.shippingInfo once per order (2 calls in total)" },
            { id: "a", label: "用 schema 校验查询：字段存不存在、userId 类型对不对", labelEn: "Validate the query against the schema: do the fields exist, is the type of userId right" },
            { id: "d", label: "DataLoader 把 2 次 load 合并成 1 次批量请求", labelEn: "DataLoader merges the 2 load calls into 1 batched request" },
            { id: "b", label: "调 Query.orders，拿到 [order-456, order-457]", labelEn: "Call Query.orders and get back [order-456, order-457]" },
            { id: "e", label: "按查询形状组装 JSON 返回", labelEn: "Assemble the JSON response in the shape of the query" },
          ],
          answer: ["a", "b", "c", "d", "e"],
          explain: (
            <>
              先校验（不碰数据）→ 调最外层 resolver → 拿到的每个元素作为 parent
              往下调字段 resolver → DataLoader 在同一个事件循环里合并 →
              最后按形状组装。
              <br />
              <strong>第 3 步「对每个 order 分别调」就是 N+1 的来源</strong>，
              第 4 步是它的解药。
            </>
          ),
          explainEn: (
            <>
              Validate first (this touches no data) → call the outermost
              resolver → pass each element it returned down as the parent of
              the field resolvers → DataLoader merges the calls inside the same
              tick of the event loop → assemble the response last.
              <br />
              <strong>
                Step 3, calling once per order, is where N+1 comes from
              </strong>
              . Step 4 is the cure.
            </>
          ),
        },
      ],
      transfer: [
        { signal: "字段 resolver 需要「是哪一个」", signalEn: "A field resolver needs to know which object it is on", reachFor: "用 parent", reachForEn: "Use parent" },
        { signal: "查询传了参数", signalEn: "The query passes arguments", reachFor: "用 args，通常直接解构", reachForEn: "Use args, usually destructured directly" },
        { signal: "需要数据源 / loader / 请求级信息", signalEn: "You need a data source, a loader, or per-request information", reachFor: "用 context，键名以 index.js 为准", reachForEn: "Use context; index.js is the source of truth for key names" },
        { signal: "数据源上已经有同名属性", signalEn: "The data source already has a property with the same name", reachFor: "不用写 resolver，默认 resolver 会取", reachForEn: "No resolver needed; the default resolver reads it" },
        { signal: "TODO 里提到 correlation id", signalEn: "A TODO mentions correlation id", reachFor: "日志和 error extensions 里都带上它", reachForEn: "Put it in the log line and in the error extensions" },
      ],
      recap: [
        "四个参数：parent（上一层返回值）、args（查询参数）、context（请求级袋子）、info（这个项目没用）。",
        "顶层 Query/Mutation 的 parent 无意义，写成 _；字段 resolver 的 parent 至关重要。",
        "context 的确切键名：dataSources.{orderDataSource, inventoryDataSource, shippingDataSource}、loaders.{shippingInfoLoader, orderLoader}、correlationId。",
        "数据源上有同名属性的字段不用写 resolver；shippingInfo 没有，所以必须写。",
        "DataLoader 必须每请求新建，否则缓存跨请求泄漏。",
      ],
      recapEn: [
        "The four arguments: parent (what the level above returned), args (the query arguments), context (per-request shared data), info (not used in this project).",
        "On top-level Query and Mutation the parent means nothing, so write it as _. On a field resolver the parent matters a lot.",
        "The exact keys in context: dataSources.{orderDataSource, inventoryDataSource, shippingDataSource}, loaders.{shippingInfoLoader, orderLoader}, correlationId.",
        "A field whose name already exists on the data source needs no resolver. shippingInfo is not there, so you must write one.",
        "A DataLoader must be created once per request, otherwise its cache leaks from one request into the next.",
      ],
    },

    /* ---------- 1.3 ---------- */
    {
      id: "g-nullable",
      title: "非空、列表，和那个没有 price 的 input",
      titleEn: "Non-null, lists, and the input that has no price",
      blurb: "schema 里两处细节，直接决定四个 TODO 里三个的对错。",
      blurbEn: "Two details in the schema decide whether three of the four TODOs are right.",
      minutes: 13,
      objectives: [
        "读懂 ! 和 [] 的四种组合各是什么意思",
        "解释为什么 [Order!]! 的 resolver 必须写 ?? []",
        "看出 OrderItemInput 少了 price 会导致什么",
        "知道非空字段返回 null 时错误会怎样向上冒泡",
      ],
      objectivesEn: [
        "Read the four combinations of ! and [] and say what each means",
        "Explain why a resolver for [Order!]! must end with ?? []",
        "See what goes wrong because OrderItemInput has no price",
        "Know how the error moves upward when a non-null field returns null",
      ],
      whyForAssessment:
        "这一节讲的两处细节，是这门考试最典型的「不读 schema 就必错」的地方。审计时实测确认：createOrder 不补 price，测试直接失败。",
      whyForAssessmentEn:
        "The two details in this lesson are the clearest case of what you get wrong by not reading the schema. Measured during the audit: if createOrder does not fill in price, the test fails.",
      sourceFiles: [
        {
          path: "graphql-federation-practice/node-subgraph/src/schema.graphql",
          role: "非空标记与 input 定义",
        },
        {
          path: "graphql-federation-practice/node-subgraph/src/dataSources/orderDataSource.js",
          role: "createOrder 里那行乘法暴露了 price 的必要性",
        },
      ],
      concepts: [
        {
          id: "bang-and-brackets",
          heading: "! 和 [] 的四种组合",
          headingEn: "The four combinations of ! and []",
          lede: "默认可空，加 ! 才不可空。列表和元素各有自己的可空性。",
          ledeEn: "Fields are nullable by default; ! makes them non-null. The list and its elements each have their own nullability.",
          body: (
            <>
              <p>
                <strong>GraphQL 里所有类型默认可空</strong>。
                <code>!</code> 是「保证不为 null」。
                列表的方括号和元素各能带一个 <code>!</code>，
                所以有四种组合：
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>写法</th>
                      <th>列表本身能是 null 吗</th>
                      <th>元素能是 null 吗</th>
                      <th>合法的值举例</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>[Order]</code></td>
                      <td>能</td>
                      <td>能</td>
                      <td><code>null</code>、<code>[]</code>、<code>[a, null]</code></td>
                    </tr>
                    <tr>
                      <td><code>[Order!]</code></td>
                      <td>能</td>
                      <td>不能</td>
                      <td><code>null</code>、<code>[]</code>、<code>[a, b]</code></td>
                    </tr>
                    <tr>
                      <td><code>[Order]!</code></td>
                      <td>不能</td>
                      <td>能</td>
                      <td><code>[]</code>、<code>[a, null]</code></td>
                    </tr>
                    <tr>
                      <td>
                        <strong><code>[Order!]!</code></strong>
                      </td>
                      <td><strong>不能</strong></td>
                      <td><strong>不能</strong></td>
                      <td><code>[]</code>、<code>[a, b]</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                这份 schema 里有<strong>两处</strong>用了最严格的
                <code>[Order!]!</code>：
                <code>User.orders</code> 和 <code>Query.orders</code>。
                两个都是你要实现的 TODO。
              </p>
              <p>
                <strong>实践结论：这两个 resolver 绝对不能返回
                <code>null</code> 或 <code>undefined</code>。</strong>
                「没有订单」的正确表达是<strong>空数组 <code>[]</code></strong>，
                不是 null。所以真实答案里都写了
                <code>return orders ?? []</code>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>Every type in GraphQL is nullable by default</strong>.{" "}
                <code>!</code> means &ldquo;guaranteed not to be null&rdquo;.
                The brackets of a list and the elements inside it can each carry
                their own <code>!</code>, which gives four combinations:
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Written as</th>
                      <th>Can the list be null</th>
                      <th>Can an element be null</th>
                      <th>Legal values</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>[Order]</code></td>
                      <td>yes</td>
                      <td>yes</td>
                      <td>
                        <code>null</code>, <code>[]</code>,{" "}
                        <code>[a, null]</code>
                      </td>
                    </tr>
                    <tr>
                      <td><code>[Order!]</code></td>
                      <td>yes</td>
                      <td>no</td>
                      <td>
                        <code>null</code>, <code>[]</code>, <code>[a, b]</code>
                      </td>
                    </tr>
                    <tr>
                      <td><code>[Order]!</code></td>
                      <td>no</td>
                      <td>yes</td>
                      <td><code>[]</code>, <code>[a, null]</code></td>
                    </tr>
                    <tr>
                      <td>
                        <strong><code>[Order!]!</code></strong>
                      </td>
                      <td><strong>no</strong></td>
                      <td><strong>no</strong></td>
                      <td><code>[]</code>, <code>[a, b]</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                This schema uses the strictest form, <code>[Order!]!</code>, in{" "}
                <strong>two places</strong>: <code>User.orders</code> and{" "}
                <code>Query.orders</code>. Both of them are TODOs you have to
                implement.
              </p>
              <p>
                <strong>
                  Practical conclusion: those two resolvers must never return{" "}
                  <code>null</code> or <code>undefined</code>.
                </strong>{" "}
                The right way to say &ldquo;no orders&rdquo; is an{" "}
                <strong>empty array <code>[]</code></strong>, not null. Which is
                why both real answers write <code>return orders ?? []</code>.
              </p>
            </>
          ),
          code: [
            real(
              "graphql",
              `type User @key(fields: "id") {
  id: ID! @external
  orders: [Order!]!          # ← 双重非空
}

type Query {
  order(id: ID!): Order      # ← 可空：找不到返回 null 是合法的
  orders(userId: ID!): [Order!]!   # ← 双重非空
}

type Order {
  shippingInfo: ShippingInfo # ← 可空：没有物流信息返回 null 是合法的
}`,
              {
                filename: "四个 TODO 对应的返回类型",
                filenameEn: "The return types behind the four TODOs",
                codeEn: `type User @key(fields: "id") {
  id: ID! @external
  orders: [Order!]!          # ← non-null twice
}

type Query {
  order(id: ID!): Order      # ← nullable: null when not found is legal
  orders(userId: ID!): [Order!]!   # ← non-null twice
}

type Order {
  shippingInfo: ShippingInfo # ← nullable: null when there is no shipping is legal
}`,
                sourceFile:
                  "graphql-federation-practice/node-subgraph/src/schema.graphql",
                explanation:
                  "对照着看：两个列表字段必须 ?? [] 兜底；Query.order 和 Order.shippingInfo 可以返回 null。这四行决定了你四个 TODO 各自的兜底策略。",
                explanationEn:
                  "Read them side by side: the two list fields must fall back with ?? [], while Query.order and Order.shippingInfo are allowed to return null. These four lines decide the fallback for each of your four TODOs.",
              },
            ),
          ],
        },
        {
          id: "null-bubbling",
          heading: "非空字段返回 null 会怎样：错误向上冒泡",
          headingEn: "What happens when a non-null field returns null: the error moves upward",
          lede: "不是「那个字段变成 null」，是整块数据被丢掉。",
          ledeEn: "The field does not just become null. The whole block of data is dropped.",
          body: (
            <>
              <p>
                如果 <code>Query.orders</code> 返回了 <code>null</code>，
                GraphQL 执行器不会容忍 —— 它会：
              </p>
              <ol>
                <li>
                  在 <code>errors</code> 数组里加一条
                  <code>Cannot return null for non-nullable field
                  Query.orders</code>。
                </li>
                <li>
                  <strong>把这个字段的值设为 null，然后往上冒泡</strong> ——
                  如果父字段也是非空的，父字段也变 null，一直往上，
                  直到遇到一个可空的祖先，或者到根节点让整个
                  <code>data</code> 变成 <code>null</code>。
                </li>
              </ol>
              <p>
                所以一个 resolver 忘了兜底，可能导致
                <strong>整个响应的 data 变成 null</strong> ——
                客户端拿不到任何数据，即使其他字段都好着。
                这就是为什么 schema 设计里「该可空的地方就标可空」很重要，
                也是为什么这两个列表字段必须 <code>?? []</code>。
              </p>
              <p>
                反过来，<code>Order.shippingInfo</code> 是<strong>可空</strong>的，
                所以「order-999 没有物流信息」这种情况返回 <code>null</code>
                完全正常，不会报错。数据源那边正是这么设计的 ——
                <code>getShippingInfo</code> 只有 order-456/457 有数据，
                其余返回 <code>null</code>。测试也直接断言了这一点。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                If <code>Query.orders</code> returns <code>null</code>, the
                GraphQL executor will not put up with it. It:
              </p>
              <ol>
                <li>
                  adds{" "}
                  <code>Cannot return null for non-nullable field Query.orders</code>{" "}
                  to the <code>errors</code> array.
                </li>
                <li>
                  <strong>sets that field to null and bubbles upward</strong> —
                  if the parent field is also non-nullable, the parent becomes
                  null too, and so on up the tree until it reaches a nullable
                  ancestor, or hits the root and turns the whole{" "}
                  <code>data</code> into <code>null</code>.
                </li>
              </ol>
              <p>
                So one resolver forgetting its fallback can turn{" "}
                <strong>the data of the whole response into null</strong> — the
                client gets nothing back, even though every other field was
                fine. That is why &ldquo;mark it nullable where it should be
                nullable&rdquo; matters in schema design, and why those two list
                fields need <code>?? []</code>.
              </p>
              <p>
                The other direction: <code>Order.shippingInfo</code>{" "}
                <strong>is nullable</strong>, so returning <code>null</code> for
                &ldquo;order-999 has no shipping info&rdquo; is perfectly normal
                and raises no error. The data source is built that way on
                purpose — <code>getShippingInfo</code> only has data for
                order-456 and order-457 and returns <code>null</code> for
                everything else. A test asserts exactly this.
              </p>
            </>
          ),
        },
        {
          id: "the-missing-price",
          heading: "OrderItemInput 少了 price —— 这是个陷阱",
          headingEn: "OrderItemInput has no price — this is a trap",
          lede: "两个文件放在一起看，才能发现问题。",
          ledeEn: "You only see the problem when you read the two files side by side.",
          body: (
            <>
              <p>
                <strong>先看 schema 里的 input：</strong>
                只有 <code>productId</code> 和 <code>quantity</code>。
                客户端调 <code>createOrder</code> 时<strong>不传 price</strong>
                （合理 —— 价格不能让客户端说）。
              </p>
              <p>
                <strong>再看数据源的 createOrder：</strong>
                它内部要算 <code>sum + item.price * item.quantity</code>。
              </p>
              <p>
                <strong>问题来了：</strong>如果 resolver 把客户端传来的 items
                原样交给数据源，那 <code>item.price</code> 是
                <code>undefined</code>，
                <code>undefined * 2</code> 得到 <code>NaN</code>，
                <code>totalAmount</code> 变成 <code>NaN</code>。
                而 <code>totalAmount: Float!</code> 收到 NaN 会序列化失败。
              </p>
              <p>
                <strong>解法：</strong>resolver 必须先去
                <code>InventoryDataSource.getProductPrice(productId)</code>
                查每个商品的价格，把 items 补全之后再交给数据源。
              </p>
              <p>
                这就是 <code>InventoryDataSource</code> 存在的原因 ——
                它不是干扰项。（<code>getInventoryStatus</code> 才是干扰项，
                没有任何地方需要它。）
              </p>
              <p>
                <strong>测试怎么抓这个的？</strong>
                <code>expect(order.items[0].price).toBeDefined()</code> 和
                <code>expect(order.totalAmount).toBeGreaterThan(0)</code>。
                审计时实测：不补 price，这个测试失败。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>First, the input in the schema:</strong> only{" "}
                <code>productId</code> and <code>quantity</code>. A client
                calling <code>createOrder</code>{" "}
                <strong>never sends price</strong> — which is reasonable, the
                client does not get to name the price.
              </p>
              <p>
                <strong>Now the createOrder in the data source:</strong>{" "}
                internally it computes{" "}
                <code>sum + item.price * item.quantity</code>.
              </p>
              <p>
                <strong>Here is the problem:</strong> if the resolver hands the
                client&rsquo;s items straight to the data source, then{" "}
                <code>item.price</code> is <code>undefined</code>,{" "}
                <code>undefined * 2</code> gives <code>NaN</code>, and{" "}
                <code>totalAmount</code> becomes <code>NaN</code>. And{" "}
                <code>totalAmount: Float!</code> cannot serialise a NaN.
              </p>
              <p>
                <strong>The fix:</strong> the resolver has to look up each
                product&rsquo;s price with{" "}
                <code>InventoryDataSource.getProductPrice(productId)</code> and
                complete the items before handing them to the data source.
              </p>
              <p>
                That is why <code>InventoryDataSource</code> exists — it is not
                a distractor. (<code>getInventoryStatus</code> is the
                distractor; nothing anywhere needs it.)
              </p>
              <p>
                <strong>How does the test catch this?</strong>{" "}
                <code>expect(order.items[0].price).toBeDefined()</code> and{" "}
                <code>expect(order.totalAmount).toBeGreaterThan(0)</code>.
                Measured during the audit: skip the price lookup and this test
                fails.
              </p>
            </>
          ),
          code: [
            real(
              "graphql",
              `input OrderItemInput {
  productId: ID!
  quantity: Int!
}
# ↑ 没有 price`,
              {
                codeEn: `input OrderItemInput {
  productId: ID!
  quantity: Int!
}
# ↑ no price`,
                sourceFile:
                  "graphql-federation-practice/node-subgraph/src/schema.graphql",
              },
            ),
            real(
              "js",
              `async createOrder(userId, items) {
  await new Promise(resolve => setTimeout(resolve, 10));

  const totalAmount = items.reduce((sum, item) => {
    return sum + item.price * item.quantity;      // ← 它需要 price！
  }, 0);

  const newOrder = {
    id: \`order-\${Date.now()}\`,
    userId,
    status: 'PENDING',
    totalAmount,
    items,
    createdAt: new Date().toISOString()
  };

  this.orders.push(newOrder);
  return newOrder;
}`,
              {
                filename: "OrderDataSource.createOrder",
                codeEn: `async createOrder(userId, items) {
  await new Promise(resolve => setTimeout(resolve, 10));

  const totalAmount = items.reduce((sum, item) => {
    return sum + item.price * item.quantity;      // ← it needs price!
  }, 0);

  const newOrder = {
    id: \`order-\${Date.now()}\`,
    userId,
    status: 'PENDING',
    totalAmount,
    items,
    createdAt: new Date().toISOString()
  };

  this.orders.push(newOrder);
  return newOrder;
}`,
                sourceFile:
                  "graphql-federation-practice/node-subgraph/src/dataSources/orderDataSource.js",
                highlight: [5],
              },
            ),
            real(
              "js",
              `async getProductPrice(productId) {
  await new Promise(resolve => setTimeout(resolve, 5));
  const prices = {
    'prod-789': 149.99,
    'prod-101': 89.99,
    'prod-202': 199.99
  };
  return prices[productId] || 99.99;
}`,
              {
                filename: "InventoryDataSource.getProductPrice —— 缺的那块拼图",
                filenameEn:
                  "InventoryDataSource.getProductPrice — the missing piece",
                sourceFile:
                  "graphql-federation-practice/node-subgraph/src/dataSources/orderDataSource.js",
                explanation:
                  "注意它有兜底：未知商品返回 99.99。所以不会出现 undefined。",
                explanationEn:
                  "Note it has a fallback: an unknown product returns 99.99. So you never get undefined.",
              },
            ),
          ],
        },
      ],
      exercises: [
        {
          kind: "recognition",
          id: "g-nullable-return",
          title: "这个 resolver 找不到数据时该返回什么",
          titleEn: "What should this resolver return when it finds nothing",
          level: 1,
          prompt: (
            <p>
              schema 写的是{" "}
              <code>orders(userId: ID!): [Order!]!</code>。
              user 999 没有任何订单。resolver 该返回什么？
            </p>
          ),
          promptEn: (
            <p>
              The schema says <code>orders(userId: ID!): [Order!]!</code>. User
              999 has no orders at all. What should the resolver return?
            </p>
          ),
          options: [
            { id: "a", label: "null" },
            { id: "b", label: "undefined" },
            { id: "c", label: "[]" },
            { id: "d", label: "[null]" },
          ],
          answer: ["c"],
          explain: (
            <>
              <code>[]</code>。<code>[Order!]!</code> 是双重非空：
              列表本身不能为 null，元素也不能为 null。
              <strong>但空列表是合法的</strong> ——
              「没有订单」的正确表达就是空数组。
              <br />
              A / B 会触发 <code>Cannot return null for non-nullable field</code>
              并向上冒泡；D 违反了元素的非空约束。
              <br />
              测试里正好有这一条：
              <code>should return empty array for user with no orders</code>，
              断言 <code>orders.length === 0</code>。
            </>
          ),
          explainEn: (
            <>
              <code>[]</code>. <code>[Order!]!</code> is non-null twice: the
              list itself cannot be null, and neither can an element.{" "}
              <strong>But an empty list is legal</strong> — an empty array is
              the right way to say &ldquo;no orders&rdquo;.
              <br />
              A and B trigger{" "}
              <code>Cannot return null for non-nullable field</code> and the
              error moves upward. D breaks the non-null constraint on the
              elements.
              <br />
              There is a test for exactly this:{" "}
              <code>should return empty array for user with no orders</code>,
              which asserts <code>orders.length === 0</code>.
            </>
          ),
        },
        {
          kind: "recognition",
          id: "g-price-trap",
          title: "createOrder 为什么必须查价格",
          titleEn: "Why createOrder has to look up the price",
          level: 1,
          prompt: (
            <p>
              客户端调{" "}
              <code>createOrder(userId: &quot;789&quot;, items: [{"{ productId: \"prod-789\", quantity: 2 }"}])</code>。
              如果 resolver 把 items 原样交给
              <code>orderDataSource.createOrder</code>，会怎样？
            </p>
          ),
          promptEn: (
            <p>
              The client calls{" "}
              <code>createOrder(userId: &quot;789&quot;, items: [{"{ productId: \"prod-789\", quantity: 2 }"}])</code>
              . What happens if the resolver hands items straight to{" "}
              <code>orderDataSource.createOrder</code>?
            </p>
          ),
          options: [
            { id: "a", label: "正常工作，数据源会自己查价格", labelEn: "It works; the data source looks up the price itself" },
            { id: "b", label: "totalAmount 变成 NaN，因为 item.price 是 undefined", labelEn: "totalAmount becomes NaN, because item.price is undefined" },
            { id: "c", label: "GraphQL 校验阶段就会拒绝这个请求", labelEn: "GraphQL rejects the request during validation" },
            { id: "d", label: "会抛 TypeError", labelEn: "It throws a TypeError" },
          ],
          answer: ["b"],
          explain: (
            <>
              <code>OrderItemInput</code> 里没有 <code>price</code>，
              所以 <code>item.price</code> 是 <code>undefined</code>。
              <code>undefined * 2 = NaN</code>，
              <code>0 + NaN = NaN</code>。
              <br />
              数据源<strong>不会</strong>自己查价格 —— 它只做那一行乘法。
              查价格是 resolver 的责任，用
              <code>inventoryDataSource.getProductPrice(productId)</code>。
              <br />
              C 不对：schema 校验只看 input 的形状，
              客户端确实只该传这两个字段。
            </>
          ),
          explainEn: (
            <>
              <code>OrderItemInput</code> has no <code>price</code>, so{" "}
              <code>item.price</code> is <code>undefined</code>.{" "}
              <code>undefined * 2 = NaN</code>, and{" "}
              <code>0 + NaN = NaN</code>.
              <br />
              The data source does <strong>not</strong> look up the price
              itself — it only does that one multiplication. Looking up the
              price is the resolver&apos;s job, with{" "}
              <code>inventoryDataSource.getProductPrice(productId)</code>.
              <br />
              C is wrong: schema validation only checks the shape of the input,
              and the client really should send just those two fields.
            </>
          ),
        },
        {
          kind: "fill-blank",
          id: "g-nullable-blanks",
          title: "给四个 TODO 各自选对兜底策略",
          titleEn: "Pick the right fallback for each of the four TODOs",
          level: 2,
          prompt: (
            <p>
              照 schema 的非空标记，给每个 resolver 填上正确的返回表达式。
              想清楚「这个字段能不能是 null」。
            </p>
          ),
          promptEn: (
            <p>
              Go by the non-null markers in the schema and write the right
              return expression for each resolver. Decide first whether the
              field is allowed to be null.
            </p>
          ),
          language: "js",
          filename: "src/resolvers/orderResolvers.js",
          sourceFile:
            "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js",
          template: `// schema: orders: [Order!]!
async orders(user, _, { dataSources }) {
  const orders = await dataSources.orderDataSource.getOrdersByUserId(user.id);
  return orders ___1___ [];
}

// schema: shippingInfo: ShippingInfo   （可空）
async shippingInfo(parent, _, { loaders }) {
  const info = await loaders.shippingInfoLoader.load(parent.id);
  return info ?? ___2___;
}

// schema: order(id: ID!): Order   （可空，但题目要求找不到时抛结构化错误）
async order(_, { id }, { loaders, correlationId }) {
  const order = await loaders.orderLoader.load(id);
  if (___3___) {
    throw new GraphQLError(\`Order not found: \${id}\`, {
      extensions: { code: ErrorCodes.ORDER_NOT_FOUND, correlationId }
    });
  }
  return order;
}`,
          blanks: [
            {
              n: 1,
              accept: ["??", "||"],
              hint: "数据源可能返回 undefined，但这个字段不能是 null。",
              hintEn:
                "The data source may return undefined, but this field cannot be null.",
              why: (
                <>
                  <code>??</code>（空值合并运算符）。
                  <code>orders ?? []</code> 的意思是「orders 是 null 或 undefined
                  时用 []」。
                  <br />
                  <code>||</code> 也能用，但语义更宽 ——
                  它连 <code>0</code>、<code>&quot;&quot;</code> 这些假值也会替换。
                  对数组来说没区别，但 <code>??</code> 表达意图更准。
                </>
              ),
              whyEn: (
                <>
                  <code>??</code>, the nullish coalescing operator.{" "}
                  <code>orders ?? []</code> means &ldquo;use [] when orders is
                  null or undefined&rdquo;.
                  <br />
                  <code>||</code> also works, but it means something wider — it
                  replaces falsy values such as <code>0</code> and{" "}
                  <code>&quot;&quot;</code> as well. For an array there is no
                  difference, but <code>??</code> states the intent more
                  precisely.
                </>
              ),
              width: 4,
            },
            {
              n: 2,
              accept: ["null"],
              hint: "ShippingInfo 是可空的，「没有物流信息」怎么表达？",
              hintEn:
                "ShippingInfo is nullable. How do you say there is no shipping info?",
              why: (
                <>
                  <code>null</code>。schema 里
                  <code>shippingInfo: ShippingInfo</code> 没有 <code>!</code>，
                  所以返回 null 是<strong>合法且正确</strong>的。
                  <br />
                  测试直接断言了这一点：
                  <code>should return null for order without shipping info</code>，
                  用 <code>expect(shippingInfo).toBeNull()</code>。
                  <strong>注意是 toBeNull 而不是 toBeUndefined</strong> ——
                  所以必须显式 <code>?? null</code>，不能让 undefined 漏出去。
                </>
              ),
              whyEn: (
                <>
                  <code>null</code>. In the schema,{" "}
                  <code>shippingInfo: ShippingInfo</code> has no{" "}
                  <code>!</code>, so returning null is{" "}
                  <strong>legal and correct</strong>.
                  <br />
                  A test asserts exactly this:{" "}
                  <code>should return null for order without shipping info</code>
                  , using <code>expect(shippingInfo).toBeNull()</code>.{" "}
                  <strong>Note it is toBeNull, not toBeUndefined</strong> — so
                  you must write <code>?? null</code> explicitly and not let
                  undefined through.
                </>
              ),
              width: 6,
            },
            {
              n: 3,
              accept: ["!order"],
              hint: "loader 找不到时返回 undefined。",
              hintEn: "The loader returns undefined when it finds nothing.",
              why: (
                <>
                  <code>!order</code>。<code>orderLoader.load(id)</code>
                  底层调的是 <code>getOrder(id)</code>，
                  它用 <code>find</code> 实现，找不到返回 <code>undefined</code>。
                  <br />
                  <code>Query.order</code> 在 schema 里是可空的，
                  所以直接 <code>return null</code> 也不违反 schema。
                  但 TODO 原文要求
                  <em>structured error handling</em>，所以抛一个带
                  <code>ORDER_NOT_FOUND</code> code 的 GraphQLError 更符合题意。
                </>
              ),
              whyEn: (
                <>
                  <code>!order</code>. Underneath,{" "}
                  <code>orderLoader.load(id)</code> calls{" "}
                  <code>getOrder(id)</code>, which is written with{" "}
                  <code>find</code> and returns <code>undefined</code> when it
                  finds nothing.
                  <br />
                  <code>Query.order</code> is nullable in the schema, so a plain{" "}
                  <code>return null</code> would not break the schema either.
                  But the TODO asks for <em>structured error handling</em>, so
                  throwing a GraphQLError carrying the{" "}
                  <code>ORDER_NOT_FOUND</code> code matches what was asked.
                </>
              ),
              width: 8,
            },
          ],
        },
      ],
      transfer: [
        { signal: "字段类型是 [T!]!", signalEn: "The field type is [T!]!", reachFor: "resolver 必须 ?? [] 兜底，绝不返回 null", reachForEn: "The resolver must fall back with ?? [] and never return null" },
        { signal: "字段类型没有 !", signalEn: "The field type has no !", reachFor: "返回 null 是合法的，但要显式写 ?? null", reachForEn: "Returning null is allowed, but write ?? null explicitly" },
        { signal: "input 里少了某个字段但下游需要它", signalEn: "An input is missing a field that later code needs", reachFor: "resolver 负责补齐，去对应数据源查", reachForEn: "The resolver fills it in by asking the right data source" },
        { signal: "整个 data 变成了 null", signalEn: "The whole data object came back null", reachFor: "某个非空字段返回了 null，往上冒泡了", reachForEn: "Some non-null field returned null and the error moved upward" },
      ],
      recap: [
        "GraphQL 默认可空，加上 ! 才不可空；列表和元素各有自己的可空性。",
        "[Order!]! 的 resolver 必须 ?? [] —— 「没有」的正确表达是空数组。",
        "非空字段返回 null 会向上冒泡，可能让整个 data 变成 null。",
        "shippingInfo 可空，测试断言 toBeNull —— 所以要显式 ?? null，别让 undefined 漏出去。",
        "OrderItemInput 没有 price，而数据源要用它算总价 → resolver 必须先查 getProductPrice。",
      ],
      recapEn: [
        "GraphQL fields are nullable by default; ! makes them non-null. The list and its elements each have their own nullability.",
        "A resolver for [Order!]! must use ?? []. Here an empty array is how you say there is nothing.",
        "When a non-null field returns null the error moves upward and can turn the whole data object into null.",
        "shippingInfo is nullable and the test asserts toBeNull, so write ?? null explicitly and do not let undefined through.",
        "OrderItemInput has no price, but the data source needs it to compute the total, so the resolver must call getProductPrice first.",
      ],
    },
  ],
};

export const fedMentalModel: Module = {
  id: "fed-mental-model",
  stage: "Federation · 第 2 部分",
  title: "Federation 心智模型",
  titleEn: "A mental model for Federation",
  summary:
    "为什么要拆、subgraph 是什么、entity 和 @key 在解决什么问题、Router 怎么把碎片缝起来、DataLoader 为什么必须出现。",
  summaryEn:
    "Why one schema gets split up, what a subgraph is, what problem entity and @key solve, how the Router joins the pieces back into a single schema, and why DataLoader is needed.",
  lessons: [
    /* ---------- 2.1 ---------- */
    {
      id: "g-why-federation",
      title: "为什么会有 Federation",
      titleEn: "Why Federation exists",
      blurb: "一张大 schema 拆成几个服务，代价是什么，换来什么。",
      blurbEn: "One big schema split across several services: what it costs and what you get.",
      minutes: 11,
      objectives: [
        "说清单体 GraphQL 在大团队里的具体痛点",
        "用 Users / Products / Reviews 这个经典例子解释拆分",
        "说清 Federation 相比「客户端自己拼」好在哪",
        "认出本项目里那个不在仓库里的第三方 subgraph",
      ],
      objectivesEn: [
        "Explain the concrete problems one single GraphQL service causes in a large team",
        "Use the standard Users / Products / Reviews example to explain the split",
        "Explain why Federation is better than letting the client join the data itself",
        "Identify the subgraph this project refers to but does not contain",
      ],
      whyForAssessment:
        "书面题 1 直接问「User subgraph 高延迟时如何影响依赖它的 subgraph」。答这道题的前提是理解 Router 的查询计划是串行的。",
      whyForAssessmentEn:
        "Written question 1 asks directly how high latency in the User subgraph affects the subgraphs that depend on it. To answer it you need to know that the Router runs parts of its query plan one after another.",
      concepts: [
        {
          id: "the-pain",
          heading: "单体 GraphQL 的痛点",
          headingEn: "The problems with one single GraphQL service",
          lede: "不是技术问题，是组织问题。",
          ledeEn: "This is not a technical problem. It is an organizational one.",
          body: (
            <>
              <p>
                假设一家公司有账号团队、商品团队、订单团队、物流团队。
                如果只有一个 GraphQL 服务，那么：
              </p>
              <ul>
                <li>
                  <strong>一份 schema 四个团队改。</strong>
                  合并冲突、review 排队、谁都不敢删字段。
                </li>
                <li>
                  <strong>一起发布。</strong>
                  物流团队改一行，整个 API 网关要重新部署；
                  任何一个团队的 bug 会拖垮所有查询。
                </li>
                <li>
                  <strong>技术栈被绑死。</strong>
                  订单团队想用 Java，账号团队想用 Node —— 单体做不到。
                </li>
              </ul>
              <p>
                <strong>Federation 的做法：</strong>
                每个团队维护自己的 <strong>subgraph</strong>
                （一个独立的 GraphQL 服务，有自己的 schema、自己的部署、
                自己的语言），然后由一个 <strong>Router</strong>
                把它们组合成一张对客户端而言完整的
                <strong>supergraph</strong>。
              </p>
              <p>
                <strong>客户端完全看不出背后有几个服务。</strong>
                它眼里就是一张图，
                <code>user</code> 上就是有 <code>orders</code> 字段。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Picture a company with an accounts team, a products team, an
                orders team and a shipping team. With a single GraphQL service:
              </p>
              <ul>
                <li>
                  <strong>Four teams edit one schema.</strong> Merge conflicts,
                  review queues, and nobody dares delete a field.
                </li>
                <li>
                  <strong>They ship together.</strong> The shipping team changes
                  one line and the whole API gateway is redeployed; a bug from
                  any one team drags down every query.
                </li>
                <li>
                  <strong>The stack is locked in.</strong> The orders team wants
                  Java, the accounts team wants Node — a monolith cannot have
                  both.
                </li>
              </ul>
              <p>
                <strong>What Federation does:</strong> every team keeps its own{" "}
                <strong>subgraph</strong> (an independent GraphQL service with
                its own schema, its own deploys, its own language), and one{" "}
                <strong>Router</strong> composes them into a single{" "}
                <strong>supergraph</strong> that looks whole to the client.
              </p>
              <p>
                <strong>The client cannot tell how many services sit behind
                it.</strong> It sees one graph, where <code>user</code> simply
                has an <code>orders</code> field.
              </p>
            </>
          ),
        },
        {
          id: "classic-example",
          heading: "经典例子：Users / Products / Reviews",
          headingEn: "The standard example: Users / Products / Reviews",
          body: (
            <>
              <p>
                这是 Apollo 官方文档用了很多年的例子，值得记住：
              </p>
              <p>
                关键在 <code>Review</code> 那一行：
                <strong>Reviews 服务需要说「这条评论是谁写的、评的哪个商品」</strong>，
                但它自己没有用户表和商品表。它只有 id。
              </p>
              <p>
                Federation 的答案是：Reviews 服务在自己的 schema 里
                <strong>声明一个只有 id 的 User 和 Product</strong>，
                标上 <code>@key</code>，剩下的字段（name、price）
                由 Router 去对应的 subgraph 补齐。
              </p>
              <p>
                <strong>本项目就是这个模式的一半。</strong>
                <code>node-subgraph</code> 是「Orders 服务」，
                它需要往 <code>User</code> 上挂一个 <code>orders</code> 字段，
                但它不拥有 User。所以它的 schema 里有：
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Apollo&rsquo;s own docs have leaned on this example for years.
                Keep it in your head:
              </p>
              <p>
                The line that matters is <code>Review</code>:{" "}
                <strong>the Reviews service has to say who wrote a review and
                which product it is about</strong>, but it has no user table and
                no product table. All it has is ids.
              </p>
              <p>
                Federation&rsquo;s answer: the Reviews service{" "}
                <strong>declares a User and a Product that carry nothing but an
                id</strong> in its own schema, marks them with{" "}
                <code>@key</code>, and lets the Router fill the remaining fields
                (name, price) from the subgraphs that own them.
              </p>
              <p>
                <strong>This project is one half of that pattern.</strong>{" "}
                <code>node-subgraph</code> is the &ldquo;Orders
                service&rdquo;. It needs to hang an <code>orders</code> field
                off <code>User</code>, but it does not own User. So its schema
                contains:
              </p>
            </>
          ),
          code: [
            demo(
              "text",
              `Accounts 服务          Products 服务          Reviews 服务
─────────────          ─────────────          ─────────────
type User {            type Product {         type Review {
  id                     id                     id
  name                   name                   body
  email                  price                  author: User    ← 别人的类型
}                      }                        product: Product ← 别人的类型
                                              }

客户端看到的（supergraph）：
type User { id name email reviews: [Review] }
type Product { id name price reviews: [Review] }
type Review { id body author: User product: Product }`,
              // 这张图是纯 ASCII 排版，没有注释也没有字符串 —— 译了就过不了
              // audit:code 的「代码结构必须一致」那一关，所以只给标题配英文。
              {
                filename: "三个服务，一张图",
                filenameEn: "Three services, one picture",
              },
            ),
            real(
              "graphql",
              `type User @key(fields: "id") {
  id: ID! @external      # 「id 由别的 subgraph 提供，我只是引用」
  orders: [Order!]!      # 「orders 是我贡献的字段」
}`,
              {
                filename: "本项目里的同一个模式",
                filenameEn: "The same pattern in this project",
                codeEn: `type User @key(fields: "id") {
  id: ID! @external      # "another subgraph owns id; I only reference it"
  orders: [Order!]!      # "orders is the field I contribute"
}`,
                sourceFile:
                  "graphql-federation-practice/node-subgraph/src/schema.graphql",
                explanation:
                  "orderResolvers.js 的注释原文写着「extend User entity from Accounts subgraph」—— 那个 Accounts subgraph 不在这个仓库里，但 schema 已经在跟它对话了。",
                explanationEn:
                  "The comment in orderResolvers.js reads \"extend User entity from Accounts subgraph\". That Accounts subgraph is not in this repository, but the schema is already talking to it.",
              },
            ),
          ],
        },
        {
          id: "vs-client-side",
          heading: "为什么不让客户端自己拼",
          headingEn: "Why not let the client join the data itself",
          body: (
            <>
              <p>
                客户端也可以先请求 Accounts 拿 user，再请求 Orders 拿订单，
                自己拼起来。为什么要 Router?
              </p>
              <ul>
                <li>
                  <strong>往返次数。</strong>
                  客户端拼需要 N 次网络往返（而且往往是串行的，
                  因为第二个请求需要第一个的 id）。Router 在
                  <strong>数据中心内部</strong>完成这些跳转，
                  客户端只发一次请求。移动网络下这个差别是几百毫秒。
                </li>
                <li>
                  <strong>一致的类型系统。</strong>
                  客户端不需要知道「哪个字段在哪个服务」——
                  这个知识是会变的（服务拆分/合并），
                  写进客户端就等于每次后端重构都要发新版 App。
                </li>
                <li>
                  <strong>统一的横切关注点。</strong>
                  鉴权、限流、缓存、可观测性在 Router 这一层做一次就行。
                </li>
              </ul>
              <p>
                <strong>代价</strong>也要说清楚：多了一跳（Router 本身的延迟）、
                查询计划可能是串行的（下一节会展开）、
                组合失败会让整个 supergraph 起不来。
                <strong>书面题 1 问的就是这里的第二条。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                A client could just as well call Accounts for the user, then
                call Orders for the orders, and stitch them together itself. So
                why a Router?
              </p>
              <ul>
                <li>
                  <strong>Round trips.</strong> Stitching on the client costs N
                  network round trips (usually serial ones, since the second
                  request needs an id from the first). The Router makes those
                  hops <strong>inside the data centre</strong> and the client
                  sends one request. On a mobile network that difference is
                  hundreds of milliseconds.
                </li>
                <li>
                  <strong>One consistent type system.</strong> The client does
                  not need to know which field lives in which service — that
                  knowledge changes (services split and merge), and baking it
                  into the client means shipping a new app build after every
                  backend refactor.
                </li>
                <li>
                  <strong>Cross-cutting concerns in one place.</strong> Auth,
                  rate limiting, caching and observability are done once, at the
                  Router.
                </li>
              </ul>
              <p>
                Be straight about the <strong>cost</strong> too: one extra hop
                (the Router&rsquo;s own latency), query plans that may run
                serially (the next lesson expands on this), and a failed
                composition that keeps the whole supergraph from starting.{" "}
                <strong>Written question 1 is asking about the second
                one.</strong>
              </p>
            </>
          ),
        },
        {
          id: "not-in-repo",
          heading: "本项目里哪些东西不在仓库里",
          headingEn: "What this project refers to but does not contain",
          lede: "这一点必须诚实说清楚，否则你会花时间找不存在的文件。",
          ledeEn: "This has to be said plainly, or you will spend time looking for files that do not exist.",
          body: (
            <>
              <p>审计确认的事实：</p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>东西</th>
                      <th>在仓库里吗</th>
                      <th>怎么知道它存在</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Orders subgraph</td>
                      <td>✅ 就是 <code>node-subgraph/</code></td>
                      <td>—</td>
                    </tr>
                    <tr>
                      <td>Accounts subgraph（拥有 User）</td>
                      <td>❌ 不在</td>
                      <td>
                        schema 里 <code>User.id</code> 标了
                        <code>@external</code>；resolver 注释写了
                        <em>from Accounts subgraph</em>
                      </td>
                    </tr>
                    <tr>
                      <td>Router / Gateway</td>
                      <td>❌ 不在</td>
                      <td>
                        没有 <code>supergraph.yaml</code>、没有 rover、
                        没有 <code>@apollo/gateway</code> 依赖
                      </td>
                    </tr>
                    <tr>
                      <td>java-service（REST）</td>
                      <td>✅ 在，但<strong>不是 subgraph</strong></td>
                      <td>
                        纯 Spring Web REST，没有任何 GraphQL 依赖；
                        subgraph 也不调它（用的是 mock 数据源）
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>所以 java-service 和 node-subgraph 在代码层面毫无关联。</strong>
                它们是同一场考试的两道题，共享 Order 这个领域概念和
                correlation-id 这套可观测性思路，但不互相调用。
                <strong>别去找那个不存在的 HTTP client。</strong>
              </p>
              <p>
                <strong>那怎么在本地验证 Federation 部分？</strong>
                两个办法，下一节会实际用：
                查询 <code>{"{ _service { sdl } }"}</code> 拿 federation SDL，
                以及直接调 <code>_entities</code> ——
                这两个正是 Router 会对你的 subgraph 发的请求。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>Facts confirmed by the audit:</p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Thing</th>
                      <th>In the repo?</th>
                      <th>How you know it exists</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Orders subgraph</td>
                      <td>✅ it is <code>node-subgraph/</code></td>
                      <td>—</td>
                    </tr>
                    <tr>
                      <td>Accounts subgraph (the one that owns User)</td>
                      <td>❌ not here</td>
                      <td>
                        the schema marks <code>User.id</code> as{" "}
                        <code>@external</code>; a resolver comment says{" "}
                        <em>from Accounts subgraph</em>
                      </td>
                    </tr>
                    <tr>
                      <td>Router / Gateway</td>
                      <td>❌ not here</td>
                      <td>
                        no <code>supergraph.yaml</code>, no rover, no{" "}
                        <code>@apollo/gateway</code> dependency
                      </td>
                    </tr>
                    <tr>
                      <td>java-service (REST)</td>
                      <td>✅ here, but <strong>not a subgraph</strong></td>
                      <td>
                        plain Spring Web REST with no GraphQL dependency at all;
                        the subgraph never calls it either (it uses mock data
                        sources)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>So java-service and node-subgraph have no connection at
                the code level.</strong> They are two questions in one exam that
                share the Order domain concept and the correlation-id approach
                to observability, but they never call each other.{" "}
                <strong>Do not go hunting for that HTTP client.</strong>
              </p>
              <p>
                <strong>Then how do you verify the Federation part
                locally?</strong> Two ways, both used in the next lesson: query{" "}
                <code>{"{ _service { sdl } }"}</code> for the federation SDL, and
                call <code>_entities</code> directly — those two are exactly the
                requests the Router would send your subgraph.
              </p>
            </>
          ),
        },
      ],
      exercises: [
        {
          kind: "recognition",
          id: "g-fed-why",
          title: "Federation 主要解决的是什么问题",
          titleEn: "What problem does Federation mainly solve",
          level: 1,
          prompt: <p>下面哪一条最准确地描述了 Federation 要解决的核心问题？</p>,
          promptEn: (
            <p>
              Which of these describes most accurately the core problem
              Federation sets out to solve?
            </p>
          ),
          options: [
            { id: "a", label: "让 GraphQL 查询跑得更快", labelEn: "Making GraphQL queries run faster" },
            { id: "b", label: "让多个团队各自独立开发、部署、选技术栈，同时对客户端呈现一张完整的图", labelEn: "Letting several teams build, deploy and choose their stack independently, while the client still sees one complete graph" },
            { id: "c", label: "替代 REST", labelEn: "Replacing REST" },
            { id: "d", label: "减少数据库查询次数", labelEn: "Cutting down the number of database queries" },
          ],
          answer: ["b"],
          explain: (
            <>
              Federation 首先是一个<strong>组织问题的技术方案</strong>：
              schema 所有权的拆分。
              <br />
              A 恰恰相反 —— 多一跳 Router、可能串行的查询计划，
              单次查询通常<strong>更慢</strong>。
              <br />
              D 是 DataLoader 解决的问题，和 Federation 是两件事
              （虽然这个项目里两者都考）。
            </>
          ),
          explainEn: (
            <>
              Federation is first of all a{" "}
              <strong>technical answer to an organizational problem</strong>:
              splitting up who owns which part of the schema.
              <br />
              A is the opposite of the truth — one extra Router hop and a query
              plan that may run its steps one after another usually make a
              single query <strong>slower</strong>.
              <br />
              D is what DataLoader solves. That is a separate matter from
              Federation, even though this project covers both.
            </>
          ),
        },
        {
          kind: "recognition",
          id: "g-not-in-repo",
          title: "哪些东西不在这个仓库里",
          titleEn: "What is not in this repository",
          level: 1,
          prompt: <p>下面哪些是这个 assessment 仓库里<strong>没有</strong>的？（多选）</p>,
          promptEn: (
            <p>
              Which of these are <strong>not</strong> in this exam repository?
              (Select all that apply.)
            </p>
          ),
          options: [
            { id: "a", label: "Router / Gateway 的配置（supergraph.yaml 之类）", labelEn: "Router or Gateway configuration, such as a supergraph.yaml" },
            { id: "b", label: "拥有 User 类型的 Accounts subgraph", labelEn: "The Accounts subgraph that owns the User type" },
            { id: "c", label: "node-subgraph 的 schema.graphql", labelEn: "The schema.graphql of node-subgraph" },
            { id: "d", label: "subgraph 调用 java-service 的 HTTP client", labelEn: "An HTTP client the subgraph uses to call java-service" },
          ],
          answer: ["a", "b", "d"],
          explain: (
            <>
              A、B、D 都不在。
              <br />
              A：没有 supergraph 配置，也没有 <code>@apollo/gateway</code> 依赖。
              <br />
              B：只在 schema 里通过 <code>@external</code> 被引用。
              <br />
              D：<strong>subgraph 用的是 mock 数据源</strong>，
              不发 HTTP 到 8080。两个服务在代码层面无关联 ——
              别浪费时间找它。
              <br />
              C 在，而且是你必须精读的文件。
            </>
          ),
          explainEn: (
            <>
              A, B and D are all missing.
              <br />
              A: there is no supergraph configuration and no{" "}
              <code>@apollo/gateway</code> dependency.
              <br />
              B: it is only referenced from the schema, through{" "}
              <code>@external</code>.
              <br />
              D: <strong>the subgraph uses mock data sources</strong> and sends
              no HTTP to port 8080. The two services are unrelated in code, so
              do not spend time looking for it.
              <br />
              C is there, and it is the file you have to read closely.
            </>
          ),
        },
      ],
      transfer: [
        { signal: "「多团队共享一个 API」", signalEn: "Several teams share one API", reachFor: "Federation：各自 subgraph + Router 组合", reachForEn: "Federation: one subgraph per team, combined by a Router" },
        { signal: "「我这个服务要引用别人的类型」", signalEn: "Your service needs to refer to a type owned by another service", reachFor: "声明一个只有 @key 字段的类型，标 @external", reachForEn: "Declare that type with only its @key field and mark the field @external" },
        { signal: "找不到某个「应该存在」的文件", signalEn: "You cannot find a file that seems like it should exist", reachFor: "先确认它是不是本来就不在仓库里", reachForEn: "First check whether it was ever in the repository" },
        { signal: "书面题问「某个 subgraph 慢了会怎样」", signalEn: "A written question asks what happens when one subgraph is slow", reachFor: "从「查询计划可能串行」入手", reachForEn: "Start from the fact that the query plan may run steps one after another" },
      ],
      recap: [
        "Federation 首先解决的是 schema 所有权的组织问题，不是性能问题。",
        "每个 subgraph 独立部署、可用不同语言；Router 组合成一张 supergraph。",
        "本仓库只有 Orders subgraph；Accounts subgraph 和 Router 都不在。",
        "java-service 是纯 REST，不是 subgraph，也不被 subgraph 调用。",
        "本地验证 Federation 的两个办法：{ _service { sdl } } 和 _entities 查询。",
      ],
      recapEn: [
        "Federation first solves an organizational problem about who owns which part of the schema, not a performance problem.",
        "Each subgraph deploys on its own and can use a different language. The Router combines them into one supergraph.",
        "This repository contains only the Orders subgraph. The Accounts subgraph and the Router are not here.",
        "java-service is plain REST. It is not a subgraph, and no subgraph calls it.",
        "Two ways to check Federation locally: the { _service { sdl } } query and the _entities query.",
      ],
    },

    /* ---------- 2.2 ---------- */
    {
      id: "g-subgraph",
      title: "subgraph 是怎么跑起来的",
      titleEn: "How a subgraph starts up",
      blurb: "buildSubgraphSchema 做了什么，为什么它会凭空多出两个字段。",
      blurbEn: "What buildSubgraphSchema does, and why two fields appear that you never wrote.",
      minutes: 13,
      objectives: [
        "读懂 index.js 的启动流程",
        "说清 buildSubgraphSchema 和普通 makeExecutableSchema 的区别",
        "知道 _service 和 _entities 这两个字段从哪来",
        "会用进程内方式验证 subgraph（不需要起服务器）",
      ],
      objectivesEn: [
        "Read the startup flow in index.js",
        "Explain the difference between buildSubgraphSchema and plain makeExecutableSchema",
        "Know where the two fields _service and _entities come from",
        "Check a subgraph from inside the same process, with no server running",
      ],
      whyForAssessment:
        "启动流程决定了 context 长什么样（你的 resolver 全靠它）。而 _service / _entities 是本地唯一能验证 federation 部分的手段。",
      whyForAssessmentEn:
        "The startup flow decides what context looks like, and every resolver you write depends on it. _service and _entities are the only way to check the Federation part locally.",
      sourceFiles: [
        {
          path: "graphql-federation-practice/node-subgraph/src/index.js",
          role: "启动流程与 context 构造",
        },
        {
          path: "graphql-federation-practice/node-subgraph/package.json",
          role: "start / test script 与 federation 依赖",
        },
      ],
      concepts: [
        {
          id: "boot-sequence",
          heading: "启动的五步",
          headingEn: "The five startup steps",
          body: (
            <>
              <ol>
                <li>
                  <strong>读 schema 文件。</strong>
                  <code>readFileSync(join(__dirname, &apos;schema.graphql&apos;))</code>，
                  然后 <code>gql(...)</code> 把字符串解析成 AST。
                  <br />
                  （<code>__dirname</code> 在 ESM 里不是内置的，
                  所以上面用 <code>fileURLToPath(import.meta.url)</code>
                  手动算了一个 —— 这是 ESM 项目的标准写法。）
                </li>
                <li>
                  <strong>组装 schema。</strong>
                  <code>buildSubgraphSchema([{"{ typeDefs, resolvers }"}])</code>
                  —— 这是 federation 的关键一步，下一段细说。
                </li>
                <li>
                  <strong>建 ApolloServer</strong>，带一个
                  <code>formatError</code> 钩子，把错误的 message / code /
                  path / correlationId 打到服务端日志。
                </li>
                <li>
                  <strong>起服务器</strong>，监听 4000。
                </li>
                <li>
                  <strong>每个请求构造 context</strong>（上一模块讲过）。
                </li>
              </ol>
              <p>
                <code>formatError</code> 那段值得注意：它<strong>原样返回</strong>
                <code>formattedError</code>，只是顺手打了日志。
                也就是说<strong>你在 resolver 里放进
                <code>extensions</code> 的东西会被客户端看到</strong> ——
                这是「结构化错误」能起作用的前提。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <ol>
                <li>
                  <strong>Read the schema file.</strong>{" "}
                  <code>readFileSync(join(__dirname, &apos;schema.graphql&apos;))</code>,
                  then <code>gql(...)</code> parses that string into an AST.
                  <br />
                  (<code>__dirname</code> is not built in under ESM, so the code
                  above computes one by hand with{" "}
                  <code>fileURLToPath(import.meta.url)</code> — the standard move
                  in an ESM project.)
                </li>
                <li>
                  <strong>Assemble the schema.</strong>{" "}
                  <code>buildSubgraphSchema([{"{ typeDefs, resolvers }"}])</code>{" "}
                  — the key federation step, covered in the next section.
                </li>
                <li>
                  <strong>Create the ApolloServer</strong> with a{" "}
                  <code>formatError</code> hook that logs each error&rsquo;s
                  message, code, path and correlationId on the server side.
                </li>
                <li>
                  <strong>Start the server</strong>, listening on 4000.
                </li>
                <li>
                  <strong>Build a context for every request</strong> (covered in
                  the previous module).
                </li>
              </ol>
              <p>
                That <code>formatError</code> block deserves a close look: it{" "}
                <strong>returns <code>formattedError</code> unchanged</strong>{" "}
                and only logs on the way past. Which means{" "}
                <strong>whatever you put into <code>extensions</code> inside a
                resolver reaches the client</strong> — the precondition for
                &ldquo;structured errors&rdquo; doing any good at all.
              </p>
            </>
          ),
        },
        {
          id: "build-subgraph-schema",
          heading: "buildSubgraphSchema 凭空加了两个字段",
          headingEn: "buildSubgraphSchema adds two fields you never wrote",
          lede: "这是 subgraph 和普通 GraphQL 服务唯一的技术差别。",
          ledeEn: "This is the only technical difference between a subgraph and a plain GraphQL service.",
          body: (
            <>
              <p>
                普通 GraphQL 服务用 <code>makeExecutableSchema</code>。
                subgraph 用 <code>buildSubgraphSchema</code>
                （来自 <code>@apollo/subgraph</code>）。
                后者多做三件事：
              </p>
              <ol>
                <li>
                  <strong>认识 federation 的 directive</strong>：
                  <code>@key</code>、<code>@external</code>、
                  <code>@shareable</code> 等。
                  普通 schema 遇到它们会报「未知指令」。
                </li>
                <li>
                  <strong>自动加一个 <code>_service</code> 字段</strong>，
                  返回本 subgraph 的 federation SDL。
                  Router 启动时就是靠查这个字段来收集 schema 的。
                </li>
                <li>
                  <strong>自动加一个 <code>_entities</code> 字段</strong>，
                  接收一批 entity representation，返回对应的对象。
                  Router 在运行时靠它做跨服务的实体解析。
                </li>
              </ol>
              <p>
                <strong>这两个字段你不用写，也不该写。</strong>
                但你要知道它们存在 —— 因为它们是本地验证 federation 的唯一入口。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                A plain GraphQL service uses <code>makeExecutableSchema</code>. A
                subgraph uses <code>buildSubgraphSchema</code> (from{" "}
                <code>@apollo/subgraph</code>). The second one does three extra
                things:
              </p>
              <ol>
                <li>
                  <strong>It understands the federation directives</strong>:{" "}
                  <code>@key</code>, <code>@external</code>,{" "}
                  <code>@shareable</code> and friends. A plain schema reports
                  them as unknown directives.
                </li>
                <li>
                  <strong>It adds a <code>_service</code> field for you</strong>,
                  returning this subgraph&rsquo;s federation SDL. That field is
                  how the Router collects schemas at startup.
                </li>
                <li>
                  <strong>It adds an <code>_entities</code> field for
                  you</strong>, which takes a batch of entity representations and
                  returns the matching objects. The Router uses it at runtime for
                  cross-service entity resolution.
                </li>
              </ol>
              <p>
                <strong>You do not write those two fields, and you should
                not.</strong> But you need to know they are there — they are the
                only door into verifying federation locally.
              </p>
            </>
          ),
          code: [
            real(
              "js",
              `import { buildSubgraphSchema } from '@apollo/subgraph';

const typeDefs = gql(readFileSync(join(__dirname, 'schema.graphql'), { encoding: 'utf-8' }));
const schema = buildSubgraphSchema([{ typeDefs, resolvers }]);`,
              {
                filename: "关键的两行",
                filenameEn: "The two lines that matter",
                sourceFile:
                  "graphql-federation-practice/node-subgraph/src/index.js",
              },
            ),
          ],
        },
        {
          id: "verify-locally",
          heading: "本地验证：两种办法",
          headingEn: "Checking it locally: two ways",
          lede: "审计时端口 4000 被占，所以我用了第二种 —— 它其实更好用。",
          ledeEn: "During the audit port 4000 was taken, so I used the second way. It turns out to be the more useful one.",
          body: (
            <>
              <p>
                <strong>办法一：起服务器 + curl。</strong>
                <code>npm start</code> 之后服务器在 4000，
                <code>index.js</code> 最后还贴心地打印了 SDL 的查询地址。
              </p>
              <p>
                <strong>办法二：进程内执行，不起服务器。</strong>
                直接用 <code>buildSubgraphSchema</code> 造出 schema，
                再用 <code>graphql()</code> 执行查询。
                <strong>好处是不占端口、不需要等服务器起来、
                可以在一个脚本里跑一串查询。</strong>
              </p>
              <p>
                下面这个脚本是审计时我实际写的验证工具。
                它把 federation 的关键路径全跑了一遍 ——
                包括 <code>_entities</code>，也就是 Router 会发的那个请求。
                <strong>做完 Task 1 之后强烈建议你也写一个类似的。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>Way one: start the server and curl it.</strong> After{" "}
                <code>npm start</code> the server is on 4000, and{" "}
                <code>index.js</code> even prints the URL that queries the SDL.
              </p>
              <p>
                <strong>Way two: execute in-process, no server at all.</strong>{" "}
                Build the schema with <code>buildSubgraphSchema</code> and run
                queries through <code>graphql()</code>. <strong>No port to
                occupy, no waiting for a server to come up, and you can run a
                whole series of queries from one script.</strong>
              </p>
              <p>
                The script below is the verification tool I actually wrote during
                the audit. It walks every important federation path — including{" "}
                <code>_entities</code>, the request the Router would send.{" "}
                <strong>After you finish Task 1, write yourself something like
                it.</strong>
              </p>
            </>
          ),
          code: [
            real(
              "bash",
              `cd node-subgraph
npm install
npm start
# → Subgraph ready at http://0.0.0.0:4000/
# → Federation SDL available at http://0.0.0.0:4000/?query={_service{sdl}}

# 另一个终端：
curl -X POST http://localhost:4000/ \\
  -H 'Content-Type: application/json' \\
  -d '{"query":"{ _service { sdl } }"}'`,
              {
                filename: "办法一",
                filenameEn: "Way one",
                codeEn: `cd node-subgraph
npm install
npm start
# → Subgraph ready at http://0.0.0.0:4000/
# → Federation SDL available at http://0.0.0.0:4000/?query={_service{sdl}}

# In another terminal:
curl -X POST http://localhost:4000/ \\
  -H 'Content-Type: application/json' \\
  -d '{"query":"{ _service { sdl } }"}'`,
              },
            ),
            real(
              "js",
              `// verify-schema.mjs —— 放在 node-subgraph/ 下，node verify-schema.mjs
import { buildSubgraphSchema } from '@apollo/subgraph';
import { graphql } from 'graphql';
import gql from 'graphql-tag';
import { readFileSync } from 'fs';
import { resolvers, createShippingInfoLoader, createOrderLoader } from './src/resolvers/orderResolvers.js';
import { OrderDataSource, InventoryDataSource, ShippingDataSource } from './src/dataSources/orderDataSource.js';

const typeDefs = gql(readFileSync('./src/schema.graphql', 'utf-8'));
const schema = buildSubgraphSchema([{ typeDefs, resolvers }]);

function ctx() {
  const orderDataSource = new OrderDataSource();
  const inventoryDataSource = new InventoryDataSource();
  const shippingDataSource = new ShippingDataSource();
  return {
    dataSources: { orderDataSource, inventoryDataSource, shippingDataSource },
    loaders: {
      shippingInfoLoader: createShippingInfoLoader(shippingDataSource),
      orderLoader: createOrderLoader(orderDataSource),
    },
    correlationId: 'verify-1',
  };
}

const run = (source, variableValues) =>
  graphql({ schema, source, contextValue: ctx(), variableValues });

// ① federation SDL 出得来吗
const sdl = await run('{ _service { sdl } }');
console.log('SDL:', !!sdl.data?._service?.sdl, '| errors:', sdl.errors?.length ?? 0);

// ② 普通查询
const q1 = await run('{ orders(userId:"123") { id status shippingInfo { status } } }');
console.log('orders:', JSON.stringify(q1.data), q1.errors ?? '');

// ③ Router 会发的那个请求：_entities
const q2 = await run(
  'query($r:[_Any!]!){ _entities(representations:$r) { ... on User { id orders { id } } } }',
  { r: [{ __typename: 'User', id: '123' }] }
);
console.log('_entities:', JSON.stringify(q2.data), q2.errors ?? '');`,
              {
                filename: "办法二（审计时实际用的脚本）",
                filenameEn: "Way two (the script actually used in the audit)",
                codeEn: `// verify-schema.mjs — put it in node-subgraph/, run: node verify-schema.mjs
import { buildSubgraphSchema } from '@apollo/subgraph';
import { graphql } from 'graphql';
import gql from 'graphql-tag';
import { readFileSync } from 'fs';
import { resolvers, createShippingInfoLoader, createOrderLoader } from './src/resolvers/orderResolvers.js';
import { OrderDataSource, InventoryDataSource, ShippingDataSource } from './src/dataSources/orderDataSource.js';

const typeDefs = gql(readFileSync('./src/schema.graphql', 'utf-8'));
const schema = buildSubgraphSchema([{ typeDefs, resolvers }]);

function ctx() {
  const orderDataSource = new OrderDataSource();
  const inventoryDataSource = new InventoryDataSource();
  const shippingDataSource = new ShippingDataSource();
  return {
    dataSources: { orderDataSource, inventoryDataSource, shippingDataSource },
    loaders: {
      shippingInfoLoader: createShippingInfoLoader(shippingDataSource),
      orderLoader: createOrderLoader(orderDataSource),
    },
    correlationId: 'verify-1',
  };
}

const run = (source, variableValues) =>
  graphql({ schema, source, contextValue: ctx(), variableValues });

// ① does the federation SDL come out
const sdl = await run('{ _service { sdl } }');
console.log('SDL:', !!sdl.data?._service?.sdl, '| errors:', sdl.errors?.length ?? 0);

// ② a plain query
const q1 = await run('{ orders(userId:"123") { id status shippingInfo { status } } }');
console.log('orders:', JSON.stringify(q1.data), q1.errors ?? '');

// ③ the request the Router will send: _entities
const q2 = await run(
  'query($r:[_Any!]!){ _entities(representations:$r) { ... on User { id orders { id } } } }',
  { r: [{ __typename: 'User', id: '123' }] }
);
console.log('_entities:', JSON.stringify(q2.data), q2.errors ?? '');`,
                collapsible: true,
                explanation:
                  "注意 _entities 的参数类型是 [_Any!]!，每个 representation 必须带 __typename 和 @key 声明的字段。这段脚本在审计时真实跑通了全部三项。",
                explanationEn:
                  "Note the argument type of _entities is [_Any!]!, and every representation must carry __typename plus the fields named in @key. This script really ran all three checks during the audit.",
              },
            ),
            real(
              "text",
              `$ node verify-schema.mjs

== SDL emitted: true | errors: 0
== SDL has @key: true
== Query.orders + Order.shippingInfo: {"orders":[
     {"id":"order-456","status":"SHIPPED","totalAmount":299.99,
      "shippingInfo":{"status":"IN_TRANSIT","trackingNumber":"TRACK123456"}},
     {"id":"order-457","status":"DELIVERED","totalAmount":89.99,
      "shippingInfo":{"status":"DELIVERED","trackingNumber":"TRACK123457"}}]} | errors: []
== Query.order not found code: [ 'ORDER_NOT_FOUND' ]
== _entities User.orders: {"_entities":[{"id":"123","orders":[
     {"id":"order-456","status":"SHIPPED"},{"id":"order-457","status":"DELIVERED"}]}]} | errors: []
== Mutation.createOrder: {"createOrder":{"id":"order-1785737900978","userId":"789",
     "status":"PENDING","totalAmount":299.98,
     "items":[{"productId":"prod-789","quantity":2,"price":149.99}]}} | errors: []
== createOrder empty items code: [ 'INVALID_INPUT' ]`,
              {
                filename: "审计时的真实输出（参考解法下）",
                filenameEn:
                  "The real output from the audit (with the reference answer)",
                explanation:
                  "这是 DrillLab 用来确认参考答案正确的证据。做完 Task 1 之后，你的实现应该能得到同样的输出。",
                explanationEn:
                  "This is the evidence DrillLab used to confirm the reference answer is right. After you finish Task 1, your implementation should print the same thing.",
              },
            ),
          ],
        },
        {
          id: "esm-details",
          heading: "两个 ESM 细节",
          headingEn: "Two ESM details",
          body: (
            <>
              <ul>
                <li>
                  <strong>import 要带 <code>.js</code>。</strong>
                  <code>from &apos;./resolvers/orderResolvers.js&apos;</code> ——
                  这个项目是原生 ESM（<code>&quot;type&quot;: &quot;module&quot;</code>），
                  不走打包器，所以扩展名必须写。Foundations 那门课有个
                  Debug Lab 专门练这个。
                </li>
                <li>
                  <strong>顶层 await 可以用。</strong>
                  <code>const {"{ url }"} = await startStandaloneServer(...)</code>
                  写在模块顶层 —— 这是 ESM 才有的能力，CommonJS 里做不到。
                </li>
              </ul>
              <p>
                另外注意 <code>npm test</code> 那条 script 里的
                <code>NODE_OPTIONS=--experimental-vm-modules</code> ——
                jest 要跑 ESM 就得带上它。这些配置不用你改，但要认得。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <ul>
                <li>
                  <strong>Imports need the <code>.js</code>.</strong>{" "}
                  <code>from &apos;./resolvers/orderResolvers.js&apos;</code> —
                  this project is native ESM
                  (<code>&quot;type&quot;: &quot;module&quot;</code>) with no
                  bundler, so the extension is mandatory. The Foundations course
                  has a Debug Lab just for this.
                </li>
                <li>
                  <strong>Top-level await works.</strong>{" "}
                  <code>const {"{ url }"} = await startStandaloneServer(...)</code>{" "}
                  sits at module top level — an ESM-only ability, impossible in
                  CommonJS.
                </li>
              </ul>
              <p>
                Also notice the{" "}
                <code>NODE_OPTIONS=--experimental-vm-modules</code> in that{" "}
                <code>npm test</code> script — jest needs it to run ESM. None of
                this config is yours to change, but you should recognise it.
              </p>
            </>
          ),
        },
      ],
      exercises: [
        {
          kind: "recognition",
          id: "g-build-subgraph",
          title: "_entities 这个字段是谁加的",
          titleEn: "Who adds the _entities field",
          level: 1,
          prompt: (
            <p>
              <code>schema.graphql</code> 里从头到尾没有出现
              <code>_entities</code>，但 Router 能查它。它从哪来？
            </p>
          ),
          promptEn: (
            <p>
              <code>_entities</code> appears nowhere in{" "}
              <code>schema.graphql</code>, yet the Router can query it. Where
              does it come from?
            </p>
          ),
          options: [
            { id: "a", label: "需要自己在 schema.graphql 里加", labelEn: "You have to add it to schema.graphql yourself" },
            { id: "b", label: "buildSubgraphSchema 自动加的", labelEn: "buildSubgraphSchema adds it for you" },
            { id: "c", label: "ApolloServer 加的", labelEn: "ApolloServer adds it" },
            { id: "d", label: "Router 注入的", labelEn: "The Router injects it" },
          ],
          answer: ["b"],
          explain: (
            <>
              <code>buildSubgraphSchema</code>（来自
              <code>@apollo/subgraph</code>）在组装 schema 时
              自动加上 <code>_service</code> 和 <code>_entities</code>
              两个字段，以及 federation 的各种 directive 定义。
              <br />
              这也是它和普通 <code>makeExecutableSchema</code> 的核心区别。
              <strong>你不用写，也不该写。</strong>
            </>
          ),
          explainEn: (
            <>
              <code>buildSubgraphSchema</code>, from{" "}
              <code>@apollo/subgraph</code>, adds the two fields{" "}
              <code>_service</code> and <code>_entities</code> while it
              assembles the schema, along with the federation directive
              definitions.
              <br />
              That is also the main difference between it and a plain{" "}
              <code>makeExecutableSchema</code>.{" "}
              <strong>You do not write those fields, and you should
              not.</strong>
            </>
          ),
        },
        {
          kind: "recognition",
          id: "g-verify-how",
          title: "本地怎么验证 federation 部分",
          titleEn: "How to check the Federation part locally",
          level: 1,
          prompt: (
            <p>
              仓库里没有 Router。你想确认自己的 <code>User.orders</code>
              在 federation 链路里能被正确调用。最直接的办法？
            </p>
          ),
          promptEn: (
            <p>
              There is no Router in the repository. You want to confirm your{" "}
              <code>User.orders</code> is called correctly along the federation
              path. What is the most direct way?
            </p>
          ),
          options: [
            { id: "a", label: "只能等提交后由判卷系统验证", labelEn: "You cannot; you have to submit and let the grader check it" },
            { id: "b", label: "自己装 @apollo/gateway 搭一个 Router", labelEn: "Install @apollo/gateway yourself and stand up a Router" },
            { id: "c", label: "直接查 _entities 字段，传一个 { __typename: \"User\", id: \"123\" } 的 representation", labelEn: "Query the _entities field directly, passing a { __typename: \"User\", id: \"123\" } representation" },
            { id: "d", label: "查 Query.orders 就够了，它们是同一条路径", labelEn: "Querying Query.orders is enough; it is the same path" },
          ],
          answer: ["c"],
          explain: (
            <>
              <code>_entities</code> 就是 Router 会发的那个请求。
              直接查它，等于在本地复现了 federation 链路的关键一跳。
              <br />
              D 不对：<code>Query.orders</code> 和 <code>User.orders</code>
              是<strong>两个不同的 resolver</strong>，
              走的路径也不同（后者要先经过
              <code>__resolveReference</code>）。两个都要验。
              <br />
              B 可行但没必要，而且擅自加依赖在考试里是风险动作。
            </>
          ),
          explainEn: (
            <>
              <code>_entities</code> is exactly the request the Router sends.
              Querying it directly reproduces the key hop of the federation
              path on your own machine.
              <br />
              D is wrong: <code>Query.orders</code> and{" "}
              <code>User.orders</code> are{" "}
              <strong>two different resolvers</strong> on two different paths
              (the second one goes through <code>__resolveReference</code>
              first). Check both.
              <br />
              B works but is unnecessary, and adding a dependency on your own
              initiative is a risky move in an exam.
            </>
          ),
        },
      ],
      transfer: [
        { signal: "写 subgraph", signalEn: "You are writing a subgraph", reachFor: "用 buildSubgraphSchema，不是 makeExecutableSchema", reachForEn: "Use buildSubgraphSchema, not makeExecutableSchema" },
        { signal: "想在本地验 federation 但没有 Router", signalEn: "You want to check Federation locally but have no Router", reachFor: "进程内执行 _service 和 _entities 查询", reachForEn: "Run the _service and _entities queries inside the same process" },
        { signal: "context 里的键名不确定", signalEn: "You are not sure of a key name in context", reachFor: "读 index.js 的 context 函数", reachForEn: "Read the context function in index.js" },
        { signal: "ESM 项目里 import 报 MODULE_NOT_FOUND", signalEn: "An import throws MODULE_NOT_FOUND in an ESM project", reachFor: "补 .js 扩展名", reachForEn: "Add the .js extension" },
      ],
      recap: [
        "启动五步：读 schema → buildSubgraphSchema → 建 server → 监听 → 每请求造 context。",
        "buildSubgraphSchema 认识 federation directive，并自动加 _service 和 _entities 两个字段。",
        "formatError 原样返回错误，所以你放进 extensions 的东西客户端能看到。",
        "本地验证优选「进程内执行」：不占端口，能一次跑一串查询，包括 _entities。",
        "原生 ESM：import 带 .js，顶层 await 可用，jest 需要 --experimental-vm-modules。",
      ],
      recapEn: [
        "Five startup steps: read the schema, call buildSubgraphSchema, create the server, listen, then build a context for each request.",
        "buildSubgraphSchema understands the Federation directives and adds the two fields _service and _entities for you.",
        "formatError returns errors unchanged, so whatever you put in extensions reaches the client.",
        "Prefer running queries inside the process: it needs no port and lets you run several queries in a row, including _entities.",
        "Native ESM: imports need the .js extension, top-level await works, and jest needs --experimental-vm-modules.",
      ],
    },

    /* ---------- 2.3 ---------- */
    {
      id: "g-entity",
      title: "entity、@key 与 __resolveReference",
      titleEn: "entity, @key and __resolveReference",
      blurb: "「另一个服务要用哪个字段找到这个对象？」—— 想清这一句，这三个概念全通。",
      blurbEn: "Which field does another service use to find this object? Answer that one question and all three ideas become clear.",
      minutes: 16,
      objectives: [
        "用一句话解释 @key 在声明什么",
        "说清 @external 标在什么场合",
        "读懂 __resolveReference 的输入和输出",
        "画出 Router 做实体解析的完整链路",
      ],
      objectivesEn: [
        "Explain in one sentence what @key declares",
        "Say when a field should be marked @external",
        "Read what goes into __resolveReference and what comes out",
        "Draw the full path the Router takes to resolve an entity",
      ],
      whyForAssessment:
        "User.orders 这个 TODO 就长在这套机制上。不理解 __resolveReference 的返回值会流向哪里，就不知道自己的 orders resolver 里 user.id 从何而来。",
      whyForAssessmentEn:
        "The User.orders TODO sits on top of this mechanism. If you do not know where the return value of __resolveReference goes, you will not know where user.id inside your orders resolver comes from.",
      sourceFiles: [
        {
          path: "graphql-federation-practice/node-subgraph/src/schema.graphql",
          role: "@key 与 @external 的真实用法",
        },
        {
          path: "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js",
          role: "__resolveReference 已给好，orders 要你写",
          edit: true,
        },
      ],
      concepts: [
        {
          id: "what-is-entity",
          heading: "entity：可以被多个服务共同描述的类型",
          headingEn: "entity: a type that several services can describe together",
          lede: "不是所有类型都是 entity。判据是「别的服务需不需要引用它」。",
          ledeEn: "Not every type is an entity. The test is whether another service needs to refer to it.",
          body: (
            <>
              <p>
                <strong>entity（实体）</strong>是「同一个东西在多个 subgraph 里
                都有一部分字段」的类型。<code>User</code> 就是：
                Accounts 有它的 name/email，本项目有它的 orders。
              </p>
              <p>
                要成为 entity，类型必须声明
                <strong>「怎么认出同一个我」</strong>——
                这就是 <code>@key</code>：
              </p>
              <p>
                <code>@key(fields: &quot;id&quot;)</code> 读作：
                <strong>「拿 <code>id</code> 这个字段就能唯一定位一个 User」。</strong>
                于是 Router 只要手里有 <code>{'{ __typename: "User", id: "123" }'}</code>，
                就能去任何声明了这个 key 的 subgraph 补齐字段。
              </p>
              <p>
                <strong>@key 可以是复合的</strong>：
                <code>@key(fields: &quot;orgId userId&quot;)</code> 表示
                要两个字段才能定位。也可以有<strong>多个</strong> @key
                （同一个类型能用几种方式定位）。本项目只用了最简单的单字段形式。
              </p>
              <p>
                <strong>不是 entity 的类型呢？</strong>
                看这份 schema：<code>Order</code>、<code>OrderItem</code>、
                <code>ShippingInfo</code> 都<strong>没有</strong> <code>@key</code>。
                因为它们只在本 subgraph 里存在，别的服务不需要引用它们。
                <strong>没必要就不要加 @key</strong> ——
                加了反而要维护 <code>__resolveReference</code>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                An <strong>entity</strong> is a type whose fields live partly in
                one subgraph and partly in another — the same thing described in
                several places. <code>User</code> is one: Accounts has its name
                and email, this project has its orders.
              </p>
              <p>
                To become an entity, a type has to declare{" "}
                <strong>how to recognise the same one of me</strong> — and that
                is <code>@key</code>:
              </p>
              <p>
                Read <code>@key(fields: &quot;id&quot;)</code> as{" "}
                <strong>&ldquo;the <code>id</code> field alone pinpoints one
                User&rdquo;.</strong> So the moment the Router holds{" "}
                <code>{'{ __typename: "User", id: "123" }'}</code>, it can go to
                any subgraph that declares this key and fill in more fields.
              </p>
              <p>
                <strong>A @key can be compound</strong>:{" "}
                <code>@key(fields: &quot;orgId userId&quot;)</code> says it takes
                two fields to pinpoint one. A type can also have{" "}
                <strong>several</strong> @keys, so it can be identified in more
                than one way. This project uses the simplest single-field form.
              </p>
              <p>
                <strong>What about types that are not entities?</strong> Look at
                this schema: <code>Order</code>, <code>OrderItem</code> and{" "}
                <code>ShippingInfo</code> have <strong>no</strong>{" "}
                <code>@key</code>. They exist only inside this subgraph and no
                other service needs to reference them.{" "}
                <strong>Do not add a @key you do not need</strong> — it buys you
                a <code>__resolveReference</code> to maintain.
              </p>
            </>
          ),
          code: [
            real(
              "graphql",
              `type User @key(fields: "id") {   # ← entity：靠 id 认人
  id: ID! @external
  orders: [Order!]!
}

type Order {                     # ← 不是 entity：没有 @key
  id: ID!
  ...
}`,
              {
                codeEn: `type User @key(fields: "id") {   # ← an entity: id is how you identify it
  id: ID! @external
  orders: [Order!]!
}

type Order {                     # ← not an entity: no @key
  id: ID!
  ...
}`,
                sourceFile:
                  "graphql-federation-practice/node-subgraph/src/schema.graphql",
              },
            ),
          ],
        },
        {
          id: "external",
          heading: "@external：这个字段不是我的",
          headingEn: "@external: this field is not mine",
          body: (
            <>
              <p>
                <code>id: ID! @external</code> 的意思是
                <strong>「这个字段由别的 subgraph 定义和提供，
                我只是需要它来完成 @key」</strong>。
              </p>
              <p>
                所以本项目<strong>不需要</strong>为 <code>User.id</code>
                写 resolver、不需要有用户表。它只是借这个字段做身份识别。
              </p>
              <p>
                <strong>本 subgraph 真正贡献的字段是 <code>orders</code></strong> ——
                它没有 <code>@external</code>，说明「这个字段是我的，我负责实现」。
              </p>
              <p>
                <strong>一个诚实的注解：</strong>
                在 Federation 2 里，为一个自己不拥有的 entity 加字段，
                标准写法其实是 <code>type User @key(fields: &quot;id&quot;)</code>
                加上普通的 <code>id: ID!</code>（不用 <code>@external</code>）。
                <code>@external</code> 更多是 Federation 1 的遗留写法。
                <strong>但这个项目就是这么写的，而且
                <code>buildSubgraphSchema</code> 接受它</strong> ——
                审计时实测 SDL 正常生成、<code>_entities</code> 查询正常工作。
                <strong>考试里照着项目已有的写法走，别自己改 schema 风格。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>id: ID! @external</code> means{" "}
                <strong>&ldquo;another subgraph defines and provides this field;
                I only need it to satisfy my @key&rdquo;</strong>.
              </p>
              <p>
                So this project <strong>does not need</strong> a resolver for{" "}
                <code>User.id</code> and does not need a user table. It borrows
                the field purely to tell one user from another.
              </p>
              <p>
                <strong>The field this subgraph really contributes is{" "}
                <code>orders</code></strong> — it has no <code>@external</code>,
                which says &ldquo;this field is mine, I implement it&rdquo;.
              </p>
              <p>
                <strong>One honest footnote:</strong> in Federation 2, the
                standard way to add a field to an entity you do not own is{" "}
                <code>type User @key(fields: &quot;id&quot;)</code> plus a plain{" "}
                <code>id: ID!</code>, with no <code>@external</code>.{" "}
                <code>@external</code> is mostly a Federation 1 leftover.{" "}
                <strong>But this project writes it that way, and{" "}
                <code>buildSubgraphSchema</code> accepts it</strong> — the audit
                confirmed the SDL is emitted fine and <code>_entities</code>{" "}
                queries work. <strong>In the exam, follow the style already in
                the project; do not rewrite the schema to your own taste.</strong>
              </p>
            </>
          ),
        },
        {
          id: "resolve-reference",
          heading: "__resolveReference：把「引用」变成「本地对象」",
          headingEn: "__resolveReference: turning a reference into a local object",
          lede: "它是 entity 解析的入口，也是 User.orders 的上游。",
          ledeEn: "It is the entry point for entity resolution, and it runs right before User.orders.",
          body: (
            <>
              <p>
                Router 把 <code>{'{ __typename: "User", id: "123" }'}</code>
                交给本 subgraph 时，第一个被调用的就是
                <code>User.__resolveReference</code>。
              </p>
              <p>
                <strong>它的职责：</strong>拿到这个「引用」，
                返回一个本地能用的对象。这个返回值会成为
                <strong>下游所有字段 resolver 的 <code>parent</code></strong>。
              </p>
              <p>
                这个项目里它已经写好了，而且非常简单：
              </p>
              <p>
                <strong>为什么这么简单就够了？</strong>
                因为本 subgraph 只贡献 <code>orders</code> 一个字段，
                而算 orders 只需要 <code>user.id</code>。
                不需要去查用户表 —— 本项目也没有用户表。
              </p>
              <p>
                <strong>这一行是理解 User.orders 的钥匙：</strong>
                <code>__resolveReference</code> 返回 <code>{'{ id: "123" }'}</code>，
                所以你写的 <code>User.orders(user, ...)</code> 里那个
                <code>user</code> 就是 <code>{'{ id: "123" }'}</code>，
                <code>user.id</code> 就是 <code>&quot;123&quot;</code>。
                <strong>它上面没有 name、没有 email</strong> ——
                别指望能拿到那些字段。
              </p>
              <p>
                测试也是这么模拟的：
                <code>const user = {"{ id: '123' }"}</code>，
                然后 <code>resolvers.User.orders(user, {"{}"}, context)</code>。
                <strong>直接调 resolver 函数，绕过了整个 GraphQL 执行器</strong>——
                这就是为什么这些测试跑得那么快（0.16 秒）。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                When the Router hands{" "}
                <code>{'{ __typename: "User", id: "123" }'}</code> to this
                subgraph, the first thing called is{" "}
                <code>User.__resolveReference</code>.
              </p>
              <p>
                <strong>Its job:</strong> take that reference and return an
                object this service can work with. The return value becomes{" "}
                <strong>the <code>parent</code> of every field resolver
                downstream</strong>.
              </p>
              <p>It is already written in this project, and it is very short:</p>
              <p>
                <strong>Why is that enough?</strong> Because this subgraph
                contributes one field, <code>orders</code>, and computing orders
                needs nothing but <code>user.id</code>. No user table to query —
                this project has none.
              </p>
              <p>
                <strong>That single line is the key to understanding
                User.orders:</strong> <code>__resolveReference</code> returns{" "}
                <code>{'{ id: "123" }'}</code>, so the <code>user</code> inside
                the <code>User.orders(user, ...)</code> you write is{" "}
                <code>{'{ id: "123" }'}</code> and <code>user.id</code> is{" "}
                <code>&quot;123&quot;</code>. <strong>There is no name on it and
                no email</strong> — do not expect to read those fields.
              </p>
              <p>
                The tests simulate it the same way:{" "}
                <code>const user = {"{ id: '123' }"}</code>, then{" "}
                <code>resolvers.User.orders(user, {"{}"}, context)</code>.{" "}
                <strong>They call the resolver function directly and skip the
                whole GraphQL executor</strong> — which is why these tests finish
                in 0.16 seconds.
              </p>
            </>
          ),
          code: [
            real(
              "js",
              `User: {
  // Reference Resolver - extend User entity from Accounts subgraph
  __resolveReference(user, { dataSources, loaders }) {
    return { id: user.id };
  },

  // Field resolver with caching
  async orders(user, _, { dataSources, loaders, correlationId }) {
    // TODO: Implement orders resolver with proper error handling and correlation ID tracing
    return [];
  }
},`,
              {
                filename: "src/resolvers/orderResolvers.js（User 部分）",
                filenameEn: "src/resolvers/orderResolvers.js (the User part)",
                sourceFile:
                  "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js",
                highlight: [3, 4, 5],
              },
            ),
            real(
              "js",
              `it('should return orders for a user', async () => {
  const user = { id: '123' };                              // ← 就是这么简单
  const orders = await resolvers.User.orders(user, {}, context);

  expect(orders).toBeDefined();
  expect(Array.isArray(orders)).toBe(true);
  expect(orders.length).toBeGreaterThan(0);
  expect(orders[0]).toHaveProperty('userId', '123');
});`,
              {
                filename: "测试怎么调它",
                filenameEn: "How the test calls it",
                codeEn: `it('should return orders for a user', async () => {
  const user = { id: '123' };                              // ← that is all it takes
  const orders = await resolvers.User.orders(user, {}, context);

  expect(orders).toBeDefined();
  expect(Array.isArray(orders)).toBe(true);
  expect(orders.length).toBeGreaterThan(0);
  expect(orders[0]).toHaveProperty('userId', '123');
});`,
                sourceFile:
                  "graphql-federation-practice/node-subgraph/__tests__/resolvers.test.js",
                explanation:
                  "测试直接调 resolver 函数，手工构造 parent 和 context。这意味着：你的 resolver 只要参数用法正确就能过测试，不需要整个 GraphQL 服务器跑起来。",
                explanationEn:
                  "The test calls the resolver function directly and builds parent and context by hand. That means your resolver passes as long as it uses its arguments correctly; you do not need the whole GraphQL server running.",
              },
            ),
          ],
        },
        {
          id: "the-full-chain",
          heading: "完整链路：从客户端一句话到两个服务",
          headingEn: "The full path: one client query, two services",
          body: (
            <>
              <p>
                把上面所有东西串起来。这张图六步走完 Router 的实体解析，
                其中第 5 步就是你要写的代码被调用的地方：
              </p>
              {ENTITY_FLOW}
            </>
          ),
          bodyEn: (
            <>
              <p>
                String everything above together. This diagram walks the
                Router&rsquo;s entity resolution in six steps, and step 5 is
                where the code you write gets called:
              </p>
              {ENTITY_FLOW}
            </>
          ),
        },
      ],
      exercises: [
        {
          kind: "recognition",
          id: "g-key-meaning",
          title: "@key 在声明什么",
          titleEn: "What @key declares",
          level: 1,
          prompt: (
            <p>
              <code>type User @key(fields: &quot;id&quot;)</code> 最准确的含义是？
            </p>
          ),
          promptEn: (
            <p>
              What does <code>type User @key(fields: &quot;id&quot;)</code> mean,
              most precisely?
            </p>
          ),
          options: [
            { id: "a", label: "id 是数据库主键", labelEn: "id is the database primary key" },
            { id: "b", label: "别的 subgraph 只要给出 id，就能定位到同一个 User", labelEn: "Another subgraph only has to supply an id to locate the same User" },
            { id: "c", label: "id 字段不能为空", labelEn: "The id field cannot be null" },
            { id: "d", label: "查询 User 时必须传 id 参数", labelEn: "Querying User requires passing an id argument" },
          ],
          answer: ["b"],
          explain: (
            <>
              <code>@key</code> 声明的是<strong>跨服务的身份识别方式</strong>。
              它和数据库主键<strong>没有必然关系</strong>（可以是任何能唯一定位的字段组合）。
              <br />
              判断口诀：<strong>看到 @key 不要先背语法，
              先问「另一个服务需要用哪个字段找到这个对象？」</strong>
              <br />
              C 是 <code>ID!</code> 那个感叹号在说的事；
              D 是 <code>Query</code> 字段参数的事，都和 @key 无关。
            </>
          ),
          explainEn: (
            <>
              <code>@key</code> declares{" "}
              <strong>how an object is identified across services</strong>. It
              has <strong>no necessary connection</strong> to a database primary
              key — it can be any combination of fields that identifies the
              object uniquely.
              <br />
              A rule of thumb:{" "}
              <strong>
                when you see @key, do not start from the syntax. Ask which field
                another service needs in order to find this object.
              </strong>
              <br />
              C is what the exclamation mark in <code>ID!</code> says, and D is
              about the arguments of a <code>Query</code> field. Neither has
              anything to do with @key.
            </>
          ),
        },
        {
          kind: "recognition",
          id: "g-parent-of-orders",
          title: "User.orders 里的 user 参数上有什么",
          titleEn: "What the user argument of User.orders carries",
          level: 1,
          prompt: (
            <p>
              <code>__resolveReference</code> 返回 <code>{'{ id: user.id }'}</code>。
              那么 <code>User.orders(user, ...)</code> 里的 <code>user</code>
              上有哪些属性？
            </p>
          ),
          promptEn: (
            <p>
              <code>__resolveReference</code> returns{" "}
              <code>{'{ id: user.id }'}</code>. So which properties does{" "}
              <code>user</code> have inside{" "}
              <code>User.orders(user, ...)</code>?
            </p>
          ),
          options: [
            { id: "a", label: "id、name、email —— 完整的用户对象", labelEn: "id, name and email — the complete user object" },
            { id: "b", label: "只有 id", labelEn: "Only id" },
            { id: "c", label: "id 和 orders", labelEn: "id and orders" },
            { id: "d", label: "什么都没有，是空对象", labelEn: "Nothing at all; it is an empty object" },
          ],
          answer: ["b"],
          explain: (
            <>
              <strong>只有 id。</strong>
              <code>__resolveReference</code> 返回什么，下游字段 resolver 的
              <code>parent</code> 就是什么。它返回的是
              <code>{'{ id: user.id }'}</code>，一个属性。
              <br />
              这也是本项目的合理设计 —— 它没有用户表，
              name/email 是 Accounts subgraph 的事。
              <br />
              <strong>实践含义：你的 orders resolver 只能用
              <code>user.id</code>。</strong>
              想用 <code>user.email</code> 去做什么，会拿到 undefined。
            </>
          ),
          explainEn: (
            <>
              <strong>Only id.</strong> Whatever{" "}
              <code>__resolveReference</code> returns becomes the{" "}
              <code>parent</code> of the field resolvers below it. It returns{" "}
              <code>{'{ id: user.id }'}</code> — one property.
              <br />
              That is a reasonable design here: this project has no user table,
              and name and email belong to the Accounts subgraph.
              <br />
              <strong>
                What that means in practice: your orders resolver can only use{" "}
                <code>user.id</code>.
              </strong>{" "}
              Reach for <code>user.email</code> and you get undefined.
            </>
          ),
        },
        {
          kind: "fill-blank",
          id: "g-entity-blanks",
          title: "补全 entity 声明与引用解析",
          titleEn: "Fill in the entity declaration and the reference resolver",
          level: 2,
          prompt: (
            <p>
              三个空。第一个是 directive，第二个是标记「这不是我的字段」，
              第三个是引用解析要返回什么。
            </p>
          ),
          promptEn: (
            <p>
              Three blanks. The first is a directive, the second marks a field
              as not belonging to this service, and the third is what the
              reference resolver returns.
            </p>
          ),
          language: "graphql",
          filename: "schema.graphql + orderResolvers.js",
          sourceFile:
            "graphql-federation-practice/node-subgraph/src/schema.graphql",
          template: `# schema.graphql
type User ___1___(fields: "id") {
  id: ID! ___2___
  orders: [Order!]!
}

# orderResolvers.js
# User: {
#   __resolveReference(user, { dataSources, loaders }) {
#     return { id: ___3___ };
#   },
#   ...
# }`,
          blanks: [
            {
              n: 1,
              accept: ["@key"],
              hint: "声明「靠哪个字段跨服务认人」的 directive。",
              hintEn:
                "The directive that says which field identifies the object across services.",
              why: (
                <>
                  <code>@key</code>。它让 <code>User</code> 成为一个 entity，
                  Router 因此知道「给我 id 就能在这个 subgraph 里找到 User」。
                  <br />
                  注意它必须写在<strong>类型名后面</strong>，不是字段上。
                </>
              ),
              whyEn: (
                <>
                  <code>@key</code>. It turns <code>User</code> into an entity,
                  which is how the Router knows that an id is enough to find a
                  User in this subgraph.
                  <br />
                  Note it goes <strong>after the type name</strong>, not on a
                  field.
                </>
              ),
              width: 6,
            },
            {
              n: 2,
              accept: ["@external"],
              hint: "这个字段由别的 subgraph 提供，本服务只是引用。",
              hintEn:
                "Another subgraph provides this field; this service only references it.",
              why: (
                <>
                  <code>@external</code>。表示 <code>id</code> 不是本 subgraph
                  定义的，所以不需要为它写 resolver。
                  <br />
                  <strong>而 <code>orders</code> 上没有它</strong> ——
                  说明那个字段是本 subgraph 贡献的，必须自己实现。
                  这一个对比就能看出「哪个字段是我的责任」。
                </>
              ),
              whyEn: (
                <>
                  <code>@external</code>. It says <code>id</code> is not
                  defined by this subgraph, so you write no resolver for it.
                  <br />
                  <strong>
                    And <code>orders</code> does not have it
                  </strong>{" "}
                  — that field is contributed by this subgraph, so you must
                  implement it. That one contrast tells you which fields are
                  your responsibility.
                </>
              ),
              width: 11,
            },
            {
              n: 3,
              accept: ["user.id"],
              hint: "Router 传进来的 representation 上有 __typename 和 @key 字段。",
              hintEn:
                "The representation the Router passes in carries __typename and the @key fields.",
              why: (
                <>
                  <code>user.id</code>。传进来的 <code>user</code> 是
                  <code>{'{ __typename: "User", id: "123" }'}</code>，
                  取出 id 原样返回即可。
                  <br />
                  <strong>返回值会成为下游所有字段 resolver 的 parent</strong> ——
                  所以你的 <code>orders</code> resolver 里
                  <code>user.id</code> 就是从这来的。
                </>
              ),
              whyEn: (
                <>
                  <code>user.id</code>. The <code>user</code> passed in is{" "}
                  <code>{'{ __typename: "User", id: "123" }'}</code>, so take
                  the id and return it as is.
                  <br />
                  <strong>
                    The return value becomes the parent of every field resolver
                    below
                  </strong>{" "}
                  — that is where <code>user.id</code> in your{" "}
                  <code>orders</code> resolver comes from.
                </>
              ),
              width: 9,
            },
          ],
        },
      ],
      transfer: [
        { signal: "看到 @key", signalEn: "You see @key", reachFor: "先问「别的服务用哪个字段找到这个对象」", reachForEn: "First ask which field another service uses to find this object" },
        { signal: "「我要给别人的类型加字段」", signalEn: "You want to add a field to a type owned by another service", reachFor: "声明 @key + 把借来的字段标 @external", reachForEn: "Declare @key and mark the borrowed field @external" },
        { signal: "字段 resolver 拿不到某个属性", signalEn: "A field resolver cannot see a property it expected", reachFor: "看 __resolveReference 返回了什么", reachForEn: "Check what __resolveReference returned" },
        { signal: "想验证 entity 解析", signalEn: "You want to check entity resolution", reachFor: "查 _entities，representation 要带 __typename", reachForEn: "Query _entities; each representation must carry __typename" },
      ],
      recap: [
        "entity = 多个 subgraph 共同描述的类型；@key 声明「靠哪个字段跨服务认人」。",
        "@key 和数据库主键无关，可以复合、可以有多个。",
        "@external 表示「这个字段是别人的，我只借来做身份识别」。",
        "__resolveReference 把 representation 变成本地对象，它的返回值就是下游 parent。",
        "本项目的 __resolveReference 只返回 { id }，所以 User.orders 里只有 user.id 可用。",
      ],
      recapEn: [
        "An entity is a type that several subgraphs describe together. @key declares which field identifies it across services.",
        "@key has nothing to do with a database primary key. It can cover several fields, and one type can have more than one.",
        "@external means the field belongs to another service and you only borrow it to identify the object.",
        "__resolveReference turns a representation into a local object, and its return value becomes the parent for the fields below.",
        "In this project __resolveReference returns only { id }, so inside User.orders the only value you can use is user.id.",
      ],
    },

    /* ---------- 2.4 ---------- */
    {
      id: "g-dataloader",
      title: "N+1 问题与 DataLoader",
      titleEn: "The N+1 problem and DataLoader",
      blurb: "客户端一句话，后端 100 次请求 —— 以及一个 30 行的解药。",
      blurbEn: "One client query, 100 backend requests — and a 30-line fix.",
      minutes: 14,
      objectives: [
        "解释 N+1 问题在 GraphQL 里为什么天然会发生",
        "说清 DataLoader 靠什么把 N 次合并成 1 次",
        "知道 batch 函数的两条硬约束（长度与顺序）",
        "解释为什么 loader 必须每请求新建",
      ],
      objectivesEn: [
        "Explain why the N+1 problem happens naturally in GraphQL",
        "Explain how DataLoader merges N calls into one",
        "Know the two hard rules for a batch function: length and order",
        "Explain why a loader must be created once per request",
      ],
      whyForAssessment:
        "Order.shippingInfo 那个 TODO 原文就写着「using DataLoader to prevent N+1 queries」。绕过 loader 直接调数据源能过测试，但答不到考点。",
      whyForAssessmentEn:
        "The Order.shippingInfo TODO says it in the task text: using DataLoader to prevent N+1 queries. Calling the data source directly and skipping the loader still passes the tests, but it misses what the task is testing.",
      sourceFiles: [
        {
          path: "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js",
          role: "两个 loader 工厂函数（其中一个有埋雷）",
          edit: true,
        },
        {
          path: "graphql-federation-practice/node-subgraph/package.json",
          role: "dependencies 里那个 dataloader 就是提示",
        },
      ],
      concepts: [
        {
          id: "the-n-plus-1",
          heading: "N+1 是怎么产生的",
          headingEn: "How N+1 happens",
          lede: "不是谁写错了。是 GraphQL 的执行模型天然如此。",
          ledeEn: "Nobody wrote anything wrong. This is how the GraphQL execution model works.",
          body: (
            <>
              <p>
                回忆执行流程：<code>Query.orders</code> 返回 N 个 order，
                然后执行器<strong>对每一个 order 分别调</strong>
                <code>Order.shippingInfo</code>。
              </p>
              <p>
                所以如果 <code>shippingInfo</code> 的实现是直接调数据源：
              </p>
              <p>
                查 2 个订单 → 3 次数据源调用（1 次取列表 + 2 次取物流）。
                查 100 个订单 → <strong>101 次</strong>。
                这就是 <strong>N+1 问题</strong>：1 次主查询 + N 次子查询。
              </p>
              <p>
                <strong>为什么在 GraphQL 里特别严重？</strong>
                因为客户端决定形状 —— 后端<strong>无法预知</strong>
                这次查询会不会展开 shippingInfo。REST 里你可以手写一个
                「带物流的订单列表」接口，用一次 JOIN 解决；
                GraphQL 里每个字段的 resolver 是独立的，各自不知道别人的存在。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Recall the execution flow: <code>Query.orders</code> returns N
                orders, and then the executor calls{" "}
                <code>Order.shippingInfo</code>{" "}
                <strong>once for each order</strong>.
              </p>
              <p>
                So if <code>shippingInfo</code> is implemented by calling the
                data source directly:
              </p>
              <p>
                Two orders → 3 data source calls (1 for the list, 2 for
                shipping). A hundred orders → <strong>101</strong>. That is the{" "}
                <strong>N+1 problem</strong>: one main query plus N sub-queries.
              </p>
              <p>
                <strong>Why is it especially bad in GraphQL?</strong> Because the
                client decides the shape — the backend{" "}
                <strong>cannot know in advance</strong> whether a given query
                will expand shippingInfo. In REST you can hand-write an
                &ldquo;orders with shipping&rdquo; endpoint and solve it with one
                JOIN; in GraphQL every field resolver is independent and none of
                them knows the others exist.
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `// ✗ 能过测试，但每个 order 一次请求
async shippingInfo(parent, _, { dataSources }) {
  return dataSources.shippingDataSource.getShippingInfo(parent.id);
}

// 查 100 个订单的日志会是：
// getShippingInfo('order-1')
// getShippingInfo('order-2')
// ... 共 100 行`,
              {
                codeEn: `// ✗ passes the tests, but one request per order
async shippingInfo(parent, _, { dataSources }) {
  return dataSources.shippingDataSource.getShippingInfo(parent.id);
}

// Ask for 100 orders and the log reads:
// getShippingInfo('order-1')
// getShippingInfo('order-2')
// ... 100 lines in all`,
              },
            ),
          ],
        },
        {
          id: "how-dataloader-works",
          heading: "DataLoader 靠什么合并",
          headingEn: "How DataLoader merges calls",
          lede: "靠 JavaScript 事件循环的一个特性：同一个 tick 里的调用可以攒起来。",
          ledeEn: "It uses one property of the JavaScript event loop: calls made in the same tick can be collected together.",
          body: (
            <>
              <p>
                你调 <code>loader.load(&apos;order-456&apos;)</code>，
                DataLoader <strong>不会立刻</strong>去取数据。
                它把这个 key 记下来，返回一个 Promise，
                然后<strong>等当前这一轮微任务结束</strong>。
              </p>
              <p>
                因为执行器是在<strong>同一个 tick 里</strong>对所有 order
                调 <code>shippingInfo</code> 的，所以这一轮结束时，
                DataLoader 手上已经攒了 N 个 key。这时它调<strong>一次</strong>
                你给的 batch 函数，把整个数组传进去。
              </p>
              <p>
                batch 函数返回一个结果数组，DataLoader 按<strong>位置</strong>
                把结果分发给各个 <code>load()</code> 的 Promise。
              </p>
              <p>
                看真实的 batch 函数 —— 那行 <code>console.log</code>
                是绝好的观察窗口：
              </p>
              <p>
                跑起来会看到
                <code>[DataLoader] Batching 2 shipping info requests</code>——
                <strong>一行，不是两行</strong>。这就是合并生效的证据。
              </p>
              <p>
                <strong>另外 DataLoader 自带缓存</strong>：
                同一个请求里对同一个 key 调多次 <code>load()</code>，
                只会真的取一次。这对「同一个 order 在查询里出现两次」的场景很有用。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                You call <code>loader.load(&apos;order-456&apos;)</code> and
                DataLoader <strong>does not fetch anything yet</strong>. It
                writes the key down, returns a Promise, and then{" "}
                <strong>waits for the current round of microtasks to
                finish</strong>.
              </p>
              <p>
                Because the executor calls <code>shippingInfo</code> for every
                order <strong>inside the same tick</strong>, by the end of that
                round DataLoader is holding N keys. Now it calls your batch
                function <strong>once</strong>, passing the whole array in.
              </p>
              <p>
                The batch function returns an array of results, and DataLoader
                hands them out by <strong>position</strong> to the Promise of
                each <code>load()</code>.
              </p>
              <p>
                Look at the real batch function — that <code>console.log</code>{" "}
                line is a great observation window:
              </p>
              <p>
                Run it and you see{" "}
                <code>[DataLoader] Batching 2 shipping info requests</code> —{" "}
                <strong>one line, not two</strong>. That is your proof the
                batching works.
              </p>
              <p>
                <strong>DataLoader also caches</strong>: calling{" "}
                <code>load()</code> several times with the same key inside one
                request only fetches once. Handy when the same order shows up
                twice in a query.
              </p>
            </>
          ),
          code: [
            real(
              "js",
              `function createShippingInfoLoader(shippingDataSource) {
  return new DataLoader(async orderIds => {
    console.log(\`[DataLoader] Batching \${orderIds.length} shipping info requests\`);

    const shippingInfos = await Promise.all(
      orderIds.map(id => shippingDataSource.getShippingInfo(id))
    );

    return shippingInfos;
  });
}`,
              {
                filename: "src/resolvers/orderResolvers.js（这个 loader 是对的）",
                filenameEn:
                  "src/resolvers/orderResolvers.js (this loader is correct)",
                sourceFile:
                  "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js",
                explanation:
                  "注意：这里仍然是 N 次 getShippingInfo 调用（用 Promise.all 并发）。真实系统里 batch 函数应该调一个「批量接口」（比如 WHERE id IN (...)）。这个项目的数据源没有批量接口，所以只能这样 —— 但合并的结构是对的，考点也在结构上。",
                explanationEn:
                  "Note this is still N calls to getShippingInfo, run concurrently with Promise.all. In a real system the batch function would call one batch API, such as WHERE id IN (...). The data source in this project has no batch API, so this is as far as you can go — but the structure of the merge is right, and the structure is what is being graded.",
              },
            ),
          ],
        },
        {
          id: "two-hard-rules",
          heading: "batch 函数的两条硬约束",
          headingEn: "The two hard rules for a batch function",
          lede: "违反了会出现「A 拿到 B 的数据」这种最难查的 bug。",
          ledeEn: "Break them and you get the hardest kind of bug to find: A receives B's data.",
          body: (
            <>
              <ol>
                <li>
                  <strong>返回数组的长度必须等于 keys 的长度。</strong>
                  短了，多出来的 <code>load()</code> 会永远 pending 或报错。
                </li>
                <li>
                  <strong>返回数组的顺序必须与 keys 一一对应。</strong>
                  DataLoader 靠<strong>下标</strong>分发结果 ——
                  <code>results[0]</code> 给 <code>keys[0]</code>。
                </li>
              </ol>
              <p>
                所以 batch 函数里<strong>绝对不能用 <code>filter</code></strong>
                （会变短），也<strong>不能改顺序</strong>。
                <code>keys.map(...)</code> + <code>Promise.all</code>
                是最安全的写法 —— 它天然保证长度和顺序。
              </p>
              <p>
                <strong>「找不到」怎么办？</strong>
                在对应位置放 <code>null</code>（或一个 Error 对象），
                <strong>不要跳过</strong>。这个项目的
                <code>getShippingInfo</code> 正是这么设计的：
                order-999 没有物流，返回 <code>null</code>，
                数组长度不变。
              </p>
              <p>
                真实系统里如果 batch 函数调的是
                <code>WHERE id IN (...)</code> 这种批量查询，
                <strong>数据库返回的顺序不保证和你传进去的一致，
                而且缺失的行不会返回</strong>。这时必须自己重排：
              </p>
            </>
          ),
          bodyEn: (
            <>
              <ol>
                <li>
                  <strong>The returned array must be exactly as long as
                  keys.</strong> Come up short and the extra <code>load()</code>{" "}
                  calls hang forever or throw.
                </li>
                <li>
                  <strong>The order of the returned array must match keys, one
                  for one.</strong> DataLoader hands out results by{" "}
                  <strong>index</strong> — <code>results[0]</code> goes to{" "}
                  <code>keys[0]</code>.
                </li>
              </ol>
              <p>
                So a batch function must{" "}
                <strong>never use <code>filter</code></strong> (that shortens the
                array) and must <strong>never reorder</strong>.{" "}
                <code>keys.map(...)</code> plus <code>Promise.all</code> is the
                safest shape: it keeps the length and the order correct without any extra
                work.
              </p>
              <p>
                <strong>What about &ldquo;not found&rdquo;?</strong> Put a{" "}
                <code>null</code> (or an Error object) at that position and{" "}
                <strong>do not skip it</strong>. This project&rsquo;s{" "}
                <code>getShippingInfo</code> is built exactly that way: order-999
                has no shipping, it returns <code>null</code>, and the array
                keeps its length.
              </p>
              <p>
                In a real system, if the batch function runs a bulk query like{" "}
                <code>WHERE id IN (...)</code>, <strong>the database does not
                promise to return rows in the order you asked for, and missing
                rows do not come back at all</strong>. Then you have to reorder
                them yourself:
              </p>
            </>
          ),
          code: [
            demo(
              "js",
              `// 真实系统里 batch 函数的标准写法
new DataLoader(async ids => {
  const rows = await db.query('SELECT * FROM shipping WHERE order_id IN (?)', [ids]);

  // 数据库返回的顺序不保证，缺失的行也不会返回 → 必须自己按 ids 重排
  const byId = new Map(rows.map(r => [r.order_id, r]));
  return ids.map(id => byId.get(id) ?? null);   // 长度与顺序都对上了
});`,
              {
                filename: "长度与顺序的正确处理",
                filenameEn: "Getting the length and the order right",
                codeEn: `// The standard shape of a batch function in a real system
new DataLoader(async ids => {
  const rows = await db.query('SELECT * FROM shipping WHERE order_id IN (?)', [ids]);

  // The database order is not guaranteed and missing rows never come back
  const byId = new Map(rows.map(r => [r.order_id, r]));
  return ids.map(id => byId.get(id) ?? null);   // length and order now both match
});`,
                explanation:
                  "这个项目里因为数据源没有批量接口，用 map + Promise.all 天然满足两条约束，不需要重排。但这个模式值得记住 —— 面试常问。",
                explanationEn:
                  "In this project the data source has no batch API, so map plus Promise.all satisfies both constraints on its own and no reordering is needed. The pattern is still worth remembering: interviewers ask about it often.",
              },
            ),
          ],
        },
        {
          id: "per-request",
          heading: "为什么 loader 必须每请求新建",
          headingEn: "Why a loader must be created once per request",
          body: (
            <>
              <p>
                DataLoader 的缓存<strong>没有过期机制</strong>。
                一旦某个 key 被 load 过，之后同一个 loader 实例上的
                <code>load(同一个key)</code> 永远返回缓存值。
              </p>
              <p>如果建在模块顶层（一个全局实例），后果是：</p>
              <ul>
                <li>
                  <strong>数据永远不刷新。</strong>
                  订单状态从 SHIPPED 变成 DELIVERED，用户永远看到 SHIPPED。
                </li>
                <li>
                  <strong>跨请求数据泄漏。</strong>
                  如果 loader 的实现里带了权限过滤，
                  用户 A 的缓存会被用户 B 看到。<strong>这是安全问题。</strong>
                </li>
              </ul>
              <p>
                所以正确做法就是 <code>index.js</code> 里那样 ——
                在 <code>context</code> 函数里 <code>new</code>，
                <strong>每个请求一套全新的 loader</strong>。
                请求结束，loader 和它的缓存一起被回收。
              </p>
              <p>
                测试文件里的 <code>beforeEach</code> 也是同一个道理 ——
                每个测试用例都重建 dataSources 和 loaders，
                避免上一个用例的缓存影响下一个。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                DataLoader&rsquo;s cache <strong>has no expiry</strong>. Once a
                key has been loaded, <code>load(thatSameKey)</code> on the same
                loader instance returns the cached value forever.
              </p>
              <p>Build it at module top level, as one global instance, and:</p>
              <ul>
                <li>
                  <strong>The data never refreshes.</strong> An order goes from
                  SHIPPED to DELIVERED and the user keeps seeing SHIPPED.
                </li>
                <li>
                  <strong>Data leaks across requests.</strong> If the loader does
                  any permission filtering, user A&rsquo;s cache becomes visible
                  to user B. <strong>That is a security problem.</strong>
                </li>
              </ul>
              <p>
                So the right move is what <code>index.js</code> does —{" "}
                <code>new</code> them inside the <code>context</code> function,{" "}
                <strong>a fresh set of loaders per request</strong>. When the
                request ends, the loaders and their caches are collected with it.
              </p>
              <p>
                The <code>beforeEach</code> in the test file is the same idea —
                every test case rebuilds dataSources and loaders so the previous
                case&rsquo;s cache cannot affect the next one.
              </p>
            </>
          ),
          code: [
            real(
              "js",
              `// ✓ index.js 里的正确做法：每请求新建
context: async ({ req }) => {
  const orderDataSource = new OrderDataSource();
  const shippingDataSource = new ShippingDataSource();

  const shippingInfoLoader = createShippingInfoLoader(shippingDataSource);
  const orderLoader = createOrderLoader(orderDataSource);

  return { dataSources: {...}, loaders: { shippingInfoLoader, orderLoader }, correlationId };
}`,
              {
                codeEn: `// ✓ what index.js does right: build them per request
context: async ({ req }) => {
  const orderDataSource = new OrderDataSource();
  const shippingDataSource = new ShippingDataSource();

  const shippingInfoLoader = createShippingInfoLoader(shippingDataSource);
  const orderLoader = createOrderLoader(orderDataSource);

  return { dataSources: {...}, loaders: { shippingInfoLoader, orderLoader }, correlationId };
}`,
                sourceFile:
                  "graphql-federation-practice/node-subgraph/src/index.js",
              },
            ),
            demo(
              "js",
              `// ✗ 模块顶层：缓存跨请求共享，数据不刷新 + 可能泄漏
const shippingInfoLoader = createShippingInfoLoader(new ShippingDataSource());

export const resolvers = {
  Order: {
    async shippingInfo(parent) {
      return shippingInfoLoader.load(parent.id);   // 全局缓存
    }
  }
};`,
              {
                codeEn: `// ✗ module top level: one cache shared by every request, stale and leaky
const shippingInfoLoader = createShippingInfoLoader(new ShippingDataSource());

export const resolvers = {
  Order: {
    async shippingInfo(parent) {
      return shippingInfoLoader.load(parent.id);   // a global cache
    }
  }
};`,
              },
            ),
          ],
        },
        {
          id: "the-planted-bug",
          heading: "顺带说：另一个 loader 里有个埋雷",
          headingEn: "One more thing: another loader has a planted bug",
          lede: "现在你已经有能力看出来了。",
          ledeEn: "You can now spot it yourself.",
          body: (
            <>
              <p>
                项目里有两个 loader 工厂。
                <code>createShippingInfoLoader</code> 是对的，
                <code>createOrderLoader</code> <strong>有问题</strong>。
              </p>
              <p>
                对照 <code>OrderDataSource</code> 的方法名看一眼：
                它有 <code>getOrder(id)</code>、
                <code>getOrdersByUserId(userId)</code>、
                <code>createOrder(userId, items)</code> 三个方法。
                <strong>没有 <code>getOrderById</code>。</strong>
              </p>
              <p>
                所以这个 loader 一被使用就会抛
                <code>TypeError: orderDataSource.getOrderById is not a function</code>。
                审计实测：测试 <code>should batch multiple order requests</code>
                就是因为这个失败的。
              </p>
              <p>
                这是三个埋雷之一，后面会有专门一节讲怎么系统地找出它们。
                <strong>现在只要记住这个教训：写 resolver 之前，
                先把数据源的方法名抄一遍。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The project has two loader factories.{" "}
                <code>createShippingInfoLoader</code> is correct;{" "}
                <code>createOrderLoader</code> <strong>is not</strong>.
              </p>
              <p>
                Check it against the method names on{" "}
                <code>OrderDataSource</code>: it has <code>getOrder(id)</code>,{" "}
                <code>getOrdersByUserId(userId)</code> and{" "}
                <code>createOrder(userId, items)</code>.{" "}
                <strong>There is no <code>getOrderById</code>.</strong>
              </p>
              <p>
                So the moment this loader is used it throws{" "}
                <code>TypeError: orderDataSource.getOrderById is not a function</code>
                . Measured in the audit: the test{" "}
                <code>should batch multiple order requests</code> fails for
                exactly this reason.
              </p>
              <p>
                This is one of the three planted bugs, and a later lesson covers
                how to hunt all of them down systematically.{" "}
                <strong>For now, take the lesson: before writing a resolver,
                copy out the method names of the data source.</strong>
              </p>
            </>
          ),
          code: [
            real(
              "js",
              `function createOrderLoader(orderDataSource) {
  return new DataLoader(async orderIds => {
    console.log(\`[DataLoader] Batching \${orderIds.length} order requests\`);

    const orders = await Promise.all(
      orderIds.map(id => orderDataSource.getOrderById(id))   // ← 这个方法不存在
    );

    return orders;
  });
}`,
              {
                filename: "src/resolvers/orderResolvers.js（埋雷 1）",
                filenameEn: "src/resolvers/orderResolvers.js (planted bug 1)",
                codeEn: `function createOrderLoader(orderDataSource) {
  return new DataLoader(async orderIds => {
    console.log(\`[DataLoader] Batching \${orderIds.length} order requests\`);

    const orders = await Promise.all(
      orderIds.map(id => orderDataSource.getOrderById(id))   // ← no such method
    );

    return orders;
  });
}`,
                sourceFile:
                  "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js",
                highlight: [6],
              },
            ),
          ],
        },
      ],
      exercises: [
        {
          kind: "recognition",
          id: "g-dataloader-why",
          title: "DataLoader 靠什么把 N 次合并成 1 次",
          titleEn: "How DataLoader turns N calls into 1",
          level: 1,
          prompt: <p>下面哪一条最准确？</p>,
          promptEn: <p>Which of these is most accurate?</p>,
          options: [
            { id: "a", label: "它在内部开了一个定时器，每 10ms 批量发一次", labelEn: "It runs a timer internally and sends a batch every 10ms" },
            { id: "b", label: "它把同一个事件循环 tick 里的所有 load() 攒起来，tick 结束时调一次 batch 函数", labelEn: "It collects every load() made in the same event-loop tick and calls the batch function once when the tick ends" },
            { id: "c", label: "它把 SQL 查询改写成 JOIN", labelEn: "It rewrites the SQL query as a JOIN" },
            { id: "d", label: "它缓存了上一次请求的结果", labelEn: "It caches the result of the previous request" },
          ],
          answer: ["b"],
          explain: (
            <>
              DataLoader 用的是 JavaScript 的微任务队列：
              <code>load()</code> 只登记 key 并返回 Promise，
              当前 tick 的所有同步代码跑完后，才把攒到的 keys
              一次性交给 batch 函数。
              <br />
              GraphQL 执行器正好是在同一个 tick 里对所有 order 调
              <code>shippingInfo</code> 的，所以合并才成立。
              <br />
              D 描述的是它的<strong>另一个</strong>功能（同请求内缓存），
              不是合并机制 —— 而且缓存不能跨请求，否则是 bug。
            </>
          ),
          explainEn: (
            <>
              DataLoader uses the JavaScript microtask queue:{" "}
              <code>load()</code> only records the key and returns a Promise,
              and once all the synchronous code of the current tick has run, it
              hands the collected keys to the batch function in one go.
              <br />
              The GraphQL executor happens to call <code>shippingInfo</code>{" "}
              for every order inside the same tick, which is what makes the
              merge possible.
              <br />
              D describes its <strong>other</strong> feature, caching within
              one request, not the merging. And that cache must not cross
              requests, or it is a bug.
            </>
          ),
        },
        {
          kind: "recognition",
          id: "g-batch-rules",
          title: "batch 函数里哪种写法是错的",
          titleEn: "Which return value from a batch function is wrong",
          level: 1,
          prompt: (
            <p>
              batch 函数收到 <code>ids = [&apos;a&apos;, &apos;b&apos;, &apos;c&apos;]</code>，
              其中 b 在数据库里不存在。下面哪种返回是<strong>错的</strong>?
            </p>
          ),
          promptEn: (
            <p>
              The batch function receives{" "}
              <code>ids = [&apos;a&apos;, &apos;b&apos;, &apos;c&apos;]</code>,
              and b does not exist in the database. Which of these return values
              is <strong>wrong</strong>?
            </p>
          ),
          options: [
            { id: "a", label: "[rowA, null, rowC]" },
            { id: "b", label: "[rowA, rowC]（把找不到的跳过）", labelEn: "[rowA, rowC] (skip the one that was not found)" },
            { id: "c", label: "[rowA, new Error('not found'), rowC]" },
            { id: "d", label: "A 和 C 都可以", labelEn: "A and C are both fine" },
          ],
          answer: ["b"],
          explain: (
            <>
              B 违反了「长度必须等于 keys 长度」这条硬约束。
              更糟的是<strong>顺序也错位了</strong> ——
              DataLoader 会把 <code>rowC</code> 分发给 <code>b</code> 的
              <code>load()</code>，于是「b 拿到了 c 的数据」。
              <strong>这种 bug 不报错，只是数据串了，极难查。</strong>
              <br />
              A 和 C 都合法：<code>null</code> 表示「没有」，
              <code>Error</code> 对象会让那个 <code>load()</code> 的 Promise reject。
              <br />
              所以 batch 函数里<strong>永远不要 filter</strong>。
            </>
          ),
          explainEn: (
            <>
              B breaks the hard rule that the length must equal the length of
              keys. Worse, <strong>the order is now shifted</strong> —
              DataLoader hands <code>rowC</code> to the <code>load()</code> that
              asked for <code>b</code>, so b receives c&apos;s data.{" "}
              <strong>
                That kind of bug raises no error; the data is just wrong, and it
                is very hard to track down.
              </strong>
              <br />
              A and C are both legal: <code>null</code> means there is nothing,
              and an <code>Error</code> object makes that one{" "}
              <code>load()</code> promise reject.
              <br />
              So <strong>never filter inside a batch function</strong>.
            </>
          ),
        },
        {
          kind: "fill-blank",
          id: "g-loader-blanks",
          title: "修好 createOrderLoader 并写出 shippingInfo",
          titleEn: "Fix createOrderLoader and write shippingInfo",
          level: 2,
          prompt: (
            <p>
              两个空。第一个要你填对数据源上<strong>真实存在</strong>的方法名，
              第二个要你用 loader 而不是数据源。
            </p>
          ),
          promptEn: (
            <p>
              Two blanks. The first wants the name of a method that{" "}
              <strong>really exists</strong> on the data source; the second
              wants you to go through the loader rather than the data source.
            </p>
          ),
          language: "js",
          filename: "src/resolvers/orderResolvers.js",
          sourceFile:
            "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js",
          template: `function createOrderLoader(orderDataSource) {
  return new DataLoader(async orderIds => {
    const orders = await Promise.all(
      orderIds.map(id => orderDataSource.___1___(id))
    );
    return orders;
  });
}

// Order.shippingInfo —— 必须走 loader，否则 N+1 考点没答到
async shippingInfo(parent, _, { dataSources, loaders, correlationId }) {
  const shippingInfo = await loaders.___2___.load(parent.id);
  return shippingInfo ?? null;
}`,
          blanks: [
            {
              n: 1,
              accept: ["getOrder"],
              hint: "去 orderDataSource.js 里数一数它到底有哪几个方法。",
              hintEn:
                "Open orderDataSource.js and count which methods it actually has.",
              why: (
                <>
                  <code>getOrder</code>。<code>OrderDataSource</code> 上只有
                  <code>getOrder</code>、<code>getOrdersByUserId</code>、
                  <code>createOrder</code> 三个方法。
                  <br />
                  <strong>starter 代码里写的是 <code>getOrderById</code>，
                  这个方法不存在</strong> —— 这是项目里三个埋雷之一，
                  会导致 <code>TypeError: ... is not a function</code>。
                  <br />
                  教训：<strong>写 resolver 前先把数据源的方法名抄一遍。</strong>
                </>
              ),
              whyEn: (
                <>
                  <code>getOrder</code>. <code>OrderDataSource</code> has only
                  three methods: <code>getOrder</code>,{" "}
                  <code>getOrdersByUserId</code> and <code>createOrder</code>.
                  <br />
                  <strong>
                    The starter code writes <code>getOrderById</code>, and that
                    method does not exist
                  </strong>{" "}
                  — one of the three planted bugs in the project. It produces{" "}
                  <code>TypeError: ... is not a function</code>.
                  <br />
                  The lesson:{" "}
                  <strong>
                    copy out the method names of the data source before you
                    write any resolver.
                  </strong>
                </>
              ),
              width: 12,
            },
            {
              n: 2,
              accept: ["shippingInfoLoader"],
              hint: "context.loaders 里那两个 loader 的确切名字，看 index.js。",
              hintEn:
                "The exact names of the two loaders in context.loaders. Look in index.js.",
              why: (
                <>
                  <code>shippingInfoLoader</code>。
                  <br />
                  <strong>为什么必须用 loader 而不是
                  <code>dataSources.shippingDataSource.getShippingInfo</code>?</strong>
                  后者<strong>也能过测试</strong>，但 TODO 原文明确写着
                  <em>using DataLoader to prevent N+1 queries</em> ——
                  考点就是这个。绕过 loader 等于交白卷还得了分。
                </>
              ),
              whyEn: (
                <>
                  <code>shippingInfoLoader</code>.
                  <br />
                  <strong>
                    Why must you use the loader rather than{" "}
                    <code>dataSources.shippingDataSource.getShippingInfo</code>?
                  </strong>{" "}
                  The latter <strong>also passes the tests</strong>, but the
                  TODO says plainly{" "}
                  <em>using DataLoader to prevent N+1 queries</em> — that is
                  what is being graded. Skipping the loader means passing the
                  test without answering the question.
                </>
              ),
              width: 20,
            },
          ],
        },
        {
          kind: "debug",
          id: "g-debug-loader-method",
          title: "Debug Lab · DataLoader 报 is not a function",
          titleEn: "Debug Lab · DataLoader reports is not a function",
          level: 2,
          prompt: (
            <p>
              跑 <code>npm test</code>，其中一个 DataLoader 相关的测试挂了。
              报错指向 loader 内部。
            </p>
          ),
          promptEn: (
            <p>
              You run <code>npm test</code> and one of the DataLoader tests
              fails. The error points inside the loader.
            </p>
          ),
          errorOutput: `● Order Resolvers › DataLoader functionality › should batch multiple order requests

    TypeError: orderDataSource.getOrderById is not a function

      29 |
      30 |     const orders = await Promise.all(
    > 31 |       orderIds.map(id => orderDataSource.getOrderById(id))
         |                                          ^
      32 |     );
      33 |
      34 |     return orders;

      at src/resolvers/orderResolvers.js:31:42
          at Array.map (<anonymous>)
      at DataLoader._batchLoadFn (src/resolvers/orderResolvers.js:31:16)`,
          broken: demo(
            "js",
            `function createOrderLoader(orderDataSource) {
  return new DataLoader(async orderIds => {
    const orders = await Promise.all(
      orderIds.map(id => orderDataSource.getOrderById(id))
    );
    return orders;
  });
}

// 参考：OrderDataSource 上真实存在的方法
// class OrderDataSource {
//   async getOrder(id) { ... }
//   async getOrdersByUserId(userId) { ... }
//   async createOrder(userId, items) { ... }
// }`,
            {
              filename: "src/resolvers/orderResolvers.js",
              highlight: [4],
              codeEn: `function createOrderLoader(orderDataSource) {
  return new DataLoader(async orderIds => {
    const orders = await Promise.all(
      orderIds.map(id => orderDataSource.getOrderById(id))
    );
    return orders;
  });
}

// For reference: the methods OrderDataSource really has
// class OrderDataSource {
//   async getOrder(id) { ... }
//   async getOrdersByUserId(userId) { ... }
//   async createOrder(userId, items) { ... }
// }`,
            },
          ),
          classify: {
            options: [
              { id: "a", label: "DataLoader 用法错误 —— batch 函数返回了错误的长度", labelEn: "Wrong DataLoader usage — the batch function returned the wrong length" },
              { id: "b", label: "API 契约错误 —— 调用了数据源上不存在的方法", labelEn: "Broken API contract — it calls a method the data source does not have" },
              { id: "c", label: "异步错误 —— 少了 await", labelEn: "An async mistake — a missing await" },
              { id: "d", label: "schema 与 resolver 不匹配", labelEn: "The schema and the resolver do not match" },
            ],
            answer: "b",
          },
          locate: {
            question: "该改成什么？",
            questionEn: "What should it be changed to?",
            options: [
              { id: "a", label: "orderDataSource.getOrder(id)" },
              { id: "b", label: "orderDataSource.getOrdersByUserId(id)" },
              { id: "c", label: "orderDataSource.orders.find(o => o.id === id)" },
              { id: "d", label: "给 OrderDataSource 加一个 getOrderById 方法", labelEn: "Add a getOrderById method to OrderDataSource" },
            ],
            answer: "a",
          },
          fixed: real(
            "js",
            `function createOrderLoader(orderDataSource) {
  return new DataLoader(async orderIds => {
    console.log(\`[DataLoader] Batching \${orderIds.length} order requests\`);

    // FIX: OrderDataSource 暴露的是 getOrder(id)，不是 getOrderById(id)
    const orders = await Promise.all(
      orderIds.map(id => orderDataSource.getOrder(id))
    );

    return orders;
  });
}`,
            {
              filename: "改对之后（审计时实测这样改后 10/10 通过）",
              filenameEn:
                "After the fix (measured in the audit: 10/10 tests pass)",
              codeEn: `function createOrderLoader(orderDataSource) {
  return new DataLoader(async orderIds => {
    console.log(\`[DataLoader] Batching \${orderIds.length} order requests\`);

    // FIX: OrderDataSource exposes getOrder(id), not getOrderById(id)
    const orders = await Promise.all(
      orderIds.map(id => orderDataSource.getOrder(id))
    );

    return orders;
  });
}`,
              highlight: [5, 6, 7, 8],
            },
          ),
          rootCause: (
            <>
              <p>
                <code>OrderDataSource</code> 上只有三个方法：
                <code>getOrder</code>、<code>getOrdersByUserId</code>、
                <code>createOrder</code>。<code>getOrderById</code> 不存在，
                所以它是 <code>undefined</code>，调用 undefined 抛 TypeError。
              </p>
              <p>
                <strong>为什么这个错这么容易犯？</strong>
                因为 <code>getOrderById</code> 是个<strong>非常自然的名字</strong>——
                很多项目就是这么命名的。出题人正是利用了这一点：
                你会凭直觉往下写，而不去核对。
              </p>
              <p>
                <strong>选项 D 为什么不行？</strong>
                README 明确标了 <code>dataSources/orderDataSource.js</code> 是
                <strong>PROVIDED</strong>（给好了，别动）。
                改它可能导致判卷时被替换回原版，你的改动全废。
                <strong>只改标了 EDIT THIS 的文件。</strong>
              </p>
              <p>
                预防办法很朴素：<strong>写 resolver 之前，
                打开数据源文件，把所有方法的名字和签名抄在纸上。</strong>
                本门课「读题」那节会给你一张现成的表。
              </p>
            </>
          ),
          rootCauseEn: (
            <>
              <p>
                <code>OrderDataSource</code> has only three methods:{" "}
                <code>getOrder</code>, <code>getOrdersByUserId</code> and{" "}
                <code>createOrder</code>. <code>getOrderById</code> does not
                exist, so it is <code>undefined</code>, and calling undefined
                throws a TypeError.
              </p>
              <p>
                <strong>Why is this mistake so easy to make?</strong> Because{" "}
                <code>getOrderById</code> is a{" "}
                <strong>completely natural name</strong> — plenty of projects
                do name it that. Whoever wrote the exam is counting on that:
                you write what feels right instead of checking.
              </p>
              <p>
                <strong>Why is option D not allowed?</strong> The README marks{" "}
                <code>dataSources/orderDataSource.js</code> as{" "}
                <strong>PROVIDED</strong>, meaning it is given to you and you
                leave it alone. Change it and the grader may swap the original
                back in, throwing away all your edits.{" "}
                <strong>Only change files marked EDIT THIS.</strong>
              </p>
              <p>
                The way to avoid this is plain:{" "}
                <strong>
                  before writing a resolver, open the data source file and copy
                  every method name and signature onto paper.
                </strong>{" "}
                The lesson on reading the exam text gives you a ready-made
                table.
              </p>
            </>
          ),
          verify: "npm test   # should batch multiple order requests 应该通过",
          verifyEn:
            "npm test   # should batch multiple order requests must pass",
        },
      ],
      transfer: [
        { signal: "「一个列表里每项都要查关联数据」", signalEn: "Every item in a list needs related data fetched", reachFor: "N+1 风险，上 DataLoader", reachForEn: "N+1 risk; use a DataLoader" },
        { signal: "TODO 里出现「prevent N+1」", signalEn: "A TODO says prevent N+1", reachFor: "必须走 loader.load()，不能直接调数据源", reachForEn: "Go through loader.load(); do not call the data source directly" },
        { signal: "写 batch 函数", signalEn: "You are writing a batch function", reachFor: "keys.map + Promise.all；长度和顺序必须对齐，缺失填 null", reachForEn: "keys.map plus Promise.all; keep length and order aligned, fill missing entries with null" },
        { signal: "「数据不刷新」或「看到了别人的数据」", signalEn: "Data does not refresh, or one user sees another user's data", reachFor: "查 loader 是不是建在了模块顶层", reachForEn: "Check whether the loader was created at module top level" },
        { signal: "xxx is not a function", signalEn: "xxx is not a function", reachFor: "去被调对象的定义里核对方法名", reachForEn: "Open the definition of the object you called and check the method name" },
      ],
      recap: [
        "N+1 是 GraphQL 执行模型的天然产物：1 次列表查询 + N 次字段 resolver。",
        "DataLoader 攒同一个 tick 里的所有 load()，tick 结束时调一次 batch 函数。",
        "batch 函数的两条硬约束：返回长度等于 keys 长度、顺序一一对应，缺失填 null。",
        "loader 必须每请求新建 —— 否则数据不刷新，还可能跨用户泄漏。",
        "createOrderLoader 里的 getOrderById 是埋雷，真实方法名是 getOrder。",
      ],
      recapEn: [
        "N+1 comes out of the GraphQL execution model: one list query plus N field resolver calls.",
        "DataLoader collects every load() made in the same tick and calls the batch function once when the tick ends.",
        "The two hard rules for a batch function: return as many items as there are keys, in the same order, and use null where an item is missing.",
        "A loader must be created once per request. Otherwise data goes stale and can leak between users.",
        "getOrderById inside createOrderLoader is a planted bug. The real method name is getOrder.",
      ],
    },
  ],
};
