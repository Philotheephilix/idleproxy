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

  const field =
    "mt-2 w-full rounded-lg border border-line bg-elev px-3 py-2.5 font-mono text-[14px] text-fg transition-colors hover:border-line-2 focus:border-cap focus:outline-none";

  return (
    <section className="rounded-2xl border border-line bg-panel p-6 sm:p-7">
      <p className="eyebrow">Step 03</p>
      <h3 className="mt-2.5 font-display text-[20px] font-semibold tracking-tight text-fg">
        Set the ceiling you are comfortable with
      </h3>
      <p className="mt-2 max-w-[58ch] text-[14px] leading-relaxed text-muted">
        The node stops taking work when any of these is hit. You can change them by restarting the
        node with different flags.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-[13.5px] font-medium text-fg">Daily USD cap (notional)</label>
          <input
            type="number"
            value={dailyUsdCap}
            min={0.5}
            step={0.5}
            onChange={(e) => setDailyUsdCap(Number(e.target.value))}
            className={field}
          />
          <p className="mt-2 text-[12px] text-dim">Notional value of the jobs served in a day.</p>
        </div>

        <div>
          <label className="block text-[13.5px] font-medium text-fg">Daily request cap</label>
          <input
            type="number"
            value={dailyRequestCap}
            min={1}
            step={1}
            onChange={(e) => setDailyRequestCap(Number(e.target.value))}
            className={field}
          />
          <p className="mt-2 text-[12px] text-dim">Hard ceiling on jobs accepted per day.</p>
        </div>

        <div>
          <label className="block text-[13.5px] font-medium text-fg">Max concurrency</label>
          <input
            type="number"
            value={maxConcurrency}
            min={1}
            step={1}
            onChange={(e) => setMaxConcurrency(Number(e.target.value))}
            className={field}
          />
          <p className="mt-2 text-[12px] text-dim">Jobs your machine will run at the same time.</p>
        </div>

        <div>
          <label className="block text-[13.5px] font-medium text-fg">Reserve fraction (0–1)</label>
          <input
            type="number"
            value={reserveFraction}
            min={0}
            max={0.9}
            step={0.05}
            onChange={(e) => setReserveFraction(Number(e.target.value))}
            className={field}
          />
          <p className="mt-2 text-[12px] text-dim">
            Share of the cap held back for you — selling stops at (1 − reserve) × cap.
          </p>
        </div>
      </div>

      <p className="mt-6 border-l-2 border-pay/50 pl-4 text-[12.5px] leading-relaxed text-dim">
        Enforcement is best-effort, from figures the CLI self-reports — a strong bound, not a
        guarantee. The kill switch is always available.
      </p>

      <button
        onClick={requestToken}
        className="mt-6 rounded-xl bg-cap px-5 py-3 font-display text-[14.5px] font-semibold text-ink transition-transform hover:-translate-y-0.5"
      >
        Get node command
      </button>
      {error && <p className="mt-3 font-mono text-[12px] text-danger">{error}</p>}
    </section>
  );
}
