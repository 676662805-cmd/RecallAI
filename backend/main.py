from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# 允许跨域请求 (CORS)
# 这一步非常重要！否则你室友的前端 React 访问你会报错 "CORS Error"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源，开发阶段图省事
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"msg": "Backend is running!"}

@app.get("/test")
def test_connection():
    # 这就是你要给前端返回的信号
    return {"msg": "I am alive"}