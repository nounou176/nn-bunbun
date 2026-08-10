# Bunbun Current State

Last updated: 2026-08-10

## Current milestone

Milestone 0 — Durable documentation foundation: complete.

The repository is in a documentation-only state. No application implementation
is currently in progress.

## Completed work

- Read and incorporated the complete initial Bunbun product and technical
  specification.
- Established AGENTS.md as concise repository-level operating instructions.
- Documented the product vision, learning philosophy, north-star metric, and
  MVP non-goals.
- Documented the frontend, backend, compiler, runtime, AI, persistence, and
  asset architecture boundaries.
- Defined EXPLORE and INTERACTION states and the eight fixed MVP interaction
  primitives.
- Designed LessonManifest contract version 0.1.0, including strict field
  semantics, closed interaction variants, evidence constraints, validation,
  versioning, and an illustrative manifest.
- Documented rendering and asset performance philosophy and initial budgets.
- Recorded accepted and deferred decisions.
- Created a sequential implementation roadmap.
- Created the ExecPlan standard and the plans directory.
- Recorded the user decision to use manual browser and gameplay testing only,
  with no automated browser E2E tooling.
- Isolated old bunbun/game2 or Dreamworld memory from this new project.
- Moved the documentation foundation into the dedicated nn-bunbun Git
  repository while preserving its existing main branch and origin remote.
- Recorded the local-first delivery strategy: complete and manually accept the
  game locally before Docker, hosting, release, or domain work.

## Current work

No feature or application work is active.

The next task should begin with product discussion for Milestone 1 rather than
silently scaffolding the application.

## Repository inventory

Present:

- AGENTS.md
- docs/BUNBUN_VISION.md
- docs/BUNBUN_ARCHITECTURE.md
- docs/GAMEPLAY.md
- docs/LESSON_MANIFEST.md
- docs/PERFORMANCE.md
- docs/ROADMAP.md
- docs/DECISIONS.md
- docs/CURRENT_STATE.md
- .agent/PLANS.md
- plans/README.md

Not present:

- frontend or backend source code;
- package manifest or dependency lockfile;
- machine-readable JSON Schema;
- database or migration files;
- 3D, audio, or image assets;
- environment configuration;
- unit or integration tests;
- automated browser E2E configuration or tests;
- Dockerfiles; and
- deployment configuration.

The canonical repository is /home/nunu/Desktop/nnlab/nn-bunbun. It is
initialized on the main branch with origin set to
https://github.com/nounou176/nn-bunbun.git. The documentation foundation is
committed and published on origin/main.

## Known issues

1. LessonManifest 0.1.0 is a documentation contract only. Its eventual JSON
   Schema, TypeScript types, and semantic validators do not exist yet.
2. The example scene, catalog IDs, voice profile, and reference provider in the
   manifest are illustrative rather than implemented assets.
3. Browser/device support, WebGPU policy, load budgets, and several performance
   limits need prototype measurements.
4. Mastery aggregation, weak-target scheduling, analytics privacy, and progress
   synchronization are unresolved.
5. Initial learner level, support locale, scene, scenario, and lesson targets
   are not selected.
6. Package layout, tool versions, and framework choices below the accepted
   architecture remain undecided. Deployment topology is intentionally
   deferred until local release-candidate acceptance.
7. No implementation exists to build or test. Manual browser testing, static
   checks, and Docker builds are therefore not applicable to this milestone.

## Next recommended work

Discuss and approve Milestone 1 foundation choices:

1. repository and package layout;
2. package manager and Node.js version;
3. frontend/backend development topology;
4. shared-contract placement;
5. initial static checks;
6. the exact environment variable names, if any are needed; and
7. the local development and manual smoke-test commands.

After those choices are accepted:

- record them in DECISIONS.md and affected architecture documents;
- create a dated project-foundation ExecPlan following .agent/PLANS.md;
- update this file to name that active plan; and
- implement only the approved Milestone 1 scope.

## Verification status

- Required documentation files: passed, 11 of 11 present.
- Repository-local Markdown path references: passed, no dangling current
  reference.
- LessonManifest example JSON parsing and basic reference, audio, transition,
  target-exposure, and context checks: passed.
- Initial specification coverage audit: passed for product metric, learning
  philosophy, camera/control, states, primitives, scenarios, compiler/runtime
  boundary, stack, assets, AI, TTS, persistence, UI, performance, non-goals,
  continuity, ExecPlans, and manual testing.
- Scope regression check: passed; no application, package, automated browser
  E2E, or Docker artifacts were created.
- Repository relocation integrity: passed; all 11 project files match the
  source content and the destination Git metadata was preserved.
- Initial GitHub publication: passed; main tracks origin/main and the active
  GitHub account is nounou176.
- Application build: not applicable; no application exists.
- Docker build: not applicable; no Dockerfiles exist.
- Manual browser/gameplay test: not applicable; no runtime exists.
- Automated browser E2E tooling: intentionally excluded by D-011.

## Risks

- The detailed manifest design may expose changes when implemented as a strict
  JSON Schema. Such changes must be reviewed rather than made silently.
- Choosing the first scene before selecting a learner level and target set
  could bias gameplay toward spectacle rather than language density.
- Premature selection of frameworks or asset pipelines could add complexity
  before the core deterministic learning loop is proven.
- Manual-only browser validation depends on disciplined, recorded test steps
  and user-reported outcomes.
