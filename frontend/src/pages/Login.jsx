import Logo from "../components/ui/Logo";
import { RoleToggle } from "../components/auth/RoleToggle";
import { InputField } from "../components/auth/InputField";
import { LicenseUpload } from "../components/auth/LicenseUpload";
import { SubmitButton } from "../components/auth/SubmitButton";
import { SignupLink } from "../components/auth/SignupLink";

import React from 'react'

export const Login = ({setToast}) => {

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

        

          <div className="flex flex-col gap-3">
            <InputField label="Phone/Email" id="phone/email" type="text" placeholder="+977 98XXXXXXXX" setToast={setToast} />
            <InputField label="Password" id="password" type="password" placeholder="••••••••" setToast={setToast} />
          
           

            <div className="mt-2">
              <SubmitButton label="log in" />
            </div>
          </div>

          <div className="mt-3">
            <SignupLink/>
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
  )
}
