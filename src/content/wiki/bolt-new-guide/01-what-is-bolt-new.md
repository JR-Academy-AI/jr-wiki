---
title: "Bolt.new 是什么：浏览器里跑 Node.js 的 AI 全栈构建器"
wiki: "bolt-new-guide"
order: 1
description: "理解 Bolt.new 的核心定位、WebContainers 技术原理，以及与 Lovable、Cursor、v0、Replit 的全面对比"
---

Bolt.new 是 StackBlitz 推出的 AI 全栈应用构建平台——你在浏览器里输入一句话描述需求，它就能生成一个完整的 Web 应用，带前端界面、后端逻辑和数据库，全程不需要在本地装任何开发环境。

![Bolt.new AI app builder](https://raw.githubusercontent.com/stackblitz/bolt.new/main/public/social_preview_index.jpg)

## 为什么 Bolt.new 这么火

2024 年底上线后，Bolt.new 两个月内年化收入就突破了 800 万美元。到 2025 年 10 月推出 V2 大版本，用户量更是爆发式增长。

火的原因很直接：**零配置**。不需要装 Node.js，不需要配 VS Code，不需要搞 npm/yarn，打开浏览器就能干活。对于想快速验证想法的人来说，省掉的环境配置时间就是真金白银。

## 底层黑科技：WebContainers

Bolt.new 之所以能在浏览器里运行 Node.js，靠的是 StackBlitz 自研的 **WebContainers** 技术。简单说就是：把整个 Node.js 运行时搬进了浏览器沙箱里。

在 Bolt.new 里你可以直接跑终端命令：

```bash
# 这些命令都在浏览器里执行，不是你的本地电脑
npm install axios
npm run dev
npm run build
```

这意味着 `npm install`、`dev server`、`build` 全部在浏览器标签页里完成。关掉标签页再打开，项目还在。

## AI 模型选择

Bolt.new 支持多个 AI 模型，你可以根据场景切换：

| 模型 | 特点 | 适合场景 |
|------|------|---------|
| **Claude Sonnet 4.6** | 默认推荐，速度和质量平衡最好 | 日常开发，绝大部分场景 |
| **Claude Haiku** | 快且省 token | 简单修改、快速迭代 |
| **Claude Opus** | 最强推理能力 | 复杂架构设计、疑难 bug |
| **GPT-4o** | OpenAI 模型 | 想换个"口味"试试 |

我个人建议：默认用 Sonnet 4.6，遇到它搞不定的复杂问题再切 Opus。Haiku 适合改个颜色、调个文案这种小活。

## 支持的技术栈

Bolt.new 不像某些平台只绑定一个框架，它支持的技术栈相当灵活：

- **前端框架**：React、Next.js、Vue、Svelte、SvelteKit、Astro
- **构建工具**：Vite（默认）
- **样式方案**：Tailwind CSS、shadcn/ui
- **数据库**：Supabase（原生集成）、Firebase
- **部署**：Netlify（一键）、Bolt 自带托管、手动下载部署到任何平台

## 和竞品怎么选

| 维度 | Bolt.new | Lovable | Cursor | v0.dev | Replit |
|------|---------|---------|--------|--------|--------|
| **定位** | AI 全栈构建器 | AI 应用构建器 | AI 代码编辑器 | UI 组件生成 | 云端 IDE + AI |
| **框架自由度** | 高（6+ 框架） | 低（只有 React） | 高（任意） | 低（React） | 高（任意语言） |
| **需要会写代码吗** | 不需要 | 不需要 | 需要 | 需要 | 看情况 |
| **数据库** | Supabase 原生 | Supabase 原生 | 无 | 无 | 有 |
| **价格（入门付费）** | $25/月 | $39/月 | $20/月 | $20/月 | $25/月 |
| **代码质量** | 中等 | 中上 | 高 | 中上 | 中等 |

**我的选择建议**：

- 想用 Vue/Svelte/Astro 等非 React 框架 → **Bolt.new**（Lovable 只支持 React）
- 零代码背景、只想要最干净的 UI → **Lovable**
- 已经有代码库、想 AI 辅助开发 → **Cursor**
- 只需要生成 UI 组件 → **v0.dev**

## 谁适合用 Bolt.new

**很适合**：
- 想在几小时内做出 MVP 原型的创业者
- 会一点前端但不想从零配环境的开发者
- 想用 Vue/Svelte 而不是被锁定在 React 的人
- 设计师想快速把 Figma 稿变成可交互原型

**不太适合**：
- 需要企业级代码规范和架构的大型项目
- 对代码质量有洁癖的人（AI 生成的代码有时候确实糙）
- 需要复杂支付/后端逻辑的生产环境系统
