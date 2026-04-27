import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const severityStyles = {
  critical: "bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/40",
  high: "bg-orange-500/15 text-orange-200 ring-1 ring-orange-400/40",
  medium: "bg-amber-500/15 text-amber-100 ring-1 ring-amber-300/40",
  low: "bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-300/40",
  info: "bg-cyan-500/15 text-cyan-100 ring-1 ring-cyan-300/40",
};

const statusStyles = {
  queued: "text-amber-200 bg-amber-500/15 ring-1 ring-amber-300/40",
  running: "text-cyan-100 bg-cyan-500/15 ring-1 ring-cyan-300/40",
  done: "text-emerald-100 bg-emerald-500/15 ring-1 ring-emerald-300/40",
  failed: "text-rose-100 bg-rose-500/15 ring-1 ring-rose-300/40",
};

const riskBandStyles = {
  Low: "text-emerald-100",
  Medium: "text-amber-100",
  High: "text-orange-200",
  Critical: "text-rose-200",
};

function apiUrl(path) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

async function request(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }

  return payload;
}

function formatTime(value) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function normalizeHealth(data) {
  if (!data) return { status: "unknown", service: "Unavailable" };
  return {
    status: data.status || "ok",
    service: data.service || "VScanner API",
  };
}

function StatCard({ label, value, tone = "text-white" }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{label}</p>
      <p className={`mt-3 font-display text-3xl ${tone}`}>{value}</p>
    </div>
  );
}

