<script lang="ts">
	import { onMount, tick } from 'svelte';

	// Accept factory functions that create data/layout on demand
	let {
		dataFactory,
		layoutFactory,
		config = { responsive: true, displaylogo: false },
		style = 'width: 100%; height: 400px;',
		placeholder = 'Loading visualization...'
	}: {
		dataFactory: () => any;
		layoutFactory: () => any;
		config?: any;
		style?: string;
		placeholder?: string;
	} = $props();

	let plotContainer: HTMLElement | undefined = $state(undefined);
	let isVisible = $state(false);
	let isReady = $state(false);
	let container: HTMLElement | undefined = $state(undefined);

	onMount(() => {
		if (!container) return;

		// Use Intersection Observer to only load when plot comes into view
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && !isVisible) {
					isVisible = true;
					observer.disconnect();

					// Use requestAnimationFrame to defer loading to next frame
					requestAnimationFrame(async () => {
						await tick(); // Let current render complete

						// Dynamically import both Plotly and create the plot
						const scheduleLoad = () => {
							if ('requestIdleCallback' in window) {
								requestIdleCallback(
									async () => {
										await loadAndRenderPlot();
									},
									{ timeout: 3000 }
								);
							} else {
								setTimeout(async () => {
									await loadAndRenderPlot();
								}, 150);
							}
						};

						scheduleLoad();
					});
				}
			},
			{
				rootMargin: '150px' // Start loading earlier
			}
		);

		observer.observe(container);

		return () => observer.disconnect();
	});

	async function loadAndRenderPlot() {
		if (!plotContainer) return;

		try {
			// Import Plotly dynamically - use dist version for smaller bundle
			const PlotlyModule = await import('plotly.js-dist');
			const Plotly = PlotlyModule.default || PlotlyModule;

			// Give browser a chance to breathe
			await tick();

			// Now compute data (deferred until needed)
			const data = dataFactory();
			const layout = layoutFactory();

			// Render plot using Plotly directly
			await Plotly.newPlot(plotContainer, data, layout, config);

			isReady = true;
		} catch (error) {
			console.error('Failed to load plot:', error);
		}
	}
</script>

<div bind:this={container} {style} class="relative">
	{#if isVisible}
		<div bind:this={plotContainer} class:opacity-0={!isReady} class="transition-opacity duration-300" {style}></div>
		{#if !isReady}
			<div class="absolute inset-0 flex items-center justify-center">
				<div class="text-center space-y-2">
					<div class="animate-pulse text-ocean-600 font-medium">{placeholder}</div>
					<div class="text-sm text-ocean-500">This may take a moment</div>
				</div>
			</div>
		{/if}
	{/if}
</div>
