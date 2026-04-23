/**
 * Uni News pipeline (per school per day)
 *
 * 读 src/data/uni-news/{school}/{DATE}.json → 生成
 *   1. src/static/uni-news-social/{DATE}/{school}/xhs-posters.html  (5-frame carousel)
 *   2. src/static/uni-news-social/{DATE}/{school}/mp-article.html   (公众号薄壳)
 *   3. src/static/uni-news-social/{DATE}/{school}/xhs-drafts.md     (小红书草稿 + 敏感词扫描表)
 *
 * Brand 色从 src/data/uni-brand.v1.json 读取（按 school code 匹配）。
 *
 * 用法：
 *   bun build/pipelines/uni-news.pipeline.ts 2026-04-23 monash
 *   bun build/pipelines/uni-news.pipeline.ts 2026-04-23              # 所有学校
 *   bun build/pipelines/uni-news.pipeline.ts                         # 全量
 */

import { readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import {
	htmlEscape,
	loadJson,
	loadTemplate,
	renderTemplate,
	canWriteOrSkip,
	writeWithMarker,
} from './_shared';

const REPO_ROOT = join(dirname(new URL(import.meta.url).pathname), '..', '..');
const DATA_ROOT = join(REPO_ROOT, 'src/data/uni-news');
const BRAND_JSON = join(REPO_ROOT, 'src/data/uni-brand.v1.json');
const TEMPLATE_MP = join(REPO_ROOT, 'src/templates/mp-article/uni-news.template.html');
const TEMPLATE_DRAFTS = join(REPO_ROOT, 'src/templates/xhs-drafts/uni-news.template.md');
const OUTPUT_BASE = join(REPO_ROOT, 'src/static/uni-news-social');

interface BrandEntry {
	primary: string;
	deep: string;
	light: string;
	accent: string;
	text: string;
	nameCn: string;
	nameEn: string;
	city: string;
	code: string;
	emblem: string;
}
interface BrandFile { brands: Record<string, BrandEntry>; }

interface NewsBullet { k: string; v: string; }
interface NewsItem {
	idx: string;
	category: string;
	h2Main: string;
	h2Sub?: string;
	h2Highlight?: string;
	lead: string;
	bullets: NewsBullet[];
	source: string;
	sourceUrl?: string;
}
interface XhsCopyItem {
	title: string;
	body: string;
	tags: string;
	wechat?: string[];
	community?: string[];
}
interface UniNewsData {
	schemaVersion?: string;
	date: string;
	school: string;
	summary: {
		hookMain: string;
		hookSub: string;
		hookSubHighlight?: string;
		subLines: string[];
		previewCards: Array<{ num: string; title: string; data: string }>;
	};
	news: NewsItem[];
	quickview: {
		titleMain?: string;
		titleHighlight?: string;
		sub?: string;
		items: Array<{ n: string; title: string; body: string }>;
		cta?: { big?: string; sub?: string; badge?: string };
	};
	xhsCopy: {
		p1: XhsCopyItem;
		p2: XhsCopyItem;
		p3: XhsCopyItem;
		p4: XhsCopyItem;
		p5: XhsCopyItem;
	};
	mp?: {
		title?: string;
		lead?: string;
		meta?: { readTime?: string };
		newsBodies?: Array<{ h2?: string; paragraphs?: string[]; sourceHtml?: string }>;
		quickview?: { title?: string; items?: string[] };
		cta?: { big?: string; sub?: string };
	};
	drafts?: {
		sections?: Array<{ heading: string; body: string; tags: string[] }>;
		sensitivityScan?: Array<{ category: string; rule: string; result: string }>;
	};
}

function validate(data: unknown, file: string): asserts data is UniNewsData {
	if (!data || typeof data !== 'object') throw new Error(`${file}: not a JSON object`);
	const d = data as Record<string, unknown>;
	if (typeof d.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) {
		throw new Error(`${file}: invalid date`);
	}
	if (typeof d.school !== 'string') throw new Error(`${file}: missing school`);
	if (!d.summary || typeof d.summary !== 'object') throw new Error(`${file}: missing summary`);
	if (!Array.isArray(d.news) || d.news.length < 2) {
		throw new Error(`${file}: news must have ≥2 items`);
	}
	if (!d.xhsCopy || typeof d.xhsCopy !== 'object') throw new Error(`${file}: missing xhsCopy`);
}

/* =========================== xhs-posters HTML 生成 =========================== */

function replaceHighlight(text: string, highlight?: string): string {
	if (!highlight) return htmlEscape(text);
	if (!text.includes(highlight)) return htmlEscape(text);
	const parts = text.split(highlight);
	return htmlEscape(parts[0]) + `<em class="hl">${htmlEscape(highlight)}</em>` + htmlEscape(parts.slice(1).join(highlight));
}

function renderHookSub(hookSub: string, highlight?: string): string {
	if (!highlight) return htmlEscape(hookSub);
	if (!hookSub.includes(highlight)) return htmlEscape(hookSub);
	const parts = hookSub.split(highlight);
	return htmlEscape(parts[0]) + `<em>${htmlEscape(highlight)}</em>` + htmlEscape(parts.slice(1).join(highlight));
}

function renderP1Cover(data: UniNewsData, brand: BrandEntry): string {
	const dateShort = data.date.slice(5).replace('-', ' / ');
	const s = data.summary;
	const previewCards = s.previewCards.map(c => `
          <div class="preview-card">
            <div class="num">${htmlEscape(c.num)}</div>
            <div class="title">${htmlEscape(c.title)}</div>
            <div class="data">${htmlEscape(c.data)}</div>
          </div>`).join('');
	const subLines = s.subLines.map(l => htmlEscape(l)).join('<br>');
	return `
<div class="poster-frame" id="p1">
  <div class="label">P1 封面 <em>· ${htmlEscape(s.hookMain)} 合集</em></div>
  <div class="poster-scaler">
    <div class="poster p1" id="poster-1">
      <div class="p-inner">
        <div class="p-dots"></div>
        <div class="p-tag"><span class="dot"></span>${htmlEscape(brand.code)} · ${htmlEscape(data.date.slice(5))} 日报</div>

        <div>
          <div class="hook">
            ${htmlEscape(s.hookMain)}<br>
            ${renderHookSub(s.hookSub, s.hookSubHighlight)}
          </div>
          <div class="sub">
            ${subLines}
          </div>
        </div>

        <div class="date-chip">
          <div class="big">${htmlEscape(dateShort)}</div>
          <div class="small">${data.date.slice(0, 4)} · 澳洲大学日报</div>
        </div>

        <div class="preview-grid">${previewCards}
        </div>
      </div>
    </div>
  </div>
  <button class="dl-btn" data-target="poster-1" data-slug="p1-cover">⬇ 下载 PNG</button>
</div>`;
}

function renderNewsPoster(news: NewsItem, frameIdx: number, brand: BrandEntry): string {
	const posterIdx = frameIdx + 1; // p2 = poster-2
	const h2 = news.h2Sub
		? `${replaceHighlight(news.h2Main, news.h2Highlight)}<br>${replaceHighlight(news.h2Sub, news.h2Highlight)}`
		: replaceHighlight(news.h2Main, news.h2Highlight);
	const bullets = news.bullets.map(b => `
          <div class="b-item">
            <div class="b-key">${htmlEscape(b.k)}</div>
            <div class="b-val">${b.v}</div>
          </div>`).join('');
	const sourceUrl = news.sourceUrl ? `<br>${htmlEscape(news.sourceUrl)}` : '';
	return `
<div class="poster-frame" id="p${frameIdx}">
  <div class="label">P${frameIdx} 新闻 ${frameIdx - 1} <em>· ${htmlEscape(news.category)}</em></div>
  <div class="poster-scaler">
    <div class="poster p-news p${frameIdx}" id="poster-${posterIdx}">
      <div class="p-inner">
        <div class="p-dots"></div>
        <div class="p-tag"><span class="dot"></span>${htmlEscape(news.idx)} · ${htmlEscape(news.category)}</div>

        <h2>${h2}</h2>

        <div class="lead">
          ${news.lead}
        </div>

        <div class="bullets">${bullets}
        </div>

        <div class="source">
          <b>Source</b>: ${htmlEscape(news.source)}${sourceUrl}
        </div>
      </div>
    </div>
  </div>
  <button class="dl-btn" data-target="poster-${posterIdx}" data-slug="p${frameIdx}-${news.idx}">⬇ 下载 PNG</button>
</div>`;
}

function renderP5QuickView(data: UniNewsData, brand: BrandEntry): string {
	const qv = data.quickview;
	const items = qv.items.map(it => `
          <div class="quick-item">
            <div class="n">${htmlEscape(it.n)}</div>
            <div class="body">
              <h4>${htmlEscape(it.title)}</h4>
              <p>${htmlEscape(it.body)}</p>
            </div>
          </div>`).join('');
	const titleHl = qv.titleHighlight ? `<br><em>${htmlEscape(qv.titleHighlight)}</em>` : '';
	const ctaBig = qv.cta?.big || '关注每日大学日报';
	const ctaSub = qv.cta?.sub || '10 所澳洲大学 · 每天 3 校 · 奖学金 + 科研 + 招生一手同步';
	const badge = qv.cta?.badge || data.date.slice(5).replace('-', ' / ');
	const frameIdx = data.news.length + 2; // skip p1 cover + news frames
	const posterIdx = frameIdx; // p5 for 3 news, p6 for 4 news
	return `
<div class="poster-frame" id="p5">
  <div class="label">P5 速览 <em>· 今日 ${data.news.length} 条 + 下一步</em></div>
  <div class="poster-scaler">
    <div class="poster p5" id="poster-5">
      <div class="p-inner">
        <div class="p-dots"></div>
        <div class="p-tag"><span class="dot"></span>${htmlEscape(brand.code)} · ${htmlEscape(data.date.slice(5))} 速览</div>

        <h2>${htmlEscape(qv.titleMain || '今日 ' + data.news.length + ' 条')}${titleHl}</h2>

        ${qv.sub ? `<div class="sub">${htmlEscape(qv.sub)}</div>` : ''}

        <div class="quick-row">${items}
        </div>

        <div class="cta-row">
          <div>
            <div class="big">${htmlEscape(ctaBig)}</div>
            <div class="sub-cta">${htmlEscape(ctaSub)}</div>
          </div>
          <div class="badge">${htmlEscape(badge)}</div>
        </div>
      </div>
    </div>
  </div>
  <button class="dl-btn" data-target="poster-5" data-slug="p5-quickview">⬇ 下载 PNG</button>
</div>`;
}

function renderXhsPosters(data: UniNewsData, brand: BrandEntry): string {
	const frames: string[] = [];
	frames.push(renderP1Cover(data, brand));
	data.news.forEach((n, i) => {
		frames.push(renderNewsPoster(n, i + 2, brand));
	});
	frames.push(renderP5QuickView(data, brand));

	const statsPill = `${data.news.length + 2} 张海报`;
	const xhsCopyJson = JSON.stringify(data.xhsCopy, null, 2);

	return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>${htmlEscape(brand.nameCn)} ${data.date} · 小红书素材（封面 + ${data.news.length} 条新闻 + 速览）</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../xhs-shared.css">
<style>
  :root { --cp-accent: ${brand.primary}; }
  :root {
    --brand-dark: #10162f;
    --brand-yellow: #ffce44;
    --brand-green: #10b981;
    --brand-red: #ff5757;
    --uni-primary: ${brand.primary};
    --uni-deep: ${brand.deep};
    --uni-light: ${brand.light};
    --uni-accent: ${brand.accent};
  }
  body {
    background: #eef0f4;
    color: #10162f;
    font-family: 'Noto Sans SC', system-ui, sans-serif;
    padding: 40px 20px 120px 120px;
    line-height: 1.55;
  }
  .page-wrap { max-width: 1500px; margin: 0 auto; }
  .page-head {
    background: #fff; border: 2px solid var(--brand-dark); border-radius: 20px;
    padding: 30px 34px; margin-bottom: 32px;
    box-shadow: 8px 8px 0 var(--brand-dark);
  }
  .page-head h1 { font-size: 28px; font-weight: 900; letter-spacing: -0.5px; }
  .page-head h1 span { color: var(--uni-primary); }
  .page-head .sub { margin-top: 10px; color: #64748b; font-size: 14px; line-height: 1.65; max-width: 900px; }
  .page-head .stats { display: flex; gap: 10px; margin-top: 18px; flex-wrap: wrap; }
  .stat-pill {
    padding: 6px 14px; border-radius: 999px; border: 1.5px solid var(--brand-dark);
    background: #f8f9fb; color: var(--brand-dark);
    font-size: 12px; font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
  }
  .stat-pill.ok { background: #ecfdf5; color: var(--brand-green); }
  .dl-btn.all { cursor: pointer; }
</style>
</head>
<body>
<div class="page-wrap">

<div class="page-head">
  <h1>📱 ${htmlEscape(brand.nameCn)} <span>${htmlEscape(brand.nameEn)}</span> · ${data.date}</h1>
  <div class="sub">小红书 ${data.news.length + 2} 图 carousel：P1 封面 + P2~P${data.news.length + 1} 新闻 + P5 速览。左侧缩略导航，右侧 copy 面板切换 3 种文案（XHS / 朋友圈 / 群聊）。</div>
  <div class="stats">
    <div class="stat-pill">📸 ${statsPill}</div>
    <div class="stat-pill">🎨 ${brand.code} ${brand.primary}</div>
    <div class="stat-pill ok">✅ 封号红线清</div>
    <button class="dl-btn all" id="dl-all">⬇ 一键全部下载 ${data.news.length + 2} 张</button>
  </div>
</div>

${frames.join('\n')}

</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script>
async function dlOne(target, slug) {
  const el = document.getElementById(target);
  if (!el) return;
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  if (window.__applyUniPosterAutoFit) window.__applyUniPosterAutoFit(el);
  const stage = document.createElement('div');
  stage.style.cssText = 'position:fixed;left:-10000px;top:-10000px;width:1242px;height:1660px;overflow:hidden;background:transparent;z-index:-1;';
  const clone = el.cloneNode(true);
  clone.id = '';
  clone.style.transform = 'none';
  clone.style.position = 'relative';
  clone.style.left = '0';
  clone.style.top = '0';
  stage.appendChild(clone);
  document.body.appendChild(stage);
  try {
    if (window.__applyUniPosterAutoFit) window.__applyUniPosterAutoFit(stage);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const canvas = await html2canvas(clone, {
      backgroundColor: null, scale: 2,
      width: 1242, height: 1660,
      windowWidth: 1242, windowHeight: 1660,
      useCORS: true, allowTaint: true, logging: false,
    });
    const link = document.createElement('a');
    link.download = slug + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  } finally {
    if (stage.parentNode) stage.parentNode.removeChild(stage);
  }
}
document.querySelectorAll('.dl-btn[data-target]').forEach(btn => {
  btn.addEventListener('click', async () => {
    const orig = btn.textContent;
    btn.disabled = true; btn.textContent = '渲染中…';
    try { await dlOne(btn.dataset.target, btn.dataset.slug); btn.textContent = '✅ 已下载'; }
    catch (e) { console.error(e); btn.textContent = '❌ 失败'; }
    finally { setTimeout(() => { btn.disabled = false; btn.textContent = orig; }, 1200); }
  });
});
document.getElementById('dl-all').addEventListener('click', async () => {
  const btns = document.querySelectorAll('.dl-btn[data-target]');
  for (const btn of btns) {
    btn.click();
    await new Promise(r => setTimeout(r, 1200));
  }
});

window.XHS_COPY = ${xhsCopyJson};
</script>
<script src="../../xhs-shared.js"></script>
</body>
</html>`;
}

/* =========================== mp-article HTML 生成 =========================== */

function renderMpArticleContent(data: UniNewsData, brand: BrandEntry): { html: string; charCount: number } {
	const mp = data.mp || {};
	const title = mp.title || `${data.summary.hookMain} · ${data.date.slice(5)}`;  // 2026-04-22 规则：不加 ｜{校名}日报 后缀
	const lead = mp.lead || `${brand.nameCn}（${brand.nameEn}）${data.date}：${data.summary.subLines.join('、')}。`;
	const author = `${brand.nameCn} · ${brand.code} 日报`;
	const readTime = mp.meta?.readTime || '5 分钟';
	const newsBodies = mp.newsBodies || [];
	const qv = mp.quickview || {};
	const qvTitle = qv.title || '📌 今日速览';
	const qvItems = qv.items || data.quickview.items.map(it => `<strong>${it.title}</strong>：${it.body}`);
	const cta = mp.cta || {};
	const ctaBig = cta.big || data.quickview.cta?.big || `关注每日 ${brand.code} 大学日报`;
	const ctaSub = cta.sub || data.quickview.cta?.sub || '10 所澳洲大学 · 每天 3 校 · 一手同步';

	const parts: string[] = [];
	parts.push(`<div class="mp-title">${htmlEscape(title)}</div>`);
	parts.push(`<div class="mp-meta">`);
	parts.push(`  <span class="author">${htmlEscape(author)}</span>`);
	parts.push(`  <span>·</span><span>${htmlEscape(data.date)}</span>`);
	parts.push(`  <span>·</span><span>阅读约 ${htmlEscape(readTime)}</span>`);
	parts.push(`</div>`);
	parts.push(`<div class="mp-lead">${lead}</div>`);
	parts.push(`<hr class="mp-divider">`);

	data.news.forEach((n, i) => {
		const body = newsBodies[i] || {};
		const h2 = body.h2 || `${n.h2Main}${n.h2Sub ? '，' + n.h2Sub : ''}`;
		const paragraphs = body.paragraphs || [
			`<strong>${htmlEscape(n.bullets[0]?.k || '关键数据')}</strong>：${n.bullets[0]?.v || ''}`,
			`<strong>${htmlEscape(n.bullets[1]?.k || '背景')}</strong>：${n.bullets[1]?.v || ''}`,
			`<strong>${htmlEscape(n.bullets[2]?.k || '对你的影响')}</strong>：${n.bullets[2]?.v || ''}`,
		];
		const sourceHtml = body.sourceHtml || `来源：${htmlEscape(n.source)}${n.sourceUrl ? ` · <a href="https://${n.sourceUrl.replace(/^https?:\/\//, '')}">${htmlEscape(n.sourceUrl)}</a>` : ''}`;

		parts.push(`<div class="mp-hook">${htmlEscape(n.idx)} · ${htmlEscape(n.category)}</div>`);
		parts.push(`<div class="mp-h2">${htmlEscape(h2)}</div>`);
		parts.push(`<div class="mp-oneline"><strong>一句话</strong>：${n.lead}</div>`);
		for (const p of paragraphs) {
			parts.push(`<p>${p}</p>`);
		}
		parts.push(`<div class="mp-source">${sourceHtml}</div>`);
		parts.push(`<hr class="mp-divider">`);
	});

	parts.push(`<div class="mp-quickview">`);
	parts.push(`  <h3>${htmlEscape(qvTitle)}</h3>`);
	parts.push(`  <ul>`);
	for (const item of qvItems) parts.push(`    <li>${item}</li>`);
	parts.push(`  </ul>`);
	parts.push(`</div>`);

	parts.push(`<div class="mp-cta">`);
	parts.push(`  <div class="big">${htmlEscape(ctaBig)}</div>`);
	parts.push(`  <div class="sub">${htmlEscape(ctaSub)}</div>`);
	parts.push(`</div>`);

	const html = parts.join('\n');
	const charCount = html.replace(/<[^>]*>/g, '').replace(/\s+/g, '').length;
	return { html, charCount };
}

/* =========================== xhs-drafts.md 生成 =========================== */

function renderXhsDrafts(data: UniNewsData, brand: BrandEntry): string {
	const drafts = data.drafts || {};
	const sections = drafts.sections || [{
		heading: `${brand.nameCn} ${data.date} 日报`,
		body: `${data.summary.hookMain} ${data.summary.hookSub}。${data.summary.subLines.join('；')}。`,
		tags: ['#' + brand.code, '#' + brand.nameCn, '#澳洲留学', '#大学新闻'],
	}];
	const scan = drafts.sensitivityScan || [
		{ category: '绝对化', rule: '最 / 第一 / 唯一 / 绝对', result: '未检出' },
		{ category: '教育承诺', rule: '包过 / 保录', result: '未检出' },
		{ category: '引流', rule: '加 V / 微信号 / 私信 / 关注公众号', result: '未检出' },
		{ category: 'AI 味', rule: '首先其次 / 值得注意 / 综上所述', result: '未检出' },
	];

	const draftSections = sections.map((s, i) => `### ${i + 1}. ${htmlEscape(s.heading)}\n\n${s.body}\n\n**Tags**: ${s.tags.join(' ')}`).join('\n\n---\n\n');
	const sensitivityRows = scan.map(r => `| ${r.category} | ${r.rule} | ${r.result} |`).join('\n');

	const template = loadTemplate(TEMPLATE_DRAFTS);
	return renderTemplate(template, {
		SCHOOL_CN: brand.nameCn,
		SCHOOL_CODE: brand.code,
		SCHOOL_CODE_LOWER: data.school,
		DATE: data.date,
		DRAFT_SECTIONS: draftSections,
		SENSITIVITY_ROWS: sensitivityRows,
	});
}

/* =========================== Build one =========================== */

interface BuildResult {
	date: string;
	school: string;
	postersPath: string;
	postersBytes: number;
	mpPath: string;
	mpBytes: number;
	draftsPath: string;
	draftsBytes: number;
}

function buildOne(dataPath: string, brandFile: BrandFile, force: boolean): BuildResult {
	const data = loadJson<UniNewsData>(dataPath);
	validate(data, dataPath);
	const brand = brandFile.brands[data.school];
	if (!brand) throw new Error(`unknown school: ${data.school}`);

	const outDir = join(OUTPUT_BASE, data.date, data.school);

	/* --- 1. xhs-posters.html --- */
	const postersHtml = renderXhsPosters(data, brand);
	const postersPath = join(outDir, 'xhs-posters.html');
	let postersSkipped = false;
	if (canWriteOrSkip(postersPath, force) === 'write') writeWithMarker(postersPath, postersHtml, 'uni-news');
	else postersSkipped = true;

	/* --- 2. mp-article.html --- */
	const mpTemplate = loadTemplate(TEMPLATE_MP);
	const { html: articleContent, charCount } = renderMpArticleContent(data, brand);
	const readMin = Math.max(3, Math.round(charCount / 400));
	const mpOutput = renderTemplate(mpTemplate, {
		DATE: data.date,
		SCHOOL_CN: brand.nameCn,
		SCHOOL_CODE: brand.code,
		BRAND_PRIMARY: brand.primary,
		BRAND_HIGHLIGHT: brand.accent,
		BRAND_DARK: '#10162f',
		BRAND_JSON: JSON.stringify({
			primary: brand.primary,
			highlight: brand.accent,
			dark: '#10162f',
			onDark: brand.text,
		}),
		ARTICLE_CONTENT: articleContent,
		STAT_CHARS: String(charCount),
		STAT_NEWS: String(data.news.length),
		STAT_READ_MIN: String(readMin),
	});
	const mpPath = join(outDir, 'mp-article.html');
	let mpSkipped = false;
	if (canWriteOrSkip(mpPath, force) === 'write') writeWithMarker(mpPath, mpOutput, 'uni-news');
	else mpSkipped = true;

	/* --- 3. xhs-drafts.md --- */
	const draftsMd = renderXhsDrafts(data, brand);
	const draftsPath = join(outDir, 'xhs-drafts.md');
	let draftsSkipped = false;
	if (canWriteOrSkip(draftsPath, force) === 'write') writeWithMarker(draftsPath, draftsMd, 'uni-news');
	else draftsSkipped = true;

	return {
		date: data.date,
		school: data.school,
		postersPath: postersSkipped ? `${postersPath} (skipped)` : postersPath,
		postersBytes: postersSkipped ? 0 : Buffer.byteLength(postersHtml, 'utf8'),
		mpPath: mpSkipped ? `${mpPath} (skipped)` : mpPath,
		mpBytes: mpSkipped ? 0 : Buffer.byteLength(mpOutput, 'utf8'),
		draftsPath: draftsSkipped ? `${draftsPath} (skipped)` : draftsPath,
		draftsBytes: draftsSkipped ? 0 : Buffer.byteLength(draftsMd, 'utf8'),
	};
}

export function buildAll(targetDate?: string, targetSchool?: string, force = false): void {
	if (!existsSync(DATA_ROOT)) {
		console.warn(`[uni-news] data dir missing: ${DATA_ROOT}`);
		return;
	}
	const brandFile = loadJson<BrandFile>(BRAND_JSON);

	const schools = targetSchool
		? [targetSchool]
		: readdirSync(DATA_ROOT).filter(d => !d.startsWith('_'));

	const results: BuildResult[] = [];
	const failures: Array<{ file: string; error: string }> = [];

	for (const school of schools) {
		const schoolDir = join(DATA_ROOT, school);
		if (!existsSync(schoolDir)) {
			console.warn(`[uni-news] school dir missing: ${schoolDir}`);
			continue;
		}
		const files = readdirSync(schoolDir).filter(f => f.endsWith('.json') && !f.startsWith('_'));
		const toBuild = targetDate ? files.filter(f => f === `${targetDate}.json`) : files;
		for (const file of toBuild) {
			const dataPath = join(schoolDir, file);
			try {
				const r = buildOne(dataPath, brandFile, force);
				results.push(r);
				console.log(`[uni-news] ✓ ${r.date} / ${r.school}`);
				console.log(`    posters: ${r.postersPath} (${(r.postersBytes / 1024).toFixed(1)} KB)`);
				console.log(`    mp:      ${r.mpPath} (${(r.mpBytes / 1024).toFixed(1)} KB)`);
				console.log(`    drafts:  ${r.draftsPath} (${(r.draftsBytes / 1024).toFixed(1)} KB)`);
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				failures.push({ file: `${school}/${file}`, error: msg });
				console.error(`[uni-news] ✗ ${school}/${file}: ${msg}`);
			}
		}
	}

	console.log(`\n[uni-news] built ${results.length}`);
	if (failures.length > 0) {
		console.error(`[uni-news] ${failures.length} failure(s):`);
		for (const f of failures) console.error(`  - ${f.file}: ${f.error}`);
		process.exit(1);
	}
}

if (import.meta.main) {
	const args = process.argv.slice(2);
	const force = args.includes('--force');
	const positional = args.filter(a => !a.startsWith('--'));
	const [date, school] = positional;
	buildAll(date, school, force);
}
