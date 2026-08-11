# Run the Bunbun project foundation locally

Status: Complete
Owner: Codex and user
Created: 2026-08-10
Last updated: 2026-08-10 19:08 Asia/Ho_Chi_Minh

## Purpose and user-visible outcome

Create the smallest maintainable Bunbun workspace that runs locally. The user
can start one local command, open a Bunbun foundation page in a browser, and
open a backend health endpoint. The milestone establishes build and package
boundaries only; it does not claim that gameplay exists.

## Repository context

The repository started this plan with durable project documentation and no
application packages. Milestone 0 is complete and published on main. The
governing decisions are D-006 for the TypeScript/Vite/Node.js direction, D-010
for repository memory, D-011 for manual browser/gameplay testing, D-015 for
local-first delivery, and D-016 for this workspace foundation. The documented
LessonManifest remains a design contract for Milestone 2.

The shell initially resolves system Node.js 18.19.1. Node.js 24.18.0 and npm
11.16.0 are now installed through NVM and pinned by the repository. The
canonical repository is /home/nunu/Desktop/nnlab/nn-bunbun.

## Scope

### In scope

- Pin Node.js 24 LTS and the npm toolchain.
- Use one native npm workspace and package lock.
- Create apps/web with a minimal Vite vanilla TypeScript foundation page.
- Create apps/server with a node:http GET /health endpoint.
- Create packages/contracts as an intentionally empty shared package boundary.
- Add root dev, typecheck, lint, format-check, and build commands.
- Document local setup and exact manual smoke-test steps.
- Run non-browser static, build, and HTTP smoke checks.

### Out of scope

- Three.js scenes, gameplay, lesson interactions, and production visual design.
- Machine-readable LessonManifest types or validators.
- SQLite, AI, TTS, generated media, and external APIs.
- React or another frontend framework.
- A backend framework beyond node:http.
- Docker, hosting, release automation, and domain configuration.
- Automated browser E2E tooling.

## Decisions and constraints

- Node.js 24 LTS is pinned in .nvmrc and package engines.
- npm workspaces own apps/web, apps/server, and packages/contracts.
- PORT is the only approved environment variable name. The default is 3000.
- The server binds to 127.0.0.1 for local development.
- The web foundation uses Vite and DOM/CSS without React or Three.js.
- A single root command runs web and server concurrently.
- Static checks may use focused tooling, but browser validation is manual.
- Documentation and this plan must stay current during the implementation.

## Implementation approach

Keep all shared development tooling at the workspace root with one lockfile.
Each workspace owns only its package identity, TypeScript configuration, and
runtime entry points. The server uses a small deterministic request handler for
/health and a JSON 404 response. The web page exposes only foundation status
and links to the local health endpoint. The contracts package compiles as an
empty module so Milestone 2 can introduce the real contract without migrating
an accidental placeholder schema.

## Milestones

### 1. Pin the local toolchain

Install Node.js 24 through NVM, record the exact patch and bundled npm version,
and add root engine/version metadata.

### 2. Establish workspace boundaries

Create root tooling plus apps/web, apps/server, and packages/contracts with
strict TypeScript configurations and minimal entries.

### 3. Verify local operation

Install from the lockfile; run typecheck, lint, format check, and production
build; start both services; verify the web response and health/404 responses.

### 4. Hand off manual validation

Update durable documentation and this plan, keep the milestone open, and give
the user exact browser smoke steps. Record only results the user reports.

## Progress

- [x] 2026-08-10 14:01 — Read all required repository documentation and query
  shared Bunbun memory.
- [x] 2026-08-10 14:01 — Inspect the repository, Git state, and installed
  Node.js/npm versions.
- [x] 2026-08-10 14:01 — Receive user approval for Node.js 24, npm workspaces,
  the three-package layout, node:http, and PORT.
- [x] 2026-08-10 14:04 — Install Node.js 24.18.0 with npm 11.16.0 and pin the
  repository toolchain.
- [x] 2026-08-10 14:06 — Scaffold root tooling and all three workspaces.
- [x] 2026-08-10 14:09 — Install dependencies, pin the approved esbuild install
  script, and generate the root lockfile.
- [x] 2026-08-10 14:11 — Pass clean install, static checks, and production
  builds.
- [x] 2026-08-10 14:10 — Pass non-browser HTTP and process smoke checks.
- [x] 2026-08-10 14:12 — Update durable state and hand off the manual browser
  checklist.
