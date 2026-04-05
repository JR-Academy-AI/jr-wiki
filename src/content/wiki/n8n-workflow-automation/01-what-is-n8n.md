---
title: "n8n 是什么：自动化工具的新选择"
wiki: "n8n-workflow-automation"
order: 1
description: "n8n 的定位、核心优势，以及与 Zapier、Make 的全面对比"
---

n8n 是一个开源的工作流自动化平台，让你用可视化节点连接各种应用，自动完成重复性任务——不管是发邮件、同步数据库、还是调用 AI，都能在一个界面里搞定。

![n8n workflow canvas](https://n8n.io/images/n8n-screenshot.png)

## n8n 解决的核心问题

每个开发者和职场人都有一堆"我应该自动化但一直没做"的任务：

- 客户填了表单 → 手动复制到 CRM → 手动发欢迎邮件
- 代码 push 成功 → 手动去 Slack 发通知
- 每天早上手动汇总几个渠道的数据到 Excel

n8n 让你用节点（Node）把这些步骤连起来，触发一次，全程自动。

## 为什么选 n8n 而不是 Zapier 或 Make

| 维度 | n8n | Zapier | Make |
|------|-----|--------|------|
| **价格（自托管）** | **完全免费，无限制** | $19.99/月起 | $9/月起 |
| **集成数量** | 1,000+ 原生 + 无限 API | 8,000+ | 1,500+ |
| **AI Agent** | 原生 LangChain，70+ AI 节点 | Zapier Agents（受限） | Maia（受限） |
| **代码能力** | **JavaScript / Python，支持 npm** | 受限 | 受限 |
| **数据主权** | **自托管，数据不出服务器** | SaaS，数据在 Zapier | SaaS，数据在 Make |
| **学习曲线** | 中（开发者友好） | 低（拖拉选择即可） | 中低 |
| **适合人群** | 开发者 / 技术团队 | 非技术人员 | 中间层 |

**n8n 最大的差异化优势：**

1. **自托管免费，真·无限制** — 社区版跑在你自己的服务器上，任务数、workflow 数、用户数全无限制。Zapier 750 tasks/月才 $19.99，n8n 你可以跑几百万次都是免费的。

2. **真实代码能力** — n8n 的 Code Node 支持完整的 JavaScript 和 Python，还能直接 `require()` npm 包。Zapier 的 Code 步骤只支持极简的 JS 片段。

3. **AI Agent 原生集成** — n8n 2.0 内置 LangChain，有 70+ AI 专属节点，构建 AI Agent 不需要写一行代码，但如果你想写代码，可以完全自定义。

## 什么时候选 n8n？

**选 n8n 的场景：**
- 你或团队有基本的技术能力（会看 JSON、会写简单 JS）
- 工作流需要处理数据逻辑、条件分支、循环
- 需要接入自建 API 或数据库
- 想做 AI Agent 工作流（接 OpenAI、Claude、本地模型）
- 不想让数据经过第三方服务器（GDPR、隐私合规）

**选 Zapier 的场景：**
- 完全非技术人员，不想碰任何代码
- 需要连接很冷门的 SaaS 工具（Zapier 8000+ 集成确实更广）

## n8n 的"公平代码"许可

n8n 使用 [Sustainable Use License](https://github.com/n8n-io/n8n/blob/master/LICENSE.md) — 不是 MIT，但也不是商业闭源：

- 个人和团队内部使用：**完全免费**
- 给客户提供 n8n 托管服务：需要商业许可
- 查看源码、修改代码：允许

对 99% 的使用场景来说，你就把它当免费开源软件用即可。
