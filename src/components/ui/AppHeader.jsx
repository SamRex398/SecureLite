const HEALTH_STYLES = {
  checking: { dot: 'bg-slate-500 animate-pulse', text: 'text-slate-500', label: 'Connecting' },
  ok:       { dot: 'bg-[#00ff88] animate-pulse', text: 'text-[#00ff88]', label: 'Online' },
  offline:  { dot: 'bg-[#ff3b5c]',              text: 'text-[#ff3b5c]', label: 'Offline' },
};

export default function AppHeader({ health, service }) {
  const hs = HEALTH_STYLES[health] || HEALTH_STYLES.checking;

  return (
    <header className="border-b border-[#1a2332] bg-[#0d1117]/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 shrink-0">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path
                d="M16 3L4 8v8c0 6.627 5.145 11.834 12 13 6.855-1.166 12-6.373 12-13V8L16 3z"
                stroke="#00ff88" strokeWidth="1.5"
                fill="rgba(0,255,136,0.08)"
                strokeLinejoin="round"
              />
              <path d="M11 16l3.5 3.5L21 12" stroke="#00ff88" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="font-display font-bold text-base text-slate-100 leading-none tracking-tight">
              Secure<span className="text-[#00ff88]">Lite</span>
            </div>
            <div className="font-mono text-[9px] text-slate-600 tracking-widest uppercase mt-0.5">
              {service || 'Vulnerability Scanner'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:block font-mono text-[10px] text-slate-700 border border-[#1a2332] px-2 py-0.5 rounded">
            v2.3
          </span>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${hs.dot}`} />
            <span className={`font-mono text-xs ${hs.text}`}>{hs.label}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
