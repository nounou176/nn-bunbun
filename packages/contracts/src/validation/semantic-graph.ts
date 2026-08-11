import type { LessonManifest, LessonStep } from "../schema/index.js";
import { type BunbunValidationError, semanticError } from "./errors.js";
import { pushUnknownReference } from "./helpers.js";
import type { ManifestIndexes } from "./manifest-indexes.js";

interface StepGraphNode {
  step: LessonStep;
  stepIndex: number;
  nextStepIds: string[];
  hasCompleteEdge: boolean;
}

export interface GraphValidationResult {
  reachableStepIds: Set<string>;
}

export function validateManifestGraph(
  manifest: LessonManifest,
  indexes: ManifestIndexes,
  errors: BunbunValidationError[],
): GraphValidationResult {
  const graph = buildGraph(manifest, indexes, errors);
  const entry = graph.get(manifest.entryStepId);

  if (entry === undefined) {
    pushUnknownReference(
      errors,
      "MANIFEST",
      "UNKNOWN_ENTRY_STEP",
      "/entryStepId",
      "entry step",
      manifest.entryStepId,
    );
    return { reachableStepIds: new Set() };
  }

  const reachableStepIds = collectReachable(manifest.entryStepId, graph);

  manifest.steps.forEach((step, stepIndex) => {
    if (!reachableStepIds.has(step.stepId)) {
      errors.push(
        semanticError(
          "MANIFEST",
          "UNREACHABLE_STEP",
          `/steps/${stepIndex}/stepId`,
          `Step '${step.stepId}' is not reachable from entryStepId.`,
        ),
      );
    }
  });

  const completingSteps = new Set(
    [...graph.values()]
      .filter((node) => node.hasCompleteEdge)
      .map((node) => node.step.stepId),
  );

  if (![...reachableStepIds].some((stepId) => completingSteps.has(stepId))) {
    errors.push(
      semanticError(
        "MANIFEST",
        "NO_REACHABLE_COMPLETION",
        "/steps",
        "No COMPLETE transition is reachable from entryStepId.",
      ),
    );
  }

  const canComplete = collectCanComplete(graph, completingSteps);
  for (const stepId of reachableStepIds) {
    if (!canComplete.has(stepId)) {
      const node = graph.get(stepId);
      if (node !== undefined) {
        errors.push(
          semanticError(
            "MANIFEST",
            "NON_TERMINATING_STEP",
            `/steps/${node.stepIndex}`,
            `Reachable step '${stepId}' has no path to COMPLETE.`,
          ),
        );
      }
    }
  }

  validateCycles(graph, reachableStepIds, errors);
  validateRequiredSteps(manifest, graph, reachableStepIds, indexes, errors);

  return { reachableStepIds };
}

function buildGraph(
  manifest: LessonManifest,
  indexes: ManifestIndexes,
  errors: BunbunValidationError[],
): Map<string, StepGraphNode> {
  const graph = new Map<string, StepGraphNode>();

  manifest.steps.forEach((step, stepIndex) => {
    const nextStepIds: string[] = [];
    let hasCompleteEdge = false;

    const transitions: Array<
      [LessonStep["transitions"][keyof LessonStep["transitions"]], string]
    > = [
      [step.transitions.onSuccess, "onSuccess"],
      [step.transitions.onFailure, "onFailure"],
      [step.transitions.onAssisted, "onAssisted"],
    ];

    transitions.forEach(([transition, name]) => {
      if (transition.kind === "COMPLETE") {
        hasCompleteEdge = true;
        return;
      }

      if (!indexes.steps.has(transition.stepId)) {
        pushUnknownReference(
          errors,
          "MANIFEST",
          "UNKNOWN_TRANSITION_STEP",
          `/steps/${stepIndex}/transitions/${name}/stepId`,
          "transition step",
          transition.stepId,
        );
      } else {
        nextStepIds.push(transition.stepId);
      }
    });

    step.scaffolds.forEach((scaffold, scaffoldIndex) => {
      if (scaffold.kind !== "RECOGNITION_FALLBACK") {
        return;
      }
      if (indexes.steps.has(scaffold.fallbackStepId)) {
        nextStepIds.push(scaffold.fallbackStepId);
      } else {
        pushUnknownReference(
          errors,
          "MANIFEST",
          "UNKNOWN_FALLBACK_STEP",
          `/steps/${stepIndex}/scaffolds/${scaffoldIndex}/fallbackStepId`,
          "fallback step",
          scaffold.fallbackStepId,
        );
      }
    });

    graph.set(step.stepId, {
      step,
      stepIndex,
      nextStepIds: [...new Set(nextStepIds)],
      hasCompleteEdge,
    });
  });

  return graph;
}

