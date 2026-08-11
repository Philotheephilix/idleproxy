"use client";

import { apiFetch } from "@/lib/api";

export function KillSwitch({ onDone }: { onDone: () => void }) {
  async function trigger() {
    await apiFetch("/api/provider/kill-switch", { method: "POST", body: JSON.stringify({ enabled: true }) });
    onDone();
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-danger/25 bg-danger/[0.04] p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="font-display text-[16px] font-semibold text-fg">Stop taking work</h3>
        <p className="mt-1.5 max-w-[52ch] text-[13.5px] leading-relaxed text-muted">
          Takes every node offline immediately. Jobs already in flight finish; nothing new is
          dispatched to you.
        </p>
      </div>
      <button
        onClick={trigger}
        className="shrink-0 rounded-xl border border-danger/50 px-5 py-3 font-display text-[14px] font-semibold text-danger transition-colors hover:bg-danger hover:text-ink"
      >
        Kill switch
      </button>
    </div>
  );
}
