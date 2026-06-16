import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { generateToken } from '../utils/jwt'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' })

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) return res.status(400).json({ error: 'Invalid credentials' })

    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) return res.status(400).json({ error: 'Invalid credentials' })

    const token = generateToken(user.id)
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Admin-only Create User Route
router.post('/create-user', authenticate, async (req: AuthRequest, res) => {
  try {
    // Check if the requester is an admin
    const requester = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' })
    }

    const { username, password, role } = req.body
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' })

    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (existingUser) return res.status(400).json({ error: 'Username already exists' })

    const password_hash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { username, password_hash, role: role || 'user' }
    })

    res.json({ message: 'User created successfully', user: { id: user.id, username: user.username, role: user.role } })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Get all users
router.get('/users', authenticate, async (req: AuthRequest, res) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!requester || requester.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    
    const defaultAdminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'zamir'
    
    const users = await prisma.user.findMany({ 
      where: {
        username: { not: defaultAdminUsername }
      },
      select: { id: true, username: true, role: true, created_at: true } 
    })
    
    const usersWithFlags = users.map(u => ({
      ...u,
      isSelf: u.id === req.userId
    }))

    res.json(usersWithFlags)
  } catch (error) { res.status(500).json({ error: 'Server error' }) }
})

// Update user
router.put('/users/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!requester || requester.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    
    const id = parseInt(req.params.id)
    const { username, password, role } = req.body

    const userToUpdate = await prisma.user.findUnique({ where: { id } })
    if (!userToUpdate) return res.status(404).json({ error: 'User not found' })

    const defaultAdminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'zamir'
    if (userToUpdate.username === defaultAdminUsername && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot remove admin role from default admin' })
    }

    const updateData: any = { username, role }
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    })
    res.json({ message: 'User updated', user: { id: user.id, username: user.username, role: user.role } })
  } catch (error) { res.status(500).json({ error: 'Server error' }) }
})

// Delete user
router.delete('/users/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!requester || requester.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })

    const id = parseInt(req.params.id)
    if (id === req.userId) return res.status(400).json({ error: 'Cannot delete yourself' })

    const userToDelete = await prisma.user.findUnique({ where: { id } })
    if (!userToDelete) return res.status(404).json({ error: 'User not found' })

    const defaultAdminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'zamir'
    if (userToDelete.username === defaultAdminUsername) {
      return res.status(400).json({ error: 'Cannot delete the default admin user' })
    }

    await prisma.user.delete({ where: { id } })
    res.json({ message: 'User deleted' })
  } catch (error) { res.status(500).json({ error: 'Server error' }) }
})

// Get current user profile
router.get('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, username: true, role: true, profile_name: true, profile_pic: true, steam_path: true }
    })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (error) { res.status(500).json({ error: 'Server error' }) }
})

// Update current user profile
router.put('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const { profile_name, profile_pic, steam_path } = req.body
    
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { profile_name, profile_pic, steam_path },
      select: { id: true, username: true, role: true, profile_name: true, profile_pic: true, steam_path: true }
    })
    res.json({ message: 'Profile updated', user })
  } catch (error) { res.status(500).json({ error: 'Server error' }) }
})

export default router
