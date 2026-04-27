const cveDataset = require("../../data/cves.json");
const { createFinding } = require("../scanner/helpers");
const { normalizeServiceForLookup } = require("./versionNormalizer");

function matchCvesForServices(services = []) {
  const vulnerabilities = [];

  for (const service of services) {
    const keys = normalizeServiceForLookup(service);

    for (const key of keys) {
      const entries = cveDataset[key] || [];

      for (const entry of entries) {
        vulnerabilities.push(
          createFinding({
            type: "network",
            severity: entry.severity || "medium",
            title: `${entry.cve}: ${entry.title}`,
            evidence: `${service.product || service.name} ${service.version || ""}`.trim(),
            endpoint: `${service.name || "service"} on port ${service.port}`,
            remediation: entry.fix || "Upgrade the affected software to a patched version.",
          }),
        );
      }
    }
  }

  return vulnerabilities;
}

module.exports = {
  matchCvesForServices,
};
