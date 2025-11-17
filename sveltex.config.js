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
	}
});
