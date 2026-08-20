import { spawn } from "node:child_process";
import { access, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { findAuthoringEvaluationCaseV2 } from "./authoring-evaluation-suite-v2.js";

const fixtureId = readFlag("--fixture");
const codexBinary = readFlag("--codex-bin");

if (fixtureId === undefined || codexBinary === undefined) {
  console.error(
    "Usage: npm run run:authoring-eval:v2 -- --fixture <fixture-id> --codex-bin <absolute-codex-path>",
  );
  process.exitCode = 2;
} else {
  const evaluationCase = findAuthoringEvaluationCaseV2(fixtureId);
  if (evaluationCase === undefined) {
    console.error(`AUTHORING_V2_EVAL_UNKNOWN_FIXTURE fixtureId=${fixtureId}`);
    process.exitCode = 2;
  } else {
    const repositoryRoot = resolve(import.meta.dirname, "../../..");
    const evidenceDirectory = resolve(
      repositoryRoot,
      "docs/ai-modules/feasibility/m7-v3-2-evals-v0.2.0",
    );
    const outputPath = resolve(
      evidenceDirectory,
      `${fixtureId}.response.raw.json`,
    );
    await mkdir(evidenceDirectory, { recursive: true });
    if (await exists(outputPath)) {
      console.error(
        `AUTHORING_V2_EVAL_OUTPUT_EXISTS fixtureId=${fixtureId} path=${outputPath}`,
      );
      process.exitCode = 2;
    } else {
      const prompt = [
        "Use $bunbun-lesson-authoring for exactly the single JSON packet below.",
        "Treat this as a fresh, independent 0.2.0 fixture run.",
        "Return exactly one JSON object and nothing else.",
        "",
        JSON.stringify(evaluationCase.request),
        "",
      ].join("\n");
      const exitCode = await runCodex(codexBinary, outputPath, prompt);
      if (exitCode !== 0) {
        console.error(
          `AUTHORING_V2_EVAL_EXEC_FAILED fixtureId=${fixtureId} exitCode=${exitCode}`,
        );
        process.exitCode = exitCode;
      } else {
        console.log(
          `AUTHORING_V2_EVAL_CAPTURED fixtureId=${fixtureId} path=${outputPath}`,
        );
      }
    }
  }
}

async function runCodex(
  codexBinary: string,
  outputPath: string,
  prompt: string,
): Promise<number> {
  return new Promise((resolveExitCode, reject) => {
    const child = spawn(
      codexBinary,
      [
        "exec",
        "--ephemeral",
        "--skip-git-repo-check",
        "--sandbox",
        "read-only",
        "--cd",
        "/tmp",
        "--color",
        "never",
        "--output-last-message",
        outputPath,
        "-",
      ],
      { stdio: ["pipe", "inherit", "inherit"] },
    );
    child.once("error", reject);
    child.once("exit", (code) => resolveExitCode(code ?? 1));
    child.stdin.end(prompt);
  });
}

async function exists(path: string): Promise<boolean> {
  return access(path).then(
    () => true,
    () => false,
  );
}

function readFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  const value = process.argv[index + 1];
  return index >= 0 && value !== undefined && !value.startsWith("--")
    ? value
    : undefined;
}
