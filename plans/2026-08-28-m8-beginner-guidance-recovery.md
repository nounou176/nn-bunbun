# Make the M8 lesson understandable for a first-time learner

Status: Complete; repaired beginner scenario B manually accepted
Owner: Codex and user
Created: 2026-08-28
Last updated: 2026-08-28 16:30 Asia/Ho_Chi_Minh

## Purpose and user-visible outcome

Repair the onboarding and scaffold failure discovered during manual M8 Lesson
scenario B. A Vietnamese-supported N5 beginner must be able to identify the
required interaction, understand every control, request useful help before
becoming stuck, and complete `Three Minutes to the Last Train` without already
knowing the Japanese UI vocabulary.

The repaired lesson keeps Japanese visually primary, but adds a default guided
path with concise Vietnamese operational support. An optional immersive path
preserves the existing lower-support experience. Asking for or automatically
receiving guided language support marks the affected result assisted; it never
silently claims unaided evidence.

This plan is a focused recovery inside parent M8 Milestone 4. It does not alter
the accepted story, answer truth, world, dialogue, speech hashes, audio assets,
or interaction primitives.

## Repository context

The fixed lesson package is implemented in
`packages/contracts/fixtures/manifests/m8-last-train.json`. Its nine steps all
carry Vietnamese `supportText`, but almost all use `supportVisibility: ON_HELP`.
The runtime in `apps/web/src/ui/shell.ts` renders required controls with
Japanese-only labels such as `音声を聞く`, `次へ`, `ヒント`, `答える`, and
`リセット`. The `HELP_REQUESTED` transition in
`apps/web/src/lesson/controller.ts` only sets `helpUsed`; it does not make the
authored pattern, reading, or meaning scaffold immediately useful. Automatic
scaffolds remain tied to failed-attempt thresholds, and a terminal-attempt
scaffold may be visible only briefly before the lesson advances.

Manual M8 Lesson A passed on 2026-08-28. Manual B did not pass: the user reports
that a beginner becomes stuck and keeps trying to select a correct answer
without understanding the expected action. The parent plan
`plans/2026-08-27-m8-last-train-lesson-package.md` and
`docs/CURRENT_STATE.md` record that result.

This work is governed by the Japanese-first and low-friction principles in
`docs/BUNBUN_VISION.md`, the no-trap and authored-scaffold rules in
`docs/GAMEPLAY.md`, D-011's manual browser-testing boundary, D-015's local-game
boundary, and D-038's third-party approval gate.

## Scope

### In scope

- Add a default `GUIDED` launch choice for the M8 Last Train lesson and retain
  an explicit `IMMERSIVE` choice.
- Make required gameplay controls bilingual with Japanese first and concise
  Vietnamese action text second.
- Show one short, primitive-specific `Cách chơi` instruction on every step so
  the learner knows whether to listen, arrange, choose, type, move, click, pick
  up, or give.
- In guided mode, opt into the existing support route at each step so approved
  Vietnamese support and one relevant authored textual hint are visible before
  the learner is trapped.
- In immersive mode, keep support hidden initially; pressing the now-bilingual
  Help control reveals the same bounded authored support.
- Keep automatic wrong-attempt reduction/highlighting and deterministic
  assisted completion unchanged.
- Record guided/helped outcomes as assisted and keep unaided evidence distinct.
- Add focused controller/presentation tests and a concrete manual A/B/C retest.

### Out of scope

- Changing Japanese dialogue, answers, target bindings, NPC personalities,
  scene assets, speech WAVs, audio mix, or lesson graph.
- Translating every Japanese choice inline; guidance may explain the task or
  expose an already-authored meaning hint only through the assisted route.
- Adding a new manifest schema, interaction primitive, learner account,
  adaptive difficulty engine, analytics provider, dependency, service, model,
  asset, API key, or environment variable.
- Playwright, browser automation, Docker, hosting, staging, or release work.

## Decisions and constraints

- D-050 makes `GUIDED` the default Last Train launch mode because this first
  vertical slice targets N5 learners with Vietnamese support. `IMMERSIVE`
  remains one explicit alternative.
- Japanese remains the first and visually dominant label. Vietnamese explains
  the action rather than replacing the Japanese stimulus.
