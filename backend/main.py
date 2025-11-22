import threading
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.audio import AudioService
from services.matcher import MatchService

app = FastAPI()

# 1. 允许跨域 (让前端能连上)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. 初始化服务
audio_service = AudioService()
match_service = MatchService()

# 3. 全局变量 (用于在后台线程和API之间传递数据)
class GlobalState:
    is_running = False
    latest_text = ""
    latest_card = None

state = GlobalState()

# 4. 后台线程函数 (这就是之前的 run_interview.py 的逻辑)
def background_listener():
    print("🧵 Background listener thread started")
    while state.is_running:
        # 监听 (这一步是阻塞的，会等待说话)
        text = audio_service.listen_and_transcribe()
        
        if text:
            print(f"🎤 Recognized: {text}")
            state.latest_text = text
            
            # 匹配
            card = match_service.find_best_match(text)
            if card:
                print(f"✅ Matched: {card['topic']}")
                state.latest_card = card
            else:
                print("❌ No match")
                state.latest_card = None # 清空上一次的卡片，或者保留看你需求
        
        time.sleep(0.1)
    print("🛑 Background listener stopped")

# --- API 接口区域 ---

@app.get("/")
def read_root():
    return {"status": "backend_ready"}

@app.post("/api/start")
def start_interview():
    """前端点击'开始'按钮时调用"""
    if state.is_running:
        return {"msg": "Already running"}
    
    state.is_running = True
    # 启动一个后台线程去跑监听循环，这样不会卡死主服务器
    thread = threading.Thread(target=background_listener)
    thread.daemon = True # 守护线程，主程序挂了它也挂
    thread.start()
    
    return {"msg": "Interview started"}

@app.post("/api/stop")
def stop_interview():
    """前端点击'停止'按钮时调用"""
    state.is_running = False
    return {"msg": "Interview stopped"}

@app.get("/api/poll")
def get_latest_result():
    """前端每隔 1秒 轮询一次这个接口，获取最新显示内容"""
    # 返回数据后，可以把 latest_card 清空，防止前端重复弹窗
    # 或者由前端控制去重
    return {
        "is_running": state.is_running,
        "text": state.latest_text,
        "card": state.latest_card
    }
