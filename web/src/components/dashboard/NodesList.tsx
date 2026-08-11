export function NodesList({ nodes }: { nodes: Array<{ id: string; adapter: string; status: string }> }) {
  if (nodes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-panel/50 p-6">
        <p className="text-[14px] text-muted">No nodes connected yet.</p>
        <p className="mt-1.5 text-[13px] text-dim">
          Run the <span className="font-mono text-fg">npx idleproxy node</span> command on the machine
          holding your subscription and it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2.5">
      {nodes.map((n) => {
        const online = n.status === "online";
        return (
          <span
            key={n.id}
            className={`inline-flex items-center gap-2.5 rounded-full border px-3.5 py-2 font-mono text-[12px] ${
              online ? "border-cap/40 bg-cap-deep/40 text-cap" : "border-line bg-elev text-dim"
            }`}
          >
            <span className={`size-1.5 rounded-full ${online ? "live-dot bg-cap" : "bg-dim"}`} />
            {n.adapter}
            <span className="text-dim">·</span>
            {n.status}
          </span>
        );
      })}
    </div>
  );
}
