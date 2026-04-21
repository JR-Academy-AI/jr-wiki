#!/usr/bin/env node
// 扫 src/static/uni-news-social/{date}/{school}/ 实际产出的素材，
// 重建 index.html (item 计数) + schools/{school}.html (timeline)。
// /uni-news-poster 跑完后调一次，schedule 跑完也调。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HUB_DIR = path.join(ROOT, 'src/static/uni-news-social');
const SCHOOLS_DIR = path.join(HUB_DIR, 'schools');
const CONTENT_DIR = path.join(ROOT, 'src/content/universities');

const UNI_BRAND = {
	uq:       { primary: '#51247a', deep: '#2a0f57', light: '#7c3aed', accent: '#ffce44', text: '#ffffff', nameCn: '昆士兰大学',           nameEn: 'University of Queensland',          city: 'Brisbane, QLD',  code: 'UQ',       emblem: 'UQ' },
	umelb:    { primary: '#094183', deep: '#062b56', light: '#1565c0', accent: '#ffce44', text: '#ffffff', nameCn: '墨尔本大学',           nameEn: 'University of Melbourne',           city: 'Melbourne, VIC', code: 'UMELB',    emblem: 'UM' },
	unsw:     { primary: '#ffd100', deep: '#b89500', light: '#fff176', accent: '#10162f', text: '#10162f', nameCn: '新南威尔士大学',       nameEn: 'UNSW Sydney',                       city: 'Sydney, NSW',    code: 'UNSW',     emblem: 'UN' },
	usyd:     { primary: '#e64626', deep: '#9d2613', light: '#ff7b59', accent: '#ffce44', text: '#ffffff', nameCn: '悉尼大学',             nameEn: 'University of Sydney',              city: 'Sydney, NSW',    code: 'USYD',     emblem: 'US' },
	monash:   { primary: '#006dae', deep: '#003f6b', light: '#1e88e5', accent: '#ffce44', text: '#ffffff', nameCn: '莫纳什大学',           nameEn: 'Monash University',                 city: 'Melbourne, VIC', code: 'MONASH',   emblem: 'MN' },
	anu:      { primary: '#c7a85c', deep: '#8a7136', light: '#e8d9a8', accent: '#10162f', text: '#10162f', nameCn: '澳洲国立大学',         nameEn: 'Australian National University',    city: 'Canberra, ACT',  code: 'ANU',      emblem: 'AN' },
	adelaide: { primary: '#002f5f', deep: '#001838', light: '#1565c0', accent: '#ff5757', text: '#ffffff', nameCn: '阿德莱德大学',         nameEn: 'University of Adelaide',            city: 'Adelaide, SA',   code: 'ADELAIDE', emblem: 'AD' },
	rmit:     { primary: '#e60028', deep: '#9c0019', light: '#ff5252', accent: '#000000', text: '#ffffff', nameCn: 'RMIT 皇家墨尔本理工',  nameEn: 'RMIT University',                   city: 'Melbourne, VIC', code: 'RMIT',     emblem: 'RM' },
	uts:      { primary: '#0f4c81', deep: '#072f54', light: '#2196f3', accent: '#ff5757', text: '#ffffff', nameCn: '悉尼科技大学',         nameEn: 'University of Technology Sydney',   city: 'Sydney, NSW',    code: 'UTS',      emblem: 'UT' },
	uwa:      { primary: '#27348b', deep: '#161e57', light: '#5c6bc0', accent: '#ffce44', text: '#ffffff', nameCn: '西澳大学',             nameEn: 'University of Western Australia',   city: 'Perth, WA',      code: 'UWA',      emblem: 'UW' },
};

const SCHOOLS = Object.keys(UNI_BRAND);

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function parseFrontmatter(md) {
	const m = md.match(/^---\n([\s\S]*?)\n---/);
	if (!m) return {};
	const fm = {};
	for (const line of m[1].split('\n')) {
		const kv = line.match(/^([a-zA-Z]+):\s*(.*)$/);
		if (!kv) continue;
		let v = kv[2].trim();
		if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
		fm[kv[1]] = v;
	}
	return fm;
}

