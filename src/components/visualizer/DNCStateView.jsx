import { getPalette } from '../../theme/tokens';

/**
 * DNCStateView — displays variables and memory state for D&C algorithms.
 *
 * Shows:
 * - Variables (key-value pairs from state snapshot)
 * - Memory dump (string representation of state)
 */
export default function DNCStateView({
  vars = {},
  memory = '',
  isDark = false,
}) {
  const p = getPalette(isDark ? 'dark' : 'light');

  const entries = Object.entries(vars);

  if (entries.length === 0 && !memory) {
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
        No state to display
      </div>
    );
  }

  return (
    <div
      className="surface-card"
      style={{ borderRadius: 12, padding: '12px 14px' }}
    >
      {entries.length > 0 && (
        <>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: p.textSecondary,
              marginBottom: 8,
            }}
          >
            Variables
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {entries.map(([key, value]) => (
              <div
                key={key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'monospace',
                  fontSize: 12,
                }}
              >
                <span style={{ color: p.textMuted }}>{key}</span>
                <span
                  style={{
                    color: p.text,
                    fontWeight: 500,
                    wordBreak: 'break-all',
                  }}
                >
                  {formatVarValue(value)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {memory && (
        <>
          {entries.length > 0 && (
            <div
              style={{
                borderTop: `1px solid ${p.border}`,
                marginTop: 12,
                paddingTop: 8,
              }}
            />
          )}
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: p.textSecondary,
              marginBottom: 8,
            }}
          >
            Memory
          </div>
          <pre
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              color: p.text,
              background: `${p.surface}80`,
              borderRadius: 6,
              padding: '8px 10px',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {memory}
          </pre>
        </>
      )}
    </div>
  );
}

/**
 * Format a variable value for display (arrays become compact strings so React
 * never receives object children).
 */
function formatVarValue(v) {
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]';
    if (typeof v[0] === 'object' && v[0] !== null) {
      return JSON.stringify(v);
    }
    return v.join(', ');
  }
  return String(v);
}
