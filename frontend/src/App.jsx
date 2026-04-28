import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ||  "https://securelite.onrender.com").replace(/\/$/, "");

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

const targetTypeStyles = {
  url: "bg-cyan-500/15 text-cyan-100 ring-1 ring-cyan-300/40",
  hostname: "bg-violet-500/15 text-violet-100 ring-1 ring-violet-300/40",
  ip: "bg-lime-500/15 text-lime-100 ring-1 ring-lime-300/40",
};

const scanModeStyles = {
  web: "bg-sky-500/15 text-sky-100 ring-1 ring-sky-300/40",
  network: "bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-300/40",
  hybrid: "bg-fuchsia-500/15 text-fuchsia-100 ring-1 ring-fuchsia-300/40",
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

function TargetTypeBadge({ type }) {
  if (!type) return null;

  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] ${targetTypeStyles[type] || targetTypeStyles.hostname
        }`}
    >
      {type}
    </span>
  );
}

function ScanModeBadge({ mode }) {
  if (!mode) return null;

  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] ${scanModeStyles[mode] || scanModeStyles.web
        }`}
    >
      {mode}
    </span>
  );
}

function Panel({ eyebrow, title, action, children, className = "" }) {
  return (
    <section className={`rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur sm:p-7 ${className}`}>
      {(eyebrow || title || action) ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{eyebrow}</p>
            ) : null}
            {title ? (
              <h2 className="mt-2 font-display text-3xl leading-tight text-white">{title}</h2>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={eyebrow || title || action ? "mt-6" : ""}>{children}</div>
    </section>
  );
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

function ServiceRow({ service }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm text-slate-300 sm:grid-cols-[1.2fr_90px_90px_1fr]">
      <div className="min-w-0">
        <p className="font-medium text-white">{service.service || service.name || service.product || "Unknown service"}</p>
        <p className="truncate text-slate-400">
          {[service.product, service.version].filter(Boolean).join(" ") || service.evidence || service.banner || "Best-effort detection"}
        </p>
      </div>
      <div>
        <p className="text-slate-500">Port</p>
        <p className="font-medium text-white">{service.port ?? "-"}</p>
      </div>
      <div>
        <p className="text-slate-500">State</p>
        <p className="font-medium capitalize text-white">{service.state || "unknown"}</p>
      </div>
      <div className="min-w-0">
        <p className="text-slate-500">TLS / Banner</p>
        <p className="truncate text-white">
          {service.tls?.present
            ? `${service.tls.protocol || "TLS"}${service.tls.daysRemaining != null ? ` | ${service.tls.daysRemaining}d left` : ""}`
            : service.server || service.banner || "No banner"}
        </p>
      </div>
    </div>
  );
}

function RecommendationCard({ text, index }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Recommendation {index + 1}</p>
      <p className="mt-3 text-sm leading-7 text-slate-200">{text}</p>
    </article>
  );
}

