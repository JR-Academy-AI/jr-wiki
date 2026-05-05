---
title: "核心功能深度拆解：Browser、Code、Design View"
wiki: "manus-guide"
order: 3
description: "Cloud Browser 自主浏览、Code Sandbox 全栈开发、Design View 可视化、Wide Research 并行调研"
---

## Cloud Browser：自主浏览网页

Manus 最强的能力是 Cloud Browser——一个运行在云端的真实浏览器，Agent 可以像人一样操作它：

![Manus 工作界面演示](https://img.youtube.com/vi/43xJMWBEbfY/maxresdefault.jpg)

它能做的事：

- 打开任意 URL、在搜索引擎搜索
- 点击按钮、填写表单、选择下拉菜单
- 滚动页面、截图、提取文本
- 在多个 Tab 之间切换
- 处理 JavaScript 动态渲染的页面（SPA 也能抓）

```python
# 利用 Cloud Browser 的典型任务
tasks_using_browser = [
    "去 LinkedIn 搜索某公司的员工信息",
    "打开 Google Trends 查询关键词趋势",
    "从政府网站下载公开数据集",
    "在电商网站比价（Amazon vs eBay）",
    "截取竞品网站的设计截图做分析",
]
```

Cloud Browser 的局限：遇到 CAPTCHA、双因素登录、或强反爬网站时会卡住。这时 Manus 通常会告诉你它无法访问，然后尝试换一个来源。

## Code Sandbox：全栈开发环境

Manus 内置了一个完整的开发环境，支持：

- **Python**：数据分析（pandas, matplotlib）、爬虫（requests, BeautifulSoup）、机器学习
- **Node.js / JavaScript**：前端应用（React, Vue）、后端 API（Express, Fastify）
- **终端命令**：安装包、操作文件、运行脚本
- **数据库**：可以起 SQLite，复杂场景连外部数据库

一个实际案例——让 Manus 做数据分析：

```
分析这份 CSV 文件（上传附件）：
1. 清洗数据（去除空行、统一日期格式）
2. 按月份聚合销售额
3. 画一张折线图 + 柱状图组合
4. 找出增长最快的 3 个产品类别
5. 生成 PDF 报告
```

Manus 会在 Code Sandbox 里：

```python
import pandas as pd
import matplotlib.pyplot as plt

# Agent 实际运行的代码（你能在终端面板里看到）
df = pd.read_csv('sales_data.csv')
df['date'] = pd.to_datetime(df['date'])
monthly = df.groupby(df['date'].dt.to_period('M'))['revenue'].sum()

fig, ax1 = plt.subplots(figsize=(12, 6))
ax1.bar(monthly.index.astype(str), monthly.values, alpha=0.3)
ax1.plot(monthly.index.astype(str), monthly.values, 'r-o')
plt.savefig('monthly_revenue.png', dpi=150, bbox_inches='tight')
```

所有中间文件和最终产出都能下载。

## Design View：可视化设计

2025 年底 Manus 推出 Design View——一个类似 Figma 的可视化界面，Agent 可以在里面直接设计 UI：

![Manus Design View](https://img.youtube.com/vi/hxNJBw_bNag/maxresdefault.jpg)

适合这类任务：

- "设计一个 Landing Page"——Agent 会在 Design View 里排版、选色、放组件
- "做 5 张社交媒体海报"——自动生成多尺寸图片
- "把这个 wireframe 变成高保真设计"——上传草图，Agent 补全细节

Design View 的产出可以直接导出为 HTML/CSS 代码或 PNG 图片。

## Wide Research：并行深度调研

对于大规模调研任务，Manus 有 Wide Research 模式——同时派出多个 AI sub-agent 并行搜索：

```
场景：调研 200 个潜在客户的联系方式

传统模式（单线程）：
  搜索公司 A → 搜索公司 B → ... → 搜索公司 N
  预计时间：3-4 小时

Wide Research 模式（并行）：
  ┌→ Sub-agent 1: 搜索公司 1-20
  ├→ Sub-agent 2: 搜索公司 21-40
  ├→ Sub-agent 3: 搜索公司 41-60
  └→ ...
  预计时间：15-30 分钟
```

触发方式：任务里涉及大量重复性搜索时，Manus 会自动切换到 Wide Research 模式。也可以在 prompt 里明确说"请使用并行搜索"。

## Projects：知识库 + 自定义指令

Manus 的 Projects 功能让你为特定场景创建持久化配置：

```yaml
# Project 结构示例
my_project:
  master_instruction: |
    你是 JR Academy 的内容运营助手。
    品牌调性：专业但不死板，面向华人留学生。
    输出语言：中文为主，技术名词保留英文。
  knowledge_base:
    - brand_guidelines.pdf
    - product_catalog.xlsx
    - tone_of_voice_examples.md
  agent_skills:
    - competitive_analysis
    - content_generation
```

设置好 Project 后，每次新对话自动加载这些上下文——不用每次重复描述你是谁、要什么风格。

## 定时任务（Scheduled Tasks）

Manus 支持设置定时任务，让 Agent 按计划自动执行：

- 每天早上抓取行业新闻 → 整理成日报
- 每周一分析竞品网站变更
- 每月生成销售数据可视化报告

Free 方案限 2 个定时任务，付费方案不限。

## 一键部署

写完代码，Manus 可以直接部署为公开可访问的网站：

```
帮我做一个简单的 TODO App：
- React + Tailwind CSS
- 支持添加、删除、标记完成
- 部署到公网让我能访问
```

Manus 写完代码后会给你一个公开 URL，直接可以分享。适合快速原型验证，但不建议用于生产环境（没有自定义域名、数据持久化等）。
