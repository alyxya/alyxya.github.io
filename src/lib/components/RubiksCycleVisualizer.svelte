<script lang="ts">
	import { onDestroy } from 'svelte';

	type Axis = 'x' | 'y' | 'z';
	type FaceKey = 'px' | 'nx' | 'py' | 'ny' | 'pz' | 'nz';
	type Vec3 = [number, number, number];
	type MoveDef = { axis: Axis; axisIndex: 0 | 1 | 2; layer: -1 | 1; dir: -1 | 1 };
	type Cubie = { id: string; pos: Vec3; stickers: Partial<Record<FaceKey, number>> };
	type ActiveTurn = MoveDef & { move: string; angle: number };

	const COLORS = ['#ffffff', '#b91c1c', '#16a34a', '#eab308', '#ea580c', '#2563eb'];
	const FACE_KEYS: FaceKey[] = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];
	const FACE_LABELS: Record<FaceKey, string> = {
		px: 'Right',
		nx: 'Left',
		py: 'Up',
		ny: 'Down',
		pz: 'Front',
		nz: 'Back'
	};
	const FACE_TRANSFORMS: Record<FaceKey, string> = {
		px: 'rotateY(90deg) translateZ(var(--half-cubie))',
		nx: 'rotateY(-90deg) translateZ(var(--half-cubie))',
		py: 'rotateX(90deg) translateZ(var(--half-cubie))',
		ny: 'rotateX(-90deg) translateZ(var(--half-cubie))',
		pz: 'translateZ(var(--half-cubie))',
		nz: 'rotateY(180deg) translateZ(var(--half-cubie))'
	};
	const SOLVED_FACE_COLORS: Record<FaceKey, number> = {
		px: 1,
		nx: 4,
		py: 0,
		ny: 3,
		pz: 2,
		nz: 5
	};
	const FACE_VECTORS: Record<FaceKey, Vec3> = {
		px: [1, 0, 0],
		nx: [-1, 0, 0],
		py: [0, 1, 0],
		ny: [0, -1, 0],
		pz: [0, 0, 1],
		nz: [0, 0, -1]
	};
	const MOVES = ['R', 'L', 'U', 'D', 'F', 'B'];
	const MOVE_DEFS: Record<string, MoveDef> = {
		R: { axis: 'x', axisIndex: 0, layer: 1, dir: -1 },
		L: { axis: 'x', axisIndex: 0, layer: -1, dir: 1 },
		U: { axis: 'y', axisIndex: 1, layer: 1, dir: -1 },
		D: { axis: 'y', axisIndex: 1, layer: -1, dir: 1 },
		F: { axis: 'z', axisIndex: 2, layer: 1, dir: -1 },
		B: { axis: 'z', axisIndex: 2, layer: -1, dir: 1 }
	};

	function createSolvedCubies(): Cubie[] {
		const cubies: Cubie[] = [];
		for (let x = -1; x <= 1; x++) {
			for (let y = -1; y <= 1; y++) {
				for (let z = -1; z <= 1; z++) {
					if (x === 0 && y === 0 && z === 0) continue;
					const stickers: Partial<Record<FaceKey, number>> = {};
					if (x === 1) stickers.px = SOLVED_FACE_COLORS.px;
					if (x === -1) stickers.nx = SOLVED_FACE_COLORS.nx;
					if (y === 1) stickers.py = SOLVED_FACE_COLORS.py;
					if (y === -1) stickers.ny = SOLVED_FACE_COLORS.ny;
					if (z === 1) stickers.pz = SOLVED_FACE_COLORS.pz;
					if (z === -1) stickers.nz = SOLVED_FACE_COLORS.nz;
					cubies.push({ id: `${x}${y}${z}`, pos: [x, y, z], stickers });
				}
			}
		}
		return cubies;
	}

	function rotateVector([x, y, z]: Vec3, axis: Axis, dir: -1 | 1): Vec3 {
		if (axis === 'x') return dir === 1 ? [x, -z, y] : [x, z, -y];
		if (axis === 'y') return dir === 1 ? [z, y, -x] : [-z, y, x];
		return dir === 1 ? [-y, x, z] : [y, -x, z];
	}

	function faceKeyFromVector(vector: Vec3): FaceKey {
		for (const key of FACE_KEYS) {
			const candidate = FACE_VECTORS[key];
			if (candidate[0] === vector[0] && candidate[1] === vector[1] && candidate[2] === vector[2]) {
				return key;
			}
		}
		return 'pz';
	}

	function applyMove(state: Cubie[], move: string): Cubie[] {
		const base = move.replace("'", '');
		const inverse = move.includes("'");
		const def = MOVE_DEFS[base];
		if (!def) return state;
		const turnDir = inverse ? (-def.dir as -1 | 1) : def.dir;

		return state.map((cubie) => {
			if (cubie.pos[def.axisIndex] !== def.layer) {
				return {
					id: cubie.id,
					pos: [...cubie.pos] as Vec3,
					stickers: { ...cubie.stickers }
				};
			}

			const rotatedStickers: Partial<Record<FaceKey, number>> = {};
			for (const [faceKey, color] of Object.entries(cubie.stickers) as [FaceKey, number][]) {
				rotatedStickers[faceKeyFromVector(rotateVector(FACE_VECTORS[faceKey], def.axis, turnDir))] =
					color;
			}

			return {
				id: cubie.id,
				pos: rotateVector(cubie.pos, def.axis, turnDir),
				stickers: rotatedStickers
			};
		});
	}

	function applySequence(state: Cubie[], sequence: string[]): Cubie[] {
		let current = state;
		for (const move of sequence) {
			current = applyMove(current, move);
		}
		return current;
	}

	function isSolved(state: Cubie[]): boolean {
		return state.every((cubie) =>
			(Object.entries(cubie.stickers) as [FaceKey, number][]).every(
				([faceKey, color]) => SOLVED_FACE_COLORS[faceKey] === color
			)
		);
	}

	function easing(t: number): number {
		return 1 - Math.pow(1 - t, 3);
	}

	function cssTurnAngle(axis: Axis, angle: number): number {
		return axis === 'y' ? angle : -angle;
	}

	function cubieTransform(cubie: Cubie, turn: ActiveTurn | null): string {
		const x = cubie.pos[0];
		const y = -cubie.pos[1];
		const z = cubie.pos[2];
		const translate = `translate3d(calc(var(--step) * ${x}), calc(var(--step) * ${y}), calc(var(--step) * ${z}))`;

		if (!turn || cubie.pos[turn.axisIndex] !== turn.layer) return translate;

		const angle = cssTurnAngle(turn.axis, turn.angle);
		if (turn.axis === 'x') return `rotateX(${angle}deg) ${translate}`;
		if (turn.axis === 'y') return `rotateY(${angle}deg) ${translate}`;
		return `rotateZ(${angle}deg) ${translate}`;
	}

	function sceneTransform(pitch: number, yaw: number): string {
		return `rotateX(${pitch}deg) rotateY(${yaw}deg)`;
	}

	let cubeState = $state(createSolvedCubies());
	let moveSequence: string[] = $state([]);
	let isPlaying = $state(false);
	let cycleCount = $state(0);
	let speed = $state(260);
	let activeTurn = $state<ActiveTurn | null>(null);
	let viewPitch = $state(-27);
	let viewYaw = $state(39);
	let isDragging = $state(false);

	let playToken = 0;
	let animationFrame: number | undefined;
	let pauseTimeout: ReturnType<typeof setTimeout> | undefined;
	let viewportEl: HTMLDivElement | null = null;
	let dragPointerId: number | null = null;
	let dragStartX = 0;
	let dragStartY = 0;
	let dragStartPitch = 0;
	let dragStartYaw = 0;

	const solved = $derived(isSolved(cubeState));

	function addMove(move: string) {
		if (isPlaying) return;
		moveSequence = [...moveSequence, move];
	}

	function deleteLast() {
		if (isPlaying) return;
		moveSequence = moveSequence.slice(0, -1);
	}

	function clearAsyncState() {
		if (animationFrame !== undefined) {
			cancelAnimationFrame(animationFrame);
			animationFrame = undefined;
		}
		if (pauseTimeout !== undefined) {
			clearTimeout(pauseTimeout);
			pauseTimeout = undefined;
		}
		activeTurn = null;
	}

	function stop() {
		playToken += 1;
		isPlaying = false;
		clearAsyncState();
	}

	function clearAll() {
		stop();
		moveSequence = [];
		cubeState = createSolvedCubies();
		cycleCount = 0;
	}

	function reset() {
		stop();
		cubeState = createSolvedCubies();
		cycleCount = 0;
	}

	function resetView() {
		viewPitch = -27;
		viewYaw = 39;
	}

	function animateMove(move: string, duration: number, token: number): Promise<boolean> {
		const base = move.replace("'", '');
		const inverse = move.includes("'");
		const def = MOVE_DEFS[base];
		if (!def) return Promise.resolve(true);
		const targetAngle = (inverse ? -def.dir : def.dir) * 90;

		return new Promise((resolve) => {
			const start = performance.now();
			activeTurn = { ...def, move, angle: 0 };

			const frame = (now: number) => {
				if (token !== playToken) {
					animationFrame = undefined;
					activeTurn = null;
					resolve(false);
					return;
				}

				const progress = duration <= 0 ? 1 : Math.min((now - start) / duration, 1);
				activeTurn = { ...def, move, angle: targetAngle * easing(progress) };

				if (progress < 1) {
					animationFrame = requestAnimationFrame(frame);
					return;
				}

				animationFrame = undefined;
				cubeState = applyMove(cubeState, move);
				activeTurn = null;
				resolve(true);
			};

			animationFrame = requestAnimationFrame(frame);
		});
	}

	function wait(ms: number, token: number): Promise<boolean> {
		return new Promise((resolve) => {
			pauseTimeout = setTimeout(() => {
				pauseTimeout = undefined;
				resolve(token === playToken);
			}, ms);
		});
	}

	async function play() {
		if (moveSequence.length === 0 || isPlaying) return;

		playToken += 1;
		const token = playToken;
		clearAsyncState();

		isPlaying = true;
		cubeState = createSolvedCubies();
		cycleCount = 0;

		while (token === playToken) {
			for (const move of moveSequence) {
				const completed = await animateMove(move, speed, token);
				if (!completed) return;
			}

			cycleCount += 1;
			if (isSolved(cubeState)) break;

			const keepGoing = await wait(Math.max(45, Math.round(speed * 0.18)), token);
			if (!keepGoing) return;
		}

		if (token !== playToken) return;
		isPlaying = false;
		activeTurn = null;
	}

	function computeInstant() {
		if (moveSequence.length === 0) return;

		stop();
		let state = createSolvedCubies();
		let count = 0;
		do {
			state = applySequence(state, moveSequence);
			count += 1;
		} while (!isSolved(state) && count < 2000);

		cubeState = state;
		cycleCount = count;
	}

	function clampPitch(pitch: number): number {
		return Math.max(-85, Math.min(85, pitch));
	}

	function handlePointerDown(event: PointerEvent) {
		if (event.pointerType !== 'touch' && event.button !== 0) return;
		dragPointerId = event.pointerId;
		isDragging = true;
		dragStartX = event.clientX;
		dragStartY = event.clientY;
		dragStartPitch = viewPitch;
		dragStartYaw = viewYaw;
		viewportEl?.setPointerCapture(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent) {
		if (event.pointerId !== dragPointerId) return;
		const dx = event.clientX - dragStartX;
		const dy = event.clientY - dragStartY;
		viewYaw = dragStartYaw + dx * 0.38;
		viewPitch = clampPitch(dragStartPitch - dy * 0.32);
	}

	function handlePointerUp(event: PointerEvent) {
		if (event.pointerId !== dragPointerId) return;
		isDragging = false;
		viewportEl?.releasePointerCapture(event.pointerId);
		dragPointerId = null;
	}

	onDestroy(() => {
		clearAsyncState();
	});
</script>

<div class="not-prose mx-auto max-w-2xl space-y-5">
	<div class="flex justify-center">
		<div class="cube-stage">
			<div
				bind:this={viewportEl}
				class:dragging={isDragging}
				class="cube-viewport"
				role="img"
				aria-label="Interactive 3D Rubik's cube showing the current state of the selected move sequence"
				onpointerdown={handlePointerDown}
				onpointermove={handlePointerMove}
				onpointerup={handlePointerUp}
				onpointercancel={handlePointerUp}
			>
				<div class="scene" style:transform={sceneTransform(viewPitch, viewYaw)}>
					<div class="cube">
						{#each cubeState as cubie (cubie.id)}
							<div class="cubie" style:transform={cubieTransform(cubie, activeTurn)}>
								{#each FACE_KEYS as faceKey (faceKey)}
									<div class="cubie-face" style:transform={FACE_TRANSFORMS[faceKey]}>
										{#if cubie.stickers[faceKey] !== undefined}
											<div
												class="sticker"
												style:background={COLORS[cubie.stickers[faceKey] as number]}
												title={`${FACE_LABELS[faceKey]} face`}
											></div>
										{/if}
									</div>
								{/each}
							</div>
						{/each}
					</div>
				</div>
			</div>
			<div
				class="mt-3 flex items-center justify-between gap-3 text-xs font-medium tracking-[0.22em] text-ocean-500 uppercase"
			>
				<span>Drag to rotate</span>
				<button
					class="rounded-full border border-ocean-200 bg-white px-3 py-1.5 text-[0.65rem] tracking-[0.18em] text-ocean-700 transition-colors hover:bg-ocean-50"
					onclick={resetView}
				>
					Reset view
				</button>
			</div>
		</div>
	</div>

	<div class="rounded-lg border border-ocean-200 bg-ocean-50/50 px-4 py-3">
		<div class="mb-1 text-xs font-medium tracking-wider text-ocean-500 uppercase">Sequence</div>
		<div class="min-h-[1.75rem] font-mono text-sm text-ocean-900">
			{#if moveSequence.length > 0}
				{moveSequence.join(' ')}
			{:else}
				<span class="text-ocean-400">No moves selected</span>
			{/if}
		</div>
	</div>

	<div class="grid grid-cols-6 gap-2">
		{#each MOVES as move (move)}
			<button
				class="rounded-lg border border-ocean-200 bg-white px-2 py-2.5 text-sm font-semibold text-ocean-900 transition-colors hover:bg-ocean-100 disabled:opacity-40"
				disabled={isPlaying}
				onclick={() => addMove(move)}
			>
				{move}
			</button>
		{/each}
		{#each MOVES as move (`${move}-inverse`)}
			<button
				class="rounded-lg border border-ocean-200 bg-white px-2 py-2.5 text-sm font-semibold text-ocean-900 transition-colors hover:bg-ocean-100 disabled:opacity-40"
				disabled={isPlaying}
				onclick={() => addMove(`${move}'`)}
			>
				{move}'
			</button>
		{/each}
	</div>

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

	<div class="flex items-center gap-3 text-sm text-ocean-600">
		<span>Turn speed</span>
		<input
			type="range"
			min="120"
			max="700"
			step="20"
			bind:value={speed}
			class="flex-1 accent-ocean-700"
			disabled={isPlaying}
		/>
		<span class="w-16 text-right font-mono text-xs">{speed}ms</span>
	</div>

	{#if cycleCount > 0}
		<div class="rounded-lg border border-ocean-200 bg-ocean-50/50 px-4 py-3 text-center">
			{#if solved && !isPlaying}
				<div class="text-lg font-bold text-ocean-900">Cycle length: {cycleCount}</div>
				<div class="text-sm text-ocean-600">
					The cube returned to its solved state after {cycleCount} repetition{cycleCount === 1
						? ''
						: 's'}.
				</div>
			{:else}
				<div class="font-mono text-ocean-700">
					Iteration {cycleCount}{isPlaying ? '...' : ''}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.cube-stage {
		--cube-size: clamp(16rem, 64vw, 22rem);
		--gap: clamp(0.22rem, 0.9vw, 0.34rem);
		--cubie: calc((var(--cube-size) - var(--gap) * 2) / 3);
		--step: calc(var(--cubie) + var(--gap));
		--half-cubie: calc(var(--cubie) / 2);
		width: min(100%, calc(var(--cube-size) + 1rem));
		perspective: 1100px;
	}

	.cube-viewport {
		position: relative;
		width: var(--cube-size);
		height: var(--cube-size);
		margin: 0 auto;
		overflow: hidden;
		border-radius: 1.6rem;
		border: 1px solid rgba(125, 168, 198, 0.32);
		background:
			radial-gradient(circle at 26% 20%, rgba(255, 255, 255, 0.95), transparent 34%),
			radial-gradient(circle at 70% 78%, rgba(14, 116, 144, 0.18), transparent 32%),
			linear-gradient(145deg, rgba(240, 249, 255, 0.94), rgba(226, 232, 240, 0.92));
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.75),
			0 24px 60px rgba(15, 23, 42, 0.12);
		cursor: grab;
		touch-action: none;
		user-select: none;
	}

	.cube-viewport.dragging {
		cursor: grabbing;
	}

	.cube-viewport::after {
		content: '';
		position: absolute;
		inset: 8% 10%;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(15, 23, 42, 0.18), transparent 68%);
		filter: blur(16px);
		transform: translateY(36%);
	}

	.scene {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		transform-style: preserve-3d;
	}

	.cube {
		position: relative;
		width: 0;
		height: 0;
		transform-style: preserve-3d;
	}

	.cubie {
		position: absolute;
		top: 50%;
		left: 50%;
		width: var(--cubie);
		height: var(--cubie);
		margin-top: calc(var(--cubie) / -2);
		margin-left: calc(var(--cubie) / -2);
		transform-style: preserve-3d;
		will-change: transform;
	}

	.cubie-face {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		border-radius: 0.45rem;
		background: linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.86));
		border: 1px solid rgba(148, 163, 184, 0.12);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.03),
			inset 0 -10px 14px rgba(0, 0, 0, 0.12);
		backface-visibility: hidden;
	}

	.sticker {
		position: absolute;
		inset: 9%;
		border-radius: 0.34rem;
		border: 1px solid rgba(255, 255, 255, 0.38);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.26),
			inset 0 -8px 14px rgba(0, 0, 0, 0.16);
	}

	@media (max-width: 640px) {
		.cube-stage {
			--cube-size: min(78vw, 18rem);
		}

		.cubie-face {
			border-radius: 0.32rem;
		}

		.sticker {
			border-radius: 0.24rem;
		}
	}
</style>
