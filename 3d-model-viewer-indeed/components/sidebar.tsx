import { User, Crown, LayoutGrid, Diamond } from "lucide-react"

export function Sidebar() {
  return (
    <div className="w-[60px] border-r border-[#e5e7eb] flex flex-col items-center py-4 bg-white">
      <div className="flex flex-col items-center space-y-6">
        <button className="p-2 hover:bg-[#f5f5f5] rounded-md">
          <User size={24} className="text-[#6b7280]" />
        </button>
        <button className="p-2 hover:bg-[#f5f5f5] rounded-md">
          <Crown size={24} className="text-[#6b7280]" />
        </button>
        <button className="p-2 hover:bg-[#f5f5f5] rounded-md">
          <LayoutGrid size={24} className="text-[#6b7280]" />
        </button>
        <button className="p-2 hover:bg-[#f5f5f5] rounded-md">
          <Diamond size={24} className="text-[#558eff]" />
        </button>
      </div>
    </div>
  )
}

