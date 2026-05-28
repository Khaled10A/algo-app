export function ArrayViz({ steps, currentStep }) {
  if (!steps || steps.length === 0) return null;
  const step = steps[Math.min(currentStep, steps.length - 1)];
  const arr = step.arr;
  const hi = step.highlight || [];
  const maxVal = Math.max(...arr);
  const barW = Math.min(26, Math.floor(360 / arr.length));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 76, padding: "0 6px" }}>
      {arr.map((v, i) => (
        <div key={i} style={{
          width: barW,
          height: `${(v / maxVal) * 70}px`,
          background: hi.includes(i) ? "#f472b6" : "#38bdf8",
          borderRadius: "3px 3px 0 0",
          transition: "height 0.08s, background 0.08s",
          flexShrink: 0,
        }} title={v} />
      ))}
    </div>
  );
}
