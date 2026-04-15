#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
每日 AI 新闻自动抓取系统
-----------------------
- 从 Google News RSS 抓取新闻（免费，无需 API Key）
- 用 Claude API 生成一句话简介 + 中文摘要
- 按日期保存到 ~/news/news_YYYY_MM_DD.md

依赖：
    feedparser, anthropic

环境变量：
    ANTHROPIC_API_KEY   必填，Claude API Key
"""

import os
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import quote_plus

import feedparser
from anthropic import Anthropic

# ---------------------------------------------------------------------------
# 配置区
# ---------------------------------------------------------------------------

MODEL = "claude-sonnet-4-20250514"

# 每类抓取的新闻条数（两类共 20 条）
NEWS_PER_CATEGORY = 10

# 输出目录
OUTPUT_DIR = Path.home() / "news"

# 两类新闻的 RSS 查询配置
CATEGORIES = [
    {
        "name": "🌍 全球AI新闻",
        "query": 'AI OR "Artificial Intelligence" OR LLM OR GenAI OR "Machine Learning"',
        "locale": {"hl": "en-US", "gl": "US", "ceid": "US:en"},
    },
    {
        "name": "🇦🇺 澳洲IT/AI新闻",
        "query": '"Australia AI" OR "Australia Tech" OR "Australia IT"',
        "locale": {"hl": "en-AU", "gl": "AU", "ceid": "AU:en"},
    },
]

# Claude 提示词模板
PROMPT_TEMPLATE = """你是一名专业的 AI 新闻编辑。请根据以下新闻，生成两段内容：

1. 一句话简介：用 20 个中文字以内说清楚这条新闻讲了什么
2. 中文摘要：150 个中文字以内，简洁准确地描述新闻要点

【新闻标题】
{title}

【新闻内容】
{summary}

请严格按照以下格式返回，不要输出其它任何内容，不要加引号、编号、或 markdown：
简介：<一句话简介>
摘要：<中文摘要>
"""


# ---------------------------------------------------------------------------
# 工具函数
# ---------------------------------------------------------------------------

def build_rss_url(query: str, locale: dict) -> str:
    """构造 Google News RSS 检索 URL"""
    base = "https://news.google.com/rss/search"
    params = f"q={quote_plus(query)}&hl={locale['hl']}&gl={locale['gl']}&ceid={locale['ceid']}"
    return f"{base}?{params}"


def fetch_rss(query: str, locale: dict, limit: int) -> list:
    """抓取 RSS 并返回新闻列表"""
    url = build_rss_url(query, locale)
    feed = feedparser.parse(url)

    items = []
    for entry in feed.entries[:limit]:
        source_title = ""
        if hasattr(entry, "source") and isinstance(entry.source, dict):
            source_title = entry.source.get("title", "")

        items.append({
            "title": entry.get("title", "").strip(),
            "link": entry.get("link", "").strip(),
            "source": source_title,
            "published": entry.get("published", ""),
            "summary": entry.get("summary", ""),
        })
    return items


def generate_brief_and_abstract(client: Anthropic, title: str, summary: str) -> tuple:
    """调用 Claude 生成简介 + 摘要，返回 (brief, abstract)"""
    prompt = PROMPT_TEMPLATE.format(
        title=title or "(无标题)",
        summary=(summary or title or "(无内容)")[:1500],
    )

    message = client.messages.create(
        model=MODEL,
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )

    text = "".join(
        block.text for block in message.content if getattr(block, "type", "") == "text"
    ).strip()

    brief, abstract = "", ""
    for raw in text.splitlines():
        line = raw.strip()
        if line.startswith("简介："):
            brief = line[len("简介："):].strip()
        elif line.startswith("简介:"):
            brief = line[len("简介:"):].strip()
        elif line.startswith("摘要："):
            abstract = line[len("摘要："):].strip()
        elif line.startswith("摘要:"):
            abstract = line[len("摘要:"):].strip()

    if not brief and not abstract:
        # 如果模型没按格式返回，则退化处理
        abstract = text[:300]

    return brief, abstract


def render_item(index: int, item: dict, brief: str, abstract: str) -> str:
    """把单条新闻渲染成 markdown"""
    return (
        f"### {index}. [{item['title']}]({item['link']})\n"
        f"**来源：** {item['source'] or '未知'} | **时间：** {item['published'] or '未知'}\n\n"
        f"**简介：** {brief}\n\n"
        f"**摘要：** {abstract}\n\n"
        f"---\n"
    )


def build_category_section(client: Anthropic, category: dict) -> str:
    """抓取并渲染一个分类的 markdown 片段"""
    print(f"[信息] 抓取「{category['name']}」...", flush=True)
    try:
        items = fetch_rss(category["query"], category["locale"], NEWS_PER_CATEGORY)
    except Exception as e:  # noqa: BLE001
        print(f"[警告] 「{category['name']}」抓取失败：{e}", file=sys.stderr)
        items = []

    print(f"[信息] 「{category['name']}」抓到 {len(items)} 条，开始生成摘要...", flush=True)

    parts = [f"## {category['name']}\n"]
    rendered_index = 0
    for raw_index, item in enumerate(items, start=1):
        if not item["title"]:
            continue
        try:
            brief, abstract = generate_brief_and_abstract(
                client, item["title"], item["summary"]
            )
        except Exception as e:  # noqa: BLE001
            print(
                f"[警告] 第 {raw_index} 条「{item['title'][:40]}」摘要生成失败，跳过：{e}",
                file=sys.stderr,
            )
            continue

        rendered_index += 1
        parts.append(render_item(rendered_index, item, brief, abstract))
        # 轻微限速，避免触发 API rate limit
        time.sleep(0.5)

    if rendered_index == 0:
        parts.append("_本类今日无可用新闻。_\n")

    return "\n".join(parts)


# ---------------------------------------------------------------------------
# 主流程
# ---------------------------------------------------------------------------

def main() -> int:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("错误：环境变量 ANTHROPIC_API_KEY 未设置", file=sys.stderr)
        return 1

    client = Anthropic(api_key=api_key)

    today = datetime.now()
    header = f"# 每日AI新闻简报 {today.strftime('%Y-%m-%d')}\n\n"

    sections = [build_category_section(client, cat) for cat in CATEGORIES]

    output = header + "\n".join(sections)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_file = OUTPUT_DIR / f"news_{today.strftime('%Y_%m_%d')}.md"
    out_file.write_text(output, encoding="utf-8")

    print(f"[完成] 已生成 {out_file}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
