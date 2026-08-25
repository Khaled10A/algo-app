import { useState } from "react";
import { getAlgorithm } from "../../algorithms/registry";
import {
  normalizeGraph, isWeightedGraph, edgeKey,
  createDefaultGraph, createEmptyGraph,
  addNode, removeNode, addEdge, removeEdge, setEdgeWeight,
  nextNodeId,
} from "../../algorithms/graphs/graph";
import { playVictory } from "../../utils/audio";
import { usePlayback } from "../../hooks/usePlayback";
import { getPalette, MOTION } from "../../theme/tokens";

const DEFAULT_GRAPH = createDefaultGraph();

const GRAPH_DESCRIPTORS = {
  dfs: getAlgorithm("dfs"),
  bfs: getAlgorithm("bfs"),
  dijkstra: getAlgorithm("dijkstra"),
  "bellman-ford": getAlgorithm("bellman-ford"),
};

const BASE_POSITIONS = {
  A: { x: 80,  y: 60  },
  B: { x: 200, y: 60  },
  C: { x: 320, y: 60  },
  D: { x: 80,  y: 160 },
  E: { x: 200, y: 160 },
  F: { x: 320, y: 160 },
  G: { x: 80,  y: 260 },
};

const MODES = [
  { id: "select", label: "Select", hint: "Click a node to set the source, click an edge to edit it" },
  { id: "add-node", label: "Place node", hint: "Click the canvas to place a new node" },
  { id: "add-edge", label: "Connect", hint: "Click two nodes to connect them" },
  { id: "delete", label: "Delete", hint: "Click a node or an edge to remove it" },
];

function positionsFor(graph) {
  const positions = {};
  for (const id of Object.keys(graph)) {
    positions[id] = BASE_POSITIONS[id] || null;
  }
  return positions;
}

function ensurePositions(graph, positions) {
  const next = { ...positions };
  for (const id of Object.keys(graph)) {
    if (!next[id]) next[id] = freeSpot(next);
  }
  return next;
}

function freeSpot(positions) {
  const taken = Object.values(positions);
  for (let y = 60; y <= 260; y += 66) {
    for (let x = 60; x <= 340; x += 70) {
      if (!taken.some((pt) => Math.abs(pt.x - x) < 45 && Math.abs(pt.y - y) < 45)) {
        return { x, y };
      }
    }
  }
  return { x: 200 + (taken.length % 3) * 30, y: 60 };
}