- Guided mode is an explicit learner support choice. The runtime must set the
  current step's help state before evaluation, so a correct guided response is
  stored as assisted rather than unaided.
- Manual help may reveal only content already authored on the current step:
  its support text, Japanese utterance, and the first applicable pattern,
  reading, or meaning hint. It cannot invent a hint or infer answer truth.
- `afterAttempt` continues to govern automatic scaffold activation, candidate
  reduction, and world highlighting. Manual help presentation must not insert
  premature scaffold IDs into checkpoints, preserving the D-040 invariant.
- Incremental and recurring cost is USD 0. No third-party operation or data
  flow is introduced.

## Implementation approach

Extend the local `LessonSelection` for the Last Train card with a support mode.
The card presents `Chơi có hướng dẫn tiếng Việt` as the recommended primary
action and `Thử thách chủ yếu bằng tiếng Nhật` as the secondary action. Pass
that local presentation preference through `apps/web/src/main.ts` into the
lesson runtime; it is not lesson truth and does not enter LessonManifest.

At each new step in guided mode, the runtime dispatches the existing
`HELP_REQUESTED` input once before the learner submits an assessed reaction.
This reuses current checkpoint/evidence semantics: support becomes visible and
later success is assisted. No active scaffold ID is forged at attempt zero.

`apps/web/src/ui/shell.ts` renders two distinct support layers:

1. an always-visible, runtime-owned operational cue derived only from the
   primitive type, such as “Bấm từng mảnh từ để xếp câu, rồi bấm Kiểm tra”; and
2. when `helpUsed` is true, the manifest-owned Vietnamese support plus the
   first applicable authored textual scaffold. Pattern, reading, and meaning
   remain visibly labelled as help.

Control labels become compact bilingual stacks. The Japanese action remains
first; Vietnamese text states the action (`Nghe câu thoại`, `Tiếp tục`,
`Gợi ý`, `Kiểm tra`, `Làm lại`, `Chơi lại`). World-action copy is corrected to
name the current interaction and tell the learner to click directly in the 3D
scene without identifying the correct distractor in unaided mode.

The existing automatic scaffold reducer remains the only owner of option
reduction, accepted-object reduction, entity highlighting, attempts, and
assisted state correction. This keeps the change bounded to launch preference,
help presentation, and control clarity.

## Milestones

### 1. Record the UX decision and mode boundary

After explicit approval, add an accepted decision defining guided-by-default
Last Train presentation, assisted-evidence semantics, bilingual controls, and
the unchanged content/audio/world boundary. Update the product/gameplay specs
and mark this plan Approved.

### 2. Implement guided launch and understandable controls

Update `apps/web/src/authoring/home.ts`, `apps/web/src/main.ts`,
`apps/web/src/lesson/runtime.ts`, `apps/web/src/ui/shell.ts`, and
`apps/web/src/style.css`. The observable checkpoint is that a first-time user
can start guided play, understand the current action without translating a UI
button, and deliberately choose Help or an answer.

### 3. Expose bounded authored help safely

Render existing support and the first relevant textual scaffold when help is
active. Preserve attempt-gated candidate reduction/highlighting and checkpoint
validity. Add focused tests proving guided results are assisted, immersive
correct results remain unaided, help never invents content, and attempt-zero
checkpoints contain no active scaffold IDs.

### 4. Verify and rerun manual acceptance

Run supported static, unit/integration, content, and build checks. Hand the
user a short manual beginner checklist, then rerun M8 Lesson A/B/C. Parent M8
Milestone 4 remained open until the user reported the repaired matrix results;
D-053 now records that closure.

## Progress

- [x] 2026-08-28 16:00 — Record `M8 LESSON A: PASS` in the parent plan and
      current state.
- [x] 2026-08-28 16:20 — Record manual B as failed because Japanese-only
      controls, hidden support, and late help leave a beginner stuck.
- [x] 2026-08-28 16:30 — Inspect the current shell, controller, manifest,
      product principles, shared memory, and active parent plan; prepare this
      recovery plan without changing runtime behavior.
- [x] 2026-08-28 16:42 — User explicitly approves the plan with
      `DUYỆT PLAN M8 BEGINNER GUIDANCE`; D-050 records guided-by-default,
      bilingual-control, bounded authored-help, and evidence semantics.
