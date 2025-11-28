import React, { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";
import { backgroundImage } from "../../Image/image";

const ChatMessage = ({ message, personas }) => {
  const isUser = message.sender === "user";
  const isSystem = message.sender === "system";

  // Tìm thông tin persona nếu người gửi là một persona (ví dụ: 'P1', 'P3')
  const persona = !isUser && !isSystem ? personas.find(p => p.id === message.sender) : null;

  // Xác định tên và màu sắc của người gửi
  const senderName = isUser ? "Bạn" : (persona ? persona.name : "Hệ thống");
  const senderRole = persona ? persona.role : null;

  const getSenderColor = (sender) => {
    if (sender === 'user') return 'bg-blue-100 text-blue-800';
    if (sender === 'system') return 'bg-slate-100 text-slate-800';
    if (sender.startsWith('P')) {
      const personaIdNum = parseInt(sender.replace('P', ''), 10);
      const colors = ['bg-emerald-100 text-emerald-800', 'bg-amber-100 text-amber-800', 'bg-violet-100 text-violet-800', 'bg-rose-100 text-rose-800'];
      return colors[(personaIdNum - 1) % colors.length];
    }
    return 'bg-slate-100 text-slate-800';
  };

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} transition-all duration-300`}
      style={{
        transform: 'translateY(-8px)',
        animation: 'slide-up-fade-in 0.25s cubic-bezier(0.4,0,0.2,1)'
      }}
    >
      <div
        className={`max-w-lg rounded-2xl px-4 py-2.5 ${
          getSenderColor(message.sender)
        }`}
      >
        <p className="text-sm font-semibold">{senderName}</p>
        {senderRole && <p className="text-xs opacity-70 -mt-0.5 mb-1">{senderRole}</p>}
        
        <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
      </div>
      {/* Animation CSS (can move into global styles) */}
      <style>
        {`
          @keyframes slide-up-fade-in {
            from {
              opacity: 0;
              transform: translateY(32px);
            }
            to {
              opacity: 1;
              transform: translateY(-8px);
            }
          }
        `}
      </style>
    </div>
  );
};

export default function CaseRunner() {
  const { caseId } = useParams();
  const [caseData, setCaseData] = useState({
    skeleton: null,
    personas: null,
    context: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("skeleton");
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [turn, setTurn] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionState, setSessionState] = useState(null);
  const hasFetched = useRef(false); // Thêm một ref để theo dõi việc fetch

  useEffect(() => {
    // Chỉ chạy nếu caseId tồn tại và chưa fetch lần nào
    if (!caseId || hasFetched.current) return;

    setLoading(true);
    setError(null);
    
    // Đánh dấu là đã bắt đầu fetch
    hasFetched.current = true;

    // Gọi API để lấy dữ liệu case từ backend
    fetch(`http://localhost:8000/api/cases/${caseId}`)
      .then(res => res.json())
      .then(({ skeleton, personas, context }) => {
        // 1. Cập nhật state với dữ liệu case vừa lấy được
        setCaseData({ skeleton, personas, context });
        setLoading(false);
        console.log('Case data loaded:', { skeleton, personas, context });
        // 2. Gửi yêu cầu POST để bắt đầu session
        const startSessionPayload = {
          case_id: caseId,
          user_action: "Bắt đầu nhiệm vụ.",
        };

        fetch('http://localhost:9000/api/agent/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(startSessionPayload),
        })
        .then(response => response.json())
        .then(sessionData => {
          console.log('Session started successfully:', sessionData);
          // 3. Lưu session_id và state trả về từ API
          setSessionId(sessionData.session_id);
          setSessionState(sessionData.state);

          // 4. Hiển thị tin nhắn từ dialogue_history
          if (sessionData.state && Array.isArray(sessionData.state.dialogue_history)) {
            // Lấy object active_personas từ state và chuyển thành mảng
            const activePersonasObject = sessionData.state.active_personas || {};
            const allActivePersonas = Object.values(activePersonasObject);
            const initialMessages = sessionData.state.dialogue_history.map((dialogue, index) => {
              let senderId = 'system'; // Mặc định là hệ thống
              if (dialogue.speaker === 'user') {
                senderId = 'user';
              } else {
                // Tìm persona ID dựa trên tên của speaker
                const foundPersona = allActivePersonas.find(p => p.name === dialogue.speaker);
                if (foundPersona) {
                  senderId = foundPersona.id;
                }
              }
              return {
                id: Date.now() + index,
                sender: senderId,
                text: dialogue.content,
              };
            });
            setMessages(initialMessages);
          }
        })
        .catch(sessionError => {
          console.error('Error starting session:', sessionError);
          // Xử lý lỗi khi không thể bắt đầu session, ví dụ hiển thị thông báo cho người dùng
        });
      })
      .catch((err) => {
        setCaseData({ skeleton: null, personas: null, context: null });
        setError("Không thể tải dữ liệu cho case này. " + err.message);
        setLoading(false);
      });
  }, [caseId]);

  // Đọc văn bản bằng SpeechSynthesis (đọc doc)
  const handleReadDoc = () => {
    if (userInput) {
      const synth = window.speechSynthesis;
      if (synth.speaking) synth.cancel();
      const utter = new window.SpeechSynthesisUtterance(userInput);
      synth.speak(utter);
    }
  };

  // Ghi âm giọng nói và chuyển thành văn bản (SpeechRecognition)
  // Lưu ý: Chỉ đơn giản dùng Web Speech API
  const handleRecord = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Trình duyệt không hỗ trợ ghi âm giọng nói");
      return;
    }

    if (isListening) {
      setIsListening(false);
      if (window.recognitionInstance) {
        window.recognitionInstance.stop();
      }
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    window.recognitionInstance = recognition;
    recognition.lang = "vi-VN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      // optional: handle error
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognition.onresult = (event) => {
      setIsListening(false);
      if (event.results && event.results[0] && event.results[0][0]) {
        setUserInput((prev) => prev + (prev ? " " : "") + event.results[0][0].transcript);
      }
    };

    recognition.start();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    // Không gửi nếu không có nội dung hoặc chưa có session
    if (!userInput.trim() || !sessionId) return;

    const currentInput = userInput;
    const newUserMessage = {
      id: Date.now(),
      sender: "user",
      text: currentInput,
    };

    // 1. Cập nhật giao diện ngay lập tức với tin nhắn của người dùng
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setUserInput("");

    // 2. Chuẩn bị và gửi payload lên API
    const payload = {
      session_id: sessionId,
      user_input: currentInput,
    };

    try {
      const response = await fetch(`http://localhost:9000/api/agent/sessions/${sessionId}/turn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      const newSessionData = await response.json();
      console.log('Received new session data:', newSessionData);

      // 3. Cập nhật lại state với dữ liệu mới từ API
      setSessionState(newSessionData.state);

      // 4. Cập nhật lại toàn bộ lịch sử chat từ `dialogue_history` mới
      if (newSessionData.state && Array.isArray(newSessionData.state.dialogue_history)) {
        updateMessagesFromHistory(newSessionData.state.dialogue_history, newSessionData.state.active_personas);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Có thể thêm một tin nhắn lỗi vào chat để thông báo cho người dùng
      const errorMessage = { id: Date.now() + 1, sender: 'system', text: `Lỗi: Không thể gửi tin nhắn. ${error.message}` };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <div className="flex-1 bg-slate-100">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="text-center text-lg text-gray-600">Đang tải dữ liệu case...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Tách logic cập nhật tin nhắn ra một hàm riêng để tái sử dụng
  const updateMessagesFromHistory = (dialogueHistory, activePersonas) => {
    const activePersonasObject = activePersonas || {};
    const allActivePersonas = Object.values(activePersonasObject);

    const newMessages = dialogueHistory.map((dialogue, index) => {
      let senderId = 'system';
      if (dialogue.speaker === 'user') {
        senderId = 'user';
      } else {
        const foundPersona = allActivePersonas.find(p => p.name === dialogue.speaker);
        if (foundPersona) {
          senderId = foundPersona.id;
        }
      }
      return {
        id: `hist-${Date.now()}-${index}`, // Tạo ID duy nhất
        sender: senderId,
        text: dialogue.content,
      };
    });
    setMessages(newMessages);
  };

  if (error || !caseData.skeleton) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <div className="flex-1 bg-slate-100">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="bg-red-100 border-2 border-red-600 rounded-lg p-6">
              <p className="text-red-800 mb-2">❌ Lỗi: {error || "Case không tồn tại"}</p>
              <Link to="/case-list" className="text-primary-600 font-bold">⬅️ Quay lại Danh sách Case</Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      <NavBar />
      <main className="flex-1">
        <div className="grid h-full grid-cols-1 lg:grid-cols-3">
          {/* Left: Chat Panel */}
          <div className="flex h-[calc(100vh-80px)] flex-col border-r border-slate-200 bg-white lg:col-span-2">
            <header className="border-b border-slate-200 px-3 py-2 bg-slate-100 rounded-lg mx-4 my-2">
              <h1 className="text-xl font-bold text-slate-900">
                Case: {caseData.skeleton.title}
              </h1>
              <p className="text-sm text-slate-500">
                ID: {caseData.skeleton.case_id}
              </p>
            </header>
            <div className="flex-1 space-y-6 overflow-y-auto p-6"
                 style={{
                          backgroundImage: `url(${backgroundImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                        }}
            >
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} personas={caseData.personas?.personas || []} />
              ))}
            </div>
            <div className="border-t border-slate-200 bg-white p-4">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <textarea
                  rows="1"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Nhập hành động hoặc nội dung trả lời..."
                  className="flex-1 resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
                <button
                  type="button"
                  title="Ghi âm"
                  className={`rounded-full bg-slate-200 p-2 transition hover:bg-slate-300 flex items-center ${isListening ? "animate-pulse bg-primary-200" : ""}`}
                  onClick={handleRecord}
                >
                  {/* Microphone Material Design icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5.5-3a.75.75 0 0 0-1.5 0 5 5 0 0 1-10 0 .75.75 0 1 0-1.5 0 6.5 6.5 0 0 0 6 6.48V21h-2a.75.75 0 0 0 0 1.5h5a.75.75 0 0 0 0-1.5h-2v-2.52a6.5 6.5 0 0 0 6-6.48z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  title="Đọc nội dung"
                  className="rounded-full bg-slate-200 p-2 transition hover:bg-slate-300 flex items-center"
                  onClick={handleReadDoc}
                >
                  {/* Speaker/Volume Material Design icon */}
                  <svg xmlns="http://www.w3.org/2000/svg"  className="h-6 w-6 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v2.18c.61.57 1 1.37 1 2.25s-.39 1.68-1 2.25v2.18c1.48-.74 2.5-2.26 2.5-4.03zm2.5 0c0 2.89-2.09 5.28-4.95 5.7a.75.75 0 1 1-.13-1.5c2.06-.34 3.58-2.16 3.58-4.2s-1.52-3.86-3.58-4.2a.75.75 0 0 1 .12-1.5C17.91 6.22 20 8.61 20 11.5z"/>
                  </svg>
                </button>
                <button
                  type="submit"
                  disabled={!userInput.trim()}
                  className="rounded-full bg-primary-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:cursor-not-allowed disabled:bg-primary-300"
                >
                  Gửi
                </button>
              </form>
            </div>
          </div>

          {/* Right: Scene Summary Panel */}
          <div className="hidden h-[calc(100vh-80px)] flex-col overflow-y-auto bg-gradient-to-b from-white via-slate-50 to-slate-100 p-6 lg:flex">
            <div className="space-y-6">
              {/* Scene Summary Section */}
              <section className="rounded-2xl border border-primary-100 bg-white shadow-xl p-6 mb-2 flex flex-col">
                <h2 className="text-lg font-extrabold text-primary-600 flex items-center gap-2 mb-3">
                  <span className="inline-block w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
                  Tóm tắt bối cảnh
                </h2>
                {sessionState && sessionState.scene_summary ? (
                  <div className="bg-slate-50 rounded-lg p-4 text-slate-700 text-base leading-relaxed shadow-inner">
                    {sessionState.scene_summary}
                  </div>
                ) : (
                  <div className="flex items-center justify-center min-h-[85px]">
                    <svg className="animate-spin h-6 w-6 text-primary-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                    </svg>
                    <span className="text-primary-400 font-semibold">Đang tải tóm tắt bối cảnh...</span>
                  </div>
                )}
              </section>

              {/* Tabs Section - Only Checklist & AI Facilitator */}
              <section>
                <div
                  className="relative bg-gradient-to-br from-primary-50 via-primary-100 to-slate-100 rounded-2xl p-[2px] shadow-lg mb-6"
                  style={{ boxShadow: '0 6px 24px rgba(80,120,230,0.08)' }}
                >
                  <div className="rounded-2xl bg-white/95 p-6">
                    <h2 className="text-xl font-bold text-primary-700 mb-4 ">Phiên làm việc</h2>
                    <div className="flex gap-2 border-b border-slate-200">
                      {[
                        { key: "skeleton", label: "Checklist" }, 
                        { key: "ai", label: "AI Facilitator" }
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
                            activeTab === tab.key
                              ? "border-primary-500 text-primary-600"
                              : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 rounded-xl bg-gradient-to-br from-primary-50 via-white to-slate-100 p-[2px]">
                      <div className="rounded-xl bg-white p-4 shadow-inner">
                        {activeTab === "skeleton" && (
                          <div className="space-y-3">
                            <h3 className="font-semibold text-slate-900">
                              Checklist
                            </h3>
                            <ul className="space-y-2">
                              {sessionState && sessionState.current_event && (
                                <div className="rounded-lg bg-slate-50 p-3 border border-primary-100">
                                  <p className="font-bold text-slate-800 text-lg">
                                    Sự kiện hiện tại: {sessionState.current_event}
                                  </p>
                                  {sessionState.event_summary?.remaining_success_criteria && (
                                    <div className="mt-2">
                                      <p className="text-xl font-bold text-slate-600 mb-1">Tiêu chí cần hoàn thành:</p>
                                      <ul className="list-disc list-inside space-y-1 pl-1">
                                        {sessionState.event_summary.remaining_success_criteria.map((criterion, index) => (
                                          <li key={index} className="text-x text-slate-700">{criterion.description}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                            </ul>
                            {!sessionState && <p className="text-xs text-slate-500 italic">Đang chờ dữ liệu session...</p>}
                          </div>
                        )}
                        {activeTab === "ai" && (
                          <div className="space-y-3">
                            <h3 className="font-semibold text-slate-900">
                              AI Facilitator
                            </h3>
                            <div className="bg-slate-50 rounded-lg p-4 text-slate-700 text-base leading-relaxed shadow-inner min-h-[64px] border border-primary-100">
                              {/* Hiện tại đặt biến giả để đỡ lỗi */}
                              {sessionState && sessionState?.ai_reply
                                  ? (<span style={{ whiteSpace: 'pre-wrap' }}>{sessionState.ai_reply}</span>)
                                  : (<span className="text-slate-400 italic">Chưa có phản hồi AI nào.</span>)
                              }
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      {/* Footer is omitted for a full-height chat UI, but can be added back if needed */}
    </div>
  );
}