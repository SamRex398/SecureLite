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

const normalizeUrl = (input) => {
  if (!input || typeof input !== "string") {
    return "";
  }

  let value = input.trim();

  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }

  try {
    const parsedUrl = new URL(value);

    // Remove the trailing slash only when the pathname is just "/".
    if (parsedUrl.pathname === "/") {
      parsedUrl.pathname = "";
    }
    return parsedUrl.toString();
  } catch {
    return value;
  }
};

const validateUrl = (input) => {
  const normalizedInput = normalizeUrl(input);

  if (!normalizedInput) {
    return { valid: false, reason: "URL is required" };
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(normalizedInput);
  } catch {
    return { valid: false, reason: "Invalid URL format" };
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return { valid: false, reason: "Only http and https URLs are allowed" };
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  if (hostname === "localhost") {
    return { valid: false, reason: "localhost is not allowed" };
  }

  if (hostname === "127.0.0.1") {
    return { valid: false, reason: "127.0.0.1 is not allowed" };
  }

  if (isPrivateIPv4(hostname)) {
    return { valid: false, reason: "Private IP addresses are not allowed" };
  }

  return { valid: true, reason: null, url: parsedUrl.toString() };
};

module.exports = {
  isPrivateIPv4,
  normalizeUrl,
  validateUrl,
};