- [x] 2026-08-28 17:10 — Implement guided/immersive Last Train launch,
      Japanese-first bilingual lesson controls, eight primitive-specific
      operational cues, existing-authored textual Help, and evidence-honest
      automatic guided support without changing manifest or speech identity.
- [x] 2026-08-28 17:18 — Add five focused tests for complete primitive
      guidance, authored-only hints, guided assisted evidence, immersive help,
      next-step support, and the attempt-zero scaffold invariant.
- [x] 2026-08-28 17:28 — Pass typecheck, lint, formatting, schema drift, content
      and speech approval checks, audio/world runtime checks, aggregate tests
      (contracts 43/43, server 9/9, web 57/57), production build, and diff
      hygiene. The restricted server run reproduced the known Node loopback
      abort; the permitted rerun passes 9/9.
- [x] 2026-08-28 17:45 — The user's guided TYPE-step screenshot confirms the
      bilingual action layout but requests pronunciation alongside the pattern.
      Expose both already-authored `SHOW_PATTERN` and `SHOW_READING` hints, so
      `財布（さいふ）を探（さが）してください。` appears as `Cách đọc`.
      The same screenshot exposes hidden Continue/Restart buttons; add a CSS
      regression guard so bilingual buttons still obey `hidden`. Web tests pass
      58/58 after both fixes.
- [x] 2026-08-28 — User reports `M8 LESSON B RETEST: PASS`, accepting the
      repaired guided beginner path. Parent scenario C remained separate at
      this checkpoint.
- [x] 2026-08-28 13:17 — The next manual attempt exposed a replay persistence
      regression before the repaired beginner matrix could close: replaying
      `listen_aoi_request` resubmits a stable HEARD event with changed timing
      content and triggers `RUNTIME_LESSON_FAILED`. Record the root cause and
      defer its fix plus the newly requested Japanese text tools to
      `plans/2026-08-28-m8-japanese-text-tools-and-replay-recovery.md`, pending
      explicit approval.
- [x] 2026-08-28 — D-051 is approved and the focused replay/study-tools plan
      is implemented. Automated replay regression and the 40-record local
      Japanese study catalog pass; the combined guided manual retest remains
      open.
- [x] 2026-08-28 — D-052 is approved after the learner observed that the
      second wrong TYPE answer still advanced. TYPE now remains in an explicit
      model-answer correction state until normalized input is accepted; the
      result is assisted. Automated controller/persistence/UI checks pass; the
      user reports `M8 D-052 TYPE: PASS` and `M8 D-052 VISIBILITY: PASS`. The
      remaining lifecycle/failure scenario C retest was still open at this
      checkpoint.
- [x] 2026-08-28 — User reports `M8 LESSON C: PASS`; the parent lifecycle/
      failure matrix is accepted and D-053 closes Milestone 4.

## Surprises and discoveries

- The lesson already contains Vietnamese support for every step, so the core
  failure is presentation and timing rather than missing translation data.
- `HELP_REQUESTED` currently marks later evidence assisted but does not activate
  an authored scaffold. This lets the recovery expose bounded textual help
  without changing answer truth, but it must not place an `afterAttempt: 1`
  scaffold in an attempt-zero checkpoint.
- The strongest CHOOSE meaning scaffold is authored at the terminal attempt,
  making it too late to guide another response. Explicit help can expose that
  already-authored meaning as assisted presentation while automatic scaffold
  timing remains unchanged.
- The first guided screenshot revealed that `.bilingual-button` overrode the
  browser's default `[hidden]` display rule. An explicit
  `.bilingual-button[hidden]` rule is required so inactive Continue and Restart
  controls do not appear in TYPE or other phases.
- The replay failure is downstream of successful cached audio start. It is an
  evidence-idempotency defect: the same semantic HEARD ID is persisted again
  with a different timestamp/latency payload. The server's immutable-event
  rejection remains correct and must not be weakened.

## Plan decisions

- Accepted under D-050 on 2026-08-28 — Default the M8 Last Train entry to
  guided Vietnamese support, retain an explicit immersive option, and classify
  guided responses as assisted.
