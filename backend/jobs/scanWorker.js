const { Worker } = require("bullmq");
const connection = require("../config/redis");
const Scan = require("../models/Scan");
const { runScan } = require("../services/scanOrchestrator");
const { calculateRiskScore } = require("../services/riskScoringService");
const { buildReport } = require("../services/reportService");

const DEFAULT_COUNTS = {
  critical: 0,
  high: 0,
  medium: 0,
  low: 0,
  info: 0,
};

const DEFAULT_CHECKS = {
  injection: "not_applicable",
  headers: "not_applicable",
  https: "not_applicable",
  sensitivePaths: "not_applicable",
  ports: "not_applicable",
  reflection: "not_applicable",
};

function ensureReport(scan) {
  if (!scan.report) {
    scan.report = {};
  }

  if (!scan.report.counts) {
    scan.report.counts = { ...DEFAULT_COUNTS };
  }

  if (!scan.report.checks) {
    scan.report.checks = { ...DEFAULT_CHECKS };
  }

  if (!scan.report.scannedPaths) {
    scan.report.scannedPaths = [];
  }

  if (!scan.report.riskBand) {
    scan.report.riskBand = "Low";
  }

  if (scan.report.totalFindings == null) {
    scan.report.totalFindings = 0;
  }

  if (!scan.report.errorMessage) {
    scan.report.errorMessage = "";
  }
}

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
      ensureReport(scan);
      scan.report.startedAt = new Date();
      await scan.save();

      const scanResult = await runScan({
        rawTarget: scan.target,
        normalizedTarget: scan.normalizedTarget,
        targetType: scan.targetType,
        host: scan.host,
      });

      const findings = scanResult.findings || [];
      const scoreResult = calculateRiskScore(findings);

      const report = buildReport({
        findings,
        riskBand: scoreResult.riskBand,
        counts: scoreResult.counts || DEFAULT_COUNTS,
        checks: scanResult.checks || DEFAULT_CHECKS,
        scannedPaths: scanResult.scannedPaths || [],
      });

      const safeCounts = report.counts || scoreResult.counts || DEFAULT_COUNTS;
      const safeChecks = report.checks || scanResult.checks || DEFAULT_CHECKS;

      scan.findings = findings;
      scan.scanMode = scanResult.scanMode || scan.scanMode;
      scan.services = scanResult.services || [];
      scan.vulnerabilities = scanResult.vulnerabilities || findings;
      scan.recommendations = scanResult.recommendations || [];
      scan.artifacts = scanResult.artifacts || [];
      scan.web = scanResult.web || scan.web;
      scan.network = scanResult.network || scan.network;
      scan.score = scoreResult.score;
      scan.summary =
        report.summary || `Scan completed with ${findings.length} finding(s).`;

      ensureReport(scan);
      scan.report.riskBand = report.riskBand || scoreResult.riskBand || "Low";
      scan.report.totalFindings = report.totalFindings ?? findings.length;
      scan.report.counts = { ...safeCounts };
      scan.report.checks = { ...safeChecks };
      scan.report.scannedPaths =
        report.scannedPaths || scanResult.scannedPaths || [];
      scan.report.errorMessage = "";
      scan.report.completedAt = new Date();

      scan.status = "done";
      await scan.save();

      return {
        scanId: scan._id.toString(),
        status: scan.status,
      };
    } catch (error) {
      console.error("Worker root error:", error);

      scan.status = "failed";
      ensureReport(scan);
      scan.report.errorMessage = error.message;
      scan.report.completedAt = new Date();

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
