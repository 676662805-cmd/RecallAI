import os
from supabase import create_client, Client
from datetime import datetime

# 读取环境变量
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY") 

if not url or not key:
    print("⚠️ 警告: Supabase URL 或 Key 未设置，鉴权将失败")
    supabase = None
else:
    supabase: Client = create_client(url, key)

def verify_user_token(token: str):
    """
    验证用户 Token 是否有效，并检查是否有 Premium 权限
    返回: user 对象 (如果有权限) 或 None
    """
    if not supabase:
        raise Exception("Supabase 未配置")

    # 1. 验证 Token
    user_response = supabase.auth.get_user(token)
    
    if not user_response or not user_response.user:
        return None  # Token 无效

    user = user_response.user
    
    # 2. 从 profiles 表检查用户的 Premium 状态
    try:
        profile_response = supabase.table('profiles').select('*').eq('id', user.id).execute()
        
        # 如果没有 profile 记录，拒绝访问
        if not profile_response.data or len(profile_response.data) == 0:
            print(f"⚠️ 用户 {user.email} 没有 profile 记录，拒绝访问")
            return None
        
        profile = profile_response.data[0]
        
        # 3. 检查 is_premium 字段
        if not profile.get('is_premium'):
            print(f"⚠️ 用户 {user.email} 不是 Premium 用户")
            return None
        
        # 4. 检查订阅是否过期
        subscription_end_date = profile.get('subscription_end_date')
        if subscription_end_date:
            # 解析日期字符串
            try:
                end_date = datetime.fromisoformat(subscription_end_date.replace('Z', '+00:00'))
                now = datetime.now(end_date.tzinfo)
                
                if now > end_date:
                    print(f"⚠️ 用户 {user.email} 的 Premium 订阅已过期 (过期时间: {subscription_end_date})")
                    return None
                    
                print(f"✅ 验证通过: {user.email} (Premium, 有效期至 {subscription_end_date})")
            except Exception as e:
                print(f"⚠️ 解析订阅日期失败: {e}")
                return None
        else:
            # 如果没有设置过期时间，视为永久 Premium
            print(f"✅ 验证通过: {user.email} (Premium, 永久有效)")
        
        return user
        
    except Exception as e:
        print(f"❌ 检查 Premium 状态失败: {e}")
        return None