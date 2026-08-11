import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Lock, Gamepad2 } from 'lucide-react'
import api from '../api'

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
      setError(err.response?.data?.error || err.message || 'Authentication failed')
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
          <div className="w-20 h-20 mx-auto mb-4 bg-valqore-accent/10 rounded-2xl flex items-center justify-center border border-valqore-accent/20">
            <Gamepad2 className="w-10 h-10 text-valqore-accent" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome to Valqore.Pro</h1>
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
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-valqore-accent/50 focus:ring-1 focus:ring-valqore-accent/50 transition-all" 
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
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-valqore-accent/50 focus:ring-1 focus:ring-valqore-accent/50 transition-all" 
                placeholder="Enter your password" 
                required
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-valqore-accent/20 hover:bg-valqore-accent/30 backdrop-blur-md border border-valqore-accent/30 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-valqore-accent/20 mt-4 active:scale-[0.98]">
            Sign In
          </button>
        </form>
      </motion.div>
    </div>
  )
}

export default Login;


