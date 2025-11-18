// Plot configurations and data factory functions for all visualizations

const oceanPlotConfig = {
	paper_bgcolor: 'rgba(255,255,255,0.4)',
	plot_bgcolor: 'rgba(255,255,255,0.25)',
	font: { color: 'oklch(35% 0.1 235)' }
};

const ocean3DPlotConfig = {
	paper_bgcolor: 'rgba(255,255,255,0.4)',
	font: { color: 'oklch(35% 0.1 235)' }
};

export function createSineCosineData() {
	return [
		{
			x: Array.from({ length: 100 }, (_, i) => (i * 2 * Math.PI) / 100),
			y: Array.from({ length: 100 }, (_, i) => Math.sin((i * 2 * Math.PI) / 100)),
			type: 'scatter',
			mode: 'lines',
			name: 'sin(x)',
			line: { color: '#3b82f6', width: 2 }
		},
		{
			x: Array.from({ length: 100 }, (_, i) => (i * 2 * Math.PI) / 100),
			y: Array.from({ length: 100 }, (_, i) => Math.cos((i * 2 * Math.PI) / 100)),
			type: 'scatter',
			mode: 'lines',
			name: 'cos(x)',
			line: { color: '#ef4444', width: 2 }
		}
	];
}

export function createSineCosineLayout() {
	return {
		title: 'Trigonometric Functions',
		xaxis: { title: 'x (radians)' },
		yaxis: { title: 'y' },
		hovermode: 'closest',
		autosize: true,
		height: 500,
		...oceanPlotConfig
	};
}

export function createScatterData() {
	return [
		{
			x: [0, 1, 2, 3, 4],
			y: [0, 1, 4, 9, 16],
			type: 'scatter',
			mode: 'lines+markers',
			name: 'Quadratic growth',
			line: { color: '#2563eb' },
			marker: { size: 8 }
		},
		{
			x: [0, 1, 2, 3, 4],
			y: [0, 0.6, 1, 0.6, 0],
			type: 'scatter',
			mode: 'lines',
			name: 'Smoothing kernel',
			line: { color: '#16a34a', dash: 'dash' }
		}
	];
}

export function createScatterLayout() {
	return {
		title: '2D Scatter + Line Plot',
		xaxis: { title: 't' },
		yaxis: { title: 'f(t)' },
		margin: { l: 50, r: 20, b: 50, t: 50 },
		...oceanPlotConfig
	};
}

export function createHeatmapData() {
	const heatmapZ = [];
	for (let i = 0; i < 20; i++) {
		const row = [];
		for (let j = 0; j < 20; j++) {
			row.push(Math.sin(i / 3) * Math.cos(j / 3));
		}
		heatmapZ.push(row);
	}

	return [
		{
			z: heatmapZ,
			type: 'heatmap',
			colorscale: 'RdBu',
			hoverongaps: false
		}
	];
}

export function createHeatmapLayout() {
	return {
		title: 'Interactive Heatmap',
		xaxis: { title: 'Column Index' },
		yaxis: { title: 'Row Index' },
		autosize: true,
		height: 500,
		...oceanPlotConfig
	};
}

export function createSurfaceData() {
	const size = 30;
	const xValues = Array.from({ length: size }, (_, i) => -3 + (6 * i) / (size - 1));
	const yValues = Array.from({ length: size }, (_, i) => -3 + (6 * i) / (size - 1));
	const surfaceZ = xValues.map((x) =>
		yValues.map((y) => Math.sin(Math.sqrt(x ** 2 + y ** 2)))
	);

	return [
		{
			type: 'surface',
			x: xValues,
			y: yValues,
			z: surfaceZ,
			colorscale: 'Viridis',
			showscale: false
		}
	];
}

