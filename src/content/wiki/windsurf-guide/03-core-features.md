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

### 实战：用 Cascade 重构 Express 认证 Middleware

这是最能体现 Cascade 多文件能力的场景：项目早期偷懒，把 token 校验逻辑直接写在每个路由里，后来发现要改逻辑时要改七八个地方。告诉 Cascade：

> "把散落在各路由里的 JWT 验证逻辑提取到 `src/middleware/auth.ts`，所有用到的路由改成 `router.use(authMiddleware)`。"

**Cascade 的实际执行步骤：**

第一步，它先扫描整个 `src/routes/` 目录，找出所有包含 `jwt.verify` 的文件，列出来让你确认范围。

第二步，新建 `src/middleware/auth.ts`：

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      role: string;
    };
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

第三步，同时修改 `src/routes/users.ts`、`src/routes/orders.ts`、`src/routes/admin.ts` 等七个文件——把各自内嵌的 `jwt.verify` 块删掉，在 router 顶部插入 `router.use(authMiddleware)`。整个过程 Cascade 自动处理，每个文件都生成 diff 预览。

第四步，跑 `npm run test`，有一个测试失败：测试里发的请求没带 token。Cascade 看到终端报错，直接定位到 `src/__tests__/orders.test.ts`，在 `beforeAll` 里加了生成测试 token 并注入 `Authorization` header 的逻辑，不用你动手。

**这就是 Cascade 多文件感知的价值**——七个路由文件 + 一个新 middleware + 一个测试文件，一次对话搞定，且改动是一致的，不会出现只改了五个路由漏掉两个的低级错误。

你发现一个细节：之前有的路由用 `req.userId`，有的用 `req.user.id`，现在统一了。Cascade 在改完后会主动提示："发现 3 处旧的 `req.userId` 引用，已一并替换为 `req.user?.id`。"这就是 Flow State 的作用——它记住了你在这个对话里的意图，不只是机械执行字面指令。

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

Supercomplete 在重复性改动时特别省力。比如你在给 API 加统一的错误处理，第一个路由手动写完之后，后面每个路由按一下 Tab 就补全了相同的 `try/catch` 结构——它认出了你的模式，不需要你说任何话。

## Web Preview：在 IDE 里看效果

做前端开发时，Cascade 面板右上角有一个 Web Preview 按钮。点开后会在 IDE 内嵌一个浏览器窗口，实时显示你的网页。

最好用的地方：你可以直接**点击预览里的元素**，Cascade 会定位到对应代码。然后说"把这个按钮改成蓝色圆角"，它就能精准修改——因为它知道你点的是哪个 DOM 元素。

这个工作流比"改代码 → 切浏览器 → 刷新 → 切回来"高效太多，特别是调 CSS 的时候。Web Preview 适合轻量前端项目（Vite / Next.js dev server），重型应用建议还是开独立浏览器，IDE 内嵌渲染性能有上限。

## 三个功能的协作关系

Cascade、Supercomplete、Web Preview 不是孤立的三个工具，日常开发里会同时用到：

- 写新功能时：用 Cascade Code 模式起步，拿到可跑的骨架
- 补细节时：Supercomplete 接管，Tab 键飞速填充重复逻辑
- 前端调样式时：Web Preview 点哪改哪，Cascade 精准定位代码

理解这三个功能的分工，是从"偶尔用 AI 辅助"升级到"以 AI 为主力"的关键一步。
