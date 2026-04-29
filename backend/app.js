const express = require("express");
const connDB = require("./config/db");
require("dotenv").config();
require("./jobs/scanWorker");

const scanRoutes = require("./routes/scanRoutes");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    // Must be a single origin value (never comma-separated)
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  // Only enable this if you send cookies/auth sessions:
  // res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

// Routes: support both root and /api-prefixed paths for deployment compatibility.
app.use("/", scanRoutes);
app.use("/api", scanRoutes);

const startApp = async () => {
  await connDB(process.env.Db_Url);
  const PORT = process.env.PORT || 6050;

  app.listen(PORT, () => {
    console.log(`App running on Port: ${PORT}`);
  });
};

startApp().catch(console.error);
