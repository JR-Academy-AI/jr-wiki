---
title: "安装与第一个命令"
wiki: "claude-code-guide"
order: 1
description: "5 分钟装好 Claude Code，跑通第一个任务"
---

## 安装

```bash
npm install -g @anthropic-ai/claude-code
```

装完直接在项目目录下输入 `claude` 启动。不需要配置文件，不需要 API key（用 OAuth 登录）。

## 第一个任务

进入任何项目目录：

```bash
cd my-project
claude
```

然后直接用中文说你要干什么：

```
> 帮我看看这个项目的结构，有哪些主要模块
```

Claude Code 会自动读文件、分析代码，给你一个结构概览。

## 和 ChatGPT/Cursor 的区别

| 工具 | 工作方式 | 适合场景 |
|------|---------|---------|
| ChatGPT | 对话框粘贴代码 | 问答、学习 |
| Cursor | IDE 内 AI 辅助 | 写新代码、补全 |
| Claude Code | 终端里直接操作文件 | 重构、多文件修改、自动化 |

Claude Code 直接在你的文件系统上操作，不需要复制粘贴。它能同时读几十个文件，理解整个项目上下文。
