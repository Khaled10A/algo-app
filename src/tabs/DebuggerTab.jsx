import { useState, useRef } from "react";
import { insertionSortDebug } from "../algorithms/sorting/insertionSort";
import { bubbleSortDebug }    from "../algorithms/sorting/bubbleSort";
import { selectionSortDebug } from "../algorithms/sorting/selectionSort";
import { mergeSortDebug }     from "../algorithms/sorting/mergeSort";
import { bruteForceDebug }    from "../algorithms/searching/bruteForceDebug";
import { horspoolDebug }      from "../algorithms/searching/horspoolDebug";
import { kmpDebug }           from "../algorithms/searching/kmpDebug";
import { generateArray }      from "../utils/generators";

// ── CODE LINES ────────────────────────────────────────────
const CODE_LINES = {
  "Insertion Sort": [
    { n: 0, code: "function insertionSort(arr) {" },
    { n: 1, code: "  const a = [...arr];" },
    { n: 2, code: "  for (let i = 1; i < a.length; i++) {" },
    { n: 3, code: "    let key = a[i];  j = i - 1;" },
    { n: 4, code: "    while (j >= 0 && a[j] > key) {" },
    { n: 5, code: "      a[j+1] = a[j];  j--;" },
    { n: 6, code: "    a[j+1] = key;  ← insert here" },
    { n: 7, code: "  }" },
    { n: 8, code: "}" },
  ],
  "Bubble Sort": [
    { n: 0, code: "function bubbleSort(arr) {" },
    { n: 1, code: "  const a = [...arr];" },
    { n: 2, code: "  for (let i = 0; i < n-1; i++) {" },
    { n: 3, code: "    for (let j = 0; j < n-i-1; j++) {" },
    { n: 4, code: "      if (a[j] > a[j+1]) swap;" },
    { n: 5, code: "    }" },
    { n: 6, code: "  }" },
    { n: 7, code: "}" },
  ],
  "Selection Sort": [
    { n: 0, code: "function selectionSort(arr) {" },
    { n: 1, code: "  const a = [...arr];" },
    { n: 2, code: "  for (let i = 0; i < n-1; i++) {" },
    { n: 3, code: "    let minIdx = i;" },
    { n: 4, code: "    for (let j = i+1; j < n; j++) {" },
    { n: 5, code: "      if (a[j] < a[minIdx]) minIdx = j;" },
    { n: 6, code: "    swap(a[i], a[minIdx]);" },
    { n: 7, code: "  }" },
    { n: 8, code: "}" },
  ],
  "Merge Sort": [
    { n: 0, code: "function mergeSort(arr) {" },
    { n: 1, code: "  if (arr.length <= 1) return arr;" },
    { n: 2, code: "  const mid = floor(n / 2);" },
    { n: 3, code: "  const left  = mergeSort(arr.slice(0, mid));" },
    { n: 4, code: "  const right = mergeSort(arr.slice(mid));" },
    { n: 5, code: "  return merge(left, right);" },
    { n: 6, code: "}" },
  ],
  "Brute Force": [
    { n: 0, code: "function bruteForceSearch(text, pattern) {" },
    { n: 1, code: "  let matches = [];" },
    { n: 2, code: "  for (let i = 0; i <= n - m; i++) {" },
    { n: 3, code: "    let j = 0;" },
    { n: 4, code: "    while (j<m && text[i+j]===pattern[j]) j++;" },
    { n: 5, code: "    // mismatch → break, shift i" },
    { n: 6, code: "    if (j === m) matches.push(i);" },
    { n: 7, code: "  }" },
    { n: 8, code: "  return matches;" },
  ],
  "Horspool": [
    { n: 0, code: "function horspoolSearch(text, pattern) {" },
    { n: 1, code: "  for i in 0..m-2: shift[pattern[i]] = m-1-i" },
    { n: 2, code: "  // default shift for unknown chars = m" },
    { n: 3, code: "  let i = m - 1;  // window right end" },
    { n: 4, code: "  while (i < n) {" },
    { n: 5, code: "    compare right→left: text[i-k] vs pattern[m-1-k]" },
    { n: 6, code: "    if k === m → match found at i-m+1" },
    { n: 7, code: "    i += shift[text[i]] ?? m" },
    { n: 8, code: "  }" },
    { n: 9, code: "}" },
  ],
  "KMP": [
    { n: 0,  code: "function kmpSearch(text, pattern) {" },
    { n: 1,  code: "  // Phase 1: build LPS table" },
    { n: 2,  code: "  while (pi < m) {" },
    { n: 3,  code: "    if pattern[pi] === pattern[len]: lps[pi++] = ++len" },
    { n: 4,  code: "    else if len: len = lps[len-1]" },
    { n: 5,  code: "    else: lps[pi++] = 0" },
    { n: 6,  code: "  }  // LPS ready" },
    { n: 7,  code: "  // Phase 2: search" },
    { n: 8,  code: "  if text[i] === pattern[j]: i++; j++;" },
    { n: 9,  code: "  if j === m: match! j = lps[j-1]" },
    { n: 10, code: "  else if mismatch & j>0: j = lps[j-1]" },
    { n: 11, code: "  else: i++" },
    { n: 12, code: "}" },
  ],
};

