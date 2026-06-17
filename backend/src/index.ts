import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import authRoutes from './routes/auth'
import accountRoutes from './routes/accounts'
import streamRoutes from './routes/stream'
import bannerRoutes from './routes/banner'

const app = express()
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/stream', streamRoutes)
app.use('/api/banner', bannerRoutes)

const PORT = process.env.PORT || 3001

const seedDatabase = async () => {
  const defaultAdminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'zamir'
  const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'zamir'

  const existingAdmin = await prisma.user.findUnique({ where: { username: defaultAdminUsername } })
  if (!existingAdmin) {
    import('bcrypt').then(async (bcrypt) => {
      const password_hash = await bcrypt.hash(defaultAdminPassword, 10)
      await prisma.user.create({
        data: { username: defaultAdminUsername, password_hash, role: 'admin' }
      })
      console.log(`Default admin user (${defaultAdminUsername}) created.`)
    })
  }
}

app.listen(PORT as number, '0.0.0.0', async () => {
  await seedDatabase()
  console.log(`Backend server listening on port ${PORT}`)
})
