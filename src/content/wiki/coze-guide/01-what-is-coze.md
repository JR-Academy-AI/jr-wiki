---
title: "Coze 是什么：字节跳动出品的 AI Bot 开发平台，零代码也能搞定"
wiki: "coze-guide"
order: 1
description: "理解 Coze 的核心定位、国际版与扣子的区别，以及跟 Dify、FastGPT、LangChain 的全面对比"
---

Coze 是字节跳动推出的 AI Bot 开发平台——你可以用拖拽的方式搭建聊天机器人，给它接上插件、知识库、工作流，然后一键发布到 Discord、Telegram、WhatsApp 等十几个渠道。不用写后端，不用自己搞部署。

![Coze 平台界面概览](https://img.youtube.com/vi/x2z9dQEEQq0/maxresdefault.jpg)

## 为什么值得关注

2024 年初上线，一年多就拿下数百万用户。2025 年 7 月字节把核心组件 Coze Studio 和 Coze Loop 开源（Apache 2.0），GitHub 48 小时冲上 9K star。现在你既可以用云端版本零成本上手，也可以 Docker 自部署完全私有化。

火的原因很简单：**它把"让 AI 做事"这件事的门槛拉到了最低**。产品经理能拖拽搭工作流，开发者能通过 API 把 Bot 集成到自己的应用里，运营能直接把 Bot 发到社群。

## 两个版本：国际版 vs 扣子

| 维度 | Coze 国际版 (coze.com) | 扣子 (coze.cn) |
|------|----------------------|---------------|
| 模型 | GPT-4o、Gemini 1.5、Claude | 豆包、Moonshot、GLM |
| 发布渠道 | Discord、Telegram、WhatsApp、Slack | 抖音、飞书、微信（需审核） |
| 访问 | 全球直连 | 国内直连 |
| 插件生态 | 600+ 英文插件为主 | 中文插件生态更丰富 |
| 定价 | Free / Premium $9/月 | 免费 / 专业版 |

本教程以**国际版 coze.com** 为主。如果你在国内，扣子的操作逻辑几乎一样，换个域名就行。

## 跟竞品怎么选

```
选型决策树：

你需要什么？
├── 零代码，快速出活，发到聊天平台 → Coze
├── 要自部署，数据不出服务器 → Dify（Docker 一键部署）
├── 对 RAG 精度有极致要求（医疗/法律）→ FastGPT
└── 全部自定义，团队全是开发者 → LangChain / LangGraph
```

| 维度 | Coze | Dify | FastGPT |
|------|------|------|---------|
| 上手速度 | 最快，注册即用 | 中等，需配 Docker 或付费云端 | 中等 |
| 模型选择 | GPT-4o / Gemini / Claude | 100+ 模型 | 通过 OneAPI 接入 |
| 工作流 | 可视化拖拽 | 可视化拖拽 | 基础 |
| 插件生态 | 600+ 内置 + 自定义 | 社区插件 + MCP 协议 | 插件市场 |
| 发布渠道 | 10+ 聊天平台 | API / 嵌入 / iframe | API / 嵌入 |
| 自部署 | Coze Studio 开源 | Docker / K8s | Docker |
| 适合谁 | 快速验证想法、做 C 端 Bot | 企业私有化、复杂 AI 应用 | 中小企业知识库 |

**我的建议**：如果你的目标是"尽快做一个能用的 AI Bot"，Coze 是最省心的选择。如果你需要私有化部署和数据隔离，看我们的 [Dify 实战手册](/wiki/dify-guide)。

## 开源版本：Coze Studio

2025 年 7 月，字节开源了 Coze 的核心：

- **Coze Studio**：完整的 Bot 开发环境，Go 后端 + React/TypeScript 前端
- **Coze Loop**：Agent 调试和评测工具，支持全链路可视化追踪

```bash
# 快速体验 Coze Studio 开源版
git clone https://github.com/coze-dev/coze-studio.git
cd coze-studio
docker compose up -d
# 浏览器打开 http://localhost:8888
```

开源版适合想把 Coze 跑在自己服务器上的团队。后面第四章会详细讲怎么部署和配置。
