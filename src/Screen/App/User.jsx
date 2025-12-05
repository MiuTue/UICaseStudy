import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Footer from '../../components/Footer';
import { backgroundImage2 } from '../../Image/image';

export default function User() {
  const navigate = useNavigate();
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    async function fetchHistories() {
      setLoading(true);
      setErr('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:8000/api/sessions/history', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Lỗi lấy lịch sử case');
        }
        const data = await res.json();
        setHistories(data);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchHistories();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 text-slate-200"
        style={{
          backgroundImage: `linear-gradient(rgba(20,30,50,0.85), rgba(20,30,50,0.95)), url(${backgroundImage2})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="mb-12 flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <h1 className="text-4xl font-black text-white drop-shadow-lg">
                Dashboard
              </h1>
              <p className="mt-2 text-lg text-slate-300">
                Chào mừng trở lại! Đây là trung tâm điều khiển của bạn.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition-transform duration-200 hover:scale-105 hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V5h10a1 1 0 100-2H3zm12.293 4.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L16.586 13H7a1 1 0 110-2h9.586l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Đăng xuất
            </button>
          </header>

          {/* Main Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Column: Quick Actions */}
            <div className="flex flex-col gap-8 lg:col-span-1">
              {/* Total Cases Widget */}
              <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 shadow-lg">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Thống kê</h3>
                <p className="mt-2 text-4xl font-black text-white">{histories.length}</p>
                <p className="text-slate-300">Case đã hoàn thành</p>
              </div>

              {/* Quick Actions */}
              <Link to="/case-list" className="group block rounded-2xl border border-slate-700 bg-slate-800/50 p-6 shadow-lg transition-all duration-300 hover:border-primary-500/70 hover:bg-slate-700/50">
                <h3 className="text-lg font-bold text-primary-400">Tới thư viện Case</h3>
                <p className="mt-1 text-sm text-slate-300">Khám phá và bắt đầu các tình huống mô phỏng.</p>
              </Link>
              <Link to="/case-input" className="group block rounded-2xl border border-slate-700 bg-slate-800/50 p-6 shadow-lg transition-all duration-300 hover:border-emerald-500/70 hover:bg-slate-700/50">
                <h3 className="text-lg font-bold text-emerald-400">Tạo Case mới</h3>
                <p className="mt-1 text-sm text-slate-300">Nhập liệu hoặc sinh tự động một tình huống mới.</p>
              </Link>
            </div>

            {/* Right Column: User List */}
            <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 shadow-lg lg:col-span-2">
              <h2 className="text-2xl font-bold text-white mb-6">📖 Lịch sử làm Case</h2>
              {loading && (
                <div className="flex justify-center items-center h-48">
                  <svg className="animate-spin h-8 w-8 text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
              {err && (
                <div className="bg-rose-900/50 border border-rose-500 text-rose-300 px-4 py-3 rounded-lg" role="alert">
                  <strong className="font-bold">Lỗi: </strong>
                  <span className="block sm:inline">{err}</span>
                </div>
              )}
              {!loading && !err && (
                <div className="space-y-4">
                  {histories.map((history) => (
                    <Link 
                      to={`/history/${history.sessionId}`} 
                      key={history.sessionId} 
                      className="group flex items-center gap-4 rounded-lg bg-slate-900/50 p-4 transition-all duration-200 hover:bg-slate-700/50 hover:ring-2 hover:ring-primary-500"
                    >
                      {/* Icon */}
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 group-hover:bg-primary-600/50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      {/* History Info */}
                      <div className="flex-1">
                        <p className="font-semibold text-white">Case ID: {history.caseId}</p>
                        <p className="text-sm text-slate-400">
                          Ngày làm: {new Date(history.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      {/* Score */}
                      <div className="text-right">
                        <p className="text-sm text-slate-400">Điểm</p>
                        <span className="text-2xl font-bold text-emerald-400">
                          {history.finalScore}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {!loading && !err && histories.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-400">Bạn chưa hoàn thành case nào.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
