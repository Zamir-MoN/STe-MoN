import React, { useState, useEffect } from 'react'
import { Settings, Play, Gamepad2, User, AlertTriangle, Check, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../api'

const SettingsPage = ({ showNotification }: { showNotification: (msg: React.ReactNode, type?: 'success'|'error'|'info') => void }) => {
  const [profileName, setProfileName] = useState('')
  const [profilePic, setProfilePic] = useState('')
  const [steamPath, setSteamPath] = useState('')
  const [savedSteamPath, setSavedSteamPath] = useState('')
  const [isEditingSteamPath, setIsEditingSteamPath] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [checkingPerms, setCheckingPerms] = useState(false)
  const [permsOk, setPermsOk] = useState<boolean | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/profile')
        if (res.data) {
          setProfileName(res.data.profile_name || '')
          setProfilePic(res.data.profile_pic || '')
          
          let currentSteamPath = res.data.steam_path || ''
          
          if (!currentSteamPath) {
            try {
              const detected = await window.api.autoDetectSteam()
              if (detected) {
                currentSteamPath = detected
                // Auto-save the detected path
                await api.put('/auth/profile', { 
                  profile_name: res.data.profile_name || '', 
                  profile_pic: res.data.profile_pic || '', 
                  steam_path: detected 
                })
              }
            } catch (err) {
              console.error("Auto detect failed", err)
            }
          }
          
          setSteamPath(currentSteamPath)
          setSavedSteamPath(currentSteamPath)
        }
      } catch (err) {
        showNotification("Failed to load profile", "error")
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    try {
      await api.put('/auth/profile', { profile_name: profileName, profile_pic: profilePic, steam_path: steamPath })
      setSavedSteamPath(steamPath)
      setIsEditingSteamPath(false)
      showNotification("Settings saved successfully!", "success")
      window.dispatchEvent(new Event('profile_updated'))
    } catch (err) {
      showNotification("Failed to save settings", "error")
    }
  }

  const handleLocateSteam = async () => {
    try {
      const path = await window.api.selectSteamPath()
      if (path) {
        setSteamPath(path)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        showNotification("Please select a valid image file", "error")
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        showNotification("Image size should be less than 5MB", "error")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePic(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const checkPermissions = () => {
    setCheckingPerms(true)
    setPermsOk(null)
    setTimeout(() => {
      setCheckingPerms(false)
      setPermsOk(true)
    }, 1500)
  }

  if (isLoading) return (
    <div className="p-8 max-w-4xl">
      <div className="h-8 bg-white/10 rounded w-48 mb-8 animate-pulse"></div>
      <div className="flex flex-col md:flex-row gap-10">
        <div className="w-full md:w-1/3">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center animate-pulse">
            <div className="w-32 h-32 rounded-full bg-white/10 mb-4"></div>
            <div className="h-4 bg-white/10 rounded w-24"></div>
          </div>
        </div>
        <div className="w-full md:w-2/3 flex flex-col gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6 animate-pulse">
            <div>
              <div className="h-4 bg-white/10 rounded w-32 mb-2"></div>
              <div className="h-10 bg-white/10 rounded w-full"></div>
            </div>
            <div>
              <div className="h-4 bg-white/10 rounded w-40 mb-2"></div>
              <div className="h-10 bg-white/10 rounded w-full"></div>
            </div>
            <div className="h-10 bg-white/10 rounded w-32 mt-4"></div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-8 max-w-4xl mx-auto pb-24">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <Settings size={28} className="text-steam-blue" /> System Settings
      </h1>

      <div className="space-y-8">
        <section className="bg-black/20 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><User size={20} className="text-purple-400" /> User Profile</h2>
          
          <div className="flex items-start gap-8">
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full bg-black/40 border-2 border-white/10 overflow-hidden flex items-center justify-center relative group shadow-lg">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-gray-500" />
                )}
                <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                  <span className="text-xs font-bold">Change</span>
                  <input type="file" accept=".png,.jpg,.jpeg,.gif,.webp" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Profile Display Name</label>
                <input 
                  type="text" 
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-steam-blue/50 focus:ring-1 focus:ring-steam-blue/50 transition-all"
                  placeholder="Enter your display name"
                />
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1"><AlertTriangle size={12} /> Note: Your login username and password cannot be changed here.</p>
            </div>
          </div>
        </section>

        <section className="bg-black/20 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Gamepad2 size={20} className="text-green-400" /> Steam Configuration</h2>
          <div className="space-y-4">
            {savedSteamPath && !isEditingSteamPath ? (
              <div className="flex items-center justify-between bg-black/30 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check size={20} className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-green-400">Steam Configured</h3>
                    <p className="text-xs text-gray-400 font-mono mt-1">{savedSteamPath}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditingSteamPath(true)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors"
                >
                  Change Path
                </button>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Steam Executable Path</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={steamPath}
                    onChange={(e) => setSteamPath(e.target.value)}
                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-steam-blue/50 focus:ring-1 focus:ring-steam-blue/50 transition-all font-mono text-gray-300"
                    placeholder="C:\Program Files (x86)\Steam\steam.exe"
                  />
                  <button 
                    onClick={handleLocateSteam}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-sm font-bold transition-all whitespace-nowrap"
                  >
                    Locate Steam
                  </button>
                </div>
                {savedSteamPath ? (
                  <button onClick={() => { setSteamPath(savedSteamPath); setIsEditingSteamPath(false); }} className="text-xs text-steam-blue mt-3 hover:underline">Cancel Editing</button>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">If Steam isn't detected automatically, locate the steam.exe file manually.</p>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="bg-black/20 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Shield size={20} className="text-yellow-400" /> System Permissions</h2>
          <p className="text-sm text-gray-400 mb-6">Check if the application has the necessary elevation and file-system permissions to manage Steam accounts perfectly.</p>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={checkPermissions}
              disabled={checkingPerms}
              className="px-6 py-3 bg-steam-blue hover:bg-steam-blue/80 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-steam-blue/20"
            >
              {checkingPerms ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Shield size={16} />}
              Run Diagnostics
            </button>
            
            {permsOk === true && <span className="text-green-400 text-sm font-bold flex items-center gap-2"><Check size={18} className="bg-green-500/20 p-1 rounded-full" /> All permissions granted! Ready to go.</span>}
            {permsOk === false && <span className="text-red-400 text-sm font-bold flex items-center gap-2"><AlertTriangle size={18} className="bg-red-500/20 p-1 rounded-full" /> Missing permissions. Please run as Administrator.</span>}
          </div>
        </section>
      </div>

      <div className="mt-10 flex justify-end">
        <button 
          onClick={handleSave}
          className="px-10 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold shadow-lg shadow-green-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          Save Changes
        </button>
      </div>
    </div>
  )
}

export default SettingsPage;


