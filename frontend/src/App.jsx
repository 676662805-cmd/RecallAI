import { useState, useEffect, useRef } from 'react'
import InterviewCard from './components/InterviewCard'
import KnowledgeBasePage from './pages/KnowledgeBasePage'
import SwitchButton from './components/SwitchButton';

function App() {
  // 新增状态：控制当前显示哪个页面 ('interview' 或 'knowledge')
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem('recallai_currentPage');
    return savedPage || 'interview'; 
  });

  // 1. 定义状态
  const [activeCard, setActiveCard] = useState(null); // 当前显示的卡片
  const [showCard, setShowCard] = useState(false);    // 控制动画显示/隐藏
  const [isRunning, setIsRunning] = useState(false); // 后端是否在监听
  const [status, setStatus] = useState("等待连接后端..."); // 调试用的状态文字
  
  // ✨ 新增：逐字稿列表
  const [transcript, setTranscript] = useState([]);
  // ✨ 新增：用于自动滚动的锚点
  const transcriptEndRef = useRef(null);

  // 🔥 2. 新增：将 setCurrentPage 封装为返回函数
  const handleReturnToInterview = () => {
    setCurrentPage('interview');
    // 停止正在进行的录音，以防在知识库页时麦克风被占用
    stopInterview(); 
  };

  // ✨ 自动滚动逻辑：当 transcript 更新时，滚到底部
  useEffect(() => {
    if (currentPage === 'interview') {
      transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript, currentPage]);

  // 2. 核心逻辑：每隔 100ms 去问一次后端
  useEffect(() => {
    // 只有在面试模式才进行轮询
    if (currentPage !== 'interview') return;

    const intervalId = setInterval(async () => {
      try {
        // 发送请求给后端接口
        const response = await fetch('http://127.0.0.1:8000/api/poll');
        
        if (!response.ok) {
          setStatus("后端连接断开 ❌");
          return;
        }

        const data = await response.json();

        // 更新是否在运行的状态
        if (typeof data.is_running !== 'undefined') {
          setIsRunning(data.is_running);
          setStatus(data.is_running ? "正在监听 AI 大脑... 🟢" : "后端未运行，点击开始按钮启动");
        } else {
          setStatus("正在监听 AI 大脑... 🟢");
        }

        // ✨ 更新逐字稿 (如果后端返回了 transcript 字段)
        if (data.transcript) {
            setTranscript(data.transcript);
        }

        // 3. 判断逻辑：后端可能返回两种结构：{ card } 或 老的 { card_id, card_data }
        const card = data.card || (data.card_id ? { id: data.card_id, ...data.card_data } : null);
        if (card) {
          if (activeCard?.id !== card.id) {
            console.log("发现新卡片！", card);
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
          // 没有匹配到新卡片：不自动收起，保持现状
        }

      } catch (error) {
        setStatus("后端未启动或网络错误 ⚠️");
        // console.error("Polling error:", error); // 既然是轮询，出错太频繁可以先注释掉log
      }
    }, 100); // 轮询间隔 100毫秒

    // 清理函数：组件卸载时停止轮询
    return () => clearInterval(intervalId);
  }, [activeCard, currentPage]);

  // 手动关闭卡片
  const closeCard = () => setShowCard(false);

  useEffect(() => {
    localStorage.setItem('recallai_currentPage', currentPage);
  }, [currentPage]);

  // 启动后端监听
  const startInterview = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/start', { method: 'POST' });
      if (res.ok) {
        setStatus('已发送启动指令...');
        setIsRunning(true);
        setTranscript([]); // 启动时清空前端显示
      } else {
        setStatus('启动请求失败');
      }
    } catch (err) {
      console.error('start error', err);
      setStatus('启动出错，检查后端');
    }
  };

  // 停止后端监听
  const stopInterview = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/stop', { method: 'POST' });
      if (res.ok) {
        setStatus('已停止后端监听');
        setIsRunning(false);
      } else {
        setStatus('停止请求失败');
      }
    } catch (err) {
      console.error('stop error', err);
      setStatus('停止出错，检查后端');
    }
  };

  // 监听空格键回退 (你之前要求的功能)
  useEffect(() => {
    const handleKeyDown = async (event) => {
      if (event.code === 'Space' && currentPage === 'interview') {
        // 注意：如果焦点在输入框里可能要排除，但这里暂时全局监听
        // event.preventDefault(); // 视情况开启，防止滚动页面
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


  if (currentPage === 'knowledge') {
    return (
        <>
          <KnowledgeBasePage 
              handleReturnToInterview={handleReturnToInterview} 
          />
        </>
    );
  }

  // Interview 模式界面
  return (
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
      
      <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '10px' }}>RecallAI 助手</h1>
      
      {/* 状态指示灯 */}
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

      {/* 控制按钮：开始 / 停止 */}
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

      {/* ✨ Transcript 逐字稿区域 (深色背景，模拟终端/字幕效果) */}
      <div style={{
        background: '#1c1c1e', 
        borderRadius: '12px',
        padding: '18px',
        height: '600px',       // 固定高度，超过滚动
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
            暂无对话记录... (请点击Start开始)
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
        {/* 这是一个看不见的元素，用于自动滚动到底部 */}
        <div ref={transcriptEndRef} />
      </div>

      <p style={{ color: '#86868b', fontSize: '12px', textAlign: 'center' }}>
        💡 按空格键可回退到上一张卡片
      </p>

      {/* 卡片组件 */}
      {activeCard && (
        <InterviewCard data={activeCard} isVisible={showCard} />
      )}

      {/* 调试用的关闭按钮 */}
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
          收起卡片
        </button>
      )}

    </div>
  )
}

export default App