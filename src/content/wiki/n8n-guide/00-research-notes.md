# n8n 深度研究笔记（电子书素材）

> 研究日期：2026-04-05
> 研究目的：为 JR Academy n8n 中文电子书提供素材基础
> 来源：n8n 官方文档、GitHub、多个技术博客、社区资源

---

本文件为完整研究笔记，涵盖8个研究方向的关键发现。

---

## 一、n8n 是什么

### 核心定位

n8n 是一个**工作流自动化平台**，采用"公平代码"（fair-code）许可证。它将 AI 能力与业务流程自动化结合，目标是让开发者和非技术人员都能构建复杂的自动化流程。

官方定位（来源：n8n.io）：
> "n8n is a developer-friendly workflow automation platform that combines the speed of no-code with the power and control of full-code orchestration along with AI native capabilities."

### 许可证说明

n8n 使用**公平代码（fair-code）**许可证，源代码公开可在自己基础设施上部署，但有使用限制：
- 社区版：完全免费，可自托管，无执行次数限制、无工作流数量限制
- 企业版：需要商业许可，适合大型组织

### 市场地位（2026年数据）

- 超过 9,000 个社区 workflow 模板
- 1,000+ 原生集成（另有 HTTP 节点可连任意 REST API）
- GitHub star 数量超过 50k
- 被 Delivery Hero、StepStone 等大型企业采用

**Delivery Hero 案例**（官方 case study）：通过 n8n 自动化 IT 运营工作流，每月节省 200+ 小时工作量。

**StepStone 案例**（官方 case study）：全公司运行 200+ 关键业务工作流，集成新数据源速度提升 25 倍，原来需要两周的工程工作缩短到几小时。

---

## 二、安装方式

### 方式1：Docker（官方推荐）

官方推荐 Docker，原因：隔离环境、避免系统依赖冲突、数据库管理更简单、升级更方便。

**最简单的 Docker 启动命令：**
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
```

访问：http://localhost:5678

**带持久化数据的 Docker 命令：**
```bash
docker volume create n8n_data

docker run -d \
  --name n8n \
  --restart unless-stopped \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  -e N8N_ENCRYPTION_KEY=your-encryption-key \
  docker.n8n.io/n8nio/n8n
```

### 方式2：Docker Compose（生产环境推荐）

官方仓库 `n8n-io/n8n-hosting` 提供标准配置，以下为含 PostgreSQL 的推荐生产配置：

**项目结构：**
```
n8n-compose/
├── docker-compose.yml
├── .env
└── local-files/      # 用于 n8n 与宿主机共享文件
```

**docker-compose.yml 核心结构（来源：github.com/n8n-io/n8n-hosting）：**
```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - db_storage:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -h localhost -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 10

  n8n:
    image: docker.n8n.io/n8nio/n8n:${N8N_VERSION}
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      DB_TYPE: postgresdb
      DB_POSTGRESDB_HOST: postgres
      DB_POSTGRESDB_PORT: 5432
      DB_POSTGRESDB_DATABASE: ${POSTGRES_DB}
      DB_POSTGRESDB_USER: ${POSTGRES_USER}
      DB_POSTGRESDB_PASSWORD: ${POSTGRES_PASSWORD}
      N8N_ENCRYPTION_KEY: ${N8N_ENCRYPTION_KEY}
      N8N_HOST: ${N8N_HOST}
      N8N_PORT: 5678
      N8N_PROTOCOL: https
      WEBHOOK_URL: ${WEBHOOK_URL}
      GENERIC_TIMEZONE: Asia/Shanghai
    volumes:
      - n8n_storage:/home/node/.n8n
      - ./local-files:/files
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  db_storage:
  n8n_storage:
```

**对应 .env 文件示例：**
```env
N8N_VERSION=latest
POSTGRES_USER=n8n
POSTGRES_PASSWORD=your_strong_password
POSTGRES_DB=n8n
N8N_ENCRYPTION_KEY=your_encryption_key_min_16_chars
N8N_HOST=your-domain.com
WEBHOOK_URL=https://your-domain.com/
```

**启动命令：**
```bash
docker compose up -d
```

**升级命令：**
```bash
docker pull docker.n8n.io/n8nio/n8n
docker compose up -d
```

### 方式3：npm 安装

**系统要求：** Node.js 18.x、20.x 或 22.x

```bash
# 全局安装
npm install -g n8n

# 启动
n8n start

