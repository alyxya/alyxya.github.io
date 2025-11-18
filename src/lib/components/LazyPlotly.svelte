<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { ComponentType } from 'svelte';

	// Props that match Plotly component interface
	let {
		data,
		layout,
		config,
		style = 'width: 100%; height: 400px;'
	}: {
		data: any;
		layout: any;
		config?: any;
		style?: string;
	} = $props();

	let PlotlyComponent: ComponentType | null = $state(null);
	let isVisible = $state(false);
	let isLoading = $state(false);
	let container: HTMLElement;

	onMount(() => {
		// Use Intersection Observer to only load when plot comes into view
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && !isLoading && !PlotlyComponent) {
					isVisible = true;
					isLoading = true;
					observer.disconnect();

					// Use requestIdleCallback to load during idle time, or setTimeout as fallback
					const loadPlotly = async () => {
						// Wait for next tick to avoid blocking current render
						await tick();

						// Use requestIdleCallback if available, with timeout fallback
						const scheduleLoad = () => {
							if ('requestIdleCallback' in window) {
								requestIdleCallback(
									async () => {
										const module = await import('svelte-plotly.js');
										// Wait another tick before setting component to avoid blocking
										await tick();
										PlotlyComponent = module.default;
									},
									{ timeout: 2000 }
								);
							} else {
								// Fallback: use setTimeout with delay to let UI update
								setTimeout(async () => {
									const module = await import('svelte-plotly.js');
									await tick();
									PlotlyComponent = module.default;
								}, 100);
							}
						};

						scheduleLoad();
					};

					loadPlotly();
				}
			},
			{
				rootMargin: '100px' // Start loading earlier for better UX
			}
		);

		observer.observe(container);

		return () => observer.disconnect();
	});
</script>

<div bind:this={container} {style}>
	{#if PlotlyComponent}
		<PlotlyComponent {data} {layout} {config} {style} />
	{:else if isVisible}
		<div class="flex items-center justify-center h-full min-h-[200px]">
			<div class="text-center space-y-2">
				<div class="animate-pulse text-ocean-600 font-medium">Loading visualization...</div>
				<div class="text-sm text-ocean-500">This may take a moment</div>
			</div>
		</div>
	{/if}
</div>
