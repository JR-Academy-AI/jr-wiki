---
title: "Dify 快速上手：云端 5 分钟 or 本地 Docker 部署"
wiki: "dify-guide"
order: 2
description: "两条路线上手 Dify：云端 Sandbox 即开即用，Docker Compose 本地私有化部署，再到创建第一个 AI 应用"
---

Dify 提供两条上手路线：云端 Sandbox 零配置试用，或者 Docker Compose 部署到自己的服务器。两条路我都走过，各有各的好。

![Dify model providers](https://raw.githubusercontent.com/langgenius/dify/main/images/models.png)

## 路线一：云端 Sandbox（5 分钟上手）

1. 打开 [dify.ai](https://dify.ai)，点右上角 Get Started
2. 用 **GitHub** 或 **Google** 账号登录
3. 进入 Dashboard，直接点 "Create App"
4. 完事。不需要信用卡，不需要装任何东西

Sandbox 免费额度：

| 项目 | 限额 |
|------|------|
| 每月消息数 | 200 条 |
| 应用数 | 10 个 |
| 向量存储 | 5 MB |
| 文档上传 | 50 个 |
| 团队成员 | 1 人 |
| 日志保留 | 15 天 |

200 条消息看着少，但够你体验所有功能、跑通一个 demo。真正要用起来，往下看路线二。

## 路线二：Docker Compose 本地部署（免费无限制）

自部署的 Dify 没有消息数限制、没有应用数限制、没有团队人数限制——你的硬件就是唯一瓶颈。

**最低配置**：2 核 CPU、4 GB RAM、20 GB 硬盘、Docker 20.10+

**推荐配置**：4 核、8 GB RAM。如果还要跑 Ollama 本地模型，建议 16 GB 起步。

```bash
# 1. 克隆仓库
git clone https://github.com/langgenius/dify.git

# 2. 进入 docker 目录
cd dify/docker

# 3. 复制环境变量文件
cp .env.example .env

# 4. 生成密钥并填入 .env 的 SECRET_KEY
openssl rand -base64 42

# 5. 启动所有服务
docker compose up -d

# 6. 等 1-2 分钟，检查容器状态
docker compose ps
```

全部显示 `healthy` 后，浏览器打开 `http://你的IP`，创建管理员账号，就能用了。

**升级也简单**：

```bash
cd dify/docker
git pull origin main
docker compose pull
docker compose up -d
```

## 配模型：接 OpenAI / Claude / Ollama

拿到 Dify 后第一件事——去 **Settings → Model Providers** 配模型。

**接 OpenAI**：填 API Key 就行，GPT-4o、GPT-3.5-turbo、DALL-E、Whisper 全部可用。

**接 Anthropic**：填 API Key，Claude Sonnet 4.6、Claude 3.5 Sonnet、Claude 3 Opus 都能用。

**接 Ollama（本地模型，零成本）**：

```bash
# 先在服务器上装 Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 拉一个模型
ollama pull llama3
ollama pull deepseek-r1

# 在 Dify 里添加 Ollama provider
# Server URL: http://host.docker.internal:11434
```

用 Ollama 跑本地模型的好处：**零 API 费用、数据不出服务器、断网也能用**。一个 7B 参数的模型大概吃 4.5 GB 内存，日常问答够用了。

我的建议是：先用 OpenAI 或 Claude 的 API 跑通流程，确认效果满意后再考虑用 Ollama 本地模型降低成本。

## 创建第一个应用

配好模型后，点 Dashboard → Create App：

1. 选 **Chatflow**（推荐新手）
2. 给应用起个名字，比如"产品 FAQ 助手"
3. 进入编排界面——左边是节点列表，中间是画布，右边是测试对话窗
4. 画布上默认有 Start → LLM → Answer 三个节点
5. 点 LLM 节点，写 System Prompt，选模型
6. 右边窗口测试几轮对话
7. 点右上角 **Publish**，搞定

发布后 Dify 自动生成：
- 一个可分享的网页链接
- 一套 REST API（带 Bearer Token 认证）
- 一段可嵌入的 iframe 代码

三种方式让你的 AI 应用立刻能用。
