export function LineChart({ data, colors, labels, title, xTitle, yTitle }) {
  if (!data || data.length === 0) return null;
  const W = 440, H = 216, PL = 58, PR = 16, PT = 28, PB = 48;
  const allVals = data.flatMap(d => d.values);
  const maxV = Math.max(...allVals, 1);
  const xs = data[0].xLabels;
  const xStep = (W - PL - PR) / Math.max(xs.length - 1, 1);
  const yScale = v => PT + (H - PT - PB) * (1 - v / maxV);
  const xScale = i => PL + i * xStep;
  const fmt = v => v >= 1000 ? (v / 1000).toFixed(1) + "k" : v < 1 ? v.toFixed(3) : Math.round(v);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <text x={W / 2} y={14} textAnchor="middle" fontSize="11" fill="var(--chart-label)" fontWeight="600">{title}</text>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <g key={i}>
          <line x1={PL} x2={W - PR} y1={yScale(maxV * t)} y2={yScale(maxV * t)} stroke="var(--chart-grid)" strokeWidth="1" strokeDasharray="3,3" />
          <text x={PL - 4} y={yScale(maxV * t) + 3} fontSize="10" fill="var(--chart-label)" textAnchor="end" fontFamily="monospace">{fmt(maxV * t)}</text>
        </g>
      ))}
      <line x1={PL} x2={PL} y1={PT} y2={H - PB} stroke="var(--chart-axis)" strokeWidth="1" />
      <line x1={PL} x2={W - PR} y1={H - PB} y2={H - PB} stroke="var(--chart-axis)" strokeWidth="1" />
      {xs.map((x, i) => <text key={i} x={xScale(i)} y={H - PB + 12} fontSize="10" fill="var(--chart-label)" textAnchor="middle" fontFamily="monospace">{x}</text>)}
      {xTitle && <text x={W / 2} y={H - 4} textAnchor="middle" fontSize="10" fill="var(--chart-label)" fontFamily="monospace">{xTitle}</text>}
      {yTitle && <text x={9} y={H / 2} textAnchor="middle" fontSize="10" fill="var(--chart-label)" fontFamily="monospace" transform={`rotate(-90,9,${H / 2})`}>{yTitle}</text>}
      {data.map((series, si) => {
        const pts = series.values.map((v, i) => `${xScale(i)},${yScale(v)}`).join(" ");
        return (
          <g key={si}>
            <polyline points={pts} fill="none" stroke={colors[si % colors.length]} strokeWidth="2" strokeLinejoin="round" />
            {series.values.map((v, i) => <circle key={i} cx={xScale(i)} cy={yScale(v)} r="3.5" fill={colors[si % colors.length]} />)}
          </g>
        );
      })}
      {labels && labels.map((l, i) => (
        <g key={i}>
          <rect x={PL + i * Math.floor((W - PL - PR) / labels.length)} y={H - 13} width="7" height="7" fill={colors[i % colors.length]} rx="1" />
          <text x={PL + i * Math.floor((W - PL - PR) / labels.length) + 10} y={H - 7} fontSize="10" fill="var(--chart-label)">{l}</text>
        </g>
      ))}
    </svg>
  );
}

export function BarChart({ data, colors, labels, title, xTitle, yTitle }) {
  if (!data || data.length === 0) return null;
  const W = 440, H = 216, PL = 58, PR = 16, PT = 28, PB = 48;
  const groupCount = data[0].values.length;
  const barW = Math.max(6, Math.floor((W - PL - PR) / (groupCount * data.length + groupCount + 2)));
  const groupW = barW * data.length + 4;
  const allVals = data.flatMap(d => d.values);
  const maxV = Math.max(...allVals, 1);
  const yScale = v => PT + (H - PT - PB) * (1 - v / maxV);
  const fmt = v => v >= 1000 ? (v / 1000).toFixed(1) + "k" : v < 1 ? v.toFixed(3) : Math.round(v);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <text x={W / 2} y={14} textAnchor="middle" fontSize="11" fill="var(--chart-label)" fontWeight="600">{title}</text>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <g key={i}>
          <line x1={PL} x2={W - PR} y1={yScale(maxV * t)} y2={yScale(maxV * t)} stroke="var(--chart-grid)" strokeWidth="1" strokeDasharray="3,3" />
          <text x={PL - 4} y={yScale(maxV * t) + 3} fontSize="10" fill="var(--chart-label)" textAnchor="end" fontFamily="monospace">{fmt(maxV * t)}</text>
        </g>
      ))}
      <line x1={PL} x2={PL} y1={PT} y2={H - PB} stroke="var(--chart-axis)" strokeWidth="1" />
      <line x1={PL} x2={W - PR} y1={H - PB} y2={H - PB} stroke="var(--chart-axis)" strokeWidth="1" />
      {data[0].xLabels.map((xl, gi) => {
        const gx = PL + gi * (groupW + 6) + groupW / 2;
        return <text key={gi} x={gx} y={H - PB + 12} fontSize="10" fill="var(--chart-label)" textAnchor="middle" fontFamily="monospace">{xl}</text>;
      })}
      {xTitle && <text x={W / 2} y={H - 4} textAnchor="middle" fontSize="10" fill="var(--chart-label)" fontFamily="monospace">{xTitle}</text>}
      {data.map((series, si) =>
        series.values.map((v, gi) => {
          const gx = PL + gi * (groupW + 6) + si * (barW + 1);
          const bH = (H - PT - PB) * (v / maxV);
          return <rect key={`${si}-${gi}`} x={gx} y={H - PB - bH} width={barW} height={bH} fill={colors[si % colors.length]} rx="2" opacity="0.85" />;
        })
      )}
      {labels && labels.map((l, i) => (
        <g key={i}>
          <rect x={PL + i * Math.floor((W - PL - PR) / labels.length)} y={H - 13} width="7" height="7" fill={colors[i % colors.length]} rx="1" />
          <text x={PL + i * Math.floor((W - PL - PR) / labels.length) + 10} y={H - 7} fontSize="10" fill="var(--chart-label)">{l}</text>
        </g>
      ))}
    </svg>
  );
}
