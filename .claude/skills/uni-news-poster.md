---
name: uni-news-poster
description: "3 校每日大学新闻 · 小红书 + 公众号素材。**新架构（2026-04-24 起）**：agent 只写 src/content/universities/{school}/news-{DATE}.md（新闻 md）+ src/data/uni-news/{school}/{DATE}.json（结构化数据），xhs-posters.html / mp-article.html / xhs-drafts.md / blog md 全由 `bun run build:uni-news` pipeline 渲染。设计目标：把 agent 单校产出从 ~100KB HTML 压到 < 20KB，规避 Stream idle timeout。"
argument-hint: "[YYYY-MM-DD 可选] [school slug 可选 · 不传则当天轮换 3 校]"
---

# /uni-news-poster — 数据驱动版（2026-04-24 重构）

## 🚨 为什么用新架构

**老架构**：agent 每校要手写 `xhs-posters.html`（60KB，5 图 carousel + copy 面板 + html2canvas）+ `mp-article.html`（40KB，全 inline style）+ `xhs-drafts.md` → **单校 ~100KB，3 校 ~300KB**，routine 执行 15-20 分钟，频繁撞 `Stream idle timeout`。

**新架构**：
- agent 只写 `src/content/universities/{school}/news-{DATE}.md`（上游新闻 md，8-12KB）+ `src/data/uni-news/{school}/{DATE}.json`（结构化数据，15KB）
- pipeline 渲染 `xhs-posters.html` + `mp-article.html` + `xhs-drafts.md` + 官网 `src/content/articles/uni-news-{school}-{DATE}.md`
- 单校 agent 产出 ~25KB，3 校 ~75KB，routine 预计 3-5 分钟

**禁止 agent 碰**：HTML / inline style / html2canvas / MP_INLINE_STYLES / xhs-shared.js —— 这些由 template + pipeline 处理。

## 🛠 执行步骤

### Step 0. 日期 + 选 3 校（AEST 强制）

```bash
DATE=${1:-$(TZ='Australia/Sydney' date +%Y-%m-%d)}
SCHOOL=$2   # 可空 → 自动选轮换 3 校（仅核心 6 校池）

if [ -z "$SCHOOL" ]; then
  # 🚨 自动选校只走「核心 6 校」池 —— 用户明确要求，UTS/UWA/ANU/RMIT 没有发布渠道，scheduled 永不跑这 4 校
  # 核心 6 校：uq / umelb / unsw / usyd / monash / adelaide
  # 选最久没更新的 3 校
  SCHOOLS=$(node -e "
    const fs = require('fs'); const path = require('path');
    const CORE_SIX = ['uq','umelb','unsw','usyd','monash','adelaide'];
    const latest = CORE_SIX.map(s => {
      const dir = 'src/content/universities/' + s;
      if (!fs.existsSync(dir)) return [s, ''];
      const mds = fs.readdirSync(dir).filter(f => f.startsWith('news-'));
      const dates = mds.map(f => f.match(/news-(\d{4}-\d{2}-\d{2})\.md/)?.[1]).filter(Boolean).sort();
      return [s, dates[dates.length-1] || ''];
    });
    latest.sort((a,b) => a[1].localeCompare(b[1]));
    console.log(latest.slice(0,3).map(x=>x[0]).join(' '));
  ")
else
  # 手动指定时不限制（10 校文件结构都在，运营手动跑 ANU/RMIT/UTS/UWA 仍然能跑）
  SCHOOLS=$SCHOOL
fi
```

**🚨 池子规则铁律**（2026-04-24 用户怒了之后立的）：

| 池子 | 学校 | scheduled | 手动 `/uni-news-poster $DATE $SCHOOL` |
|---|---|---|---|
| 核心 6 | UQ / UMelb / UNSW / USYD / Monash / Adelaide | ✅ 每天 3 校轮换 | ✅ |
| 边缘 4 | ANU / RMIT / UTS / UWA | ❌ **永远不跑** | ✅（运营手动） |

