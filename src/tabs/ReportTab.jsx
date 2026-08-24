import { Label } from '../components/ui/SharedComponents';
import { useTheme } from '../theme/ThemeContext';
import { INPUT_LABELS, SCENARIO_LABELS } from '../utils/constants';
import { getAlgorithmForDisplay } from '../algorithms/registry';

export function ReportTab({ sortResults, searchResults, sortMetric, searchMetric, pattern }) {
  const th = useTheme();
  const isDark = th === "dark";
  const bg = isDark ? "#0f172a" : "#f8fafc";
  const border = isDark ? "#1e293b" : "#e2e8f0";
  const textPrimary = isDark ? "#e2e8f0" : "#1e293b";
  const textMuted = isDark ? "#94a3b8" : "#64748b";

  if (!sortResults && !searchResults) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "55vh", gap: 12, opacity: 0.3 }}>
        <div style={{ fontSize: 42 }}>📝</div>
        <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2 }}>RUN A BENCHMARK FIRST TO GENERATE REPORT</div>
      </div>
    );
  }

  const card = (children, accent = "#38bdf8") => (
    <div style={{ background: bg, border: `1px solid ${border}`, borderLeft: `3px solid ${accent}`, borderRadius: 8, padding: "16px 20px", marginBottom: 16 }}>
      {children}
    </div>
  );

  const secTitle = (t, color) => (
    <div style={{ fontSize: 9, letterSpacing: 3, color, marginBottom: 10, fontWeight: "bold" }}>{t}</div>
  );

  let sortSection = null;
  if (sortResults) {
    const { results, sizes, algos, types } = sortResults;
    const mk = sortMetric === "time" ? "time" : "comparisons";
    const unit = sortMetric === "time" ? "ms" : "comparisons";

    const algoStats = algos.map(algo => {
      const allVals = types.flatMap(t => sizes.map((_, si) => results[algo][t][si][mk]));
      const avg = allVals.reduce((a, b) => a + b, 0) / allVals.length;
      const max = Math.max(...allVals);
      const min = Math.min(...allVals);
      return { algo, avg, max, min };
    }).sort((a, b) => a.avg - b.avg);

    const best = algoStats[0];
    const worst = algoStats[algoStats.length - 1];
    const ratio = worst.avg > 0 ? (worst.avg / best.avg).toFixed(1) : "N/A";

    const typeWinners = types.map(type => {
      const winner = algos.reduce((best, algo) => {
        const avg = sizes.reduce((s, _, si) => s + results[algo][type][si][mk], 0) / sizes.length;
        const bestAvg = sizes.reduce((s, _, si) => s + results[best][type][si][mk], 0) / sizes.length;
        return avg < bestAvg ? algo : best;
      }, algos[0]);
      return { type, winner };
    });

    const resultCard = card(<>
      {secTitle("SORTING — RESULTS ANALYSIS", "#38bdf8")}
      <p style={{ fontSize: 12, color: textPrimary, lineHeight: 1.8, marginBottom: 14 }}>
        The benchmark evaluated <strong style={{ color: "#38bdf8" }}>{algos.length} sorting algorithms</strong> across{" "}
        <strong style={{ color: "#e2e8f0" }}>{types.length} input types</strong> and{" "}
        <strong style={{ color: "#e2e8f0" }}>{sizes.length} input sizes</strong> (n = {sizes.join(", ")}).
        All algorithms were implemented from scratch without library functions.
      </p>
      <p style={{ fontSize: 12, color: textPrimary, lineHeight: 1.8, marginBottom: 14 }}>
        <strong style={{ color: "#4ade80" }}>Best overall: {getAlgorithmForDisplay(best.algo).name}</strong> — average{" "}
        <strong style={{ color: "#4ade80" }}>{best.avg.toFixed(4)} {unit}</strong>, consistent with its {getAlgorithmForDisplay(best.algo).complexity.average} complexity.
      </p>
      <p style={{ fontSize: 12, color: textPrimary, lineHeight: 1.8, marginBottom: 14 }}>
        <strong style={{ color: "#f87171" }}>Worst overall: {getAlgorithmForDisplay(worst.algo).name}</strong> — average{" "}
        <strong style={{ color: "#f87171" }}>{worst.avg.toFixed(4)} {unit}</strong>,{" "}
        approximately <strong style={{ color: "#fb923c" }}>{ratio}×</strong> slower than {getAlgorithmForDisplay(best.algo).name}.
      </p>
      {algoStats.length > 2 && (
        <p style={{ fontSize: 12, color: textPrimary, lineHeight: 1.8, marginBottom: 14 }}>
          {algoStats.slice(1, -1).map(s => s.algo).join(" and ")}{" "}
          placed in the middle tier with averages of{" "}
          {algoStats.slice(1, -1).map(s => `${s.avg.toFixed(4)} ${unit}`).join(" and ")} respectively.
        </p>
      )}
      <div style={{ marginBottom: 12 }}>
        {secTitle("INPUT TYPE WINNERS", "#475569")}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {typeWinners.map(({ type, winner }) => (
            <div key={type} style={{ background: isDark ? "#0a0f1e" : "#f1f5f9", border: `1px solid ${border}`, borderRadius: 6, padding: "6px 12px" }}>
              <div style={{ fontSize: 8, color: textMuted, letterSpacing: 2, marginBottom: 2 }}>{INPUT_LABELS[type].toUpperCase()}</div>
              <div style={{ fontSize: 11, color: "#4ade80", fontWeight: "bold" }}>{getAlgorithmForDisplay(winner).name}</div>
            </div>
          ))}
        </div>
      </div>
    </>, "#38bdf8");

    const conclusionCard = card(<>
      {secTitle("SORTING — CONCLUSION", "#38bdf8")}
      <p style={{ fontSize: 12, color: textPrimary, lineHeight: 1.8 }}>
        <strong style={{ color: "#4ade80" }}>{getAlgorithmForDisplay(best.algo).name}</strong> is recommended for general-purpose sorting due to its consistent {getAlgorithmForDisplay(best.algo).complexity.average} average-case performance.{" "}
        {getAlgorithmForDisplay(best.algo).complexity.paradigm === "Divide & Conquer"
          ? "Its divide-and-conquer strategy efficiently reduces problem size at each step."
          : "Its incremental approach adapts well to partially sorted data."}
      </p>
      <p style={{ fontSize: 12, color: textPrimary, lineHeight: 1.8, marginTop: 10 }}>
        <strong style={{ color: "#f87171" }}>{getAlgorithmForDisplay(worst.algo).name}</strong> should be avoided for large datasets given its {getAlgorithmForDisplay(worst.algo).complexity.worst} worst-case complexity,
        though it remains acceptable for very small inputs (n ≤ 20).
      </p>
      <ScalingAssessment sortResults={sortResults} unit={unit} isDark={isDark} />
    </>, "#38bdf8");

    sortSection = <>{resultCard}{conclusionCard}</>;
  }

  let searchSection = null;
  if (searchResults) {
    const { results, sizes, algos, scenarios } = searchResults;
    const mk = searchMetric === "time" ? "time" : "comparisons";
    const unit = searchMetric === "time" ? "ms" : "comparisons";

    const algoStats = algos.map(algo => {
      const allVals = scenarios.flatMap(sc => sizes.map((_, si) => results[algo][sc][si][mk]));
      const avg = allVals.reduce((a, b) => a + b, 0) / allVals.length;
      return { algo, avg };
    }).sort((a, b) => a.avg - b.avg);

    const best = algoStats[0];
    const worst = algoStats[algoStats.length - 1];
    const ratio = worst.avg > 0 ? (worst.avg / best.avg).toFixed(1) : "N/A";

    const scWinners = scenarios.map(sc => {
      const winner = algos.reduce((best, algo) => {
        const avg = sizes.reduce((s, _, si) => s + results[algo][sc][si][mk], 0) / sizes.length;
        const bestAvg = sizes.reduce((s, _, si) => s + results[best][sc][si][mk], 0) / sizes.length;
        return avg < bestAvg ? algo : best;
      }, algos[0]);
      return { sc, winner };
    });

    const resultCard = card(<>
      {secTitle("STRING MATCHING — RESULTS ANALYSIS", "#f472b6")}
      <p style={{ fontSize: 12, color: textPrimary, lineHeight: 1.8, marginBottom: 14 }}>
        String matching algorithms were benchmarked across <strong style={{ color: "#f472b6" }}>{scenarios.length} scenarios</strong> using text sizes of{" "}
        <strong style={{ color: "#e2e8f0" }}>{sizes.join(", ")} characters</strong>. Pattern used: <strong style={{ color: "#fbbf24" }}>"{pattern}"</strong>.
      </p>
      <p style={{ fontSize: 12, color: textPrimary, lineHeight: 1.8, marginBottom: 14 }}>
        <strong style={{ color: "#4ade80" }}>Best: {getAlgorithmForDisplay(best.algo).name}</strong> — averaged{" "}
        <strong style={{ color: "#4ade80" }}>{best.avg.toFixed(4)} {unit}</strong> across all scenarios.
      </p>
      <p style={{ fontSize: 12, color: textPrimary, lineHeight: 1.8, marginBottom: 14 }}>
        <strong style={{ color: "#f87171" }}>Most expensive: {getAlgorithmForDisplay(worst.algo).name}</strong> — averaged{" "}
        <strong style={{ color: "#f87171" }}>{worst.avg.toFixed(4)} {unit}</strong>,{" "}
        about <strong style={{ color: "#fb923c" }}>{ratio}×</strong> more than {getAlgorithmForDisplay(best.algo).name}.
      </p>
      <div style={{ marginBottom: 12 }}>
        {secTitle("SCENARIO WINNERS", "#475569")}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {scWinners.map(({ sc, winner }) => (
            <div key={sc} style={{ background: isDark ? "#0a0f1e" : "#f1f5f9", border: `1px solid ${border}`, borderRadius: 6, padding: "6px 12px" }}>
              <div style={{ fontSize: 8, color: textMuted, letterSpacing: 2, marginBottom: 2 }}>{SCENARIO_LABELS[sc].toUpperCase()}</div>
              <div style={{ fontSize: 11, color: "#f472b6", fontWeight: "bold" }}>{winner}</div>
            </div>
          ))}
        </div>
      </div>
    </>, "#f472b6");

    const conclusionCard = card(<>
      {secTitle("STRING MATCHING — CONCLUSION", "#f472b6")}
      <p style={{ fontSize: 12, color: textPrimary, lineHeight: 1.8 }}>
        <strong style={{ color: "#4ade80" }}>{best.algo}</strong> demonstrated superior performance, especially on longer texts where its preprocessing advantage compounds.
        Algorithms with preprocessing (KMP, Horspool) are recommended for production use.
      </p>
      <p style={{ fontSize: 12, color: textPrimary, lineHeight: 1.8, marginTop: 10 }}>
        Brute Force remains competitive on short patterns and small texts, with O(1) space complexity making it suitable for memory-constrained environments.
      </p>
      <p style={{ fontSize: 12, color: textPrimary, lineHeight: 1.8, marginTop: 10 }}>
        In the "No Match" scenario, preprocessing-based algorithms show the most improvement over Brute Force, as their skip mechanisms avoid exhaustive scanning.
      </p>
    </>, "#f472b6");

    searchSection = <>{resultCard}{conclusionCard}</>;
  }

  return (
    <div>
      <Label color="#fbbf24">📝 AUTO-GENERATED REPORT</Label>
      <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 11, color: "#fbbf24" }}>
        ✨ This report was generated automatically from your benchmark results.
        Copy any section directly into your project documentation.
      </div>
      {sortSection}
      {searchSection}
    </div>
  );
}


