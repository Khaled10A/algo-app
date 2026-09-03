import { getAlgorithm, getBenchmarkable } from "../../algorithms/registry";
import { generateArray, generateText } from "../../utils/generators";
import { runBenchmarkJob } from "./engine";

export const DEFAULT_REPEATS = 5;
export const DEFAULT_WARMUP = 1;

export const LIMITS = {
  maxSizePerPoint: 200000,
  maxCustomArrayLength: 100000,
  maxFileTextLength: 200000,
  maxPointsPerRun: 24,
  maxSyncFallbackSize: 5000,
};

function resolveAlgos(algoIds) {
  const algos = algoIds.map((id) => {
    const d = getAlgorithm(id);
    if (!d || typeof d.run !== "function") {
      throw new Error(`Algorithm "${id}" is not benchmarkable`);
    }
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
      spec.inputMode === "custom" ? parseNumberList(spec.customArrayStr) : null;

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
        {
          key: "file",
          collect: "matches",
          makeInput: () => [spec.text, spec.pattern],
        },
      ],
    };
  }

  throw new Error(`Unknown benchmark spec kind: ${spec.kind}`);
}

export function executeSpec(spec, options) {
  return runBenchmarkJob(materializeSpec(spec), options);
}

function rejectOverLimit(values, label, errors) {
  for (const n of values) {
    if (n > LIMITS.maxSizePerPoint) {
      errors.push(
        `${label} ${n.toLocaleString()} exceeds the maximum of ${LIMITS.maxSizePerPoint.toLocaleString()}. Reduce the input sizes.`,
      );
    }
  }
}

export function validateSpec(spec) {
  const errors = [];
  if (spec.kind === "sorting") {
    if (!getBenchmarkable("sorting").length)
      return "No sorting algorithms available";
    if (spec.inputMode === "custom") {
      const custom = parseNumberList(spec.customArrayStr);
      if (!custom.length) return "Custom array is empty";
      rejectOverLimit([custom.length], "Custom array length", errors);
    } else {
      if (!spec.sizes.length || !spec.types.length) {
        return "Select at least one input size and type";
      }
      rejectOverLimit(spec.sizes, "Input size", errors);
    }
  } else if (spec.kind === "search-generate" || spec.kind === "search-file") {
    if (!spec.algoIds.length) return "Select at least one algorithm";
    if (!spec.pattern) return "Pattern is empty";
    if (spec.kind === "search-file") {
      if (!spec.text) return "Upload a text file first";
      rejectOverLimit([spec.text.length], "Text length", errors);
    } else {
      if (!spec.sizes.length || !spec.scenarios.length) {
        return "Select at least one text size and scenario";
      }
      rejectOverLimit(spec.sizes, "Text size", errors);
    }
  } else {
    return "Unknown benchmark kind";
  }

  const pointCount =
    spec.kind === "sorting" && spec.inputMode !== "custom"
      ? spec.sizes.length * spec.types.length
      : spec.kind === "search-generate"
        ? spec.sizes.length * spec.scenarios.length
        : 1;
  if (pointCount > LIMITS.maxPointsPerRun) {
    errors.push(
      `This run would execute ${pointCount} benchmark points; the maximum is ${LIMITS.maxPointsPerRun}. Select fewer sizes or scenarios.`,
    );
  }

  if (errors.length) return errors.join(" ");
  return null;
}

/** True when the spec is small enough to execute on the main thread. */
export function isWithinSyncBudget(spec) {
  let sizes = [];
  if (spec.kind === "sorting") {
    sizes =
      spec.inputMode === "custom"
        ? [parseNumberList(spec.customArrayStr).length]
        : spec.sizes;
  } else if (spec.kind === "search-generate") {
    sizes = spec.sizes;
  } else if (spec.kind === "search-file") {
    sizes = [spec.text?.length || 0];
  } else {
    return false;
  }
  return sizes.every((n) => n <= LIMITS.maxSyncFallbackSize);
}

export function parseNumberList(str) {
  return String(str)
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
}
