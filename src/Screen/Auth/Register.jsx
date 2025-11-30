import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/NavBar.jsx';
import Footer from '../../components/Footer.jsx';
import { backgroundImage, img_home1 } from '../../Image/image.js';

export default function Register() {
  const [name, setName] = useState('');
  const [confirm, setConfirm] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const res = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
  
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error('Không lấy được JSON từ response:', jsonErr);
        setErr('Phản hồi server không hợp lệ (không phải JSON)');
        return;
      }
  
      if (!res.ok) {
        console.error('Đăng ký thất bại:', data);
        setErr(data.message || 'Error occurred');
        return;
      }
      console.log('Đăng ký thành công:', data);
      alert('Đăng ký thành công!');
      navigate('/login');
    } catch (err) {
      console.error('Lỗi khi gửi đăng ký:', err);
      setErr('Lỗi hệ thống');
    }
  };

  return (
    <div>
      <NavBar/>
      <div
        className="min-h-screen w-full flex flex-col md:flex-row items-stretch justify-stretch"
        style={{
          backgroundImage: `linear-gradient(rgba(20,30,50,0.5), rgba(20,30,50,0.5)), url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Khung chào mừng - bên trái */}
        <div className="w-full md:w-9/15 flex flex-col items-center justify-center p-10 min-h-[420px] backdrop-blur-sm">
          <div className="text-9xl md:text-6xl lg:text-7xl font-extrabold uppercase text-white text-center drop-shadow-2xl leading-tight mb-6" style={{opacity: 0.85}}>
            Join Us <br />
          </div>
          <div className="text-4xl md:text-2xl text-white/80 font-semibold tracking-widest uppercase text-center mb-8" style={{opacity: 0.8}}>
            Create Your Account
          </div>
          <div className="text-lg text-white/70 text-center max-w-md mb-8" style={{opacity: 0.9}}>
            Start your journey with CaseStudy Hub and unlock access to real-world case studies and learning opportunities
          </div>
          <div className="flex justify-center">
            <img
              src={img_home1}
              alt="CaseStudy Hub Community"
              className="w-32 h-32 rounded-full shadow-2xl object-cover opacity-90"
            />
          </div>
        </div>
        {/* Khung đăng ký - bên phải */}
        <div className="w-full md:6/15 flex items-center justify-center p-6 md:p-16 min-h-[420px] backdrop-blur-sm">
          <form className="w-full max-w-md bg-white/80 rounded-xl shadow-2xl p-8 md:p-10 bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-70" onSubmit={handleRegister}>
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-8 uppercase tracking-widest">
              Đăng ký
            </h2>
            <div className="mb-6">
              <label className="block text-slate-900 font-semibold mb-2">Họ và tên</label>
              <input
                className="w-full px-4 py-3 rounded-lg bg-white/70 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-300 text-lg"
                type="text"
                required
                placeholder="Nhập họ tên..."
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label className="block text-slate-900 font-semibold mb-2">Email</label>
              <input
                className="w-full px-4 py-3 rounded-lg bg-white/70 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-300 text-lg"
                type="email"
                required
                placeholder="Nhập email..."
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label className="block text-slate-900 font-semibold mb-2">Mật khẩu</label>
              <div className="relative">
                <input
                  className="w-full px-4 py-3 pr-12 rounded-lg bg-white/70 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-300 text-lg"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-slate-900 font-semibold mb-2">Xác nhận mật khẩu</label>
              <div className="relative">
                <input
                  className="w-full px-4 py-3 pr-12 rounded-lg bg-white/70 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-300 text-lg"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Nhập lại mật khẩu..."
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-700"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

                    {err && <div className="text-red-600 mb-4">{err}</div>}
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 border-2 border-primary-600 text-white font-extrabold rounded-full shadow-lg transition-all duration-300 text-lg uppercase tracking-widest hover:from-primary-600 hover:to-primary-700 hover:shadow-xl hover:scale-105 focus:outline-none mb-4">Đăng ký</button>
      
            {/* Các nút đăng ký mạng xã hội */}
            <div className="flex items-center my-6">
              <div className="flex-grow h-px bg-slate-300"></div>
              <span className="mx-2 text-slate-500 text-sm font-semibold uppercase">hoặc đăng ký bằng</span>
              <div className="flex-grow h-px bg-slate-300"></div>
            </div>
            <div className="flex justify-center gap-4">
              <button type="button" className="flex items-center gap-2 border border-slate-300 bg-white rounded-full shadow-md py-2 px-4 hover:shadow-xl transition">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" alt="Google" className="w-6 h-6" />
                <span className="text-slate-700 font-semibold">Google</span>
              </button>
              <button type="button" className="flex items-center gap-2 border border-slate-300 bg-white rounded-full shadow-md py-2 px-4 hover:shadow-xl transition">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/facebook/facebook-original.svg" alt="Facebook" className="w-6 h-6" />
                <span className="text-slate-700 font-semibold">Facebook</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    <Footer/>  

    </div>
  );
}