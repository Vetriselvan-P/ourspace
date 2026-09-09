import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PresenceProvider } from './context/PresenceContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { TicTacToe } from './pages/TicTacToe';
import { DailyQuestion } from './pages/DailyQuestion';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PresenceProvider>
          <div className="app-container">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/play/tic-tac-toe"
                element={
                  <ProtectedRoute>
                    <TicTacToe />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/together/daily-question"
                element={
                  <ProtectedRoute>
                    <DailyQuestion />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </div>
        </PresenceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
