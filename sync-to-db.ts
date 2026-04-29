/**
 * jr-wiki → MongoDB 同步
 *
 * 所有内容都走数据库，官网前端零改动：
 *   - articles → posts 集合 → /blog/xxx
 *   - book chapters → posts 集合 → /blog/xxx（每章一篇）
 *   - stories → testimonials 集合 → 首页
 *
 * 正文不进 DB，后端 API 实时从 GitHub raw URL 读取。
 *
 * 用法:
 *   ADMIN_TOKEN=xxx bun run sync
 *   ADMIN_TOKEN=xxx API_URL=https://api.jiangren.com.au bun run sync
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DIST = './dist';
const API_URL = process.env.API_URL || 'http://localhost:3010';
// Prefer JR_SERVICE_API_KEY (long-lived service-account, jrak_xxx), fall back
// to ADMIN_TOKEN (legacy 30-day admin JWT, deprecated).
const ADMIN_TOKEN = process.env.JR_SERVICE_API_KEY || process.env.ADMIN_TOKEN || '';

if (!ADMIN_TOKEN) {
	console.error('::error::JR_SERVICE_API_KEY (preferred) or ADMIN_TOKEN env var is required.');
	process.exit(1);
}

// Diagnostic: which auth path is the runtime actually taking? Prints prefix only,
// never the full secret. Lets workflow logs answer "did the JR_SERVICE_API_KEY
// secret actually get added to the repo?" without guesswork.
const authMode = process.env.JR_SERVICE_API_KEY
	? `service-api-key (${ADMIN_TOKEN.slice(0, 8)}…, len=${ADMIN_TOKEN.length})`
	: `legacy-admin-jwt (${ADMIN_TOKEN.slice(0, 6)}…, len=${ADMIN_TOKEN.length})`;
console.log(`🔑 Auth mode: ${authMode}`);
if (!ADMIN_TOKEN.startsWith('jrak_')) {
	console.warn(
		'::warning::Sync is NOT using a jrak_ service API key. ' +
			'Either JR_SERVICE_API_KEY secret is missing in GitHub repo settings, ' +
			'or it holds a value that doesn\'t start with jrak_.'
	);
}

const manifestPath = join(DIST, 'manifest.json');
if (!existsSync(manifestPath)) {
	console.error('❌ dist/manifest.json not found. Run `bun run build` first.');
	process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

// ─── Prepare posts (articles + book chapters) ───

function preparePosts() {
	const posts: any[] = [];

	// Articles
	for (const article of manifest.articles || []) {
		posts.push({
			slug: article.slug,
			title: article.title,
			description: article.description || '',
			publishDate: article.publishDate || undefined,
			tags: article.tags || [],
			author: article.author || 'JR Academy',
			contentUrl: article.contentUrl
		});
	}

	// Book chapters — each chapter is a post
	for (const book of manifest.books || []) {
		for (const chapter of book.chapters || []) {
			posts.push({
				slug: `${book.slug}-${chapter.slug}`,
				title: `${book.title} — ${chapter.title}`,
				description: chapter.description || book.description || '',
				tags: book.tags || [],
				author: 'JR Academy',
				contentUrl: chapter.contentUrl
			});
		}
	}

	return posts;
}

// ─── Prepare wikis (books with chapters) ───

function prepareWikis() {
	return (manifest.books || []).map((book: any) => ({
		slug: book.slug,
		title: book.title,
		description: book.description || '',
		tags: book.tags || [],
		chapters: (book.chapters || []).map((ch: any) => ({
			slug: ch.slug,
			title: ch.title,
			order: ch.order || 0,
			contentUrl: ch.contentUrl
		}))
	}));
}

// ─── Prepare stories ───

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

// ─── API helper ───

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
		const body = await res.text();
		console.error(`::error::${label} HTTP ${res.status} ${res.statusText} url=${url}`);
		console.error(body.slice(0, 800));
		// Was: silently `return`. That hid a 30-day token expiry from everyone, so jr-wiki
		// articles silently stopped syncing to MongoDB. Throw so the workflow fails loudly.
		throw new Error(`${label} sync failed: ${res.status} ${res.statusText}`);
	}

	const result = await res.json();
	console.log(`✅ ${label}: ${result.created} created, ${result.updated} updated`);
	if (result.errors?.length) {
		result.errors.forEach((e: string) => console.warn(`  ⚠️ ${e}`));
	}
}

// ─── Run ───

const posts = preparePosts();
const wikis = prepareWikis();
const stories = prepareStories();

const tasks: Promise<any>[] = [];
if (posts.length > 0) tasks.push(syncEndpoint('posts/sync/jr-wiki', { articles: posts }, `${posts.length} posts`));
if (wikis.length > 0) tasks.push(syncEndpoint('wikis/sync/jr-wiki', { wikis }, `${wikis.length} wikis`));
if (stories.length > 0) tasks.push(syncEndpoint('testimonials/sync/jr-wiki', { stories }, `${stories.length} stories`));

await Promise.all(tasks);

console.log('\n🏁 Done.');
