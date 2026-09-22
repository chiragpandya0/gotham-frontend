import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    // Default `host: 'localhost'` binds IPv6-loopback only on this system —
    // devcontainer/remote port forwarding proxies over IPv4, which then
    // can't reach the server at all (shows as a blank page, not a clear
    // connection error). Bind the IPv4 loopback explicitly instead of
    // `host: true`, which would also expose this on the network.
    host: '127.0.0.1',
    strictPort: true,
  },
})
