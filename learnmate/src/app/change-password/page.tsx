"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Lock, ShieldAlert, CheckCircle2, ArrowRight } from "lucide-react";

export default function ChangePasswordPage() {
  const { user, changePassword, getRolePath } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match. Please verify.");
      return;
    }

    setLoading(true);
    try {
      await changePassword(newPassword, currentPassword || undefined);
      setSuccess(true);
      setTimeout(() => {
        if (user) {
          router.push(getRolePath(user.role));
        } else {
          router.push("/login");
        }
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f3f8] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 items-center justify-center shadow-lg shadow-amber-500/20 mb-3">
          <ShieldAlert className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Set Permanent Password</h1>
        <p className="mt-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
          Action Required Before Continuing
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="neu-card p-7 sm:p-8 space-y-6">
          <div className="neu-inset p-3.5 text-xs text-amber-800 leading-relaxed font-medium">
            Your account was created or reset with a temporary password. Please set a new personal password to unlock your portal features.
          </div>

          {error && (
            <div className="neu-inset p-3 text-xs text-rose-800 font-semibold">
              {error}
            </div>
          )}

          {success && (
            <div className="neu-inset p-3 flex items-center gap-2 text-xs text-emerald-800 font-semibold">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>Password updated successfully! Redirecting to your dashboard...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!user?.mustChangePassword && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Current Password</label>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3.5 text-slate-400 pointer-events-none z-10" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="neu-input w-full"
                    style={{ paddingLeft: "42px" }}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">New Password</label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3.5 text-slate-400 pointer-events-none z-10" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="neu-input w-full"
                  style={{ paddingLeft: "42px" }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm New Password</label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3.5 text-slate-400 pointer-events-none z-10" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type your new password"
                  className="neu-input w-full"
                  style={{ paddingLeft: "42px" }}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full neu-btn-primary py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? "Updating..." : "Save New Password"}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
