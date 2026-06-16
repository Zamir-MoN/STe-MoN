import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'steam-hub-super-secret-key'

export const generateToken = (userId: number) => {
  return jwt.sign({ userId }, SECRET, { expiresIn: '7d' })
}

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, SECRET) as { userId: number }
  } catch (e) {
    return null
  }
}