# 更新
npm update -g n8n
# 或
npm install -g n8n@latest
```

访问：http://localhost:5678

### 方式4：n8n Cloud（托管服务）

- 官网：https://app.n8n.cloud
- 注册后可免费试用 14 天
- 无需自己维护服务器

**注册步骤：**
1. 访问 https://n8n.io/pricing/
2. 点击 "Start free trial"
3. 填写邮箱和密码注册
4. 验证邮箱
5. 开始创建 workflow

### 重要环境变量参考（来源：docs.n8n.io）

| 变量名 | 作用 | 示例值 |
|--------|------|--------|
| `N8N_ENCRYPTION_KEY` | 加密数据库中的凭证 | 随机16位以上字符串 |
| `N8N_HOST` | n8n 实例域名 | `n8n.example.com` |
| `N8N_PORT` | 端口号 | `5678` |
| `N8N_PROTOCOL` | 协议 | `https` |
| `WEBHOOK_URL` | Webhook 公开 URL | `https://n8n.example.com/` |
| `GENERIC_TIMEZONE` | 时区设置 | `Asia/Shanghai` |
| `DB_TYPE` | 数据库类型 | `postgresdb` 或 `sqlite` |
| `N8N_PAYLOAD_SIZE_MAX` | 最大 Payload 大小（MB） | `16`（默认） |

**数据库建议：**
- 本地测试：默认 SQLite，无需配置
- 生产环境：必须切换到 PostgreSQL

---

## 三、核心概念

### 3.1 Workflow（工作流）

一个 Workflow 是一组相互连接的节点，定义了数据如何在节点之间流动和处理。

**关键特性：**
- 每个 workflow 有唯一的 ID
- 有 Active（激活）和 Inactive（未激活）两种状态
- 激活后 Trigger 节点开始监听事件
- 可以手动触发、定时触发或通过事件触发

**操作方式：**
- 保存（Ctrl+S）
- 激活（右上角 toggle 开关）
- 手动执行（点击 "Execute Workflow"）

### 3.2 Node（节点）

Node 是 workflow 的基本构建单元，每个 node 执行一个特定操作。

**节点类型分类：**

| 类型 | 说明 | 例子 |
|------|------|------|
| **Trigger 节点** | 启动 workflow | Webhook、Schedule、Gmail Trigger |
| **Action 节点** | 执行操作 | 发邮件、写数据库、调 API |
| **Core 节点** | 控制流程 | If、Switch、Loop、Merge |
| **AI 节点** | AI 相关操作 | AI Agent、OpenAI、Claude |
| **Transform 节点** | 处理数据 | Code、Set、Function |

**节点操作：**
- 按 `N` 打开节点搜索面板
- 点击节点间的 `+` 号添加下一个节点
- 双击节点打开配置面板
- 节点右上角有执行状态指示器（绿色=成功，红色=失败）

### 3.3 Trigger（触发器）

Trigger 是特殊类型的节点，是每个 workflow 的起始点，负责监听事件并启动执行。

**常见 Trigger 类型：**

1. **Webhook Trigger** — 接收 HTTP 请求
   - 生成唯一 URL（如 `https://your-n8n.com/webhook/abc123`）
   - 支持 GET、POST、PUT、DELETE 等方法
   - 可设置身份验证（Basic Auth、Header Auth、JWT）

2. **Schedule Trigger** — 定时执行
   - 支持固定间隔（每X分钟/小时/天）
   - 支持 Cron 表达式（如 `0 9 * * 1-5` = 周一到周五早9点）
   - 使用 crontab.guru 可视化生成 cron 表达式

3. **Email Trigger（IMAP）** — 收到邮件时触发
4. **Chat Trigger** — AI 对话触发（用于 AI Agent）
5. **Manual Trigger** — 手动点击执行

**Cron 表达式格式（n8n 使用6位，含秒）：**
```
秒 分 时 日 月 星期
0  9  *  *  *   (每天09:00)
0  0  9  *  *  1-5 (周一到周五09:00)
*/5 * * * *     (每5分钟)
```

### 3.4 Credential（凭证）

Credential 是 n8n 安全存储第三方服务认证信息的机制。

**特点：**
- 加密存储（使用 `N8N_ENCRYPTION_KEY` 加密）
- 创建一次，多个 workflow 复用
- 支持 API Key、OAuth2、基础认证等多种类型

**添加 Credential 步骤：**
1. 点击节点配置面板中的 "Credential" 下拉框
2. 选择 "Create New Credential"
3. 填写认证信息（如 API Key）
4. 保存后可在所有 workflow 中使用

### 3.5 Execution（执行）

Execution 是 workflow 运行一次的完整记录。

**包含信息：**
- 执行时间和状态（成功/失败/等待中）
- 每个节点的输入数据和输出数据
- 错误信息（如有）
- 执行耗时

