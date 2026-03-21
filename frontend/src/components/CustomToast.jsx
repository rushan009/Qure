import { useEffect } from "react";
import { FiCheck, FiX, FiInfo } from "react-icons/fi";

export const CustomToast = ({ message, type = "info", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onClose]);

  const baseStyle =
    "px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-3 animate-slideDown bg-white border";

  const typeStyles = {
    success: "border-green-500 text-gray-900",
    error: "border-red-500 text-gray-900",
    info: "border-gray-300 text-gray-900",
  };

  const icons = {
    success: <FiCheck className="text-green-500 w-5 h-5" />,
    error: <FiX className="text-red-500 w-5 h-5" />,
    info: <FiInfo className="text-gray-500 w-5 h-5" />,
  };

  return (
    <div className={`${baseStyle} ${typeStyles[type]}`}>
      {icons[type]}
      <span>{message}</span>
    </div>
  );
};