---
title: "进阶技巧与实战配置"
wiki: "windsurf-guide"
order: 4
description: "Rules 项目规则、MCP 插件、模型选择、Credit 管理，把 Windsurf 用到极致"
---

## .windsurfrules：让 AI 按你的规矩写代码

Windsurf 最高 ROI 的配置就是 `.windsurfrules` 文件。在项目根目录创建它，Cascade 每次生成代码都会遵守里面的规则。

![Windsurf 高级配置与 MCP 集成](https://img.youtube.com/vi/42MZqcQZE6k/maxresdefault.jpg)

```markdown
# .windsurfrules

## 技术栈
- Frontend: React 19 + TypeScript 5.7 + Tailwind CSS 4
- Backend: Node.js 22 + Express 5
- Database: PostgreSQL 17 + Prisma ORM
- Testing: Vitest + Playwright

## 代码规范
- 组件用函数式写法，不用 class component
- 状态管理用 Zustand，不用 Redux
- API 请求用 TanStack Query，不用 useEffect + fetch
- 文件命名用 kebab-case，组件命名用 PascalCase

## 禁止事项
- 不要在前端硬编码 API URL，用环境变量
- 不要用 any 类型
- 不要在 component 里直接写 SQL 或数据库操作
```

几个要点：

- **文件上限 6000 字符**，全局规则和工作区规则各 6000。写不下就只保留最重要的约束
- 新版 Windsurf 支持 `.windsurf/rules/rules.md` 格式，功能一样，如果两个都存在，新格式优先
- 规则改了之后**重启 Windsurf** 才生效

## MCP Server：给 Cascade 接外部能力

MCP（Model Context Protocol）让 Cascade 能调用外部工具。Windsurf 内置了 MCP Marketplace，一键就能装。

最实用的几个 MCP Server：

| MCP Server | 能干什么 |
|-----------|---------|
| **Figma** | 读取 Figma 设计稿，直接生成对应 UI 代码 |
| **PostgreSQL** | 查询数据库 schema，生成 SQL，验证查询结果 |
| **Playwright** | 跑端到端测试，截图验证 UI |
| **Slack** | 在 IDE 里读/发 Slack 消息 |

配置方式：打开 Cascade 面板右上角的 MCP 图标，或者手动编辑配置文件：

```json
// mcp_config.json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://user:pass@localhost:5432/mydb"
      }
    },
    "figma": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-figma"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "your-token-here"
      }
    }
  }
}
```

配好 Figma MCP 后，跟 Cascade 说"按照 Figma 里的 Login Page 写代码"，它会自己读设计稿、提取布局颜色、生成组件。

## 模型选择与 Credit 管理

Pro 用户可在 Cascade 面板底部切换模型：

```bash
# 日常写代码 → 默认模型，速度快省 credit
# 复杂架构 → Claude Sonnet，推理强
# 快速原型 → GPT-4o，响应最快
```

省 credit 四招：大任务先 Chat 讨论再 Code 执行；拆分任务粒度分步走；小修改用 Inline Edit（`Ctrl+I`）；能 Tab 补全解决的别开 Cascade。
