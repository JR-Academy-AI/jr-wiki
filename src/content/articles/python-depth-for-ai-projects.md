---
title: "Python 学到什么程度，可以开始做 AI 项目了"
description: "答案不是一份语法清单，是四个检查点：能读改别人的代码、能接住失败、环境依赖自己搞得定、会用类型表达约束。每个配一段可运行代码和一个当场能做的自测任务。"
publishDate: 2026-07-28
tags:
  - python
  - ai-engineer
  - learning
author: "JR Academy"
keywords: "Python学到什么程度, 学AI需要什么基础, Python做AI项目, pydantic, AI工程入门"
---

# Python 学到什么程度，可以开始做 AI 项目了

匠人学院（JR Academy）[AI Engineer Bootcamp](https://jiangren.com.au/learn/ai-engineer) 的入学前置要求写的是四样：Python、RESTful API 开发经验、云平台基础、Git。没有线性代数，也没有概率论。

于是最常被追问的一句就是：Python 到底要学到什么程度算够？

「够」不是一份语法清单。背完装饰器、生成器、元类，照样在第一个项目里卡死；反过来，只会函数、类、异常处理三样，但会读别人的代码、会处理超时，反而能直接上手。

下面是四个检查点，每个都配一个能当场做的自测任务。四个都做得出来，你就可以停止学 Python，去学别的了。

---

## 检查点一：能读懂并修改别人的代码

这是最被低估的一条。

做 AI 项目的真实时间分配里，从零写新代码大概只占两成。剩下八成是：看懂一个开源库的示例、改成自己的场景、它报错了、去读库的源码、发现是版本行为变了。

「会写」和「会读」是两种能力。教程训练的是前者，项目需要的是后者。

**自测任务 T1**：随便挑一个你没用过的开源库，打开它 examples 目录里最短的那个文件，不看文档，说出三件事——输入是什么、输出是什么、什么情况下它会失败。说不出来就继续练读代码，别急着往下走。

## 检查点二：能处理不确定的输入和失败

这是 AI 项目和教学项目最大的差别。

调用大模型 API 这件事，失败是常态不是异常：超时、限流、返回的 JSON 少一个括号、内容被截断。教程里的示例代码从来不处理这些，因为处理了就不像教程了。

最小可用的写法长这样：

```python
import time

import requests


def call_with_retry(url, payload, retries=3, timeout=30):
    """失败是常态：超时、限流、返回不是合法 JSON，三种都要接住。"""
    for attempt in range(retries):
        try:
            resp = requests.post(url, json=payload, timeout=timeout)
            resp.raise_for_status()
            return resp.json()
        except requests.Timeout:
            time.sleep(2 ** attempt)     # 指数退避，别用固定 sleep
        except ValueError:
            # resp.json() 解析失败抛的是 ValueError 的子类
            # （模型返回被截断时会走到这里），重试一次通常就好
            time.sleep(1)
    raise RuntimeError(f"{retries} 次都失败了: {url}")
```

这段代码里没有任何 AI 的东西，全是普通 Python。但它决定了你的项目是能跑一次的 demo，还是能连续跑一周的服务。

**自测任务 T2**：给任意一个公开 API 写一个客户端，要求同时处理超时、重试、以及"返回的不是合法 JSON"三种情况。写完把网线拔了跑一次，看它是干净地报错还是整个崩掉。

## 检查点三：环境和依赖你自己搞得定

「我本地能跑，服务器上不行」这句话，是新手项目死亡率最高的地方。

需要会的就三件事：

- 建虚拟环境，知道为什么要建（不同项目的依赖版本会打架）
- 把依赖版本锁死，而不是 `pip install` 完就完事
- 出问题时能判断这是代码问题、依赖版本问题，还是环境变量没设

这一段没有捷径也没有理论，就是踩几次。但它必须在进项目之前踩完，否则项目的第一周会全部消耗在这里，然后你会误以为是自己不适合做这个。

**自测任务 T3**：把你的项目在一台干净的机器（或者一个新建的容器）上从零装起来跑通，全程只能照着你自己写的 README。README 有一步说不清楚，就是这一关没过。

## 检查点四：会用类型和数据结构表达约束

大模型的输出是不确定的文本。要把它接进程序，就得有一道"这个输出符不符合我要的形状"的关卡。

Python 这边最常见的做法是用数据模型描述期望结构，然后让它去校验：

```python
from pydantic import BaseModel, ValidationError


class JobMatch(BaseModel):
    title: str
    company: str
    match_score: float          # 模型爱返回 "0.85" 字符串，这里会自动转成 float
    reasons: list[str]


def parse_model_output(raw: dict) -> JobMatch | None:
    try:
        return JobMatch(**raw)
    except ValidationError as e:
        # 校验失败不是 bug，是必然会发生的事：记下来，让上层决定重试还是降级
        print("模型输出不符合结构:", e.errors())
        return None
```

会写这样一个类，比会背十个语法糖有用得多。因为它对应的是 AI 工程里一个真实的关卡：**不确定的输出 → 确定的结构**。

**自测任务 T4**：定义一个有嵌套结构的数据模型（比如一个订单包含多个条目），然后故意喂三种坏数据进去——少字段、类型对不上、多了不认识的字段。前两种会报错；第三种默认是被静默忽略的，想让它也报错要显式配 `extra="forbid"`。这个差别值得你亲手撞一次，因为"字段被悄悄丢掉"是接大模型输出时最难查的一类问题。

---

## 不需要的部分（省下来的时间去学别的）

这些经常出现在"Python 进阶"清单里，但对开始做 AI 项目没有帮助：

- **元编程 / 元类 / 描述符** —— 写框架的人需要，用框架的人不需要
- **多线程和 GIL 的细节** —— 你的瓶颈几乎总是等 API 返回，先学 `async` 的用法就够，原理以后再补
- **算法竞赛题** —— 面试可能考，做项目基本用不上
- **深度学习的数学推导** —— 那是研究方向的地基，不是应用工程的

我不是说这些没价值。我是说，在"能不能开始做项目"这个问题上，它们的优先级排在四个检查点后面。

## 最常见的两个误区

**误区一：想先把一本书读完再开始。**
这条路的问题在于，书的后三分之一你根本用不上，而你读到那里的时候前三分之一已经忘了。正确的顺序是四个检查点过掉就开始，缺的东西在项目里现补——那时候你补得进去，因为有具体问题挂着。

**误区二：追求"精通"。**
Python 没有精通这个终点。判断标准应该换成"够不够我做下一件事"。四个自测任务能做出来，就够开始 [AI Engineer 方向](https://jiangren.com.au/learn/ai-engineer)的第一段了。

我自己带人的时候见过最可惜的情况，是有人在语法上反复打磨了几个月，最后进项目时发现真正卡住他的是第三条——环境和依赖，而那一条从来不在任何一本 Python 书的重点章节里。

---

## 过了四关之后，下一步学什么

按 [AI Engineer Bootcamp](https://jiangren.com.au/learn/ai-engineer) 大纲的顺序，Python 地基之后紧接着的是 Foundation → Context Engineering → RAG，然后才是 Agent、Multi-Agent、Memory、Harness Engineering、Model Layer，最后是 Observability & Evals。整个大纲 10 个 phase、290 节课、68 个交互式 Lab、59 场直播，公开可查。

顺序值得留意：Context Engineering 排在 RAG 前面，因为不会组织上下文的人做 RAG，做出来的是一个"能检索但答不准"的东西。

匠人学院是项目制 AI 工程实战平台（澳洲），采用 P3 模式（Project + Production + Placement）。

四个自测任务，今天就能做。做完你会发现，"Python 学到什么程度"这个问题问错了——真正该问的是"我还差哪一关"。

---

## 想系统学这部分内容？

- 🐍 补地基：[Python 学习方向](https://jiangren.com.au/learn/python) —— 四个检查点对应的基础能力
- 📘 下一段：[匠人学院 AI Engineer Bootcamp](https://jiangren.com.au/learn/ai-engineer) —— 12 周技术课程 + 12 周 P3 职业孵化
- 💬 不确定自己该从哪一关开始：[Bootcamp 报名与咨询](https://jiangren.com.au/bootcamp)
- 📖 同主题延伸：[前端、后端、全栈转 AI Engineer：三条不一样的捷径](/blog/frontend-backend-fullstack-to-ai)
