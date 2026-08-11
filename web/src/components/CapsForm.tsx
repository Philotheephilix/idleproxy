"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

export function CapsForm({ onToken }: { onToken: (command: string) => void }) {
  const [dailyUsdCap, setDailyUsdCap] = useState(5);
  const [dailyRequestCap, setDailyRequestCap] = useState(500);
  const [maxConcurrency, setMaxConcurrency] = useState(1);
  const [reserveFraction, setReserveFraction] = useState(0.2);
  const [error, setError] = useState("");

  async function requestToken() {
    setError("");
    const res = await apiFetch("/api/provider/node-token", {
      method: "POST",
      body: JSON.stringify({ dailyUsdCap, dailyRequestCap, maxConcurrency, reserveFraction }),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error?.message ?? "failed to get node token");
      return;
    }
    const body = await res.json();
    onToken(body.command);
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-3">Set caps</h2>
      <label className="block text-sm text-gray-400 mt-2">Daily USD cap (notional)</label>
      <input type="number" value={dailyUsdCap} min={0.5} step={0.5} onChange={(e) => setDailyUsdCap(Number(e.target.value))} className="w-full bg-gray-900 border border-gray-800 rounded-md p-2" />
      <label className="block text-sm text-gray-400 mt-2">Daily request cap</label>
      <input type="number" value={dailyRequestCap} min={1} step={1} onChange={(e) => setDailyRequestCap(Number(e.target.value))} className="w-full bg-gray-900 border border-gray-800 rounded-md p-2" />
      <label className="block text-sm text-gray-400 mt-2">Max concurrency</label>
      <input type="number" value={maxConcurrency} min={1} step={1} onChange={(e) => setMaxConcurrency(Number(e.target.value))} className="w-full bg-gray-900 border border-gray-800 rounded-md p-2" />
      <label className="block text-sm text-gray-400 mt-2">Reserve fraction (0-1)</label>
      <input type="number" value={reserveFraction} min={0} max={0.9} step={0.05} onChange={(e) => setReserveFraction(Number(e.target.value))} className="w-full bg-gray-900 border border-gray-800 rounded-md p-2" />
      <button onClick={requestToken} className="mt-4 rounded-md bg-teal-400 px-4 py-2 font-semibold text-black">
        Get node command
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
