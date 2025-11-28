import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/NavBar';
import Footer from '../../components/Footer';

export default function User() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setErr('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:8000/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Lỗi lấy danh sách user');
        }
        const data = await res.json();
        setUsers(data);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <NavBar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Tài khoản của bạn</h1>
              <p className="text-lg text-slate-600 mt-1">Quản lý thông tin và xem danh sách người dùng.</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Đăng xuất
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-6">👥 Danh sách người dùng</h2>
            {loading && <div className="text-center text-gray-500">Đang tải danh sách...</div>}
            {err && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Lỗi: </strong>
                <span className="block sm:inline">{err}</span>
              </div>}
            {!loading && !err && (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">ID</th>
                      <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Email</th>
                      <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Tên</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="text-left py-3 px-4">{user.id}</td>
                        <td className="text-left py-3 px-4">{user.email}</td>
                        <td className="text-left py-3 px-4">{user.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
