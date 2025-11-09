import { mdsvex } from 'mdsvex';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

/** @type {import('mdsvex').MdsvexOptions} */
const config = {
	extensions: ['.svelte', '.svx', '.md'],
	remarkPlugins: [remarkMath],
	rehypePlugins: [rehypeKatex],
	smartypants: false
};

export default config;
