import { useState } from 'react';

const STATE_STYLE = {
  open:     'text-[#00ff88] border-[#00ff88]/30 bg-[#00ff88]/8',
  closed:   'text-slate-500 border-slate-600/30 bg-transparent',
  filtered: 'text-[#f59e0b] border-[#f59e0b]/30 bg-[#f59e0b]/8',
  unknown:  'text-slate-600 border-slate-700/30 bg-transparent',
};

function TlsBadge({ tls }) {
  if (!tls.present) return (
    <span className="chip" style={{ background: 'rgba(255,59,92,0.1)', color: '#ff3b5c', border: '1px solid rgba(255,59,92,0.3)' }}>
      No TLS
    </span>
  );
  const expiring = tls.daysRemaining != null && tls.daysRemaining < 30;
  const color = tls.selfSigned ? '#ff8c00' : expiring ? '#f59e0b' : '#00ff88';
  return (
    <span className="chip" style={{ background: `${color}15`, color, border: `1px solid ${color}40` }}>
      {tls.selfSigned ? '⚠ Self-signed' : expiring ? `⚠ Expires ${tls.daysRemaining}d` : '✓ TLS OK'}
    </span>
  );
}

function ServiceRow({ svc }) {
  const [open, setOpen] = useState(false);
  const hasExtra = svc.banner || svc.product || svc.version || svc.tls;

  return (
    <div className="border border-[#1a2332] rounded-md overflow-hidden">
      <button
        onClick={() => hasExtra && setOpen(o => !o)}
        className={`w-full flex items-center gap-3 px-4 py-3 bg-[#080b0f] text-left transition-colors ${hasExtra ? 'hover:bg-[#0d1117]' : 'cursor-default'}`}
      >
        <div className="shrink-0 w-16 text-right">
          <span className="font-mono font-bold text-sm text-slate-300">{svc.port}</span>
          <span className="font-mono text-[10px] text-slate-600">/{svc.protocol}</span>
        </div>
        <span className={`chip shrink-0 border ${STATE_STYLE[svc.state] || STATE_STYLE.unknown}`}>{svc.state}</span>
        <div className="flex-1 min-w-0">
          <span className="font-mono text-sm text-slate-300">{svc.name}</span>
          {svc.server && <span className="font-mono text-xs text-slate-600 ml-2">{svc.server}</span>}
        </div>
        {svc.tls && <TlsBadge tls={svc.tls} />}
        {hasExtra && (
          <span className={`font-mono text-slate-600 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}>▾</span>
        )}
      </button>

      {open && hasExtra && (
        <div className="px-4 py-3 bg-[#080b0f]/60 border-t border-[#1a2332]" style={{ animation: 'fadeIn 0.2s ease' }}>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            {svc.product && (
              <div>
                <div className="text-slate-600 text-[10px] uppercase tracking-widest mb-0.5">Product</div>
                <div className="text-slate-300">{svc.product}</div>
              </div>
            )}
            {svc.version && (
              <div>
                <div className="text-slate-600 text-[10px] uppercase tracking-widest mb-0.5">Version</div>
                <div className="text-slate-300">{svc.version}</div>
              </div>
            )}
            {svc.tls?.protocol && (
              <div>
                <div className="text-slate-600 text-[10px] uppercase tracking-widest mb-0.5">TLS Protocol</div>
                <div className="text-slate-300">{svc.tls.protocol}</div>
              </div>
            )}
            {svc.tls?.cipher && (
              <div>
                <div className="text-slate-600 text-[10px] uppercase tracking-widest mb-0.5">Cipher</div>
                <div className="text-slate-300">{svc.tls.cipher}</div>
              </div>
            )}
            {svc.tls?.issuer && (
              <div className="col-span-2">
                <div className="text-slate-600 text-[10px] uppercase tracking-widest mb-0.5">Issuer</div>
                <div className="text-slate-300">{svc.tls.issuer}</div>
              </div>
            )}
          </div>
          {svc.banner && (
            <div className="mt-3">
              <div className="text-slate-600 text-[10px] uppercase tracking-widest mb-1">Banner</div>
              <pre className="font-mono text-[11px] text-slate-500 bg-[#0d1117] border border-[#1a2332] rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
                {svc.banner}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ServicesList({ services }) {
  if (!services?.length) return (
    <div className="panel p-5 text-center">
      <div className="font-mono text-xs text-slate-600">// no services discovered</div>
    </div>
  );

  const open = services.filter(s => s.state === 'open');
  const other = services.filter(s => s.state !== 'open');

  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-[10px] text-[#00ff88]/50">{'///'}</span>
        <span className="font-display text-xs font-semibold tracking-widest uppercase text-slate-400">Services</span>
        <span className="font-mono text-xs text-slate-600">({services.length})</span>
        {open.length > 0 && <span className="chip chip-low ml-auto">{open.length} open</span>}
      </div>
      <div className="space-y-2">
        {[...open, ...other].map((svc, i) => <ServiceRow key={i} svc={svc} />)}
      </div>
    </div>
  );
}
