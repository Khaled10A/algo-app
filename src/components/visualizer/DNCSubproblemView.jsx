import { getPalette } from '../../theme/tokens';

/**
 * DNCSubproblemView — displays the current subproblem being processed.
 *
 * Shows:
 * - Subproblem description
 * - Bounds info (range, points, matrix)
 * - Current depth
 * - Action being performed
 * - Result if available
 */
export default function DNCSubproblemView({
  subproblem = '',
  bounds = null,
  depth = 0,
  result = null,
  action = '',
  isDark = false,
}) {
  const p = getPalette(isDark ? 'dark' : 'light');

  if (!subproblem && !action) {
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
        No active subproblem
      </div>
    );
  }

  return (
    <div
      className="surface-card"
      style={{ borderRadius: 12, padding: '12px 14px' }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: p.textSecondary,
          marginBottom: 8,
        }}
      >
        Current Subproblem
      </div>

      <div
        style={{
          fontFamily: 'monospace',
          fontSize: 13,
          color: p.text,
          marginBottom: 6,
        }}
      >
        {subproblem}
      </div>

      {action && (
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: 12,
            color: p.accent,
            marginBottom: 8,
          }}
        >
          {action}
        </div>
      )}

      <div
        style={{
          fontSize: 10,
          color: p.textMuted,
          marginBottom: 8,
        }}
      >
        depth {depth}
      </div>

      {bounds && (
        <div
          style={{
            borderTop: `1px solid ${p.border}`,
            paddingTop: 8,
            marginTop: 4,
          }}
        >
          {bounds.kind === 'range' && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: p.textSecondary,
                  marginBottom: 4,
                }}
              >
                Range
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: 12,
                  color: p.text,
                }}
              >
                [{bounds.start}..{bounds.end}]
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: p.textMuted,
                  marginTop: 2,
                }}
              >
                size: {bounds.end - bounds.start + 1}
              </div>
            </div>
          )}

          {bounds.kind === 'points' && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: p.textSecondary,
                  marginBottom: 4,
                }}
              >
                Point Set
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: 12,
                  color: p.text,
                }}
              >
                {bounds.count} points
              </div>
            </div>
          )}

          {bounds.kind === 'matrix' && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: p.textSecondary,
                  marginBottom: 4,
                }}
              >
                Matrix Block
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: 12,
                  color: p.text,
                }}
              >
                {bounds.rows}×{bounds.cols}
              </div>
            </div>
          )}
        </div>
      )}

      {result != null && (
        <div
          style={{
            borderTop: `1px solid ${p.border}`,
            paddingTop: 8,
            marginTop: 4,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: p.textSecondary,
              marginBottom: 4,
            }}
          >
            Result
          </div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 13,
              color: p.accent,
              fontWeight: 600,
            }}
          >
            {String(result)}
          </div>
        </div>
      )}
    </div>
  );
}
