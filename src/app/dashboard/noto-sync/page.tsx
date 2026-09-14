import { NotoSyncDashboard } from "@/features/sync/components/NotoSyncCard"

export const metadata = {
  title: "Noto Sync | NotoMed",
  description: "Gerencie suas conexões bancárias via Open Finance Pluggy.",
}

export default function NotoSyncPage() {
  return (
    <div className="w-[80%] mx-auto pb-16">
      <NotoSyncDashboard />
    </div>
  )
}
