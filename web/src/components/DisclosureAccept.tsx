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
    <section className="rounded-2xl border border-line bg-panel p-6 sm:p-7">
      <p className="eyebrow">Step 02</p>
      <h3 className="mt-2.5 font-display text-[20px] font-semibold tracking-tight text-fg">
        Read what you are taking on
      </h3>
      <p className="mt-2 max-w-[58ch] text-[14px] leading-relaxed text-muted">
        Every point below is a real exposure, not boilerplate. Read them before you accept.
      </p>

      <ol className="mt-5 max-h-64 list-none space-y-3 overflow-y-auto rounded-xl border border-line bg-elev p-5 text-[13.5px] leading-relaxed text-muted">
        {points.map((p, i) => (
          <li key={i} className="flex gap-3">
            <span className="shrink-0 pt-0.5 font-mono text-[11px] text-dim">{String(i + 1).padStart(2, "0")}</span>
            <span>{p}</span>
          </li>
        ))}
      </ol>

      <label className="mt-5 flex cursor-pointer items-start gap-3 text-[13.5px] text-fg">
        <input
          type="checkbox"
          checked={mainChecked}
          onChange={(e) => setMainChecked(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-[var(--color-cap)]"
        />
        I have read and accept the above.
      </label>
      <label className="mt-3 flex cursor-pointer items-start gap-3 text-[13.5px] text-muted">
        <input
          type="checkbox"
          checked={tier1Checked}
          onChange={(e) => setTier1Checked(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-[var(--color-pay)]"
        />
        <span>
          Also enable Tier 1 (tool-enabled, containerized) —{" "}
          <span className="text-pay">a materially larger exposure</span> than the default tool-free
          tier.
        </span>
      </label>

      <button
        onClick={accept}
        disabled={!mainChecked}
        className="mt-6 rounded-xl bg-cap px-5 py-3 font-display text-[14.5px] font-semibold text-ink transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:bg-elev disabled:text-dim"
      >
        Accept and continue
      </button>
      {error && <p className="mt-3 font-mono text-[12px] text-danger">{error}</p>}
    </section>
  );
}
