const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // links to the User model
    required: true,
  },
  dob: {
    type: Date,
    default: null, // optional, can be filled later
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'N/A'],
    default: 'N/A',
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'N/A'],
    default: 'N/A',
  },
  height: {
    type: Number, // in cm
    default: null,
  },
  weight: {
    type: Number, // in kg
    default: null,
  },
  address: {
    type: String,
    default: 'N/A',
  },
  emergencyContact: {
    name: { type: String, default: 'N/A' },
    relation: { type: String, default: 'N/A' },
    phone: { type: String, default: 'N/A' },
  },
});

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;