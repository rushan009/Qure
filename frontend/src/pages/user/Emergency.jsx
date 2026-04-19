import {
  AlertTriangle,
  Heart,
  Link2,
  Phone,
  Plus,
  ShieldAlert,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AccidentAlertModal from "../../components/AccidentAlertModal";
import useAccidentDetection from "../../hooks/useAccidentDetection";
import api from "../../service/api";
import { Card, PageHeader, SectionHdr, Tag } from "../../components/patient/ui";

const EMPTY_CONTACT = {
  name: "",
  relation: "",
  phone: "",
  email: "",
  isPrimary: false,
};

function joinNames(items, pick, emptyText = "N/A") {
  if (!Array.isArray(items) || items.length === 0) return emptyText;
  const list = items
    .map((item) => pick(item))
    .filter(Boolean)
    .map((text) => String(text).trim())
    .filter(Boolean);
  return list.length ? list.join(", ") : emptyText;
}

export default function Emergency() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [contactForm, setContactForm] = useState(EMPTY_CONTACT);
  const [profile, setProfile] = useState({ user: null, patient: null });
  const [diseases, setDiseases] = useState([]);
  const [medications, setMedications] = useState([]);
  const [contacts, setContacts] = useState([]);

  const {
    accidentDetected,
    alertSent,
    cancelAlert,
    sendEmergencyAlert,
  } = useAccidentDetection(true);

  const loadEmergencyData = async () => {
    setLoading(true);
    setError("");

    try {
      const [profileRes, diseaseRes, medicationRes, contactsRes] = await Promise.all([
        api.get("/auth/profile"),
        api.get("/auth/disease"),
        api.get("/auth/medication"),
        api.get("/auth/emergency-contacts"),
      ]);

      setProfile({
        user: profileRes?.data?.user || null,
        patient: profileRes?.data?.patient || null,
      });
      setDiseases(Array.isArray(diseaseRes?.data?.diseases) ? diseaseRes.data.diseases : []);
      setMedications(Array.isArray(medicationRes?.data?.medications) ? medicationRes.data.medications : []);
      setContacts(Array.isArray(contactsRes?.data?.contacts) ? contactsRes.data.contacts : []);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load emergency data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmergencyData();
  }, []);

  const activeConditions = useMemo(
    () => diseases.filter((disease) => disease.status !== "Resolved"),
    [diseases],
  );

  const emergencyProfileRows = useMemo(() => {
    const patient = profile?.patient || {};
    const user = profile?.user || {};

    const allergyText = joinNames(patient.allergies, (allergy) => {
      const name = allergy?.name || "";
      const severity = allergy?.severity || "";
      return name ? `${name}${severity ? ` (${severity})` : ""}` : "";
    });

    const activeConditionText = joinNames(activeConditions, (item) => item?.name);
    const medsText = joinNames(medications, (item) => {
      const name = item?.name || "";
      const dose = item?.dose && item.dose !== "N/A" ? item.dose : "";
      return `${name}${dose ? ` ${dose}` : ""}`.trim();
    });

    return [
      { label: "Full Name", value: user?.fullName || "N/A" },
      { label: "Blood Group", value: patient?.bloodGroup || "N/A" },
      { label: "Critical Allergies", value: allergyText },
      { label: "Active Conditions", value: activeConditionText },
      { label: "Current Medications", value: medsText },
    ];
  }, [profile, activeConditions, medications]);

  const handleContactChange = (field) => (e) => {
    const value = field === "isPrimary" ? e.target.checked : e.target.value;
    setContactForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetContactForm = () => {
    setContactForm(EMPTY_CONTACT);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    resetContactForm();
  };

  const addContact = async (e) => {
    e.preventDefault();

    if (!contactForm.name.trim() || !contactForm.relation.trim() || !contactForm.phone.trim() || !contactForm.email.trim()) {
      alert("All fields are required, including email");
      return;
    }

    setSaving(true);
    try {
      await api.post("/auth/emergency-contacts", {
        name: contactForm.name.trim(),
        relation: contactForm.relation.trim(),
        phone: contactForm.phone.trim(),
        email: contactForm.email.trim(),
        isPrimary: Boolean(contactForm.isPrimary),
      });
      closeAddModal();
      await loadEmergencyData();
    } catch (err) {
      alert(err?.response?.data?.error || err?.message || "Failed to add emergency contact");
    } finally {
      setSaving(false);
    }
  };

  const deleteContact = async (id) => {
    if (!window.confirm("Delete this emergency contact?")) return;

    try {
      await api.delete(`/auth/emergency-contacts/${id}`);
      await loadEmergencyData();
    } catch (err) {
      alert(err?.response?.data?.error || err?.message || "Failed to delete contact");
    }
  };

  const makePrimary = async (id) => {
    try {
      await api.put(`/auth/emergency-contacts/${id}/primary`);
      await loadEmergencyData();
    } catch (err) {
      alert(err?.response?.data?.error || err?.message || "Failed to update primary contact");
    }
  };

  return (
    <div>
      <PageHeader
        title="Emergency Information"
        subtitle="Critical data shared during emergencies via QR scan"
      />

      {loading ? <div className="text-sm text-[hsl(200,15%,40%)]">Loading emergency page...</div> : null}
      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      {!loading && !error ? (
        <>
          <Card className="mb-4">
            <div className="flex flex-col items-center text-center py-4">
              <button
                onClick={sendEmergencyAlert}
                className="w-22 h-22 rounded-full bg-red-500 hover:bg-red-600 text-white font-extrabold text-[28px] shadow-lg transition-colors"
                aria-label="Send emergency SOS"
              >
                SOS
              </button>
              <p className="text-[14px] text-[hsl(200,15%,40%)] mt-4 max-w-xl">
                Press to send an emergency alert. Your location and emergency profile will be shared with your primary emergency contact.
              </p>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="mb-0">
              <SectionHdr icon={Heart}>Emergency Profile</SectionHdr>
              <p className="text-[12px] text-[hsl(200,15%,42%)] mb-2.5">
                This information is shared when your QR code is scanned in an emergency.
              </p>

              <div className="divide-y divide-[hsl(120,12%,83%)]">
                {emergencyProfileRows.map((row) => (
                  <div key={row.label} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="text-[12px] text-[hsl(200,15%,40%)]">{row.label}</div>
                    <div className="text-[12px] font-semibold text-[hsl(200,25%,15%)] text-right max-w-[60%] wrap-break-word">
                      {row.value || "N/A"}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="mb-0">
              <SectionHdr
                icon={Phone}
                action={
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-1 text-[12px] text-[hsl(196,64%,50%)] font-semibold hover:underline"
                  >
                    <Plus size={12} /> Add Contact
                  </button>
                }
              >
                Emergency Contacts
              </SectionHdr>

              {contacts.length > 0 ? (
                <div className="space-y-2.5">
                  {contacts.map((contact, index) => (
                    <div key={contact._id} className="medical-white-card rounded-xl border border-[hsl(120,12%,83%)] p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-[hsl(184,52%,92%)] text-[hsl(200,15%,40%)] flex items-center justify-center text-[12px] font-bold shrink-0">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <div className="text-[14px] font-semibold text-[hsl(200,25%,15%)]">{contact.name}</div>
                              {contact.isPrimary ? <Tag label="Primary" type="active" /> : null}
                            </div>
                            <div className="text-[12px] text-[hsl(200,15%,42%)]">{contact.relation}</div>
                            <div className="text-[12px] text-[hsl(200,15%,42%)] mt-0.5">{contact.phone}</div>
                            <div className="text-[12px] text-[hsl(200,15%,42%)] mt-0.5 break-all">{contact.email}</div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 items-end shrink-0">
                          {!contact.isPrimary ? (
                            <button
                              onClick={() => makePrimary(contact._id)}
                              className="text-[11px] px-2 py-1 rounded-md border border-[hsl(196,64%,72%)] bg-[hsl(184,52%,92%)] text-[hsl(200,15%,35%)] hover:bg-[hsl(196,64%,88%)]"
                            >
                              Make Primary
                            </button>
                          ) : null}
                          <button
                            onClick={() => deleteContact(contact._id)}
                            className="text-[11px] px-2 py-1 rounded-md border border-red-200 bg-white text-red-500 hover:bg-red-50 inline-flex items-center gap-1"
                          >
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[13px] text-[hsl(200,15%,40%)]">No emergency contacts yet. Add at least one contact with email.</div>
              )}
            </Card>
          </div>
        </>
      ) : null}

      {showAddModal ? (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-semibold">Add Emergency Contact</h3>
              <button onClick={closeAddModal} className="text-gray-500">
                <X size={17} />
              </button>
            </div>

            <form onSubmit={addContact}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={handleContactChange("name")}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-slate-50"
                    placeholder="e.g. Sarah Johnson"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Relation *</label>
                  <input
                    type="text"
                    value={contactForm.relation}
                    onChange={handleContactChange("relation")}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-slate-50"
                    placeholder="e.g. Spouse"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Phone *</label>
                  <input
                    type="text"
                    value={contactForm.phone}
                    onChange={handleContactChange("phone")}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-slate-50"
                    placeholder="e.g. +1 555 123 4567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={handleContactChange("email")}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-slate-50"
                    placeholder="e.g. name@example.com"
                    required
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-[hsl(200,15%,35%)] mb-4">
                <input
                  type="checkbox"
                  checked={contactForm.isPrimary}
                  onChange={handleContactChange("isPrimary")}
                />
                Set as primary emergency contact
              </label>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Add Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <AccidentAlertModal
        key={accidentDetected ? "active" : "idle"}
        accidentDetected={accidentDetected}
        alertSent={alertSent}
        cancelAlert={cancelAlert}
        sendAlert={sendEmergencyAlert}
      />
    </div>
  );
}
