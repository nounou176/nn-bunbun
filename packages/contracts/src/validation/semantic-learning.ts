import type {
  EvidenceCategory,
  LessonManifest,
  LessonStep,
} from "../schema/index.js";
import { type BunbunValidationError, semanticError } from "./errors.js";
import { escapeJsonPointer, pushUnknownReference } from "./helpers.js";
import type { ManifestIndexes } from "./manifest-indexes.js";

const PERMITTED_SUCCESS_EVIDENCE: Record<
  LessonStep["interaction"]["type"],
  ReadonlySet<EvidenceCategory>
> = {
  LISTEN: new Set(["heard"]),
  CLICK_OBJECT: new Set(["recognized", "selected_correctly"]),
  CHOOSE: new Set(["recognized", "selected_correctly"]),
  ARRANGE: new Set(["arranged_correctly"]),
  TYPE: new Set(["typed_correctly", "actively_produced"]),
  MOVE_TO: new Set(["recognized", "selected_correctly"]),
  PICK_UP: new Set(["recognized", "selected_correctly"]),
  GIVE: new Set(["recognized", "selected_correctly"]),
};

export function validateManifestLearning(
  manifest: LessonManifest,
  indexes: ManifestIndexes,
  reachableStepIds: ReadonlySet<string>,
  errors: BunbunValidationError[],
): void {
  validateBindings(manifest, indexes, errors);
  validateCoverage(manifest, reachableStepIds, errors);
  validateSupportLocale(manifest, errors);
  validatePlainTextSafety(manifest, errors);
}

function validateBindings(
  manifest: LessonManifest,
  indexes: ManifestIndexes,
  errors: BunbunValidationError[],
): void {
  manifest.steps.forEach((step, stepIndex) => {
    const seenBindings = new Set<string>();

    step.targetBindings.forEach((binding, bindingIndex) => {
      const path = `/steps/${stepIndex}/targetBindings/${bindingIndex}`;
      if (!indexes.targets.has(binding.targetId)) {
        pushUnknownReference(
          errors,
          "MANIFEST",
          "UNKNOWN_TARGET_BINDING",
          `${path}/targetId`,
          "learning target",
          binding.targetId,
        );
      }

      const bindingKey = `${binding.targetId}\u0000${binding.relation}`;
      if (seenBindings.has(bindingKey)) {
        errors.push(
          semanticError(
            "MANIFEST",
            "DUPLICATE_TARGET_BINDING",
            path,
            `Duplicate ${binding.relation} binding for target '${binding.targetId}'.`,
          ),
        );
      }
      seenBindings.add(bindingKey);

      if (
        binding.relation === "ASSESSES" &&
        !PERMITTED_SUCCESS_EVIDENCE[step.interaction.type].has(
          binding.successEvidence,
        )
      ) {
        errors.push(
          semanticError(
            "MANIFEST",
            "INCOMPATIBLE_EVIDENCE",
            `${path}/successEvidence`,
            `Evidence '${binding.successEvidence}' is incompatible with '${step.interaction.type}'.`,
          ),
        );
      }

      if (
        binding.relation === "ASSESSES" &&
        binding.successEvidence === "actively_produced" &&
        step.interaction.type === "TYPE" &&
        exposesTypeAnswer(step)
      ) {
        errors.push(
          semanticError(
            "MANIFEST",
            "PRODUCTION_ANSWER_VISIBLE",
            `${path}/successEvidence`,
            "actively_produced cannot be recorded when an accepted answer is visibly exposed.",
          ),
        );
      }
    });
  });
}

function validateCoverage(
  manifest: LessonManifest,
  reachableStepIds: ReadonlySet<string>,
  errors: BunbunValidationError[],
): void {
  manifest.learningTargets.forEach((target, targetIndex) => {
    if (target.role !== "REQUESTED") {
      return;
    }

    const exposureSteps = manifest.steps.filter(
      (step) =>
        reachableStepIds.has(step.stepId) &&
        step.targetBindings.some(
          (binding) =>
            binding.targetId === target.targetId &&
            binding.relation === "EXPOSES",
        ),
    );
    const contexts = new Set(exposureSteps.map((step) => step.contextId));

    if (exposureSteps.length < target.goal.minimumEncounters) {
      errors.push(
        semanticError(
          "MANIFEST",
          "TARGET_COVERAGE_GAP",
          `/learningTargets/${targetIndex}/goal/minimumEncounters`,
          `Target '${target.targetId}' has ${exposureSteps.length} reachable exposure(s), below ${target.goal.minimumEncounters}.`,
        ),
      );
    }

    if (contexts.size < target.goal.minimumContexts) {
      errors.push(
        semanticError(
          "MANIFEST",
          "TARGET_CONTEXT_GAP",
          `/learningTargets/${targetIndex}/goal/minimumContexts`,
          `Target '${target.targetId}' has ${contexts.size} reachable context(s), below ${target.goal.minimumContexts}.`,
        ),
      );
    }

    target.goal.desiredEvidence.forEach((evidence, evidenceIndex) => {
      if (
        !hasEvidenceOpportunity(
          manifest,
          target.targetId,
          evidence,
          reachableStepIds,
        )
      ) {
        errors.push(
          semanticError(
            "MANIFEST",
            "MISSING_EVIDENCE_OPPORTUNITY",
            `/learningTargets/${targetIndex}/goal/desiredEvidence/${evidenceIndex}`,
            `Target '${target.targetId}' has no reachable opportunity for '${evidence}'.`,
          ),
        );
      }
    });
  });
}

