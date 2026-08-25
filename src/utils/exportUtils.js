export function exportCSV(headers, rows, filename) {
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
}

function svgPixelSize(svgEl, targetWidth = 900) {
  const viewBox = svgEl.getAttribute && svgEl.getAttribute("viewBox");
  if (viewBox) {
    const parts = viewBox.split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0) {
      return { width: targetWidth, height: Math.round((targetWidth * parts[3]) / parts[2]) };
    }
  }
  const box = typeof svgEl.getBBox === "function" ? safeBBox(svgEl) : null;
  if (box && box.width > 0 && box.height > 0) {
    return { width: targetWidth, height: Math.round((targetWidth * box.height) / box.width) };
  }
  return { width: targetWidth, height: 420 };
}

function safeBBox(svgEl) {
  try {
    return svgEl.getBBox();
  } catch {
    return null;
  }
}

function renderSvgToPng(svgEl, filename, background) {
  const s = new XMLSerializer().serializeToString(svgEl);
  const { width, height } = svgPixelSize(svgEl);
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
      if (!b) return;
      const blobUrl = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
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
  const entries = Object.entries(refs)
    .map(([name, ref]) => [name, ref?.current?.querySelector?.("svg")])
    .filter(([, svg]) => svg);

  entries.reduce(
    (delay, [name, svgEl]) => {
      setTimeout(() => renderSvgToPng(svgEl, `${name}.png`, background), delay);
      return delay + 350;
    },
    0
  );
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
