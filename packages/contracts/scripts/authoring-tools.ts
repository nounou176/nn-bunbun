import { createHash } from "node:crypto";

export function canonicalizeJson(value: unknown): string {
  return JSON.stringify(sortJsonValue(value));
}

export function sha256CanonicalJson(value: unknown): string {
  return createHash("sha256")
    .update(canonicalizeJson(value), "utf8")
    .digest("hex");
}

export function parseStrictJson(raw: string): unknown {
  return JSON.parse(raw) as unknown;
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, sortJsonValue(item)]),
    );
  }
  return value;
}
