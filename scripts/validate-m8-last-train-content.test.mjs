import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  CONTENT_PACKET_PATH,
  loadAndValidateM8LastTrainContentPacket,
  validateM8LastTrainContentPacket,
} from "./validate-m8-last-train-content.mjs";

async function packetFixture() {
  return JSON.parse(await readFile(CONTENT_PACKET_PATH, "utf8"));
}

test("accepts the exact proposed M8 last-train content packet", async () => {
  const result = await loadAndValidateM8LastTrainContentPacket();
  assert.equal(result.status, "PROPOSED_FOR_USER_APPROVAL");
  assert.equal(result.targets, 6);
  assert.equal(result.utterances, 4);
  assert.equal(result.steps, 9);
  assert.match(result.packetSha256, /^[a-f0-9]{64}$/u);
  assert.equal(result.packet.authority.speechGenerationAuthorized, false);
  assert.equal(result.packet.authority.runtimeActivationAuthorized, false);
});

test("rejects authority that bypasses either approval gate", async () => {
  const packet = await packetFixture();
  packet.authority.speechGenerationAuthorized = true;
  assert.throws(
    () => validateM8LastTrainContentPacket(packet),
    /Expected values to be strictly deep-equal/u,
  );
});

test("rejects new paid or third-party runtime boundaries", async () => {
  const packet = await packetFixture();
  packet.costAndData.runtimeProviderCalls.push("example_provider");
  assert.throws(
    () => validateM8LastTrainContentPacket(packet),
    /Expected values to be strictly deep-equal/u,
  );
});

test("rejects primitive sequence drift", async () => {
  const packet = await packetFixture();
  packet.steps[5].primitive = "CHOOSE";
  assert.throws(
    () => validateM8LastTrainContentPacket(packet),
    /primitive sequence changed/u,
  );
});

test("rejects an unsupported or premature scaffold", async () => {
  const packet = await packetFixture();
  packet.steps[4].scaffolds[1].kind = "HIGHLIGHT_LOCATION";
  assert.throws(
    () => validateM8LastTrainContentPacket(packet),
    /unsupported scaffold/u,
  );
});

test("rejects voice-profile drift", async () => {
  const packet = await packetFixture();
  packet.utterances[0].voiceProfileId = "voice_tanaka_01";
  assert.throws(
    () => validateM8LastTrainContentPacket(packet),
    /changed its approved voice profile/u,
  );
});

test("rejects an unbounded attempt path", async () => {
  const packet = await packetFixture();
  packet.steps[2].maximumAttempts = 5;
  assert.throws(
    () => validateM8LastTrainContentPacket(packet),
    /unbounded attempt policy/u,
  );
});

test("rejects a broken PICK_UP to GIVE carry path", async () => {
  const packet = await packetFixture();
  packet.steps[6].answerTruth.acceptedObjectIds = ["mistaken_umbrella"];
  assert.throws(
    () => validateM8LastTrainContentPacket(packet),
    /PICK_UP must guarantee wallet_clue/u,
  );
});

test("rejects requested-target evidence gaps", async () => {
  const packet = await packetFixture();
  packet.steps[3].targetBindings = packet.steps[3].targetBindings.filter(
    (binding) => binding.targetId !== "target_search",
  );
  assert.throws(
    () => validateM8LastTrainContentPacket(packet),
    /minimum context count|actively_produced/u,
  );
});
