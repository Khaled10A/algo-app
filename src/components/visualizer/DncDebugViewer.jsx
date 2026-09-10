import React from 'react';
import { getPalette } from '../../theme/tokens';
import DNCStateView from './DNCStateView';
import KaratsubaView from './KaratsubaView';
import StrassenView from './StrassenView';

/**
 * DncDebugViewer — generic D&C debug view with an algorithm-specific
 * visualizer (coordinate plane for closest-pair-of-points, recursive
 * multiplication for karatsuba, quadrant matrices for strassen) plus the
 * standard subproblem/state panels.
 */
export default function DncDebugViewer({
  current,
  isDark,
  variant = 'closest-pair',
}) {
  const p = getPalette(isDark ? 'dark' : 'light');

  if (!current) {
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
        No debug state to display
      </div>
    );
  }

  const phase = current.phase;
  const phaseColor = phaseColorMap(phase, p);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Algorithm-specific visualizer */}
      {phase !== null &&
        (variant === 'karatsuba' ? (
          <KaratsubaView
            current={current}
            palette={p}
            phase={phase}
            phaseColor={phaseColor}
          />
        ) : variant === 'strassen' ? (
          <StrassenView
            current={current}
            palette={p}
            phase={phase}
            phaseColor={phaseColor}
          />
        ) : (
          <ClosestPairPlane
            current={current}
            palette={p}
            phase={phase}
            phaseColor={phaseColor}
          />
        ))}

      {/* Subproblem info */}
      <div
        className="surface-card"
        style={{ borderRadius: 12, padding: '12px 14px' }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: p.textSecondary,
            marginBottom: 6,
          }}
        >
          Current Subproblem
        </div>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: 12,
            color: p.text,
            marginBottom: 4,
          }}
        >
          {current.currentSubproblem || '—'}
        </div>
        <div
          style={{
            fontSize: 10,
            color: p.textMuted,
            marginBottom: 6,
          }}
        >
          depth {current.depth}
        </div>

        {current.currentBounds && (
          <div
            style={{
              borderTop: `1px solid ${p.border}`,
              paddingTop: 6,
              marginTop: 4,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: p.textSecondary,
                marginBottom: 2,
              }}
            >
              Bounds
            </div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 11,
                color: p.text,
              }}
            >
              {formatBounds(current.currentBounds)}
            </div>
          </div>
        )}

        {current.currentResult != null && (
          <div
            style={{
              borderTop: `1px solid ${p.border}`,
              paddingTop: 6,
              marginTop: 4,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: p.textSecondary,
                marginBottom: 2,
              }}
            >
              Result
            </div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 12,
                color: phaseColor,
                fontWeight: 600,
              }}
            >
              {formatResult(current.currentResult)}
            </div>
          </div>
        )}
      </div>

      {/* Compact state view */}
      <DNCStateView
        vars={current.vars}
        memory={current.memory}
        isDark={isDark}
      />
    </div>
  );
}

/**
 * Closest-pair coordinate-plane renderer.
 *
 * Renders:
 *  - all points
 *  - current recursive region
 *  - left/right partition shading
 *  - vertical dividing line
 *  - recursion depth indicator
 *  - current best pair highlighted
 *  - current minimum distance annotation
 *  - strip highlight when active
 *  - candidate comparison highlight
 */
