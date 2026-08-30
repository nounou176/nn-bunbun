import {
  type AdaptiveLearningSnapshot,
  type AdaptivePreferences,
  type UpdateAdaptivePreferencesRequest,
  type ValidationResult,
  validateAdaptiveApiErrorStructure,
  validateAdaptiveLearningSnapshotStructure,
  validateAdaptivePreferencesStructure,
} from "@bunbun/contracts";

export class AdaptiveClientError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly retryable: boolean,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "AdaptiveClientError";
  }
}

export const adaptiveClient = {
  getSnapshot: (): Promise<AdaptiveLearningSnapshot> =>
    request(
      "/api/v1/adaptation",
      { method: "GET" },
      validateAdaptiveLearningSnapshotStructure,
    ),
  getPreferences: (): Promise<AdaptivePreferences> =>
    request(
      "/api/v1/adaptation/preferences",
      { method: "GET" },
      validateAdaptivePreferencesStructure,
    ),
  updatePreferences: (
    body: UpdateAdaptivePreferencesRequest,
  ): Promise<AdaptivePreferences> =>
    request(
      "/api/v1/adaptation/preferences",
      { method: "PUT", body },
      validateAdaptivePreferencesStructure,
    ),
};

async function request<Value>(
  path: string,
  options: { method: string; body?: unknown },
  validate: (input: unknown) => ValidationResult<Value>,
): Promise<Value> {
  let response: Response;
  try {
    response = await fetch(
      path,
      options.body === undefined
        ? { method: options.method }
        : {
            method: options.method,
            headers: { "content-type": "application/json" },
            body: JSON.stringify(options.body),
          },
    );
  } catch (error) {
    throw new AdaptiveClientError(
      "ADAPTATION_UNAVAILABLE",
      "Không kết nối được bộ đề xuất học tập local.",
      true,
      { cause: error },
    );
  }

  const input = await responseJson(response);
  if (!response.ok) {
    const errorResult = validateAdaptiveApiErrorStructure(input);
    if (!errorResult.ok) {
      throw new AdaptiveClientError(
        "ADAPTATION_RESPONSE_INVALID",
        "Server trả về lỗi đề xuất không đúng contract.",
        false,
      );
    }
    throw new AdaptiveClientError(
      errorResult.value.code,
      errorResult.value.message,
      response.status >= 500,
    );
  }
  const result = validate(input);
  if (!result.ok) {
    const first = result.errors[0];
    throw new AdaptiveClientError(
      "ADAPTATION_RESPONSE_INVALID",
      first === undefined
        ? "Server trả về dữ liệu đề xuất không hợp lệ."
        : `${first.code} at ${first.path}: ${first.message}`,
      false,
    );
  }
  return result.value;
}

async function responseJson(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch (error) {
    throw new AdaptiveClientError(
      "ADAPTATION_RESPONSE_INVALID",
      "Server trả về phản hồi đề xuất không phải JSON.",
      false,
      { cause: error },
    );
  }
}
