import { useState } from 'react';

const BLOCKED = [
  { re: /^localhost$/i,                                        msg: 'localhost is not allowed' },
  { re: /^127\.0\.0\.1$/,                                     msg: '127.0.0.1 is not allowed' },
  { re: /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/,      msg: 'Private IP addresses are not allowed' },
  { re: /[\/\-]/,                                              msg: 'CIDR and range inputs are not supported' },
  { re: /::/,                                                  msg: 'IPv6 is not supported yet' },
];

function validate(raw) {
  const v = raw.trim();
  if (!v) return 'Target is required';
  for (const { re, msg } of BLOCKED) {
    if (re.test(v)) return msg;
  }
  return null;
}

export default function ScanForm({ onSubmit, loading, error }) {
  const [target, setTarget] = useState('');
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate(target);
    if (err) { setLocalError(err); return; }
    setLocalError(null);
    await onSubmit(target.trim());
  };

  const displayError = localError || error;

  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-xs text-[#00ff88] opacity-60">{'>'}</span>
        <span className="font-display font-semibold text-sm tracking-widest uppercase text-slate-400">
          New Scan
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <span className="text-[#00ff88] opacity-50 font-mono text-sm">$</span>
          </div>
          <input
            type="text"
            value={target}
            onChange={e => { setTarget(e.target.value); setLocalError(null); }}
            placeholder="https://example.com  ·  hostname  ·  1.2.3.4"
            className="w-full bg-[#080b0f] border border-[#1a2332] rounded-md pl-8 pr-4 py-3
                       font-mono text-sm text-slate-200 placeholder-slate-600
                       focus:outline-none focus:border-[#00ff88]/50
                       focus:shadow-[0_0_0_1px_rgba(0,255,136,0.2)]
                       transition-all duration-200"
            disabled={loading}
            autoFocus
          />
          {loading && (
            <div className="absolute inset-y-0 right-3 flex items-center">
              <span className="w-4 h-4 border-2 border-[#00ff88]/30 border-t-[#00ff88] rounded-full animate-spin" />
            </div>
          )}
        </div>

        {displayError && (
          <div className="mt-2 flex items-start gap-2 text-xs font-mono text-[#ff3b5c]">
            <span className="mt-0.5 shrink-0">⚠</span>
            <span>{displayError}</span>
          </div>
        )}

        <div className="flex items-center gap-3 mt-4">
          <button
            type="submit"
            disabled={loading || !target.trim()}
            className="px-5 py-2.5 bg-[#00ff88]/10 border border-[#00ff88]/40 text-[#00ff88]
                       font-mono text-sm font-semibold tracking-wider rounded-md
                       hover:bg-[#00ff88]/20 hover:border-[#00ff88]/70
                       disabled:opacity-30 disabled:cursor-not-allowed
                       transition-all duration-200 uppercase"
          >
            {loading ? 'Queuing…' : '[ Scan ]'}
          </button>
          <span className="text-slate-600 text-xs font-mono">
            {loading ? 'Adding to queue…' : 'URL · hostname · public IPv4'}
          </span>
        </div>
      </form>
    </div>
  );
}
