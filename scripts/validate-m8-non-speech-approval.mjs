import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { loadAndValidateReviewCatalog } from "./serve-m8-audio-review.mjs";

const REPOSITORY_ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
);
const APPROVAL_PATH = path.join(
  REPOSITORY_ROOT,
  "docs/audio-sources/M8_NON_SPEECH_APPROVAL_2026-08-25.json",
);

export async function validateM8NonSpeechApproval() {
  const { catalog } = await loadAndValidateReviewCatalog();
  const approval = JSON.parse(await readFile(APPROVAL_PATH, "utf8"));
  if (approval.catalogVersion !== catalog.version) {
    throw new Error("Approval and candidate catalog versions do not match.");
  }

  const candidates = new Map(
    catalog.candidates.map((candidate) => [candidate.id, candidate]),
  );
  const decisions = [...approval.approved, ...approval.rejected];
  if (decisions.length !== candidates.size) {
    throw new Error("Approval must decide every candidate exactly once.");
  }
  const decisionIds = new Set();
  for (const decision of decisions) {
    const candidate = candidates.get(decision.id);
    if (!candidate)
      throw new Error(`Approval names unknown ID: ${decision.id}`);
    if (decisionIds.has(decision.id)) {
      throw new Error(`Approval repeats ID: ${decision.id}`);
    }
    if (decision.sha256 !== candidate.sha256) {
      throw new Error(`Approval hash mismatch for ${decision.id}`);
    }
    decisionIds.add(decision.id);
  }

  const approvedIds = new Set(approval.approved.map((item) => item.id));
  const choiceGroups = new Map();
  for (const candidate of catalog.candidates) {
    if (!candidate.choiceGroup) continue;
    const group = choiceGroups.get(candidate.choiceGroup) ?? [];
    if (approvedIds.has(candidate.id)) group.push(candidate.id);
    choiceGroups.set(candidate.choiceGroup, group);
  }
  for (const [group, ids] of choiceGroups) {
    if (ids.length !== 1) {
      throw new Error(`Choice group ${group} approved ${ids.length} files.`);
    }
  }

  for (const candidate of catalog.candidates) {
    if (!candidate.choiceGroup) continue;
    if (candidate.recommended !== approvedIds.has(candidate.id)) {
      throw new Error(
        `Catalog recommendation does not match approval for ${candidate.id}.`,
      );
    }
  }

  const approvedImpactCount = approval.approved.filter(
    (item) => candidates.get(item.id).sourceId === "kenney_impact_sounds_1_0",
  ).length;
  const approvedInterfaceCount = approval.approved.filter(
    (item) =>
      candidates.get(item.id).sourceId === "kenney_interface_sounds_1_0",
  ).length;
  if (approvedImpactCount > 4 || approvedInterfaceCount > 3) {
    throw new Error("Approval exceeds the accepted Kenney intake ceilings.");
  }

  return {
    approval,
    approvedCandidates: approval.approved.map((item) =>
      candidates.get(item.id),
    ),
    rejectedCandidates: approval.rejected.map((item) =>
      candidates.get(item.id),
    ),
  };
}

async function main() {
  const result = await validateM8NonSpeechApproval();
  process.stdout.write(
    `${JSON.stringify(
      {
        catalogVersion: result.approval.catalogVersion,
        approved: result.approvedCandidates.length,
        rejected: result.rejectedCandidates.length,
        state: "APPROVED_BY_USER",
      },
      null,
      2,
    )}\n`,
  );
}

if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  await main();
}
