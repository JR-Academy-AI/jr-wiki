---
title: "核心功能深度解析"
wiki: "kiro-guide"
order: 3
description: "Spec 工作流进阶、Agent Hooks 自动化、Steering 规则文件、Powers 能力包、MCP 集成"
---

## Spec 工作流进阶

Kiro 的 spec 不只有"需求 → 设计 → 任务"一种玩法。2026 年更新后支持多种工作流：

![Kiro Spec-Driven Development](https://img.youtube.com/vi/4qcWgPb-8Fk/maxresdefault.jpg)

### Requirements-First vs Design-First

```
# Requirements-First（默认）：从用户需求出发
"用户要能用 Google 登录" → requirements.md → design.md → tasks.md

# Design-First：从技术方案出发
"用 OAuth 2.0 + JWT 做认证" → design.md → requirements.md → tasks.md
```

- **Requirements-First** 适合产品功能开发——你知道用户要什么，让 AI 选技术方案
- **Design-First** 适合技术重构——你已经定了技术方案，让 AI 反推需求和任务

### Spec 最佳实践

每个 spec 控制在 5-8 条需求。太少没意义，太多 AI 容易失焦。大功能拆成多个 spec 文件：

```
.kiro/specs/
├── auth-spec/          # 认证模块
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── dashboard-spec/     # 仪表盘模块
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
```

还有一个 Bugfix Spec 类型——专门用来修 bug。给它报错信息和复现步骤，它会生成修复方案和回归测试任务。

## Agent Hooks：事件驱动的自动化

Agent Hooks 是 Kiro 最独特的功能——当特定事件发生时，自动触发 AI 操作。类似 Git hooks，但执行者是 AI Agent。

### 创建 Hook

点左侧 Activity Bar 的 Kiro 图标 → Agent Hooks → `+` 号，或者 Command Palette 搜 `Kiro: Open Kiro Hook UI`。

Hook 配置存在 `.kiro/hooks/` 目录：

```json
// .kiro/hooks/test-sync.kiro.hook
{
  "title": "同步单元测试",
  "description": "源码修改时自动更新对应的测试文件",
  "when": {
    "type": "fileSaved",
    "patterns": ["src/**/*.ts", "!src/**/*.test.ts"]
  },
  "instruction": "分析修改的源文件，更新对应的 .test.ts 文件，确保新增/修改的函数都有测试覆盖。"
}
```

### 常见 Hook 场景

| Hook | 触发事件 | 作用 |
|------|---------|------|
| 测试同步 | 保存 `.ts` 文件 | 自动更新对应测试 |
| README 更新 | 保存 `src/` 下文件 | 自动更新 README 功能列表 |
| 国际化 | 保存 `.json` 语言包 | 自动翻译到其他语言 |
| Changelog | 保存任意文件 | 从 git diff 生成变更日志 |
| 代码规范 | 保存代码文件 | 自动应用 linting 和格式化 |

三种触发事件：`fileSaved`（保存文件）、`fileCreated`（创建文件）、`fileDeleted`（删除文件）。两种执行方式：**Agent Prompt**（让 AI 理解上下文后智能操作）和 **Shell Command**（跑确定性命令如 `npm run lint`）。

当前限制：每次文件保存只能触发一个 Hook，暂不支持 Hook 编排。

## Steering 规则文件

Steering 就是 Kiro 版的 `.cursorrules`——告诉 AI 你的项目规范，让它生成的代码符合你的风格。

```
# 文件位置
.kiro/steering/        # 项目级（优先级高）
~/.kiro/steering/      # 全局级（所有项目共享）
```

每个 Steering 文件头部用 YAML 设置加载方式：

```markdown
---
inclusion: always        # 每次对话都加载
---
# Tech Stack

- Framework: Next.js 15 (App Router)
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS v4
- Database: PostgreSQL + Drizzle ORM
- 所有组件用 functional component + hooks
- API 用 server actions，不写 API routes
- 错误处理统一用 Result 模式，不用 try-catch
```

三种加载模式：
- `always`：核心规范，每次对话都带上（技术栈、代码风格、命名规范）
- `fileMatch: "src/**/*.tsx"`：只在编辑匹配文件时加载（React 组件规范只在写组件时生效）
- `manual`：手动用 `#steering-file-name` 引用（偶尔需要的特殊规范）

## Powers：可复用的能力包

Powers 是 Kiro 独创的概念——把 MCP Server + Steering 规则 + Agent Hooks 打包成一个可复用的"能力"。

举个例子：安装 Supabase Power 后，Kiro 自动获得：
- 连接 Supabase 数据库的 MCP 工具
- Supabase 最佳实践的 Steering 规则
- 数据库 schema 变更时自动跑迁移的 Hook

```bash
# 在 Chat 里安装 Power
@powers install supabase
```

官方 Launch Partners 包括：Datadog、Figma、Neon、Netlify、Postman、Stripe、Supabase 等。社区 Powers 在 `github.com/kirodotdev/powers` 持续更新。

Powers 有个巧妙设计——**动态加载**。不像其他 IDE 把所有 MCP 工具一次性塞进上下文，Kiro 根据你对话里提到的关键词按需激活 Power，省上下文窗口。
