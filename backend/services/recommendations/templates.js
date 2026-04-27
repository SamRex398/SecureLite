const recommendationTemplates = {
  headers: "Review and harden missing HTTP security headers for the affected endpoint.",
  https: "Enforce HTTPS everywhere and renew or replace weak TLS configurations.",
  "input-reflection": "Encode reflected user-controlled content and validate request parameters.",
  sqli: "Use parameterized queries and validate input before database access.",
  network: "Restrict exposed network services to trusted clients and harden authentication.",
  "exposed-endpoint": "Restrict direct access to sensitive endpoints and directory content.",
};

module.exports = {
  recommendationTemplates,
};
