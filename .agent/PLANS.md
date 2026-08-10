# Bunbun ExecPlan Standard

## Purpose

An ExecPlan is a self-contained, continuously updated implementation document
for a complex multi-step feature or milestone. It allows a future Codex session
to resume work using repository state alone.

An ExecPlan is not a speculative backlog. It explains how to produce and
validate one concrete outcome.

## When an ExecPlan is required

Create an ExecPlan before:

- a multi-file feature with dependent steps;
- a new runtime, compiler, persistence, asset, or AI subsystem;
- a schema or migration that affects stored data;
- a milestone from ROADMAP.md;
- a risky refactor;
- work expected to span more than one session; or
- implementation whose product behavior still needs explicit acceptance.

An ExecPlan is normally unnecessary for a typo, wording-only documentation
change, or another obviously local and reversible edit.

## Location and naming

Store plans under plans/ using:

YYYY-MM-DD-short-descriptive-name.md

Use lowercase kebab-case after the date. One plan owns one outcome. If a plan
supersedes another, link both plans and explain why.

## Required properties

Every plan must be:

- Self-contained — it does not rely on chat history.
- Repository-specific — it names real files, modules, contracts, and commands.
- Outcome-oriented — a reader can describe what becomes possible.
- Decision-aware — it cites accepted decisions and calls out unresolved ones.
- Safe — it explains migrations, compatibility, recovery, and destructive
  operations.
- Verifiable — it includes static checks and concrete manual browser steps.
- Live — progress, discoveries, decisions, and results are updated while work
  happens.

Do not copy vague task lists into plans. Explain enough context for a future
contributor who has read AGENTS.md but has not seen the original conversation.

## Plan lifecycle

1. Read the required repository documents and inspect current code.
2. Create the plan with status Proposed.
3. Discuss material product or architecture choices with the user.
4. Record accepted choices in DECISIONS.md and update the plan to Approved.
5. Update CURRENT_STATE.md with the active plan.
6. Implement in small checkpoints, updating Progress and Surprises immediately.
7. Run available non-browser checks and prepare manual E2E scenarios.
8. Ask the user to perform manual browser validation when user action is
   required.
9. Record only results actually observed or reported.
10. Update documentation, CURRENT_STATE.md, and ROADMAP.md.
11. Complete the Outcomes section and mark the plan Complete.

If work stops, the plan must state exactly what is complete, what remains, and
how to resume.

## Progress rules

- Use checkboxes with timestamps in Asia/Ho_Chi_Minh time.
- Keep completed items; do not rewrite history into a clean-looking list.
- Split a partially completed item so completed and remaining work are clear.
- Record unexpected facts in Surprises and Discoveries when they are found.
- Record a scope or design decision in both the plan and DECISIONS.md when it
  is durable.
- Keep commands reproducible and state their working directory.
- Do not claim a manual test passed unless the user or an authorized tester
  reported that result.

## Required plan structure

Use this template and remove instructional placeholder text only when replacing
it with project-specific content.

~~~markdown
# Outcome-focused plan title

Status: Proposed
Owner: Codex and user
Created: YYYY-MM-DD
Last updated: YYYY-MM-DD HH:MM Asia/Ho_Chi_Minh

## Purpose and user-visible outcome

Explain what becomes possible and how the user can observe it.

## Repository context

Summarize the current implementation. Name the important files, modules,
contracts, and current limitations. State which documents and decisions govern
the work.

## Scope

### In scope

- Concrete deliverable.

### Out of scope

- Explicit exclusion.

## Decisions and constraints

- Cite relevant D-XXX records.
- List unresolved decisions that block implementation.
- State product, performance, data, privacy, and compatibility constraints.

## Implementation approach

Describe the intended data flow and module responsibilities in prose. Explain
why this is the smallest coherent approach.

## Milestones

### 1. Milestone name

Describe the change, affected files, and observable checkpoint.

### 2. Milestone name

Continue with dependency-ordered checkpoints.

## Progress

- [ ] YYYY-MM-DD HH:MM — First concrete step.

## Surprises and discoveries

- None yet.

## Plan decisions

- YYYY-MM-DD — Decision and rationale. Link DECISIONS.md if durable.

## Validation

### Static and automated checks

List only checks supported by the repository, with exact commands and expected
outcomes. Playwright is excluded by D-011.

### Manual happy path

1. Starting state and action.
2. Expected visible result.

### Manual edge cases

1. Edge condition and expected recovery.

### Manual regression

1. Existing behavior that must remain unchanged.

### Manual results

| Scenario | Tester | Date | Result | Evidence or notes |
| --- | --- | --- | --- | --- |
| Pending | Pending | Pending | Not run | Awaiting implementation |

## Recovery and compatibility

Explain safe reruns, migrations, rollback or recovery, old-data behavior, and
how partial failure is detected.

## Documentation updates

- DECISIONS.md changes.
- Specification changes.
- CURRENT_STATE.md and ROADMAP.md changes.

## Outcomes

Complete this at the end with delivered behavior, checks, reported manual
results, remaining issues, and recommended next work.
~~~

## Validation policy

The user performs browser E2E testing manually. Each relevant plan must provide
specific steps for:

- happy path;
- incorrect or invalid input;
- boundary conditions;
- repeated or rapid input;
- reload and resume;
- unavailable assets, audio, network, or renderer as applicable;
- viewport and supported device behavior;
- performance budgets; and
- regressions in previously completed milestones.

Playwright must not be added or run unless D-011 is explicitly superseded.
Focused unit and integration tests may be planned when they add value and match
the approved task. Builds, typechecks, linters, database migration checks, and
Docker builds should be included only after their supporting files exist.

## Completion standard

A plan is Complete only when:

- its approved outcome exists;
- available relevant static checks pass or failures are documented;
- the manual checklist has been handed to the user;
- actual user-reported manual results are recorded when required for
  acceptance;
- happy path, edge cases, regressions, and risks are reported;
- durable decisions and specifications are current;
- CURRENT_STATE.md and ROADMAP.md match reality; and
- no required work remains hidden in conversation history.
