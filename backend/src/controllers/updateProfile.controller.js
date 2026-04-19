const Patient = require("../models/patient.model");
const User = require("../models/user.model");
const mongoose = require("mongoose");

const updateProfile = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      email,
      dob,
      gender,
      bloodGroup,
      height,
      weight,
      address,
    } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      new mongoose.Types.ObjectId(req.userId),
      {
        ...(fullName && { fullName }),
        ...(phone && { phone }),
        ...(email && { email }),
      },
      { returnDocument: "after" },
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ error: "User not found" });
    const updatedPatient = await Patient.findOneAndUpdate(
      { user: new mongoose.Types.ObjectId(req.userId) },
      {
        $setOnInsert: { user: new mongoose.Types.ObjectId(req.userId) },
        ...(dob && { dob }),
        ...(gender && { gender }),
        ...(bloodGroup && { bloodGroup }),
        ...(height && { height }),
        ...(weight && { weight }),
        ...(address && { address }),
      },
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
    );
    return res.status(200).json({ user: updatedUser, patient: updatedPatient });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
};
module.exports = updateProfile;
