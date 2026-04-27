const { runInjectionCheck } = require("./injectionCheck");
const { runHeaderCheck } = require("./headerCheck");
const { runHttpsCheck } = require("./httpsCheck");
const { runReflectionCheck } = require("./reflectionCheck");
const { runSensitivePathsCheck } = require("./sentitivePathCheck");
const { runTlsCheck } = require("./tlsCheck");
const { runOpenRedirectCheck } = require("./openRedirectCheck");
const { runDirectoryListingCheck } = require("./directoryListingCheck");
const { scanPorts } = require("../network/portScanner");
const { detectServices } = require("../network/serviceDetector");
const { matchCvesForServices } = require("../vulnerabilities/cveMatcher");
const { buildRecommendations } = require("../recommendations/recommendationEngine");
const { createFinding } = require("./helpers");

const DEFAULT_WEB_CHECKS = {
  injection: "not_applicable",
  headers: "not_applicable",
  https: "not_applicable",
  sensitivePaths: "not_applicable",
  reflection: "not_applicable",
};

const DEFAULT_NETWORK_CHECKS = {
  ports: "not_applicable",
};

const RISKY_SERVICE_PORTS = {
  21: {
    severity: "medium",
    title: "FTP service is publicly exposed",
    remediation: "Disable FTP or restrict it to trusted administrative clients.",
  },
  22: {
    severity: "low",
    title: "SSH service is publicly exposed",
    remediation: "Restrict SSH to trusted IP ranges and enforce key-based authentication.",
  },
  25: {
    severity: "medium",
    title: "SMTP service is publicly exposed",
    remediation: "Restrict SMTP to intended mail relays and require authentication where applicable.",
  },
  445: {
    severity: "high",
    title: "SMB service is publicly exposed",
    remediation: "Block SMB from internet exposure and limit access to internal trusted networks only.",
  },
  3306: {
    severity: "high",
    title: "MySQL service is publicly exposed",
    remediation: "Restrict database access to trusted application hosts and disable public exposure.",
  },
  5432: {
    severity: "high",
    title: "PostgreSQL service is publicly exposed",
    remediation: "Restrict database access to trusted application hosts and disable public exposure.",
  },
  6379: {
    severity: "critical",
    title: "Redis service is publicly exposed",
    remediation: "Bind Redis to trusted interfaces only and enforce authentication or private network access.",
  },
};

function shouldRunWeb(scanMode) {
  return scanMode === "web" || scanMode === "hybrid";
}

function shouldRunNetwork(scanMode) {
  return scanMode === "network" || scanMode === "hybrid";
}

function classifyRiskyServices(host, services = []) {
  const findings = [];

  for (const service of services) {
    const template = RISKY_SERVICE_PORTS[service.port];
    if (!template) {
      continue;
    }

    findings.push(
      createFinding({
        type: "network",
        severity: template.severity,
        title: template.title,
        evidence: `${service.name || service.product || "Service"} detected on ${host}:${service.port}`,
        endpoint: `${host}:${service.port}`,
        remediation: template.remediation,
      }),
    );
  }

  return findings;
}

async function runWebChecks(targetContext) {
  const web = {
    checks: { ...DEFAULT_WEB_CHECKS },
    scannedPaths: [],
    findings: [],
  };

  const results = await Promise.allSettled([
    runInjectionCheck(targetContext),
    runHeaderCheck(targetContext),
    runHttpsCheck(targetContext),
    runSensitivePathsCheck(targetContext),
    runReflectionCheck(targetContext),
    runTlsCheck(targetContext),
    runOpenRedirectCheck(targetContext),
    runDirectoryListingCheck(targetContext),
  ]);

  for (const result of results) {
    if (result.status !== "fulfilled") {
      continue;
    }

    web.findings.push(...(result.value.findings || []));
    Object.assign(web.checks, result.value.checks || {});
    web.scannedPaths.push(...(result.value.scannedPaths || []));
  }

  web.scannedPaths = [...new Set(web.scannedPaths)];

  return web;
}

async function runNetworkChecks(targetContext) {
  const network = {
    checks: { ...DEFAULT_NETWORK_CHECKS },
    scannedHosts: [],
    findings: [],
    services: [],
  };

  const portResults = await scanPorts(targetContext.host);
  const services = await detectServices(targetContext.host, portResults);
  const riskyFindings = classifyRiskyServices(targetContext.host, services);

  network.checks.ports = riskyFindings.length > 0 ? "issues_found" : "passed";
  network.scannedHosts = portResults.map((result) => `${targetContext.host}:${result.port}`);
  network.services = services;
  network.findings.push(...riskyFindings);

  return network;
}

async function runScanner(targetContext) {
  const { scanMode } = targetContext;

  const web = shouldRunWeb(scanMode)
    ? await runWebChecks(targetContext)
    : {
        checks: { ...DEFAULT_WEB_CHECKS },
        scannedPaths: [],
        findings: [],
      };

  const network = shouldRunNetwork(scanMode)
    ? await runNetworkChecks(targetContext)
    : {
        checks: { ...DEFAULT_NETWORK_CHECKS },
        scannedHosts: [],
        findings: [],
        services: [],
      };

  const cveFindings = matchCvesForServices(network.services);
  const vulnerabilities = [...web.findings, ...network.findings, ...cveFindings];
  const recommendations = buildRecommendations({
    findings: [...web.findings, ...network.findings],
    vulnerabilities,
  });

  return {
    scanMode,
    web,
    network,
    services: network.services,
    vulnerabilities,
    recommendations,
    artifacts: [],

    // Backward-compatible aggregate fields for the current worker/report pipeline
    findings: vulnerabilities,
    checks: {
      ...web.checks,
      ...network.checks,
    },
    scannedPaths: [...new Set([...web.scannedPaths, ...network.scannedHosts])],
  };
}

module.exports = {
  runScanner,
};
