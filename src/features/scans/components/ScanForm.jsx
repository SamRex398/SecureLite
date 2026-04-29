import { useState } from "react";

const BLOCKED = [
  { re: /^localhost$/i, msg: "localhost is not allowed" },
  { re: /^127\.0\.0\.1$/, msg: "127.0.0.1 is not allowed" },
  {
    re: /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/,
    msg: "Private IP addresses are not allowed",
  },
  { re: /::/, msg: "IPv6 is not supported yet" },
];

const CIDR_OR_RANGE =
  /^(\d{1,3}(\.\d{1,3}){3}\/([0-9]|[1-2][0-9]|3[0-2])|\d{1,3}(\.\d{1,3}){3}\s*-\s*\d{1,3}(\.\d{1,3}){3})$/;

function validate(raw) {
  const v = raw.trim();
  if (!v) return "Target is required";

  // Block only real CIDR/range inputs, not normal URLs.
  if (CIDR_OR_RANGE.test(v)) return "CIDR and range inputs are not supported";

  // If URL, validate hostname only.
  if (/^https?:\/\//i.test(v)) {
    try {
      const host = new URL(v).hostname;
      for (const { re, msg } of BLOCKED) {
        if (re.test(host)) return msg;
      }
      return null;
    } catch {
      return "Invalid target format";
    }
  }

  // Non-URL inputs: validate raw text.
  for (const { re, msg } of BLOCKED) {
    if (re.test(v)) return msg;
  }

  return null;
}

export default function ScanForm({ onSubmit, loading, error, clearError }) {
  const [target, setTarget] = useState("");
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (clearError) clearError();

    const err = validate(target);
    if (err) {
      setLocalError(err);
      return;
    }

    setLocalError(null);
    await onSubmit(target.trim());
  };

  const displayError = localError || error;

  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-xs text-[#00ff88] opacity-60">{">"}</span>
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
            onChange={(e) => {
              setTarget(e.target.value);
              setLocalError(null);
              if (clearError) clearError();
            }}
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
            className="px-1.5 py-3.5 bg-[#00ff88]/10 border border-[#00ff88]/40 text-[#00ff88]
                       font-mono text-sm font-semibold tracking-wider rounded-md
                       hover:bg-[#00ff88]/20 hover:border-[#00ff88]/70
                       disabled:opacity-30 disabled:cursor-not-allowed
                       transition-all duration-200 uppercase w-full"
          >
            {loading ? "Queuing…" : "[ Scan ]"}
          </button>

          <span className="text-slate-600 text-xs font-mono">
            {loading ? "Adding to queue…" : "URL · hostname · public IPv4"}
          </span>
        </div>
      </form>
    </div>
  );
}
