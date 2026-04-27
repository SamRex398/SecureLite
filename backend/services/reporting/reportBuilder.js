function buildJsonReport(scan) {
  return {
    id: scan._id,
    target: scan.target,
    normalizedTarget: scan.normalizedTarget,
    targetType: scan.targetType,
    host: scan.host,
    scanMode: scan.scanMode,
    status: scan.status,
    score: scan.score,
    summary: scan.summary,
    timestamps: {
      createdAt: scan.createdAt,
      updatedAt: scan.updatedAt,
      startedAt: scan.report?.startedAt || null,
      completedAt: scan.report?.completedAt || null,
    },
    report: scan.report,
    web: scan.web,
    network: scan.network,
    services: scan.services || [],
    findings: scan.findings || [],
    vulnerabilities: scan.vulnerabilities || [],
    recommendations: scan.recommendations || [],
    artifacts: scan.artifacts || [],
  };
}

module.exports = {
  buildJsonReport,
};
