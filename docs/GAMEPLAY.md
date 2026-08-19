# Bunbun Gameplay Specification

## Purpose

This document defines the reusable gameplay language for the Bunbun MVP. A
lesson may combine these elements, but it may not invent new runtime mechanics.

The primary design test is not whether a sequence resembles a conventional
game. It is whether the sequence produces frequent, meaningful Japanese
interpretation and response with little friction.

## Core loop

The intended loop is:

1. Present spoken or written Japanese in a clear world context.
2. Ask for a relevant learner reaction.
3. Accept the reaction through a fixed primitive.
4. Give immediate, concise feedback.
5. Record learning evidence.
6. Move promptly to the next Japanese stimulus.

When appropriate, target one meaningful reaction every 5–12 seconds. Longer
pauses are acceptable when they create necessary context, but should be
deliberate and measured.

## Runtime states

The top-level runtime has two primary states.

### EXPLORE

The 3D world occupies most of the screen. The learner can:

- inspect the current diorama;
- point at a destination, object, or NPC;
- request movement;
- trigger an available world interaction; and
- see only minimal status or progress UI.

The runtime may guide movement automatically after a valid click. WASD is not
required for the MVP and should not be introduced as a dependency of a lesson.

### INTERACTION

A focused learning interaction is active. A DOM overlay may show:

- Japanese dialogue or instruction;
- audio replay;
- choices;
- arrangeable words;
- a typing field;
- contextual help;
- kanji information;
- grammar information; or
- lightweight lesson progress.

Movement and world picking are suspended or constrained when they would
conflict with the active overlay. The overlay disappears promptly after the
interaction finishes.

### State transitions

EXPLORE → INTERACTION occurs when a lesson step needs a focused response or
dialogue overlay.

INTERACTION → EXPLORE occurs after the step records its terminal result and
feedback has been acknowledged or its short display interval has elapsed.

EXPLORE → EXPLORE is valid for world actions such as MOVE_TO, CLICK_OBJECT,
PICK_UP, or GIVE when no overlay is required.

INTERACTION → INTERACTION is valid for a short authored sequence, retry, or
scaffold escalation. It must not trap the learner in an indefinite failure
loop.

Loading, paused, completed, and error are supporting runtime states, not lesson
mechanics. They do not count as meaningful reactions.

## Fixed interaction primitives

The initial runtime supports exactly these primitive types:

| Primitive | Learner action | Typical evidence | Required runtime capability |
| --- | --- | --- | --- |
| LISTEN | Hear a Japanese stimulus and continue | heard | Audio playback and replay |
| CLICK_OBJECT | Select a relevant visible object | recognized or selected | 3D picking |
| CHOOSE | Choose one authored option | recognized or selected | DOM choices |
| ARRANGE | Put authored tokens into an accepted order | arranged | DOM token arrangement |
| TYPE | Enter an accepted Japanese response | typed or produced | DOM text input |
| MOVE_TO | Choose and reach a relevant location | recognized or selected | Point-and-click movement |
| PICK_UP | Select and acquire an allowed world object | recognized or selected | World state and carry state |
| GIVE | Give an allowed held item to an allowed recipient | recognized or selected | World and carry state |

SPEAK is explicitly outside the initial set. Adding it or any other primitive
requires an accepted decision and updates to this document, the manifest
contract, validators, runtime, evidence model, and manual regression checklist.

### LISTEN

Use LISTEN for contextual exposure, not as filler. It requires Japanese audio
and normally includes either a world reaction, a concise continuation action,
or a following response primitive. Replay is always optional and does not
count as a new meaningful reaction.

LISTEN may record heard evidence only after playback starts successfully. A
pure LISTEN step does not by itself prove recognition.

### CLICK_OBJECT

Use CLICK_OBJECT when Japanese distinguishes one or more visible entities. The
candidate set must be authored and reachable. The runtime compares stable
object identifiers, not mesh names or screen coordinates.

Selecting a distractor gives immediate contextual feedback and either keeps the
step active or escalates support according to the manifest.

### CHOOSE

Use CHOOSE for meanings, responses, pattern selection, or other authored
alternatives that do not depend on world position. Choices should be concise,
plausible, and free from accidental visual cues unless those cues are the
intended scaffold.

The order may be deterministically shuffled from the session seed. The accepted
answer is never inferred by the runtime.

### ARRANGE

Use ARRANGE for controlled sentence construction. Each visible token has a
stable identifier, allowing duplicate surface forms. Accepted sequences are
explicit. The runtime must not use an LLM to judge order.

Avoid long token sets that turn the interaction into UI manipulation rather
than language production.

### TYPE

Use TYPE for recall or controlled production. Accepted answers and
normalization rules are authored. Normalization may handle explicitly allowed
differences such as Unicode normalization, surrounding whitespace, or selected
Japanese punctuation; it must not silently accept unrelated answers.

Open-ended semantic evaluation is a later selective AI capability and is not
part of the deterministic MVP TYPE primitive.

