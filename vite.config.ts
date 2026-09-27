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
    // Proxies /api to the backend SERVER-SIDE (inside this dev server
    // process, over plain loopback) instead of having the BROWSER call the
    // API's port directly -- two real bugs this fixes, same as edge's own
    // frontend (edge/frontend/vite.config.ts):
    //  1. Session cookie: grid_session is SameSite=Lax and scoped to the
    //     exact host it was set on, so a direct browser->API call only
    //     works if the page and the API are reached under the identical
    //     host string (127.0.0.1 vs localhost are different hosts/sites to
    //     the browser even on the same machine, despite both resolving
    //     locally) -- the original bug behind this fix, and it silently
    //     recurs any time the page happens to be opened under a different
    //     host than whatever's hardcoded as the API's.
    //  2. Remote/port-forwarded dev environments (e.g. VS Code Remote):
    //     only the port you actually open in the browser gets forwarded to
    //     your machine -- a hardcoded absolute API host in the page's own
    //     JS resolves against YOUR machine, not this box.
    // Proxying means the browser only ever talks to ONE origin (wherever
    // this dev server itself is reached from), which works identically
    // whether opened as 127.0.0.1, localhost, or a forwarded tunnel URL.
    // src/config/env.ts's API_BASE_URL defaults to '' (relative) to match.
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
})
