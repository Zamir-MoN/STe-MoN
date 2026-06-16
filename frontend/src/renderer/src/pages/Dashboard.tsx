import React, { useState, useEffect } from 'react'
import { Search, Gamepad2, Play, Users, Activity, ExternalLink, Link, MonitorPlay, ArrowLeft, LayoutDashboard, Check, Plus, ThumbsUp, ThumbsDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api'
import SkeletonCard from '../components/SkeletonCard'
import SkeletonStatBox from '../components/SkeletonStatBox'

const Dashboard = ({ role, showNotification, searchQuery }: { role: string, showNotification: (msg: React.ReactNode, type?: 'success'|'error'|'info') => void, searchQuery: string }) => {
  const [accounts, setAccounts] = useState<any[]>([])
  const [banners, setBanners] = useState<any[]>([])
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts')
      setAccounts(res.data)
    } catch (err) {
      console.error("Failed to fetch accounts", err)
    }
  }

  const fetchBanners = async () => {
    try {
      const res = await api.get('/banner?limit=5')
      if (Array.isArray(res.data)) {
        setBanners(res.data)
      } else if (res.data) {
        setBanners([res.data])
      }
    } catch (err) {}
  }

  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      await Promise.all([fetchAccounts(), fetchBanners()])
      setIsLoading(false)
    }
    init()
    window.addEventListener('refresh_accounts', fetchAccounts as any)
    window.addEventListener('refresh_banner', fetchBanners as any)
    return () => {
      window.removeEventListener('refresh_accounts', fetchAccounts as any)
      window.removeEventListener('refresh_banner', fetchBanners as any)
    }
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [banners.length])

  const handleLibraryToggle = async (id: number, inLibrary: boolean) => {
    try {
      if (inLibrary) {
        await api.delete(`/accounts/${id}/library`)
        showNotification("Game removed from your Library", "info")
      } else {
        await api.post(`/accounts/${id}/library`)
        showNotification("Game added to your Library!", "success")
      }
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, inLibrary: !inLibrary } : a))
    } catch (err) {
      console.error("Failed to toggle library status", err)
      showNotification("Failed to update Library", "error")
    }
  }

  const filteredAccounts = accounts.filter(acc => acc.alias_name?.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 relative z-10">
      {isLoading ? (
        <div className="w-full mb-8">
          <h2 className="text-xl font-bold mb-4 text-white uppercase tracking-wider flex items-center gap-2">
            <MonitorPlay className="w-6 h-6 text-cyan-400" />
            Upcoming Games
          </h2>
          <div className="w-full h-64 bg-white/5 animate-pulse rounded-xl border border-white/10"></div>
        </div>
      ) : banners.length > 0 && (
        <div className="w-full mb-8 relative group">
          <h2 className="text-xl font-bold mb-4 text-white uppercase tracking-wider flex items-center gap-2">
            <MonitorPlay className="w-6 h-6 text-cyan-400" />
            Upcoming Games
          </h2>
          <div className="rounded-xl overflow-hidden shadow-2xl border border-white/10 relative w-full flex items-center justify-center bg-black/50 aspect-[16/7] md:aspect-[21/8]">
            <AnimatePresence mode="wait">
              <motion.img 
                key={currentBannerIndex}
                src={banners[currentBannerIndex].image_url} 
                alt="Upcoming Game Broadcast" 
                style={{ 
                  width: `${banners[currentBannerIndex].zoom_size || 100}%`,
                  objectPosition: `center ${banners[currentBannerIndex].alignment ?? 50}%`
                }}
                className="h-full object-cover block transition-all"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              />
            </AnimatePresence>
            
            {banners.length > 1 && (
              <>
                <button 
                  onClick={() => setCurrentBannerIndex(prev => prev === 0 ? banners.length - 1 : prev - 1)}
                  className="absolute left-4 p-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                >
                  <ArrowLeft size={24} />
                </button>
                <button 
                  onClick={() => setCurrentBannerIndex(prev => (prev + 1) % banners.length)}
                  className="absolute right-4 p-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                >
                  <ArrowLeft size={24} className="rotate-180" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {banners.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentBannerIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${idx === currentBannerIndex ? 'bg-white scale-125' : 'bg-white/30 hover:bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <LayoutDashboard /> Game Store
      </h1>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-gray-400">
          No games match your search.
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <AnimatePresence>
          {filteredAccounts.map(acc => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              key={acc.id} 
              className="relative aspect-[3/4] bg-black/40 rounded-xl overflow-hidden shadow-xl border border-white/10 group hover:border-white/30 transition-all hover:shadow-2xl hover:shadow-black/50"
            >
              {/* Game Cover Image */}
              {acc.description ? (
                <img src={acc.description} alt={acc.alias_name} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-all duration-500" />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-gray-900 to-gray-800 flex items-center justify-center">
                  <Gamepad2 size={48} className="text-white/20" />
                </div>
              )}
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-90 transition-all duration-300"></div>
              
              {/* Top Right Action Button */}
              {acc.inLibrary ? (
                <div 
                  className="absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all z-20 shadow-lg bg-steam-blue/20 text-steam-blue border border-steam-blue/30 flex items-center justify-center cursor-default"
                  title="Already in Library"
                >
                  <Check size={16} />
                </div>
              ) : (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleLibraryToggle(acc.id, false) }}
                  className="absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all z-20 shadow-lg bg-green-500/20 text-green-400 hover:bg-green-500/40 border border-green-500/30"
                  title="Add to Library"
                >
                  <Plus size={16} />
                </button>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-5 transform translate-y-2 group-hover:translate-y-0 transition-all flex flex-col items-center text-center">
                <div className="w-full flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <h3 className="font-bold text-white text-lg drop-shadow-md leading-tight truncate w-full">{acc.alias_name}</h3>
                </div>
                <div className="flex gap-3 mt-2 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center gap-1 text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-md backdrop-blur-md">
                    <ThumbsUp size={12} /> {acc.working_votes || 0}
                  </div>
                  <div className="flex items-center gap-1 text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-md backdrop-blur-md">
                    <ThumbsDown size={12} /> {acc.not_working_votes || 0}
                  </div>
                </div>
              </div>
              </motion.div>
          ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  )
}


export default Dashboard;


