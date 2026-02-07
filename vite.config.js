import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? ''
const isUserSite = repo.endsWith('.github.io')
const base = process.env.GITHUB_ACTIONS ? (isUserSite ? '/' : `/${repo}/`) : '/'

export default defineConfig({
  base,
  plugins: [react()],
})
