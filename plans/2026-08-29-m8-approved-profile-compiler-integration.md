# Select, publish, and play the approved Last Train profile through the compiler

Status: Implemented under D-054; manual A/B/C acceptance pending
Owner: Codex and user
Created: 2026-08-29
Last updated: 2026-08-29 08:04 Asia/Ho_Chi_Minh

## Purpose and user-visible outcome

Complete parent M8 Milestone 5 by connecting learner target entry to the exact
Last Train package accepted under D-053. A learner enters the closed target set
`財布`, `探す`, and `～てください`; Bunbun normalizes the inputs, selects the
approved `lesson_m8_last_train` revision 1 profile, presents an explicit local
review, publishes the immutable package into the local lesson library, and
starts it in recommended guided or optional immersive mode.

This is an approved-profile selection path, not a claim that ChatGPT or a
Custom GPT generated the accepted Last Train content. It uses no authoring file
handoff, provider call, browser automation, synthesis, download, account,
credential, environment variable, or metered service. Existing M7 park
authoring for `犬`, `猫`, and `〜てください` remains available and unchanged.

The observable checkpoint is:

`財布 + 探す + ～てください`
→ deterministic approved-profile match
→ local review
→ explicit Publish
→ published library entry
→ guided Last Train gameplay
→ offline/local replay and resume.

## Repository context

M8 Milestone 4 is complete under D-053. The repository owns and manually
accepts the exact fixed package:

- manifest `packages/contracts/fixtures/manifests/m8-last-train.json`;
- catalog `packages/contracts/fixtures/catalogs/m8-last-train-catalog.json`;
- study sidecar
  `packages/contracts/fixtures/references/m8-last-train-study-catalog.json`;
- Content Gate 1 packet SHA-256
  `5e3cb41ab76b0f02958236c1c2241bc0d6c7e70b35a58996fa9f0072f7c403a6`;
- Speech Gate 2 packet SHA-256
  `f14d677762915f9c8bc868c7a624f17ac018d9ddb57fec315df9819461ff8d50`;
- world layout/runtime bundle `1.0.1`; and
- four immutable D-049 Aoi/Tanaka speech cache identities.

The fixed package is currently launched from a dedicated M8 demo card in
`apps/web/src/authoring/home.ts`. It bypasses the compilation lifecycle.
Published packages are loaded as untrusted data and validated before gameplay,
but `apps/web/src/main.ts` starts every published lesson in `IMMERSIVE` mode,
so a published Last Train package would lose its accepted guided default.

The M7 compiler in `apps/server/src/compiler/core.ts` currently supports only
the project-authored Bunbun Core targets `犬`, `猫`, and `〜てください`. It
always builds a `park_small` authoring request, waits for one manual
ChatGPT/Codex Skill file handoff, and normalizes the result into a new
`AI_ASSISTED` park lesson. The durable lifecycle in
`apps/server/src/compiler/repository.ts` supports
`AWAITING_AUTHORING → READY_FOR_REVIEW → PUBLISHED`, strict validation,
idempotent publication, and immutable `lesson_revisions`.

The shared runtime capability gate already accepts both `park_small` and
`neighborhood_small`. The web runtime already resolves the neighborhood world,
approved audio, study sidecar, evidence, resume, and all eight primitives. The
missing boundary is a truthful compiler profile that can select the accepted
package without pretending that the M7 prompt modules authored it.

This plan is governed by D-001 through D-005, D-010, D-011, D-015, D-021,
D-031, D-034 through D-038, D-043, D-045 through D-053, and the parent plan
`plans/2026-08-19-audio-complete-last-train-showcase.md`.

## Scope

### In scope

- Add one project-owned compiler profile,
  `m8_last_train_approved_v1`, bound to the exact accepted package and approval
  identities.
- Add reviewed local aliases for the exact required input set:
  - `財布` and `さいふ` → `target_wallet`;
  - `探す` and `さがす` → `target_search`;
  - `～てください`, `〜てください`, and `てください` →
    `target_te_kudasai`.
- Require all three requested targets for this profile. Normalize input order
  to the fixed profile order so aliases and permutations reuse one cache key.
- Keep `傘`, `駅`, and `～てはいけない` as fixed supporting targets supplied by
  the approved package. They are never claimed as learner-requested input.
