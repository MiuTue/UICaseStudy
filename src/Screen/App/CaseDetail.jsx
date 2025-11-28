import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Simulator from './Simulator'
import NavBar from '../../components/NavBar'
import Footer from '../../components/Footer'

export default function CaseDetail() {
  const { caseId } = useParams()
  const [skeleton, setSkeleton] = useState(null)
  const [personas, setPersonas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('simulator')
  
  const tabs = [
    { id: 'simulator', label: '🎮 Mô phỏng', icon: '🎮' },
    { id: 'events', label: '📝 Sự kiện', icon: '📝' },
    { id: 'personas', label: '👥 Nhân vật', icon: '👥' },
  ]

  useEffect(() => {
    if (!caseId) return

    setLoading(true)
    setError(null)

    Promise.all([
      fetch(`/cases/${caseId}/skeleton.json`).then((r) => r.json()),
      fetch(`/cases/${caseId}/personas.json`).then((r) => r.json()),
    ])
      .then(([skeletonData, personasData]) => {
        setSkeleton(skeletonData)
        setPersonas(personasData.personas || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error loading case:', err)
        setError(err.message)
        setSkeleton(null)
        setPersonas([])
        setLoading(false)
      })
  }, [caseId])

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <div className="flex-1 bg-slate-100">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="text-center text-lg text-gray-600">Đang tải chi tiết tình huống...</div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !skeleton) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <div className="flex-1 bg-slate-100">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="bg-red-100 border-2 border-red-600 rounded-lg p-6">
              <Link to="/" className="text-blue-600 hover:text-blue-800 font-semibold">← Quay lại</Link>
              <p className="text-red-800 mt-2">❌ Lỗi tải tình huống: {error || 'Không tìm thấy dữ liệu'}</p>
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
      <div className="flex-1 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Link to="/" className="inline-block mb-6 text-blue-600 hover:text-blue-800 font-semibold">← Quay lại danh sách</Link>

          <div className="bg-white rounded-lg p-8 shadow-md mb-6">
            <h2 className="text-4xl font-bold text-blue-600 mb-2">🏊 {skeleton.case_id?.toUpperCase()}</h2>
            <p className="text-xl font-semibold text-gray-700 mb-2">{skeleton.title}</p>
            {skeleton.description && (
              <p className="text-gray-600 italic">{skeleton.description}</p>
            )}
          </div>

          <div className="flex gap-2 mb-6 border-b-2 border-gray-300">
            {[
              { id: 'simulator', label: '🎮 Mô phỏng' },
              { id: 'events', label: '📝 Sự kiện' },
              { id: 'personas', label: '👥 Nhân vật' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-semibold border-b-4 transition-all ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 border-transparent hover:text-blue-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {activeTab === 'simulator' && (
              <section className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-2xl font-bold text-blue-600 mb-4">🎮 Mô phỏng Tương tac</h3>
                <Simulator skeleton={skeleton} personas={personas} />
              </section>
            )}

            {activeTab === 'events' && (
              <section className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-2xl font-bold text-blue-600 mb-4">📝 Danh sách Sự kiện Chính</h3>
                {skeleton.canon_events && skeleton.canon_events.length > 0 ? (
                  <div className="space-y-4">
                    {skeleton.canon_events.map((event, idx) => (
                      <div key={event.id || idx} className="bg-gray-50 border-l-4 border-blue-600 rounded p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-lg font-bold text-blue-600">{event.id} — {event.title}</h4>
                          <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-semibold">⏱️ {event.timeout_turn} lượt</span>
                        </div>
                        <p className="text-gray-700 mb-3">{event.description}</p>
                        
                        {event.success_criteria && event.success_criteria.length > 0 && (
                          <div className="mb-3 bg-white p-3 rounded">
                            <strong className="text-blue-600">✅ Tiêu chí thành công:</strong>
                            <ul className="list-disc list-inside mt-2 ml-2 space-y-1">
                              {event.success_criteria.map((criterion, i) => (
                                <li key={i} className="text-gray-700 text-sm">{criterion}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {event.actions && event.actions.length > 0 && (
                          <div className="bg-white p-3 rounded">
                            <strong className="text-blue-600">⚡ Hành động có thể thực hiện:</strong>
                            <ul className="list-disc list-inside mt-2 ml-2 space-y-1">
                              {event.actions.map((action, i) => (
                                <li key={i} className="text-gray-700 text-sm">{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Không có sự kiện nào được xác định.</p>
                )}
              </section>
            )}

            {activeTab === 'personas' && (
              <section className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-2xl font-bold text-blue-600 mb-4">👥 Nhân vật tham gia</h3>
                {personas.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {personas.map((persona) => (
                      <div key={persona.id} className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 hover:border-blue-600 transition-all">
                        <div className="border-b-2 border-gray-300 pb-3 mb-3">
                          <h4 className="text-lg font-bold text-blue-600">{persona.name}</h4>
                          <span className="inline-block bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold mt-1">{persona.role}</span>
                        </div>
                        
                        <div className="mb-3 space-y-1 text-sm">
                          <p><strong>Tuổi:</strong> {persona.age}</p>
                          <p><strong>Giới tính:</strong> {persona.gender}</p>
                        </div>

                        <div className="mb-3 space-y-2 text-sm">
                          <p><strong>Nền tảng:</strong> {persona.background}</p>
                          <p><strong>Tính cách:</strong> {persona.personality}</p>
                          <p><strong>Mục tiêu:</strong> {persona.goal}</p>
                        </div>

                        <div className="pt-3 border-t-2 border-gray-300">
                          <strong className="text-sm">Cảm xúc:</strong>
                          <div className="flex gap-2 flex-wrap mt-2">
                            <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs">{persona.emotion_init}</span>
                            {persona.emotion_end && (
                              <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">→ {persona.emotion_end}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Không có thông tin nhân vật.</p>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
