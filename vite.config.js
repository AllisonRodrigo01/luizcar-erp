import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiPlugin()],
})

function apiPlugin() {
  return {
    name: 'api-handler',
    configureServer(server) {
      server.middlewares.use('/.netlify/functions/api', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Método não permitido' }))
          return
        }

        let body = ''
        req.on('data', chunk => body += chunk)
        req.on('end', async () => {
          try {
            const { default: handler } = await import('./netlify/functions/api.js')
            const response = await handler(new Request('http://localhost', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body,
            }))
            const text = await response.text()
            res.statusCode = response.status
            response.headers.forEach((v, k) => res.setHeader(k, v))
            res.end(text)
          } catch (err) {
            console.error('API error:', err)
            res.statusCode = 500
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })
    },
  }
}
