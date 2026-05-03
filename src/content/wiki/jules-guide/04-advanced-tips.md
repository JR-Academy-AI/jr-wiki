---
title: "Jules 进阶技巧与实战经验"
wiki: "jules-guide"
order: 4
description: "Jules 任务 Prompt 写作模板、多任务并行策略、AGENTS.md 最佳实践、真实项目案例、成功率从 50% 提到 85% 的技巧"
---

## Prompt 工程：写好任务描述是成功的一半

Jules 的成功率和你写的 Prompt 质量直接挂钩。用户反馈的平均成功率约 75%，但写好 Prompt 可以拉到 85% 以上。核心原则：**像分配任务给一个聪明但不了解项目的新同事，越具体越好。**

![Jules 进阶技巧](https://img.youtube.com/vi/SLOheCkluec/maxresdefault.jpg)

坏 Prompt vs 好 Prompt 对比：

```
❌ 坏：修一下登录的 bug
✅ 好：修复 /auth/login 页面的登录按钮——
   开启了两步验证的 premium 用户登录后没有跳转到 dashboard，
   而是卡在了登录页。错误在 src/auth/callback.ts 的 redirect 逻辑里，
   twoFactorEnabled 为 true 时没有处理 premium 用户的 redirect URL。
   修复后补一个 Vitest 测试覆盖这个场景。
```

### 高效 Prompt 模板

**Bug 修复**：
```
修复 [文件路径] 中的 [具体错误]。
错误现象：[描述症状]
触发条件：[什么操作能复现]
期望行为：[修复后应该怎样]
修复后跑一遍 [测试命令] 确认不影响其他功能。
```

**重构**：
```
重构 [文件路径] 中的 [函数/模块名]：
- 把 [旧模式] 换成 [新模式]
- 保持对外接口不变
- 确保所有现有测试通过
```

**测试生成**：
```
给 [文件路径] 添加 [测试框架] 单元测试，覆盖：
- 正常路径：[列出场景]
- 边界值：[列出场景]
- 错误处理：[列出场景]
测试文件放在 [路径]。
```

## 多任务并行：Jules 的最大效率杠杆

单个任务 Jules 不一定比 Claude Code 快，但 Jules 的杀手锏是**并行**。免费用户可以同时跑 3 个任务，Pro 能跑 15 个，Ultra 能跑 60 个。

高效使用策略：

```bash
# 策略 1：模块级并行
# 把一个大需求拆成独立模块，每个模块一个任务
jules new --repo myorg/app "给 src/api/users.ts 加输入校验和错误处理"
jules new --repo myorg/app "给 src/api/posts.ts 加输入校验和错误处理"
jules new --repo myorg/app "给 src/api/comments.ts 加输入校验和错误处理"

# 策略 2：批量技术债清理
jules new --repo myorg/app "把所有 console.log 替换为 logger 调用"
jules new --repo myorg/app "给所有 public 函数加 JSDoc 注释"
jules new --repo myorg/app "把 moment.js 调用迁移到 dayjs"
```

**经验法则**：每个任务聚焦一个文件或一个清晰的改动范围。跨多文件的大任务拆成小任务，成功率能从 60% 提到 90%。

## 真实项目经验总结

根据开发者社区反馈，Jules 在这些场景表现最好：

| 场景 | 表现 | 说明 |
|------|------|------|
| 全局代码风格统一 | 优秀 | 用户实测：47 个文件的 `var` → `const/let` 替换一次搞定 |
| 批量测试生成 | 优秀 | 理解代码逻辑后能写出有意义的测试，不只是 boilerplate |
| 单文件 Bug 修复 | 良好 | 给出明确错误信息和文件路径时成功率很高 |
| 依赖版本升级 | 良好 | 包括修复 breaking changes |
| 架构级重构 | 一般 | Jules 是执行者不是架构师，需要你把决策想清楚再分配 |
| 模糊需求 | 差 | "让代码更好"这种任务基本会跑偏 |

### 避坑清单

1. **失败任务也扣配额**——免费用户每天 15 个机会，别浪费在模糊 Prompt 上
2. **不要依赖 Jules 做决策**——技术选型、架构方向是你的事，Jules 负责执行
3. **大文件可能被跳过**——超过 768K token 的文件 Jules 可能读不进去
4. **不能中途改方向**——Jules 不像 Claude Code 那样支持实时对话迭代，计划批准后就是一条路走到底
5. **永远在 GitHub 上审 PR**——Jules 自带的 diff 查看器不如 GitHub 好用，最终审查去 GitHub 做
6. **PR 合格率参考**——有用户反馈 12 个 PR 只合并了 1 个，所以不要对每个 PR 都抱太高期望，把 Jules 当高产但需要审查的 junior 来用

## AGENTS.md 进阶配置

基础版 AGENTS.md 在上一章讲了。进阶用法：

```markdown
# AGENTS.md

## 项目概述
Next.js 15 + TypeScript + Prisma + PostgreSQL 的全栈应用

## 命令
- `npm install` — 安装依赖
- `npm run build` — TypeScript 编译 + Next.js 构建
- `npm test` — 跑 Vitest 单元测试
- `npm run lint` — ESLint 检查
- `npx prisma generate` — 更新 Prisma Client

## 架构约定
- API 路由在 `src/app/api/` 下，每个路由文件 export GET/POST/PUT/DELETE
- 数据库操作只通过 `src/lib/db.ts` 的封装函数
- 所有输入用 `src/lib/validators/` 里的 Zod schema 校验
- 错误统一用 `src/lib/errors.ts` 的 AppError 类

## 禁止
- 不用 any 类型
- 不在 component 里直接查数据库
- 不硬编码环境变量
- 不跳过现有测试
```

关键细节：子目录可以放自己的 `AGENTS.md`，Jules 自动读最近的那个。比如 `src/api/AGENTS.md` 可以只写 API 相关的规范，不污染全局。

这个文件兼容 Cursor、GitHub Copilot 和 OpenAI Codex，写一份多处生效。