**查看方式：**
- 左侧菜单 "Executions" 查看历史记录
- 当前 workflow 界面右上角查看最近执行
- 点击具体执行可查看每个节点的数据流

### 3.6 数据结构

n8n 内部数据格式为 **JSON 数组**，每个 item 代表一条记录：

```json
[
  {
    "json": {
      "name": "张三",
      "email": "zhangsan@example.com",
      "score": 95
    }
  },
  {
    "json": {
      "name": "李四",
      "email": "lisi@example.com",
      "score": 87
    }
  }
]
```

大多数节点对每个 item 单独处理（"For Each Item" 模式）。

---

## 四、5个最常用 Workflow 案例

### 案例1：自动化邮件处理 + 任务创建

**场景：** 收到客户邮件 → AI 分析内容 → 在 Notion/Jira 创建任务

**节点流程：**
```
Gmail Trigger → OpenAI (分类/摘要) → If (判断优先级) → Notion (创建任务)
                                                       → Slack (高优先级通知)
```

**实现步骤：**
1. 添加 **Gmail Trigger** 节点
   - 配置 Gmail OAuth2 凭证
   - 设置触发条件：New Email
   - 可设置过滤器（只处理某个标签下的邮件）

2. 添加 **OpenAI** 节点
   - 操作：Message a Model
   - 模型：gpt-4o
   - Prompt：`分析以下邮件，输出JSON格式：{category: 类别, priority: 优先级(high/medium/low), summary: 摘要(50字以内)}`
   - 输入：`{{ $json.text }}`（邮件正文）

3. 添加 **Code** 节点（解析 JSON 响应）
   ```javascript
   const response = JSON.parse($json.choices[0].message.content);
   return { json: { ...response, emailId: $("Gmail Trigger").item.json.id } };
   ```

4. 添加 **If** 节点
   - 条件：`{{ $json.priority }}` equals `high`

5. True 分支：**Notion** 节点（创建数据库记录）
6. 同时：**Slack** 节点（发送高优先级通知）

---

### 案例2：表单提交 → CRM 录入 + 自动回复

**场景：** 网站表单提交 → 存入 HubSpot → 发送欢迎邮件

**节点流程：**
```
Webhook → HubSpot (创建/更新 Contact) → Gmail (发送欢迎邮件) → Google Sheets (备份记录)
```

**实现步骤：**
1. **Webhook** 节点
   - HTTP 方法：POST
   - 复制 webhook URL 填入网站表单的 action
   - 响应模式：设为 "Respond to Webhook"（立即返回200）

2. **HubSpot** 节点
   - 操作：Create or Update Contact
   - Email：`{{ $json.body.email }}`
   - First Name：`{{ $json.body.name }}`
   - 自定义字段可以通过 "Additional Fields" 添加

3. **Gmail** 节点
   - 操作：Send Email
   - To：`{{ $json.body.email }}`
   - Subject：欢迎加入 JR Academy！
   - Body：使用 HTML 模板（可用 `{{ $json.body.name }}` 插入姓名）

4. **Google Sheets** 节点
   - 操作：Append Row
   - 将所有字段追加到备份表格

---

### 案例3：定时抓取数据 + 报告生成

**场景：** 每天早上9点抓取竞品价格/社交媒体数据 → 生成报告 → 发送邮件

**节点流程：**
```
Schedule Trigger → HTTP Request (抓取数据) → Code (处理数据) → OpenAI (生成报告) → Gmail (发报告)
```

**实现步骤：**
1. **Schedule Trigger** 节点
   - Trigger Interval：Days
   - Days Between Triggers：1
   - Trigger at Hour：9am
   - Trigger at Minute：0

2. **HTTP Request** 节点
   - 方法：GET
   - URL：目标 API 或网页
   - 如需认证：在 Header Parameters 添加 `Authorization: Bearer xxx`

3. **Code** 节点（数据处理）
   ```javascript
   // 处理所有数据，返回摘要
   const items = $input.all();
   const data = items.map(item => item.json);
   
   const summary = {
     total: data.length,
     avgPrice: data.reduce((sum, d) => sum + d.price, 0) / data.length,
     date: new Date().toLocaleDateString('zh-CN')
   };
   
   return [{ json: summary }];
   ```

4. **OpenAI** 节点
   - 输入摘要数据，生成中文报告

5. **Gmail** 节点发送报告

---

### 案例4：AI 客服自动回复

**场景：** Telegram/WhatsApp 消息 → AI 分析 → 自动回复（有历史记忆）

**节点流程：**
```
Telegram Trigger → AI Agent [OpenAI + Memory Buffer + Tools] → Telegram (回复)
```

**实现步骤：**
1. **Telegram Trigger** 节点
   - 配置 Bot Token（从 @BotFather 获取）
   - 触发：Message

