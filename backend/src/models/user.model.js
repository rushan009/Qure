const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email:{
    type: String,
    unique: true,
    sparse: true, // Allows multiple documents without an email
  },
  phone:{
    type: String,
    
    sparse: true, // Allows multiple documents without a phone number
  },
  password: {
    type: String,
    required: true,
  },
  role:{
    type: String,
    enum: ['patient', 'doctor'],
    default: 'patient',
  }
  
});

const User = mongoose.model('User', userSchema);

module.exports = User;