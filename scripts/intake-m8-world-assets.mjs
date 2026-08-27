import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MEBIBYTE = 1024 * 1024;
const MAX_PAGE_BYTES = 2 * MEBIBYTE;
const MAX_ARCHIVE_BYTES = 128 * MEBIBYTE;
const MAX_TOTAL_ARCHIVE_BYTES = 256 * MEBIBYTE;
const MAX_EXPANDED_BYTES = 1024 * MEBIBYTE;
const MAX_MEMBER_BYTES = 64 * MEBIBYTE;
const MAX_MEMBERS = 2_000;
const ALLOWED_HOST = "kenney.nl";

const REPOSITORY_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const STAGING_ROOT = path.join(
  REPOSITORY_ROOT,
  ".bunbun-data/world-intake/m8-neighborhood/v1",
);

const SOURCES = Object.freeze([
  {
    sourceId: "kenney_city_kit_roads_2_1",
    title: "Kenney City Kit (Roads)",
    advertisedVersion: "2.1",
    advertisedFiles: 90,
    pageUrl: "https://kenney.nl/assets/city-kit-roads",
    archiveUrl:
      "https://kenney.nl/media/pages/assets/city-kit-roads/74288c9459-1787042796/kenney_city-kit-roads.zip",
  },
  {
    sourceId: "kenney_city_kit_suburban_2_0",
    title: "Kenney City Kit (Suburban)",
    advertisedVersion: "2.0",
    advertisedFiles: 40,
    pageUrl: "https://kenney.nl/assets/city-kit-suburban",
    archiveUrl:
      "https://kenney.nl/media/pages/assets/city-kit-suburban/2c871b7af2-1745479373/kenney_city-kit-suburban_20.zip",
  },
  {
    sourceId: "kenney_blocky_characters_2_0",
    title: "Kenney Blocky Characters",
    advertisedVersion: "2.0",
    advertisedFiles: 20,
    pageUrl: "https://kenney.nl/assets/blocky-characters",
    archiveUrl:
      "https://kenney.nl/media/pages/assets/blocky-characters/8369c0cf30-1749547469/kenney_blocky-characters_20.zip",
  },
  {
    sourceId: "kenney_cube_pets_page_2_0",
    title: "Kenney Cube Pets",
    advertisedVersion: "2.0",
    advertisedFiles: 24,
    pageUrl: "https://kenney.nl/assets/cube-pets",
    archiveUrl:
      "https://kenney.nl/media/pages/assets/cube-pets/44e58e945f-1774520254/kenney_cube-pets_1.0.zip",
  },
]);

const SUPPORT_SOURCE = Object.freeze({
  sourceId: "kenney_support_cc0_2026_08_27",
  title: "Kenney support and license statement",
  pageUrl: "https://kenney.nl/support",
});

const NESTED_ARCHIVE_EXTENSIONS = new Set([
  ".7z",
  ".bz2",
  ".gz",
  ".rar",
  ".tar",
  ".tgz",
  ".xz",
  ".zip",
]);
const EXECUTABLE_OR_SCRIPT_EXTENSIONS = new Set([
  ".appimage",
  ".bat",
  ".cmd",
  ".com",
  ".cjs",
  ".dll",
  ".dylib",
  ".exe",
  ".jar",
  ".js",
  ".mjs",
  ".php",
  ".ps1",
  ".sh",
  ".so",
]);
const EXTRACTED_EXTENSIONS = new Set([".glb", ".md", ".pdf", ".txt"]);

export function validateArchiveMemberName(memberName) {
  if (
    memberName.length === 0 ||
    memberName.includes("\0") ||
    memberName.includes("\\") ||
    memberName.startsWith("/") ||
    /^[A-Za-z]:/.test(memberName)
  ) {
    throw new Error(
      `Unsafe archive member path: ${JSON.stringify(memberName)}`,
    );
  }
  const parts = memberName.split("/");
  if (parts.some((part) => part === "..")) {
    throw new Error(`Archive traversal is forbidden: ${memberName}`);
  }
}

