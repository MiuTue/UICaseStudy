import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NavBar from '../../components/NavBar.jsx';
import Footer from '../../components/Footer.jsx';
import { backgroundImage } from '../../Image/image.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: new password
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSendResetCode = async (e) => {
    e.preventDefault();
    setErr('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data.message || t('auth.error_send_code'));
        return;
      }

      setSuccess(t('auth.success_send_code'));
      setStep(2);
    } catch (err) {
      setErr(t('auth.system_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setErr('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetCode })
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data.message || t('auth.invalid_code'));
        return;
      }

      setSuccess(t('auth.valid_code'));
      setStep(3);
    } catch (err) {
      setErr(t('auth.system_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErr('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setErr(t('auth.password_mismatch'));
      return;
    }

    if (newPassword.length < 6) {
      setErr(t('auth.password_too_short'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetCode, newPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data.message || t('auth.reset_failed'));
        return;
      }

      setSuccess(t('auth.reset_success'));
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setErr(t('auth.system_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <NavBar />
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
          <div className="text-5xl md:text-6xl lg:text-7xl font-extrabold uppercase text-white text-center drop-shadow-2xl leading-tight mb-6" style={{ opacity: 0.85 }}>
            {t('auth.reset_password_title')} <br />
          </div>
          <div className="text-xl md:text-2xl text-white/80 font-semibold tracking-widest uppercase text-center mb-8" style={{ opacity: 0.8 }}>
            {t('auth.secure_account')}
          </div>
          <div className="text-lg text-white/70 text-center max-w-md mb-8" style={{ opacity: 0.9 }}>
            {t('auth.reset_desc')}
          </div>
        </div>

        {/* Khung reset password - bên phải */}
        <div className="w-full md:6/15 flex items-center justify-center p-6 md:p-16 min-h-[420px] backdrop-blur-sm">
          <div className="w-full max-w-md bg-white/80 rounded-xl shadow-2xl p-8 md:p-10 bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-70">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-8 uppercase tracking-widest">
              {step === 1 && t('auth.forgot_password_title')}
              {step === 2 && t('auth.enter_code_title')}
              {step === 3 && t('auth.new_password_title')}
            </h2>

            {/* Step 1: Email Input */}
            {step === 1 && (
              <form onSubmit={handleSendResetCode}>
                <div className="mb-6">
                  <label className="block text-slate-900 font-semibold mb-2">{t('auth.email')}</label>
                  <input
                    className="w-full px-4 py-3 rounded-lg bg-white/70 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-300 text-lg"
                    type="email"
                    required
                    placeholder={t('auth.input_email_placeholder')}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                {err && <div className="text-red-600 mb-4">{err}</div>}
                {success && <div className="text-green-600 mb-4">{success}</div>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 border-2 border-primary-600 text-white font-extrabold rounded-full shadow-lg transition-all duration-300 text-lg uppercase tracking-widest hover:from-primary-600 hover:to-primary-700 hover:shadow-xl hover:scale-105 focus:outline-none mb-4 disabled:opacity-50"
                >
                  {loading ? t('auth.sending') : t('auth.send_code_button')}
                </button>
              </form>
            )}

            {/* Step 2: Code Verification */}
            {step === 2 && (
              <form onSubmit={handleVerifyCode}>
                <div className="mb-6">
                  <label className="block text-slate-900 font-semibold mb-2">{t('auth.reset_code')}</label>
                  <input
                    className="w-full px-4 py-3 rounded-lg bg-white/70 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-300 text-lg text-center tracking-widest"
                    type="text"
                    required
                    placeholder={t('auth.code_placeholder')}
                    value={resetCode}
                    onChange={e => setResetCode(e.target.value)}
                    maxLength="6"
                  />
                </div>
                {err && <div className="text-red-600 mb-4">{err}</div>}
                {success && <div className="text-green-600 mb-4">{success}</div>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 border-2 border-primary-600 text-white font-extrabold rounded-full shadow-lg transition-all duration-300 text-lg uppercase tracking-widest hover:from-primary-600 hover:to-primary-700 hover:shadow-xl hover:scale-105 focus:outline-none mb-4 disabled:opacity-50"
                >
                  {loading ? t('auth.verifying') : t('auth.verify_button')}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-2 text-primary-600 hover:text-primary-800 text-sm font-medium"
                >
                  {t('auth.back_button')}
                </button>
              </form>
            )}

            {/* Step 3: New Password */}
            {step === 3 && (
              <form onSubmit={handleResetPassword}>
                <div className="mb-6">
                  <label className="block text-slate-900 font-semibold mb-2">{t('auth.new_password')}</label>
                  <div className="relative">
                    <input
                      className="w-full px-4 py-3 pr-12 rounded-lg bg-white/70 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-300 text-lg"
                      type={showNewPassword ? "text" : "password"}
                      required
                      placeholder={t('auth.new_password_placeholder')}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-700"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
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
                  <label className="block text-slate-900 font-semibold mb-2">{t('auth.confirm_password')}</label>
                  <div className="relative">
                    <input
                      className="w-full px-4 py-3 pr-12 rounded-lg bg-white/70 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-300 text-lg"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder={t('auth.confirm_password_placeholder')}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
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
                {success && <div className="text-green-600 mb-4">{success}</div>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 border-2 border-primary-600 text-white font-extrabold rounded-full shadow-lg transition-all duration-300 text-lg uppercase tracking-widest hover:from-primary-600 hover:to-primary-700 hover:shadow-xl hover:scale-105 focus:outline-none mb-4 disabled:opacity-50"
                >
                  {loading ? t('auth.updating') : t('auth.update_password_button')}
                </button>
              </form>
            )}

            {/* Back to Login */}
            <div className="text-center mt-6">
              <button
                onClick={() => navigate('/login')}
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                {t('auth.back_to_login')}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