2. **AI Agent** 节点（核心）
   - Chat Model：连接 OpenAI Chat Model 子节点
   - Memory：连接 Window Buffer Memory 子节点（记住最近N条对话）
   - System Prompt：定义 AI 角色和回复规范

3. **OpenAI Chat Model** 子节点（连接到 AI Agent）
   - 选择已有 OpenAI 凭证
   - 模型：gpt-4o-mini（成本低，适合客服）
   - Temperature：0.7

4. **Window Buffer Memory** 子节点
   - 设置 Context Window Length（建议 10）
   - 自动按 session ID 隔离不同用户的对话历史

5. **Telegram** 节点（回复）
   - 操作：Send Message
   - Chat ID：`{{ $("Telegram Trigger").item.json.message.chat.id }}`
   - Text：`{{ $json.output }}`（AI 的回答）

---

### 案例5：GitHub → Slack 发布通知

**场景：** GitHub 有新的 PR merged → 发送 Slack 通知

**节点流程：**
```
Webhook (GitHub) → If (检查事件类型) → Slack (发送通知)
```

**实现步骤：**
1. **Webhook** 节点
   - 复制 URL，到 GitHub repo → Settings → Webhooks → Add webhook
   - Content type：application/json
   - 选择触发事件：Pull requests

2. **If** 节点
   - 条件：`{{ $json.body.action }}` equals `closed`
   - AND：`{{ $json.body.pull_request.merged }}` equals `true`

3. **Slack** 节点（True 分支）
   - 操作：Send Message
   - Channel：#deployments
   - Message：
     ```
     :rocket: *PR Merged!*
     *{{ $json.body.pull_request.title }}*
     作者：{{ $json.body.pull_request.user.login }}
     链接：{{ $json.body.pull_request.html_url }}
     ```

---

## 五、AI Agent 节点详解

### 5.1 AI Agent 节点架构（来源：docs.n8n.io）

n8n 的 AI 功能基于 **LangChain JavaScript 框架**构建，包含70+ AI 节点。

**AI Agent 工作流的4个必要组件：**

1. **Trigger 节点** — 启动执行（Chat Trigger 最常用于 AI Agent）
2. **AI Agent 节点** — 核心编排层，使用 LangChain 推理引擎
3. **Sub-nodes（子节点）** — 连接到 AI Agent，提供具体能力：
   - Language Model（语言模型）：必需，提供 AI 能力
   - Memory（记忆）：可选，保持对话历史
   - Tool（工具）：可选，让 AI 可以调用外部服务
4. **Output 节点** — 处理 AI 回应并路由到下游

### 5.2 接入 OpenAI

**步骤1：创建 OpenAI Credential**
1. 在 n8n 左侧菜单 → Credentials → Add Credential
2. 搜索 "OpenAI"
3. 填写 API Key（从 platform.openai.com → Settings → API Keys 获取）
4. 保存凭证

**注意事项（来源：社区文档）：**
- API Key 必须包含 `sk-` 前缀
- 不要填写到 "Organization ID" 字段
- 确认 OpenAI 账号有余额（有效的支付方式）
- 保存后 n8n 会显示绿色验证成功提示

**步骤2：添加 OpenAI Chat Model 子节点**
1. 在 AI Agent 节点的 "Chat Model" 插槽，点击 `+`
2. 搜索 "OpenAI Chat Model"
3. 选择之前创建的 OpenAI Credential
4. 配置参数：
   - Model：`gpt-4o`（推荐），`gpt-4o-mini`（低成本），`gpt-4-turbo`
   - Temperature：0（确定性）到 1（创意性）
   - Max Tokens：可选，限制输出长度

### 5.3 接入 Claude（Anthropic）

**步骤1：创建 Anthropic Credential**
1. n8n Credentials → Add Credential → 搜索 "Anthropic"
2. 填写 API Key（从 console.anthropic.com 获取）

**步骤2：添加 Anthropic Chat Model 子节点**
- 模型选项：`claude-3-5-sonnet-20241022`（最新高性能），`claude-3-haiku-20240307`（最快最省钱）
- Claude 特别适合需要处理长文档的场景（200k token 上下文窗口）
- Claude 使用 XML 标签组织 prompt 效果最佳：
  ```xml
  <instructions>你是一个专业的客服助手</instructions>
  <context>{{ $json.companyInfo }}</context>
  <user_message>{{ $json.chatInput }}</user_message>
  ```

### 5.4 Memory 节点

**Window Buffer Memory**（最常用）
- 保存最近 N 条对话
- 按 Session ID 自动区分不同用户
- 配置：Context Window Length（建议 10-20）

