import { useState } from 'react';
import { getAlgorithm, getWithDebug } from '../algorithms/registry';
import { projectDNCEvents } from '../algorithms/divideAndConquer/dncSteps';
import { validateKaratsubaInput, KARA_DEFAULT_MAX_DIGITS } from '../algorithms/divideAndConquer/karatsuba';
import { validateStrassenInput, STRASSEN_DEFAULT_MAX_N } from '../algorithms/divideAndConquer/strassen';
import { usePlayback } from '../hooks/usePlayback';
import { getPalette } from '../theme/tokens';
import DncDebugViewer from '../components/visualizer/DncDebugViewer';
import DNCTreeView from '../components/visualizer/DNCTreeView';

const DNC_ALGOS = getWithDebug('divideAndConquer');

export const MAX_POINTS = 64;

export function DNCDebuggerTab({ isDark }) {
  const p = getPalette(isDark ? 'dark' : 'light');

  const [algoId, setAlgoId] = useState(DNC_ALGOS[0].id);
  const [count, setCount] = useState(12);
  const [inputMode, setInputMode] = useState('default');
  const [customInput, setCustomInput] = useState('');
  const [karX, setKarX] = useState('1234');
  const [karY, setKarY] = useState('5678');
  const [strSize, setStrSize] = useState(2);
  const [strMode, setStrMode] = useState('default');
  const [strCustom, setStrCustom] = useState('');
  const [steps, setSteps] = useState([]);
  const [inputNotice, setInputNotice] = useState(null);

  const playback = usePlayback({
    length: steps.length,
    initialSpeed: 600,
  });

  const { index: step, playing } = playback;
  const descriptor = getAlgorithm(algoId);
  const isClosestPair = algoId === 'closest-pair-of-points';
  const isKaratsuba = algoId === 'karatsuba';
  const isStrassen = algoId === 'strassen';
  const accentColor = descriptor.color;
  const codeLines = descriptor.codeLines || [];
  const current = steps[step] || null;

  const dncSnapshot = current?.dnc
    ? {
        ...current.dnc,
        phase: current.dnc.phase,
        depth: current.dnc.depth,
        currentNodeId: current.dnc.currentNodeId,
        currentSubproblem: current.dnc.currentSubproblem,
        currentBounds: current.dnc.currentBounds,
        currentResult: current.dnc.currentResult,
        currentCompare: current.dnc.currentCompare,
        currentCombine: current.dnc.currentCombine,
        treeNodes: current.dnc.treeNodes,
        returnedResults: current.dnc.returnedResults,
        vars: current.vars,
        memory: current.memory,
        callStack: current.callStack,
        activeLine: current.activeLine,
        log: current.log,
        complete: current.complete,
      }
    : null;

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
        Divide & Conquer debugger
      </div>

      {/* CONTROLS ROW */}
      <div
        className='glass-floating'
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
            Divide & Conquer algorithms
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {DNC_ALGOS.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  setAlgoId(a.id);
                  setSteps([]);
                  setInputNotice(null);
                  playback.reset();
                }}
                style={{
                  padding: '5px 10px',
                  borderRadius: 5,
                  border: `1px solid ${
                    algoId === a.id ? a.color : p.border
                  }`,
                  background:
                    algoId === a.id ? `${a.color}18` : 'transparent',
                  color:
                    algoId === a.id ? a.color : p.textSecondary,
                  fontSize: 10,
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                }}
              >
                {a.tier ? `[${a.tier}] ` : ''}
                {a.name}
              </button>
            ))}
          </div>
        </div>

        {isKaratsuba && (
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: p.textSecondary,
                marginBottom: 6,
              }}
            >
              Operands (integers)
            </div>
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'flex-end',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: p.textSecondary,
                    marginBottom: 3,
                    fontFamily: 'monospace',
                  }}
                >
                  x
                </div>
                <input
                  value={karX}
                  onChange={(e) => setKarX(e.target.value)}
                  aria-label='Karatsuba x'
                  spellCheck={false}
                  style={{
                    width: 110,
                    background: p.codeBg,
                    border: `1px solid ${p.border}`,
                    borderRadius: 5,
                    color: p.textPrimary,
                    fontSize: 12,
                    fontFamily: 'monospace',
                    padding: '5px 8px',
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ fontSize: 13, color: p.textSecondary }}>×</div>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: p.textSecondary,
                    marginBottom: 3,
                    fontFamily: 'monospace',
                  }}
                >
                  y
                </div>
                <input
                  value={karY}
                  onChange={(e) => setKarY(e.target.value)}
                  aria-label='Karatsuba y'
                  spellCheck={false}
                  style={{
                    width: 110,
                    background: p.codeBg,
                    border: `1px solid ${p.border}`,
                    borderRadius: 5,
                    color: p.textPrimary,
                    fontSize: 12,
                    fontFamily: 'monospace',
                    padding: '5px 8px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
            <div
              style={{
                fontSize: 9,
                color: p.textSecondary,
                marginTop: 4,
                fontFamily: 'monospace',
              }}
            >
              max {KARA_DEFAULT_MAX_DIGITS} digits each · exact BigInt arithmetic
            </div>
          </div>
        )}

        {isStrassen && (
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: p.textSecondary,
                marginBottom: 6,
              }}
            >
              Matrices
            </div>
            <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
              <button
                onClick={() => setStrMode('default')}
                aria-pressed={strMode === 'default'}
                style={{
                  padding: '4px 9px',
                  borderRadius: 5,
                  border: `1px solid ${
                    strMode === 'default' ? accentColor : p.border
                  }`,
                  background:
                    strMode === 'default' ? `${accentColor}18` : 'transparent',
                  color:
                    strMode === 'default' ? accentColor : p.textSecondary,
                  fontSize: 10,
                  cursor: 'pointer',
                }}
              >
                Seeded random
              </button>
              <button
                onClick={() => setStrMode('custom')}
                aria-pressed={strMode === 'custom'}
                style={{
                  padding: '4px 9px',
                  borderRadius: 5,
                  border: `1px solid ${
                    strMode === 'custom' ? accentColor : p.border
                  }`,
                  background:
                    strMode === 'custom' ? `${accentColor}18` : 'transparent',
                  color:
                    strMode === 'custom' ? accentColor : p.textSecondary,
                  fontSize: 10,
                  cursor: 'pointer',
                }}
              >
                Custom JSON
              </button>
            </div>
            {strMode === 'custom' ? (
              <textarea
                value={strCustom}
                onChange={(e) => setStrCustom(e.target.value)}
                aria-label='Custom matrices JSON'
                placeholder='[[[1,2],[3,4]],[[5,6],[7,8]]]'
                rows={3}
                spellCheck={false}
                style={{
                  width: 220,
                  background: p.codeBg,
                  border: `1px solid ${p.border}`,
                  borderRadius: 5,
                  color: p.textPrimary,
                  fontSize: 10,
                  fontFamily: 'monospace',
                  padding: '5px 8px',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            ) : (
              <>
                <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
                  {[1, 2, 4, 8].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStrSize(s)}
                      aria-pressed={strSize === s}
                      style={{
                        padding: '4px 9px',
                        borderRadius: 5,
                        border: `1px solid ${
                          strSize === s ? accentColor : p.border
                        }`,
                        background:
                          strSize === s ? `${accentColor}18` : 'transparent',
                        color: strSize === s ? accentColor : p.textSecondary,
                        fontSize: 10,
                        cursor: 'pointer',
                        fontFamily: 'monospace',
                      }}
                    >
                      {s}×{s}
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: p.textSecondary,
                    fontFamily: 'monospace',
                  }}
                >
                  power-of-two only · no padding · max{' '}
                  {STRASSEN_DEFAULT_MAX_N}×{STRASSEN_DEFAULT_MAX_N}
                </div>
              </>
            )}
          </div>
        )}

        {isClosestPair && (
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: p.textSecondary,
                marginBottom: 6,
              }}
            >
              Input
            </div>
            <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
              <button
                onClick={() => setInputMode('default')}
                aria-pressed={inputMode === 'default'}
                style={{
                  padding: '4px 9px',
                  borderRadius: 5,
                  border: `1px solid ${
                    inputMode === 'default' ? accentColor : p.border
                  }`,
                  background:
                    inputMode === 'default' ? `${accentColor}18` : 'transparent',
                  color:
                    inputMode === 'default' ? accentColor : p.textSecondary,
                  fontSize: 10,
                  cursor: 'pointer',
                }}
              >
                Seeded random
              </button>
              <button
                onClick={() => setInputMode('custom')}
                aria-pressed={inputMode === 'custom'}
                style={{
                  padding: '4px 9px',
                  borderRadius: 5,
                  border: `1px solid ${
                    inputMode === 'custom' ? accentColor : p.border
                  }`,
                  background:
                    inputMode === 'custom' ? `${accentColor}18` : 'transparent',
                  color:
                    inputMode === 'custom' ? accentColor : p.textSecondary,
                  fontSize: 10,
                  cursor: 'pointer',
                }}
              >
                Custom JSON
              </button>
            </div>
            {inputMode === 'custom' ? (
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                aria-label='Custom points JSON'
                placeholder='[{"x":2,"y":3},{"x":12,"y":30},{"x":5,"y":1}]'
                rows={2}
                spellCheck={false}
                style={{
                  width: 220,
                  background: p.codeBg,
                  border: `1px solid ${p.border}`,
                  borderRadius: 5,
                  color: p.textPrimary,
                  fontSize: 10,
                  fontFamily: 'monospace',
                  padding: '5px 8px',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            ) : (
              <>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: p.textSecondary,
                    marginBottom: 2,
                  }}
                >
                  Point count: {count}
                </div>
                <input
                  type='range'
                  min={2}
                  max={MAX_POINTS}
                  value={count}
                  aria-label='Point count'
                  onChange={(e) => setCount(+e.target.value)}
                  style={{ accentColor: accentColor, width: 100 }}
                />
                <div
                  style={{
                    fontSize: 9,
                    color: p.textSecondary,
                    marginTop: 3,
                    fontFamily: 'monospace',
                  }}
                >
                  {count} points
                </div>
              </>
            )}
          </div>
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
            type='range'
            min={100}
            max={1000}
            aria-label='Playback speed'
            value={1100 - playback.speed}
            onChange={(e) => playback.setSpeed(1100 - +e.target.value)}
            style={{ accentColor: accentColor, width: 100 }}
          />
        </div>

        <div
          className='glass-thin'
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
            onClick={() => {
              // Regenerate
              const d = getAlgorithm(algoId);
              if (!d || typeof d.debug !== 'function') return;

              let notice = null;

              if (isKaratsuba) {
                const v = validateKaratsubaInput(
                  karX,
                  karY,
                  KARA_DEFAULT_MAX_DIGITS,
                );
                if (!v.valid) {
                  setInputNotice(v.reason);
                  setSteps([]);
                  playback.reset();
                  return;
                }
                const s = projectDNCEvents(d.debug(v.x, v.y));
                setInputNotice(null);
                setSteps(s);
                playback.reset();
                return;
              }

              if (isStrassen) {
                let a = null;
                let b = null;

                if (strMode === 'custom' && strCustom.trim()) {
                  try {
                    const parsed = JSON.parse(strCustom);
                    if (
                      !Array.isArray(parsed) ||
                      parsed.length !== 2 ||
                      !Array.isArray(parsed[0]) ||
                      !Array.isArray(parsed[1])
                    ) {
                      throw new Error('Expected [A, B]');
                    }
                    a = parsed[0];
                    b = parsed[1];
                  } catch {
                    notice =
                      'Invalid custom input. Supply JSON like [[[1,2],[3,4]],[[5,6],[7,8]]].';
                    a = null;
                    b = null;
                  }
                }

                if (!a || !b) {
                  const pair = generateStrassenPair(strSize, 7);
                  a = pair[0];
                  b = pair[1];
                }

                const v = validateStrassenInput(a, b);
                if (!v.valid) {
                  setInputNotice(v.reason);
                  setSteps([]);
                  playback.reset();
                  return;
                }
                const s = projectDNCEvents(d.debug(a, b));
                setInputNotice(notice);
                setSteps(s);
                playback.reset();
                return;
              }

              let pts = [];

              if (isClosestPair) {
                if (inputMode === 'custom' && customInput.trim()) {
                  try {
                    const parsed = JSON.parse(customInput);
                    if (!Array.isArray(parsed)) throw new Error('Not array');
                    pts = parsed
                      .filter((pt) => pt && typeof pt.x === 'number' && typeof pt.y === 'number')
                      .map((pt) => ({ x: Number(pt.x), y: Number(pt.y) }));
                    if (pts.length > MAX_POINTS) {
                      notice = `Custom input truncated to first ${MAX_POINTS} points.`;
                      pts = pts.slice(0, MAX_POINTS);
                    }
                    if (pts.length < 2) throw new Error('Too few');
                  } catch {
                    notice = 'Invalid custom input. Supply a JSON array of {x, y}.';
                    pts = [];
                  }
                }

                if (pts.length < 2) {
                  // Generate deterministic default handful for reproducibility
                  const seed = 42;
                  const rng = mulberry32(seed);
                  pts = [];
                  for (let i = 0; i < count; i++) {
                    pts.push({
                      x: Math.floor(rng() * 100),
                      y: Math.floor(rng() * 100),
                    });
                  }
                }
              }

              // Project the raw D&C event stream into debugger snapshots
              // (vars, memory, call stack, recursion tree, phase info).
              const s = projectDNCEvents(d.debug(pts));
              setInputNotice(notice);
              setSteps(s);
              playback.reset();
            }}
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
                style={{ padding: '6px 10px', fontSize: 13 }}
              >
                ◀
              </button>
              <button
                onClick={playback.next}
                aria-label='Next step'
                title='Next step'
                className='icon-btn'
                style={{ padding: '6px 10px', fontSize: 13 }}
              >
                ▶
              </button>
              <button
                onClick={playback.reset}
                aria-label='First step'
                title='First step'
                style={{ padding: '6px 10px', fontSize: 13 }}
              >
                ⏮
              </button>
              <button
                onClick={playback.goToEnd}
                aria-label='Last step'
                title='Last step'
                style={{ padding: '6px 10px', fontSize: 13 }}
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
            border: `1px solid ${
              isDark ? 'rgba(251,191,36,0.4)' : 'rgba(180,83,9,0.45)'
            }`,
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
            <span
              style={{
                color: accentColor,
                fontFamily: 'monospace',
              }}
            >
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
            style={{ width: '100%', accentColor: accentColor, marginTop: 4 }}
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
                line {current.activeLine + 1}
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
                        n === current.activeLine
                          ? p.onAccent
                          : p.textSecondary,
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
            <DncDebugViewer
              current={dncSnapshot}
              isDark={isDark}
              variant={
                isStrassen
                  ? 'strassen'
                  : isKaratsuba
                    ? 'karatsuba'
                    : 'closest-pair'
              }
            />

            <DNCTreeView
              nodes={current.dnc?.treeNodes || []}
              activeNodeId={current.dnc?.currentNodeId ?? null}
              isDark={isDark}
              compact
            />

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
                  .filter(([k, v]) => v !== undefined && k !== 'pts')
                  .map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        background: p.codeBg,
                        borderRadius: 6,
                        padding: '7px 10px',
                        border: `1px solid ${p.border}`,
                        overflow: 'hidden',
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
                          wordBreak: 'break-all',
                        }}
                      >
                        {formatVarValue(v)}
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
              {typeof current.memory === 'string' ? (
                <pre
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 10,
                    color: p.textPrimary,
                    background: p.codeBg,
                    padding: '8px 10px',
                    borderRadius: 6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    margin: 0,
                    maxHeight: 160,
                    overflow: 'auto',
                  }}
                >
                  {current.memory}
                </pre>
              ) : (
                Object.entries(current.memory || {}).map(([k, v]) => (
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
                      {String(v)}
                    </span>
                  </div>
                ))
              )}
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
          <div style={{ fontSize: 42 }}>🧬</div>
          <div style={{ fontSize: 12 }}>
            Select an algorithm and click Generate
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Format a variable value for display (arrays become compact strings).
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

/**
 * Deterministic square matrix pair for Strassen.
 *
 * Values are small integers (−5..9) from a seeded PRNG so the recursion tree
 * stays readable and the result stays exact in double precision.
 */
function generateStrassenPair(n, seed) {
  const rng = mulberry32(seed);
  const matrix = () =>
    Array.from({ length: n }, () =>
      Array.from({ length: n }, () => Math.floor(rng() * 15) - 5),
    );
  return [matrix(), matrix()];
}

/**
 * Tiny seeded PRNG (mulberry32) for deterministic default point sets.
 */
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
