import { useState } from 'react'
import InterviewCard from './components/InterviewCard'
import { MOCK_CARD } from './data/mockData'

function App() {
  const [activeCard, setActiveCard] = useState(null); // 存卡片数据
  const [showCard, setShowCard] = useState(false);    // 控制显示/隐藏

  // 模拟 AI 匹配的动作
  const simulateAIMatch = () => {
    // 1. 先隐藏旧的
    setShowCard(false);
    
    // 2. 假装思考 0.5 秒
    setTimeout(() => {
      setActiveCard(MOCK_CARD); // 填入数据
      setShowCard(true);        // 弹出来
    }, 500);
  };

  return (
    <div style={{ 
      height: '100vh', 
      background: '#f5f5f7', // 浅灰色背景
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: '-apple-system, sans-serif'
    }}>
      
      <h1>🎛️ 面试官监控台 (Mac)</h1>
      <p style={{ color: '#86868b' }}>等待指令...</p>

      {/* 测试按钮 */}
      <button 
        onClick={simulateAIMatch}
        style={{
          marginTop: '20px',
          padding: '12px 24px',
          background: '#007AFF',
          color: 'white',
          border: 'none',
          borderRadius: '20px',
          fontSize: '16px',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,122,255,0.2)'
        }}
      >
        ✨ 模拟 AI 匹配成功
      </button>

      {/* 如果有数据，就加载卡片组件 */}
      {activeCard && (
        <InterviewCard data={activeCard} isVisible={showCard} />
      )}

    </div>
  )
}

export default App