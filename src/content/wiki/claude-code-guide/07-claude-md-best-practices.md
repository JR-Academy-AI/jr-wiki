---
title: "CLAUDE.md：让 AI 理解你的项目规范"
wiki: "claude-code-guide"
order: 7
description: "写好 CLAUDE.md 让 Claude Code 每次启动都自动遵守团队规范"
---

## CLAUDE.md 是什么

`CLAUDE.md` 是放在项目根目录的 Markdown 文件，Claude Code 每次启动时自动读取。它就像给 AI 的 onboarding 文档——告诉它这个项目的技术栈、编码规范、常用命令、架构约束。

写了 `CLAUDE.md` 之后，你不用每次对话都重复"我们用 TypeScript"、"测试用 Vitest"、"错误处理用 toast"这些话。

![CLAUDE.md 配置层级](https://code.claude.com/images/og-image.png)

## 一个实际的 CLAUDE.md 例子

```markdown
# CLAUDE.md

## 项目概述
这是一个 Next.js 14 全栈应用，前端用 React + TypeScript，后端用 Route Handlers。

## 技术栈
- 框架: Next.js 14 (App Router)
- 语言: TypeScript (strict mode)
- 样式: Tailwind CSS
- 数据库: PostgreSQL + Prisma ORM
- 测试: Vitest + React Testing Library
- 包管理: pnpm

## 常用命令
- pnpm dev          # 启动开发服务器
- pnpm test         # 跑全部测试
- pnpm test:watch   # watch 模式
- pnpm lint         # ESLint 检查
- pnpm db:migrate   # 数据库迁移
- pnpm db:seed      # 填充测试数据

## 编码规范
- 组件文件用 PascalCase: UserProfile.tsx
- 工具函数用 camelCase: formatDate.ts
- API route 放 app/api/ 目录
- 共享类型定义放 types/ 目录
- 所有 API 调用必须有 try-catch + 用户友好的错误提示
- 不要用 any，必要时用 unknown 然后做类型守卫

## 架构约定
- 数据获取统一走 services/ 层，组件不直接调 fetch
- 全局状态用 Zustand，表单状态用 React Hook Form
- 环境变量统一在 env.ts 里用 zod 校验
```

## 配置层级

CLAUDE.md 支持三个层级，优先级从高到低：

| 层级 | 文件位置 | 适用场景 |
|------|---------|---------|
| 项目级 | 项目根目录 `CLAUDE.md` | 项目特有的规范，提交到 git |
| 用户级 | `~/.claude/CLAUDE.md` | 个人偏好（比如中文回复） |
| 子目录级 | `src/api/CLAUDE.md` | 特定模块的约束 |

当你用 `@src/api/route.ts` 引用文件时，Claude Code 会自动加载该文件所在目录及父目录的 `CLAUDE.md`。

## Auto Memory

Claude Code 有自动记忆功能——在工作中它会自己学习项目的构建命令、调试方法等知识，保存到 `~/.claude/memory.json`。

你也可以手动触发记忆：

```
> 记住：这个项目的 lint 命令是 pnpm lint --fix
> 记住：数据库连接字符串在 .env.local 里，不要用 .env
```

这些记忆在下次会话里自动生效，不需要重新写 CLAUDE.md。

## 实用模板片段

**前端项目必备：**

```markdown
## 测试规范
- 每个组件都要有对应的 .test.tsx
- Mock 外部依赖，不 mock 内部模块
- 用 screen.getByRole 而不是 getByTestId
```

**后端项目必备：**

```markdown
## API 规范  
- RESTful 路由命名: GET /api/users, POST /api/users
- 返回格式: { data: T, error?: string }
- 认证用 JWT，中间件在 middleware.ts
- 所有数据库操作包 transaction
```

**Monorepo 项目：**

```markdown
## Monorepo 结构
- packages/ui: 共享 UI 组件库
- packages/api: API client SDK
- apps/web: 前端应用
- apps/server: 后端服务
- 改了 packages/ 下的代码需要跑 pnpm build --filter=@scope/package
```

## 避免写什么

CLAUDE.md 不是文档站，写多了反而干扰 AI 判断。避免：

- 冗长的项目历史介绍
- 大段的 API 文档（这些应该放代码注释里）
- 频繁变化的内容（用 auto memory 代替）
- 显而易见的规则（比如"不要删除 node_modules"）

保持简洁。200-500 行以内最合适。