function collectReachable(
  entryStepId: string,
  graph: Map<string, StepGraphNode>,
): Set<string> {
  const reachable = new Set<string>();
  const pending = [entryStepId];

  while (pending.length > 0) {
    const stepId = pending.pop();
    if (stepId === undefined || reachable.has(stepId)) {
      continue;
    }
    reachable.add(stepId);
    const node = graph.get(stepId);
    if (node !== undefined) {
      pending.push(...node.nextStepIds);
    }
  }

  return reachable;
}

function collectCanComplete(
  graph: Map<string, StepGraphNode>,
  completingSteps: Set<string>,
): Set<string> {
  const reverse = new Map<string, string[]>();
  for (const [stepId, node] of graph) {
    for (const nextStepId of node.nextStepIds) {
      const parents = reverse.get(nextStepId) ?? [];
      parents.push(stepId);
      reverse.set(nextStepId, parents);
    }
  }

  const canComplete = new Set<string>();
  const pending = [...completingSteps];
  while (pending.length > 0) {
    const stepId = pending.pop();
    if (stepId === undefined || canComplete.has(stepId)) {
      continue;
    }
    canComplete.add(stepId);
    pending.push(...(reverse.get(stepId) ?? []));
  }
  return canComplete;
}

function validateCycles(
  graph: Map<string, StepGraphNode>,
  reachable: Set<string>,
  errors: BunbunValidationError[],
): void {
  const state = new Map<string, "VISITING" | "DONE">();
  const reported = new Set<string>();

  function visit(stepId: string, stack: string[]): void {
    if (!reachable.has(stepId)) {
      return;
    }
    if (state.get(stepId) === "DONE") {
      return;
    }
    if (state.get(stepId) === "VISITING") {
      const startIndex = stack.indexOf(stepId);
      const cycle = [...stack.slice(Math.max(0, startIndex)), stepId];
      const key = [...new Set(cycle)].sort().join("\u0000");
      if (!reported.has(key)) {
        const node = graph.get(stepId);
        errors.push(
          semanticError(
            "MANIFEST",
            "UNBOUNDED_STEP_CYCLE",
            node === undefined ? "/steps" : `/steps/${node.stepIndex}`,
            `Contract 0.1.0 cannot prove this step cycle bounded: ${cycle.join(" -> ")}.`,
          ),
        );
        reported.add(key);
      }
      return;
    }

    state.set(stepId, "VISITING");
    const node = graph.get(stepId);
    for (const nextStepId of node?.nextStepIds ?? []) {
      visit(nextStepId, [...stack, stepId]);
    }
    state.set(stepId, "DONE");
  }

  for (const stepId of reachable) {
    visit(stepId, []);
  }
}

function validateRequiredSteps(
  manifest: LessonManifest,
  graph: Map<string, StepGraphNode>,
  reachable: Set<string>,
  indexes: ManifestIndexes,
  errors: BunbunValidationError[],
): void {
  manifest.completion.requiredStepIds.forEach((requiredStepId, index) => {
    const path = `/completion/requiredStepIds/${index}`;
    if (!indexes.steps.has(requiredStepId)) {
      pushUnknownReference(
        errors,
        "MANIFEST",
        "UNKNOWN_REQUIRED_STEP",
        path,
        "required step",
        requiredStepId,
      );
      return;
    }
    if (!reachable.has(requiredStepId)) {
      errors.push(
        semanticError(
          "MANIFEST",
          "UNREACHABLE_REQUIRED_STEP",
          path,
          `Required step '${requiredStepId}' is unreachable.`,
        ),
      );
      return;
    }
    if (
      requiredStepId !== manifest.entryStepId &&
      canCompleteAvoiding(manifest.entryStepId, requiredStepId, graph)
    ) {
      errors.push(
        semanticError(
          "MANIFEST",
          "REQUIRED_STEP_BYPASSABLE",
          path,
          `A completion path can bypass required step '${requiredStepId}'.`,
        ),
      );
    }
  });
}

function canCompleteAvoiding(
  entryStepId: string,
  omittedStepId: string,
  graph: Map<string, StepGraphNode>,
): boolean {
  const visited = new Set<string>();
  const pending = [entryStepId];

  while (pending.length > 0) {
    const stepId = pending.pop();
    if (
      stepId === undefined ||
      stepId === omittedStepId ||
      visited.has(stepId)
    ) {
      continue;
    }
    visited.add(stepId);
    const node = graph.get(stepId);
    if (node?.hasCompleteEdge === true) {
      return true;
    }
    pending.push(...(node?.nextStepIds ?? []));
  }

  return false;
}
