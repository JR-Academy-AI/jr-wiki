---
title: "HTTP Request 节点实战：对接任意 API"
wiki: "n8n-workflow-automation"
order: 6
description: "用 HTTP Request 节点调用第三方 API：认证方式、分页处理、响应解析与错误重试"
---

![n8n HTTP Request 实战](https://img.youtube.com/vi/PfdnYe2690E/maxresdefault.jpg)

n8n 内置了 400+ 集成节点，但真实项目里你迟早要对接没有官方节点的 API。HTTP Request 节点就是你的万能接口——任何提供 REST API 的服务都能接。

## 基础用法：GET 请求

最简单的场景：从公开 API 拉数据。

```
HTTP Request 节点配置:
  Method: GET
  URL: https://api.github.com/repos/n8n-io/n8n/releases/latest
  Response Format: JSON
```

返回的 JSON 自动解析成 `$json`，后续节点直接用 `{{ $json.tag_name }}` 取版本号。

## 认证方式

多数 API 需要鉴权，HTTP Request 节点支持四种方式：

| 认证方式 | 配置位置 | 典型场景 |
|---------|---------|---------|
| **Header Auth** | Authentication → Header Auth | Bearer Token、自定义 Header |
| **Basic Auth** | Authentication → Basic Auth | 用户名 + 密码 |
| **OAuth2** | Authentication → OAuth2 | Google、GitHub、Notion |
| **Query String** | 直接在 URL 里拼 `?api_key=xxx` | 简单 API Key |

**Bearer Token 配置示例：**

先在 Credentials 里创建一个 Header Auth credential：

```
Name: X-API-Key（或 Authorization）
Value: Bearer sk-your-api-key-here
```

然后在 HTTP Request 节点的 Authentication 里选这个 credential。API Key 加密存储，不会明文出现在工作流 JSON 里。

## POST 请求：发送数据

```javascript
// 调用企业微信 Webhook 发送消息
// HTTP Request 节点配置：
// Method: POST
// URL: https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY

// Body Parameters (JSON):
{
  "msgtype": "markdown",
  "markdown": {
    "content": "## 每日数据报告\n> 订单数: {{ $json.orderCount }}\n> 收入: ¥{{ $json.revenue }}"
  }
}
```

## 分页处理：拉取全量数据

很多 API 单次只返回 20-100 条，需要翻页拉完。n8n 有两种处理方式。

**方式一：Pagination 内置选项（推荐）**

HTTP Request 节点自带 Pagination 配置：

```
Options → Pagination:
  Pagination Mode: Response Contains Next URL
  Next URL: {{ $response.body.next }}
  Max Pages: 50
  
# 或者用 Offset 模式:
  Pagination Mode: Update a Parameter in Each Request
  Parameter Name: page
  Parameter Type: Query
  Next Value: {{ $pageCount + 1 }}
```

节点会自动循环请求，把所有页的数据合并成一个大数组输出。

**方式二：Code Node 手动翻页**

API 分页逻辑特殊时，用 Code Node 自己写：

```javascript
let allItems = [];
let page = 1;
let hasMore = true;

while (hasMore) {
  const response = await this.helpers.httpRequest({
    method: 'GET',
    url: `https://api.example.com/users?page=${page}&per_page=100`,
    headers: { 'Authorization': 'Bearer ' + $env.API_TOKEN }
  });
  
  allItems = allItems.concat(response.data);
  hasMore = response.data.length === 100;
  page++;
}

return allItems.map(item => ({ json: item }));
```

## 错误重试

API 偶尔超时或 429 限频，配置自动重试：

```
Options → Retry on Fail:
  Retry: true
  Max Retries: 3
  Wait Between Retries: 1000 (ms)
  
# Retry 只对 5xx 和网络错误生效
# 4xx 错误（参数错误等）不会重试
```

对于 429 Too Many Requests，用 Wait 节点配合：

```
HTTP Request → IF（状态码 === 429）
  ├── True → Wait（2 秒）→ 回到 HTTP Request
  └── False → 继续后续流程
```

## 实战：Slack + OpenAI 自动翻译 Bot

一个实际跑着的工作流：Slack 收到英文消息 → OpenAI 翻译 → 回复中文。

```
Slack Trigger（监听指定频道）
    ↓
IF: {{ $json.event.text.length > 0 }}
    ↓
HTTP Request (POST https://api.openai.com/v1/chat/completions)
  Body: {
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "system", "content": "翻译为中文，保持技术术语不翻译"},
      {"role": "user", "content": "{{ $json.event.text }}"}
    ]
  }
    ↓
Slack: 回复翻译结果到原 thread
  Message: {{ $json.choices[0].message.content }}
  Thread TS: {{ $node["Slack Trigger"].json.event.ts }}
```

这个工作流跑在我们内部 Slack，每天自动翻译几十条英文技术讨论，团队里不看英文的同事也能跟进。
