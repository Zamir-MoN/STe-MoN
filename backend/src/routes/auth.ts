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
    // Check if the requester is an admin or owner
    const requester = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!requester || (requester.role !== 'admin' && requester.role !== 'owner')) {
      return res.status(403).json({ error: 'Forbidden: Admins and Owners only' })
    }

    const { username, password, role, access_plan } = req.body
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' })

    if (role === 'owner') return res.status(403).json({ error: 'Cannot create owner accounts' })
    if (requester.role === 'admin' && role !== 'user' && role !== undefined) {
      return res.status(403).json({ error: 'Admins can only create users' })
    }

    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (existingUser) return res.status(400).json({ error: 'Username already exists' })

    const password_hash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { username, password_hash, role: role || 'user', access_plan: access_plan || 'FULL' }
    })

    res.json({ message: 'User created successfully', user: { id: user.id, username: user.username, role: user.role, access_plan: user.access_plan } })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Get all users
router.get('/users', authenticate, async (req: AuthRequest, res) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!requester || (requester.role !== 'admin' && requester.role !== 'owner')) return res.status(403).json({ error: 'Forbidden' })
    
    const users = await prisma.user.findMany({ 
      select: { id: true, username: true, role: true, access_plan: true, created_at: true } 
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
    if (!requester || (requester.role !== 'admin' && requester.role !== 'owner')) return res.status(403).json({ error: 'Forbidden' })
    
    const id = parseInt(req.params.id as string)
    const { username, password, role, access_plan } = req.body

    const userToUpdate = await prisma.user.findUnique({ where: { id } })
    if (!userToUpdate) return res.status(404).json({ error: 'User not found' })

    if (requester.role === 'admin') {
      if (userToUpdate.role !== 'user') return res.status(403).json({ error: 'Admins can only edit normal users' })
      if (role && role !== 'user') return res.status(403).json({ error: 'Admins can only assign user role' })
    }

    if (role === 'owner' && userToUpdate.role !== 'owner') return res.status(403).json({ error: 'Cannot create another owner' })

    const defaultAdminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'zamir'
    if (userToUpdate.username === defaultAdminUsername && role && role !== 'owner') {
      return res.status(400).json({ error: 'Cannot remove owner role from default owner' })
    }

    const updateData: any = { username, role }
    if (access_plan) updateData.access_plan = access_plan
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    })
    res.json({ message: 'User updated', user: { id: user.id, username: user.username, role: user.role, access_plan: user.access_plan } })
  } catch (error) { res.status(500).json({ error: 'Server error' }) }
})

// Delete user
router.delete('/users/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!requester || (requester.role !== 'admin' && requester.role !== 'owner')) return res.status(403).json({ error: 'Forbidden' })

    const id = parseInt(req.params.id as string)
    if (id === req.userId) return res.status(400).json({ error: 'Cannot delete yourself' })

    const userToDelete = await prisma.user.findUnique({ where: { id } })
    if (!userToDelete) return res.status(404).json({ error: 'User not found' })

    if (requester.role === 'admin' && userToDelete.role !== 'user') {
      return res.status(403).json({ error: 'Admins can only delete normal users' })
    }

    const defaultAdminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'zamir'
    if (userToDelete.username === defaultAdminUsername) {
      return res.status(400).json({ error: 'Cannot delete the owner user' })
    }

    await prisma.user.delete({ where: { id } })
    res.json({ message: 'User deleted' })
  } catch (error) { res.status(500).json({ error: 'Server error' }) }
})

// Get Selective Accesses for a user
router.get('/users/:id/selective-access', authenticate, async (req: AuthRequest, res) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!requester || (requester.role !== 'admin' && requester.role !== 'owner')) return res.status(403).json({ error: 'Forbidden' })
    const user_id = parseInt(req.params.id as string)
    const accesses = await prisma.userSelectiveAccess.findMany({
      where: { user_id },
      include: { account: true }
    })
    res.json(accesses)
  } catch (error) { res.status(500).json({ error: 'Server error' }) }
})

// Grant Selective Access to a user
router.post('/users/:id/selective-access', authenticate, async (req: AuthRequest, res) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!requester || (requester.role !== 'admin' && requester.role !== 'owner')) return res.status(403).json({ error: 'Forbidden' })
    
    const user_id = parseInt(req.params.id as string)
    const { account_id, expires_at } = req.body // expires_at can be an ISO string or null

    const existing = await prisma.userSelectiveAccess.findUnique({
      where: { user_id_account_id: { user_id, account_id } }
    })

    if (existing) {
      const updated = await prisma.userSelectiveAccess.update({
        where: { id: existing.id },
        data: { expires_at: expires_at ? new Date(expires_at) : null }
      })
      await prisma.user.update({
        where: { id: user_id },
        data: { libraryAccounts: { connect: { id: account_id } } }
      })
      return res.json(updated)
    }

    const created = await prisma.userSelectiveAccess.create({
      data: {
        user_id,
        account_id,
        expires_at: expires_at ? new Date(expires_at) : null
      }
    })
    await prisma.user.update({
      where: { id: user_id },
      data: { libraryAccounts: { connect: { id: account_id } } }
    })
    res.json(created)
  } catch (error) { res.status(500).json({ error: 'Server error' }) }
})

// Revoke Selective Access
router.delete('/users/:id/selective-access/:accountId', authenticate, async (req: AuthRequest, res) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!requester || (requester.role !== 'admin' && requester.role !== 'owner')) return res.status(403).json({ error: 'Forbidden' })
    
    const user_id = parseInt(req.params.id as string)
    const account_id = parseInt(req.params.accountId as string)

    await prisma.userSelectiveAccess.deleteMany({
      where: { user_id, account_id }
    })
    res.json({ message: 'Access revoked' })
  } catch (error) { res.status(500).json({ error: 'Server error' }) }
})

// Get current user profile
router.get('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, username: true, role: true, access_plan: true, profile_name: true, profile_pic: true, steam_path: true }
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
