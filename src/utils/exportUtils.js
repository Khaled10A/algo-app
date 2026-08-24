export function exportCSV(headers, rows, filename) {
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
}

function renderSvgToPng(svgEl, filename, background, width = 900, height = 420) {
  const s = new XMLSerializer().serializeToString(svgEl);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const img = new Image();
  const url = URL.createObjectURL(new Blob([s], { type: "image/svg+xml" }));
  img.onload = () => {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    canvas.toBlob(b => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    });
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

export function exportSVGasPNG(containerEl, filename, background = "#0f172a") {
  const svg = containerEl?.querySelector("svg");
  if (!svg) return;
  renderSvgToPng(svg, filename, background);
}

export function exportAllChartsPNG(refs, background = "#0f172a") {
  const entries = Object.entries(refs).filter(([, ref]) => ref?.current?.querySelector?.("svg"));
  entries.forEach(([name, ref], idx) => {
    setTimeout(() => {
      const svgEl = ref.current.querySelector("svg");
      if (!svgEl) return;
      renderSvgToPng(svgEl, `${name}.png`, background);
    }, idx * 400);
  });
}

export async function exportXLSX(sheets, filename) {
  try {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    sheets.forEach(({ name, headers, rows, title }) => {
      const wsData = [];
      if (title) { wsData.push([title]); wsData.push([]); }
      wsData.push(headers);
      rows.forEach(r => wsData.push(r));
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws["!cols"] = headers.map(() => ({ wch: 18 }));
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
    });
    XLSX.writeFile(wb, filename);
  } catch {
    let csv = "\uFEFF";
    sheets.forEach(({ name, headers, rows, title }) => {
      if (title) csv += `${title}\n\n`;
      csv += headers.join(",") + "\n";
      rows.forEach(r => { csv += r.map(v => `"${v}"`).join(",") + "\n"; });
      csv += "\n";
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = filename.replace(".xlsx", ".csv");
    a.click();
  }
}
