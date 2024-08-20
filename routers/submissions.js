const express = require("express");
const User = require("../models/User");
const Course = require("../models/Course");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const router = express.Router();
const verifyToken = require("../token_verification");
const { default: mongoose } = require("mongoose");

router.patch("/:id",verifyToken, async (req, res) => {
    try{
        if(req.user.role === 'admin' || req.user.role === 'instructor'){
            const id = req.params.id
            let submission = await Submission.findOne({_id:new mongoose.Types.ObjectId(id)} );
            if(!submission){
                res.status(404).json({ description: "Specified submission Not Belongs to Assignment"});
            }else{
                if(req.user.role === 'instructor'){
                    let assignment = await Assignment.findOne({_id:submission['assignmentId']} );
                    let course = await Course.findOne({_id:assignment['courseId'], instructorId: req.user._id} );
                    if(!course){
                        res.status(404).json({ description: "Specified Course Not Belongs to Instructor"});
                    }
                }
                if(req.body.grade){
                    query1 = {"_id": submission['_id']}
                    query2 = {"grade": req.body.grade}
                    await Submission.findOneAndUpdate(query1, query2)
                    res.status(200).json({ messsage: "Grade Assigned Successfully"});
                }else{
                    res.status(400).json({ description: "The request body was either not present or did not contain any fields related to Assignment objects"});
                }
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
