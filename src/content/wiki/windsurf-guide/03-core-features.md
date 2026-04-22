---
title: "Windsurf 核心功能深度拆解：Cascade、Memory、MCP 全攻略"
wiki: "windsurf-guide"
order: 3
description: "深入 Cascade 的 Plan-Execute-Verify 循环、Memory 持久记忆系统、Supercomplete 智能补全、MCP 外部集成的技术细节和实操玩法"
---

Windsurf 的核心竞争力不是某个单独的功能，而是 Cascade + Memory + MCP 这三者形成的闭环。这一章拆解每个模块的技术细节和最佳用法。

![Windsurf Cascade deep dive](https://img.youtube.com/vi/Cq0HJ6y-nh8/maxresdefault.jpg)

## Cascade 的工作原理：Plan-Execute-Verify

Cascade 不是简单地"调 API 返回代码"。它在内部跑一个 **Plan-Execute-Verify** 循环：

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  Plan    │ →  │ Execute  │ →  │ Verify   │
│ 读代码库  │    │ 改文件    │    │ 跑 linter │
│ 理解意图  │    │ 跑命令    │    │ 检查结果  │
│ 制定步骤  │    │ 创建文件  │    │ 修复错误  │
└──────────┘    └──────────┘    └──────────┘
      ↑                               │
      └───────── 失败则重新规划 ────────┘
```

关键是 **Verify 阶段**：Cascade 会主动读取 linter 输出、终端错误、类型检查结果，如果发现问题会自动重新规划和修复，而不是直接把有 bug 的代码丢给你。

### 后台规划智能体

在你和 Cascade 对话的同时，后台有一个独立的 **Planning Agent** 在持续优化长期计划。比如你在做一个复杂的重构任务，前台模型负责执行当前步骤，后台规划智能体会根据执行结果不断调整后续步骤的优先级和方案。

这也是为什么 Cascade 处理复杂任务时明显比 "一问一答" 型的 AI 助手更靠谱。

## Memory：AI 终于能 "记住" 你了

Memory 是 Windsurf 的杀手锏功能——其他 AI IDE 几乎都没有做到这个程度。

### Memory 怎么运作

Cascade 会自动学习并记住：

- 你的编码风格（tab vs space、命名规范、注释习惯）
- 项目架构模式（你用 MVC 还是 DDD、状态管理方案）
- 常用 API 和库的使用方式
- 你之前纠正过的错误模式

大约使用 48 小时后，你会明显感觉 Cascade 的建议越来越"懂你"。

### 两种 Memory 类型

| 类型 | 范围 | 用途 |
|------|------|------|
| **Workspace Memory** | 单个项目 | 记住这个项目特有的约定 |
| **Global Memory** | 所有项目 | 记住你个人的通用偏好 |

### 手动管理 Memory

你可以在 Cascade 面板里查看和编辑已学习的 Memory：

```
Cascade 面板 → Settings → Memories → 查看/编辑/删除
```

比如你发现 Cascade 记住了一个过时的模式（项目重构后），可以手动删除这条 Memory。

## Rules：给 Cascade 立规矩

Rules 比 Memory 更主动——你直接告诉 Cascade 应该遵守什么规则。

### 项目级 Rules（`.windsurfrules`）

在项目根目录创建 `.windsurfrules` 文件：

```markdown
# Project Rules

1. 使用 TypeScript strict mode，不允许 any 类型
2. 组件文件名用 PascalCase，工具函数用 camelCase
3. 所有 API 请求走 src/lib/api.ts 中的封装函数
4. CSS 只用 Tailwind，不写自定义 CSS
5. 测试框架用 Vitest，不用 Jest
6. commit message 用 conventional commits 格式
```

### 新版 Rules 目录结构

Windsurf 新版还支持 `.windsurf/rules/` 目录，可以按场景拆分规则文件：

```
.windsurf/
  rules/
    coding-style.md      # 编码风格
    architecture.md      # 架构约定
    testing.md           # 测试规范
    deployment.md        # 部署相关
```

每个 `.md` 文件可以设置 **Activation Mode**：
- **Always On**：始终生效
- **Manual**：手动激活
- **Auto**：Cascade 根据上下文自动判断是否需要

## Supercomplete：不只是自动补全

Windsurf 的 Tab 补全叫 **Supercomplete**，和传统的代码补全有本质区别：

- **上下文感知**：不只看当前文件，还会参考项目中相关文件的代码模式
- **多行预测**：能预测你接下来要写的多行代码，不只是当前行
- **学习你的习惯**：结合 Memory 系统，补全建议会越来越像你自己写的

```typescript
// 你开始写一个 API 请求函数
// Supercomplete 会基于项目中其他 API 函数的模式来补全

export async function getUsers() {
  // 按 Tab，Supercomplete 自动补全：
  const response = await api.get<User[]>('/users');
  if (!response.ok) {
    throw new ApiError('Failed to fetch users', response.status);
  }
  return response.data;
}
// ↑ 因为你项目里其他函数都用这个模式，它学会了
```

最关键的是：**Supercomplete 在所有套餐（包括免费版）都是无限使用的**，不消耗任何 credit。

## MCP 集成：连接外部世界

Windsurf 支持 **Model Context Protocol (MCP)**，让 Cascade 能调用外部工具和服务。

### 内置 MCP 连接

Windsurf 开箱支持 21+ 个 MCP 工具，包括：

- **GitHub**：读取 PR、issue、代码搜索
- **Slack**：发消息、读频道
- **数据库**：查询 PostgreSQL、MongoDB
- **Figma**：读取设计稿，生成对应代码
- **Stripe**：查看支付数据

### 配置 MCP

在 Windsurf 设置中配置 MCP server：

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/mydb"
      }
    }
  }
}
```

配好之后，你可以直接在 Cascade 里说：

```
查看 GitHub 上最近的 5 个 PR，把未 review 的列出来
```

Cascade 会自动调用 GitHub MCP 工具去查询，不用你手动切到浏览器。

## Turbo Mode：解放终端确认

每次 Cascade 要跑终端命令时，默认会让你确认（approve/deny）。如果你信任 Cascade 的操作，可以开启 **Turbo Mode**：

```
Cascade Settings → Turbo Mode → On
```

开启后，Cascade 执行终端命令（npm install、运行测试、构建项目等）不再需要你逐个确认。

**注意**：Turbo Mode 适合开发和测试环境。生产环境操作建议保持关闭，手动审查每条命令。

## 实时上下文感知

这是 Windsurf 最独特的能力之一：Cascade 会持续追踪你在 IDE 里的所有操作：

- 你编辑了哪些文件
- 你在终端跑了什么命令
- 你复制了什么到剪贴板
- 你在预览窗口选中了哪个 HTML 元素

所以你可以在 Cascade 里直接说"继续"，它知道你在做什么、做到了哪一步，不需要重复解释上下文。

这在实际开发中非常舒服——你改了几行代码，跑了个测试发现报错，直接对 Cascade 说"修一下这个错误"，它已经知道你改了什么、错误是什么、上下文是什么。
