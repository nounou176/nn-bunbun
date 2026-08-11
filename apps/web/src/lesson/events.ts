import type {
  EvidenceCategory,
  LessonStep,
  TargetBinding,
} from "@bunbun/contracts";

export type SessionEventKind =
  "EXPOSURE" | "HEARD" | "REACTION" | "STEP_COMPLETED" | "LESSON_COMPLETED";

export interface SessionEvent {
  eventId: string;
  kind: SessionEventKind;
  sessionId: string;
  lessonId: string;
  revision: number;
  stepId: string;
  contextId: string;
  primitive: LessonStep["interaction"]["type"];
  targetId?: string;
  evidence?: EvidenceCategory;
  submittedValue?: string;
  correct?: boolean;
  assisted: boolean;
  attempt: number;
  activeLatencyMs: number;
  occurredAt: string;
}

export class InMemoryEventSink {
  readonly #events = new Map<string, SessionEvent>();

  write(events: readonly SessionEvent[]): number {
    let inserted = 0;
    events.forEach((event) => {
      if (!this.#events.has(event.eventId)) {
        this.#events.set(event.eventId, event);
        inserted += 1;
      }
    });
    return inserted;
  }

  values(): readonly SessionEvent[] {
    return [...this.#events.values()];
  }

  get size(): number {
    return this.#events.size;
  }
}

export function exposureEvents(
  context: EventContext,
  step: LessonStep,
): SessionEvent[] {
  return step.targetBindings
    .filter(
      (binding): binding is Extract<TargetBinding, { relation: "EXPOSES" }> =>
        binding.relation === "EXPOSES",
    )
    .map((binding) =>
      createEvent(context, step, {
        kind: "EXPOSURE",
        key: `exposure:${binding.targetId}`,
        targetId: binding.targetId,
        evidence: "encountered",
        assisted: false,
        attempt: 0,
      }),
    );
}

export function heardEvents(
  context: EventContext,
  step: LessonStep,
): SessionEvent[] {
  return assessmentBindings(step)
    .filter((binding) => binding.successEvidence === "heard")
    .map((binding) =>
      createEvent(context, step, {
        kind: "HEARD",
        key: `heard:${binding.targetId}`,
        targetId: binding.targetId,
        evidence: "heard",
        correct: true,
        assisted: false,
        attempt: 1,
      }),
    );
}

export function reactionEvents(
  context: EventContext,
  step: LessonStep,
  attempt: number,
  submittedValue: string,
  correct: boolean,
  assisted: boolean,
): SessionEvent[] {
  return assessmentBindings(step).map((binding) =>
    createEvent(context, step, {
      kind: "REACTION",
      key: `reaction:${attempt}:${binding.targetId}:${submittedValue}`,
      targetId: binding.targetId,
      evidence: binding.successEvidence,
      submittedValue,
      correct,
      assisted,
      attempt,
    }),
  );
}

export function stepCompletedEvent(
  context: EventContext,
  step: LessonStep,
  attempt: number,
  outcome: "SUCCESS" | "FAILURE" | "ASSISTED",
): SessionEvent {
  return createEvent(context, step, {
    kind: "STEP_COMPLETED",
    key: `completed:${outcome}`,
    correct: outcome === "SUCCESS",
    assisted: outcome === "ASSISTED",
    attempt,
  });
}

export function lessonCompletedEvent(
  context: EventContext,
  step: LessonStep,
): SessionEvent {
  return createEvent(context, step, {
    kind: "LESSON_COMPLETED",
    key: "lesson-completed",
    assisted: false,
    attempt: 0,
  });
}

export interface EventContext {
  sessionId: string;
  lessonId: string;
  revision: number;
  activeLatencyMs: number;
  occurredAt: string;
}

interface EventFields {
  kind: SessionEventKind;
  key: string;
  targetId?: string;
  evidence?: EvidenceCategory;
  submittedValue?: string;
  correct?: boolean;
  assisted: boolean;
  attempt: number;
}

function createEvent(
  context: EventContext,
  step: LessonStep,
  fields: EventFields,
): SessionEvent {
  const event: SessionEvent = {
    eventId: `${context.sessionId}:${step.stepId}:${fields.key}`,
    kind: fields.kind,
    sessionId: context.sessionId,
    lessonId: context.lessonId,
    revision: context.revision,
    stepId: step.stepId,
    contextId: step.contextId,
    primitive: step.interaction.type,
    assisted: fields.assisted,
    attempt: fields.attempt,
    activeLatencyMs: Math.max(0, Math.round(context.activeLatencyMs)),
    occurredAt: context.occurredAt,
  };
  if (fields.targetId !== undefined) event.targetId = fields.targetId;
  if (fields.evidence !== undefined) event.evidence = fields.evidence;
  if (fields.submittedValue !== undefined) {
    event.submittedValue = fields.submittedValue;
  }
  if (fields.correct !== undefined) event.correct = fields.correct;
  return event;
}

function assessmentBindings(
  step: LessonStep,
): Extract<TargetBinding, { relation: "ASSESSES" }>[] {
  return step.targetBindings.filter(
    (binding): binding is Extract<TargetBinding, { relation: "ASSESSES" }> =>
      binding.relation === "ASSESSES",
  );
}
