# Bunbun

Bunbun is a local-first, AI-powered Japanese-learning game. The current
workspace includes the browser and server foundations, executable
LessonManifest 0.1.0 contracts, a deterministic isometric park runtime, and an
authored lesson that executes all eight fixed MVP interaction primitives.

## Requirements

- NVM
- Node.js 24.18.0
- npm 11.16.0

## Install

```bash
nvm use
npm ci
```

## Run locally

Start the web and server processes together:

```bash
npm run dev
```

Then open:

- Isometric park runtime: http://127.0.0.1:5173/
- Server health: http://127.0.0.1:3000/health

The backend uses port 3000 by default. PORT is the only supported Milestone 1
environment variable:

```bash
PORT=3100 npm run dev:server
```

Milestones 3 through 5 expose explicit local query controls without adding
environment variables:

- `?debug=1` opens runtime diagnostics.
- `?renderer=webgl2` forces the WebGL2 backend.
- `?assetFailure=1` fails the first asset load so the retry path can be tested.
- `?manifestFailure=1` rejects the first lesson package before scene startup so
  the validation retry path can be tested.
- `?audioFailure=1` makes Japanese speech unavailable so the assisted text path
  can be tested without recording heard evidence.
- `?movementFailure=1` fails the first authored MOVE_TO request without
  consuming a learner attempt.
- `?carryFailure=1` invalidates the world carry mirror before GIVE so the
  fail-closed recovery boundary can be tested.

For example, open
http://127.0.0.1:5173/?renderer=webgl2&debug=1 to inspect the fallback backend.

## Checks

```bash
npm run typecheck
npm run lint
npm run format:check
npm run schema:check
npm test
npm run build
```

Inspect the valid authored lesson against its catalog:

```bash
npm run inspect:manifest -- \
  packages/contracts/fixtures/manifests/valid-find-dog.json \
  packages/contracts/fixtures/catalogs/basic-catalog.json
```

Inspect the Milestone 5 eight-primitive fixture with:

```bash
npm run inspect:manifest -- \
  packages/contracts/fixtures/manifests/valid-complete-primitive-loop.json \
  packages/contracts/fixtures/catalogs/basic-catalog.json
```

The earlier `valid-find-dog.json` and `valid-find-dog-loop.json` fixtures remain
available for Milestone 2 and 4 regression inspection.

## Workspace layout

- apps/web — Vite, Three.js, the local park fixture, deterministic lesson
  controller, browser adapters, and DOM learning UI.
- apps/server — Node.js TypeScript local health server.
- packages/contracts — TypeBox schemas, inferred types, Ajv and semantic
  validators, generated JSON Schema, fixtures, tests, and developer inspector.
- docs — durable product, architecture, gameplay, and state memory.
- plans — live and completed ExecPlans.

## Current limitations

- The park and eight-step lesson are technical fixtures, not the final product
  scene, learner level, or content set.
- All eight accepted primitives execute, but PICK_UP uses one task-scoped
  dog-follow presentation rather than an inventory or physics system.
- Object, authored-location, and recipient selection are enabled only for the
  active lesson step. Characters do not have generic detail modals or popups.
- Evidence is session-local and resets on reload. SQLite, AI compilation,
  production cached TTS, generated media, and mastery are not implemented.
- Browser SpeechSynthesis is a temporary technical adapter and may vary by
  desktop browser and installed Japanese voice.
- The JavaScript build contains the WebGPU-capable Three.js renderer and emits
  Vite's default large-chunk warning; runtime measurements are recorded during
  manual acceptance.
- Browser and gameplay validation is manual.
- Docker, hosting, and domain work are deferred until local release-candidate
  acceptance.
