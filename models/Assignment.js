const mongoose = require("mongoose");
const schema = mongoose.Schema({
    courseId: {type: mongoose.Types.ObjectId, ref: 'Course'},
    title: { type: String, required: [true, "Title not provided "] },
    points: { type: Number},
    due: {type: Date}
 });
 module.exports = mongoose.model("Assignment", schema);