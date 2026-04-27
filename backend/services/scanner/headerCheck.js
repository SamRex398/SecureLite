const axios = require("axios");
const { createFinding } = require("./helpers");

const runHeaderCheck = async (targetUrl) => {
  const findings = [];
  const checks = { headers: "passed" };
  const scannedPaths = [];

  try {
    const response = await axios.get(targetUrl, {
      timeout: 8000,
      validateStatus: () => true,
    });

    scannedPaths.push(new URL(targetUrl).pathname || "/");

    const headers = response.headers || {};

    const requiredHeaders = [
      ["content-security-policy", "Missing Content-Security-Policy header"],
      ["x-frame-options", "Missing X-Frame-Options header"],
      ["x-content-type-options", "Missing X-Content-Type-Options header"],
      ["strict-transport-security", "Missing Strict-Transport-Security header"],
      ["referrer-policy", "Missing Referrer-Policy header"],
    ];

    for (const [name, title] of requiredHeaders) {
      if (!headers[name]) {
        findings.push(
          createFinding({
            type: "headers",
            severity: "medium",
            title,
            evidence: `${name} header was not present`,
            endpoint: targetUrl,
            remediation: `Set the ${name} header with a secure value.`,
          }),
        );
      }
    }
  } catch {
    checks.headers = "not_applicable";
    return { findings, checks, scannedPaths };
  }

  if (findings.length > 0) {
    checks.headers = "issues_found";
  }

  return { findings, checks, scannedPaths };
};

module.exports = {
  runHeaderCheck,
};
