import { useState } from 'react';
import { getAlgorithm, getWithDebug } from '../algorithms/registry';
import { validateHuffmanInput, HUFFMAN_MAX_INPUT_LENGTH } from '../algorithms/greedy/huffman';
import { validateActivityInput, ACTIVITY_MAX_COUNT } from '../algorithms/greedy/activity';
import { validateFractionalKnapsackInput, FRACTIONAL_KNAPSACK_MAX_ITEMS, FRACTIONAL_KNAPSACK_MAX_CAPACITY } from '../algorithms/greedy/fractionalKnapsack';
import { usePlayback } from '../hooks/usePlayback';
import { getPalette } from '../theme/tokens';
import { getDefaultActivities } from '../algorithms/greedy/activity';
import { getDefaultKnapsack } from '../algorithms/greedy/fractionalKnapsack';

const GREEDY_ALGOS = getWithDebug('greedy');

export function GreedyDebuggerTab({ isDark }) {
  const p = getPalette(isDark ? 'dark' : 'light');

  const [algoId, setAlgoId] = useState(GREEDY_ALGOS[0]?.id || 'huffman-coding');
  const [steps, setSteps] = useState([]);
  const [inputNotice, setInputNotice] = useState(null);

  // Huffman input
  const [huffmanInput, setHuffmanInput] = useState('hello world');

  // Activity Selection input
  const [activityInput, setActivityInput] = useState(JSON.stringify(getDefaultActivities(), null, 2));

  // Fractional Knapsack input
  const [knapsackItems, setKnapsackItems] = useState(JSON.stringify(getDefaultKnapsack().items, null, 2));
  const [knapsackCapacity, setKnapsackCapacity] = useState(getDefaultKnapsack().capacity);

  const playback = usePlayback({
    length: steps.length,
    initialSpeed: 600,
    onFinish: () => {},
  });
  const { index: step, playing } = playback;

  const descriptor = getAlgorithm(algoId);
  const isHuffman = algoId === 'huffman-coding';
  const isActivity = algoId === 'activity-selection';
  const isFractional = algoId === 'fractional-knapsack';
  const accentColor = descriptor.color;
  const codeLines = descriptor.codeLines || [];
  const current = steps[step] || null;

  function generate() {
    setInputNotice(null);

    try {
      if (isHuffman) {
        const validation = validateHuffmanInput(huffmanInput);
        if (!validation.valid) {
          setInputNotice(validation.reason);
          return;
        }
        if (huffmanInput.length > HUFFMAN_MAX_INPUT_LENGTH) {
          setInputNotice(`Input too long (${huffmanInput.length} chars). Maximum is ${HUFFMAN_MAX_INPUT_LENGTH} characters.`);
          return;
        }
        const s = descriptor.debug(validation.processed);
        setSteps(s);
        playback.reset();
      } else if (isActivity) {
        let parsed;
        try {
          parsed = JSON.parse(activityInput);
        } catch {
          setInputNotice('Invalid JSON. Use format: [{ "start": 1, "finish": 4 }, ...]');
          return;
        }
        if (!Array.isArray(parsed)) {
          setInputNotice('Input must be an array of activities.');
          return;
        }
        const validation = validateActivityInput(parsed);
        if (!validation.valid) {
          setInputNotice(validation.reason);
          return;
        }
        if (parsed.length > ACTIVITY_MAX_COUNT) {
          setInputNotice(`Too many activities (${parsed.length}). Maximum is ${ACTIVITY_MAX_COUNT}.`);
          return;
        }
        const s = descriptor.debug(validation.processed);
        setSteps(s);
        playback.reset();
      } else if (isFractional) {
        let parsedItems;
        try {
          parsedItems = JSON.parse(knapsackItems);
        } catch {
          setInputNotice('Invalid JSON for items. Use format: [{ "weight": 10, "value": 60 }, ...]');
          return;
        }
        if (!Array.isArray(parsedItems)) {
          setInputNotice('Items must be an array.');
          return;
        }
        const capacity = Number(knapsackCapacity);
        if (isNaN(capacity) || capacity <= 0) {
          setInputNotice('Capacity must be a positive number.');
          return;
        }
        const validation = validateFractionalKnapsackInput(parsedItems, capacity);
        if (!validation.valid) {
          setInputNotice(validation.reason);
          return;
        }
        if (parsedItems.length > FRACTIONAL_KNAPSACK_MAX_ITEMS) {
          setInputNotice(`Too many items (${parsedItems.length}). Maximum is ${FRACTIONAL_KNAPSACK_MAX_ITEMS}.`);
          return;
        }
        if (capacity > FRACTIONAL_KNAPSACK_MAX_CAPACITY) {
          setInputNotice(`Capacity too large (${capacity}). Maximum is ${FRACTIONAL_KNAPSACK_MAX_CAPACITY}.`);
          return;
        }
        const s = descriptor.debug(validation.processed.items, validation.processed.capacity);
        setSteps(s);
        playback.reset();
      }
    } catch (e) {
      setInputNotice(e.message);
    }
  }

  const algoBtnStyle = (a) => ({
    padding: '5px 10px',
    borderRadius: 5,
    border: `1px solid ${algoId === a.id ? a.color : p.border}`,
    background: algoId === a.id ? `${a.color}18` : 'transparent',
    color: algoId === a.id ? a.color : p.textSecondary,
    fontSize: 10,
    cursor: 'pointer',
    fontFamily: 'monospace',
  });

  const selectAlgo = (id) => {
    setAlgoId(id);
    setSteps([]);
    playback.reset();
    setInputNotice(null);
  };

  const stepBtn = {
    padding: '6px 10px',
    fontSize: 13,
  };

  return (
    <div style={{ color: p.textPrimary }}>
      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: accentColor,
          marginBottom: 14,
        }}
      >
        Greedy Algorithms Debugger
      </div>

      {/* CONTROLS ROW */}
      <div
        className="glass-floating"
        style={{
          borderRadius: 14,
          padding: '14px 18px',
          marginBottom: 14,
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: p.textSecondary,
              marginBottom: 6,
            }}
          >
            Algorithm
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {GREEDY_ALGOS.map((a) => (
              <button
                key={a.id}
                onClick={() => selectAlgo(a.id)}
                style={algoBtnStyle(a)}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>

        {isHuffman && (
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: p.textSecondary,
                marginBottom: 6,
              }}
            >
              Input text (max {HUFFMAN_MAX_INPUT_LENGTH} chars)
            </div>
            <input
              value={huffmanInput}
              onChange={(e) => setHuffmanInput(e.target.value)}
              aria-label="Huffman input text"
              placeholder="Enter text to encode..."
              style={{
                background: p.codeBg,
                border: `1px solid ${p.border}`,
                borderRadius: 5,
                color: p.textPrimary,
                padding: '5px 8px',
                fontSize: 11,
                fontFamily: 'monospace',
                width: 200,
                outline: 'none',
              }}
            />
            <div
              style={{
                fontSize: 9,
                color: p.textSecondary,
                marginTop: 4,
                fontFamily: 'monospace',
              }}
            >
              {huffmanInput.length}/{HUFFMAN_MAX_INPUT_LENGTH} chars
            </div>
          </div>
        )}

        {isActivity && (
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: p.textSecondary,
                marginBottom: 6,
              }}
            >
              Activities JSON (max {ACTIVITY_MAX_COUNT})
            </div>
            <textarea
              value={activityInput}
              onChange={(e) => setActivityInput(e.target.value)}
              aria-label="Activity selection input"
              placeholder='[{ "start": 1, "finish": 4 }, ...]'
              rows={4}
              spellCheck={false}
              style={{
                background: p.codeBg,
                border: `1px solid ${p.border}`,
                borderRadius: 5,
                color: p.textPrimary,
                padding: '5px 8px',
                fontSize: 10,
                fontFamily: 'monospace',
                width: 220,
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>
        )}

        {isFractional && (
          <>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: p.textSecondary,
                  marginBottom: 6,
                }}
              >
                Items JSON (max {FRACTIONAL_KNAPSACK_MAX_ITEMS})
              </div>
              <textarea
                value={knapsackItems}
                onChange={(e) => setKnapsackItems(e.target.value)}
                aria-label="Fractional knapsack items"
                placeholder='[{ "weight": 10, "value": 60 }, ...]'
                rows={4}
                spellCheck={false}
                style={{
                  background: p.codeBg,
                  border: `1px solid ${p.border}`,
                  borderRadius: 5,
                  color: p.textPrimary,
                  padding: '5px 8px',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  width: 220,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: p.textSecondary,
                  marginBottom: 6,
                }}
              >
                Capacity (max {FRACTIONAL_KNAPSACK_MAX_CAPACITY})
              </div>
              <input
                type="number"
                value={knapsackCapacity}
                onChange={(e) => setKnapsackCapacity(e.target.value)}
                aria-label="Knapsack capacity"
                min={1}
                max={FRACTIONAL_KNAPSACK_MAX_CAPACITY}
                style={{
                  background: p.codeBg,
                  border: `1px solid ${p.border}`,
                  borderRadius: 5,
                  color: p.textPrimary,
                  padding: '5px 8px',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  width: 80,
                  outline: 'none',
                }}
              />
            </div>
          </>
        )}

        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: p.textSecondary,
              marginBottom: 6,
            }}
          >
            Speed:{' '}
            {playback.speed < 300
              ? 'Fast'
              : playback.speed < 700
                ? 'Medium'
                : 'Slow'}
          </div>
          <input
            type="range"
            min={100}
            max={1000}
            aria-label="Playback speed"
            value={1100 - playback.speed}
            onChange={(e) => playback.setSpeed(1100 - +e.target.value)}
            style={{ accentColor, width: 100 }}
          />
        </div>

        <div
          className="glass-thin"
          style={{
            display: 'flex',
            gap: 6,
            marginLeft: 'auto',
            alignItems: 'center',
            padding: 6,
            borderRadius: 12,
          }}
        >
          <button
            onClick={generate}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 90%, white), ${accentColor})`,
              color: '#fff',
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: 600,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.28), 0 3px 10px ${accentColor}44`,
            }}
          >
            GENERATE
          </button>
          {steps.length > 0 && (
            <>
              <button
                onClick={playback.toggle}
                aria-label={playing ? 'Pause' : 'Play'}
                title={playing ? 'Pause' : 'Play'}
                style={{
                  padding: '7px 13px',
                  borderRadius: 8,
                  border: 'none',
                  background: playing
                    ? 'rgba(255, 59, 48, 0.12)'
                    : 'rgba(48, 209, 88, 0.14)',
                  color: playing ? p.red : p.green,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {playing ? '⏸' : '▶'}
              </button>
              <button
                onClick={playback.prev}
                aria-label='Previous step'
                title='Previous step'
                className='icon-btn'
                style={stepBtn}
              >
                ◀
              </button>
              <button
                onClick={playback.next}
                aria-label='Next step'
                title='Next step'
                className='icon-btn'
                style={stepBtn}
              >
                ▶
              </button>
              <button
                onClick={playback.reset}
                aria-label='First step'
                title='First step'
                style={stepBtn}
              >
                ⏮
              </button>
              <button
                onClick={playback.goToEnd}
                aria-label='Last step'
                title='Last step'
                style={stepBtn}
              >
                ⏭
              </button>
            </>
          )}
        </div>
      </div>

      {inputNotice && (
        <div
          role='status'
          className='popover-in'
          style={{
            marginBottom: 12,
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 11,
            fontFamily: 'monospace',
            lineHeight: 1.5,
            background: isDark
              ? 'rgba(251,191,36,0.08)'
              : 'rgba(217,119,6,0.08)',
            border: `1px solid ${isDark ? 'rgba(251,191,36,0.4)' : 'rgba(180,83,9,0.45)'}`,
            color: isDark ? '#fbbf24' : '#92400e',
          }}
        >
          ⚠ {inputNotice}
        </div>
      )}

      {steps.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 4,
              fontSize: 10,
            }}
          >
            <span style={{ color: accentColor, fontFamily: 'monospace' }}>
              Step {step + 1} / {steps.length}
            </span>
            {current?.log && (
              <span
                style={{
                  color: p.textSecondary,
                  fontFamily: 'monospace',
                  fontSize: 10,
                  background: p.codeBg,
                  padding: '2px 10px',
                  borderRadius: 4,
                }}
              >
                → {current.log}
              </span>
            )}
          </div>
          <div
            style={{
              background: 'rgba(127,127,127,0.30)',
              borderRadius: 4,
              height: 4,
            }}
          >
            <div
              style={{
                width: `${((step + 1) / steps.length) * 100}%`,
                height: '100%',
                background: accentColor,
                borderRadius: 4,
                transition: 'width 0.1s',
              }}
            />
          </div>
          <input
            type='range'
            min={0}
            max={steps.length - 1}
            value={step}
            aria-label='Step position'
            onChange={(e) => playback.setStep(+e.target.value)}
            style={{ width: '100%', accentColor, marginTop: 4 }}
          />
        </div>
      )}

      {steps.length > 0 && current ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div
            className='editor-surface'
            style={{ borderRadius: 12, overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '9px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `1px solid ${p.border}`,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: accentColor,
                  fontFamily: 'monospace',
                }}
              >
                {descriptor.name.replace(/ /g, '_').toLowerCase()}
              </span>
              <span
                style={{
                  fontSize: 9,
                  color: p.textSecondary,
                  fontFamily: 'monospace',
                }}
              >
                line {(current.activeLine ?? 0) + 1}
              </span>
            </div>
            <div style={{ padding: '10px 0' }}>
              {codeLines.map(({ n, code }) => (
                <div
                  key={n}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0,
                    background:
                      n === current.activeLine
                        ? `${accentColor}18`
                        : 'transparent',
                    borderLeft:
                      n === current.activeLine
                        ? `3px solid ${accentColor}`
                        : '3px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <span
                    style={{
                      width: 32,
                      textAlign: 'right',
                      paddingRight: 10,
                      fontSize: 10,
                      color:
                        n === current.activeLine
                          ? accentColor
                          : p.textSecondary,
                      fontFamily: 'monospace',
                      flexShrink: 0,
                      userSelect: 'none',
                    }}
                  >
                    {n + 1}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: 'monospace',
                      padding: '4px 12px',
                      color:
                        n === current.activeLine ? p.onAccent : p.textSecondary,
                      whiteSpace: 'pre',
                    }}
                  >
                    {code}
                  </span>
                  {n === current.activeLine && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        marginRight: 12,
                        fontSize: 9,
                        color: accentColor,
                        background: `${accentColor}20`,
                        padding: '2px 6px',
                        borderRadius: 3,
                        fontFamily: 'monospace',
                      }}
                    >
                      ← executing
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              className='glass-floating'
              style={{ borderRadius: 12, padding: '13px 16px' }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: p.textSecondary,
                  marginBottom: 10,
                }}
              >
                Variables
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 6,
                }}
              >
                {Object.entries(current.vars || {})
                  .filter(([, v]) => v !== undefined)
                  .map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        background: p.codeBg,
                        borderRadius: 6,
                        padding: '7px 10px',
                        border: `1px solid ${p.border}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: p.textSecondary,
                          fontFamily: 'monospace',
                          marginBottom: 2,
                        }}
                      >
                        {k}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: accentColor,
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                        }}
                      >
                        {String(v)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div
              className='glass-floating'
              style={{ borderRadius: 12, padding: '13px 16px' }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: p.textSecondary,
                  marginBottom: 10,
                }}
              >
                Memory
              </div>
              {Object.entries(current.memory || {}).map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'baseline',
                    marginBottom: 5,
                    fontFamily: 'monospace',
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: p.purple,
                      width: 60,
                      flexShrink: 0,
                    }}
                  >
                    {k}
                  </span>
                  <span style={{ fontSize: 9, color: p.textSecondary }}>→</span>
                  <span
                    style={{
                      fontSize: 10,
                      color: p.textPrimary,
                      background: p.codeBg,
                      padding: '2px 8px',
                      borderRadius: 4,
                      wordBreak: 'break-all',
                    }}
                  >
                    {v}
                  </span>
                </div>
              ))}
            </div>

            <div
              className='glass-floating'
              style={{ borderRadius: 12, padding: '13px 16px' }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: p.textSecondary,
                  marginBottom: 10,
                }}
              >
                Call stack
              </div>
              {(current.callStack || []).map((line, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 10,
                    color: i === 0 ? accentColor : p.textSecondary,
                    padding: '3px 0',
                    borderLeft:
                      i === 0
                        ? `2px solid ${accentColor}`
                        : '2px solid transparent',
                    paddingLeft: 8,
                    marginBottom: 2,
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '40vh',
            gap: 12,
            opacity: 0.35,
          }}
        >
          <div style={{ fontSize: 42 }}>🧮</div>
          <div style={{ fontSize: 12 }}>
            Select a Greedy algorithm and click Generate
          </div>
        </div>
      )}
    </div>
  );
}
