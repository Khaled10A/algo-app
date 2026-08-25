import { getPalette } from "../../theme/tokens";

// Floyd-Warshall distance matrix - the primary visualization for the
// all-pairs domain. Renders the current D matrix with the active
// intermediate node k (header/column accent), the current (i, j) pair
// cell (accent background), cells updated during the current k
// iteration (green tint), negative-cycle nodes (red diagonal) and
// infinity for unreachable pairs.

export default function MatrixView({
  nodes,
  matrix,
  kNode,
  i,
  j,
  updatedCells = [],
  negativeCycleNodes = [],
  isDark,
  compact = false,
}) {
  const p = getPalette(isDark ? "dark" : "light");

  const updatedSet = new Set(updatedCells.map(([a, b]) => a + "~" + b));
  const cycleSet = new Set(negativeCycleNodes);

  const cellStyle = (rowId, colId) => {
    const base = {
      padding: compact ? "3px 7px" : "5px 9px",
      textAlign: "center",
      fontFamily: "monospace",
      fontSize: compact ? 11 : 12,
      border: "1px solid " + p.border,
      color: p.textSecondary,
      background: "transparent",
      whiteSpace: "nowrap",
      transition: "background 0.15s, color 0.15s",
    };
    const key = rowId + "~" + colId;
    if (rowId === colId) base.color = p.textFaint;
    if (cycleSet.has(rowId) && rowId === colId) {
      base.background = "rgba(255, 59, 48, 0.14)";
      base.color = p.red;
      base.fontWeight = 700;
    }
    if (updatedSet.has(key)) {
      base.background = "rgba(48, 209, 88, 0.13)";
      base.color = p.green;
      base.fontWeight = 700;
    }
    if (rowId === i && colId === j) {
      base.background = p.accentTint;
      base.color = p.accentText;
      base.fontWeight = 700;
      base.boxShadow = "inset 0 0 0 1.5px " + p.accent;
    }
    return base;
  };

  const headerStyle = (id) => ({
    padding: compact ? "3px 7px" : "5px 9px",
    fontSize: compact ? 11 : 12,
    fontWeight: 700,
    fontFamily: "monospace",
    color: id === kNode ? p.accent : p.textPrimary,
    borderBottom: "2px solid " + (id === kNode ? p.accent : p.borderStrong),
    textAlign: "center",
    background: id === kNode ? p.accentTint : "transparent",
  });

  const rowLabelStyle = (id) => ({
    ...headerStyle(id),
    textAlign: "left",
    borderRight: "2px solid " + (id === kNode ? p.accent : p.borderStrong),
    borderBottom: "1px solid " + p.border,
  });

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", margin: "0 auto" }}>
        <thead>
          <tr>
            <th style={{ ...headerStyle(""), border: "none" }} aria-hidden="true" />
            {nodes.map((id) => (
              <th key={id} style={headerStyle(id)} scope="col">
                {id}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {nodes.map((rowId) => (
            <tr key={rowId}>
              <th style={rowLabelStyle(rowId)} scope="row">
                {rowId}
              </th>
              {nodes.map((colId) => {
                const value = matrix[rowId] ? matrix[rowId][colId] : Infinity;
                const label = Number.isFinite(value) ? String(value) : "∞";
                return (
                  <td key={colId} style={cellStyle(rowId, colId)}>
                    {label}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
