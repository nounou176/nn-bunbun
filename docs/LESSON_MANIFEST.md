# LessonManifest Contract

## Status and intent

This document defines the normative LessonManifest contract version 0.1.0.
Milestone 2 implements it as shared TypeBox schemas, inferred TypeScript types,
strict Ajv structural validation, and pure TypeScript semantic validation under
packages/contracts.

The executable source is packages/contracts/src/schema, validation lives in
packages/contracts/src/validation, and the checked artifacts are
packages/contracts/schemas/lesson-manifest-0.1.0.schema.json and
packages/contracts/schemas/catalog-snapshot-0.1.0.schema.json. Authored valid
and invalid examples live under packages/contracts/fixtures. D-017 records the
schema-first implementation decision.

The manifest is playable data, not source code. It tells a fixed runtime which
catalog content to load and which fixed interactions to execute.

## Contract rules

The keywords MUST, MUST NOT, SHOULD, and MAY express requirement strength.

- JSON is UTF-8 and uses camelCase field names.
- The root value and every nested record MUST reject unknown properties.
- Optional properties MUST be omitted rather than set to null.
- IDs MUST match ^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$ and be at most 64 characters.
- Catalog IDs and local IDs occupy separate namespaces but follow the same
  format.
- User-facing text fields are plain text. HTML, script, Markdown execution, and
  template expressions are forbidden.
- Japanese content strings MUST be non-empty after trimming.
- Arrays that express authored order preserve that order.
- Durations use integer milliseconds. Distances use positive Three.js world
  units.
- Timestamps use RFC 3339 UTC strings.
- Enumerations are closed and case-sensitive.
- A playable manifest MUST contain no prompt, model instruction, executable
  code, arbitrary URL, filesystem path, or provider secret.

The generated JSON Schema sets additionalProperties to false for every object
and uses discriminated oneOf branches for interaction and target types. The
schema artifact is generated from the TypeBox source and checked for drift.

## Lifecycle

1. The backend normalizes learner input.
2. The compiler selects valid catalog identifiers.
3. The selected M7 strategy supplies a versioned untrusted contribution draft;
   Structured Outputs is only the preserved M7 v1 transport.
4. Deterministic schema validation runs.
5. Semantic, reference, reachability, coverage, language, and budget validation
   run.
6. TTS references and provenance are resolved.
7. The backend assigns manifestId, revision, timestamps, and randomSeed.
8. The accepted playable manifest is persisted.
9. The client validates the supported schema version again before loading.

A schema-valid draft is not necessarily playable. Only a manifest that passes
all deterministic validators may reach the runtime.

D-027 does not change contract 0.1.0. OpenAI API, local-LLM, or browser-mediated
compiler strategies must all normalize into this same playable contract and
must never place provider, browser-session, Custom GPT link, token, or transport
state in a manifest.

Contract 0.1.0 rejects every graph cycle because it has no counter or condition
language with which to prove a cycle bounded. The validator proves rules that
can be derived from the manifest and supplied CatalogSnapshot; it does not
claim natural-language quality, physical reachability from future 3D geometry,
or pedagogical quality beyond its authored fields. Runtime persistence is
defined independently by EvidencePersistence 0.1.0 in
EVIDENCE_PERSISTENCE.md; it does not add fields to LessonManifest 0.1.0.

