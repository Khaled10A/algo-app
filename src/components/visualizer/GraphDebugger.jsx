import { useState } from "react";
import { getAlgorithm } from "../../algorithms/registry";
import { normalizeGraph, isWeightedGraph, edgeKey } from "../../algorithms/graphs/graph";
import { playTone, playVictory } from "../../utils/audio";
import { usePlayback } from "../../hooks/usePlayback";
import { getPalette } from "../../theme/tokens";

const DEFAULT_GRAPH = {
  A: [["B", 4], ["D", 2]],
  B: [["A", 4], ["C", 5], ["E", 10]],
  C: [["B", 5], ["F", 3]],
  D: [["A", 2], ["E", 7]],
  E: [["B", 10], ["D", 7], ["F", 4]],
  F: [["C", 3], ["E", 4]],
  G: [["D", 3]],
};

const GRAPH_DESCRIPTORS = {
  dfs: getAlgorithm("dfs"),
  bfs: getAlgorithm("bfs"),
  dijkstra: getAlgorithm("dijkstra"),
};

const NODE_POS = {
  A: { x: 80,  y: 60  },
  B: { x: 200, y: 60  },
  C: { x: 320, y: 60  },
  D: { x: 80,  y: 160 },
  E: { x: 200, y: 160 },
  F: { x: 320, y: 160 },
  G: { x: 80,  y: 260 },
};

