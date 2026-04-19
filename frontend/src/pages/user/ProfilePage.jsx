import { User, Phone, Mail, MapPin, Calendar, Pencil } from "lucide-react";
import { Tag, Field, SectionHdr, Btn, Card, PageHeader } from "../../components/patient/ui";
import { useEffect, useState } from "react";
import api from "../../service/api";

// ─────────────────────────────────────────────────────────────
// FIX 1: EditField is moved OUTSIDE ProfilePage
//
// WHY? React works like this:
// Every time state changes (e.g. you type a letter) → ProfilePage re-renders
// → everything defined INSIDE it gets recreated from scratch
// → EditField becomes a BRAND NEW component type on every keystroke
// → React sees a new component, unmounts the old input, mounts a new one
// → input loses focus
//
// By moving EditField OUTSIDE, it is created only ONCE when the file loads
// React sees the same component type every render → keeps the input alive → no focus loss
// ─────────────────────────────────────────────────────────────

// FIX 1b: inputCls and selectCls also moved outside
// They were inside before — no bug, but no reason to recreate them on every render either
const inputCls =
  "w-full rounded-lg border border-[hsl(120,12%,83%)] bg-white px-3 py-2 text-[13px] " +
  "text-[hsl(200,15%,25%)] placeholder:text-[hsl(200,10%,65%)] " +
  "focus:outline-none focus:ring-2 focus:ring-[hsl(196,64%,60%)] focus:border-transparent transition";

const selectCls = inputCls + " appearance-none cursor-pointer";

