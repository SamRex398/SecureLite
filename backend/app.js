const express = require("express");
const connDB = require("./config/db");
const cors = require("cors");
require("dotenv").config();
require("./jobs/scanWorker");

const scanRoutes = require("./routes/scanRoutes");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173"||"https://securelite-2.onrender.com")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    res.header("Access-Control-Allow-Origin", requestOrigin);
    res.header("Vary", "Origin");
  }

  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

app.use(express.json());
app.use(cors({
  origin: (process.env.CORS_ORIGINS || "http://localhost:5173"||"https://securelite-2.onrender.com"),
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
const startApp = async () => {
  await connDB(process.env.Db_Url);

  const PORT = process.env.PORT || 6050;

  //Routes
  app.use("/", scanRoutes);

  app.listen(PORT, () => {
    console.log(`App running on Port: ${PORT}`);
  });
};

startApp().catch(console.error);
