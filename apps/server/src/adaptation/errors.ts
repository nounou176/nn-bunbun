import type { AdaptiveApiError } from "@bunbun/contracts";

export class AdaptiveRepositoryError extends Error {
  constructor(
    readonly code: AdaptiveApiError["code"],
    message: string,
    readonly statusCode = 500,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "AdaptiveRepositoryError";
  }
}
