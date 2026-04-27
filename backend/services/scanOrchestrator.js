const { runScanner } = require("./scanner");

function determineScanMode(targetType) {
  if (targetType === "url") {
    return "web";
  }

  if (targetType === "ip") {
    return "network";
  }

  return "hybrid";
}

exports.determineScanMode = determineScanMode;

exports.runScan = async ({ rawTarget, normalizedTarget, targetType, host }) => {
  const scanMode = determineScanMode(targetType);

  return runScanner({
    rawTarget,
    normalizedTarget,
    targetType,
    host,
    scanMode,
  });
};
