// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Exercises the real worker module's message protocol in Node by
 * shimming `self` the way a WorkerGlobalScope would. No browser needed.
 */

const replies = [];
let posted = null;

class FakeWorkerScope {
  set onmessage(fn) {
    this._onmessage = fn;
  }
  get onmessage() {
    return this._onmessage;
  }
  postMessage(msg) {
    replies.push(msg);
    return posted?.(msg);
  }
}

const fakeSelf = new FakeWorkerScope();
const originalSelf = globalThis.self;

beforeAll(async () => {
  globalThis.self = fakeSelf;
  await import("./worker.js");
});

afterAll(() => {
  globalThis.self = originalSelf;
});

function send(spec) {
  replies.length = 0;
  fakeSelf.onmessage({ data: spec });
  return replies[0];
}

function wireToPromise(spec) {
  return new Promise((resolve, reject) => {
    posted = (msg) => {
      if (msg.ok) resolve(msg.results);
      else reject(new Error(msg.error));
    };
    fakeSelf.onmessage({ data: JSON.parse(JSON.stringify(spec)) });
  });
}

describe("benchmark worker protocol", () => {
  it("replies { ok: true, results } to a valid job and survives JSON round-trip", async () => {
    const results = await wireToPromise({
      kind: "sorting",
      algoIds: ["insertion-sort"],
      types: ["random"],
      sizes: [10],
      inputMode: "random",
      repeats: 1,
      warmup: 0,
    });
    const point = results["insertion-sort"].random[0];
    expect(point).toMatchObject({ n: 10 });
    expect(typeof point.time).toBe("number");
    expect(point.comparisons).toBeGreaterThan(0);
  });

  it("replies search-file points including collected matches", async () => {
    const reply = send(
      JSON.parse(
        JSON.stringify({
          kind: "search-file",
          algoIds: ["kmp"],
          pattern: "ab",
          text: "abab",
          repeats: 1,
        }),
      ),
    );
    expect(reply.ok).toBe(true);
    expect(reply.results.kmp.file[0].matches).toEqual([0, 2]);
  });

  it("replies { ok: false, error } for an unknown job kind", () => {
    const reply = send({ kind: "quantum-sort", algoIds: ["kmp"] });
    expect(reply.ok).toBe(false);
    expect(String(reply.error)).toMatch(/Unknown benchmark.*kind/i);
  });

  it("replies { ok: false, error } for a non-benchmarkable algorithm id", () => {
    const reply = send({
      kind: "sorting",
      algoIds: ["dfs"],
      types: ["random"],
      sizes: [10],
      inputMode: "random",
    });
    expect(reply.ok).toBe(false);
    expect(String(reply.error)).toMatch(/not benchmarkable/i);
  });

  it("replies { ok: false, error } when no algorithms are selected", () => {
    const reply = send({
      kind: "sorting",
      algoIds: [],
      types: ["random"],
      sizes: [10],
      inputMode: "random",
    });
    expect(reply.ok).toBe(false);
    expect(String(reply.error)).toMatch(/No algorithms selected/i);
  });

  it("keeps replies JSON-serializable (plain data across postMessage)", async () => {
    const results = await wireToPromise({
      kind: "sorting",
      algoIds: ["merge-sort"],
      types: ["sorted"],
      sizes: [8],
      inputMode: "random",
      repeats: 1,
      warmup: 0,
    });
    const roundTripped = JSON.parse(JSON.stringify(results));
    expect(roundTripped).toEqual(results);
  });
});