**其他 Memory 类型：**
- Redis Chat Memory（持久化，适合生产环境）
- Postgres Chat Memory（存入 PostgreSQL）
- Zep Memory（向量搜索记忆）

### 5.5 Tool 节点（给 AI 加"工具"）

Tool 节点让 AI Agent 可以调用外部服务，AI 自主决定何时调用哪个工具。

**常用 Tool 节点：**
- **Calculator Tool** — 数学计算
- **HTTP Request Tool** — 调用任意 REST API
- **Wikipedia Tool** — 搜索维基百科
- **Google Calendar Tool** — 读写日历
- **Code Tool** — 执行自定义 JavaScript

**配置示例：给 AI Agent 添加天气查询工具**
1. 在 AI Agent 节点的 "Tools" 插槽点击 `+`
2. 搜索 "HTTP Request Tool"
3. 配置：
   - Tool Name：`get_weather`（AI 通过这个名字决定调用）
   - Description：`获取指定城市的天气信息，输入城市名称`（很重要！AI 根据描述决定何时用）
   - Method：GET
   - URL：`https://api.weather.com/...`

### 5.6 AI Agent 实战：构建一个能查邮件的 AI 助手

**workflow 结构：**
```
Chat Trigger
  └── AI Agent
        ├── [Chat Model] OpenAI gpt-4o
        ├── [Memory] Window Buffer Memory
        └── [Tool] Gmail Tool (读取邮件)
        └── [Tool] Calculator Tool
```

**System Prompt 示例：**
```
你是 JR Academy 的智能助手。你可以：
1. 查询最新邮件并总结
2. 回答关于课程的问题
3. 进行简单计算

请用中文回答，保持简洁专业。
```

**测试方法：**
点击 canvas 底部的 "Chat" 按钮，打开测试对话窗口，直接输入问题测试。

---

## 六、进阶技巧

### 6.1 Code 节点

Code 节点允许在 workflow 中执行任意 JavaScript 代码，是 n8n 最灵活的节点。

**两种运行模式：**

**模式1：Run Once for Each Item（默认）**
- 对每个输入 item 独立执行一次代码
- 用 `$json` 访问当前 item 的数据
- 返回 `return item` 或修改后的数据

```javascript
// 示例：给每条记录添加全名字段
const item = $json;
item.fullName = `${item.firstName} ${item.lastName}`;
item.processedAt = new Date().toISOString();
return item;
```

**模式2：Run Once for All Items**
- 所有 items 作为数组传入，代码只执行一次
- 用 `$input.all()` 获取所有 items
- 必须返回数组

```javascript
// 示例：对所有数据进行统计
const items = $input.all();
const data = items.map(item => item.json);

const result = {
  total: data.length,
  sum: data.reduce((acc, d) => acc + (d.amount || 0), 0),
  average: data.reduce((acc, d) => acc + (d.amount || 0), 0) / data.length
};

return [{ json: result }];
```

**表达式语法（在任意节点字段中使用）：**
```javascript
// 引用上一个节点的数据
{{ $json.fieldName }}

// 引用指定节点的数据
{{ $("节点名称").item.json.fieldName }}

// 字符串拼接
{{ "你好，" + $json.name + "！" }}

// 时间格式化
{{ $now.toFormat("yyyy-MM-dd") }}

// 条件表达式
{{ $json.score >= 60 ? "通过" : "未通过" }}
```

**内置变量（来源：docs.n8n.io）：**

| 变量 | 说明 |
|------|------|
| `$json` | 当前 item 的 JSON 数据 |
| `$input.all()` | 所有 input items 数组 |
| `$("节点名").item.json` | 指定节点的当前 item |
| `$("节点名").all()` | 指定节点的所有 items |
| `$now` | 当前时间（Luxon 对象） |
| `$env.变量名` | 环境变量 |
| `$workflow.id` | 当前 workflow ID |
| `$execution.id` | 当前执行 ID |

### 6.2 错误处理

**方法1：节点级别的 Continue on Fail**
- 在节点设置中开启 "Continue On Fail"
- 节点出错时不停止 workflow，继续执行后续节点
- 通过 Error Output 分支处理错误

**方法2：全局 Error Workflow（推荐生产环境）**

步骤：
1. 新建一个专用的 Error Handler workflow
2. 第一个节点选择 **Error Trigger**
3. 在 Error Trigger 后添加通知节点（Slack/邮件等）
4. 可以发送：workflow 名称、错误信息、执行 ID 等

```
Error Trigger → Slack (发送错误通知)
             → 可选：写入日志到 Google Sheets
```