### MOVE_TO

Use MOVE_TO when understanding Japanese determines a destination. Movement
begins from a point-and-click request and may be completed automatically.

Movement distance and camera travel must be short enough to protect interaction
density. Navigation with no Japanese decision is presentation time, not a
meaningful reaction.

### PICK_UP

Use PICK_UP when the learner must identify and acquire an object from Japanese
context. MVP carry state should remain small and task-specific; this primitive
does not authorize an inventory-heavy system.

### GIVE

Use GIVE when both item and recipient are meaningful to the Japanese prompt.
The accepted item-recipient pairs are explicit. The runtime must restore a
recoverable state after a wrong attempt.

## Scenario templates

A micro-scenario selects a reusable context for a sequence of primitives. The
initial template vocabulary is:

- FIND_SOMETHING
- HELP_SOMEONE
- BUY_SOMETHING
- GO_SOMEWHERE
- PREPARE_SOMETHING
- DELIVER_SOMETHING
- MEET_SOMEONE
- SOLVE_SMALL_PROBLEM

Templates are content patterns, not new mechanics. For example,
BUY_SOMETHING may compose LISTEN, CHOOSE, CLICK_OBJECT, PICK_UP, and GIVE using
the same primitive executors used elsewhere.

A new template may be added as authored content when it can be expressed using
existing primitives. A template that needs a new mechanic requires an
architecture and product decision first.

## Micro-scenario composition

Each scenario should have:

- a short contextual premise;
- a concrete learner-facing objective;
- only the entities and objects needed for that objective;
- repeated target exposure across varied sentences or actions;
- an authored sequence with explicit completion conditions;
- recoverable wrong answers;
- a clear end; and
- minimal travel or exposition between meaningful reactions.

Typical reusable scenes include a park, classroom, house, kitchen, restaurant,
convenience store, station, street, office, and hospital.

D-025 starts production world authoring with one bounded Japanese-neighborhood
envelope containing road, convenience-store, and park areas, two NPCs, and one
animal. A lesson still activates only the relevant chunk, instances, and
interaction candidates. The shared visual setting must not add travel that
reduces reaction density.

Authored locations and approach zones may establish situations such as meeting
someone, reaching a crossing, or reacting to an animal. Under the current MVP,
they must resolve through registered locations, presentation cues, and the
existing primitive vocabulary. World metadata does not authorize freeform
collision events, physics outcomes, or scripts.

The story provides a reason to react. It should not add cutscenes, traversal,
dialogue, or puzzles that do not improve the language experience.

## First product showcase

D-026 selects `Three Minutes to the Last Train` as the first product vertical
slice. The learner helps Aoi, an anxious and impulsive student, recover a
missing wallet before leaving for the last train. Tanaka, a formal and
rule-bound convenience-store clerk, protects a staff-only area. Momo, a cat,
leads the learner toward the umbrella stand and the clue that reveals a
mistaken umbrella rather than a theft.

The slice uses the rainy-evening neighborhood variant with the convenience-
store frontage, short road, and park edge. The station may be suggested by
distant authored cues; it is not a second loaded scene. The primary scenario
template is SOLVE_SMALL_PROBLEM. The initial requested targets are:

- `財布（さいふ）`;
- `探す（さがす）`; and
- `～てください`.

Reviewed supporting targets may include `駅`, `雨`, `傘`, `待つ`, `急ぐ`,
`交番`, `～てはいけない`, `～ませんか`, and `なくてはいけない`. Supporting
targets must be explicit in the manifest and must not be reported as requested-
target coverage. The N5 extraction outside this repository may guide local
research, but shipped reference records and Vietnamese support copy must be
reviewed, repository-owned content with documented provenance.

The title's three-minute pressure is narrative. It must not create a hard
realtime failure timer, HP loss, punitive replay, or an inaccessible ending.
Wrong language choices change immediate NPC reactions and scaffolding while
keeping the situation recoverable.

## Audio presentation

The D-026 vertical slice is audio-complete at acceptance:

- every learner-relevant Japanese NPC or narration utterance has reviewed,
  cacheable speech and an exact text match;
- each named NPC retains one consistent approved voice profile;
- scene ambience communicates rain, the street, the convenience store, and the
  distant station without masking speech;
- meaningful movement, object, animal, discovery, feedback, and transition
  beats use registered deterministic sound cues;
- restrained music or stings may support tension and resolution, with automatic
  ducking while speech plays;
- master, voice, ambience, effects, and music controls remain learner-owned;
  and
- captions, replay, and assisted text keep the lesson completable when audio is
  disabled, unavailable, interrupted, or missing.

One explicit learner gesture may unlock browser audio before the scenario
starts. Replaying audio does not create another learning reaction or duplicate
heard evidence. Backgrounding, resume, restart, and disposal stop or restore
audio at the same safe deterministic boundaries as other transient runtime
presentation. The audio system does not add microphone capture, voice cloning,
realtime TTS, realtime NPC conversation, pronunciation scoring, or SPEAK.

