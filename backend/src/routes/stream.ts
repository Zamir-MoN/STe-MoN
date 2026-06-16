import { Router, Response } from 'express'

const router = Router()
export const clients: Response[] = []

router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
  clients.push(res)

  req.on('close', () => {
    const index = clients.indexOf(res)
    if (index !== -1) clients.splice(index, 1)
  })
})

export const broadcast = (data: any) => {
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(data)}\n\n`)
  })
}

export default router
