import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const REPOSITORY_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const CONTENT_PACKET_PATH = path.join(
  REPOSITORY_ROOT,
  "docs/lesson-content/M8_LAST_TRAIN_CONTENT_REVIEW_2026-08-27.json",
);
export const CONTENT_APPROVAL_PREFIX =
  "DUYỆT M8 LESSON CONTENT GATE 1 — PACKET ";

const EXPECTED_TARGET_IDS = [
  "target_wallet",
  "target_search",
  "target_te_kudasai",
  "target_umbrella",
  "target_station",
  "target_tewa_ikenai",
];
const EXPECTED_REQUESTED_TARGET_IDS = [
  "target_wallet",
  "target_search",
  "target_te_kudasai",
];
const EXPECTED_UTTERANCE_IDS = [
  "utterance_aoi_opening",
  "utterance_tanaka_rule",
  "utterance_tanaka_clue",
  "utterance_aoi_resolution",
];
const EXPECTED_PRIMITIVES = [
  "LISTEN",
  "ARRANGE",
  "CHOOSE",
  "TYPE",
  "MOVE_TO",
  "CLICK_OBJECT",
  "PICK_UP",
  "GIVE",
  "LISTEN",
];
const REQUIRED_PRIMITIVES = new Set([
  "LISTEN",
  "ARRANGE",
  "CHOOSE",
  "TYPE",
  "MOVE_TO",
  "CLICK_OBJECT",
  "PICK_UP",
  "GIVE",
]);
const ALLOWED_EVIDENCE = new Set([
  "heard",
  "recognized",
  "selected_correctly",
  "arranged_correctly",
  "typed_correctly",
  "actively_produced",
]);
const ALLOWED_SCAFFOLDS = new Set([
  "REPLAY_AUDIO",
  "SHOW_JAPANESE_TEXT",
  "HIGHLIGHT_OBJECTS",
  "HIGHLIGHT_ENTITIES",
  "REDUCE_OBJECT_CANDIDATES",
  "REDUCE_CHOICE_CANDIDATES",
  "SHOW_READING",
  "SHOW_MEANING",
  "SHOW_PATTERN",
]);
const ALLOWED_CUES = new Set([
  "aoi_request",
  "tension_start",
  "tanaka_rule",
  "umbrella_correction",
  "momo_clue",
  "momo_reaction",
  "wallet_reveal",
  "wallet_pickup",
  "wallet_return",
  "feedback_correct",
  "feedback_incorrect",
  "lesson_resolution",
]);
const EXPECTED_WORLD = {
  sceneId: "neighborhood_small",
  variantId: "rainy_evening_last_train_v1",
  cameraPresetId: "neighborhood_isometric_default",
  entityIds: ["aoi", "tanaka"],
  objectIds: ["momo", "wallet_clue", "mistaken_umbrella"],
  locationIds: [
    "store_front",
    "park_edge",
    "umbrella_stand_area",
    "staff_only_door",
  ],
};
const TARGET_TEXT_MARKERS = {
  target_wallet: "財布",
  target_search: "探",
  target_te_kudasai: "てください",
  target_umbrella: "傘",
  target_station: "駅",
  target_tewa_ikenai: "てはいけません",
};

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function requireObject(value, label) {
  assert.equal(typeof value, "object", `${label} must be an object.`);
  assert.notEqual(value, null, `${label} must not be null.`);
  assert.equal(Array.isArray(value), false, `${label} must not be an array.`);
  return value;
}

function requireNonBlankString(value, label) {
  assert.equal(typeof value, "string", `${label} must be a string.`);
  assert.ok(value.trim().length > 0, `${label} must not be blank.`);
}

function assertUnique(values, label) {
  assert.equal(
    new Set(values).size,
    values.length,
    `${label} must contain unique values.`,
  );
}

function assertSubset(values, candidates, label) {
  values.forEach((value) => {
    assert.ok(candidates.includes(value), `${label} contains '${value}'.`);
  });
}

