import EmptyState from "@/components/qr-library/EmptyState";
import FilterBar from "@/components/qr-library/FilterBar";
import QRGrid from "@/components/qr-library/QRGrid";
import SearchBar from "@/components/qr-library/SearchBar";

export default function QRLibraryPage() {
  const hasCampaigns = true;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-8 py-10">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">QR Library</h1>

            <p className="mt-2 text-slate-400">
              Manage every QR campaign from one place.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <SearchBar />
        </div>

        <div className="mb-8">
          <FilterBar />
        </div>

        {hasCampaigns ? <QRGrid /> : <EmptyState />}
      </div>
    </main>
  );
}