---
title: "Git 工作流自动化"
wiki: "claude-code-guide"
order: 3
description: "让 Claude Code 帮你管理分支、提交、PR"
---

## 自动提交

改完代码直接说：

```
> 提交这些修改
```

Claude Code 会：

1. `git diff` 查看所有改动
2. 分析改动内容，生成语义化的 commit message
3. 只 stage 相关文件（自动跳过 `.env`、`node_modules` 等敏感文件）
4. 展示 commit 预览，等你确认后执行

![Claude Code Git 工作流示意](https://mintcdn.com/claude-code/UMJp-WgTWngzO609/images/hooks-lifecycle.svg?fit=max&auto=format&n=UMJp-WgTWngzO609&q=85&s=3f4de67df216c87dc313943b32c15f62)

生成的 commit message 格式规范，比如：

```
feat: add input validation to user registration form

- Add email format check with regex
- Add password strength requirements  
- Show inline error messages on invalid input
```

## 创建 PR

```
> 创建一个 PR，目标分支 main，描述这次改了什么
```

自动生成 PR title + description，包含改动摘要、影响范围和测试说明。如果你接了 GitHub MCP Server，还能直接在 Claude Code 里完成 PR 创建，不用切到浏览器。

PR 创建后，session 会自动关联到这个 PR。下次用 `claude --from-pr 123` 就能恢复上下文继续工作。

## 分支管理

```bash
# 创建功能分支
> 从 main 创建一个新分支 feature/user-profile，然后切过去

# 查看分支状态
> 当前分支和 main 差了几个 commit？有没有冲突？

# 合并前检查
> 帮我 rebase 到最新的 main，如果有冲突就告诉我
```

## 实战场景：hotfix

线上出 bug 时，Claude Code 能帮你从排查到修复到提 PR 全流程搞定：

```
> 线上 /api/users 接口返回 500，这是错误日志：
> [粘贴日志]
> 帮我找到原因，修复，然后创建 hotfix PR
```

Claude Code 的执行流程：

1. 分析错误日志，定位到具体的代码文件和行号
2. 读取相关代码，理解上下文
3. 找到 root cause 并修复
4. 跑测试确认修复有效
5. 创建 hotfix 分支、提交、推送、创建 PR

从发现 bug 到 PR ready，通常 5 分钟内完成。

## 解决 Merge Conflict

```
> 帮我解决当前的 merge conflict
```

Claude Code 会读取冲突文件，理解两边的改动意图，选择合理的合并策略。对于复杂冲突，它会解释每处冲突的取舍理由，让你做最终决定。

## 代码审查

让 Claude Code 在提交前帮你检查代码质量：

```
> review 一下我这次改的所有文件，看有没有问题
```

它会检查：
- 逻辑错误和边界情况
- 类型安全问题
- 潜在的性能问题
- 不符合项目规范的写法

## 安全机制

Claude Code 对 Git 操作的默认行为很保守：

- 不会自动 push，修改都先到本地
- 不会 force push 或 `reset --hard`
- 不会跳过 pre-commit hook（`--no-verify`）
- 敏感文件（`.env`、credentials）不会被 stage

这些限制确保你不会因为 AI 的一次操作搞坏远程仓库。如果某个操作确实需要 force push，你需要明确告诉它。
