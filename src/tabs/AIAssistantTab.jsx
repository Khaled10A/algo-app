import { useState, useRef, useEffect } from "react";

// ── SYSTEM PROMPT ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert algorithms teaching assistant embedded inside "Algo Benchmark", an interactive app for learning sorting and string-matching algorithms.

The app covers:
SORTING: Bubble Sort, Insertion Sort, Selection Sort, Merge Sort, Quick Sort
STRING MATCHING: Brute Force, KMP (Knuth-Morris-Pratt), Horspool (Boyer-Moore-Horspool)

You have FOUR modes — always stay in the mode the user requests:

1. EXPLAIN STEP — When given a debugger step description, explain what is happening in simple, friendly language. Be concise (2-4 sentences). Focus on WHY, not just what.

2. ANALYZE RESULTS — When given benchmark results (JSON), analyze them: identify the winner, explain why it won, mention Big-O context, and point out any surprising results.

3. Q&A — Answer any question about the algorithms above. Be accurate, clear, and use examples when helpful. Keep answers under 150 words unless the question is complex.

4. RECOMMEND — When given data characteristics (size, type, sorted/random/etc.), recommend the best algorithm and explain why in 3-4 sentences.

Always respond in the same language the user writes in (Arabic or English).
Keep responses focused and educational. Use emoji sparingly for clarity (✅ ❌ ⚡).
Never write long walls of text — be a tutor, not a textbook.`;

// ── CALL CLAUDE API ────────────────────────────────────────────────────────────
async function callClaude(messages) {
  const lastMsg = messages[messages.length - 1].content;
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [...history, { role: "user", parts: [{ text: lastMsg }] }],
        generationConfig: { maxOutputTokens: 1000 },
      }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates[0].content.parts[0].text;
}

// ── QUICK ACTION BUTTONS ───────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: "⚡ Explain KMP", prompt: "Explain how KMP search works and why it's faster than brute force." },
  { label: "📊 Compare sorts", prompt: "Compare Merge Sort vs Quick Sort — when should I use each?" },
  { label: "🎯 Best for random data?", prompt: "Which sorting algorithm is best for random unsorted data and why?" },
  { label: "🔍 Horspool vs KMP", prompt: "What is the difference between Horspool and KMP string matching?" },
  { label: "📈 Big-O summary", prompt: "Give me a quick Big-O complexity summary for all sorting algorithms in this app." },
  { label: "🧩 Explain LPS table", prompt: "Explain what the LPS (Longest Proper Prefix Suffix) table is in KMP and how it helps." },
];

// ── RECOMMEND FORM ─────────────────────────────────────────────────────────────
function RecommendForm({ onSubmit, isDark, accentColor, border, textMute, cardBg, codeBg, textMain }) {
  const [size, setSize] = useState("medium");
  const [order, setOrder] = useState("random");
  const [goal, setGoal] = useState("speed");
  const [task, setTask] = useState("sorting");

  function buildPrompt() {
    return `I need algorithm recommendation for:
