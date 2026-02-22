"use client";

import { useState } from "react";
import { usePersistedState } from "@/lib/use-persisted-state";

export function EmailDigest() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = usePersistedState<string | null>("solarcast_email", null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setStatus("sending");

    // Simulate subscription (would POST to backend in production)
    setTimeout(() => {
      setSubscribed(email);
      setStatus("sent");
    }, 800);
  }

  function handleUnsubscribe() {
    setSubscribed(null);
    setEmail("");
    setStatus("idle");
  }

  if (subscribed) {
    return (
      <div className="glass-card p-5 space-y-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-sky-400 text-base leading-none">&#9993;</span>
          Weekly Digest
        </h2>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-emerald-300 text-sm font-medium">Subscribed</p>
          <p className="text-slate-400 text-xs mt-1">
            Weekly forecast sent to <span className="text-white">{subscribed}</span> every Sunday evening.
          </p>
        </div>
        <div className="space-y-2 text-xs text-slate-400">
          <p>Your digest includes:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-500">
            <li>7-day production forecast with daily breakdown</li>
            <li>Best production day highlighted</li>
            <li>Estimated cost savings for the week</li>
            <li>Smart scheduling tips for high-production days</li>
          </ul>
        </div>
        <button
          onClick={handleUnsubscribe}
          className="text-xs text-slate-600 hover:text-red-400 transition-colors"
        >
          Unsubscribe
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 space-y-3">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <span className="text-sky-400 text-base leading-none">&#9993;</span>
        Weekly Digest
      </h2>

      <p className="text-sm text-slate-400">
        Get your solar forecast delivered every Sunday evening so you can plan the week ahead.
      </p>

      <form onSubmit={handleSubscribe} className="flex gap-2">
        <input
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
            placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all
            bg-gradient-to-r from-sky-500 to-blue-500 text-white
            hover:from-sky-400 hover:to-blue-400 disabled:opacity-50"
        >
          {status === "sending" ? "..." : "Subscribe"}
        </button>
      </form>

      <p className="text-[10px] text-slate-600">
        Free, no spam, unsubscribe anytime. Your system config is included automatically.
      </p>
    </div>
  );
}
