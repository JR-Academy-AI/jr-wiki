---
title: "多模态 Prompting：让 AI 读图、分析文档、理解截图"
wiki: "prompt-engineering"
order: 6
description: "2026 年主流模型已全面支持图像输入，本章覆盖图像/截图/PDF/图表的 Prompt 写法、Claude Vision API 实战代码，以及多模态场景的常见坑"
---

![多模态 Prompt 架构](https://docs.anthropic.com/images/vision-api-overview.png)

## 为什么多模态 Prompting 是 2026 年的必备技能

2024 年底之前，AI 主要处理文字。2025 年开始，Claude、GPT-4o、Gemini 全面支持图像输入，现在这已经是日常工作流的标准能力：

- **产品经理**：截一张 Figma 设计图，让 AI 直接写前端代码
- **运营人员**：把竞品截图发给 AI，让它分析差异、生成对比报告
- **开发者**：截一张报错截图，AI 比纯文字描述更准确地定位问题
- **分析师**：上传图表/PDF，AI 提取数据并给出洞察

写多模态 Prompt 和写纯文字 Prompt 有几个关键区别。这章专门讲这些区别。

---

## 图像在 API 中怎么传

主流做法有三种，选哪种取决于你的场景：

### 方法 1：URL 引用（最简单）

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "url",
                        "url": "https://example.com/product-screenshot.png",
                    },
                },
                {
                    "type": "text",
                    "text": "这是我们产品的首页截图。分析用户体验的 3 个主要问题，每个问题附上修改建议。"
                }
            ],
        }
    ],
)
print(response.content[0].text)
```

**适合场景**：图片已有公开 URL，不需要上传，最省事。

### 方法 2：Base64 编码（本地图片）

```python
import anthropic
import base64

# 读取本地图片
with open("design-mockup.png", "rb") as f:
    image_data = base64.standard_b64encode(f.read()).decode("utf-8")

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=2048,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": image_data,
                    },
                },
                {
                    "type": "text",
                    "text": "根据这个设计稿，用 React + Tailwind CSS 写出对应的组件代码。"
                }
            ],
        }
    ],
)
```

**适合场景**：处理本地文件、用户上传的图片、不能公开暴露 URL 的内容。

### 方法 3：Files API（批量处理首选）

```python
import anthropic

client = anthropic.Anthropic()

# 第一步：上传图片（只需上传一次）
with open("analytics-chart.png", "rb") as f:
    uploaded_file = client.beta.files.upload(
        file=("analytics-chart.png", f, "image/png"),
    )
file_id = uploaded_file.id  # 保存这个 ID，可以复用

# 第二步：用 file_id 引用图片（不需要重复上传）
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {"type": "file", "file_id": file_id},
                },
                {
                    "type": "text",
                    "text": "提取这张图表里的所有数据点，输出为 JSON 格式。"
                }
            ],
        }
    ],
    betas=["files-api-2025-04-14"],
)
```

**适合场景**：同一张图要问多个问题（比如多轮对话），或者批量处理大量图片。每次请求不重新传图，省 token 也省钱。

---

## 多模态 Prompt 的核心原则

### 原则 1：图片放在文字前面

Claude 处理图像时，图片放在 Prompt 前面比放在后面效果更好：

```python
# ✅ 正确顺序：图片 → 文字
content = [
    {"type": "image", "source": {...}},
    {"type": "text", "text": "分析这张图片中的..."}
]

# ❌ 效果稍差：文字 → 图片
content = [
    {"type": "text", "text": "请分析以下图片中的..."},
    {"type": "image", "source": {...}}
]
```

原因：模型处理时按顺序建立上下文，先看到图像再读指令，视觉信息能更好地整合到后续推理中。

### 原则 2：用指令动词明确任务类型

不同任务用不同的动词，让模型知道你要什么深度的分析：

| 动词 | 场景 | 示例 |
|------|------|------|
| **描述** | 快速了解图片内容 | "描述这张截图的主要 UI 元素" |
| **分析** | 深度解读 | "分析这张图表的趋势，找出异常点" |
| **提取** | 结构化输出 | "提取图片中的所有文字，输出 JSON" |
| **对比** | 多图比较 | "对比这两张设计稿，列出差异" |
| **评估** | 质量判断 | "评估这个 UI 设计的可用性问题" |

### 原则 3：告诉 AI 你知道什么，让它专注于你不知道的

```
❌ "分析这张图"
→ AI 不知道你的目标，会给出泛泛的描述

