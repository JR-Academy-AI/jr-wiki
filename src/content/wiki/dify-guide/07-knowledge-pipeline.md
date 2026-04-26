---
title: "Knowledge Pipeline：可视化文档处理管道与 RAG 调优"
wiki: "dify-guide"
order: 7
description: "Dify v1.9 引入的 Knowledge Pipeline 让 RAG 的 ETL 全流程可视化可编排——从文档解析、分块策略到向量化和检索优化，全部拖拽配置"
---

Dify v1.9 之前，知识库的文档处理是个黑箱——上传文件、选个分块策略、点"处理"，中间发生了什么看不到也改不了。Knowledge Pipeline 把这条管道拆成可视化节点，你可以按需组合解析器、分块器、向量化模型和后处理逻辑。

![Dify Knowledge Pipeline 可视化编排](https://raw.githubusercontent.com/langgenius/dify/main/images/models.png)

## 为什么需要 Knowledge Pipeline

传统 RAG 的痛点不是"检索不到"——是"检索到了但内容质量差"：

- PDF 里的表格被拆成碎片，语义丢失
- 图片里的文字没有被 OCR 提取
- 代码块被当普通文本切割，半截代码毫无价值
- 法律合同的条款编号和引用关系在分块后断裂

Knowledge Pipeline 解决的就是"从原始文档到高质量 chunk"这段路程。

## 管道节点类型

| 节点 | 作用 | 典型用法 |
|------|------|---------|
| **Source** | 数据源连接 | 本地上传、Web 抓取、API 拉取 |
| **Document Parser** | 文档解析 | PDF → 结构化文本（支持表格/图片提取） |
| **Chunking** | 分块策略 | 通用切分、Parent-Child、按标题分层 |
| **Embedding** | 向量化 | OpenAI、Cohere、本地 BGE 模型 |
| **Transform** | 数据变换 | 清洗 HTML 标签、合并短块、摘要压缩 |
| **Custom Code** | 自定义处理 | Python 脚本做任意预处理 |

## 搭建一条 PDF 处理管道

以"公司内部技术文档（PDF、含代码和表格）"为例：

```
Source (本地上传)
  → Document Parser (Marker — 擅长代码和表格)
    → Transform (去除页眉页脚 + 合并短段落)
      → Chunking (Parent-Child, parent=1500 tokens, child=300 tokens)
        → Embedding (text-embedding-3-small)
```

Parent-Child 分块的核心思路：child chunk 用来做精确匹配，命中后返回 parent chunk 给 LLM——既保证检索精度，又提供足够上下文。

## 通过 API 创建 Knowledge Pipeline

```python
import requests

ADMIN_KEY = "dataset-xxxxxxxxxxxx"
BASE = "http://localhost/v1"
headers = {"Authorization": f"Bearer {ADMIN_KEY}"}

# 1. 创建知识库
ds = requests.post(f"{BASE}/datasets", headers=headers,
    json={"name": "技术文档库", "permission": "only_me"})
dataset_id = ds.json()["id"]

# 2. 上传文档并指定处理规则
with open("internal-docs.pdf", "rb") as f:
    resp = requests.post(
        f"{BASE}/datasets/{dataset_id}/document/create-by-file",
        headers=headers,
        files={"file": f},
        data={
            "indexing_technique": "high_quality",
            "process_rule": '{"mode":"automatic"}',
            "doc_form": "hierarchical_model",
            "doc_language": "zh_Hans",
        },
    )
print(resp.json()["document"]["id"])
```

`doc_form` 设为 `hierarchical_model` 就是启用 Parent-Child 分块。`automatic` 模式会自动选分块参数，手动模式可以精确控制 `max_tokens`、`overlap` 和分隔符。

## 检索策略调优

知识库创建完毕后，在 Workflow 的 Knowledge Retrieval 节点里配检索参数：

```yaml
# Workflow DSL 里 Knowledge Retrieval 节点配置片段
retrieval_mode: hybrid          # 混合检索 = 向量 + 全文
top_k: 5                        # 返回 top 5 结果
score_threshold: 0.6            # 相关度低于 0.6 的丢弃
reranking_model:
  provider: cohere
  model: rerank-english-v3.0    # 用 Cohere Rerank 重排序
weights:
  vector: 0.7
  keyword: 0.3
```

三条实战经验：

1. **永远用混合检索**。纯向量搜索对专有名词、编号、型号的匹配很差，全文搜索补上这块短板
2. **Rerank 必开**。初始检索 top_k=10 拉回来的结果里可能有 5 条是噪音，Rerank 模型能把真正相关的排到前面
3. **score_threshold 别设太高**。0.5-0.7 是安全区间。设到 0.8 以上会漏掉很多有用结果

## 检索效果调试

Dify 的 **Recall Testing** 功能可以直接测试检索效果：

```bash
# 通过 API 做检索测试
curl -s "http://localhost/v1/datasets/${DATASET_ID}/retrieve" \
  -H "Authorization: Bearer ${ADMIN_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"query":"Docker 部署的最低配置要求","retrieval_model":{"search_method":"hybrid_search","reranking_enable":true,"top_k":5}}' \
  | python3 -m json.tool
```

返回结果里看两个指标：
- **score**：相关度分数。top 1 的 score 低于 0.5 说明知识库里可能没有相关内容
- **content**：实际返回的文本块。检查是不是你期望的那段文档——如果不是，调分块策略

## 大规模知识库的性能优化

文档超过 1 万篇或 chunk 数超过 50 万时：

```bash
# .env 调优参数
# 增加 embedding worker 并发
INDEXING_MAX_SEGMENTATION_TOKENS_LENGTH=1000
CELERY_WORKER_AMOUNT=4

# 换高性能向量数据库
VECTOR_STORE=qdrant
QDRANT_URL=http://qdrant:6333
QDRANT_API_KEY=your-qdrant-key
```

默认的 Weaviate 到 10 万 chunk 左右性能开始下降。Qdrant 在百万级 chunk 场景下延迟稳定在 50ms 以内，而且支持 GPU 加速索引。

| 向量数据库 | 适合规模 | 特点 |
|-----------|---------|------|
| Weaviate（默认） | < 10 万 chunk | 开箱即用，配置简单 |
| Qdrant | 10 万 - 500 万 | 性能强，支持过滤和多租户 |
| Milvus | 500 万+ | 分布式架构，适合超大规模 |
| PGVector | < 5 万 | 复用 PostgreSQL，运维成本最低 |

选向量数据库别追求"最强"——小团队用 PGVector 少一个组件要维护，比额外跑一个 Qdrant 集群值得。
