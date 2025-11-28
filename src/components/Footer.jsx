import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-900 text-slate-400 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-lg font-semibold text-white">
                📋
              </div>
              <div>
                <h3 className="text-white font-semibold">Case Study TAT</h3>
                <p className="text-xs">Nền tảng học tập thực chiến</p>
              </div>
            </div>
            <p className="text-sm text-slate-500">Giúp bạn nâng tầm kỹ năng qua các case thực tế.</p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Sản phẩm</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-primary-400 transition">Trang chủ</Link></li>
              <li><Link to="/case-list" className="hover:text-primary-400 transition">Danh sách Case</Link></li>
              <li><a href="#leaderboard" className="hover:text-primary-400 transition">Leaderboard</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4">Tài nguyên</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary-400 transition">Hướng dẫn</a></li>
              <li><a href="#" className="hover:text-primary-400 transition">Blog</a></li>
              <li><a href="#" className="hover:text-primary-400 transition">FAQ</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Liên hệ</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:contact@example.com" className="hover:text-primary-400 transition">Email</a></li>
              <li><a href="#" className="hover:text-primary-400 transition">Twitter</a></li>
              <li><a href="#" className="hover:text-primary-400 transition">GitHub</a></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              © {currentYear} Case Study TAT. Tất cả quyền được bảo lưu.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-primary-400 transition">Privacy</a>
              <a href="#" className="hover:text-primary-400 transition">Terms</a>
              <a href="#" className="hover:text-primary-400 transition">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
