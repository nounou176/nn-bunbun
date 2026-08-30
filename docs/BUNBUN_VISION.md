# Bunbun Product Vision

## Product statement

Bunbun is an AI-powered Japanese-learning game that turns vocabulary and
grammar supplied by a learner into a short, interactive learning adventure.

Bunbun is not a general-purpose game generator. Its purpose is to create a
high-density loop in which the learner repeatedly understands and reacts to
Japanese in context:

Hear Japanese → understand from context → react → receive immediate feedback
→ encounter the next Japanese stimulus.

The north-star product metric is meaningful Japanese reactions per minute.
When the learning material allows it, Bunbun should aim for one meaningful
reaction approximately every 5–12 seconds.

## Product promise

A learner should be able to provide a useful set of Japanese targets and
receive a small playable scenario that:

- makes the targets understandable through sound, writing, visuals, context,
  and action;
- repeats them without feeling like a disconnected drill;
- increases the required learner effort over time;
- provides immediate, low-friction feedback;
- gathers evidence about what the learner can recognize or produce; and
- remains fast to generate, load, and play.

Story and 3D presentation exist to make language meaningful and memorable.
They must not lower interaction density or turn the lesson into a slow
adventure game.

## Learning philosophy

### Vocabulary

Vocabulary is learned primarily through repeated contextual exposure. Bunbun
should not depend immediately on translation. A word becomes meaningful by
connecting:

- spoken Japanese;
- written Japanese;
- a visible object, person, place, or event;
- the surrounding sentence pattern; and
- an action taken by the learner.

Translation is optional scaffolding. It may appear when context is insufficient
or the learner requests help, and should fade when no longer needed.

### Grammar

Grammar is learned primarily as a recurring sentence pattern, not as an
isolated lecture. The same form should recur across multiple concrete
situations so the learner notices what stays constant and what changes.

Brief explanations may support the experience, but are not the main loop.

### Kanji

Kanji learning may combine:

- visual recognition;
- reading;
- components and radicals;
- visual mnemonics; and
- examples drawn from the current scenario.

Deterministic or curated reference data should provide decomposition, readings,
and radical information wherever possible. An LLM must not be treated as an
authoritative source for arbitrary kanji decomposition.

## Meaningful reaction

The initial operational definition is:

> A learner action that requires interpreting a Japanese stimulus and selecting,
> constructing, typing, moving toward, picking up, or giving a relevant answer
> or world object.

Correct and incorrect attempts both count as reactions when they represent a
genuine interpretation attempt. Passive loading time, generic navigation,
opening help, replaying audio, and waiting do not count by themselves.

This definition is version 0 and should be validated with real play sessions
before it becomes an analytics contract.

## Experience principles

1. Japanese comes first. Context and action should carry meaning before a
   translation is shown.
2. Every interaction earns its time. Long dialogue, movement, animation, or
   exposition must justify the learning time it consumes.
3. Immediate feedback keeps the loop moving. Failure should teach, scaffold,
   and continue rather than punish.
4. The world is reusable. Scenes, NPCs, animals, objects, and locations are
   catalog assets used by many lessons.
5. Difficulty changes the reaction, not the size of the world.
6. AI proposes structured content; deterministic systems protect runtime
   safety and consistency.
7. A small coherent lesson is better than a large unfocused one.

## MVP experience

The MVP uses compact stylized 3D dioramas such as a park, classroom, house,
kitchen, restaurant, convenience store, station, street, office, or hospital.
The camera is isometric, bird's-eye, or another diorama-style presentation.
The learner points and clicks to select, move, and interact.

Under D-056, the ordinary local entry is learner-first: it explains the target
input, highlights approved playable situations, and presents the published
lesson library without speech-generation gates, transport warnings, technical
fixtures, diagnostics, or destructive data controls. Those tools remain
recoverable through an explicit development surface. At completion the learner
may replay or return to the library and sees a compact current-visit evidence
recap. The recap reports practice facts and reaction cadence; it never claims
mastery, a percentage grade, or JLPT readiness.

D-025 selects a GLB-first authoring direction for production worlds. The first
world-production envelope is a bounded Japanese neighborhood with a short road,
a convenience-store area, a small park, two NPCs, and one animal. Lessons reuse
only the relevant chunks and catalog content; this does not turn the MVP into a
seamless or always-loaded city.

