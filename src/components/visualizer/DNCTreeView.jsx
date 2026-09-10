import { getPalette } from '../../theme/tokens';

/**
 * DNCTreeView — renders a recursion tree for Divide & Conquer algorithms.
 *
 * Shows tree nodes with:
 * - Color-coded status (active/splitting/recursing/base/combining/returned/done/pending)
 * - Subproblem labels on nodes
 * - Current path highlighting
 * - Result annotations when available
 * - Compact layout with horizontal overflow for deep trees
 *
 * Props:
 *   nodes          – Array of tree nodes from buildDNCTree
 *   activeNodeId   – ID of the currently active node (highlighted)
 *   isDark         – theme flag
 *   compact        – compact mode for large trees
 *   showResults    – whether to show result annotations
 */
export default function DNCTreeView({
  nodes = [],
  activeNodeId = null,
  isDark,
  compact = false,
  showResults = false,
}) {
  const p = getPalette(isDark ? 'dark' : 'light');

  if (nodes.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '20px 0',
          color: p.textMuted,
          fontSize: 12,
          fontFamily: 'monospace',
        }}
      >
        No recursion tree to display
      </div>
    );
  }

  // Group nodes by depth for vertical layout
  const rows = [];
  for (const node of nodes) {
    if (!rows[node.depth]) rows[node.depth] = [];
    rows[node.depth].push(node);
  }

  const statusColors = {
    active: p.accent,
    splitting: p.orange,
    recursing: p.blue,
    base: p.green,
    combining: p.purple,
    returned: p.teal,
    done: p.green,
    comparing: p.pink,
    pending: p.textMuted,
  };

  const statusBg = {
    active: `${p.accent}30`,
    splitting: `${p.orange}20`,
    recursing: `${p.blue}20`,
    base: 'rgba(48, 209, 88, 0.12)',
    combining: `${p.purple}20`,
    returned: `${p.teal}20`,
    done: 'rgba(48, 209, 88, 0.12)',
    comparing: `${p.pink}20`,
    pending: 'transparent',
  };

  const statusIcons = {
    active: '●',
    splitting: '◈',
    recursing: '→',
    base: '◆',
    combining: '⊞',
    returned: '↑',
    done: '✓',
    comparing: '◎',
    pending: '○',
  };

  const nodeSize = compact ? 20 : 26;
  const hGap = compact ? 4 : 8;
  const vGap = compact ? 24 : 32;
  const rowHeight = nodeSize + (compact ? 6 : 10) + (showResults ? 16 : 0) + vGap;

  // Calculate total width needed
  const maxWidth = rows.reduce((max, row) => {
    const w = row.length * (nodeSize + hGap);
    return Math.max(max, w);
  }, 0);

  // Compute node center positions for SVG edge lines
  const nodePositions = new Map();
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

    // Vertical line from parent center down
    const midY = parentPos.cy + (rowHeight - nodeSize) / 2;
    edgeLines.push({
      type: 'v',
      x: parentPos.cx,
      y1: parentPos.cy + nodeSize / 2,
      y2: midY,
    });

    // Horizontal line spanning children
    if (childPositions.length > 1) {
      const leftX = Math.min(...childPositions.map((pos) => pos.cx));
      const rightX = Math.max(...childPositions.map((pos) => pos.cx));
      edgeLines.push({ type: 'h', x1: leftX, x2: rightX, y: midY });
    }

    // Vertical lines from midpoint to each child
    for (const cp of childPositions) {
      edgeLines.push({
        type: 'v',
        x: cp.cx,
        y1: midY,
        y2: cp.cy - nodeSize / 2,
      });
    }
  }

  const svgHeight = yOffset;

  return (
    <div
      className="surface-card"
      style={{ borderRadius: 12, padding: '12px 14px', overflowX: 'auto' }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: p.textSecondary,
          marginBottom: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>Recursion Tree</span>
        <span style={{ fontSize: 10, fontWeight: 400 }}>
          {nodes.length} node{nodes.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div
        style={{
          minWidth: Math.max(maxWidth, 200),
          position: 'relative',
        }}
      >
        {/* SVG edge lines */}
        <svg
          width={Math.max(maxWidth, 200)}
          height={svgHeight}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          {edgeLines.map((line, i) => {
            if (line.type === 'v') {
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

        {/* Nodes */}
        {rows.map((row, depth) => {
          if (!row) return null;
          return (
            <div
              key={depth}
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: hGap,
                marginBottom: vGap,
                position: 'relative',
              }}
            >
              {row.map((node) => {
                const isActive = node.id === activeNodeId;
                const status = node.status || 'pending';
                const color = statusColors[status] || p.textMuted;
                const bg = isActive
                  ? `${p.accent}40`
                  : statusBg[status] || 'transparent';

                return (
                  <div
                    key={node.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    {/* Node */}
                    <div
                      style={{
                        width: nodeSize,
                        height: nodeSize,
                        borderRadius: '50%',
                        border: `${isActive ? 2 : 1}px solid ${color}`,
                        background: bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: compact ? 9 : 11,
                        color,
                        fontFamily: 'monospace',
                        fontWeight: isActive ? 700 : 500,
                        transition: 'all 0.15s',
                        boxShadow: isActive ? `0 0 8px ${color}44` : 'none',
                        cursor: 'default',
                      }}
                      title={`Node ${node.id}\n${node.subproblem}\nStatus: ${status}`}
                    >
                      {statusIcons[status] || '○'}
                    </div>

                    {/* Subproblem label */}
                    {node.subproblem && (
                      <div
                        style={{
                          fontSize: compact ? 7 : 8,
                          color: p.textMuted,
                          fontFamily: 'monospace',
                          maxWidth: nodeSize + 12,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          textAlign: 'center',
                          maxHeight: compact ? 14 : 20,
                          overflowY: 'auto',
                        }}
                        title={node.subproblem}
                      >
                        {node.subproblem}
                      </div>
                    )}

                    {/* Result annotation */}
                    {showResults && node.result != null && (
                      <div
                        style={{
                          fontSize: 8,
                          color: p.accent,
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          maxWidth: nodeSize + 12,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={String(node.result)}
                      >
                        = {String(node.result).slice(0, 8)}
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
          display: 'flex',
          gap: 8,
          marginTop: 8,
          flexWrap: 'wrap',
        }}
      >
        {Object.entries(statusColors).map(([status, color]) => (
          <div
            key={status}
            style={{ display: 'flex', alignItems: 'center', gap: 3 }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                border: `1.5px solid ${color}`,
                background: `${color}20`,
              }}
            />
            <span
              style={{
                fontSize: 8,
                color: p.textMuted,
                fontFamily: 'monospace',
                textTransform: 'capitalize',
              }}
            >
              {status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