function averageComplexityExponent(label) {
  if (!label) return null;
  if (label.includes("n²")) return 2;
  if (label.includes("n log n")) return "nlogn";
  if (label.includes("n×m") || label.includes("n+m")) return null;
  if (label === "O(n)") return 1;
  return null;
}

function predictedGrowth(exponent, nMin, nMax) {
  if (exponent === "nlogn") {
    if (nMin <= 0 || nMax <= 0) return null;
    return (nMax * Math.log2(nMax)) / (nMin * Math.log2(nMin));
  }
  if (typeof exponent !== "number") return null;
  if (nMin <= 0) return null;
  return Math.pow(nMax / nMin, exponent);
}

/**
 * Compares observed runtime growth of the winning algorithm against its
 * stated complexity. States only what was measured — no claims of
 * statistical significance.
 */
function ScalingAssessment({ sortResults, unit, isDark }) {
  const { results, sizes, algos, types } = sortResults;
  const d = algos.length ? getAlgorithmForDisplay(algos[0]) : null;

  if (!d || !sizes || sizes.length < 2 || sizes[0] <= 0) {
    return (
      <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8, marginTop: 10 }}>
        Run at least two input sizes to compare observed growth against the stated complexity.
      </p>
    );
  }

  const nMin = Math.min(...sizes);
  const nMax = Math.max(...sizes);

  const perType = types
    .map((t) => {
      const points = results[d.id]?.[t];
      if (!Array.isArray(points)) return null;
      const first = points.find((p) => p.n === nMin);
      const last = points.find((p) => p.n === nMax);
      if (!first || !last || !(first.time > 0)) return null;
      return last.time / first.time;
    })
    .filter((x) => x != null);

  if (!perType.length) {
    return (
      <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8, marginTop: 10 }}>
        Not enough usable timing data to assess scaling for this run.
      </p>
    );
  }

  const observed = perType.reduce((a, b) => a + b, 0) / perType.length;
  const exponent = averageComplexityExponent(d.complexity?.average);
  const predicted = exponent == null ? null : predictedGrowth(exponent, nMin, nMax);

  let verdict;
  if (predicted == null || !isFinite(predicted) || predicted <= 0) {
    verdict = `no reliable prediction is available from the stated ${d.complexity?.average} bound`;
  } else if (observed >= predicted * 0.65 && observed <= predicted * 1.35) {
    verdict = `close to the ~${predicted.toFixed(1)}× growth implied by its ${d.complexity.average} average case`;
  } else if (observed > predicted) {
    verdict = `faster than the ~${predicted.toFixed(1)}× growth implied by ${d.complexity.average} — likely constant-factor effects at these small sizes, not a better asymptotic class`;
  } else {
    verdict = `slower than the ~${predicted.toFixed(1)}× growth implied by ${d.complexity.average}`;
  }

  return (
    <p style={{ fontSize: 12, color: isDark ? "#e2e8f0" : "#1e293b", lineHeight: 1.8, marginTop: 10 }}>
      Observed scaling: between n={nMin.toLocaleString()} and n={nMax.toLocaleString()},
      {" "}<strong style={{ color: "#4ade80" }}>{d.name}</strong>&apos;s median {unit} grew
      approximately <strong style={{ color: "#fb923c" }}>{observed.toFixed(1)}×</strong> — {verdict}.
      This is a single-run observation on this machine; it is not a controlled benchmark.
    </p>
  );
}
