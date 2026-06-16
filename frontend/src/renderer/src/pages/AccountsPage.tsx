import React, { useState, useEffect } from 'react'
import { Search, Plus, Play, MonitorPlay, AlertTriangle, WifiOff, Download, Upload, ArrowLeft, Gamepad2, Settings, ThumbsUp, ThumbsDown, Minus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api'
import SkeletonRow from '../components/SkeletonRow'
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
      await api.post(`/accounts/${id}/launch`)
    } catch (err) {
      console.error('Failed to launch steam', err)
      alert('Failed to launch Steam. Make sure it is installed.')
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
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-8 max-w-5xl mx-auto">
        <button 
          onClick={() => setSelectedAccount(null)} 
          className="flex items-center gap-2 mb-6 text-gray-400 hover:text-white transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Library
        </button>

        <div className="flex flex-col md:flex-row gap-10">
          {/* Left Column: Image & Launch */}
          <div className="w-full md:w-1/3 flex flex-col gap-6">
            <div className="relative aspect-[3/4] bg-black/40 rounded-xl overflow-hidden shadow-2xl border border-white/10">
              {selectedAccount.description ? (
                <img 
                  src={selectedAccount.description} 
                  alt={selectedAccount.alias_name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-gray-900 to-gray-800 flex items-center justify-center">
                  <Gamepad2 size={64} className="text-white/20" />
                </div>
              )}
              {selectedAccount.favorite && (
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md rounded-full p-2">
                  <span className="text-yellow-400 drop-shadow">★</span>
                </div>
              )}
            </div>

            <button 
              onClick={() => handleLaunch(selectedAccount.id)}
              disabled={launchingId === selectedAccount.id}
              className="w-full bg-transparent border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40 py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <MonitorPlay size={24} />
              {launchingId === selectedAccount.id ? 'Launching Steam...' : 'Launch Steam'}
            </button>
            
            {role === 'admin' && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Admin Details</h4>
                <p className="text-sm text-gray-300">User: <span className="text-white font-mono">{selectedAccount.steam_username}</span></p>
                <p className="text-sm text-gray-300 mt-1">Pass: <span className="text-white font-mono blur-sm hover:blur-none transition-all cursor-help">{selectedAccount.steam_password}</span></p>
              </div>
            )}
          </div>

          {/* Right Column: Details & Instructions */}
          <div className="w-full md:w-2/3 flex flex-col">
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">{selectedAccount.alias_name}</h1>
            <p className="text-gray-400 mb-8 text-lg">Follow the instructions carefully to play safely.</p>

            <div className="grid grid-cols-1 gap-6">
              {/* Important Rules */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 shadow-lg shadow-red-500/5">
                <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                  <AlertTriangle size={24} /> Important Rules
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="bg-red-500/20 p-2 rounded-lg text-red-400 mt-0.5"><Download size={18} /></div>
                    <p className="text-gray-200 leading-tight pt-1">Download the game.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-red-500/20 p-2 rounded-lg text-red-400 mt-0.5"><MonitorPlay size={18} /></div>
                    <p className="text-gray-200 leading-tight pt-1">Launch the game once in online mode, then close it after 30 seconds <span className="bg-black/50 px-2 py-0.5 rounded text-xs font-mono border border-white/10 text-gray-400 ml-1">ALT + F4</span></p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-red-500/20 p-2 rounded-lg text-red-400 mt-0.5"><WifiOff size={18} /></div>
                    <p className="text-gray-200 leading-tight pt-1">Set Steam to Offline Mode.</p>
                  </li>
                </ul>
              </div>

              {/* How to Enable Offline Mode */}
              <div className="bg-steam-blue/10 border border-steam-blue/20 rounded-2xl p-6 shadow-lg shadow-steam-blue/5">
                <h3 className="text-xl font-bold text-steam-blue mb-4 flex items-center gap-2">
                  <Settings size={24} /> How to Enable Offline Mode
                </h3>
                <ol className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="bg-steam-blue/20 p-2 rounded-lg text-steam-blue mt-0.5"><MonitorPlay size={18} /></div>
                    <p className="text-gray-200 leading-tight pt-1">Click <strong>Steam</strong> in the top-left corner of the Steam client.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-steam-blue/20 p-2 rounded-lg text-steam-blue mt-0.5"><WifiOff size={18} /></div>
                    <p className="text-gray-200 leading-tight pt-1">Select <strong>"Go Offline"</strong> and confirm.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-steam-blue/20 p-2 rounded-lg text-steam-blue mt-0.5"><Settings size={18} /></div>
                    <p className="text-gray-200 leading-tight pt-1">Click on <strong>Settings &gt; Cloud</strong> and <strong className="text-red-400">DISABLE</strong> it.</p>
                  </li>
                </ol>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg shadow-white/5 mt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Does this account work?</h3>
                  <p className="text-sm text-gray-400">Help others by verifying the status.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleVote(selectedAccount.id, 'working')} className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/40 text-green-400 px-4 py-2 rounded-lg transition-colors border border-green-500/30">
                    <ThumbsUp size={18} /> {selectedAccount.working_votes || 0}
                  </button>
                  <button onClick={() => handleVote(selectedAccount.id, 'not_working')} className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 px-4 py-2 rounded-lg transition-colors border border-red-500/30">
                    <ThumbsDown size={18} /> {selectedAccount.not_working_votes || 0}
                  </button>
                </div>
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
                  src={acc.description} 
                  alt={acc.alias_name} 
                  className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-gray-900 to-gray-800 flex items-center justify-center">
                  <Gamepad2 size={48} className="text-white/20" />
                </div>
              )}
              
              {/* Remove Action Button */}
              <button 
                onClick={(e) => handleLibraryRemove(e, acc.id)}
                className="absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all z-20 shadow-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 border border-red-500/30 opacity-0 group-hover:opacity-100"
                title="Remove from Library"
              >
                <Minus size={16} />
              </button>

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


