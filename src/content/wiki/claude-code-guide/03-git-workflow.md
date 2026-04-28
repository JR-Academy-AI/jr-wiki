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

## 创建 PR：从命令到上线

### 基本用法

```
> 创建一个 PR，目标分支 main，描述这次改了什么
```

Claude Code 会自动生成 PR title 和 description，包括：
- 改动摘要（从 diff 提炼）
- 影响范围
- 测试说明
- 关联的 issue（如果 commit message 里有 `#123` 引用）

### 接 GitHub MCP Server 之后

配置好 GitHub MCP Server（见第 5 章），PR 创建变成真正的一步操作：

```
> 我这个功能分支做完了，帮我推到 remote，然后对 main 开 PR，
  标题写「feat: 用户个人资料页改版」，reviewer 加上 @alice @bob
```

Claude Code 完成的步骤：

1. `git push -u origin feature/user-profile`
2. 调用 GitHub API 创建 PR，填写 title 和 body
3. 通过 API 添加 reviewer
4. 返回 PR 链接

整个过程不需要离开终端，也不用在浏览器里填表单。

### 用模板生成 PR Description

如果项目里有 `.github/pull_request_template.md`，直接告诉 Claude Code 按模板填：

```
> 按 PR 模板创建，测试这块写「单元测试 + 手动测试 iOS Safari 14」，
  风险评估写「涉及登录逻辑，建议先部署到 staging 验证」
```

它会把你说的内容映射到模板对应字段，其余字段从代码改动里自动提取。

### PR 创建后的跟踪

有了 GitHub MCP，这些查询直接走 API，不用去浏览器刷页面：

```bash
> 我的 PR #234 CI 跑了多久？测试有没有过？
> PR #234 有什么 review 意见还没处理？
> PR #234 被 approve 了吗？帮我 merge 掉
```

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

### 快速解决

```
> 帮我解决当前的 merge conflict
```

Claude Code 会读取冲突文件，理解两边的改动意图，选择合理的合并策略。对于复杂冲突，它会解释每处冲突的取舍理由，让你做最终决定。

### 详细工作流

实际的 merge conflict 处理分三步走：

**第一步：搞清楚冲突来源**

```
> git status 看一下，哪些文件有冲突？每个冲突大概是什么类型的改动？
```

Claude Code 会逐一分析冲突标记（`<<<<<<<` / `=======` / `>>>>>>>`），判断是：
- 同一行被两边都改了（真冲突，需要人工决策）
- 两边改了不同函数（可以安全合并）
- 一边删文件、另一边修改了同一文件（最复杂，需要理解业务意图）

**第二步：解决每个冲突**

对于简单情况，让它直接解决：

```
> src/components/Header.tsx 那个冲突，用 main 分支的版本
> src/utils/api.ts 那里两边的修改都要保留，帮我合并
```

对于复杂冲突，让它解释后你来决定：

```
> UserService.java 有三处冲突，帮我逐一分析，告诉我每处用哪边更合理，
  但别直接改，等我确认
```

**第三步：验证合并结果**

```
> 冲突都解决了，帮我跑一下测试，看看有没有引入新问题
```

### 常见陷阱

**package-lock.json / yarn.lock 冲突**：这类文件手工合并必出错。正确做法：

```
> package-lock.json 有冲突，帮我选一个版本 checkout，然后重新 npm install 生成
```

Claude Code 会 checkout 某一边的版本，再跑 `npm install` 重新生成 lockfile，结果一定是正确的。

**Rebase 中途冲突**：rebase 过程中遇到冲突会停下来，可以这样接着处理：

```bash
# rebase 停在某个 commit，告诉 Claude Code
> rebase 暂停了，当前冲突是什么情况？帮我解决，然后 git rebase --continue
```

## Git Worktree 配合 Claude Code

### 为什么需要 worktree

开发时常见场景：你在 `feature/checkout-v2` 上改了一半，突然要去修一个生产 bug。常规做法是 `git stash`，切分支，改完再切回来、`git stash pop`。如果两个任务都需要 Claude Code 介入，两个 session 会互相干扰，stash/unstash 也容易出错。

`git worktree` 让你在同一个仓库里有两个独立的工作目录，各自对应不同分支，互不干扰。

### 基本用法

```bash
# 给 hotfix 任务开一个独立工作目录
git worktree add ../my-project-hotfix hotfix/payment-bug

# 在新工作目录里启动 Claude Code
cd ../my-project-hotfix
claude
```

两个终端窗口，两个 Claude Code session，分别处理不同任务，git 状态完全隔离。

### 让 Claude Code 帮你管理 worktree

```
> 用 git worktree 给我创建一个新工作目录处理 hotfix，
  分支名 hotfix/fix-cart-total，目录放在 ../jr-shop-hotfix
```

Claude Code 执行：

```bash
git worktree add -b hotfix/fix-cart-total ../jr-shop-hotfix main
```

任务完成后清理：

```
> worktree 任务搞完了，帮我合并回 main 然后删掉那个 worktree
```

Claude Code 依次执行：

```bash
# 提交 worktree 里的改动
git -C ../jr-shop-hotfix add .
git -C ../jr-shop-hotfix commit -m "fix: correct cart total calculation"

# 回到主目录合并
git checkout main
git merge hotfix/fix-cart-total

# 清理
git worktree remove ../jr-shop-hotfix
git branch -d hotfix/fix-cart-total
```

### 多 agent 并行任务

Claude Code 的 Agent SDK 里，`isolation: "worktree"` 选项会自动为每个子 agent 创建独立 worktree，任务结束后自动清理。这是在 CI / 自动化流水线里跑多个并发 agent 的推荐方式——每个 agent 有自己的文件系统视图，不会踩脚：

```typescript
// 两个 agent 同时工作，互不干扰
const [refactorResult, testResult] = await Promise.all([
  claude.run("重构 UserService", { isolation: "worktree" }),
  claude.run("补充单元测试", { isolation: "worktree" }),
]);
```

详见第 8 章 Agent SDK 的隔离模式。

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
