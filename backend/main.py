from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 注意：不再需要 random 库了，删掉它
# import random 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"msg": "Backend is running!"}

@app.get("/test")
def test_connection():
    return {"msg": "I am alive"}

# --- 核心接口：AI 轮询 ---
@app.get("/api/poll")
def poll_ai():
    """
    Day 3: 这里是预留给 B 同学写 AI 逻辑的地方。
    目前返回空对象 {}，表示没有匹配到卡片。
    """
    # TODO: B 同学将在这里接入 GPT-4o-mini
    # 暂时返回空，让前端保持安静
    return {}