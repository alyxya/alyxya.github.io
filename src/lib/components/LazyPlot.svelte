<script lang="ts">
	import { tick } from 'svelte';

	let {
		dataFactory,
		layoutFactory,
		config = { responsive: true, displaylogo: false },
		style = 'width: 100%; height: 400px;',
		imagePath,
		imageAlt = 'Plot preview'
	}: {
		dataFactory: () => any;
		layoutFactory: () => any;
		config?: any;
		style?: string;
		imagePath: string;
		imageAlt?: string;
	} = $props();

	let plotContainer: HTMLElement | undefined = $state(undefined);
	let isLoading = $state(false);
	let isInteractive = $state(false);

	async function loadInteractivePlot() {
		if (isLoading || isInteractive) return;

		isLoading = true;
		isInteractive = true;
		await tick();

		if (!plotContainer) {
			console.error('plotContainer not available');
			isLoading = false;
			isInteractive = false;
			return;
		}

		try {
			// @ts-ignore - plotly.js-dist doesn't have type definitions
			const Plotly = await import('plotly.js-dist');
			const data = dataFactory();
			const layout = layoutFactory();
			await Plotly.newPlot(plotContainer, data, layout, config);
		} catch (error) {
			console.error('Failed to load plot:', error);
			isInteractive = false;
		} finally {
			isLoading = false;
		}
	}
</script>

<div
	{style}
	class="relative group cursor-pointer"
	role="button"
	tabindex="0"
	onclick={loadInteractivePlot}
	onkeydown={(e) => e.key === 'Enter' && loadInteractivePlot()}
>
	{#if !isInteractive}
		<img src={imagePath} alt={imageAlt} class="w-full h-full object-contain rounded-lg" {style} />

		<div class="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg">
			{#if isLoading}
				<div class="bg-white/95 backdrop-blur-sm px-6 py-4 rounded-lg shadow-lg">
					<div class="text-center space-y-2">
						<div class="animate-pulse text-ocean-600 font-medium">Loading interactive plot...</div>
						<div class="text-sm text-ocean-500">This may take a moment</div>
					</div>
				</div>
			{:else}
				<div class="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
					<div class="flex items-center gap-2 text-ocean-700 font-medium">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
								clip-rule="evenodd"
							/>
						</svg>
						<span>Click to load interactive plot</span>
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<div bind:this={plotContainer} class="transition-opacity duration-500" {style}></div>
	{/if}
</div>
