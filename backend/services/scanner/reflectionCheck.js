const axios = require("axios");
const { createFinding } = require("./helpers");

const REFLECTION_PAYLOAD = "SceureLite-reflection-test-12345";

const runReflectionCheck = async ({ normalizedTarget }) => {
  const findings = [];
  const checks = { reflection: "passed" };
  const scannedPaths = [];

  const url = new URL(normalizedTarget);
  const params = [...url.searchParams.keys()];

  if (params.length === 0) {
    checks.reflection = "not_applicable";
    return { findings, checks, scannedPaths };
  }

  for (const param of params) {
    const testUrl = new URL(normalizedTarget);
    testUrl.searchParams.set(param, REFLECTION_PAYLOAD);

    scannedPaths.push(testUrl.pathname + testUrl.search);

    try {
      const response = await axios.get(testUrl.toString(), {
        timeout: 8000,
        validateStatus: () => true,
      });

      const body =
        typeof response.data === "string" ?
          response.data
        : JSON.stringify(response.data);

      if (body.includes(REFLECTION_PAYLOAD)) {
        findings.push(
          createFinding({
            type: "input-reflection",
            severity: "medium",
            title: "User input is reflected in response",
            evidence: `Query parameter "${param}" was echoed back`,
            endpoint: testUrl.toString(),
            remediation: "Encode reflected content and validate user input.",
          }),
        );
      }
    } catch {
      // ignore
    }
  }

  if (findings.length > 0) {
    checks.reflection = "issues_found";
  }

  return { findings, checks, scannedPaths };
};

module.exports = {
  runReflectionCheck,
};
