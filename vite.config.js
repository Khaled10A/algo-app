import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Strict Content-Security-Policy for the built app. The main app loads no
// remote scripts, styles, fonts or images (system font stacks only), so the
// policy is limited to 'self'. connect-src allows https: because the AI
// assistant endpoint can be pointed at a cross-origin proxy via
// VITE_AI_ENDPOINT (the default, /api/assistant, is same-origin).
const CSP_CONTENT = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

// Inject the CSP <meta> only on production builds. A static <meta> in
// index.html would also apply during `npm run dev`, where Vite injects an
// inline react-refresh preamble script and <style> tags that a strict
// script-src/style-src would block.
function cspMetaPlugin() {
  return {
    name: 'inject-csp-meta',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html) {
      const meta = `    <meta http-equiv="Content-Security-Policy" content="${CSP_CONTENT}" />\n  </head>`;
      return html.replace('</head>', meta);
    },
  };
}

export default defineConfig({
  plugins: [react(), cspMetaPlugin()],
  test: {
    // Repairs window.localStorage/sessionStorage under Vitest's jsdom
    // environment (see ./vitest.setup.js).
    setupFiles: ["./vitest.setup.js"],
  },
})