const SORT_ALGOS = ["Insertion Sort", "Bubble Sort", "Selection Sort", "Merge Sort"];
const SEARCH_ALGOS = ["Brute Force", "Horspool", "KMP"];

const DEBUG_FNS = {
  "Insertion Sort": (arr)        => insertionSortDebug(arr),
  "Bubble Sort":    (arr)        => bubbleSortDebug(arr),
  "Selection Sort": (arr)        => selectionSortDebug(arr),
  "Merge Sort":     (arr)        => mergeSortDebug(arr),
  "Brute Force":    (_, t, p)    => bruteForceDebug(t, p),
  "Horspool":       (_, t, p)    => horspoolDebug(t, p),
  "KMP":            (_, t, p)    => kmpDebug(t, p),
};

const COLORS = {
  "Insertion Sort": "#38bdf8",
  "Bubble Sort":    "#f472b6",
  "Selection Sort": "#fb923c",
  "Merge Sort":     "#4ade80",
  "Brute Force":    "#a78bfa",
  "Horspool":       "#fbbf24",
  "KMP":            "#34d399",
};

const DEFAULT_TEXT    = "abcababcabcabc";
const DEFAULT_PATTERN = "abc";

// ── AUDIO ────────────────────────────────────────────────────
const audioCtx = typeof window !== "undefined"
  ? new (window.AudioContext || window.webkitAudioContext)()
  : null;

function playBeep(freq = 440, duration = 0.08, type = "sine", vol = 0.15) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  } catch(e) {}
}

function playVictory() {
  if (!audioCtx) return;
  [523, 659, 784, 1047].forEach((freq, i) => {
    setTimeout(() => playBeep(freq, 0.18, "sine", 0.2), i * 120);
  });
}

