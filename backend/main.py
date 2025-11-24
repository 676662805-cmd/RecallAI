import threading
import time
import json
import os
import sys
from datetime import datetime
from difflib import SequenceMatcher
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.audio import AudioService
from services.matcher import MatchService

# ============================================
# 获取程序运行的基础路径（支持 PyInstaller 打包）
# ============================================
def get_base_path():
    """获取程序运行的基础路径，支持开发和打包环境"""
    if getattr(sys, 'frozen', False):
        # 打包后的 exe 运行时，使用 exe 所在目录
        return os.path.dirname(sys.executable)
    else:
        # 开发环境，使用当前脚本所在目录
        return os.path.dirname(os.path.abspath(__file__))

# 全局基础路径
BASE_PATH = get_base_path()
DATA_PATH = os.path.join(BASE_PATH, "data")
TRANSCRIPTS_PATH = os.path.join(DATA_PATH, "transcripts")
CARDS_FILE = os.path.join(DATA_PATH, "cards.json")

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
    
    # --- 历史记录栈 (回退用) ---
    card_history = []
    
    # --- ✨ 新增：Transcript 记录 ---
    transcript_log = []      # 存所有的对话记录 [{time, text}, ...]
    start_time = 0           # 面试开始的时间戳

state = GlobalState()

# 辅助函数：格式化时间 (把秒数转为 05:30 格式)
def format_time(seconds):
    m, s = divmod(int(seconds), 60)
    return f"{m:02d}:{s:02d}"

# 辅助函数：保存 Transcript 到本地文件
def save_transcript_to_file():
    if not state.transcript_log:
        return
    
    # 创建存放目录
    os.makedirs(TRANSCRIPTS_PATH, exist_ok=True)
    
    # 文件名：transcript_2023-10-27_10-30.json
    filename = f"transcript_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.json"
    filepath = os.path.join(TRANSCRIPTS_PATH, filename)
    
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(state.transcript_log, f, indent=2, ensure_ascii=False)
        print(f"💾 Transcript saved to: {filepath}")
    except Exception as e:
        print(f"❌ Failed to save transcript: {e}")

# 卡片更新封装函数 (带历史记录)
def update_card(new_card):
    if state.latest_card and state.latest_card.get('id') != new_card.get('id'):
        state.card_history.append(state.latest_card)
        if len(state.card_history) > 10:
            state.card_history.pop(0)
    state.latest_card = new_card

# 防读屏函数
def is_reading_card(speech_text, card_content):
    if not card_content or not speech_text:
        return False
    speech_clean = speech_text.lower().strip()
    card_clean = card_content.lower()

    question_starters = [
        "what", "how", "why", "can you", "could you", 
        "tell me", "define", "explain", "is it", "do you"
    ]
    if any(speech_clean.startswith(q) for q in question_starters):
        return False

    matcher = SequenceMatcher(None, speech_clean, card_clean)
    match = matcher.find_longest_match(0, len(speech_clean), 0, len(card_clean))
    ratio = match.size / len(speech_clean)
    return ratio > 0.8

def background_listener():
    print("🧵 Background listener started")
    BUFFER_TIMEOUT = 5.0 
    
    # ✨ 记录开始时间
    state.start_time = time.time()
    
    while state.is_running:
        text = audio_service.listen_and_transcribe()
        
        if text:
            # --- ✨ 记录 Transcript ---
            # 只要识别到一段文本，就记录下来
            current_time = time.time()
            elapsed = current_time - state.start_time
            timestamp_str = format_time(elapsed)
            
            log_entry = {
                "timestamp": timestamp_str,
                "text": text
            }
            state.transcript_log.append(log_entry)
            # ------------------------

            if state.latest_card and is_reading_card(text, state.latest_card.get('content', '')):
                print(f"🙊 Detected user reading card: '{text}' -> IGNORED")
                state.last_update_time = time.time()
                continue

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
            card = match_service.find_best_match(current_full_text)
            
            if card:
                print(f"✅ LOCAL MATCH: {card['topic']}")
                update_card(card) 
                state.sentence_buffer = "" 
            else:
                # 没找到，尝试 AI 生成
                if len(current_full_text.split()) > 3:
                    ai_card = match_service.generate_ai_answer(current_full_text)
                    
                    if ai_card:
                        print(f"🧞‍♂️ AI GENERATED: {ai_card['topic']}")
                        update_card(ai_card)
                        state.sentence_buffer = "" 
                    else:
                        # AI 拒绝生成
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

@app.get("/health")
def health_check(): return {"status": "healthy", "service": "RecallAI Backend"}

@app.post("/api/start")
def start_interview():
    if state.is_running: return {"msg": "Running"}
    
    # ✨ 重置状态 - 确保清空所有旧数据
    state.is_running = True
    state.transcript_log = []  # 清空 transcript 记录
    state.sentence_buffer = ""
    state.latest_text = ""
    state.latest_card = None
    state.card_history = []
    state.start_time = time.time()
    
    t = threading.Thread(target=background_listener)
    t.daemon = True
    t.start()
    return {"msg": "Started"}

