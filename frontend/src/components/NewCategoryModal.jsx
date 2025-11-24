import React, { useState } from 'react';

// 🔥 Note: All external style definitions removed, now defined inside component

// CardEditorModal Component (用于创建和编辑卡片的模态框)
const NewCategoryModal = ({ theme, isOpen, onClose, onCreate }) => { // 🔥 1. 接收 theme prop
    const [name, setName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name.trim());
            setName(''); // Reset input field
        }
    };

    // --- 2. 样式定义 (已替换为动态主题变量，并移到内部) ---
    const modalOverlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.4)', // 🔥 Dynamic dark overlay
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 1050,
    };
    const modalContentStyle = {
        width: '350px', padding: '25px', 
        backgroundColor: theme.cardBg, // 🔥 Dynamic card background
        borderRadius: '15px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    };
    const titleStyle = { 
        fontSize: '20px', fontWeight: '600', marginBottom: '20px', 
        color: theme.textColor // 🔥 Dynamic text color
    };
    const inputStyle = { 
        width: '100%', padding: '10px 12px', borderRadius: '8px', 
        border: `1px solid ${theme.isDark ? '#555' : '#dcdcdc'}`, // 🔥 Dynamic border
        fontSize: '15px', boxSizing: 'border-box', marginBottom: '15px',
        backgroundColor: theme.inputBg, // 🔥 Dynamic input background
        color: theme.inputTextColor, // 🔥 Dynamic input text color
    };
    
    // Dynamic button style function
    const buttonStyle = (type) => ({ 
        padding: '10px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '600',
        background: type === 'submit' ? theme.accentColor : (theme.isDark ? '#555' : '#e0e0e0'),
        color: type === 'submit' ? 'white' : theme.inputTextColor,
    });


    return (
        <div style={modalOverlayStyle}>
            <div className="apple-card" style={modalContentStyle}>
                <h2 style={titleStyle}>Create New Category</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Enter category name..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        title="Please enter a category name"
                        style={inputStyle} // 🔥 Use dynamic style
                        autoFocus 
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={onClose} style={buttonStyle('cancel')}>Cancel</button>
                        <button type="submit" style={buttonStyle('submit')}>Create</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewCategoryModal;