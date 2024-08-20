const mongoose = require("mongoose");
const schema = mongoose.Schema({
    assignmentId: {type: mongoose.Types.ObjectId, ref: 'Assignment'},
    studentId: {type: mongoose.Types.ObjectId, ref: 'User'},
    file: { type: String},
    grade: { type: Number},
    timestamp: {type: Date}
 });
 module.exports = mongoose.model("Submission", schema);
 