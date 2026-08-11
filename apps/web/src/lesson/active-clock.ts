export class ActiveClock {
  readonly #now: () => number;
  readonly #startedAt: number;
  #pausedAt: number | undefined;
  #pausedDuration = 0;

  constructor(now: () => number = () => performance.now()) {
    this.#now = now;
    this.#startedAt = now();
  }

  read(): number {
    const current = this.#pausedAt ?? this.#now();
    return Math.max(0, current - this.#startedAt - this.#pausedDuration);
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
