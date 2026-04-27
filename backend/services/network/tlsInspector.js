const tls = require("tls");

function firstCertificateValue(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  const entries = Object.entries(value);
  if (entries.length === 0) {
    return "";
  }

  return String(entries[0][1] || "");
}

function inspectTls(host, port, timeout = 4000) {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host,
        port,
        servername: host.includes(".") ? host : undefined,
        rejectUnauthorized: false,
      },
      () => {
        const certificate = socket.getPeerCertificate(true);
        const validTo = certificate?.valid_to ? new Date(certificate.valid_to) : null;
        const validFrom = certificate?.valid_from ? new Date(certificate.valid_from) : null;
        const now = Date.now();
        const daysRemaining =
          validTo && !Number.isNaN(validTo.getTime())
            ? Math.floor((validTo.getTime() - now) / (1000 * 60 * 60 * 24))
            : null;
        const subject = firstCertificateValue(certificate?.subject);
        const issuer = firstCertificateValue(certificate?.issuer);

        resolve({
          present: Boolean(certificate && Object.keys(certificate).length),
          subject,
          issuer,
          validFrom,
          validTo,
          daysRemaining,
          selfSigned: Boolean(subject && issuer && subject === issuer),
          protocol: socket.getProtocol() || "",
          cipher: socket.getCipher()?.name || "",
        });

        socket.end();
      },
    );

    socket.setTimeout(timeout, () => {
      socket.destroy();
      resolve({
        present: false,
        subject: "",
        issuer: "",
        validFrom: null,
        validTo: null,
        daysRemaining: null,
        selfSigned: false,
        protocol: "",
        cipher: "",
      });
    });

    socket.on("error", () => {
      resolve({
        present: false,
        subject: "",
        issuer: "",
        validFrom: null,
        validTo: null,
        daysRemaining: null,
        selfSigned: false,
        protocol: "",
        cipher: "",
      });
    });
  });
}

module.exports = {
  inspectTls,
};
