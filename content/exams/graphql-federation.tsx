// GraphQL Federation Capstone
// —— 基于 graphql-federation-practice。
//
// 模块拆在 fed-part1..4.tsx 里，这个文件负责组装 + 模拟考。

import type { Exam, MockExam } from "../types";
import { demo, tested } from "../helpers";
import { fedMentalModel, gqlBasics } from "./fed-part1";
import { fedTask1 } from "./fed-part2";
import { fedTask2, fedWritten } from "./fed-part3";
import { fedMastery } from "./fed-part4";

/* ================================================================
   模拟考：换 entity、换服务边界、换字段归属
   ================================================================ */

const MOCK_SCHEMA = `extend schema
  @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@external"])

# Author 由 Catalog subgraph 拥有，本 subgraph 只贡献 reviews 与 averageRating
type Author @key(fields: "id") {
  id: ID! @external
  reviews: [Review!]!
  averageRating: Float
}

# Book 也不是本 subgraph 拥有的，而且它用「复合 key」定位
type Book @key(fields: "isbn edition") {
  isbn: String! @external
  edition: Int! @external
  reviews: [Review!]!
}

type Review {
  id: ID!
  authorId: ID!
  isbn: String!
  edition: Int!
  rating: Int!
  body: String!
  createdAt: String!
  reviewer: Reviewer
}

type Reviewer {
  displayName: String!
  verified: Boolean!
}

type Query {
  review(id: ID!): Review
  reviews(authorId: ID!): [Review!]!
}

type Mutation {
  createReview(authorId: ID!, isbn: String!, edition: Int!, rating: Int!, body: String!): Review!
}`;

const MOCK_DATASOURCE = `// src/dataSources/reviewDataSource.js  —— PROVIDED，别改

class ReviewDataSource {
  constructor() {
    this.reviews = [
      { id: 'rev-1', authorId: 'a-7', isbn: '978-1', edition: 1, rating: 5,
        body: '很好', createdAt: '2026-01-02T10:00:00Z' },
      { id: 'rev-2', authorId: 'a-7', isbn: '978-1', edition: 2, rating: 3,
        body: '一般', createdAt: '2026-01-05T10:00:00Z' },
      { id: 'rev-3', authorId: 'a-9', isbn: '978-2', edition: 1, rating: 4,
        body: '不错', createdAt: '2026-01-09T10:00:00Z' },
    ];
  }

  async fetchReview(id) { /* 10ms 延迟；找不到返回 undefined */ }
  async fetchByAuthor(authorId) { /* 10ms 延迟；找不到返回 [] */ }
  async fetchByBook(isbn, edition) { /* 10ms 延迟；找不到返回 [] */ }
  async insertReview(authorId, isbn, edition, rating, body) {
    /* 10ms 延迟。注意：内部会用 reviewer.displayName 写审计日志，
       所以调用方必须先把 reviewer 查出来附在返回对象上 */
  }
}

class ReviewerDataSource {
  // 注意方法名不是 getReviewer
  async lookupReviewer(authorId) { /* 15ms；找不到返回 null */ }
}

class RatingDataSource {
  async computeAverage(authorId) { /* 20ms；没有评论时返回 null */ }
}

export { ReviewDataSource, ReviewerDataSource, RatingDataSource };`;

const MOCK_STARTER = `// src/resolvers/reviewResolvers.js  —— EDIT THIS

import DataLoader from 'dataloader';
import { GraphQLError } from 'graphql';

const ErrorCodes = {
  REVIEW_NOT_FOUND: 'REVIEW_NOT_FOUND',
  INVALID_INPUT: 'INVALID_INPUT',
  RATING_ERROR: 'RATING_ERROR',
  SERVICE_ERROR: 'SERVICE_ERROR'
};

// 按 authorId 批量取审阅人信息
function createReviewerLoader(reviewerDataSource) {
  return new DataLoader(async authorIds => {
    const reviewers = await Promise.all(
      authorIds.map(id => reviewerDataSource.getReviewer(id))
    );
    // 过滤掉没有资料的
    return reviewers.filter(r => r !== null);
  });
}

function createReviewLoader(reviewDataSource) {
  return new DataLoader(async ids => {
    return Promise.all(ids.map(id => reviewDataSource.fetchReview(id)));
  });
}

export const resolvers = {
  Author: {
    __resolveReference(author) {
      return { id: author.id };
    },

    async reviews(author, _, { dataSources, loaders, correlationId }) {
      // TODO 1: 取这位作者的全部评论。注意 schema 的可空性
      return [];
    },

    async averageRating(author, _, { dataSources, correlationId }) {
      // TODO 2: 用 RatingDataSource 算平均分。注意这个字段是可空的
      return null;
    }
  },

  Book: {
    __resolveReference(book) {
      // TODO 3: Book 用的是复合 key（isbn + edition）—— 想清楚这里该返回什么
      return null;
    },

    async reviews(book, _, { dataSources, correlationId }) {
      // TODO 4: 取这本书这一版的评论
      return [];
    }
  },

  Review: {
    async reviewer(parent, _, { dataSources, loaders, correlationId }) {
      // TODO 5: 用 DataLoader 取审阅人，防 N+1。可空
      return null;
    }
  },

  Query: {
    async review(_, { id }, { dataSources, loaders, correlationId }) {
      // TODO 6: 用 DataLoader；找不到抛结构化错误
      return null;
    },

    async reviews(_, { authorId }, { dataSources, correlationId }) {
      // TODO 7: 校验 authorId；注意可空性
      return [];
    }
  },

  Mutation: {
    // 提供作参考 —— 但它是坏的
    async createReview(_, { authorId, isbn, edition, rating, body }, { dataSources, correlationId }) {
      try {
        console.log(\`[\${correlationId}] Creating review for author: \${authorId}\`);

        if (!authorId || !isbn || !body) {
          throw new GraphQLError('Invalid review input', {
            extensions: { code: ErrorCodes.INVALID_INPUT, correlationId }
          });
        }

        const review = await dataSources.reviewAPI.insertReview({
          authorId, isbn, edition, rating, body
        });

        return review;
      } catch (error) {
        console.error(\`[\${correlationId}] Error creating review:\`, error.message);
        throw new GraphQLError('Failed to create review', {
          extensions: { code: ErrorCodes.SERVICE_ERROR, correlationId }
        });
      }
    }
  }
};

export { createReviewerLoader, createReviewLoader };`;

