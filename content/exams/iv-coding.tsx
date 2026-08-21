// 面试八股 —— 16 道 coding 题：先对照，再补缺口。
//
// 【为什么先对照】
// 题库里这 16 道和本站已有的练习重合度很高 —— Q1 的 CRUD、Q2 的调度器、
// 五道变式题、两套模拟考已经覆盖了 9 道。重复出题没意义，所以这一节先逐题
// 给结论，再把真正没覆盖的 7 道补进来。
//
// 【可信度】
// 对照表和讲解是 DrillLab 写的（demo / 示意）；
// 补进来的 7 道题，参考解法和测试都在 scratchpad 里真跑过：
//   六道（Dropdown / Tabs / 星级 / 播放器 / 自定义 hook / Kanban）24 / 24
//   Redux Toolkit 版 Todo 单独一个项目（要装 RTK）8 / 8
// 所以这些代码块标 tested()（页面显示「已跑通」），练习一律 generated: true。

import type { Module } from "../types";
import { demo, tested } from "../helpers";

const C_DROPDOWN = `import React, { useEffect, useRef, useState } from "react";

export interface Option { id: string; label: string }

interface Props {
  options: Option[];
  onSelect?: (id: string) => void;
}

const Dropdown: React.FC<Props> = ({ options, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Option | null>(null);
  // useRef 存 DOM 节点：用来判断「这次点击是不是发生在我身上」
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;                   // 没展开就不用监听，省一个监听器

    const onDocClick = (e: MouseEvent) => {
      // e.target 是真正被点的那个节点；contains 判断它在不在我这棵子树里
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    // 清理：不解绑的话每次展开都多一对监听器，卸载后还会对已卸载组件 setState
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (o: Option) => {
    setPicked(o);
    setOpen(false);
    onSelect?.(o.id);
  };

  return (
    <div ref={boxRef} data-testid="dropdown">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-testid="dropdown-trigger"
      >
        {picked ? picked.label : "请选择"}
      </button>

      {open && (
        <ul role="listbox" data-testid="dropdown-list">
          {options.map((o) => (
            <li key={o.id}>
              <button
                role="option"
                aria-selected={picked?.id === o.id}
                onClick={() => choose(o)}
                data-testid={\`option-\${o.id}\`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;`;

const C_DROPDOWN_EN = `import React, { useEffect, useRef, useState } from "react";

export interface Option { id: string; label: string }

interface Props {
  options: Option[];
  onSelect?: (id: string) => void;
}

const Dropdown: React.FC<Props> = ({ options, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Option | null>(null);
  // useRef holds the DOM node: used to tell whether a click landed on me
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;                   // Closed, so no listener needed — that saves one

    const onDocClick = (e: MouseEvent) => {
      // e.target is the node that was really clicked; contains asks whether it is inside my subtree
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    // Cleanup: without it, every open adds another pair of listeners, and after unmount they would setState on an unmounted component
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (o: Option) => {
    setPicked(o);
    setOpen(false);
    onSelect?.(o.id);
  };

  return (
    <div ref={boxRef} data-testid="dropdown">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-testid="dropdown-trigger"
      >
        {picked ? picked.label : "请选择"}
      </button>

      {open && (
        <ul role="listbox" data-testid="dropdown-list">
          {options.map((o) => (
            <li key={o.id}>
              <button
                role="option"
                aria-selected={picked?.id === o.id}
                onClick={() => choose(o)}
                data-testid={\`option-\${o.id}\`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;`;

const C_TABS = `import React, { useState } from "react";

export interface Tab { id: string; label: string; content: React.ReactNode }

const Tabs: React.FC<{ tabs: Tab[]; initialId?: string }> = ({ tabs, initialId }) => {
  // 只存「哪个是激活的」，当前面板是派生出来的
  const [activeId, setActiveId] = useState(initialId ?? tabs[0]?.id);

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  return (
    <div data-testid="tabs">
      <div role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === active.id}
            aria-controls={\`panel-\${t.id}\`}
            id={\`tab-\${t.id}\`}
            onClick={() => setActiveId(t.id)}
            data-testid={\`tab-\${t.id}\`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 只渲染激活的那个面板 */}
      <div
        role="tabpanel"
        id={\`panel-\${active.id}\`}
        aria-labelledby={\`tab-\${active.id}\`}
        data-testid="panel"
      >
        {active.content}
      </div>
    </div>
  );
};

export default Tabs;`;

const C_TABS_EN = `import React, { useState } from "react";

export interface Tab { id: string; label: string; content: React.ReactNode }

const Tabs: React.FC<{ tabs: Tab[]; initialId?: string }> = ({ tabs, initialId }) => {
  // Only "which one is active" is stored; the current panel is derived from it
  const [activeId, setActiveId] = useState(initialId ?? tabs[0]?.id);

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  return (
    <div data-testid="tabs">
      <div role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === active.id}
            aria-controls={\`panel-\${t.id}\`}
            id={\`tab-\${t.id}\`}
            onClick={() => setActiveId(t.id)}
            data-testid={\`tab-\${t.id}\`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Only the active panel is rendered */}
      <div
        role="tabpanel"
        id={\`panel-\${active.id}\`}
        aria-labelledby={\`tab-\${active.id}\`}
        data-testid="panel"
      >
        {active.content}
      </div>
    </div>
  );
};

export default Tabs;`;

const C_STARS = `import React, { useState } from "react";

interface Props {
  max?: number;
  value?: number;                 // 传了就是受控
  onChange?: (v: number) => void;
}

const StarRating: React.FC<Props> = ({ max = 5, value, onChange }) => {
  const [inner, setInner] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  const isControlled = value !== undefined;
  const current = isControlled ? value : inner;

  // 有 hover 就显示 hover 的，否则显示已选的 —— 这是派生数据
  const shown = hover ?? current;

  const set = (v: number) => {
    if (!isControlled) setInner(v);
    onChange?.(v);
  };

  return (
    <div
      data-testid="stars"
      data-value={current}
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          aria-label={\`\${n} 星\`}
          aria-pressed={n === current}
          data-filled={n <= shown}
          onMouseEnter={() => setHover(n)}
          onClick={() => set(n === current ? 0 : n)}   // 再点同一颗就清零
          data-testid={\`star-\${n}\`}
        >
          {n <= shown ? "★" : "☆"}
        </button>
      ))}
      <output data-testid="stars-value">{current}</output>
    </div>
  );
};

export default StarRating;`;

const C_STARS_EN = `import React, { useState } from "react";

interface Props {
  max?: number;
  value?: number;                 // Pass it and the component is controlled
  onChange?: (v: number) => void;
}

const StarRating: React.FC<Props> = ({ max = 5, value, onChange }) => {
  const [inner, setInner] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  const isControlled = value !== undefined;
  const current = isControlled ? value : inner;

  // Show the hovered star if there is a hover, otherwise the picked one — this is derived data
  const shown = hover ?? current;

  const set = (v: number) => {
    if (!isControlled) setInner(v);
    onChange?.(v);
  };

  return (
    <div
      data-testid="stars"
      data-value={current}
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          aria-label={\`\${n} 星\`}
          aria-pressed={n === current}
          data-filled={n <= shown}
          onMouseEnter={() => setHover(n)}
          onClick={() => set(n === current ? 0 : n)}   // Clicking the same star again resets to zero
          data-testid={\`star-\${n}\`}
        >
          {n <= shown ? "★" : "☆"}
        </button>
      ))}
      <output data-testid="stars-value">{current}</output>
    </div>
  );
};

export default StarRating;`;

const C_PLAYER = `import React, { useRef, useState } from "react";

const Player: React.FC<{ src: string }> = ({ src }) => {
  // useRef 的另一种用法：拿到 DOM 节点，调它的命令式 API
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);

  const toggle = async () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      await el.play();          // play() 返回 Promise，可能被浏览器策略拒绝
      setPlaying(true);
    }
  };

  const stop = () => {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;         // 直接改 DOM 属性，不经过 state
    setPlaying(false);
    setTime(0);
  };

  return (
    <div data-testid="player">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onEnded={() => setPlaying(false)}
        data-testid="audio"
      />
      <button onClick={toggle} data-testid="toggle">
        {playing ? "Pause" : "Play"}
      </button>
      <button onClick={stop} data-testid="stop">Stop</button>
      <output data-testid="time">{Math.floor(time)}</output>
    </div>
  );
};

export default Player;`;

const C_HOOK = `import { useEffect, useState } from "react";

/**
 * 把一个值和 localStorage 绑在一起。
 * 命名必须 use 开头 —— ESLint 靠这个前缀才会检查 hooks 规则。
 */
export function useLocalStorage<T>(key: string, initial: T) {
  // 惰性初始化：读 localStorage 只在首次渲染做一次，不是每次渲染
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;          // 隐私模式 / 脏数据：退回默认值，别让整个组件炸
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* 写不进去只影响持久化，不影响本次会话 */
    }
  }, [key, value]);

  return [value, setValue] as const;   // as const 让返回类型是元组而不是数组
}`;

const C_CARD_T = `export type ColumnId = "todo" | "doing" | "done";

export type Card = { id: number; title: string };

export type Board = Record<ColumnId, Card[]>;`;

const C_KANBAN = `import React, { useState } from "react";
import type { Board, Card, ColumnId } from "../../types/Card";

export const COLUMNS: { id: ColumnId; label: string }[] = [
  { id: "todo", label: "待办" },
  { id: "doing", label: "进行中" },
  { id: "done", label: "已完成" },
];

/**
 * 把一张卡从一列移到另一列，返回全新的 board。
 * 关键：一次操作要同时改两个数组，两边都必须是新数组。
 */
export function moveCard(
  board: Board,
  from: ColumnId,
  to: ColumnId,
  cardId: number,
): Board {
  if (from === to) return board;                       // 没动就原样返回

  const card = board[from].find((c) => c.id === cardId);
  if (!card) return board;                             // 找不到也原样返回

  return {
    ...board,
    [from]: board[from].filter((c) => c.id !== cardId), // 源列去掉
    [to]: [...board[to], card],                        // 目标列追加
  };
}

const Kanban: React.FC<{ initial: Board }> = ({ initial }) => {
  const [board, setBoard] = useState<Board>(initial);
  const [text, setText] = useState("");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() === "") return;
    const card: Card = { id: Date.now(), title: text.trim() };
    setBoard((prev) => ({ ...prev, todo: [...prev.todo, card] }));
    setText("");
  };

  const move = (from: ColumnId, to: ColumnId, id: number) =>
    setBoard((prev) => moveCard(prev, from, to, id));

  return (
    <div data-testid="kanban">
      <form onSubmit={add}>
        <input value={text} onChange={(e) => setText(e.target.value)} data-testid="card-input" />
        <button type="submit" disabled={text.trim() === ""} data-testid="card-submit">
          Add
        </button>
      </form>

      {COLUMNS.map((col, ci) => (
        <section key={col.id} data-testid={\`col-\${col.id}\`}>
          <h3>
            {col.label}
            <span data-testid={\`count-\${col.id}\`}>{board[col.id].length}</span>
          </h3>
          <ul>
            {board[col.id].map((c) => (
              <li key={c.id} data-testid={\`card-\${c.id}\`} data-col={col.id}>
                <span>{c.title}</span>
                {ci > 0 && (
                  <button
                    aria-label={\`把 \${c.title} 左移\`}
                    onClick={() => move(col.id, COLUMNS[ci - 1].id, c.id)}
                  >
                    ←
                  </button>
                )}
                {ci < COLUMNS.length - 1 && (
                  <button
                    aria-label={\`把 \${c.title} 右移\`}
                    onClick={() => move(col.id, COLUMNS[ci + 1].id, c.id)}
                  >
                    →
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};

export default Kanban;`;

