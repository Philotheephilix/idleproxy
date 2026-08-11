export function NodesList({ nodes }: { nodes: Array<{ id: string; adapter: string; status: string }> }) {
  if (nodes.length === 0) return <p className="text-sm text-gray-500">No nodes connected yet.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {nodes.map((n) => (
        <span key={n.id} className={`rounded-full px-3 py-1 text-xs font-semibold ${n.status === "online" ? "bg-teal-900 text-teal-300" : "bg-gray-800 text-gray-400"}`}>
          {n.adapter}: {n.status}
        </span>
      ))}
    </div>
  );
}
