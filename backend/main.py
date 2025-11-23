import threading
import time
from difflib import SequenceMatcher
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.audio import AudioService
from services.matcher import MatchService

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

audio_service = AudioService()
match_service = MatchService()

class GlobalState:
    is_running = False
    latest_text = ""
    latest_card = None
    sentence_buffer = ""       
    last_update_time = 0
    
    # --- ✨ 新增：历史记录栈 ---
    card_history = []  # 用来存上一张、上上一张卡片

state = GlobalState()

# --- ✨ 新增：卡片更新封装函数 (带历史记录) ---
def update_card(new_card):
    # 只有当新卡片和当前卡片不一样时，才存入历史
    if state.latest_card and state.latest_card.get('id') != new_card.get('id'):
        state.card_history.append(state.latest_card)
        # 限制历史长度，只存最近 10 张，防止内存泄露
        if len(state.card_history) > 10:
            state.card_history.pop(0)
    
    state.latest_card = new_card

# --- 🛠️ 升级版防读屏函数 ---
def is_reading_card(speech_text, card_content):
    if not card_content or not speech_text:
        return False
        
    speech_clean = speech_text.lower().strip()
    card_clean = card_content.lower()

    # 1. ⚡️ 提问豁免权 (Question Bypass)
    # 如果用户是在纠正或者提问，即使关键词重合，也必须放行！
    question_starters = [
        "what", "how", "why", "can you", "could you", 
        "tell me", "define", "explain", "is it", "do you"
    ]
    if any(speech_clean.startswith(q) for q in question_starters):
        return False

    # 2. 🔍 连续最长公共子串 (Longest Common Substring)
    matcher = SequenceMatcher(None, speech_clean, card_clean)
    match = matcher.find_longest_match(0, len(speech_clean), 0, len(card_clean))
    
    # 匹配比例：最长连续重合字符数 / 语音总字符数
    # 只有当连续重合超过 80% 时，才认为是照着念
    ratio = match.size / len(speech_clean)
    
    return ratio > 0.8

def background_listener():
    print("🧵 Background listener started")
    BUFFER_TIMEOUT = 5.0 
    
    while state.is_running:
        text = audio_service.listen_and_transcribe()
        
        if text:
            # 防读屏检查
            if state.latest_card and is_reading_card(text, state.latest_card.get('content', '')):
                print(f"🙊 Detected user reading card: '{text}' -> IGNORED")
                state.last_update_time = time.time()
                continue

            current_time = time.time()
            # 超时清理
            if current_time - state.last_update_time > BUFFER_TIMEOUT:
                if state.sentence_buffer:
                    print("🧹 Buffer timeout (Reset)")
                    state.sentence_buffer = ""
            
            state.last_update_time = current_time
            
            # 防止“Thank you”等短语
            if state.sentence_buffer and len(state.sentence_buffer.split()) < 3:
                if current_time - state.last_update_time > 2.0:
                     print("🧹 Cleared stale short buffer (noise/politeness)")
                     state.sentence_buffer = ""

            # 拼接
            current_full_text = (state.sentence_buffer + " " + text).strip()
            print(f"🧩 Analyzing: [{current_full_text}]")
            state.latest_text = current_full_text 
            
            # --- 逻辑核心 ---
            
            # 1. 先找本地卡片
            card = match_service.find_best_match(current_full_text)
            
            if card:
                print(f"✅ LOCAL MATCH: {card['topic']}")
                update_card(card) # ✨ 使用新函数更新
                state.sentence_buffer = "" 
            
            else:
                # 2. 没找到，尝试 AI 生成
                if len(current_full_text.split()) > 3:
                    ai_card = match_service.generate_ai_answer(current_full_text)
                    
                    if ai_card:
                        print(f"🧞‍♂️ AI GENERATED: {ai_card['topic']}")
                        update_card(ai_card) # ✨ 使用新函数更新
                        state.sentence_buffer = "" 
                    else:
                        # 3. AI 拒绝生成
                        if len(current_full_text.split()) > 8:
                            print("🧹 Text rejected by AI & too long -> Clearing buffer")
                            state.sentence_buffer = ""
                        else:
                            print("⏳ Text kept in buffer...")
                            state.sentence_buffer = current_full_text
                else:
                    state.sentence_buffer = current_full_text
        
        time.sleep(0.1)
    print("🛑 Stopped")

# --- API 接口区域 ---

@app.get("/")
def read_root(): return {"status": "ready"}

@app.post("/api/start")
def start_interview():
    if state.is_running: return {"msg": "Running"}
    state.is_running = True
    t = threading.Thread(target=background_listener)
    t.daemon = True
    t.start()
    return {"msg": "Started"}

@app.post("/api/stop")
def stop_interview():
    state.is_running = False
    return {"msg": "Stopped"}

@app.get("/api/poll")
def get_latest_result():
    return {
        "is_running": state.is_running,
        "text": state.latest_text,
        "card": state.latest_card
    }

# --- ✨ 新增：回退接口 ---
@app.post("/api/rewind")
def rewind_card():
    """回到上一张卡片"""
    if state.card_history:
        # 弹出栈顶（最近的一张）
        previous_card = state.card_history.pop()
        print(f"⏪ Rewind to: {previous_card['topic']}")
        state.latest_card = previous_card
        return {"success": True, "topic": previous_card['topic']}
    else:
        print("⚠️ No history to rewind")
        return {"success": False, "msg": "No history"}