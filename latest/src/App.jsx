import { useState } from 'react'

function App() {
  const [message, setMessage] = useState("等待连接...")

  const testBackend = async () => {
    try {
      // 发送请求给后端 (Mac 本地也是 127.0.0.1)
      const response = await fetch('http://127.0.0.1:8000/test');
      const data = await response.json();
      
      alert("🎉 成功连接！后端说: " + data.msg);
      setMessage(data.msg);

    } catch (error) {
      console.error(error);
      alert("❌ 连接失败！请确认 B 同学的后端是否在运行？");
    }
  }

  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <h1>RecallAI Mac 控制台</h1>
      <div style={{ marginTop: '20px' }}>
        <p>后端状态: <strong style={{color: message.includes('alive') ? 'green' : 'red'}}>{message}</strong></p>
        <button 
          onClick={testBackend}
          style={{ 
            padding: '12px 24px', 
            fontSize: '16px', 
            cursor: 'pointer',
            backgroundColor: '#007AFF', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px'
          }}
        >
          Ping Backend 📡
        </button>
      </div>
    </div>
  )
}

export default App