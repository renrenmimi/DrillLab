// React 考试 —— 模块 6：五道高频变式题。
//
// 这五道**不来自源项目**，是 DrillLab 自出的，专门补三个源项目里没有的考点：
//   · useEffect 的清理函数（Timer）
//   · 异步取数的 loading / error / 竞态（Fetch）
//   · 递归组件与树形数据的不可变更新（评论树）
//   · Context：createContext / Provider / useContext + value 记忆化（主题切换）
// 外加一道 CRUD 变式（TodoList）巩固前面学的三件套。
//
// 所有参考答案与测试都在本机跑过：36 / 36 通过。
// 所以代码块用 tested()（页面显示「已跑通」），练习一律带 generated: true。

import type { Module } from "../types";
import { demo, tested } from "../helpers";

/* ================================================================
   参考答案（全部实测通过）
   ================================================================ */

const TODO_SOLUTION = `import React, { useState } from "react";
import type { Filter, Todo } from "../../types/Todo";

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  // 三个派生数据：都能从 todos 算出来，都不该做成 state
  const visible =
    filter === "all"
      ? todos
      : todos.filter((t) => (filter === "done" ? t.done : !t.done));
  const remaining = todos.filter((t) => !t.done).length;
  const allDone = todos.length > 0 && remaining === 0;

  const isInvalid = text.trim() === "";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isInvalid) return;
    setTodos((prev) => [...prev, { id: Date.now(), text: text.trim(), done: false }]);
    setText("");
  };

  // 就地翻转一条：map + 对象展开，不改原对象
  const toggle = (id: number) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  };

  const remove = (id: number) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  // 全选/全不选：以「当前是否已全部完成」为准整体反转
  const toggleAll = () => {
    const next = !allDone;
    setTodos((prev) => prev.map((t) => ({ ...t, done: next })));
  };

  const clearDone = () => {
    setTodos((prev) => prev.filter((t) => !t.done));
  };

  return (
    <div data-testid="todo-app">
      <form onSubmit={handleSubmit} data-testid="todo-form">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          data-testid="todo-input"
        />
        <button type="submit" disabled={isInvalid} data-testid="todo-submit">
          Add
        </button>
      </form>

      <div>
        <button onClick={toggleAll} data-testid="toggle-all">
          {allDone ? "Uncheck all" : "Check all"}
        </button>
        <button onClick={clearDone} data-testid="clear-done">
          Clear completed
        </button>
        <span data-testid="remaining">{remaining} left</span>
      </div>

      <div>
        {(["all", "active", "done"] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)} data-testid={\`filter-\${f}\`}
                  aria-pressed={filter === f}>
            {f}
          </button>
        ))}
      </div>

      <ul data-testid="todo-list">
        {visible.map((todo) => (
          <li key={todo.id} data-done={todo.done}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggle(todo.id)}
              aria-label={\`toggle \${todo.text}\`}
            />
            <span>{todo.text}</span>
            <button onClick={() => remove(todo.id)} aria-label={\`delete \${todo.text}\`}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoList;`;

const TIMER_SOLUTION = `import React, { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");
export const format = (totalSeconds: number) =>
  \`\${pad(Math.floor(totalSeconds / 60))}:\${pad(totalSeconds % 60)}\`;

const Timer: React.FC = () => {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;          // 没在跑就不建定时器

    const id = setInterval(() => {
      // 必须用函数式更新。这个回调是在 effect 那一次渲染里创建的，
      // 写成 setSeconds(seconds + 1) 会永远读到当时那个 seconds（过期闭包），
      // 于是秒数卡在 1 不动。
      setSeconds((s) => s + 1);
    }, 1000);

    // 清理函数：running 变化时、以及组件卸载时都会跑。
    // 少了它 -> 每次 running 变 true 就多一个 interval，秒数越跳越快；
    //          组件卸载后 interval 还在跑 -> 内存泄漏。
    return () => clearInterval(id);
  }, [running]);

  const reset = () => {
    setRunning(false);
    setSeconds(0);
  };

  return (
    <div data-testid="timer">
      <output data-testid="display">{format(seconds)}</output>
      <button onClick={() => setRunning((r) => !r)} data-testid="toggle">
        {running ? "Pause" : "Start"}
      </button>
      <button onClick={reset} data-testid="reset">
        Reset
      </button>
    </div>
  );
};

export default Timer;`;

const FETCH_SOLUTION = `import React, { useEffect, useState } from "react";
import type { User } from "../../types/User";

const UserCard: React.FC<{ userId: number }> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ignore 是「本次请求还算不算数」的开关。
    // userId 一变，旧 effect 的清理函数先把它置 true，
    // 于是旧请求即使晚回来也不会覆盖新数据 —— 这就是竞态的解法。
    let ignore = false;
    const controller = new AbortController();

    setLoading(true);
    setError(null);
    setUser(null);

    (async () => {
      try {
        const res = await fetch(\`/api/users/\${userId}\`, { signal: controller.signal });

        // fetch 只在网络层失败时 reject。
        // 404 / 500 是「成功拿到一个失败响应」，必须自己检查 res.ok，
        // 否则会把错误页当数据用。
        if (!res.ok) throw new Error(\`HTTP \${res.status}\`);

        const data: User = await res.json();
        if (!ignore) setUser(data);
      } catch (e) {
        // 主动取消不是错误，别展示给用户
        const err = e as Error;
        if (!ignore && err.name !== "AbortError") setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
      controller.abort();   // 顺手掐掉在途请求，省流量
    };
  }, [userId]);

  if (loading) return <p data-testid="loading">Loading…</p>;
  if (error) return <p data-testid="error">出错了：{error}</p>;
  if (!user) return <p data-testid="empty">没有数据</p>;

  return (
    <article data-testid="user">
      <h2 data-testid="user-name">{user.name}</h2>
      <p data-testid="user-email">{user.email}</p>
    </article>
  );
};

export default UserCard;`;

const TREE_HELPERS = `import type { Comment } from "../../types/Comment";

/** 递归统计总条数（含所有层级的回复） */
export function countComments(nodes: Comment[]): number {
  return nodes.reduce((sum, n) => sum + 1 + countComments(n.replies), 0);
}

/**
 * 往树里某个节点下面加一条回复，返回全新的树。
 *
 * 关键点：从根到目标那条路径上的每个节点都要造新对象，
 * 但**不要**深拷贝整棵树 —— 没被碰到的分支应该复用原来的对象。
 */
export function addReply(nodes: Comment[], parentId: number, reply: Comment): Comment[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, replies: [...node.replies, reply] };
    }
    // 目标可能在更深处，继续往下找
    return { ...node, replies: addReply(node.replies, parentId, reply) };
  });
}`;

const TREE_SOLUTION = `interface NodeProps {
  comment: Comment;
  depth: number;
  onReply: (parentId: number, text: string) => void;
}

const CommentNode: React.FC<NodeProps> = ({ comment, depth, onReply }) => {
  const [open, setOpen] = useState(true);
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState("");

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (text.trim() === "") return;
    onReply(comment.id, text.trim());
    setText("");
    setReplying(false);
  };

  return (
    <li
      data-testid={\`comment-\${comment.id}\`}
      data-depth={depth}
      style={{ marginLeft: depth * 16 }}
    >
      <span data-testid={\`author-\${comment.id}\`}>{comment.author}</span>
      <span data-testid={\`body-\${comment.id}\`}>{comment.body}</span>

      <button onClick={() => setReplying((v) => !v)} aria-label={\`reply to \${comment.author}\`}>
        Reply
      </button>

      {comment.replies.length > 0 && (
        <button onClick={() => setOpen((v) => !v)} aria-label={\`toggle \${comment.author}\`}>
          {open ? \`Hide \${comment.replies.length}\` : \`Show \${comment.replies.length}\`}
        </button>
      )}

      {replying && (
        <form onSubmit={submit}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            data-testid={\`reply-input-\${comment.id}\`}
          />
          <button type="submit" data-testid={\`reply-submit-\${comment.id}\`}>Send</button>
        </form>
      )}

      {/* 递归：自己渲染自己。
          终止条件不用写 if —— replies 为空时 map 什么都不产出，递归自然停。 */}
      {open && comment.replies.length > 0 && (
        <ul>
          {comment.replies.map((child) => (
            <CommentNode key={child.id} comment={child} depth={depth + 1} onReply={onReply} />
          ))}
        </ul>
      )}
    </li>
  );
};

const CommentTree: React.FC<{ initial: Comment[] }> = ({ initial }) => {
  const [comments, setComments] = useState<Comment[]>(initial);

  const handleReply = (parentId: number, text: string) => {
    const reply: Comment = {
      id: Date.now() + Math.random(),
      author: "我",
      body: text,
      replies: [],
    };
    setComments((prev) => addReply(prev, parentId, reply));
  };

  return (
    <div data-testid="comment-tree">
      <span data-testid="total">{countComments(comments)}</span>
      <ul>
        {comments.map((c) => (
          <CommentNode key={c.id} comment={c} depth={0} onReply={handleReply} />
        ))}
      </ul>
    </div>
  );
};

export default CommentTree;`;

/* ---------------- 主题切换（Context）：本机跑出 8/8 的那几个文件 ---------------- */

const THEME_CONTEXT = `import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Theme = "light" | "dark";

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

// 默认值给 undefined，配合下面 useTheme 里的守卫：
// 「忘了套 Provider」会立刻炸，而不是静默用一个假的默认主题。
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  // 函数式更新：一次事件里连调两次也能正确地翻回来
  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  // value 必须记忆化。不然每次 Provider 渲染都是一个新对象，
  // 所有 useTheme() 的组件都会重渲染 —— 哪怕 theme 根本没变。
  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme 必须在 <ThemeProvider> 里面用");
  return ctx;
}`;

const THEME_BUTTON = `import React from "react";
import { useTheme } from "../../context/ThemeContext";

const ThemeToggleButton: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme} data-testid="theme-toggle">
      {theme === "light" ? "Switch to Dark" : "Switch to Light"}
    </button>
  );
};

export default ThemeToggleButton;`;

const THEME_CARD = `import React from "react";
import type { ReactNode } from "react";
import { useTheme } from "../../context/ThemeContext";

const ThemedCard: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const { theme } = useTheme();

  return (
    <div
      data-testid="themed-card"
      data-theme={theme}
      style={{
        background: theme === "dark" ? "#222" : "#fff",
        color: theme === "dark" ? "#eee" : "#222",
        border: "1px solid #ccc",
        padding: 16,
      }}
    >
      <span data-testid="theme-name">{theme}</span>
      {children}
    </div>
  );
};

export default ThemedCard;`;

const THEME_APP = `import React from "react";
import { ThemeProvider } from "../../context/ThemeContext";
import ThemeToggleButton from "../ThemeToggleButton";
import ThemedCard from "../ThemedCard";

// App 整个套在 Provider 里 —— 只有 Provider 的子树才能 useTheme()
const ThemeApp: React.FC = () => (
  <ThemeProvider>
    <ThemeToggleButton />
    <ThemedCard>
      <p>卡片内容</p>
    </ThemedCard>
  </ThemeProvider>
);

export default ThemeApp;`;

const THEME_TEST = `import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import ThemeApp from "./components/ThemeApp";
import ThemedCard from "./components/ThemedCard";
import ThemeToggleButton from "./components/ThemeToggleButton";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

test("默认是 light，按钮说 Switch to Dark", () => {
  render(<ThemeApp />);
  expect(screen.getByTestId("theme-name")).toHaveTextContent("light");
  expect(screen.getByTestId("theme-toggle")).toHaveTextContent("Switch to Dark");
  expect(screen.getByTestId("themed-card")).toHaveStyle({ backgroundColor: "#fff" });
});

test("点一下变 dark：按钮文字和卡片底色一起变", async () => {
  render(<ThemeApp />);
  await userEvent.click(screen.getByTestId("theme-toggle"));

  expect(screen.getByTestId("theme-name")).toHaveTextContent("dark");
  expect(screen.getByTestId("theme-toggle")).toHaveTextContent("Switch to Light");
  expect(screen.getByTestId("themed-card")).toHaveStyle({ backgroundColor: "#222" });
});

test("再点一下切回 light", async () => {
  render(<ThemeApp />);
  await userEvent.click(screen.getByTestId("theme-toggle"));
  await userEvent.click(screen.getByTestId("theme-toggle"));

  expect(screen.getByTestId("theme-name")).toHaveTextContent("light");
  expect(screen.getByTestId("themed-card")).toHaveStyle({ backgroundColor: "#fff" });
});

test("同一个 Provider 下的多个消费者一起变（这才是 Context 的意义）", async () => {
  render(
    <ThemeProvider>
      <ThemeToggleButton />
      <div data-testid="a"><ThemedCard /></div>
      <div data-testid="b"><ThemedCard /></div>
    </ThemeProvider>,
  );

  const names = () => screen.getAllByTestId("theme-name").map((n) => n.textContent);
  expect(names()).toEqual(["light", "light"]);

  await userEvent.click(screen.getByTestId("theme-toggle"));
  expect(names()).toEqual(["dark", "dark"]);
});

test("没套 Provider 就用 useTheme()，必须立刻报错", () => {
  // 期望的报错会被 React 打到 console.error，这里静音免得刷屏
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  expect(() => render(<ThemedCard />)).toThrow("useTheme 必须在 <ThemeProvider> 里面用");
  spy.mockRestore();
});

test("toggleTheme 是稳定引用：theme 变了它也不变", async () => {
  const seen: (() => void)[] = [];
  const Probe = () => {
    const { toggleTheme } = useTheme();
    seen.push(toggleTheme);
    return <button onClick={toggleTheme} data-testid="probe">go</button>;
  };

  render(<ThemeProvider><Probe /></ThemeProvider>);
  await userEvent.click(screen.getByTestId("probe"));

  expect(seen.length).toBeGreaterThan(1);          // 确实重渲染过
  expect(new Set(seen).size).toBe(1);              // 但 toggleTheme 始终是同一个函数
});

test("theme 没变时 context value 不换新对象（useMemo 生效）", () => {
  const values: unknown[] = [];
  const Probe = () => {
    values.push(useTheme());
    return null;
  };

  const { rerender } = render(<ThemeProvider><Probe /></ThemeProvider>);
  rerender(<ThemeProvider><Probe /></ThemeProvider>);   // 父层重渲染，但 theme 没动

  expect(values.length).toBeGreaterThan(1);
  expect(new Set(values).size).toBe(1);
});

test("一次事件里连调两次 toggleTheme，应该原样回来（函数式更新的证据）", async () => {
  const Twice = () => {
    const { toggleTheme } = useTheme();
    return (
      <button
        data-testid="twice"
        onClick={() => {
          toggleTheme();
          toggleTheme();
        }}
      >
        go
      </button>
    );
  };

  render(
    <ThemeProvider>
      <Twice />
      <ThemedCard />
    </ThemeProvider>,
  );

  await userEvent.click(screen.getByTestId("twice"));
  // 两次翻转 = 回到原点。若写成 setTheme(theme === "light" ? ... )，
  // 两次都读到同一个旧 theme，结果会停在 dark
  expect(screen.getByTestId("theme-name")).toHaveTextContent("light");
});`;

/* ---------------- 配套测试（就是本机跑出 36/36 的那五个文件） ---------------- */

const TODO_TEST = `import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TodoList from "./components/TodoList";

const add = async (text: string) => {
  await userEvent.type(screen.getByTestId("todo-input"), text);
  await userEvent.click(screen.getByTestId("todo-submit"));
};

test("adds a todo and clears the input", async () => {
  render(<TodoList />);
  await add("买牛奶");
  expect(screen.getByTestId("todo-list")).toHaveTextContent("买牛奶");
  expect(screen.getByTestId("todo-input")).toHaveValue("");
});

test("submit disabled when input is only whitespace", async () => {
  render(<TodoList />);
  expect(screen.getByTestId("todo-submit")).toBeDisabled();
  await userEvent.type(screen.getByTestId("todo-input"), "   ");
  expect(screen.getByTestId("todo-submit")).toBeDisabled();
});

test("toggles one todo without touching the others", async () => {
  render(<TodoList />);
  await add("A");
  await add("B");
  await userEvent.click(screen.getByLabelText("toggle A"));

  const items = screen.getByTestId("todo-list").querySelectorAll("li");
  expect(items[0].getAttribute("data-done")).toBe("true");
  expect(items[1].getAttribute("data-done")).toBe("false");
});

test("remaining count is derived, not stored", async () => {
  render(<TodoList />);
  await add("A");
  await add("B");
  expect(screen.getByTestId("remaining")).toHaveTextContent("2 left");
  await userEvent.click(screen.getByLabelText("toggle A"));
  expect(screen.getByTestId("remaining")).toHaveTextContent("1 left");
});

test("filters without losing data", async () => {
  render(<TodoList />);
  await add("A");
  await add("B");
  await userEvent.click(screen.getByLabelText("toggle A"));

  await userEvent.click(screen.getByTestId("filter-active"));
  expect(screen.getByTestId("todo-list")).not.toHaveTextContent("A");
  expect(screen.getByTestId("todo-list")).toHaveTextContent("B");

  await userEvent.click(screen.getByTestId("filter-done"));
  expect(screen.getByTestId("todo-list")).toHaveTextContent("A");
  expect(screen.getByTestId("todo-list")).not.toHaveTextContent("B");

  // 切回 all，两条都还在 —— 筛选不能动底层数据
  await userEvent.click(screen.getByTestId("filter-all"));
  expect(screen.getByTestId("todo-list")).toHaveTextContent("A");
  expect(screen.getByTestId("todo-list")).toHaveTextContent("B");
});

test("toggle all then uncheck all", async () => {
  render(<TodoList />);
  await add("A");
  await add("B");
  await userEvent.click(screen.getByTestId("toggle-all"));
  expect(screen.getByTestId("remaining")).toHaveTextContent("0 left");
  await userEvent.click(screen.getByTestId("toggle-all"));
  expect(screen.getByTestId("remaining")).toHaveTextContent("2 left");
});

test("clear completed removes only done todos", async () => {
  render(<TodoList />);
  await add("A");
  await add("B");
  await userEvent.click(screen.getByLabelText("toggle A"));
  await userEvent.click(screen.getByTestId("clear-done"));

  expect(screen.getByTestId("todo-list")).not.toHaveTextContent("A");
  expect(screen.getByTestId("todo-list")).toHaveTextContent("B");
});`;

const TIMER_TEST = `import { act, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import Timer, { format } from "./components/Timer";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

test("formats seconds as mm:ss", () => {
  expect(format(0)).toBe("00:00");
  expect(format(9)).toBe("00:09");
  expect(format(65)).toBe("01:05");
  expect(format(600)).toBe("10:00");
});

test("does not tick before start", () => {
  render(<Timer />);
  advance(5000);
  expect(screen.getByTestId("display")).toHaveTextContent("00:00");
});

test("counts up once per second while running", () => {
  render(<Timer />);
  fireEvent.click(screen.getByTestId("toggle"));
  advance(3000);
  expect(screen.getByTestId("display")).toHaveTextContent("00:03");
});

test("pause stops the clock and keeps the value", () => {
  render(<Timer />);
  fireEvent.click(screen.getByTestId("toggle"));
  advance(2000);
  fireEvent.click(screen.getByTestId("toggle"));
  advance(5000);
  expect(screen.getByTestId("display")).toHaveTextContent("00:02");
});

test("start/pause many times does not speed up（清理函数生效的证据）", () => {
  render(<Timer />);
  for (let i = 0; i < 4; i++) {
    fireEvent.click(screen.getByTestId("toggle")); // start
    advance(1000);
    fireEvent.click(screen.getByTestId("toggle")); // pause
  }
  // 四轮每轮 1 秒 -> 正好 4 秒。若忘了 clearInterval，会变成 1+2+3+4=10 秒
  expect(screen.getByTestId("display")).toHaveTextContent("00:04");
});

test("reset stops and zeroes", () => {
  render(<Timer />);
  fireEvent.click(screen.getByTestId("toggle"));
  advance(3000);
  fireEvent.click(screen.getByTestId("reset"));
  expect(screen.getByTestId("display")).toHaveTextContent("00:00");
  expect(screen.getByTestId("toggle")).toHaveTextContent("Start");
  advance(3000);
  expect(screen.getByTestId("display")).toHaveTextContent("00:00");
});

test("crosses the minute boundary", () => {
  render(<Timer />);
  fireEvent.click(screen.getByTestId("toggle"));
  advance(61000);
  expect(screen.getByTestId("display")).toHaveTextContent("01:01");
});

test("unmount clears the interval（不再有活着的定时器）", () => {
  const { unmount } = render(<Timer />);
  fireEvent.click(screen.getByTestId("toggle"));
  advance(1000);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});`;

const FETCH_TEST = `import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import UserCard from "./components/UserCard";

type Deferred<T> = { promise: Promise<T>; resolve: (v: T) => void; reject: (e: unknown) => void };
function deferred<T>(): Deferred<T> {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

const okRes = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

afterEach(() => { vi.unstubAllGlobals(); });

test("shows loading first, then the data", async () => {
  const d = deferred<unknown>();
  vi.stubGlobal("fetch", vi.fn(() => d.promise));

  render(<UserCard userId={1} />);
  expect(screen.getByTestId("loading")).toBeInTheDocument();

  d.resolve(okRes({ id: 1, name: "张三", email: "z@example.com" }));
  expect(await screen.findByTestId("user-name")).toHaveTextContent("张三");
  expect(screen.getByTestId("user-email")).toHaveTextContent("z@example.com");
  expect(screen.queryByTestId("loading")).toBeNull();
});

test("treats a 404 as an error（fetch 不会因为 404 而 reject）", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) })));

  render(<UserCard userId={9} />);
  expect(await screen.findByTestId("error")).toHaveTextContent("HTTP 404");
});

test("shows an error when the network fails", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("Failed to fetch"); }));

  render(<UserCard userId={1} />);
  expect(await screen.findByTestId("error")).toHaveTextContent("Failed to fetch");
});

test("refetches when userId changes", async () => {
  const spy = vi.fn(async (url: string) =>
    okRes({ id: Number(url.split("/").pop()), name: \`用户\${url.split("/").pop()}\`, email: "x@y.z" }),
  );
  vi.stubGlobal("fetch", spy);

  const { rerender } = render(<UserCard userId={1} />);
  expect(await screen.findByTestId("user-name")).toHaveTextContent("用户1");

  rerender(<UserCard userId={2} />);
  expect(await screen.findByTestId("user-name")).toHaveTextContent("用户2");
  expect(spy).toHaveBeenCalledTimes(2);
});

test("a slow stale response must not overwrite the newer one（竞态）", async () => {
  const slow = deferred<unknown>();   // userId 1，很慢
  const fast = deferred<unknown>();   // userId 2，很快
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => (url.endsWith("/1") ? slow.promise : fast.promise)),
  );

  const { rerender } = render(<UserCard userId={1} />);
  rerender(<UserCard userId={2} />);          // 用户飞快切到了 2

  fast.resolve(okRes({ id: 2, name: "用户2", email: "b@x.z" }));
  expect(await screen.findByTestId("user-name")).toHaveTextContent("用户2");

  // 现在旧请求才回来 —— 它必须被忽略
  slow.resolve(okRes({ id: 1, name: "用户1", email: "a@x.z" }));
  await waitFor(() => expect(screen.getByTestId("user-name")).toHaveTextContent("用户2"));
  expect(screen.getByTestId("user-name")).not.toHaveTextContent("用户1");
});

test("aborts the in-flight request on unmount", async () => {
  const signals: AbortSignal[] = [];
  vi.stubGlobal("fetch", vi.fn((_url: string, init: RequestInit) => {
    signals.push(init.signal as AbortSignal);
    return new Promise(() => {});   // 永不 settle
  }));

  const { unmount } = render(<UserCard userId={1} />);
  expect(signals[0].aborted).toBe(false);
  unmount();
  expect(signals[0].aborted).toBe(true);
});`;

const TREE_TEST = `import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import CommentTree, { addReply, countComments } from "./components/CommentTree";
import type { Comment } from "./types/Comment";

/** 三层嵌套：1 → 2 → 4，外加同级的 3 和 5 */
const tree = (): Comment[] => [
  {
    id: 1, author: "A", body: "顶层", replies: [
      { id: 2, author: "B", body: "二层", replies: [
        { id: 4, author: "D", body: "三层", replies: [] },
      ]},
      { id: 3, author: "C", body: "二层旁边", replies: [] },
    ],
  },
  { id: 5, author: "E", body: "另一个顶层", replies: [] },
];

/** 深冻结：组件若直接改原树，会在严格模式下抛错 */
function deepFreeze<T>(o: T): T {
  Object.freeze(o);
  Object.values(o as Record<string, unknown>).forEach((v) => {
    if (v && typeof v === "object" && !Object.isFrozen(v)) deepFreeze(v);
  });
  return o;
}

test("countComments 递归数到所有层级", () => {
  expect(countComments(tree())).toBe(5);
  expect(countComments([])).toBe(0);
});

test("addReply 挂到深层节点，且不改原树", () => {
  const original = deepFreeze(tree());
  const next = addReply(original, 4, { id: 99, author: "F", body: "四层", replies: [] });

  // 新树里挂上了
  expect(countComments(next)).toBe(6);
  expect(next[0].replies[0].replies[0].replies[0].id).toBe(99);
  // 原树没动
  expect(countComments(original)).toBe(5);
  expect(original[0].replies[0].replies[0].replies).toHaveLength(0);
});

test("addReply 只重建路径上的节点，旁边的分支保持同一个引用", () => {
  const original = tree();
  const next = addReply(original, 2, { id: 88, author: "F", body: "x", replies: [] });

  // 路径上的必须是新对象
  expect(next).not.toBe(original);
  expect(next[0]).not.toBe(original[0]);
  expect(next[0].replies[0]).not.toBe(original[0].replies[0]);
  // 没被碰到的叶子内容一致
  expect(next[1].body).toBe(original[1].body);
});

test("渲染出三层，并按深度缩进", () => {
  render(<CommentTree initial={tree()} />);
  expect(screen.getByTestId("comment-1").getAttribute("data-depth")).toBe("0");
  expect(screen.getByTestId("comment-2").getAttribute("data-depth")).toBe("1");
  expect(screen.getByTestId("comment-4").getAttribute("data-depth")).toBe("2");
  expect(screen.getByTestId("total")).toHaveTextContent("5");
});

test("空 replies 就是递归的终止条件（叶子不再往下渲染）", () => {
  render(<CommentTree initial={[{ id: 7, author: "Z", body: "孤零零", replies: [] }]} />);
  expect(screen.getByTestId("comment-7")).toBeInTheDocument();
  // 叶子没有折叠按钮，因为没有子节点
  expect(screen.queryByLabelText("toggle Z")).toBeNull();
});

test("给三层的评论再回复，落在正确的位置", async () => {
  render(<CommentTree initial={tree()} />);

  await userEvent.click(screen.getByLabelText("reply to D"));
  await userEvent.type(screen.getByTestId("reply-input-4"), "第四层");
  await userEvent.click(screen.getByTestId("reply-submit-4"));

  expect(screen.getByTestId("total")).toHaveTextContent("6");
  // 新节点的深度是 3，且在 comment-4 的子树里
  const added = screen.getByText("第四层").closest("li")!;
  expect(added.getAttribute("data-depth")).toBe("3");
  expect(screen.getByTestId("comment-4").contains(added)).toBe(true);
});

test("折叠只藏自己的子树，不影响别人", async () => {
  render(<CommentTree initial={tree()} />);
  await userEvent.click(screen.getByLabelText("toggle A"));

  expect(screen.queryByTestId("comment-2")).toBeNull();
  expect(screen.queryByTestId("comment-4")).toBeNull();
  expect(screen.getByTestId("comment-1")).toBeInTheDocument();
  expect(screen.getByTestId("comment-5")).toBeInTheDocument();  // 另一个顶层还在
});`;

