import type { LessonManifest, ValidatedLessonPackage } from "@bunbun/contracts";
import cachedSpeechFixture from "@bunbun/contracts/fixtures/valid-m8-cached-speech" with { type: "json" };
import lastTrainManifestFixture from "@bunbun/contracts/fixtures/m8-last-train" with { type: "json" };

import {
  authoringClient,
  type CompilationView,
  type PublishedLessonSummary,
  type SpeechAssetView,
} from "./client.js";
import { M8_LAST_TRAIN_RUNTIME_ACTIVATION_APPROVED } from "../lesson/production-approvals.js";

export type LessonSelection =
  | { kind: "AUTHORED_DEMO" }
  | { kind: "CACHED_SPEECH_DEMO" }
  | { kind: "LAST_TRAIN_DEMO"; supportMode: "GUIDED" | "IMMERSIVE" }
  | { kind: "PUBLISHED"; lessonPackage: ValidatedLessonPackage };

export function showAuthoringHome(
  app: HTMLDivElement,
): Promise<LessonSelection> {
  app.innerHTML = `
    <main class="authoring-home">
      <header class="authoring-hero">
        <div><p class="eyebrow">M7 · Local lesson compiler</p><h1>Bunbun Lesson Library</h1></div>
        <span class="transport-warning">Transport 0.2.0 · UNVERIFIED</span>
      </header>
      <section class="authoring-grid">
        <article class="authoring-card create-card">
          <p class="eyebrow">Create lesson</p>
          <h2>Nhập 1–3 mục tiếng Nhật</h2>
          <p>M7 demo chỉ hỗ trợ <b>犬</b>, <b>猫</b> và <b>〜てください</b>.</p>
          <form data-authoring="create-form">
            <label>Target 1<input name="target" lang="ja" required placeholder="犬"></label>
            <label>Target 2<input name="target" lang="ja" placeholder="〜てください"></label>
            <label>Target 3<input name="target" lang="ja" placeholder="猫"></label>
            <button class="primary-button" type="submit">Create compiler request</button>
          </form>
          <output class="authoring-status" data-authoring="status" aria-live="polite"></output>
        </article>
        <article class="authoring-card demo-card">
          <p class="eyebrow">Offline regression</p>
          <h2>ゆきを助けよう</h2>
          <p>Lesson tám primitive authored sẵn, luôn chơi được không cần plugin.</p>
          <button class="primary-button" data-authoring="play-demo" type="button">Play authored demo</button>
        </article>
        <article class="authoring-card speech-card">
          <p class="eyebrow">M8 · Last-train speech gate</p>
          <h2>終電まであと3分</h2>
          <p>Generate four exact lines locally, listen to each WAV, then approve before gameplay. Credit: <b>VOICEVOX Nemo</b>.</p>
          <div class="handoff-actions">
            <button data-audio="prepare" type="button">Prepare 4 lines</button>
            <button class="primary-button" data-audio="run" type="button">Generate with local Nemo</button>
            <button class="primary-button" data-audio="play-production-guided" type="button" disabled>Chơi có hướng dẫn tiếng Việt</button>
            <button data-audio="play-production-immersive" type="button" disabled>Thử thách chủ yếu bằng tiếng Nhật</button>
            <button data-audio="play" type="button" disabled>Play technical speech regression</button>
          </div>
          <div data-audio="review"></div>
          <div class="delete-data-actions">
            <button data-audio="purge" type="button">Delete generated speech cache</button>
            <button class="danger-button" data-audio="purge-confirm" type="button" hidden>Confirm speech deletion</button>
            <button data-audio="purge-cancel" type="button" hidden>Cancel</button>
          </div>
        </article>
      </section>
      <section class="authoring-card handoff-card" data-authoring="handoff" hidden></section>
      <section class="authoring-card library-card">
        <div class="library-heading"><div><p class="eyebrow">Published locally</p><h2>Lesson library</h2></div><button data-authoring="refresh" type="button">Refresh</button></div>
        <div class="lesson-library" data-authoring="library"><p>Loading local lessons…</p></div>
      </section>
    </main>
  `;

  const status = required<HTMLOutputElement>(app, '[data-authoring="status"]');
  const handoff = required<HTMLElement>(app, '[data-authoring="handoff"]');
  const library = required<HTMLElement>(app, '[data-authoring="library"]');
  const createForm = required<HTMLFormElement>(
    app,
    '[data-authoring="create-form"]',
  );
  const speechReview = required<HTMLElement>(app, '[data-audio="review"]');
  const playSpeech = required<HTMLButtonElement>(app, '[data-audio="play"]');
  const playProductionGuided = required<HTMLButtonElement>(
    app,
    '[data-audio="play-production-guided"]',
  );
  const playProductionImmersive = required<HTMLButtonElement>(
    app,
    '[data-audio="play-production-immersive"]',
  );
  const technicalSpeechManifest = cachedSpeechFixture as LessonManifest;
  const technicalSpeechAsset = technicalSpeechManifest.audioAssets[0]!;
  const speechManifest = lastTrainManifestFixture as LessonManifest;

  return new Promise((resolve) => {
    required<HTMLButtonElement>(
      app,
      '[data-authoring="play-demo"]',
    ).addEventListener("click", () => resolve({ kind: "AUTHORED_DEMO" }), {
      once: true,
    });
    playSpeech.addEventListener("click", () =>
      resolve({ kind: "CACHED_SPEECH_DEMO" }),
    );
    playProductionGuided.addEventListener("click", () =>
      resolve({ kind: "LAST_TRAIN_DEMO", supportMode: "GUIDED" }),
    );
    playProductionImmersive.addEventListener("click", () =>
      resolve({ kind: "LAST_TRAIN_DEMO", supportMode: "IMMERSIVE" }),
    );
    required<HTMLButtonElement>(app, '[data-audio="prepare"]').addEventListener(
      "click",
      () => {
        setBusy("Đang đăng ký exact speech input vào local queue…");
        void authoringClient
          .enqueueSpeech(
            speechManifest.lessonId,
            speechManifest.revision,
            speechManifest.audioAssets,
          )
          .then((assets) => {
            renderSpeech(productionAssets(assets));
            status.textContent = "Bốn exact speech input đã vào local queue.";
          })
          .catch(showError);
      },
    );
    required<HTMLButtonElement>(app, '[data-audio="run"]').addEventListener(
      "click",
      () => {
        setBusy("Đang gọi Nemo local trên 127.0.0.1:50121…");
        void authoringClient
          .runSpeech()
          .then((assets) => {
            renderSpeech(productionAssets(assets));
            status.textContent = "Local speech generation đã kết thúc.";
          })
          .catch(showError);
      },
    );
    const purge = required<HTMLButtonElement>(app, '[data-audio="purge"]');
    const purgeConfirm = required<HTMLButtonElement>(
      app,
      '[data-audio="purge-confirm"]',
    );
    const purgeCancel = required<HTMLButtonElement>(
      app,
      '[data-audio="purge-cancel"]',
    );
    purge.addEventListener("click", () => {
      purge.disabled = true;
      purgeConfirm.hidden = false;
      purgeCancel.hidden = false;
    });
    purgeCancel.addEventListener("click", () => {
      purge.disabled = false;
      purgeConfirm.hidden = true;
      purgeCancel.hidden = true;
    });
    purgeConfirm.addEventListener("click", () => {
      void authoringClient
        .purgeSpeech()
        .then(() => {
          purge.disabled = false;
          purgeConfirm.hidden = true;
          purgeCancel.hidden = true;
          renderSpeech([]);
          status.textContent =
            "Generated speech cache đã được xóa; lesson data được giữ nguyên.";
        })
        .catch(showError);
    });
    required<HTMLButtonElement>(
      app,
      '[data-authoring="refresh"]',
    ).addEventListener("click", () => void refresh());
    createForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const targets = [
        ...createForm.querySelectorAll<HTMLInputElement>(
          'input[name="target"]',
        ),
      ]
        .map((input) => input.value)
        .filter((value) => value.trim().length > 0);
      setBusy("Đang tạo deterministic request…");
      void authoringClient
        .create(targets)
        .then((compilation) => {
          status.textContent = "Request đã được tạo và lưu local.";
          renderCompilation(compilation);
        })
        .catch(showError);
    });

    void refresh();

    async function refresh(): Promise<void> {
      try {
        const [compilations, lessons, speechAssets] = await Promise.all([
          authoringClient.list(),
          authoringClient.listLessons(),
          authoringClient.listSpeech(),
        ]);
        renderLibrary(lessons);
        renderSpeech(productionAssets(speechAssets));
        playSpeech.disabled =
          speechAssets.find(
            (asset) => asset.cacheKey === technicalSpeechAsset.cacheKey,
          )?.status !== "READY";
        const current =
          compilations.find(
            (compilation) => compilation.status !== "PUBLISHED",
          ) ?? compilations[0];
        if (current !== undefined) renderCompilation(current);
        status.textContent = "Local server ready.";
      } catch (error) {
        library.innerHTML =
          "<p>Server local chưa sẵn sàng. Authored demo vẫn có thể chơi.</p>";
        showError(error);
      }
    }

    function productionAssets(
      assets: readonly SpeechAssetView[],
    ): SpeechAssetView[] {
      return speechManifest.audioAssets.flatMap((manifestAsset) => {
        const match = assets.find(
          (asset) => asset.cacheKey === manifestAsset.cacheKey,
        );
        return match === undefined ? [] : [match];
      });
    }

    function renderSpeech(assets: readonly SpeechAssetView[]): void {
      speechReview.replaceChildren();
      const productionDisabled =
        !M8_LAST_TRAIN_RUNTIME_ACTIVATION_APPROVED ||
        assets.length !== speechManifest.audioAssets.length ||
        assets.some((asset) => asset.status !== "READY");
      playProductionGuided.disabled = productionDisabled;
      playProductionImmersive.disabled = productionDisabled;
      if (assets.length === 0) {
        const message = document.createElement("p");
        message.textContent =
          "Not prepared. Register the four exact approved utterances first.";
        speechReview.append(message);
        return;
      }
      assets.forEach(renderSpeechAsset);
    }

    function renderSpeechAsset(asset: SpeechAssetView): void {
      const item = document.createElement("article");
      item.className = "speech-review-item";
      const reference = asset.references.find(
        (item) => item.lessonId === speechManifest.lessonId,
      );
      const utterance = document.createElement("p");
      utterance.lang = "ja";
      utterance.textContent = asset.textJa;
      const identity = document.createElement("small");
      identity.textContent = `${reference?.audioAssetId ?? "unbound asset"} · ${asset.cacheKey}`;
      const summary = document.createElement("p");
      summary.className = "review-summary";
      summary.textContent = `${asset.status} · ${asset.voiceProfileId} · ${asset.durationMs ?? "—"} ms · attempt ${asset.attemptCount}`;
      const detail = document.createElement("small");
      detail.textContent = asset.failureCode
        ? `Failure: ${asset.failureCode}`
        : `Query SHA-256: ${asset.querySha256 ?? "pending"} · WAV SHA-256: ${asset.wavSha256 ?? "pending"} · ${asset.byteLength ?? "—"} bytes · Credit: ${asset.credit}`;
      item.append(utterance, identity, summary, detail);

      if (asset.status === "REVIEW_REQUIRED" || asset.status === "READY") {
        const audio = document.createElement("audio");
        audio.controls = true;
        audio.preload = "metadata";
        audio.src = `/api/v1/audio/speech/jobs/${encodeURIComponent(asset.cacheKey)}/preview`;
        item.append(audio);
      }
      if (asset.status === "REVIEW_REQUIRED") {
        const actions = document.createElement("div");
        actions.className = "handoff-actions";
        const approve = button("Approve exact reviewed WAV");
        approve.classList.add("primary-button");
        approve.addEventListener(
          "click",
          () =>
            void authoringClient
              .reviewSpeech(asset.cacheKey, "APPROVE")
              .then(() => refresh())
              .catch(showError),
        );
        const reject = button("Reject WAV");
        reject.addEventListener(
          "click",
          () =>
            void authoringClient
              .reviewSpeech(asset.cacheKey, "REJECT")
              .then(() => refresh())
              .catch(showError),
        );
        actions.append(approve, reject);
        item.append(actions);
      }
      if (asset.status === "FAILED") {
        const retry = button("Retry failed generation");
        retry.addEventListener(
          "click",
          () =>
            void authoringClient
              .retrySpeech(asset.cacheKey)
              .then(() => refresh())
              .catch(showError),
        );
        item.append(retry);
      }
      speechReview.append(item);
    }

    function renderCompilation(compilation: CompilationView): void {
      handoff.hidden = false;
      handoff.replaceChildren();
      const heading = document.createElement("div");
      heading.className = "library-heading";
      const title = document.createElement("div");
      const eyebrow = document.createElement("p");
      eyebrow.className = "eyebrow";
      eyebrow.textContent = `Attempt ${compilation.attempt} · ${compilation.status}`;
      const name = document.createElement("h2");
      name.textContent = compilation.compilationId;
      title.append(eyebrow, name);
      heading.append(title);
      handoff.append(heading);

      const disclosure = document.createElement("p");
      disclosure.className = "data-disclosure";
      disclosure.textContent = compilation.request.dataPolicy.disclosure;
      handoff.append(disclosure);

      if (
        compilation.status === "AWAITING_AUTHORING" ||
        compilation.status === "REPAIR_REQUIRED"
      ) {
        const instructions = document.createElement("ol");
        instructions.innerHTML =
          "<li>Download request JSON.</li><li>Mở conversation mới và gọi <code>$bunbun-lesson-authoring</code>.</li><li>Đính kèm request rồi lưu đúng JSON response.</li><li>Chọn file response bên dưới.</li>";
        const actions = document.createElement("div");
        actions.className = "handoff-actions";
        const download = button(
          compilation.status === "REPAIR_REQUIRED"
            ? "Download repair request"
            : "Download request",
        );
        download.classList.add("primary-button");
        download.addEventListener(
          "click",
          () => void downloadRequest(compilation),
        );
        const fileLabel = document.createElement("label");
        fileLabel.className = "file-picker";
        fileLabel.textContent = "Import result .json";
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".json,application/json";
        fileInput.addEventListener(
          "change",
          () => void importFile(compilation, fileInput),
        );
        fileLabel.append(fileInput);
        actions.append(download, fileLabel);
        handoff.append(instructions, actions);
      }

      if (compilation.diagnostics.length > 0) {
        const list = document.createElement("ul");
        list.className = "diagnostic-list";
        compilation.diagnostics.forEach((item) => {
          const entry = document.createElement("li");
          entry.textContent = `${item.code} · ${item.path} · ${item.message}`;
          list.append(entry);
        });
        handoff.append(list);
      }

      if (compilation.review !== undefined) {
        const review = document.createElement("div");
        review.className = "review-summary";
        const reviewTitle = document.createElement("h3");
        reviewTitle.textContent = compilation.review.title.ja;
        const support = document.createElement("p");
        support.textContent =
          compilation.review.title.support ??
          compilation.review.objective.support ??
          "Ready for local review";
        const meta = document.createElement("p");
        meta.textContent = `${compilation.review.targetLabels.join(" · ")} · ${compilation.review.stepCount} steps · ${compilation.review.promptModules.map((module) => `${module.id}@${module.version}`).join(" · ")}`;
        review.append(reviewTitle, support, meta);
        handoff.append(review);
      }

      if (compilation.status === "READY_FOR_REVIEW") {
        const publish = button("Publish reviewed lesson");
        publish.classList.add("primary-button");
        publish.addEventListener("click", () => {
          publish.disabled = true;
          void authoringClient
            .publish(compilation.compilationId)
            .then((next) => {
              renderCompilation(next);
              return refresh();
            })
            .catch(showError);
        });
        handoff.append(publish);
      }
      if (
        compilation.status === "PUBLISHED" &&
        compilation.lesson !== undefined
      ) {
        const play = button("Play published lesson");
        play.classList.add("primary-button");
        play.addEventListener(
          "click",
          () => void playPublished(compilation.lesson!),
        );
        handoff.append(play);
      }
    }

    function renderLibrary(lessons: PublishedLessonSummary[]): void {
      library.replaceChildren();
      if (lessons.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "Chưa có compiled lesson nào được publish.";
        library.append(empty);
        return;
      }
      lessons.forEach((lesson) => {
        const card = document.createElement("article");
        card.className = "lesson-library-item";
        const text = document.createElement("div");
        const title = document.createElement("h3");
        title.textContent = lesson.title.ja;
        const support = document.createElement("p");
        support.textContent =
          lesson.title.support ??
          `${lesson.lessonId} · revision ${lesson.revision}`;
        text.append(title, support);
        const play = button("Play");
        play.addEventListener("click", () => void playPublished(lesson));
        card.append(text, play);
        library.append(card);
      });
    }

    async function downloadRequest(
      compilation: CompilationView,
    ): Promise<void> {
      try {
        const request = await authoringClient.getRequest(
          compilation.compilationId,
        );
        const blob = new Blob([`${JSON.stringify(request, null, 2)}\n`], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${compilation.compilationId}.attempt-${compilation.attempt}.request.json`;
        link.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        showError(error);
      }
    }

    async function importFile(
      compilation: CompilationView,
      input: HTMLInputElement,
    ): Promise<void> {
      const file = input.files?.[0];
      if (file === undefined) return;
      if (
        !file.name.toLowerCase().endsWith(".json") ||
        file.size > 256 * 1024
      ) {
        showError(new Error("Chỉ nhận file .json tối đa 256 KiB."));
        input.value = "";
        return;
      }
      setBusy("Đang hash và validate file local…");
      try {
        const next = await authoringClient.importResult(
          compilation.compilationId,
          file.name,
          await file.text(),
        );
        renderCompilation(next);
        status.textContent =
          next.status === "READY_FOR_REVIEW"
            ? "Result hợp lệ. Hãy review trước khi Publish."
            : `Import kết thúc ở trạng thái ${next.status}.`;
      } catch (error) {
        showError(error);
      }
      input.value = "";
    }

    async function playPublished(lesson: {
      lessonId: string;
      revision: number;
    }): Promise<void> {
      setBusy("Đang tải và kiểm tra published package…");
      try {
        resolve({
          kind: "PUBLISHED",
          lessonPackage: await authoringClient.loadLesson(
            lesson.lessonId,
            lesson.revision,
          ),
        });
      } catch (error) {
        showError(error);
      }
    }

    function setBusy(message: string): void {
      status.dataset.state = "busy";
      status.textContent = message;
    }
    function showError(error: unknown): void {
      status.dataset.state = "error";
      status.textContent =
        error instanceof Error ? error.message : "Authoring action failed.";
    }
  });
}

function button(label: string): HTMLButtonElement {
  const element = document.createElement("button");
  element.type = "button";
  element.textContent = label;
  return element;
}

function required<ElementType extends Element>(
  root: ParentNode,
  selector: string,
): ElementType {
  const element = root.querySelector<ElementType>(selector);
  if (element === null)
    throw new Error(`Required authoring UI element was not found: ${selector}`);
  return element;
}
