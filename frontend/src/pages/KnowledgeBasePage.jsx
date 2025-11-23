import React, { useState } from 'react';
import CardEditorModal from '../components/CardEditorModal'; 
import useSystemTheme from '../hooks/useSystemTheme';
import NewCategoryModal from '../components/NewCategoryModal';

// --- 数据定义 (必须在函数外部，避免重复创建) ---
const initialCategories = [];

const initialMockCards = [];

// 外部组件定义 1: Sidebar
const Sidebar = ({ theme, categories, activeCategory, setActiveCategory, setIsNewCategoryModalOpen, handleReturnClick }) => (
    <div style={{
        width: '280px',
        background: theme.cardBg, 
        borderRight: theme.isDark ? '1px solid #444' : '1px solid #ddd', 
        height: '100vh',
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden' // 🔥 防止整体滚动
    }}>
        
        {/* 顶部：标题和创建分类按钮 - 固定不滚动 */}
        <div style={{ 
            padding: '20px 20px 0 20px',
            flexShrink: 0 // 🔥 防止被压缩
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: theme.textColor, margin: 0 }}>📚 分类</h2>
                <button
                    onClick={() => setIsNewCategoryModalOpen(true)} 
                    style={{
                        padding: '5px 10px', borderRadius: '6px', background: theme.accentColor, 
                        color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '18px', lineHeight: '18px'
                    }}
                >
                    +
                </button>
            </div>
        </div>
        
        {/* 中间：分类列表 - 可滚动区域 */}
        <div style={{ 
            flexGrow: 1, 
            overflowY: 'auto', // 🔥 只有这个区域滚动
            padding: '0 20px'
        }}>
            {categories.map(cat => (
                <div 
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    style={{
                        padding: '10px 15px', margin: '5px 0', borderRadius: '8px', cursor: 'pointer', fontSize: '15px',
                        color: cat.id === activeCategory ? '#fff' : theme.textColor,
                        backgroundColor: cat.id === activeCategory ? theme.accentColor : 'transparent',
                        fontWeight: cat.id === activeCategory ? '600' : '400',
                        transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = cat.id === activeCategory ? theme.accentColor : (theme.isDark ? '#333' : '#f0f0f5')}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = cat.id === activeCategory ? theme.accentColor : 'transparent'}
                >
                    {cat.name}
                </div>
            ))}
        </div>
        
        {/* 底部：操作按钮 - 只保留返回按钮 */}
        <div style={{ 
            padding: '15px 20px 20px 20px',
            borderTop: `1px solid ${theme.isDark ? '#444' : '#f0f0f0'}`, 
            flexShrink: 0,
            background: theme.cardBg
        }}>
            <button 
                onClick={handleReturnClick}
                style={{
                    padding: '12px 15px', width: '100%', borderRadius: '8px',
                    background: theme.accentColor, color: 'white', border: 'none', fontWeight: '700',
                    cursor: 'pointer'
                }}
            >
                🎙️ 返回面试模式
            </button>
        </div>
    </div>
);

