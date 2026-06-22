import { useState, useRef } from "react";
import { dfsDebug } from "../algorithms/searching/dfs";
import { bfsDebug }  from "../algorithms/searching/bfs";

// ── DEFAULT GRAPH ─────────────────────────────────────────────
const DEFAULT_GRAPH = {
  A: ["B", "D"],
  B: ["A", "C", "E"],
  C: ["B", "F"],
  D: ["A", "E", "G"],
  E: ["B", "D", "F"],
  F: ["C", "E"],
  G: ["D"],
};

// Node positions (x, y) in SVG viewBox 0 0 400 300
const NODE_POS = {
  A: { x: 80,  y: 60  },
  B: { x: 200, y: 60  },
  C: { x: 320, y: 60  },
  D: { x: 80,  y: 160 },
  E: { x: 200, y: 160 },
  F: { x: 320, y: 160 },
  G: { x: 80,  y: 260 },
};

const CODE_DFS = [
  { n: 0, code: "function dfs(graph, start) {" },
  { n: 1, code: "  visited = new Set()" },
  { n: 2, code: "  visited.add(u);  visit(u)" },
  { n: 3, code: "  callStack.push(u)" },
  { n: 4, code: "  for v in adj[u]:" },
  { n: 5, code: "    if not visited[v]: dfs(v)" },
  { n: 6, code: "  callStack.pop()  ← u done" },
  { n: 7, code: "}" },
];

const CODE_BFS = [
  { n: 0, code: "function bfs(graph, start) {" },
  { n: 1, code: "  queue = [start],  visited = {start}" },
  { n: 2, code: "  node = queue.dequeue()" },
  { n: 3, code: "  visit(node)" },
  { n: 4, code: "  for v in adj[node]:" },
  { n: 5, code: "    if not visited[v]: enqueue(v)" },
  { n: 6, code: "}" },
];

// ── AUDIO ─────────────────────────────────────────────────────
function playNote(freq = 440, dur = 0.1) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch(e) {}
}

function playVictory() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playNote(f, 0.18), i * 130));
}

