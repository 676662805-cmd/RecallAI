import { createClient } from '@supabase/supabase-js'

// Supabase 配置
// 注意：这里使用的是 Publishable (Anon) Key，可以安全地暴露在前端
const supabaseUrl = 'https://dtugyhypojpoynmyshkh.supabase.co'
const supabaseAnonKey = 'sb_publishable_-bxlljWG3ARPn48dM54fJw_G_kEsrmF'

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
