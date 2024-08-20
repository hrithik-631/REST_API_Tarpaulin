const express = require("express");
const User = require("../models/User");
const Course = require("../models/Course");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const router = express.Router();
const verifyToken = require("../token_verification");
const { default: mongoose } = require("mongoose");
const json2csv = require('json2csv').parse;
router.get("/", verifyToken, async (req, res) =>{
    try{
        const page = req.query.page
        const subject = req.query.subject
        const number = req.query.number
        const term = req.query.term
        const title = req.query.title
    
        let courses = []
        if(page){
            let limit = 2
            let skip = (parseInt(page)-1)*limit
            courses = await Course.find().skip(skip).limit(limit);
        }else if(subject){
            courses = await Course.find({"subject": subject})
        }else if(number){
            courses = await Course.find({"number": number})
        }else if(term){
            courses = await Course.find({"term": term})
        }else if(title){
            courses = await Course.find({"title": title})
        }else{
            let limit = 2
            let skip = 0
            courses = await Course.find().skip(skip).limit(limit);
        }
        let courses2 = []
        for(let i=0;i<courses.length;i++){
            let course = courses[i]
            course['students'] = undefined
            courses2.push(course)
        }
        res.status(200).json(courses2);
    }catch (error) {
        console.log(error);
      res.status(500).json({ error: 'Internal server error' });
   }
})

router.get("/:id", verifyToken, async (req, res) =>{
    try{
        const id = req.params.id
        let course = await Course.findOne({_id:new mongoose.Types.ObjectId(id)});
        if(!course){
            res.status(404).json({ description: "Specified Course `id` not found"});
        }
        course['students'] = undefined
        console.log(course)
        res.status(200).json(course);
    }catch (error) {
        console.log(error);
      res.status(500).json({ error: 'Internal server error' });
   }
})

router.post("/",verifyToken, async (req, res) => {
    try{
        if(req.user.role==='admin') {
            if(req.body.subject && req.body.number && req.body.title && req.body.term && req.body.instructorId) {
                let count =await Course.countDocuments({"number": req.body.number})
                if(count == 0) {
                    const course = new Course({
                        subject: req.body.subject,
                        number: req.body.number,
                        title: req.body.title,
                        term: req.body.term,
                        instructorId: new mongoose.Types.ObjectId(req.body.instructorId)
                     });
                     await course.save()
                     res.status(201).json({ id: course['_id'], "message": "New Course successfully added"});
                }else {
                    res.send({"message": "Duplicate Course Number"});
                }
                
            }else{
                return res.status(400).json({ description: 'The request body was either not present or did not contain a valid Course object' });
            }
        }else{
            return res.status(403).json({ description: 'The request was not made by an authenticated User satisfying the authorization criteria described above' });
        }
    } catch (error) {
        console.log(error);
      res.status(500).json({ error: 'Internal server error' });
   }
    
})
router.patch("/:id",verifyToken, async (req, res)=>{
    try{
        if(req.user.role === 'admin' || req.user.role === 'instructor'){
            const id = req.params.id
            if(req.user.role === 'instructor'){
                let course = await Course.findOne({_id:new mongoose.Types.ObjectId(id), instructorId: req.user._id} );
                if(!course){
                    res.status(404).json({ description: "Specified Course Not Belongs to Instructor"});
                }
            } 
            let course = await Course.findOne({_id:new mongoose.Types.ObjectId(id)});
            if(!course){
                res.status(404).json({ description: "Specified Course `id` not found"});
            }
            if(req.body.subject && req.body.number && req.body.title && req.body.term && req.body.instructorId) {
                let query1 = {_id:new mongoose.Types.ObjectId(id)}
                let query2 = {
                    subject: req.body.subject,
                    number: req.body.number,
                    title: req.body.title,
                    term: req.body.term,
                }
                await Course.findOneAndUpdate(query1, query2)
                res.status(200).json({ messsage: "Course Updated"});
            }else{
                return res.status(400).json({ description: 'The request body was either not present or did not contain any fields related to Course objects' });
            }
        }else {
            return res.status(403).json({ error: 'The request was not made by an authenticated User satisfying the authorization criteria described above.' });
        }
    }catch (error) {
        console.log(error);
      res.status(500).json({ error: 'Internal server error' });
   }
})

