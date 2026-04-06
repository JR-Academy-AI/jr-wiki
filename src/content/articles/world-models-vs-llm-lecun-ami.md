---
title: "世界模型 vs LLM：LeCun 的 $10 亿赌注能否颠覆 AI 格局"
description: "Yann LeCun 离开 Meta 创立 AMI Labs 融资 $10.3 亿，押注世界模型取代 LLM。本文解析 JEPA 架构原理、与 Transformer 的核心差异，以及对 AI 开发者的实际影响。"
publishDate: 2026-04-06
tags:
  - world-models
  - jepa
  - yann-lecun
  - ami-labs
  - ai-architecture
author: "JR Academy"
keywords: "世界模型, JEPA, Yann LeCun, AMI Labs, LLM局限, AI架构, 自监督学习, 具身智能"
---

![世界模型 vs LLM Yann LeCun JEPA 架构 AI未来](https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80)

## 背景：一个图灵奖得主的"叛逆"

2026 年 3 月，Yann LeCun 做了一件让整个 AI 圈震动的事：离开工作了十年的 Meta，拿了 $10.3 亿创立 AMI Labs，然后公开说——**你们搞的 LLM 路线从根本上就是错的。**

这不是一个边缘人物在碰瓷。LeCun 是卷积神经网络（CNN）的发明者、2018 年图灵奖得主、Meta AI 首席科学家。他不是不懂 LLM——他只是认为 LLM 有一个无法靠"规模"解决的根本缺陷。

AMI Labs 的种子轮 $10.3 亿，估值 $35 亿，是欧洲历史上最大的种子轮。投资人包括 Jeff Bezos、Eric Schmidt、Mark Cuban、Tim Berners-Lee，以及 Nvidia。这些人不是在做慈善——他们在对冲一个可能性：万一 LLM 真的是死胡同呢？

## 为什么 LeCun 认为 LLM 走不通

LeCun 的核心论点可以归结为一句话：**一个只读过书的 AI，永远学不会骑自行车。**

LLM 的本质是 next token prediction——给定前文，预测下一个词。无论参数量多大（哪怕 Mythos 的 10 万亿），它的学习信号都来自文本。而文本是人类知识的一种**高度压缩的、有损的表示**。

举个例子：你可以读 100 本关于游泳的书，但下水还是会沉。因为游泳需要的是对水的阻力、身体平衡、呼吸节奏的**物理直觉**——这些信息在文本中根本不存在。

LeCun 认为，这个限制不是工程问题（更多数据、更大模型能解决），而是**架构问题**。文本预测的学习目标本身就限制了模型能学到的知识种类。

## JEPA：不预测文字，预测"世界状态"

LeCun 的替代方案叫 **JEPA**（Joint Embedding Predictive Architecture），核心思想：

```
传统 LLM:    输入文本 → 预测下一个 token
JEPA:        输入状态 → 在抽象空间中预测下一个状态
```

区别在哪？

1. **学习信号不同**: JEPA 不预测原始像素或文字，而是预测**抽象表示**。就像你预测一个球被扔出去后会落在哪里——你不需要精确计算每个时刻的像素，你只需要理解重力和抛物线。

2. **无需生成**: LLM 必须生成完整的文本输出。JEPA 只需要在表示空间中做判断。这大幅降低了计算成本，也避免了"幻觉"问题——因为模型不需要"编造"具体内容。

3. **自监督学习**: JEPA 可以从视频、传感器数据等非文本数据中学习，不需要人工标注。一个婴儿通过观察世界学会了物理直觉，JEPA 的设计理念类似。

简化的架构对比：

```
Transformer (LLM):
  输入 → Tokenize → Self-Attention × N层 → 预测下一个 token
  ↓
  学到: 语言模式、知识图谱、推理链（全部来自文本）

JEPA (世界模型):
  输入 → Encoder → 抽象表示 → Predictor → 预测未来表示
  ↓
  学到: 物理直觉、因果关系、空间推理（来自多模态数据）
```

## 实操指南：现在就能尝试的世界模型项目

虽然 AMI Labs 的 JEPA 实现还没开源，但相关的世界模型研究已经有可用的工具：

### 1. Meta V-JEPA（视觉 JEPA）

```bash
# 克隆 V-JEPA 仓库
git clone https://github.com/facebookresearch/jepa.git
cd jepa

# 安装依赖
pip install -r requirements.txt

# 使用预训练的 V-JEPA 做视频理解
python eval_video.py \
  --model vjepa-huge \
  --video path/to/video.mp4 \
  --task action_recognition
```

V-JEPA 不生成像素——它在抽象表示空间中理解视频内容，预测被遮挡部分的语义信息。

### 2. 用 Gemma 4 + 视觉模块做简单的世界模型实验

```python
# 概念验证: 用多模态模型预测物理场景的结果
import google.generativeai as genai

model = genai.GenerativeModel("gemma-4-31b")

# 输入一张物理场景图片，让模型预测"接下来会发生什么"
response = model.generate_content([
    "观察这张图片中的物理场景，预测 2 秒后会发生什么。"
    "只描述物理运动结果，不要描述图片内容。",
    image_data
])
```

这不是真正的 JEPA，但它展示了"预测世界状态"的基本思路。

## 常见问题

### LLM 真的要被淘汰了吗？

短期内不会。LLM 在文本处理、编程、知识问答上的能力仍然无可替代。LeCun 挑战的不是 LLM 的现有价值，而是它作为"通向 AGI 的唯一路径"的地位。更可能的结果是两种架构互补：LLM 处理语言和推理，世界模型处理物理理解和规划。

### 世界模型什么时候能用？

AMI Labs 预计 12-18 个月后发布第一个可用模型。但 Meta 的 V-JEPA、DeepMind 的 Genie 2 等已经在特定场景可用。2027 年之前，世界模型大概率会成为机器人和自动驾驶的标配组件。

### 开发者现在需要做什么准备？

不需要立刻转型。但值得开始了解两个概念：**表示学习（representation learning）** 和 **自监督学习（self-supervised learning）**。这是世界模型的理论基础，也是未来 AI 架构的共同趋势。

## JR Academy 相关资源

AI 正在从"纯语言模型"向"多模态世界理解"演进。无论你是想深入理论还是实操开发：

- **[AI 全栈开发课程](https://jiangren.com.au/courses)** — 覆盖 LLM、多模态模型、Agent 开发，帮你建立完整的 AI 技术视野
- **[AI 学习路线图](https://jiangren.com.au/ai-roadmap)** — 从 Python 基础到前沿 AI 架构，系统化学习路径

LeCun 的赌注不管成败，都在推动 AI 行业思考一个根本问题：**我们是在造一个更好的搜索引擎，还是在造一个真正理解世界的智能体？** 答案将决定未来十年的技术方向。
