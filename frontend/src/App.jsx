import { useState, useEffect, useRef } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import InterviewCard from './components/InterviewCard'
import KnowledgeBasePage from './pages/KnowledgeBasePage'
import TranscriptHistoryPage from './pages/TranscriptHistoryPage'
import SwitchButton from './components/SwitchButton';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  
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
  
  // ✨ New: Transcript history for storing past recordings
  const [transcriptHistory, setTranscriptHistory] = useState(() => {
    const saved = localStorage.getItem('recallai_transcriptHistory');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentTranscriptId, setCurrentTranscriptId] = useState(null);

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

  // ✨ Auto-scroll logic: Scroll to bottom when transcript updates
  useEffect(() => {
    if (currentPage === 'interview') {
      transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript, currentPage]);

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
            setShowCard(false);
            setTimeout(() => {
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

              setActiveCard(uiCard);
              setShowCard(true);
            }, 50);
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
        // Create new transcript record
        const newId = Date.now().toString();
        setCurrentTranscriptId(newId);
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
        // Save transcript to history
        if (transcript && transcript.length > 0 && currentTranscriptId) {
          const newRecord = {
            id: currentTranscriptId,
            timestamp: new Date().toISOString(),
            transcript: transcript,
            name: `Transcript ${new Date().toLocaleString()}`
          };
          const updated = [...transcriptHistory, newRecord];
          setTranscriptHistory(updated);
          localStorage.setItem('recallai_transcriptHistory', JSON.stringify(updated));
        }
        setCurrentTranscriptId(null);
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
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
            transition: 'all 0.2s'
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
            transition: 'all 0.2s'
          }}
        >
          Stop
        </button>
      </div>

      {/* ✨ Transcript area (dark background, simulates terminal/subtitle effect) */}
      <div style={{
        background: '#1c1c1e', 
        borderRadius: '12px',
        padding: '18px',
        height: '600px',       // Fixed height, scroll beyond
        overflowY: 'auto',     
        color: '#e0e0e0',
        fontSize: '15px',
        lineHeight: '1.5',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
        marginBottom: '20px',
        border: '1px solid #333'
      }}>
        {transcript.length === 0 ? (
          <div style={{ color: '#555', textAlign: 'center', marginTop: '80px' }}>
            No conversation history yet... (Click Start to begin)
          </div>
        ) : (
          transcript.map((item, index) => (
            <div key={index} style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
              <span style={{ 
                color: '#666', 
                fontSize: '11px', 
                minWidth: '40px',
                fontFamily: 'monospace',
                paddingTop: '2px'
              }}>
                {item.timestamp}
              </span>
              <span style={{ color: '#ddd' }}>{item.text}</span>
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
            zIndex: 9999
          }}
        >
          ✖️ Close Card
        </button>
      )}

    </div>
  );

  // Main render with Routes
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
          onUpdateTranscriptHistory={(updated) => {
            setTranscriptHistory(updated);
            localStorage.setItem('recallai_transcriptHistory', JSON.stringify(updated));
          }}
        />
      } />
    </Routes>
  );
}

export default App