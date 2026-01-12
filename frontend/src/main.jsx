/**
 * Main entry point for the CryptaMail application
 * 
 * IMPORTANT: Environment validation is imported at the top
 * This ensures configuration is validated before the app starts
 */

// ⚠️ CRITICAL: Import environment validation FIRST
// This must be the very first import to validate config before anything else runs
import './config/environment';

// React and core dependencies
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Application components
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Styles
import './index.css';

// Render application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);