import { getPalette } from '../../theme/tokens';

/**
 * DNCEventInfoView — displays detailed information about the current event.
 *
 * Shows:
 * - Event type with color coding
 * - Event ID
 * - Step number / total
 * - Subproblem
 * - Action
 * - Node ID and Parent ID
 * - Meta information
 */
export default function DNCEventInfoView({
  event = null,
  step = 0,
  totalSteps = 0,
  isDark = false,
}) {
  const p = getPalette(isDark ? 'dark' : 'light');

  if (!event) {
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
        No event to display
      </div>
    );
  }

  const eventType = event.type || 'unknown';
  const typeColor = getEventTypeColor(eventType, p);

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
        Event Info
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 12,
            color: typeColor,
            fontWeight: 600,
          }}
        >
          {eventType}
        </span>
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 11,
            color: p.textMuted,
          }}
        >
          Step {step + 1} / {totalSteps || step + 1}
        </span>
      </div>

      <div
        style={{
          fontFamily: 'monospace',
          fontSize: 12,
          color: p.text,
          marginBottom: 8,
        }}
      >
        {event.action}
      </div>

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
            color: p.textMuted,
            marginBottom: 4,
          }}
        >
          Event ID
        </div>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: 11,
            color: p.text,
          }}
        >
          {event.eventId}
        </div>
      </div>

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
            color: p.textMuted,
            marginBottom: 4,
          }}
        >
          Subproblem
        </div>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: 11,
            color: p.text,
          }}
        >
          {event.subproblem}
        </div>
      </div>

      <div
        style={{
          borderTop: `1px solid ${p.border}`,
          paddingTop: 8,
          marginTop: 4,
          display: 'flex',
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              color: p.textMuted,
              marginBottom: 4,
            }}
          >
            Node:
          </div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              color: p.text,
            }}
          >
            {event.nodeId || '—'}
          </div>
        </div>

        {event.parentId && (
          <div>
            <div
              style={{
                fontSize: 10,
                color: p.textMuted,
                marginBottom: 4,
              }}
            >
              Parent:
            </div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 11,
                color: p.text,
              }}
            >
              {event.parentId}
            </div>
          </div>
        )}
      </div>

      {event.meta && Object.keys(event.meta).length > 0 && (
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
            Meta
          </div>
          <pre
            style={{
              fontFamily: 'monospace',
              fontSize: 10,
              color: p.text,
              background: `${p.surface}80`,
              borderRadius: 6,
              padding: '6px 8px',
              overflowX: 'auto',
            }}
          >
            {JSON.stringify(event.meta, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function getEventTypeColor(type, p) {
  switch (type) {
    case 'enter':
      return p.green;
    case 'divide':
      return p.orange;
    case 'recurse':
      return p.blue;
    case 'baseCase':
    case 'base-case':
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
