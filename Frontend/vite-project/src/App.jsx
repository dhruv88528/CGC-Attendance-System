import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { OfflineProvider } from './context/OfflineContext'
import SplashScreen from './components/common/SplashScreen'
import routes from './routes'
import './styles/globals.css'

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashComplete, setSplashComplete] = useState(false);

  // Check if this is the first visit in this session
  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('splashShown');
    if (hasSeenSplash) {
      setShowSplash(false);
      setSplashComplete(true);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('splashShown', 'true');
    setSplashComplete(true);
  };

  return (
    <>
      {showSplash && !splashComplete && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}

      <Router>
        <AuthProvider>
          <ThemeProvider>
            <OfflineProvider>
              <Routes>
                {routes.map((route, index) => (
                  <Route
                    key={index}
                    path={route.path}
                    element={<route.component />}
                  />
                ))}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </OfflineProvider>
          </ThemeProvider>
        </AuthProvider>
      </Router>
    </>
  )
}

export default App