## Root LessonManifest

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| schemaVersion | string | yes | Exactly 0.1.0 for this contract |
| manifestId | ID | yes | Stable identifier for this manifest lineage |
| lessonId | ID | yes | Stable logical lesson identifier |
| revision | integer | yes | Starts at 1 and increases for changed content |
| createdAt | RFC 3339 string | yes | Assigned by backend |
| randomSeed | integer | yes | 0 through 2147483647 |
| locales | Locales | yes | Target locale MUST be ja |
| title | LocalizedText | yes | Short lesson title |
| learningTargets | LearningTarget[] | yes | 1–30 unique targets |
| scene | SceneSelection | yes | One reusable micro-scene |
| scenario | Scenario | yes | One fixed scenario template |
| locations | LocationInstance[] | yes | May be empty if MOVE_TO is unused |
| entities | EntityInstance[] | yes | 0–5 active NPCs or animals |
| objects | ObjectInstance[] | yes | 0–30 interactive object instances |
| audioAssets | AudioAsset[] | yes | May be empty only when no audio is used |
| steps | LessonStep[] | yes | 1–60 unique steps |
| entryStepId | ID | yes | References one step |
| completion | CompletionPolicy | yes | Non-mastery lesson completion |
| quality | QualityTargets | yes | Compiler-checked lesson budgets |
| provenance | Provenance | yes | Diagnostic generation metadata |

Arrays MUST not contain duplicate IDs. The limits above protect the first MVP
and may only change through an accepted decision.

## Locales and localized text

Locales:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| target | string | yes | Exactly ja |
| support | BCP 47 language tag | no | One support locale for contract 0.1.0 |

LocalizedText:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| ja | string | yes | 1–120 characters |
| support | string | no | 1–240 characters; requires locales.support |

Support text is scaffolding. It MUST NOT be required to complete a normal
interaction when Japanese and context are sufficient.

## Learning targets

Every target contains:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| targetId | ID | yes | Unique within manifest |
| kind | enum | yes | VOCABULARY, GRAMMAR, or KANJI |
| role | enum | yes | REQUESTED or SUPPORTING |
| priority | integer | yes | 1–5; 5 is highest |
| content | discriminated object | yes | Must match kind |
| referenceIds | ID[] | yes | Curated/reference records; may be empty for grammar |
| goal | TargetGoal | yes | Coverage expectations for this lesson |

TargetGoal:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| minimumEncounters | integer | yes | 1–10 |
| minimumContexts | integer | yes | 1–5 and not above minimumEncounters |
| desiredEvidence | enum[] | yes | Unique values from the evidence vocabulary |

desiredEvidence is a compilation goal, not a promise that the learner will
answer correctly. All requested targets MUST have at least one reachable
exposure path.

### VocabularyTargetContent

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| kind | string | yes | Exactly VOCABULARY |
| writtenForms | string[] | yes | 1–5 accepted display forms |
| readings | string[] | yes | 1–5 kana readings |
| supportGlosses | string[] | no | 1–5 short glosses; support locale required |
| partOfSpeech | enum | no | NOUN, VERB, I_ADJECTIVE, NA_ADJECTIVE, ADVERB, EXPRESSION, OTHER |

### GrammarTargetContent

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| kind | string | yes | Exactly GRAMMAR |
| pattern | string | yes | Canonical Japanese pattern, 1–120 characters |
| labelJa | string | yes | Short Japanese label |
| supportExplanation | string | no | At most 400 characters; support locale required |

Examples belong in lesson stimuli, not in the target definition.

### KanjiTargetContent

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| kind | string | yes | Exactly KANJI |
| character | string | yes | Exactly one Unicode Han character |
| readings | string[] | yes | 1–12 curated readings |
| supportGlosses | string[] | no | 1–8 short glosses; support locale required |

KANJI targets MUST have at least one referenceIds entry. Components, radicals,
and decompositions come from the referenced deterministic record and MUST NOT
be authored freely inside the manifest.

## Scene and scenario

SceneSelection:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| sceneId | ID | yes | Registered scene catalog ID |
| variantId | ID | no | Registered variant compatible with sceneId |
| playerSpawnPointId | ID | yes | Registered spawn point |
| cameraPresetId | ID | yes | Registered isometric/diorama camera preset |
| assetBundleIds | ID[] | yes | Unique registered bundles needed by lesson |

