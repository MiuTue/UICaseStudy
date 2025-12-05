import React, { useState } from 'react'
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom'
import Home from './Screen/Auth/Home'
import SideBar from './components/SideBar' // Import SideBar
import HistoryDetail from './Screen/App/HistroryDetail'
import CaseList from './Screen/App/CaseList'
import Login from './Screen/Auth/Login'
import Register from './Screen/Auth/Register'
import ForgotPassword from './Screen/Auth/ForgotPassword'
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

// Layout cho các trang sau khi đăng nhập
function AuthenticatedLayout() {
  const [isCollapsed, setCollapsed] = useState(false);

  return (
    <div className="flex">
      <SideBar isCollapsed={isCollapsed} setCollapsed={setCollapsed} />
      {/* Nội dung chính sẽ được đẩy sang phải để không bị che bởi sidebar */}
      <main 
        className="flex-1 transition-all duration-300 ease-in-out" 
        style={{ marginLeft: isCollapsed ? '80px' : '250px' }}>
        <Outlet /> {/* Đây là nơi các component con (User, CaseList,...) sẽ được render */}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Các route App - yêu cầu đăng nhập, sử dụng AuthenticatedLayout */}
      <Route element={<RequireAuth><AuthenticatedLayout /></RequireAuth>}>
        <Route path="/user" element={<User />} />
        <Route path="/case-list" element={<CaseList />} />
        <Route path="/history/:sessionId" element={<HistoryDetail />} />
        <Route path="/case-runner/:caseId/*" element={<CaseRunner />} />
        <Route path="/case-input" element={<CaseInput />} />
      </Route>

      {/* Các route Auth, Home - không cho vào nếu đã đăng nhập */}
      <Route path="/case-home" element={<RejectIfAuth><CaseList /></RejectIfAuth>} />
      <Route path="/" element={<RejectIfAuth><Home /></RejectIfAuth>} />
      <Route path="/login" element={<RejectIfAuth><Login /></RejectIfAuth>} />
      <Route path="/register" element={<RejectIfAuth><Register /></RejectIfAuth>} />
      <Route path="/forgot-password" element={<RejectIfAuth><ForgotPassword /></RejectIfAuth>} />
    </Routes>
  )
}