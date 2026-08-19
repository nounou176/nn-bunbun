# Bunbun Performance Specification

## Purpose

Performance protects the learning loop. Slow loading, frame drops, delayed
picking, and excessive travel all reduce meaningful Japanese reactions per
minute even when the educational content is sound.

This document defines initial reference budgets. They are design constraints,
and the Milestone 3 through 5 sections distinguish measured build facts from
runtime measurements that still require manual browser acceptance.

## Reference target

The MVP should target:

- 60 FPS on ordinary desktop and laptop hardware;
- responsive point-and-click picking and movement;
- fast startup for a small lesson;
- stable DOM overlay input while the 3D scene is active; and
- graceful degradation on weaker supported hardware.

At 60 FPS the total frame budget is approximately 16.7 ms. Rendering should not
consume the entire budget because input, lesson logic, DOM work, audio, and
browser scheduling also need time.

The minimum browser and device support matrix is still an open decision. No
hardware claim is accepted until it has been measured on named devices.

## Milestone 3 technical prototype

D-018 accepts the user's current stable desktop Chromium browser with pointer
and keyboard as the prototype reference environment. The exact browser version,
OS, device, GPU, and display must be recorded during manual acceptance; no wider
browser or device claim follows from this milestone.

Provisional reference-machine goals are:

| Measurement | Goal |
| --- | --- |
| Frame rate | 60 FPS preferred |
| Draw calls | Fewer than 100 |
| Device pixel ratio | Capped at 1.5 |
| First visible local scene | Under 2 seconds |
| Picking response | Under 100 ms |
| Longest authored movement | Under 3 seconds |

Static production-build measurements from 2026-08-12 are:

| Artifact | Measured size |
| --- | --- |
| Web JavaScript | 852,644 bytes minified; 234.70 kB gzip |
| Web CSS | 5,537 bytes minified; 1.82 kB gzip |
| Local park glTF | 5,899 bytes |
| Web HTML | 520 bytes |

The WebGPU-capable Three.js chunk triggers Vite's default warning above 500 kB
uncompressed. It remains visible as a known optimization risk; the milestone
does not hide the warning or introduce premature code splitting before local
scene-ready measurements exist.

The runtime diagnostics panel reports backend, FPS, average and p95 frame time,
draw calls, triangles, capped DPR/render size, scene-ready time, picking
response, selected ID, and movement state. Actual browser results remain
pending until the user records them through the manual protocol below.

Manual functional acceptance was reported as `PASS` by the user on 2026-08-11,
including forced WebGL2, recovery, resize, background/resume, and repeated-load
behavior. The user then gave a second explicit `PASS` in response to the
requested diagnostics/performance checklist. The browser version, OS,
device/GPU, display, renderer, FPS/frame time, draw calls, triangles, DPR,
scene-ready time, and picking response were not supplied, so the milestone is
qualitatively accepted but no numeric runtime-performance claim is recorded.

## Milestone 4 deterministic lesson prototype

D-019 adds full browser-side lesson validation, a three-step controller, DOM
learning overlays, and a temporary SpeechSynthesis adapter to the existing
park. Static production-build measurements from 2026-08-11 are:

| Artifact | Measured size |
| --- | --- |
| Web JavaScript | 1,229,245 bytes minified; 340.84 kB gzip |
| Web CSS | 9,175 bytes minified; 2.58 kB gzip |
| Local park glTF | 5,899 bytes |
| Web HTML | 520 bytes |
| Three-step LessonManifest fixture | 10,131 bytes authored JSON |
| CatalogSnapshot fixture | 2,259 bytes authored JSON |

The JavaScript increase is primarily the intentional first inclusion of Ajv,
TypeBox-derived schemas, semantic validators, and the lesson runtime in the
browser boundary. The single chunk still triggers Vite's default 500 kB
uncompressed warning. This is recorded as an optimization risk; splitting or
removing validation is not justified until manual first-stimulus and warm/cold
measurements show where startup time is actually spent.

