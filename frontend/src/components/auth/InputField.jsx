import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

export const InputField = ({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  setToast,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = id === "password" && showPassword ? "text" : type;

  const handleBlur = () => {
    if (!value) return; // empty input
    const trimmedValue = value.trim();

    // Validate Gmail
    if (trimmedValue.includes("@gmail.com")) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      if (!emailRegex.test(trimmedValue)) {
        setToast({ message: "Invalid Gmail", type: "error" });
        return;
      }
      setToast({ message: "Valid Gmail ✅", type: "success" });
      return;
    }

    // Validate phone
    const phoneDigitsOnly = /^[0-9]+$/;
    if (phoneDigitsOnly.test(trimmedValue)) {
      if (trimmedValue.length !== 10) {
        setToast({
          message: "Phone number must be 10 digits",
          type: "error",
        });
        return;
      }
      setToast({ message: "Valid phone number ✅", type: "success" });
      return;
    }

    // Neither email nor phone
    setToast({ message: "Invalid input", type: "error" });
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        <span className="text-red-500 ml-1">*</span>
      </label>

      <div className="relative">
        <input
          id={id}
          type={inputType}
          value={value}          // <-- use prop from parent
          onChange={onChange}    // <-- use parent callback
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 rounded-xl border border-gray-200 text-sm"
        />

        {(id === "password" || id === "confirmPassword") && (
          <button
            type="button"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        )}
      </div>
    </div>
  );
};