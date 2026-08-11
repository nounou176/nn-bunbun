const MAXIMUM_SAMPLES = 120;

export interface FrameStatistics {
  fps: number;
  averageFrameMs: number;
  p95FrameMs: number;
}

export class FrameMeter {
  readonly #samples: number[] = [];

  addSample(frameMs: number): void {
    if (!Number.isFinite(frameMs) || frameMs <= 0) {
      return;
    }
    this.#samples.push(frameMs);
    if (this.#samples.length > MAXIMUM_SAMPLES) {
      this.#samples.shift();
    }
  }

  read(): FrameStatistics {
    if (this.#samples.length === 0) {
      return { fps: 0, averageFrameMs: 0, p95FrameMs: 0 };
    }

    const averageFrameMs =
      this.#samples.reduce((total, sample) => total + sample, 0) /
      this.#samples.length;
    const sorted = [...this.#samples].sort((left, right) => left - right);
    const percentileIndex = Math.min(
      sorted.length - 1,
      Math.ceil(sorted.length * 0.95) - 1,
    );

    return {
      fps: 1000 / averageFrameMs,
      averageFrameMs,
      p95FrameMs: sorted[percentileIndex] ?? averageFrameMs,
    };
  }
}
