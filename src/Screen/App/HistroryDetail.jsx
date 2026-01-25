import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { backgroundImage2 } from '../../Image/image';

// Lấy component ChatMessage từ CaseRunner.jsx hoặc tạo một file riêng
// Ở đây, chúng ta định nghĩa lại để tiện sử dụng
const ChatMessage = ({ message }) => {
  const { t } = useTranslation();
  const isUser = message.sender === "user";
  const getSenderColor = (sender) => {
    if (sender === 'user') return 'bg-primary-600 text-white';
    if (sender === 'system') return 'bg-slate-700 text-slate-200';
    // Thêm các màu khác cho persona nếu cần
    return 'bg-slate-600 text-white';
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-lg rounded-2xl px-4 py-2.5 ${getSenderColor(message.sender)}`}>
        <p className="text-sm font-semibold">{message.speakerName || (isUser ? t('history_detail.you') : t('history_detail.system'))}</p>
        <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
      </div>
    </div>
  );
};

export default function HistoryDetail() {
  const { sessionId } = useParams();
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    async function fetchHistoryDetail() {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:8000/api/sessions/history/${sessionId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || t('history_detail.error_loading', { error: '' }));
        }
        const data = await res.json();
        setHistory(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchHistoryDetail();
  }, [sessionId, t]);

  if (loading) {
    return <div className="text-center text-white text-lg p-10">{t('history_detail.loading')}</div>;
  }

  if (error) {
    return <div className="text-center text-red-400 text-lg p-10">{t('user.error')}: {error}</div>;
  }

  if (!history) {
    return <div className="text-center text-white text-lg p-10">{t('history_detail.no_data')}</div>;
  }

  // Lấy chi tiết điểm từ eventScores đã được lưu
  const eventScores = history.finalState?.eventScores || {};
  const detailedScores = Object.values(eventScores).flatMap(event => event.scores || []);
  // Loại bỏ các mục trùng lặp dựa trên 'criterion' để hiển thị danh sách duy nhất
  const uniqueDetailedScores = Array.from(new Map(detailedScores.map(item => [item.criterion, item])).values());

  return (
    <main className="min-h-screen text-slate-200"
      style={{
        backgroundImage: `linear-gradient(rgba(20,30,50,0.9), rgba(20,30,50,0.95)), url(${backgroundImage2})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <header className="mb-8">
          <Link to="/user" className="text-primary-400 hover:text-primary-300 mb-4 inline-block">
            &larr; {t('history_detail.back_to_dashboard')}
          </Link>
          <h1 className="text-3xl font-bold text-white">{t('history_detail.case_detail', { id: history.caseId })}</h1>
          <p className="text-slate-400">{t('history_detail.session_id', { id: history.sessionId })}</p>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Left: Chat History */}
          <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-2xl flex flex-col h-[100vh]">
            <h2 className="text-xl font-bold text-white p-4 border-b border-slate-700">{t('history_detail.chat_log')}</h2>
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {history.messages.map((msg, index) => (
                <ChatMessage key={`${msg.sender}-${index}`} message={msg} />
              ))}
            </div>
          </div>

          {/* Right: Score & Summary */}
          <div className="space-y-8">
            <section className="rounded-2xl border border-emerald-700 bg-gradient-to-br from-slate-800/50 to-emerald-900/30 p-6">
              <h2 className="text-lg font-bold text-white mb-3">{t('history_detail.final_score')}</h2>
              <div className="text-center">
                <div className="text-6xl font-extrabold text-emerald-400">{history.finalScore}</div>
                <p className="text-slate-400 mt-1">{t('history_detail.score_out_of_5')}</p>
              </div>
            </section>

            {/* --- PHẦN MỚI: HIỂN THỊ CHI TIẾT ĐIỂM VÀ ANALYSIS --- */}
            {uniqueDetailedScores.length > 0 && (
              <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
                <h2 className="text-lg font-bold text-white mb-4">{t('history_detail.score_analysis')}</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {uniqueDetailedScores.map((criterion, idx) => (
                    <div key={idx} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-slate-300 text-sm font-medium flex-1">
                          {criterion.criterion}
                        </span>
                        <span className={`text-sm font-bold ml-2 ${(criterion.score || 0) >= 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {criterion.score}/5
                        </span>
                      </div>
                      {criterion.analysis && (
                        <p className="text-slate-400 text-xs mt-1 italic border-l-2 border-slate-600 pl-2">
                          💡 {criterion.analysis}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
              <h2 className="text-lg font-bold text-white mb-3">{t('history_detail.final_context_summary')}</h2>
              <div className="bg-slate-900/50 rounded-lg p-4 text-sm text-slate-300 leading-relaxed max-h-96 overflow-y-auto">
                <p style={{ whiteSpace: 'pre-wrap' }}>
                  {history.finalState?.scene_summary || t('history_detail.no_summary')}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
