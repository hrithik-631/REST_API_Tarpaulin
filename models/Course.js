const mongoose = require("mongoose");
const schema = mongoose.Schema({
    subject: { type: String, required: [true, "Subject name not provided "] },
    number: {type: Number,required: true},
    title: { type: String, required: [true, "Title not provided "] },
    term: { type: String, required: [true, "Term not provided "] },
    instructorId: {type: mongoose.Types.ObjectId, ref: 'User'},
    students: { type: Array},
 });
 module.exports = mongoose.model("Course", schema);