在主 workflow 中关联：
- workflow 设置 → Error Workflow → 选择错误处理 workflow

**Error Trigger 的数据格式：**
```json
{
  "workflow": {
    "id": "xxx",
    "name": "我的工作流"
  },
  "execution": {
    "id": "yyy",
    "url": "https://n8n.example.com/execution/yyy"
  },
  "error": {
    "message": "具体错误信息",
    "node": "出错的节点名"
  }
}
```

**方法3：Retry on Fail 设置**
- 在节点设置中开启 "Retry On Fail"
- Max Tries：最多重试次数（建议2-3次）
- Wait Between Tries（ms）：重试间隔
- 注意：仅当 "On Error" 设为 "Stop Workflow" 时，Retry 才会生效

### 6.3 Webhook 配置进阶

**Webhook URL 格式：**
- 测试 URL（开发用）：`https://your-n8n.com/webhook-test/path`
- 生产 URL（激活后）：`https://your-n8n.com/webhook/path`

**身份验证类型：**
1. **None** — 无验证（慎用）
2. **Basic Auth** — 用户名+密码
3. **Header Auth** — 在 Header 中传静态 token（如 `X-API-Key: xxx`）
4. **JWT Auth** — 验证签名的 JWT token

**立即响应模式（推荐）：**

处理耗时操作时，应立即返回 202 避免超时（n8n Cloud Webhook 超时限制：100秒）：

```
Webhook → Respond to Webhook (立即返回202) → [继续处理业务逻辑]
```

配置：
1. Webhook 节点 → Response Mode：选择 "Using 'Respond to Webhook' Node"
2. 添加 **Respond to Webhook** 节点
3. 在 Respond to Webhook 节点设置状态码和响应体

**IP 白名单：**
- 在 Webhook 节点设置中，可以填写允许的 IP 地址列表
- 其他 IP 的请求会收到 403 错误

### 6.4 Schedule Trigger 进阶

**常用 Cron 表达式示例：**
```bash
0 9 * * 1-5     # 周一到周五每天上午9点
0 */2 * * *     # 每2小时
*/15 * * * *    # 每15分钟
0 8 1 * *       # 每月1号上午8点
0 9,18 * * *    # 每天9点和18点
```

**时区注意事项：**
- n8n 默认使用系统时区
- 通过 `GENERIC_TIMEZONE=Asia/Shanghai` 设置为上海时区
- 也可在每个 workflow 的设置中单独指定时区

### 6.5 节点之间传递数据的技巧

```javascript
// 合并多个节点的数据（在 Code 节点中）
const nodeA = $("HTTP Request").all();
const nodeB = $("Google Sheets").all();

const merged = nodeA.map((item, i) => ({
  json: {
    ...item.json,
    ...(nodeB[i] ? nodeB[i].json : {})
  }
}));

return merged;
```

**使用 Merge 节点：**
- 模式1：Merge by Index（按顺序合并）
- 模式2：Merge by Key（按某个字段匹配合并，类似 SQL JOIN）
- 模式3：Multiplex（笛卡尔积）

---

## 七、与其他工具对比

### 7.1 总体对比表（来源：多个独立评测，2026年数据）

| 维度 | n8n | Zapier | Make（前 Integromat） |
|------|-----|--------|----------------------|
| **开源** | 公平代码，可自托管 | 否，纯 SaaS | 否，纯 SaaS |
| **集成数量** | ~1,000 原生 + 无限 HTTP | 8,000+ | 1,500+ |
| **界面** | 节点式画布，技术感强 | 线性向导，最易上手 | 画布式，中等难度 |
| **学习曲线** | 中等偏高（需要技术背景） | 低（无需技术） | 中等 |
| **定价模式** | 按执行次数（自托管免费） | 按 Tasks 数量 | 按 Operations 数量 |
| **免费方案** | 社区版自托管完全免费 | 有限免费层（100任务/月） | 有限免费层 |
| **AI 能力（2026）** | 最强，70+ AI节点，原生 LangChain | Zapier Agents | Maia AI助手 |
| **自托管** | 支持 | 不支持 | 不支持 |
| **代码灵活性** | Code Node（全功能 JS） | 有限的代码步骤 | 有限的代码步骤 |
| **错误处理** | 完善（Error Workflow） | 基础 | 中等 |

### 7.2 定价详细对比（2026年）

**n8n Cloud 定价：**
| 计划 | 价格 | 执行次数 | 适用场景 |
|------|------|----------|----------|
| Starter | €24/月 | 2,500次/月 | 小团队入门 |
| Pro | €60/月 | 10,000次/月 | 成长型团队 |
| Business | €800/月 | 40,000次/月 | 大型组织 |
| 社区版（自托管） | 免费 | 无限制 | 技术团队 |

