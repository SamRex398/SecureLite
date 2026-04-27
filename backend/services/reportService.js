exports.buildReport = ({
  findings = [],
  riskBand = "Low",
  counts = {},
  checks = {},
  scannedPaths = [],
}) => {
  const highestSeverity =
    findings.some((f) => f.severity === "critical") ? "critical"
    : findings.some((f) => f.severity === "high") ? "high"
    : findings.some((f) => f.severity === "medium") ? "medium"
    : findings.some((f) => f.severity === "low") ? "low"
    : findings.some((f) => f.severity === "info") ? "info"
    : null;

  const summary =
    highestSeverity ?
      `Scan completed with ${findings.length} finding(s). Highest severity: ${highestSeverity}.`
    : `Scan completed with ${findings.length} finding(s). No significant issues detected`;

  return {
    summary,
    riskBand,
    totalFindings: findings.length,
    counts,
    checks,
    scannedPaths,
    errorMessage: "",
  };
};
