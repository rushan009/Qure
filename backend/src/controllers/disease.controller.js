const { getOrCreatePatientProfile } = require("../utils/patientProfile");

const sanitizePrescribedMeds = (rows) => {
	if (!Array.isArray(rows)) return [];

	return rows
		.map((row) => ({
			medication: row?.medication?.trim() || "N/A",
			dosage: row?.dosage?.trim() || "N/A",
			frequency: row?.frequency?.trim() || "N/A",
		}))
		.filter(
			(row) =>
				row.medication !== "N/A" || row.dosage !== "N/A" || row.frequency !== "N/A",
		);
};

async function addDisease(req, res) {
	try {
		const userId = req.userId;
		const {
			name,
			doctorName,
			diagnosisDate,
			severity,
			status,
			code,
			notes,
			prescribedMedications,
		} = req.body;

		if (!name || !doctorName) {
			return res
				.status(400)
				.json({ error: "Disease name and doctor name are required" });
		}

		const patient = await getOrCreatePatientProfile(userId);

		const diseasePayload = {
			name,
			doctorName,
			diagnosisDate: diagnosisDate || null,
			severity: severity || "Mild",
			status: status || "Active",
			code: code || "N/A",
			notes: notes || "",
			prescribedMedications: sanitizePrescribedMeds(prescribedMedications),
		};

		patient.diseases.push(diseasePayload);
		await patient.save();

		const addedDisease = patient.diseases[patient.diseases.length - 1];
		return res.status(201).json({
			message: "Disease added successfully",
			disease: addedDisease,
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Something went wrong" });
	}
}

async function getDiseases(req, res) {
	try {
		const userId = req.userId;

		const patient = await getOrCreatePatientProfile(userId);

		return res.status(200).json({ diseases: patient.diseases || [] });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Something went wrong" });
	}
}

async function updateDisease(req, res) {
	try {
		const userId = req.userId;
		const diseaseId = req.params.id;

		const patient = await getOrCreatePatientProfile(userId);

		const disease = patient.diseases.id(diseaseId);
		if (!disease) {
			return res.status(404).json({ error: "Disease not found" });
		}

		const {
			name,
			doctorName,
			diagnosisDate,
			severity,
			status,
			code,
			notes,
			prescribedMedications,
		} = req.body;

		if (name !== undefined) disease.name = name;
		if (doctorName !== undefined) disease.doctorName = doctorName;
		if (diagnosisDate !== undefined) disease.diagnosisDate = diagnosisDate || null;
		if (severity !== undefined) disease.severity = severity;
		if (status !== undefined) disease.status = status;
		if (code !== undefined) disease.code = code || "N/A";
		if (notes !== undefined) disease.notes = notes || "";
		if (prescribedMedications !== undefined) {
			disease.prescribedMedications = sanitizePrescribedMeds(prescribedMedications);
		}

		await patient.save();
		return res.status(200).json({
			message: "Disease updated successfully",
			disease,
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Something went wrong" });
	}
}

async function deleteDisease(req, res) {
	try {
		const userId = req.userId;
		const diseaseId = req.params.id;

		const patient = await getOrCreatePatientProfile(userId);

		const disease = patient.diseases.id(diseaseId);
		if (!disease) {
			return res.status(404).json({ error: "Disease not found" });
		}

		disease.deleteOne();
		await patient.save();

		return res.status(200).json({ message: "Disease deleted successfully" });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Something went wrong" });
	}
}

module.exports = {
	addDisease,
	getDiseases,
	updateDisease,
	deleteDisease,
};
