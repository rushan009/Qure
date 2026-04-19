import {
  Home, User, FileText, AlertTriangle,
  Stethoscope, QrCode, ClipboardList, Pill, HeartPulse,
} from "lucide-react";

export const NAV = [
  { id: "home",        Icon: Home,          label: "Home" },
  { id: "profile",     Icon: User,          label: "Profile" },
  { id: "medical",     Icon: HeartPulse,    label: "Medical Summary" },
  { id: "diseases",    Icon: Stethoscope,   label: "Diseases" },
  { id: "medications", Icon: Pill,          label: "General Medications" },
  { id: "reports",     Icon: FileText,      label: "Reports" },
  { id: "emergency",   Icon: AlertTriangle, label: "Emergency" },
  { id: "qr",          Icon: QrCode,        label: "QR Code" },
  { id: "access",      Icon: ClipboardList, label: "Access Logs" },
];
