"""
清理 Electron 应用的 localStorage
Electron 的数据存储在用户目录下
"""
import os
import json
import shutil
from pathlib import Path

def find_electron_storage():
    """查找 Electron localStorage 位置"""
    # Windows: C:\Users\Username\AppData\Roaming\RecallAI
    appdata = os.getenv('APPDATA')
    if appdata:
        electron_dir = Path(appdata) / 'recallai'
        if electron_dir.exists():
            return electron_dir
    
    # 备用位置
    user_dir = Path.home()
    possible_paths = [
        user_dir / 'AppData' / 'Roaming' / 'recallai',
        user_dir / 'AppData' / 'Roaming' / 'RecallAI',
        user_dir / '.config' / 'recallai',
    ]
    
    for path in possible_paths:
        if path.exists():
            return path
    
    return None

def clean_electron_storage():
    """清理 Electron localStorage"""
    print("=" * 60)
    print("Electron localStorage 清理工具")
    print("=" * 60)
    
    electron_dir = find_electron_storage()
    
    if electron_dir:
        print(f"\n✅ 找到 Electron 数据目录: {electron_dir}")
        print("\n目录内容:")
        for item in electron_dir.iterdir():
            print(f"  - {item.name}")
        
        print("\n⚠️  清理选项:")
        print("1. 完全删除应用数据目录（推荐，彻底清理）")
        print("2. 仅查看，不删除")
        
        choice = input("\n请选择 (1/2): ").strip()
        
        if choice == '1':
            try:
                shutil.rmtree(electron_dir)
                print(f"\n✅ 已删除: {electron_dir}")
                print("下次启动应用时，将从后端加载干净的数据")
            except Exception as e:
                print(f"\n❌ 删除失败: {e}")
                print("请关闭应用后重试")
        else:
            print("\n取消删除")
    else:
        print("\n⚠️  未找到 Electron 数据目录")
        print("可能的原因：")
        print("1. 应用从未运行过")
        print("2. 数据在非标准位置")
        print("\n尝试手动查找:")
        appdata = os.getenv('APPDATA')
        if appdata:
            print(f"检查目录: {appdata}")

def clean_backend():
    """同时清理后端"""
    cards_file = Path("D:/RecallAI/backend/data/cards.json")
    
    if not cards_file.exists():
        print("\n⚠️  后端 cards.json 不存在")
        return
    
    with open(cards_file, 'r', encoding='utf-8') as f:
        cards = json.load(f)
    
    original_count = len(cards)
    cards = [card for card in cards if card['id'] not in ['card_1', 'card_2']]
    
    if original_count != len(cards):
        with open(cards_file, 'w', encoding='utf-8') as f:
            json.dump(cards, f, indent=2, ensure_ascii=False)
        print(f"\n✅ 后端清理完成: {original_count} -> {len(cards)} 张卡片")
    else:
        print(f"\n✅ 后端已干净: {len(cards)} 张卡片")

if __name__ == "__main__":
    # 清理后端
    clean_backend()
    
    # 清理 Electron
    clean_electron_storage()
    
    print("\n" + "=" * 60)
    print("完成！")
    print("=" * 60)
    print("\n📌 重要提示：")
    print("1. 确保 RecallAI 应用已关闭")
    print("2. 重新启动应用")
    print("3. 应用将从后端 cards.json 加载干净的数据")
