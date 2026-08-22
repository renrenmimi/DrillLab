// 「这套题去哪跑、怎么跑起来」——模拟考页和考场 run 页共用。
//
// 【为什么这一块存在】
// 使用者问过一句关键的话：「模拟考页接沙箱是不是根本就无法实现？」
// 不是。React 模拟考就是一个组件加五个 RTL 测试，和 /code 里那些跑绿的
// 沙箱形状一样，接上去一定能跑。
//
// 不接是**设计决定**：模拟考和考场是「空手做」那一档（模拟考本来就是考场
// 考场那几道里的 2 道）。给它配一个连好依赖和测试的编辑器，就降成了「写得对」；
// 改成页面上填空，就降成了「认得出」。这两档在 /code 和 /practice 里都已经有一堆题了。
// 真实考试是在本机的编辑器里、自己 npm install、自己看报错 ——
// 「换壳验收」要换的就是这个壳。
//
// 但代价是：说明必须够硬。以前这两个页面只给一串命令，没有文件树、
// 没说起始态该看到什么、也没说去哪跑，于是「自己搭环境」从考点变成了劝退。
// 这一块就是补这个。
//
// 没有 "use client"：纯展示，不带 hook。

import Link from "next/link";
import { TerminalCommand } from "./code";
import { FileExplorer } from "./lesson-kit";
import { Loc, T, type LocalizedString } from "./t";

export interface LocalSetupProps {
  /** 从零起项目的命令，按顺序。note 是双语的 —— 这段是操作说明 */
  bootstrap: { cmd: string; note?: LocalizedString }[];
  /** 额外依赖 */
  deps?: string[];
  files: { path: string; role: LocalizedString; edit?: boolean }[];
  /** 起始态实测看到什么 */
  baseline: LocalizedString;
  /** 做对之后实测看到什么 */
  target: LocalizedString;
  /** 验收命令（模拟考和考场各自已有的那一份） */
  commands?: { cmd: string; expect: string }[];
  /**
   * 这套题能不能在 StackBlitz 里跑。
   * 本站用的 Sandpack 跑在浏览器 iframe 里，没有 Node —— Node 项目它跑不了。
   * StackBlitz 的 WebContainers 是把 Node 本身编译进了浏览器，
   * 所以连 GraphQL 子图那种要 `npm test` 的项目也能跑。
   */
  stackblitz: "react" | "node";
}

/**
 * 「为什么这一页没有运行按钮 + 去哪跑」。
 *
 * 模拟考页用完整版；考场 run 页用 compact ——
 * 那时候计时已经在跑，不该再塞一段设计说明给人读。
 */
