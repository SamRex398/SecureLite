const { Queue } = require("bullmq");
const connection = require("../config/redis");

const scanQueue = new Queue("scanQueue", {
  connection,
});

exports.addScanJob = async (payload) => {
  return scanQueue.add("scan-job", payload, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 50,
    removeOnFail: 100,
  });
};

module.exports = {
  scanQueue,
  addScanJob: exports.addScanJob,
};