function FindingCard({ finding }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/45 p-5 shadow-glow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{finding.type}</p>
          <h3 className="mt-2 font-display text-xl text-white">{finding.title}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${severityStyles[finding.severity] || severityStyles.info}`}>
          {finding.severity}
        </span>
      </div>
      <div className="mt-5 space-y-3 text-sm text-slate-300">
        <p>
          <span className="text-slate-500">Endpoint:</span> {finding.endpoint}
        </p>
        <p>
          <span className="text-slate-500">Evidence:</span> {finding.evidence}
        </p>
        <p>
          <span className="text-slate-500">Remediation:</span> {finding.remediation}
        </p>
      </div>
    </article>
  );
}

function HistoryRow({ scan, onSelect, active }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(scan._id)}
      className={`w-full rounded-2xl border px-4 py-4 text-left transition hover:border-cyan-300/40 hover:bg-white/10 ${active
        ? "border-cyan-300/50 bg-cyan-400/10"
        : "border-white/10 bg-white/5"
        }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-white">{scan.targetUrl}</p>
          <p className="mt-1 truncate text-sm text-slate-400">{scan.normalizedUrl}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyles[scan.status] || statusStyles.queued}`}>
          {scan.status}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
        <div className="text-slate-300">{formatTime(scan.createdAt)}</div>
        <div className="font-semibold text-white">Score {scan.score ?? 0}</div>
      </div>
    </button>
  );
}

export default function App() {
  const [targetUrl, setTargetUrl] = useState("");
  const [health, setHealth] = useState({ status: "checking", service: "VScanner API" });
  const [history, setHistory] = useState([]);
  const [selectedScanId, setSelectedScanId] = useState("");
  const [selectedScan, setSelectedScan] = useState(null);
  const [queueMessage, setQueueMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  async function loadHealth() {
    try {
      const data = await request("/health");
      setHealth(normalizeHealth(data));
    } catch (err) {
      setHealth({
        status: "offline",
        service: err.message || "Backend unavailable",
      });
    }
  }

  async function loadHistory(preferredId) {
    setIsLoadingHistory(true);

    try {
      const data = await request("/scan/history?limit=10");
      const scans = data.data || [];
      setHistory(scans);

      const nextSelectedId =
        preferredId || selectedScanId || scans[0]?._id || "";

      if (nextSelectedId) {
        setSelectedScanId(nextSelectedId);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingHistory(false);
    }
  }

  async function loadScan(id) {
    if (!id) return;

    try {
      const data = await request(`/scan/${id}`);
      setSelectedScan(data.data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadHealth();
    loadHistory();
  }, []);

  useEffect(() => {
    if (!selectedScanId) return;
    loadScan(selectedScanId);
  }, [selectedScanId]);

  useEffect(() => {
    if (!selectedScanId || !selectedScan) return undefined;
    if (!["queued", "running"].includes(selectedScan.status)) return undefined;

    const intervalId = window.setInterval(async () => {
      await loadScan(selectedScanId);
      await loadHistory(selectedScanId);
    }, 3500);

    return () => window.clearInterval(intervalId);
  }, [selectedScanId, selectedScan]);

  const selectedCounts = selectedScan?.report?.counts || {};
  const checks = selectedScan?.report?.checks || {};
  const findings = selectedScan?.findings || [];
  const score = selectedScan?.score ?? 0;
  const riskBand = selectedScan?.report?.riskBand || "Low";

  const statItems = useMemo(
    () => [
      { label: "Risk Score", value: score, tone: "text-white" },
      {
        label: "Risk Band",
        value: riskBand,
        tone: riskBandStyles[riskBand] || "text-white",
      },
      {
        label: "Findings",
        value: selectedScan?.report?.totalFindings ?? findings.length,
        tone: "text-slate-100",
      },
      {
        label: "Status",
        value: selectedScan?.status || "idle",
        tone: "text-slate-100 capitalize",
      },
    ],
    [findings.length, riskBand, score, selectedScan],
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setQueueMessage("");
    setIsSubmitting(true);

    try {
      const data = await request("/scan", {
        method: "POST",
        body: JSON.stringify({ url: targetUrl }),
      });

      const newScanId = data.data?.id;
      setQueueMessage(data.message || "Scan queued successfully");
      setTargetUrl("");

      if (newScanId) {
        setSelectedScanId(newScanId);
        await loadHistory(newScanId);
        await loadScan(newScanId);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top,rgba(110,231,249,0.22),transparent_45%)]" />
      <div className="pointer-events-none absolute left-1/2 top-40 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-300/10 blur-[120px]" />

      <div className="mx-auto flex min-h-screen w-full max-w-[1360px] flex-col px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
        <header className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100 backdrop-blur">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 animate-pulse" />
            Attack surface intelligence for every target you queue
          </div>
          <h1 className="mt-6 font-display text-5xl leading-none text-white sm:text-6xl">
            SecureLite Scanner
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            Launch scans, watch them progress, and review findings in a focused security dashboard built for quick triage.
          </p>

          <div className="mt-8 grid w-full gap-4 sm:grid-cols-2 lg:max-w-3xl">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">API Health</p>
              <p className="mt-3 font-display text-2xl text-white">{health.service}</p>
              <p className="mt-2 text-sm capitalize text-slate-300">{health.status}</p>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur">
              <div className="absolute right-4 top-4 h-20 w-20 rounded-full bg-lime-300/10 blur-2xl" />
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Recent Scans</p>
              <p className="mt-3 font-display text-2xl text-white">{history.length}</p>
              <p className="mt-2 text-sm text-slate-300">Latest activity at your fingertips</p>
            </div>
          </div>
        </header>

        <main className="mx-auto mt-10 flex w-full max-w-6xl flex-1 flex-col gap-8">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-glow backdrop-blur sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Queue Scan</p>
                <h2 className="mt-2 font-display text-3xl text-white">Target a live surface</h2>
              </div>
              <div className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                POST `/scan`
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-5xl space-y-4">
              <label className="block text-left">
                <span className="mb-3 block text-sm text-slate-300">Target URL</span>
                <input
                  type="url"
                  required
                  value={targetUrl}
                  onChange={(event) => setTargetUrl(event.target.value)}
                  placeholder="https://example.com"
                  className="w-full rounded-2xl border border-cyan-300/25 bg-slate-950/70 px-5 py-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-2xl bg-cyan-300 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Queueing..." : "Start scan"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setQueueMessage("");
                    loadHealth();
                    loadHistory(selectedScanId);
                  }}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-white transition hover:bg-white/10"
                >
                  Refresh dashboard
                </button>
              </div>
            </form>

            {queueMessage ? (
              <p className="mx-auto mt-4 max-w-5xl rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                {queueMessage}
              </p>
            ) : null}

            {error ? (
              <p className="mx-auto mt-4 max-w-5xl rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </p>
            ) : null}
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statItems.map((item) => (
              <StatCard key={item.label} label={item.label} value={item.value} tone={item.tone} />
            ))}
          </section>

          <section className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.85fr)]">
            <div className="space-y-8">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Selected Scan</p>
                    <h2 className="mt-2 break-words font-display text-3xl leading-tight text-white">
                      {selectedScan?.targetUrl || "No scan selected"}
                    </h2>
                  </div>
                  {selectedScan?.status ? (
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyles[selectedScan.status] || statusStyles.queued}`}>
                      {selectedScan.status}
                    </span>
                  ) : null}
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Timeline</p>
                    <div className="mt-4 space-y-3 text-sm text-slate-300">
                      <p>Created: {formatTime(selectedScan?.createdAt)}</p>
                      <p>Started: {formatTime(selectedScan?.report?.startedAt)}</p>
                      <p>Completed: {formatTime(selectedScan?.report?.completedAt)}</p>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Summary</p>
                    <p className="mt-4 text-sm leading-7 text-slate-300">
                      {selectedScan?.summary ||
                        selectedScan?.report?.errorMessage ||
                        "Queue a scan to start reviewing findings."}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {["critical", "high", "medium", "low", "info"].map((level) => (
                    <div key={level} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{level}</p>
                      <p className="mt-2 font-display text-2xl text-white">{selectedCounts[level] ?? 0}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur sm:p-8">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Findings</p>
                <h2 className="mt-2 font-display text-3xl text-white">Evidence & remediation</h2>

                <div className="mt-6 space-y-4">
                  {findings.length ? (
                    findings.map((finding, index) => (
                      <FindingCard key={`${finding.title}-${index}`} finding={finding} />
                    ))
                  ) : (
                    <div className="rounded-3xl border border-dashed border-white/10 px-5 py-12 text-center text-slate-400">
                      Findings will appear here once a scan completes.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <aside className="space-y-8 xl:sticky xl:top-8">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Scan History</p>
                    <h2 className="mt-2 font-display text-3xl text-white">Recent targets</h2>
                  </div>
                  <div className="hidden text-sm text-slate-400 md:block">GET `/scan/history`</div>
                </div>

                <div className="mt-6 space-y-3 xl:max-h-[34rem] xl:overflow-y-auto xl:pr-1">
                  {isLoadingHistory ? (
                    <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-slate-400">
                      Loading recent scans...
                    </div>
                  ) : history.length ? (
                    history.map((scan) => (
                      <HistoryRow
                        key={scan._id}
                        scan={scan}
                        onSelect={setSelectedScanId}
                        active={scan._id === selectedScanId}
                      />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-slate-400">
                      No scans yet. Queue your first target to populate the dashboard.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Checks Matrix</p>
                    <h2 className="mt-2 font-display text-3xl text-white">Module outcomes</h2>
                  </div>
                  <div className="h-16 w-16 rounded-full bg-cyan-300/10 blur-2xl" />
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Injection", checks.injection],
                    ["Headers", checks.headers],
                    ["HTTPS", checks.https],
                    ["Sensitive Paths", checks.sensitivePaths],
                    ["Ports", checks.ports],
                    ["Reflection", checks.reflection],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                      <p className="text-sm text-slate-400">{label}</p>
                      <p className="mt-2 font-medium capitalize text-white">
                        {value ? String(value).replaceAll("_", " ") : "not available"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}
