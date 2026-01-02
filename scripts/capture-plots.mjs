import path from 'node:path';
import fs from 'node:fs/promises';
import process from 'node:process';

const args = process.argv.slice(2);
const getArg = (name) => {
	const index = args.indexOf(name);
	return index === -1 ? undefined : args[index + 1];
};

const postSlug = getArg('--post') || getArg('--slug') || process.env.PLOT_CAPTURE_POST;
const baseUrl = getArg('--base-url') || process.env.PLOT_CAPTURE_BASE_URL || 'http://localhost:5173/blog';
const explicitUrl = getArg('--url') || process.env.PLOT_CAPTURE_URL;
const targetUrl =
	explicitUrl ||
	(postSlug
		? `${baseUrl.replace(/\/$/, '')}/${postSlug.replace(/^\/+/, '')}`
		: undefined);
const outputRoot = getArg('--output') || process.env.PLOT_CAPTURE_OUTPUT || path.join(process.cwd(), 'static');
const viewportWidth = Number(getArg('--width') || process.env.PLOT_CAPTURE_WIDTH || 1200);
const viewportHeight = Number(getArg('--height') || process.env.PLOT_CAPTURE_HEIGHT || 1600);
const captureScaleInput = Number(getArg('--scale') || process.env.PLOT_CAPTURE_SCALE || 1);
const captureScale = Number.isFinite(captureScaleInput) && captureScaleInput > 0 ? captureScaleInput : 1;

if (!targetUrl) {
	console.error('Missing required --post (or --url/PLOT_CAPTURE_URL).');
	console.error('Example: npm run capture:plots -- --post plot-playground');
	console.error('Optional: --base-url http://localhost:5173/blog');
	process.exit(1);
}

let chromium;
try {
	({ chromium } = await import('playwright'));
} catch (error) {
	console.error('Playwright is required to capture Plotly images.');
	console.error('Install it with: npm i -D playwright && npx playwright install');
	process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({
	viewport: { width: viewportWidth, height: viewportHeight },
	deviceScaleFactor: 1
});
page.setDefaultTimeout(60000);

const normalizeRelativePath = (value) => value.replace(/^(?:\.+\/)+/, '').replace(/^\/+/, '');

const outputPathFromTarget = (target) => {
	if (!target || target.startsWith('data:')) return undefined;
	if (target.startsWith('http://') || target.startsWith('https://')) {
		const parsed = new URL(target);
		return path.join(outputRoot, normalizeRelativePath(parsed.pathname));
	}
	return path.join(outputRoot, normalizeRelativePath(target));
};

const ensureDirectory = async (filePath) => {
	if (!filePath) return;
	await fs.mkdir(path.dirname(filePath), { recursive: true });
};

const parseAspectRatio = (value) => {
	const [width, height] = value.split('/').map((part) => Number(part.trim()));
	if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
		return undefined;
	}
	return { width, height };
};

const waitForPlotReady = async (wrapper) => {
	await page.waitForFunction((element) => {
		const plot = element.querySelector('.js-plotly-plot');
		if (!plot || !plot._fullLayout) return false;
		const opacity = getComputedStyle(plot).opacity;
		return plot._fullLayout.width > 0 && plot._fullLayout.height > 0 && opacity !== '0';
	}, wrapper);
};

const prepareWrapperSize = async (wrapper, aspectRatio) => {
	const parsed = aspectRatio ? parseAspectRatio(aspectRatio) : undefined;
	if (!parsed?.width) return;
	await wrapper.evaluate((element, width) => {
		element.style.width = `${width}px`;
		element.style.maxWidth = `${width}px`;
	}, parsed.width);
};

const exportPlotImage = async (wrapper, scale) =>
	wrapper.evaluate(async (element, options) => {
		const plot = element.querySelector('.js-plotly-plot');
		if (!plot || !plot._fullLayout) {
			return { error: 'plot-not-ready' };
		}
		const Plotly = window.Plotly;
		if (!Plotly?.toImage) {
			return { error: 'plotly-missing' };
		}
		const width = Math.round(plot._fullLayout.width || plot.getBoundingClientRect().width);
		const height = Math.round(plot._fullLayout.height || plot.getBoundingClientRect().height);
		const dataUrl = await Plotly.toImage(plot, { format: 'png', width, height, scale: options.scale });
		return { dataUrl, width, height, scale: options.scale };
	}, { scale });

const captureWrapper = async (wrapper) => {
	const info = await wrapper.evaluate((element) => ({
		imagePath: element.dataset.imagePath || '',
		aspectRatio: element.dataset.aspectRatio || '',
		isLazy: element.dataset.lazy === 'true',
		isInteractive: element.dataset.interactive !== 'false'
	}));

	if (!info.isInteractive) {
		console.warn('Skipping static image without Plotly.');
		return;
	}

	const outputPath = outputPathFromTarget(info.imagePath);
	if (!outputPath) {
		console.warn('Skipping plot with no image path.');
		return;
	}

	await prepareWrapperSize(wrapper, info.aspectRatio);
	await wrapper.scrollIntoViewIfNeeded();

	if (info.isLazy) {
		await wrapper.click();
	}

	await waitForPlotReady(wrapper);
	await page.waitForTimeout(100);

	const result = await exportPlotImage(wrapper, captureScale);
	if (result.error) {
		console.warn(`Failed to export plot (${result.error}).`);
		return;
	}

	const encoded = result.dataUrl.split(',')[1];
	if (!encoded) {
		console.warn('Exported data URL was empty.');
		return;
	}

	await ensureDirectory(outputPath);
	await fs.writeFile(outputPath, Buffer.from(encoded, 'base64'));
	const scaledWidth = Math.round(result.width * (result.scale || 1));
	const scaledHeight = Math.round(result.height * (result.scale || 1));
	console.log(
		`Captured ${path.relative(process.cwd(), outputPath)} (${scaledWidth}x${scaledHeight}, scale ${result.scale || 1})`
	);
};

try {
	await page.goto(targetUrl, { waitUntil: 'networkidle' });
	await page.waitForSelector('.plot-card');

	const metadata = await page.$$eval('.plot-card', (plots) =>
		plots.map((plot, index) => {
			const target = plot.dataset.imagePath || '';
			const isInteractive = plot.dataset.interactive !== 'false';
			return {
				index,
				target,
				isInteractive,
				isSignal: target.includes('/images/posts/plot-playground/signal-') || target.includes('signal-')
			};
		})
	);
	const wrappers = await page.$$('.plot-card');
	const regularPlots = metadata.filter((plot) => plot.target && plot.isInteractive && !plot.isSignal);

	for (const plot of regularPlots) {
		const wrapper = wrappers[plot.index];
		if (wrapper) {
			await captureWrapper(wrapper);
		}
	}

	const signalSelect = await page.$('#signalSelect');
	if (signalSelect) {
		const options = await page.$$eval('#signalSelect option', (items) => items.map((item) => item.value));
		for (const value of options) {
			await page.selectOption('#signalSelect', value);
			await page.waitForTimeout(150);
			const handle = await page.evaluateHandle((targetValue) => {
				const plots = Array.from(document.querySelectorAll('.plot-card'));
				return (
					plots.find((plot) => {
						if (plot.dataset.interactive === 'false') return false;
						const target = plot.dataset.imagePath || '';
						return target.includes(`signal-${targetValue}`);
					}) || null
				);
			}, value);
			const wrapper = handle.asElement();
			if (wrapper) {
				await captureWrapper(wrapper);
			} else {
				console.warn(`Skipping signal "${value}" (wrapper not found).`);
			}
			await handle.dispose();
		}
	}
} finally {
	await browser.close();
}
