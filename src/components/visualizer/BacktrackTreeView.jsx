import { getPalette } from "../../theme/tokens";

/**
 * BacktrackTreeView — renders a recursion tree for backtracking algorithms.
 *
 * Shows tree nodes with:
 * - Color-coded status (active/success/pruned/backtracked/pending)
 * - Decision labels on edges
 * - Current path highlighting
 * - Compact layout with horizontal overflow for deep trees
 *
 * Props:
 *   nodes          – Array of tree nodes from buildBacktrackTree
 *   activeNodeId   – ID of the currently active node (highlighted)
 *   solutionPaths  – Array of node ID paths for solutions found so far
 *   isDark         – theme flag
 *   compact        – compact mode for large trees
 */
export default function BacktrackTreeView({
  nodes = [],
  activeNodeId = null,
  solutionPaths = [],
  isDark,
  compact = false,
}) {
  const p = getPalette(isDark ? "dark" : "light");

  if (nodes.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "20px 0",
          color: p.textMuted,
          fontSize: 12,
          fontFamily: "monospace",
        }}
      >
        No tree to display
      </div>
    );
  }

  // Collect all solution node IDs for highlighting
  const solutionNodeIds = new Set();
  for (const path of solutionPaths) {
    for (const id of path) solutionNodeIds.add(id);
  }

  // Flatten tree into rows by depth for vertical layout
  const rows = [];
  for (const node of nodes) {
    if (!rows[node.depth]) rows[node.depth] = [];
    rows[node.depth].push(node);
  }

  const statusColors = {
    active: p.accent,
    success: p.green,
    pruned: p.red,
    backtracked: p.orange,
    pending: p.textMuted,
  };

  const statusBg = {
    active: `${p.accent}20`,
    success: "rgba(48, 209, 88, 0.12)",
    pruned: "rgba(255, 59, 48, 0.10)",
    backtracked: "rgba(255, 159, 10, 0.10)",
    pending: "transparent",
  };

  const statusIcons = {
    active: "●",
    success: "✓",
    pruned: "✗",
    backtracked: "↩",
    pending: "○",
  };

  const nodeSize = compact ? 22 : 28;
  const hGap = compact ? 6 : 10;
  const vGap = compact ? 28 : 36;
  const rowHeight = nodeSize + 3 + (compact ? 8 : 14) + vGap; // node + label + status + gap

  // Calculate total width needed
  const maxWidth = rows.reduce((max, row) => {
    const w = row.length * (nodeSize + hGap);
    return Math.max(max, w);
  }, 0);

  // Compute node center positions for SVG edge lines
  const nodePositions = new Map(); // nodeId → { cx, cy }
  let yOffset = 0;
  for (let depth = 0; depth < rows.length; depth++) {
    const row = rows[depth];
    if (!row) continue;
    const rowWidth = row.length * (nodeSize + hGap) - hGap;
    let xStart = (Math.max(maxWidth, 200) - rowWidth) / 2;
    for (const node of row) {
      nodePositions.set(node.id, {
        cx: xStart + nodeSize / 2,
        cy: yOffset + nodeSize / 2,
      });
      xStart += nodeSize + hGap;
    }
    yOffset += rowHeight;
  }

  // Build SVG edge lines from parent → children
  const edgeLines = [];
  for (const node of nodes) {
    if (!node.children || node.children.length === 0) continue;
    const parentPos = nodePositions.get(node.id);
    if (!parentPos) continue;
    const childPositions = node.children
      .map((cid) => nodePositions.get(cid))
      .filter(Boolean);
    if (childPositions.length === 0) continue;
    // Vertical line from parent center down to midpoint
    const midY = parentPos.cy + (rowHeight - nodeSize) / 2;
    edgeLines.push({
      type: "v",
      x: parentPos.cx,
      y1: parentPos.cy + nodeSize / 2,
      y2: midY,
    });
    // Horizontal line spanning children
    if (childPositions.length > 1) {
      const leftX = Math.min(...childPositions.map((p) => p.cx));
      const rightX = Math.max(...childPositions.map((p) => p.cx));
      edgeLines.push({ type: "h", x1: leftX, x2: rightX, y: midY });
    }
    // Vertical lines from midpoint down to each child
    for (const cp of childPositions) {
      edgeLines.push({ type: "v", x: cp.cx, y1: midY, y2: cp.cy - nodeSize / 2 });
    }
  }

  const svgHeight = yOffset;

  return (
    <div
      className="surface-card"
      style={{ borderRadius: 12, padding: "12px 14px", overflowX: "auto" }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: p.textSecondary,
          marginBottom: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Recursion Tree</span>
        <span style={{ fontSize: 10, fontWeight: 400 }}>
          {nodes.length} node{nodes.length !== 1 ? "s" : ""}
          {solutionPaths.length > 0
            ? ` · ${solutionPaths.length} solution${solutionPaths.length !== 1 ? "s" : ""}`
            : ""}
        </span>
      </div>

      <div
        style={{
          minWidth: Math.max(maxWidth, 200),
          position: "relative",
        }}
      >
        {/* SVG edge lines rendered behind nodes */}
        <svg
          width={Math.max(maxWidth, 200)}
          height={svgHeight}
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        >
          {edgeLines.map((line, i) => {
            if (line.type === "v") {
              return (
                <line
                  key={i}
                  x1={line.x}
                  y1={line.y1}
                  x2={line.x}
                  y2={line.y2}
                  stroke={p.border}
                  strokeWidth={1}
                  strokeOpacity={0.5}
                />
              );
            }
            return (
              <line
                key={i}
                x1={line.x1}
                y1={line.y}
                x2={line.x2}
                y2={line.y}
                stroke={p.border}
                strokeWidth={1}
                strokeOpacity={0.5}
              />
            );
          })}
        </svg>

        {/* Nodes rendered on top of SVG */}
        {rows.map((row, depth) => {
          if (!row) return null;
          return (
            <div
              key={depth}
              style={{
                display: "flex",
                justifyContent: "center",
                gap: hGap,
                marginBottom: vGap,
                position: "relative",
              }}
            >
              {row.map((node) => {
                const isActive = node.id === activeNodeId;
                const isSolution = solutionNodeIds.has(node.id);
                const status = node.status || "pending";
                const color = statusColors[status] || p.textMuted;
                const bg = isActive
                  ? `${p.accent}30`
                  : isSolution
                    ? "rgba(48, 209, 88, 0.15)"
                    : statusBg[status] || "transparent";

                return (
                  <div
                    key={node.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    {/* Decision label (above node) */}
                    {node.decision != null && (
                      <div
                        style={{
                          fontSize: compact ? 8 : 9,
                          color: p.textMuted,
                          fontFamily: "monospace",
                          maxWidth: nodeSize + 16,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          textAlign: "center",
                        }}
                        title={String(node.decision)}
                      >
                        {String(node.decision)}
                      </div>
                    )}

                    {/* Node */}
                    <div
                      style={{
                        width: nodeSize,
                        height: nodeSize,
                        borderRadius: "50%",
                        border: `${isActive ? 2 : 1}px solid ${color}`,
                        background: bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: compact ? 10 : 12,
                        color,
                        fontFamily: "monospace",
                        fontWeight: isActive ? 700 : 500,
                        transition: "all 0.15s",
                        boxShadow: isActive ? `0 0 8px ${color}44` : "none",
                        cursor: "default",
                      }}
                      title={`Node ${node.id}: ${node.log || status}`}
                    >
                      {statusIcons[status] || "○"}
                    </div>

                    {/* Status label (below node) */}
                    {status !== "active" && status !== "pending" && (
                      <div
                        style={{
                          fontSize: compact ? 7 : 8,
                          color,
                          fontFamily: "monospace",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        {status === "success"
                          ? "✓"
                          : status === "pruned"
                            ? "✗"
                            : "↩"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 8,
          flexWrap: "wrap",
        }}
      >
        {[
          [statusColors.active, "Active"],
          [statusColors.success, "Solution"],
          [statusColors.pruned, "Pruned"],
          [statusColors.backtracked, "Backtracked"],
        ].map(([color, label]) => (
          <div
            key={label}
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                border: `1.5px solid ${color}`,
                background: `${color}20`,
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
