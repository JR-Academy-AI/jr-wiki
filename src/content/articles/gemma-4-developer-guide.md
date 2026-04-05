---
title: "Gemma 4 上手指南：Apache 2.0 开源，31B 编程能力超越大多数闭源模型"
description: "Google Gemma 4 刚发布，Apache 2.0 授权，四个尺寸可选，31B 在全球开源模型中排第三。这篇文章告诉你怎么选尺寸、怎么本地部署、怎么接入实际项目。"
publishDate: 2026-04-05
tags:
  - gemma-4
  - open-source
  - llm
  - fine-tuning
  - local-deployment
author: "JR Academy"
---

Google DeepMind 在 4 月 2 日发布了 Gemma 4。这不是"又一个开源模型"——31B 版本目前在 Lmsys Chatbot Arena 文本榜排全球第三，比它强的开源模型只有 DeepSeek V3 和 Qwen 3.5-Plus。Apache 2.0 授权，可以直接商用。

这篇文章是给想用起来的开发者写的，不是给想了解 AI 趋势的人写的。

---

## 先把尺寸选对

Gemma 4 有四个版本，选错了要么浪费资源要么效果不够用：

| 模型 | 参数量 | 推荐场景 |
|------|--------|----------|
| Gemma 4 E2B | 2B（高效版） | 手机端/边缘设备，低延迟场景 |
| Gemma 4 E4B | 4B（高效版） | 消费级 GPU 本地跑，日常辅助 |
| Gemma 4 26B MoE | 26B 混合专家 | 编程、分析，推理成本接近 4B |
| Gemma 4 31B Dense | 31B 稠密 | 最强能力，需要高端 GPU |

**大多数开发者应该先试 26B MoE**。MoE 架构的特点是总参数大但激活参数少——推理时只有一部分参数被激活，速度和显存消耗接近 10B 级模型，但实际效果接近 30B。它在 Arena 榜排第六，编程和数学表现扎实。

31B Dense 是旗舰，但需要至少 24GB 显存（A100/RTX 4090 级别）。如果你没有这个硬件，别死磕，先用 26B MoE。

---

## 三种接入方式

### 方式一：Google AI Studio（零成本上手）

Google 在 AI Studio 提供 Gemma 4 免费访问，不需要部署，不需要 GPU：

```bash
# 安装 Google GenAI SDK
pip install google-generativeai
```

```python
import google.generativeai as genai

genai.configure(api_key="YOUR_API_KEY")  # 从 aistudio.google.com 获取

model = genai.GenerativeModel("gemma-4-31b-it")  # 或 gemma-4-26b-moe-it

response = model.generate_content(
    "用 Python 写一个异步任务队列，支持优先级和重试机制"
)
print(response.text)
```

适合：快速原型验证、个人项目、不需要私有化的场景。

### 方式二：Ollama 本地部署

Ollama 是最简单的本地 LLM 运行方式，Gemma 4 发布后几小时内就有了官方支持：

```bash
# 安装 Ollama（macOS/Linux）
curl -fsSL https://ollama.ai/install.sh | sh

# 拉取模型（26B MoE 约 16GB）
ollama pull gemma4:26b-moe

# 运行
ollama run gemma4:26b-moe
```

通过 API 调用（兼容 OpenAI 格式）：

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama",  # 任意值
)

response = client.chat.completions.create(
    model="gemma4:26b-moe",
    messages=[
        {"role": "user", "content": "帮我 review 这段代码，找出潜在的并发问题"}
    ]
)
print(response.choices[0].message.content)
```

适合：需要数据隐私、离线场景、二次开发。

### 方式三：Hugging Face Transformers（Fine-tuning 场景）

如果你需要微调，直接用 HF Transformers：

```python
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

model_id = "google/gemma-4-27b-it"  # HF 上的模型 ID

tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(
    model_id,
    torch_dtype=torch.bfloat16,
    device_map="auto",
)

inputs = tokenizer("帮我写一个 React hook，用于管理复杂表单状态", return_tensors="pt")
outputs = model.generate(**inputs, max_new_tokens=512)
print(tokenizer.decode(outputs[0], skip_special_tokens=True))
```

Fine-tuning 推荐用 QLoRA，在单张 A100 上可以微调 31B 模型：

```bash
pip install trl peft bitsandbytes
```

```python
from trl import SFTTrainer
from peft import LoraConfig
from transformers import TrainingArguments

lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)

# 用你自己的数据集替换 dataset
trainer = SFTTrainer(
    model=model,
    train_dataset=dataset,
    peft_config=lora_config,
    args=TrainingArguments(
        output_dir="./gemma4-finetuned",
        num_train_epochs=3,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        warmup_steps=100,
        learning_rate=2e-4,
        bf16=True,
    ),
)
trainer.train()
```

---

## Gemma 4 实际适合哪些任务

根据发布的基准数据，有几个场景 Gemma 4 明显够用：

**编程**：Codeforces ELO 从前代的 110 跳到 2150，LiveCodeBench v6 达到 80%。日常代码补全、debug、代码 review 完全没问题。31B 在复杂算法题上的表现已经超过大多数程序员。

**数学推理**：AIME 2026 达到 89.2%。如果你的产品需要处理数学公式、量化计算、数据分析，Gemma 4 是可靠的选择。

**多语言**：Gemma 4 对中文的支持比前代强了很多（Google 在训练数据上增加了多语言比重）。中英混合的技术文档场景表现不错。

**不太适合的场景**：实时语音对话（用 MAI-Voice-1 或 Whisper 更合适）、图像生成（这不是 Gemma 4 的方向）、需要 100 万 Token 超长上下文的场景（等 DeepSeek V4）。

---

## 跟竞争对手的真实对比

Gemma 4 31B 在 Arena 文本榜排第三，但这个榜单是综合人类偏好投票，不等于每个任务都第三。

具体来看：
- **vs Llama 4**：Gemma 4 Apache 2.0 许可更宽松，编程基准更强，但 Llama 4 有更大的社区生态
- **vs Qwen 3.5**：Qwen 在中文任务上有优势，Gemma 4 在推理和数学上更强
- **vs DeepSeek V3**：V3 目前仍然是开源最强，但 Gemma 4 的 Google 背书意味着更稳定的长期维护

实际选型建议：如果你在做 coding agent 或数学密集的应用，先用 Gemma 4 26B MoE 跑基准测试，再决定要不要花钱买 API 或部署 31B。

---

## 快速上手清单

1. **今天就能试**：去 [Google AI Studio](https://aistudio.google.com) 免费体验，不需要信用卡
2. **本地跑起来**：安装 Ollama，`ollama pull gemma4:26b-moe`，5 分钟搞定
3. **评估编程能力**：把你项目里最复杂的一段代码丢给它 review，看输出质量
4. **考虑微调**：如果你有领域数据，Gemma 4 + QLoRA 是现在性价比最高的私有模型方案之一

Apache 2.0 意味着你用 Gemma 4 做的商业产品不需要向 Google 付授权费，也不需要开源你的代码。这是真正可以放心押注的开源模型。

---

## 相关 JR Academy 资源

- [Claude Code 工作流指南](/content/articles/claude-code-workflow) - 把 AI 编程助手用起来
- [Cursor IDE 实用技巧](/content/articles/cursor-tips) - 编辑器级别的 AI 集成
