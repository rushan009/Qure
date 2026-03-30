const Patient = require("../models/patient.model");

async function addMedication(req, res) {
  const userId = req.userId; // Assuming patientId is stored in req.user after authentication

  const {
    name,
    dose,
    frequency,
    purpose,
    prescribedBy,
    category,
    startDate,
    instructions,
  } = req.body;
  const patient = await Patient.findOne({user: userId});
  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }

  const newMedication = {
    name,
    dose,
    frequency,
    purpose,
    prescribedBy,
    category,
    startDate,
    instructions,
  };

  patient.generalMedications.push(newMedication);
  await patient.save();

  res.status(201).json({ message: "Medication added successfully", medication: newMedication });
}




async function getMedications(req, res) {
  const userId = req.userId; // Assuming patientId is stored in req.user after authentication

  const patient = await Patient.findOne({user: userId});
  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }

  res.status(200).json({ medications: patient.generalMedications });
}



async function deleteMedication(req, res) {
  const userId = req.userId;
  const medicationId = req.params.id;

  const patient = await Patient.findOne({user: userId});
  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }

  const medicationIndex = patient.generalMedications.findIndex(med => med._id.toString() === medicationId);
  if (medicationIndex === -1) {
    return res.status(404).json({ error: "Medication not found" });
  }

  patient.generalMedications.splice(medicationIndex, 1);
  await patient.save();

  res.status(200).json({ message: "Medication deleted successfully" });
}

module.exports = {
  addMedication,
  getMedications,
  deleteMedication
};