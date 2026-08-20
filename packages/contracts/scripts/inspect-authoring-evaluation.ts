import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";

import { parseStrictJson } from "./authoring-tools.js";
import { gradeAuthoringEvaluation } from "./authoring-evaluation-grader.js";
import { findAuthoringEvaluationCase } from "./authoring-evaluation-suite.js";

const fixtureId = readFlag("--fixture");
const resultPath = readFlag("--result");

if (fixtureId === undefined || resultPath === undefined) {
  console.error(
    "Usage: npm run inspect:authoring-eval -- --fixture <fixture-id> --result <result.json>",
  );
  process.exitCode = 2;
} else {
  const evaluationCase = findAuthoringEvaluationCase(fixtureId);
  if (evaluationCase === undefined) {
    console.error(`AUTHORING_EVAL_UNKNOWN_FIXTURE fixtureId=${fixtureId}`);
    process.exitCode = 2;
  } else if (evaluationCase.execution === "CONTRACT_GAP") {
    console.error(
      `AUTHORING_EVAL_CONTRACT_GAP fixtureId=${fixtureId} code=${evaluationCase.gapCode}`,
    );
    console.error(evaluationCase.reason);
    process.exitCode = 2;
  } else {
    try {
      const invocationDirectory = process.env.INIT_CWD ?? process.cwd();
      const resolvedResultPath = isAbsolute(resultPath)
        ? resultPath
        : resolve(invocationDirectory, resultPath);
      const rawResult = parseStrictJson(
        await readFile(resolvedResultPath, "utf8"),
      );
      const grade = gradeAuthoringEvaluation(evaluationCase, rawResult);
      if (grade.ok) {
        console.log(`AUTHORING_EVAL_ACCEPTED fixtureId=${fixtureId}`);
      } else {
        console.error(`AUTHORING_EVAL_REJECTED fixtureId=${fixtureId}`);
        for (const failure of grade.failures) {
          console.error(`${failure.code} ${failure.message}`);
        }
        process.exitCode = 1;
      }
    } catch (error) {
      console.error(`AUTHORING_EVAL_REJECTED fixtureId=${fixtureId}`);
      console.error(
        `RESULT_JSON_PARSE_ERROR ${
          error instanceof Error ? error.message : "Result could not be read."
        }`,
      );
      process.exitCode = 1;
    }
  }
}

function readFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  const value = process.argv[index + 1];
  return index >= 0 && value !== undefined && !value.startsWith("--")
    ? value
    : undefined;
}
