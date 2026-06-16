import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface AuthRequest extends Request {
  userId?: number
  role?: string
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.split(' ')[1]
  const decoded = verifyToken(token)

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
  if (!user) {
    return res.status(401).json({ error: 'User no longer exists' })
  }

  req.userId = user.id
  req.role = user.role
  next()
}
