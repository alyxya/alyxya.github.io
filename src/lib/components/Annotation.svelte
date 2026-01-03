<script lang="ts">
	type Placement = 'top' | 'bottom' | 'left' | 'right';

	let {
		label = '*',
		note,
		placement = 'top',
		ariaLabel = 'Annotation'
	}: {
		label?: string;
		note?: string;
		placement?: Placement;
		ariaLabel?: string;
	} = $props();

	let root = $state<HTMLElement | null>(null);
	let isHovered = $state(false);
	let isPinned = $state(false);

	const placementClasses: Record<Placement, string> = {
		top: 'bottom-full mb-2 left-1/2 -translate-x-1/2 origin-bottom',
		bottom: 'top-full mt-2 left-1/2 -translate-x-1/2 origin-top',
		left: 'right-full mr-2 top-1/2 -translate-y-1/2 origin-right',
		right: 'left-full ml-2 top-1/2 -translate-y-1/2 origin-left'
	};

	function getPlacementClass(value: Placement) {
		return placementClasses[value] ?? placementClasses.top;
	}

	function togglePinned() {
		isPinned = !isPinned;
	}

	function handleWindowClick(event: MouseEvent) {
		if (!root) return;
		if (!root.contains(event.target as Node)) {
			isPinned = false;
		}
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			isPinned = false;
		}
	}

	function handleBlur() {
		if (!isPinned) {
			isHovered = false;
		}
	}
</script>

<span bind:this={root} class="annotation relative inline-flex" style="vertical-align: super;">
	<button
		type="button"
		class="annotation-trigger inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-ocean-200 bg-white/90 px-1 text-[0.65rem] font-semibold text-ocean-700 shadow-sm transition-colors hover:border-ocean-300 hover:text-ocean-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400/60"
		class:bg-ocean-100={isPinned}
		class:border-ocean-300={isPinned}
		class:text-ocean-900={isPinned}
		aria-label={ariaLabel}
		aria-pressed={isPinned}
		aria-expanded={isHovered || isPinned}
		on:mouseenter={() => (isHovered = true)}
		on:mouseleave={() => (isHovered = false)}
		on:focus={() => (isHovered = true)}
		on:blur={handleBlur}
		on:click={togglePinned}
	>
		{label}
	</button>

	<span
		class={`annotation-popover absolute z-20 w-64 max-w-[80vw] rounded-lg border border-ocean-200/80 bg-white/95 p-3 text-sm leading-relaxed text-ocean-900 shadow-xl backdrop-blur transition-[opacity,transform] duration-150 ease-out ${getPlacementClass(placement)}`}
		class:opacity-0={!isHovered && !isPinned}
		class:scale-95={!isHovered && !isPinned}
		class:pointer-events-none={!isHovered && !isPinned}
		class:opacity-100={isHovered || isPinned}
		class:scale-100={isHovered || isPinned}
		class:pointer-events-auto={isHovered || isPinned}
		aria-hidden={!isHovered && !isPinned}
		role="note"
	>
		{#if note}
			{note}
		{:else}
			<slot />
		{/if}
	</span>

	<svelte:window on:click={handleWindowClick} on:keydown={handleWindowKeydown} />
</span>
