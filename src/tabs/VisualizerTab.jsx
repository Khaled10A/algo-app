import { useEffect, useRef } from 'react';
import { Label, Empty } from '../components/ui/SharedComponents';
import { getAlgorithmForDisplay } from '../algorithms/registry';
import { playTone } from '../utils/audio';
import { getPalette, MOTION } from '../theme/tokens';

function btnBase(isDark) {
  const pf = getPalette(isDark ? "dark" : "light");
  return {
    background: pf.surface,
    border: `1px solid ${pf.btnBorder}`,
    borderRadius: 7,
    color: pf.textSecondary,
    fontSize: 13, cursor: "pointer", padding: "6px 12px",
    transition: `background ${MOTION.fast}`,
  };
}

// ── COLOR by value ────────────────────────────────────────────
function getBarColor(val, maxVal, isHighlight, highlightIdx, idx) {
  if (isHighlight) return "#ff375f";
  const ratio = val / maxVal;
  if (ratio < 0.25) return "#0a84ff";      // blue  — small
  if (ratio < 0.5)  return "#30d158";      // green — medium-small
  if (ratio < 0.75) return "#ff9f0a";      // orange — medium-large
  return "#ff453a";
}

// ── STEP DESCRIPTION ─────────────────────────────────────────
function getStepDesc(step, algo) {
  if (!step) return "";
  const { arr, highlight } = step;
  if (!highlight || highlight.length === 0) return `${algo} — Ready`;
  if (highlight.length === 1) {
    return `Inserted ${arr[highlight[0]]} at position ${highlight[0]}`;
  }
  const [a, b] = highlight;
  if (arr && a !== undefined && b !== undefined) {
    const vA = arr[a], vB = arr[b];
    if (vA !== undefined && vB !== undefined) {
      return vA > vB
        ? `⚡ Swap! A[${a}]=${vA} > A[${b}]=${vB}`
        : `✓ Compare A[${a}]=${vA} ≤ A[${b}]=${vB} — no swap`;
    }
  }
  return `Comparing positions ${a} and ${b}`;
}

// ── SPEED PRESETS ─────────────────────────────────────────────
const SPEEDS = [
  { label: "Slow",    name: "Slow",    val: 900 },
  { label: "Medium",  name: "Medium",  val: 400 },
  { label: "Fast",    name: "Fast",    val: 120 },
  { label: "Instant", name: "Instant", val: 30  },
];

const BTN_LABELS = { "⏮": "First step", "◀": "Previous step", "▶": "Next step", "⏭": "Last step" };
function btnLabel(lbl) {
  return BTN_LABELS[lbl] || lbl;
}

