import time  # <--- 新增
import json
import os
from groq import Groq
from dotenv import load_dotenv

# Load env vars
load_dotenv()
# 使用 Groq 客户端
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class MatchService:
    def __init__(self):
        self.cards = self._load_cards()

    def _load_cards(self):
        try:
            current_dir = os.path.dirname(__file__)
            file_path = os.path.join(current_dir, "..", "data", "cards.json")
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading cards: {e}")
            return []

    def find_best_match(self, user_query: str):
        
        # 1. Prepare simplified list
        card_summaries = [
            f"ID: {c['id']} | Topic: {c['topic']} | Content Preview: {c['content'][:50]}..."
            for c in self.cards
        ]
        cards_text = "\n".join(card_summaries)

        # 2. Construct the Prompt (Aggressive Matching)
        # --- 你要求的 Prompt (未修改) ---
        system_prompt = f"""
        You are a real-time assistant for an interviewee.
        Here is the knowledge base (cards):
        {cards_text}

        Your Task:
        Predict the most likely card based on the available text, EVEN IF the sentence is incomplete.

        RULES (Aggressive Matching):
        
        1. **Keyword Priority**: 
           - If the text contains strong unique keywords matching a card (e.g., "Redis", "React hooks", "Introduction"), **MATCH IMMEDIATELY**. 
           - Do not wait for a full sentence structure.
        
        2. **Partial Context**:
           - Input: "Tell me about Re..." -> Return null (uncertain).
           - Input: "Tell me about Redis" -> Match ID: card_redis.

        3. **Intent Filter**:
           - Try to ignore the candidate's own answers. 
           - But if ambiguous, err on the side of showing the card.

        Output JSON format:
        {{
            "best_match_id": "card_id_or_null"
        }}
        """

        # --- 3. 补全：调用 API 发送请求 ---
        try:
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"User Input: {user_query}"}
                ],
                response_format={"type": "json_object"}, 
                temperature=0.0 # 匹配卡片时温度设为0最准
            )
            
            # 4. Parse Result
            result_text = response.choices[0].message.content
            result_json = json.loads(result_text)
            match_id = result_json.get("best_match_id")

            # Return the full card object if found
            if match_id:
                for card in self.cards:
                    if card['id'] == match_id:
                        return card
            
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

        try:
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_query}
                ],
                response_format={"type": "json_object"}, 
                temperature=0.6
            )
            result = json.loads(response.choices[0].message.content)
            
            if result.get("valid"):
                return {
                    "id": f"ai_generated_{int(time.time())}", 
                    "topic": f"✨ AI: {result.get('topic')}", 
                    "content": result.get("content")
                }
            else:
                return None # 标记为无效问题
        except Exception as e:
            print(f"Gen Error: {e}")
            return None