- Extend compilation records with an explicit mode and profile identity while
  preserving all existing rows:
  - `AUTHORING_HANDOFF` for the M7 park compiler;
  - `APPROVED_PROFILE_SELECTION` for this M8 route.
- Store a closed trace envelope for the selected profile, but forbid request
  export and result import because no authoring provider participates.
- Create the M8 selection directly in `READY_FOR_REVIEW`; retain explicit
  Publish and Play actions.
- Validate the exact manifest/catalog, runtime capabilities, fixed package
  fingerprint, Content Gate identity, Speech Gate cache identities, and study
  sidecar binding before the package becomes reviewable or playable.
- List locally published packages by their explicit published compilation
  linkage rather than by assuming `provenance.source === AI_ASSISTED`.
- Preserve the selected manifest's truthful `AUTHORED` provenance and empty
  prompt-module list. Compilation/profile lineage belongs to the compilation
  record, not a falsified manifest field.
- Update the pre-game UI so the Last Train target set can be filled easily,
  the route is explained in Vietnamese, no GPT handoff controls appear for the
  selection route, and review shows requested versus supporting targets.
- Give a published Last Train library entry recommended guided and explicit
  immersive launch actions. Keep existing published park lessons immersive.
- Require the four exact speech rows to be `READY` before ordinary published
  Last Train launch, while preserving the accepted simulated-audio-failure
  recovery path for manual testing.
- Keep the direct fixed-package Last Train card as a clearly labeled local
  regression route until Milestone 6 handoff proves the compiler-linked route.
- Add focused contract/server/web tests and a manual acceptance matrix.
- Record integration and performance observations without introducing a new
  analytics or telemetry contract.

### Out of scope

- Asking the existing Custom GPTs or the composed Skill to rewrite Last Train.
- Claiming that the selected fixed package is AI-generated.
- Changing any approved Japanese/Vietnamese content, answer, target role,
  graph, step, scaffold, cue, world transform, camera, animation, mix value,
  speech text, voice, WAV, study note, or package identity.
- A new Content Gate, Speech Gate, study-content review, or world/asset gate.
- Arbitrary Japanese input, target-set subsets, mixed park/neighborhood target
  sets, profile composition, or procedural scenario selection.
- A new authoring contract or prompt-module version. Authoring 0.2.0 and the
  three prompt modules at 0.1.0 remain unchanged.
- Requalifying the M7 v3.2 transport waived under D-035/D-036. The park route
  remains `UNVERIFIED_USER_WAIVED`.
- New third-party dependency, model, service, API, asset, dictionary, voice,
  account, credential, environment variable, or recurring operation.
- OpenAI API, Amazon Polly, hosted inference, WXT, MCP, browser automation,
  programmatic login, or cookie/session reuse.
- Runtime AI, new interaction primitives, branching, NPC simulation, new
  animals, a larger city, SPEAK, pronunciation scoring, or fuzzy grading.
- New persistence of raw TYPE text, learner identity, chat history, or remote
  data.
- Docker, hosting, staging, release automation, or domain configuration.
- Automated Playwright/browser E2E.

## Decisions and constraints

### Recommended route

Use deterministic approved-profile selection for Milestone 5.

Three routes were considered:

1. **Approved-profile selection — recommended.** Select the byte-identical
   D-053 package from the exact requested target set. This preserves every
   content, speech, study, world, and manual-acceptance identity.
2. **Generate a new Last Train variant through the M7 Skill — defer.** This
   would change reviewed language fields, require a new content/study review,
   and potentially require new speech generation and listening approval. It is
   a later compiler-profile gate, not a safe reuse of D-053.
3. **Use GPT output but ignore or partially hide it — reject.** This would make
   provenance and learner expectations misleading without improving the
   accepted gameplay package.

D-054 accepts route 1 only and states that Milestone 5 proves
target-to-approved-package selection, not freeform AI generation for the
neighborhood.

### Exact target and profile policy

- All three requested targets are required. A subset does not match because
  the fixed manifest marks all three as `REQUESTED`.
- Input order and approved aliases do not create a different package or cache
  key.
- Unknown, partial, duplicate, or mixed-profile input fails locally with an
  actionable message before export, publication, or gameplay.
- The package stays `lesson_m8_last_train` revision 1. A compilation links to
  that immutable revision; it does not clone or mutate it.
