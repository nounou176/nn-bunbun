# Make LessonManifest 0.1.0 executable and reject invalid lessons

Status: Approved (implementation complete; awaiting user acceptance)
Owner: Codex and user
Created: 2026-08-10
Last updated: 2026-08-10 22:36 Asia/Ho_Chi_Minh

## Purpose and user-visible outcome

Turn the normative LessonManifest 0.1.0 document into executable shared
contracts. At completion, developers can validate an authored lesson against a
versioned catalog, inspect useful deterministic errors, and pass the exact same
typed manifest to the future browser runtime and backend. This milestone does
not render or play the lesson.

## Repository context

Milestones 0 and 1 are complete. The repository contains a Node.js 24/npm 11
workspace with apps/web, apps/server, and an intentionally empty
packages/contracts boundary. docs/LESSON_MANIFEST.md defines the strict 0.1.0
contract, docs/GAMEPLAY.md fixes the eight interaction primitives, and
docs/ROADMAP.md defines the required valid and invalid fixture coverage.

The governing decisions are D-002, D-004, D-010, D-011, D-013, D-015, D-016,
and D-017. D-017 resolves O-005 with TypeBox schema-first definitions, Ajv
strict structural validation, pure TypeScript semantic validation, and
deterministic generated JSON Schema artifacts.

The entire Milestone 1 implementation is still uncommitted. Milestone 2 must
preserve those user-approved changes and must not rewrite or discard them.

## Scope

### In scope

- Implement every LessonManifest 0.1.0 record and closed union as TypeBox
  schemas with inferred TypeScript types.
- Serialize and check versioned JSON Schema artifacts.
- Define a minimal versioned CatalogSnapshot for scenes, spawn points, cameras,
  asset bundles, entities, objects, locations, cues, voice profiles, and
  reference records.
- Implement normalized structural validation errors.
- Implement deterministic reference, graph, coverage, evidence, language,
  interaction, catalog, world, and quality validators that can be proven from
  manifest and fixture data.
- Provide one valid authored FIND_SOMETHING fixture and invalid fixtures for
  unknown properties, bad references, unreachable steps, coverage gaps,
  unbounded fallback cycles, and incompatible evidence.
- Add focused unit and integration tests plus a developer manifest-inspection
  command.
- Make the shared public entry point consumable by both server and web
  workspaces and prove that with compile-time imports.
- Update durable specifications, current state, roadmap, and this plan.

### Out of scope

- Three.js, a rendered scene, gameplay state, or interaction executors.
- OpenAI calls, prompt modules, compiler jobs, or repair retries.
- A Structured Outputs draft schema or conversion of optional values to null.
- SQLite, persistence, learner identity, mastery aggregation, or analytics.
- TTS generation, audio files, production 3D assets, or asset delivery.
- Automated browser E2E tooling, Docker, hosting, and deployment.
- Automated claims about natural Japanese quality that require linguistic
  review rather than deterministic data checks.

## Decisions and constraints

- LessonManifest schemaVersion remains exactly 0.1.0.
- Every object is closed; unknown fields and null optional values fail.
- Interaction and target-content unions are mutually exclusive and serialized
  with oneOf semantics.
- Validation never mutates, coerces, defaults, or repairs input.
- Schema-valid data is not considered playable until semantic validation also
  passes against one CatalogSnapshot.
- Semantic errors use stable codes and JSON-pointer-like paths and are sorted
  deterministically.
- Graph validation rejects unreachable steps and any transition/fallback cycle
  that cannot be statically proven bounded under contract 0.1.0.
- Catalog fixtures describe identities and capabilities, not meshes, URLs,
  scripts, or production asset data.
- The valid fixture is authored data and does not imply that its illustrative
  scene or audio assets exist outside the fixture catalog.
- No new environment variable is introduced.

## Implementation approach

Split packages/contracts into schema, validation, catalog, and public API
modules. TypeBox definitions are the source of runtime JSON Schema objects and
TypeScript static types. A small generation script serializes the manifest and
catalog schemas into tracked JSON files; a check mode compares in-memory and
tracked output byte-for-byte.

Structural validation uses Ajv configured for JSON Schema 2020-12, strict
schema/type checks, all errors, no type coercion, no defaults, and no removal of
additional properties. Ajv errors are mapped to Bunbun's stable structural
error shape without exposing validator-specific objects to consumers.

