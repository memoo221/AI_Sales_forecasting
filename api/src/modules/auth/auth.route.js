const express = require('express');
const authController= require('./auth.controller');
const authmiddleware = require('../../common/middleware/auth.middleware');
const router = express.Router();
console.log("Auth routes loaded");
router.get("/test", authmiddleware, (req, res,next) => {
  try{
    res.status(200).json({message: "Auth route working", user: req.user});
  } catch (error) {
    next(error);
  }
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refreshtoken', authController.refresh);
router.post('/logout', authController.logout);
module.exports = router;
