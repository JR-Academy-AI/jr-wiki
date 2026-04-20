---
title: "HTTP Request 万能节点：对接任何 API"
wiki: "n8n-workflow-automation"
order: 6
description: "HTTP Request 节点的完整用法：REST API 调用、认证方式、分页处理、错误重试，附 5 个真实对接案例"
---

n8n 内置了 1000+ 集成节点，但你总会遇到没有现成节点的 API。HTTP Request 节点能对接任何有 HTTP 接口的服务——它是 n8n 里使用频率最高的节点。

![HTTP Request 节点是 n8n 连接外部 API 的万能桥梁](https://raw.githubusercontent.com/n8n-io/n8n/master/assets/n8n-screenshot-readme.png)

## 基础用法：GET / POST / PUT / DELETE

```
HTTP Request 节点配置：
  Method: GET / POST / PUT / PATCH / DELETE
  URL: https://api.example.com/users
  Authentication: 选择认证方式（见下文）
  Headers: Content-Type: application/json
  Body: JSON / Form Data / Binary
```

最常见的场景——调用一个 REST API 拿数据：

```javascript
// GET 请求：拉取用户列表
Method: GET
URL: https://jsonplaceholder.typicode.com/users

// POST 请求：创建新记录
Method: POST
URL: https://api.example.com/records
Body (JSON):
{
  "name": "{{ $json.userName }}",
  "email": "{{ $json.userEmail }}",
  "source": "n8n-automation"
}
```

## 四种认证方式

| 方式 | 适用场景 | 配置要点 |
|------|---------|---------|
| **Header Auth** | 大部分 API（Bearer Token） | `Authorization: Bearer xxx` |
| **Basic Auth** | 传统服务 | 用户名 + 密码，自动 Base64 编码 |
| **OAuth2** | Google、GitHub、Slack 等 | 填 Client ID/Secret，n8n 自动刷新 Token |
| **Custom Auth** | 签名类 API（如微信、支付宝） | 用前置 Code 节点算签名，塞进 Header |

Bearer Token 是最通用的方式。在 n8n 里创建一个 **Header Auth Credential**：

```
Name: X-API-Key  或  Authorization
Value: Bearer sk-xxxxxxxxxxxx
```

之后所有用到这个 API 的 HTTP Request 节点都选这个 Credential，不用重复填 Token。

## 处理分页：自动翻页拉全量数据

很多 API 一次只返回 20-100 条，要拿全量数据需要循环翻页。n8n 内置了 **Pagination** 支持：

```
Pagination 配置:
  Pagination Type: Offset-Based
  Next URL: {{ $response.body.next }}     // 适用于返回 next 字段的 API
  
  // 或者用 page number 方式：
  Page Size: 100
  Max Pages: 50
  Complete When: {{ $response.body.data.length }} === 0
```

对于 cursor-based 分页（如 Slack、Notion API），用 **Request Next Page** 参数：

```
Pagination Type: Response Contains Next URL
Parameter Name: cursor
Parameter Value: {{ $response.body.response_metadata.next_cursor }}
Complete When: {{ !$response.body.response_metadata.next_cursor }}
```

## 错误重试与超时

生产环境 API 调用会遇到超时、限流、服务器 500。在 HTTP Request 节点的 **Settings** 里配置：

```
Timeout: 30000        // 30 秒超时
Retry on Fail: true
Max Retries: 3
Wait Between Retries: 1000  // 毫秒
Retry On Status Codes: 429, 500, 502, 503
```

429（Too Many Requests）是最常见的限流响应。配合 **Wait** 节点做退避：

```javascript
// Code 节点：读取 Retry-After header，算出等待时间
const retryAfter = $json.headers['retry-after'];
const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
return [{ json: { waitMs } }];
```

## 实战：对接飞书 Webhook

给飞书群发消息，不需要现成的飞书节点：

```javascript
// HTTP Request 节点配置
Method: POST
URL: https://open.feishu.cn/open-apis/bot/v2/hook/your-webhook-id
Headers: Content-Type: application/json
Body:
{
  "msg_type": "interactive",
  "card": {
    "header": {
      "title": { "tag": "plain_text", "content": "{{ $json.title }}" },
      "template": "blue"
    },
    "elements": [{
      "tag": "markdown",
      "content": "{{ $json.content }}"
    }]
  }
}
```

## 实战：调用 Claude API 做文本处理

不用 AI Agent 节点，直接用 HTTP Request 调 Anthropic API：

```javascript
Method: POST
URL: https://api.anthropic.com/v1/messages
Headers:
  x-api-key: {{ $env.ANTHROPIC_API_KEY }}
  anthropic-version: 2023-06-01
  Content-Type: application/json
Body:
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 1024,
  "messages": [{
    "role": "user",
    "content": "把以下英文翻译成中文，只输出翻译结果：\n\n{{ $json.text }}"
  }]
}
```

这种方式比 AI Agent 节点更灵活——你可以精确控制 `temperature`、`system prompt`、`max_tokens` 等参数，适合批量处理场景。
