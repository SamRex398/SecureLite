const STATUS_STYLES = {
  queued:  'bg-slate-600/30 text-slate-400 border-slate-600/40',
  running: 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/40',
  done:    'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/30',
  failed:  'bg-[#ff3b5c]/10 text-[#ff3b5c] border-[#ff3b5c]/30',
};

const STATUS_DOT = {
  queued:  'bg-slate-500',
  running: 'bg-[#f59e0b] animate-pulse',
  done:    'bg-[#00ff88]',
  failed:  'bg-[#ff3b5c]',
};

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ScanHistoryList({ items, loading, error, selectedId, onSelect, onRetry }) {
  return (
    <div className="panel flex flex-col" style={{ minHeight: '400px' }}>
      <div className="px-4 py-3 border-b border-[#1a2332] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[#00ff88]/50">{'///'}</span>
          <span className="font-display text-xs font-semibold tracking-widest uppercase text-slate-400">
            Scan History
          </span>
        </div>
        {!loading && (
          <span className="font-mono text-[10px] text-slate-600">{items.length} scans</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="p-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-[#0d1117] rounded animate-pulse border border-[#1a2332]" />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="p-4 text-center">
            <p className="text-[#ff3b5c] text-xs font-mono mb-3">{error}</p>
            <button
              onClick={onRetry}
              className="text-xs font-mono border border-[#ff3b5c]/40 text-[#ff3b5c] px-3 py-1.5 rounded hover:bg-[#ff3b5c]/10 transition-colors"
            >
              [ Retry ]
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="p-6 text-center">
            <div className="text-slate-600 font-mono text-xs mb-1">// no scans yet</div>
            <div className="text-slate-700 text-xs">Submit a target to get started</div>
          </div>
        )}

        {!loading && !error && items.map((item) => (
          <button
            key={item._id}
            onClick={() => onSelect(item._id)}
            className={`w-full text-left px-4 py-3 border-b border-[#1a2332]/50 transition-all duration-150
              hover:bg-[#00ff88]/5 group border-l-2
              ${selectedId === item._id
                ? 'bg-[#00ff88]/5 border-l-[#00ff88]/60'
                : 'border-l-transparent'
              }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className="font-mono text-xs text-slate-300 truncate leading-tight group-hover:text-slate-100 transition-colors">
                {item.normalizedTarget || item.target}
              </span>
              <span className={`chip shrink-0 ${STATUS_STYLES[item.status]}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${STATUS_DOT[item.status]}`} />
                {item.status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-600">
              <span className="uppercase tracking-wider">{item.scanMode}</span>
              <span>·</span>
              <span className="uppercase tracking-wider">{item.targetType}</span>
              {item.status === 'done' && (
                <>
                  <span>·</span>
                  <span className={`font-semibold ${
                    item.score >= 80 ? 'text-[#00ff88]' :
                    item.score >= 50 ? 'text-[#f59e0b]' : 'text-[#ff3b5c]'
                  }`}>Score {item.score}</span>
                </>
              )}
              <span className="ml-auto">{relativeTime(item.createdAt)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
