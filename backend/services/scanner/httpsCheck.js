const axios = require("axios");
const { createFinding } = require("./helpers");

async function runHttpsCheck(targetUrl) {
  const findings = [];
  const checks = { https: "passed" };
  const scannedPaths = [];

  const parsed = new URL(targetUrl);
  const httpsUrl = `https://${parsed.host}${parsed.pathname}${parsed.search}`;
  const httpUrl = `http://${parsed.host}${parsed.pathname}${parsed.search}`;

  try {
    const httpsResponse = await axios.get(httpsUrl, {
      timeout: 8000,
      maxRedirects: 5,
      validateStatus: () => true,
    });

    scannedPaths.push(new URL(httpsUrl).pathname || "/");

    if (httpsResponse.request?.res?.responseUrl?.startsWith("http://")) {
      findings.push(
        createFinding({
          type: "https",
          severity: "high",
          title: "HTTPS endpoint downgraded to HTTP",
          evidence: "HTTPS request did not remain on HTTPS",
          endpoint: httpsUrl,
          remediation: "Ensure HTTPS is correctly configured on the server.",
        }),
      );
    }
  } catch {
    findings.push(
      createFinding({
        type: "https",
        severity: "high",
        title: "HTTPS is not available",
        evidence: "HTTPS request failed",
        endpoint: httpsUrl,
        remediation: "Enable TLS and serve the site over HTTPS.",
      }),
    );
  }

  try {
    const httpResponse = await axios.get(httpUrl, {
      timeout: 8000,
      maxRedirects: 0,
      validateStatus: () => true,
    });

    const location = httpResponse.headers?.location || "";
    const redirectedToHttps =
      httpResponse.status >= 300 &&
      httpResponse.status < 400 &&
      location.startsWith("https://");

    if (!redirectedToHttps) {
      findings.push(
        createFinding({
          type: "https",
          severity: "medium",
          title: "HTTP does not redirect to HTTPS",
          evidence: `HTTP returned status ${httpResponse.status}`,
          endpoint: httpUrl,
          remediation: "Redirect all HTTP traffic to HTTPS.",
        }),
      );
    }
  } catch {
    // okay to ignore if HTTP is fully closed
  }

  if (findings.length > 0) {
    checks.https = "issues_found";
  }

  return { findings, checks, scannedPaths };
}

module.exports = {
  runHttpsCheck,
};