function validateTarget(target, targetIndex) {
  requireObject(target, `targets[${targetIndex}]`);
  requireNonBlankString(target.targetId, `targets[${targetIndex}].targetId`);
  assert.ok(
    target.kind === "VOCABULARY" || target.kind === "GRAMMAR",
    `Target '${target.targetId}' has an unsupported kind.`,
  );
  assert.ok(
    target.role === "REQUESTED" || target.role === "SUPPORTING",
    `Target '${target.targetId}' has an unsupported role.`,
  );
  assert.ok(
    Number.isInteger(target.priority) &&
      target.priority >= 1 &&
      target.priority <= 5,
    `Target '${target.targetId}' has an invalid priority.`,
  );
  assert.ok(
    Number.isInteger(target.minimumContexts) &&
      target.minimumContexts >= 1 &&
      target.minimumContexts <= 5,
    `Target '${target.targetId}' has an invalid minimumContexts.`,
  );
  assert.ok(
    Array.isArray(target.desiredEvidence) && target.desiredEvidence.length > 0,
    `Target '${target.targetId}' needs desired evidence.`,
  );
  assertUnique(target.desiredEvidence, `${target.targetId}.desiredEvidence`);
  target.desiredEvidence.forEach((evidence) => {
    assert.ok(
      ALLOWED_EVIDENCE.has(evidence),
      `Target '${target.targetId}' uses unsupported evidence '${evidence}'.`,
    );
  });
  if (target.kind === "VOCABULARY") {
    assert.ok(
      target.writtenForms?.length > 0,
      `${target.targetId} needs a written form.`,
    );
    assert.ok(
      target.readings?.length > 0,
      `${target.targetId} needs a reading.`,
    );
    assert.ok(
      target.supportGlosses?.length > 0,
      `${target.targetId} needs Vietnamese support.`,
    );
  } else {
    requireNonBlankString(target.pattern, `${target.targetId}.pattern`);
    requireNonBlankString(target.labelJa, `${target.targetId}.labelJa`);
    requireNonBlankString(
      target.supportExplanation,
      `${target.targetId}.supportExplanation`,
    );
  }
}

function validateUtterances(packet, targetIds) {
  assert.equal(
    packet.utterances.length,
    4,
    "Exactly four utterances are required.",
  );
  assert.deepEqual(
    packet.utterances.map((utterance) => utterance.utteranceId),
    EXPECTED_UTTERANCE_IDS,
    "The exact four utterance identities or order changed.",
  );
  packet.utterances.forEach((utterance, utteranceIndex) => {
    requireNonBlankString(
      utterance.textJa,
      `utterances[${utteranceIndex}].textJa`,
    );
    requireNonBlankString(
      utterance.supportVi,
      `utterances[${utteranceIndex}].supportVi`,
    );
    assert.ok(
      packet.world.entityIds.includes(utterance.speakerEntityId),
      `Utterance '${utterance.utteranceId}' uses an unknown speaker.`,
    );
    const expectedProfile =
      utterance.speakerEntityId === "aoi" ? "voice_aoi_01" : "voice_tanaka_01";
    assert.equal(
      utterance.voiceProfileId,
      expectedProfile,
      `Utterance '${utterance.utteranceId}' changed its approved voice profile.`,
    );
    assert.ok(
      Array.isArray(utterance.targetIds) && utterance.targetIds.length > 0,
      `Utterance '${utterance.utteranceId}' needs target bindings.`,
    );
    assertUnique(utterance.targetIds, `${utterance.utteranceId}.targetIds`);
    utterance.targetIds.forEach((targetId) => {
      assert.ok(
        targetIds.has(targetId),
        `Unknown utterance target '${targetId}'.`,
      );
      assert.ok(
        utterance.textJa.includes(TARGET_TEXT_MARKERS[targetId]),
        `Utterance '${utterance.utteranceId}' does not contain '${targetId}'.`,
      );
    });
  });
}

