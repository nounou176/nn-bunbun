import type {
  LessonAuthoringRequestV2,
  ValidatedLessonPackage,
} from "@bunbun/contracts";

export type CompilationStatus =
  | "AWAITING_AUTHORING"
  | "REPAIR_REQUIRED"
  | "READY_FOR_REVIEW"
  | "PUBLISHED"
  | "FAILED";

export interface CompilationView {
  compilationId: string;
  status: CompilationStatus;
  attempt: 1 | 2;
  targetKeys: string[];
  request: LessonAuthoringRequestV2;
  diagnostics: Array<{
    source: string;
    code: string;
    path: string;
    message: string;
  }>;
  review?: {
    title: { ja: string; support?: string };
    objective: { ja: string; support?: string };
    targetLabels: string[];
    stepCount: number;
    promptModules: Array<{ id: string; version: string }>;
  };
  lesson?: { lessonId: string; revision: number };
  createdAt: string;
  updatedAt: string;
}

export interface PublishedLessonSummary {
  lessonId: string;
  revision: number;
  title: { ja: string; support?: string };
  createdAt: string;
}

export class AuthoringClientError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const authoringClient = {
  create: (targets: string[]) =>
    request<CompilationView>("/api/v1/compilations", "POST", { targets }),
  list: async () => {
    const value = await request<{ compilations: CompilationView[] }>(
      "/api/v1/compilations",
      "GET",
    );
    return value.compilations;
  },
  getRequest: (id: string) =>
    request<LessonAuthoringRequestV2>(
      `/api/v1/compilations/${encodeURIComponent(id)}/request`,
      "GET",
    ),
  importResult: (id: string, fileName: string, rawText: string) =>
    request<CompilationView>(
      `/api/v1/compilations/${encodeURIComponent(id)}/imports`,
      "POST",
      { fileName, rawText },
    ),
  publish: (id: string) =>
    request<CompilationView>(
      `/api/v1/compilations/${encodeURIComponent(id)}/publish`,
      "POST",
      { confirmation: "PUBLISH_REVIEWED_LESSON" },
    ),
  listLessons: async () => {
    const value = await request<{ lessons: PublishedLessonSummary[] }>(
      "/api/v1/lessons",
      "GET",
    );
    return value.lessons;
  },
  loadLesson: (lessonId: string, revision: number) =>
    request<ValidatedLessonPackage>(
      `/api/v1/lessons/${encodeURIComponent(lessonId)}/revisions/${revision}`,
      "GET",
    ),
};

async function request<Value>(
  path: string,
  method: string,
  body?: unknown,
): Promise<Value> {
  let response: Response;
  try {
    response = await fetch(
      path,
      body === undefined
        ? { method }
        : {
            method,
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          },
    );
  } catch {
    throw new AuthoringClientError(
      "AUTHORING_SERVER_UNAVAILABLE",
      "Không kết nối được Bunbun server local.",
    );
  }
  let input: unknown;
  try {
    input = (await response.json()) as unknown;
  } catch {
    throw new AuthoringClientError(
      "AUTHORING_RESPONSE_INVALID",
      "Server trả về phản hồi không phải JSON.",
    );
  }
  if (!response.ok) {
    const record = isRecord(input) ? input : {};
    throw new AuthoringClientError(
      typeof record.code === "string"
        ? record.code
        : "AUTHORING_REQUEST_FAILED",
      typeof record.message === "string"
        ? record.message
        : `Yêu cầu thất bại với HTTP ${response.status}.`,
    );
  }
  if (!isRecord(input)) {
    throw new AuthoringClientError(
      "AUTHORING_RESPONSE_INVALID",
      "Server trả về object không hợp lệ.",
    );
  }
  return input as Value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
