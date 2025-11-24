import os
from supabase import create_client, Client

# 读取环境变量
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY") 

if not url or not key:
    print("⚠️ 警告: Supabase URL 或 Key 未设置，鉴权将失败")
    supabase = None
else:
    supabase: Client = create_client(url, key)

# 👇 关键在这里：函数名必须叫 verify_user_token
def verify_user_token(token: str):
    """
    验证用户 Token 是否有效
    """
    if not supabase:
        raise Exception("Supabase 未配置")

    # 验证 Token
    user_response = supabase.auth.get_user(token)
    
    if not user_response or not user_response.user:
        return None # Token 无效

    return user_response.user