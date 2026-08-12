import type {
  AbandonSessionResult,
  LocalPreferences,
  ProgressSummaryResult,
  ResumableSessionResult,
  SessionCommitRequest,
  SessionCommitResult,
  SessionCreateRequest,
  StorageSummary,
  UpdatePreferencesRequest,
} from "@bunbun/contracts";

export interface ResumableQuery {
  lessonId: string;
  revision: number;
  packageFingerprint: string;
}

export interface EvidenceStore {
  createSession(request: SessionCreateRequest): Promise<SessionCommitResult>;
  commitSession(
    sessionId: string,
    request: SessionCommitRequest,
  ): Promise<SessionCommitResult>;
  findResumableSession(query: ResumableQuery): Promise<ResumableSessionResult>;
  abandonSession(
    sessionId: string,
    expectedSequence: number,
  ): Promise<AbandonSessionResult>;
  getProgress(
    lessonId: string,
    revision: number,
  ): Promise<ProgressSummaryResult>;
  getPreferences(): Promise<LocalPreferences>;
  updatePreferences(
    request: UpdatePreferencesRequest,
  ): Promise<LocalPreferences>;
  getStorageSummary(): Promise<StorageSummary>;
  resetLocalData(): Promise<void>;
}
