const mongoose = require("mongoose");

const findingSchema = new mongoose.Schema(
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
  { _id: true },
);

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    port: {
      type: Number,
      required: true,
    },
    protocol: {
      type: String,
      default: "tcp",
      trim: true,
    },
    state: {
      type: String,
      enum: ["open", "closed", "filtered", "unknown"],
      default: "unknown",
    },
    product: {
      type: String,
      default: "",
      trim: true,
    },
    version: {
      type: String,
      default: "",
      trim: true,
    },
    banner: {
      type: String,
      default: "",
      trim: true,
    },
    server: {
      type: String,
      default: "",
      trim: true,
    },
    tls: {
      present: {
        type: Boolean,
        default: false,
      },
      subject: {
        type: String,
        default: "",
        trim: true,
      },
      issuer: {
        type: String,
        default: "",
        trim: true,
      },
      validFrom: {
        type: Date,
        default: null,
      },
      validTo: {
        type: Date,
        default: null,
      },
      daysRemaining: {
        type: Number,
        default: null,
      },
      selfSigned: {
        type: Boolean,
        default: false,
      },
      protocol: {
        type: String,
        default: "",
        trim: true,
      },
      cipher: {
        type: String,
        default: "",
        trim: true,
      },
    },
  },
  { _id: false },
);

const reportChecksSchema = {
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
};

const webScanSchema = new mongoose.Schema(
  {
    checks: {
      ...reportChecksSchema,
    },
    scannedPaths: {
      type: [String],
      default: [],
    },
    findings: {
      type: [findingSchema],
      default: [],
    },
  },
  { _id: false },
);

const networkScanSchema = new mongoose.Schema(
  {
    checks: {
      ports: reportChecksSchema.ports,
    },
    scannedHosts: {
      type: [String],
      default: [],
    },
    findings: {
      type: [findingSchema],
      default: [],
    },
    services: {
      type: [serviceSchema],
      default: [],
    },
  },
  { _id: false },
);

const artifactSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      default: "report",
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    path: {
      type: String,
      default: "",
      trim: true,
    },
    url: {
      type: String,
      default: "",
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const scanSchema = new mongoose.Schema(
  {
    target: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedTarget: {
      type: String,
      required: true,
      trim: true,
    },
    targetType: {
      type: String,
      enum: ["url", "hostname", "ip"],
      required: true,
    },
    host: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    scanMode: {
      type: String,
      enum: ["web", "network", "hybrid"],
      required: true,
      default: "web",
    },
    services: {
      type: [serviceSchema],
      default: [],
    },
    vulnerabilities: {
      type: [findingSchema],
      default: [],
    },
    recommendations: {
      type: [String],
      default: [],
    },
    artifacts: {
      type: [artifactSchema],
      default: [],
    },
    web: {
      type: webScanSchema,
      default: () => ({}),
    },
    network: {
      type: networkScanSchema,
      default: () => ({}),
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
    findings: {
      type: [findingSchema],
      default: [],
    },
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
        ...reportChecksSchema,
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

scanSchema.index({ createdAt: -1 });
scanSchema.index({ scanMode: 1, targetType: 1 });

module.exports = mongoose.models.Scan || mongoose.model("Scan", scanSchema);
