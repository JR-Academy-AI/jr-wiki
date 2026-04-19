---
title: "Bolt.new 核心功能详解：从 prompt 到生产级全栈应用"
wiki: "bolt-new-guide"
order: 3
description: "深入掌握 Bolt.new 六大核心功能：多框架支持、Supabase 数据库集成、用户认证、Plan Mode、Inspector 和一键部署"
---

Bolt.new 不只是一个"帮你生成前端页面"的玩具，它能搞定从数据库到部署的整条链路。搞懂这些核心功能，才能真正把它用起来。

![Bolt.new V2 features](https://cdn.prod.website-files.com/64b6f3636f598299028c7405/6711a29bc68a7af061cf0d81_OG.png)

## 多框架支持

很多 AI 构建平台只支持 React，Bolt.new 给了你选择权。在 prompt 里指定框架就行：

```
用 Vue 3 + Vite + Tailwind CSS 创建一个项目管理看板
```

```
用 SvelteKit + Tailwind 创建一个博客系统，支持 Markdown 渲染
```

```
用 Astro + React 创建一个企业官网，支持 SEO 优化
```

支持的框架清单：React、Next.js、Vue 3、Svelte、SvelteKit、Astro、Vite（纯 JS/TS）。

**哪个框架怎么选？** 如果你没有特别偏好，React + Vite 是最稳的选择——Bolt.new 在这个组合上的训练数据最多，生成质量最高。想要 SSR/SEO 选 Next.js 或 Astro，喜欢轻量级选 Svelte。

## Supabase 数据库集成

这是 Bolt.new 的杀手级功能。Supabase 是一个开源的 Firebase 替代品，提供 PostgreSQL 数据库 + 用户认证 + 文件存储 + Edge Functions。

2025 年 10 月 Bolt V2 发布后，新项目默认使用 **Bolt Cloud** 数据库（底层就是 Supabase），配置步骤被简化到几乎为零。

### 连接方式一：用 Bolt Cloud（推荐新手）

直接在 prompt 里说要数据库，Bolt 会自动创建：

```
创建一个待办事项应用，数据存数据库（不要 localStorage）。
支持用户注册登录，每个用户只能看到自己的待办。
```

Bolt 自动帮你搞定建表、写 SQL migration、配 API 调用。

### 连接方式二：用已有的 Supabase 项目

如果你已经有 Supabase 账号：

1. 在 [supabase.com](https://supabase.com) 创建项目，拿到 **Project URL** 和 **anon key**
2. 在 Bolt.new 项目设置里填入连接信息
3. 开始用

连接之后，在对话里描述你的数据结构，Bolt 会自动生成对应代码：

```typescript
// Bolt 生成的数据库操作代码示例
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// 查询当前用户的所有待办
const { data: todos, error } = await supabase
  .from('todos')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })

// 新增待办
const { error } = await supabase
  .from('todos')
  .insert({ title: '写周报', user_id: user.id })
```

## 用户认证

有了 Supabase，加用户注册登录变得很简单：

```
给应用加上用户认证功能：
- 支持邮箱 + 密码注册/登录
- 支持 Google 第三方登录
- 登录后跳转到 Dashboard
- 未登录访问 Dashboard 自动跳转到登录页
- 顶部导航栏显示用户邮箱和退出按钮
```

Bolt 会自动生成 Supabase Auth 的集成代码，包括路由守卫、session 管理和 OAuth 配置。

## Plan Mode（V2 新功能）

这是 Bolt V2 最实用的新功能之一。开启 Plan Mode 后，AI 不会直接开始写代码，而是先列出一个执行计划：

- 要创建/修改哪些文件
- 要安装哪些依赖
- 实现思路是什么

你看完计划觉得没问题再让它动手。这样做的好处是：**在 AI 烧 token 之前就能发现方向错误**。

实际操作中，对于简单改动可以跳过 Plan Mode 直接干；对于涉及架构调整的大改动，建议打开 Plan Mode 先看看 AI 的思路。

## Inspector 模式

Inspector 是 Bolt.new 给非技术用户的一个好东西。在预览区域里：

1. 点击任何一个元素（按钮、文字、图片、卡片）
2. 弹出一个编辑面板
3. 直接调整文字内容、间距、颜色、字体大小

不用写 prompt、不用懂 CSS，像用 Figma 一样点击修改。改完的结果会自动同步到代码里。

## 部署选项

Bolt.new 支持三种部署方式：

| 方式 | 操作 | 适合场景 |
|------|------|---------|
| **Netlify（推荐）** | 项目设置 → Domains & Hosting → Netlify → Publish | 正式上线、自定义域名 |
| **Bolt 托管** | 点击 Deploy 按钮 | 快速分享、演示 |
| **手动下载** | 下载代码 → 部署到任何平台 | 需要完全控制部署流程 |

Netlify 部署支持 **锁定部署**（Lock Deploy）功能：锁定后，后续的代码更改不会影响线上版本，你可以继续开发而不担心搞砸生产环境。

```bash
# 如果你下载代码后想手动部署到 Vercel
npm run build
# 把 dist/ 目录上传到 Vercel / Cloudflare Pages / GitHub Pages
npx vercel --prod
```
