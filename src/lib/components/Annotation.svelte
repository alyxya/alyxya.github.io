<script lang="ts">
	import { tick } from 'svelte';

	type Placement = 'top' | 'bottom' | 'left' | 'right';

	let {
		note,
		placement = 'top',
		ariaLabel
	}: {
		note?: string;
		placement?: Placement;
		ariaLabel?: string;
	} = $props();

	let root = $state<HTMLElement | null>(null);
	let popover = $state<HTMLElement | null>(null);
	let isHovered = $state(false);
	let isPinned = $state(false);
	let shiftX = $state(0);

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
			isHovered = false;
		}
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			isPinned = false;
			isHovered = false;
		}
	}

	function handleBlur() {
		if (!isPinned) {
			isHovered = false;
		}
	}

	async function updatePopoverShift() {
		if (typeof window === 'undefined') return;
		await tick();
		if (!popover) return;
		const rect = popover.getBoundingClientRect();
		const gutter = 12;
		let nextShift = 0;
		if (rect.left < gutter) {
			nextShift = gutter - rect.left;
		} else if (rect.right > window.innerWidth - gutter) {
			nextShift = window.innerWidth - gutter - rect.right;
		}
		shiftX = nextShift;
	}

	$effect(() => {
		if (isHovered || isPinned) {
			updatePopoverShift();
		} else {
			shiftX = 0;
		}
	});
</script>

<svelte:window on:click={handleWindowClick} on:keydown={handleWindowKeydown} />

<span
	bind:this={root}
	class="annotation relative inline"
	on:mouseenter={() => (isHovered = true)}
	on:mouseleave={handleBlur}
>
	<button
		type="button"
		class={`annotation-trigger inline rounded-sm px-0.5 -mx-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400/60 ${isHovered || isPinned ? 'bg-ocean-100/70' : ''}`}
		aria-label={ariaLabel}
		aria-pressed={isPinned}
		aria-expanded={isHovered || isPinned}
		on:focus={() => (isHovered = true)}
		on:blur={handleBlur}
		on:click={togglePinned}
	>
		<span
			class={`annotation-anchor border-b border-dotted border-ocean-300/80 pb-[0.08em] transition-colors ${isHovered || isPinned ? 'border-ocean-500/80 text-ocean-950' : ''}`}
		>
			<slot />
		</span>
		<span class="annotation-mark ml-0.5 inline-flex h-2.5 w-2.5 items-center justify-center relative -top-1">
			<span
				class={`absolute inset-0 rotate-45 rounded-[3px] border border-ocean-400/80 bg-ocean-100/80 shadow-sm transition-transform duration-200 ${isHovered || isPinned ? 'scale-110 border-ocean-500/90 bg-ocean-200/90' : ''}`}
			></span>
			<span
				class="relative h-1 w-1 rounded-full bg-ocean-600 transition-colors"
				class:bg-ocean-700={isHovered || isPinned}
			></span>
		</span>
	</button>
	<span
		bind:this={popover}
		class={`annotation-popover absolute z-20 w-64 max-w-[80vw] rounded-lg border border-ocean-200/80 bg-white/95 p-3 text-sm leading-relaxed text-ocean-900 shadow-xl backdrop-blur transition-[opacity,transform] duration-150 ease-out whitespace-normal break-words ${getPlacementClass(placement)}`}
		style={`margin-left: ${shiftX}px;`}
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
			<slot name="note" />
		{/if}
	</span>
</span>
