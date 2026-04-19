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
      isNmcVerified: {
          type: Boolean,
          default: false,
      },
      licenseVerificationStatus: {
          type: String,
          enum: ["not_submitted", "pending", "verified", "failed", "manual_review"],
          default: "not_submitted",
      },
      extractedNmcNumber: {
          type: String,
          trim: true,
      },
      verificationConfidence: {
          type: Number,
          default: 0,
      },
      verificationSource: {
          type: String,
          default: "none",
      },
      verificationFailureReason: {
          type: String,
          default: "",
      },
      verificationLastCheckedAt: {
          type: Date,
      },
      verifiedAt: {
          type: Date,
      },
     
    }
)

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;