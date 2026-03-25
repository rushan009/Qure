import React from "react";

export default function Field({ label, value }) {
  return (
    <div className="flex flex-col mb-3">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-sm font-semibold text-gray-800">{value}</span>
    </div>
  );
}