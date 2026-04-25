---
title: "进阶配置与高级玩法"
wiki: "cursor-guide"
order: 4
description: ".cursorrules 项目规则、MCP 集成外部工具、Background Agent 云端编程、Notepads 和模型管理"
---

## .cursorrules：让 Cursor 按你的规矩写代码

Cursor 最值得花时间配的东西就是 `.cursorrules`。在项目根目录创建这个文件，AI 每次生成代码都会遵守里面的规则——相当于给 AI 一份项目编码规范。

![Cursor Rules 与 MCP 高级配置](https://img.youtube.com/vi/jCEEXBqw2lg/maxresdefault.jpg)

```markdown
# .cursorrules

## 技术栈
- Frontend: Next.js 15 + TypeScript 5.7 + Tailwind CSS 4
- Backend: tRPC + Drizzle ORM
- Database: PostgreSQL 17
- Testing: Vitest + Playwright

## 编码规范
- React 组件一律用函数式 + hooks，禁用 class component
- 状态管理用 Zustand，不用 Redux / Context
- 数据获取用 TanStack Query，不用 useEffect + fetch
- 类型定义放 types/ 目录，用 Zod schema 做运行时验证

## 文件命名
- 组件: PascalCase (UserProfile.tsx)
- 工具函数: camelCase (formatDate.ts)
- 常量: SCREAMING_SNAKE_CASE

## 禁止事项
- 不用 any 类型，实在不知道用 unknown
- 不在 component 里直接调数据库
- 不硬编码 API URL，用环境变量
- 不用 var，只用 const / let
```

### 新版 Rules 系统

Cursor 已经支持更灵活的 `.cursor/rules/` 目录结构：

```
.cursor/
  rules/
    global.mdc      # 全局规则，所有对话生效
    react.mdc       # 只在 .tsx 文件生效（文件级规则）
    api.mdc         # 只在 src/api/ 下生效（目录级规则）
    testing.mdc     # 手动引用的规则（Agent 按需读取）
```

每个 `.mdc` 文件的 frontmatter 指定作用范围：

| 类型 | 说明 |
|------|------|
| `always` | 每次对话都自动加载 |
| `auto-attached` | 匹配 glob 模式时自动加载，如 `globs: ["**/*.tsx"]` |
| `agent-requested` | Agent 根据任务需要自己决定是否读取 |
| `manual` | 只有你用 `@rules` 手动引用时才加载 |

建议每个项目 5-8 个规则文件，每个不超过 100 行。社区资源 [awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) 有 React、Vue、Next.js、Python、Go 等上百个模板可以直接抄。

## MCP：给 Agent 连接外部工具

MCP（Model Context Protocol）让 Cursor 的 Agent 调用外部工具——数据库、设计稿、浏览器、API 平台。在 `Cursor Settings > Features > MCP` 里添加，或者手动编辑 `.cursor/mcp.json`：

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://user:pass@localhost:5432/mydb"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-playwright"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_xxx"
      }
    }
  }
}
```

配好后，Agent Mode 会自动识别可用的 MCP 工具。对话里说"查一下数据库里有哪些表"或"用 Playwright 截个图看看首页效果"，Agent 就会调用对应的 MCP Server。

实用 MCP 推荐：

| MCP Server | 用途 |
|-----------|------|
| **Playwright** | 浏览器自动化、截图、端到端测试 |
| **PostgreSQL/MySQL** | 查 schema、跑 SQL、验证数据 |
| **GitHub** | 读 issue、创建 PR、查 CI 状态 |
| **Figma** | 读设计稿生成 UI 代码 |
| **Filesystem** | 安全地读写指定目录的文件 |

## Background Agent：云端异步编程

Background Agent 是 Cursor 的杀手级功能——把任务丢给云端 Agent，它在远程环境里自主执行，你关掉电脑都能继续跑。

使用方法：Composer 里点 Background Agent 图标（或搜索 `Background Agent`），描述任务后提交。Agent 会在云端 fork 一个分支，完成后你能看到所有改动的 diff，确认后合并。

```bash
# 适合 Background Agent 的任务：
# - 给整个项目写单元测试
# - 迁移数据库 schema + 更新所有查询
# - 把项目从 JavaScript 迁到 TypeScript
# - 批量重命名 API 接口 + 更新前端调用

# 不适合的任务：
# - 需要实时反馈的 UI 调试
# - 依赖本地环境变量或数据库的任务
# - 需要你频繁确认方向的探索性任务
```

## Notepads：可复用的上下文片段

Notepads 在左侧边栏，用来存项目级的上下文信息。和 `.cursorrules` 的区别：rules 是强制规则，Notepads 是参考资料。

创建几个常用 Notepad：

- **架构说明**：项目整体结构、目录规范、数据流
- **API 契约**：前后端接口定义、字段说明
- **设计系统**：颜色、字号、间距、组件规范

在 Composer 或 Chat 里用 `@notepads` 引用。Agent 会自动读取相关的 Notepad 内容，不用每次重新解释项目背景。

## YOLO Mode：全自动执行

Cursor Settings 里搜索 `auto-run`，开启后 Agent 可以自动执行终端命令不需要你逐条确认。适合你信任 AI 输出、想让它一口气跑完的场景。

可以配置白名单，只允许自动执行特定命令：

```
npm install, npm run build, npm test, npx prisma generate
```

危险命令（`rm -rf`、`DROP TABLE`）即使开了 YOLO 也会弹确认。但还是建议只在个人项目里开——团队项目用默认的逐步确认更安全。
