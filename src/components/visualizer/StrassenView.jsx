import React from 'react';

/**
 * StrassenView — matrix-multiplication visualizer for the D&C debugger.
 *
 * Renders, per projected D&C snapshot (matrices come from the event's meta
 * passthrough, never from vars/memory):
 *   - the current call: A n×n · B n×n with recursion depth
 *   - divide: the quadrant partitions A11..A22 / B11..B22
 *   - additions: the S1..S10 expressions with operands and result
 *   - recurse: the seven multiplication subproblems (M1..M7) with operands
 *   - base case: the single scalar product
 *   - recombine: M1..M7 intermediates, the C11..C22 formulas, and C
 *   - return: the returned matrix
 *
 * Matrices are plain number[][] arrays; values stay small in the UI.
 */
export default function StrassenView({
  current,
  palette,
  phase,
  phaseColor,
}) {
  const meta = current.meta || {};
  const sub = current.currentSubproblem || '';
  const depth = current.depth ?? 0;
  const log = current.log || '';
  const result = current.currentResult;

  const stage = meta.stage || null;
  const n = meta.n ?? null;

  const isDivide = phase === 'divide';
  const isAddition = phase === 'combine' && stage === 'addition';
  const isRecurse = phase === 'recurse';
  const isBase = phase === 'base-case' || phase === 'basecase';
  const isRecombine = phase === 'combine' && stage === 'recombine';
  const isReturn = phase === 'return';

  return (
    <div
      className='surface-card'
      style={{
        borderRadius: 12,
        padding: '12px 14px',
        background: palette.surface,
        border: `1px solid ${palette.border}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: palette.textSecondary,
          marginBottom: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>Strassen matrix multiplication</span>
        <span style={{ fontSize: 10, color: phaseColor }}>{phase}</span>
      </div>

      {/* Current call */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: palette.codeBg,
          borderRadius: 8,
          padding: '9px 12px',
          border: `1px solid ${palette.border}`,
        }}
      >
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 14,
            fontWeight: 700,
            color: palette.textPrimary,
          }}
        >
          A {formatN(n)} × B {formatN(n)}
        </span>
        <span style={{ fontSize: 10, color: palette.textMuted }}>
          depth {depth}
        </span>
      </div>

      <div
        style={{
          fontFamily: 'monospace',
          fontSize: 10,
          color: palette.textMuted,
          marginTop: 6,
          lineHeight: 1.5,
          wordBreak: 'break-all',
        }}
      >
        {sub || '—'}
      </div>

      {/* Divide: quadrant partitions */}
      {isDivide && meta.quadrants && (
        <PhaseSection
          title='Divide — quadrant split'
          color={palette.orange}
          palette={palette}
        >
          <div
            style={{
              display: 'flex',
              gap: 14,
              flexWrap: 'wrap',
              alignItems: 'flex-start',
            }}
          >
            <QuadrantGroup
              label='A'
              quadrants={meta.quadrants}
              prefix='a'
              color={palette.orange}
              palette={palette}
            />
            <QuadrantGroup
              label='B'
              quadrants={meta.quadrants}
              prefix='b'
              color={palette.orange}
              palette={palette}
            />
          </div>
          <div
            style={{
              fontSize: 9,
              color: palette.textMuted,
              marginTop: 8,
              fontFamily: 'monospace',
            }}
          >
            {n}×{n} → four {formatN(meta.qn)}×{formatN(meta.qn)} quadrants ·
            each quadrant solved independently
          </div>
        </PhaseSection>
      )}

      {/* Addition / subtraction: S1..S10 */}
      {isAddition && meta.label && (
        <PhaseSection
          title='Matrix addition / subtraction'
          color={palette.blue}
          palette={palette}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: 14,
                fontWeight: 700,
                color: palette.blue,
                background: `${palette.blue}18`,
                padding: '3px 9px',
                borderRadius: 6,
              }}
            >
              {meta.label}
            </span>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: 13,
                color: palette.textPrimary,
              }}
            >
              = {meta.expression}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 14,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <MatrixGrid
              matrix={meta.left}
              palette={palette}
              dims={formatN(meta.left && meta.left.length)}
            />
            <span style={{ fontSize: 14, color: palette.textMuted }}>→</span>
            <MatrixGrid
              matrix={meta.result}
              palette={palette}
              dims={formatN(meta.result && meta.result.length)}
              highlight
              color={palette.blue}
            />
          </div>
        </PhaseSection>
      )}

      {/* Recursive multiplication: M1..M7 */}
      {isRecurse && meta.target && (
        <PhaseSection
          title='Recursive multiplication'
          color={palette.purple}
          palette={palette}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: 14,
                fontWeight: 700,
                color: palette.purple,
                background: `${palette.purple}18`,
                padding: '3px 9px',
                borderRadius: 6,
              }}
            >
              {meta.target}
            </span>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: 13,
                color: palette.textPrimary,
              }}
            >
              = {meta.expression}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 14,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <MatrixGrid
              matrix={meta.a}
              palette={palette}
              dims={formatN(meta.a && meta.a.length)}
            />
            <span style={{ fontSize: 13, color: palette.textMuted }}>×</span>
            <MatrixGrid
              matrix={meta.b}
              palette={palette}
              dims={formatN(meta.b && meta.b.length)}
            />
          </div>
        </PhaseSection>
      )}

      {/* Base case */}
      {isBase && (
        <PhaseSection
          title='Base case'
          color={palette.green}
          palette={palette}
        >
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              color: palette.textSecondary,
              lineHeight: 1.5,
            }}
          >
            {log}
          </div>
          {meta.product && (
            <div style={{ marginTop: 8 }}>
              <MatrixGrid
                matrix={meta.product}
                palette={palette}
                dims='1×1'
                highlight
                color={palette.green}
              />
            </div>
          )}
        </PhaseSection>
      )}

      {/* Recombine */}
      {isRecombine && meta.m1 && (
        <PhaseSection
          title='Combine — recombine quadrants'
          color={palette.pink}
          palette={palette}
        >
          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 12,
            }}
          >
            {['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7'].map((label) => (
              <div key={label}>
                <div
                  style={{
                    fontSize: 9,
                    fontFamily: 'monospace',
                    color: palette.pink,
                    marginBottom: 3,
                    textAlign: 'center',
                    fontWeight: 700,
                  }}
                >
                  {label}
                </div>
                <MatrixGrid
                  matrix={meta[label.toLowerCase()]}
                  palette={palette}
                  dims=''
                  tiny
                />
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '3px 12px',
              fontFamily: 'monospace',
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            {['C11', 'C12', 'C21', 'C22'].map((label) => (
              <React.Fragment key={label}>
                <span
                  style={{
                    color: palette.pink,
                    fontWeight: 700,
                    fontSize: 11,
                    alignSelf: 'center',
                  }}
                >
                  {label}
                </span>
                <span style={{ color: palette.textSecondary }}>
                  = {meta.formulas ? meta.formulas[label.toLowerCase()] : '—'}
                </span>
              </React.Fragment>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <MatrixGrid
              matrix={meta.c11}
              palette={palette}
              dims=''
              tiny
            />
            <MatrixGrid
              matrix={meta.c12}
              palette={palette}
              dims=''
              tiny
            />
            <MatrixGrid
              matrix={meta.c21}
              palette={palette}
              dims=''
              tiny
            />
            <MatrixGrid
              matrix={meta.c22}
              palette={palette}
              dims=''
              tiny
            />
            <span style={{ fontSize: 13, color: palette.textMuted }}>→</span>
            <MatrixGrid
              matrix={meta.result || meta.c}
              palette={palette}
              dims={formatN(n)}
              highlight
              color={palette.pink}
            />
          </div>
        </PhaseSection>
      )}

      {/* Returned result */}
      {(isReturn || (result != null && !isBase && !isRecombine && !isAddition)) &&
        result != null && (
          <PhaseSection
            title='Returned'
            color={palette.teal}
            palette={palette}
          >
            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <MatrixGrid
                matrix={result}
                palette={palette}
                dims={formatN(Array.isArray(result) ? result.length : n)}
                highlight
                color={palette.teal}
              />
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 12,
                  color: palette.textSecondary,
                }}
              >
                {Array.isArray(result) && result.length
                  ? `C = A · B  (${result.length}×${result.length})`
                  : ''}
              </span>
            </div>
          </PhaseSection>
        )}
    </div>
  );
}

/** Section wrapper with a colored title bar. */
function PhaseSection({ title, color, palette, children }) {
  return (
    <div
      style={{
        marginTop: 10,
        borderTop: `1px solid ${palette.border}`,
        paddingTop: 10,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color,
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

/** A 2×2 quadrant block: A11 A12 / A21 A22 with colored borders. */
function QuadrantGroup({ label, quadrants, prefix, color, palette }) {
  const q = (name) => quadrants[`${prefix}${name}`];
  const dims = q('11') ? `${q('11').length}×${q('11').length}` : '';
  return (
    <div>
      <div
        style={{
          fontSize: 9,
          fontFamily: 'monospace',
          color: palette.textSecondary,
          marginBottom: 4,
        }}
      >
        <span style={{ fontWeight: 700, color }}>{label}</span> partitioned
      </div>
      <div style={{ display: 'inline-flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex' }}>
          <QuadrantCell
            matrix={q('11')}
            label='11'
            dims={dims}
            color={color}
            palette={palette}
          />
          <QuadrantCell
            matrix={q('12')}
            label='12'
            dims={dims}
            color={color}
            palette={palette}
          />
        </div>
        <div style={{ display: 'flex' }}>
          <QuadrantCell
            matrix={q('21')}
            label='21'
            dims={dims}
            color={color}
            palette={palette}
          />
          <QuadrantCell
            matrix={q('22')}
            label='22'
            dims={dims}
            color={color}
            palette={palette}
          />
        </div>
      </div>
    </div>
  );
}

/** One quadrant mini-grid with a small label in its corner. */
function QuadrantCell({ matrix, label, dims, color, palette }) {
  return (
    <div
      style={{
        position: 'relative',
        border: `1px solid ${color}`,
        borderRadius: 6,
        padding: '5px 7px',
        margin: 2,
        background: palette.codeBg,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -1,
          left: 4,
          fontSize: 7,
          fontFamily: 'monospace',
          color,
          fontWeight: 700,
          background: palette.surface,
          padding: '0 2px',
        }}
      >
        {label}
      </div>
      <MatrixGrid matrix={matrix} palette={palette} dims={dims} tiny />
    </div>
  );
}

/**
 * Compact matrix renderer.
 *
 * `tiny` uses smaller cells (for M1..M7 / quadrant previews), `highlight`
 * paints the frame with a phase color.
 */
function MatrixGrid({ matrix, palette, dims, tiny = false, highlight = false, color = palette.textPrimary }) {
  const isMatrix = Array.isArray(matrix) && matrix.length > 0 && Array.isArray(matrix[0]);
  if (!isMatrix) {
    return (
      <span style={{ fontSize: 10, color: palette.textMuted, fontFamily: 'monospace' }}>
        —
      </span>
    );
  }

  const cell = tiny ? 16 : 24;
  const fontSize = tiny ? 8 : 11;
  const rows = matrix.length;
  const cols = matrix[0].length;

  return (
    <div style={{ display: 'inline-block' }}>
      {dims && (
        <div
          style={{
            fontSize: 8,
            fontFamily: 'monospace',
            color: palette.textMuted,
            marginBottom: 3,
            textAlign: 'center',
          }}
        >
          {dims}
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${cell}px)`,
          border: `1px solid ${highlight ? color : palette.border}`,
          borderRadius: 6,
          overflow: 'hidden',
          background: palette.codeBg,
          boxShadow: highlight ? `0 0 0 1px ${color}55` : 'none',
        }}
      >
        {matrix.flatMap((row, i) =>
          row.map((v, j) => (
            <div
              key={`${i}-${j}`}
              style={{
                width: cell,
                height: cell,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'monospace',
                fontSize,
                fontWeight: highlight ? 700 : 400,
                color: highlight ? color : palette.textPrimary,
                background:
                  (i + j) % 2 === 1 ? palette.surface : 'transparent',
                borderRight: j < cols - 1 ? `1px solid ${palette.border}` : 'none',
                borderBottom: i < rows - 1 ? `1px solid ${palette.border}` : 'none',
              }}
            >
              {v}
            </div>
          )),
        )}
      </div>
    </div>
  );
}

function formatN(n) {
  return n == null || n === '' ? 'n' : String(n);
}