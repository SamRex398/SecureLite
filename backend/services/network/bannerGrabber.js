const http = require("http");
const https = require("https");
const net = require("net");

const HTTP_LIKE_PORTS = new Set([80, 8080]);
const HTTPS_LIKE_PORTS = new Set([443, 8443]);

function trimBanner(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 240);
}

function grabHttpBanner(protocol, host, port, timeout = 3000) {
  return new Promise((resolve) => {
    const client = protocol === "https" ? https : http;
    const req = client.request(
      {
        host,
        port,
        method: "GET",
        path: "/",
        timeout,
        rejectUnauthorized: false,
      },
      (res) => {
        const server = trimBanner(res.headers.server);
        const poweredBy = trimBanner(res.headers["x-powered-by"]);

        res.resume();

        resolve({
          banner: [server, poweredBy].filter(Boolean).join(" | "),
          server,
          headers: res.headers || {},
        });
      },
    );

    req.on("timeout", () => {
      req.destroy();
      resolve({ banner: "", server: "", headers: {} });
    });

    req.on("error", () => {
      resolve({ banner: "", server: "", headers: {} });
    });

    req.end();
  });
}

function grabTcpBanner(host, port, timeout = 3000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;

    function finish(banner = "") {
      if (resolved) {
        return;
      }

      resolved = true;
      socket.destroy();
      resolve({
        banner: trimBanner(banner),
        server: "",
        headers: {},
      });
    }

    socket.setTimeout(timeout);
    socket.once("data", (data) => finish(data.toString("utf8")));
    socket.once("timeout", () => finish());
    socket.once("error", () => finish());
    socket.once("connect", () => {
      socket.write("\r\n");
    });

    socket.connect(port, host);
  });
}

async function grabBanner(host, port) {
  if (HTTPS_LIKE_PORTS.has(port)) {
    return grabHttpBanner("https", host, port);
  }

  if (HTTP_LIKE_PORTS.has(port)) {
    return grabHttpBanner("http", host, port);
  }

  return grabTcpBanner(host, port);
}

module.exports = {
  grabBanner,
};
