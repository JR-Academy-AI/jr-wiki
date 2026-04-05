/**
 * jr-wiki → 官网全自动同步
 *
 * 做 3 件事:
 *   1. books → 自动生成 staticWikis/jrWiki.ts + 复制 markdown 到 public/wiki/
 *   2. articles → posts 集合 (metadata + contentUrl，正文从静态文件实时读)
 *   3. stories → testimonials 集合 (metadata)
 *
 * 用法:
 *   bun run sync                                      # 同步全部
 *   API_URL=https://api.jiangren.com.au bun run sync  # 同步到 prod
 *
 * 不带 ADMIN_TOKEN 时只同步 books（不需要 token），跳过 DB 操作。
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';

const DIST = './dist';
const API_URL = process.env.API_URL || 'http://localhost:3010';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

// 官网项目路径
const WEB_ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..', 'jr-academy-web-zh');
const WEB_PUBLIC_WIKI = join(WEB_ROOT, 'public', 'wiki');
const WEB_STATIC_WIKI_CONFIG = join(WEB_ROOT, 'src', 'config', 'staticWikis', 'jrWiki.ts');

// ─── Read manifest ───

const manifestPath = join(DIST, 'manifest.json');
if (!existsSync(manifestPath)) {
	console.error('❌ dist/manifest.json not found. Run `bun run build` first.');
	process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

// ─── Helper ───

function stripFrontmatter(raw: string): string {
	const match = raw.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)/);
	return match ? match[1].trim() : raw.trim();
}

// ═══════════════════════════════════════════════
// 1. Books → 静态 Wiki (自动生成 config + 复制 md)
// ═══════════════════════════════════════════════

function syncBooksToStaticWiki() {
	const books = manifest.books || [];
	if (books.length === 0) {
		// 写空 config
		writeFileSync(WEB_STATIC_WIKI_CONFIG, `/**
 * 自动生成 — 不要手动编辑！
 * 由 jr-wiki/sync-to-db.ts 从 manifest.json 自动生成
 */
import type { StaticWikiConfig } from './types';

export const jrWikiWikis: Record<string, StaticWikiConfig> = {};
`, 'utf-8');
		console.log('⏭️  No books to sync');
		return;
	}

	console.log(`📚 Syncing ${books.length} books to static wiki...`);

	// 复制每本书的 markdown 到 public/wiki/
	for (const book of books) {
		const targetDir = join(WEB_PUBLIC_WIKI, book.slug, 'chapters');
		mkdirSync(targetDir, { recursive: true });

		for (const chapter of book.chapters || []) {
			const srcPath = join(DIST, chapter.contentUrl.replace('/learn-wiki/', ''));
			if (!existsSync(srcPath)) continue;

			const raw = readFileSync(srcPath, 'utf-8');
			const body = stripFrontmatter(raw);
			writeFileSync(join(targetDir, `${chapter.slug}.md`), body, 'utf-8');
		}

		console.log(`  📖 ${book.slug}: ${book.chapters?.length || 0} chapters`);
	}

	// 自动生成 jrWiki.ts
	const entries: string[] = [];

	for (const book of books) {
		const pages = (book.chapters || []).map((ch: any) =>
			`\t\t\t\t{ slug: '${ch.slug}', title: '${esc(ch.title)}', file: 'chapters/${ch.slug}.md' }`
		).join(',\n');

		entries.push(`\t'${book.slug}': {
		slug: '${book.slug}',
		title: '${esc(book.title)}',
		description: '${esc(book.description || '')}',
		type: 'study' as const,
		tags: [${(book.tags || []).map((t: string) => `'${t}'`).join(', ')}],
		sections: [
			{
				slug: 'chapters',
				name: '${esc(book.title)}',
				pages: [
${pages}
				]
			}
		],
		meta: {
			title: '${esc(book.title)} | 匠人学院',
			description: '${esc(book.description || '')}',
			keywords: '${(book.tags || []).join(', ')}'
		}
	}`);
	}

	const config = `/**
 * 自动生成 — 不要手动编辑！
 * 由 jr-wiki/sync-to-db.ts 从 manifest.json 自动生成
 * 生成时间: ${new Date().toISOString()}
 */
import type { StaticWikiConfig } from './types';

export const jrWikiWikis: Record<string, StaticWikiConfig> = {
${entries.join(',\n')}
};
`;

	writeFileSync(WEB_STATIC_WIKI_CONFIG, config, 'utf-8');
	console.log(`  ✅ Generated jrWiki.ts (${books.length} books)`);
}

function esc(s: string): string {
	return s.replace(/'/g, "\\'").replace(/\n/g, ' ');
}

// ═══════════════════════════════════════════════
// 2. Articles → MongoDB posts (metadata only)
// ═══════════════════════════════════════════════

function prepareArticles() {
	const articles: any[] = [];

	for (const article of manifest.articles || []) {
		articles.push({
			slug: article.slug,
			title: article.title,
			description: article.description || '',
			publishDate: article.publishDate || undefined,
			tags: article.tags || [],
			author: article.author || 'JR Academy',
			contentUrl: article.contentUrl // e.g. src/content/articles/cursor-tips.md
		});
	}

	return articles;
}

// ═══════════════════════════════════════════════
// 3. Stories → MongoDB testimonials
// ═══════════════════════════════════════════════

function prepareStories() {
	return (manifest.stories || []).map((story: any) => ({
		slug: story.slug,
		name: story.name,
		title: story.title,
		description: story.description || '',
		role: story.role || '',
		company: story.company || '',
		course: story.course || '',
		highlight: story.highlight || ''
	}));
}

// ═══════════════════════════════════════════════
// API helper
// ═══════════════════════════════════════════════

async function syncEndpoint(endpoint: string, body: Record<string, any>, label: string) {
	const url = `${API_URL}/admin-cms/${endpoint}`;
	console.log(`📤 ${label} → ${url}`);

	const res = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${ADMIN_TOKEN}`
		},
		body: JSON.stringify(body)
	});

	if (!res.ok) {
		console.error(`❌ ${label}: ${res.status} ${res.statusText}`);
		console.error(await res.text());
		return;
	}

	const result = await res.json();
	console.log(`✅ ${label}: ${result.created} created, ${result.updated} updated`);
	if (result.errors?.length) {
		result.errors.forEach((e: string) => console.warn(`  ⚠️ ${e}`));
	}
}

// ═══════════════════════════════════════════════
// Run
// ═══════════════════════════════════════════════

// Step 1: Books → static wiki (always, no token needed)
syncBooksToStaticWiki();

// Step 2 & 3: Articles + Stories → DB (needs token)
if (ADMIN_TOKEN) {
	const articles = prepareArticles();
	const stories = prepareStories();

	const tasks: Promise<any>[] = [];
	if (articles.length > 0) tasks.push(syncEndpoint('posts/sync/jr-wiki', { articles }, `${articles.length} posts`));
	if (stories.length > 0) tasks.push(syncEndpoint('testimonials/sync/jr-wiki', { stories }, `${stories.length} stories`));

	if (tasks.length > 0) await Promise.all(tasks);
} else {
	console.log('\n💡 No ADMIN_TOKEN — only synced static wiki. Set ADMIN_TOKEN to also sync articles/stories to DB.');
}

console.log('\n🏁 Done.');
