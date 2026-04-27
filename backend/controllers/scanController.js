const Scan = require("../models/Scan");
const { addScanJob } = require("../jobs/scanQueue");
const { validateTarget, getTargetInput } = require("../utils/urlValidator");
const { determineScanMode } = require("../services/scanOrchestrator");
const { buildJsonReport } = require("../services/reporting/reportBuilder");
const { buildHtmlReport } = require("../services/reporting/htmlReportBuilder");
const { buildPdfReport } = require("../services/reporting/pdfReportBuilder");

exports.createScan = async (req, res) => {
  try {
    const inputTarget = getTargetInput(req.body);

    const validation = validateTarget(inputTarget);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.reason,
      });
    }

    const scanMode = determineScanMode(validation.targetType);

    // const normalizedUrl = normalizeUrl(url);

    const scan = await Scan.create({
      target: inputTarget,
      normalizedTarget: validation.normalizedTarget,
      targetType: validation.targetType,
      host: validation.host,
      scanMode,

      status: "queued",
    });

    await addScanJob({
      scanId: scan._id.toString(),
      normalizedTarget: scan.normalizedTarget,
      targetType: scan.targetType,
      host: scan.host,
      scanMode: scan.scanMode,
    });

    return res.status(202).json({
      success: true,
      message: "Scan queued successfully",
      data: {
        id: scan._id,
        status: scan.status,
        target: scan.target,
        normalizedTarget: scan.normalizedTarget,
        targetType: scan.targetType,
        host: scan.host,
        scanMode: scan.scanMode,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to queue scan",
      error: err.message,
    });
  }
};

exports.getScanById = async (req, res) => {
  try {
    const { id } = req.params;

    const scan = await Scan.findById(id);
    if (!scan) {
      return res.status(404).json({
        success: false,
        message: "Scan not found",
      });
    }

    // if (scan.status === "done") {
    //   return res.status(200).json({
    //     success: true,
    //     data: scan,
    //   });
    // }

    if (scan.status === "failed") {
      return res.status(200).json({
        success: false,
        data: {
          id: scan._id,
          status: scan.status,
          target: scan.target,
          normalizedTarget: scan.normalizedTarget,
          targetType: scan.targetType,
          host: scan.host,
          scanMode: scan.scanMode,
          errorMessage: scan.report?.errorMessage || "Scan failed",
        },
      });
    }
    return res.status(200).json({
      success: true,
      data: scan,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch scan",
      error: err.message,
    });
  }
};

exports.getScanHistory = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 10), 20);

    const scans = await Scan.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select(
        "_id target normalizedTarget targetType host scanMode status score createdAt",
      );

    return res.status(200).json({
      success: true,
      count: scans.length,
      data: scans,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch scan history",
      error: err.message,
    });
  }
};

exports.getHealth = async (req, res) => {
  return res.status(200).json({
    success: true,
    status: "ok",
    service: "SecureLite Scanner API V.2.3",
  });
};

exports.getScanJsonReport = async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id);

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: "Scan not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: buildJsonReport(scan),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate JSON report",
      error: err.message,
    });
  }
};

exports.getScanHtmlReport = async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id);

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: "Scan not found",
      });
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(buildHtmlReport(scan));
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate HTML report",
      error: err.message,
    });
  }
};

exports.getScanPdfReport = async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id);

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: "Scan not found",
      });
    }

    await buildPdfReport(scan);

    return res.status(501).json({
      success: false,
      message: "PDF export is not implemented yet",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate PDF report",
      error: err.message,
    });
  }
};
