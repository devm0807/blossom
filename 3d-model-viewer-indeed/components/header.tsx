import { Users, Settings, Plus } from "lucide-react"

interface HeaderProps {
  currentTeam: string
}

export function Header({ currentTeam }: HeaderProps) {
  return (
    <div className="flex items-center justify-between p-3 border-b border-[#e8e8e8]">
      <div className="flex items-center">
        <div className="bg-[#b0ffd8] w-5 h-5 rounded-sm mr-2"></div>
        <span className="text-sm font-medium">{currentTeam}</span>
      </div>

      <div className="flex items-center">
        <Users size={18} className="mr-3" />
        <Settings size={18} className="mr-3" />
        <Plus size={18} />
      </div>
    </div>
  )
}

