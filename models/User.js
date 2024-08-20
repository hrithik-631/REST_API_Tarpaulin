const mongoose = require("mongoose");
const schema = mongoose.Schema({
    name: { type: String, required: [true, "fullname not provided "] },
    email: { type: String, unique: [true, "email already exists in database!"], lowercase: true, trim: true,  required: [true, "email not provided"],
        validate: {
          validator: function (v) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          },
          message: '{VALUE} is not a valid email!'
        }
      },
    password: {type: String,required: true},
    role: {type: String,enum: ['admin' ,'instructor', 'student'], required: [true, "Please specify user role"]},
    courses: {type: Array}
 });
 module.exports = mongoose.model("User", schema);
 