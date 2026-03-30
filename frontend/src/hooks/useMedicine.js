import { useEffect, useState } from "react";
export const useMedicine = (onClose, refetch) => {
  const [formData, setFormData] = useState({
    name: "",
    dose: "",
    frequency: "",
    purpose: "",
    prescribedBy: "",
    category: "Prescription (Rx)",
    startDate: "2026-03-29",
    instructions: "",
  });
  const handleChange = (e) => {
    const {name, value} = e.target;
    setFormData({...formData, [name]: value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const medicineData = {
      name: formData.name,
      dose: formData.dose,
      frequency: formData.frequency,
      purpose: formData.purpose,
      prescribedBy: formData.prescribedBy,
      category: formData.category,
      startDate: formData.startDate,
      instructions: formData.instructions
    };
    console.log("Submitting medicine data:", medicineData);
    const response = await fetch("/api/auth/medication", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(medicineData),
    });
    if (!response.ok) {
      throw new Error("Failed to add medication");
    }   

    onClose();
    refetch();

  }

 
  console.log(formData);
  

  return { formData, handleChange, handleSubmit };


}

export const useMedicineList = () => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(false);
  const fetchMedications = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/medication", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch medications");
      }
      const data = await response.json();
      setMedications(data.medications);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching medications:", error);
      setLoading(false);
    }

  };


  useEffect(() => {
    fetchMedications();
  }, []);
  return { medications, fetchMedications, loading }; 

}