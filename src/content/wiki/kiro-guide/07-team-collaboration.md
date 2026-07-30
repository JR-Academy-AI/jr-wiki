---
title: "团队协作实战：Spec 当活文档、避开 7 个常见坑"
wiki: "kiro-guide"
order: 7
description: "多人团队如何用 Kiro Spec 做需求对齐、Steering 沉淀知识库、以及 7 个必须避开的反模式"
---

## Spec 放进 Git = 需求文档自动活着

Kiro 最被低估的团队价值不是 AI 写代码，而是 **`.kiro/specs/` 目录天然就是 Git 管理的需求文档**。

传统工作流：需求写在 Notion/Confluence → 开发实现 → 文档过时 → 新人入职靠口口相传。

Kiro 工作流：

```
产品经理描述功能 → Kiro 生成 requirements.md（EARS 格式）
                           ↓
                    提 PR 做需求 Review
                    （工程师、产品、测试一起看）
                           ↓
                    review 通过 → design.md → tasks.md
                           ↓
                    实现完成，spec 文件和代码一起合并
```

六个月后新人来了，读 `.kiro/specs/auth-spec/` 就知道认证模块为什么这么设计、当时有哪些备选方案被否掉了。这是 Cursor 或 Copilot 给不了的。

### Spec PR 的 Review 标准

实际操作中，spec PR 和代码 PR 用不同的 Review 标准：

**需求 Review（requirements.md）**
- 每条需求是否有明确触发条件？（WHEN/IF + 行为主语）
- 是否覆盖异常路径？（用户输入错误、网络超时、权限不足）
- 总数控制在 5–8 条，超出就拆

**设计 Review（design.md）**
- 技术选型是否和 Steering 文件里的规范一致？
- 数据模型有没有遗漏字段或设计缺陷？
- 涉及外部 API 的，安全和限流怎么处理？

**任务 Review（tasks.md）**
- 每个任务能在一次 Kiro 会话（15-20 分钟）内完成吗？
- 任务之间有没有隐藏的依赖没写出来？

## Steering 文件：沉淀老员工的隐性知识

Senior 工程师脑子里装着的"不成文规范"——这个项目不用 try-catch、数据库事务必须在 service 层而不是 controller 层——在 Kiro 之前只能靠 Code Review 传递。有了 Steering 文件，这些变成可版本管理的配置：

```markdown
---
# .kiro/steering/backend-conventions.md
inclusion: always
---
# 后端开发规范（2026-Q2）

## 错误处理
- 所有函数返回 `Result<T, AppError>` 类型，不写 try-catch
- AppError 定义在 `src/types/errors.ts`，新增错误类型要加进去
- HTTP 层统一在 `src/middleware/error-handler.ts` 处理，controller 不碰错误格式

## 数据库
- 事务逻辑只写在 `src/services/` 目录，controller 不直接操 DB
- 所有时间字段存 UTC，显示时再转时区
- DynamoDB GSI 命名：`{entity}-{field}-index`（如 `user-email-index`）

## API 设计
- REST endpoints 用复数名词：`/api/users`，不用 `/api/user`
- 分页统一用 `cursor`，不用 `page`（原因：DynamoDB 不支持 offset 分页）
- 所有 mutation 返回操作后的完整对象，不只是 `{ success: true }`
```

这个文件进了 Git，新人入职第一天 Kiro 就帮他们执行这些规范，不用等 Code Review 才发现问题。

### Steering 文件分层实践

```
~/.kiro/steering/             # 个人级（不进 Git）
├── personal-style.md         # 你自己的偏好，别人不用管

{project}/.kiro/steering/     # 项目级（进 Git，团队共用）
├── tech-stack.md             # 技术选型（always 加载）
├── backend-conventions.md    # 后端规范（always 加载）
├── react-component-rules.md  # 前端规范（fileMatch: "**/*.tsx"）
└── aws-deploy-checklist.md   # 部署规范（manual，需要时手动引用）
```

`fileMatch` 模式特别实用：前端规范只在编辑 `.tsx` 文件时加载，不会干扰后端 AI 的上下文。

## 7 个必须避开的反模式

实际团队使用中总结的高频失误：

### 坑 1：Spec 需求太宽泛

**错误做法**：
```markdown
1. THE SYSTEM SHALL handle user authentication
```