Semantic validation receives a structurally valid manifest and catalog. It
builds ID indexes once, then runs independent deterministic rule groups. Graph
checks cover entry, reachability, completion, required-step dominance, and
cycles. Coverage checks count reachable exposures and contexts and match
desired evidence to compatible stimulus or assessment opportunities. World
checks resolve catalog compatibility, reachability, initial state, affordance,
candidate, cue, audio, and spawn occupancy rules. Interaction checks enforce
subset, sequence, normalization, fallback, and evidence constraints that JSON
Schema alone cannot express clearly.

The inspector loads JSON files in a Node-only script, validates catalog then
manifest, prints a compact summary on success, prints stable diagnostics on
failure, and uses a nonzero exit status for invalid input. Browser-safe modules
contain no filesystem or process imports.

## Milestones

### 1. Establish schema and validation infrastructure

Add approved dependencies, contract modules, shared schema helpers, version
constants, public error/result types, and deterministic schema serialization.

### 2. Encode LessonManifest and CatalogSnapshot

Implement every documented root and nested structure, all eight interaction
variants, target and scaffold variants, completion, quality, provenance, and
the minimal catalog capabilities needed for semantic resolution.

### 3. Implement deterministic validation

Compile strict structural validators, normalize their errors, build semantic
indexes, and implement the reference, graph, coverage, evidence, interaction,
world, language-safety, and quality checks.

### 4. Add fixtures and developer inspection

Add the valid catalog and lesson, six required invalid lessons, schema artifact
generation/checking, and the manifest inspector.

### 5. Verify consumers and close the milestone

Add tests, prove server and web can import shared contract exports, run all root
checks and focused fixture inspections, update durable documentation, and hand
off a concise manual developer checklist.

## Progress

- [x] 2026-08-10 19:36 — Re-read the governing contract, gameplay, decision,
  current-state, roadmap, performance, and ExecPlan documents.
- [x] 2026-08-10 19:36 — Inspect the empty contracts boundary and the existing
  workspace/static tooling.
- [x] 2026-08-10 19:36 — Receive user approval to implement Milestone 2 and
  accept D-017's schema-first validation approach.
- [x] 2026-08-10 20:04 — Add TypeBox, Ajv, format validation, schema helpers,
  version exports, validation results, and deterministic artifact generation.
- [x] 2026-08-10 20:31 — Encode LessonManifest 0.1.0, CatalogSnapshot 0.1.0,
  all target, interaction, scaffold, world, completion, quality, and provenance
  records, plus both generated JSON Schema artifacts.
- [x] 2026-08-10 21:18 — Implement strict structural validation and the
  deterministic catalog, world, interaction, graph, learning, language, and
  quality semantic rule groups.
- [x] 2026-08-10 21:42 — Add one valid lesson/catalog package, all six required
  invalid fixtures, the inspector, 14 contract tests, and server/web version
  consumer proofs.
- [x] 2026-08-10 22:36 — Pass clean install, artifact drift, typecheck, lint,
  format, tests, build, fixture inspection, HTTP/process regression, shutdown,
  and scope checks; update durable documentation for handoff.
- [ ] Receive and record the user's Milestone 2 manual acceptance.

## Surprises and discoveries

- TypeBox 1.x is ESM-native, supports TypeScript 6, and produces JSON Schema
  2020-12, matching the existing workspace rather than requiring the older
  TypeBox generation.
- The future OpenAI Structured Outputs boundary requires all generated object
  fields to be required, while LessonManifest 0.1.0 intentionally omits
  optional fields and forbids null. The playable schema therefore remains the
  authoritative runtime contract; a later compiler draft schema must normalize
  into it instead of weakening it now.
- Running the inspector through npm's workspace delegation changed its working
  directory and broke root-relative fixture paths. The root command now invokes
  the Node-only inspector directly so documented paths remain stable.
- Importing the full contracts entry from the web foundation pulled Ajv and
  validation code into a 71.7 kB JavaScript bundle. A side-effect-free
  @bunbun/contracts/version subpath restores the production bundle to 1.76 kB.
- The managed sandbox blocks esbuild child-process execution, tsx watch IPC,
  and loopback HTTP. Clean install and local runtime checks passed outside that
  restriction with the repository's pinned Node.js 24 toolchain.

