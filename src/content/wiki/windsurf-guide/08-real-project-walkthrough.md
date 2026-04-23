---
title: "全栈项目实战：从 Prompt 到部署"
wiki: "windsurf-guide"
order: 8
description: "用 Windsurf 从零搭建一个 Next.js + Supabase 的全栈应用，覆盖真实开发流程"
---

## 目标：做一个团队任务看板

用 Windsurf 从空文件夹开始，搭一个带用户认证的 Kanban 看板应用。技术栈：Next.js 15 + Supabase + Tailwind CSS。整个过程大约 30 分钟。

![Windsurf 全栈项目实战](https://img.youtube.com/vi/Hz9aT3fyPTM/maxresdefault.jpg)

## 第一步：项目初始化

打开一个空文件夹，在 Cascade Code 模式下输入：

```
创建一个 Next.js 15 项目，用 App Router + TypeScript + Tailwind CSS 4。
项目名 kanban-app。初始化完成后跑一下 dev server 确认能启动。
```

Cascade 会执行：

```bash
npx create-next-app@latest kanban-app \
  --typescript --tailwind --app --use-npm
cd kanban-app
npm run dev
```

等 Cascade 确认 `localhost:3000` 能访问后，用 Web Preview 在 IDE 里打开看一眼。

## 第二步：配置 .windsurfrules

在项目根目录创建规则文件，让后续所有 Cascade 生成的代码风格一致：

```markdown
# .windsurfrules

## 技术栈
- Next.js 15 App Router
- Supabase（auth + database + realtime）
- Tailwind CSS 4
- TypeScript strict mode

## 代码规范
- Server Component 优先，只在需要交互时用 "use client"
- 数据请求用 Server Action，不用 API Route
- 表单验证用 Zod
- 组件文件和类型定义放同一个文件

## 文件结构
- app/(auth)/ — 登录注册页面
- app/(dashboard)/ — 看板主界面
- lib/ — Supabase client、工具函数
- components/ — 可复用 UI 组件
```

## 第三步：接入 Supabase

```
接入 Supabase：
1. 安装 @supabase/supabase-js 和 @supabase/ssr
2. 创建 lib/supabase/client.ts（浏览器端）和 lib/supabase/server.ts（服务端）
3. .env.local 里加 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY
4. 创建 middleware.ts 处理 session 刷新
```

Cascade 生成的 server client 长这样：

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

## 第四步：数据库建表

跟 Cascade 说业务需求，让它生成 SQL：

```
在 Supabase 里建这些表：
- boards（看板）：id, title, owner_id, created_at
- columns（列）：id, board_id, title, position
- tasks（任务卡片）：id, column_id, title, description, assignee_id, position, created_at
加上 RLS 策略：用户只能看自己参与的 board。
```

Cascade 生成的 migration SQL：

```sql
-- supabase/migrations/001_init.sql
create table boards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  owner_id uuid references auth.users(id) not null,
  created_at timestamptz default now()
);

create table columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references boards(id) on delete cascade not null,
  title text not null,
  position int not null default 0
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  column_id uuid references columns(id) on delete cascade not null,
  title text not null,
  description text,
  assignee_id uuid references auth.users(id),
  position int not null default 0,
  created_at timestamptz default now()
);

alter table boards enable row level security;
alter table columns enable row level security;
alter table tasks enable row level security;

create policy "board_owner" on boards
  for all using (owner_id = auth.uid());
```

把这段 SQL 粘到 Supabase Dashboard → SQL Editor 里跑一下。

## 第五步：搭 UI 和拖拽功能

```
用 @dnd-kit/core 实现看板的拖拽功能：
- KanbanBoard 组件渲染所有 columns
- TaskCard 组件支持拖拽到不同 column
- 拖拽结束后调 Server Action 更新 task 的 column_id 和 position
- 用 Supabase Realtime 订阅 tasks 表，多人协作实时同步
```

这一步 Cascade 要创建 5-6 个文件，可能需要 2-3 轮迭代。用 Web Preview 实时看效果，拖一下卡片，发现位置计算不对就直接跟 Cascade 说"拖到第二列后位置没更新，检查 onDragEnd 里的 position 计算"。

## 第六步：部署

```bash
# Vercel 部署（最快）
npm i -g vercel
vercel --prod

# 或者直接在 Cascade 里说：
# "帮我部署到 Vercel，配好 Supabase 的环境变量"
# Cascade 会引导你完成 vercel link + 环境变量配置
```

## 复盘：Cascade 省了什么时间

| 步骤 | 手动耗时 | Cascade 耗时 |
|------|---------|-------------|
| 项目初始化 + 配置 | 15 min | 2 min |
| Supabase 接入 | 30 min | 5 min |
| 数据库 schema + RLS | 20 min | 3 min |
| UI 组件 + 拖拽 | 2-3 hours | 15 min |
| 调试修 bug | 30 min | 5 min |

总计从 4 小时缩到 30 分钟。省下来的时间花在产品逻辑思考和用户体验打磨上。