export function createSurfaceLayout() {
	return {
		title: '3D Surface: sin(r)',
		scene: {
			xaxis: { title: 'x', backgroundcolor: 'rgba(0,0,0,0)', gridcolor: 'rgba(100,100,100,0.3)', zerolinecolor: 'rgba(100,100,100,0.5)' },
			yaxis: { title: 'y', backgroundcolor: 'rgba(0,0,0,0)', gridcolor: 'rgba(100,100,100,0.3)', zerolinecolor: 'rgba(100,100,100,0.5)' },
			zaxis: { title: 'z', backgroundcolor: 'rgba(0,0,0,0)', gridcolor: 'rgba(100,100,100,0.3)', zerolinecolor: 'rgba(100,100,100,0.5)' },
			bgcolor: 'rgba(0,0,0,0)'
		},
		margin: { l: 0, r: 0, b: 0, t: 50 },
		...ocean3DPlotConfig
	};
}

export function createScatter3DData() {
	return [
		{
			x: Array.from({ length: 100 }, () => Math.random() * 10 - 5),
			y: Array.from({ length: 100 }, () => Math.random() * 10 - 5),
			z: Array.from({ length: 100 }, () => Math.random() * 10 - 5),
			type: 'scatter3d',
			mode: 'markers',
			marker: {
				size: 5,
				color: Array.from({ length: 100 }, () => Math.random()),
				colorscale: 'Portland',
				showscale: true
			}
		}
	];
}

export function createScatter3DLayout() {
	return {
		title: '3D Scatter Plot',
		scene: {
			xaxis: { title: 'X Axis', backgroundcolor: 'rgba(0,0,0,0)', gridcolor: 'rgba(100,100,100,0.3)', zerolinecolor: 'rgba(100,100,100,0.5)' },
			yaxis: { title: 'Y Axis', backgroundcolor: 'rgba(0,0,0,0)', gridcolor: 'rgba(100,100,100,0.3)', zerolinecolor: 'rgba(100,100,100,0.5)' },
			zaxis: { title: 'Z Axis', backgroundcolor: 'rgba(0,0,0,0)', gridcolor: 'rgba(100,100,100,0.3)', zerolinecolor: 'rgba(100,100,100,0.5)' },
			bgcolor: 'rgba(0,0,0,0)'
		},
		autosize: true,
		height: 600,
		...ocean3DPlotConfig
	};
}

export function createContourData() {
	const size = 30;
	const xValues = Array.from({ length: size }, (_, i) => -3 + (6 * i) / (size - 1));
	const yValues = Array.from({ length: size }, (_, i) => -3 + (6 * i) / (size - 1));
	const surfaceZ = xValues.map((x) =>
		yValues.map((y) => Math.sin(Math.sqrt(x ** 2 + y ** 2)))
	);

	return [
		{
			z: surfaceZ,
			type: 'contour',
			colorscale: 'Electric',
			contours: {
				showlabels: true
			}
		}
	];
}

export function createContourLayout() {
	return {
		title: 'Contour Plot',
		xaxis: { title: 'X' },
		yaxis: { title: 'Y' },
		autosize: true,
		height: 500,
		...oceanPlotConfig
	};
}

export const signalFamilies = {
	sine: {
		label: 'Modulated Sine',
		fn: (x: number) => Math.sin(2 * Math.PI * 0.25 * x) * Math.exp(-0.02 * x)
	},
	saw: {
		label: 'Sawtooth Sweep',
		fn: (x: number) => (2 / Math.PI) * Math.atan(Math.tan(Math.PI * 0.1 * x))
	},
	beats: {
		label: 'Beat Pattern',
		fn: (x: number) => Math.sin(0.2 * x) + 0.5 * Math.sin(0.22 * x + Math.PI / 6)
	}
} as const;

export function createInteractiveData(selectedSignal: keyof typeof signalFamilies) {
	const t = Array.from({ length: 400 }, (_, i) => i / 40);
	return [
		{
			x: t,
			y: t.map(signalFamilies[selectedSignal].fn),
			type: 'scatter',
			mode: 'lines',
			line: { color: '#db2777', width: 3 }
		}
	];
}

export function createInteractiveLayout(selectedSignal: keyof typeof signalFamilies) {
	return {
		title: `Interactive ${signalFamilies[selectedSignal].label}`,
		xaxis: { title: 'Time (s)' },
		yaxis: { title: 'Amplitude' },
		margin: { l: 50, r: 20, b: 50, t: 50 },
		...oceanPlotConfig
	};
}
