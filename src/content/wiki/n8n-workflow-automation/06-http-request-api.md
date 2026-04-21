---
title: "HTTP Request 节点与 API 集成实战"
wiki: "n8n-workflow-automation"
order: 6
description: "用 HTTP Request 节点对接任意 API：认证方式、分页处理、错误重试与真实集成案例"
---

![n8n 工作流编辑器](https://raw.githubusercontent.com/n8n-io/n8n/master/assets/n8n-screenshot.png)

HTTP Request 是 n8n 里最通用的节点——任何提供 REST API 的服务都能接。官方没有内置集成的服务（比如国内的飞书、企业微信），HTTP Request 就是你的万能接口。

## 四种认证方式

| 方式 | 适用场景 | 配置 |
|------|---------|------|
| **Header Auth** | API Key 放 Header | `Authorization: Bearer sk-xxx` |
| **Query Auth** | API Key 放 URL 参数 | `?api_key=xxx` |
| **OAuth2** | 第三方登录授权 | Client ID + Secret + Redirect |
| **Basic Auth** | 用户名密码 | `username:password` Base64 |

实际使用中 Header Auth 最常见。在 Credentials 里创建一个 **Header Auth** 类型，填好 Name 和 Value，所有节点都能复用。

## 分页处理：拉取全量数据

大部分 API 单次最多返回 100 条，拿全量数据需要翻页。n8n 的 HTTP Request 节点内置了 **Pagination** 支持：

```
Pagination 配置:
  Type: Offset-Based
  Complete When: Response Is Empty
  Page Size: 100
  Offset Parameter: offset
  Limit Parameter: limit
```

如果 API 用 cursor 分页（比如 Slack API），选 **Response Contains Next URL**：

```
Pagination 配置:
  Type: Response Contains Next URL
  Next URL: {{ $response.body.response_metadata.next_cursor }}
  Complete When: {{ !$response.body.response_metadata.next_cursor }}
```

n8n 会自动循环请求直到拉完所有页。

## 重试与超时

生产环境调外部 API 一定要配重试，防止网络抖动导致整个工作流失败：

```
HTTP Request 节点 Settings:
  Timeout: 30000          # 30 秒超时
  Retry On Fail: true
  Max Retries: 3
  Wait Between Retries: 1000  # 毫秒
  Continue On Fail: true  # 失败不阻断后续节点
```

## 实战：对接飞书 Webhook 发消息

飞书机器人用 Webhook 推消息，只需一个 POST 请求：

```javascript
// HTTP Request 节点配置
// Method: POST
// URL: https://open.feishu.cn/open-apis/bot/v2/hook/你的token

// Body (JSON):
{
  "msg_type": "interactive",
  "card": {
    "header": {
      "title": { "content": "{{ $json.title }}", "tag": "plain_text" },
      "template": "blue"
    },
    "elements": [{
      "tag": "markdown",
      "content": "{{ $json.content }}"
    }]
  }
}
```

飞书机器人不需要 OAuth，Webhook URL 本身就是鉴权。适合报警通知、日报推送这类单向场景。

## 调试技巧

调 API 遇到问题时，打开 HTTP Request 节点的 **Options → Full Response**，n8n 会返回完整的 status code、headers 和 body，而不是只返回 body。排查 401/403 鉴权问题时特别有用。

Expression 里可以直接引用环境变量存放 API Key，避免硬编码：

```
{{ $env.FEISHU_WEBHOOK_URL }}
{{ $env.THIRD_PARTY_API_KEY }}
```