Under D-025, registered scene and bundle IDs may resolve to bounded GLB world
chunks assembled with the approved authoring pipeline. Authoring-tool settings,
source asset paths, terrain parameters, transforms, navigation geometry, and
license records remain outside LessonManifest and are owned by reviewed
application metadata. This clarification does not change contract 0.1.0.

Scenario:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| template | enum | yes | One initial scenario template |
| objective | LocalizedText | yes | Concrete learner-facing objective |
| focusTargetIds | ID[] | yes | 1 or more learning target IDs |
| synopsis | string | no | Developer-facing plain text, at most 500 characters |

Allowed template values:

- FIND_SOMETHING
- HELP_SOMEONE
- BUY_SOMETHING
- GO_SOMEWHERE
- PREPARE_SOMETHING
- DELIVER_SOMETHING
- MEET_SOMEONE
- SOLVE_SMALL_PROBLEM

synopsis is diagnostic context and is not automatically shown to the learner.

## World instances

All instances reference catalog-authored capabilities. A manifest may choose an
instance and its initial catalog state, but may not define meshes, materials,
scripts, or animations.

LocationInstance:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| locationId | ID | yes | Lesson-local unique ID |
| catalogLocationId | ID | yes | Registered location in selected scene |
| initialStateId | ID | no | Registered state |

EntityInstance:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| entityId | ID | yes | Lesson-local unique ID |
| catalogEntityId | ID | yes | Registered NPC or animal |
| role | enum | yes | NPC or ANIMAL |
| spawnPointId | ID | yes | Registered and reachable in selected scene |
| displayNameJa | string | no | 1–40 characters |
| initialStateId | ID | no | Registered state |

ObjectInstance:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| objectId | ID | yes | Lesson-local unique ID |
| catalogObjectId | ID | yes | Registered reusable object |
| spawnPointId | ID | yes | Registered and reachable in selected scene |
| initialStateId | ID | no | Registered state |
| interactive | boolean | yes | True if referenced by an object primitive |

The compiler MUST verify that spawn points do not create overlapping or
unreachable required instances.

## Audio assets

AudioAsset:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| audioAssetId | ID | yes | Unique within manifest |
| textJa | string | yes | Exact spoken Japanese, 1–500 characters |
| voiceProfileId | ID | yes | Approved server-side voice profile |
| cacheKey | string | yes | Opaque deterministic cache key, 16–128 characters |
| durationMs | integer | no | Positive measured duration when known |

The manifest contains no provider credential or arbitrary media URL. The client
resolves audioAssetId through the application asset boundary.

Two references to the same speech inputs SHOULD share a cacheKey and cached
asset.

Contract 0.1.0 uses `AudioAsset` only for exact spoken Japanese attached to a
lesson utterance. D-026 does not put ambience, footsteps, animal sounds,
feedback effects, or music inside this array. Reusable ambience is owned by the
selected scene's application metadata, while step-specific non-speech sounds
are deterministic effects of registered presentation cues. Those registries
must resolve reviewed local or cached assets and MUST NOT let a manifest supply
an arbitrary URL, path, volume, loop, or playback script. This clarification
does not change the 0.1.0 schema.

## Lesson step

LessonStep contains:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| stepId | ID | yes | Unique within manifest |
| contextId | ID | yes | Stable pedagogical context identifier |
| mode | enum | yes | EXPLORE or INTERACTION |
| stimulus | Stimulus | yes | Japanese-first prompt or utterance |
| interaction | Interaction union | yes | Exactly one fixed primitive |
| targetBindings | TargetBinding[] | yes | At least one exposed or assessed target |
| attemptPolicy | AttemptPolicy | yes | Bounded retry behavior |
| scaffolds | Scaffold[] | yes | Ordered; may be empty |
| feedback | Feedback | yes | Immediate authored response |
| presentation | PresentationCues | yes | Catalog cue references only |
| transitions | Transitions | yes | Explicit graph edges |

