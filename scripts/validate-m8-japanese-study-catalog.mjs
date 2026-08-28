import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(
  await readFile(
    resolve(root, "packages/contracts/fixtures/manifests/m8-last-train.json"),
    "utf8",
  ),
);
const catalogPath = resolve(
  root,
  process.argv[2] ??
    "packages/contracts/fixtures/references/m8-last-train-study-catalog.json",
);
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const catalogStat = await stat(catalogPath);

assert(catalogStat.size <= 256 * 1024, "Catalog exceeds the 256 KiB limit.");
assert(catalog.schemaVersion === "0.1.0", "Unexpected schema version.");
assert(catalog.lessonId === manifest.lessonId, "Lesson ID mismatch.");
assert(
  catalog.lessonRevision === manifest.revision,
  "Lesson revision mismatch.",
);
assert(
  catalog.sources.every((source) => source.sourceId !== "jmdict"),
  "JMdict content is not approved for promotion.",
);

const expectedTexts = collectTexts(manifest);
const recordsByText = new Map();
const ids = new Set();
for (const record of catalog.records) {
  assert(!ids.has(record.textId), `Duplicate textId '${record.textId}'.`);
  ids.add(record.textId);
  assert(
    record.textSha256 === sha256(record.textJa),
    `Text hash mismatch for '${record.textId}'.`,
  );
  assert(
    !recordsByText.has(record.textJa),
    `Duplicate text '${record.textJa}'.`,
  );
  recordsByText.set(record.textJa, record);
  if (record.audioAssetId !== undefined) {
    const audio = manifest.audioAssets.find(
      (candidate) => candidate.audioAssetId === record.audioAssetId,
    );
    assert(audio !== undefined, `Unknown audio '${record.audioAssetId}'.`);
    assert(
      audio.textJa === record.textJa,
      `Audio text mismatch for '${record.textId}'.`,
    );
  }
}
for (const textJa of expectedTexts) {
  assert(recordsByText.has(textJa), `Missing study record for '${textJa}'.`);
}
for (const audio of manifest.audioAssets) {
  assert(
    recordsByText.get(audio.textJa)?.audioAssetId === audio.audioAssetId,
    `Approved audio mapping missing for '${audio.audioAssetId}'.`,
  );
}

console.log(
  JSON.stringify(
    {
      status: "PASS",
      records: catalog.records.length,
      coveredTexts: expectedTexts.size,
      bytes: catalogStat.size,
      sha256: sha256(await readFile(catalogPath)),
      jmdictPromoted: false,
    },
    null,
    2,
  ),
);

function collectTexts(input) {
  const texts = new Set([input.title.ja, input.scenario.objective.ja]);
  for (const step of input.steps) {
    if (step.stimulus.instructionJa) texts.add(step.stimulus.instructionJa);
    if (step.stimulus.utterance?.textJa) {
      texts.add(step.stimulus.utterance.textJa);
    }
    for (const scaffold of step.scaffolds) {
      if (scaffold.textJa) texts.add(scaffold.textJa);
    }
    for (const feedback of Object.values(step.feedback)) {
      if (feedback.textJa) texts.add(feedback.textJa);
    }
  }
  if (input.completion.closingMessage?.ja) {
    texts.add(input.completion.closingMessage.ja);
  }
  return texts;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
