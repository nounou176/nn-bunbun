# Bunbun

Bunbun is a local-first, AI-powered Japanese-learning game. The current
workspace includes the browser and server foundations, executable
LessonManifest 0.1.0 contracts, a deterministic isometric park runtime, and the
first authored LISTEN → CLICK_OBJECT → CHOOSE learning loop.

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

Milestones 3 and 4 expose explicit local query controls without adding
environment variables:

- `?debug=1` opens runtime diagnostics.
- `?renderer=webgl2` forces the WebGL2 backend.
- `?assetFailure=1` fails the first asset load so the retry path can be tested.
- `?manifestFailure=1` rejects the first lesson package before scene startup so
  the validation retry path can be tested.
- `?audioFailure=1` makes Japanese speech unavailable so the assisted text path
  can be tested without recording heard evidence.

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

Replace `valid-find-dog.json` with `valid-find-dog-loop.json` to inspect the
Milestone 4 three-step fixture.

## Workspace layout

- apps/web — Vite, Three.js, the local park fixture, deterministic lesson
  controller, browser adapters, and DOM learning UI.
- apps/server — Node.js TypeScript local health server.
- packages/contracts — TypeBox schemas, inferred types, Ajv and semantic
  validators, generated JSON Schema, fixtures, tests, and developer inspector.
- docs — durable product, architecture, gameplay, and state memory.
- plans — live and completed ExecPlans.

## Current limitations

- The park and three-step lesson are technical fixtures, not the final product
  scene, learner level, or content set.
- Only LISTEN, CLICK_OBJECT, and CHOOSE execute in Milestone 4; the other five
  accepted primitives remain planned for Milestone 5.
- Dog and cat selection is active only during the second lesson step. The guide
  character is presentation-only, and Milestone 4 does not define generic
  animal/character detail modals or popups.
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
