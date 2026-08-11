import React, { useState, useEffect } from 'react'
import { Search, Plus, Play, MonitorPlay, AlertTriangle, WifiOff, Download, Upload, ArrowLeft, Gamepad2, Settings, ThumbsUp, ThumbsDown, Minus, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api'
import SkeletonCard from '../components/SkeletonCard'

const AccountsPage = ({ role, showNotification, searchQuery }: { role: string, showNotification: (msg: React.ReactNode, type?: 'success'|'error'|'info') => void, searchQuery: string }) => {
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null)
  const [launchingId, setLaunchingId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchAccounts = async () => {
    try {
      setIsLoading(true)
      const res = await api.get('/accounts/library')
      setAccounts(res.data)
    } catch (err) {
      console.error("Failed to fetch accounts", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
    window.addEventListener('refresh_accounts', fetchAccounts as any)
    return () => window.removeEventListener('refresh_accounts', fetchAccounts as any)
  }, [])

  const handleLibraryRemove = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    try {
      await api.delete(`/accounts/${id}/library`)
      setAccounts(prev => prev.filter(a => a.id !== id))
      if (selectedAccount?.id === id) setSelectedAccount(null)
      showNotification("Game removed from your Library", "info")
    } catch (err) {
      console.error("Failed to remove game", err)
      showNotification("Failed to remove game", "error")
    }
  }

  const handleLaunch = async (id: number) => {
    setLaunchingId(id)
    try {
      // 1. Fetch the credentials from the remote VPS
      const [credRes, profileRes] = await Promise.all([
        api.post(`/accounts/${id}/credentials`),
        api.get('/auth/profile')
      ])
      
      const { steam_username, steam_password, expires_at } = credRes.data
      const steamPath = profileRes.data?.steam_path

      // 2. Launch Steam LOCALLY using the Electron main process
      // @ts-ignore
      const result = await window.api.launchSteam(steam_username, steam_password, steamPath)
      
      if (!result.success) {
        console.error('Failed to launch locally:', result.error)
        alert('Electron Error: ' + result.error)
      } else {
        if (expires_at) {
          const msLeft = new Date(expires_at).getTime() - Date.now();
          if (msLeft > 0) {
            setTimeout(async () => {
              // @ts-ignore
              if (window.api && window.api.closeSteam) {
                // @ts-ignore
                await window.api.closeSteam();
              }
              alert("Your session for this game has expired!");
              window.location.reload();
            }, msLeft);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch credentials or launch', err)
      const msg = err.response?.data?.error || err.message || 'Unknown error'
      alert('API Error: ' + msg)
    } finally {
      setTimeout(() => setLaunchingId(null), 2000)
    }
  }

  const handleVote = async (id: number, vote: 'working' | 'not_working') => {
    try {
      await api.post(`/accounts/${id}/vote`, { vote })
      // Update local state without re-fetching all
      setSelectedAccount((prev: any) => ({
        ...prev,
        working_votes: vote === 'working' ? (prev.working_votes || 0) + 1 : prev.working_votes,
        not_working_votes: vote === 'not_working' ? (prev.not_working_votes || 0) + 1 : prev.not_working_votes
      }))
      fetchAccounts() // Refresh background list
    } catch (err) {
      console.error("Failed to vote", err)
    }
  }

  if (selectedAccount) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-8 max-w-7xl mx-auto">
        <button 
          onClick={() => setSelectedAccount(null)} 
          className="flex items-center gap-2 mb-6 text-gray-400 hover:text-white transition-colors group uppercase font-bold text-sm tracking-wider"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Cover Art */}
          <div className="w-full lg:w-[30%] flex flex-col gap-6">
            <div className="relative aspect-[3/4] bg-black/40 rounded-xl overflow-hidden shadow-2xl border border-white/10">
              <div className="absolute top-4 left-4 z-20 bg-red-500 text-white font-bold px-3 py-1 text-sm rounded shadow-lg shadow-red-500/20">-20% OFF</div>
              {selectedAccount.description ? (
                <img 
                  src={(selectedAccount.description || '').split(',')[0].trim()} 
                  alt={selectedAccount.alias_name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-gray-900 to-gray-800 flex items-center justify-center">
                  <Gamepad2 size={64} className="text-white/20" />
                </div>
              )}
            </div>
          </div>

          {/* Middle Column: Details & Action */}
          <div className="w-full lg:w-[45%] flex flex-col">
            <h1 className="text-4xl font-black text-white mb-6 tracking-tight uppercase flex items-center gap-3">
              <div className="w-3 h-3 rotate-45 bg-valqore-accent"></div>
              {selectedAccount.alias_name} DETAILS
            </h1>

            <div className="bg-black/30 border border-white/10 rounded-2xl p-6 shadow-xl mb-6">
              <div className="flex gap-2 mb-4">
                <span className="bg-white/10 text-gray-300 text-xs font-bold px-3 py-1 rounded">RPG</span>
                <span className="bg-white/10 text-gray-300 text-xs font-bold px-3 py-1 rounded">WINDOWS</span>
              </div>
              


              <button 
                onClick={() => handleLaunch(selectedAccount.id)}
                disabled={launchingId === selectedAccount.id}
                className="w-full bg-valqore-accent hover:bg-valqore-accent/90 text-black font-black py-4 rounded-xl text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-valqore-accent/20 mb-3 active:scale-[0.98]"
              >
                {launchingId === selectedAccount.id ? 'LAUNCHING STEAM...' : 'LAUNCH STEAM'}
              </button>

              <button className="w-full bg-transparent border border-white/20 text-gray-300 hover:text-white hover:bg-white/5 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 mb-6">
                <span className="text-gray-400">♡</span> Add to Wishlist
              </button>

              <div className="text-center border-t border-white/10 pt-4">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">Secure Payments</p>
                <div className="flex justify-center gap-4">
                  <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center text-[10px] text-gray-400 font-bold border border-white/5">UPI</div>
                  <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center text-[10px] text-gray-400 font-bold border border-white/5">T</div>
                  <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center text-[10px] text-gray-400 font-bold border border-white/5">L</div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mb-8">
              <button onClick={() => handleVote(selectedAccount.id, 'working')} className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-3 rounded-xl transition-colors border border-white/10">
                <ThumbsUp size={18} /> {selectedAccount.working_votes || 0}
              </button>
              <button onClick={() => handleVote(selectedAccount.id, 'not_working')} className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-3 rounded-xl transition-colors border border-white/10">
                <ThumbsDown size={18} /> {selectedAccount.not_working_votes || 0}
              </button>
              <button className="flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-3 rounded-xl transition-colors border border-white/10">
                <Upload size={18} />
              </button>
            </div>

            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-2.5 h-2.5 rotate-45 bg-valqore-accent"></div>
              Account Details
            </h2>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="flex gap-3">
                <div className="mt-1 text-valqore-accent"><Play size={20} /></div>
                <div>
                  <h4 className="font-bold text-white text-sm">Instant Delivery</h4>
                  <p className="text-xs text-gray-400 leading-relaxed mt-1">Your account credentials will be emailed to you immediately after verification.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 text-valqore-accent"><Settings size={20} /></div>
                <div>
                  <h4 className="font-bold text-white text-sm">Lifetime Warranty</h4>
                  <p className="text-xs text-gray-400 leading-relaxed mt-1">Full support provided as long as you follow the account guidelines.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 text-valqore-accent"><WifiOff size={20} /></div>
                <div>
                  <h4 className="font-bold text-white text-sm">Global Access</h4>
                  <p className="text-xs text-gray-400 leading-relaxed mt-1">Play from anywhere in the world without region restrictions.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 text-valqore-accent"><Users size={20} /></div>
                <div>
                  <h4 className="font-bold text-white text-sm">Family Sharing</h4>
                  <p className="text-xs text-gray-400 leading-relaxed mt-1">Available for offline mode and family sharing features.</p>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Developer</p>
                <p className="text-sm text-white font-bold">Neon Studios</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Release Date</p>
                <p className="text-sm text-white font-bold">10/12/2025</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Platform</p>
                <div className="flex gap-2">
                  <span className="bg-white/10 text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded">Windows</span>
                  <span className="bg-white/10 text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded">PlayStation</span>
                </div>
              </div>
            </div>
            
            {(role === 'admin' || role === 'owner') && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-8">
                <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Admin Details</h4>
                <p className="text-sm text-gray-300">User: <span className="text-white font-mono">{selectedAccount.steam_username}</span></p>
                <p className="text-sm text-gray-300 mt-1">Pass: <span className="text-white font-mono blur-sm hover:blur-none transition-all cursor-help">{selectedAccount.steam_password}</span></p>
              </div>
            )}
          </div>

          {/* Right Column: Related News */}
          <div className="w-full lg:w-[25%] flex flex-col gap-6">
            <h2 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
              <div className="w-2.5 h-2.5 rotate-45 bg-valqore-accent"></div>
              RELATED NEWS
            </h2>
            
            {/* News Card 1 */}
            <div className="bg-black/30 border border-white/10 rounded-xl overflow-hidden hover:border-white/30 transition-all cursor-pointer">
              <div className="h-32 bg-gray-800 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-purple-900 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Free Steam Accounts</span>
                  <span className="text-[10px] text-gray-500">1 days ago</span>
                </div>
                <h3 className="text-sm font-bold text-white leading-tight">Stellar Frontiers - Full Premium Account Access Available</h3>
              </div>
            </div>

            {/* News Card 2 */}
            <div className="bg-black/30 border border-white/10 rounded-xl overflow-hidden hover:border-white/30 transition-all cursor-pointer relative">
              <div className="absolute top-2 right-2 z-10 bg-valqore-accent text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase">Trending</div>
              <div className="h-32 bg-gray-800 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-purple-900 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Free Steam Accounts</span>
                  <span className="text-[10px] text-gray-500">2 months ago</span>
                </div>
                <h3 className="text-sm font-bold text-white leading-tight">Abyssal Horrors - Full Premium Account Access Available</h3>
              </div>
            </div>

            {/* News Card 3 */}
            <div className="bg-black/30 border border-white/10 rounded-xl overflow-hidden hover:border-white/30 transition-all cursor-pointer relative">
              <div className="absolute top-2 right-2 z-10 bg-valqore-accent text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase">Trending</div>
              <div className="h-32 bg-gray-800 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-purple-900 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Free Steam Accounts</span>
                  <span className="text-[10px] text-gray-500">3 months ago</span>
                </div>
                <h3 className="text-sm font-bold text-white leading-tight">Velocity X - Full Premium Account Access Available</h3>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    )
  }

  const filteredAccounts = accounts.filter(acc => acc.alias_name?.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Gamepad2 /> Game Library
      </h1>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-gray-400">
          No games in your Library match your search.
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
              className="relative aspect-[3/4] bg-black/40 rounded-xl overflow-hidden shadow-xl border border-white/10 group hover:border-white/30 transition-all cursor-pointer hover:shadow-2xl hover:shadow-black/50"
              onClick={() => setSelectedAccount(acc)}
            >
              {/* Game Cover Image */}
              {acc.description ? (
                <img 
                  src={(acc.description || '').split(',')[0].trim()} 
                  alt={acc.alias_name} 
                  className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-gray-900 to-gray-800 flex items-center justify-center">
                  <Gamepad2 size={48} className="text-white/20" />
                </div>
              )}
              

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-90 transition-all duration-300"></div>
              
              {/* Content (Simplified) */}
              <div className="absolute bottom-0 left-0 right-0 p-5 transform translate-y-2 group-hover:translate-y-0 transition-all flex flex-col items-center text-center">
                <div className="w-full flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {acc.favorite && <span className="text-yellow-400 drop-shadow">★</span>}
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

export default AccountsPage;