- [x] 2026-08-10 19:08 — Receive the user's manual acceptance and desktop
  browser screenshot, record the reported result, and close Milestone 1.

## Surprises and discoveries

- The login shell uses system Node.js 18.19.1 even though NVM defaults to
  22.18.0. Every reproducible command in this plan must explicitly source NVM
  and run nvm use until the shell startup behavior is changed outside project
  scope.
- The registry's latest TypeScript was 7.0.2, but typescript-eslint 8.66.0
  supports TypeScript below 6.1. The workspace therefore pins TypeScript 6.0.3
  instead of forcing an incompatible peer tree.
- npm 11.16.0 requires explicit approval for dependency install scripts. The
  repository pins approval only for esbuild 0.28.2, the Vite build dependency;
  a later esbuild version will require a deliberate review.
- The sandbox initially denied local port binding. Running the same server
  outside that restriction verified that the application itself binds and
  responds correctly.

## Plan decisions

- 2026-08-10 — Use one npm workspace rather than a monorepo orchestrator. The
  project has only three boundaries and does not need another abstraction.
- 2026-08-10 — Use node:http for the health boundary so Milestone 1 does not
  prematurely resolve O-006.
- 2026-08-10 — Use a concurrency helper for the root dev command rather than a
  shell-specific background-process script.
- 2026-08-10 — Do not add Docker or deployment files before local release
  candidate acceptance under D-015.

## Validation

### Static and automated checks

Run from /home/nunu/Desktop/nnlab/nn-bunbun after sourcing NVM:

- npm ci
- npm run typecheck
- npm run lint
- npm run format:check
- npm run build
- git diff --check

Start the backend and verify:

- GET http://127.0.0.1:3000/health returns HTTP 200 and Bunbun JSON.
- GET http://127.0.0.1:3000/missing returns HTTP 404 JSON.
- An invalid PORT value exits with a clear configuration error.

Start the Vite server and verify its HTML and module responses over HTTP. These
checks do not replace the user's manual browser test.

### Manual happy path

1. Run nvm use and npm ci.
2. Run npm run dev.
3. Open http://127.0.0.1:5173/ and confirm the Bunbun local foundation page is
   readable.
4. Open http://127.0.0.1:3000/health and confirm status is ok for bunbun-server.
5. Stop the root dev command once with Ctrl+C and confirm both child processes
   stop.

### Manual edge cases

1. Open http://127.0.0.1:3000/missing and confirm a JSON not-found response.
2. Reload the web page and resize from a narrow mobile-like width to a wide
   desktop width; content must remain readable without horizontal scrolling.
3. Run PORT=invalid npm run dev:server and confirm the server exits with a
   clear invalid-PORT message.

### Manual regression

1. Confirm all durable files under docs/, AGENTS.md, .agent/, and plans/ remain
   present.
2. Confirm the repository contains no Docker/deployment or automated browser
   E2E artifacts.
3. Confirm npm run build creates only ignored dist output and does not modify
   durable specification documents.

### Manual results

| Scenario | Tester | Date | Result | Evidence or notes |
| --- | --- | --- | --- | --- |
| Milestone 1 local smoke | User | 2026-08-10 | Pass | User reported Milestone 1 as okay; supplied screenshot shows the foundation page rendered at 127.0.0.1:5173 with all three workspace boundaries visible. |

## Recovery and compatibility

All new application files are additive. npm ci recreates dependencies from the
root lockfile. Generated node_modules and dist directories are ignored and may
be safely regenerated. No database, persisted learner data, external service,
or migration is introduced. If Node.js 24 cannot be installed, stop before
generating a lockfile with another Node/npm version.

## Documentation updates

- D-016 records the accepted workspace decision.
- BUNBUN_ARCHITECTURE.md records the physical foundation layout.
- CURRENT_STATE.md names this active plan and current milestone.
- ROADMAP.md marks Milestone 1 complete after user acceptance.
- plans/README.md indexes this plan.

## Outcomes

The Node.js 24/npm 11 workspace, three package boundaries, local foundation
page, and deterministic health server are implemented. A clean `npm ci`
reported zero vulnerabilities. Typecheck, lint, format check, and production
build passed. HTTP smoke checks confirmed the web response, health response,
JSON 404, invalid-PORT failure, combined root development command, and clean
shutdown. The user accepted the local foundation on 2026-08-10 and supplied a
desktop-browser screenshot showing the expected page at 127.0.0.1:5173.
Milestone 1 is complete; Milestone 2 planning is the recommended next work.
