import { sveltex } from '@nvl/sveltex';

export default await sveltex({
	markdownBackend: 'unified',
	codeBackend: 'shiki',
	mathBackend: 'mathjax'
}, {
	markdown: {
		components: [
			{
				name: 'Annotation',
				type: 'phrasing',
				importPath: '$lib/components/Annotation.svelte'
			}
		]
	},
	code: {
		shiki: {
			theme: 'nord'
		}
	},
	math: {
		outputFormat: 'svg',
		mathjax: {
			svg: {
				displayAlign: 'left',
				displayIndent: '0'
			},
			options: {
				enableMenu: false
			}
		}
	}
});