### Stimulus

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| instructionJa | string | no | 1–300 characters |
| utterance | Utterance | no | Spoken or displayed Japanese |
| supportText | string | no | 1–400 characters; support locale required |
| supportVisibility | enum | conditional | Required with supportText; ALWAYS or ON_HELP |

At least instructionJa or utterance is required. ON_HELP support text remains
hidden until the learner requests help. ALWAYS should be used only when the
authored starting difficulty intentionally includes translation.

Utterance:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| speakerEntityId | ID | no | Existing entity; omit for narration |
| textJa | string | yes | 1–500 characters |
| audioAssetId | ID | no | Existing asset whose textJa exactly matches |
| textVisibility | enum | yes | ALWAYS, ON_REPLAY, ON_HELP, or NEVER |
| replayAllowed | boolean | yes | Whether learner may replay |

### Target bindings

TargetBinding:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| targetId | ID | yes | Existing learning target |
| relation | enum | yes | EXPOSES or ASSESSES |
| successEvidence | enum | no | Required for ASSESSES; forbidden for EXPOSES |

Evidence vocabulary:

- encountered
- heard
- recognized
- selected_correctly
- arranged_correctly
- typed_correctly
- actively_produced

The semantic validator MUST enforce this maximum evidence matrix:

| Primitive | Maximum permitted success evidence |
| --- | --- |
| LISTEN | heard |
| CLICK_OBJECT | selected_correctly |
| CHOOSE | selected_correctly |
| ARRANGE | arranged_correctly |
| TYPE | actively_produced |
| MOVE_TO | selected_correctly |
| PICK_UP | selected_correctly |
| GIVE | selected_correctly |

recognized may be used instead of selected_correctly for a valid recognition
task. typed_correctly may be used instead of actively_produced when visible
support makes the task transcription rather than production. encountered is
recorded for reachable exposure. heard is recorded only when relevant audio
actually begins playback.

Assisted success records the same attempted evidence category with its support
metadata, but the mastery aggregator MUST distinguish it from unaided success.

### Attempt policy

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| maximumAttempts | integer | yes | 1–5 |
| afterMaximum | enum | yes | CONTINUE_ASSISTED or FOLLOW_FAILURE_TRANSITION |
| preserveSubmittedState | boolean | yes | Relevant to ARRANGE and TYPE |

No step may retry indefinitely. CONTINUE_ASSISTED requires either a
RECOGNITION_FALLBACK scaffold or a deterministic accepted action exposed at
the final support level.

### Scaffolds

Every Scaffold contains scaffoldId, afterAttempt, and kind. afterAttempt is an
integer from 1 through maximumAttempts and scaffolds are ordered ascending.

Closed variants:

| kind | Additional required fields |
| --- | --- |
| REPLAY_AUDIO | none; stimulus must reference audio and set replayAllowed true |
| SHOW_JAPANESE_TEXT | none; utterance must exist |
| HIGHLIGHT_OBJECTS | objectIds: non-empty existing object IDs |
| HIGHLIGHT_ENTITIES | entityIds: non-empty existing entity IDs |
| REDUCE_OBJECT_CANDIDATES | objectIds: non-empty subset of primitive candidates |
| REDUCE_CHOICE_CANDIDATES | optionIds: non-empty subset of CHOOSE options |
| SHOW_READING | textJa: 1–120 characters |
| SHOW_MEANING | supportText: 1–240 characters; support locale required |
| SHOW_PATTERN | textJa: 1–240 characters |
| RECOGNITION_FALLBACK | fallbackStepId: existing easier step |

A scaffold MUST NOT contain the correct answer in a field whose kind does not
explicitly reveal it. The fallback step must eventually rejoin a terminal or
forward path and cannot create an unbounded cycle.

### Feedback

Feedback contains correct, incorrect, and assisted messages:

| Field | Type | Required |
| --- | --- | --- |
| correct | FeedbackMessage | yes |
| incorrect | FeedbackMessage | yes |
| assisted | FeedbackMessage | yes |

