# Bunbun World Authoring

## Status

This document defines the approved world-authoring direction under D-025 and
the first production variant selected by D-026. D-044 authorizes a bounded
ignored intake and local review of four official Kenney candidate packs. No
exact source member, derived GLB, runtime world asset, terrain tool, navigation
dependency, or production world chunk is approved or implemented yet.

## Outcome

Bunbun builds a visually coherent world from small reusable Three.js scene
chunks. Authoring tools produce reviewed GLB assets; the shipped runtime stays
deterministic and owns all identities, transforms, navigation, and interaction
capabilities through application code and catalogs.

The first production-world envelope is a bounded stylized Japanese
neighborhood containing:

- a short road area;
- a convenience-store frontage or entrance area;
- a small park area;
- two active NPCs; and
- one active animal.

D-026 selects the first lesson inside this envelope: an N5 rainy-evening
Vietnamese-supported `Three Minutes to the Last Train` variant using the
convenience-store frontage, short road, park edge, Aoi, Tanaka, Momo the cat,
and an umbrella-stand clue. It is still one bounded micro-scene, not a seamless
open world or a second station scene.

## Approved authoring stack

| Source or tool                                                           | License              | Approved role                                                                     | Runtime status                                     |
| ------------------------------------------------------------------------ | -------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------- |
| [Three.js Editor](https://threejs.org/editor/)                           | MIT through Three.js | Assemble, inspect, and export scene assets against the current Three.js ecosystem | Authoring tool only                                |
| [Kenney City Kit (Roads)](https://kenney.nl/assets/city-kit-roads)       | CC0                  | Initial road and street candidates                                                | Technically qualified; exact candidates unselected |
| [Kenney City Kit (Suburban)](https://kenney.nl/assets/city-kit-suburban) | CC0                  | Initial building and neighborhood candidates                                      | Technically qualified; exact candidates unselected |
| [Kenney Blocky Characters](https://kenney.nl/assets/blocky-characters)   | CC0                  | Initial animated NPC candidates                                                   | Technically qualified; exact candidates unselected |
| [Kenney Cube Pets](https://kenney.nl/assets/cube-pets)                   | CC0                  | Initial animated animal candidates                                                | Technically qualified; exact candidates unselected |
| [THREE.Terrain](https://github.com/IceCreamYou/THREE.Terrain)            | MIT                  | Optional terrain generation before GLB export                                     | Not approved as a runtime dependency               |

The source pages and license terms must be checked again at intake time. An
asset is not production-approved merely because its source pack appears in
this table.

D-044 authorizes only the four individual Kenney downloads above, within the
cost, data, archive, and staging bounds in
`plans/2026-08-27-m8-rainy-neighborhood-world.md`. A second exact
`assetId + SHA-256` user decision is required before assembly or runtime
registration. The paid All-in-One bundle, donations, accounts, credentials,
new dependencies, and additional asset sources remain excluded.

The 2026-08-27 intake is recorded in
`docs/world-sources/M8_WORLD_CANDIDATES_2026-08-27.json`: four exact archives,
177 structurally qualified GLBs, 55 bounded visual candidates, and 122 explicit
out-of-review records. Some official GLBs reference sibling PNG textures; only
those exact texture members are staged and hash-validated. This qualification
does not select a model or authorize a runtime copy.

## Authoring and runtime boundary

The accepted flow is:

1. Select and record source assets.
2. Assemble or generate terrain outside ordinary gameplay.
3. Inspect scale, axes, materials, animation, and required nodes.
4. Export a bounded scene chunk as GLB.
5. Register it in Bunbun's code-owned asset registry and scene definition.
6. Add stable catalog IDs, camera presets, spawn points, authored walkable
   data, locations, object/entity placements, and presentation cues.
7. Load only the chunks and bundles referenced by the validated lesson.

GLB owns renderable geometry, materials, rigs, and animation clips. Bunbun code
and catalogs own:

- asset URLs and transforms;
- stable scene, entity, object, location, cue, and spawn-point IDs;
- camera and lighting policy;
- selectable and interactive registrations;
- navigation bounds or reviewed navmesh references;
- deterministic initial placements and states; and
- mappings from lesson capabilities to fixed runtime behavior.

The scene audio registry similarly owns reviewed ambience, loop boundaries,
spatial placement, distance behavior, and mix-bus assignment. Registered
presentation cues own deterministic effects and musical stings. Character
speech remains a separate cached lesson-audio asset keyed by exact Japanese and
an approved voice profile. Neither GLB nor LessonManifest may hide arbitrary
audio URLs or executable playback behavior.

LessonManifest continues to select registered IDs only. It cannot contain
asset paths, arbitrary URLs, Three.js code, transforms, scripts, terrain
settings, or executable trigger logic.

## Scene chunks and interaction density

A chunk is a bounded lesson-sized diorama, even when neighboring chunks are
styled to look like parts of one city. Each lesson loads only the world content
it needs. A larger city grows by adding or revising reusable chunks rather than
expanding one always-loaded scene.

Locations or approach zones may provide deterministic context for situations
such as meeting someone, noticing an animal, reaching a crossing, or narrowly
avoiding another character. For the current MVP they must resolve through
registered locations, cues, and the eight accepted primitives. This decision
does not add freeform collision events, physics-driven outcomes, or a ninth
interaction primitive.

## Navigation escalation

Use the smallest navigation system justified by authored geometry:

1. Keep direct movement inside authored convex walkable bounds while a chunk
   has no blocking obstacle.
2. When a representative chunk needs routes around obstacles, evaluate an
   authored navmesh with
   [three-pathfinding](https://github.com/donmccurdy/three-pathfinding) in a
   focused compatibility and performance spike.
3. Consider Yuka only when reviewed NPC goals, steering, perception, or
   personality behavior exceed small deterministic state machines.
4. Consider recast-navigation-js only when dynamic obstacles, tiled navmeshes,
   or crowds provide measured value.

Steps 2 through 4 identify preferred candidates, not approved dependencies.
Adding any of them requires the implementation plan and verification for the
milestone that needs it.

## Asset intake record

Before a source asset ships, record at least:

- source name and canonical URL;
- publisher or author;
- exact license and a retained license copy when supplied;
- source version or download date;
- SHA-256 of the downloaded archive or source file;
- original filenames and selected files;
- conversion/editor tool and version;
- material, geometry, rig, animation, or texture modifications;
- exported GLB hash;
- stable catalog IDs and owning scene chunk; and
- measured size and representative runtime observations.

For audio sources, also record the original audio format, sample rate and
channels, edit or loop processing, encoded runtime format and bitrate, duration,
normalization or loudness treatment, and whether the asset is ambience, an
effect, music, or speech. A generated voice record must identify the approved
provider/model/voice/settings inputs without storing a credential or cloning a
real person.

Do not combine assets with incompatible redistribution terms. Do not import a
complete external city engine when an asset or offline authoring result is the
actual requirement.

## Initial implementation gate

The approved queued plan at
`plans/2026-08-19-audio-complete-last-train-showcase.md` covers:

- source download and license capture;
- the physical source/processed/runtime asset layout;
- one representative neighborhood chunk;
- stable ID and required-node conventions;
- terrain/editor export reproducibility;
- animation and material compatibility with Three.js 0.185.1;
- asset and scene-budget measurements;
- static, unit, build, and manual browser verification; and
- recovery or removal of any asset that fails license or technical review.

The plan remains queued after Milestone 7. Exact source selections, retained
licenses, hashes, and audio/provider choices are still implementation gates;
plan approval alone does not authorize an unreviewed download or asset import.

Docker, hosting, a large open world, runtime procedural generation, Yuka,
Recast, and production crowd simulation remain outside this gate.