## Difficulty and scaffolding

Reuse the same world while increasing the language demand. A target may
progress through:

1. hear with subtitle and obvious visual context;
2. hear without subtitle;
3. choose or click;
4. arrange;
5. type; and
6. later, give an open response if an approved capability supports it.

Each step may define ordered scaffold levels. A recommended escalation pattern
is:

1. no added support;
2. repeat or slow the relevant stimulus without changing the answer;
3. highlight relevant context or reduce distractors;
4. reveal reading support;
5. reveal a brief meaning or pattern hint;
6. offer an easier recognition fallback and continue.

Scaffolding must be observable in the evidence event. Assisted success is not
equivalent to unaided success.

## Feedback and failure

Feedback should be immediate, short, and connected to Japanese or the world.

- A correct action confirms meaning and advances.
- A wrong action does not erase prior evidence.
- Repeated failure escalates an authored scaffold.
- A learner should not be forced through unlimited identical retries.
- When the original response becomes unproductive, the lesson may fall back to
  an easier primitive while marking the result as assisted.
- Failure should not cause game over, HP loss, or punitive travel.

## Learning evidence

The runtime records evidence; it does not declare mastery from a single event.
Initial evidence categories are:

- encountered;
- heard;
- recognized;
- selected_correctly;
- arranged_correctly;
- typed_correctly;
- actively_produced.

Every persisted EvidencePersistence 0.1.0 event includes:

- stable learner, lesson, revision, session, interaction, and target context as
  available;
- primitive type;
- correctness;
- attempt number;
- support level and help use;
- response latency based on active interaction time;
- authored stable response identifiers for closed interactions where useful;
- context identifier;
- timestamp; and
- an idempotency identifier.

Learner-entered TYPE text, normalized TYPE answers, and answer-derived event
IDs are never persisted. The local lesson/revision/target summary distinguishes
`INSUFFICIENT_EVIDENCE`, `NEEDS_REVIEW`, and `DEVELOPING` while keeping assisted
and unaided performance separate. It is not mastery, a percentage, or a
scheduler and never gates completion. Cross-lesson mastery policy remains
deferred.

Events and a closed checkpoint are committed atomically at meaningful safe
boundaries. Reload restores acknowledged attempts, scaffolds, completed steps,
active time, carry, and transfer projection without replaying events.
Unsubmitted TYPE text is cleared; interrupted audio and movement return to safe
awaiting phases. See EVIDENCE_PERSISTENCE.md.

Weak targets should be scheduled for more useful exposure without causing
immediate, repetitive failure loops.

## Reaction-density measurement

For a playable session:

Meaningful reactions per minute =
count of qualifying learner reactions ÷ active learning minutes.

Active learning time excludes initial loading, paused time, background-tab
time, and unrecoverable errors. It includes deliberate authored presentation
time between stimuli, because that time affects the actual experience.

The runtime should also capture:

- median and percentile time between qualifying reactions;
- time to first Japanese stimulus;
- reactions by primitive;
- correct, incorrect, and assisted reactions;
- help and replay use; and
- long gaps tagged by loading, movement, presentation, or learner idle time.

Metric implementation and privacy rules require a later accepted decision.

## Example sequence

A FIND_SOMETHING lesson for 犬 could:

1. LISTEN: 犬はどこですか。
2. CLICK_OBJECT: choose between visible animals.
3. LISTEN: あそこに犬がいます。
4. MOVE_TO: select the indicated area.
5. CLICK_OBJECT: answer この犬ですか through context.
6. PICK_UP: respond to 犬を連れてきてください。
7. GIVE: bring the dog to the requesting NPC.

This sequence uses reusable mechanics. It does not generate a new world or
custom source code for the word 犬.

## Manual acceptance principles

For each implemented lesson or primitive, manual testing must cover:

### Happy path

- The first Japanese stimulus appears promptly.
- The intended action is clear from Japanese and context.
- A correct response records the intended evidence once.
- Feedback appears and the next step begins without unnecessary delay.
- The lesson reaches a clear completed state.

### Edge cases

- Wrong object, option, order, text, destination, item, or recipient.
- Repeated input and double clicks.
- Audio unavailable or replayed.
- Help opened at each supported level.
- Reload or resume at an interaction boundary.
- No reachable candidate or failed movement.
- Unexpected manifest or asset failure.

### Regression

- EXPLORE input does not leak into an active overlay.
- UI input does not accidentally trigger world picking.
- Previously completed evidence is not duplicated.
- Manifest authors cannot trigger an unregistered mechanic.
- Interaction density is not degraded by added movement or presentation.
- Performance remains within the budgets in PERFORMANCE.md.

## Explicit exclusions

This specification does not introduce:

- combat, health, stamina, timers used as punishment, or failure screens;
- freeform physics puzzles;
- a general inventory or crafting system;
- dialogue generated during each runtime step;
- arbitrary code or expressions inside a manifest;
- AI validation in the frame loop; or
- automatic progression based only on time spent.
