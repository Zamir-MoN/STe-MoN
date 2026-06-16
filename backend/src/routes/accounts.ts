import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, AuthRequest } from '../middleware/auth'
import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import { broadcast } from './stream'

const execAsync = promisify(exec)

const router = Router()
const prisma = new PrismaClient()

router.use(authenticate)

// Get all global accounts
router.get('/', async (req: AuthRequest, res) => {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        usersInLibrary: {
          where: { id: req.userId }
        }
      }
    })
    
    // Strip steam_password if requester is NOT an admin
    const secureAccounts = accounts.map(acc => {
      const inLibrary = acc.usersInLibrary.length > 0
      const { usersInLibrary, ...baseAcc } = acc

      if (req.role !== 'admin') {
        const { steam_password, ...safeAcc } = baseAcc
        return { ...safeAcc, inLibrary }
      }
      return { ...baseAcc, inLibrary }
    })

    res.json(secureAccounts)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Get user's library accounts
router.get('/library', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        libraryAccounts: {
          orderBy: { created_at: 'desc' }
        }
      }
    })

    if (!user) return res.status(404).json({ error: 'User not found' })

    const secureAccounts = user.libraryAccounts.map(acc => {
      if (req.role !== 'admin') {
        const { steam_password, ...safeAcc } = acc
        return { ...safeAcc, inLibrary: true }
      }
      return { ...acc, inLibrary: true }
    })

    res.json(secureAccounts)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Create new global steam account (Admin only)
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (req.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' })
    }

    const { alias_name, steam_username, steam_password, owner_name, description, notes } = req.body
    if (!alias_name || !steam_username || !steam_password) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const account = await prisma.account.create({
      data: {
        alias_name,
        steam_username,
        steam_password,
        owner_name,
        description,
        notes
      }
    })
    
    // Log activity
    await prisma.activityLog.create({
      data: { user_id: req.userId!, action: 'Global Account created', account_id: account.id }
    })

    // Broadcast new game to all users via SSE
    broadcast({ 
      type: 'NEW_GAME', 
      payload: { 
        alias_name: account.alias_name, 
        description: account.description 
      } 
    })

    res.json(account)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/:id/favorite', async (req: AuthRequest, res) => {
  try {
    const { favorite } = req.body
    const account = await prisma.account.update({
      where: { id: parseInt(req.params.id) },
      data: { favorite }
    })
    res.json(account)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/:id/vote', async (req: AuthRequest, res) => {
  try {
    const { vote } = req.body // 'working' or 'not_working'
    const accountId = parseInt(req.params.id)

    if (vote === 'working') {
      await prisma.account.update({
        where: { id: accountId },
        data: { working_votes: { increment: 1 } }
      })
    } else if (vote === 'not_working') {
      await prisma.account.update({
        where: { id: accountId },
        data: { not_working_votes: { increment: 1 } }
      })
    }

    res.json({ message: 'Vote recorded' })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Add to library
router.post('/:id/library', async (req: AuthRequest, res) => {
  try {
    const accountId = parseInt(req.params.id)
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        libraryAccounts: {
          connect: { id: accountId }
        }
      }
    })
    res.json({ message: 'Added to library' })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Remove from library
router.delete('/:id/library', async (req: AuthRequest, res) => {
  try {
    const accountId = parseInt(req.params.id)
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        libraryAccounts: {
          disconnect: { id: accountId }
        }
      }
    })
    res.json({ message: 'Removed from library' })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Update global steam account (Admin only)
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    if (req.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' })
    }

    const { alias_name, steam_username, steam_password, description } = req.body
    const account = await prisma.account.update({
      where: { id: parseInt(req.params.id) },
      data: {
        alias_name,
        steam_username,
        steam_password,
        description
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: { user_id: req.userId!, action: `Edited account ${account.alias_name}`, account_id: account.id }
    })

    res.json(account)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Delete global steam account (Admin only)
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    if (req.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' })
    }

    // Must delete related logs first to avoid foreign key errors, or cascade handle it.
    // Our schema doesn't have onDelete Cascade on ActivityLog to Account.
    await prisma.activityLog.deleteMany({
      where: { account_id: parseInt(req.params.id) }
    })

    await prisma.account.delete({
      where: { id: parseInt(req.params.id) }
    })

    res.json({ message: 'Account deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/:id/launch', async (req: AuthRequest, res) => {
  try {
    const account = await prisma.account.findUnique({
      where: { id: parseInt(req.params.id) }
    })

    if (!account) return res.status(404).json({ error: 'Account not found' })

    // 1. Kill existing Steam process if running
    try {
      await execAsync('taskkill /F /IM steam.exe')
      // Wait a moment for Steam to cleanly shut down its locks
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (e) {
      // Ignore error if Steam was not running
    }

    // 2. Get Steam executable path from Windows Registry
    let steamPath = 'C:\\Program Files (x86)\\Steam\\steam.exe'
    try {
      const { stdout } = await execAsync('powershell -Command "(Get-ItemProperty -Path \'HKCU:\\Software\\Valve\\Steam\').SteamExe"')
      if (stdout.trim()) {
        steamPath = stdout.trim()
      }
    } catch (e) {
      console.warn('Could not read Steam registry path, using default')
    }

    // Normalize path just in case
    steamPath = steamPath.replace(/\//g, '\\')

    // 3. Launch Steam with auto-login arguments
    // We use detached spawn so Steam stays open even if backend closes
    const steamProcess = spawn(steamPath, ['-login', account.steam_username, account.steam_password], {
      detached: true,
      stdio: 'ignore'
    })
    
    steamProcess.unref()

    // Log the activity
    await prisma.activityLog.create({
      data: { user_id: req.userId!, action: `Launched Steam as ${account.alias_name}`, account_id: account.id }
    })

    res.json({ message: 'Steam launching successfully' })
  } catch (error) {
    console.error('Launch error:', error)
    res.status(500).json({ error: 'Server error while launching Steam' })
  }
})

export default router
