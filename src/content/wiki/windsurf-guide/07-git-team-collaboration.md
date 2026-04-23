---
title: "Git 集成与团队协作"
wiki: "windsurf-guide"
order: 7
description: "Windsurf 的 Git 工作流、AI 生成 commit message、分支管理、团队规则共享"
---

## Windsurf 的 Git 集成

Windsurf 继承了 VS Code 的 Source Control 面板，staging、diff、commit、branch 操作都在侧栏里。但它加了一个杀手功能：**AI 生成 commit message**。

![Windsurf Git 集成与团队协作](https://img.youtube.com/vi/kRJ7Iq-qeq8/maxresdefault.jpg)

点 commit 输入框旁边的 ✨ 图标，Windsurf 会分析你的 staged changes，自动生成一条结构化的 commit message。

## AI Commit Message 实战

```bash
# 你改了 3 个文件：
# - src/api/users.ts （加了分页参数）
# - src/types/api.d.ts （加了 PaginationParams 类型）
# - src/pages/UserList.tsx （对接分页 API）

# Windsurf 自动生成的 commit message：
# feat: add pagination support for user list API
#
# - Add PaginationParams type with page and pageSize fields
# - Update getUserList to accept pagination parameters
# - Integrate paginated API in UserList page component
```

生成的 message 遵循 Conventional Commits 格式。如果你的团队有自定义的 commit 规范，写进 `.windsurfrules`：

```markdown
# .windsurfrules（追加 Git 相关规则）

## Git Commit 规范
- 格式：<type>(<scope>): <description>
- type 只用：feat / fix / refactor / docs / test / chore
- scope 用模块名：api / ui / auth / db
- description 用英文，不超过 50 字符
- body 用中文解释改动原因
```

## 用 Cascade 做分支操作

复杂的 Git 操作不用记命令，直接跟 Cascade 说：

```bash
# "从 main 拉一个新分支 feature/user-pagination，
#  把我刚才的改动都带过去"

# Cascade 执行：
git stash
git checkout main
git pull origin main
git checkout -b feature/user-pagination
git stash pop

# "把 feature/auth 分支 rebase 到最新的 main 上"

# Cascade 执行：
git checkout feature/auth
git fetch origin main
git rebase origin/main
# 如果有冲突，Cascade 会在编辑器里打开冲突文件，
# 并建议保留哪一方的代码
```

## Merge Conflict 处理

遇到合并冲突时，Windsurf 的 diff 编辑器和 VS Code 一样会标出 `<<<<<<<` 和 `>>>>>>>` 块。Cascade 能直接参与冲突解决：

```typescript
// 冲突文件 src/config/api.ts：
<<<<<<< HEAD
const API_BASE = '/api/v2'
=======
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1'
>>>>>>> feature/env-config
```

跟 Cascade 说"解决这个冲突，保留环境变量的写法但用 v2 路径"：

```typescript
// Cascade 合并后：
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v2'
```

## 团队协作：共享 .windsurfrules

`.windsurfrules` 应该提交到 Git 仓库，让团队所有人共享同一套 AI 规则。这样不管谁用 Cascade 生成代码，风格都一致：

```bash
# 项目根目录结构
├── .windsurfrules      # Cascade 代码生成规则（提交到 Git）
├── .windsurfignore     # 索引排除列表（提交到 Git）
├── .gitignore
├── src/
└── package.json
```

一些团队规则的最佳实践：

```markdown
# .windsurfrules 团队版

## 代码审查标准
- 所有新函数必须有单元测试
- API 路由必须有 input validation（用 Zod）
- 前端组件超过 200 行必须拆分
- 禁止 console.log 提交到 main 分支

## 项目约定
- 状态管理：Zustand
- HTTP 请求：axios + interceptor 统一处理错误
- 日期处理：dayjs，不用 moment
```

## Wave 13 新特性：Git Worktree 支持

2026 年初 Windsurf Wave 13 更新带来了 Git worktree 支持。你可以同时打开同一个仓库的多个分支，每个分支跑独立的 Cascade 会话：

```bash
# 创建 worktree
git worktree add ../my-project-hotfix hotfix/critical-bug

# 在 Windsurf 里 File > Open Folder 打开 worktree 目录
# 主窗口继续开发 feature，新窗口修 hotfix
# 两个 Cascade 会话互不干扰
```

这对"开发到一半要紧急修 bug"的场景特别有用——不用 stash、不用切分支，直接开新窗口处理。
