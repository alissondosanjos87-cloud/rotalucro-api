import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
import Mapa from './pages/Mapa'
import Historico from './pages/Historico'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('rl_token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
      <Route path="/mapa" element={<PrivateRoute><Mapa /></PrivateRoute>} />
      <Route path="/historico" element={<PrivateRoute><Historico /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
