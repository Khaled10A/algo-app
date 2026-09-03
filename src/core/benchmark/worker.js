import { executeSpec } from "./jobs";

self.onmessage = (event) => {
  const spec = event.data;
  try {
    const results = executeSpec(spec);
    self.postMessage({ ok: true, results });
  } catch (err) {
    self.postMessage({ ok: false, error: String((err && err.message) || err) });
  }
};