// FIX 1c: value and onChange are now passed as props instead of reading formData directly
// WHY? EditField is now outside ProfilePage so it has no access to formData or handleChange
// We pass them in as props — this is the standard React pattern for controlled inputs
const EditField = ({ label, type = "text", options, value, onChange }) => (
  <div className="mb-3">
    <label className="block text-[11px] font-semibold text-[hsl(200,15%,50%)] mb-1">{label}</label>
    {options ? (
      <select className={selectCls} value={value || ""} onChange={onChange}>
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        className={inputCls}
        value={value || ""}
        onChange={onChange}
      />
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/profile");
        setProfile(res.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!profile) return null;

  const fullName = profile?.user?.fullName || "N/A";
  const firstName = fullName.split(" ")[0] || "N/A";
  const lastName = fullName.split(" ").slice(1).join(" ") || "N/A";

  const handleEdit = () => {
    setFormData({
      firstName,
      lastName,
      dob: profile.patient.dob?.split("T")[0] || "", 
      gender: profile.patient.gender || "",
      bloodGroup: profile.patient.bloodGroup || "",
      height: profile.patient.height || "",
      weight: profile.patient.weight || "",
      phone: profile.user.phone || "",
      email: profile.user.email || "",
      address: profile.patient.address || "",
    });
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await api.put("/auth/profile", {
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone,
        email: formData.email,
        dob: formData.dob,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        height: formData.height,
        weight: formData.weight,
        address: formData.address,
      });

      // Use actual saved data from DB instead of local formData
      setProfile({ user: res.data.user, patient: res.data.patient });
      setIsEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.error || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Personal Profile"
        subtitle="Manage your personal and contact information"
        action={
          isEditing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium
                           text-[hsl(200,15%,40%)] border border-[hsl(120,12%,83%)] bg-white
                           hover:bg-[hsl(120,12%,97%)] transition"
              >
                ✕ Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium
                           text-white bg-[hsl(196,64%,45%)] hover:bg-[hsl(196,64%,38%)]
                           disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {saving ? "Saving…" : "💾 Save"}
              </button>
            </div>
          ) : (
            <Btn icon={Pencil} label="Edit Profile" onClick={handleEdit} />
          )
        }
      />

      {saveError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[13px] px-4 py-2.5">
          {saveError}
        </div>
      )}

      {/* Hero Banner */}
      <div className="from-[hsl(184,52%,87%)] to-[hsl(196,64%,88%)] border border-[hsl(120,12%,83%)] rounded-xl p-5 flex items-center gap-4 mb-5">
        <div className="w-16 h-16 rounded-full bg-[hsl(196,64%,88%)] border-2 border-[hsl(196,64%,72%)] flex items-center justify-center shrink-0">
          <User size={28} className="text-[hsl(196,64%,50%)]" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold mb-2">
            {isEditing
              ? `${formData.firstName} ${formData.lastName}`.trim() || profile.user.fullName
              : profile.user.fullName}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Tag label="0+" type="default" />
            <span className="flex items-center gap-1 text-[13px] text-[hsl(200,15%,40%)]">
              {/* FIX 2: show fallback if no dob */}
              <Calendar size={12} /> {isEditing ? formData.dob : (profile.patient.dob?.split("T")[0] || "N/A")}
            </span>
          </div>
        </div>
      </div>

      {/* Two column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Personal Info */}
        <Card>
          <SectionHdr icon={User}>Personal Information</SectionHdr>
          {isEditing ? (
            <>
              <div className="grid grid-cols-2 gap-x-4">
                {/* FIX 1c: value and onChange passed explicitly as props */}
                <EditField label="First Name" value={formData.firstName} onChange={handleChange("firstName")} />
                <EditField label="Last Name" value={formData.lastName} onChange={handleChange("lastName")} />
              </div>
              <div className="grid grid-cols-2 gap-x-4">
                <EditField label="Date of Birth" type="date" value={formData.dob} onChange={handleChange("dob")} />
                <EditField
                  label="Gender"
                  options={["Male", "Female", "Non-binary", "Prefer not to say"]}
                  value={formData.gender}
                  onChange={handleChange("gender")}
                />
              </div>
              <div className="grid grid-cols-2 gap-x-4">
                <EditField
                  label="Blood Group"
                  options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
                  value={formData.bloodGroup}
                  onChange={handleChange("bloodGroup")}
                />
                <div className="grid grid-cols-2 gap-x-2">
                  <EditField label="Height (cm)" type="number" value={formData.height} onChange={handleChange("height")} />
                  <EditField label="Weight (kg)" type="number" value={formData.weight} onChange={handleChange("weight")} />
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-0.5">
              <Field label="First Name" value={firstName} />
              <Field label="Last Name" value={lastName} />
              {/* FIX 2: show fallback if no dob */}
              <Field label="Date of Birth" value={profile.patient.dob?.split("T")[0] || "N/A"} />
              <Field label="Gender" value={profile.patient.gender} />
              <Field label="Blood Group" value={profile.patient.bloodGroup} />
              <Field label="Height / Weight" value={`${profile.patient.height || "-"} / ${profile.patient.weight || "-"}`} />
            </div>
          )}
        </Card>

        {/* Contact Info */}
        <Card>
          <SectionHdr icon={Phone}>Contact Information</SectionHdr>
          {isEditing ? (
            <>
              <EditField label="Phone" type="tel" value={formData.phone} onChange={handleChange("phone")} />
              <EditField label="Email" type="email" value={formData.email} onChange={handleChange("email")} />
              <EditField label="Address" value={formData.address} onChange={handleChange("address")} />
              <hr className="border-t border-[hsl(120,12%,83%)] my-3.5" />
              <div className="text-[11px] font-bold tracking-[0.8px] text-red-500 mb-2.5 uppercase">
                Emergency Contact
              </div>
              <Field label="Name & Relation" value="Sarah Johnson (Spouse)" />
              <Field label="Phone" value="+1 (555) 987-6543" />
            </>
          ) : (
            <>
              <Field label={<span className="flex items-center gap-1"><Phone size={10} /> Phone</span>} value={profile.user.phone} />
              <Field label={<span className="flex items-center gap-1"><Mail size={10} /> Email</span>} value={profile.user.email} />
              <Field label={<span className="flex items-center gap-1"><MapPin size={10} /> Address</span>} value={profile.patient.address} />
              <hr className="border-t border-[hsl(120,12%,83%)] my-3.5" />
              <div className="text-[11px] font-bold tracking-[0.8px] text-red-500 mb-2.5 uppercase">
                Emergency Contact
              </div>
              <Field label="Name & Relation" value="Sarah Johnson (Spouse)" />
              <Field label="Phone" value="+1 (555) 987-6543" />
            </>
          )}
        </Card>

      </div>
    </div>
  );
}