const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // links to the User model
    required: true,
  },
  dob: {
    type: Date,
    default: null // optional, can be filled later
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
  emergencyContacts: [
    {
      name: { type: String, required: true, default: 'N/A' },
      relation: { type: String, required: true, default: 'N/A' },
      phone: { type: String, required: true, default: 'N/A' },
      email: { type: String, required: true, default: 'N/A' },
      isPrimary: { type: Boolean, default: false },
    },
  ],
  organDonor: {
    type: Boolean,
    default: false,
  },
  qrAccessLogs: [
    {
      scannerUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      scannerName: {
        type: String,
        default: 'Unknown User',
      },
      scannerRole: {
        type: String,
        enum: ['patient', 'doctor', 'unknown'],
        default: 'unknown',
      },
      scannerSpecialization: {
        type: String,
        default: 'N/A',
      },
      accessLevel: {
        type: String,
        enum: ['full', 'limited'],
        default: 'limited',
      },
      scannedAt: {
        type: Date,
        default: Date.now,
      },
      sourceIp: {
        type: String,
        default: 'N/A',
      },
    },
  ],
  emergencyTriggerLogs: [
    {
      triggeredAt: {
        type: Date,
        default: Date.now,
      },
      deliveryMode: {
        type: String,
        enum: ['smtp', 'sendmail', 'unknown'],
        default: 'unknown',
      },
      targetEmail: {
        type: String,
        default: 'N/A',
      },
      sourceIp: {
        type: String,
        default: 'N/A',
      },
    },
  ],

  reports: [
    {
      title: { type: String, required: true, default: 'N/A' },
      category: { type: String, required: true, default: 'General' },
      reportDate: { type: Date, required: true, default: Date.now },
      doctorName: { type: String, required: true, default: 'N/A' },
      hospitalName: { type: String, required: true, default: 'N/A' },
      notes: { type: String, default: '' },
      originalFileName: { type: String, required: true, default: 'report' },
      storedFileName: { type: String, required: true, default: 'report' },
      fileMimeType: { type: String, required: true, default: 'application/octet-stream' },
      fileSize: { type: Number, required: true, default: 0 },
      filePath: { type: String, required: true, default: '' },
      uploadedAt: { type: Date, default: Date.now },
    },
  ],

  
  generalMedications: [
    {
      name: { type: String, default: 'N/A', required: true },
      dose: { type: String, default: 'N/A' },
      frequency: { type: String, default: 'N/A' },
      purpose: { type: String, default: 'N/A' },
      prescribedBy: { type: String, default: 'N/A' },
      category: { type: String, default: 'Prescription (Rx)', enum: ['Prescription (Rx)', 'OTC', 'Supplement'] },
      startDate: { type: Date, default: null },
      instructions: { type: String, default: 'N/A' },
    },
  ],
  diseases: [
    {
      name: { type: String, required: true, default: 'N/A' },
      doctorName: { type: String, required: true, default: 'N/A' },
      diagnosisDate: { type: Date, default: null },
      severity: {
        type: String,
        enum: ['Mild', 'Moderate', 'Critical'],
        default: 'Mild',
      },
      status: {
        type: String,
        enum: ['Active', 'Managed', 'Resolved'],
        default: 'Active',
      },
      code: { type: String, default: 'N/A' },
      notes: { type: String, default: '' },
      prescribedMedications: [
        {
          medication: { type: String, default: 'N/A' },
          dosage: { type: String, default: 'N/A' },
          frequency: { type: String, default: 'N/A' },
        },
      ],
    },
  ],
  allergies: [
    {
      name: { type: String, required: true, default: 'N/A' },
      severity: {
        type: String,
        enum: ['Mild', 'Moderate', 'Severe'],
        default: 'Mild',
      },
    },
  ],
  lastVitals: {
    recordedAt: { type: Date, default: null },
    bp: { type: String, default: 'N/A' },
    heartRate: { type: Number, default: null },
    bloodSugar: { type: Number, default: null },
    temperature: { type: String, default: 'N/A' },
  },
});

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;