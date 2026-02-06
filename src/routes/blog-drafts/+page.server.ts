import type { BlogPostMetadata } from '$lib';
import type { PageServerLoad } from './$types';

type PostModule = {
	metadata: BlogPostMetadata;
};

export const load: PageServerLoad = async () => {
	const postModules = import.meta.glob('/src/posts/**/*.sveltex');

	const posts = await Promise.all(
		Object.entries(postModules).map(async ([path, resolver]) => {
			const module = (await resolver()) as PostModule;

			const slug = path.split('/').pop()?.replace('.sveltex', '') || '';

			return {
				slug,
				...module.metadata
			};
		})
	);

	// Sort posts by date (newest first)
	posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	// Only show draft posts
	const draftPosts = posts.filter((post) => post.draft);

	return {
		posts: draftPosts
	};
};