function deriveTags(md) {
	const tags = new Set();
	const text = md.toLowerCase();
	if (/奖学金|scholarship/i.test(md)) tags.add('#奖学金');
	if (/签证|visa|移民/i.test(md)) tags.add('#签证移民');
	if (/学费|fee|涨价/i.test(md)) tags.add('#学费调整');
	if (/招生|admission|录取/i.test(md)) tags.add('#招生政策');
	if (/科研|research|partnership|合作/i.test(md)) tags.add('#科研合作');
	if (/课程|course|专业|major|honours/i.test(md)) tags.add('#课程更新');
	if (/summer|winter|program/i.test(md)) tags.add('#项目开放');
	if (tags.size === 0) tags.add('#校园动态');
	return Array.from(tags).slice(0, 3);
}

function scanSchool(school) {
	const byDate = new Map();

	// Source 1: static poster directories
	if (fs.existsSync(HUB_DIR)) {
		for (const dateDir of fs.readdirSync(HUB_DIR)) {
			if (!/^\d{4}-\d{2}-\d{2}$/.test(dateDir)) continue;
			const dir = path.join(HUB_DIR, dateDir, school);
			if (!fs.statSync(dir, { throwIfNoEntry: false })?.isDirectory()) continue;
			const files = new Set(fs.readdirSync(dir));
			byDate.set(dateDir, {
				date: dateDir,
				hasMp: files.has('mp-article.html'),
				hasXhsCovers: files.has('xhs-covers.html'),
				hasXhsDrafts: files.has('xhs-drafts.md'),
				hasXhsPosters: files.has('xhs-posters.html'),
				hasMd: false,
				title: '',
				brief: '',
				tags: [],
			});
		}
	}

	// Source 2: upstream news markdown (may exist without posters)
	const schoolContentDir = path.join(CONTENT_DIR, school);
	if (fs.existsSync(schoolContentDir)) {
		for (const file of fs.readdirSync(schoolContentDir)) {
			const m = file.match(/^news-(\d{4}-\d{2}-\d{2})\.md$/);
			if (!m) continue;
			const date = m[1];
			const md = fs.readFileSync(path.join(schoolContentDir, file), 'utf8');
			const fm = parseFrontmatter(md);
			const entry = byDate.get(date) || {
				date,
				hasMp: false,
				hasXhsCovers: false,
				hasXhsDrafts: false,
				hasXhsPosters: false,
				hasMd: false,
				title: '',
				brief: '',
				tags: [],
			};
			entry.hasMd = true;
			entry.title = (fm.title || '').trim() || entry.title;
			entry.brief = (fm.description || '').trim() || entry.brief;
			entry.tags = deriveTags(md);
			byDate.set(date, entry);
		}
	}

	return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
}

