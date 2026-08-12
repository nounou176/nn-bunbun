# Bunbun ExecPlans

This directory stores live and completed ExecPlans created according to
.agent/PLANS.md.

## Current status

Milestones 1 through 6 are complete. The Milestone 7 Structured Outputs lesson
compiler ExecPlan is Proposed. D-023 confirms the supplied six-GPT set and
accepts the Story Sheet + Story Coach + Reverse Trainer responsibility map.
D-024 approves Prompt Adaptation Pack 0.1.0: its typed contract, exact prompt
fragments/hashes, composition order, and fifteen text-only evaluation fixtures
under `docs/ai-modules/`. Phase 0 is complete, but D-022, the ExecPlan,
model/reasoning setting, and environment-variable name still require approval
before implementation. Binary examples are style references only.

## Index

| Plan | Status | Outcome |
| --- | --- | --- |
| 2026-08-12-structured-lesson-compiler.md | Proposed | Capture approved lesson-authoring modules, then compile learner vocabulary and grammar into a strictly validated playable local lesson |
| 2026-08-12-local-evidence-sqlite-persistence.md | Complete | Persist evidence and resume one local lesson safely through server-owned SQLite |
| 2026-08-12-complete-mvp-primitive-runtime.md | Complete | Played one authored lesson through all eight fixed MVP primitives |
| 2026-08-11-first-deterministic-learning-loop.md | Complete | Play one authored LISTEN → CLICK_OBJECT → CHOOSE lesson deterministically |
| 2026-08-11-isometric-runtime-foundation.md | Complete | Walk through and inspect one reusable isometric park runtime |
| 2026-08-10-contracts-and-catalog-fixtures.md | Complete | Validate LessonManifest 0.1.0 deterministically against versioned catalog fixtures |
| 2026-08-10-project-foundation.md | Complete | Run the web and server foundations locally with shared workspace tooling |
