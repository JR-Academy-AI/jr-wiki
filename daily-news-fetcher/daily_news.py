#!/usr/bin/env python3
"""Daily AI news digest fetcher.

Fetches 10 global AI news items + 10 Australia IT/AI news items from
Google News RSS, enriches each with a Claude-generated brief + summary,
and writes a dated markdown digest to ~/news/news_YYYY_MM_DD.md.
"""

from __future__ import annotations

import os
import sys
import time
import urllib.parse
from datetime import datetime
from pathlib import Path

import feedparser
from anthropic import Anthropic, APIError

MODEL = "claude-sonnet-4-20250514"

GLOBAL_QUERIES = ["AI", "Artificial Intelligence", "LLM", "GenAI", "Machine Learning"]
AUSTRALIA_QUERIES = ["Australia AI", "Australia Tech", "Australia IT"]

GLOBAL_COUNT = 10
AUSTRALIA_COUNT = 10

GLOBAL_RSS = "https://news.google.com/rss/search?q={q}&hl=en&gl=US&ceid=US:en"
AU_RSS = "https://news.google.com/rss/search?q={q}&hl=en-AU&gl=AU&ceid=AU:en"

OUTPUT_DIR = Path.home() / "news"

ENRICH_PROMPT = """你是一个专业的新闻编辑助手。请根据下面的英文新闻信息，输出中文简介和中文摘要。

新闻标题：{title}
新闻原始描述：{summary}

严格按照以下格式输出，每项一行，不要加任何多余的解释、寒暄或markdown符号：
BRIEF: <一句话中文简介，必须在20个汉字以内，说清楚这条新闻的核心>
SUMMARY: <中文摘要，150个汉字以内，概括新闻关键要点>
"""


def fetch_feed(queries: list[str], count: int, rss_template: str) -> list[dict]:
    """Pull entries from Google News RSS across multiple queries, deduped by link."""
    items: list[dict] = []
    seen: set[str] = set()
    for query in queries:
        if len(items) >= count:
            break
        url = rss_template.format(q=urllib.parse.quote(query))
        try:
            feed = feedparser.parse(url)
        except Exception as exc:
            print(f"[WARN] feedparser failed for '{query}': {exc}", file=sys.stderr)
            continue
        for entry in feed.entries:
            if len(items) >= count:
                break
            link = getattr(entry, "link", None)
            if not link or link in seen:
                continue
            seen.add(link)
            source = ""
            if hasattr(entry, "source") and getattr(entry.source, "title", None):
                source = entry.source.title
            items.append({
                "title": getattr(entry, "title", "") or "(无标题)",
                "link": link,
                "source": source,
                "published": getattr(entry, "published", ""),
                "summary": getattr(entry, "summary", ""),
            })
    return items[:count]


def enrich_with_claude(client: Anthropic, item: dict) -> tuple[str, str]:
    """Ask Claude for a one-line brief and a 150-char Chinese summary."""
    prompt = ENRICH_PROMPT.format(
        title=item["title"],
        summary=(item.get("summary") or "")[:2000],
    )
    resp = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    text = "".join(b.text for b in resp.content if getattr(b, "type", "") == "text")
    brief, summary_zh = "", ""
    for raw in text.splitlines():
        line = raw.strip()
        if line.startswith("BRIEF:"):
            brief = line[len("BRIEF:"):].strip()
        elif line.startswith("SUMMARY:"):
            summary_zh = line[len("SUMMARY:"):].strip()
    if not brief and not summary_zh:
        raise ValueError(f"Claude response not parseable: {text[:200]}")
    return brief, summary_zh


def process(client: Anthropic, items: list[dict], label: str) -> list[dict]:
    """Enrich each item; skip failures so a single bad entry doesn't kill the run."""
    out: list[dict] = []
    for idx, item in enumerate(items, 1):
        title_preview = item["title"][:50]
        try:
            brief, summary_zh = enrich_with_claude(client, item)
            item["brief"] = brief
            item["summary_zh"] = summary_zh
            out.append(item)
            print(f"[OK ] {label} {idx}/{len(items)}: {title_preview}")
        except (APIError, ValueError, Exception) as exc:
            print(f"[SKIP] {label} {idx}/{len(items)}: {title_preview} — {exc}",
                  file=sys.stderr)
        time.sleep(0.5)
    return out


def render_section(heading: str, items: list[dict]) -> str:
    lines = [f"## {heading}", ""]
    if not items:
        lines.extend(["_（今日无内容）_", ""])
        return "\n".join(lines)
    for i, it in enumerate(items, 1):
        lines.append(f"### {i}. [{it['title']}]({it['link']})")
        lines.append("")
        lines.append(f"**来源：** {it.get('source') or '未知'} | "
                     f"**时间：** {it.get('published') or '未知'}")
        lines.append("")
        lines.append(f"**简介：** {it.get('brief', '')}")
        lines.append("")
        lines.append(f"**摘要：** {it.get('summary_zh', '')}")
        lines.append("")
        lines.append("---")
        lines.append("")
    return "\n".join(lines)


def main() -> int:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY environment variable is not set",
              file=sys.stderr)
        return 1

    client = Anthropic(api_key=api_key)
    today = datetime.now()
    date_str = today.strftime("%Y-%m-%d")
    file_date = today.strftime("%Y_%m_%d")

    print(f"=== Daily news digest for {date_str} ===")

    print("Fetching global AI news...")
    global_items = fetch_feed(GLOBAL_QUERIES, GLOBAL_COUNT, GLOBAL_RSS)
    print(f"  pulled {len(global_items)} items")

    print("Fetching Australia IT/AI news...")
    au_items = fetch_feed(AUSTRALIA_QUERIES, AUSTRALIA_COUNT, AU_RSS)
    print(f"  pulled {len(au_items)} items")

    print("Enriching with Claude...")
    global_items = process(client, global_items, "GLOBAL")
    au_items = process(client, au_items, "AU    ")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_DIR / f"news_{file_date}.md"

    body = "\n".join([
        f"# 每日AI新闻简报 {date_str}",
        "",
        render_section("🌍 全球AI新闻", global_items),
        render_section("🇦🇺 澳洲IT/AI新闻", au_items),
    ])
    out_path.write_text(body, encoding="utf-8")

    print(f"=== Wrote {out_path} "
          f"({len(global_items)} global + {len(au_items)} AU) ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
