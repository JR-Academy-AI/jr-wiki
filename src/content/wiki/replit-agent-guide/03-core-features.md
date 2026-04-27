---
title: "Replit Agent 核心功能深度拆解：四种模式、Design Canvas、数据库和部署"
wiki: "replit-agent-guide"
order: 3
description: "深入解析 Replit Agent 4 的 Agent Modes、Design Canvas 无限画布、PostgreSQL 数据库、Replit Auth 认证和 Checkpoint 回滚系统"
---

Replit Agent 不只是"AI 帮你写代码"这么简单。它把整个软件开发流程——设计、编码、测试、数据库、认证、部署——全打包在一个浏览器标签页里了。下面逐个拆解核心功能。

![Replit Agent 4 功能详解](https://img.youtube.com/vi/bAUVQfz_SIY/maxresdefault.jpg)

## 四种 Agent 模式

Agent 4 提供四种工作模式，在聊天输入框左下角可以切换：

| 模式 | 用途 | 速度 | 费用 | 适用计划 |
|------|------|------|------|---------|
| **Lite** | 改颜色、修小 bug、调文案 | 快 | 最低 | 所有 |
| **Economy** | 大部分日常开发 | 标准 | Agent 3 的 1/3 | 所有 |
| **Power** | 复杂功能、大项目 | 标准 | 和 Agent 3 持平 | 所有 |
| **Turbo** | 赶时间的关键任务 | Power 的 2 倍 | Power 的 6 倍 | Pro/Enterprise |

我的建议：日常用 Economy 就够了，遇到搞不定的复杂逻辑再切 Power。Turbo 的性价比很差，除非真的在赶 deadline。Lite 适合"把这个按钮颜色改成蓝色"这种小活。

Power 模式底层跑的是 Anthropic 的 Claude Opus 4.7 模型。

## Design Canvas：无限画布

Agent 4 用 **Design Canvas** 取代了之前的 Design Mode。简单说就是一个无限大的白板：

```
Design Canvas 工作流：

1. 画草图/贴截图 → Agent 理解你的设计意图
2. "Generate variants" → 生成多个设计方案并排展示
3. 选中一个 → 直接调颜色、字体、间距
4. "Apply to app" → Agent 把设计变成真正的代码
5. 实时预览 → 手机/平板/桌面三种尺寸切换
```

你甚至可以截图别人的网站贴到 Canvas 上，跟 Agent 说"照这个风格做"，它能高保真还原。

Canvas 支持的内容类型不只是网页——Web 应用、移动端应用、幻灯片、数据可视化图表都行，而且可以在同一个项目里混搭。

## Plan Mode：只聊天不写代码

在模式选择器里还有一个 **Plan** 选项。选了它之后，Agent 只跟你讨论方案、拆任务列表，但不会动任何代码。

适合在动手之前先规划架构。讨论满意了，点 "Start Building" 一键进入开发。

注意：Plan Mode 虽然不写代码，但还是要消耗 credits。问问题也算钱。

## PostgreSQL 数据库

跟 Agent 说"加个数据库"，它会在大约 15 秒内自动：

1. 创建一个 PostgreSQL 实例（10GB 免费存储，1 CPU，4GB 内存）
2. 设计表结构
3. 写好数据访问代码（通常用 Drizzle ORM）
4. 自动处理 migration

内置的 **Drizzle Studio** 可以直接在浏览器里可视化查看和编辑数据库内容，不需要额外装 pgAdmin 之类的工具。

```sql
-- Agent 自动生成的 schema 示例（Drizzle ORM）
-- 你不需要手写这些，Agent 会根据你的描述自动创建

CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

2025 年 12 月起，所有新数据库都跑在 Replit 自建的基础设施上（之前是用 Neon 托管的）。

## Replit Auth：一句话加登录

跟 Agent 说"加上用户登录功能"，它会自动配好 Replit Auth。用户点"Log in"会跳转到 Replit 的认证页面，支持 Google、GitHub 等社交登录。

底层用的是 Firebase + Google Cloud Identity Platform + reCAPTCHA，安全级别够用。

限制：目前只能通过 Agent 来配置 Replit Auth，没有手动配置的入口。

## Checkpoint 回滚系统

这是 Replit Agent 最实用的保险机制。Agent 每完成一个阶段的任务，系统会自动创建 Checkpoint（底层是 Git commit）。

每个 Checkpoint 保存：
- 完整的代码状态
- AI 对话上下文
- 项目配置
- **数据库内容**（可选）

关键特性：**双向导航**。不仅可以回退到之前的版本，回退太多了还能再往前恢复，不会丢失任何工作。

回滚时如果需要同时恢复数据库，在 "Additional rollback options" 里勾选 "Database" 就行。这个功能在 Agent 把数据搞乱的时候特别救命。
