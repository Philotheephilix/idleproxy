"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export function DisclosureAccept({ onAccepted }: { onAccepted: () => void }) {
  const [points, setPoints] = useState<string[]>([]);
  const [mainChecked, setMainChecked] = useState(false);
  const [tier1Checked, setTier1Checked] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/provider/disclosure")
      .then((r) => r.json())
      .then((body) => setPoints(body.points ?? []));
  }, []);

  async function accept() {
    setError("");
    const res = await apiFetch("/api/provider/accept-disclosure", {
      method: "POST",
      body: JSON.stringify({ tier1Accepted: tier1Checked }),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error?.message ?? "failed to accept disclosure");
      return;
    }
    onAccepted();
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-3">Accept disclosure</h2>
      <div className="max-h-64 overflow-y-auto border border-gray-800 rounded-md p-4 text-sm text-gray-300">
        <ol className="list-decimal pl-4 space-y-2">
          {points.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ol>
      </div>
      <label className="flex items-start gap-2 mt-4 text-sm">
        <input type="checkbox" checked={mainChecked} onChange={(e) => setMainChecked(e.target.checked)} className="mt-1" />
        I have read and accept the above.
      </label>
      <label className="flex items-start gap-2 mt-2 text-sm">
        <input type="checkbox" checked={tier1Checked} onChange={(e) => setTier1Checked(e.target.checked)} className="mt-1" />
        Also enable Tier 1 (tool-enabled, containerized) — a materially larger exposure than the default tool-free tier.
      </label>
      <button
        onClick={accept}
        disabled={!mainChecked}
        className="mt-4 rounded-md bg-teal-400 px-4 py-2 font-semibold text-black disabled:opacity-50"
      >
        Accept and continue
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