// ── ENHANCED ARRAY VISUALIZER ─────────────────────────────────
function EnhancedViz({ steps, currentStep, isDark }) {
  if (!steps || steps.length === 0) return null;
  const step = steps[Math.min(currentStep, steps.length - 1)];
  const arr = step.arr;
  const hi = step.highlight || [];
  const maxVal = Math.max(...arr);
  const barW = Math.min(36, Math.floor(560 / arr.length));
  const prevStep = currentStep > 0 ? steps[currentStep - 1] : null;
  const prevArr = prevStep?.arr || arr;

  return (
    <div>
      {/* BARS */}
      <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:120, padding:"0 4px", marginBottom:8 }}>
        {arr.map((v, i) => {
          const isHi = hi.includes(i);
          const changed = prevArr[i] !== v;
          return (
            <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
              {/* Value label on top */}
              <div style={{
                fontSize: barW > 20 ? 9 : 7,
                color: isHi ? pf.pink : textMute,
                marginBottom: 2, fontFamily:"monospace",
                fontWeight: isHi ? "bold" : "normal",
              }}>{v}</div>
              {/* Bar */}
              <div style={{
                width: barW,
                height: `${Math.max((v / maxVal) * 100, 4)}px`,
                background: getBarColor(v, maxVal, isHi),
                borderRadius: "3px 3px 0 0",
                transition: "height 0.12s ease, background 0.1s",
                boxShadow: isHi ? `0 0 8px ${getBarColor(v, maxVal, true)}` : "none",
                transform: isHi ? "scaleY(1.05)" : "scaleY(1)",
                transformOrigin: "bottom",
              }}/>
              {/* Index label */}
              <div style={{
                fontSize: 8, color: isHi ? pf.pink : pf.textFaint,
                fontFamily:"monospace", marginTop:2,
              }}>{i}</div>
            </div>
          );
        })}
      </div>

      {/* COLOR LEGEND */}
      <div style={{ display:"flex", gap:12, marginTop:4, flexWrap:"wrap" }}>
        {[
          ["#0a84ff","Small"],["#30d158","Med-Low"],
          ["#ff9f0a","Med-High"],["#ff453a","Large"],
          ["#ff375f","Active"],
        ].map(([color, label]) => (
          <div key={label} style={{ display:"flex", alignItems:"center", gap:4 }}>
            <div style={{ width:10, height:10, borderRadius:2, background:color }}/>
            <span style={{ fontSize:9, color: isDark ? "#475569" : "#94a3b8", fontFamily:"monospace" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────
export function VisualizerTab({ vizAlgo, vizSteps, playback, isDark }) {
  const pf = getPalette(isDark ? "dark" : "light");
  const border  = pf.border;
  const cardBg  = pf.surface;
  const textMute = pf.textSecondary;

  const vizStep = playback.index;
  const setVizStep = playback.setStep;
  const pauseViz = playback.pause;
  const vizSpeed = playback.speed;
  const setVizSpeed = playback.setSpeed;
  const vizDescriptor = getAlgorithmForDisplay(vizAlgo);
  const algoName = typeof vizDescriptor.steps === "function" ? vizDescriptor.name : String(vizAlgo);
  const hasVizAlgo = typeof vizDescriptor.steps === "function";

  const currentStep = vizSteps[vizStep] || null;
  const stepDesc = getStepDesc(currentStep, algoName);
  const prevStep = vizStep > 0 ? vizSteps[vizStep - 1] : null;
  const isSwap = currentStep && prevStep &&
    currentStep.arr.some((v, i) => v !== prevStep.arr[i]);

  // Play sound on each animated step while playing
  const lastStep = useRef(-1);
  useEffect(() => {
    if (!playback.playing) return;
    if (vizStep !== lastStep.current && currentStep?.highlight?.length > 0) {
      const arr = currentStep.arr;
      const hi = currentStep.highlight;
      if (arr && hi[0] !== undefined) {
        playTone(200 + (arr[hi[0]] / Math.max(...arr)) * 600, 0.1, "sine", 0.12);
      }
      lastStep.current = vizStep;
    }
  }, [vizStep, playback.playing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Comparison counter
  const totalComps = vizSteps.filter(s => s.highlight?.length > 0).length;
  const doneComps  = vizSteps.slice(0, vizStep + 1).filter(s => s.highlight?.length > 0).length;

  return (
    <div>
      <Label color="#4ade80">Sorting visualizer</Label>
      {!hasVizAlgo ? (
        <Empty icon="🎬" text="Pick an algorithm from the sidebar" />
      ) : vizSteps.length === 0 ? (
        <Empty icon="🎬" text="Generate an array to visualize" />
      ) : (
        <div style={{ background: cardBg, borderRadius:10, border:`1px solid ${border}`, padding:18, maxWidth:680 }}>

          {/* HEADER ROW */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, flexWrap:"wrap", gap:8 }}>
            <span style={{ fontSize:11, color:pf.green, letterSpacing:0.2, fontWeight:700 }}>
              {algoName.toUpperCase()}
            </span>
            <div style={{ display:"flex", gap:10 }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:8, color:textMute, letterSpacing:1 }}>STEP</div>
                <div style={{ fontSize:15, color:pf.green, fontWeight:600, fontVariantNumeric: "tabular-nums" }}>
                  {vizStep + 1}<span style={{ color:textMute, fontSize:10 }}>/{vizSteps.length}</span>
                </div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:8, color:textMute, letterSpacing:1 }}>OPS DONE</div>
                <div style={{ fontSize:15, color:pf.orange, fontWeight:600, fontVariantNumeric: "tabular-nums" }}>
                  {doneComps}<span style={{ color:textMute, fontSize:10 }}>/{totalComps}</span>
                </div>
              </div>
            </div>
          </div>

          {/* STEP DESCRIPTION */}
          <div style={{
            background: isSwap ? "rgba(255, 55, 95, 0.07)" : "rgba(48, 209, 88, 0.06)",
            border: `1px solid ${isSwap ? "rgba(255, 55, 95, 0.28)" : "rgba(48, 209, 88, 0.20)"}`,
            borderRadius:7, padding:"7px 12px", marginBottom:14,
            fontSize:12,
            color: isSwap ? pf.pink : textMute,
            minHeight:30, display:"flex", alignItems:"center",
          }}>
            {stepDesc || "Ready"}
          </div>

          {/* BARS */}
          <EnhancedViz steps={vizSteps} currentStep={vizStep} isDark={isDark} />

          {/* PROGRESS BAR */}
          <div style={{ background: border, borderRadius:4, height:4, margin:"14px 0 4px" }}>
            <div style={{ width:`${((vizStep+1)/vizSteps.length)*100}%`, height:"100%",
              background:"linear-gradient(90deg,#30d158,#0a84ff)", borderRadius:4, transition:"width 0.1s" }}/>
          </div>
          <input type="range" min={0} max={vizSteps.length-1} value={vizStep}
            onChange={e => { pauseViz(); setVizStep(+e.target.value); }}
            style={{ width:"100%", accentColor:"#30d158", marginBottom:10 }} />

          {/* CONTROLS */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
            {/* Step buttons */}
            <div style={{ display:"flex", gap:6 }}>
              {[["⏮",playback.reset],["◀",playback.prev],
                ["▶",playback.next],["⏭",playback.goToEnd]
              ].map(([lbl,fn]) => (
                <button key={lbl} onClick={fn} style={{ ...btnBase(isDark), fontSize:14, padding:"5px 12px" }} aria-label={btnLabel(lbl)}>{lbl}</button>
              ))}
            </div>

            {/* Speed presets */}
            <div style={{ display:"flex", gap:4, alignItems:"center" }}>
              <span style={{ fontSize:9, color:textMute, marginRight:4, fontFamily:"monospace" }}>SPEED</span>
              {SPEEDS.map(({ label, name, val }) => (
                <button key={name} onClick={() => setVizSpeed && setVizSpeed(val)} style={{
                  padding:"4px 10px", borderRadius:5, fontSize:10, cursor:"pointer",
                  fontFamily:"monospace", border:`1px solid ${vizSpeed===val ? "#4ade80" : border}`,
                  background: vizSpeed===val ? "rgba(48, 209, 88, 0.12)" : "transparent",
                  color: vizSpeed===val ? pf.green : textMute,
                  transition:"all 0.15s",
                }} title={name}>{label} {name}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