function hasEvidenceOpportunity(
  manifest: LessonManifest,
  targetId: string,
  evidence: EvidenceCategory,
  reachableStepIds: ReadonlySet<string>,
): boolean {
  return manifest.steps.some((step) => {
    if (!reachableStepIds.has(step.stepId)) {
      return false;
    }
    const exposes = step.targetBindings.some(
      (binding) =>
        binding.targetId === targetId && binding.relation === "EXPOSES",
    );
    if (evidence === "encountered") {
      return exposes;
    }
    if (evidence === "heard") {
      return exposes && step.stimulus.utterance?.audioAssetId !== undefined;
    }
    return step.targetBindings.some(
      (binding) =>
        binding.targetId === targetId &&
        binding.relation === "ASSESSES" &&
        binding.successEvidence === evidence,
    );
  });
}

function exposesTypeAnswer(step: LessonStep): boolean {
  if (step.interaction.type !== "TYPE") {
    return false;
  }
  const visibleText = [step.stimulus.instructionJa];
  if (step.stimulus.utterance?.textVisibility === "ALWAYS") {
    visibleText.push(step.stimulus.utterance.textJa);
  }
  return step.interaction.acceptedAnswers.some((answer) =>
    visibleText.some((text) => text?.includes(answer) === true),
  );
}

function validateSupportLocale(
  manifest: LessonManifest,
  errors: BunbunValidationError[],
): void {
  const hasSupportLocale = manifest.locales.support !== undefined;
  const supportFields: Array<[string | undefined, string]> = [
    [manifest.title.support, "/title/support"],
    [manifest.scenario.objective.support, "/scenario/objective/support"],
    [
      manifest.completion.closingMessage?.support,
      "/completion/closingMessage/support",
    ],
  ];

  manifest.learningTargets.forEach((target, targetIndex) => {
    if (target.kind === "VOCABULARY" || target.kind === "KANJI") {
      target.content.supportGlosses?.forEach((gloss, glossIndex) => {
        supportFields.push([
          gloss,
          `/learningTargets/${targetIndex}/content/supportGlosses/${glossIndex}`,
        ]);
      });
    } else {
      supportFields.push([
        target.content.supportExplanation,
        `/learningTargets/${targetIndex}/content/supportExplanation`,
      ]);
    }
  });

  manifest.steps.forEach((step, stepIndex) => {
    supportFields.push([
      step.stimulus.supportText,
      `/steps/${stepIndex}/stimulus/supportText`,
    ]);
    const feedbackEntries = [
      [step.feedback.correct.supportText, "correct"],
      [step.feedback.incorrect.supportText, "incorrect"],
      [step.feedback.assisted.supportText, "assisted"],
    ] as const;
    feedbackEntries.forEach(([supportText, outcome]) => {
      supportFields.push([
        supportText,
        `/steps/${stepIndex}/feedback/${outcome}/supportText`,
      ]);
    });
    step.scaffolds.forEach((scaffold, scaffoldIndex) => {
      if (scaffold.kind === "SHOW_MEANING") {
        supportFields.push([
          scaffold.supportText,
          `/steps/${stepIndex}/scaffolds/${scaffoldIndex}/supportText`,
        ]);
      }
    });

    const hasSupportText = step.stimulus.supportText !== undefined;
    const hasVisibility = step.stimulus.supportVisibility !== undefined;
    if (hasSupportText !== hasVisibility) {
      errors.push(
        semanticError(
          "MANIFEST",
          "SUPPORT_VISIBILITY_MISMATCH",
          `/steps/${stepIndex}/stimulus`,
          "supportText and supportVisibility must be present together.",
        ),
      );
    }
  });

  if (!hasSupportLocale) {
    supportFields.forEach(([value, path]) => {
      if (value !== undefined) {
        errors.push(
          semanticError(
            "MANIFEST",
            "SUPPORT_LOCALE_REQUIRED",
            path,
            "Support-language content requires locales.support.",
          ),
        );
      }
    });
  }
}

function validatePlainTextSafety(
  manifest: LessonManifest,
  errors: BunbunValidationError[],
): void {
  walkStrings(manifest, "", (value, path) => {
    if (
      /<\/?[A-Za-z][^>]*>|<script\b|\{\{|\}\}|\$\{/iu.test(value) ||
      /\]\(\s*(?:javascript:|data:text\/html)/iu.test(value)
    ) {
      errors.push(
        semanticError(
          "MANIFEST",
          "UNSAFE_TEXT_CONTENT",
          path,
          "Manifest strings must be inert plain text without markup or template expressions.",
        ),
      );
    }

    if (/https?:\/\//iu.test(value)) {
      errors.push(
        semanticError(
          "MANIFEST",
          "ARBITRARY_URL_FORBIDDEN",
          path,
          "Playable manifests cannot contain arbitrary URLs.",
        ),
      );
    }

    if (/^(?:\.\.\/|\.\/|\/|[A-Za-z]:[\\/])/u.test(value)) {
      errors.push(
        semanticError(
          "MANIFEST",
          "FILESYSTEM_PATH_FORBIDDEN",
          path,
          "Playable manifests cannot contain filesystem paths.",
        ),
      );
    }
  });
}

function walkStrings(
  value: unknown,
  path: string,
  visit: (value: string, path: string) => void,
): void {
  if (typeof value === "string") {
    visit(value, path || "/");
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      walkStrings(item, `${path}/${index}`, visit),
    );
    return;
  }
  if (typeof value === "object" && value !== null) {
    Object.entries(value).forEach(([key, item]) =>
      walkStrings(item, `${path}/${escapeJsonPointer(key)}`, visit),
    );
  }
}
