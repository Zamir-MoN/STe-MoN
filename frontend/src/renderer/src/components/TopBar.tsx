import React from 'react'
import { Search, Bell } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const TopBar = React.memo(({ unreadCount, onToggleNotifications, searchQuery, setSearchQuery, currency, setCurrency }: { unreadCount: number, onToggleNotifications: () => void, searchQuery: string, setSearchQuery: (val: string) => void, currency: string, setCurrency: (c: string) => void }) => {
  const location = useLocation()
  const showSearch = location.pathname === '/' || location.pathname === '/accounts'

  return (
    <div className="h-16 flex items-center px-8 bg-black/10 backdrop-blur-sm border-b border-white/5 relative z-10">
      {showSearch && (
        <div className="absolute left-1/2 -translate-x-1/2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search games..." 
            className="bg-black/30 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-valqore-accent/50 focus:ring-1 focus:ring-valqore-accent/50 transition-all w-72 md:w-96"
          />
        </div>
      )}
      <div className="flex items-center gap-4 ml-auto">
        <div className="flex items-center bg-black/30 border border-white/10 rounded-full overflow-hidden p-1 mr-4">
          <button onClick={() => setCurrency('USDT')} className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${currency === 'USDT' ? 'bg-valqore-accent text-black' : 'text-gray-400 hover:text-white'}`}>USDT</button>
          <button onClick={() => setCurrency('INR')} className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${currency === 'INR' ? 'bg-valqore-accent text-black' : 'text-gray-400 hover:text-white'}`}>INR</button>
        </div>
        <button onClick={onToggleNotifications} className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
          <Bell size={18} />
          {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full shadow-lg shadow-red-500/50"></span>}
        </button>
      </div>
    </div>
  )
})

export default TopBar;

