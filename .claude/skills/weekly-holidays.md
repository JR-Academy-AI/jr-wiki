---
description: 每周日抓未来 30 天 AU/SG/MY/US/GB 节假日，产出 JSON 给 admin 营销日历用（滚动窗口）
---

# /weekly-holidays — 未来 30 天 5 国节假日（营销排期用）

**目的**：提前一个月看到 5 国公共假日，给运营/营销做月度活动规划参考。

**使用场景**：下周五 SG 劳动节 → 要不要推内容？两周后 GB Bank Holiday → 投 UK 广告避开？月底 US Memorial Day → 蹭暑期实习季话题？

**不产海报、不发公众号、不进 hub**。纯内部数据 → admin 页面读取。

## 使用

```
/weekly-holidays              # 默认：rangeStart = AEST 今天，rangeEnd = today + 30
/weekly-holidays 2026-04-23   # 手动指定 rangeStart
```

## 产出

```
src/data/weekly-holidays/
├── _my-holidays-{year}.json   # MY 年度静态表（手维护，每年刷一次）
├── {rangeStart}.json          # 30 天窗口快照 (e.g. 2026-04-23.json)
└── latest.json                # 永远是最新一次运行的产出（admin 读这个）
```

## 执行步骤

### Step 0: 确定窗口（AEST 时区强制）

```bash
# schedule 跑在 UTC → 必须用 AEST 取日期，否则误差一天
RANGE_START=${1:-$(TZ='Australia/Sydney' date +%Y-%m-%d)}
RANGE_END=$(python3 -c "
from datetime import date, timedelta
print((date.fromisoformat('$RANGE_START') + timedelta(days=30)).isoformat())
")
echo "Window: $RANGE_START → $RANGE_END (31 days inclusive)"
```

### Step 1: 抓 Nager.Date 数据（AU/SG/US/GB，自动跨年）

MY **不支持**，单独处理。其他 4 国 API 已验证可用（AU 25 条/年 · SG 10 · US 16 · GB 14）。

```bash
YEAR_START=$(echo "$RANGE_START" | cut -d- -f1)
YEAR_END=$(echo "$RANGE_END" | cut -d- -f1)
YEARS="$YEAR_START"
[ "$YEAR_START" != "$YEAR_END" ] && YEARS="$YEAR_START $YEAR_END"

mkdir -p /tmp/hol
for Y in $YEARS; do
  for C in AU SG US GB; do
    curl -s "https://date.nager.at/api/v3/PublicHolidays/$Y/$C" -o "/tmp/hol/$C-$Y.json"
  done
done
```

跨年（12 月底运行）时 `$YEARS` 会有两个年份，合并两个文件。

### Step 2: MY 数据从静态文件读

```bash
for Y in $YEARS; do
  MY_FILE="src/data/weekly-holidays/_my-holidays-$Y.json"
  if [ ! -f "$MY_FILE" ]; then
    echo "❌ 缺少 $MY_FILE — 年度 MY 节日表没维护"
    echo "   停下来问用户要 $Y 年 Malaysia 联邦公共假日（或让我按官方来源研究生成）"
    exit 1
  fi
done
```

**MY 年度表格式** 与旧版一致：

```json
{
  "country": "MY",
  "year": 2026,
  "source": "https://publicholidays.com.my/{year}/",
  "holidays": [
    { "date": "2026-01-01", "name": "New Year's Day", "localName": "Tahun Baru", "type": "Public" }
  ]
}
```

