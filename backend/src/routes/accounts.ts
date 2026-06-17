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
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { selectiveAccesses: true }
    })

    const accounts = await prisma.account.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        usersInLibrary: {
          where: { id: req.userId }
        }
      }
    })
    
    // Strip steam_password if requester is NOT an admin or owner
    const secureAccounts = accounts.map(acc => {
      const inLibrary = acc.usersInLibrary.length > 0
      const { usersInLibrary, ...baseAcc } = acc

      let hasAccess = true;
      let expires_at = null;

      if (user?.access_plan === 'SELECTIVE' && req.role !== 'admin' && req.role !== 'owner') {
        const access = user?.selectiveAccesses.find(a => a.account_id === acc.id);
        if (!access) {
          hasAccess = false;
        } else if (access.expires_at && new Date(access.expires_at).getTime() < Date.now()) {
          hasAccess = false;
        } else {
          expires_at = access.expires_at;
        }
      }

      const returnedAcc = { ...baseAcc, inLibrary, hasAccess, expires_at };

      if (req.role !== 'admin' && req.role !== 'owner') {
        const { steam_password, ...safeAcc } = returnedAcc
        return safeAcc
      }
      return returnedAcc
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
        },
        selectiveAccesses: true
      }
    })

    if (!user) return res.status(404).json({ error: 'User not found' })

    const secureAccounts = user.libraryAccounts.reduce((accList, acc) => {
      let hasAccess = true;
      let expires_at = null;
      let plan_tag = user.access_plan;

      if (user.access_plan === 'SELECTIVE' && req.role !== 'admin' && req.role !== 'owner') {
        const access = user.selectiveAccesses.find(a => a.account_id === acc.id);
        if (!access) {
          hasAccess = false;
        } else if (access.expires_at && new Date(access.expires_at).getTime() < Date.now()) {
          hasAccess = false;
        } else {
          expires_at = access.expires_at;
        }
      }

      // Filter out games they no longer have access to
      if (!hasAccess) return accList;

      const returnedAcc = { ...acc, inLibrary: true, hasAccess, expires_at, plan_tag };

      if (req.role !== 'admin' && req.role !== 'owner') {
        const { steam_password, ...safeAcc } = returnedAcc;
        accList.push(safeAcc);
      } else {
        accList.push(returnedAcc);
      }
      return accList;
    }, []);

    res.json(secureAccounts)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Create new global steam account (Admin only)
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (req.role !== 'admin' && req.role !== 'owner') {
      return res.status(403).json({ error: 'Forbidden: Admins and Owners only' })
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
      where: { id: parseInt(req.params.id as string) },
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
    const accountId = parseInt(req.params.id as string)

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
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { selectiveAccesses: true }
    });
    const accountId = parseInt(req.params.id as string)

    if (user?.access_plan === 'SELECTIVE' && req.role !== 'admin' && req.role !== 'owner') {
      const access = user.selectiveAccesses.find(a => a.account_id === accountId);
      if (!access || (access.expires_at && new Date(access.expires_at).getTime() < Date.now())) {
        return res.status(403).json({ error: 'Buy from admin or Owner' });
      }
    }

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
    const accountId = parseInt(req.params.id as string)
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
    if (req.role !== 'admin' && req.role !== 'owner') {
      return res.status(403).json({ error: 'Forbidden: Admins and Owners only' })
    }

    const { alias_name, steam_username, steam_password, description } = req.body
    const account = await prisma.account.update({
      where: { id: parseInt(req.params.id as string) },
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
    if (req.role !== 'admin' && req.role !== 'owner') {
      return res.status(403).json({ error: 'Forbidden: Admins and Owners only' })
    }

    // Must delete related logs first to avoid foreign key errors, or cascade handle it.
    // Our schema doesn't have onDelete Cascade on ActivityLog to Account.
    await prisma.activityLog.deleteMany({
      where: { account_id: parseInt(req.params.id as string) }
    })

    await prisma.account.delete({
      where: { id: parseInt(req.params.id as string) }
    })

    res.json({ message: 'Account deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/:id/credentials', async (req: AuthRequest, res) => {
  try {
    const account = await prisma.account.findUnique({
      where: { id: parseInt(req.params.id as string) }
    })

    if (!account) return res.status(404).json({ error: 'Account not found' })

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { selectiveAccesses: true }
    });

    let expires_at = null;
    if (user?.access_plan === 'SELECTIVE' && req.role !== 'admin' && req.role !== 'owner') {
      const access = user.selectiveAccesses.find(a => a.account_id === account.id);
      if (!access || (access.expires_at && new Date(access.expires_at).getTime() < Date.now())) {
        return res.status(403).json({ error: 'Access expired or denied.' });
      }
      expires_at = access.expires_at;
    }

    // Log the activity
    await prisma.activityLog.create({
      data: { user_id: req.userId!, action: `Launched Steam as ${account.alias_name}`, account_id: account.id }
    })

    res.json({ 
      steam_username: account.steam_username, 
      steam_password: account.steam_password,
      expires_at
    })
  } catch (error) {
    console.error('Credentials fetch error:', error)
    res.status(500).json({ error: 'Server error fetching credentials' })
  }
})

export default router
