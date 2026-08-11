import "./style.css";

import { LESSON_MANIFEST_SCHEMA_VERSION } from "@bunbun/contracts/version";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Bunbun app root was not found.");
}

app.innerHTML = `
  <main class="shell">
    <section class="hero" aria-labelledby="bunbun-title">
      <p class="eyebrow">ローカル開発環境</p>
      <h1 id="bunbun-title">Bunbun</h1>
      <p class="summary">
        The local TypeScript foundation is ready. Gameplay arrives in the next
        roadmap milestones.
      </p>
    </section>

    <section class="status-card" aria-labelledby="foundation-status">
      <div>
        <p class="status-label">Milestone 1</p>
        <h2 id="foundation-status">Project foundation</h2>
      </div>
      <span class="status-pill">Local</span>

      <dl class="service-list">
        <div>
          <dt>Web client</dt>
          <dd>Vite + vanilla TypeScript</dd>
        </div>
        <div>
          <dt>Server</dt>
          <dd><a href="http://127.0.0.1:3000/health">GET /health</a></dd>
        </div>
        <div>
          <dt>Contracts</dt>
          <dd>LessonManifest ${LESSON_MANIFEST_SCHEMA_VERSION}</dd>
        </div>
      </dl>
    </section>
  </main>
`;
