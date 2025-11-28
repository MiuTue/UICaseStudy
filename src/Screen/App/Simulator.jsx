import React, { useState } from 'react'

export default function Simulator({ skeleton, personas = [] }) {
  const [currentEventIndex, setCurrentEventIndex] = useState(0)
  const [log, setLog] = useState([])
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const events = skeleton.canon_events || []
  const currentEvent = events[currentEventIndex]

  const handleAction = (actionText, isSuccess = true) => {
    if (!currentEvent) return

    const timestamp = new Date().toLocaleTimeString('vi-VN')
    const entry = {
      id: log.length,
      timestamp,
      eventId: currentEvent.id,
      eventTitle: currentEvent.title,
      action: actionText,
      success: isSuccess,
    }

    setLog([entry, ...log])

    if (isSuccess) {
      setScore(score + 10)
    }

    // Move to next event
    if (currentEvent.on_success && isSuccess) {
      const nextIndex = events.findIndex((e) => e.id === currentEvent.on_success)
      if (nextIndex >= 0) {
        setCurrentEventIndex(nextIndex)
      } else {
        setFinished(true)
      }
    } else if (currentEventIndex < events.length - 1) {
      setCurrentEventIndex(currentEventIndex + 1)
    } else {
      setFinished(true)
    }
  }

  const resetSimulation = () => {
    setCurrentEventIndex(0)
    setLog([])
    setScore(0)
    setFinished(false)
  }

  if (events.length === 0) {
    return (
      <div className="bg-red-50 p-4 rounded">
        <p className="text-red-600">❌ Không có sự kiện trong tình huống này.</p>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-gray-50 border-l-4 border-blue-600 rounded p-6">
          <h4 className="text-2xl font-bold text-green-600 mb-4">✅ Mô phỏng kết thúc</h4>
          <p className="text-gray-700 mb-4">Bạn đã hoàn thành tất cả các sự kiện!</p>
          <p className="text-3xl font-bold text-green-600 mb-6">📊 Điểm cuối cùng: {score}</p>
          <button onClick={resetSimulation} className="btn btn-primary">🔄 Bắt đầu lại</button>
        </div>

        <div className="bg-white border-2 border-gray-300 rounded-lg p-4 h-fit sticky top-4">
          <h4 className="text-lg font-bold text-blue-600 mb-3">📋 Nhật ký hoạt động</h4>
          <div className="max-h-96 overflow-y-auto">
            {log.length === 0 ? (
              <div className="text-center text-gray-500 py-4">Không có hoạt động nào</div>
            ) : (
              <ul className="space-y-2">
                {log.map((entry) => (
                  <li key={entry.id} className={`px-2 py-2 rounded text-xs ${entry.success ? 'log-item-success' : 'log-item-failed'}`}>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-bold">{entry.success ? '✅' : '❌'}</span>
                      <span className="font-semibold text-blue-600">{entry.eventId}</span>
                      <span className="flex-1">{entry.action}</span>
                      <span className="text-gray-500 text-xs">{entry.timestamp}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 bg-gray-50 border-l-4 border-blue-600 rounded p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-700">
              Sự kiện {currentEventIndex + 1} / {events.length}
            </span>
            <span className="text-gray-600 text-sm">{Math.round(((currentEventIndex + 1) / events.length) * 100)}%</span>
          </div>
          <div className="w-full h-3 bg-gray-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 transition-all duration-300"
              style={{
                width: `${((currentEventIndex + 1) / events.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        <h4 className="text-2xl font-bold text-gray-900 mb-3">⚠️ {currentEvent.title}</h4>
        <p className="text-gray-700 mb-4 leading-relaxed">{currentEvent.description}</p>

        {currentEvent.timeout_turn && (
          <div className="bg-orange-500 text-white px-4 py-3 rounded mb-4 font-semibold">
            ⏱️ Thời gian: {currentEvent.timeout_turn} lượt
          </div>
        )}

        {currentEvent.success_criteria && (
          <div className="bg-white p-4 rounded mb-4 border-l-4 border-blue-600">
            <strong className="text-blue-600">✅ Tiêu chí thành công:</strong>
            <ul className="list-disc list-inside mt-2 ml-2 space-y-1">
              {currentEvent.success_criteria.map((criterion, i) => (
                <li key={i} className="text-gray-700 text-sm">{criterion}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white p-4 rounded mb-4 border-l-4 border-blue-600">
          <strong className="text-blue-600">⚡ Hành động:</strong>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {currentEvent.actions ? (
              currentEvent.actions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleAction(action, true)}
                  className="btn btn-success w-full text-left"
                >
                  ✅ {action}
                </button>
              ))
            ) : (
              <button
                onClick={() => handleAction('Thực hiện hành động đúng', true)}
                className="btn btn-success"
              >
                ✅ Thực hiện hành động
              </button>
            )}
            <button
              onClick={() => handleAction('Không hành động', false)}
              className="btn btn-danger w-full"
            >
              ❌ Bỏ qua
            </button>
          </div>
        </div>

        <div className="bg-blue-600 text-white px-6 py-4 rounded text-center">
          <span className="text-lg">📊 Điểm hiện tại: </span>
          <span className="text-3xl font-bold">{score}</span>
        </div>
      </div>

      <div className="bg-white border-2 border-gray-300 rounded-lg p-4 h-fit sticky top-4">
        <h4 className="text-lg font-bold text-blue-600 mb-3">📋 Nhật ký hoạt động</h4>
        <div className="max-h-96 overflow-y-auto">
          {log.length === 0 ? (
            <div className="text-center text-gray-500 py-4">Bắt đầu mô phỏng...</div>
          ) : (
            <ul className="space-y-2">
              {log.map((entry) => (
                <li key={entry.id} className={`px-2 py-2 rounded text-xs ${entry.success ? 'log-item-success' : 'log-item-failed'}`}>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="font-bold">{entry.success ? '✅' : '❌'}</span>
                    <span className="font-semibold text-blue-600">{entry.eventId}</span>
                    <span className="flex-1">{entry.action}</span>
                    <span className="text-gray-500 text-xs">{entry.timestamp}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
