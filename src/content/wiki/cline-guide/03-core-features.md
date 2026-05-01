---
title: "核心功能深度解析"
wiki: "cline-guide"
order: 3
description: "Plan/Act 双模式、MCP 工具市场、Browser 自动化、Context 上下文管理全面拆解"
---

## Plan 模式：先想清楚再动手

Plan 模式是 Cline 区别于大多数 AI 编程工具的设计。开启后 Cline 只做分析、不改代码——它会读文件、梳理依赖、列出修改方案，但一行代码也不碰。

适合这些场景：

- 接手陌生项目，先让 Cline 跑一遍了解结构
- 做复杂重构前，让它列出所有受影响的文件和修改顺序
- 评估某个需求的实现方案——给它需求描述，它会分析技术可行性

```
# Plan 模式 prompt 示例
我想给这个 Next.js 项目加 i18n 支持（中文和英文）。
请分析目前的项目结构，列出需要改哪些文件、用什么库、大概分几步实现。
先不要动代码。
```

Plan 模式输出会是一份结构化的执行计划——文件列表、修改顺序、潜在风险。你觉得计划合理了，再切到 Act 模式让它执行。

## Act 模式：自主执行任务

Act 模式下 Cline 会真正动手：创建文件、修改代码、跑终端命令、读报错、自动修复。它的 Agent 循环会持续运行，直到任务完成或遇到需要你决策的地方。

![Cline Act 模式执行任务流程](https://img.youtube.com/vi/cBh5KPblRKM/maxresdefault.jpg)

Act 模式能做的事：

| 能力 | 说明 |
|------|------|
| 创建/编辑文件 | 展示 diff 预览，你确认后才写入 |
| 运行终端命令 | `npm install`、`git commit`、`pytest` 等 |
| 读取命令输出 | 看 build 报错、test 结果、lint 警告 |
| 自我修复 | 发现报错自动分析原因、改代码、重试 |
| 搜索代码库 | 按语义找相关文件，不只是文本搜索 |

一个真实的工作流：

```
# 给你的 React 项目加暗黑模式
给这个 React 项目加 dark mode 支持：
1. 用 CSS 变量定义亮色/暗色主题
2. 加一个切换按钮在右上角
3. 用 localStorage 记住用户选择
4. 默认跟随系统设置
做完跑一下 dev server 看看效果
```

Cline 会分多轮执行：先创建 CSS 变量文件，再改布局组件加切换按钮，然后加 localStorage 逻辑，最后跑 `npm run dev` 并用内置浏览器截图验证效果。

## MCP 集成：给 Agent 装外挂

MCP（Model Context Protocol）是 Anthropic 推出的开放协议，让 AI Agent 能调用外部工具。Cline 内置了 MCP 市场，一键安装各种 server：

```
┌─ MCP 市场热门工具 ────────────────────────┐
│                                           │
│  🗄  Postgres / Supabase   → 查数据库     │
│  📋  Jira / Linear         → 管理任务     │
│  ☁️  AWS / Azure           → 操作云资源   │
│  🧪  Playwright            → 端到端测试   │
│  📊  GitHub                → 管理仓库     │
│  📝  Notion                → 读写文档     │
│  🔍  Brave Search          → 联网搜索     │
│                                           │
└───────────────────────────────────────────┘
```

安装方式：打开 Cline 侧边栏顶部的 MCP 图标，浏览市场，点 Install。或者直接在对话里说「帮我装一个 Postgres MCP server」，Cline 会自动配置。

更厉害的是，你可以让 Cline 自己创建 MCP server：

```
我需要一个 MCP 工具，能查询我们公司的 Confluence wiki。
用 Confluence REST API，支持按关键词搜索和获取页面内容。
帮我从头搭建这个 MCP server。
```

Cline 会生成脚手架代码、写工具定义、配置连接、安装到本地，全自动。

## Browser 自动化

Cline 内置浏览器控制能力，能在开发过程中直接验证 UI：

- **打开页面**：`localhost:3000` 或任意 URL
- **截图**：对当前页面截图分析
- **交互**：点击按钮、填写表单、滚动页面
- **读取控制台**：捕获 console.log 和报错信息

这意味着 Cline 做完前端改动后能自己开浏览器看效果，如果 UI 不对还能自动调整。不用你手动刷新页面截图发给 AI。

```
# 让 Cline 自己验证前端效果
加完 dark mode 后，帮我打开 http://localhost:3000，
截个图看看亮色和暗色模式的效果对不对。
如果有 UI 问题就直接修。
```

## Context 上下文管理

Cline 用 `@` 引用来精准控制上下文：

| 引用方式 | 作用 | 示例 |
|---------|------|------|
| `@file` | 把某个文件加入上下文 | `@src/utils/auth.ts 这个鉴权逻辑有 bug` |
| `@folder` | 把整个文件夹加入 | `@src/components/ 帮我重构这些组件` |
| `@url` | 爬取网页内容 | `@https://docs.stripe.com/api 参考这个文档接 Stripe` |
| `@problems` | VS Code 问题面板 | `@problems 帮我修这些 lint 错误` |

**最佳实践**：不要一次给太多上下文。精准 `@` 两三个关键文件，比让 Cline 自己搜索全项目更快更准。上下文越精准，生成的代码越靠谱，token 消耗也越少。
