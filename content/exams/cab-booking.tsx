// React Cab Booking（Context 版）—— 基于 cab-booking-context。
//
// 【这门课为什么存在】
// 它不是「再讲一遍 Context」。React 考试的变式五已经讲过「Context 该怎么写得好」
// （createContext 的默认值、useMemo、useCallback、守卫）。
// 这门课练的是另一半：**Context 在一个真实的多页应用里怎么用** ——
// Provider 放在哪一层、一个 action 同时改两个 state、消费者散在三个组件里。
//
// 【事实基准全部实测过】下面每个数字都在本机跑过：
//   · 原样 `npx vitest run` → **0 个测试跑起来**（CabContext.js 里有 JSX 但扩展名是 .js）
//   · 改名 .js → .jsx 之后 → 4 passed / 4 total
//   · 删掉各组件实现（README 建议的练法）→ 4 failed / 4 total
// 三个数字都在 scratchpad/cab/ 的副本里跑出来的，源项目一个字没动。

import type { Exam } from "../types";
import { demo, real, tested } from "../helpers";

/* ================================================================
   源项目里的真实代码 —— 引用时必须能在 sourceFile 里找到
   ================================================================ */

const SRC_CONTEXT = `import { createContext, useContext, useState } from "react";

const CabContext = createContext();

const CabProvider = ({ children }) => {
  const [bookedCabDetails, setBookedCabDetails] = useState(null);
  const [rideHistory, setRideHistory] = useState([]);

  const updateBookedCabDetails = (details) => {
    setBookedCabDetails(details);
    setRideHistory([...rideHistory, details]);
  };

  return (
    <CabContext.Provider
      value={{ bookedCabDetails, updateBookedCabDetails, rideHistory }}
    >
      {children}
    </CabContext.Provider>
  );
};

const useCabContext = () => {
  const context = useContext(CabContext);

  if (!context) {
    throw new Error("useCabContext must be used within a CabProvider");
  }

  return context;
};

export { CabProvider, useCabContext };`;

const SRC_INDEX = `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CabProvider } from "./context/CabContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CabProvider>
      <App />
    </CabProvider>
  </React.StrictMode>,
);`;

const SRC_APP = `import { useState } from "react";
import "./App.css";
import { AppHeader } from "./components/AppHeader";
import Home from "./components/Home/Home";
import CabOptions from "./components/CabOptions/CabOptions";
import Loading from "./components/Loading/Loading";
import CabConfirmation from "./components/CabConfirmation/CabConfirmation";
import { useCabContext } from "./context/CabContext";

const title = "Cab Booking";

const App = () => {
  const [currentPage, setCurrentPage] = useState("home");
  const { updateBookedCabDetails } = useCabContext();

  const handleSelectCab = (cab) => {
    updateBookedCabDetails(cab);
    setCurrentPage("loading");
  };

  return (
    <div className="App">
      <AppHeader title={title} />

      {currentPage === "home" && (
        <Home onBookClick={() => setCurrentPage("cab-options")} />
      )}

      {currentPage === "cab-options" && (
        <CabOptions onSelectCab={handleSelectCab} />
      )}

      {currentPage === "loading" && (
        <Loading onComplete={() => setCurrentPage("cab-confirmation")} />
      )}

      {currentPage === "cab-confirmation" && (
        <CabConfirmation onConfirm={() => setCurrentPage("home")} />
      )}
    </div>
  );
};

export default App;`;

const SRC_HOME = `import RideHistory from "./RideHistory";

const Home = ({ onBookClick }) => {
  return (
    <main className="home-container">
      <section className="hero-card">
        <p className="eyebrow">HackerRide</p>
        <h2>Book a Safe Ride with HackerRide</h2>
        <p className="hero-copy">
          Choose a cab, wait for confirmation, and review your latest rides.
        </p>
        <button
          type="button"
          className="primary-button"
          data-testid="book-button"
          onClick={onBookClick}
        >
          Book a Cab
        </button>
      </section>

      <RideHistory />
    </main>
  );
};

export default Home;`;

const SRC_HISTORY = `import { useCabContext } from "../../context/CabContext";

const RideHistory = () => {
  const { rideHistory } = useCabContext();
  const latestRides = rideHistory.slice(-3).reverse();

  return (
    <section className="history-container" aria-labelledby="ride-history-title">
      <h3 id="ride-history-title">Ride History</h3>

      {latestRides.length > 0 ? (
        <ul className="history-list">
          {latestRides.map((ride, index) => (
            <li key={\`\${ride.id}-\${index}\`} data-testid="history-cabs">
              <span>{ride.name}</span>
              <strong>\${ride.price}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p data-testid="no-ride-title" className="empty-state">
          No ride history yet.
        </p>
      )}
    </section>
  );
};

export default RideHistory;`;

const SRC_OPTIONS = `import cabData from "../../data/data.json";
import CabCard from "./CabCard";

const CabOptions = ({ onSelectCab }) => {
  return (
    <main className="cabs-container">
      <div className="page-heading">
        <p className="eyebrow">Available now</p>
        <h2>Select your desired Car</h2>
      </div>

      <div data-testid="all-cabs-section" className="all-cabs-section">
        {Object.keys(cabData).map((type) => (
          <section key={type} className="cab-type-section">
            <h3 data-testid="car-type-heading">{type}</h3>
            <div className="cab-list">
              {cabData[type].map((cab) => (
                <CabCard key={cab.id} cab={cab} onSelectCab={onSelectCab} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
};

export default CabOptions;`;

const SRC_CARD = `const CabCard = ({ cab, onSelectCab }) => {
  return (
    <article className="cab-card">
      <img src={cab.image} alt={cab.name} data-testid="cab-card-img" />
      <div className="cab-card__content">
        <p data-testid="cab-card-name" className="cab-card__name">
          {cab.name}
        </p>
        <p data-testid="cab-card-type" className="cab-card__type">
          Type: {cab.type}
        </p>
        <p data-testid="cab-card-price" className="cab-card__price">
          Fare: \${cab.price}
        </p>
        <button
          type="button"
          data-testid="cab-card-select-button"
          className="secondary-button"
          onClick={() => onSelectCab(cab)}
        >
          Select
        </button>
      </div>
    </article>
  );
};

export default CabCard;`;

const SRC_LOADING = `import { useEffect } from "react";

const Loading = ({ onComplete }) => {
  useEffect(() => {
    // 模拟 1 秒延迟加载
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <main data-testid="loading" className="loading-container">
      <div className="spinner" aria-hidden="true" />
      <h1>Loading...</h1>
      <p>We are working on your cab booking. Thanks for your patience.</p>
    </main>
  );
};

export default Loading;`;

const SRC_CONFIRM = `import { useCabContext } from "../../context/CabContext";

const CabConfirmation = ({ onConfirm }) => {
  const { bookedCabDetails } = useCabContext();

  return (
    <main className="confirm-container">
      <div className="success-icon" aria-hidden="true">
        ✓
      </div>
      <h2>Cab Booked Successfully!</h2>
      <p data-testid="confirm-message">
        {bookedCabDetails?.name} is on the way and will arrive shortly.
      </p>
      <button
        type="button"
        data-testid="confirm-button"
        className="primary-button"
        onClick={onConfirm}
      >
        Okay
      </button>
    </main>
  );
};

export default CabConfirmation;`;

const SRC_TESTS = `import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { CabProvider } from "../context/CabContext";

const renderApp = () =>
  render(
    <CabProvider>
      <App />
    </CabProvider>,
  );

describe("React: Cab Booking", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("renders the home page and empty ride history", () => {
    renderApp();

    expect(
      screen.getByText("Book a Safe Ride with HackerRide"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("book-button")).toBeInTheDocument();
    expect(screen.getByTestId("no-ride-title")).toHaveTextContent(
      "No ride history yet.",
    );
  });

  it("shows grouped cab options with all required card fields", () => {
    renderApp();

    fireEvent.click(screen.getByTestId("book-button"));

    expect(screen.getByTestId("all-cabs-section")).toBeInTheDocument();
    expect(screen.getAllByTestId("car-type-heading").map((node) => node.textContent))
      .toEqual(["Sedan", "SUV", "Luxury"]);
    expect(screen.getAllByTestId("cab-card-img")).toHaveLength(6);
    expect(screen.getAllByTestId("cab-card-name")).toHaveLength(6);
    expect(screen.getAllByTestId("cab-card-type")).toHaveLength(6);
    expect(screen.getAllByTestId("cab-card-price")).toHaveLength(6);
    expect(screen.getAllByTestId("cab-card-select-button")).toHaveLength(6);
  });

  it("completes a booking and adds it to ride history", () => {
    renderApp();

    fireEvent.click(screen.getByTestId("book-button"));
    fireEvent.click(screen.getAllByTestId("cab-card-select-button")[0]);

    expect(screen.getByTestId("loading")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId("confirm-message")).toHaveTextContent(
      "Ford Fusion is on the way and will arrive shortly.",
    );

    fireEvent.click(screen.getByTestId("confirm-button"));

    expect(screen.getByTestId("history-cabs")).toHaveTextContent(
      "Ford Fusion",
    );
    expect(screen.getByTestId("history-cabs")).toHaveTextContent("$20");
  });

  it("keeps only the newest three rides", () => {
    renderApp();

    const selectCabByIndex = (index) => {
      fireEvent.click(screen.getByTestId("book-button"));
      fireEvent.click(screen.getAllByTestId("cab-card-select-button")[index]);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      fireEvent.click(screen.getByTestId("confirm-button"));
    };

    selectCabByIndex(0);
    selectCabByIndex(1);
    selectCabByIndex(2);
    selectCabByIndex(3);

    const rides = screen.getAllByTestId("history-cabs");
    expect(rides).toHaveLength(3);
    expect(rides[0]).toHaveTextContent("Ford Explorer");
    expect(rides[1]).toHaveTextContent("Toyota Highlander");
    expect(rides[2]).toHaveTextContent("Honda Accord");
    expect(screen.queryByText(/Ford Fusion/)).not.toBeInTheDocument();
  });
});`;

/* ================================================================
   考试
   ================================================================ */

