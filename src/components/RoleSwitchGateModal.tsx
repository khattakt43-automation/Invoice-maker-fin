import React, { useState, useEffect } from "react";
import { Shield, Lock, Eye, EyeOff, X } from "lucide-react";

interface RoleSwitchGateModalProps {
  isOpen: boolean;
  /** Which role we are switching INTO */
  target: "super_admin" | "business_admin" | null;
  /** Human label of the target, e.g. "Super Admin" or the tenant name */
  targetLabel: string;
  onSubmit: (password: string) => void;
  onClose: () => void;
}

/**
 * Password gate shown whenever a user switches roles (Tenant <-> Super Admin).
 * The parent validates the password and either proceeds or returns an error.
 */
const RoleSwitchGateModal: React.FC<RoleSwitchGateModalProps> = ({
  isOpen,
  target,
  targetLabel,
  onSubmit,
  onClose,
}) => {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  // Reset transient state every time the modal opens.
  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setShow(false);
      setError("");
    }
  }, [isOpen]);

  if (!isOpen || !target) return null;

  const goingToAdmin = target === "super_admin";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter the password.");
      return;
    }
    onSubmit(password);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[#0b1c30] rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-white">
            <Shield className="w-5 h-5 text-[#8bf8c2]" />
            <span className="font-bold text-sm">Role Switch Verification</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors cursor-pointer"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-white/70 leading-relaxed">
            You are switching to{" "}
            <span className="font-semibold text-white">{targetLabel}</span>. Enter the
            {goingToAdmin ? " Super Admin" : " tenant"} password to continue.
          </p>

          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              autoFocus
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              placeholder="Enter password"
              className="w-full bg-white/5 border border-white/15 rounded-xl pl-9 pr-10 py-2.5 text-white text-sm placeholder-white/30 outline-none focus:border-[#6edba7]/60"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors cursor-pointer"
              title={show ? "Hide" : "Show"}
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-400 font-medium">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-white/15 text-white/80 text-xs font-semibold hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#006a46] hover:bg-[#00855a] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              Confirm Switch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleSwitchGateModal;
