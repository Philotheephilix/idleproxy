"use client";

import TiltedCard from "./reactbits/TiltedCard/TiltedCard";

const SURFACES = [
  {
    title: "x402 settlement",
    body: "POST /api/execute/contract-call — verify locally, settle via KeeperHub, so no transaction touches the chain outside it.",
  },
  {
    title: "Payout workflow",
    body: "Webhook trigger → Check Treasury Balance → Solvency Gate → Pay Provider. Solvency check and transfer live in KeeperHub, not application code.",
  },
  {
    title: "Solvency Watchdog",
    body: "Block trigger → Check Treasury Balance → Read USDC Decimals → Condition. Independent treasury monitoring.",
  },
  {
    title: "Treasurer agent",
    body: "MCP server, kh_ header auth — execute_workflow + get_execution. A real Claude Code agent runs payouts, not a cron job.",
  },
];

export function FeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto px-4">
      {SURFACES.map((s) => (
        <TiltedCard
          key={s.title}
          imageSrc="/card-bg.svg"
          altText={s.title}
          containerHeight="220px"
          containerWidth="100%"
          imageHeight="220px"
          imageWidth="100%"
          scaleOnHover={1.03}
          rotateAmplitude={8}
          showMobileWarning={false}
          showTooltip={false}
          displayOverlayContent
          overlayContent={
            <div className="w-[320px] max-w-full h-[220px] flex flex-col justify-center p-6">
              <h3 className="text-lg font-semibold text-teal-300">{s.title}</h3>
              <p className="mt-2 text-sm text-gray-300">{s.body}</p>
            </div>
          }
        />
      ))}
    </div>
  );
}
