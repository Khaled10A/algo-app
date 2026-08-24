import { getAlgorithm, getBenchmarkable } from '../../algorithms/registry';
import { generateArray, generateText } from '../../utils/generators';
import { runBenchmarkJob } from './engine';

export const DEFAULT_REPEATS = 3;
export const DEFAULT_WARMUP = 1;

function resolveAlgos(algoIds) {
  const algos = algoIds.map((id) => {
    const d = getAlgorithm(id);
    if (typeof d.run !== "function") throw new Error(`Algorithm "${id}" is not benchmarkable`);
    return { id, run: d.run };
  });
  if (!algos.length) throw new Error("No algorithms selected");
  return algos;
}

/**
 * Materializes a serializable benchmark spec into an executable job.
 * Specs are plain data so they can be posted to a Web Worker unchanged.
 */
export function materializeSpec(spec) {
  const algos = resolveAlgos(spec.algoIds);
  const repeats = spec.repeats ?? DEFAULT_REPEATS;
  const warmup = spec.warmup ?? DEFAULT_WARMUP;

  if (spec.kind === "sorting") {
    const customArr =
      spec.inputMode === "custom"
        ? parseNumberList(spec.customArrayStr)
        : null;

    if (customArr && customArr.length > 0) {
      return {
        algos,
        repeats,
        warmup,
        sizes: [customArr.length],
        scenarios: spec.types.map((type) => ({
          key: type,
          makeInput: () => [customArr],
        })),
      };
    }

    return {
      algos,
      repeats,
      warmup,
      sizes: spec.sizes,
      scenarios: spec.types.map((type) => ({
        key: type,
        makeInput: (n) => [generateArray(n, type)],
      })),
    };
  }

  if (spec.kind === "search-generate") {
    return {
      algos,
      repeats,
      warmup,
      sizes: spec.sizes,
      scenarios: spec.scenarios.map((sc) => ({
        key: sc,
        makeInput: (n) => [generateText(n, spec.pattern, sc), spec.pattern],
      })),
    };
  }

  if (spec.kind === "search-file") {
    return {
      algos,
      repeats,
      warmup,
      sizes: [spec.text.length],
      scenarios: [
        { key: "file", collect: "matches", makeInput: () => [spec.text, spec.pattern] },
      ],
    };
  }

  throw new Error(`Unknown benchmark spec kind: ${spec.kind}`);
}

export function executeSpec(spec, options) {
  return runBenchmarkJob(materializeSpec(spec), options);
}

export function validateSpec(spec) {
  if (spec.kind === "sorting") {
    if (!getBenchmarkable("sorting").length) return "No sorting algorithms available";
    if (spec.inputMode === "custom") {
      if (parseNumberList(spec.customArrayStr).length === 0) return "Custom array is empty";
    } else if (!spec.sizes.length || !spec.types.length) {
      return "Select at least one input size and type";
    }
    return null;
  }
  if (spec.kind === "search-generate" || spec.kind === "search-file") {
    if (!spec.algoIds.length) return "Select at least one algorithm";
    if (!spec.pattern) return "Pattern is empty";
    if (spec.kind === "search-file" && !spec.text) return "Upload a text file first";
    if (spec.kind === "search-generate" && (!spec.sizes.length || !spec.scenarios.length)) {
      return "Select at least one text size and scenario";
    }
    return null;
  }
  return "Unknown benchmark kind";
}

export function parseNumberList(str) {
  return String(str)
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
}
