const express = require("express");
const User = require("../models/User");
const Course = require("../models/Course");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const router = express.Router();
const verifyToken = require("../token_verification");
const { default: mongoose } = require("mongoose");
let fs = require('fs');

router.get("/:filename",verifyToken, async (req, res) => {
    try{
        if(req.user.role === 'admin' || req.user.role === 'instructor'){
            let filename = req.params.filename
            let submission = await Submission.findOne({file:filename} );
            if(!submission){
                res.status(404).json({ description: "Specified File Not Belongs to Submission"});
            }else{
                file = './public/submissions/'+submission['file']
                res.download(file); 
            }
        }else{
            return res.status(403).json({ error: 'The request was not made by an authenticated User satisfying the authorization criteria described above.' });
        }
    }catch (error) {
        console.log(error);
      res.status(500).json({ error: 'Internal server error' });
   }
})
module.exports = router;
