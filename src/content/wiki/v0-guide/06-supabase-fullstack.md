---
title: "v0 + Supabase 全栈实战"
wiki: "v0-guide"
order: 6
description: "用 v0 一键接入 Supabase，从数据库建表到用户认证、实时订阅，30 分钟搭出带后端的完整应用"
---

## 为什么选 Supabase

v0 通过 Vercel Marketplace 支持三个数据库，Supabase 是功能最全的——Postgres 数据库 + Auth 认证 + Realtime 订阅 + Storage 文件存储，一个服务全包。免费额度够跑 MVP。

![v0 Marketplace 数据库集成](https://vercel.com/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1%2Ffront%2Fchangelog%2Fv0-marketplace-integrations.png&w=1920&q=75)

## 一键接入

在 v0 聊天侧边栏点 Connect → Supabase → Create。第一次用会跳到 Vercel Marketplace 授权，同意后自动：

1. 创建 Supabase 项目（选离你最近的 region）
2. 把 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 注入 v0 环境变量
3. v0 后续生成代码时自动使用这些变量

不需要手动复制粘贴任何 key。

## 建表 + CRUD

跟 v0 说"创建一个任务管理应用，用 Supabase 存数据"，它会自动生成建表 SQL 和完整的 CRUD 逻辑：

```sql
-- v0 自动生成的 Supabase SQL（在 Supabase Dashboard → SQL Editor 执行）
create table tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  completed boolean default false,
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- 开启 Row Level Security
alter table tasks enable row level security;

-- 只允许用户访问自己的数据
create policy "Users can CRUD own tasks"
  on tasks for all
  using (auth.uid() = user_id);
```

v0 生成的前端代码会直接对接这张表：

```typescript
// lib/supabase.ts — v0 自动生成
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 查询任务列表
const { data: tasks } = await supabase
  .from('tasks')
  .select('*')
  .order('created_at', { ascending: false })

// 新增任务
await supabase.from('tasks').insert({ title: '写周报', user_id: session.user.id })

// 标记完成
await supabase.from('tasks').update({ completed: true }).eq('id', taskId)
```

## 加用户认证

跟 v0 说"加上邮箱登录和 Google 登录"，它生成完整的认证流程：

```typescript
// app/login/page.tsx 核心逻辑
import { supabase } from '@/lib/supabase'

// 邮箱注册
await supabase.auth.signUp({ email, password })

// 邮箱登录
await supabase.auth.signInWithPassword({ email, password })

// Google OAuth
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${window.location.origin}/auth/callback` }
})

// 登出
await supabase.auth.signOut()
```

Google OAuth 需要在 Supabase Dashboard → Authentication → Providers 里配置 Client ID 和 Secret（从 Google Cloud Console 获取）。

## 实时订阅

Supabase Realtime 让多个用户同时看到数据变化，适合协作类应用：

```typescript
// 监听 tasks 表的实时变更
supabase
  .channel('tasks')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' },
    (payload) => {
      if (payload.eventType === 'INSERT') setTasks(prev => [payload.new, ...prev])
      if (payload.eventType === 'UPDATE') {
        setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new : t))
      }
    }
  )
  .subscribe()
```

实际用下来，v0 + Supabase 能在 30 分钟内搭出一个带认证、数据库、实时同步的完整应用——以前这套至少要两天。
