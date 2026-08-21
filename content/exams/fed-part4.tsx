// Federation 考试 —— 模块 6：综合 Debug Lab + 从零重写。

import type { Module } from "../types";
import { demo, real } from "../helpers";

const FULL_RESOLVERS = `import DataLoader from 'dataloader';
import { GraphQLError } from 'graphql';

const ErrorCodes = {
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  INVALID_INPUT: 'INVALID_INPUT',
  INVENTORY_ERROR: 'INVENTORY_ERROR',
  SERVICE_ERROR: 'SERVICE_ERROR'
};

function createShippingInfoLoader(shippingDataSource) {
  return new DataLoader(async orderIds => {
    console.log(\`[DataLoader] Batching \${orderIds.length} shipping info requests\`);
    const shippingInfos = await Promise.all(
      orderIds.map(id => shippingDataSource.getShippingInfo(id))
    );
    return shippingInfos;
  });
}

function createOrderLoader(orderDataSource) {
  return new DataLoader(async orderIds => {
    console.log(\`[DataLoader] Batching \${orderIds.length} order requests\`);
    // FIX（埋雷 1）：数据源暴露的是 getOrder(id)，不是 getOrderById(id)
    const orders = await Promise.all(
      orderIds.map(id => orderDataSource.getOrder(id))
    );
    return orders;
  });
}

export const resolvers = {
  User: {
    __resolveReference(user, { dataSources, loaders }) {
      return { id: user.id };
    },

    async orders(user, _, { dataSources, loaders, correlationId }) {
      try {
        console.log(\`[\${correlationId}] Resolving User.orders for userId: \${user.id}\`);
        const orders = await dataSources.orderDataSource.getOrdersByUserId(user.id);
        return orders ?? [];                     // schema: [Order!]!
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
    }
  },

  Order: {
    async shippingInfo(parent, _, { dataSources, loaders, correlationId }) {
      try {
        // 走 loader 才能把 N 次合并成 1 次
        const shippingInfo = await loaders.shippingInfoLoader.load(parent.id);
        return shippingInfo ?? null;             // schema: ShippingInfo（可空）
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
    }
  },

  Query: {
    async order(_, { id }, { dataSources, loaders, correlationId }) {
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
            extensions: { code: ErrorCodes.INVALID_INPUT, correlationId }
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

        // OrderItemInput 只有 productId + quantity，
        // 而数据源要算 item.price * item.quantity -> 先补价格
        const pricedItems = await Promise.all(
          items.map(async item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: await dataSources.inventoryDataSource.getProductPrice(item.productId)
          }))
        );

        // FIX（埋雷 2）：context 里叫 orderDataSource，签名是 (userId, items)
        const order = await dataSources.orderDataSource.createOrder(userId, pricedItems);
        console.log(\`[\${correlationId}] Order created: \${order.id}\`);

        return order;
      } catch (error) {
        // FIX（埋雷 3）：已结构化的错误原样放行，
        // 否则 INVALID_INPUT 会以 SERVICE_ERROR 的形式到客户端
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
    }
  }
};

export { createShippingInfoLoader, createOrderLoader };`;

const VERIFY_SCRIPT = `// verify-schema.mjs —— 放在 node-subgraph/ 下：node verify-schema.mjs
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

const log = console.log;
console.log = () => {};   // 静音 resolver 日志，只看结果

const sdl = await run('{ _service { sdl } }');
log('SDL emitted:', !!sdl.data?._service?.sdl, '| errors:', sdl.errors?.length ?? 0);
log('SDL has @key:', /@key\\(fields:\\s*"id"\\)/.test(sdl.data._service.sdl));

const q1 = await run('{ orders(userId:"123") { id status totalAmount shippingInfo { status trackingNumber } } }');
log('Query.orders + shippingInfo:', JSON.stringify(q1.data), '| errors:', JSON.stringify(q1.errors ?? []));

const q2 = await run('{ order(id:"order-457") { id userId status } }');
log('Query.order:', JSON.stringify(q2.data));

const q3 = await run('{ order(id:"order-999") { id } }');
log('Query.order not found code:', q3.errors?.map(e => e.extensions.code));

const q4 = await run(
  'query($r:[_Any!]!){ _entities(representations:$r) { ... on User { id orders { id status } } } }',
  { r: [{ __typename: 'User', id: '123' }] }
);
log('_entities User.orders:', JSON.stringify(q4.data), '| errors:', JSON.stringify(q4.errors ?? []));

const q5 = await run('mutation { createOrder(userId:"789", items:[{productId:"prod-789", quantity:2}]) { id totalAmount items { productId quantity price } } }');
log('Mutation.createOrder:', JSON.stringify(q5.data), '| errors:', JSON.stringify(q5.errors ?? []));

const q6 = await run('mutation { createOrder(userId:"789", items:[]) { id } }');
log('createOrder empty items code:', q6.errors?.map(e => e.extensions.code));`;

// English side of FULL_RESOLVERS. The line count must match it exactly, because
// highlight is a line number. audit:code only pairs inline template literals,
// so it cannot see a codeEn passed by constant like this one.
const FULL_RESOLVERS_EN = `import DataLoader from 'dataloader';
import { GraphQLError } from 'graphql';

const ErrorCodes = {
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  INVALID_INPUT: 'INVALID_INPUT',
  INVENTORY_ERROR: 'INVENTORY_ERROR',
  SERVICE_ERROR: 'SERVICE_ERROR'
};

function createShippingInfoLoader(shippingDataSource) {
  return new DataLoader(async orderIds => {
    console.log(\`[DataLoader] Batching \${orderIds.length} shipping info requests\`);
    const shippingInfos = await Promise.all(
      orderIds.map(id => shippingDataSource.getShippingInfo(id))
    );
    return shippingInfos;
  });
}

function createOrderLoader(orderDataSource) {
  return new DataLoader(async orderIds => {
    console.log(\`[DataLoader] Batching \${orderIds.length} order requests\`);
    // FIX (planted bug 1): the data source exposes getOrder(id), not getOrderById(id)
    const orders = await Promise.all(
      orderIds.map(id => orderDataSource.getOrder(id))
    );
    return orders;
  });
}

export const resolvers = {
  User: {
    __resolveReference(user, { dataSources, loaders }) {
      return { id: user.id };
    },

    async orders(user, _, { dataSources, loaders, correlationId }) {
      try {
        console.log(\`[\${correlationId}] Resolving User.orders for userId: \${user.id}\`);
        const orders = await dataSources.orderDataSource.getOrdersByUserId(user.id);
        return orders ?? [];                     // schema: [Order!]!
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
    }
  },

  Order: {
    async shippingInfo(parent, _, { dataSources, loaders, correlationId }) {
      try {
        // Going through the loader is what turns N calls into 1
        const shippingInfo = await loaders.shippingInfoLoader.load(parent.id);
        return shippingInfo ?? null;             // schema: ShippingInfo (nullable)
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
    }
  },

  Query: {
    async order(_, { id }, { dataSources, loaders, correlationId }) {
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
            extensions: { code: ErrorCodes.INVALID_INPUT, correlationId }
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

        // OrderItemInput has only productId + quantity, while the data source
        // computes item.price * item.quantity -> fetch the price first
        const pricedItems = await Promise.all(
          items.map(async item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: await dataSources.inventoryDataSource.getProductPrice(item.productId)
          }))
        );

        // FIX (planted bug 2): in context it is orderDataSource, signature (userId, items)
        const order = await dataSources.orderDataSource.createOrder(userId, pricedItems);
        console.log(\`[\${correlationId}] Order created: \${order.id}\`);

        return order;
      } catch (error) {
        // FIX (planted bug 3): let an already structured error through untouched,
        // otherwise INVALID_INPUT reaches the client as SERVICE_ERROR
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
    }
  }
};

export { createShippingInfoLoader, createOrderLoader };`;

// English side of VERIFY_SCRIPT. Same rule: the line count must match.
const VERIFY_SCRIPT_EN = `// verify-schema.mjs — put it in node-subgraph/, run: node verify-schema.mjs
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

const log = console.log;
console.log = () => {};   // silence the resolver logs, show only results

const sdl = await run('{ _service { sdl } }');
log('SDL emitted:', !!sdl.data?._service?.sdl, '| errors:', sdl.errors?.length ?? 0);
log('SDL has @key:', /@key\\(fields:\\s*"id"\\)/.test(sdl.data._service.sdl));

const q1 = await run('{ orders(userId:"123") { id status totalAmount shippingInfo { status trackingNumber } } }');
log('Query.orders + shippingInfo:', JSON.stringify(q1.data), '| errors:', JSON.stringify(q1.errors ?? []));

const q2 = await run('{ order(id:"order-457") { id userId status } }');
log('Query.order:', JSON.stringify(q2.data));

const q3 = await run('{ order(id:"order-999") { id } }');
log('Query.order not found code:', q3.errors?.map(e => e.extensions.code));

const q4 = await run(
  'query($r:[_Any!]!){ _entities(representations:$r) { ... on User { id orders { id status } } } }',
  { r: [{ __typename: 'User', id: '123' }] }
);
log('_entities User.orders:', JSON.stringify(q4.data), '| errors:', JSON.stringify(q4.errors ?? []));

const q5 = await run('mutation { createOrder(userId:"789", items:[{productId:"prod-789", quantity:2}]) { id totalAmount items { productId quantity price } } }');
log('Mutation.createOrder:', JSON.stringify(q5.data), '| errors:', JSON.stringify(q5.errors ?? []));

const q6 = await run('mutation { createOrder(userId:"789", items:[]) { id } }');
log('createOrder empty items code:', q6.errors?.map(e => e.extensions.code));`;