export function NoRunnerNote({
  stackblitz,
  compact,
}: {
  stackblitz: "react" | "node";
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="callout" data-tone="note">
        <strong className="callout-title">
          <T zh="在哪写" en="Where to write it" />
        </strong>
        <p>
          <T
            zh={
              <>
                本机 + VS Code，或者{" "}
                <a
                  href="https://stackblitz.com"
                  rel="noreferrer"
                  target="_blank"
                >
                  StackBlitz
                </a>
                。<strong>这一页不给编辑器和测试运行器，是故意的</strong> ——
                考场对准的是真实考试：空文件夹、自己装依赖、自己读报错。
                想要连好依赖和测试的编辑器，去
                <Link href="/code">Coding 题</Link>，那边有 11
                道能在浏览器里直接跑。
                {stackblitz === "node"
                  ? "这套题是 Node 项目，StackBlitz 能跑 —— 它把 Node 编译进了浏览器。"
                  : ""}
              </>
            }
            en={
              <>
                Local VS Code, or{" "}
                <a
                  href="https://stackblitz.com"
                  rel="noreferrer"
                  target="_blank"
                >
                  StackBlitz
                </a>
                . <strong>The missing editor here is deliberate</strong> — the
                arena mirrors a real assessment: empty folder, install it
                yourself, read the errors yourself. If you want a wired-up
                editor, <Link href="/code">the coding problems</Link> have 11
                that run in the browser.
                {stackblitz === "node"
                  ? " This one is a Node project, so StackBlitz can run it — it compiles Node itself into the browser."
                  : ""}
              </>
            }
          />
        </p>
      </div>
    );
  }

  return (
    <div className="setup-why">
      <h3 className="setup-why-title">
        <T
          zh="这一页故意不给运行环境"
          en="There is deliberately no runner on this page"
        />
      </h3>
      <p>
        <T
          zh={
            <>
              不是做不到。<strong>是这一档的意义就在于什么都不给。</strong>
              <Link href="/code">Coding 题</Link>里那 11
              道浏览器沙箱把文件、依赖、 测试全备好了 ——
              你只要写函数体。真实考试不是这样：你会拿到一个空文件夹
              或者一份跑不起来的脚手架，自己{" "}
              <code className="icode">npm install</code>、自己读报错、
              自己决定文件放哪。
            </>
          }
          en={
            <>
              Not because we cannot.{" "}
              <strong>
                Because getting nothing is the point of this tier.
              </strong>{" "}
              The 11 browser sandboxes under <Link href="/code">Coding</Link>{" "}
              hand you files, deps and tests. A real assessment does not: you
              get an empty folder or a scaffold that does not build, and you
              install, read the errors and lay out the files yourself.
            </>
          }
        />
      </p>
      <p>
        <T
          zh={
            <>
              所以下面给足了三样东西：<strong>能直接抄的命令</strong>、
              <strong>完整的文件树</strong>、
              <strong>起始态和做对之后各该看到什么</strong>
              （都是实测数字）。搭不起来不该是这道题的难点。
            </>
          }
          en={
            <>
              So below you get three things:{" "}
              <strong>commands you can paste</strong>,{" "}
              <strong>the full file tree</strong>, and{" "}
              <strong>what the tests actually print</strong> before and after
              (both measured). Getting set up should not be the hard part.
            </>
          }
        />
      </p>
      <p className="setup-where-inline">
        <T
          zh={
            <>
              <strong>去哪跑：</strong>本机 + VS Code 最接近真实考试，要先装好
              Node。 装不了 Node 就用{" "}
              <a href="https://stackblitz.com" rel="noreferrer" target="_blank">
                StackBlitz
              </a>
              {stackblitz === "node" ? (
                <>
                  {" "}
                  —— 它把 Node 编译进了浏览器，所以这种要{" "}
                  <code className="icode">npm test</code> 的服务端项目它也能跑
                  （本站用的 Sandpack 不行，浏览器 iframe 里没有 Node）。
                </>
              ) : (
                <>
                  ，选 Vite + React + TS 模板。代码会上传到 StackBlitz
                  的服务器上。
                </>
              )}
            </>
          }
          en={
            <>
              <strong>Where:</strong> local VS Code is closest to the real
              thing; install Node first. No Node? Use{" "}
              <a href="https://stackblitz.com" rel="noreferrer" target="_blank">
                StackBlitz
              </a>
              {stackblitz === "node"
                ? " — its WebContainers run Node in the browser, so even this server-side project works there."
                : " with the Vite + React + TS template. Your code is uploaded to StackBlitz."}
            </>
          }
        />
      </p>
    </div>
  );
}

export function LocalSetup({
  bootstrap,
  deps,
  files,
  baseline,
  target,
  commands,
  stackblitz,
}: LocalSetupProps) {
  return (
    <section className="setup">
      <NoRunnerNote stackblitz={stackblitz} />

      <div className="minihead">
        <T zh="从零起一个项目" en="Bootstrap the project" />
      </div>
      <TerminalCommand
        steps={bootstrap.map((b) => ({ cmd: b.cmd, out: b.note ?? "" }))}
      />
      {deps && deps.length > 0 && (
        <p className="setup-deps">
          <T zh="要装的依赖：" en="Dependencies: " />
          {deps.map((d, i) => (
            <span key={d}>
              {i > 0 && "、"}
              <code className="icode">{d}</code>
            </span>
          ))}
        </p>
      )}

      <FileExplorer
        files={files}
        title={
          <T
            zh="文件清单（目录可以不完全一样，接口要对得上）"
            en="Files (your layout can differ; the interfaces have to match)"
          />
        }
      />

      {/* 两个端点的实测输出。
          「起始态该看到什么」比「做对了该看到什么」更重要 ——
          看不到它就说明环境没搭对，别在那儿改业务代码。 */}
      <div className="minihead">
        <T zh="你该看到什么" en="What you should see" />
      </div>
      <div className="setup-ends">
        <div className="setup-end" data-kind="before">
          <span className="setup-end-when">
            <T zh="一行还没写的时候" en="Before you write anything" />
          </span>
          <code className="setup-end-out">
            <Loc v={baseline} />
          </code>
          <span className="setup-end-note">
            <T
              zh="看不到这个就是环境没搭对，先解决它再动手。"
              en="If you do not see this, the setup is wrong. Fix that first."
            />
          </span>
        </div>
        <div className="setup-end" data-kind="after">
          <span className="setup-end-when">
            <T zh="全做对之后" en="When you are done" />
          </span>
          <code className="setup-end-out">
            <Loc v={target} />
          </code>
          <span className="setup-end-note">
            <T
              zh="这个数字是参考解法在本机实测出来的，不是估的。"
              en="Measured from the reference solution on a real machine."
            />
          </span>
        </div>
      </div>

      {commands && commands.length > 0 && (
        <>
          <div className="minihead">
            <T zh="验收命令 —— 逐条跑" en="Acceptance commands" />
          </div>
          <TerminalCommand
            steps={commands.map((c) => ({ cmd: c.cmd, out: c.expect }))}
          />
        </>
      )}
    </section>
  );
}
