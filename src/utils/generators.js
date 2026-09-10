export function generateArray(size, type) {
  let arr = Array.from(
    { length: size },
    () => Math.floor(Math.random() * size * 2) + 1,
  );
  if (type === "sorted") arr.sort((a, b) => a - b);
  else if (type === "reverse") arr.sort((a, b) => b - a);
  else if (type === "nearly") {
    arr.sort((a, b) => a - b);
    for (let i = 0; i < Math.max(1, Math.floor(size * 0.1)); i++) {
      const x = Math.floor(Math.random() * size),
        y = Math.floor(Math.random() * size);
      [arr[x], arr[y]] = [arr[y], arr[x]];
    }
  }
  return arr;
}

export function generateText(size, pattern, scenario) {
  const chars = "abcdefghijklmnopqrstuvwxyz ";
  if (scenario === "nomatch") {
    const patternChars = new Set(String(pattern || "").split(""));
    const allowed = chars.split("").filter((c) => !patternChars.has(c));
    if (allowed.length > 0) {
      return Array.from(
        { length: size },
        () => allowed[Math.floor(Math.random() * allowed.length)],
      ).join("");
    }
    return "\u0002".repeat(size);
  }
  if (scenario === "start") {
    if (pattern.length >= size) return pattern.slice(0, size);
    return (
      pattern +
      Array.from(
        { length: size - pattern.length },
        () => chars[Math.floor(Math.random() * chars.length)],
      ).join("")
    );
  }
  let text = Array.from(
    { length: size },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
  if (scenario === "end") text = text.slice(0, size - pattern.length) + pattern;
  else if (scenario === "multiple") {
    const interval = Math.floor(size / 4);
    let arr2 = text.split("");
    for (let k = 0; k < 3; k++) {
      const pos = interval * (k + 1);
      for (let c = 0; c < pattern.length && pos + c < size; c++)
        arr2[pos + c] = pattern[c];
    }
    text = arr2.join("");
  }
  return text;
}

/**
 * Generate a set of 2-D points for the closest-pair algorithm.
 * Outputs plain {x, y} objects.
 */
export function generatePoints(count, type = "random", seedMax = 100) {
  if (count < 0) count = 0;
  const pts = [];
  for (let i = 0; i < count; i++) {
    let x, y;
    if (type === "grid") {
      // Deterministic grid layout
      const span = Math.max(1, Math.ceil(Math.sqrt(count)));
      const row = Math.floor(i / span);
      const col = i % span;
      x = row * (seedMax / span);
      y = col * (seedMax / span);
    } else if (type === "random") {
      x = Math.floor(Math.random() * seedMax);
      y = Math.floor(Math.random() * seedMax);
    } else {
      // Default: random
      x = Math.floor(Math.random() * seedMax);
      y = Math.floor(Math.random() * seedMax);
    }
    pts.push({ x, y });
  }
  return pts;
}