export const fedMastery: Module = {
  id: "fed-mastery",
  stage: "Federation · 第 6 部分",
  title: "综合 Debug 与从零重写",
  titleEn: "Mixed debugging, and rewriting from an empty directory",
  summary:
    "把 GraphQL 和 Spring 两边的典型故障集中练一遍，然后在没有答案的情况下从空目录重建整个 subgraph 和整个控制器。",
  summaryEn:
    "Practice the common failures on both the GraphQL side and the Spring side in one place, then rebuild the whole subgraph and the whole controller from an empty directory, with no answer to look at.",
  lessons: [
    /* ---------- 6.1 ---------- */
    {
      id: "g-debug-lab",
      title: "Debug Lab · Federation 十种典型故障",
      titleEn: "Debug Lab · ten common Federation failures",
      blurb: "从「resolver 写了但返回 null」到「composition 失败」，每一种都给真实报错。",
      blurbEn:
        "From a resolver that runs but returns null, to a composition failure. Every case comes with the real error text.",
      minutes: 22,
      objectives: [
        "看到 GraphQL 报错能先归类，再决定去哪个文件找",
        "认出「不报错但返回 null」这一类最难查的故障",
        "掌握 composition 失败的排查顺序",
        "把错误信息和根因建立稳定的对应关系",
      ],
      objectivesEn: [
        "Sort a GraphQL error into a category first, then decide which file to open",
        "Recognize the hardest failure type: nothing is reported, but the field comes back null",
        "Know the order in which to check a composition failure",
        "Build a reliable mapping from each error message to its root cause",
      ],
      whyForAssessment:
        "这门考试有一半时间花在「为什么测试还是红的」。GraphQL 的报错比 React 更隐蔽 —— 很多错误表现为「静默返回 null」而不是抛异常。",
      whyForAssessmentEn:
        "Half of the time in this exam goes to one question: why is the test still failing? GraphQL errors are harder to spot than React errors. Many of them show up as a null value with no message, not as a thrown exception.",
      sourceFiles: [
        {
          path: "graphql-federation-practice/node-subgraph/src/",
          role: "所有故障都基于这个项目的真实代码",
        },
      ],
      concepts: [
        {
          id: "triage",
          heading: "先分诊：GraphQL 故障的六类",
          headingEn: "Triage first: six categories of GraphQL failure",
          body: (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>类别</th>
                      <th>典型信号</th>
                      <th>去哪找</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>schema 校验</strong></td>
                      <td>
                        <code>Cannot query field &quot;x&quot; on type &quot;Y&quot;</code>
                      </td>
                      <td>查询写错了，或 schema 里真没这个字段</td>
                    </tr>
                    <tr>
                      <td><strong>非空违约</strong></td>
                      <td>
                        <code>Cannot return null for non-nullable field</code>
                      </td>
                      <td>resolver 忘了 <code>?? []</code> 兜底</td>
                    </tr>
                    <tr>
                      <td><strong>跨模块契约</strong></td>
                      <td>
                        <code>x is not a function</code>、
                        <code>Cannot read properties of undefined</code>
                      </td>
                      <td>方法名 / context 键名 / 签名对不上</td>
                    </tr>
                    <tr>
                      <td><strong>名字不匹配</strong></td>
                      <td>
                        <strong>没有报错</strong>，字段静默返回 null
                      </td>
                      <td>
                        resolver 的键名和 schema 字段名不一致
                      </td>
                    </tr>
                    <tr>
                      <td><strong>错误语义</strong></td>
                      <td>
                        有报错但 <code>extensions.code</code> 不对
                      </td>
                      <td>catch 把结构化错误重新包装了</td>
                    </tr>
                    <tr>
                      <td><strong>composition</strong></td>
                      <td>
                        Router 启动失败 / <code>Unknown directive</code>
                      </td>
                      <td>schema 的 @link / @key 声明</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>第四类是 GraphQL 特有的、也是最难查的。</strong>
                React 里名字写错通常会有类型错误或运行时报错；
                GraphQL 里 resolver 就是个普通对象的键 ——
                键名写错等于「这个 resolver 不存在」，
                执行器于是用默认 resolver（取 <code>parent[字段名]</code>），
                取不到就返回 <code>null</code>。<strong>一声不响。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Typical signal</th>
                      <th>Where to look</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Schema validation</strong></td>
                      <td>
                        <code>Cannot query field &quot;x&quot; on type &quot;Y&quot;</code>
                      </td>
                      <td>
                        The query is wrong, or the schema really has no such field
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Non-null violation</strong></td>
                      <td>
                        <code>Cannot return null for non-nullable field</code>
                      </td>
                      <td>
                        A resolver forgot its <code>?? []</code> fallback
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Cross-module contract</strong></td>
                      <td>
                        <code>x is not a function</code>,{" "}
                        <code>Cannot read properties of undefined</code>
                      </td>
                      <td>
                        A method name, a context key or a signature does not line
                        up
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Name mismatch</strong></td>
                      <td>
                        <strong>No error at all</strong>, the field silently
                        returns null
                      </td>
                      <td>
                        The resolver key does not match the schema field name
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Error semantics</strong></td>
                      <td>
                        There is an error, but <code>extensions.code</code> is
                        wrong
                      </td>
                      <td>
                        A catch block re-wrapped an already structured error
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Composition</strong></td>
                      <td>
                        Router fails to start / <code>Unknown directive</code>
                      </td>
                      <td>The @link / @key declarations in the schema</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>
                  The fourth category is peculiar to GraphQL, and the hardest to
                  track down.
                </strong>{" "}
                In React a misspelled name usually gives you a type error or a
                runtime throw. In GraphQL a resolver is just a key on a plain
                object — misspell the key and the resolver simply does not exist,
                so the executor falls back to the default resolver (read{" "}
                <code>parent[fieldName]</code>) and returns <code>null</code>{" "}
                when there is nothing there. <strong>Not a peep.</strong>
              </p>
            </>
          ),
        },
        {
          id: "silent-null",
          heading: "「静默返回 null」的三种成因",
          headingEn: "Three causes of a silent null",
          lede: "看到某个字段是 null 而你确信写了 resolver，按这三条查。",
          ledeEn:
            "When a field comes back null and you are sure you wrote the resolver, check these three things.",
          body: (
            <>
              <ol>
                <li>
                  <strong>resolver 的键名和 schema 字段名不一致。</strong>
                  schema 里是 <code>shippingInfo</code>，
                  你写成了 <code>shipping</code> 或 <code>shippingInfos</code>。
                  <strong>大小写也算</strong>。
                </li>
                <li>
                  <strong>resolver 挂在了错误的类型下。</strong>
                  <code>shippingInfo</code> 是 <code>Order</code> 上的字段，
                  写进 <code>resolvers.Query</code> 里就永远不会被调用。
                </li>
                <li>
                  <strong>忘了 return。</strong>
                  <code>async shippingInfo(parent, _, ctx) {"{ loaders.x.load(parent.id) }"}</code>
                  —— 算了但没返回，async 函数返回 <code>undefined</code>。
                </li>
              </ol>
              <p>
                <strong>排查手法：</strong>
                在 resolver 第一行放一个 <code>console.log</code>。
                <strong>如果那行日志根本没打印</strong>，
                就是第 1 或第 2 种；打印了但结果是 null，
                就是第 3 种或数据源真的没数据。
              </p>
              <p>
                这个手法很朴素，但它能在十秒内区分
                「我的 resolver 没被调用」和「我的 resolver 逻辑错了」——
                这两者的排查方向完全不同。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <ol>
                <li>
                  <strong>
                    The resolver key does not match the schema field name.
                  </strong>{" "}
                  The schema says <code>shippingInfo</code> and you wrote{" "}
                  <code>shipping</code> or <code>shippingInfos</code>.{" "}
                  <strong>Case counts too.</strong>
                </li>
                <li>
                  <strong>The resolver is hanging off the wrong type.</strong>{" "}
                  <code>shippingInfo</code> is a field on <code>Order</code>; put
                  it inside <code>resolvers.Query</code> and it will never be
                  called.
                </li>
                <li>
                  <strong>You forgot the return.</strong>{" "}
                  <code>async shippingInfo(parent, _, ctx) {"{ loaders.x.load(parent.id) }"}</code>{" "}
                  — the work happens but nothing comes back, so the async
                  function resolves to <code>undefined</code>.
                </li>
              </ol>
              <p>
                <strong>How to find out which:</strong> drop a{" "}
                <code>console.log</code> on the first line of the resolver.{" "}
                <strong>If that line never prints</strong>, it is case 1 or 2. If
                it prints but the result is null, it is case 3 — or the data
                source genuinely has no data.
              </p>
              <p>
                It is a crude trick, but it tells you within ten seconds whether
                your resolver was never called or your resolver logic is wrong —
                and those two send you looking in completely different places.
              </p>
            </>
          ),
        },
        {
          id: "composition",
          heading: "composition 失败怎么排",
          headingEn: "How to debug a composition failure",
          lede: "本仓库没有 Router，但这类问题值得知道 —— 而且 _service 能测出一半。",
          ledeEn:
            "This repository has no Router, but the failure is still worth knowing. A test on _service already catches half of these cases.",
          body: (
            <>
              <p>
                Router 启动时会向每个 subgraph 查
                <code>{"{ _service { sdl } }"}</code>，
                然后把所有 SDL 组合成 supergraph。
                这一步失败的常见原因：
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>原因</th>
                      <th>报错长什么样</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <code>@key</code> 指定的字段在类型里不存在
                      </td>
                      <td>
                        <code>
                          On type &quot;User&quot;, for @key(fields: &quot;uid&quot;) —
                          Cannot query field &quot;uid&quot;
                        </code>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        用了 directive 但 <code>@link</code> 的 import 里没列
                      </td>
                      <td><code>Unknown directive &quot;@shareable&quot;</code></td>
                    </tr>
                    <tr>
                      <td>
                        两个 subgraph 定义了同名非 entity 类型且未标{" "}
                        <code>@shareable</code>
                      </td>
                      <td>
                        <code>
                          Field &quot;X.y&quot; can only be defined in one subgraph
                        </code>
                      </td>
                    </tr>
                    <tr>
                      <td>entity 缺 <code>@key</code></td>
                      <td>
                        <code>
                          Type &quot;User&quot; has no @key directive but is
                          referenced
                        </code>
                      </td>
                    </tr>
                    <tr>
                      <td>subgraph URL 写错 / 服务没起</td>
                      <td>
                        <code>Couldn&apos;t load service definitions for ...</code>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>本地能测出一半：</strong>
                前四类里有三类会在 <code>buildSubgraphSchema</code>
                这一步就炸（服务起不来），或者让
                <code>{"{ _service { sdl } }"}</code> 报错。
                所以<strong>「服务能起来 + SDL 查得出来」
                已经排除了大部分 composition 问题。</strong>
              </p>
              <p>
                真跨 subgraph 的冲突（第三类）本地测不出来 ——
                需要两个 subgraph 才能复现。这类问题在本次 assessment 里不会遇到，
                因为只有一个 subgraph。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                At startup the Router asks every subgraph for{" "}
                <code>{"{ _service { sdl } }"}</code> and stitches all the SDL
                into a supergraph. Common reasons that step fails:
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Cause</th>
                      <th>What the error looks like</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        A field named in <code>@key</code> does not exist on the
                        type
                      </td>
                      <td>
                        <code>
                          On type &quot;User&quot;, for @key(fields: &quot;uid&quot;) —
                          Cannot query field &quot;uid&quot;
                        </code>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        A directive is used but not listed in the{" "}
                        <code>@link</code> import
                      </td>
                      <td><code>Unknown directive &quot;@shareable&quot;</code></td>
                    </tr>
                    <tr>
                      <td>
                        Two subgraphs define the same non-entity type without{" "}
                        <code>@shareable</code>
                      </td>
                      <td>
                        <code>
                          Field &quot;X.y&quot; can only be defined in one subgraph
                        </code>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        An entity is missing its <code>@key</code>
                      </td>
                      <td>
                        <code>
                          Type &quot;User&quot; has no @key directive but is
                          referenced
                        </code>
                      </td>
                    </tr>
                    <tr>
                      <td>Wrong subgraph URL, or the service is not running</td>
                      <td>
                        <code>Couldn&apos;t load service definitions for ...</code>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>You can catch half of these locally:</strong> three of
                the first four fail right at{" "}
                <code>buildSubgraphSchema</code> (the service will not start), or
                make <code>{"{ _service { sdl } }"}</code> throw. So{" "}
                <strong>
                  &ldquo;the service starts and the SDL comes out&rdquo; has
                  already ruled out most composition problems.
                </strong>
              </p>
              <p>
                A genuine cross-subgraph conflict (the third row) cannot be
                reproduced locally — you need two subgraphs for that. You will not
                hit it in this assessment, because there is only one subgraph.
              </p>
            </>
          ),
        },
        {
          id: "the-verify-script",
          heading: "一个脚本把该验的全验一遍",
          headingEn: "One script that checks every item at once",
          lede: "做完 Task 1 之后，跑这个比反复 npm test 有用。",
          ledeEn:
            "After you finish Task 1, running this tells you more than running npm test again and again.",
          body: (
            <>
              <p>
                <code>npm test</code> 只覆盖了单元层面。
                下面这个脚本（审计时实际用的）在<strong>进程内</strong>
                把 federation 的关键路径全走一遍，
                不需要起服务器、不占端口：
              </p>
              <p>
                <strong>期望输出</strong>（参考解法下审计实测）：
              </p>
              <p>
                八行输出对应八件事：SDL 出得来、@key 在里面、
                普通查询 + 字段 resolver 正常、按 id 查正常、
                找不到时错误码正确、entity 解析正常、
                mutation 的价格补全正常、校验错误码正确。
                <strong>全对了，Task 1 就真的做完了。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>npm test</code> only covers the unit level. The script
                below (the one actually used during the audit) walks every
                important federation path <strong>in-process</strong> — no server
                to start, no port to occupy:
              </p>
              <p>
                <strong>Expected output</strong> (measured against the reference
                solution during the audit):
              </p>
              <p>
                Eight lines of output cover: the SDL comes out, @key is in it, a
                plain query plus a field resolver work, lookup by id works, the
                error code on a miss is right, entity resolution works, the
                mutation fills in prices, and the validation error code is
                right.{" "}
                <strong>All green means Task 1 is genuinely finished.</strong>
              </p>
            </>
          ),
          code: [
            real("js", VERIFY_SCRIPT, {
              filename: "verify-schema.mjs",
              codeEn: VERIFY_SCRIPT_EN,
              collapsible: true,
            }),
            real(
              "text",
              `SDL emitted: true | errors: 0
SDL has @key: true
Query.orders + shippingInfo: {"orders":[
  {"id":"order-456","status":"SHIPPED","totalAmount":299.99,
   "shippingInfo":{"status":"IN_TRANSIT","trackingNumber":"TRACK123456"}},
  {"id":"order-457","status":"DELIVERED","totalAmount":89.99,
   "shippingInfo":{"status":"DELIVERED","trackingNumber":"TRACK123457"}}]} | errors: []
Query.order: {"order":{"id":"order-457","userId":"123","status":"DELIVERED"}}
Query.order not found code: [ 'ORDER_NOT_FOUND' ]
_entities User.orders: {"_entities":[{"id":"123","orders":[
  {"id":"order-456","status":"SHIPPED"},{"id":"order-457","status":"DELIVERED"}]}]} | errors: []
Mutation.createOrder: {"createOrder":{"id":"order-1785737900978","totalAmount":299.98,
  "items":[{"productId":"prod-789","quantity":2,"price":149.99}]}} | errors: []
createOrder empty items code: [ 'INVALID_INPUT' ]`,
              {
                filename: "审计时的真实输出",
                filenameEn: "The real output from the audit",
              },
            ),
          ],
        },
      ],
      exercises: [
        {
          kind: "debug",
          id: "g-lab-resolver-name",
          title: "故障 1 · resolver 写了，字段还是 null",
          titleEn: "Fault 1 · the resolver is written, the field is still null",
          level: 3,
          prompt: (
            <p>
              你确信写了 <code>shippingInfo</code> 的实现，
              测试也不报错，但查询返回的 <code>shippingInfo</code> 是
              <code>null</code>。控制台里连你加的 log 都没打印。
            </p>
          ),
          promptEn: (
            <p>
              You are sure you wrote an implementation for{" "}
              <code>shippingInfo</code>, and no test reports anything, but the
              query returns <code>shippingInfo</code> as <code>null</code>. Not
              even the log line you added prints on the console.
            </p>
          ),
          errorOutput: `# 没有任何报错。
$ node verify-schema.mjs
Query.orders + shippingInfo: {"orders":[
  {"id":"order-456","status":"SHIPPED","shippingInfo":null},
  {"id":"order-457","status":"DELIVERED","shippingInfo":null}]}
errors: []

# 你在 resolver 第一行加的 console.log('>>> shippingInfo called')
# 一次都没打印。`,
          broken: demo(
            "js",
            `export const resolvers = {
  Order: {
    async shipping(parent, _, { loaders }) {          // ← 名字
      console.log('>>> shippingInfo called');
      return loaders.shippingInfoLoader.load(parent.id);
    }
  },
  ...
};

// 参考 schema.graphql：
// type Order {
//   ...
//   shippingInfo: ShippingInfo
// }`,
            {
              filename: "src/resolvers/orderResolvers.js",
              highlight: [3],
              codeEn: `export const resolvers = {
  Order: {
    async shipping(parent, _, { loaders }) {          // ← the name
      console.log('>>> shippingInfo called');
      return loaders.shippingInfoLoader.load(parent.id);
    }
  },
  ...
};

// For reference, schema.graphql says:
// type Order {
//   ...
//   shippingInfo: ShippingInfo
// }`,
            },
          ),
          classify: {
            options: [
              { id: "a", label: "非空违约 —— 忘了兜底", labelEn: "A non-null violation — the fallback is missing" },
              { id: "b", label: "名字不匹配 —— resolver 的键名和 schema 字段名不一致，这个 resolver 从未被调用", labelEn: "A name mismatch — the resolver key does not match the schema field name, so this resolver is never called" },
              { id: "c", label: "DataLoader 用法错误", labelEn: "Wrong DataLoader usage" },
              { id: "d", label: "context 键名错误", labelEn: "A wrong key name in context" },
            ],
            answer: "b",
          },
          locate: {
            question: "该改哪里？",
            questionEn: "What should be changed?",
            options: [
              { id: "a", label: "把 resolver 的键名从 shipping 改成 shippingInfo", labelEn: "Rename the resolver key from shipping to shippingInfo" },
              { id: "b", label: "把 schema 里的字段名改成 shipping", labelEn: "Rename the schema field to shipping" },
              { id: "c", label: "在 resolver 里加 return null 兜底", labelEn: "Add a return null fallback inside the resolver" },
              { id: "d", label: "把它挪到 resolvers.Query 下面", labelEn: "Move it under resolvers.Query" },
            ],
            answer: "a",
          },
          fixed: real(
            "js",
            `Order: {
  async shippingInfo(parent, _, { dataSources, loaders, correlationId }) {
    const shippingInfo = await loaders.shippingInfoLoader.load(parent.id);
    return shippingInfo ?? null;
  }
},`,
            {
              filename: "改对之后",
              filenameEn: "After the fix",
            },
          ),
          rootCause: (
            <>
              <p>
                <strong>resolver 就是一个普通对象的键。</strong>
                执行器解析 <code>Order.shippingInfo</code> 时，
                去 <code>resolvers.Order.shippingInfo</code> 找 ——
                找不到（你写的是 <code>shipping</code>），
                于是用<strong>默认 resolver</strong>：
                取 <code>parent.shippingInfo</code>。
              </p>
              <p>
                而数据源返回的 order 对象上<strong>没有</strong>
                <code>shippingInfo</code> 属性（物流在另一个服务），
                所以拿到 <code>undefined</code> → 序列化成 <code>null</code>。
                <strong>字段可空，所以不报错。</strong>
              </p>
              <p>
                <strong>「log 一次都没打印」是决定性线索。</strong>
                它说明这个函数从未被调用 —— 排除了「逻辑写错」，
                直接指向「名字或位置不对」。
                <strong>遇到静默 null 时，第一件事就是在 resolver
                第一行放 log 确认它有没有被调用。</strong>
              </p>
              <p>
                <strong>选项 B（改 schema）为什么不行？</strong>
                <code>schema.graphql</code> 是 PROVIDED，
                而且改字段名会破坏客户端契约和测试。
              </p>
            </>
          ),
          rootCauseEn: (
            <>
              <p>
                <strong>A resolver is just a key on an ordinary object.</strong>{" "}
                When the executor resolves <code>Order.shippingInfo</code> it
                looks for <code>resolvers.Order.shippingInfo</code>, does not
                find it (you wrote <code>shipping</code>), and falls back to the{" "}
                <strong>default resolver</strong>, which reads{" "}
                <code>parent.shippingInfo</code>.
              </p>
              <p>
                And the order object the data source returns{" "}
                <strong>has no</strong> <code>shippingInfo</code> property,
                because shipping lives in another service. So the value is{" "}
                <code>undefined</code>, which serializes as <code>null</code>.{" "}
                <strong>The field is nullable, so nothing reports an
                error.</strong>
              </p>
              <p>
                <strong>
                  &ldquo;The log never printed&rdquo; is the decisive clue.
                </strong>{" "}
                It says the function was never called, which rules out a logic
                mistake and points straight at a wrong name or wrong place.{" "}
                <strong>
                  When a field is silently null, the first thing to do is put a
                  log on the first line of the resolver and confirm whether it
                  runs at all.
                </strong>
              </p>
              <p>
                <strong>Why is option B, editing the schema, not allowed?</strong>{" "}
                <code>schema.graphql</code> is PROVIDED, and renaming the field
                would break the client contract and the tests.
              </p>
            </>
          ),
          verify: "node verify-schema.mjs   # shippingInfo 应该有值，且日志出现 Batching",
          verifyEn:
            "node verify-schema.mjs   # shippingInfo should have a value, and the log should show Batching",
        },
        {
          kind: "debug",
          id: "g-lab-nonnull",
          title: "故障 2 · Cannot return null for non-nullable field",
          titleEn: "Fault 2 · Cannot return null for non-nullable field",
          level: 2,
          prompt: (
            <p>
              查一个没有订单的用户，整个 <code>data</code> 变成了
              <code>null</code>，而且 errors 里有一条很长的消息。
            </p>
          ),
          promptEn: (
            <p>
              You query a user who has no orders, the whole <code>data</code>{" "}
              turns into <code>null</code>, and errors carries one very long
              message.
            </p>
          ),
          errorOutput: `$ node verify-schema.mjs
Query.orders: {"orders":null}

errors: [{
  "message": "Cannot return null for non-nullable field Query.orders.",
  "path": ["orders"],
  "extensions": { "code": "INTERNAL_SERVER_ERROR" }
}]

# 更严重的情况：如果查询是嵌套的，整个 data 会变成 null`,
          broken: demo(
            "js",
            `async orders(_, { userId }, { dataSources, correlationId }) {
  const orders = await dataSources.orderDataSource.getOrdersByUserId(userId);
  return orders;                     // 数据源可能返回 undefined
}

// 参考 schema.graphql：
// type Query {
//   orders(userId: ID!): [Order!]!   ← 双重非空
// }`,
            {
              filename: "src/resolvers/orderResolvers.js",
              highlight: [3],
              codeEn: `async orders(_, { userId }, { dataSources, correlationId }) {
  const orders = await dataSources.orderDataSource.getOrdersByUserId(userId);
  return orders;                     // the data source may return undefined
}

// For reference, schema.graphql says:
// type Query {
//   orders(userId: ID!): [Order!]!   ← non-null twice
// }`,
            },
          ),
          classify: {
            options: [
              {
                id: "a",
                label: "非空违约 —— schema 声明了非空，resolver 返回了 null/undefined",
                labelEn:
                  "A non-null violation — the schema declares non-null and the resolver returned null/undefined",
              },
              { id: "b", label: "名字不匹配", labelEn: "A name mismatch" },
              { id: "c", label: "composition 失败", labelEn: "A composition failure" },
              {
                id: "d",
                label: "跨模块契约错误",
                labelEn: "A broken contract between modules",
              },
            ],
            answer: "a",
          },
          locate: {
            question: "该怎么改？",
            questionEn: "What should be changed?",
            options: [
              { id: "a", label: "return orders ?? [];" },
              {
                id: "b",
                label: "把 schema 改成 orders(userId: ID!): [Order!]",
                labelEn: "Change the schema to orders(userId: ID!): [Order!]",
              },
              { id: "c", label: "在外面套 try/catch", labelEn: "Wrap it in try/catch" },
              { id: "d", label: "return orders || null;" },
            ],
            answer: "a",
          },
          fixed: real(
            "js",
            `const orders = await dataSources.orderDataSource.getOrdersByUserId(userId);
return orders ?? [];        // 双重非空 -> 「没有」用空数组表达`,
            {
              filename: "改对之后",
              filenameEn: "After the fix",
              codeEn: `const orders = await dataSources.orderDataSource.getOrdersByUserId(userId);
return orders ?? [];        // non-null twice -> say "none" with an empty array`,
            },
          ),
          rootCause: (
            <>
              <p>
                <code>[Order!]!</code> 是双重非空：
                <strong>列表本身不能是 null，元素也不能是 null。</strong>
                但<strong>空数组是合法的</strong>——
                「这个用户没有订单」的正确表达就是 <code>[]</code>。
              </p>
              <p>
                <strong>为什么整个 data 会变成 null?</strong>
                非空字段返回 null 时，GraphQL 执行器会
                <strong>向上冒泡</strong>：把这个字段设为 null，
                如果父字段也非空，父字段也变 null，
                一直往上直到遇到可空的祖先，或者到根节点让
                <code>data</code> 整个变成 null。
                <strong>所以一个 resolver 忘了兜底，
                可能让客户端拿不到任何数据。</strong>
              </p>
              <p>
                <strong>选项 B（改 schema 成可空）</strong>
                是典型的「让报错消失」式修法：schema 是 PROVIDED、
                是客户端契约，改它等于把问题推给所有调用方
                （他们从此都得判断 null）。
                <strong>schema 说非空，就是在要求你保证非空。</strong>
              </p>
              <p>
                注意这个项目的数据源用 <code>filter</code> 实现，
                实际会返回 <code>[]</code> 而不是 undefined，
                所以这个 bug 在当前实现下<strong>不会真的触发</strong>。
                但你不该依赖数据源的实现细节 ——
                <strong>按 schema 的契约写。</strong>
              </p>
            </>
          ),
          rootCauseEn: (
            <>
              <p>
                <code>[Order!]!</code> is non-null twice:{" "}
                <strong>
                  the list itself cannot be null, and neither can an element.
                </strong>{" "}
                But <strong>an empty array is valid</strong> — the correct way to
                say &ldquo;this user has no orders&rdquo; is <code>[]</code>.
              </p>
              <p>
                <strong>Why does the whole data turn into null?</strong> When a
                non-null field returns null, the GraphQL executor{" "}
                <strong>bubbles the null upward</strong>: it sets this field to
                null, and if the parent field is also non-null the parent turns
                to null as well, all the way up until it reaches a nullable
                ancestor, or the root, where <code>data</code> becomes null.{" "}
                <strong>
                  So one resolver with no fallback can leave the client with no
                  data at all.
                </strong>
              </p>
              <p>
                <strong>Option B, making the schema nullable,</strong> is the
                classic fix that only makes the error message go away. The schema
                is PROVIDED and it is the contract with the client, so editing it
                pushes the problem onto every caller, who must all check for null
                from now on.{" "}
                <strong>
                  When the schema says non-null, it is asking you to guarantee
                  non-null.
                </strong>
              </p>
              <p>
                Note that the data source in this project is written with{" "}
                <code>filter</code>, so it actually returns <code>[]</code>{" "}
                rather than undefined, which means this bug{" "}
                <strong>does not really fire</strong> in the current
                implementation. But you should not depend on an implementation
                detail of the data source —{" "}
                <strong>write to the contract in the schema.</strong>
              </p>
            </>
          ),
          verify: "node verify-schema.mjs   # orders 应该是 []，errors 为空",
          verifyEn:
            "node verify-schema.mjs   # orders should be [], and errors should be empty",
        },
        {
          kind: "debug",
          id: "g-lab-loader-order",
          title: "故障 3 · A 拿到了 B 的数据",
          titleEn: "Fault 3 · A receives B's data",
          level: 3,
          prompt: (
            <p>
              查两个订单的物流，返回的数据<strong>对上了错的订单</strong>。
              没有任何报错。这是 DataLoader 最阴险的一类误用。
            </p>
          ),
          promptEn: (
            <p>
              You query the shipping info for two orders and the data comes back{" "}
              <strong>attached to the wrong order</strong>. Nothing reports an
              error. This is the hardest kind of DataLoader misuse to notice.
            </p>
          ),
          errorOutput: `# 没有任何报错。
# 查询：{ orders(userId:"123") { id shippingInfo { trackingNumber } } }
#
# 期望：
#   order-456 -> TRACK123456
#   order-457 -> TRACK123457
#
# 实际：
#   order-456 -> TRACK123457     ← 串了！
#   order-457 -> null

# 日志：[DataLoader] Batching 2 shipping info requests   ← 合并是生效的`,
          broken: demo(
            "js",
            `function createShippingInfoLoader(shippingDataSource) {
  return new DataLoader(async orderIds => {
    console.log(\`[DataLoader] Batching \${orderIds.length} shipping info requests\`);

    const all = await Promise.all(
      orderIds.map(id => shippingDataSource.getShippingInfo(id))
    );

    // 「过滤掉没有物流信息的」—— 看起来很合理
    return all.filter(info => info !== null);
  });
}`,
            {
              filename: "src/resolvers/orderResolvers.js",
              highlight: [10],
              codeEn: `function createShippingInfoLoader(shippingDataSource) {
  return new DataLoader(async orderIds => {
    console.log(\`[DataLoader] Batching \${orderIds.length} shipping info requests\`);

    const all = await Promise.all(
      orderIds.map(id => shippingDataSource.getShippingInfo(id))
    );

    // "drop the ones with no shipping info" — this looks reasonable
    return all.filter(info => info !== null);
  });
}`,
            },
          ),
          classify: {
            options: [
              { id: "a", label: "名字不匹配", labelEn: "A name mismatch" },
              {
                id: "b",
                label: "DataLoader 契约违约 —— batch 函数返回的数组长度/顺序必须与 keys 一一对应",
                labelEn:
                  "A broken DataLoader contract — the array the batch function returns must match keys in both length and order",
              },
              { id: "c", label: "非空违约", labelEn: "A non-null violation" },
              {
                id: "d",
                label: "异步错误 —— 少了 await",
                labelEn: "An async mistake — a missing await",
              },
            ],
            answer: "b",
          },
          locate: {
            question: "第 10 行错在哪？",
            questionEn: "What is wrong on line 10?",
            options: [
              {
                id: "a",
                label: "不能 filter —— 会改变长度，导致结果按下标错位分发",
                labelEn:
                  "filter is not allowed here — it changes the length, so results are handed out to the wrong index",
              },
              { id: "b", label: "应该改成 all.filter(info => info)", labelEn: "It should be all.filter(info => info)" },
              { id: "c", label: "应该改成 all.sort()", labelEn: "It should be all.sort()" },
              {
                id: "d",
                label: "应该在 filter 后面加 .reverse()",
                labelEn: "It should have .reverse() after filter",
              },
            ],
            answer: "a",
          },
          fixed: real(
            "js",
            `const shippingInfos = await Promise.all(
  orderIds.map(id => shippingDataSource.getShippingInfo(id))
);

// 长度与顺序必须和 orderIds 一一对应，「没有」用 null 占位
return shippingInfos;`,
            {
              filename: "改对之后（这也是项目里原本正确的写法）",
              filenameEn: "After the fix (this is also what the project had originally)",
              codeEn: `const shippingInfos = await Promise.all(
  orderIds.map(id => shippingDataSource.getShippingInfo(id))
);

// Length and order must match orderIds one to one; use null to hold "none"
return shippingInfos;`,
            },
          ),
          rootCause: (
            <>
              <p>
                <strong>DataLoader 靠下标分发结果</strong>：
                <code>results[0]</code> 给 <code>keys[0]</code>，
                <code>results[1]</code> 给 <code>keys[1]</code>。
              </p>
              <p>
                <code>filter</code> 把 <code>[info456, null]</code> 变成
                <code>[info456]</code>（假设 457 没物流）——
                或者在本例中把
                <code>[null, info457]</code> 变成 <code>[info457]</code>，
                于是 <code>info457</code> 被分发给了
                <code>orderIds[0]</code>（也就是 order-456），
                而 order-457 因为数组越界拿到 <code>undefined</code>。
              </p>
              <p>
                <strong>为什么这是最阴险的一类？</strong>
                因为它<strong>不报错，只是数据错了</strong>。
                而且「过滤掉空值」看起来是个再合理不过的操作 ——
                在别的地方它确实合理，只有在 batch 函数里是致命的。
              </p>
              <p>
                <strong>batch 函数的两条硬约束，背下来：</strong>
                <br />
                ① 返回数组长度 === keys 长度；
                <br />
                ② 第 i 个结果对应第 i 个 key。
                <br />
                「没有」用 <code>null</code> 占位，
                「出错」用 <code>Error</code> 对象占位，
                <strong>永远不要跳过</strong>。
              </p>
              <p>
                真实系统里调批量接口（<code>WHERE id IN (...)</code>）时，
                数据库返回的顺序不保证、缺失的行也不返回，
                所以必须用 Map 重排：
                <code>ids.map(id =&gt; byId.get(id) ?? null)</code>。
              </p>
            </>
          ),
          rootCauseEn: (
            <>
              <p>
                <strong>DataLoader hands out results by index</strong>:{" "}
                <code>results[0]</code> goes to <code>keys[0]</code>, and{" "}
                <code>results[1]</code> goes to <code>keys[1]</code>.
              </p>
              <p>
                <code>filter</code> turns <code>[info456, null]</code> into{" "}
                <code>[info456]</code> if 457 has no shipping info — or, in this
                example, turns <code>[null, info457]</code> into{" "}
                <code>[info457]</code>, so <code>info457</code> is handed to{" "}
                <code>orderIds[0]</code>, which is order-456, while order-457
                reads past the end of the array and gets{" "}
                <code>undefined</code>.
              </p>
              <p>
                <strong>Why is this the hardest kind to notice?</strong> Because{" "}
                <strong>nothing reports an error; only the data is wrong.</strong>{" "}
                And &ldquo;drop the empty values&rdquo; looks like a perfectly
                reasonable thing to do. Elsewhere it is reasonable. Inside a batch
                function it is fatal.
              </p>
              <p>
                <strong>
                  Two hard rules for a batch function; memorize them:
                </strong>
                <br />① the length of the returned array === the length of keys;
                <br />② result number i belongs to key number i.
                <br />
                Use <code>null</code> to hold the place of &ldquo;none&rdquo;, and
                an <code>Error</code> object to hold the place of &ldquo;this one
                failed&rdquo;. <strong>Never skip an entry.</strong>
              </p>
              <p>
                In a real system, when you call a bulk endpoint (
                <code>WHERE id IN (...)</code>), the database does not promise an
                order and does not return the missing rows at all, so you have to
                reorder with a Map:{" "}
                <code>ids.map(id =&gt; byId.get(id) ?? null)</code>.
              </p>
            </>
          ),
          verify:
            "node verify-schema.mjs   # order-456 应该对上 TRACK123456，457 对上 TRACK123457",
          verifyEn:
            "node verify-schema.mjs   # order-456 should match TRACK123456, and 457 should match TRACK123457",
        },
        {
          kind: "debug",
          id: "g-lab-java-500",
          title: "故障 4 · PATCH 传了小写状态，返回 500",
          titleEn: "Fault 4 · PATCH sends a lowercase status and gets a 500",
          level: 2,
          prompt: (
            <p>
              Java 那边。<code>mvn test</code> 全过，
              但客户端传小写的 <code>shipped</code> 时服务返回 500。
            </p>
          ),
          promptEn: (
            <p>
              This one is on the Java side. <code>mvn test</code> passes
              everything, but the service returns 500 when the client sends the
              lowercase <code>shipped</code>.
            </p>
          ),
          errorOutput: `$ curl -i -X PATCH localhost:8080/api/orders/1/status \\
    -H 'Content-Type: application/json' -d '{"status":"shipped"}'

HTTP/1.1 500
{"timestamp":"...","status":500,"error":"Internal Server Error"}

# 服务端日志：
java.lang.IllegalArgumentException: No enum constant
  com.techflow.orders.model.OrderStatus.shipped
    at java.base/java.lang.Enum.valueOf(Enum.java:293)
    at com.techflow.orders.model.OrderStatus.valueOf(OrderStatus.java:3)
    at c.t.orders.controller.OrderController.updateOrderStatus(OrderController.java:71)

# mvn test：Tests run: 5, Failures: 0   ← 测试全过`,
          broken: demo(
            "java",
            `@PatchMapping("/api/orders/{id}/status")
public ResponseEntity<Order> updateOrderStatus(
        @PathVariable Long id,
        @RequestBody Map<String, String> statusUpdate) {
    OrderStatus status = OrderStatus.valueOf(statusUpdate.get("status"));
    return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
}`,
            { filename: "OrderController.java", highlight: [5] },
          ),
          classify: {
            options: [
              {
                id: "a",
                label: "状态码语义错误 —— 客户端输入问题被报成了服务器错误",
                labelEn:
                  "Wrong status code meaning — a client input problem is reported as a server error",
              },
              { id: "b", label: "依赖注入错误", labelEn: "A dependency injection mistake" },
              { id: "c", label: "路由错误", labelEn: "A routing mistake" },
              {
                id: "d",
                label: "全局异常处理器配置错误",
                labelEn: "A misconfigured global exception handler",
              },
            ],
            answer: "a",
          },
          locate: {
            question: "第 5 行需要补什么？",
            questionEn: "What needs to be added on line 5?",
            options: [
              {
                id: "a",
                label: "toUpperCase() + try/catch 转成 400，另外还要挡 null",
                labelEn:
                  "toUpperCase() plus try/catch to turn it into a 400, and also guard against null",
              },
              { id: "b", label: "把 Map 换成 String", labelEn: "Replace Map with String" },
              {
                id: "c",
                label: "给 GlobalExceptionHandler 加一个 @ExceptionHandler(Exception.class)",
                labelEn:
                  "Add an @ExceptionHandler(Exception.class) to GlobalExceptionHandler",
              },
              {
                id: "d",
                label: "把 @RequestBody 改成 @RequestParam",
                labelEn: "Change @RequestBody to @RequestParam",
              },
            ],
            answer: "a",
          },
          fixed: real(
            "java",
            `String raw = statusUpdate.get("status");
if (raw == null || raw.isBlank()) {
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is required");
}

final OrderStatus status;
try {
    status = OrderStatus.valueOf(raw.trim().toUpperCase());
} catch (IllegalArgumentException ex) {
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown status: " + raw);
}

return ResponseEntity.ok(orderService.updateOrderStatus(id, status));`,
            { filename: "改对之后", filenameEn: "After the fix" },
          ),
          rootCause: (
            <>
              <p>
                <code>Enum.valueOf</code> <strong>大小写敏感</strong>，
                找不到常量时抛 <code>IllegalArgumentException</code>。
                <code>GlobalExceptionHandler</code> 只处理
                <code>EntityNotFoundException</code> 和
                <code>MethodArgumentNotValidException</code>，
                所以这个异常一路冒到 Spring 默认处理器 → <strong>500</strong>。
              </p>
              <p>
                <strong>为什么这是个真问题？</strong>
                500 的语义是「服务器内部出错了，不是你的问题，请重试」。
                客户端会重试 —— 而重试永远不会成功。
                <strong>正确的信号是 400：「你的输入不对，改了再来」。</strong>
              </p>
              <p>
                <strong>选项 C 为什么不好？</strong>
                加一个 <code>@ExceptionHandler(Exception.class)</code>{" "}
                catch-all 会把<strong>所有</strong>未预期的异常
                都变成同一个状态码，掩盖真正的服务器故障。
                <strong>要在最靠近问题的地方处理，
                而不是在最外层兜底。</strong>
              </p>
              <p>
                另外注意 <code>null</code> 也要挡 ——
                body 是 <code>{"{}"}</code> 时 <code>get</code> 返回 null，
                <code>valueOf(null)</code> 抛 NPE，同样是 500。
              </p>
              <p>
                <strong>测试为什么抓不到？</strong>
                测试只发了合法的大写 <code>SHIPPED</code>。
                <strong>又一个只有手动 curl 才能发现的问题。</strong>
              </p>
            </>
          ),
          rootCauseEn: (
            <>
              <p>
                <code>Enum.valueOf</code> is{" "}
                <strong>case sensitive</strong>, and it throws{" "}
                <code>IllegalArgumentException</code> when it cannot find the
                constant. <code>GlobalExceptionHandler</code> only handles{" "}
                <code>EntityNotFoundException</code> and{" "}
                <code>MethodArgumentNotValidException</code>, so this exception
                travels all the way up to the default Spring handler, which
                answers <strong>500</strong>.
              </p>
              <p>
                <strong>Why does this matter?</strong> A 500 means &ldquo;the
                server failed internally, it is not your fault, please try
                again&rdquo;. The client will retry, and the retry will never
                succeed.{" "}
                <strong>
                  The correct signal is 400: &ldquo;your input is wrong, fix it
                  and come back&rdquo;.
                </strong>
              </p>
              <p>
                <strong>Why is option C a bad idea?</strong> Adding a catch-all{" "}
                <code>@ExceptionHandler(Exception.class)</code> turns{" "}
                <strong>every</strong> unexpected exception into the same status
                code, which hides real server failures.{" "}
                <strong>
                  Handle the problem at the point closest to it, not in an outer
                  layer that catches everything.
                </strong>
              </p>
              <p>
                Also note that <code>null</code> needs a guard: when the body is{" "}
                <code>{"{}"}</code>, <code>get</code> returns null,{" "}
                <code>valueOf(null)</code> throws an NPE, and that is a 500 as
                well.
              </p>
              <p>
                <strong>Why do the tests miss this?</strong> The tests only send
                the valid uppercase <code>SHIPPED</code>.{" "}
                <strong>
                  One more problem that only a manual curl can find.
                </strong>
              </p>
            </>
          ),
          verify:
            "curl -i -X PATCH localhost:8080/api/orders/1/status -H 'Content-Type: application/json' -d '{\"status\":\"shipped\"}'   # 应该 200（大小写宽容）；传 FLYING 应该 400",
          verifyEn:
            "curl -i -X PATCH localhost:8080/api/orders/1/status -H 'Content-Type: application/json' -d '{\"status\":\"shipped\"}'   # should be 200 (case is accepted either way); sending FLYING should be 400",
        },
      ],
      transfer: [
        {
          signal: "字段静默返回 null",
          signalEn: "A field returns null and nothing is reported",
          reachFor: "在 resolver 第一行 log，确认它有没有被调用",
          reachForEn: "Log on the first line of the resolver to see whether it runs at all",
        },
        {
          signal: "Cannot return null for non-nullable field",
          signalEn: "Cannot return null for non-nullable field",
          reachFor: "?? [] 兜底，别改 schema",
          reachForEn: "Add a ?? [] fallback; do not change the schema",
        },
        {
          signal: "数据串了但不报错",
          signalEn: "Values land on the wrong records, with no error",
          reachFor: "查 DataLoader batch 函数有没有 filter 或改顺序",
          reachForEn: "Check whether the DataLoader batch function filters or reorders the results",
        },
        {
          signal: "xxx is not a function",
          signalEn: "xxx is not a function",
          reachFor: "核对方法名与 context 键名",
          reachForEn: "Compare the method name and the context key name",
        },
        {
          signal: "Unknown directive",
          signalEn: "Unknown directive",
          reachFor: "@link 的 import 列表里漏了它",
          reachForEn: "It is missing from the import list of @link",
        },
        {
          signal: "客户端输入问题返回 500",
          signalEn: "Bad client input returns 500",
          reachFor: "在最靠近的地方转成 400，别加 catch-all",
          reachForEn: "Turn it into a 400 at the closest point to the cause; do not add a catch-all handler",
        },
      ],
      recap: [
        "GraphQL 故障六类：schema 校验 / 非空违约 / 跨模块契约 / 名字不匹配 / 错误语义 / composition。",
        "「名字不匹配」是 GraphQL 特有的静默故障 —— resolver 键名错了就等于不存在。",
        "排查静默 null 的第一步：在 resolver 第一行 log，看它有没有被调用。",
        "DataLoader 的 batch 函数永远不要 filter —— 长度和顺序都是硬契约。",
        "「服务能起来 + _service 查得出 SDL」已经排除了大部分 composition 问题。",
      ],
      recapEn: [
        "Six categories of GraphQL failure: schema validation, non-null violation, cross-module contract, name mismatch, error semantics, composition.",
        "A name mismatch is the silent failure that is specific to GraphQL: a wrong resolver key means the resolver does not exist at all.",
        "First step for a silent null: log on the first line of the resolver and check whether it is called.",
        "Never filter inside a DataLoader batch function. Both the length and the order are a strict contract.",
        "If the service starts and _service returns the SDL, most composition problems are already ruled out.",
      ],
    },

    /* ---------- 6.2 ---------- */
    {
      id: "g-rebuild",
      title: "从零重写：空目录到 10 个测试全过",
      titleEn: "Rewrite it: from an empty directory to all 10 tests passing",
      blurb: "不给答案。给 schema、给数据源、给测试、给四级提示。这一关是分界线。",
      blurbEn:
        "No answer key. You get the schema, the data source, the tests, and four levels of hints. This stage is the dividing line.",
      minutes: 90,
      objectives: [
        "在没有参考代码的情况下从空目录搭出一个 federation subgraph",
        "独立实现四个 resolver 并自己发现三处埋雷",
        "独立实现六个 Spring 端点并选对状态码",
        "用测试 + verify 脚本 + curl 三种方式验证自己的实现",
      ],
      objectivesEn: [
        "Build a federation subgraph from an empty directory, with no reference code",
        "Write the four resolvers on your own and find the three hidden problems yourself",
        "Write the six Spring endpoints on your own and pick the right status code for each",
        "Check your own work in three ways: the tests, the verify script, and curl",
      ],
      whyForAssessment:
        "填空和跟写只证明你看懂了。真正的考试是打开一个空编辑器。这一关比真实考试更难 —— 连脚手架都要你自己搭。",
      whyForAssessmentEn:
        "Filling in blanks and typing along only prove that you followed the text. The real exam starts with an empty editor. This stage is harder than the real exam, because even the project setup is yours to write.",
      sourceFiles: [
        {
          path: "graphql-federation-practice/",
          role: "参考项目 —— 做完之后再对照，不要提前看",
        },
      ],
      concepts: [
        {
          id: "why",
          heading: "为什么必须做这一关",
          headingEn: "Why this stage is required",
          body: (
            <>
              <p>
                前面每一节的 L3 练习里，你已经分别写过四个 resolver
                和六个端点。这一关是把它们
                <strong>放回一个完整项目里</strong>——
                加上你自己搭的 schema 加载、context 构造、依赖配置。
              </p>
              <p>
                <strong>而且这一关会强迫你面对一件事：
                没有人告诉你埋雷在哪。</strong>
                你要自己写 loader、自己写 mutation ——
                如果你在这里犯了和 starter 一样的错
                （方法名、签名、catch 吞错误），
                那说明前面那几节只是「看懂了」。
              </p>
              <p>
                <strong>不要跳过这一关直接看答案。</strong>
                撞墙的地方才是你真正的薄弱点。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                In the L3 exercises of the earlier lessons you have already
                written all four resolvers and all six endpoints, separately.
                This stage puts them{" "}
                <strong>back inside one complete project</strong> — along with
                schema loading, context construction and dependency setup that
                you build yourself.
              </p>
              <p>
                <strong>
                  And this stage forces you to face one thing: nobody tells you
                  where the traps are.
                </strong>{" "}
                You write the loader yourself, you write the mutation yourself.
                If you make the same mistakes the starter made (method name,
                signature, catch swallowing the error), then those earlier
                lessons only got you as far as &ldquo;I followed along&rdquo;.
              </p>
              <p>
                <strong>Do not skip this and go straight to the answer.</strong>{" "}
                The wall you hit is where your real weak spot is.
              </p>
            </>
          ),
        },
        {
          id: "how",
          heading: "建议的做法",
          headingEn: "A suggested order of work",
          body: (
            <>
              <ol>
                <li>
                  <strong>新建目录，不要在源项目里改。</strong>
                  比如 <code>~/Downloads/my-order-subgraph</code>。
                  源项目留着最后对照。
                </li>
                <li>
                  <strong>先让空服务器能起来。</strong>
                  <code>npm init</code> → 装依赖 → 写一个最小 schema
                  （只有 <code>type Query {"{ ping: String }"}</code>）→
                  <code>npm start</code> 能看到
                  <code>Subgraph ready at ...</code> 再往下走。
                  <strong>这是所有项目的正确起手式。</strong>
                </li>
                <li>
                  <strong>把 schema、数据源、测试抄进去。</strong>
                  这三样是「题目」，不是「答案」。
                  抄它们等于把考场搭起来。
                </li>
                <li>
                  <strong>一个测试一个测试地攻。</strong>
                  先让 <code>User.orders</code> 的两条过，
                  再 <code>shippingInfo</code>，依次推进。
                </li>
                <li>
                  <strong>10 个测试全绿之后，写 verify 脚本。</strong>
                  测试只覆盖单元层面；<code>_service</code> 和
                  <code>_entities</code> 要自己验。
                </li>
                <li>
                  <strong>Java 那半独立做。</strong>
                  它和 subgraph 没有代码关联，可以完全分开。
                </li>
                <li>
                  <strong>卡住超过 20 分钟再看提示。</strong>
                  提示是四级递进的。
                </li>
              </ol>
            </>
          ),
          bodyEn: (
            <>
              <ol>
                <li>
                  <strong>
                    New directory. Do not edit inside the source project.
                  </strong>{" "}
                  Something like <code>~/Downloads/my-order-subgraph</code>. Keep
                  the source project for comparing at the end.
                </li>
                <li>
                  <strong>Get an empty server running first.</strong>{" "}
                  <code>npm init</code> → install dependencies → write a minimal
                  schema (just <code>type Query {"{ ping: String }"}</code>) →
                  run <code>npm start</code> and see{" "}
                  <code>Subgraph ready at ...</code> before you go any further.{" "}
                  <strong>That is the right opening move on any project.</strong>
                </li>
                <li>
                  <strong>
                    Copy in the schema, the data sources and the tests.
                  </strong>{" "}
                  Those three are the question, not the answer. Copying them is
                  how you set up the exam room.
                </li>
                <li>
                  <strong>Attack one test at a time.</strong> Get the two{" "}
                  <code>User.orders</code> tests green, then{" "}
                  <code>shippingInfo</code>, and keep going in order.
                </li>
                <li>
                  <strong>
                    Once all 10 tests are green, write the verify script.
                  </strong>{" "}
                  The tests only cover the unit level; <code>_service</code> and{" "}
                  <code>_entities</code> you have to check yourself.
                </li>
                <li>
                  <strong>Do the Java half on its own.</strong> It shares no code
                  with the subgraph, so you can keep them fully separate.
                </li>
                <li>
                  <strong>
                    Stuck for more than 20 minutes? Then look at a hint.
                  </strong>{" "}
                  The hints come in four escalating levels.
                </li>
              </ol>
            </>
          ),
        },
      ],
      exercises: [
        {
          kind: "from-scratch",
          id: "g-rebuild-subgraph",
          title: "从零重建 Task 1 · Orders subgraph",
          titleEn: "Rebuild Task 1 · the Orders subgraph",
          level: 4,
          prompt: (
            <p>
              空目录开始，搭出一个 Apollo Federation subgraph，
              实现四个 resolver 加一个 mutation，让 10 个测试全过，
              并且 <code>_service</code> 和 <code>_entities</code> 都能正常工作。
              <strong>不要打开源项目的 orderResolvers.js。</strong>
            </p>
          ),
          promptEn: (
            <p>
              Starting from an empty directory, build an Apollo Federation
              subgraph. Write four resolvers plus one mutation, get all 10 tests
              passing, and make both <code>_service</code> and{" "}
              <code>_entities</code> work.{" "}
              <strong>
                Do not open orderResolvers.js from the source project.
              </strong>
            </p>
          ),
          requirements: [
            "用 @apollo/server + @apollo/subgraph 起一个 subgraph，监听 4000",
            "schema 从 .graphql 文件读入，用 buildSubgraphSchema 组装",
            "每个请求构造 context：三个数据源、两个 DataLoader、一个 correlationId",
            "correlationId 优先取请求头 x-correlation-id，没有就生成",
            "实现 User.__resolveReference：把 representation 变成本地对象",
            "实现 User.orders：按 user.id 取订单，[Order!]! 所以绝不返回 null",
            "实现 Order.shippingInfo：必须走 DataLoader 防 N+1；可空，找不到返回 null",
            "实现 Query.order：走 DataLoader；找不到抛带 ORDER_NOT_FOUND 的 GraphQLError",
            "实现 Query.orders：校验 userId；[Order!]! 所以兜底 []",
            "实现 Mutation.createOrder：先查商品价格补全 items，再创建；校验失败抛 INVALID_INPUT",
            "两个 DataLoader 的 batch 函数：返回数组的长度与顺序必须和 keys 一一对应",
            "所有 resolver 都用 try/catch，catch 第一行放行已有的 GraphQLError",
            "所有日志和错误 extensions 里带上 correlationId",
          ],
          requirementsEn: [
            "Start a subgraph with @apollo/server + @apollo/subgraph, listening on 4000",
            "Read the schema from a .graphql file and assemble it with buildSubgraphSchema",
            "Build the context per request: three data sources, two DataLoaders, one correlationId",
            "Take correlationId from the x-correlation-id request header, and generate one when it is absent",
            "Write User.__resolveReference: turn the representation into a local object",
            "Write User.orders: read orders by user.id; the type is [Order!]!, so never return null",
            "Write Order.shippingInfo: it must go through the DataLoader to prevent N+1; it is nullable, so return null when nothing is found",
            "Write Query.order: go through the DataLoader; when nothing is found, throw a GraphQLError carrying ORDER_NOT_FOUND",
            "Write Query.orders: validate userId; the type is [Order!]!, so fall back to []",
            "Write Mutation.createOrder: look up product prices to complete items first, then create; throw INVALID_INPUT when validation fails",
            "The batch function of both DataLoaders: the array it returns must match keys in both length and order",
            "Wrap every resolver in try/catch, and let an existing GraphQLError pass through on the first line of catch",
            "Carry correlationId in every log line and in the extensions of every error",
          ],
          fileList: [
            {
              path: "package.json",
              role: '自己写：type: module、start / test script（test 要带 NODE_OPTIONS=--experimental-vm-modules）、依赖 @apollo/server @apollo/subgraph graphql graphql-tag dataloader，devDep jest @jest/globals，以及内嵌 jest 配置',
              roleEn:
                'You write it: type: module, the start / test scripts (test needs NODE_OPTIONS=--experimental-vm-modules), the dependencies @apollo/server @apollo/subgraph graphql graphql-tag dataloader, the devDependencies jest @jest/globals, and an inline jest config',
            },
            {
              path: "src/schema.graphql",
              role: "★ 抄源项目的（这是题目）：User entity + Order/OrderItem/ShippingInfo + enum + Query/Mutation + input",
              roleEn:
                "★ Copy it from the source project (this is the question): the User entity + Order/OrderItem/ShippingInfo + enum + Query/Mutation + input",
            },
            {
              path: "src/dataSources/orderDataSource.js",
              role: "★ 抄源项目的（这是题目）：三个 mock 数据源类。注意 OrderDataSource 只有 getOrder / getOrdersByUserId / createOrder",
              roleEn:
                "★ Copy it from the source project (this is the question): three mock data source classes. Note that OrderDataSource has only getOrder / getOrdersByUserId / createOrder",
            },
            {
              path: "src/index.js",
              role: "★ 自己写：读 schema、buildSubgraphSchema、ApolloServer + formatError、startStandaloneServer、每请求造 context",
              roleEn:
                "★ You write it: read the schema, buildSubgraphSchema, ApolloServer + formatError, startStandaloneServer, and build the context per request",
            },
            {
              path: "src/resolvers/orderResolvers.js",
              role: "★★ 自己写：两个 loader 工厂 + resolvers（User / Order / Query / Mutation）+ ErrorCodes",
              roleEn:
                "★★ You write it: two loader factories + the resolvers (User / Order / Query / Mutation) + ErrorCodes",
            },
            {
              path: "__tests__/resolvers.test.js",
              role: "★ 抄源项目的（这是判卷器）：10 个测试，beforeEach 里重建 dataSources 与 loaders",
              roleEn:
                "★ Copy it from the source project (this is what grades you): 10 tests, with dataSources and loaders rebuilt in beforeEach",
            },
            {
              path: "verify-schema.mjs",
              role: "★ 自己写：进程内查 _service、普通查询、_entities、mutation",
              roleEn:
                "★ You write it: query _service in process, then a normal query, then _entities, then the mutation",
            },
          ],
          commands: [
            {
              cmd: "npm install",
              expect: "依赖装好，出现 node_modules 与 package-lock.json",
              expectEn:
                "The dependencies install, and node_modules and package-lock.json appear",
            },
            {
              cmd: "npm start",
              expect: "打印 Subgraph ready at http://0.0.0.0:4000/",
              expectEn: "It prints Subgraph ready at http://0.0.0.0:4000/",
            },
            {
              cmd: "npm test",
              expect: "Tests: 10 passed, 10 total",
            },
            {
              cmd: "node verify-schema.mjs",
              expect:
                "SDL 出得来且含 @key；orders + shippingInfo 有值；order-999 返回 ORDER_NOT_FOUND；_entities 能拿到 orders；createOrder 的 items[0].price 有值且 totalAmount > 0；空 items 返回 INVALID_INPUT",
              expectEn:
                "The SDL comes out and contains @key; orders + shippingInfo have values; order-999 returns ORDER_NOT_FOUND; _entities can read orders; items[0].price from createOrder has a value and totalAmount > 0; empty items returns INVALID_INPUT",
            },
          ],
          hints: [
            "先别想 resolver。先问三个问题：schema 是怎么进到服务器里的？context 里那些东西是谁在什么时候创建的？为什么 DataLoader 必须每个请求新建一次？把这三个想清楚，index.js 就写出来了。",
            "resolver 需要四组：User（__resolveReference + orders）、Order（shippingInfo）、Query（order + orders）、Mutation（createOrder）。写之前先做两件事：① 抄一张数据源方法名表 ② 把 schema 里每个字段的可空性标出来。这两张表能挡掉大部分错误。另外注意 OrderItemInput 里没有 price，但数据源要用它算总价。",
            `index.js:
  读 schema.graphql -> gql() -> buildSubgraphSchema([{ typeDefs, resolvers }])
  new ApolloServer({ schema, formatError })
  startStandaloneServer(server, { listen, context: async ({ req }) => {
    correlationId = req.headers['x-correlation-id'] || 生成一个
    new 三个数据源；用它们 new 两个 loader
    return { dataSources: {...}, loaders: {...}, correlationId }
  }})

orderResolvers.js:
  createXxxLoader(ds) = new DataLoader(async keys => {
    return await Promise.all(keys.map(k => ds.某方法(k)))   // 长度顺序必须对齐
  })

  User.__resolveReference(user) -> { id: user.id }
  User.orders(user, _, ctx)     -> ds.orderDataSource.getOrdersByUserId(user.id) ?? []
  Order.shippingInfo(parent,…)  -> loaders.shippingInfoLoader.load(parent.id) ?? null
  Query.order(_, {id}, ctx)     -> loaders.orderLoader.load(id)；没有则抛 ORDER_NOT_FOUND
  Query.orders(_, {userId}, ctx)-> 校验 userId；ds 取；？？ []
  Mutation.createOrder          -> 校验；用 getProductPrice 补 price；ds.createOrder(userId, pricedItems)

  每个 resolver 外面：try { … } catch (e) {
    if (e instanceof GraphQLError) throw e;
    throw new GraphQLError(msg, { extensions: { code, correlationId, originalError } });
  }`,
            `// 两处最容易错的地方，直接给你：

// ① loader 里的方法名（数据源上没有 getOrderById）
orderIds.map(id => orderDataSource.getOrder(id))

// ② mutation 里必须先补 price，且键名是 orderDataSource、签名是两个位置参数
const pricedItems = await Promise.all(
  items.map(async item => ({
    productId: item.productId,
    quantity: item.quantity,
    price: await dataSources.inventoryDataSource.getProductPrice(item.productId)
  }))
);
const order = await dataSources.orderDataSource.createOrder(userId, pricedItems);

// ③ 每个 catch 的第一行
if (error instanceof GraphQLError) throw error;`,
          ],
          hintsEn: [
            "Do not think about resolvers yet. Ask three questions first: how does the schema get into the server? Who creates the things in context, and when? Why must a DataLoader be created fresh for every request? Once those three are clear, index.js writes itself.",
            "You need four groups of resolvers: User (__resolveReference + orders), Order (shippingInfo), Query (order + orders), and Mutation (createOrder). Before writing them, do two things: ① copy out a table of the data source method names; ② mark down whether each schema field is nullable. Those two tables stop most of the mistakes. Also note that OrderItemInput has no price, but the data source needs it to compute the total.",
            `index.js:
  read schema.graphql -> gql() -> buildSubgraphSchema([{ typeDefs, resolvers }])
  new ApolloServer({ schema, formatError })
  startStandaloneServer(server, { listen, context: async ({ req }) => {
    correlationId = req.headers['x-correlation-id'] || generate one
    new the three data sources; use them to new the two loaders
    return { dataSources: {...}, loaders: {...}, correlationId }
  }})

orderResolvers.js:
  createXxxLoader(ds) = new DataLoader(async keys => {
    return await Promise.all(keys.map(k => ds.someMethod(k)))   // length and order must line up
  })

  User.__resolveReference(user) -> { id: user.id }
  User.orders(user, _, ctx)     -> ds.orderDataSource.getOrdersByUserId(user.id) ?? []
  Order.shippingInfo(parent,…)  -> loaders.shippingInfoLoader.load(parent.id) ?? null
  Query.order(_, {id}, ctx)     -> loaders.orderLoader.load(id); if absent, throw ORDER_NOT_FOUND
  Query.orders(_, {userId}, ctx)-> validate userId; read from ds; ?? []
  Mutation.createOrder          -> validate; fill in price with getProductPrice; ds.createOrder(userId, pricedItems)

  around every resolver: try { … } catch (e) {
    if (e instanceof GraphQLError) throw e;
    throw new GraphQLError(msg, { extensions: { code, correlationId, originalError } });
  }`,
            `// The two places that go wrong most often, given to you directly:

// ① the method name inside the loader (there is no getOrderById on the data source)
orderIds.map(id => orderDataSource.getOrder(id))

// ② the mutation must fill in price first, the key is orderDataSource, and the signature takes two positional arguments
const pricedItems = await Promise.all(
  items.map(async item => ({
    productId: item.productId,
    quantity: item.quantity,
    price: await dataSources.inventoryDataSource.getProductPrice(item.productId)
  }))
);
const order = await dataSources.orderDataSource.createOrder(userId, pricedItems);

// ③ the first line of every catch
if (error instanceof GraphQLError) throw error;`,
          ],
          solution: [
            real("js", FULL_RESOLVERS, {
              filename: "src/resolvers/orderResolvers.js（完整参考答案，实测 10/10 通过）",
              filenameEn:
                "src/resolvers/orderResolvers.js (the full reference answer, measured 10/10 passing)",
              codeEn: FULL_RESOLVERS_EN,
              collapsible: true,
            }),
            real(
              "json",
              `{
  "name": "my-order-subgraph",
  "version": "1.0.0",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "test": "NODE_OPTIONS=--experimental-vm-modules jest"
  },
  "dependencies": {
    "@apollo/server": "^4.10.0",
    "@apollo/subgraph": "^2.7.0",
    "graphql": "^16.8.1",
    "graphql-tag": "^2.12.6",
    "dataloader": "^2.2.2"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "@jest/globals": "^29.7.0"
  },
  "jest": {
    "testEnvironment": "node",
    "transform": {},
    "testMatch": ["**/__tests__/**/*.test.js"]
  }
}`,
              {
                filename: "package.json（与源项目一致）",
                filenameEn: "package.json (identical to the source project)",
                sourceFile:
                  "graphql-federation-practice/node-subgraph/package.json",
                collapsible: true,
              },
            ),
            real("js", VERIFY_SCRIPT, {
              filename: "verify-schema.mjs（自己写的验证脚本）",
              filenameEn: "verify-schema.mjs (the check script you write yourself)",
              codeEn: VERIFY_SCRIPT_EN,
              collapsible: true,
            }),
          ],
        },
        {
          kind: "from-scratch",
          id: "g-rebuild-controller",
          title: "从零重建 Task 2 · Spring Boot 控制器",
          level: 4,
          prompt: (
            <p>
              给你 <code>OrderService</code> 的方法签名和五个测试。
              自己搭一个 Spring Boot 项目，写出六个端点。
              <strong>不要打开源项目的 OrderController.java。</strong>
            </p>
          ),
          requirements: [
            "Spring Boot 3.3 + Java 17，依赖 web / validation / actuator / test",
            "一个 @RestController，构造器注入 OrderService",
            "GET /api/orders：？userId= 传了就按用户过滤，没传返回全部；200",
            "GET /api/orders/{id}：200；找不到时由全局异常处理器给出 404（控制器不要 catch）",
            "GET /api/orders/user/{userId}：200",
            "POST /api/orders：@Valid 校验请求体；成功返回 201 Created",
            "PATCH /api/orders/{id}/status：body 是 {\"status\":\"...\"}；转成 OrderStatus；缺失或非法值返回 400；成功 200",
            "DELETE /api/orders/{id}：204 No Content",
            "六个端点都用 SLF4J 打日志，并带上 MDC 里的 correlationId",
            "自己写一个 CorrelationIdFilter：读 X-Correlation-ID 头，没有就生成 UUID，放进 MDC，finally 里清理",
            "自己写 GlobalExceptionHandler：EntityNotFoundException → 404，MethodArgumentNotValidException → 400",
          ],
          fileList: [
            {
              path: "pom.xml",
              role: "parent 用 spring-boot-starter-parent 3.3.2，java.version 17，四个依赖 + spring-boot-maven-plugin",
            },
            { path: "src/main/resources/application.properties", role: "server.port=8080 就够（顺便按书面题的结论收紧 actuator）" },
            { path: "src/main/java/.../OrderServiceApplication.java", role: "@SpringBootApplication + main" },
            { path: "src/main/java/.../model/Order.java、OrderItem.java、OrderStatus.java", role: "★ 抄源项目的（这是题目）" },
            { path: "src/main/java/.../dto/CreateOrderRequest.java、OrderItemRequest.java", role: "★ 抄源项目的：带 @NotBlank / @NotEmpty / @Min / @Valid" },
            { path: "src/main/java/.../repository/OrderRepository.java、InMemoryOrderRepository.java", role: "★ 抄源项目的：接口 + 内存实现（含一条种子数据）" },
            { path: "src/main/java/.../service/OrderService.java", role: "★ 抄源项目的（这是题目）：六个方法，三个会抛 EntityNotFoundException" },
            { path: "src/main/java/.../exception/EntityNotFoundException.java、GlobalExceptionHandler.java", role: "★ 自己写：两个 @ExceptionHandler" },
            { path: "src/main/java/.../config/CorrelationIdFilter.java", role: "★ 自己写：OncePerRequestFilter + MDC" },
            { path: "src/main/java/.../controller/OrderController.java", role: "★★ 自己写：六个端点" },
            { path: "src/test/java/.../OrderControllerTest.java", role: "★ 抄源项目的（这是判卷器）：@WebMvcTest + @MockBean + 五个测试" },
          ],
          commands: [
            { cmd: "mvn test", expect: "Tests run: 5, Failures: 0, Errors: 0 — BUILD SUCCESS" },
            {
              cmd: "mvn spring-boot:run",
              expect: "服务起在 8080，日志里能看到 Started OrderServiceApplication",
            },
            {
              cmd: 'curl -i -s localhost:8080/api/orders/999',
              expect: '404 + {"timestamp":...,"status":404,"message":"Order not found with id: 999"}',
            },
            {
              cmd: `curl -i -s -X POST localhost:8080/api/orders -H 'Content-Type: application/json' -d '{"userId":"123","items":[{"productId":"prod-789","quantity":2}]}'`,
              expect: "201 Created + 订单 JSON（totalAmount 应为 299.98）",
            },
            {
              cmd: `curl -i -s -X POST localhost:8080/api/orders -H 'Content-Type: application/json' -d '{"userId":"","items":[]}'`,
              expect: "400 Bad Request（Bean Validation 生效）",
            },
            {
              cmd: `curl -i -s -X PATCH localhost:8080/api/orders/1/status -H 'Content-Type: application/json' -d '{"status":"FLYING"}'`,
              expect: "400 Bad Request（不是 500）",
            },
            {
              cmd: "curl -i -s -X DELETE localhost:8080/api/orders/1",
              expect: "204 No Content，body 为空",
            },
            {
              cmd: `curl -i -s -H 'X-Correlation-ID: my-trace-1' localhost:8080/api/orders`,
              expect: "响应头里有同一个 X-Correlation-ID；服务端日志里也是它",
            },
          ],
          hints: [
            "先给六个端点各回答两个问题：「成功时有内容返回吗？」「是新建了一个资源吗？」这两个答案就把状态码定下来了。然后再问一个：「找不到的情况，该谁负责？」",
            "201 用 ResponseEntity.status(HttpStatus.CREATED).body(...)；204 用 ResponseEntity.noContent().build()。EntityNotFoundException 交给 @RestControllerAdvice，控制器里不要 catch —— 唯一该 try/catch 的地方是 PATCH 里的 enum 转换，因为要把 IllegalArgumentException 转成 400。correlationId 用 MDC.get(\"correlationId\")，别一层层传参。",
            `getAllOrders(userId):
  userId 为 null 或 blank -> service.getAllOrders()，否则 service.getOrdersByUserId(userId)
  ok(结果)

getOrderById(id):  ok(service.getOrderById(id))       // 不 catch，让 404 冒出去
getOrdersByUserId: ok(service.getOrdersByUserId(userId))
createOrder:       status(CREATED).body(service.createOrder(request))

updateOrderStatus(id, map):
  raw = map.get("status")
  raw 为空 -> throw ResponseStatusException(BAD_REQUEST, ...)
  try { status = OrderStatus.valueOf(raw.trim().toUpperCase()) }
  catch (IllegalArgumentException) -> throw ResponseStatusException(BAD_REQUEST, ...)
  ok(service.updateOrderStatus(id, status))

deleteOrder(id):   service.deleteOrder(id); noContent().build()

CorrelationIdFilter:
  extends OncePerRequestFilter
  读 header，空则 UUID.randomUUID()
  MDC.put + response.setHeader
  try { chain.doFilter } finally { MDC.remove }   // 线程复用，必须清`,
            `// 三个最容易丢分的点，直接给你：

// ① POST 的状态码
return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrder(request));

// ② DELETE 的状态码
orderService.deleteOrder(id);
return ResponseEntity.noContent().build();

// ③ PATCH 的安全转换
String raw = statusUpdate.get("status");
if (raw == null || raw.isBlank()) {
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is required");
}
final OrderStatus status;
try {
    status = OrderStatus.valueOf(raw.trim().toUpperCase());
} catch (IllegalArgumentException ex) {
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown status: " + raw);
}`,
          ],
          solution: [
            real(
              "java",
              `@RestController
public class OrderController {
    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/api/orders")
    public ResponseEntity<List<Order>> getAllOrders(
            @RequestParam(required = false) String userId) {
        logger.info("GET /api/orders userId={}, correlationId={}", userId, correlationId());

        List<Order> orders = (userId == null || userId.isBlank())
                ? orderService.getAllOrders()
                : orderService.getOrdersByUserId(userId);

        return ResponseEntity.ok(orders);
    }

    @GetMapping("/api/orders/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        logger.info("GET /api/orders/{} correlationId={}", id, correlationId());
        // 找不到时 service 抛 EntityNotFoundException -> GlobalExceptionHandler 转 404
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @GetMapping("/api/orders/user/{userId}")
    public ResponseEntity<List<Order>> getOrdersByUserId(@PathVariable String userId) {
        logger.info("GET /api/orders/user/{} correlationId={}", userId, correlationId());
        return ResponseEntity.ok(orderService.getOrdersByUserId(userId));
    }

    @PostMapping("/api/orders")
    public ResponseEntity<Order> createOrder(
            @Valid @RequestBody CreateOrderRequest request) {
        logger.info("POST /api/orders userId={}, correlationId={}",
                request.getUserId(), correlationId());

        Order created = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);   // 201
    }

    @PatchMapping("/api/orders/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusUpdate) {
        String raw = statusUpdate.get("status");
        logger.info("PATCH /api/orders/{}/status status={}, correlationId={}",
                id, raw, correlationId());

        if (raw == null || raw.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is required");
        }

        final OrderStatus status;
        try {
            status = OrderStatus.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown status: " + raw);
        }

        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }

    @DeleteMapping("/api/orders/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        logger.info("DELETE /api/orders/{} correlationId={}", id, correlationId());
        orderService.deleteOrder(id);
        return ResponseEntity.noContent().build();                        // 204
    }

    private String correlationId() {
        return MDC.get("correlationId");
    }
}`,
              {
                filename: "OrderController.java（参考答案，实测 mvn test 5/5 通过）",
                collapsible: true,
              },
            ),
            real(
              "java",
              `@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", 404,
                "message", ex.getMessage()
        ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        return ResponseEntity.badRequest().body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", 400,
                "message", "Invalid request"
        ));
    }
}`,
              {
                filename: "GlobalExceptionHandler.java",
                sourceFile:
                  "graphql-federation-practice/java-service/src/main/java/com/techflow/orders/exception/GlobalExceptionHandler.java",
                collapsible: true,
              },
            ),
            real(
              "java",
              `@Component
public class CorrelationIdFilter extends OncePerRequestFilter {
    private static final String HEADER = "X-Correlation-ID";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String correlationId = request.getHeader(HEADER);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }

        MDC.put("correlationId", correlationId);
        response.setHeader(HEADER, correlationId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove("correlationId");   // 线程复用，必须清理
        }
    }
}`,
              {
                filename: "CorrelationIdFilter.java",
                sourceFile:
                  "graphql-federation-practice/java-service/src/main/java/com/techflow/orders/config/CorrelationIdFilter.java",
                collapsible: true,
              },
            ),
          ],
        },
      ],
      transfer: [
        {
          signal: "拿到空目录",
          signalEn: "You are handed an empty directory",
          reachFor: "先让空服务能起来，再写业务",
          reachForEn: "Get an empty service to start first, then write the logic",
        },
        {
          signal: "有测试文件",
          signalEn: "A test file is provided",
          reachFor: "先抄进来当判卷器，一条一条攻",
          reachForEn: "Copy it in and let it grade you; fix one test at a time",
        },
        {
          signal: "跨模块调用",
          signalEn: "A call that crosses module boundaries",
          reachFor: "先抄一张方法名 + 签名对照表",
          reachForEn: "Write down a table of method names and signatures before you start",
        },
        {
          signal: "写完了",
          signalEn: "You think the code is finished",
          reachFor: "测试 + verify 脚本 + curl，三层都过才算完",
          reachForEn: "Tests, the verify script, and curl: it is done only when all three pass",
        },
      ],
      recap: [
        "起手式：先让空服务器能起来（能看到 ready 日志），再写业务逻辑。",
        "schema、数据源、测试是「题目」，抄进来等于搭好考场；resolver 和 index.js 是「答案」，自己写。",
        "写跨模块调用之前先抄方法名与签名表 —— 这能挡掉 starter 里那两处埋雷同类的错误。",
        "10 个测试全绿只是及格线，还要用 verify 脚本验 _service 和 _entities。",
        "Java 那半和 subgraph 无代码关联，可以完全独立做。",
      ],
      recapEn: [
        "First step: get an empty server to start, so you can see the ready log. Only then write the logic.",
        "The schema, the data source and the tests are the question, so copying them in just sets up the exam. The resolvers and index.js are the answer, so write those yourself.",
        "Before you write a call across modules, write down the method names and signatures. That stops the same kind of error as the two hidden problems in the starter code.",
        "All 10 tests passing is only the minimum. You still need the verify script to check _service and _entities.",
        "The Java half shares no code with the subgraph, so you can do it completely on its own.",
      ],
    },
  ],
};