- Accepted under D-050 on 2026-08-28 — Keep exact content, speech, world, and
  answer hashes unchanged by deriving operational instructions from primitive
  types and displaying only already-authored help content.

## Validation

### Static and automated checks

From `/home/nunu/Desktop/nnlab/nn-bunbun` with Node.js 24.18.0:

1. `npm run typecheck`
2. `npm run lint`
3. `npm run format:check`
4. focused web/controller tests covering support modes and bilingual rendering
5. `npm test`
6. `npm run lesson:m8:content-check`
7. `npm run lesson:m8:content-approval-check`
8. `npm run lesson:m8:speech-approval-check`
9. `npm run world:m8:runtime-check`
10. `npm run audio:m8:runtime-check`
11. `npm run build`
12. `git diff --check`

No Playwright is added or run under D-011. Docker remains not applicable under
D-015 because the complete local game has not been accepted as a release
candidate.

### Manual happy path

1. Open the local library and confirm the Last Train card clearly offers a
   recommended Vietnamese-guided action and an immersive action.
2. Start guided mode and confirm Japanese stays primary while Vietnamese says
   what to do on all eight primitive types.
3. Complete all nine steps without guessing what a button or world action
   means; confirm assisted evidence is reported for guided steps.
4. Start immersive mode and complete correctly without Help; confirm the
   existing unaided happy path and reviewed audio remain intact.

### Manual edge cases

1. In immersive mode, press `Gợi ý / ヒント` before answering and verify useful
   authored support appears and later success is assisted.
2. Submit one wrong response and verify automatic scaffold escalation still
   appears before the next useful attempt.
3. Exhaust attempts and verify deterministic correction leaves no impossible
   move, carry, or transfer state.
4. Simulate unavailable speech and verify the bilingual assisted text path is
   understandable and completable without heard evidence.
5. Double-click controls and rapidly request Help; no duplicate result,
   transition, or evidence is recorded.

### Manual regression

1. Reload/resume guided and immersive sessions at interaction and world-action
   boundaries.
2. Switch among Last Train, neighborhood preview, and existing park lessons;
   runtime resources and presentation state do not leak.
3. Verify desktop and narrow layouts, automatic renderer and forced WebGL2.
4. Verify cached Aoi/Tanaka speech, ambience, cue mapping, mute, interruption,
   and completion remain unchanged.

### Manual results

| Scenario               | Tester | Date       | Result | Evidence or notes                                      |
| ---------------------- | ------ | ---------- | ------ | ------------------------------------------------------ |
| Existing M8 Lesson A   | User   | 2026-08-28 | PASS   | Pre-recovery unaided happy path                        |
| Existing M8 Lesson B   | User   | 2026-08-28 | FAIL   | Beginner cannot understand controls or expected action |
| Repaired M8 Lesson B   | User   | 2026-08-28 | PASS   | Guided path and compact study controls accepted        |
| Ordinary speech replay | User   | 2026-08-28 | PASS   | Repeated replay in scenario B accepted                 |
| Lifecycle scenario C   | User   | 2026-08-28 | PASS   | Reload, interruption, replay, and audio failure pass   |

## Recovery and compatibility

The change adds no database migration and does not mutate existing lesson,
speech, or world identities. If guided presentation fails, immersive mode and
the accepted deterministic lesson package remain available. Existing active
sessions retain valid checkpoints because guided help uses `helpUsed` and never
forges attempt-gated scaffold IDs. Removing the support-mode UI restores the
current runtime without data conversion.

## Documentation updates

- Add an accepted D-XXX record only after the user approves the plan.
- Clarify guided versus immersive support and manual-help semantics in
  `docs/BUNBUN_VISION.md`, `docs/GAMEPLAY.md`, and the parent M8 plan.
- Update `docs/CURRENT_STATE.md` and `docs/ROADMAP.md` after implementation and
  after user-reported manual results.

## Outcomes

Implementation is complete with no content, speech, world, schema, dependency,
provider, or cost change. Automated/static gates pass. The user's first guided
screenshot led to an authored-reading improvement and hidden-control regression
fix; `M8 LESSON B RETEST: PASS` accepts the repaired beginner path. Parent
scenario C subsequently passed and is accepted under D-053.
