<script lang="ts">
	// Face order: U(0-8), R(9-17), F(18-26), D(27-35), L(36-44), B(45-53)
	// Each face indexed left-to-right, top-to-bottom:
	//   0 1 2
	//   3 4 5
	//   6 7 8

	const COLORS = ['#ffffff', '#b91c1c', '#16a34a', '#eab308', '#ea580c', '#2563eb'];
	const COLOR_NAMES = ['white', 'red', 'green', 'yellow', 'orange', 'blue'];
	const SOLVED: number[] = Array.from({ length: 54 }, (_, i) => Math.floor(i / 9));

	// Each move is an array of 4-cycles: [a,b,c,d] means a->b->c->d->a
	// Derived from 3D coordinate transforms with verified cycle lengths:
	// R U = 105, R U R' U' = 6, T-perm = 2, Niklas = 3
	const MOVE_CYCLES: Record<string, number[][]> = {
		R: [
			[2, 51, 29, 20],
			[5, 48, 32, 23],
			[8, 45, 35, 26],
			[9, 11, 17, 15],
			[10, 14, 16, 12]
		],
		L: [
			[0, 18, 27, 53],
			[3, 21, 30, 50],
			[6, 24, 33, 47],
			[36, 38, 44, 42],
			[37, 41, 43, 39]
		],
		U: [
			[0, 2, 8, 6],
			[1, 5, 7, 3],
			[9, 18, 36, 45],
			[10, 19, 37, 46],
			[11, 20, 38, 47]
		],
		D: [
			[15, 51, 42, 24],
			[16, 52, 43, 25],
			[17, 53, 44, 26],
			[27, 29, 35, 33],
			[28, 32, 34, 30]
		],
		F: [
			[6, 9, 29, 44],
			[7, 12, 28, 41],
			[8, 15, 27, 38],
			[18, 20, 26, 24],
			[19, 23, 25, 21]
		],
		B: [
			[0, 42, 35, 11],
			[1, 39, 34, 14],
			[2, 36, 33, 17],
			[45, 47, 53, 51],
			[46, 50, 52, 48]
		]
	};

	function applyCycles(state: number[], cycles: number[][], reverse: boolean): number[] {
		const result = [...state];
		for (const cycle of cycles) {
			if (reverse) {
				const tmp = result[cycle[0]];
				for (let i = 0; i < cycle.length - 1; i++) result[cycle[i]] = result[cycle[i + 1]];
				result[cycle[cycle.length - 1]] = tmp;
			} else {
				const tmp = result[cycle[cycle.length - 1]];
				for (let i = cycle.length - 1; i > 0; i--) result[cycle[i]] = result[cycle[i - 1]];
				result[cycle[0]] = tmp;
			}
		}
		return result;
	}

	function applyMove(state: number[], move: string): number[] {
		const base = move.replace("'", '');
		const inverse = move.includes("'");
		const cycles = MOVE_CYCLES[base];
		if (!cycles) return state;
		return applyCycles(state, cycles, inverse);
	}

	function applySequence(state: number[], seq: string[]): number[] {
		let s = state;
		for (const move of seq) {
			s = applyMove(s, move);
		}
		return s;
	}

	function isSolved(state: number[]): boolean {
		for (let i = 0; i < 54; i++) {
			if (state[i] !== SOLVED[i]) return false;
		}
		return true;
	}

	// SVG net layout: each face placed on a grid
	// Face positions (in face units): U(1,0), L(0,1), F(1,1), R(2,1), B(3,1), D(1,2)
	const FACE_POS: [number, number][] = [
		[1, 0], // U
		[2, 1], // R
		[1, 1], // F
		[1, 2], // D
		[0, 1], // L
		[3, 1]  // B
	];

	const CELL = 32;
	const GAP = 3;
	const FACE = CELL * 3 + GAP * 2;
	const FACE_GAP = 6;

	function faceletPos(index: number): { x: number; y: number } {
		const face = Math.floor(index / 9);
		const pos = index % 9;
		const row = Math.floor(pos / 3);
		const col = pos % 3;
		const [fx, fy] = FACE_POS[face];
		return {
			x: fx * (FACE + FACE_GAP) + col * (CELL + GAP),
			y: fy * (FACE + FACE_GAP) + row * (CELL + GAP)
		};
	}

	const SVG_W = 4 * (FACE + FACE_GAP) - FACE_GAP;
	const SVG_H = 3 * (FACE + FACE_GAP) - FACE_GAP;

	// Component state
	let cubeState = $state([...SOLVED]);
	let moveSequence: string[] = $state([]);
	let isPlaying = $state(false);
	let cycleCount = $state(0);
	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	let speed = $state(300);

	const solved = $derived(isSolved(cubeState));
	const MOVES = ['R', 'L', 'U', 'D', 'F', 'B'];

	function addMove(move: string) {
		if (isPlaying) return;
		moveSequence = [...moveSequence, move];
	}

	function deleteLast() {
		if (isPlaying) return;
		moveSequence = moveSequence.slice(0, -1);
	}

	function clearAll() {
		stop();
		moveSequence = [];
		cubeState = [...SOLVED];
		cycleCount = 0;
	}

	function reset() {
		stop();
		cubeState = [...SOLVED];
		cycleCount = 0;
	}

	function play() {
		if (moveSequence.length === 0) return;
		isPlaying = true;
		cubeState = [...SOLVED];
		cycleCount = 0;
		step();
	}

	function step() {
		cubeState = applySequence(cubeState, moveSequence);
		cycleCount++;
		if (isSolved(cubeState)) {
			isPlaying = false;
			return;
		}
		timeoutId = setTimeout(step, speed);
	}

	function stop() {
		isPlaying = false;
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = undefined;
		}
	}

	function computeInstant() {
		if (moveSequence.length === 0) return;
		stop();
		let s = [...SOLVED];
		let count = 0;
		do {
			s = applySequence(s, moveSequence);
			count++;
		} while (!isSolved(s) && count < 2000);
		cubeState = s;
		cycleCount = count;
	}