// ── GRAPH SVG ─────────────────────────────────────────────────
function GraphSVG({ graph, step, isDark }) {
  if (!step) return null;
  const { visited, current, callStack, visitOrder } = step;
  const border   = isDark ? "#1e293b" : "#e2e8f0";
  const nodeBg   = isDark ? "#0f172a" : "#f1f5f9";
  const textCol  = isDark ? "#e2e8f0" : "#1e293b";

  // Draw edges
  const edges = [];
  Object.entries(graph).forEach(([node, neighbors]) => {
    neighbors.forEach(nb => {
      if (node < nb) { // avoid duplicates
        const a = NODE_POS[node], b = NODE_POS[nb];
        if (a && b) edges.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, key: `${node}-${nb}` });
      }
    });
  });

  return (
    <svg viewBox="0 0 400 310" style={{ width:"100%", maxWidth:420 }}>
      {/* Edges */}
      {edges.map(e => (
        <line key={e.key} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
          stroke={isDark ? "#334155" : "#cbd5e1"} strokeWidth="2" />
      ))}

      {/* Nodes */}
      {Object.entries(NODE_POS).map(([node, pos]) => {
        const isCurrent  = node === current;
        const isVisited  = visited?.has(node);
        const isInStack  = callStack?.includes(node);

        const fill = isCurrent  ? "#38bdf8"
                   : isInStack  ? "#a78bfa"
                   : isVisited  ? "#4ade80"
                   : (isDark ? "#1e293b" : "#e2e8f0");

        const stroke = isCurrent ? "#38bdf8"
                     : isInStack ? "#a78bfa"
                     : isVisited ? "#4ade80"
                     : (isDark ? "#475569" : "#94a3b8");

        return (
          <g key={node}>
            <circle cx={pos.x} cy={pos.y} r={22}
              fill={fill} stroke={stroke} strokeWidth={isCurrent ? 3 : 1.5}
              style={{ filter: isCurrent ? "drop-shadow(0 0 8px #38bdf8)" : "none", transition:"all 0.2s" }}
            />
            <text x={pos.x} y={pos.y + 5} textAnchor="middle"
              fontSize={14} fontWeight="bold" fontFamily="monospace"
              fill={isCurrent || isVisited || isInStack ? "#0f172a" : (isDark ? "#94a3b8" : "#475569")}>
              {node}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      {[["#38bdf8","Current"],["#a78bfa","In Stack"],["#4ade80","Visited"],].map(([c,l], i) => (
        <g key={l}>
          <circle cx={20 + i*100} cy={295} r={7} fill={c}/>
          <text x={32 + i*100} y={299} fontSize={9} fill={isDark?"#64748b":"#94a3b8"} fontFamily="monospace">{l}</text>
        </g>
      ))}
    </svg>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────
export function GraphDebugger({ isDark }) {
  const border   = isDark ? "#1e293b" : "#e2e8f0";
  const cardBg   = isDark ? "#0f172a" : "#ffffff";
  const codeBg   = isDark ? "#0a0f1e" : "#f1f5f9";
  const textMain = isDark ? "#e2e8f0" : "#1e293b";
  const textMute = isDark ? "#64748b" : "#94a3b8";

  const [algo, setAlgo]       = useState("DFS");
  const [startNode, setStart] = useState("A");
  const [steps, setSteps]     = useState([]);
  const [step, setStep]       = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed]     = useState(600);
  const intervalRef           = useRef(null);

  const current   = steps[step] || null;
  const codeLines = algo === "DFS" ? CODE_DFS : CODE_BFS;
  const accentColor = algo === "DFS" ? "#38bdf8" : "#f472b6";

  function generate() {
    clearInterval(intervalRef.current); setPlaying(false);
    const fn = algo === "DFS" ? dfsDebug : bfsDebug;
    const s = fn(DEFAULT_GRAPH, startNode);
    setSteps(s); setStep(0);
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
        playNote(300 + (s % 8) * 50, 0.08);
        return s + 1;
      });
    }, speed);
  }
  function pause() { clearInterval(intervalRef.current); setPlaying(false); }
  function goStep(n) { pause(); setStep(Math.max(0, Math.min((steps.length||1)-1, n))); }

  const btnStyle = (active) => ({
    padding:"5px 14px", borderRadius:5, border:`1px solid ${active ? accentColor : border}`,
    background: active ? `${accentColor}18` : "transparent",
    color: active ? accentColor : textMute,
    fontSize:10, cursor:"pointer", fontFamily:"monospace", transition:"all 0.15s",
  });

  return (
    <div>
      <div style={{ fontSize:12, letterSpacing:2, color:accentColor, marginBottom:14, fontWeight:"bold" }}>
        🕸️ GRAPH DEBUGGER
      </div>

      {/* CONTROLS */}
      <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:10, padding:"12px 16px", marginBottom:14, display:"flex", gap:14, flexWrap:"wrap", alignItems:"flex-end" }}>

        {/* Algo */}
        <div>
          <div style={{ fontSize:8, color:textMute, letterSpacing:2, marginBottom:6 }}>ALGORITHM</div>
          <div style={{ display:"flex", gap:5 }}>
            {["DFS","BFS"].map(a => (
              <button key={a} onClick={() => { setAlgo(a); setSteps([]); setStep(0); }} style={btnStyle(algo===a)}>{a}</button>
            ))}
          </div>
        </div>

        {/* Start Node */}
        <div>
          <div style={{ fontSize:8, color:textMute, letterSpacing:2, marginBottom:6 }}>START NODE</div>
          <div style={{ display:"flex", gap:4 }}>
            {Object.keys(DEFAULT_GRAPH).map(n => (
              <button key={n} onClick={() => setStart(n)} style={btnStyle(startNode===n)}>{n}</button>
            ))}
          </div>
        </div>

        {/* Speed */}
        <div>
          <div style={{ fontSize:8, color:textMute, letterSpacing:2, marginBottom:6 }}>
            SPEED: {speed<300?"Fast":speed<700?"Medium":"Slow"}
          </div>
          <input type="range" min={100} max={1000} value={1100-speed}
            onChange={e => setSpeed(1100-+e.target.value)}
            style={{ accentColor, width:100 }} />
        </div>

        {/* Buttons */}
        <div style={{ display:"flex", gap:6, marginLeft:"auto" }}>
          <button onClick={generate} style={{
            padding:"7px 16px", borderRadius:6, border:"none",
            background:`linear-gradient(135deg,${accentColor},#818cf8)`,
            color:"#fff", fontSize:10, cursor:"pointer", fontFamily:"monospace", fontWeight:"bold",
          }}>⚡ GENERATE</button>
          {steps.length > 0 && <>
            <button onClick={playing ? pause : play} style={{
              padding:"7px 12px", borderRadius:6,
              border:`1px solid ${playing?"#f87171":"#4ade80"}`,
              background: playing?"rgba(248,113,113,0.1)":"rgba(74,222,128,0.1)",
              color: playing?"#f87171":"#4ade80", fontSize:12, cursor:"pointer",
            }}>{playing?"⏸":"▶"}</button>
            <button onClick={()=>goStep(step-1)} style={{ ...{ padding:"6px 10px", borderRadius:5, border:`1px solid ${border}`, background:"transparent", color:textMute, fontSize:13, cursor:"pointer" } }}>◀</button>
            <button onClick={()=>goStep(step+1)} style={{ ...{ padding:"6px 10px", borderRadius:5, border:`1px solid ${border}`, background:"transparent", color:textMute, fontSize:13, cursor:"pointer" } }}>▶</button>
          </>}
        </div>
      </div>

      {/* PROGRESS */}
      {steps.length > 0 && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, marginBottom:4 }}>
            <span style={{ color:accentColor, fontFamily:"monospace" }}>Step {step+1} / {steps.length}</span>
            {current?.log && <span style={{ color:textMute, fontFamily:"monospace", background:codeBg, padding:"2px 10px", borderRadius:4 }}>→ {current.log}</span>}
          </div>
          <div style={{ background:border, borderRadius:4, height:4, marginBottom:4 }}>
            <div style={{ width:`${((step+1)/steps.length)*100}%`, height:"100%", background:accentColor, borderRadius:4, transition:"width 0.1s" }}/>
          </div>
          <input type="range" min={0} max={steps.length-1} value={step}
            onChange={e => goStep(+e.target.value)}
            style={{ width:"100%", accentColor, marginBottom:12 }}/>
        </>
      )}

      {steps.length === 0 ? (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"40vh", gap:12, opacity:0.3 }}>
          <div style={{ fontSize:42 }}>🕸️</div>
          <div style={{ fontSize:11, color:textMute, letterSpacing:2 }}>SELECT ALGORITHM AND CLICK GENERATE</div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>

          {/* LEFT — Graph + Visit Order */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:8, color:textMute, letterSpacing:2, marginBottom:8 }}>GRAPH</div>
              <GraphSVG graph={DEFAULT_GRAPH} step={current} isDark={isDark} />
            </div>

            {/* Visit Order */}
            <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:8, color:textMute, letterSpacing:2, marginBottom:8 }}>VISIT ORDER</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                {(current?.visitOrder || []).map((n, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <div style={{
                      width:28, height:28, borderRadius:"50%",
                      background: n === current?.current ? accentColor : "#4ade80",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:11, fontWeight:"bold", color:"#0f172a", fontFamily:"monospace",
                    }}>{n}</div>
                    {i < (current?.visitOrder?.length||0)-1 && <span style={{ color:textMute, fontSize:12 }}>→</span>}
                  </div>
                ))}
                {(!current?.visitOrder?.length) && <span style={{ color:textMute, fontSize:11 }}>Not started yet...</span>}
              </div>
            </div>
          </div>

          {/* RIGHT — Code + Stack/Queue + Variables */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

            {/* Code */}
            <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:10, overflow:"hidden" }}>
              <div style={{ background:codeBg, padding:"7px 12px", borderBottom:`1px solid ${border}`, display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:9, color:accentColor, letterSpacing:2, fontFamily:"monospace" }}>{algo}.JS</span>
                <span style={{ fontSize:9, color:textMute, fontFamily:"monospace" }}>line {(current?.activeLine||0)+1}</span>
              </div>
              <div style={{ padding:"8px 0" }}>
                {codeLines.map(({ n, code }) => (
                  <div key={n} style={{
                    display:"flex", alignItems:"center",
                    background: n===current?.activeLine ? `${accentColor}18` : "transparent",
                    borderLeft: n===current?.activeLine ? `3px solid ${accentColor}` : "3px solid transparent",
                    transition:"all 0.15s",
                  }}>
                    <span style={{ width:28, textAlign:"right", paddingRight:8, fontSize:9, color:n===current?.activeLine?accentColor:textMute, fontFamily:"monospace", flexShrink:0, userSelect:"none" }}>{n+1}</span>
                    <span style={{ fontSize:11, fontFamily:"monospace", padding:"3px 10px",
                      color: n===current?.activeLine?"#fff":(isDark?"#94a3b8":"#475569"),
                      whiteSpace:"pre" }}>{code}</span>
                    {n===current?.activeLine && <span style={{ marginLeft:"auto", marginRight:10, fontSize:8, color:accentColor, background:`${accentColor}20`, padding:"1px 5px", borderRadius:3, fontFamily:"monospace" }}>← here</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Call Stack / Queue */}
            <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:8, color:textMute, letterSpacing:2, marginBottom:8 }}>
                {algo === "DFS" ? "CALL STACK" : "QUEUE"}
              </div>
              {algo === "DFS" ? (
                <div style={{ display:"flex", flexDirection:"column-reverse", gap:4 }}>
                  {(current?.callStack || []).length === 0
                    ? <span style={{ fontSize:10, color:textMute }}>Empty</span>
                    : (current?.callStack || []).map((n, i) => (
                    <div key={i} style={{
                      background: i === (current?.callStack?.length||0)-1 ? `${accentColor}20` : codeBg,
                      border: `1px solid ${i === (current?.callStack?.length||0)-1 ? accentColor : border}`,
                      borderRadius:5, padding:"5px 12px", fontSize:11, fontFamily:"monospace",
                      color: i === (current?.callStack?.length||0)-1 ? accentColor : textMute,
                      display:"flex", justifyContent:"space-between",
                    }}>
                      <span>{n}</span>
                      {i === (current?.callStack?.length||0)-1 && <span style={{ fontSize:9, color:accentColor }}>← TOP</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {(current?.queue || []).length === 0
                    ? <span style={{ fontSize:10, color:textMute }}>Empty</span>
                    : (current?.queue || []).map((n, i) => (
                    <div key={i} style={{
                      background: i===0 ? `${accentColor}20` : codeBg,
                      border:`1px solid ${i===0?accentColor:border}`,
                      borderRadius:5, padding:"4px 10px", fontSize:11,
                      fontFamily:"monospace", color: i===0?accentColor:textMute,
                    }}>
                      {n}{i===0&&<span style={{ fontSize:8, marginLeft:4 }}>FRONT</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Variables */}
            <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:8, color:textMute, letterSpacing:2, marginBottom:8 }}>VARIABLES</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                {Object.entries(current?.vars || {}).map(([k,v]) => (
                  <div key={k} style={{ background:codeBg, borderRadius:5, padding:"6px 10px", border:`1px solid ${border}` }}>
                    <div style={{ fontSize:8, color:textMute, fontFamily:"monospace", marginBottom:1 }}>{k}</div>
                    <div style={{ fontSize:12, color:accentColor, fontFamily:"monospace", fontWeight:"bold" }}>{String(v)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