const MOCK_TESTS = `import { describe, it, expect, beforeEach } from '@jest/globals';
import { resolvers, createReviewerLoader, createReviewLoader } from '../src/resolvers/reviewResolvers.js';
import { ReviewDataSource, ReviewerDataSource, RatingDataSource } from '../src/dataSources/reviewDataSource.js';

describe('Review Resolvers', () => {
  let dataSources, loaders, context;

  beforeEach(() => {
    dataSources = {
      reviewDataSource: new ReviewDataSource(),
      reviewerDataSource: new ReviewerDataSource(),
      ratingDataSource: new RatingDataSource()
    };
    loaders = {
      reviewerLoader: createReviewerLoader(dataSources.reviewerDataSource),
      reviewLoader: createReviewLoader(dataSources.reviewDataSource)
    };
    context = { dataSources, loaders, correlationId: 'test-cid' };
  });

  describe('Author.reviews', () => {
    it('returns reviews for an author', async () => {
      const reviews = await resolvers.Author.reviews({ id: 'a-7' }, {}, context);
      expect(Array.isArray(reviews)).toBe(true);
      expect(reviews.length).toBe(2);
      expect(reviews[0]).toHaveProperty('authorId', 'a-7');
    });

    it('returns empty array for author with no reviews', async () => {
      const reviews = await resolvers.Author.reviews({ id: 'a-999' }, {}, context);
      expect(reviews).toEqual([]);
    });
  });

  describe('Author.averageRating', () => {
    it('returns a number for an author with reviews', async () => {
      const avg = await resolvers.Author.averageRating({ id: 'a-7' }, {}, context);
      expect(typeof avg).toBe('number');
    });

    it('returns null for an author with no reviews', async () => {
      const avg = await resolvers.Author.averageRating({ id: 'a-999' }, {}, context);
      expect(avg).toBeNull();
    });
  });

  describe('Book entity', () => {
    it('__resolveReference keeps both key fields', () => {
      const ref = resolvers.Book.__resolveReference({
        __typename: 'Book', isbn: '978-1', edition: 2
      });
      expect(ref).toEqual({ isbn: '978-1', edition: 2 });
    });

    it('Book.reviews filters by isbn AND edition', async () => {
      const reviews = await resolvers.Book.reviews(
        { isbn: '978-1', edition: 2 }, {}, context
      );
      expect(reviews.length).toBe(1);
      expect(reviews[0].id).toBe('rev-2');
    });
  });

  describe('Review.reviewer', () => {
    it('returns reviewer info', async () => {
      const r = await resolvers.Review.reviewer({ authorId: 'a-7' }, {}, context);
      expect(r).toHaveProperty('displayName');
    });

    it('returns null when reviewer is unknown', async () => {
      const r = await resolvers.Review.reviewer({ authorId: 'a-999' }, {}, context);
      expect(r).toBeNull();
    });
  });

  describe('Query.reviews', () => {
    it('returns reviews for an author', async () => {
      const reviews = await resolvers.Query.reviews({}, { authorId: 'a-9' }, context);
      expect(reviews.length).toBe(1);
    });

    it('returns empty array for unknown author', async () => {
      const reviews = await resolvers.Query.reviews({}, { authorId: 'a-999' }, context);
      expect(reviews).toEqual([]);
    });
  });

  describe('DataLoader contract', () => {
    it('reviewerLoader keeps length and order aligned with keys', async () => {
      // a-999 没有资料 -> 该位置必须是 null，不能被过滤掉
      const results = await Promise.all(
        ['a-7', 'a-999', 'a-9'].map(id => loaders.reviewerLoader.load(id))
      );
      expect(results.length).toBe(3);
      expect(results[1]).toBeNull();
      expect(results[2]).not.toBeNull();
    });
  });

  describe('Mutation.createReview', () => {
    it('creates a review with reviewer attached', async () => {
      const review = await resolvers.Mutation.createReview({}, {
        authorId: 'a-7', isbn: '978-3', edition: 1, rating: 5, body: '新评论'
      }, context);
      expect(review.id).toBeDefined();
      expect(review.reviewer).toBeDefined();
      expect(review.reviewer.displayName).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('returns INVALID_INPUT for empty body', async () => {
      try {
        await resolvers.Mutation.createReview({}, {
          authorId: 'a-7', isbn: '978-3', edition: 1, rating: 5, body: ''
        }, context);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.extensions.code).toBe('INVALID_INPUT');
      }
    });

    it('returns REVIEW_NOT_FOUND for unknown id', async () => {
      try {
        await resolvers.Query.review({}, { id: 'rev-999' }, context);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.extensions.code).toBe('REVIEW_NOT_FOUND');
      }
    });
  });
});`;

const MOCK_SOLUTION = `import DataLoader from 'dataloader';
import { GraphQLError } from 'graphql';

const ErrorCodes = {
  REVIEW_NOT_FOUND: 'REVIEW_NOT_FOUND',
  INVALID_INPUT: 'INVALID_INPUT',
  RATING_ERROR: 'RATING_ERROR',
  SERVICE_ERROR: 'SERVICE_ERROR'
};

// FIX：方法名是 lookupReviewer；而且绝不能 filter（长度与顺序是硬契约）
function createReviewerLoader(reviewerDataSource) {
  return new DataLoader(async authorIds => {
    console.log(\`[DataLoader] Batching \${authorIds.length} reviewer lookups\`);
    const reviewers = await Promise.all(
      authorIds.map(id => reviewerDataSource.lookupReviewer(id))
    );
    return reviewers;
  });
}

function createReviewLoader(reviewDataSource) {
  return new DataLoader(async ids => {
    console.log(\`[DataLoader] Batching \${ids.length} review fetches\`);
    return Promise.all(ids.map(id => reviewDataSource.fetchReview(id)));
  });
}

/** 七个 resolver 共用的错误包装，把「放行已结构化错误再包装」抽出来 */
function wrap(fn, { code, message }) {
  return async (...args) => {
    const ctx = args[2];
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      console.error(\`[\${ctx.correlationId}] \${message}:\`, error.message);
      throw new GraphQLError(message, {
        extensions: { code, correlationId: ctx.correlationId, originalError: error.message }
      });
    }
  };
}

export const resolvers = {
  Author: {
    __resolveReference(author) {
      return { id: author.id };
    },

    reviews: wrap(async (author, _, { dataSources, correlationId }) => {
      console.log(\`[\${correlationId}] Author.reviews authorId: \${author.id}\`);
      const reviews = await dataSources.reviewDataSource.fetchByAuthor(author.id);
      return reviews ?? [];                       // schema: [Review!]!
    }, { code: ErrorCodes.SERVICE_ERROR, message: 'Failed to fetch reviews for author' }),

    averageRating: wrap(async (author, _, { dataSources }) => {
      const avg = await dataSources.ratingDataSource.computeAverage(author.id);
      return avg ?? null;      // 可空标量：不能用 || ，0 是合法值
    }, { code: ErrorCodes.RATING_ERROR, message: 'Failed to compute average rating' })
  },

  Book: {
    // 复合 key：两个字段都要保留
    __resolveReference(book) {
      return { isbn: book.isbn, edition: book.edition };
    },

    reviews: wrap(async (book, _, { dataSources }) => {
      const reviews = await dataSources.reviewDataSource.fetchByBook(book.isbn, book.edition);
      return reviews ?? [];
    }, { code: ErrorCodes.SERVICE_ERROR, message: 'Failed to fetch reviews for book' })
  },

  Review: {
    reviewer: wrap(async (parent, _, { loaders }) => {
      const reviewer = await loaders.reviewerLoader.load(parent.authorId);
      return reviewer ?? null;                    // 可空
    }, { code: ErrorCodes.SERVICE_ERROR, message: 'Failed to fetch reviewer' })
  },

  Query: {
    review: wrap(async (_, { id }, { loaders, correlationId }) => {
      const review = await loaders.reviewLoader.load(id);
      if (!review) {
        throw new GraphQLError(\`Review not found: \${id}\`, {
          extensions: { code: ErrorCodes.REVIEW_NOT_FOUND, correlationId, reviewId: id }
        });
      }
      return review;
    }, { code: ErrorCodes.SERVICE_ERROR, message: 'Failed to fetch review' }),

    reviews: wrap(async (_, { authorId }, { dataSources, correlationId }) => {
      if (!authorId) {
        throw new GraphQLError('authorId is required', {
          extensions: { code: ErrorCodes.INVALID_INPUT, correlationId }
        });
      }
      const reviews = await dataSources.reviewDataSource.fetchByAuthor(authorId);
      return reviews ?? [];
    }, { code: ErrorCodes.SERVICE_ERROR, message: 'Failed to fetch reviews' })
  },

  Mutation: {
    createReview: wrap(async (_, { authorId, isbn, edition, rating, body },
                              { dataSources, loaders, correlationId }) => {
      console.log(\`[\${correlationId}] Creating review for author: \${authorId}\`);

      if (!authorId || !isbn || !body) {
        throw new GraphQLError('Invalid review input', {
          extensions: { code: ErrorCodes.INVALID_INPUT, correlationId }
        });
      }

      // insertReview 内部要用 reviewer.displayName 写审计日志 -> 先查出来附上
      const reviewer = await loaders.reviewerLoader.load(authorId);

      // FIX：键名是 reviewDataSource（不是 reviewAPI）；签名是五个位置参数
      const review = await dataSources.reviewDataSource.insertReview(
        authorId, isbn, edition, rating, body
      );

      return { ...review, reviewer };
    }, { code: ErrorCodes.SERVICE_ERROR, message: 'Failed to create review' })
  }
};

export { createReviewerLoader, createReviewLoader };`;

