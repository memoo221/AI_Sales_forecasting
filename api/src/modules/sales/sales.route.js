const express = require("express");
const router = express.Router();
const multer = require("multer");
const authenticate = require("../../common/middleware/auth.middleware");
const controller = require("./sales.controller");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.originalname.match(/\.(csv|xlsx|xls)$/i)) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV and Excel files (.csv, .xlsx, .xls) are allowed"));
    }
  },
});

router.use(authenticate);

router.post("/upload", upload.single("file"), controller.uploadSales);
router.get("/", controller.getSales);

module.exports = router;
