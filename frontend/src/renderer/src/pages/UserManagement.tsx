import React, { useState, useEffect } from 'react'
import { Users, Plus, Shield, Clock, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../api'
import SkeletonRow from '../components/SkeletonRow'

const UserManagement = ({ role: currentUserRole }: { role: string }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [formRole, setFormRole] = useState('user')
  const [accessPlan, setAccessPlan] = useState('FULL')
  const [userMsg, setUserMsg] = useState('')
  
  const [error, setError] = useState('')
  const [showUserForm, setShowUserForm] = useState(false)
  const [appUsers, setAppUsers] = useState<any[]>([])
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Selective Access States
  const [allAccounts, setAllAccounts] = useState<any[]>([])
  const [selectiveAccesses, setSelectiveAccesses] = useState<any[]>([])
  const [selectedGameToGrant, setSelectedGameToGrant] = useState<string>('')
  const [durationDays, setDurationDays] = useState<string>('0') // 0 = permanent

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const res = await api.get('/auth/users')
      setAppUsers(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts')
      setAllAccounts(res.data)
    } catch (err) {
      console.error("Failed to fetch accounts", err)
    }
  }

  const fetchSelectiveAccesses = async (userId: number) => {
    try {
      const res = await api.get(`/auth/users/${userId}/selective-access`)
      setSelectiveAccesses(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchAccounts()
  }, [])

  const handleCreateOrUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setUserMsg('')
    setError('')
    try {
      if (editingUserId) {
        await api.put(`/auth/users/${editingUserId}`, { username, password, role: formRole, access_plan: accessPlan })
        setUserMsg(`User updated successfully!`)
      } else {
        await api.post('/auth/create-user', { username, password, role: formRole, access_plan: accessPlan })
        setUserMsg(`User ${username} created successfully!`)
      }
      setUsername('')
      setPassword('')
      setFormRole('user')
      setAccessPlan('FULL')
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
    setAccessPlan(user.access_plan || 'FULL')
    setUserMsg('')
    setShowUserForm(true)
    fetchSelectiveAccesses(user.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await api.delete(`/auth/users/${id}`)
      fetchUsers()
      if (editingUserId === id) {
        setEditingUserId(null); 
        setUsername(''); 
        setPassword(''); 
        setFormRole('user'); 
        setAccessPlan('FULL'); 
        setShowUserForm(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete user')
    }
  }

  const handleResetHwid = async (id: number) => {
    if (!confirm('Reset device binding for this user? They will be bound to the next PC they log into.')) return
    try {
      await api.put(`/auth/users/${id}/reset-hwid`)
      setUserMsg('Device binding reset successfully')
      setTimeout(() => setUserMsg(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset device binding')
    }
  }

  const handleGrantAccess = async () => {
    if (!editingUserId || !selectedGameToGrant) return;
    try {
      let expires_at = null;
      if (durationDays !== '0' && durationDays !== '') {
        const days = parseInt(durationDays);
        if (days > 0) {
          const date = new Date();
          date.setDate(date.getDate() + days);
          expires_at = date.toISOString();
        }
      }

      await api.post(`/auth/users/${editingUserId}/selective-access`, {
        account_id: parseInt(selectedGameToGrant),
        expires_at
      });
      fetchSelectiveAccesses(editingUserId);
      setSelectedGameToGrant('');
      setDurationDays('0');
      setUserMsg('Access granted successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to grant access');
    }
  }

  const handleRevokeAccess = async (accountId: number) => {
    if (!editingUserId) return;
    try {
      await api.delete(`/auth/users/${editingUserId}/selective-access/${accountId}`);
      fetchSelectiveAccesses(editingUserId);
      setUserMsg('Access revoked successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to revoke access');
    }
  }

  const calculateDaysLeft = (expires_at: string | null) => {
    if (!expires_at) return 'Permanent';
    const msLeft = new Date(expires_at).getTime() - Date.now();
    if (msLeft <= 0) return 'Expired';
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
    return `${daysLeft} day(s) left`;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-purple-400 flex items-center gap-2">
        <Users /> Manage Users
      </h1>
      
      {error && <div className="mb-6 bg-red-500/20 border border-red-500/50 p-3 rounded-xl text-red-400 text-sm">{error}</div>}

      <div className="flex flex-col gap-12">
        {/* Create App User */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden transition-all">
          <button 
            onClick={() => setShowUserForm(!showUserForm)}
            className="w-full p-6 flex items-center justify-between text-lg font-bold hover:bg-white/5 transition-colors focus:outline-none"
          >
            <span className="flex items-center gap-2"><Plus size={18}/> {editingUserId ? 'Edit' : 'Create'} App User</span>
            <span className={`transform transition-transform duration-300 ${showUserForm ? 'rotate-180' : ''}`}>▼</span>
          </button>
          
          <div className={`transition-all duration-300 ease-in-out ${showUserForm ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
            <div className="p-6 border-t border-white/10">
              {userMsg && <p className="text-green-400 text-sm mb-4">{userMsg}</p>}
              
              <form onSubmit={handleCreateOrUpdateUser} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Username</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-purple-500/50" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">{editingUserId ? 'New Password (blank to keep)' : 'Password'}</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required={!editingUserId} className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-purple-500/50" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Role</label>
                    <select 
                      value={formRole} 
                      onChange={e => setFormRole(e.target.value)} 
                      disabled={editingUserId ? appUsers.find(u => u.id === editingUserId)?.isDefaultAdmin : false}
                      className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
                    >
                      <option value="user" className="bg-gray-900 text-white">User</option>
                      {currentUserRole === 'owner' && <option value="admin" className="bg-gray-900 text-white">Admin</option>}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Access Plan</label>
                    <select 
                      value={accessPlan} 
                      onChange={e => setAccessPlan(e.target.value)} 
                      className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="FULL" className="bg-gray-900 text-white">Permanent (All Games)</option>
                      <option value="SELECTIVE" className="bg-gray-900 text-white">Selected Game (Manage manually)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button type="submit" className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-400 font-bold py-2 rounded-lg transition-colors">
                    {editingUserId ? 'Save User Settings' : 'Create User'}
                  </button>
                  {editingUserId && (
                    <button type="button" onClick={() => { setEditingUserId(null); setUsername(''); setPassword(''); setFormRole('user'); setAccessPlan('FULL'); setShowUserForm(false) }} className="px-4 bg-gray-500/20 hover:bg-gray-500/40 border border-gray-500/50 text-gray-300 font-bold py-2 rounded-lg transition-colors">
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Selective Access Management */}
              {editingUserId && accessPlan === 'SELECTIVE' && (
                <div className="mt-8 pt-6 border-t border-white/10">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Shield size={18} className="text-purple-400" />
                    Manage Selective Access
                  </h3>
                  
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 mb-6">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                      <div className="flex-1">
                        <label className="text-xs text-gray-400 mb-1 block">Select Game</label>
                        <select 
                          value={selectedGameToGrant} 
                          onChange={e => setSelectedGameToGrant(e.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-purple-500/50"
                        >
                          <option value="" className="bg-gray-900 text-white">-- Choose a Game --</option>
                          {allAccounts.map(acc => (
                            <option key={acc.id} value={acc.id} className="bg-gray-900 text-white">{acc.alias_name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-full md:w-32">
                        <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1">
                          <Clock size={12} /> Duration (Days)
                        </label>
                        <input 
                          type="number" 
                          min="0"
                          value={durationDays} 
                          onChange={e => setDurationDays(e.target.value)} 
                          className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-purple-500/50" 
                          placeholder="0 = Permanent"
                        />
                      </div>
                      <button 
                        onClick={handleGrantAccess}
                        disabled={!selectedGameToGrant}
                        className="bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/50 text-purple-400 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Grant Access
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Set duration to 0 for permanent access, or type the number of days.</p>
                  </div>

                  {/* Granted Access List */}
                  <div className="bg-black/30 border border-white/5 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-400">
                      <thead className="bg-black/50 text-xs text-gray-300">
                        <tr>
                          <th className="px-4 py-3">Game</th>
                          <th className="px-4 py-3">Expiration</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectiveAccesses.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-4 py-4 text-center text-gray-500">No games granted yet.</td>
                          </tr>
                        ) : selectiveAccesses.map(access => (
                          <tr key={access.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-4 py-3 text-white font-medium">{access.account?.alias_name}</td>
                            <td className="px-4 py-3">
                              {calculateDaysLeft(access.expires_at)}
                              {access.expires_at && <span className="block text-xs text-gray-500">{new Date(access.expires_at).toLocaleDateString()}</span>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => handleRevokeAccess(access.account_id)} className="text-red-400 hover:text-red-300 p-1 bg-red-500/10 rounded">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>

        {/* Manage Existing Users */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl">
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
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appUsers.map(u => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 font-medium text-white">{u.id}</td>
                      <td className="px-4 py-3">{u.username}</td>
                      <td className="px-4 py-3 capitalize">{u.role}</td>
                      <td className="px-4 py-3">
                        {((currentUserRole === 'owner' && u.role !== 'owner') || (currentUserRole === 'admin' && u.role === 'user')) ? (
                          <button 
                            onClick={async () => {
                              try {
                                if (u.access_plan === 'SELECTIVE') {
                                  // Just open editor to manage games
                                  handleEditUserClick(u);
                                } else {
                                  // Change to SELECTIVE and open editor
                                  await api.put(`/auth/users/${u.id}`, { access_plan: 'SELECTIVE' });
                                  fetchUsers();
                                  handleEditUserClick({ ...u, access_plan: 'SELECTIVE' });
                                }
                              } catch (err: any) {
                                setError(err.response?.data?.error || 'Failed to update plan');
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-bold transition-all hover:opacity-80 active:scale-95 cursor-pointer ${u.access_plan === 'SELECTIVE' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}
                            title={u.access_plan === 'SELECTIVE' ? "Manage Selective Access" : "Click to change to Selective Access"}
                          >
                            {u.access_plan || 'FULL'}
                          </button>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs font-bold ${u.access_plan === 'SELECTIVE' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                            {u.access_plan || 'FULL'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {((currentUserRole === 'owner' && u.role !== 'owner') || (currentUserRole === 'admin' && u.role === 'user')) && (
                          <button onClick={() => handleResetHwid(u.id)} className="text-blue-400 hover:text-blue-300 mr-3 text-xs" title="Reset Device Bind">Reset Device</button>
                        )}
                        {((currentUserRole === 'owner' && u.role !== 'owner') || (currentUserRole === 'admin' && u.role === 'user')) && (
                          <button onClick={() => handleEditUserClick(u)} className="text-purple-400 hover:text-purple-300 mr-3 text-xs">Edit</button>
                        )}
                        {!u.isDefaultAdmin && !u.isSelf && ((currentUserRole === 'owner') || (currentUserRole === 'admin' && u.role === 'user')) && (
                          <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-400 text-xs">Delete</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {appUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default UserManagement
