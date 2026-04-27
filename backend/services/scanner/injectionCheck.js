const axios = require("axios");
const { createFinding } = require("./helpers");

const PAYLOADS = ["' OR '1'='1", "<script>alert(1)</script>"];

const SQL_ERROR_PATTERNS = [
  "sql syntax",
  "mysql",
  "postgres",
  "sqlite",
  "ora",
  "syntax error",
  "unclosed quotation mark",
  "odbc",
];

const extractQueryParams = (normalizedTarget) => {
  const url = new URL(normalizedTarget);
  return [...url.searchParams.keys()];
};

const runInjectionCheck = async ({ normalizedTarget }) => {
  const findings = [];
  const checks = { injection: "passed" };
  const scannedPaths = [];

  const params = extractQueryParams(normalizedTarget);

  if (params.length === 0) {
    checks.injection = "not_applicable";
    return { findings, checks, scannedPaths };
  }

  for (const param of params) {
    for (const payload of PAYLOADS) {
      const testUrl = new URL(normalizedTarget);
      testUrl.searchParams.set(param, payload);

      scannedPaths.push(testUrl.pathname + testUrl.search);

      try {
        const response = await axios.get(testUrl.toString(), {
          timeout: 8000,
          validateStatus: () => true,
        });

        const body =
          typeof response.data === "string" ?
            response.data.toLowerCase()
          : JSON.stringify(response.data).toLowerCase();

        const hasSqlError = SQL_ERROR_PATTERNS.some((pattern) =>
          body.includes(pattern),
        );

        if (hasSqlError) {
          findings.push(
            createFinding({
              type: "sqli",
              severity: "high",
              title: "Possible SQL injection behavior detected",
              evidence: `Response contains SQL error indicators for parameter "${param}"`,
              endpoint: testUrl.toString(),
              remediation: "Use parameterized queries and sanitize user input.",
            }),
          );
        }
      } catch {
        // ignore transient request failures
      }
    }
  }

  if (findings.length > 0) {
    checks.injection = "issues_found";
  }

  return { findings, checks, scannedPaths };
};

module.exports = {
  runInjectionCheck,
};
