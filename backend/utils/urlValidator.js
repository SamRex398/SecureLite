const IPV4_REGEX =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

const HOSTNAME_REGEX =
  /^(?=.{1,253}$)(?!-)([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}$/;

const IPV4_CIDR_REGEX =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}\/([0-9]|[1-2][0-9]|3[0-2])$/;

const IPV4_RANGE_REGEX =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}\s*-\s*(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

const isRangeInput = (input) => {
  const value = String(input || "").trim();
  return IPV4_CIDR_REGEX.test(value) || IPV4_RANGE_REGEX.test(value);
};

const detectTargetType = (input) => {
  if (!input || typeof input !== "string") return "invalid";
  const value = input.trim();

  if (value.includes("://")) {
    try {
      const parsed = new URL(value);
      if (!["http:", "https:"].includes(parsed.protocol)) return "invalid";
      return "url";
    } catch {
      return "invalid";
    }
  }

  if (isRangeInput(value)) return "invalid";
  if (IPV4_REGEX.test(value)) return "ip";
  if (HOSTNAME_REGEX.test(value)) return "hostname";
  return "invalid";
};

const validateTarget = (input) => {
  if (!input || typeof input !== "string" || !input.trim()) {
    return { valid: false, reason: "Target is required", targetType: "invalid" };
  }

  const raw = input.trim();
  if (raw.toLowerCase() === "localhost") {
    return { valid: false, reason: "localhost is not allowed", targetType: "invalid" };
  }

  const targetType = detectTargetType(raw);
  if (targetType === "invalid") {
    return { valid: false, reason: "Invalid target format", targetType: "invalid" };
  }

  const normalizedTarget = normalizeTarget(raw, targetType);
  const parsed = new URL(normalizedTarget);
  const host = parsed.hostname.toLowerCase();

  // Check CIDR/range against host only (prevents URL false positives)
  if (isRangeInput(host)) {
    return {
      valid: false,
      reason: "CIDR and range inputs are not supported",
      targetType: "invalid",
    };
  }

  if (host === "localhost") {
    return { valid: false, reason: "localhost is not allowed", targetType: "invalid" };
  }

  if (host === "127.0.0.1") {
    return { valid: false, reason: "127.0.0.1 is not allowed", targetType: "invalid" };
  }

  if (isPrivateIPv4(host)) {
    return { valid: false, reason: "Private IP addresses are not allowed", targetType: "invalid" };
  }

  if (host.includes(":")) {
    return { valid: false, reason: "IPv6 is not supported yet", targetType: "invalid" };
  }

  return { valid: true, reason: null, targetType, normalizedTarget, host };
};
