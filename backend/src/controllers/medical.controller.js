const { getOrCreatePatientProfile } = require("../utils/patientProfile");

async function addAllergy(req, res) {
  try {
    const userId = req.userId;
    const { name, severity } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Allergy name is required" });
    }

    const patient = await getOrCreatePatientProfile(userId);

    const newAllergy = {
      name: name.trim(),
      severity: severity || "Mild",
    };

    patient.allergies.push(newAllergy);
    await patient.save();

    return res.status(201).json({
      message: "Allergy added successfully",
      allergy: patient.allergies[patient.allergies.length - 1],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

async function deleteAllergy(req, res) {
  try {
    const userId = req.userId;
    const allergyId = req.params.id;

    const patient = await getOrCreatePatientProfile(userId);

    const allergy = patient.allergies.id(allergyId);
    if (!allergy) {
      return res.status(404).json({ error: "Allergy not found" });
    }

    allergy.deleteOne();
    await patient.save();

    return res.status(200).json({ message: "Allergy deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

async function updateLastVitals(req, res) {
  try {
    const userId = req.userId;
    const { recordedAt, bp, heartRate, bloodSugar, temperature } = req.body;

    const patient = await getOrCreatePatientProfile(userId);

    patient.lastVitals = {
      recordedAt: recordedAt || null,
      bp: bp || "N/A",
      heartRate: heartRate || null,
      bloodSugar: bloodSugar || null,
      temperature: temperature || "N/A",
    };

    await patient.save();

    return res.status(200).json({
      message: "Last vitals updated successfully",
      lastVitals: patient.lastVitals,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

module.exports = {
  addAllergy,
  deleteAllergy,
  updateLastVitals,
};
