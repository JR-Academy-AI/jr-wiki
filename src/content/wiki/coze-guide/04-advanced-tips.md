---
title: "Coze 进阶玩法：API 集成、SDK 开发和开源部署"
wiki: "coze-guide"
order: 4
description: "Coze API 完整指南、Python/JavaScript SDK 实战、Coze Studio 自部署教程、Coze 2.0 新功能和 Coze Space 协作平台"
---

Coze 基础功能玩熟之后，真正的生产力来自 API 集成和自部署。这章讲怎么把 Coze 从一个网页工具变成你技术栈的一部分。

![Coze Studio 开源项目](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/943f576df3424fa98580c2ad18946719~tplv-goo7wpa0wc-image.image)

## Coze API：把 Bot 接进你的系统

把 Bot 发布为 API 渠道后，你就能用 HTTP 请求跟它对话。先拿一个 Personal Access Token（在 Settings → API Keys 生成）。

### 核心 API 端点

| 端点 | 功能 |
|------|------|
| `POST /v1/conversation/create` | 创建新对话 |
| `POST /v3/chat` | 发起聊天（支持流式） |
| `POST /v1/workflow/run` | 执行工作流（非流式） |
| `POST /v1/workflow/stream_run` | 流式执行工作流 |
| `GET /v1/conversations` | 查询对话列表 |

### Python SDK 实战

```python
from cozepy import Coze, TokenAuth, ChatEventType

# 初始化客户端
coze = Coze(auth=TokenAuth("your_personal_access_token"))

# 创建对话并发消息（流式）
for event in coze.chat.stream(
    bot_id="your_bot_id",
    user_id="user_001",
    additional_messages=[
        {"role": "user", "content": "帮我分析一下这个月的销售数据"}
    ],
):
    if event.event == ChatEventType.CONVERSATION_MESSAGE_DELTA:
        print(event.message.content, end="", flush=True)
```

安装：`pip install cozepy`。还有 JavaScript SDK（`@coze/api`）和 Java SDK（`coze-java`），接口设计基本一致。

### 工作流 API

工作流发布为 API 后，可以绕过 Bot 直接调用：

```bash
curl -X POST https://api.coze.com/v1/workflow/run \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_id": "wf_xxx",
    "parameters": {
      "input_text": "今天天气怎么样",
      "city": "Sydney"
    }
  }'
```

标准超时 10 分钟，异步模式最长 24 小时——适合跑数据批处理或长任务。

## Coze Studio 自部署

不想用云端？Coze Studio 开源版让你完全自托管。GitHub 上已经 20K+ star。

### 最低配置

| 项目 | 要求 |
|------|------|
| CPU | 2 核 |
| 内存 | 4 GB |
| Docker | 20.10+ |
| Docker Compose | v2 |

### 部署步骤

```bash
git clone https://github.com/coze-dev/coze-studio.git
cd coze-studio

# 修改配置（可选：配 LLM provider API key）
cp .env.example .env
# 编辑 .env，填入你的 OpenAI/Claude API key

docker compose up -d

# 等容器跑起来后，访问
open http://localhost:8888
```

开源版用 Go 写后端（微服务 + DDD 架构），React + TypeScript 写前端。Apache 2.0 协议，可以商用。

### 注意事项

公网部署要注意安全：
- Code 节点的 Python 执行环境需要沙箱隔离
- 关闭公开注册或加 IP 白名单
- 工作流 API 发布功能在开源版有限制

## Coze 2.0 新功能（2026 年 1 月）

2026 年初 Coze 发布了 2.0 大版本，从"聊天工具"变成了"智能工作伙伴"：

**Agent Plan**：AI 能把复杂目标拆成子任务，自己追踪进度，直到最终交付。比如你说"帮我做一份竞品分析报告"，它会自动规划：搜索竞品信息 → 整理数据 → 生成对比表格 → 输出报告。

**Coze Coding**：内置 Vibe Coding 环境，用自然语言对话就能构建 Agent、工作流甚至完整的 Web 应用，一键部署。

**Skills Marketplace**：把专业技能打包成可复用的模块，跨 Bot 共享。

## Coze Space：AI 协作平台

2026 年初公测的 Coze Space 是字节对"AI 协作办公"的回答：

- **探索模式**：AI 快速试错，适合简单任务
- **规划模式**：AI 深度思考，适合复杂项目
- **MCP 扩展**：接入飞书文档、高德地图、图片工具等
- 支持多个专家 Agent 组队协作

我觉得 Coze Space 目前还比较早期，复杂任务的完成度不够稳定。但方向没错——未来 AI 协作办公一定是这个形态。