function validateAnswerTruth(step) {
  const answer = requireObject(step.answerTruth, `${step.stepId}.answerTruth`);
  if (step.primitive === "LISTEN") {
    assert.ok(
      answer.completion === "LEARNER_CONTINUES" ||
        answer.completion === "AUDIO_ENDED",
      `${step.stepId} has an invalid LISTEN completion.`,
    );
    assert.ok(
      typeof answer.minimumPlaybackRatio === "number" &&
        answer.minimumPlaybackRatio >= 0 &&
        answer.minimumPlaybackRatio <= 1,
      `${step.stepId} has an invalid playback ratio.`,
    );
    return;
  }
  if (step.primitive === "ARRANGE") {
    const tokenIds = answer.tokens.map((token) => token.tokenId);
    assertUnique(tokenIds, `${step.stepId}.tokens`);
    assert.ok(
      answer.acceptedSequences.length > 0,
      `${step.stepId} needs an answer.`,
    );
    answer.acceptedSequences.forEach((sequence) =>
      assertSubset(sequence, tokenIds, `${step.stepId}.acceptedSequences`),
    );
    return;
  }
  if (step.primitive === "CHOOSE") {
    const optionIds = answer.options.map((option) => option.optionId);
    assertUnique(optionIds, `${step.stepId}.options`);
    assert.ok(
      optionIds.length >= 2,
      `${step.stepId} needs at least two choices.`,
    );
    assertSubset(
      answer.acceptedOptionIds,
      optionIds,
      `${step.stepId}.acceptedOptionIds`,
    );
    return;
  }
  if (step.primitive === "TYPE") {
    assert.deepEqual(
      answer.acceptedAnswers,
      ["財布を探してください。"],
      "The exact active-production answer changed.",
    );
    assert.ok(
      answer.maximumLength <= 200,
      `${step.stepId} input is unbounded.`,
    );
    return;
  }
  if (step.primitive === "MOVE_TO") {
    assertSubset(
      answer.acceptedLocationIds,
      answer.candidateLocationIds,
      `${step.stepId}.acceptedLocationIds`,
    );
    assert.deepEqual(
      answer.acceptedLocationIds,
      ["park_edge"],
      "The Momo clue must lead to park_edge.",
    );
    return;
  }
  if (step.primitive === "CLICK_OBJECT" || step.primitive === "PICK_UP") {
    assertSubset(
      answer.acceptedObjectIds,
      answer.candidateObjectIds,
      `${step.stepId}.acceptedObjectIds`,
    );
    return;
  }
  if (step.primitive === "GIVE") {
    assert.ok(
      answer.acceptedPairs.length > 0,
      `${step.stepId} needs an accepted pair.`,
    );
    answer.acceptedPairs.forEach((pair) => {
      assert.ok(
        answer.candidateObjectIds.includes(pair.objectId),
        `${step.stepId} accepts an object outside its candidates.`,
      );
      assert.ok(
        answer.candidateRecipientEntityIds.includes(pair.recipientEntityId),
        `${step.stepId} accepts a recipient outside its candidates.`,
      );
    });
  }
}

