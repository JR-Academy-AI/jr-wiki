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

# Windows PowerShell（需要管理员权限打开终端）
irm https://claude.ai/install.ps1 | iex
```

**系统要求**：Node.js 18+（macOS/Linux 安装脚本会自动检测；Windows 需提前手动安装 Node）。

Windows 用户还需要先装 [Git for Windows](https://git-scm.com/downloads/win)，否则启动时报 `requires git-bash` 错误。装完之后确认 `git` 在 PATH 里：

```powershell
git --version   # 应输出 git version 2.x.x
claude --version  # 应输出 claude 1.x.x
```

Linux 上如果 `curl` 脚本因权限报错，可以加 `sudo`，或者用 npm 全局安装：

```bash
npm install -g @anthropic-ai/claude-code
```

## 登录

第一次启动会弹浏览器让你登录。支持这些账号：

| 账号类型 | 适用场景 |
|---------|---------|
| Claude Pro / Max / Team | 个人或团队日常开发 |
| Claude Console（API） | 按量付费，适合 CI/CD |
| Amazon Bedrock / Google Vertex / Azure Foundry | 企业级云部署 |

登录后凭证缓存在本地，不用每次重新登录。想切换账号用 `/login`。

在无 GUI 的服务器（SSH 远程）上，启动时选 "print auth URL"，把 URL 复制到本地浏览器完成授权，授权码回填到终端即可。

## 第一个任务

进入项目目录启动：

```bash
cd my-project
claude
```

**看懂陌生项目**：第一次进陌生代码库，先让它给你定向：

```
> 这个项目是做什么的？用了哪些技术栈？主要目录结构是怎样的？
```

Claude Code 会自动读 `package.json`、`README`、源码目录，给出清晰的全局概览，比自己翻文件快得多。

**代码分析**：

```
> 帮我找一下所有没有错误处理的 async 函数，列出文件路径和行号
```

它会用 Grep 搜索代码、逐文件读取、分析控制流，汇报哪些函数缺少 try/catch 或 `.catch()`，同时说明为什么认为有风险。

**修改代码**：

```
> 把 src/utils/format.ts 里的 formatDate 函数改成支持传入 timezone 参数，默认 'Australia/Sydney'
```

改完直接写回文件，终端显示 diff。可以继续让它跑测试验证：

```
> 运行相关测试，看有没有因为这个改动挂掉
```

**Git 工作流**：

```
> 帮我写一个 commit message，描述刚才所有的改动
> 然后 commit，branch 名叫 feat/format-timezone
```

整个流程——读代码、改代码、跑测试、提交——全在终端里完成，不需要切窗口复制粘贴。

## 常用 Keybinding 速查

| 快捷键 | 作用 |
|--------|------|
| `Esc` | 中断当前 AI 响应（不中断已在跑的 shell 命令） |
| `Ctrl+C` | 强制退出（包括终止正在执行的命令） |
| `Ctrl+L` | 清屏（保留上下文历史，不影响对话） |
| `↑ / ↓` | 翻历史输入 |
| `Shift+Enter` | 多行输入（不提交，继续写下一行） |
| `/help` | 查所有 slash 命令列表 |
| `/clear` | 清除当前会话上下文（重新开始） |
| `/compact` | 压缩对话历史（上下文快满时用） |
| `/model` | 切换模型（Opus 4 / Sonnet 4 / Haiku 4） |
| `/login` | 切换账号或重新授权 |

VS Code 插件里额外多两个常用快捷键：`Cmd+Shift+P` → "Claude Code: Focus" 快速聚焦聊天窗口；`Cmd+I`（macOS）/ `Ctrl+I`（Windows/Linux）打开 inline edit 面板，可以直接针对选中代码下指令。

## 和 ChatGPT / Cursor 的区别

| 工具 | 工作方式 | 上下文范围 | 适合场景 |
|------|---------|-----------|---------|
| ChatGPT | 对话框粘贴代码 | 单次对话 | 问答、学习概念 |
| Cursor | IDE 内 AI 辅助 | 当前文件 + 少量上下文 | 写新代码、补全 |
| Claude Code | 终端直接操作文件系统 | 整个项目 | 重构、多文件修改、调试、Git 操作 |

核心差异：Claude Code 直接在你的文件系统上操作。它能一次读几十个文件，理解跨文件依赖关系，执行终端命令验证结果——这是单文件 IDE 辅助做不到的。

## 多种使用方式

除了终端 CLI，Claude Code 还能在这些地方用：

```bash
# VS Code 扩展（支持 inline diff 和 @-mention 文件）
code --install-extension anthropic.claude-code

# 桌面应用（macOS / Windows，图形化界面）
# 从 https://claude.com/download 下载

# 网页版（不用安装任何东西）
# 直接打开 https://claude.ai/code
```

VS Code 里按 `Cmd+Shift+P` 搜索 "Claude Code" 就能打开侧边栏。JetBrains 系列也有插件，IntelliJ / PyCharm / WebStorm 均支持，安装方式和 VS Code 类似，在 Marketplace 里搜 "Claude Code" 即可。