export const reactVariants: Module = {
  id: "react-variants",
  stage: "React · 第 5 部分",
  title: "五道高频变式题",
  titleEn: "Five variations that come up often",
  summary:
    "TodoList、计时器、fetch 取数、递归评论树、主题切换（Context）。第一道是 Q1 的变式，后四道补的是源项目里没有但同类考试常考的东西：useEffect 清理函数、异步三态与竞态、递归组件与树形不可变更新、Context 与 value 记忆化。五道题的参考答案与测试都在本机跑过（36 / 36）。",
  summaryEn:
    "A TodoList, a timer, fetching data, a recursive comment tree, and theme switching with Context. The first is a variation on Q1. The other four cover what the source project does not have but exams like this often ask for: the useEffect cleanup function, the three states of an async request and the race between two of them, components that render themselves and updating tree data without changing the original, and Context with its value wrapped in useMemo. Every reference answer and test here was run on a real machine (36 / 36).",
  lessons: [
    /* ================================================================
       6.1 TodoList
       ================================================================ */
    {
      id: "r-var-todo",
      title: "变式一 · Todo List",
      titleEn: "Variation 1 · Todo List",
      blurb: "和 Notes Manager 同一套骨架，多了一个布尔字段、一个筛选、两个批量操作。",
      blurbEn:
        "The same skeleton as the Notes Manager, plus one boolean field, one filter, and two bulk actions.",
      minutes: 14,
      objectives: [
        "用 map + 对象展开就地翻转一条数据的布尔字段",
        "把「剩余几项」「是否全部完成」「筛选后的列表」都写成派生数据",
        "实现全选 / 取消全选和「清除已完成」",
        "说清筛选态下的删除为什么必须作用于原始数据",
      ],
      objectivesEn: [
        "Flip the boolean field on one item using map plus object spread",
        "Write how many are left, whether everything is done, and the filtered list as derived values",
        "Implement select all / clear all, and clear completed",
        "Explain why a delete under an active filter must act on the original data",
      ],
      whyForAssessment:
        "Todo List 是 React 面试与 assessment 出现频率最高的一道题。它考的东西和真实 Q1 完全重合（受控输入、三种不可变更新、派生数据），只是多了 toggle 和 filter 两个变式。做完这道题，Q1 那类题就不会再有陌生感。",
      whyForAssessmentEn:
        "The Todo List is the question that shows up most often in React interviews and exams. What it tests overlaps completely with the real Q1: controlled inputs, the three ways to update data without changing the original, and derived values. It only adds two extra moves, toggle and filter. Once you have done this one, Q1 style questions no longer feel new.",
      concepts: [
        {
          id: "shape",
          heading: "数据形状：只比 Note 多一个布尔字段",
          headingEn: "The shape of the data: one boolean field more than Note",
          lede: "先看类型，其余都是从它推出来的。",
          ledeEn: "Start with the type. Everything else follows from it.",
          body: (
            <>
              <p>
                和 <code>Note</code> 对比一下：<code>Todo</code> 多了一个
                <code>done: boolean</code>，于是多出「翻转」这个操作；
                <code>Filter</code> 是个字面量联合，用来存筛选条件。
              </p>
              <p>
                <strong>注意 <code>Filter</code> 不属于任何一条 todo</strong> ——
                它是「界面当前怎么看这份数据」，所以它是独立的一个 state，
                而不是 todo 上的字段。这个区分在很多人那里是模糊的。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Put it next to <code>Note</code>: <code>Todo</code> adds exactly one
                field, <code>done: boolean</code>, and that one field buys you a new
                operation — toggling. <code>Filter</code> is a literal union that holds
                the current filter.
              </p>
              <p>
                <strong>Notice that <code>Filter</code> belongs to no single todo</strong> —
                it is &ldquo;how the UI is looking at this data right now&rdquo;, so it is
                its own piece of state, not a field on a todo. Plenty of people are fuzzy
                about that line.
              </p>
            </>
          ),
          code: [
            tested(
              "ts",
              `export type Filter = "all" | "active" | "done";

export type Todo = {
  id: number;
  text: string;
  done: boolean;
};`,
              { filename: "src/types/Todo.ts" },
            ),
          ],
        },
        {
          id: "toggle",
          heading: "翻转一条：map + 对象展开",
          headingEn: "Flipping one item: map plus object spread",
          lede: "这是三件套之外的第四个动作，但底层还是 map。",
          ledeEn: "This is a fourth action beyond the usual three, but underneath it is still map.",
          body: (
            <>
              <p>
                Q1 的「就地更新」是<strong>整条替换</strong>
                （<code>note.id === x ? submittedNote : note</code>）。
                这里只想改一个字段，所以用<strong>对象展开 + 覆盖</strong>：
              </p>
              <p>
                <code>{"{ ...t, done: !t.done }"}</code> 造了一个新对象：
                旧字段全部照抄，只把 <code>done</code> 换成反过来的值。
              </p>
              <p>
                <strong>为什么不能直接 <code>t.done = !t.done</code>?</strong>
                那是在改原对象。虽然数组是新的（map 返回新数组），
                但里面那个 todo 对象还是同一个引用 ——
                如果哪天你给列表项加了 <code>React.memo</code>，
                它会认为「props 没变」而不重渲染，于是勾选框不动。
                <strong>不可变更新要一路到底，不能只做外层。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The &ldquo;update in place&rdquo; in Q1 replaced{" "}
                <strong>the whole item</strong>{" "}
                (<code>note.id === x ? submittedNote : note</code>). Here you only want to
                change one field, so you use{" "}
                <strong>object spread plus an override</strong>:
              </p>
              <p>
                <code>{"{ ...t, done: !t.done }"}</code> builds a new object: copy every
                old field, then swap <code>done</code> for its opposite.
              </p>
              <p>
                <strong>Why not just <code>t.done = !t.done</code>?</strong> Because that
                mutates the original object. The array is new (map returns a new array),
                but the todo object inside is still the same reference — the day you wrap
                list items in <code>React.memo</code>, it decides &ldquo;props did not
                change&rdquo;, skips the re-render, and the checkbox stops moving.{" "}
                <strong>Immutable updates have to go all the way down, not just the outer
                layer.</strong>
              </p>
            </>
          ),
          code: [
            tested(
              "tsx",
              `// 翻转一条
setTodos((prev) =>
  prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
);

// 对比 Q1 的整条替换
setNotes((prev) =>
  prev.map((n) => (n.id === next.id ? next : n)),
);`,
              {
                filename: "两种 map 更新",
                filenameEn: "Two kinds of map update",
                codeEn: `// Toggle one item
setTodos((prev) =>
  prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
);

// Compare with the whole-item replace of Q1
setNotes((prev) =>
  prev.map((n) => (n.id === next.id ? next : n)),
);`,
              },
            ),
            demo(
              "tsx",
              `// ✗ 数组是新的，但对象被就地改了
setTodos((prev) =>
  prev.map((t) => {
    if (t.id === id) t.done = !t.done;   // 改的是原对象
    return t;
  }),
);`,
              {
                filename: "看起来像不可变，其实不是",
                filenameEn: "It looks immutable, and it is not",
                codeEn: `// ✗ The array is new, but the object was changed in place
setTodos((prev) =>
  prev.map((t) => {
    if (t.id === id) t.done = !t.done;   // this changes the original object
    return t;
  }),
);`,
              },
            ),
          ],
        },
        {
          id: "derived",
          heading: "三个派生数据，一个 state 都不加",
          headingEn: "Three derived values, and not one new state",
          body: (
            <>
              <p>
                这道题最容易过度设计的地方是「剩余几项」和「筛选后的列表」——
                很多人会为它们各开一个 <code>useState</code>，
                再用 <code>useEffect</code> 同步。<strong>全都不需要。</strong>
              </p>
              <p>
                <code>visible</code> / <code>remaining</code> /
                <code>allDone</code> 三个值都能从 <code>todos</code> 和
                <code>filter</code> 当场算出来，每次渲染重算，永远不会不一致。
              </p>
              <p>
                <strong>关键陷阱：所有写操作都要作用于 <code>todos</code>，
                不是 <code>visible</code>。</strong>
                筛选到「已完成」时点删除，如果你写
                <code>setTodos(visible.filter(...))</code>，
                那些被筛掉的未完成项会全部消失。这一条在模拟考 A 里也考过，
                是同一个坑。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The easiest place to over-engineer this question is &ldquo;how many
                left&rdquo; and &ldquo;the filtered list&rdquo; — a lot of people give each
                one its own <code>useState</code> and then sync them with a{" "}
                <code>useEffect</code>. <strong>None of that is needed.</strong>
              </p>
              <p>
                <code>visible</code> / <code>remaining</code> / <code>allDone</code> can
                all be computed on the spot from <code>todos</code> and{" "}
                <code>filter</code>, recomputed on every render, so they can never fall out
                of sync.
              </p>
              <p>
                <strong>The trap that matters: every write goes through{" "}
                <code>todos</code>, not <code>visible</code>.</strong> Filter down to
                &ldquo;done&rdquo; and hit delete, and if you wrote{" "}
                <code>setTodos(visible.filter(...))</code>, every unfinished item that got
                filtered out disappears. Mock exam A tests the same trap.
              </p>
            </>
          ),
          code: [
            tested(
              "tsx",
              `const visible =
  filter === "all"
    ? todos
    : todos.filter((t) => (filter === "done" ? t.done : !t.done));
const remaining = todos.filter((t) => !t.done).length;
const allDone = todos.length > 0 && remaining === 0;

// 写操作一律作用于 todos
const remove = (id: number) => {
  setTodos((prev) => prev.filter((t) => t.id !== id));
};`,
              {
                filename: "派生数据",
                filenameEn: "Derived values",
                codeEn: `const visible =
  filter === "all"
    ? todos
    : todos.filter((t) => (filter === "done" ? t.done : !t.done));
const remaining = todos.filter((t) => !t.done).length;
const allDone = todos.length > 0 && remaining === 0;

// Every write acts on todos
const remove = (id: number) => {
  setTodos((prev) => prev.filter((t) => t.id !== id));
};`,
                explanation:
                  "allDone 里那个 todos.length > 0 不能省 —— 空列表时 remaining 也是 0，不判断的话按钮一上来就显示「Uncheck all」。",
                explanationEn:
                  "The todos.length > 0 inside allDone is not optional: with an empty list remaining is also 0, and without that check the button says Uncheck all from the very first render.",
              },
            ),
          ],
        },
        {
          id: "batch",
          heading: "两个批量操作",
          headingEn: "The two bulk actions",
          body: (
            <>
              <p>
                <strong>全选 / 取消全选</strong>的正确语义是
                「以当前是否已全部完成为准，整体反转」——
                而不是「每一条各自翻转」。后者在混合状态下会得到一半勾一半不勾，
                不符合用户预期。
              </p>
              <p>
                <strong>清除已完成</strong>就是一次 filter，
                和删除单条是同一个动作，只是条件不同。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>Check all / uncheck all</strong> means &ldquo;flip everything to one
                target value, decided by whether they are all done right now&rdquo; — not
                &ldquo;flip each item on its own&rdquo;. The second reading leaves a mixed
                list half checked and half unchecked, which is not what the user expects.
              </p>
              <p>
                <strong>Clear completed</strong> is one filter call. Same action as deleting
                a single item, different condition.
              </p>
            </>
          ),
          code: [
            tested(
              "tsx",
              `const toggleAll = () => {
  const next = !allDone;                                  // 先定一个统一的目标值
  setTodos((prev) => prev.map((t) => ({ ...t, done: next })));
};

const clearDone = () => {
  setTodos((prev) => prev.filter((t) => !t.done));
};`,
              {
                filename: "批量操作",
                filenameEn: "The bulk actions",
                codeEn: `const toggleAll = () => {
  const next = !allDone;                                  // decide one shared target value first
  setTodos((prev) => prev.map((t) => ({ ...t, done: next })));
};

const clearDone = () => {
  setTodos((prev) => prev.filter((t) => !t.done));
};`,
              },
            ),
            demo(
              "tsx",
              `// ✗ 每条各自翻转 —— 混合状态下变成「反选」，不是「全选」
setTodos((prev) => prev.map((t) => ({ ...t, done: !t.done })));`,
              {
                codeEn: `// ✗ Toggling each item on its own — with a mixed list this inverts the selection instead of selecting all
setTodos((prev) => prev.map((t) => ({ ...t, done: !t.done })));`,
              },
            ),
          ],
        },
        {
          id: "full",
          heading: "完整答案",
          headingEn: "The complete answer",
          lede: "7 个测试全过。",
          ledeEn: "All 7 tests pass.",
          body: (
            <>
              <p>
                注意 <code>data-testid</code> 用了模板字符串生成
                （<code>{"`filter-${f}`"}</code>）—— 三个筛选按钮共用一段渲染代码，
                这是列表渲染的常见写法。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Note that <code>data-testid</code> is generated with a template string
                (<code>{"`filter-${f}`"}</code>) — the three filter buttons share one piece
                of render code, which is the normal way to render a list.
              </p>
            </>
          ),
          code: [
            tested("tsx", TODO_SOLUTION, {
              filename: "src/components/TodoList/index.tsx（实测 7/7 通过）",
              collapsible: true,
            }),
          ],
        },
        {
          id: "verify",
          heading: "怎么验证",
          headingEn: "How to check it",
          lede: "这就是跑出 7/7 的那个测试文件，原样贴在这里。",
          ledeEn: "This is the test file that produced 7 of 7, pasted exactly as it is.",
          body: (
            <>
              <p>
                想真正练这道题，就在一个空的 Vite + React + TS 项目里
                （react-notes-app 的脚手架直接能用）新建
                <code>src/types/Todo.ts</code> 和
                <code>src/components/TodoList/index.tsx</code>，
                把下面这个测试文件放到 <code>src/TodoList.test.tsx</code>，
                然后自己把组件写出来。
              </p>
              <p>
                注意测试是按 <code>data-testid</code> 和
                <code>aria-label</code> 找元素的 ——
                <strong>这些名字必须和测试对上</strong>，
                这也是真实 assessment 的规矩（Q1 的六个 testid 一个都不能改）。
              </p>
              <p>
                第 5 条 <code>filters without losing data</code>
                是专门抓「筛选态下改坏了底层数据」的：筛完再切回
                <code>all</code>，两条都得还在。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                To really practise this one, open an empty Vite + React + TS project (the
                react-notes-app scaffold works as is), create <code>src/types/Todo.ts</code> and{" "}
                <code>src/components/TodoList/index.tsx</code>, drop the test file below
                into <code>src/TodoList.test.tsx</code>, and write the component yourself.
              </p>
              <p>
                The tests find elements by <code>data-testid</code> and{" "}
                <code>aria-label</code> — <strong>those names have to match the
                tests</strong>, which is the rule in the real assessment too (you cannot
                rename a single one of the six testids in Q1).
              </p>
              <p>
                Test 5, <code>filters without losing data</code>, exists to catch
                &ldquo;the filter broke the underlying data&rdquo;: filter, switch back to{" "}
                <code>all</code>, and both items must still be there.
              </p>
            </>
          ),
          code: [
            tested("bash", "npx vitest run src/TodoList.test.tsx   # 7 passed", {
              filename: "验证命令",
            }),
            tested("tsx", TODO_TEST, {
              filename: "src/TodoList.test.tsx（DrillLab 自出，本机跑过）",
              collapsible: true,
            }),
          ],
        },
      ],
      exercises: [
        {
          kind: "fill-blank",
          id: "r-var-todo-blank",
          title: "补全翻转与批量操作",
          titleEn: "Fill in the toggle and the bulk action",
          level: 2,
          generated: true,
          prompt: (
            <p>
              四个空。第 2 个是「只改一个字段」的写法，第 4 个考的是
              「全选」和「反选」的区别。
            </p>
          ),
          promptEn: (
            <p>
              Four blanks. The second is how you change one field only. The fourth
              is about the difference between select-all and invert-selection.
            </p>
          ),
          language: "tsx",
          filename: "src/components/TodoList/index.tsx",
          template: `// 翻转一条：只改 done，其他字段照抄
const toggle = (id: number) => {
  setTodos((prev) =>
    prev.___1___((t) => (t.id === id ? { ___2___, done: !t.done } : t)),
  );
};

// 剩余几项 —— 派生数据
const remaining = todos.___3___((t) => !t.done).length;

// 全选 / 取消全选
const toggleAll = () => {
  const next = ___4___;
  setTodos((prev) => prev.map((t) => ({ ...t, done: next })));
};`,
          blanks: [
            {
              n: 1,
              accept: ["map"],
              hint: "长度不变、顺序不变，只是其中一条换了内容。",
              hintEn: "Same length, same order, with one item's content replaced.",
              why: (
                <>
                  <code>map</code>。翻转不改变条数，所以是 map 而不是 filter。
                </>
              ),
              whyEn: (
                <>
                  <code>map</code>. A toggle does not change how many items there
                  are, so this is map, not filter.
                </>
              ),
              width: 6,
            },
            {
              n: 2,
              accept: ["...t", "... t"],
              hint: "旧字段全部照抄，只覆盖 done。",
              hintEn: "Copy every old field over, and overwrite done only.",
              why: (
                <>
                  <code>...t</code>。对象展开把 <code>id</code>、
                  <code>text</code> 原样带过来，后面的
                  <code>done: !t.done</code> 覆盖掉展开进来的旧值 ——
                  <strong>顺序很重要，覆盖字段必须写在展开后面。</strong>
                </>
              ),
              whyEn: (
                <>
                  <code>...t</code>. The object spread carries <code>id</code> and{" "}
                  <code>text</code> across unchanged, and the{" "}
                  <code>done: !t.done</code> after it overwrites the old value the
                  spread brought in.{" "}
                  <strong>
                    The order matters: the field you overwrite has to come after
                    the spread.
                  </strong>
                </>
              ),
              width: 7,
            },
            {
              n: 3,
              accept: ["filter"],
              hint: "要「未完成的条数」，先筛出来再数。",
              hintEn: "You want the count of unfinished items: select them first, then count.",
              why: (
                <>
                  <code>filter</code> 再取 <code>.length</code>。
                  <br />
                  也可以用 <code>reduce</code>，但 filter + length 更直白。
                  重点是<strong>别把它做成 state</strong>。
                </>
              ),
              whyEn: (
                <>
                  <code>filter</code>, then read <code>.length</code>.
                  <br />
                  <code>reduce</code> works too, but filter plus length is easier
                  to read. The point is: <strong>do not make this a state</strong>.
                </>
              ),
              width: 8,
            },
            {
              n: 4,
              accept: ["!allDone"],
              hint: "「全选」要给所有条目一个统一的目标值，不是各自翻转。",
              hintEn: "Select-all gives every item one shared target value; it does not toggle each item on its own.",
              why: (
                <>
                  <code>!allDone</code>。先算出一个统一目标值再整体套上去。
                  <br />
                  如果写成每条 <code>!t.done</code>，混合状态下就变成了
                  <strong>反选</strong>而不是全选 —— 勾了的取消、没勾的勾上，
                  用户会觉得按钮坏了。
                </>
              ),
              whyEn: (
                <>
                  <code>!allDone</code>. Work out one shared target value first,
                  then apply it to everything.
                  <br />
                  If you write <code>!t.done</code> per item, then with a mixed
                  list you get <strong>invert selection</strong> instead of select
                  all: the checked ones get unchecked and the unchecked ones get
                  checked. Users read that as a broken button.
                </>
              ),
              width: 10,
            },
          ],
        },
        {
          kind: "code-completion",
          id: "r-var-todo-write",
          title: "自己写出筛选与「清除已完成」",
          titleEn: "Write the filtering and the clear-completed action yourself",
          level: 3,
          generated: true,
          prompt: (
            <p>
              已有 <code>todos</code> 和 <code>filter</code> 两个 state。
              写出可见列表和「清除已完成」，注意筛选态下的写操作该作用于谁。
            </p>
          ),
          promptEn: (
            <p>
              You already have the two states <code>todos</code> and{" "}
              <code>filter</code>. Write the visible list and the clear-completed
              action, and think about which list a write should act on while a
              filter is on.
            </p>
          ),
          language: "tsx",
          filename: "src/components/TodoList/index.tsx",
          starter: `// 已有：
//   const [todos, setTodos] = useState<Todo[]>([]);
//   const [filter, setFilter] = useState<Filter>("all");   // "all" | "active" | "done"

// 1. 可见列表（派生数据，不许新增 state）
const visible =

// 2. 清除已完成
const clearDone = () => {

};`,
          starterEn: `// Already there:
//   const [todos, setTodos] = useState<Todo[]>([]);
//   const [filter, setFilter] = useState<Filter>("all");   // "all" | "active" | "done"

// 1. the visible list (derived data, do not add a state)
const visible =

// 2. clear the completed items
const clearDone = () => {

};`,
          requirements: [
            "visible 是派生数据，不许用 useState 或 useEffect",
            'filter 为 "all" 时显示全部，"active" 显示未完成，"done" 显示已完成',
            "clearDone 移除所有已完成项，保留未完成项",
            "写操作必须作用于 todos，不能作用于 visible",
            "不许修改原数组",
          ],
          requirementsEn: [
            "visible is derived data: no useState and no useEffect",
            'When filter is "all" show everything, "active" shows the unfinished ones, "done" shows the finished ones',
            "clearDone removes every finished item and keeps the unfinished ones",
            "A write has to act on todos, never on visible",
            "Do not change the original array",
          ],
          checks: [
            {
              label: "visible 是普通 const，不是 state",
              labelEn: "visible is a plain const, not a state",
              mustNot: "useState[^\\n]*visible|setVisible",
            },
            {
              label: "没有用 useEffect 同步筛选结果",
              labelEn: "No useEffect is used to sync the filtered result",
              mustNot: "useEffect",
            },
            {
              label: "visible 用了 filter 或三元判断",
              labelEn: "visible uses filter or a conditional",
              must: "visible[\\s\\S]{0,160}(filter|\\?)",
            },
            { label: "区分了 done 与未完成两种情况", labelEn: "Finished and unfinished are told apart", must: "\\.done" },
            { label: "clearDone 调用了 setTodos", labelEn: "clearDone calls setTodos", must: "clearDone[\\s\\S]{0,160}setTodos" },
            {
              label: "clearDone 用函数式更新",
              labelEn: "clearDone uses a functional update",
              must: "setTodos\\s*\\(\\s*\\(?\\s*prev",
            },
            {
              label: "clearDone 保留未完成项（条件带取反）",
              labelEn: "clearDone keeps the unfinished items (the condition is negated)",
              must: "filter\\s*\\(\\s*\\(?\\s*\\w+\\)?\\s*=>\\s*!",
            },
            {
              label: "没有基于 visible 去 setTodos",
              labelEn: "setTodos is not called with visible",
              mustNot: "setTodos\\s*\\(\\s*visible",
            },
            { label: "没有 push / splice", labelEn: "No push / splice", mustNot: "\\.(push|splice)\\s*\\(" },
          ],
          hints: [
            "先问两个问题：可见列表需要「记住」吗？还是每次渲染都能算出来？删除的时候，被筛掉的那些数据还在不在 todos 里？",
            "visible 用三元 + filter 当场算。clearDone 是一次 filter，条件是「保留未完成的」—— 注意 filter 的语义是「留下」，所以要取反。",
            `const visible = filter 是 all ? todos : todos.filter(每一条 => filter 是 done ? 这条完成了 : 这条没完成)

const clearDone = () => {
  setTodos(最新值 => 最新值.filter(每一条 => 这条没完成))
}`,
            `const visible =
  filter === "all"
    ? todos
    : todos.filter((t) => (filter === "done" ? t.done : !t.done));

const clearDone = () => {
  setTodos((prev) => prev.filter((t) => !t.done));
};`,
          ],
          hintsEn: [
            "Start with two questions. Does the visible list need to be remembered, or can it be computed on every render? And when you delete, are the filtered-out items still inside todos?",
            "Compute visible on the spot with a conditional plus filter. clearDone is one filter whose condition keeps the unfinished ones — remember that filter means keep, so the condition is negated.",
            `const visible = filter is all ? todos : todos.filter(each => filter is done ? this one is finished : this one is not finished)

const clearDone = () => {
  setTodos(latest => latest.filter(each => this one is not finished))
}`,
            `const visible =
  filter === "all"
    ? todos
    : todos.filter((t) => (filter === "done" ? t.done : !t.done));

const clearDone = () => {
  setTodos((prev) => prev.filter((t) => !t.done));
};`,
          ],
          solution: tested(
            "tsx",
            `const visible =
  filter === "all"
    ? todos
    : todos.filter((t) => (filter === "done" ? t.done : !t.done));

const clearDone = () => {
  setTodos((prev) => prev.filter((t) => !t.done));
};`,
            { filename: "参考答案（实测通过）", filenameEn: "Reference answer (verified by running it)" },
          ),
        },
      ],
      mistakes: [
        {
          wrong: demo(
            "tsx",
            `// ✗ 为筛选结果单开一个 state + useEffect 同步
const [visible, setVisible] = useState<Todo[]>([]);
useEffect(() => {
  setVisible(filter === "all" ? todos : todos.filter(...));
}, [todos, filter]);`,
            {
              codeEn: `// ✗ A separate state for the filtered result, kept in sync by useEffect
const [visible, setVisible] = useState<Todo[]>([]);
useEffect(() => {
  setVisible(filter === "all" ? todos : todos.filter(...));
}, [todos, filter]);`,
            },
          ),
          why: (
            <>
              同一个事实存了两份，还多了一次渲染。而且只要有一处忘了触发同步
              就会不一致。<strong>能算出来的别存。</strong>
            </>
          ),
          whyEn: (
            <>
              The same fact is now stored twice, and there is one extra render. Miss a
              single place that should trigger the sync and the two copies disagree.{" "}
              <strong>If you can compute it, do not store it.</strong>
            </>
          ),
        },
        {
          wrong: demo(
            "tsx",
            `// ✗ 筛选态下基于 visible 删除
const remove = (id: number) => {
  setTodos(visible.filter((t) => t.id !== id));
};`,
            {
              codeEn: `// ✗ Deleting from visible while a filter is on
const remove = (id: number) => {
  setTodos(visible.filter((t) => t.id !== id));
};`,
            },
          ),
          why: (
            <>
              筛选到「已完成」时，<code>visible</code> 里只有已完成项。
              这一行会把所有未完成项<strong>一起丢掉</strong>。
              <br />
              <strong>写操作永远作用于完整数据。</strong>
            </>
          ),
          whyEn: (
            <>
              When the filter is set to done, <code>visible</code> holds only the finished
              items. This line throws away <strong>every unfinished item as well</strong>.
              <br />
              <strong>A write always acts on the full data.</strong>
            </>
          ),
        },
      ],
      transfer: [
        {
          signal: "「翻转某一项的开关」",
          signalEn: "Flip the switch on one item",
          reachFor: "map + { ...item, flag: !item.flag }",
          reachForEn: "map + { ...item, flag: !item.flag }",
        },
        {
          signal: "「显示剩余 N 项」",
          signalEn: "Show how many items are left",
          reachFor: "派生数据，filter().length",
          reachForEn: "A derived value: filter().length",
        },
        {
          signal: "「全选 / 全不选」",
          signalEn: "Select all / clear all",
          reachFor: "先算统一目标值，再整体套上去",
          reachForEn: "Compute one shared target value, then apply it to every item",
        },
        {
          signal: "有筛选又有增删改",
          signalEn: "A filter plus add, delete, and edit",
          reachFor: "读用 visible，写一律用完整数据",
          reachForEn: "Read from visible, always write to the full data",
        },
      ],
      recap: [
        "Todo 比 Note 只多一个布尔字段，于是多出「翻转」这个动作。",
        "翻转用 map + 对象展开；不可变要一路到底，不能只换外层数组。",
        "visible / remaining / allDone 三个都是派生数据，一个 state 都不加。",
        "全选是「统一目标值」，不是「各自翻转」，否则变成反选。",
        "筛选态下的写操作必须作用于完整数据，否则会丢掉被筛掉的项。",
      ],
      recapEn: [
        "Todo has exactly one field more than Note, a boolean, and that field adds the toggle action.",
        "Toggle with map plus object spread. The new object has to go all the way down, not stop at the outer array.",
        "visible, remaining, and allDone are all derived values. None of them needs its own state.",
        "Select all means one shared target value, not flipping each item on its own. Flipping each item inverts the selection instead.",
        "Under an active filter a write must act on the full data, or the filtered-out items are lost.",
      ],
    },

    /* ================================================================
       6.2 Timer
       ================================================================ */
    {
      id: "r-var-timer",
      title: "变式二 · 计时器：useEffect 的清理函数",
      titleEn: "Variation 2 · a timer: the useEffect cleanup function",
      blurb: "这道题真正的考点只有一个 —— 你会不会写 return () => clearInterval(id)。",
      blurbEn:
        "This question really tests one thing: can you write return () => clearInterval(id).",
      minutes: 16,
      objectives: [
        "说清 useEffect 的清理函数什么时候跑、为什么必须有",
        "解释「过期闭包」为什么让 setSeconds(seconds + 1) 卡在 1",
        "独立实现 start / pause / reset 的计时器",
        "看懂「忘了清理」造成的两种后果：越跳越快、卸载后泄漏",
      ],
      objectivesEn: [
        "Explain when the useEffect cleanup function runs, and why it has to be there",
        "Explain why a stale closure, a callback holding an old value, freezes setSeconds(seconds + 1) at 1",
        "Build a timer with start / pause / reset on your own",
        "Recognise the two results of a missing cleanup: the count speeds up, and the timer keeps running after the component is gone",
      ],
      whyForAssessment:
        "源项目里没有任何定时器，所以前面的课没讲过清理函数 —— 但它是 useEffect 的另一半，同类考试（计时器、轮询、订阅、事件监听、WebSocket）几乎必考。这道题是这个知识点最短的载体。",
      whyForAssessmentEn:
        "The source projects contain no timers, so no earlier lesson covered the cleanup function. It is the other half of useEffect, and exams of this kind almost always ask for it: timers, polling, subscriptions, event listeners, WebSocket. This question is the shortest way to carry that one idea.",
      concepts: [
        {
          id: "cleanup",
          heading: "清理函数：effect 的另一半",
          headingEn: "The cleanup function: the other half of an effect",
          lede: "useEffect 里 return 出去的那个函数，React 会在「下一次执行之前」和「卸载时」调用它。",
          ledeEn: "React calls the function you return from useEffect twice over: before the next run, and when the component is removed.",
          body: (
            <>
              <p>
                前面讲 <code>useEffect</code> 时只讲了「什么时候跑」。
                完整的规则是<strong>四句话</strong>：
              </p>
              <ol>
                <li>首次渲染后，执行 effect。</li>
                <li>
                  依赖变化时，<strong>先执行上一次的清理函数</strong>，再执行新的 effect。
                </li>
                <li>组件卸载时，执行最后一次的清理函数。</li>
                <li>没有 return，就没有清理这一步。</li>
              </ol>
              <p>
                所以清理函数的职责很明确：<strong>把这一次 effect 建立起来的东西拆掉。</strong>
                建了定时器就清定时器，加了事件监听就移除监听，
                开了订阅就取消订阅，发了请求就中止请求。
              </p>
              <p>
                <strong>判别口诀：effect 里只要出现了
                <code>setInterval</code> / <code>setTimeout</code> /
                <code>addEventListener</code> / <code>subscribe</code> /
                <code>new WebSocket</code> / <code>fetch</code>，
                就一定要有 return。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Earlier lessons on <code>useEffect</code> only covered when it runs. The
                full rule is <strong>four sentences</strong>:
              </p>
              <ol>
                <li>After the first render, run the effect.</li>
                <li>
                  When a dependency changes, <strong>run the previous cleanup
                  first</strong>, then run the new effect.
                </li>
                <li>When the component unmounts, run the last cleanup.</li>
                <li>No return means no cleanup step at all.</li>
              </ol>
              <p>
                So the cleanup has a precise job: <strong>tear down whatever this run of
                the effect set up.</strong> Started an interval, clear the interval; added a
                listener, remove the listener; opened a subscription, cancel it; fired a
                request, abort it.
              </p>
              <p>
                <strong>Quick test: if an effect contains <code>setInterval</code> /{" "}
                <code>setTimeout</code> / <code>addEventListener</code> /{" "}
                <code>subscribe</code> / <code>new WebSocket</code> / <code>fetch</code>,
                it needs a return.</strong>
              </p>
            </>
          ),
          code: [
            tested(
              "tsx",
              `useEffect(() => {
  if (!running) return;                    // 没在跑就不建定时器

  const id = setInterval(() => {
    setSeconds((s) => s + 1);
  }, 1000);

  return () => clearInterval(id);          // ← 这一行是整道题的答案
}, [running]);`,
              {
                filename: "计时器的核心九行",
                filenameEn: "The nine lines at the heart of the timer",
                codeEn: `useEffect(() => {
  if (!running) return;                    // not running, so build no interval

  const id = setInterval(() => {
    setSeconds((s) => s + 1);
  }, 1000);

  return () => clearInterval(id);          // ← this line is the answer to the whole task
}, [running]);`,
              },
            ),
          ],
        },
        {
          id: "stale-closure",
          heading: "为什么必须用 setSeconds(s => s + 1)",
          headingEn: "Why setSeconds(s => s + 1) is required",
          lede: "写成 setSeconds(seconds + 1) 会卡在 1 不动。这个坑叫「过期闭包」。",
          ledeEn: "Write setSeconds(seconds + 1) and the display freezes at 1. The name for this is a stale closure: the callback still holds an old value.",
          body: (
            <>
              <p>
                <code>setInterval</code> 的回调是在<strong>某一次渲染里</strong>
                创建的。它通过闭包捕获了那一次渲染的 <code>seconds</code>。
              </p>
              <p>
                依赖是 <code>[running]</code>，所以 <code>seconds</code> 变化
                <strong>不会</strong>重建 effect，那个回调也就永远不会被替换。
                于是它每一秒都在算「当时那个 seconds + 1」：
              </p>
              <p>
                <strong>函数式更新绕开了这个问题</strong>：
                <code>setSeconds(s =&gt; s + 1)</code> 里的 <code>s</code>
                是 React 在调用时交给你的最新值，不来自闭包。
              </p>
              <p>
                <strong>另一条常见但更差的解法</strong>是把
                <code>seconds</code> 加进依赖数组。那样每一秒都会
                销毁定时器再建一个新的 —— 能跑，但计时会因为反复重建而漂移，
                而且完全没必要。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The <code>setInterval</code> callback is created{" "}
                <strong>inside one particular render</strong>. Through its closure it
                captured that render&rsquo;s <code>seconds</code>.
              </p>
              <p>
                The dependency list is <code>[running]</code>, so a change to{" "}
                <code>seconds</code> <strong>does not</strong> rebuild the effect, and that
                callback never gets replaced. Every second it computes &ldquo;that old
                seconds + 1&rdquo;:
              </p>
              <p>
                <strong>The updater form sidesteps the whole thing</strong>: the{" "}
                <code>s</code> in <code>setSeconds(s =&gt; s + 1)</code> is the latest value
                React hands you at call time, not something out of the closure.
              </p>
              <p>
                <strong>The other common but worse fix</strong> is adding{" "}
                <code>seconds</code> to the dependency array. Then every second destroys the
                interval and builds a new one — it runs, but the clock drifts from all that
                rebuilding, and there is no reason for it.
              </p>
            </>
          ),
          code: [
            demo(
              "tsx",
              `// ✗ 过期闭包：seconds 永远是 effect 创建那一刻的值（0）
useEffect(() => {
  if (!running) return;
  const id = setInterval(() => {
    setSeconds(seconds + 1);   // 0 + 1 = 1，每秒都算出 1
  }, 1000);
  return () => clearInterval(id);
}, [running]);
// 显示：00:01 然后一动不动

// ✓ 函数式更新：s 是 React 给的最新值
setSeconds((s) => s + 1);`,
              {
                codeEn: `// ✗ Stale closure: seconds stays the value it had when the effect was created (0)
useEffect(() => {
  if (!running) return;
  const id = setInterval(() => {
    setSeconds(seconds + 1);   // 0 + 1 = 1, so every second computes 1
  }, 1000);
  return () => clearInterval(id);
}, [running]);
// Display: 00:01 and then nothing moves

// ✓ Updater form: s is the latest value React gives you
setSeconds((s) => s + 1);`,
              },
            ),
          ],
        },
        {
          id: "what-breaks",
          heading: "忘了清理会怎样：两种后果，都实测过",
          headingEn: "What a missing cleanup does: two results, both measured",
          lede: "我把 clearInterval 那行删掉真跑了一遍，8 个测试挂了 4 个。",
          ledeEn: "I deleted the clearInterval line and ran the suite for real: 4 of the 8 tests failed.",
          body: (
            <>
              <p>
                <strong>后果一：秒数越跳越快。</strong>
                每次 <code>running</code> 变成 <code>true</code> 就新建一个
                interval，旧的没被清掉还在跑。start / pause 来回四次之后，
                同时有 4 个 interval 在给同一个 state 加一。
              </p>
              <p>
                测试里那条「start/pause 四次，每次 1 秒，应该正好 4 秒」
                就是专门抓它的 —— 漏了清理会得到
                <strong>1 + 2 + 3 + 4 = 10 秒</strong>。这是实测输出：
              </p>
              <p>
                <strong>后果二：组件卸载后定时器还在跑。</strong>
                这是内存泄漏，而且回调还会对已经卸载的组件调用 setState。
                测试用 <code>vi.getTimerCount()</code> 直接查：
                卸载后应该是 0，漏了清理就是 1。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>Consequence one: the seconds speed up.</strong> Every time{" "}
                <code>running</code> flips to <code>true</code> a new interval is created,
                and the old one was never cleared, so it is still running. After four start
                / pause rounds, four intervals are adding one to the same state.
              </p>
              <p>
                The test that says &ldquo;start/pause four times, one second each, should
                land on exactly 4 seconds&rdquo; is there to catch this — miss the cleanup
                and you get <strong>1 + 2 + 3 + 4 = 10 seconds</strong>. This is the real
                output:
              </p>
              <p>
                <strong>Consequence two: the interval keeps running after
                unmount.</strong> That is a memory leak, and the callback also calls
                setState on a component that is already gone. The test checks it directly
                with <code>vi.getTimerCount()</code>: it should be 0 after unmount, and it
                is 1 when the cleanup is missing.
              </p>
            </>
          ),
          code: [
            tested(
              "bash",
              `# 把 return () => clearInterval(id) 删掉之后的真实输出
$ npx vitest run src/Timer.test.tsx

 ✕ pause stops the clock and keeps the value
   Expected element to have text content: 00:02
   Received:                              00:07

 ✕ start/pause many times does not speed up（清理函数生效的证据）
   Expected element to have text content: 00:04
   Received:                              00:10        ← 1+2+3+4

 ✕ reset stops and zeroes
   Expected element to have text content: 00:00
   Received:                              00:03

 ✕ unmount clears the interval（不再有活着的定时器）
   AssertionError: expected 1 to be +0 // Object.is equality
   - Expected   0
   + Received   1

 Tests  4 failed | 4 passed (8)`,
              {
                filename: "本机实测：漏掉清理函数的后果",
                filenameEn: "Measured here: what a missing cleanup costs",
                codeEn: `# The real output after deleting return () => clearInterval(id)
$ npx vitest run src/Timer.test.tsx

 ✕ pause stops the clock and keeps the value
   Expected element to have text content: 00:02
   Received:                              00:07

 ✕ start/pause many times does not speed up（清理函数生效的证据）
   Expected element to have text content: 00:04
   Received:                              00:10        ← 1+2+3+4

 ✕ reset stops and zeroes
   Expected element to have text content: 00:00
   Received:                              00:03

 ✕ unmount clears the interval（不再有活着的定时器）
   AssertionError: expected 1 to be +0 // Object.is equality
   - Expected   0
   + Received   1

 Tests  4 failed | 4 passed (8)`,
              },
            ),
          ],
        },
        {
          id: "full",
          heading: "完整答案",
          headingEn: "The complete answer",
          lede: "8 个测试全过，其中两条专门验证清理生效。",
          ledeEn: "All 8 tests pass, and two of them exist only to prove the cleanup ran.",
          body: (
            <>
              <p>
                <code>format</code> 单独导出成纯函数，方便直接单测 ——
                「把能纯化的逻辑抽出来」在 assessment 里是加分项。
              </p>
              <p>
                <code>reset</code> 同时把 <code>running</code> 设回 false ——
                否则清零之后它会立刻从 0 继续跑，不符合「重置」的预期。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>format</code> is exported on its own as a pure function so it can be
                unit-tested directly — &ldquo;pull out the logic that can be pure&rdquo;
                scores points in an assessment.
              </p>
              <p>
                <code>reset</code> also sets <code>running</code> back to false — otherwise
                it zeroes the clock and immediately starts counting from 0 again, which is
                not what &ldquo;reset&rdquo; means.
              </p>
            </>
          ),
          code: [
            tested("tsx", TIMER_SOLUTION, {
              filename: "src/components/Timer/index.tsx（实测 8/8 通过）",
              collapsible: true,
            }),
          ],
        },
        {
          id: "verify",
          heading: "怎么验证",
          headingEn: "How to check it",
          lede: "定时器怎么测？把时间也 mock 掉。",
          ledeEn: "How do you test a timer? Replace the clock with a fake one you control.",
          body: (
            <>
              <p>
                测计时器不能真等 3 秒。<code>vi.useFakeTimers()</code>
                把 <code>setInterval</code> 换成假的，
                <code>vi.advanceTimersByTime(3000)</code>
                一瞬间把时钟推 3 秒 —— 测试跑得快，而且结果稳定。
              </p>
              <p>
                <strong>三个关键写法值得单独记：</strong>
              </p>
              <ul>
                <li>
                  推时间必须包在 <code>act()</code> 里，
                  否则 React 的 state 更新还没落到 DOM，断言会读到旧值。
                </li>
                <li>
                  <code>vi.getTimerCount()</code> 直接查「现在还有几个定时器活着」
                  —— 这是验证清理函数最直接的手段，比看秒数更硬。
                </li>
                <li>
                  <code>afterEach(() =&gt; vi.useRealTimers())</code>
                  必须有，否则假时钟会漏到别的测试文件里。
                </li>
              </ul>
              <p>
                <code>start/pause many times does not speed up</code> 那一条
                就是上面「1+2+3+4 = 10」的来源。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                You cannot really wait 3 seconds in a test.{" "}
                <code>vi.useFakeTimers()</code> swaps <code>setInterval</code> for a fake
                one, and <code>vi.advanceTimersByTime(3000)</code> pushes the clock forward
                3 seconds in an instant — fast tests, stable results.
              </p>
              <p>
                <strong>Three details worth memorising on their own:</strong>
              </p>
              <ul>
                <li>
                  Advancing time must be wrapped in <code>act()</code>, or React&rsquo;s
                  state update has not landed in the DOM yet and the assertion reads the old
                  value.
                </li>
                <li>
                  <code>vi.getTimerCount()</code> answers &ldquo;how many timers are alive
                  right now&rdquo; — the most direct way to verify a cleanup, harder
                  evidence than reading the seconds.
                </li>
                <li>
                  <code>afterEach(() =&gt; vi.useRealTimers())</code> is mandatory,
                  otherwise the fake clock leaks into other test files.
                </li>
              </ul>
              <p>
                <code>start/pause many times does not speed up</code> is where the
                &ldquo;1+2+3+4 = 10&rdquo; above comes from.
              </p>
            </>
          ),
          code: [
            tested("bash", "npx vitest run src/Timer.test.tsx   # 8 passed", {
              filename: "验证命令",
              filenameEn: "The command that verifies it",
            }),
            tested("tsx", TIMER_TEST, {
              filename: "src/Timer.test.tsx（DrillLab 自出，本机跑过）",
              filenameEn: "src/Timer.test.tsx (written for DrillLab, run here)",
              collapsible: true,
            }),
          ],
        },
      ],
      exercises: [
        {
          kind: "fill-blank",
          id: "r-var-timer-blank",
          title: "补全计时器的 effect",
          titleEn: "Fill in the effect of the timer",
          level: 2,
          generated: true,
          prompt: (
            <p>
              三个空，全在这九行里。第 2 个空漏了会「越跳越快」，
              第 3 个空写错会「卡在 1 不动」。
            </p>
          ),
          promptEn: (
            <p>
              Three blanks, all within these nine lines. Miss the second and the
              clock speeds up with every start. Get the third wrong and the
              display freezes at 1.
            </p>
          ),
          language: "tsx",
          filename: "src/components/Timer/index.tsx",
          template: `useEffect(() => {
  if (!running) return;

  const id = setInterval(() => {
    setSeconds(___3___);
  }, 1000);

  return () => ___2___(id);
}, [___1___]);`,
          blanks: [
            {
              n: 1,
              accept: ["running"],
              hint: "只有「跑还是不跑」变化时才需要重建定时器。",
              hintEn: "The interval only needs rebuilding when running or not running changes.",
              why: (
                <>
                  <code>running</code>。
                  <br />
                  写 <code>[]</code> → 点 Start 也不会启动。
                  <br />
                  写 <code>[running, seconds]</code> → 每秒销毁重建一次定时器，
                  能跑但会漂移，而且没必要。
                  <br />
                  不写依赖数组 → 每次渲染都重建，直接失控。
                </>
              ),
              whyEn: (
                <>
                  <code>running</code>.
                  <br />
                  With <code>[]</code>, clicking Start does nothing.
                  <br />
                  With <code>[running, seconds]</code>, the interval is destroyed
                  and rebuilt every second. It runs, but the clock drifts, and
                  there is no reason for it.
                  <br />
                  With no dependency array at all, it is rebuilt on every render
                  and goes out of control.
                </>
              ),
              width: 9,
            },
            {
              n: 2,
              accept: ["clearInterval"],
              hint: "把这一次 effect 建立起来的东西拆掉。",
              hintEn: "Take down whatever this run of the effect set up.",
              why: (
                <>
                  <code>clearInterval</code>。
                  <br />
                  <strong>这是整道题的考点。</strong>
                  漏了它，start/pause 四次会得到 10 秒而不是 4 秒
                  （实测），而且组件卸载后定时器还活着。
                  <br />
                  注意别写成 <code>clearTimeout</code> ——
                  虽然多数浏览器里两者可以互换，但语义不对，review 会挑。
                </>
              ),
              whyEn: (
                <>
                  <code>clearInterval</code>.
                  <br />
                  <strong>This is what the whole task is testing.</strong> Without
                  it, four rounds of start and pause give you 10 seconds instead of
                  4 (measured), and the interval stays alive after the component
                  unmounts.
                  <br />
                  Do not write <code>clearTimeout</code> instead. Most browsers
                  treat the two interchangeably, but it says the wrong thing, and a
                  reviewer will point it out.
                </>
              ),
              width: 15,
            },
            {
              n: 3,
              accept: ["(s) => s + 1", "s => s + 1", "(prev) => prev + 1", "prev => prev + 1"],
              hint: "回调是在某一次渲染里创建的，它闭包捕获的 seconds 不会更新。",
              hintEn: "The callback was created inside one particular render, and the seconds its closure captured never updates.",
              why: (
                <>
                  <code>(s) =&gt; s + 1</code> —— 函数式更新。
                  <br />
                  写成 <code>seconds + 1</code> 会遇到<strong>过期闭包</strong>：
                  依赖是 <code>[running]</code>，<code>seconds</code> 变化不重建
                  effect，那个回调里的 <code>seconds</code> 永远是 0，
                  于是每秒都算出 1，显示卡在 <code>00:01</code>。
                </>
              ),
              whyEn: (
                <>
                  <code>(s) =&gt; s + 1</code>, the updater form.
                  <br />
                  Writing <code>seconds + 1</code> gives you a{" "}
                  <strong>stale closure</strong>: the dependency is{" "}
                  <code>[running]</code>, so a change to <code>seconds</code> does
                  not rebuild the effect. The <code>seconds</code> inside that
                  callback stays 0 forever, every second computes 1, and the display
                  freezes at <code>00:01</code>.
                </>
              ),
              width: 14,
            },
          ],
        },
        {
          kind: "code-completion",
          id: "r-var-timer-write",
          title: "自己写出整个计时器",
          titleEn: "Write the whole timer yourself",
          level: 3,
          generated: true,
          prompt: (
            <p>
              两个 state、一个 effect、一个 reset、一个 mm:ss 格式化。
              检查器会专门查清理函数和函数式更新。
            </p>
          ),
          promptEn: (
            <p>
              Two states, one effect, one reset, and one mm:ss formatter. The
              checker looks specifically for the cleanup function and the updater
              form.
            </p>
          ),
          language: "tsx",
          filename: "src/components/Timer/index.tsx",
          starter: `import React, { useEffect, useState } from "react";

// 1. 把秒数格式化成 mm:ss（00:00 / 00:09 / 01:05 / 10:00）
export const format = (totalSeconds: number) =>

const Timer: React.FC = () => {
  // 2. 两个 state：已走过的秒数、是否在跑

  // 3. effect：running 为 true 时每秒加一；记得清理

  // 4. reset：停下来并清零

  return (
    <div data-testid="timer">
      <output data-testid="display">{/* 格式化后的时间 */}</output>
      <button data-testid="toggle">{/* Start / Pause */}</button>
      <button data-testid="reset">Reset</button>
    </div>
  );
};

export default Timer;`,
          starterEn: `import React, { useEffect, useState } from "react";

// 1. format the seconds as mm:ss (00:00 / 00:09 / 01:05 / 10:00)
export const format = (totalSeconds: number) =>

const Timer: React.FC = () => {
  // 2. two states: the seconds gone by, and whether it is running

  // 3. effect: add one every second while running is true; remember the cleanup

  // 4. reset: stop and go back to zero

  return (
    <div data-testid="timer">
      <output data-testid="display">{/* 格式化后的时间 */}</output>
      <button data-testid="toggle">{/* Start / Pause */}</button>
      <button data-testid="reset">Reset</button>
    </div>
  );
};

export default Timer;`,
          requirements: [
            "format(65) 要返回 \"01:05\"，个位数补零",
            "点 Start 开始每秒加一，点 Pause 停下并保留当前值",
            "Reset 停下来并清零（按钮文字回到 Start）",
            "effect 必须返回清理函数清掉定时器",
            "必须用函数式更新，避免过期闭包",
            "按钮文字：跑着显示 Pause，停着显示 Start",
          ],
          requirementsEn: [
            'format(65) has to return "01:05", padding single digits with a zero',
            "Start begins adding one per second; Pause stops and keeps the current value",
            "Reset stops and goes back to zero (the button text returns to Start)",
            "The effect has to return a cleanup function that clears the interval",
            "Use the updater form, so there is no stale closure",
            "Button text: Pause while running, Start while stopped",
          ],
          checks: [
            { label: "用了 setInterval", labelEn: "setInterval is used", must: "setInterval\\s*\\(" },
            {
              label: "effect 返回了清理函数并 clearInterval",
              labelEn: "The effect returns a cleanup function that calls clearInterval",
              must: "return\\s*\\(\\s*\\)\\s*=>[\\s\\S]{0,60}clearInterval",
            },
            {
              label: "依赖数组里有 running（或等价的开关 state）",
              labelEn: "The dependency array holds running (or an equivalent on/off state)",
              must: "\\}\\s*,\\s*\\[[^\\]]*running[^\\]]*\\]",
            },
            {
              label: "用函数式更新加一，不是 seconds + 1",
              labelEn: "The increment uses the updater form, not seconds + 1",
              must: "set\\w*\\(\\s*\\(?\\s*\\w+\\s*\\)?\\s*=>\\s*\\w+\\s*\\+\\s*1",
            },
            {
              label: "没有直接用闭包里的值加一",
              labelEn: "The increment does not read the value out of the closure",
              mustNot: "set(Seconds|Time|Elapsed)\\s*\\(\\s*(seconds|time|elapsed)\\s*\\+",
            },
            { label: "format 里做了补零", labelEn: "format pads with a zero", must: "padStart|padEnd|slice\\s*\\(\\s*-2" },
            {
              label: "reset 同时停表并清零",
              labelEn: "reset both stops the clock and clears it",
              must: "(setRunning|setIsRunning)\\s*\\(\\s*false\\s*\\)",
            },
            { label: "按钮文字随状态切换", labelEn: "The button text follows the state", must: "\\?\\s*[\"'`]Pause|Pause[\"'`]\\s*:" },
          ],
          hints: [
            "先想清楚：定时器该在什么时候建立、什么时候拆掉？「拆掉」这件事在 useEffect 里由谁负责？另外，interval 的回调是在哪一次渲染里创建的，它看到的 state 是哪一次的？",
            "两个 state：seconds 和 running。effect 依赖 [running]：running 为 false 就直接 return 不建定时器；为 true 就 setInterval，并 return 一个清理函数。加一必须用 setSeconds(s => s + 1)。格式化用 Math.floor(n/60) 和 n%60，各自 String().padStart(2, \"0\")。",
            `const pad = n => String(n).padStart(2, "0")
format = n => \`\${pad(Math.floor(n / 60))}:\${pad(n % 60)}\`

useEffect(() => {
  if (!running) return
  const id = setInterval(() => setSeconds(上一个值 => 上一个值 + 1), 1000)
  return () => 清掉这个 id
}, [running])

reset = () => { 停表; 清零 }
按钮文字 = running ? "Pause" : "Start"`,
            `const pad = (n: number) => String(n).padStart(2, "0");
export const format = (totalSeconds: number) =>
  \`\${pad(Math.floor(totalSeconds / 60))}:\${pad(totalSeconds % 60)}\`;

useEffect(() => {
  if (!running) return;
  const id = setInterval(() => {
    setSeconds((s) => s + 1);
  }, 1000);
  return () => clearInterval(id);
}, [running]);`,
          ],
          hintsEn: [
            "Settle two things first: when should the interval be built, and when torn down? Inside useEffect, what is responsible for the tearing down? And which render created the interval callback, so which render's state does it see?",
            'Two states: seconds and running. The effect depends on [running]: when running is false, return early and build no interval; when it is true, call setInterval and return a cleanup function. The increment has to be setSeconds(s => s + 1). Format with Math.floor(n/60) and n%60, each through String().padStart(2, "0").',
            `const pad = n => String(n).padStart(2, "0")
format = n => \`\${pad(Math.floor(n / 60))}:\${pad(n % 60)}\`

useEffect(() => {
  if (!running) return
  const id = setInterval(() => setSeconds(previous value => previous value + 1), 1000)
  return () => clear that id
}, [running])

reset = () => { stop the clock; zero it }
button text = running ? "Pause" : "Start"`,
            `const pad = (n: number) => String(n).padStart(2, "0");
export const format = (totalSeconds: number) =>
  \`\${pad(Math.floor(totalSeconds / 60))}:\${pad(totalSeconds % 60)}\`;

useEffect(() => {
  if (!running) return;
  const id = setInterval(() => {
    setSeconds((s) => s + 1);
  }, 1000);
  return () => clearInterval(id);
}, [running]);`,
          ],
          solution: tested("tsx", TIMER_SOLUTION, {
            filename: "参考答案（实测 8/8 通过）",
            filenameEn: "Reference answer (8 of 8 tests pass here)",
            collapsible: true,
          }),
        },
        {
          kind: "debug",
          id: "r-var-timer-debug",
          title: "Debug Lab · 计时器越跑越快",
          titleEn: "Debug Lab · the timer keeps getting faster",
          level: 2,
          generated: true,
          prompt: (
            <p>
              点了几次 Start / Pause 之后，秒数开始一次跳好几秒。
              下面是真实的测试输出。
            </p>
          ),
          promptEn: (
            <p>
              After a few clicks of Start and Pause, the seconds start jumping
              several at a time. Below is the real test output.
            </p>
          ),
          errorOutput: `$ npx vitest run src/Timer.test.tsx

 ✕ pause stops the clock and keeps the value
   Expected element to have text content: 00:02
   Received:                              00:07

 ✕ start/pause many times does not speed up
   Expected element to have text content: 00:04
   Received:                              00:10

 ✕ reset stops and zeroes
   Expected element to have text content: 00:00
   Received:                              00:03

 ✕ unmount clears the interval
   AssertionError: expected 1 to be +0 // Object.is equality

 Tests  4 failed | 4 passed (8)

# 现象：start / pause 来回点四次，每次只走 1 秒，
# 显示却是 00:10 —— 正好是 1+2+3+4。
# 而且 Reset 之后秒数还在自己往上涨。`,
          broken: demo(
            "tsx",
            `useEffect(() => {
  if (!running) return;

  const id = setInterval(() => {
    setSeconds((s) => s + 1);
  }, 1000);
}, [running]);`,
            { filename: "src/components/Timer/index.tsx" },
          ),
          classify: {
            options: [
              { id: "a", label: "过期闭包 —— setSeconds 读到了旧的 seconds", labelEn: "A stale closure — setSeconds read an old seconds" },
              {
                id: "b",
                label: "副作用未清理 —— effect 没有返回清理函数，旧定时器一直累积",
                labelEn: "An uncleaned effect — it returns no cleanup function, so the old intervals pile up",
              },
              {
                id: "c",
                label: "依赖数组错误 —— 应该把 seconds 也加进去",
                labelEn: "A dependency array error — seconds should be in there too",
              },
              { id: "d", label: "状态更新错误 —— 改了原对象", labelEn: "A state update error — the original object was changed" },
            ],
            answer: "b",
          },
          locate: {
            question: "该补什么？",
            questionEn: "What has to be added?",
            options: [
              {
                id: "a",
                label: "在 effect 末尾加 return () => clearInterval(id);",
                labelEn: "Add return () => clearInterval(id); at the end of the effect",
              },
              { id: "b", label: "把依赖数组改成 [running, seconds]", labelEn: "Change the dependency array to [running, seconds]" },
              { id: "c", label: "把 setInterval 换成 setTimeout", labelEn: "Replace setInterval with setTimeout" },
              { id: "d", label: "在 setSeconds 外面加一层 if (running)", labelEn: "Wrap setSeconds in an if (running)" },
            ],
            answer: "a",
          },
          fixed: tested(
            "tsx",
            `useEffect(() => {
  if (!running) return;

  const id = setInterval(() => {
    setSeconds((s) => s + 1);
  }, 1000);

  // 清理函数：running 变化时先拆掉上一个定时器，卸载时也会拆
  return () => clearInterval(id);
}, [running]);`,
            {
              filename: "改对之后（8/8 通过）",
              filenameEn: "After the fix (8 of 8 pass)",
              codeEn: `useEffect(() => {
  if (!running) return;

  const id = setInterval(() => {
    setSeconds((s) => s + 1);
  }, 1000);

  // Cleanup: tear down the previous interval when running changes, and on unmount
  return () => clearInterval(id);
}, [running]);`,
              highlight: [8, 9],
            },
          ),
          rootCause: (
            <>
              <p>
                依赖是 <code>[running]</code>，所以每次 <code>running</code>
                从 false 变 true，effect 就重跑一次、<code>setInterval</code>
                就多建一个。<strong>而旧的那个从来没被清掉，还在跑。</strong>
              </p>
              <p>
                start / pause 四轮之后，同时有 4 个 interval 在给同一个 state
                加一。第一轮 1 秒、第二轮 2 秒/秒、第三轮 3 秒/秒、
                第四轮 4 秒/秒 —— 累计正好 <strong>1+2+3+4 = 10</strong>。
                这和实测输出的 <code>00:10</code> 完全对上。
              </p>
              <p>
                <strong>选项 B 为什么不行？</strong>
                把 <code>seconds</code> 加进依赖能让「过期闭包」问题消失，
                但<strong>治不了泄漏</strong> —— 每次 seconds 变化重建定时器时，
                旧的照样没被清掉，只是叠加速度不同了。
                <strong>清理函数是唯一的正解。</strong>
              </p>
              <p>
                <strong>选项 C 也不对：</strong>换成
                <code>setTimeout</code> 只是让它跳一次就停，
                根本不再是计时器。
              </p>
              <p>
                记住这条判别法：<strong>effect 里凡是「建立了一个会持续存在的东西」
                （定时器、监听器、订阅、连接、在途请求），
                就必须 return 一个把它拆掉的函数。</strong>
              </p>
            </>
          ),
          rootCauseEn: (
            <>
              <p>
                The dependency is <code>[running]</code>, so every time{" "}
                <code>running</code> goes from false to true the effect runs again
                and <code>setInterval</code> creates one more interval.{" "}
                <strong>The old one is never cleared, and it keeps running.</strong>
              </p>
              <p>
                After four rounds of start and pause, four intervals are adding one
                to the same state. The first round adds 1 per second, the second 2,
                the third 3, the fourth 4 — which totals{" "}
                <strong>1+2+3+4 = 10</strong>. That matches the{" "}
                <code>00:10</code> in the measured output exactly.
              </p>
              <p>
                <strong>Why is option B not enough?</strong> Adding{" "}
                <code>seconds</code> to the dependencies does remove the stale
                closure, but it <strong>does not stop the leak</strong>. Each time
                seconds changes and the interval is rebuilt, the old one is still
                not cleared; only the rate of the pile-up changes.{" "}
                <strong>The cleanup function is the only real fix.</strong>
              </p>
              <p>
                <strong>Option C is wrong too:</strong> switching to{" "}
                <code>setTimeout</code> makes it tick once and stop, so it is no
                longer a timer at all.
              </p>
              <p>
                Remember this rule of thumb:{" "}
                <strong>
                  whenever an effect sets up something that keeps existing — a
                  timer, a listener, a subscription, a connection, a request in
                  flight — it has to return a function that tears that thing down.
                </strong>
              </p>
            </>
          ),
          verify: "npx vitest run src/Timer.test.tsx   # 应该 8 passed，包含 unmount 那条",
          verifyEn: "npx vitest run src/Timer.test.tsx   # should be 8 passed, including the unmount one",
        },
      ],
      mistakes: [
        {
          wrong: demo(
            "tsx",
            `// ✗ 过期闭包：显示卡在 00:01
const id = setInterval(() => {
  setSeconds(seconds + 1);
}, 1000);`,
            {
              codeEn: `// ✗ Stale closure: the display freezes at 00:01
const id = setInterval(() => {
  setSeconds(seconds + 1);
}, 1000);`,
            },
          ),
          why: (
            <>
              回调闭包捕获的 <code>seconds</code> 是 effect 创建那一刻的值。
              依赖里没有 <code>seconds</code>，effect 不会重建，
              所以它每秒都在算 <code>0 + 1</code>。
              <strong>改成 <code>setSeconds(s =&gt; s + 1)</code>。</strong>
            </>
          ),
          whyEn: (
            <>
              The callback captured the value <code>seconds</code> had at the moment the
              effect was created. <code>seconds</code> is not in the dependency list, so
              the effect is never rebuilt, and every second it computes{" "}
              <code>0 + 1</code> again.{" "}
              <strong>Change it to <code>setSeconds(s =&gt; s + 1)</code>.</strong>
            </>
          ),
        },
        {
          wrong: demo(
            "tsx",
            `// ✗ reset 只清零，没停表
const reset = () => setSeconds(0);`,
            {
              codeEn: `// ✗ reset only zeroes the count; it never stops the clock
const reset = () => setSeconds(0);`,
            },
          ),
          why: (
            <>
              <code>running</code> 还是 true，定时器还在跑 ——
              清零之后立刻又从 0 开始涨。用户点「重置」的预期是
              <strong>停下来并归零</strong>，两件事都要做。
            </>
          ),
          whyEn: (
            <>
              <code>running</code> is still true and the interval is still going, so the
              count starts climbing again from 0 right away. When a user presses reset
              they expect it to <strong>stop and go back to zero</strong>. Both things
              have to happen.
            </>
          ),
        },
        {
          wrong: demo(
            "tsx",
            `// ✗ 用 state 存定时器 id
const [timerId, setTimerId] = useState<number | null>(null);
const start = () => setTimerId(setInterval(...));
const pause = () => { if (timerId) clearInterval(timerId); };`,
            {
              codeEn: `// ✗ Keeping the interval id in a state
const [timerId, setTimerId] = useState<number | null>(null);
const start = () => setTimerId(setInterval(...));
const pause = () => { if (timerId) clearInterval(timerId); };`,
            },
          ),
          why: (
            <>
              能跑，但把「副作用的生命周期」从 React 手里拿走了自己管，
              卸载时很容易漏清理。
              <br />
              定时器 id 不是渲染要用的数据，本来就不该是 state
              （真要存也该用 <code>useRef</code>）。
              <strong>让 effect + 清理函数管，代码更短也更难写错。</strong>
            </>
          ),
          whyEn: (
            <>
              This works, but it takes the lifetime of the side effect out of React&rsquo;s
              hands and into yours, and then it is easy to forget the cleanup when the
              component is removed.
              <br />
              The timer id is not data the render needs, so it should not be state in the
              first place (if you must keep it, use <code>useRef</code>).{" "}
              <strong>Let the effect and its cleanup function handle it: less code, and
              fewer ways to get it wrong.</strong>
            </>
          ),
        },
      ],
      transfer: [
        {
          signal: "effect 里出现 setInterval / setTimeout",
          signalEn: "setInterval or setTimeout inside an effect",
          reachFor: "return () => clear…",
          reachForEn: "return () => clear…",
        },
        {
          signal: "effect 里 addEventListener",
          signalEn: "addEventListener inside an effect",
          reachFor: "return () => removeEventListener（同一个函数引用）",
          reachForEn: "return () => removeEventListener, with the same function reference",
        },
        {
          signal: "effect 里 subscribe / new WebSocket",
          signalEn: "subscribe or new WebSocket inside an effect",
          reachFor: "return () => unsubscribe / close",
          reachForEn: "return () => unsubscribe / close",
        },
        {
          signal: "定时器回调里要用到 state",
          signalEn: "A timer callback needs to read state",
          reachFor: "函数式更新，别读闭包里的值",
          reachForEn: "Use the updater function form; do not read the captured value",
        },
        {
          signal: "「数值卡在第一次的结果不动」",
          signalEn: "A number is stuck on the result of the first run",
          reachFor: "过期闭包",
          reachForEn: "A stale closure",
        },
        {
          signal: "「越跑越快」「重复触发」",
          signalEn: "It speeds up, or fires more than once",
          reachFor: "漏了清理函数",
          reachForEn: "The cleanup function is missing",
        },
      ],
      recap: [
        "清理函数在「依赖变化前」和「卸载时」执行 —— 它负责拆掉这次 effect 建立的东西。",
        "effect 里出现定时器/监听器/订阅/连接/请求，就一定要 return。",
        "定时器回调必须用函数式更新，否则闭包里的 state 永远是旧的。",
        "漏掉 clearInterval 的实测后果：start/pause 四次得到 10 秒而不是 4 秒，卸载后定时器还活着。",
        "reset 要同时停表和清零；定时器 id 不该放 state。",
      ],
      recapEn: [
        "The cleanup function runs before the dependencies change and when the component is removed. Its job is to take down whatever this effect set up.",
        "If an effect starts a timer, a listener, a subscription, a connection, or a request, it must return a cleanup function.",
        "A timer callback has to use the updater function form, or the state it captured stays old forever.",
        "Measured result of a missing clearInterval: four start/pause cycles give 10 seconds instead of 4, and the timer is still alive after the component is gone.",
        "reset has to stop the clock and zero it. The timer id does not belong in state.",
      ],
    },

    /* ================================================================
       6.3 Fetch
       ================================================================ */
    {
      id: "r-var-fetch",
      title: "变式三 · fetch 取数：loading、error 与竞态",
      titleEn: "Variation 3 · fetching data: loading, error, and the race between two requests",
      blurb: "三个状态好写，难的是「用户切换很快时，慢的旧请求把新数据覆盖了」。",
      blurbEn:
        "The three states are easy. The hard part is when the user switches quickly and a slow old request overwrites the new data.",
      minutes: 18,
      objectives: [
        "写出 loading / error / data 三态的标准骨架",
        "知道 fetch 遇到 404 不会 reject，必须自己检查 res.ok",
        "解释竞态（race condition）怎么发生，并用清理函数解决",
        "分清 AbortController 和 ignore 标志各解决什么",
      ],
      objectivesEn: [
        "Write the standard skeleton for the three states: loading, error, data",
        "Know that fetch does not reject on a 404, so you have to check res.ok yourself",
        "Explain how a race condition happens, and fix it with a cleanup function",
        "Say what AbortController solves and what an ignore flag solves, and why they are different",
      ],
      whyForAssessment:
        "原始需求里就写了「API request / loading state / error state」，但源项目里没有任何网络请求，所以前面没讲。这道题补上，而且直接给到「竞态」这一层 —— 只写三态谁都会，竞态才是区分度所在。",
      whyForAssessmentEn:
        "The original requirements already list API request, loading state, and error state, but the source projects make no network calls, so no earlier lesson covered this. This question fills that gap and goes one level further, to the race between two requests. Anyone can write the three states; the race is what tells answers apart.",
      concepts: [
        {
          id: "three-states",
          heading: "三态骨架",
          headingEn: "The three-state skeleton",
          lede: "loading / error / data。顺序和优先级都有讲究。",
          ledeEn: "loading, error, data. Both the order and which one wins matter.",
          body: (
            <>
              <p>
                标准写法是三个 state 加三个提前返回：
              </p>
              <p>
                <strong>顺序不能乱。</strong>先判 loading，再判 error，
                最后才渲染数据。如果先判 <code>!user</code>，
                第一次渲染时（还在加载）就会闪一下「没有数据」。
              </p>
              <p>
                <strong><code>loading</code> 初始值必须是 <code>true</code>。</strong>
                写成 <code>false</code> 的话，首帧会先渲染「没有数据」再切成
                Loading，界面闪一下。因为 effect 是在渲染<strong>之后</strong>才跑的。
              </p>
              <p>
                <strong>换 id 时要把 <code>user</code> 清空。</strong>
                否则切到新用户的加载过程中，屏幕上还挂着上一个用户的资料 ——
                看起来像「数据错了」。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The standard shape is three pieces of state and three early returns:
              </p>
              <p>
                <strong>The order cannot be shuffled.</strong> Check loading, then error, and
                only then render the data. Check <code>!user</code> first and the very first
                render — still loading — flashes &ldquo;no data&rdquo;.
              </p>
              <p>
                <strong><code>loading</code> has to start at <code>true</code>.</strong>{" "}
                Start it at <code>false</code> and the first frame renders &ldquo;no
                data&rdquo; before switching to Loading, so the UI flickers. The effect runs{" "}
                <strong>after</strong> the render, that is why.
              </p>
              <p>
                <strong>Clear <code>user</code> when the id changes.</strong> Otherwise the
                previous user&rsquo;s profile sits on screen while the new one loads — and it
                looks like the data is simply wrong.
              </p>
            </>
          ),
          code: [
            tested(
              "tsx",
              `const [user, setUser] = useState<User | null>(null);
const [loading, setLoading] = useState(true);   // 初始就是 true
const [error, setError] = useState<string | null>(null);

// ...effect...

if (loading) return <p data-testid="loading">Loading…</p>;
if (error) return <p data-testid="error">出错了：{error}</p>;
if (!user) return <p data-testid="empty">没有数据</p>;
return <article data-testid="user">…</article>;`,
              {
                filename: "三态与渲染优先级",
                filenameEn: "The three states and the order they are checked in",
                codeEn: `const [user, setUser] = useState<User | null>(null);
const [loading, setLoading] = useState(true);   // true from the start
const [error, setError] = useState<string | null>(null);

// ...effect...

if (loading) return <p data-testid="loading">Loading…</p>;
if (error) return <p data-testid="error">出错了：{error}</p>;
if (!user) return <p data-testid="empty">没有数据</p>;
return <article data-testid="user">…</article>;`,
              },
            ),
          ],
        },
        {
          id: "res-ok",
          heading: "fetch 的第一个坑：404 不会 reject",
          headingEn: "The first trap in fetch: a 404 does not reject",
          lede: "这是所有 fetch 题的必考点。",
          ledeEn: "Every fetch question checks this one.",
          body: (
            <>
              <p>
                <code>fetch</code> 的 promise <strong>只在网络层失败时 reject</strong>
                （断网、DNS 挂了、CORS 被拒）。
                服务器返回 404 或 500 时，它是<strong>成功的</strong>——
                你成功地拿到了一个「失败响应」。
              </p>
              <p>
                所以不检查 <code>res.ok</code> 的话，
                <code>res.json()</code> 会去解析错误页的内容，
                然后你把它当用户数据渲染出来 ——
                轻则显示 <code>undefined</code>，重则整页崩。
              </p>
              <p>
                这一点和 <code>axios</code> 相反（axios 会对非 2xx 抛错），
                所以从 axios 转过来的人特别容易漏。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                A <code>fetch</code> promise{" "}
                <strong>only rejects when the network layer fails</strong> (offline, DNS
                down, CORS refused). When the server answers 404 or 500 the call{" "}
                <strong>succeeded</strong> — you successfully got a failure response.
              </p>
              <p>
                So if you skip the <code>res.ok</code> check, <code>res.json()</code> goes
                off and parses the error page, and then you render that as user data — mild
                case, it shows <code>undefined</code>; bad case, the page crashes.
              </p>
              <p>
                This is the opposite of <code>axios</code> (axios throws on any non-2xx), so
                people coming over from axios miss it especially often.
              </p>
            </>
          ),
          code: [
            tested(
              "tsx",
              `const res = await fetch(\`/api/users/\${userId}\`);

// fetch 只在网络层失败时 reject；404/500 是「成功拿到一个失败响应」
if (!res.ok) throw new Error(\`HTTP \${res.status}\`);

const data: User = await res.json();`,
              {
                filename: "必须自己检查 res.ok",
                filenameEn: "You have to check res.ok yourself",
                codeEn: `const res = await fetch(\`/api/users/\${userId}\`);

// fetch only rejects when the network layer fails; a 404 or 500 is a failure response you received successfully
if (!res.ok) throw new Error(\`HTTP \${res.status}\`);

const data: User = await res.json();`,
                explanation:
                  "测试里专门有一条 treats a 404 as an error：mock 一个 { ok: false, status: 404 }，断言界面显示 HTTP 404 而不是崩掉。",
                explanationEn:
                  "One test exists for exactly this, treats a 404 as an error: it mocks { ok: false, status: 404 } and asserts that the screen shows HTTP 404 instead of crashing.",
              },
            ),
          ],
        },
        {
          id: "race",
          heading: "真正的考点：竞态",
          headingEn: "What is really being tested: the race between two requests",
          lede: "用户飞快切换 id，两个请求同时在飞，谁后回来谁说话 —— 而后回来的可能是旧的。",
          ledeEn: "The user switches id quickly, two requests are in flight, and whichever answers last wins. The one that answers last may be the older one.",
          body: (
            <>
              <p>
                场景：用户点了用户 1（这个请求很慢，200ms），
                马上又点了用户 2（这个很快，10ms）。
              </p>
              <p>
                <strong>没有防护的话，最终屏幕上显示的是用户 1</strong>——
                因为它最后才回来，把用户 2 的数据覆盖了。
                URL 上是 2，界面上是 1。
              </p>
              <p>
                解法是在清理函数里立一个「这次请求作废」的旗子：
              </p>
              <p>
                <code>ignore</code> 是<strong>普通局部变量</strong>，
                每次 effect 执行都有自己的一份。清理函数通过闭包改的是
                <strong>它那一次</strong>的 <code>ignore</code>。
                所以旧请求回来时看到的是自己的 <code>ignore === true</code>，
                于是什么都不做。
              </p>
              <p>
                <strong>为什么不用 state 存这个旗子？</strong>
                因为它不参与渲染，而且每次 effect 需要独立的一份 ——
                state 是共享的，会互相干扰。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The scenario: the user clicks user 1 (a slow request, 200ms), then
                immediately clicks user 2 (a fast one, 10ms).
              </p>
              <p>
                <strong>With no guard, the screen ends up showing user 1</strong> — it came
                back last and overwrote user 2&rsquo;s data. The URL says 2, the UI says 1.
              </p>
              <p>
                The fix is to raise a &ldquo;this request no longer counts&rdquo; flag in the
                cleanup:
              </p>
              <p>
                <code>ignore</code> is <strong>a plain local variable</strong>, and every run
                of the effect gets its own. Through the closure, a cleanup only changes{" "}
                <strong>its own</strong> <code>ignore</code>. So when the old request comes
                back it sees its own <code>ignore === true</code> and does nothing.
              </p>
              <p>
                <strong>Why not keep the flag in state?</strong> Because it takes no part in
                rendering, and every run of the effect needs a separate one — state is
                shared, so the runs would interfere with each other.
              </p>
            </>
          ),
          code: [
            demo(
              "text",
              `t=0    用户点了 1 -> effect#1 发请求（要 200ms）
t=20   用户点了 2 -> effect#1 的清理函数跑：ignore#1 = true
                  -> effect#2 发请求（要 10ms）
t=30   用户 2 的响应回来 -> ignore#2 是 false -> setUser(用户2) ✓
t=200  用户 1 的响应回来 -> ignore#1 是 true  -> 直接丢掉 ✓

# 没有 ignore 的话，t=200 那一刻会 setUser(用户1)，
# 界面变回用户 1，而 URL 上还是 2。`,
              { filename: "竞态的时间线", filenameEn: "The timeline of the race" },
            ),
            tested(
              "tsx",
              `useEffect(() => {
  let ignore = false;                    // 每次 effect 自己的一份

  (async () => {
    const res = await fetch(\`/api/users/\${userId}\`);
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    const data = await res.json();
    if (!ignore) setUser(data);          // ← 作废了就什么都不做
  })();

  return () => { ignore = true; };       // 清理函数只做这一件事
}, [userId]);`,
              {
                filename: "竞态的解法",
                filenameEn: "How the race is settled",
                codeEn: `useEffect(() => {
  let ignore = false;                    // one of these per run of the effect

  (async () => {
    const res = await fetch(\`/api/users/\${userId}\`);
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    const data = await res.json();
    if (!ignore) setUser(data);          // ← if this run no longer counts, do nothing
  })();

  return () => { ignore = true; };       // the cleanup does only this
}, [userId]);`,
              },
            ),
          ],
        },
        {
          id: "abort",
          heading: "AbortController 和 ignore 解决的不是同一件事",
          headingEn: "AbortController and the ignore flag do not solve the same problem",
          lede: "两个都要，各管一头。",
          ledeEn: "You want both. Each one covers a different end.",
          body: (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>解决什么</th>
                      <th>不解决什么</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>ignore</code> 标志</td>
                      <td>
                        <strong>旧响应不许写 state</strong>（竞态、
                        以及卸载后 setState）
                      </td>
                      <td>网络请求本身还在跑，流量照走</td>
                    </tr>
                    <tr>
                      <td><code>AbortController</code></td>
                      <td>
                        <strong>真的把在途请求掐掉</strong>，省流量和服务器资源
                      </td>
                      <td>
                        不是所有环境都尊重 signal（比如被 mock 掉的 fetch、
                        某些 polyfill），所以不能只靠它
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                所以生产写法是<strong>两个一起用</strong>。
                另外 <code>abort()</code> 会让 <code>await fetch</code> 抛一个
                <code>AbortError</code> —— 那是我们自己干的，
                <strong>不能当成错误展示给用户</strong>，要在 catch 里过滤掉。
              </p>
              <p>
                测试里有一条 <code>aborts the in-flight request on unmount</code>：
                mock 的 fetch 把收到的 <code>signal</code> 存下来，
                卸载后断言 <code>signal.aborted === true</code>。
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
                      <th>What it solves</th>
                      <th>What it does not</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>The <code>ignore</code> flag</td>
                      <td>
                        <strong>An old response may not write state</strong> (races, plus
                        setState after unmount)
                      </td>
                      <td>The request itself keeps running and still burns bandwidth</td>
                    </tr>
                    <tr>
                      <td><code>AbortController</code></td>
                      <td>
                        <strong>Actually cuts off the in-flight request</strong>, saving
                        bandwidth and server work
                      </td>
                      <td>
                        Not every environment respects the signal (a mocked fetch, some
                        polyfills), so it cannot be your only guard
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                So production code <strong>uses both</strong>. One more thing:{" "}
                <code>abort()</code> makes <code>await fetch</code> throw an{" "}
                <code>AbortError</code> — we did that to ourselves, so{" "}
                <strong>it must not be shown to the user as an error</strong>. Filter it out
                in the catch.
              </p>
              <p>
                One test covers this,{" "}
                <code>aborts the in-flight request on unmount</code>: the mocked fetch stores
                the <code>signal</code> it received, and after unmount the test asserts{" "}
                <code>signal.aborted === true</code>.
              </p>
            </>
          ),
          code: [
            tested(
              "tsx",
              `const controller = new AbortController();

const res = await fetch(url, { signal: controller.signal });
// ...
} catch (e) {
  const err = e as Error;
  // 主动取消不是错误，别展示给用户
  if (!ignore && err.name !== "AbortError") setError(err.message);
}

return () => {
  ignore = true;
  controller.abort();
};`,
              {
                filename: "两者配合",
                filenameEn: "The two working together",
                codeEn: `const controller = new AbortController();

const res = await fetch(url, { signal: controller.signal });
// ...
} catch (e) {
  const err = e as Error;
  // Cancelling on purpose is not an error, so do not show it to the user
  if (!ignore && err.name !== "AbortError") setError(err.message);
}

return () => {
  ignore = true;
  controller.abort();
};`,
              },
            ),
          ],
        },
        {
          id: "full",
          heading: "完整答案",
          headingEn: "The complete answer",
          lede: "6 个测试全过，包含竞态和 abort 两条。",
          ledeEn: "All 6 tests pass, including one for the race and one for abort.",
          body: (
            <>
              <p>
                注意 async 逻辑包在一个<strong>立即执行的 async 箭头函数</strong>里，
                而不是把 effect 本身写成 async ——
                因为 effect 的返回值必须是清理函数，
                <code>async</code> 函数返回的是 Promise，React 会警告。
              </p>
              <p>
                <code>finally</code> 里也要判 <code>ignore</code>：
                否则旧请求回来时会把新请求的 loading 提前关掉，
                出现「转圈消失但数据还没到」的空窗。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Notice the async logic sits inside an{" "}
                <strong>immediately invoked async arrow function</strong> rather than making
                the effect itself async — the effect&rsquo;s return value has to be the
                cleanup, and an <code>async</code> function returns a Promise, which makes
                React warn.
              </p>
              <p>
                <code>finally</code> has to check <code>ignore</code> too: otherwise an old
                request coming back turns off the new request&rsquo;s loading too early, and
                you get a gap where the spinner is gone but the data has not arrived.
              </p>
            </>
          ),
          code: [
            tested("tsx", FETCH_SOLUTION, {
              filename: "src/components/UserCard/index.tsx（实测 6/6 通过）",
              collapsible: true,
            }),
          ],
        },
        {
          id: "verify",
          heading: "怎么验证",
          headingEn: "How to check it",
          lede: "竞态这种「偶尔才出现」的 bug，怎么稳定地测出来？答案是自己控制谁先回来。",
          ledeEn: "How do you reliably test a bug that only appears now and then? You decide yourself which request answers first.",
          body: (
            <>
              <p>
                关键手法是 <strong>deferred promise</strong>：
                造一个 promise，把它的 <code>resolve</code> 抓在手里，
                想让哪个请求什么时候回来，就手动调它。
                这样「慢的先发、快的后发、慢的最后才回来」这个顺序
                是<strong>确定的</strong>，不靠 <code>setTimeout</code> 赌时间。
              </p>
              <p>
                <code>vi.stubGlobal(&quot;fetch&quot;, ...)</code> 把全局
                <code>fetch</code> 换成假的，按 URL 决定返回哪个 promise。
                注意假的响应对象要自己带上 <code>ok</code> /
                <code>status</code> / <code>json()</code>——
                因为组件用的就是这三个。
              </p>
              <p>
                最后那条 <code>aborts the in-flight request on unmount</code>
                用了个小技巧：假 fetch 返回一个<strong>永不 settle 的
                promise</strong>（<code>new Promise(() =&gt; {})</code>），
                把收到的 <code>signal</code> 存下来，卸载后断言
                <code>signal.aborted === true</code>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The key move is a <strong>deferred promise</strong>: build a promise and keep
                its <code>resolve</code> in your hand, then call it whenever you want that
                request to come back. That makes the order &ldquo;slow one sent first, fast
                one second, slow one resolves last&rdquo; <strong>deterministic</strong>,
                instead of betting on <code>setTimeout</code>.
              </p>
              <p>
                <code>vi.stubGlobal(&quot;fetch&quot;, ...)</code> replaces the global{" "}
                <code>fetch</code> with a fake one that picks a promise by URL. The fake
                response object has to carry <code>ok</code> / <code>status</code> /{" "}
                <code>json()</code> itself — those three are exactly what the component uses.
              </p>
              <p>
                The last test, <code>aborts the in-flight request on unmount</code>, uses a
                small trick: the fake fetch returns a{" "}
                <strong>promise that never settles</strong>{" "}
                (<code>new Promise(() =&gt; {})</code>), stores the <code>signal</code> it
                received, and after unmount asserts{" "}
                <code>signal.aborted === true</code>.
              </p>
            </>
          ),
          code: [
            tested("bash", "npx vitest run src/UserCard.test.tsx   # 6 passed", {
              filename: "验证命令",
              filenameEn: "The command that verifies it",
            }),
            tested("tsx", FETCH_TEST, {
              filename: "src/UserCard.test.tsx（DrillLab 自出，本机跑过）",
              filenameEn: "src/UserCard.test.tsx (written for DrillLab, run here)",
              collapsible: true,
            }),
          ],
        },
      ],
      exercises: [
        {
          kind: "fill-blank",
          id: "r-var-fetch-blank",
          title: "补全取数 effect 的四个关键位置",
          titleEn: "Fill in the four key spots of the fetching effect",
          level: 2,
          generated: true,
          prompt: (
            <p>
              四个空。第 1 和第 4 个合起来解决竞态，第 2 个是 fetch 的经典坑。
            </p>
          ),
          promptEn: (
            <p>
              Four blanks. The first and the fourth together settle the race. The
              second is the classic fetch trap.
            </p>
          ),
          language: "tsx",
          filename: "src/components/UserCard/index.tsx",
          template: `useEffect(() => {
  let ___1___ = false;

  setLoading(true);
  setError(null);
  setUser(null);

  (async () => {
    try {
      const res = await fetch(\`/api/users/\${userId}\`);
      if (!res.___2___) throw new Error(\`HTTP \${res.status}\`);
      const data: User = await res.json();
      if (!ignore) setUser(data);
    } catch (e) {
      if (!ignore) setError((e as Error).message);
    } finally {
      if (!ignore) setLoading(false);
    }
  })();

  return () => { ignore = ___3___; };
}, [___4___]);`,
          blanks: [
            {
              n: 1,
              accept: ["ignore"],
              hint: "一个「这次请求还算不算数」的普通局部变量。",
              hintEn: "A plain local variable that says whether this request still counts.",
              why: (
                <>
                  <code>ignore</code>。它是<strong>普通局部变量</strong>，
                  不是 state 也不是 ref —— 因为每次 effect 都需要
                  <strong>独立的一份</strong>，而 state / ref 是共享的。
                  清理函数通过闭包改的正是它自己那一次的那一份。
                </>
              ),
              whyEn: (
                <>
                  <code>ignore</code>. It is a{" "}
                  <strong>plain local variable</strong>, not a state and not a ref,
                  because every run of the effect needs{" "}
                  <strong>its own copy</strong>, and a state or a ref is shared.
                  Through the closure, a cleanup changes exactly the copy that
                  belongs to its own run.
                </>
              ),
              width: 8,
            },
            {
              n: 2,
              accept: ["ok"],
              hint: "fetch 遇到 404 不会 reject，得自己判断。",
              hintEn: "A 404 does not make fetch reject, so you have to check it yourself.",
              why: (
                <>
                  <code>ok</code>。<code>res.ok</code> 在状态码
                  200–299 时为 true。
                  <br />
                  <strong>不检查它是 fetch 题最常见的错。</strong>
                  404 会让 <code>res.json()</code> 去解析错误页，
                  然后你把它当数据渲染 —— 显示 undefined 或直接崩。
                  这一点和 axios 相反（axios 会自己抛），所以特别容易漏。
                </>
              ),
              whyEn: (
                <>
                  <code>ok</code>. <code>res.ok</code> is true for status codes 200
                  to 299.
                  <br />
                  <strong>
                    Not checking it is the most common mistake in fetch questions.
                  </strong>{" "}
                  On a 404, <code>res.json()</code> parses the error page, and then
                  you render that as data: it shows undefined, or it crashes. This is
                  the opposite of axios, which throws on its own, so people miss it
                  especially often.
                </>
              ),
              width: 5,
            },
            {
              n: 3,
              accept: ["true"],
              hint: "清理函数要宣布「这次请求作废」。",
              hintEn: "The cleanup has to declare that this request no longer counts.",
              why: (
                <>
                  <code>true</code>。清理函数在
                  「<code>userId</code> 变化前」和「卸载时」执行，
                  把这一次的 <code>ignore</code> 置为 true，
                  于是它的响应回来后所有 <code>if (!ignore)</code> 都不成立，
                  一个 state 都不会被写。
                </>
              ),
              whyEn: (
                <>
                  <code>true</code>. The cleanup runs just before{" "}
                  <code>userId</code> changes, and again on unmount. It sets the{" "}
                  <code>ignore</code> of that run to true, so when its response
                  arrives every <code>if (!ignore)</code> is false and not one state
                  gets written.
                </>
              ),
              width: 6,
            },
            {
              n: 4,
              accept: ["userId"],
              hint: "换了哪个值就要重新取数？",
              hintEn: "Which value, when it changes, means you have to fetch again?",
              why: (
                <>
                  <code>userId</code>。
                  <br />
                  写 <code>[]</code> → 切换用户不会重新取数，永远显示第一个。
                  <br />
                  不写依赖数组 → 每次渲染都发请求，而 <code>setUser</code>
                  又触发渲染 → <strong>无限请求</strong>，这是 fetch 题的经典事故。
                </>
              ),
              whyEn: (
                <>
                  <code>userId</code>.
                  <br />
                  With <code>[]</code>, switching users never refetches and the first
                  user is shown forever.
                  <br />
                  With no dependency array, every render sends a request, and{" "}
                  <code>setUser</code> triggers another render:{" "}
                  <strong>requests without end</strong>, the classic accident in fetch
                  questions.
                </>
              ),
              width: 8,
            },
          ],
        },
        {
          kind: "code-completion",
          id: "r-var-fetch-write",
          title: "自己写出带竞态防护的取数 effect",
          titleEn: "Write the fetching effect with race protection yourself",
          level: 3,
          generated: true,
          prompt: (
            <p>
              三个 state 已给好。写出 effect 和三个提前返回。
              检查器会查 <code>res.ok</code>、清理函数、竞态防护和 AbortError 过滤。
            </p>
          ),
          promptEn: (
            <p>
              The three states are given. Write the effect and the three early
              returns. The checker looks for <code>res.ok</code>, the cleanup
              function, the race protection and the AbortError filter.
            </p>
          ),
          language: "tsx",
          filename: "src/components/UserCard/index.tsx",
          starter: `const UserCard: React.FC<{ userId: number }> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. effect：按 userId 取数，处理 loading / error，
  //    并且保证「切换很快时旧响应不覆盖新数据」

  // 2. 三个提前返回（注意顺序）

  return (
    <article data-testid="user">
      <h2 data-testid="user-name">{user.name}</h2>
      <p data-testid="user-email">{user.email}</p>
    </article>
  );
};`,
          starterEn: `const UserCard: React.FC<{ userId: number }> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. effect: fetch by userId, handle loading / error,
  //    and make sure a fast switch does not let an old response overwrite new data

  // 2. the three early returns (mind the order)

  return (
    <article data-testid="user">
      <h2 data-testid="user-name">{user.name}</h2>
      <p data-testid="user-email">{user.email}</p>
    </article>
  );
};`,
          requirements: [
            "从 /api/users/{userId} 取数",
            "非 2xx 响应要当成错误处理，错误信息形如 HTTP 404",
            "userId 变化时重新取数，并把上一次的结果作废（竞态防护）",
            "用 AbortController 掐掉在途请求，但 AbortError 不展示给用户",
            "渲染顺序：loading → error → 空数据 → 正常数据",
            "effect 本身不能是 async 函数",
          ],
          requirementsEn: [
            "Fetch from /api/users/{userId}",
            "Treat any non-2xx response as an error, with a message like HTTP 404",
            "Refetch when userId changes, and void the previous result (race protection)",
            "Use AbortController to cut off the request in flight, but never show AbortError to the user",
            "Render order: loading, then error, then no data, then the data",
            "The effect itself must not be an async function",
          ],
          checks: [
            {
              label: "调用了 fetch 并带上 userId",
              labelEn: "fetch is called with userId in the URL",
              must: "fetch\\s*\\(\\s*[`\"'][^`\"']*\\$\\{userId\\}",
            },
            { label: "检查了 res.ok", labelEn: "res.ok is checked", must: "!\\s*\\w+\\.ok" },
            {
              label: "有 ignore（或同义）的作废标志",
              labelEn: "There is an ignore flag (or an equivalent name)",
              must: "let\\s+(ignore|cancelled|canceled|stale)\\s*=\\s*false",
            },
            {
              label: "写 state 前判断了标志",
              labelEn: "The flag is checked before any state is written",
              must: "if\\s*\\(\\s*!\\s*(ignore|cancelled|canceled|stale)\\s*\\)",
            },
            {
              label: "清理函数把标志置 true",
              labelEn: "The cleanup sets the flag to true",
              must: "return\\s*\\(\\s*\\)\\s*=>[\\s\\S]{0,120}(ignore|cancelled|canceled|stale)\\s*=\\s*true",
            },
            { label: "用了 AbortController", labelEn: "AbortController is used", must: "new AbortController" },
            { label: "把 signal 传给了 fetch", labelEn: "The signal is passed to fetch", must: "signal" },
            { label: "过滤掉了 AbortError", labelEn: "AbortError is filtered out", must: "AbortError" },
            {
              label: "依赖数组里有 userId",
              labelEn: "The dependency array holds userId",
              must: "\\}\\s*,\\s*\\[[^\\]]*userId[^\\]]*\\]",
            },
            { label: "effect 本身不是 async", labelEn: "The effect itself is not async", mustNot: "useEffect\\s*\\(\\s*async" },
            {
              label: "loading 判断在 error 之前",
              labelEn: "loading is checked before error",
              must: "if\\s*\\(\\s*loading\\s*\\)[\\s\\S]{0,200}if\\s*\\(\\s*error\\s*\\)",
            },
          ],
          hints: [
            "先想一个具体场景：用户点了 1，还没回来又点了 2，而 1 比 2 慢。最后屏幕上该显示谁？你怎么让「1 的响应」知道自己已经过期了？",
            "答案在清理函数里。每次 effect 声明一个自己的 let ignore = false，清理函数把它置 true；所有 setState 前先看这个标志。另外 fetch 不会因为 404 而 reject，要自己看 res.ok；effect 不能写成 async（返回值必须是清理函数），所以把异步逻辑包进一个立即执行的 async 箭头函数。",
            `useEffect(() => {
  let ignore = false
  const controller = new AbortController()
  重置 loading / error / user
  ;(async () => {
    try {
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) throw new Error(\`HTTP \${res.status}\`)
      const data = await res.json()
      if (!ignore) setUser(data)
    } catch (e) {
      if (!ignore && e.name !== "AbortError") setError(e.message)
    } finally {
      if (!ignore) setLoading(false)
    }
  })()
  return () => { ignore = true; controller.abort() }
}, [userId])`,
            `let ignore = false;
const controller = new AbortController();

setLoading(true); setError(null); setUser(null);

(async () => {
  try {
    const res = await fetch(\`/api/users/\${userId}\`, { signal: controller.signal });
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    const data: User = await res.json();
    if (!ignore) setUser(data);
  } catch (e) {
    const err = e as Error;
    if (!ignore && err.name !== "AbortError") setError(err.message);
  } finally {
    if (!ignore) setLoading(false);
  }
})();

return () => { ignore = true; controller.abort(); };`,
          ],
          hintsEn: [
            "Picture one concrete case: the user clicks 1, and before it comes back clicks 2, and 1 is slower than 2. Who should be on screen at the end? How do you let the response for 1 know that it is out of date?",
            "The answer lives in the cleanup. Every run of the effect declares its own let ignore = false, and the cleanup sets it to true; check that flag before every setState. Also, fetch does not reject on a 404, so check res.ok yourself. And the effect cannot be async, because its return value has to be the cleanup, so put the async logic in an immediately invoked async arrow function.",
            `useEffect(() => {
  let ignore = false
  const controller = new AbortController()
  reset loading / error / user
  ;(async () => {
    try {
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) throw new Error(\`HTTP \${res.status}\`)
      const data = await res.json()
      if (!ignore) setUser(data)
    } catch (e) {
      if (!ignore && e.name !== "AbortError") setError(e.message)
    } finally {
      if (!ignore) setLoading(false)
    }
  })()
  return () => { ignore = true; controller.abort() }
}, [userId])`,
            `let ignore = false;
const controller = new AbortController();

setLoading(true); setError(null); setUser(null);

(async () => {
  try {
    const res = await fetch(\`/api/users/\${userId}\`, { signal: controller.signal });
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    const data: User = await res.json();
    if (!ignore) setUser(data);
  } catch (e) {
    const err = e as Error;
    if (!ignore && err.name !== "AbortError") setError(err.message);
  } finally {
    if (!ignore) setLoading(false);
  }
})();

return () => { ignore = true; controller.abort(); };`,
          ],
          solution: tested("tsx", FETCH_SOLUTION, {
            filename: "参考答案（实测 6/6 通过，含竞态与 abort 两条）",
            filenameEn: "Reference answer (6 of 6 pass here, including the race and the abort)",
            collapsible: true,
          }),
        },
        {
          kind: "debug",
          id: "r-var-fetch-debug",
          title: "Debug Lab · URL 上是用户 2，界面显示用户 1",
          level: 3,
          generated: true,
          prompt: (
            <p>
              快速点两个用户，界面最后显示的是<strong>先点的那个</strong>。
              慢一点点就没问题。控制台干净。
            </p>
          ),
          errorOutput: `# 没有任何报错。

$ npx vitest run src/UserCard.test.tsx

 ✕ a slow stale response must not overwrite the newer one（竞态）
   Expected element to have text content: 用户2
   Received:                              用户1

 Tests  1 failed | 5 passed (6)

# 手动复现：
#   1. 点用户 1（这个接口慢，200ms）
#   2. 立刻点用户 2（这个快，10ms）
#   3. 先看到用户 2 —— 对的
#   4. 200ms 后界面自己变成了用户 1  ← 错的，URL 上还是 2`,
          broken: demo(
            "tsx",
            `useEffect(() => {
  setLoading(true);
  setError(null);

  (async () => {
    try {
      const res = await fetch(\`/api/users/\${userId}\`);
      if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
      setUser(await res.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  })();
}, [userId]);`,
            { filename: "src/components/UserCard/index.tsx" },
          ),
          classify: {
            options: [
              { id: "a", label: "依赖数组错误 —— userId 没进依赖" },
              { id: "b", label: "竞态 —— 旧请求晚回来，覆盖了新请求的结果；effect 没有清理函数作废旧请求" },
              { id: "c", label: "fetch 没检查 res.ok" },
              { id: "d", label: "过期闭包 —— setUser 读到了旧的 user" },
            ],
            answer: "b",
          },
          locate: {
            question: "该怎么改？",
            options: [
              { id: "a", label: "加 let ignore = false，写 state 前判断它，并 return () => { ignore = true }" },
              { id: "b", label: "把 setUser 包进 setTimeout，延迟一点再写" },
              { id: "c", label: "在 effect 开头加 setUser(null)" },
              { id: "d", label: "把依赖数组改成 []" },
            ],
            answer: "a",
          },
          fixed: tested(
            "tsx",
            `useEffect(() => {
  let ignore = false;                      // 本次请求的「还算不算数」开关
  const controller = new AbortController();

  setLoading(true);
  setError(null);
  setUser(null);

  (async () => {
    try {
      const res = await fetch(\`/api/users/\${userId}\`, { signal: controller.signal });
      if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
      const data: User = await res.json();
      if (!ignore) setUser(data);
    } catch (e) {
      const err = e as Error;
      if (!ignore && err.name !== "AbortError") setError(err.message);
    } finally {
      if (!ignore) setLoading(false);
    }
  })();

  return () => {
    ignore = true;
    controller.abort();
  };
}, [userId]);`,
            { filename: "改对之后（6/6 通过）", highlight: [2, 15, 18, 23, 24, 25, 26] },
          ),
          rootCause: (
            <>
              <p>
                两个请求同时在飞，<strong>谁后回来谁写 state</strong>。
                而「后回来」和「更新」不是一回事 —— 慢的旧请求后回来，
                它写的是过期数据。
              </p>
              <p>
                这类 bug 在开发时几乎撞不到（本地接口都是几毫秒），
                一上线就出现，而且<strong>没有任何报错</strong>，
                只是用户偶尔看到「点了 A 却显示 B」。
              </p>
              <p>
                <code>ignore</code> 之所以有效，是因为它是
                <strong>每次 effect 各自独立的局部变量</strong>：
                清理函数通过闭包只改自己那一次的那一份。
                旧请求回来时看到的是「我已经作废了」。
              </p>
              <p>
                <strong>选项 C（在开头 setUser(null)）</strong>
                是个有用的改进（避免加载中显示旧用户），
                但<strong>治不了竞态</strong>——
                旧响应回来时照样会 setUser。
              </p>
              <p>
                <strong>选项 B（setTimeout 延迟）</strong>
                是典型的「靠时间赌」的修法，网络一慢就再次失效。
              </p>
              <p>
                顺带说：这套 <code>ignore</code> 写法<strong>同时</strong>解决了
                另一个常见问题 —— 组件卸载后请求才回来、
                对已卸载组件 setState。所以它是这类代码的标准骨架。
              </p>
            </>
          ),
          verify:
            "npx vitest run src/UserCard.test.tsx   # 6 passed，竞态那条应该变绿",
        },
      ],
      mistakes: [
        {
          wrong: demo(
            "tsx",
            `// ✗ effect 本身写成 async
useEffect(async () => {
  const res = await fetch(url);
  setUser(await res.json());
}, [userId]);`,
          ),
          why: (
            <>
              effect 的返回值必须是<strong>清理函数或 undefined</strong>，
              而 async 函数返回 Promise。React 会警告
              <code>useEffect must not return anything besides a function</code>，
              而且这样根本没法写清理函数。
              <br />
              正解是在 effect 内部包一个立即执行的 async 箭头函数。
            </>
          ),
          whyEn: (
            <>
              An effect must return <strong>a cleanup function or undefined</strong>, and
              an async function returns a <code>Promise</code>. React warns{" "}
              <code>useEffect must not return anything besides a function</code>, and this
              way there is no place to put a cleanup function at all.
              <br />
              The fix is to define an async arrow function inside the effect and call it
              immediately.
            </>
          ),
        },
        {
          wrong: demo(
            "tsx",
            `// ✗ 忘了依赖数组
useEffect(() => {
  fetch(url).then((r) => r.json()).then(setUser);
});`,
          ),
          why: (
            <>
              每次渲染都发一次请求，而 <code>setUser</code> 又触发渲染 ——
              <strong>无限请求循环</strong>。
              开发时表现为网络面板疯狂刷屏，接口被打爆。
              这是 fetch 题最经典的事故。
            </>
          ),
          whyEn: (
            <>
              Every render sends a request, and <code>setUser</code> causes another
              render — <strong>an endless request loop</strong>. In development the
              network panel never stops scrolling and the endpoint is flooded. This is the
              classic accident in fetch questions.
            </>
          ),
        },
        {
          wrong: demo(
            "tsx",
            `// ✗ 只在成功路径关 loading
try {
  const data = await res.json();
  setUser(data);
  setLoading(false);
} catch (e) {
  setError((e as Error).message);
}`,
          ),
          why: (
            <>
              出错时 <code>loading</code> 永远是 true，
              于是界面卡在「Loading…」，错误信息根本没机会显示
              （因为 <code>if (loading)</code> 先返回了）。
              <br />
              <strong>关 loading 要放在 <code>finally</code> 里。</strong>
            </>
          ),
          whyEn: (
            <>
              When the request fails, <code>loading</code> stays true forever, so the
              screen sits on Loading… and the error message never gets a chance to show
              (because <code>if (loading)</code> returned first).
              <br />
              <strong>Turn loading off inside <code>finally</code>.</strong>
            </>
          ),
        },
      ],
      transfer: [
        {
          signal: "「按 id 取数并展示」",
          signalEn: "Fetch by id and show the result",
          reachFor: "三态 + effect 依赖 [id]",
          reachForEn: "The three states, plus an effect with [id] as its dependency",
        },
        {
          signal: "用了 fetch",
          signalEn: "The code uses fetch",
          reachFor: "必须检查 res.ok，404 不会 reject",
          reachForEn: "Check res.ok; a 404 does not reject",
        },
        {
          signal: "「切换很快时数据错乱」",
          signalEn: "The data comes out wrong when you switch quickly",
          reachFor: "竞态，用 ignore 标志 + 清理函数",
          reachForEn: "A race. Use an ignore flag plus a cleanup function",
        },
        {
          signal: "「卸载后 setState 警告」",
          signalEn: "A setState warning after the component is removed",
          reachFor: "同一套 ignore 写法就解决了",
          reachForEn: "The same ignore pattern fixes it",
        },
        {
          signal: "「网络面板疯狂刷屏」",
          signalEn: "The network panel never stops scrolling",
          reachFor: "effect 漏了依赖数组",
          reachForEn: "The effect is missing its dependency array",
        },
        {
          signal: "「出错后卡在 Loading」",
          signalEn: "It sticks on Loading after an error",
          reachFor: "setLoading(false) 要放 finally",
          reachForEn: "setLoading(false) belongs in finally",
        },
      ],
      recap: [
        "三态骨架：loading 初始为 true，渲染顺序 loading → error → 空 → 数据。",
        "fetch 只在网络层失败时 reject，404/500 必须自己检查 res.ok。",
        "竞态：慢的旧请求后回来会覆盖新数据。解法是每次 effect 一个 ignore 局部变量 + 清理函数置 true。",
        "AbortController 掐网络，ignore 挡 state 写入 —— 两个都要，AbortError 不算错误。",
        "effect 不能是 async；关 loading 放 finally；依赖数组里必须有 id。",
      ],
      recapEn: [
        "The three-state skeleton: loading starts as true, and the render order is loading, then error, then empty, then data.",
        "fetch only rejects when the network layer fails. For 404 and 500 you have to check res.ok yourself.",
        "The race: a slow old request answers last and overwrites the new data. The fix is one local ignore variable per effect run, which the cleanup function sets to true.",
        "AbortController stops the network call, ignore blocks the state write. You need both, and an AbortError does not count as an error.",
        "An effect cannot be async. Turn loading off in finally. The dependency array must contain id.",
      ],
    },

    /* ================================================================
       6.4 递归评论树
       ================================================================ */
    {
      id: "r-var-comment-tree",
      title: "变式四 · 递归读取评论的评论",
      titleEn: "Variation 4 · reading replies to replies with recursion",
      blurb: "组件自己渲染自己；难点其实不在渲染，而在「给第四层加一条回复」怎么不改原树。",
      blurbEn:
        "A component renders itself. The hard part is not the rendering, it is adding a reply four levels down without changing the original tree.",
      minutes: 20,
      objectives: [
        "写出一个递归渲染自身的组件，并说清终止条件在哪",
        "递归统计树里的总条数",
        "实现「往任意深度的节点下加回复」的不可变更新",
        "解释为什么只重建路径上的节点、而不是深拷贝整棵树",
      ],
      objectivesEn: [
        "Write a component that renders itself, and say exactly where the recursion stops",
        "Count every item in the tree with recursion",
        "Add a reply under a node at any depth without changing the original tree",
        "Explain why you rebuild only the nodes on the path instead of deep-copying the whole tree",
      ],
      whyForAssessment:
        "评论嵌套、目录树、组织架构、文件夹 —— 树形数据是 assessment 里的常客，而且它同时考「递归组件」和「嵌套结构的不可变更新」两件事。后者是前面所有 CRUD 题的升级版：数组的不可变更新大家都会了，树的还得再想一层。",
      whyForAssessmentEn:
        "Nested comments, directory trees, org charts, folders: tree data shows up in exams all the time, and it tests two things at once — a recursive component, and updating a nested structure without changing the original. The second one is a step up from every CRUD question so far. Everyone can do it for an array; a tree needs one more level of thought.",
      concepts: [
        {
          id: "shape",
          heading: "数据形状：一个类型引用自己",
          headingEn: "The shape of the data: a type that refers to itself",
          lede: "评论的评论，本质上就是一个字段指回自己的类型。",
          ledeEn: "A comment on a comment is really just a type with one field that points back at itself.",
          body: (
            <>
              <p>
                「评论的评论」听起来复杂，写成类型就一行：
              </p>
              <p>
                <code>replies</code> 的类型是 <code>Comment[]</code> ——
                <strong>它引用了正在定义的这个类型自己</strong>。
                TypeScript 允许这样递归定义，这就是树。
              </p>
              <p>
                <strong>深度不在数据里。</strong>
                注意 <code>Comment</code> 上没有 <code>depth</code> 字段。
                深度是「它在树里的位置」，是渲染时算出来的，
                不该存进数据 —— 存了就要在移动节点时维护，
                而且很容易和实际结构不一致。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                &ldquo;Comments on comments&rdquo; sounds complicated; written as a type it is
                one line:
              </p>
              <p>
                <code>replies</code> is typed <code>Comment[]</code> —{" "}
                <strong>it refers to the very type being defined</strong>. TypeScript allows
                that recursion, and that is what a tree is.
              </p>
              <p>
                <strong>Depth is not in the data.</strong> Notice there is no{" "}
                <code>depth</code> field on <code>Comment</code>. Depth is &ldquo;where the
                node sits in the tree&rdquo;, worked out while rendering. It should not be
                stored — store it and you have to maintain it whenever a node moves, and it
                drifts out of sync with the real structure very easily.
              </p>
            </>
          ),
          code: [
            tested(
              "ts",
              `export type Comment = {
  id: number;
  author: string;
  body: string;
  replies: Comment[];   // 自己引用自己 —— 这就是「树」
};`,
              { filename: "src/types/Comment.ts" },
            ),
          ],
        },
        {
          id: "recursive-component",
          heading: "递归组件：终止条件不用写 if",
          headingEn: "A recursive component: you do not need an if to stop it",
          lede: "很多人卡在「递归怎么停」，其实 map 已经帮你停了。",
          ledeEn: "Many people get stuck on how the recursion stops. map already stops it for you.",
          body: (
            <>
              <p>
                递归组件就是<strong>在自己的 JSX 里渲染自己</strong>：
              </p>
              <p>
                <strong>终止条件在哪？</strong>
                在 <code>comment.replies.map(...)</code> 这一句里。
                当 <code>replies</code> 是空数组时，
                map 什么都不产出，于是不再有新的 <code>CommentNode</code>
                被创建 —— <strong>递归自然停住，不需要写
                <code>if (depth &gt; N) return null</code> 之类的东西</strong>。
              </p>
              <p>
                <strong>depth 靠参数往下传。</strong>
                每往下一层就 <code>depth + 1</code>，
                用来做缩进和 <code>data-depth</code>。
                根节点从 0 开始。
              </p>
              <p>
                <strong>key 还是 <code>child.id</code></strong>，
                和普通列表一样 —— 同一层里唯一就够了，不需要全树唯一。
              </p>
              <p>
                <strong>一个真实的注意点：</strong>
                如果数据可能有环（A 的回复里有 A），递归会栈溢出。
                真实接口一般不会，但如果题目提到「数据来自用户输入」，
                提一句「加一个 visited 集合或最大深度兜底」是加分的。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                A recursive component <strong>renders itself inside its own JSX</strong>:
              </p>
              <p>
                <strong>Where is the base case?</strong> In the line{" "}
                <code>comment.replies.map(...)</code>. When <code>replies</code> is an empty
                array, map produces nothing, so no new <code>CommentNode</code> is created —{" "}
                <strong>the recursion stops by itself and you do not need anything like{" "}
                <code>if (depth &gt; N) return null</code></strong>.
              </p>
              <p>
                <strong>Depth is passed down as a prop.</strong> One level down is{" "}
                <code>depth + 1</code>, used for the indent and for{" "}
                <code>data-depth</code>. The root starts at 0.
              </p>
              <p>
                <strong>The key is still <code>child.id</code></strong>, same as any list —
                unique among siblings is enough, it does not have to be unique across the
                whole tree.
              </p>
              <p>
                <strong>One real caveat:</strong> if the data can contain a cycle (A shows up
                inside its own replies), the recursion blows the stack. A real API usually
                will not, but if the question mentions &ldquo;the data comes from user
                input&rdquo;, saying &ldquo;add a visited set or a max depth as a
                backstop&rdquo; earns points.
              </p>
            </>
          ),
          code: [
            tested(
              "tsx",
              `{/* 递归：自己渲染自己。
    终止条件不用写 if —— replies 为空时 map 什么都不产出，递归自然停。 */}
{open && comment.replies.length > 0 && (
  <ul>
    {comment.replies.map((child) => (
      <CommentNode
        key={child.id}
        comment={child}
        depth={depth + 1}      // 往下一层
        onReply={onReply}
      />
    ))}
  </ul>
)}`,
              { filename: "递归那几行" },
            ),
          ],
        },
        {
          id: "recursive-count",
          heading: "递归统计：一行 reduce",
          headingEn: "Counting with recursion: one line of reduce",
          body: (
            <>
              <p>
                「总共多少条评论（含所有层级）」是这类题的常见附加要求。
                写成递归只有一行：
              </p>
              <p>
                读法：<strong>每个节点贡献「自己这 1 条 + 它子树的全部」</strong>。
                空数组时 <code>reduce</code> 直接返回初始值 0，
                递归在这里终止。
              </p>
              <p>
                同一个模式可以套出很多东西：最大深度
                （<code>1 + Math.max(...children)</code>）、
                查找某个 id、把树拍平成数组。
                <strong>树的题目基本都是这一个骨架换个累加方式。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                &ldquo;How many comments in total, counting every level&rdquo; is the usual
                add-on requirement for this kind of question. As a recursion it is one line:
              </p>
              <p>
                How to read it:{" "}
                <strong>every node contributes itself, 1, plus its whole subtree</strong>. On
                an empty array <code>reduce</code> returns the initial value 0, and the
                recursion ends there.
              </p>
              <p>
                The same pattern gets you plenty of other things: max depth
                (<code>1 + Math.max(...children)</code>), finding an id, flattening the tree
                into an array. <strong>Tree questions are mostly this one skeleton with a
                different accumulator.</strong>
              </p>
            </>
          ),
          code: [
            tested(
              "ts",
              `/** 递归统计总条数（含所有层级的回复） */
export function countComments(nodes: Comment[]): number {
  return nodes.reduce((sum, n) => sum + 1 + countComments(n.replies), 0);
}

// countComments([]) === 0            <- 递归终止
// 三层嵌套 + 两个旁支 === 5`,
              { filename: "递归统计" },
            ),
          ],
        },
        {
          id: "immutable-tree",
          heading: "真正的难点：给第四层加一条回复",
          headingEn: "The real difficulty: adding a reply four levels down",
          lede: "数组的不可变更新大家都会了。树的还要再想一层。",
          ledeEn: "Everyone can update an array without changing the original. A tree needs one more level of thought.",
          body: (
            <>
              <p>
                要求是「往 id 为 X 的节点的 <code>replies</code> 里加一条」，
                而 X 可能在任意深度。
              </p>
              <p>
                <strong>为什么不能直接找到它 push 进去？</strong>
                那是改原对象。React 比较的是根数组的引用 ——
                你改了深处的对象，根数组还是同一个，界面不更新。
                （就算你顺手 <code>setComments([...comments])</code> 造个新根，
                原数据也已经被污染了。）
              </p>
              <p>
                <strong>正解是递归地造新对象</strong>：
              </p>
              <p>
                这段代码值得逐句读：
              </p>
              <ul>
                <li>
                  <code>nodes.map(...)</code> —— 每一层都返回<strong>新数组</strong>。
                </li>
                <li>
                  找到目标：<code>{"{ ...node, replies: [...node.replies, reply] }"}</code>
                  —— 新节点对象 + 新 replies 数组。
                </li>
                <li>
                  不是目标：<strong>也要造新对象</strong>，
                  因为目标可能藏在它的子树里，
                  而 <code>addReply(node.replies, ...)</code> 可能返回新数组。
                </li>
                <li>
                  递归到叶子（<code>replies</code> 为空）时，
                  <code>map</code> 返回空数组，递归终止。
                </li>
              </ul>
              <p>
                <strong>一个容易误解的点：这不是深拷贝。</strong>
                只有<strong>从根到目标那条路径</strong>上的节点是新对象；
                旁边的分支虽然被 <code>{"{ ...node }"}</code> 包了一层新壳，
                但里面的 <code>body</code>、<code>author</code> 等值是共享的，
                更深的子树对象也是复用的。这正是 React 想要的：
                <strong>变了的路径引用变了，没变的部分引用不变</strong>，
                <code>React.memo</code> 才能正确跳过。
              </p>
              <p>
                测试里专门验证了这两件事：原树完全没动（用 <code>Object.freeze</code>
                深冻结，改了就抛错），以及路径上的对象确实是新引用。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The requirement is &ldquo;add one entry to the <code>replies</code> of the
                node whose id is X&rdquo;, and X can be at any depth.
              </p>
              <p>
                <strong>Why not just find it and push?</strong> That mutates the original
                object. React compares the reference of the root array — you changed something
                deep inside, the root array is still the same one, and the UI does not update.
                (Even if you then build a fresh root with{" "}
                <code>setComments([...comments])</code>, the original data is already
                polluted.)
              </p>
              <p>
                <strong>The right answer is to build new objects recursively</strong>:
              </p>
              <p>
                This code is worth reading line by line:
              </p>
              <ul>
                <li>
                  <code>nodes.map(...)</code> — every level returns a{" "}
                  <strong>new array</strong>.
                </li>
                <li>
                  Target found:{" "}
                  <code>{"{ ...node, replies: [...node.replies, reply] }"}</code> — a new node
                  object plus a new replies array.
                </li>
                <li>
                  Not the target: <strong>build a new object anyway</strong>, because the
                  target may be hiding in its subtree and{" "}
                  <code>addReply(node.replies, ...)</code> may return a new array.
                </li>
                <li>
                  When the recursion reaches a leaf (<code>replies</code> empty),{" "}
                  <code>map</code> returns an empty array and the recursion ends.
                </li>
              </ul>
              <p>
                <strong>One thing people misread: this is not a deep copy.</strong> Only the
                nodes <strong>on the path from the root to the target</strong> are new
                objects; the branches beside it do get a new shell from{" "}
                <code>{"{ ...node }"}</code>, but the values inside — <code>body</code>,{" "}
                <code>author</code> and the rest — are shared, and the deeper subtree objects
                are reused. That is exactly what React wants:{" "}
                <strong>references change along the path that changed and stay the same
                everywhere else</strong>, which is the only way <code>React.memo</code> can
                skip correctly.
              </p>
              <p>
                The tests check both of these: the original tree was not touched at all
                (deep-frozen with <code>Object.freeze</code>, so any write throws), and the
                objects on the path really are new references.
              </p>
            </>
          ),
          code: [
            tested("ts", TREE_HELPERS, {
              filename: "src/components/CommentTree/index.tsx（两个纯函数）",
            }),
            demo(
              "ts",
              `// ✗ 找到就 push —— 改了原树，界面不更新
function addReplyBad(nodes: Comment[], parentId: number, reply: Comment) {
  for (const n of nodes) {
    if (n.id === parentId) { n.replies.push(reply); return; }
    addReplyBad(n.replies, parentId, reply);
  }
}

// ✗ 深拷贝整棵树 —— 结果对，但所有节点引用都变了，
//   React.memo 全部失效，大树上会明显卡
const next = JSON.parse(JSON.stringify(comments));`,
              { filename: "两种错法" },
            ),
          ],
        },
        {
          id: "full",
          heading: "完整答案",
          headingEn: "The complete answer",
          lede: "7 个测试全过，含「深层回复落在正确位置」和「原树未被修改」。",
          ledeEn: "All 7 tests pass, including one that a deep reply lands in the right place and one that the original tree was not changed.",
          body: (
            <>
              <p>
                <strong>折叠状态放在每个节点自己身上</strong>
                （<code>CommentNode</code> 内部的 <code>open</code>），
                不是提到顶层。因为「这一条折没折」只有它自己关心 ——
                提到顶层就要维护一个 id 集合，纯属自找麻烦。
              </p>
              <p>
                <code>onReply</code> 从顶层一路传下去。
                树很深时这会显得啰嗦，真实项目里会用 Context 或状态库 ——
                但在 assessment 里<strong>老老实实传 props 是最稳的答案</strong>，
                除非题目明确要求用 Context。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>Collapsed state lives on each node</strong> (<code>open</code> inside{" "}
                <code>CommentNode</code>), not lifted to the top. Whether this one comment is
                folded is nobody else&rsquo;s business — lift it and you have to maintain a set
                of ids, which is trouble you invented for yourself.
              </p>
              <p>
                <code>onReply</code> is passed all the way down from the top. On a deep tree
                that gets wordy, and a real project would reach for Context or a state library
                — but in an assessment{" "}
                <strong>plain, honest prop passing is the safest answer</strong>, unless the
                question explicitly asks for Context.
              </p>
            </>
          ),
          code: [
            tested("tsx", TREE_SOLUTION, {
              filename: "src/components/CommentTree/index.tsx（组件部分，实测 7/7 通过）",
              collapsible: true,
            }),
          ],
        },
        {
          id: "verify",
          heading: "怎么验证",
          headingEn: "How to check it",
          lede: "「有没有偷偷改原树」这件事，用深冻结一测就知道。",
          ledeEn: "To find out whether the original tree was quietly changed, freeze it all the way down and run the test.",
          body: (
            <>
              <p>
                <code>deepFreeze</code> 递归地把原树每一层都
                <code>Object.freeze</code> 掉。冻结之后任何写操作
                在严格模式下（TS/ESM 默认严格）会<strong>直接抛
                <code>TypeError</code></strong>，而不是静默失败。
              </p>
              <p>
                所以如果你的 <code>addReply</code> 里有一处
                <code>push</code> 或直接赋值，
                测试会报 <code>Cannot add property 0, object is not extensible</code>
                —— <strong>不可变性从「靠人肉 review」变成了「机器能查」</strong>。
                这个技巧在任何考不可变更新的题里都能用。
              </p>
              <p>
                第 3 条测的是「<strong>只重建路径</strong>」：
                路径上的节点必须 <code>not.toBe</code> 原来那个（新引用），
                而旁边的分支内容保持一致。
                这一条能把「深拷贝糊过去」的解法区分出来。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>deepFreeze</code> recursively runs <code>Object.freeze</code> on every
                level of the original tree. Once frozen, any write{" "}
                <strong>throws a <code>TypeError</code> outright</strong> in strict mode
                (TS/ESM are strict by default) instead of failing silently.
              </p>
              <p>
                So if your <code>addReply</code> has one <code>push</code> or one direct
                assignment in it, the test reports{" "}
                <code>Cannot add property 0, object is not extensible</code> —{" "}
                <strong>immutability goes from &ldquo;somebody has to catch it in
                review&rdquo; to &ldquo;a machine checks it&rdquo;</strong>. The trick works in
                any question about immutable updates.
              </p>
              <p>
                Test 3 checks that <strong>only the path is rebuilt</strong>: nodes on the path
                must be <code>not.toBe</code> the originals (new references), while the
                branches beside it keep the same content. That test separates the real answer
                from &ldquo;deep copy and hope&rdquo;.
              </p>
            </>
          ),
          code: [
            tested("bash", "npx vitest run src/CommentTree.test.tsx   # 7 passed", {
              filename: "验证命令",
            }),
            tested("tsx", TREE_TEST, {
              filename: "src/CommentTree.test.tsx（DrillLab 自出，本机跑过）",
              collapsible: true,
            }),
          ],
        },
      ],
      exercises: [
        {
          kind: "fill-blank",
          id: "r-var-tree-blank",
          title: "补全递归统计与递归渲染",
          level: 2,
          generated: true,
          prompt: (
            <p>
              四个空。第 2 个是递归调用本身，第 4 个是「往下一层」。
            </p>
          ),
          language: "tsx",
          filename: "src/components/CommentTree/index.tsx",
          template: `// 递归统计总条数
export function countComments(nodes: Comment[]): number {
  return nodes.reduce((sum, n) => sum + ___1___ + ___2___(n.replies), 0);
}

// 递归渲染
{comment.replies.length > 0 && (
  <ul>
    {comment.replies.map((child) => (
      <___3___
        key={child.id}
        comment={child}
        depth={___4___}
        onReply={onReply}
      />
    ))}
  </ul>
)}`,
          blanks: [
            {
              n: 1,
              accept: ["1"],
              hint: "每个节点先把自己算进去。",
              why: (
                <>
                  <code>1</code> —— 当前这个节点自己。
                  <br />
                  递归统计的通用读法是「<strong>我自己 + 我的子树</strong>」。
                  漏了这个 1，最后会数出 0（因为叶子都只贡献子树的 0）。
                </>
              ),
              width: 4,
            },
            {
              n: 2,
              accept: ["countComments"],
              hint: "函数在自己的函数体里调自己。",
              why: (
                <>
                  <code>countComments</code>。这就是递归。
                  <br />
                  终止条件不用写 <code>if</code>：
                  <code>replies</code> 为空时 <code>reduce</code>
                  直接返回初始值 <code>0</code>。
                </>
              ),
              width: 15,
            },
            {
              n: 3,
              accept: ["CommentNode"],
              hint: "组件在自己的 JSX 里渲染自己。",
              why: (
                <>
                  <code>CommentNode</code> —— 组件递归渲染自身。
                  <br />
                  这就是「评论的评论的评论」能无限嵌套的原因：
                  你只写了一层，剩下的靠递归展开。
                </>
              ),
              width: 13,
            },
            {
              n: 4,
              accept: ["depth + 1", "depth+1"],
              hint: "子节点比自己深一层。",
              why: (
                <>
                  <code>depth + 1</code>。深度靠参数往下传，
                  用来做缩进和 <code>data-depth</code>。
                  <br />
                  <strong>不要把 depth 存进数据</strong>——
                  它是「节点在树里的位置」，是渲染时算的；
                  存进去就得在移动节点时维护，很容易和实际结构不一致。
                </>
              ),
              width: 11,
            },
          ],
        },
        {
          kind: "code-completion",
          id: "r-var-tree-write",
          title: "写出树形数据的不可变更新",
          level: 3,
          generated: true,
          prompt: (
            <p>
              这是这道题真正的难点。目标节点可能在任意深度，
              要返回一棵新树，而且<strong>原树一个字节都不能改</strong>。
            </p>
          ),
          language: "ts",
          filename: "src/components/CommentTree/index.tsx",
          starter: `import type { Comment } from "../../types/Comment";

/**
 * 往 parentId 这个节点的 replies 里加一条 reply，返回全新的树。
 *
 * 要求：
 *   · parentId 可能在任意深度
 *   · 不许修改传进来的 nodes（调用方会深冻结它来检查）
 *   · 不要深拷贝整棵树
 */
export function addReply(
  nodes: Comment[],
  parentId: number,
  reply: Comment,
): Comment[] {

}`,
          requirements: [
            "找到 id === parentId 的节点，把 reply 追加到它的 replies 末尾",
            "返回新数组、新节点对象，不修改原数据",
            "目标可能在任意深度，需要递归往下找",
            "不许用 JSON.parse(JSON.stringify(...)) 深拷贝",
            "不许用 push / splice / 直接赋值",
          ],
          checks: [
            { label: "用 map 返回新数组", must: "nodes\\.map\\s*\\(" },
            { label: "按 parentId 比较", must: "\\.id\\s*===?\\s*parentId" },
            { label: "命中时用对象展开造新节点", must: "\\{\\s*\\.\\.\\.\\s*\\w+\\s*,\\s*replies" },
            { label: "命中时用数组展开追加 reply", must: "\\[\\s*\\.\\.\\.\\s*\\w+\\.replies\\s*,\\s*reply\\s*\\]" },
            { label: "未命中时递归往下找", must: "addReply\\s*\\(\\s*\\w+\\.replies" },
            { label: "没有深拷贝", mustNot: "JSON\\.parse|structuredClone" },
            { label: "没有 push / splice", mustNot: "\\.(push|splice|unshift)\\s*\\(" },
            { label: "没有直接赋值改原对象", mustNot: "\\w+\\.replies\\s*=[^=]" },
          ],
          hints: [
            "先在纸上画一棵三层的树，标出目标节点，然后问自己：从根走到它，路径上有哪几个对象？这些对象里，哪些的内容真的变了？没在路径上的分支需要变吗？",
            "用 map 逐层往下。每一层有两种情况：这个节点就是目标（造新节点 + 新 replies），或者目标在它的子树里（也要造新节点，但 replies 交给递归）。注意两种情况都要返回新对象 —— 因为你在递归返回之前并不知道目标在不在下面。",
            `return nodes.map(每个节点 => {
  如果 这个节点的 id === parentId:
      返回 { 展开这个节点, replies: [展开它的 replies, reply] }
  否则:
      返回 { 展开这个节点, replies: 递归调用(这个节点的 replies, parentId, reply) }
})`,
            `return nodes.map((node) => {
  if (node.id === parentId) {
    return { ...node, replies: [...node.replies, reply] };
  }
  return { ...node, replies: addReply(node.replies, parentId, reply) };
});`,
          ],
          solution: tested(
            "ts",
            `export function addReply(nodes: Comment[], parentId: number, reply: Comment): Comment[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, replies: [...node.replies, reply] };
    }
    // 目标可能在更深处，继续往下找
    return { ...node, replies: addReply(node.replies, parentId, reply) };
  });
}`,
            {
              filename: "参考答案（实测通过，含原树深冻结检查）",
              explanation:
                "测试用 Object.freeze 深冻结原树后调用它 —— 如果实现里有任何一处直接改原对象，严格模式下会立刻抛错。这是验证「真的不可变」最省事的办法。",
            },
          ),
        },
        {
          kind: "debug",
          id: "r-var-tree-debug",
          title: "Debug Lab · 回复加进去了，界面不动",
          level: 3,
          generated: true,
          prompt: (
            <p>
              给深层评论加回复，<code>console.log</code> 打出来的树里
              新回复确实在，但界面没变化。控制台干净。
            </p>
          ),
          errorOutput: `# 没有任何报错。

$ npx vitest run src/CommentTree.test.tsx

 ✕ addReply 挂到深层节点，且不改原树
   TypeError: Cannot add property 0, object is not extensible
   （测试把原树深冻结了，实现试图直接修改它）

 ✕ 给三层的评论再回复，落在正确的位置
   Unable to find an element with the text: 第四层

# 手动复现：点某条评论的 Reply、输入、发送
#   console.log(comments) -> 新回复确实在树里
#   屏幕 -> 一点变化都没有`,
          broken: demo(
            "tsx",
            `function addReply(nodes: Comment[], parentId: number, reply: Comment) {
  for (const node of nodes) {
    if (node.id === parentId) {
      node.replies.push(reply);          // 找到就塞进去
      return nodes;
    }
    addReply(node.replies, parentId, reply);
  }
  return nodes;
}

const handleReply = (parentId: number, text: string) => {
  const reply = { id: Date.now(), author: "我", body: text, replies: [] };
  setComments(addReply(comments, parentId, reply));
};`,
            { filename: "src/components/CommentTree/index.tsx", highlight: [4, 15] },
          ),
          classify: {
            options: [
              { id: "a", label: "递归写错了 —— 没有终止条件" },
              { id: "b", label: "状态更新错误 —— 直接改了原树，setComments 收到的还是同一个引用" },
              { id: "c", label: "key 用了 index" },
              { id: "d", label: "过期闭包 —— comments 是旧值" },
            ],
            answer: "b",
          },
          locate: {
            question: "根本问题是哪一句？",
            options: [
              { id: "a", label: "node.replies.push(reply) —— 应该用 map + 展开造新对象" },
              { id: "b", label: "return nodes —— 应该 return [...nodes]" },
              { id: "c", label: "for...of 应该换成 forEach" },
              { id: "d", label: "reply 的 id 应该用 Math.random()" },
            ],
            answer: "a",
          },
          fixed: tested(
            "ts",
            `export function addReply(nodes: Comment[], parentId: number, reply: Comment): Comment[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, replies: [...node.replies, reply] };
    }
    return { ...node, replies: addReply(node.replies, parentId, reply) };
  });
}

// 调用处也改成函数式更新
const handleReply = (parentId: number, text: string) => {
  const reply: Comment = { id: Date.now(), author: "我", body: text, replies: [] };
  setComments((prev) => addReply(prev, parentId, reply));
};`,
            { filename: "改对之后（7/7 通过）" },
          ),
          rootCause: (
            <>
              <p>
                <code>push</code> 改的是<strong>原来那个 replies 数组</strong>，
                然后 <code>return nodes</code> 返回的还是<strong>原来那个根数组</strong>。
                <code>setComments</code> 拿到的引用和当前 state 一模一样，
                React 判断「没变化」，跳过重渲染。
              </p>
              <p>
                这和 Q1 里 <code>notes.push()</code> 那个 bug 是<strong>同一个病</strong>，
                只是发生在树上，所以更难看出来 ——
                因为「新数据确实在 <code>console.log</code> 里」这个假象更强。
              </p>
              <p>
                <strong>选项 B（<code>return [...nodes]</code>）为什么不够？</strong>
                它让根数组的引用变了，界面确实会更新一次 ——
                <strong>但原数据已经被污染了</strong>。后果是：
                原树的历史状态被破坏（做不了撤销），
                如果同一份数据在别处也被引用会跟着变，
                而且深层节点的引用没变，用了
                <code>React.memo</code> 的子树仍然不会重渲染。
                <strong>这是「让症状消失」而不是修好。</strong>
              </p>
              <p>
                <strong>识别这一类 bug 的固定特征：</strong>
                没有报错 + <code>console.log</code> 数据是对的 + 界面不动
                = 改了原对象。数组、对象、树都一样。
              </p>
            </>
          ),
          verify:
            "npx vitest run src/CommentTree.test.tsx   # 7 passed，含深冻结那条",
        },
      ],
      mistakes: [
        {
          wrong: demo(
            "tsx",
            `// ✗ 把 depth 存进数据
type Comment = { id: number; body: string; depth: number; replies: Comment[] };`,
          ),
          why: (
            <>
              深度是「节点在树里的位置」，是渲染时算出来的。
              存进数据之后，任何移动/嵌套操作都要递归维护它，
              一漏就和实际结构不一致。
              <strong>用参数往下传 <code>depth + 1</code> 就够了。</strong>
            </>
          ),
          whyEn: (
            <>
              Depth is where the node sits in the tree, and it is worked out while
              rendering. Store it in the data and every move or nesting operation has to
              update it recursively; miss one and it no longer matches the real structure.{" "}
              <strong>Passing <code>depth + 1</code> down as an argument is enough.</strong>
            </>
          ),
        },
        {
          wrong: demo(
            "tsx",
            `// ✗ 折叠状态提到顶层
const [collapsed, setCollapsed] = useState<Set<number>>(new Set());`,
          ),
          why: (
            <>
              「这一条折没折」只有它自己关心，属于典型的局部 state。
              提到顶层要维护一个 id 集合，还得处理 Set 的不可变更新，
              纯属自找麻烦。
              <br />
              例外：如果题目要求「一键全部折叠」，那才需要提上去。
            </>
          ),
          whyEn: (
            <>
              Whether one item is collapsed matters only to that item, which makes it a
              textbook piece of local state. Lifting it to the top means keeping a set of
              ids and replacing that Set on every change — trouble you did not have to ask
              for.
              <br />
              One exception: if the task asks for collapse everything with one button, then
              it does have to move up.
            </>
          ),
        },
        {
          wrong: demo(
            "ts",
            `// ✗ 用深拷贝图省事
const next = structuredClone(comments);
findNode(next, parentId).replies.push(reply);
setComments(next);`,
          ),
          why: (
            <>
              结果是对的，原树也没被改 —— 所以测试可能全过。
              但<strong>每个节点的引用都变了</strong>，
              用了 <code>React.memo</code> 的子树全部重渲染，
              大树上会明显卡。而且深拷贝本身在大数据上很贵。
              <br />
              <strong>只重建路径</strong>才是这道题想考的。
            </>
          ),
          whyEn: (
            <>
              The result is right and the original tree is untouched, so every test may
              pass. But <strong>every node now has a new reference</strong>, so every
              subtree wrapped in <code>React.memo</code> re-renders, and a large tree
              visibly stalls. A deep copy is expensive on large data on its own too.
              <br />
              <strong>Rebuilding only the path</strong> is what this question is asking
              for.
            </>
          ),
        },
      ],
      transfer: [
        {
          signal: "「评论的评论」「目录树」「组织架构」",
          signalEn: "Comments on comments, directory trees, org charts",
          reachFor: "类型自引用 + 递归组件",
          reachForEn: "A type that refers to itself, plus a recursive component",
        },
        {
          signal: "递归组件怎么停",
          signalEn: "How a recursive component stops",
          reachFor: "空数组 map 什么都不产出，天然终止",
          reachForEn: "map over an empty array produces nothing, so it stops by itself",
        },
        {
          signal: "「统计/查找/拍平树」",
          signalEn: "Count, search, or flatten a tree",
          reachFor: "reduce 递归：自己 + 子树",
          reachForEn: "Recursive reduce: this node plus its subtrees",
        },
        {
          signal: "「给树里某个节点加/改/删」",
          signalEn: "Add, edit, or delete one node inside a tree",
          reachFor: "map 递归，只重建路径上的节点",
          reachForEn: "Recursive map; rebuild only the nodes on the path",
        },
        {
          signal: "需要缩进或层级样式",
          signalEn: "You need indentation or per-level styling",
          reachFor: "depth 参数往下传，别存进数据",
          reachForEn: "Pass depth down as an argument; do not store it in the data",
        },
        {
          signal: "没报错 + 日志对 + 界面不动",
          signalEn: "No error, the log looks right, the screen does not change",
          reachFor: "改了原对象（数组和树都一样）",
          reachForEn: "The original object was changed in place, in a tree just as in an array",
        },
      ],
      recap: [
        "「评论的评论」= 类型里有个字段指回自己；深度不存数据，渲染时用参数传。",
        "递归组件在自己的 JSX 里渲染自己；空 replies 让 map 什么都不产出，递归自然终止。",
        "递归统计的骨架是「自己 1 条 + 子树全部」，同一模式能算深度、查找、拍平。",
        "树的不可变更新：map 递归，命中就 { ...node, replies: [...replies, reply] }，未命中也要造新节点并递归子树。",
        "只重建从根到目标的路径，不要深拷贝整棵树 —— 否则 React.memo 全失效。",
      ],
      recapEn: [
        "A comment on a comment means a type with a field pointing back at itself. Depth is not stored in the data; it is passed down as an argument while rendering.",
        "A recursive component renders itself inside its own JSX. Empty replies make map produce nothing, so the recursion ends on its own.",
        "The shape of a recursive count is: this node counts 1, plus everything in its subtrees. The same pattern computes depth, searches, and flattens.",
        "Updating a tree without changing the original: recursive map. On a match, { ...node, replies: [...replies, reply] }. On a miss, still build a new node and recurse into its subtrees.",
        "Rebuild only the path from the root down to the target. Do not deep-copy the whole tree, or React.memo stops helping anywhere.",
      ],
    },

    /* ================================================================
       6.5 主题切换（Context）
       ================================================================ */
    {
      id: "r-var-theme-context",
      title: "变式五 · 主题切换：Context 怎么用",
      titleEn: "Variation 5 · theme switching: how to use Context",
      blurb: "createContext 三行就写完了。真正会挂的地方是「value 每次都是新对象」和「忘了套 Provider」。",
      blurbEn:
        "createContext takes three lines. What actually breaks is a value that is a new object every render, and a missing Provider.",
      minutes: 20,
      objectives: [
        "说清什么时候该上 Context、什么时候不该",
        "写出 createContext + Provider + useContext 这一套，并包成自定义 hook",
        "解释 context value 为什么必须 useMemo、toggleTheme 为什么要 useCallback",
        "看懂「忘了套 Provider」的真实报错，并知道怎么让它报得更清楚",
      ],
      objectivesEn: [
        "Say when Context is the right tool and when it is not",
        "Write the createContext + Provider + useContext set, and wrap it in a custom hook",
        "Explain why the context value needs useMemo and why toggleTheme needs useCallback",
        "Read the real error you get when the Provider is missing, and know how to make that error clearer",
      ],
      whyForAssessment:
        "主题切换是 Context 最常见的考法，同一套骨架换个壳就是「当前登录用户」「语言」「购物车」。源项目里一个 Context 都没有，所以前面没讲。这道题除了考 API 会不会写，更考两个细节：value 有没有记忆化、忘了 Provider 时错误信息够不够清楚 —— 这两点是区分「抄过教程」和「真写过」的地方。",
      whyForAssessmentEn:
        "Theme switching is the most common way exams test Context. The same skeleton with a different label becomes the current user, the language, or the shopping cart. The source projects contain no Context at all, so no earlier lesson covered it. Beyond writing the API correctly, this question tests two details: whether the value is memoized, and whether the error is clear when the Provider is missing. Those two separate someone who copied a tutorial from someone who has really written this.",
      concepts: [
        {
          id: "why",
          heading: "为什么要 Context：props 传不动了",
          headingEn: "Why Context exists: props cannot carry the value that far",
          lede: "Context 解决的是「跨很多层传同一个值」，不是「状态管理」。",
          ledeEn: "Context solves one problem: passing the same value through many levels. It is not state management.",
          body: (
            <>
              <p>
                前面讲过 <strong>props 往下流、事件往上报</strong>。
                这套规则在两三层内很好用，但主题这种东西
                <strong>整棵树都要读</strong>：
              </p>
              <p>
                中间那些组件根本不关心主题，却被迫接一个
                <code>theme</code> 再往下递。这叫
                <strong>props 层层透传（prop drilling）</strong>。
                加一个 <code>toggleTheme</code> 就得再透传一次。
              </p>
              <p>
                Context 的作用就是<strong>跳过中间层</strong>：
                Provider 在上面放一个值，子树里任何深度的组件直接取。
              </p>
              <p>
                <strong>但别把它当状态管理器用。</strong>
                判断标准很简单：
              </p>
              <ul>
                <li>
                  <strong>该用</strong>：整棵树都要读、而且<strong>不常变</strong>的东西
                  —— 主题、当前用户、语言、路由。
                </li>
                <li>
                  <strong>不该用</strong>：只有两三层要用的（直接传 props）；
                  或者每秒都在变的（context 一变，
                  <strong>所有</strong>消费者都重渲染，会卡）。
                </li>
              </ul>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Earlier we said <strong>props flow down, events report up</strong>. That rule
                works nicely for two or three levels, but something like a theme{" "}
                <strong>has to be readable by the whole tree</strong>:
              </p>
              <p>
                The components in the middle do not care about the theme at all, yet they are
                forced to take a <code>theme</code> and hand it further down. That is{" "}
                <strong>prop drilling</strong>. Add a <code>toggleTheme</code> and you drill it
                all over again.
              </p>
              <p>
                What Context does is <strong>skip the middle</strong>: a Provider puts a value
                up top, and a component at any depth in the subtree reads it directly.
              </p>
              <p>
                <strong>But do not use it as a state manager.</strong> The test is simple:
              </p>
              <ul>
                <li>
                  <strong>Use it</strong> for things the whole tree reads that{" "}
                  <strong>rarely change</strong> — theme, current user, language, route.
                </li>
                <li>
                  <strong>Do not use it</strong> for something only two or three levels need
                  (pass props); or for something that changes every second (when a context
                  changes, <strong>every</strong> consumer re-renders, and it drags).
                </li>
              </ul>
            </>
          ),
          code: [
            demo(
              "tsx",
              `// ✗ prop drilling：中间三层根本不用 theme，只是被迫往下递
<App theme={theme}>
  <Layout theme={theme}>
    <Sidebar theme={theme}>
      <ThemedCard theme={theme} />   {/* 只有这里真的要用 */}
    </Sidebar>
  </Layout>
</App>

// ✓ Context：中间层什么都不用管
<ThemeProvider>
  <Layout>
    <Sidebar>
      <ThemedCard />                 {/* 自己去 context 里取 */}
    </Sidebar>
  </Layout>
</ThemeProvider>`,
              { filename: "两种传法" },
            ),
          ],
        },
        {
          id: "three-parts",
          heading: "Context 只有三个动作，加一个自定义 hook",
          headingEn: "Context has only three moves, plus a custom hook",
          lede: "createContext 造管道、Provider 灌值、useContext 取值。第四步是自己包一层。",
          ledeEn: "createContext builds the pipe, Provider puts a value into it, useContext takes the value out. The fourth step is a wrapper you write yourself.",
          body: (
            <>
              <p>
                <strong>1. <code>createContext</code>—— 造一根管道。</strong>
                参数是「没有 Provider 时的默认值」。
              </p>
              <p>
                <strong>2. <code>&lt;Ctx.Provider value={"{...}"}&gt;</code>
                —— 往管道里灌值。</strong>
                只有它的<strong>子树</strong>能取到。
              </p>
              <p>
                <strong>3. <code>useContext(Ctx)</code>—— 取值。</strong>
                取到的是「最近的那个 Provider」给的值。
              </p>
              <p>
                <strong>4. 包成 <code>useTheme()</code>。</strong>
                这一步不是可选的装饰，它有两个实际好处：
                消费者不用 import 那个 context 对象，
                以及<strong>可以在这里放守卫</strong>。
              </p>
              <p>
                <strong>关于默认值，三种写法差别很大：</strong>
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>写法</th>
                      <th>忘了套 Provider 时</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <code>createContext()</code>（题目给的参考结构）
                      </td>
                      <td>
                        拿到 <code>undefined</code>，在解构那一行炸出一句
                        很难读的 <code>Cannot destructure property…</code>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <code>{'createContext({ theme: "light", toggleTheme: () => {} })'}</code>
                      </td>
                      <td>
                        <strong>不报错</strong>，界面正常显示浅色，
                        点按钮没反应 —— 最难查的一种
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <code>createContext&lt;T | undefined&gt;(undefined)</code>
                        + hook 里守卫
                      </td>
                      <td>
                        抛一句人能看懂的话：
                        <code>useTheme 必须在 &lt;ThemeProvider&gt; 里面用</code>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                第三种是推荐写法。TS strict 下它还有个附带好处：
                <strong>守卫之后类型自动收窄</strong>，
                消费者拿到的是 <code>ThemeContextValue</code> 而不是
                可能为 undefined 的联合类型，不用到处写 <code>?.</code>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>1. <code>createContext</code> — build the pipe.</strong> Its argument
                is the value used when there is no Provider.
              </p>
              <p>
                <strong>2. <code>&lt;Ctx.Provider value={"{...}"}&gt;</code> — pour a value
                into the pipe.</strong> Only its <strong>subtree</strong> can read it.
              </p>
              <p>
                <strong>3. <code>useContext(Ctx)</code> — read the value.</strong> You get
                whatever the nearest Provider handed down.
              </p>
              <p>
                <strong>4. Wrap it in <code>useTheme()</code>.</strong> This step is not
                optional decoration; it buys two real things: consumers never import the context
                object, and <strong>you get a place to put the guard</strong>.
              </p>
              <p>
                <strong>About the default value, the options differ a lot:</strong>
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>How it is written</th>
                      <th>When the Provider is missing</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <code>createContext()</code> (the reference shape in the question)
                      </td>
                      <td>
                        You get <code>undefined</code> and it throws on the destructuring line
                        with an unreadable <code>Cannot destructure property…</code>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <code>{'createContext({ theme: "light", toggleTheme: () => {} })'}</code>
                      </td>
                      <td>
                        <strong>No error at all</strong>, the UI renders light happily, the
                        button does nothing — the hardest kind to track down
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <code>createContext&lt;T | undefined&gt;(undefined)</code> plus a guard
                        in the hook
                      </td>
                      <td>
                        Throws a sentence a human can read — the error text written into the{" "}
                        <code>useTheme</code> guard
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                The third one is the recommended shape. Under TS strict it has a bonus:{" "}
                <strong>the type narrows automatically after the guard</strong>, so consumers
                get <code>ThemeContextValue</code> instead of a union that might be undefined,
                and nobody has to sprinkle <code>?.</code> everywhere.
              </p>
            </>
          ),
          code: [
            tested(
              "tsx",
              `const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  // 守卫：一是给出人能看懂的报错，二是让 TS 把类型收窄到非 undefined
  if (!ctx) throw new Error("useTheme 必须在 <ThemeProvider> 里面用");
  return ctx;
}`,
              { filename: "自定义 hook + 守卫" },
            ),
          ],
        },
        {
          id: "toggle",
          heading: "toggleTheme：又是函数式更新",
          headingEn: "toggleTheme: the updater function form again",
          lede: "和计时器那道题同一个道理，只是这次藏在 context 里。",
          ledeEn: "The same reason as in the timer question, only this time it is hidden inside the context.",
          body: (
            <>
              <p>
                <code>toggleTheme</code> 要读旧值算新值，所以
                <strong>必须用函数式更新</strong>：
              </p>
              <p>
                写成 <code>setTheme(theme === &quot;light&quot; ? &quot;dark&quot; : &quot;light&quot;)</code>
                在「点一下」这种场景下也能跑，
                但只要<strong>一次事件里连调两次</strong>就露馅 ——
                两次都读到同一个旧 <code>theme</code>，结果只翻转了一次。
              </p>
              <p>
                测试里专门有一条抓这个：一个按钮的 onClick 里调两次
                <code>toggleTheme()</code>，
                <strong>正确实现应该原样回到 light</strong>。
                这条测试是 DrillLab 加的，很多教程版本过不去。
              </p>
              <p>
                另外 <code>toggleTheme</code> 要包
                <code>useCallback(..., [])</code>。
                依赖是空数组 —— 因为它内部只用函数式更新，
                <strong>不读任何外部变量</strong>，所以永远不需要重建。
                这一步是下一节 <code>useMemo</code> 生效的前提。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>toggleTheme</code> reads the old value to compute the new one, so it{" "}
                <strong>has to use the updater form</strong>:
              </p>
              <p>
                Writing{" "}
                <code>setTheme(theme === &quot;light&quot; ? &quot;dark&quot; : &quot;light&quot;)</code>{" "}
                also works for a single click, but{" "}
                <strong>call it twice inside one event</strong> and it gives itself away — both
                calls read the same old <code>theme</code>, so it only flips once.
              </p>
              <p>
                One test targets exactly this: a button whose onClick calls{" "}
                <code>toggleTheme()</code> twice, and{" "}
                <strong>a correct implementation ends back on light</strong>. DrillLab added that
                test, and a lot of tutorial versions fail it.
              </p>
              <p>
                <code>toggleTheme</code> also needs to be wrapped in{" "}
                <code>useCallback(..., [])</code>. The dependency list is empty because the body
                only uses the updater form and{" "}
                <strong>reads no outside variable</strong>, so it never needs rebuilding. This
                step is what makes the <code>useMemo</code> in the next section work.
              </p>
            </>
          ),
          code: [
            tested(
              "tsx",
              `const toggleTheme = useCallback(() => {
  setTheme((prev) => (prev === "light" ? "dark" : "light"));
}, []);   // 空依赖：内部不读任何外部变量，所以永远不用重建`,
              { filename: "toggleTheme" },
            ),
            demo(
              "tsx",
              `// ✗ 读闭包里的 theme
const toggleTheme = () => {
  setTheme(theme === "light" ? "dark" : "light");
};

// 单次点击看不出问题，但：
onClick={() => { toggleTheme(); toggleTheme(); }}
// 期望回到 light，实际停在 dark —— 两次都读到同一个旧值`,
            ),
          ],
        },
        {
          id: "memo",
          heading: "最容易漏的一步：value 必须记忆化",
          headingEn: "The step people miss most: the value has to be memoized",
          lede: "这行代码看着无害，会让整棵子树每次都重渲染。",
          ledeEn: "This line looks harmless, and it makes the whole subtree re-render every time.",
          body: (
            <>
              <p>
                很多人这么写 Provider：
              </p>
              <p>
                问题在于 <code>{"{ theme, toggleTheme }"}</code> 是
                <strong>字面量对象 —— 每次 Provider 渲染都是一个新对象</strong>。
                Context 判断「值变没变」用的是引用比较（<code>Object.is</code>），
                新对象就是「变了」。
              </p>
              <p>
                后果：只要 Provider 的父层因为<strong>任何别的原因</strong>重渲染，
                所有 <code>useTheme()</code> 的组件都会跟着重渲染
                —— 哪怕主题一动没动。子树越大越明显，
                而且 <code>React.memo</code> 也挡不住
                （memo 挡的是 props，context 走的是另一条路）。
              </p>
              <p>
                <strong>正解是 <code>useMemo</code></strong>，
                配合上一节的 <code>useCallback</code>：
                只有 <code>theme</code> 真的变了，才产生新的 value。
              </p>
              <p>
                这条能被测出来 —— 测试里放一个探针组件，
                记录每次拿到的 value，父层重渲染后断言引用没变。
                把 <code>useMemo</code> 删掉真跑一遍：
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Plenty of people write the Provider like this:
              </p>
              <p>
                The problem is that <code>{"{ theme, toggleTheme }"}</code> is an{" "}
                <strong>object literal — a brand new object on every Provider render</strong>.
                Context decides &ldquo;did the value change&rdquo; by reference
                (<code>Object.is</code>), and a new object counts as changed.
              </p>
              <p>
                The result: whenever the Provider&rsquo;s parent re-renders for{" "}
                <strong>any unrelated reason</strong>, every component calling{" "}
                <code>useTheme()</code> re-renders with it — even though the theme never moved.
                The bigger the subtree, the more obvious it gets, and <code>React.memo</code>{" "}
                cannot stop it either (memo guards props; context takes a different route).
              </p>
              <p>
                <strong>The fix is <code>useMemo</code></strong>, together with the{" "}
                <code>useCallback</code> from the last section: a new value only appears when{" "}
                <code>theme</code> really changes.
              </p>
              <p>
                And this is testable — the test drops in a probe component that records every
                value it receives, then asserts the reference is unchanged after the parent
                re-renders. Delete the <code>useMemo</code> and run it for real:
              </p>
            </>
          ),
          code: [
            demo(
              "tsx",
              `// ✗ 每次渲染都是新对象 -> 所有消费者跟着重渲染
return (
  <ThemeContext.Provider value={{ theme, toggleTheme }}>
    {children}
  </ThemeContext.Provider>
);`,
            ),
            tested(
              "tsx",
              `// ✓ theme 不变时 value 就是同一个对象
const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;`,
              { filename: "记忆化之后" },
            ),
            tested(
              "bash",
              `# 把 useMemo 删掉、直接传字面量对象之后的真实输出
$ npx vitest run src/Theme.test.tsx

 ✕ theme 没变时 context value 不换新对象（useMemo 生效）
   AssertionError: expected 2 to be 1 // Object.is equality

 Tests  1 failed | 7 passed (8)

# 注意：功能测试全都还是绿的 —— 主题该切也切，颜色该变也变。
# 挂掉的只有这条性能相关的。这正是「测试通过 ≠ 做对了」。`,
              { filename: "本机实测：漏掉 useMemo 的后果" },
            ),
          ],
        },
        {
          id: "consumers",
          heading: "两个消费者",
          headingEn: "The two consumers",
          lede: "按钮和卡片都只做一件事：取值、用值。",
          ledeEn: "The button and the card each do one thing: read the value, then use it.",
          body: (
            <>
              <p>
                <strong>按钮的文字是「要切到哪」，不是「现在是哪」。</strong>
                当前 light，就显示 <code>Switch to Dark</code>。
                这一点很多人会写反 —— 题目明确要求了，
                <strong>读题的时候就要把这句话圈出来</strong>。
              </p>
              <p>
                <code>onClick={"{toggleTheme}"}</code> 直接传函数引用，
                不用写 <code>{"() => toggleTheme()"}</code>——
                后者每次渲染造一个新函数，没必要。
              </p>
              <p>
                卡片只解构 <code>theme</code>，不取
                <code>toggleTheme</code>——
                <strong>只拿自己要用的</strong>。
              </p>
              <p>
                <code>data-theme={"{theme}"}</code> 这个属性是给测试用的：
                比对 <code>style</code> 里的颜色值更稳，
                改配色不用改测试。真实项目里也常这么干
                （本站的深色模式就是靠
                <code>{'document.documentElement.setAttribute("data-theme", next)'}</code>
                驱动 CSS 变量的）。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>The button&rsquo;s label says where you are going, not where you
                are.</strong> On light it reads <code>Switch to Dark</code>. A lot of people get
                this backwards — the question states it outright, so{" "}
                <strong>circle that sentence while you read</strong>.
              </p>
              <p>
                <code>onClick={"{toggleTheme}"}</code> passes the function reference straight
                through. No need for <code>{"() => toggleTheme()"}</code> — that builds a new
                function on every render for nothing.
              </p>
              <p>
                The card destructures only <code>theme</code> and leaves{" "}
                <code>toggleTheme</code> alone — <strong>take only what you use</strong>.
              </p>
              <p>
                The <code>data-theme={"{theme}"}</code> attribute is there for the tests: it is
                steadier than comparing colour values in <code>style</code>, and changing the
                palette does not mean changing the tests. Real projects do the same thing (dark
                mode on this site runs on{" "}
                <code>{'document.documentElement.setAttribute("data-theme", next)'}</code>{" "}
                driving CSS variables).
              </p>
            </>
          ),
          code: [
            tested("tsx", THEME_BUTTON, {
              filename: "src/components/ThemeToggleButton/index.tsx",
            }),
            tested("tsx", THEME_CARD, {
              filename: "src/components/ThemedCard/index.tsx",
            }),
          ],
        },
        {
          id: "full",
          heading: "完整答案",
          headingEn: "The complete answer",
          lede: "8 个测试全过。",
          ledeEn: "All 8 tests pass.",
          body: (
            <>
              <p>
                <code>ThemeProvider</code> 里 <code>children</code> 的类型是
                <code>ReactNode</code>—— 这是「任何能渲染的东西」的标准类型，
                字符串、数字、元素、数组、null 都算。
              </p>
              <p>
                <strong>Provider 必须包在最外层。</strong>
                只有它的子树能 <code>useTheme()</code>；
                <code>ThemeProvider</code> 组件自己内部也不能用
                （那时 Provider 还没渲染出来）。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Inside <code>ThemeProvider</code>, <code>children</code> is typed{" "}
                <code>ReactNode</code> — the standard type for &ldquo;anything that can be
                rendered&rdquo;: strings, numbers, elements, arrays, null.
              </p>
              <p>
                <strong>The Provider has to wrap the outermost layer.</strong> Only its subtree
                can call <code>useTheme()</code>; the <code>ThemeProvider</code> component cannot
                use it inside itself either (at that point the Provider has not rendered yet).
              </p>
            </>
          ),
          code: [
            tested("tsx", THEME_CONTEXT, {
              filename: "src/context/ThemeContext.tsx（实测 8/8 通过）",
              collapsible: true,
            }),
            tested("tsx", THEME_APP, {
              filename: "src/components/ThemeApp/index.tsx",
            }),
          ],
        },
        {
          id: "verify",
          heading: "怎么验证",
          headingEn: "How to check it",
          lede: "Context 怎么测？测的是「消费者看到了什么」，不是 context 本身。",
          ledeEn: "How do you test Context? You test what a consumer sees, not the context itself.",
          body: (
            <>
              <p>
                关键心态：<strong>不要去测 context 对象</strong>，
                测「套在 Provider 里的组件表现对不对」。
                所以每个测试都自己组装一小棵树。
              </p>
              <p>
                <strong>三个值得学的写法：</strong>
              </p>
              <ul>
                <li>
                  <strong>探针组件</strong>——
                  在测试文件里现写一个只调 <code>useTheme()</code>
                  然后把结果 push 进数组的组件。想断言「引用有没有变」
                  只能这么干。
                </li>
                <li>
                  <strong>断言抛错要静音 console</strong>——
                  React 渲染中抛错会额外打一堆 <code>console.error</code>，
                  <code>vi.spyOn(console, &quot;error&quot;)</code>
                  临时挡掉，测完 <code>mockRestore()</code>。
                </li>
                <li>
                  <strong>多消费者一起断言</strong>——
                  <code>getAllByTestId</code> 拿一组，比较整个数组。
                  这条测的正是 Context 的核心价值：一处改、处处变。
                </li>
              </ul>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The mindset that matters: <strong>do not test the context object</strong>, test
                whether the components wrapped in the Provider behave correctly. So every test
                assembles its own little tree.
              </p>
              <p>
                <strong>Three techniques worth stealing:</strong>
              </p>
              <ul>
                <li>
                  <strong>A probe component</strong> — write one right there in the test file
                  that only calls <code>useTheme()</code> and pushes the result into an array. If
                  you want to assert &ldquo;did the reference change&rdquo;, this is the only way.
                </li>
                <li>
                  <strong>Silence the console when asserting a throw</strong> — React logs a pile
                  of <code>console.error</code> when a render throws;{" "}
                  <code>vi.spyOn(console, &quot;error&quot;)</code> blocks it temporarily, and{" "}
                  <code>mockRestore()</code> puts it back when the test is done.
                </li>
                <li>
                  <strong>Assert on several consumers at once</strong> —{" "}
                  <code>getAllByTestId</code> grabs the group and you compare the whole array.
                  That test covers the actual point of Context: change it in one place, it changes
                  everywhere.
                </li>
              </ul>
            </>
          ),
          code: [
            tested("bash", "npx vitest run src/Theme.test.tsx   # 8 passed", {
              filename: "验证命令",
            }),
            tested("tsx", THEME_TEST, {
              filename: "src/Theme.test.tsx（DrillLab 自出，本机跑过）",
              collapsible: true,
            }),
          ],
        },
      ],
      exercises: [
        {
          kind: "fill-blank",
          id: "r-var-theme-blank",
          title: "补全 ThemeContext 的四个关键位置",
          level: 2,
          generated: true,
          prompt: (
            <p>
              四个空。第 3 个是最容易漏的那一步，第 4 个决定「忘了套 Provider」
              时报错清不清楚。
            </p>
          ),
          language: "tsx",
          filename: "src/context/ThemeContext.tsx",
          template: `const ThemeContext = ___1___<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  const toggleTheme = useCallback(() => {
    setTheme(___2___);
  }, []);

  const value = ___3___(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (___4___) throw new Error("useTheme 必须在 <ThemeProvider> 里面用");
  return ctx;
}`,
          blanks: [
            {
              n: 1,
              accept: ["createContext"],
              hint: "造管道的那个函数。",
              why: (
                <>
                  <code>createContext</code>。
                  <br />
                  它返回一个对象，上面挂着 <code>.Provider</code>；
                  这个对象本身还要传给 <code>useContext</code> 才能取值。
                </>
              ),
              width: 14,
            },
            {
              n: 2,
              accept: [
                '(prev) => (prev === "light" ? "dark" : "light")',
                'prev => prev === "light" ? "dark" : "light"',
                '(p) => (p === "light" ? "dark" : "light")',
                '(prev) => prev === "light" ? "dark" : "light"',
              ],
              hint: "要读旧值算新值，别读闭包里的 theme。",
              why: (
                <>
                  函数式更新：
                  <code>{'(prev) => (prev === "light" ? "dark" : "light")'}</code>。
                  <br />
                  写成 <code>theme === &quot;light&quot; ? …</code> 读的是闭包里的旧值。
                  单次点击看不出问题，
                  <strong>一次事件里连调两次就只翻转一次</strong>。
                  也正因为不读外部变量，上面那个
                  <code>useCallback</code> 的依赖才能是空数组。
                </>
              ),
              width: 44,
            },
            {
              n: 3,
              accept: ["useMemo"],
              hint: "让 theme 没变时 value 还是同一个对象。",
              why: (
                <>
                  <code>useMemo</code>。<strong>这是这道题最容易漏的一步。</strong>
                  <br />
                  漏了它，<code>{"{ theme, toggleTheme }"}</code> 每次渲染都是新对象，
                  Context 按引用比较认为「变了」，
                  于是所有消费者跟着重渲染 —— 哪怕主题没动。
                  <br />
                  漏掉之后功能测试<strong>全是绿的</strong>，只有那条
                  「value 不换新对象」会红。又一次「测试通过 ≠ 做对了」。
                </>
              ),
              width: 9,
            },
            {
              n: 4,
              accept: ["!ctx", "ctx === undefined", "!context", "ctx == null", "ctx === void 0"],
              hint: "没有 Provider 时 useContext 返回的就是默认值 undefined。",
              why: (
                <>
                  <code>!ctx</code>。
                  <br />
                  两个作用：给出一句人能看懂的报错
                  （而不是 <code>Cannot destructure property &apos;theme&apos;…</code>），
                  以及<strong>让 TS 把返回类型收窄到非 undefined</strong>，
                  消费者就不用到处写 <code>?.</code> 了。
                </>
              ),
              width: 10,
            },
          ],
        },
        {
          kind: "code-completion",
          id: "r-var-theme-write",
          title: "自己写出 ThemeProvider 和 useTheme",
          level: 3,
          generated: true,
          prompt: (
            <p>
              类型已给好。写出 context、Provider、自定义 hook 三部分。
              检查器会查记忆化、函数式更新和守卫。
            </p>
          ),
          language: "tsx",
          filename: "src/context/ThemeContext.tsx",
          starter: `import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Theme = "light" | "dark";

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

// 1. 造 context（默认值怎么给？想清楚「忘了套 Provider」时希望发生什么）


// 2. Provider：存 theme、提供 toggleTheme
export function ThemeProvider({ children }: { children: ReactNode }) {

}

// 3. 自定义 hook
export function useTheme(): ThemeContextValue {

}`,
          requirements: [
            "theme 初始为 'light'",
            "toggleTheme 在 light / dark 之间翻转，必须用函数式更新",
            "context value 要记忆化，theme 不变时不产生新对象",
            "toggleTheme 引用要稳定（theme 变了它也不变）",
            "没套 Provider 就用 useTheme() 时抛出一句能看懂的错误",
            "不许把 theme 存到组件外的全局变量里",
          ],
          checks: [
            { label: "用 createContext 造了 context", must: "createContext\\s*(<[^>]*>)?\\s*\\(" },
            { label: "默认值给的是 undefined（配合守卫）", must: "createContext\\s*(<[^>]*>)?\\s*\\(\\s*undefined\\s*\\)" },
            { label: "theme 初始为 light", must: "useState\\s*(<[^>]*>)?\\s*\\(\\s*[\"'`]light[\"'`]\\s*\\)" },
            { label: "toggleTheme 用函数式更新", must: "setTheme\\s*\\(\\s*\\(?\\s*\\w+\\s*\\)?\\s*=>" },
            { label: "没有读闭包里的 theme 去算新值", mustNot: "setTheme\\s*\\(\\s*theme\\s*===" },
            { label: "toggleTheme 包了 useCallback", must: "useCallback" },
            { label: "context value 用 useMemo 记忆化", must: "useMemo\\s*\\(" },
            { label: "没有直接把字面量对象传给 Provider", mustNot: "value=\\{\\{" },
            { label: "渲染了 Ctx.Provider 并把 children 放进去", must: "\\.Provider[\\s\\S]{0,80}children" },
            { label: "useTheme 里用了 useContext", must: "useContext\\s*\\(" },
            { label: "useTheme 里有守卫并抛错", must: "if\\s*\\([^)]*\\)\\s*throw new Error" },
            { label: "没有把 theme 放到模块级全局变量", mustNot: "^let\\s+theme\\s*=" },
          ],
          hints: [
            "先想清楚三个问题：这个值放在谁的 state 里？谁能读到它？「忘了套 Provider」的时候，你希望程序静默地用一个假默认值，还是当场炸给你看？",
            "createContext 的默认值给 undefined，然后在 useTheme 里 if (!ctx) throw —— 这样既报得清楚，TS 也会把类型收窄。toggleTheme 用 setTheme(prev => ...) 并包 useCallback(..., [])，value 用 useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])。",
            `const Ctx = createContext<值的类型 | undefined>(undefined)

ThemeProvider:
  theme, setTheme = useState("light")
  toggleTheme = useCallback(() => setTheme(旧值 => 旧值 是 light ? dark : light), [])
  value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>

useTheme:
  ctx = useContext(Ctx)
  没拿到就 throw 一句人话
  return ctx`,
            `const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);
  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}`,
          ],
          solution: tested("tsx", THEME_CONTEXT, {
            filename: "参考答案（实测 8/8 通过）",
            collapsible: true,
          }),
        },
        {
          kind: "debug",
          id: "r-var-theme-debug",
          title: "Debug Lab · Cannot destructure property 'theme'",
          level: 2,
          generated: true,
          prompt: (
            <p>
              按钮好好的，卡片一渲染就整页白屏。这是真实报错。
            </p>
          ),
          errorOutput: `$ npx vitest run src/Theme.test.tsx

TypeError: Cannot destructure property 'theme' of
  '(0 , __vite_ssr_import_1__.useTheme)(...)' as it is undefined.
    at ThemedCard (src/components/ThemedCard/index.tsx:6:11)
    at ThemeApp

 ✕ 默认是 light，按钮说 Switch to Dark
 ✕ 点一下变 dark：按钮文字和卡片底色一起变
 ✕ 再点一下切回 light
 ✕ 没套 Provider 就用 useTheme()，必须立刻报错
 ✕ toggleTheme 是稳定引用：theme 变了它也不变

 Tests  5 failed | 3 passed (8)

# 浏览器里的报错略有不同，意思一样：
#   Cannot destructure property 'theme' of 'useTheme(...)' as it is undefined.`,
          broken: demo(
            "tsx",
            `// ThemeContext.tsx
const ThemeContext = createContext<ThemeContextValue>(undefined as never);

export function useTheme() {
  return useContext(ThemeContext);      // 没有守卫
}

// ThemeApp/index.tsx
const ThemeApp: React.FC = () => (
  <>
    <ThemeProvider>
      <ThemeToggleButton />
    </ThemeProvider>
    <ThemedCard />
  </>
);`,
            { filename: "src/components/ThemeApp/index.tsx", highlight: [12, 13, 14] },
          ),
          classify: {
            options: [
              { id: "a", label: "Provider 位置错了 —— ThemedCard 在 Provider 的子树外面，useContext 拿到默认值 undefined" },
              { id: "b", label: "忘了 export ThemeContext" },
              { id: "c", label: "useMemo 的依赖数组写错了" },
              { id: "d", label: "ThemedCard 应该改成 class 组件" },
            ],
            answer: "a",
          },
          locate: {
            question: "怎么改？",
            options: [
              { id: "a", label: "把 Provider 提到最外层，让按钮和卡片都在它的子树里；同时在 useTheme 里加守卫，让下次报错能看懂" },
              { id: "b", label: "给 createContext 传一个 { theme: 'light', toggleTheme: () => {} } 当默认值" },
              { id: "c", label: "在 ThemedCard 里写 const ctx = useTheme() ?? { theme: 'light' }" },
              { id: "d", label: "把 ThemedCard 也包一个自己的 ThemeProvider" },
            ],
            answer: "a",
          },
          fixed: tested(
            "tsx",
            `// ThemeContext.tsx —— 默认值给 undefined，并加守卫
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme 必须在 <ThemeProvider> 里面用");
  return ctx;
}

// ThemeApp/index.tsx —— Provider 包住所有消费者
const ThemeApp: React.FC = () => (
  <ThemeProvider>
    <ThemeToggleButton />
    <ThemedCard />
  </ThemeProvider>
);`,
            { filename: "改对之后（8/8 通过）" },
          ),
          rootCause: (
            <>
              <p>
                <code>ThemedCard</code> 在 <code>ThemeProvider</code> 的
                <strong>兄弟</strong>位置，不在它的子树里。
                <code>useContext</code> 只会往上找<strong>祖先</strong>里最近的
                Provider —— 找不到就返回 <code>createContext</code>
                的默认值，这里是 <code>undefined</code>。
                然后 <code>{"const { theme } = undefined"}</code> 直接炸。
              </p>
              <p>
                <strong>为什么按钮是好的？</strong>
                因为它确实在 Provider 里面。
                <strong>「一部分组件正常、一部分报 undefined」是这个 bug 的
                典型指纹</strong>—— 说明 Provider 存在，只是范围不够大。
              </p>
              <p>
                <strong>选项 B（给个默认值）为什么更糟？</strong>
                它让报错消失了，但换来一个<strong>静默的错</strong>：
                卡片永远显示浅色，点按钮毫无反应，
                而且完全没有任何报错提示你「这个组件没连上 Provider」。
                白屏至少告诉你出了问题；这个连线索都不给。
                <strong>能早失败就别晚失败。</strong>
              </p>
              <p>
                <strong>选项 C（<code>?? </code>兜底）</strong>
                是同一个毛病的更小号版本，而且还额外丢掉了
                <code>toggleTheme</code>。
              </p>
              <p>
                注意报错里的 <code>__vite_ssr_import_1__</code>
                只是 Vite 转换后的变量名，不用管它 ——
                <strong>读报错要抓住三样：错误类型
                （<code>TypeError</code>）、
                哪个属性（<code>&apos;theme&apos;</code>）、
                哪个组件（<code>at ThemedCard</code>）。</strong>
                这三样凑起来就够定位了。
              </p>
            </>
          ),
          verify:
            "npx vitest run src/Theme.test.tsx   # 8 passed，包含「没套 Provider 必须报错」那条",
        },
      ],
      mistakes: [
        {
          wrong: demo(
            "tsx",
            `// ✗ 直接传字面量对象
<ThemeContext.Provider value={{ theme, toggleTheme }}>`,
          ),
          why: (
            <>
              每次渲染都是新对象，Context 按引用比较认为「变了」，
              所有消费者跟着重渲染 —— 主题没动也一样。
              <br />
              <strong>用 <code>useMemo</code>。</strong>
              而且功能测试不会红，只有专门测引用的那条会红。
            </>
          ),
          whyEn: (
            <>
              Every render builds a new object. Context compares by reference, decides the
              value changed, and every consumer re-renders — even when the theme did not
              move.
              <br />
              <strong>Use <code>useMemo</code>.</strong> Note that the behaviour tests
              stay green; only a test written to check the reference turns red.
            </>
          ),
        },
        {
          wrong: demo(
            "tsx",
            `// ✗ 给一个「看起来合理」的默认值
const ThemeContext = createContext({ theme: "light", toggleTheme: () => {} });`,
          ),
          why: (
            <>
              忘了套 Provider 时<strong>不报错</strong>：界面正常显示浅色，
              点按钮调的是那个空函数，什么都不会发生。
              <br />
              这是最难查的一类 bug ——
              <strong>宁可炸，也别静默地对。</strong>
            </>
          ),
          whyEn: (
            <>
              With the Provider missing there is <strong>no error at all</strong>: the page
              shows the light theme as usual, the button calls that empty function, and
              nothing happens.
              <br />
              This is the hardest kind of bug to track down.{" "}
              <strong>Better to fail loudly than to look correct in silence.</strong>
            </>
          ),
        },
        {
          wrong: demo(
            "tsx",
            `// ✗ 在 ThemeProvider 自己内部用 useTheme()
export function ThemeProvider({ children }) {
  const { theme } = useTheme();   // 报错：这时 Provider 还没渲染
  ...
}`,
          ),
          why: (
            <>
              <code>useContext</code> 找的是<strong>祖先</strong>里的 Provider。
              <code>ThemeProvider</code> 组件自己不是自己的祖先。
              <br />
              Provider 内部要用 theme，直接用那个 <code>useState</code>
              的变量就行 —— 它就在手边。
            </>
          ),
          whyEn: (
            <>
              <code>useContext</code> looks for a Provider among its{" "}
              <strong>ancestors</strong>. The <code>ThemeProvider</code> component is not
              its own ancestor.
              <br />
              If you need the theme inside the Provider, just use the{" "}
              <code>useState</code> variable. It is right there.
            </>
          ),
        },
        {
          wrong: demo(
            "tsx",
            `// ✗ 按钮文字写成「现在是什么」
{theme === "light" ? "Switch to Light" : "Switch to Dark"}`,
          ),
          why: (
            <>
              题目要求的是<strong>「要切到哪」</strong>：
              当前 light 就显示 <code>Switch to Dark</code>。
              <br />
              这条不涉及任何技术难点，纯粹是<strong>读题</strong>——
              而 assessment 里这种分丢得最不值。
            </>
          ),
          whyEn: (
            <>
              The task asks for <strong>where it will switch to</strong>: when the current
              theme is light, show <code>Switch to Dark</code>.
              <br />
              Nothing technical is involved here. It is purely{" "}
              <strong>reading the task</strong>, and in an exam these are the cheapest
              points to lose.
            </>
          ),
        },
      ],
      transfer: [
        {
          signal: "「整棵树都要读同一个值」",
          signalEn: "The whole tree has to read the same value",
          reachFor: "Context：createContext + Provider + useContext",
          reachForEn: "Context: createContext + Provider + useContext",
        },
        {
          signal: "「当前登录用户 / 语言 / 购物车」",
          signalEn: "Current user / language / shopping cart",
          reachFor: "和主题同一套骨架，换个类型",
          reachForEn: "The same skeleton as the theme, with a different type",
        },
        {
          signal: "写 Provider",
          signalEn: "Writing a Provider",
          reachFor: "value 一律 useMemo，函数一律 useCallback",
          reachForEn: "Always useMemo the value, always useCallback the functions",
        },
        {
          signal: "Cannot destructure property … of undefined",
          reachFor: "消费者不在 Provider 子树里",
          reachForEn: "The consumer is not inside the Provider subtree",
        },
        {
          signal: "「一部分组件正常、一部分拿到 undefined」",
          signalEn: "Some components work, others get undefined",
          reachFor: "Provider 范围不够大，往上提",
          reachForEn: "The Provider does not cover enough of the tree; move it up",
        },
        {
          signal: "「切换毫无反应但也不报错」",
          signalEn: "Switching does nothing, and there is no error either",
          reachFor: "createContext 给了假默认值，把它换成 undefined + 守卫",
          reachForEn: "createContext was given a fake default value. Replace it with undefined plus a guard",
        },
        {
          signal: "值每秒都在变（鼠标位置、播放进度）",
          signalEn: "The value changes every second, like a mouse position or playback progress",
          reachFor: "别放 Context，或拆成两个 Context",
          reachForEn: "Keep it out of Context, or split it into two Contexts",
        },
      ],
      recap: [
        "Context 解决跨层传值，适合「整棵树都读、又不常变」的东西；它不是状态管理器。",
        "三个动作：createContext 造管道、Provider 灌值、useContext 取值；第四步自己包 hook 加守卫。",
        "默认值给 undefined + hook 里 throw，比给个假默认值好 —— 宁可炸也别静默地对。",
        "toggleTheme 用函数式更新 + useCallback([])；一次事件连调两次也能正确翻回来。",
        "value 必须 useMemo，否则所有消费者每次都重渲染，而功能测试全绿查不出来。",
        "按钮文字是「要切到哪」，不是「现在是哪」—— 这是读题分。",
      ],
      recapEn: [
        "Context solves passing a value across layers. It fits things the whole tree reads and that rarely change. It is not a state manager.",
        "Three moves: createContext builds the pipe, Provider puts a value in, useContext takes it out. The fourth step is your own hook with a guard in it.",
        "Pass undefined as the default and throw inside the hook. That is better than a fake default value: fail loudly rather than look correct in silence.",
        "toggleTheme uses the updater function form plus useCallback with an empty dependency list, so two calls in one event still flip back correctly.",
        "The value must go through useMemo, or every consumer re-renders every time, and the behaviour tests stay green so nothing catches it.",
        "The button text says where it will switch to, not what it is now. These are points for reading the task.",
      ],
    },
  ],
};
