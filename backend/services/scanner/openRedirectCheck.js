const axios = require("axios");
const { createFinding } = require("./helpers");

const REDIRECT_PARAMS = ["next", "url", "redirect", "return", "returnUrl"];
const EXTERNAL_TARGET = "https://attacker.example/redirect-check";

async function runOpenRedirectCheck({ normalizedTarget }) {
  const findings = [];
  const checks = {};
  const scannedPaths = [];

  if (!normalizedTarget) {
    return { findings, checks, scannedPaths };
  }

  for (const param of REDIRECT_PARAMS) {
    const testUrl = new URL(normalizedTarget);
    testUrl.searchParams.set(param, EXTERNAL_TARGET);
    scannedPaths.push(testUrl.pathname + testUrl.search);

    try {
      const response = await axios.get(testUrl.toString(), {
        timeout: 8000,
        maxRedirects: 0,
        validateStatus: () => true,
      });

      const location = response.headers?.location || "";
      if (location.startsWith(EXTERNAL_TARGET)) {
        findings.push(
          createFinding({
            type: "input-reflection",
            severity: "high",
            title: "Potential open redirect detected",
            evidence: `Parameter "${param}" redirected to ${location}`,
            endpoint: testUrl.toString(),
            remediation: "Restrict redirect destinations to trusted internal paths or allowlisted domains.",
          }),
        );
      }
    } catch {
      // Ignore individual parameter failures and keep testing the remaining inputs.
    }
  }

  return { findings, checks, scannedPaths };
}

module.exports = {
  runOpenRedirectCheck,
};
