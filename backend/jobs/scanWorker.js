const { Worker } = require("bullmq");
const connection = require("../config/redis");
const Scan = require("../models/Scan");
const { runScan } = require("../services/scanOrchestrator");
const { calculateRiskScore } = require("../services/riskScoringService");
const { buildReport } = require("../services/reportService");

const scanWorker = new Worker(
  "scanQueue",
  async (job) => {
    const { scanId } = job.data;

    const scan = await Scan.findById(scanId);
    if (!scan) {
      throw new Error("Scan not found");
    }

    try {
      scan.status = "running";
      scan.report = scan.report || {};
      scan.report.startedAt = new Date();
      await scan.save();

      const scanResult = await runScan({
        targetUrl: scan.normalizedUrl,
      });

      const findings = scanResult.findings || [];

      const scoreResult = calculateRiskScore(findings);

      const report = buildReport({
        findings,
        riskBand: scoreResult.riskBand,
        counts: scoreResult.counts,
        checks: scanResult.checks || {},
        scannedPaths: scanResult.scannedPaths || [],
      });

      scan.findings = findings;
      scan.score = scoreResult.score;
      scan.summary = report.summary;
      scan.report = {
        ...scan.report,
        riskBand: report.riskBand,
        totalFindings: report.totalFindings,
        counts: report.counts,
        checks: report.checks,
        scannedPaths: report.scannedPaths,
        errorMessage: "",
        startedAt: scan.report.startedAt,
        completedAt: new Date(),
      };
      scan.status = "done";

      await scan.save();

      return {
        scanId: scan._id.toString(),
        status: scan.status,
      };
    } catch (error) {
      scan.status = "failed";
      scan.report = {
        ...(scan.report || {}),
        errorMessage: error.message,
        completedAt: new Date(),
      };

      await scan.save();
      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
  },
);

scanWorker.on("completed", (job) => {
  console.log(`Scan job completed: ${job.id}`);
});

scanWorker.on("failed", (job, error) => {
  console.error(`Scan job failed: ${job?.id}`, error.message);
});

module.exports = scanWorker;
