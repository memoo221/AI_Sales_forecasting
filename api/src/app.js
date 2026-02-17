const express = require("express");
const cors = require("cors");
const prisma = require("./infrastructure/database/prisma");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "API is running",
  });
});
app.get("/test-db", async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ status: "Database connected successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database connection failed" });
  }
});

module.exports = app;
