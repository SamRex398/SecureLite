const express = require("express");
const {
  createScan,
  getScanHistory,
  getScanById,
  getHealth,
} = require("../controllers/scanController");

const router = express.Router();

router.post("/scan", createScan);
router.get("/scan/history", getScanHistory);
router.get("/scan/:id", getScanById);
router.get("/health", getHealth);

module.exports = router;
