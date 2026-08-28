import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const archivePath = resolve(
  root,
  ".bunbun-data/reference-intake/jmdict/v1/JMdict_english.zip",
);
const requested = new Map([
  ["財布", "さいふ"],
  ["探す", "さがす"],
  ["傘", "かさ"],
  ["駅", "えき"],
  ["終電", "しゅうでん"],
  ["公園", "こうえん"],
  ["猫", "ねこ"],
  ["店", "みせ"],
]);

const members = execFileSync("unzip", ["-Z1", archivePath], {
  encoding: "utf8",
})
  .split("\n")
  .filter((member) => /^term_bank_\d+\.json$/u.test(member));
const matches = [];
for (const member of members) {
  const rows = JSON.parse(
    execFileSync("unzip", ["-p", archivePath, member], {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    }),
  );
  for (const row of rows) {
    const [term, reading, definitionTags, rules, score, definitions, sequence] =
      row;
    if (
      requested.get(term) !== reading ||
      definitionTags === "forms" ||
      !Array.isArray(definitions)
    ) {
      continue;
    }
    matches.push({
      term,
      reading,
      definitionTags,
      rules,
      score,
      sequence,
      rowSha256: sha256(JSON.stringify(row)),
      englishPreview: collectText(definitions)
        .filter((value) => value.length > 0 && !value.startsWith("see: "))
        .slice(0, 8),
      member,
    });
  }
}

matches.sort(
  (left, right) =>
    [...requested.keys()].indexOf(left.term) -
      [...requested.keys()].indexOf(right.term) || right.score - left.score,
);
if (process.argv.includes("--check")) {
  const packet = JSON.parse(
    await readFile(
      resolve(
        root,
        "docs/japanese-sources/M8_JAPANESE_REFERENCE_QUALIFICATION_2026-08-28.json",
      ),
      "utf8",
    ),
  );
  const selections = packet.jmdictGate2ProposedSelections;
  if (!Array.isArray(selections) || selections.length !== 8) {
    throw new Error("Gate 2 must contain exactly eight proposed selections.");
  }
  for (const selection of selections) {
    const source = matches.find(
      (candidate) =>
        candidate.term === selection.term &&
        candidate.reading === selection.reading &&
        candidate.sequence === selection.sequence &&
        candidate.definitionTags === selection.definitionTags &&
        candidate.member === selection.sourceMember &&
        candidate.rowSha256 === selection.rowSha256,
    );
    if (source === undefined) {
      throw new Error(
        `Gate 2 selection '${selection.term}/${selection.reading}' does not match the archive.`,
      );
    }
  }
  console.log(
    JSON.stringify(
      {
        status: "PASS",
        archiveSha256: packet.jmdictGate2Candidate.archive.sha256,
        proposedSelections: selections.length,
        promotedSelections: 0,
      },
      null,
      2,
    ),
  );
} else {
  console.log(JSON.stringify({ archivePath, matches }, null, 2));
}

function collectText(value, output = []) {
  if (typeof value === "string") {
    output.push(value);
    return output;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectText(item, output);
    return output;
  }
  if (value !== null && typeof value === "object") {
    if (typeof value.content === "string") output.push(value.content);
    else if (value.content !== undefined) collectText(value.content, output);
  }
  return output;
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