// 外部组件定义 2: TableView
const TableView = ({ theme, filteredCards, categories, activeCategory, handleEditCard, handleCreateClick }) => (
    <div style={{ 
        padding: '30px 0 30px 30px', 
        flexGrow: 1, 
        overflowY: 'auto', 
        background: theme.bgColor,
        height: '100vh'
    }}> 
        {/* 🔥 标题栏改为 flex 布局，添加新建按钮 */}
        <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '20px', 
            paddingRight: '30px' 
        }}>
            <h1 style={{ fontSize: '28px', color: theme.textColor, margin: 0 }}>
                {/* 🔥 关键逻辑：如果卡片数为 0 且当前选中是 '所有卡片'，则显示欢迎信息 */}
                {filteredCards.length === 0 && activeCategory === 'all' 
                    ? '欢迎开始您的知识库之旅' 
                    : `${categories.find(c => c.id === activeCategory)?.name} (${filteredCards.length})`
                }
            </h1>
            <button 
                onClick={handleCreateClick} 
                style={{
                    padding: '12px 20px', 
                    borderRadius: '8px',
                    background: '#34c759', 
                    color: 'white', 
                    border: 'none', 
                    cursor: 'pointer', 
                    fontWeight: '700',
                    fontSize: '15px',
                    whiteSpace: 'nowrap'
                }}
            >
                + 新建知识卡片
            </button>
        </div>
        
        <div style={{ overflowX: 'auto', background: theme.cardBg, borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: theme.isDark ? '1px solid #444' : '1px solid #e0e0e0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.isDark ? '#444' : '#f0f0f0'}`, color: '#8e8e93', fontSize: '14px', textAlign: 'left' }}>
                        <th style={{ padding: '15px 10px', width: '35%' }}>标题 (Title)</th>
                        <th style={{ padding: '15px 10px', width: '65%' }}>内容摘要 (Component)</th> 
                    </tr>
                </thead>
                <tbody>
                    {filteredCards.map(card => (
                        <tr 
                            key={card.id} 
                            onClick={() => handleEditCard(card)} 
                            style={{ cursor: 'pointer', borderBottom: `1px solid ${theme.isDark ? '#444' : '#f9f9f9'}`, background: theme.cardBg }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.isDark ? '#333' : '#fafafa'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = theme.isDark ? theme.cardBg : 'white'}
                        >
                            <td style={{ padding: '15px 10px', fontWeight: '600', color: theme.textColor }}>{card.topic}</td>
                            <td style={{ padding: '15px 10px', color: theme.isDark ? '#aaa' : '#424245', fontSize: '14px' }}>
                                {card.components && card.components[0]}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {filteredCards.length === 0 && <p style={{color: '#888', marginTop: '30px'}}>当前分类下没有卡片。</p>}
    </div>
);

// 主组件
function KnowledgeBasePage({ handleReturnToInterview }) {
    const theme = useSystemTheme();
    const [categories, setCategories] = useState(initialCategories);
    const [cards, setCards] = useState(initialMockCards);
    const [activeCategory, setActiveCategory] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState(null); 
    const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
    const [creationKey, setCreationKey] = useState(0);

    const filteredCards = activeCategory === 'all' 
        ? cards
        : cards.filter(card => card.category === activeCategory);

    // KnowledgeBasePage.jsx

    const handleSaveCard = (newCard) => {
        if (editingCard) {
            // 编辑模式：替换旧卡片
            setCards(prevCards => prevCards.map(card => 
                card.id === newCard.id ? newCard : card
            ));
            setEditingCard(null); // 清除编辑状态
        } else {
            // 创建模式：添加新卡片
            setCards(prevCards => [newCard, ...prevCards]);
    }
    
    // ⚠️ 关键：这里只关闭模态框。
    // 绝对不要在这里添加 setActiveCategory('all') 或任何其他会修改 activeCategory 的代码。
    setIsModalOpen(false); 

};
    
    const handleCreateCategory = (name) => {
        const newId = name.toLowerCase().replace(/\s/g, '_');
        const newCat = { id: newId, name: name };
        
        if (!categories.find(c => c.id === newId)) {
            setCategories([...categories, newCat]);
            setActiveCategory(newId);
        } else {
            alert(`分类 "${name}" 已存在！`);
        }
        setIsNewCategoryModalOpen(false);
    };
    
    const handleCreateClick = () => {
        setEditingCard(null); 
        setIsModalOpen(true);
        setCreationKey(prev => prev + 1); // 🔥 关键修复：每次新建时强制更新 key
    };

    const handleEditCard = (card) => {
        setEditingCard(card);
        setIsModalOpen(true);
    };

    return (
        <div style={{ 
            display: 'flex', 
            height: '100vh', // 🔥 修改点3：父容器固定高度
            background: theme.bgColor,
            overflow: 'hidden' // 🔥 修改点4：防止父容器滚动
        }}> 
            <Sidebar 
                theme={theme}
                categories={categories}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                setIsNewCategoryModalOpen={setIsNewCategoryModalOpen}
                handleReturnClick={handleReturnToInterview}
            />
            
            <TableView 
                theme={theme}
                filteredCards={filteredCards}
                categories={categories}
                activeCategory={activeCategory}
                handleEditCard={handleEditCard}
                handleCreateClick={handleCreateClick} // 🔥 传递创建函数到 TableView
            />
            
            <CardEditorModal 
                theme={theme}
                key={editingCard ? editingCard.id : creationKey}
                cardData={editingCard}
                // ⚠️ 移除 categories={categories.filter(c => c.id !== 'all')} 
    
                // 🔥 关键修正：传递当前选中的分类作为固定值
                fixedCategory={activeCategory} 

                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveCard} 
            />

            <NewCategoryModal
                isOpen={isNewCategoryModalOpen}
                onClose={() => setIsNewCategoryModalOpen(false)}
                onCreate={handleCreateCategory}
                theme={theme}
            />
        </div>
    );
}

export default KnowledgeBasePage;