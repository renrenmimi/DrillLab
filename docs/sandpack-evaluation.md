# Sandpack 评估：能不能自托管 / 离线跑

这是 `CLAUDE.md` 那条「不要引入 UI 库」禁令的唯一破例，
所以先把「它到底依赖什么」查清楚，再决定接不接受。

**结论先说：可以自托管打包器，但做不到真正离线，所以本站接受远程依赖，
并在 UI 上明说「需要联网」。**

## 装的版本

```
@codesandbox/sandpack-react    2.20.0
@codesandbox/sandpack-client   2.19.8
```

## 它到底往外连什么

以下不是从文档抄的，是从 `node_modules` 里的产物直接查出来的。

**① 打包器（bundler）跑在一个远程 iframe 里。**
默认地址由 client 的版本号推出来 ——
`node_modules/@codesandbox/sandpack-client/dist/clients/runtime/index.mjs` 里：

```js
BUNDLER_URL = "https://".concat("2.19.8".replace(/\./g, "-"), "-sandpack.codesandbox.io")
```

也就是本站实际连的是 `https://2-19-8-sandpack.codesandbox.io`。
**版本号写死在地址里** —— 升级 sandpack 就会换一个域名，这一点值得记住：
如果哪天要加防火墙白名单，升级会把它打破。

**② 静态预览是另一个域名。**
`https://preview.sandpack-static-server.codesandbox.io`（`static` 模板用）。

**③ npm 依赖不是浏览器直接拉的。**
client 的产物里除了上面两个域名，只剩 `codesandbox.io` / `npmjs.com` / `github.com`
三个纯文档链接。也就是说 **依赖解析发生在远程打包器那一侧**，
本站的 JS 不知道包从哪来。这一点决定了下面「离线」那一节的结论。

## 自托管可行性

**打包器地址是可配置的。**
`node_modules/@codesandbox/sandpack-client/dist/types.d.ts`：

```ts
/**
 * Location of the bundler.
 */
bundlerURL?: string;
```

而 runtime client 里是 `this.options.bundlerURL || BUNDLER_URL` ——
给了就用给的。所以把 `codesandbox/sandpack-bundler` 自己部署一份（它是个静态产物），
再把 `bundlerURL` 指过去，就能不连 CodeSandbox 的服务。

**但这只解决了一半。** 自托管的打包器仍然要去某处取 npm 包 ——
要做到完全离线，还得再镜像一个包服务，并让自托管的打包器指向它。
那是两套额外的基础设施，而本站是个**本机跑的静态学习站**，
没有部署环境可以挂这些东西。

**另一个现实问题**：`sandpack-react` 的 `SandpackProvider` 的 options 类型里
**没有**导出 `bundlerURL`（我 grep 了 `dist/index.d.ts`，`bundlerURL` 只出现在
client 的类型里，react 包的 options 里没有）。要透传得绕一层，
或者直接用 `sandpack-client`。这会让「破例」从「引一个 UI 组件」
变成「自己维护一套集成」，成本和风险都变了。

## 决定

**接受远程依赖，不自托管。** 理由三条：

1. 本站的定位是本机跑的学习站，没有可以挂自托管服务的部署环境。
2. 完全离线需要同时镜像打包器和包服务，收益（能在飞机上刷题）
   远小于维护成本。
3. `bundlerURL` 在 react 包的 options 里没暴露，绕过去等于自己接一套 client，
   那已经超出「引一个组件」的破例范围了。

**代价必须写在界面上，不能藏。** 所以：

- `components/sandbox.tsx` 的沙箱门上有一段加粗的「**需要联网。**」，
  并说明打包器和 npm 依赖都在 CodeSandbox 的远程服务上。
- 断网时打不开，用户能直接看到下面「本机跑」那条路（每道题的 `commands` 都在）。

## 顺带记下来的两件事

**React 版本要钉死。** `react-ts` 模板自带的是范围号，会随 CDN 上的最新版飘。
`content/coding.ts` 里的 `SANDBOX_DEPS` 钉的是 `react: "19.0.0"` /
`react-dom: "19.0.0"`，和本站内容用的同一代。

**Sandpack v2 的展示类开关在编辑器组件上，不在 provider 的 options 里。**
`editorHeight` / `showLineNumbers` / `showInlineErrors` / `showTabs`
写进 `SandpackProvider options` 会报 `TS2353`（实测撞到过）。
它们是 `<SandpackCodeEditor>` 的 props，编辑器高度用 CSS 控制。
