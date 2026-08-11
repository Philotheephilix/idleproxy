import DotGrid from "@/components/reactbits/DotGrid/DotGrid";
import ShinyText from "@/components/reactbits/ShinyText/ShinyText";
import { FeatureCards } from "@/components/FeatureCards";
import { OnboardingFlow } from "@/components/OnboardingFlow";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="relative h-[420px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <DotGrid baseColor="#134e4a" activeColor="#5eead4" />
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-4">
          <ShinyText text="IdleProxy" className="text-5xl font-bold" color="#e5e7eb" shineColor="#5eead4" />
          <p className="mt-4 max-w-xl text-gray-300">
            You pay for a coding-agent subscription. Most hours it sits idle. IdleProxy meters that
            capacity out to agents that pay per call — settled onchain through KeeperHub.
          </p>
          <p className="mt-4 max-w-xl text-sm text-amber-300 border border-amber-800 rounded-md p-3">
            Relaying your own subscription like this likely violates your provider&apos;s resale
            terms. This demo runs on the team&apos;s own accounts, at the team&apos;s own risk.
          </p>
        </div>
      </div>

      <section className="py-16">
        <OnboardingFlow />
      </section>

      <section className="py-16 border-t border-gray-800">
        <h2 className="text-center text-2xl font-semibold mb-8">KeeperHub surfaces used</h2>
        <FeatureCards />
      </section>
    </main>
  );
}
