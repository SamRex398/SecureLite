import { useState, useEffect } from 'react';
import { useScanHistory, useScan, useCreateScan } from '../features/scans/hooks';
import ScanForm from '../features/scans/components/ScanForm';
import ScanHistoryList from '../features/scans/components/ScanHistoryList';
import ScanDetail from '../features/scans/components/ScanDetail';
import { useToast } from '../components/ui/Toast';

function EmptyState({ loading }) {
  if (loading) return (
    <div className="panel p-10 text-center space-y-3">
      <div className="inline-block w-6 h-6 border-2 border-[#00ff88]/30 border-t-[#00ff88] rounded-full animate-spin" />
      <div className="font-mono text-xs text-slate-600">// loading scan data…</div>
    </div>
  );

  return (
    <div className="panel p-10 text-center">
      <div className="font-mono text-2xl text-[#00ff88]/15 mb-6 select-none">{'{ }'}</div>
      <div className="font-display text-lg font-semibold text-slate-400 mb-2">No scan selected</div>
      <p className="font-mono text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
        Enter a URL, hostname, or public IP address in the scan form to begin analysis.
      </p>
      <div className="mt-6 grid grid-cols-3 gap-3 max-w-sm mx-auto text-left">
        {[
          { example: 'https://example.com', type: 'URL' },
          { example: 'example.com', type: 'Hostname' },
          { example: '8.8.8.8', type: 'IPv4' },
        ].map(({ example, type }) => (
          <div key={type} className="px-3 py-2 rounded border border-[#1a2332] bg-[#080b0f]">
            <div className="font-mono text-[9px] text-slate-600 uppercase tracking-widest mb-1">{type}</div>
            <div className="font-mono text-[10px] text-slate-500 break-all">{example}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [selectedId, setSelectedId] = useState(null);
  const { toast } = useToast();

  const { data: history, loading: histLoading, error: histError, refetch: refetchHistory } = useScanHistory(10);
  const { data: scan, loading: scanLoading } = useScan(selectedId);
  const { createScan, loading: creating, error: createError, clearError } = useCreateScan();

  // Auto-select latest on first load
  useEffect(() => {
    if (!selectedId && history.length > 0) setSelectedId(history[0]._id);
  }, [history, selectedId]);

  // Refresh history when active scan finishes
  useEffect(() => {
    if (scan?.status === 'done' || scan?.status === 'failed') refetchHistory();
  }, [scan?.status, refetchHistory]);

  const handleSubmit = async (target) => {
    clearError();
    const result = await createScan(target);
    if (result) {
      toast('success', `Scan queued for ${result.normalizedTarget || result.target}`);
      await refetchHistory();
      setSelectedId(result._id);
    } else {
      toast('error', 'Failed to queue scan — check the error message.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">

        {/* Left column */}
        <div className="flex flex-col gap-4">
          <ScanForm onSubmit={handleSubmit} loading={creating} error={createError} />
          <ScanHistoryList
            items={history}
            loading={histLoading}
            error={histError}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onRetry={refetchHistory}
          />
        </div>

        {/* Right column */}
        <div className="min-w-0">
          {scan
            ? <ScanDetail scan={scan} loading={scanLoading} scanTarget={scan.host || scan.target} />
            : <EmptyState loading={histLoading || scanLoading} />
          }
        </div>
      </div>
    </div>
  );
}
