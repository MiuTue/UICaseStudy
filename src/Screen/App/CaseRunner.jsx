import React, { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import Footer from "../../components/Footer";
import { backgroundImage } from "../../Image/image";
import { backgroundImage2 } from "../../Image/image"; // Import ảnh nền mới
import { firestore } from "../../config/firebase";
import { doc, getDoc } from "firebase/firestore";

const ChatMessage = ({ message, personas }) => {
  const isUser = message.sender === "user";
  const isSystem = message.sender === "system";

  // Tìm thông tin persona nếu người gửi là một persona (ví dụ: 'P1', 'P3')
  const persona = !isUser && !isSystem ? personas.find(p => p.id === message.sender) : null;

  // Xác định tên và màu sắc của người gửi
  const senderName = isUser ? "Bạn" : (persona ? persona.name : (message.speakerName || "Hệ thống"));
  const senderRole = persona ? persona.role : null;

  const getSenderColor = (sender) => {
    if (sender === 'user') return 'bg-primary-600 text-white';
    if (sender === 'system') return 'bg-slate-700 text-slate-200';
    if (sender.startsWith('P')) {
      const personaIdNum = parseInt(sender.replace('P', ''), 10);
      const colors = ['bg-emerald-600 text-white', 'bg-amber-600 text-white', 'bg-violet-600 text-white', 'bg-rose-600 text-white'];
      return colors[(personaIdNum - 1) % colors.length] || 'bg-slate-600 text-white';
    }
    return 'bg-slate-100 text-slate-800';
  };

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} transition-all duration-300`}
      style={{ animation: 'slide-up-fade-in 0.4s cubic-bezier(0.4,0,0.2,1) forwards' }}
    >
      <div
        className={`max-w-lg rounded-2xl px-4 py-2.5 ${getSenderColor(message.sender)
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
              transform: translateY(16px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
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
  const [isResponding, setIsResponding] = useState(false); // State cho hiệu ứng typing
  const [sessionId, setSessionId] = useState(null);
  const [sessionState, setSessionState] = useState(null);
  const hasFetched = useRef(false); // Thêm một ref để theo dõi việc fetch
  const [backgroundUrl, setBackgroundUrl] = useState(backgroundImage); // State cho ảnh nền
  const hasSavedHistory = useRef(false); // Ref để đảm bảo chỉ lưu lịch sử một lần

  // State lưu điểm và phân tích theo từng event
  // eventScores = { "CE1": { score: 5, scores: [...], analysis: [...] }, "CE2": { ... } }
  const [cumulativeScore, setCumulativeScore] = useState(0); // State mới để cộng dồn điểm
  const [eventScores, setEventScores] = useState({});
  const previousEventRef = useRef(null); // Theo dõi event trước đó để phát hiện event hoàn thành

  useEffect(() => {
    // Chỉ chạy nếu caseId tồn tại và chưa fetch lần nào
    if (!caseId || hasFetched.current) return;

    setLoading(true);
    setError(null);

    // Đánh dấu là đã bắt đầu fetch
    hasFetched.current = true;

    // Lấy ảnh nền từ Firestore
    const fetchBackground = async () => {
      try {
        const backgroundDocRef = doc(firestore, "backgrounds", caseId);
        const docSnap = await getDoc(backgroundDocRef);
        if (docSnap.exists() && docSnap.data().background_image_url) {
          setBackgroundUrl(docSnap.data().background_image_url);
        } else {
          setBackgroundUrl(backgroundImage); // Dùng ảnh mặc định nếu không có
        }
      } catch (bgError) {
        console.error("Error fetching background image:", bgError);
        setBackgroundUrl(backgroundImage); // Dùng ảnh mặc định nếu lỗi
      }
    };
    fetchBackground();
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
          // Khởi tạo lazy để không chấm điểm ngay; skip_tts để tăng tốc
          lazy_init: true,
          skip_tts: true,
          // Lời mở đầu tùy chọn gửi cho backend (không dùng để chấm điểm khi lazy_init=true)
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

            // Khởi tạo previousEventRef với event đầu tiên
            if (sessionData.state?.current_event) {
              previousEventRef.current = sessionData.state.current_event;
            }

            // 4. Hiển thị tin nhắn từ dialogue_history
            if (sessionData.state && Array.isArray(sessionData.state.dialogue_history)) {
              // Lấy object active_personas từ state và chuyển thành mảng
              const activePersonasObject = sessionData.state.active_personas || {};
              const allActivePersonas = Object.values(activePersonasObject);
              const initialMessages = sessionData.state.dialogue_history.map((dialogue, index) => {
                let senderId = 'system';
                let speakerName = dialogue.speaker; // Lưu lại tên gốc
                if (dialogue.speaker === 'user') {
                  senderId = 'user';
                } else {
                  // Tìm persona ID dựa trên tên của speaker
                  const foundPersona = allActivePersonas.find(p => p.name === dialogue.speaker);
                  if (foundPersona) {
                    senderId = foundPersona.id;
                  } else {
                    // Nếu không tìm thấy trong active_personas, vẫn giữ tên speaker và dùng màu hệ thống
                    senderId = 'system';
                  }
                }
                return {
                  id: Date.now() + index,
                  sender: senderId,
                  text: dialogue.content,
                  speakerName: speakerName, // Truyền tên speaker vào message object
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

  // Kiểm tra nếu session đã kết thúc (kết hợp 2 điều kiện)
  const isFinished = (() => {
    if (!sessionState) return false;

    // Điều kiện 1: Agent báo kết thúc (không còn event hiện tại)
    const agentFinished = !sessionState.current_event;
    if (agentFinished) return true;

    // Điều kiện 2: Tất cả các canon events đều đã "pass"
    const canonEvents = caseData?.skeleton?.canon_events;
    const eventSummary = sessionState?.event_summary;

    // --- DEBUG LOGGING ---
    console.log("--- Checking isFinished ---");
    console.log("Agent finished?", agentFinished);
    console.log("Canon Events from caseData:", canonEvents);
    console.log("Event Summary from sessionState:", eventSummary);
    // --- END DEBUG LOGGING ---

    if (!Array.isArray(canonEvents) || canonEvents.length === 0 || typeof eventSummary !== 'object' || eventSummary === null) {
      return false;
    }

    // Lấy sự kiện cuối cùng từ danh sách canon_events
    const lastEvent = canonEvents[canonEvents.length - 1];
    if (!lastEvent) return false;

    // Lấy ID của sự kiện cuối cùng (linh hoạt với cấu trúc object hoặc string)
    const lastEventId = typeof lastEvent === 'string' ? lastEvent : lastEvent?.id;
    if (!lastEventId) return false;

    // Kiểm tra trạng thái của sự kiện cuối cùng
    const lastEventStatus = eventSummary[lastEventId];
    const isLastEventPassed = lastEventStatus === 'pass';
    console.log(`Checking last event: '${lastEventId}', Status: '${lastEventStatus}', Result: ${isLastEventPassed}`);

    return isLastEventPassed;
  })();

  // useEffect để lưu lịch sử chat khi session kết thúc
  useEffect(() => {
    // Chỉ thực hiện khi session đã kết thúc và chưa được lưu
    if (isFinished && !hasSavedHistory.current && sessionId) {
      hasSavedHistory.current = true; // Đánh dấu là đã bắt đầu lưu để tránh gọi lại

      const token = localStorage.getItem('token');
      if (!token) {
        console.log("Chưa đăng nhập, không thể lưu lịch sử.");
        return;
      }

      const { score, eventScores: finalEventScores } = calculateResult(); // Lấy điểm số cuối cùng và chi tiết event

      const historyPayload = {
        sessionId: sessionId,
        caseId: caseId,
        messages: messages,
        finalScore: score,
        finalState: { ...sessionState, eventScores: finalEventScores }, // Gộp eventScores vào finalState
      };

      console.log("Đang lưu lịch sử trò chuyện:", historyPayload);

      fetch('http://localhost:8000/api/sessions/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(historyPayload)
      })
        .then(res => res.json())
        .then(data => console.log('Lưu lịch sử thành công:', data))
        .catch(err => console.error('Lỗi khi lưu lịch sử trò chuyện:', err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished, sessionState, sessionId, caseId, messages]); // Thêm isFinished vào dependencies

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
    setIsResponding(true); // Bật hiệu ứng typing

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
        // Cố gắng đọc nội dung lỗi từ response để debug
        const errorBody = await response.text();
        console.error("API Error Body:", errorBody);
        throw new Error(`API call failed with status: ${response.status}. Body: ${errorBody}`);
      }

      const newSessionData = await response.json();
      console.log('Received new session data:', newSessionData);

      // 3. Cập nhật lại state với dữ liệu mới từ API
      setSessionState(newSessionData.state);

      // 4. Lưu điểm và phân tích theo event (cập nhật mỗi lần nhận response)
      if (newSessionData.state) {
        const state = newSessionData.state;
        const lastScore = state.event_summary?.last_score;
        const eventForScore = previousEventRef.current; // Điểm thường dành cho event trước đó

        // Nếu có last_score và biết event nào đã được chấm điểm
        if (lastScore && eventForScore) {
          // Cộng dồn vào tổng điểm
          setCumulativeScore(prevScore => prevScore + lastScore);
          console.log(`Added ${lastScore} to score for event ${eventForScore}.`);

          // Cập nhật điểm cho event cụ thể trong eventScores
          setEventScores(prev => {
            const existingScore = prev[eventForScore]?.score || 0;
            const newEventScore = lastScore; // Điểm của event là điểm lần chấm cuối cùng
            // Lấy chi tiết scores từ event_summary
            const detailedScores = state.event_summary?.scores || [];
            const existingDetailedScores = prev[eventForScore]?.scores || [];

            return {
              ...prev,
              [eventForScore]: {
                // Giữ lại các chi tiết cũ nếu có, hoặc tạo mới
                ...prev[eventForScore],
                scores: [...existingDetailedScores, ...detailedScores], // Nối mảng chi tiết điểm
                eventId: eventForScore,
                score: existingScore + newEventScore, // Cộng dồn điểm
                timestamp: new Date().toLocaleTimeString('vi-VN'),
              }
            };
          });
        }

        // Cập nhật event hiện tại để theo dõi
        // Luôn cập nhật ref SAU KHI đã sử dụng giá trị cũ của nó
        previousEventRef.current = state.current_event;
      }

      // 5. Cập nhật lại toàn bộ lịch sử chat từ `dialogue_history` mới
      if (newSessionData.state && Array.isArray(newSessionData.state.dialogue_history)) {
        updateMessagesFromHistory(newSessionData.state.dialogue_history, newSessionData.state.active_personas);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Có thể thêm một tin nhắn lỗi vào chat để thông báo cho người dùng
      const errorMessage = { id: Date.now() + 1, sender: 'system', text: `Lỗi: Không thể gửi tin nhắn. ${error.message}` };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsResponding(false); // Tắt hiệu ứng typing
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
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
      let speakerName = dialogue.speaker; // Lưu lại tên gốc
      if (dialogue.speaker === 'user') {
        senderId = 'user';
      } else {
        const foundPersona = allActivePersonas.find(p => p.name === dialogue.speaker);
        if (foundPersona) {
          senderId = foundPersona.id;
        } else {
          senderId = 'system';
        }
      }
      return {
        id: `hist-${Date.now()}-${index}`, // Tạo ID duy nhất
        sender: senderId,
        text: dialogue.content,
        speakerName: speakerName,
      };
    });
    setMessages(newMessages);
  };

  if (error || !caseData.skeleton) {
    return (
      <div className="flex flex-col min-h-screen">
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

  // Tính tổng điểm từ eventScores dict
  const totalScore = Object.values(eventScores).reduce((sum, event) => sum + (event.score || 0), 0);

  // Lấy số event đã có điểm
  const eventCount = Object.keys(eventScores).length;

  // Tính điểm và xác định trạng thái hoàn thành/thất bại
  const calculateResult = () => {
    if (!sessionState) return { score: cumulativeScore, isSuccess: false, maxScore: 0, eventScores };

    // Tính điểm cuối cùng là ĐIỂM TRUNG BÌNH: tổng điểm chia cho số event đã làm.
    // Làm tròn đến một chữ số thập phân.
    const finalScore = eventCount > 0 ? Math.round((cumulativeScore / eventCount) * 10) / 10 : 0;

    // Đặt thang điểm tối đa là 5
    const maxScore = 5;

    // Xác định thành công hay thất bại (ví dụ: điểm trung bình >= 3 là thành công)
    const isSuccess = finalScore >= 3;

    return { score: finalScore, isSuccess, maxScore, eventScores };
  };

  // Màn hình kết thúc khi current_event rỗng
  if (isFinished) {
    const { score, isSuccess, maxScore, eventScores: evtScores } = calculateResult();

    return (
      <div className="flex min-h-screen flex-col text-slate-800">
        <main className="flex-1 flex items-center justify-center"
          style={{
            backgroundImage: `linear-gradient(rgba(20,30,50,0.9), rgba(20,30,50,0.95)), url(${backgroundImage2})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className={`bg-slate-800/80 backdrop-blur-xl rounded-3xl p-10 text-center max-w-lg shadow-2xl border-2 ${isSuccess ? 'border-emerald-500' : 'border-rose-500'}`}>
            {/* Icon và tiêu đề */}
            <div className={`text-7xl mb-4 ${isSuccess ? 'animate-bounce' : ''}`}>
              {isSuccess ? '🎉' : '😔'}
            </div>
            <h2 className={`text-3xl font-bold mb-4 ${isSuccess ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isSuccess ? '✅ Hoàn thành xuất sắc!' : '❌ Chưa đạt yêu cầu'}
            </h2>
            <p className="text-slate-300 mb-6">
              {isSuccess
                ? `Chúc mừng! Bạn đã hoàn thành case "${caseData.skeleton?.title}" thành công.`
                : `Bạn chưa đạt yêu cầu cho case "${caseData.skeleton?.title}". Hãy thử lại!`
              }
            </p>

            {/* Điểm số */}
            <div className={`rounded-2xl p-6 mb-6 ${isSuccess ? 'bg-emerald-900/50' : 'bg-rose-900/50'}`}>
              <p className="text-slate-400 text-sm mb-2">Điểm của bạn</p>
              <div className={`text-6xl font-extrabold ${isSuccess ? 'text-emerald-400' : 'text-rose-400'}`}>
                {score}
              </div>
              {maxScore > 0 && (
                <p className="text-slate-400 text-sm mt-2">/ {maxScore} điểm</p>
              )}

              {/* Progress bar */}
              <div className="w-full h-3 bg-slate-700 rounded-full mt-4 overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min((score / maxScore) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Chi tiết điểm và phân tích từng event */}
            {Object.keys(evtScores).length > 0 && (
              <div className="text-left bg-slate-900/50 rounded-xl p-4 mb-6 max-h-[400px] overflow-y-auto">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2 text-lg">
                  <span>📊</span> Chi tiết điểm & Phân tích
                </h3>
                <div className="space-y-4">
                  {Object.entries(evtScores).map(([eventId, eventData]) => (
                    <div key={eventId} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      {/* Header event */}
                      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-600">
                        <span className="text-white font-semibold">{eventId}</span>
                        <span className={`font-bold text-lg ${(eventData.score || 0) >= 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          +{eventData.score || 0}
                        </span>
                      </div>

                      {/* Chi tiết từng criterion */}
                      {eventData.scores && eventData.scores.length > 0 && (
                        <div className="space-y-2">
                          {eventData.scores.map((criterion, idx) => (
                            <div key={idx} className="bg-slate-900/50 rounded p-2">
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
                      )}
                    </div>
                  ))}
                </div>

                {/* Tổng điểm */}
                <div className="mt-4 pt-3 border-t border-slate-600 flex justify-between font-bold text-lg">
                  <span className="text-white">Tổng cộng:</span>
                  <span className={isSuccess ? 'text-emerald-400' : 'text-rose-400'}>{score} / {maxScore}</span>
                </div>
              </div>
            )}

            {/* Nhật ký hoạt động */}
            {messages.length > 0 && (
              <div className="text-left bg-slate-900/50 rounded-xl p-4 mb-6 max-h-40 overflow-y-auto">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span>📋</span> Nhật ký ({messages.length} tin nhắn)
                </h3>
                <div className="space-y-1">
                  {messages.slice(-5).map((msg) => (
                    <div key={msg.id} className="text-xs text-slate-400 py-1 border-b border-slate-700/30">
                      <span className="font-semibold text-slate-300">
                        {msg.sender === 'user' ? 'Bạn' : msg.speakerName}:
                      </span>{' '}
                      {msg.text.length > 60 ? msg.text.substring(0, 60) + '...' : msg.text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nút hành động */}
            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                to="/case-list"
                className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-3 rounded-xl transition"
              >
                <span>📋</span> Danh sách Case
              </Link>
              <button
                onClick={() => window.location.reload()}
                className={`inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-xl transition ${isSuccess
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
              >
                <span>🔄</span> {isSuccess ? 'Chơi lại' : 'Thử lại'}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col text-slate-800">
      <main className="flex-1 text-slate-200"
        style={{
          backgroundImage: `linear-gradient(rgba(20,30,50,0.85), rgba(20,30,50,0.95)), url(${backgroundImage2})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="grid h-full grid-cols-1 lg:grid-cols-3">
          {/* Left: Chat Panel */}
          <div className="flex h-[calc(110vh-70px)] flex-col border-r border-slate-700 bg-slate-800/30 backdrop-blur-lg lg:col-span-2">
            <header className="border-b border-slate-700 px-4 py-3 bg-slate-900/50 rounded-lg mx-4 my-2 shadow-lg">
              <h1 className="text-xl font-bold text-white">
                Case: {caseData.skeleton.title}
              </h1>
              <p className="text-sm text-slate-400">
                ID: {caseData.skeleton.case_id}
              </p>
            </header>
            <div className="flex-1 space-y-6 overflow-y-auto p-6"
              style={{
                backgroundImage: `linear-gradient(rgba(20, 30, 50, 0.1), rgba(20, 30, 50, 0.3)), url(${backgroundUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} personas={caseData.personas?.personas || []} />
              ))}
              {isResponding && (
                <div className="flex justify-start">
                  <div className="max-w-lg rounded-2xl px-4 py-2.5 bg-slate-600 text-white">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-white/60 delay-0"></span>
                      <span className="h-2 w-2 animate-pulse rounded-full bg-white/60 delay-150"></span>
                      <span className="h-2 w-2 animate-pulse rounded-full bg-white/60 delay-300"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-slate-700 bg-slate-900/50 p-4">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <textarea
                  rows="1"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Nhập hành động hoặc nội dung trả lời..."
                  className="flex-1 resize-none rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
                <button
                  type="button"
                  title="Ghi âm"
                  className={`rounded-full bg-slate-700 p-2 transition hover:bg-slate-600 flex items-center ${isListening ? "animate-pulse bg-primary-500/50" : ""}`}
                  onClick={handleRecord}
                >
                  {/* Microphone Material Design icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5.5-3a.75.75 0 0 0-1.5 0 5 5 0 0 1-10 0 .75.75 0 1 0-1.5 0 6.5 6.5 0 0 0 6 6.48V21h-2a.75.75 0 0 0 0 1.5h5a.75.75 0 0 0 0-1.5h-2v-2.52a6.5 6.5 0 0 0 6-6.48z" />
                  </svg>
                </button>
                <button
                  type="button"
                  title="Đọc nội dung"
                  className="rounded-full bg-slate-700 p-2 transition hover:bg-slate-600 flex items-center"
                  onClick={handleReadDoc}
                >
                  {/* Speaker/Volume Material Design icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v2.18c.61.57 1 1.37 1 2.25s-.39 1.68-1 2.25v2.18c1.48-.74 2.5-2.26 2.5-4.03zm2.5 0c0 2.89-2.09 5.28-4.95 5.7a.75.75 0 1 1-.13-1.5c2.06-.34 3.58-2.16 3.58-4.2s-1.52-3.86-3.58-4.2a.75.75 0 0 1 .12-1.5C17.91 6.22 20 8.61 20 11.5z" />
                  </svg>
                </button>
                <button
                  type="submit"
                  disabled={!userInput.trim()}
                  className="rounded-full bg-primary-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:cursor-not-allowed disabled:bg-primary-400"
                >
                  Gửi
                </button>
              </form>
            </div>
          </div>

          {/* Right: Scene Summary Panel */}
          <div className="hidden h-[calc(110vh-70px)] flex-col overflow-y-auto p-6 lg:flex">
            <div className="space-y-6">
              {/* Score Section - Điểm tích lũy realtime */}
              <section className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800/50 to-emerald-900/20 backdrop-blur-lg shadow-2xl shadow-black/20 p-6 mb-2">
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2 mb-3">
                  <span>📊</span> Điểm tích lũy
                </h2>
                <div className="text-center mb-4">
                  <div className="text-5xl font-bold text-emerald-400">{cumulativeScore}</div>
                  <p className="text-slate-400 text-sm mt-1">điểm ({eventCount} event)</p>
                </div>

                {/* Điểm từng event */}
                {eventCount > 0 && (
                  <div className="bg-slate-900/50 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <p className="text-xs text-slate-400 mb-2 font-semibold">Chi tiết điểm:</p>
                    {Object.entries(eventScores).map(([eventId, eventData]) => (
                      <div key={eventId} className="mb-2 last:mb-0">
                        <div className="flex justify-between text-xs py-1 border-b border-slate-700/50">
                          <span className="text-slate-300 font-medium">{eventId}</span>
                          <span className="text-emerald-400 font-semibold">+{eventData.score}</span>
                        </div>
                        {/* Phân tích ngắn gọn */}
                        {eventData.scores?.map((criterion, idx) => (
                          criterion.analysis && (
                            <div key={idx} className="text-xs text-slate-500 italic pl-2 mt-1 border-l-2 border-slate-700">
                              💡 {criterion.analysis}
                            </div>
                          )
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {eventCount === 0 && (
                  <p className="text-xs text-slate-500 italic text-center">Chưa có điểm nào</p>
                )}
              </section>

              {/* Scene Summary Section */}
              <section className="rounded-2xl border border-slate-700 bg-slate-800/50 backdrop-blur-lg shadow-2xl shadow-black/20 p-6 mb-2 flex flex-col">
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2 mb-3">
                  <span className="inline-block w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
                  Tóm tắt bối cảnh
                </h2>
                {sessionState && sessionState.scene_summary ? (
                  <div className="bg-slate-900/50 rounded-lg p-4 text-white text-base leading-relaxed shadow-inner">
                    {sessionState.scene_summary}
                  </div>
                ) : (
                  <div className="flex items-center justify-center min-h-[85px]">
                    <svg className="animate-spin h-6 w-6 text-primary-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <span className="text-white font-semibold">Đang tải tóm tắt bối cảnh...</span>
                  </div>
                )}
              </section>

              {/* Tabs Section - Only Checklist & AI Facilitator */}
              <section>
                <div className="relative rounded-2xl border border-slate-700 bg-slate-800/50 backdrop-blur-xl p-6 shadow-2xl shadow-black/20">
                  <div className="rounded-2xl p-1">
                    <h2 className="text-xl font-bold text-white mb-4 ">Phiên làm việc</h2>
                    <div className="flex gap-2 border-b border-slate-700">
                      {[
                        { key: "skeleton", label: "Checklist" },
                        { key: "ai", label: "AI Facilitator" }
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${activeTab === tab.key
                              ? "border-primary-500 text-white"
                              : "border-transparent text-slate-400 hover:border-slate-500 hover:text-white"
                            }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 rounded-xl">
                      <div className="rounded-xl bg-slate-900/50 p-4 shadow-inner">
                        {activeTab === "skeleton" && (
                          <div className="space-y-3">
                            <h3 className="font-semibold text-white">
                              Checklist
                            </h3>
                            <ul className="space-y-2">
                              {sessionState && sessionState.current_event && (
                                <div className="rounded-lg bg-slate-800 p-3 border border-slate-700">
                                  <p className="font-bold text-white text-lg">
                                    Sự kiện hiện tại: {sessionState.current_event}
                                  </p>
                                  {sessionState.event_summary?.remaining_success_criteria && (
                                    <div className="mt-2">
                                      <p className="text-xl font-bold text-white mb-1">Tiêu chí cần hoàn thành:</p>
                                      <ul className="list-disc list-inside space-y-1 pl-1">
                                        {sessionState.event_summary.remaining_success_criteria.map((criterion, index) => (
                                          <li key={index} className="text-x text-white">{criterion.description}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                            </ul>
                            {!sessionState && <p className="text-xs text-slate-400 italic">Đang chờ dữ liệu session...</p>}
                          </div>
                        )}
                        {activeTab === "ai" && (
                          <div className="space-y-3">
                            <h3 className="font-semibold text-white">
                              AI Facilitator
                            </h3>
                            <div className="bg-slate-800 rounded-lg p-4 text-white text-base leading-relaxed shadow-inner min-h-[64px] border border-slate-700">
                              {/* Hiện tại đặt biến giả để đỡ lỗi */}
                              {sessionState && sessionState?.ai_reply
                                ? (<span style={{ whiteSpace: 'pre-wrap' }}>{sessionState.ai_reply}</span>)
                                : (<span className="text-slate-500 italic">Chưa có phản hồi AI nào.</span>)
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