function ClosestPairPlane({ current, palette, phase, phaseColor }) {
  const compare = current.currentCompare;
  const combine = current.currentCombine;

  const points =
    Array.isArray(current.vars?.pts) && current.vars.pts.length > 0
      ? current.vars.pts
          .filter(
            (pInto) =>
              pInto &&
              typeof pInto.x === 'number' &&
              typeof pInto.y === 'number',
          )
          .map((pInto) => ({ x: pInto.x, y: pInto.y }))
      : [];

  const best = current.currentResult || current.latestResult || null;
  const partition =
    compare?.partition || combine?.partition || current.partition || null;
  const comparing = compare?.comparing || null;
  const stripMeta = compare?.meta?.strip;
  const stripPoints =
    Array.isArray(stripMeta) && stripMeta.length > 0
      ? stripMeta
      : (combine?.meta?.strip || []);

  const dividingX = partition?.dividingX ?? null;
  const regionLo = partition?.regionLo ?? null;
  const regionHi = partition?.regionHi ?? null;

  // Canvas/render size
  const size = 240;
  const pad = 18;
  const inner = size - pad * 2;

  // Determine coordinate scale from points when available.
  const xs = points.map((pt) => pt.x);
  const ys = points.map((pt) => pt.y);
  const allX = xs.length ? xs : [0, 10];
  const allY = ys.length ? ys : [0, 10];
  const xLo = Math.min(...allX) - 5;
  const xHi = Math.max(...allX) + 5;
  const yLo = Math.min(...allY) - 5;
  const yHi = Math.max(...allY) + 5;
  const xRange = Math.max(1e-6, xHi - xLo);
  const yRange = Math.max(1e-6, yHi - yLo);

  const scale = Math.min(inner / xRange, inner / yRange);

  const cx0 = pad + (inner - (xHi + xLo) * scale) / 2;
  const cy0 = pad + (inner - (yHi + yLo) * scale) / 2;

  const toSX = (x) => cx0 + (x - xLo) * scale;
  const toSY = (y) => cy0 + (yHi - y) * scale;

  const stripSet =
    stripPoints.length > 0
      ? new Set(stripPoints.map((p) => `${p.x},${p.y}`))
      : null;

  const regionSet =
    regionLo != null &&
    regionHi != null &&
    points.length > 0
      ? new Set(
          points
            .map((pt, idx) => ({ pt, idx }))
            .filter(({ idx }) => idx >= regionLo && idx <= regionHi)
            .map(({ pt }) => `${pt.x},${pt.y}`),
        )
      : null;

  return (
    <div
      className="surface-card"
      style={{
        borderRadius: 12,
        padding: '10px',
        background: palette.surface,
        border: `1px solid ${palette.border}`,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: palette.textSecondary,
          marginBottom: 6,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>Coordinate plane</span>
        <span style={{ fontSize: 10, color: phaseColor }}>{phase}</span>
      </div>

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: 'block', background: palette.codeBg, borderRadius: 6 }}
      >
        {/* Grid lines */}
        {Array.from({ length: 6 }).map((_, i) => {
          const t = i / 5;
          const x = pad + t * inner;
          const y = pad + t * inner;
          return (
            <React.Fragment key={`grid-${i}`}>
              <line
                x1={x}
                y1={pad}
                x2={x}
                y2={size - pad}
                stroke={palette.border}
                strokeOpacity={0.18}
                strokeWidth={1}
              />
              <line
                x1={pad}
                y1={y}
                x2={size - pad}
                y2={y}
                stroke={palette.border}
                strokeOpacity={0.18}
                strokeWidth={1}
              />
            </React.Fragment>
          );
        })}

        {/* Current recursive region */}
        {regionSet && (
          <rect
            x={pad}
            y={pad}
            width={inner}
            height={inner}
            fill={palette.blue}
            opacity={0.06}
            rx={3}
          />
        )}

        {/* Left/right partition shading */}
        {dividingX != null && (
          <>
            <rect
              x={pad}
              y={pad}
              width={Math.max(0, toSX(dividingX) - pad)}
              height={inner}
              fill={palette.orange}
              opacity={0.10}
              rx={2}
            />
            <rect
              x={toSX(dividingX)}
              y={pad}
              width={Math.max(0, size - pad - toSX(dividingX))}
              height={inner}
              fill={palette.blue}
              opacity={0.10}
              rx={2}
            />
          </>
        )}

        {/* Dividing line */}
        {dividingX != null && (
          <line
            x1={toSX(dividingX)}
            y1={pad}
            x2={toSX(dividingX)}
            y2={size - pad}
            stroke={palette.orange}
            strokeWidth={1.5}
            strokeDasharray="4 3"
            opacity={0.95}
          />
        )}

        {/* Strip highlight */}
        {stripSet && dividingX != null && stripPoints.length > 0 && (
          <rect
            x={Math.max(pad, toSX(dividingX) - 6)}
            y={pad}
            width={12}
            height={inner}
            fill={palette.pink}
            opacity={0.14}
            rx={2}
          />
        )}

        {/* Points */}
        {points.map((pt, i) => {
          const sx = toSX(pt.x);
          const sy = toSY(pt.y);
          const isInStrip =
            !!stripSet && stripSet.has(`${pt.x},${pt.y}`);
          const isBest = best && best.pair && best.pair.includes(i);
          const isComparing =
            comparing &&
            comparing.a &&
            comparing.b &&
            ((pt.x === comparing.a.x && pt.y === comparing.a.y) ||
              (pt.x === comparing.b.x && pt.y === comparing.b.y));

          let fill = palette.accent;
          let stroke = palette.accent;
          let r = 3.5;
          let strokeWidth = 1;

          if (isComparing) {
            fill = palette.pink;
            stroke = palette.pink;
            r = 5.5;
            strokeWidth = 2;
          } else if (isBest) {
            fill = palette.green;
            stroke = palette.green;
            r = 5.5;
            strokeWidth = 2;
          } else if (isInStrip && phase === 'combine') {
            fill = palette.pink;
            stroke = palette.pink;
            r = 4;
            strokeWidth = 1.5;
          }

          return (
            <g key={`pt-${i}`}>
              <circle
                cx={sx}
                cy={sy}
                r={r}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                opacity={isComparing ? 1 : 0.92}
              />
              {isComparing && (
                <circle
                  cx={sx}
                  cy={sy}
                  r={r + 3}
                  fill="none"
                  stroke={palette.pink}
                  strokeWidth={1}
                  opacity={0.55}
                  strokeDasharray="2 2"
                />
              )}
              {isBest && (
                <circle
                  cx={sx}
                  cy={sy}
                  r={r + 2}
                  fill="none"
                  stroke={palette.green}
                  strokeWidth={1}
                  opacity={0.6}
                />
              )}
            </g>
          );
        })}

        {/* Comparison segment */}
        {comparing &&
          comparing.a &&
          comparing.b &&
          comparing.a.x != null &&
          comparing.b.x != null && (
            <line
              x1={toSX(comparing.a.x)}
              y1={toSY(comparing.a.y)}
              x2={toSX(comparing.b.x)}
              y2={toSY(comparing.b.y)}
              stroke={palette.pink}
              strokeWidth={1.5}
              opacity={0.75}
              strokeDasharray="3 2"
            />
          )}

        {/* Best pair segment */}
        {best &&
          best.pair &&
          best.pair.length === 2 &&
          points[best.pair[0]] &&
          points[best.pair[1]] && (
            <line
              x1={toSX(points[best.pair[0]].x)}
              y1={toSY(points[best.pair[0]].y)}
              x2={toSX(points[best.pair[1]].x)}
              y2={toSY(points[best.pair[1]].y)}
              stroke={palette.green}
              strokeWidth={1.5}
              opacity={0.9}
            />
          )}

        {/* Distance annotation */}
        {best &&
          best.distance != null &&
          isFinite(best.distance) &&
          best.pair &&
          best.pair.length === 2 &&
          points[best.pair[0]] &&
          points[best.pair[1]] && (
            <text
              x={toSX(
                (points[best.pair[0]].x + points[best.pair[1]].x) / 2,
              )}
              y={
                toSY(
                  (points[best.pair[0]].y + points[best.pair[1]].y) / 2,
                ) -
                10
              }
              fill={palette.green}
              fontSize={9}
              fontFamily="monospace"
              textAnchor="middle"
            >
              d = {best.distance.toFixed(2)}
            </text>
          )}

        {/* Dividing line label */}
        {dividingX != null && (
          <text
            x={toSX(dividingX)}
            y={pad + 10}
            fill={palette.orange}
            fontSize={8}
            fontFamily="monospace"
            textAnchor="middle"
          >
            x = {dividingX.toFixed(1)}
          </text>
        )}
      </svg>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginTop: 6,
          flexWrap: 'wrap',
          fontSize: 9,
          color: palette.textMuted,
          fontFamily: 'monospace',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: palette.accent,
            }}
          />
          point
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: palette.green,
            }}
          />
          best pair
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: palette.pink,
            }}
          />
          comparing
        </div>
        {dividingX != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div
              style={{
                width: 12,
                height: 2,
                background: palette.orange,
                borderRadius: 1,
              }}
            />
            dividing line
          </div>
        )}
        {stripSet && stripPoints.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: palette.pink,
                opacity: 0.5,
              }}
            />
            strip
          </div>
        )}
      </div>
    </div>
  );
}

