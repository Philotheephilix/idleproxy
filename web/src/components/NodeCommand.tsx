"use client";

export function NodeCommand({ command }: { command: string }) {
  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-3">Start earning</h2>
      <p className="text-sm text-gray-400">Run this on the machine with your claude login:</p>
      <pre className="mt-2 bg-gray-900 border border-gray-800 rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all">
        {command}
      </pre>
      <button
        onClick={() => navigator.clipboard.writeText(command)}
        className="mt-2 rounded-md border border-gray-700 px-4 py-2 text-sm"
      >
        Copy
      </button>
    </div>
  );
}
