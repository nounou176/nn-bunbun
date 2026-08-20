import {
  AUTHORING_FIXTURE_DISCLOSURE_V2,
  AUTHORING_INPUT_HASH_CANONICALIZATION,
  AUTHORING_REQUEST_FORMAT,
  AUTHORING_RESULT_FORMAT,
  type LessonAuthoringEnvelopeInputV2,
  type LessonAuthoringRequestV2,
  type LessonAuthoringResultV2,
} from "../src/schema/index.js";
import {
  AUTHORING_CONTRACT_VERSION_V2,
  AUTHORING_PACKET_VERSION_V2,
} from "../src/version.js";
import {
  validAuthoringRequest,
  validAuthoringResult,
} from "./authoring-fixtures.js";
import { sha256CanonicalJson } from "./authoring-tools.js";

const input = {
  ...validAuthoringRequest.input,
  contractVersion: AUTHORING_CONTRACT_VERSION_V2,
  practiceSlots: validAuthoringRequest.input.practiceSlots.map((slot) => ({
    ...slot,
    practiceTextJa: "犬を探してください。",
    acceptedResponsesJa: ["犬を探してください。"],
  })),
  coachingSlots: validAuthoringRequest.input.coachingSlots.map((slot) => ({
    ...slot,
    primitive: "ARRANGE" as const,
    maximumAttempts: 2,
    feedbackDisplayMs: {
      correct: 500,
      incorrect: 650,
      assisted: 650,
    },
  })),
} satisfies LessonAuthoringEnvelopeInputV2;

const inputSha256 = sha256CanonicalJson(input);

export const validAuthoringRequestV2 = {
  packetFormat: AUTHORING_REQUEST_FORMAT,
  packetVersion: AUTHORING_PACKET_VERSION_V2,
  requestId: "m7_v3_2_lesson_authoring_v2_001",
  requestContextId: "composed_help_find_dog_v2",
  attempt: 1,
  repair: null,
  mediaPolicy: "TEXT_ONLY",
  responseFormat: "STRICT_JSON_OBJECT",
  inputHashCanonicalization: AUTHORING_INPUT_HASH_CANONICALIZATION,
  inputSha256,
  promptPack: validAuthoringRequest.promptPack.map((module) => ({ ...module })),
  dataPolicy: {
    classification: "AUTHORED_FIXTURE",
    containsLearnerData: false,
    disclosure: AUTHORING_FIXTURE_DISCLOSURE_V2,
  },
  outputLimits: structuredClone(validAuthoringRequest.outputLimits),
  input,
} satisfies LessonAuthoringRequestV2;

export const validAuthoringResultV2 = {
  ...structuredClone(validAuthoringResult),
  packetFormat: AUTHORING_RESULT_FORMAT,
  packetVersion: AUTHORING_PACKET_VERSION_V2,
  requestId: validAuthoringRequestV2.requestId,
  inputSha256,
  promptPack: validAuthoringRequestV2.promptPack.map((module) => ({
    ...module,
  })),
} satisfies LessonAuthoringResultV2;
