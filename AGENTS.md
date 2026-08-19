# Bunbun Repository Instructions

This repository is the durable source of truth for Bunbun. Do not rely on prior
chat history or on similarly named projects outside this repository.

## Language

- Communicate with the user in Vietnamese.
- Write code, code comments, commit messages, schemas, and durable project
  documentation in English unless the user explicitly requests otherwise.

## Required reading

Before significant product, architecture, UX, or implementation work, read:

1. docs/BUNBUN_VISION.md
2. docs/BUNBUN_ARCHITECTURE.md
3. docs/GAMEPLAY.md
4. docs/LESSON_MANIFEST.md
5. docs/DECISIONS.md
6. docs/CURRENT_STATE.md
7. docs/ROADMAP.md and docs/PERFORMANCE.md when relevant
8. docs/AI_MODULES.md before AI, compiler, or prompt-module work
9. docs/WORLD_AUTHORING.md before world, scene, navigation, or asset work
10. The active file in plans/ when one exists

Inspect the current codebase before proposing or making changes. Do not assume
that a discussion is a request to write code.

## Product invariants

- Optimize for meaningful Japanese reactions per minute, not arbitrary game
  complexity.
- Build short, reusable, isometric or bird's-eye 3D micro-scenarios.
- Use point-and-click as the primary MVP control.
- Compose lessons only from the fixed interaction primitives documented in
  docs/GAMEPLAY.md.
- Treat AI as a lesson compiler. AI must not generate per-lesson Three.js code
  or run inside the render loop.
- Capture, review, version, and approve Custom GPT behavior through
  docs/AI_MODULES.md before porting it into compiler prompt modules. Never use
  hidden external GPT configuration or an undocumented generic substitute.
- Validate every generated LessonManifest strictly before gameplay.
- Keep ordinary gameplay deterministic and local after lesson generation.
- Keep world authoring GLB-first and preserve the code-owned runtime boundary
  documented in docs/WORLD_AUTHORING.md.
- Keep the 3D world dominant and use HTML/CSS overlays for learning UI.
- Preserve the MVP non-goals in docs/BUNBUN_VISION.md.

## Durable project memory

When the user makes a durable product or architecture decision:

1. Add or update an accepted record in docs/DECISIONS.md.
2. Update every affected specification document.
3. If implementation state changes, update docs/CURRENT_STATE.md.

After a meaningful implementation milestone:

1. Update docs/CURRENT_STATE.md with the milestone, completed work, current
   work, known issues, and next recommended work.
2. Update docs/ROADMAP.md when milestone status or sequencing changes.
3. Update the active ExecPlan before ending the work session.

The repository documentation wins over shared memory or old conversations. If
sources disagree, surface the conflict and ask before changing an accepted
decision.

## Planning and decisions

- For complex multi-step work, create a self-contained ExecPlan following
  .agent/PLANS.md and keep it current during implementation.
- For important ambiguous product decisions, analyze tradeoffs, recommend an
  option, and discuss it with the user before implementation.
- Do not add abstractions, services, mechanics, or dependencies beyond the
  approved scope.
- Keep detailed rationale in docs/. Keep this file concise and operational.

## Verification

- The user performs browser and gameplay validation manually. Do not add or
  run automated browser E2E tooling unless the user explicitly reverses this
  decision.
- Every implementation handoff must include a concrete manual test checklist
  covering the happy path, edge cases, and regressions.
- Run relevant static checks, unit or integration tests, builds, and Docker
  builds only when those facilities exist and are relevant to the approved
  task. Report unavailable checks as not applicable rather than scaffolding
  unrelated tooling.
- When frontend and backend Dockerfiles exist, build both locally before a
  staging handoff.
- Before declaring work complete, report happy-path status, edge-case status,
  regression status, and known risks.

## Scope and safety

- Never store secret values in documentation or memory.
- Confirm environment variable names with the user before using them in code
  or commands.
- Develop and manually accept a complete local game before adding Docker,
  hosting, release automation, or domain configuration. Start release planning
  only after the user explicitly approves the local release candidate.
- Preserve user changes and avoid destructive Git or filesystem operations.
- Do not import the older Dreamworld or bunbun/game2 implementation into this
  repository unless the user explicitly requests it.
