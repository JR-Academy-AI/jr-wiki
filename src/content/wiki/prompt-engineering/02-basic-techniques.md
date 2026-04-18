---
title: "基础技巧：让 AI 输出可控"
wiki: "prompt-engineering"
order: 2
description: "Few-shot、Chain of Thought、角色设定等基础 Prompt 技巧"
---

![Prompt 基础技巧](https://docs.anthropic.com/images/prompt-techniques.png)

## Few-shot：给 AI 看例子

Zero-shot 是直接让 AI 做事，Few-shot 是先给几个 input → output 的例子，让 AI 学会你期望的模式。

```
把以下公司名翻译成中文简称：

Google → 谷歌
Microsoft → 微软
Amazon → 亚马逊
Netflix → ?
```

AI 输出：**奈飞**

Few-shot 特别适合格式化输出。你不需要描述格式规则，给 2-3 个例子 AI 就能推导出来。

### 用 Claude API 跑 Few-shot

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=256,
    messages=[
        {"role": "user", "content": "把 Git commit message 翻译成中文：\n\nfix: resolve race condition in auth middleware → 修复：解决认证中间件的竞态条件\nadd: user profile avatar upload → 新增：用户头像上传功能\nrefactor: extract database connection pool → 重构：抽离数据库连接池\n\nchore: update dependencies to latest versions → ?"},
    ],
)
print(response.content[0].text)
# 杂务：更新依赖到最新版本
```

Few-shot 给的例子数量：2-3 个足够。超过 5 个例子边际效果递减，还浪费 token。

## Chain of Thought (CoT)

让 AI 先推理再给结论，而不是直接给答案。加一句 "请一步步思考" 就能触发：

```
一个班有 30 人，男女比例 2:3，后来转入 5 个男生。
现在男女各多少人？请一步步计算。
```

CoT 对数学、逻辑推理、多步骤任务效果很好。Claude 4.x 系列还支持 extended thinking（扩展思考），模型在内部做更深度的推理：

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=8000,
    thinking={
        "type": "enabled",
        "budget_tokens": 5000  # 给模型的"草稿纸"token 预算
    },
    messages=[{"role": "user", "content": "这段代码有 bug，找出来并修复：\n..."}],
)
```

extended thinking 适合 debug、算法设计、架构决策这类需要深度推理的场景。简单翻译、格式转换不需要开。

## 角色设定的正确用法

```
❌ "你是世界上最厉害的程序员"
→ 没有用，AI 不会因为你夸它就写出更好的代码

✅ "你是一个有 10 年经验的 Node.js 后端工程师，熟悉 NestJS 和 MongoDB"
→ 有效，限定了技术栈和经验范围
```

角色设定的价值是**缩小输出范围**，不是拍马屁。

## 输出格式控制

明确指定输出格式，避免 AI 自由发挥：

```
分析以下代码的性能问题，用这个格式输出：

## 问题
[一句话描述]

## 原因
[技术原因，2-3 句]

## 修复
[代码片段]
```

格式化 Prompt 让输出可预测、可解析。需要程序处理 AI 输出时，指定 JSON 格式比 Markdown 更稳定：

```python
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": """分析这段代码的问题，严格按 JSON 输出：
{"issues": [{"severity": "high|medium|low", "description": "...", "fix": "..."}]}

代码：
function fetchData(url) {
  const data = fetch(url);
  return data.json();
}"""
    }],
)
```
