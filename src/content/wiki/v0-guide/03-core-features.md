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

v0 支持 Model Context Protocol，可连接 Stripe、Supabase 等外部服务。连接后 v0 生成代码时自动考虑已接入的服务，省去手动配置。
