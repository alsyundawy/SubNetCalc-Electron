interface MemorySample {
  rss: number;
  heapUsed: number;
  timestamp: number;
}

const SAMPLE_INTERVAL_MS = 30_000;
const MAX_SAMPLES = 10;
const RSS_GROWTH_THRESHOLD = 0.25; // +25%
const HEAP_FLAT_THRESHOLD = 0.1; // +/-10%

let watchInterval: NodeJS.Timeout | null = null;
const samples: MemorySample[] = [];

export function startMemoryWatch(): void {
  if (watchInterval) return;

  // Record initial baseline
  const mem = process.memoryUsage();
  samples.push({
    rss: mem.rss,
    heapUsed: mem.heapUsed,
    timestamp: Date.now(),
  });

  watchInterval = setInterval(() => {
    const current = process.memoryUsage();
    samples.push({
      rss: current.rss,
      heapUsed: current.heapUsed,
      timestamp: Date.now(),
    });

    if (samples.length > MAX_SAMPLES) {
      samples.shift();
    }

    if (samples.length === MAX_SAMPLES) {
      const oldest = samples[0];
      if (!oldest) return;
      const rssGrowth = (current.rss - oldest.rss) / oldest.rss;
      const heapDelta =
        Math.abs(current.heapUsed - oldest.heapUsed) / oldest.heapUsed;

      if (
        rssGrowth >= RSS_GROWTH_THRESHOLD &&
        heapDelta <= HEAP_FLAT_THRESHOLD
      ) {
        console.warn(
          `[MemoryWatch] Warning: RSS increased by ${(rssGrowth * 100).toFixed(1)}% ` +
            `over ${MAX_SAMPLES} samples while JS heap remained flat ` +
            `(delta: ${(heapDelta * 100).toFixed(1)}%). ` +
            `Potential native buffer/socket/handle leak signature. ` +
            `RSS: ${(current.rss / (1024 * 1024)).toFixed(2)} MB, ` +
            `HeapUsed: ${(current.heapUsed / (1024 * 1024)).toFixed(2)} MB.`,
        );
      }
    }
  }, SAMPLE_INTERVAL_MS);

  // Allow process to exit cleanly if memory watch is the only active timer
  if (watchInterval.unref) {
    watchInterval.unref();
  }
}

export function stopMemoryWatch(): void {
  if (watchInterval) {
    clearInterval(watchInterval);
    watchInterval = null;
  }
  samples.length = 0;
}
