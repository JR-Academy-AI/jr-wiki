---
title: "CLAUDE.md 实战：用文件驱动 AI 编程行为"
wiki: "prompt-engineering"
order: 10
description: "CLAUDE.md 是 Claude Code 的项目级 Prompt 配置文件，相当于给 AI 编程助手写一份持久化的 System Prompt。本章讲如何写好 CLAUDE.md 来控制代码风格、架构决策和工作流"
---

![CLAUDE.md 配置实践](https://code.claude.com/images/og-image.png)

## CLAUDE.md = 项目级 System Prompt

Claude Code 在每次启动时自动读取项目根目录的 `CLAUDE.md` 文件，把它当作 System Prompt 的一部分。这意味着你可以用一个 Markdown 文件，持久化控制 AI 在这个项目里的行为。

和在聊天里反复说"请用 TypeScript""不要用 any""用 pnpm 不要用 npm"相比，写一次 CLAUDE.md 就永久生效。

```bash
# CLAUDE.md 的加载层级（优先级从高到低）
~/.claude/CLAUDE.md          # 全局：你的个人偏好
./CLAUDE.md                  # 项目根：团队共享规则
./src/CLAUDE.md              # 子目录：特定模块的规则
```

---

## 一个生产级 CLAUDE.md 示例

```markdown
# CLAUDE.md

## 项目概览
JR Academy 官网后端，Node.js 20 + NestJS 10 + PostgreSQL 16 + Prisma ORM。
Monorepo 用 pnpm workspace 管理，apps/api + apps/admin + packages/shared。

## 命令
- `pnpm dev` — 启动开发服务器
- `pnpm test` — 跑单元测试（vitest）
- `pnpm lint` — ESLint + Prettier 检查
- `pnpm db:migrate` — 跑数据库迁移

## 代码规范
- TypeScript strict mode，禁止 any
- 函数命名用 camelCase，文件名用 kebab-case
- API 返回值统一用 { data, error, message } 结构
- 错误处理用 NestJS ExceptionFilter，不要 try-catch 每个函数
- 数据库查询用 Prisma，不写原生 SQL

## 架构规则
- Controller 只做参数校验和路由，业务逻辑放 Service
- Service 之间不互相依赖，通过 EventEmitter 通信
- 新增 API 必须写 e2e 测试（tests/e2e/）
- 不要引入新的 npm 包，除非先讨论

## Git 规范
- commit message 格式：type(scope): description
- type: feat / fix / refactor / test / docs / chore
- 一个 commit 只做一件事
```

---

## 写 CLAUDE.md 的核心原则

### 原则 1：写约束，不写教程

```markdown
# ❌ 像教程一样写
NestJS 是一个渐进式 Node.js 框架，它使用 TypeScript 构建高效、
可扩展的服务端应用程序...

# ✅ 写 AI 需要遵守的规则
NestJS 10 项目。Controller 不放业务逻辑。Service 用构造函数注入。
新模块用 `nest g module` 生成。
```

AI 已经知道 NestJS 是什么。它不知道的是**你这个项目**用 NestJS 的具体方式。

### 原则 2：给命令，不给选择

```markdown
# ❌ 给 AI 选择空间
可以用 Jest 或 Vitest 来写测试，推荐 Vitest。

# ✅ 直接指定
测试用 Vitest。运行命令：pnpm test。
测试文件放在 __tests__/ 目录，命名：*.test.ts。
```

### 原则 3：用例子代替描述

```markdown
# ❌ 纯文字描述
API 错误返回要有错误码和消息。

# ✅ 给一个实际的例子
API 错误返回格式：
{
  "error": "COURSE_NOT_FOUND",
  "message": "Course with id 'abc' not found",
  "statusCode": 404
}
```

---

## 常见场景的 CLAUDE.md 片段

### 前端 React 项目

```markdown
## 技术栈
React 18 + TypeScript + Tailwind CSS + Zustand + React Query

## 组件规范
- 用函数组件 + hooks，不用 class component
- 组件文件用 PascalCase：UserProfile.tsx
- 每个组件一个文件，不要在一个文件里导出多个组件
- Props 用 interface 定义，不用 type（团队约定）
- 样式只用 Tailwind，不写 CSS 文件

## 状态管理
- 服务端状态用 React Query（useQuery / useMutation）
- 客户端状态用 Zustand（stores/ 目录）
- 不要用 useState 管理从 API 获取的数据
```

### Python 数据项目

```markdown
## 环境
Python 3.12 + uv 包管理。虚拟环境在 .venv/。

## 命令
- `uv run pytest` — 跑测试
- `uv run ruff check .` — lint 检查
- `uv run python -m mypy src/` — 类型检查

## 规范
- 类型标注：所有函数必须有参数和返回值类型标注
- 数据处理用 polars，不用 pandas
- 配置用 pydantic Settings，不用 dotenv
```

---

## CLAUDE.md 和 Prompt Engineering 的关系

CLAUDE.md 本质上就是 Prompt Engineering 的落地形式：

| Prompt 概念 | CLAUDE.md 对应 |
|-------------|----------------|
| System Prompt | 整个 CLAUDE.md 文件 |
| 角色设定 | "项目概览"部分 |
| 约束条件 | "代码规范""架构规则" |
| Few-shot 示例 | 代码格式和错误返回的例子 |
| 否定约束 | "不要用 any""不要引入新包" |

区别在于：聊天里的 Prompt 用完就丢，CLAUDE.md 是持久化的、团队共享的、版本控制的。

写好 CLAUDE.md 的人，本质上是在做 **项目级 Prompt Engineering** —— 用一个文件控制 AI 在整个项目里的行为模式。这比每次聊天都重复说一遍规则高效得多。