@app.post("/api/stop")
def stop_interview():
    state.is_running = False
    
    # ✨ 停止时保存文件（只有当有记录时才保存）
    if state.transcript_log:
        save_transcript_to_file()
        print(f"📝 Saved {len(state.transcript_log)} transcript entries")
    else:
        print("⚠️ No transcript to save (empty)")
    
    # ✨ 保存后立即清空，防止重复保存
    state.transcript_log = []
    
    return {"msg": "Stopped"}

@app.get("/api/poll")
def get_latest_result():
    return {
        "is_running": state.is_running,
        "text": state.latest_text,
        "card": state.latest_card,
        # ✨ 返回 transcript 给前端展示
        "transcript": state.transcript_log 
    }

@app.post("/api/rewind")
def rewind_card():
    """回到上一张卡片"""
    if state.card_history:
        previous_card = state.card_history.pop()
        print(f"⏪ Rewind to: {previous_card['topic']}")
        state.latest_card = previous_card
        return {"success": True, "topic": previous_card['topic']}
    else:
        print("⚠️ No history to rewind")
        return {"success": False, "msg": "No history"}

@app.get("/api/cards")
def get_cards():
    """获取所有 cards"""
    if os.path.exists(CARDS_FILE):
        try:
            with open(CARDS_FILE, 'r', encoding='utf-8') as f:
                cards = json.load(f)
            return {"cards": cards}
        except Exception as e:
            print(f"Error reading cards: {e}")
            return {"cards": []}
    return {"cards": []}

@app.post("/api/cards")
def save_cards(cards_data: dict):
    """保存 cards 到后端（从前端同步）"""
    os.makedirs(DATA_PATH, exist_ok=True)
    
    try:
        cards = cards_data.get("cards", [])
        # 转换前端格式到后端格式
        backend_cards = []
        for card in cards:
            backend_card = {
                "id": card.get("id"),
                "topic": card.get("topic"),
                "content": "\n".join(card.get("components", [])) if isinstance(card.get("components"), list) else card.get("content", "")
            }
            backend_cards.append(backend_card)
        
        with open(CARDS_FILE, 'w', encoding='utf-8') as f:
            json.dump(backend_cards, f, indent=2, ensure_ascii=False)
        
        # 重新加载 matcher service 的 cards
        match_service.load_cards()
        
        print(f"✅ Saved {len(backend_cards)} cards to backend")
        return {"success": True, "count": len(backend_cards)}
    except Exception as e:
        print(f"❌ Error saving cards: {e}")
        return {"success": False, "error": str(e)}

@app.get("/api/transcripts")
def get_transcripts():
    """获取所有保存的 transcript 文件列表"""
    if not os.path.exists(TRANSCRIPTS_PATH):
        return {"transcripts": []}
    
    try:
        transcript_list = []
        files = sorted(os.listdir(TRANSCRIPTS_PATH), reverse=True)  # 最新的在前
        
        for filename in files:
            if filename.endswith('.json'):
                filepath = os.path.join(TRANSCRIPTS_PATH, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        transcript_data = json.load(f)
                    
                    # 从文件名提取时间戳：transcript_2025-11-23_20-32-58.json
                    timestamp_str = filename.replace('transcript_', '').replace('.json', '')
                    
                    # 解析日期和时间：2025-11-23_20-32-58
                    parts = timestamp_str.split('_')
                    if len(parts) == 2:
                        date_part = parts[0]  # 2025-11-23
                        time_part = parts[1]  # 20-32-58
                        
                        # 转换日期格式：2025-11-23 -> 11/23/2025
                        date_components = date_part.split('-')
                        if len(date_components) == 3:
                            formatted_date = f"{date_components[1]}/{date_components[2]}/{date_components[0]}"
                            # 转换时间格式：20-32-58 -> 20:32:58
                            formatted_time = time_part.replace('-', ':')
                            display_name = f"{formatted_date} {formatted_time}"
                        else:
                            display_name = timestamp_str.replace('_', ' ').replace('-', ':')
                    else:
                        display_name = timestamp_str.replace('_', ' ').replace('-', ':')
                    
                    transcript_list.append({
                        "id": filename.replace('.json', ''),  # 使用文件名作为ID
                        "name": display_name,
                        "timestamp": timestamp_str,
                        "transcript": transcript_data
                    })
                except Exception as e:
                    print(f"Error reading {filename}: {e}")
                    continue
        
        print(f"📋 Found {len(transcript_list)} transcripts")
        return {"transcripts": transcript_list}
    except Exception as e:
        print(f"❌ Error listing transcripts: {e}")
        return {"transcripts": []}

# ============================================
# 主程序入口
# ============================================
if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting RecallAI Backend Server...")
    print(f"📍 Server will run on: http://localhost:8000")
    print(f"📍 Health check: http://localhost:8000/health")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info"
    )
