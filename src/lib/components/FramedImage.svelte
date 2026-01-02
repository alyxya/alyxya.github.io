<script lang="ts">
	let {
		src,
		alt,
		caption,
		aspectRatio,
		fit = 'contain',
		class: className = ''
	}: {
		src: string;
		alt: string;
		caption?: string;
		aspectRatio?: string;
		fit?: 'contain' | 'cover';
		class?: string;
	} = $props();

	const fitClass = fit === 'cover' ? 'object-cover' : 'object-contain';
	const hasAspectRatio = Boolean(aspectRatio);
	const wrapperStyle = aspectRatio ? `aspect-ratio: ${aspectRatio};` : undefined;
</script>

<figure class={`not-prose ${className}`.trim()}>
	<div
		class="relative w-full rounded-xl overflow-hidden border border-ocean-200/50 shadow-lg bg-white/40"
		style={wrapperStyle}
	>
		<img
			src={src}
			alt={alt}
			loading="lazy"
			decoding="async"
			class={hasAspectRatio
				? `absolute inset-0 w-full h-full ${fitClass}`
				: `block w-full h-auto ${fitClass}`}
		/>
	</div>
	{#if caption}
		<figcaption class="mt-2 text-sm text-ocean-600 text-center">{caption}</figcaption>
	{/if}
</figure>
