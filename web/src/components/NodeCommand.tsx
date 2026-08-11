"use client";

import { useState } from "react";

export function NodeCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="rounded-2xl border border-cap/30 bg-panel p-6 sm:p-7">
      <p className="eyebrow" style={{ color: "var(--color-cap)" }}>
        Step 04
      </p>
      <h3 className="mt-2.5 font-display text-[20px] font-semibold tracking-tight text-fg">
        Run this on the machine with your claude login
      </h3>
      <p className="mt-2 max-w-[58ch] text-[14px] leading-relaxed text-muted">
        The node registers itself and starts reporting idle capacity. The token in this command is a
        credential — treat it like a password.
      </p>

      <div className="mt-5 overflow-hidden rounded-xl border border-line bg-elev">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <span className="font-mono text-[10.5px] tracking-widest text-dim uppercase">your machine</span>
          <button
            onClick={copy}
            className="rounded-md border border-line-2 px-2.5 py-1 font-mono text-[11px] text-muted transition-colors hover:border-cap hover:text-cap"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="overflow-x-auto px-4 py-4 font-mono text-[12.5px] leading-[1.7] break-all whitespace-pre-wrap text-fg">
          {command}
        </pre>
      </div>

      <a
        href="/dashboard"
        className="mt-6 inline-flex items-center gap-2 font-display text-[14.5px] font-medium text-cap transition-opacity hover:opacity-80"
      >
        Go to your dashboard
        <span aria-hidden>→</span>
      </a>
    </section>
  );
}
