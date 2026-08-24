# Bunbun lesson-authoring protocol 0.2.0

This protocol adapts the approved M7 Prompt Adaptation Pack into one composed
Skills-only operation. It does not grant authority over the lesson graph,
references, world, runtime, publication, or learner state.

## Input authority

The supplied request is the only content input. It contains either an authored
fixture or explicitly exported normalized learner targets, never learner
history. Use no facts from prior chat, memory, external sources, hosted GPT
configuration, or general world knowledge to expand it.

The compiler-owned input wins over every prompt module. In particular:

- `normalizedTargets` owns written forms, readings, grammar patterns, and
  Vietnamese glosses;
- `worldFacts[*].allowedClaims` owns every permitted world assertion;
- `storyBeats` owns target placement, claim allowlists, order, and budgets;
- `practiceSlots` owns primitives, practice text, exact accepted Japanese
  answer truth, candidate truth, response-shape permissions, normalization
  rules, and budgets; and
- `coachingSlots` owns step order, difficulty, scaffold kinds, reveal levels,
  support permissions, runtime primitive, maximum attempts, feedback display
  durations, scaffold activation attempts, and budgets.

Do not infer that a plausible real-world action is available. A dog being
present does not imply that it barks, runs, reacts happily, belongs to someone,
or can be picked up unless a supplied claim explicitly says so.

## Composition order

1. Author `contributions.story` using Story Sheet.
2. Treat accepted story content as read-only context while authoring
   `contributions.reverseTraining` using Reverse Trainer.
3. Treat accepted story and practice content as read-only context while
   authoring `contributions.coaching` using Story Coach.
4. Emit the closed result object. Do not expose intermediate drafts.

`languageAnalysis` and `practice` wording in the Reverse Trainer prompt maps to
`contributions.reverseTraining.value.targetAnalysis` and
`contributions.reverseTraining.value.practiceItems` in the result schema. The
result schema names are authoritative.

## World-claim traceability

Each input world claim has a stable `claimId`. Each story beat returns exactly
the subset it actually uses as `usedWorldClaimIds`. A returned claim ID must be
present in that beat's `allowedWorldClaimIds`; do not use a fact or claim merely
because it exists elsewhere in the packet.

Use a conservative interpretation. If the copy needs an action, relationship,
location, state, or reaction that no allowed claim supports, revise the copy or
return `CANNOT_COMPLY` with `UNSUPPORTED_WORLD_CLAIM`.

## Practice shapes

- Use `practiceTextJa` as the compiler-selected Japanese phrase that the
  practice item must teach or analyze. `stimulusJa` may be a bounded prompt,
  but it must remain grounded in that phrase and the slot's targets.
- Copy `acceptedResponsesJa` exactly from the matching input slot, in order.
  Never add, remove, normalize, translate, or reinterpret an accepted response.
- Populate `acceptedResponsesJa` only when `permitsAcceptedText` is true.
- Populate `arrangeSegmentsJa` only when `permitsArrangeSegments` is true.
- Populate `distractorsJa` only when `permitsDistractors` is true.
- `TYPE` and `ARRANGE` require at least one accepted response.
- Ordered ARRANGE segments must concatenate to an accepted response exactly.
- A distractor must not normalize to an accepted response.
- Candidate IDs and acceptance truth remain in the input; never copy them into
  a new model-owned answer field.

## Coaching boundaries

Write one immediate action per instruction. Main hints and all non-direct
scaffolds must not contain supplied target forms, readings, patterns, glosses,
accepted answers, or accepted candidate identities. Direct reveal copy is
allowed only in the exact compiler-provided direct scaffold slot.

Correct feedback confirms and advances. Incorrect feedback invites a safe
retry. Assisted feedback acknowledges help and never claims unaided success or
mastery.

`primitive`, `maximumAttempts`, and `feedbackDisplayMs` are read-only runtime
context. They may constrain copy and scaffold timing, but the model never emits
or changes runtime mechanics. A scaffold's `afterAttempt` must not exceed the
matching step's `maximumAttempts`.

## Failure and repair

Use a stable uppercase failure code with a null value when a module cannot
comply. Attempt 1 requires `repair: null`. Attempt 2 is one bounded repair and
must carry the same request identity, input hash, prompt pack, and deterministic
input. Its repair context contains only a failure stage, the SHA-256 of the
exact prior response, bounded local diagnostics, and a prior structured result
only after structural validation succeeds. For a JSON parse or structural
failure, `priorResult` is null; never request, quote, or reconstruct rejected
raw response content.

Use the prior result only to correct the listed diagnostics. Do not accept a
third attempt and do not switch prompt versions, model behavior, transport,
scene, target, or deterministic plan during repair.

The response is untrusted until local structural and semantic checks pass.
