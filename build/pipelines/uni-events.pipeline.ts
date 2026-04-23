/**
 * Uni Events pipeline
 *
 * 读 src/data/uni-events/{DATE}.json → 生成
 *   src/static/uni-news-social/events/{DATE}.html
 *
 * 6 校固定池：umelb / unsw / uq / usyd / adelaide / monash。
 * 某校当周无活动 → 该校 card 显示 placeholder。
 *
 * covers.html (小红书封面) 不在本 pipeline 范围，由 _runtime lib 或单独 cron 产出。
 *
 * 用法：
 *   bun build/pipelines/uni-events.pipeline.ts 2026-04-23
 *   bun build/pipelines/uni-events.pipeline.ts                  # 全量
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
const DATA_DIR = join(REPO_ROOT, 'src/data/uni-events');
const BRAND_JSON = join(REPO_ROOT, 'src/data/uni-brand.v1.json');
const TEMPLATE_EVENTS = join(REPO_ROOT, 'src/templates/uni-events/events.template.html');
const OUTPUT_BASE = join(REPO_ROOT, 'src/static/uni-news-social/events');

interface BrandEntry {
	primary: string;
	deep: string;
	nameCn: string;
	nameEn: string;
	code: string;
}
interface BrandFile { brands: Record<string, BrandEntry>; }

interface EventItem {
	title: string;
	time: string;
	location: string;
	price?: string;
	category?: string;
	url?: string;
}
interface SchoolEvents {
	code: string;
	events: EventItem[];
	xhsDraft?: { title: string; body: string; tags: string[] };
}
interface UniEventsData {
	schemaVersion?: string;
	date: string;
	intro?: string;
	schools: SchoolEvents[];
}

function validate(data: unknown, file: string): asserts data is UniEventsData {
	if (!data || typeof data !== 'object') throw new Error(`${file}: not a JSON object`);
	const d = data as Record<string, unknown>;
	if (typeof d.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) {
		throw new Error(`${file}: invalid date`);
	}
	if (!Array.isArray(d.schools) || d.schools.length !== 6) {
		throw new Error(`${file}: schools must have exactly 6 entries`);
	}
}

function renderEvent(e: EventItem): string {
	const price = e.price || 'Free';
	const priceClass = price.toLowerCase() === 'free' ? '' : 'paid';
	const categoryChip = e.category ? `<span>${htmlEscape(e.category)}</span>` : '';
	const titleHtml = e.url
		? `<a href="${htmlEscape(e.url)}">${htmlEscape(e.title)}</a>`
		: htmlEscape(e.title);
	return `
        <div class="event">
          <div class="event-title">${titleHtml}</div>
          <div class="event-meta">
            <span>📅 ${htmlEscape(e.time)}</span>
            <span>📍 ${htmlEscape(e.location)}</span>
            <span class="price ${priceClass}">${htmlEscape(price)}</span>
            ${categoryChip}
          </div>
        </div>`;
}

function renderSchoolCard(school: SchoolEvents, brand: BrandEntry): string {
	const eventsHtml = school.events.length === 0
		? `<div class="no-events">本周无公开活动，下周见 🌱</div>`
		: `<div class="event-list">${school.events.map(renderEvent).join('')}</div>`;

	const draftHtml = school.xhsDraft ? `
      <div class="xhs-draft">
        <h4>📱 小红书草稿</h4>
        <div class="title">${htmlEscape(school.xhsDraft.title)}</div>
        <div class="body">${htmlEscape(school.xhsDraft.body)}</div>
        <div class="tags">${school.xhsDraft.tags.map(t => htmlEscape(t)).join(' ')}</div>
      </div>` : '';

	const coverBg = `background: linear-gradient(135deg, ${brand.primary}, ${brand.deep});`;

	return `
    <article class="school">
      <header class="school-cover" style="${coverBg}">
        <div class="code">${htmlEscape(brand.code)}</div>
        <h2>${htmlEscape(brand.nameEn)}</h2>
        <div class="name-cn">${htmlEscape(brand.nameCn)}</div>
      </header>
      <div class="school-body">
        <h3>This Week's Events</h3>
        ${eventsHtml}
        ${draftHtml}
      </div>
    </article>`;
}

interface BuildResult {
	date: string;
	outputPath: string;
	bytes: number;
	eventCount: number;
	schoolsWithEvents: number;
}

function buildOne(dataFile: string, brandFile: BrandFile, force: boolean): BuildResult {
	const dataPath = join(DATA_DIR, dataFile);
	const data = loadJson<UniEventsData>(dataPath);
	validate(data, dataFile);

	const cards = data.schools.map(s => {
		const brand = brandFile.brands[s.code];
		if (!brand) throw new Error(`unknown school: ${s.code}`);
		return renderSchoolCard(s, brand);
	}).join('\n');

	const eventCount = data.schools.reduce((sum, s) => sum + s.events.length, 0);
	const schoolsWithEvents = data.schools.filter(s => s.events.length > 0).length;

	const template = loadTemplate(TEMPLATE_EVENTS);
	const introHtml = data.intro ? `<div class="intro">${htmlEscape(data.intro)}</div>` : '';
	const output = renderTemplate(template, {
		DATE: data.date,
		SCHOOL_CARDS: cards,
		STAT_EVENTS: String(eventCount),
		INTRO_HTML: introHtml,
	});

	const outputPath = join(OUTPUT_BASE, `${data.date}.html`);
	let skipped = false;
	if (canWriteOrSkip(outputPath, force) === 'write') {
		writeWithMarker(outputPath, output, 'uni-events');
	} else {
		skipped = true;
	}

	return {
		date: data.date,
		outputPath: skipped ? `${outputPath} (skipped)` : outputPath,
		bytes: skipped ? 0 : Buffer.byteLength(output, 'utf8'),
		eventCount,
		schoolsWithEvents,
	};
}

export function buildAll(targetDate?: string, force = false): void {
	if (!existsSync(DATA_DIR)) {
		console.warn(`[uni-events] data dir missing: ${DATA_DIR}`);
		return;
	}
	const brandFile = loadJson<BrandFile>(BRAND_JSON);
	const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.json') && !f.startsWith('_'));
	const toBuild = targetDate ? files.filter(f => f === `${targetDate}.json`) : files;
	if (toBuild.length === 0) {
		console.warn(`[uni-events] no data${targetDate ? ` for ${targetDate}` : ''}`);
		return;
	}

	const results: BuildResult[] = [];
	const failures: Array<{ file: string; error: string }> = [];

	for (const file of toBuild) {
		try {
			const r = buildOne(file, brandFile, force);
			results.push(r);
			console.log(`[uni-events] ✓ ${r.date} · ${r.eventCount} events across ${r.schoolsWithEvents}/6 schools (${(r.bytes / 1024).toFixed(1)} KB)`);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			failures.push({ file, error: msg });
			console.error(`[uni-events] ✗ ${file}: ${msg}`);
		}
	}

	console.log(`\n[uni-events] built ${results.length} / ${toBuild.length}`);
	if (failures.length > 0) {
		console.error(`[uni-events] ${failures.length} failure(s):`);
		for (const f of failures) console.error(`  - ${f.file}: ${f.error}`);
		process.exit(1);
	}
}

if (import.meta.main) {
	const args = process.argv.slice(2);
	const force = args.includes('--force');
	const target = args.find(a => !a.startsWith('--'));
	buildAll(target, force);
}
