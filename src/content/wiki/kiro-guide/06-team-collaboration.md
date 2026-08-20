---
title: "团队协作实战：多人项目里的 Kiro 工作流"
wiki: "kiro-guide"
order: 6
description: "把 .kiro/ 目录纳入版本控制、AGENTS.md 按目录分域管理、Global Hooks 团队共享、Skills 模块化规范、并行 Spec 开发——5 人团队实测的协作方案"
---

## 为什么团队协作是 Kiro 的强项

单人用 Kiro 已经省力；团队用 Kiro 的核心价值在另一个地方：**让 AI 的上下文随代码一起流通**。

传统团队协作的知识传递链：
```
产品经理写 PRD → 开发自己理解 → 口耳相传技术决策 → 新人来了看不懂历史
```

用 Kiro 的团队协作链：
```
需求写进 spec → 设计决策存进 steering → 新人 git clone 就拿到完整 AI 上下文
```

`.kiro/` 目录天然就是版本控制友好的——把它提交进 git，团队每个人克隆仓库就等于拿到了：
- 所有功能的需求文档（`specs/`）
- 项目的技术规范和风格指南（`steering/`）
- 代码审查和自动化规则（`hooks/`）

## 把 `.kiro/` 目录纳入版本控制

第一步：确认团队的 `.gitignore` 不排除 `.kiro/`。

```bash
# 检查有没有误排除
grep -n "\.kiro" .gitignore

# 推荐的 .gitignore 配置——只排除个人状态文件
echo ".kiro/cache/" >> .gitignore
echo ".kiro/sessions/" >> .gitignore
# 不要排除 specs/ steering/ hooks/ agents/
```

提交目录结构参考：

```
.kiro/
├── specs/           # ✅ 提交——功能需求文档
│   ├── auth-spec/
│   ├── payment-spec/
│   └── dashboard-spec/
├── steering/        # ✅ 提交——项目规范
│   ├── tech-stack.md
│   ├── code-style.md
│   └── api-conventions.md
├── hooks/           # ✅ 提交——自动化规则
│   ├── test-sync.kiro.hook
│   └── changelog-update.kiro.hook
├── agents/          # ✅ 提交——自定义 Agent
│   └── code-reviewer.md
├── cache/           # ❌ 不提交——本地缓存
└── sessions/        # ❌ 不提交——会话历史
```

## AGENTS.md：按目录分域的上下文

2026 年更新的 AGENTS.md 是 Kiro 最适合团队的功能之一——你可以在仓库的**任意子目录**放 AGENTS.md，Kiro 会把它作为 steering 上下文加载，范围精确到这个目录树。

### 实际用法：Monorepo 分域管理

```
my-project/
├── AGENTS.md                  ← 全局规则（所有人遵守）
├── services/
│   ├── api/
│   │   └── AGENTS.md          ← API 服务专属规则
│   └── worker/
│       └── AGENTS.md          ← Worker 服务专属规则
└── packages/
    ├── ui/
    │   └── AGENTS.md          ← 前端组件规则
    └── shared/
        └── AGENTS.md          ← 共享库规则
```

各级 AGENTS.md 示例：

```markdown
<!-- 根目录 AGENTS.md（所有服务通用） -->
# Project Rules

- 所有公共 API 必须有 OpenAPI schema
- 错误码统一用 RFC 7807 Problem Details 格式
- 禁止使用 any 类型，必须显式标注
- 提交信息格式：feat|fix|refactor|docs: subject (refs #issue)
```

```markdown
<!-- services/api/AGENTS.md（API 服务专属） -->
# API Service Rules

- Framework: Fastify v5，不用 Express
- 路由层只做参数校验和调用 Service，业务逻辑在 Service 层
- 数据库查询必须用 Drizzle ORM，禁止裸 SQL
- 每个端点必须有对应的 integration test
```

```markdown
<!-- packages/ui/AGENTS.md（前端专属） -->
# UI Package Rules

- 组件库：shadcn/ui，不自己封装基础组件
- 状态管理：Zustand，禁止用 Redux
- 样式：Tailwind CSS v4，禁止写 CSS modules
- 所有组件必须有 Storybook story
```

当你在 `services/api/` 下问 Kiro 问题时，它会同时加载：根目录 AGENTS.md + `services/api/AGENTS.md`——精确匹配你当前的工作上下文。

## 前端组和后端组并行开发 Spec

多人团队的常见痛点：两个人同时在一个功能上开发，改来改去冲突。

Kiro 的 Spec 工作流天然适合并行——一个功能一个 spec 目录，不同模块的 spec 互不干扰：

```bash
# 前端同学负责 dashboard
git checkout -b feat/dashboard-spec
# 在 .kiro/specs/dashboard-spec/ 下工作

# 后端同学负责 API
git checkout -b feat/api-spec
# 在 .kiro/specs/api-spec/ 下工作
```

两个人的 spec 目录完全独立，合并时几乎不冲突。合并后 Kiro 能同时读到两个 spec，理解完整的功能边界。

### `design.md` 是团队接口契约

一个典型的前后端协作场景：

