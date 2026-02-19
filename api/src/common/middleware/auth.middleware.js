const {verifyToken} = require("../utils/jwt.js");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];//read the token from the header
  if (!authHeader||!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

    const token = authHeader.split(" ")[1];
    try {
        const payload = verifyToken(token, process.env.JWT_ACCESS_SECRET);
        req.user = payload;
        next(); 
    } catch (error) {   
        return res.status(401).json({ message: "Invalid token" });


    }

};
module.exports = authMiddleware;