function escapeHtml(s) {
	return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

function renderTimelineItem(school, brand, item) {
	const [y, mo, d] = item.date.split('-');
	const monthLabel = MONTHS[parseInt(mo, 10) - 1];
	const links = [];
	if (item.hasXhsPosters) links.push(`<a href="../${item.date}/${school}/xhs-posters.html" class="primary">📱 小红书</a>`);
	else if (item.hasXhsCovers) links.push(`<a href="../${item.date}/${school}/xhs-covers.html" class="primary">📱 小红书封面</a>`);
	if (item.hasMp) links.push(`<a href="../${item.date}/${school}/mp-article.html">📰 公众号</a>`);
	if (item.hasXhsCovers && item.hasXhsPosters) links.push(`<a href="../${item.date}/${school}/xhs-covers.html">🖼️ 封面图</a>`);
	if (item.hasXhsDrafts) links.push(`<a href="../${item.date}/${school}/xhs-drafts.md">📝 草稿</a>`);
	if (links.length === 0 && item.hasMd) {
		links.push(`<a href="https://github.com/JR-Academy-AI/jr-wiki/blob/main/src/content/universities/${school}/news-${item.date}.md" target="_blank" rel="noopener" class="primary">📄 新闻 md</a>`);
		links.push(`<span style="font-size:10px;color:#a89bc2;text-align:center;font-family:'Space Grotesk',sans-serif;letter-spacing:0.08em;padding:4px 0;">素材待产出</span>`);
	}
	const title = escapeHtml(item.title || `${brand.nameCn} ${mo}/${d} 新闻日报`);
	const brief = escapeHtml(item.brief || '点进查看公众号发稿页 + 小红书素材');
	const tags = item.tags.map(t => `<span>${escapeHtml(t)}</span>`).join('');
	return `    <div class="item">
      <div class="item-date">
        <div class="m">${monthLabel}</div>
        <div class="d">${parseInt(d, 10)}</div>
        <div class="y">${y}</div>
      </div>
      <div class="item-content">
        <div class="item-title">${title}</div>
        <div class="item-brief">${brief}</div>
        <div class="item-tags">${tags}</div>
      </div>
      <div class="item-links">
${links.map(l => '        ' + l).join('\n')}
      </div>
    </div>`;
}

function renderSchoolPage(school) {
	const brand = UNI_BRAND[school];
	const items = scanSchool(school);
	const itemCount = items.length;
	const latest = items[0]?.date || '';
	const latestLabel = latest ? `${latest.slice(5, 7)}-${latest.slice(8, 10)}` : '—';
	const timeline = itemCount > 0
		? items.map(it => renderTimelineItem(school, brand, it)).join('\n\n')
		: `    <div class="empty">
      <div class="emj">📭</div>
      <h3>还没有产出</h3>
      <p>schedule 跑完会自动产出，也可以手动跑 <code>/uni-news-poster [date] ${school}</code>。<br>上游新闻 md 在 <code>src/content/universities/${school}/news-*.md</code>。</p>
    </div>`;

	return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>${brand.code} ${brand.nameCn} · 社交素材</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;800;900&family=Space+Grotesk:wght@500;700&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap" rel="stylesheet">
<style>
  :root {
    --pri-deep: ${brand.deep};
    --pri: ${brand.primary};
    --pri-light: ${brand.light};
    --gold: ${brand.accent};
    --text-on: ${brand.text};
    --ink: #160a2c;
    --bg: #f6f1ff;
    --muted: #71628a;
    --border-soft: rgba(106,72,170,0.12);
    --panel-shadow: 0 20px 60px rgba(53,18,102,0.1);
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: radial-gradient(circle at top left, rgba(124,58,237,0.12), transparent 30%), var(--bg); color: var(--ink); font-family: 'Noto Sans SC', system-ui, sans-serif; padding: 32px 20px 80px; line-height: 1.65; }
  .page { max-width: 1100px; margin: 0 auto; }
  .breadcrumb { font-family: 'Space Grotesk', sans-serif; font-size: 12px; color: var(--muted); margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
  .breadcrumb a { color: var(--muted); text-decoration: none; transition: color 0.15s; }
  .breadcrumb a:hover { color: var(--pri); }
  .breadcrumb .sep { opacity: 0.5; }
  .breadcrumb .current { color: var(--pri); font-weight: 700; }
  .school-head { background: linear-gradient(145deg, var(--pri-deep), var(--pri), var(--pri-light)); border-radius: 28px; padding: 48px 44px; margin-bottom: 32px; color: var(--text-on); box-shadow: var(--panel-shadow); position: relative; overflow: hidden; }
  .school-head::before { content: ''; position: absolute; top: -100px; right: -60px; width: 400px; height: 400px; background: radial-gradient(circle, rgba(255,212,77,0.28), transparent 60%); }
  .school-head::after { content: ''; position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 22px 22px; opacity: 0.3; pointer-events: none; }
  .school-head > * { position: relative; z-index: 1; }
  .school-head .code { font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.25em; color: var(--gold); margin-bottom: 8px; }
  .school-head h1 { font-family: 'Playfair Display', 'Noto Sans SC', sans-serif; font-size: 44px; font-weight: 900; letter-spacing: -0.03em; line-height: 1.1; }
  .school-head .name-en { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 600; opacity: 0.85; margin-top: 6px; }
  .school-head .sub { margin-top: 20px; font-size: 14px; opacity: 0.9; max-width: 720px; line-height: 1.75; }
  .school-head .stats { display: flex; gap: 32px; margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.25); flex-wrap: wrap; }
  .school-head .stat .n { font-family: 'Space Grotesk', 'Noto Sans SC', sans-serif; font-size: 34px; font-weight: 700; color: var(--gold); line-height: 1; letter-spacing: -0.04em; }
  .school-head .stat .l { font-size: 10px; opacity: 0.75; margin-top: 6px; letter-spacing: 0.15em; font-family: 'Space Grotesk', sans-serif; font-weight: 600; }
  .section-label { font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 700; color: var(--muted); letter-spacing: 0.2em; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
  .section-label::after { content: ''; flex: 1; height: 1px; background: var(--border-soft); }
  .timeline { display: flex; flex-direction: column; gap: 16px; }
  .item { background: rgba(255,255,255,0.92); backdrop-filter: blur(14px); border: 1px solid var(--border-soft); border-radius: 20px; padding: 22px 24px; display: grid; grid-template-columns: auto 1fr auto; gap: 22px; align-items: center; box-shadow: 0 6px 20px rgba(76,29,149,0.06); transition: all 0.2s ease; }
  .item:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(76,29,149,0.14); border-color: var(--pri); }
  .item-date { font-family: 'Space Grotesk', sans-serif; padding: 14px 18px; border-radius: 14px; background: linear-gradient(145deg, var(--pri), var(--pri-light)); color: var(--text-on); text-align: center; min-width: 82px; }
  .item-date .m { font-size: 11px; font-weight: 600; letter-spacing: 0.15em; color: var(--gold); }
  .item-date .d { font-size: 28px; font-weight: 700; line-height: 1; margin: 2px 0; }
  .item-date .y { font-size: 10px; opacity: 0.75; font-weight: 600; }
  .item-content { min-width: 0; }
  .item-title { font-family: 'Playfair Display', 'Noto Sans SC', sans-serif; font-size: 19px; font-weight: 900; line-height: 1.3; letter-spacing: -0.01em; color: var(--ink); margin-bottom: 6px; }
  .item-brief { font-size: 13px; color: var(--muted); line-height: 1.7; }
  .item-tags { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
  .item-tags span { font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 999px; background: rgba(124,58,237,0.08); color: var(--pri); letter-spacing: 0.05em; }
  .item-links { display: flex; flex-direction: column; gap: 6px; }
  .item-links a { font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 700; padding: 8px 16px; min-width: 110px; border-radius: 10px; text-decoration: none; border: 1px solid var(--border-soft); color: var(--ink); text-align: center; transition: all 0.15s; letter-spacing: 0.03em; }
  .item-links a:hover { border-color: var(--pri); color: var(--pri); transform: translateX(2px); }
  .item-links a.primary { background: linear-gradient(135deg, var(--pri), var(--pri-light)); color: var(--text-on); border-color: transparent; box-shadow: 0 4px 14px rgba(76,29,149,0.25); }
  .item-links a.primary:hover { box-shadow: 0 8px 22px rgba(76,29,149,0.35); color: var(--text-on); }
  .empty { padding: 60px 30px; text-align: center; background: rgba(255,255,255,0.6); border: 1px dashed var(--border-soft); border-radius: 20px; color: var(--muted); }
  .empty .emj { font-size: 40px; margin-bottom: 10px; }
  .empty h3 { color: var(--ink); font-weight: 900; font-size: 18px; margin-bottom: 10px; font-family: 'Playfair Display', 'Noto Sans SC', sans-serif; }
  .empty p { font-size: 13px; line-height: 1.8; max-width: 520px; margin: 0 auto; }
  .empty code { background: rgba(124,58,237,0.08); color: var(--pri); padding: 3px 9px; border-radius: 5px; font-family: 'Space Grotesk', monospace; font-size: 12px; }
  .footer { margin-top: 60px; padding-top: 24px; border-top: 1px solid var(--border-soft); font-size: 12px; color: var(--muted); text-align: center; }
  .footer code { background: rgba(255,255,255,0.8); padding: 2px 8px; border-radius: 4px; font-family: 'Space Grotesk', monospace; }
  @media (max-width: 700px) {
    body { padding: 24px 14px 60px; }
    .school-head { padding: 32px 24px; }
    .school-head h1 { font-size: 28px; }
    .school-head .name-en { font-size: 14px; }
    .school-head .stats { gap: 20px; }
    .school-head .stat .n { font-size: 26px; }
    .item { grid-template-columns: 1fr; gap: 14px; padding: 18px 20px; }
    .item-date { align-self: flex-start; display: inline-flex; gap: 10px; align-items: baseline; padding: 8px 14px; min-width: 0; }
    .item-date .m { font-size: 10px; }
    .item-date .d { font-size: 20px; margin: 0; }
    .item-date .y { font-size: 10px; }
    .item-title { font-size: 17px; }
    .item-links { flex-direction: row; flex-wrap: wrap; }
    .item-links a { min-width: 0; flex: 1; padding: 10px 12px; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="breadcrumb">
    <a href="../">← 素材库</a>
    <span class="sep">/</span>
    <span class="current">${brand.code} ${brand.nameCn}</span>
  </div>
  <div class="school-head">
    <div class="code">${brand.nameEn.toUpperCase()}</div>
    <h1>${brand.nameCn}</h1>
    <div class="name-en">${brand.nameEn} · ${brand.city}</div>
    <div class="sub">每日更新：奖学金 / 科研合作 / 招生政策 / 项目开放。点进任意日期看公众号发稿页 + 小红书素材。</div>
    <div class="stats">
      <div class="stat"><div class="n">${itemCount}</div><div class="l">ITEMS</div></div>
      <div class="stat"><div class="n">${latestLabel}</div><div class="l">LATEST</div></div>
      <div class="stat"><div class="n">2</div><div class="l">CHANNELS</div></div>
    </div>
  </div>
  <div class="section-label">${itemCount > 0 ? '最新内容（按日期倒序）' : '等待首条内容'}</div>
  <div class="timeline" id="timeline">
${timeline}
  </div>
  <div class="footer">
    👉 跑 <code>/uni-news-poster [date] ${school}</code> 产新内容 · schedule 自动跑见 <code>scripts/rebuild-uni-hub.mjs</code>
  </div>
</div>
</body>
</html>
`;
}

function renderIndexPage(perSchool) {
	const totalItems = perSchool.reduce((s, x) => s + x.itemCount, 0);
	const cards = SCHOOLS.map(school => {
		const brand = UNI_BRAND[school];
		const data = perSchool.find(x => x.school === school);
		const count = data?.itemCount ?? 0;
		const latest = data?.latest;
		const latestBadge = latest ? `<div class="school-latest">${latest.slice(5, 7)}-${latest.slice(8, 10)} · 最新</div>` : '';
		const zeroClass = count === 0 ? ' zero' : '';
		return `    <a class="school-card" href="./schools/${school}.html">
      <div class="school-cover" data-school="${school}" style="background: linear-gradient(145deg, ${brand.deep}, ${brand.primary}, ${brand.light});">
        ${latestBadge}
        <div class="school-code">${brand.code}</div>
        <div class="school-emblem-big">${brand.emblem}</div>
      </div>
      <div class="school-body">
        <div class="school-name">${brand.nameCn}</div>
        <div class="school-name-en">${brand.nameEn}</div>
        <div class="school-count">
          <div><span class="n${zeroClass}">${count}</span> <span class="l">ITEM${count === 1 ? '' : 'S'}</span></div>
          <div class="arrow">→</div>
        </div>
      </div>
    </a>`;
	}).join('\n\n');

	return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>大学新闻社交素材库 · Hub</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;800;900&family=Space+Grotesk:wght@500;700&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap" rel="stylesheet">
<style>
  :root { --ink: #160a2c; --bg: #f6f1ff; --muted: #71628a; --border-soft: rgba(106,72,170,0.12); --panel-shadow: 0 20px 60px rgba(53,18,102,0.1); }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: radial-gradient(circle at top left, rgba(124,58,237,0.1), transparent 30%), radial-gradient(circle at top right, rgba(255,93,177,0.08), transparent 25%), var(--bg); color: var(--ink); font-family: 'Noto Sans SC', system-ui, sans-serif; padding: 40px 20px 80px; line-height: 1.65; }
  .page { max-width: 1280px; margin: 0 auto; }
  .hero { background: linear-gradient(135deg, #4c1d95 0%, #7c3aed 60%, #ff5db1 140%); border-radius: 28px; padding: 48px 44px; margin-bottom: 40px; color: #fff; box-shadow: var(--panel-shadow); position: relative; overflow: hidden; }
  .hero::before { content: ''; position: absolute; top: -120px; right: -80px; width: 420px; height: 420px; background: radial-gradient(circle, rgba(255,212,77,0.3), transparent 60%); }
  .hero > * { position: relative; }
  .hero h1 { font-family: 'Playfair Display', 'Noto Sans SC', sans-serif; font-size: 40px; font-weight: 900; letter-spacing: -0.03em; margin-bottom: 12px; }
  .hero h1 em { color: #ffd44d; font-style: italic; }
  .hero .sub { font-size: 15px; color: rgba(255,255,255,0.88); max-width: 780px; line-height: 1.75; }
  .hero .sub code { background: rgba(255,255,255,0.18); padding: 3px 9px; border-radius: 5px; font-family: 'Space Grotesk', monospace; font-size: 13px; }
  .hero .stats { display: flex; gap: 32px; margin-top: 28px; padding-top: 26px; border-top: 1px solid rgba(255,255,255,0.25); flex-wrap: wrap; }
  .hero .stat .n { font-family: 'Space Grotesk', 'Noto Sans SC', sans-serif; font-size: 40px; font-weight: 700; color: #ffd44d; line-height: 1; letter-spacing: -0.04em; }
  .hero .stat .l { font-size: 11px; color: rgba(255,255,255,0.72); margin-top: 6px; letter-spacing: 0.15em; font-family: 'Space Grotesk', sans-serif; font-weight: 600; }
  .events-banner { display: flex; align-items: center; justify-content: space-between; gap: 20px; background: linear-gradient(135deg, #ff5757, #ff8a3d 50%, #ffd44d); border-radius: 22px; padding: 28px 32px; margin-bottom: 36px; color: #fff; text-decoration: none; box-shadow: 0 12px 40px rgba(255,87,87,0.22); transition: all 0.2s ease; position: relative; overflow: hidden; }
  .events-banner::before { content: ''; position: absolute; top: -80px; right: -60px; width: 280px; height: 280px; background: radial-gradient(circle, rgba(255,255,255,0.3), transparent 60%); }
  .events-banner > * { position: relative; }
  .events-banner:hover { transform: translateY(-2px); box-shadow: 0 16px 50px rgba(255,87,87,0.32); }
  .eb-tag { font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; opacity: 0.92; margin-bottom: 6px; }
  .eb-title { font-family: 'Playfair Display', 'Noto Sans SC', sans-serif; font-size: 24px; font-weight: 900; letter-spacing: -0.02em; margin-bottom: 4px; }
  .eb-desc { font-size: 13px; opacity: 0.92; }
  .eb-cta { font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 700; padding: 10px 18px; border-radius: 10px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); }
  .section-label { font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 700; color: var(--muted); letter-spacing: 0.2em; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
  .section-label::after { content: ''; flex: 1; height: 1px; background: var(--border-soft); }
  .school-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
  .school-card { background: #fff; border-radius: 22px; overflow: hidden; text-decoration: none; color: inherit; box-shadow: 0 8px 28px rgba(76,29,149,0.08); transition: all 0.2s ease; border: 1px solid var(--border-soft); }
  .school-card:hover { transform: translateY(-4px); box-shadow: 0 16px 46px rgba(76,29,149,0.16); }
  .school-cover { padding: 24px; min-height: 140px; color: #fff; position: relative; overflow: hidden; }
  .school-cover::after { content: ''; position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 18px 18px; opacity: 0.4; pointer-events: none; }
  .school-cover > * { position: relative; z-index: 1; }
  .school-latest { position: absolute; top: 14px; right: 14px; font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 999px; background: rgba(255,255,255,0.22); border: 1px solid rgba(255,255,255,0.35); letter-spacing: 0.1em; }
  .school-code { font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.25em; opacity: 0.8; margin-bottom: 6px; }
  .school-emblem-big { font-family: 'Playfair Display', sans-serif; font-size: 60px; font-weight: 900; line-height: 1; letter-spacing: -0.03em; }
  .school-body { padding: 18px 22px 22px; }
  .school-name { font-family: 'Playfair Display', 'Noto Sans SC', sans-serif; font-size: 19px; font-weight: 900; line-height: 1.2; }
  .school-name-en { font-family: 'Space Grotesk', sans-serif; font-size: 12px; color: var(--muted); margin-top: 4px; margin-bottom: 16px; }
  .school-count { display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 1px solid var(--border-soft); }
  .school-count .n { font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 700; color: var(--ink); }
  .school-count .n.zero { color: var(--muted); }
  .school-count .l { font-size: 10px; color: var(--muted); letter-spacing: 0.15em; font-family: 'Space Grotesk', sans-serif; font-weight: 600; }
  .school-count .arrow { font-size: 18px; color: var(--muted); transition: transform 0.2s; }
  .school-card:hover .school-count .arrow { transform: translateX(4px); }
  .footer { margin-top: 60px; padding-top: 24px; border-top: 1px solid var(--border-soft); font-size: 12px; color: var(--muted); text-align: center; }
  .footer code { background: rgba(255,255,255,0.8); padding: 2px 8px; border-radius: 4px; font-family: 'Space Grotesk', monospace; }
  @media (max-width: 700px) { body { padding: 24px 14px 60px; } .hero { padding: 32px 24px; } .hero h1 { font-size: 28px; } .school-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; } .school-emblem-big { font-size: 42px; } }
</style>
</head>
<body>
<div class="page">
  <div class="hero">
    <h1>大学新闻 <em>社交素材库</em></h1>
    <div class="sub">
      澳洲 10 所大学的小红书 + 公众号素材包。选一所学校进入查看该校所有日期的内容。<br>
      上游新闻 md 在 <code>src/content/universities/{school}/news-{date}.md</code>，<code>/uni-news-poster</code> 自动产出每校的 mp-article / xhs-drafts / xhs-covers。
    </div>
    <div class="stats">
      <div class="stat"><div class="n">${totalItems}</div><div class="l">ITEMS</div></div>
      <div class="stat"><div class="n">10</div><div class="l">SCHOOLS</div></div>
      <div class="stat"><div class="n">2</div><div class="l">CHANNELS</div></div>
    </div>
  </div>
  <a class="events-banner" href="./events/">
    <div class="events-banner-left">
      <div class="eb-tag">📅 EVENTS · 每日自动更新</div>
      <div class="eb-title">校园活动 · 每日 4 校</div>
      <div class="eb-desc">🟦 UMelb · 🟨 UNSW · 🟪 UQ · 🟥 USYD 四校每日活动（讲座 / networking / 免费活动）→ 小红书草稿</div>
    </div>
    <div class="events-banner-right">
      <span class="eb-cta">进入 →</span>
    </div>
  </a>
  <div class="section-label">按学校浏览 · 大学新闻</div>
  <div class="school-grid">
${cards}
  </div>
  <div class="footer">
    由 <code>/uni-news-poster [date] [school]</code> 自动产出 · hub 由 <code>scripts/rebuild-uni-hub.mjs</code> 重建 · 详见 <code>jr-wiki/docs/UNI_NEWS_AUTOMATION_PRD.md</code>
  </div>
</div>
</body>
</html>
`;
}

function main() {
	if (!fs.existsSync(SCHOOLS_DIR)) fs.mkdirSync(SCHOOLS_DIR, { recursive: true });
	const perSchool = [];
	for (const school of SCHOOLS) {
		const items = scanSchool(school);
		const html = renderSchoolPage(school);
		fs.writeFileSync(path.join(SCHOOLS_DIR, `${school}.html`), html);
		perSchool.push({ school, itemCount: items.length, latest: items[0]?.date });
		console.log(`✓ schools/${school}.html — ${items.length} items${items[0]?.date ? ` (latest ${items[0].date})` : ''}`);
	}
	const indexHtml = renderIndexPage(perSchool);
	fs.writeFileSync(path.join(HUB_DIR, 'index.html'), indexHtml);
	const total = perSchool.reduce((s, x) => s + x.itemCount, 0);
	console.log(`✓ index.html — ${total} total items across ${SCHOOLS.length} schools`);
}

main();
