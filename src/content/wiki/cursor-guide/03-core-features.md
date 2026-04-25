---
title: "三大核心功能深度解析"
wiki: "cursor-guide"
order: 3
description: "Agent Mode 自主编程、Tab 预测补全、Composer 多文件协作的实战用法和隐藏技巧"
---

## Agent Mode：让 AI 自己写代码

Cursor Agent Mode 是目前 IDE 里最成熟的自主编程功能。按 `Ctrl/Cmd + I` 打开 Composer，顶部切到 Agent 模式，它就变成了一个能动手干活的 AI Agent。

![Cursor Agent Mode 实战](https://img.youtube.com/vi/LHDzPIVPVhg/maxresdefault.jpg)

Agent Mode 能做的事：

| 能力 | 说明 |
|------|------|
| 创建/修改文件 | 跨多个文件同时编辑，自动处理 import |
| 跑终端命令 | 安装依赖、启动服务、跑测试 |
| 读报错并修复 | 终端报错后自动分析原因、改代码、重跑 |
| 搜索代码库 | 语义搜索找到相关代码，不需要你手动指定文件 |
| 调 MCP 工具 | 连接数据库、读 Figma 设计稿、跑浏览器测试 |

### 一个真实例子：给现有项目加用户认证

```
给这个 Express + MongoDB 项目加 JWT 认证：
- 注册、登录、刷新 token 三个接口
- 密码用 bcrypt 加密
- 保护现有的 /api/posts 和 /api/comments 路由
- 写 middleware，不要侵入现有路由代码
```

Agent 会自动执行 6-8 步：装依赖 → 建 `auth.middleware.ts` → 建 `auth.routes.ts` → 建 `auth.service.ts` → 改 `app.ts` 注册路由 → 改现有路由加 middleware → 跑 `npm run build` 验证。全程 2-3 分钟。

### 提高 Agent 成功率的三个技巧

1. **给足上下文**：用 `@` 引用关键文件。`@src/models/User.ts @src/routes/index.ts` 比让 Agent 自己翻代码库准确率高 30%
2. **分步给任务**：别一次给太大的任务。"先建数据模型和 API 路由"→ 验证没问题 → "再加前端页面"
3. **用 Notepads 存常用上下文**：把项目架构、技术栈规范存进 Notepads，Agent 每次都能读到

## Tab 补全：不止补全，还能预测

Cursor 的 Tab 不只是补全当前行，它有一个独特能力叫 **Multi-line Edit Prediction**——改完一行按 Tab，光标会跳到下一个"应该改"的地方，继续帮你补全。

```python
# 场景：你要把所有 print() 换成 logging.info()
# 手动改了第一处：
logging.info(f"User {user_id} logged in")  # 原来是 print(...)

# 按 Tab → 光标自动跳到下一个 print()，建议改成 logging.info
# 继续按 Tab → 又跳下一个
# 连按几次 Tab，全文件 print 都换完了
```

这个能力在重命名变量、统一代码风格、批量修改时特别省时间。和 Find & Replace 的区别是：Tab 能理解上下文，不会机械替换——如果某个 `print` 是在 debug 代码里的，它会跳过。

### Tab 补全调优

在 `Cursor Settings > Features > Cursor Tab` 里可以精调：

```json
{
  "cursor.cpp.enablePartialAccepts": true,
  "cursor.general.enableShadowWorkspace": true
}
```

- **Partial Accepts**：按 `Ctrl/Cmd + →` 只接受补全建议的一个词，而不是整行。适合补全大部分对但结尾需要改的情况
- **Shadow Workspace**：后台隐形工作区，Tab 在这里跑类型检查确保补全建议编译通过，减少错误建议

## Composer：多文件协作利器

Composer 是 Cursor 的多文件编辑核心。`Ctrl/Cmd + I` 打开，有两个模式：

| 模式 | 用途 |
|------|------|
| **Normal** | 你指定改哪些文件，AI 执行 |
| **Agent** | AI 自己决定改哪些文件 + 跑什么命令 |

Normal 模式适合你已经知道要改什么、改哪几个文件的场景。Agent 模式适合"我描述需求，你自己规划怎么做"的场景。

### @ 引用：精确控制上下文

Composer 和 Chat 里都能用 `@` 引用各种上下文：

```markdown
@file — 引用具体文件
@folder — 引用整个目录
@code — 引用选中的代码块
@web — 让 AI 搜索互联网
@docs — 引用已索引的文档（如 React 官方文档）
@git — 引用 git diff / commit 历史
@notepads — 引用 Notepads 里存的上下文
@definitions — 引用符号定义（函数、类、变量）
```

实际使用中，`@file` 和 `@folder` 用得最多。给 Agent 精确的上下文，比写一大段 prompt 描述"那个文件"有效得多。
