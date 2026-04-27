const { runScanner } = require("./scanner");

exports.runScan = async ({ targetUrl }) => {
  return runScanner(targetUrl);
};
