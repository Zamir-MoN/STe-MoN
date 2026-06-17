import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Lock } from 'lucide-react'
import api from '../api'
import logo from '../assets/logo.png'

const Login = ({ onLoginSuccess }: { onLoginSuccess: (role: string) => void }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      let hwid = 'UNKNOWN-HWID'
      // @ts-ignore
      if (window.api && window.api.getHwid) {
        // @ts-ignore
        hwid = await window.api.getHwid()
      }
      const response = await api.post('/auth/login', { username, password, hwid })
      localStorage.setItem('steamhub_token', response.data.token)
      localStorage.setItem('steamhub_role', response.data.user.role)
      onLoginSuccess(response.data.user.role)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed')
    }
  }

  return (
    <div className="h-screen w-full flex items-center justify-center relative z-10">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <motion.img 
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            src={logo} alt="STe MoN Logo" className="w-20 h-20 mx-auto mb-4 rounded-2xl object-cover shadow-2xl shadow-purple-500/20" 
          />
          <h1 className="text-2xl font-bold text-white">Welcome to STe MoN</h1>
          <p className="text-gray-400 text-sm mt-2">Sign in to manage your accounts</p>
        </div>
        
        {error && (
          <div className="mb-4 bg-red-500/20 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg text-center">
            {error}
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-medium text-gray-400 ml-1 mb-1 block">Username</label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all" 
                placeholder="Enter your username" 
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 ml-1 mb-1 block">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all" 
                placeholder="Enter your password" 
                required
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-purple-600/30 to-red-500/30 hover:from-purple-500/40 hover:to-red-400/40 backdrop-blur-md border border-purple-500/30 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-500/20 mt-4 active:scale-[0.98]">
            Sign In
          </button>
        </form>
      </motion.div>
    </div>
  )
}

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{ color: 'red', padding: '20px', background: 'black', height: '100vh', zIndex: 9999 }}>
        <h1>Something went wrong.</h1>
        <pre>{this.state.error?.toString()}</pre>
        <pre>{this.state.error?.stack}</pre>
      </div>;
    }
    return this.props.children;
  }
}


export default Login;


