export class PersistenceError extends Error {
  constructor(
    readonly code: PersistenceErrorCode,
    message: string,
    readonly statusCode = 400,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

export type PersistenceErrorCode =
  | "PERSISTENCE_DATABASE_INCOMPATIBLE"
  | "PERSISTENCE_MIGRATION_FAILED"
  | "PERSISTENCE_PACKAGE_INVALID"
  | "PERSISTENCE_PACKAGE_CONFLICT"
  | "PERSISTENCE_SESSION_CONFLICT"
  | "PERSISTENCE_SESSION_NOT_FOUND"
  | "PERSISTENCE_SESSION_INACTIVE"
  | "PERSISTENCE_STALE_CHECKPOINT"
  | "PERSISTENCE_COMMIT_CONFLICT"
  | "PERSISTENCE_EVENT_INVALID"
  | "PERSISTENCE_CHECKPOINT_INVALID";
