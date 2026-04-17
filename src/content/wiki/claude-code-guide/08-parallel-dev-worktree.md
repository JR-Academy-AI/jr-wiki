---
title: "并行开发：Worktree 让多个 Claude 同时干活"
wiki: "claude-code-guide"
order: 8
description: "用 Git Worktree 同时跑多个 Claude Code session，一个修 bug 一个写功能，互不干扰"
---

## 为什么需要并行开发

一个 Claude Code session 在改文件时会占用当前工作目录。如果你想同时修一个 bug 和做一个新功能，两个 session 操作同一份代码会冲突。

Git Worktree 解决这个问题：给每个 session 一份独立的代码副本，共享同一个 git 仓库历史。

![并行开发架构](https://code.claude.com/images/og-image.png)

## 快速上手

```bash
# 创建一个叫 feature-auth 的 worktree 并启动 Claude Code
claude --worktree feature-auth

# 同时开另一个终端，创建 bugfix worktree
claude --worktree bugfix-login

# 不想起名？自动生成一个随机名
claude --worktree
```

`--worktree` (简写 `-w`) 做了三件事：
1. 在 `.claude/worktrees/feature-auth/` 创建一份代码副本
2. 自动创建并切换到 `worktree-feature-auth` 分支
3. 在这个隔离环境里启动 Claude Code

两个 session 各自改代码、跑测试，互不影响。

## 实战：同时修 Bug + 做功能

终端 1：

```bash
claude --worktree bugfix-user-api
> /api/users 接口在用户没有 avatar 时返回 null 导致前端崩溃
> 修复这个 bug 然后创建 PR
```

终端 2：

```bash
claude --worktree feature-dark-mode
> 给应用加一个 dark mode 功能
> 用 Tailwind CSS 的 dark: 前缀实现
> 在 header 加一个切换按钮
```

两个任务并行推进，完成后各自 push 到远程仓库，互不干扰。

## Worktree 的清理

退出 session 时 Claude Code 自动处理清理：

| 场景 | 行为 |
|------|------|
| 没有任何改动 | 自动删除 worktree 和分支 |
| 有 commit 但没 push | 问你要不要保留 |
| 已经 push 到远程 | 问你要不要保留本地 worktree |

手动清理也很简单：

```bash
# 查看所有 worktree
git worktree list

# 删除指定 worktree
git worktree remove .claude/worktrees/feature-auth
```

建议在 `.gitignore` 里加上 `.claude/worktrees/`，防止 worktree 内容被主仓库追踪。

## Subagent 也能用 Worktree

Claude Code 支持在一个 session 里启动多个 subagent，每个 subagent 各自用独立的 worktree：

```
> 帮我同时做这三件事（每件事用独立的 worktree）：
> 1. 给 auth 模块写单元测试
> 2. 把 utils/ 下的 CommonJS 改成 ES Module
> 3. 更新 README 的 API 文档
```

Claude Code 会给每个子任务分配独立的 worktree，三个 subagent 并行工作。主 agent 协调进度，合并结果。

也可以在自定义 subagent 配置里固定启用 worktree：

```yaml
# .claude/agents/test-writer.md
---
description: 自动写测试的 agent
isolation: worktree
tools:
  - Read
  - Write
  - Edit
  - Bash
---
读取指定模块的源码，生成对应的单元测试文件。
```

## 处理 .env 文件

Worktree 是全新的 checkout，不会复制 `.env` 等 gitignore 文件。在项目根目录创建 `.worktreeinclude`：

```text
.env
.env.local
config/secrets.json
```

Claude Code 创建 worktree 时会自动把这些文件拷贝过去。

## 最佳实践

- 给 worktree 起语义化名字（`bugfix-login`、`feature-dark-mode`），方便识别
- 完成任务后及时清理不需要的 worktree，避免磁盘空间浪费
- 长期任务用 `claude --resume` 恢复 session，不用重新创建 worktree
- 团队协作时，每人用自己的 worktree 前缀（`alice-feature-xxx`）
