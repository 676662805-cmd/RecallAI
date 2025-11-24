import os
from fastapi import FastAPI, Header, HTTPException, UploadFile, File, Body
from pydantic import BaseModel
from typing import List, Dict, Any
from groq import Groq
from server_auth import verify_user_token

app = FastAPI()

# 1. 从环境变量读取 Groq Key (以后在 Render 后台填)
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

if not GROQ_API_KEY:
    print("⚠️ 警告: GROQ_API_KEY 未设置")

# 初始化 Groq 客户端
server_client = Groq(api_key=GROQ_API_KEY)

# --- 数据模型 ---
class ChatPayload(BaseModel):
    model: str
    messages: List[Dict[str, Any]]
    response_format: Dict[str, Any] = None
    temperature: float = 0.6

# --- 根路径 (用于 Render 健康检查) ---
@app.get("/")
def health_check():
    return {"status": "Cloud Brain is Active 🟢"}

# --- 接口 1: 语音转文字代理 (Proxy Transcribe) ---
@app.post("/v1/proxy/transcribe")
async def proxy_transcribe(
    file: UploadFile = File(...), 
    authorization: str = Header(None)
):
    # 1. 鉴权 (查 Supabase)
    if not authorization:
        raise HTTPException(401, "Missing Authorization Header")
    
    token = authorization.replace("Bearer ", "")
    try:
        user = verify_user_token(token)
        if not user:
            raise HTTPException(401, "Invalid or Expired Token")
    except Exception as e:
        raise HTTPException(401, f"Auth Failed: {str(e)}")

    # 2. 转发给 Groq (消耗你的额度)
    try:
        # 读取上传的音频文件内容
        file_content = await file.read()
        
        # 传递给 Groq (注意：Groq SDK 需要 file-like object)
        # 这里为了简单，我们不存盘，直接传流，或者你可以根据 SDK 要求调整
        # Groq Python SDK 通常接受 tuple ('filename', bytes)
        
        transcript = server_client.audio.transcriptions.create(
            model="whisper-large-v3-turbo",
            file=(file.filename, file_content), 
            response_format="json",
            language="en"
        )
        
        return {"text": transcript.text}

    except Exception as e:
        print(f"Groq Error: {e}")
        raise HTTPException(500, "AI Engine Error")

# --- 接口 2: 对话/生成代理 (Proxy Chat) ---
@app.post("/v1/proxy/chat")
async def proxy_chat(
    payload: ChatPayload, 
    authorization: str = Header(None)
):
    # 1. 鉴权
    if not authorization:
        raise HTTPException(401, "Missing Authorization Header")
    
    token = authorization.replace("Bearer ", "")
    try:
        user = verify_user_token(token)
        if not user:
            raise HTTPException(401, "Invalid Token")
    except Exception as e:
        raise HTTPException(401, f"Auth Failed: {str(e)}")

    # 2. 转发给 Groq
    try:
        response = server_client.chat.completions.create(
            model=payload.model, # 使用客户端请求的模型 (如 llama-3.1-8b-instant)
            messages=payload.messages,
            response_format=payload.response_format,
            temperature=payload.temperature
        )
        
        # 返回完整响应结构或只返回内容，这里为了兼容性返回关键内容
        return {
            "content": response.choices[0].message.content,
            # 如果需要，也可以返回 usage 信息用于统计
        }

    except Exception as e:
        print(f"Groq Chat Error: {e}")
        raise HTTPException(500, f"AI Generation Error: {str(e)}")