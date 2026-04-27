function createFinding({
  type,
  severity,
  title,
  evidence,
  endpoint,
  remediation,
}) {
  return {
    type,
    severity,
    title,
    evidence,
    endpoint,
    remediation,
  };
}

module.exports = { createFinding };
