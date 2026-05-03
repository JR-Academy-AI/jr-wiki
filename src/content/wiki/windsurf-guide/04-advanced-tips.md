---
title: "进阶技巧与实战配置"
wiki: "windsurf-guide"
order: 4
description: "Rules 项目规则、MCP 插件、模型选择、Credit 管理，把 Windsurf 用到极致"
---

## .windsurfrules：让 AI 按你的规矩写代码

Windsurf 最高 ROI 的配置就是 `.windsurfrules` 文件。在项目根目录创建它，Cascade 每次生成代码都会遵守里面的规则。

![Windsurf 高级配置与 MCP 集成](https://img.youtube.com/vi/42MZqcQZE6k/maxresdefault.jpg)

规则文件有两个位置：

- **全局规则** — 存在 `~/global_rules.md`，对所有项目生效，适合个人习惯（如"永远写中文注释"）
- **项目规则** — 存在项目根目录的 `.windsurfrules`，只对当前项目生效，适合团队约定

两者上限各 6000 字符，合计 12000 字符。超了要截断。

几个要点：

- **规则改了之后重启 Windsurf** 才生效，不重启改了等于没改
- 新版 Windsurf 也支持 `.windsurf/rules/rules.md` 格式，两者同时存在时新格式优先
- 规则文件可以 commit 进仓库，团队所有人都共享同一套约束

最常见的失效写法是"写干净的代码"这类空洞指令——AI 看不懂"干净"的边界，照样乱写。有效规则必须是**可执行的约束**，比如"不用 any 类型"、"所有 API 调用用 TanStack Query 封装"。

---

## 前端项目 .windsurfrules 完整范例

以下是一个 Next.js 14+ App Router 项目的真实规则文件。按照类别分块，每块职责清晰：

```markdown
# .windsurfrules — Next.js 前端项目

## 技术栈约定
- Framework: Next.js 15 App Router，不用 Pages Router
- 语言: TypeScript 5.x，strictMode 开启，禁止 any
- 样式: Tailwind CSS 4 + CSS Modules（复杂动画）
- 组件库: shadcn/ui，不要引入其他 UI 库
- 状态: Zustand（全局）+ React Context（局部）
- 数据获取: TanStack Query v5，禁止在 component 里裸写 useEffect + fetch
- 表单: React Hook Form + Zod schema 校验
- 图片: 只用 next/image，不用 <img>

## 文件命名
- React 组件文件: PascalCase（UserCard.tsx）
- 普通 util 文件: kebab-case（format-date.ts）
- 目录名: kebab-case
- 测试文件: *.test.tsx 放在组件同目录

## 组件规范
- 全用函数式组件，禁止 class component
- 用具名导出（export function），不用 default export
- props 类型用 interface 定义，放在组件文件顶部
- 超过 200 行的组件必须拆分

## API 调用规范
- API base URL 从 process.env.NEXT_PUBLIC_API_URL 读取，禁止硬编码
- 所有 HTTP 请求封装在 /lib/api/ 目录，不要在 component 文件里直接调用 fetch
- 错误边界用 React Error Boundary 处理，不要在每个 component 写 try-catch

## 禁止事项
- 禁止 CSS-in-JS（styled-components / emotion）
- 禁止在 Server Component 里使用 useState / useEffect
- 禁止把 API key 写进前端代码
- 禁止用 lodash（用原生 ES2024 代替）
```

这份规则覆盖了新人最容易犯的 10+ 个错误——技术栈选型、命名、组件粒度、API 封装、环境变量管理。Cascade 拿到这份规则后，生成的代码基本可以直接过 code review。

---

## 后端项目 .windsurfrules 完整范例

Python FastAPI 项目的规则风格略有不同，更侧重类型标注和接口设计：

```markdown
# .windsurfrules — FastAPI 后端项目

## 技术栈
- Python 3.12+，强制类型标注
- 框架: FastAPI 0.115+，不用 Flask
- ORM: SQLAlchemy 2.x async，不用同步 session
- 数据校验: Pydantic v2
- DB: PostgreSQL 17，连接池用 asyncpg
- 认证: JWT（jose 库），不用 Session
- 测试: pytest + httpx.AsyncClient

## 项目结构
- app/routers/  — 路由层，只处理 HTTP 逻辑
- app/services/ — 业务逻辑，不直接操作 DB
- app/repositories/ — 数据访问层，唯一直接写 SQL 的地方
- app/schemas/  — Pydantic 输入输出 schema

## 接口规范
- 所有端点必须写 OpenAPI 注释（summary + description）
- 响应 schema 用 response_model 标注
- 错误统一用 HTTPException，不要直接 raise 500
- 路由命名用 kebab-case（/user-profiles，不用 /userProfiles）

## 安全
- 禁止把密钥写进代码或 .env 提交到仓库
- 所有用户输入通过 Pydantic 校验，不做手动 sanitize
- SQL 参数化查询，绝不拼接字符串

## 异步规范
- DB 操作全部 async/await，禁止混用同步 session
- background task 用 FastAPI BackgroundTasks，不要自己起线程
```

这套规则配合 PostgreSQL MCP Server（后面会讲），Cascade 可以读取数据库 schema 后直接生成 CRUD 接口，不需要你手动告诉它表结构。

---

## 规则写法：有效 vs. 无效

写规则的常见坑是指令太模糊，AI 不知道该怎么执行：

| 无效写法 | 有效写法 |
|---------|---------|
| 写干净的代码 | 函数不超过 40 行，超过就拆 |
| 注意安全性 | 所有用户输入必须过 Zod/Pydantic 校验 |
| 合理处理错误 | 用 Result 类型，不用 try-catch 直接 throw |
| 保持代码可读 | 变量名不用缩写（dt → dateTime，usr → user） |
| 用好 TypeScript | 禁止 any，禁止 as 类型断言，禁止 @ts-ignore |

规则文件不是越长越好，超过 4000 字符后规则之间开始互相干扰。实测下来，**50 条清晰的具体规则**比 200 条模糊描述效果好得多。

---

## Cascade Memory：跨会话持久记忆

Rules 是你手动写的约束，Memory 是 Cascade 自动学习并记下来的东西。

每次会话结束后，Cascade 会把它认为"有用的上下文"提取成记忆条目，存在本地文件：

```
~/.codeium/windsurf/memories/
├── {workspace-hash}/
│   ├── memories.json
│   └── ...
```

下次打开同一个工作区，Cascade 会自动加载这些记忆，不需要你重新解释项目背景。

### Cascade 会自动记住什么

- 你纠正过的错误（"你之前用 axios，我们这个项目用 ky"）
- 项目里不在代码里但重要的约定（"部署目标是 AWS Lambda，不是 EC2"）
- 你明确要求记住的信息

### 手动创建记忆

不需要等 Cascade 自动识别，你可以直接告诉它：

```
记住：我们的后端跑在 Kubernetes 上，端口配置在 k8s/config.yaml，不要在代码里硬编码端口号
```

Cascade 收到指令后会创建记忆条目。你也可以在 Cascade 面板里管理已有记忆，看到它记了什么，随时删改。

### 记忆不会跨工作区共享

这是个容易踩的坑：在项目 A 里告诉 Cascade "我们用 pnpm 不用 npm"，切换到项目 B 后 Cascade 不会知道这件事。全局习惯用 `global_rules.md` 写，项目约定用 `.windsurfrules` 写，临时上下文才用 Memory。

### Memory vs. Rules：怎么选

| 特征 | Memory | Rules |
|------|--------|-------|
| 谁写的 | Cascade 自动 / 你口头要求 | 你手动维护 |
| 持久性 | 本地，不提交 git | 文件，可提交 |
| 团队共享 | ❌ 仅本机 | ✅ 提交后团队共享 |
| 适合场景 | 临时上下文、当前任务进展 | 代码规范、技术栈约定 |
| 可控性 | 低（AI 自动总结） | 高（你写什么就是什么） |

结论：**重要的团队约定写进 `.windsurfrules` 提交 git**，不要依赖 Memory。Memory 只用于会话内的临时状态。

---

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

配好 PostgreSQL MCP 后，Cascade 能主动查 schema，你只需要说"给 users 表加一个 email 唯一索引"，它知道当前表长什么样，直接生成正确的 migration。

---

## 模型选择与 Credit 管理

Pro 用户可在 Cascade 面板底部切换模型：

```bash
# 日常写代码 → 默认模型，速度快省 credit
# 复杂架构 → Claude Sonnet，推理强
# 快速原型 → GPT-4o，响应最快
```

省 credit 四招：

1. **大任务先 Chat 讨论再 Code 执行** — Chat 模式消耗的 credit 比 Agent 模式低很多，先想清楚再动手
2. **拆分任务粒度** — 一次做一个小改动，比让 Cascade 自己想"下一步"省很多 token
3. **用 Inline Edit（`Ctrl+I`）** — 只改当前光标位置的代码，不启动完整 Cascade 流程
4. **能 Tab 补全解决的别开 Cascade** — Copilot 级别的自动补全不消耗 Cascade credit

另外，如果你用公司账号有 Team 计划，Credit 是按 seat 分配的。把 `.windsurfrules` 写好，减少 Cascade 来回确认的次数，是最实际的降本手段。

---

## 实战技巧汇总

走完上面的配置，几个高频操作值得单独记：

**快速生成 Rules 文件**：直接跟 Cascade 说"根据这个项目的代码，帮我生成一份 `.windsurfrules`"，它会扫描现有文件总结规律，你再审核调整比从零写快很多。

**调试 Rules 是否生效**：在 Cascade 里问"你对这个项目有哪些规则约束"，如果它能复述你 `.windsurfrules` 的主要内容，说明规则已被加载。

**团队共享记忆**：Memory 本身不能共享，但可以把重要的记忆内容手动转写成 `.windsurfrules` 条目，提交到仓库。或者维护一份 `AGENTS.md`，描述 AI 在这个项目里应该知道的背景信息。

**MCP 连不上的排查**：先在终端手动跑 MCP server 命令确认没有依赖缺失，再检查 Windsurf 的 MCP 配置文件路径是否正确——Mac 上在 `~/.codeium/windsurf/mcp_config.json`，Windows 在 `%APPDATA%\Codeium\windsurf\mcp_config.json`。
