<script lang="ts">
	import { onDestroy, tick } from 'svelte';

	let {
		dataFactory,
		layoutFactory,
		config = { responsive: true, displaylogo: false, scrollZoom: true },
		imagePath,
		imageAlt = 'Plot preview',
		aspectRatio = '670/500'
	}: {
		dataFactory: () => any;
		layoutFactory: () => any;
		config?: any;
		imagePath: string;
		imageAlt?: string;
		aspectRatio?: string;
	} = $props();

	let plotContainer: HTMLElement | undefined = $state(undefined);
	let wrapperElement: HTMLElement | undefined = $state(undefined);
	let isLoading = $state(false);
	let isPlotReady = $state(false);
	let hasClicked = $state(false);
	let resizeObserver: ResizeObserver | undefined;
	let plotlyModule: any | undefined;
	let baseLayout: any | undefined;
	let lastPlotSize = { width: 0, height: 0 };
	const defaultMargins = { l: 80, r: 80, t: 100, b: 80, pad: 0 };

	function parseAspectRatio(value: string) {
		const [width, height] = value.split('/').map((part) => Number(part.trim()));
		if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
			return undefined;
		}
		return { width, height, ratio: height / width };
	}

	function getPlotSize() {
		if (!wrapperElement) return undefined;
		const rect = wrapperElement.getBoundingClientRect();
		const measuredWidth = Math.round(rect.width);
		const measuredHeight = Math.round(rect.height);
		let width = measuredWidth;
		let height = measuredHeight;
		if ((!width || !height) && aspectRatio) {
			const parsed = parseAspectRatio(aspectRatio);
			if (parsed?.ratio && width && !height) {
				height = Math.round(width * parsed.ratio);
			} else if (parsed?.ratio && height && !width) {
				width = Math.round(height / parsed.ratio);
			}
		}
		if (!width || !height) return undefined;
		return { width, height, isMeasured: measuredWidth > 0 && measuredHeight > 0 };
	}

	async function waitForPlotSize() {
		for (let attempt = 0; attempt < 3; attempt++) {
			const size = getPlotSize();
			if (size) return size;
			await tick();
			await new Promise((resolve) => requestAnimationFrame(resolve));
		}
		return getPlotSize();
	}

	function scaleNumber(value: number | undefined, scale: number) {
		if (typeof value !== 'number') return value;
		return value * scale;
	}

	function scaleFont(font: any, scale: number, defaultSize?: number) {
		if (!font && defaultSize === undefined) return font;
		const baseSize = typeof font?.size === 'number' ? font.size : defaultSize;
		if (baseSize === undefined) return font;
		return { ...(font ?? {}), size: scaleNumber(baseSize, scale) };
	}

	function scaleTitle(title: any, scale: number) {
		if (!title) return title;
		const baseSize =
			typeof title === 'object' && typeof title.font?.size === 'number' ? title.font.size : 16;
		const font = scaleFont(typeof title === 'object' ? title.font : undefined, scale, baseSize);
		if (typeof title === 'string') return { text: title, font };
		return { ...title, font };
	}

	function buildSizedLayout(layout: any, size?: { width: number; height: number }) {
		if (!size) return layout;
		return { ...layout, width: size.width, height: size.height, autosize: false };
	}

	function applyScaledLayout(layout: any, size?: { width: number; height: number }) {
		if (!size) return {};
		const parsed = aspectRatio ? parseAspectRatio(aspectRatio) : undefined;
		const scale = parsed ? size.width / parsed.width : 1;
		const marginBase = { ...defaultMargins, ...(layout?.margin ?? {}) };
		const margin = {
			l: scaleNumber(marginBase.l, scale),
			r: scaleNumber(marginBase.r, scale),
			t: scaleNumber(marginBase.t, scale),
			b: scaleNumber(marginBase.b, scale),
			pad: scaleNumber(marginBase.pad, scale)
		};
		const font = scaleFont(layout?.font, scale, 12);
		const updates: Record<string, any> = {
			width: size.width,
			height: size.height,
			autosize: false,
			margin,
			font
		};
		if (layout?.title !== undefined) {
			updates.title = scaleTitle(layout.title, scale);
		}
		return updates;
	}

	function resizePlot() {
		if (!plotlyModule || !plotContainer || !baseLayout) return;
		const size = getPlotSize();
		if (!size) return;
		if (size.width === lastPlotSize.width && size.height === lastPlotSize.height) return;
		lastPlotSize = { width: size.width, height: size.height };
		const scaledLayout = applyScaledLayout(baseLayout, size);
		if (Object.keys(scaledLayout).length > 0) {
			plotlyModule.relayout(plotContainer, scaledLayout);
		}
	}

	onDestroy(() => {
		resizeObserver?.disconnect();
	});

	async function loadInteractivePlot() {
		if (isLoading || isPlotReady) return;

		isLoading = true;
		hasClicked = true;
		await tick();

		if (!plotContainer || !wrapperElement) {
			console.error('plotContainer not available');
			isLoading = false;
			hasClicked = false;
			return;
		}

		try {
			// @ts-ignore - plotly.js-dist doesn't have type definitions
			plotlyModule = await import('plotly.js-dist');
			const data = dataFactory();
			baseLayout = layoutFactory();

			// Get container dimensions for proper sizing
			const size = await waitForPlotSize();
			const responsiveLayout = buildSizedLayout(baseLayout, size);

			await plotlyModule.newPlot(plotContainer, data, responsiveLayout, config);
			if (size) {
				const scaledLayout = applyScaledLayout(baseLayout, size);
				if (Object.keys(scaledLayout).length > 0) {
					plotlyModule.relayout(plotContainer, scaledLayout);
				}
			}

			if (resizeObserver) resizeObserver.disconnect();
			if (wrapperElement && plotContainer) {
				resizeObserver = new ResizeObserver(() => resizePlot());
				resizeObserver.observe(wrapperElement);
			}

			isPlotReady = true;
		} catch (error) {
			console.error('Failed to load plot:', error);
			hasClicked = false;
		} finally {
			isLoading = false;
		}
	}
