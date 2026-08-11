export interface LessonWorldInputConfiguration {
  enabled: boolean;
  candidateObjectIds: readonly string[];
  highlightObjectIds: readonly string[];
  onObjectSelected?: ((objectId: string) => void) | undefined;
}

export class LessonWorldInputGate {
  #enabled = false;
  #candidateObjectIds = new Set<string>();
  #onObjectSelected: ((objectId: string) => void) | undefined;

  configure(configuration: LessonWorldInputConfiguration): void {
    this.#enabled = configuration.enabled;
    this.#candidateObjectIds = new Set(configuration.candidateObjectIds);
    this.#onObjectSelected = configuration.enabled
      ? configuration.onObjectSelected
      : undefined;
  }

  routeSelection(objectId: string): boolean {
    if (
      !this.#enabled ||
      !this.#candidateObjectIds.has(objectId) ||
      this.#onObjectSelected === undefined
    ) {
      return false;
    }

    this.#onObjectSelected(objectId);
    return true;
  }

  get enabled(): boolean {
    return this.#enabled;
  }
}