FeedbackMessage:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| textJa | string | no | 1–240 characters |
| supportText | string | no | 1–240 characters; support locale required |
| displayMs | integer | yes | 0–4000 |
| cueIds | ID[] | yes | Registered presentation cues; may be empty |

At least textJa or one cueId is required. Feedback should remain short and
should not turn a correct reaction into a lecture.

### Presentation cues

PresentationCues contains three arrays of registered catalog cue IDs:

- onEnterCueIds
- onSuccessCueIds
- onFailureCueIds

Cues may play authored animation, sound, highlighting, or state presentation.
They do not contain parameters, source code, or arbitrary asset references.
The scene catalog defines their deterministic effect.

### Transitions

Transitions:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| onSuccess | TransitionTarget | yes | Forward step or COMPLETE |
| onFailure | TransitionTarget | yes | Used after bounded failure |
| onAssisted | TransitionTarget | yes | Used after assisted completion |

TransitionTarget is exactly one of:

- { "kind": "STEP", "stepId": "existing_step_id" }
- { "kind": "COMPLETE" }

There is no expression language and no arbitrary condition code in contract
0.1.0. CHOOSE options may lead to different authored responses only when they
are modeled as correctness outcomes in this initial contract. Rich narrative
branching is deferred.

## Interaction union

Each LessonStep.interaction is exactly one of the following strict variants.

### LISTEN

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| type | string | yes | LISTEN |
| completion | enum | yes | AUDIO_ENDED or LEARNER_CONTINUES |
| minimumPlaybackRatio | number | yes | 0.0–1.0 |

The stimulus MUST contain an utterance with audioAssetId.

### CLICK_OBJECT

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| type | string | yes | CLICK_OBJECT |
| candidateObjectIds | ID[] | yes | 2–12 unique interactive objects |
| acceptedObjectIds | ID[] | yes | Non-empty subset of candidates |

### CHOOSE

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| type | string | yes | CHOOSE |
| options | ChoiceOption[] | yes | 2–8 unique options |
| acceptedOptionIds | ID[] | yes | Non-empty subset of option IDs |
| shuffle | boolean | yes | Uses manifest randomSeed |

ChoiceOption contains required optionId and textJa fields. Translation or other
support belongs in the step-level scaffold rather than revealing an answer
through individual options.

### ARRANGE

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| type | string | yes | ARRANGE |
| tokens | ArrangeToken[] | yes | 2–12 unique token IDs |
| acceptedSequences | ID[][] | yes | 1–8 full token sequences |
| shuffle | boolean | yes | Uses manifest randomSeed |

ArrangeToken contains tokenId and textJa. A sequence contains every token ID
exactly once unless a future schema version explicitly supports unused tokens.
Duplicate surface forms use distinct token IDs.

### TYPE

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| type | string | yes | TYPE |
| acceptedAnswers | string[] | yes | 1–20 non-empty Japanese answers |
| normalization | enum[] | yes | Unique ordered rules |
| inputMode | enum | yes | JAPANESE_TEXT |
| maximumLength | integer | yes | 1–200 |

Allowed normalization rules:

- UNICODE_NFKC
- TRIM
- COLLAPSE_WHITESPACE
- IGNORE_JAPANESE_PUNCTUATION
- KANA_EQUIVALENCE

KANA_EQUIVALENCE is allowed only when both forms are pedagogically acceptable.
No fuzzy semantic matching is part of version 0.1.0.

### MOVE_TO

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| type | string | yes | MOVE_TO |
| candidateLocationIds | ID[] | yes | 1–12 unique existing locations |
| acceptedLocationIds | ID[] | yes | Non-empty subset of candidates |
| arrivalRadius | number | yes | 0.1–5 world units |

### PICK_UP

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| type | string | yes | PICK_UP |
| candidateObjectIds | ID[] | yes | 1–12 unique interactive objects |
| acceptedObjectIds | ID[] | yes | Non-empty subset of candidates |

