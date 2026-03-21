export const RoleToggle = ({ role, setRole }) => (
  <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
    {["Patient", "Doctor"].map((r) => (
      <button
        key={r}
        type="button"
        onClick={() => setRole(r)}
        className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
          role.toLowerCase() === r.toLowerCase()
            ? "bg-teal-500 text-white shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        {r}
      </button>
    ))}
  </div>
);