import { useState } from "react";
import { getAlgorithm, getWithDebug } from "../algorithms/registry";
import { playVictory } from "../utils/audio";
import { usePlayback } from "../hooks/usePlayback";
import { getPalette } from "../theme/tokens";
import DPTableView from "../components/visualizer/DPTableView";

const DP_ALGOS = getWithDebug("dynamicProgramming");

// Default inputs for each algorithm
const DEFAULTS = {
  "fibonacci-memo": { n: 10 },
  "fibonacci-tab": { n: 10 },
  knapsack: { weights: "2,3,4,5", values: "3,4,5,6", capacity: 8 },
  lcs: { s1: "ABCBDAB", s2: "BDCAB" },
  lis: { arr: "10,9,2,5,3,7,101,18" },
  "matrix-chain": { dims: "10,30,5,60" },
  "edit-distance": { s1: "kitten", s2: "sitting" },
};

export function DPDebuggerTab({ isDark }) {
  const p = getPalette(isDark ? "dark" : "light");

  const [algoId, setAlgoId] = useState(DP_ALGOS[0]?.id || "fibonacci-tab");
  const [inputs, setInputs] = useState({ ...DEFAULTS["fibonacci-tab"] });
  const [steps, setSteps] = useState([]);
  const [notice, setNotice] = useState(null);

  const playback = usePlayback({
    length: steps.length,
    initialSpeed: 400,
    onFinish: playVictory,
  });
  const { index: step, playing } = playback;

  const descriptor = getAlgorithm(algoId);
  const current = steps[step] || null;
  const accentColor = descriptor.color;
  const codeLines = descriptor.codeLines || [];

  function selectAlgo(id) {
    setAlgoId(id);
    setSteps([]);
    setInputs({ ...DEFAULTS[id] });
    setNotice(null);
    playback.reset();
  }

  function buildInput() {
    const d = inputs;
    switch (algoId) {
      case "fibonacci-memo":
      case "fibonacci-tab":
        return [Number(d.n) || 10];
      case "knapsack": {
        const weights = String(d.weights || "")
          .split(",")
          .map((x) => parseInt(x.trim()))
          .filter((n) => !isNaN(n));
        const values = String(d.values || "")
          .split(",")
          .map((x) => parseInt(x.trim()))
          .filter((n) => !isNaN(n));
        return [weights, values, Number(d.capacity) || 8];
      }
      case "lcs":
        return [d.s1 || "ABC", d.s2 || "BDC"];
      case "lis":
        return [
          String(d.arr || "")
            .split(",")
            .map((x) => parseInt(x.trim()))
            .filter((n) => !isNaN(n)),
        ];
      case "matrix-chain":
        return [
          String(d.dims || "")
            .split(",")
            .map((x) => parseInt(x.trim()))
            .filter((n) => !isNaN(n)),
        ];
      case "edit-distance":
        return [d.s1 || "kitten", d.s2 || "sitting"];
      default:
        return [];
    }
  }

  function generate() {
    if (!descriptor.debug) {
      setNotice({
        text: `${descriptor.name} is not yet implemented — coming soon.`,
        kind: "info",
      });
      return;
    }
    try {
      playback.pause();
      const input = buildInput();
      validateInput(algoId, input);
      const s = descriptor.debug(...input);
      setSteps(s);
      playback.reset();
      setNotice(null);
    } catch (e) {
      setNotice({ text: e.message, kind: "error" });
    }
  }

  // ── Input bounds validation ──
  // Limits are based on expected step count: ~tableSize × 2 events per cell.
  // Max ~5000 steps keeps playback smooth and browser responsive.
  const LIMITS = {
    "fibonacci-memo": { maxN: 30 },
    "fibonacci-tab": { maxN: 30 },
    knapsack: { maxItems: 10, maxCapacity: 20 },
    lcs: { maxLen: 15 },
    lis: { maxLen: 15 },
    "matrix-chain": { maxMatrices: 6 },
    "edit-distance": { maxLen: 15 },
  };

  function validateInput(id, input) {
    const lim = LIMITS[id];
    if (!lim) return;
    switch (id) {
      case "fibonacci-memo":
      case "fibonacci-tab": {
        const n = input[0];
        if (n > lim.maxN)
          throw new Error(
            `n=${n} is too large for visualization (max ${lim.maxN}). Reduce n to keep the visualization responsive.`,
          );
        break;
      }
      case "knapsack": {
        const [weights, , cap] = input;
        if (weights.length > lim.maxItems)
          throw new Error(
            `${weights.length} items is too many (max ${lim.maxItems}). Reduce the number of items to keep the visualization responsive.`,
          );
        if (cap > lim.maxCapacity)
          throw new Error(
            `Capacity ${cap} is too large (max ${lim.maxCapacity}). Reduce capacity to keep the visualization responsive.`,
          );
        break;
      }
      case "lcs": {
        const [a, b] = input;
        if (a.length > lim.maxLen || b.length > lim.maxLen)
          throw new Error(
            `Strings longer than ${lim.maxLen} characters are too large for visualization (got ${a.length} and ${b.length}). Shorten the strings to keep the visualization responsive.`,
          );
        break;
      }
      case "lis": {
        const [arr] = input;
        if (arr.length > lim.maxLen)
          throw new Error(
            `Array of ${arr.length} elements is too large for visualization (max ${lim.maxLen}). Reduce the array size to keep the visualization responsive.`,
          );
        break;
      }
      case "matrix-chain": {
        const [dims] = input;
        const matrices = dims.length - 1;
        if (matrices > lim.maxMatrices)
          throw new Error(
            `${matrices} matrices is too many for visualization (max ${lim.maxMatrices}). Reduce the number of matrices to keep the visualization responsive.`,
          );
        break;
      }
      case "edit-distance": {
        const [s, t] = input;
        if (s.length > lim.maxLen || t.length > lim.maxLen)
          throw new Error(
            `Strings longer than ${lim.maxLen} characters are too large for visualization (got ${s.length} and ${t.length}). Shorten the strings to keep the visualization responsive.`,
          );
        break;
      }
    }
  }

  // ── Input panel per algorithm ──
  function renderInputPanel() {
    const field = (label, key, placeholder) => (
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: p.textSecondary,
            marginBottom: 4,
          }}
        >
          {label}
        </div>
        <input
          value={inputs[key] ?? ""}
          onChange={(e) => setInputs((prev) => ({ ...prev, [key]: e.target.value }))}
          aria-label={label}
          placeholder={placeholder}
          style={{
            background: p.codeBg,
            border: `1px solid ${p.border}`,
            borderRadius: 5,
            color: p.textPrimary,
            padding: "5px 8px",
            fontSize: 11,
            fontFamily: "monospace",
            width: 140,
            outline: "none",
          }}
        />
      </div>
    );

    const numberField = (label, key, min = 1, max = 30) => (
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: p.textSecondary,
            marginBottom: 4,
          }}
        >
          {label}: {inputs[key]}
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={inputs[key] ?? min}
          aria-label={label}
          onChange={(e) =>
            setInputs((prev) => ({ ...prev, [key]: Number(e.target.value) }))
          }
          style={{ accentColor, width: 120 }}
        />
      </div>
    );

    switch (algoId) {
      case "fibonacci-memo":
      case "fibonacci-tab":
        return numberField("n", "n", 1, 30);
      case "knapsack":
        return (
          <>
            {field("Weights", "weights", "2,3,4,5")}
            {field("Values", "values", "3,4,5,6")}
            {numberField("Capacity", "capacity", 1, 20)}
          </>
        );
      case "lcs":
        return (
          <>
            {field("String 1", "s1", "ABCBDAB")}
            {field("String 2", "s2", "BDCAB")}
          </>
        );
      case "lis":
        return field("Array", "arr", "10,9,2,5,3,7,101,18");
      case "matrix-chain":
        return field("Dimensions", "dims", "10,30,5,60");
      case "edit-distance":
        return (
          <>
            {field("String 1", "s1", "kitten")}
            {field("String 2", "s2", "sitting")}
          </>
        );
      default:
        return null;
    }
  }

  // ── Styles ──
  const algoBtnStyle = (a) => ({
    padding: "5px 10px",
    borderRadius: 5,
    border: `1px solid ${algoId === a.id ? a.color : p.border}`,
    background: algoId === a.id ? `${a.color}18` : "transparent",
    color: algoId === a.id ? a.color : p.textSecondary,
    fontSize: 10,
    cursor: "pointer",
    fontFamily: "monospace",
  });

  return (
    <div style={{ color: p.textPrimary }}>
      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: p.purple,
          marginBottom: 14,
        }}
      >
        DP Debugger
      </div>

      {/* CONTROLS */}
      <div
        className="glass-floating"
        style={{
          borderRadius: 14,
          padding: "14px 18px",
          marginBottom: 14,
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: p.textSecondary,
              marginBottom: 6,
            }}
          >
            Algorithm
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {DP_ALGOS.map((a) => (
              <button
                key={a.id}
                onClick={() => selectAlgo(a.id)}
                style={algoBtnStyle(a)}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {renderInputPanel()}
        </div>

        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: p.textSecondary,
              marginBottom: 6,
            }}
          >
            Speed:{" "}
            {playback.speed < 300
              ? "Fast"
              : playback.speed < 700
                ? "Medium"
                : "Slow"}
          </div>
          <input
            type="range"
            min={100}
            max={1000}
            aria-label="Playback speed"
            value={1100 - playback.speed}
            onChange={(e) => playback.setSpeed(1100 - +e.target.value)}
            style={{ accentColor, width: 100 }}
          />
        </div>

        <div
          style={{ display: "flex", gap: 6, marginLeft: "auto", alignItems: "center" }}
        >
          <button
            onClick={generate}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 90%, white), ${accentColor})`,
              color: "#fff",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 600,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.28), 0 3px 10px ${accentColor}44`,
            }}
          >
            GENERATE
          </button>
          {steps.length > 0 && (
            <>
              <button
                onClick={playback.toggle}
                aria-label={playing ? "Pause" : "Play"}
                title={playing ? "Pause" : "Play"}
                style={{
                  padding: "7px 13px",
                  borderRadius: 8,
                  border: "none",
                  background: playing
                    ? "rgba(255, 59, 48, 0.12)"
                    : "rgba(48, 209, 88, 0.14)",
                  color: playing ? p.red : p.green,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {playing ? "⏸" : "▶"}
              </button>
              <button
                onClick={playback.prev}
                aria-label="Previous step"
                title="Previous step"
                className="icon-btn"
                style={{ padding: "6px 10px", fontSize: 13 }}
              >
                ◀
              </button>
              <button
                onClick={playback.next}
                aria-label="Next step"
                title="Next step"
                className="icon-btn"
                style={{ padding: "6px 10px", fontSize: 13 }}
              >
                ▶
              </button>
              <button
                onClick={playback.reset}
                aria-label="First step"
                title="First step"
                style={{ padding: "6px 10px", fontSize: 13 }}
              >
                ⏮
              </button>
              <button
                onClick={playback.goToEnd}
                aria-label="Last step"
                title="Last step"
                style={{ padding: "6px 10px", fontSize: 13 }}
              >
                ⏭
              </button>
            </>
          )}
        </div>
      </div>

      {/* NOTICE */}
      {notice && (
        <div
          role={notice.kind === "error" ? "alert" : "status"}
          className="popover-in"
          style={{
            marginBottom: 12,
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 11,
            fontFamily: "monospace",
            lineHeight: 1.5,
            background:
              notice.kind === "error"
                ? "rgba(255, 59, 48, 0.09)"
                : "rgba(48, 209, 88, 0.09)",
            boxShadow: `inset 0 0 0 1px ${
              notice.kind === "error" ? p.red : p.green
            }55`,
            color: notice.kind === "error" ? p.red : p.green,
          }}
        >
          {notice.kind === "info" ? "ℹ" : "⚠"} {notice.text}
        </div>
      )}

      {/* PROGRESS */}
      {steps.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 4,
              fontSize: 10,
            }}
          >
            <span style={{ color: accentColor, fontFamily: "monospace" }}>
              Step {step + 1} / {steps.length}
            </span>
            {current?.log && (
              <span
                style={{
                  color: p.textSecondary,
                  fontFamily: "monospace",
                  fontSize: 10,
                  background: p.codeBg,
                  padding: "2px 10px",
                  borderRadius: 4,
                }}
              >
                → {current.log}
              </span>
            )}
          </div>
          <div
            style={{
              background: "rgba(127,127,127,0.30)",
              borderRadius: 4,
              height: 4,
            }}
          >
            <div
              style={{
                width: `${((step + 1) / steps.length) * 100}%`,
                height: "100%",
                background: accentColor,
                borderRadius: 4,
                transition: "width 0.1s",
              }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={steps.length - 1}
            value={step}
            aria-label="Step position"
            onChange={(e) => playback.setStep(+e.target.value)}
            style={{ width: "100%", accentColor, marginTop: 4 }}
          />
        </div>
      )}

      {/* MAIN CONTENT */}
      {steps.length > 0 && current ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: current.table?.length > 0 ? "1.4fr 1fr" : "1fr 1fr",
            gap: 12,
            alignItems: "start",
          }}
        >
          {/* LEFT: DP Table */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <DPTableView
              table={current.table || []}
              rowLabels={current.rowLabels || []}
              colLabels={current.colLabels || []}
              current={current.current}
              phase={current.phase}
              backtrackPath={current.backtrackPath || []}
              answer={current.answer}
              complete={current.complete}
              isDark={isDark}
            />
          </div>

          {/* RIGHT: Code + Variables + Memory */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Code view */}
            <div
              className="editor-surface"
              style={{ borderRadius: 12, overflow: "hidden" }}
            >
              <div
                style={{
                  padding: "9px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: `1px solid ${p.border}`,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: accentColor,
                    fontFamily: "monospace",
                  }}
                >
                  {descriptor.name.replace(/ /g, "_").toLowerCase()}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    color: p.textSecondary,
                    fontFamily: "monospace",
                  }}
                >
                  line {(current.activeLine ?? 0) + 1}
                </span>
              </div>
              <div style={{ padding: "10px 0" }}>
                {codeLines.map(({ n, code }) => (
                  <div
                    key={n}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0,
                      background:
                        n === current.activeLine
                          ? `${accentColor}18`
                          : "transparent",
                      borderLeft:
                        n === current.activeLine
                          ? `3px solid ${accentColor}`
                          : "3px solid transparent",
                      transition: "all 0.15s",
                    }}
                  >
                    <span
                      style={{
                        width: 32,
                        textAlign: "right",
                        paddingRight: 10,
                        fontSize: 10,
                        color:
                          n === current.activeLine
                            ? accentColor
                            : p.textSecondary,
                        fontFamily: "monospace",
                        flexShrink: 0,
                        userSelect: "none",
                      }}
                    >
                      {n + 1}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: "monospace",
                        padding: "4px 12px",
                        color:
                          n === current.activeLine ? p.onAccent : p.textSecondary,
                        whiteSpace: "pre",
                      }}
                    >
                      {code}
                    </span>
                    {n === current.activeLine && (
                      <span
                        style={{
                          marginLeft: "auto",
                          marginRight: 12,
                          fontSize: 9,
                          color: accentColor,
                          background: `${accentColor}20`,
                          padding: "2px 6px",
                          borderRadius: 3,
                          fontFamily: "monospace",
                        }}
                      >
                        ← executing
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Variables */}
            <div
              className="glass-floating"
              style={{ borderRadius: 12, padding: "13px 16px" }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: p.textSecondary,
                  marginBottom: 10,
                }}
              >
                Variables
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 6,
                }}
              >
                {Object.entries(current.vars || {})
                  .filter(([, v]) => v !== undefined)
                  .map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        background: p.codeBg,
                        borderRadius: 6,
                        padding: "7px 10px",
                        border: `1px solid ${p.border}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: p.textSecondary,
                          fontFamily: "monospace",
                          marginBottom: 2,
                        }}
                      >
                        {k}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: accentColor,
                          fontFamily: "monospace",
                          fontWeight: "bold",
                        }}
                      >
                        {String(v)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Memory */}
            <div
              className="glass-floating"
              style={{ borderRadius: 12, padding: "13px 16px" }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: p.textSecondary,
                  marginBottom: 10,
                }}
              >
                Memory
              </div>
              {Object.entries(current.memory || {}).map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "baseline",
                    marginBottom: 5,
                    fontFamily: "monospace",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: p.purple,
                      width: 70,
                      flexShrink: 0,
                    }}
                  >
                    {k}
                  </span>
                  <span style={{ fontSize: 9, color: p.textSecondary }}>→</span>
                  <span
                    style={{
                      fontSize: 10,
                      color: p.textPrimary,
                      background: p.codeBg,
                      padding: "2px 8px",
                      borderRadius: 4,
                      wordBreak: "break-all",
                      whiteSpace: "pre-wrap",
                      maxHeight: 120,
                      overflow: "auto",
                    }}
                  >
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "40vh",
            gap: 12,
            opacity: 0.35,
          }}
        >
          <div style={{ fontSize: 42 }}>🧮</div>
          <div style={{ fontSize: 12 }}>
            Select a DP algorithm and click Generate
          </div>
        </div>
      )}
    </div>
  );
}
