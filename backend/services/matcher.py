import json
import os
from openai import OpenAI
from dotenv import load_dotenv

# Load env vars
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class MatchService:
    def __init__(self):
        # Load cards into memory when service starts
        # 加载卡片数据到内存中
        self.cards = self._load_cards()

    def _load_cards(self):
        # Read the JSON file
        # 读取本地的 JSON 文件
        try:
            current_dir = os.path.dirname(__file__)
            file_path = os.path.join(current_dir, "..", "data", "cards.json")
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading cards: {e}")
            return []

    def find_best_match(self, user_query: str):
        """
        Send query + card summaries to GPT-4o-mini to find the best ID.
        核心逻辑：把问题和卡片发给 AI 让它选一个 ID。
        """
        
        # 1. Prepare a simplified list for the AI (save tokens)
        # 只发送 ID 和 Topic 给 AI，节省 token 费用
        card_summaries = [
            f"ID: {c['id']} | Topic: {c['topic']} | Content Preview: {c['content'][:50]}..."
            for c in self.cards
        ]
        cards_text = "\n".join(card_summaries)

        # 2. Construct the Prompt
        # 这是最关键的提示词
        system_prompt = f"""
        You are an intelligent assistant for an interviewee.
        Here is the knowledge base (cards):
        {cards_text}

        Your Task:
        Predict the most likely card based on the available text, EVEN IF the sentence is incomplete.

        RULES (Aggressive Matching):
        
        1. **Keyword Priority**: 
           - If the text contains strong unique keywords matching a card (e.g., "Redis", "React hooks", "Introduction"), **MATCH IMMEDIATELY**. 
           - Do not wait for a full sentence structure like "Can you tell me about...".
        
        2. **Partial Context**:
           - Input: "Tell me about Re..." (STT might catch 'Re' or 'Red') -> If uncertain, return null.
           - Input: "Tell me about Redis" -> Match ID: card_redis.
           - Input: "Tell me about Redis and how you handled..." -> Keep matching ID: card_redis.

        3. **Change of Mind**:
           - If the previous match was "Redis", but the user continues "...actually, let's talk about Python", you must switch to the Python card.

        4. **Intent Filter**:
           - Still try to ignore the candidate's own answers (e.g., statements starting with "I used...", "I did..."). 
           - But if it's ambiguous, err on the side of showing the card (it's better to show something useful than nothing).

        Output JSON format:
        {{
            "best_match_id": "card_id_or_null"
        }}
        """

        # 3. Call OpenAI
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"User Input: {user_query}"}
                ],
                response_format={"type": "json_object"}, # Force JSON output
                temperature=0.1 # Low temperature for consistency
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