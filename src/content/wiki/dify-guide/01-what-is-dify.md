---
title: "Dify 是什么：开源 LLM 应用开发平台，GitHub 13 万星的 LLMOps 标杆"
wiki: "dify-guide"
order: 1
description: "理解 Dify 的核心定位、架构原理，以及与 Coze、FastGPT、LangChain、Flowise 的全面对比"
---

Dify 是一个开源的 LLM 应用开发平台——你可以用可视化拖拽的方式搭建 AI 聊天机器人、RAG 知识库问答、多步骤工作流、自主决策 Agent，然后一键发布成 API 或网页应用。不需要从零写 LangChain 代码，也不需要自己搞向量数据库。

![Dify workflow editor](https://raw.githubusercontent.com/langgenius/dify/main/images/describe.png)

## 为什么 Dify 值得关注

GitHub 上 139K+ star，全球 140 万台机器在跑 Dify，280 多家企业（Maersk、Novartis、Anker）付费用它。2026 年 3 月刚融了 3000 万美元 Pre-A 轮。

火的原因很直白：**它把 LLM 应用开发的门槛拉到了最低**。产品经理可以拖拽搭工作流，开发者可以通过 API 把 Dify 当后端，运维可以用 Docker 一键部署私有化版本。一个平台，三种人都能用。

## 核心定位：BaaS + LLMOps

Dify 的定位是 **Backend-as-a-Service**（后端即服务）加 **LLMOps**（大模型运维）。翻译成人话就是：

1. **BaaS**：每个 AI 应用自动生成 REST API，你的前端直接调就行
2. **LLMOps**：内置日志追踪、性能监控、标注反馈，帮你持续优化 AI 应用

## 五种应用类型

| 类型 | 特点 | 适合场景 |
|------|------|---------|
| **Chatbot** | 多轮对话，有记忆 | 客服机器人、FAQ 助手 |
| **Agent** | 自主推理 + 调用工具 | 数据分析、多步骤任务 |
| **Chatflow** | 对话驱动的可视化工作流 | 复杂业务流程、多分支对话 |
| **Workflow** | 任务驱动，无记忆 | 批量处理、数据管道 |
| **Text Generator** | 单次文本生成 | 翻译、摘要、内容生成 |

我个人最推荐新手从 **Chatflow** 开始——它既有对话体验，又能在画布上看到整个逻辑链路，比纯 Chatbot 更灵活，比纯 Workflow 更直观。

## 技术架构一句话版

```
用户请求 → Next.js 前端 → Flask API → Celery Worker → LLM Provider
                                ↓               ↓
                           PostgreSQL       Vector DB (Weaviate/Qdrant)
                              (元数据)         (RAG 向量检索)
```

整套用 Docker Compose 跑起来，7-8 个容器：API、Worker、Web、PostgreSQL、Redis、Sandbox（代码执行沙箱）。

用 `docker compose ps` 可以看到全貌：

```bash
$ docker compose ps
NAME                STATUS        PORTS
dify-api-1          Up (healthy)  5001/tcp
dify-worker-1       Up (healthy)
dify-web-1          Up (healthy)  0.0.0.0:80->3000/tcp
dify-db-1           Up (healthy)  5432/tcp
dify-redis-1        Up (healthy)  6379/tcp
dify-sandbox-1      Up (healthy)
dify-weaviate-1     Up (healthy)  8080/tcp
dify-nginx-1        Up (healthy)  0.0.0.0:80->80/tcp
```

## 快速验证 Dify 是否跑通

部署完之后，一行 `curl` 就能验证 API 可用：

```bash
# 用你在 App → API Access 里拿到的 key
curl -s http://localhost/v1/chat-messages \
  -H "Authorization: Bearer app-xxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{},"query":"你好","user":"test","response_mode":"blocking"}' \
  | python3 -m json.tool
```

返回 `answer` 字段就说明端到端全通了——从 Nginx 到 API 到 LLM Provider 到 Worker 再回来。

## 跟竞品怎么选

| 维度 | Dify | Coze（扣子） | FastGPT | LangChain |
|------|------|------------|---------|-----------|
| 界面 | 可视化 + API 双模式 | 可视化为主 | 可视化为主 | 纯代码 |
| 自部署 | Docker/K8s，完全免费 | 2025 年 7 月才开源 | Docker，免费 | 库，不是平台 |
| 模型支持 | 100+ 模型，含国内厂商 | 字节系模型 + GPT | 通过 OneAPI 接入 | 最广，但要写代码 |
| RAG | 内置全流程 | 内置 | 精度更高（医疗/金融） | 需自己组装 |
| Agent | Function Calling + ReAct | Bot 模式 | 基础 | 最灵活（代码级） |
| 适合谁 | 开发者 + 运营 + 企业 | C 端用户 + 低代码 | 中国中小企业 | 纯开发者 |

**我的选型建议**：想快速出活、团队有非技术人员 → Dify。只做国内 C 端 Bot → Coze。对 RAG 精度有极致要求（医疗/法律） → FastGPT。全部要自定义、团队全是开发者 → LangChain。

不是非此即彼——很多团队用 Dify 做原型验证，确认可行后再用 LangChain 重写核心模块。
