import { createEventCollector } from "../../core/execution/events";

/**
 * N-Queens — place N queens on an N×N chessboard so that no two
 * queens attack each other (same row, column, or diagonal).
 *
 * Uses row-by-row backtracking: place one queen per row, trying
 * columns 0..N-1 in order. For each candidate column, check:
 *   - column conflicts (same column as any placed queen)
 *   - diagonal conflicts (|row_diff| === |col_diff|)
 *
 * Emits deterministic events via createEventCollector for visualization.
 *
 * Board cell values:
 *   '.' — empty
 *   'Q' — placed queen
 *   'x' — attacked (excluded by placed queens)
 *
 * @param {number} n – board size (≥ 1)
 * @returns {{ events: Array, solutions: number, n: number }}
 */
export function nQueens(n) {
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`n must be a positive integer, got ${n}`);
  }

  const collector = createEventCollector();
  const { emit } = collector;

  // Initialize empty board
  const board = createBoard(n);
  let solutionCount = 0;

  // Emit init event
  emit("init", {
    state: { board: deepCopyBoard(board), n },
    inputVars: { n: String(n) },
    log: `Initialize ${n}×${n} board`,
  });

  function solve(row) {
    if (row === n) {
      // All queens placed — solution found
      solutionCount++;
      emit("solution", {
        depth: row,
        solution: deepCopyBoard(board),
        state: { board: deepCopyBoard(board), n },
        highlightCells: getQueenPositions(board),
        vars: {
          row: "done",
          solution: String(solutionCount),
        },
        log: `Solution #${solutionCount} found!`,
      });
      return;
    }

    // Generate candidates: columns 0..N-1
    const candidates = Array.from({ length: n }, (_, c) => c);

    emit("enter", {
      depth: row + 1,
      candidates,
      state: { board: deepCopyBoard(board), n },
      label: `row=${row}`,
      vars: { row: String(row) },
      log: `Explore row ${row} — try columns 0..${n - 1}`,
    });

    for (const col of candidates) {
      // Check if placement is valid before choosing
      const { valid, reason, attackedCells } = checkPlacement(
        board,
        n,
        row,
        col,
      );

      if (valid) {
        // Emit choose — valid placement
        emit("choose", {
          depth: row + 1,
          candidate: col,
          candidates,
          state: { board: deepCopyBoard(board), n },
          highlightCells: [[row, col]],
          vars: {
            row: String(row),
            col: String(col),
          },
          log: `Choose col ${col} for row ${row} — safe ✓`,
        });

        // Place queen
        placeQueen(board, row, col);

        emit("constraint-check", {
          depth: row + 1,
          candidate: col,
          valid: true,
          state: { board: deepCopyBoard(board), n },
          highlightCells: [[row, col]],
          vars: {
            row: String(row),
            col: String(col),
          },
          log: `Place queen at (${row}, ${col})`,
        });

        // Recurse to next row
        solve(row + 1);

        // Remove queen (backtrack)
        removeQueen(board, row, col);

        emit("backtrack", {
          depth: row + 1,
          removed: col,
          candidates,
          state: { board: deepCopyBoard(board), n },
          removedCells: [[row, col]],
          vars: {
            row: String(row),
            removed_col: String(col),
          },
          log: `Remove queen from (${row}, ${col}) — backtrack`,
        });
      } else {
        // Emit choose — invalid placement attempt
        emit("choose", {
          depth: row + 1,
          candidate: col,
          candidates,
          state: { board: deepCopyBoard(board), n },
          highlightCells: attackedCells,
          vars: {
            row: String(row),
            col: String(col),
          },
          log: `Try col ${col} for row ${row} — conflicts`,
        });

        // Emit constraint-check — invalid
        emit("constraint-check", {
          depth: row + 1,
          candidate: col,
          valid: false,
          reason,
          state: { board: deepCopyBoard(board), n },
          highlightCells: attackedCells,
          removedCells: [[row, col]],
          vars: {
            row: String(row),
            col: String(col),
          },
          log: `(${row}, ${col}) blocked: ${reason}`,
        });
      }
    }
  }

  solve(0);

  emit("complete", {
    state: { board: createBoard(n), n },
    vars: {
      totalSolutions: String(solutionCount),
      n: String(n),
    },
    log: `Done — ${solutionCount} solution(s) for N=${n}`,
  });

  return { events: collector.events, solutions: solutionCount, n };
}

// ── Board helpers ────────────────────────────────────────────

function createBoard(n) {
  return Array.from({ length: n }, () => Array(n).fill("."));
}

function deepCopyBoard(board) {
  return board.map((row) => [...row]);
}

function placeQueen(board, row, col) {
  const n = board.length;
  board[row][col] = "Q";
  // Mark attacked cells
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (r === row && c === col) continue;
      if (r === row || c === col || Math.abs(r - row) === Math.abs(c - col)) {
        if (board[r][c] === ".") board[r][c] = "x";
      }
    }
  }
}

function removeQueen(board, row, col) {
  const n = board.length;
  board[row][col] = ".";
  // Recompute attacked cells from scratch
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (board[r][c] === "x") board[r][c] = ".";
    }
  }
  // Re-mark attacked cells for remaining queens
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (board[r][c] === "Q") {
        for (let rr = 0; rr < n; rr++) {
          for (let cc = 0; cc < n; cc++) {
            if (rr === r && cc === c) continue;
            if (rr === r || cc === c || Math.abs(rr - r) === Math.abs(cc - c)) {
              if (board[rr][cc] === ".") board[rr][cc] = "x";
            }
          }
        }
      }
    }
  }
}

function checkPlacement(board, n, row, col) {
  const attackedCells = [];
  const reasons = [];

  // Check column conflicts
  for (let r = 0; r < n; r++) {
    if (r !== row && board[r][col] === "Q") {
      reasons.push(`column ${col} (queen at row ${r})`);
      attackedCells.push([r, col]);
    }
  }

  // Check both diagonals
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (r === row && c === col) continue;
      if (board[r][c] === "Q" && Math.abs(r - row) === Math.abs(c - col)) {
        reasons.push(`diagonal (queen at (${r}, ${c}))`);
        attackedCells.push([r, c]);
      }
    }
  }

  return {
    valid: reasons.length === 0,
    reason: reasons.length > 0 ? reasons.join("; ") : null,
    attackedCells,
  };
}

function getQueenPositions(board) {
  const positions = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === "Q") positions.push([r, c]);
    }
  }
  return positions;
}
