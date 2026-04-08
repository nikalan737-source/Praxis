"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  redirectAfterLogin?: string;
};

export function LoginModal({ isOpen, onClose, redirectAfterLogin }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const { signInWithOtp } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const { error } = await signInWithOtp(email.trim(), redirectAfterLogin);
      if (error) {
        setStatus("error");
        setErrorMsg(error.message);
      } else {
        setStatus("sent");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Sign in to Praxis</h2>
        <p className="text-sm text-slate-500 mb-5">
          No password needed — we&apos;ll email you a one-click sign-in link.
        </p>

        {status === "sent" ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
              <p className="text-2xl mb-2">📬</p>
              <p className="text-sm font-semibold text-emerald-800">Check your email</p>
              <p className="text-sm text-emerald-700 mt-1">
                We sent a sign-in link to <span className="font-medium">{email}</span>.
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800 font-medium mb-1">⚠ Important</p>
              <p className="text-xs text-amber-700">
                Open the email and click the link — <span className="font-semibold">do not copy and paste it</span>. The link logs you in automatically and brings you right back here.
              </p>
            </div>
            <p className="text-xs text-center text-slate-400">
              Didn&apos;t get it? Check your spam folder or{" "}
              <button
                type="button"
                className="underline text-slate-500 hover:text-slate-700"
                onClick={() => setStatus("idle")}
              >
                try again
              </button>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="login-email" className="text-xs font-medium text-slate-600 block mb-1">
                Your email address
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                required
                autoFocus
              />
            </div>
            {status === "error" && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              >
                {errorMsg}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={status === "sending"}
                className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {status === "sending" ? "Sending…" : "Send sign-in link →"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-slate-400 text-center">
              You&apos;ll receive one email with a single sign-in link. No password, ever.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
