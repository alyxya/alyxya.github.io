import type { BlogPostMetadata } from '$lib';
import type { EntryGenerator, PageServerLoad } from './$types';
import type { ComponentType, SvelteComponent } from 'svelte';
import { error } from '@sveltejs/kit';

type PostModule = {
	default: ComponentType<SvelteComponent>;
	metadata: BlogPostMetadata;
};

const postModules = import.meta.glob<PostModule>('/src/posts/**/*.sveltex');

const slugFromPath = (path: string) => path.split('/').pop()?.replace('.sveltex', '') || '';

const isDraftPath = (path: string) => path.includes('/posts/drafts/');

const listPostSlugs = () =>
	Object.keys(postModules)
		.filter((path) => isDraftPath(path))
		.map(slugFromPath);

const findPostEntry = (slug: string) =>
	Object.entries(postModules).find(
		([path]) => isDraftPath(path) && path.endsWith(`/${slug}.sveltex`)
	);

export const entries: EntryGenerator = async () =>
	Array.from(new Set(listPostSlugs())).map((slug) => ({ slug }));

export const load: PageServerLoad = async ({ params }) => {
	const postEntry = findPostEntry(params.slug);

	if (!postEntry) {
		throw error(404, `Post not found: ${params.slug}`);
	}

	const [postPath, resolver] = postEntry;
	const post = await resolver();

	if (!post.metadata.draft) {
		throw error(404, `Post not found: ${params.slug}`);
	}

	return {
		slug: params.slug,
		metadata: post.metadata,
		postPath
	};
};
