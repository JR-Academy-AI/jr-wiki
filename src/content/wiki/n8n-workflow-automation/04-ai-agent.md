---
title: "AI Agent 实战：用 n8n 构建智能工作流"
wiki: "n8n-workflow-automation"
order: 4
description: "接入 OpenAI 和 Claude，用 n8n AI Agent 节点构建有记忆、能推理、会调用工具的智能自动化"
---

n8n 2.0 内置了 LangChain 集成，提供 70+ AI 专属节点。你可以在不写任何框架代码的情况下，构建有记忆、能调用工具、会推理决策的 AI Agent。

![n8n AI Agent 工作流：LLM + Memory + Tools 协同工作](https://raw.githubusercontent.com/n8n-io/n8n/master/assets/n8n-screenshot-readme.png)

## AI Agent 节点的架构

n8n 的 AI Agent 工作流由四个角色组成：

```
[Trigger] → [AI Agent 节点]
                 ├── Language Model（大脑）: OpenAI GPT-4o / Claude / Gemini
                 ├── Memory（记忆）: Window Buffer / PostgreSQL / Redis
                 └── Tools（工具）: Workflow Tool / HTTP Request / Calculator / ...
```

**AI Agent 节点本身不固定模型**，它是一个推理引擎框架——你可以随时换底层模型，而工作流逻辑不变。

---

## 接入 OpenAI

### Step 1：添加 OpenAI Credential

1. 左侧菜单 → **Credentials** → **Add Credential**
2. 搜索 `OpenAI`，填入你的 API Key
3. 保存，命名为 `OpenAI - Production`

### Step 2：创建 AI Agent 工作流

**节点链：** Chat Trigger → AI Agent → （可选）Slack/Gmail 回复

**AI Agent 节点配置：**

| 字段 | 值 |
|------|-----|
| **Agent** | Tools Agent（推荐，支持工具调用） |
| **Language Model** | 选择 OpenAI Chat Model |
| **Model** | gpt-4o 或 gpt-4o-mini |
| **System Message** | 你是 JR Academy 的客服助手，只回答课程相关问题... |
| **Memory** | Window Buffer Memory（保留最近 10 轮对话） |

**System Message 示例：**
```
你是一个专业的技术助手，负责帮助开发团队解答问题。
规则：
1. 只回答技术问题，不讨论政治和个人话题
2. 如果不确定，明确说"我不确定，建议查阅官方文档"
3. 回答时优先给出代码示例
4. 始终用中文回复
```

---

## 接入 Claude（Anthropic）

Claude 在长文本处理和代码理解方面表现出色，适合文档处理类 Agent。

### 配置步骤

1. Credentials → Add Credential → 搜索 `Anthropic`
2. 填入 Anthropic API Key（从 console.anthropic.com 获取）
3. 在 AI Agent 节点的 Language Model 中选择 **Anthropic Chat Model**
4. 选择模型：`claude-sonnet-4-6`（性价比最高）或 `claude-opus-4-6`（最强）

---

## 实战案例 1：能查数据库的客服 Bot

**场景**：用户通过 Telegram 问订单状态，Agent 自动查数据库返回结果。

```
Telegram Trigger
    ↓
AI Agent
  ├── LLM: GPT-4o
  ├── Memory: Window Buffer（10 轮）
  ├── Tool: PostgreSQL 查询（自定义 Workflow Tool）
  └── Tool: 获取当前时间（内置）
    ↓
Telegram 回复
```

**关键：Workflow Tool 配置**

在 AI Agent 的 Tools 里添加 **n8n Workflow Tool**，指向另一个专门查数据库的子工作流：

子工作流（`查询订单`）：
```
Execute Workflow Trigger（接收 order_id 参数）
    ↓
PostgreSQL: SELECT * FROM orders WHERE id = {{ $json.order_id }}
    ↓
返回查询结果
```

Agent 会在需要查询时自动调用这个工具，把 `order_id` 传进去，拿到结果后再组织成自然语言回复给用户。

---

## 实战案例 2：自动化内容生成 Pipeline

**场景**：每天从 RSS 抓取科技新闻 → AI 总结 → 自动发 Notion 和邮件。

```
Schedule Trigger（每天 7:00）
    ↓
HTTP Request（抓取 RSS: techcrunch.com/feed/）
    ↓
Code（解析 XML，提取 5 条最新文章）
    ↓
Loop Over Items
    ↓（每篇文章）
    OpenAI Chat Model（总结文章，输出中文摘要）
    ↓
Merge（合并所有摘要）
    ↓
Notion（创建每日简报页面）
    ↓
Gmail（发送简报邮件给订阅者）
```

**OpenAI 节点 Prompt：**
```
请用 3-5 句话总结以下英文文章，输出中文，突出对开发者最有价值的信息：

标题：{{ $json.title }}
内容：{{ $json.content }}

输出格式：
【核心观点】...
【对开发者的影响】...
【关键数据】...（如有）
```

---

## 记忆（Memory）节点对比

| 记忆类型 | 适用场景 | 配置复杂度 |
|---------|---------|-----------|
| **Window Buffer Memory** | 多轮对话，保留最近 N 轮 | 低（默认推荐） |
| **Postgres Chat Memory** | 持久化对话历史，多用户 | 中（需要 PG 数据库） |
| **Redis Chat Memory** | 高并发场景，快速读写 | 中（需要 Redis） |
| **Zep** | 长期记忆 + 向量检索 | 高（需要 Zep 服务） |

**Window Buffer Memory 配置：**

```
Context Window Length: 10  // 保留最近 10 条消息
Session Key: {{ $json.chatId }}  // 用 chatId 区分不同用户的会话
```

---

## AI Agent 调试技巧

**1. 查看 Agent 的推理过程**

在 n8n 执行记录里，AI Agent 节点会输出完整的 `intermediateSteps`，包含每次工具调用的输入/输出。这是调试 Agent 行为最直接的方式。

**2. 限制工具调用次数**

防止 Agent 陷入循环：

```
Max Iterations: 10  // AI Agent 节点设置，超过后强制停止
```

**3. 用 System Message 约束行为**

不要期望 LLM 自己"猜到"你的意图，把规则写进 System Message：

```
重要约束：
- 你只能使用提供的工具，不能自行编造数据
- 如果工具返回空结果，回复"未找到相关信息"
- 每次回复不超过 200 字
```
