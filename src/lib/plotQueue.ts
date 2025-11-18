// Global queue to ensure plots load one at a time in the background
// Prioritizes plots closer to viewport for better perceived performance

type QueuedTask = {
	task: () => Promise<void>;
	priority: number; // Distance from viewport, lower = higher priority
};

// Cache Plotly import - only load once and reuse for all plots
let plotlyCache: any = null;
let plotlyPromise: Promise<any> | null = null;

export async function getPlotly() {
	if (plotlyCache) return plotlyCache;

	if (!plotlyPromise) {
		// @ts-ignore - plotly.js-dist doesn't have type definitions
		plotlyPromise = import('plotly.js-dist').then((module) => {
			plotlyCache = module.default || module;
			return plotlyCache;
		});
	}

	return plotlyPromise;
}

class PlotQueue {
	private queue: QueuedTask[] = [];
	private isProcessing = false;

	async add(task: () => Promise<void>, distanceFromViewport: number): Promise<void> {
		return new Promise((resolve) => {
			console.log(`[PlotQueue] Adding plot to queue. Distance: ${distanceFromViewport}, Queue length: ${this.queue.length}`);

			this.queue.push({
				task: async () => {
					console.log(`[PlotQueue] Starting plot load. Remaining in queue: ${this.queue.length}`);
					await task();
					console.log(`[PlotQueue] Finished plot load`);
					resolve();
				},
				priority: distanceFromViewport
			});

			// Sort queue by priority (closest to viewport first)
			this.queue.sort((a, b) => a.priority - b.priority);

			// Start processing if not already running
			if (!this.isProcessing) {
				this.process();
			}
		});
	}

	private async process() {
		if (this.isProcessing || this.queue.length === 0) {
			return;
		}

		this.isProcessing = true;

		while (this.queue.length > 0) {
			const item = this.queue.shift();
			if (item) {
				try {
					await item.task();
					// Longer delay between plots to give browser time to handle user input
					await new Promise(resolve => setTimeout(resolve, 500));
				} catch (error) {
					console.error('Plot queue task failed:', error);
				}
			}
		}

		this.isProcessing = false;
	}
}

// Single global instance
export const plotQueue = new PlotQueue();
