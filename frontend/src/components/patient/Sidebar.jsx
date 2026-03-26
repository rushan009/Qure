import { LogOut, X } from "lucide-react";
import { NAV } from "../../constants/nav";

export default function Sidebar({ active, onNav, isOpen, onClose }) {
  return (
    <aside
      className={`
        fixed top-0 left-0 h-screen w-[228px] z-[200]
        bg-[hsl(184,46%,86%)] border-r border-[hsl(120,12%,83%)]
        flex flex-col transition-transform duration-250 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 pt-[18px] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-[9px] bg-[hsl(196,64%,50%)] flex items-center justify-center text-white font-extrabold text-base">
            Q
          </div>
          <span className="font-extrabold text-lg text-[hsl(200,25%,15%)]">Qure</span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-lg text-[hsl(200,15%,40%)] hover:bg-[hsl(184,52%,80%)] transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-1 mt-5 overflow-y-auto">
        {NAV.map(({ id, Icon, label }) => (
          <button
            key={id}
            onClick={() => { onNav(id); onClose(); }}
            className={`
              flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-left
              text-[13.5px] font-medium transition-all duration-150 font-['DM_Sans',sans-serif]
              ${active === id
                ? "bg-[hsl(196,64%,50%)] text-white"
                : "text-[hsl(200,15%,40%)] hover:bg-[hsl(184,52%,80%)] hover:text-[hsl(200,25%,15%)]"
              }
            `}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>

      {/* Sign Out */}
      <div className="px-2.5 pb-4 pt-2.5 border-t border-[hsl(120,12%,83%)]">
        <button className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-left text-[13.5px] font-medium text-[hsl(200,15%,40%)] hover:bg-[hsl(184,52%,80%)] hover:text-[hsl(200,25%,15%)] transition-all duration-150">
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
