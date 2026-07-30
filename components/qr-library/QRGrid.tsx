import QRCard from "./QRCard";

export default function QRGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <QRCard
        name="Main Menu"
        type="Restaurant Menu"
        scans={0}
        status="Live"
      />

      <QRCard
        name="Google Reviews"
        type="Review Campaign"
        scans={0}
        status="Draft"
      />

      <QRCard
        name="Instagram"
        type="Social Media"
        scans={0}
        status="Paused"
      />
    </div>
  );
}