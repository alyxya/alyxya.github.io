export async function load() {
	const postModules = import.meta.glob('/src/posts/*.sveltex');

	const posts = await Promise.all(
		Object.entries(postModules).map(async ([path, resolver]) => {
			const module = (await resolver()) as {
				metadata: {
					title: string;
					date: string;
					description?: string;
					tags?: string[];
				};
			};

			const slug = path.split('/').pop()?.replace('.sveltex', '') || '';

			return {
				slug,
				...module.metadata
			};
		})
	);

	// Sort posts by date (newest first)
	posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	return {
		posts
	};
}
