// Triggers a browser download of generated text. Exports contain sample data,
// so callers name files with a "-sample" suffix until a real data source exists.
export function downloadFile(name: string, mime: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function toCsv(columns: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [columns, ...rows].map((row) => row.map(esc).join(",")).join("\n");
}
