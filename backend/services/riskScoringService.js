exports.calculateRiskScore = (findings = []) => {
  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  let score = 100;
  let riskBand = "Low";

  for (const finding of findings) {
    const severity = finding.severity;

    if (counts[severity] !== undefined) {
      counts[severity] += 1;
    }

    if (finding.severity === "critical") score -= 40;
    else if (finding.severity === "high") score -= 25;
    else if (finding.severity === "medium") score -= 15;
    else if (finding.severity === "low") score -= 5;
    else if (finding.severity === "info") score -= 1;
  }

  score = Math.max(0, Math.min(100, score));
  if (score <= 75) riskBand = "Medium";
  if (score <= 50) riskBand = "High";
  if (score <= 25) riskBand = "Critical";

  return {
    score,
    riskBand,
    counts,
  };
};
