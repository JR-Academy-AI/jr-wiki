---
title: "三大核心功能深度解析"
wiki: "windsurf-guide"
order: 3
description: "Cascade Agent、Supercomplete 自动补全、Web Preview 实时预览的实战用法"
---

## Cascade：你的 AI 编程搭档

Windsurf 的灵魂就是 Cascade。它不是一个聊天机器人，而是一个能动手干活的 Agent——读代码、改文件、跑命令、看报错、修 bug，全自动。

![Windsurf Cascade 对话与代码编辑](https://img.youtube.com/vi/x1VCmB__TDo/maxresdefault.jpg)

### Code 模式 vs Chat 模式

Cascade 有两个模式，切换按钮在面板顶部：

| 模式 | 用途 | 会改文件吗 |
|------|------|-----------|
| **Code** | 写功能、改 bug、重构 | 会，直接修改代码 |
| **Chat** | 问问题、讨论架构、学习 | 不会，只给建议 |

日常开发 90% 的时间用 Code 模式。想讨论"这个 API 该怎么设计"或"这段代码为什么慢"时切 Chat 模式。

### 规划 + Flow State

给 Cascade 一个复杂任务，它会先生成执行计划。后台有 planning agent 优化长期方案，前台模型执行当前步骤：

```typescript
// "给 Express API 加 JWT 认证" → Cascade 自动规划：
// Step 1: npm install jsonwebtoken bcryptjs
// Step 2: 创建 src/middleware/auth.ts
// Step 3: 创建 src/routes/auth.ts
// Step 4: 给现有路由加 authMiddleware
// Step 5: .env.example 添加 JWT_SECRET
```

每步都有 diff 预览和 checkpoint，搞砸了一键回滚。

**Flow State** 是 Windsurf 独有能力：Cascade 持续追踪你的编辑、终端命令、剪贴板内容。你直接说"修一下刚才那个报错"就行，不用复制粘贴错误信息。

## Supercomplete：不花钱的自动补全

Supercomplete 是 Windsurf 的 Tab 补全功能，**免费版也不限量**。它比普通补全更聪明，能根据你最近的编辑模式预测下一步操作。

举个例子，你刚在一个文件里把 `console.log` 换成了 `logger.info`，切到另一个文件按 Tab，Supercomplete 会自动建议同样的替换。

```python
# 你在写一个 FastAPI 路由，刚敲完函数签名：
@app.get("/users/{user_id}")
async def get_user(user_id: int):
    # 按 Tab，Supercomplete 会补全：
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

和 GitHub Copilot 的区别：Supercomplete 对你当前项目的上下文理解更准，因为它基于 Windsurf 的索引引擎，了解你整个代码库的模式。但注意：**装了 Copilot 或 Tabnine 插件的话要先禁用**，否则两个补全会打架。

## Web Preview：在 IDE 里看效果

做前端开发时，Cascade 面板右上角有一个 Web Preview 按钮。点开后会在 IDE 内嵌一个浏览器窗口，实时显示你的网页。

最好用的地方：你可以直接**点击预览里的元素**，Cascade 会定位到对应代码。然后说"把这个按钮改成蓝色圆角"，它就能精准修改——因为它知道你点的是哪个 DOM 元素。

这个工作流比"改代码 → 切浏览器 → 刷新 → 切回来"高效太多，特别是调 CSS 的时候。
