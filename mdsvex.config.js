import { mdsvex } from 'mdsvex';
import remarkMath from 'remark-math';
import rehypeKatexSvelte from 'rehype-katex-svelte';

/** @type {import('mdsvex').MdsvexOptions} */
const config = {
	extensions: ['.svx', '.md'],
	remarkPlugins: [remarkMath],
	rehypePlugins: [rehypeKatexSvelte],
	smartypants: false
};

export default config;
