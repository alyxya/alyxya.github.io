<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let animationFrame: number | null = null;
	let width = 0;
	let height = 0;
	let lastTime = 0;
	let jellyfish: Jellyfish[] = [];
	let particles: Particle[] = [];
	let backgroundPhase = 0;

	type Particle = {
		x: number;
		y: number;
		size: number;
		speed: number;
		drift: number;
		opacity: number;
	};

	type Tentacle = {
		offset: number;
		relative: number;
		length: number;
		amplitude: number;
		speed: number;
		phase: number;
	};

	class Jellyfish {
		private index: number;
		x = 0;
		y = 0;
		baseRadius = 40;
		riseSpeed = 18;
		swayAmplitude = 20;
		waveSpeed = 1;
		drift = 0;
		glow = 0.3;
		pulseOffset = 0;
		time = Math.random() * 10;
		anchorX = 0;
		tentacles: Tentacle[] = [];
		fade = 1;

		constructor(index: number) {
			this.index = index;
			this.reset(false);
		}

		reset(fromBottom = true) {
			const safeHeight = Math.max(height, 1);
			const safeWidth = Math.max(width, 1);
			this.baseRadius = 26 + Math.random() * 38;
			this.x = Math.random() * safeWidth;
			this.anchorX = this.x;
			this.y = fromBottom ? safeHeight + Math.random() * safeHeight * 0.4 : Math.random() * safeHeight;
			this.riseSpeed = 16 + Math.random() * 22;
			this.swayAmplitude = 10 + Math.random() * 22;
			this.waveSpeed = 0.8 + Math.random() * 0.6;
			this.drift = (Math.random() - 0.5) * 10;
			this.glow = 0.25 + Math.random() * 0.25;
			this.pulseOffset = Math.random() * Math.PI * 2;
			this.time = Math.random() * 6 + this.index;
			this.fade = fromBottom ? 0 : 1;
			const tentacleCount = 10 + Math.floor(Math.random() * 6);
			this.tentacles = [];

			for (let i = 0; i < tentacleCount; i += 1) {
				const relative = tentacleCount === 1 ? 0.5 : i / (tentacleCount - 1);
				this.tentacles.push({
					offset: (relative - 0.5) * this.baseRadius * 1.5,
					relative,
					length: this.baseRadius * (1.6 + Math.random() * 1.2),
					amplitude: 6 + Math.random() * 12,
					speed: 0.8 + Math.random() * 1.2,
					phase: Math.random() * Math.PI * 2
				});
			}
		}

		update(delta: number) {
			const seconds = delta / 1000;
			this.time += seconds;
			const sceneHeight = Math.max(height, 1);
			this.y -= this.riseSpeed * seconds;
			this.anchorX += this.drift * seconds;
			const sway = Math.sin((this.time + this.pulseOffset) * this.waveSpeed) * this.swayAmplitude;
			this.x = this.anchorX + sway;

			const fadeInStart = sceneHeight * 0.85;
			const fadeInEnd = sceneHeight * 1.08;
			const fadeOutStart = -sceneHeight * 0.02;
			const fadeOutEnd = -sceneHeight * 0.22;

			if (this.y > fadeInEnd && this.fade < 1) {
				this.fade = Math.min(1, this.fade + seconds * 0.9);
			} else if (this.y > fadeInStart && this.fade < 1) {
				this.fade = Math.min(1, this.fade + seconds * 0.5);
			} else if (this.y < fadeOutEnd) {
				this.fade = Math.max(0, this.fade - seconds * 0.7);
			} else if (this.y < fadeOutStart) {
				this.fade = Math.max(0, this.fade - seconds * 0.45);
			} else if (this.fade < 1) {
				this.fade = Math.min(1, this.fade + seconds * 0.2);
			}

			if (this.anchorX < -80) this.anchorX = width + 80;
			if (this.anchorX > width + 80) this.anchorX = -80;

			if (this.y < -this.baseRadius * 2) {
				this.reset(true);
			}
		}

		draw(ctx: CanvasRenderingContext2D) {
			if (this.fade <= 0) return;
			ctx.save();
			ctx.globalAlpha *= Math.min(1, Math.max(0, this.fade));
			const radius = this.baseRadius * (1 + Math.sin(this.time * 2 + this.pulseOffset) * 0.08);
				const bellTop = this.y - radius * 0.62;
			const gradient = ctx.createRadialGradient(
				this.x,
				this.y - radius * 0.35,
				radius * 0.1,
				this.x,
				this.y + radius * 0.25,
				radius * 1.5
			);

				gradient.addColorStop(0, `rgba(255, 255, 255, ${0.78 + this.glow * 0.35})`);
				gradient.addColorStop(0.35, `rgba(205, 240, 255, ${0.32 + this.glow * 0.35})`);
				gradient.addColorStop(0.8, `rgba(45, 125, 200, ${0.16 + this.glow * 0.25})`);
				gradient.addColorStop(1, 'rgba(4, 18, 38, 0)');

			const crownTop = bellTop - radius * 0.12;
			const rimY = this.y + radius * 0.08;
			const undersidePeak = this.y + radius * 0.58;
			const rimWidth = radius * 1.05;
			const bellPath = new Path2D();
			bellPath.moveTo(this.x - rimWidth, rimY);
			bellPath.bezierCurveTo(
				this.x - rimWidth * 1.12,
				this.y - radius * 0.2,
				this.x - radius * 0.45,
				crownTop - radius * 0.05,
				this.x,
				crownTop
			);
			bellPath.bezierCurveTo(
				this.x + radius * 0.45,
				crownTop - radius * 0.05,
				this.x + rimWidth * 1.12,
				this.y - radius * 0.2,
				this.x + rimWidth,
				rimY
			);
			bellPath.bezierCurveTo(
				this.x + radius * 0.9,
				this.y + radius * 0.3,
				this.x + radius * 0.55,
				undersidePeak,
				this.x,
				undersidePeak + radius * 0.04
			);
			bellPath.bezierCurveTo(
				this.x - radius * 0.55,
				undersidePeak,
				this.x - radius * 0.9,
				this.y + radius * 0.3,
				this.x - rimWidth,
				rimY
			);
			bellPath.closePath();

			// Bell
			ctx.save();
			ctx.fillStyle = gradient;
			ctx.shadowColor = `rgba(115, 192, 255, ${0.35 + this.glow * 0.5})`;
			ctx.shadowBlur = 20;
			ctx.fill(bellPath);
			ctx.restore();

			// Dome highlight
			ctx.save();
			ctx.globalCompositeOperation = 'lighter';
			ctx.clip(bellPath);
			const highlight = ctx.createRadialGradient(
				this.x,
				crownTop - radius * 0.05,
				radius * 0.15,
				this.x,
				this.y + radius * 0.3,
				radius * 1.1
			);
			highlight.addColorStop(0, `rgba(255, 255, 255, ${0.55 + this.glow * 0.3})`);
			highlight.addColorStop(0.45, `rgba(190, 230, 255, ${0.22 + this.glow * 0.2})`);
			highlight.addColorStop(1, 'rgba(0, 0, 0, 0)');
			ctx.fillStyle = highlight;
			ctx.fillRect(this.x - radius * 1.3, bellTop - radius * 0.4, radius * 2.6, radius * 1.2);
			ctx.restore();

			// Underside shading
			ctx.save();
			const undersideGradient = ctx.createRadialGradient(
				this.x,
				this.y + radius * 0.45,
				radius * 0.2,
				this.x,
				this.y + radius * 0.55,
				radius
			);
			undersideGradient.addColorStop(0, 'rgba(12, 28, 48, 0.15)');
			undersideGradient.addColorStop(1, 'rgba(6, 12, 20, 0)');
			ctx.fillStyle = undersideGradient;
			ctx.beginPath();
			ctx.ellipse(this.x, this.y + radius * 0.5, radius * 0.8, radius * 0.45, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();

			// Tentacles
			ctx.save();
			ctx.lineWidth = 1.4;
			ctx.lineCap = 'round';
			ctx.strokeStyle = `rgba(174, 220, 255, ${0.32 + this.glow * 0.25})`;
			ctx.shadowColor = `rgba(120, 210, 255, ${0.2 + this.glow * 0.5})`;
			ctx.shadowBlur = 14;
			const rimBase = this.y + radius * 0.28;
			const depth = radius * 0.2;

			for (const tentacle of this.tentacles) {
				ctx.beginPath();
				const rimAngle = (tentacle.relative - 0.5) * Math.PI * 0.85;
				const startX = this.x + Math.sin(rimAngle) * radius * 0.85;
				const startY = rimBase + Math.cos(rimAngle) * depth;
				ctx.moveTo(startX, startY);
				const segments = 18;

				for (let i = 1; i <= segments; i += 1) {
					const progress = i / segments;
					const waveStrength = Math.pow(progress, 1.4);
					const wave =
						Math.sin(this.time * tentacle.speed + tentacle.phase + progress * Math.PI * 2) *
						tentacle.amplitude *
						waveStrength *
						(1 - progress * 0.45);
					const easing = progress * progress;
					const px = startX + wave;
					const py = startY + tentacle.length * easing;
					ctx.lineTo(px, py);
				}

				ctx.stroke();
			}

			ctx.restore();
			ctx.restore();
		}
	}

	const createParticle = (spawnY = Math.random() * Math.max(height, 1)): Particle => ({
		x: Math.random() * Math.max(width, 1),
		y: spawnY,
		size: 1 + Math.random() * 2.5,
		speed: 8 + Math.random() * 18,
		drift: (Math.random() - 0.5) * 15,
		opacity: 0.05 + Math.random() * 0.2
	});

	function drawBackground() {
		if (!ctx) return;
		const gradient = ctx.createLinearGradient(0, 0, 0, height);
		gradient.addColorStop(0, 'rgba(3, 19, 41, 0.8)');
		gradient.addColorStop(0.4, 'rgba(5, 32, 63, 0.85)');
		gradient.addColorStop(1, 'rgba(2, 11, 26, 0.95)');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, width, height);

		ctx.save();
		ctx.globalCompositeOperation = 'screen';
		ctx.globalAlpha = 0.12;
		const bandCount = 4;

		for (let i = 0; i < bandCount; i += 1) {
			const startY = (i / bandCount) * height * 0.6 + (backgroundPhase * 60) % (height * 0.3);
			ctx.beginPath();
			ctx.moveTo(0, startY);

			for (let x = 0; x <= width; x += 24) {
				const offset = Math.sin(backgroundPhase * (0.8 + i * 0.2) + x * 0.015 + i) * (18 + i * 6);
				ctx.lineTo(x, startY + offset);
			}

			ctx.lineTo(width, height);
			ctx.lineTo(0, height);
			ctx.closePath();
			ctx.fillStyle = `rgba(80, 178, 255, ${0.05 - i * 0.01})`;
			ctx.fill();
		}

		ctx.restore();
	}

	function drawParticles(delta: number) {
		if (!ctx) return;
		const seconds = delta / 1000;

		for (const particle of particles) {
			particle.y -= particle.speed * seconds;
			particle.x += particle.drift * seconds;

			if (particle.y < -10) {
				Object.assign(particle, createParticle(height + Math.random() * height * 0.4));
			}

			if (particle.x < -10) particle.x = width + 10;
			if (particle.x > width + 10) particle.x = -10;

			ctx.beginPath();
			ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
			ctx.fill();
		}
	}

	function drawScene(delta: number) {
		if (!ctx) return;
		ctx.clearRect(0, 0, width, height);
		backgroundPhase += delta / 1000;

		drawBackground();
		drawParticles(delta);

		for (const jelly of jellyfish) {
			jelly.update(delta);
			jelly.draw(ctx);
		}
	}

	function handleResize() {
		if (!canvas || !ctx) return;
		const dpr = window.devicePixelRatio || 1;
		const { clientWidth, clientHeight } = canvas;
		width = clientWidth;
		height = clientHeight;
		canvas.width = clientWidth * dpr;
		canvas.height = clientHeight * dpr;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.scale(dpr, dpr);
	}

	function initScene() {
		jellyfish = Array.from({ length: 7 }, (_, index) => new Jellyfish(index));
		particles = Array.from({ length: 60 }, () => createParticle());
	}

	function animate(now: number) {
		if (!ctx) return;
		if (!lastTime) lastTime = now;
		const delta = now - lastTime;
		lastTime = now;
		drawScene(delta);
		animationFrame = requestAnimationFrame(animate);
	}

	onMount(() => {
		ctx = canvas.getContext('2d');
		if (!ctx) return;

		handleResize();
		initScene();
		animationFrame = requestAnimationFrame(animate);

		const resizeObserver = new ResizeObserver(() => handleResize());
		resizeObserver.observe(canvas);

		const onWindowResize = () => handleResize();
		window.addEventListener('resize', onWindowResize);

		return () => {
			if (animationFrame) cancelAnimationFrame(animationFrame);
			resizeObserver.disconnect();
			window.removeEventListener('resize', onWindowResize);
		};
	});

	onDestroy(() => {
		if (animationFrame) cancelAnimationFrame(animationFrame);
	});
</script>

<div class="scene" aria-hidden="true">
	<canvas bind:this={canvas} class="ocean-canvas"></canvas>
	<div class="surface-glow"></div>
	<div class="light-rays"></div>
</div>

<style>
	.scene {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.ocean-canvas {
		width: 100%;
		height: 100%;
		display: block;
		filter: saturate(1.15);
	}

	.surface-glow {
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at 50% -20%, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0));
		mix-blend-mode: screen;
	}

	.light-rays {
		position: absolute;
		inset: 0;
		background-image: repeating-linear-gradient(
				120deg,
				transparent 0,
				transparent 70px,
				rgba(255, 255, 255, 0.05) 120px,
				transparent 170px
			),
			repeating-linear-gradient(
				100deg,
				transparent 0,
				transparent 40px,
				rgba(255, 255, 255, 0.04) 120px,
				transparent 170px
			);
		opacity: 0.35;
		mix-blend-mode: screen;
		animation: drift 22s linear infinite;
	}

	@keyframes drift {
		from {
			transform: translate3d(-40px, 0, 0) rotate(0deg);
		}

		to {
			transform: translate3d(40px, 0, 0) rotate(2deg);
		}
	}
</style>
