import React, { useState, useEffect } from 'react'
import { Search, Gamepad2, Play, Users, Activity, ExternalLink, Link, MonitorPlay, ArrowLeft, LayoutDashboard, Check, Plus, ThumbsUp, ThumbsDown, Package } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api'
import SkeletonCard from '../components/SkeletonCard'

const Dashboard = ({ role, showNotification, searchQuery, currency = 'USDT' }: { role: string, showNotification: (msg: React.ReactNode, type?: 'success'|'error'|'info') => void, searchQuery: string, currency?: string }) => {
  const formatPrice = (priceStr: string | null) => {
    if (!priceStr) return 'Free';
    const num = parseFloat(priceStr);
    if (isNaN(num)) return priceStr;
    if (currency === 'INR') return '₹' + (num * 83.5).toFixed(0);
    return '$' + num.toFixed(2);
  };
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null)
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

  const handleLibraryToggle = async (id: number, inLibrary: boolean, hasAccess: boolean) => {
    if (!hasAccess) {
      alert("Buy from admin or Owner");
      return;
    }

    try {
      if (inLibrary) {
        await api.delete(`/accounts/${id}/library`)
        showNotification("Game removed from your Library", "info")
      } else {
        await api.post(`/accounts/${id}/library`)
        showNotification("Game added to your Library!", "success")
      }
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, inLibrary: !inLibrary } : a))
    } catch (err: any) {
      console.error("Failed to toggle library status", err)
      const msg = err.response?.data?.error || "Failed to update Library";
      showNotification(msg, "error")
    }
  }

  const filteredAccounts = accounts
    .filter(acc => acc.alias_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (a.alias_name || '').localeCompare(b.alias_name || ''))

  const bundleAccounts = filteredAccounts.filter(acc => acc.notes)
  const regularAccounts = filteredAccounts.filter(acc => !acc.notes)


  if (selectedAccount) {
    const inLibrary = selectedAccount.inLibrary;
    
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-8 max-w-7xl mx-auto z-10 relative">
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
              
              {!inLibrary && (
                <>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Your Price</p>
                  <div className="mb-6">
                    <span className="text-white font-black text-4xl">{selectedAccount.owner_name ? `${selectedAccount.owner_name}` : 'Free'}</span>
                  </div>
                </>
              )}

              {inLibrary ? (
                <button 
                  disabled
                  className="w-full bg-gray-600 text-white font-black py-4 rounded-xl text-lg flex items-center justify-center gap-3 shadow-lg mb-3 cursor-not-allowed"
                >
                  ALREADY IN LIBRARY
                </button>
              ) : (
                <button 
                  onClick={async () => {
                    await handleLibraryToggle(selectedAccount.id, false, selectedAccount.hasAccess !== false);
                    setSelectedAccount((prev: any) => prev ? {...prev, inLibrary: true} : prev);
                  }}
                  className="w-full bg-valqore-accent hover:bg-valqore-accent/90 text-black font-black py-4 rounded-xl text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-valqore-accent/20 mb-3 active:scale-[0.98]"
                >
                  BUY NOW
                </button>
              )}

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
              <button onClick={() => {}} className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-3 rounded-xl transition-colors border border-white/10">
                <ThumbsUp size={18} /> {selectedAccount.working_votes || 0}
              </button>
              <button onClick={() => {}} className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-3 rounded-xl transition-colors border border-white/10">
                <ThumbsDown size={18} /> {selectedAccount.not_working_votes || 0}
              </button>
            </div>

            {selectedAccount.notes && (
              <>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rotate-45 bg-valqore-accent"></div>
                  Included Games
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 text-gray-300 leading-relaxed text-sm whitespace-pre-line">
                  {selectedAccount.notes}
                </div>
              </>
            )}

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
                <div className="mt-1 text-valqore-accent"><Users size={20} /></div>
                <div>
                  <h4 className="font-bold text-white text-sm">Global Access</h4>
                  <p className="text-xs text-gray-400 leading-relaxed mt-1">Play from anywhere in the world without region restrictions.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Related News */}
          <div className="w-full lg:w-[25%] flex flex-col gap-6">
            <h2 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
              <div className="w-2.5 h-2.5 rotate-45 bg-valqore-accent"></div>
              RELATED NEWS
            </h2>

            {/* Static News Item 1 */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-colors group cursor-pointer">
              <div className="h-24 bg-gradient-to-tr from-purple-900 to-indigo-900 relative">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">FREE STEAM ACCOUNTS</span>
                  <span className="text-[10px] text-gray-500">1 days ago</span>
                </div>
                <h4 className="font-bold text-white text-sm leading-snug group-hover:text-valqore-accent transition-colors">Stellar Frontiers - Full Premium Account Access Available</h4>
              </div>
            </div>

            {/* Static News Item 2 */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-colors group cursor-pointer">
              <div className="h-24 bg-gradient-to-tr from-green-900 to-emerald-900 relative">
                <div className="absolute top-2 right-2 bg-valqore-accent text-black text-[10px] font-bold px-2 py-0.5 rounded z-10">TRENDING</div>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">FREE STEAM ACCOUNTS</span>
                  <span className="text-[10px] text-gray-500">2 months ago</span>
                </div>
                <h4 className="font-bold text-white text-sm leading-snug group-hover:text-valqore-accent transition-colors">Abyssal Horrors - Full Premium Account Access Available</h4>
              </div>
            </div>
            
            {/* Static News Item 3 */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-colors group cursor-pointer">
              <div className="h-24 bg-gradient-to-tr from-blue-900 to-cyan-900 relative">
                <div className="absolute top-2 right-2 bg-valqore-accent text-black text-[10px] font-bold px-2 py-0.5 rounded z-10">TRENDING</div>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">FREE STEAM ACCOUNTS</span>
                  <span className="text-[10px] text-gray-500">3 months ago</span>
                </div>
                <h4 className="font-bold text-white text-sm leading-snug group-hover:text-valqore-accent transition-colors">Velocity X - Full Premium Account Access Available</h4>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 relative z-10">
      {isLoading ? (
        <div className="w-full mb-16">
          <h2 className="text-xl font-bold mb-4 text-white uppercase tracking-wider flex items-center gap-2">
            <MonitorPlay className="w-6 h-6 text-cyan-400" />
            Upcoming Games
          </h2>
          <div className="w-full h-64 bg-white/5 animate-pulse rounded-xl border border-white/10"></div>
        </div>
      ) : banners.length > 0 && (
        <div className="w-full mb-16 relative group">
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

      {bundleAccounts.length > 0 && (
      <div className="w-full mb-16">
        <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
          <Package className="w-6 h-6 text-valqore-accent" />
          Game Bundles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {bundleAccounts.map((acc, index) => {
              const images = (acc.description || '').split(',').map(url => url.trim()).filter(url => url)
              const gradients = ['from-valqore-accent/20', 'from-purple-500/20', 'from-blue-500/20', 'from-emerald-500/20']
              const gradient = gradients[index % gradients.length]
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={acc.id} 
                  onClick={() => setSelectedAccount(acc)}
                  className="bg-black/30 border border-white/10 rounded-2xl overflow-hidden hover:border-valqore-accent/30 transition-all group cursor-pointer"
                >
                  <div className={`h-48 bg-gradient-to-r ${gradient} to-transparent relative p-6 flex flex-col justify-end overflow-hidden`}>
                    {/* Background Images */}
                    <div className="absolute inset-0 flex">
                      {images.slice(0, 3).map((img, i) => (
                        <div key={i} className="flex-1 h-full relative" style={{ zIndex: 0, opacity: 0.3 }}>
                          <img src={img} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="absolute top-4 right-4 bg-valqore-accent text-black text-xs font-bold px-2 py-1 rounded z-10">BUNDLE</div>
                    <h3 className="text-xl font-bold text-white z-10 group-hover:text-valqore-accent transition-colors">{acc.alias_name}</h3>
                    <p className="text-sm text-gray-300 z-10 truncate">{acc.notes}</p>
                  </div>
                  <div className="p-4 flex justify-between items-center bg-black/50">
                    <span className="text-valqore-accent font-bold text-lg">{formatPrice(acc.owner_name)}</span>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
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
      ) : regularAccounts.length === 0 && bundleAccounts.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-gray-400">
          No games match your search.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    <AnimatePresence mode="popLayout">
          {regularAccounts.map((acc, index) => {
            // Generate some static placeholders based on index to match the premium design feel
            const discounts = ["-20%", "-15%", "-50%", "-10%", "-25%"];
            const badges = [
              { text: "AAA", color: "bg-valqore-accent text-black" },
              { text: "HORROR", color: "bg-orange-500 text-white" },
              { text: "REMASTERED", color: "bg-cyan-400 text-black" },
              { text: "RACING", color: "bg-yellow-500 text-black" },
              { text: "STRATEGY", color: "bg-orange-400 text-black" }
            ];
            const subtitles = ["RPG, Neon Studios", "Open World, Cosmic", "Horror, Dark Matter Inc", "Sports, Redline", "Action RPG, Ghost Games"];
            const prices = ["$47.99", "$69.99", "$33.99", "$14.99", "$37.49", "$44.99", "$39.99", "$59.99"];

            const discount = discounts[index % discounts.length];
            const badge = badges[index % badges.length];
            const subtitle = subtitles[index % subtitles.length];
            const price = prices[index % prices.length];

            return (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              key={acc.id} 
              onClick={() => setSelectedAccount(acc)}
              className="flex flex-col group cursor-pointer"
            >
              {/* Game Cover Image Container (Square-ish) */}
              <div className="relative aspect-[4/5] bg-black/40 rounded-xl overflow-hidden shadow-xl border border-white/10 group-hover:border-white/30 transition-all group-hover:shadow-2xl group-hover:shadow-black/50 mb-3">
                
                {acc.description ? (
                  <img src={(acc.description || '').split(',')[0].trim()} alt={acc.alias_name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-gray-900 to-gray-800 flex items-center justify-center">
                    <Gamepad2 size={48} className="text-white/20" />
                  </div>
                )}
                
                {/* Top Right Discount Badge */}
                <div className="absolute top-0 right-0 bg-red-500 text-white font-bold px-3 py-1 rounded-bl-xl text-xs z-10 shadow-lg shadow-red-500/20">
                  {discount}
                </div>

                {/* Bottom Left Category Badge */}
                <div className={"absolute bottom-3 left-3 text-[10px] font-black px-2 py-0.5 rounded shadow-lg uppercase tracking-wider z-10 " + badge.color}>
                  {badge.text}
                </div>

                {/* Bottom Right Wishlist Icon */}
                <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-gray-300 hover:text-white hover:bg-black/80 transition-colors border border-white/10 z-10 shadow-lg group-hover:border-white/20">
                  <span className="text-sm font-bold opacity-80 group-hover:opacity-100">♡</span>
                </div>
                
                {/* Optional Subtle Gradient Overlay for contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>
              </div>

              {/* Lower Text Details */}
              <div className="flex flex-col w-full">
                <h3 className="font-bold text-white text-[15px] leading-tight truncate w-full mb-1 group-hover:text-gray-200">{acc.alias_name}</h3>
                <div className="flex justify-between items-end">
                  <p className="text-xs text-gray-500 truncate mr-2">{subtitle}</p>
                  <span className="text-valqore-accent font-black text-sm whitespace-nowrap">{formatPrice(acc.owner_name)}</span>
                </div>
              </div>

            </motion.div>
          )})}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}


export default Dashboard;