**正确做法**（EARS 格式，行为明确）：
```markdown
1. WHEN a user submits valid email and password THE SYSTEM SHALL return a JWT valid for 24 hours
2. WHEN a user submits an invalid password THE SYSTEM SHALL return 401 and increment the fail counter
3. IF the fail counter reaches 5 THE SYSTEM SHALL lock the account for 30 minutes
4. WHEN a user requests password reset THE SYSTEM SHALL send a link valid for 15 minutes to their registered email
```

宽泛的需求 → Kiro 脑补实现细节 → 你拿到的不是你想要的。

### 坑 2：任务粒度太大

每个 task 控制在 **15–20 分钟 Agent 工作量**。超了就再拆：

```markdown
# ❌ 一个 task 太大
- [ ] Implement the entire authentication system

# ✅ 合适粒度
- [ ] Create User model with email/password/failCount/lockedUntil fields
- [ ] Implement POST /api/auth/login endpoint with bcrypt password verification
- [ ] Add account lockout logic after 5 failed attempts
- [ ] Create POST /api/auth/reset-password endpoint with time-limited token
```

### 坑 3：不写 structure.md，代码风格满天飞

Kiro 在大项目里容易在不同文件里用不同命名风格，或者引入你不想要的库。加一个 structure.md 到 Steering 文件里：

```markdown
---
# .kiro/steering/structure.md
inclusion: always
---
# 项目结构规范

src/
├── api/          # Express routes，只做参数校验和调用 service
├── services/     # 业务逻辑，含事务
├── models/       # DynamoDB 数据访问层
├── types/        # TypeScript 类型定义
└── middleware/   # 全局中间件

禁止引入的库：
- axios（用内置 fetch）
- lodash（用原生 Array/Object 方法）
- moment（用 date-fns）
```

### 坑 4：Autopilot 模式用在生产代码上

第 4 章提到 Autopilot 适合快速原型。**生产代码一定要逐步 Review**，尤其是：

- 数据库 migration（schema 变更一旦跑了很难回滚）
- IAM 权限配置（少一个 Action 不够用，多一个 Action 是安全漏洞）
- 第三方 API 集成（Kiro 可能生成不带重试逻辑或限流处理的代码）

```bash
# 生产代码改动，用逐步模式：
# Chat 面板左下角切回 "Supervised" 模式（非 Autopilot）
# 每个文件改动都会弹出 diff 让你确认
```

### 坑 5：陷入 AI 修 Bug 死循环

Kiro 有时候会对同一个 bug 反复用相同的错误方案修复，形成死循环。识别信号：连续 3 次提交改的是同一块代码但 test 还是失败。

应对方式：

```bash
# 强制切换视角
# 在 Chat 里说：
"Stop trying to fix the test. Instead, explain in plain text
what the function is supposed to do vs. what it currently does."
# 让 Kiro 先理解问题，再提方案
# 你认可方案后再让它改代码
```

或者直接用 Bugfix Spec（第 3 章介绍），给出报错信息 + 复现步骤，走结构化流程而不是聊天修 bug。

### 坑 6：Spec 文件里混入实现细节

requirements.md 描述**行为**，不描述**实现**：

```markdown
# ❌ 把实现方案写进 requirements
1. THE SYSTEM SHALL use bcrypt with salt rounds 12 to hash passwords

# ✅ 行为层面的需求，实现留给 design.md
1. WHEN a user sets a password THE SYSTEM SHALL store it in a form that cannot be reversed to plaintext
```

实现细节放在 design.md 里，这样以后换加密方案只需要改 design 和代码，requirements 不用动。

### 坑 7：过度依赖 Kiro 生成代码不 Review

Kiro 可能生成 1500 行代码解决一个 200 行能搞定的问题（代码膨胀是 AI IDE 通病）。每个 task 完成后，做一遍快速 review：

```bash
# 看 Kiro 改了多少文件
git diff --stat HEAD~1

# 如果改了超过预期的文件数，问 Kiro：
# "You modified 12 files for this task. Explain why each file change was necessary."
```

不理解的代码不合并。Kiro 是助手，最终代码质量是你负责的。

## 新人 Onboarding：3 步上手团队 Kiro 规范

```bash
# Step 1: 克隆项目后，读 Steering 文件
ls .kiro/steering/

# Step 2: 跑一个简单的 spec 感受工作流（别选核心功能，选个边缘工具）
# 比如："Add a CLI command that prints project stats"

# Step 3: 检查自己的第一个 spec PR 是否符合 Review 标准
# 需求是否 EARS 格式、任务是否足够细、design 是否和 Steering 一致
```

第一次 spec PR 的 Review 应该比第一次代码 PR 更严格——这是新人建立 Kiro 使用习惯的关键时刻。
