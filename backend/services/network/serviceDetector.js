const { grabBanner } = require("./bannerGrabber");
const { inspectTls } = require("./tlsInspector");

const TLS_PORTS = new Set([443, 8443]);

function parseProductVersion(source = "", probableService = "") {
  const banner = String(source || "");

  const apacheMatch = banner.match(/apache\/([\d.]+)/i);
  if (apacheMatch) {
    return { product: "Apache", version: apacheMatch[1], name: "http" };
  }

  const nginxMatch = banner.match(/nginx\/([\d.]+)/i);
  if (nginxMatch) {
    return { product: "nginx", version: nginxMatch[1], name: "http" };
  }

  const openSshMatch = banner.match(/openssh[_/ -]?([\d.]+)/i);
  if (openSshMatch) {
    return { product: "OpenSSH", version: openSshMatch[1], name: "ssh" };
  }

  const redisMatch = banner.match(/redis[_/ -]?server[_/ -]?v?([\d.]+)/i);
  if (redisMatch) {
    return { product: "Redis", version: redisMatch[1], name: "redis" };
  }

  return {
    product: probableService ? probableService.toUpperCase() : "",
    version: "",
    name: probableService || "unknown",
  };
}

async function detectServices(host, portResults) {
  const openPorts = portResults.filter((result) => result.state === "open");
  const services = [];

  for (const portEntry of openPorts) {
    const bannerResult = await grabBanner(host, portEntry.port);
    const parsed = parseProductVersion(
      `${bannerResult.server} ${bannerResult.banner}`.trim(),
      portEntry.probableService,
    );

    let tls = {
      present: false,
      subject: "",
      issuer: "",
      validFrom: null,
      validTo: null,
      daysRemaining: null,
      selfSigned: false,
      protocol: "",
      cipher: "",
    };

    if (TLS_PORTS.has(portEntry.port) || portEntry.probableService.includes("https")) {
      tls = await inspectTls(host, portEntry.port);
    }

    services.push({
      name: parsed.name || portEntry.probableService,
      port: portEntry.port,
      protocol: "tcp",
      state: portEntry.state,
      product: parsed.product,
      version: parsed.version,
      banner: bannerResult.banner,
      server: bannerResult.server,
      tls,
    });
  }

  return services;
}

module.exports = {
  detectServices,
};