export function GraphDebugger({ isDark }) {
  const p = getPalette(isDark ? "dark" : "light");
  const border   = p.border;
  const cardBg   = p.surface;
  const codeBg   = p.codeBg;
  const textMain = p.textPrimary;
  const textMute = p.textSecondary;

  const [algoId, setAlgoId] = useState("dfs");
  const [startNode, setStart] = useState("A");
  const [steps, setSteps] = useState([]);

  const playback = usePlayback({ length: steps.length, initialSpeed: 600, onFinish: playVictory });
  const { index: step, playing } = playback;

  const descriptor = GRAPH_DESCRIPTORS[algoId];
  const current   = steps[step] || null;
  const codeLines = descriptor.codeLines;
  const accentColor = descriptor.color;

  function generate() {
    playback.pause();
    const s = descriptor.debug(DEFAULT_GRAPH, startNode);
    setSteps(s);
    playback.reset();
  }

  function selectAlgo(id) {
    setAlgoId(id);
    setSteps([]);
    playback.reset();
  }

  const btnStyle = (active) => ({
    padding:"5px 14px", borderRadius:5, border:`1px solid ${active ? accentColor : border}`,
    background: active ? `${accentColor}18` : "transparent",
    color: active ? accentColor : textMute,
    fontSize:10, cursor:"pointer", fontFamily:"monospace", transition:"all 0.15s",
  });

  return (
    <div>
      <div style={{ fontSize:12, letterSpacing:2, color:accentColor, marginBottom:14, fontWeight:"bold" }}>
        Graph debugger
      </div>

      {/* CONTROLS */}
      <div className="glass-floating" style={{ borderRadius:14, padding:"12px 16px", marginBottom:14, display:"flex", gap:16, flexWrap:"wrap", alignItems:"flex-end" }}>
        <div>
          <div style={{ fontSize:8, color:textMute, letterSpacing:2, marginBottom:6 }}>Algorithm</div>
          <div style={{ display:"flex", gap:5 }}>
            {["dfs","bfs","dijkstra"].map((id) => (
              <button key={id} onClick={() => selectAlgo(id)} aria-pressed={algoId===id} style={btnStyle(algoId===id)}>{GRAPH_DESCRIPTORS[id].name}</button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize:8, color:textMute, letterSpacing:2, marginBottom:6 }}>Start node</div>
          <div style={{ display:"flex", gap:4 }}>
            {Object.keys(DEFAULT_GRAPH).map((n) => (
              <button key={n} onClick={() => setStart(n)} aria-pressed={startNode===n} style={btnStyle(startNode===n)}>{n}</button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize:8, color:textMute, letterSpacing:2, marginBottom:6 }}>
            Speed: {playback.speed<300?"Fast":playback.speed<700?"Medium":"Slow"}
          </div>
          <input type="range" min={100} max={1000} aria-label="Playback speed"
            value={1100-playback.speed}
            onChange={(e) => playback.setSpeed(1100-+e.target.value)}
            style={{ accentColor, width:100 }} />
        </div>

        <div style={{ display:"flex", gap:6, marginLeft:"auto" }}>
          <button onClick={generate} style={{
            padding:"8px 16px", borderRadius:8, border:"none",
            background:`linear-gradient(180deg, color-mix(in srgb, ${accentColor} 90%, white), ${accentColor})`,
            color:"#fff", fontSize:12, cursor:"pointer", fontWeight:600,
            boxShadow:`inset 0 1px 0 rgba(255,255,255,0.28), 0 3px 10px ${accentColor}44`,
          }}>GENERATE</button>
          {steps.length > 0 && <>
            <button onClick={playback.toggle} aria-label={playing?"Pause":"Play"} title={playing?"Pause":"Play"} style={{
              padding:"7px 12px", borderRadius:6,
              border:`1px solid ${playing?p.red:p.green}`,
              background: playing?"rgba(255,59,48,0.10)":"rgba(48,209,88,0.12)",
              color: playing?p.red:p.green, fontSize:12, cursor:"pointer",
            }}>{playing?"⏸":"▶"}</button>
            <button onClick={playback.reset} aria-label="First step" title="First step" style={{ padding:"6px 10px", borderRadius:5, border:`1px solid ${border}`, background:"transparent", color:textMute, fontSize:13, cursor:"pointer" }}>⏮</button>
            <button onClick={playback.prev} aria-label="Previous step" title="Previous step" style={{ padding:"6px 10px", borderRadius:5, border:`1px solid ${border}`, background:"transparent", color:textMute, fontSize:13, cursor:"pointer" }}>◀</button>
            <button onClick={playback.next} aria-label="Next step" title="Next step" style={{ padding:"6px 10px", borderRadius:5, border:`1px solid ${border}`, background:"transparent", color:textMute, fontSize:13, cursor:"pointer" }}>▶</button>
            <button onClick={playback.goToEnd} aria-label="Last step" title="Last step" style={{ padding:"6px 10px", borderRadius:5, border:`1px solid ${border}`, background:"transparent", color:textMute, fontSize:13, cursor:"pointer" }}>⏭</button>
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
          <div style={{ background:p.trackBg, borderRadius:4, height:4, marginBottom:4 }}>
            <div style={{ width:`${((step+1)/steps.length)*100}%`, height:"100%", background:accentColor, borderRadius:4, transition:"width 0.1s" }}/>
          </div>
          <input type="range" min={0} max={steps.length-1} value={step} aria-label="Step position"
            onChange={(e) => playback.setStep(+e.target.value)}
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
            <div className="surface-card" style={{ borderRadius:12, padding:"14px" }}>
              <div style={{ fontSize:11, fontWeight:600, color:textMute, marginBottom:8 }}>Graph</div>
              <GraphSVG graph={DEFAULT_GRAPH} step={current} isDark={isDark} stackLabel={algoId === "dijkstra" ? "In queue" : "In Stack"} />
            </div>

            <div className="glass-floating" style={{ borderRadius:12, padding:"13px 14px" }}>
              <div style={{ fontSize:11, fontWeight:600, color:textMute, marginBottom:8 }}>Visit order</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                {(current?.visitOrder || []).map((n, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <div style={{
                      width:28, height:28, borderRadius:"50%",
                      background: n === current?.current ? accentColor : p.green,
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

            <div className="editor-surface" style={{ borderRadius:12, overflow:"hidden" }}>
              <div style={{ padding:"8px 12px", borderBottom:`1px solid ${border}`, display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:9, color:accentColor, letterSpacing:2, fontFamily:"monospace" }}>{descriptor.name}.JS</span>
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

            <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:8, color:textMute, letterSpacing:2, marginBottom:8 }}>
                {algoId === "dfs" ? "Call stack" : algoId === "dijkstra" ? "Priority queue" : "Queue"}
              </div>
              {algoId === "dfs" ? (
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
                      {n}{i===0&&<span style={{ fontSize:8, marginLeft:4 }}>{algoId === "dijkstra" ? "MIN" : "FRONT"}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-floating" style={{ borderRadius:12, padding:"13px 14px" }}>
              <div style={{ fontSize:11, fontWeight:600, color:textMute, marginBottom:8 }}>Variables</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                {Object.entries(current?.vars || {}).map(([k,v]) => (
                  <div key={k} style={{ background:codeBg, borderRadius:5, padding:"6px 10px", border:`1px solid ${border}` }}>
                    <div style={{ fontSize:10, color:textMute, fontFamily:"monospace", marginBottom:1 }}>{k}</div>
                    <div style={{ fontSize:12, color:accentColor, fontFamily:"monospace", fontWeight:"bold" }}>{String(v)}</div>
                  </div>
                ))}
              </div>
            </div>

            {algoId === "dijkstra" && current?.distances && (
              <div className="glass-floating" style={{ borderRadius:12, padding:"13px 14px" }}>
                <div style={{ fontSize:11, fontWeight:600, color:textMute, marginBottom:8 }}>Distances</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {Object.entries(current.distances).map(([node, d]) => (
                    <div key={node} style={{
                      background:codeBg, borderRadius:5, padding:"4px 10px", border:`1px solid ${border}`,
                      fontFamily:"monospace", fontSize:11, display:"flex", gap:6,
                    }}>
                      <span style={{ color:textMute }}>{node}</span>
                      <span style={{ color: !Number.isFinite(d) ? p.red : accentColor, fontWeight: Number.isFinite(d) ? 700 : 400 }}>
                        {Number.isFinite(d) ? String(d) : "∞"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GraphSVG({ graph, step, isDark, stackLabel = "In Stack" }) {
  if (!step) return null;
  const {
    visited, current, callStack, heap, distances, previous,
    currentEdge, relaxedEdge, complete,
  } = step;
  const p = getPalette(isDark ? "dark" : "light");

  const { adjacency } = normalizeGraph(graph);
  const weighted = isWeightedGraph(graph);

  const edges = [];
  const seen = new Set();
  Object.entries(adjacency).forEach(([node, nbs]) => {
    nbs.forEach(({ to, weight }) => {
      const key = edgeKey(node, to);
      if (seen.has(key)) return;
      seen.add(key);
      const a = NODE_POS[node], b = NODE_POS[to];
      if (a && b) edges.push({ key, from: node, to, weight, a, b });
    });
  });

  const treeKeys = new Set();
  if (complete && previous) {
    Object.entries(previous).forEach(([child, from]) => {
      if (from) treeKeys.add(edgeKey(from, child));
    });
  }

  const edgeStyle = (e) => {
    const key = edgeKey(e.from, e.to);
    const isCurrent = currentEdge && edgeKey(currentEdge[0], currentEdge[1]) === key;
    const isRelaxed = relaxedEdge && edgeKey(relaxedEdge[0], relaxedEdge[1]) === key;
    const isTree = complete && treeKeys.has(key);
    if (isCurrent) return { stroke: p.accent, strokeWidth: 3.2 };
    if (isRelaxed) return { stroke: p.green, strokeWidth: 3 };
    if (isTree) return { stroke: p.green, strokeWidth: 2.5, opacity: 0.9 };
    return { stroke: isDark ? "#3a3a3e" : "#c8c8cd", strokeWidth: 2 };
  };

  return (
    <svg viewBox="0 0 400 330" style={{ width:"100%", maxWidth:420 }} role="img" aria-label="Graph algorithm visualization">
      {edges.map(e => {
        const style = edgeStyle(e);
        return (
          <g key={e.key}>
            <line x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y}
              stroke={style.stroke} strokeWidth={style.strokeWidth} opacity={style.opacity ?? 1}
              strokeLinecap="round" style={{ transition: "stroke 0.2s, stroke-width 0.2s" }} />
            {weighted && (
              <text
                x={(e.a.x + e.b.x) / 2} y={(e.a.y + e.b.y) / 2 - 5}
                textAnchor="middle" fontSize={9} fontFamily="monospace"
                fill={p.textSecondary}
              >
                {e.weight}
              </text>
            )}
          </g>
        );
      })}

      {Object.entries(NODE_POS).map(([node, pos]) => {
        const isCurrent  = node === current;
        const isVisited  = visited?.has(node);
        const isInQueue  = heap?.includes(node);
        const isInStack  = isInQueue || callStack?.includes(node);

        const fill = isCurrent  ? p.accent
                   : isInStack  ? p.purple
                   : isVisited  ? p.green
                   : (isDark ? "#2c2c30" : "#e8e8ed");

        const stroke = isCurrent ? p.accent
                     : isInStack ? p.purple
                     : isVisited ? p.green
                     : (isDark ? "#55555c" : "#9a9aa2");

        const dist = distances ? distances[node] : undefined;
        const distLabel = dist === undefined || !Number.isFinite(dist) ? "∞" : String(dist);

        return (
          <g key={node}>
            <circle cx={pos.x} cy={pos.y} r={22}
              fill={fill} stroke={stroke} strokeWidth={isCurrent ? 3 : 1.5}
              style={{ filter: isCurrent ? `drop-shadow(0 0 8px ${p.accent})` : "none", transition:"all 0.2s" }}
            />
            <text x={pos.x} y={pos.y + 5} textAnchor="middle"
              fontSize={14} fontWeight="bold" fontFamily="monospace"
              fill={isCurrent || isVisited || isInStack ? "#0f172a" : (isDark ? "#9a9aa2" : "#55555c")}>
              {node}
            </text>
            {distances && (
              <text x={pos.x} y={pos.y + 38} textAnchor="middle"
                fontSize={10.5} fontWeight="bold" fontFamily="monospace"
                fill={isCurrent ? p.accent : distLabel === "∞" ? p.red : p.textSecondary}>
                {distLabel}
              </text>
            )}
          </g>
        );
      })}

      {[[p.accent,"Current"],[p.purple,stackLabel],[p.green,"Visited"],].map(([c,l], i) => (
        <g key={l}>
          <circle cx={20 + i*100} cy={316} r={7} fill={c}/>
          <text x={32 + i*100} y={320} fontSize={9} fill={p.textSecondary} fontFamily="monospace">{l}</text>
        </g>
      ))}
    </svg>
  );
}
