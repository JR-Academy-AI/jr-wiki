---
title: "v0 是什么：Vercel 出品的 AI 全栈构建器"
wiki: "v0-guide"
order: 1
description: "v0 的定位、技术栈、发展历程，以及跟 Lovable、Bolt.new、Cursor 的对比"
---

## 一句话说清楚

v0（原域名 v0.dev，2026 年 1 月迁移到 v0.app）是 Vercel 做的 AI 应用构建平台。你用中文或英文描述想要什么，它直接生成可运行的 React + Next.js 代码，点一下就部署到线上。

![v0 产品界面](https://v0.dev/og-image.png)

2023 年 10 月上线时只能生成 UI 组件，到 2026 年已经进化成全栈应用构建器——能连数据库、加认证、写 API、一键部署。目前有超过 600 万开发者在用。

## 技术栈

v0 生成的代码固定用这套技术栈，没得选：

```
React + Next.js (App Router)
TypeScript
Tailwind CSS
shadcn/ui (基于 Radix UI 的组件库)
```

这也是它最大的优势和限制——如果你的项目用 Vue 或 Angular，v0 帮不了你。但如果你在 React 生态里，v0 生成的代码质量是同类工具中最高的，拿来直接用不丢人。

shadcn/ui 的作者已经加入 Vercel 团队，所以 v0 对这套组件库的理解比任何竞品都深。生成的组件开箱就有无障碍支持、暗色模式、响应式布局。

## 跟其他工具怎么选

| 维度 | v0 | Lovable | Bolt.new | Cursor |
|------|-----|---------|----------|--------|
| 定位 | 有想法 → 生成应用 | 非技术人员建 MVP | 多框架全栈构建 | 有代码 → AI 辅助编辑 |
| 前端质量 | 最好，生产级 | 好 | 好 | 取决于你自己 |
| 后端能力 | 有限，需接外部服务 | Supabase 集成 | 内置 Node.js | 完整 |
| 框架 | 只有 React/Next.js | React | 多框架 | 任意 |
| 部署 | 一键到 Vercel | 内置托管 | 内置 | 自己搞 |
| 免费额度 | $5/月 | 有限 | 较多 | 无免费 |

我的看法：如果你做 React 项目、追求 UI 质量、不介意绑定 Vercel 生态，v0 是目前最优解。它不是万能的，但在"AI 生成前端代码"这个赛道上，确实没有对手。

## v0 背后的 AI 模型

v0 不是套壳 GPT-4 或 Claude。它用的是自己训练的复合模型系列：

- **v0-1.5-md**：基于 Claude Sonnet，128K 上下文，日常够用
- **v0-1.5-lg**：512K 上下文，处理复杂多步任务更强，但偶尔出错率稍高

加上专门优化的 RAG 检索、Quick Edit 管线和自动修复模型，整体效果比直接用基础模型好不少。

## 生成的项目结构

v0 生成的代码遵循标准 Next.js App Router 目录结构，拉到本地后跟手写项目没有区别：

```
my-v0-project/
├── app/
│   ├── layout.tsx          # 根布局，全局样式和字体
│   ├── page.tsx            # 首页
│   └── api/
│       └── route.ts        # API 路由（如果有后端逻辑）
├── components/
│   ├── ui/                 # shadcn/ui 基础组件（Button, Card, Dialog...）
│   └── custom-widget.tsx   # 业务组件
├── lib/
│   └── utils.ts            # cn() 等工具函数
├── public/                 # 静态资源
├── tailwind.config.ts
├── next.config.mjs
└── package.json
```

通过 Git 集成把代码拉到本地后，标准的 Next.js 命令直接可用：

```bash
npm install          # 安装依赖
npm run dev          # 本地启动 http://localhost:3000
npm run build        # 生产构建
npm run lint         # ESLint 检查
```

## v0 CLI 快速入门

除了浏览器里用，v0 还提供 CLI 工具，可以在终端里直接跑：

```bash
# 安装
npm i -g @vercel/v0

# 用 Prompt 生成新项目
v0 generate "一个带暗色模式的 Todo 应用"

# 把 v0 生成的组件拉到现有 Next.js 项目
npx v0 add https://v0.app/chat/xxx
```

CLI 适合已经有本地项目的开发者——在浏览器里调好 UI，一条命令同步到本地 codebase。
