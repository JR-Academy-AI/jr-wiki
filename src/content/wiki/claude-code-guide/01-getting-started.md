---
title: "安装与第一个命令"
wiki: "claude-code-guide"
order: 1
description: "5 分钟装好 Claude Code，跑通第一个任务"
---

## 安装方式

三种安装方式，选适合你的：

```bash
# 方式 1：官方一键安装（推荐，自动更新）
curl -fsSL https://claude.ai/install.sh | bash

# 方式 2：Homebrew（macOS/Linux）
brew install --cask claude-code

# 方式 3：Windows PowerShell
irm https://claude.ai/install.ps1 | iex
```

Windows 用户需要先装 [Git for Windows](https://git-scm.com/downloads/win)，否则 Claude Code 跑不起来。

装完后终端输入 `claude` 会提示 OAuth 登录，支持 Claude Pro/Max/Team 订阅和 Console API 账号。登录一次后凭证会存在本地，后续不用重复登录。

![Claude Code 终端界面](https://github.com/anthropics/claude-code/raw/main/demo.gif)

## 第一个任务

进入任何项目目录，启动 Claude Code：

```bash
cd my-project
claude
```

然后直接说你要干什么：

```
> 帮我看看这个项目的结构，有哪些主要模块
```

Claude Code 会自动读文件、分析代码，给你一个结构概览。不用手动贴代码，它能直接访问你整个项目的文件系统。

## 常用启动参数

```bash
claude                  # 交互模式，最常用
claude "修复构建错误"      # 一次性任务，干完退出
claude -p "解释这个函数"   # 非交互查询，适合脚本调用
claude -c               # 继续上一次对话
claude -r               # 从历史对话中选一个恢复
```

`-p` 参数在 CI/CD 或 shell 脚本里特别有用。比如把日志 pipe 进去分析：

```bash
tail -200 app.log | claude -p "看看有没有异常"
```

## 和 ChatGPT/Cursor 的区别

| 工具 | 工作方式 | 适合场景 |
|------|---------|---------|
| ChatGPT | 对话框粘贴代码 | 问答、学习概念 |
| Cursor | IDE 内 AI 辅助 | 写新代码、自动补全 |
| Claude Code | 终端里直接操作文件系统 | 跨文件重构、自动化、CI/CD |

核心区别：Claude Code 直接跑在你的终端里，能同时读几十个文件，能执行 shell 命令，能操作 git。不需要把代码复制粘贴到对话框里。
