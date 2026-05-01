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

Design Mode 底层是直接操作 Tailwind class，改完后点「Apply」，右侧 diff 面板会显示对应的 className 变化。这意味着你看到的不是魔法——每一次点选都对应着真实的代码改动，合并到项目里不会有任何 "魔法属性" 残留。

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

实战技巧：给 v0 的每个聊天起有意义的名字（比如"dashboard-kpi-cards"），这样 Git 分支名会带上这个名字，review 时一眼知道这个 PR 做了什么。

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

---

## Generative UI 实战：从零生成 Analytics Dashboard

这是 v0 最有说服力的使用场景。把下面这个流程走一遍，你会理解"generative UI"不是噱头。

### 目标

生成一个 Analytics Dashboard，包含：
- 顶部 4 个 KPI 卡片（访客数、转化率、营收、活跃用户）
- 折线图（过去 30 天趋势）
- 数据表格（Top 10 页面）
- 侧边导航

### 第一轮提示词

```
Create an analytics dashboard with:
- 4 KPI cards: Visitors (124,500), Conversion rate (3.2%), Revenue ($48,200), Active users (8,940)
- A line chart showing 30-day visitor trend
- A table showing top 10 pages by pageviews
- Left sidebar navigation with: Dashboard, Analytics, Reports, Settings

Use shadcn/ui components. Dark header, white content area.
```

v0 会一次性生成完整的组件树，用到的 shadcn 组件包括：`Card`、`CardHeader`、`CardContent`、`Table`、`TableRow`、`TableCell`、图表部分用 Recharts。

### 第二轮：拆分数据层

v0 的第一版通常把数据硬编码在组件里。第二步要把数据抽出来：

```
Refactor the KPI cards to accept a `metrics` prop. 
Extract the table data into a `pageData` array. 
Make the chart accept a `chartData` prop instead of hardcoded values.
```

重构后的接口变成：

```typescript
interface MetricsCardProps {
  title: string
  value: string | number
  change: number      // 环比变化百分比
  trend: 'up' | 'down'
}

interface PageTableRow {
  page: string
  views: number
  bounce: number
  avgTime: string
}
```

### 第三轮：接真实 API

```
Add a useEffect to fetch KPI data from /api/analytics/metrics 
and page data from /api/analytics/pages. 
Show skeleton loaders while fetching.
```

v0 会加上 Suspense/skeleton 状态，用 shadcn 的 `Skeleton` 组件占位，让加载体验不再是白屏。

生成的 fetch 逻辑大概是：

```typescript
// components/dashboard/kpi-cards.tsx
'use client'

import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

export function KpiCards() {
  const [metrics, setMetrics] = useState<MetricsCardProps[] | null>(null)

  useEffect(() => {
    fetch('/api/analytics/metrics')
      .then(r => r.json())
      .then(setMetrics)
  }, [])

  if (!metrics) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-4 w-24" /></CardHeader>
            <CardContent><Skeleton className="h-8 w-32" /></CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      {metrics.map(m => <MetricsCard key={m.title} {...m} />)}
    </div>
  )
}
```

### 整个流程的时间消耗

| 步骤 | 传统开发 | 用 v0 |
|------|---------|-------|
| 搭组件结构 | 3-4 小时 | 5 分钟（1 条提示） |
| 拆 props / 抽数据层 | 1-2 小时 | 3 分钟（1 条提示） |
| 加 loading 状态 | 30 分钟 | 2 分钟 |
| 接真实 API | 手动，因人而异 | 手动（v0 给骨架，逻辑自己填） |

Dashboard 这种组件重、样式繁的场景，v0 节省的时间集中在结构搭建和样式对齐，逻辑层仍需人工处理。

---

## shadcn/ui 集成细节

v0 天然以 shadcn/ui 作为组件库，理解它们的关系能避免很多重复工作。

### shadcn/ui 不是 npm 包

