import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  root: path.join(__dirname, "src", "mainwindow"),
  plugins: [react()],
  optimizeDeps:{
    // exclude:['react'] // this doesn't work; deleting node_modules and rerunning npm install did though
    include:['react-dom']
  }
})