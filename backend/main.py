from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from services.matcher import MatchService # Import our new service

app = FastAPI()

# CORS Setup (Allow frontend access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Service
# 初始化服务实例
matcher = MatchService()

# Define Request Model
# 定义前端发过来的数据格式
class QueryRequest(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {"status": "AI Interviewer Backend is Running"}

@app.post("/api/match")
def match_card(request: QueryRequest):
    """
    Receives text from frontend, returns the best matched card.
    接收前端文本 -> 调用 AI -> 返回卡片
    """
    print(f"📥 Received query: {request.text}")
    
    matched_card = matcher.find_best_match(request.text)
    
    if matched_card:
        print(f"✅ Matched: {matched_card['topic']}")
        return {"success": True, "card": matched_card}
    else:
        print("❌ No match found")
        return {"success": False, "card": None}