这是最常见的误解。shadcn/ui 不像 MUI 或 Ant Design，你不会在 `package.json` 里看到 `"shadcn-ui": "^x.x.x"`。它的模式是：**复制组件源码到你的项目**。

```bash
# 安装 shadcn CLI（2026 年 3 月 CLI v4 发布）
npx shadcn-ui@latest init

# 添加单个组件 —— 实际上是把源码复制进你的项目
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card table skeleton

# 组件会出现在 components/ui/ 目录下
# 你可以直接改它们，没有任何限制
```

组件文件结构：

```
components/
  ui/
    button.tsx      # 你可以随意修改这个文件
    card.tsx
    table.tsx
    skeleton.tsx
```

### v0 生成的代码 + 本地 shadcn 组件对齐

v0 生成代码时默认使用 shadcn/ui 组件，但如果你已有本地的 `components/ui/`，需要确保版本一致。

最干净的做法：

1. 在 v0 完成生成后，从预览界面点 **「Copy CLI command」**，它会给你一行 `npx v0 add [component-id]` 命令
2. 在本地项目根目录运行这条命令，v0 会把组件以 shadcn/ui 格式写入 `components/ui/`
3. 如果组件已存在，CLI 会询问是否覆盖

```bash
# v0 生成的 CLI 命令示例
npx v0 add OPIIyrhYORH

# 等价于把 v0 里的 dashboard 组件
# 以 shadcn 格式写入你的项目
```

### 自定义 Design System

2026 年 v0 支持上传你的 `tailwind.config.ts` 和 `globals.css`，让 v0 生成的组件直接匹配你的品牌色系。

配置入口：v0 左侧 **Settings → Design System**

上传后，v0 生成的所有代码会用你定义的 CSS 变量替代默认值：

```css
/* 你的 globals.css */
:root {
  --primary: 220 90% 56%;        /* 你的品牌蓝 */
  --primary-foreground: 0 0% 100%;
  --radius: 0.375rem;            /* 比默认稍小的圆角 */
}
```

v0 生成时会自动用这套变量，而不是 shadcn 默认的 slate 色系。

### Tailwind 版本注意事项

v0 目前生成的代码默认使用 Tailwind v3 语法。如果你的项目已升级到 Tailwind v4（2025 年底发布），需要留意几处差异：

- v4 用 `@import "tailwindcss"` 代替 `@tailwind base/components/utilities`
- v4 的 `theme()` 函数语法有变化
- v0 生成的部分 class 在 v4 下需要小幅调整（主要是 `divide-*` 和 `ring-offset-*`）

遇到这类问题，直接在 v0 里说「我用 Tailwind v4，请更新语法」，它会帮你转换。

### 从 shadcn/ui 官网到 v0

另一个常用路径：在 [ui.shadcn.com](https://ui.shadcn.com) 看到一个现成的 Block 或 Component，点「在 v0 中打开」按钮，直接进入 v0 编辑模式对那个组件做定制改造。

这比从零写提示词快很多——组件的基础结构已经有了，你只需要告诉 v0 要改什么。

---

## 各功能的 credits 消耗对比

实际使用时经常困惑"这个操作要不要消耗 credits"，下面是汇总：

| 操作 | 消耗 credits |
|------|-------------|
| 发一条新的生成请求 | ✅ 是 |
| Design Mode 调整样式 | ❌ 否 |
| 查看历史版本 | ❌ 否 |
| Fork 别人的 v0 项目 | ❌ 否 |
| 在 v0 里运行代码（Preview） | ❌ 否 |
| 重新生成（Regenerate） | ✅ 是 |
| 追加修改（在同一聊天里发新消息） | ✅ 是 |

每月免费额度（Free 计划）大约够跑 20-30 次生成。Premium 计划（$20/月）额度显著更高，且支持更复杂的生成（多文件项目、更长的上下文）。

---

掌握这些核心功能后，下一章讲 v0 的高级使用技巧——包括如何写让 v0 少返工的提示词、如何处理复杂交互逻辑、以及什么场景下 v0 不如手写。
