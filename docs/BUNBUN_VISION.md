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

During normal exploration, the interface stays minimal. Short DOM overlays
appear for dialogue, choices, word arrangement, typing, help, and language
information, then disappear promptly so the learner returns to the world.

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

Anki export, mnemonic image generation, selective runtime AI evaluation, and a
SPEAK primitive are later opportunities, not MVP assumptions.

## Open product questions

These questions do not block the documentation milestone, but must be resolved
before the relevant implementation milestone:

- Which learner level and support languages define the first vertical slice?
- Which initial scene and scenario template best prove the learning loop?
- What exact mastery policy converts evidence into future lesson selection?
- What minimum browser and device matrix should the MVP support?
- How should learner progress behave across browsers or devices?
- What latency and cost budgets are acceptable for lesson compilation and TTS?
