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

## 调试实战技巧

**给 Cascade 看日志，而不是只描述现象**。"接口报错了"不如"POST /api/users 返回 500，日志里显示 `UNIQUE constraint failed: users.email`"——后者 Cascade 能直接定位到数据库 schema 和插入逻辑。

**用 Revert 大胆试**。Cascade 每次改代码都有 checkpoint，修错了一键回滚。所以不要犹豫"要不要让它试试"，试完不行就 Revert，比你自己手动 debug 快得多。

```typescript
// 一个常见的调试 prompt 模板：
// "这段代码的预期行为是 X，实际行为是 Y。
//  相关日志/报错是 Z。
//  请定位根因并修复。"
//
// 越具体，Cascade 越准。
```

**搭配 `console.log` 定位**。有时候 Cascade 的推理不够准确，你可以让它先加几个 `console.log` 跑一遍看输出，然后基于实际输出再修复——这比猜测更可靠。