⚠️ MY 每年很多伊斯兰/印度教节日日期浮动，**绝不能用去年的日期**。年初查 [publicholidays.com.my](https://publicholidays.com.my/) 手工更新。

### Step 3: 过滤到 30 天窗口 + AI 增强

对每条 Nager/MY 数据：
1. 过滤：`RANGE_START <= date <= RANGE_END`
2. AI 生成 `nameZh`（中文译名，用学员熟知的名字）
3. AI 生成 `marketingNote`（1 句话，≤40 字，给运营看的营销提示）

**marketingNote 写作规则**（写 30+ 条时最容易变模板，严格把关）：

- ✅ 具体：说清楚这个节"学员在不在线、什么内容适合发、哪个人群共鸣"
- ❌ 禁：写"节日快乐"、"记得安排内容"、"适合营销"、"做好准备"这种废话
- ❌ 禁：对小众州/地区假日（比如 US-MO Truman Day、AU-NT May Day）瞎编"适合推北领地学员" —— 诚实写"基数很小可忽略"
- 句式参考：
  - "US Memorial Day · 美股休市 + 暑期实习季开端，推美本求职内容"
  - "Hari Raya · 马来穆斯林学员线下活动多，避开重推广，改发社群互动"
  - "Anzac Day · 澳洲纪念日严肃氛围，避免促销色调，发学员创业致敬故事"

### Step 4: 写 JSON 文件（schema v2）

```json
{
  "schemaVersion": "2.0",
  "rangeStart": "2026-04-23",
  "rangeEnd": "2026-05-23",
  "rangeDays": 31,
  "generatedAt": "2026-04-23T09:00:00+10:00",
  "countries": [
    { "code": "AU", "label": "澳洲", "flag": "🇦🇺" },
    { "code": "SG", "label": "新加坡", "flag": "🇸🇬" },
    { "code": "MY", "label": "马来西亚", "flag": "🇲🇾" },
    { "code": "US", "label": "美国", "flag": "🇺🇸" },
    { "code": "GB", "label": "英国", "flag": "🇬🇧" }
  ],
  "holidays": [
    {
      "date": "2026-05-01",
      "country": "MY",
      "name": "Labour Day",
      "localName": "Hari Pekerja",
      "nameZh": "劳动节",
      "type": "Public",
      "marketingNote": "马来学员连假出游居多 · 避免强推转化，改发社群话题"
    }
  ]
}
```

排序：按 `date` 升序，同一天按 `countries` 声明顺序。

### Step 5: 同时覆盖 latest.json

```bash
cp "src/data/weekly-holidays/$RANGE_START.json" "src/data/weekly-holidays/latest.json"
```

admin 页面只 fetch `latest.json`，永远看到最新一次的 30 天窗口。

### Step 6: 报告

```
🗓️ 未来 30 天节假日 ({RANGE_START} → {RANGE_END})

🇦🇺 AU: {n} 条
🇸🇬 SG: {n} 条
🇲🇾 MY: {n} 条
🇺🇸 US: {n} 条
🇬🇧 GB: {n} 条
合计: {total} 条

文件:
  src/data/weekly-holidays/{RANGE_START}.json
  src/data/weekly-holidays/latest.json (已覆盖)

admin 查看: /weekly-holidays
下一步: /publish
```

## 覆盖策略（v2 重要变化）

**可以覆盖**已有 `{rangeStart}.json` —— 因为滚动窗口每周都会重跑，同一天触发允许刷新。
**latest.json 每次都覆盖** —— 保证 admin 永远看最新数据。

v1 的"不覆盖历史"规则不再适用 —— 30 天窗口天然每周滚动前进，同一个 rangeStart 通常不会重复出现两次。

## 空窗口情况

30 天 5 国全空是极罕见场景（只有某些历史上的极短月份），真发生就 holidays: []，admin 页显示"未来 30 天 5 国都没有公共假日 · 罕见平静月"。

## 调度

`/schedule` 已挂：每周日 09:00 AEST 跑一次，写入"从当天起 30 天"的窗口。

## 不做什么

- ❌ 不生成海报、小红书、MP 文章
- ❌ 不写 markdown 到 articles/
- ❌ 不进 jiangren.com.au（纯 admin 内部工具）
- ❌ 不抓小众到可忽略的地方性假日单独做投放建议（比如 US-MO Truman Day 只有密苏里州政府放假） —— 诚实说"可忽略"，别硬编营销话术
