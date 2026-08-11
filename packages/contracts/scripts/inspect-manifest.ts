import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { validateLessonPackage } from "../src/index.js";

const [manifestArgument, catalogArgument, ...extraArguments] =
  process.argv.slice(2);

if (
  manifestArgument === undefined ||
  catalogArgument === undefined ||
  extraArguments.length > 0
) {
  console.error(
    "Usage: npm run inspect:manifest -- <manifest.json> <catalog.json>",
  );
  process.exitCode = 2;
} else {
  try {
    const [manifestInput, catalogInput] = await Promise.all([
      readJson(manifestArgument),
      readJson(catalogArgument),
    ]);
    const result = validateLessonPackage(manifestInput, catalogInput);

    if (!result.ok) {
      console.error(`Validation failed (${result.errors.length} error(s)).`);
      result.errors.forEach((error) => {
        console.error(
          `[${error.source}/${error.layer}/${error.code}] ${error.path}: ${error.message}`,
        );
      });
      process.exitCode = 1;
    } else {
      const { manifest, catalog } = result.value;
      console.log("LessonManifest inspection: PASS");
      console.log(`Schema version: ${manifest.schemaVersion}`);
      console.log(`Lesson: ${manifest.lessonId} revision ${manifest.revision}`);
      console.log(`Catalog: ${catalog.catalogId} revision ${catalog.revision}`);
      console.log(`Scene: ${manifest.scene.sceneId}`);
      console.log(`Targets: ${manifest.learningTargets.length}`);
      console.log(`Steps: ${manifest.steps.length}`);
      console.log(`Interactive objects: ${manifest.objects.length}`);
    }
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Manifest inspection failed.",
    );
    process.exitCode = 2;
  }
}

async function readJson(path: string): Promise<unknown> {
  const absolutePath = resolve(process.cwd(), path);
  const source = await readFile(absolutePath, "utf8");
  try {
    return JSON.parse(source) as unknown;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Invalid JSON.";
    throw new Error(`Could not parse JSON at '${absolutePath}': ${detail}`, {
      cause: error,
    });
  }
}
