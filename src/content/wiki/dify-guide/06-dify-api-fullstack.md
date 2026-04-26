---
title: "Dify API 全栈开发：Python SDK 对接 + 前端流式集成"
wiki: "dify-guide"
order: 6
description: "用 Dify 的 REST API 和 Python SDK 把 AI 能力嵌入你自己的产品——从后端鉴权到前端 SSE 流式渲染，附完整可运行代码"
---

Dify 的可视化编排很好用，但真正上线的产品不会让用户打开 Dify 网页——你需要通过 API 把 Dify 当后端，自己的前端做 UI。这章手把手走一遍全栈集成流程。

![Dify API 集成架构](https://raw.githubusercontent.com/langgenius/dify/main/images/describe.png)

## 拿 API Key

每个 Dify 应用发布后自动生成一套 REST API。进入 App → 左侧栏 **API Access**，你会看到两个东西：

1. **API Base URL** — 自部署默认是 `http://你的IP/v1`，云端是 `https://api.dify.ai/v1`
2. **API Key** — 格式 `app-xxxxxxxxxxxxxxxx`，Bearer Token 认证

一个应用一个 Key。不同应用的 Key 不通用，也不能用管理员 Key 替代。

## Python SDK 快速上手

官方 SDK 封装了 HTTP 调用，类型提示也全：

```bash
pip install dify-client-python
```

```python
import uuid
from dify_client import Client, models

client = Client(
    api_key="app-xxxxxxxxxxxx",
    api_base="http://localhost/v1",
)

# blocking 模式——等全部生成完一次性返回
req = models.ChatRequest(
    query="用三句话介绍 Dify",
    user=str(uuid.uuid4()),
    response_mode=models.ResponseMode.BLOCKING,
)
result = client.chat_messages(req)
print(result["answer"])
```

blocking 模式简单但慢——用户要等 5-15 秒才能看到结果。生产环境应该用 streaming。

## 流式对话：SSE 逐字输出

streaming 模式用 **Server-Sent Events（SSE）** 逐 token 推送，用户体验好很多：

```python
import json
import requests

API_KEY = "app-xxxxxxxxxxxx"
BASE = "http://localhost/v1"

def chat_stream(query: str, conversation_id: str = ""):
    resp = requests.post(
        f"{BASE}/chat-messages",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "inputs": {},
            "query": query,
            "user": "user-001",
            "response_mode": "streaming",
            "conversation_id": conversation_id,
        },
        stream=True,
    )
    for line in resp.iter_lines():
        if not line:
            continue
        text = line.decode("utf-8")
        if not text.startswith("data: "):
            continue
        payload = json.loads(text[6:])
        event = payload.get("event")
        if event == "message":
            print(payload["answer"], end="", flush=True)
        elif event == "message_end":
            print()
            return payload.get("conversation_id")

# 第一轮
cid = chat_stream("帮我写一段 Python 快排")
# 第二轮——传 conversation_id 实现多轮
chat_stream("改成非递归版本", conversation_id=cid)
```

`conversation_id` 是多轮对话的关键——Dify 服务端按这个 ID 维护上下文记忆，你的后端不需要自己拼历史消息。

## 前端 SSE 集成（Next.js / React）

前端直接用 `fetch` + `ReadableStream` 对接 SSE，不需要额外库：

```typescript
async function streamChat(query: string, onToken: (t: string) => void) {
  const res = await fetch("/api/dify/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    for (const line of chunk.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const data = JSON.parse(line.slice(6));
      if (data.event === "message") onToken(data.answer);
    }
  }
}
```

注意不要在前端直接调 Dify API——API Key 会暴露。应该在自己的后端做一层代理，前端调你的后端，后端转发给 Dify。

## 后端代理示例（FastAPI）

```python
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
import httpx

app = FastAPI()
DIFY_KEY = "app-xxxxxxxxxxxx"
DIFY_BASE = "http://dify-api:5001/v1"

@app.post("/api/dify/chat")
async def proxy_chat(request: Request):
    body = await request.json()
    async def stream():
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                f"{DIFY_BASE}/chat-messages",
                headers={"Authorization": f"Bearer {DIFY_KEY}"},
                json={
                    "inputs": {},
                    "query": body["query"],
                    "user": body.get("user", "anonymous"),
                    "response_mode": "streaming",
                    "conversation_id": body.get("conversation_id", ""),
                },
            ) as resp:
                async for chunk in resp.aiter_bytes():
                    yield chunk
    return StreamingResponse(stream(), media_type="text/event-stream")
```

这层代理做三件事：隐藏 API Key、统一鉴权逻辑、方便加日志和限流。

## 文件上传 + 多模态对话

Dify 支持上传图片或文件参与对话（需要应用开启了文件上传功能）：

```python
# 先上传文件拿到 file_id
with open("screenshot.png", "rb") as f:
    upload_resp = requests.post(
        f"{BASE}/files/upload",
        headers={"Authorization": f"Bearer {API_KEY}"},
        files={"file": ("screenshot.png", f, "image/png")},
        data={"user": "user-001"},
    )
file_id = upload_resp.json()["id"]

# 带文件发消息
requests.post(f"{BASE}/chat-messages",
    headers={"Authorization": f"Bearer {API_KEY}",
             "Content-Type": "application/json"},
    json={
        "inputs": {},
        "query": "这张截图里有什么问题？",
        "user": "user-001",
        "response_mode": "blocking",
        "files": [{"type": "image", "transfer_method": "local_file",
                    "upload_file_id": file_id}],
    })
```

上传的文件会被缓存在 Dify 服务端，同一个 `file_id` 可以在后续对话中反复引用。

## 常用 API 端点速查

| 端点 | 方法 | 作用 |
|------|------|------|
| `/chat-messages` | POST | 发消息（支持 streaming） |
| `/conversations` | GET | 列出用户所有对话 |
| `/conversations/{id}` | DELETE | 删除对话 |
| `/messages/{id}/feedbacks` | POST | 提交用户反馈（👍👎） |
| `/files/upload` | POST | 上传文件 |
| `/audio-to-text` | POST | 语音转文字 |
| `/text-to-audio` | POST | 文字转语音 |
| `/parameters` | GET | 获取应用配置参数 |

所有端点都需要 Bearer Token 认证。rate limit 默认无限制（自部署），云端 Professional 是 100 QPM。