function HistoryRow({ scan, onSelect, active }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(scan._id)}
      className={`w-full rounded-2xl border px-4 py-4 text-left transition hover:border-cyan-300/40 hover:bg-white/10 ${active ? "border-cyan-300/50 bg-cyan-400/10" : "border-white/10 bg-white/5"
        }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 truncate font-medium text-white">{scan.target}</p>
            <TargetTypeBadge type={scan.targetType} />
            <ScanModeBadge mode={scan.scanMode} />
          </div>
          <p className="mt-1 truncate text-sm text-slate-400">{scan.normalizedTarget}</p>
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

function ExportLink({ href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
    >
      {label}
    </a>
  );
}

export default function App() {
  const [target, setTarget] = useState("");
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

      const nextSelectedId = preferredId || selectedScanId || scans[0]?._id || "";

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
  const vulnerabilities = selectedScan?.vulnerabilities || [];
  const recommendations = selectedScan?.recommendations || [];
  const services = selectedScan?.services || [];
  const score = selectedScan?.score ?? 0;
  const riskBand = selectedScan?.report?.riskBand || "Low";
  const exportBase = selectedScan?._id ? `/scan/${selectedScan._id}/report` : "";

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
        body: JSON.stringify({ target }),
      });

      const newScanId = data.data?.id;
      setQueueMessage(data.message || "Scan queued successfully");
      setTarget("");

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
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top,rgba(110,231,249,0.18),transparent_48%)]" />
      <div className="pointer-events-none absolute right-0 top-24 h-80 w-80 rounded-full bg-fuchsia-500/8 blur-[120px]" />
      <div className="pointer-events-none absolute left-0 top-80 h-72 w-72 rounded-full bg-cyan-300/8 blur-[120px]" />

      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
        <header className="grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_380px]">
          <Panel
            eyebrow="Threat Exposure Console"
            title="Security scanning that reads like a real analyst workspace"
            action={
              <div className="inline-flex items-center gap-3 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 animate-pulse" />
                {health.status}
              </div>
            }
            className="relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="relative">
              <p className="max-w-3xl text-lg leading-8 text-slate-300">
                Queue URL, hostname, and public IP targets, inspect web and network posture side-by-side,
                and walk judges through findings, CVE matches, recommendations, and exportable reports without leaving one screen.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {statItems.map((item) => (
                  <StatCard key={item.label} label={item.label} value={item.value} tone={item.tone} />
                ))}
              </div>
            </div>
          </Panel>

          <div className="space-y-8">
            <Panel
              eyebrow="Queue Scan"
              title="Launch a new assessment"
              action={
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                  POST `/scan`
                </div>
              }
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block text-left">
                  <span className="mb-3 block text-sm text-slate-300">Target</span>
                  <input
                    type="text"
                    required
                    value={target}
                    onChange={(event) => setTarget(event.target.value)}
                    placeholder="https://example.com, example.com, or 8.8.8.8"
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
                <p className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                  {queueMessage}
                </p>
              ) : null}

              {error ? (
                <p className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </p>
              ) : null}
            </Panel>

            <Panel eyebrow="Selected Scan" title={selectedScan?.target || "No scan selected"}>
              <div className="flex flex-wrap items-center gap-3">
                <TargetTypeBadge type={selectedScan?.targetType} />
                <ScanModeBadge mode={selectedScan?.scanMode} />
                {selectedScan?.status ? (
                  <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyles[selectedScan.status] || statusStyles.queued}`}>
                    {selectedScan.status}
                  </span>
                ) : null}
              </div>

              <p className="mt-4 break-all text-sm text-slate-400">
                {selectedScan?.normalizedTarget || "Normalized target will appear here once a scan is selected."}
              </p>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_1.2fr]">
                <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Target Details</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-300">
                    <p>Type: {(selectedScan?.targetType || "unknown").toUpperCase()}</p>
                    <p>Scan Mode: {(selectedScan?.scanMode || "unknown").toUpperCase()}</p>
                    <p>Host: {selectedScan?.host || "Not available"}</p>
                    <p>Created: {formatTime(selectedScan?.createdAt)}</p>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Timeline</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-300">
                    <p>Created: {formatTime(selectedScan?.createdAt)}</p>
                    <p>Started: {formatTime(selectedScan?.report?.startedAt)}</p>
                    <p>Completed: {formatTime(selectedScan?.report?.completedAt)}</p>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Analyst Summary</p>
                  <p className="mt-4 text-sm leading-7 text-slate-300">
                    {selectedScan?.summary ||
                      selectedScan?.report?.errorMessage ||
                      "Queue a scan to start reviewing findings."}
                  </p>
                  {selectedScan?.status === "done" && selectedScan?._id ? (
                    <div className="mt-5 flex flex-wrap gap-3">
                      <ExportLink href={apiUrl(`${exportBase}.json`)} label="Download JSON" />
                      <ExportLink href={apiUrl(`${exportBase}.html`)} label="Open HTML Report" />
                      {/* <ExportLink href={apiUrl(`${exportBase}.pdf`)} label="Download PDF" /> */}
                    </div>
                  ) : null}
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
            </Panel>

            <Panel eyebrow="Findings" title="Evidence & remediation">
              <div className="space-y-4">
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
            </Panel>

            <Panel eyebrow="Services" title="Detected services">
              <div className="space-y-3">
                {services.length ? (
                  services.map((service, index) => (
                    <ServiceRow
                      key={`${service.port}-${service.name || "service"}-${index}`}
                      service={service}
                    />
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/10 px-5 py-10 text-center text-slate-400">
                    No detected services were recorded for this scan.
                  </div>
                )}
              </div>
            </Panel>

            <Panel eyebrow="Vulnerabilities" title="CVE & misconfiguration inventory">
              <div className="space-y-4">
                {vulnerabilities.length ? (
                  vulnerabilities.map((finding, index) => (
                    <FindingCard key={`${finding.title}-vuln-${index}`} finding={finding} />
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/10 px-5 py-10 text-center text-slate-400">
                    No matched vulnerabilities were recorded for this scan.
                  </div>
                )}
              </div>
            </Panel>

            <Panel eyebrow="Recommendations" title="Fix guidance">
              <div className="space-y-3">
                {recommendations.length ? (
                  recommendations.map((text, index) => (
                    <RecommendationCard key={`${text}-${index}`} text={text} index={index} />
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/10 px-5 py-10 text-center text-slate-400">
                    Recommendations will appear here when actionable issues are detected.
                  </div>
                )}
              </div>
            </Panel>
          </div>

          <Panel eyebrow="Operations Snapshot" title="Live posture">
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">API</p>
                <p className="mt-3 font-display text-2xl text-white">{health.service}</p>
                <p className="mt-2 text-sm capitalize text-slate-400">{health.status}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <StatCard label="Queued / Active" value={history.filter((scan) => ["queued", "running"].includes(scan.status)).length} tone="text-white" />
                <StatCard label="Recent Scans" value={history.length} tone="text-white" />
              </div>
            </div>
          </Panel>
        </header>

        <main className="mt-8 grid flex-1 gap-8 xl:grid-cols-[minmax(0,1.35fr)_380px]">


          <aside className="space-y-8 xl:sticky xl:top-8">
            <Panel
              eyebrow="Scan History"
              title="Recent targets"
              action={<div className="hidden text-sm text-slate-400 md:block">GET `/scan/history`</div>}
            >
              <div className="space-y-3 xl:max-h-[34rem] xl:overflow-y-auto xl:pr-1">
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
            </Panel>

            <Panel eyebrow="Checks Matrix" title="Module outcomes">
              <div className="grid gap-3 sm:grid-cols-2">
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
            </Panel>
          </aside>
        </main>
      </div>
    </div>
  );
}