router.delete("/:id",verifyToken, async (req, res) =>{
    try{
        if(req.user.role==='admin') {
            const id = req.params.id
            let course = await Course.findOne({_id:new mongoose.Types.ObjectId(id)});
            if(!course){
                res.status(404).json({ description: "Specified Course `id` not found"});
            }
            let assignments = await Assignment.find({courseId:new mongoose.Types.ObjectId(id) })
            for(let i=0;i<assignments.length; i++) {
                await Submission.deleteMany({assignmentId:assignments[i]['_id']})
            }
            await Assignment.deleteMany({courseId:new mongoose.Types.ObjectId(id) })
            await Course.deleteOne({_id:new mongoose.Types.ObjectId(id)})
            res.status(204).json({"message": "Course Deleted Successfully"});
        }else {
            return res.status(403).json({ description: 'The request was not made by an authenticated User satisfying the authorization criteria described above' });
        }
    }catch (error) {
        console.log(error);
      res.status(500).json({ error: 'Internal server error' });
   }
})

router.post("/:id/students",verifyToken, async (req, res) => {
    try{
        if(req.user.role === 'admin' || req.user.role === 'instructor'){
            const id = req.params.id
            if(req.user.role === 'instructor'){
                let course = await Course.findOne({_id:new mongoose.Types.ObjectId(id), instructorId: req.user._id} );
                if(!course){
                    res.status(404).json({ description: "Specified Course Not Belongs to Instructor"});
                }
            }
            let user_id =new mongoose.Types.ObjectId(req.body.user_id)
            let course = await Course.findOne({_id:new mongoose.Types.ObjectId(id), students: user_id} );
            if(!course){
                // push
                let query1 = {_id:new mongoose.Types.ObjectId(id)}
                let query2 = {"$push": {students: user_id}}
                await Course.findOneAndUpdate(query1, query2)
                res.status(200).json({ message: "Course Enrolled"});
            }else {
                // pop
                let query1 = {_id:new mongoose.Types.ObjectId(id)}
                let query2 = {"$pull": {students: user_id}}
                await Course.findOneAndUpdate(query1, query2)
                res.status(200).json({ message: "Course Drop"});
            }
        }else{
            return res.status(403).json({ error: 'The request was not made by an authenticated User satisfying the authorization criteria described above.' });
        }
    }catch (error) {
        console.log(error);
      res.status(500).json({ error: 'Internal server error' });
   }
})

router.get("/:id/students",verifyToken, async (req, res) => {
    try{
        if(req.user.role === 'admin' || req.user.role === 'instructor'){
            const id = req.params.id
            if(req.user.role === 'instructor'){
                let course = await Course.findOne({_id:new mongoose.Types.ObjectId(id), instructorId: req.user._id} );
                if(!course){
                    res.status(404).json({ description: "Specified Course Not Belongs to Instructor"});
                }
            }
            let course = await Course.findOne({_id:new mongoose.Types.ObjectId(id)});
            if(!course){
                res.status(404).json({ description: "Specified Course `id` not found"});
            }else if(course.students.length==0){
                res.status(200).json({ message: "No Students Enrolled"});
            } else {
                res.status(200).json({ students: course.students});
            }
        }else{
            return res.status(403).json({ error: 'The request was not made by an authenticated User satisfying the authorization criteria described above.' });
        }
    }catch (error) {
        console.log(error);
      res.status(500).json({ error: 'Internal server error' });
   }
})

router.get("/:id/assignments",verifyToken, async (req, res) => {
    try{
        // if(req.user.role === 'admin' || req.user.role === 'instructor'){
            const id = req.params.id
            let assignments = await Assignment.find({courseId:new mongoose.Types.ObjectId(id)});
            res.status(200).json({ assignments});
        // }else{
        //     return res.status(403).json({ error: 'The request was not made by an authenticated User satisfying the authorization criteria described above.' });
        // }
    }catch (error) {
        console.log(error);
      res.status(500).json({ error: 'Internal server error' });
   }
})

router.get("/:id/roster",verifyToken, async (req, res) => {
    try{
        if(req.user.role === 'admin' || req.user.role === 'instructor'){
            const id = req.params.id
            if(req.user.role === 'instructor'){
                let course = await Course.findOne({_id:new mongoose.Types.ObjectId(id), instructorId: req.user._id} );
                if(!course){
                    res.status(404).json({ description: "Specified Course Not Belongs to Instructor"});
                }
            }
            let course = await Course.findOne({_id:new mongoose.Types.ObjectId(id)});
            if(!course){
                res.status(404).json({ description: "Specified Course `id` not found"});
            }else if(course.students.length==0){
                res.status(200).json({ message: "No Students Enrolled"});
            } else {
                const fields = ['id', 'name', 'email'];
                const opts = { fields };
                let students = []
                for(let i=0; i<course.students.length;i++){
                    let user = await User.findOne({_id: course.students[i]})
                    let student = {
                        "id": user._id.toString(),
                        "name": user.name,
                        "email": user.email,
                        "role": user.role,
                    }
                    students.push(student)
                }
                students = json2csv(students, opts);
                res.set("Content-Disposition", "attachment; filename=whatever.csv");
                res.type("text/csv");
                res.end(students);
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