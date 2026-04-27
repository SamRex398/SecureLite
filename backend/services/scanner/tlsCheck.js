const { createFinding } = require("./helpers");
const { inspectTls } = require("../network/tlsInspector");

async function runTlsCheck({ host, normalizedTarget }) {
  const findings = [];
  const checks = {};
  const scannedPaths = [];

  if (!host) {
    return { findings, checks, scannedPaths };
  }

  const tlsInfo = await inspectTls(host, 443);
  scannedPaths.push(`${host}:443`);

  if (!tlsInfo.present) {
    findings.push(
      createFinding({
        type: "https",
        severity: "high",
        title: "TLS certificate is missing on port 443",
        evidence: `No certificate was presented by ${host}:443`,
        endpoint: normalizedTarget,
        remediation: "Configure TLS with a valid certificate on the HTTPS service.",
      }),
    );

    return { findings, checks, scannedPaths };
  }

  if (tlsInfo.validTo && tlsInfo.validTo.getTime() < Date.now()) {
    findings.push(
      createFinding({
        type: "https",
        severity: "critical",
        title: "TLS certificate has expired",
        evidence: `Certificate expired on ${tlsInfo.validTo.toISOString()}`,
        endpoint: normalizedTarget,
        remediation: "Renew the TLS certificate immediately and deploy the new chain.",
      }),
    );
  } else if (typeof tlsInfo.daysRemaining === "number" && tlsInfo.daysRemaining <= 30) {
    findings.push(
      createFinding({
        type: "https",
        severity: "medium",
        title: "TLS certificate is nearing expiry",
        evidence: `${tlsInfo.daysRemaining} day(s) remain before expiry`,
        endpoint: normalizedTarget,
        remediation: "Renew the TLS certificate before it expires.",
      }),
    );
  }

  if (tlsInfo.selfSigned) {
    findings.push(
      createFinding({
        type: "https",
        severity: "high",
        title: "Self-signed TLS certificate detected",
        evidence: `Certificate subject and issuer both resolve to "${tlsInfo.subject}"`,
        endpoint: normalizedTarget,
        remediation: "Replace the self-signed certificate with one issued by a trusted CA.",
      }),
    );
  }

  if (tlsInfo.protocol && ["TLSv1", "TLSv1.1", "SSLv3", "SSLv2"].includes(tlsInfo.protocol)) {
    findings.push(
      createFinding({
        type: "https",
        severity: "high",
        title: "Weak TLS protocol detected",
        evidence: `Service negotiated ${tlsInfo.protocol}`,
        endpoint: normalizedTarget,
        remediation: "Disable legacy TLS protocols and require TLS 1.2 or newer.",
      }),
    );
  }

  return { findings, checks, scannedPaths };
}

module.exports = {
  runTlsCheck,
};
