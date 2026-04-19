const mongoose = require("mongoose");
const Patient = require("../models/patient.model");

function toObjectId(userId) {
  if (!userId) throw new Error("Missing user id");
  return new mongoose.Types.ObjectId(userId);
}

async function getOrCreatePatientProfile(userId) {
  const userObjectId = toObjectId(userId);

  return Patient.findOneAndUpdate(
    { user: userObjectId },
    {
      $setOnInsert: {
        user: userObjectId,
      },
    },
    {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
}

module.exports = {
  getOrCreatePatientProfile,
};
