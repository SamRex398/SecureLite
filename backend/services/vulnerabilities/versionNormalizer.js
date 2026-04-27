function normalizeServiceForLookup(service = {}) {
  const product = String(service.product || service.name || "").trim();
  const version = String(service.version || "").trim();

  if (!product) {
    return [];
  }

  const candidates = [];

  if (version) {
    candidates.push(`${product} ${version}`);
  }

  candidates.push(product);

  return [...new Set(candidates)];
}

module.exports = {
  normalizeServiceForLookup,
};