const reviewsMock: MockExam = {
  id: "book-reviews",
  title: "模拟考 B · Book Reviews Subgraph",
  titleEn: "Mock exam B · Book Reviews Subgraph",
  mirrors:
    "与真实 Task 1 相同的考点：entity 与 @key、__resolveReference、字段 resolver 的 parent、schema 可空性决定的兜底策略、DataLoader 防 N+1 及其长度/顺序契约、结构化错误与 correlation id、以及「catch 不要吞掉已结构化错误」。新增三个考点：复合 @key、可空标量字段（null 与 0 的区别）、以及一处「batch 函数用了 filter」的埋雷。",
  mirrorsEn:
    "The same points as the real Task 1: entity and @key, __resolveReference, the parent argument of a field resolver, the fallback the schema nullability forces on you, DataLoader against N+1 and its length and order contract, structured errors with a correlation id, and not letting a catch swallow an already structured error. Three points are new: a composite @key, a nullable scalar field (where null and 0 differ), and one planted bug where the batch function uses filter.",
  scenario:
    "图书评论 subgraph。它既不拥有 Author 也不拥有 Book —— 两者都由 Catalog subgraph 提供，本服务只往它们身上挂 reviews 和 averageRating。Book 用的是复合 key（isbn + edition），这是真实项目里很常见、但比单字段 key 更容易写错的情况。",
  scenarioEn:
    "A book reviews subgraph. It owns neither Author nor Book — both come from the Catalog subgraph, and this service only attaches reviews and averageRating to them. Book uses a composite key (isbn plus edition), which is common in real projects and easier to get wrong than a single-field key.",
  minutes: 90,

  // 【这一段的数字全是实测的，别改】
  // 起始态：10 failed / 4 passed（4 个「通过」里有假通过 —— 空实现恰好满足断言）。
  // 参考解法：14 / 14，另外 verify-schema 的 _service SDL 与 _entities 进程内验证也过。
  // 两头都在 scratchpad/mock-reviews 里跑过。
  //
  // 这套题是 Node 项目：本站的 Sandpack 跑在浏览器 iframe 里，没有 Node，
  // 所以它永远进不了页面内的沙箱。装不了 Node 的人去 StackBlitz ——
  // 它把 Node 编译进了浏览器，npm test 能真跑。
  setup: {
    bootstrap: [
      { cmd: "mkdir book-reviews && cd book-reviews && npm init -y", note: { zh: "空目录起步", en: "Start from an empty directory." } },
      {
        cmd: "npm pkg set type=module",
        note: { zh: "这套题用 ESM。忘了这一步，import 语句会直接报 Cannot use import statement outside a module", en: "This paper uses ESM. Skip this and your import statements fail with Cannot use import statement outside a module." },
      },
      {
        cmd: "npm i @apollo/server @apollo/subgraph graphql graphql-tag dataloader",
        note: { zh: "运行时依赖", en: "Runtime dependencies." },
      },
      { cmd: "npm i -D jest @jest/globals", note: { zh: "判卷器", en: "The grader." } },
      {
        cmd: "npm pkg set scripts.test=\"NODE_OPTIONS=--experimental-vm-modules jest\"",
        note: { zh: "ESM 下的 jest 必须带这个 flag，否则报 Cannot use import statement outside a module", en: "Jest under ESM needs this flag, otherwise you get Cannot use import statement outside a module." },
      },
    ],
    files: [
      {
        path: "package.json",
        role: { zh: "jest 段：testEnvironment 用 node、transform 留空对象、testMatch 指到 __tests__", en: "The jest block: testEnvironment node, transform an empty object, testMatch pointing at __tests__." },
      },
      { path: "src/schema.graphql", role: {
          zh: "PROVIDED —— 精读它，可空性决定你的兜底策略",
          en: "PROVIDED — read it closely; nullability decides your fallback strategy.",
        } },
      { path: "src/dataSources/reviewDataSource.js", role: {
          zh: "PROVIDED —— 先抄一张方法名表出来",
          en: "PROVIDED — copy out a table of its method names before you start.",
        } },
      {
        path: "src/resolvers/reviewResolvers.js",
        role: { zh: "EDIT THIS —— 7 个 TODO 加 6 处埋雷，全部改动都在这个文件里", en: "EDIT THIS — 7 TODOs plus 6 planted traps. Every change you make lives in this file." },
        edit: true,
      },
      { path: "__tests__/resolvers.test.js", role: {
          zh: "判卷器，14 个测试。原样抄，不要改它",
          en: "The grader, 14 tests. Copy it verbatim and do not edit it.",
        } },
    ],
    baseline: {
      zh: "Tests: 10 failed, 4 passed, 14 total —— 那 4 个「通过」里有假通过，空实现恰好满足了断言，别当成做对了",
      en: "Tests: 10 failed, 4 passed, 14 total — some of those 4 passes are false: an empty implementation happens to satisfy the assertion. Do not read them as progress.",
    },
    target: { zh: "Tests: 14 passed, 14 total", en: "Tests: 14 passed, 14 total" },
  },
  tasks: [
    {
      id: "t1",
      title: "Task 1 · Author 上的两个字段",
      titleEn: "Task 1 · The two fields on Author",
      requirement: [
        "Author.reviews：按 author.id 取全部评论。schema 是 [Review!]!，绝不返回 null",
        "Author.averageRating：用 ratingDataSource.computeAverage 计算。schema 是 Float（可空），没有评论时返回 null",
        "两个都要 try/catch + 结构化错误 + correlationId 日志",
        "catch 第一行必须放行已经是 GraphQLError 的错误",
      ],
      rubric: [
        { points: 6, label: "reviews 用了正确的数据源方法并兜底成 []" },
        { points: 6, label: "averageRating 返回 null 而不是 0（区分「没有数据」和「平均分是 0」）" },
        { points: 4, label: "两个 resolver 都带 try/catch 与 correlationId" },
        { points: 4, label: "catch 里放行了已结构化的 GraphQLError" },
      ],
    },
    {
      id: "t2",
      title: "Task 2 · 复合 key 的 entity",
      titleEn: "Task 2 · An entity with a composite key",
      requirement: [
        'Book.__resolveReference：Book 的 @key 是 "isbn edition" 两个字段，返回的对象必须同时保留这两个',
        "Book.reviews：必须同时按 isbn 和 edition 过滤 —— 只按 isbn 会把其他版本的评论混进来",
        "注意 edition 是 Int、isbn 是 String，别把类型搞混",
      ],
      rubric: [
        { points: 8, label: "__resolveReference 返回了两个 key 字段（不是只有 isbn）" },
        { points: 8, label: "Book.reviews 同时用了 isbn 和 edition 过滤" },
        { points: 3, label: "调了 fetchByBook 而不是自己在 resolver 里 filter" },
      ],
    },
    {
      id: "t3",
      title: "Task 3 · Review.reviewer 与 DataLoader 契约",
      titleEn: "Task 3 · Review.reviewer and the DataLoader contract",
      requirement: [
        "Review.reviewer：用 loaders.reviewerLoader 防 N+1，不许直接调数据源",
        "schema 里 reviewer 可空，找不到时返回 null（测试断言 toBeNull）",
        "修好 createReviewerLoader 里的两处问题：方法名，以及那个会破坏长度/顺序契约的 filter",
      ],
      rubric: [
        { points: 6, label: "走了 loader 而不是直接调 reviewerDataSource" },
        { points: 8, label: "修掉了 batch 函数里的 filter（长度与顺序必须与 keys 对齐）" },
        { points: 5, label: "用了数据源上真实存在的方法名（lookupReviewer，不是 getReviewer）" },
        { points: 3, label: "找不到时显式返回 null" },
      ],
    },
    {
      id: "t4",
      title: "Task 4 · 两个 Query",
      titleEn: "Task 4 · The two queries",
      requirement: [
        "Query.review：用 reviewLoader；找不到抛带 REVIEW_NOT_FOUND code 的 GraphQLError",
        "Query.reviews：校验 authorId；schema 是 [Review!]! 所以兜底 []",
        "两个都带 correlationId 日志",
      ],
      rubric: [
        { points: 5, label: "Query.review 用了 loader" },
        { points: 6, label: "找不到时抛 REVIEW_NOT_FOUND（不是 SERVICE_ERROR）" },
        { points: 5, label: "Query.reviews 校验了 authorId 并兜底 []" },
      ],
    },
    {
      id: "t5",
      title: "Task 5 · 修好 Mutation.createReview",
      titleEn: "Task 5 · Fix Mutation.createReview",
      requirement: [
        "它注释说「提供作参考」，但它是坏的 —— 自己找出并修好全部问题",
        "至少有三处：数据源键名、insertReview 的调用方式、以及 catch 吞掉结构化错误",
        "还有一处最隐蔽：insertReview 内部要用 reviewer.displayName 写审计日志，所以传进去之前必须先把 reviewer 查出来附上",
      ],
      rubric: [
        { points: 5, label: "修对了数据源键名（reviewDataSource，不是 reviewAPI）" },
        { points: 5, label: "按真实签名调用 insertReview（五个位置参数，不是一个对象）" },
        { points: 8, label: "创建前先查出 reviewer 并附上（本题最隐蔽的一处）" },
        { points: 6, label: "catch 第一行放行已结构化的 GraphQLError，让 INVALID_INPUT 传得出去" },
      ],
    },
    {
      id: "t6",
      title: "Task 6 · 验证",
      titleEn: "Task 6 · Verify",
      requirement: [
        "npm test 全部 14 个测试通过",
        "自己写一个 verify 脚本：查 _service 的 SDL、用 _entities 分别解析 Author 和 Book（后者要传两个 key 字段）",
        "在日志里确认 reviewerLoader 的批量合并真的发生了（一行 Batching，N 大于 1）",
      ],
      rubric: [
        { points: 8, label: "14 个测试全过" },
        { points: 6, label: "verify 脚本能用 _entities 解析复合 key 的 Book" },
        { points: 4, label: "确认了 DataLoader 的合并（日志里 N > 1）" },
      ],
    },
  ],
  starter: [
    demo("graphql", MOCK_SCHEMA, {
      filename: "src/schema.graphql（PROVIDED —— 精读它，可空性决定你的兜底策略）",
      filenameEn: "src/schema.graphql (PROVIDED — read it closely; nullability decides your fallback)",
      collapsible: true,
      explanation:
        "四处先标出来：Author.reviews 和 Book.reviews 都是 [Review!]!（双重非空）；Author.averageRating 是 Float（可空）；Review.reviewer 可空；Book 的 @key 是两个字段。",
      explanationEn:
        "Mark four things before you start. Author.reviews and Book.reviews are both [Review!]! — a non-null list of non-null items. Author.averageRating is Float, so it may be null. Review.reviewer may be null. Book has a @key made of two fields.",
    }),
    demo("js", MOCK_DATASOURCE, {
      filename: "src/dataSources/reviewDataSource.js（PROVIDED —— 抄一张方法名表）",
      filenameEn: "src/dataSources/reviewDataSource.js (PROVIDED — copy out a table of method names)",
      collapsible: true,
      explanation:
        "真实方法名：fetchReview / fetchByAuthor / fetchByBook / insertReview / lookupReviewer / computeAverage。starter 里有一处调了不存在的方法。",
      explanationEn:
        "The real method names are fetchReview / fetchByAuthor / fetchByBook / insertReview / lookupReviewer / computeAverage. One call in the starter uses a method that does not exist.",
    }),
    tested("js", MOCK_STARTER, {
      filename: "src/resolvers/reviewResolvers.js（EDIT THIS —— 7 个 TODO + 6 处埋雷）",
      filenameEn: "src/resolvers/reviewResolvers.js (EDIT THIS — 7 TODOs plus 6 planted bugs)",
      collapsible: true,
      explanation:
        "这是 DrillLab 自出的模拟题，不是源项目内容。六处埋雷没有任何标注 —— 和真实考试一样，只有 README 里那句「可能存在集成问题」。",
      explanationEn:
        "DrillLab wrote this mock task; it does not come from the source project. None of the six planted bugs is marked. That matches the real exam, where the only warning is one README line saying integration problems may exist.",
    }),
  ],
  tests: [
    tested("js", MOCK_TESTS, {
      filename: "__tests__/resolvers.test.js（判卷器，14 个测试）",
      filenameEn: "__tests__/resolvers.test.js (the marker, 14 tests)",
      collapsible: true,
      explanation:
        "比真实项目多了三条针对性测试：averageRating 的 toBeNull、Book.__resolveReference 的两个 key 字段、以及 reviewerLoader 的长度/顺序契约。这三条正是真实项目测不到但你该会的地方。",
      explanationEn:
        "Three tests here go past what the real project checks: toBeNull for averageRating, the two key fields of Book.__resolveReference, and the length and order contract of reviewerLoader. Those three cover exactly what the real project leaves untested but you are still expected to know.",
    }),
  ],
  commands: [
    { cmd: "npm install", expect: "依赖装好", expectEn: "Dependencies installed" },
    {
      cmd: "npm test",
      expect: "Tests: 14 passed, 14 total（starter 状态下的基线是 10 failed / 4 passed）",
      expectEn:
        "Tests: 14 passed, 14 total (the baseline in the starter state is 10 failed / 4 passed)",
    },
    {
      cmd: "node verify-schema.mjs",
      expect:
        "SDL 含两个 @key（单字段的 Author 和复合字段的 Book）；_entities 能分别解析两者；日志里 reviewerLoader 出现一行 Batching 且 N > 1",
    },
  ],
  walkthrough: [
    {
      id: "m-diff",
      heading: "和真实 Task 1 的对应关系",
      headingEn: "How this maps to the real Task 1",
      body: (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>真实 Task 1</th>
                  <th>本模拟题</th>
                  <th>考点变了吗</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>User entity，@key(&quot;id&quot;)</td>
                  <td>Author entity，@key(&quot;id&quot;)</td>
                  <td>没变</td>
                </tr>
                <tr>
                  <td>—</td>
                  <td>
                    <strong>Book entity，@key(&quot;isbn edition&quot;)</strong>
                  </td>
                  <td>
                    <strong>新考点</strong>：复合 key，
                    <code>__resolveReference</code> 要保留两个字段
                  </td>
                </tr>
                <tr>
                  <td>User.orders: [Order!]!</td>
                  <td>Author.reviews: [Review!]!</td>
                  <td>没变，还是 ?? [] 兜底</td>
                </tr>
                <tr>
                  <td>—</td>
                  <td>
                    <strong>Author.averageRating: Float</strong>
                  </td>
                  <td>
                    <strong>新考点</strong>：可空<strong>标量</strong>，要区分 null 和 0
                  </td>
                </tr>
                <tr>
                  <td>Order.shippingInfo 用 DataLoader</td>
                  <td>Review.reviewer 用 DataLoader</td>
                  <td>没变</td>
                </tr>
                <tr>
                  <td>loader 埋雷：方法名错</td>
                  <td>
                    loader 埋雷：方法名错 + <strong>batch 函数用了 filter</strong>
                  </td>
                  <td>
                    <strong>新考点</strong>：长度/顺序契约
                  </td>
                </tr>
                <tr>
                  <td>mutation 埋雷：键名 + 签名 + 缺 price</td>
                  <td>
                    mutation 埋雷：键名 + 签名 + <strong>缺 reviewer</strong>
                  </td>
                  <td>同一个模式，换了个缺失字段</td>
                </tr>
                <tr>
                  <td>mutation 埋雷：catch 吞掉结构化错误</td>
                  <td>同样</td>
                  <td>没变</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            <strong>八个考点里五个原样保留、三个是新的。</strong>
            如果你在真实 Task 1 里是靠背答案过的，那三个新考点会全丢；
            如果你理解了「schema 的可空性决定兜底策略」
            「parent 来自 __resolveReference」
            「batch 函数的长度顺序是硬契约」这三条原理，
            这道题只是换了名词。
          </p>
        </>
      ),
      bodyEn: (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Real Task 1</th>
                  <th>This mock</th>
                  <th>Did the skill change?</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>User entity, @key(&quot;id&quot;)</td>
                  <td>Author entity, @key(&quot;id&quot;)</td>
                  <td>No change</td>
                </tr>
                <tr>
                  <td>—</td>
                  <td>
                    <strong>Book entity, @key(&quot;isbn edition&quot;)</strong>
                  </td>
                  <td>
                    <strong>New</strong>: a composite key, so{" "}
                    <code>__resolveReference</code> has to keep both fields
                  </td>
                </tr>
                <tr>
                  <td>User.orders: [Order!]!</td>
                  <td>Author.reviews: [Review!]!</td>
                  <td>No change, still the ?? [] fallback</td>
                </tr>
                <tr>
                  <td>—</td>
                  <td>
                    <strong>Author.averageRating: Float</strong>
                  </td>
                  <td>
                    <strong>New</strong>: a nullable <strong>scalar</strong>, so null
                    and 0 have to stay apart
                  </td>
                </tr>
                <tr>
                  <td>Order.shippingInfo uses DataLoader</td>
                  <td>Review.reviewer uses DataLoader</td>
                  <td>No change</td>
                </tr>
                <tr>
                  <td>Loader trap: wrong method name</td>
                  <td>
                    Loader trap: wrong method name +{" "}
                    <strong>a filter inside the batch function</strong>
                  </td>
                  <td>
                    <strong>New</strong>: the length / order contract
                  </td>
                </tr>
                <tr>
                  <td>Mutation trap: key name + signature + missing price</td>
                  <td>
                    Mutation trap: key name + signature +{" "}
                    <strong>missing reviewer</strong>
                  </td>
                  <td>Same pattern, a different missing field</td>
                </tr>
                <tr>
                  <td>Mutation trap: catch swallows the structured error</td>
                  <td>Same</td>
                  <td>No change</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            <strong>
              Five of the eight skills carry over untouched, three are new.
            </strong>{" "}
            If you got through the real Task 1 by memorising the answer, all three
            new ones are gone. If you understood the three principles:
            &ldquo;schema nullability decides the fallback&rdquo;, &ldquo;parent
            comes from __resolveReference&rdquo;, &ldquo;the length and order of a
            batch function are a hard contract&rdquo;, then this paper is just a
            rename.
          </p>
        </>
      ),
    },
    {
      id: "m-composite-key",
      heading: "新考点 1 · 复合 @key",
      headingEn: "New topic 1 · Composite @key",
      lede: "只保留一个 key 字段是最常见的错法。",
      ledeEn: "Keeping only one key field is the most common mistake here.",
      body: (
        <>
          <p>
            <code>@key(fields: &quot;isbn edition&quot;)</code> 表示
            <strong>要两个字段一起才能唯一定位一本书</strong>——
            同一个 ISBN 的不同版本是不同的实体。
          </p>
          <p>
            所以 Router 传来的 representation 长这样：
            <code>{'{ __typename: "Book", isbn: "978-1", edition: 2 }'}</code>。
            <code>__resolveReference</code> 必须<strong>两个都保留</strong>。
          </p>
          <p>
            <strong>只返回 <code>{"{ isbn }"}</code> 会怎样？</strong>
            下游的 <code>Book.reviews</code> 拿到的 parent 上没有
            <code>edition</code>，过滤条件里它是 <code>undefined</code> ——
            要么筛出 0 条，要么（如果你写了兜底）筛出错误版本的评论。
          </p>
          <p>
            测试用{" "}
            <code>expect(ref).toEqual({"{ isbn: '978-1', edition: 2 }"})</code>{" "}
            直接查这一点。
          </p>
        </>
      ),
      bodyEn: (
        <>
          <p>
            <code>@key(fields: &quot;isbn edition&quot;)</code> means{" "}
            <strong>it takes both fields together to pin down one book</strong> —
            two editions behind the same ISBN are different entities.
          </p>
          <p>
            So the representation the Router sends looks like this:{" "}
            <code>{'{ __typename: "Book", isbn: "978-1", edition: 2 }'}</code>.{" "}
            <code>__resolveReference</code> has to <strong>keep both</strong>.
          </p>
          <p>
            <strong>
              What happens if you return only <code>{"{ isbn }"}</code>?
            </strong>{" "}
            The parent handed to <code>Book.reviews</code> downstream has no{" "}
            <code>edition</code>, so in the filter it is <code>undefined</code> —
            either 0 rows come back, or (if you wrote a fallback) reviews of the
            wrong edition do.
          </p>
          <p>
            The test checks exactly this with{" "}
            <code>expect(ref).toEqual({"{ isbn: '978-1', edition: 2 }"})</code>.
          </p>
        </>
      ),
      code: [
        demo(
          "js",
          `// ✓ 两个 key 字段都要保留
Book: {
  __resolveReference(book) {
    return { isbn: book.isbn, edition: book.edition };
  },

  async reviews(book, _, { dataSources, correlationId }) {
    const reviews = await dataSources.reviewDataSource.fetchByBook(
      book.isbn,
      book.edition          // ← 两个都传，否则会混进其他版本
    );
    return reviews ?? [];
  }
}

// ✗ 只保留一个 —— 下游 edition 是 undefined
__resolveReference(book) {
  return { isbn: book.isbn };
}`,
          { filename: "复合 key 的正确处理" },
        ),
      ],
    },
    {
      id: "m-nullable-scalar",
      heading: "新考点 2 · 可空标量：null 和 0 不是一回事",
      headingEn: "New topic 2 · Nullable scalars: null and 0 mean different things",
      body: (
        <>
          <p>
            <code>averageRating: Float</code> 可空。
            <strong>「这位作者没有评论」和「这位作者的平均分是 0」是两件事</strong>
            —— 前者该返回 <code>null</code>，后者返回 <code>0</code>。
          </p>
          <p>
            所以这里<strong>不能用 <code>?? 0</code>，也不能用{" "}
            <code>|| null</code></strong>：
          </p>
          <p>
            <code>??</code> 只在左边是 <code>null</code> 或{" "}
            <code>undefined</code> 时取右边；<code>||</code> 在左边是任何假值时
            都取右边 —— 包括 <code>0</code>。
            <strong>对可能合法为 0 的数值字段，<code>||</code> 是个 bug。</strong>
          </p>
          <p>
            测试用 <code>expect(avg).toBeNull()</code> 查它。
            数据源的 <code>computeAverage</code> 在没有评论时返回{" "}
            <code>null</code>，所以原样返回就对了。
          </p>
        </>
      ),
      bodyEn: (
        <>
          <p>
            <code>averageRating: Float</code> is nullable.{" "}
            <strong>
              &ldquo;This author has no reviews&rdquo; and &ldquo;this author averages
              0&rdquo; are two different facts
            </strong>{" "}
            — the first should return <code>null</code>, the second{" "}
            <code>0</code>.
          </p>
          <p>
            So here you{" "}
            <strong>
              cannot use <code>?? 0</code>, and cannot use <code>|| null</code>
            </strong>{" "}
            either:
          </p>
          <p>
            <code>??</code> takes the right side only when the left side is{" "}
            <code>null</code> or <code>undefined</code>; <code>||</code> takes the
            right side whenever the left side is any falsy value — including{" "}
            <code>0</code>.{" "}
            <strong>
              For a numeric field that may legitimately be 0, <code>||</code> is a
              bug.
            </strong>
          </p>
          <p>
            The test checks it with <code>expect(avg).toBeNull()</code>. The data
            source&rsquo;s <code>computeAverage</code> returns{" "}
            <code>null</code> when there are no reviews, so passing it straight
            through is already right.
          </p>
        </>
      ),
      code: [
        demo(
          "js",
          `// ✓ 让 null 表达「没有数据」
const avg = await dataSources.ratingDataSource.computeAverage(author.id);
return avg ?? null;

// ✗ ?? 0 —— 把「没有评论」谎报成「平均分 0 分」
return avg ?? 0;

// ✗ || null —— 真实平均分是 0 时会被谎报成「没有数据」
return avg || null;`,
          { filename: "?? 和 || 的区别在这里是致命的" },
        ),
      ],
    },
    {
      id: "m-loader-contract",
      heading: "新考点 3 · batch 函数里的 filter",
      headingEn: "New topic 3 · A filter inside the batch function",
      body: (
        <>
          <p>
            starter 的 <code>createReviewerLoader</code> 里有这一行：
            <code>return reviewers.filter(r =&gt; r !== null)</code>。
          </p>
          <p>
            <strong>看起来很合理</strong> ——「过滤掉没有资料的」。
            但它<strong>破坏了 DataLoader 的核心契约</strong>：
            返回数组必须与 keys 一一对应。
          </p>
          <p>
            传 <code>[&apos;a-7&apos;, &apos;a-999&apos;, &apos;a-9&apos;]</code>
            ，其中 a-999 没有资料。filter 之后数组只剩 2 个元素 ——
            <code>dataloader</code> 会检查长度，
            <strong>三个 <code>load()</code> 全部 reject</strong>，报{" "}
            <code>
              DataLoader must be constructed with a function which accepts
              Array&lt;key&gt; and returns Promise&lt;Array&lt;value&gt;&gt;, but the
              function did not return a Promise of an Array of the same length as the
              Array of keys
            </code>
            。
          </p>
          <p>
            <strong>所以这一条不是「静默串数据」，是「整批炸掉」</strong> ——
            那条测试挂在这个 TypeError 上，不是挂在某个字段对不上。
            <strong>真正会静默串数据的是另一种写法：长度对、顺序错。</strong>
            实测 batch 函数返回 <code>rows.reverse()</code>（长度没变）时，
            <code>load(&apos;a-9&apos;)</code> 拿到的是 a-999 的行，
            <code>load(&apos;a-999&apos;)</code> 拿到 a-9 的行，
            <strong>一声不响</strong>。契约是「长度相同 <em>且</em> 顺序一致」，
            两条里长度那条有人替你查，顺序那条没人查。
          </p>
          <p>
            另外方法名也是错的 —— 数据源上是 <code>lookupReviewer</code>，
            不是 <code>getReviewer</code>。
          </p>
        </>
      ),
      bodyEn: (
        <>
          <p>
            The starter&rsquo;s <code>createReviewerLoader</code> has this line in it:{" "}
            <code>return reviewers.filter(r =&gt; r !== null)</code>.
          </p>
          <p>
            <strong>It looks perfectly reasonable</strong> — &ldquo;drop the ones with
            no profile&rdquo;. But it{" "}
            <strong>breaks DataLoader&rsquo;s core contract</strong>: the returned
            array must line up one-to-one with keys.
          </p>
          <p>
            Pass <code>[&apos;a-7&apos;, &apos;a-999&apos;, &apos;a-9&apos;]</code>,
            where a-999 has no profile. After the filter the array holds only 2
            elements — <code>dataloader</code> checks the length, so{" "}
            <strong>all three <code>load()</code> calls reject</strong> with{" "}
            <code>
              DataLoader must be constructed with a function which accepts
              Array&lt;key&gt; and returns Promise&lt;Array&lt;value&gt;&gt;, but the
              function did not return a Promise of an Array of the same length as the
              Array of keys
            </code>
            .
          </p>
          <p>
            <strong>
              So this one does not mix the data up silently, it fails the whole batch
            </strong>{" "}
            — that test fails on the TypeError, not on some field not lining up.{" "}
            <strong>
              The version that really does cross data silently is a different one: right
              length, wrong order.
            </strong>{" "}
            Measured: when the batch function returns <code>rows.reverse()</code> (length
            unchanged), <code>load(&apos;a-9&apos;)</code> gets a-999&rsquo;s row and{" "}
            <code>load(&apos;a-999&apos;)</code> gets a-9&rsquo;s row,{" "}
            <strong>without a sound</strong>. The contract is &ldquo;same length{" "}
            <em>and</em> same order&rdquo;; someone checks the length for you, nobody
            checks the order.
          </p>
          <p>
            The method name is wrong too — the data source has{" "}
            <code>lookupReviewer</code>, not <code>getReviewer</code>.
          </p>
        </>
      ),
      code: [
        demo(
          "js",
          `// ✓ 长度与顺序都与 keys 对齐，「没有」用 null 占位
function createReviewerLoader(reviewerDataSource) {
  return new DataLoader(async authorIds => {
    console.log(\`[DataLoader] Batching \${authorIds.length} reviewer lookups\`);

    const reviewers = await Promise.all(
      authorIds.map(id => reviewerDataSource.lookupReviewer(id))   // 真实方法名
    );

    return reviewers;      // 不 filter，不排序
  });
}`,
          { filename: "修好之后" },
        ),
      ],
    },
    {
      id: "m-mutation",
      heading: "Mutation 的四处问题，其中一处最隐蔽",
      headingEn: "Four problems in the Mutation, and one is hard to see",
      body: (
        <>
          <p>
            前两处和真实项目一模一样：<strong>键名</strong>（
            <code>reviewAPI</code> → <code>reviewDataSource</code>）和
            <strong>签名</strong>（一个对象 → 五个位置参数）。
          </p>
          <p>
            第三处是<strong>「缺一个字段」</strong>模式的变体。
            真实项目里是 <code>OrderItemInput</code> 缺 <code>price</code>；
            这里是 <code>insertReview</code> 内部要用{" "}
            <code>reviewer.displayName</code> 写审计日志，
            但 mutation 的参数里没有 reviewer。
          </p>
          <p>
            <strong>所以必须先把 reviewer 查出来附上。</strong>
            测试用 <code>expect(review.reviewer.displayName).toBeDefined()</code>{" "}
            查它。
          </p>
          <p>
            第四处在 <code>catch</code> 里，也是 rubric 里单独占 6 分的那条：
            starter 的 <code>catch</code> 无条件把错误重新包成{" "}
            <code>SERVICE_ERROR</code>，于是上面那个自己抛的{" "}
            <code>INVALID_INPUT</code>
            <strong>刚出门就被自己的 catch 改名了</strong>。
            测试 <code>expect(error.extensions.code).toBe(&apos;INVALID_INPUT&apos;)</code>{" "}
            因此挂掉。
            <strong>
              修法是 catch 第一行先放行已经结构化的 <code>GraphQLError</code>。
            </strong>
          </p>
          <p>
            <strong>
              识别这类问题的通用方法：看下游要用什么，对照上游给了什么。
            </strong>
            差集就是你要补的。
          </p>
        </>
      ),
      bodyEn: (
        <>
          <p>
            The first two are exactly the same as in the real project: the{" "}
            <strong>key name</strong> (<code>reviewAPI</code> →{" "}
            <code>reviewDataSource</code>) and the <strong>signature</strong> (one
            object → five positional arguments).
          </p>
          <p>
            The third is a variant of the{" "}
            <strong>&ldquo;one field is missing&rdquo;</strong> pattern. In the real
            project it was <code>OrderItemInput</code> missing{" "}
            <code>price</code>; here <code>insertReview</code> uses{" "}
            <code>reviewer.displayName</code> internally to write the audit log, but
            the mutation arguments carry no reviewer.
          </p>
          <p>
            <strong>So you have to look the reviewer up first and attach it.</strong>{" "}
            The test checks it with{" "}
            <code>expect(review.reviewer.displayName).toBeDefined()</code>.
          </p>
          <p>
            The fourth one lives in the <code>catch</code>, and it is the line worth 6
            points on its own in the rubric: the starter&rsquo;s <code>catch</code>{" "}
            unconditionally re-wraps the error as <code>SERVICE_ERROR</code>, so the{" "}
            <code>INVALID_INPUT</code> thrown a few lines above{" "}
            <strong>gets renamed by its own catch on the way out</strong>. That is why{" "}
            <code>expect(error.extensions.code).toBe(&apos;INVALID_INPUT&apos;)</code>{" "}
            fails.{" "}
            <strong>
              The fix is to let an already structured <code>GraphQLError</code> through
              on the first line of the catch.
            </strong>
          </p>
          <p>
            <strong>
              The general way to spot this class of problem: look at what downstream
              needs, then at what upstream gave you.
            </strong>{" "}
            The difference is what you have to fill in.
          </p>
        </>
      ),
    },
    {
      id: "m-checklist",
      heading: "交卷前自检清单",
      headingEn: "Checklist before you submit",
      body: (
        <>
          <ol>
            <li>
              <code>npm test</code> → 14 passed。
            </li>
            <li>
              搜一遍代码：batch 函数里有没有 <code>filter</code> /{" "}
              <code>sort</code> / <code>slice</code>？（都不该有）
            </li>
            <li>
              <code>Book.__resolveReference</code> 返回了<strong>两个</strong>{" "}
              key 字段吗？
            </li>
            <li>
              <code>Book.reviews</code> 的过滤条件包含 <code>edition</code> 吗？
            </li>
            <li>
              <code>averageRating</code> 用的是 <code>??</code> 而不是{" "}
              <code>||</code> 吗？
            </li>
            <li>
              七个 resolver 的 catch 第一行都有{" "}
              <code>instanceof GraphQLError</code> 吗？
            </li>
            <li>
              <code>Review.reviewer</code> 走的是 loader 而不是数据源吗？
            </li>
            <li>
              日志里 <code>Batching</code> 那行的 N 大于 1 吗？（证明合并真的发生）
            </li>
            <li>
              所有数据源方法名都核对过吗？（<code>fetchByAuthor</code> /{" "}
              <code>fetchByBook</code> / <code>lookupReviewer</code> /{" "}
              <code>computeAverage</code> / <code>insertReview</code>）
            </li>
          </ol>
          <p>
            第 2、5、8 条是这道题独有的陷阱，也是最能区分「理解了」和「照抄了」的三条。
          </p>
        </>
      ),
      bodyEn: (
        <>
          <ol>
            <li>
              <code>npm test</code> → 14 passed.
            </li>
            <li>
              Search the code: is there a <code>filter</code> / <code>sort</code> /{" "}
              <code>slice</code> anywhere inside a batch function? (None of them
              belong there.)
            </li>
            <li>
              Does <code>Book.__resolveReference</code> return <strong>both</strong>{" "}
              key fields?
            </li>
            <li>
              Does the filter in <code>Book.reviews</code> include{" "}
              <code>edition</code>?
            </li>
            <li>
              Does <code>averageRating</code> use <code>??</code> rather than{" "}
              <code>||</code>?
            </li>
            <li>
              Do all seven resolvers start their catch with{" "}
              <code>instanceof GraphQLError</code>?
            </li>
            <li>
              Does <code>Review.reviewer</code> go through the loader instead of the
              data source?
            </li>
            <li>
              Is N greater than 1 on the <code>Batching</code> line in the log? (That
              is the proof the batching really happened.)
            </li>
            <li>
              Have you checked every data source method name? (
              <code>fetchByAuthor</code> / <code>fetchByBook</code> /{" "}
              <code>lookupReviewer</code> / <code>computeAverage</code> /{" "}
              <code>insertReview</code>)
            </li>
          </ol>
          <p>
            Items 2, 5 and 8 are the traps unique to this paper, and the three that
            best separate understanding from copying.
          </p>
        </>
      ),
    },
  ],
  solution: [
    tested("js", MOCK_SOLUTION, {
      filename: "src/resolvers/reviewResolvers.js（参考答案）",
      filenameEn: "src/resolvers/reviewResolvers.js (reference answer)",
      collapsible: true,
      explanation:
        "这份答案多了一个 wrap 高阶函数，把「catch 里放行 GraphQLError 再包装」这段重复逻辑抽掉了。真实考试里写不写都行 —— 但如果你自己想到了这一步，说明你真的理解了那个模式，而不是在复制粘贴。",
      explanationEn:
        "This answer adds one extra helper, wrap. It pulls out the repeated logic of letting an already structured GraphQLError pass through the catch block and wrapping everything else. In the real exam you can skip that helper. But if you reached for it yourself, you understand the pattern instead of copying it.",
    }),
  ],
};