**Why**：用户的发布渠道（小红书 6 个学校账号 + 公众号 6 个）只覆盖核心 6 校。跑边缘 4 校 = 内容做出来没地方发 = 浪费 API + 浪费 token。

任何修改这个 skill 时，**禁止**：
- 把池子写成 10 校 / "全部学校"
- 在 schedule 路径里加 ANU/RMIT/UTS/UWA 选项
- 在自动逻辑里"轮换"/"周日跑边缘校" —— 这条规则之前在 memory 里是错的，2026-04-24 已纠正

### Step 1. 为每校搜 2-3 轮真实新闻（并发）

重点搜每校官方新闻源 + 中文留学媒体的当周报道：
- `news.uq.edu.au` / `about.uq.edu.au/news` / `uq.edu.au/news-events`（UQ）
- `news.unimelb.edu.au`（UMelb）
- `newsroom.unsw.edu.au`（UNSW）
- `sydney.edu.au/news-opinion`（USYD）
- `monash.edu/news`（Monash）
- `anu.edu.au/news`（ANU）
- `adelaide.edu.au/newsroom`（Adelaide）
- `rmit.edu.au/news`（RMIT）
- `uts.edu.au/news`（UTS）
- `uwa.edu.au/news`（UWA）

筛选标准（选 3 条 / 校）：
- ✅ 发布日期在 `{DATE}` 前 7 天内
- ✅ 对中国留学生有直接影响：奖学金 / 招生 / 签证 / 学费 / 课程 / 科研合作 / 校园动态
- ✅ 有真实 source URL（news.uq.edu.au/... 这种）
- ❌ 不要：董事会人事 / 员工 PhD 成就 / 小范围内部通知

### Step 2. 写 `src/content/universities/{school}/news-{DATE}.md`（上游）

frontmatter:
```yaml
---
title: "{学校中文名} {MM月DD日} {一句话三条新闻概括，含学校英文名和关键词}"
description: "..."
publishDate: {YYYY-MM-DD}
tags: [uni-news, {school}]
university: "{school}"
universityName: "{英文名}"
universityNameCn: "{中文名}"
---
```

每条新闻 `## N. 标题` + 配图（Unsplash 或原文 og:image）+ 2-3 段正文 + `> Source: [名](url)`。参考：`src/content/universities/uq/news-2026-04-22.md`。

### Step 3. 写 `src/data/uni-news/{school}/{DATE}.json`（**主产出**）

**严格按 `src/data/_schemas/uni-news.schema.json`**。参考示例：`src/data/uni-news/uq/2026-04-22.json`。

关键字段：
- `school` 必须是 10 校枚举之一（pipeline 据此从 `uni-brand.v1.json` 取 brand color）
- `summary / news / quickview / xhsCopy` **全部必填**
- `news` 2-4 条
- `quickview.items` 2-4 条
- `xhsCopy.p1~p5` **5 张 copy 全都要**（title + body + tags）
- **`mp.title` 禁止加 `｜{校名}日报` 后缀**（2026-04-22 运营决议）
- `drafts.sensitivityScan` 至少写一行"未检出"作为证据

**🚨 JSON 字符串里禁止嵌入 ASCII 双引号 `"`**（会破坏 JSON 结构）。要用中文引号写 `「」` / `『』`；需要 ASCII 引号用 `\"` 显式转义。

### Step 4. 敏感词扫描（写内容时同步过这 7 类）

| 类别 | 禁词示例 | 替换 |
|---|---|---|
| 绝对化 | 最 / 第一 / 唯一 / 100% / 首个 | "我觉得" / "体感不错" |
| 教育承诺 | 包过 / 保录取 / 稳上 / 必中 | 直接删，改"我怎么准备的" |
| 引流 | 加V / VX / 薇信 / 私信领取 / 关注公众号 | "评论区扣 1" |
| **封号红线** | **JR Academy / 匠人学院 / jiangren.com / 任何域名 / 二维码** | 封面 + xhsCopy 里**绝对**不准出现（mp-article 的 CTA 里允许"关注 JR Academy 公众号"，那是公众号发稿页合法引流） |
| AI 味 | 首先...其次 / 值得注意的是 / 综上所述 / 此外 / 作为一个 | "先说 XX" / "还有个事" / 删 |
| 医疗化妆品 | 治疗 / 速效 / 纯天然 | 大学新闻不碰 |
| 政治金融 | 保本 / 稳赚 / 年化 / 荐股 | 大学新闻不碰 |