- If the same revision already exists from prior direct gameplay, publication
  may link it only when the canonical package fingerprint matches exactly.
  Different bytes under the same identity fail closed.

### Third-party, cost, data, and operation review

| Area                             | Approved Milestone 5 effect                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Incremental usage cost           | USD 0                                                                                                              |
| Recurring provider cost          | USD 0                                                                                                              |
| New service/API/model            | None                                                                                                               |
| New package/dependency           | None                                                                                                               |
| New asset/download               | None                                                                                                               |
| Account/key/environment variable | None                                                                                                               |
| Learner data leaving localhost   | None for the M8 selection route                                                                                    |
| Runtime network dependency       | Existing same-origin local server only                                                                             |
| TTS operation                    | No generation during selection or gameplay                                                                         |
| Removal                          | Remove the profile mapping/UI route; immutable local data remains resettable through the confirmed local-data flow |

The M7 park `AUTHORING_HANDOFF` route still has its existing explicit learner-
target disclosure when the user exports a request. The new M8 selection route
does not expose or export its trace envelope.

### Product and runtime invariants

- Optimize for meaningful Japanese reactions, not authoring ceremony.
- Keep all eight fixed primitives and the D-053 accepted nine-step graph.
- AI does not create Three.js code or run during gameplay.
- Three.js owns the world; DOM owns review and learning UI.
- The selected package passes full schema, semantic, runtime capability,
  approval, and fingerprint checks before world activation.
- Ordinary gameplay remains deterministic and local after selection.
- Guided/helped outcomes remain assisted; replay and audio-failure evidence
  retain D-051/D-053 semantics.
- Do not tune accepted camera, animation, mixing, content, or pacing without a
  measured defect and a new explicit approval. Milestone 5 polish is limited
  to the compiler/library handoff, route clarity, readiness, and supported
  launch choice.

## Implementation approach

Add a small compiler-profile registry owned by server code. It contains the
existing park authoring profile and one M8 approved selection profile. Profile
matching occurs after the current safe Unicode normalization and before an
authoring request can be exported.

For `m8_last_train_approved_v1`, the registry canonicalizes the three accepted
target identities, calculates a cache key from the profile version plus exact
manifest/catalog and approval fingerprints, and returns the validated existing
package as a pending review candidate. The repository writes a compilation row
in `READY_FOR_REVIEW` with mode `APPROVED_PROFILE_SELECTION`; no attempt row is
created. The stored trace envelope makes the normalized input and selected
world/steps inspectable, but the HTTP request-export and result-import routes
reject this mode with a stable conflict code.

Publication continues through the existing explicit confirmation. It inserts
or reuses the exact immutable `lesson_m8_last_train` revision 1 row and links
the compilation to it. The library query lists revisions linked from published
compilations, whether their manifest provenance is `AI_ASSISTED` or `AUTHORED`.
This avoids rewriting the fixed package's provenance merely to satisfy the old
library filter.

The web view receives `mode` and `profileId`, renders a local approved-profile
review instead of GPT handoff instructions, and offers Publish. Published Last
Train cards expose guided and immersive buttons, with guided visually
recommended. Before either starts, the client confirms the four exact speech
rows are `READY` with their approved WAV identities. The existing debug
`audioFailure=1` flag remains the only deliberate way to exercise in-game text
fallback while the approved assets are present.

The direct M8 demo card remains a regression escape hatch for this milestone.
Milestone 6 may remove or demote it only after the compiler-linked path is
manually accepted and the user approves that cleanup.

## Milestones

### 1. Lock the approved compiler profile and migration

Add a project-authored profile/reference record for the three requested and
three supporting Last Train targets, exact aliases, package identity, and gate
hashes. Add a checksummed SQLite migration that records compilation `mode` and
`profile_id`, defaulting all existing rows to the current park authoring route.

Affected areas:

- `packages/contracts/fixtures/references/` and package exports;
- `apps/server/src/compiler/`;
- `apps/server/src/persistence/migrations.ts`; and
- focused contract/server tests.

Observable checkpoint: existing databases reopen with every old compilation
unchanged, while all accepted permutations of the exact M8 set resolve to one
profile/cache identity.

### 2. Create an exact reviewable selection