function phaseColorMap(phase, p) {
  switch (phase) {
    case 'enter':
      return p.green;
    case 'divide':
      return p.orange;
    case 'recurse':
      return p.blue;
    case 'basecase':
    case 'baseCase':
      return p.green;
    case 'compare':
      return p.pink;
    case 'combine':
      return p.purple;
    case 'return':
      return p.teal;
    case 'complete':
      return p.accent;
    default:
      return p.textMuted;
  }
}

function formatBounds(bounds) {
  if (!bounds) return '—';
  if (bounds.kind === 'range') {
    return `[${bounds.start}..${bounds.end}]  (size ${bounds.end - bounds.start + 1})`;
  }
  if (bounds.kind === 'points') {
    return `${bounds.count} points`;
  }
  if (bounds.kind === 'matrix') {
    return `${bounds.rows} × ${bounds.cols}`;
  }
  return JSON.stringify(bounds);
}

function formatResult(result) {
  if (result == null) return '—';
  if (typeof result === 'number') return String(result);
  if (Array.isArray(result)) return `[${result.join(', ')}]`;
  if (typeof result === 'object') {
    const d = result.distance;
    const pair = result.pair;
    if (typeof d === 'number' && Array.isArray(pair)) {
      return `{ distance: ${d.toFixed(3)}, pair: [${pair.join(', ')}] }`;
    }
    return JSON.stringify(result);
  }
  return String(result);
}

