export default function RecommendationsList({ recommendations }) {
  if (!recommendations?.length) return (
    <div className="panel p-5 text-center">
      <div className="font-mono text-xs text-slate-600">// no recommendations</div>
    </div>
  );

  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-[10px] text-[#00ff88]/50">{'///'}</span>
        <span className="font-display text-xs font-semibold tracking-widest uppercase text-slate-400">
          Recommendations
        </span>
        <span className="font-mono text-xs text-slate-600">({recommendations.length})</span>
      </div>
      <ol className="space-y-2">
        {recommendations.map((rec, i) => (
          <li
            key={i}
            className="flex gap-3 px-4 py-3 rounded-md border border-[#1a2332] bg-[#080b0f]
                       hover:border-[#00ff88]/20 hover:bg-[#00ff88]/5 transition-all duration-150"
          >
            <span className="font-mono text-[#00ff88]/50 text-sm shrink-0 mt-0.5 select-none">
              {String(i + 1).padStart(2, '0')}
            </span>
            <p className="text-sm text-slate-400 leading-relaxed">{rec}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
