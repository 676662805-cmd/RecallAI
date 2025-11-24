import { useState, useEffect, useRef } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import InterviewCard from './components/InterviewCard'
import KnowledgeBasePage from './pages/KnowledgeBasePage'
import TranscriptHistoryPage from './pages/TranscriptHistoryPage'
import SwitchButton from './components/SwitchButton';
import useSystemTheme from './hooks/useSystemTheme';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useSystemTheme();
  
  // Determine current page from URL
  const currentPage = location.pathname === '/knowledge' ? 'knowledge' 
                    : location.pathname === '/transcripts' ? 'transcriptHistory'
                    : 'interview';

  // 1. Define state
  const [activeCard, setActiveCard] = useState(null); // Currently displayed card
  const [showCard, setShowCard] = useState(false);    // Control animation show/hide
  const [isRunning, setIsRunning] = useState(false); // Is backend listening
  const [status, setStatus] = useState("Waiting for backend connection..."); // Debug status text
  
  // ✨ New: Transcript list
  const [transcript, setTranscript] = useState([]);
  // ✨ New: Anchor for auto-scroll
  const transcriptEndRef = useRef(null);
  const transcriptContainerRef = useRef(null);
  // ✨ New: Track if user manually scrolled
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const prevTranscriptLength = useRef(0);
  
  // ✨ New: Transcript history for storing past recordings
  const [transcriptHistory, setTranscriptHistory] = useState([]);
  
  // ✨ Load transcript history from backend when component mounts
  useEffect(() => {
    const loadTranscriptHistory = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/transcripts');
        if (response.ok) {
          const data = await response.json();
          setTranscriptHistory(data.transcripts || []);
          console.log(`📋 Loaded ${data.transcripts?.length || 0} transcripts from backend`);
        }
      } catch (error) {
        console.error('Error loading transcript history:', error);
      }
    };
    
    loadTranscriptHistory();
  }, []);

  // 🔥 2. New: Wrap navigate as return function
  const handleReturnToInterview = () => {
    navigate('/');
    // Stop recording to prevent microphone being occupied when in knowledge base
    stopInterview(); 
  };
  
  const setCurrentPage = (page) => {
    if (page === 'interview') navigate('/');
    else if (page === 'knowledge') navigate('/knowledge');
    else if (page === 'transcriptHistory') navigate('/transcripts');
  };

  // ✨ Auto-scroll logic: Only scroll if content overflows and user hasn't manually scrolled
  useEffect(() => {
    if (currentPage === 'interview' && transcriptContainerRef.current) {
      const container = transcriptContainerRef.current;
      
      // Check if there's new content and container has scrollable content
      if (transcript.length > prevTranscriptLength.current && !userHasScrolled) {
        // Only scroll if content actually overflows the container AND user is near bottom
        const isContentOverflowing = container.scrollHeight > container.clientHeight;
        const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;
        
        if (isContentOverflowing && isNearBottom) {
          transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }
      prevTranscriptLength.current = transcript.length;
    }
  }, [transcript, currentPage, userHasScrolled]);

  // 2. Core logic: Poll backend every 100ms
  useEffect(() => {
    // Only poll in interview mode
    if (currentPage !== 'interview') return;

    const intervalId = setInterval(async () => {
      try {
        // Send request to backend endpoint
        const response = await fetch('http://127.0.0.1:8000/api/poll');
        
        if (!response.ok) {
          setStatus("Backend connection lost ❌");
          return;
        }

        const data = await response.json();

        // Update running status
        if (typeof data.is_running !== 'undefined') {
          setIsRunning(data.is_running);
          setStatus(data.is_running ? "Listening to AI brain... 🟢" : "Backend not running, click Start button to launch");
        } else {
          setStatus("Listening to AI brain... 🟢");
        }

        // ✨ Update transcript (if backend returned transcript field)
        if (data.transcript) {
            setTranscript(data.transcript);
        }

        // 3. Logic: Backend may return two structures: { card } or old { card_id, card_data }
        const card = data.card || (data.card_id ? { id: data.card_id, ...data.card_data } : null);
        if (card) {
          if (activeCard?.id !== card.id) {
            console.log("Found new card!", card);
            
            // Transform backend card shape to the UI shape expected by InterviewCard
            const uiCard = {
              id: card.id,
              title: card.topic || card.title || "",
              // InterviewCard expects content as an array of lines
              content: Array.isArray(card.content)
                ? card.content
                : (typeof card.content === 'string' ? card.content.split('\n') : []),
              tags: Array.isArray(card.tags) ? card.tags : (card.tags ? [card.tags] : [])
            };

            // 如果在Electron环境中，显示幽灵弹窗
            if (window.electronAPI) {
              window.electronAPI.showPopup(uiCard);
            } else {
              // 网页环境中的传统卡片显示
              setShowCard(false);
              setTimeout(() => {
                setActiveCard(uiCard);
                setShowCard(true);
              }, 50);
            }
            
            setActiveCard(uiCard);
          }
        } else {
          // No matching card found: don't auto-hide, stay as is
        }

      } catch {
        setStatus("Backend not started or network error ⚠️");
        // console.error("Polling error:", error); // Errors too frequent for polling, can comment out log
      }
    }, 100); // Poll interval 100ms

    // Cleanup: stop polling when component unmounts
    return () => clearInterval(intervalId);
  }, [activeCard, currentPage]);

  // 手动关闭卡片
  const closeCard = () => setShowCard(false);

  useEffect(() => {
    localStorage.setItem('recallai_currentPage', currentPage);
  }, [currentPage]);

  // Start backend listening
  const startInterview = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/start', { method: 'POST' });
      if (res.ok) {
        setStatus('Startup command sent...');
        setIsRunning(true);
        setTranscript([]); // Clear frontend display on startup
        setUserHasScrolled(false); // Reset scroll state
        prevTranscriptLength.current = 0; // Reset transcript length counter
      } else {
        setStatus('Startup request failed');
      }
    } catch (err) {
      console.error('start error', err);
      setStatus('Startup error, check backend');
    }
  };

  // Stop backend listening
  const stopInterview = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/stop', { method: 'POST' });
      if (res.ok) {
        setStatus('Backend listening stopped');
        setIsRunning(false);
        // Reload transcript history from backend after stopping
        try {
          const response = await fetch('http://127.0.0.1:8000/api/transcripts');
          if (response.ok) {
            const data = await response.json();
            setTranscriptHistory(data.transcripts || []);
          }
        } catch (error) {
          console.error('Error reloading transcript history:', error);
        }
      } else {
        setStatus('Stop request failed');
      }
    } catch (err) {
      console.error('stop error', err);
      setStatus('Stop error, check backend');
    }
  };

  // Listen for space key to rewind (feature you requested earlier)
  useEffect(() => {
    const handleKeyDown = async (event) => {
      if (event.code === 'Space' && currentPage === 'interview') {
        // Note: May need to exclude if focus is in input, but currently listening globally
        // event.preventDefault(); // Enable if needed to prevent page scroll
        console.log("Space pressed: Rewinding...");
        try {
          await fetch('http://127.0.0.1:8000/api/rewind', { method: 'POST' });
        } catch (error) {
          console.error("Rewind failed:", error);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage]);


  // Render content based on route
  const renderInterviewPage = () => (
    <div style={{ 
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <SwitchButton 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
      />
      
      <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '10px', textAlign: 'center' }}>RecallAI</h1>
      
      {/* Status indicator */}
      <div style={{ 
        padding: '8px 16px', 
        background: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)', 
        color: '#666', 
        fontSize: '14px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        marginBottom: '16px'
      }}>
        <div style={{
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          background: status.includes('🟢') ? '#34c759' : '#ff3b30'
        }} />
        {status}
      </div>

      {/* Control buttons: Start / Stop */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={startInterview}
          disabled={isRunning}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '10px',
            border: 'none',
            background: isRunning ? '#e0e0e0' : '#007AFF',
            color: isRunning ? '#999' : 'white',
            fontWeight: '500',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
          }}
        >
          Start
        </button>

        <button
          onClick={stopInterview}
          disabled={!isRunning}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '10px',
            border: 'none',
            background: !isRunning ? '#e0e0e0' : '#FF3B30',
            color: !isRunning ? '#999' : 'white',
            fontWeight: '500',
            cursor: !isRunning ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
          }}
        >
          Stop
        </button>
      </div>

      {/* ✨ Transcript area (dark background, simulates terminal/subtitle effect) */}
      <div 
        ref={transcriptContainerRef}
        onScroll={(e) => {
          const container = e.target;
          const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 10;
          // If user scrolls to bottom, reset the scroll flag to allow auto-scroll again
          if (isAtBottom) {
            setUserHasScrolled(false);
          } else {
            // User scrolled away from bottom
            setUserHasScrolled(true);
          }
        }}
        style={{
        background: theme.isDark ? '#1c1c1e' : '#f5f5f7', 
        borderRadius: '12px',
        padding: '18px',
        height: '600px',       // Fixed height, scroll beyond
        overflowY: 'auto',     
        color: theme.isDark ? '#e0e0e0' : '#1d1d1f',
        fontSize: '15px',
        lineHeight: '1.5',
        boxShadow: theme.isDark ? 'inset 0 2px 4px rgba(0,0,0,0.3)' : 'inset 0 2px 4px rgba(0,0,0,0.05)',
        marginBottom: '20px',
        border: theme.isDark ? '1px solid #333' : '1px solid #d1d1d6'
      }}>
        {transcript.length === 0 ? (
          <div style={{ color: theme.isDark ? '#555' : '#86868b', textAlign: 'center', marginTop: '80px' }}>
            No conversation history yet... (Click Start to begin)
          </div>
        ) : (
          transcript.map((item, index) => (
            <div key={index} style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ 
                color: theme.isDark ? '#666' : '#86868b', 
                fontSize: '11px', 
                minWidth: '40px',
                fontFamily: 'monospace'
              }}>
                {item.timestamp}
              </span>
              <span style={{ color: theme.isDark ? '#ddd' : '#1d1d1f' }}>{item.text}</span>
            </div>
          ))
        )}
        {/* This is an invisible element for auto-scrolling to bottom */}
        <div ref={transcriptEndRef} />
      </div>

      <p style={{ color: '#86868b', fontSize: '12px', textAlign: 'center' }}>
        💡 Press Space to rewind to previous card
      </p>

      {/* Card component */}
      {activeCard && (
        <InterviewCard data={activeCard} isVisible={showCard} />
      )}

      {/* Close button for debugging */}
      {showCard && (
        <button 
          onClick={closeCard}
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            padding: '16px 32px',
            background: 'rgba(0,0,0,0.6)',
            color: 'white',
            border: 'none',
            borderRadius: '40px',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            fontSize: '24px',
            zIndex: 9999,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
          }}
        >
            Close Card
          </button>
        )}

      </div>
    );  // Main render with Routes
  return (
    <Routes>
      <Route path="/" element={renderInterviewPage()} />
      <Route path="/knowledge" element={
        <KnowledgeBasePage handleReturnToInterview={handleReturnToInterview} />
      } />
      <Route path="/transcripts" element={
        <TranscriptHistoryPage 
          handleReturnToInterview={handleReturnToInterview}
          transcriptHistory={transcriptHistory}
          onUpdateTranscriptHistory={setTranscriptHistory}
        />
      } />
    </Routes>
  );
}

export default App