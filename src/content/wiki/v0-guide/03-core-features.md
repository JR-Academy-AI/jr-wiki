---
title: "核心功能详解"
wiki: "v0-guide"
order: 3
description: "Design Mode、Git 工作流、数据库连接、Figma 导入——v0 的核心功能逐个拆解"
---

## Design Mode：免费的可视化编辑

v0 最被低估的功能。切换到 Design Mode 后，你可以直接点击页面上的任何元素，修改：

- 颜色（背景、文字、边框）
- 字体大小和字重
- 间距（padding、margin）
- 文本内容
- 布局方式

![v0 Design Mode](https://vercel.com/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1%2Ffront%2Fblog%2Fdesign-mode.png&w=1920&q=75)

关键点：**Design Mode 的所有操作不消耗 credits**。微调样式全在这里做，把 AI 生成留给结构性改动，每月 $5 额度能多撑好几倍。

## Git 集成：正经的工程化工作流

2026 年 2 月加的 Git 面板让 v0 从玩具变成了正经工具：

```bash
# v0 在幕后做的事情：
git checkout -b v0/feature-dashboard   # 每个聊天自动创建分支
git commit -m "Add KPI cards"          # 每条消息自动 commit
# 永远不会直接推到 main
```

工作流：

1. 每个聊天会话自动创建独立分支
2. 每条消息生成的改动自动 commit
3. 通过 Git 面板查看 diff
4. 直接在 v0 里对 main 开 Pull Request
5. 合并后自动触发 Vercel 部署

也可以反向操作：把你的 GitHub 仓库导入 v0，在 AI 界面里改代码，改完提 PR。

## 数据库连接

v0 通过 Vercel Marketplace 支持三个数据库：

| 数据库 | 类型 | 适合场景 |
|--------|------|---------|
| Neon | Serverless PostgreSQL | 需要 SQL 的常规应用 |
| Supabase | PostgreSQL + Auth + 实时订阅 | 需要认证和实时功能 |
| Upstash | Redis 兼容 KV 存储 | 缓存、限流、会话管理 |

跟 v0 说"帮我加一个数据库"，它引导你从 Marketplace 选择并一键配置，自动生成 schema、API 路由和 CRUD 操作。比如加用户认证，v0 会生成：

```typescript
// app/api/auth/route.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const { email, password } = await request.json()
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ user: data.user })
}
```

## Figma 导入

两种方式：截图导入（分析布局颜色生成代码）和 Figma 链接导入（Premium 及以上，提取设计 token，保真度更高）。

建议把设计拆成小组件逐个生成再组合，别一次丢整个页面。

## MCP 集成

v0 支持 Model Context Protocol，可连接 Stripe、Supabase 等外部服务。在聊天侧边栏点 MCP → 选择服务 → 授权，完成后 v0 生成代码时自动考虑已接入的服务。

目前支持的 MCP 服务：

| 服务 | 能力 |
|------|------|
| Supabase | 读取表结构，生成对应 CRUD |
| Stripe | 生成支付集成代码，读取产品/价格 |
| Neon | PostgreSQL 连接和查询 |
| Upstash | Redis 缓存和限流 |

连接 MCP 后 v0 的上下文更丰富——它知道你的数据库有哪些表、Stripe 有哪些产品，生成的代码直接对接真实数据，不再是 placeholder。

## Open in IDE

v0 生成的代码可以一键在本地 IDE 里打开：

1. **Open in Cursor**：点右上角 Open in Cursor 按钮，自动克隆仓库并打开
2. **Git Clone**：通过 Git 面板复制仓库地址

```bash
# 通过 Git 面板获取仓库地址后
git clone https://github.com/你的用户名/v0-项目名.git
cd v0-项目名
npm install && npm run dev
# 在 http://localhost:3000 预览
```

在 IDE 里改完代码推回 GitHub，v0 会自动同步最新代码。反过来也一样——在 v0 里改了，本地 `git pull` 就能拿到。

## Quick Edit

不需要 AI 介入的小修改，直接在 Code 编辑器里手动改：切换到 Code 标签，找到文件，直接编辑，保存后 Preview 实时刷新。这些改动也会记入版本历史。

Quick Edit 适合改文案、调常量、修 import 路径这种不需要 AI 动脑的操作，而且不消耗 credits。
