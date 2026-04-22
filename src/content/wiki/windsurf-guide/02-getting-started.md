---
title: "Windsurf 快速上手：10 分钟从安装到第一个 AI 辅助项目"
wiki: "windsurf-guide"
order: 2
description: "下载安装 Windsurf、导入 VS Code 配置、用 Cascade 创建第一个项目，10 分钟体验 AI 原生开发流程"
---

Windsurf 的上手成本很低——如果你用过 VS Code，迁移过来基本是无缝的。这一章带你从零开始，10 分钟跑通第一个 AI 辅助的开发流程。

![Windsurf getting started](https://img.youtube.com/vi/aHrUPrO0Pxk/maxresdefault.jpg)

## 第一步：下载安装

1. 打开 [windsurf.com](https://windsurf.com) → 点击 **Download**
2. 选择你的系统：macOS / Windows / Linux 都支持
3. 安装完成后启动 Windsurf

**系统要求**：
- 最低 8GB RAM（推荐 16GB，大项目用 Codebase 索引模式会吃内存）
- Windsurf 自身占用约 400-600MB 内存
- 网络连接（Cascade 需要云端模型）

## 第二步：初始配置

首次启动时，Windsurf 会引导你完成三个选择：

```
1. 导入配置 → "Import from VS Code" 或 "Import from Cursor" 或 "Start fresh"
2. 快捷键方案 → VS Code 默认 / Vim
3. 主题 → 和 VS Code 一样的主题库
```

**强烈建议选"Import from VS Code"**——你的插件、设置、快捷键全部带过来，体感几乎没有迁移成本。

## 第三步：注册账号

点击右上角登录，支持 Google / GitHub / 邮箱注册。

**免费计划包含**：
- **Tab 自动补全**（Supercomplete）—— 无限次，不消耗额度
- **Cascade 对话**—— 每天约 5 次 Agent 级操作
- **代码库索引**—— 自动建立语义索引
- **基础模型**—— Codeium 自研模型（非 Claude/GPT-4o）

免费版足够日常轻度使用。如果你发现每天 5 次 Cascade 不够用，再考虑升级 Pro（$15/月，500 prompt credits）。

## 第四步：打开你的第一个项目

两种方式：

**方式 A：打开已有项目**
```bash
# 终端里直接用命令打开
windsurf ~/my-project

# 或者在 Windsurf 里 File → Open Folder
```

**方式 B：用 Cascade 从零创建**

点击 Cascade 面板的 **New Project** 按钮，直接用自然语言描述：

```
帮我创建一个 React + TypeScript 的 Todo 应用，
要求：
- 使用 Tailwind CSS 做样式
- 支持添加、完成、删除任务
- 数据存在 localStorage
- 有一个简洁现代的 UI
```

Cascade 会自动规划步骤、生成代码、创建文件结构，你只需要看着它干活，然后审查结果。

## 第五步：认识 Cascade 面板

按 `Cmd+L`（macOS）或 `Ctrl+L`（Windows/Linux）打开 Cascade 面板。这是你和 AI 交互的主界面。

**关键交互方式**：

| 操作 | 快捷键 | 说明 |
|------|--------|------|
| 打开 Cascade | `Cmd/Ctrl + L` | 选中代码时自动作为上下文 |
| 内联编辑 | `Cmd/Ctrl + K` | 在当前位置直接让 AI 改代码 |
| Tab 补全 | `Tab` | 接受 Supercomplete 建议 |
| 切换模式 | 面板内切换 | Chat / Write / Agent |

**一个很酷的细节**：如果你在编辑器里选中一段代码，然后按 `Cmd+L`，选中的代码会自动成为 Cascade 的上下文——不用复制粘贴。

## 第六步：试试 Cascade 的三种模式

### Chat 模式——问问题

```
这个 useEffect 为什么会导致无限渲染？
```

Cascade 会分析你当前文件的代码，解释问题原因，但不会改你的代码。

### Write 模式——改代码

```
给这个组件加上 loading 状态和错误处理
```

Cascade 会直接修改文件，你在 diff 视图里看到所有改动，可以逐个接受或拒绝。

### Agent 模式——全自动

```
把这个项目从 JavaScript 迁移到 TypeScript，
包括配置 tsconfig、重命名文件、修复类型错误
```

Agent 模式下 Cascade 会自主执行整个流程：分析项目 → 制定计划 → 逐步执行 → 检查结果 → 修复问题。你可以在过程中随时介入。

## 第七步：理解 Checkpoint 机制

Cascade 的每次操作都会创建 **checkpoint**（检查点），类似 Git 的快照。如果 AI 改出了你不想要的东西，点击 checkpoint 就能回滚到之前的状态。

这比你自己手动 `git stash` 方便太多——尤其是 Agent 模式一次改了十几个文件的时候。

```
Cascade 操作流程：

你的指令 → Cascade 规划 → [Checkpoint A]
                         → 修改文件 1 → [Checkpoint B]
                         → 修改文件 2 → [Checkpoint C]
                         → 跑测试 → 发现错误 → 修复 → [Checkpoint D]

任何时候都可以回退到 A/B/C/D 任意检查点
```

## 常见新手问题

**Q: 从 VS Code 迁移会丢插件吗？**
不会。Windsurf 兼容绝大多数 VS Code 插件。极少数依赖 VS Code 私有 API 的插件可能不兼容，但主流插件（ESLint、Prettier、GitLens 等）都没问题。

**Q: 免费版够用吗？**
如果你主要用 Tab 补全 + 偶尔问 Cascade 问题，免费版完全够。如果你想重度使用 Agent 模式让 Cascade 帮你写大块功能，建议上 Pro。

**Q: 能离线用吗？**
编辑器本身可以离线运行（和 VS Code 一样），但 Cascade 和 Supercomplete 需要网络——AI 模型跑在云端。
