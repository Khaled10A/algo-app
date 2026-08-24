import { useState, useRef, useEffect } from "react";
import { getAlgorithm } from "../algorithms/registry";

function algoName(id) {
  try {
    return getAlgorithm(id).name;
  } catch {
    return id;
  }
}

// ── SYSTEM PROMPTS ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPTS = {
  ar: `أنت مساعد تعليمي متخصص في الخوارزميات، مدمج داخل تطبيق "Algo Benchmark".

التطبيق يغطي:
الترتيب: Bubble Sort, Insertion Sort, Selection Sort, Merge Sort, Quick Sort
مطابقة النصوص: Brute Force, KMP, Horspool

لديك أربعة أوضاع:
1. شرح الخطوات — اشرح ما يحدث في خطوة الـ Debugger بلغة بسيطة (2-4 جمل)
2. تحليل النتائج — حلّل نتائج البنشمارك، حدد الفائز، واشرح السبب مع السياق النظري
3. الإجابة على الأسئلة — أجب على أي سؤال عن الخوارزميات بدقة ووضوح
4. التوصية — اقترح أفضل خوارزمية بناءً على خصائص البيانات

يجب أن تكتب دائماً باللغة العربية الفصحى مع ترك أسماء الخوارزميات بالإنجليزية.
لا تكتب فقرات طويلة — كن مختصراً ومفيداً كالمعلم لا كالكتاب.
استخدم الرموز بحكمة: ✅ ❌ ⚡`,

  en: `You are an expert algorithms teaching assistant embedded inside "Algo Benchmark".

The app covers:
SORTING: Bubble Sort, Insertion Sort, Selection Sort, Merge Sort, Quick Sort
STRING MATCHING: Brute Force, KMP (Knuth-Morris-Pratt), Horspool

You have FOUR modes:
1. EXPLAIN STEP — explain debugger steps in simple language (2-4 sentences)
2. ANALYZE RESULTS — analyze benchmark results, identify winner, explain with Big-O context
3. Q&A — answer any algorithm question accurately and clearly
4. RECOMMEND — suggest the best algorithm based on data characteristics

Always respond in English. Keep answers under 150 words unless complex.
Be a tutor, not a textbook. Use emoji sparingly: ✅ ❌ ⚡`,

  fr: `Tu es un assistant pédagogique expert en algorithmes, intégré dans "Algo Benchmark".

L'application couvre:
TRI: Bubble Sort, Insertion Sort, Selection Sort, Merge Sort, Quick Sort
RECHERCHE DE CHAÎNES: Brute Force, KMP, Horspool

Tu as quatre modes:
1. EXPLIQUER UNE ÉTAPE — explique ce qui se passe dans le débogueur (2-4 phrases)
2. ANALYSER LES RÉSULTATS — analyse les benchmarks et identifie le gagnant
3. Q&R — réponds aux questions sur les algorithmes avec précision
4. RECOMMANDER — suggère le meilleur algorithme selon les données

Réponds toujours en français. Sois concis et pédagogique. Utilise les emojis avec parcimonie: ✅ ❌ ⚡`,

  de: `Du bist ein Algorithmen-Lernassistent in "Algo Benchmark".

Die App behandelt:
SORTIERUNG: Bubble Sort, Insertion Sort, Selection Sort, Merge Sort, Quick Sort
STRING-MATCHING: Brute Force, KMP, Horspool

Du hast vier Modi:
1. SCHRITT ERKLÄREN — erkläre Debugger-Schritte einfach (2-4 Sätze)
2. ERGEBNISSE ANALYSIEREN — analysiere Benchmark-Ergebnisse und nenne den Gewinner
3. FRAGEN BEANTWORTEN — beantworte Algorithmen-Fragen präzise
4. EMPFEHLEN — empfehle den besten Algorithmus basierend auf den Daten

Antworte immer auf Deutsch. Sei prägnant. Nutze Emojis sparsam: ✅ ❌ ⚡`,
};

