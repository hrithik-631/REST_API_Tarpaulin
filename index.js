const express = require('express')
const app = express()
const port = 3000
const mongoose = require("mongoose");
const users_router = require("./routers/users");
const courses_router = require("./routers/courses");
const assignments_router = require("./routers/assignments");
const submissions_router = require("./routers/submissions");
const media_router = require("./routers/media");
const rateLimit = require("express-rate-limit");
const bodyParser = require('body-parser')
const verifyToken = require("./token_verification");


require("dotenv").config();

const limiter = rateLimit({
   max: 30,
   windowMs: 60 * 1000,
   message: "Too many request from this IP"
});

mongoose.connect(process.env.MONGO_URL).then(async() => {
   app.use(limiter)
   app.use(bodyParser.urlencoded({limit: '1000mb',extended: false}))
   app.use(bodyParser.json())
   app.use(express.static('public/submissions'))
   app.use("/users", users_router); 
   app.use("/courses", courses_router); 
   app.use("/assignments", assignments_router); 
   app.use("/submissions", submissions_router); 
   app.use("/media/submissions", media_router); 
   app.listen(process.env.PORT, () => {
      console.log("Server has started!");
   });
});



