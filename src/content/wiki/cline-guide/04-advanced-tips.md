---
title: "进阶技巧与实战案例"
wiki: "cline-guide"
order: 4
description: ".clinerules 项目规则、成本控制、Auto-approve 自动化、多模型策略、真实项目案例"
---

![Cline 进阶配置与实战](https://img.youtube.com/vi/fSvBDMdbuJI/sddefault.jpg)

## .clinerules：给 AI 定规矩

`.clinerules` 是 Cline 的项目级配置——类似 Cursor 的 `.cursorrules`，告诉 AI 这个项目的编码规范、技术栈偏好和注意事项。它是 markdown 文件，放在项目根目录或 `.clinerules/` 目录下。

```markdown
<!-- .clinerules/coding-style.md -->
# 编码规范

- TypeScript strict mode，不用 any
- React 组件用函数式 + hooks，不用 class
- 样式用 Tailwind CSS，不写自定义 CSS
- 状态管理用 Zustand，不用 Redux
- API 请求用 fetch，不装 axios
- 测试用 Vitest + Testing Library
- 提交信息用 conventional commits 格式

# 目录结构
- 组件放 src/components/{Feature}/
- hooks 放 src/hooks/
- 工具函数放 src/lib/
```

高级用法——**条件规则**，让前后端代码遵循不同规范：

```markdown
<!-- .clinerules/frontend.md -->
# 仅当修改 src/components/ 或 src/pages/ 下的文件时生效

- 组件必须导出 Props 类型
- 每个组件配一个 .test.tsx
- 用 @tanstack/react-query 做数据请求
```

`.clinerules` 会随 git 提交，团队成员拉代码就自动生效——比口头传达「我们项目不用 Redux」靠谱得多。

## 成本控制：花最少的钱办最大的事

Cline 的 BYO-key 模式意味着你为每个 token 付费。好消息是你有完全的控制权，坏消息是不注意会烧钱。

### 模型分级策略

```
任务复杂度        推荐模型              大约成本/万 token
─────────────────────────────────────────────────
简单（改名/加注释）  Gemini Flash / DeepSeek   ~$0.01
中等（写功能/修 bug） Claude Sonnet            ~$0.09
困难（架构重构）      Claude Opus              ~$0.45
─────────────────────────────────────────────────
```

Cline 侧边栏右上角实时显示当前任务的 token 消耗和成本。养成习惯：每完成一个任务瞄一眼花了多少钱。

### 降低成本的实操技巧

1. **精准 `@` 引用**——手动 `@` 相关文件，比让 Cline 搜索全项目省 50%+ token
2. **任务拆小**——一个大任务拆成 3-5 个小任务，每个新开对话。避免上下文越滚越大
3. **Plan 先行**——Plan 模式只读文件，token 消耗远低于 Act 模式的试错循环
4. **及时结束对话**——任务完成就开新对话，不要在同一个对话里追加不相关的任务

```bash
# 真实成本参考（Claude Sonnet，一个下午的工作量）
# 10 个小任务（新建组件、修 bug、加测试）
# 总计 ~150 万 token → 大约 $4.50
# 平均每个任务 $0.45
```

## Auto-approve：信任之后提速

Cline 默认每步都要你确认，安全但慢。熟悉后可以开启 Auto-approve：

| 级别 | 自动批准的操作 | 适合场景 |
|------|--------------|---------|
| 保守 | 只批准读文件 | 刚开始用 Cline |
| 中等 | 读文件 + 安全命令（lint/test） | 日常开发 |
| 激进 | 读/写文件 + 所有命令 | 信任度高、有 git 兜底 |
| YOLO | 全部自动批准 | 实验性项目、不怕搞坏 |

**我的建议**：日常开发用「中等」级别——自动批准读操作和 `npm test` / `npm run lint` 这类安全命令，文件修改还是手动确认。配合 git 分支使用，Cline 在 feature branch 上随便折腾，`main` 不受影响。

## 实战案例：全栈 CRUD 应用

来看一个完整的真实案例——用 Cline 从零搭建一个 Todo 应用：

```
用 Next.js 14 + Prisma + SQLite 搭一个 Todo 应用：
- 首页显示待办列表，支持新增、完成、删除
- 用 Server Actions 处理数据操作
- Tailwind CSS 做样式，要好看
- 加一个筛选功能：全部 / 未完成 / 已完成
- 写 3 个核心测试用例
```

Cline 的执行过程（约 15 分钟，花费 ~$2）：

1. **Plan 阶段**（2 分钟）：列出技术方案、文件结构、依赖清单
2. **初始化**（3 分钟）：`npx create-next-app`、装 Prisma、配 schema
3. **写业务代码**（5 分钟）：组件、Server Actions、数据库操作
4. **样式打磨**（3 分钟）：Tailwind 样式、响应式布局
5. **测试 + 修复**（2 分钟）：跑测试、修失败的 case、再跑

全程 Cline 自动跑了 `npm run dev`，用内置浏览器截了 3 次图验证 UI，修了 2 个自己写出来的 bug。

## Memory Bank：跨会话记忆

Cline 的对话记忆不会在关闭后保留。社区流行的解决方案是 **Memory Bank**——用一组 markdown 文件记录项目上下文：

```markdown
<!-- cline-memory-bank.md -->
# 项目概述
这是一个 SaaS 计费系统，用 Next.js + Stripe + Supabase。

# 架构决策
- 认证用 Supabase Auth，不用 NextAuth
- 支付用 Stripe Checkout，不做自定义支付页
- 定价模型：三档月付（Basic/Pro/Enterprise）

# 重要约定
- 所有金额用 cents（整数），不用浮点数
- 时区统一用 UTC
- 邮件模板在 src/emails/，用 React Email
```

把这个文件放在 `.clinerules/` 目录下，每次新对话 Cline 都会读到这些上下文。比每次手动解释项目背景高效 10 倍。
