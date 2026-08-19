import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pluginRoot = resolve(repositoryRoot, "plugins/bunbun-authoring");
const skillRoot = resolve(pluginRoot, "skills/bunbun-lesson-authoring");
const lockPath = resolve(skillRoot, "references/prompt-pack.lock.json");
const lock = JSON.parse(await readFile(lockPath, "utf8"));
const errors = [];

if (lock.packVersion !== "0.1.0") {
  errors.push("prompt pack version must be 0.1.0");
}
if (
  JSON.stringify(lock.compositionOrder) !==
  JSON.stringify(["story_sheet", "reverse_trainer", "story_coach"])
) {
  errors.push("prompt composition order does not match D-024");
}
if (!Array.isArray(lock.modules) || lock.modules.length !== 3) {
  errors.push("prompt lock must contain exactly three modules");
} else {
  for (const module of lock.modules) {
    const sourcePath = resolve(repositoryRoot, module.source);
    const bundledPath = resolve(skillRoot, module.bundled);
    const [source, bundled] = await Promise.all([
      readFile(sourcePath),
      readFile(bundledPath),
    ]);
    const sourceHash = sha256(source);
    const bundledHash = sha256(bundled);
    if (sourceHash !== module.promptSha256) {
      errors.push(`${module.moduleId} authoritative prompt hash drifted`);
    }
    if (bundledHash !== module.promptSha256) {
      errors.push(`${module.moduleId} bundled prompt hash drifted`);
    }
    if (!source.equals(bundled)) {
      errors.push(`${module.moduleId} bundled prompt differs from source`);
    }
  }
}

const manifest = JSON.parse(
  await readFile(resolve(pluginRoot, ".codex-plugin/plugin.json"), "utf8"),
);
if ("mcpServers" in manifest || "apps" in manifest) {
  errors.push("Skills-only plugin must not declare MCP servers or apps");
}

const marketplace = JSON.parse(
  await readFile(
    resolve(repositoryRoot, ".agents/plugins/marketplace.json"),
    "utf8",
  ),
);
const marketplaceEntry = marketplace.plugins?.find(
  (entry) => entry.name === "bunbun-authoring",
);
if (marketplace.name !== "personal") {
  errors.push("local marketplace name must remain personal");
}
if (marketplaceEntry?.source?.source !== "local") {
  errors.push("plugin marketplace source must remain local");
}
if (marketplaceEntry?.source?.path !== "./plugins/bunbun-authoring") {
  errors.push("plugin marketplace path must target ./plugins/bunbun-authoring");
}

const files = await listFiles(pluginRoot);
const forbiddenExtensions = new Set([
  ".apkg",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
]);
const forbiddenNames = new Set([".app.json", ".mcp.json"]);
const suspiciousContent = [
  ["OpenAI-style secret", /\bsk-[A-Za-z0-9_-]{20,}\b/u],
  ["hosted GPT link", /https:\/\/chatgpt\.com\/g\//iu],
  ["browser cookie assignment", /(?:^|\s)(?:cookie|session_token)\s*=/iu],
];

for (const path of files) {
  if (forbiddenExtensions.has(extname(path).toLowerCase())) {
    errors.push(`binary or media asset is excluded: ${path}`);
  }
  if (forbiddenNames.has(path.split("/").at(-1))) {
    errors.push(`companion capability file is excluded: ${path}`);
  }
  if ([".json", ".md", ".txt", ".yaml", ".yml"].includes(extname(path))) {
    const contents = await readFile(path, "utf8");
    for (const [label, pattern] of suspiciousContent) {
      if (pattern.test(contents)) {
        errors.push(`${label} found in ${path}`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error("M7_V3_2_PLUGIN_CHECK_FAILED");
  for (const error of errors.sort()) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `M7_V3_2_PLUGIN_CHECK_PASSED modules=${lock.modules.length} files=${files.length}`,
  );
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function listFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(root, entry.name);
      return entry.isDirectory() ? listFiles(path) : [path];
    }),
  );
  return nested.flat().sort();
}
