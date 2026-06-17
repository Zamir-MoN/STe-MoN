import React, { useState, useEffect } from 'react'
import { Search, Users, Activity, Settings, Download, Upload, Plus, X, Check, Shield, Gamepad2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api'
import SkeletonRow from '../components/SkeletonRow'

const AdminPanel = ({ role: currentUserRole, searchQuery }: { role: string, searchQuery: string }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [formRole, setFormRole] = useState('user')
  const [userMsg, setUserMsg] = useState('')
  
  const [accounts, setAccounts] = useState<any[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  
  const [alias, setAlias] = useState('')
  const [steamUser, setSteamUser] = useState('')
  const [steamPass, setSteamPass] = useState('')
  const [steamDesc, setSteamDesc] = useState('') // Used as Image URL
  const [accMsg, setAccMsg] = useState('')
  
  const [error, setError] = useState('')
  const [showUserForm, setShowUserForm] = useState(false)
  const [showAccForm, setShowAccForm] = useState(false)
  const [appUsers, setAppUsers] = useState<any[]>([])
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts')
      setAccounts(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users')
      setAppUsers(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      await Promise.all([fetchAccounts(), fetchUsers()])
      setIsLoading(false)
    }
    init()
  }, [])

  const handleCreateOrUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setUserMsg('')
    setError('')
    try {
      if (editingUserId) {
        await api.put(`/auth/users/${editingUserId}`, { username, password, role: formRole })
        setUserMsg(`User updated successfully!`)
      } else {
        await api.post('/auth/create-user', { username, password, role: formRole })
        setUserMsg(`User ${username} created successfully!`)
      }
      setUsername('')
      setPassword('')
      setFormRole('user')
      setEditingUserId(null)
      setShowUserForm(false)
      fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save user')
    }
  }

  const handleEditUserClick = (user: any) => {
    setEditingUserId(user.id)
    setUsername(user.username)
    setPassword('') // Not fetched
    setFormRole(user.role)
    setUserMsg('')
    setShowUserForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await api.delete(`/auth/users/${id}`)
      fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete user')
    }
  }

  const handleCreateOrUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setAccMsg('')
    setError('')
    try {
      if (editingId) {
        await api.put(`/accounts/${editingId}`, {
          alias_name: alias, 
          steam_username: steamUser, 
          steam_password: steamPass, 
          description: steamDesc 
        })
        setAccMsg(`Steam Account '${alias}' updated!`)
        setEditingId(null)
      } else {
        await api.post('/accounts', { 
          alias_name: alias, 
          steam_username: steamUser, 
          steam_password: steamPass, 
          description: steamDesc 
        })
        setAccMsg(`Steam Account '${alias}' added globally!`)
      }
      setAlias('')
      setSteamUser('')
      setSteamPass('')
      setSteamDesc('')
      fetchAccounts()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save steam account')
    }
  }

  const handleDeleteAccount = async (id: number) => {
    if (!confirm('Are you sure you want to delete this account?')) return
    try {
      await api.delete(`/accounts/${id}`)
      fetchAccounts()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete account')
    }
  }

  const handleEditClick = (acc: any) => {
    setEditingId(acc.id)
    setAlias(acc.alias_name)
    setSteamUser(acc.steam_username)
    setSteamPass(acc.steam_password || '')
    setSteamDesc(acc.description || '')
    setAccMsg('')
    setShowAccForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleExportAccounts = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(accounts, null, 2))
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", "steamhub_accounts.json")
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  const handleImportAccounts = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const json = JSON.parse(event.target?.result as string)
          if (!Array.isArray(json)) {
            setError("Invalid JSON format. Expected an array of accounts.")
            return
          }
          setIsLoading(true)
          for (const acc of json) {
            await api.post('/accounts', {
              alias_name: acc.alias_name,
              steam_username: acc.steam_username,
              steam_password: acc.steam_password,
              description: acc.description || '',
              notes: acc.notes || '',
              owner_name: acc.owner_name || ''
            })
          }
          await fetchAccounts()
          setAccMsg("Accounts imported successfully!")
        } catch (err) {
          setError("Failed to parse JSON or import accounts.")
        } finally {
          setIsLoading(false)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const filteredAccounts = accounts.filter(acc => acc.alias_name?.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-yellow-500 flex items-center gap-2">
        <Shield /> Admin Panel
      </h1>
      
      {error && <div className="mb-6 bg-red-500/20 border border-red-500/50 p-3 rounded-xl text-red-400 text-sm">{error}</div>}

      <div className="flex flex-col gap-4">
        {/* Create App User */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden transition-all">
          <button 
            onClick={() => setShowUserForm(!showUserForm)}
            className="w-full p-6 flex items-center justify-between text-lg font-bold hover:bg-white/5 transition-colors focus:outline-none"
          >
            <span className="flex items-center gap-2"><Users size={18}/> {editingUserId ? 'Edit' : 'Create'} App User</span>
            <span className={`transform transition-transform duration-300 ${showUserForm ? 'rotate-180' : ''}`}>▼</span>
          </button>
          
          <div className={`transition-all duration-300 ease-in-out ${showUserForm ? 'opacity-100 max-h-[1000px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
            <div className="p-6 border-t border-white/10">
              {userMsg && <p className="text-green-400 text-sm mb-4">{userMsg}</p>}
              
              <form onSubmit={handleCreateOrUpdateUser} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Username</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-yellow-500/50" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">{editingUserId ? 'New Password (leave blank to keep current)' : 'Password'}</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required={!editingUserId} className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-yellow-500/50" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Role</label>
                  <select 
                    value={formRole} 
                    onChange={e => setFormRole(e.target.value)} 
                    disabled={editingUserId ? appUsers.find(u => u.id === editingUserId)?.isDefaultAdmin : false}
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-yellow-500/50 disabled:opacity-50"
                  >
                    <option value="user">User</option>
                    {currentUserRole === 'owner' && <option value="admin">Admin</option>}
                  </select>
                </div>
                <div className="flex gap-2 mt-2">
                  <button type="submit" className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-500 font-bold py-2 rounded-lg transition-colors">
                    {editingUserId ? 'Save Changes' : 'Create User'}
                  </button>
                  {editingUserId && (
                    <button type="button" onClick={() => { setEditingUserId(null); setUsername(''); setPassword(''); setFormRole('user'); setShowUserForm(false) }} className="px-4 bg-gray-500/20 hover:bg-gray-500/40 border border-gray-500/50 text-gray-300 font-bold py-2 rounded-lg transition-colors">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Create / Edit Steam Account */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden transition-all">
          <button 
            onClick={() => setShowAccForm(!showAccForm)}
            className="w-full p-6 flex items-center justify-between text-lg font-bold hover:bg-white/5 transition-colors focus:outline-none"
          >
            <span className="flex items-center gap-2"><Gamepad2 size={18}/> {editingId ? 'Edit' : 'Add'} Steam Account</span>
            <span className={`transform transition-transform duration-300 ${showAccForm ? 'rotate-180' : ''}`}>▼</span>
          </button>
          
          <div className={`transition-all duration-300 ease-in-out ${showAccForm ? 'opacity-100 max-h-[1000px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
            <div className="p-6 border-t border-white/10">
              {accMsg && <p className="text-green-400 text-sm mb-4">{accMsg}</p>}
              
              <form onSubmit={handleCreateOrUpdateAccount} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Alias (Display Name)</label>
                  <input type="text" value={alias} onChange={e => setAlias(e.target.value)} required placeholder="e.g. CS:GO Smurf" className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-steam-blue/50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Steam Username</label>
                    <input type="text" value={steamUser} onChange={e => setSteamUser(e.target.value)} required className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-steam-blue/50" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Steam Password</label>
                    <input type="password" value={steamPass} onChange={e => setSteamPass(e.target.value)} required className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-steam-blue/50" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Game Cover Image Link (URL)</label>
                  <input type="text" value={steamDesc} onChange={e => setSteamDesc(e.target.value)} placeholder="https://example.com/cover.jpg" className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-steam-blue/50" />
                </div>
                <div className="flex gap-2 mt-2">
                  <button type="submit" className="flex-1 bg-steam-blue/20 hover:bg-steam-blue/40 border border-steam-blue/50 text-steam-blue font-bold py-2 rounded-lg transition-colors">
                    {editingId ? 'Save Changes' : 'Add Global Account'}
                  </button>
                  {editingId && (
                    <button type="button" onClick={() => { setEditingId(null); setAlias(''); setSteamUser(''); setSteamPass(''); setSteamDesc(''); setShowAccForm(false) }} className="px-4 bg-gray-500/20 hover:bg-gray-500/40 border border-gray-500/50 text-gray-300 font-bold py-2 rounded-lg transition-colors">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Manage Existing Users */}
      <div className="mt-8 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Users size={18}/> Manage App Users</h2>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div>
              {[1, 2, 3].map(i => <SkeletonRow key={i} />)}
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs text-gray-300 uppercase bg-black/30">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">ID</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appUsers.map(u => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-white">{u.id}</td>
                    <td className="px-4 py-3">{u.username}</td>
                    <td className="px-4 py-3 capitalize">{u.role}</td>
                    <td className="px-4 py-3 text-right">
                      {((currentUserRole === 'owner' && u.role !== 'owner') || (currentUserRole === 'admin' && u.role === 'user')) && (
                        <button onClick={() => handleEditUserClick(u)} className="text-yellow-500 hover:text-yellow-400 mr-3">Edit</button>
                      )}
                      {!u.isDefaultAdmin && !u.isSelf && ((currentUserRole === 'owner') || (currentUserRole === 'admin' && u.role === 'user')) && (
                        <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-400">Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
                {appUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Manage Existing Accounts */}
      <div className="mt-8 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><Gamepad2 size={18}/> Manage Accounts</h2>
          <div className="flex gap-2">
            <button 
              onClick={handleImportAccounts}
              className="bg-steam-blue/20 hover:bg-steam-blue/40 text-steam-blue border border-steam-blue/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Upload size={14} /> Import JSON
            </button>
            <button 
              onClick={handleExportAccounts}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Download size={14} /> Export JSON
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div>
              {[1, 2, 3].map(i => <SkeletonRow key={i} />)}
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs text-gray-300 uppercase bg-black/30">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Alias</th>
                  <th className="px-4 py-3">Steam Username</th>
                  <th className="px-4 py-3">Image Link</th>
                  <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                {filteredAccounts.map(acc => (
                  <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key={acc.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-white">{acc.alias_name}</td>
                    <td className="px-4 py-3">{acc.steam_username}</td>
                    <td className="px-4 py-3 truncate max-w-xs">{acc.description || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleEditClick(acc)} className="text-steam-blue hover:text-blue-400 mr-3">Edit</button>
                      <button onClick={() => handleDeleteAccount(acc.id)} className="text-red-500 hover:text-red-400">Delete</button>
                    </td>
                  </motion.tr>
                ))}
                </AnimatePresence>
                {filteredAccounts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center">No accounts found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default AdminPanel;


