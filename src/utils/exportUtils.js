import * as XLSX from "xlsx";

export function exportCSV(headers, rows, filename) {
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
}

export function exportSVGasPNG(containerEl, filename) {
  const svg = containerEl.querySelector("svg");
  if (!svg) return;
  const s = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement("canvas");
  canvas.width = 900; canvas.height = 420;
  const ctx = canvas.getContext("2d");
  const img = new Image();
  const url = URL.createObjectURL(new Blob([s], { type: "image/svg+xml" }));
  img.onload = () => {
    ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, 900, 420);
    ctx.drawImage(img, 0, 0, 900, 420);
    canvas.toBlob(b => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = filename;
      a.click();
    });
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

export function exportAllChartsPNG(refs) {
  const entries = Object.entries(refs).filter(([, ref]) => ref?.current);
  entries.forEach(([name, ref], idx) => {
    setTimeout(() => {
      const svgEl = ref.current?.querySelector("svg");
      if (!svgEl) return;
      const s = new XMLSerializer().serializeToString(svgEl);
      const canvas = document.createElement("canvas");
      canvas.width = 900; canvas.height = 420;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      const url = URL.createObjectURL(new Blob([s], { type: "image/svg+xml" }));
      img.onload = () => {
        ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, 900, 420);
        ctx.drawImage(img, 0, 0, 900, 420);
        canvas.toBlob(b => {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(b);
          a.download = `${name}.png`;
          a.click();
        });
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }, idx * 400);
  });
}

export function exportXLSX(sheets, filename) {
  try {
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
