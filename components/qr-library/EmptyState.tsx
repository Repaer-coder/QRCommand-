"use client";
type EmptyStateProps = {
  onCreate?: () => void;
};

export default function EmptyState({ onCreate }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-16 text-center">
      <h2 className="text-2xl font-bold text-white">
        No QR Campaigns Yet
      </h2>

      <p className="mt-3 text-slate-400">
        Create your first QR campaign to begin tracking scans.
      </p>

      <button
  onClick={() => (window.location.href = "/dashboard/new")}
        className="mt-8 rounded-xl bg-lime-500 px-6 py-3 font-semibold text-black hover:bg-lime-400"
      >
        Create Your First QR
      </button>
    </div>
  );
}