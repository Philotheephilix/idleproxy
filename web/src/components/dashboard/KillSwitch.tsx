"use client";

import { apiFetch } from "@/lib/api";

export function KillSwitch({ onDone }: { onDone: () => void }) {
  async function trigger() {
    await apiFetch("/api/provider/kill-switch", { method: "POST", body: JSON.stringify({ enabled: true }) });
    onDone();
  }
  return (
    <button onClick={trigger} className="rounded-md bg-red-500 px-4 py-2 font-semibold text-black">
      Kill switch
    </button>
  );
}
