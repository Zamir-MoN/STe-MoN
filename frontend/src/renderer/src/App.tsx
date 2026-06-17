import React, { useState, useEffect, Suspense, lazy, useMemo } from 'react'
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Gamepad2, X } from 'lucide-react'

import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Login from './components/Login'
import SplashScreen from './components/SplashScreen'
import PageTransition from './components/PageTransition'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const AccountsPage = lazy(() => import('./pages/AccountsPage'))
const UserManagement = lazy(() => import('./pages/UserManagement'))
const GameManagement = lazy(() => import('./pages/GameManagement'))
const BroadcastPanel = lazy(() => import('./pages/BroadcastPanel'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true }
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("App Error:", error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return <div className="p-10 text-red-500 font-bold bg-black min-h-screen">Something went wrong.</div>
    }
    return this.props.children
  }
}

const AnimatedRoutes = ({ role, showNotification, searchQuery }: { role: string, showNotification: any, searchQuery: string }) => {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><div className="animate-pulse flex flex-col items-center"><div className="w-10 h-10 border-4 border-steam-blue border-t-transparent rounded-full animate-spin"></div><div className="mt-4 text-steam-blue font-semibold tracking-widest">LOADING MODULE...</div></div></div>}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Dashboard role={role} showNotification={showNotification} searchQuery={searchQuery} /></PageTransition>} />
          <Route path="/users" element={role === 'admin' || role === 'owner' ? <PageTransition><UserManagement role={role} /></PageTransition> : <Navigate to="/" replace />} />
          <Route path="/manage-games" element={role === 'admin' || role === 'owner' ? <PageTransition><GameManagement searchQuery={searchQuery} /></PageTransition> : <Navigate to="/" replace />} />
          <Route path="/broadcast" element={role === 'admin' || role === 'owner' ? <PageTransition><BroadcastPanel role={role} /></PageTransition> : <Navigate to="/" replace />} />
          <Route path="/accounts" element={<PageTransition><AccountsPage role={role} showNotification={showNotification} searchQuery={searchQuery} /></PageTransition>} />
          <Route path="/settings" element={<PageTransition><SettingsPage showNotification={showNotification} /></PageTransition>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  )
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [role, setRole] = useState('user')
  const [notification, setNotification] = useState<{message: React.ReactNode, type: 'success'|'error'|'info'} | null>(null)
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false)
  const [notificationHistory, setNotificationHistory] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSplash, setShowSplash] = useState(true)

  const unreadCount = notificationHistory.filter(n => !n.read).length

  const showNotification = (message: React.ReactNode, type: 'success'|'error'|'info' = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  useEffect(() => {
    const token = localStorage.getItem('steamhub_token')
    const savedRole = localStorage.getItem('steamhub_role')
    if (token) {
      setIsAuthenticated(true)
      if (savedRole) setRole(savedRole)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    const sse = new EventSource('http://localhost:3001/api/stream')
    sse.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'NEW_GAME') {
        const { alias_name, description } = data.payload
        const newNotif = {
          id: Date.now(),
          alias_name,
          description,
          time: new Date(),
          read: false
        }
        setNotificationHistory(prev => [newNotif, ...prev])

        showNotification(
          <div className="flex items-center gap-4 py-1">
            {description ? <img src={description} alt={alias_name} className="w-10 h-14 object-cover rounded-md shadow-md border border-white/20" /> : <Gamepad2 size={24} className="text-steam-blue" />}
            <div className="flex flex-col text-left">
              <span className="font-bold text-white text-sm">New Game Available</span>
              <span className="text-gray-300 text-xs mt-0.5">{alias_name}</span>
            </div>
          </div>,
          'info'
        )
        window.dispatchEvent(new Event('refresh_accounts'))
      } else if (data.type === 'NEW_BANNER') {
        window.dispatchEvent(new Event('refresh_banner'))
        showNotification("A new upcoming game broadcast is live!", 'info')
      }
    }
    return () => sse.close()
  }, [isAuthenticated])

  const handleLogout = () => {
    localStorage.removeItem('steamhub_token')
    localStorage.removeItem('steamhub_role')
    setIsAuthenticated(false)
    setRole('user')
  }

  return (
    <ErrorBoundary>
      <Router>
        <AnimatePresence>
          {showSplash && <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />}
        </AnimatePresence>
        
        {!showSplash && (
        <div className="h-screen w-screen flex flex-col relative overflow-hidden bg-[#0a0a0a]">
          <div className="bg-animated"></div>
        <TitleBar />
        
        {/* Toast Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div 
              initial={{ opacity: 0, y: -50 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -50 }}
              className={`absolute top-12 right-8 z-50 px-6 py-3 rounded-xl shadow-2xl backdrop-blur-md border font-bold flex items-center gap-3 ${
                notification.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-400' :
                notification.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-400' :
                'bg-steam-blue/20 border-steam-blue/50 text-steam-blue'
              }`}
            >
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notifications Panel */}
        <AnimatePresence>
          {showNotificationsPanel && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40"
                onClick={() => setShowNotificationsPanel(false)}
              />
              <motion.div 
                initial={{ x: '100%' }} 
                animate={{ x: 0 }} 
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute top-0 right-0 h-full w-80 bg-black/30 backdrop-blur-2xl border-l border-white/10 z-50 flex flex-col shadow-2xl"
              >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2"><Bell size={18} /> Notifications</h2>
                <button onClick={() => setShowNotificationsPanel(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {notificationHistory.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center mt-10">No notifications yet</p>
                ) : (
                  notificationHistory.map(notif => (
                    <div key={notif.id} className={`p-4 rounded-xl border ${notif.read ? 'bg-white/5 border-white/5' : 'bg-steam-blue/10 border-steam-blue/30 cursor-pointer hover:bg-steam-blue/20'} flex items-start gap-3 transition-colors`} onClick={() => {
                      if (!notif.read) {
                        setNotificationHistory(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
                      }
                    }}>
                      {notif.description ? <img src={notif.description} alt={notif.alias_name} className="w-10 h-14 object-cover rounded-md shadow-md border border-white/20" /> : <Gamepad2 size={24} className="text-steam-blue mt-1" />}
                      <div className="flex flex-col text-left flex-1">
                        <span className="font-bold text-white text-sm">New Game Added</span>
                        <span className="text-gray-300 text-xs mt-0.5">{notif.alias_name}</span>
                        <span className="text-gray-500 text-[10px] mt-2">{new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {!notif.read && <div className="w-2 h-2 rounded-full bg-steam-blue mt-2"></div>}
                    </div>
                  ))
                )}
              </div>
              {notificationHistory.length > 0 && (
                <div className="p-4 border-t border-white/10">
                  <button 
                    onClick={() => setNotificationHistory(prev => prev.map(n => ({...n, read: true})))}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium rounded-lg transition-colors"
                  >
                  </button>
                </div>
              )}
            </motion.div>
            </>
          )}
        </AnimatePresence>

        {isAuthenticated ? (
          <div className="flex-1 flex overflow-hidden">
            <Sidebar onLogout={handleLogout} role={role} />
            <div className="flex-1 flex flex-col relative z-10">
              <TopBar unreadCount={unreadCount} onToggleNotifications={() => setShowNotificationsPanel(!showNotificationsPanel)} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
              <div className="flex-1 overflow-y-auto">
                <AnimatedRoutes role={role} showNotification={showNotification} searchQuery={searchQuery} />
              </div>
            </div>
          </div>
        ) : (
          <Login onLoginSuccess={(userRole) => {
            setRole(userRole)
            setIsAuthenticated(true)
          }} />
        )}
      </div>
      )}
      </Router>
    </ErrorBoundary>
  )
}

export default App

