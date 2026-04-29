---
title: "Coze 快速上手：5 分钟创建你的第一个 AI Bot"
wiki: "coze-guide"
order: 2
description: "从注册账号到发布上线：手把手创建第一个 Coze Bot，配置 Persona、添加插件、测试对话、一键发布到 Discord"
---

Coze 的上手体验是我用过的 AI Bot 平台里最丝滑的——注册、建 Bot、测试、发布，整个流程 5 分钟搞定，不需要信用卡，不需要装任何东西。

![Coze 创建 Bot 流程](https://img.youtube.com/vi/Edj6ijQI1hY/maxresdefault.jpg)

## 第一步：注册账号

1. 打开 [coze.com](https://www.coze.com)
2. 点右上角 **Sign Up**，用 Google 账号一键登录
3. 进入 Dashboard，你的工作区就准备好了

免费账户的额度：

| 项目 | 免费额度 |
|------|---------|
| 每日消息数 | 根据模型不同，约 10-100 条 |
| Bot 数量 | 不限 |
| 插件调用 | 不限 |
| 知识库 | 有容量上限 |
| 工作流 | 可用 |

够你跑通所有功能、搭完一个完整的 demo。想要更多额度，Premium 计划 $9/月起。

## 第二步：创建 Bot

1. 在 Dashboard 点 **Create Bot**
2. 填写 Bot 名称和描述（比如"周报助手"）
3. 选择模型——推荐先用 **GPT-4o**，效果好且速度快

## 第三步：配置 Persona（人设）

这是 Coze 里最关键的一步。Persona 就是你给 Bot 写的系统提示词（System Prompt），决定了它"是谁"和"怎么说话"。

```markdown
# 角色
你是一个专业的周报写作助手。

# 任务
用户告诉你本周做了什么，你帮他整理成结构化的周报。

# 输出格式
## 本周完成
- [项目名] 具体成果

## 下周计划
- [项目名] 具体计划

# 约束
- 语气专业但不死板
- 每条控制在 20 字以内
- 主动追问遗漏的细节
```

好的 Persona 三要素：**角色明确、任务清晰、格式固定**。别写"你是一个有用的助手"这种废话，越具体效果越好。

## 第四步：添加插件

左侧面板点 **Plugins**，搜索你需要的能力：

- **Web Search**：让 Bot 能搜索实时信息
- **Image Generator**：让 Bot 能画图
- **Code Interpreter**：让 Bot 能跑 Python 代码
- **URL Reader**：让 Bot 能读网页内容

先加一个 Web Search，这样你的 Bot 就不限于训练数据了。

## 第五步：测试对话

右侧预览面板直接跟 Bot 对话。注意观察：

1. 回答是否符合你的 Persona 设定
2. 插件有没有被正确调用（会显示 Plugin 调用记录）
3. 多轮对话记忆是否正常

不满意就回去改 Persona，这个过程就像调 Prompt 一样需要迭代。

## 第六步：发布

测试满意后，点顶部 **Publish** 按钮：

1. 选择发布渠道（Discord / Telegram / API / Web Widget）
2. 按照引导完成平台授权
3. 点 Publish，上线完成

```bash
# 如果选了 API 渠道，你会拿到一个 Bot ID
# 用 curl 就能调用你的 Bot
curl -X POST https://api.coze.com/v1/conversation/create \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bot_id": "YOUR_BOT_ID",
    "messages": [
      {"role": "user", "content": "帮我写本周周报，做了用户调研和登录页重构"}
    ]
  }'
```

整个过程不到 5 分钟。下一章我们深入讲 Coze 最强的三个功能：插件系统、工作流编排和知识库。
