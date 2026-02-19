const express = require("express");
const cors = require("cors");
const prisma = require("./infrastructure/database/prisma");
const authRoutes = require("./modules/auth/auth.route");
const errorhandeler = require("./common/middleware/error.middleware.js");
const cookieParser = require("cookie-parser");
const app = express();
app.use(cookieParser());
app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);
app.use(errorhandeler);

module.exports = app;
