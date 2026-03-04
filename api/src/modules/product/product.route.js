const express = require("express");
const router = express.Router();
const controller = require("./product.controller");
const authenticate = require("../../common/middleware/auth.middleware");

router.use(authenticate);

router.post("/", controller.create);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;