Refactor compiler draft creation into the two closed routes. Build the M8 trace
envelope from approved project data and put the exact validated package into
`READY_FOR_REVIEW` without an authoring attempt. Reject export/import for this
mode and preserve those operations for the park route.

Add exact pre-publication checks for:

- manifest and catalog schema/semantics;
- `neighborhood_small` runtime capabilities;
- lesson/revision and canonical package fingerprint;
- Content Gate input identity;
- four Speech Gate cache identities and approved WAV hashes;
- study catalog lesson/revision and exact Japanese/audio bindings; and
- `AUTHORED` provenance with no prompt-module claim.

Observable checkpoint: target entry creates one truthful review candidate and
cannot silently drift from D-053.

### 3. Publish and load through the normal library boundary

Keep explicit reviewed publication and immutable revision conflict handling.
Change lesson listing to use published-compilation linkage rather than an
`AI_ASSISTED` provenance filter. Load selected packages through the same
server and client validators used by every published package.

Observable checkpoint: publishing is idempotent, an already persisted exact
revision is reused, different bytes under the same identity fail, and the
published package remains playable after restart without recreating a
compilation or contacting an authoring provider.

### 4. Make target selection and launch understandable

Update the pre-game UI to describe both closed compiler profiles. Add a
one-click Last Train target preset while retaining editable Japanese inputs.
Render mode/profile, requested/supporting targets, exact package review, and a
clear “no GPT handoff required” message. Hide download/import controls for the
selection route.

Published Last Train entries provide:

- recommended `Chơi có hướng dẫn tiếng Việt`;
- optional `Thử thách chủ yếu bằng tiếng Nhật`; and
- visible speech-readiness status with a recovery link/message when exact
  approved speech is unavailable.

Observable checkpoint: a first-time learner can go from the three target
fields to guided gameplay without mistaking the selection for newly generated
content or being forced into immersive mode.

### 5. Verify integration, regression, and measurable handoff

Run all supported checks, then hand the user a focused manual A/B/C matrix.
Record exact diagnostics supplied by the user without inferring broader device
support or performance.

Observable checkpoint: target selection, review, publication, guided play,
resume, local/offline replay, fallback, M7 park compatibility, and direct M8
regression all pass. Parent M8 Milestone 5 closes only after the user reports
the required manual results.

## Progress

- [x] 2026-08-29 08:04 — Inspect the accepted D-053 package, M7 compiler,
      durable publication repository, web authoring/library UI, shared runtime
      capability gate, world/audio/study boundaries, and current tests.
- [x] 2026-08-29 08:04 — Identify the integration gaps: M7 accepts only park
      targets, Last Train bypasses the compiler, the lesson library filters out
      `AUTHORED` provenance, and published lessons always launch immersive.
- [x] 2026-08-29 08:04 — Recommend exact approved-profile selection instead of
      reopening content, study, speech, and world gates or falsely attributing
      the fixed package to a GPT.
- [x] 2026-08-29 — User explicitly approves
      `PLAN M8 MILESTONE 5 — APPROVED PROFILE SELECTION`; record D-054 and
      begin implementation without expanding provider, dependency, asset, or
      cost scope.
- [x] 2026-08-29 — Implement migration 4, the exact approved profile and trace,
      speech/package/study/runtime gates, zero-attempt review selection,
      immutable publication linkage, and published-package loading.
- [x] 2026-08-29 — Implement the Last Train target preset, mode-aware review,
      requested/supporting target summary, no-handoff selection UI,
      speech-readiness recovery, and recommended guided/optional immersive
      published launch while preserving park behavior.
- [x] 2026-08-29 — Pass supported automated gates: contracts 46/46, server
      18/18, web 71/71, typecheck, lint, format, schema 57/57, content/speech/
      study/audio/world validators, production build, and diff hygiene.
- [ ] Receive the user's manual A/B/C results and close Milestone 5 only when
      every required scenario passes.

## Surprises and discoveries

- The shared runtime capability gate already contains the complete
  `neighborhood_small` capability set, so Milestone 5 does not need a new
  renderer or primitive boundary.
- The current published-library query deliberately includes only manifests
  with `AI_ASSISTED` provenance. The fixed Last Train package must not change
  provenance merely to become visible; publication linkage is the correct
  selection criterion.
