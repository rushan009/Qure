const Patient = require("../models/patient.model");
const User = require("../models/user.model")

const getProfile = async (req, res) => {
  try {
  
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

   
    const patient = await Patient.findOne({ user: req.userId });
  
    return res.status(200).json({
      user,    
      patient, 
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

module.exports = getProfile