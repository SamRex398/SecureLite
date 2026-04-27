const express = require("express");
const {
  createScan,
  getScanHistory,
  getScanById,
  getHealth,
  getScanJsonReport,
  getScanHtmlReport,
  getScanPdfReport,
} = require("../controllers/scanController");

const router = express.Router();

router.post("/scan", createScan);
router.get("/scan/history", getScanHistory);
router.get("/scan/:id/report.json", getScanJsonReport);
router.get("/scan/:id/report.html", getScanHtmlReport);
router.get("/scan/:id/report.pdf", getScanPdfReport);
router.get("/scan/:id", getScanById);
router.get("/health", getHealth);

module.exports = router;