const LANG_OPTIONS = [
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

const WELCOME_MESSAGES = {
  ar: "مرحباً! 👋 أنا مساعدك الذكي لتعلم الخوارزميات. أستطيع:\n\n• **شرح خطوات الـ Debugger** — اسألني عن أي خطوة\n• **تحليل نتائج البنشمارك** — شغّل بنشمارك واضغط \"Analyze\"\n• **الإجابة على أسئلتك** — عن أي خوارزمية في التطبيق\n• **اقتراح الخوارزمية المناسبة** — بناءً على بياناتك\n\nكيف أقدر أساعدك؟",
  en: "Hello! 👋 I'm your AI assistant for learning algorithms. I can:\n\n• **Explain Debugger steps** — ask me about any step\n• **Analyze benchmark results** — run a benchmark and click \"Analyze\"\n• **Answer your questions** — about any algorithm in the app\n• **Recommend the best algorithm** — based on your data\n\nHow can I help you?",
  fr: "Bonjour! 👋 Je suis ton assistant IA pour apprendre les algorithmes. Je peux:\n\n• **Expliquer les étapes du Debugger** — pose-moi des questions\n• **Analyser les résultats** — lance un benchmark et clique \"Analyze\"\n• **Répondre à tes questions** — sur n'importe quel algorithme\n• **Recommander le meilleur algorithme** — selon tes données\n\nComment puis-je t'aider?",
  de: "Hallo! 👋 Ich bin dein KI-Assistent zum Lernen von Algorithmen. Ich kann:\n\n• **Debugger-Schritte erklären** — frag mich über jeden Schritt\n• **Benchmark-Ergebnisse analysieren** — führe einen Benchmark durch\n• **Deine Fragen beantworten** — über jeden Algorithmus\n• **Den besten Algorithmus empfehlen** — basierend auf deinen Daten\n\nWie kann ich dir helfen?",
};

const PLACEHOLDERS = {
  ar: "اسأل عن أي خوارزمية...",
  en: "Ask anything about algorithms...",
  fr: "Posez une question sur les algorithmes...",
  de: "Fragen Sie über Algorithmen...",
};

// ── CALL AI ASSISTANT ENDPOINT (server-side proxy holds the key) ───────────────
async function callAssistant(messages, lang) {
  const endpoint = import.meta.env.VITE_AI_ENDPOINT || "/api/assistant";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "system", content: SYSTEM_PROMPTS[lang] }, ...messages],
    }),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    
  }
  if (!res.ok || data?.error) {
    throw new Error(data?.error || `AI request failed (${res.status})`);
  }
  return data.content;
}

// ── QUICK ACTIONS ──────────────────────────────────────────────────────────────
const QUICK_ACTIONS = {
  ar: [
    { label: "⚡ شرح KMP", prompt: "اشرح كيف يعمل KMP ولماذا هو أسرع من Brute Force." },
    { label: "📊 مقارنة الترتيب", prompt: "قارن بين Merge Sort و Quick Sort — متى أستخدم كل منهما؟" },
    { label: "🎯 الأفضل للبيانات العشوائية؟", prompt: "أي خوارزمية ترتيب هي الأفضل للبيانات العشوائية ولماذا؟" },
    { label: "🔍 Horspool مقابل KMP", prompt: "ما الفرق بين Horspool و KMP في مطابقة النصوص؟" },
    { label: "📈 ملخص Big-O", prompt: "أعطني ملخصاً سريعاً لتعقيد Big-O لجميع خوارزميات الترتيب." },
    { label: "🧩 شرح جدول LPS", prompt: "اشرح ما هو جدول LPS في KMP وكيف يساعد." },
  ],
  en: [
    { label: "⚡ Explain KMP", prompt: "Explain how KMP search works and why it's faster than brute force." },
    { label: "📊 Compare sorts", prompt: "Compare Merge Sort vs Quick Sort — when should I use each?" },
    { label: "🎯 Best for random data?", prompt: "Which sorting algorithm is best for random unsorted data and why?" },
    { label: "🔍 Horspool vs KMP", prompt: "What is the difference between Horspool and KMP string matching?" },
    { label: "📈 Big-O summary", prompt: "Give me a quick Big-O complexity summary for all sorting algorithms." },
    { label: "🧩 Explain LPS table", prompt: "Explain what the LPS table is in KMP and how it helps." },
  ],
  fr: [
    { label: "⚡ Expliquer KMP", prompt: "Explique comment fonctionne KMP et pourquoi c'est plus rapide que Brute Force." },
    { label: "📊 Comparer les tris", prompt: "Compare Merge Sort et Quick Sort — quand utiliser chacun?" },
    { label: "🎯 Meilleur pour données aléatoires?", prompt: "Quel algorithme de tri est le meilleur pour des données aléatoires?" },
    { label: "🔍 Horspool vs KMP", prompt: "Quelle est la différence entre Horspool et KMP?" },
    { label: "📈 Résumé Big-O", prompt: "Donne-moi un résumé rapide de la complexité Big-O de tous les algorithmes." },
    { label: "🧩 Table LPS", prompt: "Explique ce qu'est la table LPS dans KMP et comment elle aide." },
  ],
  de: [
    { label: "⚡ KMP erklären", prompt: "Erkläre wie KMP funktioniert und warum es schneller als Brute Force ist." },
    { label: "📊 Sortierungen vergleichen", prompt: "Vergleiche Merge Sort und Quick Sort — wann verwende ich welchen?" },
    { label: "🎯 Bester für zufällige Daten?", prompt: "Welcher Sortieralgorithmus ist am besten für zufällige Daten?" },
    { label: "🔍 Horspool vs KMP", prompt: "Was ist der Unterschied zwischen Horspool und KMP?" },
    { label: "📈 Big-O Zusammenfassung", prompt: "Gib mir eine schnelle Big-O Komplexitätszusammenfassung." },
    { label: "🧩 LPS Tabelle", prompt: "Erkläre was die LPS-Tabelle in KMP ist und wie sie hilft." },
  ],
};

