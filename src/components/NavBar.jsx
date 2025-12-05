import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

export default function NavBar() {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) => 
    isActive 
      ? 'transition text-primary-600 underline' 
      : 'transition hover:text-primary-600';

  return (
    <header className="sticky top-0 z-40">
      <div className="backdrop-blur bg-white/80 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo + Brand */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-xl font-semibold text-white">
              TAT
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Case Study TAT</h1>
              <p className="text-xs text-slate-500">Theo dõi & nâng tầm kỹ năng</p>
            </div>
          </Link>

          {/* Navigation Links */}
          {!token ? (
            <>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-700 md:flex">
            <NavLink to="/" className={navLinkClass} end>Giới thiệu</NavLink>
            <NavLink to="/case-home" className={navLinkClass}>Danh sách Case</NavLink>
            
          </nav>
          </>
          ) : null}

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {!token ? (
              <>
                <button onClick={() => navigate('/login')} className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-500">
                  Đăng nhập
                </button>
                <button onClick={() => navigate('/register')} className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary-200 hover:text-primary-600">
                  Đăng ký
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/user')} className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50 hover:border-primary-700 transition">
                  Trang cá nhân
                </button>
                <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600">
                  Đăng xuất
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
