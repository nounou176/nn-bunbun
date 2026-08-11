# Bunbun Current State

Last updated: 2026-08-10

## Current milestone

Milestone 2 — Machine-readable contracts and catalog fixtures: implementation
complete; awaiting user manual acceptance.

Active ExecPlan: plans/2026-08-10-contracts-and-catalog-fixtures.md.

Completed ExecPlan: plans/2026-08-10-project-foundation.md.

## Completed work

- Established the durable product vision, architecture, gameplay primitives,
  LessonManifest 0.1.0 specification, performance direction, decisions,
  roadmap, current-state record, and ExecPlan standard.
- Recorded manual browser/gameplay testing, repository continuity, and the
  local-first release gate as accepted operating decisions.
- Created the Node.js 24.18.0/npm 11.16.0 workspace with separate Vite web,
  node:http server, and shared-contract packages.
- Created the responsive Milestone 1 foundation page and deterministic health
  and JSON 404 endpoints.
- Received the user's manual acceptance of Milestone 1 and recorded the
  supplied desktop screenshot.
- Accepted D-017: TypeBox 1.x is the schema-first source, Ajv performs strict
  structural validation, and pure TypeScript performs semantic validation.
- Implemented the complete LessonManifest 0.1.0 schema, including all three
  learning-target variants, eight interaction variants, ten scaffold variants,
  completion, quality, provenance, and closed nested records.
- Implemented CatalogSnapshot 0.1.0 for scenes, spawn points, cameras, asset
  bundles, locations, entities, objects and affordances, cues, voices, and
  reference records.
- Implemented stable, sorted structural and semantic diagnostics without
  mutation, coercion, defaults, repair, or removal of unknown properties.
- Implemented deterministic catalog, reference, scene, spawn, state,
  affordance, audio, cue, provenance, interaction, scaffold, graph,
  reachability, completion, coverage, evidence, support-locale, text-safety,
  and quality checks.
- Added one valid FIND_SOMETHING lesson and catalog fixture plus the six
  roadmap-required invalid fixtures.
- Added generated LessonManifest and CatalogSnapshot JSON Schema artifacts and
  a drift check covering all eight generated artifacts.
- Added a manifest inspection command and 14 focused contract tests.
- Proved the server and web consume the same LessonManifest version through an
  isolated browser-safe export; the web production JavaScript remains 1.76 kB
  rather than bundling validators.

## Current work

- Hand off the Milestone 2 manual developer and browser-regression checklist.
- Record the user's result and close the active ExecPlan and roadmap milestone
  if accepted.

## Repository inventory

Present:

- AGENTS.md and the required docs/ durable project records;
- .agent/PLANS.md and two tracked milestone ExecPlans;
- root npm workspace and shared TypeScript, ESLint, Prettier, NVM, npm, and
  environment-example configuration;
- apps/web and apps/server;
- packages/contracts source schemas, inferred types, validators, fixtures,
  generated JSON Schema artifacts, inspector, and tests; and
- package.json and package-lock.json.

Not present:

- database or migration files;
- 3D, audio, or image assets;
- gameplay runtime or interaction executors;
- AI, compiler-job, TTS, or persistence integrations;
- automated browser E2E configuration or tests;
- Dockerfiles; and
- deployment configuration.

The canonical repository is /home/nunu/Desktop/nnlab/nn-bunbun. It is on main
with origin set to https://github.com/nounou176/nn-bunbun.git. Milestone 0 is
published; the user-approved Milestone 1 and current Milestone 2 changes remain
uncommitted together.

## Known issues

1. The fixture catalog proves identities and capabilities but does not provide
   production scene, mesh, navigation, image, or audio assets.
2. Contract 0.1.0 rejects every graph cycle because it has no counter or
   condition language with which to prove an arbitrary cycle bounded.
3. Deterministic validators cannot judge natural Japanese quality or future
   physical reachability from 3D geometry; those require later review/runtime
   systems.
4. Browser/device support, WebGPU policy, load budgets, and several performance
   limits need Milestone 3 prototype measurements.
5. Initial learner level, support locale, scene, scenario, and target set are
   not selected.
6. Mastery aggregation, weak-target scheduling, analytics privacy, progress
   synchronization, and compiler-draft normalization remain deferred.
7. The login shell resolves system Node.js 18.19.1 until NVM is sourced;
   contributors must run nvm use to activate Node.js 24.18.0.
8. Deployment topology remains intentionally deferred until local
   release-candidate acceptance.

## Next recommended work

Complete the short Milestone 2 manual acceptance checklist. If accepted, close
this milestone and discuss the Milestone 3 renderer/browser decisions before
starting its ExecPlan.

## Verification status

- Clean dependency install: passed with Node.js 24.18.0/npm 11.16.0; 142
  packages audited and zero vulnerabilities reported.
- Generated artifact drift check: passed for two schemas and six invalid
  fixtures.
- Typecheck: passed for contracts, server, and web workspaces.
- Lint and format check: passed after formatting the final validator tests.
- Contract tests: passed, 14 of 14.
- Fixture inspection: the valid lesson passed; all six invalid fixtures exited
  nonzero with their intended stable error codes.
- Production build: passed for contracts, server, and web workspaces; web
  output is 1.76 kB JavaScript and 1.87 kB CSS before gzip.
- HTTP/process regression: passed for web HTML/module output, shared contract
  version 0.1.0, health JSON, JSON 404, combined startup, Ctrl+C shutdown, and
  port cleanup.
- Scope regression: passed; no Three.js, AI, SQLite, TTS, Docker, deployment,
  or automated browser E2E artifacts were added.
- Docker build: not applicable; Dockerfiles intentionally do not exist.
- Milestone 1 manual browser test: passed by user report on 2026-08-10.
- Milestone 2 manual acceptance: pending user report.
- Manual gameplay test: not applicable; gameplay does not exist yet.
- Automated browser E2E tooling: intentionally excluded by D-011.

## Risks

- Later compiler Structured Outputs may need a separate all-required draft
  schema and deterministic normalization into the playable contract; it must
  not weaken LessonManifest 0.1.0.
- Catalog capability checks do not replace Milestone 3 measurements of
  navigation, object overlap, renderer compatibility, or real asset budgets.
- Manual-only browser validation depends on disciplined, recorded user results.