function validateSteps(packet, targetIds, utteranceById) {
  assert.deepEqual(
    packet.steps.map((step) => step.primitive),
    EXPECTED_PRIMITIVES,
    "The accepted nine-step primitive sequence changed.",
  );
  assert.deepEqual(
    new Set(packet.steps.map((step) => step.primitive)),
    REQUIRED_PRIMITIVES,
    "The packet must use every accepted primitive.",
  );
  const stepIds = packet.steps.map((step) => step.stepId);
  assertUnique(stepIds, "steps.stepId");
  assertUnique(
    packet.steps.map((step) => step.contextId),
    "steps.contextId",
  );
  const contextsByTarget = new Map();
  const evidenceByTarget = new Map();

  packet.steps.forEach((step, stepIndex) => {
    assert.equal(
      step.order,
      stepIndex + 1,
      `${step.stepId} has the wrong order.`,
    );
    requireNonBlankString(step.instructionJa, `${step.stepId}.instructionJa`);
    requireNonBlankString(step.supportVi, `${step.stepId}.supportVi`);
    if (step.utteranceId !== undefined) {
      assert.ok(
        utteranceById.has(step.utteranceId),
        `${step.stepId} references an unknown utterance.`,
      );
      utteranceById.get(step.utteranceId).targetIds.forEach((targetId) => {
        const contexts = contextsByTarget.get(targetId) ?? new Set();
        contexts.add(step.contextId);
        contextsByTarget.set(targetId, contexts);
        const evidence = evidenceByTarget.get(targetId) ?? new Set();
        evidence.add("heard");
        evidenceByTarget.set(targetId, evidence);
      });
    }
    assert.ok(
      Number.isInteger(step.maximumAttempts) &&
        step.maximumAttempts >= 1 &&
        step.maximumAttempts <= 2,
      `${step.stepId} has an unbounded attempt policy.`,
    );
    assert.equal(
      step.afterMaximum,
      "CONTINUE_ASSISTED",
      `${step.stepId} must remain recoverable.`,
    );
    validateAnswerTruth(step);
    assert.ok(Array.isArray(step.scaffolds), `${step.stepId} needs scaffolds.`);
    step.scaffolds.forEach((scaffold) => {
      assert.ok(
        ALLOWED_SCAFFOLDS.has(scaffold.kind),
        `${step.stepId} uses unsupported scaffold '${scaffold.kind}'.`,
      );
      assert.ok(
        Number.isInteger(scaffold.afterAttempt) &&
          scaffold.afterAttempt >= 1 &&
          scaffold.afterAttempt <= step.maximumAttempts,
        `${step.stepId} has a scaffold outside its attempt budget.`,
      );
    });
    assert.ok(
      step.targetBindings.length > 0,
      `${step.stepId} needs target bindings.`,
    );
    const stepTargetIds = step.targetBindings.map(
      (binding) => binding.targetId,
    );
    assertUnique(stepTargetIds, `${step.stepId}.targetBindings`);
    step.targetBindings.forEach((binding) => {
      assert.ok(
        targetIds.has(binding.targetId),
        `${step.stepId} uses an unknown target.`,
      );
      assert.ok(
        ALLOWED_EVIDENCE.has(binding.evidence),
        `${step.stepId} uses unsupported evidence '${binding.evidence}'.`,
      );
      const contexts = contextsByTarget.get(binding.targetId) ?? new Set();
      contexts.add(step.contextId);
      contextsByTarget.set(binding.targetId, contexts);
      const evidence = evidenceByTarget.get(binding.targetId) ?? new Set();
      evidence.add(binding.evidence);
      evidenceByTarget.set(binding.targetId, evidence);
    });
    [step.cueIds.onEnter, step.cueIds.onSuccess, step.cueIds.onFailure]
      .flat()
      .forEach((cueId) => {
        assert.ok(
          ALLOWED_CUES.has(cueId),
          `${step.stepId} uses unknown cue '${cueId}'.`,
        );
      });
  });

  packet.targets.forEach((target) => {
    assert.ok(
      (contextsByTarget.get(target.targetId)?.size ?? 0) >=
        target.minimumContexts,
      `Target '${target.targetId}' is below its minimum context count.`,
    );
    target.desiredEvidence.forEach((evidence) => {
      assert.ok(
        evidenceByTarget.get(target.targetId)?.has(evidence),
        `Target '${target.targetId}' has no '${evidence}' opportunity.`,
      );
    });
  });

  const pickIndex = packet.steps.findIndex(
    (step) => step.primitive === "PICK_UP",
  );
  const giveIndex = packet.steps.findIndex((step) => step.primitive === "GIVE");
  assert.ok(
    pickIndex >= 0 && pickIndex < giveIndex,
    "PICK_UP must precede GIVE.",
  );
  assert.deepEqual(
    packet.steps[pickIndex].answerTruth.acceptedObjectIds,
    ["wallet_clue"],
    "PICK_UP must guarantee wallet_clue.",
  );
  assert.deepEqual(
    packet.steps[giveIndex].answerTruth.acceptedPairs,
    [{ objectId: "wallet_clue", recipientEntityId: "aoi" }],
    "GIVE must return wallet_clue to Aoi.",
  );
  assert.deepEqual(
    packet.completion.requiredStepIds,
    stepIds,
    "Completion must require every step in order.",
  );
}

