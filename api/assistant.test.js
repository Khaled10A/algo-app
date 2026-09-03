// @vitest-environment node
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";

/**
 * Structural tests for the serverless AI proxy: routing, validation,
 * rate limiting and secret handling — with fetch never called because
 * GROQ_API_KEY is unset.
 */

function mockRes() {
  const res = {
    statusCode: 0,
    headers: {},
    body: null,
    setHeader(k, v) {
      res.headers[k.toLowerCase()] = v;
    },
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(payload) {
      res.body = payload;
      return res;
    },
    end() {
      return res;
    },
  };
  return res;
}

function mockReq({
  method = "POST",
  body = { messages: [{ role: "user", content: "hi" }] },
  ip = "1.2.3.4",
} = {}) {
  return {
    method,
    body,
    headers: { "x-forwarded-for": ip },
    socket: { remoteAddress: ip },
  };
}

const ORIGINAL_KEY = process.env.GROQ_API_KEY;

afterEach(() => {
  vi.resetModules();
  delete process.env.GROQ_API_KEY;
});

afterAll(() => {
  if (ORIGINAL_KEY !== undefined) process.env.GROQ_API_KEY = ORIGINAL_KEY;
});

async function loadHandler() {
  const mod = await import("../../../api/assistant.js?fresh=" + Math.random());
  return mod.default;
}

describe("AI assistant endpoint", () => {
  it("returns 405 for GET requests", async () => {
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({ method: "GET" }), res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 501 without leaking any key material when unconfigured", async () => {
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq(), res);
    expect(res.statusCode).toBe(501);
    expect(JSON.stringify(res.body)).toMatch(/not configured/i);
    expect(JSON.stringify(res.body)).not.toMatch(/groq_[A-Za-z0-9]+/);
  });

  it("rejects non-array and oversized message payloads", async () => {
    const handler = await loadHandler();

    const resNoMessages = mockRes();
    await handler(mockReq({ body: {} }), resNoMessages);
    expect(resNoMessages.statusCode).toBe(400);

    const resTooMany = mockRes();
    const many = Array.from({ length: 25 }, (_, i) => ({
      role: "user",
      content: "x",
    }));
    await handler(mockReq({ body: { messages: many } }), resTooMany);
    expect(resTooMany.statusCode).toBe(413);

    const resBadContent = mockRes();
    await handler(
      mockReq({ body: { messages: [{ role: "user", content: 42 }] } }),
      resBadContent,
    );
    expect(resBadContent.statusCode).toBe(400);
  });

  it("rate limits per client IP before touching configuration", async () => {
    const handler = await loadHandler();
    let lastCode = 0;
    for (let i = 0; i < 20; i++) {
      const res = mockRes();
      await handler(mockReq({ ip: "9.9.9.9" }), res);
      lastCode = res.statusCode;
    }
    expect(lastCode).toBe(429);

    const otherIp = mockRes();
    await handler(mockReq({ ip: "8.8.8.8" }), otherIp);
    expect(otherIp.statusCode).toBe(501);
  });

  it("never sets credentials CORS header and defaults to same-origin (no wildcard)", async () => {
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq(), res);
    expect(res.headers["access-control-allow-credentials"]).toBeUndefined();
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
