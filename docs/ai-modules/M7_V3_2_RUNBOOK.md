# M7 v3.2 Skills-only 0.2.0 runbook

Status: Contract 0.2.0 implemented; plugin requalification pending

This runbook installs and invokes the repository-owned `bunbun-authoring`
plugin without an API key, MCP server, browser extension, hosted Custom GPT,
or automated account change. The requalification packets are authored fixture
data and contain no learner history. Later application exports use the separate
normalized learner-target disclosure and the same exclusion boundary.

## 1. Local preflight

From `/home/nunu/Desktop/nnlab/nn-bunbun`, activate the pinned Node.js version
and run:

```sh
nvm use
npm run plugin:check
python3 /home/nunu/.codex/skills/.system/skill-creator/scripts/quick_validate.py plugins/bunbun-authoring/skills/bunbun-lesson-authoring
python3 /home/nunu/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py plugins/bunbun-authoring
npm run inspect:authoring:v2 -- --request packages/contracts/fixtures/authoring/v0.2.0/valid-request.json --result packages/contracts/fixtures/authoring/v0.2.0/valid-result.json
```

Expected final lines:

```text
M7_V3_2_PLUGIN_CHECK_PASSED modules=3 files=10
Skill is valid!
Plugin validation passed: /home/nunu/Desktop/nnlab/nn-bunbun/plugins/bunbun-authoring
AUTHORING_EXCHANGE_ACCEPTED requestId=m7_v3_2_lesson_authoring_v2_001
```

## 2. Install on a supported Codex surface

Installation changes local Codex state, so the user performs it deliberately.
The marketplace manifest must be located at
`.agents/plugins/marketplace.json`. Add the repository directory, not the JSON
file itself. Use a CLI version that exposes `codex plugin add`; on the current
machine `/home/nunu/.local/bin/codex` is version `0.147.0`, while the
NVM-preferred `0.121.0` binary does not expose that command:

```sh
/home/nunu/.local/bin/codex plugin marketplace add /home/nunu/Desktop/nnlab/nn-bunbun
/home/nunu/.local/bin/codex plugin add bunbun-authoring@personal
/home/nunu/.local/bin/codex plugin list --marketplace personal
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
3. Paste or attach exactly one request from
   `packages/contracts/fixtures/authoring/v0.2.0/`.
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

Attaching `valid-request.json` as the requested input is expected and is not a
plugin-started media/tool action. The plugin itself must not start an image,
output file, browser, or external tool. Do not count a result as passing merely
because it looks plausible.

## 4. Validate the actual response

Save the exact response as a JSON file without removing prose, fences, or
unknown fields. Then run:

```sh
npm run inspect:authoring:v2 -- --request /absolute/path/to/request.json --result /absolute/path/to/raw-response.json
```

Only `AUTHORING_EXCHANGE_ACCEPTED` is a local pass. Every rejection is retained
with stable diagnostics. One bounded repair uses `attempt: 2`, the prior raw
response hash, a structured prior result only when strict parsing succeeded,
and bounded redacted diagnostics. A second invalid result ends the proof; do
not switch prompts, transport, model behavior, world facts, or answer truth.

For the D-034 requalification, run the four former contract-gap fixtures and
the malformed Story Sheet regression as independent conversations:

```sh
npm run run:authoring-eval:v2 -- --fixture reverse_trainer_natural_phrase_groups --codex-bin /home/nunu/.local/bin/codex
npm run run:authoring-eval:v2 -- --fixture reverse_trainer_reverse_recall_type --codex-bin /home/nunu/.local/bin/codex
npm run run:authoring-eval:v2 -- --fixture reverse_trainer_arrange_reconstruction --codex-bin /home/nunu/.local/bin/codex
npm run run:authoring-eval:v2 -- --fixture story_coach_rejects_source_and_runtime_regression --codex-bin /home/nunu/.local/bin/codex
npm run run:authoring-eval:v2 -- --fixture story_sheet_rejects_source_scope_regression --codex-bin /home/nunu/.local/bin/codex
```

The runner uses fresh ephemeral Codex conversations, retains exact response
text, and refuses to overwrite an existing evidence directory. Grade retained
files with `inspect:authoring-eval:v2`; never rewrite a response to make it
pass.

## 5. Manual acceptance matrix

Happy path:

- the plugin is visible after a new conversation;
- the Skill returns one strict JSON object;
- no image, file, browser, external tool, or hosted GPT starts; and
- local inspection accepts all identities, hashes, IDs, claims, shapes, and
  budgets.

Edge cases:

- an altered prompt hash, input hash, or accepted response is rejected;
- prose/fenced/malformed JSON is rejected without extraction;
- learner identity, an unknown field, an oversized field, a disallowed world
  claim, or an early answer leak is rejected; and
- unavailable plugin surface or plan allowance leaves the proof pending and
  publishes nothing.

Regression:

- existing authored gameplay and persistence still run without this plugin;
- no MCP, browser extension, API key, cookie/session access, public endpoint,
  or original GPT link is needed; and
- a generated result cannot publish a lesson, alter attempts/display timing, or
  add runtime mechanics.

## 6. Recovery

To remove the local installation after the proof:

```sh
/home/nunu/.local/bin/codex plugin remove bunbun-authoring@personal
```

Remove the configured marketplace only when no other local plugin uses it:

```sh
/home/nunu/.local/bin/codex plugin marketplace remove personal
```

Removal does not change LessonManifest, local gameplay data, or the retained
v3.1 evidence. The repository source remains available for review.