export function classifyArchiveMember(memberName) {
  const extension = path.extname(memberName).toLowerCase();
  const normalizedMemberName = memberName.replaceAll("\\", "/");
  return {
    extension,
    nestedArchive: NESTED_ARCHIVE_EXTENSIONS.has(extension),
    executableOrScript: EXECUTABLE_OR_SCRIPT_EXTENSIONS.has(extension),
    ignoredHtmlDocument: extension === ".htm" || extension === ".html",
    extract:
      EXTRACTED_EXTENSIONS.has(extension) ||
      (extension === ".png" &&
        normalizedMemberName.includes("/GLB format/Textures/")),
  };
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function fetchBounded(url, maximumBytes, expectedKind) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: { "user-agent": "Bunbun-M8-World-Intake/1.0" },
  });
  if (!response.ok || response.body === null) {
    throw new Error(`Download failed (${response.status}) for ${url}`);
  }
  const resolved = new URL(response.url);
  if (resolved.protocol !== "https:" || resolved.hostname !== ALLOWED_HOST) {
    throw new Error(`Unexpected download host for ${url}: ${response.url}`);
  }
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    throw new Error(`Declared ${expectedKind} size exceeds bound: ${url}`);
  }

  const chunks = [];
  let total = 0;
  for await (const chunk of response.body) {
    total += chunk.length;
    if (total > maximumBytes) {
      throw new Error(
        `${expectedKind} exceeds byte bound while reading: ${url}`,
      );
    }
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks, total);
  return {
    bytes,
    contentType: response.headers.get("content-type") ?? "",
    resolvedUrl: response.url,
  };
}

function parseZipListing(archivePath) {
  const listing = execFileSync("unzip", ["-l", archivePath], {
    encoding: "utf8",
    maxBuffer: 8 * MEBIBYTE,
  });
  const members = [];
  for (const line of listing.split("\n")) {
    const match = line.match(
      /^\s*(\d+)\s+\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}\s+(.+?)\s*$/,
    );
    if (match === null) continue;
    members.push({ bytes: Number(match[1]), name: match[2] });
  }
  return members;
}

function inspectArchive(archivePath) {
  const members = parseZipListing(archivePath);
  if (members.length === 0 || members.length > MAX_MEMBERS) {
    throw new Error(
      `Archive member count is outside bounds: ${members.length}`,
    );
  }

  const modeListing = execFileSync("zipinfo", ["-l", archivePath], {
    encoding: "utf8",
    maxBuffer: 8 * MEBIBYTE,
  });
  if (modeListing.split("\n").some((line) => /^l[rwx-]{9}\s/.test(line))) {
    throw new Error(`Archive contains a symbolic link: ${archivePath}`);
  }

  let expandedBytes = 0;
  for (const member of members) {
    validateArchiveMemberName(member.name);
    const classification = classifyArchiveMember(member.name);
    if (classification.nestedArchive) {
      throw new Error(`Nested archive is forbidden: ${member.name}`);
    }
    if (classification.executableOrScript) {
      throw new Error(
        `Executable or script member is forbidden: ${member.name}`,
      );
    }
    if (member.bytes > MAX_MEMBER_BYTES) {
      throw new Error(`Archive member exceeds byte bound: ${member.name}`);
    }
    expandedBytes += member.bytes;
  }
  if (expandedBytes > MAX_EXPANDED_BYTES) {
    throw new Error(`Archive expanded size exceeds bound: ${archivePath}`);
  }
  return { expandedBytes, members };
}

async function listExtractedArtifacts(extractionRoot) {
  const output = execFileSync("find", [
    extractionRoot,
    "-type",
    "f",
    "-print0",
  ]);
  const artifacts = [];
  for (const encodedPath of output.toString("utf8").split("\0")) {
    if (encodedPath.length === 0) continue;
    const bytes = await readFile(encodedPath);
    artifacts.push({
      relativePath: path.relative(STAGING_ROOT, encodedPath),
      bytes: bytes.length,
      sha256: sha256(bytes),
    });
  }
  artifacts.sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath),
  );
  return artifacts;
}

