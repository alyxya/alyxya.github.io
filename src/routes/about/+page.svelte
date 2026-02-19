<svelte:head>
	<title>About</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-12">
	<div class="panel-card p-6">
		<h1 class="mb-6 text-4xl font-bold text-ocean-900">About</h1>
		<div class="prose prose-ocean">
			<p>Welcome to my blog. This is where I share my thoughts and explorations.</p>
		</div>
		<div class="mt-6 flex flex-wrap gap-4">
			<a href="https://x.com/_alyxya" class="text-ocean-700 hover:text-ocean-900">X</a>
			<a href="https://github.com/alyxya" class="text-ocean-700 hover:text-ocean-900">GitHub</a>
			<span class="text-ocean-700">{#each 'hi@alyxya.com'.split('') as char}<span>{char}</span>{/each}</span>
		</div>
	</div>
</div>