</script>

<div
	bind:this={wrapperElement}
	class="not-prose lazy-plot relative group w-full rounded-xl overflow-hidden border border-ocean-200/50 shadow-lg"
	class:cursor-pointer={!isPlotReady}
	style="aspect-ratio: {aspectRatio};"
	role="button"
	tabindex="0"
	onclick={loadInteractivePlot}
	onkeydown={(e) => e.key === 'Enter' && loadInteractivePlot()}
>
	<!-- Image: shown until plot is ready -->
	{#if !isPlotReady}
		<img
			src={imagePath}
			alt={imageAlt}
			class="absolute inset-0 w-full h-full object-contain bg-white/40"
		/>
	{/if}

	<!-- Hover overlay: only when not clicked -->
	{#if !hasClicked}
		<div class="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 rounded-xl">
			<div class="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-lg shadow-lg opacity-0 group-hover:opacity-100">
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
		</div>
	{/if}

	<!-- Loading indicator: shown while loading, on top of image -->
	{#if isLoading}
		<div class="absolute inset-0 flex items-center justify-center bg-black/10 rounded-xl">
			<div class="bg-white/95 backdrop-blur-sm px-6 py-4 rounded-lg shadow-lg">
				<div class="text-center space-y-2">
					<div class="text-ocean-600 font-medium">Loading interactive plot...</div>
					<div class="text-sm text-ocean-500">This may take a moment</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Plot container: rendered in background, shown when ready -->
	{#if hasClicked}
		<div
			bind:this={plotContainer}
			class="absolute inset-0 w-full h-full"
			class:opacity-0={!isPlotReady}
			class:opacity-100={isPlotReady}
		></div>
	{/if}
</div>
