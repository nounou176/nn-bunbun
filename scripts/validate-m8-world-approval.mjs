import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { format } from "prettier";

import {
  buildSelectionPacket,
  loadAndValidateWorldReviewCatalog,
} from "./serve-m8-world-review.mjs";

const REPOSITORY_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const APPROVAL_PATH = path.join(
  REPOSITORY_ROOT,
  "docs/world-sources/M8_WORLD_APPROVAL_2026-08-27.json",
);
const APPROVAL_PREFIX = "DUYỆT M8 WORLD GATE 2 — PACKET ";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function decisionIds(assignments) {
  return Object.fromEntries(
    Object.entries(assignments).map(([groupId, decisions]) => [
      groupId,
      decisions.map((decision) => decision.assetId),
    ]),
  );
}

function assertProposalMatchesExpected(proposal, expected) {
  assert.equal(proposal.packetFormat, "bunbun_m8_world_selection_review");
  assert.equal(proposal.packetVersion, "1.0.0");
  assert.equal(proposal.status, "PROPOSED_FOR_USER_APPROVAL");
  assert.equal(proposal.authority?.decisionId, "D-044");
  assert.equal(proposal.authority?.runtimeSelectionAuthorized, false);
  assert.deepEqual(proposal.catalog, expected.catalog);
  assert.deepEqual(proposal.assignments, expected.assignments);
  assert.deepEqual(proposal.approved, expected.approved);
  assert.deepEqual(proposal.rejected, expected.rejected);
  assert.deepEqual(
    proposal.reviewedCandidateIds,
    expected.reviewedCandidateIds,
  );
}

export function buildApprovalDocument(
  catalog,
  catalogSha256,
  proposal,
  proposalSha256,
) {
  const expected = buildSelectionPacket(
    catalog,
    catalogSha256,
    decisionIds(proposal.assignments),
    proposal.reviewedCandidateIds,
    proposal.reviewedAt,
  );
  assertProposalMatchesExpected(proposal, expected);

  return {
    packetFormat: "bunbun_m8_world_selection_approval",
    packetVersion: "1.0.0",
    status: "APPROVED_BY_USER",
    approvedOn: "2026-08-27",
    authority: {
      decisionId: "D-045",
      priorDecisionId: "D-044",
      approvalPhrase: `${APPROVAL_PREFIX}${proposalSha256}`,
      runtimeSelectionAuthorized: true,
    },
    proposal: {
      packetSha256: proposalSha256,
      reviewedAt: proposal.reviewedAt,
    },
    catalog: proposal.catalog,
    assignments: proposal.assignments,
    approved: proposal.approved,
    rejected: proposal.rejected,
    reviewedCandidateIds: proposal.reviewedCandidateIds,
  };
}

export async function recordM8WorldApproval(
  proposalPath,
  expectedProposalSha256,
  outputPath = APPROVAL_PATH,
) {
  if (!/^[a-f0-9]{64}$/u.test(expectedProposalSha256)) {
    throw new Error(
      "Expected proposal SHA-256 must be 64 lowercase hex characters.",
    );
  }
  const proposalBytes = await readFile(proposalPath);
  const proposalSha256 = sha256(proposalBytes);
  if (proposalSha256 !== expectedProposalSha256) {
    throw new Error(
      `Proposal SHA-256 mismatch: expected ${expectedProposalSha256}, received ${proposalSha256}.`,
    );
  }
  const proposal = JSON.parse(proposalBytes.toString("utf8"));
  const validated = await loadAndValidateWorldReviewCatalog();
  const approval = buildApprovalDocument(
    validated.catalog,
    validated.catalogSha256,
    proposal,
    proposalSha256,
  );
  const output = await format(JSON.stringify(approval), { parser: "json" });
  await writeFile(outputPath, output, { flag: "wx" }).catch(async (error) => {
    if (error.code !== "EEXIST") throw error;
    const existing = await readFile(outputPath, "utf8");
    if (existing !== output) {
      throw new Error(
        `Approval artifact already exists with different bytes: ${outputPath}`,
      );
    }
  });
  return { approval, approvalSha256: sha256(Buffer.from(output)), outputPath };
}

export async function loadAndValidateM8WorldApproval(
  approvalPath = APPROVAL_PATH,
) {
  const approvalBytes = await readFile(approvalPath);
  const approval = JSON.parse(approvalBytes.toString("utf8"));
  if (
    approval.packetFormat !== "bunbun_m8_world_selection_approval" ||
    approval.packetVersion !== "1.0.0" ||
    approval.status !== "APPROVED_BY_USER" ||
    approval.authority?.decisionId !== "D-045" ||
    approval.authority?.priorDecisionId !== "D-044" ||
    approval.authority?.runtimeSelectionAuthorized !== true ||
    approval.authority?.approvalPhrase !==
      `${APPROVAL_PREFIX}${approval.proposal?.packetSha256}`
  ) {
    throw new Error("M8 world approval authority or version is invalid.");
  }
  const validated = await loadAndValidateWorldReviewCatalog();
  const proposalShape = {
    packetFormat: "bunbun_m8_world_selection_review",
    packetVersion: "1.0.0",
    status: "PROPOSED_FOR_USER_APPROVAL",
    reviewedAt: approval.proposal.reviewedAt,
    catalog: approval.catalog,
    authority: {
      decisionId: "D-044",
      runtimeSelectionAuthorized: false,
      requiredNextAction: "USER_APPROVE_EXACT_ASSET_IDS_AND_SHA256",
    },
    assignments: approval.assignments,
    approved: approval.approved,
    rejected: approval.rejected,
    reviewedCandidateIds: approval.reviewedCandidateIds,
  };
  const expected = buildSelectionPacket(
    validated.catalog,
    validated.catalogSha256,
    decisionIds(approval.assignments),
    approval.reviewedCandidateIds,
    approval.proposal.reviewedAt,
  );
  assertProposalMatchesExpected(proposalShape, expected);
  if (approval.approved.length !== 18 || approval.rejected.length !== 37) {
    throw new Error(
      "D-045 must approve exactly 18 and reject exactly 37 candidates.",
    );
  }
  return {
    approval,
    approvalSha256: sha256(approvalBytes),
    approvedCandidates: approval.approved.map((decision) =>
      validated.catalog.candidates.find(
        (candidate) => candidate.assetId === decision.assetId,
      ),
    ),
  };
}

async function main() {
  const [command = "check", proposalPath, expectedHash] = process.argv.slice(2);
  const result =
    command === "record"
      ? await recordM8WorldApproval(proposalPath, expectedHash)
      : command === "check"
        ? await loadAndValidateM8WorldApproval()
        : (() => {
            throw new Error(
              "Usage: validate-m8-world-approval.mjs [check|record <proposal> <sha256>]",
            );
          })();
  process.stdout.write(
    `${JSON.stringify(
      {
        status: result.approval.status,
        approvalPath: result.outputPath ?? APPROVAL_PATH,
        approvalSha256: result.approvalSha256,
        approved: result.approval.approved.length,
        rejected: result.approval.rejected.length,
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
