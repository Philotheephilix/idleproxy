"use client";

import { useState } from "react";
import { WalletConnect } from "./WalletConnect";
import { DisclosureAccept } from "./DisclosureAccept";
import { CapsForm } from "./CapsForm";
import { NodeCommand } from "./NodeCommand";

type Step = "connect" | "disclosure" | "caps" | "command";

export function OnboardingFlow() {
  const [step, setStep] = useState<Step>("connect");
  const [command, setCommand] = useState("");

  return (
    <div className="space-y-12">
      <WalletConnect onConnected={() => setStep((s) => (s === "connect" ? "disclosure" : s))} />
      {step !== "connect" && <DisclosureAccept onAccepted={() => setStep("caps")} />}
      {(step === "caps" || step === "command") && <CapsForm onToken={(cmd) => { setCommand(cmd); setStep("command"); }} />}
      {step === "command" && (
        <>
          <NodeCommand command={command} />
          <div className="text-center">
            <a href="/dashboard" className="text-teal-300 underline text-sm">Go to dashboard</a>
          </div>
        </>
      )}
    </div>
  );
}
