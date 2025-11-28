import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import NavBar from '../../components/NavBar'
import Footer from '../../components/Footer'
import { backgroundImage2 } from '../../Image/image'

const ConveyorBelt = ({ cases, onCaseClick }) => {
  // Duplicate the list to create a seamless loop effect
  const extendedCases = [...cases, ...cases];

  return (
    <div className="conveyor-container h-full overflow-hidden relative">
      <div className="conveyor-belt animate-scroll-y">
        {extendedCases.map((caseItem, index) => (
          <div
            key={`${caseItem.case_id}-${index}`}
            onClick={() => onCaseClick(caseItem.case_id)}
            className="mb-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-slate-200/10 cursor-pointer transition-all duration-300 hover:bg-primary-500/20 hover:border-primary-400/50"
          >
            <p className="font-bold text-sm text-white truncate drop-shadow-sm">{caseItem.case_id.replace(/_/g, ' ').toUpperCase()}</p>
            <p className="text-xs text-slate-300 truncate">{caseItem.initial_context?.topic || caseItem.topic || 'Không có chủ đề'}</p> 
          </div>
        ))}
      </div>
      <style>
        {`
          .conveyor-container::before, .conveyor-container::after {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            height: 50px;
            z-index: 2;
          }
          .conveyor-container::before {
            top: 0;
            background: linear-gradient(to bottom, rgba(20,30,50,1), transparent);
          }
          .conveyor-container::after {
            bottom: 0;
            background: linear-gradient(to top, rgba(20,30,50,1), transparent);
          }
          @keyframes scroll-y {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }
          .animate-scroll-y {
            animation: scroll-y 40s linear infinite;
          }
        `}
      </style>
    </div>
  );
};

export default function CaseList() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const token = localStorage.getItem('token')
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:8000/api/cases')
      .then((r) => r.json())
      .then((data) => {
        setCases(data || [])
        setError(null)
      })
      .catch((err) => {
        setCases([])
        setError(err.message)
        console.error('Error loading cases:', err)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleCaseClick = (caseId) => {
    if (token) {
      navigate(`/case-runner/${caseId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <div className="flex-1 bg-slate-900 flex items-center justify-center">
          <div className="text-center text-lg text-slate-400">Đang tải danh sách tình huống...</div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <div className="flex-1 bg-slate-900 flex items-center justify-center">
          <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="bg-red-900/50 border-2 border-red-500 rounded-lg p-6 text-center">
              <p className="text-red-300 mb-2 text-xl font-bold">❌ Lỗi Tải Dữ Liệu</p>
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <div 
        className="flex-1"
        style={{
          backgroundImage: `linear-gradient(rgba(20,30,50,0.85), rgba(20,30,50,0.95)), url(${backgroundImage2})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Hero Section */}
        <section className="h-[60vh] flex flex-col items-center justify-center text-center text-white p-6 relative">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight drop-shadow-xl">
              Thư Viện Tình Huống
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-200 max-w-3xl mx-auto drop-shadow-lg">
              Rèn luyện kỹ năng, đối mặt với thử thách và leo hạng trên leaderboard. Mỗi case là một bài toán thực tế đang chờ bạn giải quyết.
            </p>
            <div className="mt-10">
              <a 
                href="#case-list-section" 
                className="inline-flex items-center gap-3 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/50 px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:bg-white hover:text-primary-600 hover:shadow-2xl"
              >
                Khám phá ngay
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* Case List Section */}
        <section id="case-list-section" className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <div className="mb-8 text-center lg:text-left">
                  <h2 className="text-4xl font-black tracking-tight text-white mb-2 drop-shadow-lg">📋 Tất cả tình huống</h2>
                  <p className="text-lg text-slate-300">Chọn một tình huống dưới đây để bắt đầu mô phỏng.</p>
                </div>

                {cases.length === 0 ? (
                  <div className="bg-slate-800/50 border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
                    <p className="text-slate-400">⚠️ Không có tình huống nào. Hãy kiểm tra lại cấu hình.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {cases.map((caseItem) => {
                      const { case_id, initial_context, topic } = caseItem;
                      const displayTopic = initial_context?.topic || topic || 'Không có chủ đề';
                      const CardContent = () => (
                        <>
                          <span className="text-xl font-bold uppercase tracking-wide text-primary-300 text-cyan-50">🏥 Case</span>
                          <h3 className="mt-3 text-xl font-bold text-white drop-shadow-md">{case_id.replace(/_/g, ' ').toUpperCase()}</h3>
                          <p className="mt-2 text-sm text-slate-300">{displayTopic}</p>
                        </>
                      );

                      if (token) {
                        return (
                          <Link
                            key={case_id}
                            to={`/case-runner/${case_id}`}
                            className="relative group block rounded-3xl border border-slate-600 bg-slate-700/60 p-6 shadow-lg transition-all duration-300 hover:border-primary-500 hover:shadow-primary-500/20 hover:-translate-y-1"
                          >
                            <CardContent />
                          </Link>
                        );
                      }
                      return (
                        <div key={case_id} className="relative group rounded-3xl border border-slate-600 bg-slate-700/60 p-6 cursor-not-allowed">
                          <CardContent />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Conveyor Belt Sidebar */}
              <div className="hidden lg:block h-[calc(100vh-250px)] sticky top-24">
                <h3 className="text-lg font-bold text-white mb-4 text-center">Tất cả Case</h3>
                <ConveyorBelt cases={cases} onCaseClick={handleCaseClick} />
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}
