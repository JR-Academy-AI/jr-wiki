---
title: "Gamma 核心功能：Agent 编辑、品牌定制和交互元素"
wiki: "gamma-guide"
order: 3
description: "Gamma Agent 自然语言编辑、品牌套件、图片生成模型、交互元素（Toggle / Nested Card）、图表和嵌入"
---

上一章你学会了用 Gamma 快速生成演示文稿。这一章深入它的核心功能——Gamma Agent 是最值得花时间掌握的，能让你用自然语言像指挥助手一样修改整套内容。

![Gamma Agent 编辑界面](https://img.youtube.com/vi/rLFOJPHkhPE/maxresdefault.jpg)

## Gamma Agent：你的 AI 设计搭档

2025 年 9 月 Gamma 发布了 3.0 版本，最大更新就是 **Gamma Agent**。按 `Cmd+E`（Mac）或 `Ctrl+E`（Windows）呼出，你可以用自然语言让它改任何东西：

```
# 这些都是实际可用的 Agent 指令

"把所有卡片的标题换成更有冲击力的措辞"
"给第 3 张卡片加一个 React vs Vue 的性能对比表格"
"全部换成深色主题，突出科技感"
"帮我把整套内容翻译成英文"
"检查所有卡片的拼写和语法错误"
"基于这个链接的内容补充一张新卡片：https://example.com"
```

Agent 支持的操作范围：
- **批量编辑**：一句话改全部卡片的风格、措辞、配色
- **联网搜索**：给它一个 URL 或让它搜索资料，自动带引用来源
- **图片理解**：截图拖进对话框，它能理解截图内容并据此修改
- **翻译**：支持 30+ 种语言互翻，中英日韩都没问题
- **生成图表**：描述数据，它帮你画柱状图、饼图、折线图

用 Agent 改一整套 10 张卡片的风格，只需要一句话 + 等几秒。手动做同样的事至少 20 分钟。

## 品牌定制

如果你经常用 Gamma 做公司相关的演示，设置一次品牌套件后面就省心了。

进 Workspace Settings → Brand，可以设置：
- **品牌色**：主色、辅助色、背景色
- **Logo**：自动出现在每张卡片的页脚
- **字体**：自定义标题和正文字体（支持中文字体如宋体、微软雅黑）
- **默认主题**：所有新建内容自动用你的品牌主题

设完之后，生成内容时选 "Apply brand" 就行。Agent 也能识别品牌设置——你说"用公司品牌风格重做"，它会自动套用。

Pro 和 Ultra 用户还能加自定义域名，把 Gamma 页面挂在 `slides.yourdomain.com` 这样的地址上。

## 图片生成模型

Gamma 内置了多个 AI 图片模型，你不需要去 Midjourney 或 DALL·E 单独生成再粘过来：

| 模型 | 特点 | 适合场景 |
|------|------|---------|
| **Flux Fast** | 速度快，通用风格 | 日常配图 |
| **Nano Banana Pro** | 能处理图中文字、高清 4K | 需要图片里有可读文字的场景 |
| **Unsplash / Pexels** | 真实照片 | 需要写实风格 |
| **GIPHY** | 动图 | 轻松有趣的演示 |
| **Pictographic** | 插画风格 | 图标式说明 |

换图片的时候点击图片 → 选 "Replace" → 可以指定用哪个模型重新生成，或者输入 prompt 描述你想要的画面。

## 交互元素

这是 Gamma 比传统 PPT 强的地方——卡片里能放会动的东西：

**折叠区域（Toggle）**：用 `/toggle` 插入，观众点击展开 / 收起。用法举例：

```
▶ Q: React 和 Vue 哪个性能更好？
  （点击展开）
  A: 原始渲染速度差异很小。Vue 3 的响应式系统在细粒度更新上
  有优势；React 的虚拟 DOM diffing 在大型列表上更稳定。
  实际项目中瓶颈通常不在框架层面...
```

**嵌套子卡片（Nested Card）**：卡片里套卡片，点击可以展开成全屏。适合把补充内容藏起来，不占主线篇幅。

**嵌入（Embed）**：Gamma 能直接嵌入外部内容：
- YouTube / Vimeo / Loom 视频
- Figma 设计稿（可交互）
- Miro 白板
- Airtable / Google Sheets 表格
- Typeform / Google Forms 表单
- Google Maps 地图

嵌入是实时的——视频能直接在演示里播放，Figma 稿能直接点击查看图层，不用切应用。

## 图表功能

Gamma 有内置的 Chart 模块，用 `/chart` 插入：

```
支持的图表类型：
- 柱状图 (Bar Chart)
- 折线图 (Line Chart)
- 饼图 (Pie Chart)
- 环形图 (Donut Chart)

数据输入方式：
- 手动填表格
- 用 Agent 描述数据让 AI 生成
- 从 Google Sheets embed 实时数据
```

对于简单的数据可视化（季度对比、技术栈占比、团队分工）内置图表够用了。复杂的交互式图表还是推荐嵌入 Google Sheets 或用外部工具。

## Remix：站在别人的成果上改

Gamma 有一个叫 **Remix** 的功能——看到别人公开的 Gamma 内容，点 Remix 就能复制一份到你的工作台，然后按自己需求修改。

这对开发者来说很实用：看到一个写得好的技术架构演示模板，Remix 过来换成你自己项目的内容。比从零 prompt 效率高很多。在 Gamma 的模板库（gamma.app/templates）里有大量公开模板可以直接 Remix。

## 快捷键速查

| 操作 | Mac | Windows |
|------|-----|---------|
| 呼出 Agent | `Cmd+E` | `Ctrl+E` |
| 斜杠命令 | `/` | `/` |
| 撤销 | `Cmd+Z` | `Ctrl+Z` |
| 加粗 | `Cmd+B` | `Ctrl+B` |
| 插入链接 | `Cmd+K` | `Ctrl+K` |
| 演示模式 | `Cmd+Shift+P` | `Ctrl+Shift+P` |
