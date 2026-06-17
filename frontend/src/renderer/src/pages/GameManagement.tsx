import React, { useState, useEffect } from 'react'
import { Gamepad2, Upload, Download, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api'
import SkeletonRow from '../components/SkeletonRow'

const GameManagement = ({ searchQuery }: { searchQuery: string }) => {
  const [accounts, setAccounts] = useState<any[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  
  const [alias, setAlias] = useState('')
  const [steamUser, setSteamUser] = useState('')
  const [steamPass, setSteamPass] = useState('')
  const [steamDesc, setSteamDesc] = useState('') // Used as Image URL
  const [accMsg, setAccMsg] = useState('')
  
  const [error, setError] = useState('')
  const [showAccForm, setShowAccForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchAccounts = async () => {
    try {
      setIsLoading(true)
      const res = await api.get('/accounts')
      setAccounts(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-steam-blue flex items-center gap-2">
          <Gamepad2 /> Manage Games
        </h1>
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
      
      {error && <div className="mb-6 bg-red-500/20 border border-red-500/50 p-3 rounded-xl text-red-400 text-sm">{error}</div>}

      <div className="flex flex-col gap-12">
        {/* Create / Edit Steam Account */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden transition-all">
          <button 
            onClick={() => setShowAccForm(!showAccForm)}
            className="w-full p-6 flex items-center justify-between text-lg font-bold hover:bg-white/5 transition-colors focus:outline-none"
          >
            <span className="flex items-center gap-2"><Plus size={18}/> {editingId ? 'Edit' : 'Add'} Steam Account</span>
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

        {/* Manage Existing Accounts */}
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
      </div>
    </motion.div>
  )
}

export default GameManagement
