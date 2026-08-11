"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getSession } from "@/lib/api";
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

  if (!data) return <main className="min-h-screen bg-black text-white p-8">Loading...</main>;

  return (
    <main className="min-h-screen bg-black text-white p-8 max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <NodesList nodes={data.nodes} />
      <div>
        <h2 className="text-lg font-semibold mb-2">Accrued balance</h2>
        <BalanceCard balance={data.balance} />
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Recent jobs</h2>
        <JobsTable jobs={data.jobs} />
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Payout history</h2>
        <PayoutsTable payouts={data.payouts} />
      </div>
      <div className="flex gap-3">
        <KillSwitch onDone={refresh} />
        <button onClick={refresh} className="rounded-md border border-gray-700 px-4 py-2 text-sm">Refresh</button>
      </div>
    </main>
  );
}
