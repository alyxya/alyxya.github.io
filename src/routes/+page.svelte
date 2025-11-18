<script lang="ts">
	import JellyfishScene from '$lib/components/JellyfishScene.svelte';
</script>

<svelte:head>
	<title>Home</title>
</svelte:head>

<section class="relative isolate min-h-screen overflow-hidden px-4 py-16 sm:py-24">
	<div class="absolute inset-0">
		<JellyfishScene />
	</div>

	<div class="relative z-10 mx-auto max-w-4xl px-6 py-12 sm:px-12 md:px-20">
		<div class="glass-card bg-white/80 p-8 text-ocean-900 shadow-xl shadow-ocean-950/10">
			<p class="mb-4 text-sm uppercase tracking-[0.3em] text-ocean-500">Alyxya's Lab Notes</p>
			<h1 class="mb-6 text-5xl font-bold leading-tight text-ocean-950">
				Ideas drifting through code, math, and visualization
			</h1>

			<p class="mb-8 text-xl text-ocean-700">
				An ocean-themed notebook for deep technical explorations, complete with markdown, LaTeX math, live plots,
				and custom experiments—now accompanied by a living jellyfish scene rendered entirely with vanilla canvas.
			</p>

			<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
				<a
					href="/blog"
					class="ocean-link-hover inline-flex items-center justify-center rounded-xl bg-ocean-600 px-8 py-3 text-lg font-semibold text-white shadow-lg shadow-ocean-900/30 transition-all hover:-translate-y-0.5 hover:bg-ocean-500"
				>
					Read the blog
					<span aria-hidden="true" class="ml-2 text-2xl">→</span>
				</a>
				<p class="text-sm text-ocean-50 drop-shadow">
					Latest posts span distributed systems, numerical computing, and design notes from interactive projects.
				</p>
			</div>
		</div>
	</div>
</section>
