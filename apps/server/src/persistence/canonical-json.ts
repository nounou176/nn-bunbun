import { createHash } from "node:crypto";

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

export function fingerprint(value: unknown): string {
  return `sha256_${createHash("sha256").update(canonicalJson(value)).digest("hex")}`;
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (typeof value !== "object" || value === null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, child]) => [key, sortValue(child)]),
  );
}
