"""
强制清除 localStorage 中的测试卡片
并防止同步回后端
"""
import asyncio
import json
import os

def clean_backend_cards():
    """清除后端的测试卡片"""
    cards_file = "D:/RecallAI/backend/data/cards.json"
    
    with open(cards_file, 'r', encoding='utf-8') as f:
        cards = json.load(f)
    
    original_count = len(cards)
    cards = [card for card in cards if card['id'] not in ['card_1', 'card_2']]
    
    with open(cards_file, 'w', encoding='utf-8') as f:
        json.dump(cards, f, indent=2, ensure_ascii=False)
    
    print(f"✅ 后端清理完成: {original_count} -> {len(cards)} 张卡片")
    return len(cards)

def create_localStorage_cleaner():
    """创建浏览器 localStorage 清理脚本"""
    script = """
// 在浏览器控制台运行这段代码
(function() {
    console.log('🧹 开始清理 localStorage...');
    
    // 读取当前卡片
    const cardsStr = localStorage.getItem('knowledgebase_cards');
    if (!cardsStr) {
        console.log('❌ 没有找到卡片数据');
        return;
    }
    
    let cards = JSON.parse(cardsStr);
    const originalCount = cards.length;
    
    // 删除测试卡片
    cards = cards.filter(card => card.id !== 'card_1' && card.id !== 'card_2');
    
    // 保存回 localStorage
    localStorage.setItem('knowledgebase_cards', JSON.stringify(cards));
    
    console.log(`✅ localStorage 清理完成: ${originalCount} -> ${cards.length} 张卡片`);
    console.log('🔄 请刷新页面以应用更改');
    
    // 自动刷新
    setTimeout(() => location.reload(), 1000);
})();
"""
    
    output_file = "D:/RecallAI/frontend/public/clean_localStorage.js"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(script)
    
    print(f"\n📝 已生成 localStorage 清理脚本: {output_file}")
    print("\n使用方法：")
    print("1. 打开应用: http://localhost:5173")
    print("2. 按 F12 打开开发者工具")
    print("3. 在 Console 中粘贴并运行脚本")
    print("\n或者直接复制以下代码到控制台：")
    print("-" * 60)
    print(script)
    print("-" * 60)

if __name__ == "__main__":
    print("=" * 60)
    print("RecallAI 测试卡片清理工具")
    print("=" * 60)
    
    # 1. 清理后端
    clean_backend_cards()
    
    # 2. 生成前端清理脚本
    create_localStorage_cleaner()
    
    print("\n" + "=" * 60)
    print("✅ 清理完成！")
    print("=" * 60)
    print("\n⚠️  重要提示：")
    print("必须清理 localStorage，否则刷新时会把测试卡片同步回后端！")