const cabBooking: Exam = {
  id: "cab-booking",
  title: "React Cab Booking（Context 版）",
  titleEn: "React Cab Booking (Context version)",
  shortTitle: "Cab Booking",
  shortTitleEn: "Cab Booking",
  description:
    "一个用 Context 管全局状态的打车小应用。四个页面、一个 Context、四个测试。练的是「Context 在一个真实多页应用里怎么用」—— Provider 放在哪一层、一个 action 同时改两个 state、消费者散在三个组件里。",
  descriptionEn:
    "A small cab booking app that keeps its global state in a Context. Four pages, one Context, four tests. The practice here is how to use Context in a real app with several pages: which level the Provider goes on, one action updating two pieces of state at once, and readers of the Context spread across three components.",
  category: "前端",
  tests:
    "Context 三件套与 Provider 的层级、一次更新两个 state、页面状态机、数组取尾部三条并反转、useEffect 的 setTimeout 清理、data-testid 契约。附带一个真实的脚手架缺陷：完整答案原样跑不起来。",
  testsEn:
    "The three parts of Context and the level the Provider sits at, updating two pieces of state in one action, the page state machine, taking the last three items of an array and reversing them, clearing a setTimeout inside useEffect, and the data-testid contract. Plus one real defect in the provided project: the complete answer does not run as given.",
  sourceProjects: [
    {
      path: "cab-booking-context",
      role: "参考项目。6 个组件 + 1 个 Context + 4 个测试",
    },
  ],
  prerequisites: ["foundations"],
  stack: ["React 18", "Context", "Vite", "Vitest", "React Testing Library"],
  status: "ready",
  checklist: [
    { task: "首页 + 空历史提示", covered: "第 1 部分 · 先读四个测试", tested: true },
    { task: "Context 三件套 + Provider 层级", covered: "第 1 部分 · Context 放在哪一层", tested: true },
    { task: "一个 action 改两个 state", covered: "第 1 部分 · 一次更新两个 state", tested: true },
    { task: "四个页面的切换", covered: "第 2 部分 · 页面状态机", tested: true },
    { task: "按类型分组 + 六张卡的字段", covered: "第 2 部分 · 分组渲染与 testid 契约", tested: true },
    { task: "Loading 一秒后自动跳转", covered: "第 2 部分 · setTimeout 与清理函数", tested: true },
    { task: "历史只留最新三条、最新在最上", covered: "第 2 部分 · slice(-3).reverse()", tested: true },
    { task: "脚手架缺陷：.js 里写 JSX", covered: "第 3 部分 · Debug Lab", tested: true },
    { task: "两处能更好的写法（面试会问）", covered: "第 3 部分 · 面试官会追问的两点", tested: false },
    { task: "空文件夹里从零重写", covered: "第 3 部分 · 从零重写", tested: true },
  ],
  mockExams: [],
  modules: [
    /* ============================================================
       第 1 部分 —— Context 这一层
       ============================================================ */
    {
      id: "cab-context",
      title: "Context 这一层：放在哪、存什么、怎么改",
      titleEn: "The Context layer: where to put it, what to store, how to update it",
      summary:
        "先把四个测试读清楚，再搭 Context。这一部分的核心是一个位置问题：Provider 到底该包在哪一层 —— 答错这个，App 自己就用不了 Context。",
      summaryEn:
        "Read the four tests carefully first, then build the Context. The main point of this part is a question of position: which level of the tree the Provider should wrap. Get that wrong and App itself cannot read the Context.",
      stage: "Cab Booking · 第 1 部分",
      lessons: [
        {
          id: "cb-read-tests",
          title: "先读四个测试：它们到底要什么",
          titleEn: "Read the four tests first: what exactly they ask for",
          blurb: "四个测试全靠 data-testid 找元素。先抄一张 testid 表出来，再动手。",
          blurbEn:
            "All four tests find elements by data-testid. Copy out the list of testids first, then start writing.",
          minutes: 14,
          objectives: [
            "读出四个测试各自查的是什么",
            "抄出全部 13 个 data-testid，知道改名会红哪一片",
            "说清为什么测试 4 是这道题真正的分水岭",
            "知道 `vi.useFakeTimers()` 让 Loading 的 1 秒变成可控的",
          ],
          objectivesEn: [
            "Say what each of the four tests checks",
            "Copy out all 13 data-testid values, and know which tests fail if you rename one",
            "Explain why test 4 is the real dividing line in this task",
            "Know that `vi.useFakeTimers()` puts the 1 second in Loading under your control",
          ],
          whyForAssessment:
            "这道题的判分完全由 data-testid 驱动 —— 页面长得对但 testid 错一个，那一片全红。先读测试再写代码，能省掉一半的返工。测试 4「只留最新三条」是分水岭：slice 方向写反、忘了 reverse、或者原地改了 state，都会挂在这一条。",
          whyForAssessmentEn:
            "Scoring here is driven entirely by data-testid. The page can look right, and one wrong testid still fails every check around it. Reading the tests before writing code saves half of the rework. Test 4, which keeps only the three newest rides, is the dividing line: a slice in the wrong direction, a missing reverse, or changing the state array in place all fail on that one test.",
          sourceFiles: [
            { path: "cab-booking-context/src/test/App.test.jsx", role: "四个测试，判分的全部依据" },
            { path: "cab-booking-context/src/data/data.json", role: "三组六辆车，分组顺序来自这里的键顺序" },
          ],
          concepts: [
            {
              id: "cb-four-tests",
              heading: "四个测试各查什么",
              headingEn: "What each of the four tests checks",
              lede: "读完这张表，你就知道要写哪些东西",
              ledeEn:
                "Read this table and you know everything you have to build",
              body: (
                <>
                  <p>
                    <strong>一句话：</strong>四个测试从「首页长对了吗」一路走到
                    「连订四辆车之后历史对吗」，
                    <strong>刚好是一次完整的用户流程</strong>。
                  </p>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>测试名</th>
                          <th>查什么</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>1</td>
                          <td>renders the home page and empty ride history</td>
                          <td>
                            首页标题 + <code>book-button</code> +{" "}
                            <code>no-ride-title</code> 的文字是
                            <code>No ride history yet.</code>
                          </td>
                        </tr>
                        <tr>
                          <td>2</td>
                          <td>shows grouped cab options with all required card fields</td>
                          <td>
                            <code>all-cabs-section</code> 存在；三个{" "}
                            <code>car-type-heading</code> 的文字
                            <strong>严格等于</strong>{" "}
                            <code>[&quot;Sedan&quot;, &quot;SUV&quot;, &quot;Luxury&quot;]</code>
                            ；五种卡片字段各 <strong>6 个</strong>
                          </td>
                        </tr>
                        <tr>
                          <td>3</td>
                          <td>completes a booking and adds it to ride history</td>
                          <td>
                            选第一辆 → 出现 <code>loading</code> → 时间推进 1 秒 →
                            <code>confirm-message</code> 是
                            <code>Ford Fusion is on the way and will arrive shortly.</code>
                            → 点确认 → 历史里有 <code>Ford Fusion</code> 和{" "}
                            <code>$20</code>
                          </td>
                        </tr>
                        <tr>
                          <td>4</td>
                          <td>keeps only the newest three rides</td>
                          <td>
                            连订 4 辆，历史<strong>只剩 3 条</strong>，顺序是
                            Ford Explorer / Toyota Highlander / Honda Accord，
                            而且 <code>Ford Fusion</code>
                            <strong>必须已经不在 DOM 里</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    <strong>测试 2 那个 </strong>
                    <code>toEqual</code>
                    <strong> 要特别注意：</strong>它比的是一个
                    <strong>有序数组</strong>，不是「包含这三个」。
                    分组顺序错了就红。而顺序不是你决定的 ——
                    它来自 <code>data.json</code> 的键顺序，
                    你只要老实地 <code>Object.keys(cabData).map(...)</code> 就对了。
                  </p>
                  <p>
                    <strong>测试 4 是分水岭。</strong>它同时查三件事：
                    <strong>只剩三条</strong>（数量）、
                    <strong>最新在最上</strong>（顺序）、
                    <strong>最旧那条真的不在 DOM 里</strong>（不是藏起来了）。
                    后面有一整节专门讲它。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    <strong>In one line:</strong> the four tests walk from &ldquo;does
                    the home page look right&rdquo; to &ldquo;is the history correct
                    after four bookings&rdquo; —{" "}
                    <strong>exactly one full user journey</strong>.
                  </p>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Test</th>
                          <th>What it checks</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>1</td>
                          <td>renders the home page and empty ride history</td>
                          <td>
                            The hero heading, <code>book-button</code>, and{" "}
                            <code>no-ride-title</code> reading{" "}
                            <code>No ride history yet.</code>
                          </td>
                        </tr>
                        <tr>
                          <td>2</td>
                          <td>shows grouped cab options with all required card fields</td>
                          <td>
                            <code>all-cabs-section</code> exists; the three{" "}
                            <code>car-type-heading</code> texts are{" "}
                            <strong>strictly equal</strong> to{" "}
                            <code>[&quot;Sedan&quot;, &quot;SUV&quot;, &quot;Luxury&quot;]</code>
                            ; five card fields, <strong>6 of each</strong>
                          </td>
                        </tr>
                        <tr>
                          <td>3</td>
                          <td>completes a booking and adds it to ride history</td>
                          <td>
                            Pick the first cab → <code>loading</code> appears → advance
                            time by 1s → <code>confirm-message</code> reads{" "}
                            <code>Ford Fusion is on the way and will arrive shortly.</code>{" "}
                            → confirm → history holds <code>Ford Fusion</code> and{" "}
                            <code>$20</code>
                          </td>
                        </tr>
                        <tr>
                          <td>4</td>
                          <td>keeps only the newest three rides</td>
                          <td>
                            Book 4 cabs; history has <strong>exactly 3</strong> entries,
                            ordered Ford Explorer / Toyota Highlander / Honda Accord, and{" "}
                            <code>Ford Fusion</code>{" "}
                            <strong>must be gone from the DOM</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    <strong>Watch that </strong>
                    <code>toEqual</code>
                    <strong> in test 2:</strong> it compares an{" "}
                    <strong>ordered array</strong>, not &ldquo;contains these
                    three&rdquo;. Wrong group order fails. And the order is not yours to
                    choose — it comes from the key order in <code>data.json</code>, so
                    plainly mapping <code>Object.keys(cabData)</code> gets it right.
                  </p>
                  <p>
                    <strong>Test 4 is where people fall.</strong> It checks three things
                    at once: <strong>only three remain</strong> (count),{" "}
                    <strong>newest on top</strong> (order), and{" "}
                    <strong>the oldest is really out of the DOM</strong> (not merely
                    hidden). A whole lesson below is about it.
                  </p>
                </>
              ),
              code: [
                real("jsx", SRC_TESTS, {
                  filename: "src/test/App.test.jsx（判分的全部依据）",
                  sourceFile: "cab-booking-context/src/test/App.test.jsx",
                  collapsible: true,
                }),
              ],
            },
            {
              id: "cb-testid-contract",
              heading: "13 个 data-testid 就是契约",
              headingEn: "The 13 data-testid values are the contract",
              lede: "改一个名字，红一片。所以先抄表",
              ledeEn:
                "Rename one and a whole group of tests fails. So copy the list out first",
              body: (
                <>
                  <p>
                    <strong>一句话：</strong>这道题的判分不看你的 class 名、
                    不看 DOM 结构、也不看样式，
                    <strong>只看 13 个 <code>data-testid</code> 和它们里面的文字</strong>。
                  </p>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>testid</th>
                          <th>在哪个组件</th>
                          <th>几个</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><code>book-button</code></td>
                          <td>Home</td>
                          <td>1</td>
                        </tr>
                        <tr>
                          <td><code>no-ride-title</code></td>
                          <td>RideHistory（空的时候）</td>
                          <td>0 或 1</td>
                        </tr>
                        <tr>
                          <td><code>history-cabs</code></td>
                          <td>RideHistory（每条一个）</td>
                          <td>0–3</td>
                        </tr>
                        <tr>
                          <td><code>all-cabs-section</code></td>
                          <td>CabOptions</td>
                          <td>1</td>
                        </tr>
                        <tr>
                          <td><code>car-type-heading</code></td>
                          <td>CabOptions（每组一个）</td>
                          <td>3</td>
                        </tr>
                        <tr>
                          <td>
                            <code>cab-card-img</code> / <code>-name</code> /{" "}
                            <code>-type</code> / <code>-price</code> /{" "}
                            <code>-select-button</code>
                          </td>
                          <td>CabCard（每张卡五个）</td>
                          <td>各 6</td>
                        </tr>
                        <tr>
                          <td><code>loading</code></td>
                          <td>Loading</td>
                          <td>1</td>
                        </tr>
                        <tr>
                          <td>
                            <code>confirm-message</code> / <code>confirm-button</code>
                          </td>
                          <td>CabConfirmation</td>
                          <td>各 1</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    <strong>两个容易忽略的细节：</strong>
                  </p>
                  <ul>
                    <li>
                      <code>no-ride-title</code> 和 <code>history-cabs</code>
                      <strong>是互斥的</strong> —— 空的时候只有前者，
                      有记录的时候只有后者。所以 RideHistory 里必须是一个三元表达式，
                      不能两个都渲染。
                    </li>
                    <li>
                      测试 4 最后一行是{" "}
                      <code>queryByText(/Ford Fusion/)</code>
                      <strong>不能</strong>存在。注意它用的是{" "}
                      <code>queryBy</code> 而不是 <code>getBy</code> ——
                      <strong><code>getBy</code> 找不到会抛错，
                      <code>queryBy</code> 找不到返回 null</strong>，
                      所以断言「不存在」时只能用 <code>queryBy</code>。
                      这一点面试也会问。
                    </li>
                  </ul>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    <strong>In one line:</strong> the grader ignores your class names,
                    your DOM shape and your styling. It looks at{" "}
                    <strong>
                      13 <code>data-testid</code> hooks and the text inside them
                    </strong>
                    .
                  </p>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>testid</th>
                          <th>Component</th>
                          <th>How many</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><code>book-button</code></td>
                          <td>Home</td>
                          <td>1</td>
                        </tr>
                        <tr>
                          <td><code>no-ride-title</code></td>
                          <td>RideHistory (when empty)</td>
                          <td>0 or 1</td>
                        </tr>
                        <tr>
                          <td><code>history-cabs</code></td>
                          <td>RideHistory (one per row)</td>
                          <td>0–3</td>
                        </tr>
                        <tr>
                          <td><code>all-cabs-section</code></td>
                          <td>CabOptions</td>
                          <td>1</td>
                        </tr>
                        <tr>
                          <td><code>car-type-heading</code></td>
                          <td>CabOptions (one per group)</td>
                          <td>3</td>
                        </tr>
                        <tr>
                          <td>
                            <code>cab-card-img</code> / <code>-name</code> /{" "}
                            <code>-type</code> / <code>-price</code> /{" "}
                            <code>-select-button</code>
                          </td>
                          <td>CabCard (five per card)</td>
                          <td>6 each</td>
                        </tr>
                        <tr>
                          <td><code>loading</code></td>
                          <td>Loading</td>
                          <td>1</td>
                        </tr>
                        <tr>
                          <td>
                            <code>confirm-message</code> / <code>confirm-button</code>
                          </td>
                          <td>CabConfirmation</td>
                          <td>1 each</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    <strong>Two details people miss:</strong>
                  </p>
                  <ul>
                    <li>
                      <code>no-ride-title</code> and <code>history-cabs</code> are{" "}
                      <strong>mutually exclusive</strong> — only the first when empty,
                      only the second once there are rides. So RideHistory needs a
                      ternary; rendering both fails.
                    </li>
                    <li>
                      The last line of test 4 asserts that{" "}
                      <code>queryByText(/Ford Fusion/)</code> is{" "}
                      <strong>not</strong> there. Note it uses <code>queryBy</code>, not{" "}
                      <code>getBy</code> —{" "}
                      <strong>
                        <code>getBy</code> throws when nothing matches,{" "}
                        <code>queryBy</code> returns null
                      </strong>
                      , so asserting absence only works with <code>queryBy</code>.
                      Interviewers ask about this too.
                    </li>
                  </ul>
                </>
              ),
            },
          ],
          callouts: [
            {
              tone: "trap",
              title: "先跑一次会发现跑不起来",
              body: (
                <>
                  README 说「先运行完整答案熟悉流程」。
                  <strong>但原样 <code>npx vitest run</code> 是 0 个测试跑起来</strong> ——
                  不是某个测试失败，是连收集阶段都过不去。
                  原因是个扩展名问题，第 3 部分的 Debug Lab 专门讲。
                  现在只要知道：<strong>把 <code>src/context/CabContext.js</code>
                  改名成 <code>.jsx</code></strong> 就能跑，
                  而且所有 import 都是无扩展名的，改名不用动任何 import。
                </>
              ),
            },
          ],
          exercises: [
            {
              id: "cb-tests-recognition",
              kind: "recognition",
              level: 1,
              title: "哪个断言决定了「分组顺序」不能自己定？",
              prompt: <>测试 2 里有一行让「Sedan / SUV / Luxury 的顺序」变成硬要求。是哪一行？</>,
              options: [
                { id: "a", label: "expect(screen.getByTestId(\"all-cabs-section\")).toBeInTheDocument()" },
                {
                  id: "b",
                  label:
                    "expect(screen.getAllByTestId(\"car-type-heading\").map((n) => n.textContent)).toEqual([\"Sedan\", \"SUV\", \"Luxury\"])",
                },
                { id: "c", label: "expect(screen.getAllByTestId(\"cab-card-img\")).toHaveLength(6)" },
                { id: "d", label: "expect(screen.getByTestId(\"book-button\")).toBeInTheDocument()" },
              ],
              answer: ["b"],
              explain: (
                <>
                  <code>toEqual</code> 比的是<strong>有序数组</strong>。
                  把三个 <code>car-type-heading</code> 的文字按 DOM 顺序取出来，
                  必须正好是 <code>[&quot;Sedan&quot;, &quot;SUV&quot;, &quot;Luxury&quot;]</code>。
                  <br />
                  好消息是这个顺序不用你操心 —— 它就是 <code>data.json</code> 的键顺序，
                  老实用 <code>Object.keys(cabData).map(...)</code> 就对了。
                  <strong>反而是「我来排个序」会把它弄坏。</strong>
                </>
              ),
            },
            {
              id: "cb-testid-fill",
              kind: "fill-blank",
              level: 2,
              title: "补齐 RideHistory 的两个 testid 和互斥逻辑",
              prompt: (
                <>
                  空的时候只能出现 <code>no-ride-title</code>，
                  有记录的时候只能出现 <code>history-cabs</code>。把三个空填上。
                </>
              ),
              language: "jsx",
              filename: "src/components/Home/RideHistory.jsx",
              template: `const RideHistory = () => {
  const { rideHistory } = useCabContext();
  const latestRides = rideHistory.slice(-3).reverse();

  return (
    <section className="history-container">
      <h3>Ride History</h3>

      {latestRides.length > 0 ? (
        <ul className="history-list">
          {latestRides.map((ride, index) => (
            <li key={\`\${ride.id}-\${index}\`} data-testid="___1___">
              <span>{ride.name}</span>
              <strong>\${ride.price}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p data-testid="___2___" className="empty-state">
          ___3___
        </p>
      )}
    </section>
  );
};`,
              blanks: [
                {
                  n: 1,
                  accept: ["history-cabs"],
                  hint: "测试用 getAllByTestId 数它的条数",
                  why: (
                    <>
                      测试 3 和测试 4 都用 <code>history-cabs</code> 找历史条目，
                      测试 4 还用 <code>toHaveLength(3)</code> 数它。
                      所以它必须挂在<strong>每一条 <code>&lt;li&gt;</code> 上</strong>，
                      不是挂在外层 <code>&lt;ul&gt;</code> 上 ——
                      挂错地方会变成只有 1 个，测试 4 直接红。
                    </>
                  ),
                },
                {
                  n: 2,
                  accept: ["no-ride-title"],
                  hint: "测试 1 用它断言空状态",
                  why: (
                    <>
                      测试 1：<code>getByTestId(&quot;no-ride-title&quot;)</code>。
                      注意它和 <code>history-cabs</code>
                      <strong>在同一时刻只能有一个存在</strong> ——
                      所以这里必须是三元表达式的两个分支，
                      不能把空状态那段一直渲染着。
                    </>
                  ),
                },
                {
                  n: 3,
                  accept: ["No ride history yet.", "No ride history yet"],
                  hint: "测试 1 用 toHaveTextContent 比这句话",
                  why: (
                    <>
                      <code>toHaveTextContent(&quot;No ride history yet.&quot;)</code> ——
                      文字必须对得上。<strong>这类「文案即断言」的地方
                      千万别自己改写</strong>，
                      「暂无记录」或者 &ldquo;No rides yet&rdquo; 都会红。
                    </>
                  ),
                },
              ],
            },
          ],
          mistakes: [
            {
              wrong: demo(
                "jsx",
                `// ✕ testid 挂在外层 —— 测试 4 数出来只有 1 个
<ul className="history-list" data-testid="history-cabs">
  {latestRides.map((ride, index) => (
    <li key={ride.id}>
      <span>{ride.name}</span>
    </li>
  ))}
</ul>`,
                { filename: "挂错层级" },
              ),
              why: (
                <>
                  测试 4 是 <code>expect(rides).toHaveLength(3)</code>。
                  <code>history-cabs</code> 挂在 <code>&lt;ul&gt;</code> 上，
                  <code>getAllByTestId</code> 只找到 <strong>1 个</strong>，
                  断言 3 直接失败。
                  <br />
                  <strong>顺带另一个错：</strong>
                  <code>key={"{ride.id}"}</code> 在这里不安全 ——
                  同一辆车可以被订两次，id 会重复。
                  源项目用的是 <code>{"`${ride.id}-${index}`"}</code>。
                </>
              ),
              whyEn: (
                <>
                  Test 4 is <code>expect(rides).toHaveLength(3)</code>. Here{" "}
                  <code>history-cabs</code> sits on the <code>&lt;ul&gt;</code>, so{" "}
                  <code>getAllByTestId</code> finds only <strong>1</strong> element and the
                  assertion for 3 fails.
                  <br />
                  <strong>A second mistake in the same snippet:</strong>{" "}
                  <code>key={"{ride.id}"}</code> is not safe here — the same cab can be booked
                  twice, so the id repeats. The source project uses{" "}
                  <code>{"`${ride.id}-${index}`"}</code>.
                </>
              ),
            },
          ],
          transfer: [
            { signal: "测试全靠 data-testid 找元素", reachFor: "先抄一张 testid 表，标清每个几个、挂在哪一层" },
            { signal: "要断言「某个东西不存在」", reachFor: "queryBy 而不是 getBy —— getBy 找不到会抛错" },
            { signal: "空状态和列表两个 testid", reachFor: "它们互斥，用三元表达式，别两个都渲染" },
            { signal: "toEqual 比一个数组", reachFor: "那是有序断言，顺序错了就红" },
          ],
          recap: [
            "四个测试是一次完整用户流程：首页 → 选车 → 加载 → 确认 → 历史。",
            "13 个 data-testid 是唯一契约；改名字或挂错层级都会红一片。",
            "测试 2 的 toEqual 是有序断言，分组顺序来自 data.json 的键顺序，别自己排。",
            "断言「不存在」只能用 queryBy —— getBy 找不到会抛错。",
            "原样跑是 0 个测试跑起来：把 CabContext.js 改名成 .jsx 才能开始。",
          ],
          recapEn: [
            "The four tests are one complete user journey: home page, pick a cab, loading, confirmation, history.",
            "The 13 data-testid values are the only contract; a renamed one or one on the wrong element fails a whole group of tests.",
            "The toEqual in test 2 is an ordered assertion. The group order comes from the key order in data.json, so do not sort them yourself.",
            "To assert that something is absent you have to use queryBy. getBy throws an error when it finds nothing.",
            "Run the project as it comes and 0 tests start: rename CabContext.js to .jsx before anything else.",
          ],
        },
        {
          id: "cb-provider-layer",
          title: "Context 放在哪一层 —— 这道题最容易死的地方",
          titleEn: "Which level the Context goes on — the most common way to fail this task",
          blurb: "Provider 必须包在 App 外面。包在里面，App 自己就用不了 Context。",
          blurbEn:
            "The Provider has to wrap App from the outside. Put it inside App and App itself cannot read the Context.",
          minutes: 16,
          objectives: [
            "写出 Context 三件套：createContext / Provider / 自定义 hook",
            "说清为什么 Provider 必须在 App 外面，而不是 App 内部",
            "知道自定义 hook 里那个 throw 守卫在防什么",
            "看懂测试为什么也要自己包一层 CabProvider",
          ],
          objectivesEn: [
            "Write the three parts of Context: createContext, the Provider, and a custom hook",
            "Explain why the Provider must sit outside App and not inside it",
            "Know what the throw guard in the custom hook protects you from",
            "See why the test file also wraps its own CabProvider",
          ],
          whyForAssessment:
            "这是这道题最容易一次死透的地方。App 里的 handleSelectCab 要调 updateBookedCabDetails，所以 App 本身就是一个消费者 —— 如果你把 Provider 写在 App 的 return 里，App 自己拿不到 context，那个 throw 守卫会立刻炸，四个测试全红。",
          whyForAssessmentEn:
            "This is the fastest way to fail the whole task. handleSelectCab lives in App and calls updateBookedCabDetails, so App itself is a reader of the Context. If you write the Provider inside the return of App, App cannot reach the context, the throw guard fires at once, and all four tests fail.",
          sourceFiles: [
            { path: "cab-booking-context/src/context/CabContext.js", role: "Context 三件套。注意扩展名是 .js 而里面有 JSX", edit: true },
            { path: "cab-booking-context/src/index.jsx", role: "Provider 包在 App 外面的那一层" },
          ],
          concepts: [
            {
              id: "cb-three-parts",
              heading: "Context 三件套",
              headingEn: "The three parts of Context",
              lede: "createContext 造管道、Provider 灌数据、自定义 hook 取数据",
              ledeEn:
                "createContext makes the channel, the Provider fills it with data, and a custom hook reads the data",
              body: (
                <>
                  <p>
                    <strong>一句话：</strong>
                    <code>createContext()</code> 造一根管道，
                    <code>Provider</code> 往管道里灌值，
                    子树里任何组件用 <code>useContext</code> 就能取到 ——
                    <strong>不用一层层传 props</strong>。
                  </p>
                  <p>
                    <strong>三件套各自的职责：</strong>
                  </p>
                  <ul>
                    <li>
                      <strong><code>const CabContext = createContext()</code></strong>
                      —— 造管道。注意源项目<strong>没给默认值</strong>，
                      所以没套 Provider 时 <code>useContext</code> 返回{" "}
                      <code>undefined</code>。这是故意的，见下一条。
                    </li>
                    <li>
                      <strong><code>CabProvider</code></strong> —— 一个普通组件。
                      两个 <code>useState</code> 存状态，
                      一个函数改状态，
                      三样东西打包成 <code>value</code> 灌进 <code>Provider</code>。
                    </li>
                    <li>
                      <strong><code>useCabContext</code></strong> —— 自定义 hook。
                      它不只是 <code>useContext</code> 的别名，
                      <strong>它还带一个守卫</strong>：拿不到就抛错。
                    </li>
                  </ul>
                  <p>
                    <strong>那个守卫在防什么</strong>
                    （下面代码块里高亮的 26–28 行）：
                    如果没有守卫，忘了套 Provider 时 <code>context</code> 是{" "}
                    <code>undefined</code>，
                    然后 <code>const {"{ rideHistory }"} = undefined</code> 会抛一个
                    <strong>看不懂的解构错误</strong>
                    （<code>Cannot destructure property ... of undefined</code>）。
                    有了守卫，报错直接说
                    <code>useCabContext must be used within a CabProvider</code> ——
                    <strong>把「忘了套 Provider」这个真正的原因摆在你脸上。</strong>
                  </p>
                  <p>
                    <strong>会追问：</strong>
                    「为什么不给 <code>createContext</code> 一个默认值？」——
                    给了默认值，忘套 Provider 时代码会
                    <strong>静默地用假数据跑下去</strong>，
                    你会以为功能坏了而不是配置错了。
                    <strong>不给默认值 + 守卫抛错，是让错误尽早暴露。</strong>
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    <strong>In one line:</strong> <code>createContext()</code> lays a
                    pipe, <code>Provider</code> pours a value into it, and any component
                    in the subtree reads it with <code>useContext</code> —{" "}
                    <strong>no prop drilling</strong>.
                  </p>
                  <p>
                    <strong>What each of the three parts is for:</strong>
                  </p>
                  <ul>
                    <li>
                      <strong><code>const CabContext = createContext()</code></strong> —
                      the pipe. Note the source project gives{" "}
                      <strong>no default value</strong>, so without a Provider{" "}
                      <code>useContext</code> returns <code>undefined</code>. That is
                      deliberate; see below.
                    </li>
                    <li>
                      <strong><code>CabProvider</code></strong> — an ordinary component.
                      Two <code>useState</code> calls hold the state, one function
                      changes it, and all three go into <code>value</code>.
                    </li>
                    <li>
                      <strong><code>useCabContext</code></strong> — a custom hook. It is
                      not just an alias for <code>useContext</code>;{" "}
                      <strong>it carries a guard</strong> that throws when there is
                      nothing to read.
                    </li>
                  </ul>
                  <p>
                    <strong>What that guard is protecting you from</strong> (the
                    highlighted lines 26&ndash;28 in the code below): without it, forgetting the Provider leaves <code>context</code> as{" "}
                    <code>undefined</code>, and then{" "}
                    <code>const {"{ rideHistory }"} = undefined</code> throws an{" "}
                    <strong>opaque destructuring error</strong> (
                    <code>Cannot destructure property ... of undefined</code>). With the
                    guard you get{" "}
                    <code>useCabContext must be used within a CabProvider</code> —{" "}
                    <strong>the actual cause, stated plainly.</strong>
                  </p>
                  <p>
                    <strong>Follow-up:</strong> &ldquo;Why not give{" "}
                    <code>createContext</code> a default value?&rdquo; — because then
                    forgetting the Provider makes the code{" "}
                    <strong>quietly run on fake data</strong>, and you go hunting for a
                    broken feature instead of a missing wrapper.{" "}
                    <strong>
                      No default plus a throwing guard makes the mistake surface
                      immediately.
                    </strong>
                  </p>
                </>
              ),
              code: [
                real("jsx", SRC_CONTEXT, {
                  filename: "src/context/CabContext.js（源项目原文 —— 注意扩展名）",
                  sourceFile: "cab-booking-context/src/context/CabContext.js",
                  highlight: [3, 26, 27, 28],
                }),
              ],
            },
            {
              id: "cb-where-provider",
              heading: "Provider 必须在 App 外面",
              headingEn: "The Provider must sit outside App",
              lede: "因为 App 自己就是一个消费者",
              ledeEn:
                "Because App itself is one of the readers",
              body: (
                <>
                  <p>
                    <strong>一句话：</strong>
                    <strong>一个组件读不到自己 return 里提供的 Context。</strong>
                    <code>useContext</code> 往<strong>上</strong>找 Provider，
                    不往下找。
                  </p>
                  <p>
                    <strong>为什么这道题特别容易死在这儿：</strong>看下面{" "}
                    <code>App</code> 的第 14 行 ——
                    <code>App</code> 自己调了 <code>useCabContext()</code>，
                    因为 <code>handleSelectCab</code> 需要
                    <code>updateBookedCabDetails</code>。
                    <strong>所以 App 是消费者，不是提供者。</strong>
                  </p>
                  <p>
                    <strong>如果你把 Provider 写进 App 的 return 里：</strong>
                    <code>App</code> 顶部那句 <code>useCabContext()</code>
                    在<strong>渲染 App 自己的时候</strong>就执行了，
                    那时候 Provider 还没挂上 —— <code>context</code> 是{" "}
                    <code>undefined</code>，
                    守卫立刻抛 <code>useCabContext must be used within a CabProvider</code>，
                    <strong>四个测试全红</strong>。
                  </p>
                  <p>
                    <strong>正确的层级：</strong>
                    <code>index.jsx</code> 里 <code>&lt;CabProvider&gt;</code>
                    包住 <code>&lt;App /&gt;</code>。
                    <strong>测试文件里也是同样的包法</strong> ——
                    这不是巧合，是它在告诉你 Provider 该在哪一层。
                  </p>
                  <p>
                    <strong>会追问：</strong>
                    「那 Provider 能不能再往上，包在 <code>StrictMode</code> 外面？」——
                    能，位置只要在所有消费者之上就行。
                    源项目放在 <code>StrictMode</code> 里面，
                    好处是<strong>开发模式下的双次渲染也会覆盖到 Provider</strong>，
                    能更早暴露副作用写在渲染里这类问题。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    <strong>In one line:</strong>{" "}
                    <strong>
                      a component cannot read a Context it provides in its own return.
                    </strong>{" "}
                    <code>useContext</code> looks <strong>up</strong> the tree for a
                    Provider, never down.
                  </p>
                  <p>
                    <strong>Why this question in particular punishes it:</strong> look at
                    line 14 of <code>App</code> below —{" "}
                    <code>App</code> calls <code>useCabContext()</code> itself, because{" "}
                    <code>handleSelectCab</code> needs{" "}
                    <code>updateBookedCabDetails</code>.{" "}
                    <strong>So App is a consumer, not the provider.</strong>
                  </p>
                  <p>
                    <strong>Put the Provider inside App&rsquo;s return</strong> and that{" "}
                    <code>useCabContext()</code> at the top of <code>App</code> runs{" "}
                    <strong>while App itself is rendering</strong>, before any Provider
                    is mounted. <code>context</code> is <code>undefined</code>, the guard
                    throws <code>useCabContext must be used within a CabProvider</code>,
                    and <strong>all four tests go red</strong>.
                  </p>
                  <p>
                    <strong>The right layering:</strong> in <code>index.jsx</code>,{" "}
                    <code>&lt;CabProvider&gt;</code> wraps <code>&lt;App /&gt;</code>.{" "}
                    <strong>The test file wraps it the same way</strong> — that is not a
                    coincidence, it is the test telling you where the Provider belongs.
                  </p>
                  <p>
                    <strong>Follow-up:</strong> &ldquo;Could the Provider go even higher,
                    outside <code>StrictMode</code>?&rdquo; — yes; it only has to sit
                    above every consumer. The source project keeps it inside{" "}
                    <code>StrictMode</code>, which means{" "}
                    <strong>
                      the development double-render covers the Provider too
                    </strong>{" "}
                    and surfaces things like effects written into render sooner.
                  </p>
                </>
              ),
              code: [
                real("jsx", SRC_INDEX, {
                  filename: "src/index.jsx（Provider 在 App 外面）",
                  sourceFile: "cab-booking-context/src/index.jsx",
                  highlight: [9, 10, 11],
                }),
                demo(
                  "jsx",
                  `// ✕ 反例：Provider 写在 App 内部
const App = () => {
  const [currentPage, setCurrentPage] = useState("home");
  const { updateBookedCabDetails } = useCabContext();   // ← 这一行先执行
                                                        //   此时下面那个 Provider 还没挂上
  return (
    <CabProvider>                                       {/* ← 太晚了 */}
      <div className="App">…</div>
    </CabProvider>
  );
};

// 实际报错：
// Error: useCabContext must be used within a CabProvider
// → 四个测试全红，而且报错指向 App，很容易以为是 App 写错了`,
                  { filename: "把 Provider 放错层级会怎样（示意）" },
                ),
              ],
            },
            {
              id: "cb-two-states",
              heading: "一个 action 同时改两个 state",
              headingEn: "One action changes two pieces of state",
              lede: "选一辆车 = 设为当前 + 追加进历史",
              ledeEn:
                "Picking a cab means two things: set it as the current booking, and add it to the history",
              body: (
                <>
                  <p>
                    <strong>一句话：</strong>
                    <code>updateBookedCabDetails(details)</code> 做两件事 ——
                    <strong>把这辆车设成「当前预订」</strong>，
                    <strong>并且把它追加进历史</strong>。
                  </p>
                  <p>
                    <strong>为什么这两件事必须在一个函数里：</strong>
                    如果让调用方自己调两次
                    （<code>setBookedCabDetails(cab)</code> 加{" "}
                    <code>setRideHistory(...)</code>），
                    那么<strong>「选车」这个业务动作就散在调用方了</strong> ——
                    以后加一条「同一辆车不重复记录」的规则，
                    你得去每个调用点改。
                    <strong>把动作包成一个函数，规则就只有一个地方。</strong>
                  </p>
                  <p>
                    <strong>Context 里最终暴露三样东西：</strong>
                  </p>
                  <ul>
                    <li>
                      <code>bookedCabDetails</code> —— 当前选中的车，
                      <code>CabConfirmation</code> 用它显示
                      &ldquo;X is on the way&rdquo;
                    </li>
                    <li>
                      <code>rideHistory</code> —— 全部记录，
                      <code>RideHistory</code> 用它取最新三条
                    </li>
                    <li>
                      <code>updateBookedCabDetails</code> —— 唯一的写入口，
                      <code>App</code> 用它
                    </li>
                  </ul>
                  <p>
                    <strong>注意消费者是散开的：</strong>
                    <code>App</code> 只要写、<code>CabConfirmation</code> 只要
                    <code>bookedCabDetails</code>、
                    <code>RideHistory</code> 只要 <code>rideHistory</code>。
                    <strong>三个组件各取所需，互相不知道对方存在</strong> ——
                    这就是用 Context 而不是 props 的收益。
                    用 props 的话，<code>rideHistory</code> 得从 App 一路传到
                    <code>Home</code> 再传到 <code>RideHistory</code>，
                    而 <code>Home</code> 自己根本不用它。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    <strong>In one line:</strong>{" "}
                    <code>updateBookedCabDetails(details)</code> does two things —{" "}
                    <strong>marks this cab as the current booking</strong> and{" "}
                    <strong>appends it to the history</strong>.
                  </p>
                  <p>
                    <strong>Why both belong in one function:</strong> if the caller had
                    to make two calls (<code>setBookedCabDetails(cab)</code> plus{" "}
                    <code>setRideHistory(...)</code>), then{" "}
                    <strong>
                      the business action &ldquo;pick a cab&rdquo; would live in the
                      callers
                    </strong>
                    . Add a rule later — say, do not log the same cab twice — and you
                    have to edit every call site.{" "}
                    <strong>One function, one place for the rule.</strong>
                  </p>
                  <p>
                    <strong>The Context ends up exposing three things:</strong>
                  </p>
                  <ul>
                    <li>
                      <code>bookedCabDetails</code> — the current cab;{" "}
                      <code>CabConfirmation</code> uses it for &ldquo;X is on the
                      way&rdquo;
                    </li>
                    <li>
                      <code>rideHistory</code> — every record;{" "}
                      <code>RideHistory</code> takes the newest three from it
                    </li>
                    <li>
                      <code>updateBookedCabDetails</code> — the only way to write;{" "}
                      <code>App</code> uses it
                    </li>
                  </ul>
                  <p>
                    <strong>Notice how spread out the consumers are:</strong>{" "}
                    <code>App</code> only writes, <code>CabConfirmation</code> only needs{" "}
                    <code>bookedCabDetails</code>, <code>RideHistory</code> only needs{" "}
                    <code>rideHistory</code>.{" "}
                    <strong>
                      Three components take what they need and know nothing about each
                      other
                    </strong>{" "}
                    — that is the payoff over props. With props,{" "}
                    <code>rideHistory</code> would have to travel from App through{" "}
                    <code>Home</code> into <code>RideHistory</code>, and{" "}
                    <code>Home</code> has no use for it at all.
                  </p>
                </>
              ),
              code: [
                real("jsx", SRC_APP, {
                  filename: "src/App.jsx（唯一的写入口在这里被调用）",
                  sourceFile: "cab-booking-context/src/App.jsx",
                  highlight: [14, 16, 17, 18, 19],
                }),
              ],
            },
          ],
          callouts: [
            {
              tone: "why",
              title: "为什么测试自己也包一层 Provider",
              body: (
                <>
                  测试里的 <code>renderApp()</code> 是
                  <code>render(&lt;CabProvider&gt;&lt;App /&gt;&lt;/CabProvider&gt;)</code>。
                  <strong>这是因为测试直接 render 的是 <code>App</code>，
                  不是 <code>index.jsx</code></strong> ——
                  <code>index.jsx</code> 那一层在测试里根本没被执行。
                  <br />
                  换个角度看：<strong>测试文件已经把答案告诉你了</strong> ——
                  它包了 Provider，说明 <code>App</code> 需要一个在它上面的 Provider。
                  读测试能读出结构，这是这道题送分的地方。
                </>
              ),
            },
          ],
          exercises: [
            {
              id: "cb-context-fill",
              kind: "fill-blank",
              level: 2,
              title: "补齐 Context 三件套",
              prompt: <>四个空。第 4 个空是这道题的守卫，写错了就等于没有守卫。</>,
              language: "jsx",
              filename: "src/context/CabContext.jsx",
              template: `import { createContext, useContext, useState } from "react";

const CabContext = ___1___();

const CabProvider = ({ children }) => {
  const [bookedCabDetails, setBookedCabDetails] = useState(null);
  const [rideHistory, setRideHistory] = useState([]);

  const updateBookedCabDetails = (details) => {
    setBookedCabDetails(details);
    setRideHistory(___2___);
  };

  return (
    <CabContext.___3___
      value={{ bookedCabDetails, updateBookedCabDetails, rideHistory }}
    >
      {children}
    </CabContext.___3___>
  );
};

const useCabContext = () => {
  const context = useContext(CabContext);

  if (___4___) {
    throw new Error("useCabContext must be used within a CabProvider");
  }

  return context;
};

export { CabProvider, useCabContext };`,
              blanks: [
                {
                  n: 1,
                  accept: ["createContext"],
                  hint: "从 react 里 import 的那个",
                  why: (
                    <>
                      <code>createContext()</code> 造管道。
                      源项目<strong>没传默认值</strong> ——
                      所以没套 Provider 时 <code>useContext</code> 返回{" "}
                      <code>undefined</code>，正好被第 4 个空的守卫抓住。
                    </>
                  ),
                },
                {
                  n: 2,
                  accept: [
                    "[...rideHistory, details]",
                    "(prev) => [...prev, details]",
                    "prev => [...prev, details]",
                  ],
                  hint: "追加一条，返回新数组",
                  why: (
                    <>
                      <strong>两种都接受，但它们不等价。</strong>
                      <br />
                      源项目写的是 <code>[...rideHistory, details]</code> ——
                      读的是闭包里那个 <code>rideHistory</code>。
                      <strong>同一个事件里连调两次会丢一条。</strong>
                      测试撞不到，因为每次订车之间都有完整的页面切换和重渲染。
                      <br />
                      <code>(prev) =&gt; [...prev, details]</code> 是函数式更新，
                      <strong>永远读到最新值</strong>，是更稳的写法。
                      第 3 部分会专门讲这个差别。
                      <br />
                      两种都不许用 <code>push</code> —— 那是原地修改，React 看不到变化。
                    </>
                  ),
                },
                {
                  n: 3,
                  accept: ["Provider"],
                  hint: "Context 对象上那个组件",
                  why: (
                    <>
                      <code>CabContext.Provider</code>。
                      <code>value</code> 就是子树里 <code>useContext</code> 能拿到的东西。
                      <br />
                      注意开标签和闭标签是<strong>同一个空</strong> ——
                      写 <code>&lt;CabContext.Provider&gt;…&lt;/CabContext&gt;</code>
                      这种不闭合的会直接编译不过。
                    </>
                  ),
                },
                {
                  n: 4,
                  accept: ["!context", "context === undefined", "!ctx"],
                  hint: "拿不到的时候是什么值？",
                  why: (
                    <>
                      没套 Provider 时 <code>useContext</code> 返回{" "}
                      <code>undefined</code>，所以 <code>!context</code> 为真、抛错。
                      <br />
                      <strong>守卫的价值在于把报错换成人话。</strong>
                      没有它，你会看到{" "}
                      <code>Cannot destructure property &apos;rideHistory&apos; of
                      undefined</code>
                      ，然后去查 <code>rideHistory</code> —— 而真正的原因是
                      「忘了套 Provider」。
                    </>
                  ),
                },
              ],
            },
            {
              id: "cb-context-write",
              kind: "code-completion",
              level: 3,
              title: "从签名写出整个 CabContext",
              prompt: (
                <>
                  只给你 import 和导出。三件套自己写出来，
                  包括那个守卫。检查器会查守卫、查不可变更新、
                  以及<strong>不许用 push</strong>。
                </>
              ),
              language: "jsx",
              filename: "src/context/CabContext.jsx",
              starter: `import { createContext, useContext, useState } from "react";

// 要求：
// 1. 造 Context，不给默认值
// 2. CabProvider 存两个 state：bookedCabDetails（初始 null）、rideHistory（初始 []）
// 3. updateBookedCabDetails(details)：设为当前车 + 追加进历史（不可变更新）
// 4. useCabContext()：读 context，拿不到就抛
//    "useCabContext must be used within a CabProvider"
// 5. 导出 CabProvider 和 useCabContext

`,
              requirements: [
                "createContext() 不传默认值 —— 这样没套 Provider 时是 undefined，守卫才抓得住",
                "两个 state：bookedCabDetails 初始 null、rideHistory 初始 []",
                "updateBookedCabDetails 同时改两个 state，历史用不可变更新（展开运算符），不许 push",
                "useCabContext 里有 if 守卫 + throw，错误信息要出现 CabProvider",
                "命名导出 CabProvider 和 useCabContext",
              ],
              checks: [
                {
                  label: "createContext 没传默认值",
                  must: "createContext\\(\\s*\\)",
                },
                {
                  label: "两个 useState，初值分别是 null 和 []",
                  must: "useState\\(null\\)[\\s\\S]*useState\\(\\[\\]\\)",
                },
                {
                  label: "历史是不可变追加（展开运算符）",
                  must: "\\.\\.\\.(rideHistory|prev)\\s*,",
                },
                {
                  label: "没有用 push（那是原地修改，React 看不到）",
                  mustNot: "\\.push\\(",
                },
                {
                  label: "守卫抛错，信息里有 CabProvider",
                  must: "throw new Error\\([^)]*CabProvider",
                },
                {
                  label: "导出了 CabProvider 和 useCabContext",
                  must: "export\\s*\\{[^}]*CabProvider[^}]*useCabContext[^}]*\\}",
                },
              ],
              hints: [
                "三件套的顺序：createContext → Provider 组件 → 自定义 hook。想清楚每一件谁依赖谁。",
                "Provider 是个普通组件，收 { children }，return 一个 <CabContext.Provider value={...}>{children}</CabContext.Provider>。",
                "updateBookedCabDetails 里两句 set：一句 setBookedCabDetails(details)，一句 setRideHistory 追加。追加要造新数组。",
                "守卫：const context = useContext(CabContext); if (!context) throw new Error(\"useCabContext must be used within a CabProvider\"); return context;",
              ],
              solution: real("jsx", SRC_CONTEXT, {
                filename: "src/context/CabContext.jsx（参考答案 —— 源项目原文，仅改扩展名）",
                sourceFile: "cab-booking-context/src/context/CabContext.js",
              }),
            },
          ],
          mistakes: [
            {
              wrong: demo(
                "jsx",
                `// ✕ 用 push 追加 —— React 看不到变化
const updateBookedCabDetails = (details) => {
  setBookedCabDetails(details);
  rideHistory.push(details);        // 原地改了同一个数组
  setRideHistory(rideHistory);      // 传的还是同一个引用
};`,
                { filename: "原地修改" },
              ),
              why: (
                <>
                  <code>push</code> 改的是<strong>同一个数组对象</strong>，
                  <code>setRideHistory(rideHistory)</code> 传进去的引用没变 ——
                  React 用 <code>Object.is</code> 比较新旧 state，
                  <strong>发现一样就跳过重渲染</strong>。
                  <br />
                  症状很迷惑：数据其实变了，但界面不更新；
                  然后某次别的 state 变化触发重渲染，历史突然一次冒出好几条。
                  <strong>必须造新数组：<code>[...rideHistory, details]</code>。</strong>
                </>
              ),
              whyEn: (
                <>
                  <code>push</code> changes <strong>the same array object</strong>, so the
                  reference given to <code>setRideHistory(rideHistory)</code> has not changed.
                  React compares old and new state with <code>Object.is</code> and{" "}
                  <strong>skips the re-render when they are equal</strong>.
                  <br />
                  The symptom is confusing: the data really did change, but the screen does not
                  update. Then some other state change causes a re-render and several history rows
                  appear at once.{" "}
                  <strong>
                    You have to build a new array: <code>[...rideHistory, details]</code>.
                  </strong>
                </>
              ),
            },
            {
              wrong: demo(
                "jsx",
                `// ✕ 守卫写成了默认值兜底 —— 错误被藏起来了
const useCabContext = () => {
  const context = useContext(CabContext);
  return context ?? { rideHistory: [], bookedCabDetails: null };
};`,
                { filename: "把守卫改成兜底" },
              ),
              why: (
                <>
                  这样忘套 Provider 时不会报错，
                  <strong>页面会静默地显示「没有历史记录」</strong>。
                  你会去查 <code>RideHistory</code> 为什么不显示数据，
                  而真正的原因在 <code>index.jsx</code>。
                  <br />
                  <strong>守卫的意义就是让配置错误在第一时间炸出来，
                  而不是伪装成功能 bug。</strong>
                  这一条面试常问，本站「主题切换（Context + value 记忆化）」
                  那道题也考同一个点。
                </>
              ),
              whyEn: (
                <>
                  With this version, forgetting the Provider produces no error. The page{" "}
                  <strong>quietly shows &ldquo;no ride history&rdquo;</strong>. You will go and look
                  at why <code>RideHistory</code> shows no data, while the real cause is in{" "}
                  <code>index.jsx</code>.
                  <br />
                  <strong>
                    The whole point of the guard is to make a setup mistake fail at once, instead of
                    looking like a bug in a feature.
                  </strong>{" "}
                  Interviewers ask about this often, and the theme switching task on this site
                  (Context plus a memoised value) tests the same point.
                </>
              ),
            },
          ],
          transfer: [
            { signal: "组件读不到自己提供的 Context", reachFor: "useContext 往上找 —— Provider 必须在消费者之上" },
            { signal: "测试文件自己包了一层 Provider", reachFor: "那是在告诉你 Provider 该在哪一层" },
            { signal: "「Cannot destructure property of undefined」", reachFor: "十有八九是忘了套 Provider" },
            { signal: "一个业务动作要改两个 state", reachFor: "包成 Context 里的一个函数，别让调用方调两次" },
          ],
          recap: [
            "Context 三件套：createContext 造管道、Provider 灌值、自定义 hook 取值 + 守卫。",
            "Provider 必须在 App 外面 —— App 自己就是消费者（handleSelectCab 要写入）。",
            "createContext 不给默认值 + 守卫抛错，是为了让「忘套 Provider」立刻暴露。",
            "updateBookedCabDetails 一次改两个 state，业务规则集中在一处。",
            "追加历史必须造新数组，push 会让 React 跳过重渲染。",
          ],
          recapEn: [
            "The three parts of Context: createContext makes the channel, the Provider supplies the value, and the custom hook reads it and guards against a missing Provider.",
            "The Provider must sit outside App, because App is a reader itself: handleSelectCab writes to the Context.",
            "Calling createContext with no default value, plus a guard that throws, makes a forgotten Provider show up immediately.",
            "updateBookedCabDetails changes two pieces of state in one call, which keeps the rule in one place.",
            "Adding to the history has to build a new array; push makes React skip the re-render.",
          ],
        },
      ],
    },
    /* ============================================================
       第 2 部分 —— 四个页面串起来
       ============================================================ */
    {
      id: "cab-pages",
      title: "四个页面串起来：状态机、分组、一秒延迟",
      titleEn: "Connecting the four pages: the state machine, grouping, and the one-second delay",
      summary:
        "没有路由，一个 currentPage state 管四个页面。这一部分把页面写出来，顺便撞上两个老考点：effect 的清理函数、和「取最新三条」的数组操作。",
      summaryEn:
        "No router: a single currentPage state controls four pages. This part builds the pages, and it also covers two points that come up again and again: the cleanup function of an effect, and the array operation that takes the three newest items.",
      stage: "Cab Booking · 第 2 部分",
      lessons: [
        {
          id: "cb-page-machine",
          title: "用一个 state 管四个页面",
          titleEn: "Controlling four pages with one piece of state",
          blurb: "没有 react-router。currentPage 是个字符串状态机，四个 && 决定谁显示。",
          blurbEn:
            "There is no react-router. currentPage is a string state machine, and four && checks decide which page shows.",
          minutes: 15,
          objectives: [
            "用一个 currentPage state 管四个页面",
            "说清 && 条件渲染和三元的区别，以及为什么这里用 &&",
            "知道为什么 handleSelectCab 必须写在 App 里，而不是 CabCard 里",
            "看懂四个页面之间的转移图",
          ],
          objectivesEn: [
            "Control four pages with a single currentPage state",
            "Explain the difference between && and a ternary in conditional rendering, and why && fits here",
            "Know why handleSelectCab has to live in App and not in CabCard",
            "Read the transition diagram between the four pages",
          ],
          whyForAssessment:
            "题目没给路由，所以你得自己决定「页面」怎么表示。写成四个 boolean（isHome / isLoading …）能跑，但两个同时为 true 时会同时渲染两个页面，测试 3 的 getByTestId 会因为找到多个而抛错。一个字符串 state 从根上排除了这种状态。",
          whyForAssessmentEn:
            "The task gives you no router, so you have to decide how a page is represented. Four booleans (isHome, isLoading and so on) can work, but when two of them are true at the same time two pages render together, and the getByTestId in test 3 throws because it finds more than one match. A single string state rules that situation out from the start.",
          sourceFiles: [
            { path: "cab-booking-context/src/App.jsx", role: "状态机本体，四个页面的开关都在这里", edit: true },
            { path: "cab-booking-context/src/components/Home/Home.jsx", role: "首页，把 onBookClick 往上抛" },
          ],
          concepts: [
            {
              id: "cb-state-machine",
              heading: "四个页面 = 一个字符串 state",
              headingEn: "Four pages, one string state",
              lede: "转移图画出来，代码就是照抄",
              ledeEn:
                "Draw the transition diagram and the code just copies it",
              body: (
                <>
                  <p>
                    <strong>一句话：</strong>
                    <code>currentPage</code> 只可能是四个字符串之一，
                    每个页面用 <code>&&</code> 判断自己该不该出现。
                  </p>
                  <p>
                    <strong>先画转移图：</strong>
                  </p>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>当前</th>
                          <th>触发</th>
                          <th>去哪</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><code>home</code></td>
                          <td>点 <code>book-button</code></td>
                          <td><code>cab-options</code></td>
                        </tr>
                        <tr>
                          <td><code>cab-options</code></td>
                          <td>点某张卡的 Select</td>
                          <td><code>loading</code>（同时写入 Context）</td>
                        </tr>
                        <tr>
                          <td><code>loading</code></td>
                          <td>1 秒后自动</td>
                          <td><code>cab-confirmation</code></td>
                        </tr>
                        <tr>
                          <td><code>cab-confirmation</code></td>
                          <td>点 <code>confirm-button</code></td>
                          <td><code>home</code></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    <strong>四条转移，四个回调。</strong>代码里就是四个
                    <code>setCurrentPage(...)</code>，
                    分别通过 <code>onBookClick</code> / <code>onSelectCab</code> /
                    <code>onComplete</code> / <code>onConfirm</code> 传下去。
                    <strong>子组件一个都不知道「页面」这回事</strong> ——
                    它们只知道自己有个回调要调。
                  </p>
                  <p>
                    <strong>为什么用 <code>&&</code> 而不是三元：</strong>
                    这里是「四选一」，用嵌套三元会变成
                    <code>a ? X : b ? Y : c ? Z : W</code>，
                    读起来累而且加第五个页面要改结构。
                    四个平行的 <code>&&</code> 一行一个页面，
                    <strong>加页面就加一行</strong>。
                  </p>
                  <p>
                    <strong>会追问：</strong>「为什么不用四个 boolean？」——
                    因为 boolean 允许非法状态。
                    <code>isLoading</code> 和 <code>isHome</code> 同时为 true
                    时页面上会有两个 <code>&lt;main&gt;</code>，
                    <code>getByTestId</code> 找到多个直接抛错。
                    <strong>用一个字符串，非法状态在类型层面就不存在</strong> ——
                    这个思路叫「让不可能的状态无法表示」。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    <strong>In one line:</strong> <code>currentPage</code> can only be one
                    of four strings, and each page uses <code>&&</code> to decide whether
                    it should show.
                  </p>
                  <p>
                    <strong>Draw the transition table first:</strong>
                  </p>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>From</th>
                          <th>Trigger</th>
                          <th>To</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><code>home</code></td>
                          <td>click <code>book-button</code></td>
                          <td><code>cab-options</code></td>
                        </tr>
                        <tr>
                          <td><code>cab-options</code></td>
                          <td>click a card&rsquo;s Select</td>
                          <td><code>loading</code> (and write to Context)</td>
                        </tr>
                        <tr>
                          <td><code>loading</code></td>
                          <td>automatic after 1s</td>
                          <td><code>cab-confirmation</code></td>
                        </tr>
                        <tr>
                          <td><code>cab-confirmation</code></td>
                          <td>click <code>confirm-button</code></td>
                          <td><code>home</code></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    <strong>Four transitions, four callbacks.</strong> In code that is
                    four <code>setCurrentPage(...)</code> calls, handed down as{" "}
                    <code>onBookClick</code> / <code>onSelectCab</code> /{" "}
                    <code>onComplete</code> / <code>onConfirm</code>.{" "}
                    <strong>No child component knows that &ldquo;pages&rdquo; exist</strong>{" "}
                    — each one only knows it has a callback to fire.
                  </p>
                  <p>
                    <strong>Why <code>&&</code> and not a ternary:</strong> this is
                    one-of-four. Nested ternaries turn into{" "}
                    <code>a ? X : b ? Y : c ? Z : W</code>, which is tiring to read and
                    has to be restructured to add a fifth page. Four parallel{" "}
                    <code>&&</code> lines give you one line per page, so{" "}
                    <strong>adding a page means adding a line</strong>.
                  </p>
                  <p>
                    <strong>Follow-up:</strong> &ldquo;Why not four booleans?&rdquo; —
                    because booleans permit illegal states. With{" "}
                    <code>isLoading</code> and <code>isHome</code> both true the page has
                    two <code>&lt;main&gt;</code> elements, and{" "}
                    <code>getByTestId</code> throws when it matches more than one.{" "}
                    <strong>
                      One string means the illegal state cannot be represented at all
                    </strong>{" "}
                    — the &ldquo;make impossible states unrepresentable&rdquo; idea.
                  </p>
                </>
              ),
              code: [
                real("jsx", SRC_APP, {
                  filename: "src/App.jsx（四个 && 就是状态机）",
                  sourceFile: "cab-booking-context/src/App.jsx",
                  highlight: [25, 29, 33, 37],
                }),
              ],
            },
            {
              id: "cb-lift-handler",
              heading: "为什么 handleSelectCab 在 App 里",
              headingEn: "Why handleSelectCab lives in App",
              lede: "因为它要同时干两件事，而其中一件只有 App 知道",
              ledeEn:
                "Because it has to do two things at once, and only App can do one of them",
              body: (
                <>
                  <p>
                    <strong>一句话：</strong>选一辆车要
                    <strong>写 Context</strong> 加 <strong>切页面</strong>，
                    而「切页面」这件事只有 <code>App</code> 做得到 ——
                    <code>currentPage</code> 在它手里。
                  </p>
                  <p>
                    <strong>换个问法：<code>CabCard</code> 能不能自己调
                    <code>updateBookedCabDetails</code>？</strong>
                    技术上能 —— 它也在 Provider 底下，
                    <code>useCabContext()</code> 一样能用。
                    但它<strong>没法切页面</strong>，
                    所以还是得往上抛一个回调。
                    <strong>既然回调躲不掉，就把两件事都放在回调里</strong>，
                    别拆成「Card 写数据 + App 切页面」两半。
                  </p>
                  <p>
                    <strong>拆成两半会出什么问题：</strong>「选车」这个动作变成
                    两个组件配合完成的，
                    <strong>顺序和完整性没人保证</strong> ——
                    以后有人在 <code>CabCard</code> 里加个提前 return，
                    就会出现「页面切了但 Context 没写」，
                    确认页显示 <code>undefined is on the way</code>。
                  </p>
                  <p>
                    <strong>看 <code>CabCard</code> 有多干净：</strong>
                    它只有 <code>onClick={"{() => onSelectCab(cab)}"}</code>，
                    <strong>完全不知道 Context 存在，也不知道有页面这回事</strong>。
                    这种组件最好测、最好复用。
                  </p>
                  <p>
                    <strong>会追问：</strong>「这不就是状态提升（lifting state up）吗？」——
                    对。<strong>规则是：状态放在所有需要它的组件的最近公共祖先。</strong>
                    <code>currentPage</code> 四个页面都要用，
                    公共祖先就是 <code>App</code>；
                    <code>rideHistory</code> 的消费者跨了三层，
                    提升到 <code>App</code> 还得往下传，
                    所以它去了 Context。
                    <strong>两种手段解决的是同一个问题，只是距离不同。</strong>
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    <strong>In one line:</strong> picking a cab has to{" "}
                    <strong>write to Context</strong> and{" "}
                    <strong>switch the page</strong>, and only <code>App</code> can do the
                    second one — <code>currentPage</code> lives there.
                  </p>
                  <p>
                    <strong>
                      Put it another way: could <code>CabCard</code> call{" "}
                      <code>updateBookedCabDetails</code> itself?
                    </strong>{" "}
                    Technically yes — it is under the Provider too, so{" "}
                    <code>useCabContext()</code> works. But it{" "}
                    <strong>cannot switch the page</strong>, so it still needs to hand a
                    callback upward.{" "}
                    <strong>
                      Since the callback is unavoidable, put both jobs inside it
                    </strong>{" "}
                    rather than splitting into &ldquo;Card writes data, App switches
                    page&rdquo;.
                  </p>
                  <p>
                    <strong>What splitting costs you:</strong> &ldquo;pick a cab&rdquo;
                    becomes an action two components perform together, and{" "}
                    <strong>nothing guarantees order or completeness</strong>. Somebody
                    adds an early return in <code>CabCard</code> later and you get
                    &ldquo;page switched but Context never written&rdquo;, so the
                    confirmation page reads{" "}
                    <code>undefined is on the way</code>.
                  </p>
                  <p>
                    <strong>Notice how clean <code>CabCard</code> is:</strong> it only has{" "}
                    <code>onClick={"{() => onSelectCab(cab)}"}</code> and{" "}
                    <strong>
                      knows nothing about Context and nothing about pages
                    </strong>
                    . That is the easiest kind of component to test and to reuse.
                  </p>
                  <p>
                    <strong>Follow-up:</strong> &ldquo;Isn&rsquo;t this just lifting state
                    up?&rdquo; — yes.{" "}
                    <strong>
                      The rule is: state belongs in the closest common ancestor of every
                      component that needs it.
                    </strong>{" "}
                    All four pages need <code>currentPage</code>, and their common
                    ancestor is <code>App</code>. The consumers of{" "}
                    <code>rideHistory</code> sit three levels apart, so lifting it to{" "}
                    <code>App</code> would still mean drilling it down — which is why it
                    went into Context instead.{" "}
                    <strong>
                      Both tools solve the same problem; they differ in distance.
                    </strong>
                  </p>
                </>
              ),
              code: [
                real("jsx", SRC_HOME, {
                  filename: "src/components/Home/Home.jsx（只往上抛回调）",
                  sourceFile: "cab-booking-context/src/components/Home/Home.jsx",
                  highlight: [15],
                }),
              ],
            },
          ],
          callouts: [
            {
              tone: "note",
              title: "RideHistory 在首页里，不是独立页面",
              body: (
                <>
                  <code>Home</code> 的最后一行是 <code>&lt;RideHistory /&gt;</code>。
                  所以测试 1 能在首页直接查 <code>no-ride-title</code>，
                  测试 3 / 4 点完确认回到首页也能直接查 <code>history-cabs</code> ——
                  <strong>不用再点一次「查看历史」</strong>。
                  <br />
                  顺带注意 <code>Home</code> <strong>自己不用 Context</strong>，
                  它只是把 <code>RideHistory</code> 放进去。
                  历史数据从 Context 直接流进 <code>RideHistory</code>，
                  <strong>不经过 <code>Home</code></strong> —— 这就是不用 props 的收益。
                </>
              ),
            },
          ],
          exercises: [
            {
              id: "cb-flow-order",
              kind: "ordering",
              level: 1,
              title: "把一次完整预订的六步排好",
              prompt: <>从点「Book a Cab」到历史里出现记录，中间发生了什么？按顺序排。</>,
              items: [
                { id: "s1", label: "setCurrentPage(\"cab-options\")" },
                { id: "s2", label: "updateBookedCabDetails(cab) —— 写 Context 的两个 state" },
                { id: "s3", label: "setCurrentPage(\"loading\")" },
                { id: "s4", label: "Loading 的 useEffect 里 setTimeout 1000ms 到期" },
                { id: "s5", label: "onComplete() → setCurrentPage(\"cab-confirmation\")" },
                { id: "s6", label: "onConfirm() → setCurrentPage(\"home\")，首页读到新的 rideHistory" },
              ],
              answer: ["s1", "s2", "s3", "s4", "s5", "s6"],
              explain: (
                <>
                  <strong>第 2 步和第 3 步的顺序值得看一眼。</strong>
                  <code>handleSelectCab</code> 里是先
                  <code>updateBookedCabDetails(cab)</code> 再
                  <code>setCurrentPage(&quot;loading&quot;)</code>。
                  <br />
                  <strong>但实际上这两句谁先谁后都不影响结果</strong> ——
                  React 会把同一个事件里的多个 setState
                  <strong>批处理（batching）</strong>成一次重渲染，
                  所以中间不存在「Context 已写但页面还没切」的可渲染状态。
                  <br />
                  写成先写数据再切页，是给<strong>人</strong>看的顺序：
                  数据先准备好，再让界面往前走。
                  <br />
                  <strong>第 6 步是关键：</strong>回到首页时
                  <code>RideHistory</code> 重新挂载，
                  从 Context 里读到了已经更新的 <code>rideHistory</code> ——
                  <strong>它不需要任何人通知它</strong>。
                </>
              ),
            },
            {
              id: "cb-app-fill",
              kind: "fill-blank",
              level: 2,
              title: "补齐 App 的状态机",
              prompt: <>五个空。注意第 4 个空是这道题最容易写反的地方。</>,
              language: "jsx",
              filename: "src/App.jsx",
              template: `const App = () => {
  const [currentPage, setCurrentPage] = useState(___1___);
  const { ___2___ } = useCabContext();

  const handleSelectCab = (cab) => {
    ___3___(cab);
    setCurrentPage("loading");
  };

  return (
    <div className="App">
      <AppHeader title={title} />

      {currentPage === "home" && (
        <Home onBookClick={() => setCurrentPage("cab-options")} />
      )}

      {currentPage === "cab-options" && (
        <CabOptions onSelectCab={___4___} />
      )}

      {currentPage === "loading" && (
        <Loading onComplete={() => setCurrentPage("cab-confirmation")} />
      )}

      {currentPage === "cab-confirmation" && (
        <CabConfirmation onConfirm={() => ___5___} />
      )}
    </div>
  );
};`,
              blanks: [
                {
                  n: 1,
                  accept: ["\"home\"", "'home'"],
                  hint: "测试 1 一上来就查首页",
                  why: (
                    <>
                      初始页必须是 <code>home</code> —— 测试 1 <code>render</code>
                      之后直接查 <code>book-button</code>，
                      没有任何点击动作。
                      <strong>初始值写错，四个测试全红</strong>，
                      因为后面三个测试第一步都是点 <code>book-button</code>。
                    </>
                  ),
                },
                {
                  n: 2,
                  accept: ["updateBookedCabDetails"],
                  hint: "App 只需要写，不需要读",
                  why: (
                    <>
                      <code>App</code> 是<strong>只写</strong>的消费者 ——
                      它不显示车名也不显示历史。
                      <br />
                      顺带一个习惯：<strong>只解构你真正要用的</strong>。
                      写成 <code>const ctx = useCabContext()</code> 然后到处
                      <code>ctx.xxx</code> 也能跑，但读代码的人得翻遍整个组件
                      才知道它用了 Context 的哪几样东西。
                    </>
                  ),
                },
                {
                  n: 3,
                  accept: ["updateBookedCabDetails"],
                  hint: "和第 2 个空同一个函数",
                  why: (
                    <>
                      一句就够 —— 它内部已经同时改了
                      <code>bookedCabDetails</code> 和 <code>rideHistory</code>。
                      <br />
                      <strong>如果你在这里又补一句
                      <code>setRideHistory</code>，历史会多出一条重复记录</strong>，
                      测试 4 数出来 4 条而不是 3 条。
                    </>
                  ),
                },
                {
                  n: 4,
                  accept: ["handleSelectCab"],
                  hint: "传函数本身，不是调用它",
                  why: (
                    <>
                      <strong>这里写 <code>handleSelectCab</code>，
                      不是 <code>handleSelectCab()</code>。</strong>
                      加括号就变成「渲染时立刻执行」——
                      <code>cab</code> 是 <code>undefined</code>，
                      历史里立刻多一条空记录，
                      而且 <code>setCurrentPage</code> 在渲染中被调用会触发
                      <strong>无限重渲染</strong>。
                      <br />
                      也不用写成 <code>{"(cab) => handleSelectCab(cab)"}</code> ——
                      参数一模一样地转手一遍，多包一层没有收益。
                      <strong>只有需要「补参数」时才包箭头函数</strong>，
                      比如上面那几个 <code>{"() => setCurrentPage(\"...\")"}</code>。
                    </>
                  ),
                },
                {
                  n: 5,
                  accept: ["setCurrentPage(\"home\")", "setCurrentPage('home')"],
                  hint: "点完确认回哪儿？",
                  why: (
                    <>
                      回首页。<strong>测试 3 和 4 都依赖这一条</strong> ——
                      它们点完 <code>confirm-button</code> 之后
                      直接查 <code>history-cabs</code>，
                      而历史是在首页里的。
                      <br />
                      测试 4 更狠：它连订四辆，
                      <strong>每一轮都要能从确认页回到首页再点一次
                      <code>book-button</code></strong>。
                      这一条写错，测试 4 第二轮就找不到按钮了。
                    </>
                  ),
                },
              ],
            },
          ],
          mistakes: [
            {
              wrong: demo(
                "jsx",
                `// ✕ 用四个 boolean 表示页面
const [isHome, setIsHome] = useState(true);
const [isOptions, setIsOptions] = useState(false);
const [isLoading, setIsLoading] = useState(false);
const [isConfirm, setIsConfirm] = useState(false);

const handleSelectCab = (cab) => {
  updateBookedCabDetails(cab);
  setIsLoading(true);          // 忘了 setIsOptions(false)
};

// 结果：cab-options 和 loading 同时渲染
// 测试 3：getByTestId("loading") 能过
// 但如果两个页面里有同名 testid，就会报
// "Found multiple elements by: [data-testid=...]"`,
                { filename: "四个 boolean 的下场（示意）" },
              ),
              why: (
                <>
                  四个 boolean 有 <strong>16 种组合</strong>，其中只有 4 种是合法的。
                  每次切页你得记住「开一个、关一个」，
                  <strong>漏关一个就出现两个页面同时在屏幕上</strong>。
                  <br />
                  一个字符串 state 只有 4 种取值，
                  <code>setCurrentPage(&quot;loading&quot;)</code>
                  <strong>天然就把别的页面关掉了</strong>。
                  这不是「写法更漂亮」，是把一整类 bug 从可能变成不可能。
                </>
              ),
              whyEn: (
                <>
                  Four booleans have <strong>16 combinations</strong>, and only 4 of them are
                  valid. On every page change you have to remember to turn one on and one off, and{" "}
                  <strong>if you forget one, two pages are on the screen at the same time</strong>.
                  <br />
                  A single string state has only 4 possible values, so{" "}
                  <code>setCurrentPage(&quot;loading&quot;)</code>{" "}
                  <strong>turns the other pages off by itself</strong>. This is not about code that
                  reads better. It moves a whole class of bug from possible to impossible.
                </>
              ),
            },
          ],
          transfer: [
            { signal: "几个界面互斥地出现", reachFor: "一个字符串 state + 若干 &&，别用多个 boolean" },
            { signal: "一个动作要改状态又要切界面", reachFor: "把两件事包进同一个 handler，放在拥有界面状态的那一层" },
            { signal: "子组件需要触发父组件的状态变化", reachFor: "父组件传回调下去，子组件不碰父的 state" },
            { signal: "onClick 里想传参数", reachFor: "() => fn(arg)；参数不变就直接传 fn，别多包一层" },
          ],
          recap: [
            "四个页面用一个 currentPage 字符串管，四个 && 各判一次。",
            "先画转移表：四条转移就是四个回调，代码照抄。",
            "handleSelectCab 放在 App 里，因为「切页面」只有 App 做得到。",
            "onSelectCab={handleSelectCab} 不能加括号 —— 加了会在渲染时执行并无限重渲染。",
            "RideHistory 挂在首页里，所以点完确认回首页就能看到新记录。",
          ],
          recapEn: [
            "One currentPage string controls the four pages, with one && check for each.",
            "Draw the transition table first: the four transitions become four callbacks, and the code follows the table.",
            "handleSelectCab goes in App, because only App can change the page.",
            "onSelectCab={handleSelectCab} must have no parentheses. With them the function runs during render and the component re-renders without end.",
            "RideHistory sits on the home page, so when you confirm and come back home the new entry is there.",
          ],
        },
        {
          id: "cb-options-grid",
          title: "按类型分组渲染六张卡",
          titleEn: "Rendering the six cards grouped by type",
          blurb: "两层 map：外层 Object.keys 出三个类型，内层出每组的车。key 有个坑。",
          blurbEn:
            "Two nested maps: Object.keys gives the three types on the outside, the cabs of each group on the inside. The key needs care.",
          minutes: 13,
          objectives: [
            "用 Object.keys + 两层 map 把分组数据渲染出来",
            "说清为什么分组顺序不用自己排",
            "写出 CabCard 的五个 data-testid",
            "知道为什么 ride.id 单独做 key 在历史列表里不安全",
          ],
          objectivesEn: [
            "Render grouped data with Object.keys and two nested maps",
            "Explain why you do not have to sort the group order yourself",
            "Write the five data-testid values of CabCard",
            "Know why ride.id on its own is not a safe key in the history list",
          ],
          whyForAssessment:
            "测试 2 一次查九个断言：一个容器、三个分组标题（有序）、五种卡片字段各 6 个。这一节把这九个断言一次性满足。分组顺序是送分题 —— 老实用 Object.keys 就对了，自己排序反而会错。",
          whyForAssessmentEn:
            "Test 2 checks nine things at once: one container, three group headings in order, and 6 of each of the five card fields. This lesson satisfies all nine together. The group order is a free point: use Object.keys as it comes and you are right, while sorting it yourself makes it wrong.",
          sourceFiles: [
            { path: "cab-booking-context/src/data/data.json", role: "三组六辆车，键顺序 Sedan → SUV → Luxury" },
            { path: "cab-booking-context/src/components/CabOptions/CabOptions.jsx", role: "外层分组", edit: true },
            { path: "cab-booking-context/src/components/CabOptions/CabCard.jsx", role: "五个字段都在这里", edit: true },
          ],
          concepts: [
            {
              id: "cb-group-map",
              heading: "Object.keys 加两层 map",
              headingEn: "Object.keys plus two nested maps",
              lede: "数据长什么样，代码就长什么样",
              ledeEn:
                "The shape of the code follows the shape of the data",
              body: (
                <>
                  <p>
                    <strong>一句话：</strong><code>data.json</code>
                    是「类型 → 车数组」的对象，所以外层遍历键、内层遍历值。
                  </p>
                  <p>
                    <strong>数据形状：</strong>
                  </p>
                  <ul>
                    <li>
                      顶层是一个对象，三个键：
                      <code>Sedan</code> / <code>SUV</code> / <code>Luxury</code>
                    </li>
                    <li>每个键的值是一个数组，各 2 辆车</li>
                    <li>
                      每辆车有 <code>id</code> / <code>name</code> /{" "}
                      <code>type</code> / <code>price</code> / <code>image</code>
                    </li>
                  </ul>
                  <p>
                    <strong>所以 3 × 2 = 6 张卡</strong> ——
                    测试 2 里那五个 <code>toHaveLength(6)</code> 就是这么来的。
                  </p>
                  <p>
                    <strong>分组顺序是送分题：</strong>
                    <code>Object.keys()</code> 返回的字符串键顺序，
                    在现代 JS 里<strong>就是它们被写进对象的顺序</strong>
                    （这是 ES2015 起明确规定的，不是巧合）。
                    <code>data.json</code> 里写的是 Sedan → SUV → Luxury，
                    所以 <code>Object.keys(cabData)</code> 出来就是这个顺序，
                    正好对上测试 2 的 <code>toEqual</code>。
                  </p>
                  <p>
                    <strong>反而是「我来排个序」会把它弄坏：</strong>
                    <code>.sort()</code> 出来是字典序
                    <code>Luxury → SUV → Sedan</code>，直接红。
                    <strong>这一条的道理是：数据已经有意义的顺序时，别再加工。</strong>
                  </p>
                  <p>
                    <strong>会追问：</strong>
                    「<code>Object.keys</code> 的顺序真的可靠吗？」——
                    对字符串键可靠，插入顺序。
                    但<strong>纯数字键会被排到最前面并按数值升序</strong>
                    （<code>{"{ \"2\": …, \"10\": …, \"a\": … }"}</code>
                    出来是 <code>2, 10, a</code>）。
                    这道题的键都是单词，撞不到；
                    但如果分组键是年份或编号，就得自己维护一个顺序数组。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    <strong>In one line:</strong> <code>data.json</code> is a &ldquo;type
                    to array of cars&rdquo; object, so the outer loop walks the keys and
                    the inner loop walks the values.
                  </p>
                  <p>
                    <strong>The shape of the data:</strong>
                  </p>
                  <ul>
                    <li>
                      Top level is an object with three keys:{" "}
                      <code>Sedan</code> / <code>SUV</code> / <code>Luxury</code>
                    </li>
                    <li>Each key holds an array of 2 cars</li>
                    <li>
                      Each car has <code>id</code> / <code>name</code> /{" "}
                      <code>type</code> / <code>price</code> / <code>image</code>
                    </li>
                  </ul>
                  <p>
                    <strong>So 3 × 2 = 6 cards</strong> — that is where the five{" "}
                    <code>toHaveLength(6)</code> assertions in test 2 come from.
                  </p>
                  <p>
                    <strong>The group order is a gift:</strong> the string keys returned
                    by <code>Object.keys()</code> come back{" "}
                    <strong>in the order they were written into the object</strong> in
                    modern JS — specified since ES2015, not an accident.{" "}
                    <code>data.json</code> lists Sedan → SUV → Luxury, so{" "}
                    <code>Object.keys(cabData)</code> hands you exactly the order test
                    2&rsquo;s <code>toEqual</code> wants.
                  </p>
                  <p>
                    <strong>&ldquo;Let me sort it&rdquo; is what breaks it:</strong>{" "}
                    <code>.sort()</code> gives lexicographic order,{" "}
                    <code>Luxury → SUV → Sedan</code>, which fails.{" "}
                    <strong>
                      The lesson: when the data already carries a meaningful order, do not
                      touch it.
                    </strong>
                  </p>
                  <p>
                    <strong>Follow-up:</strong> &ldquo;Is <code>Object.keys</code> order
                    actually reliable?&rdquo; — for string keys, yes: insertion order. But{" "}
                    <strong>
                      purely numeric keys get hoisted to the front in ascending numeric
                      order
                    </strong>{" "}
                    (<code>{"{ \"2\": …, \"10\": …, \"a\": … }"}</code> comes out as{" "}
                    <code>2, 10, a</code>). The keys here are words, so it never bites;
                    but if your group keys were years or numeric ids you would have to
                    keep your own order array.
                  </p>
                </>
              ),
              code: [
                real("jsx", SRC_OPTIONS, {
                  filename: "src/components/CabOptions/CabOptions.jsx",
                  sourceFile: "cab-booking-context/src/components/CabOptions/CabOptions.jsx",
                  highlight: [12, 13, 15, 17],
                }),
                real("json", `{
  "Sedan": [
    {
      "id": "sedan-1",
      "name": "Ford Fusion",
      "type": "Sedan",
      "price": 20,
      "image": "/cabs/ford-fusion.svg"
    },
    {
      "id": "sedan-2",
      "name": "Honda Accord",
      "type": "Sedan",
      "price": 24,
      "image": "/cabs/honda-accord.svg"
    }
  ],
  "SUV": [
    {
      "id": "suv-1",
      "name": "Toyota Highlander",
      "type": "SUV",
      "price": 32,
      "image": "/cabs/toyota-highlander.svg"
    },
    {
      "id": "suv-2",
      "name": "Ford Explorer",
      "type": "SUV",
      "price": 36,
      "image": "/cabs/ford-explorer.svg"
    }
  ],
  "Luxury": [
    {
      "id": "luxury-1",
      "name": "Mercedes E-Class",
      "type": "Luxury",
      "price": 55,
      "image": "/cabs/mercedes-e-class.svg"
    },
    {
      "id": "luxury-2",
      "name": "BMW 5 Series",
      "type": "Luxury",
      "price": 60,
      "image": "/cabs/bmw-5-series.svg"
    }
  ]
}`, {
                  filename: "src/data/data.json",
                  sourceFile: "cab-booking-context/src/data/data.json",
                  collapsible: true,
                }),
              ],
            },
            {
              id: "cb-card-fields",
              heading: "五个字段，和 key 的那个坑",
              headingEn: "The five fields, and the problem with the key",
              lede: "卡片里每个字段都有 testid；历史列表的 key 不能只用 id",
              ledeEn:
                "Every field in the card has its own testid; the key in the history list cannot be the id alone",
              body: (
                <>
                  <p>
                    <strong>一句话：</strong>一张卡上五个
                    <code>data-testid</code>：
                    <code>cab-card-img</code> / <code>-name</code> /{" "}
                    <code>-type</code> / <code>-price</code> /{" "}
                    <code>-select-button</code>。
                  </p>
                  <p>
                    <strong>测试只数个数，不查内容</strong> ——
                    五个断言都是 <code>toHaveLength(6)</code>。
                    但别因此偷懒：
                    <code>alt={"{cab.name}"}</code> 该写还是要写，
                    <strong>图片没有 alt 是真实的可访问性缺陷</strong>，
                    面试和 code review 都会提。
                  </p>
                  <p>
                    <strong>现在说 key。</strong>两个列表，两种情况：
                  </p>
                  <ul>
                    <li>
                      <strong>车列表（<code>CabOptions</code> 里）：</strong>
                      <code>key={"{cab.id}"}</code> 就够了 ——
                      六辆车的 id 各不相同，而且列表不会变。
                    </li>
                    <li>
                      <strong>历史列表（<code>RideHistory</code> 里）：</strong>
                      <code>key={"{ride.id}"}</code>
                      <strong>不安全</strong> ——
                      <strong>同一辆车可以被订两次</strong>，
                      历史里就有两条 <code>id: 1</code>。
                      React 会警告
                      <code>Encountered two children with the same key</code>，
                      并且在更新时可能复用错的 DOM 节点。
                    </li>
                  </ul>
                  <p>
                    源项目用的是{" "}
                    <code>key={"{`${ride.id}-${index}`}"}</code> ——
                    <strong>id 加位置，两条相同的车也能区分开</strong>。
                  </p>
                  <p>
                    <strong>会追问：</strong>
                    「不是说 index 不能当 key 吗？」——
                    <strong>说的是「不要只用 index」。</strong>
                    纯 index 的问题是列表中间插入/删除时
                    key 会错位到别的数据上；
                    这里 <code>ride.id</code> 提供了身份、
                    <code>index</code> 只用来消歧，而且历史是
                    <strong>只在尾部追加</strong>的 ——
                    没有中间插入，index 不会错位。
                    <br />
                    <strong>真正干净的做法是给每条记录一个自己的 id</strong>
                    （比如 <code>bookedAt: Date.now()</code>），
                    这样 key 就有了天然唯一值。
                    源项目没这么做，但这是面试里可以主动说的加分点。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    <strong>In one line:</strong> five{" "}
                    <code>data-testid</code> hooks per card:{" "}
                    <code>cab-card-img</code> / <code>-name</code> /{" "}
                    <code>-type</code> / <code>-price</code> /{" "}
                    <code>-select-button</code>.
                  </p>
                  <p>
                    <strong>The tests only count them, they do not read them</strong> —
                    all five assertions are <code>toHaveLength(6)</code>. Do not let that
                    make you lazy: still write <code>alt={"{cab.name}"}</code>, because{" "}
                    <strong>an image with no alt is a real accessibility defect</strong>{" "}
                    and both interviews and code review will call it out.
                  </p>
                  <p>
                    <strong>Now the keys.</strong> Two lists, two situations:
                  </p>
                  <ul>
                    <li>
                      <strong>The cab list (in <code>CabOptions</code>):</strong>{" "}
                      <code>key={"{cab.id}"}</code> is enough — the six ids are distinct
                      and the list never changes.
                    </li>
                    <li>
                      <strong>The history list (in <code>RideHistory</code>):</strong>{" "}
                      <code>key={"{ride.id}"}</code> is <strong>not safe</strong> —{" "}
                      <strong>the same cab can be booked twice</strong>, so the history
                      holds two entries with <code>id: 1</code>. React warns{" "}
                      <code>Encountered two children with the same key</code> and may
                      reuse the wrong DOM node on update.
                    </li>
                  </ul>
                  <p>
                    The source project uses{" "}
                    <code>key={"{`${ride.id}-${index}`}"}</code> —{" "}
                    <strong>id plus position, so two identical cabs stay distinct</strong>.
                  </p>
                  <p>
                    <strong>Follow-up:</strong> &ldquo;I thought index must never be a
                    key?&rdquo; —{" "}
                    <strong>the rule is &ldquo;never index alone&rdquo;.</strong> Bare
                    index breaks when items are inserted or removed in the middle, because
                    a key then lands on different data. Here <code>ride.id</code> supplies
                    identity and <code>index</code> only disambiguates — and the history
                    is <strong>append-only at the tail</strong>, so nothing shifts.
                    <br />
                    <strong>
                      The genuinely clean fix is to give each record its own id
                    </strong>{" "}
                    (say <code>bookedAt: Date.now()</code>), which makes the key naturally
                    unique. The source project does not, but it is a good point to raise
                    yourself in an interview.
                  </p>
                </>
              ),
              code: [
                real("jsx", SRC_CARD, {
                  filename: "src/components/CabOptions/CabCard.jsx（五个 testid）",
                  sourceFile: "cab-booking-context/src/components/CabOptions/CabCard.jsx",
                  highlight: [4, 6, 9, 12, 17],
                }),
              ],
            },
          ],
          callouts: [
            {
              tone: "trap",
              title: "cab-card-type 显示的是 Type: Sedan，不是 Sedan",
              body: (
                <>
                  卡片里写的是 <code>Type: {"{cab.type}"}</code>、
                  <code>Fare: ${"{cab.price}"}</code>。
                  <strong>测试 2 只数个数，所以前缀写不写都过</strong> ——
                  但测试 3 的历史断言是
                  <code>toHaveTextContent(&quot;$20&quot;)</code>，
                  <strong>那个美元符号在历史列表里是必须的</strong>。
                  <br />
                  <code>toHaveTextContent</code> 是<strong>子串匹配</strong>，
                  所以 <code>Fare: $20</code> 也能过；
                  但 <code>20</code>（没有 <code>$</code>）过不了。
                  <strong>凡是被 <code>toHaveTextContent</code> 断言的地方，
                  照抄原文最安全。</strong>
                </>
              ),
            },
          ],
          exercises: [
            {
              id: "cb-keys-recognition",
              kind: "recognition",
              level: 1,
              title: "哪个 key 在历史列表里会出问题？",
              prompt: (
                <>
                  用户连订了两次同一辆 Ford Fusion（<code>id: 1</code>）。
                  历史列表用下面哪个 key 会报「重复 key」警告？
                </>
              ),
              options: [
                { id: "a", label: "key={`${ride.id}-${index}`}" },
                { id: "b", label: "key={ride.id}" },
                { id: "c", label: "key={index}" },
                { id: "d", label: "key={`${ride.name}-${ride.price}-${index}`}" },
              ],
              answer: ["b"],
              explain: (
                <>
                  <strong>B。</strong>两条记录的 <code>ride.id</code> 都是 1，
                  React 报 <code>Encountered two children with the same key, \`1\`</code>。
                  <br />
                  A 和 D 都带了 <code>index</code>，不会重复。
                  C 纯 index 也不会重复 ——
                  <strong>但它是另一类问题</strong>：
                  历史是「最新在最上」的，
                  新增一条会让所有旧记录的 index 全部后移一位，
                  于是<strong>每个 key 对应的数据都变了</strong>，
                  React 会把所有行都当成「内容改了」重新渲染。
                  这个列表只有三行、也没有输入框，所以看不出毛病；
                  但要是每行有个 <code>&lt;input&gt;</code>，
                  用户输的内容就会串行。
                  <br />
                  <strong>结论：id 提供身份，index 只用来消歧。</strong>
                </>
              ),
            },
            {
              id: "cb-card-write",
              kind: "code-completion",
              level: 3,
              title: "从零写出 CabCard",
              prompt: (
                <>
                  只给你 props 签名。五个 testid 自己写出来，
                  别忘了 <code>alt</code> 和 <code>type=&quot;button&quot;</code>。
                </>
              ),
              language: "jsx",
              filename: "src/components/CabOptions/CabCard.jsx",
              starter: `// props: { cab, onSelectCab }
// cab = { id, name, type, price, image }
//
// 要求：
// 1. 图片：data-testid="cab-card-img"，src 用 cab.image，alt 用 cab.name
// 2. 车名：data-testid="cab-card-name"
// 3. 类型：data-testid="cab-card-type"，显示 "Type: <类型>"
// 4. 价格：data-testid="cab-card-price"，显示 "Fare: $<价格>"
// 5. 按钮：data-testid="cab-card-select-button"，文字 Select，
//    点击调 onSelectCab(cab)，并且要写 type="button"

const CabCard = ({ cab, onSelectCab }) => {
`,
              requirements: [
                "五个 data-testid 一个不少：cab-card-img / -name / -type / -price / -select-button",
                "img 要有 alt（测试不查，但没有 alt 是真实的可访问性缺陷）",
                "按钮写 type=\"button\" —— 不写的话在 <form> 里会变成提交按钮",
                "onClick 里包一层箭头函数把 cab 传进去，不是直接传 onSelectCab",
                "价格前面要有 $ —— 历史列表的断言查的是 \"$20\"",
              ],
              checks: [
                {
                  label: "五个 testid 都在",
                  must: "cab-card-img[\\s\\S]*cab-card-name[\\s\\S]*cab-card-type[\\s\\S]*cab-card-price[\\s\\S]*cab-card-select-button",
                },
                { label: "img 有 alt", must: "<img[\\s\\S]{0,200}?alt=" },
                { label: "按钮写了 type=\"button\"", must: "type=\"button\"" },
                {
                  label: "onClick 包了箭头函数，把 cab 传进去",
                  must: "onClick=\\{\\s*\\(\\s*\\)\\s*=>\\s*onSelectCab\\(\\s*cab\\s*\\)",
                },
                {
                  label: "没有直接把 onSelectCab 当 onClick（那样收到的是事件对象）",
                  mustNot: "onClick=\\{\\s*onSelectCab\\s*\\}",
                },
              ],
              hints: [
                "一张卡就是一个 article 包着图片和一块内容。先把五个要素列出来，再一个个加 testid。",
                "按钮的 onClick 需要把 cab 传出去，所以不能直接写 onClick={onSelectCab} —— 那样传出去的是点击事件。",
                "结构：<article><img …/><div><p name/><p type/><p price/><button/></div></article>。价格那行是 Fare: ${cab.price}，注意 $ 在 JSX 里要转义成 \\${...} 还是直接写 —— 直接写 $ 再跟 {cab.price} 就行。",
                "onClick={() => onSelectCab(cab)}；img 是 <img src={cab.image} alt={cab.name} data-testid=\"cab-card-img\" />。",
              ],
              solution: real("jsx", SRC_CARD, {
                filename: "src/components/CabOptions/CabCard.jsx（参考答案 —— 源项目原文）",
                sourceFile: "cab-booking-context/src/components/CabOptions/CabCard.jsx",
              }),
            },
          ],
          mistakes: [
            {
              wrong: demo(
                "jsx",
                `// ✕ 自己给分组排序 —— 测试 2 直接红
{Object.keys(cabData).sort().map((type) => (
  <section key={type}>
    <h3 data-testid="car-type-heading">{type}</h3>
    …
  </section>
))}

// .sort() 出来是字典序：["Luxury", "SUV", "Sedan"]
// 断言要的是：      ["Sedan", "SUV", "Luxury"]`,
                { filename: "多余的排序" },
              ),
              why: (
                <>
                  <code>sort()</code> 默认按字符串比较，大写字母在前，
                  出来是 <code>Luxury → SUV → Sedan</code>。
                  <br />
                  <strong>而 <code>data.json</code> 的键顺序本来就是对的。</strong>
                  这个错误的模式很典型：
                  <strong>看到列表就想「是不是该排一下」</strong> ——
                  但数据源已经表达了顺序意图时，任何加工都是破坏。
                  <br />
                  顺带：<code>sort()</code> 还会
                  <strong>原地修改</strong>它作用的数组。
                  这里作用在 <code>Object.keys()</code> 返回的新数组上所以无害，
                  但直接 <code>someStateArray.sort()</code> 就会改到 state。
                </>
              ),
              whyEn: (
                <>
                  <code>sort()</code> compares as strings by default, and capital letters come
                  first, so the result is <code>Luxury → SUV → Sedan</code>.
                  <br />
                  <strong>
                    The key order in <code>data.json</code> was already correct.
                  </strong>{" "}
                  The mistake follows a very common pattern:{" "}
                  <strong>you see a list and wonder whether it should be sorted</strong>. When the
                  data source already states the order, any extra step breaks it.
                  <br />
                  One more point: <code>sort()</code> also{" "}
                  <strong>changes the array in place</strong>. Here it runs on the new array
                  returned by <code>Object.keys()</code>, so it does no harm, but{" "}
                  <code>someStateArray.sort()</code> would change the state itself.
                </>
              ),
            },
            {
              wrong: demo(
                "jsx",
                `// ✕ 直接把 onSelectCab 当 onClick
<button data-testid="cab-card-select-button" onClick={onSelectCab}>
  Select
</button>

// onClick 会把「点击事件对象」当第一个参数传进去
// → updateBookedCabDetails(clickEvent)
// → 确认页显示 undefined is on the way
// → 历史里那条记录的 name 和 price 都是 undefined`,
                { filename: "忘了包箭头函数" },
              ),
              why: (
                <>
                  DOM 事件处理器<strong>永远收到事件对象作为第一个参数</strong>。
                  所以 <code>onClick={"{onSelectCab}"}</code> 等于
                  <code>onSelectCab(clickEvent)</code>，
                  而 <code>cab</code> 从来没被传出去。
                  <br />
                  <strong>症状很迷惑：不报错，流程也走得通</strong> ——
                  页面照样切到 loading、再切到确认页，
                  只是车名变成了空白（因为 <code>?.name</code> 是{" "}
                  <code>undefined</code>，React 什么也不渲染）。
                  测试 3 会挂在
                  <code>toHaveTextContent(&quot;Ford Fusion is on the way…&quot;)</code>。
                  <br />
                  <strong>需要传自己的参数，就包一层：</strong>
                  <code>onClick={"{() => onSelectCab(cab)}"}</code>。
                </>
              ),
              whyEn: (
                <>
                  A DOM event handler{" "}
                  <strong>always receives the event object as its first argument</strong>. So{" "}
                  <code>onClick={"{onSelectCab}"}</code> means <code>onSelectCab(clickEvent)</code>,
                  and <code>cab</code> is never passed at all.
                  <br />
                  <strong>The symptom is confusing: no error, and the flow still works</strong> —
                  the page moves to loading and then to the confirmation page, only the cab name is
                  blank (because <code>?.name</code> is <code>undefined</code>, and React renders
                  nothing for it). Test 3 fails on{" "}
                  <code>toHaveTextContent(&quot;Ford Fusion is on the way…&quot;)</code>.
                  <br />
                  <strong>To pass an argument of your own, wrap it:</strong>{" "}
                  <code>onClick={"{() => onSelectCab(cab)}"}</code>.
                </>
              ),
            },
          ],
          transfer: [
            { signal: "数据是「分组名 → 数组」的对象", reachFor: "Object.keys 外层、值数组内层，两层 map" },
            { signal: "断言用 toEqual 比分组顺序", reachFor: "别自己 sort —— 键的插入顺序就是答案" },
            { signal: "列表里可能出现重复的业务 id", reachFor: "key 用 `${id}-${index}`，或给每条记录一个自己的 id" },
            { signal: "onClick 需要带自己的参数", reachFor: "() => fn(arg)；直接传 fn 会收到事件对象" },
          ],
          recap: [
            "3 个类型 × 2 辆车 = 6 张卡，五个 toHaveLength(6) 就是这么来的。",
            "分组顺序来自 data.json 的键插入顺序，Object.keys 直接给你，别 sort。",
            "CabCard 五个 testid：img / name / type / price / select-button。",
            "历史列表的 key 不能只用 ride.id —— 同一辆车能订两次。",
            "onClick={onSelectCab} 会把事件对象当 cab 传进去，必须包箭头函数。",
          ],
          recapEn: [
            "3 types × 2 cabs = 6 cards, which is where the five toHaveLength(6) checks come from.",
            "The group order comes from the order the keys were written in data.json. Object.keys hands it to you, so do not sort.",
            "The five testids of CabCard: img, name, type, price, select-button.",
            "The key in the history list cannot be ride.id alone, because the same cab can be booked twice.",
            "onClick={onSelectCab} passes the event object in place of cab, so you have to wrap it in an arrow function.",
          ],
        },
        {
          id: "cb-loading-timer",
          title: "Loading：一秒之后自己跳走",
          titleEn: "Loading: it moves to the next page by itself after one second",
          blurb: "useEffect 里一个 setTimeout，return 里一个 clearTimeout。少了后者会出真问题。",
          blurbEn:
            "One setTimeout inside useEffect, one clearTimeout in the return. Leave the second one out and you get a real problem.",
          minutes: 14,
          objectives: [
            "在 useEffect 里写 setTimeout 并正确清理",
            "说清清理函数在防什么，以及不清理的真实症状",
            "看懂测试为什么要 vi.useFakeTimers() + advanceTimersByTime(1000)",
            "知道 act() 包住时间推进的原因",
          ],
          objectivesEn: [
            "Write a setTimeout inside useEffect and clear it correctly",
            "Explain what the cleanup function prevents, and what really goes wrong without it",
            "See why the test needs vi.useFakeTimers() together with advanceTimersByTime(1000)",
            "Know why the time advance is wrapped in act()",
          ],
          whyForAssessment:
            "这是 effect 清理的标准考法，也是本站 React 变式二「计时器」的同一个考点。测试用 fake timer 把 1 秒变成一行代码，所以延迟数字必须正好是 1000 —— 写 900 或 1200，advanceTimersByTime(1000) 之后页面状态就不对了。",
          whyForAssessmentEn:
            "This is the standard way effect cleanup gets examined, and the timer variant of the React task on this site tests the same point. The test uses a fake timer to turn the 1 second into a single line, so the delay has to be exactly 1000. Write 900 or 1200 and the page is in the wrong state after advanceTimersByTime(1000).",
          sourceFiles: [
            { path: "cab-booking-context/src/components/Loading/Loading.jsx", role: "setTimeout + clearTimeout", edit: true },
            { path: "cab-booking-context/src/test/App.test.jsx", role: "fake timer 的用法在 beforeEach / afterEach 里" },
          ],
          concepts: [
            {
              id: "cb-effect-timeout",
              heading: "为什么定时器必须在 useEffect 里",
              headingEn: "Why the timer has to be inside useEffect",
              lede: "写在组件体里，每次渲染都会开一个新的",
              ledeEn:
                "Put it in the component body and every render starts another one",
              body: (
                <>
                  <p>
                    <strong>一句话：</strong>
                    <code>setTimeout</code> 是<strong>副作用</strong> ——
                    它改变了组件外面的东西（浏览器的定时器表）。
                    副作用必须放进 <code>useEffect</code>。
                  </p>
                  <p>
                    <strong>写在组件体里会怎样：</strong>
                  </p>
                  <ul>
                    <li>
                      组件每渲染一次就<strong>多开一个定时器</strong>，
                      而且没人记得它们的 id，清不掉；
                    </li>
                    <li>
                      React 18 的 <code>StrictMode</code>
                      开发模式下渲染两次，
                      <strong>一次挂载就开两个</strong>；
                    </li>
                    <li>
                      每个定时器到期都会调一次 <code>onComplete()</code>，
                      于是 <code>setCurrentPage</code> 被调多次 ——
                      功能上看起来没事，因为设成同一个值，
                      <strong>但这是运气</strong>。
                    </li>
                  </ul>
                  <p>
                    <strong>依赖数组写什么：</strong>源项目写的是{" "}
                    <code>[onComplete]</code>。
                  </p>
                  <p>
                    这是<strong>诚实的写法</strong> ——
                    effect 里用到了 <code>onComplete</code>，就该声明它。
                    <br />
                    但它有个后果：<code>App</code> 传下来的是
                    <code>{"() => setCurrentPage(\"cab-confirmation\")"}</code>，
                    <strong>每次 App 重渲染都是一个新函数</strong>，
                    所以 <code>onComplete</code> 变了、effect 会重跑
                    （先 <code>clearTimeout</code> 再重新计时）。
                    <br />
                    <strong>这个应用里撞不到问题</strong>，因为
                    <code>Loading</code> 显示期间 <code>App</code> 不会重渲染 ——
                    没有别的 state 在变。
                    但换个场景（比如页头有个每秒刷新的时钟），
                    <strong>这个定时器会被无限重置，永远跳不到确认页</strong>。
                  </p>
                  <p>
                    <strong>会追问：</strong>「那怎么办？」——
                    两条路：
                    <strong>①</strong> <code>App</code> 那边用
                    <code>useCallback</code> 把 <code>onComplete</code> 稳住；
                    <strong>②</strong> 依赖写 <code>[]</code>，
                    并用一个 ref 存住最新的 <code>onComplete</code>。
                    ① 更常见，② 更彻底。
                    <strong>面试时能说出「新函数身份导致 effect 重跑」
                    这个因果链，比背出答案更重要。</strong>
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    <strong>In one line:</strong> <code>setTimeout</code> is a{" "}
                    <strong>side effect</strong> — it changes something outside the
                    component (the browser&rsquo;s timer table). Side effects belong in{" "}
                    <code>useEffect</code>.
                  </p>
                  <p>
                    <strong>What happens if you put it in the component body:</strong>
                  </p>
                  <ul>
                    <li>
                      Every render <strong>starts one more timer</strong>, and nobody
                      remembers their ids, so they cannot be cleared;
                    </li>
                    <li>
                      React 18&rsquo;s <code>StrictMode</code> renders twice in
                      development, so <strong>one mount starts two</strong>;
                    </li>
                    <li>
                      Each timer fires <code>onComplete()</code>, so{" "}
                      <code>setCurrentPage</code> runs several times — which happens to
                      look fine because it sets the same value,{" "}
                      <strong>but that is luck</strong>.
                    </li>
                  </ul>
                  <p>
                    <strong>What goes in the dependency array:</strong> the source project
                    writes <code>[onComplete]</code>.
                  </p>
                  <p>
                    That is the <strong>honest</strong> version — the effect uses{" "}
                    <code>onComplete</code>, so it declares it.
                    <br />
                    It has a consequence, though: <code>App</code> passes down{" "}
                    <code>{"() => setCurrentPage(\"cab-confirmation\")"}</code>, and{" "}
                    <strong>every App render creates a new function</strong>, so{" "}
                    <code>onComplete</code> changed and the effect re-runs (clearing the
                    timeout and starting over).
                    <br />
                    <strong>Nothing bites in this app</strong>, because <code>App</code>{" "}
                    does not re-render while <code>Loading</code> is on screen — no other
                    state is moving. Change the scene, though — say a clock in the header
                    ticking every second — and{" "}
                    <strong>
                      the timer is reset forever and the confirmation page never arrives
                    </strong>
                    .
                  </p>
                  <p>
                    <strong>Follow-up:</strong> &ldquo;So what do you do?&rdquo; — two
                    routes: <strong>(1)</strong> stabilise <code>onComplete</code> with{" "}
                    <code>useCallback</code> over in <code>App</code>;{" "}
                    <strong>(2)</strong> use <code>[]</code> as the dependency array and
                    keep the latest <code>onComplete</code> in a ref. (1) is more common,
                    (2) is more thorough.{" "}
                    <strong>
                      Being able to state the causal chain — new function identity, so the
                      effect re-runs — matters more than reciting either fix.
                    </strong>
                  </p>
                </>
              ),
              code: [
                real("jsx", SRC_LOADING, {
                  filename: "src/components/Loading/Loading.jsx",
                  sourceFile: "cab-booking-context/src/components/Loading/Loading.jsx",
                  highlight: [4, 6, 8, 10],
                }),
              ],
            },
            {
              id: "cb-cleanup",
              heading: "清理函数在防什么",
              headingEn: "What the cleanup function prevents",
              lede: "组件已经不在了，定时器还在替它调 setState",
              ledeEn:
                "The component is already gone, and the timer still calls setState for it",
              body: (
                <>
                  <p>
                    <strong>一句话：</strong>
                    <code>return () =&gt; clearTimeout(timer)</code>
                    保证「组件走了，它开的定时器也走了」。
                  </p>
                  <p>
                    <strong>不清理的真实症状：</strong>
                    这道题里 <code>Loading</code> 只活 1 秒、也没有别的路能提前离开，
                    所以<strong>四个测试全都不会因为少了清理而失败</strong>。
                    <br />
                    这正是要警惕的地方 ——
                    <strong>「测试通过 ≠ 做对了」在这里又出现了一次。</strong>
                  </p>
                  <p>
                    <strong>什么时候会真的炸：</strong>
                    只要加一个「取消」按钮让用户在 loading 期间返回首页 ——
                  </p>
                  <ul>
                    <li>
                      用户 0.3 秒时点了取消，
                      <code>setCurrentPage(&quot;home&quot;)</code>，
                      <code>Loading</code> 卸载；
                    </li>
                    <li>
                      1 秒时定时器到期，
                      <strong>照样调 <code>onComplete()</code></strong>；
                    </li>
                    <li>
                      于是 <code>setCurrentPage(&quot;cab-confirmation&quot;)</code> ——
                      <strong>用户明明已经回首页了，页面自己跳到了确认页。</strong>
                    </li>
                  </ul>
                  <p>
                    <strong>注意这不是「内存泄漏」那么抽象的东西</strong>，
                    它是一个用户能看见的 bug。
                    <br />
                    <strong>会追问：</strong>「React 不是会警告
                    <code>Can&apos;t perform a React state update on an unmounted
                    component</code> 吗？」——
                    <strong>React 18 起那条警告被移除了</strong>，
                    因为它误报太多。所以现在
                    <strong>不清理不会有任何提示，只会有诡异行为</strong>。
                  </p>
                  <p>
                    <strong>测试怎么控制这 1 秒：</strong>
                  </p>
                  <ul>
                    <li>
                      <code>beforeEach</code> 里 <code>vi.useFakeTimers()</code> ——
                      把 <code>setTimeout</code> 换成假的，
                      <strong>时间不会自己走</strong>；
                    </li>
                    <li>
                      <code>act(() =&gt; {"{ vi.advanceTimersByTime(1000) }"})</code> ——
                      手动把表拨快 1 秒，定时器立刻到期。
                      <strong>套 <code>act</code> 是因为到期会触发 setState</strong>，
                      不套的话 React 会警告更新发生在 act 外面，
                      而且断言可能在重渲染之前就跑了；
                    </li>
                    <li>
                      <code>afterEach</code> 里{" "}
                      <code>vi.runOnlyPendingTimers()</code> 再{" "}
                      <code>useRealTimers()</code> ——
                      <strong>把没到期的定时器清干净再还原</strong>，
                      不然会漏到下一个测试里。
                    </li>
                  </ul>
                  <p>
                    <strong>所以延迟必须正好 1000。</strong>
                    写 1200 的话，<code>advanceTimersByTime(1000)</code>
                    之后定时器还没到期，
                    页面还停在 loading，
                    <code>getByTestId(&quot;confirm-message&quot;)</code> 找不到 ——
                    测试 3 和 4 全红。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    <strong>In one line:</strong>{" "}
                    <code>return () =&gt; clearTimeout(timer)</code> guarantees that when
                    the component leaves, its timer leaves with it.
                  </p>
                  <p>
                    <strong>What actually breaks without it:</strong> in this question{" "}
                    <code>Loading</code> lives for one second and there is no other way
                    out, so{" "}
                    <strong>
                      none of the four tests fail if you omit the cleanup
                    </strong>
                    .
                    <br />
                    That is exactly what to be suspicious of —{" "}
                    <strong>
                      &ldquo;tests pass&rdquo; is not &ldquo;you got it right&rdquo;, once
                      again.
                    </strong>
                  </p>
                  <p>
                    <strong>When a request really does hang:</strong> add one Cancel button
                    that lets the user go home during loading —
                  </p>
                  <ul>
                    <li>
                      At 0.3s the user cancels,{" "}
                      <code>setCurrentPage(&quot;home&quot;)</code> runs, and{" "}
                      <code>Loading</code> unmounts;
                    </li>
                    <li>
                      At 1s the timer fires and{" "}
                      <strong>calls <code>onComplete()</code> anyway</strong>;
                    </li>
                    <li>
                      So <code>setCurrentPage(&quot;cab-confirmation&quot;)</code> runs —{" "}
                      <strong>
                        the user is sitting on the home page and it jumps to the
                        confirmation page by itself.
                      </strong>
                    </li>
                  </ul>
                  <p>
                    <strong>
                      This is not something abstract like &ldquo;a memory leak&rdquo;
                    </strong>
                    ; it is a bug the user can see.
                    <br />
                    <strong>Follow-up:</strong> &ldquo;Doesn&rsquo;t React warn{" "}
                    <code>
                      Can&apos;t perform a React state update on an unmounted component
                    </code>
                    ?&rdquo; —{" "}
                    <strong>that warning was removed in React 18</strong> because it fired
                    too often on correct code. So today{" "}
                    <strong>
                      skipping the cleanup gives you no warning at all, only strange
                      behaviour
                    </strong>
                    .
                  </p>
                  <p>
                    <strong>How the test controls that second:</strong>
                  </p>
                  <ul>
                    <li>
                      <code>vi.useFakeTimers()</code> in <code>beforeEach</code> replaces{" "}
                      <code>setTimeout</code> with a fake one, so{" "}
                      <strong>time does not move on its own</strong>;
                    </li>
                    <li>
                      <code>act(() =&gt; {"{ vi.advanceTimersByTime(1000) }"})</code>{" "}
                      winds the clock forward one second and the timer fires immediately.{" "}
                      <strong>
                        The <code>act</code> wrapper is there because firing triggers a
                        setState
                      </strong>
                      ; without it React warns about an update outside act, and the
                      assertion may run before the re-render;
                    </li>
                    <li>
                      <code>vi.runOnlyPendingTimers()</code> then{" "}
                      <code>useRealTimers()</code> in <code>afterEach</code>{" "}
                      <strong>drain any pending timers before restoring</strong>, so
                      nothing leaks into the next test.
                    </li>
                  </ul>
                  <p>
                    <strong>Which is why the delay has to be exactly 1000.</strong> Write
                    1200 and after <code>advanceTimersByTime(1000)</code> the timer has
                    not fired, the page is still loading, and{" "}
                    <code>getByTestId(&quot;confirm-message&quot;)</code> finds nothing —
                    tests 3 and 4 both go red.
                  </p>
                </>
              ),
              code: [
                demo(
                  "jsx",
                  `// 测试里控制时间的三步（源项目 App.test.jsx 的用法）
beforeEach(() => {
  vi.useFakeTimers();                 // ① 时间冻住
});

afterEach(() => {
  vi.runOnlyPendingTimers();          // ③ 清掉没到期的
  vi.useRealTimers();                 //    还原真时钟
});

it("completes a booking …", () => {
  // …点选一辆车…
  expect(screen.getByTestId("loading")).toBeInTheDocument();

  act(() => { vi.advanceTimersByTime(1000); });   // ② 手动拨 1 秒

  expect(screen.getByTestId("confirm-message")).toHaveTextContent(
    "Ford Fusion is on the way and will arrive shortly.",
  );
});`,
                  { filename: "fake timer 三步（摘自源项目测试，加注释）" },
                ),
              ],
            },
          ],
          callouts: [
            {
              tone: "transfer",
              title: "这个考点你已经练过一次了",
              body: (
                <>
                  React 考试变式二「计时器」考的是同一件事：
                  <code>setInterval</code> + <code>clearInterval</code>，
                  而且那道题<strong>有测试专门抓「忘了清理」</strong> ——
                  实测删掉 <code>clearInterval</code> 之后
                  4 failed / 4 passed，
                  <code>00:04</code> 的位置实收 <code>00:10</code>。
                  <br />
                  <strong>差别就在这里：</strong>
                  那道题的测试抓得住，这道题的测试抓不住。
                  <strong>同一个错误，会不会被测试发现，取决于测试写得多细
                  —— 不取决于错误有多严重。</strong>
                </>
              ),
            },
          ],
          exercises: [
            {
              id: "cb-loading-fill",
              kind: "fill-blank",
              level: 2,
              title: "补齐 Loading 的四个空",
              prompt: <>第 3 个空是这道题的送分点，第 4 个空是这道题的良心。</>,
              language: "jsx",
              filename: "src/components/Loading/Loading.jsx",
              template: `import { useEffect } from "react";

const Loading = ({ onComplete }) => {
  ___1___(() => {
    const timer = ___2___(() => {
      if (onComplete) onComplete();
    }, ___3___);

    return () => ___4___;
  }, [onComplete]);

  return (
    <main data-testid="loading" className="loading-container">
      <div className="spinner" aria-hidden="true" />
      <h1>Loading...</h1>
      <p>We are working on your cab booking. Thanks for your patience.</p>
    </main>
  );
};`,
              blanks: [
                {
                  n: 1,
                  accept: ["useEffect"],
                  hint: "副作用要放在哪里",
                  why: (
                    <>
                      <code>setTimeout</code> 是副作用，
                      写在组件体里会<strong>每次渲染都开一个新的</strong>，
                      <code>StrictMode</code> 下一次挂载就开两个。
                    </>
                  ),
                },
                {
                  n: 2,
                  accept: ["setTimeout"],
                  hint: "只跑一次，不是反复跑",
                  why: (
                    <>
                      <strong>是 <code>setTimeout</code> 不是
                      <code>setInterval</code></strong> ——
                      只需要「1 秒后跳一次」。
                      用 <code>setInterval</code> 的话，
                      跳到确认页之后组件卸载、清理函数跑掉才停；
                      要是忘了清理，它会<strong>每秒把用户拽回确认页一次</strong>。
                    </>
                  ),
                },
                {
                  n: 3,
                  accept: ["1000"],
                  hint: "测试拨的是多少毫秒？",
                  why: (
                    <>
                      测试写的是 <code>vi.advanceTimersByTime(1000)</code>，
                      所以延迟<strong>必须 ≤ 1000</strong>，写 1000 最贴题
                      （题目要求就是「模拟 1 秒延迟」）。
                      <br />
                      写 1200 的话，拨完 1 秒定时器还没到，
                      页面停在 loading，
                      <strong>测试 3 和 4 全红</strong>。
                    </>
                  ),
                },
                {
                  n: 4,
                  accept: ["clearTimeout(timer)"],
                  hint: "组件走了，定时器也得走",
                  why: (
                    <>
                      <strong>四个测试都不会因为少了这一句而失败</strong> ——
                      这道题里 <code>Loading</code> 没有别的退出路径。
                      <br />
                      但只要加一个「取消」按钮，
                      少了它就会出现「用户已经回首页了，
                      1 秒后页面自己跳到确认页」。
                      而且 React 18 起
                      <strong>不再警告「在已卸载组件上更新 state」</strong>，
                      所以你不会收到任何提示。
                      <br />
                      <strong>该写的清理就写上，别等测试来逼你。</strong>
                    </>
                  ),
                },
              ],
            },
            {
              id: "cb-timer-debug",
              kind: "debug",
              level: 2,
              title: "Debug Lab：定时器永远不到期",
              prompt: (
                <>
                  测试 3 报「找不到 <code>confirm-message</code>」，
                  而 DOM 快照显示页面还停在 loading。
                  先读报错，再看下面那个 <code>Loading</code> 组件 ——
                  <strong>它和源项目差一个东西</strong>。
                </>
              ),
              errorOutput: `FAIL  src/test/App.test.jsx > React: Cab Booking > completes a booking and adds it to ride history

TestingLibraryElementError: Unable to find an element by: [data-testid="confirm-message"]

Ignored nodes: comments, script, style
<body>
  <div>
    <div class="App">
      <header …>…</header>
      <main class="loading-container" data-testid="loading">
        <div class="spinner" aria-hidden="true" />
        <h1>Loading...</h1>
      </main>
    </div>
  </div>
</body>

 ❯ src/test/App.test.jsx:52:17`,
              broken: demo(
                "jsx",
                `const Loading = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1000);

    return () => clearTimeout(timer);
  });                                  // ← 依赖数组呢？

  return (
    <main data-testid="loading" className="loading-container">
      <div className="spinner" aria-hidden="true" />
      <h1>Loading...</h1>
    </main>
  );
};`,
                { filename: "src/components/Loading/Loading.jsx（有问题的版本）" },
              ),
              classify: {
                options: [
                  { id: "a", label: "testid 写错了 —— confirm-message 拼错或漏了" },
                  { id: "b", label: "effect 的依赖数组漏了，导致定时器每次渲染都被清掉重开" },
                  { id: "c", label: "Context 没套 Provider" },
                  { id: "d", label: "延迟时间大于 1000，fake timer 拨不到" },
                ],
                answer: "b",
              },
              locate: {
                question: "从报错的 DOM 快照看，页面停在哪个状态？这说明问题出在哪？",
                options: [
                  { id: "a", label: "停在 loading —— 所以是 Loading 组件没有触发 onComplete" },
                  { id: "b", label: "停在首页 —— 所以是 book-button 的回调没接上" },
                  { id: "c", label: "停在 cab-options —— 所以是 onSelectCab 没传下去" },
                  { id: "d", label: "DOM 是空的 —— 所以是 render 就抛错了" },
                ],
                answer: "a",
              },
              fixed: real("jsx", SRC_LOADING, {
                filename: "src/components/Loading/Loading.jsx（修好：补上依赖数组）",
                sourceFile: "cab-booking-context/src/components/Loading/Loading.jsx",
                highlight: [10],
              }),
              rootCause: (
                <>
                  <p>
                    <strong>根因：<code>useEffect</code> 没写依赖数组，
                    等于「每次渲染后都跑一遍」。</strong>
                  </p>
                  <p>
                    <code>useEffect(fn)</code> 和{" "}
                    <code>useEffect(fn, [])</code> 差一个参数，行为差很远：
                  </p>
                  <ul>
                    <li>
                      <code>useEffect(fn, [])</code> —— 挂载后跑一次
                    </li>
                    <li>
                      <code>useEffect(fn, [dep])</code> —— dep 变了才重跑
                    </li>
                    <li>
                      <code>useEffect(fn)</code> ——
                      <strong>每次渲染后都重跑</strong>，
                      而且重跑之前会先执行上一次的清理函数
                    </li>
                  </ul>
                  <p>
                    所以流程变成：渲染 → 开定时器 → 又渲染 →
                    <strong><code>clearTimeout</code> 把它清掉</strong> →
                    再开一个新的 → 又渲染 → 再清掉……
                    <strong>只要组件还在重渲染，那 1 秒就永远数不完。</strong>
                  </p>
                  <p>
                    <strong>为什么它在这道题里会一直重渲染：</strong>
                    <code>Loading</code> 自己没有 state，
                    但 <code>App</code> 每次重渲染都会给它一个新的
                    <code>onComplete</code>（那是个内联箭头函数），
                    <strong>而没有依赖数组时连「变没变」都不用判断</strong> ——
                    照跑。
                  </p>
                  <p>
                    <strong>怎么一眼认出这类问题：</strong>
                    报错说「找不到本该出现的东西」，
                    而 DOM 快照显示<strong>页面停在了上一个状态</strong>。
                    这个组合基本就是
                    <strong>「某个本该发生的异步跳转没发生」</strong>，
                    去看那个 effect 的依赖数组。
                  </p>
                </>
              ),
              verify: "npx vitest run",
            },
          ],
          mistakes: [
            {
              wrong: demo(
                "jsx",
                `// ✕ 用 setInterval 而且忘了清理
useEffect(() => {
  setInterval(() => {
    if (onComplete) onComplete();
  }, 1000);
}, [onComplete]);

// 症状：跳到确认页之后，每隔 1 秒又调一次
// setCurrentPage("cab-confirmation")
// 用户点了 Okay 想回首页 —— 1 秒后被拽回确认页
// 而且这个定时器永远不会停`,
                { filename: "setInterval + 无清理" },
              ),
              why: (
                <>
                  两个错叠在一起。
                  <strong><code>setInterval</code> 会反复触发</strong>，
                  而<strong>没有清理函数意味着它连组件卸载都不停</strong>。
                  <br />
                  有意思的是<strong>测试 3 还是会过</strong> ——
                  它只查确认页出现了，不查后来有没有再跳。
                  <strong>测试 4 会挂</strong>：它连订四辆，
                  第一轮遗留的 interval 会在后面几轮里
                  <strong>把页面拽回确认页</strong>，
                  第二轮找 <code>book-button</code> 就找不到了。
                  <br />
                  <strong>「只跑一次」用 <code>setTimeout</code>，
                  「反复跑」才用 <code>setInterval</code>，
                  两者都必须清理。</strong>
                </>
              ),
              whyEn: (
                <>
                  Two mistakes on top of each other.{" "}
                  <strong>
                    <code>setInterval</code> fires again and again
                  </strong>
                  , and{" "}
                  <strong>with no cleanup function it does not even stop when the component is
                  removed</strong>.
                  <br />
                  The interesting part is that <strong>test 3 still passes</strong> — it only checks
                  that the confirmation page appeared, not whether the page changes again later.{" "}
                  <strong>Test 4 fails</strong>: it books four cabs in a row, and the interval left
                  over from the first round{" "}
                  <strong>pulls the page back to the confirmation page</strong> during the later
                  rounds, so the second round cannot find <code>book-button</code> any more.
                  <br />
                  <strong>
                    Use <code>setTimeout</code> for something that runs once and{" "}
                    <code>setInterval</code> only for something that repeats. Both of them have to be
                    cleared.
                  </strong>
                </>
              ),
            },
          ],
          transfer: [
            { signal: "组件里要开定时器 / 订阅 / 加监听", reachFor: "放进 useEffect，并在 return 里成对清掉" },
            { signal: "「本该自动跳转但一直不跳」", reachFor: "先看 effect 的依赖数组 —— 漏了就每次渲染都重置" },
            { signal: "测试要控制一段延迟", reachFor: "vi.useFakeTimers() + act(() => vi.advanceTimersByTime(n))" },
            { signal: "afterEach 里要不要清定时器", reachFor: "要 —— runOnlyPendingTimers 再 useRealTimers，否则漏到下个测试" },
          ],
          recap: [
            "setTimeout 是副作用，必须在 useEffect 里；写组件体里每渲染一次开一个。",
            "延迟必须是 1000 —— 测试拨的正好是 1000ms。",
            "清理函数在这道题里不影响测试结果，但加个「取消」按钮它就是可见 bug。",
            "React 18 起不再警告「在已卸载组件上 setState」，所以漏清理毫无提示。",
            "漏写依赖数组 = 每次渲染都重开定时器，那 1 秒永远数不完。",
          ],
          recapEn: [
            "setTimeout is a side effect, so it belongs in useEffect. In the component body it starts one more timer on every render.",
            "The delay has to be 1000, because the test advances exactly 1000ms.",
            "The cleanup function does not change the test result in this task, but add a cancel button and its absence becomes a visible bug.",
            "Since React 18 there is no warning about calling setState on a component that is already removed, so a missing cleanup gives you no hint at all.",
            "Leaving out the dependency array means the timer starts again on every render, so the 1 second never finishes.",
          ],
        },
        {
          id: "cb-history-three",
          title: "历史与确认页：两个小而致命的细节",
          titleEn: "The history and confirmation pages: two small details that decide pass or fail",
          blurb: "slice(-3).reverse() 一个字符都不能错；bookedCabDetails?.name 少个问号就白屏。",
          blurbEn:
            "slice(-3).reverse() has to be exact, character for character; drop the question mark in bookedCabDetails?.name and the screen goes blank.",
          minutes: 15,
          objectives: [
            "说清 slice(-3) 和 slice(0, 3) 的区别",
            "知道 reverse() 是原地修改，以及为什么这里安全",
            "写出「最新三条、最新在最上」的取法",
            "说清为什么 bookedCabDetails 后面必须有可选链",
          ],
          objectivesEn: [
            "Explain the difference between slice(-3) and slice(0, 3)",
            "Know that reverse() changes the array in place, and why it is safe here",
            "Write the code for the three newest rides with the newest at the top",
            "Explain why bookedCabDetails needs optional chaining after it",
          ],
          whyForAssessment:
            "测试 4 是这道题唯一会「看起来做对了但实际全错」的地方：它同时查数量、顺序、和最旧那条真的消失。slice 方向写反、忘了 reverse、或者直接 reverse 到 state 上，三种错法都只在这一条测试里暴露。",
          whyForAssessmentEn:
            "Test 4 is the one place in this task where your work can look correct and be completely wrong. It checks the count, the order, and that the oldest entry really disappeared, all at the same time. A slice in the wrong direction, a missing reverse, or a reverse applied to the state array: all three show up only in this single test.",
          sourceFiles: [
            { path: "cab-booking-context/src/components/Home/RideHistory.jsx", role: "取最新三条并反转", edit: true },
            { path: "cab-booking-context/src/components/CabConfirmation/CabConfirmation.jsx", role: "可选链在这里", edit: true },
          ],
          concepts: [
            {
              id: "cb-slice-negative",
              heading: "slice(-3) 是「最后三个」",
              headingEn: "slice(-3) means the last three",
              lede: "负数从尾巴数起。方向写反，测试 4 直接红",
              ledeEn:
                "A negative number counts from the end. Get the direction wrong and test 4 fails",
              body: (
                <>
                  <p>
                    <strong>一句话：</strong>
                    <code>arr.slice(-3)</code> 取<strong>最后</strong>三个，
                    <code>arr.slice(0, 3)</code> 取<strong>最前</strong>三个。
                  </p>
                  <p>
                    <strong>先看数据是怎么排的：</strong>
                    <code>updateBookedCabDetails</code> 用的是
                    <code>[...rideHistory, details]</code> ——
                    <strong>新记录追加在尾部</strong>。
                    所以数组是「最旧 → 最新」的顺序。
                  </p>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>写法</th>
                          <th>拿到什么</th>
                          <th>测试 4 结果</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><code>slice(-3)</code></td>
                          <td>
                            Honda Accord / Toyota Highlander / Ford Explorer
                            （第 2、3、4 次）
                          </td>
                          <td>✓ 正确</td>
                        </tr>
                        <tr>
                          <td><code>slice(0, 3)</code></td>
                          <td>
                            Ford Fusion / Honda Accord / Toyota Highlander
                            （第 1、2、3 次）
                          </td>
                          <td>
                            ✕ 最后一行断言直接炸 ——
                            <code>Ford Fusion</code> 还在 DOM 里
                          </td>
                        </tr>
                        <tr>
                          <td><code>slice(3)</code></td>
                          <td>从第 4 个开始到结尾（只剩 1 条）</td>
                          <td>✕ <code>toHaveLength(3)</code> 收到 1</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    <strong>注意 <code>slice(0, 3)</code> 有多阴：</strong>
                    <code>toHaveLength(3)</code> 会过，
                    因为它确实是 3 条。
                    <strong>只有最后那句
                    <code>queryByText(/Ford Fusion/)</code> 抓得住它。</strong>
                    <br />
                    这就是测试 4 为什么要写那一句 ——
                    <strong>光查数量不够，得查「该消失的真的消失了」。</strong>
                  </p>
                  <p>
                    <strong>会追问：</strong>
                    「数组不足三条时 <code>slice(-3)</code> 会怎样？」——
                    <strong>安全</strong>。只有 1 条时返回那 1 条，
                    空数组时返回空数组，<strong>不会报错也不会补 undefined</strong>。
                    所以测试 1（空历史）和测试 3（1 条）都不用特殊处理。
                    <br />
                    这一点值得记住：<strong><code>slice</code> 越界不抛错</strong>，
                    这也是它比手写下标循环安全的地方。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    <strong>In one line:</strong> <code>arr.slice(-3)</code> takes the{" "}
                    <strong>last</strong> three; <code>arr.slice(0, 3)</code> takes the{" "}
                    <strong>first</strong> three.
                  </p>
                  <p>
                    <strong>Start from how the data is ordered:</strong>{" "}
                    <code>updateBookedCabDetails</code> uses{" "}
                    <code>[...rideHistory, details]</code>, so{" "}
                    <strong>new records are appended at the tail</strong>. The array runs
                    oldest to newest.
                  </p>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Written as</th>
                          <th>What you get</th>
                          <th>Test 4</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><code>slice(-3)</code></td>
                          <td>
                            Honda Accord / Toyota Highlander / Ford Explorer (bookings 2,
                            3, 4)
                          </td>
                          <td>✓ correct</td>
                        </tr>
                        <tr>
                          <td><code>slice(0, 3)</code></td>
                          <td>
                            Ford Fusion / Honda Accord / Toyota Highlander (bookings 1, 2,
                            3)
                          </td>
                          <td>
                            ✕ the last assertion fails —{" "}
                            <code>Ford Fusion</code> is still in the DOM
                          </td>
                        </tr>
                        <tr>
                          <td><code>slice(3)</code></td>
                          <td>From index 3 to the end (only 1 entry)</td>
                          <td>✕ <code>toHaveLength(3)</code> receives 1</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    <strong>Notice how sneaky <code>slice(0, 3)</code> is:</strong>{" "}
                    <code>toHaveLength(3)</code> passes, because there really are three
                    rows.{" "}
                    <strong>
                      Only that final <code>queryByText(/Ford Fusion/)</code> line catches
                      it.
                    </strong>
                    <br />
                    Which is precisely why test 4 has that line —{" "}
                    <strong>
                      counting is not enough; you have to check that what should be gone is
                      gone.
                    </strong>
                  </p>
                  <p>
                    <strong>Follow-up:</strong> &ldquo;What does{" "}
                    <code>slice(-3)</code> do with fewer than three entries?&rdquo; —{" "}
                    <strong>it is safe</strong>. With one entry it returns that one; with
                    an empty array it returns an empty array;{" "}
                    <strong>no error and no undefined padding</strong>. So test 1 (empty)
                    and test 3 (one entry) need no special handling.
                    <br />
                    Worth remembering:{" "}
                    <strong><code>slice</code> never throws on out-of-range</strong>,
                    which is one reason it beats a hand-written index loop.
                  </p>
                </>
              ),
              code: [
                demo(
                  "js",
                  `const history = ["Ford Fusion", "Honda Accord", "Toyota Highlander", "Ford Explorer"];
//                     ↑ 最旧（第 1 次）                              最新（第 4 次）↑

history.slice(-3);
// ["Honda Accord", "Toyota Highlander", "Ford Explorer"]   ← 最新三条 ✓

history.slice(0, 3);
// ["Ford Fusion", "Honda Accord", "Toyota Highlander"]     ← 最旧三条 ✕

history.slice(-3).reverse();
// ["Ford Explorer", "Toyota Highlander", "Honda Accord"]   ← 最新在最上 ✓
//    这正是测试 4 断言的顺序

// slice 越界是安全的：
["A"].slice(-3);   // ["A"]
[].slice(-3);      // []`,
                  { filename: "四条记录走一遍（示意）" },
                ),
              ],
            },
            {
              id: "cb-reverse-mutates",
              heading: "reverse() 原地修改 —— 这里为什么安全",
              headingEn: "reverse() changes the array in place, and why that is safe here",
              lede: "因为 slice 已经给了你一个新数组",
              ledeEn:
                "Because slice has already given you a new array",
              body: (
                <>
                  <p>
                    <strong>一句话：</strong>
                    <code>reverse()</code> 会<strong>改掉它作用的那个数组本身</strong>，
                    但 <code>slice()</code> 返回的是新数组，
                    所以 <code>slice(-3).reverse()</code> 改的是那个副本，
                    <strong>碰不到 state</strong>。
                  </p>
                  <p>
                    <strong>直接写 <code>rideHistory.reverse()</code> 会怎样：</strong>
                  </p>
                  <ul>
                    <li>
                      state 数组<strong>被就地翻转了</strong> ——
                      现在它是「最新 → 最旧」；
                    </li>
                    <li>
                      React 不知道（引用没变，
                      <strong>连重渲染都不会触发</strong>）；
                    </li>
                    <li>
                      下次 <code>[...rideHistory, details]</code>
                      把新记录追加在<strong>已经翻转过的数组</strong>尾部 ——
                      顺序彻底乱了；
                    </li>
                    <li>
                      <strong>而且每次渲染都翻一次</strong>，
                      顺序在两种排列之间来回跳。
                    </li>
                  </ul>
                  <p>
                    <strong>这个 bug 的表现极不稳定</strong>，
                    因为它取决于渲染了几次 ——
                    <code>StrictMode</code> 开发模式下渲染两次，翻两次等于没翻，
                    <strong>开发时看着正常，生产环境反而是错的</strong>。
                  </p>
                  <p>
                    <strong>JS 里哪些数组方法原地改：</strong>
                  </p>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>原地修改（改原数组）</th>
                          <th>返回新数组（安全）</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <code>push</code> / <code>pop</code> /{" "}
                            <code>shift</code> / <code>unshift</code>
                          </td>
                          <td>
                            <code>slice</code> / <code>concat</code> /{" "}
                            <code>map</code> / <code>filter</code>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <code>splice</code> / <code>sort</code> /{" "}
                            <code>reverse</code> / <code>fill</code>
                          </td>
                          <td>
                            <code>[...arr]</code> /{" "}
                            <code>toSorted</code> / <code>toReversed</code>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    <strong>三个最容易忘的是
                    <code>sort</code> / <code>reverse</code> / <code>splice</code></strong> ——
                    它们看起来像「计算」，实际是「修改」。
                    <br />
                    <strong>会追问：</strong>「有没有不改原数组的版本？」——
                    有，<code>toSorted()</code> / <code>toReversed()</code> /{" "}
                    <code>toSpliced()</code>，ES2023 加的，
                    Node 20+ 和现代浏览器都支持。
                    <strong>但这道题的 <code>slice(-3).reverse()</code> 已经安全了，
                    没必要换</strong> —— 知道有这么个东西就行。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    <strong>In one line:</strong> <code>reverse()</code>{" "}
                    <strong>mutates the array it is called on</strong>, but{" "}
                    <code>slice()</code> hands back a new array — so{" "}
                    <code>slice(-3).reverse()</code> reverses the copy and{" "}
                    <strong>never touches state</strong>.
                  </p>
                  <p>
                    <strong>
                      What a bare <code>rideHistory.reverse()</code> would do:
                    </strong>
                  </p>
                  <ul>
                    <li>
                      The state array is <strong>flipped in place</strong> — it now runs
                      newest to oldest;
                    </li>
                    <li>
                      React has no idea (the reference did not change, so{" "}
                      <strong>not even a re-render is triggered</strong>);
                    </li>
                    <li>
                      The next <code>[...rideHistory, details]</code> appends to an{" "}
                      <strong>already-reversed array</strong>, and the ordering is now
                      meaningless;
                    </li>
                    <li>
                      <strong>And it flips again on every render</strong>, so the order
                      oscillates between two arrangements.
                    </li>
                  </ul>
                  <p>
                    <strong>The bug is wildly unstable</strong> because it depends on the
                    render count — <code>StrictMode</code> renders twice in development,
                    two flips cancel out, so{" "}
                    <strong>
                      it looks right while you develop and is wrong in production
                    </strong>
                    .
                  </p>
                  <p>
                    <strong>Which array methods mutate:</strong>
                  </p>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Mutating (changes the original)</th>
                          <th>Returns a new array (safe)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <code>push</code> / <code>pop</code> /{" "}
                            <code>shift</code> / <code>unshift</code>
                          </td>
                          <td>
                            <code>slice</code> / <code>concat</code> /{" "}
                            <code>map</code> / <code>filter</code>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <code>splice</code> / <code>sort</code> /{" "}
                            <code>reverse</code> / <code>fill</code>
                          </td>
                          <td>
                            <code>[...arr]</code> /{" "}
                            <code>toSorted</code> / <code>toReversed</code>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    <strong>
                      The three people forget are <code>sort</code> /{" "}
                      <code>reverse</code> / <code>splice</code>
                    </strong>{" "}
                    — they read like computations and are really mutations.
                    <br />
                    <strong>Follow-up:</strong> &ldquo;Are there non-mutating
                    versions?&rdquo; — yes: <code>toSorted()</code> /{" "}
                    <code>toReversed()</code> / <code>toSpliced()</code>, added in ES2023
                    and available in Node 20+ and current browsers.{" "}
                    <strong>
                      But <code>slice(-3).reverse()</code> here is already safe, so there
                      is no need to switch
                    </strong>{" "}
                    — just know they exist.
                  </p>
                </>
              ),
              code: [
                real("jsx", SRC_HISTORY, {
                  filename: "src/components/Home/RideHistory.jsx",
                  sourceFile: "cab-booking-context/src/components/Home/RideHistory.jsx",
                  highlight: [5],
                }),
                demo(
                  "js",
                  `// ✓ 安全：slice 先造了新数组，reverse 改的是那个副本
const latestRides = rideHistory.slice(-3).reverse();

// ✕ 危险：直接翻转 state 本身
const latestRides = rideHistory.reverse();
//                              ↑ 改的是 state 数组
//   引用没变 → React 不重渲染
//   下次 append 接在翻转后的尾部 → 顺序全乱
//   每次渲染翻一次 → StrictMode 下翻两次，开发时看不出来

// ✓ 另一种安全写法（ES2023）
const latestRides = rideHistory.slice(-3).toReversed();

// ✓ 或者先复制再翻
const latestRides = [...rideHistory].reverse().slice(0, 3);
//   注意这个顺序也对，但多复制了整个数组`,
                  { filename: "四种写法对比（示意）" },
                ),
              ],
            },
            {
              id: "cb-optional-chain",
              heading: "bookedCabDetails?.name —— 那个问号不能省",
              headingEn: "bookedCabDetails?.name: you cannot drop that question mark",
              lede: "初始值是 null，而 null 上取属性会抛错",
              ledeEn:
                "The initial value is null, and reading a property of null throws an error",
              body: (
                <>
                  <p>
                    <strong>一句话：</strong>
                    <code>bookedCabDetails</code> 初始是 <code>null</code>，
                    <code>null.name</code> 会抛
                    <code>TypeError</code>，所以要写 <code>?.name</code>。
                  </p>
                  <p>
                    <strong>什么时候真的是 null：</strong>
                  </p>
                  <ul>
                    <li>
                      App 刚启动、用户还没选过任何车 ——
                      这时 <code>CabConfirmation</code> 没被渲染，所以撞不到；
                    </li>
                    <li>
                      <strong>但只要有人把 <code>CabConfirmation</code>
                      单独 render 出来测试</strong>
                      （比如写一个组件级单测），
                      就会立刻炸；
                    </li>
                    <li>
                      或者以后加一个「查看上次行程」的入口，
                      在没有行程时点进去 ——
                      <strong>白屏 + 控制台一行
                      <code>Cannot read properties of null (reading &apos;name&apos;)</code></strong>。
                    </li>
                  </ul>
                  <p>
                    <strong>可选链 <code>?.</code> 做什么：</strong>
                    左边是 <code>null</code> 或 <code>undefined</code> 时
                    <strong>整个表达式短路成 <code>undefined</code></strong>，
                    不抛错。
                    而 React 遇到 <code>{"{undefined}"}</code>
                    <strong>什么也不渲染</strong>（不是渲染字符串
                    &ldquo;undefined&rdquo;），
                    所以页面只是少一段文字，不会崩。
                  </p>
                  <p>
                    <strong>注意它只挡 null / undefined</strong> ——
                    <code>bookedCabDetails</code> 是 <code>{"{}"}</code> 时
                    <code>?.name</code> 照样是 <code>undefined</code>，
                    但那是<strong>属性不存在</strong>，不是崩溃。
                    <strong><code>?.</code> 防的是「取属性的动作本身炸掉」。</strong>
                  </p>
                  <p>
                    <strong>会追问：</strong>「那是不是所有地方都该加 <code>?.</code>？」——
                    <strong>不是。</strong>
                    到处加 <code>?.</code> 会把「这里可能没有值」这个信息
                    <strong>抹平成噪音</strong>，
                    真正可能为空的地方反而看不出来。
                    <br />
                    <strong>规则是：只在「这个值确实可能不存在」的地方加。</strong>
                    这道题里 <code>bookedCabDetails</code> 初始 <code>null</code>，
                    该加；<code>ride.name</code> 是遍历出来的记录，
                    <strong>能进数组就一定有 name，不该加</strong>。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    <strong>In one line:</strong> <code>bookedCabDetails</code> starts as{" "}
                    <code>null</code>, and <code>null.name</code> throws a{" "}
                    <code>TypeError</code>, so you write <code>?.name</code>.
                  </p>
                  <p>
                    <strong>When it really is null:</strong>
                  </p>
                  <ul>
                    <li>
                      Right after the app starts, before the user has picked anything —
                      but <code>CabConfirmation</code> is not rendered then, so nothing
                      breaks;
                    </li>
                    <li>
                      <strong>
                        The moment somebody renders <code>CabConfirmation</code> on its own
                      </strong>{" "}
                      — say in a component-level unit test — it throws immediately;
                    </li>
                    <li>
                      Or add a &ldquo;view your last ride&rdquo; entry point later and
                      open it with no rides:{" "}
                      <strong>
                        blank screen and one console line reading{" "}
                        <code>
                          Cannot read properties of null (reading &apos;name&apos;)
                        </code>
                      </strong>
                      .
                    </li>
                  </ul>
                  <p>
                    <strong>What optional chaining does:</strong> when the left side is{" "}
                    <code>null</code> or <code>undefined</code>,{" "}
                    <strong>
                      the whole expression short-circuits to <code>undefined</code>
                    </strong>{" "}
                    instead of throwing. And React renders{" "}
                    <strong>nothing at all</strong> for <code>{"{undefined}"}</code> (not
                    the literal string &ldquo;undefined&rdquo;), so the page is just
                    missing a phrase rather than crashing.
                  </p>
                  <p>
                    <strong>It only guards null and undefined</strong> — with{" "}
                    <code>bookedCabDetails</code> as <code>{"{}"}</code>,{" "}
                    <code>?.name</code> is still <code>undefined</code>, but that is a{" "}
                    <strong>missing property</strong>, not a crash.{" "}
                    <strong>
                      <code>?.</code> protects against the property access itself blowing
                      up.
                    </strong>
                  </p>
                  <p>
                    <strong>Follow-up:</strong> &ldquo;Should I add <code>?.</code>{" "}
                    everywhere then?&rdquo; — <strong>no.</strong> Sprinkling it everywhere{" "}
                    <strong>
                      flattens the signal &ldquo;this might be absent&rdquo; into noise
                    </strong>
                    , and the places that genuinely can be empty stop standing out.
                    <br />
                    <strong>
                      The rule: add it only where the value really can be missing.
                    </strong>{" "}
                    Here <code>bookedCabDetails</code> starts as <code>null</code>, so it
                    earns one; <code>ride.name</code> comes from iterating records that{" "}
                    <strong>always have a name to be in the array at all</strong>, so it
                    does not.
                  </p>
                </>
              ),
              code: [
                real("jsx", SRC_CONFIRM, {
                  filename: "src/components/CabConfirmation/CabConfirmation.jsx",
                  sourceFile:
                    "cab-booking-context/src/components/CabConfirmation/CabConfirmation.jsx",
                  highlight: [13],
                }),
              ],
            },
          ],
          callouts: [
            {
              tone: "warn",
              title: "测试 4 是这门课的「假通过」检测器",
              body: (
                <>
                  写成 <code>slice(0, 3)</code>：历史确实是 3 条，
                  <strong><code>toHaveLength(3)</code> 会过</strong>，
                  页面上也确实有三行 ——
                  <strong>肉眼看不出错</strong>。
                  <br />
                  抓住它的只有最后那一句
                  <code>expect(screen.queryByText(/Ford Fusion/)).not.toBeInTheDocument()</code>。
                  <br />
                  <strong>这是本站主线 ① 的又一个实例：</strong>
                  测试写得细，才抓得住「数量对但内容错」这种问题。
                  你自己写测试的时候，
                  <strong>光断言「有几个」几乎总是不够的。</strong>
                </>
              ),
            },
          ],
          exercises: [
            {
              id: "cb-slice-recognition",
              kind: "recognition",
              level: 1,
              title: "哪些写法能让测试 4 全绿？（多选）",
              prompt: (
                <>
                  历史是 <code>[Fusion, Accord, Highlander, Explorer]</code>
                  （最旧 → 最新）。
                  断言要求：3 条、顺序
                  <code>Explorer / Highlander / Accord</code>、
                  <code>Fusion</code> 不在 DOM 里。
                </>
              ),
              options: [
                { id: "a", label: "rideHistory.slice(-3).reverse()" },
                { id: "b", label: "rideHistory.slice(0, 3).reverse()" },
                { id: "c", label: "[...rideHistory].reverse().slice(0, 3)" },
                { id: "d", label: "rideHistory.reverse().slice(0, 3)" },
                { id: "e", label: "rideHistory.slice(-3).toReversed()" },
              ],
              answer: ["a", "c", "e"],
              explain: (
                <>
                  <strong>A、C、E 都对。</strong>
                  <ul>
                    <li>
                      <strong>A</strong> —— 源项目写法。
                      <code>slice</code> 先造新数组，<code>reverse</code> 改副本。
                    </li>
                    <li>
                      <strong>C</strong> —— 先整体复制再翻转再取前三，
                      结果一样。<strong>多复制了整个数组</strong>，
                      历史只有几条时无所谓。
                    </li>
                    <li>
                      <strong>E</strong> —— <code>toReversed()</code>（ES2023）
                      本身就返回新数组，最明确。
                    </li>
                  </ul>
                  <strong>B 错：</strong>取的是最旧三条再翻转，
                  变成 <code>Highlander / Accord / Fusion</code> ——
                  数量对、顺序看着也「像」倒序，
                  <strong>但 Fusion 还在，最后一句断言炸</strong>。
                  <br />
                  <strong>D 错得最隐蔽：</strong>结果数组
                  <strong>是对的</strong>（<code>Explorer / Highlander / Accord</code>），
                  测试第一次跑甚至可能过 ——
                  但 <code>reverse()</code> 已经<strong>把 state 就地翻转了</strong>。
                  下一次订车 append 到翻转后的尾部，顺序从此错乱；
                  而且每次渲染翻一次。
                  <strong>这是「当次结果对、后续全错」的典型，
                  也是为什么不能只看一次测试结果。</strong>
                </>
              ),
            },
            {
              id: "cb-history-write",
              kind: "code-completion",
              level: 3,
              title: "从零写出 RideHistory",
              prompt: (
                <>
                  从 Context 读历史，取最新三条、最新在最上，
                  空的时候显示空状态。检查器会挡住原地修改。
                </>
              ),
              language: "jsx",
              filename: "src/components/Home/RideHistory.jsx",
              starter: `import { useCabContext } from "../../context/CabContext";

// 要求：
// 1. 从 Context 读 rideHistory
// 2. 取最新三条，最新的排最上面
// 3. 有记录：<ul> 里每条一个 <li data-testid="history-cabs">，
//    显示车名和 $价格
// 4. 空的时候：<p data-testid="no-ride-title">No ride history yet.</p>
// 5. 不许原地修改 state（不许直接 reverse / sort / push 到 rideHistory 上）

const RideHistory = () => {
`,
              requirements: [
                "从 useCabContext() 里读 rideHistory",
                "取最新三条并让最新的排在最上面（slice(-3).reverse() 或等价写法）",
                "不许在 rideHistory 上直接调 reverse / sort —— 那会原地改 state",
                "每条记录一个 <li data-testid=\"history-cabs\">，里面有车名和 $价格",
                "空历史显示 <p data-testid=\"no-ride-title\">No ride history yet.</p>，且此时不渲染列表",
                "key 不能只用 ride.id —— 同一辆车可以被订两次",
              ],
              checks: [
                {
                  label: "读了 rideHistory",
                  must: "useCabContext\\(\\)[\\s\\S]{0,120}rideHistory",
                },
                {
                  label: "取的是最新三条（slice(-3) 或先复制再翻转）",
                  must: "slice\\(\\s*-3\\s*\\)|\\[\\s*\\.\\.\\.rideHistory\\s*\\]\\s*\\.(reverse|toReversed)",
                },
                {
                  label: "做了反转（最新在最上）",
                  must: "reverse\\(\\)|toReversed\\(\\)",
                },
                {
                  label: "没有直接 reverse / sort 到 state 上",
                  mustNot: "rideHistory\\s*\\.\\s*(reverse|sort)\\s*\\(",
                },
                { label: "没有 push", mustNot: "\\.push\\(" },
                { label: "两个 testid 都在", must: "history-cabs[\\s\\S]*no-ride-title|no-ride-title[\\s\\S]*history-cabs" },
                {
                  label: "空状态文案照抄原文",
                  must: "No ride history yet\\.",
                },
                {
                  label: "key 不是裸 ride.id",
                  mustNot: "key=\\{\\s*ride\\.id\\s*\\}",
                },
              ],
              hints: [
                "两件事：先算出「要显示哪三条、什么顺序」，再决定「有记录 / 没记录」两种渲染。",
                "算列表用 slice 和 reverse 的组合。关键是别让 reverse 碰到 state —— 想清楚 slice 返回的是原数组还是新数组。",
                "const latestRides = rideHistory.slice(-3).reverse();\n然后 return 里：{latestRides.length > 0 ? ( <ul>…</ul> ) : ( <p data-testid=\"no-ride-title\">…</p> )}",
                "每条：<li key={`${ride.id}-${index}`} data-testid=\"history-cabs\"><span>{ride.name}</span><strong>${ride.price}</strong></li>",
              ],
              solution: real("jsx", SRC_HISTORY, {
                filename: "src/components/Home/RideHistory.jsx（参考答案 —— 源项目原文）",
                sourceFile: "cab-booking-context/src/components/Home/RideHistory.jsx",
              }),
            },
          ],
          mistakes: [
            {
              wrong: demo(
                "jsx",
                `// ✕ 直接在 state 上 reverse
const RideHistory = () => {
  const { rideHistory } = useCabContext();
  const latestRides = rideHistory.reverse().slice(0, 3);
  …
};`,
                { filename: "原地翻转 state" },
              ),
              why: (
                <>
                  <strong>这次的结果是对的，下次就不对了。</strong>
                  <code>reverse()</code> 把 state 数组就地翻成「最新 → 最旧」，
                  React 不知道（引用没变）。
                  <br />
                  然后下一次 <code>[...rideHistory, details]</code>
                  把新记录接在<strong>已经翻转过的数组尾部</strong> ——
                  也就是接在「最旧的那一头」，顺序从此彻底乱。
                  <br />
                  更麻烦的是<strong>每次渲染都翻一次</strong>：
                  <code>StrictMode</code> 下开发模式渲染两次，
                  翻两次抵消，<strong>你在开发时看不出任何异常</strong>。
                  <strong>把「读」和「改」分清楚 —— 渲染函数里只许读。</strong>
                </>
              ),
              whyEn: (
                <>
                  <strong>The result is right this time and wrong the next time.</strong>{" "}
                  <code>reverse()</code> turns the state array itself into newest to oldest, and
                  React does not notice, because the reference did not change.
                  <br />
                  The next <code>[...rideHistory, details]</code> then adds the new entry to the end
                  of <strong>an array that is already reversed</strong>, which is the oldest end, and
                  from that point the order is broken.
                  <br />
                  Worse, <strong>it reverses once on every render</strong>. Under{" "}
                  <code>StrictMode</code> development renders twice, the two reversals cancel each
                  other out, and <strong>you see nothing wrong while developing</strong>.{" "}
                  <strong>Keep reading and changing apart: a render function may only read.</strong>
                </>
              ),
            },
            {
              wrong: demo(
                "jsx",
                `// ✕ 忘了可选链
<p data-testid="confirm-message">
  {bookedCabDetails.name} is on the way and will arrive shortly.
</p>

// 单独 render CabConfirmation 时（或任何 bookedCabDetails 还是 null 的时刻）：
// TypeError: Cannot read properties of null (reading 'name')
// → 整个组件树白屏，因为没有 error boundary`,
                { filename: "少一个问号" },
              ),
              why: (
                <>
                  <code>useState(null)</code> 的初始值就是 <code>null</code>。
                  <strong>在完整流程里撞不到</strong>（走到确认页时一定已经选过车），
                  所以四个测试都过 ——
                  <strong>又一次「测试通过 ≠ 做对了」</strong>。
                  <br />
                  但只要有人给 <code>CabConfirmation</code> 写一个组件级单测，
                  或者以后加一个「查看上次行程」的入口，
                  <strong>它就是白屏</strong>。
                  React 没有默认的 error boundary，
                  渲染时抛错会让<strong>整棵树卸载</strong>。
                  <br />
                  <strong>初始值是 null 的 state，读它的属性就该配 <code>?.</code>。</strong>
                </>
              ),
              whyEn: (
                <>
                  The initial value of <code>useState(null)</code> is <code>null</code>.{" "}
                  <strong>The complete flow never reaches it</strong>, because by the time you are on
                  the confirmation page a cab has been chosen, so all four tests pass. This is{" "}
                  <strong>another case where passing tests does not mean correct code</strong>.
                  <br />
                  But as soon as somebody writes a component test for{" "}
                  <code>CabConfirmation</code>, or a &ldquo;view last ride&rdquo; entry point is added
                  later, <strong>the screen is blank</strong>. React has no default error boundary,
                  and an error thrown during render <strong>removes the whole tree</strong>.
                  <br />
                  <strong>
                    When a state starts as null, reading its properties needs <code>?.</code>.
                  </strong>
                </>
              ),
            },
          ],
          transfer: [
            { signal: "要「最新 N 条」", reachFor: "slice(-N)；越界安全，不足 N 条也不报错" },
            { signal: "要倒序显示", reachFor: "先 slice 出副本再 reverse，或用 toReversed()" },
            { signal: "看到 sort / reverse / splice 作用在 state 上", reachFor: "立刻停 —— 它们原地改，先复制" },
            { signal: "某个 state 初始值是 null", reachFor: "读它的属性配 ?.；只在真会为空的地方加" },
            { signal: "测试只断言了「有几个」", reachFor: "补一条「该消失的真的消失了」—— 数量对内容错抓不住" },
          ],
          recap: [
            "slice(-3) 是最后三条，slice(0, 3) 是最前三条 —— 方向写反测试 4 才抓得住。",
            "reverse() 原地修改；slice(-3).reverse() 安全是因为 slice 先给了新数组。",
            "直接 rideHistory.reverse() 会翻掉 state，且 StrictMode 下开发时看不出来。",
            "sort / reverse / splice / push 都是原地改；slice / map / filter / concat 返回新数组。",
            "bookedCabDetails 初始 null，所以 ?.name 那个问号不能省。",
          ],
          recapEn: [
            "slice(-3) is the last three, slice(0, 3) is the first three. Only test 4 catches the wrong direction.",
            "reverse() changes the array in place; slice(-3).reverse() is safe because slice returns a new array first.",
            "Calling rideHistory.reverse() reverses the state itself, and under StrictMode you cannot see it while developing.",
            "sort, reverse, splice and push all change the array in place; slice, map, filter and concat return a new array.",
            "bookedCabDetails starts as null, so the question mark in ?.name cannot be dropped.",
          ],
        },
      ],
    },
    /* ============================================================
       第 3 部分 —— 验收
       ============================================================ */
    {
      id: "cab-verify",
      title: "验收：脚手架的坑、面试追问、从零重写",
      titleEn: "Checking your work: the defect in the provided project, interview follow-up questions, and rewriting in an empty folder",
      summary:
        "三件事：修掉那个让「完整答案」原样跑不起来的缺陷；把源项目两处「测试能过但面试会被问」的写法说清楚；然后在空文件夹里重写一遍。",
      summaryEn:
        "Three things: fix the defect that stops the complete answer from running as given; explain two places in the source project where the code passes the tests but an interviewer would still ask about it; then write the whole app again in an empty folder.",
      stage: "Cab Booking · 第 3 部分",
      lessons: [
        {
          id: "cb-scaffold-bug",
          title: "完整答案跑不起来 —— 一个扩展名的事",
          titleEn: "The complete answer does not run — the cause is one file extension",
          blurb: "README 说「先运行完整答案熟悉流程」。实测 0 个测试跑起来。",
          blurbEn:
            "The README says to run the complete answer first to get used to the flow. In practice 0 tests start.",
          minutes: 13,
          objectives: [
            "读懂「Failed to parse source for import analysis」这条报错",
            "说清 Vite 为什么默认不在 .js 里解析 JSX",
            "在两种修法里选对的那个，并说出为什么",
            "养成「先跑一次基线」的习惯",
          ],
          objectivesEn: [
            "Understand the error message \"Failed to parse source for import analysis\"",
            "Explain why Vite does not parse JSX inside .js files by default",
            "Pick the right one of the two fixes, and say why",
            "Build the habit of running the project once as a baseline first",
          ],
          whyForAssessment:
            "这是本站主线 ③「脚手架本身也会有问题」的又一个实例，而且这次踩得最狠 —— 不是某个测试失败，是 0 个测试跑起来。真实考试里遇到这种情况，能不能在两分钟内判断出「是环境问题不是我写错了」，直接决定你剩下的时间怎么花。",
          whyForAssessmentEn:
            "This is another example of theme 3 on this site: the project you are given can be broken itself. This case is the worst one. It is not that one test fails, it is that 0 tests start. In a real exam, being able to decide within two minutes that the setup is at fault and not your code decides how you spend the rest of your time.",
          sourceFiles: [
            { path: "cab-booking-context/src/context/CabContext.js", role: "缺陷本体：.js 扩展名 + 文件里有 JSX", edit: true },
            { path: "cab-booking-context/vite.config.mjs", role: "另一种（不推荐的）修法会改这里" },
          ],
          concepts: [
            {
              id: "cb-jsx-ext",
              heading: "为什么 .js 里的 JSX 会炸",
              headingEn: "Why JSX inside a .js file fails",
              lede: "esbuild 默认按扩展名决定用哪个 loader",
              ledeEn:
                "By default esbuild picks the loader from the file extension",
              body: (
                <>
                  <p>
                    <strong>一句话：</strong>Vite 用 esbuild 转换文件，
                    <strong>esbuild 按扩展名选 loader</strong> ——
                    <code>.jsx</code> 用 jsx loader，
                    <code>.js</code> 用 js loader，
                    <strong>而 js loader 不认识 <code>&lt;div&gt;</code> 这种语法</strong>。
                  </p>
                  <p>
                    <strong>报错读法（这条值得逐行拆）：</strong>
                  </p>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>报错里的这一段</th>
                          <th>告诉你什么</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><code>Failed to parse source for import analysis</code></td>
                          <td>
                            连<strong>解析</strong>都没过 ——
                            不是运行时错误，是编译前就挂了
                          </td>
                        </tr>
                        <tr>
                          <td><code>Plugin: vite:import-analysis</code></td>
                          <td>
                            是 Vite 的插件报的，不是 React、不是 vitest ——
                            <strong>问题在构建层</strong>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <code>If you are using JSX, make sure to name the file with
                            the .jsx or .tsx extension.</code>
                          </td>
                          <td>
                            <strong>它直接把答案说了</strong> ——
                            这类报错要读到最后一句
                          </td>
                        </tr>
                        <tr>
                          <td><code>File: …/src/context/CabContext.js:19:27</code></td>
                          <td>
                            精确到行列。19 行 27 列是{" "}
                            <code>&lt;/CabContext.Provider&gt;</code> 的末尾
                          </td>
                        </tr>
                        <tr>
                          <td><code>Test Files 1 failed / Tests no tests</code></td>
                          <td>
                            <strong>「no tests」是关键词</strong> ——
                            一个测试都没跑，不是跑了但失败
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    <strong>为什么 esbuild 不干脆都按 JSX 解析：</strong>
                    因为 JSX 语法和普通 JS 有冲突。
                    最典型的是<strong>类型断言的尖括号</strong>和
                    <code>&lt;</code> 作为比较运算符的情况 ——
                    <code>a &lt; b &gt; c</code> 在 JS 里是两次比较，
                    按 JSX 解析就可能被当成标签。
                    <strong>所以只能靠扩展名声明「这个文件里有 JSX」。</strong>
                  </p>
                  <p>
                    <strong>会追问：</strong>
                    「Create React App 里 <code>.js</code> 写 JSX 就没事啊？」——
                    对，CRA 用 Babel 且配置成对所有 <code>.js</code>
                    都跑 JSX 转换。
                    <strong>这是工具链的选择，不是语言规定。</strong>
                    Vite 选了「按扩展名」，
                    所以从 CRA 迁到 Vite 的项目
                    <strong>经常一片红</strong>，全是这个原因。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    <strong>In one line:</strong> Vite transforms files with esbuild, and{" "}
                    <strong>esbuild picks its loader from the extension</strong> —{" "}
                    <code>.jsx</code> gets the jsx loader, <code>.js</code> gets the js
                    loader, and{" "}
                    <strong>
                      the js loader does not understand syntax like{" "}
                      <code>&lt;div&gt;</code>
                    </strong>
                    .
                  </p>
                  <p>
                    <strong>How to read the error (worth taking line by line):</strong>
                  </p>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>This part of the error</th>
                          <th>What it tells you</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><code>Failed to parse source for import analysis</code></td>
                          <td>
                            It never got past <strong>parsing</strong> — not a runtime
                            error, it died before compilation
                          </td>
                        </tr>
                        <tr>
                          <td><code>Plugin: vite:import-analysis</code></td>
                          <td>
                            A Vite plugin reported it, not React and not vitest —{" "}
                            <strong>the problem is in the build layer</strong>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <code>If you are using JSX, make sure to name the file with
                            the .jsx or .tsx extension.</code>
                          </td>
                          <td>
                            <strong>It states the answer outright</strong> — read this
                            kind of error all the way to the last sentence
                          </td>
                        </tr>
                        <tr>
                          <td><code>File: …/src/context/CabContext.js:19:27</code></td>
                          <td>
                            Line and column. 19:27 is the end of{" "}
                            <code>&lt;/CabContext.Provider&gt;</code>
                          </td>
                        </tr>
                        <tr>
                          <td><code>Test Files 1 failed / Tests no tests</code></td>
                          <td>
                            <strong>&ldquo;no tests&rdquo; is the keyword</strong> — not
                            one test ran, as opposed to running and failing
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    <strong>Why esbuild does not just parse everything as JSX:</strong>{" "}
                    because JSX syntax collides with plain JS. The classic cases are{" "}
                    <strong>angle brackets in type assertions</strong> and{" "}
                    <code>&lt;</code> as a comparison operator —{" "}
                    <code>a &lt; b &gt; c</code> is two comparisons in JS but could be read
                    as a tag under JSX rules.{" "}
                    <strong>
                      So the extension is how you declare &ldquo;this file contains
                      JSX&rdquo;.
                    </strong>
                  </p>
                  <p>
                    <strong>Follow-up:</strong> &ldquo;But JSX in <code>.js</code> works
                    fine in Create React App?&rdquo; — right; CRA uses Babel and is
                    configured to run the JSX transform on every <code>.js</code> file.{" "}
                    <strong>
                      That is a toolchain choice, not a language rule.
                    </strong>{" "}
                    Vite chose extension-based, which is why projects migrating from CRA to
                    Vite <strong>often light up red</strong> for exactly this reason.
                  </p>
                </>
              ),
              code: [
                demo(
                  "text",
                  ` RUN  v2.1.8 /Users/you/cab-booking-context

 ❯ src/test/App.test.jsx (0 test)

⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/test/App.test.jsx [ src/test/App.test.jsx ]
Error: Failed to parse source for import analysis because the content contains invalid JS syntax. If you are using JSX, make sure to name the file with the .jsx or .tsx extension.
  Plugin: vite:import-analysis
  File: /Users/you/cab-booking-context/src/context/CabContext.js:19:27
  17 |      >
  18 |        {children}
  19 |      </CabContext.Provider>
     |                            ^
  20 |    );
  21 |  };

 Test Files  1 failed (1)
      Tests  no tests`,
                  {
                    filename: "npx vitest run 的真实输出（本机实测，路径已改短）",
                    explanation:
                      "「Tests no tests」这五个字是最重要的信号 —— 一个测试都没跑起来。这时候去改组件代码是白费功夫。",
                  },
                ),
              ],
            },
            {
              id: "cb-two-fixes",
              heading: "两种修法，选哪个",
              headingEn: "Two ways to fix it, and which one to pick",
              lede: "改扩展名，还是改构建配置",
              ledeEn:
                "Change the file extension, or change the build configuration",
              body: (
                <>
                  <p>
                    <strong>一句话：</strong>
                    <strong>改扩展名。</strong>
                    改构建配置能让它跑起来，但代价不对。
                  </p>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th></th>
                          <th>① 改名 .js → .jsx</th>
                          <th>② 改 vite.config.mjs</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>怎么做</td>
                          <td>
                            <code>mv CabContext.js CabContext.jsx</code>
                          </td>
                          <td>
                            加{" "}
                            <code>
                              esbuild: {"{ loader: { \".js\": \"jsx\" } }"}
                            </code>
                          </td>
                        </tr>
                        <tr>
                          <td>要改多少 import</td>
                          <td>
                            <strong>0 个</strong> —— 所有 import 都是
                            <code>from &quot;./context/CabContext&quot;</code>，
                            没写扩展名
                          </td>
                          <td>0 个</td>
                        </tr>
                        <tr>
                          <td>影响范围</td>
                          <td>一个文件</td>
                          <td>
                            <strong>整个项目所有 <code>.js</code></strong>
                            都按 JSX 解析
                          </td>
                        </tr>
                        <tr>
                          <td>代价</td>
                          <td>没有</td>
                          <td>
                            掩盖了问题本身；以后再有人在 <code>.js</code>{" "}
                            里写 JSX 也不会被发现；
                            <strong>换个构建工具（Jest / Next / tsc）
                            又会炸</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    <strong>为什么改名不用动 import：</strong>
                    ES 模块的路径在浏览器里必须写全扩展名，
                    但<strong>打包器会做「扩展名解析」</strong> ——
                    看到 <code>./context/CabContext</code>
                    就依次试 <code>.js</code> / <code>.jsx</code> /{" "}
                    <code>.ts</code> / <code>.tsx</code> / <code>.json</code>。
                    所以只要 import 没写扩展名，改名就是无痛的。
                    <strong>这也是为什么「import 不写扩展名」在打包项目里是好习惯。</strong>
                  </p>
                  <p>
                    <strong>更一般的判断标准：</strong>
                    <strong>能改一个文件解决的，别去改全局配置。</strong>
                    全局配置的每一行都是「以后所有人都要遵守的规则」，
                    而这里真正的问题只是<strong>一个文件的名字起错了</strong>。
                  </p>
                  <p>
                    <strong>会追问：</strong>
                    「那真实项目里什么时候该改配置？」——
                    当「不合规」的文件多到改不动的时候
                    （比如从 CRA 迁过来的几百个 <code>.js</code>）。
                    <strong>那时改配置是过渡手段</strong>，
                    通常配一条 lint 规则 + 计划分批改名。
                    <strong>一个文件的时候改配置，是拿长期换短期。</strong>
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    <strong>In one line:</strong>{" "}
                    <strong>rename the file.</strong> Changing the build config also makes
                    it run, but the price is wrong.
                  </p>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th></th>
                          <th>(1) Rename .js → .jsx</th>
                          <th>(2) Edit vite.config.mjs</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>How</td>
                          <td>
                            <code>mv CabContext.js CabContext.jsx</code>
                          </td>
                          <td>
                            Add{" "}
                            <code>
                              esbuild: {"{ loader: { \".js\": \"jsx\" } }"}
                            </code>
                          </td>
                        </tr>
                        <tr>
                          <td>Imports to change</td>
                          <td>
                            <strong>None</strong> — every import is{" "}
                            <code>from &quot;./context/CabContext&quot;</code>, with no
                            extension
                          </td>
                          <td>None</td>
                        </tr>
                        <tr>
                          <td>Blast radius</td>
                          <td>One file</td>
                          <td>
                            <strong>
                              Every <code>.js</code> in the project
                            </strong>{" "}
                            is now parsed as JSX
                          </td>
                        </tr>
                        <tr>
                          <td>Cost</td>
                          <td>None</td>
                          <td>
                            Hides the actual problem; the next person writing JSX in a{" "}
                            <code>.js</code> file will not be caught; and{" "}
                            <strong>
                              it breaks again under a different toolchain (Jest, Next,
                              tsc)
                            </strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    <strong>Why renaming touches no imports:</strong> ES module paths need
                    full extensions in a browser, but{" "}
                    <strong>bundlers perform extension resolution</strong> — given{" "}
                    <code>./context/CabContext</code> they try <code>.js</code> /{" "}
                    <code>.jsx</code> / <code>.ts</code> / <code>.tsx</code> /{" "}
                    <code>.json</code> in turn. So as long as imports omit the extension,
                    renaming is painless.{" "}
                    <strong>
                      Which is also why omitting extensions in imports is a good habit in
                      a bundled project.
                    </strong>
                  </p>
                  <p>
                    <strong>The more general rule:</strong>{" "}
                    <strong>
                      if one file fixes it, do not reach for the global config.
                    </strong>{" "}
                    Every line of global config is a rule everyone has to live with
                    afterwards, and the real problem here is just{" "}
                    <strong>one file with the wrong name</strong>.
                  </p>
                  <p>
                    <strong>Follow-up:</strong> &ldquo;When is editing the config the
                    right call in a real project?&rdquo; — when there are too many
                    offending files to rename (say hundreds of <code>.js</code> files
                    migrated from CRA).{" "}
                    <strong>Then the config change is a transition measure</strong>,
                    usually paired with a lint rule and a plan to rename in batches.{" "}
                    <strong>
                      Reaching for it over a single file trades the long term for the
                      short term.
                    </strong>
                  </p>
                </>
              ),
            },
            {
              id: "cb-better-writes",
              heading: "两处「测试能过但面试会问」的写法",
              headingEn: "Two places that pass the tests but an interviewer will ask about",
              lede: "不是 bug。但你得知道它们的边界在哪",
              ledeEn:
                "They are not bugs. But you need to know where their limits are",
              body: (
                <>
                  <p>
                    <strong>一句话：</strong>源项目有两处写法
                    <strong>在这个应用里完全正确</strong>，
                    但<strong>换个场景就会出问题</strong> ——
                    面试官很爱问这种。
                  </p>
                  <p>
                    <strong>① <code>updateBookedCabDetails</code>
                    用的是非函数式更新</strong>
                  </p>
                  <p>
                    <code>setRideHistory([...rideHistory, details])</code>
                    读的是<strong>闭包里那个 <code>rideHistory</code></strong>，
                    也就是「本次渲染时的值」。
                    <br />
                    <strong>什么时候会出错：</strong>
                    同一个事件里连调两次 ——
                    第二次读到的还是第一次之前的值，
                    <strong>结果只追加了一条</strong>。
                    <br />
                    <strong>为什么测试撞不到：</strong>
                    每次订车之间都隔着完整的页面切换和重渲染，
                    <code>rideHistory</code> 每次都是最新的。
                    <br />
                    <strong>函数式写法：</strong>
                    <code>setRideHistory((prev) =&gt; [...prev, details])</code> ——
                    <code>prev</code> 是 React 给的<strong>最新值</strong>，
                    跟闭包无关。
                    <strong>只要更新依赖旧值，就用函数式。</strong>
                  </p>
                  <p>
                    <strong>② Provider 的 <code>value</code> 没有记忆化</strong>
                  </p>
                  <p>
                    <code>value={"{{ bookedCabDetails, updateBookedCabDetails, rideHistory }}"}</code>
                    是一个<strong>字面量对象</strong> ——
                    Provider 每次渲染都造一个新的。
                    <br />
                    <strong>后果：</strong>所有 <code>useContext</code>
                    的消费者都会重渲染，
                    <strong>即使它们用的那部分数据没变</strong>。
                    而且 <code>React.memo</code> 挡不住这个 ——
                    context 变化会穿透 memo。
                    <br />
                    <strong>为什么这里无所谓：</strong>
                    只有三个消费者，渲染的东西都很小。
                    <strong>而且 Provider 重渲染的唯一原因就是它自己的
                    state 变了</strong> —— 那时消费者本来就该更新。
                    <br />
                    <strong>标准答案：</strong>
                    <code>useCallback</code> 稳住函数 +{" "}
                    <code>useMemo</code> 稳住 value 对象。
                    本站 <code>/code</code> 里
                    <strong>「主题切换（Context + value 记忆化）」</strong>
                    那道题专门练这个 ——
                    实测删掉 <code>useMemo</code> 之后
                    <strong>功能测试全绿，只有那一条专门查记忆化的挂</strong>。
                  </p>
                  <p>
                    <strong>面试时怎么说才漂亮：</strong>
                    别说「这里写错了」——它没写错。
                    说<strong>「这个写法在当前规模下没问题，
                    因为消费者少且 Provider 只在 state 变化时重渲染；
                    如果 Provider 上面加了会频繁重渲染的父组件，
                    就该上 useMemo / useCallback」</strong>。
                    <strong>能说出「什么条件下会变成问题」，
                    比背出 useMemo 强得多。</strong>
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    <strong>In one line:</strong> the source project has two patterns that
                    are <strong>entirely correct in this app</strong> but{" "}
                    <strong>break in a different setting</strong> — interviewers love
                    asking about exactly this.
                  </p>
                  <p>
                    <strong>
                      (1) <code>updateBookedCabDetails</code> does not use a functional
                      update
                    </strong>
                  </p>
                  <p>
                    <code>setRideHistory([...rideHistory, details])</code> reads{" "}
                    <strong>the <code>rideHistory</code> from its closure</strong>, i.e.
                    the value as of this render.
                    <br />
                    <strong>When that goes wrong:</strong> two calls inside one event — the
                    second still sees the pre-first value, so{" "}
                    <strong>only one entry gets appended</strong>.
                    <br />
                    <strong>Why the tests never hit it:</strong> every booking is separated
                    by a full page switch and re-render, so <code>rideHistory</code> is
                    always current.
                    <br />
                    <strong>The functional form:</strong>{" "}
                    <code>setRideHistory((prev) =&gt; [...prev, details])</code> —{" "}
                    <code>prev</code> is <strong>the latest value</strong>, handed to you
                    by React, with no closure involved.{" "}
                    <strong>
                      Whenever an update depends on the old value, go functional.
                    </strong>
                  </p>
                  <p>
                    <strong>(2) The Provider&rsquo;s <code>value</code> is not memoised</strong>
                  </p>
                  <p>
                    <code>value={"{{ bookedCabDetails, updateBookedCabDetails, rideHistory }}"}</code>{" "}
                    is an <strong>object literal</strong>, so the Provider builds a fresh
                    one on every render.
                    <br />
                    <strong>Consequence:</strong> every <code>useContext</code> consumer
                    re-renders,{" "}
                    <strong>even ones whose slice of the data did not change</strong>. And{" "}
                    <code>React.memo</code> does not stop it — context changes go straight
                    through memo.
                    <br />
                    <strong>Why it does not matter here:</strong> there are three
                    consumers and they all render very little.{" "}
                    <strong>
                      More to the point, the only reason this Provider re-renders is its
                      own state changing
                    </strong>{" "}
                    — and then the consumers should update anyway.
                    <br />
                    <strong>The textbook answer:</strong> <code>useCallback</code> to
                    stabilise the function plus <code>useMemo</code> to stabilise the value
                    object. The{" "}
                    <strong>&ldquo;theme toggle (Context + memoised value)&rdquo;</strong>{" "}
                    problem in <code>/code</code> drills precisely this — measured, removing
                    the <code>useMemo</code> leaves{" "}
                    <strong>
                      every functional test green and only the memoisation test red
                    </strong>
                    .
                  </p>
                  <p>
                    <strong>How to say it well in an interview:</strong> do not say
                    &ldquo;this is wrong&rdquo; — it is not. Say{" "}
                    <strong>
                      &ldquo;this is fine at the current scale, because there are few
                      consumers and the Provider only re-renders when its own state
                      changes; add a frequently re-rendering parent above the Provider and
                      you would want useMemo and useCallback&rdquo;
                    </strong>
                    .{" "}
                    <strong>
                      Naming the condition under which it becomes a problem beats reciting
                      useMemo.
                    </strong>
                  </p>
                </>
              ),
              code: [
                demo(
                  "jsx",
                  `// 源项目的写法 —— 在这个应用里正确
const updateBookedCabDetails = (details) => {
  setBookedCabDetails(details);
  setRideHistory([...rideHistory, details]);   // 读闭包里的值
};

// 更稳的写法 —— 更新依赖旧值时一律这样
const updateBookedCabDetails = useCallback((details) => {
  setBookedCabDetails(details);
  setRideHistory((prev) => [...prev, details]);  // React 给你最新值
}, []);                                          // 依赖空数组：函数身份永远稳定

// value 记忆化
const value = useMemo(
  () => ({ bookedCabDetails, updateBookedCabDetails, rideHistory }),
  [bookedCabDetails, updateBookedCabDetails, rideHistory],
);
// 注意：updateBookedCabDetails 必须先被 useCallback 稳住，
// 否则它每次都是新函数，useMemo 的依赖每次都变 —— 记忆化等于没做。`,
                  {
                    filename: "两处改法（示意 —— 不是源项目代码）",
                    explanation:
                      "最后那句注释是这一组最容易踩的坑：useMemo 的依赖里放了一个每次都新建的函数，等于白写。useCallback 和 useMemo 通常成对出现，就是这个原因。",
                  },
                ),
              ],
            },
          ],
          callouts: [
            {
              tone: "why",
              title: "为什么第一件事永远是「跑一次基线」",
              body: (
                <>
                  拿到任何项目，<strong>先跑测试，把当前状态记下来</strong>。
                  这门课的基线是「0 个测试跑起来」，
                  <strong>知道这一点，你就不会花二十分钟检查自己的组件写没写对</strong>。
                  <br />
                  本站另外三门课的基线也都不是零：
                  node-subgraph 是 <strong>6 failed / 4 passed</strong>
                  （而且 4 个通过里 3 个是「空实现恰好满足断言」的假通过），
                  java-service 是 <strong>5 run / 2 failures</strong>
                  （六个端点全 <code>return null</code> 也过了 3 个），
                  react-notes-app 的 <code>npm run build</code> 原生就失败。
                  <br />
                  <strong>基线不是零，是常态。</strong>
                </>
              ),
            },
          ],
          exercises: [
            {
              id: "cb-ext-debug",
              kind: "debug",
              level: 2,
              title: "Debug Lab：0 个测试跑起来",
              prompt: (
                <>
                  README 说「先运行完整答案熟悉流程」。
                  <code>npm install</code> 成功，
                  <code>npx vitest run</code> 却是下面这个输出。
                  <strong>注意最后一行的「no tests」。</strong>
                </>
              ),
              errorOutput: ` RUN  v2.1.8 /Users/you/cab-booking-context

 ❯ src/test/App.test.jsx (0 test)

⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/test/App.test.jsx [ src/test/App.test.jsx ]
Error: Failed to parse source for import analysis because the content contains invalid JS syntax. If you are using JSX, make sure to name the file with the .jsx or .tsx extension.
  Plugin: vite:import-analysis
  File: /Users/you/cab-booking-context/src/context/CabContext.js:19:27
  17 |      >
  18 |        {children}
  19 |      </CabContext.Provider>
     |                            ^
  20 |    );
  21 |  };
 ❯ TransformPluginContext._formatError node_modules/vite/dist/node/chunks/dep-CB_7IfJ-.js:49255:41
 ❯ TransformPluginContext.error node_modules/vite/dist/node/chunks/dep-CB_7IfJ-.js:49250:16

 Test Files  1 failed (1)
      Tests  no tests`,
              broken: real("jsx", SRC_CONTEXT, {
                filename: "src/context/CabContext.js ← 注意这个扩展名",
                sourceFile: "cab-booking-context/src/context/CabContext.js",
                highlight: [19],
              }),
              classify: {
                options: [
                  { id: "a", label: "语法错误 —— 代码里少了个括号或标签没闭合" },
                  { id: "b", label: "构建配置问题 —— 文件里有 JSX，但扩展名让 esbuild 用了 js loader" },
                  { id: "c", label: "依赖缺失 —— 忘了 npm install" },
                  { id: "d", label: "测试写错了 —— App.test.jsx 里的 import 路径不对" },
                ],
                answer: "b",
              },
              locate: {
                question: "「Tests no tests」这一行说明什么？",
                options: [
                  { id: "a", label: "测试全跑了但断言都失败" },
                  { id: "b", label: "一个测试都没跑起来 —— 挂在收集/转换阶段，去改组件是白费功夫" },
                  { id: "c", label: "测试文件被 .gitignore 忽略了" },
                  { id: "d", label: "vitest 版本太老，不认识 describe" },
                ],
                answer: "b",
              },
              fixed: real("jsx", SRC_CONTEXT, {
                filename: "src/context/CabContext.jsx ← 只改了文件名，内容一个字没动",
                sourceFile: "cab-booking-context/src/context/CabContext.js",
              }),
              rootCause: (
                <>
                  <p>
                    <strong>根因：文件里有 JSX，但扩展名是 <code>.js</code>。</strong>
                    Vite 用 esbuild 转换，
                    <strong>esbuild 按扩展名选 loader</strong>，
                    js loader 不解析 <code>&lt;CabContext.Provider&gt;</code> 这种语法。
                  </p>
                  <p>
                    <strong>三个判断依据，任何一个都够：</strong>
                  </p>
                  <ul>
                    <li>
                      报错最后一句<strong>直接说了</strong>：
                      <code>make sure to name the file with the .jsx or .tsx
                      extension</code>；
                    </li>
                    <li>
                      <code>Plugin: vite:import-analysis</code> ——
                      报错来自<strong>构建插件</strong>，
                      不是 React 也不是 vitest；
                    </li>
                    <li>
                      <code>Tests no tests</code> ——
                      <strong>连收集阶段都没过</strong>。
                      测试代码本身根本没执行，
                      所以不可能是断言或组件逻辑的问题。
                    </li>
                  </ul>
                  <p>
                    <strong>修法：<code>mv CabContext.js CabContext.jsx</code>。</strong>
                    所有 import 都写的是
                    <code>from &quot;./context/CabContext&quot;</code>（无扩展名），
                    打包器会自己解析，<strong>一处 import 都不用改</strong>。
                  </p>
                  <p>
                    <strong>不要改 <code>vite.config.mjs</code> 加
                    <code>loader: {"{ \".js\": \"jsx\" }"}</code>。</strong>
                    那会让整个项目所有 <code>.js</code> 都按 JSX 解析，
                    <strong>把「一个文件名字起错了」变成一条全局规则</strong>，
                    而且换个构建工具还会再炸一次。
                  </p>
                  <p>
                    <strong>更大的教训：</strong>
                    <strong>报错说「no tests」的时候，不要去改业务代码。</strong>
                    先分清「测试跑了但失败」和「测试根本没跑」——
                    这两种情况该看的地方完全不同。
                  </p>
                </>
              ),
              verify: "npx vitest run   # 期望：Test Files 1 passed / Tests 4 passed",
            },
            {
              id: "cb-better-recognition",
              kind: "recognition",
              level: 1,
              title: "下面哪些说法是对的？（多选）",
              prompt: <>关于源项目那两处「能过但可以更好」的写法。</>,
              options: [
                {
                  id: "a",
                  label:
                    "setRideHistory([...rideHistory, details]) 在同一个事件里连调两次会丢一条记录",
                },
                {
                  id: "b",
                  label: "Provider 的 value 是字面量对象，所以每次 Provider 渲染都会让全部消费者重渲染",
                },
                {
                  id: "c",
                  label: "给 value 套 React.memo 就能挡住消费者的重渲染",
                },
                {
                  id: "d",
                  label:
                    "useMemo 的依赖里如果放了一个每次新建的函数，记忆化等于没做 —— 所以通常要先 useCallback",
                },
                {
                  id: "e",
                  label: "这两处都是 bug，测试没抓到是测试写得不够好",
                },
              ],
              answer: ["a", "b", "d"],
              explain: (
                <>
                  <strong>A 对。</strong>闭包读的是本次渲染的值。
                  这道题撞不到是因为每次订车之间都有完整的重渲染。
                  <br />
                  <strong>B 对。</strong>字面量对象每次都是新引用，
                  <code>useContext</code> 靠引用比较判断变化。
                  <br />
                  <strong>C 错。</strong>
                  <code>React.memo</code> 只挡 props 变化，
                  <strong>context 变化会穿透 memo</strong> ——
                  这是很常见的误解。要挡就得让 value 本身别变（<code>useMemo</code>），
                  或者把 context 拆细。
                  <br />
                  <strong>D 对，而且这是最容易踩的坑。</strong>
                  <code>useMemo(() =&gt; ({"{ fn }"}), [fn])</code> 里
                  <code>fn</code> 每次都新建，依赖每次都变，
                  <code>useMemo</code> 每次都重算。
                  <strong><code>useCallback</code> 和 <code>useMemo</code>
                  通常成对出现，就是这个原因。</strong>
                  <br />
                  <strong>E 错 —— 这一条最重要。</strong>
                  它们<strong>不是 bug</strong>：在这个应用的实际条件下
                  （消费者少、Provider 只因自身 state 变化而重渲染、
                  没有同一事件内的连续调用），
                  两处写法都完全正确。
                  <strong>「在什么条件下会变成问题」才是要掌握的东西</strong> ——
                  把正确代码说成 bug，在 code review 里是要挨批的。
                </>
              ),
            },
          ],
          mistakes: [
            {
              wrong: demo(
                "js",
                `// ✕ 用全局配置掩盖一个文件的问题
// vite.config.mjs
export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: { ".js": "jsx" },     // 让所有 .js 都按 JSX 解析
  },
  test: { environment: "jsdom", setupFiles: "./src/test/setup.js", globals: true },
});`,
                { filename: "不推荐的修法" },
              ),
              why: (
                <>
                  <strong>它确实能让测试跑起来</strong> ——
                  这也是它危险的地方。
                  <br />
                  代价有三层：
                  <strong>①</strong> 以后任何人在 <code>.js</code> 里写 JSX
                  都不会被发现，问题会扩散；
                  <strong>②</strong> 换构建工具就再炸一次
                  （Jest、Next、单独跑 <code>tsc</code> 都不看这个配置）；
                  <strong>③</strong> 一个新人打开
                  <code>CabContext.js</code> 看到 JSX，
                  会以为「原来 <code>.js</code> 里可以写 JSX」，
                  <strong>学到一个错的结论</strong>。
                  <br />
                  <strong>判断标准很简单：改一个文件能解决的，别动全局配置。</strong>
                </>
              ),
              whyEn: (
                <>
                  <strong>It does make the tests run</strong> — and that is exactly what makes it
                  dangerous.
                  <br />
                  The price comes in three parts: <strong>①</strong> from now on nobody notices when
                  JSX is written in a <code>.js</code> file, so the problem spreads;{" "}
                  <strong>②</strong> the next change of build tool breaks it again (Jest, Next, and a
                  separate run of <code>tsc</code> all ignore this configuration);{" "}
                  <strong>③</strong> a newcomer who opens <code>CabContext.js</code> and sees JSX
                  will believe that JSX is allowed in <code>.js</code> files, and{" "}
                  <strong>learns something that is wrong</strong>.
                  <br />
                  <strong>
                    The rule is simple: when changing one file solves it, leave the global
                    configuration alone.
                  </strong>
                </>
              ),
            },
          ],
          transfer: [
            { signal: "报错里出现「Tests no tests」/「0 test」", reachFor: "挂在收集阶段，别改业务代码 —— 去看构建/转换层" },
            { signal: "「Failed to parse source for import analysis」", reachFor: "十有八九是 .js 里写了 JSX，改扩展名" },
            { signal: "报错最后一句给了具体建议", reachFor: "先照着做 —— 这类工具报错常常直接给答案" },
            { signal: "想加一条全局配置来救一个文件", reachFor: "先问「改那个文件行不行」" },
            { signal: "面试问「这段代码有什么问题」", reachFor: "先说清它在什么条件下是对的，再说什么条件下会坏" },
          ],
          recap: [
            "基线是 0 个测试跑起来 —— 不是某个测试失败，是连收集都没过。",
            "根因：CabContext.js 里有 JSX，但 esbuild 按扩展名选 loader。",
            "修法是改名 .jsx，一处 import 都不用改（import 都没写扩展名）。",
            "别用 vite.config 的 loader 覆盖来救一个文件 —— 那是拿长期换短期。",
            "两处「能过但可更好」：非函数式更新、value 未记忆化。它们不是 bug，要说清边界条件。",
          ],
          recapEn: [
            "The baseline is 0 tests started. It is not that one test failed; collecting the tests never got through.",
            "The cause: CabContext.js contains JSX, but esbuild picks the loader from the file extension.",
            "The fix is to rename it to .jsx, and not one import has to change, because none of them write the extension.",
            "Do not use a loader override in vite.config to rescue a single file. That buys a short-term gain with a long-term cost.",
            "Two places that pass but could be better: an update that is not written as a function, and a value that is not memoised. They are not bugs, so be ready to state the conditions where they matter.",
          ],
        },
        {
          id: "cb-rewrite",
          title: "从零重写：空文件夹里做出来",
          titleEn: "Rewrite it: build the whole app in an empty folder",
          blurb: "这一节没有新知识。只有一个要求：不看答案，把整个应用写出来。",
          minutes: 55,
          objectives: [
            "在空文件夹里搭出 Vite + React + Vitest 的测试环境",
            "凭四个测试的要求写出 Context 和六个组件",
            "自己发现并修掉 .js / .jsx 那个坑",
            "跑到 4 passed / 4 total",
          ],
          whyForAssessment:
            "真实考试就是这样：一个仓库、一份 README、一套测试，没有答案。前面三个部分你都是「跟着看」，这一节是「自己做」。做不出来不代表白学了 —— 卡在哪一步，那一步就是你真正的薄弱点。",
          sourceFiles: [
            { path: "cab-booking-context/src/test/App.test.jsx", role: "唯一允许看的东西：四个测试" },
            { path: "cab-booking-context/src/data/data.json", role: "数据可以照抄，那不是考点" },
          ],
          concepts: [
            {
              id: "cb-rewrite-order",
              heading: "按什么顺序写",
              lede: "让测试一条一条变绿，而不是全写完再跑",
              body: (
                <>
                  <p>
                    <strong>一句话：</strong>
                    <strong>按测试的顺序写</strong> ——
                    测试 1 绿了再写测试 2 需要的东西。
                  </p>
                  <p>
                    <strong>为什么不要「全写完再跑」：</strong>
                    六个组件加一个 Context 一次写完，
                    第一次跑出来<strong>四条全红</strong>，
                    你不知道是哪一层的问题。
                    而<strong>一次只让一条变绿，红的原因永远只有一个</strong>。
                  </p>
                  <p>
                    <strong>推荐顺序（每一步都跑一次
                    <code>npx vitest run</code>）：</strong>
                  </p>
                  <ol>
                    <li>
                      <strong>搭环境 + 跑空测试。</strong>
                      <code>npm create vite@latest</code>、装
                      <code>vitest</code> / <code>jsdom</code> /{" "}
                      <code>@testing-library/react</code> /{" "}
                      <code>@testing-library/jest-dom</code>，
                      配好 <code>vite.config.mjs</code> 的 <code>test</code> 段和
                      setup 文件。
                      <strong>把测试文件放进去，先确认它「能跑起来并且全红」</strong> ——
                      这一步就已经比源项目的基线好了。
                    </li>
                    <li>
                      <strong>Context + Provider。</strong>
                      三件套写完，<code>index.jsx</code> 里包住
                      <code>&lt;App /&gt;</code>。
                      <strong>文件名直接叫 <code>.jsx</code></strong> ——
                      你已经知道那个坑了。
                    </li>
                    <li>
                      <strong>Home + RideHistory → 测试 1 变绿。</strong>
                      空历史的分支先写，列表分支可以先留空。
                    </li>
                    <li>
                      <strong>CabOptions + CabCard → 测试 2 变绿。</strong>
                      <code>data.json</code> 照抄，
                      六张卡的五个 testid 对照表检查一遍。
                    </li>
                    <li>
                      <strong>App 的状态机 + Loading + CabConfirmation
                      → 测试 3 变绿。</strong>
                      这一步最长，因为要串起四个页面。
                    </li>
                    <li>
                      <strong>RideHistory 的
                      <code>slice(-3).reverse()</code> → 测试 4 变绿。</strong>
                      前面留空的列表分支现在补上。
                    </li>
                  </ol>
                  <p>
                    <strong>卡住的时候：</strong>
                    提示分四级，
                    <strong>先自己想 15 分钟再看第一级</strong>。
                    看提示不丢人，
                    <strong>但一上来就看提示，这一节就白做了</strong> ——
                    你练的不是「照着提示写代码」，
                    是「没有提示时自己找路」。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    <strong>In one line:</strong>{" "}
                    <strong>write in the order of the tests</strong> — get test 1 green,
                    then build what test 2 needs.
                  </p>
                  <p>
                    <strong>Why not &ldquo;write it all, then run&rdquo;:</strong> write
                    six components and a Context in one go and the first run gives you{" "}
                    <strong>four red tests</strong> with no idea which layer is at fault.
                    Turning them green one at a time means{" "}
                    <strong>there is only ever one reason for the red</strong>.
                  </p>
                  <p>
                    <strong>
                      A good order (run <code>npx vitest run</code> after every step):
                    </strong>
                  </p>
                  <ol>
                    <li>
                      <strong>Set up the project and run the empty test.</strong>{" "}
                      <code>npm create vite@latest</code>, install{" "}
                      <code>vitest</code> / <code>jsdom</code> /{" "}
                      <code>@testing-library/react</code> /{" "}
                      <code>@testing-library/jest-dom</code>, then configure the{" "}
                      <code>test</code> section of <code>vite.config.mjs</code> and the
                      setup file. Drop in the test file and{" "}
                      <strong>confirm it runs and is all red</strong> — that alone already
                      beats the source project&rsquo;s baseline.
                    </li>
                    <li>
                      <strong>Context and Provider.</strong> Write the three parts and wrap{" "}
                      <code>&lt;App /&gt;</code> in <code>index.jsx</code>.{" "}
                      <strong>Name the file <code>.jsx</code> from the start</strong> — you
                      know about that trap now.
                    </li>
                    <li>
                      <strong>Home + RideHistory, until test 1 is green.</strong> Write the
                      empty-history branch first; the list branch can stay empty for now.
                    </li>
                    <li>
                      <strong>CabOptions + CabCard, until test 2 is green.</strong> Copy{" "}
                      <code>data.json</code> verbatim and check the five testids on each of
                      the six cards against the table.
                    </li>
                    <li>
                      <strong>
                        App&rsquo;s state machine + Loading + CabConfirmation, until test 3
                        is green.
                      </strong>{" "}
                      This is the longest step, because it strings four pages together.
                    </li>
                    <li>
                      <strong>
                        RideHistory&rsquo;s <code>slice(-3).reverse()</code>, until test 4
                        is green.
                      </strong>{" "}
                      Fill in the list branch you left empty earlier.
                    </li>
                  </ol>
                  <p>
                    <strong>When you get stuck:</strong> the hints come in four levels —{" "}
                    <strong>think for 15 minutes before opening the first one</strong>.
                    There is no shame in reading a hint,{" "}
                    <strong>
                      but opening one immediately wastes the whole exercise
                    </strong>
                    : what you are training is not &ldquo;write code from a hint&rdquo;, it
                    is &ldquo;find the way with no hint at all&rdquo;.
                  </p>
                </>
              ),
            },
          ],
          callouts: [
            {
              tone: "note",
              title: "去哪跑",
              body: (
                <>
                  <strong>本机 VS Code 是首选</strong> ——
                  <code>npm create vite@latest</code> 起项目，
                  <code>npx vitest run</code> 跑测试。
                  <br />
                  <strong>装不了 Node 的话用 StackBlitz</strong>：
                  它的 WebContainers 把 Node 编译进了浏览器，
                  <code>npm install</code> 和 <code>npm test</code> 都能真跑。
                  <br />
                  <strong>这一节故意不给页面内的运行环境</strong> ——
                  「在空文件夹里、没有答案的情况下写出来」是这个站的验收下限，
                  给你配一个连好依赖和测试的编辑器，就把这一档删掉了。
                  前面第 1、2 部分的练习本来就是「写得对」那一档，
                  这一节是「空手做」。
                </>
              ),
            },
          ],
          exercises: [
            {
              id: "cb-from-scratch",
              kind: "from-scratch",
              level: 4,
              title: "空文件夹里做出整个 Cab Booking",
              prompt: (
                <>
                  只给需求和文件清单。<strong>不给任何代码。</strong>
                  卡住了按四级提示走，答案在最后一道门后面。
                </>
              ),
              requirements: [
                "首页：一个大标题「Book a Safe Ride with HackerRide」、一个 data-testid=\"book-button\" 的按钮，下面是行程历史区",
                "行程历史：没有记录时显示 <p data-testid=\"no-ride-title\">No ride history yet.</p>；有记录时每条一个 <li data-testid=\"history-cabs\">，显示车名和 $价格",
                "行程历史只显示最新三条，最新的排最上面",
                "点 book-button 进入选车页：容器 data-testid=\"all-cabs-section\"，按类型分三组，每组一个 <h3 data-testid=\"car-type-heading\">，顺序必须是 Sedan / SUV / Luxury",
                "每辆车一张卡，五个 testid：cab-card-img / cab-card-name / cab-card-type / cab-card-price / cab-card-select-button。类型显示 \"Type: X\"，价格显示 \"Fare: $N\"",
                "点某张卡的 Select：把这辆车记为当前预订、追加进历史，然后进入加载页 data-testid=\"loading\"",
                "加载页 1000ms 后自动进入确认页；确认页 data-testid=\"confirm-message\" 显示「<车名> is on the way and will arrive shortly.」",
                "确认页有 data-testid=\"confirm-button\"，点了回首页，此时历史里能看到刚才那辆车",
                "状态必须放在 Context 里：createContext + Provider + 自定义 hook（hook 里带「不在 Provider 内就抛错」的守卫），Provider 包在 App 外面",
                "数据用 data.json：三个类型各两辆车，Sedan 第一辆是 Ford Fusion / $20，SUV 两辆是 Toyota Highlander / Ford Explorer，Sedan 第二辆是 Honda Accord",
              ],
              fileList: [
                { path: "package.json", role: "vite + react + vitest + jsdom + @testing-library/react + @testing-library/jest-dom" },
                { path: "vite.config.mjs", role: "plugins: [react()]，test 段配 environment: \"jsdom\" / globals / setupFiles" },
                { path: "index.html", role: "一个 <div id=\"root\">" },
                { path: "src/index.jsx", role: "createRoot，用 <CabProvider> 包住 <App />" },
                { path: "src/App.jsx", role: "currentPage 状态机 + handleSelectCab" },
                { path: "src/context/CabContext.jsx", role: "三件套。注意扩展名 —— 里面有 JSX" },
                { path: "src/components/AppHeader.jsx", role: "只显示标题，没有 testid" },
                { path: "src/components/Home/Home.jsx", role: "hero + book-button + <RideHistory />" },
                { path: "src/components/Home/RideHistory.jsx", role: "空状态 / 最新三条倒序" },
                { path: "src/components/CabOptions/CabOptions.jsx", role: "Object.keys 分组" },
                { path: "src/components/CabOptions/CabCard.jsx", role: "五个 testid" },
                { path: "src/components/Loading/Loading.jsx", role: "setTimeout 1000 + clearTimeout" },
                { path: "src/components/CabConfirmation/CabConfirmation.jsx", role: "?.name + confirm-button" },
                { path: "src/data/data.json", role: "三组六辆车，键顺序 Sedan → SUV → Luxury" },
                { path: "src/test/setup.js", role: "import \"@testing-library/jest-dom\"" },
                { path: "src/test/App.test.jsx", role: "把源项目那四个测试原样放进来 —— 这是你的判分依据" },
              ],
              commands: [
                {
                  cmd: "npm install",
                  expect: "装完无报错。React 18/19 都可以，测试用的 API 没差别",
                },
                {
                  cmd: "npx vitest run",
                  expect:
                    "刚放进测试文件时应该是 4 failed / 4 total，报错都是 Unable to find an element by: [data-testid=...]。全部做完是 Test Files 1 passed / Tests 4 passed (4)",
                },
                {
                  cmd: "npx vitest run 2>&1 | grep -c 'no tests'",
                  expect:
                    "0。如果不是 0，说明你也踩了 .js 里写 JSX 那个坑 —— 把带 JSX 的文件改名成 .jsx",
                },
                {
                  cmd: "npm run dev",
                  expect:
                    "浏览器里手动走一遍：首页 → 选车 → 加载 1 秒 → 确认 → 回首页看到历史。连订四辆，历史应该只有三条且最新在最上",
                },
              ],
              hints: [
                "先别写组件。把四个测试读完，抄出一张表：13 个 data-testid 分别在哪个组件、各几个、里面的文字是什么。然后想清楚一个问题 —— 哪些数据需要跨组件共享？（答案是两个：当前预订的车、行程历史。别的都是局部的。）",
                "两处结构性决定要先定：① Provider 包在哪一层 —— 注意 App 自己也要用 Context 里的写入函数，所以它不能是提供者；② 「页面」怎么表示 —— 没有 react-router，用一个字符串 state 加几个 && 就行，别用多个 boolean。定完这两个，剩下的都是填空。",
                "Context：createContext() 不给默认值；Provider 里两个 useState（当前车初始 null、历史初始 []）；一个函数同时改这两个 state；自定义 hook 里 if (!context) throw。\nApp：useState(\"home\")；handleSelectCab 先写 Context 再切页面；四个 currentPage === \"...\" && <某页 />。\nRideHistory：先算 latestRides = 历史的最后三条再反转，然后三元决定渲染列表还是空状态。\nLoading：useEffect 里 setTimeout(onComplete, 1000)，return 里 clearTimeout。",
                "两个最容易错的具体写法：\n① 历史取最新三条倒序 —— rideHistory.slice(-3).reverse()。slice 必须在前面，因为 reverse() 原地修改，直接 rideHistory.reverse() 会翻掉 state。\n② 确认页 —— {bookedCabDetails?.name} is on the way and will arrive shortly. 那个问号不能省，初始值是 null。\n另外：CabCard 的按钮是 onClick={() => onSelectCab(cab)}，不能直接传 onSelectCab（那样收到的是点击事件）；历史列表的 key 用 `${ride.id}-${index}`，同一辆车能被订两次。",
              ],
              solution: [
                real("jsx", SRC_CONTEXT, {
                  filename: "src/context/CabContext.jsx",
                  sourceFile: "cab-booking-context/src/context/CabContext.js",
                }),
                real("jsx", SRC_INDEX, {
                  filename: "src/index.jsx",
                  sourceFile: "cab-booking-context/src/index.jsx",
                }),
                real("jsx", SRC_APP, {
                  filename: "src/App.jsx",
                  sourceFile: "cab-booking-context/src/App.jsx",
                }),
                real("jsx", SRC_HOME, {
                  filename: "src/components/Home/Home.jsx",
                  sourceFile: "cab-booking-context/src/components/Home/Home.jsx",
                }),
                real("jsx", SRC_HISTORY, {
                  filename: "src/components/Home/RideHistory.jsx",
                  sourceFile: "cab-booking-context/src/components/Home/RideHistory.jsx",
                }),
                real("jsx", SRC_OPTIONS, {
                  filename: "src/components/CabOptions/CabOptions.jsx",
                  sourceFile: "cab-booking-context/src/components/CabOptions/CabOptions.jsx",
                }),
                real("jsx", SRC_CARD, {
                  filename: "src/components/CabOptions/CabCard.jsx",
                  sourceFile: "cab-booking-context/src/components/CabOptions/CabCard.jsx",
                }),
                real("jsx", SRC_LOADING, {
                  filename: "src/components/Loading/Loading.jsx",
                  sourceFile: "cab-booking-context/src/components/Loading/Loading.jsx",
                }),
                real("jsx", SRC_CONFIRM, {
                  filename: "src/components/CabConfirmation/CabConfirmation.jsx",
                  sourceFile:
                    "cab-booking-context/src/components/CabConfirmation/CabConfirmation.jsx",
                }),
              ],
            },
          ],
          mistakes: [
            {
              wrong: demo(
                "text",
                `# ✕ 先把六个组件全写完，最后才跑测试

$ npx vitest run
 ✗ renders the home page and empty ride history
 ✗ shows grouped cab options with all required card fields
 ✗ completes a booking and adds it to ride history
 ✗ keeps only the newest three rides

 Test Files  1 failed (1)
      Tests  4 failed (4)

# 现在怎么办？四条全红，不知道从哪查。
# Provider 层级错了？testid 拼错了？状态机没接上？
# 三种原因都会导致这个输出。`,
                { filename: "一次写完的下场（示意）" },
              ),
              why: (
                <>
                  <strong>四条全红提供的信息量几乎为零。</strong>
                  Provider 放错层级、testid 拼错、状态机没接上 ——
                  三种完全不同的原因会给出<strong>同一个输出</strong>。
                  <br />
                  而按测试顺序推进的话，
                  <strong>每一步只有一个变量</strong>：
                  刚写完 <code>RideHistory</code>、测试 1 还是红，
                  那问题只可能在你刚写的那几行或 Provider 层级里。
                  <br />
                  <strong>这不是「教学建议」，是真实考试里的时间管理。</strong>
                  考场有计时，
                  <strong>调试时间比写代码时间更容易失控</strong>。
                </>
              ),
            },
          ],
          transfer: [
            { signal: "拿到一个只给测试的项目", reachFor: "先跑基线记下来，再按测试顺序一条一条变绿" },
            { signal: "一次改动之后好几条测试同时红", reachFor: "回退到只改一处，把变量降到一个" },
            { signal: "「我知道怎么做但写不出来」", reachFor: "那就是这一档要练的东西 —— 卡住的地方才是薄弱点" },
            { signal: "本机装不了 Node", reachFor: "StackBlitz：WebContainers 能真跑 npm install 和 npm test" },
          ],
          recap: [
            "按测试顺序写：测试 1 绿了再写测试 2 需要的东西，每步只有一个变量。",
            "第一步是「让测试能跑起来并且全红」—— 这就已经好过源项目的基线了。",
            "带 JSX 的文件从一开始就叫 .jsx，别重复那个坑。",
            "两个最容易错的点：slice(-3).reverse() 的顺序、确认页的 ?.name。",
            "提示分四级，先自己想 15 分钟 —— 你练的是没提示时自己找路。",
          ],
        },
      ],
    },
  ],
};

export default cabBooking;
