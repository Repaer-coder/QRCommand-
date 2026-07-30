type QRCardProps = {
  name: string;
  type: string;
  scans: number;
  status: "Live" | "Draft" | "Paused";
};

const statusColors = {
  Live: "bg-emerald-500 text-white",
  Draft: "bg-amber-500 text-black",
  Paused: "bg-slate-600 text-white",
};

export default function QRCard({
  name,
  type,
  scans,
  status,
}: QRCardProps) {
  return (
    <div className="group rounded-2xl border border-slate-800 bg-slate-900 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-lime-500 hover:shadow-2xl">

      <div className="mb-6 flex items-start justify-between">

        <div>
          <h3 className="text-xl font-bold text-white">
            {name}
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            {type}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[status]}`}
        >
          {status}
        </span>

      </div>

      <div className="rounded-xl bg-slate-800 p-4">

        <p className="text-xs uppercase tracking-wide text-slate-400">
          Total Scans
        </p>

        <p className="mt-2 text-3xl font-bold text-white">
          {scans}
        </p>

      </div>

      <div className="mt-6 flex gap-3">

        <button className="rounded-lg bg-lime-500 px-4 py-2 font-semibold text-black transition hover:bg-lime-400">
          Analytics
        </button>

        <button className="rounded-lg border border-slate-700 px-4 py-2 text-white transition hover:border-white">
          Edit
        </button>

      </div>

    </div>
  );
}