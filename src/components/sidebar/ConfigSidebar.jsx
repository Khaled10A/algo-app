import { Sec, Chk, SInput, RunBtn, GhostBtn, BenchmarkError } from '../ui/SharedComponents';
import { getBenchmarkable, getWithSteps, getByCategory } from '../../algorithms/registry';
import { FONT_SANS } from '../../theme/tokens';
import { INPUT_TYPES, INPUT_LABELS, TEXT_SCENARIOS, SCENARIO_LABELS } from '../../utils/constants';

export function ConfigSidebar({
  domain,
  subTab,
  isDark,
  border,
  palette,
  sort,
  viz,
  search,
  history,
  pseudo,
}) {
  return (
    <div style={{ width: 280, borderRight: `1px solid ${border}`, background: palette.sidebar, backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: FONT_SANS }}>
      {subTab === "benchmark" && domain !== "graphs" && (
        <div
          style={{
            flexShrink: 0,
            padding: "14px 16px 12px",
            borderBottom: `1px solid ${border}`,
            background: palette.sidebar,
          }}
        >
          {domain === "sorting" ? (
            <>
              <RunBtn onClick={sort.run} onCancel={sort.cancel} running={sort.running} />
              <BenchmarkError message={sort.error} />
            </>
          ) : (
            <>
              <RunBtn onClick={search.run} onCancel={search.cancel} running={search.running} />
              <BenchmarkError message={search.error} />
            </>
          )}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "18px 16px 26px" }}>
        {domain === "graphs" ? (
          <Sec title="Graph algorithms">
            <div style={{ fontSize: 12, color: palette.textSecondary }}>
              BFS &amp; DFS traversal debugging lives in the Debugger section.
            </div>
          </Sec>
        ) : domain === "sorting" ? (
          <SortingPanel subTab={subTab} isDark={isDark} border={border} palette={palette} sort={sort} viz={viz} history={history} pseudo={pseudo} />
        ) : (
          <StringPanel subTab={subTab} isDark={isDark} border={border} palette={palette} search={search} history={history} pseudo={pseudo} />
        )}
      </div>
    </div>
  );
}

