import { useEffect, useState } from "react";
import { getAlgorithm, getWithDebug } from "../algorithms/registry";
import { generateArray } from "../utils/generators";
import { playTone, playVictory } from "../utils/audio";
import { usePlayback } from "../hooks/usePlayback";
import { getPalette, MOTION } from "../theme/tokens";

const SORTING_ALGOS = getWithDebug("sorting");
const ARRAY_SEARCH_ALGOS = getWithDebug("searching").filter((d) => d.group === "array");
const STRING_MATCH_ALGOS = getWithDebug("searching").filter((d) => d.group === "string");

const DEFAULT_TEXT = "abcababcabcabc";
const DEFAULT_PATTERN = "abc";

export const MAX_DEBUG_ARRAY = 64;
export const MAX_DEBUG_TEXT = 2000;
export const MAX_DEBUG_PATTERN = 100;

export function DebuggerTab({ isDark }) {
  const p = getPalette(isDark ? "dark" : "light");

  const [algoId, setAlgoId] = useState(SORTING_ALGOS[0].id);
  const [arrSize, setArrSize] = useState(8);
  const [arrInputMode, setArrInputMode] = useState("auto");
  const [customArrStr, setCustomArrStr] = useState("5,3,8,1,9,2,7,4");
  const [textInput, setTextInput] = useState(DEFAULT_TEXT);
  const [patInput, setPatInput] = useState(DEFAULT_PATTERN);
  const [debugTextMode, setDebugTextMode] = useState("manual");
  const [debugFileName, setDebugFileName] = useState("");
  const [binaryTargetMode, setBinaryTargetMode] = useState("present");
  const [steps, setSteps] = useState([]);
  const [inputNotice, setInputNotice] = useState(null);

  const playback = usePlayback({ length: steps.length, initialSpeed: 600, onFinish: playVictory });
  const { index: step, playing } = playback;

  const descriptor = getAlgorithm(algoId);
  const isStringSearch = descriptor.category === "searching" && descriptor.group === "string";
  const isBinary = algoId === "binary-search";
  const accentColor = descriptor.color;
  const codeLines = descriptor.codeLines || [];
  const current = steps[step] || null;

  useEffect(() => {
    if (!playing || !current) return;
    if (current.highlight?.length > 0 && current.arr) {
      const arr = current.arr;
      const hi = current.highlight;
      const maxVal = Math.max(...arr);
      const val = arr[hi[0]] !== undefined ? arr[hi[0]] : hi[0];
      const freq = 180 + (val / maxVal) * 700;
      playTone(Math.min(freq, 900), 0.07, "sine", 0.1);
    } else if (current.highlightText?.length > 0) {
      const pos = current.highlightText[0] || 0;
      playTone(250 + (pos % 20) * 25, 0.06, "triangle", 0.08);
    } else if (current.log) {
      playTone(220, 0.04, "sine", 0.05);
    }
  }, [step, playing]); // eslint-disable-line react-hooks/exhaustive-deps

  function generate() {
    let s;
    let notice = null;

    if (isStringSearch) {
      let text = textInput;
      let pattern = patInput;
      if (text.length > MAX_DEBUG_TEXT) {
        text = text.slice(0, MAX_DEBUG_TEXT);
        notice = `Text truncated to ${MAX_DEBUG_TEXT.toLocaleString()} characters for debugging.`;
      }
      if (pattern.length > MAX_DEBUG_PATTERN) {
        pattern = pattern.slice(0, MAX_DEBUG_PATTERN);
        notice = `${notice || ""} Pattern truncated to ${MAX_DEBUG_PATTERN} characters.`;
      }
      s = descriptor.debug(text, pattern);
    } else {
      let arr =
        arrInputMode === "custom"
          ? customArrStr.split(",").map((x) => parseInt(x.trim())).filter((n) => !isNaN(n))
          : generateArray(arrSize, "random");
      if (arrInputMode === "custom" && arr.length > MAX_DEBUG_ARRAY) {
        notice = `Custom array truncated to the first ${MAX_DEBUG_ARRAY} numbers.`;
        arr = arr.slice(0, MAX_DEBUG_ARRAY);
      }
      if (arr.length < 2) arr = generateArray(arrSize, "random");
      if (isBinary) {
        const sortedMax = Math.max(...arr.map((v) => (isNaN(v) ? 0 : v)));
        const target = binaryTargetMode === "missing" ? sortedMax + 1 : undefined;
        s = descriptor.debug(arr, target);
      } else {
        s = descriptor.debug(arr);
      }
    }

    setInputNotice(notice);
    setSteps(s);
    playback.reset();
  }

  function renderBars() {
    if (!current || isStringSearch) return null;
    const arr = current.arr || [];
    const highlight = current.highlight || [];
    const maxV = Math.max(...arr, 1);
    const barW = Math.min(32, Math.floor(300 / Math.max(arr.length, 1)));
    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 80, padding: "0 4px" }}>
        {arr.map((v, i) => (
          <div key={i} style={{
            width: barW,
            height: `${Math.max((v / maxV) * 74, 2)}px`,
            background: highlight.includes(i) ? p.pink : accentColor,
            borderRadius: "3px 3px 0 0",
            transition: "height 0.1s, background 0.1s",
            flexShrink: 0,
            position: "relative",
          }}>
            <span style={{
              position: "absolute", bottom: -16, left: "50%",
              transform: "translateX(-50%)", fontSize: 9,
              color: highlight.includes(i) ? p.pink : p.textSecondary,
              fontFamily: "monospace",
            }}>{v}</span>
          </div>
        ))}
      </div>
    );
  }

  function renderStringViz() {
    if (!current || !isStringSearch) return null;
    const { text, pattern, highlightText, highlightPat, matchPositions, lpsTable, shiftTable } = current;

    const charBox = (ch, idx, isHighlighted, isMatch) => {
      let bg2 = "transparent";
      let col = p.textPrimary;
      let borderCol = p.border;
      if (isMatch) { bg2 = `${accentColor}30`; borderCol = accentColor; col = accentColor; }
      if (isHighlighted) { bg2 = `${accentColor}50`; borderCol = accentColor; col = "#fff"; }

      return (
        <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{
            width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
            border: `1px solid ${borderCol}`, borderRadius: 4,
            background: bg2, color: col,
            fontSize: 11, fontFamily: "monospace", fontWeight: isHighlighted ? "bold" : "normal",
            transition: "all 0.15s",
          }}>{ch}</div>
          <div style={{ fontSize: 8, color: p.textSecondary, fontFamily: "monospace" }}>{idx}</div>
        </div>
      );
    };

    const matchSet = new Set((matchPositions || []).flatMap((pos) =>
      Array.from({ length: pattern.length }, (_, k) => pos + k)
    ));

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <div style={{ fontSize: 8, color: p.textSecondary, letterSpacing: 2, marginBottom: 6 }}>TEXT</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            {text.split("").map((ch, i) =>
              charBox(ch, i, (highlightText || []).includes(i), matchSet.has(i))
            )}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 8, color: p.textSecondary, letterSpacing: 2, marginBottom: 6 }}>Pattern</div>
          <div style={{ display: "flex", gap: 3 }}>
            {pattern.split("").map((ch, i) =>
              charBox(ch, i, (highlightPat || []).includes(i), false)
            )}
          </div>
        </div>

        {lpsTable && lpsTable.length > 0 && (
          <div>
            <div style={{ fontSize: 8, color: p.textSecondary, letterSpacing: 2, marginBottom: 6 }}>LPS TABLE</div>
            <div style={{ display: "flex", gap: 3 }}>
              {pattern.split("").map((ch, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{
                    width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px solid ${p.border}`, borderRadius: 4,
                    fontSize: 11, fontFamily: "monospace", color: p.textSecondary,
                  }}>{ch}</div>
                  <div style={{
                    width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px solid ${accentColor}40`, borderRadius: 4,
                    background: `${accentColor}15`,
                    fontSize: 11, fontFamily: "monospace", color: accentColor,
                  }}>{lpsTable[i]}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {shiftTable && Object.keys(shiftTable).length > 0 && (
          <div>
            <div style={{ fontSize: 8, color: p.textSecondary, letterSpacing: 2, marginBottom: 6 }}>SHIFT TABLE</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {Object.entries(shiftTable).map(([ch, val]) => (
                <div key={ch} style={{
                  background: p.codeBg, border: `1px solid ${accentColor}40`,
                  borderRadius: 5, padding: "3px 8px",
                  display: "flex", gap: 5, alignItems: "center",
                  fontFamily: "monospace", fontSize: 10,
                }}>
                  <span style={{ color: p.textSecondary }}>'{ch}'</span>
                  <span style={{ color: accentColor }}>→ {val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {matchPositions && matchPositions.length > 0 && (
          <div style={{
            background: `${accentColor}15`, border: `1px solid ${accentColor}40`,
            borderRadius: 6, padding: "6px 12px", fontSize: 10, fontFamily: "monospace",
            color: accentColor,
          }}>
            ✓ Matches at: [{matchPositions.join(", ")}]
          </div>
        )}
      </div>
    );
  }

  const algoBtnStyle = (a) => ({
    padding: "5px 10px", borderRadius: 5,
    border: `1px solid ${algoId === a.id ? a.color : p.border}`,
    background: algoId === a.id ? `${a.color}18` : "transparent",
    color: algoId === a.id ? a.color : p.textSecondary,
    fontSize: 10, cursor: "pointer", fontFamily: "monospace",
  });

  const selectAlgo = (id) => {
    setAlgoId(id);
    setSteps([]);
    playback.reset();
  };

  const stepBtn = {
    padding: "6px 10px", borderRadius: 7, border: "none",
    background: "transparent", color: p.textSecondary, fontSize: 13, cursor: "pointer",
    transition: `background ${MOTION.fast}`,
  };

  return (
    <div style={{ color: p.textPrimary }}>
      <div style={{ fontSize: 12, letterSpacing: 2, color: p.purple, marginBottom: 14, fontWeight: "bold" }}>
        Memory debugger
      </div>

      {/* CONTROLS ROW */}
      <div
        className="glass-floating"
        style={{
          borderRadius: 14, padding: "14px 18px", marginBottom: 14,
          display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ fontSize: 8, color: p.textSecondary, letterSpacing: 2, marginBottom: 6 }}>Sorting</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {SORTING_ALGOS.map((a) => (
              <button key={a.id} onClick={() => selectAlgo(a.id)} style={algoBtnStyle(a)}>{a.name}</button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 8, color: p.textSecondary, letterSpacing: 2, marginBottom: 6 }}>Searching</div>
          <div style={{ display: "flex", gap: 5 }}>
            {ARRAY_SEARCH_ALGOS.map((a) => (
              <button key={a.id} onClick={() => selectAlgo(a.id)} style={algoBtnStyle(a)}>{a.name}</button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 8, color: p.textSecondary, letterSpacing: 2, marginBottom: 6 }}>String matching</div>
          <div style={{ display: "flex", gap: 5 }}>
            {STRING_MATCH_ALGOS.map((a) => (
              <button key={a.id} onClick={() => selectAlgo(a.id)} style={algoBtnStyle(a)}>{a.name}</button>
            ))}
          </div>
        </div>

        {!isStringSearch ? (
          <div>
            <div style={{ fontSize: 8, color: p.textSecondary, letterSpacing: 2, marginBottom: 6 }}>Array input</div>
            <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
              {[["auto", "🎲 Auto"], ["custom", "✏️ Custom"]].map(([v, l]) => (
                <button key={v} onClick={() => setArrInputMode(v)}
                  aria-pressed={arrInputMode === v}
                  style={{ padding: "3px 10px", borderRadius: 5, border: `1px solid ${arrInputMode === v ? accentColor : p.border}`,
                    background: arrInputMode === v ? `${accentColor}20` : "transparent",
                    color: arrInputMode === v ? accentColor : p.textSecondary,
                    fontSize: 9, cursor: "pointer", fontFamily: "monospace" }}>{l}</button>
              ))}
            </div>
            {arrInputMode === "auto" ? (
              <div>
                <div style={{ fontSize: 8, color: p.textSecondary, letterSpacing: 2, marginBottom: 4 }}>SIZE: {arrSize}</div>
                <input type="range" min={4} max={16} value={arrSize} aria-label="Array size"
                  onChange={(e) => setArrSize(+e.target.value)}
                  style={{ accentColor, width: 100 }} />
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 8, color: p.textSecondary, letterSpacing: 2, marginBottom: 4 }}>Your array</div>
                <input value={customArrStr} onChange={(e) => setCustomArrStr(e.target.value)} aria-label="Custom array"
                  placeholder="e.g. 5,3,8,1,9,2,7"
                  style={{ background: p.codeBg, border: `1px solid ${p.border}`, borderRadius: 5,
                    color: p.textPrimary, padding: "5px 8px", fontSize: 11,
                    fontFamily: "monospace", width: 160, outline: "none" }} />
                <div style={{ fontSize: 9, color: p.textSecondary, marginTop: 3 }}>
                  {customArrStr.split(",").filter((s) => !isNaN(parseInt(s.trim())) && s.trim() !== "").length} numbers
                </div>
              </div>
            )}
            {isBinary && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 8, color: p.textSecondary, letterSpacing: 2, marginBottom: 4 }}>Target</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[["present", "In array"], ["missing", "Not in array"]].map(([v, l]) => (
                    <button key={v} onClick={() => setBinaryTargetMode(v)} aria-pressed={binaryTargetMode === v}
                      style={{ padding: "3px 10px", borderRadius: 5,
                        border: `1px solid ${binaryTargetMode === v ? accentColor : p.border}`,
                        background: binaryTargetMode === v ? `${accentColor}20` : "transparent",
                        color: binaryTargetMode === v ? accentColor : p.textSecondary,
                        fontSize: 9, cursor: "pointer", fontFamily: "monospace" }}>{l}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 8, color: p.textSecondary, letterSpacing: 2, marginBottom: 6 }}>Text input</div>
              <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                {[["manual", "✏️ Type"], ["file", "📄 File"]].map(([v, l]) => (
                  <button key={v}
                    onClick={() => { setDebugTextMode(v); if (v === "manual") { setTextInput(DEFAULT_TEXT); setDebugFileName(""); } }}
                    aria-pressed={debugTextMode === v}
                    style={{ padding: "3px 10px", borderRadius: 5, border: `1px solid ${debugTextMode === v ? accentColor : p.border}`,
                      background: debugTextMode === v ? `${accentColor}20` : "transparent",
                      color: debugTextMode === v ? accentColor : p.textSecondary,
                      fontSize: 9, cursor: "pointer", fontFamily: "monospace" }}>{l}</button>
                ))}
              </div>
              {debugTextMode === "file" ? (
                <label style={{ cursor: "pointer" }}>
                  <div style={{ border: `2px dashed ${debugFileName ? p.green : p.borderStrong}`, borderRadius: 7,
                    padding: "8px 12px", textAlign: "center", background: debugFileName ? p.accentTint : "transparent",
                    minWidth: 180, transition: "all 0.2s" }}>
                    <div style={{ fontSize: 14 }}>{debugFileName ? "✓" : "▲"}</div>
                    <div style={{ fontSize: 9, color: debugFileName ? p.green : p.textSecondary, fontFamily: "monospace", marginTop: 2 }}>
                      {debugFileName ? debugFileName : "Click to upload .txt"}
                    </div>
                    {debugFileName && <div style={{ fontSize: 8, color: "#475569", marginTop: 1 }}>{textInput.length} chars</div>}
                  </div>
                  <input type="file" accept=".txt" style={{ display: "none" }} aria-label="Upload text file" onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const content = String(ev.target.result || "");
                      if (content.length > MAX_DEBUG_TEXT) {
                        setTextInput(content.slice(0, MAX_DEBUG_TEXT));
                        setInputNotice(`File truncated to the first ${MAX_DEBUG_TEXT.toLocaleString()} characters for debugging.`);
                      } else {
                        setTextInput(content);
                        setInputNotice(null);
                      }
                      setDebugFileName(file.name);
                    };
                    reader.readAsText(file);
                  }} />
                </label>
              ) : (
                <input value={textInput} onChange={(e) => setTextInput(e.target.value)} aria-label="Text to search"
                  style={{ background: p.codeBg, border: `1px solid ${p.border}`, borderRadius: 5,
                    color: p.textPrimary, padding: "5px 10px", fontSize: 11,
                    fontFamily: "monospace", width: 180, outline: "none" }} />
              )}
            </div>
            <div>
              <div style={{ fontSize: 8, color: p.textSecondary, letterSpacing: 2, marginBottom: 6 }}>Pattern</div>
              <input value={patInput} onChange={(e) => setPatInput(e.target.value)} aria-label="Pattern"
                style={{ background: p.codeBg, border: `1px solid ${p.border}`, borderRadius: 5,
                  color: p.textPrimary, padding: "5px 10px", fontSize: 11,
                  fontFamily: "monospace", width: 100, outline: "none" }} />
            </div>
          </div>
        )}

        <div>
          <div style={{ fontSize: 8, color: p.textSecondary, letterSpacing: 2, marginBottom: 6 }}>
            Speed: {playback.speed < 300 ? "Fast" : playback.speed < 700 ? "Medium" : "Slow"}
          </div>
          <input type="range" min={100} max={1000} aria-label="Playback speed"
            value={1100 - playback.speed}
            onChange={(e) => playback.setSpeed(1100 - +e.target.value)}
            style={{ accentColor, width: 100 }} />
        </div>

        <div
          className="glass-thin"
          style={{ display: "flex", gap: 6, marginLeft: "auto", alignItems: "center", padding: 6, borderRadius: 12 }}
        >
          <button onClick={generate} style={{
            padding: "8px 16px", borderRadius: 8, border: "none",
            background: `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 90%, white), ${accentColor})`,
            color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 600,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.28), 0 3px 10px ${accentColor}44`,
          }}>GENERATE</button>
          {steps.length > 0 && <>
            <button onClick={playback.toggle} aria-label={playing ? "Pause" : "Play"} title={playing ? "Pause" : "Play"} style={{
              padding: "7px 13px", borderRadius: 8, border: "none",
              background: playing ? "rgba(255, 59, 48, 0.12)" : "rgba(48, 209, 88, 0.14)",
              color: playing ? p.red : p.green,
              fontSize: 13, cursor: "pointer",
            }}>{playing ? "⏸" : "▶"}</button>
            <button onClick={playback.prev} aria-label="Previous step" title="Previous step" style={stepBtn}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(127,127,127,0.14)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>◀</button>
            <button onClick={playback.next} aria-label="Next step" title="Next step" style={stepBtn}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(127,127,127,0.14)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>▶</button>
            <button onClick={playback.reset} aria-label="First step" title="First step" style={stepBtn}>⏮</button>
            <button onClick={playback.goToEnd} aria-label="Last step" title="Last step" style={stepBtn}>⏭</button>
          </>}
        </div>
      </div>

      {inputNotice && (
        <div role="status" style={{
          marginBottom: 12, padding: "8px 12px", borderRadius: 6, fontSize: 10,
          fontFamily: "monospace", lineHeight: 1.5,
          background: isDark ? "rgba(251,191,36,0.08)" : "rgba(217,119,6,0.08)",
          border: `1px solid ${isDark ? "rgba(251,191,36,0.4)" : "rgba(180,83,9,0.45)"}`,
          color: isDark ? "#fbbf24" : "#92400e",
        }}>⚠ {inputNotice}</div>
      )}

      {steps.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 10 }}>
            <span style={{ color: accentColor, fontFamily: "monospace" }}>
              Step {step + 1} / {steps.length}
            </span>
            {current?.log && (
              <span style={{
                color: p.textSecondary, fontFamily: "monospace", fontSize: 10,
                background: p.codeBg, padding: "2px 10px", borderRadius: 4,
              }}>→ {current.log}</span>
            )}
          </div>
          <div style={{ background: "rgba(127,127,127,0.30)", borderRadius: 4, height: 4 }}>
            <div style={{
              width: `${((step + 1) / steps.length) * 100}%`, height: "100%",
              background: accentColor, borderRadius: 4, transition: "width 0.1s"
            }} />
          </div>
          <input type="range" min={0} max={steps.length - 1} value={step} aria-label="Step position"
            onChange={(e) => playback.setStep(+e.target.value)}
            style={{ width: "100%", accentColor, marginTop: 4 }} />
        </div>
      )}

      {steps.length > 0 && current ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="editor-surface" style={{ borderRadius: 12, overflow: "hidden" }}>
            <div style={{
              padding: "9px 14px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: `1px solid ${p.border}`
            }}>
              <span style={{ fontSize: 9, color: accentColor, letterSpacing: 2, fontFamily: "monospace" }}>
                {descriptor.name.replace(/ /g, "_").toLowerCase()}
              </span>
              <span style={{ fontSize: 9, color: p.textSecondary, fontFamily: "monospace" }}>
                line {(current.activeLine ?? 0) + 1}
              </span>
            </div>
            <div style={{ padding: "10px 0" }}>
              {codeLines.map(({ n, code }) => (
                <div key={n} style={{
                  display: "flex", alignItems: "center", gap: 0,
                  background: n === current.activeLine ? `${accentColor}18` : "transparent",
                  borderLeft: n === current.activeLine ? `3px solid ${accentColor}` : "3px solid transparent",
                  transition: "all 0.15s",
                }}>
                  <span style={{
                    width: 32, textAlign: "right", paddingRight: 10,
                    fontSize: 10, color: n === current.activeLine ? accentColor : p.textSecondary,
                    fontFamily: "monospace", flexShrink: 0, userSelect: "none",
                  }}>{n + 1}</span>
                  <span style={{
                    fontSize: 12, fontFamily: "monospace", padding: "4px 12px",
                    color: n === current.activeLine ? p.onAccent : p.textSecondary,
                    whiteSpace: "pre",
                  }}>{code}</span>
                  {n === current.activeLine && (
                    <span style={{
                      marginLeft: "auto", marginRight: 12,
                      fontSize: 9, color: accentColor,
                      background: `${accentColor}20`, padding: "2px 6px", borderRadius: 3,
                      fontFamily: "monospace",
                    }}>← executing</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="surface-card" style={{ borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: p.textSecondary, marginBottom: 14 }}>
                {isStringSearch ? "String state" : "Array state"}
              </div>
              {isStringSearch ? renderStringViz() : renderBars()}
            </div>

            <div className="glass-floating" style={{ borderRadius: 12, padding: "13px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: p.textSecondary, marginBottom: 10 }}>Variables</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {Object.entries(current.vars || {}).filter(([, v]) => v !== undefined).map(([k, v]) => (
                  <div key={k} style={{ background: p.codeBg, borderRadius: 6, padding: "7px 10px", border: `1px solid ${p.border}` }}>
                    <div style={{ fontSize: 8, color: p.textSecondary, fontFamily: "monospace", marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 13, color: accentColor, fontFamily: "monospace", fontWeight: "bold" }}>
                      {String(v)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-floating" style={{ borderRadius: 12, padding: "13px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: p.textSecondary, marginBottom: 10 }}>Memory</div>
              {Object.entries(current.memory || {}).map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 5, fontFamily: "monospace" }}>
                  <span style={{ fontSize: 10, color: p.purple, width: 60, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 9, color: p.textSecondary }}>→</span>
                  <span style={{
                    fontSize: 10, color: p.textPrimary,
                    background: p.codeBg, padding: "2px 8px", borderRadius: 4,
                    wordBreak: "break-all",
                  }}>{v}</span>
                </div>
              ))}
            </div>

            <div className="glass-floating" style={{ borderRadius: 12, padding: "13px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: p.textSecondary, marginBottom: 10 }}>Call stack</div>
              {(current.callStack || []).map((line, i) => (
                <div key={i} style={{
                  fontFamily: "monospace", fontSize: 10,
                  color: i === 0 ? accentColor : p.textSecondary,
                  padding: "3px 0",
                  borderLeft: i === 0 ? `2px solid ${accentColor}` : "2px solid transparent",
                  paddingLeft: 8, marginBottom: 2,
                }}>{line}</div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", height: "40vh", gap: 12, opacity: 0.35,
        }}>
          <div style={{ fontSize: 42 }}>🐛</div>
          <div style={{ fontSize: 11, color: p.textSecondary, letterSpacing: 2 }}>
            SELECT AN ALGORITHM AND CLICK GENERATE
          </div>
        </div>
      )}
    </div>
  );
}
