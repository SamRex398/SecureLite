import { useState } from 'react';
import { exportScanAsPdf } from '../../../lib/exportPdf';

const BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function ExportButtons({ scanId, scanTarget }) {
  const [pdfLoading, setPdfLoading] = useState(false);

  const openHtml = () => window.open(`${BASE}/scan/${scanId}/report.html`, '_blank');

  const downloadJson = async () => {
    try {
      const res = await fetch(`${BASE}/scan/${scanId}/report.json`);
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scan-${scanId}-report.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download JSON report');
    }
  };

  const downloadPdf = async () => {
    setPdfLoading(true);
    try {
      const filename = `securelite-${(scanTarget || scanId).replace(/[^a-z0-9]/gi, '-')}.pdf`;
      await exportScanAsPdf('scan-detail-panel', filename);
    } catch (e) {
      alert('PDF export failed: ' + e.message);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-[10px] text-[#00ff88]/50">{'///'}</span>
        <span className="font-display text-xs font-semibold tracking-widest uppercase text-slate-400">
          Export Report
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={openHtml}
          className="flex items-center gap-2 px-4 py-2 font-mono text-xs font-semibold
                     bg-[#38bdf8]/10 border border-[#38bdf8]/40 text-[#38bdf8] rounded-md
                     hover:bg-[#38bdf8]/20 hover:border-[#38bdf8]/70 transition-all uppercase tracking-wider"
        >
          ⊞ HTML
        </button>

        <button
          onClick={downloadJson}
          className="flex items-center gap-2 px-4 py-2 font-mono text-xs font-semibold
                     bg-[#00ff88]/10 border border-[#00ff88]/40 text-[#00ff88] rounded-md
                     hover:bg-[#00ff88]/20 hover:border-[#00ff88]/70 transition-all uppercase tracking-wider"
        >
          ↓ JSON
        </button>

        <button
          onClick={downloadPdf}
          disabled={pdfLoading}
          className="flex items-center gap-2 px-4 py-2 font-mono text-xs font-semibold
                     bg-[#a855f7]/10 border border-[#a855f7]/40 text-[#a855f7] rounded-md
                     hover:bg-[#a855f7]/20 hover:border-[#a855f7]/70
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-all uppercase tracking-wider"
        >
          {pdfLoading
            ? <><span className="w-3 h-3 border border-[#a855f7]/40 border-t-[#a855f7] rounded-full animate-spin" /> Generating…</>
            : '↓ PDF'
          }
        </button>
      </div>
    </div>
  );
}