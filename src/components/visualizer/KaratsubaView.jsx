/**
 * KaratsubaView — recursive-multiplication visualizer for the D&C debugger.
 *
 * Renders, per projected D&C snapshot:
 *   - the current call: x × y (with sign and recursion depth)
 *   - the high/low split:  x → xHigh | xLow   (split at m)
 *   - the active recursive target: z0 / z1 / z2 with its operand expression
 *   - the recombination: z0, z1, z2, the three terms and the result
 *   - the returned result (including the direct-multiplication base case)
 *
 * Data comes from the projector's vars (stateSnapshot strings/numbers) plus
 * the phase/depth/result fields — no BigInt ever reaches the component.
 */
export default function KaratsubaView({
  current,
  palette,
  phase,
  phaseColor,
}) {
  const vars = current.vars || {};
  const sub = current.currentSubproblem || '';
  const depth = current.depth ?? 0;
  const log = current.log || '';
  const result = current.currentResult;

  const x = vars.x ?? '—';
  const y = vars.y ?? '—';
  const sign = Number(vars.sign ?? 1);
  const m = vars.m != null ? Number(vars.m) : null;
  const pad = (s) => (m != null ? String(s).padStart(m, '0') : String(s));

  const hasSplit =
    m != null &&
    vars.xHigh != null &&
    vars.xLow != null &&
    vars.yHigh != null &&
    vars.yLow != null;

  const isRecurse = phase === 'recurse';
  const isBase = phase === 'base-case' || phase === 'basecase';
  const isReturn = phase === 'return';
  const isCombine = phase === 'combine';
  const showCombine =
    isCombine || (vars.z0 != null && vars.z1 != null && vars.z2 != null);

  return (
    <div
      className="surface-card"
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
        <span>Recursive multiplication</span>
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
            fontSize: 15,
            fontWeight: 700,
            color: palette.textPrimary,
            letterSpacing: '0.02em',
          }}
        >
          {sign === -1 && phase !== 'enter' ? '−' : ''}
          {x} × {y}
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

      {/* Split visualization */}
      {hasSplit && (
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
              color: palette.orange,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Divide — split at m = {m}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              fontFamily: 'monospace',
              fontSize: 13,
            }}
          >
            <SplitRow
              label="x"
              high={pad(vars.xHigh)}
              low={pad(vars.xLow)}
              m={m}
              color={palette.orange}
              text={palette.textPrimary}
              codeBg={palette.codeBg}
              border={palette.border}
            />
            <SplitRow
              label="y"
              high={pad(vars.yHigh)}
              low={pad(vars.yLow)}
              m={m}
              color={palette.orange}
              text={palette.textPrimary}
              codeBg={palette.codeBg}
              border={palette.border}
            />
          </div>
          <div
            style={{
              fontSize: 9,
              color: palette.textMuted,
              marginTop: 6,
              fontFamily: 'monospace',
            }}
          >
            x = xHigh·10^m + xLow &nbsp;·&nbsp; y = yHigh·10^m + yLow
          </div>
        </div>
      )}

      {/* Recursive target */}
      {isRecurse && vars.recurseTarget && (
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
              color: palette.blue,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Recursive multiplication
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
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
              {vars.recurseTarget}
            </span>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: 13,
                color: palette.textPrimary,
              }}
            >
              = {vars.targetExpression || `${vars.x} × ${vars.y}`}
            </span>
          </div>
        </div>
      )}

      {/* Base case */}
      {isBase && (
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
              color: palette.green,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Base case
          </div>
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
          {vars.absProduct != null && (
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 12,
                color: palette.textPrimary,
                marginTop: 4,
              }}
            >
              |x × y| = {vars.absProduct}
            </div>
          )}
        </div>
      )}

      {/* Recombination */}
      {showCombine && (
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
              color: palette.purple,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Combine — recombine
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '3px 10px',
              fontFamily: 'monospace',
              fontSize: 12,
            }}
          >
            <KV label="z0" value={vars.z0} color={palette.purple} text={palette.textPrimary} />
            <KV label="z1" value={vars.z1} color={palette.purple} text={palette.textPrimary} />
            <KV label="z2" value={vars.z2} color={palette.purple} text={palette.textPrimary} />
            <KV label="z2·10^(2m)" value={vars.termHigh} color={palette.textMuted} text={palette.textPrimary} />
            <KV label="(z1−z2−z0)·10^m" value={vars.middleTerm} color={palette.textMuted} text={palette.textPrimary} />
            <KV label="+ z0" value={vars.z0} color={palette.textMuted} text={palette.textPrimary} />
          </div>
          {vars.result != null && (
            <div
              style={{
                marginTop: 8,
                background: palette.codeBg,
                borderRadius: 6,
                padding: '7px 10px',
                border: `1px solid ${palette.border}`,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  color: palette.textMuted,
                  fontFamily: 'monospace',
                  marginRight: 8,
                }}
              >
                result
              </span>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 13,
                  fontWeight: 700,
                  color: palette.purple,
                  wordBreak: 'break-all',
                }}
              >
                {vars.result}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Returned result */}
      {(isReturn || (result != null && !isBase && !showCombine)) && result != null && (
        <div
          style={{
            marginTop: 10,
            borderTop: `1px solid ${palette.border}`,
            paddingTop: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: palette.teal,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Returned
          </span>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 14,
              fontWeight: 700,
              color: palette.teal,
              wordBreak: 'break-all',
            }}
          >
            = {formatResult(result)}
          </span>
        </div>
      )}
    </div>
  );
}

/** One `label high | low` split row. */
function SplitRow({ label, high, low, m, color, text, codeBg, border }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        background: codeBg,
        border: `1px solid ${border}`,
        borderRadius: 6,
        padding: '5px 8px',
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color,
          marginRight: 2,
        }}
      >
        {label}
      </span>
      <span style={{ color: text }}>{high}</span>
      <span
        style={{
          color,
          fontSize: 12,
          fontWeight: 700,
          margin: '0 1px',
        }}
      >
        |
      </span>
      <span
        style={{
          color: text,
          textDecoration: 'underline',
          textDecorationColor: color,
          textUnderlineOffset: 2,
        }}
      >
        {low}
      </span>
      <span
        style={{
          fontSize: 8,
          color: '#94a3b8',
          fontFamily: 'monospace',
          marginLeft: 4,
        }}
      >
        {m} digits
      </span>
    </div>
  );
}

/** One `label  value` grid cell. */
function KV({ label, value, color, text }) {
  return (
    <>
      <span style={{ color, fontSize: 10, alignSelf: 'center' }}>{label}</span>
      <span
        style={{
          color: value == null ? '#94a3b8' : text,
          wordBreak: 'break-all',
        }}
      >
        {value == null ? '—' : value}
      </span>
    </>
  );
}

function formatResult(result) {
  if (result == null) return '—';
  return String(result);
}