---
title: "项目实战：用 Cascade 搭全栈 CRUD"
wiki: "windsurf-guide"
order: 8
description: "从零开始用 Windsurf Cascade 搭建一个带数据库的全栈待办应用，完整记录每一步"
---

光看功能介绍不直观，这一章完整演示用 Windsurf 从空目录到可运行的全栈应用的过程。项目是一个带用户认证的 Todo CRUD，技术栈 Next.js + Prisma + SQLite。

![Windsurf 全栈项目实战](https://img.youtube.com/vi/hwgMY9Xltto/maxresdefault.jpg)

## 第一步：初始化项目

打开一个空文件夹，在 Cascade Code 模式里输入：

```
创建一个 Next.js 15 + TypeScript 项目，用 App Router。
集成 Prisma ORM + SQLite 做数据库。
不要用任何 UI 库，用 Tailwind CSS 手写样式。
```

Cascade 会自动执行：

```bash
npx create-next-app@latest todo-app --typescript --tailwind --app --src-dir
cd todo-app
npm install prisma @prisma/client
npx prisma init --datasource-provider sqlite
```

等它跑完你会看到一个标准的 Next.js 项目结构，`prisma/schema.prisma` 已经创建好。

## 第二步：定义数据模型

继续告诉 Cascade：

```
在 prisma/schema.prisma 里定义两个模型：
- User：id, email (unique), password, name, createdAt
- Todo：id, title, completed (默认 false), createdAt, userId (外键关联 User)
然后跑 prisma migrate
```

Cascade 会编辑 schema 文件并执行迁移：

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String
  createdAt DateTime @default(now())
  todos     Todo[]
}

model Todo {
  id        Int      @id @default(autoincrement())
  title     String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
}
```

```bash
npx prisma migrate dev --name init
# 自动生成 prisma/migrations/ 目录和 SQLite 数据库文件
```

## 第三步：API 路由

```
创建 CRUD API 路由：
- POST /api/todos - 新建待办
- GET /api/todos - 获取当前用户的所有待办
- PATCH /api/todos/[id] - 更新待办状态
- DELETE /api/todos/[id] - 删除待办
用 NextResponse，数据库操作用 Prisma Client
```

Cascade 会在 `src/app/api/todos/` 下创建 `route.ts` 和 `[id]/route.ts`，每个端点大约 20-30 行代码。这里的关键是让 Cascade 一次性生成所有路由，而不是一个一个写——它能保持代码风格一致。

## 第四步：前端页面

```
创建 /todos 页面，功能：
- 顶部输入框 + 添加按钮
- 待办列表，每项有勾选和删除按钮
- 勾选后文字加删除线
- 用 Server Actions 或 fetch 调用 API
- 样式用 Tailwind，暗色主题
```

Cascade 会创建 `src/app/todos/page.tsx` 和相关的 Client Components。它一般会把列表项拆成独立组件（`TodoItem.tsx`），这是合理的拆分。

这时候用 **Web Preview** 功能实时查看效果：点 Cascade 面板右上角的预览按钮，边改边看，不用切浏览器。

## 第五步：收尾和优化

项目能跑了，让 Cascade 做收尾：

```
请检查并优化：
1. API 路由加入参校验（title 不能为空，不能超过 200 字符）
2. 加 loading 状态和错误提示
3. 空列表显示友好的提示文案
4. 添加成功后自动清空输入框并 focus
```

Cascade 会跨多个文件做这些优化，每步都有 diff 预览。

## 从这个项目学到什么

整个过程耗时大约 15-20 分钟（如果你手写，少说两个小时）。几个关键操作习惯：

- **大任务先给全貌**。第一个 prompt 就说清技术栈和项目结构，后面的 prompt 就不用反复解释上下文。
- **一次只做一层**。数据模型 → API → 前端 → 优化，每步让 Cascade 完成后检查一下再继续，别一个 prompt 塞所有需求。
- **善用 Web Preview**。前端改动实时看效果，比盲写然后刷浏览器高效得多。
- **Revert 不可怕**。Cascade 生成的代码不满意直接 Revert 重来，比手动改它的代码更快。
