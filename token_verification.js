const jwt = require('jsonwebtoken');
const User = require("./models/User");
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  max: 10,
  windowMs: 60 * 1000,
  message: "Too many request from this IP"
});
const verifyToken = (req, res, next) => {
    console.log(req.rateLimit.remaining);
    const token = req.headers['authorization'];
    if (!token) {
      req.rateLimit.remaining = req.rateLimit.remaining-1
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    jwt.verify(token, process.env.API_SECRET,async (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      let user =await User.findOne({"email": decoded.email})
      req.user = user;
      next();
    });
  };

  module.exports = verifyToken;