import React, { useState } from 'react';

// 简短 ID 生成器：使用前缀 + 计数器
let cardCounter = 1;

// 初始化计数器（从 localStorage 读取已有的最大编号）
if (typeof window !== 'undefined') {
    const savedCards = localStorage.getItem('knowledgebase_cards');
    if (savedCards) {
        try {
            const cards = JSON.parse(savedCards);
            const maxId = cards.reduce((max, card) => {
                if (typeof card.id === 'string' && card.id.startsWith('card_')) {
                    const num = parseInt(card.id.replace('card_', ''));
                    return Math.max(max, num);
                }
                return max;
            }, 0);
            cardCounter = maxId + 1;
        } catch {
            // 忽略解析错误
        }
    }
}

const generateCardId = () => {
    return `card_${cardCounter++}`;
};

// CardEditorModal Component (Modal for creating and editing cards)
// 🔥 1. Receive theme prop
const CardEditorModal = ({ theme, cardData, isOpen, onClose, onSave, fixedCategory }) => {
    
    // Key fix: Remove useEffect, use props for state initialization
    const isEditing = cardData !== null;
    
    // 2. State initialization: Only keep title and components (category state removed)
    const [title, setTitle] = useState(isEditing ? cardData.topic || '' : '');
    const [components, setComponents] = useState(isEditing ? (Array.isArray(cardData.components) ? cardData.components.join('\n') : cardData.components || '') : '');
    // ⚠️ State [category, setCategory] removed
    const [tags] = useState(''); 

    

    if (!isOpen) return null; // If not open, don't render anything

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const newCard = {
            id: cardData ? cardData.id : generateCardId(), 
            topic: title,
            components: components.split('\n').filter(line => line.trim() !== ''), 
            // 🔥 3. Key fix: Use fixedCategory prop directly as new card's category
            category: fixedCategory, 
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''), 
            status: 'ready',
        };

        onSave(newCard); 
        onClose();     
    };

    // Style definitions (all replaced with dynamic theme variables)
    const inputStyle = { 
        width: '100%', padding: '10px 12px', borderRadius: '8px', 
        border: `1px solid ${theme.isDark ? '#555' : '#dcdcdc'}`, // 🔥 Dynamic border
        fontSize: '15px', boxSizing: 'border-box', 
        backgroundColor: theme.inputBg, // 🔥 Dynamic input background
        color: theme.inputTextColor, // 🔥 Dynamic input text color
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
    };
    
    const labelStyle = { display: 'block', fontSize: '14px', fontWeight: '600', color: theme.textColor, marginBottom: '8px' }; // 🔥 Dynamic label text
    const buttonStyle = { padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '600' };
    const titleStyle = { fontSize: '24px', fontWeight: '700', marginBottom: '25px', color: theme.textColor };

    // Modal overlay style
    const modalOverlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.4)', // 🔥 Dynamic dark overlay
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
    };

    const modalContentStyle = {
        width: '600px', padding: '30px', 
        backgroundColor: theme.cardBg, 
        borderRadius: '15px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        maxHeight: '80vh', overflowY: 'auto',
    };

    return (
        <div style={modalOverlayStyle}>
            <div className="apple-card" style={modalContentStyle}>
                <h2 style={titleStyle}>{cardData ? 'Edit Card' : 'Create New Card'}</h2> 
                
                <form onSubmit={handleSubmit}>
                    
                    {/* Title Input */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={labelStyle}>Title</label>
                        <input 
                            type="text" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            placeholder="Enter card title" 
                            required 
                            onInvalid={(e) => {
                                e.target.setCustomValidity('Please enter a Card Title');
                            }}
                            onInput={(e) => {
                                e.target.setCustomValidity('');
                            }}
                            style={inputStyle} 
                        />
                    </div>
                    
                    {/* Component Textarea */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={labelStyle}>Content</label>
                        <textarea 
                            value={components} 
                            onChange={(e) => setComponents(e.target.value)} 
                            placeholder="Enter card content (one line per item)" 
                            rows="10" 
                            required 
                            onInvalid={(e) => {
                                e.target.setCustomValidity('Please enter Card Content');
                            }}
                            onInput={(e) => {
                                e.target.setCustomValidity('');
                            }}
                            style={{ 
                                ...inputStyle, 
                                resize: 'none', 
                                color: theme.inputTextColor,
                                scrollbarWidth: 'thin',
                                scrollbarColor: theme.isDark ? '#555 #2c2c2e' : '#ccc #f5f5f5',
                                overflow: 'auto',
                                boxSizing: 'border-box'
                            }} 
                        />
                        <p style={{ fontSize: '12px', color: theme.isDark ? '#8e8e93' : '#8e8e93', marginTop: '5px' }}>Break content into multiple lines using line breaks.</p>
                    </div>

                    {/* ⚠️ Category selection removed */}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={onClose} style={{ ...buttonStyle, background: theme.isDark ? '#555' : '#e0e0e0', color: theme.isDark ? 'white' : '#1d1d1f' }}>Cancel</button>
                        <button type="submit" style={{ ...buttonStyle, background: theme.accentColor, color: 'white' }}>{cardData ? 'Save Changes' : 'Create Card'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default CardEditorModal;