// ── RECOMMEND FORM ─────────────────────────────────────────────────────────────
function RecommendForm({ onSubmit, isDark, accentColor, border, textMute, cardBg, lang }) {
  const [size, setSize]   = useState("medium");
  const [order, setOrder] = useState("random");
  const [goal, setGoal]   = useState("speed");
  const [task, setTask]   = useState("sorting");

  const LABELS = {
    ar: { title: "🎯 موصي الخوارزميات", task: "المهمة", size: "حجم البيانات", order: "ترتيب البيانات", priority: "الأولوية", btn: "⚡ احصل على التوصية",
          sorting: "ترتيب", matching: "مطابقة نصوص", small: "صغير", medium: "متوسط", large: "كبير",
          random: "عشوائي", nearly_sorted: "شبه مرتب", sorted: "مرتب", reverse: "معكوس",
          speed: "السرعة", memory: "ذاكرة منخفضة", stability: "الاستقرار" },
    en: { title: "🎯 ALGORITHM RECOMMENDER", task: "TASK", size: "DATA SIZE", order: "DATA ORDER", priority: "PRIORITY", btn: "⚡ GET RECOMMENDATION",
          sorting: "Sorting", matching: "String Matching", small: "Small", medium: "Medium", large: "Large",
          random: "Random", nearly_sorted: "Nearly Sorted", sorted: "Sorted", reverse: "Reverse",
          speed: "Speed", memory: "Low Memory", stability: "Stability" },
    fr: { title: "🎯 RECOMMANDEUR D'ALGORITHMES", task: "TÂCHE", size: "TAILLE DES DONNÉES", order: "ORDRE DES DONNÉES", priority: "PRIORITÉ", btn: "⚡ OBTENIR UNE RECOMMANDATION",
          sorting: "Tri", matching: "Recherche de chaînes", small: "Petit", medium: "Moyen", large: "Grand",
          random: "Aléatoire", nearly_sorted: "Presque trié", sorted: "Trié", reverse: "Inversé",
          speed: "Vitesse", memory: "Mémoire faible", stability: "Stabilité" },
    de: { title: "🎯 ALGORITHMUS-EMPFEHLER", task: "AUFGABE", size: "DATENGRÖSSE", order: "DATENREIHENFOLGE", priority: "PRIORITÄT", btn: "⚡ EMPFEHLUNG ERHALTEN",
          sorting: "Sortierung", matching: "String-Matching", small: "Klein", medium: "Mittel", large: "Groß",
          random: "Zufällig", nearly_sorted: "Fast sortiert", sorted: "Sortiert", reverse: "Umgekehrt",
          speed: "Geschwindigkeit", memory: "Wenig Speicher", stability: "Stabilität" },
  };
  const L = LABELS[lang] || LABELS.en;

  function buildPrompt() {
    return `Task: ${task}, Data size: ${size}, Data order: ${order}, Priority: ${goal}. Please recommend the best algorithm and explain why in ${lang === "ar" ? "Arabic" : lang === "fr" ? "French" : lang === "de" ? "German" : "English"}.`;
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
      <div style={{ fontSize: 9, color: accentColor, letterSpacing: 2, fontWeight: "bold" }}>{L.title}</div>
      {sel(L.task,     task,  setTask,  [["sorting", L.sorting], ["matching", L.matching]])}
      {sel(L.size,     size,  setSize,  [["small", L.small], ["medium", L.medium], ["large", L.large]])}
      {sel(L.order,    order, setOrder, [["random", L.random], ["nearly_sorted", L.nearly_sorted], ["sorted", L.sorted], ["reverse", L.reverse]])}
      {sel(L.priority, goal,  setGoal,  [["speed", L.speed], ["memory", L.memory], ["stability", L.stability]])}
      <button onClick={() => onSubmit(buildPrompt())} style={{
        padding: "8px", borderRadius: 7, border: "none",
        background: `linear-gradient(135deg,${accentColor},#818cf8)`,
        color: "#fff", fontSize: 10, cursor: "pointer", fontFamily: "monospace",
        fontWeight: "bold", letterSpacing: 1,
      }}>{L.btn}</button>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export function AIAssistantTab({ isDark, sortResults, searchResults }) {
  const bg          = isDark ? "#020817" : "#f8fafc";
  const cardBg      = isDark ? "#0f172a" : "#ffffff";
  const border      = isDark ? "#1e293b" : "#e2e8f0";
  const textMain    = isDark ? "#e2e8f0" : "#1e293b";
  const textMute    = isDark ? "#64748b" : "#94a3b8";
  const codeBg      = isDark ? "#0a0f1e" : "#f1f5f9";
  const accentColor = "#a78bfa";

  const [lang, setLang]       = useState("ar");
  const [messages, setMessages] = useState([{ role: "assistant", content: WELCOME_MESSAGES["ar"] }]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode]       = useState("chat");
  const bottomRef             = useRef(null);

  // Reset messages when language changes
  function changeLang(newLang) {
    setLang(newLang);
    setMessages([{ role: "assistant", content: WELCOME_MESSAGES[newLang] }]);
    setMode("chat");
  }

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
      const history = newMessages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const reply = await callAssistant(history, lang);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `❌ Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  function analyzeResults() {
    if (!sortResults && !searchResults) {
      send(lang === "ar" ? "لم أشغّل أي بنشمارك بعد. ماذا أشغّل أولاً؟" : "I haven't run any benchmarks yet. What should I run first?");
      return;
    }
    const parts = [];
    if (sortResults) {
      const { results, sizes, algos, types } = sortResults;
      parts.push("SORTING BENCHMARK:");
      algos.forEach(algo => {
        types.forEach(type => {
          const vals = results[algo][type].map(r => `n=${r.n}: ${r.time}ms (${r.comparisons} comparisons)`).join(", ");
          parts.push(`  ${algoName(algo)} [${type}]: ${vals}`);
        });
      });
    }
    if (searchResults) {
      const { results, sizes, algos, scenarios } = searchResults;
      parts.push("STRING MATCHING BENCHMARK:");
      algos.forEach(algo => {
        scenarios.forEach(sc => {
          const vals = results[algo][sc].map(r => `n=${r.n}: ${r.time}ms (${r.comparisons} comparisons)`).join(", ");
          parts.push(`  ${algoName(algo)} [${sc}]: ${vals}`);
        });
      });
    }
    const prefix = lang === "ar" ? "حلّل هذه النتائج وأخبرني أي خوارزمية فازت ولماذا:\n\n"
                 : lang === "fr" ? "Analysez ces résultats et dites-moi quel algorithme a gagné:\n\n"
                 : lang === "de" ? "Analysiere diese Ergebnisse und sag mir welcher Algorithmus gewonnen hat:\n\n"
                 : "Analyze these results and tell me which algorithm won and why:\n\n";
    send(prefix + parts.join("\n"));
  }

  function renderMessage(msg, i) {
    const isUser = msg.role === "user";
    const isRTL  = lang === "ar";
    const lines  = msg.content.split("\n");
    return (
      <div key={i} style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 12, gap: 8, alignItems: "flex-start",
        direction: isRTL ? "rtl" : "ltr",
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
          borderRadius: isUser
            ? (isRTL ? "14px 14px 14px 4px" : "14px 14px 4px 14px")
            : (isRTL ? "14px 14px 4px 14px" : "14px 14px 14px 4px"),
          padding: "10px 14px", fontSize: 12, lineHeight: 1.8,
          color: textMain, fontFamily: "system-ui, sans-serif",
          textAlign: isRTL ? "right" : "left",
        }}>
          {lines.map((line, li) => {
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

  const currentActions = QUICK_ACTIONS[lang] || QUICK_ACTIONS.en;
  const isRTL = lang === "ar";

  return (
    <div style={{ color: textMain, display: "flex", flexDirection: "column", height: "100%", gap: 12 }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 12, letterSpacing: 2, color: accentColor, fontWeight: "bold" }}>
          🤖 AI ASSISTANT
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>

          {/* LANGUAGE SELECTOR */}
          <div style={{
            display: "flex", gap: 3, background: codeBg,
            border: `1px solid ${border}`, borderRadius: 8, padding: "3px",
          }}>
            {LANG_OPTIONS.map(({ code, label, flag }) => (
              <button key={code} onClick={() => changeLang(code)} style={{
                padding: "4px 10px", borderRadius: 6, fontSize: 10, cursor: "pointer",
                fontFamily: "monospace", border: "none",
                background: lang === code ? accentColor : "transparent",
                color: lang === code ? "#fff" : textMute,
                transition: "all 0.15s",
              }}>{flag} {label}</button>
            ))}
          </div>

          {/* ACTION BUTTONS */}
          <button onClick={analyzeResults} style={{
            padding: "5px 12px", borderRadius: 6, fontSize: 9, cursor: "pointer",
            fontFamily: "monospace", letterSpacing: 1,
            border: `1px solid ${sortResults || searchResults ? "#38bdf8" : border}`,
            background: sortResults || searchResults ? "rgba(56,189,248,0.1)" : "transparent",
            color: sortResults || searchResults ? "#38bdf8" : textMute,
          }}>📊 {lang === "ar" ? "تحليل النتائج" : lang === "fr" ? "Analyser" : lang === "de" ? "Analysieren" : "ANALYZE"}</button>

          <button onClick={() => setMode(mode === "recommend" ? "chat" : "recommend")} style={{
            padding: "5px 12px", borderRadius: 6, fontSize: 9, cursor: "pointer",
            fontFamily: "monospace", letterSpacing: 1,
            border: `1px solid ${mode === "recommend" ? "#4ade80" : border}`,
            background: mode === "recommend" ? "rgba(74,222,128,0.1)" : "transparent",
            color: mode === "recommend" ? "#4ade80" : textMute,
          }}>🎯 {lang === "ar" ? "توصية" : lang === "fr" ? "Recommander" : lang === "de" ? "Empfehlen" : "RECOMMEND"}</button>

          <button onClick={() => setMessages([{ role: "assistant", content: WELCOME_MESSAGES[lang] }])} style={{
            padding: "5px 12px", borderRadius: 6, fontSize: 9, cursor: "pointer",
            fontFamily: "monospace", letterSpacing: 1,
            border: `1px solid ${border}`, background: "transparent", color: textMute,
          }}>🗑 {lang === "ar" ? "مسح" : lang === "fr" ? "Effacer" : lang === "de" ? "Löschen" : "CLEAR"}</button>
        </div>
      </div>

      {/* RECOMMEND FORM */}
      {mode === "recommend" && (
        <RecommendForm
          onSubmit={send} isDark={isDark} accentColor="#4ade80"
          border={border} textMute={textMute} cardBg={cardBg} lang={lang}
        />
      )}

      {/* QUICK ACTIONS */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", direction: isRTL ? "rtl" : "ltr" }}>
        {currentActions.map(({ label, prompt }) => (
          <button key={label} onClick={() => send(prompt)} style={{
            padding: "4px 10px", borderRadius: 20, fontSize: 9, cursor: "pointer",
            fontFamily: "monospace", border: `1px solid ${border}`,
            background: "transparent", color: textMute, transition: "all 0.15s",
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
      <div style={{ display: "flex", gap: 8, direction: isRTL ? "rtl" : "ltr" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={PLACEHOLDERS[lang]}
          disabled={loading}
          style={{
            flex: 1, background: cardBg, border: `1px solid ${border}`,
            borderRadius: 8, padding: "10px 14px", color: textMain,
            fontSize: 12, fontFamily: "system-ui, sans-serif", outline: "none",
            opacity: loading ? 0.6 : 1, textAlign: isRTL ? "right" : "left",
            direction: isRTL ? "rtl" : "ltr",
          }}
        />
        <button onClick={() => send()} disabled={loading || !input.trim()} style={{
          padding: "10px 20px", borderRadius: 8, border: "none",
          background: loading || !input.trim() ? border : `linear-gradient(135deg,${accentColor},#38bdf8)`,
          color: "#fff", fontSize: 13, cursor: loading || !input.trim() ? "default" : "pointer",
          transition: "all 0.2s",
        }}>➤</button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
