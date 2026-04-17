---
title: "安装与第一个命令"
wiki: "claude-code-guide"
order: 1
description: "5 分钟装好 Claude Code，跑通第一个任务"
---

## 安装

![Claude Code 产品界面](https://claude.com/images/product/claude-code-og.png)

三种安装方式，选一个就行：

```bash
# macOS / Linux（推荐，自动更新）
curl -fsSL https://claude.ai/install.sh | bash

# Homebrew（不自动更新，需手动 brew upgrade）
brew install --cask claude-code

# Windows PowerShell
irm https://claude.ai/install.ps1 | iex
```

Windows 用户需要先装 [Git for Windows](https://git-scm.com/downloads/win)，否则会报 `requires git-bash` 错误。

装完验证一下版本：

```bash
claude --version
```

## 登录

第一次启动会弹浏览器让你登录。支持这些账号：

| 账号类型 | 适用场景 |
|---------|---------|
| Claude Pro / Max / Team | 个人或团队日常开发 |
| Claude Console（API） | 按量付费，适合 CI/CD |
| Amazon Bedrock / Google Vertex / Azure Foundry | 企业级云部署 |

登录后凭证缓存在本地，不用每次重新登录。想切换账号用 `/login`。

## 第一个任务

进入项目目录启动：

```bash
cd my-project
claude
```

用中文或英文告诉它你要干什么：

```
> 这个项目是做什么的？用了哪些技术栈？
```

Claude Code 会自动读 `package.json`、`README`、源码目录结构，给你一个项目概览。

再试试实际操作：

```
> 帮我找一下所有没有错误处理的 API 调用
```

它会用 Grep 搜索代码、读文件、分析逻辑，最后汇报结果。整个过程在你的终端里完成，不需要复制粘贴任何代码。

## 和 ChatGPT / Cursor 的区别

| 工具 | 工作方式 | 上下文范围 | 适合场景 |
|------|---------|-----------|---------|
| ChatGPT | 对话框粘贴代码 | 单次对话 | 问答、学习概念 |
| Cursor | IDE 内 AI 辅助 | 当前文件 + 少量上下文 | 写新代码、补全 |
| Claude Code | 终端直接操作文件系统 | 整个项目 | 重构、多文件修改、调试、Git 操作 |

核心差异：Claude Code 直接在你的文件系统上操作。它能一次读几十个文件，理解跨文件依赖关系，执行终端命令验证结果。

## 多种使用方式

除了终端 CLI，Claude Code 还能在这些地方用：

```bash
# VS Code 扩展（支持 inline diff 和 @-mention）
code --install-extension anthropic.claude-code

# 桌面应用（macOS / Windows，图形化界面）
# 从 https://claude.com/download 下载

# 网页版（不用装任何东西）
# 直接打开 https://claude.ai/code
```

VS Code 里按 `Cmd+Shift+P` 搜索 "Claude Code" 就能打开。JetBrains 系列也有插件，IntelliJ / PyCharm / WebStorm 都支持。
