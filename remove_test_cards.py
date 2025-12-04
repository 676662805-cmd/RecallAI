import json

# 读取 cards.json
with open('D:/RecallAI/backend/data/cards.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)

# 删除 card_1 和 card_2
cards = [card for card in cards if card['id'] not in ['card_1', 'card_2']]

# 写回文件
with open('D:/RecallAI/backend/data/cards.json', 'w', encoding='utf-8') as f:
    json.dump(cards, f, indent=2, ensure_ascii=False)

print(f"✅ 删除完成！剩余 {len(cards)} 张卡片")