function SortingPanel({ subTab, isDark, border, palette, sort, viz, history, pseudo }) {
  return (
    <>
      {subTab === "benchmark" && <>
        <Sec title="Algorithms">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 10px" }}>
            {getBenchmarkable("sorting").map((a) => <Chk key={a.id} label={a.name} checked={sort.algos.includes(a.id)} onChange={() => sort.toggleAlgo(a.id)} />)}
          </div>
        </Sec>
        <Sec title="Input mode">
          {[["random", "Random / Generated"], ["custom", "Custom Array"]].map(([v, l]) => (
            <Chk key={v} radio groupName="sort-input-mode" label={l} checked={sort.inputMode === v} onChange={() => sort.setInputMode(v)} />
          ))}
        </Sec>
        {sort.inputMode === "custom" ? (
          <Sec title="Your array">
            <textarea value={sort.customArrayStr} onChange={(e) => sort.setCustomArrayStr(e.target.value)} aria-label="Custom array"
              placeholder="e.g. 34,7,23,32,5,62" rows={3}
              style={{ width: "100%", background: isDark ? "#0f172a" : "#f1f5f9", border: `1px solid ${border}`, borderRadius: 6, padding: "7px 9px", color: isDark ? "#e2e8f0" : "#1e293b", fontSize: 12, fontFamily: "monospace", boxSizing: "border-box", resize: "vertical" }} />
            <div style={{ fontSize: 9, color: "#64748b", marginTop: 3 }}>
              {sort.customArrayStr.split(",").filter((s) => !isNaN(parseInt(s.trim())) && s.trim() !== "").length} numbers — comma-separated
            </div>
          </Sec>
        ) : (
          <>
            <Sec title="Input type">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 10px" }}>
                {INPUT_TYPES.map((t) => <Chk key={t} label={INPUT_LABELS[t]} checked={sort.types.includes(t)} onChange={() => sort.toggleType(t)} />)}
              </div>
            </Sec>
            <Sec title="Input sizes">
              <SInput value={sort.sizesStr} onChange={(e) => sort.setSizesStr(e.target.value)} placeholder="50,100,150" hint="comma-separated" />
            </Sec>
          </>
        )}
        <Sec title="Metric">
          {[["time", "Execution Time (ms)"], ["comparisons", "Comparisons"]].map(([v, l]) => (
            <Chk key={v} radio groupName="sort-metric" label={l} checked={sort.metric === v} onChange={() => sort.setMetric(v)} />
          ))}
        </Sec>
        {sort.hasResults && <GhostBtn onClick={sort.exportCSV} label="Export CSV" />}
        {sort.hasResults && <GhostBtn onClick={sort.exportXLSX} label="Export Excel (.xlsx)" />}
        {sort.hasResults && <GhostBtn onClick={sort.exportPNG} label="Export all charts (PNG)" />}
      </>}

      {subTab === "visualizer" && <>
        <Sec title="Algorithm">
          {getWithSteps("sorting").map((a) => <Chk key={a.id} radio groupName="viz-algo" label={a.name} checked={viz.algo === a.id} onChange={() => viz.setAlgo(a.id)} />)}
        </Sec>
        <Sec title="Array size">
          <input type="range" min={6} max={32} value={viz.size} aria-label="Array size" onChange={(e) => viz.setSize(+e.target.value)} style={{ width: "100%", accentColor: "#38bdf8" }} />
          <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "center" }}>{viz.size} elements</div>
        </Sec>
        <Sec title="Animation speed">
          <input type="range" min={20} max={500} step={10} aria-label="Animation speed"
            value={501 - viz.speed}
            onChange={(e) => viz.setSpeed(501 - +e.target.value)}
            style={{ width: "100%", accentColor: "#f472b6" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#64748b", marginTop: 2 }}>
            <span>Slow</span>
            <span style={{ color: "#ff375f", fontWeight: 600 }}>{viz.speed <= 80 ? "Fast" : viz.speed <= 200 ? "Medium" : "Slow"}</span>
            <span>Fast</span>
          </div>
        </Sec>
        <button onClick={viz.generate} style={{
          width: "100%", padding: "10px", borderRadius: 7, border: "none",
          background: "linear-gradient(135deg,#0284c7,#6366f1)",
          color: "#fff", fontSize: 11, letterSpacing: 2,
          cursor: "pointer", fontFamily: "monospace", fontWeight: "bold",
        }}>▶ GENERATE ARRAY</button>
        {viz.hasSteps && (
          <button onClick={viz.togglePlay} aria-label={viz.playing ? "Pause visualization" : "Play visualization"} style={{
            width: "100%", marginTop: 6, padding: "8px", borderRadius: 6, border: `1px solid ${isDark ? "#1e293b" : "#cbd5e1"}`,
            background: viz.playing ? "#7f1d1d22" : "#164e6322",
            color: viz.playing ? "#f87171" : "#4ade80",
            fontSize: 10, cursor: "pointer", fontFamily: "monospace", letterSpacing: 2,
          }}>{viz.playing ? "⏸ PAUSE" : "▶ PLAY"}</button>
        )}
      </>}

      {subTab === "history" && <HistorySection history={history} palette={palette} />}
      {subTab === "pseudocode" && <PseudoSection pseudo={pseudo} />}
    </>
  );
}

