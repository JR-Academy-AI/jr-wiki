---
title: "安装与第一个 Spec-Driven 项目"
wiki: "kiro-guide"
order: 2
description: "5 分钟装好 Kiro，用 Spec-Driven 工作流搭建第一个全栈应用"
---

## 下载安装

Kiro 支持 macOS、Windows、Linux，去官网下载：

![Kiro 新手入门](https://img.youtube.com/vi/a1EIi9BM3b0/maxresdefault.jpg)

```bash
# macOS
# 去 kiro.dev 下载 .dmg，拖进 Applications

# Windows
# 去 kiro.dev 下载 .exe，双击安装
# WSL2 用户注意：当前版本在 WSL2 下有路径兼容问题，建议用原生 Windows 模式

# Linux
# 去 kiro.dev 下载 .deb 或 .AppImage
sudo dpkg -i kiro_*.deb
```

Kiro 基于 Code OSS，第一次启动会问你要不要导入 VS Code 设置。**建议导入**——快捷键、主题、常用配置直接继承，不用重新折腾。

插件方面，Kiro 用的是 Open VSX 市场（不是微软的 VS Code Marketplace），大部分流行插件都有，但少数微软独占插件可能找不到。

## 注册与免费额度

支持 AWS Builder ID、Google、GitHub 登录。免费用户的额度：

| 免费额度 | 说明 |
|---------|------|
| Agent 交互 | 50 credits/月（永久免费） |
| 新用户奖励 | 额外 500 credits（前 30 天） |
| 自动补全 | 包含在 credits 内 |
| Spec 生成 | 包含在 credits 内 |

一个 credit 大约等于一次 Agent 交互。50 credits 够你每天跑 1-2 个 spec 项目体验完整流程。新用户前 30 天有 500 额外 credits，足够深度试用。

用完了怎么办？等下月重置，或者升级 Pro（$20/月，1000 credits）。

## 第一个项目：用 Spec-Driven 做一个待办事项应用

### Step 1: 创建项目

打开一个空文件夹，按 `Ctrl/Cmd + Shift + P` 打开 Command Palette，选 `Kiro: New Spec`，或者直接在 Chat 面板描述你要做什么：

```
Build a full-stack todo app with React frontend and Express backend.
Users can create, complete, and delete todos.
Data stored in SQLite. Include dark mode toggle.
```

### Step 2: 审阅 Requirements

Kiro 会在 `.kiro/specs/` 目录下生成 `requirements.md`：

```markdown
## Requirements

1. WHEN a user opens the app THE SYSTEM SHALL display all existing todos
2. WHEN a user submits a new todo THE SYSTEM SHALL add it to the list
3. WHEN a user clicks a todo THE SYSTEM SHALL toggle its completion status
4. WHEN a user clicks delete THE SYSTEM SHALL remove the todo
5. WHERE dark mode is enabled THE SYSTEM SHALL apply dark theme styles
```

这就是 EARS 标记法——每条需求都有明确的触发条件和预期行为。你可以直接编辑这个文件，加需求、删需求、改措辞，Kiro 会根据你的修改更新后续步骤。

### Step 3: 确认 Design

点 `Proceed` 或让 Kiro 继续，它会生成 `design.md`：

```markdown
## Tech Stack
- Frontend: React 18 + Vite + Tailwind CSS
- Backend: Express.js + SQLite (better-sqlite3)
- API: RESTful (GET/POST/PATCH/DELETE /api/todos)

## Data Model
| Field      | Type    | Description       |
|-----------|---------|-------------------|
| id        | INTEGER | Primary key       |
| title     | TEXT    | Todo content      |
| completed | BOOLEAN | Completion status |
| createdAt | TEXT    | ISO timestamp     |
```

技术选型不满意？直接告诉 Kiro："后端换成 Hono，数据库用 Drizzle ORM"，它会重新生成。

### Step 4: 执行 Tasks

最后生成 `tasks.md`，每个任务带 checkbox：

```markdown
- [ ] Initialize Vite + React + TypeScript project
- [ ] Set up Express server with SQLite
- [ ] Create REST API endpoints for CRUD
- [ ] Build TodoList and TodoItem components
- [ ] Add dark mode toggle with Tailwind
- [ ] Connect frontend to backend API
```

点某个任务，Kiro 的 Agent 就会自动执行：创建文件、写代码、装依赖、跑测试。完成后自动打勾，你可以 review 每个改动再进入下一个。

### Step 5: 跑起来

```bash
# Kiro 通常会自动在终端跑 dev server
# 如果没有，手动执行：
npm install && npm run dev
```

整个过程大约 10-15 分钟。和 Cursor 的 Agent Mode 比，多花了 3 分钟在 spec 上，但你对最终产物有完整的预期——不会出现"Agent 跑了 5 分钟给你做了个你不想要的东西"。
