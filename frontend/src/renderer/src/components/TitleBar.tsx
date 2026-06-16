import React from 'react'
import { Minus, Square, X } from 'lucide-react'
import logo from '../assets/logo.png'

const TitleBar = () => {
  return (
    <div className="h-8 bg-black/40 backdrop-blur-md flex justify-between items-center select-none draggable">
      <div className="flex items-center px-4 gap-2">
        <img src={logo} alt="STe MoN Logo" className="w-4 h-4 object-contain" />
        <span className="text-xs font-semibold text-steam-blue tracking-wider">STe MoN</span>
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