export function DebuggerTab({ isDark }) {
  const bg       = isDark ? "#020817" : "#f8fafc";
  const cardBg   = isDark ? "#0f172a" : "#ffffff";
  const border   = isDark ? "#1e293b" : "#e2e8f0";
  const textMain = isDark ? "#e2e8f0" : "#1e293b";
  const textMute = isDark ? "#64748b" : "#94a3b8";
  const codeBg   = isDark ? "#0a0f1e" : "#f1f5f9";

  const [algo, setAlgo]         = useState("Insertion Sort");
  const [arrSize, setArrSize]   = useState(8);
  const [textInput, setTextInput]       = useState(DEFAULT_TEXT);
  const [patInput, setPatInput]         = useState(DEFAULT_PATTERN);
  const [debugTextMode, setDebugTextMode] = useState("manual"); // manual | file
  const [debugFileName, setDebugFileName] = useState("");
  const [steps, setSteps]       = useState([]);
  const [step, setStep]         = useState(0);
  const [playing, setPlaying]   = useState(false);
  const [speed, setSpeed]       = useState(600);
  const intervalRef             = useRef(null);

  const isSearch    = SEARCH_ALGOS.includes(algo);
  const accentColor = COLORS[algo];
  const codeLines   = CODE_LINES[algo] || [];
  const current     = steps[step] || null;

  function generate() {
    clearInterval(intervalRef.current);
    setPlaying(false);
    let s;
    if (isSearch) {
      const txt = debugTextMode === "file" && debugFileName ? textInput : textInput;
      s = DEBUG_FNS[algo](null, txt, patInput);
    } else {
      const arr = generateArray(arrSize, "random");
      s = DEBUG_FNS[algo](arr);
    }
    setSteps(s);
    setStep(0);
  }

  function play() {
    if (!steps.length) return;
    setPlaying(true);
    intervalRef.current = setInterval(() => {
      setStep(s => {
        if (s >= steps.length - 1) {
          clearInterval(intervalRef.current);
          setPlaying(false);
          playVictory();
          return s;
        }
        // Play step sound based on highlight
        const nextStep = steps[s + 1];
        if (nextStep?.highlight?.length > 0) {
          const freq = 200 + (nextStep.highlight[0] || 0) * 40;
          playBeep(Math.min(freq, 900), 0.06, "sine", 0.08);
        }
        return s + 1;
      });
    }, speed);
  }

  function pause() {
    clearInterval(intervalRef.current);
    setPlaying(false);
  }

  function goStep(n) {
    pause();
    setStep(Math.max(0, Math.min(steps.length - 1, n)));
  }

  // ── ARRAY BARS (sorting) ──────────────────────────────────
  function renderBars() {
    if (!current || isSearch) return null;
    const { arr, highlight } = current;
    const maxV = Math.max(...arr);
    const barW = Math.min(32, Math.floor(300 / arr.length));
    return (
      <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:80, padding:"0 4px" }}>
        {arr.map((v, i) => (
          <div key={i} style={{
            width: barW,
            height: `${(v / maxV) * 74}px`,
            background: highlight?.includes(i) ? "#f472b6" : accentColor,
            borderRadius: "3px 3px 0 0",
            transition: "height 0.1s, background 0.1s",
            flexShrink: 0,
            position: "relative",
          }}>
            <span style={{
              position:"absolute", bottom:-16, left:"50%",
              transform:"translateX(-50%)", fontSize:9,
              color: highlight?.includes(i) ? "#f472b6" : textMute,
              fontFamily:"monospace",
            }}>{v}</span>
          </div>
        ))}
      </div>
    );
  }

  // ── STRING VISUALIZER (searching) ────────────────────────
  function renderStringViz() {
    if (!current || !isSearch) return null;
    const { text, pattern, highlightText, highlightPat, matchPositions, lpsTable, shiftTable } = current;

    const charBox = (ch, idx, isHighlighted, isMatch, isPattern, dimmed) => {
      let bg2 = "transparent";
      let col = dimmed ? (isDark ? "#334155" : "#cbd5e1") : textMain;
      let borderCol = border;
      if (isMatch)        { bg2 = `${accentColor}30`; borderCol = accentColor; col = accentColor; }
      if (isHighlighted)  { bg2 = `${accentColor}50`; borderCol = accentColor; col = "#fff"; }

      return (
        <div key={idx} style={{
          display:"flex", flexDirection:"column", alignItems:"center", gap:2,
        }}>
          <div style={{
            width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center",
            border:`1px solid ${borderCol}`, borderRadius:4,
            background: bg2, color: col,
            fontSize:11, fontFamily:"monospace", fontWeight: isHighlighted ? "bold" : "normal",
            transition:"all 0.15s",
          }}>{ch}</div>
          <div style={{ fontSize:8, color: textMute, fontFamily:"monospace" }}>{idx}</div>
        </div>
      );
    };

    // which text positions are part of any confirmed match
    const matchSet = new Set((matchPositions || []).flatMap(pos =>
      Array.from({ length: pattern.length }, (_, k) => pos + k)
    ));

    return (
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {/* TEXT */}
        <div>
          <div style={{ fontSize:8, color: textMute, letterSpacing:2, marginBottom:6 }}>TEXT</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
            {text.split("").map((ch, i) =>
              charBox(ch, i,
                (highlightText || []).includes(i),
                matchSet.has(i),
                false,
                false,
              )
            )}
          </div>
        </div>

        {/* PATTERN */}
        <div>
          <div style={{ fontSize:8, color: textMute, letterSpacing:2, marginBottom:6 }}>PATTERN</div>
          <div style={{ display:"flex", gap:3 }}>
            {pattern.split("").map((ch, i) =>
              charBox(ch, i,
                (highlightPat || []).includes(i),
                false,
                true,
                false,
              )
            )}
          </div>
        </div>

        {/* LPS table for KMP */}
        {lpsTable && lpsTable.length > 0 && (
          <div>
            <div style={{ fontSize:8, color: textMute, letterSpacing:2, marginBottom:6 }}>LPS TABLE</div>
            <div style={{ display:"flex", gap:3 }}>
              {pattern.split("").map((ch, i) => (
                <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                  <div style={{
                    width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center",
                    border:`1px solid ${border}`, borderRadius:4,
                    fontSize:11, fontFamily:"monospace", color: textMute,
                  }}>{ch}</div>
                  <div style={{
                    width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center",
                    border:`1px solid ${accentColor}40`, borderRadius:4,
                    background:`${accentColor}15`,
                    fontSize:11, fontFamily:"monospace", color: accentColor,
                  }}>{lpsTable[i]}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shift table for Horspool */}
        {shiftTable && Object.keys(shiftTable).length > 0 && (
          <div>
            <div style={{ fontSize:8, color: textMute, letterSpacing:2, marginBottom:6 }}>SHIFT TABLE</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
              {Object.entries(shiftTable).map(([ch, val]) => (
                <div key={ch} style={{
                  background: codeBg, border:`1px solid ${accentColor}40`,
                  borderRadius:5, padding:"3px 8px",
                  display:"flex", gap:5, alignItems:"center",
                  fontFamily:"monospace", fontSize:10,
                }}>
                  <span style={{ color: textMute }}>'{ch}'</span>
                  <span style={{ color: accentColor }}>→ {val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Matches found */}
        {matchPositions && matchPositions.length > 0 && (
          <div style={{
            background:`${accentColor}15`, border:`1px solid ${accentColor}40`,
            borderRadius:6, padding:"6px 12px", fontSize:10, fontFamily:"monospace",
            color: accentColor,
          }}>
            ✓ Matches at: [{matchPositions.join(", ")}]
          </div>
        )}
      </div>
    );
  }

  // ── LAYOUT ────────────────────────────────────────────────
  return (
    <div style={{ color: textMain }}>
      {/* HEADER */}
      <div style={{ fontSize:12, letterSpacing:2, color:"#a78bfa", marginBottom:14, fontWeight:"bold" }}>
        🐛 MEMORY DEBUGGER
      </div>

      {/* CONTROLS ROW */}
      <div style={{
        background: cardBg, border:`1px solid ${border}`,
        borderRadius:10, padding:"14px 18px", marginBottom:14,
        display:"flex", gap:14, flexWrap:"wrap", alignItems:"flex-start",
      }}>

        {/* SORTING group */}
        <div>
          <div style={{ fontSize:8, color: textMute, letterSpacing:2, marginBottom:6 }}>SORTING</div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {SORT_ALGOS.map(a => (
              <button key={a} onClick={() => { setAlgo(a); setSteps([]); setStep(0); }} style={{
                padding:"5px 10px", borderRadius:5, border:`1px solid ${algo===a ? COLORS[a] : border}`,
                background: algo===a ? `${COLORS[a]}18` : "transparent",
                color: algo===a ? COLORS[a] : textMute,
                fontSize:10, cursor:"pointer", fontFamily:"monospace",
              }}>{a}</button>
            ))}
          </div>
        </div>

        {/* SEARCHING group */}
        <div>
          <div style={{ fontSize:8, color: textMute, letterSpacing:2, marginBottom:6 }}>STRING MATCHING</div>
          <div style={{ display:"flex", gap:5 }}>
            {SEARCH_ALGOS.map(a => (
              <button key={a} onClick={() => { setAlgo(a); setSteps([]); setStep(0); }} style={{
                padding:"5px 10px", borderRadius:5, border:`1px solid ${algo===a ? COLORS[a] : border}`,
                background: algo===a ? `${COLORS[a]}18` : "transparent",
                color: algo===a ? COLORS[a] : textMute,
                fontSize:10, cursor:"pointer", fontFamily:"monospace",
              }}>{a}</button>
            ))}
          </div>
        </div>

        {/* Array size OR text+pattern inputs */}
        {!isSearch ? (
          <div>
            <div style={{ fontSize:8, color:textMute, letterSpacing:2, marginBottom:6 }}>ARRAY SIZE: {arrSize}</div>
            <input type="range" min={4} max={16} value={arrSize}
              onChange={e => setArrSize(+e.target.value)}
              style={{ accentColor, width:100 }} />
          </div>
        ) : (
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"flex-end" }}>
            {/* TEXT MODE TOGGLE */}
            <div>
              <div style={{ fontSize:8, color:textMute, letterSpacing:2, marginBottom:6 }}>TEXT INPUT</div>
              <div style={{ display:"flex", gap:4, marginBottom:6 }}>
                {[["manual","✏️ Type"],["file","📄 File"]].map(([v,l]) => (
                  <button key={v} onClick={() => { setDebugTextMode(v); if(v==="manual"){setTextInput(DEFAULT_TEXT);setDebugFileName("");} }}
                    style={{ padding:"3px 10px", borderRadius:5, border:`1px solid ${debugTextMode===v ? accentColor : border}`,
                      background: debugTextMode===v ? `${accentColor}20` : "transparent",
                      color: debugTextMode===v ? accentColor : textMute,
                      fontSize:9, cursor:"pointer", fontFamily:"monospace" }}>{l}</button>
                ))}
              </div>
              {debugTextMode === "file" ? (
                <label style={{ cursor:"pointer" }}>
                  <div style={{ border:`2px dashed ${debugFileName ? "#4ade80" : border}`, borderRadius:7,
                    padding:"8px 12px", textAlign:"center", background: debugFileName ? "rgba(74,222,128,0.05)" : "transparent",
                    minWidth:180, transition:"all 0.2s" }}>
                    <div style={{ fontSize:14 }}>{debugFileName ? "✅" : "📄"}</div>
                    <div style={{ fontSize:9, color: debugFileName ? "#4ade80" : textMute, fontFamily:"monospace", marginTop:2 }}>
                      {debugFileName ? debugFileName : "Click to upload .txt"}
                    </div>
                    {debugFileName && <div style={{ fontSize:8, color:"#475569", marginTop:1 }}>{textInput.length} chars</div>}
                  </div>
                  <input type="file" accept=".txt" style={{ display:"none" }} onChange={e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = ev => { setTextInput(ev.target.result); setDebugFileName(file.name); };
                    reader.readAsText(file);
                  }} />
                </label>
              ) : (
                <input value={textInput} onChange={e => setTextInput(e.target.value)}
                  style={{ background: codeBg, border:`1px solid ${border}`, borderRadius:5,
                    color: textMain, padding:"5px 10px", fontSize:11,
                    fontFamily:"monospace", width:180, outline:"none" }} />
              )}
            </div>
            <div>
              <div style={{ fontSize:8, color:textMute, letterSpacing:2, marginBottom:6 }}>PATTERN</div>
              <input value={patInput} onChange={e => setPatInput(e.target.value)}
                style={{ background: codeBg, border:`1px solid ${border}`, borderRadius:5,
                  color: textMain, padding:"5px 10px", fontSize:11,
                  fontFamily:"monospace", width:100, outline:"none" }} />
            </div>
          </div>
        )}

        {/* Speed */}
        <div>
          <div style={{ fontSize:8, color:textMute, letterSpacing:2, marginBottom:6 }}>
            SPEED: {speed < 300 ? "Fast" : speed < 700 ? "Medium" : "Slow"}
          </div>
          <input type="range" min={100} max={1000} value={1100 - speed}
            onChange={e => setSpeed(1100 - +e.target.value)}
            style={{ accentColor, width:100 }} />
        </div>

        {/* Buttons */}
        <div style={{ display:"flex", gap:6, marginLeft:"auto", alignItems:"center" }}>
          <button onClick={generate} style={{
            padding:"7px 16px", borderRadius:6, border:"none",
            background:`linear-gradient(135deg,${accentColor},#818cf8)`,
            color:"#fff", fontSize:10, cursor:"pointer", fontFamily:"monospace", fontWeight:"bold", letterSpacing:1,
          }}>⚡ GENERATE</button>
          {steps.length > 0 && <>
            <button onClick={playing ? pause : play} style={{
              padding:"7px 14px", borderRadius:6,
              border:`1px solid ${playing ? "#f87171" : "#4ade80"}`,
              background: playing ? "rgba(248,113,113,0.1)" : "rgba(74,222,128,0.1)",
              color: playing ? "#f87171" : "#4ade80",
              fontSize:12, cursor:"pointer",
            }}>{playing ? "⏸" : "▶"}</button>
            <button onClick={() => goStep(step - 1)} style={stepBtn(border, textMute)}>◀</button>
            <button onClick={() => goStep(step + 1)} style={stepBtn(border, textMute)}>▶</button>
            <button onClick={() => goStep(0)} style={stepBtn(border, textMute)}>⏮</button>
            <button onClick={() => goStep(steps.length-1)} style={stepBtn(border, textMute)}>⏭</button>
          </>}
        </div>
      </div>

      {/* STEP COUNTER */}
      {steps.length > 0 && (
        <div style={{ marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:10 }}>
            <span style={{ color: accentColor, fontFamily:"monospace" }}>
              Step {step + 1} / {steps.length}
            </span>
            {current?.log && (
              <span style={{
                color: textMute, fontFamily:"monospace", fontSize:10,
                background: codeBg, padding:"2px 10px", borderRadius:4,
              }}>→ {current.log}</span>
            )}
          </div>
          <div style={{ background: border, borderRadius:4, height:4 }}>
            <div style={{
              width:`${((step+1)/steps.length)*100}%`, height:"100%",
              background: accentColor, borderRadius:4, transition:"width 0.1s"
            }}/>
          </div>
          <input type="range" min={0} max={steps.length-1} value={step}
            onChange={e => goStep(+e.target.value)}
            style={{ width:"100%", accentColor, marginTop:4 }}/>
        </div>
      )}

      {/* MAIN DEBUGGER GRID */}
      {steps.length > 0 && current ? (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>

          {/* LEFT — CODE PANEL */}
          <div style={{ background: cardBg, border:`1px solid ${border}`, borderRadius:10, overflow:"hidden" }}>
            <div style={{
              background: codeBg, padding:"8px 14px",
              display:"flex", justifyContent:"space-between", alignItems:"center",
              borderBottom:`1px solid ${border}`
            }}>
              <span style={{ fontSize:9, color: accentColor, letterSpacing:2, fontFamily:"monospace" }}>
                {algo.toUpperCase().replace(" ", "_")}.JS
              </span>
              <span style={{ fontSize:9, color: textMute, fontFamily:"monospace" }}>
                line {current.activeLine + 1}
              </span>
            </div>
            <div style={{ padding:"10px 0" }}>
              {codeLines.map(({ n, code }) => (
                <div key={n} style={{
                  display:"flex", alignItems:"center", gap:0,
                  background: n === current.activeLine ? `${accentColor}18` : "transparent",
                  borderLeft: n === current.activeLine ? `3px solid ${accentColor}` : "3px solid transparent",
                  transition:"all 0.15s",
                }}>
                  <span style={{
                    width:32, textAlign:"right", paddingRight:10,
                    fontSize:10, color: n === current.activeLine ? accentColor : textMute,
                    fontFamily:"monospace", flexShrink:0, userSelect:"none",
                  }}>{n + 1}</span>
                  <span style={{
                    fontSize:12, fontFamily:"monospace", padding:"4px 12px",
                    color: n === current.activeLine ? "#fff" : isDark ? "#94a3b8" : "#475569",
                    whiteSpace:"pre",
                  }}>{code}</span>
                  {n === current.activeLine && (
                    <span style={{
                      marginLeft:"auto", marginRight:12,
                      fontSize:9, color: accentColor,
                      background:`${accentColor}20`, padding:"2px 6px", borderRadius:3,
                      fontFamily:"monospace",
                    }}>← executing</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — VISUALIZER + VARS + MEMORY + STACK */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

            {/* Array bars OR String visualizer */}
            <div style={{
              background: cardBg, border:`1px solid ${border}`,
              borderRadius:10, padding:"12px 16px",
            }}>
              <div style={{ fontSize:8, color:textMute, letterSpacing:2, marginBottom:14 }}>
                {isSearch ? "STRING STATE" : "ARRAY STATE"}
              </div>
              {isSearch ? renderStringViz() : renderBars()}
            </div>

            {/* Variables */}
            <div style={{
              background: cardBg, border:`1px solid ${border}`,
              borderRadius:10, padding:"12px 16px",
            }}>
              <div style={{ fontSize:8, color:textMute, letterSpacing:2, marginBottom:10 }}>VARIABLES</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                {Object.entries(current.vars).filter(([,v]) => v !== undefined).map(([k, v]) => (
                  <div key={k} style={{
                    background: codeBg, borderRadius:6, padding:"7px 10px",
                    border:`1px solid ${border}`,
                  }}>
                    <div style={{ fontSize:8, color:textMute, fontFamily:"monospace", marginBottom:2 }}>{k}</div>
                    <div style={{ fontSize:13, color: accentColor, fontFamily:"monospace", fontWeight:"bold" }}>
                      {String(v)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Memory */}
            <div style={{
              background: cardBg, border:`1px solid ${border}`,
              borderRadius:10, padding:"12px 16px",
            }}>
              <div style={{ fontSize:8, color:textMute, letterSpacing:2, marginBottom:10 }}>MEMORY</div>
              {Object.entries(current.memory || {}).map(([k, v]) => (
                <div key={k} style={{
                  display:"flex", gap:8, alignItems:"baseline",
                  marginBottom:5, fontFamily:"monospace",
                }}>
                  <span style={{ fontSize:10, color:"#a78bfa", width:60, flexShrink:0 }}>{k}</span>
                  <span style={{ fontSize:9, color:textMute }}>→</span>
                  <span style={{
                    fontSize:10, color: isDark ? "#e2e8f0" : "#1e293b",
                    background: codeBg, padding:"2px 8px", borderRadius:4,
                    wordBreak:"break-all",
                  }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Call Stack */}
            <div style={{
              background: cardBg, border:`1px solid ${border}`,
              borderRadius:10, padding:"12px 16px",
            }}>
              <div style={{ fontSize:8, color:textMute, letterSpacing:2, marginBottom:10 }}>CALL STACK</div>
              {(current.callStack || []).map((line, i) => (
                <div key={i} style={{
                  fontFamily:"monospace", fontSize:10,
                  color: i === 0 ? accentColor : textMute,
                  padding:"3px 0",
                  borderLeft: i === 0 ? `2px solid ${accentColor}` : "2px solid transparent",
                  paddingLeft:8, marginBottom:2,
                }}>{line}</div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          display:"flex", flexDirection:"column", alignItems:"center",
          justifyContent:"center", height:"40vh", gap:12, opacity:0.35,
        }}>
          <div style={{ fontSize:42 }}>🐛</div>
          <div style={{ fontSize:11, color:textMute, letterSpacing:2 }}>
            SELECT AN ALGORITHM AND CLICK GENERATE
          </div>
        </div>
      )}
    </div>
  );
}

const stepBtn = (border, color) => ({
  padding:"6px 10px", borderRadius:5, border:`1px solid ${border}`,
  background:"transparent", color, fontSize:13, cursor:"pointer",
});