const C_TEST = `import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import Dropdown from "./components/Dropdown";
import Tabs from "./components/Tabs";
import StarRating from "./components/StarRating";
import Player from "./components/Player";
import Kanban, { moveCard } from "./components/Kanban";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { Board } from "./types/Card";

/* ---------------- #366 Dropdown ---------------- */

const OPTS = [
  { id: "a", label: "苹果" },
  { id: "b", label: "香蕉" },
];

test("[366] 点触发器展开、选中后收起并显示选中项", async () => {
  render(<Dropdown options={OPTS} />);
  expect(screen.queryByTestId("dropdown-list")).toBeNull();

  await userEvent.click(screen.getByTestId("dropdown-trigger"));
  expect(screen.getByTestId("dropdown-list")).toBeInTheDocument();
  expect(screen.getByTestId("dropdown-trigger")).toHaveAttribute("aria-expanded", "true");

  await userEvent.click(screen.getByTestId("option-b"));
  expect(screen.queryByTestId("dropdown-list")).toBeNull();
  expect(screen.getByTestId("dropdown-trigger")).toHaveTextContent("香蕉");
});

test("[366] 点外面会关掉，点自己里面不会", async () => {
  render(
    <div>
      <Dropdown options={OPTS} />
      <button data-testid="outside">外面</button>
    </div>,
  );
  await userEvent.click(screen.getByTestId("dropdown-trigger"));

  // 点自己内部：不该关
  await userEvent.click(screen.getByTestId("dropdown-list"));
  expect(screen.getByTestId("dropdown-list")).toBeInTheDocument();

  // 点外面：该关
  await userEvent.click(screen.getByTestId("outside"));
  expect(screen.queryByTestId("dropdown-list")).toBeNull();
});

test("[366] 按 Escape 关闭", async () => {
  render(<Dropdown options={OPTS} />);
  await userEvent.click(screen.getByTestId("dropdown-trigger"));
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByTestId("dropdown-list")).toBeNull();
});

test("[366] 卸载后解绑了 document 监听器（清理函数生效）", async () => {
  const add = vi.spyOn(document, "addEventListener");
  const remove = vi.spyOn(document, "removeEventListener");

  const { unmount } = render(<Dropdown options={OPTS} />);
  await userEvent.click(screen.getByTestId("dropdown-trigger"));   // 展开才会绑
  const added = add.mock.calls.filter(([t]) => t === "mousedown" || t === "keydown").length;
  expect(added).toBe(2);

  unmount();
  const removed = remove.mock.calls.filter(([t]) => t === "mousedown" || t === "keydown").length;
  expect(removed).toBe(2);   // 少了清理函数这里会是 0

  add.mockRestore();
  remove.mockRestore();
});

/* ---------------- #367 Tabs ---------------- */

const TABS = [
  { id: "one", label: "第一", content: <p>内容一</p> },
  { id: "two", label: "第二", content: <p>内容二</p> },
  { id: "three", label: "第三", content: <p>内容三</p> },
];

test("[367] 默认激活第一个，只渲染激活的面板", () => {
  render(<Tabs tabs={TABS} />);
  expect(screen.getByTestId("tab-one")).toHaveAttribute("aria-selected", "true");
  expect(screen.getByTestId("panel")).toHaveTextContent("内容一");
  expect(screen.queryByText("内容二")).toBeNull();
});

test("[367] 点第二个切换，aria-selected 跟着走", async () => {
  render(<Tabs tabs={TABS} />);
  await userEvent.click(screen.getByTestId("tab-two"));

  expect(screen.getByTestId("panel")).toHaveTextContent("内容二");
  expect(screen.getByTestId("tab-two")).toHaveAttribute("aria-selected", "true");
  expect(screen.getByTestId("tab-one")).toHaveAttribute("aria-selected", "false");
});

test("[367] initialId 能指定初始激活项", () => {
  render(<Tabs tabs={TABS} initialId="three" />);
  expect(screen.getByTestId("panel")).toHaveTextContent("内容三");
});

/* ---------------- #368 StarRating ---------------- */

test("[368] 点第三颗得 3 分，前三颗填充", async () => {
  render(<StarRating />);
  await userEvent.click(screen.getByTestId("star-3"));

  expect(screen.getByTestId("stars-value")).toHaveTextContent("3");
  expect(screen.getByTestId("star-3")).toHaveAttribute("data-filled", "true");
  expect(screen.getByTestId("star-4")).toHaveAttribute("data-filled", "false");
});

test("[368] hover 时预览、移出后回到已选值", async () => {
  render(<StarRating />);
  await userEvent.click(screen.getByTestId("star-2"));

  await userEvent.hover(screen.getByTestId("star-5"));
  expect(screen.getByTestId("star-5")).toHaveAttribute("data-filled", "true");   // 预览

  await userEvent.unhover(screen.getByTestId("star-5"));
  // 注意 unhover 只离开了那颗星，要真正离开整个容器
  await userEvent.pointer({ target: document.body });
  expect(screen.getByTestId("stars")).toHaveAttribute("data-value", "2");        // 已选值没变
});

test("[368] 再点同一颗清零", async () => {
  render(<StarRating />);
  await userEvent.click(screen.getByTestId("star-4"));
  await userEvent.click(screen.getByTestId("star-4"));
  expect(screen.getByTestId("stars-value")).toHaveTextContent("0");
});

test("[368] 受控模式下自己不改值，只调 onChange", async () => {
  const onChange = vi.fn();
  render(<StarRating value={1} onChange={onChange} />);
  await userEvent.click(screen.getByTestId("star-5"));

  expect(onChange).toHaveBeenCalledWith(5);
  expect(screen.getByTestId("stars")).toHaveAttribute("data-value", "1");   // 仍是父级给的 1
});

/* ---------------- #373 Player（useRef 操作 DOM） ---------------- */

let play: ReturnType<typeof vi.spyOn>;
let pause: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  // jsdom 没实现媒体播放，play() 会抛 Not implemented —— 所以要 stub
  play = vi
    .spyOn(HTMLMediaElement.prototype, "play")
    .mockImplementation(() => Promise.resolve());
  pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});

afterEach(() => {
  play.mockRestore();
  pause.mockRestore();
});

test("[373] 点 Play 调 audio.play()，再点调 pause()", async () => {
  render(<Player src="/a.mp3" />);
  expect(screen.getByTestId("toggle")).toHaveTextContent("Play");

  await userEvent.click(screen.getByTestId("toggle"));
  expect(play).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId("toggle")).toHaveTextContent("Pause");

  await userEvent.click(screen.getByTestId("toggle"));
  expect(pause).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId("toggle")).toHaveTextContent("Play");
});

test("[373] Stop 把 currentTime 归零并停下", async () => {
  render(<Player src="/a.mp3" />);
  const audio = screen.getByTestId("audio") as HTMLAudioElement;

  await userEvent.click(screen.getByTestId("toggle"));
  audio.currentTime = 30;
  await userEvent.click(screen.getByTestId("stop"));

  expect(audio.currentTime).toBe(0);          // 直接改的是 DOM 属性
  expect(screen.getByTestId("toggle")).toHaveTextContent("Play");
});

/* ---------------- #375 自定义 hook ---------------- */

test("[375] useLocalStorage 首次用默认值，并写进 localStorage", () => {
  localStorage.clear();
  const { result } = renderHook(() => useLocalStorage("k", { n: 1 }));

  expect(result.current[0]).toEqual({ n: 1 });
  expect(JSON.parse(localStorage.getItem("k")!)).toEqual({ n: 1 });
});

test("[375] 已有值时读出来，而不是用默认值", () => {
  localStorage.setItem("k", JSON.stringify("存过的"));
  const { result } = renderHook(() => useLocalStorage("k", "默认"));
  expect(result.current[0]).toBe("存过的");
});

test("[375] setValue 会同步写回", () => {
  localStorage.clear();
  const { result } = renderHook(() => useLocalStorage("k", 0));

  act(() => result.current[1](42));
  expect(result.current[0]).toBe(42);
  expect(localStorage.getItem("k")).toBe("42");
});

test("[375] 脏数据不会让组件炸，退回默认值", () => {
  localStorage.setItem("k", "{不是合法 JSON");
  const { result } = renderHook(() => useLocalStorage("k", "兜底"));
  expect(result.current[0]).toBe("兜底");
});

test("[375] 两个组件各调一次 = 两份独立状态（复用逻辑不复用状态）", () => {
  localStorage.clear();
  const a = renderHook(() => useLocalStorage("shared", 0));
  const b = renderHook(() => useLocalStorage("shared", 0));

  act(() => a.result.current[1](5));
  expect(a.result.current[0]).toBe(5);
  expect(b.result.current[0]).toBe(0);   // b 不会跟着变
});

/* ---------------- #378 Kanban ---------------- */

const board = (): Board => ({
  todo: [{ id: 1, title: "写文档" }, { id: 2, title: "改 bug" }],
  doing: [{ id: 3, title: "评审" }],
  done: [],
});

function deepFreeze<T>(o: T): T {
  Object.freeze(o);
  Object.values(o as Record<string, unknown>).forEach((v) => {
    if (v && typeof v === "object" && !Object.isFrozen(v)) deepFreeze(v);
  });
  return o;
}

test("[378] moveCard 把卡移到目标列，且不改原 board", () => {
  const original = deepFreeze(board());
  const next = moveCard(original, "todo", "doing", 1);

  expect(next.todo.map((c) => c.id)).toEqual([2]);
  expect(next.doing.map((c) => c.id)).toEqual([3, 1]);
  // 原对象一个字节都没动
  expect(original.todo.map((c) => c.id)).toEqual([1, 2]);
  expect(original.doing.map((c) => c.id)).toEqual([3]);
});

test("[378] 没动或找不到卡时原样返回同一个引用", () => {
  const b = board();
  expect(moveCard(b, "todo", "todo", 1)).toBe(b);
  expect(moveCard(b, "todo", "done", 999)).toBe(b);
});

test("[378] 没被碰到的列复用原数组引用（只重建改动的部分）", () => {
  const b = board();
  const next = moveCard(b, "todo", "doing", 1);
  expect(next.done).toBe(b.done);        // done 没动，引用不变
  expect(next.todo).not.toBe(b.todo);    // 动过的必须是新数组
});

test("[378] 点右移按钮，卡片换列且计数跟着变", async () => {
  render(<Kanban initial={board()} />);
  expect(screen.getByTestId("count-todo")).toHaveTextContent("2");
  expect(screen.getByTestId("card-1")).toHaveAttribute("data-col", "todo");

  await userEvent.click(screen.getByLabelText("把 写文档 右移"));

  expect(screen.getByTestId("card-1")).toHaveAttribute("data-col", "doing");
  expect(screen.getByTestId("count-todo")).toHaveTextContent("1");
  expect(screen.getByTestId("count-doing")).toHaveTextContent("2");
});

test("[378] 第一列没有左移按钮，最后一列没有右移按钮", () => {
  render(<Kanban initial={board()} />);
  expect(screen.queryByLabelText("把 写文档 左移")).toBeNull();   // todo 是第一列
  expect(screen.getByLabelText("把 评审 右移")).toBeInTheDocument();
});

test("[378] 新增的卡进 todo 列", async () => {
  render(<Kanban initial={board()} />);
  await userEvent.type(screen.getByTestId("card-input"), "新任务");
  await userEvent.click(screen.getByTestId("card-submit"));

  expect(screen.getByTestId("col-todo")).toHaveTextContent("新任务");
  expect(screen.getByTestId("count-todo")).toHaveTextContent("3");
});`;

const C_SLICE = `import { createSlice, nanoid } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type Filter = "all" | "active" | "done";
export interface Todo { id: string; text: string; done: boolean }
export interface TodosState { items: Todo[]; filter: Filter }

const initialState: TodosState = { items: [], filter: "all" };

const todosSlice = createSlice({
  name: "todos",
  initialState,
  reducers: {
    // 看着像在改 state，其实 RTK 内置的 Immer 给的是草稿代理，
    // 最终产出的是新对象 —— 所以并不违反「state 只读」这条原则。
    added: {
      // prepare 让 action creator 只收 text，id 在这里生成 —— 这样
      // reducer 里就不会出现 nanoid()，reducer 保持纯函数。
      reducer(state, action: PayloadAction<Todo>) {
        state.items.push(action.payload);
      },
      prepare(text: string) {
        return { payload: { id: nanoid(), text: text.trim(), done: false } };
      },
    },
    toggled(state, action: PayloadAction<string>) {
      const t = state.items.find((x) => x.id === action.payload);
      if (t) t.done = !t.done;
    },
    removed(state, action: PayloadAction<string>) {
      state.items = state.items.filter((x) => x.id !== action.payload);
    },
    clearedDone(state) {
      state.items = state.items.filter((x) => !x.done);
    },
    filterChanged(state, action: PayloadAction<Filter>) {
      state.filter = action.payload;
    },
  },
});

export const { added, toggled, removed, clearedDone, filterChanged } = todosSlice.actions;
export default todosSlice.reducer;

/* ---------- selectors：组件只订阅它真正要用的那部分 ---------- */

export const selectFilter = (s: { todos: TodosState }) => s.todos.filter;
export const selectRemaining = (s: { todos: TodosState }) =>
  s.todos.items.filter((t) => !t.done).length;

export const selectVisible = (s: { todos: TodosState }) => {
  const { items, filter } = s.todos;
  if (filter === "all") return items;
  return items.filter((t) => (filter === "done" ? t.done : !t.done));
};`;

const C_STORE = `import { configureStore } from "@reduxjs/toolkit";
import todos from "./todosSlice";

// configureStore 默认就装好了 thunk 和 DevTools，不用自己 applyMiddleware
export const makeStore = () => configureStore({ reducer: { todos } });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];`;

const C_RTKAPP = `import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  added,
  clearedDone,
  filterChanged,
  removed,
  selectFilter,
  selectRemaining,
  selectVisible,
  toggled,
  type Filter,
} from "../../store/todosSlice";

const TodoApp: React.FC = () => {
  const dispatch = useDispatch();
  // 三个 selector 各自订阅一小块：只有这一块变了才重渲染，
  // 这正是 Context 做不到的（context 一变所有消费者都重渲染）
  const visible = useSelector(selectVisible);
  const remaining = useSelector(selectRemaining);
  const filter = useSelector(selectFilter);

  const [text, setText] = useState("");
  const invalid = text.trim() === "";

  return (
    <div data-testid="todo-app">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (invalid) return;
          dispatch(added(text));      // prepare 里生成 id
          setText("");
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} data-testid="input" />
        <button type="submit" disabled={invalid} data-testid="submit">Add</button>
      </form>

      <span data-testid="remaining">{remaining} left</span>
      <button onClick={() => dispatch(clearedDone())} data-testid="clear-done">Clear done</button>

      {(["all", "active", "done"] as Filter[]).map((f) => (
        <button
          key={f}
          onClick={() => dispatch(filterChanged(f))}
          aria-pressed={filter === f}
          data-testid={\`filter-\${f}\`}
        >
          {f}
        </button>
      ))}

      <ul data-testid="list">
        {visible.map((t) => (
          <li key={t.id} data-done={t.done}>
            <input
              type="checkbox"
              checked={t.done}
              onChange={() => dispatch(toggled(t.id))}
              aria-label={\`toggle \${t.text}\`}
            />
            <span>{t.text}</span>
            <button onClick={() => dispatch(removed(t.id))} aria-label={\`delete \${t.text}\`}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoApp;`;

const C_RTKTEST = `import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { expect, test } from "vitest";
import TodoApp from "./components/TodoApp";
import { makeStore } from "./store";
import reducer, {
  added,
  clearedDone,
  filterChanged,
  removed,
  selectVisible,
  toggled,
  type TodosState,
} from "./store/todosSlice";

const empty: TodosState = { items: [], filter: "all" };

/* ---------- reducer 是纯函数，可以脱离 React 单测 ---------- */

test("[371] added 追加一条，且不改原 state（Immer 产出的是新对象）", () => {
  const next = reducer(empty, added("买牛奶"));

  expect(next.items).toHaveLength(1);
  expect(next.items[0].text).toBe("买牛奶");
  expect(next.items[0].done).toBe(false);
  expect(empty.items).toHaveLength(0);      // 原 state 没动
  expect(next).not.toBe(empty);             // 是新对象
});

test("[371] added 会 trim，且 id 在 prepare 里生成（reducer 保持纯）", () => {
  const next = reducer(empty, added("  写文档  "));
  expect(next.items[0].text).toBe("写文档");
  expect(next.items[0].id).toBeTruthy();

  // 同一段文本两次 dispatch，id 不同 —— 说明 id 不是 reducer 算的
  const a = added("x");
  const b = added("x");
  expect(a.payload.id).not.toBe(b.payload.id);
});

test("[371] toggled 只翻转命中的那条", () => {
  let s = reducer(empty, added("A"));
  s = reducer(s, added("B"));
  const idA = s.items[0].id;

  const next = reducer(s, toggled(idA));
  expect(next.items[0].done).toBe(true);
  expect(next.items[1].done).toBe(false);
});

test("[371] removed 按 id 删；clearedDone 只删已完成", () => {
  let s = reducer(empty, added("A"));
  s = reducer(s, added("B"));
  const [a, b] = s.items;

  expect(reducer(s, removed(a.id)).items.map((t) => t.text)).toEqual(["B"]);

  s = reducer(s, toggled(b.id));
  expect(reducer(s, clearedDone()).items.map((t) => t.text)).toEqual(["A"]);
});

test("[371] selectVisible 按 filter 派生，不改底层数据", () => {
  let s = reducer(empty, added("A"));
  s = reducer(s, added("B"));
  s = reducer(s, toggled(s.items[0].id));

  const withFilter = (f: Parameters<typeof filterChanged>[0]) => ({
    todos: reducer(s, filterChanged(f)),
  });

  expect(selectVisible({ todos: s }).map((t) => t.text)).toEqual(["A", "B"]);
  expect(selectVisible(withFilter("done")).map((t) => t.text)).toEqual(["A"]);
  expect(selectVisible(withFilter("active")).map((t) => t.text)).toEqual(["B"]);

  // 筛选只影响「看到什么」，底层 items 仍是两条
  expect(s.items).toHaveLength(2);
});

/* ---------- 组件 + Provider 的集成测试 ---------- */

const renderApp = () =>
  render(
    <Provider store={makeStore()}>
      <TodoApp />
    </Provider>,
  );

test("[371] 通过 UI 新增，列表和计数都跟着变", async () => {
  renderApp();
  expect(screen.getByTestId("submit")).toBeDisabled();

  await userEvent.type(screen.getByTestId("input"), "买牛奶");
  await userEvent.click(screen.getByTestId("submit"));

  expect(screen.getByTestId("list")).toHaveTextContent("买牛奶");
  expect(screen.getByTestId("remaining")).toHaveTextContent("1 left");
  expect(screen.getByTestId("input")).toHaveValue("");
});

test("[371] 勾选一条，remaining 减一", async () => {
  renderApp();
  await userEvent.type(screen.getByTestId("input"), "A");
  await userEvent.click(screen.getByTestId("submit"));
  await userEvent.type(screen.getByTestId("input"), "B");
  await userEvent.click(screen.getByTestId("submit"));

  expect(screen.getByTestId("remaining")).toHaveTextContent("2 left");
  await userEvent.click(screen.getByLabelText("toggle A"));
  expect(screen.getByTestId("remaining")).toHaveTextContent("1 left");
});

test("[371] 筛选不会丢数据，切回 all 两条都在", async () => {
  renderApp();
  for (const t of ["A", "B"]) {
    await userEvent.type(screen.getByTestId("input"), t);
    await userEvent.click(screen.getByTestId("submit"));
  }
  await userEvent.click(screen.getByLabelText("toggle A"));

  await userEvent.click(screen.getByTestId("filter-done"));
  expect(screen.getByTestId("list")).toHaveTextContent("A");
  expect(screen.getByTestId("list")).not.toHaveTextContent("B");

  await userEvent.click(screen.getByTestId("filter-all"));
  expect(screen.getByTestId("list")).toHaveTextContent("A");
  expect(screen.getByTestId("list")).toHaveTextContent("B");
});`;

