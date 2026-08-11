# Bunbun

Bunbun is a local-first, AI-powered Japanese-learning game. The current
workspace includes the browser and server foundations plus executable
LessonManifest 0.1.0 contracts and deterministic fixture validation. Gameplay
begins in later roadmap milestones.

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

- Web foundation: http://127.0.0.1:5173/
- Server health: http://127.0.0.1:3000/health

The backend uses port 3000 by default. PORT is the only supported Milestone 1
environment variable:

```bash
PORT=3100 npm run dev:server
```

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

- apps/web — Vite vanilla TypeScript browser foundation.
- apps/server — Node.js TypeScript local health server.
- packages/contracts — TypeBox schemas, inferred types, Ajv and semantic
  validators, generated JSON Schema, fixtures, tests, and developer inspector.
- docs — durable product, architecture, gameplay, and state memory.
- plans — live and completed ExecPlans.

## Current limitations

- No Three.js scene or gameplay is implemented yet.
- No SQLite, AI, TTS, generated media, 3D runtime, or gameplay exists yet.
- Browser and gameplay validation is manual.
- Docker, hosting, and domain work are deferred until local release-candidate
  acceptance.
