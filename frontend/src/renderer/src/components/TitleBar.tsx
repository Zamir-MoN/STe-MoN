import { Minus, Square, X } from 'lucide-react'

const TitleBar = () => {
  return (
    <div className="h-8 bg-black/40 backdrop-blur-md flex justify-between items-center select-none draggable">
      <div className="flex items-center px-4 gap-2">
        <div className="w-3 h-3 rounded-full bg-valqore-accent"></div>
        <span className="text-xs font-semibold text-valqore-accent tracking-wider">Valqore.Pro</span>
      </div>
      <div className="flex h-full non-draggable">
        <button className="h-full px-4 hover:bg-white/10 transition-colors" onClick={() => window.api.minimize()}>
          <Minus size={16} />
        </button>
        <button className="h-full px-4 hover:bg-white/10 transition-colors" onClick={() => window.api.maximize()}>
          <Square size={14} />
        </button>
        <button className="h-full px-4 hover:bg-red-500 transition-colors" onClick={() => window.api.close()}>
          <X size={16} />
        </button>
      </div>
    </div>
  )
}


export default TitleBar;

