# Keep typed practice learnable and critical actors visible

Status: Complete; manual TYPE and visibility acceptance passed
Owner: Codex and user
Created: 2026-08-28
Last updated: 2026-08-28 Asia/Ho_Chi_Minh

## Purpose and user-visible outcome

Repair two defects found during manual M8 Last Train acceptance. A wrong
Japanese TYPE submission must never silently advance the lesson. The learner
keeps the submitted text, receives progressively stronger authored guidance,
and can keep correcting it until the normalized answer is accepted. Once the
authored attempt limit is reached, exact model-answer assistance is explicit;
completion is recorded as assisted rather than unaided.

The rainy-neighborhood composition must also keep Momo and Bunbun readable at
the accepted isometric camera. Revise only the positions of the two decorative
trees that cross those sight lines. Keep the approved tree models, source
hashes, camera, actor/object/location positions, walkable region, lesson
content, and runtime interaction identities unchanged.

## Repository context

`apps/web/src/lesson/controller.ts` currently completes every
`CONTINUE_ASSISTED` interaction immediately after its final wrong attempt. For
TYPE this means the second wrong answer in `type_wallet_request` advances to
the next step. The existing final scaffold already exposes the exact reading,
and typed raw text is intentionally absent from persisted evidence.

The fixed world layout places Momo at the park edge behind the western/northern
tree cluster and places the player spawn on a sight line crossed by the small
path tree. The attached manual-test screenshot shows both failures. The world
is deterministically assembled from `docs/world-sources/M8_WORLD_LAYOUT_V1.json`;
changing those project-authored transforms requires regenerating the static
GLB and its runtime hash record, not selecting another asset.

## Approved scope

- TYPE wrong submissions never invoke a success, failure, or assisted
  transition.
- Preserve ordinary bounded reaction evidence through the authored maximum.
  Further correction attempts remain local and do not reuse immutable event
  IDs.
- At the maximum, retain the final scaffold, expose a bilingual recovery
  explanation and an explicit button that fills the exact model answer without
  submitting it.
- A correct normalized correction after the maximum completes the step as
  `ASSISTED`; it does not claim an additional unaided production reaction.
- Resume must reconstruct the correction state from the existing checkpoint
  attempt/scaffold fields without an evidence schema migration.
- Move only the two decorative trees that obscure Momo/player sight lines,
  regenerate the deterministic static GLB, and update exact runtime/layout
  hashes and budget facts.
- Add focused controller, DOM/source, world-layout, assembly, and persistence
  regression coverage.

## Excluded scope

- No new primitive, LessonManifest version, persistence migration, raw typed
  response storage, fuzzy semantic grading, runtime AI, tokenizer, dictionary,
  audio, model, source asset, dependency, service, key, environment variable,
  hosting, Docker, or browser automation.
- CONTINUE_ASSISTED behavior for MOVE_TO, PICK_UP, GIVE, CHOOSE, ARRANGE,
  CLICK_OBJECT, and LISTEN remains unchanged.
- Actor, clue, location, camera, navigation, and source-model identities remain
  unchanged.

## Implementation approach

1. Add a deterministic TYPE guided-correction branch to the controller. The
   final wrong authored attempt records its normal incorrect reaction, applies
   final scaffolds, and returns to `AWAITING_TYPE`. Later wrong corrections
   show feedback without another event; a correct correction finishes
   `ASSISTED` at the capped attempt.
2. Add a compact recovery block to the TYPE form. It states that the learner
   has not passed yet, shows the exact accepted model sentence and offers a
   bilingual fill button. Filling changes only the draft; the learner still
   presses Check.
3. Revise the two decorative tree transforms in the authoritative layout,
   regenerate the static bundle and runtime packet, and keep source approval
   identities unchanged.
4. Update D-052, gameplay/world specifications, current state, roadmap, and
   active parent/focused plans after implementation checks pass.
5. Hand off manual happy, edge, persistence, visibility, and regression checks.

## Validation

- Focused web/controller tests: immediate success, first wrong, final wrong,
  repeated post-limit wrong, model fill, normalized assisted correction, and
  checkpoint resume.
- Server persistence regression: no reused reaction identity and no raw TYPE
  response.
- World tests: exact actor/player positions unchanged, revised tree transforms
  deterministic, output hashes/facts valid, and budgets within ceilings.
- Run typecheck, lint, formatting, schema/content/audio/world checks, full unit
  tests, production build, and `git diff --check`.
- No Playwright under D-011. Docker remains not applicable under D-015.

## Progress

- [x] 2026-08-28 — User approved `DUYỆT PLAN M8 TYPE GUIDED RETRY` and added
      the tree-occlusion repair using an attached manual-test screenshot.
- [x] 2026-08-28 — Confirmed the automatic TYPE assisted transition and exact
      park-tree sight-line causes in code and authoritative world data.
- [x] 2026-08-28 — Implement TYPE guided correction, explicit model-answer
      fill UI, checkpoint reconstruction, bounded evidence, and focused web/
      server persistence regressions.
- [x] 2026-08-28 — Revise two decorative tree transforms, bump deterministic
      layout/runtime to `1.0.1`, regenerate the static GLB, and validate exact
      output hashes and unchanged budgets.
- [x] 2026-08-28 — Pass contracts 46/46, server 10/10, web 68/68, deterministic
      world tests, typecheck, lint, formatting, 57 schema artifacts, all
      relevant M8 content/speech/study/audio/world gates, production build,
      and diff hygiene. Update D-052 and affected durable specifications.
- [x] 2026-08-28 — User reports `M8 D-052 TYPE: PASS` and
      `M8 D-052 VISIBILITY: PASS`. Accept the guided TYPE correction and the
      revised Momo/Bunbun sight lines. This does not imply acceptance of the
      still-open D-051 replay/study matrix or the broader Milestone 4 B/C run.
