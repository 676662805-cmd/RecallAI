import time
import json
import os
import sys
import requests
from dotenv import load_dotenv

# 全局 state 引用（避免循环导入）
_global_state = None

def set_global_state(state):
    """从 main.py 设置全局 state 引用"""
    global _global_state
    _global_state = state

def get_base_path():
    """获取程序运行的基础路径，支持开发和打包环境"""
    if getattr(sys, 'frozen', False):
        # 打包后的 exe 运行时
        return os.path.dirname(sys.executable)
    else:
        # 开发环境
        return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 加载 .env 文件（支持打包后的路径）
env_path = os.path.join(get_base_path(), '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
    print(f"[OK] Loaded .env from: {env_path}")
else:
    load_dotenv()  # 尝试从默认位置加载
    print(f"[WARN] .env not found at {env_path}, using default")

# 获取 Render 云端 URL
RENDER_URL = os.getenv("RENDER_URL", "https://recallai-d9sc.onrender.com")

class MatchService:
    def __init__(self):
        self.cards = self._load_cards()
        # ---  云端化：用户 Token ---
        self.user_token = None
    
    def set_token(self, token: str):
        """设置用户 Token，用于云端 API 鉴权"""
        self.user_token = token

    def _load_cards(self):
        try:
            base_path = get_base_path()
            file_path = os.path.join(base_path, "data", "cards.json")
            print(f"[FILE] Loading cards from: {file_path}")
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading cards: {e}")
            return []
    
    def load_cards(self):
        """重新加载 cards（用于前端同步后刷新）"""
        self.cards = self._load_cards()
        print(f"[RELOAD] Reloaded {len(self.cards)} cards from file")

    def find_best_match(self, user_query: str):
        
        # 1. Prepare simplified list with index-based IDs
        card_summaries = []
        for idx, c in enumerate(self.cards):
            card_summaries.append(
                f"[{idx}] Topic: {c['topic']} | Preview: {c['content'][:80]}..."
            )
        cards_text = "\n".join(card_summaries)

        # 2. Construct the Prompt (Aggressive Matching)
        system_prompt = f"""
        You are a real-time assistant for an interviewee.
        Here is the knowledge base (cards):
        {cards_text}

        Your Task:
        Predict the most likely card based on the available text, EVEN IF the sentence is incomplete.

        RULES (Aggressive Matching):
        
        1. **Keyword Priority**: 
           - If the text contains strong unique keywords matching a card topic or content, **MATCH IMMEDIATELY**. 
           - Example: "delegation" -> match [0], "async" or "promise" -> match [1], "sharding" or "database" -> match [2]
           - Do not wait for a full sentence structure.
        
        2. **Partial Context**:
           - Input: "Tell me about..." -> Look for keywords in the rest.
           - Input: "Explain delegation" -> Match [0] immediately.

        3. **Intent Filter**:
           - Try to ignore the candidate's own answers. 
           - But if ambiguous, err on the side of showing the card.

        Output JSON format (use the number in brackets):
        {{
            "best_match_index": 0
        }}
        OR if no match:
        {{
            "best_match_index": null
        }}
        """

        # --- 3. 补全：调用云端 API 发送请求 ---
        if not self.user_token:
            print("[ERROR] No user token set! Cannot call cloud API")
            return None
        
        try:
            # 准备请求数据
            payload = {
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"User Input: {user_query}"}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.0
            }
            
            headers = {'Authorization': f'Bearer {self.user_token}'}
            
            # 发送请求到 Render 云端
            response = requests.post(
                f"{RENDER_URL}/v1/proxy/chat",
                json=payload,
                headers=headers,
                timeout=30
            )
            
            if response.status_code != 200:
                if _global_state is not None:
                    _global_state.cloud_api_error = {"status": response.status_code, "message": response.text}
                return None
            
            # 4. Parse Result
            result_data = response.json()
            result_text = result_data.get("content", "{}")
            result_json = json.loads(result_text)
            match_index = result_json.get("best_match_index")
            
            print(f"[SEARCH] AI Match Result: index={match_index}")
            print(f"[INFO] Available cards: {len(self.cards)} cards")

            # Return the full card object if found
            if match_index is not None and isinstance(match_index, int) and 0 <= match_index < len(self.cards):
                matched_card = self.cards[match_index]
                print(f"[OK] Found matching card: {matched_card['topic']}")
                return matched_card
            else:
                print(f"[WARN] No valid match (index={match_index})")
            
            return None

        except Exception as e:
            print(f"AI Match Error: {e}")
            return None

    def generate_ai_answer(self, user_query: str):
        """AI 现场生成逻辑"""
        print(f"🤖 AI generating for: {user_query}")
        
        system_prompt = """
        You are an Interview Coach.
        Task:
        1. **Check**: Is this input a QUESTION from an interviewer? 
           - If it is the candidate answering (e.g. "I did...", "So..."), return valid: false.
        2. **Generate**: If valid, generate a short STAR method answer.
        
        Output JSON:
        { "valid": true, "topic": "...", "content": "..." }
        OR
        { "valid": false }
        """

        if not self.user_token:
            print("[ERROR] No user token set! Cannot call cloud API")
            return None

        try:
            # 准备请求数据
            payload = {
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_query}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.6
            }
            
            headers = {'Authorization': f'Bearer {self.user_token}'}
            
            # 发送请求到 Render 云端
            response = requests.post(
                f"{RENDER_URL}/v1/proxy/chat",
                json=payload,
                headers=headers,
                timeout=30
            )
            
            if response.status_code != 200:
                if _global_state is not None:
                    _global_state.cloud_api_error = {"status": response.status_code, "message": response.text}
                return None
            
            result_data = response.json()
            result_text = result_data.get("content", "{}")
            result = json.loads(result_text)
            
            if result.get("valid"):
                return {
                    "id": f"ai_generated_{int(time.time())}", 
                    "topic": f"[NEW] AI: {result.get('topic')}", 
                    "content": result.get("content")
                }
            else:
                return None # 标记为无效问题
        except Exception as e:
            print(f"Gen Error: {e}")
            return None