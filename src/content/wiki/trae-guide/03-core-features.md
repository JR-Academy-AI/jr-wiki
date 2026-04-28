---
title: "Trae 三大核心模式：Chat、Builder、SOLO 深度拆解"
wiki: "trae-guide"
order: 3
description: "深入掌握 Trae 的三种 AI 模式：Chat Mode 智能对话、Builder Mode 全栈生成、SOLO Mode 自主编程，外加多模态和模型切换"
---

Trae 的核心竞争力不是某个单一功能，而是三种模式覆盖了从"问个问题"到"AI 自己写完整个项目"的全部场景。搞清楚每种模式的边界，才能选对工具干对活。

![Trae Builder Mode 实时预览](https://img.youtube.com/vi/FLJSndDR3gA/maxresdefault.jpg)

## Chat Mode：日常问答和局部修改

Chat Mode 是最基础的交互方式。按 `Cmd+I`（macOS）或 `Ctrl+I`（Windows）打开侧边面板就能用。

**能干什么**：
- 选中一段代码，问"这段在干什么"
- 让 AI 重构一个函数、加注释、写单测
- 粘一段报错信息，让 AI 帮你排查
- 问架构问题："这个项目用什么状态管理方案比较好"

**实际用法**：

```typescript
// 选中这段代码，按 Cmd+I 问 "优化这个函数的性能"
function findDuplicates(arr: number[]): number[] {
  const result: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j] && !result.includes(arr[i])) {
        result.push(arr[i]);
      }
    }
  }
  return result;
}
// AI 会建议用 Set 重写，把 O(n³) 降到 O(n)
```

Chat Mode 的上下文感知做得不错——它能自动读取当前打开的文件和项目结构，不需要你手动 `@` 引用每一个文件。但在大型项目里（5 万行+），上下文可能不完整，需要你主动指定关键文件。

## Builder Mode：自然语言生成全栈项目

Builder Mode 是 Trae 和 Cursor 拉开差距的功能。Cursor 没有等价物——它更像 Bolt.new 的体验搬进了桌面 IDE。

**工作流程**：

1. 描述你要什么（越具体越好）
2. AI 分析需求，列出实现步骤
3. 自动创建文件、写代码、装依赖、启动 dev server
4. Webview 窗口实时预览——可以点击、输入、交互
5. 追加修改需求，AI 增量更新代码

**最佳实践**：

```
❌ 不好的 prompt：
"做一个网站"

✅ 好的 prompt：
"用 Next.js 14 + Tailwind + shadcn/ui 做一个个人博客。
需要：首页文章列表、文章详情页、About 页面。
文章数据用 MDX 文件存储。支持深色模式切换。
部署目标是 Vercel。"
```

Builder Mode 支持**多模态输入**——直接把 Figma 截图、手绘草图、或者竞品网站截图拖进对话框，AI 会分析图片内容生成对应的 UI 代码。这对前端开发者来说太实用了。

## SOLO Mode：AI 自主编程（Trae 2.0）

SOLO Mode 是 Trae 最激进的功能，2026 年随 Trae 2.0 发布。它不是"你指挥 AI 干活"，而是"AI 自己规划、自己干活、你审核结果"。

**完整工作流**：

1. 你描述一个功能需求
2. SOLO 生成一份 PRD 式的项目规格说明
3. 分析现有代码架构，规划实现方案
4. 自主写代码、集成到现有系统、跑测试
5. 发现 bug 自己修、优化性能
6. 你审核最终结果，决定接受或回滚

**Extended View** 功能让你全程透明地看到 AI 的思考过程——它在看哪些文件、为什么做这个决定、下一步打算干什么。

**适合 SOLO 的场景**：
- 独立的新功能模块（不牵扯太多现有代码）
- 重构一个自包含的组件
- 写一套 CRUD API
- 生成测试用例

**不适合 SOLO 的场景**：
- 改动会级联影响整个项目的核心逻辑
- 需要领域专家判断的业务逻辑
- 涉及安全敏感代码（认证、支付）

我的体验是：SOLO Mode 在中小型、边界清晰的任务上表现不错，但别指望它搞定整个复杂系统的架构设计。

## AI 模型选择

Trae 免费版支持多个模型：

| 模型 | 特点 | 适合场景 |
|------|------|---------|
| **Claude Sonnet** | 代码质量最高，理解力强 | 复杂逻辑、架构设计 |
| **GPT-4o** | 速度快，覆盖面广 | 日常开发、快速迭代 |
| **Gemini 2.5 Pro** | 长上下文窗口，多模态强 | 大文件分析、图片转代码 |
| **DeepSeek R1** | 推理能力强，中文理解好 | 算法题、数学相关 |

默认 Claude Sonnet 就够了，遇到需要快速迭代的场景切 GPT-4o，算法问题试试 DeepSeek R1。Gemini 2.5 Pro 在处理超长文件时有优势。
