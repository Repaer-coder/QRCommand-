export default function FilterBar() {
  return (
    <div className="flex gap-3">
      <button className="rounded-lg bg-slate-800 px-4 py-2 text-white">
        All
      </button>

      <button className="rounded-lg bg-slate-900 px-4 py-2 text-slate-400">
        Live
      </button>

      <button className="rounded-lg bg-slate-900 px-4 py-2 text-slate-400">
        Draft
      </button>

      <button className="rounded-lg bg-slate-900 px-4 py-2 text-slate-400">
        Paused
      </button>
    </div>
  );
}