- Published packages currently default to `IMMERSIVE` even when the exact
  package is Last Train. The accepted D-050 guided default exists only on the
  direct demo selection variant.
- A direct Last Train play may already have persisted the exact lesson revision
  before compiler publication. Existing publication fingerprint conflict logic
  can safely reuse that row when bytes match.
- The M7 authoring packet can technically describe the neighborhood, but using
  its GPT contribution would create new reviewed language rather than select
  the D-053 package. Schema capability is not approval to mutate accepted
  content.

## Plan decisions

- 2026-08-29 — Recommend an exact, order-insensitive three-target profile.
  Subsets would contradict the fixed package's requested-target roles.
- 2026-08-29 — Recommend explicit review and publication even though selection
  is deterministic. This preserves the current human publication boundary and
  makes the selected package inspectable.
- 2026-08-29 — Recommend truthful `AUTHORED` manifest provenance plus separate
  compiler-selection lineage. Do not label selected bytes `AI_ASSISTED`.
- 2026-08-29 — Recommend no visual/audio/content tuning without a measured
  problem. D-053 is the known-good baseline; integration polish should not
  invalidate it silently.
- 2026-08-29 — Recommend retaining the direct fixed-package card through
  Milestone 6 as a recovery/regression route.

## Validation

### Static and automated checks

Run from `/home/nunu/Desktop/nnlab/nn-bunbun` with Node.js 24.18.0 active:

1. `npm run typecheck`
2. `npm run lint`
3. `npm run format:check`
4. `npm run schema:check`
5. `npm test`
6. `npm run lesson:m8:content-approval-check`
7. `npm run lesson:m8:speech-approval-check`
8. `npm run lesson:m8:study-check`
9. `npm run audio:m8:runtime-check`
10. `npm run world:m8:runtime-check`
11. `npm run build`
12. `git diff --check`

Focused tests must cover:

- every approved alias and target-order permutation produces one canonical M8
  profile/cache identity;
- partial, duplicate, unknown, and mixed-profile targets fail before review;
- the existing M7 park route still creates `AWAITING_AUTHORING` and permits one
  export/import lifecycle;
- M8 selection creates `READY_FOR_REVIEW` with zero authoring attempts;
- request export and result import reject M8 selection with stable errors;
- selected package bytes, approval hashes, speech identities, study binding,
  runtime capabilities, and provenance are exact;
- publication and repeated publication are idempotent;
- a matching existing lesson revision is reused and a mismatched revision is
  rejected;
- published lesson listing uses publication linkage without exposing unrelated
  authored/evidence revisions;
- migration preserves existing M7 compilation rows and reset remains safe;
- the M8 review UI has no GPT handoff controls and explains the selected route;
- published M8 launch offers guided and immersive, with guided recommended;
- missing/unready exact speech prevents ordinary production launch with a
  recoverable message; and
- authored demo, direct M8 demo, park published lessons, study tools, audio
  fallback, persistence, and renderer behavior remain regression-covered.

Automated browser E2E remains excluded under D-011. Docker remains not
applicable under D-015 because local release-candidate acceptance has not begun
and the repository has no Dockerfiles.

### Manual happy path — A

1. Start the existing local server and web app.
2. Use the Last Train preset or enter `財布`, `探す`, and `～てください` in any
   accepted order.
3. Confirm the result immediately becomes `READY_FOR_REVIEW`, identifies
   `m8_last_train_approved_v1`, states that no GPT handoff is required, and
   contains no download/import controls.
4. Confirm review shows requested versus supporting targets, nine steps,
   approved world/content/speech identities, and `AUTHORED` provenance.
5. Publish once, open the library entry, and choose recommended guided play.
6. Complete all nine steps with speech, ambience, effects, study tools, and
   local evidence.
7. Report renderer, FPS, average/p95 frame time, draw calls, triangles,
   scene-ready time, first-stimulus time, and any visible/input/audio delay from
   diagnostics.

### Manual edge cases — B

1. Repeat with aliases and a different order; confirm the existing compilation
   and exact revision are reused rather than duplicated.
2. Try one or two of the required targets, a duplicate, an unknown target, and
   a mix such as `犬 + 財布`; confirm an actionable local rejection.
3. Double-click Create and Publish; confirm one compilation, one revision, and
   no duplicate library card.
