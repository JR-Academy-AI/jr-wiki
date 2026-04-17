---
title: "注册到第一个项目：10 分钟跑通全流程"
wiki: "bolt-new-guide"
order: 2
description: "从注册 Bolt.new 账号到部署上线，手把手走一遍完整开发流程"
---

Bolt.new 的上手速度大概是所有开发工具里最快的——不装软件，不配环境，浏览器打开就能写全栈应用。

## 注册

1. 打开 [bolt.new](https://bolt.new)
2. 用 Google 账号登录（免费）
3. 进入主界面，直接看到一个大输入框

免费账户每月有 100 万 Token，每天上限 30 万。够你认真做 3-5 个小项目。

## 写第一个 Prompt

Bolt.new 的首页就是一个对话框，直接描述你想要什么应用：

```
帮我做一个个人记账应用：
- 首页显示本月收支汇总和趋势图
- 可以添加收入和支出记录，选择分类
- 有一个分类统计页面，用饼图展示
- 用 React + TypeScript + Tailwind CSS
- 数据存在 localStorage
```

点击发送后，Bolt.new 会：

1. 生成完整项目结构（通常 10-20 个文件）
2. 自动 `npm install` 安装依赖（< 500ms）
3. 启动开发服务器
4. 在右侧显示实时预览

整个过程 30-90 秒。

![Bolt.new 编辑器与预览](https://bolt.new/opengraph-image.png)

## 三种交互模式

这是 Bolt.new 最容易被忽略但最值得学的功能：

| 模式 | 用途 | Token 消耗 |
|------|------|-----------|
| **Build** | 默认模式，每次对话直接改代码 | 最高 |
| **Plan** | AI 先出方案让你审核，确认后再执行 | 中等 |
| **Discussion** | 纯聊天讨论，不动代码 | 最低（省 ~90%） |

切换方式：聊天框右下角有模式选择按钮。

**实战建议**：先用 Discussion 模式聊清楚需求和技术方案，再切到 Build 模式让 AI 动手。这个习惯能帮你省一半以上的 Token。

## Enhance Prompt 功能

如果你懒得写详细需求，点击输入框左下角的加号 → "Enhance prompt"。Bolt.new 会把你的一句话扩展成详细的需求文档：

```
输入："做一个 todo 应用"

↓ Enhance 后 ↓

构建一个任务管理应用，使用 React + TypeScript + Tailwind CSS，
包含以下功能：
- 任务的增删改查
- 任务优先级标记（高/中/低）
- 截止日期设置
- 完成状态切换
- 按状态和优先级筛选
- 响应式设计，支持移动端
- 数据持久化到 localStorage
```

一个好的初始 prompt 能省掉后面很多来回修补。

## 版本回退

改崩了？别慌。Bolt.new 自动保存每次修改的版本快照，点击历史版本即可回退，而且**回退不消耗 Token**。这比用 ChatGPT 写代码再复制粘贴好太多了。

## 一键部署

项目满意后，点右上角 "Deploy"：

```
部署选项：
├── bolt.host  → 免费，30 秒上线，得到 xxx.bolt.host URL
├── Netlify    → 连接后一键部署，支持自定义域名
└── 下载 ZIP   → 拿到完整代码，部署到任何平台
```

免费用户部署到 bolt.host 会带一个小水印，Pro 用户无水印。

## .bolt/ignore 文件

跟 .gitignore 类似，告诉 AI 哪些文件不用关注：

```
# .bolt/ignore
node_modules/
dist/
.next/
*.lock
```

项目文件越多，每次对话的 Token 开销越大。用好这个文件能明显减少消耗。
