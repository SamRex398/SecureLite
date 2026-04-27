const axios = require("axios");
const { createFinding } = require("./helpers");

const PAYLOADS = [" 'OR '1'='1", "<script>alert(1)</script>"];

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

const extractQueryParams = (targetUrl) => {
  const url = new URL(targetUrl);
  return [...url.searchParams.keys()];
};

const runInjectionCheck = async (targetUrl) => {
  const findings = [];
  const checks = { injection: "passed" };
  const scannedPaths = [];

  const params = extractQueryParams(targetUrl);

  if (params.length === 0) {
    checks.injection = "not_applicable";
    return { findings, checks, scannedPaths };
  }

  for (const param of params) {
    for (const payload of PAYLOADS) {
      const testUrl = new URL(targetUrl);
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

        const hasSqlError = SQL_ERROR_PATTERNS.some((pattern) => {
          body.includes(pattern);
        });

        if (hasSqlError) {
          findings.push(
            createFinding({
              type: "sqli",
              severity: "high",
              title: "possible SQL injection behavior detected",
              evidence: testUrl.toString(),
              remediation: "Use parameterized queries and sanitize user input",
            }),
          );
        }

        // if (body.includes(payload.toLowerCase())) {
        //   findings.push(
        //     createFinding({
        //       type: "input-reflection",
        //       severity: "medium",
        //       title: "Injected payload reflected in response",
        //       evidence: `Payload reflected for parameter "${param}"`,
        //       remediation: "sanitize and encode reflected user input.",
        //     }),
        //   );
        // }
      } catch {}
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
