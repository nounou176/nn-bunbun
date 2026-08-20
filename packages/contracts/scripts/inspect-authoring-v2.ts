import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";

import {
  validateLessonAuthoringExchangeV2,
  validateLessonAuthoringRequestV2Structure,
  validateLessonAuthoringResultV2Structure,
  type BunbunValidationError,
} from "../src/index.js";
import { parseStrictJson, sha256CanonicalJson } from "./authoring-tools.js";

const requestPath = readFlag("--request");
const resultPath = readFlag("--result");

if (requestPath === undefined || resultPath === undefined) {
  console.error(
    "Usage: npm run inspect:authoring:v2 -- --request <request.json> --result <result.json>",
  );
  process.exitCode = 2;
} else {
  const requestParse = await parseJsonFile(
    requestPath,
    "REQUEST_JSON_PARSE_ERROR",
  );
  const resultParse = await parseJsonFile(
    resultPath,
    "RESULT_JSON_PARSE_ERROR",
  );

  if (!requestParse.ok || !resultParse.ok) {
    console.error("AUTHORING_V2_EXCHANGE_REJECTED");
    for (const error of [requestParse, resultParse]) {
      if (!error.ok) console.error(`${error.code} / ${error.message}`);
    }
    process.exitCode = 1;
  } else {
    const requestResult = validateLessonAuthoringRequestV2Structure(
      requestParse.value,
    );
    const resultResult = validateLessonAuthoringResultV2Structure(
      resultParse.value,
    );
    if (!requestResult.ok || !resultResult.ok) {
      reject([
        ...(requestResult.ok
          ? []
          : prefixErrors(requestResult.errors, "/request")),
        ...(resultResult.ok
          ? []
          : prefixErrors(resultResult.errors, "/result")),
      ]);
    } else {
      const exchange = validateLessonAuthoringExchangeV2(
        requestResult.value,
        resultResult.value,
        sha256CanonicalJson(requestResult.value.input),
      );
      if (!exchange.ok) {
        reject(exchange.errors);
      } else {
        console.log(
          `AUTHORING_V2_EXCHANGE_ACCEPTED requestId=${exchange.value.request.requestId}`,
        );
      }
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

async function parseJsonFile(
  path: string,
  code: string,
): Promise<
  { ok: true; value: unknown } | { ok: false; code: string; message: string }
> {
  try {
    const invocationDirectory = process.env.INIT_CWD ?? process.cwd();
    const resolvedPath = isAbsolute(path)
      ? path
      : resolve(invocationDirectory, path);
    return {
      ok: true,
      value: parseStrictJson(await readFile(resolvedPath, "utf8")),
    };
  } catch (error) {
    return {
      ok: false,
      code,
      message:
        error instanceof SyntaxError
          ? "File must contain exactly one valid JSON value."
          : "File could not be read.",
    };
  }
}

function prefixErrors(
  errors: BunbunValidationError[],
  prefix: string,
): BunbunValidationError[] {
  return errors.map((error) => ({
    ...error,
    path: error.path === "/" ? prefix : `${prefix}${error.path}`,
  }));
}

function reject(errors: BunbunValidationError[]): void {
  console.error("AUTHORING_V2_EXCHANGE_REJECTED");
  for (const error of errors) {
    console.error(`${error.code} ${error.path} ${error.message}`);
  }
  process.exitCode = 1;
}