export const ivCoding: Module = {
  id: "iv-coding",
  stage: "面试 · 第 7 部分",
  title: "Coding 题：对照与补缺",
  titleEn: "Coding problems: what is covered and what is missing",
  summary:
    "16 道 coding 题逐题对照本站已有的练习：9 道已经被 Q1、Q2、五道变式题和两套模拟考覆盖，7 道是真缺口。缺口题的参考解法都在本机跑过测试（24 / 24 加 8 / 8）。",
  summaryEn:
    "The 16 coding problems compared one by one against the exercises already on this site: 9 are already covered by Q1, Q2, the five variant tasks and the two mock exams, and 7 are real gaps. The reference solutions for the gap problems were all run against tests on a local machine (24 / 24 plus 8 / 8).",
  lessons: [
    /* ============================================================
       对照表
       ============================================================ */
    {
      id: "iv-coding-map",
      title: "16 道题逐题对照",
      titleEn: "The 16 problems, compared one by one",
      blurb: "哪些已经写过、哪些是缺口、缺的那道到底在考什么。",
      blurbEn:
        "Which ones you have already written, which ones are gaps, and what the missing ones actually test.",
      minutes: 12,
      objectives: [
        "知道这 16 道题分别对应本站哪一节课",
        "识别出「换了个业务壳但考点相同」的题",
        "说清 7 道缺口题各自新增的是什么考点",
      ],
      objectivesEn: [
        "Know which lesson on this site each of the 16 problems maps to",
        "Recognise problems that only change the story around them and test the same thing",
        "Say what each of the 7 gap problems adds that the others do not test",
      ],
      whyForAssessment:
        "coding 题的名字千变万化，考点其实很少。把 16 道题归成几类之后你会发现：能独立写出 Q1 的 CRUD、变式三的 fetch 三态、变式五的 Context，题库里一半的题就自动会了。这一节的用处是让你不要重复刷同类题。",
      whyForAssessmentEn:
        "Coding problems come with endless different names, but they test very few things. Once you sort the 16 into groups you can see it: if you can write the CRUD of Q1, the three fetch states of variant three and the Context of variant five on your own, half the question bank is already answered. This lesson is here so you do not practise the same problem over and over.",
      concepts: [
        {
          id: "map",
          heading: "覆盖对照表",
          headingEn: "The coverage table",
          lede: "9 道已覆盖，7 道补进来。",
          ledeEn: "9 are already covered; 7 are added here.",
          body: (
            <>
              <p>
                <strong>「已覆盖」的判断标准是</strong>：
                能不能用本站某一节课里
                <strong>真跑过测试的那套解法</strong>
                原样解决。只是「概念讲过」不算。
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>题目</th>
                      <th>本站哪里</th>
                      <th>结论</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>363</td>
                      <td>Counter Component</td>
                      <td>React 考试 ·「useState：让界面跟着数据变」</td>
                      <td>已覆盖</td>
                    </tr>
                    <tr>
                      <td>364</td>
                      <td>Toggle Switch</td>
                      <td>变式一 TodoList 的 toggle + 变式五主题切换</td>
                      <td>已覆盖</td>
                    </tr>
                    <tr>
                      <td>365</td>
                      <td>Search Bar</td>
                      <td>「受控输入：value + onChange 的闭环」</td>
                      <td>已覆盖</td>
                    </tr>
                    <tr>
                      <td><strong>366</strong></td>
                      <td><strong>Dropdown Menu</strong></td>
                      <td>—</td>
                      <td>
                        <strong>补</strong>：点击外部关闭需要
                        <code>useRef</code> 拿 DOM +
                        <code>document</code> 监听 + 清理
                      </td>
                    </tr>
                    <tr>
                      <td><strong>367</strong></td>
                      <td><strong>Tabs Component</strong></td>
                      <td>—</td>
                      <td>
                        <strong>补</strong>：只存「哪个激活」，
                        面板是派生的；顺带 ARIA
                      </td>
                    </tr>
                    <tr>
                      <td><strong>368</strong></td>
                      <td><strong>Star Rating</strong></td>
                      <td>—</td>
                      <td>
                        <strong>补</strong>：hover 预览 + 已选值
                        两个状态叠加，受控/非受控双模式
                      </td>
                    </tr>
                    <tr>
                      <td>369</td>
                      <td>GET openlibrary.org</td>
                      <td>变式三 · fetch 取数（三态 + 竞态 + abort）</td>
                      <td>已覆盖</td>
                    </tr>
                    <tr>
                      <td>370</td>
                      <td>GET jsonplaceholder</td>
                      <td>同上 —— 换了个 URL，考点一样</td>
                      <td>已覆盖</td>
                    </tr>
                    <tr>
                      <td><strong>371</strong></td>
                      <td><strong>Todo + Redux Toolkit</strong></td>
                      <td>变式一是 useState 版；Redux 只在八股里讲过</td>
                      <td>
                        <strong>补</strong>：同一个业务换成
                        <code>createSlice</code> + selector
                      </td>
                    </tr>
                    <tr>
                      <td>372</td>
                      <td>Context API for Global State</td>
                      <td>变式五 · 主题切换（含 value 记忆化）</td>
                      <td>已覆盖</td>
                    </tr>
                    <tr>
                      <td><strong>373</strong></td>
                      <td><strong>Music Player（useRef）</strong></td>
                      <td>—</td>
                      <td>
                        <strong>补</strong>：<code>useRef</code>
                        的另一种用法 —— 拿 DOM 节点调命令式 API
                      </td>
                    </tr>
                    <tr>
                      <td>374</td>
                      <td>Search Filter for Users</td>
                      <td>变式三取数 + 变式一筛选，两节拼起来</td>
                      <td>已覆盖（可当组合练习）</td>
                    </tr>
                    <tr>
                      <td><strong>375</strong></td>
                      <td><strong>Create a Custom Hook</strong></td>
                      <td>八股 #340 讲了理论，但没有动手练习</td>
                      <td><strong>补</strong>：写一个 <code>useLocalStorage</code></td>
                    </tr>
                    <tr>
                      <td>376</td>
                      <td>parent and child component</td>
                      <td>「props：数据往下流，事件往上报」+ Q1</td>
                      <td>已覆盖</td>
                    </tr>
                    <tr>
                      <td>377</td>
                      <td>Task Management Dashboard</td>
                      <td>Q1 CRUD + 模拟考 A（Support Tickets）</td>
                      <td>已覆盖（模拟考就是它的同类）</td>
                    </tr>
                    <tr>
                      <td><strong>378</strong></td>
                      <td><strong>Kanban board</strong></td>
                      <td>—</td>
                      <td>
                        <strong>补</strong>：跨列移动 =
                        <strong>一次操作同时改两个数组</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>The bar for &ldquo;already covered&rdquo; is this</strong>: can
                you solve the question as-is with a solution from a lesson here that{" "}
                <strong>really passed its tests</strong>. &ldquo;We explained the
                concept&rdquo; does not count.
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Question</th>
                      <th>Where on this site</th>
                      <th>Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>363</td>
                      <td>Counter Component</td>
                      <td>React exam &middot; &ldquo;useState: let the UI follow the data&rdquo;</td>
                      <td>covered</td>
                    </tr>
                    <tr>
                      <td>364</td>
                      <td>Toggle Switch</td>
                      <td>the toggle in variant 1 TodoList + the theme switch in variant 5</td>
                      <td>covered</td>
                    </tr>
                    <tr>
                      <td>365</td>
                      <td>Search Bar</td>
                      <td>&ldquo;Controlled inputs: the value + onChange loop&rdquo;</td>
                      <td>covered</td>
                    </tr>
                    <tr>
                      <td><strong>366</strong></td>
                      <td><strong>Dropdown Menu</strong></td>
                      <td>—</td>
                      <td>
                        <strong>new</strong>: closing on an outside click needs{" "}
                        <code>useRef</code> for the DOM node, a{" "}
                        <code>document</code> listener, and cleanup
                      </td>
                    </tr>
                    <tr>
                      <td><strong>367</strong></td>
                      <td><strong>Tabs Component</strong></td>
                      <td>—</td>
                      <td>
                        <strong>new</strong>: store only &ldquo;which one is
                        active&rdquo;, the panel is derived; ARIA on top
                      </td>
                    </tr>
                    <tr>
                      <td><strong>368</strong></td>
                      <td><strong>Star Rating</strong></td>
                      <td>—</td>
                      <td>
                        <strong>new</strong>: hover preview stacked on the picked
                        value, controlled and uncontrolled in one component
                      </td>
                    </tr>
                    <tr>
                      <td>369</td>
                      <td>GET openlibrary.org</td>
                      <td>variant 3 &middot; fetching data (three states + races + abort)</td>
                      <td>covered</td>
                    </tr>
                    <tr>
                      <td>370</td>
                      <td>GET jsonplaceholder</td>
                      <td>same as above — different URL, same point</td>
                      <td>covered</td>
                    </tr>
                    <tr>
                      <td><strong>371</strong></td>
                      <td><strong>Todo + Redux Toolkit</strong></td>
                      <td>variant 1 is the useState version; Redux only came up in interview prep</td>
                      <td>
                        <strong>new</strong>: the same feature rebuilt on{" "}
                        <code>createSlice</code> + selectors
                      </td>
                    </tr>
                    <tr>
                      <td>372</td>
                      <td>Context API for Global State</td>
                      <td>variant 5 &middot; theme switching (with a memoized value)</td>
                      <td>covered</td>
                    </tr>
                    <tr>
                      <td><strong>373</strong></td>
                      <td><strong>Music Player (useRef)</strong></td>
                      <td>—</td>
                      <td>
                        <strong>new</strong>: the other use of <code>useRef</code>{" "}
                        — grab a DOM node and call its imperative API
                      </td>
                    </tr>
                    <tr>
                      <td>374</td>
                      <td>Search Filter for Users</td>
                      <td>fetching from variant 3 + filtering from variant 1, glued together</td>
                      <td>covered (works as a combo drill)</td>
                    </tr>
                    <tr>
                      <td><strong>375</strong></td>
                      <td><strong>Create a Custom Hook</strong></td>
                      <td>interview #340 covered the theory but had no hands-on drill</td>
                      <td><strong>new</strong>: write a <code>useLocalStorage</code></td>
                    </tr>
                    <tr>
                      <td>376</td>
                      <td>parent and child component</td>
                      <td>&ldquo;props: data flows down, events report up&rdquo; + Q1</td>
                      <td>covered</td>
                    </tr>
                    <tr>
                      <td>377</td>
                      <td>Task Management Dashboard</td>
                      <td>Q1 CRUD + mock exam A (Support Tickets)</td>
                      <td>covered (the mock exam is the same species)</td>
                    </tr>
                    <tr>
                      <td><strong>378</strong></td>
                      <td><strong>Kanban board</strong></td>
                      <td>—</td>
                      <td>
                        <strong>new</strong>: moving across columns ={" "}
                        <strong>changing two arrays in one operation</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ),
        },
        {
          id: "classes",
          heading: "16 道题其实只有五类考点",
          headingEn: "The 16 problems really test only five things",
          lede: "认出类别，就不用一道道刷。",
          ledeEn: "Once you can name the group, you do not have to practise them one by one.",
          body: (
            <>
              <ol>
                <li>
                  <strong>受控输入 + 列表 CRUD</strong>——
                  363 / 364 / 365 / 371 / 374 / 376 / 377。
                  <strong>七道题一个考点</strong>：
                  <code>value</code> + <code>onChange</code>、
                  三种不可变更新、派生数据。
                  <strong>Q1 那道真题就是它的完整版。</strong>
                </li>
                <li>
                  <strong>异步取数三态</strong>—— 369 / 370 / 374。
                  loading / error / data，
                  加上 <code>res.ok</code> 和竞态。
                  <strong>变式三覆盖。</strong>
                </li>
                <li>
                  <strong>跨层共享状态</strong>—— 372 / 371。
                  Context 或状态库。
                  <strong>变式五覆盖 Context，371 补 Redux。</strong>
                </li>
                <li>
                  <strong>组件内部的交互状态机</strong>——
                  366 / 367 / 368。
                  开关、激活项、hover 预览。
                  <strong>这一类之前完全没有，是最大的缺口。</strong>
                </li>
                <li>
                  <strong>命令式逃逸口</strong>—— 373。
                  <code>useRef</code> 拿 DOM 节点。
                  React 里唯一「不走声明式」的地方。
                </li>
              </ol>
              <p>
                <strong>378（Kanban）是第 1 类的升级版</strong>：
                普通 CRUD 改一个数组，
                跨列移动要<strong>同时改两个数组</strong>，
                这一步很多人会写成先删再加两次
                <code>setState</code>，
                导致中间态被渲染出来。
              </p>
              <p>
                <strong>怎么用这一节：</strong>
                如果你能独立写出 Q1、变式三、变式五，
                <strong>1 / 2 / 3 三类的九道题都不用再刷</strong>。
                直接做下面四节补的题。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <ol>
                <li>
                  <strong>Controlled input + list CRUD</strong> —
                  363 / 364 / 365 / 371 / 374 / 376 / 377.{" "}
                  <strong>Seven questions, one point</strong>: <code>value</code> +{" "}
                  <code>onChange</code>, the three immutable updates, derived data.{" "}
                  <strong>Q1 in the real exam is the full version of it.</strong>
                </li>
                <li>
                  <strong>The three states of async fetching</strong> — 369 / 370 / 374.
                  loading / error / data, plus <code>res.ok</code> and races.{" "}
                  <strong>Variant 3 covers it.</strong>
                </li>
                <li>
                  <strong>State shared across layers</strong> — 372 / 371. Context or a
                  state library.{" "}
                  <strong>Variant 5 covers Context, 371 adds Redux.</strong>
                </li>
                <li>
                  <strong>A widget&rsquo;s own interaction state machine</strong> —
                  366 / 367 / 368. Open or closed, active item, hover preview.{" "}
                  <strong>Nothing here touched this class before, so it was the
                  biggest gap.</strong>
                </li>
                <li>
                  <strong>The imperative escape hatch</strong> — 373.{" "}
                  <code>useRef</code> to reach a DOM node. The one place in React that
                  is not declarative.
                </li>
              </ol>
              <p>
                <strong>378 (Kanban) is class 1 leveled up</strong>: plain CRUD changes
                one array, moving across columns has to{" "}
                <strong>change two arrays at once</strong>. Plenty of people write that
                step as delete-then-add with two <code>setState</code> calls, which
                renders the in-between state.
              </p>
              <p>
                <strong>How to use this lesson:</strong> if you can write Q1, variant 3
                and variant 5 on your own,{" "}
                <strong>the nine questions in classes 1 / 2 / 3 need no more
                drilling</strong>. Go straight to the four lessons below.
              </p>
            </>
          ),
        },
      ],
      exercises: [
        {
          kind: "recognition",
          id: "iv-coding-recog",
          title: "认出考点：这道题在考什么",
          level: 1,
          generated: true,
          prompt: (
            <p>
              面试官出题：「实现一个 Kanban 看板，卡片可以在三列之间移动。」
              这道题<strong>最核心</strong>的考点是哪一个？
            </p>
          ),
          options: [
            { id: "a", label: "拖拽事件（HTML5 drag and drop API）的用法" },
            { id: "b", label: "一次操作要同时对两个数组做不可变更新，且只能触发一次 state 变化" },
            { id: "c", label: "CSS Grid 三列布局" },
            { id: "d", label: "useEffect 的依赖数组怎么写" },
          ],
          answer: ["b"],
          explain: (
            <>
              <p>
                <strong>B。</strong>拖拽只是交互外壳 ——
                面试里用两个箭头按钮代替拖拽，
                考点一点没少（而且更好测）。
              </p>
              <p>
                真正的难点是：<strong>移动一张卡要同时改「源列」和「目标列」</strong>。
                写成两次 <code>setState</code>
                （先从源列删、再往目标列加）
                在 React 18 里虽然会被批处理，
                但<strong>逻辑上是两个独立操作</strong>——
                一旦中间加了校验或提前 return，
                就会出现「卡片凭空消失」。
              </p>
              <p>
                <strong>正解是写一个纯函数
                <code>moveCard(board, from, to, id)</code>，
                一次返回完整的新 board</strong>。
                这样它可以脱离 React 单测，
                也不可能产生中间态。
              </p>
              <p>
                顺带一个加分点：<strong>没被碰到的那一列应该复用原数组引用</strong>，
                这样用了 <code>React.memo</code> 的列不会白重渲染 ——
                和评论树那道题「只重建路径」是同一个思路。
              </p>
            </>
          ),
        },
      ],
      recap: [
        "16 道题里 9 道已被 Q1、Q2、五道变式题和两套模拟考覆盖，别重复刷。",
        "五类考点：受控输入+CRUD（七道）、异步三态、跨层共享、组件内交互状态机、useRef 命令式。",
        "最大的缺口是第四类「组件内部交互状态机」—— Dropdown / Tabs / 星级评分。",
        "Kanban 是 CRUD 的升级版：一次操作同时改两个数组，要写成一个纯函数。",
      ],
      recapEn: [
        "9 of the 16 problems are already covered by Q1, Q2, the five variant tasks and the two mock exams — do not practise them again.",
        "Five things are tested: controlled inputs plus CRUD (seven problems), the three async states, sharing state across levels, interaction state inside one component, and useRef for direct DOM calls.",
        "The largest gap is the fourth one, interaction state inside a single component — Dropdown, Tabs and star rating.",
        "Kanban is CRUD one step up: one action changes two arrays at the same time, and it should be written as one pure function.",
      ],
    },

    /* ============================================================
       缺口一 · 组件内部的交互状态机
       ============================================================ */
    {
      id: "iv-coding-widgets",
      title: "缺口一 · Dropdown、Tabs、星级评分",
      titleEn: "Gap 1 · dropdown, tabs and star rating",
      blurb: "三个小组件，考的是「组件自己的交互状态怎么管」—— 之前五道变式题一个都没覆盖到。",
      blurbEn:
        "Three small components. They test how a component manages its own interaction state, which none of the five earlier variant tasks covered.",
      minutes: 24,
      objectives: [
        "用 useRef + document 监听实现「点外面关掉」，并正确清理",
        "说清 Tabs 为什么只需要一个 state",
        "把「hover 预览」和「已选值」叠成一个显示值",
        "实现同时支持受控和非受控的组件",
      ],
      objectivesEn: [
        "Close on a click outside using useRef plus a document listener, and clean the listener up correctly",
        "Explain why Tabs needs only one piece of state",
        "Combine a hover preview and a chosen value into one displayed value",
        "Build a component that works both controlled and uncontrolled",
      ],
      whyForAssessment:
        "这三道是 Easy / Medium 里出现频率最高的。它们代码量小，所以面试官会盯细节：点外面关不关、Escape 关不关、监听器解绑没有、ARIA 有没有、hover 移出后回不回到已选值。写得出来是及格，这些细节全中才是好。",
      whyForAssessmentEn:
        "These three come up most often among the easy and medium problems. There is little code, so the interviewer watches the details: does a click outside close it, does Escape close it, is the listener removed, are the ARIA attributes there, does it go back to the chosen value when the pointer leaves. Getting it to work is a pass; getting every detail right is a good answer.",
      concepts: [
        {
          id: "dropdown",
          heading: "Dropdown：点外面要关掉",
          headingEn: "Dropdown: a click outside has to close it",
          lede: "这道题唯一的难点就是「怎么知道用户点的不是我」。",
          ledeEn: "The only hard part here is telling that the click was not inside my own element.",
          body: (
            <>
              <p>
                <strong>思路三步：</strong>
              </p>
              <ol>
                <li>
                  用 <code>useRef</code> 拿到自己那个容器的 DOM 节点。
                </li>
                <li>
                  在 <code>document</code> 上监听
                  <code>mousedown</code>，
                  用 <code>ref.current.contains(e.target)</code>
                  判断点击是否发生在自己内部。
                </li>
                <li>
                  <strong>清理函数里解绑</strong>。
                </li>
              </ol>
              <p>
                <strong>四个细节决定这道题写得好不好：</strong>
              </p>
              <ul>
                <li>
                  <strong>用 <code>mousedown</code> 而不是
                  <code>click</code></strong>。
                  <code>click</code> 在按下和松开之间如果 DOM 变了
                  会有诡异行为；而且 <code>mousedown</code>
                  更早，关闭反应更快。
                </li>
                <li>
                  <strong><code>contains</code> 而不是
                  <code>e.target === ref.current</code></strong>——
                  用户点的是内部的按钮，不是容器本身。
                  <strong>这和事件委托里
                  <code>closest()</code> 是同一个道理。</strong>
                </li>
                <li>
                  <strong>依赖 <code>[open]</code>，没展开就不绑</strong>——
                  少一个常驻监听器。
                </li>
                <li>
                  <strong>Escape 也要能关</strong>——
                  这是可访问性的基本要求，
                  面试官经常拿它当加分项。
                </li>
              </ul>
              <p>
                <strong>不写清理函数的后果</strong>和计时器那道题一样：
                每次展开多绑一对监听器；组件卸载后监听器还在，
                回调里 <code>setOpen</code> 会对已卸载的组件操作。
                <strong>测试里我直接 spy 了
                <code>document.addEventListener</code> 和
                <code>removeEventListener</code>，
                断言两边次数相等</strong>——
                漏了清理这条会红。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>Three steps:</strong>
              </p>
              <ol>
                <li>
                  Use <code>useRef</code> to get the DOM node of your own container.
                </li>
                <li>
                  Listen for <code>mousedown</code> on <code>document</code> and use{" "}
                  <code>ref.current.contains(e.target)</code> to decide whether the
                  click happened inside you.
                </li>
                <li>
                  <strong>Unbind in the cleanup function</strong>.
                </li>
              </ol>
              <p>
                <strong>Four details decide whether this one is written well:</strong>
              </p>
              <ul>
                <li>
                  <strong>Use <code>mousedown</code>, not <code>click</code></strong>.{" "}
                  <code>click</code> gets weird if the DOM changes between press and
                  release, and <code>mousedown</code> fires earlier, so closing feels
                  faster.
                </li>
                <li>
                  <strong><code>contains</code>, not{" "}
                  <code>e.target === ref.current</code></strong> — the user clicks a
                  button inside, not the container itself.{" "}
                  <strong>Same reasoning as <code>closest()</code> in event
                  delegation.</strong>
                </li>
                <li>
                  <strong>Depend on <code>[open]</code>, do not bind while
                  closed</strong> — one less permanent listener.
                </li>
                <li>
                  <strong>Escape has to close it too</strong> — a baseline
                  accessibility requirement, and interviewers often use it as the
                  bonus point.
                </li>
              </ul>
              <p>
                <strong>Skipping the cleanup function</strong> costs you the same as in
                the timer question: every open binds one more pair of listeners, and
                after the component unmounts the listener is still there, so the
                callback calls <code>setOpen</code> on an unmounted component.{" "}
                <strong>The test spies on <code>document.addEventListener</code> and{" "}
                <code>removeEventListener</code> directly and asserts the two counts
                match</strong> — miss the cleanup and it goes red.
              </p>
            </>
          ),
          code: [
            tested("tsx", C_DROPDOWN, {
              filename: "src/components/Dropdown/index.tsx（实测通过）",
              filenameEn: "src/components/Dropdown/index.tsx (passes in a real run)",
              codeEn: C_DROPDOWN_EN,
              collapsible: true,
            }),
          ],
        },
        {
          id: "tabs",
          heading: "Tabs：只需要一个 state",
          headingEn: "Tabs: one piece of state is enough",
          lede: "很多人会给每个 tab 存一个 isActive，那是多余的。",
          ledeEn: "Many people keep an isActive flag on every tab. That is not needed.",
          body: (
            <>
              <p>
                <strong>唯一需要记住的事实是「哪个 id 是激活的」。</strong>
                当前该渲染哪个面板、哪个按钮高亮，
                <strong>全都能从这一个值算出来</strong>——
                典型的派生数据。
              </p>
              <p>
                <strong>两个实现选择要想清楚：</strong>
              </p>
              <ul>
                <li>
                  <strong>只渲染激活的面板</strong>（本实现）——
                  简单，但切回来时面板内部的 state 会丢。
                </li>
                <li>
                  <strong>全部渲染、用 CSS 隐藏</strong>——
                  能保住面板内部状态，
                  但一上来就要渲染所有内容。
                  <strong>面试里主动说出这个取舍会加分。</strong>
                </li>
              </ul>
              <p>
                <strong>ARIA 三件套别漏</strong>：
                <code>role=&quot;tablist&quot;</code> /
                <code>role=&quot;tab&quot;</code> +
                <code>aria-selected</code> /
                <code>role=&quot;tabpanel&quot;</code>，
                再用 <code>aria-controls</code> 和
                <code>aria-labelledby</code> 把 tab 和 panel 关联起来。
                <strong>写了这几行，题目就从「能跑」变成「像个前端写的」。</strong>
              </p>
              <p>
                <strong>会追问：</strong>
                「键盘左右箭头切换怎么做？」——
                在 <code>tablist</code> 上监听
                <code>keydown</code>，
                按 <code>ArrowRight</code> / <code>ArrowLeft</code>
                改 <code>activeId</code>，
                并把非激活 tab 的
                <code>tabIndex</code> 设成 <code>-1</code>
                （让 Tab 键只进入激活项）。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>The only fact you need to keep is which id is active.</strong>{" "}
                Which panel to render and which button to highlight{" "}
                <strong>can all be computed from that one value</strong> — textbook
                derived data.
              </p>
              <p>
                <strong>Two implementation choices to think through:</strong>
              </p>
              <ul>
                <li>
                  <strong>Render only the active panel</strong> (what this one does) —
                  simple, but state inside a panel is lost when you switch back.
                </li>
                <li>
                  <strong>Render them all and hide with CSS</strong> — keeps the panel
                  state, but everything renders up front.{" "}
                  <strong>Bringing this trade-off up yourself scores points.</strong>
                </li>
              </ul>
              <p>
                <strong>Do not drop the three ARIA pieces</strong>:{" "}
                <code>role=&quot;tablist&quot;</code> /{" "}
                <code>role=&quot;tab&quot;</code> + <code>aria-selected</code> /{" "}
                <code>role=&quot;tabpanel&quot;</code>, then tie tab and panel together
                with <code>aria-controls</code> and <code>aria-labelledby</code>.{" "}
                <strong>Those few lines turn the answer from &ldquo;it runs&rdquo; into
                &ldquo;a front-end person wrote this&rdquo;.</strong>
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;How do the left and right arrow keys
                switch tabs?&rdquo; — listen for <code>keydown</code> on the{" "}
                <code>tablist</code>, change <code>activeId</code> on{" "}
                <code>ArrowRight</code> / <code>ArrowLeft</code>, and set{" "}
                <code>tabIndex</code> to <code>-1</code> on the inactive tabs (so Tab
                only enters the active one).
              </p>
            </>
          ),
          code: [
            tested("tsx", C_TABS, {
              filename: "src/components/Tabs/index.tsx（实测通过）",
              filenameEn: "src/components/Tabs/index.tsx (passes in a real run)",
              codeEn: C_TABS_EN,
            }),
          ],
        },
        {
          id: "stars",
          heading: "星级评分：两个状态叠出一个显示值",
          headingEn: "Star rating: two pieces of state produce one displayed value",
          lede: "已选值 + hover 预览，显示的是「有 hover 就用 hover」。",
          ledeEn: "A chosen value plus a hover preview: show the hover value whenever there is one.",
          body: (
            <>
              <p>
                <strong>核心一行：</strong>
                <code>const shown = hover ?? current</code>。
              </p>
              <p>
                <strong>为什么用 <code>??</code> 而不是
                <code>||</code></strong>——
                这里正好是 #281 讲过的坑：
                <code>hover</code> 可能是 <code>0</code>
                （虽然本实现从 1 开始，但如果你支持 0 星就会踩），
                <code>||</code> 会把 <code>0</code> 当成「没 hover」。
                <strong>用 <code>??</code> 才对，
                而且 <code>hover</code> 的类型是
                <code>number | null</code> 也正是为了配它。</strong>
              </p>
              <p>
                <strong>三个细节：</strong>
              </p>
              <ul>
                <li>
                  <strong><code>onMouseLeave</code> 放在容器上</strong>，
                  不是每颗星上 —— 否则在星之间移动会不停触发。
                </li>
                <li>
                  <strong>再点同一颗清零</strong>——
                  常见需求，一行三元。
                </li>
                <li>
                  <strong>用 <code>&lt;button&gt;</code>
                  而不是 <code>&lt;span&gt;</code></strong>——
                  天然可聚焦、可回车触发。
                  配上 <code>aria-label=&quot;3 星&quot;</code>
                  读屏也能用。
                </li>
              </ul>
              <p>
                <strong>受控 / 非受控双模式</strong>
                是这道题的进阶分：
                传了 <code>value</code> 就以父级为准、
                自己不存；没传就用内部 state。
                判断方式是
                <code>value !== undefined</code>——
                <strong>注意不能用 <code>value != null</code></strong>，
                否则父级传 <code>null</code> 表示「清空」时会被当成非受控。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>The core line:</strong>{" "}
                <code>const shown = hover ?? current</code>.
              </p>
              <p>
                <strong>Why <code>??</code> and not <code>||</code></strong> — this is
                exactly the trap from #281: <code>hover</code> can be <code>0</code>{" "}
                (this implementation starts at 1, but you hit it the moment you support
                0 stars), and <code>||</code> reads <code>0</code> as &ldquo;no
                hover&rdquo;.{" "}
                <strong>Use <code>??</code>, and note that <code>hover</code> is typed{" "}
                <code>number | null</code> precisely to pair with it.</strong>
              </p>
              <p>
                <strong>Three details:</strong>
              </p>
              <ul>
                <li>
                  <strong>Put <code>onMouseLeave</code> on the container</strong>, not
                  on each star — otherwise moving between stars fires it over and over.
                </li>
                <li>
                  <strong>Clicking the same star again clears it</strong> — a common
                  requirement, one ternary.
                </li>
                <li>
                  <strong>Use <code>&lt;button&gt;</code>, not{" "}
                  <code>&lt;span&gt;</code></strong> — focusable and Enter-triggerable
                  already. Add <code>aria-label=&quot;3 stars&quot;</code> and a screen
                  reader can use it too.
                </li>
              </ul>
              <p>
                <strong>Controlled and uncontrolled in one component</strong> is the
                advanced point here: if <code>value</code> is passed the parent wins and
                you store nothing; if not, use internal state. The check is{" "}
                <code>value !== undefined</code> —{" "}
                <strong>do not use <code>value != null</code></strong>, or a parent
                passing <code>null</code> to mean &ldquo;clear&rdquo; gets treated as
                uncontrolled.
              </p>
            </>
          ),
          code: [
            tested("tsx", C_STARS, {
              filename: "src/components/StarRating/index.tsx（实测通过）",
              filenameEn: "src/components/StarRating/index.tsx (passes in a real run)",
              codeEn: C_STARS_EN,
              collapsible: true,
            }),
            demo(
              "tsx",
              `// ✗ 用 || ：支持 0 星时会出错
const shown = hover || current;

// ✗ onMouseLeave 放每颗星上：星之间移动会闪
<button onMouseEnter={...} onMouseLeave={() => setHover(null)} />

// ✗ 用 span：键盘用不了
<span onClick={...}>★</span>`,
              { filename: "三种常见错法" },
            ),
          ],
        },
      ],
      exercises: [
        {
          kind: "fill-blank",
          id: "iv-coding-dropdown-blank",
          title: "补全「点外面关掉」",
          level: 2,
          generated: true,
          prompt: (
            <p>
              四个空。第 2 个用错会导致「点自己内部也关掉」，
              第 4 个漏了会泄漏监听器。
            </p>
          ),
          language: "tsx",
          filename: "src/components/Dropdown/index.tsx",
          template: `const boxRef = ___1___<HTMLDivElement>(null);

useEffect(() => {
  if (!open) return;

  const onDocClick = (e: MouseEvent) => {
    if (boxRef.current && !boxRef.current.___2___(e.target as Node)) {
      setOpen(false);
    }
  };

  document.addEventListener("___3___", onDocClick);
  return () => document.___4___("___3___", onDocClick);
}, [open]);`,
          blanks: [
            {
              n: 1,
              accept: ["useRef"],
              hint: "要拿到一个 DOM 节点，而且它不参与渲染。",
              why: (
                <>
                  <code>useRef</code>。
                  <br />
                  DOM 节点不是渲染要用的数据，
                  改它也不该触发重渲染 ——
                  这正是 <code>useRef</code> 的定位。
                  用 <code>useState</code> 存 DOM 节点会造成多余渲染。
                </>
              ),
              width: 8,
            },
            {
              n: 2,
              accept: ["contains"],
              hint: "用户点的可能是容器内部的按钮，不是容器本身。",
              why: (
                <>
                  <code>contains</code>。
                  <br />
                  写成 <code>e.target === boxRef.current</code>
                  的话，<strong>点内部任何元素都会被判成「点了外面」</strong>，
                  于是刚展开就立刻关掉。
                  <br />
                  这和事件委托里用
                  <code>e.target.closest()</code> 是同一个道理：
                  <strong>要处理「点在子元素上」的情况</strong>。
                </>
              ),
              width: 10,
            },
            {
              n: 3,
              accept: ["mousedown", "click", "pointerdown"],
              hint: "比 click 更早的那个鼠标事件更合适。",
              why: (
                <>
                  <code>mousedown</code>（<code>click</code> 也能过，
                  但不如它）。
                  <br />
                  用 <code>click</code> 的问题：它在
                  <strong>按下和松开之间</strong>触发，
                  如果这期间 DOM 变了（比如点的那个元素被移除），
                  <code>click</code> 可能不触发。
                  <code>mousedown</code> 更早、更可靠，
                  关闭反应也更快。
                </>
              ),
              width: 12,
            },
            {
              n: 4,
              accept: ["removeEventListener"],
              hint: "把这一次 effect 建立的东西拆掉。",
              why: (
                <>
                  <code>removeEventListener</code>。
                  <br />
                  <strong>而且第一个参数必须和绑定时完全一致</strong>，
                  第二个参数必须是<strong>同一个函数引用</strong>——
                  传一个新的箭头函数是解不掉的，这是经典错误。
                  <br />
                  漏了它：每次展开多绑一对，
                  卸载后监听器还活着并对已卸载组件 setState。
                </>
              ),
              width: 21,
            },
          ],
        },
        {
          kind: "code-completion",
          id: "iv-coding-stars-write",
          title: "自己写出星级评分",
          level: 3,
          generated: true,
          prompt: (
            <p>
              hover 预览 + 点击选中 + 再点清零。
              检查器会查 <code>??</code>、
              <code>onMouseLeave</code> 的位置和无障碍。
            </p>
          ),
          language: "tsx",
          filename: "src/components/StarRating/index.tsx",
          starter: `const StarRating: React.FC<{ max?: number }> = ({ max = 5 }) => {
  // 1. 两个 state：已选值、当前 hover 的那颗（可能没有）


  // 2. 显示值：有 hover 就显示 hover，否则显示已选


  return (
    <div data-testid="stars">
      {/* 3. 渲染 max 颗星：hover 预览、点击选中、再点同一颗清零 */}

      <output data-testid="stars-value">{/* 已选值 */}</output>
    </div>
  );
};`,
          requirements: [
            "hover 到第 n 颗时前 n 颗显示为选中样式（预览）",
            "鼠标移出整个组件后回到已选值",
            "点第 n 颗设为 n 分；再点同一颗清零",
            "每颗星是 button，带 aria-label，键盘可用",
            "显示值必须是派生的，不许再开第三个 state",
          ],
          checks: [
            { label: "hover 用 number | null（或初始 null）", must: "useState<number \\| null>|useState\\(\\s*null\\s*\\)" },
            { label: "显示值用 ?? 而不是 ||", must: "\\?\\?" },
            { label: "没有用 || 做兜底", mustNot: "hover\\s*\\|\\|" },
            { label: "onMouseLeave 挂在容器上（出现在 map 之前）", must: "onMouseLeave[\\s\\S]{0,400}\\.map\\s*\\(|Array\\.from" },
            { label: "用 Array.from 或类似方式渲染 max 颗", must: "Array\\.from|\\[\\s*\\.\\.\\.\\s*Array" },
            { label: "星星是 button 元素", must: "<button" },
            { label: "带 aria-label", must: "aria-label" },
            { label: "再点同一颗清零", must: "===?\\s*current\\s*\\?\\s*0|current\\s*===?\\s*\\w+\\s*\\?\\s*0" },
            { label: "没有为「显示值」再开一个 state", mustNot: "useState[^\\n]*shown|setShown" },
          ],
          hints: [
            "先想清楚：屏幕上「第 n 颗要不要点亮」这个判断，依据是哪个值？鼠标在星星上时和不在时，这个依据一样吗？如果不一样，你需要几个 state？",
            "两个 state：current（已选）和 hover（number | null）。显示值 shown = hover ?? current —— 注意必须用 ??，因为 hover 为 0 时 || 会当成没 hover。onMouseLeave 挂在最外层容器上，不是每颗星上。",
            `const [current, setCurrent] = useState(0)
const [hover, setHover] = useState<number | null>(null)
const shown = hover ?? current

<div onMouseLeave={() => 清空 hover}>
  Array.from({ length: max }, (_, i) => i + 1).map(n => (
    <button
      onMouseEnter={() => 设 hover 为 n}
      onClick={() => 设 current 为「n 等于 current 就 0，否则 n」}
      data-filled={n <= shown}
      aria-label={\`\${n} 星\`}
    >{n <= shown ? "★" : "☆"}</button>
  ))
</div>`,
            `const [current, setCurrent] = useState(0);
const [hover, setHover] = useState<number | null>(null);
const shown = hover ?? current;

return (
  <div data-testid="stars" data-value={current} onMouseLeave={() => setHover(null)}>
    {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
      <button
        key={n}
        type="button"
        aria-label={\`\${n} 星\`}
        data-filled={n <= shown}
        onMouseEnter={() => setHover(n)}
        onClick={() => setCurrent(n === current ? 0 : n)}
      >
        {n <= shown ? "★" : "☆"}
      </button>
    ))}
    <output data-testid="stars-value">{current}</output>
  </div>
);`,
          ],
          solution: tested("tsx", C_STARS, {
            filename: "参考答案（实测通过，含受控模式）",
            filenameEn: "Reference answer (passes in a real run, controlled mode included)",
            codeEn: C_STARS_EN,
            collapsible: true,
          }),
        },
      ],
      mistakes: [
        {
          wrong: demo(
            "tsx",
            `// ✗ 用 e.target === ref.current 判断
const onDocClick = (e: MouseEvent) => {
  if (e.target !== boxRef.current) setOpen(false);
};`,
          ),
          why: (
            <>
              点内部的选项也会被判成「点了外面」，
              于是<strong>刚展开就关，或者选不中任何东西</strong>。
              <br />
              要用 <code>contains()</code>，
              它会检查整棵子树。
            </>
          ),
          whyEn: (
            <>
              Clicking an option inside also counts as a click outside, so{" "}
              <strong>
                it closes the moment it opens, or you can never select anything
              </strong>
              .
              <br />
              Use <code>contains()</code> — it checks the whole subtree.
            </>
          ),
        },
        {
          wrong: demo(
            "tsx",
            `// ✗ 解绑时传了一个新函数
useEffect(() => {
  document.addEventListener("mousedown", (e) => handle(e));
  return () => document.removeEventListener("mousedown", (e) => handle(e));
}, [open]);`,
          ),
          why: (
            <>
              两个箭头函数是<strong>不同的引用</strong>，
              <code>removeEventListener</code>
              <strong>一个也解不掉</strong>——
              而且不会报错，你只会发现监听器越来越多。
              <br />
              <strong>必须先存成一个具名函数，绑和解都用它。</strong>
            </>
          ),
          whyEn: (
            <>
              The two arrow functions are <strong>different references</strong>, so{" "}
              <code>removeEventListener</code>{" "}
              <strong>removes nothing at all</strong> — and it reports no error, you
              only notice that the listeners keep piling up.
              <br />
              <strong>
                Store one named function first, and use that same function to add and to
                remove.
              </strong>
            </>
          ),
        },
        {
          wrong: demo(
            "tsx",
            `// ✗ 给每个 tab 存一个 isActive
const [tabs, setTabs] = useState(
  raw.map((t, i) => ({ ...t, isActive: i === 0 })),
);`,
          ),
          why: (
            <>
              同一个事实存了 n 份，
              切换时要遍历全部改一遍，
              <strong>而且很容易出现「两个都激活」或「一个都不激活」</strong>。
              <br />
              只存一个 <code>activeId</code>，其余全算出来。
            </>
          ),
          whyEn: (
            <>
              One fact is now stored n times, switching means walking all of them and
              rewriting each one, and{" "}
              <strong>
                it is easy to end up with two active tabs, or none at all
              </strong>
              .
              <br />
              Keep a single <code>activeId</code> and compute the rest from it.
            </>
          ),
        },
      ],
      transfer: [
        {
          signal: "「点外面要关掉」",
          signalEn: "\"a click outside should close it\"",
          reachFor: "useRef + document mousedown + contains + 清理",
          reachForEn: "useRef, a mousedown listener on document, contains, plus cleanup",
        },
        {
          signal: "解绑监听器没生效",
          signalEn: "Removing the listener has no effect",
          reachFor: "绑和解必须是同一个函数引用",
          reachForEn: "Adding and removing must use the same function reference",
        },
        {
          signal: "「弹层要能按 Escape 关」",
          signalEn: "\"Escape should close the panel\"",
          reachFor: "同一个 effect 里再加 keydown",
          reachForEn: "Add a keydown listener in the same effect",
        },
        {
          signal: "「哪一项被选中」",
          signalEn: "\"which item is selected\"",
          reachFor: "只存一个 id，其余派生",
          reachForEn: "Store one id only, and derive the rest",
        },
        {
          signal: "hover 预览 + 已选值",
          signalEn: "A hover preview together with a chosen value",
          reachFor: "shown = hover ?? current，别用 ||",
          reachForEn: "shown = hover ?? current; do not use ||",
        },
        {
          signal: "要同时支持受控和非受控",
          signalEn: "It has to work both controlled and uncontrolled",
          reachFor: "判断 prop !== undefined",
          reachForEn: "Check whether the prop !== undefined",
        },
      ],
      recap: [
        "点外面关掉三要素：useRef 拿节点、document 上 mousedown、contains 判断，外加清理。",
        "解绑必须用同一个函数引用，传新箭头函数解不掉且不报错。",
        "Tabs 只需要一个 activeId，其余全是派生；ARIA 三件套别漏。",
        "星级评分核心是 shown = hover ?? current；onMouseLeave 挂容器不挂每颗星。",
        "用 button 而不是 span，天然可聚焦可回车；受控判断用 !== undefined。",
      ],
      recapEn: [
        "Three parts to closing on an outside click: useRef for the node, mousedown on document, contains for the test — plus the cleanup.",
        "Removing a listener needs the same function reference; passing a new arrow function removes nothing and reports no error.",
        "Tabs needs one activeId and derives everything else; do not leave out the three ARIA attributes.",
        "The core of a star rating is shown = hover ?? current; put onMouseLeave on the container, not on each star.",
        "Use a button rather than a span so it can be focused and used with Enter; test for controlled with !== undefined.",
      ],
    },

    /* ============================================================
       缺口二 · useRef 与自定义 hook
       ============================================================ */
    {
      id: "iv-coding-ref-hook",
      title: "缺口二 · useRef 操作 DOM，与写一个自定义 hook",
      titleEn: "Gap 2 · using useRef on the DOM, and writing a custom hook",
      blurb: "useRef 的第二种用法（拿 DOM 调命令式 API），以及把 state + effect 打包成可复用的 hook。",
      blurbEn:
        "The second use of useRef — holding a DOM node so you can call methods on it directly — and packing state plus an effect into a hook you can reuse.",
      minutes: 22,
      objectives: [
        "分清 useRef 的两种用途：存不参与渲染的值 vs 拿 DOM 节点",
        "说明什么时候必须走命令式（ref）而不是声明式",
        "写出一个带惰性初始化和错误兜底的自定义 hook",
        "说清「复用逻辑不复用状态」",
      ],
      objectivesEn: [
        "Tell the two uses of useRef apart: holding a value that is not rendered, versus holding a DOM node",
        "Say when you have to call the DOM directly through a ref instead of describing it with state",
        "Write a custom hook with a lazy initial value and a fallback when something throws",
        "Explain that a hook shares the logic, not the state",
      ],
      whyForAssessment:
        "「用 useRef 做一个播放器」考的是你知不知道 React 里有命令式逃逸口 —— 播放、聚焦、滚动、测量这些事没法用 state 表达。自定义 hook 那道是 #340 的动手版，面试官会看你的命名、返回值形状、以及有没有处理异常。",
      whyForAssessmentEn:
        "Building a player with useRef tests whether you know React leaves you a way out to call the DOM directly — playing, focusing, scrolling and measuring cannot be expressed as state. The custom hook problem is the hands-on version of #340, and the interviewer looks at your naming, the shape of what you return, and whether you handle errors.",
      concepts: [
        {
          id: "ref-two-uses",
          heading: "useRef 的两种用途",
          headingEn: "The two uses of useRef",
          lede: "很多人只知道第一种。",
          ledeEn: "Many people know only the first one.",
          body: (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>用途</th>
                      <th>例子</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>① 存值</td>
                      <td>
                        存<strong>不参与渲染</strong>、
                        改了也不该触发重渲染的东西
                      </td>
                      <td>定时器 id、上一次的值、次数计数</td>
                    </tr>
                    <tr>
                      <td>② 拿节点</td>
                      <td>
                        <strong>拿到真实 DOM，调它的命令式 API</strong>
                      </td>
                      <td>
                        <code>focus()</code>、
                        <code>play()</code>、
                        <code>scrollIntoView()</code>、
                        测量尺寸、
                        <code>contains()</code>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>共同点：<code>ref.current</code>
                的改动不会触发重渲染。</strong>
                所以想让界面跟着变，
                <strong>还是得配一个 state</strong>——
                播放器里 <code>playing</code> 是 state
                （按钮文字要变），
                <code>audioRef</code> 是 ref（只是拿来调方法）。
              </p>
              <p>
                <strong>什么时候必须用命令式：</strong>
                当「要做的事」不能用「界面应该长什么样」表达时。
                <strong>播放、暂停、聚焦、滚动、
                选中文本、测量宽高、播放动画</strong>——
                这些都是动作，不是状态。
                <strong>React 承认这一点，所以留了 ref 这个口子。</strong>
              </p>
              <p>
                <strong>会追问：</strong>
                「为什么不能用 <code>document.querySelector</code>？」——
                能跑，但① 组件多实例时会选错；
                ② 渲染时机不确定，可能取到 null；
                ③ 绕过了 React 的抽象，
                SSR 和 React Native 下直接失效。
                <strong>ref 是 React 给的那条合法通道。</strong>
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
                      <th>Purpose</th>
                      <th>Examples</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1. Hold a value</td>
                      <td>
                        Hold something that <strong>does not take part in
                        rendering</strong> and should not trigger a re-render when it
                        changes
                      </td>
                      <td>timer id, the previous value, a call counter</td>
                    </tr>
                    <tr>
                      <td>2. Hold a node</td>
                      <td>
                        <strong>Reach the real DOM and call its imperative API</strong>
                      </td>
                      <td>
                        <code>focus()</code>, <code>play()</code>,{" "}
                        <code>scrollIntoView()</code>, measuring size,{" "}
                        <code>contains()</code>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>What they share: changing <code>ref.current</code> never
                triggers a re-render.</strong> So if you want the UI to follow along,{" "}
                <strong>you still need a state next to it</strong> — in the player,{" "}
                <code>playing</code> is state (the button label changes) and{" "}
                <code>audioRef</code> is a ref (only there to call methods).
              </p>
              <p>
                <strong>When you have to go imperative:</strong> when &ldquo;the thing
                to do&rdquo; cannot be phrased as &ldquo;what the UI should look
                like&rdquo;.{" "}
                <strong>Play, pause, focus, scroll, select text, measure width and
                height, run an animation</strong> — those are actions, not state.{" "}
                <strong>React admits this, which is why it left the ref hatch
                open.</strong>
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Why not{" "}
                <code>document.querySelector</code>?&rdquo; — it runs, but (1) it picks
                the wrong one once the component has several instances; (2) the render
                timing is uncertain, so you may get null; (3) it goes around
                React&rsquo;s abstraction and breaks outright under SSR and React
                Native. <strong>ref is the legal channel React gives you.</strong>
              </p>
            </>
          ),
          code: [
            tested("tsx", C_PLAYER, {
              filename: "src/components/Player/index.tsx（实测通过）",
              collapsible: true,
            }),
          ],
        },
        {
          id: "player-detail",
          heading: "播放器的三个细节",
          headingEn: "Three details in the player",
          body: (
            <>
              <p>
                <strong>① <code>play()</code> 返回 Promise 而且可能被拒绝。</strong>
                浏览器的自动播放策略会拒绝「用户没交互过就播放」，
                所以严谨的写法要
                <code>try/catch</code>（面试里说出来就够，
                不一定要写）。
              </p>
              <p>
                <strong>② <code>currentTime</code> 直接改 DOM，
                不经过 state。</strong>
                <code>el.currentTime = 0</code> 是命令式操作；
                界面上显示的秒数由
                <code>onTimeUpdate</code> 事件同步到 state。
                <strong>「事实在 DOM 里，state 只是镜像」</strong>——
                这是所有媒体和 canvas 组件的共同模式。
              </p>
              <p>
                <strong>③ <code>onEnded</code> 要把
                <code>playing</code> 设回 false。</strong>
                播完了按钮还显示「Pause」是最常见的疏漏。
              </p>
              <p>
                <strong>怎么测（这一条本身是加分知识）：</strong>
                jsdom <strong>没有实现媒体播放</strong>，
                调 <code>play()</code> 会抛
                <code>Not implemented</code>。
                所以要
                <code>vi.spyOn(HTMLMediaElement.prototype, &quot;play&quot;)</code>
                替掉。
                <strong>这也顺便让你能断言「play 到底被调了几次」</strong>，
                比检查界面更直接。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>(1) <code>play()</code> returns a Promise and it can be
                rejected.</strong> The browser autoplay policy rejects playing before
                the user has interacted, so a careful version wraps it in{" "}
                <code>try/catch</code> (saying so in the interview is enough, you do not
                have to write it).
              </p>
              <p>
                <strong>(2) <code>currentTime</code> is written straight to the DOM,
                not through state.</strong> <code>el.currentTime = 0</code> is an
                imperative operation; the seconds shown on screen get synced into state
                by the <code>onTimeUpdate</code> event.{" "}
                <strong>&ldquo;The truth lives in the DOM, state is only a
                mirror&rdquo;</strong> — the shared pattern behind every media and
                canvas component.
              </p>
              <p>
                <strong>(3) <code>onEnded</code> has to set <code>playing</code> back to
                false.</strong> A button still reading &ldquo;Pause&rdquo; after
                playback ends is the most common miss.
              </p>
              <p>
                <strong>How to test it (this part is a bonus point by itself):</strong>{" "}
                jsdom <strong>does not implement media playback</strong>, so calling{" "}
                <code>play()</code> throws <code>Not implemented</code>. You have to
                swap it out with{" "}
                <code>vi.spyOn(HTMLMediaElement.prototype, &quot;play&quot;)</code>.{" "}
                <strong>That also lets you assert how many times play was really
                called</strong>, which is more direct than inspecting the UI.
              </p>
            </>
          ),
          code: [
            tested(
              "tsx",
              `// jsdom 不实现媒体播放，必须 stub
beforeEach(() => {
  play = vi.spyOn(HTMLMediaElement.prototype, "play")
           .mockImplementation(() => Promise.resolve());
  pause = vi.spyOn(HTMLMediaElement.prototype, "pause")
            .mockImplementation(() => {});
});

test("点 Play 调 audio.play()，再点调 pause()", async () => {
  render(<Player src="/a.mp3" />);
  await userEvent.click(screen.getByTestId("toggle"));
  expect(play).toHaveBeenCalledTimes(1);
  await userEvent.click(screen.getByTestId("toggle"));
  expect(pause).toHaveBeenCalledTimes(1);
});`,
              { filename: "怎么测一个播放器" },
            ),
          ],
        },
        {
          id: "custom-hook",
          heading: "写一个自定义 hook",
          headingEn: "Writing a custom hook",
          lede: "把 state + effect 打包，命名必须 use 开头。",
          ledeEn: "Pack state and an effect together; the name has to start with use.",
          body: (
            <>
              <p>
                <code>useLocalStorage</code>
                是最常被要求现场写的一个，
                因为它同时考四件事：
              </p>
              <ul>
                <li>
                  <strong>惰性初始化</strong>——
                  <code>useState(() =&gt; …)</code>
                  传<strong>函数</strong>而不是值。
                  写成 <code>useState(读localStorage())</code>
                  的话，<strong>每次渲染都会读一次
                  localStorage</strong>（虽然结果被丢掉，
                  但同步 I/O 白花了）。
                </li>
                <li>
                  <strong>错误兜底</strong>——
                  隐私模式下
                  <code>localStorage</code> 会抛，
                  存的脏数据 <code>JSON.parse</code> 会抛。
                  <strong>不 try/catch 整个组件就白屏了。</strong>
                </li>
                <li>
                  <strong>返回值形状</strong>——
                  <code>as const</code> 让类型是元组
                  <code>[T, setter]</code> 而不是数组联合，
                  调用方才能
                  <code>const [a, setA] = …</code>
                  拿到正确类型。
                </li>
                <li>
                  <strong>依赖要带上 <code>key</code></strong>——
                  否则 key 变了不会重新写入。
                </li>
              </ul>
              <p>
                <strong>最重要的一句：复用逻辑，不复用状态。</strong>
                两个组件各调一次
                <code>useLocalStorage(&quot;theme&quot;, …)</code>，
                得到的是<strong>两份独立的 state</strong>——
                虽然它们写的是同一个 localStorage 键，
                但<strong>一边改了另一边的 state 不会更新</strong>
                （要跨组件同步得监听
                <code>storage</code> 事件，或者上 Context）。
                <strong>测试里专门有一条抓这个</strong>，
                因为这是最常见的误解。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>useLocalStorage</code> is the one people get asked to write on the
                spot most often, because it tests four things at once:
              </p>
              <ul>
                <li>
                  <strong>Lazy initialization</strong> —{" "}
                  <code>useState(() =&gt; ...)</code> takes a <strong>function</strong>,
                  not a value. Write <code>useState(readLocalStorage())</code> and{" "}
                  <strong>every render reads localStorage once</strong> (the result gets
                  thrown away, but the synchronous I/O already happened).
                </li>
                <li>
                  <strong>Error fallback</strong> — in private mode{" "}
                  <code>localStorage</code> throws, and dirty stored data makes{" "}
                  <code>JSON.parse</code> throw.{" "}
                  <strong>Without try/catch the whole component goes blank.</strong>
                </li>
                <li>
                  <strong>Shape of the return value</strong> — <code>as const</code>{" "}
                  makes the type a tuple <code>[T, setter]</code> instead of a union
                  array, so the caller can write <code>const [a, setA] = ...</code> and
                  get the right types.
                </li>
                <li>
                  <strong>The deps have to include <code>key</code></strong> — otherwise
                  a changed key never gets written again.
                </li>
              </ul>
              <p>
                <strong>The most important sentence: reuse the logic, not the
                state.</strong> Two components each calling{" "}
                <code>useLocalStorage(&quot;theme&quot;, ...)</code> get{" "}
                <strong>two independent states</strong> — they write the same
                localStorage key, but{" "}
                <strong>changing one does not update the other&rsquo;s state</strong>{" "}
                (syncing across components needs a <code>storage</code> listener, or
                Context).{" "}
                <strong>One test is there just to catch this</strong>, because it is the
                most common misunderstanding.
              </p>
            </>
          ),
          code: [
            tested("ts", C_HOOK, {
              filename: "src/hooks/useLocalStorage.ts（实测通过）",
            }),
            demo(
              "ts",
              `// ✗ 每次渲染都读一次 localStorage
const [v, setV] = useState(JSON.parse(localStorage.getItem(key)!));

// ✗ 没有兜底：隐私模式或脏数据直接白屏
const [v, setV] = useState(() => JSON.parse(localStorage.getItem(key)!));

// ✗ 返回普通数组，类型是 (T | Setter)[]，解构后类型全错
return [value, setValue];        // 少了 as const`,
              { filename: "三个常见错法" },
            ),
          ],
        },
        {
          id: "verify",
          heading: "怎么验证",
          headingEn: "How this was checked",
          lede: "这就是跑出 24 / 24 的那个测试文件（六道题合在一起）。",
          ledeEn: "This is the test file that produced 24 / 24, with all six problems in one run.",
          body: (
            <>
              <p>
                注意测试自定义 hook 用的是
                <strong><code>renderHook</code></strong>——
                Testing Library 提供的，
                不用为了测 hook 专门造一个组件。
                改状态要包 <code>act()</code>。
              </p>
              <p>
                <strong>Dropdown 那四条里最值得学的是最后一条</strong>：
                直接 spy <code>document.addEventListener</code>
                和 <code>removeEventListener</code>，
                断言绑了几次就解了几次。
                <strong>这是验证「清理函数写了没有」最直接的办法</strong>，
                比观察行为可靠。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Note that testing the custom hook uses{" "}
                <strong><code>renderHook</code></strong> — Testing Library provides it,
                so you do not have to build a component just to test a hook. Changing
                state has to be wrapped in <code>act()</code>.
              </p>
              <p>
                <strong>Of the four Dropdown tests the last one is the one to
                learn</strong>: spy on <code>document.addEventListener</code> and{" "}
                <code>removeEventListener</code> directly and assert that the bind count
                equals the unbind count.{" "}
                <strong>That is the most direct way to check whether the cleanup
                function got written</strong>, and more reliable than watching behavior.
              </p>
            </>
          ),
          code: [
            tested(
              "bash",
              `$ npx vitest run src/Coding.test.tsx

 Test Files  1 passed (1)
      Tests  24 passed (24)`,
              { filename: "验证命令" },
            ),
            tested("tsx", C_TEST, {
              filename: "src/Coding.test.tsx（DrillLab 自出，本机跑过 24/24）",
              collapsible: true,
            }),
          ],
        },
      ],
      exercises: [
        {
          kind: "code-completion",
          id: "iv-coding-hook-write",
          title: "自己写出 useLocalStorage",
          level: 3,
          generated: true,
          prompt: (
            <p>
              四个考点全都会被检查：惰性初始化、try/catch 兜底、
              依赖带 key、<code>as const</code>。
            </p>
          ),
          language: "ts",
          filename: "src/hooks/useLocalStorage.ts",
          starter: `import { useEffect, useState } from "react";

/**
 * 把一个值和 localStorage 绑在一起。
 *
 * 要求：
 *   · 首次渲染时从 localStorage 读，读不到用 initial
 *   · 值变化时写回 localStorage
 *   · localStorage 不可用或存的是脏数据时，不能让组件炸
 *   · 返回 [value, setValue]，类型要是元组
 */
export function useLocalStorage<T>(key: string, initial: T) {

}`,
          requirements: [
            "读 localStorage 只在首次渲染发生一次（惰性初始化）",
            "读和写都要有 try/catch",
            "JSON 序列化 / 反序列化",
            "effect 的依赖里要有 key 和 value",
            "返回元组，用 as const",
          ],
          checks: [
            { label: "useState 用了惰性初始化（传函数）", must: "useState[^\\n]*\\(\\s*\\(\\s*\\)\\s*=>" },
            { label: "没有在 useState 里直接调用读取", mustNot: "useState\\s*\\(\\s*(JSON\\.parse|window\\.localStorage|localStorage)" },
            { label: "读的时候有 try/catch", must: "try\\s*\\{[\\s\\S]{0,200}getItem[\\s\\S]{0,200}\\}\\s*catch" },
            { label: "写的时候用了 setItem", must: "setItem" },
            { label: "写的时候也有 try/catch", must: "try\\s*\\{[\\s\\S]{0,160}setItem[\\s\\S]{0,120}\\}\\s*catch" },
            { label: "用了 JSON.stringify / JSON.parse", must: "JSON\\.stringify" },
            { label: "effect 依赖里有 key 和 value", must: "\\[\\s*key\\s*,\\s*value\\s*\\]" },
            { label: "返回值用 as const（元组类型）", must: "as const" },
            { label: "没有把 localStorage 读写放在渲染主体里裸调", mustNot: "^\\s*const\\s+\\w+\\s*=\\s*(window\\.)?localStorage\\.getItem" },
          ],
          hints: [
            "先问自己两个问题：读 localStorage 这件事应该发生几次？如果 localStorage 里存的是一段被人手改坏的 JSON，你的组件会怎样？",
            "useState 接受一个「初始化函数」，React 只在首次渲染调它 —— 这就是惰性初始化。读和写都要包 try/catch：隐私模式下 localStorage 会抛，脏数据 JSON.parse 会抛。最后 return [value, setValue] as const。",
            `const [value, setValue] = useState<T>(() => {
  try {
    读 raw
    raw 是 null 就返回 initial，否则 JSON.parse
  } catch {
    返回 initial
  }
})

useEffect(() => {
  try { 写 JSON.stringify(value) } catch {}
}, [key, value])

return [value, setValue] as const`,
            `const [value, setValue] = useState<T>(() => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? initial : (JSON.parse(raw) as T);
  } catch {
    return initial;
  }
});

useEffect(() => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 写不进去只影响持久化 */
  }
}, [key, value]);

return [value, setValue] as const;`,
          ],
          solution: tested("ts", C_HOOK, {
            filename: "参考答案（实测通过）",
          }),
        },
      ],
      mistakes: [
        {
          wrong: demo(
            "tsx",
            `// ✗ 用 state 存 DOM 节点
const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
<audio ref={setAudio} />`,
          ),
          why: (
            <>
              能跑，但<strong>每次拿到节点都会触发一次重渲染</strong>，
              而 DOM 节点根本不参与渲染输出。
              <br />
              <strong>用 <code>useRef</code></strong>。
              （例外：确实需要「节点出现时触发一次逻辑」时，
              回调 ref 是合理的。）
            </>
          ),
          whyEn: (
            <>
              This works, but{" "}
              <strong>every time it receives the node it triggers a re-render</strong>,
              and the DOM node is not part of the rendered output at all.
              <br />
              <strong>
                Use <code>useRef</code>
              </strong>
              . (One exception: a callback ref is reasonable when you really do need to
              run some logic once, at the moment the node appears.)
            </>
          ),
        },
        {
          wrong: demo(
            "tsx",
            `// ✗ 忘了 onEnded
<audio ref={audioRef} src={src} />
// 播完之后按钮还显示 "Pause"`,
          ),
          why: (
            <>
              媒体播放结束是<strong>DOM 自己发生的事</strong>，
              React 不知道。
              <strong>必须监听 <code>onEnded</code>
              把 state 同步回来。</strong>
              <br />
              这是「事实在 DOM 里、state 是镜像」这类组件
              的通用注意点。
            </>
          ),
          whyEn: (
            <>
              Playback ending is{" "}
              <strong>something the DOM does on its own</strong>, and React is not told
              about it.{" "}
              <strong>
                You have to listen for <code>onEnded</code> and copy the change back
                into state.
              </strong>
              <br />
              This applies to every component where the DOM holds the real value and
              state is only a copy of it.
            </>
          ),
        },
      ],
      transfer: [
        {
          signal: "要 focus / play / scroll / 测量尺寸",
          signalEn: "You need to focus, play, scroll or measure a size",
          reachFor: "useRef 拿节点，走命令式",
          reachForEn: "Hold the node with useRef and call it directly",
        },
        {
          signal: "要存定时器 id 或上一次的值",
          signalEn: "You need to keep a timer id or the previous value",
          reachFor: "useRef 存值，不用 state",
          reachForEn: "Keep the value in useRef, not in state",
        },
        {
          signal: "「DOM 自己变了但界面没同步」",
          signalEn: "\"the DOM changed on its own and the screen is out of step\"",
          reachFor: "监听对应事件把 state 同步回来",
          reachForEn: "Listen for the matching event and copy the change back into state",
        },
        {
          signal: "同一组 state+effect 写了两遍",
          signalEn: "The same state plus effect is written twice",
          reachFor: "抽 use 开头的自定义 hook",
          reachForEn: "Pull it into a custom hook whose name starts with use",
        },
        {
          signal: "初始值需要一次昂贵计算或 I/O",
          signalEn: "The initial value needs an expensive computation or a read from storage",
          reachFor: "useState(() => …) 惰性初始化",
          reachForEn: "Pass a function to useState so it runs only once",
        },
        {
          signal: "自定义 hook 返回数组类型不对",
          signalEn: "The array returned from a custom hook has the wrong type",
          reachFor: "加 as const",
          reachForEn: "Add as const",
        },
      ],
      recap: [
        "useRef 两种用途：存不参与渲染的值、拿 DOM 节点调命令式 API；两者都不触发重渲染。",
        "播放/聚焦/滚动/测量是「动作」不是「状态」，这是 React 留 ref 口子的原因。",
        "媒体组件的模式是「事实在 DOM 里，state 只是镜像」，所以要监听 onEnded 之类的事件。",
        "jsdom 不实现媒体播放，测试要 spyOn(HTMLMediaElement.prototype, \"play\")。",
        "自定义 hook 四要点：惰性初始化、try/catch 兜底、依赖带 key、as const 返元组。",
        "复用逻辑不复用状态 —— 两个组件各调一次就是两份独立 state。",
      ],
      recapEn: [
        "Two uses of useRef: holding a value that is not rendered, and holding a DOM node so you can call its methods; neither one triggers a re-render.",
        "Playing, focusing, scrolling and measuring are actions, not state — which is why React leaves a way out through a ref.",
        "In a media component the DOM holds the real value and state is only a copy of it, so you listen for events such as onEnded.",
        "jsdom does not implement media playback, so a test needs spyOn(HTMLMediaElement.prototype, \"play\").",
        "Four points for a custom hook: a lazy initial value, a try/catch fallback, the key in the dependency list, and as const to return a tuple.",
        "A hook shares the logic, not the state — two components each calling it get two separate copies of the state.",
      ],
    },

    /* ============================================================
       缺口三 · Redux Toolkit 版 Todo
       ============================================================ */
    {
      id: "iv-coding-rtk",
      title: "缺口三 · 同一个 Todo 换成 Redux Toolkit",
      titleEn: "Gap 3 · the same Todo app, moved to Redux Toolkit",
      blurb: "业务和变式一完全一样，换成 createSlice + selector —— 正好能对比出 Redux 到底多给了什么。",
      blurbEn:
        "The same app as variant one, rebuilt with createSlice and selectors — which makes it easy to see what Redux actually adds.",
      minutes: 24,
      objectives: [
        "用 createSlice 写出一个完整的 slice，并说明 Immer 为什么不违反「state 只读」",
        "解释 prepare 的作用以及为什么 id 不能在 reducer 里生成",
        "用 selector 做到「只订阅自己要的那部分」",
        "脱离 React 单测 reducer",
      ],
      objectivesEn: [
        "Write a complete slice with createSlice, and explain why Immer does not break the rule that state is read-only",
        "Explain what prepare is for, and why an id must not be generated inside a reducer",
        "Use a selector so a component subscribes only to the part it needs",
        "Unit test a reducer without React",
      ],
      whyForAssessment:
        "「用 Redux Toolkit 做一个 Todo」是 Medium 里的常见题。它真正在考三件事：知不知道现在不该手写 action types 了、知不知道 Immer 的草稿是怎么回事、知不知道 selector 的意义。同一个业务和变式一对照着看，能清楚看出 Redux 换来了什么、代价是什么。",
      whyForAssessmentEn:
        "Building a Todo app with Redux Toolkit is a common medium problem. It really tests three things: whether you know that action types are no longer written by hand, whether you know what an Immer draft is, and whether you know what a selector is for. Putting it next to variant one, which does the same job, shows clearly what Redux buys you and what it costs.",
      concepts: [
        {
          id: "slice",
          heading: "createSlice：一次生成 reducer 和 actions",
          headingEn: "createSlice: one call gives you the reducer and the actions",
          lede: "手写 Redux 的那套样板已经过时了。",
          ledeEn: "The hand-written Redux boilerplate is out of date.",
          body: (
            <>
              <p>
                <strong>老写法要写三份</strong>：
                action types 常量、
                action creators、
                一个大 <code>switch</code> 的 reducer。
                <code>createSlice</code>
                <strong>把三份合成一份</strong>——
                你只写 <code>reducers</code> 对象，
                它自动生成对应的 action creator 和 type
                （type 是 <code>&quot;todos/added&quot;</code>
                这样的 <code>切片名/reducer 名</code>）。
              </p>
              <p>
                <strong>Immer 那一点必须说清</strong>：
                <code>state.items.push(...)</code>
                看起来违反了「state 只读」，
                其实<strong>你拿到的是一个草稿代理（draft proxy）</strong>——
                你的修改被记录下来，
                Immer 最终<strong>产出一个新对象</strong>，
                原 state 一个字节没动。
                <strong>测试里我用
                <code>expect(next).not.toBe(empty)</code>
                和「原 state 长度仍是 0」两条断言证明了这一点。</strong>
              </p>
              <p>
                <strong>但有个边界要记住</strong>：
                这个「能 mutate」的特权
                <strong>只在 <code>createSlice</code> /
                <code>createReducer</code> 里成立</strong>。
                在组件里、在 selector 里、
                在自己写的普通函数里，
                <strong>该守的不可变规则一条都不能少</strong>。
              </p>
              <p>
                <strong><code>prepare</code> 是这道题的加分点。</strong>
                生成 id 要用
                <code>nanoid()</code>，
                而 <strong>reducer 必须是纯函数 ——
                不能出现随机数和时间</strong>
                （否则同样的 state + action
                会得到不同结果，时间旅行就废了）。
                <code>prepare</code>
                让你在<strong>创建 action 的时候</strong>
                生成 id，reducer 只负责把它放进去。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>The old way needed three pieces</strong>: action type constants,
                action creators, and a reducer built around one big{" "}
                <code>switch</code>. <code>createSlice</code>{" "}
                <strong>folds the three into one</strong> — you only write the{" "}
                <code>reducers</code> object and it generates the matching action creator
                and type (the type is <code>&quot;todos/added&quot;</code>, that is,{" "}
                <code>sliceName/reducerName</code>).
              </p>
              <p>
                <strong>The Immer part has to be said clearly</strong>:{" "}
                <code>state.items.push(...)</code> looks like it breaks &ldquo;state is
                read-only&rdquo;, but{" "}
                <strong>what you hold is a draft proxy</strong> — your edits get recorded
                and Immer <strong>produces a new object</strong> at the end, leaving the
                original state untouched byte for byte.{" "}
                <strong>The test proves it with two assertions:{" "}
                <code>expect(next).not.toBe(empty)</code> and &ldquo;the original state
                still has length 0&rdquo;.</strong>
              </p>
              <p>
                <strong>But there is a boundary to remember</strong>: this
                mutate-anyway privilege{" "}
                <strong>only holds inside <code>createSlice</code> /{" "}
                <code>createReducer</code></strong>. In components, in selectors, in your
                own plain functions,{" "}
                <strong>every immutability rule still applies</strong>.
              </p>
              <p>
                <strong><code>prepare</code> is the bonus point of this
                question.</strong> Generating the id needs <code>nanoid()</code>, and{" "}
                <strong>a reducer has to be pure — no random numbers, no clock</strong>{" "}
                (otherwise the same state + action gives different results and time
                travel is dead). <code>prepare</code> lets you generate the id{" "}
                <strong>while the action is being created</strong>, so the reducer only
                puts it in place.
              </p>
            </>
          ),
          code: [
            tested("ts", C_SLICE, {
              filename: "src/store/todosSlice.ts（实测 8/8 通过）",
              collapsible: true,
            }),
            tested("ts", C_STORE, {
              filename: "src/store/index.ts",
              explanation:
                "configureStore 默认就装好了 thunk 和 DevTools —— 不用再手写 applyMiddleware(thunk) 和那段 window.__REDUX_DEVTOOLS_EXTENSION__ 判断。",
            }),
          ],
        },
        {
          id: "selector",
          heading: "selector：这才是 Redux 比 Context 强的地方",
          headingEn: "Selectors: this is where Redux beats Context",
          lede: "三个 useSelector 各自订阅一小块。",
          ledeEn: "Three useSelector calls, each subscribing to one small part.",
          body: (
            <>
              <p>
                组件里写了三个 <code>useSelector</code>：
                可见列表、剩余条数、当前筛选。
                <strong>每一个只在自己那部分变化时触发重渲染。</strong>
              </p>
              <p>
                <strong>对比 Context</strong>（变式五那道题）：
                context value 一变，
                <strong>所有</strong> <code>useTheme()</code>
                的组件全部重渲染，
                哪怕它只用了 <code>theme</code>
                而变的是 <code>toggleTheme</code>。
                <strong>这就是八股 #349 里说的「Context 缺精细订阅」，
                在这里能具体看到。</strong>
              </p>
              <p>
                <strong>一个必须知道的坑：
                selector 不要返回新对象。</strong>
                <code>useSelector</code>
                默认用 <code>===</code> 比较结果，
                返回 <code>{"{ a, b }"}</code>
                这样的新对象<strong>每次都不相等</strong>，
                于是每次 store 有任何变化都重渲染 ——
                等于优化白做。
                <br />
                <strong>解法</strong>：拆成多个
                <code>useSelector</code>（本实现的做法，最简单），
                或者用 <code>createSelector</code>
                做记忆化，或者传
                <code>shallowEqual</code> 当第二个参数。
              </p>
              <p>
                <strong>注意 <code>selectVisible</code>
                是从 <code>items</code> 派生的</strong>，
                筛选<strong>不改底层数据</strong>——
                和变式一里「写操作必须作用于完整数据」
                是同一条规矩。
                <strong>测试里专门有一条验证「筛完底层仍是两条」。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                The component has three <code>useSelector</code> calls: the visible list,
                the remaining count, the current filter.{" "}
                <strong>Each one re-renders only when its own slice changes.</strong>
              </p>
              <p>
                <strong>Compare with Context</strong> (the variant 5 question): the
                moment the context value changes, <strong>every</strong>{" "}
                <code>useTheme()</code> component re-renders, even one that only uses{" "}
                <code>theme</code> while what changed was <code>toggleTheme</code>.{" "}
                <strong>That is the &ldquo;Context has no fine-grained
                subscription&rdquo; point from interview #349, in concrete form.</strong>
              </p>
              <p>
                <strong>One trap you have to know: a selector must not return a new
                object.</strong> <code>useSelector</code> compares its result with{" "}
                <code>===</code> by default, and a fresh object like{" "}
                <code>{"{ a, b }"}</code> is <strong>never equal</strong>, so any change
                anywhere in the store re-renders — the optimization cancels itself out.
                <br />
                <strong>Fixes</strong>: split it into several{" "}
                <code>useSelector</code> calls (what this implementation does, and the
                simplest), memoize with <code>createSelector</code>, or pass{" "}
                <code>shallowEqual</code> as the second argument.
              </p>
              <p>
                <strong>Note that <code>selectVisible</code> is derived from{" "}
                <code>items</code></strong>, and filtering{" "}
                <strong>does not touch the underlying data</strong> — the same rule as
                &ldquo;writes have to act on the complete data&rdquo; in variant 1.{" "}
                <strong>One test is there to verify that after filtering the underlying
                data still has two entries.</strong>
              </p>
            </>
          ),
          code: [
            tested("tsx", C_RTKAPP, {
              filename: "src/components/TodoApp/index.tsx（实测通过）",
              collapsible: true,
            }),
            demo(
              "tsx",
              `// ✗ selector 返回新对象：每次 store 变都重渲染
const { visible, remaining } = useSelector((s) => ({
  visible: selectVisible(s),
  remaining: selectRemaining(s),
}));

// ✓ 拆开，各自比较各自的值
const visible = useSelector(selectVisible);
const remaining = useSelector(selectRemaining);`,
              { filename: "useSelector 最常见的性能坑" },
            ),
          ],
        },
        {
          id: "compare",
          heading: "和变式一（useState 版）对比：换来了什么，代价是什么",
          headingEn: "Compared with variant one, the useState version: what you gain and what it costs",
          body: (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>变式一（useState）</th>
                      <th>本题（Redux Toolkit）</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>状态放哪</td>
                      <td>组件内</td>
                      <td>全局 store</td>
                    </tr>
                    <tr>
                      <td>谁能改</td>
                      <td>这个组件</td>
                      <td><strong>任何组件 dispatch 就行</strong></td>
                    </tr>
                    <tr>
                      <td>逻辑能不能脱离 React 测</td>
                      <td>不能（要 render）</td>
                      <td>
                        <strong>能</strong>——
                        reducer 是纯函数
                      </td>
                    </tr>
                    <tr>
                      <td>调试</td>
                      <td>console.log</td>
                      <td><strong>DevTools 能看每个 action 和 state diff</strong></td>
                    </tr>
                    <tr>
                      <td>代码量</td>
                      <td>一个文件</td>
                      <td>slice + store + 组件，三个文件</td>
                    </tr>
                    <tr>
                      <td>依赖</td>
                      <td>无</td>
                      <td>两个包</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>结论怎么说（面试里问「该不该上 Redux」时用）：</strong>
                <strong>这道题的规模用 Redux 是过度设计</strong>——
                一个组件自己的列表，
                <code>useState</code> 就够。
                <strong>Redux 的价值要在
                「同一份状态被很多不相关的组件读写」
                或者「需要按 action 追溯 bug」
                的时候才兑现。</strong>
                <br />
                能主动说出「这题我会用 useState，
                但如果需求是 XX 我会上 Redux」，
                比闷头写完 Redux 更能显示判断力。
              </p>
              <p>
                <strong>顺带看得出的一个真实收益</strong>：
                因为 reducer 是纯函数，
                <strong>八条测试里有五条完全不需要渲染任何组件</strong>——
                直接 <code>reducer(state, action)</code> 断言。
                测试跑得更快、失败信息更准。
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
                      <th>Variant 1 (useState)</th>
                      <th>This one (Redux Toolkit)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Where the state lives</td>
                      <td>inside the component</td>
                      <td>a global store</td>
                    </tr>
                    <tr>
                      <td>Who can change it</td>
                      <td>this component</td>
                      <td><strong>any component that dispatches</strong></td>
                    </tr>
                    <tr>
                      <td>Can the logic be tested without React</td>
                      <td>no (you have to render)</td>
                      <td>
                        <strong>yes</strong> — the reducer is a pure function
                      </td>
                    </tr>
                    <tr>
                      <td>Debugging</td>
                      <td>console.log</td>
                      <td><strong>DevTools shows every action and the state diff</strong></td>
                    </tr>
                    <tr>
                      <td>Amount of code</td>
                      <td>one file</td>
                      <td>slice + store + component, three files</td>
                    </tr>
                    <tr>
                      <td>Dependencies</td>
                      <td>none</td>
                      <td>two packages</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>How to phrase the conclusion (for when they ask &ldquo;should we
                bring in Redux?&rdquo;):</strong>{" "}
                <strong>at this size Redux is over-engineering</strong> — one
                component&rsquo;s own list is fine with <code>useState</code>.{" "}
                <strong>Redux pays off when the same state is read and written by many
                unrelated components, or when you need to trace a bug action by
                action.</strong>
                <br />
                Saying &ldquo;I would use useState here, but if the requirement were XX I
                would reach for Redux&rdquo; shows more judgment than silently writing
                the whole Redux setup.
              </p>
              <p>
                <strong>One real benefit that falls out of this</strong>: because the
                reducer is a pure function,{" "}
                <strong>five of the eight tests render no component at all</strong> —
                they assert on <code>reducer(state, action)</code> directly. The tests
                run faster and the failure messages are more precise.
              </p>
            </>
          ),
          code: [
            tested("tsx", C_RTKTEST, {
              filename: "src/Rtk.test.tsx（DrillLab 自出，本机跑过 8/8）",
              collapsible: true,
            }),
            tested(
              "bash",
              `# 这一道要单独装依赖（本站另外几道复用 react-notes-app 的 node_modules）
$ npm i @reduxjs/toolkit react-redux
$ npx vitest run

 Test Files  1 passed (1)
      Tests  8 passed (8)`,
              { filename: "验证命令" },
            ),
          ],
        },
      ],
      exercises: [
        {
          kind: "fill-blank",
          id: "iv-coding-rtk-blank",
          title: "补全 createSlice",
          level: 2,
          generated: true,
          prompt: (
            <p>
              四个空。第 3 个空是这道题的加分点，
              第 4 个空写错会让 reducer 不纯。
            </p>
          ),
          language: "ts",
          filename: "src/store/todosSlice.ts",
          template: `const todosSlice = ___1___({
  name: "todos",
  initialState,
  reducers: {
    added: {
      reducer(state, action: PayloadAction<Todo>) {
        state.items.___2___(action.payload);
      },
      ___3___(text: string) {
        return { payload: { id: ___4___(), text: text.trim(), done: false } };
      },
    },
    toggled(state, action: PayloadAction<string>) {
      const t = state.items.find((x) => x.id === action.payload);
      if (t) t.done = !t.done;
    },
  },
});`,
          blanks: [
            {
              n: 1,
              accept: ["createSlice"],
              hint: "Redux Toolkit 里一次生成 reducer 和 actions 的那个函数。",
              why: (
                <>
                  <code>createSlice</code>。
                  <br />
                  它同时产出 <code>slice.reducer</code>、
                  <code>slice.actions</code>
                  和 action types
                  （形如 <code>&quot;todos/added&quot;</code>）——
                  <strong>老写法要手写的三份样板全省了</strong>。
                </>
              ),
              width: 12,
            },
            {
              n: 2,
              accept: ["push"],
              hint: "在 createSlice 里可以直接「改」state。",
              why: (
                <>
                  <code>push</code>。
                  <br />
                  <strong>这里不违反不可变原则</strong>——
                  <code>createSlice</code> 内置 Immer，
                  你拿到的是<strong>草稿代理</strong>，
                  修改被记录后产出新对象，原 state 没动。
                  <br />
                  <strong>但这个特权只在
                  <code>createSlice</code> /
                  <code>createReducer</code> 里有</strong>。
                  组件里、普通函数里照样得
                  <code>[...arr, x]</code>。
                </>
              ),
              width: 6,
            },
            {
              n: 3,
              accept: ["prepare"],
              hint: "在「创建 action」的时候做点事，而不是在 reducer 里做。",
              why: (
                <>
                  <code>prepare</code>。
                  <br />
                  它让 action creator 只收
                  <code>text</code>，
                  但 payload 里带上完整的 <code>Todo</code>。
                  <br />
                  <strong>为什么必须这样</strong>：
                  id 要用随机数生成，
                  而 <strong>reducer 必须是纯函数</strong>——
                  出现 <code>nanoid()</code> 或
                  <code>Date.now()</code> 就不纯了，
                  同样的 state + action 会得到不同结果，
                  <strong>时间旅行调试直接失效</strong>。
                </>
              ),
              width: 9,
            },
            {
              n: 4,
              accept: ["nanoid", "crypto.randomUUID"],
              hint: "Redux Toolkit 自带的 id 生成器。",
              why: (
                <>
                  <code>nanoid</code>（RTK 直接导出，
                  不用额外装包）。
                  <br />
                  <code>crypto.randomUUID()</code> 也行。
                  <strong>关键是它在
                  <code>prepare</code> 里调，不在 reducer 里调。</strong>
                </>
              ),
              width: 8,
            },
          ],
        },
      ],
      mistakes: [
        {
          wrong: demo(
            "ts",
            `// ✗ 在 reducer 里生成 id
added(state, action: PayloadAction<string>) {
  state.items.push({ id: nanoid(), text: action.payload, done: false });
}`,
          ),
          why: (
            <>
              reducer 不再是纯函数：
              同样的 state 和 action 会产出不同结果。
              <br />
              <strong>后果是时间旅行调试和 action 重放都失效</strong>——
              这正是 Redux 三大原则第 3 条要防的。
              <strong>用 <code>prepare</code>。</strong>
            </>
          ),
          whyEn: (
            <>
              The reducer is no longer pure: the same state and the same action produce
              a different result each time.
              <br />
              <strong>
                Time-travel debugging and replaying actions both stop working
              </strong>{" "}
              — which is exactly what the third Redux principle protects.{" "}
              <strong>
                Use <code>prepare</code>.
              </strong>
            </>
          ),
        },
        {
          wrong: demo(
            "tsx",
            `// ✗ selector 返回新对象
const { visible, remaining } = useSelector((s) => ({
  visible: selectVisible(s),
  remaining: selectRemaining(s),
}));`,
          ),
          why: (
            <>
              <code>useSelector</code> 用
              <code>===</code> 比结果，
              新对象永远不相等 ——
              <strong>store 里任何东西变了这个组件都重渲染</strong>，
              selector 的意义完全没了。
              <br />
              拆成多个 <code>useSelector</code>，
              或者用 <code>createSelector</code> /
              <code>shallowEqual</code>。
            </>
          ),
          whyEn: (
            <>
              <code>useSelector</code> compares the result with <code>===</code>, and a
              new object is never equal to the previous one —{" "}
              <strong>
                so this component re-renders whenever anything in the store changes
              </strong>
              , and the selector no longer does anything for you.
              <br />
              Split it into several <code>useSelector</code> calls, or use{" "}
              <code>createSelector</code> or <code>shallowEqual</code>.
            </>
          ),
        },
        {
          wrong: demo(
            "ts",
            `// ✗ 把 Immer 的特权带出 createSlice
export function addTodo(state: TodosState, todo: Todo) {
  state.items.push(todo);          // 这里没有草稿代理，是真的改了原对象
  return state;
}`,
          ),
          why: (
            <>
              <strong>Immer 只在
              <code>createSlice</code> /
              <code>createReducer</code> 内部生效。</strong>
              在普通函数里这就是实实在在的 mutate，
              而且返回的还是同一个引用 —— React 不会重渲染。
            </>
          ),
          whyEn: (
            <>
              <strong>
                Immer only applies inside <code>createSlice</code> and{" "}
                <code>createReducer</code>.
              </strong>{" "}
              In an ordinary function this changes the original object for real, and it
              returns the same reference — so React does not re-render.
            </>
          ),
        },
      ],
      transfer: [
        {
          signal: "要写 Redux",
          signalEn: "You are asked to write Redux",
          reachFor: "createSlice，别手写 action types",
          reachForEn: "createSlice; do not write action types by hand",
        },
        {
          signal: "reducer 里想用 nanoid / Date.now",
          signalEn: "You want nanoid or Date.now inside a reducer",
          reachFor: "挪到 prepare 或 action creator",
          reachForEn: "Move it into prepare, or into the action creator",
        },
        {
          signal: "「加了 selector 还是每次都重渲染」",
          signalEn: "\"I added a selector and it still re-renders every time\"",
          reachFor: "selector 返回了新对象",
          reachForEn: "The selector is returning a new object",
        },
        {
          signal: "问该不该上 Redux",
          signalEn: "Asked whether the app should use Redux",
          reachFor: "看是否多组件读写 + 是否需要按 action 追溯",
          reachForEn: "Ask whether several components read and write it, and whether you need to trace changes action by action",
        },
        {
          signal: "要脱离 React 测状态逻辑",
          signalEn: "You need to test the state logic without React",
          reachFor: "reducer 是纯函数，直接 reducer(state, action)",
          reachForEn: "A reducer is a pure function; just call reducer(state, action)",
        },
      ],
      recap: [
        "createSlice 一次生成 reducer、action creators 和 types，老写法的三份样板全省。",
        "Immer 给的是草稿代理，push 也能产出新对象 —— 但这个特权只在 createSlice/createReducer 里有。",
        "id 要在 prepare 里生成，reducer 必须纯，否则时间旅行失效。",
        "selector 让组件只订阅自己那部分 —— 这是 Redux 比 Context 强的具体地方。",
        "selector 不要返回新对象，否则每次 store 变都重渲染。",
        "这道题的规模用 useState 就够；能说出「什么时候才该上 Redux」比写完更重要。",
      ],
      recapEn: [
        "One createSlice call produces the reducer, the action creators and the types, replacing all three pieces of the old boilerplate.",
        "Immer hands you a draft, so even push produces a new object — but that only holds inside createSlice and createReducer.",
        "Generate the id in prepare; the reducer has to stay pure or time travel stops working.",
        "A selector lets a component subscribe to just its own part — this is the concrete place where Redux beats Context.",
        "Do not return a new object from a selector, or the component re-renders on every store change.",
        "At this size useState is enough; being able to say when Redux is worth it matters more than finishing the code.",
      ],
    },

    /* ============================================================
       缺口四 · Kanban
       ============================================================ */
    {
      id: "iv-coding-kanban",
      title: "缺口四 · Kanban 看板：一次改两个数组",
      titleEn: "Gap 4 · a Kanban board: changing two arrays in one update",
      blurb: "跨列移动是 CRUD 的升级版 —— 源列删、目标列加，必须在一次操作里完成。",
      blurbEn:
        "Moving a card between columns is CRUD one step up: remove from one column and add to another, in a single update.",
      minutes: 20,
      objectives: [
        "把「移动一张卡」写成一个纯函数，一次返回完整的新 board",
        "说清为什么不能写成「先删再加」两次 setState",
        "让没被碰到的列复用原数组引用",
        "处理「没动」和「找不到卡」两种边界",
      ],
      objectivesEn: [
        "Write moving a card as one pure function that returns the whole new board at once",
        "Explain why it must not be two setState calls, one to remove and one to add",
        "Let the columns you did not touch keep their original array reference",
        "Handle the two edge cases: nothing moved, and the card was not found",
      ],
      whyForAssessment:
        "Kanban 是 Hard 档的常见题，但拖拽只是外壳 —— 面试官真正看的是你怎么组织这次「同时影响两处」的状态更新。写成纯函数的人和在组件里堆两次 setState 的人，一眼就能分出来。",
      whyForAssessmentEn:
        "Kanban is a common hard problem, but the dragging is only the wrapper — what the interviewer looks at is how you organise one update that changes two places at once. Whoever writes it as a pure function and whoever stacks two setState calls inside the component are easy to tell apart.",
      concepts: [
        {
          id: "shape",
          heading: "数据形状：用 Record 而不是数组套数组",
          headingEn: "The shape of the data: a Record, not an array of arrays",
          lede: "board 是「列 id → 卡片数组」的映射。",
          ledeEn: "The board maps a column id to an array of cards.",
          body: (
            <>
              <p>
                <code>Record&lt;ColumnId, Card[]&gt;</code>
                比 <code>Column[]</code>
                （每个 column 里有 <code>cards</code>）好用，
                因为<strong>按列 id 直接取</strong>，
                不用先 <code>find</code> 找到列再改。
              </p>
              <p>
                <strong>而且展开语法配计算属性名
                正好能一次改两个键</strong>：
                <code>{"{ ...board, [from]: …, [to]: … }"}</code>。
                如果是数组套数组，
                同样的事要写两次 <code>map</code>，
                明显更绕。
              </p>
              <p>
                <strong>列的顺序单独放一个常量数组</strong>
                （<code>COLUMNS</code>），
                因为「顺序」是展示逻辑，
                不该混进数据结构里 ——
                这样加一列只改一处。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>Record&lt;ColumnId, Card[]&gt;</code> is easier to work with than{" "}
                <code>Column[]</code> (where each column holds its own{" "}
                <code>cards</code>), because <strong>you index straight by column
                id</strong> instead of running <code>find</code> to locate the column
                first.
              </p>
              <p>
                <strong>And spread syntax plus computed property names changes two keys
                in one go</strong>: <code>{"{ ...board, [from]: ..., [to]: ... }"}</code>.
                With arrays inside arrays the same thing takes two <code>map</code>{" "}
                calls, clearly more roundabout.
              </p>
              <p>
                <strong>Keep the column order in its own constant array</strong> (
                <code>COLUMNS</code>), because &ldquo;order&rdquo; is display logic and
                should not be mixed into the data structure — that way adding a column
                touches one place.
              </p>
            </>
          ),
          code: [
            tested("ts", C_CARD_T, { filename: "src/types/Card.ts" }),
          ],
        },
        {
          id: "move",
          heading: "moveCard：这道题的全部难点",
          headingEn: "moveCard: the whole difficulty of this problem",
          lede: "函数体十行，四个关键决定。每一个都有理由。",
          ledeEn: "Ten lines of code, four decisions that matter. Each one has a reason.",
          body: (
            <>
              <p>
                <strong>逐行读：</strong>
              </p>
              <ul>
                <li>
                  <code>if (from === to) return board</code>——
                  <strong>返回原引用</strong>，
                  React 直接跳过重渲染。
                  写成 <code>{"return { ...board }"}</code>
                  会白渲染一次。
                </li>
                <li>
                  <code>find</code> 找不到也
                  <strong>原样返回</strong>——
                  别抛错，也别返回半个 board。
                </li>
                <li>
                  <code>{"[from]: board[from].filter(...)"}</code>——
                  源列去掉，新数组。
                </li>
                <li>
                  <code>{"[to]: [...board[to], card]"}</code>——
                  目标列追加，新数组。
                </li>
              </ul>
              <p>
                <strong>关键性质：<code>{"{ ...board }"}</code>
                只浅拷贝顶层</strong>，
                所以<strong>没被列出来的列（比如
                <code>done</code>）复用的是原来那个数组引用</strong>。
                这正是我们想要的 ——
                和评论树那道题「只重建路径上的节点」
                是<strong>完全同一个思路</strong>。
              </p>
              <p>
                <strong>测试里专门验证了这三件事</strong>：
                原 board 深冻结后调用不抛错、
                <code>next.done === b.done</code>（未动的复用）、
                <code>next.todo !== b.todo</code>（动过的是新的）。
              </p>
              <p>
                <strong>为什么必须是纯函数、不能在组件里写：</strong>
              </p>
              <ul>
                <li>
                  <strong>可以脱离 React 单测</strong>——
                  六条测试里三条根本不渲染组件。
                </li>
                <li>
                  <strong>不可能产生中间态</strong>。
                  写成「先 <code>setBoard</code> 删、
                  再 <code>setBoard</code> 加」，
                  虽然 React 18 会批处理，
                  但<strong>一旦中间插入任何提前
                  <code>return</code> 或校验，
                  卡片就凭空消失了</strong>。
                </li>
                <li>
                  以后要接真拖拽、撤销、
                  或者服务端同步，
                  <strong>这个函数原样能用</strong>。
                </li>
              </ul>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>Line by line:</strong>
              </p>
              <ul>
                <li>
                  <code>if (from === to) return board</code> —{" "}
                  <strong>return the original reference</strong> and React skips the
                  re-render outright. Writing{" "}
                  <code>{"return { ...board }"}</code> costs you one wasted render.
                </li>
                <li>
                  When <code>find</code> comes up empty,{" "}
                  <strong>return the board as it is</strong> — do not throw, and do not
                  return half a board.
                </li>
                <li>
                  <code>{"[from]: board[from].filter(...)"}</code> — the source column
                  drops it, new array.
                </li>
                <li>
                  <code>{"[to]: [...board[to], card]"}</code> — the target column
                  appends, new array.
                </li>
              </ul>
              <p>
                <strong>The key property: <code>{"{ ...board }"}</code> only copies the
                top level</strong>, so{" "}
                <strong>columns you did not list (say <code>done</code>) reuse the array
                reference they already had</strong>. That is exactly what we want, and{" "}
                <strong>exactly the same idea</strong> as &ldquo;rebuild only the nodes
                on the path&rdquo; in the comment-tree question.
              </p>
              <p>
                <strong>The test verifies these three things</strong>: calling it with a
                deep-frozen original board does not throw,{" "}
                <code>next.done === b.done</code> (untouched columns are reused), and{" "}
                <code>next.todo !== b.todo</code> (touched ones are new).
              </p>
              <p>
                <strong>Why it has to be a pure function instead of living inside the
                component:</strong>
              </p>
              <ul>
                <li>
                  <strong>It can be unit tested without React</strong> — three of the six
                  tests never render a component.
                </li>
                <li>
                  <strong>An in-between state becomes impossible</strong>. Write it as
                  &ldquo;<code>setBoard</code> to delete, then <code>setBoard</code> to
                  add&rdquo; and, even though React 18 batches,{" "}
                  <strong>the moment any early <code>return</code> or validation slips in
                  between, the card vanishes</strong>.
                </li>
                <li>
                  Later, when you wire up real drag and drop, undo, or server sync,{" "}
                  <strong>this function works unchanged</strong>.
                </li>
              </ul>
            </>
          ),
          code: [
            tested("tsx", C_KANBAN, {
              filename: "src/components/Kanban/index.tsx（实测通过）",
              collapsible: true,
            }),
            demo(
              "tsx",
              `// ✗ 两次 setState：中间态风险 + 没法单测
const move = (from, to, id) => {
  const card = board[from].find((c) => c.id === id);
  setBoard((b) => ({ ...b, [from]: b[from].filter((c) => c.id !== id) }));
  setBoard((b) => ({ ...b, [to]: [...b[to], card] }));   // card 从旧 board 拿的
};

// ✗ 没动也造新对象：白渲染一次
if (from === to) return { ...board };`,
              { filename: "两种错法" },
            ),
          ],
        },
      ],
      exercises: [
        {
          kind: "code-completion",
          id: "iv-coding-kanban-write",
          title: "写出 moveCard",
          level: 3,
          generated: true,
          prompt: (
            <p>
              一次操作同时改两个数组，而且不许碰原 board。
              检查器会查两个边界和「未动的列复用引用」。
            </p>
          ),
          language: "ts",
          filename: "src/components/Kanban/index.tsx",
          starter: `import type { Board, ColumnId } from "../../types/Card";
// type Board = Record<ColumnId, Card[]>

/**
 * 把 cardId 这张卡从 from 列移到 to 列，返回全新的 board。
 *
 * 要求：
 *   · from 和 to 相同时，原样返回（同一个引用）
 *   · 找不到这张卡时，原样返回
 *   · 不许修改传进来的 board（调用方会深冻结它）
 *   · 没被碰到的列要复用原数组引用
 */
export function moveCard(
  board: Board,
  from: ColumnId,
  to: ColumnId,
  cardId: number,
): Board {

}`,
          requirements: [
            "from === to 时返回同一个引用，不造新对象",
            "找不到卡时返回同一个引用",
            "源列用 filter 去掉，目标列用展开追加",
            "只改这两列，其余列复用原数组",
            "不许 push / splice / 直接赋值",
          ],
          checks: [
            { label: "处理了 from === to 并原样返回", must: "from\\s*===?\\s*to[\\s\\S]{0,40}return\\s+board" },
            { label: "先找卡片", must: "board\\s*\\[\\s*from\\s*\\]\\s*\\.find" },
            { label: "找不到时原样返回", must: "(!card|card\\s*===?\\s*undefined)[\\s\\S]{0,40}return\\s+board" },
            { label: "用展开保留其余列", must: "\\{\\s*\\.\\.\\.\\s*board\\s*," },
            { label: "源列用 filter", must: "\\[\\s*from\\s*\\]\\s*:\\s*board\\s*\\[\\s*from\\s*\\]\\s*\\.filter" },
            { label: "目标列用数组展开追加", must: "\\[\\s*to\\s*\\]\\s*:\\s*\\[\\s*\\.\\.\\.\\s*board\\s*\\[\\s*to\\s*\\]\\s*,\\s*card\\s*\\]" },
            { label: "没有 push / splice / unshift", mustNot: "\\.(push|splice|unshift)\\s*\\(" },
            { label: "没有深拷贝", mustNot: "JSON\\.parse|structuredClone" },
            { label: "没有直接给 board 的列赋值", mustNot: "board\\s*\\[[^\\]]+\\]\\s*=[^=]" },
          ],
          hints: [
            "先在纸上画三列，把要移动的那张卡圈出来。问自己：这次操作之后，哪几个数组的内容变了？没变的那些，需要造新数组吗？如果造了会有什么代价？",
            "返回一个对象字面量：先 ...board 把所有列带过来，再用计算属性名 [from] 和 [to] 覆盖这两列。源列 filter 掉，目标列 [...原来的, card]。开头两个 early return 直接 return board 本身（不是 { ...board }）。",
            `if (from === to) return board
const card = 在 board[from] 里找 id 匹配的
if (!card) return board

return {
  ...board,
  [from]: board[from] 去掉这张卡,
  [to]: board[to] 后面加上这张卡,
}`,
            `if (from === to) return board;

const card = board[from].find((c) => c.id === cardId);
if (!card) return board;

return {
  ...board,
  [from]: board[from].filter((c) => c.id !== cardId),
  [to]: [...board[to], card],
};`,
          ],
          solution: tested(
            "ts",
            `export function moveCard(
  board: Board,
  from: ColumnId,
  to: ColumnId,
  cardId: number,
): Board {
  if (from === to) return board;                       // 没动就原样返回

  const card = board[from].find((c) => c.id === cardId);
  if (!card) return board;                             // 找不到也原样返回

  return {
    ...board,
    [from]: board[from].filter((c) => c.id !== cardId), // 源列去掉
    [to]: [...board[to], card],                        // 目标列追加
  };
}`,
            {
              filename: "参考答案（实测通过，含深冻结与引用复用两条断言）",
              explanation:
                "{ ...board } 只浅拷贝顶层，所以没被列出来的列复用的是原数组引用 —— 测试里用 expect(next.done).toBe(b.done) 验证了这一点。",
            },
          ),
        },
      ],
      transfer: [
        {
          signal: "一次操作要改两处状态",
          signalEn: "One action has to change state in two places",
          reachFor: "写成一个纯函数，一次返回完整新状态",
          reachForEn: "Write one pure function that returns the whole new state at once",
        },
        {
          signal: "「状态没变但界面重渲染了」",
          signalEn: "\"nothing changed but the screen re-rendered\"",
          reachFor: "early return 时返回原引用，别造 { ...x }",
          reachForEn: "When you return early, return the original reference; do not build { ...x }",
        },
        {
          signal: "映射结构要改其中两个键",
          signalEn: "Two keys of a mapping have to change",
          reachFor: "{ ...obj, [k1]: …, [k2]: … } 计算属性名",
          reachForEn: "{ ...obj, [k1]: …, [k2]: … } with computed property names",
        },
        {
          signal: "想验证「真的没改原数据」",
          signalEn: "You want to prove the original data was really not changed",
          reachFor: "测试里 Object.freeze 深冻结",
          reachForEn: "Freeze it deeply with Object.freeze in the test",
        },
        {
          signal: "Kanban / 分组列表 / 多选穿梭框",
          signalEn: "Kanban, a grouped list, or a two-panel multi-select",
          reachFor: "都是同一个「一次改两个数组」的模式",
          reachForEn: "All the same pattern: change two arrays in one update",
        },
      ],
      recap: [
        "board 用 Record<ColumnId, Card[]>，配计算属性名一次改两个键；列的顺序单独放常量。",
        "moveCard 必须是纯函数：可以脱离 React 单测，而且不可能产生中间态。",
        "两个 early return 要返回原引用而不是 { ...board }，否则白渲染一次。",
        "{ ...board } 只浅拷贝顶层 —— 未被碰到的列自动复用原数组，和评论树「只重建路径」同理。",
        "别写成两次 setState「先删再加」：一旦中间插入校验或提前 return，卡片就会消失。",
      ],
      recapEn: [
        "Use Record<ColumnId, Card[]> for the board, with computed property names to change two keys at once; keep the column order in a separate constant.",
        "moveCard has to be a pure function: it can be unit tested without React, and it cannot produce a half-finished state.",
        "The two early returns should give back the original reference, not { ...board }, or you pay for a render that changes nothing.",
        "{ ...board } copies only the top level — the columns you did not touch keep their original arrays, the same idea as rebuilding only one path in a comment tree.",
        "Do not write it as two setState calls, one to remove and one to add: as soon as a check or an early return slips in between, the card disappears.",
      ],
    },
  ],
};
