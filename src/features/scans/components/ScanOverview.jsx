const RISK_COLOR = {
  Low:      '#00ff88',
  Medium:   '#f59e0b',
  High:     '#ff8c00',
  Critical: '#ff3b5c',
};

const CHECK_STYLE = {
  passed:         { label: 'Passed',  color: 'text-[#00ff88]',  icon: '✓', bg: 'border-[#00ff88]/20 bg-[#00ff88]/5' },
  issues_found:   { label: 'Issues',  color: 'text-[#ff3b5c]',  icon: '✗', bg: 'border-[#ff3b5c]/20 bg-[#ff3b5c]/5' },
  not_applicable: { label: 'N/A',     color: 'text-slate-600',  icon: '—', bg: 'border-[#1a2332] bg-transparent' },
};

const SEV_COLOR = {
  critical: '#ff3b5c',
  high:     '#ff8c00',
  medium:   '#f59e0b',
  low:      '#38bdf8',
  info:     '#94a3b8',
};

function ScoreRing({ score, band }) {
  const color = band ? RISK_COLOR[band] : (score >= 80 ? '#00ff88' : score >= 50 ? '#f59e0b' : '#ff3b5c');
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="relative inline-flex items-center justify-center w-24 h-24">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#1a2332" strokeWidth="6" />
        <circle
          cx="48" cy="48" r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 6px ${color}80)`, transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-mono font-bold text-xl leading-none" style={{ color }}>{score}</div>
        <div className="text-[10px] font-mono text-slate-600 mt-0.5">score</div>
      </div>
    </div>
  );
}

function SeverityBar({ counts }) {
  const sevs = ['critical', 'high', 'medium', 'low', 'info'];
  const total = sevs.reduce((a, s) => a + (counts[s] || 0), 0);
  if (total === 0) return <div className="text-xs font-mono text-slate-600">No findings</div>;

  return (
    <div className="space-y-1.5">
      {sevs.map(s => {
        const n = counts[s] || 0;
        if (!n) return null;
        return (
          <div key={s} className="flex items-center gap-2">
            <span className="font-mono text-[10px] w-14 uppercase tracking-wider" style={{ color: SEV_COLOR[s] }}>{s}</span>
            <div className="flex-1 h-1.5 bg-[#1a2332] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(n / total) * 100}%`, background: SEV_COLOR[s] }}
              />
            </div>
            <span className="font-mono text-[10px] text-slate-500 w-4 text-right">{n}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function ScanOverview({ scan }) {
  const r = scan.report;
  const band = r?.riskBand;
  const bandColor = band ? RISK_COLOR[band] : '#94a3b8';
  const checkEntries = r?.checks ? Object.entries(r.checks) : [];

  const duration = r?.startedAt && r?.completedAt
    ? Math.round((new Date(r.completedAt).getTime() - new Date(r.startedAt).getTime()) / 1000)
    : null;

  return (
    <div className="panel p-5 space-y-5">
      <div className="flex flex-wrap gap-5 items-start">

        {/* Score ring */}
        <div className="flex flex-col items-center gap-2">
          <ScoreRing score={scan.score || 0} band={band} />
          {band && (
            <span className="font-mono text-xs font-bold tracking-wider uppercase" style={{ color: bandColor }}>
              {band} Risk
            </span>
          )}
        </div>

        {/* Target info */}
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">Target</div>
            <div className="font-mono text-sm text-slate-200 break-all">
              {scan.normalizedTarget || scan.target}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Mode', value: scan.scanMode, upper: true },
              { label: 'Type', value: scan.targetType, upper: true },
              { label: 'Host', value: scan.host, upper: false },
            ].map(({ label, value, upper }) => (
              <div key={label}>
                <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-0.5">{label}</div>
                <div className={`font-mono text-xs text-slate-300 ${upper ? 'uppercase' : 'truncate'}`}>{value || '—'}</div>
              </div>
            ))}
          </div>
          {duration !== null && (
            <div className="text-[10px] font-mono text-slate-600">
              Completed in <span className="text-slate-400">{duration}s</span>
            </div>
          )}
        </div>

        {/* Severity bar */}
        {r?.counts && (
          <div className="min-w-[160px]">
            <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-2">
              Findings ({r.totalFindings || 0})
            </div>
            <SeverityBar counts={r.counts} />
          </div>
        )}
      </div>

      {/* Summary */}
      {scan.summary && (
        <div className="border-t border-[#1a2332] pt-4">
          <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1.5">Summary</div>
          <p className="text-sm text-slate-400 leading-relaxed">{scan.summary}</p>
        </div>
      )}

      {/* Check matrix */}
      {checkEntries.length > 0 && (
        <div className="border-t border-[#1a2332] pt-4">
          <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-3">Security Checks</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {checkEntries.map(([key, val]) => {
              const s = CHECK_STYLE[val] || CHECK_STYLE.not_applicable;
              return (
                <div key={key} className={`flex items-center gap-2 px-3 py-2 rounded border ${s.bg}`}>
                  <span className={`font-mono font-bold text-sm ${s.color}`}>{s.icon}</span>
                  <div>
                    <div className="font-mono text-[10px] text-slate-500 capitalize">{key}</div>
                    <div className={`font-mono text-[10px] font-semibold ${s.color}`}>{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
