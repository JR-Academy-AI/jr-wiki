---
title: "用 Cascade 调试和修复 Bug"
wiki: "windsurf-guide"
order: 6
description: "Cascade 自动读报错、定位问题根源、跨文件追踪 bug，实战调试工作流"
---

调试是 Cascade 最能体现 Agent 能力的场景。传统调试你得自己看报错 → 猜原因 → 找代码 → 试修复 → 再跑。Cascade 能一条龙把这个循环自动化。

![Windsurf Cascade 调试工作流](https://img.youtube.com/vi/RptkOLELyas/maxresdefault.jpg)

## 报错直接甩给 Cascade

终端里跑 `npm run dev` 爆红了，不用复制粘贴报错信息。Windsurf 的 Flow State 已经捕获了终端输出，直接在 Cascade 面板里说：

```
修一下刚才终端里的报错
```

Cascade 会自动读取报错内容，定位到出错的文件和行号，分析根因，然后给出修复。整个过程你不需要提供任何额外上下文。

如果你想更精确地定位问题：

```
终端里报了 TypeError: Cannot read properties of undefined (reading 'map')
看一下 src/components/UserList.tsx 里的数据流，找到 undefined 是哪来的
```

Cascade 会从组件出发，往上追溯 props 传递链、API 调用、状态管理，找到数据在哪一步变成了 `undefined`。

## 跨文件追踪 Bug

真实项目里的 bug 很少只涉及一个文件。比如"用户登录后跳转到空白页"，问题可能出在路由配置、Auth 状态管理、或者 API 返回的 token 格式。

给 Cascade 的 prompt 这么写：

```
用户登录成功后跳转到 /dashboard 显示空白页。
请检查以下链路：
1. 登录 API 的 response 格式
2. token 存储逻辑（localStorage 还是 cookie）
3. 路由守卫的鉴权判断
4. Dashboard 组件的数据加载
```

Cascade 会按链路逐个检查，跨 5-10 个文件追踪数据流向，最后定位到具体问题。

## 用 Chat 模式做诊断

不确定 bug 在哪时，先用 Chat 模式（不改文件）做诊断：

```
Chat 模式下的 prompt：
"这个项目的 API 请求为什么有时会返回 401？
帮我分析 src/lib/api.ts 里的 token 刷新逻辑有没有竞态条件"
```

Chat 模式只分析不动代码，适合先搞清楚问题再决定怎么改。确认诊断结果后切回 Code 模式让 Cascade 执行修复。

## TypeScript 类型错误批量修复

项目里一堆 TypeScript 类型错误是最适合 Cascade 的场景之一：

```bash
# 先让 TypeScript 编译器输出所有错误
npx tsc --noEmit 2>&1 | head -50
```

然后告诉 Cascade：

```
跑 tsc --noEmit 有 23 个类型错误，帮我逐个修复。
优先处理 src/types/ 目录下的类型定义问题，
然后再修使用侧的类型不匹配。
```

Cascade 会按依赖顺序修复：先修类型定义，再修使用端，避免改了 A 导致 B 报新错的连锁反应。

## 完整 Bug Fix 走查：真实 case

下面是一个真实场景的完整调试过程，展示 Cascade 是怎么一步步推进的。

**场景**：Next.js 项目，用户偶发性看到"购物车商品突然清空"。复现概率大约 20%，纯前端行为，后端日志干净。

**第一步：告诉 Cascade 现象和怀疑范围**

```
购物车偶发清空，概率约 20%，后端日志没有异常，怀疑是前端状态管理问题。
项目用 Zustand 管购物车状态，持久化到 localStorage。
请检查 src/store/cartStore.ts 和 src/hooks/useCart.ts，
看看有没有竞态或者 hydration 时机问题。
```

Cascade 读完两个文件后发现：`useCart` 在组件 mount 时调用了 `initCart()`，而 `initCart()` 会从 localStorage 读数据覆盖当前 state——如果用户在快速切换页面时，两个实例同时 mount 就会互相覆盖。

**第二步：让 Cascade 验证推断**

```
你的推断是 initCart 被并发调用，能帮我在 cartStore.ts 里
加一个 initialized 标志位，确认一下 initCart 有没有重入问题？
先加 console.log 跑一遍，别直接改逻辑。
```

Cascade 在 `initCart` 前后加了 `console.log('[cart] init start')` 和 `console.log('[cart] init end')`，然后指导你复现：快速点击导航 3 次，观察控制台。结果出现了 `init start → init start → init end → init end`，证实了重入。

**第三步：让 Cascade 修复**

```
确认是重入问题了，帮我修：
- 加 initialized 标志位，第二次调用直接 return
- 修复后跑一遍 tsc --noEmit 确认没有类型问题
```

```typescript
// cartStore.ts 修复后的关键片段
let initialized = false;

const initCart = () => {
  if (initialized) return;
  initialized = true;

  const stored = localStorage.getItem('cart');
  if (stored) {
    try {
      useCartStore.setState({ items: JSON.parse(stored) });
    } catch {
      localStorage.removeItem('cart');
    }
  }
};
```

**第四步：回归验证**

```
修完了，帮我写一个快速 smoke test：
模拟 initCart 被连续调用 3 次，验证 state 只被设置一次
```

Cascade 写出了对应的 Vitest 测试用例，跑通后整个 debug 流程结束。

从发现问题到修复 + 测试，全程大约 15 分钟，期间你主要在引导和验证，Cascade 在跨文件读代码和修改。

## 高效调试 Prompt 模板

下面 5 个模板可以直接复制使用，按场景套。

**模板 1：异步 / 竞态条件**

```
[现象] {描述偶发性 / 顺序相关的 bug}
[怀疑] 可能是 {Promise 竞态 / useEffect 依赖 / 事件监听未清理}
请检查 {文件路径} 里的异步逻辑，
重点看：1) Promise 是否有 race condition；2) 组件卸载时是否 cleanup；
3) 订阅是否幂等。
先 Chat 模式分析，确认后再改代码。
```

**模板 2：性能回归定位**

```
[现象] {页面/接口} 比上周慢了 {X} 倍，CI benchmark 报告附在下面。
[已知] 最近合并的 PR 是 {PR 列表}。
帮我分析 git diff {commit A}..{commit B} 里有没有明显的性能问题：
- N+1 查询
- 同步阻塞操作移到了热路径
- 缓存 key 变化导致命中率下降
输出可疑点，我逐个确认。
```

**模板 3：网络请求失败 / 4xx 5xx**

```
POST {路径} 返回 {状态码}，服务端日志如下：
---
{粘贴日志}
---
请检查 {客户端 fetch 文件} 和 {服务端 handler 文件}，
对比请求参数格式（Content-Type / body schema / auth header），
找出客户端发送的和服务端期望的有什么不一致。
```

**模板 4：React 渲染异常（闪烁 / 无限重渲染 / hydration mismatch）**

```
组件 {ComponentName} 出现 {闪烁/无限重渲染/hydration error}。
React DevTools 显示 {Profiler 截图描述 / 控制台报错}。
请检查：
1. useEffect 依赖数组是否完整
2. state 更新是否在渲染期间触发（setState in render）
3. SSR/CSR 的初始 state 是否一致
先给我分析，不要动代码。
```

**模板 5：数据库慢查询**

```
{接口路径} P99 延迟 {Xms}，EXPLAIN ANALYZE 输出如下：
---
{粘贴 EXPLAIN 结果}
---
ORM 代码在 {文件路径}。
帮我分析：
1. 缺少哪些索引
2. ORM 生成的 SQL 有没有 N+1
3. 能否加 select 字段裁剪 payload
给出具体的 SQL 和 ORM 改法。
```

## 调试实战技巧

**给 Cascade 看日志，而不是只描述现象**。"接口报错了"不如"POST /api/users 返回 500，日志里显示 `UNIQUE constraint failed: users.email`"——后者 Cascade 能直接定位到数据库 schema 和插入逻辑。

**用 Revert 大胆试**。Cascade 每次改代码都有 checkpoint，修错了一键回滚。所以不要犹豫"要不要让它试试"，试完不行就 Revert，比你自己手动 debug 快得多。

```typescript
// 一个通用的调试 prompt 结构：
// "这段代码的预期行为是 X，实际行为是 Y。
//  相关日志/报错是 Z。
//  请定位根因并修复。"
//
// 越具体，Cascade 越准。
```

**搭配 `console.log` 定位**。有时候 Cascade 的推理不够准确，你可以让它先加几个 `console.log` 跑一遍看输出，然后基于实际输出再修复——这比猜测更可靠。

**让 Cascade 写验证用例**。修完 bug 后，顺手让 Cascade 把刚才的 fix 逻辑写成单测或 E2E 测试步骤，防止回归。这一步很多人省掉，结果同样的 bug 两周后又出现。
