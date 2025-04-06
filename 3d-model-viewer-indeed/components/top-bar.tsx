import { LogIn, Edit, Plus, ChevronLeft, ChevronRight, Download } from "lucide-react"

export function TopBar() {
  return (
    <div className="h-[60px] border-b border-[#e5e7eb] flex justify-between items-center px-6 bg-white">
      <div className="flex items-center space-x-2">
        <div className="bg-[#b0ffd8] w-6 h-6 rounded-sm flex items-center justify-center text-xs">t</div>
        <span className="text-sm">t-shirt_collection/hostel_t-shirt</span>
      </div>

      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-6">
          <button className="flex flex-col items-center">
            <LogIn size={20} className="mb-1" />
            <span className="text-xs">Import</span>
          </button>

          <button className="flex flex-col items-center">
            <Edit size={20} className="mb-1" />
            <span className="text-xs">Edit</span>
          </button>

          <button className="flex flex-col items-center">
            <Plus size={20} className="mb-1" />
            <span className="text-xs">Insert</span>
          </button>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <ChevronLeft size={16} className="cursor-pointer" />
            <span className="text-sm font-medium mx-2">Size</span>
            <ChevronRight size={16} className="cursor-pointer" />
          </div>

          <button className="flex flex-col items-center">
            <Download size={20} className="mb-1" />
            <span className="text-xs">Export</span>
          </button>
        </div>
      </div>
    </div>
  )
}

