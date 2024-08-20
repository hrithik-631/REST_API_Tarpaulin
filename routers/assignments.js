const express = require("express");
const User = require("../models/User");
const Course = require("../models/Course");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const router = express.Router();
const multer = require('multer');
const verifyToken = require("../token_verification");
const { default: mongoose } = require("mongoose");
let fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/submissions")
    },
    filename: function (req, file, cb) {
        const parts = file.mimetype.split("/");
        cb(null, `${file.fieldname}-${Date.now()}.${parts[1]}`)
    }
  })
const upload = multer({storage});
router.post("/",verifyToken, async (req, res) => {
    try{
        if(req.user.role === 'admin' || req.user.role === 'instructor'){
            const id = req.params.id
            if(req.user.role === 'instructor'){
                let course = await Course.findOne({_id:new mongoose.Types.ObjectId(id), instructorId: req.user._id} );
                if(!course){
                    res.status(404).json({ description: "Specified Course Not Belongs to Instructor"});
                }
            }
            if(req.body.courseId && req.body.title && req.body.points && req.body.due) {
                const assignment = new Assignment({
                    title: req.body.title,
                    points: req.body.points,
                    courseId: new mongoose.Types.ObjectId(req.body.courseId),
                    due: req.body.due
                 });
                 await assignment.save()
                 res.status(201).json({ id: assignment['_id'], "message": "Assignment successfully added"});
            }else{
                return res.status(400).json({ description: 'The request body was either not present or did not contain a valid Assignment object' });
            }
        }else{
            return res.status(403).json({ error: 'The request was not made by an authenticated User satisfying the authorization criteria described above.' });
        }
    }catch (error) {
        console.log(error);
      res.status(500).json({ error: 'Internal server error' });
   }
})
router.get("/:id",verifyToken, async (req, res) => {
    try{
        const id = req.params.id
        let assignment = await Assignment.findOne({_id:new mongoose.Types.ObjectId(id)});
        if(!assignment){
            res.status(404).json({ description: "Specified assignment `id` not found"});
        }
        res.status(200).json(assignment);
    }catch (error) {
        console.log(error);
      res.status(500).json({ error: 'Internal server error' });
   }
})

router.patch("/:id",verifyToken, async (req, res) => {
    try{
        if(req.user.role === 'admin' || req.user.role === 'instructor'){
            const id = req.params.id
            let assignment = await Assignment.findOne({_id:new mongoose.Types.ObjectId(id)} );
            if(!assignment){
                res.status(404).json({ description: "Specified assignment Not Belongs to Course"});
            }else{
                if(req.user.role === 'instructor'){
                    let course = await Course.findOne({_id:assignment['courseId'], instructorId: req.user._id} );
                    if(!course){
                        res.status(404).json({ description: "Specified Course Not Belongs to Instructor"});
                    }
                }
                if(req.body.courseId && req.body.title && req.body.points && req.body.due) {
                    const query1 = {_id:new mongoose.Types.ObjectId(id)}
                    const query2 = {
                        title: req.body.title,
                        points: req.body.points,
                        courseId: new mongoose.Types.ObjectId(req.body.courseId),
                        due: req.body.due
                     };
                     await Assignment.findOneAndUpdate(query1, query2)
                     res.status(200).json({ messsage: "Assignment Updated"});
                }else{
                    return res.status(400).json({ description: 'The request body was either not present or did not contain a valid Assignment object' });
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

router.delete("/:id",verifyToken, async (req, res) =>{
    try{
        if(req.user.role === 'admin' || req.user.role === 'instructor'){
            const id = req.params.id
            let assignment = await Assignment.findOne({_id:new mongoose.Types.ObjectId(id)} );
            if(!assignment){
                res.status(404).json({ description: "Specified assignment Not Belongs to Course"});
            }else{
                if(req.user.role === 'instructor'){
                    let course = await Course.findOne({_id:assignment['courseId'], instructorId: req.user._id} );
                    if(!course){
                        res.status(404).json({ description: "Specified Course Not Belongs to Instructor"});
                    }
                }
                await Submission.deleteMany({assignmentId:assignment['_id']})
                await Assignment.deleteOne({_id:new mongoose.Types.ObjectId(id)})
                res.status(200).json({ messsage: "Assignment Deleted"});
            }
        }else{
            return res.status(403).json({ error: 'The request was not made by an authenticated User satisfying the authorization criteria described above.' });
        }
    }catch (error) {
        console.log(error);
      res.status(500).json({ error: 'Internal server error' });
   }
})
router.post("/:id/submissions",verifyToken,upload.single("file"), async (req, res) => {
    try {
        console.log(req.user.role);
        if(req.user.role==='student') {
            const id = req.params.id
            let assignment = await Assignment.findOne({_id:new mongoose.Types.ObjectId(id)} );
            if(!assignment){
                res.status(404).json({ description: "Specified assignment Not Belongs to Course"});
            }else{
                let user_id =new mongoose.Types.ObjectId(req.user._id)
                let course = await Course.findOne({_id:assignment['courseId'], students: user_id} );
                if(!course){
                    res.status(400).json({ message: "Student not enrolled for this course"});
                }else {
                    // if(req.body.file) {
                        let file = req.file.filename
                        const submission = new Submission({
                            assignmentId: assignment['_id'],
                            studentId: user_id,
                            file: file,
                            timestamp: new Date()
                         });
                         await submission.save()
                         res.status(201).json({ id: submission['_id'], "message": "Submitted Successfully"});
                    // }else{
                    //     return res.status(400).json({ description: 'The request body was either not present or did not contain a valid Submission object' });
                    // }
                }
            }
        }else{
            return res.status(403).json({ description: 'The request was not made by an authenticated User satisfying the authorization criteria described above' });
        }
    }catch (error) {
        console.log(error);
      res.status(500).json({ error: 'Internal server error' });
   }
})
router.get("/:id/submissions",verifyToken, async (req, res) => {
    try{
        if(req.user.role === 'admin' || req.user.role === 'instructor'){
            const id = req.params.id
            let assignment = await Assignment.findOne({_id:new mongoose.Types.ObjectId(id)} );
            if(!assignment){
                res.status(404).json({ description: "Specified assignment Not Belongs to Course"});
            }else{
                if(req.user.role === 'instructor'){
                    let course = await Course.findOne({_id:assignment['courseId'], instructorId: req.user._id} );
                    if(!course){
                        res.status(404).json({ description: "Specified Course Not Belongs to Instructor"});
                    }
                }
                const page = req.query.page
                let limit = 2
                let skip = 0
                if(page){
                    limit = 2
                    skip = (parseInt(page)-1)*limit
                }
                let submissions = await Submission.find({"assignmentId": assignment['_id']}).skip(skip).limit(limit);
                let submissions2 = []
                for(let i=0;i<submissions.length; i++){
                    let submission = submissions[i]
                    let file = fs.readFileSync('./public/submissions/'+submission['file'], {encoding: 'base64'});
                    submission['file'] = 'http://localhost:'+process.env.PORT+'/'+submission['file']
                    submissions2.push(submission)
                }
                res.status(200).json(submissions2);
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