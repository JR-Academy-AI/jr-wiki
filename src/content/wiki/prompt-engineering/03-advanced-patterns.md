---
title: "高级模式：System Prompt 和 Prompt Chain"
wiki: "prompt-engineering"
order: 3
description: "System Prompt 架构、Prompt Chain 工作流、以及如何在生产环境使用 Prompt"
---

## System Prompt vs User Prompt

API 调用中 Prompt 分两层：

```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: '你是 JR Academy 的课程助手...' },
    { role: 'user', content: '推荐一个适合前端转全栈的课程' },
  ],
});
```

| 层级 | 作用 | 特点 |
|------|------|------|
| **System** | 定义 AI 的身份、行为规则、输出约束 | 用户看不到，每轮对话都生效 |
| **User** | 具体的任务或问题 | 每轮不同 |

## Prompt Chain：拆分复杂任务

一个 Prompt 做太多事，AI 容易丢失上下文。拆成多步：

```
Step 1: 分析用户简历，提取技能列表
  → 输出: ["React", "TypeScript", "Node.js"]

Step 2: 根据技能列表匹配课程
  → 输入: 上一步的技能列表 + 课程数据库
  → 输出: 推荐课程列表

Step 3: 生成推荐理由
  → 输入: 用户技能 + 推荐课程
  → 输出: 每门课的推荐理由
```

每一步职责单一、输入输出明确。

## 温度（Temperature）选择

| 温度 | 适合场景 | 例子 |
|------|---------|------|
| **0** | 确定性输出、代码生成 | 解析发票、JSON 转换 |
| **0.3-0.5** | 平衡创意和准确性 | 课程推荐、技术问答 |
| **0.7-1.0** | 创意写作、头脑风暴 | 广告文案、起名字 |

生产环境默认用 0，需要创意的场景再调高。
