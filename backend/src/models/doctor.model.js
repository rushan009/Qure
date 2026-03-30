const User = require('./user.model');
const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
    {
        user:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        specialization: {
            type: String,
        },
       liscenceNumber:{
            type: Number,
       },
       liscenceImage:{
            type: String,
       },
     
    }
)

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;