import type { DatabaseSync } from "node:sqlite";

import {
  ADAPTIVE_LEARNING_SCHEMA_VERSION,
  type AdaptiveLearningSnapshot,
  type AdaptivePreferences,
  type LearningTargetRegistry,
  type UpdateAdaptivePreferencesRequest,
  validateUpdateAdaptivePreferencesRequestStructure,
} from "@bunbun/contracts";
import registryFixture from "@bunbun/contracts/fixtures/learning-target-registry" with { type: "json" };

import {
  AdaptiveDerivationError,
  type AdaptiveLessonPackageProjection,
  type AdaptiveReactionProjection,
  type PublishedLessonProjection,
  deriveAdaptiveLearningSnapshot,
} from "./derive-adaptive-snapshot.js";
import { AdaptiveRepositoryError } from "./errors.js";

const LOCAL_PROFILE_ID = "local_default";
const DEFAULT_UPDATED_AT = "1970-01-01T00:00:00.000Z";
const MAX_LESSON_PACKAGES = 100;
const MAX_REACTIONS = 100_000;
const MAX_RESPONSE_BYTES = 128 * 1024;

export interface AdaptivePublishedLessonSource {
  listAdaptivePublishedLessons(limit?: number): PublishedLessonProjection[];
}

export class AdaptiveRepository {
  constructor(
    private readonly database: DatabaseSync,
    private readonly publishedLessons: AdaptivePublishedLessonSource,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly registry: LearningTargetRegistry = registryFixture as LearningTargetRegistry,
  ) {}

  getPreferences(): AdaptivePreferences {
    try {
      const existing = this.readPreferences();
      if (existing !== undefined) return existing;
      this.database
        .prepare(
          `INSERT INTO adaptive_preferences (
             profile_id, adaptive_mode, support_preference, updated_at
           ) VALUES (?, 'SUGGEST', 'ASK_EACH_TIME', ?)`,
        )
        .run(LOCAL_PROFILE_ID, DEFAULT_UPDATED_AT);
      return defaultPreferences();
    } catch (error) {
      throw adaptiveUnavailable("Could not read adaptive preferences.", error);
    }
  }

  updatePreferences(
    input: UpdateAdaptivePreferencesRequest,
  ): AdaptivePreferences {
    const validation = validateUpdateAdaptivePreferencesRequestStructure(input);
    if (!validation.ok) {
      const first = validation.errors[0];
      throw new AdaptiveRepositoryError(
        "INVALID_ADAPTIVE_PREFERENCES",
        first === undefined
          ? "Adaptive preferences are invalid."
          : `${first.code} at ${first.path}: ${first.message}`,
        400,
      );
    }
    try {
      const existing = this.getPreferences();
      if (
        existing.adaptiveMode === validation.value.adaptiveMode &&
        existing.supportPreference === validation.value.supportPreference
      ) {
        return existing;
      }
      const updatedAt = this.now();
      this.database
        .prepare(
          `UPDATE adaptive_preferences
           SET adaptive_mode = ?, support_preference = ?, updated_at = ?
           WHERE profile_id = ?`,
        )
        .run(
          validation.value.adaptiveMode,
          validation.value.supportPreference,
          updatedAt,
          LOCAL_PROFILE_ID,
        );
      return {
        contractType: "ADAPTIVE_PREFERENCES",
        schemaVersion: ADAPTIVE_LEARNING_SCHEMA_VERSION,
        adaptiveMode: validation.value.adaptiveMode,
        supportPreference: validation.value.supportPreference,
        updatedAt,
      };
    } catch (error) {
      if (error instanceof AdaptiveRepositoryError) throw error;
      throw adaptiveUnavailable(
        "Could not update adaptive preferences.",
        error,
      );
    }
  }

  snapshot(): AdaptiveLearningSnapshot {
    try {
      const reactions = this.readReactionProjections();
      const lessonPackages = this.readEvidenceLessonPackages(reactions);
      const publishedLessons =
        this.publishedLessons.listAdaptivePublishedLessons(MAX_LESSON_PACKAGES);
      const snapshot = deriveAdaptiveLearningSnapshot({
        registry: this.registry,
        preferences: this.getPreferences(),
        lessonPackages,
        publishedLessons,
        reactions,
      });
      if (
        Buffer.byteLength(JSON.stringify(snapshot), "utf8") > MAX_RESPONSE_BYTES
      ) {
        throw new AdaptiveRepositoryError(
          "ADAPTATION_RESPONSE_TOO_LARGE",
          "The bounded adaptive response exceeds 128 KiB.",
          500,
        );
      }
      return snapshot;
    } catch (error) {
      if (error instanceof AdaptiveRepositoryError) throw error;
      if (
        error instanceof AdaptiveDerivationError &&
        error.code === "REGISTRY_INVALID"
      ) {
        throw new AdaptiveRepositoryError(
          "REGISTRY_INVALID",
          "The reviewed learning-target registry is incompatible with local data.",
          500,
          { cause: error },
        );
      }
      throw adaptiveUnavailable(
        "Adaptive suggestions are temporarily unavailable; ordinary lessons remain usable.",
        error,
      );
    }
  }

