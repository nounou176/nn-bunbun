import type { DatabaseSync } from "node:sqlite";

import type { AudioAsset } from "@bunbun/contracts";

import { speechCacheIdentity } from "./cache-key.js";
import { SpeechAudioError } from "./errors.js";

export type SpeechAssetStatus =
  "PENDING" | "RUNNING" | "REVIEW_REQUIRED" | "READY" | "REJECTED" | "FAILED";

interface SpeechAssetRow {
  cache_key: string;
  voice_profile_id: string;
  text_ja: string;
  canonical_input_json: string;
  status: SpeechAssetStatus;
  attempt_count: number;
  query_sha256: string | null;
  wav_sha256: string | null;
  query_relative_path: string | null;
  wav_relative_path: string | null;
  duration_ms: number | null;
  byte_length: number | null;
  failure_code: string | null;
  created_at: string;
  updated_at: string;
  generated_at: string | null;
  reviewed_at: string | null;
}

export interface SpeechReference {
  lessonId: string;
  revision: number;
  audioAssetId: string;
}

export interface SpeechAssetView {
  cacheKey: string;
  voiceProfileId: string;
  textJa: string;
  status: SpeechAssetStatus;
  attemptCount: number;
  querySha256?: string;
  wavSha256?: string;
  durationMs?: number;
  byteLength?: number;
  failureCode?: string;
  credit: "VOICEVOX Nemo";
  references: SpeechReference[];
  createdAt: string;
  updatedAt: string;
  generatedAt?: string;
  reviewedAt?: string;
}

export interface RunningSpeechAsset {
  cacheKey: string;
  voiceProfileId: string;
  textJa: string;
  canonicalInput: string;
  attempt: number;
  startedAt: string;
}

export interface SpeechAttemptSuccess {
  engineVersion: string;
  engineManifestUuid: string;
  speakerUuid: string;
  styleId: number;
  querySha256: string;
  wavSha256: string;
  queryRelativePath: string;
  wavRelativePath: string;
  durationMs: number;
  byteLength: number;
  elapsedMs: number;
}

export interface SpeechAttemptFailure {
  engineVersion?: string;
  engineManifestUuid?: string;
  speakerUuid?: string;
  styleId?: number;
  elapsedMs: number;
  failureCode: string;
}

