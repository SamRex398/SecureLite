const IPV4_REGEX =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

const HOSTNAME_REGEX =
  /^(?=.{1,253}$)(?!-)([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}$/;

const isPrivateIPv4 = (hostname) => {
  const parts = hostname.split(".").map(Number);

  if (parts.length !== 4 || parts.some(Number.isNaN)) {
    return false;
  }

  const [a, b] = parts;

  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;

  return false;
};

const isIPv4 = (host) => {
  return IPV4_REGEX.test(host);
};

const isHostname = (host) => {
  return HOSTNAME_REGEX.test(host);
};

const hasProtocol = (input) => {
  return /^https?:\/\//i.test(input);
};

const isRangeInput = (input) => {
  return (
    /^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/.test(input) || input.includes(" - ")
  );
};

const detectTargetType = (input) => {
  if (!input || typeof input !== "string") {
    return "invalid";
  }

  const value = input.trim();

  if (value.includes("://")) {
    try {
      const parsed = new URL(value);

      if (!["http:", "https:"].includes(parsed.protocol)) {
        return "invalid";
      }

      return "url";
    } catch {
      return "invalid";
    }
  }

  if (isRangeInput(value)) {
    return "invalid";
  }

  if (isIPv4(value)) {
    return "ip";
  }

  if (isHostname(value)) {
    return "hostname";
  }

  return "invalid";
};

const normalizeTarget = (input, targetType) => {
  const value = input.trim();

  if (targetType === "url") {
    const parsed = new URL(value);

    if (parsed.pathname === "/") {
      parsed.pathname = "";
    }

    return parsed.toString();
  }

  if (targetType === "hostname" || targetType === "ip") {
    return `https://${value.toLowerCase()}`;
  }

  return value;
};

const validateTarget = (input) => {
  if (!input || typeof input !== "string" || !input.trim()) {
    return {
      valid: false,
      reason: "Target is required",
      targetType: "invalid",
    };
  }

  const raw = input.trim();

  if (raw.toLowerCase() === "localhost") {
    return {
      valid: false,
      reason: "localhost is not allowed",
      targetType: "invalid",
    };
  }

  if (isRangeInput(raw)) {
    return {
      valid: false,
      reason: "CIDR and range inputs are not supported",
      targetType: "invalid",
    };
  }

  const targetType = detectTargetType(raw);

  if (targetType === "invalid") {
    return {
      valid: false,
      reason: "Invalid target format",
      targetType: "invalid",
    };
  }

  const normalizedTarget = normalizeTarget(raw, targetType);
  const parsed = new URL(normalizedTarget);
  const host = parsed.hostname.toLowerCase();

  if (host === "localhost") {
    return {
      valid: false,
      reason: "localhost is not allowed",
      targetType: "invalid",
    };
  }

  if (host === "127.0.0.1") {
    return {
      valid: false,
      reason: "127.0.0.1 is not allowed",
      targetType: "invalid",
    };
  }

  if (isPrivateIPv4(host)) {
    return {
      valid: false,
      reason: "Private IP addresses are not allowed",
      targetType: "invalid",
    };
  }

  if (host.includes(":")) {
    return {
      valid: false,
      reason: "IPv6 is not supported yet",
      targetType: "invalid",
    };
  }

  return {
    valid: true,
    reason: null,
    targetType,
    normalizedTarget,
    host,
  };
};

const getTargetInput = (body = {}) => {
  return body.target || body.url || "";
};

const validateUrl = (input) => {
  const result = validateTarget(input);

  if (!result.valid) {
    return {
      valid: false,
      reason: result.reason,
    };
  }

  return {
    valid: true,
    reason: null,
    url: result.normalizedTarget,
  };
};

const normalizeUrl = (input) => {
  // if (!input || typeof input !== "string") {
  //   return "";
  // }

  // let value = input.trim();

  // if (!/^https?:\/\//i.test(value)) {
  //   value = `https://${value}`;
  // }

  // try {
  //   const parsedUrl = new URL(value);

  //   // Remove the trailing slash only when the pathname is just "/".
  //   if (parsedUrl.pathname === "/") {
  //     parsedUrl.pathname = "";
  //   }
  //   return parsedUrl.toString();
  // } catch {
  //   return value;
  // }

  const result = validateTarget(input);
  return result.valid ? result.normalizedTarget : "";
};

// const validateUrl = (input) => {
//   const normalizedInput = normalizeUrl(input);

//   if (!normalizedInput) {
//     return { valid: false, reason: "URL is required" };
//   }

//   let parsedUrl;

//   try {
//     parsedUrl = new URL(normalizedInput);
//   } catch {
//     return { valid: false, reason: "Invalid URL format" };
//   }

//   if (!["http:", "https:"].includes(parsedUrl.protocol)) {
//     return { valid: false, reason: "Only http and https URLs are allowed" };
//   }

//   const hostname = parsedUrl.hostname.toLowerCase();

//   if (hostname === "localhost") {
//     return { valid: false, reason: "localhost is not allowed" };
//   }

//   if (hostname === "127.0.0.1") {
//     return { valid: false, reason: "127.0.0.1 is not allowed" };
//   }

//   if (isPrivateIPv4(hostname)) {
//     return { valid: false, reason: "Private IP addresses are not allowed" };
//   }

//   return { valid: true, reason: null, url: parsedUrl.toString() };
// };

module.exports = {
  detectTargetType,
  validateTarget,
  normalizeTarget,
  isPrivateIPv4,
  getTargetInput,

  normalizeUrl,
  validateUrl,
};
