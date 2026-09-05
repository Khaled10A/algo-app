import { useState } from "react";
import { getAlgorithm, getWithDebug } from "../algorithms/registry";
import {
  SUPPORTED_SIZES,
  getBoardConfig,
  toDisplaySymbol,
  getPuzzlePresets,
} from "../algorithms/backtracking/sudoku";
import { playVictory } from "../utils/audio";
import { usePlayback } from "../hooks/usePlayback";
import { getPalette } from "../theme/tokens";
import BacktrackTreeView from "../components/visualizer/BacktrackTreeView";
import {
  buildBacktrackTree,
  getSolutionPaths,
} from "../algorithms/backtracking/backtrackTree";

const BT_ALGOS = getWithDebug("backtracking");

const DEFAULTS = {
  "n-queens": { n: 4 },
  "subset-sum": { arr: "3,7,1,8,4", target: 11 },
  permutations: { arr: "1,2,3" },
  combinations: { arr: "1,2,3,4,5", k: 3 },
  sudoku: { boardSize: 9, puzzleKey: "easy" },
};

const LIMITS = {
  "n-queens": { maxN: 8 },
  "subset-sum": { maxLen: 12 },
  permutations: { maxLen: 8 },
  combinations: { maxLen: 12 },
};

export function BacktrackDebuggerTab({ isDark }) {
  const p = getPalette(isDark ? "dark" : "light");

  const [algoId, setAlgoId] = useState(BT_ALGOS[0]?.id || "");
  const [inputs, setInputs] = useState({ ...DEFAULTS["n-queens"] });
  const [steps, setSteps] = useState([]);
  const [notice, setNotice] = useState(null);

  const playback = usePlayback({
    length: steps.length,
    initialSpeed: 400,
    onFinish: playVictory,
  });
  const { index: step, playing } = playback;

  const descriptor = algoId ? getAlgorithm(algoId) : null;
  const current = steps[step] || null;
  const accentColor = descriptor?.color || "#94a3b8";
  const codeLines = descriptor?.codeLines || [];

  // Build tree from steps up to current step for progressive rendering
  const treeNodes = [];
  const treeActiveId = current?.nodeId ?? null;
  let treeSolutionPaths = [];

  if (steps.length > 0 && step >= 0) {
    const eventsForTree = stepsToEvents(steps, step + 1);
    const tree = buildBacktrackTree(eventsForTree);
    treeNodes.push(...tree.nodes);
    treeSolutionPaths = getSolutionPaths(tree.nodes);
  }

  function selectAlgo(id) {
    setAlgoId(id);
    setSteps([]);
    setInputs({ ...DEFAULTS[id] });
    setNotice(null);
    playback.reset();
  }

  function buildInput() {
    if (!descriptor) return [];
    const d = inputs;
    switch (algoId) {
      case "n-queens":
        return [Number(d.n) || 4];
      case "subset-sum": {
        const arr = String(d.arr || "")
          .split(",")
          .map((x) => Number(x.trim()))
          .filter((n) => !Number.isNaN(n));
        return [arr, Number(d.target) || 0];
      }
      case "permutations": {
        const arr = String(d.arr || "")
          .split(",")
          .map((x) => Number(x.trim()))
          .filter((n) => !Number.isNaN(n));
        return [arr];
      }
      case "combinations": {
        const arr = String(d.arr || "")
          .split(",")
          .map((x) => Number(x.trim()))
          .filter((n) => !Number.isNaN(n));
        return [arr, Number(d.k) || 0];
      }
      case "sudoku": {
        const boardSize = Number(d.boardSize) || 9;
        const presets = getPuzzlePresets(boardSize);
        const puzzleKey = d.puzzleKey || Object.keys(presets)[0];
        const puzzle = presets[puzzleKey];
        if (!puzzle) throw new Error(`Unknown puzzle: ${puzzleKey}`);
        return [puzzle];
      }
      default:
        return Object.values(d);
    }
  }
  function validateInput(id, input) {
    const lim = LIMITS[id];
    if (!lim) return;
    switch (id) {
      case "n-queens": {
        const n = input[0];
        if (n > lim.maxN)
          throw new Error(
            `N=${n} is too large for visualization (max ${lim.maxN}). Reduce N to keep the visualization responsive.`,
          );
        if (n < 1) throw new Error("N must be at least 1.");
        break;
      }
      case "subset-sum": {
        const [arr] = input;
        if (arr.length > lim.maxLen)
          throw new Error(
            `${arr.length} elements is too many for visualization (max ${lim.maxLen}). Reduce the array size.`,
          );
        break;
      }
      case "permutations": {
        const [arr] = input;
        if (arr.length > lim.maxLen)
          throw new Error(
            `${arr.length} elements is too many for visualization (max ${lim.maxLen}). Reduce the array size.`,
          );
        if (arr.length > 0 && factorial(arr.length) > 40320)
          throw new Error(
            `${arr.length}! = ${factorial(arr.length)} permutations is too many to visualize. Keep array length ≤ 8.`,
          );
        break;
      }
      case "combinations": {
        const [arr, k] = input;
        if (arr.length > lim.maxLen)
          throw new Error(
            `${arr.length} elements is too many for visualization (max ${lim.maxLen}). Reduce the array size.`,
          );
        if (k > arr.length)
          throw new Error(
            `k=${k} is greater than array length ${arr.length}. No combinations possible.`,
          );
        break;
      }
      case "sudoku": {
        const [puzzle] = input;
        const n = puzzle.length;
        if (n === 0 || !Array.isArray(puzzle))
          throw new Error("Puzzle must be a non-empty 2D array.");
        getBoardConfig(n); // throws if unsupported
        break;
      }
      default:
        break;
    }
  }

  function generate() {
    if (!descriptor?.debug) {
      setNotice({
        text: `${descriptor?.name || "Selected algorithm"} is not yet implemented — coming soon.`,
        kind: "info",
      });
      return;
    }
    try {
      playback.pause();
      const input = buildInput();
      validateInput(algoId, input);
      const s = descriptor.debug(...input);
      setSteps(s);
      playback.reset();
      setNotice(null);
    } catch (e) {
      setNotice({ text: e.message, kind: "error" });
    }
  }

  // ── Input panel per algorithm ──
  function renderInputPanel() {
    if (!descriptor) return null;
    const field = (label, key, placeholder) => (
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: p.textSecondary,
            marginBottom: 4,
          }}
        >
          {label}
        </div>
        <input
          value={inputs[key] ?? ""}
          onChange={(e) =>
            setInputs((prev) => ({ ...prev, [key]: e.target.value }))
          }
          aria-label={label}
          placeholder={placeholder}
          style={{
            background: p.codeBg,
            border: `1px solid ${p.border}`,
            borderRadius: 5,
            color: p.textPrimary,
            padding: "5px 8px",
            fontSize: 11,
            fontFamily: "monospace",
            width: 140,
            outline: "none",
          }}
        />
      </div>
    );

    switch (algoId) {
      case "n-queens":
        return (
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: p.textSecondary,
                marginBottom: 4,
              }}
            >
              N: {inputs.n}
            </div>
            <input
              type="range"
              min={1}
              max={8}
              value={inputs.n ?? 4}
              aria-label="Board size N"
              onChange={(e) =>
                setInputs((prev) => ({ ...prev, n: Number(e.target.value) }))
              }
              style={{ accentColor, width: 120 }}
            />
          </div>
        );
      case "subset-sum":
        return (
          <>
            {field("Array", "arr", "3,7,1,8,4")}
            {field("Target", "target", "11")}
          </>
        );
      case "permutations":
        return (
          <>
            {field("Array", "arr", "1,2,3")}
          </>
        );
      case "combinations":
        return (
          <>
            {field("Array", "arr", "1,2,3,4,5")}
            {field("k (size)", "k", "3")}
          </>
        );
      case "sudoku": {
        const boardSize = Number(inputs.boardSize) || 9;
        const presets = getPuzzlePresets(boardSize);
        const presetKeys = Object.keys(presets);
        return (
          <>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: p.textSecondary,
                  marginBottom: 4,
                }}
              >
                Board Size
              </div>
              <select
                value={boardSize}
                onChange={(e) => {
                  const newSize = Number(e.target.value);
                  const newPresets = getPuzzlePresets(newSize);
                  const firstKey = Object.keys(newPresets)[0];
                  setInputs((prev) => ({
                    ...prev,
                    boardSize: newSize,
                    puzzleKey: firstKey,
                  }));
                }}
                aria-label="Sudoku board size"
                style={{
                  background: p.codeBg,
                  border: `1px solid ${p.border}`,
                  borderRadius: 5,
                  color: p.textPrimary,
                  padding: "5px 8px",
                  fontSize: 11,
                  fontFamily: "monospace",
                  width: 140,
                  outline: "none",
                }}
              >
                {SUPPORTED_SIZES.map((s) => (
                  <option key={s.n} value={s.n}>
                    {s.label} ({s.boxSize}×{s.boxSize} boxes)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: p.textSecondary,
                  marginBottom: 4,
                }}
              >
                Puzzle
              </div>
              <select
                value={inputs.puzzleKey ?? presetKeys[0]}
                onChange={(e) =>
                  setInputs((prev) => ({
                    ...prev,
                    puzzleKey: e.target.value,
                  }))
                }
                aria-label="Sudoku puzzle"
                style={{
                  background: p.codeBg,
                  border: `1px solid ${p.border}`,
                  borderRadius: 5,
                  color: p.textPrimary,
                  padding: "5px 8px",
                  fontSize: 11,
                  fontFamily: "monospace",
                  width: 140,
                  outline: "none",
                }}
              >
                {presetKeys.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>
          </>
        );
      }
      default:
        return (
          <div
            style={{
              fontSize: 11,
              color: p.textSecondary,
              fontFamily: "monospace",
            }}
          >
            No configurable input
          </div>
        );
    }
  }

  // ── Chessboard visualization for N-Queens ──
  function renderBoard() {
    if (!current?.state?.board) return null;
    const board = current.state.board;
    const n = board.length;
    const highlightSet = new Set(
      (current.highlightCells || []).map(([r, c]) => `${r},${c}`),
    );
    const removedSet = new Set(
      (current.removedCells || []).map(([r, c]) => `${r},${c}`),
    );

    const cellSize = Math.min(48, Math.floor(360 / n));

    return (
      <div
        className="surface-card"
        style={{ borderRadius: 12, padding: "12px 14px" }}
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
          <span>
            Chessboard ({n}×{n})
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 400,
              color: accentColor,
              fontFamily: "monospace",
            }}
          >
            Queens: {board.flat().filter((c) => c === "Q").length} / {n}
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              borderCollapse: "collapse",
              margin: "0 auto",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    width: cellSize,
                    height: cellSize,
                    border: "none",
                  }}
                />
                {Array.from({ length: n }, (_, c) => (
                  <th
                    key={c}
                    style={{
                      width: cellSize,
                      height: cellSize / 2,
                      fontSize: 9,
                      color: p.textMuted,
                      fontFamily: "monospace",
                      textAlign: "center",
                      borderBottom: `1px solid ${p.border}`,
                    }}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {board.map((row, r) => (
                <tr key={r}>
                  <td
                    style={{
                      width: cellSize / 2,
                      fontSize: 9,
                      color: p.textMuted,
                      fontFamily: "monospace",
                      textAlign: "right",
                      paddingRight: 4,
                      borderRight: `1px solid ${p.border}`,
                    }}
                  >
                    {r}
                  </td>
                  {row.map((cell, c) => {
                    const isDark2 = (r + c) % 2 === 1;
                    const key = `${r},${c}`;
                    const isHighlighted = highlightSet.has(key);
                    const isRemoved = removedSet.has(key);
                    const isQueen = cell === "Q";
                    const isAttacked = cell === "x";

                    let bg = isDark2 ? p.codeBg : "transparent";
                    if (isQueen) bg = `${accentColor}30`;
                    if (isAttacked) bg = "rgba(255, 59, 48, 0.08)";
                    if (isHighlighted && isQueen) bg = `${accentColor}50`;
                    if (isHighlighted && !isQueen)
                      bg = "rgba(255, 159, 10, 0.25)";
                    if (isRemoved) bg = "rgba(255, 59, 48, 0.20)";

                    let fg = p.textSecondary;
                    if (isQueen) fg = accentColor;
                    if (isAttacked) fg = `${p.red}88`;
                    if (isHighlighted) fg = p.accentText;

                    let border = `1px solid ${p.border}`;
                    if (isHighlighted) border = `2px solid ${accentColor}`;
                    if (isRemoved) border = `2px solid ${p.red}`;

                    return (
                      <td
                        key={c}
                        style={{
                          width: cellSize,
                          height: cellSize,
                          textAlign: "center",
                          fontSize: isQueen ? 18 : 11,
                          fontFamily: "monospace",
                          fontWeight: isQueen ? 700 : 400,
                          color: fg,
                          background: bg,
                          border,
                          transition: "all 0.15s",
                        }}
                        title={
                          isQueen
                            ? `Queen at (${r}, ${c})`
                            : isAttacked
                              ? `Attacked at (${r}, ${c})`
                              : `Empty at (${r}, ${c})`
                        }
                      >
                        {isQueen ? "♕" : isAttacked ? "×" : ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 8,
            flexWrap: "wrap",
          }}
        >
          {[
            [accentColor, "Queen"],
            ["rgba(255, 59, 48, 0.08)", "Attacked"],
            [`${accentColor}50`, "Highlighted"],
            ["rgba(255, 59, 48, 0.20)", "Removed"],
          ].map(([color, label]) => (
            <div
              key={label}
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: color,
                  border: `1px solid ${p.border}`,
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

  // ── Array visualization for Subset Sum ──
  function renderArrayViz() {
    if (!current?.state?.arr) return null;
    const { arr, index, subset, sum, target } = current.state;
    const subsetSet = new Set(subset || []);

    return (
      <div
        className="surface-card"
        style={{ borderRadius: 12, padding: "12px 14px" }}
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
          <span>Array</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 400,
              fontFamily: "monospace",
            }}
          >
            <span style={{ color: accentColor }}>sum={String(sum ?? 0)}</span> /{" "}
            <span style={{ color: p.orange }}>target={String(target)}</span>
          </span>
        </div>

        {/* Input array */}
        <div
          style={{
            display: "flex",
            gap: 4,
            flexWrap: "wrap",
            marginBottom: 10,
          }}
        >
          {arr.map((val, i) => {
            const isCurrent = i === (index ?? -1);
            const inSubset = subsetSet.has(val) && i < (subset?.length || 0);

            let bg = p.codeBg;
            if (isCurrent) bg = `${accentColor}30`;
            if (inSubset) bg = "rgba(48, 209, 88, 0.15)";

            let border = `1px solid ${p.border}`;
            if (isCurrent) border = `2px solid ${accentColor}`;
            if (inSubset) border = `1px solid ${p.green}`;

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: p.textMuted,
                    fontFamily: "monospace",
                  }}
                >
                  [{i}]
                </div>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: bg,
                    border,
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: "monospace",
                    fontWeight: isCurrent ? 700 : 400,
                    color: inSubset
                      ? p.green
                      : isCurrent
                        ? accentColor
                        : p.textPrimary,
                    transition: "all 0.15s",
                  }}
                >
                  {val}
                </div>
                {inSubset && (
                  <div
                    style={{
                      fontSize: 8,
                      color: p.green,
                      fontFamily: "monospace",
                      fontWeight: 600,
                    }}
                  >
                    ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Current subset */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: p.textMuted,
              fontFamily: "monospace",
            }}
          >
            subset:
          </span>
          {!subset || subset.length === 0 ? (
            <span
              style={{
                fontSize: 10,
                color: p.textMuted,
                fontFamily: "monospace",
                fontStyle: "italic",
              }}
            >
              empty
            </span>
          ) : (
            subset.map((val, i) => (
              <div
                key={i}
                style={{
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: "rgba(48, 209, 88, 0.12)",
                  border: `1px solid ${p.green}40`,
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: p.green,
                }}
              >
                {val}
              </div>
            ))
          )}
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
            [`${accentColor}30`, accentColor, "Current"],
            ["rgba(48, 209, 88, 0.15)", p.green, "In subset"],
          ].map(([bg, _fg, label]) => (
            <div
              key={label}
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: bg,
                  border: `1px solid ${p.border}`,
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

  // ── Sudoku board visualization (dynamic N×N) ──
  function renderSudokuBoard() {
    if (!current?.state?.board || algoId !== "sudoku") return null;
    const board = current.state.board;
    const n = board.length;
    const config = getBoardConfig(n);
    const { boxSize } = config;
    const { row: curRow, col: curCol } = current.state;
    const highlightSet = new Set(
      (current.highlightCells || []).map(([r, c]) => `${r},${c}`),
    );
    const removedSet = new Set(
      (current.removedCells || []).map(([r, c]) => `${r},${c}`),
    );

    // Build the initial puzzle to identify given cells
    const boardSize = Number(inputs.boardSize) || n;
    const presets = getPuzzlePresets(boardSize);
    const puzzleKey = inputs.puzzleKey || Object.keys(presets)[0];
    const initialBoard = presets[puzzleKey] || presets[Object.keys(presets)[0]];

    // Dynamic cell size based on board dimension
    const cellSize = n <= 4 ? 44 : n <= 9 ? 38 : 26;
    const fontSize = n <= 4 ? 18 : n <= 9 ? 16 : 12;
    const givenFontSize = n <= 4 ? 20 : n <= 9 ? 18 : 13;

    // Dynamic thick border based on box size
    const thickBorder = (r, c) => {
      const styles = {};
      if (c % boxSize === 0) styles.borderLeft = `2px solid ${p.border}`;
      if (c === n - 1) styles.borderRight = `2px solid ${p.border}`;
      if (r % boxSize === 0) styles.borderTop = `2px solid ${p.border}`;
      if (r === n - 1) styles.borderBottom = `2px solid ${p.border}`;
      return styles;
    };

    return (
      <div
        className="surface-card"
        style={{ borderRadius: 12, padding: "12px 14px" }}
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
          <span>
            Sudoku ({n}×{n})
          </span>
          {current.vars?.symbol && (
            <span
              style={{
                fontSize: 10,
                fontFamily: "monospace",
                color: accentColor,
              }}
            >
              depth={current.vars.depth ?? "?"}
            </span>
          )}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              borderCollapse: "collapse",
              margin: "0 auto",
              border: `2px solid ${p.border}`,
            }}
          >
            <tbody>
              {board.map((boardRow, r) => (
                <tr key={r}>
                  {boardRow.map((cell, c) => {
                    const key = `${r},${c}`;
                    const isGiven =
                      initialBoard && initialBoard[r] && initialBoard[r][c] !== 0;
                    const isCurrent = r === curRow && c === curCol;
                    const isHighlighted = highlightSet.has(key);
                    const isRemoved = removedSet.has(key);
                    const isPlaced = cell !== 0 && !isGiven;
                    const thick = thickBorder(r, c);

                    let bg = "transparent";
                    if (isGiven) bg = `${p.border}40`;
                    if (isPlaced) bg = `${accentColor}12`;
                    if (isCurrent) bg = `${accentColor}30`;
                    if (isRemoved) bg = "rgba(255, 59, 48, 0.15)";
                    if (isHighlighted && !isRemoved) bg = `${accentColor}40`;

                    let fg = p.textSecondary;
                    if (isGiven) fg = p.textPrimary;
                    if (isPlaced) fg = accentColor;
                    if (isCurrent) fg = accentColor;
                    if (isRemoved) fg = p.red;

                    let border = `1px solid ${p.border}`;
                    if (isCurrent) border = `2px solid ${accentColor}`;
                    if (isRemoved) border = `2px solid ${p.red}`;

                    const displayVal =
                      cell !== 0 ? toDisplaySymbol(cell, config) : "";

                    return (
                      <td
                        key={c}
                        style={{
                          width: cellSize,
                          height: cellSize,
                          textAlign: "center",
                          fontSize: cell !== 0
                            ? isGiven
                              ? givenFontSize
                              : fontSize
                            : 11,
                          fontFamily: "monospace",
                          fontWeight: isGiven ? 700 : isPlaced ? 600 : 400,
                          color: fg,
                          background: bg,
                          border,
                          ...thick,
                          transition: "all 0.15s",
                        }}
                        title={`(${r},${c}): ${cell === 0 ? "empty" : displayVal}${isGiven ? " (given)" : ""}`}
                      >
                        {displayVal}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 8,
            flexWrap: "wrap",
          }}
        >
          {[
            [`${p.border}40`, p.textPrimary, "Given"],
            [`${accentColor}12`, accentColor, "Placed"],
            [`${accentColor}30`, accentColor, "Current"],
            ["rgba(255, 59, 48, 0.15)", p.red, "Removed"],
          ].map(([bg, _fg, label]) => (
            <div
              key={label}
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: bg,
                  border: `1px solid ${p.border}`,
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

  // ── Styles ──
  const algoBtnStyle = (a) => ({
    padding: "5px 10px",
    borderRadius: 5,
    border: `1px solid ${algoId === a.id ? a.color : p.border}`,
    background: algoId === a.id ? `${a.color}18` : "transparent",
    color: algoId === a.id ? a.color : p.textSecondary,
    fontSize: 10,
    cursor: "pointer",
    fontFamily: "monospace",
  });

  return (
    <div style={{ color: p.textPrimary }}>
      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: p.purple,
          marginBottom: 14,
        }}
      >
        Backtracking Debugger
      </div>

      {/* CONTROLS */}
      <div
        className="glass-floating"
        style={{
          borderRadius: 14,
          padding: "14px 18px",
          marginBottom: 14,
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "flex-start",
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
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {BT_ALGOS.length > 0 ? (
              BT_ALGOS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => selectAlgo(a.id)}
                  style={algoBtnStyle(a)}
                >
                  {a.name}
                </button>
              ))
            ) : (
              <span
                style={{
                  fontSize: 11,
                  color: p.textSecondary,
                  fontStyle: "italic",
                }}
              >
                No algorithms registered yet
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {renderInputPanel()}
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
            Speed:{" "}
            {playback.speed < 300
              ? "Fast"
              : playback.speed < 700
                ? "Medium"
                : "Slow"}
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
          style={{
            display: "flex",
            gap: 6,
            marginLeft: "auto",
            alignItems: "center",
          }}
        >
          <button
            onClick={generate}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 90%, white), ${accentColor})`,
              color: "#fff",
              fontSize: 12,
              cursor: "pointer",
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
                aria-label={playing ? "Pause" : "Play"}
                title={playing ? "Pause" : "Play"}
                style={{
                  padding: "7px 13px",
                  borderRadius: 8,
                  border: "none",
                  background: playing
                    ? "rgba(255, 59, 48, 0.12)"
                    : "rgba(48, 209, 88, 0.14)",
                  color: playing ? p.red : p.green,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {playing ? "⏸" : "▶"}
              </button>
              <button
                onClick={playback.prev}
                aria-label="Previous step"
                title="Previous step"
                className="icon-btn"
                style={{ padding: "6px 10px", fontSize: 13 }}
              >
                ◀
              </button>
              <button
                onClick={playback.next}
                aria-label="Next step"
                title="Next step"
                className="icon-btn"
                style={{ padding: "6px 10px", fontSize: 13 }}
              >
                ▶
              </button>
              <button
                onClick={playback.reset}
                aria-label="First step"
                title="First step"
                style={{ padding: "6px 10px", fontSize: 13 }}
              >
                ⏮
              </button>
              <button
                onClick={playback.goToEnd}
                aria-label="Last step"
                title="Last step"
                style={{ padding: "6px 10px", fontSize: 13 }}
              >
                ⏭
              </button>
            </>
          )}
        </div>
      </div>

      {/* NOTICE */}
      {notice && (
        <div
          role={notice.kind === "error" ? "alert" : "status"}
          className="popover-in"
          style={{
            marginBottom: 12,
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 11,
            fontFamily: "monospace",
            lineHeight: 1.5,
            background:
              notice.kind === "error"
                ? "rgba(255, 59, 48, 0.09)"
                : "rgba(48, 209, 88, 0.09)",
            boxShadow: `inset 0 0 0 1px ${
              notice.kind === "error" ? p.red : p.green
            }55`,
            color: notice.kind === "error" ? p.red : p.green,
          }}
        >
          {notice.kind === "info" ? "ℹ" : "⚠"} {notice.text}
        </div>
      )}

      {/* PROGRESS */}
      {steps.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 4,
              fontSize: 10,
            }}
          >
            <span style={{ color: accentColor, fontFamily: "monospace" }}>
              Step {step + 1} / {steps.length}
            </span>
            {current?.log && (
              <span
                style={{
                  color: p.textSecondary,
                  fontFamily: "monospace",
                  fontSize: 10,
                  background: p.codeBg,
                  padding: "2px 10px",
                  borderRadius: 4,
                }}
              >
                → {current.log}
              </span>
            )}
          </div>
          <div
            style={{
              background: "rgba(127,127,127,0.30)",
              borderRadius: 4,
              height: 4,
            }}
          >
            <div
              style={{
                width: `${((step + 1) / steps.length) * 100}%`,
                height: "100%",
                background: accentColor,
                borderRadius: 4,
                transition: "width 0.1s",
              }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={steps.length - 1}
            value={step}
            aria-label="Step position"
            onChange={(e) => playback.setStep(+e.target.value)}
            style={{ width: "100%", accentColor, marginTop: 4 }}
          />
        </div>
      )}

      {/* MAIN CONTENT */}
      {steps.length > 0 && current ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: 12,
            alignItems: "start",
          }}
        >
          {/* LEFT: Board/Array + Tree + Solutions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {renderBoard()}
            {renderSudokuBoard()}
            {renderArrayViz()}

            <BacktrackTreeView
              nodes={treeNodes}
              activeNodeId={treeActiveId}
              solutionPaths={treeSolutionPaths}
              isDark={isDark}
              compact={treeNodes.length > 40}
            />

            {/* Solutions panel */}
            {current.solutions && current.solutions.length > 0 && (
              <div
                className="glass-floating"
                style={{ borderRadius: 12, padding: "13px 16px" }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: p.textSecondary,
                    marginBottom: 10,
                  }}
                >
                  Solutions ({current.solutions.length})
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {current.solutions.slice(0, 10).map((sol, i) => (
                    <div
                      key={i}
                      style={{
                        background:
                          i === current.solutionIndex
                            ? `${p.green}15`
                            : p.codeBg,
                        border: `1px solid ${
                          i === current.solutionIndex ? p.green : p.border
                        }`,
                        borderRadius: 6,
                        padding: "6px 10px",
                        fontSize: 11,
                        fontFamily: "monospace",
                        color:
                          i === current.solutionIndex
                            ? p.green
                            : p.textSecondary,
                      }}
                    >
                      #{i + 1}:{" "}
                      {Array.isArray(sol)
                        ? algoId === "subset-sum"
                          ? `[${sol.join(", ")}]  = ${sol.reduce((a, b) => a + b, 0)}`
                          : `[${sol.map((row) => `[${row.join(", ")}]`).join(", ")}]`
                        : String(sol)}
                    </div>
                  ))}
                  {current.solutions.length > 10 && (
                    <div
                      style={{
                        fontSize: 10,
                        color: p.textMuted,
                        fontFamily: "monospace",
                        textAlign: "center",
                      }}
                    >
                      ... and {current.solutions.length - 10} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Code + Variables + Memory */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Phase + Call Stack indicator */}
            <div
              className="glass-floating"
              style={{ borderRadius: 12, padding: "10px 14px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color:
                      current.phase === "complete"
                        ? p.green
                        : current.phase === "backtrack"
                          ? p.orange
                          : accentColor,
                    fontFamily: "monospace",
                    background:
                      current.phase === "complete"
                        ? "rgba(48,209,88,0.12)"
                        : current.phase === "backtrack"
                          ? "rgba(255,159,10,0.12)"
                          : `${accentColor}15`,
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  {current.phase === "complete"
                    ? "✓ COMPLETE"
                    : current.phase === "backtrack"
                      ? "↩ BACKTRACK"
                      : "● EXPLORE"}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    color: p.textMuted,
                    fontFamily: "monospace",
                  }}
                >
                  depth {current.depth ?? 0}
                </span>
                {current.explored != null && (
                  <span
                    style={{
                      fontSize: 9,
                      color: p.textMuted,
                      fontFamily: "monospace",
                      marginLeft: "auto",
                    }}
                  >
                    explored: {current.explored}
                  </span>
                )}
              </div>
              {/* Call Stack */}
              {current.callStack && current.callStack.length > 0 && (
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 9,
                    color: p.textSecondary,
                    lineHeight: 1.6,
                    whiteSpace: "pre",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxHeight: 60,
                    overflowY: "auto",
                  }}
                >
                  {current.callStack.map((frame, i) => (
                    <div
                      key={i}
                      style={{
                        color:
                          i === current.callStack.length - 1
                            ? accentColor
                            : p.textMuted,
                        fontWeight:
                          i === current.callStack.length - 1 ? 600 : 400,
                      }}
                    >
                      {frame}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Code view */}
            <div
              className="editor-surface"
              style={{ borderRadius: 12, overflow: "hidden" }}
            >
              <div
                style={{
                  padding: "9px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: `1px solid ${p.border}`,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: accentColor,
                    fontFamily: "monospace",
                  }}
                >
                  {(descriptor?.name || "algorithm")
                    .replace(/ /g, "_")
                    .toLowerCase()}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    color: p.textSecondary,
                    fontFamily: "monospace",
                  }}
                >
                  line {(current.activeLine ?? 0) + 1}
                </span>
              </div>
              <div style={{ padding: "10px 0" }}>
                {codeLines.map(({ n, code }) => (
                  <div
                    key={n}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0,
                      background:
                        n === current.activeLine
                          ? `${accentColor}18`
                          : "transparent",
                      borderLeft:
                        n === current.activeLine
                          ? `3px solid ${accentColor}`
                          : "3px solid transparent",
                      transition: "all 0.15s",
                    }}
                  >
                    <span
                      style={{
                        width: 32,
                        textAlign: "right",
                        paddingRight: 10,
                        fontSize: 10,
                        color:
                          n === current.activeLine
                            ? accentColor
                            : p.textSecondary,
                        fontFamily: "monospace",
                        flexShrink: 0,
                        userSelect: "none",
                      }}
                    >
                      {n + 1}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: "monospace",
                        padding: "4px 12px",
                        color:
                          n === current.activeLine
                            ? p.onAccent
                            : p.textSecondary,
                        whiteSpace: "pre",
                      }}
                    >
                      {code}
                    </span>
                    {n === current.activeLine && (
                      <span
                        style={{
                          marginLeft: "auto",
                          marginRight: 12,
                          fontSize: 9,
                          color: accentColor,
                          background: `${accentColor}20`,
                          padding: "2px 6px",
                          borderRadius: 3,
                          fontFamily: "monospace",
                        }}
                      >
                        ← executing
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Variables */}
            <div
              className="glass-floating"
              style={{ borderRadius: 12, padding: "13px 16px" }}
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
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
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
                        padding: "7px 10px",
                        border: `1px solid ${p.border}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: p.textSecondary,
                          fontFamily: "monospace",
                          marginBottom: 2,
                        }}
                      >
                        {k}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: accentColor,
                          fontFamily: "monospace",
                          fontWeight: "bold",
                        }}
                      >
                        {String(v)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Memory */}
            <div
              className="glass-floating"
              style={{ borderRadius: 12, padding: "13px 16px" }}
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
                    display: "flex",
                    gap: 8,
                    alignItems: "baseline",
                    marginBottom: 5,
                    fontFamily: "monospace",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: p.purple,
                      width: 70,
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
                      padding: "2px 8px",
                      borderRadius: 4,
                      wordBreak: "break-all",
                      whiteSpace: "pre-wrap",
                      maxHeight: 120,
                      overflow: "auto",
                    }}
                  >
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "40vh",
            gap: 12,
            opacity: 0.35,
          }}
        >
          <div style={{ fontSize: 42 }}>♛</div>
          <div style={{ fontSize: 12 }}>
            {BT_ALGOS.length > 0
              ? "Select a backtracking algorithm and click Generate"
              : "Backtracking algorithms coming soon"}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──

function factorial(n) {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

/**
 * Convert step snapshots back to pseudo-events for tree construction.
 */
function stepsToEvents(steps, count) {
  const events = [];
  const limit = Math.min(count, steps.length);

  for (let i = 0; i < limit; i++) {
    const s = steps[i];
    if (i === 0) {
      events.push({ type: "init", state: s.state, log: s.log });
    } else if (s.chosen != null && s.valid == null) {
      events.push({
        type: "choose",
        depth: s.depth,
        candidate: s.chosen,
        state: s.state,
        log: s.log,
      });
    } else if (s.valid != null) {
      events.push({
        type: "constraint-check",
        depth: s.depth,
        candidate: s.chosen,
        valid: s.valid,
        state: s.state,
        log: s.log,
      });
    } else if (s.phase === "backtrack" && s.removed != null) {
      events.push({
        type: "backtrack",
        depth: s.depth,
        removed: s.removed,
        state: s.state,
        log: s.log,
      });
    } else if (s.phase === "backtrack" && s.pruneReason) {
      events.push({
        type: "prune",
        depth: s.depth,
        reason: s.pruneReason,
        state: s.state,
        log: s.log,
      });
    } else if (s.currentSolution != null) {
      events.push({
        type: "solution",
        depth: s.depth,
        solution: s.currentSolution,
        state: s.state,
        log: s.log,
      });
    } else if (s.complete) {
      events.push({ type: "complete", state: s.state, log: s.log });
    } else {
      events.push({
        type: "enter",
        depth: s.depth,
        state: s.state,
        log: s.log,
        candidates: s.candidates,
      });
    }
  }
  return events;
}
