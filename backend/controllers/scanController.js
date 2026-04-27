const Scan = require("../models/Scan");
const { validateUrl, normalizeUrl } = require("../utils/urlValidator");
const { addScanJob } = require("../jobs/scanQueue");

exports.createScan = async (req, res) => {
  try {
    const { url } = req.body;

    const validation = validateUrl(url);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.reason,
      });
    }

    const normalizedUrl = normalizeUrl(url);

    const scan = await Scan.create({
      targetUrl: url,
      normalizedUrl,
      status: "queued",
    });

    await addScanJob({
      scanId: scan._id.toString(),
      normalizedUrl,
    });

    return res.status(202).json({
      success: true,
      message: "Scan queued successfully",
      data: {
        id: scan._id,
        status: scan.status,
        targetUrl: scan.targetUrl,
        normalizedUrl: scan.normalizedUrl,
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

    if (scan.status === "done") {
      return res.status(200).json({
        success: true,
        data: scan,
      });
    }

    if (scan.status === "failed") {
      return res.status(200).json({
        success: false,
        data: {
          id: scan._id,
          status: scan.status,
          targetUrl: scan.targetUrl,
          normalizedUrl: scan.normalizedUrl,
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
      .select("_id targetUrl normalizedUrl status score createdAt");
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
    service: "VScanner API",
  });
};
