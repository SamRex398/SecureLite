const { tryCatch } = require("bullmq");
const mongoose = require("mongoose");

const connDB = async (DbUrl) => {
  try {
    await mongoose.connect(DbUrl);
    console.log("DataBase Connection Successful");
  } catch (err) {
    console.log("DataBase Connection Failed", err.message);
  }
};

module.exports = connDB;
