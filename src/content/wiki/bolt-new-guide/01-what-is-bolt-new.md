---
title: "Bolt.new 是什么：浏览器里的全栈开发工厂"
wiki: "bolt-new-guide"
order: 1
description: "理解 Bolt.new 的核心技术 WebContainers，以及它和 Lovable、v0.dev、Cursor 的区别"
---

Bolt.new 是 StackBlitz 做的一个 AI 全栈开发平台——你在浏览器里用自然语言描述想要的应用，它直接生成代码、装依赖、跑起来、给你看预览，全程不用装任何东西。

![Bolt.new 平台界面](https://github.com/stackblitz/bolt.new/raw/main/public/social_preview_index.jpg)

## 为什么值得关注

2024 年 10 月上线，6 个月做到 $40M ARR（年收入），300 万注册用户。通过 Bolt + Netlify 部署了超过 100 万个网站。这个增长速度在开发工具领域几乎没有先例。

核心卖点是 **WebContainers**——StackBlitz 自研的技术，能在浏览器里跑完整的 Node.js 环境。竞品（Lovable、Replit）把代码发到远程服务器执行，Bolt.new 全部在你本地浏览器里跑，零网络延迟。

```
传统开发：装 Node.js → 创建项目 → npm install → 写代码 → 调试 → 部署
Bolt.new：打开浏览器 → 描述你要什么 → 30 秒后看到成品 → 一键部署
```

WebContainers 的技术细节：用 SharedArrayBuffer 做文件系统（比 IndexedDB 快得多），Rust 编译成 WebAssembly 以接近原生的速度运行，热门 npm 包预缓存在 CDN 上所以 `npm install` 通常不到 500ms。

## 支持什么技术栈

| 类型 | 支持 |
|------|------|
| 前端框架 | React, Vue, Svelte, Angular, Next.js, Nuxt.js, Astro |
| 后端 | Express, Fastify 等 Node.js 框架 |
| 数据库 | Supabase, Firebase |
| 移动端 | Expo / React Native |
| CSS | Tailwind CSS, SCSS |
| 组件库 | shadcn/ui 等 |

注意：只支持 JavaScript/TypeScript 生态。Python、Go、C# 这些跑不了。

## 和同类工具的关键区别

| 维度 | Bolt.new | Lovable | v0.dev | Cursor |
|------|----------|---------|--------|--------|
| 运行环境 | 浏览器 WebContainers | 远程服务器 | 远程渲染 | 本地 IDE |
| 生成范围 | 全栈应用 | 全栈应用 | 仅 UI 组件 | 代码片段 |
| 框架支持 | 多框架 | 主要 React | 仅 React | 任意 |
| 数据库 | Supabase/Firebase | Supabase（原生） | 无 | 无 |
| 上手门槛 | 零设置 | 零设置 | 零设置 | 需本地安装 |
| 适合谁 | 开发者/技术创始人 | 非技术用户 | 前端开发者 | 有代码库的团队 |

我的看法：Bolt.new 最适合有一定技术背景、想快速出原型的人。如果你完全不懂代码，Lovable 的引导式体验更友好；只要 UI 组件就用 v0.dev；在已有项目上开发用 Cursor。

有第三方测试数据：同一个项目，Bolt.new 28 分钟出可用原型，Lovable 35 分钟，Replit 45 分钟，Windsurf 65 分钟。

## AI 模型

Bolt.new 目前只用 Anthropic Claude 系列：

- **Haiku 4.5**：最快最省 Token，适合简单改动
- **Sonnet 4.6**：默认推荐，性价比最高
- **Opus 4.6**：最强推理能力，适合复杂架构决策

可以在编辑器里随时切换模型，不同任务用不同模型是省 Token 的好习惯。
