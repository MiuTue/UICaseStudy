import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Home from './Screen/Auth/Home'
import CaseList from './Screen/App/CaseList'
import CaseDetail from './Screen/App/CaseDetail'
import Login from './Screen/Auth/Login'
import Register from './Screen/Auth/Register'
import CaseRunner from './Screen/App/CaseRunner'
import CaseInput from './Screen/App/CaseInput'
import User from './Screen/App/User'

function RequireAuth({ children }) {
  const token = localStorage.getItem('token')
  const location = useLocation();
  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return children;
}

function RejectIfAuth({ children }) {
  // Nếu đã đăng nhập rồi thì không vào được trang này!
  const token = localStorage.getItem('token');
  if (token) {
    return <Navigate to="/user" replace />;
  }
  return children;
}

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1">
        <Routes>
          {/* Các route App - yêu cầu đăng nhập */}
          <Route path="/user" element={<RequireAuth><User /></RequireAuth>} />
          <Route path="/case-list" element={<RequireAuth><CaseList /></RequireAuth>} />
          <Route path="/case/:caseId/*" element={<RequireAuth><CaseDetail /></RequireAuth>} />
          <Route path="/case-runner/:caseId/*" element={<RequireAuth><CaseRunner /></RequireAuth>} />
          <Route path="/case-input" element={<RequireAuth><CaseInput /></RequireAuth>} />

          {/* Các route Auth, Home - không cho vào nếu đã đăng nhập */}
          <Route path="/case-home" element={<RejectIfAuth><CaseList /></RejectIfAuth>} />
          <Route path="/" element={<RejectIfAuth><Home /></RejectIfAuth>} />
          <Route path="/login" element={<RejectIfAuth><Login /></RejectIfAuth>} />
          <Route path="/register" element={<RejectIfAuth><Register /></RejectIfAuth>} />
        </Routes>
      </main>
    </div>
  )
}