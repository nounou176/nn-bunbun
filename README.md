# Bunbun

Bunbun is a local-first, AI-powered Japanese-learning game. The current
workspace includes the browser and server foundations, executable
LessonManifest 0.1.0 contracts, and a deterministic isometric park runtime.
Lesson execution begins in Milestone 4.

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

Milestone 3 exposes explicit local query controls without adding environment
variables:

- `?debug=1` opens runtime diagnostics.
- `?renderer=webgl2` forces the WebGL2 backend.
- `?assetFailure=1` fails the first asset load so the retry path can be tested.

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

## Workspace layout

- apps/web — Vite, Three.js, the local park fixture, and the browser runtime.
- apps/server — Node.js TypeScript local health server.
- packages/contracts — TypeBox schemas, inferred types, Ajv and semantic
  validators, generated JSON Schema, fixtures, tests, and developer inspector.
- docs — durable product, architecture, gameplay, and state memory.
- plans — live and completed ExecPlans.

## Current limitations

- The park is a technical runtime fixture, not a playable Japanese lesson or
  final product scene.
- Lesson state, interaction primitives, learning evidence, SQLite, AI, TTS,
  and generated media are not implemented yet.
- The JavaScript build contains the WebGPU-capable Three.js renderer and emits
  Vite's default large-chunk warning; runtime measurements are recorded during
  manual acceptance.
- Browser and gameplay validation is manual.
- Docker, hosting, and domain work are deferred until local release-candidate
  acceptance.
