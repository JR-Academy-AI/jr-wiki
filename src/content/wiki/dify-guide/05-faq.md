---
title: "Dify 常见问题 FAQ：定价、踩坑和选型建议"
wiki: "dify-guide"
order: 5
description: "Dify 定价详解、自部署常见问题排查、与 Coze/FastGPT 的选型建议和适用人群分析"
---

用 Dify 过程中最常遇到的问题都在这里了，包括定价怎么算、自部署踩坑合集、什么时候该换别的工具。

![Dify pricing plans](https://img.youtube.com/vi/OQMnVMFqIGE/maxresdefault.jpg)

## 定价：到底花多少钱

Dify 有两种用法，成本差很多：

| 方案 | Sandbox | Professional | Team | 自部署 |
|------|---------|-------------|------|--------|
| 月费 | $0 | $59 | $159 | $0 |
| 消息数 | 200/月 | 5,000/月 | 10,000/月 | 无限 |
| 应用数 | 10 | 50 | 200+ | 无限 |
| 向量存储 | 5 MB | 200 MB | 20 GB | 看硬盘 |
| 团队成员 | 1 | 3 | 多人 | 无限 |

**我的建议**：个人学习或小团队直接自部署，一台 4 核 8G 的服务器（月费约 $20-40）就够跑。只有不想碰服务器运维的团队才考虑云端付费版。

年付打八三折。学生和教育工作者可以申请免费使用。

## 自部署踩坑合集

**端口冲突**：Dify 默认用 80 端口。如果服务器上已经跑着 Nginx 或 Apache，先改 `.env` 里的端口映射：

```bash
# .env 文件
EXPOSE_NGINX_PORT=3000
# 然后访问 http://你的IP:3000
```

**Ollama 连不上**：Docker 容器里访问宿主机的 Ollama，URL 不能写 `localhost`：

```bash
# 错误写法
OLLAMA_HOST=http://localhost:11434

# 正确写法（Docker Desktop for Mac/Windows）
OLLAMA_HOST=http://host.docker.internal:11434

# 正确写法（Linux）
OLLAMA_HOST=http://172.17.0.1:11434
```

**知识库上传后检索不到内容**：通常是分块策略不对。PDF 文件建议用 Parent-Child 模式；短文本 FAQ 用 Q&A 模式。检索模式选"混合"，别只用向量搜索。

**升级后插件报错**：v1.11 之后的版本对插件签名验证更严格。临时解决：在 `.env` 加 `FORCE_VERIFYING_SIGNATURE=false`。正式环境建议等插件作者更新。

**OpenAI TTS 不出声**：源码部署的用户需要装 FFmpeg：

```bash
# Ubuntu/Debian
apt-get install ffmpeg

# macOS
brew install ffmpeg
```

**内存不够用**：知识库文档多或并发量大时，Docker 容器可能 OOM。给 Docker Desktop 分配至少 8 GB 内存，或者在 `docker-compose.yaml` 里加资源限制。

## 谁适合用 Dify，谁不适合

**适合的人**：
- 想快速搭建 AI 应用原型的**开发者和产品经理**
- 不会写代码但需要 AI 工具的**运营和业务人员**——Dify 的可视化编排真的不需要编程
- 需要**私有化部署**、数据不能出内网的企业
- 想**同时接多个模型**（GPT-4o + Claude + 国产模型）做 A/B 测试的团队

**不太适合的场景**：
- 对 RAG 精度有极致要求的垂直领域（医疗、法律），FastGPT 的检索精度目前更高
- 需要从底层完全定制 AI 链路的场景——Dify 的抽象层会限制灵活性，不如直接用 LangChain
- 许可证限制：Dify 的开源协议**禁止未授权的 SaaS 转售**。你用 Dify 给自己公司搭应用没问题，但不能用它搭一个 SaaS 平台卖给别人

## 跟 Coze / FastGPT 怎么选

| 场景 | 选 Dify | 选 Coze | 选 FastGPT |
|------|---------|---------|-----------|
| 想用多个国际模型 | ✅ | ❌ 字节系为主 | ⚠️ 需配 OneAPI |
| 非技术人员搭应用 | ✅ 可视化好 | ✅ 更简单 | ⚠️ 门槛略高 |
| 数据私有化部署 | ✅ 成熟 | ⚠️ 刚开源 | ✅ 成熟 |
| RAG 精度优先 | ⚠️ 够用 | ⚠️ 一般 | ✅ 最强 |
| 工作流编排 | ✅ 最强 | ⚠️ 基础 | ⚠️ 基础 |
| 社区和插件生态 | ✅ 139K star | ✅ 字节生态 | ⚠️ 较小 |

简单说：**Dify 是全能选手**，大部分场景都能用，但每个单项可能不是第一。如果你没有明确的偏好，从 Dify 开始是最安全的选择。

## 学习资源

- [官方文档](https://docs.dify.ai)——最权威，更新也快
- [GitHub Discussions](https://github.com/langgenius/dify/discussions)——遇到问题先搜这里
- [Awesome Dify Workflow](https://github.com/svcvit/Awesome-Dify-Workflow)——社区共享的工作流模板，直接导入能用
- [Dify 101](https://dify101.com)——第三方教程站，有分步骤截图

别一上来就看视频教程——很多过时了。Dify 迭代很快，v1.0 之后的架构和之前完全不同，优先看官方文档。
