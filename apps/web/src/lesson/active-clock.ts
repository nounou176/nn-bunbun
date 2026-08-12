export class ActiveClock {
  readonly #now: () => number;
  readonly #startedAt: number;
  readonly #initialElapsedMs: number;
  #pausedAt: number | undefined;
  #pausedDuration = 0;

  constructor(
    now: () => number = () => performance.now(),
    initialElapsedMs = 0,
  ) {
    this.#now = now;
    this.#startedAt = now();
    this.#initialElapsedMs = Math.max(0, initialElapsedMs);
  }

  read(): number {
    const current = this.#pausedAt ?? this.#now();
    return Math.max(
      0,
      this.#initialElapsedMs + current - this.#startedAt - this.#pausedDuration,
    );
  }

  pause(): void {
    this.#pausedAt ??= this.#now();
  }

  resume(): void {
    if (this.#pausedAt === undefined) return;
    this.#pausedDuration += this.#now() - this.#pausedAt;
    this.#pausedAt = undefined;
  }
}
