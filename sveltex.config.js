import { sveltex } from '@nvl/sveltex';

export default await sveltex({
	markdownBackend: 'unified',
	codeBackend: 'shiki',
	mathBackend: 'mathjax'
}, {
	code: {
		shiki: {
			theme: 'nord'
		}
	},
	math: {
		mathjax: {
			// Configure MathJax for better performance
			chtml: {
				displayAlign: 'left',
				displayIndent: '0'
			},
			// Disable features for faster rendering
			options: {
				enableMenu: false // Disable context menu for faster load
			}
		}
	}
});
