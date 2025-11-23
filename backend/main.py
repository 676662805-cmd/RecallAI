import threading
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.audio import AudioService
from services.matcher import MatchService

app = FastAPI()

# 1. 允许跨域
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

# 3. 全局变量 (带缓存功能)
class GlobalState:
    is_running = False
    latest_text = ""
    latest_card = None
    
    # --- 新增缓存机制 ---
    sentence_buffer = ""       # 存放可能是断开的半截话
    last_update_time = 0       # 上次更新缓存的时间

state = GlobalState()

# 4. 后台线程函数 (语义接龙逻辑)
def background_listener():
    print("🧵 Background listener thread started")
    
    # 缓存有效期 (秒)
    # 如果 5 秒都没补全句子，说明之前的半截话没用了，扔掉
    BUFFER_TIMEOUT = 5.0 
    
    while state.is_running:
        # 监听
        text = audio_service.listen_and_transcribe()
        
        if text:
            current_time = time.time()
            
            # 1. 检查超时：如果距离上次说话太久，清空旧缓存，重新开始
            if current_time - state.last_update_time > BUFFER_TIMEOUT:
                if state.sentence_buffer:
                    print("🧹 Buffer timeout (Cleared old context)")
                    state.sentence_buffer = ""
            
            state.last_update_time = current_time

            # 2. 尝试匹配：当前这一句 (试试运气，万一这句就是完整的呢？)
            # 或者：如果缓存里有东西，先拼起来试试
            
            current_full_text = (state.sentence_buffer + " " + text).strip()
            print(f"🧩 Analyzing: [{current_full_text}]")
            
            state.latest_text = current_full_text # 更新前端显示
            
            # 3. 调用 AI 匹配
            card = match_service.find_best_match(current_full_text)
            
            if card:
                # A. 匹配成功！
                print(f"✅ MATCH FOUND: {card['topic']}")
                state.latest_card = card
                
                # 关键：问题解决了，缓存清空，准备迎接下一个新问题
                state.sentence_buffer = "" 
            else:
                # B. 匹配失败 (可能是没说完，也可能是真的没匹配到)
                print("❌ No match (Appending to buffer...)")
                
                # 关键：把这句话存起来，等着和下一句拼
                state.sentence_buffer = current_full_text
                # 注意：这里不更新 latest_card 为 None，保持上一张卡片（或者你可以根据需求清空）
        
        time.sleep(0.1)
    print("🛑 Background listener stopped")

# --- API 接口区域 (保持不变) ---

@app.get("/")
def read_root():
    return {"status": "backend_ready"}

@app.post("/api/start")
def start_interview():
    if state.is_running:
        return {"msg": "Already running"}
    state.is_running = True
    thread = threading.Thread(target=background_listener)
    thread.daemon = True
    thread.start()
    return {"msg": "Interview started"}

@app.post("/api/stop")
def stop_interview():
    state.is_running = False
    return {"msg": "Interview stopped"}

@app.get("/api/poll")
def get_latest_result():
    return {
        "is_running": state.is_running,
        "text": state.latest_text,
        "card": state.latest_card
    }