export function GraphDebugger({ isDark }) {
  const p = getPalette(isDark ? "dark" : "light");
  const border   = p.border;
  const cardBg   = p.surface;
  const codeBg   = p.codeBg;
  const textMain = p.textPrimary;
  const textMute = p.textSecondary;

  const [algoId, setAlgoId] = useState("dfs");
  const [graph, setGraph] = useState(() => createDefaultGraph());
  const [positions, setPositions] = useState(() => positionsFor(createDefaultGraph()));
  const [mode, setMode] = useState("select");
  const [startNode, setStartNode] = useState("A");
  const [pendingFrom, setPendingFrom] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [edgeFrom, setEdgeFrom] = useState("A");
  const [edgeTo, setEdgeTo] = useState("B");
  const [weightInput, setWeightInput] = useState("1");
  const [notice, setNotice] = useState(null);
  const [steps, setSteps] = useState([]);

  const playback = usePlayback({ length: steps.length, initialSpeed: 600, onFinish: playVictory });
  const { index: step, playing } = playback;

  const descriptor = GRAPH_DESCRIPTORS[algoId];
  const current   = steps[step] || null;
  const codeLines = descriptor.codeLines;
  const accentColor = descriptor.color;
  const nodeIds = Object.keys(graph);

  function setNoticeMsg(text, kind = "error") {
    setNotice(text ? { text, kind } : null);
  }

  function applyMutation(fn, successMsg) {
    try {
      const next = fn(graph);
      setGraph(next);
      setPositions((prev) => ensurePositions(next, prev));
      if (!next[startNode]) {
        setStartNode(Object.keys(next)[0] || "");
      }
      setSteps([]);
      playback.reset();
      setSelectedEdge(null);
      setPendingFrom(null);
      setNoticeMsg(successMsg || null, "ok");
    } catch (e) {
      setNoticeMsg(e.message, "error");
    }
  }

  function generate() {
    playback.pause();
    if (nodeIds.length === 0) {
      setNoticeMsg("The graph is empty — add a node first.", "error");
      return;
    }
    try {
      const s = descriptor.debug(graph, startNode);
      setSteps(s);
      playback.reset();
      setNoticeMsg(null);
    } catch (e) {
      setNoticeMsg(e.message, "error");
    }
  }

  function selectAlgo(id) {
    setAlgoId(id);
    setSteps([]);
    playback.reset();
    setNoticeMsg(null);
  }

  function handleAddNode() {
    const id = nextNodeId(graph);
    applyMutation((g) => addNode(g, id), `Node ${id} added`);
  }

  function handleAddEdge() {
    const weight = parseFloat(weightInput);
    applyMutation((g) => addEdge(g, edgeFrom, edgeTo, weight), `Edge ${edgeFrom} — ${edgeTo} added`);
  }

  function handleUpdateWeight() {
    const weight = parseFloat(weightInput);
    if (!edgeFrom || !edgeTo || edgeFrom === edgeTo) {
      setNoticeMsg("Pick two different nodes to identify an edge.", "error");
      return;
    }
    applyMutation((g) => setEdgeWeight(g, edgeFrom, edgeTo, weight), `Edge ${edgeFrom} — ${edgeTo} weight set to ${weight}`);
  }

  function handleRemoveEdge() {
    if (!edgeFrom || !edgeTo || edgeFrom === edgeTo) {
      setNoticeMsg("Pick two different nodes to identify an edge.", "error");
      return;
    }
    applyMutation((g) => removeEdge(g, edgeFrom, edgeTo), `Edge ${edgeFrom} — ${edgeTo} removed`);
  }

  function handleReset() {
    applyMutation((g) => createEmptyGraph(), "Graph cleared");
    setPositions({});
  }

  function handleRestoreDefault() {
    const restored = createDefaultGraph();
    setGraph(restored);
    setPositions(positionsFor(restored));
    if (!restored[startNode]) setStartNode("A");
    setSteps([]);
    playback.reset();
    setSelectedEdge(null);
    setPendingFrom(null);
    setNoticeMsg("Default example graph restored", "ok");
  }

  function handleNodeClick(id) {
    if (mode === "add-edge") {
      if (!pendingFrom) {
        setPendingFrom(id);
        setNoticeMsg(`Edge start: ${id} — click the target node.`, "ok");
      } else if (id === pendingFrom) {
        setPendingFrom(null);
        setNoticeMsg(null);
      } else {
        const weight = parseFloat(weightInput);
        const from = pendingFrom, to = id;
        applyMutation((g) => addEdge(g, from, to, weight), `Edge ${from} — ${to} added`);
      }
      return;
    }
    if (mode === "delete") {
      applyMutation((g) => removeNode(g, id), `Node ${id} removed`);
      return;
    }
    setStartNode(id);
    setNoticeMsg(`Source node: ${id}`, "ok");
  }

  function handleEdgeClick(from, to) {
    if (mode === "delete") {
      applyMutation((g) => removeEdge(g, from, to), `Edge ${from} — ${to} removed`);
      return;
    }
    setSelectedEdge([from, to]);
    setEdgeFrom(from);
    setEdgeTo(to);
    const entry = (graph[from] || []).find((e) => {
      const norm = Array.isArray(e) ? e : [e, 1];
      return norm[0] === to;
    });
    setWeightInput(String(Array.isArray(entry) ? entry[1] : 1));
    setNoticeMsg(`Edge ${from} — ${to} selected`, "ok");
  }

  function handleCanvasClick(x, y) {
    if (mode !== "add-node") return;
    const id = nextNodeId(graph);
    applyMutation((g) => addNode(g, id), `Node ${id} added`);
    setPositions((prev) => ({ ...prev, [id]: { x, y } }));
  }

  const btnStyle = (active) => ({
    padding:"5px 14px", borderRadius:5, border:`1px solid ${active ? accentColor : border}`,
    background: active ? `${accentColor}18` : "transparent",
    color: active ? accentColor : textMute,
    fontSize:10, cursor:"pointer", transition:"all 0.15s",
  });

  const smallBtn = {
    padding:"5px 12px", borderRadius:7, border:`1px solid ${p.btnBorder}`,
    background:"transparent", color:p.textPrimary, fontSize:12, fontWeight:500,
    cursor:"pointer",
  };

  const selectStyle = {
    background: p.inputBg, color: p.textPrimary, border: `1px solid ${p.borderStrong}`,
    borderRadius: 6, padding: "4px 8px", fontSize: 12,
  };

  const modeHint = MODES.find((m) => m.id === mode)?.hint || "";

  return (
    <div>
      <div style={{ fontSize:12, letterSpacing:2, color:accentColor, marginBottom:14, fontWeight:"bold" }}>
        Graph debugger
      </div>

      {/* CONTROLS */}
      <div className="glass-floating" style={{ borderRadius:14, padding:"12px 16px", marginBottom:10, display:"flex", gap:16, flexWrap:"wrap", alignItems:"flex-end" }}>
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:textMute, marginBottom:6 }}>Algorithm</div>
          <div style={{ display:"flex", gap:5 }}>
            {["dfs","bfs","dijkstra","bellman-ford"].map((id) => (
              <button key={id} onClick={() => selectAlgo(id)} aria-pressed={algoId===id} style={btnStyle(algoId===id)}>{GRAPH_DESCRIPTORS[id].name}</button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize:11, fontWeight:600, color:textMute, marginBottom:6 }}>Start node</div>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap", maxWidth:320 }}>
            {nodeIds.map((n) => (
              <button key={n} onClick={() => { setStartNode(n); setNoticeMsg(`Source node: ${n}`, "ok"); }}
                aria-pressed={startNode===n} style={btnStyle(startNode===n)}>{n}</button>
            ))}
            {nodeIds.length === 0 && <span style={{ fontSize:11, color:textMute }}>Empty graph</span>}
          </div>
        </div>

        <div>
          <div style={{ fontSize:11, fontWeight:600, color:textMute, marginBottom:6 }}>
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

      {algoId === "bellman-ford" && current && !current.complete && current.pass > 0 && (
        <div style={{ fontSize: 11, color: textMute, marginBottom: 8, fontFamily: "monospace" }}>
          Pass {current.pass} / {current.totalPasses}
        </div>
      )}

      {current?.negativeCycle && (
        <div role="alert" className="popover-in" style={{
          marginBottom: 10, padding: "9px 12px", borderRadius: 8, fontSize: 12,
          background: "rgba(255, 59, 48, 0.09)",
          boxShadow: `inset 0 0 0 1px ${p.red}55`,
          color: p.red,
        }}>
          ⚠ Negative cycle detected via {current.negativeCycleEdge?.join(" → ")} — shortest distances are not well-defined for affected nodes.
        </div>
      )}

      {/* GRAPH EDITOR */}
      <div className="glass-floating" style={{ borderRadius:14, padding:"12px 16px", marginBottom:10, display:"flex", gap:16, flexWrap:"wrap", alignItems:"flex-end" }}>
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:textMute, marginBottom:6 }}>Edit mode</div>
          <div style={{ display:"flex", gap:5 }}>
            {MODES.map((m) => (
              <button key={m.id} onClick={() => { setMode(m.id); setPendingFrom(null); }} aria-pressed={mode===m.id}
                title={m.hint} style={btnStyle(mode===m.id)}>{m.label}</button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize:11, fontWeight:600, color:textMute, marginBottom:6 }}>Edge (weight)</div>
          <div style={{ display:"flex", gap:5, alignItems:"center" }}>
            <select aria-label="Edge source" value={edgeFrom} onChange={(e) => { setEdgeFrom(e.target.value); setSelectedEdge([e.target.value, edgeTo]); }} style={selectStyle}>
              {nodeIds.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span style={{ color:textMute, fontSize:12 }}>—</span>
            <select aria-label="Edge target" value={edgeTo} onChange={(e) => { setEdgeTo(e.target.value); setSelectedEdge([edgeFrom, e.target.value]); }} style={selectStyle}>
              {nodeIds.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <input aria-label="Edge weight" value={weightInput} onChange={(e) => setWeightInput(e.target.value)}
              inputMode="decimal" style={{ width:56, background:p.inputBg, color:p.textPrimary,
              border:`1px solid ${p.borderStrong}`, borderRadius:6, padding:"4px 8px", fontSize:12 }} />
            <button onClick={handleAddEdge} style={smallBtn}>Add edge</button>
            <button onClick={handleUpdateWeight} style={smallBtn}>Update weight</button>
            <button onClick={handleRemoveEdge} style={{ ...smallBtn, color:p.red }}>Remove edge</button>
          </div>
        </div>

        <div>
          <div style={{ fontSize:11, fontWeight:600, color:textMute, marginBottom:6 }}>Graph</div>
          <div style={{ display:"flex", gap:5 }}>
            <button onClick={handleAddNode} style={smallBtn}>Add node</button>
            <button onClick={handleReset} style={{ ...smallBtn, color:p.red }}>Clear</button>
            <button onClick={handleRestoreDefault} style={smallBtn}>Restore default</button>
          </div>
        </div>

        <div style={{ marginLeft:"auto", fontSize:11, color:textMute, maxWidth:260, paddingBottom:2 }}>
          {modeHint}
        </div>
      </div>

      {notice && (
        <div role="status" className="popover-in" style={{
          marginBottom:10, padding:"8px 12px", borderRadius:8, fontSize:12,
          background: notice.kind === "error" ? "rgba(255, 59, 48, 0.09)" : "rgba(48, 209, 88, 0.09)",
          boxShadow: `inset 0 0 0 1px ${notice.kind === "error" ? p.red : p.green}55`,
          color: notice.kind === "error" ? p.red : p.green,
        }}>
          {notice.text}
        </div>
      )}

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

      <div style={{ display:"grid", gridTemplateColumns: steps.length > 0 ? "1fr 1fr" : "minmax(0, 460px)", gap:12, alignItems:"start" }}>

          {/* LEFT — Graph (always visible for editing) + Visit Order */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div className="surface-card" style={{ borderRadius:12, padding:"14px" }}>
              <div style={{ fontSize:11, fontWeight:600, color:textMute, marginBottom:8 }}>
                Graph{nodeIds.length > 0 && <span style={{ fontWeight:400, color:textMute }}> — {nodeIds.length} nodes, {Math.round(Object.values(graph).flat().length / 2)} edges</span>}
              </div>
              <GraphSVG
                graph={graph}
                positions={positions}
                step={current}
                isDark={isDark}
                stackLabel={algoId === "dijkstra" ? "In queue" : algoId === "bellman-ford" ? "Updated" : "In Stack"}
                mode={mode}
                sourceNode={startNode}
                selectedNode={mode === "add-edge" ? pendingFrom : null}
                selectedEdge={mode === "select" ? selectedEdge : null}
                onNodeClick={handleNodeClick}
                onEdgeClick={handleEdgeClick}
                onCanvasClick={handleCanvasClick}
              />
            </div>

            {steps.length > 0 && (
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
            )}
          </div>

          {/* RIGHT — execution panels, or guidance before the first run */}
          {steps.length === 0 ? (
            <div className="surface-card panel-in" style={{ borderRadius:12, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, minHeight:300 }}>
              <div style={{ fontSize:30, opacity:0.45 }} aria-hidden="true">🕸️</div>
              <div style={{ fontSize:13, color:textMute }}>Select an algorithm and click Generate</div>
              <div style={{ fontSize:11, color:textMute }}>…or build a graph with the editor and watch it come alive.</div>
            </div>
          ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

            <div className="editor-surface" style={{ borderRadius:12, overflow:"hidden" }}>
              <div style={{ padding:"8px 12px", borderBottom:`1px solid ${border}`, display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:9, color:accentColor, letterSpacing:2, fontFamily:"monospace" }}>{descriptor.name.replace(/ /g, "_").toLowerCase()}.js</span>
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

            {algoId !== "bellman-ford" && <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:10, padding:"12px 14px" }}>
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
            </div>}

            {algoId === "bellman-ford" && current && (
              <div className="glass-floating" style={{ borderRadius:12, padding:"13px 14px" }}>
                <div style={{ fontSize:11, fontWeight:600, color:textMute, marginBottom:8 }}>Updated this pass</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {(current.updatedPass || []).length === 0
                    ? <span style={{ fontSize:10, color:textMute }}>No updates in this pass</span>
                    : (current.updatedPass || []).map((n, i) => (
                    <div key={i} style={{
                      background: i===0 ? `${accentColor}20` : codeBg,
                      border:`1px solid ${i===0?accentColor:border}`,
                      borderRadius:5, padding:"4px 10px", fontSize:11,
                      fontFamily:"monospace", color: i===0?accentColor:textMute,
                    }}>
                      {n}
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            {algoId !== "dfs" && current?.distances && (
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
          )}
        </div>
    </div>
  );
}

function GraphSVG({
  graph, positions, step, isDark, stackLabel = "In Stack",
  mode = "select", sourceNode = null, selectedNode = null, selectedEdge = null,
  onNodeClick, onEdgeClick, onCanvasClick,
}) {
  const p = getPalette(isDark ? "dark" : "light");
  const nodeIds = Object.keys(graph);
  const {
    visited, current, callStack, heap, distances, previous,
    currentEdge, relaxedEdge, complete,
  } = step || {};

  const { adjacency } = normalizeGraph(graph);
  const weighted = isWeightedGraph(graph);
  const nodeCursor = mode === "add-node" ? "copy" : mode === "delete" ? "not-allowed" : onNodeClick ? "pointer" : "default";

  const edges = [];
  const seen = new Set();
  Object.entries(adjacency).forEach(([node, nbs]) => {
    nbs.forEach(({ to, weight }) => {
      const key = edgeKey(node, to);
      if (seen.has(key)) return;
      seen.add(key);
      const a = positions[node], b = positions[to];
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
    const isSelected = selectedEdge && edgeKey(selectedEdge[0], selectedEdge[1]) === key;
    const isCurrent = currentEdge && edgeKey(currentEdge[0], currentEdge[1]) === key;
    const isRelaxed = relaxedEdge && edgeKey(relaxedEdge[0], relaxedEdge[1]) === key;
    const isTree = complete && treeKeys.has(key);
    if (isSelected) return { stroke: p.accent, strokeWidth: 3.5 };
    if (isCurrent) return { stroke: p.accent, strokeWidth: 3.2 };
    if (isRelaxed) return { stroke: p.green, strokeWidth: 3 };
    if (isTree) return { stroke: p.green, strokeWidth: 2.5, opacity: 0.9 };
    return { stroke: isDark ? "#3a3a3e" : "#c8c8cd", strokeWidth: 2 };
  };

  return (
    <svg
      viewBox="0 0 400 330"
      style={{ width:"100%", maxWidth:420, border:`1px solid ${p.border}`, borderRadius:10, background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)", cursor: mode === "add-node" ? "copy" : "default" }}
      role="img" aria-label="Graph playground"
      onClick={(evt) => {
        if (evt.target.tagName === "rect" && onCanvasClick) {
          const rect = evt.currentTarget.getBoundingClientRect();
          const x = Math.round(((evt.clientX - rect.left) / rect.width) * 400);
          const y = Math.round(((evt.clientY - rect.top) / rect.height) * 330);
          onCanvasClick(x, y);
        }
      }}
    >
      <rect x="0" y="0" width="400" height="330" fill="transparent" />

      {nodeIds.length === 0 && (
        <text x="200" y="160" textAnchor="middle" fontSize="12" fill={p.textFaint} pointerEvents="none">
          Empty graph — add a node to begin
        </text>
      )}

      {edges.map(e => {
        const style = edgeStyle(e);
        const clickable = Boolean(onEdgeClick) && (mode === "select" || mode === "delete");
        return (
          <g key={e.key}>
            <line x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y}
              stroke="transparent" strokeWidth="14" strokeLinecap="round"
              style={{ cursor: clickable ? "pointer" : "default" }}
              onClick={clickable ? () => onEdgeClick(e.from, e.to) : undefined} />
            <line x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y}
              stroke={style.stroke} strokeWidth={style.strokeWidth} opacity={style.opacity ?? 1}
              strokeLinecap="round" pointerEvents="none"
              style={{ transition: "stroke 0.2s, stroke-width 0.2s" }} />
            {weighted && (
              <text
                x={(e.a.x + e.b.x) / 2} y={(e.a.y + e.b.y) / 2 - 5}
                textAnchor="middle" fontSize={9} fontFamily="monospace"
                fill={p.textSecondary} pointerEvents="none"
              >
                {e.weight}
              </text>
            )}
          </g>
        );
      })}

      {nodeIds.map((node) => {
        const pos = positions[node] || { x: 200, y: 160 };
        const isCurrent  = node === current;
        const isVisited  = visited?.has(node);
        const isInQueue  = heap?.includes(node);
        const isInStack  = isInQueue || callStack?.includes(node);
        const isSelected = node === selectedNode;
        const isSource   = node === sourceNode;

        const fill = isCurrent  ? p.accent
                   : isInStack  ? p.purple
                   : isVisited  ? p.green
                   : (isDark ? "#2c2c30" : "#e8e8ed");

        const stroke = isSelected ? p.accent
                     : isCurrent ? p.accent
                     : isInStack ? p.purple
                     : isVisited ? p.green
                     : (isDark ? "#55555c" : "#9a9aa2");

        const dist = distances ? distances[node] : undefined;
        const distLabel = dist === undefined || !Number.isFinite(dist) ? "∞" : String(dist);

        return (
          <g key={node}>
            {isSource && (
              <circle cx={pos.x} cy={pos.y} r={27} fill="transparent"
                stroke={p.accent} strokeWidth="1.2" strokeDasharray="3 3" opacity={0.8} />
            )}
            {isSelected && (
              <circle cx={pos.x} cy={pos.y} r={27} fill="transparent"
                stroke={p.accent} strokeWidth="1.5" opacity={0.9} />
            )}
            <circle cx={pos.x} cy={pos.y} r={22}
              fill={fill} stroke={stroke} strokeWidth={isCurrent || isSelected ? 3 : 1.5}
              style={{
                filter: isCurrent ? `drop-shadow(0 0 8px ${p.accent})` : "none",
                transition:"all 0.2s",
                cursor: onNodeClick ? nodeCursor : "default",
              }}
              onClick={onNodeClick ? (evt) => { evt.stopPropagation(); onNodeClick(node); } : undefined}
            />
            <text x={pos.x} y={pos.y + 5} textAnchor="middle" pointerEvents="none"
              fontSize={14} fontWeight="bold" fontFamily="monospace"
              fill={isCurrent || isVisited || isInStack ? "#0f172a" : (isDark ? "#9a9aa2" : "#55555c")}>
              {node}
            </text>
            {distances && (
              <text x={pos.x} y={pos.y + 38} textAnchor="middle" pointerEvents="none"
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
