interface LessonWorldInputBase {
  highlightObjectIds: readonly string[];
  highlightEntityIds: readonly string[];
}

export type LessonWorldInputConfiguration =
  | (LessonWorldInputBase & { mode: "NONE" })
  | (LessonWorldInputBase & {
      mode: "OBJECT";
      candidateIds: readonly string[];
      onSelected: (objectId: string) => void;
    })
  | (LessonWorldInputBase & {
      mode: "LOCATION";
      candidateIds: readonly string[];
      onSelected: (locationId: string) => void;
    })
  | (LessonWorldInputBase & {
      mode: "RECIPIENT";
      candidateIds: readonly string[];
      onSelected: (entityId: string) => void;
    });

export class LessonWorldInputGate {
  #mode: LessonWorldInputConfiguration["mode"] = "NONE";
  #candidateIds = new Set<string>();
  #onSelected: ((id: string) => void) | undefined;

  configure(configuration: LessonWorldInputConfiguration): void {
    this.#mode = configuration.mode;
    this.#candidateIds = new Set(
      configuration.mode === "NONE" ? [] : configuration.candidateIds,
    );
    this.#onSelected =
      configuration.mode === "NONE" ? undefined : configuration.onSelected;
  }

  routeObject(objectId: string): boolean {
    return this.#route("OBJECT", objectId);
  }

  routeLocation(locationId: string): boolean {
    return this.#route("LOCATION", locationId);
  }

  routeRecipient(entityId: string): boolean {
    return this.#route("RECIPIENT", entityId);
  }

  #route(mode: LessonWorldInputConfiguration["mode"], id: string): boolean {
    if (
      this.#mode !== mode ||
      !this.#candidateIds.has(id) ||
      this.#onSelected === undefined
    ) {
      return false;
    }
    this.#onSelected(id);
    return true;
  }

  get mode(): LessonWorldInputConfiguration["mode"] {
    return this.#mode;
  }

  get enabled(): boolean {
    return this.#mode !== "NONE";
  }
}
