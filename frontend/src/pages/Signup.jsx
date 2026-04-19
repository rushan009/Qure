import Logo from "../components/ui/Logo";
import { RoleToggle } from "../components/auth/RoleToggle";
import { InputField } from "../components/auth/InputField";
import { LicenseUpload } from "../components/auth/LicenseUpload";
import { SubmitButton } from "../components/auth/SubmitButton";
import { LoginLink } from "../components/auth/LoginLink";
import { useState } from "react";
import { useSignup } from "../hooks/useSignup";


export const SignUp = ({setToast}) => {
  const { formData, handleChange, handleRoleChange, handleSubmit, loading } = useSignup(setToast);
  const [role, setRole] = useState("Patient");

  const onRoleSelect = (nextRole) => {
    setRole(nextRole);
    handleRoleChange(nextRole);
  };

  return (
    <div className="min-h-screen bg-[#edf7f5] flex flex-col">
      <header className="px-8 py-5">
        <Logo />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-9">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-teal-100/60 border border-teal-100 px-4 py-4">

          <div className="text-center mb-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create your account</h1>
            <p className="text-sm text-gray-500 mt-1">Your medical profile, secured and ready.</p>
          </div>

          <div className="mb-3">
            <RoleToggle role={role} setRole={onRoleSelect} />
          </div>

          <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-3">
            <InputField onChange={handleChange} value={formData.fullName} label="Full Name" id="fullName" placeholder="John Doe" setToast={setToast} />
            <InputField onChange={handleChange} value={formData.identifier} label="Phone/Email" id="identifier" type="text" placeholder="+977 98XXXXXXXX" setToast={setToast} />
            <InputField onChange={handleChange} value={formData.password} label="Password" id="password" type="password" placeholder="••••••••" setToast={setToast} />
            <InputField onChange={handleChange} value={formData.confirmPassword} label="Confirm Password" id="confirmPassword" type="password" placeholder="••••••••" setToast={setToast} />
            {
              role.toLowerCase() === "doctor" 
              ?  <LicenseUpload />: null
            }
           

            <div className="mt-2">
              <SubmitButton role={role} />
            </div>
          </div>
          </form>


          <div className="mt-3">
            <LoginLink />
          </div>
        </div>
      </main>

      <footer className="text-center pb-6 text-xs text-gray-400">
        © {new Date().getFullYear()} Qure Health — All rights reserved
      </footer>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};