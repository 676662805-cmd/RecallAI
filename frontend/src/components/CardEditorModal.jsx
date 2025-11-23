import React, { useState } from 'react';

// CardEditorModal Component (用于创建和编辑卡片的模态框)
// 🔥 1. 接收 theme prop
const CardEditorModal = ({ theme, cardData, isOpen, onClose, onSave, fixedCategory }) => {
    
    // 关键修复：移除 useEffect，使用 props 进行状态初始化
    const isEditing = cardData !== null;
    
    // 2. 状态初始化：只保留 title 和 components (category 状态已移除)
    const [title, setTitle] = useState(isEditing ? cardData.topic || '' : '');
    const [components, setComponents] = useState(isEditing ? (Array.isArray(cardData.components) ? cardData.components.join('\n') : cardData.components || '') : '');
    // ⚠️ 状态 [category, setCategory] 已移除
    const [tags] = useState(''); 

    

    if (!isOpen) return null; // 如果不打开，则不渲染任何东西

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const newCard = {
            id: cardData ? cardData.id : Date.now(), 
            topic: title,
            components: components.split('\n').filter(line => line.trim() !== ''), 
            // 🔥 3. 关键修正：直接使用 fixedCategory prop 作为新卡片的分类
            category: fixedCategory, 
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''), 
            status: 'ready',
        };

        onSave(newCard); 
        onClose();     
    };

    // 样式定义 (全部替换为动态主题变量)
    const inputStyle = { 
        width: '100%', padding: '10px 12px', borderRadius: '8px', 
        border: `1px solid ${theme.isDark ? '#555' : '#dcdcdc'}`, // 🔥 动态边框
        fontSize: '15px', boxSizing: 'border-box', 
        backgroundColor: theme.inputBg, // 🔥 动态输入框背景
        color: theme.inputTextColor // 🔥 动态输入框文字颜色
    };
    
    const labelStyle = { display: 'block', fontSize: '14px', fontWeight: '600', color: theme.textColor, marginBottom: '8px' }; // 🔥 动态标签文字
    const buttonStyle = { padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '600' };
    const titleStyle = { fontSize: '24px', fontWeight: '700', marginBottom: '25px', color: theme.textColor };

    // 模态框覆盖层样式
    const modalOverlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.4)', // 🔥 动态暗色覆盖层
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
                <h2 style={titleStyle}>{cardData ? '编辑卡片' : '新建卡片'}</h2> 
                
                <form onSubmit={handleSubmit}>
                    
                    {/* Title Input */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={labelStyle}>标题 (Title)</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} />
                    </div>
                    
                    {/* Component Textarea */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={labelStyle}>内容 (Component)</label>
                        <textarea value={components} onChange={(e) => setComponents(e.target.value)} rows="10" required style={{ ...inputStyle, resize: 'vertical', color: theme.inputTextColor }} />
                        <p style={{ fontSize: '12px', color: theme.isDark ? '#8e8e93' : '#8e8e93', marginTop: '5px' }}>内容分行请用回车/换行符隔开。</p>
                    </div>

                    {/* ⚠️ 分类选择框 已被移除 */}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={onClose} style={{ ...buttonStyle, background: theme.isDark ? '#555' : '#e0e0e0', color: theme.isDark ? 'white' : '#1d1d1f' }}>取消</button>
                        <button type="submit" style={{ ...buttonStyle, background: theme.accentColor, color: 'white' }}>{cardData ? '保存修改' : '创建卡片'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default CardEditorModal;