Accepted objects must have a catalog-authored pick-up affordance.

### GIVE

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| type | string | yes | GIVE |
| candidateObjectIds | ID[] | yes | 1–8 objects with give affordance |
| candidateRecipientEntityIds | ID[] | yes | 1–5 entities |
| acceptedPairs | GivePair[] | yes | 1–12 unique accepted pairs |

GivePair contains objectId and recipientEntityId. Both must occur in the
candidate arrays. A failed GIVE must leave or restore the object to a
recoverable carry state.

## Completion policy

CompletionPolicy:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| requiredStepIds | ID[] | yes | Unique, reachable steps |
| closingMessage | LocalizedText | no | Short completion message |

The lesson completes when:

1. a transition reaches COMPLETE;
2. every required step has a completed outcome, including assisted completion;
3. every requested target has received its reachable authored exposures; and
4. the evidence write for the final step has been acknowledged locally.

Correct performance and mastery are not completion gates. A learner who needs
all available scaffolds can still finish the scenario while retaining accurate
assisted evidence.

## Quality targets

QualityTargets:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| intendedReactionCount | integer | yes | 1–60 |
| preferredReactionIntervalMinSeconds | integer | yes | Exactly 5 initially |
| preferredReactionIntervalMaxSeconds | integer | yes | Exactly 12 initially |
| estimatedActiveMinutes | number | yes | Positive, at most 30 for MVP |
| maximumNpcCount | integer | yes | 0–5 |
| maximumInteractiveObjectCount | integer | yes | 0–30 |
| preferredMaximumDrawCalls | integer | yes | At most 100 initially |

The compiler derives these fields from the selected scene and steps; AI does
not receive authority to relax global budgets. Exceeding a preferred target
requires a validator warning and explicit author review. Exceeding a hard
contract maximum is invalid.

## Provenance

Provenance:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| compilerVersion | string | yes | Semantic version |
| contractVersion | string | yes | Must equal schemaVersion |
| source | enum | yes | AI_ASSISTED or AUTHORED |
| inputHash | string | yes | Opaque deterministic hash |
| promptModuleVersions | VersionReference[] | yes | May be empty for AUTHORED |
| referenceDataVersions | VersionReference[] | yes | Every used reference provider |

VersionReference contains id and version, both non-empty strings of at most 80
characters.

Provenance records reproducibility metadata, not prompts, chain-of-thought, or
secret configuration.

## Semantic validation

The compiler MUST reject a manifest when any of these checks fails:

### References

- Every local and catalog reference exists and is type-compatible.
- Every target binding references a declared target.
- Every audio reference exists and exactly matches its spoken text.
- Every primitive references compatible, interactive, reachable candidates.
- Every cue and initial state belongs to the selected catalog item.

### Graph

- entryStepId exists.
- Every step is reachable from the entry.
- At least one COMPLETE transition is reachable.
- Every reachable path terminates or has a statically bounded cycle.
- Every required step occurs on every completion path unless the contract later
  adds explicit alternative requirements.
- Fallback edges reduce difficulty and cannot loop forever.
- No transition can bypass writing its terminal evidence event.

### Learning coverage

- Every REQUESTED target has enough reachable EXPOSES bindings to meet
  minimumEncounters and enough distinct contextId values to meet
  minimumContexts.
- Every desiredEvidence category has at least one compatible reachable
  assessment opportunity, if correctness makes it attainable.
- SUPPORTING targets are not reported as requested-target coverage.
- Evidence does not exceed the primitive's permitted level.
- actively_produced is not used when the correct answer is visibly available.

### Language and answers

- Japanese strings are appropriate for the declared targets and context.
- Accepted answers are non-empty and free from contradictory duplicates.
- Distractors do not accidentally become valid under configured normalization.
- Grammar and kanji reference claims agree with approved deterministic sources.
- Support text is not exposed as the default answer path without an authored
  reason.

### World and performance

