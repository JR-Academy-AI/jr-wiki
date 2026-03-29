---
title: "Claude Code 开发工作流实战"
description: "用 Claude Code CLI 替代传统开发流程：从需求分析到代码实现"
publishDate: 2026-03-25
tags:
  - claude
  - ai-tools
  - vibe-coding
  - cli
author: "JR Academy"
---

## Claude Code 是什么

Anthropic 的 CLI 工具，直接在终端里跟 Claude 协作写代码。可以自主读写文件、执行命令、搜索代码库。

## 基本工作流

```bash
claude
> 给 user model 加一个 lastLoginAt 字段，更新相关的 service 和 controller
```

Claude Code 会读取相关文件、分析结构、逐步修改、给你看 diff 确认。

## CLAUDE.md 项目指南

在项目根目录放 `CLAUDE.md` 定义项目规范，Claude Code 每次启动都会读，相当于 AI 的 onboarding 文档。

## 和 Cursor 怎么选

不是二选一。终端里用 Claude Code 做后端，IDE 里用 Cursor 做前端。组合起来效率最高。
