// import { defineConfig } from 'vite';

// // https://vitejs.dev/config
// export default defineConfig({});

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  root: path.join(__dirname, "src", "mainwindow"),
  plugins: [react()],
})