- Required spawn points and destinations are reachable.
- Candidate objects and entities are visible or discoverable at the intended
  support level.
- Count and asset budgets agree with selected catalog metadata.
- Estimated movement and presentation time do not obviously violate the
  reaction interval.
- Only assets required by the current lesson are listed.

## Runtime validation and error behavior

The client MUST:

- accept only explicitly supported schema versions;
- validate the full payload before scene activation;
- avoid partial world state when validation fails;
- display a recoverable learner-facing error and a diagnostic error code;
- never attempt to interpret unknown primitive or cue types;
- deduplicate evidence writes with stable event IDs;
- commit evidence and the resulting closed checkpoint atomically through the
  independently versioned persistence boundary; and
- retain the previous known-good lesson until a replacement is valid.

Runtime validation is defense in depth. It does not replace backend validation.

## Minimal illustrative manifest

This example is intentionally small. Catalog identifiers are illustrative and
do not establish real assets.

~~~json
{
  "schemaVersion": "0.1.0",
  "manifestId": "manifest_find_dog",
  "lessonId": "lesson_find_dog",
  "revision": 1,
  "createdAt": "2026-08-10T00:00:00Z",
  "randomSeed": 104729,
  "locales": {
    "target": "ja",
    "support": "vi"
  },
  "title": {
    "ja": "犬を探そう",
    "support": "Hãy tìm chú chó"
  },
  "learningTargets": [
    {
      "targetId": "target_inu",
      "kind": "VOCABULARY",
      "role": "REQUESTED",
      "priority": 5,
      "content": {
        "kind": "VOCABULARY",
        "writtenForms": ["犬"],
        "readings": ["いぬ"],
        "supportGlosses": ["chó"],
        "partOfSpeech": "NOUN"
      },
      "referenceIds": ["jp_vocab_inu"],
      "goal": {
        "minimumEncounters": 1,
        "minimumContexts": 1,
        "desiredEvidence": ["heard", "selected_correctly"]
      }
    }
  ],
  "scene": {
    "sceneId": "park_small",
    "playerSpawnPointId": "park_entry",
    "cameraPresetId": "park_isometric_default",
    "assetBundleIds": ["park_core", "animals_basic"]
  },
  "scenario": {
    "template": "FIND_SOMETHING",
    "objective": {
      "ja": "犬を探してください。",
      "support": "Hãy tìm chú chó."
    },
    "focusTargetIds": ["target_inu"],
    "synopsis": "The learner hears a request and selects the dog in a small park."
  },
  "locations": [],
  "entities": [
    {
      "entityId": "guide",
      "catalogEntityId": "npc_guide_basic",
      "role": "NPC",
      "spawnPointId": "guide_spot",
      "displayNameJa": "ゆき"
    }
  ],
  "objects": [
    {
      "objectId": "dog",
      "catalogObjectId": "animal_dog_small",
      "spawnPointId": "animal_spot_a",
      "interactive": true
    },
    {
      "objectId": "cat",
      "catalogObjectId": "animal_cat_small",
      "spawnPointId": "animal_spot_b",
      "interactive": true
    }
  ],
  "audioAssets": [
    {
      "audioAssetId": "audio_find_dog",
      "textJa": "犬を探してください。",
      "voiceProfileId": "voice_guide_01",
      "cacheKey": "tts_4f42b382ad87c31a"
    }
  ],
  "steps": [
    {
      "stepId": "find_dog",
      "contextId": "park_request",
      "mode": "EXPLORE",
      "stimulus": {
        "utterance": {
          "speakerEntityId": "guide",
          "textJa": "犬を探してください。",
          "audioAssetId": "audio_find_dog",
          "textVisibility": "ALWAYS",
          "replayAllowed": true
        },
        "supportText": "Hãy tìm chú chó.",
        "supportVisibility": "ON_HELP"
      },
      "interaction": {
        "type": "CLICK_OBJECT",
        "candidateObjectIds": ["dog", "cat"],
        "acceptedObjectIds": ["dog"]
      },
      "targetBindings": [
        {
          "targetId": "target_inu",
          "relation": "EXPOSES"
        },
        {
          "targetId": "target_inu",
          "relation": "ASSESSES",
          "successEvidence": "selected_correctly"
        }
      ],
      "attemptPolicy": {
        "maximumAttempts": 2,
        "afterMaximum": "CONTINUE_ASSISTED",
        "preserveSubmittedState": false
      },
      "scaffolds": [
        {
          "scaffoldId": "highlight_animals",
          "afterAttempt": 1,
          "kind": "HIGHLIGHT_OBJECTS",
          "objectIds": ["dog", "cat"]
        },
        {
          "scaffoldId": "reduce_to_dog",
          "afterAttempt": 2,
          "kind": "REDUCE_OBJECT_CANDIDATES",
          "objectIds": ["dog"]
        }
      ],
      "feedback": {
        "correct": {
          "textJa": "はい、犬です。",
          "displayMs": 900,
          "cueIds": []
        },
        "incorrect": {
          "textJa": "もう一度、聞いてください。",
          "displayMs": 900,
          "cueIds": []
        },
        "assisted": {
          "textJa": "これが犬です。",
          "displayMs": 1200,
          "cueIds": ["dog_highlight"]
        }
      },
      "presentation": {
        "onEnterCueIds": ["guide_gesture"],
        "onSuccessCueIds": ["dog_happy"],
        "onFailureCueIds": []
      },
      "transitions": {
        "onSuccess": {
          "kind": "COMPLETE"
        },
        "onFailure": {
          "kind": "COMPLETE"
        },
        "onAssisted": {
          "kind": "COMPLETE"
        }
      }
    }
  ],
  "entryStepId": "find_dog",
  "completion": {
    "requiredStepIds": ["find_dog"],
    "closingMessage": {
      "ja": "犬を見つけました。",
      "support": "Bạn đã tìm thấy chú chó."
    }
  },
  "quality": {
    "intendedReactionCount": 1,
    "preferredReactionIntervalMinSeconds": 5,
    "preferredReactionIntervalMaxSeconds": 12,
    "estimatedActiveMinutes": 0.2,
    "maximumNpcCount": 1,
    "maximumInteractiveObjectCount": 2,
    "preferredMaximumDrawCalls": 100
  },
  "provenance": {
    "compilerVersion": "0.1.0",
    "contractVersion": "0.1.0",
    "source": "AI_ASSISTED",
    "inputHash": "sha256_801bcc7a4099b037",
    "promptModuleVersions": [
      {
        "id": "lesson_compiler",
        "version": "0.1.0"
      }
    ],
    "referenceDataVersions": [
      {
        "id": "japanese_core",
        "version": "unselected"
      }
    ]
  }
}
~~~

The example deliberately shows support text as available data. A real lesson
may begin with it hidden according to the scaffold policy and learner settings.

## Versioning policy

- schemaVersion identifies the contract shape and semantics.
- revision identifies changed content within one lesson and manifest lineage.
- Backward-compatible additions require a new contract version because strict
  clients reject unknown properties.
- A migration must create a new validated manifest; it must not mutate an
  in-progress manifest revision.
- The runtime declares the exact contract versions it supports.
- Old stored manifests remain inspectable even after they are no longer
  playable.

## Deferred contract questions

The following require product or implementation evidence before contract
version 1.0:

- rich narrative branching and non-correctness choices;
- optional versus mandatory step groups;
- multi-scene lessons;
- offline asset resolution and signed media delivery;
- open-ended answer evaluation;
- SPEAK and pronunciation evidence;
- multiple simultaneous support languages;
- collaborative or teacher-authored metadata;
- exact mastery aggregation and scheduling fields;
- analytics consent and redaction fields; and
- a general, safe world-state transition vocabulary.
