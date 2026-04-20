---
title: "进阶技巧与常见问题"
wiki: "n8n-workflow-automation"
order: 5
description: "Code Node 深度使用、错误处理、生产部署要点，以及 FAQ"
---

掌握了基础节点之后，这些技巧能让你的工作流更健壮、更高效。

![n8n Code Node 和 Error Handling 是生产环境的核心能力](https://raw.githubusercontent.com/n8n-io/n8n/master/assets/n8n-screenshot.png)

## Code Node：写真实代码

n8n 的 Code Node 是它区别于 Zapier 最大的武器。支持完整的 JavaScript（Node.js 18）和 Python，能 `require` npm 包。

### 处理复杂数据转换

```javascript
// 场景：把嵌套的 API 响应铺平为二维表格
const input = $input.first().json;
const users = input.data.users;

return users.flatMap(user => 
  user.orders.map(order => ({
    json: {
      userId: user.id,
      userName: user.name,
      orderId: order.id,
      amount: order.amount,
      date: new Date(order.createdAt).toLocaleDateString('zh-CN')
    }
  }))
);
```

### 使用 npm 包

在 Code Node 里可以直接 require 已安装的包（n8n 内置了常用库）：

```javascript
// 日期处理
const { DateTime } = require('luxon');
const formatted = DateTime.now().setZone('Asia/Shanghai').toFormat('yyyy-MM-dd HH:mm');

// 加密
const crypto = require('crypto');
const hash = crypto.createHmac('sha256', 'secret').update($json.data).digest('hex');

// JSON Schema 校验
const Ajv = require('ajv');
const ajv = new Ajv();
const valid = ajv.validate({ type: 'object', required: ['email'] }, $json);
```

### Python Code Node

```python
# n8n 也支持 Python（需要服务器安装 Python）
import json
from datetime import datetime

items = _input.all()
results = []

for item in items:
    data = item.json
    results.append({
        'json': {
            'processed_at': datetime.now().isoformat(),
            'original': data,
            'word_count': len(data.get('content', '').split())
        }
    })

return results
```

---

## 错误处理

### 方式一：Error Trigger 工作流

创建一个独立的"错误处理工作流"，所有工作流的报错都汇集到这里：

1. 新建 workflow，添加 **Error Trigger** 节点（而不是普通 trigger）
2. 连接 Slack 节点，发送报警通知
3. 在每个生产工作流的 Settings 里，设置 **Error Workflow** 指向这个工作流

```
Error Trigger
    ↓
Slack: "⚠️ 工作流 {{ $json.workflow.name }} 报错
        错误: {{ $json.execution.error.message }}
        时间: {{ $now.format('YYYY-MM-DD HH:mm') }}
        执行ID: {{ $json.execution.id }}"
```

### 方式二：节点级别的 Try/Catch

在 Settings 里开启每个节点的 **Continue on Fail**，然后用 IF 节点检查是否有错误：

```
HTTP Request（Continue on Fail: ON）
    ↓
IF: {{ $json.error }} 存在
  ├── True → 记录错误到数据库
  └── False → 继续正常流程
```

### 方式三：Code Node 里 try-catch

```javascript
try {
  const response = await fetch($json.url);
  const data = await response.json();
  return [{ json: { success: true, data } }];
} catch (error) {
  return [{ json: { success: false, error: error.message } }];
}
```

---

## Webhook 安全配置

生产环境的 Webhook 要做鉴权，防止被随意调用。

**方式一：Header 鉴权**

在 Webhook 节点开启 **Header Auth**：

```
Authentication: Header Auth
Name: X-Webhook-Secret
Value: your-secret-token-here
```

调用方需要在请求 Header 里加 `X-Webhook-Secret: your-secret-token-here`，否则 403。

**方式二：验证 GitHub/Stripe 的签名**

```javascript
// Code 节点：验证 GitHub Webhook 签名
const crypto = require('crypto');
const signature = $json.headers['x-hub-signature-256'];
const payload = JSON.stringify($json.body);
const secret = 'your-github-webhook-secret';

const expected = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expected) {
  throw new Error('Invalid signature — 请求被拒绝');
}

return $input.all(); // 验证通过，继续流程
```

---

## 生产部署要点

### 环境变量管理

敏感配置通过环境变量注入，不要硬编码在工作流里：

```bash
# docker-compose.yml 的 environment 部分
- N8N_ENCRYPTION_KEY=your-32-char-encryption-key  # 必须设置
- DB_TYPE=postgresdb                               # 使用 PG 存储工作流
- DB_POSTGRESDB_HOST=postgres
- DB_POSTGRESDB_DATABASE=n8n
- DB_POSTGRESDB_USER=n8n_user
- DB_POSTGRESDB_PASSWORD=secure_password
- WEBHOOK_URL=https://n8n.yourcompany.com
```

在工作流里引用环境变量：
```
{{ $env.MY_API_KEY }}
```

### 定期备份

```bash
# 备份 n8n 数据（包含所有工作流、credentials、执行历史）
docker exec n8n n8n export:workflow --all --output=/tmp/workflows.json
docker exec n8n n8n export:credentials --all --output=/tmp/credentials.json
docker cp n8n:/tmp/workflows.json ./backups/
```

### 性能优化

- **执行历史保留天数**：`EXECUTIONS_DATA_MAX_AGE=30`（默认保留所有，数据库会很大）
- **并发执行数**：`N8N_CONCURRENCY_PRODUCTION_LIMIT=20`
- **Queue Mode**：高并发场景用 Redis Queue 模式，支持多 worker 水平扩展

---

## 常见问题（FAQ）

**Q: n8n 支持多少并发执行？**

默认单进程模式没有硬限制，取决于服务器性能。生产推荐用 Queue Mode（Redis + 多 worker），可以无限水平扩展。

**Q: Webhook 在本地跑，外部服务怎么访问？**

用 ngrok 或 Cloudflare Tunnel 把本地端口暴露到公网：
```bash
ngrok http 5678
# 得到类似 https://abc123.ngrok.io 的地址
# 在 n8n 里设置 WEBHOOK_URL=https://abc123.ngrok.io
```

**Q: Credential 怎么在多个 workflow 里共享？**

Credential 是全局的，创建一次后所有 workflow 都能选择使用，不需要重复填写。Credential 数据加密存储（用 `N8N_ENCRYPTION_KEY` 加密）。

**Q: 工作流的版本控制怎么做？**

用 n8n 内置的 **Source Control** 功能（Git 集成），Settings → Source Control → 连接 Git 仓库，可以把工作流定义 push 到 Git，实现版本控制和团队协作。

**Q: 如何调试 Expression 表达式？**

在节点配置面板，Expression 输入框旁边有一个小眼睛图标，点击可以实时预览该表达式在当前数据下的计算结果，不需要跑整个工作流。

**Q: n8n 能替代自建微服务吗？**

对于**内部工具**和**轻量级集成**完全可以。生产级的高吞吐量场景（每秒数千请求）还是需要专用的微服务，n8n 更适合运营自动化、数据同步、通知推送这类场景。

---

## 学习资源

| 资源 | 链接 |
|------|------|
| 官方文档 | [docs.n8n.io](https://docs.n8n.io) |
| 工作流模板库（900+） | [n8n.io/workflows](https://n8n.io/workflows) |
| 社区论坛 | [community.n8n.io](https://community.n8n.io) |
| AI 工作流专区 | [n8n.io/workflows/categories/ai](https://n8n.io/workflows/categories/ai) |
| Level 1 官方课程 | [docs.n8n.io/courses/level-one](https://docs.n8n.io/courses/level-one/) |
