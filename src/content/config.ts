import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const wiki = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/wiki' }),
	schema: z.object({
		title: z.string(),
		wiki: z.string(),
		order: z.number(),
		description: z.string().optional(),
	}),
});

const books = defineCollection({
	loader: glob({ pattern: '**/_meta.yaml', base: './src/content/wiki' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		tags: z.array(z.string()).default([]),
		order: z.number().default(0),
	}),
});

const articles = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/content/articles' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		publishDate: z.coerce.date(),
		tags: z.array(z.string()).default([]),
		author: z.string().default('JR Academy'),
		cover: z.string().optional(),
	}),
});

const help = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/content/help' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		category: z.string(),
		order: z.number().default(0),
	}),
});

const stories = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/content/stories' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		name: z.string(),
		role: z.string(),
		company: z.string().optional(),
		course: z.string().optional(),
		tags: z.array(z.string()).default([]),
		publishDate: z.coerce.date(),
		highlight: z.string().optional(),
	}),
});

export const collections = { wiki, books, articles, help, stories };
