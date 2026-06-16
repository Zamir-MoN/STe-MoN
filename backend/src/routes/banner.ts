import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, AuthRequest } from '../middleware/auth'
import { broadcast } from './stream'

const router = Router()
const prisma = new PrismaClient()

// Get banners (supports ?limit=N)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const banners = await prisma.banner.findMany({
      orderBy: { created_at: 'desc' },
      take: limit
    })
    res.json(banners)
  } catch (error) { 
    res.status(500).json({ error: 'Server error' }) 
  }
})

// Create a new banner
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }
    
    const { image_url, zoom_size, alignment } = req.body
    if (!image_url) {
      return res.status(400).json({ error: 'Image URL is required' })
    }

    const banner = await prisma.banner.create({ 
      data: { 
        image_url, 
        zoom_size: zoom_size ? parseInt(zoom_size) : 100,
        alignment: alignment !== undefined ? parseInt(alignment) : 50
      } 
    })
    
    // Broadcast to all connected clients
    broadcast({ type: 'NEW_BANNER', payload: banner })
    
    res.json(banner)
  } catch (error) { 
    res.status(500).json({ error: 'Server error' }) 
  }
})

// Update a banner
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!requester || requester.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    
    const { image_url, zoom_size, alignment } = req.body
    if (!image_url) return res.status(400).json({ error: 'Image URL is required' })

    const banner = await prisma.banner.update({
      where: { id: parseInt(req.params.id as string) },
      data: { 
        image_url,
        zoom_size: zoom_size ? parseInt(zoom_size) : 100,
        alignment: alignment !== undefined ? parseInt(alignment) : 50
      }
    })
    
    broadcast({ type: 'NEW_BANNER', payload: banner })
    res.json(banner)
  } catch (error) { res.status(500).json({ error: 'Server error' }) }
})

// Delete a banner
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!requester || requester.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    
    await prisma.banner.delete({ where: { id: parseInt(req.params.id as string) } })
    
    broadcast({ type: 'NEW_BANNER', payload: null }) // Signal change
    res.json({ success: true })
  } catch (error) { res.status(500).json({ error: 'Server error' }) }
})

export default router