## Plan decisions

- 2026-08-10 — Resolve O-005 through D-017 with TypeBox 1.x, Ajv strict
  structural validation, pure TypeScript semantic validation, and checked JSON
  Schema artifacts.
- 2026-08-10 — Use one CatalogSnapshot argument instead of global registries so
  fixture validation is deterministic and browser/server behavior is equal.
- 2026-08-10 — Reject unprovable graph cycles in 0.1.0. The contract has no
  counter or condition language that could safely prove arbitrary cycles
  bounded.
- 2026-08-10 — Keep Node filesystem code in scripts only; the shared package
  public API remains browser-compatible.

## Validation

### Static and automated checks

Run from /home/nunu/Desktop/nnlab/nn-bunbun with Node.js 24.18.0:

- npm run schema:check
- npm run typecheck
- npm run lint
- npm run format:check
- npm test
- npm run build
- npm run inspect:manifest -- packages/contracts/fixtures/manifests/valid-find-dog.json packages/contracts/fixtures/catalogs/basic-catalog.json
- run the inspector against every invalid fixture and confirm a nonzero exit
  status with its intended stable error code;
- git diff --check

Automated browser E2E tooling is excluded by D-011. These are contract-level
unit and integration checks, not browser automation.

### Manual happy path

1. Run the manifest inspector with the valid manifest and catalog paths.
2. Confirm it prints schema version 0.1.0, the lesson ID, counts, and PASS for
   both structural and semantic validation.
3. Import LessonManifestSchema, the LessonManifest type, and validateManifest
   from @bunbun/contracts in a temporary server or web compile-time consumer.

### Manual edge cases

1. Inspect each invalid fixture and confirm the message names the intended
   path and stable error code.
2. Add an unknown root or nested property and confirm structural rejection.
3. Replace an optional omission with null and confirm structural rejection.
4. Change an accepted object to a missing or non-candidate ID and confirm
   semantic rejection without a crash.
5. Create a self-loop transition or fallback and confirm cycle rejection.

### Manual regression

1. Run npm run dev and confirm the Milestone 1 web and health boundaries still
   start.
2. Confirm no Three.js, AI, SQLite, TTS, Docker, deployment, or browser
   automation artifacts were added.
3. Confirm schema generation does not modify source files and schema check is
   stable on a second run.

### Manual results

| Scenario | Tester | Date | Result | Evidence or notes |
| --- | --- | --- | --- | --- |
| Valid contract inspection | Codex | 2026-08-10 | Pass | Schema 0.1.0; lesson_find_dog; catalog revision 1; one target and one step |
| Six invalid fixture inspections | Codex | 2026-08-10 | Pass | Every command exited nonzero with its intended structural or semantic code |
| Milestone 1 HTTP/process regression | Codex | 2026-08-10 | Pass | Web, health 0.1.0, JSON 404, Ctrl+C, and port cleanup passed |
| Milestone 2 manual browser acceptance | User | Pending | Not run | Run the handoff checklist and report the visible Contracts value |

## Recovery and compatibility

All changes are additive and no stored data exists. npm ci can restore the
dependency tree from the root lockfile. Schema artifacts are regenerated from
source and checked for drift. If implementation exposes a material conflict
with LessonManifest 0.1.0, stop and discuss a contract version change instead
of silently modifying semantics. Invalid fixture data is never migrated or
repaired automatically.

## Documentation updates

- D-017 records the accepted schema and validator direction.
- LESSON_MANIFEST.md will identify implemented artifacts and deterministic
  validation limits.
- BUNBUN_ARCHITECTURE.md will name the concrete shared-contract boundary.
- CURRENT_STATE.md and ROADMAP.md will track Milestone 2 progress and outcome.
- plans/README.md will index this active plan.

## Outcomes

The implementation outcome exists: one schema-first package now supplies the
browser, server, developer inspector, and future compiler with identical
LessonManifest 0.1.0 and CatalogSnapshot 0.1.0 contracts. It rejects structural
drift and semantic failures deterministically, and the required valid/invalid
fixture matrix is executable from the repository root.

All available non-browser checks pass. No gameplay, AI, persistence, asset,
Docker, deployment, or browser-automation scope was introduced. The only
remaining plan item is recording the user's manual acceptance of the visible
contract-version regression and developer inspection checklist.