Diagnostics now report lesson-active time, the latest reaction latency, and
time from boot start to the first rendered lesson stimulus in addition to the
Milestone 3 renderer metrics. Numeric browser results, audio-start latency, and
named reference-device details remain pending manual Milestone 4 acceptance.

The user's first browser screenshot on 2026-08-12 recorded WebGL2, 62 FPS,
16.2/25.0 ms average/p95 frame time, 1,861 triangles, DPR 1.5, 374 ms scene
ready, 7.9 ms picking response, and 397 ms first stimulus. It also displayed
15,542 “draw calls,” but source inspection proved that field was reading the
cumulative `render.calls` counter rather than per-frame `render.drawCalls`.
That diagnostic is corrected and the invalid 15,542 value is not accepted as a
performance measurement. The attempt also failed the lesson input handoff, so
all screenshot metrics remain observations rather than final acceptance data.

Subsequent screenshots after the counter fix showed 30–32 per-frame draw calls,
62–63 FPS, 16.0–16.1/25.0 ms average/p95 frame time, 1,797–1,925 triangles,
208 ms scene ready, and 231 ms first stimulus. These confirm the diagnostic now
reports a plausible frame-local value. The user supplied an explicit `PASS` on
2026-08-12 after the corrected compact EXPLORE presentation and full Milestone
4 manual checklist. Acceptance is qualitative beyond these screenshot values:
browser version, device/GPU identity, display details, cold/warm split, and
audio-start latency were not reported and are not reconstructed.

## Milestone 5 complete primitive prototype

D-020 extends the same park and validated browser boundary with one eight-step
fixture, DOM ARRANGE and TYPE, authored location targets, task-scoped dog escort
presentation, recipient selection, and three additional diagnostic fields. Its
static production-build measurements from 2026-08-12 are:

| Artifact | Measured size |
| --- | --- |
| Web JavaScript | 1,254,603 bytes minified; 346.59 kB gzip reported by Vite |
| Web CSS | 10,696 bytes minified; 2.90 kB gzip reported by Vite |
| Local park glTF | 5,899 bytes |
| Web HTML | 520 bytes |
| Eight-step LessonManifest fixture | 20,432 bytes authored JSON |
| CatalogSnapshot fixture | 2,795 bytes authored JSON |

Compared with the recorded Milestone 4 build, the implementation adds 25,358
minified JavaScript bytes and 1,521 CSS bytes. The existing single-chunk Vite
warning remains visible. This static increase does not establish a browser
performance regression or acceptance result.

The diagnostics panel now also reports the current world target mode, pending
location, and carried object. The user supplied an explicit `PASS` on
2026-08-12 for the full Milestone 5 happy-path, edge-case, failure-control,
renderer, lifecycle, and performance matrix. No diagnostics values, named
device details, or per-scenario notes accompanied that result, so acceptance is
recorded as qualitative and no numeric runtime claim is inferred.

## Scene budgets

Initial normal-scene targets:

| Resource | Target |
| --- | --- |
| Active NPCs and animals | 1–5 |
| Interactive objects | Approximately 5–30 |
| Draw calls | Preferably below approximately 100 |
| Texture dimensions | Generally 1024 px or below |
| Realtime shadow casters | Minimal; ideally 0–1 |
| Realtime lights | Minimal and intentionally budgeted |
| Physics | No heavy physics engine |
| Loaded content | Current lesson assets only |

These are not permission to spend every budget simultaneously. A scene with
five animated NPCs may need fewer unique materials, smaller textures, or no
realtime shadows.

Budgets for triangles, GPU memory, JavaScript bundle size, compressed lesson
download, initial load time, and interaction latency require real prototype
measurements before numeric limits are accepted.

## Production world asset gate

D-025 selects a GLB-first authoring pipeline but does not approve unmeasured
source-pack contents. The representative Japanese-neighborhood chunk must be
measured after source selection, conversion, and registration. Record at least:

- source and exported GLB byte sizes;
- node, mesh, primitive, material, texture, and animation counts;
- triangles and frame-local draw calls at the accepted camera;
- texture dimensions and approximate GPU footprint where available;
- cold and warm scene-ready time;
- first-stimulus and picking response time;
- active NPC/animal animation cost; and
- WebGPU and forced-WebGL2 behavior on the named reference device.

