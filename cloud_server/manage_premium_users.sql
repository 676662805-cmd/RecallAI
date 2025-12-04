-- ========================================
-- RecallAI - 用户权限管理 SQL 脚本
-- ========================================

-- 1. 查看所有用户及其 Premium 状态
-- 在 Supabase SQL Editor 中运行
SELECT 
    p.id,
    p.email,
    p.is_premium,
    p.subscription_end_date,
    p.created_at
FROM profiles p
ORDER BY p.created_at DESC;

-- ========================================
-- 2. 授予用户 Premium 权限（1年有效期）
-- ========================================
-- 替换 'USER_EMAIL_HERE' 为实际的用户邮箱

UPDATE profiles
SET 
    is_premium = TRUE,
    subscription_end_date = NOW() + INTERVAL '1 year'
WHERE email = 'USER_EMAIL_HERE';

-- 示例：授予 test@example.com Premium 权限
-- UPDATE profiles
-- SET 
--     is_premium = TRUE,
--     subscription_end_date = NOW() + INTERVAL '1 year'
-- WHERE email = 'test@example.com';


-- ========================================
-- 3. 授予永久 Premium 权限（无过期时间）
-- ========================================

UPDATE profiles
SET 
    is_premium = TRUE,
    subscription_end_date = NULL  -- NULL 表示永久有效
WHERE email = 'USER_EMAIL_HERE';


-- ========================================
-- 4. 取消用户的 Premium 权限
-- ========================================

UPDATE profiles
SET 
    is_premium = FALSE,
    subscription_end_date = NULL
WHERE email = 'USER_EMAIL_HERE';


-- ========================================
-- 5. 延长用户的 Premium 有效期（额外30天）
-- ========================================

UPDATE profiles
SET subscription_end_date = subscription_end_date + INTERVAL '30 days'
WHERE email = 'USER_EMAIL_HERE';


-- ========================================
-- 6. 批量授予多个用户 Premium 权限
-- ========================================

UPDATE profiles
SET 
    is_premium = TRUE,
    subscription_end_date = NOW() + INTERVAL '1 year'
WHERE email IN (
    'user1@example.com',
    'user2@example.com',
    'user3@example.com'
);


-- ========================================
-- 7. 查找即将过期的 Premium 用户（7天内）
-- ========================================

SELECT 
    email,
    subscription_end_date,
    subscription_end_date - NOW() as time_remaining
FROM profiles
WHERE 
    is_premium = TRUE 
    AND subscription_end_date IS NOT NULL
    AND subscription_end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY subscription_end_date ASC;


-- ========================================
-- 8. 自动清理过期的 Premium 权限（可选）
-- ========================================
-- 注意：这会立即执行，请谨慎使用

UPDATE profiles
SET is_premium = FALSE
WHERE 
    is_premium = TRUE 
    AND subscription_end_date IS NOT NULL
    AND subscription_end_date < NOW();


-- ========================================
-- 9. 创建触发器：新用户自动创建 Profile（如果还没有）
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, is_premium, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        FALSE,  -- 默认为非 Premium
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
