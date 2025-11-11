import type { BlogPostMetadata } from '$lib';
import type { PageServerLoad } from './$types';
import type { ComponentType, SvelteComponent } from 'svelte';
import { error } from '@sveltejs/kit';

type PostModule = {
	default: ComponentType<SvelteComponent>;
	metadata: BlogPostMetadata;
};

export const load: PageServerLoad = async ({ params }) => {
	const posts = import.meta.glob<PostModule>('/src/posts/*.sveltex');
	const resolver = posts[`/src/posts/${params.slug}.sveltex`];

	if (!resolver) {
		throw error(404, `Post not found: ${params.slug}`);
	}

	const post = await resolver();

	return {
		slug: params.slug,
		metadata: post.metadata
	};
};
