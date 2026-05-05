---
title: "高级技巧：让 Manus 输出质量翻倍"
wiki: "manus-guide"
order: 4
description: "Prompt 工程、Projects 知识库、Agent Skills 复用、Wide Research 并行调研、实战案例"
---

## Prompt 写法决定一切

Manus 和普通 ChatGPT 最大的区别是：它真的会按你的指令去执行。指令越精确，结果越好；指令越模糊，credits 越浪费。

![Manus 实战全功能演示](https://img.youtube.com/vi/3mdNmNLcWYQ/maxresdefault.jpg)

### 五段式 Prompt 结构

给 Manus 写复杂任务时，用这个结构：

```markdown
## 角色
你是一个 [具体角色]，擅长 [具体能力]

## 背景
- 当前情况：[context]
- 已有信息：[已知条件]

## 任务步骤
1. 第一步：[具体操作 + 预期产出]
2. 第二步：[具体操作 + 预期产出]
3. ...

## 输出要求
- 格式：[Markdown / PDF / Excel / 代码]
- 语言：[中文 / 英文]
- 字数/规模：[具体数字]

## 约束条件
- 不要 [明确排除项]
- 必须 [质量底线]
```

### 好 vs 坏 prompt 对比

```
❌ 坏：帮我做个竞品分析
   → Agent 不知道分析哪些竞品、从哪些维度、要什么格式
   → 消耗 200+ credits，结果可能不是你要的

✅ 好：分析 Notion、Obsidian、Logseq 三个笔记工具：
   1. 分别搜索官网查定价（个人版 vs 团队版）
   2. 从 G2.com 和 Reddit 收集用户评价（各 3-5 条）
   3. 对比：离线支持、API 开放性、中文体验、社区活跃度
   4. 输出 Markdown 表格 + 500 字总结推荐
   → 方向明确，Agent 直奔主题，~100 credits 搞定
```

## Projects：建立长期记忆

每次新对话 Manus 都会"失忆"。Projects 解决这个问题——为特定场景创建持久化的上下文：

```yaml
# 创建 Project 的步骤：
# 1. 左侧菜单 → Projects → New Project
# 2. 设置 Master Instruction（自动加载到每次对话）
# 3. 上传 Knowledge Base 文件
# 4. 保存

# Master Instruction 示例：
master_instruction: |
  你为 JR Academy（匠人学院）工作，是技术内容运营。
  
  品牌规范：
  - 语言：中文为主，技术名词保留英文原文
  - 调性：专业但亲切，面向澳洲华人 IT 学员
  - 禁用：AI 味浓的词（赋能、深入浅出、全方位）
  
  输出规范：
  - 文章 1500-3000 字
  - 必须有代码示例
  - 必须有对比表格
```

上传到 Knowledge Base 的文件（品牌手册、产品文档、设计规范）会被每次对话自动引用，不用重复上传。

## Agent Skills：把工作流变成一键命令

做完一次任务后，如果这个流程以后还会用，把它存成 Skill：

```bash
# 在对话里对 Manus 说：
"把刚才的工作流保存为 Skill，名字叫 weekly-competitor-report"

# Manus 会生成一个 SKILL.md 文件，包含：
# - 触发条件
# - 执行步骤
# - 需要的输入参数
# - 预期输出格式

# 以后直接用：
/weekly-competitor-report Notion,Obsidian,Logseq
```

实用 Skill 示例：

| Skill 名 | 功能 | 触发方式 |
|-----------|------|---------|
| `daily-news-digest` | 搜索行业新闻 → 整理成摘要 | `/daily-news-digest AI教育` |
| `code-review` | 分析 GitHub PR → 生成评审意见 | `/code-review [PR URL]` |
| `market-sizing` | TAM/SAM/SOM 市场规模估算 | `/market-sizing 在线编程教育 澳洲` |
| `landing-page` | 生成 Landing Page + 部署 | `/landing-page 产品描述` |

## Wide Research：100 个 Agent 并行干活

普通 Agent 是单线程——搜索 A、再搜 B、再搜 C。Wide Research 模式同时派出一群 sub-agent：

```python
# Wide Research 适用场景
wide_research_cases = {
    "大规模人才搜索": "同时搜 200 个候选人的 LinkedIn",
    "批量竞品监控": "并行抓取 50 个竞品网站的定价变动",
    "市场调研": "同时研究 30 个城市的房产数据",
    "学术文献": "并行阅读 100 篇论文摘要并分类",
}

# 触发方式：在 prompt 里明确说
# "请使用 Wide Research 模式，并行搜索以下 N 个目标..."
# 或者任务自然涉及 10+ 个独立搜索目标时自动触发
```

Wide Research 的关键优势：每个 sub-agent 有独立的 context window。传统 AI 搜索 10 个东西后，前面的信息开始模糊；Wide Research 的每个子代理只负责 1-2 个目标，信息不会丢。

## 实战案例：从零部署一个 SaaS

让我们看一个开发者常见场景——用 Manus 做一个完整的 SaaS 原型：

```
帮我做一个「AI 面试模拟器」Web App：

功能需求：
1. 用户输入目标职位（如"Junior Frontend Developer"）
2. AI 生成 5 个面试问题
3. 用户输入答案，AI 给出评分和改进建议
4. 历史记录页面

技术要求：
- React + Tailwind CSS 前端
- Node.js + Express 后端
- SQLite 数据库
- 调用 Claude API 生成面试题和评分

部署要求：
- 部署到公网，给我访问链接
- 代码可导出
```

Manus 的执行过程（约 15-20 分钟）：

1. 规划架构（前后端分离、API 设计）
2. 在 Code Sandbox 里创建项目结构
3. 写前端页面（React 组件、路由、样式）
4. 写后端 API（Express routes、数据库 schema）
5. 集成 AI 接口
6. 本地测试通过
7. 一键部署、返回公开 URL

## 省 Credits 的实战技巧

```python
tips_save_credits = [
    "Chat Mode 做前期沟通，确认方向后再切 Agent Mode",
    "上传参考文件而不是让 Agent 去搜索（搜索消耗高）",
    "一次说清所有要求，避免'再加一个...再改一下...'",
    "复杂任务拆成 2-3 个小任务分别执行（单次过长容易超时重试）",
    "用 Projects + Skills 避免重复描述背景信息",
    "评分完成的任务（4-5 星）——高评分有概率触发 credit 返还",
]
```
