#!/usr/bin/env python3
"""Daily AI news scraper.

抓取 Google News RSS 上的全球 AI 新闻与澳洲 IT/AI 新闻各 10 条，
对每条新闻调用 Claude 生成「一句话简介」和「150 字中文摘要」，
最后写入 ~/news/news_YYYY_MM_DD.md。

单条新闻抓取或生成失败会被跳过，不影响整体运行。
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import quote_plus

import feedparser
from anthropic import Anthropic

# ---------- 配置 ----------
MODEL = "claude-sonnet-4-20250514"
NEWS_DIR = Path.home() / "news"
MAX_PER_CATEGORY = 10
REQUEST_SPACING_SECONDS = 0.5  # Claude API 调用之间的缓冲

GLOBAL_KEYWORDS = ["AI", "Artificial Intelligence", "LLM", "GenAI", "Machine Learning"]
AU_KEYWORDS = ["Australia AI", "Australia Tech", "Australia IT"]
# --------------------------


def build_google_news_url(
    keywords: list[str],
    hl: str = "en-US",
    gl: str = "US",
    ceid: str = "US:en",
) -> str:
    """把关键词用 OR 串起来，生成 Google News RSS 搜索链接。"""
    query = " OR ".join(f'"{kw}"' for kw in keywords)
    return (
        "https://news.google.com/rss/search?"
        f"q={quote_plus(query)}&hl={hl}&gl={gl}&ceid={ceid}"
    )


def fetch_entries(url: str, limit: int) -> list:
    """抓取 RSS，返回前 limit 条。"""
    feed = feedparser.parse(url)
    if getattr(feed, "bozo", 0) and not feed.entries:
        raise RuntimeError(f"RSS 抓取失败: {feed.bozo_exception}")
    return list(feed.entries[:limit])


def extract_meta(entry) -> dict:
    """把 feedparser 的 entry 压成字典。"""
    title = getattr(entry, "title", "(未命名)")
    link = getattr(entry, "link", "")

    # source 可能是 FeedParserDict，也可能是 None
    source = ""
    entry_source = getattr(entry, "source", None)
    if entry_source is not None:
        if isinstance(entry_source, dict):
            source = entry_source.get("title", "")
        else:
            source = getattr(entry_source, "title", "") or ""
    if not source:
        source = getattr(entry, "author", "") or "未知来源"

    published = getattr(entry, "published", "") or getattr(entry, "updated", "")
    raw_summary = getattr(entry, "summary", "") or getattr(entry, "description", "")
    # Google News 的 summary 常带 HTML，粗暴去掉标签够用
    clean_summary = re.sub(r"<[^>]+>", " ", raw_summary).strip()

    return {
        "title": title,
        "link": link,
        "source": source,
        "published": published,
        "summary": clean_summary,
    }


def _extract_json(text: str) -> dict:
    """从 Claude 回复里把 JSON 抠出来，容错三反引号。"""
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`").strip()
        if text.lower().startswith("json"):
            text = text[4:].strip()
    # 如果模型回了多余文本，只取第一个 {...}
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        text = match.group(0)
    return json.loads(text)


def call_claude(client: Anthropic, meta: dict) -> tuple[str, str]:
    """让 Claude 生成一句话简介 + 中文摘要。"""
    prompt = f"""你是新闻编辑。请阅读下方新闻原文，并严格以 JSON 返回，键固定：

{{
  "one_liner": "一句话说清楚这条新闻（中文，不超过 20 字）",
  "chinese_summary": "150 字以内的中文摘要，突出关键事实与影响"
}}

除 JSON 外不要输出任何内容、不要 markdown 代码块。

原始标题: {meta['title']}
来源: {meta['source']}
发布时间: {meta['published']}
链接: {meta['link']}
原始摘要:
{meta['summary'][:2000]}
"""

    resp = client.messages.create(
        model=MODEL,
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}],
    )
    text = resp.content[0].text
    data = _extract_json(text)
    one_liner = data["one_liner"].strip()
    summary = data["chinese_summary"].strip()
    if not one_liner or not summary:
        raise ValueError("Claude 返回了空字段")
    return one_liner, summary


def render_section(client: Anthropic, entries: list) -> list[str]:
    """把 RSS entries 渲染成 markdown 段落列表。单条失败跳过。"""
    blocks: list[str] = []
    index = 0
    for entry in entries:
        index += 1
        try:
            meta = extract_meta(entry)
            one_liner, summary = call_claude(client, meta)
            title_md = meta["title"].replace("]", "】").replace("[", "【")
            block = (
                f"### {index}. [{title_md}]({meta['link']})\n\n"
                f"**来源：** {meta['source']} | **时间：** {meta['published']}\n\n"
                f"**简介：** {one_liner}\n\n"
                f"**摘要：** {summary}\n"
            )
            blocks.append(block)
            time.sleep(REQUEST_SPACING_SECONDS)
        except Exception as exc:
            sys.stderr.write(f"  [skip] #{index} 处理失败: {exc}\n")
            # 保持编号连续：把刚才占掉的编号回退
            index -= 1
            continue
    return blocks


def build_markdown(today: str, global_blocks: list[str], au_blocks: list[str]) -> str:
    parts: list[str] = [f"# 每日AI新闻简报 {today}", ""]

    parts.append("## 🌍 全球AI新闻")
    parts.append("")
    if global_blocks:
        parts.append("\n---\n\n".join(global_blocks))
    else:
        parts.append("_今日暂无可用内容_")
    parts.append("")

    parts.append("---")
    parts.append("")
    parts.append("## 🇦🇺 澳洲IT/AI新闻")
    parts.append("")
    if au_blocks:
        parts.append("\n---\n\n".join(au_blocks))
    else:
        parts.append("_今日暂无可用内容_")
    parts.append("")

    return "\n".join(parts)


def main() -> int:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        sys.stderr.write("错误：环境变量 ANTHROPIC_API_KEY 未设置\n")
        return 1

    client = Anthropic(api_key=api_key)
    today = datetime.now().strftime("%Y-%m-%d")
    filename_date = datetime.now().strftime("%Y_%m_%d")

    print(f"[{today}] 开始抓取 Google News RSS …")

    try:
        global_entries = fetch_entries(
            build_google_news_url(GLOBAL_KEYWORDS),
            MAX_PER_CATEGORY,
        )
        print(f"  全球 AI：拿到 {len(global_entries)} 条")
    except Exception as exc:
        sys.stderr.write(f"  全球 AI 抓取失败: {exc}\n")
        global_entries = []

    try:
        au_entries = fetch_entries(
            build_google_news_url(
                AU_KEYWORDS, hl="en-AU", gl="AU", ceid="AU:en"
            ),
            MAX_PER_CATEGORY,
        )
        print(f"  澳洲 IT/AI：拿到 {len(au_entries)} 条")
    except Exception as exc:
        sys.stderr.write(f"  澳洲 IT/AI 抓取失败: {exc}\n")
        au_entries = []

    print("调用 Claude 生成简介与摘要 …")
    global_blocks = render_section(client, global_entries)
    au_blocks = render_section(client, au_entries)

    md = build_markdown(today, global_blocks, au_blocks)

    NEWS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = NEWS_DIR / f"news_{filename_date}.md"
    out_path.write_text(md, encoding="utf-8")
    print(f"完成：{out_path}  （全球 {len(global_blocks)} / 澳洲 {len(au_blocks)}）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