```markdown
<!-- .kiro/specs/user-profile-spec/design.md（后端定义，前端来读） -->
## API Contract

### GET /api/users/:id
Response:
{
  "id": "string",
  "name": "string", 
  "avatar": "string | null",
  "plan": "free" | "pro" | "enterprise",
  "createdAt": "ISO 8601"
}

### PATCH /api/users/:id
Body: Partial<Pick<User, "name" | "avatar">>
```

前端同学让 Kiro 读这个文件就能生成类型定义和 API client，不用等后端接口上线。

## Global Hooks：一次配置全队复用

CLI 3.0 的 Global Hooks 特性（early access）让你把 hook 放在 `~/.kiro/hooks/`，它会在**所有工作区**自动生效——不需要每个项目单独配置。

适合放进全局 hook 的场景：

```json
// ~/.kiro/hooks/security-check.kiro.hook
{
  "title": "敏感信息检查",
  "description": "保存代码前检查有没有硬编码的 API key / 密码",
  "when": {
    "type": "fileSaved",
    "patterns": ["**/*.ts", "**/*.js", "**/*.env*", "**/*.yaml"]
  },
  "instruction": "扫描保存的文件，检查有没有硬编码的 API key、密码、token、私钥。如果发现，立刻高亮提示，并建议替换为环境变量。不要自动修改，只提示。"
}
```

```json
// ~/.kiro/hooks/conventional-commit.kiro.hook
{
  "title": "Commit 信息规范提示",
  "description": "创建文件时提醒 Conventional Commits 格式",
  "when": {
    "type": "fileCreated",
    "patterns": [".git/COMMIT_EDITMSG"]
  },
  "instruction": "检查 commit 信息是否符合 Conventional Commits 格式（feat/fix/refactor/docs/chore: subject）。不符合就给出规范写法建议。"
}
```

项目级 hook（`.kiro/hooks/`）继续存放项目特有的自动化规则，两者叠加生效。

## Skills：把复杂工作流打包成一条命令

Kiro Skills（技能包）是 `.kiro/skills/` 目录下的 SKILL.md 文件——把多步操作打包成可在 Chat 里用 `@skill-name` 召唤的指令。

团队共享 skill 实例：

```markdown
<!-- .kiro/skills/pr-ready.md -->
# PR Ready Check

在团队内召唤方式：@pr-ready

检查当前代码是否可以提 PR：
1. 所有修改的函数有对应的单元测试
2. 没有遗留的 TODO / FIXME / console.log
3. API 变更已更新 design.md 的接口契约
4. Steering 规则没有明显违反
5. 生成 PR 描述草稿（变更内容 + 测试方案）
```

```markdown
<!-- .kiro/skills/new-endpoint.md -->
# New API Endpoint

召唤方式：@new-endpoint <method> <path>
示例：@new-endpoint POST /api/orders

按团队规范生成完整端点：
- Fastify route handler（参数校验 + Service 调用）
- Service 层方法
- Drizzle ORM query
- Integration test（happy path + error cases）
- OpenAPI schema 更新
```

把这些 skill 文件提交进 git，全队成员不需要记忆复杂提示词，直接 `@skill-name` 调用统一的工作流。

## 实战：5 人团队的 Kiro 协作规范

一个真实的团队配置参考（3 后端 + 1 前端 + 1 QA）：

```
team-project/
├── AGENTS.md                        # 全局：提交规范、错误处理、禁止 any
├── .kiro/
│   ├── steering/
│   │   ├── tech-stack.md           # 技术选型（inclusion: always）
│   │   ├── api-conventions.md      # API 规范（fileMatch: services/*）
│   │   └── testing-standards.md   # 测试标准（fileMatch: **/*.test.ts）
│   ├── hooks/
│   │   ├── test-sync.kiro.hook     # 保存源码 → 同步测试
│   │   └── openapi-update.kiro.hook # 改路由 → 更新 OpenAPI
│   ├── skills/
│   │   ├── new-endpoint.md         # @new-endpoint 快速建 API
│   │   ├── pr-ready.md             # @pr-ready PR 前检查
│   │   └── bug-spec.md             # @bug-spec 快速建 bugfix spec
│   └── specs/                      # 各功能 spec，按分支独立开发
├── services/
│   ├── api/
│   │   └── AGENTS.md               # API 服务专属规则
│   └── notification/
│       └── AGENTS.md               # 通知服务专属规则
└── packages/
    └── ui/
        └── AGENTS.md               # 前端规则
```

**新人入职流程**：

```bash
git clone <repo>
# 打开 Kiro IDE，自动读取 .kiro/ 和所有 AGENTS.md
# 第一条 Chat: "帮我了解这个项目的技术栈和代码规范"
# Kiro 读取所有 steering 文件，5 分钟给出完整项目上下文
```

**日常开发循环**：

```
领到需求 → /spec new 描述需求 → review requirements.md → 
Kiro 生成 design.md → 前后端在各自目录的 AGENTS.md 约束下实现 →
@pr-ready 检查 → 提 PR
```

Spec 文件就是活文档——需求评审、设计讨论、任务拆分全在一个地方，新人接手不用靠问人，直接读 `.kiro/specs/` 就明白每个功能的来龙去脉。
