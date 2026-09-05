import { getPalette } from "../../theme/tokens";
import MatrixView from "./MatrixView";

/**
 * DPTableView — renders a DP table using MatrixView as the core renderer
 * but adds DP-specific UI: phase indicator, backtracking path legend,
 * and answer display.
 *
 * Props:
 *   table        – 2D array of { value, state } cells
 *   rowLabels    – row header labels
 *   colLabels    – column header labels
 *   current      – [row, col] of the cell being computed
 *   phase        – "fill" | "backtrack"
 *   backtrackPath – [[row, col], ...] cells on the reconstruction path
 *   answer       – the reconstructed answer string
 *   complete     – whether the algorithm is done
 *   isDark       – theme flag
 *   compact      – compact mode for large tables
 */
export default function DPTableView({
  table = [],
  rowLabels = [],
  colLabels = [],
  current,
  phase = "fill",
  backtrackPath = [],
  answer,
  complete = false,
  isDark,
  compact = false,
}) {
  const p = getPalette(isDark ? "dark" : "light");

  const phaseColor = phase === "backtrack" ? p.pink : p.green;
  const phaseLabel =
    phase === "backtrack" ? "Backtracking" : complete ? "Complete" : "Filling";

  return (
    <div>
      {/* Phase + answer bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 1.5,
            color: phaseColor,
            fontFamily: "monospace",
          }}
        >
          {phaseLabel.toUpperCase()}
        </div>
        {answer != null && answer !== "" && (
          <div
            style={{
              background: `${p.accent}12`,
              border: `1px solid ${p.accent}40`,
              borderRadius: 6,
              padding: "4px 12px",
              fontSize: 11,
              fontFamily: "monospace",
              color: p.accentText,
              fontWeight: 600,
            }}
          >
            Answer: {String(answer)}
          </div>
        )}
      </div>

      {/* The table */}
      <div
        className="surface-card"
        style={{ borderRadius: 12, padding: "12px 14px", overflowX: "auto" }}
      >
        <MatrixView
          dpTable={table}
          rowLabels={rowLabels}
          colLabels={colLabels}
          dpCurrent={current}
          dpBacktrackPath={backtrackPath}
          dpHighlightStates={true}
          nodes={[]}
          matrix={{}}
          isDark={isDark}
          compact={compact || table.length > 8}
        />
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 8,
          flexWrap: "wrap",
        }}
      >
        {[
          [p.accentTint, p.accent, "Current"],
          ["rgba(255, 159, 10, 0.18)", p.orange, "Reading"],
          ["rgba(255, 55, 95, 0.18)", p.pink, "Backtrack"],
          ["rgba(255, 55, 95, 0.08)", p.pink, "Path"],
          [undefined, p.textFaint, "Uncomputed"],
        ].map(([bg, fg, label]) => (
          <div
            key={label}
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: bg || "transparent",
                border: `1px solid ${fg}`,
              }}
            />
            <span
              style={{
                fontSize: 9,
                color: p.textMuted,
                fontFamily: "monospace",
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