export function validateM8LastTrainContentPacket(packetInput) {
  const packet = requireObject(packetInput, "packet");
  assert.equal(packet.packetFormat, "bunbun_m8_last_train_content_review");
  assert.equal(packet.packetVersion, "1.0.0");
  assert.equal(packet.status, "PROPOSED_FOR_USER_APPROVAL");
  assert.deepEqual(packet.authority, {
    decisionId: "D-046",
    speechGenerationAuthorized: false,
    runtimeActivationAuthorized: false,
    requiredNextAction: "USER_APPROVE_EXACT_CONTENT_PACKET_SHA256",
  });
  assert.deepEqual(packet.costAndData, {
    incrementalUsd: 0,
    recurringUsd: 0,
    newThirdPartyDependencies: [],
    newEnvironmentVariables: [],
    runtimeProviderCalls: [],
    authoringData: ["EXACT_REPOSITORY_OWNED_JAPANESE_UTTERANCE_TEXT_ONLY"],
  });
  assert.equal(packet.sourceScope.level, "N5");
  assert.equal(packet.sourceScope.targetLocale, "ja");
  assert.equal(packet.sourceScope.supportLocale, "vi");
  assert.equal(packet.sourceScope.contentOwnership, "BUNBUN_REPOSITORY_OWNED");
  assert.equal(packet.sourceScope.importsExternalDefinitions, false);
  assert.equal(packet.sourceScope.importsExternalLinks, false);
  assert.equal(packet.sourceScope.importsExternalIds, false);
  assert.deepEqual(packet.world, EXPECTED_WORLD);
  assert.equal(packet.story.template, "SOLVE_SMALL_PROBLEM");
  assert.equal(packet.story.constraints.narrativeDeadlineOnly, true);
  assert.equal(packet.story.constraints.hardTimer, false);
  assert.equal(packet.story.constraints.gameOver, false);
  assert.equal(packet.story.constraints.theftClaim, false);
  assert.equal(
    packet.story.constraints.walletResolution,
    "DROPPED_NEAR_PARK_EDGE",
  );
  assert.equal(
    packet.story.constraints.umbrellaResolution,
    "MISTAKEN_PROPERTY_NOT_AOIS",
  );

  assert.equal(packet.targets.length, 6, "Exactly six targets are required.");
  packet.targets.forEach(validateTarget);
  const targetIds = packet.targets.map((target) => target.targetId);
  assertUnique(targetIds, "targets.targetId");
  assert.deepEqual(
    targetIds,
    EXPECTED_TARGET_IDS,
    "The six target identities changed.",
  );
  assert.deepEqual(
    packet.targets
      .filter((target) => target.role === "REQUESTED")
      .map((target) => target.targetId),
    EXPECTED_REQUESTED_TARGET_IDS,
    "The requested target set changed.",
  );

  const targetIdSet = new Set(targetIds);
  validateUtterances(packet, targetIdSet);
  validateSteps(
    packet,
    targetIdSet,
    new Map(
      packet.utterances.map((utterance) => [utterance.utteranceId, utterance]),
    ),
  );
  assert.deepEqual(packet.quality.preferredReactionIntervalSeconds, [5, 12]);
  assert.ok(packet.quality.estimatedActiveMinutes <= 5);

  const serialized = JSON.stringify(packet);
  assert.equal(
    /https?:\/\//u.test(serialized),
    false,
    "Packet must not contain URLs.",
  );

  return {
    status: packet.status,
    targets: packet.targets.length,
    utterances: packet.utterances.length,
    steps: packet.steps.length,
    primitives: [...new Set(packet.steps.map((step) => step.primitive))],
  };
}

export async function loadAndValidateM8LastTrainContentPacket(
  packetPath = CONTENT_PACKET_PATH,
) {
  const bytes = await readFile(packetPath);
  const packet = JSON.parse(bytes.toString("utf8"));
  const summary = validateM8LastTrainContentPacket(packet);
  const packetSha256 = sha256(bytes);
  return {
    packet,
    packetPath,
    packetSha256,
    approvalPhrase: `${CONTENT_APPROVAL_PREFIX}${packetSha256}`,
    ...summary,
  };
}

async function main() {
  const result = await loadAndValidateM8LastTrainContentPacket(
    process.argv[2] ? path.resolve(process.argv[2]) : CONTENT_PACKET_PATH,
  );
  process.stdout.write(
    `${JSON.stringify(
      {
        status: result.status,
        packetPath: result.packetPath,
        packetSha256: result.packetSha256,
        targets: result.targets,
        utterances: result.utterances,
        steps: result.steps,
        primitives: result.primitives,
        speechGenerationAuthorized:
          result.packet.authority.speechGenerationAuthorized,
        runtimeActivationAuthorized:
          result.packet.authority.runtimeActivationAuthorized,
        approvalPhrase: result.approvalPhrase,
      },
      null,
      2,
    )}\n`,
  );
}

if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  await main();
}
