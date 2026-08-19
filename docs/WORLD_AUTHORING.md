# Bunbun World Authoring

## Status

This document defines the approved world-authoring direction under D-025. The
pipeline is approved, but no production asset, terrain tool, navigation
dependency, or world chunk has been imported or implemented yet.

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

This envelope does not select the first lesson scenario, learner level,
support locale, vocabulary, or grammar targets. It is not a seamless open
world.

## Approved authoring stack

| Source or tool | License | Approved role | Runtime status |
| --- | --- | --- | --- |
| [Three.js Editor](https://threejs.org/editor/) | MIT through Three.js | Assemble, inspect, and export scene assets against the current Three.js ecosystem | Authoring tool only |
| [Kenney City Kit (Roads)](https://kenney.nl/assets/city-kit-roads) | CC0 | Initial road and street candidates | Asset intake required |
| [Kenney City Kit (Suburban)](https://kenney.nl/assets/city-kit-suburban) | CC0 | Initial building and neighborhood candidates | Asset intake required |
| [Kenney Blocky Characters](https://kenney.nl/assets/blocky-characters) | CC0 | Initial animated NPC candidates | Asset intake required |
| [Kenney Cube Pets](https://kenney.nl/assets/cube-pets) | CC0 | Initial animated animal candidates | Asset intake required |
| [THREE.Terrain](https://github.com/IceCreamYou/THREE.Terrain) | MIT | Optional terrain generation before GLB export | Not approved as a runtime dependency |

The source pages and license terms must be checked again at intake time. An
asset is not production-approved merely because its source pack appears in
this table.

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

Do not combine assets with incompatible redistribution terms. Do not import a
complete external city engine when an asset or offline authoring result is the
actual requirement.

## Initial implementation gate

Before implementation starts, create or approve a focused ExecPlan that
covers:

- source download and license capture;
- the physical source/processed/runtime asset layout;
- one representative neighborhood chunk;
- stable ID and required-node conventions;
- terrain/editor export reproducibility;
- animation and material compatibility with Three.js 0.185.1;
- asset and scene-budget measurements;
- static, unit, build, and manual browser verification; and
- recovery or removal of any asset that fails license or technical review.

Docker, hosting, a large open world, runtime procedural generation, Yuka,
Recast, and production crowd simulation remain outside this gate.
