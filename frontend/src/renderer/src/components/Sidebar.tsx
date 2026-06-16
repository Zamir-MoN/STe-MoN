import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Shield, MonitorPlay, Settings, LogOut, Play } from 'lucide-react'
import api from '../api'

const Sidebar = ({ onLogout, role }: { onLogout: () => void, role: string }) => {
  const [profileName, setProfileName] = useState('')
  const [profilePic, setProfilePic] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/profile')
        if (res.data) {
          setProfileName(res.data.profile_name)
          setProfilePic(res.data.profile_pic)
        }
      } catch (err) {}
    }
    fetchProfile()

    const handleProfileUpdate = () => fetchProfile()
    window.addEventListener('profile_updated', handleProfileUpdate)
    return () => window.removeEventListener('profile_updated', handleProfileUpdate)
  }, [])

  const displayName = profileName || `${role} User`
  const initial = displayName.charAt(0).toUpperCase()

  return (
  <div className="w-64 bg-black/20 backdrop-blur-lg border-r border-white/5 p-4 flex flex-col gap-2 relative z-10">
    <div className="flex items-center gap-3 mb-8 px-2 mt-4">
      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-steam-blue to-purple-500 shadow-lg shadow-steam-blue/20 flex items-center justify-center text-sm font-bold text-white overflow-hidden border border-white/10 shrink-0">
        {profilePic ? <img src={profilePic} alt="Profile" className="w-full h-full object-cover" /> : initial}
      </div>
      <div className="flex-1 overflow-hidden">
        <h2 className="text-sm font-bold capitalize truncate" title={displayName}>{displayName}</h2>
        <button onClick={onLogout} className="text-xs text-red-400 hover:text-red-300">Logout</button>
      </div>
    </div>
    <nav className="flex flex-col gap-1 flex-1">
      <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-all text-sm font-medium">
        <LayoutDashboard size={18} className="text-steam-blue" /> Game Store
      </Link>
      <Link to="/accounts" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-all text-sm font-medium">
        <Users size={18} className="text-purple-400" /> Library
      </Link>
      
      {role === 'admin' && (
        <>
          <Link to="/broadcast" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-all text-sm font-medium text-cyan-400 mt-4 border border-cyan-500/20 bg-cyan-500/5">
            <Play size={18} /> Broadcasts
          </Link>
          <Link to="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-all text-sm font-medium text-yellow-400 mt-2 border border-yellow-500/20 bg-yellow-500/5">
            <Shield size={18} /> Admin Panel
          </Link>
        </>
      )}

      <Link to="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-all text-sm font-medium">
        <Settings size={18} className="text-gray-400" /> Settings
      </Link>
      <div className="text-[10px] text-gray-500/50 uppercase tracking-widest text-center mt-auto mb-1 select-none cursor-default">
        Develop by Zamir
      </div>
    </nav>
  </div>
  )
}


export default Sidebar;