✅ "这是我们 SaaS 产品的用户注册页面截图，转化率只有 3%（行业均值 8%）。
   分析可能导致转化率低的 UX 问题，不需要描述你能看到什么，直接给问题和改进建议。"
→ 明确背景 + 目标 + 约束，AI 直接给有价值的输出
```

---

## 四种典型场景的 Prompt 模板

### 场景 1：截图转代码

最常见的用法，把设计稿或界面截图变成可运行代码：

```
你是一个 React + Tailwind CSS 专家。

根据截图，实现这个 UI 组件：
- 技术栈：React 18 + TypeScript + Tailwind CSS
- 要求像素级还原，包括颜色、间距、字体大小
- 使用语义化 HTML
- 组件接受 props：[列出你需要的 props]
- 不需要解释，直接输出完整的 .tsx 文件
```

**实际效果**：设计稿截图 → Claude 输出 React 组件，通常一次成功率 70-80%，比口头描述高得多。

### 场景 2：图表数据提取

```python
CHART_EXTRACTION_PROMPT = """
从这张图表中提取数据，严格按以下 JSON 格式输出：

{
  "chart_type": "bar/line/pie/scatter",
  "title": "图表标题（如有）",
  "x_axis": {"label": "", "unit": ""},
  "y_axis": {"label": "", "unit": ""},
  "data_points": [
    {"x": "", "y": 0, "label": ""}
  ],
  "source": "图表来源（如有）",
  "notes": "你对数据准确性的信心和任何不确定的地方"
}

规则：
- 数字尽量精确到图表显示的精度
- 如果某个值看不清楚，在 notes 里说明
- 不要猜测，宁可标注为 null
"""
```

### 场景 3：错误截图诊断

```
这是一个 [Python/JavaScript/浏览器] 的错误截图。

帮我诊断：
1. 错误的根本原因是什么（一句话）
2. 最可能的触发场景
3. 修复步骤（给出具体代码）

上下文：
- 这段代码是做 [功能描述]
- 这个错误 [总是出现/偶尔出现，触发条件是...]
```

### 场景 4：多图对比分析

```python
# 同时发两张图进行比较
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=2048,
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "图片 1：我们的产品首页"},
                {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": our_page}},
                {"type": "text", "text": "图片 2：竞品 A 的首页"},
                {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": competitor_page}},
                {
                    "type": "text",
                    "text": """对比这两个首页，从以下维度分析：
1. 视觉层级（用户眼睛先看哪里）
2. 核心价值主张的清晰度
3. CTA 按钮的设计和位置
4. 信息密度（是否过载）
总结：我们在哪些方面落后，哪些方面更好。"""
                }
            ],
        }
    ],
)
```

---

## 成本和性能注意事项

图像会消耗 token，不是免费的：

```
token 计算公式：tokens ≈ (width × height) / 750

1000×1000 像素的图 ≈ 1,334 tokens
以 Claude Sonnet 4.6 计算 ≈ $0.004/张图
```

**控制成本的实际建议**：

1. **提交前压缩图片**：长边不超过 1568px，超过了 API 会自动缩小但你白付了传输时间
2. **截图时裁剪到关键区域**：不要发整个 4K 屏幕截图，只截你要分析的部分
3. **批量任务用 Files API**：同一张图问多个问题，用 `file_id` 引用，不重复计费

---

## 多模态 Prompt 的常见坑

**坑 1：AI 描述了图片但没有完成任务**

```
❌ "看看这张截图"
→ AI 开始详细描述图片内容，不是你要的

✅ "不需要描述图片内容，直接：[你的具体任务]"
```

**坑 2：AI 对图中文字识别出错但没有告诉你**

小字体、中文手写、艺术字体的 OCR 准确率下降。在 Prompt 里加：
```
如果图中有文字你无法确定，请标注 [?] 而不是猜测。
```

**坑 3：发了截图但 AI 说"作为文字 AI 我没法看图"**

这不是模型能力问题，是代码里没有正确传入图像内容块。检查你的 `content` 数组是否包含 `{"type": "image", ...}`。

**坑 4：期望 AI 分析图表时像素级准确**

AI 读图表时的误差约为 ±5-10%，用于快速洞察没问题，如果需要精确数据应该用表格数据而不是图片。
