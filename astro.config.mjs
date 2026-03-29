import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import manifest from './src/integrations/manifest.js';

export default defineConfig({
	site: 'https://jiangren.com.au',
	base: '/learn-wiki',
	output: 'static',
	trailingSlash: 'always',
	integrations: [sitemap(), manifest()],
	markdown: {
		shikiConfig: {
			theme: 'github-dark',
		},
	},
});
