const { runInjectionCheck } = require("./injectionCheck");
const { runHeaderCheck } = require("./headerCheck");
const { runHttpsCheck } = require("./httpsCheck");
// const {} = require("./sensitivePathsCheck");
const { runReflectionCheck } = require("./reflectionCheck");
const { runPortCheck } = require("./portCheck");
const { runSensitivePathsCheck } = require("./sentitivePathCheck");

const runScanner = async (targetUrl) => {
  const result = {
    findings: [],
    checks: {
      injection: "not_applicable",
      headers: "not_applicable",
      https: "not_applicable",
      sensitivePaths: "not_applicable",
      reflection: "not_applicable",
      ports: "not_applicable",
    },
    scannedPaths: [],
  };

  const checks = await Promise.allSettled([
    runInjectionCheck(targetUrl),
    runHeaderCheck(targetUrl),
    runHttpsCheck(targetUrl),
    runSensitivePathsCheck(targetUrl),
    runReflectionCheck(targetUrl),
    runPortCheck(targetUrl),
  ]);

  for (const item of checks) {
    if (item.status !== "fulfilled") continue;

    result.findings.push(...item.value.findings);
    Object.assign(result.checks, item.value.checks);
    result.scannedPaths.push(...item.value.scannedPaths);
  }

  result.scannedPaths = [...new Set(result.scannedPaths)];

  return result;
};

module.exports = {
  runScanner,
};
