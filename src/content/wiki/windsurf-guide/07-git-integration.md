---
title: "Git 集成与团队协作"
wiki: "windsurf-guide"
order: 7
description: "AI 生成 commit message、PR 描述、冲突解决，Windsurf 里的 Git 工作流"
---

Windsurf 在 VS Code 的 Git 基础上加了一层 AI 能力。commit message、PR 描述、merge conflict 都可以让 Cascade 代劳。

![Windsurf Git 集成与团队协作](https://img.youtube.com/vi/bVNNvWq6dKo/maxresdefault.jpg)

## AI 生成 Commit Message

在 Source Control 面板里暂存文件后，点输入框旁边的 ✨ 按钮（或按快捷键），Windsurf 会根据 diff 内容自动生成 commit message：

```bash
# Windsurf 会分析你的 staged changes，生成类似这样的 commit message：
# feat: add user authentication with JWT
#
# - Create auth middleware for route protection
# - Add login/register endpoints with bcrypt password hashing
# - Store JWT tokens in httpOnly cookies
```

生成的 message 会遵循 Conventional Commits 格式。如果你的团队有其他约定，在 `.windsurfrules` 里写清楚：

```markdown
# .windsurfrules
## Git 规范
- commit message 用中文
- 格式：<type>(<scope>): <描述>
- type 可选：feat / fix / refactor / docs / test / chore
```

## 分支管理

创建新分支时 Cascade 会基于你当前的工作上下文建议分支名。你也可以直接告诉它：

```
帮我创建一个分支，实现用户头像上传功能
```

Cascade 会建议 `feature/user-avatar-upload` 这样的分支名，并自动执行 `git checkout -b`。

Wave 13 之后 Windsurf 支持 **Git Worktree**：在一个窗口里同时打开多个分支的工作目录，配合 Cascade 的并行 Agent，你可以一边在 `feature-a` 分支写新功能，一边让另一个 Cascade 在 `fix-b` 分支修 bug。

## Merge Conflict 解决

遇到合并冲突时，Cascade 能理解冲突双方的意图。直接说：

```
帮我解决当前的 merge conflict，保留两边的改动，合并逻辑
```

Cascade 不是简单地选"ours"或"theirs"——它会读懂两个分支分别改了什么，把两边的逻辑合到一起。比如一个分支加了字段验证，另一个分支改了错误提示文案，Cascade 会保留验证逻辑 + 新文案。

复杂冲突还是建议先用 Chat 模式分析，确认合并策略后再让 Code 模式执行。

## AI 生成 PR 描述

写 PR 时让 Cascade 帮你生成描述：

```
帮我写一个 PR 描述，总结这个分支上所有的改动。
包括：改了什么、为什么改、怎么测试
```

Cascade 会读取分支上的所有 commit，分析代码变更，生成结构化的 PR 描述：

```markdown
## What
- 新增用户头像上传功能，支持 JPG/PNG/WebP 格式
- 头像存储到 S3，URL 写入用户表

## Why
产品需求 #142：用户个人资料页需要展示头像

## How to test
1. 登录后进入 /profile 页面
2. 点击头像区域上传一张图片
3. 验证图片显示正确且刷新后持久化
```

## 团队协作配置

多人协作时，`.windsurfrules` 应该提交到仓库里，让团队成员共享 AI 编码规范：

```bash
# 把 rules 文件加入版本控制
git add .windsurfrules
git commit -m "chore: add windsurf rules for team coding standards"
```

建议团队统一的 rules 内容：

```markdown
# .windsurfrules (团队共享)
## 代码规范
- 变量命名用 camelCase，组件用 PascalCase
- API 路由文件放 src/routes/，中间件放 src/middleware/
- 测试文件和源文件同目录，命名 *.test.ts

## Review 准则
- 新增 API 端点必须加入参校验（Zod schema）
- 数据库操作必须在 try-catch 里
- 敏感操作需要日志记录
```

每个人还可以在 `~/.windsurf/global_rules.md` 里配自己的个人偏好（比如用 Vim 快捷键、偏好 pnpm），这些不会影响团队成员。
