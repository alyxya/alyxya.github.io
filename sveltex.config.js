import { sveltex } from '@nvl/sveltex';

const removePreTabIndex = {
	name: 'remove-pre-tabindex',
	pre(hast) {
		if (hast?.properties) {
			delete hast.properties.tabindex;
			delete hast.properties.tabIndex;
		}
	}
};

export default await sveltex(
	{
		markdownBackend: 'unified',
		codeBackend: 'shiki',
		mathBackend: 'mathjax'
	},
	{
		code: {
			shiki: {
				transformers: [removePreTabIndex]
			}
		}
	}
);
