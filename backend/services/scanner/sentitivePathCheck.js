const axios = require("axios");
const { createFinding } = require("./helpers");

const PATHS = ["/admin", "/login", "/.env", "/config", "/debug"];

function toBodyText(data) {
  if (typeof data === "string") return data;
  try {
    return JSON.stringify(data);
  } catch {
    return "";
  }
}

function looksLikeEnvFile(body) {
  const text = body.toLowerCase();
  return (
    text.includes("app_key=") ||
    text.includes("db_password=") ||
    text.includes("api_key=") ||
    text.includes("secret=") ||
    text.includes("access_token=")
  );
}

function looksLikeConfigLeak(body, contentType) {
  const text = body.toLowerCase();
  const type = (contentType || "").toLowerCase();

  return (
    type.includes("application/json") ||
    type.includes("text/plain") ||
    text.includes('"database"') ||
    text.includes('"password"') ||
    text.includes('"secret"') ||
    text.includes("db_host") ||
    text.includes("db_name") ||
    text.includes("api_key")
  );
}

function looksLikeDebugPage(body) {
  const text = body.toLowerCase();
  return (
    text.includes("stack trace") ||
    text.includes("exception") ||
    text.includes("debug") ||
    text.includes("traceback") ||
    text.includes("application error")
  );
}

function looksLikeLoginPage(body) {
  const text = body.toLowerCase();
  return (
    text.includes("password") &&
    (text.includes("login") || text.includes("sign in"))
  );
}

function looksLikeAdminPage(body) {
  const text = body.toLowerCase();
  return (
    text.includes("admin") &&
    (text.includes("dashboard") ||
      text.includes("panel") ||
      text.includes("console"))
  );
}

async function runSensitivePathsCheck({ normalizedTarget }) {
  const findings = [];
  const checks = { sensitivePaths: "passed" };
  const scannedPaths = [];

  const base = new URL(normalizedTarget);

  for (const path of PATHS) {
    const testUrl = `${base.origin}${path}`;
    scannedPaths.push(path);

    try {
      const response = await axios.get(testUrl, {
        timeout: 8000,
        validateStatus: () => true,
      });

      const body = toBodyText(response.data);
      const contentType = response.headers?.["content-type"] || "";

      if (
        path === "/.env" &&
        response.status === 200 &&
        looksLikeEnvFile(body)
      ) {
        findings.push(
          createFinding({
            type: "exposed-endpoint",
            severity: "critical",
            title: "Exposed environment file detected",
            evidence: "Response body looks like a real .env file",
            endpoint: testUrl,
            remediation:
              "Block public access to environment files immediately.",
          }),
        );
      }

      if (
        path === "/config" &&
        response.status === 200 &&
        looksLikeConfigLeak(body, contentType)
      ) {
        findings.push(
          createFinding({
            type: "exposed-endpoint",
            severity: "high",
            title: "Exposed configuration endpoint detected",
            evidence: "Response appears to expose configuration data",
            endpoint: testUrl,
            remediation:
              "Restrict access to configuration endpoints and sensitive config output.",
          }),
        );
      }

      if (
        path === "/debug" &&
        response.status === 200 &&
        looksLikeDebugPage(body)
      ) {
        findings.push(
          createFinding({
            type: "exposed-endpoint",
            severity: "high",
            title: "Debug interface or debug output exposed",
            evidence: "Response contains debug-related markers",
            endpoint: testUrl,
            remediation:
              "Disable debug mode and restrict access to debug interfaces.",
          }),
        );
      }

      if (
        path === "/login" &&
        response.status === 200 &&
        looksLikeLoginPage(body)
      ) {
        findings.push(
          createFinding({
            type: "exposed-endpoint",
            severity: "info",
            title: "Login page discovered",
            evidence: "Response appears to contain a login interface",
            endpoint: testUrl,
            remediation:
              "Ensure login protections such as rate limiting and MFA are enabled.",
          }),
        );
      }

      if (
        path === "/admin" &&
        response.status === 200 &&
        looksLikeAdminPage(body)
      ) {
        findings.push(
          createFinding({
            type: "exposed-endpoint",
            severity: "medium",
            title: "Admin interface discovered",
            evidence: "Response appears to contain an admin interface",
            endpoint: testUrl,
            remediation:
              "Restrict admin panel access and enforce strong authentication.",
          }),
        );
      }
    } catch {
      // ignore unreachable paths
    }
  }

  if (findings.length > 0) {
    checks.sensitivePaths = "issues_found";
  }

  return { findings, checks, scannedPaths };
}

module.exports = {
  runSensitivePathsCheck,
};
