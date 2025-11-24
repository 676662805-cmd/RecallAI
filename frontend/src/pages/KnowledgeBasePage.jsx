import React, { useState, useEffect } from 'react';
import CardEditorModal from '../components/CardEditorModal'; 
import useSystemTheme from '../hooks/useSystemTheme';
import NewCategoryModal from '../components/NewCategoryModal';

// --- Data definitions (must be outside functions to avoid recreation) ---
const initialCategories = [];

const initialMockCards = [];

// External component 1: Sidebar
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
        const newName = window.prompt('Enter new category name:', currentName);
        if (newName && newName.trim() && newName.trim() !== currentName) {
            onRenameCategory(catId, newName.trim());
        }
        setMenuOpen(null);
    };

    const handleDelete = (catId) => {
        if (window.confirm('Are you sure you want to delete this category? All cards in this category will also be deleted.')) {
            onDeleteCategory(catId);
            setMenuOpen(null);
        }
    };

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = () => {
            setMenuOpen(null);
        };

        if (menuOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => {
                document.removeEventListener('click', handleClickOutside);
            };
        }
    }, [menuOpen]);

    return (
        <div style={{
            width: '280px',
            minWidth: '280px',
            maxWidth: '280px',
            background: theme.cardBg, 
            borderRight: theme.isDark ? '1px solid #444' : '1px solid #ddd', 
            height: '100vh',
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
            boxSizing: 'border-box'
        }}>
            {/* Top: Title and create category button - fixed no scroll */}
            <div style={{ 
                padding: '20px 20px 0 20px',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '600', color: theme.textColor, margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>Categories</h2>
                    <button
                        onClick={() => setIsNewCategoryModalOpen(true)} 
                        style={{
                            padding: '5px 10px', borderRadius: '6px', background: theme.accentColor, 
                            color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '18px', lineHeight: '18px',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
                        }}
                    >
                        +
                    </button>
                </div>
            </div>
            
            {/* Middle: Category list - scrollable area */}
            <div style={{ 
                flexGrow: 1, 
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '0 20px',
                boxSizing: 'border-box'
            }}>
                {/* Fixed Favorites category - always at top, cannot be deleted */}
                <div 
                    key="favorites"
                    style={{ 
                        position: 'relative',
                        width: '100%',
                        boxSizing: 'border-box',
                        marginBottom: '15px'
                    }}
                >
                    <div
                        onClick={() => setActiveCategory('_favorites')}
                        style={{
                            padding: '10px 15px', 
                            margin: '5px 0', 
                            borderRadius: '8px', 
                            cursor: 'pointer', 
                            fontSize: '15px',
                            color: activeCategory === '_favorites' ? '#007AFF' : theme.textColor,
                            backgroundColor: 'transparent',
                            fontWeight: '400',
                            transition: 'background-color 0.2s, color 0.2s',
                            textAlign: 'left',
                            userSelect: 'none',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.isDark ? '#333' : '#f0f0f5'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <span style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>Favorites</span>
                    </div>
                    {/* Divider line below Favorites */}
                    <div style={{
                        height: '1px',
                        background: theme.isDark ? '#555' : '#e0e0e0',
                        margin: '12px 0',
                        width: '100%'
                    }} />
                </div>

                {/* Regular category list */}
                {categories.map(cat => (
                    <div 
                        key={cat.id}
                        style={{ 
                            position: 'relative',
                            width: '100%',
                            boxSizing: 'border-box',
                            marginBottom: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <div
                            onClick={() => setActiveCategory(cat.id)}
                            style={{
                                padding: '9px 15px', 
                                margin: '0', 
                                borderRadius: '8px', 
                                cursor: 'pointer', 
                                fontSize: '15px',
                                color: cat.id === activeCategory ? '#007AFF' : theme.textColor,
                                backgroundColor: 'transparent',
                                fontWeight: '400',
                                transition: 'background-color 0.2s, color 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                flex: 1,
                                boxSizing: 'border-box',
                                minWidth: 0
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.isDark ? '#333' : '#f0f0f5'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <span 
                                style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
                                }}
                            >{cat.name}</span>
                        </div>
                        <button
                            onClick={(e) => handleMenuClick(e, cat.id)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: theme.textColor,
                                cursor: 'pointer',
                                fontSize: '18px',
                                padding: '0 5px',
                                lineHeight: '1',
                                flexShrink: 0,
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
                            }}
                        >
                            ⋮
                        </button>
                        
                        {/* Dropdown menu */}
                        {menuOpen === cat.id && (
                            <div style={{
                                position: 'absolute',
                                right: '5px',
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
                                        borderBottom: theme.isDark ? '1px solid #444' : '1px solid #f0f0f0',
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
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
                                        color: theme.textColor,
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
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
            
            {/* Bottom: Action buttons - return button only */}
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
                    Back to Interview
                </button>
            </div>
        </div>
    );
};

// External component 2: TableView - grid card layout (Goodnotes style)
const TableView = ({ theme, filteredCards, categories, activeCategory, handleEditCard, handleCreateClick, onDeleteCard, onToggleFavorite }) => {
    
    // 🔥 Calculate current category name
    const activeCategoryName = activeCategory === '_favorites'
        ? 'Favorites'
        : activeCategory 
        ? categories.find(cat => cat.id === activeCategory)?.name || 'Unknown Category'
        : '';

    const handleDelete = (e, cardId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this card?')) {
            onDeleteCard(cardId);
        }
    };
    
    return (
        <div 
            style={{ 
                padding: '30px 40px', 
                flexGrow: 1, 
                overflowY: 'auto', 
                background: theme.bgColor,
                height: '100vh'
            }}
        > 
            {/* Title bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '700', color: theme.textColor, margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>
                    {!activeCategory 
                        ? 'Welcome to Your Knowledge Base' 
                        : activeCategoryName
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
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        + New Card
                    </button>
                )}
            </div>
        
            {/* Grid card layout */}
            {filteredCards.length > 0 ? (
                <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '20px',
                    marginBottom: '30px'
                }}>
                    {filteredCards.map(card => (
                        <div 
                            key={card.id}
                            style={{
                                position: 'relative',
                                background: theme.cardBg,
                                borderRadius: '12px',
                                padding: '20px',
                                boxShadow: theme.isDark 
                                    ? '0 2px 8px rgba(0,0,0,0.3)' 
                                    : '0 2px 8px rgba(0,0,0,0.08)',
                                border: theme.isDark ? '1px solid #444' : '1px solid #e0e0e0',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                height: '200px',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'visible'
                            }}
                            onClick={() => handleEditCard(card)}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-8px)';
                                e.currentTarget.style.boxShadow = theme.isDark 
                                    ? '0 8px 20px rgba(0,0,0,0.4)' 
                                    : '0 8px 20px rgba(0,0,0,0.15)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = theme.isDark 
                                    ? '0 2px 8px rgba(0,0,0,0.3)' 
                                    : '0 2px 8px rgba(0,0,0,0.08)';
                            }}
                        >
                            {/* Card title */}
                            <h3 style={{
                                fontSize: '17px',
                                fontWeight: '700',
                                color: theme.textColor,
                                margin: '0 0 12px 0',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
                            }}>
                                {card.topic}
                            </h3>

                            {/* Card content summary */}
                            <div style={{
                                position: 'relative',
                                flexGrow: 1,
                                overflow: 'hidden',
                                maxHeight: '112px' // 5 lines * 22.4px (14px * 1.6)
                            }}>
                                <p style={{
                                    fontSize: '14px',
                                    color: theme.isDark ? '#aaa' : '#666',
                                    margin: 0,
                                    lineHeight: '1.6',
                                    overflow: 'hidden',
                                    wordWrap: 'break-word',
                                    wordBreak: 'break-word',
                                    whiteSpace: 'pre-wrap',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
                                }}>
                                    {card.components && card.components.join('\n')}
                                </p>
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    width: '80px',
                                    height: '22px',
                                    background: theme.isDark 
                                        ? 'linear-gradient(to right, transparent, #2c2c2e 50%)' 
                                        : 'linear-gradient(to right, transparent, white 50%)',
                                    pointerEvents: 'none'
                                }} />
                            </div>

                            {/* Star and delete buttons */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: '12px',
                                paddingTop: '12px',
                                borderTop: theme.isDark ? '1px solid #444' : '1px solid #f0f0f0'
                            }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleFavorite(card.id);
                                    }}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        fontSize: '16px',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        transition: 'transform 0.2s, color 0.2s',
                                        color: card.isFavorite ? '#FFD700' : 'inherit'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                    title={card.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                    {card.isFavorite ? '★' : '☆'}
                                </button>
                                
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(e, card.id);
                                    }}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        fontSize: '18px',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        color: '#ff3b30',
                                        transition: 'transform 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                    title="Delete card"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p style={{color: '#888', marginTop: '30px', fontSize: '15px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'}}>
                    {activeCategory ? 'No cards in this category.' : 'Select a category to view cards.'}
                </p>
            )}
        </div>
    );
};

// Main component
function KnowledgeBasePage({ handleReturnToInterview }) {
    const theme = useSystemTheme();
    
    // 🔥 Read data from localStorage, use initial values if not available
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
    
    // 🔥 Load cards from backend only on first use (if localStorage doesn't exist at all)
    useEffect(() => {
        const loadFromBackend = async () => {
            const localCards = localStorage.getItem('knowledgebase_cards');
            // 只在 localStorage 完全不存在时才加载，而不是为空时
            if (localCards === null) {
                try {
                    const response = await fetch('http://127.0.0.1:8000/api/cards');
                    if (response.ok) {
                        const data = await response.json();
                        if (data.cards && data.cards.length > 0) {
                            // 转换后端格式到前端格式
                            const frontendCards = data.cards.map(card => ({
                                id: card.id,
                                topic: card.topic,
                                components: card.content.split('\n'),
                                category: 'interview',
                                isFavorite: false
                            }));
                            setCards(frontendCards);
                            console.log('✅ Loaded cards from backend');
                        }
                    }
                } catch (err) {
                    console.log('⚠️ Could not load cards from backend:', err);
                }
            }
        };
        loadFromBackend();
    }, []);
    
    // 🔥 Listen to categories changes, auto save to localStorage
    useEffect(() => {
        localStorage.setItem('knowledgebase_categories', JSON.stringify(categories));
    }, [categories]);
    
    // 🔥 Listen to cards changes, auto save to localStorage and sync to backend
    useEffect(() => {
        localStorage.setItem('knowledgebase_cards', JSON.stringify(cards));
        
        // 同步到后端（包括空数组，这样删除操作也会同步）
        const syncToBackend = async () => {
            try {
                await fetch('http://127.0.0.1:8000/api/cards', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cards })
                });
                console.log(`✅ Cards synced to backend (${cards.length} cards)`);
            } catch (err) {
                console.log('⚠️ Could not sync cards to backend:', err);
            }
        };
        
        // 总是同步，即使是空数组
        syncToBackend();
    }, [cards]);
    
    // 🔥 Listen to activeCategory changes, auto save to localStorage
    useEffect(() => {
        if (activeCategory) {
            localStorage.setItem('knowledgebase_activeCategory', activeCategory);
        }
    }, [activeCategory]);

    const filteredCards = activeCategory === '_favorites'
        ? cards.filter(card => card.isFavorite === true)
        : activeCategory
        ? cards.filter(card => card.category === activeCategory)
        : [];

    const handleSaveCard = (newCard) => {
        if (editingCard) {
            // Edit mode: replace old card
            setCards(prevCards => prevCards.map(card => 
                card.id === newCard.id ? newCard : card
            ));
            setEditingCard(null); // Clear edit state
        } else {
            // Create mode: add new card
            setCards(prevCards => [newCard, ...prevCards]);
        }
        
        // ⚠️ Important: Only close the modal here.
        // Never add setActiveCategory('all') or other activeCategory modifications.
        setIsModalOpen(false); 
    };
    
    const handleCreateCategory = (name) => {
        const newId = name.toLowerCase().replace(/\s/g, '_');
        const newCat = { id: newId, name: name };
        
        if (!categories.find(c => c.id === newId)) {
            setCategories([...categories, newCat]);
            setActiveCategory(newId);
        } else {
            alert(`Category "${name}" already exists!`);
        }
        setIsNewCategoryModalOpen(false);
    };
    
    const handleCreateClick = () => {
        setEditingCard(null); 
        setIsModalOpen(true);
        setCreationKey(prev => prev + 1); // 🔥 Key fix: Force key update on each create
    };

    const handleEditCard = (card) => {
        setEditingCard(card);
        setIsModalOpen(true);
    };

    const handleDeleteCard = (cardId) => {
        setCards(prevCards => prevCards.filter(card => card.id !== cardId));
    };

    const handleToggleFavorite = (cardId) => {
        setCards(prevCards =>
            prevCards.map(card =>
                card.id === cardId 
                    ? { ...card, isFavorite: !card.isFavorite }
                    : card
            )
        );
    };

    const handleDeleteCategory = (catId) => {
        // Delete category
        setCategories(prevCategories => prevCategories.filter(cat => cat.id !== catId));
        // Delete all cards in this category
        setCards(prevCards => prevCards.filter(card => card.category !== catId));
        // Clear selection if deleting currently selected category
        if (activeCategory === catId) {
            setActiveCategory(null);
        }
    };

    const handleRenameCategory = (catId, newName) => {
        const newId = newName.toLowerCase().replace(/\s/g, '_');
        
        // Check if new name already exists
        if (newId !== catId && categories.find(c => c.id === newId)) {
            alert(`Category "${newName}" already exists!`);
            return;
        }
        
        // Update category name and ID
        setCategories(prevCategories => 
            prevCategories.map(cat => 
                cat.id === catId ? { id: newId, name: newName } : cat
            )
        );
        
        // Update category field for all cards in this category
        setCards(prevCards => 
            prevCards.map(card => 
                card.category === catId ? { ...card, category: newId } : card
            )
        );
        
        // Update activeCategory if renaming selected category
        if (activeCategory === catId) {
            setActiveCategory(newId);
        }
    };

    return (
        <div style={{ 
            display: 'flex', 
            height: '100vh', // 🔥 Point 3: Fixed height for parent
            background: theme.bgColor,
            overflow: 'hidden' // 🔥 Point 4: Prevent parent scrolling
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
                onToggleFavorite={handleToggleFavorite}
            />
            
            <CardEditorModal 
                theme={theme}
                key={editingCard ? editingCard.id : creationKey}
                cardData={editingCard}
                // 🔥 Key fix: Pass currently selected category as fixed value
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