/* ================================================================
   Exam
   ================================================================ */

const fedExam: Exam = {
  id: "graphql-federation",
  title: "GraphQL Federation Capstone",
  titleEn: "GraphQL Federation Capstone",
  shortTitle: "Federation 考试",
  shortTitleEn: "Federation exam",
  description:
    "对应 graphql-federation-practice 这个真实项目：一个 Apollo Federation subgraph（Node.js）加一个 Spring Boot REST 微服务，再加两道书面题。从「GraphQL 是什么」讲到能在空目录里重建整个 subgraph。",
  descriptionEn:
    "Built on the real project graphql-federation-practice: one Apollo Federation subgraph (Node.js), one Spring Boot REST microservice, and two written questions. It starts at what GraphQL is and ends with rebuilding the whole subgraph in an empty directory.",
  category: "后端",
  tests:
    "Task 1 考 GraphQL 与 Federation 的基本功：schema 的可空性怎么决定 resolver 的兜底、parent 从哪来、entity 与 @key、DataLoader 防 N+1、结构化错误与 correlation id。Task 2 考 REST 语义：状态码选对没有、异常该谁处理。两道书面题考的是「有没有在真实系统里想过延迟传播和生产配置」。贯穿全题的隐性考点是「能不能核对而不是猜」—— starter 里有三处人为埋雷。",
  testsEn:
    "Task 1 covers the basics of GraphQL and Federation: how a nullable field in the schema decides what the resolver returns as a fallback, where parent comes from, entity and @key, using DataLoader to avoid N+1, and structured errors with a correlation id. Task 2 covers what the REST rules require: whether the status codes are right, and who should handle the exceptions. The two written questions ask whether you have thought about how delay spreads and how a service is configured in production. One point runs through the whole exam: can you check instead of guess — the starter has three bugs planted on purpose.",
  sourceProjects: [
    {
      path: "graphql-federation-practice",
      role: "参考项目。本机实测基线：subgraph 6 failed / 4 passed，Java 5 run / 2 failures",
      roleEn: "Reference project. Measured baseline: subgraph 6 failed / 4 passed, Java 5 run / 2 failures",
    },
  ],
  prerequisites: ["foundations"],
  stack: [
    "Apollo Server 4",
    "@apollo/subgraph 2.7",
    "GraphQL 16",
    "DataLoader",
    "Node ESM + Jest",
    "Java 17",
    "Spring Boot 3.3",
    "Maven",
  ],
  status: "ready",
  checklist: [
    {
      task: "Task 1 · User.orders",
      covered: "完整讲解 + entity 数据流图 + 填空 + L3 自写 + 从零重写",
      tested: true,
    },
    {
      task: "Task 1 · Order.shippingInfo（要求用 DataLoader）",
      covered: "N+1 与 DataLoader 专章 + 填空 + Debug Lab",
      tested: true,
    },
    {
      task: "Task 1 · Query.orders",
      covered: "与 Query.order 对比讲解 + 填空 + L3 自写",
      tested: true,
    },
    {
      task: "Task 1 · Query.order（README 没提、也没有测试）",
      covered: "专门指出并完整实现，用上了给好的 ORDER_NOT_FOUND",
      tested: false,
    },
    {
      task: "埋雷 1 · createOrderLoader 调了不存在的 getOrderById",
      covered: "DataLoader 那节点出 + 独立 Debug Lab",
      tested: true,
    },
    {
      task: "埋雷 2 · createOrder 用了不存在的 orderAPI、签名错、缺 price",
      covered: "埋雷专章逐条拆解 + Debug Lab",
      tested: true,
    },
    {
      task: "埋雷 3 · catch 把 INVALID_INPUT 吞成 SERVICE_ERROR",
      covered: "贯穿四个 resolver 的模式讲解 + 独立 Debug Lab",
      tested: true,
    },
    {
      task: "Task 2 · 六个 Spring 端点（含 201 / 204 / 400 / 404）",
      covered: "Spring 基础 + 逐端点讲解 + 填空 + L3 自写 + 从零重写",
      tested: true,
    },
    {
      task: "Task 2 · 六个端点全 return null 也能过 3/5 测试",
      covered: "实测数据 + 手动 curl 自检清单 + Debug Lab",
      tested: true,
    },
    {
      task: "书面题 1 · User subgraph 高延迟的影响与缓存策略",
      covered: "传导路径分析 + 完整参考答案 + 答题结构模板",
      tested: false,
    },
    {
      task: "书面题 2 · application.properties 的生产隐患",
      covered: "六面排查清单 + 六个问题的完整参考答案 + L3 练习",
      tested: false,
    },
  ],
  modules: [gqlBasics, fedMentalModel, fedTask1, fedTask2, fedWritten, fedMastery],
  mockExams: [reviewsMock],
};

export default fedExam;
