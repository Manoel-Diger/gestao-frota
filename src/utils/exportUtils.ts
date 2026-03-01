/**
 * Utilitários de exportação profissional: PDF e CSV
 */

// ============ CSV EXPORT ============
export function exportToCSV(data: Record<string, any>[], filename: string, headers?: Record<string, string>) {
  if (data.length === 0) return;

  const keys = Object.keys(headers || data[0]);
  const headerRow = headers 
    ? keys.map(k => headers[k]) 
    : keys;

  const rows = data.map(item =>
    keys.map(key => {
      const val = item[key];
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(',')
  );

  const csv = [headerRow.join(','), ...rows].join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

// ============ PDF EXPORT (HTML-based) ============
export function exportToPDF(title: string, content: string, options?: { subtitle?: string; footer?: string }) {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page { margin: 20mm; size: A4; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a2e; line-height: 1.6; }
    .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 32px; border-radius: 8px; margin-bottom: 24px; }
    .header h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    .header p { font-size: 13px; opacity: 0.85; }
    .subtitle { font-size: 14px; opacity: 0.9; margin-top: 8px; }
    .content { padding: 0 8px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    th { background: #f1f5f9; color: #334155; padding: 10px 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
    td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; }
    tr:hover td { background: #f8fafc; }
    .section-title { font-size: 16px; font-weight: 600; color: #1e40af; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #dbeafe; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 16px 0; }
    .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }
    .summary-card .value { font-size: 28px; font-weight: 700; color: #1e40af; }
    .summary-card .label { font-size: 12px; color: #64748b; margin-top: 4px; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-warning { background: #fef3c7; color: #b45309; }
    .badge-danger { background: #fee2e2; color: #dc2626; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚛 ${title}</h1>
    ${options?.subtitle ? `<p class="subtitle">${options.subtitle}</p>` : ''}
    <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
  </div>
  <div class="content">
    ${content}
  </div>
  <div class="footer">
    ${options?.footer || 'FrotaPro — Sistema de Gestão de Frotas Profissional'}
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.onload = () => {
      setTimeout(() => {
        win.print();
        URL.revokeObjectURL(url);
      }, 500);
    };
  }
}

// ============ TABLE BUILDER (for PDF) ============
export function buildHTMLTable(data: Record<string, any>[], headers: Record<string, string>): string {
  if (data.length === 0) return '<p>Nenhum dado disponível.</p>';
  const keys = Object.keys(headers);
  const ths = keys.map(k => `<th>${headers[k]}</th>`).join('');
  const rows = data.map(item => {
    const tds = keys.map(k => `<td>${item[k] ?? '—'}</td>`).join('');
    return `<tr>${tds}</tr>`;
  }).join('');
  return `<table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
}

export function buildSummaryCards(cards: { label: string; value: string | number }[]): string {
  const items = cards.map(c =>
    `<div class="summary-card"><div class="value">${c.value}</div><div class="label">${c.label}</div></div>`
  ).join('');
  return `<div class="summary-grid">${items}</div>`;
}

// ============ HELPER ============
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
