import os
from dotenv import load_dotenv
from openai import OpenAI

# 1. 加载 .env 里的环境变量
load_dotenv()

# 2. 获取 Key
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("[ERROR] 错误：未找到 API Key，请检查 .env 文件")
    exit()

# 3. 初始化 OpenAI 客户端
client = OpenAI(api_key=api_key)

print("🤖 正在呼叫 GPT-4o-mini...")

# 4. 发送测试请求
try:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "你是我的面试助手。"},
            {"role": "user", "content": "用一句话鼓励一下正在熬夜写代码的大学生。"}
        ]
    )
    
    # 5. 打印结果
    print("[OK] 连接成功！AI 回复：")
    print(response.choices[0].message.content)

except Exception as e:
    print(f"[ERROR] 连接失败：{e}")