function StringPanel({ subTab, isDark, border, palette, search, history, pseudo }) {
  return (
    <>
      <Sec title="Algorithms">
        {getBenchmarkable("searching").map((a) => <Chk key={a.id} label={a.name} checked={search.algos.includes(a.id)} onChange={() => search.toggleAlgo(a.id)} />)}
      </Sec>
      {subTab === "benchmark" && <>
        <Sec title="Input mode">
          {[["generate", "Auto Generate"], ["file", "Upload File (.txt)"]].map(([v, l]) => (
            <Chk key={v} radio groupName="search-input-mode" label={l} checked={search.inputMode === v} onChange={() => search.setInputMode(v)} />
          ))}
        </Sec>
        {search.inputMode === "file" ? (
          <Sec title="Text file">
            <label style={{ display: "block", cursor: "pointer" }}>
              <div style={{
                border: `2px dashed ${search.uploadedText ? "#4ade80" : isDark ? "#1e293b" : "#e2e8f0"}`,
                borderRadius: 8, padding: "12px 8px", textAlign: "center",
                background: search.uploadedText ? "rgba(74,222,128,0.05)" : "transparent",
                transition: "all 0.2s", cursor: "pointer"
              }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{search.uploadedText ? "✅" : "📄"}</div>
                <div style={{ fontSize: 10, color: search.uploadedText ? "#4ade80" : isDark ? "#94a3b8" : "#64748b", fontFamily: "monospace" }}>
                  {search.uploadedText ? search.fileName : "Click to upload .txt file"}
                </div>
                {search.uploadedText && <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>{search.uploadedText.length} characters</div>}
              </div>
              <input type="file" accept=".txt" style={{ display: "none" }} aria-label="Upload text file" onChange={search.onFile} />
            </label>
            {search.uploadedText && <button onClick={search.removeFile} style={{
              width: "100%", marginTop: 5, padding: "5px", borderRadius: 5,
              border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)",
              color: palette.red, fontSize: 12, fontWeight: 500, cursor: "pointer"
            }}>Remove file</button>}
          </Sec>
        ) : (
          <>
            <Sec title="Scenario">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 10px" }}>
                {TEXT_SCENARIOS.map((sc) => <Chk key={sc} label={SCENARIO_LABELS[sc]} checked={search.scenarios.includes(sc)} onChange={() => search.toggleScenario(sc)} />)}
              </div>
            </Sec>
            <Sec title="Text sizes">
              <SInput value={search.sizesStr} onChange={(e) => search.setSizesStr(e.target.value)} placeholder="300,500" hint="comma-separated" />
            </Sec>
          </>
        )}
        <Sec title="Pattern">
          <SInput value={search.pattern} onChange={(e) => search.setPattern(e.target.value)} placeholder="search pattern..." />
        </Sec>
        <Sec title="Metric">
          {[["time", "Execution Time (ms)"], ["comparisons", "Comparisons"]].map(([v, l]) => (
            <Chk key={v} radio groupName="search-metric" label={l} checked={search.metric === v} onChange={() => search.setMetric(v)} />
          ))}
        </Sec>
        {search.hasResults && <GhostBtn onClick={search.exportCSV} label="Export CSV" />}
        {search.hasResults && <GhostBtn onClick={search.exportXLSX} label="Export Excel (.xlsx)" />}
        {search.hasResults && <GhostBtn onClick={search.exportPNG} label="Export all charts (PNG)" />}
      </>}
      {subTab === "history" && <HistorySection history={history} palette={palette} />}
      {subTab === "pseudocode" && <PseudoSection pseudo={pseudo} />}
    </>
  );
}

function HistorySection({ history, palette }) {
  return (
    <Sec title="History">
      <div style={{ fontSize: 10, color: "#64748b" }}>{history.count} run{history.count !== 1 ? "s" : ""} stored (max 20)</div>
      {history.count > 0 && <button onClick={history.clearAll} style={{ marginTop: 6, width: "100%", padding: "7px", borderRadius: 7, border: `1px solid ${palette.btnBorder}`, background: "rgba(255, 59, 48, 0.07)", color: palette.red, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Clear All</button>}
      {history.selected > 0 && <button onClick={history.clearSelection} style={{ marginTop: 5, width: "100%", padding: "7px", borderRadius: 7, border: `1px solid ${palette.btnBorder}`, background: "transparent", color: palette.textSecondary, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Clear selection</button>}
    </Sec>
  );
}

function PseudoSection({ pseudo }) {
  const options = [
    ...getBenchmarkable("sorting"),
    ...getBenchmarkable("searching"),
    ...getByCategory("graphs"),
  ];
  return (
    <Sec title="Select algorithm">
      {options.map((a) => <Chk key={a.id} radio groupName="pseudo-algo" label={a.name} checked={pseudo.algo === a.id} onChange={() => pseudo.setAlgo(a.id)} />)}
    </Sec>
  );
}