THREE.Terrain output receives the same review as hand-assembled geometry. A
procedurally authored source does not authorize unbounded runtime terrain or
exemption from scene budgets. Keep chunks independently loadable and avoid
shipping unused source-pack content.

## Rendering strategy

### Renderer

- Use Three.js.
- Prefer WebGPURenderer only where it is appropriate for the supported browser
  matrix and demonstrably stable.
- Provide a WebGL2 fallback.
- Renderer selection must be capability-based and testable.
- Failure to initialize the preferred renderer must lead to a safe fallback or
  clear error, not a blank canvas.

For Milestone 3, automatic WebGPU selection with WebGL2 fallback and an explicit
forced-WebGL2 query are accepted by D-018. The broader production policy and
browser exclusions remain deferred.

### Camera and composition

- Use a fixed or constrained isometric, bird's-eye, or diorama camera.
- Keep visible scene bounds intentionally small.
- Avoid rendering distant world content that does not support the lesson.
- Use frustum culling and catalog-defined visibility where appropriate.
- Camera movement must be brief and must not impair picking or readability.

### Geometry

- Favor stylized low-poly assets.
- Reuse geometry across catalog objects.
- Use InstancedMesh for repeated compatible objects.
- Remove hidden or unnecessary geometry before shipping assets.
- Avoid high-frequency geometry that is invisible at the gameplay camera scale.
- Do not add a physics mesh when a simple authored navigation or collider shape
  is sufficient.

### Materials and textures

- Share materials and texture atlases where they reduce real draw calls without
  harming maintainability.
- Keep textures generally at or below 1024 px unless the camera view and
  measured quality justify more.
- Prefer KTX2/Basis GPU-compressed textures when the asset pipeline is ready.
- Limit transparent overdraw and large layered alpha effects.
- Avoid unique material instances created per lesson object.
- Keep shader variants small and intentional.

### Lighting and shadows

- Prefer baked lighting and ambient scene treatment.
- Use minimal realtime lights.
- Prefer blob, decal, or other fake shadows when they communicate grounding.
- Restrict realtime shadow maps by caster, receiver, resolution, and update
  frequency.
- Avoid full-scene dynamic shadows as an assumed default.

### Compression

- Use glTF or GLB as the runtime 3D asset format.
- Prefer Meshopt for geometry optimization when it improves measured transfer
  or decode cost.
- Use Draco only when its size benefit outweighs decoder and startup cost.
- Use KTX2/Basis when texture transfer or GPU memory warrants it.
- Record encoder settings and decoder versions in the asset pipeline.

Compression choices must be measured on representative lessons. Combining
every compressor by default is not a goal.

## Loading and caching

- Load the selected manifest before activating the scene.
- Resolve and fetch only asset bundles referenced by that manifest.
- Separate essential first-interaction assets from optional later assets when
  this materially improves time to first stimulus.
- Cache reusable scene and audio assets using stable versioned keys.
- Avoid blocking the first interaction on mnemonic images or other optional
  media.
- Dispose lesson-specific GPU resources when leaving a lesson, while retaining
  deliberately shared cached resources.
- Detect failed or incompatible assets before exposing an interaction that
  depends on them.

The TTS cache key must include all inputs that can change the spoken output,
such as normalized Japanese text, voice profile, model version, and relevant
generation settings.

## Runtime loop

- AI and network compilation work never runs in the frame loop.
- Lesson transitions are event-driven rather than polled with expensive scene
  scans.
- Picking considers registered interactive targets, not every renderable mesh.
- Object identity comes from stable application metadata.
- Navigation remains lightweight and bounded to the micro-scene.
- Avoid per-frame memory allocation in hot paths where measurements show
  garbage-collection stalls.
- Pause or reduce work when the tab is backgrounded.
- Cap frame delta before applying movement or animation after a long pause.

## Resolution and quality degradation

