"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getSession } from "@/lib/api";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { NodesList } from "@/components/dashboard/NodesList";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { JobsTable } from "@/components/dashboard/JobsTable";
import { PayoutsTable } from "@/components/dashboard/PayoutsTable";
import { KillSwitch } from "@/components/dashboard/KillSwitch";

interface MeResponse {
  provider: unknown;
  balance: { accrued_micros: string; paid_out_micros: string } | null;
  nodes: Array<{ id: string; adapter: string; status: string }>;
  jobs: Array<{ id: string; model: string; band: string; status: string; cost_usd_micros: number | null }>;
  payouts: Array<{ id: string; amount_micros: number; status: string; transaction_link: string | null }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<MeResponse | null>(null);

  async function refresh() {
    const res = await apiFetch("/api/provider/me");
    if (!res.ok) {
      router.push("/");
      return;
    }
    setData(await res.json());
  }

  useEffect(() => {
    if (!getSession()) {
      router.push("/");
      return;
    }
    refresh();
  }, [router]);

  if (!data) {
    return (
      <>
        <SiteNav dashboard />
        <main className="flex-1">
          <div className="mx-auto max-w-[1000px] px-6 py-20">
            <p className="eyebrow">Provider</p>
            <div className="mt-6 h-8 w-56 animate-pulse rounded-md bg-elev" />
            <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
              <div className="h-32 animate-pulse bg-panel" />
              <div className="h-32 animate-pulse bg-panel" />
            </div>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const online = data.nodes.filter((n) => n.status === "online").length;

  return (
    <>
      <SiteNav dashboard />

      <main className="flex-1">
        <div className="mx-auto max-w-[1000px] space-y-12 px-6 py-14 lg:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Provider</p>
              <h1 className="mt-3 font-display text-[32px] font-semibold tracking-[-0.02em]">Dashboard</h1>
              <p className="mt-2 text-[14px] text-muted">
                {online > 0
                  ? `${online} node${online === 1 ? "" : "s"} online and taking work.`
                  : "No nodes online — nothing is being dispatched to you."}
              </p>
            </div>
            <button
              onClick={refresh}
              className="rounded-lg border border-line-2 bg-elev px-4 py-2.5 font-mono text-[12px] text-muted transition-colors hover:border-cap hover:text-cap"
            >
              Refresh
            </button>
          </div>

          <section className="space-y-4">
            <h2 className="eyebrow">Nodes</h2>
            <NodesList nodes={data.nodes} />
          </section>

          <section className="space-y-4">
            <h2 className="eyebrow">Balance</h2>
            <BalanceCard balance={data.balance} />
          </section>

          <section className="space-y-4">
            <h2 className="eyebrow">Recent jobs</h2>
            <JobsTable jobs={data.jobs} />
          </section>

          <section className="space-y-4">
            <h2 className="eyebrow">Payouts</h2>
            <PayoutsTable payouts={data.payouts} />
          </section>

          <KillSwitch onDone={refresh} />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