</script>

<div class="not-prose mx-auto max-w-2xl space-y-5">
	<!-- Cube net -->
	<div class="flex justify-center">
		<svg
			viewBox="0 0 {SVG_W} {SVG_H}"
			class="w-full max-w-md"
			role="img"
			aria-label="Rubik's cube unfolded net showing current state"
		>
			{#each cubeState as colorIndex, i}
				{@const pos = faceletPos(i)}
				<rect
					x={pos.x}
					y={pos.y}
					width={CELL}
					height={CELL}
					fill={COLORS[colorIndex]}
					stroke="#334155"
					stroke-width="1.5"
					rx="3"
				>
					<title>Face {COLOR_NAMES[SOLVED[i]]}, position {i % 9 + 1}: {COLOR_NAMES[colorIndex]}</title>
				</rect>
			{/each}
		</svg>
	</div>

	<!-- Sequence display -->
	<div class="rounded-lg border border-ocean-200 bg-ocean-50/50 px-4 py-3">
		<div class="mb-1 text-xs font-medium uppercase tracking-wider text-ocean-500">Sequence</div>
		<div class="min-h-[1.75rem] font-mono text-sm text-ocean-900">
			{#if moveSequence.length > 0}
				{moveSequence.join(' ')}
			{:else}
				<span class="text-ocean-400">No moves selected</span>
			{/if}
		</div>
	</div>

	<!-- Move buttons -->
	<div class="grid grid-cols-6 gap-2">
		{#each MOVES as m}
			<button
				class="rounded-lg border border-ocean-200 bg-white px-2 py-2.5 text-sm font-semibold text-ocean-900 transition-colors hover:bg-ocean-100 disabled:opacity-40"
				disabled={isPlaying}
				onclick={() => addMove(m)}
			>
				{m}
			</button>
		{/each}
		{#each MOVES as m}
			<button
				class="rounded-lg border border-ocean-200 bg-white px-2 py-2.5 text-sm font-semibold text-ocean-900 transition-colors hover:bg-ocean-100 disabled:opacity-40"
				disabled={isPlaying}
				onclick={() => addMove(m + "'")}
			>
				{m}'
			</button>
		{/each}
	</div>

	<!-- Control buttons -->
	<div class="flex flex-wrap gap-2">
		{#if isPlaying}
			<button
				class="flex-1 rounded-lg bg-ocean-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ocean-800"
				onclick={stop}
			>
				Stop
			</button>
		{:else}
			<button
				class="flex-1 rounded-lg bg-ocean-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ocean-800 disabled:opacity-40"
				disabled={moveSequence.length === 0}
				onclick={play}
			>
				Play
			</button>
		{/if}
		<button
			class="flex-1 rounded-lg border border-ocean-200 bg-white px-4 py-2.5 text-sm font-semibold text-ocean-700 transition-colors hover:bg-ocean-50 disabled:opacity-40"
			disabled={isPlaying || moveSequence.length === 0}
			onclick={computeInstant}
		>
			Skip
		</button>
		<button
			class="flex-1 rounded-lg border border-ocean-200 bg-white px-4 py-2.5 text-sm font-semibold text-ocean-700 transition-colors hover:bg-ocean-50 disabled:opacity-40"
			disabled={isPlaying}
			onclick={reset}
		>
			Reset
		</button>
		<button
			class="rounded-lg border border-ocean-200 bg-white px-3 py-2.5 text-sm text-ocean-600 transition-colors hover:bg-ocean-50 disabled:opacity-40"
			disabled={isPlaying || moveSequence.length === 0}
			onclick={deleteLast}
			aria-label="Delete last move"
		>
			&#9003;
		</button>
		<button
			class="rounded-lg border border-ocean-200 bg-white px-3 py-2.5 text-sm text-ocean-600 transition-colors hover:bg-ocean-50 disabled:opacity-40"
			disabled={isPlaying}
			onclick={clearAll}
			aria-label="Clear all"
		>
			Clear
		</button>
	</div>

	<!-- Speed slider -->
	<div class="flex items-center gap-3 text-sm text-ocean-600">
		<span>Speed</span>
		<input
			type="range"
			min="50"
			max="800"
			step="50"
			bind:value={speed}
			class="flex-1 accent-ocean-700"
			disabled={isPlaying}
		/>
		<span class="w-16 text-right font-mono text-xs">{speed}ms</span>
	</div>

	<!-- Cycle count -->
	{#if cycleCount > 0}
		<div class="rounded-lg border border-ocean-200 bg-ocean-50/50 px-4 py-3 text-center">
			{#if solved && !isPlaying}
				<div class="text-lg font-bold text-ocean-900">
					Cycle length: {cycleCount}
				</div>
				<div class="text-sm text-ocean-600">
					The cube returned to its solved state after {cycleCount} repetition{cycleCount === 1 ? '' : 's'}.
				</div>
			{:else}
				<div class="font-mono text-ocean-700">
					Iteration {cycleCount}{isPlaying ? '...' : ''}
				</div>
			{/if}
		</div>
	{/if}
</div>
