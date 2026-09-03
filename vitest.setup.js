// Vitest runs jsdom tests against a `window` global that Vitest populated by
// copying descriptors from the real jsdom window. jsdom's `localStorage`
// getter is bound to internal slots of the real window instance, so on the
// copied global it evaluates to `undefined` (while `sessionStorage` survives
// as a plain property). This re-exposes the real storage objects on the test
// global so persistence tests can run. It is a no-op under the `node`
// environment, where `globalThis.jsdom` does not exist.
if (globalThis.jsdom && globalThis.jsdom.window) {
  const real = globalThis.jsdom.window;
  for (const key of ["localStorage", "sessionStorage"]) {
    const value = real[key];
    if (value !== undefined && globalThis[key] === undefined) {
      const descriptor = { value, configurable: true, writable: true };
      Object.defineProperty(globalThis, key, descriptor);
      Object.defineProperty(globalThis.window, key, descriptor);
    }
  }
}
