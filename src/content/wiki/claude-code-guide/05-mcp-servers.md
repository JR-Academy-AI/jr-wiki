---
title: "MCP 服务器：给 Claude Code 装上超能力插件"
wiki: "claude-code-guide"
order: 5
description: "用 Model Context Protocol 把数据库、GitHub、Slack、浏览器等外部工具接入 Claude Code，让 AI 直接操作你的真实系统"
---

## MCP 是什么

![MCP 架构概览](https://mintcdn.com/claude-code/-tYw1BD_DEqfyyOZ/images/hook-resolution.svg?fit=max&auto=format&n=-tYw1BD_DEqfyyOZ&q=85&s=c73ebc1eeda2037570427d7af1e0a891)

Model Context Protocol（MCP）是 Anthropic 在 2024 年 11 月发布的开源标准，让 AI 能连接外部工具和数据源。

没有 MCP 之前：Claude Code 只能操作本地文件和运行终端命令。  
有了 MCP 之后：Claude Code 能直接查数据库、操作 GitHub、搜索 Slack、控制浏览器。

```
Claude Code ←→ MCP Server ←→ 外部系统
                               (GitHub / PostgreSQL / Slack / 浏览器 / ...)
```

## 添加第一个 MCP 服务器

以官方的文件系统 MCP 为例（允许 Claude 访问指定目录）：

```bash
claude mcp add filesystem npx @modelcontextprotocol/server-filesystem /Users/yourname/projects
```

或者手动编辑配置文件 `.claude/mcp.json`：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-filesystem",
        "/Users/yourname/projects"
      ]
    }
  }
}
```

启动 Claude Code 后直接说：
```
> 帮我看看 /Users/yourname/projects 下有哪些 package.json
```

## 高价值 MCP 服务器推荐

### GitHub MCP — 直接操作仓库

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxx"
      }
    }
  }
}
```

接入后可以说：
```
> 帮我看一下 anthropics/claude-code 最近 5 个 issue，有没有和 hooks 相关的
> 给 #123 issue 加个评论，说我在本地复现了这个 bug
> 帮我创建一个 PR，从 feature/xxx 到 main
```

### PostgreSQL MCP — 自然语言查数据库

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-postgres",
               "postgresql://localhost/mydb"]
    }
  }
}
```

```
> 帮我查一下过去 7 天注册的用户数，按天分组
> users 表里有没有重复的 email？
```

Claude Code 自动生成 SQL、执行、解释结果，不用你写一行查询。

### Playwright MCP — 控制浏览器

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

```
> 打开我们的测试环境 http://localhost:3000，登录后截图看看首页是否正常
> 帮我测试一下注册流程，看看有没有报错
```

适合自动化 E2E 测试和 UI 调试。

## 项目级 vs 全局配置

| 配置文件 | 作用范围 | 适合场景 |
|---------|---------|---------|
| `.claude/mcp.json` | 当前项目 | 项目专用工具（特定 DB、内部 API） |
| `~/.claude/mcp.json` | 全局所有项目 | 常用工具（GitHub、Slack） |

项目级配置可以提交到 git，让团队成员共享相同的工具集。

## 实战：连接内部 API

很多公司有自己的内部 API（查员工信息、调度系统等）。用 MCP 可以快速接入：

```typescript
// 用 MCP SDK 写一个简单的内部 API server
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({ name: "internal-api", version: "1.0.0" });

server.tool("get_employee", { id: { type: "string" } }, async ({ id }) => {
  const res = await fetch(`https://hr.internal/api/employees/${id}`);
  const data = await res.json();
  return { content: [{ type: "text", text: JSON.stringify(data) }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

配置：
```json
{
  "mcpServers": {
    "internal-api": {
      "command": "node",
      "args": ["./mcp-servers/internal-api.js"]
    }
  }
}
```

现在 Claude Code 可以直接说：
```
> 帮我查一下员工 ID 为 E12345 的人的信息
```

## 常见坑

**坑 1：MCP 服务器启动失败，但 Claude Code 没有明显报错**  
检查方法：运行 `claude mcp list` 看服务器状态，或单独运行服务器命令看报错：
```bash
npx @modelcontextprotocol/server-github
```

**坑 2：工具太多导致上下文膨胀**  
MCP 工具定义会占用 context window。Claude Code 采用"延迟加载"——只有 Claude 决定用某个工具时才加载其完整定义，所以多装几个 MCP 服务器影响不大。

**坑 3：数据库 MCP 返回了敏感数据**  
用只读账号连接，或在 MCP server 层做权限过滤，不要把生产数据库的写权限给 Claude。

## 查找更多 MCP 服务器

社区已经有数千个 MCP 服务器：
- [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) — 官方维护的参考实现
- [mcp.so](https://mcp.so) — 社区 MCP 索引
- 搜索 `npm search mcp-server-xxx`

主流平台基本都有现成的 MCP server：AWS、Slack、Notion、Linear、Jira、Figma……装上就能用，不需要自己写。
