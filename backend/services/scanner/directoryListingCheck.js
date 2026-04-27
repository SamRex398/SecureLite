const axios = require("axios");
const { createFinding } = require("./helpers");

const PATHS = ["/uploads/", "/assets/", "/images/", "/backup/", "/files/"];

function isDirectoryIndex(body = "") {
  const text = body.toLowerCase();
  return (
    text.includes("<title>index of") ||
    text.includes("directory listing for") ||
    text.includes("parent directory") ||
    text.includes("index of /")
  );
}

async function runDirectoryListingCheck({ normalizedTarget }) {
  const findings = [];
  const checks = {};
  const scannedPaths = [];

  const base = new URL(normalizedTarget);

  for (const path of PATHS) {
    const testUrl = `${base.origin}${path}`;
    scannedPaths.push(path);

    try {
      const response = await axios.get(testUrl, {
        timeout: 8000,
        validateStatus: () => true,
      });

      const body =
        typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data || {});

      if (response.status === 200 && isDirectoryIndex(body)) {
        findings.push(
          createFinding({
            type: "exposed-endpoint",
            severity: "medium",
            title: "Directory listing detected",
            evidence: `Directory index markers found at ${path}`,
            endpoint: testUrl,
            remediation: "Disable directory listing and restrict access to exposed file directories.",
          }),
        );
      }
    } catch {
      // ignore individual directory probe failures
    }
  }

  return { findings, checks, scannedPaths };
}

module.exports = {
  runDirectoryListingCheck,
};
