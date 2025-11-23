import { useState, useEffect } from 'react'
import InterviewCard from './components/InterviewCard'
import KnowledgeBasePage from './pages/KnowledgeBasePage'
import SwitchButton from './components/SwitchButton';

function App() {
  // 新增状态：控制当前显示哪个页面 ('interview' 或 'knowledge')
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem('recallai_currentPage');
    // 如果找到了，就用保存的值；否则默认回到 'interview' 模式
    return savedPage || 'interview'; 
});
  // 1. 定义状态
  const [activeCard, setActiveCard] = useState(null); // 当前显示的卡片
  const [showCard, setShowCard] = useState(false);    // 控制动画显示/隐藏
  const [isRunning, setIsRunning] = useState(false); // 后端是否在监听
  const [status, setStatus] = useState("等待连接后端..."); // 调试用的状态文字

  // 🔥 2. 新增：将 setCurrentPage 封装为返回函数
  const handleReturnToInterview = () => {
    setCurrentPage('interview');
    // 停止正在进行的录音，以防在知识库页时麦克风被占用
    stopInterview(); 
  };

  // 2. 核心逻辑：每隔 1 秒去问一次后端
  useEffect(() => {
    // 只有在面试模式才进行轮询
    if (currentPage !== 'interview') return;


    const intervalId = setInterval(async () => {
      try {
        // 发送请求给 B 同学的后端接口 (注意：这个接口 B 可能还没写好，没关系，我们先写好接收端)
        const response = await fetch('http://127.0.0.1:8000/api/poll');
        
        // 如果后端挂了或者网络错误，跳进 catch
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
        console.error("Polling error:", error);
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
        setStatus('已发送启动指令，后端正在启动...');
        setIsRunning(true);
      } else {
        setStatus('启动请求失败');
      }
    } catch (err) {
      console.error('start error', err);
      setStatus('启动出错，检查后端或网络');
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
      setStatus('停止出错，检查后端或网络');
    }
  };

  if (currentPage === 'knowledge') {
    return (
        <>
          {/* ⚠️ 移除固定位置的 SwitchButton，只渲染 KnowledgeBasePage */}
          <KnowledgeBasePage 
              handleReturnToInterview={handleReturnToInterview} // <-- 传递返回函数
          />
        </>
    );
  }

// 下面的 interview 模式渲染也要确保传了
return (
  <div style={{ 
    /* ... 样式 ... */
  }}>
    <SwitchButton 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
    />
      
      <h1>RecallAI 启动中</h1>
      
      {/* 状态指示灯 */}
      <div style={{ 
        marginTop: '20px', 
        padding: '8px 16px', 
        background: 'white', 
        borderRadius: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        color: '#666',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
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
      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
        <button
          onClick={startInterview}
          disabled={isRunning}
          style={{
            padding: '8px 14px',
            borderRadius: '12px',
            border: 'none',
            background: isRunning ? '#d1ffd6' : '#34c759',
            color: isRunning ? '#6b6b6b' : 'white',
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          Start
        </button>

        <button
          onClick={stopInterview}
          disabled={!isRunning}
          style={{
            padding: '8px 14px',
            borderRadius: '12px',
            border: 'none',
            background: !isRunning ? '#f5f5f5' : '#ff3b30',
            color: !isRunning ? '#6b6b6b' : 'white',
            cursor: !isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          Stop
        </button>
      </div>

      <p style={{ marginTop: '20px', color: '#86868b', fontSize: '13px' }}>
        请对着麦克风说话，AI 匹配到关键词后将自动弹出卡片。
      </p>

      {/* 还是那个漂亮的卡片组件，逻辑没变 */}
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
            padding: '8px 16px',
            background: 'rgba(0,0,0,0.5)',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)'
          }}
        >
          收起卡片
        </button>
      )}

    </div>
  )
}

export default App