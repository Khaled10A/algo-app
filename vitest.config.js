import { defineConfig } from "vitest/config";

// Vitest configuration, kept separate from the Vite build config so the
// build pipeline (vite.config.js) and the test pipeline (vitest.config.js)
// can evolve independently.
export default defineConfig({
  test: {
    // Repairs window.localStorage/sessionStorage under Vitest's jsdom
    // environment (see ./vitest.setup.js).
    setupFiles: ["./vitest.setup.js"],
  },
});
