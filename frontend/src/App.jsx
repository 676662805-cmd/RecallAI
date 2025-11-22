import { useState, useEffect } from 'react'
import InterviewCard from './components/InterviewCard'

function App() {
  // 1. 定义状态
  const [activeCard, setActiveCard] = useState(null); // 当前显示的卡片
  const [showCard, setShowCard] = useState(false);    // 控制动画显示/隐藏
  const [status, setStatus] = useState("等待连接后端..."); // 调试用的状态文字

  // 2. 核心逻辑：每隔 1 秒去问一次后端
  useEffect(() => {
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
        setStatus("正在监听 AI 大脑... 🟢");

        // 3. 判断逻辑：如果后端返回了新的卡片数据
        if (data && data.card_id) {
          // 如果当前没有显示卡片，或者 ID 不一样，就更新
          if (activeCard?.id !== data.card_id) {
            console.log("发现新卡片！", data);
            setShowCard(false); // 先收起旧的
            
            // 延迟一点点再弹出新的，动画更流畅
            setTimeout(() => {
              setActiveCard(data.card_data); // 更新数据
              setShowCard(true);             // 弹出
            }, 200);
          }
        } else {
          // 如果后端返回空（没匹配到），我们可以选择保持原样，或者收起卡片
          // 这里我们选择：不收起，让用户多看一会儿，除非有新卡片顶替
        }

      } catch (error) {
        setStatus("后端未启动或网络错误 ⚠️");
        console.error("Polling error:", error);
      }
    }, 1000); // 1000毫秒 = 1秒

    // 清理函数：组件卸载时停止轮询
    return () => clearInterval(intervalId);
  }, [activeCard]);

  // 手动关闭卡片
  const closeCard = () => setShowCard(false);

  return (
    <div style={{ 
      height: '100vh', 
      background: '#f5f5f7', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: '-apple-system, sans-serif'
    }}>
      
      <h1>🧠 RecallAI 实时监控中</h1>
      
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