"use client";

import { useState } from "react";
import { WalletConnect } from "./WalletConnect";
import { DisclosureAccept } from "./DisclosureAccept";
import { CapsForm } from "./CapsForm";
import { NodeCommand } from "./NodeCommand";

type Step = "connect" | "disclosure" | "caps" | "command";

const ORDER: Step[] = ["connect", "disclosure", "caps", "command"];
const RAIL: Array<{ step: Step; label: string }> = [
  { step: "connect", label: "Connect wallet" },
  { step: "disclosure", label: "Accept disclosure" },
  { step: "caps", label: "Set caps" },
  { step: "command", label: "Run the node" },
];

export function OnboardingFlow() {
  const [step, setStep] = useState<Step>("connect");
  const [command, setCommand] = useState("");

  const current = ORDER.indexOf(step);

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <ol className="lg:col-span-3">
        {RAIL.map((r, i) => {
          const state = i < current ? "done" : i === current ? "active" : "todo";
          return (
            <li key={r.step} className="relative flex gap-4 pb-7 last:pb-0">
              {i < RAIL.length - 1 && (
                <span
                  aria-hidden
                  className={`absolute top-7 left-[13px] h-[calc(100%-1.75rem)] w-px ${
                    state === "done" ? "bg-cap/50" : "bg-line"
                  }`}
                />
              )}
              <span
                className={`z-10 grid size-7 shrink-0 place-items-center rounded-full border font-mono text-[11px] ${
                  state === "done"
                    ? "border-cap/50 bg-cap-deep text-cap"
                    : state === "active"
                      ? "border-cap bg-cap text-ink"
                      : "border-line bg-elev text-dim"
                }`}
              >
                {state === "done" ? "✓" : `0${i + 1}`}
              </span>
              <span
                className={`pt-1 text-[14px] ${
                  state === "todo" ? "text-dim" : state === "active" ? "text-fg" : "text-muted"
                }`}
              >
                {r.label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="min-w-0 space-y-5 lg:col-span-9">
        <WalletConnect onConnected={() => setStep((s) => (s === "connect" ? "disclosure" : s))} />
        {step !== "connect" && <DisclosureAccept onAccepted={() => setStep("caps")} />}
        {(step === "caps" || step === "command") && (
          <CapsForm
            onToken={(cmd) => {
              setCommand(cmd);
              setStep("command");
            }}
          />
        )}
        {step === "command" && <NodeCommand command={command} />}
      </div>
    </div>
  );
}
