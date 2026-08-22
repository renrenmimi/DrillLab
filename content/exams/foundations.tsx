// Foundations —— 项目怎么跑起来、JavaScript 和 TypeScript 里考试真正用到的那部分。
//
// 内容全部围绕两个真实 assessment 的真实文件展开：
//   react-notes-app/package.json
//   graphql-federation-practice/node-subgraph/package.json
// 不讲用不到的东西。

import type { Exam } from "../types";
import { demo, real } from "../helpers";

const REACT_PKG = `{
  "name": "react-notes-app",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "q2": "tsx q2/demo.ts"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^7.0.0",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^29.1.1",
    "tsx": "^4.16.2",
    "typescript": "^5.5.3",
    "vite": "^5.4.0",
    "vitest": "^4.1.10"
  }
}`;

const SUBGRAPH_PKG = `{
  "name": "order-subgraph",
  "version": "1.0.0",
  "description": "GraphQL Federation Subgraph for Order Management",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "test": "NODE_OPTIONS=--experimental-vm-modules jest",
    "test:watch": "NODE_OPTIONS=--experimental-vm-modules jest --watch"
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
}`;

const foundations: Exam = {
  id: "foundations",
  title: "地基 · 项目怎么跑起来，JS/TS 到底要会哪些",
  titleEn: "Foundations · how a project runs, and the JS/TS you actually need",
  shortTitle: "地基 · 项目与语言",
  shortTitleEn: "Foundations · project and language",
  description:
    "在动 React 和 GraphQL 之前，先把「一个 JavaScript 项目是怎么运行的」搞清楚：Node、npm、package.json、scripts、目录结构、怎么跑测试、报错该从哪看起。然后只补两门考试真正会用到的 JavaScript 与 TypeScript。",
  descriptionEn:
    "Before starting React or GraphQL, get clear on how a JavaScript project runs: Node, npm, package.json, scripts, the directory layout, how to run the tests, and where to look first when something fails. After that, only the JavaScript and TypeScript that the two exam projects actually use.",
  category: "基础",
  tests:
    "这一门本身不是考试，是另外两门的地基。考场上真正会卡住新手的往往不是 React 语法，而是「测试怎么跑」「这个报错是我写错了还是项目本来就坏的」「dependencies 和 devDependencies 有什么区别」这类问题。",
  testsEn:
    "This course is not an exam itself. It is the base the other two stand on. What usually stops a beginner in an exam is not React syntax. It is questions like how to run the tests, whether an error is your own mistake or a defect that was already in the project, and what the difference is between dependencies and devDependencies.",
  sourceProjects: [
    {
      path: "react-notes-app",
      role: "React Capstone，提供真实 package.json / tsconfig / vite 配置",
      roleEn: "React Capstone, the source of the real package.json, tsconfig and vite config",
    },
    {
      path: "graphql-federation-practice",
      role: "Federation Capstone，提供真实 subgraph package.json / pom.xml",
      roleEn: "Federation Capstone, the source of the real subgraph package.json and pom.xml",
    },
  ],
  prerequisites: [],
  stack: ["Node.js 22", "npm", "ESM", "JavaScript", "TypeScript 5"],
  status: "ready",
  mockExams: [],

  modules: [
    /* ================================================================
       Stage 0
       ================================================================ */
    {
      id: "how-projects-run",
      stage: "地基 · 第 1 部分",
      title: "一个 JavaScript 项目是怎么运行的",
      titleEn: "How a JavaScript project runs",
      summary:
        "从 Node.js 是什么开始，一路讲到「我怎么知道这个项目支持哪些命令」。全部用两个真实 assessment 的文件当例子。",
      summaryEn:
        "Starts at what Node.js is and ends at how to find out which commands a project supports. Every example is a real file from one of the two exam projects.",
      lessons: [
        /* ---------- 0.1 ---------- */
        {
          id: "node-and-npm",
          title: "Node.js、npm、node_modules 和 lockfile",
          titleEn: "Node.js, npm, node_modules and the lockfile",
          blurb:
            "为什么装个 React 项目会多出几万个文件，以及为什么那个 lock 文件不能随便删。",
          blurbEn:
            "Why installing a React project adds tens of thousands of files, and why you must not delete that lock file.",
          minutes: 12,
          objectives: [
            "说清 Node.js 和浏览器里的 JavaScript 是什么关系",
            "知道 npm install 到底做了什么，node_modules 从哪来",
            "知道 lockfile 是什么、为什么不能随便删或换成别的包管理器",
            "知道 dependencies 和 devDependencies 的区别在哪里体现",
          ],
          objectivesEn: [
            "Explain how Node.js relates to the JavaScript that runs in a browser",
            "Know what npm install actually does, and where node_modules comes from",
            "Know what a lockfile is, and why you should not delete it or switch to another package manager",
            "Know where the difference between dependencies and devDependencies shows up",
          ],
          whyForAssessment:
            "两个 assessment 的第一步都是 npm install。装不上、装错版本、或者手滑生成了第二个 lockfile，后面全都跑不起来 —— 这时候不是你 React 写得不好，是根本没进考场。",
          whyForAssessmentEn:
            "The first step of both exams is npm install. If it fails, installs the wrong versions, or accidentally creates a second lockfile, nothing after it will run. The problem then is not your React code. You have not started the exam at all.",
          sourceFiles: [
            {
              path: "react-notes-app/package.json",
              role: "React 考试的依赖清单",
              roleEn: "The dependency list for the React exam",
            },
            {
              path: "react-notes-app/package-lock.json",
              role: "锁定确切版本（139 KB）",
              roleEn: "Pins the exact versions (139 KB)",
            },
            {
              path: "graphql-federation-practice/node-subgraph/package.json",
              role: "subgraph 的依赖清单",
              roleEn: "The dependency list for the subgraph",
            },
          ],
          concepts: [
            {
              id: "node",
              heading: "Node.js：让 JavaScript 离开浏览器",
              headingEn: "Node.js: running JavaScript outside the browser",
              lede: "JavaScript 最早只能在网页里跑。Node.js 把它搬到了你的终端里。",
              ledeEn:
                "At first JavaScript could only run inside a web page. Node.js lets it run in your terminal.",
              body: (
                <>
                  <p>
                    你在浏览器控制台里写 <code>alert(&quot;hi&quot;)</code>，能弹窗，是因为浏览器给
                    JavaScript 提供了 <code>window</code>、<code>document</code> 这些东西。
                    JavaScript 本身并不知道什么叫「网页」。
                  </p>
                  <p>
                    <strong>Node.js</strong> 做的事情是：把浏览器里的那台 JavaScript 引擎（V8）单独拿出来，
                    再配上「读文件」「起服务器」「读环境变量」这类本机能力。于是 JavaScript
                    可以在终端里直接运行：
                  </p>
                  <p>
                    这就是为什么两个 assessment 都需要 Node —— React 项目要靠 Node 跑构建工具
                    （Vite）和测试（Vitest）；GraphQL subgraph 本身就是一个跑在 Node 上的服务器。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    When you type <code>alert(&quot;hi&quot;)</code> in the browser console
                    and a box pops up, that is the browser handing JavaScript things like{" "}
                    <code>window</code> and <code>document</code>. JavaScript itself has no
                    idea what a &ldquo;web page&rdquo; even is.
                  </p>
                  <p>
                    What <strong>Node.js</strong> does is take the JavaScript engine out of
                    the browser (V8) on its own, then bolt on machine-level abilities: read
                    a file, start a server, read an environment variable. Now JavaScript
                    runs straight from your terminal:
                  </p>
                  <p>
                    That is why both assessments need Node — the React project leans on Node
                    to run its build tool (Vite) and its tests (Vitest); the GraphQL
                    subgraph is itself a server running on Node.
                  </p>
                </>
              ),
              code: [
                real(
                  "bash",
                  `node -v
# v22.21.1   ← 本机实测版本

node -e "console.log(1 + 1)"
# 2`,
                  {
                    codeEn: `node -v
# v22.21.1   ← the version measured on this machine

node -e "console.log(1 + 1)"
# 2`,
                    explanation: "npm 一般跟着 Node.js 一起装，所以装完 Node 就有 npm 了。",
                    explanationEn:
                      "npm is normally installed together with Node.js, so once Node is installed you already have npm.",
                  },
                ),
              ],
            },
            {
              id: "npm",
              heading: "npm：替你去把别人写好的代码搬回来",
              headingEn: "npm: it fetches the code other people already wrote",
              lede: "npm 是 package manager（包管理器）。它管的是「这个项目需要哪些别人写的代码」。",
              ledeEn:
                "npm is a package manager. It keeps track of which code written by other people this project needs.",
              body: (
                <>
                  <p>
                    React 是别人写的。Vite 是别人写的。Apollo Server 是别人写的。
                    你不需要自己实现它们，只需要在 <code>package.json</code> 里声明「我要用这些」，
                    然后让 npm 去下载。每一个这样的第三方包，叫一个
                    <strong>依赖（dependency）</strong>。
                  </p>
                  <p>
                    <code>npm install</code> 做三件事：读 <code>package.json</code> 里的依赖清单 →
                    把这些包（以及这些包自己的依赖，再以及那些包的依赖……）全部下载下来 →
                    统统摊在 <code>node_modules/</code> 这个文件夹里。
                  </p>
                  <p>
                    所以 <code>node_modules</code> 动辄几万个文件是正常的。它是<strong>下载产物</strong>,
                    不是你的代码 —— 这也是为什么它几乎永远出现在 <code>.gitignore</code> 里：
                    别人拿到你的 <code>package.json</code>，自己 <code>npm install</code>
                    就能装出一份一样的，不需要你把它传上去。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    React was written by other people. So was Vite. So was Apollo Server.
                    You do not have to build any of them — you declare &ldquo;I want
                    these&rdquo; in <code>package.json</code> and let npm go download them.
                    Every third-party package like that is called a{" "}
                    <strong>dependency</strong>.
                  </p>
                  <p>
                    <code>npm install</code> does three things: read the dependency list in{" "}
                    <code>package.json</code> → download all of those packages (plus their
                    own dependencies, plus those packages&rsquo; dependencies...) → and spread
                    the lot into a folder called <code>node_modules/</code>.
                  </p>
                  <p>
                    So tens of thousands of files in <code>node_modules</code> is normal. It
                    is a <strong>download artifact</strong>, not your code — which is also
                    why it shows up in <code>.gitignore</code> nearly every time: hand
                    someone your <code>package.json</code>, they run{" "}
                    <code>npm install</code>, and they get the same thing. No need to ship
                    it.
                  </p>
                </>
              ),
              code: [
                real(
                  "bash",
                  `cd graphql-federation-practice/node-subgraph
npm install
# added 424 packages in 11s     ← 本机实测输出`,
                  {
                    codeEn: `cd graphql-federation-practice/node-subgraph
npm install
# added 424 packages in 11s     ← measured on this machine`,
                    explanation:
                      "5 个直接依赖（@apollo/server、@apollo/subgraph、graphql、graphql-tag、dataloader）+ 2 个开发依赖，最后装出 424 个包 —— 中间那些都是依赖的依赖。",
                    explanationEn:
                      "5 direct dependencies (@apollo/server, @apollo/subgraph, graphql, graphql-tag, dataloader) plus 2 dev dependencies end up installing 424 packages. Everything in between is a dependency of a dependency.",
                  },
                ),
              ],
            },
            {
              id: "lockfile",
              heading: "lockfile：把「大概哪个版本」钉成「就是这个版本」",
              headingEn: "The lockfile: it turns a version range into one exact version",
              lede: "package.json 写的是范围，lockfile 记的是事实。",
              ledeEn:
                "package.json states a range. The lockfile records what was actually installed.",
              body: (
                <>
                  <p>
                    看 <code>react-notes-app/package.json</code> 里的这行：
                    <code>&quot;react&quot;: &quot;^18.3.1&quot;</code>。
                    那个 <code>^</code> 的意思是「18.3.1 或者更新的 18.x 都行」。
                    今天装是 18.3.1，半年后装可能变成 18.3.9。
                  </p>
                  <p>
                    这对考试是灾难：同一份代码，你机器上跑得过，判卷机器上因为版本不同挂了。
                    所以 npm 在第一次安装时会生成 <strong>lockfile</strong>
                    （<code>package-lock.json</code>），把「实际装的到底是哪个版本、从哪下的、
                    校验和是多少」一条条记下来。下一次 <code>npm install</code>,
                    只要 lockfile 在，就照它装，不再重新解析版本范围。
                  </p>
                  <p>
                    由此得出三条实操规矩：
                  </p>
                  <ul>
                    <li>
                      <strong>别删 lockfile。</strong>删了就等于放弃版本锁定。
                    </li>
                    <li>
                      <strong>别混用包管理器。</strong>项目里已经有 <code>package-lock.json</code>
                      （npm 的），就不要再跑 <code>pnpm install</code> 或 <code>yarn</code> ——
                      那会生成第二个 lockfile，两份互相矛盾的事实。
                    </li>
                    <li>
                      <strong>装不上就先看错误，别先删 node_modules。</strong>
                      「删了重装」偶尔有用，但它会掩盖真正的问题。
                    </li>
                  </ul>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    Look at this line in <code>react-notes-app/package.json</code>:{" "}
                    <code>&quot;react&quot;: &quot;^18.3.1&quot;</code>. That{" "}
                    <code>^</code> means &ldquo;18.3.1, or any newer 18.x, is fine&rdquo;.
                    Install today and you get 18.3.1; install in six months and you might
                    get 18.3.9.
                  </p>
                  <p>
                    For an exam that is a disaster: the same code passes on your machine and
                    fails on the grading machine because a version differs. So on the first
                    install npm writes a <strong>lockfile</strong> (
                    <code>package-lock.json</code>) that records, line by line, which version
                    actually landed, where it was downloaded from, and its checksum. The next{" "}
                    <code>npm install</code> follows the lockfile as long as it is there, and
                    never resolves the version ranges again.
                  </p>
                  <p>
                    Three practical rules fall out of that:
                  </p>
                  <ul>
                    <li>
                      <strong>Do not delete the lockfile.</strong> Deleting it means giving up
                      version pinning.
                    </li>
                    <li>
                      <strong>Do not mix package managers.</strong> If the project already has{" "}
                      <code>package-lock.json</code> (npm&rsquo;s), do not go run{" "}
                      <code>pnpm install</code> or <code>yarn</code> — that writes a second
                      lockfile, and now you have two contradicting sets of facts.
                    </li>
                    <li>
                      <strong>When install fails, read the error before deleting
                      node_modules.</strong> Delete-and-reinstall helps once in a while, but
                      it buries the real problem.
                    </li>
                  </ul>
                </>
              ),
            },
            {
              id: "dep-vs-dev",
              heading: "dependencies 和 devDependencies 差在哪",
              headingEn: "Where dependencies and devDependencies differ",
              body: (
                <>
                  <p>
                    区别只有一句话：<strong>产品跑起来之后还需要的，放 dependencies;
                    只在开发和构建时需要的，放 devDependencies。</strong>
                  </p>
                  <p>
                    拿 <code>react-notes-app</code> 举例。<code>react</code> 和 <code>react-dom</code>
                    在 dependencies 里 —— 用户打开页面时，这些代码要在浏览器里跑。
                    而 <code>vite</code>、<code>typescript</code>、<code>vitest</code>、
                    <code>@testing-library/react</code> 全在 devDependencies 里 ——
                    它们负责把代码打包、检查类型、跑测试，打包完成后就没它们的事了。
                  </p>
                  <p>
                    <code>@types/react</code> 这种 <code>@types/</code> 开头的包也在
                    devDependencies：它们只包含类型信息，给 TypeScript 编译器看，
                    编译完就消失，一行都不会进到浏览器里。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    One sentence covers it: <strong>whatever the product still needs once it
                    is running goes in dependencies; whatever is needed only while developing
                    and building goes in devDependencies.</strong>
                  </p>
                  <p>
                    Take <code>react-notes-app</code>. <code>react</code> and{" "}
                    <code>react-dom</code> sit in dependencies — that code has to run in the
                    browser when a user opens the page. But <code>vite</code>,{" "}
                    <code>typescript</code>, <code>vitest</code> and{" "}
                    <code>@testing-library/react</code> all sit in devDependencies — they
                    bundle the code, check the types and run the tests, and once the bundle
                    is out the door they have no further job.
                  </p>
                  <p>
                    Packages that start with <code>@types/</code>, such as{" "}
                    <code>@types/react</code>, live in devDependencies too: they carry
                    nothing but type information for the TypeScript compiler, they vanish
                    when it compiles, and not one line reaches the browser.
                  </p>
                </>
              ),
            },
          ],
          callouts: [
            {
              tone: "warn",
              title: "考场上真的会发生",
              body: (
                <p>
                  本次审计时，<code>node-subgraph</code> 目录里<strong>原本没有</strong>
                  <code>node_modules</code>，也没有 lockfile。也就是说这个 subgraph
                  在拿到手的那一刻是跑不了测试的 —— 必须先 <code>npm install</code>。
                  如果你上手就去改 resolver，然后困惑「为什么 npm test 说找不到 jest」，
                  那就是漏了这一步。
                </p>
              ),
            },
          ],
          exercises: [
            {
              kind: "recognition",
              id: "f-dep-place",
              title: "这个包该放哪边？",
              titleEn: "Which side does this package go on?",
              level: 1,
              prompt: (
                <p>
                  下面是 <code>react-notes-app</code> 真实的依赖之一。它在真实的
                  <code>package.json</code> 里被放在哪个字段下？
                </p>
              ),
              promptEn: (
                <p>
                  Below is one of the real dependencies of{" "}
                  <code>react-notes-app</code>. Which field of the real{" "}
                  <code>package.json</code> is it under?
                </p>
              ),
              code: demo("json", `"vitest": "^4.1.10"`),
              options: [
                { id: "a", label: "dependencies" },
                { id: "b", label: "devDependencies" },
                { id: "c", label: "scripts" },
                { id: "d", label: "peerDependencies" },
              ],
              answer: ["b"],
              explain: (
                <>
                  vitest 是测试运行器，只在开发/验证阶段用，打包出去的产品里不需要它，
                  所以在 <code>devDependencies</code>。同理还有 vite、typescript、
                  jsdom、tsx 和三个 <code>@testing-library/*</code>。
                  这个项目的 <code>dependencies</code> 里只有两个东西：react 和 react-dom。
                </>
              ),
              explainEn: (
                <>
                  vitest is a test runner. It is used only while you develop and check
                  your work, and the shipped product does not need it, so it belongs in{" "}
                  <code>devDependencies</code>. The same goes for vite, typescript,
                  jsdom, tsx and the three <code>@testing-library/*</code> packages.
                  This project&rsquo;s <code>dependencies</code> hold exactly two
                  things: react and react-dom.
                </>
              ),
            },
            {
              kind: "recognition",
              id: "f-lockfile-rule",
              title: "lockfile 该怎么对待",
              titleEn: "How to treat the lockfile",
              level: 1,
              prompt: <p>项目里已经有 <code>package-lock.json</code>，你要安装依赖。下面哪些做法是对的？（多选）</p>,
              promptEn: (
                <p>
                  The project already has a <code>package-lock.json</code> and you need
                  to install the dependencies. Which of these are correct? (more than
                  one)
                </p>
              ),
              options: [
                { id: "a", label: "npm install" },
                { id: "b", label: "pnpm install（更快）", labelEn: "pnpm install (it is faster)" },
                { id: "c", label: "先 rm package-lock.json 再 npm install", labelEn: "rm package-lock.json first, then npm install" },
                { id: "d", label: "npm ci（严格照 lockfile 装）", labelEn: "npm ci (install strictly from the lockfile)" },
              ],
              answer: ["a", "d"],
              explain: (
                <>
                  <code>npm install</code> 会照着已有 lockfile 装，是安全的；
                  <code>npm ci</code> 更严格，完全按 lockfile 来，装之前先清空
                  <code>node_modules</code> —— CI 上常用。
                  <code>pnpm install</code> 会生成 <code>pnpm-lock.yaml</code>,
                  于是项目里出现两个互相矛盾的 lockfile。删 lockfile 则直接放弃了版本锁定。
                </>
              ),
              explainEn: (
                <>
                  <code>npm install</code> installs according to the lockfile that is
                  already there, so it is safe. <code>npm ci</code> is stricter: it
                  follows the lockfile exactly and clears <code>node_modules</code>{" "}
                  before installing — it is the common choice on CI.{" "}
                  <code>pnpm install</code> writes a <code>pnpm-lock.yaml</code>, which
                  leaves the project with two lockfiles that contradict each other.
                  Deleting the lockfile gives up version pinning altogether.
                </>
              ),
            },
          ],
          mistakes: [],
          transfer: [
            {
              signal: "拿到一个新项目，不知道从哪开始",
              signalEn: "A new project, and you do not know where to start",
              reachFor: "先看 package.json，再 npm install",
              reachForEn: "Read package.json first, then run npm install",
            },
            {
              signal: "「我这里跑得过，他那里跑不过」",
              signalEn: "It runs on my machine but not on theirs",
              reachFor: "先比 Node 版本和 lockfile",
              reachForEn: "Compare the Node version and the lockfile first",
            },
            {
              signal: "看到 node_modules 很大",
              signalEn: "node_modules is very large",
              reachFor: "正常，它是下载产物，不进版本库",
              reachForEn: "Normal. It is downloaded output, and is not committed",
            },
          ],
          recap: [
            "Node.js = 能在终端里跑 JavaScript 的运行时；npm 一般随它一起装。",
            "npm install 读 package.json，把依赖（以及依赖的依赖）下载到 node_modules。",
            "package.json 里的 ^18.3.1 是范围，lockfile 才是「实际装了哪个版本」的事实。",
            "别删 lockfile，别在有 package-lock.json 的项目里跑 pnpm/yarn。",
            "dependencies = 产品运行时要用；devDependencies = 只在开发/构建/测试时用。",
          ],
          recapEn: [
            "Node.js is the runtime that runs JavaScript in a terminal. npm is usually installed with it.",
            "npm install reads package.json and downloads the dependencies, and their dependencies, into node_modules.",
            "In package.json, ^18.3.1 is a range. Only the lockfile records which version was actually installed.",
            "Do not delete the lockfile, and do not run pnpm or yarn in a project that has a package-lock.json.",
            "dependencies are needed while the product runs. devDependencies are needed only for development, building and testing.",
          ],
        },

        /* ---------- 0.2 ---------- */
        {
          id: "package-json",
          title: "package.json 逐字段读一遍",
          titleEn: "package.json, field by field",
          blurb: "拿两个真实 assessment 的 package.json，一个字段一个字段地读懂。",
          blurbEn:
            "Take the package.json of both real exam projects and read them one field at a time.",
          minutes: 14,
          objectives: [
            "认得 name / version / private / type / main / scripts 各是干什么的",
            "知道 \"type\": \"module\" 会怎样改变 import 的写法",
            "能从一个陌生的 package.json 判断出这个项目怎么跑、用什么测试",
            "知道配置也可以内嵌在 package.json 里（subgraph 的 jest 配置就是）",
          ],
          objectivesEn: [
            "Recognise what name, version, private, type, main and scripts each control",
            "Know how \"type\": \"module\" changes the way you write import",
            "Work out from an unfamiliar package.json how the project runs and which test tool it uses",
            "Know that configuration can also sit inside package.json, as the jest config of the subgraph does",
          ],
          whyForAssessment:
            "考场上没人会告诉你「这个项目怎么跑」。package.json 就是答案本身。看懂它，等于拿到了考场地图。",
          whyForAssessmentEn:
            "In an exam nobody tells you how to run the project. package.json is the answer itself. Read it and you have the map of the exam.",
          sourceFiles: [
            {
              path: "react-notes-app/package.json",
              role: "React 考试",
              roleEn: "The React exam",
            },
            {
              path: "graphql-federation-practice/node-subgraph/package.json",
              role: "Federation 考试的 Node 部分",
              roleEn: "The Node half of the Federation exam",
            },
          ],
          concepts: [
            {
              id: "react-pkg",
              heading: "先读 React 考试的这一份",
              headingEn: "Start with the one from the React exam",
              lede: "整个文件只有 7 个顶层字段。逐个看。",
              ledeEn: "The whole file has only 7 top-level fields. Go through them one by one.",
              body: (
                <>
                  <p>下面这份是<strong>原样</strong>从项目里拿出来的，一个字都没改：</p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    The file below was copied <strong>verbatim</strong> out of the project.
                    Not one character changed:
                  </p>
                </>
              ),
              code: [
                real("json", REACT_PKG, {
                  filename: "package.json",
                  sourceFile: "react-notes-app/package.json",
                  highlight: [2, 3, 4, 5, 6, 7, 8, 9, 10],
                }),
              ],
            },
            {
              id: "fields",
              heading: "字段逐条解释",
              headingEn: "Every field, one by one",
              body: (
                <>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>字段</th>
                          <th>这份文件里的值</th>
                          <th>它在管什么</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><code>name</code></td>
                          <td><code>&quot;react-notes-app&quot;</code></td>
                          <td>包名。发布到 npm 时是唯一标识；不发布的话只是个名字。</td>
                        </tr>
                        <tr>
                          <td><code>private</code></td>
                          <td><code>true</code></td>
                          <td>「这个包不许被发布到 npm」。手滑跑了 npm publish 会被拦下来。练习/考试项目基本都会写它。</td>
                        </tr>
                        <tr>
                          <td><code>version</code></td>
                          <td><code>&quot;1.0.0&quot;</code></td>
                          <td>本项目自己的版本号。不发布的话没什么实际作用，但字段得在。</td>
                        </tr>
                        <tr>
                          <td><code>type</code></td>
                          <td><code>&quot;module&quot;</code></td>
                          <td><strong>关键字段。</strong>告诉 Node「本项目的 .js 文件按 ES Module 解析」，于是能用 <code>import</code> / <code>export</code>，不能用 <code>require</code>。</td>
                        </tr>
                        <tr>
                          <td><code>scripts</code></td>
                          <td>dev / build / q2</td>
                          <td>可以用 <code>npm run &lt;名字&gt;</code> 跑的快捷命令。下一节专门讲。</td>
                        </tr>
                        <tr>
                          <td><code>dependencies</code></td>
                          <td>react、react-dom</td>
                          <td>产品运行时需要的包。</td>
                        </tr>
                        <tr>
                          <td><code>devDependencies</code></td>
                          <td>11 个</td>
                          <td>开发、构建、测试用的包。</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    只看这 7 个字段，你已经能推出一堆事实：这是个用 <strong>Vite</strong> 打包的
                    <strong>React 18</strong> + <strong>TypeScript</strong> 项目，测试用
                    <strong>Vitest + Testing Library</strong>,DOM 环境靠
                    <strong>jsdom</strong> 模拟，另外还有一个用 <code>tsx</code> 直接跑
                    TypeScript 的独立小题（<code>q2</code>）。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Field</th>
                          <th>Value in this file</th>
                          <th>What it controls</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><code>name</code></td>
                          <td><code>&quot;react-notes-app&quot;</code></td>
                          <td>The package name. A unique identity if you publish to npm; just a name if you do not.</td>
                        </tr>
                        <tr>
                          <td><code>private</code></td>
                          <td><code>true</code></td>
                          <td>&ldquo;This package must not be published to npm.&rdquo; A slip of the finger running npm publish gets blocked. Practice and exam projects almost always set it.</td>
                        </tr>
                        <tr>
                          <td><code>version</code></td>
                          <td><code>&quot;1.0.0&quot;</code></td>
                          <td>This project&rsquo;s own version number. It does nothing much if you never publish, but the field has to be there.</td>
                        </tr>
                        <tr>
                          <td><code>type</code></td>
                          <td><code>&quot;module&quot;</code></td>
                          <td><strong>The field that matters.</strong> It tells Node &ldquo;parse this project&rsquo;s .js files as ES Modules&rdquo;, so <code>import</code> / <code>export</code> work and <code>require</code> does not.</td>
                        </tr>
                        <tr>
                          <td><code>scripts</code></td>
                          <td>dev / build / q2</td>
                          <td>Shortcut commands you can run with <code>npm run &lt;name&gt;</code>. The next lesson is all about these.</td>
                        </tr>
                        <tr>
                          <td><code>dependencies</code></td>
                          <td>react, react-dom</td>
                          <td>Packages the product needs at runtime.</td>
                        </tr>
                        <tr>
                          <td><code>devDependencies</code></td>
                          <td>11 of them</td>
                          <td>Packages for developing, building and testing.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    From those 6 fields alone you can already work out a pile of facts: this
                    is a <strong>React 18</strong> + <strong>TypeScript</strong> project
                    bundled by <strong>Vite</strong>, tested with{" "}
                    <strong>Vitest + Testing Library</strong>, with the DOM faked by{" "}
                    <strong>jsdom</strong>, plus one standalone side question (
                    <code>q2</code>) that runs TypeScript directly through <code>tsx</code>.
                  </p>
                </>
              ),
            },
            {
              id: "subgraph-pkg",
              heading: "再读 Federation 考试那一份",
              headingEn: "Now the one from the Federation exam",
              lede: "同样的读法，但多了两个新东西：main 和内嵌配置。",
              ledeEn:
                "Read it the same way. Two things are new here: main, and configuration kept inside the file.",
              body: (
                <>
                  <p>
                    这一份多出 <code>main</code>（包的入口文件）、<code>description</code>,
                    以及最要紧的一处：<strong>jest 的配置直接内嵌在 package.json 里</strong>,
                    没有单独的 <code>jest.config.js</code>。
                  </p>
                  <p>
                    这一点很容易踩坑 —— 你在项目里翻半天找不到测试配置文件，
                    以为项目没配好，其实它就在 <code>package.json</code> 的最后几行。
                    很多工具（jest、eslint、prettier、babel）都支持这种内嵌写法。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    This one adds <code>main</code> (the package entry file) and{" "}
                    <code>description</code>, plus the part most worth staring at:{" "}
                    <strong>the jest config is embedded straight into package.json</strong>.
                    There is no separate <code>jest.config.js</code>.
                  </p>
                  <p>
                    That trips people up — you dig through the project for a test config
                    file, find nothing, decide the project was never set up properly, and it
                    was sitting in the last few lines of <code>package.json</code> the whole
                    time. Plenty of tools (jest, eslint, prettier, babel) accept this
                    embedded form.
                  </p>
                </>
              ),
              code: [
                real("json", SUBGRAPH_PKG, {
                  filename: "node-subgraph/package.json",
                  sourceFile: "graphql-federation-practice/node-subgraph/package.json",
                  highlight: [6, 7, 8, 9, 10, 11, 24, 25, 26, 27, 28],
                }),
              ],
            },
            {
              id: "read-it-fast",
              heading: "拿到陌生 package.json 的三步读法",
              headingEn: "Three steps for reading a package.json you have never seen",
              body: (
                <>
                  <ol>
                    <li>
                      <strong>先看 scripts。</strong>这决定了你能跑什么命令。
                      有 <code>dev</code> 就说明能起开发服务器，有 <code>test</code>
                      就说明能跑测试，没有 <code>test</code> 就得自己想办法（下一节讲）。
                    </li>
                    <li>
                      <strong>再看 dependencies。</strong>看见 <code>react</code> 就知道是前端；
                      看见 <code>@apollo/server</code> + <code>@apollo/subgraph</code>
                      就知道是 GraphQL 联邦的一个 subgraph；看见 <code>dataloader</code>
                      就知道这题大概会考批量加载。
                    </li>
                    <li>
                      <strong>最后看 type 和内嵌配置。</strong>
                      <code>&quot;type&quot;: &quot;module&quot;</code> 决定 import 的写法，
                      内嵌的 jest/eslint 配置决定测试怎么被发现。
                    </li>
                  </ol>
                  <p>
                    第 2 步尤其重要：<strong>依赖清单本身就在泄题。</strong>
                    subgraph 的 dependencies 里明摆着一个 <code>dataloader</code>,
                    而 starter 代码里正好有个 TODO 写着「用 DataLoader 防 N+1」——
                    这不是巧合。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <ol>
                    <li>
                      <strong>Read scripts first.</strong> It decides which commands you can
                      run. A <code>dev</code> entry means there is a dev server; a{" "}
                      <code>test</code> entry means you can run tests; no <code>test</code>{" "}
                      entry means you have to work something out yourself (next lesson).
                    </li>
                    <li>
                      <strong>Then read dependencies.</strong> Spot <code>react</code> and you
                      know it is frontend; spot <code>@apollo/server</code> +{" "}
                      <code>@apollo/subgraph</code> and you know it is one subgraph of a
                      GraphQL federation; spot <code>dataloader</code> and you can bet batch
                      loading is on the test.
                    </li>
                    <li>
                      <strong>Read type and the embedded config last.</strong>{" "}
                      <code>&quot;type&quot;: &quot;module&quot;</code> decides how imports
                      get written, and an embedded jest/eslint config decides how tests get
                      found.
                    </li>
                  </ol>
                  <p>
                    Step 2 matters most: <strong>the dependency list leaks the
                    questions.</strong> The subgraph has <code>dataloader</code> sitting right
                    there in dependencies, and the starter code happens to carry a TODO
                    saying &ldquo;use DataLoader to avoid N+1&rdquo; — that is no
                    coincidence.
                  </p>
                </>
              ),
            },
          ],
          exercises: [
            {
              kind: "fill-blank",
              id: "f-pkg-blanks",
              title: "补全 subgraph 的 package.json 关键字段",
              titleEn: "Fill in the key fields of the subgraph package.json",
              level: 2,
              prompt: (
                <p>
                  下面是 <code>node-subgraph/package.json</code> 的骨架，挖掉了三个决定项目行为的值。
                  照真实文件补回来。
                </p>
              ),
              promptEn: (
                <p>
                  Below is the skeleton of <code>node-subgraph/package.json</code> with
                  three values removed. Each one decides how the project behaves. Put
                  them back the way the real file has them.
                </p>
              ),
              language: "json",
              filename: "node-subgraph/package.json",
              sourceFile: "graphql-federation-practice/node-subgraph/package.json",
              template: `{
  "name": "order-subgraph",
  "main": "src/index.js",
  "type": "___1___",
  "scripts": {
    "start": "node src/index.js",
    "test": "NODE_OPTIONS=--experimental-vm-modules ___2___"
  },
  "dependencies": {
    "@apollo/server": "^4.10.0",
    "@apollo/subgraph": "^2.7.0",
    "graphql": "^16.8.1",
    "graphql-tag": "^2.12.6",
    "___3___": "^2.2.2"
  }
}`,
              blanks: [
                {
                  n: 1,
                  accept: ['"module"', "module", '\\"module\\"'],
                  hint: "这个值决定了源码里能用 import 而不是 require。",
                  hintEn: "This value is what lets the source use import instead of require.",
                  why: (
                    <>
                      <code>&quot;type&quot;: &quot;module&quot;</code> 让 Node 把 .js 当 ES Module 解析。
                      这也是为什么 <code>index.js</code> 里能直接写 <code>import ... from</code>,
                      以及为什么跑 jest 需要 <code>--experimental-vm-modules</code>。
                    </>
                  ),
                  whyEn: (
                    <>
                      <code>&quot;type&quot;: &quot;module&quot;</code> makes Node parse
                      .js files as ES Modules. That is also why <code>index.js</code>{" "}
                      can write <code>import ... from</code> directly, and why running
                      jest needs <code>--experimental-vm-modules</code>.
                    </>
                  ),
                  width: 10,
                },
                {
                  n: 2,
                  accept: ["jest"],
                  hint: "这个项目的测试运行器。看 devDependencies 就知道。",
                  hintEn: "The test runner of this project. devDependencies tells you which one.",
                  why: (
                    <>
                      subgraph 用的是 <strong>jest</strong>（React 那边用的是 vitest，别混）。
                      前面那个 <code>NODE_OPTIONS=--experimental-vm-modules</code> 是为了让
                      jest 能处理 ES Module —— 少了它，jest 一遇到 <code>import</code> 就报错。
                    </>
                  ),
                  whyEn: (
                    <>
                      The subgraph uses <strong>jest</strong> (the React side uses
                      vitest — do not mix them up). The{" "}
                      <code>NODE_OPTIONS=--experimental-vm-modules</code> in front of it
                      is what lets jest handle ES Modules. Without it, jest fails as
                      soon as it meets an <code>import</code>.
                    </>
                  ),
                  width: 8,
                },
                {
                  n: 3,
                  accept: ["dataloader"],
                  hint: "它的存在直接暗示了 resolver 那道题的解法。",
                  hintEn: "Its presence points straight at the answer to the resolver question.",
                  why: (
                    <>
                      <code>dataloader</code> 出现在 dependencies 里，而 starter 代码里正好有个
                      TODO 要求「用 DataLoader 防 N+1 查询」。
                      <strong>依赖清单在泄题</strong> —— 拿到项目先读 dependencies，常常能猜出考点。
                    </>
                  ),
                  whyEn: (
                    <>
                      <code>dataloader</code> shows up in dependencies, and the starter
                      code happens to carry a TODO asking you to &ldquo;use DataLoader
                      to avoid N+1 queries&rdquo;.{" "}
                      <strong>The dependency list leaks the questions</strong> — read
                      dependencies first on any new project and you can often guess
                      what is being tested.
                    </>
                  ),
                  width: 13,
                },
              ],
            },
          ],
          transfer: [
            {
              signal: "不知道项目怎么跑",
              signalEn: "You do not know how to run the project",
              reachFor: "读 package.json 的 scripts",
              reachForEn: "Read the scripts field in package.json",
            },
            {
              signal: "不知道这题要考什么",
              signalEn: "You do not know what a question is testing",
              reachFor: "读 dependencies，特殊的包就是考点",
              reachForEn: "Read dependencies. An unusual package is the topic",
            },
            {
              signal: "找不到 jest / eslint 配置文件",
              signalEn: "You cannot find a jest or eslint config file",
              reachFor: "看 package.json 里有没有同名内嵌字段",
              reachForEn: "Check package.json for a field with the same name",
            },
            {
              signal: "import 报 Cannot use import statement",
              signalEn: "import fails with Cannot use import statement",
              reachFor: "检查 \"type\": \"module\"",
              reachForEn: "Check \"type\": \"module\"",
            },
          ],
          recap: [
            "package.json 的 scripts 决定你能跑什么命令，是拿到项目第一个要读的字段。",
            "\"type\": \"module\" 决定源码用 ESM 还是 CommonJS，直接影响 import 能不能写。",
            "private: true 只是防止误发布，与能不能跑无关。",
            "配置可以内嵌：subgraph 的 jest 配置就在 package.json 里，不在单独文件。",
            "dependencies 里出现 dataloader 这种特征包，基本等于告诉你考点在哪。",
          ],
          recapEn: [
            "The scripts in package.json decide which commands you can run. It is the first field to read.",
            "\"type\": \"module\" decides whether the source uses ESM or CommonJS, so it decides whether you can write import.",
            "private: true only stops the package from being published by mistake. It has nothing to do with running it.",
            "Configuration can live inside package.json. The jest config of the subgraph is there, not in a separate file.",
            "A telling package such as dataloader in dependencies almost always shows you what the exam will test.",
          ],
        },

        /* ---------- 0.3 ---------- */
        {
          id: "npm-scripts",
          title: "npm scripts：命令到底跑了什么",
          titleEn: "npm scripts: what the command actually runs",
          blurb:
            "npm test 和 npm run test 有什么区别，以及 react-notes-app 为什么根本跑不了 npm test。",
          blurbEn:
            "How npm test differs from npm run test, and why npm test cannot run at all in react-notes-app.",
          minutes: 13,
          objectives: [
            "看懂 scripts 里每条命令实际调用了什么程序",
            "解释 npm test 和 npm run test 的区别，以及为什么有些命令不用加 run",
            "知道项目里没有 test script 时该怎么跑测试",
            "拿到报错时知道先看哪一层",
          ],
          objectivesEn: [
            "Read a line in scripts and say which program it really calls",
            "Explain how npm test differs from npm run test, and why some commands do not need run",
            "Know how to run the tests when the project has no test script",
            "Know which layer to look at first when you get an error",
          ],
          whyForAssessment:
            "react-notes-app 的 package.json 里没有 test script —— 直接跑 npm test 会报 Missing script。判卷靠的却正是那四个测试。跑不起来测试，等于蒙着眼睛答题。",
          whyForAssessmentEn:
            "The package.json of react-notes-app has no test script, so npm test reports Missing script. Yet your work is graded by exactly those four tests. If you cannot run them, you are answering without being able to check anything.",
          sourceFiles: [
            {
              path: "react-notes-app/package.json",
              role: "只有 dev / build / q2 三个 script",
              roleEn: "Only three scripts: dev, build and q2",
            },
            {
              path: "graphql-federation-practice/node-subgraph/package.json",
              role: "有 start / test / test:watch",
              roleEn: "Has start, test and test:watch",
            },
          ],
          concepts: [
            {
              id: "what-run-does",
              heading: "npm run 做的事情比你想的简单",
              headingEn: "npm run does less than you might think",
              lede: "它就是在 node_modules/.bin 加进 PATH 之后，执行你写的那行字符串。",
              ledeEn:
                "It adds node_modules/.bin to PATH, then runs the line of text you wrote.",
              body: (
                <>
                  <p>
                    <code>&quot;dev&quot;: &quot;vite&quot;</code> 的意思不是「npm 认识 vite」，
                    而是：npm 把 <code>node_modules/.bin</code> 临时加进 <code>PATH</code>,
                    然后执行 <code>vite</code> 这个命令。而 <code>node_modules/.bin/vite</code>
                    正是 <code>npm install</code> 时，vite 这个包自己放进去的可执行文件。
                  </p>
                  <p>
                    所以「命令找不到」几乎总是意味着两件事之一：
                    <strong>依赖没装</strong>，或者<strong>你在错误的目录里跑</strong>
                    （比如在仓库根目录跑本该在 <code>node-subgraph/</code> 里跑的命令）。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    <code>&quot;dev&quot;: &quot;vite&quot;</code> does not mean &ldquo;npm
                    knows about vite&rdquo;. It means: npm temporarily adds{" "}
                    <code>node_modules/.bin</code> to <code>PATH</code>, then runs the command{" "}
                    <code>vite</code>. And <code>node_modules/.bin/vite</code> is exactly the
                    executable the vite package dropped in there during{" "}
                    <code>npm install</code>.
                  </p>
                  <p>
                    So &ldquo;command not found&rdquo; nearly always means one of two things:{" "}
                    <strong>dependencies were never installed</strong>, or{" "}
                    <strong>you are running it in the wrong directory</strong> (say, at the
                    repo root when the command belongs inside{" "}
                    <code>node-subgraph/</code>).
                  </p>
                </>
              ),
              code: [
                real(
                  "bash",
                  `# react-notes-app 的三条 script，展开后实际执行的是：
npm run dev     # → vite                  起开发服务器
npm run build   # → tsc && vite build     先类型检查，过了再打包
npm run q2      # → tsx q2/demo.ts        用 tsx 直接跑 TypeScript 文件`,
                  {
                    sourceFile: "react-notes-app/package.json",
                    codeEn: `# the three scripts of react-notes-app, and what each really runs:
npm run dev     # → vite                  start the dev server
npm run build   # → tsc && vite build     type-check first, bundle after it passes
npm run q2      # → tsx q2/demo.ts        run a TypeScript file directly with tsx`,
                  },
                ),
              ],
            },
            {
              id: "test-vs-run-test",
              heading: "npm test 和 npm run test：为什么有的能省掉 run",
              headingEn: "npm test and npm run test: why run can be left out for some names",
              body: (
                <>
                  <p>
                    npm 给<strong>少数几个名字</strong>开了后门，可以省掉 <code>run</code>:{" "}
                    <code>test</code>、<code>start</code>、<code>stop</code>、
                    <code>restart</code>。所以 <code>npm test</code> ≡ <code>npm run test</code>,{" "}
                    <code>npm start</code> ≡ <code>npm run start</code>。
                  </p>
                  <p>
                    其他名字都必须写 <code>run</code>。<code>npm build</code> 不会跑你的
                    build script —— 实测它直接报 <code>Unknown command: &quot;build&quot;</code>，
                    下面还跟一句 <code>Did you mean this? npm run build</code>。
                    npm 把答案告诉你了，照着写 <code>npm run build</code> 就行。
                    这是新手最常见的困惑之一。
                  </p>
                  <p>
                    但「能省掉 run」不代表「这个 script 一定存在」。这就是下一段的坑。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    npm keeps a back door open for <strong>a handful of names</strong>, where
                    you can drop the <code>run</code>: <code>test</code>, <code>start</code>,{" "}
                    <code>stop</code>, <code>restart</code>. So <code>npm test</code> ≡{" "}
                    <code>npm run test</code>, and <code>npm start</code> ≡{" "}
                    <code>npm run start</code>.
                  </p>
                  <p>
                    Every other name needs <code>run</code>. <code>npm build</code> will not
                    run your build script — measured, it prints{" "}
                    <code>Unknown command: &quot;build&quot;</code> followed by{" "}
                    <code>Did you mean this? npm run build</code>. npm hands you the answer;
                    write <code>npm run build</code> as it says. This is one of the most
                    common beginner confusions.
                  </p>
                  <p>
                    But &ldquo;you can drop the run&rdquo; does not mean &ldquo;that script
                    exists&rdquo;. Which is the trap in the next section.
                  </p>
                </>
              ),
            },
            {
              id: "no-test-script",
              heading: "实测：react-notes-app 跑不了 npm test",
              headingEn: "Tried for real: npm test does not work in react-notes-app",
              lede: "这不是你的错，是这个项目的 scripts 里真的没有 test。",
              ledeEn:
                "This is not your mistake. The scripts of this project really have no test entry.",
              body: (
                <>
                  <p>
                    回头看它的 scripts：只有 <code>dev</code>、<code>build</code>、
                    <code>q2</code>。<strong>没有 test。</strong>
                    但项目里明明有 <code>src/NoteManager.test.tsx</code>,{" "}
                    <code>vite.config.ts</code> 里也明明配了 vitest。
                  </p>
                  <p>那怎么跑？两条路：</p>
                  <ul>
                    <li>
                      <code>npx vitest run</code> —— <code>npx</code> 会去
                      <code>node_modules/.bin</code> 里找 <code>vitest</code> 并执行。
                      <code>run</code> 子命令表示「跑一遍就退出」，不加它会进 watch 模式一直挂着。
                    </li>
                    <li>
                      自己往 package.json 里加一条
                      <code>&quot;test&quot;: &quot;vitest run&quot;</code>。
                      考试时要谨慎 —— 除非题目允许你改配置，否则用 npx 更安全。
                    </li>
                  </ul>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    Look at its scripts again: only <code>dev</code>, <code>build</code>,{" "}
                    <code>q2</code>. <strong>No test.</strong> And yet the project plainly
                    has <code>src/NoteManager.test.tsx</code>, and{" "}
                    <code>vite.config.ts</code> plainly configures vitest.
                  </p>
                  <p>So how do you run them? Two ways:</p>
                  <ul>
                    <li>
                      <code>npx vitest run</code> — <code>npx</code> goes into{" "}
                      <code>node_modules/.bin</code>, finds <code>vitest</code> and runs it.
                      The <code>run</code> subcommand means &ldquo;go once and exit&rdquo;;
                      leave it off and you land in watch mode, hanging around.
                    </li>
                    <li>
                      Add a line to package.json yourself:{" "}
                      <code>&quot;test&quot;: &quot;vitest run&quot;</code>. Be careful during
                      an exam — unless the task says you may edit config, npx is safer.
                    </li>
                  </ul>
                </>
              ),
              code: [
                real(
                  "bash",
                  `$ npm test
npm error Missing script: "test"
npm error
npm error To see a list of scripts, run:
npm error   npm run

$ npx vitest run
 RUN  v4.1.10 react-notes-app

 Test Files  1 passed (1)
      Tests  4 passed (4)
   Duration  1.19s`,
                  {
                    filename: "本机实测输出",
                    filenameEn: "Output measured on this machine",
                    explanation:
                      "注意 npm 自己给了台阶：「运行 npm run 看有哪些 script」。这条提示值得记住 —— 任何项目里，光跑 npm run（不带名字）就会列出所有可用命令。",
                    explanationEn:
                      "Notice that npm offers the way out itself: run npm run to see which scripts exist. That is worth remembering — in any project, npm run with no name lists every available command.",
                  },
                ),
              ],
            },
            {
              id: "read-errors",
              heading: "script 报错了，先看哪一层",
              headingEn: "A script failed: which layer to check first",
              body: (
                <>
                  <p>
                    一条 script 失败，报错可能来自三层。按顺序排除：
                  </p>
                  <ol>
                    <li>
                      <strong>npm 层。</strong>
                      「Missing script」「ENOENT: no such file or directory package.json」——
                      这说明命令根本没开始跑。检查：名字打对了吗？在对的目录吗？
                    </li>
                    <li>
                      <strong>工具层。</strong>
                      「command not found: vite」「Cannot find module &apos;jest&apos;」——
                      工具本身没装好。检查：<code>npm install</code> 跑过吗？
                    </li>
                    <li>
                      <strong>你的代码层。</strong>
                      「TS2304: Cannot find name &apos;expect&apos;」「TypeError: x is not a function」——
                      这层才是真的在说你的代码（或者项目自带配置）有问题。
                    </li>
                  </ol>
                  <p>
                    新手最容易犯的错是<strong>看到红字就开始改业务代码</strong>,
                    而错误其实在第 1 层或第 2 层。先分层，再动手。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    When a script fails, the error can come from three layers. Rule them out
                    in order:
                  </p>
                  <ol>
                    <li>
                      <strong>The npm layer.</strong>
                      &ldquo;Missing script&rdquo;, &ldquo;ENOENT: no such file or directory
                      package.json&rdquo; — the command never started. Check: did you spell
                      the name right? Are you in the right directory?
                    </li>
                    <li>
                      <strong>The tool layer.</strong>
                      &ldquo;command not found: vite&rdquo;, &ldquo;Cannot find module
                      &apos;jest&apos;&rdquo; — the tool itself is not installed properly.
                      Check: did <code>npm install</code> actually run?
                    </li>
                    <li>
                      <strong>Your code layer.</strong>
                      &ldquo;TS2304: Cannot find name &apos;expect&apos;&rdquo;,
                      &ldquo;TypeError: x is not a function&rdquo; — this layer is the first
                      one really telling you something is wrong with your code (or with the
                      config the project shipped).
                    </li>
                  </ol>
                  <p>
                    The beginner mistake is <strong>seeing red text and going straight to the
                    business code</strong> when the error was in layer 1 or layer 2. Sort the
                    layer first, then touch anything.
                  </p>
                </>
              ),
            },
          ],
          callouts: [
            {
              tone: "trap",
              title: "npm run build 在 react-notes-app 里是失败的 —— 这不是你的问题",
              body: (
                <>
                  <p>
                    <code>build</code> = <code>tsc &amp;&amp; vite build</code>。而
                    <code>tsc</code>（TypeScript 编译器）会因为
                    <code>NoteManager.test.tsx</code> 里的 <code>test</code>、
                    <code>expect</code> 没有类型声明，直接报 10 个错。实测：
                  </p>
                  <div className="mono" style={{ fontSize: 13, color: "var(--danger)" }}>
                    src/NoteManager.test.tsx(5,1): error TS2582: Cannot find name &apos;test&apos;.
                  </div>
                  <p style={{ marginTop: 10 }}>
                    根因是项目的 <code>tsconfig.json</code> 把 <code>src</code> 全都
                    include 了（含测试文件），但既没配
                    <code>&quot;types&quot;: [&quot;vitest/globals&quot;]</code>
                    也没装 <code>@types/jest</code>。
                    <strong>这是脚手架自带的配置缺陷。</strong>你的任务是认出它，
                    而不是花两小时怀疑自己的 React 写错了。
                  </p>
                </>
              ),
            },
          ],
          exercises: [
            {
              kind: "recognition",
              id: "f-how-to-test",
              title: "怎么跑 react-notes-app 的测试",
              titleEn: "How to run the tests of react-notes-app",
              level: 1,
              prompt: (
                <p>
                  你在 <code>react-notes-app/</code> 目录下，想跑那 4 个判卷测试。
                  package.json 的 scripts 只有 <code>dev</code>、<code>build</code>、
                  <code>q2</code>。下面哪个命令能跑起来？
                </p>
              ),
              promptEn: (
                <p>
                  You are inside <code>react-notes-app/</code> and want to run those 4
                  grading tests. The scripts in package.json are only{" "}
                  <code>dev</code>, <code>build</code> and <code>q2</code>. Which
                  command works?
                </p>
              ),
              options: [
                { id: "a", label: "npm test" },
                { id: "b", label: "npm run test" },
                { id: "c", label: "npx vitest run" },
                { id: "d", label: "npm run build" },
              ],
              answer: ["c"],
              explain: (
                <>
                  A 和 B 是同一件事，都会报 <code>Missing script: &quot;test&quot;</code>。
                  D 跑的是构建，而且在这个项目里因为 tsc 报错会直接失败。
                  只有 C 能跑 —— npx 直接执行 <code>node_modules/.bin/vitest</code>,{" "}
                  <code>run</code> 表示跑一次就退出。
                </>
              ),
              explainEn: (
                <>
                  A and B are the same thing and both report{" "}
                  <code>Missing script: &quot;test&quot;</code>. D runs the build,
                  which in this project fails outright because tsc reports errors. Only
                  C works — npx executes <code>node_modules/.bin/vitest</code> directly,
                  and <code>run</code> means go once and exit.
                </>
              ),
            },
            {
              kind: "ordering",
              id: "f-debug-order",
              title: "script 报错了，按什么顺序排查",
              titleEn: "A script failed: in what order do you check things",
              level: 1,
              prompt: <p>把排查顺序排对。从最外层（还没开始跑）到最里层（你的代码）。</p>,
              promptEn: (
                <p>
                  Put the checks in order, from the outermost layer (nothing has started
                  yet) to the innermost one (your own code).
                </p>
              ),
              items: [
                { id: "c", label: "读报错里的具体类型/文件/行号，判断是业务代码还是项目配置", labelEn: "Read the exact type, file and line number in the error, and decide whether it is your code or the project config" },
                { id: "a", label: "确认命令名和当前目录对不对（npm run 列一下）", labelEn: "Check the command name and the current directory (run npm run to list them)" },
                { id: "b", label: "确认 npm install 跑过、node_modules 在", labelEn: "Check that npm install has run and node_modules exists" },
              ],
              answer: ["a", "b", "c"],
              explain: (
                <>
                  先排除「命令没跑起来」（npm 层），再排除「工具没装」（依赖层），
                  最后才看代码。顺序反了就会出现「花两小时改 React，结果是没装依赖」这种事。
                </>
              ),
              explainEn: (
                <>
                  First rule out &ldquo;the command never started&rdquo; (the npm
                  layer), then &ldquo;the tool is not installed&rdquo; (the dependency
                  layer), and only then look at the code. Reverse the order and you get
                  two hours of editing React when the real problem was that the
                  dependencies were never installed.
                </>
              ),
            },
          ],
          transfer: [
            {
              signal: "Missing script: \"test\"",
              signalEn: "Missing script: \"test\"",
              reachFor: "npx <工具> 或先跑 npm run 看清单",
              reachForEn: "Run npx <tool>, or run npm run first to list the scripts",
            },
            {
              signal: "command not found: vite",
              signalEn: "command not found: vite",
              reachFor: "先 npm install，再确认目录",
              reachForEn: "Run npm install, then check you are in the right directory",
            },
            {
              signal: "npm build 报 Unknown command",
              signalEn: "npm build says Unknown command",
              reachFor: "只有 test/start/stop/restart 能省 run，其余都要写 npm run <名字>",
              reachForEn: "Only test, start, stop and restart may drop run. Everything else needs npm run <name>",
            },
            {
              signal: "build 失败但 dev 正常",
              signalEn: "build fails but dev works",
              reachFor: "大概是类型检查（tsc）那一步，不是打包",
              reachForEn: "Probably the type-checking step (tsc), not the bundling step",
            },
          ],
          recap: [
            "npm run <名字> = 把 node_modules/.bin 加进 PATH 后执行那行字符串。",
            "只有 test/start/stop/restart 能省掉 run，其他都要写 npm run。",
            "跑 npm run 不带名字，会列出这个项目所有可用命令。",
            "react-notes-app 没有 test script，要用 npx vitest run。",
            "报错先分层：npm 层 → 工具层 → 代码层。别一看红字就改业务代码。",
          ],
          recapEn: [
            "npm run <name> adds node_modules/.bin to PATH, then runs that line of text.",
            "Only test, start, stop and restart can drop run. Everything else needs npm run.",
            "Running npm run with no name lists every command this project offers.",
            "react-notes-app has no test script. Use npx vitest run instead.",
            "Sort an error into a layer first: npm, then the tool, then your code. Do not edit your own code the moment you see red text.",
          ],
        },

        /* ---------- 0.4 ---------- */
        {
          id: "project-layout",
          title: "两个考试项目的目录，逐个说明",
          titleEn: "The directory layout of both exam projects",
          blurb: "哪些文件是你要改的，哪些是给好的，哪些是干扰项。",
          blurbEn:
            "Which files you are meant to edit, which are already done for you, and which are there to distract you.",
          minutes: 12,
          objectives: [
            "看懂两个 assessment 的完整目录结构",
            "分清「入口文件」「配置文件」「源码」「测试」各在哪",
            "知道 index.html → main.tsx → App.tsx → 组件 这条前端启动链",
            "认出项目里的干扰项",
          ],
          objectivesEn: [
            "Read the full directory layout of both exam projects",
            "Tell apart where the entry files, the config files, the source and the tests each sit",
            "Know the front-end start-up chain: index.html to main.tsx to App.tsx to the components",
            "Spot the files in the project that are only there to distract you",
          ],
          whyForAssessment:
            "两个考试都明确标了「EDIT THIS」和「PROVIDED」。改错文件不加分；而找不到该改的文件会直接丢分。",
          whyForAssessmentEn:
            "Both exams mark files as EDIT THIS or PROVIDED. Editing the wrong file earns nothing, and failing to find the file you were meant to edit loses points directly.",
          sourceFiles: [
            {
              path: "react-notes-app/",
              role: "Q1 在 src/,Q2 在 q2/",
              roleEn: "Q1 lives in src/, Q2 in q2/",
            },
            {
              path: "graphql-federation-practice/",
              role: "node-subgraph/ 和 java-service/ 两个服务",
              roleEn: "Two services: node-subgraph/ and java-service/",
            },
          ],
          concepts: [
            {
              id: "react-tree",
              heading: "react-notes-app 的完整结构",
              headingEn: "The full layout of react-notes-app",
              body: (
                <>
                  <p>
                    这个项目不大，一屏能看完。下面每一行都真实存在
                    （<code>node_modules</code> 和 lockfile 省略）：
                  </p>
                  <p>
                    要注意它有<strong>两道互不相干的题</strong>:{" "}
                    <code>src/</code> 是 Q1（React 界面），<code>q2/</code> 是 Q2
                    （纯 TypeScript 的异步调度器，完全不涉及 React）。
                    很多人一开始会以为 q2 是 src 的一部分，白花时间找关联。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    The project is small — it fits on one screen. Every line below really
                    exists (<code>node_modules</code> and the lockfile left out):
                  </p>
                  <p>
                    Notice that it holds <strong>two entirely unrelated questions</strong>:{" "}
                    <code>src/</code> is Q1 (the React UI) and <code>q2/</code> is Q2 (a pure
                    TypeScript async scheduler, no React in it at all). Plenty of people
                    assume q2 is part of src at first and burn time hunting for a connection.
                  </p>
                </>
              ),
              code: [
                real(
                  "text",
                  `react-notes-app/
├── index.html                    Vite 入口，里面只有一个 <div id="root">
├── package.json                  依赖 + dev/build/q2 三个 script
├── tsconfig.json                 strict: true,include: ["src","q2"]
├── vite.config.ts                React 插件 + 内联的 vitest 配置（jsdom）
├── vitest.setup.ts               一行：import "@testing-library/jest-dom"
├── src/                          ← Q1:Notes Manager
│   ├── main.tsx                  createRoot(...).render(<App />)
│   ├── App.tsx                   只渲染 <NoteManager />
│   ├── index.css                 全局样式与 .card / .layout-row 等工具类
│   ├── types/Note.ts             type Note = { id, title, content }
│   ├── NoteManager.test.tsx      ★ 判卷用的 4 个测试
│   └── components/
│       ├── NoteManager/index.tsx ★ 状态所有者：notes[] + noteToEdit
│       ├── NoteForm/index.tsx    ★ 受控表单 + 编辑回填 + Add/Update
│       ├── NoteTable/index.tsx   表格骨架 + map + tbody 的 testid
│       └── NoteItem/index.tsx    单行 + Edit / Delete 按钮
└── q2/                           ← Q2：并发任务调度器（与 React 无关）
    ├── taskRunner.ts             ★ 要实现的 runTasks
    └── demo.ts                   测试台，打印实时并发数`,
                  { filename: "目录结构（实测）", filenameEn: "Directory layout (as measured)" },
                ),
              ],
            },
            {
              id: "startup-chain",
              heading: "前端项目的启动链：谁调用谁",
              headingEn: "The start-up chain of a front-end project: what calls what",
              lede: "浏览器打开一个空 div，最后长出整个界面 —— 中间这几跳要看清。",
              ledeEn:
                "The browser opens an empty div and ends up with the whole interface. Follow each step in between.",
              body: (
                <>
                  <p>
                    <code>npm run dev</code> 之后，Vite 起一个服务器，浏览器请求
                    <code>index.html</code>。之后是这样一条链：
                  </p>
                  <ol>
                    <li>
                      <code>index.html</code> 里有 <code>&lt;div id=&quot;root&quot;&gt;&lt;/div&gt;</code>
                      （空的）和一行 <code>&lt;script type=&quot;module&quot; src=&quot;/src/main.tsx&quot;&gt;</code>。
                    </li>
                    <li>
                      <code>main.tsx</code> 找到那个 div，用
                      <code>ReactDOM.createRoot(...).render(&lt;App /&gt;)</code>
                      把 React 应用「挂」进去。
                    </li>
                    <li><code>App.tsx</code> 渲染 <code>&lt;NoteManager /&gt;</code>。</li>
                    <li>
                      <code>NoteManager</code> 渲染 <code>&lt;NoteForm /&gt;</code> 和
                      <code>&lt;NoteTable /&gt;</code>，后者再渲染一堆
                      <code>&lt;NoteItem /&gt;</code>。
                    </li>
                  </ol>
                  <p>
                    <strong>为什么要知道这条链？</strong>因为它决定了「state 应该放在哪」。
                    <code>NoteForm</code> 和 <code>NoteTable</code> 是兄弟，
                    它们没法直接互相通话。要让「表单提交」影响「表格内容」，
                    数据只能放在它们共同的父亲 <code>NoteManager</code> 里。
                    这是 Q1 三道题的全部结构基础。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    After <code>npm run dev</code>, Vite starts a server and the browser asks
                    for <code>index.html</code>. From there it is one chain:
                  </p>
                  <ol>
                    <li>
                      <code>index.html</code> holds a{" "}
                      <code>&lt;div id=&quot;root&quot;&gt;&lt;/div&gt;</code> (empty) and one
                      line of{" "}
                      <code>&lt;script type=&quot;module&quot; src=&quot;/src/main.tsx&quot;&gt;</code>.
                    </li>
                    <li>
                      <code>main.tsx</code> finds that div and uses{" "}
                      <code>ReactDOM.createRoot(...).render(&lt;App /&gt;)</code> to mount the
                      React app into it.
                    </li>
                    <li><code>App.tsx</code> renders <code>&lt;NoteManager /&gt;</code>.</li>
                    <li>
                      <code>NoteManager</code> renders <code>&lt;NoteForm /&gt;</code> and{" "}
                      <code>&lt;NoteTable /&gt;</code>, and the latter renders a pile of{" "}
                      <code>&lt;NoteItem /&gt;</code>.
                    </li>
                  </ol>
                  <p>
                    <strong>Why does the chain matter?</strong> Because it decides where the
                    state belongs. <code>NoteForm</code> and <code>NoteTable</code> are
                    siblings, and siblings cannot talk to each other directly. For
                    &ldquo;submit the form&rdquo; to change &ldquo;what the table
                    shows&rdquo;, the data has to live in their shared parent{" "}
                    <code>NoteManager</code>. That is the whole structural basis of the three
                    Q1 tasks.
                  </p>
                </>
              ),
              code: [
                real(
                  "tsx",
                  `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
                  {
                    filename: "src/main.tsx",
                    sourceFile: "react-notes-app/src/main.tsx",
                    explanation:
                      "那个 ! 是 TypeScript 的非空断言：「我保证 getElementById 不会返回 null」。StrictMode 是 React 的开发期严格模式，它会故意把组件渲染两次来帮你发现副作用问题 —— 所以开发时看到 console.log 打两遍是正常的。",
                    explanationEn:
                      "The ! is a TypeScript non-null assertion. It means: I promise getElementById will not return null. StrictMode is React's strict development mode. It renders each component twice on purpose so that side-effect problems show up early, which is why a console.log prints twice during development.",
                  },
                ),
              ],
            },
            {
              id: "fed-tree",
              heading: "Federation 项目：两个服务，两个语言",
              headingEn: "The Federation project: two services, two languages",
              body: (
                <>
                  <p>
                    这个项目的 README 直接标了哪些文件要改。<strong>只有两个。</strong>
                    其余全是 PROVIDED（给好了，别动）。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    This project&rsquo;s README marks outright which files you edit.{" "}
                    <strong>There are only two.</strong> Everything else is PROVIDED (given to
                    you, hands off).
                  </p>
                </>
              ),
              code: [
                real(
                  "text",
                  `graphql-federation-practice/
├── README.md                     任务说明，标了 EDIT THIS / PROVIDED
├── QUESTIONS.md                  ★ 两道书面题，要写答案
│
├── node-subgraph/                Node.js + Apollo Server 4（端口 4000）
│   ├── package.json
│   ├── src/
│   │   ├── index.js              PROVIDED：起服务器，每请求造 context
│   │   ├── schema.graphql        PROVIDED:GraphQL schema
│   │   ├── dataSources/orderDataSource.js   PROVIDED:3 个 mock 数据源
│   │   └── resolvers/orderResolvers.js      ★ EDIT THIS:4 个 TODO + 3 处埋雷
│   └── __tests__/resolvers.test.js          PROVIDED:10 个测试
│
└── java-service/                 Java 17 + Spring Boot 3.3（端口 8080）
    ├── pom.xml                   Maven 依赖（web / validation / actuator / test）
    ├── orders.db                 ⚠ 干扰项：没有任何代码引用它
    └── src/
        ├── main/java/com/techflow/orders/
        │   ├── controller/OrderController.java   ★ EDIT THIS:6 个 TODO
        │   ├── service/OrderService.java         PROVIDED：业务逻辑全给好了
        │   ├── repository/                      PROVIDED：内存仓库
        │   ├── model/ dto/ exception/ config/   PROVIDED
        │   └── resources/application.properties PROVIDED（书面题 2 会用到）
        └── test/java/.../OrderControllerTest.java  PROVIDED:5 个测试`,
                  { filename: "目录结构（实测）", filenameEn: "Directory layout (as measured)" },
                ),
              ],
            },
            {
              id: "distractors",
              heading: "认出干扰项",
              headingEn: "Spotting the distractors",
              lede: "考试项目里经常有「看起来很重要但其实没用」的东西。",
              ledeEn:
                "Exam projects often contain things that look important but are never used.",
              body: (
                <>
                  <ul>
                    <li>
                      <strong><code>java-service/orders.db</code></strong> ——
                      一个数据库文件。但 <code>pom.xml</code> 里<strong>没有任何 JDBC 或 JPA 依赖</strong>,
                      代码里也没有一处引用它。数据实际来自
                      <code>InMemoryOrderRepository</code>（一个内存 HashMap）。
                      看到 .db 就去配数据源，是纯浪费时间。
                    </li>
                    <li>
                      <strong>schema 里的 <code>@shareable</code></strong> ——
                      在 <code>@link(import: [...])</code> 里被引入了，但全文没用到。
                    </li>
                    <li>
                      <strong><code>InventoryDataSource.getInventoryStatus()</code></strong> ——
                      存在，但没有任何 resolver 需要它。（<code>getProductPrice()</code>
                      倒是必须用，后面会讲为什么。）
                    </li>
                    <li>
                      <strong><code>MetricsConfig.java</code></strong> ——
                      一个空的 <code>@Configuration</code> 类，里面什么都没有。
                    </li>
                  </ul>
                  <p>
                    判断方法很朴素：<strong>顺着依赖和引用找。</strong>
                    一个文件如果没有被 import、没有被注入、没有在配置里出现，
                    它就跟这次任务无关。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <ul>
                    <li>
                      <strong><code>java-service/orders.db</code></strong> —
                      a database file. But <code>pom.xml</code> has{" "}
                      <strong>no JDBC or JPA dependency whatsoever</strong>, and not one line
                      of code touches it. The data actually comes from{" "}
                      <code>InMemoryOrderRepository</code> (an in-memory HashMap). Seeing a
                      .db and going off to configure a data source is pure wasted time.
                    </li>
                    <li>
                      <strong><code>@shareable</code> in the schema</strong> —
                      it gets pulled in inside <code>@link(import: [...])</code>, then never
                      used anywhere.
                    </li>
                    <li>
                      <strong><code>InventoryDataSource.getInventoryStatus()</code></strong> —
                      it exists, but no resolver needs it. (<code>getProductPrice()</code>{" "}
                      really is mandatory; we get to why later.)
                    </li>
                    <li>
                      <strong><code>MetricsConfig.java</code></strong> —
                      an empty <code>@Configuration</code> class with nothing inside it.
                    </li>
                  </ul>
                  <p>
                    The test for this is plain: <strong>follow the dependencies and the
                    references.</strong> If a file is never imported, never injected and never
                    named in config, it has nothing to do with this task.
                  </p>
                </>
              ),
            },
          ],
          exercises: [
            {
              kind: "recognition",
              id: "f-which-file",
              title: "Q1 的 state 应该放在哪个文件",
              titleEn: "Which file should hold the state for Q1",
              level: 1,
              prompt: (
                <p>
                  Q1 要求「表单提交后，新笔记出现在表格里」。表单是
                  <code>NoteForm</code>，表格是 <code>NoteTable</code>，两者是兄弟。
                  那份笔记列表数据应该存在哪个组件里？
                </p>
              ),
              promptEn: (
                <p>
                  Q1 asks that a new note appears in the table after the form is
                  submitted. The form is <code>NoteForm</code>, the table is{" "}
                  <code>NoteTable</code>, and the two are siblings. Which component
                  should hold the list of notes?
                </p>
              ),
              options: [
                { id: "a", label: "NoteForm —— 数据是它产生的", labelEn: "NoteForm — it is the one producing the data" },
                { id: "b", label: "NoteTable —— 数据是它显示的", labelEn: "NoteTable — it is the one showing the data" },
                { id: "c", label: "NoteManager —— 它是两者共同的父组件", labelEn: "NoteManager — it is the parent of both" },
                { id: "d", label: "NoteItem —— 每一行自己管自己", labelEn: "NoteItem — every row looks after itself" },
              ],
              answer: ["c"],
              explain: (
                <>
                  React 的数据是<strong>单向往下流</strong>的：父组件可以把数据传给子组件，
                  兄弟之间不能直接传。<code>NoteForm</code> 和 <code>NoteTable</code>
                  都需要碰这份列表，那它就必须放在两者共同的父组件
                  <code>NoteManager</code> 里 —— 这叫<strong>状态提升
                  (lifting state up)</strong>。真实项目里 <code>notes</code>
                  和 <code>noteToEdit</code> 两个 state 就都在 NoteManager。
                </>
              ),
              explainEn: (
                <>
                  Data in React flows <strong>one way, downwards</strong>: a parent can
                  pass data to a child, and siblings cannot pass anything to each other
                  directly. Both <code>NoteForm</code> and <code>NoteTable</code> need
                  to touch this list, so it has to sit in the parent they share,{" "}
                  <code>NoteManager</code>. This is called{" "}
                  <strong>lifting state up</strong>. In the real project both{" "}
                  <code>notes</code> and <code>noteToEdit</code> live in NoteManager.
                </>
              ),
            },
            {
              kind: "recognition",
              id: "f-distractor",
              title: "哪个是干扰项",
              titleEn: "Which one is the distractor",
              level: 1,
              prompt: <p>Federation 项目里，下面哪个文件与你要完成的任务完全无关？</p>,
              promptEn: (
                <p>
                  In the Federation project, which of these files has nothing at all to
                  do with the task you have to finish?
                </p>
              ),
              options: [
                { id: "a", label: "node-subgraph/src/dataSources/orderDataSource.js" },
                { id: "b", label: "java-service/orders.db" },
                { id: "c", label: "java-service/src/main/java/.../service/OrderService.java" },
                { id: "d", label: "node-subgraph/src/schema.graphql" },
              ],
              answer: ["b"],
              explain: (
                <>
                  <code>orders.db</code> 没有被任何代码引用，pom.xml 里也没有数据库依赖 ——
                  纯干扰项。另外三个都是必读：dataSource 决定你能调哪些方法、
                  OrderService 提供全部业务逻辑、schema.graphql 决定 resolver 要返回什么形状。
                </>
              ),
              explainEn: (
                <>
                  <code>orders.db</code> is referenced by no code at all, and pom.xml
                  has no database dependency — a pure distractor. The other three are
                  all required reading: the dataSource decides which methods you can
                  call, OrderService supplies all the business logic, and
                  schema.graphql decides what shape each resolver has to return.
                </>
              ),
            },
          ],
          transfer: [
            {
              signal: "两个兄弟组件要共享数据",
              signalEn: "Two sibling components need to share data",
              reachFor: "把 state 提升到共同父组件",
              reachForEn: "Move the state up into the parent they share",
            },
            {
              signal: "不确定某文件要不要改",
              signalEn: "You are not sure whether a file should be edited",
              reachFor: "看 README 的 EDIT THIS / PROVIDED 标注",
              reachForEn: "Check the EDIT THIS / PROVIDED labels in the README",
            },
            {
              signal: "看到一个可疑的资源文件",
              signalEn: "You find a file that looks suspicious",
              reachFor: "搜一下有没有代码引用它，没有就是干扰项",
              reachForEn: "Search for code that references it. If nothing does, it is a distractor",
            },
          ],
          recap: [
            "react-notes-app 有两道独立的题：src/ 是 React 的 Q1,q2/ 是纯 TS 的 Q2。",
            "前端启动链：index.html → main.tsx → App.tsx → NoteManager → 子组件。",
            "兄弟组件不能直接通话，所以共享数据必须放在共同父组件里。",
            "Federation 项目只有两个文件要改：orderResolvers.js 和 OrderController.java。",
            "orders.db、@shareable、getInventoryStatus、MetricsConfig 都是干扰项。",
          ],
          recapEn: [
            "react-notes-app holds two separate questions: src/ is the React Q1, q2/ is the plain TypeScript Q2.",
            "The front-end start-up chain: index.html, main.tsx, App.tsx, NoteManager, then the child components.",
            "Sibling components cannot talk to each other directly, so shared data has to sit in the parent they share.",
            "The Federation project has only two files to edit: orderResolvers.js and OrderController.java.",
            "orders.db, @shareable, getInventoryStatus and MetricsConfig are all distractors.",
          ],
        },
      ],
    },

    /* ================================================================
       Stage 1 · JavaScript
       ================================================================ */
    {
      id: "js-essentials",
      stage: "地基 · 第 2 部分",
      title: "JavaScript：只补考试真正会用的那几样",
      titleEn: "JavaScript: only the parts the exams use",
      summary:
        "不做完整 JS 教程。只讲 CRUD 三件事（增删改）背后的数组与对象操作，以及 Q2 和 resolver 都离不开的异步。",
      summaryEn:
        "Not a full JavaScript course. It covers the array and object work behind adding, deleting and updating, plus the async parts that both Q2 and the resolvers depend on.",
      lessons: [
        /* ---------- 1.1 ---------- */
        {
          id: "js-immutable-data",
          title: "数组与对象：不可变更新三件套",
          titleEn: "Arrays and objects: three ways to update without changing the original",
          blurb:
            "增、删、改一个列表，在 React 里为什么必须「造新的」而不是「改旧的」。",
          blurbEn:
            "Adding to, deleting from and editing a list: why React needs a new array instead of a changed one.",
          minutes: 14,
          objectives: [
            "熟练用展开语法新增、filter 删除、map 就地替换",
            "解释「不可变更新」是什么意思，以及为什么 React 需要它",
            "会用解构从对象里取值、给组件 props 取值",
            "看到一段列表操作，能判断它改的是原数组还是新数组",
          ],
          objectivesEn: [
            "Use spread syntax to add, filter to delete, and map to replace an item in place",
            "Explain what it means to update without changing the original, and why React needs it",
            "Use destructuring to read values out of an object and out of component props",
            "Look at some list code and say whether it changes the original array or builds a new one",
          ],
          whyForAssessment:
            "Q1 的三道题，本质就是这三个操作各一次：Add 用展开、Delete 用 filter、Edit 用 map。GraphQL 那边的 createOrder 也要用 map 给每个 item 补价格。学会这一节，两门考试的数据操作部分就都通了。",
          whyForAssessmentEn:
            "The three parts of Q1 are one of each operation: Add uses spread, Delete uses filter, Edit uses map. On the GraphQL side, createOrder also uses map to add a price to every item. Learn this lesson and the data handling of both exams is covered.",
          sourceFiles: [
            {
              path: "react-notes-app/src/components/NoteManager/index.tsx",
              role: "三个操作的真实用法都在这里",
              roleEn: "The real use of all three operations is here",
            },
          ],
          concepts: [
            {
              id: "why-immutable",
              heading: "为什么不能直接改",
              headingEn: "Why you cannot change the original directly",
              lede: "React 判断「要不要重新渲染」的方法，是比较「新旧是不是同一个东西」。",
              ledeEn:
                "React decides whether to render again by checking whether the new value is the same object as the old one.",
              body: (
                <>
                  <p>
                    先看这两段的区别：
                  </p>
                  <p>
                    左边 <code>push</code> 是<strong>改动原数组</strong>。数组变长了，
                    但它还是<strong>同一个数组</strong> —— 内存里同一个地址。
                    右边的展开语法造了一个<strong>全新的数组</strong>,
                    内容是「旧的所有元素 + 新元素」。
                  </p>
                  <p>
                    React 在 <code>setState</code> 之后会做一次判断：
                    新值和旧值<strong>是不是同一个对象</strong>?
                    如果是同一个，它就认为「没变化」，直接跳过重新渲染。
                    <code>push</code> 之后新旧是同一个数组，React 看不出变化，
                    界面就不更新 —— 数据其实变了，屏幕上却没反应。这是新手最常见的 bug。
                  </p>
                  <p>
                    所以规矩是：<strong>永远造新的，不改旧的。</strong>
                    这个做法叫<strong>不可变更新（immutable update）</strong>。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    Start with the difference between these two:
                  </p>
                  <p>
                    On the left, <code>push</code> <strong>mutates the original
                    array</strong>. The array got longer, but it is still{" "}
                    <strong>the same array</strong> — the same address in memory. On the
                    right, spread syntax builds <strong>a brand new array</strong> whose
                    contents are &ldquo;every old element, plus the new one&rdquo;.
                  </p>
                  <p>
                    After <code>setState</code>, React runs one check: are the new value and
                    the old value <strong>the same object</strong>? If they are, it decides
                    nothing changed and skips the re-render. After <code>push</code>, old and
                    new are the same array, React sees no change, and the UI does not update —
                    the data really did change, and the screen just sits there. This is the
                    most common beginner bug there is.
                  </p>
                  <p>
                    So the rule is: <strong>always build a new one, never edit the old
                    one.</strong> The practice has a name: <strong>immutable update</strong>.
                  </p>
                </>
              ),
              code: [
                demo(
                  "ts",
                  `// ✗ 改动原数组 —— React 看不出变化
notes.push(newNote);
setNotes(notes);

// ✓ 造一个新数组 —— React 能看出变化
setNotes([...notes, newNote]);`,
                  {
                    codeEn: `// ✗ changing the original array — React sees no change
notes.push(newNote);
setNotes(notes);

// ✓ building a new array — React sees the change
setNotes([...notes, newNote]);`,
                  },
                ),
              ],
            },
            {
              id: "three-ops",
              heading: "三件套：新增 / 删除 / 就地替换",
              headingEn: "The three operations: add, delete, replace in place",
              lede: "Q1 的三道题就是这三行。",
              ledeEn: "The three parts of Q1 are these three lines.",
              body: (
                <>
                  <p>
                    这三段是从 <code>NoteManager</code> 里原样摘出来的，
                    也就是这道题的标准答案：
                  </p>
                  <p>
                    注意三处细节：
                  </p>
                  <ul>
                    <li>
                      <strong><code>setNotes(prev =&gt; ...)</code></strong> ——
                      传的是个函数，拿到的 <code>prev</code> 是「此刻最新的」值。
                      比直接用外面的 <code>notes</code> 变量安全（后面 useState 那节细讲）。
                    </li>
                    <li>
                      <strong>删除用 <code>!==</code> 而不是 <code>===</code></strong> ——
                      <code>filter</code> 保留的是「返回 true 的元素」，
                      所以条件要写「不是要删的那个」。
                    </li>
                    <li>
                      <strong>更新用 <code>map</code> 而不是「先删再加」</strong> ——
                      <code>map</code> 逐个走过每个元素，是目标就换成新的、不是就原样保留。
                      这样<strong>顺序不变</strong>。而「先 filter 掉再 push 新的」会把这条
                      挪到末尾 —— 题目明确要求「原位置更新」，那样就错了。
                    </li>
                  </ul>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    These three are lifted verbatim out of <code>NoteManager</code> — they are
                    the model answer for this question:
                  </p>
                  <p>
                    Three details to notice:
                  </p>
                  <ul>
                    <li>
                      <strong><code>setNotes(prev =&gt; ...)</code></strong> —
                      you pass a function, and the <code>prev</code> it hands you is the
                      value as of right now. Safer than reaching for the outer{" "}
                      <code>notes</code> variable (the useState lesson goes into this).
                    </li>
                    <li>
                      <strong>Delete uses <code>!==</code>, not <code>===</code></strong> —{" "}
                      <code>filter</code> keeps the elements whose callback returns true, so
                      the condition has to read &ldquo;not the one being deleted&rdquo;.
                    </li>
                    <li>
                      <strong>Update uses <code>map</code>, not &ldquo;delete then
                      append&rdquo;</strong> — <code>map</code> walks every element, swapping
                      in the new one where it matches and leaving the rest as they were. That
                      keeps <strong>the order intact</strong>. Filtering the old one out and
                      pushing the new one moves that row to the end — and the task explicitly
                      asks for an update in place, so that would be wrong.
                    </li>
                  </ul>
                </>
              ),
              code: [
                real(
                  "tsx",
                  `// 新增：旧的全都要，末尾加一个
setNotes((prev) => [...prev, submittedNote]);

// 删除：留下 id 不等于目标的
setNotes((prev) => prev.filter((note) => note.id !== id));

// 就地替换：是目标就换成新的，不是就原样留着
setNotes((prev) =>
  prev.map((note) => (note.id === submittedNote.id ? submittedNote : note)),
);`,
                  {
                    filename: "三个操作（摘自 NoteManager）",
                    filenameEn: "The three operations (taken from NoteManager)",
                    sourceFile: "react-notes-app/src/components/NoteManager/index.tsx",
                    codeEn: `// add: keep every old one, put one at the end
setNotes((prev) => [...prev, submittedNote]);

// delete: keep the ones whose id is not the target
setNotes((prev) => prev.filter((note) => note.id !== id));

// replace in place: swap the target, leave the rest untouched
setNotes((prev) =>
  prev.map((note) => (note.id === submittedNote.id ? submittedNote : note)),
);`,
                  },
                ),
              ],
            },
            {
              id: "map-filter-find",
              heading: "map / filter / find：三个都返回什么",
              headingEn: "map / filter / find: what each one returns",
              body: (
                <>
                  <p>
                    这三个方法长得像，但返回的东西完全不同。混淆它们会写出很难查的 bug:
                  </p>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>方法</th>
                          <th>返回</th>
                          <th>长度</th>
                          <th>典型用途</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><code>map</code></td>
                          <td>新数组</td>
                          <td>和原数组<strong>一样长</strong></td>
                          <td>逐个变形：渲染成 JSX、替换某一项、给每项补字段</td>
                        </tr>
                        <tr>
                          <td><code>filter</code></td>
                          <td>新数组</td>
                          <td><strong>可能更短</strong></td>
                          <td>筛掉不要的：删除、搜索</td>
                        </tr>
                        <tr>
                          <td><code>find</code></td>
                          <td><strong>单个元素</strong>或 <code>undefined</code></td>
                          <td>—</td>
                          <td>找一个：按 id 取某条数据</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    这三个在两个考试里都真实出现过。<code>map</code> 在
                    <code>NoteTable</code> 里把 notes 渲染成行；<code>filter</code> 在
                    <code>OrderDataSource.getOrdersByUserId</code> 里按 userId 筛订单；
                    <code>find</code> 在 <code>OrderDataSource.getOrder</code> 里按 id 取一条。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    These three look alike, but what they hand back is completely different.
                    Mixing them up produces bugs that are painful to track down:
                  </p>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Method</th>
                          <th>Returns</th>
                          <th>Length</th>
                          <th>Typical use</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><code>map</code></td>
                          <td>a new array</td>
                          <td><strong>the same length</strong> as the original</td>
                          <td>Reshape each item: render to JSX, replace one entry, add a field to every entry</td>
                        </tr>
                        <tr>
                          <td><code>filter</code></td>
                          <td>a new array</td>
                          <td><strong>possibly shorter</strong></td>
                          <td>Drop what you do not want: delete, search</td>
                        </tr>
                        <tr>
                          <td><code>find</code></td>
                          <td><strong>one element</strong> or <code>undefined</code></td>
                          <td>—</td>
                          <td>Find one: fetch a single record by id</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    All three show up for real in both exams. <code>map</code> renders notes
                    into rows inside <code>NoteTable</code>; <code>filter</code> picks orders
                    by userId in <code>OrderDataSource.getOrdersByUserId</code>;{" "}
                    <code>find</code> pulls one record by id in{" "}
                    <code>OrderDataSource.getOrder</code>.
                  </p>
                </>
              ),
              code: [
                real(
                  "js",
                  `async getOrder(id) {
  await new Promise(resolve => setTimeout(resolve, 10));
  return this.orders.find(order => order.id === id);      // 一条，或 undefined
}

async getOrdersByUserId(userId) {
  await new Promise(resolve => setTimeout(resolve, 10));
  return this.orders.filter(order => order.userId === userId);  // 数组，可能是空的
}`,
                  {
                    filename: "orderDataSource.js（节选）",
                    filenameEn: "orderDataSource.js (excerpt)",
                    sourceFile:
                      "graphql-federation-practice/node-subgraph/src/dataSources/orderDataSource.js",
                    codeEn: `async getOrder(id) {
  await new Promise(resolve => setTimeout(resolve, 10));
  return this.orders.find(order => order.id === id);      // one, or undefined
}

async getOrdersByUserId(userId) {
  await new Promise(resolve => setTimeout(resolve, 10));
  return this.orders.filter(order => order.userId === userId);  // an array, possibly empty
}`,
                    explanation:
                      "注意 find 找不到时返回 undefined，而 filter 找不到时返回空数组 []。这个区别在写 resolver 时至关重要 —— schema 里写了 [Order!]! 的字段绝对不能返回 undefined。",
                    explanationEn:
                      "Note that find returns undefined when it finds nothing, while filter returns an empty array []. That difference matters a lot when you write a resolver — a field declared [Order!]! in the schema must never return undefined.",
                  },
                ),
              ],
            },
            {
              id: "spread-objects",
              heading: "对象展开：改一个字段，其他原样",
              headingEn: "Object spread: change one field, keep the rest",
              body: (
                <>
                  <p>
                    数组用 <code>[...arr, x]</code>，对象用 <code>{"{...obj, key: v}"}</code>。
                    后面的键会覆盖前面的：
                  </p>
                  <p>
                    这个写法在 Federation 那道题里有实际用途：
                    <code>createOrder</code> 收到的 item 只有
                    <code>productId</code> 和 <code>quantity</code>,
                    需要补上 <code>price</code> 才能算总价。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    Arrays use <code>[...arr, x]</code>; objects use{" "}
                    <code>{"{...obj, key: v}"}</code>. Later keys overwrite earlier ones:
                  </p>
                  <p>
                    This has a real use in the Federation question: the item that{" "}
                    <code>createOrder</code> receives only carries <code>productId</code> and{" "}
                    <code>quantity</code>, and you have to add <code>price</code> before you
                    can work out a total.
                  </p>
                </>
              ),
              code: [
                real(
                  "js",
                  `// 我为 Federation 那题写的参考解法（已跑通 10/10 测试）
const pricedItems = await Promise.all(
  items.map(async item => ({
    productId: item.productId,
    quantity: item.quantity,
    price: await dataSources.inventoryDataSource.getProductPrice(item.productId)
  }))
);`,
                  {
                    filename: "给每个 item 补上 price",
                    filenameEn: "Adding price to every item",
                    codeEn: `// my reference answer for the Federation question (10/10 tests pass)
const pricedItems = await Promise.all(
  items.map(async item => ({
    productId: item.productId,
    quantity: item.quantity,
    price: await dataSources.inventoryDataSource.getProductPrice(item.productId)
  }))
);`,
                    explanation:
                      "map 的回调是 async，所以返回的是「一堆 Promise」，必须用 Promise.all 等它们全部完成。这是 map + async 组合的固定套路 —— 只写 map 不加 Promise.all 是很常见的错。",
                    explanationEn:
                      "The callback of map is async, so it returns a set of Promises, and Promise.all is needed to wait for all of them. This is the fixed pattern for map plus async — writing map without Promise.all is a very common mistake.",
                  },
                ),
              ],
            },
            {
              id: "destructuring",
              heading: "解构：从对象里一次取好几个值",
              headingEn: "Destructuring: take several values out of an object at once",
              body: (
                <>
                  <p>
                    你会在两个考试的每一个组件和 resolver 里看到它：
                  </p>
                  <p>
                    <code>{"{ onSubmit, noteToEdit }"}</code> 写在函数参数位置，
                    意思是「传进来的那个对象里，把 <code>onSubmit</code> 和
                    <code>noteToEdit</code> 这两个键取出来当局部变量」。
                    resolver 的第三个参数 context 也是这么拆的。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    You will run into it in every component and every resolver across both
                    exams:
                  </p>
                  <p>
                    <code>{"{ onSubmit, noteToEdit }"}</code> written in the parameter
                    position means &ldquo;out of the object handed to me, pull the{" "}
                    <code>onSubmit</code> and <code>noteToEdit</code> keys out as local
                    variables&rdquo;. A resolver&rsquo;s third parameter, context, gets taken
                    apart the same way.
                  </p>
                </>
              ),
              code: [
                real(
                  "tsx",
                  `// React：从 props 里解构
const NoteForm: React.FC<NoteFormProps> = ({ onSubmit, noteToEdit }) => { ... }

// GraphQL：从 context 里解构
async orders(user, _, { dataSources, loaders, correlationId }) { ... }`,
                  {
                    codeEn: `// React: destructuring out of props
const NoteForm: React.FC<NoteFormProps> = ({ onSubmit, noteToEdit }) => { ... }

// GraphQL: destructuring out of context
async orders(user, _, { dataSources, loaders, correlationId }) { ... }`,
                    explanation:
                      "GraphQL resolver 那行里的 _ 只是个「我不用这个参数」的约定写法（那个位置是 args）。它不是特殊语法，就是个普通变量名。",
                    explanationEn:
                      "The _ on the GraphQL resolver line is only a convention meaning \"I do not use this parameter\" (that position holds args). It is not special syntax, just an ordinary variable name.",
                  },
                ),
              ],
            },
          ],
          exercises: [
            {
              kind: "fill-blank",
              id: "f-crud-blanks",
              title: "补全 Q1 的三个数据操作",
              titleEn: "Fill in the three data operations of Q1",
              level: 2,
              prompt: (
                <p>
                  这是 <code>NoteManager</code> 里三个 handler 的真实代码，
                  挖掉了决定行为的关键词。想清楚每个操作要「保留多少条」再填。
                </p>
              ),
              promptEn: (
                <p>
                  This is the real code of the three handlers in{" "}
                  <code>NoteManager</code>, with the words that decide the behaviour
                  removed. Before you fill each one in, work out how many items that
                  operation has to keep.
                </p>
              ),
              language: "tsx",
              filename: "src/components/NoteManager/index.tsx",
              sourceFile: "react-notes-app/src/components/NoteManager/index.tsx",
              template: `const handleSubmitNote = (submittedNote: Note) => {
  if (noteToEdit) {
    setNotes((prev) =>
      prev.___1___((note) =>
        note.id === submittedNote.id ? submittedNote : note,
      ),
    );
    setNoteToEdit(null);
  } else {
    setNotes((prev) => [___2___, submittedNote]);
  }
};

const handleDelete = (id: number) => {
  setNotes((prev) => prev.___3___((note) => note.id ___4___ id));
};`,
              blanks: [
                {
                  n: 1,
                  accept: ["map"],
                  hint: "要求「原位置更新」——  所以结果数组必须和原来一样长、顺序一样。",
                  hintEn: "The task says update in place, so the result must have the same length and the same order.",
                  why: (
                    <>
                      <code>map</code> 保持长度和顺序不变，逐个决定「这一项换不换」。
                      如果用 <code>filter</code> 删掉旧的再 push 新的，顺序就变了，
                      题目要求的「原位置更新」就没做到。
                    </>
                  ),
                  whyEn: (
                    <>
                      <code>map</code> keeps the length and the order, and decides item
                      by item whether to swap it. If you use <code>filter</code> to drop
                      the old one and then push the new one, the order changes and the
                      &ldquo;update in place&rdquo; the task asked for is not done.
                    </>
                  ),
                  width: 6,
                },
                {
                  n: 2,
                  accept: ["...prev", "... prev"],
                  hint: "旧的全都要保留，新的加在后面。",
                  hintEn: "Keep every old item and put the new one after them.",
                  why: (
                    <>
                      <code>[...prev, submittedNote]</code> 造了一个新数组，
                      内容是旧的全部加上新的一条。<strong>必须是新数组</strong> ——
                      如果写 <code>prev.push(...)</code>,React 会认为值没变、不重新渲染。
                    </>
                  ),
                  whyEn: (
                    <>
                      <code>[...prev, submittedNote]</code> builds a new array holding
                      every old item plus the new one. <strong>It has to be a new
                      array</strong> — write <code>prev.push(...)</code> and React
                      decides the value did not change and does not re-render.
                    </>
                  ),
                  width: 9,
                },
                {
                  n: 3,
                  accept: ["filter"],
                  hint: "删除意味着结果会变短。",
                  hintEn: "Deleting means the result gets shorter.",
                  why: <><code>filter</code> 是唯一会让数组变短的那个。</>,
                  whyEn: (
                    <>
                      <code>filter</code> is the only one of them that makes an array
                      shorter.
                    </>
                  ),
                  width: 8,
                },
                {
                  n: 4,
                  accept: ["!==", "!="],
                  hint: "filter 保留的是「回调返回 true」的元素。",
                  hintEn: "filter keeps the items whose callback returned true.",
                  why: (
                    <>
                      要删掉 id 相等的那条，就得<strong>保留</strong>不相等的 ——
                      所以是 <code>!==</code>。写成 <code>===</code> 的结果是
                      「只留下要删的那一条」，正好反了。
                      另外这里必须按 <code>id</code> 比，不能按 title 比：
                      题目原文写的是「该行<strong>按 id</strong> 被移除」。
                    </>
                  ),
                  whyEn: (
                    <>
                      To drop the note whose id matches, you have to{" "}
                      <strong>keep</strong> the ones that do not match — so it is{" "}
                      <code>!==</code>. Writing <code>===</code> keeps only the note you
                      wanted to delete, which is exactly backwards. It also has to
                      compare on <code>id</code>, not on title: the task text says the
                      row is removed <strong>by id</strong>.
                    </>
                  ),
                  width: 5,
                },
              ],
            },
            {
              kind: "debug",
              id: "f-debug-push",
              title: "Debug Lab · 数据加进去了，界面没反应",
              titleEn: "Debug Lab · the data went in, the screen did not move",
              level: 2,
              prompt: (
                <p>
                  这一类 bug 最难查，因为<strong>它不报错</strong>。
                  先看现象，判断类型，再找病灶 —— 别跳步。
                </p>
              ),
              promptEn: (
                <p>
                  This kind of bug is the hardest to find, because{" "}
                  <strong>it reports no error</strong>. Read the symptom, classify it,
                  then locate it. Do not skip a step.
                </p>
              ),
              errorOutput: `# 没有任何报错。控制台干净。
# 现象：填好表单点 Add，表格里什么都不出现。
# 在 handleSubmitNote 里 console.log(notes) —— 长度确实在增加。

notes.length before: 0
notes.length after : 1     ← 数据真的进去了
（但 <NoteTable /> 渲染出来的行数始终是 0）`,
              errorOutputEn: `# No error at all. The console is clean.
# Symptom: fill in the form, click Add, and nothing shows up in the table.
# Add console.log(notes) inside handleSubmitNote — the length really does grow.

notes.length before: 0
notes.length after : 1     ← the data really did go in
(But <NoteTable /> always renders 0 rows.)`,
              broken: demo(
                "tsx",
                `const handleSubmitNote = (submittedNote: Note) => {
  notes.push(submittedNote);
  setNotes(notes);
};`,
                { filename: "有问题的写法", filenameEn: "The broken version" },
              ),
              classify: {
                options: [
                  { id: "a", label: "语法错误 —— 代码写得不合法", labelEn: "Syntax error — the code is not valid" },
                  { id: "b", label: "类型错误 —— TypeScript 不让过", labelEn: "Type error — TypeScript refuses it" },
                  { id: "c", label: "状态更新错误 —— 改了原对象，React 认为没变化", labelEn: "State update error — the original object was changed, so React sees no change" },
                  { id: "d", label: "异步错误 —— 少了 await", labelEn: "Async error — an await is missing" },
                ],
                answer: "c",
              },
              locate: {
                question: "哪一行是病灶？",
                questionEn: "Which line is the cause?",
                options: [
                  { id: "a", label: "notes.push(submittedNote);" },
                  { id: "b", label: "setNotes(notes);" },
                  { id: "c", label: "函数签名 (submittedNote: Note)", labelEn: "The function signature (submittedNote: Note)" },
                  { id: "d", label: "两行都要改，但根源在 push", labelEn: "Both lines change, but push is the root of it" },
                ],
                answer: "d",
              },
              fixed: real(
                "tsx",
                `const handleSubmitNote = (submittedNote: Note) => {
  setNotes((prev) => [...prev, submittedNote]);
};`,
                {
                  filename: "改对之后",
                  filenameEn: "After the fix",
                  sourceFile: "react-notes-app/src/components/NoteManager/index.tsx",
                },
              ),
              rootCause: (
                <>
                  <p>
                    <code>push</code> 修改了原数组本身。虽然内容变了，但
                    <code>notes</code> 仍然指向<strong>同一个数组对象</strong>。
                    React 在 <code>setNotes(notes)</code> 之后做的是一次「是不是同一个东西」
                    的比较，发现「是同一个」，于是判断「状态没变」，跳过重新渲染。
                  </p>
                  <p>
                    这类 bug 特别难查，因为<strong>没有任何报错</strong>,{" "}
                    <code>console.log</code> 还告诉你数据是对的。
                    记住这个特征：<strong>数据对了但界面不动 → 九成是改了原对象。</strong>
                  </p>
                </>
              ),
              rootCauseEn: (
                <>
                  <p>
                    <code>push</code> changed the original array itself. The contents are
                    different, but <code>notes</code> still points at{" "}
                    <strong>the same array object</strong>. After{" "}
                    <code>setNotes(notes)</code> React compares &ldquo;is this the same
                    thing?&rdquo;, finds that it is, decides the state did not change,
                    and skips the re-render.
                  </p>
                  <p>
                    This kind of bug is hard to find because{" "}
                    <strong>nothing reports an error</strong> and{" "}
                    <code>console.log</code> even tells you the data is right. Remember
                    the signature: <strong>the data is right but the screen does not
                    move → nine times out of ten the original object was changed.</strong>
                  </p>
                </>
              ),
              verify: "npx vitest run",
            },
          ],
          mistakes: [
            {
              wrong: demo(
                "tsx",
                `// ✗ 更新时先删再加 —— 顺序变了
setNotes((prev) => [
  ...prev.filter((n) => n.id !== submittedNote.id),
  submittedNote,
]);`,
                {
                  codeEn: `// ✗ deleting then adding on update — the order changes
setNotes((prev) => [
  ...prev.filter((n) => n.id !== submittedNote.id),
  submittedNote,
]);`,
                },
              ),
              why: (
                <>
                  这段能让测试通过（测试里只有一条数据，看不出顺序），但违反了题目要求的
                  <strong>「原位置更新」</strong>。有两条以上数据时，被编辑的那条会跳到最后一行。
                  <strong>测试过了不等于做对了</strong> —— 这是这两个 assessment 反复出现的主题。
                </>
              ),
              whyEn: (
                <>
                  This passes the tests, because the test has only one item and the order is not
                  visible. But it breaks what the question asks for:{" "}
                  <strong>update the item where it already is</strong>. With two or more items,
                  the edited one jumps to the last row.{" "}
                  <strong>Passing the tests is not the same as getting it right</strong> — that
                  point comes back again and again in both exams.
                </>
              ),
            },
            {
              wrong: demo(
                "tsx",
                `// ✗ filter 条件写反了
setNotes((prev) => prev.filter((note) => note.id === id));`,
                {
                  codeEn: `// ✗ the filter condition is backwards
setNotes((prev) => prev.filter((note) => note.id === id));`,
                },
              ),
              why: (
                <>
                  这会「只留下要删的那一条」，把其余全删掉。<code>filter</code>
                  保留的是回调返回 <code>true</code> 的元素，所以删除操作的条件必须是
                  <code>!==</code>。
                </>
              ),
              whyEn: (
                <>
                  This keeps only the item you wanted to remove, and drops all the others.{" "}
                  <code>filter</code> keeps the elements whose callback returns{" "}
                  <code>true</code>, so the condition for deleting has to be{" "}
                  <code>!==</code>.
                </>
              ),
            },
          ],
          transfer: [
            {
              signal: "「新增一条到列表」",
              signalEn: "Add one item to a list",
              reachFor: "[...prev, item]",
              reachForEn: "[...prev, item]",
            },
            {
              signal: "「删除某一条」",
              signalEn: "Delete one item",
              reachFor: "prev.filter(x => x.id !== id)",
              reachForEn: "prev.filter(x => x.id !== id)",
            },
            {
              signal: "「更新某一条，位置不变」",
              signalEn: "Update one item and keep its position",
              reachFor: "prev.map(x => x.id === id ? next : x)",
              reachForEn: "prev.map(x => x.id === id ? next : x)",
            },
            {
              signal: "「给每一项补上一个字段」",
              signalEn: "Add one field to every item",
              reachFor: "map + 对象展开（异步就再套 Promise.all）",
              reachForEn: "map plus object spread, wrapped in Promise.all if the work is async",
            },
            {
              signal: "数据变了但界面不动",
              signalEn: "The data changed but the interface did not",
              reachFor: "查是不是 push / splice / 直接赋值改了原对象",
              reachForEn: "Check whether push, splice or a direct assignment changed the original",
            },
          ],
          recap: [
            "React 靠「是不是同一个对象」判断变化，所以必须造新的、不改旧的。",
            "增用展开 [...prev, x]，删用 filter（!==），改用 map（三元）。",
            "map 长度不变、filter 可能变短、find 返回单个或 undefined。",
            "map 里用 async，外面一定要套 Promise.all。",
            "「数据对但界面不动」是改了原对象的典型症状，而且不会报错。",
          ],
          recapEn: [
            "React looks at whether it is the same object to decide that something changed, so build a new one and leave the old one alone.",
            "Add with spread [...prev, x], delete with filter and !==, edit with map and a conditional.",
            "map keeps the length, filter can make it shorter, find returns one item or undefined.",
            "If you use async inside map, you must wrap the result in Promise.all.",
            "Right data with a frozen interface is the usual sign that you changed the original object, and nothing reports an error.",
          ],
        },

        /* ---------- 1.2 ---------- */
        {
          id: "js-async",
          title: "异步：Promise、await、all 和 allSettled",
          titleEn: "Async: Promise, await, all and allSettled",
          blurb:
            "Q2 整道题就是异步，GraphQL resolver 每一个都是 async。这一节把它们讲透。",
          blurbEn:
            "All of Q2 is async work, and every GraphQL resolver is async. This lesson covers all of it.",
          minutes: 15,
          objectives: [
            "说清 Promise 的三种状态，以及 await 到底在等什么",
            "分清 Promise.all 和 Promise.allSettled 的行为差别",
            "知道「函数」和「函数的返回值」在异步里为什么必须分清",
            "会用 try/catch 包住 await",
          ],
          objectivesEn: [
            "Explain the three states of a Promise, and what await is actually waiting for",
            "Tell apart how Promise.all and Promise.allSettled behave",
            "Know why a function and the value a function returns must be kept apart in async code",
            "Wrap an await in try/catch",
          ],
          whyForAssessment:
            "Q2 要你手写一个「allSettled + 并发上限」；Federation 的每个 resolver 都是 async 且要求 try/catch。这一节是两道题共同的地基。",
          whyForAssessmentEn:
            "Q2 asks you to write allSettled behaviour with a limit on how many run at once. In Federation, every resolver is async and has to use try/catch. This lesson is the base both questions stand on.",
          sourceFiles: [
            {
              path: "react-notes-app/q2/taskRunner.ts",
              role: "Q2 的题面与要求都在文件顶部注释里",
              roleEn: "The Q2 problem and its requirements are in the comment at the top of the file",
            },
            {
              path: "react-notes-app/q2/demo.ts",
              role: "验证台：打印实时并发数",
              roleEn: "A test bench that prints the live concurrency count",
            },
          ],
          concepts: [
            {
              id: "promise-basics",
              heading: "Promise：一张「以后会给你结果」的凭据",
              headingEn: "A Promise is a receipt for a result that arrives later",
              lede: "它有三种状态，而且只会变一次。",
              ledeEn: "It has three states, and it settles only once.",
              body: (
                <>
                  <p>
                    <strong>Promise</strong> 代表一件「现在还没完成、以后会有结果」的事。
                    三种状态：
                  </p>
                  <ul>
                    <li><strong>pending</strong> —— 还在做</li>
                    <li><strong>fulfilled</strong> —— 成功了，带一个值</li>
                    <li><strong>rejected</strong> —— 失败了，带一个原因</li>
                  </ul>
                  <p>
                    一旦从 pending 变成后两者之一，就<strong>永久定下来</strong>，不会再变。
                  </p>
                  <p>
                    <code>await</code> 的作用是：「在这里等着，直到这个 Promise 定下来」。
                    成功就把值交给你，失败就<strong>抛出异常</strong>（所以要用
                    <code>try/catch</code> 接）。<code>await</code> 只能写在
                    <code>async</code> 函数里。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    A <strong>Promise</strong> stands for something that is not finished yet
                    but will have a result later. Three states:
                  </p>
                  <ul>
                    <li><strong>pending</strong> — still working</li>
                    <li><strong>fulfilled</strong> — succeeded, carries a value</li>
                    <li><strong>rejected</strong> — failed, carries a reason</li>
                  </ul>
                  <p>
                    Once it moves out of pending into one of the other two, it is{" "}
                    <strong>settled for good</strong> and never changes again.
                  </p>
                  <p>
                    What <code>await</code> does is: &ldquo;stand here until this Promise
                    settles&rdquo;. On success it hands you the value; on failure it{" "}
                    <strong>throws</strong> (which is why you catch it with{" "}
                    <code>try/catch</code>). <code>await</code> only works inside an{" "}
                    <code>async</code> function.
                  </p>
                </>
              ),
              code: [
                real(
                  "js",
                  `async getOrdersByUserId(userId) {
  await new Promise(resolve => setTimeout(resolve, 10));   // 假装网络延迟 10ms
  return this.orders.filter(order => order.userId === userId);
}`,
                  {
                    filename: "真实项目里最常见的 async 长相",
                    filenameEn: "The most common shape of async in a real project",
                    sourceFile:
                      "graphql-federation-practice/node-subgraph/src/dataSources/orderDataSource.js",
                    codeEn: `async getOrdersByUserId(userId) {
  await new Promise(resolve => setTimeout(resolve, 10));   // pretend a 10ms network delay
  return this.orders.filter(order => order.userId === userId);
}`,
                    explanation:
                      "async 函数的返回值一定被包成 Promise。所以哪怕这里 return 的是普通数组，调用方也得 await 才能拿到它。",
                    explanationEn:
                      "Whatever an async function returns is always wrapped in a Promise. So even though this one returns a plain array, the caller still has to await it to get the array.",
                  },
                ),
              ],
            },
            {
              id: "fn-vs-result",
              heading: "最关键的一个区分：函数，还是函数的返回值",
              headingEn: "The key distinction: a function, or the value the function returns",
              lede: "Q2 整道题都建立在这个区分上。",
              ledeEn: "The whole of Q2 rests on this distinction.",
              body: (
                <>
                  <p>看 Q2 的类型定义：</p>
                  <p>
                    <code>Task&lt;T&gt;</code> 是 <strong>一个函数</strong>:{" "}
                    <code>() =&gt; Promise&lt;T&gt;</code>。
                    不是 Promise，是「调用之后才产生 Promise 的函数」。
                  </p>
                  <p>
                    这个区分为什么是整道题的关键？因为<strong>Promise 一旦创建就开始跑了，
                    没法暂停。</strong>如果 <code>tasks</code> 是一堆 Promise,
                    那它们在你拿到手之前就已经全部并发跑起来了，「并发上限」根本无从谈起。
                  </p>
                  <p>
                    正因为它们是<strong>函数</strong>，你才能控制「什么时候调用」——
                    先调两个，等其中一个完了，再调第三个。这就是并发节流的全部原理。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>Look at the Q2 type definitions:</p>
                  <p>
                    <code>Task&lt;T&gt;</code> is <strong>a function</strong>:{" "}
                    <code>() =&gt; Promise&lt;T&gt;</code>. Not a Promise — a function that
                    only produces a Promise once you call it.
                  </p>
                  <p>
                    Why is that distinction the whole question? Because{" "}
                    <strong>a Promise starts running the instant it is created, and there is
                    no pause button.</strong> If <code>tasks</code> were a pile of Promises,
                    they would all be running concurrently before you ever got your hands on
                    them, and a concurrency cap would mean nothing.
                  </p>
                  <p>
                    Precisely because they are <strong>functions</strong>, you get to control
                    when they are called — call two, wait for one to finish, then call the
                    third. That is the entire principle behind concurrency throttling.
                  </p>
                </>
              ),
              code: [
                real(
                  "ts",
                  `export type Task<T> = () => Promise<T>;

export type SettledResult<T> =
  | { status: "fulfilled"; value: T }
  | { status: "rejected";  reason: unknown };`,
                  {
                    filename: "q2/taskRunner.ts（顶部类型定义）",
                    filenameEn: "q2/taskRunner.ts (the type definitions at the top)",
                    sourceFile: "react-notes-app/q2/taskRunner.ts",
                  },
                ),
                demo(
                  "ts",
                  `const task = () => fetch("/api/orders");   // 一个函数。什么都还没发生。
const promise = task();                    // 调用了 → 请求现在才发出去

await task;      // ✗ 错：在等一个函数，它不是 Promise，立刻就过去了
await task();    // ✓ 对：先调用，再等它的返回值`,
                  {
                    codeEn: `const task = () => fetch("/api/orders");   // a function. Nothing has happened yet.
const promise = task();                    // called → only now is the request sent

await task;      // ✗ wrong: waiting on a function, not a Promise, so it passes at once
await task();    // ✓ right: call it first, then wait for what it returns`,
                  },
                ),
              ],
            },
            {
              id: "all-vs-allsettled",
              heading: "Promise.all 和 Promise.allSettled：差别在「一个失败了怎么办」",
              headingEn:
                "Promise.all and Promise.allSettled: they differ in what happens when one fails",
              body: (
                <>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th></th>
                          <th><code>Promise.all</code></th>
                          <th><code>Promise.allSettled</code></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>全部成功</td>
                          <td>返回值数组 <code>[v1, v2]</code></td>
                          <td>返回 <code>[{"{status:\"fulfilled\",value}"}, ...]</code></td>
                        </tr>
                        <tr>
                          <td>有一个失败</td>
                          <td><strong>立刻整体 reject</strong>，其他结果全丢</td>
                          <td>照样等全部结束，失败那个记成 <code>rejected</code></td>
                        </tr>
                        <tr>
                          <td>顺序</td>
                          <td>与输入一致</td>
                          <td>与输入一致</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    两个都<strong>保证顺序与输入一致</strong> —— 哪个先完成不影响结果数组的位置。
                    这一点很多人以为是「谁先完成谁在前」，是错的。
                  </p>
                  <p>
                    Q2 的要求原文是「The runner NEVER throws, even if some tasks reject」，
                    也就是 <code>allSettled</code> 的语义，再加一个并发上限。
                    而 <code>Promise.all</code> 在两个考试里也真实出现了 ——
                    subgraph 的 DataLoader 批量函数就用它同时取多个订单。
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
                          <th><code>Promise.all</code></th>
                          <th><code>Promise.allSettled</code></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>All succeed</td>
                          <td>An array of values <code>[v1, v2]</code></td>
                          <td>Returns <code>[{"{status:\"fulfilled\",value}"}, ...]</code></td>
                        </tr>
                        <tr>
                          <td>One fails</td>
                          <td><strong>Rejects as a whole, immediately</strong>, and the other results are lost</td>
                          <td>Still waits for all of them; the failed one is recorded as <code>rejected</code></td>
                        </tr>
                        <tr>
                          <td>Order</td>
                          <td>Matches the input</td>
                          <td>Matches the input</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    Both of them <strong>guarantee the order matches the input</strong> —
                    which one finishes first has no bearing on its slot in the result array.
                    Plenty of people assume it is first-to-finish-comes-first. It is not.
                  </p>
                  <p>
                    The Q2 requirement reads &ldquo;The runner NEVER throws, even if some
                    tasks reject&rdquo;, which is exactly <code>allSettled</code> semantics
                    plus a concurrency cap. And <code>Promise.all</code> genuinely shows up in
                    both exams too — the subgraph&rsquo;s DataLoader batch function uses it to
                    fetch several orders at once.
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
                    filename: "真实项目里的 Promise.all",
                    filenameEn: "Promise.all in a real project",
                    sourceFile:
                      "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js",
                    explanation:
                      "map 把每个 id 变成一个 Promise,Promise.all 等它们全部完成。顺序与 orderIds 一致 —— 这对 DataLoader 是硬要求，因为它靠位置把结果发回给各个调用方。",
                    explanationEn:
                      "map turns each id into a Promise, and Promise.all waits for all of them to finish. The result order matches orderIds. DataLoader requires that, because it uses position to send each result back to the caller that asked for it.",
                  },
                ),
              ],
            },
            {
              id: "worker-pool",
              heading: "并发上限的实现思路：共享一个游标的 worker",
              headingEn: "How to limit how many run at once: workers sharing one cursor",
              lede: "别想复杂了。就是「开 limit 个工人，一起从同一个待办队列里抢活」。",
              ledeEn:
                "It is simpler than it sounds. Start limit workers, and let them all take the next job from the same queue.",
              body: (
                <>
                  <p>
                    想象 6 个任务，并发上限 2。错误的思路是「切成 3 批，每批 2 个」——
                    那样每批都要等最慢的那个，浪费。
                  </p>
                  <p>
                    正确的思路是 <strong>worker pool（工人池）</strong>:
                  </p>
                  <ol>
                    <li>准备一个共享游标 <code>nextIndex = 0</code>。</li>
                    <li>启动 <code>limit</code> 个 worker，每个都是一个 async 函数。</li>
                    <li>
                      每个 worker 循环：抢走当前游标指向的任务（游标 +1）→ 跑它 →
                      结果写回 <code>results[i]</code> → 回到循环开头再抢下一个。
                    </li>
                    <li>队列空了，worker 自然退出。</li>
                    <li><code>await Promise.all(workers)</code> 等所有 worker 收工。</li>
                  </ol>
                  <p>
                    同时在跑的永远只有 <code>limit</code> 个 worker，所以并发数天然不会超。
                    结果按 <code>results[i]</code> 的下标写回，所以<strong>顺序自动是对的</strong>,
                    不需要额外排序。
                  </p>
                  <p>
                    实测这个思路在项目里的输出（<code>npm run q2</code>）：
                    <code>running now</code> 始终 ≤ 2，最终 6 条结果顺序与输入一致，
                    第 3 个任务以 <code>rejected</code> 出现。完整实现在 React 那门课的
                    Q2 那一节。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    Picture 6 tasks with a concurrency cap of 2. The wrong idea is &ldquo;cut
                    it into 3 batches of 2&rdquo; — every batch then waits on its slowest
                    member, which is wasteful.
                  </p>
                  <p>
                    The right idea is a <strong>worker pool</strong>:
                  </p>
                  <ol>
                    <li>Set up one shared cursor, <code>nextIndex = 0</code>.</li>
                    <li>Start <code>limit</code> workers, each one an async function.</li>
                    <li>
                      Each worker loops: grab the task the cursor points at (cursor +1) → run
                      it → write the outcome back into <code>results[i]</code> → back to the
                      top of the loop to grab the next one.
                    </li>
                    <li>Queue empty, the worker exits on its own.</li>
                    <li><code>await Promise.all(workers)</code> waits for every worker to clock out.</li>
                  </ol>
                  <p>
                    Only <code>limit</code> workers are ever running at once, so the
                    concurrency count cannot go over by construction. Results are written back
                    at index <code>results[i]</code>, so <strong>the order is right
                    automatically</strong> and no extra sorting is needed.
                  </p>
                  <p>
                    Measured output of this approach in the project (<code>npm run q2</code>):{" "}
                    <code>running now</code> never reaches 3, the final 6 results come out in
                    input order, and task 3 shows up as <code>rejected</code>. The full
                    implementation is in the Q2 lesson of the React course.
                  </p>
                </>
              ),
              code: [
                real(
                  "text",
                  `task 1 START   (running now: 1)
task 2 START   (running now: 2)     ← 到上限了，3 号只能等
task 2 DONE    (running now: 1)
task 3 START   (running now: 2)     ← 有位置了，立刻补上
task 1 DONE    (running now: 1)
task 4 START   (running now: 2)
task 3 FAIL    (running now: 1)     ← 失败也只是空出一个位置，不影响别人
task 5 START   (running now: 2)
task 4 DONE    (running now: 1)
task 6 START   (running now: 2)
task 5 DONE    (running now: 1)
task 6 DONE    (running now: 0)`,
                  {
                    filename: "npm run q2 的真实输出",
                    filenameEn: "The real output of npm run q2",
                    explanation:
                      "读这段输出的方法：盯住 running now，它从来没到 3。而且任务 3 失败之后，4、5、6 照样跑完了 —— 这就是 allSettled 的语义。",
                    explanationEn:
                      "How to read this output: watch running now, which never reaches 3. And after task 3 fails, tasks 4, 5 and 6 still finish — that is what allSettled means.",
                  },
                ),
              ],
            },
            {
              id: "try-catch-await",
              heading: "try/catch 包住 await",
              headingEn: "Wrapping await in try/catch",
              body: (
                <>
                  <p>
                    <code>await</code> 遇到 rejected 会<strong>抛异常</strong>,
                    行为和 <code>throw</code> 一样。所以要接住它，就用普通的
                    <code>try/catch</code>:
                  </p>
                  <p>
                    Federation 那道题的每个 resolver 都要求这个结构 ——
                    TODO 原文写的是「with proper error handling」。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    When <code>await</code> meets a rejected Promise it{" "}
                    <strong>throws</strong>, behaving exactly like <code>throw</code>. So to
                    catch it, you use an ordinary <code>try/catch</code>:
                  </p>
                  <p>
                    Every resolver in the Federation question wants this shape — the TODO
                    reads &ldquo;with proper error handling&rdquo;.
                  </p>
                </>
              ),
              code: [
                real(
                  "ts",
                  `try {
  const value = await tasks[i]();
  results[i] = { status: "fulfilled", value };
} catch (reason) {
  results[i] = { status: "rejected", reason };
}`,
                  {
                    filename: "Q2 里的 try/catch（参考答案节选）",
                    filenameEn: "try/catch in Q2 (excerpt of the reference answer)",
                    sourceFile: "react-notes-app/q2/taskRunner.ts",
                    explanation:
                      "关键点：catch 之后 worker 没有退出，循环继续。所以一个任务失败不会连累其他任务 —— 这正是「NEVER throws」的实现方式。",
                    explanationEn:
                      "The key point: after the catch the worker does not exit, the loop keeps going. So one failed task does not affect the others. That is how the NEVER throws requirement is met.",
                  },
                ),
              ],
            },
          ],
          exercises: [
            {
              kind: "recognition",
              id: "f-async-all",
              title: "该用 all 还是 allSettled",
              titleEn: "all or allSettled",
              level: 1,
              prompt: (
                <p>
                  Q2 的要求原文：「The runner NEVER throws, even if some tasks reject.
                  It resolves with an array of results IN THE SAME ORDER as tasks.」
                  这描述的是哪个内置方法的语义？
                </p>
              ),
              promptEn: (
                <p>
                  The exact wording of the Q2 requirement: &ldquo;The runner NEVER
                  throws, even if some tasks reject. It resolves with an array of
                  results IN THE SAME ORDER as tasks.&rdquo; Which built-in method
                  behaves like that?
                </p>
              ),
              options: [
                { id: "a", label: "Promise.all" },
                { id: "b", label: "Promise.allSettled" },
                { id: "c", label: "Promise.race" },
                { id: "d", label: "Promise.any" },
              ],
              answer: ["b"],
              explain: (
                <>
                  「有失败也不抛、把每个结果按 fulfilled/rejected 记下来、顺序与输入一致」
                  就是 <code>allSettled</code>。<code>all</code> 会在第一个失败时整体 reject。
                  <code>race</code> 返回最先定下来的那一个，<code>any</code>
                  返回最先成功的那一个 —— 都不是这题要的。
                  Q2 的注释里也直接写了：<em>This mimics Promise.allSettled, but with a
                  concurrency throttle.</em>
                </>
              ),
              explainEn: (
                <>
                  &ldquo;Never throws even when something fails, records each result as
                  fulfilled or rejected, and keeps the input order&rdquo; is exactly{" "}
                  <code>allSettled</code>. <code>all</code> rejects as a whole on the
                  first failure. <code>race</code> returns whichever settles first and{" "}
                  <code>any</code> returns whichever succeeds first — neither is what
                  this asks for. The Q2 comments say it outright:{" "}
                  <em>This mimics Promise.allSettled, but with a concurrency
                  throttle.</em>
                </>
              ),
            },
            {
              kind: "recognition",
              id: "f-async-fn",
              title: "为什么 tasks 是「函数数组」而不是「Promise 数组」",
              titleEn: "Why tasks is an array of functions, not an array of Promises",
              level: 1,
              prompt: (
                <p>
                  <code>Task&lt;T&gt; = () =&gt; Promise&lt;T&gt;</code>。
                  如果题目改成传一个 <code>Promise&lt;T&gt;[]</code> 进来，
                  会出什么问题？
                </p>
              ),
              promptEn: (
                <p>
                  <code>Task&lt;T&gt; = () =&gt; Promise&lt;T&gt;</code>. If the
                  question passed in a <code>Promise&lt;T&gt;[]</code> instead, what
                  would go wrong?
                </p>
              ),
              options: [
                { id: "a", label: "结果顺序会乱掉", labelEn: "The order of the results gets scrambled" },
                { id: "b", label: "Promise 创建的那一刻就开始跑了，并发上限根本无法实现", labelEn: "A Promise starts running the moment it is created, so a concurrency limit cannot be built at all" },
                { id: "c", label: "TypeScript 编译不过", labelEn: "TypeScript refuses to compile it" },
                { id: "d", label: "没区别，写起来还更简单", labelEn: "No difference, and it is simpler to write" },
              ],
              answer: ["b"],
              explain: (
                <>
                  Promise 是「已经在进行中的事」，没有暂停键。
                  <code>[fetch(a), fetch(b), fetch(c)]</code> 这个数组一写出来，
                  三个请求就已经同时发出去了。要控制并发，就必须控制
                  <strong>「什么时候开始」</strong>，所以传进来的必须是
                  <strong>还没调用的函数</strong>。这是整道题的设计核心。
                </>
              ),
              explainEn: (
                <>
                  A Promise is something already in progress, and it has no pause
                  button. The moment you write{" "}
                  <code>[fetch(a), fetch(b), fetch(c)]</code>, all three requests have
                  already gone out together. To control how many run at once you have to
                  control <strong>when each one starts</strong>, so what is passed in has
                  to be <strong>functions that have not been called yet</strong>. That is
                  the core of the whole question.
                </>
              ),
            },
            {
              kind: "fill-blank",
              id: "f-async-blanks",
              title: "补全 DataLoader 的批量函数",
              titleEn: "Fill in the batch function of the DataLoader",
              level: 2,
              prompt: (
                <p>
                  这是 subgraph 里真实的 DataLoader 批量加载函数。
                  两个空都关系到「异步 + 数组」的固定套路。
                </p>
              ),
              promptEn: (
                <p>
                  This is the real DataLoader batch function from the subgraph. Both
                  blanks are part of the fixed pattern for async work over an array.
                </p>
              ),
              language: "js",
              filename: "src/resolvers/orderResolvers.js",
              sourceFile:
                "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js",
              template: `function createShippingInfoLoader(shippingDataSource) {
  return new DataLoader(async orderIds => {
    const shippingInfos = await Promise.___1___(
      orderIds.___2___(id => shippingDataSource.getShippingInfo(id))
    );

    return shippingInfos;
  });
}`,
              blanks: [
                {
                  n: 1,
                  accept: ["all"],
                  hint: "要等「一批」Promise 全部完成，而且这里希望任何一个失败都直接冒出去。",
                  hintEn: "You wait for a whole batch of Promises, and here any failure should be allowed to surface.",
                  why: (
                    <>
                      <code>Promise.all</code>。DataLoader 的批量函数需要返回一个
                      「和入参 keys 一样长、顺序一致」的数组，<code>all</code> 正好保证这两点。
                      这里不用 allSettled —— 数据源出错就应该让错误冒出去，由 resolver 的
                      try/catch 处理。
                    </>
                  ),
                  whyEn: (
                    <>
                      <code>Promise.all</code>. A DataLoader batch function has to return
                      an array that is the same length as the keys it was given, in the
                      same order, and <code>all</code> guarantees both. allSettled is
                      wrong here — if the data source fails, the error should surface and
                      be handled by the try/catch in the resolver.
                    </>
                  ),
                  width: 5,
                },
                {
                  n: 2,
                  accept: ["map"],
                  hint: "把每个 id 变成一个 Promise，数量不变。",
                  hintEn: "Turn every id into a Promise, and keep the count the same.",
                  why: (
                    <>
                      <code>map</code>。一个 id 对一个 Promise，长度和顺序都不变 ——
                      这是 DataLoader 的硬要求，它靠<strong>位置</strong>把结果分发回各个
                      <code>load()</code> 调用方。如果你在这里用了 filter，或者调换了顺序，
                      就会出现「A 拿到了 B 的数据」这种极难查的 bug。
                    </>
                  ),
                  whyEn: (
                    <>
                      <code>map</code>. One id becomes one Promise, and both the length
                      and the order stay the same. DataLoader requires this, because it
                      uses <strong>position</strong> to hand each result back to the
                      matching <code>load()</code> caller. Use filter here, or change the
                      order, and you get bugs like &ldquo;A received B&rsquo;s
                      data&rdquo;, which are very hard to track down.
                    </>
                  ),
                  width: 6,
                },
              ],
            },
          ],
          transfer: [
            {
              signal: "「不管有没有失败都要拿到全部结果」",
              signalEn: "You need every result, whether some failed or not",
              reachFor: "Promise.allSettled 的语义",
              reachForEn: "That is what Promise.allSettled does",
            },
            {
              signal: "「限制同时进行的数量」",
              signalEn: "You must limit how many run at the same time",
              reachFor: "传函数数组 + worker pool 共享游标",
              reachForEn: "Pass an array of functions, and have a pool of workers share one cursor",
            },
            {
              signal: "「一批 id 换一批数据」",
              signalEn: "Turn a list of ids into a list of records",
              reachFor: "map + Promise.all，长度与顺序不变",
              reachForEn: "map plus Promise.all. The length and the order stay the same",
            },
            {
              signal: "「proper error handling」出现在 TODO 里",
              signalEn: "A TODO comment asks for proper error handling",
              reachFor: "try { await ... } catch",
              reachForEn: "try { await ... } catch",
            },
          ],
          recap: [
            "Promise 三态，只定一次；await 成功给值、失败抛异常。",
            "() => Promise<T> 是函数，Promise<T> 是已经在跑的事 —— 并发控制只能靠前者。",
            "all 一个失败就整体失败；allSettled 全等完再汇总。两者都保证顺序。",
            "并发上限 = 开 limit 个 worker 抢同一个游标，结果按下标写回自动保序。",
            "await 要用 try/catch 接；catch 之后循环继续，才叫「不抛错」。",
          ],
          recapEn: [
            "A Promise has three states and settles only once. await gives you the value on success and throws on failure.",
            "() => Promise<T> is a function. Promise<T> is work that has already started. Only the first form lets you control how many run at once.",
            "all fails as a whole as soon as one fails. allSettled waits for all of them and then reports. Both keep the order.",
            "To cap how many run at once, start limit workers that share one cursor, and write each result back at its own index so the order is kept.",
            "Catch an await with try/catch. Only if the loop carries on after the catch does the function really not throw.",
          ],
        },

        /* ---------- 1.3 ---------- */
        {
          id: "js-modules",
          title: "ESM:import / export 与那些莫名其妙的报错",
          titleEn: "ESM: import / export, and the errors that look strange at first",
          blurb:
            "为什么 subgraph 里 import 要写 .js 后缀，为什么 jest 要加一个实验性参数。",
          blurbEn:
            "Why an import in the subgraph needs the .js ending, and why jest needs an experimental flag.",
          minutes: 10,
          objectives: [
            "分清 default export 和 named export，以及各自怎么 import",
            "知道 ESM 里相对路径必须带扩展名",
            "看懂 import type 是干什么的",
            "认出「模块系统不匹配」这一类报错",
          ],
          objectivesEn: [
            "Tell a default export from a named export, and import each one correctly",
            "Know that a relative path in ESM must include the file ending",
            "Understand what import type is for",
            "Recognise the errors that mean two module systems do not match",
          ],
          whyForAssessment:
            "两个项目都是 ESM。subgraph 的 import 少一个 .js 就跑不起来；React 项目里 import type 用错会让构建失败。这类错误的报错信息通常很不友好。",
          whyForAssessmentEn:
            "Both projects use ESM. One missing .js in a subgraph import and nothing runs. In the React project, a wrong import type makes the build fail. The messages these errors print are usually hard to read.",
          concepts: [
            {
              id: "default-vs-named",
              heading: "default 和 named：一个模块只能有一个 default",
              headingEn: "default and named: a module can have only one default",
              body: (
                <>
                  <p>
                    <code>export default X</code> 是「这个模块的主角是 X」，
                    一个文件只能有一个。import 它的时候<strong>名字随你起</strong>:
                  </p>
                  <p>
                    <code>export const A</code> / <code>export function B</code>
                    是<strong>具名导出</strong>，可以有很多个，import 时
                    <strong>名字必须对上</strong>，而且要用花括号。
                  </p>
                  <p>
                    两个考试的组件都是 default 导出（<code>export default NoteManager</code>），
                    而 subgraph 的 resolver 是具名导出
                    (<code>export const resolvers</code>)—— 所以 import 的写法不同。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    <code>export default X</code> says &ldquo;X is the main character of this
                    module&rdquo;, and a file only gets one. When you import it,{" "}
                    <strong>you pick whatever name you like</strong>:
                  </p>
                  <p>
                    <code>export const A</code> / <code>export function B</code> are{" "}
                    <strong>named exports</strong>. There can be many of them, and on import{" "}
                    <strong>the name has to line up</strong> and go inside curly braces.
                  </p>
                  <p>
                    Components in both exams are default exports (
                    <code>export default NoteManager</code>), while the subgraph resolvers are
                    named exports (<code>export const resolvers</code>) — so the import lines
                    look different.
                  </p>
                </>
              ),
              code: [
                real(
                  "tsx",
                  `// 组件：default 导出
export default NoteManager;

// 使用方：名字可以自己起，不用花括号
import NoteManager from "./components/NoteManager";
import type { Note } from "../../types/Note";      // 具名 + 只要类型`,
                  {
                    sourceFile: "react-notes-app/src/App.tsx 与各组件",
                    codeEn: `// the component: a default export
export default NoteManager;

// the caller: pick any name you like, no curly braces
import NoteManager from "./components/NoteManager";
import type { Note } from "../../types/Note";      // named, and types only`,
                  },
                ),
                real(
                  "js",
                  `// subgraph：具名导出，三个东西
export const resolvers = { ... };
export { createShippingInfoLoader, createOrderLoader };

// 使用方：名字必须一字不差，要用花括号
import {
  resolvers,
  createShippingInfoLoader,
  createOrderLoader,
} from './resolvers/orderResolvers.js';`,
                  {
                    sourceFile:
                      "graphql-federation-practice/node-subgraph/src/index.js",
                    codeEn: `// the subgraph: named exports, three of them
export const resolvers = { ... };
export { createShippingInfoLoader, createOrderLoader };

// the caller: every name must match exactly, and curly braces are required
import {
  resolvers,
  createShippingInfoLoader,
  createOrderLoader,
} from './resolvers/orderResolvers.js';`,
                  },
                ),
              ],
            },
            {
              id: "js-extension",
              heading: "ESM 里相对路径必须带 .js —— 哪怕源文件是 .ts",
              headingEn: "In ESM a relative path must end in .js, even when the source file is .ts",
              lede: "这是 Node 原生 ESM 的硬规定，不是可选风格。",
              ledeEn:
                "This is a fixed rule of native ESM in Node, not a matter of style.",
              body: (
                <>
                  <p>
                    注意上面那行：<code>from &apos;./resolvers/orderResolvers.js&apos;</code>。
                    <strong>带了 <code>.js</code>。</strong>
                  </p>
                  <p>
                    在 CommonJS（<code>require</code>）时代，Node 会帮你猜：
                    你写 <code>./foo</code>，它会依次试 <code>./foo.js</code>、
                    <code>./foo/index.js</code>。原生 ESM <strong>取消了这个猜测</strong>,
                    路径必须写完整。
                  </p>
                  <p>
                    漏了会得到这个报错 —— 而它长得像「文件不存在」，
                    容易让人去怀疑路径打错了：
                  </p>
                  <p>
                    而 React 那个项目里 <code>import App from &quot;./App&quot;</code>
                    没写后缀却能跑，因为它经过 <strong>Vite</strong> ——
                    打包器有自己的解析规则，会帮你补。
                    <strong>结论：走打包器可以省，直接给 Node 跑就必须写。</strong>
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    Look at that line above again:{" "}
                    <code>from &apos;./resolvers/orderResolvers.js&apos;</code>.{" "}
                    <strong>It carries the <code>.js</code>.</strong>
                  </p>
                  <p>
                    Back in the CommonJS (<code>require</code>) era, Node guessed for you:
                    write <code>./foo</code> and it would try <code>./foo.js</code>, then{" "}
                    <code>./foo/index.js</code>. Native ESM <strong>dropped the
                    guessing</strong>, so the path has to be written out in full.
                  </p>
                  <p>
                    Leave it off and you get this error — which reads like &ldquo;the file
                    does not exist&rdquo; and sends people off doubting their path:
                  </p>
                  <p>
                    Meanwhile <code>import App from &quot;./App&quot;</code> in the React
                    project has no extension and runs fine, because it goes through{" "}
                    <strong>Vite</strong> — a bundler has its own resolution rules and fills
                    the extension in for you. <strong>Conclusion: with a bundler you can skip
                    it; handing the file straight to Node, you must write it.</strong>
                  </p>
                </>
              ),
              code: [
                demo(
                  "bash",
                  `Error [ERR_MODULE_NOT_FOUND]: Cannot find module
  '/path/node-subgraph/src/resolvers/orderResolvers'
  imported from /path/node-subgraph/src/index.js
Did you mean to import "./resolvers/orderResolvers.js"?`,
                  {
                    filename: "漏写 .js 的报错",
                    filenameEn: "The error when .js is left off",
                    explanation:
                      "好消息是 Node 现在会给出 Did you mean 提示。看到 ERR_MODULE_NOT_FOUND，第一反应应该是「后缀漏了」，而不是「路径写错了」。",
                    explanationEn:
                      "Node now prints a Did you mean hint, which helps. When you see ERR_MODULE_NOT_FOUND, your first guess should be a missing file extension, not a wrong path.",
                  },
                ),
              ],
            },
            {
              id: "import-type",
              heading: "import type：只要类型，不要运行时代码",
              headingEn: "import type: take the type only, not any code that runs",
              body: (
                <>
                  <p>
                    <code>import type {"{ Note }"} from &quot;../../types/Note&quot;</code>
                    这个写法在告诉编译器：「我只需要 <code>Note</code> 这个<strong>类型</strong>,
                    编译完请把这行整个删掉」。
                  </p>
                  <p>
                    为什么要区分？因为 <code>type Note = {"{...}"}</code> 这种类型别名
                    <strong>在运行时根本不存在</strong> —— TypeScript 编译后类型全被擦掉了。
                    如果用普通 <code>import</code>，某些配置下打包器会保留这行 import,
                    然后在运行时去找一个不存在的导出。
                  </p>
                  <p>
                    实用规则：<strong>导入的是类型就写 <code>import type</code>,
                    导入的是能跑的东西（函数、组件、常量）就写普通 <code>import</code>。</strong>
                    真实项目里两种都有：
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    <code>import type {"{ Note }"} from &quot;../../types/Note&quot;</code>{" "}
                    tells the compiler: &ldquo;all I need is <code>Note</code> as a{" "}
                    <strong>type</strong>, so delete this whole line once you have
                    compiled&rdquo;.
                  </p>
                  <p>
                    Why draw the distinction? Because a type alias like{" "}
                    <code>type Note = {"{...}"}</code> <strong>does not exist at runtime at
                    all</strong> — TypeScript erases every type when it compiles. With a plain{" "}
                    <code>import</code>, some setups keep that import line and then go looking
                    at runtime for an export that is not there.
                  </p>
                  <p>
                    Practical rule: <strong>importing a type, write{" "}
                    <code>import type</code>; importing something that runs (a function, a
                    component, a constant), write a plain <code>import</code>.</strong> Real
                    projects carry both:
                  </p>
                </>
              ),
              code: [
                real(
                  "tsx",
                  `import React, { useState, useEffect } from "react";   // 运行时要用
import type { Note } from "../../types/Note";        // 只要类型`,
                  {
                    sourceFile: "react-notes-app/src/components/NoteForm/index.tsx",
                    codeEn: `import React, { useState, useEffect } from "react";   // needed at runtime
import type { Note } from "../../types/Note";        // the type only`,
                  },
                ),
              ],
            },
            {
              id: "esm-jest",
              heading: "为什么 subgraph 的 test script 那么长",
              headingEn: "Why the test script of the subgraph is so long",
              body: (
                <>
                  <p>回头看那条 script:</p>
                  <p>
                    Jest 诞生于 CommonJS 时代，原生 ESM 支持至今还是实验性的。
                    <code>NODE_OPTIONS=--experimental-vm-modules</code> 就是打开那个开关。
                    少了它，jest 一遇到 <code>import</code> 就报
                    <code>Cannot use import statement outside a module</code>。
                  </p>
                  <p>
                    另外 <code>package.json</code> 里内嵌的 jest 配置有
                    <code>&quot;transform&quot;: {"{}"}</code> —— 空对象，
                    意思是「不做任何转译」。因为源码本来就是标准 ESM,
                    不需要 Babel 把它转成 CommonJS。
                  </p>
                  <p>
                    这些不需要你去改。但需要你<strong>认出来</strong> ——
                    看到这条 script 就知道「这个项目是 ESM，测试是 jest，别照 CommonJS 的思路改东西」。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>Look at that script again:</p>
                  <p>
                    Jest was born in the CommonJS era, and its native ESM support is still
                    experimental to this day.{" "}
                    <code>NODE_OPTIONS=--experimental-vm-modules</code> is the switch that
                    turns it on. Without it, jest hits an <code>import</code> and reports{" "}
                    <code>Cannot use import statement outside a module</code>.
                  </p>
                  <p>
                    The jest config embedded in <code>package.json</code> also has{" "}
                    <code>&quot;transform&quot;: {"{}"}</code> — an empty object, meaning
                    &ldquo;transpile nothing&rdquo;. The source is already standard ESM, so
                    Babel is not needed to turn it into CommonJS.
                  </p>
                  <p>
                    None of this needs changing by you. It needs{" "}
                    <strong>recognising</strong> — see this script and you know &ldquo;this
                    project is ESM, the tests are jest, do not go editing things with a
                    CommonJS mindset&rdquo;.
                  </p>
                </>
              ),
              code: [
                real(
                  "json",
                  `"scripts": {
  "start": "node src/index.js",
  "test": "NODE_OPTIONS=--experimental-vm-modules jest"
},
"jest": {
  "testEnvironment": "node",
  "transform": {},
  "testMatch": ["**/__tests__/**/*.test.js"]
}`,
                  {
                    sourceFile:
                      "graphql-federation-practice/node-subgraph/package.json",
                    explanation:
                      "testMatch 说明测试文件必须放在 __tests__ 目录下、以 .test.js 结尾。放错位置 jest 就发现不了它 —— 「我写了测试但 jest 说 No tests found」多半是这个原因。",
                    explanationEn:
                      "testMatch says a test file must sit inside a __tests__ directory and end in .test.js. Put it anywhere else and jest will not find it. That is the usual reason for \"I wrote a test but jest says No tests found\".",
                  },
                ),
              ],
            },
          ],
          exercises: [
            {
              kind: "debug",
              id: "f-debug-esm",
              title: "Debug Lab · ERR_MODULE_NOT_FOUND",
              titleEn: "Debug Lab · ERR_MODULE_NOT_FOUND",
              level: 2,
              prompt: (
                <p>
                  你在 <code>node-subgraph/</code> 里跑 <code>npm start</code>,
                  服务器起不来。报错很长，但关键信息只有两行。
                </p>
              ),
              promptEn: (
                <p>
                  You run <code>npm start</code> inside{" "}
                  <code>node-subgraph/</code> and the server does not come up. The error
                  is long, but only two lines of it matter.
                </p>
              ),
              errorOutput: `$ npm start

node:internal/modules/esm/resolve:274
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
  '/Users/me/node-subgraph/src/dataSources/orderDataSource'
  imported from /Users/me/node-subgraph/src/index.js
    at finalizeResolution (node:internal/modules/esm/resolve:274:11)
Did you mean to import "./dataSources/orderDataSource.js"?`,
              broken: demo(
                "js",
                `import { resolvers } from './resolvers/orderResolvers.js';
import { OrderDataSource } from './dataSources/orderDataSource';`,
                { filename: "src/index.js（第 2 行有问题）", filenameEn: "src/index.js (line 2 is the problem)", highlight: [2] },
              ),
              classify: {
                options: [
                  { id: "a", label: "文件真的不存在 —— 路径拼错了", labelEn: "The file really is not there — the path is misspelled" },
                  { id: "b", label: "模块解析错误 —— ESM 要求相对路径带扩展名", labelEn: "Module resolution error — ESM requires the file ending on a relative path" },
                  { id: "c", label: "依赖没装 —— 要 npm install", labelEn: "The dependencies are not installed — run npm install" },
                  { id: "d", label: "导出名字对不上 —— 应该是 default export", labelEn: "The export name does not match — it should be a default export" },
                ],
                answer: "b",
              },
              locate: {
                question: "第 2 行少了什么？",
                questionEn: "What is line 2 missing?",
                options: [
                  { id: "a", label: "少了 .js 扩展名", labelEn: "The .js ending is missing" },
                  { id: "b", label: "少了 type 关键字", labelEn: "The type keyword is missing" },
                  { id: "c", label: "花括号该去掉", labelEn: "The curly braces should be removed" },
                  { id: "d", label: "路径该写成 ../dataSources/", labelEn: "The path should be ../dataSources/" },
                ],
                answer: "a",
              },
              fixed: real(
                "js",
                `import { resolvers } from './resolvers/orderResolvers.js';
import { OrderDataSource } from './dataSources/orderDataSource.js';`,
                {
                  filename: "改对之后",
                  filenameEn: "After the fix",
                  sourceFile:
                    "graphql-federation-practice/node-subgraph/src/index.js",
                  highlight: [2],
                },
              ),
              rootCause: (
                <>
                  <p>
                    <code>package.json</code> 里写了 <code>&quot;type&quot;: &quot;module&quot;</code>,
                    所以 Node 用原生 ESM 规则解析。原生 ESM
                    <strong>不做扩展名猜测</strong>，相对路径必须写完整。
                  </p>
                  <p>
                    第 1 行能跑是因为它写了 <code>.js</code>。这也是排查技巧：
                    <strong>同一个文件里，对比一下能跑的那些 import 和报错的这个，
                    差别往往一眼就看出来。</strong>
                  </p>
                </>
              ),
              rootCauseEn: (
                <>
                  <p>
                    <code>package.json</code> declares{" "}
                    <code>&quot;type&quot;: &quot;module&quot;</code>, so Node resolves
                    with native ESM rules. Native ESM{" "}
                    <strong>does not guess file endings</strong>, and a relative path has
                    to be written in full.
                  </p>
                  <p>
                    Line 1 works because it does write <code>.js</code>. That is also the
                    trick for finding this: <strong>compare the imports that work with
                    the one that fails inside the same file, and the difference is
                    usually obvious.</strong>
                  </p>
                </>
              ),
              verify: "npm start   # 应该打印 Subgraph ready at http://0.0.0.0:4000/",
              verifyEn: "npm start   # should print Subgraph ready at http://0.0.0.0:4000/",
            },
          ],
          transfer: [
            {
              signal: "ERR_MODULE_NOT_FOUND",
              signalEn: "ERR_MODULE_NOT_FOUND",
              reachFor: "相对路径漏了 .js 扩展名",
              reachForEn: "A relative path is missing the .js ending",
            },
            {
              signal: "Cannot use import statement outside a module",
              signalEn: "Cannot use import statement outside a module",
              reachFor: "缺 \"type\":\"module\" 或缺 --experimental-vm-modules",
              reachForEn: "Either \"type\":\"module\" is missing, or --experimental-vm-modules is",
            },
            {
              signal: "jest 说 No tests found",
              signalEn: "jest says No tests found",
              reachFor: "对照 testMatch，看文件位置和命名",
              reachForEn: "Compare with testMatch: check where the file sits and what it is called",
            },
            {
              signal: "只用到某个类型",
              signalEn: "You only use something as a type",
              reachFor: "写 import type，编译后整行消失",
              reachForEn: "Write import type. The whole line disappears after compiling",
            },
          ],
          recap: [
            "default 导出一个文件只能有一个，import 时名字随意、不加花括号。",
            "具名导出可以多个，import 时名字必须一致、要加花括号。",
            "原生 ESM 里相对路径必须带 .js；走 Vite 这类打包器时可以省。",
            "import type 只借类型，编译后整行消失。",
            "subgraph 那条长 test script 是为了让 jest 能跑 ESM，不需要改但要认得。",
          ],
          recapEn: [
            "A file can have only one default export. When you import it you may pick any name, and you use no curly braces.",
            "A file can have many named exports. When you import one, the name must match, and you use curly braces.",
            "In native ESM a relative path must end in .js. With a bundler such as Vite you may leave it out.",
            "import type borrows the type only. The whole line disappears after compiling.",
            "That long test script in the subgraph is there so jest can run ESM. You do not need to change it, but you should recognise it.",
          ],
        },
      ],
    },

    /* ================================================================
       Stage 1 · TypeScript
       ================================================================ */
    {
      id: "ts-essentials",
      stage: "地基 · 第 3 部分",
      title: "TypeScript：够用就好",
      titleEn: "TypeScript: just enough",
      summary:
        "只讲两个考试里真实出现的：基本类型、type 与 interface、组件 props 类型、泛型参数，以及怎么读 tsc 的报错。",
      summaryEn:
        "Only what actually appears in the two exams: basic types, type versus interface, typing component props, generic parameters, and how to read a tsc error.",
      lessons: [
        /* ---------- 1.4 ---------- */
        {
          id: "ts-types",
          title: "类型、type 与 interface",
          titleEn: "Types, type and interface",
          blurb: "Note 和 NoteFormProps 这两个真实类型，把该讲的都讲全了。",
          blurbEn:
            "Two real types from the project, Note and NoteFormProps, cover everything you need here.",
          minutes: 12,
          objectives: [
            "会给变量、函数参数、返回值标类型",
            "分清 type 和 interface 各自的场合（以及为什么这题里两个都用了）",
            "会写可选字段、联合类型、函数类型",
            "知道 strict: true 意味着什么",
          ],
          objectivesEn: [
            "Give a type to a variable, to a function parameter and to a return value",
            "Know when type fits and when interface fits, and why this project uses both",
            "Write an optional field, a union type and a function type",
            "Know what strict: true means",
          ],
          whyForAssessment:
            "react-notes-app 是 strict 模式的 TypeScript 项目。props 类型写错、少写一个字段，构建就过不去。而两个考试的核心数据结构（Note、Order）都是从类型定义读起的。",
          whyForAssessmentEn:
            "react-notes-app is a TypeScript project in strict mode. Get a props type wrong, or leave out one field, and the build fails. And in both exams the main data shapes, Note and Order, are read from their type definitions first.",
          sourceFiles: [
            {
              path: "react-notes-app/src/types/Note.ts",
              role: "整个 Q1 的数据形状",
              roleEn: "The shape of all the Q1 data",
            },
            {
              path: "react-notes-app/src/components/NoteForm/index.tsx",
              role: "props 类型的真实写法",
              roleEn: "How the prop types are actually written",
            },
            { path: "react-notes-app/tsconfig.json", role: "strict: true" },
          ],
          concepts: [
            {
              id: "the-note-type",
              heading: "从这个项目最重要的 3 行代码开始",
              headingEn: "Start with the 3 most important lines in this project",
              lede: "整个 Q1 的数据结构就这么多。",
              ledeEn: "That is the whole data shape of Q1.",
              body: (
                <>
                  <p>
                    读一个陌生项目，<strong>先找类型定义</strong>。
                    它比任何 README 都准确 —— README 会过时，类型不会
                    （改了类型不匹配的代码，编译器立刻报错）。
                  </p>
                  <p>
                    这 3 行告诉了你几件关键的事：
                  </p>
                  <ul>
                    <li>
                      <code>id</code> 是 <strong><code>number</code></strong>，不是 string。
                      所以后面比较要写 <code>note.id !== id</code>,
                      而项目里生成 id 用的是 <code>Date.now()</code>（返回数字）。
                    </li>
                    <li>
                      三个字段<strong>都是必填</strong>（没有 <code>?</code>）。
                      所以你构造一个新 Note 时，三个都得给，少一个编译不过。
                    </li>
                    <li>没有 <code>createdAt</code>、没有 <code>done</code> —— 别自己加字段。</li>
                  </ul>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    Reading an unfamiliar project, <strong>find the type definitions
                    first</strong>. They beat any README for accuracy — a README goes stale,
                    types do not (change code so it no longer matches a type and the compiler
                    complains on the spot).
                  </p>
                  <p>
                    These 3 lines tell you several important things:
                  </p>
                  <ul>
                    <li>
                      <code>id</code> is a <strong><code>number</code></strong>, not a string.
                      So comparisons later on read <code>note.id !== id</code>, and the project
                      generates ids with <code>Date.now()</code> (which returns a number).
                    </li>
                    <li>
                      All three fields are <strong>required</strong> (no <code>?</code>). So
                      when you build a new Note you have to supply all three; miss one and it
                      will not compile.
                    </li>
                    <li>No <code>createdAt</code>, no <code>done</code> — do not invent fields.</li>
                  </ul>
                </>
              ),
              code: [
                real(
                  "ts",
                  `export type Note = {
  id: number;
  title: string;
  content: string;
};`,
                  { filename: "src/types/Note.ts", sourceFile: "react-notes-app/src/types/Note.ts" },
                ),
              ],
            },
            {
              id: "type-vs-interface",
              heading: "type 和 interface：这个项目里两个都用了",
              headingEn: "type and interface: this project uses both",
              body: (
                <>
                  <p>
                    <code>Note</code> 用的是 <code>type</code>,
                    而 <code>NoteFormProps</code> 用的是 <code>interface</code>。
                    这不是随便选的，但也不是必须这么选 —— 大多数情况下两者可以互换。
                  </p>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th></th>
                          <th><code>type</code></th>
                          <th><code>interface</code></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>描述对象形状</td>
                          <td>✓</td>
                          <td>✓</td>
                        </tr>
                        <tr>
                          <td>联合类型 <code>A | B</code></td>
                          <td>✓ 只能用它</td>
                          <td>✗</td>
                        </tr>
                        <tr>
                          <td>同名重复声明会自动合并</td>
                          <td>✗ 报错</td>
                          <td>✓ 会合并</td>
                        </tr>
                        <tr>
                          <td>习惯用法</td>
                          <td>数据形状、联合、别名</td>
                          <td>props、可能被扩展的公开契约</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    实用建议：<strong>照项目里已有的风格写。</strong>
                    考试不会因为你用 type 还是 interface 扣分，但风格不一致会让人皱眉。
                    Q2 那边就必须用 <code>type</code> —— 因为
                    <code>SettledResult</code> 是个联合类型，interface 做不到。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    <code>Note</code> uses <code>type</code>, while <code>NoteFormProps</code>{" "}
                    uses <code>interface</code>. That was not random, but it was not required
                    either — most of the time the two are interchangeable.
                  </p>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th></th>
                          <th><code>type</code></th>
                          <th><code>interface</code></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Describe an object shape</td>
                          <td>✓</td>
                          <td>✓</td>
                        </tr>
                        <tr>
                          <td>Union type <code>A | B</code></td>
                          <td>✓ the only option</td>
                          <td>✗</td>
                        </tr>
                        <tr>
                          <td>Two declarations of one name merge automatically</td>
                          <td>✗ error</td>
                          <td>✓ they merge</td>
                        </tr>
                        <tr>
                          <td>Conventional use</td>
                          <td>Data shapes, unions, aliases</td>
                          <td>Props, public contracts that may get extended</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    Practical advice: <strong>write whatever style the project already
                    uses.</strong> No exam docks points for type versus interface, but
                    inconsistency makes people wince. Q2 has no choice but <code>type</code> —
                    because <code>SettledResult</code> is a union, and interface cannot do
                    that.
                  </p>
                </>
              ),
              code: [
                real(
                  "tsx",
                  `interface NoteFormProps {
  onSubmit: (note: Note) => void;    // 函数类型：收一个 Note，不返回东西
  noteToEdit: Note | null;           // 联合类型：要么是 Note，要么是 null
}`,
                  {
                    filename: "src/components/NoteForm/index.tsx",
                    sourceFile: "react-notes-app/src/components/NoteForm/index.tsx",
                    codeEn: `interface NoteFormProps {
  onSubmit: (note: Note) => void;    // function type: takes one Note, returns nothing
  noteToEdit: Note | null;           // union type: either a Note or null
}`,
                    explanation:
                      "两个字段各演示了一种写法。onSubmit 的 (note: Note) => void 是「函数类型」；noteToEdit 的 Note | null 是「联合类型」—— 用 null 表示「现在不在编辑任何东西」。",
                    explanationEn:
                      "Each field shows one form. The (note: Note) => void on onSubmit is a function type; the Note | null on noteToEdit is a union type, where null means nothing is being edited right now.",
                  },
                ),
                real(
                  "ts",
                  `export type SettledResult<T> =
  | { status: "fulfilled"; value: T }
  | { status: "rejected";  reason: unknown };`,
                  {
                    filename: "q2/taskRunner.ts",
                    sourceFile: "react-notes-app/q2/taskRunner.ts",
                    explanation:
                      "这叫「可辨识联合」：两个分支都有 status 字段，而且值是不同的字面量。于是你写 if (r.status === \"fulfilled\") 之后，TypeScript 就知道这个分支里一定有 value 而没有 reason。",
                    explanationEn:
                      "This is a discriminated union: both branches carry a status field, and each one holds a different literal value. So once you write if (r.status === \"fulfilled\"), TypeScript knows that inside that branch there is a value and no reason.",
                  },
                ),
              ],
            },
            {
              id: "strict",
              heading: "strict: true 意味着什么",
              headingEn: "What strict: true means",
              body: (
                <>
                  <p>
                    <code>react-notes-app/tsconfig.json</code> 里写了
                    <code>&quot;strict&quot;: true</code>。它是一个开关包，一次打开好几项检查。
                    对你影响最大的两项：
                  </p>
                  <ul>
                    <li>
                      <strong><code>strictNullChecks</code></strong> ——
                      <code>null</code> 和 <code>undefined</code> 不再能随便赋给别的类型。
                      所以 <code>noteToEdit</code> 必须明确写成 <code>Note | null</code>,
                      而且用它之前必须先判断。这就是为什么真实代码里到处是
                      <code>if (noteToEdit)</code>。
                    </li>
                    <li>
                      <strong><code>noImplicitAny</code></strong> ——
                      推断不出类型的参数不许留空。所以事件处理器要写
                      <code>(e: React.FormEvent&lt;HTMLFormElement&gt;)</code>,
                      不能光写 <code>(e)</code>。
                    </li>
                  </ul>
                  <p>
                    <code>main.tsx</code> 里那个 <code>!</code> 就是 strictNullChecks 的产物：
                    <code>document.getElementById(&quot;root&quot;)</code> 的类型是
                    <code>HTMLElement | null</code>，而 <code>createRoot</code>
                    不接受 null。<code>!</code> 是在说「我保证它不是 null」。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    <code>react-notes-app/tsconfig.json</code> sets{" "}
                    <code>&quot;strict&quot;: true</code>. It is a bundle of switches that
                    turns on several checks at once. The two that hit you hardest:
                  </p>
                  <ul>
                    <li>
                      <strong><code>strictNullChecks</code></strong> —{" "}
                      <code>null</code> and <code>undefined</code> can no longer be handed to
                      other types freely. So <code>noteToEdit</code> has to be spelled out as{" "}
                      <code>Note | null</code>, and you have to check it before using it. That
                      is why the real code is full of <code>if (noteToEdit)</code>.
                    </li>
                    <li>
                      <strong><code>noImplicitAny</code></strong> —
                      a parameter whose type cannot be inferred may not be left bare. So the
                      event handler is written{" "}
                      <code>(e: React.FormEvent&lt;HTMLFormElement&gt;)</code>, not just{" "}
                      <code>(e)</code>.
                    </li>
                  </ul>
                  <p>
                    That <code>!</code> in <code>main.tsx</code> is a product of
                    strictNullChecks:{" "}
                    <code>document.getElementById(&quot;root&quot;)</code> has type{" "}
                    <code>HTMLElement | null</code>, and <code>createRoot</code> does not
                    accept null. The <code>!</code> is you saying &ldquo;I guarantee this is
                    not null&rdquo;.
                  </p>
                </>
              ),
              code: [
                real(
                  "tsx",
                  `ReactDOM.createRoot(document.getElementById("root")!).render(...)
//                                                            ↑
//                            非空断言：告诉编译器「相信我，这里不会是 null」`,
                  {
                    sourceFile: "react-notes-app/src/main.tsx",
                    codeEn: `ReactDOM.createRoot(document.getElementById("root")!).render(...)
//                                                            ↑
//                    non-null assertion: tells the compiler this will not be null`,
                  },
                ),
              ],
            },
          ],
          exercises: [
            {
              kind: "fill-blank",
              id: "f-ts-props",
              title: "补全 NoteTable 的 props 类型",
              titleEn: "Fill in the props type of NoteTable",
              level: 2,
              prompt: (
                <p>
                  这是 <code>NoteTable</code> 真实的 props 类型。
                  三个空：一个数组类型、一个函数类型的参数、一个函数类型的返回值。
                </p>
              ),
              promptEn: (
                <p>
                  This is the real props type of <code>NoteTable</code>. Three blanks:
                  an array type, a parameter of a function type, and the return value of
                  a function type.
                </p>
              ),
              language: "tsx",
              filename: "src/components/NoteTable/index.tsx",
              sourceFile: "react-notes-app/src/components/NoteTable/index.tsx",
              template: `export interface NoteTableProps {
  notes: ___1___;
  onDelete: (id: ___2___) => void;
  onEdit: (note: Note) => ___3___;
}`,
              blanks: [
                {
                  n: 1,
                  accept: ["Note[]", "Array<Note>"],
                  hint: "一整个笔记列表。",
                  hintEn: "A whole list of notes.",
                  why: (
                    <>
                      <code>Note[]</code> 就是「Note 组成的数组」。
                      也可以写 <code>Array&lt;Note&gt;</code>，含义完全一样，
                      但这个项目里统一用 <code>Note[]</code> 这种写法。
                    </>
                  ),
                  whyEn: (
                    <>
                      <code>Note[]</code> means &ldquo;an array made of Note&rdquo;. You
                      can also write <code>Array&lt;Note&gt;</code>, which means exactly
                      the same, but this project writes <code>Note[]</code> everywhere.
                    </>
                  ),
                  width: 9,
                },
                {
                  n: 2,
                  accept: ["number"],
                  hint: "回头看 type Note 里 id 是什么类型。",
                  hintEn: "Look back at type Note and check what type id has.",
                  why: (
                    <>
                      <code>number</code>。因为 <code>Note.id</code> 是
                      <code>number</code>（项目里用 <code>Date.now()</code> 生成）。
                      写成 <code>string</code> 的话，<code>NoteItem</code> 里
                      <code>onDelete(note.id)</code> 就会报类型不匹配。
                      <strong>这也说明为什么要先读类型定义</strong> ——
                      它把整条链上的类型都决定了。
                    </>
                  ),
                  whyEn: (
                    <>
                      <code>number</code>, because <code>Note.id</code> is a{" "}
                      <code>number</code> (the project generates it with{" "}
                      <code>Date.now()</code>). Write <code>string</code> and{" "}
                      <code>onDelete(note.id)</code> inside <code>NoteItem</code>{" "}
                      reports a type mismatch. <strong>This is also why you read the type
                      definitions first</strong> — they decide the types along the whole
                      chain.
                    </>
                  ),
                  width: 8,
                },
                {
                  n: 3,
                  accept: ["void"],
                  hint: "这个回调不需要返回任何东西。",
                  hintEn: "This callback does not have to return anything.",
                  why: (
                    <>
                      <code>void</code> 表示「没有返回值」。
                      事件回调几乎都是 <code>void</code> —— 调用它是为了产生副作用
                      （改 state），不是为了拿返回值。
                    </>
                  ),
                  whyEn: (
                    <>
                      <code>void</code> means there is no return value. Event callbacks
                      are nearly always <code>void</code> — you call them for their
                      effect (changing state), not for what they hand back.
                    </>
                  ),
                  width: 6,
                },
              ],
            },
          ],
          transfer: [
            {
              signal: "读一个陌生项目",
              signalEn: "Reading a project you have never seen",
              reachFor: "先找 types/ 或 *.d.ts，类型比 README 准",
              reachForEn: "Look for types/ or *.d.ts first. The types are more accurate than the README",
            },
            {
              signal: "「要么是 X 要么没有」",
              signalEn: "Either an X, or nothing",
              reachFor: "X | null，用之前先 if 判断",
              reachForEn: "X | null, with an if check before you use it",
            },
            {
              signal: "需要联合类型",
              signalEn: "You need a union type",
              reachFor: "只能用 type,interface 做不到",
              reachForEn: "Only type can do this. interface cannot",
            },
            {
              signal: "Object is possibly 'null'",
              signalEn: "Object is possibly 'null'",
              reachFor: "先判断，或者确实安全时用 !",
              reachForEn: "Check it first, or use ! when you are sure it is safe",
            },
          ],
          recap: [
            "读项目先读类型定义：Note 的 3 行决定了 Q1 全部的数据操作。",
            "type 和 interface 大多可互换；联合类型只能用 type。",
            "(note: Note) => void 是函数类型；Note | null 是联合类型。",
            "strict: true 打开后，null 必须显式处理、参数必须有类型。",
            "! 是非空断言，是你在替编译器担保，用错了运行时才炸。",
          ],
          recapEn: [
            "Read the type definitions first. The 3 lines of Note decide every data operation in Q1.",
            "type and interface are interchangeable most of the time. Only type can express a union.",
            "(note: Note) => void is a function type. Note | null is a union type.",
            "With strict: true, null has to be handled explicitly and every parameter needs a type.",
            "! is a non-null assertion. With it you tell the compiler that the value is not null, so it stops checking. If you are wrong, the failure appears only when the code runs.",
          ],
        },

        /* ---------- 1.5 ---------- */
        {
          id: "ts-generics-and-errors",
          title: "泛型参数，以及怎么读 tsc 的报错",
          titleEn: "Generic parameters, and how to read a tsc error",
          blurb:
            "useState<Note[]> 那对尖括号在说什么，和 react-notes-app 那 10 个构建错误的真相。",
          blurbEn:
            "What the angle brackets in useState<Note[]> say, and the real cause of the 10 build errors in react-notes-app.",
          minutes: 12,
          objectives: [
            "看懂 useState<Note[]>([]) 和 Task<T> 里的尖括号",
            "会读 tsc 报错的四个部分：文件、位置、错误码、说明",
            "能分辨「我的代码错了」和「项目配置本身有问题」",
            "知道常见错误码 TS2304 / TS2582 / TS2345 各是什么意思",
          ],
          objectivesEn: [
            "Read the angle brackets in useState<Note[]>([]) and in Task<T>",
            "Read the four parts of a tsc error: file, position, error code, explanation",
            "Tell the difference between a mistake in your code and a problem in the project setup",
            "Know what the common codes TS2304, TS2582 and TS2345 each mean",
          ],
          whyForAssessment:
            "react-notes-app 的 npm run build 在原始状态下就是失败的 —— 10 个 tsc 错误，全部来自测试文件的类型配置缺失。能不能认出「这不是我的问题」，直接决定你会不会浪费半小时。",
          whyForAssessmentEn:
            "In react-notes-app, npm run build fails as delivered. All 10 tsc errors come from missing type settings for the test files. Recognising that the fault is not yours is what decides whether you lose half an hour.",
          sourceFiles: [
            {
              path: "react-notes-app/tsconfig.json",
              role: "include 了 src，但没配 vitest 全局类型",
              roleEn: "It includes src but does not configure the vitest global types",
            },
            {
              path: "react-notes-app/src/NoteManager.test.tsx",
              role: "报错就出在这个文件",
              roleEn: "This is the file the error comes from",
            },
          ],
          concepts: [
            {
              id: "generics",
              heading: "尖括号：告诉泛型「这次装的是什么」",
              headingEn: "Angle brackets: telling a generic what it holds this time",
              lede: "泛型（generic）就是一个「留了洞的类型」，调用的人负责填。",
              ledeEn:
                "A generic is a type with a hole left in it. Whoever calls it fills the hole.",
              body: (
                <>
                  <p>
                    <code>useState</code> 是 React 提供的函数，它不可能知道你要存什么 ——
                    可能是数字、可能是字符串、可能是笔记数组。
                    所以它的类型定义留了一个洞，写成 <code>useState&lt;S&gt;</code>。
                    你调用时用尖括号把洞填上：
                  </p>
                  <p>
                    为什么第一个必须显式写 <code>&lt;Note[]&gt;</code>?
                    因为初始值是 <code>[]</code> —— 一个空数组，
                    TypeScript 从它身上只能推断出「某种数组」，不知道装什么。
                    不写的话后面 <code>setNotes([...prev, note])</code> 就会报类型错。
                  </p>
                  <p>
                    而第三个 <code>useState(&quot;&quot;)</code> 不用写，
                    因为初始值 <code>&quot;&quot;</code> 已经把类型说清楚了：<code>string</code>。
                    <strong>规则：推断得出来就别写，推断不出来才写。</strong>
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    <code>useState</code> is a function React hands you, and it has no way of
                    knowing what you plan to store — a number, a string, an array of notes. So
                    its type definition leaves a hole in it, written{" "}
                    <code>useState&lt;S&gt;</code>. You fill the hole with angle brackets when
                    you call it:
                  </p>
                  <p>
                    Why does the first one have to spell out <code>&lt;Note[]&gt;</code>?
                    Because the initial value is <code>[]</code> — an empty array, and all
                    TypeScript can infer from it is &ldquo;some kind of array&rdquo;, with no
                    idea what goes in. Leave it off and{" "}
                    <code>setNotes([...prev, note])</code> later throws a type error.
                  </p>
                  <p>
                    The third one, <code>useState(&quot;&quot;)</code>, needs nothing, because
                    the initial value <code>&quot;&quot;</code> has already settled the type:{" "}
                    <code>string</code>. <strong>The rule: if it can be inferred, do not write
                    it; write it only when it cannot.</strong>
                  </p>
                </>
              ),
              code: [
                real(
                  "tsx",
                  `const [notes, setNotes] = useState<Note[]>([]);              // 必须写：[] 看不出装什么
const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);  // 必须写：null 看不出
const [title, setTitle] = useState("");                       // 不用写："" 就是 string`,
                  {
                    filename: "三处真实的 useState",
                    filenameEn: "Three real uses of useState",
                    sourceFile:
                      "react-notes-app/src/components/NoteManager/index.tsx 与 NoteForm/index.tsx",
                    codeEn: `const [notes, setNotes] = useState<Note[]>([]);              // required: [] does not say what it holds
const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);  // required: null says nothing
const [title, setTitle] = useState("");                       // not needed: "" means string`,
                  },
                ),
                real(
                  "ts",
                  `export type Task<T> = () => Promise<T>;

export async function runTasks<T>(
  tasks: Task<T>[],
  limit: number,
): Promise<SettledResult<T>[]> { ... }`,
                  {
                    filename: "q2/taskRunner.ts：自己定义泛型",
                    filenameEn: "q2/taskRunner.ts: defining your own generic",
                    sourceFile: "react-notes-app/q2/taskRunner.ts",
                    explanation:
                      "这里的 T 是「任务成功时返回什么类型」。runTasks 自己不关心 T 到底是什么，它只负责保证：你给我 Task<string>[]，我还你 SettledResult<string>[]。这就是泛型的价值 —— 同一份实现服务所有类型。",
                    explanationEn:
                      "Here T is the type a task returns when it succeeds. runTasks does not care what T actually is. It only guarantees one thing: hand it Task<string>[] and it hands back SettledResult<string>[]. That is what a generic buys you — one implementation that serves every type.",
                  },
                ),
              ],
            },
            {
              id: "read-tsc-error",
              heading: "tsc 报错的四个部分",
              headingEn: "The four parts of a tsc error",
              body: (
                <>
                  <p>拿一条真实的报错拆开看：</p>
                  <ol>
                    <li><strong>文件</strong> <code>src/NoteManager.test.tsx</code> —— 哪个文件</li>
                    <li><strong>位置</strong> <code>(5,1)</code> —— 第 5 行第 1 列</li>
                    <li><strong>错误码</strong> <code>TS2582</code> —— 可以直接搜的编号</li>
                    <li><strong>说明</strong> —— 人话描述，而且这条还带了修复建议</li>
                  </ol>
                  <p>
                    <strong>永远从第一条错误看起。</strong>TypeScript 的报错常常会连锁：
                    一个类型错了，后面十处用到它的地方全跟着报。修掉第一条，
                    后面九条可能自己就没了。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>Take one real error apart:</p>
                  <ol>
                    <li><strong>File</strong> <code>src/NoteManager.test.tsx</code> — which file</li>
                    <li><strong>Position</strong> <code>(5,1)</code> — line 5, column 1</li>
                    <li><strong>Error code</strong> <code>TS2582</code> — a number you can search directly</li>
                    <li><strong>Message</strong> — a plain-language description, and this one even suggests a fix</li>
                  </ol>
                  <p>
                    <strong>Always start from the first error.</strong> TypeScript errors chain
                    constantly: one type goes wrong, and the ten places that use it all report
                    too. Fix the first one and the other nine may disappear by themselves.
                  </p>
                </>
              ),
              code: [
                real(
                  "bash",
                  `$ npx tsc --noEmit

src/NoteManager.test.tsx(5,1): error TS2582: Cannot find name 'test'. Do you need to
  install type definitions for a test runner? Try \`npm i --save-dev @types/jest\` or
  \`npm i --save-dev @types/mocha\`.
src/NoteManager.test.tsx(11,3): error TS2304: Cannot find name 'expect'.
src/NoteManager.test.tsx(14,1): error TS2582: Cannot find name 'test'.
...共 10 条，全部在这一个文件里`,
                  {
                    filename: "本机实测输出",
                    filenameEn: "Output measured on this machine",
                  },
                ),
              ],
            },
            {
              id: "not-your-fault",
              heading: "实测：这 10 个错误不是你写的代码的问题",
              headingEn: "Tried for real: these 10 errors are not caused by the code you wrote",
              lede: "这是 react-notes-app 自带的配置缺陷。认出它，别去改业务代码。",
              ledeEn:
                "It is a setup defect that ships with react-notes-app. Recognise it, and leave your own code alone.",
              body: (
                <>
                  <p>
                    看清三件事，就能确定「不是我的问题」：
                  </p>
                  <ol>
                    <li>
                      <strong>报错全在测试文件里</strong>，一条都不在
                      <code>src/components/</code> 下。
                    </li>
                    <li>
                      <strong>报的是 <code>test</code> 和 <code>expect</code> 找不到</strong> ——
                      这两个不是你写的，是测试框架注入的全局变量。
                    </li>
                    <li>
                      <strong><code>npx vitest run</code> 实测 4 个测试全过。</strong>
                      也就是说代码逻辑完全正确，只是 tsc 不认识这两个全局名字。
                    </li>
                  </ol>
                  <p>
                    根因：<code>tsconfig.json</code> 的
                    <code>include: [&quot;src&quot;, &quot;q2&quot;]</code>
                    把测试文件也纳入了类型检查，但没有任何地方告诉 tsc
                    「这些全局变量存在」。缺的是
                    <code>&quot;types&quot;: [&quot;vitest/globals&quot;]</code>
                    （或者在测试文件里显式 import）。
                  </p>
                  <p>
                    <strong>考场上该怎么办？</strong>
                    <code>npm run build</code> 失败但 <code>npx vitest run</code> 全过时，
                    先确认失败发生在 <code>tsc</code> 那一步、而且只涉及测试文件的全局名字。
                    确认之后：继续用 vitest 验证你的实现，并在提交说明里点出这个配置问题。
                    <strong>把它当成一个观察记下来，而不是当成一个要你修的任务</strong> ——
                    题目没有要求你改配置，而擅自改 tsconfig 有可能影响判卷。
                  </p>
                </>
              ),
              bodyEn: (
                <>
                  <p>
                    Three things, once you see them clearly, settle that this is not your
                    problem:
                  </p>
                  <ol>
                    <li>
                      <strong>Every error is in the test file</strong>, not one of them under{" "}
                      <code>src/components/</code>.
                    </li>
                    <li>
                      <strong>What it cannot find is <code>test</code> and{" "}
                      <code>expect</code></strong> — you did not write those two; the test
                      framework injects them as globals.
                    </li>
                    <li>
                      <strong><code>npx vitest run</code> passes all 4 tests, measured.</strong>{" "}
                      Which means the code logic is entirely correct and tsc simply does not
                      know those two global names.
                    </li>
                  </ol>
                  <p>
                    Root cause: the{" "}
                    <code>include: [&quot;src&quot;, &quot;q2&quot;]</code> in{" "}
                    <code>tsconfig.json</code> pulls the test file into type checking, but
                    nothing anywhere tells tsc that those globals exist. What is missing is{" "}
                    <code>&quot;types&quot;: [&quot;vitest/globals&quot;]</code> (or an
                    explicit import inside the test file).
                  </p>
                  <p>
                    <strong>What should you do in the exam?</strong> When{" "}
                    <code>npm run build</code> fails but <code>npx vitest run</code> passes,
                    first confirm the failure happens at the <code>tsc</code> step and only
                    involves global names from the test file. Once confirmed: keep using vitest
                    to verify your implementation, and point out the config problem in your
                    submission notes. <strong>Record it as an observation, not as a task you
                    were asked to fix</strong> — nothing in the question asks you to change
                    config, and editing tsconfig on your own initiative could affect grading.
                  </p>
                </>
              ),
              code: [
                real(
                  "json",
                  `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "esModuleInterop": true
  },
  "include": ["src", "q2"]
}`,
                  {
                    filename: "tsconfig.json（原样）",
                    filenameEn: "tsconfig.json (unchanged)",
                    sourceFile: "react-notes-app/tsconfig.json",
                    highlight: [12],
                    explanation:
                      "注意最后一行：include 里有 src，而测试文件就在 src 下。compilerOptions 里没有 types 字段，所以 vitest 的全局变量对 tsc 是不存在的。",
                    explanationEn:
                      "Look at the last line: include holds src, and the test file sits under src. compilerOptions has no types field, so as far as tsc is concerned the vitest globals do not exist.",
                  },
                ),
              ],
            },
            {
              id: "common-codes",
              heading: "几个会真的遇到的错误码",
              headingEn: "The error codes you will actually meet",
              body: (
                <>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>错误码</th>
                          <th>意思</th>
                          <th>通常的原因</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><code>TS2304</code></td>
                          <td>Cannot find name &apos;X&apos;</td>
                          <td>名字打错、没 import、或者缺全局类型声明</td>
                        </tr>
                        <tr>
                          <td><code>TS2582</code></td>
                          <td>Cannot find name &apos;test&apos;</td>
                          <td>2304 的特化版，专门提示你缺测试框架类型</td>
                        </tr>
                        <tr>
                          <td><code>TS2345</code></td>
                          <td>参数类型不匹配</td>
                          <td>传了 string 给要 number 的参数（比如 id 类型搞混）</td>
                        </tr>
                        <tr>
                          <td><code>TS2339</code></td>
                          <td>属性不存在</td>
                          <td>拼错字段名，或者对象类型不是你以为的那个</td>
                        </tr>
                        <tr>
                          <td><code>TS2531 / TS18047</code></td>
                          <td>可能是 null</td>
                          <td>strictNullChecks：用之前没判断</td>
                        </tr>
                        <tr>
                          <td><code>TS7006</code></td>
                          <td>参数隐式为 any</td>
                          <td>noImplicitAny：回调参数没写类型</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              ),
              bodyEn: (
                <>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Meaning</th>
                          <th>Usual cause</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><code>TS2304</code></td>
                          <td>Cannot find name &apos;X&apos;</td>
                          <td>Typo in the name, no import, or a missing global type declaration</td>
                        </tr>
                        <tr>
                          <td><code>TS2582</code></td>
                          <td>Cannot find name &apos;test&apos;</td>
                          <td>The specialised form of 2304, telling you the test framework types are missing</td>
                        </tr>
                        <tr>
                          <td><code>TS2345</code></td>
                          <td>Argument type mismatch</td>
                          <td>Passed a string where a number was wanted (mixing up an id type, say)</td>
                        </tr>
                        <tr>
                          <td><code>TS2339</code></td>
                          <td>Property does not exist</td>
                          <td>Misspelled field name, or the object is not the type you assumed</td>
                        </tr>
                        <tr>
                          <td><code>TS2531 / TS18047</code></td>
                          <td>Possibly null</td>
                          <td>strictNullChecks: you did not check before using it</td>
                        </tr>
                        <tr>
                          <td><code>TS7006</code></td>
                          <td>Parameter implicitly has an any type</td>
                          <td>noImplicitAny: the callback parameter has no type written</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              ),
            },
          ],
          exercises: [
            {
              kind: "recognition",
              id: "f-whose-fault",
              title: "这是谁的问题",
              titleEn: "Whose problem is this",
              level: 1,
              prompt: (
                <p>
                  你刚 clone 好 react-notes-app，一行代码都还没写，先跑了
                  <code>npm run build</code>，得到 10 个
                  <code>TS2582: Cannot find name &apos;test&apos;</code>。
                  同时 <code>npx vitest run</code> 显示 4 个测试全过。
                  最合理的判断是？
                </p>
              ),
              promptEn: (
                <p>
                  You have just cloned react-notes-app, written not one line of code,
                  and run <code>npm run build</code>. You get 10 of{" "}
                  <code>TS2582: Cannot find name &apos;test&apos;</code>. At the same
                  time <code>npx vitest run</code> shows all 4 tests passing. What is the
                  most sensible conclusion?
                </p>
              ),
              options: [
                { id: "a", label: "我的 React 代码写错了，要回去改组件", labelEn: "My React code is wrong and I should go back and edit the components" },
                { id: "b", label: "依赖装坏了，删 node_modules 重装", labelEn: "The install is broken; delete node_modules and install again" },
                { id: "c", label: "项目自带的 tsconfig 没配测试框架的全局类型，与我的实现无关", labelEn: "The tsconfig that ships with the project does not declare the test framework globals, which has nothing to do with my implementation" },
                { id: "d", label: "Node 版本不对，要换版本", labelEn: "The Node version is wrong and should be changed" },
              ],
              answer: ["c"],
              explain: (
                <>
                  三条证据指向同一个结论：报错全在测试文件、报的是测试框架注入的全局名字、
                  而测试本身跑得过。这说明<strong>逻辑没问题，是类型配置缺了一块</strong>。
                  继续用 <code>npx vitest run</code> 验证实现即可，
                  并把这个配置问题作为观察记下来 —— 别去改业务代码，也别贸然改 tsconfig。
                </>
              ),
              explainEn: (
                <>
                  Three pieces of evidence point the same way: every error is in the test
                  file, the names it cannot find are globals injected by the test
                  framework, and the tests themselves pass. So{" "}
                  <strong>the logic is fine and one piece of type configuration is
                  missing</strong>. Keep verifying your implementation with{" "}
                  <code>npx vitest run</code> and record the config problem as an
                  observation. Do not edit your own code, and do not change tsconfig
                  without being asked.
                </>
              ),
            },
            {
              kind: "fill-blank",
              id: "f-generic-blanks",
              title: "补全泛型参数",
              titleEn: "Fill in the generic parameters",
              level: 2,
              prompt: <p>两处真实的泛型用法。想清楚「TypeScript 能不能自己推断出来」。</p>,
              promptEn: (
                <p>
                  Two real uses of generics. For each one, work out whether TypeScript
                  can infer it on its own.
                </p>
              ),
              language: "tsx",
              filename: "两个真实片段",
              filenameEn: "Two real snippets",
              template: `// NoteManager：两个 state
const [notes, setNotes] = useState<___1___>([]);
const [noteToEdit, setNoteToEdit] = useState<Note | ___2___>(null);

// q2/taskRunner.ts：自定义泛型
export type Task<T> = () => ___3___<T>;`,
              blanks: [
                {
                  n: 1,
                  accept: ["Note[]", "Array<Note>"],
                  hint: "初始值是空数组，推断不出装什么，所以必须显式写。",
                  hintEn: "The initial value is an empty array, so nothing can be inferred and you must write it out.",
                  why: (
                    <>
                      <code>Note[]</code>。初始值 <code>[]</code> 让 TypeScript 只能推断出
                      <code>never[]</code>，后面往里塞 Note 就会报错。
                      <strong>空数组和 null 作初始值时，泛型参数必须显式写</strong>。
                    </>
                  ),
                  whyEn: (
                    <>
                      <code>Note[]</code>. With <code>[]</code> as the initial value, all
                      TypeScript can infer is <code>never[]</code>, and putting a Note in
                      later is an error. <strong>When the initial value is an empty array
                      or null, the generic parameter has to be written out.</strong>
                    </>
                  ),
                  width: 9,
                },
                {
                  n: 2,
                  accept: ["null"],
                  hint: "「现在没有在编辑任何笔记」用什么表示？",
                  hintEn: "How do you say \"no note is being edited right now\"?",
                  why: (
                    <>
                      <code>null</code>。<code>Note | null</code> 表达的是
                      「要么正在编辑某条笔记，要么什么都没在编辑」。
                      strict 模式下这个 <code>| null</code> 必须写出来，
                      而且用 <code>noteToEdit</code> 之前必须先判断 ——
                      真实代码里的 <code>if (noteToEdit)</code> 就是为此。
                    </>
                  ),
                  whyEn: (
                    <>
                      <code>null</code>. <code>Note | null</code> says &ldquo;either a
                      note is being edited, or nothing is&rdquo;. In strict mode this{" "}
                      <code>| null</code> has to be written out, and{" "}
                      <code>noteToEdit</code> has to be checked before it is used — the{" "}
                      <code>if (noteToEdit)</code> in the real code is there for that.
                    </>
                  ),
                  width: 6,
                },
                {
                  n: 3,
                  accept: ["Promise"],
                  hint: "一个 async 任务被调用后，返回的是什么？",
                  hintEn: "Once an async task is called, what does it hand back?",
                  why: (
                    <>
                      <code>Promise</code>。<code>Task&lt;T&gt; = () =&gt; Promise&lt;T&gt;</code>
                      的意思是：一个不接参数的函数，调用它会得到一个「以后会给你 T」的 Promise。
                      注意<strong>它本身不是 Promise</strong> ——
                      这个区分是 Q2 能实现并发控制的前提。
                    </>
                  ),
                  whyEn: (
                    <>
                      <code>Promise</code>.{" "}
                      <code>Task&lt;T&gt; = () =&gt; Promise&lt;T&gt;</code> means: a
                      function that takes no arguments, and calling it gives you a Promise
                      that will hand you a T later. Note that{" "}
                      <strong>the task itself is not a Promise</strong> — that distinction
                      is what makes concurrency control possible in Q2.
                    </>
                  ),
                  width: 9,
                },
              ],
            },
          ],
          transfer: [
            {
              signal: "useState 初始值是 [] 或 null",
              signalEn: "The starting value of useState is [] or null",
              reachFor: "显式写泛型参数",
              reachForEn: "Write the generic parameter yourself",
            },
            {
              signal: "一堆 tsc 报错",
              signalEn: "A long list of tsc errors",
              reachFor: "只看第一条，后面可能是连锁",
              reachForEn: "Read only the first one. The rest may follow from it",
            },
            {
              signal: "报错全在测试文件、说全局名字找不到",
              signalEn: "Every error is in a test file and says a global name cannot be found",
              reachFor: "缺测试框架类型，不是你的逻辑问题",
              reachForEn: "The types of the test framework are missing. Your logic is not the problem",
            },
            {
              signal: "TS2345 参数类型不匹配",
              signalEn: "TS2345, an argument type does not match",
              reachFor: "回去看类型定义，通常是 id 的 number/string 搞混",
              reachForEn: "Go back to the type definition. Usually an id is a number where a string was expected, or the other way round",
            },
          ],
          recap: [
            "泛型是「留洞的类型」，尖括号是你在填洞。",
            "初始值看不出类型（空数组、null）时必须显式写泛型参数。",
            "tsc 报错四件套：文件、行列、错误码、说明。永远先看第一条。",
            "react-notes-app 的 npm run build 原生失败，10 个错全在测试文件，与你的实现无关。",
            "分辨「我的错」和「项目的错」：看报错位置、报的是谁的名字、测试跑不跑得过。",
          ],
          recapEn: [
            "A generic is a type with a hole in it. The angle brackets are you filling the hole.",
            "When the starting value shows no type, as with an empty array or null, write the generic parameter yourself.",
            "A tsc error has four parts: file, line and column, error code, explanation. Always read the first error first.",
            "npm run build fails in react-notes-app as delivered. All 10 errors are in test files and have nothing to do with your work.",
            "To tell your own mistake from a project defect, look at where the error points, whose name it complains about, and whether the tests still pass.",
          ],
        },
      ],
    },
  ],
};

export default foundations;