### Step 5. 跑 pipeline + 自检

```bash
for s in $SCHOOLS; do
  F=src/data/uni-news/$s/${DATE}.json
  # 1. JSON schema 验证
  jq empty $F || exit 1
  N=$(jq '.news | length' $F); [ $N -ge 2 ] && [ $N -le 4 ] || exit 1
  for p in p1 p2 p3 p4 p5; do
    jq -e ".xhsCopy.$p.title and .xhsCopy.$p.body and .xhsCopy.$p.tags" $F >/dev/null || exit 1
  done

  # 2. 封号红线扫描（xhsCopy + drafts 正文，跳过 sensitivityScan 表和 mp.cta）
  jq -r '[.xhsCopy[].body, .xhsCopy[].tags, .drafts.sections[].body] | join(" ")' $F | \
    grep -qiE "JR Academy|匠人学院|jiangren\.com|关注公众号|抖音号|加V|VX|薇信|保过|包过|保录取" \
    && { echo "❌ 封号红线命中 · $s"; exit 1; } || true

  # 3. mp.title 禁 ｜{校}日报 后缀
  jq -r '.mp.title // ""' $F | grep -qE '｜.*日报|\| .*日报' && { echo "❌ mp.title 违规"; exit 1; } || true

  # 4. pipeline 渲染
  bun run build:uni-news ${DATE} $s || exit 1

  # 5. 4 个产物齐全
  OUT=src/static/uni-news-social/${DATE}/$s
  [ -f $OUT/xhs-posters.html ] && [ -f $OUT/mp-article.html ] && \
    [ -f $OUT/xhs-drafts.md ] && [ -f src/content/articles/uni-news-$s-${DATE}.md ] || exit 1
done

# 6. rebuild hub
node scripts/rebuild-uni-hub.mjs || exit 1
```

## 📋 产出清单（每校）

```
src/content/universities/{school}/news-{DATE}.md       ← agent 写（8-12KB · 上游新闻 md）
src/data/uni-news/{school}/{DATE}.json                 ← agent 写（15KB · 结构化数据）

Pipeline 产：
src/static/uni-news-social/{DATE}/{school}/xhs-posters.html  ← 小红书 5 图 carousel
src/static/uni-news-social/{DATE}/{school}/mp-article.html   ← 公众号发稿页（inline style）
src/static/uni-news-social/{DATE}/{school}/xhs-drafts.md     ← 小红书草稿
src/content/articles/uni-news-{school}-{DATE}.md             ← 官网 /blog/ markdown
```

+ hub: `scripts/rebuild-uni-hub.mjs` 自动重建 `src/static/uni-news-social/{index.html, schools/*.html}`

## 🎨 人性化要求（xhsCopy.body + drafts.sections[].body）

1. 第一人称 + 具体时间线（"上周 04-18 官网发的" > "近期"）
2. 段落长短参差（1-2 句短段 + 4-5 句长段交替）
3. emoji 克制（1-2 段插 1 个，不要每句都挂）
4. 有小纠结 / 个人判断（"我也在犹豫申 A 还是 B"）
5. 结尾互动句（"有同样在申请的姐妹扣 1"）
6. 标题 ≤22 字（含 emoji 算字数）

## 🔗 参考

- **Schema**: `src/data/_schemas/uni-news.schema.json`
- **Pipeline**: `build/pipelines/uni-news.pipeline.ts`
- **Templates**: `src/templates/mp-article/uni-news.template.html` + `src/templates/xhs-drafts/uni-news.template.md`
- **Brand**: `src/data/uni-brand.v1.json`（10 校颜色 + 名称）
- **最新示例**: `src/data/uni-news/uq/2026-04-22.json`
- **架构 PRD**: `docs/SCHEDULED_CONTENT_PLATFORM_PRD.md`
