import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";

const REPOSITORY_ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
);
const CATALOG_PATH = path.join(
  REPOSITORY_ROOT,
  "docs/audio-sources/M8_NON_SPEECH_CANDIDATES_2026-08-25.json",
);
const DEFAULT_PORT = 4175;
const BUS_GAINS = Object.freeze({ ambience: 0.35, effects: 0.65, music: 0.2 });
const DUCK_FACTORS = Object.freeze({ ambience: 0.25, effects: 1, music: 0.15 });

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function resolveContainedPath(root, relativePath) {
  if (path.isAbsolute(relativePath)) {
    throw new Error(`Absolute candidate path is forbidden: ${relativePath}`);
  }
  const resolved = path.resolve(root, relativePath);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Candidate path leaves staging: ${relativePath}`);
  }
  return resolved;
}

export async function loadAndValidateReviewCatalog() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8"));
  const stagingRoot = path.resolve(REPOSITORY_ROOT, catalog.stagingRoot);
  const sourceIds = new Set(catalog.sources.map((source) => source.sourceId));
  const candidateIds = new Set();
  const choiceGroups = new Set();
  const recommendedByGroup = new Map();
  const resolvedCandidates = [];

  async function validateStagedFile(relativePath, expectedBytes, expectedHash) {
    const absolutePath = resolveContainedPath(stagingRoot, relativePath);
    const bytes = await readFile(absolutePath);
    if (expectedBytes !== undefined && bytes.length !== expectedBytes) {
      throw new Error(`Byte-size drift for staged file: ${relativePath}`);
    }
    if (sha256(bytes) !== expectedHash) {
      throw new Error(`SHA-256 drift for staged file: ${relativePath}`);
    }
    return absolutePath;
  }

  await validateStagedFile(
    catalog.license.evidenceSnapshot.relativePath,
    undefined,
    catalog.license.evidenceSnapshot.sha256,
  );
  for (const source of catalog.sources) {
    if (source.pageUrl) {
      await validateStagedFile(
        source.pageSnapshotPath,
        undefined,
        source.pageSnapshotSha256,
      );
    }
    for (const artifact of source.downloadArtifacts) {
      await validateStagedFile(
        artifact.relativePath,
        artifact.bytes,
        artifact.sha256,
      );
    }
  }

  for (const candidate of catalog.candidates) {
    if (candidateIds.has(candidate.id)) {
      throw new Error(`Duplicate candidate ID: ${candidate.id}`);
    }
    if (!sourceIds.has(candidate.sourceId)) {
      throw new Error(
        `Unknown source ID for ${candidate.id}: ${candidate.sourceId}`,
      );
    }
    if (!(candidate.bus in BUS_GAINS)) {
      throw new Error(`Unknown bus for ${candidate.id}: ${candidate.bus}`);
    }
    candidateIds.add(candidate.id);

    if (candidate.choiceGroup) {
      choiceGroups.add(candidate.choiceGroup);
      if (candidate.recommended) {
        recommendedByGroup.set(
          candidate.choiceGroup,
          (recommendedByGroup.get(candidate.choiceGroup) ?? 0) + 1,
        );
      }
    }

    const absolutePath = await validateStagedFile(
      candidate.relativePath,
      candidate.media.bytes,
      candidate.sha256,
    );
    resolvedCandidates.push({ ...candidate, absolutePath });
  }

  for (const group of choiceGroups) {
    const count = recommendedByGroup.get(group) ?? 0;
    if (count !== 1) {
      throw new Error(`Choice group ${group} has ${count} recommendations`);
    }
  }

  return { catalog, resolvedCandidates };
}

function renderReviewPage(catalog) {
  const publicCatalog = {
    ...catalog,
    busGains: BUS_GAINS,
    duckFactors: DUCK_FACTORS,
  };
  const serializedCatalog = JSON.stringify(publicCatalog).replaceAll(
    "<",
    "\\u003c",
  );

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bunbun M8 non-speech review</title>
    <style>
      :root { color-scheme: dark; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background: #15211d; color: #f6f0df; }
      * { box-sizing: border-box; }
      body { margin: 0; padding: 28px; }
      main { max-width: 1180px; margin: 0 auto; }
      h1 { font: 700 clamp(2rem, 5vw, 4rem) Georgia, serif; margin: 0 0 12px; }
      h2 { margin-top: 34px; color: #f2d59e; }
      a { color: #f2d59e; }
      .notice, .summary { border: 1px solid #52695e; border-radius: 18px; padding: 18px; background: #1d2c26; }
      .status { position: sticky; top: 12px; z-index: 2; margin: 16px 0; padding: 12px 16px; background: #c96641; color: #17110e; border-radius: 999px; font-weight: 800; width: fit-content; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(315px, 1fr)); gap: 14px; }
      .card { border: 1px solid #52695e; border-radius: 18px; padding: 16px; background: #1d2c26; }
      .card.recommended { border-color: #e5bd72; }
      .meta { color: #b9c8bf; font-size: .86rem; line-height: 1.5; overflow-wrap: anywhere; }
      .hash { color: #8fb7a2; font-size: .75rem; }
      .controls { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0; }
      button { border: 1px solid #e5bd72; background: #283d34; color: #fff7e6; border-radius: 10px; padding: 9px 12px; font: inherit; cursor: pointer; }
      button:hover { background: #365145; }
      label { display: flex; gap: 8px; align-items: flex-start; color: #f2d59e; }
      textarea { width: 100%; min-height: 260px; background: #0f1815; color: #eef7f1; border: 1px solid #52695e; border-radius: 12px; padding: 12px; }
      .checklist label { margin: 9px 0; color: inherit; }
    </style>
  </head>
  <body>
    <main>
      <h1>M8 non-speech listening gate</h1>
      <p>Chỉ là bộ nghe local. Không file nào ở trang này đã được duyệt vào Git hoặc runtime. Hạ âm lượng hệ điều hành trước khi thử nút Raw.</p>
      <div class="notice checklist">
        <strong>Nghe bằng tai nghe và loa.</strong>
        <label><input type="checkbox" /> Không có lời nói, thương hiệu hoặc thông tin cá nhân nghe rõ.</label>
        <label><input type="checkbox" /> Không có giai điệu nhận diện được; station chime là bản Bunbun nguyên gốc.</label>
        <label><input type="checkbox" /> Loop không có tiếng click hoặc đường nối gây khó chịu.</label>
        <label><input type="checkbox" /> Mức Normal và Ducked không che tiếng Nhật.</label>
      </div>
      <div class="status" id="status">Idle</div>
      <div id="groups"></div>
      <section class="summary">
        <h2>Exact hash proposal</h2>
        <p>Chọn một file cho từng nhóm thay thế, bỏ chọn file fixed nếu muốn loại, rồi sao chép kết quả gửi lại trong chat.</p>
        <div class="controls"><button id="stop">Stop</button><button id="build">Build approval text</button><button id="copy">Copy approval text</button></div>
        <textarea id="result" spellcheck="false"></textarea>
      </section>
    </main>
    <script>
      const catalog = ${serializedCatalog};
      const sources = new Map(catalog.sources.map((source) => [source.sourceId, source]));
      const statusNode = document.querySelector("#status");
      const groupsNode = document.querySelector("#groups");
      const resultNode = document.querySelector("#result");
      let audioContext;
      let activeSource;

      function setStatus(message) { statusNode.textContent = message; }
      function stopAudio() {
        if (activeSource) {
          try { activeSource.stop(); } catch {}
          activeSource.disconnect();
          activeSource = undefined;
        }
        setStatus("Idle");
      }

      async function play(candidate, mode) {
        stopAudio();
        audioContext ??= new AudioContext();
        await audioContext.resume();
        setStatus("Loading " + candidate.id + "…");
        const response = await fetch("/audio/" + encodeURIComponent(candidate.id));
        if (!response.ok) throw new Error("HTTP " + response.status);
        const buffer = await audioContext.decodeAudioData(await response.arrayBuffer());
        const source = audioContext.createBufferSource();
        const gain = audioContext.createGain();
        const normal = catalog.busGains[candidate.bus];
        gain.gain.value = mode === "raw" ? 1 : mode === "ducked" ? normal * catalog.duckFactors[candidate.bus] : normal;
        source.buffer = buffer;
        source.loop = candidate.bus === "ambience";
        source.connect(gain).connect(audioContext.destination);
        source.onended = () => { if (activeSource === source) setStatus("Idle"); };
        activeSource = source;
        source.start();
        setStatus("Playing " + candidate.id + " · " + mode + " · gain " + gain.gain.value.toFixed(3) + (source.loop ? " · loop" : ""));
      }

      function createCard(candidate) {
        const source = sources.get(candidate.sourceId);
        const card = document.createElement("article");
        card.className = "card" + (candidate.recommended ? " recommended" : "");
        const heading = document.createElement("h3");
        heading.textContent = candidate.id + " — " + candidate.role;
        const meta = document.createElement("p");
        meta.className = "meta";
        meta.textContent = source.title + " · " + source.author + " · " + candidate.bus + " · " + candidate.media.durationSeconds + "s · " + candidate.media.sampleRateHz + " Hz · " + candidate.media.channels + "ch · peak " + candidate.media.peakDbfs + " dBFS";
        const hash = document.createElement("p");
        hash.className = "hash";
        hash.textContent = candidate.sourceFilename + " · " + candidate.sha256;
        const provenance = document.createElement("p");
        provenance.className = "meta";
        if (source.pageUrl) {
          const link = document.createElement("a");
          link.href = source.pageUrl;
          link.target = "_blank";
          link.rel = "noreferrer";
          link.textContent = source.pageUrl;
          const license = document.createElement("a");
          license.href = catalog.license.url;
          license.target = "_blank";
          license.rel = "noreferrer";
          license.textContent = "CC0 1.0";
          provenance.append(link, document.createTextNode(" · "), license, document.createTextNode(" · observed ${catalog.observedAt}"));
        } else {
          provenance.textContent = "Bunbun project-authored audio · deterministic PCM · ${catalog.observedAt}";
        }
        const controls = document.createElement("div");
        controls.className = "controls";
        for (const mode of ["raw", "normal", "ducked"]) {
          const button = document.createElement("button");
          button.textContent = mode === "ducked" && candidate.bus === "effects" ? "Ducked = Normal" : mode[0].toUpperCase() + mode.slice(1);
          button.addEventListener("click", () => play(candidate, mode).catch((error) => setStatus("ERROR: " + error.message)));
          controls.append(button);
        }
        const selection = document.createElement("label");
        const input = document.createElement("input");
        input.type = candidate.choiceGroup ? "radio" : "checkbox";
        input.name = candidate.choiceGroup ?? candidate.id;
        input.value = candidate.id;
        input.dataset.candidateId = candidate.id;
        input.checked = candidate.choiceGroup ? Boolean(candidate.recommended) : !candidate.optional;
        selection.append(input, document.createTextNode(candidate.choiceGroup ? " Chọn file này cho vai trò" : candidate.optional ? " Giữ file tùy chọn này" : " Duyệt file fixed này"));
        card.append(heading, meta, hash, provenance, controls, selection);
        return card;
      }

      const grouped = new Map();
      for (const candidate of catalog.candidates) {
        const roleCandidates = grouped.get(candidate.role) ?? [];
        roleCandidates.push(candidate);
        grouped.set(candidate.role, roleCandidates);
      }
      for (const [role, candidates] of grouped) {
        const section = document.createElement("section");
        const heading = document.createElement("h2");
        heading.textContent = role;
        const grid = document.createElement("div");
        grid.className = "grid";
        for (const candidate of candidates) grid.append(createCard(candidate));
        section.append(heading, grid);
        groupsNode.append(section);
      }

      function buildApprovalText() {
        const selectedIds = new Set([...document.querySelectorAll("[data-candidate-id]:checked")].map((input) => input.dataset.candidateId));
        const selected = catalog.candidates.filter((candidate) => selectedIds.has(candidate.id));
        const omitted = catalog.candidates.filter((candidate) => !selectedIds.has(candidate.id));
        resultNode.value = [
          "M8 NON-SPEECH HASH REVIEW",
          "catalogVersion: " + catalog.version,
          "APPROVE:",
          ...selected.map((candidate) => "- " + candidate.id + " | " + candidate.sha256 + " | " + candidate.role + " | " + candidate.bus),
          "NOT_SELECTED_OR_REJECTED:",
          ...omitted.map((candidate) => "- " + candidate.id + " | " + candidate.sha256),
        ].join("\\n");
      }

      document.querySelector("#stop").addEventListener("click", stopAudio);
      document.querySelector("#build").addEventListener("click", buildApprovalText);
      document.querySelector("#copy").addEventListener("click", async () => {
        buildApprovalText();
        await navigator.clipboard.writeText(resultNode.value);
        setStatus("Approval text copied");
      });
      buildApprovalText();
    </script>
  </body>
</html>`;
}