async function saveContentAddressed(directory, stem, extension, bytes) {
  const digest = sha256(bytes);
  const outputPath = path.join(directory, `${stem}-${digest}.${extension}`);
  await writeFile(outputPath, bytes, { flag: "wx" }).catch(async (error) => {
    if (error.code !== "EEXIST") throw error;
    const existing = await readFile(outputPath);
    if (!existing.equals(bytes)) {
      throw new Error(`Content-address collision at ${outputPath}`);
    }
  });
  return {
    absolutePath: outputPath,
    relativePath: path.relative(STAGING_ROOT, outputPath),
    bytes: bytes.length,
    sha256: digest,
  };
}

async function intake() {
  const pagesDirectory = path.join(STAGING_ROOT, "pages");
  const archivesDirectory = path.join(STAGING_ROOT, "archives");
  const extractedDirectory = path.join(STAGING_ROOT, "extracted");
  await Promise.all(
    [STAGING_ROOT, pagesDirectory, archivesDirectory, extractedDirectory].map(
      (directory) => mkdir(directory, { recursive: true }),
    ),
  );

  const supportResponse = await fetchBounded(
    SUPPORT_SOURCE.pageUrl,
    MAX_PAGE_BYTES,
    "page",
  );
  const supportText = supportResponse.bytes.toString("utf8");
  if (
    !supportText.includes("public domain licensed (CC0)") ||
    !supportText.includes("Attribution is not required")
  ) {
    throw new Error(
      "Kenney support page no longer contains the approved CC0 facts",
    );
  }
  const supportSnapshot = await saveContentAddressed(
    pagesDirectory,
    SUPPORT_SOURCE.sourceId,
    "html",
    supportResponse.bytes,
  );

  const results = [];
  let totalArchiveBytes = 0;
  let totalExpandedBytes = 0;
  let totalMembers = 0;

  for (const source of SOURCES) {
    const pageResponse = await fetchBounded(
      source.pageUrl,
      MAX_PAGE_BYTES,
      "page",
    );
    const pageText = pageResponse.bytes.toString("utf8");
    if (
      !pageText.includes(source.title.replace("Kenney ", "")) ||
      !pageText.includes("Creative Commons CC0") ||
      !pageText.includes("Continue without donating") ||
      !pageText.includes(source.archiveUrl)
    ) {
      throw new Error(
        `Source page facts or free archive link drifted: ${source.sourceId}`,
      );
    }
    const pageSnapshot = await saveContentAddressed(
      pagesDirectory,
      source.sourceId,
      "html",
      pageResponse.bytes,
    );

    const archiveResponse = await fetchBounded(
      source.archiveUrl,
      MAX_ARCHIVE_BYTES,
      "archive",
    );
    if (
      archiveResponse.bytes.length < 4 ||
      archiveResponse.bytes.subarray(0, 2).toString("ascii") !== "PK"
    ) {
      throw new Error(
        `Downloaded artifact is not a ZIP archive: ${source.sourceId}`,
      );
    }
    totalArchiveBytes += archiveResponse.bytes.length;
    if (totalArchiveBytes > MAX_TOTAL_ARCHIVE_BYTES) {
      throw new Error("Combined archive bytes exceed the approved bound");
    }
    const archiveSnapshot = await saveContentAddressed(
      archivesDirectory,
      source.sourceId,
      "zip",
      archiveResponse.bytes,
    );
    const archiveInspection = inspectArchive(archiveSnapshot.absolutePath);
    totalExpandedBytes += archiveInspection.expandedBytes;
    totalMembers += archiveInspection.members.length;
    if (totalExpandedBytes > MAX_EXPANDED_BYTES || totalMembers > MAX_MEMBERS) {
      throw new Error(
        "Combined expanded bytes or member count exceed approved bounds",
      );
    }

    const extractionRoot = path.join(
      extractedDirectory,
      source.sourceId,
      archiveSnapshot.sha256,
    );
    await mkdir(extractionRoot, { recursive: true });
    const extractionMembers = archiveInspection.members
      .filter((member) => classifyArchiveMember(member.name).extract)
      .map((member) => member.name);
    execFileSync(
      "unzip",
      [
        "-n",
        archiveSnapshot.absolutePath,
        ...extractionMembers,
        "-d",
        extractionRoot,
      ],
      { encoding: "utf8", maxBuffer: 8 * MEBIBYTE },
    );
    const extractedArtifacts = await listExtractedArtifacts(extractionRoot);
    const modelCount = extractedArtifacts.filter((artifact) =>
      artifact.relativePath.toLowerCase().endsWith(".glb"),
    ).length;
    if (modelCount === 0) {
      throw new Error(`No GLB model was extracted for ${source.sourceId}`);
    }

    results.push({
      sourceId: source.sourceId,
      title: source.title,
      advertisedVersion: source.advertisedVersion,
      advertisedFiles: source.advertisedFiles,
      pageUrl: source.pageUrl,
      resolvedPageUrl: pageResponse.resolvedUrl,
      archiveUrl: source.archiveUrl,
      resolvedArchiveUrl: archiveResponse.resolvedUrl,
      pageSnapshot,
      archive: archiveSnapshot,
      archiveInspection: {
        memberCount: archiveInspection.members.length,
        expandedBytes: archiveInspection.expandedBytes,
        members: archiveInspection.members.map((member) => ({
          ...member,
          ...classifyArchiveMember(member.name),
        })),
      },
      extractionRoot: path.relative(STAGING_ROOT, extractionRoot),
      extractedArtifacts,
      modelCount,
    });
  }

  const manifest = {
    packetFormat: "bunbun_m8_world_intake",
    packetVersion: "1.0.0",
    observedAt: new Date().toISOString(),
    stagingRoot: path.relative(REPOSITORY_ROOT, STAGING_ROOT),
    authority: {
      decisionId: "D-044",
      plan: "plans/2026-08-27-m8-rainy-neighborhood-world.md",
      runtimeSelectionAuthorized: false,
    },
    constraints: {
      maximumArchiveCount: SOURCES.length,
      maximumArchiveBytes: MAX_ARCHIVE_BYTES,
      maximumTotalArchiveBytes: MAX_TOTAL_ARCHIVE_BYTES,
      maximumExpandedBytes: MAX_EXPANDED_BYTES,
      maximumMemberBytes: MAX_MEMBER_BYTES,
      maximumMembers: MAX_MEMBERS,
    },
    license: {
      id: "CC0-1.0",
      sourceUrl: SUPPORT_SOURCE.pageUrl,
      resolvedSourceUrl: supportResponse.resolvedUrl,
      evidenceSnapshot: supportSnapshot,
      attributionRequired: false,
      voluntaryCredit: "Kenney",
    },
    totals: {
      archiveBytes: totalArchiveBytes,
      expandedBytes: totalExpandedBytes,
      memberCount: totalMembers,
      extractedBytes: results.reduce(
        (sum, source) =>
          sum +
          source.extractedArtifacts.reduce(
            (sourceSum, artifact) => sourceSum + artifact.bytes,
            0,
          ),
        0,
      ),
      extractedFileCount: results.reduce(
        (sum, source) => sum + source.extractedArtifacts.length,
        0,
      ),
      modelCount: results.reduce((sum, source) => sum + source.modelCount, 0),
    },
    sources: results,
  };
  const manifestPath = path.join(STAGING_ROOT, "intake-manifest.json");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const written = await stat(manifestPath);
  console.log(
    JSON.stringify(
      {
        status: "QUALIFIED_FOR_LOCAL_REVIEW",
        manifestPath,
        manifestBytes: written.size,
        totals: manifest.totals,
        sources: results.map((source) => ({
          sourceId: source.sourceId,
          archiveBytes: source.archive.bytes,
          archiveSha256: source.archive.sha256,
          memberCount: source.archiveInspection.memberCount,
          expandedBytes: source.archiveInspection.expandedBytes,
          modelCount: source.modelCount,
        })),
      },
      null,
      2,
    ),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  intake().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
