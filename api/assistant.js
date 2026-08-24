const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";
const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 8000;

// Best-effort per-instance rate limit. Vercel serverless instances are
// ephemeral and may scale out, so this bounds abuse per warm instance
// rather than globally. It requires no shared state or external store.
const RATE_LIMIT = { windowMs: 60_000, maxRequests: 15 };
const buckets = new Map();

function rateLimit(ip) {
  const now = Date.now();
  const bucket = buckets.get(ip) || { count: 0, resetAt: now + RATE_LIMIT.windowMs };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_LIMIT.windowMs;
  }
  bucket.count += 1;
  buckets.set(ip, bucket);
  if (buckets.size > 10_000) {
    for (const [key, b] of buckets) {
      if (now > b.resetAt) buckets.delete(key);
    }
  }
  return bucket.count <= RATE_LIMIT.maxRequests;
}

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

export default async function handler(req, res) {
  // Same-origin requests need no CORS headers; when ALLOWED_ORIGIN is set
  // explicitly we allow that single origin without credentials.
  if (process.env.ALLOWED_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!rateLimit(clientIp(req))) {
    return res.status(429).json({ error: "Too many requests — please wait a minute and try again." });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(501).json({
      error:
        "The AI assistant is not configured on this deployment. The owner must set GROQ_API_KEY as a server-side environment variable.",
    });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
  }

  const rawMessages = Array.isArray(body?.messages) ? body.messages : null;
  if (!rawMessages || rawMessages.length === 0) {
    return res.status(400).json({ error: "messages[] is required" });
  }
  if (rawMessages.length > MAX_MESSAGES) {
    return res.status(413).json({ error: `Too many messages (max ${MAX_MESSAGES})` });
  }

  const messages = [];
  for (const m of rawMessages) {
    if (!m || typeof m.content !== "string") {
      return res.status(400).json({ error: "Each message needs a string content field" });
    }
    const role = ["system", "user", "assistant"].includes(m.role) ? m.role : "user";
    messages.push({
      role,
      content: m.content.slice(0, MAX_CONTENT_LENGTH),
    });
  }

  try {
    const upstream = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        messages,
      }),
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const detail =
        data?.error?.message || `Upstream request failed with status ${upstream.status}`;
      return res.status(upstream.status === 429 ? 429 : 502).json({ error: detail });
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return res.status(502).json({ error: "Malformed response from model provider" });
    }

    return res.status(200).json({ content });
  } catch (err) {
    return res.status(502).json({
      error: "Could not reach the AI provider",
      detail: String((err && err.message) || err),
    });
  }
}
