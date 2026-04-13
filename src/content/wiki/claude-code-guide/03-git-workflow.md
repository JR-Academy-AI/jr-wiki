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
1. 跑 `git diff` 看改了什么
2. 根据改动内容自动生成 commit message
3. 只 stage 相关文件（不会把 `.env` 或 `node_modules` 提交进去）
4. 等你确认后执行 `git commit`

生成的 commit message 一般是这样的格式：

```
fix(auth): handle expired token refresh in middleware

- Add token expiration check before API calls
- Return 401 instead of 500 when refresh fails
- Add unit test for expired token scenario
```

![Claude Code Git 工作流](https://code.claude.com/images/git-workflow.png)

## 创建 PR

```
> 创建一个 PR，目标分支 main
```

Claude Code 会自动生成 PR title + description，包含改动摘要、修改文件列表和测试说明。如果配置了 GitHub MCP，直接就能创建 PR，不用切换到浏览器。

## 实战：5 分钟 hotfix

线上出 bug 了，这是最快的修复路径：

```bash
cd my-project
claude
```

```
> 线上 /api/users 接口返回 500，错误信息是 "Cannot read property 'email' of null"，帮我查原因并修复
```

Claude Code 的处理流程：
1. 用 Grep 搜索路由定义，找到 `/api/users` 对应的 handler
2. 读取相关的 service 和 model 文件
3. 定位到 `user.email` 没做 null check 的问题
4. 加上防御性代码
5. 跑现有的测试确认没破坏其他功能
6. 问你要不要提交和创建 PR

从发现 bug 到 PR ready，5 分钟内完成。

## 处理 merge conflict

```
> 帮我解决当前的 merge conflict
```

Claude Code 会读取冲突标记（`<<<<<<<`、`>>>>>>>`），分析两边的意图，然后合并成合理的结果。比手动解决快得多，尤其是涉及多个文件的冲突。

## 安全边界

Claude Code 在 git 操作上有几条硬性规则：

- **不会自动 push**——所有推送操作都会先问你确认
- **不会 force push**——默认拒绝 `--force`，除非你明确要求
- **不会 reset --hard**——不做不可逆的破坏性操作
- **不会提交敏感文件**——自动跳过 `.env`、credentials 等文件
- commit message 会自动加 `Co-Authored-By: Claude` 标记，方便 code review 时区分人写的和 AI 写的
