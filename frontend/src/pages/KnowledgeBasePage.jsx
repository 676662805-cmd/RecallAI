import React, { useState, useEffect } from 'react';
import CardEditorModal from '../components/CardEditorModal'; 
import useSystemTheme from '../hooks/useSystemTheme';
import NewCategoryModal from '../components/NewCategoryModal';

// --- 数据定义 (必须在函数外部，避免重复创建) ---
const initialCategories = [];

const initialMockCards = [];

// 外部组件定义 1: Sidebar
const Sidebar = ({ theme, categories, activeCategory, setActiveCategory, setIsNewCategoryModalOpen, handleReturnClick, onDeleteCategory, onRenameCategory }) => {
    const [menuOpen, setMenuOpen] = useState(null);

    const handleMenuClick = (e, catId) => {
        e.stopPropagation();
        if (menuOpen === catId) {
            setMenuOpen(null);
        } else {
            setMenuOpen(catId);
        }
    };

    const handleRename = (catId, currentName) => {
        const newName = window.prompt('请输入新的分类名称:', currentName);
        if (newName && newName.trim() && newName.trim() !== currentName) {
            onRenameCategory(catId, newName.trim());
        }
        setMenuOpen(null);
    };

    const handleDelete = (catId) => {
        if (window.confirm('确定要删除这个分类吗？分类下的所有卡片也会被删除。')) {
            onDeleteCategory(catId);
            setMenuOpen(null);
        }
    };

    return (
        <div style={{
            width: '280px',
            background: theme.cardBg, 
            borderRight: theme.isDark ? '1px solid #444' : '1px solid #ddd', 
            height: '100vh',
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* 顶部：标题和创建分类按钮 - 固定不滚动 */}
            <div style={{ 
                padding: '20px 20px 0 20px',
                flexShrink: 0
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
                overflowY: 'auto',
                padding: '0 20px'
            }}>
                {categories.map(cat => (
                    <div 
                        key={cat.id}
                        style={{ position: 'relative' }}
                    >
                        <div
                            onClick={() => setActiveCategory(cat.id)}
                            style={{
                                padding: '10px 35px 10px 15px', margin: '5px 0', borderRadius: '8px', cursor: 'pointer', fontSize: '15px',
                                color: cat.id === activeCategory ? '#fff' : theme.textColor,
                                backgroundColor: cat.id === activeCategory ? theme.accentColor : 'transparent',
                                fontWeight: cat.id === activeCategory ? '600' : '400',
                                transition: 'background-color 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = cat.id === activeCategory ? theme.accentColor : (theme.isDark ? '#333' : '#f0f0f5')}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = cat.id === activeCategory ? theme.accentColor : 'transparent'}
                        >
                            <span>{cat.name}</span>
                            <button
                                onClick={(e) => handleMenuClick(e, cat.id)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: cat.id === activeCategory ? '#fff' : theme.textColor,
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    padding: '0 5px',
                                    lineHeight: '1'
                                }}
                            >
                                ⋮
                            </button>
                        </div>
                        
                        {/* 下拉菜单 */}
                        {menuOpen === cat.id && (
                            <div style={{
                                position: 'absolute',
                                right: '10px',
                                top: '40px',
                                background: theme.cardBg,
                                border: theme.isDark ? '1px solid #444' : '1px solid #ddd',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                zIndex: 1000,
                                minWidth: '150px'
                            }}>
                                <button
                                    onClick={() => handleRename(cat.id, cat.name)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 15px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: theme.textColor,
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        borderBottom: theme.isDark ? '1px solid #444' : '1px solid #f0f0f0'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = theme.isDark ? '#333' : '#f5f5f5'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    ✏️ Rename
                                </button>
                                <button
                                    onClick={() => handleDelete(cat.id)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 15px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#ff3b30',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = theme.isDark ? '#333' : '#f5f5f5'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                        )}
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
};

// 外部组件定义 2: TableView
const TableView = ({ theme, filteredCards, categories, activeCategory, handleEditCard, handleCreateClick, onDeleteCard }) => {
    const [menuOpen, setMenuOpen] = useState(null);
    
    // 🔥 计算当前分类的名称
    const activeCategoryName = activeCategory 
        ? categories.find(cat => cat.id === activeCategory)?.name || '未知分类'
        : '';
    
    const handleMenuClick = (e, cardId) => {
        e.stopPropagation();
        setMenuOpen(menuOpen === cardId ? null : cardId);
    };

    const handleDelete = (e, cardId) => {
        e.stopPropagation();
        if (window.confirm('确定要删除这张卡片吗？')) {
            onDeleteCard(cardId);
            setMenuOpen(null);
        }
    };

    const handleEdit = (e, card) => {
        e.stopPropagation();
        handleEditCard(card);
        setMenuOpen(null);
    };
    
    return (
        <div style={{ 
            padding: '30px 0 30px 30px', 
            flexGrow: 1, 
            overflowY: 'auto', 
            background: theme.bgColor,
            height: '100vh'
        }}> 
            {/* 标题栏 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingRight: '30px' }}>
                <h1 style={{ fontSize: '28px', color: theme.textColor, margin: 0 }}>
                    {!activeCategory 
                        ? '🎉 欢迎开始您的知识库之旅' 
                        : `${activeCategoryName} (${filteredCards.length})`
                    }
                </h1>
                
                {/* 🔥 只有存在分类且选中了分类时才显示新建按钮 */}
                {categories.length > 0 && activeCategory && (
                    <button 
                        onClick={handleCreateClick} 
                        style={{
                            padding: '12px 20px', 
                            borderRadius: '8px',
                            border: 'none', 
                            fontWeight: '700',
                            fontSize: '15px',
                            whiteSpace: 'nowrap',
                            background: '#34c759', 
                            color: 'white', 
                            cursor: 'pointer'
                        }}
                    >
                        + 新建知识卡片
                    </button>
                )}
            </div>
        
            <div style={{ overflowX: 'auto', background: theme.cardBg, borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: theme.isDark ? '1px solid #444' : '1px solid #e0e0e0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${theme.isDark ? '#444' : '#f0f0f0'}`, color: '#8e8e93', fontSize: '14px', textAlign: 'left' }}>
                            <th style={{ padding: '15px 10px', width: '35%' }}>标题 (Title)</th>
                            <th style={{ padding: '15px 10px', width: '55%' }}>内容摘要 (Component)</th>
                            <th style={{ padding: '15px 10px', width: '10%' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCards.map(card => (
                            <tr 
                                key={card.id} 
                                style={{ 
                                    cursor: 'pointer', 
                                    borderBottom: `1px solid ${theme.isDark ? '#444' : '#f9f9f9'}`, 
                                    background: theme.cardBg,
                                    position: 'relative'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.isDark ? '#333' : '#fafafa'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = theme.isDark ? theme.cardBg : 'white'}
                            >
                                <td onClick={() => handleEditCard(card)} style={{ padding: '15px 10px', fontWeight: '600', color: theme.textColor }}>{card.topic}</td>
                                <td onClick={() => handleEditCard(card)} style={{ padding: '15px 10px', color: theme.isDark ? '#aaa' : '#424245', fontSize: '14px' }}>
                                    {card.components && card.components[0]}
                                </td>
                                <td style={{ padding: '15px 10px', textAlign: 'center', position: 'relative' }}>
                                    <button
                                        onClick={(e) => handleMenuClick(e, card.id)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: theme.textColor,
                                            cursor: 'pointer',
                                            fontSize: '18px',
                                            padding: '5px 10px'
                                        }}
                                    >
                                        ⋮
                                    </button>
                                    
                                    {/* 下拉菜单 */}
                                    {menuOpen === card.id && (
                                        <div style={{
                                            position: 'absolute',
                                            right: '10px',
                                            top: '40px',
                                            background: theme.cardBg,
                                            border: theme.isDark ? '1px solid #444' : '1px solid #ddd',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                            zIndex: 1000,
                                            minWidth: '150px'
                                        }}>
                                            <button
                                                onClick={(e) => handleEdit(e, card)}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 15px',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    color: theme.textColor,
                                                    textAlign: 'left',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    borderBottom: theme.isDark ? '1px solid #444' : '1px solid #f0f0f0'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = theme.isDark ? '#333' : '#f5f5f5'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                ✏️ Re-edit
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(e, card.id)}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 15px',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    color: '#ff3b30',
                                                    textAlign: 'left',
                                                    cursor: 'pointer',
                                                    fontSize: '14px'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = theme.isDark ? '#333' : '#f5f5f5'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {filteredCards.length === 0 && <p style={{color: '#888', marginTop: '30px'}}>当前分类下没有卡片。</p>}
        </div>
    );
};

// 主组件
function KnowledgeBasePage({ handleReturnToInterview }) {
    const theme = useSystemTheme();
    
    // 🔥 从 localStorage 读取数据，如果没有则使用初始值
    const [categories, setCategories] = useState(() => {
        const saved = localStorage.getItem('knowledgebase_categories');
        return saved ? JSON.parse(saved) : initialCategories;
    });
    
    const [cards, setCards] = useState(() => {
        const saved = localStorage.getItem('knowledgebase_cards');
        return saved ? JSON.parse(saved) : initialMockCards;
    });
    
    const [activeCategory, setActiveCategory] = useState(() => {
        const saved = localStorage.getItem('knowledgebase_activeCategory');
        return saved || null;
    });
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState(null); 
    const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
    const [creationKey, setCreationKey] = useState(0);
    
    // 🔥 监听 categories 变化，自动保存到 localStorage
    useEffect(() => {
        localStorage.setItem('knowledgebase_categories', JSON.stringify(categories));
    }, [categories]);
    
    // 🔥 监听 cards 变化，自动保存到 localStorage
    useEffect(() => {
        localStorage.setItem('knowledgebase_cards', JSON.stringify(cards));
    }, [cards]);
    
    // 🔥 监听 activeCategory 变化，自动保存到 localStorage
    useEffect(() => {
        if (activeCategory) {
            localStorage.setItem('knowledgebase_activeCategory', activeCategory);
        }
    }, [activeCategory]);

    const filteredCards = activeCategory
        ? cards.filter(card => card.category === activeCategory)
        : [];

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

    const handleDeleteCard = (cardId) => {
        setCards(prevCards => prevCards.filter(card => card.id !== cardId));
    };

    const handleDeleteCategory = (catId) => {
        // 删除分类
        setCategories(prevCategories => prevCategories.filter(cat => cat.id !== catId));
        // 删除该分类下的所有卡片
        setCards(prevCards => prevCards.filter(card => card.category !== catId));
        // 如果删除的是当前选中的分类，清空选中状态
        if (activeCategory === catId) {
            setActiveCategory(null);
        }
    };

    const handleRenameCategory = (catId, newName) => {
        const newId = newName.toLowerCase().replace(/\s/g, '_');
        
        // 检查新名称是否已存在
        if (newId !== catId && categories.find(c => c.id === newId)) {
            alert(`分类 "${newName}" 已存在！`);
            return;
        }
        
        // 更新分类名称和ID
        setCategories(prevCategories => 
            prevCategories.map(cat => 
                cat.id === catId ? { id: newId, name: newName } : cat
            )
        );
        
        // 更新该分类下所有卡片的 category 字段
        setCards(prevCards => 
            prevCards.map(card => 
                card.category === catId ? { ...card, category: newId } : card
            )
        );
        
        // 如果重命名的是当前选中的分类，更新 activeCategory
        if (activeCategory === catId) {
            setActiveCategory(newId);
        }
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
                onDeleteCategory={handleDeleteCategory}
                onRenameCategory={handleRenameCategory}
            />
            
            <TableView 
                theme={theme}
                filteredCards={filteredCards}
                categories={categories}
                activeCategory={activeCategory}
                handleEditCard={handleEditCard}
                handleCreateClick={handleCreateClick}
                onDeleteCard={handleDeleteCard}
            />
            
            <CardEditorModal 
                theme={theme}
                key={editingCard ? editingCard.id : creationKey}
                cardData={editingCard}
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