**重要更新（2026年3月）：** n8n 移除了所有方案的活跃工作流数量限制，所有计划均支持无限工作流，只按执行次数计费。

**Zapier 定价参考（2026年）：**
- Free：100 Tasks/月
- Starter：$19.99/月，750 Tasks
- Professional：$49/月，2,000 Tasks
- Team：$69/月，2,000 Tasks（多成员）

**Make 定价参考（2026年）：**
- Free：1,000 Operations/月
- Core：$9/月，10,000 Operations
- Pro：$16/月，10,000 Operations（更多高级功能）

**成本比较：** n8n 自托管方案在中等到大型业务量下远比 Zapier 便宜。以每月运行 10,000 次执行为例，n8n 自托管仅需 VPS 费用（约 $5-20/月），Zapier 需要 $49+/月。

### 7.3 如何选择

**选 n8n 当：**
- 有一定技术背景（会用命令行、懂 JSON）
- 需要 AI Agent 深度集成
- 数据安全/合规要求高（需要自托管）
- 业务量大，需要控制成本
- 需要复杂的条件逻辑和自定义代码

**选 Zapier 当：**
- 完全非技术背景
- 需要连接冷门 SaaS 工具（Zapier 8000+ 集成覆盖最广）
- 团队成员不想碰任何技术
- 快速验证想法，不在乎成本

**选 Make 当：**
- 介于两者之间：想要可视化，又不满足于 Zapier 的简单
- 预算有限但不想自托管
- 欧洲团队（Make 是欧洲公司，GDPR 合规更好）

---

## 八、MCP / Claude 集成

### 8.1 n8n 原生 MCP 支持（官方）

n8n 官方提供了 MCP Server 功能，允许 AI 工具直接通过 MCP 协议与 n8n 通信。

**官方文档地址：** https://docs.n8n.io/advanced-ai/accessing-n8n-mcp-server/

该功能让 Claude Desktop、Claude Code、Cursor 等支持 MCP 的 AI 工具可以：
- 直接创建和编辑 n8n workflow
- 触发 workflow 执行并查看结果
- 查看执行历史和调试错误

### 8.2 n8n-MCP 开源项目（社区）

**GitHub 地址：** https://github.com/czlonkowski/n8n-mcp

这是一个第三方 MCP 服务器，作为 n8n 和 AI 助手之间的桥梁，提供：
- 1,396 个 n8n 节点的完整文档（812 核心 + 584 社区）
- 2,709 个 workflow 模板，100% 元数据覆盖
- 节点属性和操作的详细 schema

**安装方式1：npx（最快）**
```bash
# 前提：已安装 Node.js
npx n8n-mcp
```

**在 Claude Desktop 中配置（macOS）：**
编辑 `~/Library/Application Support/Claude/claude_desktop_config.json`：
```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": ["n8n-mcp"],
      "env": {
        "MCP_MODE": "stdio",
        "LOG_LEVEL": "error",
        "DISABLE_CONSOLE_OUTPUT": "true"
      }
    }
  }
}
```

**注意：** `MCP_MODE: "stdio"` 是必需的，缺少会导致 JSON 解析错误。

**安装方式2：Docker**
```bash
docker pull ghcr.io/czlonkowski/n8n-mcp:latest
```

Claude Desktop Docker 配置：
```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--init",
        "-e", "MCP_MODE=stdio",
        "-e", "LOG_LEVEL=error",
        "-e", "DISABLE_CONSOLE_OUTPUT=true",
        "ghcr.io/czlonkowski/n8n-mcp:latest"
      ]
    }
  }
}
```

**连接本地 n8n 实例（可让 AI 直接操作 workflow）：**
在 env 中添加：
```json
"env": {
  "MCP_MODE": "stdio",
  "N8N_API_URL": "http://localhost:5678",
  "N8N_API_KEY": "从n8n设置中获取的API密钥"
}
```

本地 Docker 中的 n8n 用：`http://host.docker.internal:5678`

**安装方式3：托管服务（dashboard.n8n-mcp.com）**
- 无需安装，直接访问
- 免费层：每天 100 次工具调用
- 始终保持最新节点库

**禁用遥测：**
```bash
npx n8n-mcp telemetry disable
```

### 8.3 用 Claude Code + n8n-MCP 的工作流程

1. 启动 Claude Code，确保 n8n-MCP 已配置
2. 用自然语言描述需要的 workflow：
   ```
   帮我创建一个 n8n workflow：
   每天早上9点运行，从 RSS feed 抓取最新文章，
   用 AI 摘要每篇文章，发送到 Slack #daily-news 频道
   ```
