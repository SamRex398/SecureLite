const net = require("net");

const SAFE_PORTS = [21, 22, 25, 53, 80, 110, 143, 443, 445, 3306, 5432, 6379, 8080, 8443];

const PORT_SERVICE_MAP = {
  21: "ftp",
  22: "ssh",
  25: "smtp",
  53: "dns",
  80: "http",
  110: "pop3",
  143: "imap",
  443: "https",
  445: "smb",
  3306: "mysql",
  5432: "postgresql",
  6379: "redis",
  8080: "http-alt",
  8443: "https-alt",
};

function probableServiceForPort(port) {
  return PORT_SERVICE_MAP[port] || "unknown";
}

function scanPort(host, port, timeout = 2500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    function finish(state) {
      if (settled) {
        return;
      }

      settled = true;
      socket.destroy();
      resolve({
        port,
        state,
        probableService: probableServiceForPort(port),
      });
    }

    socket.setTimeout(timeout);
    socket.once("connect", () => finish("open"));
    socket.once("timeout", () => finish("closed"));
    socket.once("error", () => finish("closed"));

    socket.connect(port, host);
  });
}

async function scanPorts(host, ports = SAFE_PORTS) {
  const results = await Promise.all(ports.map((port) => scanPort(host, port)));

  return results.sort((left, right) => left.port - right.port);
}

module.exports = {
  SAFE_PORTS,
  probableServiceForPort,
  scanPorts,
};
