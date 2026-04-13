---
title: "IDE 集成：VS Code、JetBrains 与桌面端"
wiki: "claude-code-guide"
order: 7
description: "在 IDE 里直接使用 Claude Code，终端和编辑器自由切换"
---

## 三种使用方式

Claude Code 不只是个终端工具。2025-2026 年陆续推出了 VS Code 扩展、JetBrains 插件和独立桌面端。

| 环境 | 安装方式 | 适合场景 |
|------|---------|---------|
| **终端 CLI** | `curl -fsSL https://claude.ai/install.sh \| bash` | 重度终端用户、CI/CD、脚本自动化 |
| **VS Code 扩展** | Extensions 搜索 "Claude Code" | 前端开发、需要 inline diff |
| **JetBrains 插件** | Marketplace 搜索 "Claude Code" | Java/Kotlin/Python 开发者 |
| **桌面端** | [claude.com/download](https://claude.com/download) | 多项目并行、可视化 diff review |

## VS Code 扩展

安装后按 `Cmd+Shift+P`（Windows 用 `Ctrl+Shift+P`）输入 "Claude Code"，选 "Open in New Tab" 打开面板。

![VS Code 中的 Claude Code 扩展](https://code.claude.com/images/vscode-extension.png)

VS Code 扩展比纯终端多了几个关键能力：

**@ 引用文件和代码段**

在对话框里输入 `@` 可以直接引用文件，还能选中代码后引用特定行：

```
@src/services/auth.ts 这个文件的 login 函数有没有处理 token 过期的情况？
```

**Inline diff 审查**

Claude Code 修改文件后，VS Code 会弹出 diff 视图，和 git diff 体验一致。可以逐个文件 Accept 或 Reject，也可以一键全部接受。

**终端集成**

VS Code 的内置终端也能跑 Claude Code CLI，两者共享同一个会话上下文。选中编辑器里的代码，右键可以直接发给 Claude Code 分析。

## JetBrains 插件

在 IntelliJ IDEA、PyCharm、WebStorm 等 JetBrains IDE 中都能用。安装方式：

```
Settings → Plugins → Marketplace → 搜索 "Claude Code" → Install → 重启 IDE
```

JetBrains 插件的 diff 审查用的是 IDE 自带的 diff viewer，对 Java/Kotlin 项目特别友好——类型推断、import 整理都能正确处理。

## 桌面端

独立桌面应用，不依赖任何 IDE。下载安装后登录，点 Code tab 开始用。

桌面端的独特功能：

- **多会话并行**：同时开多个 session 处理不同项目
- **可视化 diff**：比终端里看 diff 更直观
- **定时任务**：可以设置定期执行的任务（比如每天早上跑 PR review）
- **Cloud session**：任务跑在云端，关掉电脑也能继续执行

在终端里输入 `/desktop` 可以把当前会话移交给桌面端继续操作。

## 跨环境协作

所有环境共享同一套配置：

```
~/.claude/settings.json      → 全局设置（所有环境生效）
项目/.claude/settings.json   → 项目级设置
项目/CLAUDE.md               → 项目指令（所有环境读取）
项目/.claude/mcp.json        → MCP 服务器配置
```

在终端里配好的 Hooks 和 MCP，打开 VS Code 扩展也能直接用，不用重复配置。
