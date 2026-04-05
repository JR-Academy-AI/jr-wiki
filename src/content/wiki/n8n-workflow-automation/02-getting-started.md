---
title: "安装与快速上手：5 分钟跑起第一个工作流"
wiki: "n8n-workflow-automation"
order: 2
description: "三种安装方式 + 手把手创建第一个自动化工作流"
---

n8n 有三种安装方式，选最适合你的场景即可。

## 方式一：npx 快速体验（推荐新手）

只需要 Node.js 18+，无需任何配置：

```bash
npx n8n
```

运行后打开浏览器访问 `http://localhost:5678`，就能看到 n8n 编辑器。

> 注意：npx 方式每次关闭终端数据会丢失（存在临时目录）。正式使用建议 Docker 方式。

## 方式二：Docker 自托管（推荐生产）

官方 Docker 镜像，数据持久化：

```bash
# 创建持久化数据卷
docker volume create n8n_data

# 运行 n8n
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
```

访问 `http://localhost:5678` 即可。

**docker-compose 方式**（推荐，方便管理）：

```yaml
version: "3"
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your_password
      - WEBHOOK_URL=https://your-domain.com/
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
```

```bash
docker-compose up -d
```

## 方式三：n8n Cloud（无需服务器）

直接访问 [n8n.io/cloud](https://n8n.io/cloud) 注册，有免费试用。不需要维护服务器，适合快速验证想法。

---

## 5 分钟创建第一个工作流

用一个真实场景入门：**当 Webhook 收到请求时，自动发 Slack 消息**。

### Step 1：打开编辑器，新建 Workflow

访问 `http://localhost:5678`，点击右上角 **New workflow**。

### Step 2：添加 Webhook Trigger 节点

点击画布中央的 **+**，搜索 `Webhook`，选择 **Webhook** 节点。

配置：
- **HTTP Method**：POST
- **Path**：`/my-first-webhook`（自定义路径）
- 点击 **Test URL** 复制测试地址

![Webhook 节点配置示意](https://docs.n8n.io/images/webhook-config.png)

### Step 3：添加 Slack 节点

点击 Webhook 节点右侧的 **+**，搜索 `Slack`，选择 **Send a message** 操作。

配置：
- **Credential**：点击 Add，输入 Slack Bot Token（从 Slack App 管理页获取）
- **Channel**：`#general`（或你的频道 ID）
- **Message**：`收到新请求: {{ $json.body.message }}`（用表达式引用传入的数据）

### Step 4：测试运行

1. 点击 Webhook 节点，点击 **Listen for test event**
2. 用 curl 发送测试请求：

```bash
curl -X POST http://localhost:5678/webhook-test/my-first-webhook \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from n8n!"}'
```

3. 看到 n8n 编辑器里节点变绿，Slack 收到消息 — 工作流跑通了。

### Step 5：激活 Workflow

点击右上角 **Inactive** 切换为 **Active**，工作流就正式运行了。之后所有发到该 Webhook 的请求都会自动触发。

---

## 核心概念速览

| 概念 | 说明 |
|------|------|
| **Workflow** | 一个自动化流程，由多个节点组成 |
| **Node** | 单个功能单元，可以是触发器、操作、或数据处理 |
| **Trigger** | 工作流的起点，比如 Webhook、定时任务、邮件到达 |
| **Credential** | API Key 等认证信息，加密存储，可在多个 workflow 复用 |
| **Execution** | 工作流每次运行的记录，可查看输入/输出和错误 |
| **Expression** | `{{ }}` 语法，动态引用其他节点的数据 |

表达式示例：
```
{{ $json.body.email }}         // 引用当前节点的输入数据
{{ $node["HTTP Request"].json.data }}  // 引用指定节点的输出
{{ $now.format('YYYY-MM-DD') }}  // 当前日期格式化
```
