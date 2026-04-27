const { recommendationTemplates } = require("./templates");

function buildRecommendations({ findings = [], vulnerabilities = [] }) {
  const recommendations = new Set();

  for (const vulnerability of vulnerabilities) {
    if (vulnerability.remediation) {
      recommendations.add(vulnerability.remediation);
    }
  }

  for (const finding of findings) {
    if (finding.remediation) {
      recommendations.add(finding.remediation);
      continue;
    }

    if (recommendationTemplates[finding.type]) {
      recommendations.add(recommendationTemplates[finding.type]);
    }
  }

  return [...recommendations];
}

module.exports = {
  buildRecommendations,
};