export class SpeechRepository {
  constructor(
    private readonly database: DatabaseSync,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {
    const interrupted = this.database
      .prepare(
        `SELECT cache_key, attempt_count, updated_at
         FROM audio_speech_assets
         WHERE status = 'RUNNING'`,
      )
      .all() as Array<{
      cache_key: string;
      attempt_count: number;
      updated_at: string;
    }>;
    if (interrupted.length > 0) {
      const completedAt = this.now();
      this.transaction(() => {
        for (const row of interrupted) {
          this.database
            .prepare(
              `INSERT OR IGNORE INTO audio_speech_attempts (
                 cache_key, attempt, status, elapsed_ms, failure_code,
                 started_at, completed_at
               ) VALUES (?, ?, 'FAILED', 0, 'AUTHORING_INTERRUPTED', ?, ?)`,
            )
            .run(row.cache_key, row.attempt_count, row.updated_at, completedAt);
        }
        this.database
          .prepare(
            `UPDATE audio_speech_assets
             SET status = 'FAILED', failure_code = 'AUTHORING_INTERRUPTED',
                 updated_at = ?
             WHERE status = 'RUNNING'`,
          )
          .run(completedAt);
      });
    }
  }

  enqueue(
    lessonId: string,
    revision: number,
    audioAssets: readonly AudioAsset[],
  ): SpeechAssetView[] {
    const createdAt = this.now();
    this.transaction(() => {
      for (const audioAsset of audioAssets) {
        const identity = speechCacheIdentity(audioAsset);
        if (audioAsset.cacheKey !== identity.cacheKey) {
          throw new SpeechAudioError(
            "SPEECH_CACHE_KEY_MISMATCH",
            `Audio '${audioAsset.audioAssetId}' does not use its canonical speech cache key.`,
          );
        }
        const existing = this.database
          .prepare(
            `SELECT canonical_input_json FROM audio_speech_assets
             WHERE cache_key = ?`,
          )
          .get(identity.cacheKey) as
          { canonical_input_json: string } | undefined;
        if (
          existing !== undefined &&
          existing.canonical_input_json !== identity.canonicalInput
        ) {
          throw new SpeechAudioError(
            "SPEECH_CACHE_KEY_CONFLICT",
            "Speech cache key is already associated with different inputs.",
            409,
          );
        }
        if (existing === undefined) {
          this.database
            .prepare(
              `INSERT INTO audio_speech_assets (
                 cache_key, voice_profile_id, text_ja, canonical_input_json,
                 status, attempt_count, created_at, updated_at
               ) VALUES (?, ?, ?, ?, 'PENDING', 0, ?, ?)`,
            )
            .run(
              identity.cacheKey,
              audioAsset.voiceProfileId,
              audioAsset.textJa,
              identity.canonicalInput,
              createdAt,
              createdAt,
            );
        }
        this.database
          .prepare(
            `INSERT OR IGNORE INTO audio_speech_references (
               cache_key, origin_lesson_id, origin_revision, audio_asset_id,
               created_at
             ) VALUES (?, ?, ?, ?, ?)`,
          )
          .run(
            identity.cacheKey,
            lessonId,
            revision,
            audioAsset.audioAssetId,
            createdAt,
          );
      }
    });
    return audioAssets.map((asset) => this.read(asset.cacheKey));
  }

  list(): SpeechAssetView[] {
    const rows = this.database
      .prepare(
        `SELECT * FROM audio_speech_assets
         ORDER BY updated_at DESC, cache_key
         LIMIT 200`,
      )
      .all() as unknown as SpeechAssetRow[];
    return rows.map((row) => this.view(row));
  }

  read(cacheKey: string): SpeechAssetView {
    return this.view(this.row(cacheKey));
  }

  nextPending(): SpeechAssetView | undefined {
    const row = this.database
      .prepare(
        `SELECT * FROM audio_speech_assets
         WHERE status = 'PENDING'
         ORDER BY created_at, cache_key
         LIMIT 1`,
      )
      .get() as unknown as SpeechAssetRow | undefined;
    return row === undefined ? undefined : this.view(row);
  }

  start(cacheKey: string): RunningSpeechAsset {
    const row = this.row(cacheKey);
    if (row.status !== "PENDING") {
      throw new SpeechAudioError(
        "SPEECH_JOB_NOT_PENDING",
        "Only a pending speech job can start.",
        409,
      );
    }
    const startedAt = this.now();
    const attempt = row.attempt_count + 1;
    this.database
      .prepare(
        `UPDATE audio_speech_assets
         SET status = 'RUNNING', attempt_count = ?, failure_code = NULL,
             updated_at = ?
         WHERE cache_key = ?`,
      )
      .run(attempt, startedAt, cacheKey);
    return {
      cacheKey,
      voiceProfileId: row.voice_profile_id,
      textJa: row.text_ja,
      canonicalInput: row.canonical_input_json,
      attempt,
      startedAt,
    };
  }

  succeed(running: RunningSpeechAsset, result: SpeechAttemptSuccess): void {
    const completedAt = this.now();
    this.transaction(() => {
      this.insertAttempt(running, "SUCCEEDED", result, completedAt);
      this.database
        .prepare(
          `UPDATE audio_speech_assets
           SET status = 'REVIEW_REQUIRED', query_sha256 = ?, wav_sha256 = ?,
               query_relative_path = ?, wav_relative_path = ?, duration_ms = ?,
               byte_length = ?, failure_code = NULL, updated_at = ?,
               generated_at = ?, reviewed_at = NULL
           WHERE cache_key = ? AND status = 'RUNNING'`,
        )
        .run(
          result.querySha256,
          result.wavSha256,
          result.queryRelativePath,
          result.wavRelativePath,
          result.durationMs,
          result.byteLength,
          completedAt,
          completedAt,
          running.cacheKey,
        );
    });
  }

  fail(running: RunningSpeechAsset, failure: SpeechAttemptFailure): void {
    const completedAt = this.now();
    this.transaction(() => {
      this.insertAttempt(running, "FAILED", failure, completedAt);
      this.database
        .prepare(
          `UPDATE audio_speech_assets
           SET status = 'FAILED', failure_code = ?, updated_at = ?
           WHERE cache_key = ? AND status = 'RUNNING'`,
        )
        .run(failure.failureCode, completedAt, running.cacheKey);
    });
  }

  retry(cacheKey: string): SpeechAssetView {
    const row = this.row(cacheKey);
    if (row.status !== "FAILED") {
      throw new SpeechAudioError(
        "SPEECH_JOB_NOT_RETRYABLE",
        "Only a failed speech job can be retried.",
        409,
      );
    }
    const updatedAt = this.now();
    this.database
      .prepare(
        `UPDATE audio_speech_assets
         SET status = 'PENDING', failure_code = NULL, updated_at = ?
         WHERE cache_key = ?`,
      )
      .run(updatedAt, cacheKey);
    return this.read(cacheKey);
  }

  approve(
    cacheKey: string,
    queryRelativePath: string,
    wavRelativePath: string,
  ): SpeechAssetView {
    const row = this.row(cacheKey);
    if (row.status !== "REVIEW_REQUIRED") {
      throw new SpeechAudioError(
        "SPEECH_REVIEW_NOT_AVAILABLE",
        "Only generated speech awaiting review can be approved.",
        409,
      );
    }
    const reviewedAt = this.now();
    this.database
      .prepare(
        `UPDATE audio_speech_assets
         SET status = 'READY', query_relative_path = ?, wav_relative_path = ?,
             updated_at = ?, reviewed_at = ?
         WHERE cache_key = ?`,
      )
      .run(
        queryRelativePath,
        wavRelativePath,
        reviewedAt,
        reviewedAt,
        cacheKey,
      );
    return this.read(cacheKey);
  }

  reject(cacheKey: string): SpeechAssetView {
    const row = this.row(cacheKey);
    if (row.status !== "REVIEW_REQUIRED") {
      throw new SpeechAudioError(
        "SPEECH_REVIEW_NOT_AVAILABLE",
        "Only generated speech awaiting review can be rejected.",
        409,
      );
    }
    const reviewedAt = this.now();
    this.database
      .prepare(
        `UPDATE audio_speech_assets
         SET status = 'REJECTED', updated_at = ?, reviewed_at = ?
         WHERE cache_key = ?`,
      )
      .run(reviewedAt, reviewedAt, cacheKey);
    return this.read(cacheKey);
  }

  artifact(cacheKey: string, allowReview: boolean): SpeechAssetRow {
    const row = this.row(cacheKey);
    const allowed =
      row.status === "READY" ||
      (allowReview && row.status === "REVIEW_REQUIRED");
    if (!allowed || row.wav_relative_path === null || row.wav_sha256 === null) {
      throw new SpeechAudioError(
        "SPEECH_ASSET_NOT_READY",
        "Speech asset is not available for this playback boundary.",
        404,
      );
    }
    return row;
  }

  purge(): void {
    this.database.exec("DELETE FROM audio_speech_assets;");
  }

  private insertAttempt(
    running: RunningSpeechAsset,
    status: "SUCCEEDED" | "FAILED",
    result: SpeechAttemptSuccess | SpeechAttemptFailure,
    completedAt: string,
  ): void {
    const success =
      status === "SUCCEEDED" ? (result as SpeechAttemptSuccess) : undefined;
    const failure =
      status === "FAILED" ? (result as SpeechAttemptFailure) : undefined;
    this.database
      .prepare(
        `INSERT INTO audio_speech_attempts (
           cache_key, attempt, status, engine_version, engine_manifest_uuid,
           speaker_uuid, style_id, query_sha256, wav_sha256, duration_ms,
           elapsed_ms, failure_code, started_at, completed_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        running.cacheKey,
        running.attempt,
        status,
        result.engineVersion ?? null,
        result.engineManifestUuid ?? null,
        result.speakerUuid ?? null,
        result.styleId ?? null,
        success?.querySha256 ?? null,
        success?.wavSha256 ?? null,
        success?.durationMs ?? null,
        result.elapsedMs,
        failure?.failureCode ?? null,
        running.startedAt,
        completedAt,
      );
  }

  private row(cacheKey: string): SpeechAssetRow {
    const row = this.database
      .prepare("SELECT * FROM audio_speech_assets WHERE cache_key = ?")
      .get(cacheKey) as unknown as SpeechAssetRow | undefined;
    if (row === undefined) {
      throw new SpeechAudioError(
        "SPEECH_ASSET_NOT_FOUND",
        "Speech asset was not found.",
        404,
      );
    }
    return row;
  }

  private view(row: SpeechAssetRow): SpeechAssetView {
    const references = this.database
      .prepare(
        `SELECT origin_lesson_id, origin_revision, audio_asset_id
         FROM audio_speech_references
         WHERE cache_key = ?
         ORDER BY origin_lesson_id, origin_revision, audio_asset_id`,
      )
      .all(row.cache_key) as Array<{
      origin_lesson_id: string;
      origin_revision: number;
      audio_asset_id: string;
    }>;
    return {
      cacheKey: row.cache_key,
      voiceProfileId: row.voice_profile_id,
      textJa: row.text_ja,
      status: row.status,
      attemptCount: row.attempt_count,
      ...(row.query_sha256 === null ? {} : { querySha256: row.query_sha256 }),
      ...(row.wav_sha256 === null ? {} : { wavSha256: row.wav_sha256 }),
      ...(row.duration_ms === null ? {} : { durationMs: row.duration_ms }),
      ...(row.byte_length === null ? {} : { byteLength: row.byte_length }),
      ...(row.failure_code === null ? {} : { failureCode: row.failure_code }),
      credit: "VOICEVOX Nemo",
      references: references.map((reference) => ({
        lessonId: reference.origin_lesson_id,
        revision: reference.origin_revision,
        audioAssetId: reference.audio_asset_id,
      })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      ...(row.generated_at === null ? {} : { generatedAt: row.generated_at }),
      ...(row.reviewed_at === null ? {} : { reviewedAt: row.reviewed_at }),
    };
  }

  private transaction(action: () => void): void {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      action();
      this.database.exec("COMMIT");
    } catch (error) {
      try {
        this.database.exec("ROLLBACK");
      } catch {
        /* no active transaction */
      }
      throw error;
    }
  }
}
