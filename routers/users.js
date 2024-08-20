const express = require("express");
const User = require("../models/User");
const Course = require("../models/Course");
const router = express.Router();
var bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const roles = ['instructor', 'student']
const verifyToken = require("../token_verification");
const { default: mongoose } = require("mongoose");
router.get("/",verifyToken, async (req, res) => {
    const users = await User.find();
    res.status(200).json(users);
 });

router.post("/",verifyToken, async (req, res) => {
   try {
      if(req.user.role==='admin') {
         if(req.body.name === undefined || req.body.email === undefined || req.body.password === undefined || req.body.role === undefined ){
            res.status(400).json({ description: "The request body was either not present or did not contain a valid User object."});
         }else if(!roles.includes(req.body.role)) {
            res.status(400).json({ description: "The request body was either not present or did not contain a valid User object, Invalid Role"});
         }
         const hashedPassword = await bcrypt.hash(req.body.password, 10);
         const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            role: req.body.role,
         });
         count =await User.countDocuments({"email": req.body.email})
         if(count == 0) {
            await user.save();
            res.status(201).json({ id: user['_id']});
         }else {
            res.send({"message": "Duplicate Email Address"});
         }
      }else {
         return res.status(401).json({ error: 'Unauthorized, Only Adminstrator Can Create New User' });
      }
   } catch (error) {
      res.status(500).json({ error: 'Internal server error'+error});
   }
});

router.post('/login', async (req, res) => {
   try {
      if(req.body.email===undefined || req.body.password===undefined) {
         return res.status(400).json({ error: 'The request body was either not present or did not contain all of the required fields' });
      }
      let email = req.body.email
      let query = {"email": email}
      user =await User.findOne(query)
      if(!user) {
         return res.status(404).json({ error: 'User Does not exist' });
      }else {
         console.log();
         console.log(user.password);
         const passwordMatch = await bcrypt.compare(req.body.password, user.password);
         if (!passwordMatch) {
            return res.status(401).json({ error: 'The specified credentials were invalid.' });
         }
         const token = jwt.sign({ email: user.email }, process.env.API_SECRET);
         res.status(200).json({ token });
      }
   } catch (error) {
      res.status(500).json({ error: 'An internal server error occurred'});
   }
})

router.post('/signup', async (req, res) => {
   try {
      let count =await User.countDocuments({})
      if(count == 0) {
          const hashedPassword = await bcrypt.hash("admin", 10);
          const user_admin = new User({
          name: "Administrator",
          email: "admin@gmail.com",
          password: hashedPassword,
          role: "admin",
          });
          await user_admin.save()
          res.status(201).json({ id: user_admin['_id'], "message": "Administrator Created"});
      }else {
         res.status(200).json({"message": "Administrator Account Already Created"});
      }
   } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
   }
})

router.get("/:id",verifyToken, async (req, res) => {
   const id = req.params.id
   let user = await User.findOne({_id:new mongoose.Types.ObjectId(id)});
   if(!user){
      res.status(404).json({ description: "Specified User `id` not found"});
   }
   user = await User.findOne({email: req.user.email});
   console.log(user);
   if(user['_id'].toString()===id){
      if(req.user.role==='instructor') {
         let courses = await Course.find({"instructorId":req.user._id})
         user.courses = courses
      }else if(req.user.role==='student') {
         let courses = await Course.find({"students":req.user._id})
         user.courses = courses
      }
      let courses2 = []
        for(let i=0;i<user.courses.length;i++){
            let course = user.courses[i]
            course['students'] = undefined
            courses2.push(course)
        }
        user.courses = courses2
      res.status(201).json(user);
   }else {
      res.status(403).json({ description: "The request was not made by an authenticated User satisfying the authorization criteria described above"});
   }
});
module.exports = router;

