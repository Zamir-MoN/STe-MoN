import React, { useState, useEffect } from 'react'
import { Play, Plus, X, MonitorPlay } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../api'
import SkeletonRow from '../components/SkeletonRow'

const BroadcastPanel = ({ role }: { role: string }) => {
  const [bannerUrl, setBannerUrl] = useState('')
  const [bannerMsg, setBannerMsg] = useState('')
  const [error, setError] = useState('')
  
  const [banners, setBanners] = useState<any[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [previewSize, setPreviewSize] = useState(100)
  const [previewAlign, setPreviewAlign] = useState(50)
  const [isLoading, setIsLoading] = useState(true)

  const fetchBanners = async () => {
    try {
      setIsLoading(true)
      const res = await api.get('/banner')
      setBanners(res.data)
    } catch(err) {} finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (role === 'admin' || role === 'owner') {
      fetchBanners()
    }
  }, [role])

  if (role !== 'admin' && role !== 'owner') {
    return <div className="p-8 text-red-400">Access Denied. Admins and Owners only.</div>
  }

  const handleBroadcastBanner = async (e: React.FormEvent) => {
    e.preventDefault()
    setBannerMsg('')
    setError('')
    try {
      if (editingId) {
        await api.put(`/banner/${editingId}`, { image_url: bannerUrl, zoom_size: previewSize, alignment: previewAlign })
        setBannerMsg('Banner updated successfully!')
      } else {
        await api.post('/banner', { image_url: bannerUrl, zoom_size: previewSize, alignment: previewAlign })
        setBannerMsg('Banner broadcasted successfully!')
      }
      setBannerUrl('')
      setEditingId(null)
      setPreviewSize(100)
      setPreviewAlign(50)
      fetchBanners()
      setTimeout(() => setBannerMsg(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save banner')
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this broadcast?')) return;
    try {
      await api.delete(`/banner/${id}`)
      fetchBanners()
    } catch (err: any) {
      setError('Failed to delete banner')
    }
  }

  const handleEdit = (b: any) => {
    setEditingId(b.id)
    setBannerUrl(b.image_url)
    setPreviewSize(b.zoom_size || 100)
    setPreviewAlign(b.alignment ?? 50)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-cyan-400 flex items-center gap-2">
        <Play /> Broadcasts
      </h1>
      
      {error && <div className="mb-6 bg-red-500/20 border border-red-500/50 p-3 rounded-xl text-red-400 text-sm">{error}</div>}

      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden p-6 mb-8">
        <h2 className="text-lg font-bold mb-4 text-white">{editingId ? 'Edit Broadcast' : 'Broadcast Upcoming Game'}</h2>
        {bannerMsg && <p className="text-green-400 text-sm mb-4">{bannerMsg}</p>}
        
        <form onSubmit={handleBroadcastBanner} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Banner Image URL</label>
            <input type="url" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} required placeholder="https://example.com/banner.jpg" className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-cyan-500/50" />
          </div>
          
          {bannerUrl && (
            <div className="bg-black/30 rounded-lg border border-white/10 p-4 mt-2">
              <div className="flex justify-between items-center mb-4">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Live Preview</label>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">Offset</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={previewAlign} 
                      onChange={e => setPreviewAlign(Number(e.target.value))} 
                      className="w-24 accent-purple-500" 
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">Zoom Size</span>
                    <input 
                      type="range" 
                      min="10" 
                      max="100" 
                      value={previewSize} 
                      onChange={e => setPreviewSize(Number(e.target.value))} 
                      className="w-24 accent-cyan-500" 
                    />
                    <span className="text-xs text-gray-400 w-10 text-right">{previewSize}%</span>
                  </div>
                </div>
              </div>
              <div className="w-full flex justify-center items-center bg-black/50 rounded-lg overflow-hidden border border-white/5 aspect-[16/7] md:aspect-[21/8]">
                <img 
                  src={bannerUrl} 
                  alt="Live Preview" 
                  style={{ 
                    width: `${previewSize}%`,
                    objectPosition: `center ${previewAlign}%`
                  }} 
                  className="h-full object-cover block transition-all shadow-xl rounded"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <button type="submit" className="w-auto px-8 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/50 text-cyan-400 font-bold py-2 rounded-lg transition-colors">
              {editingId ? 'Update Banner' : 'Broadcast Banner'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setBannerUrl('') }} className="px-4 bg-gray-500/20 hover:bg-gray-500/40 border border-gray-500/50 text-gray-300 font-bold py-2 rounded-lg transition-colors">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4 text-white">Manage Broadcasts</h2>
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => <SkeletonRow key={i} />)}
          </div>
        ) : banners.length === 0 ? (
          <p className="text-gray-400 text-sm">No broadcasts found.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {banners.map((b: any) => (
              <div key={b.id} className="flex items-center w-full bg-black/30 border border-white/5 rounded-lg p-4 overflow-hidden">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-32 h-16 bg-black rounded overflow-hidden flex-shrink-0">
                    <img src={b.image_url} alt="banner" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-sm text-gray-300">
                    <a href={b.image_url} target="_blank" rel="noreferrer" className="hover:text-cyan-400 hover:underline block truncate max-w-[30vw] md:max-w-[40vw] xl:max-w-[50vw]">
                      {b.image_url}
                    </a>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 ml-4">
                  <button onClick={() => handleEdit(b)} className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white transition-colors">Edit</button>
                  <button onClick={() => handleDelete(b.id)} className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded text-xs transition-colors">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default BroadcastPanel;


