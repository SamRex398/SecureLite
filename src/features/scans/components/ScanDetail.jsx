import ScanOverview from './ScanOverview';
import FindingsList from './FindingsList';
import ServicesList from './ServicesList';
import RecommendationsList from './RecommendationsList';
import ExportButtons from './ExportButtons';

function StatusBanner({ scan }) {
  if (scan.status === 'queued') return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-md border border-slate-600/40 bg-slate-800/20">
      <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse shrink-0" />
      <span className="font-mono text-xs text-slate-400">Scan queued — waiting for runner…</span>
    </div>
  );

  if (scan.status === 'running') return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-md border border-[#f59e0b]/30 bg-[#f59e0b]/5">
      <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse shrink-0" />
      <span className="font-mono text-xs text-[#f59e0b]">Scan in progress — polling for updates…</span>
      <span className="ml-auto">
        <span className="inline-block w-4 h-4 border-2 border-[#f59e0b]/30 border-t-[#f59e0b] rounded-full animate-spin" />
      </span>
    </div>
  );

  if (scan.status === 'failed') {
    const errMsg = scan.report?.errorMessage || 'Scan failed — no further detail available.';
    return (
      <div className="px-4 py-3 rounded-md border border-[#ff3b5c]/40 bg-[#ff3b5c]/8">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#ff3b5c] shrink-0" />
          <span className="font-mono text-xs font-semibold text-[#ff3b5c] uppercase tracking-wider">Scan Failed</span>
        </div>
        <p className="font-mono text-xs text-[#ff3b5c]/80 ml-4">{errMsg}</p>
      </div>
    );
  }

  return null;
}

export default function ScanDetail({ scan, loading, scanTarget }) {
  const isTerminal = scan.status === 'done' || scan.status === 'failed';

  // Deduplicate findings + vulnerabilities
  const allFindings = [...(scan.findings || []), ...(scan.vulnerabilities || [])]
    .filter((f, i, arr) => arr.findIndex(x => x.title === f.title && x.endpoint === f.endpoint) === i);

  return (
    <div id="scan-detail-panel" className="space-y-4" style={{ animation: 'fadeIn 0.3s ease' }}>
      <StatusBanner scan={scan} />
      <ScanOverview scan={scan} />

      {isTerminal && (
        <>
          {allFindings.length > 0 && (
            <FindingsList findings={allFindings} title="Findings & Vulnerabilities" />
          )}
          {scan.services?.length > 0 && (
            <ServicesList services={scan.services} />
          )}
          {scan.recommendations?.length > 0 && (
            <RecommendationsList recommendations={scan.recommendations} />
          )}
          <ExportButtons scanId={scan._id} scanTarget={scanTarget} />
        </>
      )}

      {loading && !isTerminal && (
        <div className="text-center py-4 font-mono text-xs text-slate-600 animate-pulse">
          // fetching latest data…
        </div>
      )}
    </div>
  );
}