function sendAudio(request, response, candidate) {
  const contentType = candidate.absolutePath.endsWith(".wav")
    ? "audio/wav"
    : "audio/ogg";
  const totalBytes = candidate.media.bytes;
  const range = request.headers.range?.match(/^bytes=(\d*)-(\d*)$/);

  if (!range) {
    response.writeHead(200, {
      "Accept-Ranges": "bytes",
      "Content-Length": totalBytes,
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    });
    createReadStream(candidate.absolutePath).pipe(response);
    return;
  }

  const start = range[1] ? Number(range[1]) : 0;
  const end = range[2] ? Number(range[2]) : totalBytes - 1;
  if (start > end || end >= totalBytes) {
    response.writeHead(416, { "Content-Range": `bytes */${totalBytes}` });
    response.end();
    return;
  }
  response.writeHead(206, {
    "Accept-Ranges": "bytes",
    "Content-Length": end - start + 1,
    "Content-Range": `bytes ${start}-${end}/${totalBytes}`,
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  createReadStream(candidate.absolutePath, { start, end }).pipe(response);
}

export async function startReviewServer(port = DEFAULT_PORT) {
  const { catalog, resolvedCandidates } = await loadAndValidateReviewCatalog();
  const candidates = new Map(
    resolvedCandidates.map((candidate) => [candidate.id, candidate]),
  );
  const page = renderReviewPage(catalog);
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    if (url.pathname === "/") {
      response.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy":
          "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; media-src 'self'",
        "Cache-Control": "no-store",
      });
      response.end(page);
      return;
    }
    if (url.pathname.startsWith("/audio/")) {
      const id = decodeURIComponent(url.pathname.slice("/audio/".length));
      const candidate = candidates.get(id);
      if (candidate) {
        sendAudio(request, response, candidate);
        return;
      }
    }
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found\n");
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  return server;
}

async function main() {
  const port = process.argv[2] ? Number(process.argv[2]) : DEFAULT_PORT;
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error("Review port must be an integer from 1024 through 65535.");
  }
  await stat(CATALOG_PATH);
  await startReviewServer(port);
  process.stdout.write(`Bunbun M8 audio review: http://127.0.0.1:${port}/\n`);
}

if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  await main();
}
