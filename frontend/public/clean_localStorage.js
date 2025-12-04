
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
