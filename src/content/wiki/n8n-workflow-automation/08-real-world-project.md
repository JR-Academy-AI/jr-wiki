---
title: "实战项目：客户咨询自动响应系统"
wiki: "n8n-workflow-automation"
order: 8
description: "从零搭建一个完整的客户咨询处理系统：表单接收、AI 分类、自动回复、人工升级、数据统计"
---

![n8n 实战项目架构](https://img.youtube.com/vi/UtXzdmpysmU/maxresdefault.jpg)

前面几章讲了单个功能点，这章把它们串起来——搭一个真实可用的客户咨询自动响应系统。这个系统在 JR Academy 内部跑了三个月，处理了 2000+ 条咨询，80% 不需要人工介入。

## 系统架构

```
用户提交咨询（网站表单 / 邮件）
         ↓
    Webhook 接收
         ↓
    AI 分类（课程咨询 / 技术问题 / 投诉 / 其他）
         ↓
   ┌─────┴─────┐
   │  课程咨询   │──→ AI 自动回复（FAQ 知识库匹配）→ 发邮件
   │  技术问题   │──→ 创建 GitHub Issue → 通知技术团队
   │  投诉       │──→ 直接转人工 → Slack 告警 → 创建 CRM 工单
   │  其他       │──→ AI 尝试回复 → 标记待人工审核
   └────────────┘
         ↓
    所有记录写入 PostgreSQL（统计分析用）
```

## 第一步：Webhook 接收咨询

网站表单提交到 n8n 的 Webhook：

```
Webhook 节点:
  Method: POST
  Path: /customer-inquiry
  Authentication: Header Auth（X-Webhook-Secret）
  Response Mode: When Last Node Finishes（用户看到处理结果）
```

接收的数据格式：

```json
{
  "name": "张三",
  "email": "zhangsan@example.com",
  "subject": "想了解全栈开发课程的价格",
  "message": "我是非科班转码，有半年自学经验，想问下你们全栈课程多长时间，费用多少？",
  "source": "website"
}
```

## 第二步：AI 分类

用 AI Agent 节点对咨询内容做分类，不用自己写规则——LLM 天然擅长理解自然语言意图。

```
AI Agent 节点配置:
  Language Model: Claude claude-sonnet-4-6
  System Message: 见下方
  Max Iterations: 3
```

System Message：

```
你是一个客户咨询分类器。根据用户的咨询内容，输出一个 JSON 对象。

分类规则：
- course_inquiry: 问课程内容、价格、时长、报名方式
- tech_question: 技术问题、代码报错、环境配置
- complaint: 投诉、不满、退款
- other: 以上都不是

输出格式（严格 JSON，不要多余文字）：
{"category": "course_inquiry", "confidence": 0.95, "summary": "咨询全栈课程价格和时长"}
```

分类结果用 Code 节点解析：

```javascript
const raw = $json.output || $json.text;
const parsed = JSON.parse(raw);
return [{ json: { ...parsed, originalData: $node["Webhook"].json } }];
```

## 第三步：分支处理

用 Switch 节点按 category 走不同路径：

```
Switch 节点:
  Field: {{ $json.category }}
  Rules:
    - course_inquiry → Output 0
    - tech_question → Output 1
    - complaint → Output 2
    - other → Output 3 (Fallback)
```

### 课程咨询 → FAQ 自动回复

```
Switch Output 0
    ↓
AI Agent（带 Workflow Tool）
  ├── LLM: Claude claude-sonnet-4-6
  ├── System Message: "你是 JR Academy 课程顾问，用知识库里的信息回答..."
  └── Tool: 查询 FAQ 数据库（子工作流）
    ↓
Gmail: 发送自动回复邮件
```

FAQ 子工作流：

```sql
-- 子工作流里的 PostgreSQL 查询
SELECT question, answer 
FROM faq 
WHERE question_embedding <-> $1 < 0.3
ORDER BY question_embedding <-> $1
LIMIT 3;
```

用 pgvector 做语义搜索，找到最相关的 3 个 FAQ 条目，喂给 AI 生成个性化回复。

### 投诉 → 人工介入

```
Switch Output 2
    ↓
Slack: 发送告警到 #customer-urgent 频道
  "🚨 收到客户投诉
   客户: {{ $json.originalData.name }}
   邮件: {{ $json.originalData.email }}
   内容: {{ $json.originalData.message }}"
    ↓
HTTP Request: 创建 CRM 工单（HubSpot / Salesforce）
    ↓
Gmail: 发送确认邮件给客户
  "您的反馈我们已收到，客服团队会在 2 小时内联系您"
```

## 第四步：记录入库

所有路径的最终结果都汇入 Merge 节点，统一写入 PostgreSQL：

```javascript
// Code 节点：构造入库数据
const original = $json.originalData;
return [{
  json: {
    name: original.name,
    email: original.email,
    subject: original.subject,
    message: original.message,
    source: original.source,
    category: $json.category,
    confidence: $json.confidence,
    ai_summary: $json.summary,
    auto_replied: $json.category !== 'complaint',
    created_at: new Date().toISOString()
  }
}];
```

```sql
-- 建表语句
CREATE TABLE customer_inquiries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(255),
  subject TEXT,
  message TEXT,
  source VARCHAR(50),
  category VARCHAR(50),
  confidence DECIMAL(3,2),
  ai_summary TEXT,
  auto_replied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inquiries_category ON customer_inquiries(category);
CREATE INDEX idx_inquiries_created ON customer_inquiries(created_at);
```

## 第五步：每周统计报告

再建一个独立的定时工作流，每周一早上发统计报告：

```
Schedule Trigger（0 9 * * 1）
    ↓
PostgreSQL: 统计上周数据
    ↓
Code: 生成报告
    ↓
Gmail: 发给管理层
```

```sql
SELECT 
  category,
  COUNT(*) as total,
  ROUND(AVG(confidence), 2) as avg_confidence,
  SUM(CASE WHEN auto_replied THEN 1 ELSE 0 END) as auto_count
FROM customer_inquiries
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY category
ORDER BY total DESC;
```

## 部署检查清单

上线前过一遍：

- [ ] Webhook URL 用生产域名，不是 localhost
- [ ] 所有 API Key 走 Credentials，不硬编码
- [ ] Error Workflow 配好，Slack 告警通道测试过
- [ ] PostgreSQL 连接用连接池，最大连接数设合理值
- [ ] AI Agent 的 Max Iterations 限制在 5 以内
- [ ] 邮件模板在测试环境发过，格式没问题
- [ ] 监控 workflow 执行耗时，设置超时阈值
