import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  },
  build: {
    // Enable minification in production
    minify: 'terser',

    // Terser options for security
    terserOptions: {
      compress: {
        drop_console: true,     // Remove console.log statements
        drop_debugger: true,    // Remove debugger statements
        pure_funcs: ['console.log', 'console.debug', 'console.info'],
      },
      mangle: true,            // Mangle variable names
      output: {
        comments: false,        // Remove comments
      },
    },

    // Disable source maps in production for security
    sourcemap: false,

    // Manual chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor libraries
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          // Separate crypto utilities
          'crypto': ['./src/utils/cryptoUtils.js'],
          // Separate auth code
          'auth': ['./src/context/AuthContext.jsx', './src/services/apiService.js'],
        },
      },
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,

    // CSS minification (using default esbuild minifier)
    // Note: To use lightningcss, install: npm install -D lightningcss
    // cssMinify: 'lightningcss',
  },

  // Define global constants
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
})


