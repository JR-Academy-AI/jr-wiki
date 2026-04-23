---
title: "五个让老板眼前一亮的 n8n 实战案例"
wiki: "n8n-guide"
order: 2
description: "从邮件分拣到 AI 客服，五个可直接复用的 n8n 工作流完整实现，每个附上节点配置和代码"
---

光看节点说明太抽象。这章直接上五个真实业务场景的完整实现——每个都给出节点流程图、关键配置和可运行的代码，拿来改改就能用。

![n8n AI Workflow Builder 界面](https://raw.githubusercontent.com/n8n-io/n8n-docs/main/docs/_images/advanced-ai/ai-workflow-builder.png)

## 案例一：客户邮件自动分拣 + Notion 任务创建

**场景**：销售或运营每天要处理几十封客户邮件，根据内容手动分类、手动建任务，容易漏掉高优先级请求。

**节点流程**：

```
Gmail Trigger
    ↓
OpenAI（分类 + 摘要，返回 JSON）
    ↓
Code（解析 AI 输出）
    ↓
If（priority === "high"？）
  ├── True → Notion 创建任务 + Slack 紧急通知
  └── False → Notion 创建任务（静默）
```

**OpenAI 节点 Prompt**（System Message）：

```
分析下面这封客户邮件，只返回严格的 JSON，不要有任何其他文字：
{
  "category": "投诉/询价/售后/其他",
  "priority": "high/medium/low",
  "summary": "50字以内摘要"
}

邮件内容：{{ $json.text }}
```

**Code 节点**（解析 AI 返回并附带原始邮件 ID）：

```javascript
const raw = $json.choices[0].message.content.trim();
const parsed = JSON.parse(raw);
return {
  json: {
    ...parsed,
    emailId: $("Gmail Trigger").item.json.id,
    subject: $("Gmail Trigger").item.json.subject
  }
};
```

**If 节点条件**：`{{ $json.priority }}` equals `high`

**Notion 节点**（两个分支都连）：

```
Operation: Create Database Item
Database: 客户反馈跟进表
Properties:
  Title: {{ $json.subject }}
  Category: {{ $json.category }}
  Priority: {{ $json.priority }}
  Summary: {{ $json.summary }}
  Email ID: {{ $json.emailId }}
```

上线时间估计：**30 分钟**。

---

## 案例二：网站表单 → CRM 录入 + 欢迎邮件

**场景**：官网留资表单提交后，数据要手动录 HubSpot CRM，还要发欢迎邮件，两步都容易忘——尤其是周末收到的表单。

**节点流程**：

```
Webhook（POST）
    ↓
HubSpot（Create or Update Contact）
    ↓
Gmail（发欢迎邮件）
    ↓
Google Sheets（追加备份行）
```

**Webhook 节点关键设置**：

```
HTTP Method: POST
Response Mode: "Using 'Respond to Webhook' Node"（立即返回 200，不阻塞用户）
```

在网站表单的 `action` 属性里填入生成的 Webhook URL。

**HubSpot 节点**：

```
Operation: Create or Update Contact
Email: {{ $json.body.email }}
First Name: {{ $json.body.name }}
Phone: {{ $json.body.phone }}
```

**Gmail 欢迎邮件**（HTML Body）：

```html
<p>你好 {{ $json.body.name }}，</p>
<p>感谢填写我们的表单！我们的顾问会在 <strong>24 小时内</strong>联系你。</p>
<p>如有紧急问题，可直接回复这封邮件。</p>
<p>— JR Academy 团队</p>
```

上线时间估计：**20 分钟**。

---

## 案例三：每天自动抓取数据 + AI 生成日报

**场景**：每天早上需要汇总几个渠道的数据（API 行情、RSS 新闻、竞品价格），整理成报告发给老板。手动做一遍要 30 分钟，自动化后零干预。

**节点流程**：

```
Schedule Trigger（每天 09:00）
    ↓
HTTP Request（抓取目标 API 或 RSS）
    ↓
Code（整理数据、提取关键字段）
    ↓
OpenAI（生成中文日报）
    ↓
Gmail（发送给收件人列表）
```

**Schedule Trigger 配置**：

```
Trigger Interval: Days
Days Between Triggers: 1
Trigger at Hour: 9am
Trigger at Minute: 0
```

**Code 节点**（整理数据为可读摘要）：

```javascript
const items = $input.all();
const data = items.map(item => item.json);

const lines = data.slice(0, 10).map((d, i) =>
  `${i + 1}. ${d.title || d.name}：${d.value || d.description || '-'}`
);

return [{
  json: {
    date: new Date().toLocaleDateString('zh-CN'),
    total: data.length,
    summary: lines.join('\n')
  }
}];
```

**OpenAI Prompt**：

```
你是一个数据分析助手。根据以下数据，生成一份 300 字以内的中文日报，语言简洁商业化：

日期：{{ $json.date }}
数据条数：{{ $json.total }}
数据摘要：
{{ $json.summary }}

输出格式：
【今日概览】（1-2句）
【关键数据】（3-5条要点）
【建议行动】（1-2条）
```

上线时间估计：**40 分钟**（含调试）。

---

## 案例四：Telegram AI 客服 Bot（带对话记忆）

**场景**：对外提供 Telegram 客服，希望 AI 先回复 80% 的常见问题，降低人工客服压力。关键是要有上下文记忆——用户说"上一个问题再解释一下"，AI 需要知道"上一个问题"是什么。

**节点流程**：

```
Telegram Trigger（新消息）
    ↓
AI Agent
  ├── [LLM] GPT-4o-mini（成本低，响应快）
  ├── [Memory] Window Buffer Memory（保留最近 10 轮）
  └── [Tool] HTTP Request Tool（查课程数据库）
    ↓
Telegram（回复消息）
```

**AI Agent System Message**：

```
你是 JR Academy 的官方客服助手，用亲切专业的中文回复。

你能回答的问题：
- 课程内容、学习方式和时长
- 报名流程和价格
- 上课时间和平台

你不能做的事：
- 做出任何承诺或折扣保证
- 透露内部运营数据

遇到无法回答的问题，回复：
"这个问题我来帮你转给顾问，请告诉我你方便联系的时间和方式。"

每次回复控制在 150 字以内。
```

**Window Buffer Memory 配置**：

```
Context Window Length: 10
Session Key: {{ $("Telegram Trigger").item.json.message.chat.id }}
```

用 `chat.id` 做 Session Key，每个用户的对话历史完全隔离。

**Telegram 回复节点**：

```
Chat ID: {{ $("Telegram Trigger").item.json.message.chat.id }}
Text: {{ $json.output }}
```

上线时间估计：**60 分钟**（含 Telegram Bot 注册和调试）。

---

## 案例五：GitHub PR 合并 → Slack 发布通知

**场景**：代码合并了却没人知道，团队协作靠手动喊话太低效，尤其是分布在不同时区的远程团队。

**节点流程**：

```
Webhook（接收 GitHub Push 事件）
    ↓
If（action === "closed" AND merged === true？）
  └── True → Slack 发布通知
```

**GitHub Webhook 配置**：

1. 进入 GitHub repo → Settings → Webhooks → Add webhook
2. Payload URL：填入 n8n 的 Webhook 生产 URL
3. Content type：`application/json`
4. 触发事件选 **Pull requests**

**If 节点**（两个条件都要满足）：

```
条件1：{{ $json.body.action }} equals "closed"
条件2：{{ $json.body.pull_request.merged }} equals true（Boolean）
```

**Slack 消息模板**：

```
🚀 *新版本已上线！*

*{{ $json.body.pull_request.title }}*
作者：{{ $json.body.pull_request.user.login }}
目标分支：`{{ $json.body.pull_request.base.ref }}`
变更文件：{{ $json.body.pull_request.changed_files }} 个
链接：{{ $json.body.pull_request.html_url }}
```

上线时间估计：**15 分钟**。

---

## 五个案例对比

| 案例 | 核心节点 | 难度 | 搭建时间 | 最大价值 |
|------|---------|------|---------|---------|
| 邮件分拣 | Gmail + OpenAI + Notion | ⭐⭐ | 30 min | 防止高优先级邮件漏处理 |
| 表单 → CRM | Webhook + HubSpot + Gmail | ⭐ | 20 min | 留资到联系零遗漏 |
| 每日报告 | Schedule + HTTP + OpenAI | ⭐⭐ | 40 min | 每天省 30 分钟汇报时间 |
| Telegram 客服 | Telegram + AI Agent | ⭐⭐⭐ | 60 min | 80% 问题 AI 自动回复 |
| GitHub 通知 | Webhook + Slack | ⭐ | 15 min | 部署进度团队实时同步 |

**建议从案例五**（GitHub → Slack）开始练手——只有两个节点，逻辑清晰，最适合感受 n8n 的工作方式。熟悉之后再挑战带 AI 的案例三或案例四。