D-026 selects the first product vertical slice inside that envelope. It is an
N5, Vietnamese-supported rainy-evening scenario titled "Three Minutes to the
Last Train" (`Ba phút trước chuyến tàu cuối`), centered on a missing wallet,
two contrasting NPCs, and a cat that exposes the decisive clue. The apparent
deadline creates narrative urgency but is not a punitive realtime countdown or
game-over condition.

The vertical slice is audio-complete: Japanese character and narration lines
are voiced, the scene has authored ambience, meaningful world and feedback
actions have deterministic sound effects, and restrained music supports the
opening and resolution. Voice remains intelligible through mix priority,
captions, replay, and recoverable text fallback. Audio is prepared and cached
outside ordinary gameplay; this decision does not add microphone input,
realtime conversation, or a SPEAK primitive.

During normal exploration, the interface stays minimal. Short DOM overlays
appear for dialogue, choices, word arrangement, typing, help, and language
information, then disappear promptly so the learner returns to the world.

The first N5/Vietnamese vertical slice offers a recommended guided presentation
and an explicit immersive alternative. Japanese stays visually primary, while
guided presentation explains required controls and actions in concise
Vietnamese. Receiving that language support is recorded as assisted rather
than being misreported as unaided evidence.

## Adaptive exposure

Under D-061, Bunbun may use privacy-minimized local evidence to suggest what
the learner could encounter next. These suggestions are advisory: the learner
chooses whether to see them, which published lesson to open, and which support
mode to use. Bunbun does not silently schedule, launch, compile, rewrite, or
hide lessons.

The adaptive surface uses explicit reviewed concept identities and explains
its recommendation with conservative evidence facts. It prefers a different
published situation when one exists and says clearly when no changed context
is available. Incorrect or assisted work raises review priority; later
unaided-correct work in two distinct contexts can recover the signal. The
system uses `INSUFFICIENT_EVIDENCE`, `NEEDS_REVIEW`, and `DEVELOPING`, never a
mastery percentage, permanent learned state, punitive due date, streak, or
JLPT-readiness claim.

Adaptation remains deterministic and local. Gameplay evidence and adaptive
preferences do not leave localhost or enter an AI authoring module. Grammar
and kanji help must reuse reviewed reference data with visible provenance;
Bunbun does not invent a mnemonic when such data is absent.

## Success indicators

Early product validation should consider:

- meaningful Japanese reactions per active minute;
- time from lesson request to playable interaction;
- time from scene load to first Japanese stimulus;
- exposure coverage for every requested target;
- learner success with and without scaffolding;
- repeated evidence across changed contexts;
- abandon or idle points between interactions;
- runtime frame rate and input responsiveness; and
- whether learners can describe what they understood without depending on
  immediate translation.

These indicators are not a scoring system yet. Exact analytics definitions and
targets remain product work.

## MVP non-goals

Do not introduce these unless a later accepted decision explicitly changes
scope:

- Unity, Unreal, or Godot;
- multiplayer;
- WebXR;
- large open worlds;
- arbitrary procedural 3D world generation;
- runtime AI-generated Three.js code;
- AI-generated 3D models per lesson;
- heavy physics simulation;
- an LLM call for every interaction;
- complex microservice or agent frameworks;
- combat;
- inventory-heavy RPG systems;
- a minimap without a demonstrated need;
- skill trees;
- stamina or HP systems; or
- realtime voice interaction.

Authoring-time terrain generation and GLB export are compatible with these
non-goals. Runtime procedural expansion is not.

Anki export, mnemonic image generation, selective runtime AI evaluation, and a
SPEAK primitive are later opportunities, not MVP assumptions.

## Open product questions

These questions do not block the documentation milestone, but must be resolved
before the relevant implementation milestone:

- Which learner level and support languages define the first vertical slice?
- Which initial scene and scenario template best prove the learning loop?
- What evidence would justify evolving D-061's advisory non-mastery policy
  beyond the initial three conservative signals?
- What minimum browser and device matrix should the MVP support?
- How should learner progress behave across browsers or devices?
- What latency and cost budgets are acceptable for lesson compilation and TTS?