  private readPreferences(): AdaptivePreferences | undefined {
    const row = this.database
      .prepare(
        `SELECT adaptive_mode, support_preference, updated_at
         FROM adaptive_preferences
         WHERE profile_id = ?`,
      )
      .get(LOCAL_PROFILE_ID) as
      | {
          adaptive_mode: AdaptivePreferences["adaptiveMode"];
          support_preference: AdaptivePreferences["supportPreference"];
          updated_at: string;
        }
      | undefined;
    return row === undefined
      ? undefined
      : {
          contractType: "ADAPTIVE_PREFERENCES",
          schemaVersion: ADAPTIVE_LEARNING_SCHEMA_VERSION,
          adaptiveMode: row.adaptive_mode,
          supportPreference: row.support_preference,
          updatedAt: row.updated_at,
        };
  }

  private readReactionProjections(): AdaptiveReactionProjection[] {
    const rows = this.database
      .prepare(
        `SELECT event_sequence, session_id, lesson_id, revision, step_id,
                context_id, target_id, attempt, correct, assisted, occurred_at
         FROM session_events
         WHERE kind = 'REACTION'
         ORDER BY event_sequence
         LIMIT ?`,
      )
      .all(MAX_REACTIONS + 1) as Array<{
      event_sequence: number;
      session_id: string;
      lesson_id: string;
      revision: number;
      step_id: string;
      context_id: string;
      target_id: string | null;
      attempt: number;
      correct: number | null;
      assisted: number;
      occurred_at: string;
    }>;
    if (rows.length > MAX_REACTIONS) {
      throw new AdaptiveRepositoryError(
        "ADAPTATION_UNAVAILABLE",
        `Local adaptive evidence exceeds the ${MAX_REACTIONS}-reaction bound.`,
        503,
      );
    }
    return rows.map((row) => {
      if (
        row.target_id === null ||
        (row.correct !== 0 && row.correct !== 1) ||
        (row.assisted !== 0 && row.assisted !== 1)
      ) {
        throw new AdaptiveRepositoryError(
          "ADAPTATION_UNAVAILABLE",
          `Stored reaction sequence ${row.event_sequence} is incomplete.`,
          500,
        );
      }
      return {
        eventSequence: row.event_sequence,
        sessionId: row.session_id,
        lessonId: row.lesson_id,
        revision: row.revision,
        stepId: row.step_id,
        contextId: row.context_id,
        targetId: row.target_id,
        attempt: row.attempt,
        correct: row.correct === 1,
        assisted: row.assisted === 1,
        occurredAt: row.occurred_at,
      };
    });
  }

  private readEvidenceLessonPackages(
    reactions: AdaptiveReactionProjection[],
  ): AdaptiveLessonPackageProjection[] {
    const identities = [
      ...new Set(
        reactions.map(
          (reaction) => `${reaction.lessonId}\u0000${reaction.revision}`,
        ),
      ),
    ].sort();
    if (identities.length > MAX_LESSON_PACKAGES) {
      throw new AdaptiveRepositoryError(
        "ADAPTATION_UNAVAILABLE",
        `Local adaptive evidence spans more than ${MAX_LESSON_PACKAGES} lesson revisions.`,
        503,
      );
    }
    return identities.map((identity) => {
      const separator = identity.indexOf("\u0000");
      const lessonId = identity.slice(0, separator);
      const revisionText = identity.slice(separator + 1);
      const revision = Number(revisionText);
      const row = this.database
        .prepare(
          `SELECT manifest_json, catalog_json
           FROM lesson_revisions
           WHERE lesson_id = ? AND revision = ?`,
        )
        .get(lessonId, revision) as
        { manifest_json: string; catalog_json: string } | undefined;
      if (row === undefined) {
        throw new AdaptiveRepositoryError(
          "ADAPTATION_UNAVAILABLE",
          `Evidence package '${lessonId}' revision ${revision} is missing.`,
          500,
        );
      }
      return {
        manifest: parseJson(row.manifest_json),
        catalog: parseJson(row.catalog_json),
      } as AdaptiveLessonPackageProjection;
    });
  }
}

function defaultPreferences(): AdaptivePreferences {
  return {
    contractType: "ADAPTIVE_PREFERENCES",
    schemaVersion: ADAPTIVE_LEARNING_SCHEMA_VERSION,
    adaptiveMode: "SUGGEST",
    supportPreference: "ASK_EACH_TIME",
    updatedAt: DEFAULT_UPDATED_AT,
  };
}

function adaptiveUnavailable(
  message: string,
  cause: unknown,
): AdaptiveRepositoryError {
  return new AdaptiveRepositoryError("ADAPTATION_UNAVAILABLE", message, 500, {
    cause,
  });
}

function parseJson(input: string): unknown {
  return JSON.parse(input) as unknown;
}