4. Reload before publication and after publication; confirm durable review and
   library state.
5. Start the published package in immersive mode, request help, and verify
   assisted evidence remains distinguishable.
6. Start with `?audioFailure=1&debug=1`; confirm visible assisted text recovery
   and completion without a false HEARD event.

### Manual regression — C

1. Create `犬` or `猫 + 〜てください`; confirm the existing M7 route still
   waits for authoring and exposes its request download/import controls.
2. Play the direct fixed Last Train regression card and confirm it remains
   byte-identical and guided by default.
3. Play an existing published park lesson and the authored eight-primitive
   demo; confirm neither is forced into the neighborhood or guided mode.
4. Resume the compiler-linked Last Train package after reload and background/
   return; confirm no duplicated evidence or audio overlap.
5. Force WebGL2 and inspect narrow/wide layouts; confirm review controls do not
   obscure active gameplay and the world remains dominant.
6. Exercise manifest, asset, persistence, and audio failure controls; confirm
   safe recovery and no partially activated world.

### Manual results

| Scenario                                                    | Tester  | Date    | Result  | Evidence or notes   |
| ----------------------------------------------------------- | ------- | ------- | ------- | ------------------- |
| A — exact target → review → publish → guided completion     | Pending | Pending | Not run | Awaiting manual run |
| B — aliases, idempotency, errors, immersive, audio fallback | Pending | Pending | Not run | Awaiting manual run |
| C — M7/direct-M8/runtime/persistence/renderer regression    | Pending | Pending | Not run | Awaiting manual run |

Automated implementation results on 2026-08-29:

| Gate                                 | Result                                       |
| ------------------------------------ | -------------------------------------------- |
| Contracts                            | PASS — 46/46                                 |
| Server                               | PASS — 18/18                                 |
| Web                                  | PASS — 71/71                                 |
| Typecheck, lint, format, schema      | PASS — schema artifacts 57/57                |
| Content, speech, study, audio, world | PASS — accepted identities unchanged         |
| Production build                     | PASS — existing large-chunk warning retained |
| Playwright/browser E2E               | Not applicable under D-011                   |
| Docker                               | Not applicable under D-015                   |

## Recovery and compatibility

The migration is forward-only, checksummed, and additive. Existing compilation
rows receive `AUTHORING_HANDOFF` and `park_authoring_v1`; no request, attempt,
pending package, published revision, evidence, checkpoint, preference, or
speech row is rewritten.

M8 selection is idempotent over normalized target identities, profile version,
exact package fingerprint, and approval identities. A retry after interruption
returns the same compilation. Publication reuses an exact existing revision and
fails on fingerprint conflict. A failed readiness or validation gate leaves the
candidate unpublished and the direct accepted regression route intact.

If implementation stops after the migration, the existing M7 and direct M8
routes remain usable. If it stops after server selection but before web polish,
the package remains unpublishable or reviewable through narrow API state rather
than being auto-launched. No development cleanup command deletes user data.
Only the existing confirmed local-data reset owns deletion.

Rollback before release means removing the new route/UI while leaving the
additive columns and immutable stored revisions readable. Do not downgrade or
rewrite the SQLite schema.

## Documentation updates

Implemented documentation updates:

- add D-054 to `docs/DECISIONS.md`;
- update compiler/profile and provenance boundaries in
  `docs/BUNBUN_ARCHITECTURE.md` and `docs/LESSON_MANIFEST.md`;
- update target-to-reaction and guided launch behavior in `docs/GAMEPLAY.md`;
- update numeric observations only from user-reported values in
  `docs/PERFORMANCE.md`;
- update `docs/AI_MODULES.md` to state that this fixed profile selects approved
  content without invoking the prompt modules;
- preserve world/runtime identities in `docs/WORLD_AUTHORING.md`;
- update `docs/CURRENT_STATE.md`, `docs/ROADMAP.md`, the parent M8 plan, and
  this plan after every meaningful checkpoint; and
- add a secret-free shared-memory record after implementation or acceptance.

## Outcomes

Implementation is complete and supported automated checks pass. Milestone 5
remains open for user-run manual A/B/C acceptance. It closes only when the exact
target set selects, reviews, publishes, and plays the approved package; the
user reports all required manual results; provenance remains truthful; and no
content/audio/world gate is silently reopened.