3. Claude Code 通过 n8n-MCP 工具：
   - 查询相关节点文档
   - 生成 workflow JSON
   - 可直接导入到 n8n 实例

**安全警告（来源：n8n-MCP README）：**
> 永远不要用 AI 工具直接编辑生产环境的 workflow！
> 始终先在测试环境验证，确认无误后再部署到生产。

### 8.4 n8n 与 Claude 直接集成（通过 API 节点）

无需 MCP，n8n 也可以通过 HTTP Request 节点直接调用 Claude API：

**HTTP Request 节点配置：**
- 方法：POST
- URL：`https://api.anthropic.com/v1/messages`
- Headers：
  - `x-api-key`：你的 Anthropic API Key
  - `anthropic-version`：`2023-06-01`
  - `content-type`：`application/json`
- Body（JSON）：
  ```json
  {
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [
      {
        "role": "user",
        "content": "{{ $json.userMessage }}"
      }
    ]
  }
  ```

**或者使用 n8n 原生 Anthropic 节点：**
- 节点搜索中找 "Anthropic"
- 支持：Message Claude、Analyze Document 等操作
- 直接填写 API Key 即可，无需手动配置 HTTP headers

---

## 九、学习路径建议

### 新手路线（0 → 能独立搭建 workflow）

1. **第1天** — 安装 n8n（推荐 npm 本地安装）+ 熟悉界面
2. **第2-3天** — 跟着官方 "Build your first workflow" 教程（docs.n8n.io/try-it-out/）
3. **第1周** — 完成案例1-3（邮件处理、表单录入、定时任务）
4. **第2周** — 学习 AI Agent 节点，完成案例4（AI 客服）
5. **第3周** — Code 节点、错误处理、Webhook 进阶
6. **第4周** — 部署到 VPS（Docker Compose），连接生产数据库

### 推荐学习资源

**官方资源（英文）：**
- 官方文档：https://docs.n8n.io/
- 学习路径：https://docs.n8n.io/learning-path/
- 视频课程：https://docs.n8n.io/courses/level-one/
- Workflow 模板库：https://n8n.io/workflows/

**中文资源：**
- n8n 中文学习社区：https://n8n.akashio.com/
- GitHub 中文教程：https://github.com/eleven-h/n8n
- 知乎专栏：搜索"n8n 教程"

---

## 十、关键数据汇总（用于书中引用）

| 数据点 | 数据 | 来源 |
|--------|------|------|
| 社区 workflow 模板数量 | 9,000+ | n8n.io/workflows 2026年4月 |
| 原生集成数量 | ~1,000 | 官方文档 |
| Zapier 集成数量 | 8,000+ | Zapier 官网 |
| Make 集成数量 | 1,500+ | Make 官网 |
| n8n AI 节点数量 | 70+ | 官方文档 |
| n8n-MCP 节点覆盖 | 1,396 | github.com/czlonkowski/n8n-mcp |
| n8n-MCP Workflow 模板 | 2,709 | 同上 |
| n8n Cloud Starter 价格 | €24/月 | n8n.io/pricing 2026年 |
| n8n Cloud Pro 价格 | €60/月 | n8n.io/pricing 2026年 |
| n8n Cloud Business 价格 | €800/月 | n8n.io/pricing 2026年 |
| Webhook 超时限制（Cloud） | 100秒 | 官方文档 |
| 最大 Payload 大小 | 16MB（可改） | 官方文档 |
| 支持的 Node.js 版本 | 18.x, 20.x, 22.x | npm 安装文档 |
| 推荐生产数据库 | PostgreSQL | 官方文档 |

---

## 十一、注意事项与常见误区

1. **n8n 没有官方中文版** — 社区有汉化版但非官方支持，建议用英文版

2. **执行次数计算** — n8n Cloud 按"workflow 执行次数"计费，不是按节点步骤，与 Zapier 的 Tasks 概念不同

3. **Webhook 测试 URL vs 生产 URL** — 开发时用 Test URL，发布激活后才能用 Production URL

4. **Code 节点版本** — n8n 使用 Node.js，代码在沙盒中执行，不能访问文件系统，不能使用需要安装的 npm 包（除非自托管并配置）

5. **Credential 加密** — 一定要设置 `N8N_ENCRYPTION_KEY`，丢失后所有凭证都无法解密

6. **AI Agent 的 Human-in-the-Loop** — n8n 支持在 AI workflow 的任意节点插入人工审批节点（Wait 节点 + 审批通知），避免 AI 出错

7. **生产环境 SQLite 的风险** — SQLite 不支持并发，高并发场景会导致数据丢失，必须用 PostgreSQL
