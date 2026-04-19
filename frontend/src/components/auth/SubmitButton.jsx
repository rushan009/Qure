export const SubmitButton = ({ role, label, type}) => (
  <button
    type={type || "submit"}
    className="w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white font-semibold text-[13px] sm:text-sm transition-all duration-150 shadow-sm hover:shadow-md flex items-center justify-center gap-2 whitespace-nowrap"
  >
    {label == 'log in' 
      ? <span>Log in</span>
      : <span>Create Account as {role}</span>
    }
  </button>
);