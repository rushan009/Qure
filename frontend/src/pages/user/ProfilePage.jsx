import { User, Phone, Mail, MapPin, Calendar, Pencil } from "lucide-react";
import { Tag, Field, SectionHdr, Btn, Card, PageHeader } from "../../components/patient/ui";

export default function ProfilePage() {
  return (
    <div>
      <PageHeader
        title="Personal Profile"
        subtitle="Manage your personal and contact information"
        action={<Btn icon={Pencil} label="Edit Profile" />}
      />

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-[hsl(184,52%,87%)] to-[hsl(196,64%,88%)] border border-[hsl(120,12%,83%)] rounded-xl p-5 flex items-center gap-4 mb-5">
        <div className="w-16 h-16 rounded-full bg-[hsl(196,64%,88%)] border-2 border-[hsl(196,64%,72%)] flex items-center justify-center shrink-0">
          <User size={28} className="text-[hsl(196,64%,50%)]" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold mb-2">Alex Johnson</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Tag label="0+" type="default" />
            <span className="flex items-center gap-1 text-[13px] text-[hsl(200,15%,40%)]">
              <Calendar size={12} /> 6/15/1992
            </span>
            <Tag label="Organ Donor" type="donor" />
          </div>
        </div>
      </div>

      {/* Two column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Personal Info */}
        <Card>
          <SectionHdr icon={User}>Personal Information</SectionHdr>
          <div className="grid grid-cols-2 gap-x-5 gap-y-0.5">
            <Field label="First Name" value="Alex" />
            <Field label="Last Name" value="Johnson" />
            <Field label="Date of Birth" value="1992-06-15" />
            <Field label="Gender" value="Male" />
            <Field label="Blood Group" value="0+" />
            <Field label="Height / Weight" value="178 cm / 75 kg" />
          </div>
        </Card>

        {/* Contact Info */}
        <Card>
          <SectionHdr icon={Phone}>Contact Information</SectionHdr>
          <Field
            label={<span className="flex items-center gap-1"><Phone size={10} /> Phone</span>}
            value="+1 (555) 012-3456"
          />
          <Field
            label={<span className="flex items-center gap-1"><Mail size={10} /> Email</span>}
            value="alex.johnson@email.com"
          />
          <Field
            label={<span className="flex items-center gap-1"><MapPin size={10} /> Address</span>}
            value="42 Wellness Ave, Health City, HC 10001"
          />
          <hr className="border-t border-[hsl(120,12%,83%)] my-3.5" />
          <div className="text-[11px] font-bold tracking-[0.8px] text-red-500 mb-2.5 uppercase">
            Emergency Contact
          </div>
          <Field label="Name & Relation" value="Sarah Johnson (Spouse)" />
          <Field label="Phone" value="+1 (555) 987-6543" />
        </Card>
      </div>
    </div>
  );
}
