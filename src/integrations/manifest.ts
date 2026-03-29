import type { AstroIntegration } from 'astro';
import { writeFileSync, readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { parse as parseYaml } from './yaml-parser.js';

export default function manifestIntegration(): AstroIntegration {
	return {
		name: 'jr-wiki-manifest',
		hooks: {
			'astro:build:done': async ({ dir }) => {
				const rootDir = resolve(process.cwd());
				const wikiDir = join(rootDir, 'src/content/wiki');
				const articlesDir = join(rootDir, 'src/content/articles');
				const helpDir = join(rootDir, 'src/content/help');
				const storiesDir = join(rootDir, 'src/content/stories');

				// Books
				const books: any[] = [];
				const bookFolders = readdirSync(wikiDir).filter((f) => statSync(join(wikiDir, f)).isDirectory());
				for (const folder of bookFolders) {
					let meta: any = {};
					try { meta = parseYaml(readFileSync(join(wikiDir, folder, '_meta.yaml'), 'utf-8')); } catch { continue; }
					const chapters: any[] = [];
					for (const file of readdirSync(join(wikiDir, folder)).filter((f) => f.endsWith('.md')).sort()) {
						const fm = extractFrontmatter(readFileSync(join(wikiDir, folder, file), 'utf-8'));
						if (fm.title) {
							const slug = file.replace('.md', '');
							chapters.push({ slug, title: fm.title, description: fm.description || null, order: fm.order || 0, url: `/learn-wiki/${folder}/${slug}/` });
						}
					}
					chapters.sort((a, b) => a.order - b.order);
					books.push({ slug: folder, title: meta.title, description: meta.description, tags: meta.tags || [], order: meta.order || 0, chapterCount: chapters.length, chapters, url: `/learn-wiki/${folder}/` });
				}
				books.sort((a, b) => a.order - b.order);

				// Articles
				const articles: any[] = [];
				if (existsSync(articlesDir)) {
					for (const file of readdirSync(articlesDir).filter((f) => f.endsWith('.md'))) {
						const fm = extractFrontmatter(readFileSync(join(articlesDir, file), 'utf-8'));
						const slug = file.replace('.md', '');
						articles.push({ slug, title: fm.title, description: fm.description || null, publishDate: fm.publishDate || null, tags: fm.tags || [], author: fm.author || 'JR Academy', url: `/learn-wiki/articles/${slug}/` });
					}
					articles.sort((a, b) => { if (!a.publishDate || !b.publishDate) return 0; return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime(); });
				}

				// Help
				const helpItems: any[] = [];
				if (existsSync(helpDir)) {
					for (const file of readdirSync(helpDir).filter((f) => f.endsWith('.md'))) {
						const fm = extractFrontmatter(readFileSync(join(helpDir, file), 'utf-8'));
						const slug = file.replace('.md', '');
						helpItems.push({ slug, title: fm.title, description: fm.description || null, category: fm.category || null, order: fm.order || 0, url: `/learn-wiki/help/${slug}/` });
					}
					helpItems.sort((a, b) => a.order - b.order);
				}

				// Stories
				const storyItems: any[] = [];
				if (existsSync(storiesDir)) {
					for (const file of readdirSync(storiesDir).filter((f) => f.endsWith('.md'))) {
						const fm = extractFrontmatter(readFileSync(join(storiesDir, file), 'utf-8'));
						const slug = file.replace('.md', '');
						storyItems.push({ slug, title: fm.title, description: fm.description || null, name: fm.name, role: fm.role, company: fm.company || null, highlight: fm.highlight || null, publishDate: fm.publishDate || null, tags: fm.tags || [], url: `/learn-wiki/stories/${slug}/` });
					}
					storyItems.sort((a, b) => { if (!a.publishDate || !b.publishDate) return 0; return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime(); });
				}

				const manifest = {
					generatedAt: new Date().toISOString(),
					baseUrl: '/learn-wiki',
					books,
					articles,
					help: helpItems,
					stories: storyItems,
					stats: { totalBooks: books.length, totalChapters: books.reduce((sum, b) => sum + b.chapterCount, 0), totalArticles: articles.length, totalHelp: helpItems.length, totalStories: storyItems.length },
				};

				const outPath = join(dir.pathname, 'manifest.json');
				writeFileSync(outPath, JSON.stringify(manifest, null, 2));
				console.log(`[jr-wiki-manifest] Generated manifest.json (${books.length} books, ${articles.length} articles, ${helpItems.length} help, ${storyItems.length} stories)`);
			},
		},
	};
}

function extractFrontmatter(content: string): Record<string, any> {
	const match = content.match(/^---\n([\s\S]*?)\n---/);
	if (!match) return {};
	return parseYaml(match[1]);
}
