---
title: "团队协作与代码交接"
wiki: "v0-guide"
order: 10
description: "v0 Team 计划的协作功能、从 v0 原型到正式开发的代码交接流程、分支策略"
---

## Team 计划

v0 的 Team 计划（$30/人/月）在 Premium 基础上加了协作功能：

| 功能 | Premium | Team |
|------|---------|------|
| 共享项目 | ❌ | ✅ |
| 共享 Credits 池 | ❌ | ✅ |
| 共享 Instructions | ❌ | ✅ |
| 项目权限管理 | ❌ | ✅ |
| 审计日志 | ❌ | ✅ |

![v0 团队计划](https://vercel.com/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1%2Ffront%2Fblog%2Fv0-plans-for-teams.png&w=1920&q=75)

创建团队：Settings → Teams → Create Team，邀请成员后项目自动共享。

## PM 出原型 → 开发接手

最典型的协作场景。PM 在 v0 里做出可交互原型，满意后通过 Git 面板推到 GitHub：

```bash
# 1. PM 在 v0 Git 面板创建仓库并推送
# 2. 开发者 clone 到本地
git clone https://github.com/team/v0-crm-dashboard.git
cd v0-crm-dashboard

# 3. 安装依赖，本地跑起来
npm install && npm run dev

# 4. 用 Cursor / VS Code 做正式开发
# v0 生成的代码结构干净，可以直接在上面加业务逻辑
```

v0 生成的是标准 Next.js 项目，开发者拿到后跟手写项目没区别，不需要学新框架。

## 多人并行开发

v0 的 Git 集成支持多分支。每个团队成员在自己的聊天会话里工作，自动创建独立分支：

```bash
# 成员 A 的聊天 → 自动创建 v0/feature-dashboard
# 成员 B 的聊天 → 自动创建 v0/feature-settings
# 成员 C 的聊天 → 自动创建 v0/feature-onboarding
# 互不干扰，最后在 GitHub 上 PR 合并
```

设计师可以在 Design Mode 里调视觉效果（不消耗 credits），开发者在 Code 编辑器里改逻辑。两人的改动都记入 Git 历史，通过 PR 合并。

## 代码交接 Checklist

从 v0 原型交接给正式开发，这几项必查：

```bash
# 1. 移除 placeholder 内容
grep -r "Lorem ipsum" src/ --include="*.tsx"
grep -r "placeholder" src/ --include="*.tsx"

# 2. 创建 .env.example（v0 不会生成这个）
# 把 Vercel 上的环境变量整理成模板
echo "DATABASE_URL=\nNEXT_PUBLIC_SUPABASE_URL=\nSUPABASE_SERVICE_ROLE_KEY=" > .env.example

# 3. 跑 lint 和 type check
npm run lint
npx tsc --noEmit

# 4. 检查依赖版本
npm outdated
```

v0 生成的代码偶尔引用旧版依赖或遗留测试数据，交接前清理一遍能省后续很多麻烦。

## 共享 Instructions 统一规范

团队用 v0 时，在 Account Instructions 里统一规范避免风格不一致：

```
# 团队 Instructions 示例
- TypeScript strict mode，禁止 any
- 组件命名 PascalCase，文件名 kebab-case
- API 路由统一 /api/v1/ 前缀
- 错误返回 { error: string, code: number }
- 颜色用 CSS variables，不硬编码 hex
- 中文界面文案，英文变量名和注释
```

Instructions 在 Team 计划下可设为团队级，所有成员自动继承。新人入队不用花时间对齐代码风格，v0 生成的代码从第一行开始就符合团队规范。

## 推荐的团队工作流

```
PM / 设计师                开发者
    │                         │
    ├─ v0 生成原型             │
    ├─ Design Mode 调视觉      │
    ├─ Git 推到 GitHub ───────→│
    │                         ├─ Clone 到本地
    │                         ├─ Cursor 做深度开发
    │                         ├─ 加测试 + CI
    │                         ├─ PR → Code Review
    │                         └─ 合并 → Vercel 自动部署
```

这个流程的好处：PM 产出的不是静态设计图而是可运行代码，开发者拿到的不是从零开始的空项目而是已经跑通的原型。双方的沟通成本降一个数量级。
