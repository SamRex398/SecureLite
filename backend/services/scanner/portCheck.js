const net = require("net");
const { createFinding } = require("./helpers");
const { host, port } = require("../../config/redis");
const { type } = require("os");
const { title } = require("process");

const checkPort = (host, port, timeout = 3000) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.setTimeout(timeout);

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
};

const runPortCheck = async (targetUrl) => {
  const findings = [];
  const checks = { port: "passed" };
  const scannedPaths = [];

  const host = new URL(targetUrl).hostname;

  const port80Open = await checkPort(host, 80);
  const port443Open = await checkPort(host, 443);

  scannedPaths.push(`${host}:80`, `${host}:443`);

  if (!port80Open) {
    findings.push(
      createFinding({
        type: "network",
        severity: "info",
        title: "Port 80 is closed or unreachable",
        evidence: "TCP connection to port 80 failed",
        endpoint: host,
        remediation: "No action needed unless HTTP access is expect",
      }),
    );
  }

  if (!port443Open) {
    findings.push(
      createFinding({
        type: "network",
        severity: "medium",
        title: "Port 443 is closed or unreachable",
        evidence: "TCP connection to port 443 failed",
        endpoint: host,
        remediation:
          "Open port 443 and configure HTTPS if secure access is required.",
      }),
    );
  }

  if (findings.length > 0) {
    checks.port = "issues_found";
  }

  return { findings, checks, scannedPaths };
};

module.exports = {
  runPortCheck,
};