- Cap device pixel ratio instead of blindly using the device maximum.
- Allow an adaptive quality policy to reduce pixel ratio before changing
  learning content.
- Reduce or disable decorative particles, post-processing, realtime shadows,
  and nonessential animation on weaker hardware.
- Never hide an interactive target or Japanese prompt as a quality
  degradation.
- Preserve picking accuracy, input focus, and audio controls across tiers.

The initial tier thresholds must be based on measured frame time, not user-agent
guessing alone.

## DOM overlay performance

- Use DOM for Japanese dialogue, choices, arrangement, typing, help, and
  lightweight progress.
- Avoid layout thrashing during animation.
- Do not rerender an entire overlay tree for a timer or frame update when a
  narrow update is sufficient.
- Keep focus transitions deterministic between canvas and form controls.
- Avoid unnecessary 3D text geometry.
- Ensure Japanese fonts do not cause an invisible-text delay at the first
  stimulus.

## Performance observability

Development diagnostics should eventually expose:

- selected renderer and adapter information;
- device pixel ratio and active quality tier;
- FPS plus median and high-percentile frame time;
- draw calls, triangles, points, and lines;
- texture and geometry counts where available;
- loaded asset bundles and approximate transfer size;
- scene-load and time-to-first-stimulus timings;
- picking-to-feedback latency;
- long-task or frame-stall indicators; and
- active NPC and interactive-object counts.

Milestone 6 also observes local persistence state: acknowledged event count,
save state, last-save time, session status, and checkpoint sequence. Persistence
must not block the render loop or claim an unacknowledged interaction as saved.
The 2026-08-12 production build after Milestone 6 implementation contains a
1,273.78 kB minified JavaScript chunk (351.53 kB gzip), 12.42 kB CSS (3.17 kB
gzip), the 5.89 kB local glTF fixture, and the 0.52 kB HTML entry. Vite's known
large-chunk warning remains. Milestone 6 received qualitative browser
acceptance on 2026-08-12, but save latency, visible-stall measurements, and
named-device details were not supplied and must not be inferred.

Diagnostics should not appear in the normal learner UI.

## Manual performance protocol

The user performs browser and gameplay validation manually. Do not create an
automated browser E2E suite.

For each meaningful rendering milestone:

1. Record the browser version, OS, device, display resolution, and renderer.
2. Start with caches cold and measure time to visible scene and first Japanese
   stimulus.
3. Repeat with warm caches.
4. Play the full representative lesson while observing frame time and draw
   calls.
5. Exercise every interactive object and DOM overlay.
6. Resize the viewport and test at the capped high-DPI setting.
7. Force or select the weakest supported quality tier.
8. Test WebGL2 fallback independently from WebGPU.
9. Background and resume the tab.
10. Record visible stutter, input delay, audio delay, memory growth, and asset
    failures.

Report measured results rather than only saying that the scene feels smooth.

## Performance acceptance checklist

### Happy path

- The representative scene reaches the first stimulus within the accepted load
  budget once that budget is defined.
- Normal play holds the accepted frame target on the named reference device.
- Picking and feedback feel immediate and have measured latency.
- Audio replay does not stall rendering.

### Edge cases

- Weak GPU or unavailable WebGPU.
- High-DPI display.
- Narrow and wide supported viewports.
- Slow asset delivery and failed optional asset.
- Repeated lesson entry and exit.
- Background tab and resume.
- Maximum normal NPC and object counts.

### Regression

- Asset optimization does not change stable object identities.
- Quality reduction does not remove instructional context.
- Compression does not create a slower first interaction.
- DOM overlays do not trigger persistent frame drops.
- New visual polish does not push draw calls above the accepted scene budget.

## Known unknowns

The first technical prototypes must establish:

- named reference devices;
- supported browsers and versions;
- whether 60 FPS is a hard minimum or preferred target on each tier;
- maximum initial and warm load times;
- maximum picking-to-feedback latency;
- GPU and system memory budgets;
- JavaScript and asset transfer budgets;
- practical WebGPU fallback behavior; and
- profiling tools and a repeatable results format.
