import { useEffect, useRef } from 'react';
import { Label, Empty } from '../components/ui/SharedComponents';
import { btnBase } from '../utils/constants';

// ── AUDIO ────────────────────────────────────────────────────
function playSwapSound(val, maxVal) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine";
    const freq = 200 + (val / maxVal) * 600;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
  } catch(e) {}
}

// ── COLOR by value ────────────────────────────────────────────
function getBarColor(val, maxVal, isHighlight, highlightIdx, idx) {
  if (isHighlight) return "#f472b6"; // pink for active
  const ratio = val / maxVal;
  if (ratio < 0.25) return "#38bdf8";      // blue  — small
  if (ratio < 0.5)  return "#4ade80";      // green — medium-small
  if (ratio < 0.75) return "#fb923c";      // orange — medium-large
  return "#f87171";                        // red   — large
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
  { label: "🐢", name: "Slow",    val: 900 },
  { label: "🚶", name: "Medium",  val: 400 },
  { label: "🏃", name: "Fast",    val: 120 },
  { label: "⚡", name: "Instant", val: 30  },
];

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
                color: isHi ? "#f472b6" : isDark ? "#64748b" : "#94a3b8",
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
                fontSize: 8, color: isHi ? "#f472b6" : isDark ? "#334155" : "#cbd5e1",
                fontFamily:"monospace", marginTop:2,
              }}>{i}</div>
            </div>
          );
        })}
      </div>

      {/* COLOR LEGEND */}
      <div style={{ display:"flex", gap:12, marginTop:4, flexWrap:"wrap" }}>
        {[
          ["#38bdf8","Small"],["#4ade80","Med-Low"],
          ["#fb923c","Med-High"],["#f87171","Large"],
          ["#f472b6","Active"],
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
export function VisualizerTab({ vizAlgo, vizSteps, vizStep, setVizStep, pauseViz, vizSpeed, setVizSpeed, isDark }) {
  const border  = isDark ? "#1e293b" : "#e2e8f0";
  const cardBg  = isDark ? "#0f172a" : "#f1f5f9";
  const textMute = isDark ? "#475569" : "#94a3b8";

  const currentStep = vizSteps[vizStep] || null;
  const stepDesc = getStepDesc(currentStep, vizAlgo);
  const prevStep = vizStep > 0 ? vizSteps[vizStep - 1] : null;
  const isSwap = currentStep && prevStep &&
    JSON.stringify(currentStep.arr) !== JSON.stringify(prevStep.arr);

  // Play sound on swap
  const lastStep = useRef(-1);
  useEffect(() => {
    if (vizStep !== lastStep.current && currentStep?.highlight?.length > 0) {
      const arr = currentStep.arr;
      const hi = currentStep.highlight;
      if (arr && hi[0] !== undefined) {
        playSwapSound(arr[hi[0]], Math.max(...arr));
      }
      lastStep.current = vizStep;
    }
  }, [vizStep]);

  // Comparison counter
  const totalComps = vizSteps.filter(s => s.highlight?.length > 0).length;
  const doneComps  = vizSteps.slice(0, vizStep + 1).filter(s => s.highlight?.length > 0).length;

  return (
    <div>
      <Label color="#4ade80">SORTING VISUALIZER</Label>
      {vizSteps.length === 0 ? (
        <Empty icon="🎬" text="Generate an array to visualize" />
      ) : (
        <div style={{ background: cardBg, borderRadius:10, border:`1px solid ${border}`, padding:18, maxWidth:680 }}>

          {/* HEADER ROW */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, flexWrap:"wrap", gap:8 }}>
            <span style={{ fontSize:11, color:"#4ade80", letterSpacing:2, fontFamily:"monospace", fontWeight:"bold" }}>
              {vizAlgo.toUpperCase()}
            </span>
            <div style={{ display:"flex", gap:10 }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:8, color:textMute, letterSpacing:1 }}>STEP</div>
                <div style={{ fontSize:13, color:"#4ade80", fontFamily:"monospace", fontWeight:"bold" }}>
                  {vizStep + 1}<span style={{ color:textMute, fontSize:10 }}>/{vizSteps.length}</span>
                </div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:8, color:textMute, letterSpacing:1 }}>OPS DONE</div>
                <div style={{ fontSize:13, color:"#fb923c", fontFamily:"monospace", fontWeight:"bold" }}>
                  {doneComps}<span style={{ color:textMute, fontSize:10 }}>/{totalComps}</span>
                </div>
              </div>
            </div>
          </div>

          {/* STEP DESCRIPTION */}
          <div style={{
            background: isSwap ? "rgba(244,114,182,0.08)" : "rgba(74,222,128,0.05)",
            border: `1px solid ${isSwap ? "rgba(244,114,182,0.25)" : "rgba(74,222,128,0.15)"}`,
            borderRadius:7, padding:"7px 12px", marginBottom:14,
            fontSize:11, fontFamily:"monospace",
            color: isSwap ? "#f472b6" : isDark ? "#94a3b8" : "#64748b",
            minHeight:30, display:"flex", alignItems:"center",
          }}>
            {stepDesc || "Ready"}
          </div>

          {/* BARS */}
          <EnhancedViz steps={vizSteps} currentStep={vizStep} isDark={isDark} />

          {/* PROGRESS BAR */}
          <div style={{ background: border, borderRadius:4, height:4, margin:"14px 0 4px" }}>
            <div style={{ width:`${((vizStep+1)/vizSteps.length)*100}%`, height:"100%",
              background:"linear-gradient(90deg,#4ade80,#38bdf8)", borderRadius:4, transition:"width 0.1s" }}/>
          </div>
          <input type="range" min={0} max={vizSteps.length-1} value={vizStep}
            onChange={e => { pauseViz(); setVizStep(+e.target.value); }}
            style={{ width:"100%", accentColor:"#4ade80", marginBottom:10 }} />

          {/* CONTROLS */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
            {/* Step buttons */}
            <div style={{ display:"flex", gap:6 }}>
              {[["⏮",()=>setVizStep(0)],["◀",()=>setVizStep(s=>Math.max(0,s-1))],
                ["▶",()=>setVizStep(s=>Math.min(vizSteps.length-1,s+1))],["⏭",()=>setVizStep(vizSteps.length-1)]
              ].map(([lbl,fn]) => (
                <button key={lbl} onClick={fn} style={{ ...btnBase, fontSize:14, padding:"5px 12px" }}>{lbl}</button>
              ))}
            </div>

            {/* Speed presets */}
            <div style={{ display:"flex", gap:4, alignItems:"center" }}>
              <span style={{ fontSize:9, color:textMute, marginRight:4, fontFamily:"monospace" }}>SPEED</span>
              {SPEEDS.map(({ label, name, val }) => (
                <button key={name} onClick={() => setVizSpeed && setVizSpeed(val)} style={{
                  padding:"4px 10px", borderRadius:5, fontSize:10, cursor:"pointer",
                  fontFamily:"monospace", border:`1px solid ${vizSpeed===val ? "#4ade80" : border}`,
                  background: vizSpeed===val ? "rgba(74,222,128,0.1)" : "transparent",
                  color: vizSpeed===val ? "#4ade80" : textMute,
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
