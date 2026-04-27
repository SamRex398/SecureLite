// Scan Model
// targetUrl
// status → pending / running / completed / failed
// startedAt, completedAt
// progress (0–100)
// modulesExecuted

const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema(
  {
    targetUrl: {
      type: String,
      required: true,
    },
    normalizedUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["queued", "running", "done", "failed"],
      default: "queued",
      index: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    findings: [
      {
        type: {
          type: String,
          enum: [
            "sqli",
            "xss",
            "headers",
            "https",
            "exposed-endpoint",
            "input-reflection",
            "network",
          ],
          required: true,
        },
        severity: {
          type: String,
          enum: ["critical", "high", "medium", "low", "info"],
          required: true,
        },
        title: {
          type: String,
          required: true,
          trim: true,
        },
        evidence: {
          type: String,
          required: true,
          trim: true,
        },
        endpoint: {
          type: String,
          required: true,
          trim: true,
        },
        remediation: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    summary: {
      type: String,
      default: "",
    },

    report: {
      riskBand: {
        type: String,
        enum: ["Low", "Medium", "High", "Critical"],
        default: "Low",
      },
      totalFindings: {
        type: Number,
        default: 0,
      },
      counts: {
        critical: { type: Number, default: 0 },
        high: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        low: { type: Number, default: 0 },
        info: { type: Number, default: 0 },
      },
      checks: {
        injection: {
          type: String,
          enum: ["passed", "issues_found", "not_applicable"],
          default: "not_applicable",
        },
        headers: {
          type: String,
          enum: ["passed", "issues_found", "not_applicable"],
          default: "not_applicable",
        },
        https: {
          type: String,
          enum: ["passed", "issues_found", "not_applicable"],
          default: "not_applicable",
        },
        sensitivePaths: {
          type: String,
          enum: ["passed", "issues_found", "not_applicable"],
          default: "not_applicable",
        },
        ports: {
          type: String,
          enum: ["passed", "issues_found", "not_applicable"],
          default: "not_applicable",
        },
        reflection: {
          type: String,
          enum: ["passed", "issues_found", "not_applicable"],
          default: "not_applicable",
        },
      },
      scannedPaths: {
        type: [String],
        default: [],
      },
      errorMessage: {
        type: String,
        default: "",
      },
      startedAt: {
        type: Date,
        default: null,
      },
      completedAt: {
        type: Date,
        default: null,
      },

      createdAt: Date,
      UpdatedAt: Date,
    },
  },
  { timestamps: true },
);

//indexes

scanSchema.index({ createdAt: -1 });
// scanSchema.index({ status: 1 });

module.exports = mongoose.models.Scan || mongoose.model("Scan", scanSchema);
