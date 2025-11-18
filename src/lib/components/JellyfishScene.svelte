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
	let mouseX = -1000;
	let mouseY = -1000;
	let bubbles: Bubble[] = [];
	let isMouseDown = false;
	let bubbleSpawnTimer = 0;
	let jellyfishSpawnTimer = 0;
	let sparkles: Sparkle[] = [];
	let konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
	let konamiProgress = 0;
	let partyMode = false;

	type Sparkle = {
		x: number;
		y: number;
		size: number;
		angle: number;
		speed: number;
		opacity: number;
		life: number;
		maxLife: number;
	};

	type Particle = {
		x: number;
		y: number;
		size: number;
		speed: number;
		drift: number;
		opacity: number;
	};

	type Bubble = {
		x: number;
		y: number;
		size: number;
		speed: number;
		wobble: number;
		wobbleSpeed: number;
		opacity: number;
		life: number;
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
		fade = 0;
		velocityX = 0;
		velocityY = 0;
		active = false;
		isShiny = false;

		constructor() {
			this.randomize();
		}

		randomize() {
			const safeHeight = Math.max(height, 1);
			const safeWidth = Math.max(width, 1);
			this.baseRadius = 26 + Math.random() * 38;
			this.x = Math.random() * safeWidth;
			this.anchorX = this.x;
			this.y = safeHeight + Math.random() * safeHeight * 0.4;
			this.riseSpeed = 16 + Math.random() * 22;
			this.swayAmplitude = 10 + Math.random() * 22;
			this.waveSpeed = 0.8 + Math.random() * 0.6;
			this.drift = (Math.random() - 0.5) * 10;
			this.glow = 0.25 + Math.random() * 0.25;
			this.pulseOffset = Math.random() * Math.PI * 2;
			this.time = Math.random() * 6;
			this.fade = 0;
			this.velocityX = 0;
			this.velocityY = 0;
			this.active = true;

			// 5% chance of being shiny
			this.isShiny = Math.random() < 0.05;
			if (this.isShiny) {
				this.glow = 0.6 + Math.random() * 0.3; // Shiny jellyfish glow more
			}

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
			if (!this.active) return;

			const seconds = delta / 1000;
			this.time += seconds;
			const sceneHeight = Math.max(height, 1);

			// Mouse avoidance behavior
			const distToMouse = Math.sqrt(Math.pow(this.x - mouseX, 2) + Math.pow(this.y - mouseY, 2));
			const avoidRadius = 250;

			if (distToMouse < avoidRadius) {
				const avoidStrength = (1 - distToMouse / avoidRadius) * 80;
				const angle = Math.atan2(this.y - mouseY, this.x - mouseX);
				this.velocityX += Math.cos(angle) * avoidStrength * seconds;
				this.velocityY += Math.sin(angle) * avoidStrength * seconds;
			}

			// Apply velocity with damping
			this.velocityX *= 0.92;
			this.velocityY *= 0.92;

			this.y -= this.riseSpeed * seconds;
			this.y += this.velocityY * seconds;
			this.anchorX += this.drift * seconds;
			this.anchorX += this.velocityX * seconds;

			const sway = Math.sin((this.time + this.pulseOffset) * this.waveSpeed) * this.swayAmplitude;
			this.x = this.anchorX + sway;

			const fadeInStart = sceneHeight * 0.85;
			const fadeInEnd = sceneHeight * 1.08;
			const fadeOutStart = -sceneHeight * 0.3;
			const fadeOutEnd = -sceneHeight * 0.5;

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

			// Check if fully faded and well off screen, then deactivate
			if (this.y < fadeOutEnd - sceneHeight * 0.1) {
				this.active = false;
			}
		}

		draw(ctx: CanvasRenderingContext2D) {
			if (this.fade <= 0) return;
			ctx.save();
			ctx.globalAlpha *= Math.min(1, Math.max(0, this.fade));

			// Party mode: draw pulsing aura
			if (partyMode) {
				const pulseIntensity = 0.5 + Math.sin(this.time * 3 + this.pulseOffset) * 0.5;
				const auraRadius = this.baseRadius * (2 + pulseIntensity * 1.5);
				const auraGradient = ctx.createRadialGradient(
					this.x,
					this.y,
					this.baseRadius * 0.5,
					this.x,
					this.y,
					auraRadius
				);

				if (this.isShiny) {
					auraGradient.addColorStop(0, `rgba(255, 220, 100, ${0.4 * pulseIntensity})`);
					auraGradient.addColorStop(0.5, `rgba(255, 200, 80, ${0.2 * pulseIntensity})`);
					auraGradient.addColorStop(1, 'rgba(255, 180, 50, 0)');
				} else {
					auraGradient.addColorStop(0, `rgba(120, 200, 255, ${0.4 * pulseIntensity})`);
					auraGradient.addColorStop(0.5, `rgba(80, 160, 255, ${0.2 * pulseIntensity})`);
					auraGradient.addColorStop(1, 'rgba(40, 120, 255, 0)');
				}

				ctx.save();
				ctx.globalCompositeOperation = 'screen';
				ctx.fillStyle = auraGradient;
				ctx.beginPath();
				ctx.arc(this.x, this.y, auraRadius, 0, Math.PI * 2);
				ctx.fill();
				ctx.restore();
			}
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

			if (this.isShiny) {
				// Golden/shiny jellyfish colors
				gradient.addColorStop(0, `rgba(255, 250, 200, ${0.9 + this.glow * 0.1})`);
				gradient.addColorStop(0.35, `rgba(255, 230, 150, ${0.65 + this.glow * 0.25})`);
				gradient.addColorStop(0.8, `rgba(200, 160, 80, ${0.35 + this.glow * 0.2})`);
				gradient.addColorStop(1, 'rgba(50, 30, 10, 0)');
			} else {
				// Normal jellyfish colors
				gradient.addColorStop(0, `rgba(255, 255, 255, ${0.78 + this.glow * 0.35})`);
				gradient.addColorStop(0.35, `rgba(205, 240, 255, ${0.32 + this.glow * 0.35})`);
				gradient.addColorStop(0.8, `rgba(45, 125, 200, ${0.16 + this.glow * 0.25})`);
				gradient.addColorStop(1, 'rgba(4, 18, 38, 0)');
			}

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
			if (this.isShiny) {
				ctx.shadowColor = `rgba(255, 220, 120, ${0.6 + this.glow * 0.4})`;
				ctx.shadowBlur = 30;
			} else {
				ctx.shadowColor = `rgba(115, 192, 255, ${0.35 + this.glow * 0.5})`;
				ctx.shadowBlur = 20;
			}
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

			// Back tentacles (darker, behind the bell)
			ctx.save();
			ctx.lineWidth = 1.2;
			ctx.lineCap = 'round';
			if (this.isShiny) {
				ctx.strokeStyle = `rgba(180, 150, 80, ${0.25 + this.glow * 0.2})`;
				ctx.shadowColor = `rgba(200, 160, 60, ${0.2 + this.glow * 0.4})`;
				ctx.shadowBlur = 15;
			} else {
				ctx.strokeStyle = `rgba(100, 150, 200, ${0.18 + this.glow * 0.15})`;
				ctx.shadowColor = `rgba(80, 140, 180, ${0.15 + this.glow * 0.3})`;
				ctx.shadowBlur = 10;
			}
			const rimBase = this.y + radius * 0.28;
			const depth = radius * 0.2;

			for (const tentacle of this.tentacles) {
				ctx.beginPath();
				const rimAngle = (tentacle.relative - 0.5) * Math.PI * 0.85;
				const startX = this.x + Math.sin(rimAngle) * radius * 0.85;
				const startY = rimBase - Math.cos(rimAngle) * depth * 1.2; // Higher up on back side
				ctx.moveTo(startX, startY);
				const segments = 18;

				for (let i = 1; i <= segments; i += 1) {
					const progress = i / segments;
					const waveStrength = Math.pow(progress, 1.4);
					const wave =
						Math.sin(this.time * tentacle.speed + tentacle.phase + progress * Math.PI * 2 + Math.PI * 0.3) *
						tentacle.amplitude *
						waveStrength *
						(1 - progress * 0.45);
					const easing = progress * progress;
					const px = startX + wave;
					const py = startY + tentacle.length * easing * 0.95; // Slightly shorter
					ctx.lineTo(px, py);
				}

				ctx.stroke();
			}

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

			// Front tentacles (brighter, in front of the bell)
			ctx.save();
			ctx.lineWidth = 1.4;
			ctx.lineCap = 'round';
			if (this.isShiny) {
				ctx.strokeStyle = `rgba(255, 230, 150, ${0.5 + this.glow * 0.3})`;
				ctx.shadowColor = `rgba(255, 220, 120, ${0.4 + this.glow * 0.6})`;
				ctx.shadowBlur = 20;
			} else {
				ctx.strokeStyle = `rgba(174, 220, 255, ${0.32 + this.glow * 0.25})`;
				ctx.shadowColor = `rgba(120, 210, 255, ${0.2 + this.glow * 0.5})`;
				ctx.shadowBlur = 14;
			}

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

	function spawnBubbles(x: number, y: number, count: number = 8) {
		for (let i = 0; i < count; i++) {
			bubbles.push({
				x: x + (Math.random() - 0.5) * 20,
				y: y + (Math.random() - 0.5) * 20,
				size: 2 + Math.random() * 6,
				speed: 30 + Math.random() * 50,
				wobble: Math.random() * Math.PI * 2,
				wobbleSpeed: 2 + Math.random() * 3,
				opacity: 0.3 + Math.random() * 0.4,
				life: 0
			});
		}
	}

	function spawnSparkles(x: number, y: number) {
		const count = 20 + Math.floor(Math.random() * 15);
		for (let i = 0; i < count; i++) {
			const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
			sparkles.push({
				x,
				y,
				size: 2 + Math.random() * 4,
				angle,
				speed: 50 + Math.random() * 100,
				opacity: 0.8 + Math.random() * 0.2,
				life: 0,
				maxLife: 0.8 + Math.random() * 0.6
			});
		}
	}

	function drawBubbles(delta: number) {
		if (!ctx) return;
		const seconds = delta / 1000;

		for (let i = bubbles.length - 1; i >= 0; i--) {
			const bubble = bubbles[i];
			bubble.life += seconds;
			bubble.wobble += bubble.wobbleSpeed * seconds;
			bubble.y -= bubble.speed * seconds;
			bubble.x += Math.sin(bubble.wobble) * 15 * seconds;

			// Fade out over lifetime
			const fadeStart = 2;
			if (bubble.life > fadeStart) {
				bubble.opacity *= 0.95;
			}

			// Remove if off screen or too faded
			if (bubble.y < -10 || bubble.opacity < 0.01) {
				bubbles.splice(i, 1);
				continue;
			}

			// Draw bubble with shine
			ctx.save();
			ctx.globalAlpha = bubble.opacity;

			// Main bubble
			ctx.beginPath();
			ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
			ctx.strokeStyle = 'rgba(180, 220, 255, 0.6)';
			ctx.lineWidth = 1.2;
			ctx.stroke();

			// Shine highlight
			const highlightX = bubble.x - bubble.size * 0.3;
			const highlightY = bubble.y - bubble.size * 0.3;
			const gradient = ctx.createRadialGradient(
				highlightX,
				highlightY,
				0,
				highlightX,
				highlightY,
				bubble.size * 0.6
			);
			gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
			gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
			ctx.fillStyle = gradient;
			ctx.fill();

			ctx.restore();
		}
	}

	function drawSparkles(delta: number) {
		if (!ctx) return;
		const seconds = delta / 1000;

		for (let i = sparkles.length - 1; i >= 0; i--) {
			const sparkle = sparkles[i];
			sparkle.life += seconds;

			if (sparkle.life >= sparkle.maxLife) {
				sparkles.splice(i, 1);
				continue;
			}

			// Move sparkle outward from origin
			sparkle.x += Math.cos(sparkle.angle) * sparkle.speed * seconds;
			sparkle.y += Math.sin(sparkle.angle) * sparkle.speed * seconds;

			// Fade out over lifetime
			const lifeFactor = 1 - sparkle.life / sparkle.maxLife;
			const currentOpacity = sparkle.opacity * lifeFactor;

			ctx.save();
			ctx.globalAlpha = currentOpacity;
			ctx.globalCompositeOperation = 'lighter';

			// Draw star-shaped sparkle
			ctx.fillStyle = 'rgba(255, 240, 150, 1)';
			ctx.shadowColor = 'rgba(255, 220, 100, 0.8)';
			ctx.shadowBlur = 8;

			// Four-pointed star
			ctx.beginPath();
			const size = sparkle.size;
			ctx.moveTo(sparkle.x, sparkle.y - size);
			ctx.lineTo(sparkle.x + size * 0.3, sparkle.y - size * 0.3);
			ctx.lineTo(sparkle.x + size, sparkle.y);
			ctx.lineTo(sparkle.x + size * 0.3, sparkle.y + size * 0.3);
			ctx.lineTo(sparkle.x, sparkle.y + size);
			ctx.lineTo(sparkle.x - size * 0.3, sparkle.y + size * 0.3);
			ctx.lineTo(sparkle.x - size, sparkle.y);
			ctx.lineTo(sparkle.x - size * 0.3, sparkle.y - size * 0.3);
			ctx.closePath();
			ctx.fill();

			ctx.restore();
		}
	}

	function drawScene(delta: number) {
		if (!ctx) return;
		ctx.clearRect(0, 0, width, height);
		const seconds = delta / 1000;
		backgroundPhase += seconds;

		// Spawn bubbles while mouse is down
		if (isMouseDown && mouseX > 0 && mouseY > 0) {
			bubbleSpawnTimer += seconds;
			if (bubbleSpawnTimer > 0.08) {
				spawnBubbles(mouseX, mouseY, 2 + Math.floor(Math.random() * 3));
				bubbleSpawnTimer = 0;
			}
		}

		// Spawn new jellyfish periodically from the pool
		jellyfishSpawnTimer += seconds;
		if (jellyfishSpawnTimer > 4) {
			// Find an inactive jellyfish to reuse
			const inactive = jellyfish.find(j => !j.active);
			if (inactive) {
				inactive.randomize();
			}
			jellyfishSpawnTimer = 0;
		}

		drawBackground();
		drawParticles(delta);
		drawBubbles(delta);
		drawSparkles(delta);

		// Update and draw active jellyfish
		for (const jelly of jellyfish) {
			jelly.update(delta);
			if (jelly.active) {
				jelly.draw(ctx);
			}
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
		// Create pool of 20 jellyfish, start with 3-4 active
		jellyfish = Array.from({ length: 20 }, () => {
			const jelly = new Jellyfish();
			jelly.active = false;
			return jelly;
		});

		// Activate a few to start - some on screen, some from bottom
		const initialCount = 3 + Math.floor(Math.random() * 2);
		for (let i = 0; i < initialCount; i++) {
			jellyfish[i].randomize();

			// Make some start already visible on screen
			if (i < initialCount - 1) {
				const safeHeight = Math.max(height, 1);
				jellyfish[i].y = safeHeight * (0.3 + Math.random() * 0.5);
				jellyfish[i].fade = 0.7 + Math.random() * 0.3;
			}
		}

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

		const onKeyDown = (e: KeyboardEvent) => {
			if (konamiProgress < konamiCode.length && e.key === konamiCode[konamiProgress]) {
				konamiProgress++;
				if (konamiProgress === konamiCode.length) {
					partyMode = !partyMode;
					konamiProgress = 0;
				}
			} else {
				konamiProgress = 0;
			}
		};

		window.addEventListener('keydown', onKeyDown);

		const onMouseMove = (e: MouseEvent) => {
			const rect = canvas.getBoundingClientRect();
			mouseX = e.clientX - rect.left;
			mouseY = e.clientY - rect.top;
		};

		const onMouseLeave = () => {
			mouseX = -1000;
			mouseY = -1000;
			isMouseDown = false;
		};

		const onMouseDown = (e: MouseEvent) => {
			const rect = canvas.getBoundingClientRect();
			mouseX = e.clientX - rect.left;
			mouseY = e.clientY - rect.top;

			// Check if clicked on a shiny jellyfish
			let clickedShiny = false;
			for (const jelly of jellyfish) {
				if (!jelly.active || !jelly.isShiny) continue;

				const dist = Math.sqrt(Math.pow(jelly.x - mouseX, 2) + Math.pow(jelly.y - mouseY, 2));
				if (dist < jelly.baseRadius * 1.2) {
					spawnSparkles(jelly.x, jelly.y);
					clickedShiny = true;
					break;
				}
			}

			if (!clickedShiny) {
				isMouseDown = true;
				bubbleSpawnTimer = 0;
			}
		};

		const onMouseUp = () => {
			isMouseDown = false;
		};

		const onTouchStart = (e: TouchEvent) => {
			e.preventDefault();
			const rect = canvas.getBoundingClientRect();
			const touch = e.touches[0];
			mouseX = touch.clientX - rect.left;
			mouseY = touch.clientY - rect.top;

			// Check if tapped on a shiny jellyfish
			let tappedShiny = false;
			for (const jelly of jellyfish) {
				if (!jelly.active || !jelly.isShiny) continue;

				const dist = Math.sqrt(Math.pow(jelly.x - mouseX, 2) + Math.pow(jelly.y - mouseY, 2));
				if (dist < jelly.baseRadius * 1.2) {
					spawnSparkles(jelly.x, jelly.y);
					tappedShiny = true;
					break;
				}
			}

			if (!tappedShiny) {
				isMouseDown = true;
				bubbleSpawnTimer = 0;
			}
		};

		const onTouchMove = (e: TouchEvent) => {
			e.preventDefault();
			const rect = canvas.getBoundingClientRect();
			const touch = e.touches[0];
			mouseX = touch.clientX - rect.left;
			mouseY = touch.clientY - rect.top;
		};

		const onTouchEnd = () => {
			isMouseDown = false;
			mouseX = -1000;
			mouseY = -1000;
		};

		canvas.addEventListener('mousemove', onMouseMove);
		canvas.addEventListener('mouseleave', onMouseLeave);
		canvas.addEventListener('mousedown', onMouseDown);
		canvas.addEventListener('mouseup', onMouseUp);
		canvas.addEventListener('touchstart', onTouchStart, { passive: false });
		canvas.addEventListener('touchmove', onTouchMove, { passive: false });
		canvas.addEventListener('touchend', onTouchEnd);
		canvas.addEventListener('touchcancel', onTouchEnd);

		return () => {
			if (animationFrame) cancelAnimationFrame(animationFrame);
			resizeObserver.disconnect();
			window.removeEventListener('resize', onWindowResize);
			window.removeEventListener('keydown', onKeyDown);
			canvas.removeEventListener('mousemove', onMouseMove);
			canvas.removeEventListener('mouseleave', onMouseLeave);
			canvas.removeEventListener('mousedown', onMouseDown);
			canvas.removeEventListener('mouseup', onMouseUp);
			canvas.removeEventListener('touchstart', onTouchStart);
			canvas.removeEventListener('touchmove', onTouchMove);
			canvas.removeEventListener('touchend', onTouchEnd);
			canvas.removeEventListener('touchcancel', onTouchEnd);
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
		pointer-events: auto;
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
