# M7 v3.2 Skills-only proof runbook

Status: Local implementation ready; user-operated install and proof pending

This runbook installs and invokes the repository-owned `bunbun-authoring`
plugin without an API key, MCP server, browser extension, hosted Custom GPT,
or automated account change. The first packet is authored fixture data and
contains no learner history.

## 1. Local preflight

From `/home/nunu/Desktop/nnlab/nn-bunbun`, activate the pinned Node.js version
and run:

```sh
nvm use
npm run plugin:check
python3 /home/nunu/.codex/skills/.system/skill-creator/scripts/quick_validate.py plugins/bunbun-authoring/skills/bunbun-lesson-authoring
python3 /home/nunu/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py plugins/bunbun-authoring
npm run inspect:authoring -- --request packages/contracts/fixtures/authoring/valid-request.json --result packages/contracts/fixtures/authoring/valid-result.json
```

Expected final lines:

```text
M7_V3_2_PLUGIN_CHECK_PASSED modules=3 files=10
Skill is valid!
Plugin validation passed: /home/nunu/Desktop/nnlab/nn-bunbun/plugins/bunbun-authoring
AUTHORING_EXCHANGE_ACCEPTED requestId=m7_v3_2_lesson_authoring_001
```

## 2. Install on a supported Codex surface

Installation changes local Codex state, so the user performs it deliberately.
Use either the Codex app plugin link supplied in the implementation handoff or
the installed CLI's plugin commands:

```sh
codex plugin marketplace add /home/nunu/Desktop/nnlab/nn-bunbun/marketplace.json
codex plugin add bunbun-authoring@personal
codex plugin list
```

If this local marketplace is already configured, do not add a duplicate. If a
different configured marketplace already uses the name `personal`, use the app
link and report the collision before renaming any durable manifest.

The current Codex IDE extension does not support plugins. Use a supported Codex
app/CLI or ChatGPT surface. Availability can still depend on the account or
workspace and normal plan limits.

## 3. Run the fixed proof

1. Start a new conversation after installation or reload.
2. Invoke `$bunbun-lesson-authoring` explicitly.
3. Paste or attach exactly
   `packages/contracts/fixtures/authoring/valid-request.json`.
4. Do not add another target, world fact, learner detail, or instruction.
5. Wait for the response to finish. The response must be one JSON object with
   no Markdown fence or surrounding prose.
6. Record these observations without interpreting them:

```text
newConversation: yes/no
imageFileOrToolStarted: yes/no
responseFinished: yes/no
rawResponse:
<exact response>
```

Expected media behavior is `imageFileOrToolStarted: no`. Do not count a result
as passing merely because it looks plausible.

## 4. Validate the actual response

Save the exact response as a JSON file without removing prose, fences, or
unknown fields. Then run:

```sh
npm run inspect:authoring -- --request packages/contracts/fixtures/authoring/valid-request.json --result /absolute/path/to/raw-response.json
```

Only `AUTHORING_EXCHANGE_ACCEPTED` is a local pass. Every rejection is retained
with stable diagnostics. One bounded repair may use the same packet with
`attempt: 2` plus redacted diagnostics. A second invalid result ends the proof;
do not switch prompts, transport, model behavior, world facts, or answer truth.

## 5. Manual acceptance matrix

Happy path:

- the plugin is visible after a new conversation;
- the Skill returns one strict JSON object;
- no image, file, browser, external tool, or hosted GPT starts; and
- local inspection accepts all identities, hashes, IDs, claims, shapes, and
  budgets.

Edge cases:

- an altered prompt hash or input hash is rejected;
- prose/fenced/malformed JSON is rejected without extraction;
- learner identity, an unknown field, an oversized field, a disallowed world
  claim, or an early answer leak is rejected; and
- unavailable plugin surface or plan allowance leaves the proof pending and
  publishes nothing.

Regression:

- existing authored gameplay and persistence still run without this plugin;
- no MCP, browser extension, API key, cookie/session access, public endpoint,
  or original GPT link is needed; and
- a generated result cannot publish a lesson or add runtime mechanics.

## 6. Recovery

To remove the local installation after the proof:

```sh
codex plugin remove bunbun-authoring@personal
```

Remove the configured marketplace only when no other local plugin uses it:

```sh
codex plugin marketplace remove personal
```

Removal does not change LessonManifest, local gameplay data, or the retained
v3.1 evidence. The repository source remains available for review.
