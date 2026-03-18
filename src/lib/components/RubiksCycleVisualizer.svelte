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
	const MOVE_COLOR_INDEX: Record<string, number> = {
		R: 1, L: 4, U: 0, D: 3, F: 2, B: 5
	};
	const MOVE_FACE_NAME: Record<string, string> = {
		R: 'right', L: 'left', U: 'top', D: 'bottom', F: 'front', B: 'back'
	};

	function moveColor(move: string): string {
		return COLORS[MOVE_COLOR_INDEX[move.replace("'", '')] ?? 0];
	}

	function moveIsLight(move: string): boolean {
		const base = move.replace("'", '');
		return base === 'U' || base === 'D';
	}

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

	function cubieTransform(cubie: Cubie, turn: ActiveTurn | null): string {
		const x = cubie.pos[0];
		const y = -cubie.pos[1];
		const z = cubie.pos[2];
		const translate = `translate3d(calc(var(--step) * ${x}), calc(var(--step) * ${y}), calc(var(--step) * ${z}))`;

		if (!turn || cubie.pos[turn.axisIndex] !== turn.layer) return translate;

		const angle = turn.axis === 'y' ? turn.angle : -turn.angle;
		if (turn.axis === 'x') return `rotateX(${angle}deg) ${translate}`;
		if (turn.axis === 'y') return `rotateY(${angle}deg) ${translate}`;
		return `rotateZ(${angle}deg) ${translate}`;
	}

	function mulMat(a: number[], b: number[]): number[] {
		return [
			a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
			a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
			a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
			a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
			a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
			a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
			a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
			a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
			a[6] * b[2] + a[7] * b[5] + a[8] * b[8]
		];
	}

	function rotX(a: number): number[] {
		const c = Math.cos(a), s = Math.sin(a);
		return [1, 0, 0, 0, c, -s, 0, s, c];
	}

	function rotY(a: number): number[] {
		const c = Math.cos(a), s = Math.sin(a);
		return [c, 0, s, 0, 1, 0, -s, 0, c];
	}

	function initialViewMatrix(): number[] {
		const p = -27 * Math.PI / 180;
		const y = 39 * Math.PI / 180;
		return mulMat(rotX(p), rotY(y));
	}

	function sceneTransform(m: number[]): string {
		return `scale3d(0.55, 0.55, 0.55) matrix3d(${m[0]},${m[3]},${m[6]},0,${m[1]},${m[4]},${m[7]},0,${m[2]},${m[5]},${m[8]},0,0,0,0,1)`;
	}

	let cubeState = $state(createSolvedCubies());
	let moveSequence: string[] = $state([]);
	let isPlaying = $state(false);
	let speed = $state(2);
	let activeTurn = $state<ActiveTurn | null>(null);
	let viewMatrix = $state(initialViewMatrix());
	let isDragging = $state(false);

	let playToken = 0;
	let animationFrame: number | undefined;
	let pauseTimeout: ReturnType<typeof setTimeout> | undefined;
	let viewportEl: HTMLDivElement | null = null;
	let dragPointerId: number | null = null;
	let lastPointerX = 0;
	let lastPointerY = 0;

	const duration = $derived(1000 / speed);

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
		cubeState = createSolvedCubies();
	}

	function clearAll() {
		stop();
		moveSequence = [];
		cubeState = createSolvedCubies();
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

		while (token === playToken) {
			for (const move of moveSequence) {
				const completed = await animateMove(move, duration, token);
				if (!completed) return;
			}

			if (isSolved(cubeState)) break;

			const keepGoing = await wait(Math.max(45, Math.round(duration * 0.18)), token);
			if (!keepGoing) return;
		}

		if (token !== playToken) return;
		isPlaying = false;
		activeTurn = null;
	}

	function handlePointerDown(event: PointerEvent) {
		if (event.pointerType !== 'touch' && event.button !== 0) return;
		dragPointerId = event.pointerId;
		isDragging = true;
		lastPointerX = event.clientX;
		lastPointerY = event.clientY;
		viewportEl?.setPointerCapture(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent) {
		if (event.pointerId !== dragPointerId) return;
		const dx = event.clientX - lastPointerX;
		const dy = event.clientY - lastPointerY;
		lastPointerX = event.clientX;
		lastPointerY = event.clientY;
		const s = 0.007;
		viewMatrix = mulMat(mulMat(rotY(dx * s), rotX(-dy * s)), viewMatrix);
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

<div class="not-prose">
	<div class="mx-auto w-fit space-y-3">
		<div class="cube-stage">
				<div
					bind:this={viewportEl}
					class:dragging={isDragging}
					class="cube-viewport"
					role="img"
					aria-label="Interactive 3D Rubik's cube"
					onpointerdown={handlePointerDown}
					onpointermove={handlePointerMove}
					onpointerup={handlePointerUp}
					onpointercancel={handlePointerUp}
				>
					<div class="scene" style:transform={sceneTransform(viewMatrix)}>
						<div class="cube">
							{#each cubeState as cubie (cubie.id)}
								<div class="cubie" style:transform={cubieTransform(cubie, activeTurn)}>
									{#each FACE_KEYS as faceKey (faceKey)}
										<div class="cubie-face" style:transform={FACE_TRANSFORMS[faceKey]}>
											{#if cubie.stickers[faceKey] !== undefined}
												<div
													class="sticker"
													style:background={COLORS[cubie.stickers[faceKey] as number]}
												></div>
											{/if}
										</div>
									{/each}
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>

		<div class="controls">
			<div class="move-grid">
				{#each MOVES as move (move)}
					<button
						class="move-btn"
						class:light={moveIsLight(move)}
						style:background={moveColor(move)}
						disabled={isPlaying}
						onclick={() => addMove(move)}
						aria-label="Turn {MOVE_FACE_NAME[move]} face clockwise"
					><svg class="arrow-icon" viewBox="0 0 16 16"><path d="M12 8a4 4 0 1 1-1.2-2.85" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M12 3v2.5h-2.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
				{/each}
				{#each MOVES as move (`${move}-inv`)}
					<button
						class="move-btn"
						class:light={moveIsLight(move)}
						style:background={moveColor(move)}
						disabled={isPlaying}
						onclick={() => addMove(`${move}'`)}
						aria-label="Turn {MOVE_FACE_NAME[move]} face counterclockwise"
					><svg class="arrow-icon" viewBox="0 0 16 16"><path d="M4 8a4 4 0 1 0 1.2-2.85" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M4 3v2.5h2.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
				{/each}
			</div>

			<div class="flex min-h-[1.5rem] items-center gap-1.5">
				{#if moveSequence.length > 0}
					<div class="flex flex-1 flex-wrap items-center gap-1">
						{#each moveSequence as move, i (i)}
							<span
								class="seq-badge"
								class:light={moveIsLight(move)}
								style:background={moveColor(move)}
							>{#if move.includes("'")}<svg class="badge-icon" viewBox="0 0 16 16"><path d="M4 8a4 4 0 1 0 1.2-2.85" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 3v2.5h2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>{:else}<svg class="badge-icon" viewBox="0 0 16 16"><path d="M12 8a4 4 0 1 1-1.2-2.85" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 3v2.5h-2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>{/if}</span>
						{/each}
					</div>
					<button
						class="text-sm text-ocean-400 transition-colors hover:text-ocean-600 disabled:opacity-30"
						disabled={isPlaying || moveSequence.length === 0}
						onclick={deleteLast}
						aria-label="Delete last move"
					>⌫</button>
					<button
						class="text-xs text-ocean-400 transition-colors hover:text-ocean-600 disabled:opacity-30"
						disabled={isPlaying}
						onclick={clearAll}
					>Clear</button>
				{:else}
					<span class="text-xs text-ocean-300">Click a color to add moves</span>
				{/if}
			</div>

			<div class="flex items-center gap-2">
				{#if isPlaying}
					<button class="play-btn" onclick={stop} aria-label="Stop"><svg viewBox="0 0 16 16" width="14" height="14"><rect x="3" y="3" width="10" height="10" rx="1" fill="currentColor"/></svg></button>
				{:else}
					<button
						class="play-btn"
						disabled={moveSequence.length === 0}
						onclick={play}
						aria-label="Play"
					><svg viewBox="0 0 16 16" width="14" height="14"><path d="M4 2.5v11l9.5-5.5z" fill="currentColor"/></svg></button>
				{/if}
				<input
					type="range"
					min="1"
					max="10"
					step="0.5"
					bind:value={speed}
					class="flex-1 accent-ocean-600"
				/>
				<span class="w-10 text-right font-mono text-xs text-ocean-400">{speed}/s</span>
			</div>
		</div>
	</div>
</div>

<style>
	.cube-stage {
		--cube-size: clamp(16rem, 45vw, 24rem);
		--gap: clamp(0.22rem, 0.9vw, 0.34rem);
		--cubie: calc((var(--cube-size) - var(--gap) * 2) / 3);
		--step: calc(var(--cubie) + var(--gap));
		--half-cubie: calc(var(--cubie) / 2);
		width: var(--cube-size);
		perspective: 1400px;
	}

	.cube-viewport {
		position: relative;
		width: var(--cube-size);
		height: var(--cube-size);
		overflow: hidden;
		border-radius: 0.75rem;
		border: 1px solid rgba(125, 168, 198, 0.2);
		background: linear-gradient(145deg, #f0f9ff, #e2e8f0);
		box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
		cursor: grab;
		touch-action: none;
		user-select: none;
	}

	.cube-viewport.dragging {
		cursor: grabbing;
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
		border-radius: 0.35rem;
		background: linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.85));
		border: 1px solid rgba(148, 163, 184, 0.08);
		box-shadow: inset 0 -6px 10px rgba(0, 0, 0, 0.1);
		backface-visibility: hidden;
	}

	.sticker {
		position: absolute;
		inset: 9%;
		border-radius: 0.28rem;
		border: 1px solid rgba(255, 255, 255, 0.3);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.2),
			inset 0 -6px 10px rgba(0, 0, 0, 0.12);
	}

	.controls {
		width: calc(2.4rem * 6 + 4px * 5);
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.move-grid {
		display: grid;
		grid-template-columns: repeat(6, 2.4rem);
		gap: 4px;
	}

	.move-btn {
		width: 2.4rem;
		height: 2.4rem;
		border-radius: 0.4rem;
		border: 1px solid rgba(0, 0, 0, 0.1);
		display: grid;
		place-items: center;
		color: rgba(255, 255, 255, 0.9);
		cursor: pointer;
		transition: opacity 0.15s;
	}

	.move-btn.light {
		color: rgba(0, 0, 0, 0.45);
		border-color: rgba(0, 0, 0, 0.18);
		box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
	}

	.arrow-icon {
		width: 1.1rem;
		height: 1.1rem;
	}

	.badge-icon {
		width: 0.85rem;
		height: 0.85rem;
	}

	.move-btn:hover:not(:disabled) {
		opacity: 0.8;
	}

	.move-btn:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.play-btn {
		padding: 0.4rem 0.75rem;
		border-radius: 0.35rem;
		border: 1px solid rgba(125, 168, 198, 0.3);
		background: white;
		display: grid;
		place-items: center;
		color: #475569;
		cursor: pointer;
		transition: background-color 0.15s;
		flex-shrink: 0;
	}

	.play-btn:hover:not(:disabled) {
		background: #f0f9ff;
	}

	.play-btn:disabled {
		opacity: 0.3;
		cursor: default;
	}

	.seq-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 50%;
		color: rgba(255, 255, 255, 0.9);
		border: 1px solid rgba(0, 0, 0, 0.1);
	}

	.seq-badge.light {
		color: rgba(0, 0, 0, 0.45);
		border-color: rgba(0, 0, 0, 0.12);
	}

	@media (max-width: 767px) {
		.cube-stage {
			--cube-size: clamp(12rem, calc(100vw - 3rem), 20rem);
		}

		.cubie-face {
			border-radius: 0.25rem;
		}

		.sticker {
			border-radius: 0.2rem;
		}
	}
</style>
