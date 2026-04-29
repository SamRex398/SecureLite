import { useState } from 'react';

const SEV_CHIP = {
  critical: 'chip chip-critical',
  high:     'chip chip-high',
  medium:   'chip chip-medium',
  low:      'chip chip-low',
  info:     'chip chip-info',
};

const TYPE_ICON = {
  sqli:               '💉',
  xss:                '🔀',
  headers:            '📋',
  https:              '🔒',
  'exposed-endpoint': '🚪',
  'input-reflection': '🔄',
  network:            '🌐',
};

function FindingCard({ f }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-md overflow-hidden transition-all duration-200 ${
      f.severity === 'critical' ? 'border-[#ff3b5c]/30' :
      f.severity === 'high'     ? 'border-[#ff8c00]/25' :
      f.severity === 'medium'   ? 'border-[#f59e0b]/25' :
                                   'border-[#1a2332]'
    }`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-[#080b0f] hover:bg-[#0d1117] text-left transition-colors"
      >
        <span className="text-base shrink-0">{TYPE_ICON[f.type] || '🔍'}</span>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-sm text-slate-200 truncate">{f.title}</div>
          {f.endpoint && (
            <div className="font-mono text-[10px] text-slate-600 truncate mt-0.5">{f.endpoint}</div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={SEV_CHIP[f.severity]}>{f.severity}</span>
          <span className={`font-mono text-slate-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
        </div>
      </button>

      {open && (
        <div className="px-4 py-3 space-y-3 bg-[#080b0f]/60 border-t border-[#1a2332]"
             style={{ animation: 'fadeIn 0.2s ease' }}>
          {f.evidence && (
            <div>
              <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">Evidence</div>
              <pre className="font-mono text-xs text-slate-400 bg-[#0d1117] border border-[#1a2332] rounded p-3 overflow-x-auto whitespace-pre-wrap break-all">
                {f.evidence}
              </pre>
            </div>
          )}
          {f.remediation && (
            <div>
              <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">Remediation</div>
              <p className="text-xs text-slate-400 leading-relaxed">{f.remediation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FindingsList({ findings, title = 'Findings' }) {
  const [filter, setFilter] = useState('all');
  const sevs = ['all', 'critical', 'high', 'medium', 'low', 'info'];
  const filtered = filter === 'all' ? findings : findings.filter(f => f.severity === filter);

  if (!findings?.length) return (
    <div className="panel p-5 text-center">
      <div className="font-mono text-xs text-slate-600">// no {title.toLowerCase()}</div>
    </div>
  );

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[#00ff88]/50">{'///'}</span>
          <span className="font-display text-xs font-semibold tracking-widest uppercase text-slate-400">{title}</span>
          <span className="font-mono text-xs text-slate-600">({findings.length})</span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {sevs.map(s => {
            const count = s === 'all' ? findings.length : findings.filter(f => f.severity === s).length;
            if (s !== 'all' && count === 0) return null;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`font-mono text-[10px] uppercase px-2 py-1 rounded border transition-all ${
                  filter === s
                    ? s === 'all'
                      ? 'border-[#00ff88]/50 text-[#00ff88] bg-[#00ff88]/10'
                      : `${SEV_CHIP[s]} opacity-100`
                    : 'border-[#1a2332] text-slate-600 hover:border-slate-500'
                }`}
              >
                {s} <span className="ml-1 opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((f, i) => <FindingCard key={i} f={f} />)}
        {filtered.length === 0 && (
          <div className="text-center py-4 font-mono text-xs text-slate-600">// no {filter} findings</div>
        )}
      </div>
    </div>
  );
}
