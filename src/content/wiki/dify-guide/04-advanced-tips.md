---
title: "Dify 进阶技巧：API 集成、插件生态和生产环境实战"
wiki: "dify-guide"
order: 4
description: "Dify 的 REST API 对接、MCP 协议支持、插件开发、生产部署优化和真实企业案例"
---

Dify 基础功能上手后，这些进阶玩法能让你的 AI 应用真正跑在生产环境里。

![Dify branding](https://raw.githubusercontent.com/langgenius/dify/main/images/GitHub_README_if.png)

## API 集成：把 Dify 当 AI 后端用

每个 Dify 应用发布后自动生成一套 REST API。在 App → API Access 页面拿到 API Key，你的前端或后端直接调就行。

```python
import requests

API_KEY = "app-xxxxxxxxxxxx"
BASE_URL = "http://localhost/v1"

# 发送消息（流式返回）
response = requests.post(f"{BASE_URL}/chat-messages",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "inputs": {},
        "query": "帮我总结一下这个季度的销售数据",
        "user": "user-123",
        "response_mode": "streaming",
        "conversation_id": ""  # 空字符串 = 新对话
    },
    stream=True)

for line in response.iter_lines():
    if line:
        print(line.decode())
```

**几个实用接口**：
- `POST /chat-messages` — 发消息（支持 streaming）
- `GET /conversations` — 列出用户的所有对话
- `POST /audio-to-text` — 语音转文字
- `GET /messages/{id}/feedbacks` — 获取用户反馈

这套 API 最实用的地方是：**你可以用任何语言、任何框架调用 Dify**。React、Vue、Flutter、微信小程序——只要能发 HTTP 请求就行。不需要绑定 Dify 的前端。

## MCP 协议：双向打通外部工具链

Dify v1.6.0 起原生支持 **MCP（Model Context Protocol）**，而且是双向的：

- **作为 MCP Client**：Dify 可以调用外部 MCP Server 提供的工具（比如 Claude Code 的文件操作、数据库查询）
- **作为 MCP Server**：Dify 的应用可以被其他 MCP 客户端调用

这意味着你可以把 Dify 接入更大的 AI 工具生态。比如在 Claude Desktop 里直接调用你在 Dify 搭建的 RAG 知识库。

## 插件生态和 Marketplace

Dify v1.0 引入了插件架构。模型、工具、Agent 策略都是插件，可以独立安装、升级、替换。

**Marketplace**（marketplace.dify.ai）上有社区贡献的插件：
- 模型插件：接入各种 LLM provider
- 工具插件：Slack 发消息、Jira 创建 ticket、发邮件
- Agent 策略插件：CoT、ToT（Tree-of-Thought）、GoT（Graph-of-Thought）

**自己开发插件**也不复杂——写一个 manifest.yaml 定义元信息，Python 写逻辑，上传到 Marketplace。

## 生产环境优化

Dify 跑 demo 容易，跑在生产环境需要注意几件事：

**1. 反向代理**

```nginx
# Nginx 配置示例
server {
    listen 443 ssl;
    server_name dify.yourcompany.com;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_buffering off;  # 重要：SSE 流式输出需要关闭缓冲
    }
}
```

**2. 向量数据库选型**：默认 Weaviate 够用。数据量大（100 万+ 文档）考虑换 Qdrant 或 Milvus。

**3. Worker 扩容**：高并发场景增加 Celery Worker 副本数。

**4. 监控**：Dify 内置 LLMOps 日志面板，按应用维度看调用量、延迟、token 消耗、用户满意度。

## 真实案例

**Kakaku.com（日本价格比较网站）**：75% 的员工用 Dify 搭建 AI 应用，一家公司内部跑着近 950 个 Dify 应用。

**全球科技公司 VoC 分析**：用 Dify Workflow 编排 5 个 Agent（翻译、标注、分析、质检、汇总），每月处理 5 万条用户评价，单次分析时间从 8 小时降到 3 小时。

**企业快速原型**：某公司一个月内用 Dify 搭了 200+ AI 应用，其中一个应用被使用近 1 万次。

这些案例说明一个趋势：**Dify 正在从"开发者工具"变成"全员 AI 平台"**。
