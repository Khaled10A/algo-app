import { ArrayViz } from '../components/visualizer/ArrayVisualizer';
import { Label, Empty } from '../components/ui/SharedComponents';
import { btnBase } from '../utils/constants';

export function VisualizerTab({ vizAlgo, vizSteps, vizStep, setVizStep, pauseViz, isDark }) {
  return (
    <div>
      <Label color="#4ade80">SORTING VISUALIZER</Label>
      {vizSteps.length === 0 ? (
        <Empty icon="🎬" text="Generate an array to visualize" />
      ) : (
        <div style={{
          background: isDark ? "#0f172a" : "#f1f5f9",
          borderRadius: 10,
          border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
          padding: 18,
          maxWidth: 800,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 10, color: "#4ade80", letterSpacing: 2 }}>{vizAlgo.toUpperCase()}</span>
            <span style={{ fontSize: 10, color: "#475569" }}>Step {vizStep + 1} / {vizSteps.length}</span>
          </div>
          <ArrayViz steps={vizSteps} currentStep={vizStep} />
          <input
            type="range"
            min={0}
            max={vizSteps.length - 1}
            value={vizStep}
            onChange={e => { pauseViz(); setVizStep(+e.target.value); }}
            style={{ width: "100%", accentColor: "#4ade80", marginTop: 10 }}
          />
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 8 }}>
            {[
              ["⏮", () => setVizStep(0)],
              ["◀", () => setVizStep(s => Math.max(0, s - 1))],
              ["▶", () => setVizStep(s => Math.min(vizSteps.length - 1, s + 1))],
              ["⏭", () => setVizStep(vizSteps.length - 1)],
            ].map(([lbl, fn]) => (
              <button key={lbl} onClick={fn} style={{ ...btnBase, fontSize: 14, padding: "5px 12px" }}>{lbl}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