- Task: ${task}
- Data size: ${size} (small=<100, medium=100-10000, large=>10000)
- Data order: ${order}
- Priority: ${goal}
Please recommend the best algorithm and explain why.`;
  }

  const sel = (label, val, set, opts) => (
    <div>
      <div style={{ fontSize: 8, color: textMute, letterSpacing: 2, marginBottom: 5 }}>{label}</div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {opts.map(([v, l]) => (
          <button key={v} onClick={() => set(v)} style={{
            padding: "4px 10px", borderRadius: 5, fontSize: 10, cursor: "pointer",
            fontFamily: "monospace", border: `1px solid ${val === v ? accentColor : border}`,
            background: val === v ? `${accentColor}20` : "transparent",
            color: val === v ? accentColor : textMute,
          }}>{l}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 9, color: accentColor, letterSpacing: 2, fontWeight: "bold" }}>🎯 ALGORITHM RECOMMENDER</div>
      {sel("TASK", task, setTask, [["sorting", "Sorting"], ["matching", "String Matching"]])}
      {sel("DATA SIZE", size, setSize, [["small", "Small"], ["medium", "Medium"], ["large", "Large"]])}
      {sel("DATA ORDER", order, setOrder, [["random", "Random"], ["nearly_sorted", "Nearly Sorted"], ["sorted", "Sorted"], ["reverse", "Reverse"]])}
      {sel("PRIORITY", goal, setGoal, [["speed", "Speed"], ["memory", "Low Memory"], ["stability", "Stability"]])}
      <button onClick={() => onSubmit(buildPrompt())} style={{
        padding: "8px", borderRadius: 7, border: "none",
        background: `linear-gradient(135deg,${accentColor},#818cf8)`,
        color: "#fff", fontSize: 10, cursor: "pointer", fontFamily: "monospace",
        fontWeight: "bold", letterSpacing: 1,
      }}>⚡ GET RECOMMENDATION</button>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export function AIAssistantTab({ isDark, sortResults, searchResults, debugStep }) {
  const bg       = isDark ? "#020817" : "#f8fafc";
  const cardBg   = isDark ? "#0f172a" : "#ffffff";
  const border   = isDark ? "#1e293b" : "#e2e8f0";
  const textMain = isDark ? "#e2e8f0" : "#1e293b";
  const textMute = isDark ? "#64748b" : "#94a3b8";
  const codeBg   = isDark ? "#0a0f1e" : "#f1f5f9";
  const accentColor = "#a78bfa";

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "مرحباً! 👋 أنا مساعدك الذكي لتعلم الخوارزميات. أستطيع:\n\n• **شرح خطوات الـ Debugger** — اسألني عن أي خطوة\n• **تحليل نتائج البنشمارك** — شغّل بنشمارك واضغط \"Analyze\"\n• **الإجابة على أسئلتك** — عن أي خوارزمية في التطبيق\n• **اقتراح الخوارزمية المناسبة** — بناءً على بياناتك\n\nكيف أقدر أساعدك؟",
    }
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode]       = useState("chat"); // chat | recommend
  const bottomRef             = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text) {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput("");
    setMode("chat");

    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Only send the last 10 messages to keep context manageable
      const history = newMessages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const reply = await callClaude(history);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `❌ Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  function analyzeResults() {
    if (!sortResults && !searchResults) {
      send("I haven't run any benchmarks yet. What should I run first to get meaningful results?");
      return;
    }
    const parts = [];
    if (sortResults) {
      const { results, sizes, algos, types } = sortResults;
      parts.push("SORTING BENCHMARK RESULTS:");
      algos.forEach(algo => {
        types.forEach(type => {
          const vals = results[algo][type].map(r => `n=${r.n}: ${r.time}ms (${r.comparisons} comparisons)`).join(", ");
          parts.push(`  ${algo} [${type}]: ${vals}`);
        });
      });
    }
    if (searchResults) {
      const { results, sizes, algos, scenarios } = searchResults;
      parts.push("STRING MATCHING BENCHMARK RESULTS:");
      algos.forEach(algo => {
        scenarios.forEach(sc => {
          const vals = results[algo][sc].map(r => `n=${r.n}: ${r.time}ms (${r.comparisons} comparisons)`).join(", ");
          parts.push(`  ${algo} [${sc}]: ${vals}`);
        });
      });
    }
    send("Analyze these benchmark results and tell me which algorithm won and why:\n\n" + parts.join("\n"));
  }

  // ── RENDER MESSAGE ────────────────────────────────────────
  function renderMessage(msg, i) {
    const isUser = msg.role === "user";
    const lines = msg.content.split("\n");

    return (
      <div key={i} style={{
        display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 12, gap: 8, alignItems: "flex-start",
      }}>
        {!isUser && (
          <div style={{
            width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg,#a78bfa,#38bdf8)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
          }}>🤖</div>
        )}
        <div style={{
          maxWidth: "78%",
          background: isUser ? `${accentColor}20` : cardBg,
          border: `1px solid ${isUser ? accentColor + "40" : border}`,
          borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
          padding: "10px 14px",
          fontSize: 12, lineHeight: 1.7, color: textMain,
          fontFamily: "system-ui, sans-serif",
        }}>
          {lines.map((line, li) => {
            // Bold for **text**
            const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, pi) =>
              p.startsWith("**") ? <strong key={pi} style={{ color: accentColor }}>{p.slice(2, -2)}</strong> : p
            );
            return <div key={li} style={{ marginBottom: li < lines.length - 1 ? 4 : 0 }}>{parts}</div>;
          })}
        </div>
        {isUser && (
          <div style={{
            width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
            background: `${accentColor}30`, border: `1px solid ${accentColor}40`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
          }}>👤</div>
        )}
      </div>
    );
  }

  // ── LAYOUT ────────────────────────────────────────────────
  return (
    <div style={{ color: textMain, display: "flex", flexDirection: "column", height: "100%", gap: 12 }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 12, letterSpacing: 2, color: accentColor, fontWeight: "bold" }}>
          🤖 AI ASSISTANT
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={analyzeResults} style={{
            padding: "5px 12px", borderRadius: 6, fontSize: 9, cursor: "pointer",
            fontFamily: "monospace", letterSpacing: 1,
            border: `1px solid ${sortResults || searchResults ? "#38bdf8" : border}`,
            background: sortResults || searchResults ? "rgba(56,189,248,0.1)" : "transparent",
            color: sortResults || searchResults ? "#38bdf8" : textMute,
          }}>📊 ANALYZE RESULTS</button>
          <button onClick={() => setMode(mode === "recommend" ? "chat" : "recommend")} style={{
            padding: "5px 12px", borderRadius: 6, fontSize: 9, cursor: "pointer",
            fontFamily: "monospace", letterSpacing: 1,
            border: `1px solid ${mode === "recommend" ? "#4ade80" : border}`,
            background: mode === "recommend" ? "rgba(74,222,128,0.1)" : "transparent",
            color: mode === "recommend" ? "#4ade80" : textMute,
          }}>🎯 RECOMMEND</button>
          <button onClick={() => setMessages([messages[0]])} style={{
            padding: "5px 12px", borderRadius: 6, fontSize: 9, cursor: "pointer",
            fontFamily: "monospace", letterSpacing: 1,
            border: `1px solid ${border}`, background: "transparent", color: textMute,
          }}>🗑 CLEAR</button>
        </div>
      </div>

      {/* RECOMMEND FORM */}
      {mode === "recommend" && (
        <RecommendForm
          onSubmit={send}
          isDark={isDark}
          accentColor="#4ade80"
          border={border}
          textMute={textMute}
          cardBg={cardBg}
          codeBg={codeBg}
          textMain={textMain}
        />
      )}

      {/* QUICK ACTIONS */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {QUICK_ACTIONS.map(({ label, prompt }) => (
          <button key={label} onClick={() => send(prompt)} style={{
            padding: "4px 10px", borderRadius: 20, fontSize: 9, cursor: "pointer",
            fontFamily: "monospace", border: `1px solid ${border}`,
            background: "transparent", color: textMute,
            transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.target.style.borderColor = accentColor; e.target.style.color = accentColor; }}
            onMouseLeave={e => { e.target.style.borderColor = border; e.target.style.color = textMute; }}
          >{label}</button>
        ))}
      </div>

      {/* CHAT WINDOW */}
      <div style={{
        flex: 1, overflowY: "auto", background: codeBg,
        border: `1px solid ${border}`, borderRadius: 10,
        padding: "16px", minHeight: 0,
      }}>
        {messages.map((m, i) => renderMessage(m, i))}

        {loading && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg,#a78bfa,#38bdf8)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
            }}>🤖</div>
            <div style={{
              background: cardBg, border: `1px solid ${border}`,
              borderRadius: "14px 14px 14px 4px", padding: "12px 16px",
              display: "flex", gap: 5, alignItems: "center",
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: accentColor, opacity: 0.8,
                  animation: `bounce 1.2s ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="اسأل عن أي خوارزمية... / Ask anything about algorithms..."
          disabled={loading}
          style={{
            flex: 1, background: cardBg, border: `1px solid ${border}`,
            borderRadius: 8, padding: "10px 14px", color: textMain,
            fontSize: 12, fontFamily: "system-ui, sans-serif", outline: "none",
            opacity: loading ? 0.6 : 1,
          }}
        />
        <button onClick={() => send()} disabled={loading || !input.trim()} style={{
          padding: "10px 20px", borderRadius: 8, border: "none",
          background: loading || !input.trim()
            ? border
            : `linear-gradient(135deg,${accentColor},#38bdf8)`,
          color: "#fff", fontSize: 13, cursor: loading || !input.trim() ? "default" : "pointer",
          transition: "all 0.2s",
        }}>➤</button>
      </div>

      {/* Bounce animation */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
