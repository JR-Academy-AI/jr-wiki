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
1. `git diff` 看改了什么
2. 根据改动内容自动生成 commit message
3. 只 stage 相关文件（不会把 .env 提交进去）
4. 等你确认后执行 `git commit`

## 创建 PR

```
> 创建一个 PR，目标分支 main
```

自动生成 PR title + description，包含改动摘要和测试说明。

## 实战场景：hotfix

```bash
claude
> 线上 /api/users 接口返回 500，帮我查一下原因并修复
```

Claude Code 会：
1. 读错误日志（如果你提供）
2. 找到相关代码
3. 定位 bug
4. 修复
5. 问你要不要提交和创建 PR

从发现 bug 到 PR ready，5 分钟内完成。

## 注意事项

- Claude Code 不会自动 push，都会先问你
- 默认不会 force push 或 reset --hard
- commit message 自动加 `Co-Authored-By: Claude` 标记
